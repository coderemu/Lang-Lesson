import { beforeAll, describe, expect, it } from "vitest";
import type { Lesson, PracticeBank } from "../../content/schema";
import { answerSpec, emptyInput, evaluate, evaluatePractice } from "./answers";
import { loadMath } from "./check/expr";

/**
 * Typed answers (set, interval, expression, numbers, pair, triple) have no `verify` formula.
 * This test checks that each stored answer is accepted by its own checker. It does not recompute the maths: that stays a manual check.
 */
const lessons = Object.values(
  import.meta.glob<{ default: Lesson }>("../../content/lessons/lesson-*.json", { eager: true }),
).map((m) => m.default);
const banks = Object.values(
  import.meta.glob<{ default: PracticeBank }>("../../content/practice/bank-*.json", {
    eager: true,
  }),
).map((m) => m.default);

beforeAll(async () => {
  await loadMath();
});

const typed = (text: string[]) => ({ ...emptyInput(), text });

describe("bank answers", () => {
  const problems = banks.flatMap((b) => b.problems);
  it.each(problems.map((p) => [p.id, p] as const))("%s accepts its own answer", (_id, p) => {
    const a = p.answer;
    let text: string[] | null = null;
    if (a.type === "set") text = [a.values.join(", ")];
    else if (a.type === "interval" || a.type === "expression") text = [a.value];
    else if (a.type === "numbers") text = a.values.map(String);
    else if (a.type === "pair" || a.type === "triple") text = Object.values(a.values).map(String);
    if (!text) return;
    expect(evaluatePractice(a, typed(text)).kind).toBe("correct");
  });
});

describe("lesson text answers", () => {
  const screens = lessons.flatMap((l) => l.screens.map((s) => [l, s] as const));
  it.each(screens.map(([l, s]) => [s.id, l, s] as const))(
    "%s accepts its own answer",
    (_id, l, s) => {
      for (const i of [s.interaction, s.twin]) {
        if (!i) continue;
        const spec = answerSpec(i);
        if (spec.t !== "text") continue;
        const a = spec.i.answer;
        const text = spec.i.checker === "set" ? (a.values ?? []).join(", ") : (a.value ?? "");
        expect(evaluate(spec, typed([text]), l.generalHint).kind).toBe("correct");
      }
    },
  );
});
