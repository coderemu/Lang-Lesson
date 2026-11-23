import { beforeEach, describe, expect, it } from "vitest";
import { backupFileName, dataOf, makeBackup, parseBackup } from "./backup";
import {
  STORE_VERSION,
  bankCounts,
  emptyData,
  lessonState,
  localDate,
  migrate,
  useProgress,
  weekSeconds,
  weekdayIndex,
} from "./index";

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().reset();
});

describe("progress actions", () => {
  it("saves position and completes a lesson with its rules", () => {
    const s = useProgress.getState();
    s.startLesson("1.2");
    s.setScreen("1.2", 3);
    s.completeScreen("1.2", "1.2.01");
    s.completeScreen("1.2", "1.2.01");
    s.recordAttempt("1.2", "1.2.01");
    expect(useProgress.getState().lessons["1.2"]).toMatchObject({
      screen: 3,
      screensDone: ["1.2.01"],
      attempts: { "1.2.01": 1 },
    });
    s.completeLesson("1.2", ["N2", "N4"]);
    const after = useProgress.getState();
    expect(after.lessons["1.2"].state).toBe("complete");
    expect(Object.keys(after.rules)).toEqual(["N2", "N4"]);
  });
  it("tracks bank problems, position and minutes", () => {
    const s = useProgress.getState();
    s.setProblem("1.2", "b1.2.06", "not-yet");
    s.setProblem("1.2", "b1.2.06", "correct");
    s.setProblem("1.2", "b1.2.07", "not-yet");
    s.setBankPosition("1.2", 4);
    s.addSeconds(90);
    const st = useProgress.getState();
    expect(st.banks["1.2"].problems["b1.2.06"]).toEqual({ state: "correct", attempts: 2 });
    expect(bankCounts(st, "1.2")).toEqual({ correct: 1, notYet: 1 });
    expect(st.banks["1.2"].position).toBe(4);
    expect(weekSeconds(st)[weekdayIndex()]).toBe(90);
    expect(st.seconds[localDate()]).toBe(90);
  });
  it("persists under lang-lessons/v1 with a version", () => {
    useProgress.getState().startLesson("1.1");
    const raw = JSON.parse(localStorage.getItem("lang-lessons/v1") ?? "{}");
    expect(raw.version).toBe(STORE_VERSION);
    expect(raw.state.lessons["1.1"]).toBeDefined();
  });
});

describe("lessonState (FR-02, FR-03)", () => {
  const ids = ["1.1", "1.2", "1.3"];
  it("opens the first lesson and locks the rest until the previous is complete", () => {
    const d = emptyData();
    expect(lessonState(d, ids, "1.1")).toBe("open");
    expect(lessonState(d, ids, "1.2")).toBe("locked");
    d.lessons["1.1"] = {
      state: "complete",
      screen: 0,
      screensDone: [],
      attempts: {},
      lastDate: "",
    };
    expect(lessonState(d, ids, "1.1")).toBe("complete");
    expect(lessonState(d, ids, "1.2")).toBe("open");
    d.lessons["1.2"] = {
      state: "in-progress",
      screen: 3,
      screensDone: [],
      attempts: {},
      lastDate: "",
    };
    expect(lessonState(d, ids, "1.2")).toBe("in-progress");
  });
  it("unlock all opens everything", () => {
    const d = emptyData();
    d.settings.unlockAll = true;
    expect(lessonState(d, ids, "1.3")).toBe("open");
  });
});

describe("migrate", () => {
  it("fills defaults and tolerates junk", () => {
    expect(migrate(null, 0)).toEqual(emptyData());
    expect(migrate({ rules: { N1: "2026-11-07" } }, 1).rules).toEqual({ N1: "2026-11-07" });
  });
});

describe("backup and restore", () => {
  it("round trip gives the same data", () => {
    const s = useProgress.getState();
    s.startLesson("1.1");
    s.completeLesson("1.1", ["N1"]);
    s.setProblem("1.2", "b1.2.06", "correct");
    s.setUnlockAll(true);
    const before = dataOf(useProgress.getState());
    const text = JSON.stringify(makeBackup(before, new Date("2026-11-07T10:00:00Z")));
    useProgress.getState().reset();
    expect(Object.keys(useProgress.getState().lessons)).toHaveLength(0);
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.summary.lessonsDone).toBe(1);
    expect(parsed.summary.rules).toBe(1);
    useProgress.getState().replaceData(parsed.data);
    expect(dataOf(useProgress.getState())).toEqual(before);
  });
  it("names the file with the date", () => {
    expect(backupFileName(new Date("2026-11-07T10:00:00Z"))).toBe(
      "lang-lessons-backup-2026-11-07.json",
    );
  });
  it("drops damaged lesson and bank entries instead of crashing later", () => {
    const text = JSON.stringify({
      app: "lang-lessons",
      version: 1,
      data: {
        lessons: { "1.1": { state: "complete" }, "1.2": { ...emptyData().lessons, state: "x" } },
        banks: { "1.1": { problems: { a: { state: "correct" } }, position: 0 } },
        rules: {},
      },
    });
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.lessons).toEqual({});
      expect(r.data.banks).toEqual({});
    }
  });
  it("rejects bad files and changes nothing", () => {
    useProgress.getState().startLesson("1.1");
    const before = dataOf(useProgress.getState());
    for (const bad of [
      "not json",
      "[]",
      JSON.stringify({ app: "other", version: 1, data: {} }),
      JSON.stringify({ app: "lang-lessons", version: 99, data: emptyData() }),
      JSON.stringify({ app: "lang-lessons", version: 1, data: { lessons: {} } }),
    ]) {
      const r = parseBackup(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.length).toBeGreaterThan(5);
    }
    expect(dataOf(useProgress.getState())).toEqual(before);
  });
});
