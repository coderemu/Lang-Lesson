import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const STORE_KEY = "lang-lessons/v1";
export const STORE_VERSION = 1;

export interface LessonProgress {
  state: "in-progress" | "complete";
  /** 0-based index of the screen to open. */
  screen: number;
  screensDone: string[];
  /** Number of screens, saved when the lesson opens. */
  total?: number;
  attempts: Record<string, number>;
  lastDate: string;
}

export interface BankProblemProgress {
  state: "correct" | "not-yet";
  attempts: number;
}

export interface BankProgress {
  problems: Record<string, BankProblemProgress>;
  /** 0-based index of the last problem opened. */
  position: number;
}

/** The part of the store that is data (saved, backed up, restored). */
export interface ProgressData {
  lessons: Record<string, LessonProgress>;
  banks: Record<string, BankProgress>;
  /** rule id -> date earned (YYYY-MM-DD) */
  rules: Record<string, string>;
  /** local date (YYYY-MM-DD) -> active seconds */
  seconds: Record<string, number>;
  settings: { unlockAll: boolean };
  persistAsked: boolean;
}

export const emptyData = (): ProgressData => ({
  lessons: {},
  banks: {},
  rules: {},
  seconds: {},
  settings: { unlockAll: false },
  persistAsked: false,
});

export interface ProgressActions {
  startLesson: (id: string, total?: number) => void;
  setScreen: (id: string, screen: number) => void;
  completeScreen: (id: string, screenId: string) => void;
  recordAttempt: (id: string, screenId: string) => void;
  completeLesson: (id: string, rules: string[]) => void;
  setProblem: (lessonId: string, problemId: string, state: "correct" | "not-yet") => void;
  setBankPosition: (lessonId: string, position: number) => void;
  addSeconds: (seconds: number) => void;
  setUnlockAll: (value: boolean) => void;
  replaceData: (data: ProgressData) => void;
  reset: () => void;
  markPersistAsked: () => void;
}

export type ProgressStore = ProgressData & ProgressActions;

