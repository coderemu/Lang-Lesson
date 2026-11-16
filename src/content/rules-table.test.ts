import { describe, expect, it } from "vitest";
import rulesJson from "../../content/rules.json";
import type { Lesson, Rule, RuleStatus } from "../../content/schema";

/**
 * Criterion 7: the rule book shows the rules of Chapter 1 with the status of the "Assumed or proved" table
 * of docs/lesson-design/lesson-design.md (rows for lessons 1.2–1.8). Each row of that table is mapped to rule ids here.
 */
const DOC: Record<string, RuleStatus> = {
  "comm-add": "assumed", "assoc-add": "assumed", N1: "assumed", N2: "assumed",
  N3: "proved", N4: "proved", N5: "proved",
  "pos-sum": "assumed", "neg-sum": "proved",
  "comm-mul": "assumed", "assoc-mul": "assumed", N6: "assumed",
  distrib: "assumed", "distrib-right": "proved", "zero-mul": "proved",
  N7: "proved", N8: "proved", N9: "left-to-reader", N10: "left-to-reader",
  N11: "shown", N12: "shown", "pow-prod": "shown",
  "sq-sum": "proved", "sq-diff": "proved", "diff-sq": "proved",
  "thm-1": "left-to-reader", "thm-2": "proved", "thm-2-cor": "proved",
  "cross-mul": "assumed", "cancel-frac": "proved", "thm-3": "proved", "rules-rational": "assumed",
  "thm-4": "proved",
  "inverse-exists": "shown", "inverse-unique": "proved", "zero-product": "proved",
  "cross-mul-proved": "proved", "cancel-mul": "proved",
};
/** Rules of Chapter 1 that the doc table does not list (they come from lesson text or exercises). */
const NOT_IN_TABLE = ["solve-sum", "cancel-add", "divides", "frac-ops"];

const rules = rulesJson.rules as Rule[];
const chapter1 = rules.filter((r) => /^1\.\d$/.test(r.lesson));
const lessons = Object.values(
  import.meta.glob<{ default: Lesson }>("../../content/lessons/lesson-1.*.json", { eager: true }),
).map((m) => m.default);

describe("rule book of Chapter 1 against the Assumed or proved table", () => {
  it("every rule of the table has the status of the table", () => {
    const wrong = Object.entries(DOC)
      .map(([id, status]) => ({ id, status, has: rules.find((r) => r.id === id)?.status }))
      .filter((x) => x.has !== x.status);
    // Theorem 1: the table says one case proved and three left to the reader; the rule book says left to the reader.
    expect(wrong).toEqual([]);
  });
  it("rules outside the table are listed", () => {
    const ids = chapter1.map((r) => r.id).filter((id) => !(id in DOC));
    expect(ids.sort()).toEqual([...NOT_IN_TABLE].sort());
  });
  it("each lesson earns exactly the rules of rules.json for that lesson, with one known difference", () => {
    // Difference found in 1E: rules.json gives cancel-add (cancellation law for addition, Lang §2 ex. 22) to lesson 1.2,
    // but lesson-1.2.json does not list it in rulesEarned. Lesson text is not changed in 1E; see qa/phase-1/ACCEPTANCE.md.
    const KNOWN: Record<string, string[]> = { "1.2": ["cancel-add"] };
    for (const l of lessons) {
      const own = chapter1.filter((r) => r.lesson === l.id).map((r) => r.id);
      const missing = own.filter((id) => !l.rulesEarned.includes(id)).sort();
      const extra = l.rulesEarned.filter((id) => !own.includes(id));
      expect(extra, `lesson ${l.id} earns rules that rules.json gives to another lesson`).toEqual([]);
      expect(missing, `lesson ${l.id}`).toEqual(KNOWN[l.id] ?? []);
    }
  });
  it("the Chapter 1 rules are 1.2 to 1.8 only", () => {
    expect(new Set(chapter1.map((r) => r.lesson))).toEqual(new Set(["1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"]));
  });
});

describe("rule book of Chapter 2 against the Assumed or proved table", () => {
  const ch2Lessons = Object.values(
    import.meta.glob<{ default: Lesson }>("../../content/lessons/lesson-2.*.json", { eager: true }),
  ).map((m) => m.default);
  it("the general solution is left to the reader (exercise 11) and the methods are shown", () => {
    const status = (id: string) => rules.find((r) => r.id === id)?.status;
    expect(status("general-system")).toBe("left-to-reader");
    expect(status("elimination")).toBe("shown");
    expect(status("elim-three")).toBe("shown");
  });
  it("each Chapter 2 lesson earns exactly the rules of rules.json for that lesson", () => {
    expect(ch2Lessons).toHaveLength(3);
    for (const l of ch2Lessons) {
      const own = rules.filter((r) => r.lesson === l.id).map((r) => r.id);
      expect([...l.rulesEarned].sort(), `lesson ${l.id}`).toEqual(own.sort());
    }
  });
});
