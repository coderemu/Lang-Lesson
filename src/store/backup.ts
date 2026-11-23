import { STORE_VERSION, migrate, type ProgressData } from "./index";

export interface Backup {
  app: "lang-lessons";
  version: number;
  savedAt: string;
  data: ProgressData;
}

export function makeBackup(data: ProgressData, now: Date = new Date()): Backup {
  return { app: "lang-lessons", version: STORE_VERSION, savedAt: now.toISOString(), data };
}

export const backupFileName = (now: Date = new Date()): string =>
  `lang-lessons-backup-${now.toISOString().slice(0, 10)}.json`;

export interface BackupSummary {
  lessonsDone: number;
  rules: number;
  lastDate: string | null;
  savedAt: string;
}

export type ParseResult =
  { ok: true; data: ProgressData; summary: BackupSummary } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Read a backup file. A bad file returns an error and changes nothing (FR-86). */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not a backup. It cannot be read." };
  }
  if (!isRecord(json) || json.app !== "lang-lessons" || !isRecord(json.data)) {
    return { ok: false, error: "This file is not a Lang Lessons backup." };
  }
  if (typeof json.version !== "number" || json.version > STORE_VERSION) {
    return {
      ok: false,
      error: "This backup comes from a newer version of the app. Update the app first.",
    };
  }
  const d = json.data;
  if (!isRecord(d.lessons) || !isRecord(d.banks) || !isRecord(d.rules)) {
    return { ok: false, error: "The backup is damaged. Some progress data is missing." };
  }
  const data = migrate(d, json.version);
  const dates = Object.values(data.lessons)
    .map((l) => l.lastDate)
    .filter(Boolean)
    .sort();
  return {
    ok: true,
    data,
    summary: {
      lessonsDone: Object.values(data.lessons).filter((l) => l.state === "complete").length,
      rules: Object.keys(data.rules).length,
      lastDate: dates.length ? dates[dates.length - 1] : null,
      savedAt: typeof json.savedAt === "string" ? json.savedAt : "",
    },
  };
}

export { dataOf } from "./index";