export const localDate = (d: Date = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Keep only the entries of a record that pass `ok`. A damaged entry would crash the screens that read it. */
function keepValid<T>(rec: unknown, ok: (v: unknown) => boolean): Record<string, T> {
  return Object.fromEntries(
    Object.entries(isObj(rec) ? rec : {}).filter(([, v]) => ok(v)),
  ) as Record<string, T>;
}

const validLesson = (v: unknown): boolean =>
  isObj(v) &&
  (v.state === "in-progress" || v.state === "complete") &&
  typeof v.screen === "number" &&
  Array.isArray(v.screensDone) &&
  isObj(v.attempts) &&
  typeof v.lastDate === "string";

const validBank = (v: unknown): boolean =>
  isObj(v) &&
  typeof v.position === "number" &&
  isObj(v.problems) &&
  Object.values(v.problems).every(
    (p) =>
      isObj(p) &&
      (p.state === "correct" || p.state === "not-yet") &&
      typeof p.attempts === "number",
  );

/** Upgrade saved data from an older version. Version 1 is the first. */
export function migrate(persisted: unknown, version: number): ProgressData {
  const base = emptyData();
  if (!persisted || typeof persisted !== "object") return base;
  const old = persisted as Partial<ProgressData>;
  // Future: switch (version) { case 1: ... }. Unknown fields are dropped, missing ones get defaults.
  void version;
  return {
    lessons: keepValid(old.lessons, validLesson),
    banks: keepValid(old.banks, validBank),
    rules: keepValid(old.rules, (v) => typeof v === "string"),
    seconds: keepValid(old.seconds, (v) => typeof v === "number"),
    settings: { ...base.settings, ...(old.settings ?? {}) },
    persistAsked: old.persistAsked ?? false,
  };
}

const blankLesson = (): LessonProgress => ({
  state: "in-progress",
  screen: 0,
  screensDone: [],
  attempts: {},
  lastDate: localDate(),
});

export const useProgress = create<ProgressStore>()(
  persist(
    (set) => ({
      ...emptyData(),
      startLesson: (id, total) =>
        set((s) => {
          const cur = s.lessons[id];
          if (cur)
            return cur.total === total || total === undefined
              ? s
              : { lessons: { ...s.lessons, [id]: { ...cur, total } } };
          return { lessons: { ...s.lessons, [id]: { ...blankLesson(), total } } };
        }),
      setScreen: (id, screen) =>
        set((s) => {
          const cur = s.lessons[id] ?? blankLesson();
          return {
            lessons: { ...s.lessons, [id]: { ...cur, screen, lastDate: localDate() } },
          };
        }),
      completeScreen: (id, screenId) =>
        set((s) => {
          const cur = s.lessons[id] ?? blankLesson();
          if (cur.screensDone.includes(screenId)) return s;
          return {
            lessons: {
              ...s.lessons,
              [id]: { ...cur, screensDone: [...cur.screensDone, screenId] },
            },
          };
        }),
      recordAttempt: (id, screenId) =>
        set((s) => {
          const cur = s.lessons[id] ?? blankLesson();
          const attempts = { ...cur.attempts, [screenId]: (cur.attempts[screenId] ?? 0) + 1 };
          return { lessons: { ...s.lessons, [id]: { ...cur, attempts } } };
        }),
      completeLesson: (id, rules) =>
        set((s) => {
          const cur = s.lessons[id] ?? blankLesson();
          const today = localDate();
          const earned = { ...s.rules };
          for (const r of rules) earned[r] ??= today;
          return {
            lessons: { ...s.lessons, [id]: { ...cur, state: "complete", lastDate: today } },
            rules: earned,
          };
        }),
      setProblem: (lessonId, problemId, state) =>
        set((s) => {
          const bank = s.banks[lessonId] ?? { problems: {}, position: 0 };
          const prev = bank.problems[problemId];
          return {
            banks: {
              ...s.banks,
              [lessonId]: {
                ...bank,
                problems: {
                  ...bank.problems,
                  [problemId]: { state, attempts: (prev?.attempts ?? 0) + 1 },
                },
              },
            },
          };
        }),
      setBankPosition: (lessonId, position) =>
        set((s) => {
          const bank = s.banks[lessonId] ?? { problems: {}, position: 0 };
          return { banks: { ...s.banks, [lessonId]: { ...bank, position } } };
        }),
      addSeconds: (seconds) =>
        set((s) => {
          const key = localDate();
          return { seconds: { ...s.seconds, [key]: (s.seconds[key] ?? 0) + seconds } };
        }),
      setUnlockAll: (value) => set((s) => ({ settings: { ...s.settings, unlockAll: value } })),
      replaceData: (data) => set({ ...data }),
      reset: () => set({ ...emptyData(), persistAsked: true }),
      markPersistAsked: () => set({ persistAsked: true }),
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): ProgressData => ({
        lessons: s.lessons,
        banks: s.banks,
        rules: s.rules,
        seconds: s.seconds,
        settings: s.settings,
        persistAsked: s.persistAsked,
      }),
      migrate: (persisted, version) => migrate(persisted, version) as ProgressStore,
    },
  ),
);

/** Ask the browser for persistent storage once (FR-87). */
export async function requestPersistentStorage(): Promise<void> {
  const st = useProgress.getState();
  if (st.persistAsked) return;
  st.markPersistAsked();
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* not available: ignore */
  }
}

/* ───────── Selectors ───────── */

export type LessonState = "locked" | "open" | "in-progress" | "complete";

/** FR-02, FR-03. `exists` = the lesson has a JSON file. */
export function lessonState(data: ProgressData, ids: string[], id: string): LessonState {
  const p = data.lessons[id];
  if (p?.state === "complete") return "complete";
  if (p && (p.screen > 0 || p.screensDone.length > 0)) return "in-progress";
  const i = ids.indexOf(id);
  if (data.settings.unlockAll || i <= 0) return "open";
  return data.lessons[ids[i - 1]]?.state === "complete" ? "open" : "locked";
}

/** Index of a day in a Monday-first week: Monday = 0 … Sunday = 6. */
export const weekdayIndex = (d: Date = new Date()): number => (d.getDay() + 6) % 7;

/** Active seconds for Monday … Sunday of the week that holds `today`. */
export function weekSeconds(data: ProgressData, today: Date = new Date()): number[] {
  const monday = new Date(today);
  monday.setDate(today.getDate() - weekdayIndex(today));
  return Array.from({ length: 7 }, (_, k) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + k);
    return data.seconds[localDate(d)] ?? 0;
  });
}

export const bankCounts = (data: ProgressData, lessonId: string) => {
  const probs = data.banks[lessonId]?.problems ?? {};
  const list = Object.values(probs);
  return {
    correct: list.filter((p) => p.state === "correct").length,
    notYet: list.filter((p) => p.state === "not-yet").length,
  };
};
