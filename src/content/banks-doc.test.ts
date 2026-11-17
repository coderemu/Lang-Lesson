import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { PracticeBank } from "../../content/schema";

/**
 * Criterion 5: each bank of Chapters 1 to 3 holds every problem of practice-banks.md, with the same answer text and Lang type.
 */
const doc = readFileSync(join(process.cwd(), "docs/lesson-design/practice-banks.md"), "utf8");
const banks = Object.values(
  import.meta.glob<{ default: PracticeBank }>("../../content/practice/bank-[123].*.json", { eager: true }),
).map((m) => m.default);

const norm = (s: string) =>
  s
    .replace(/[*\\]/g, "")
    .replace(/[−–-]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[“”"]/g, "")
    .trim();

function docRows(lesson: string): { n: number; problem: string; answer: string; lang: string }[] {
  const start = doc.indexOf(`### Bank ${lesson}`);
  const next = doc.indexOf("\n### ", start + 5);
  const chapterEnd = doc.indexOf("\n## ", start + 5);
  const end = Math.min(...[next, chapterEnd].filter((x) => x > 0), doc.length);
  return doc
    .slice(start, end)
    .split("\n")
    .filter((l) => /^\| \d+ \|/.test(l))
    .map((l) => l.replace(/\\\|/g, "\u0001").split("|").slice(1, -1).map((c) => c.trim()))
    .map(([n, problem, answer, lang]) => ({ n: Number(n), problem, answer, lang }));
}

describe("banks against practice-banks.md", () => {
  for (const b of banks) {
    it(`bank ${b.lesson}: same problems, answers and Lang types`, () => {
      const rows = docRows(b.lesson);
      expect(rows.length).toBeGreaterThan(0);
      expect(b.problems.map((p) => p.n)).toEqual(rows.map((r) => r.n));
      for (const [k, r] of rows.entries()) {
        const p = b.problems[k];
        expect(norm(p.answerText), `${p.id} answer`).toBe(norm(r.answer));
        expect(norm(p.langType), `${p.id} Lang type`).toBe(norm(r.lang));
        expect(Boolean(p.stretch), `${p.id} stretch`).toBe(r.problem.startsWith("Stretch:"));
      }
    });
  }
});
