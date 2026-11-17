import { beforeAll, describe, expect, it } from "vitest";
import { loadMath } from "./check/expr";
import { EI_KEY } from "../widgets/ch3";
import type { Interaction, Lesson, PracticeBank } from "../../content/schema";
import { answerSpec, evaluate, evaluatePractice, emptyInput, type Input } from "./answers";

/**
 * Criterion 2 at the logic level: every mistake reply of every lesson screen, follow-up and twin,
 * and of every bank problem, comes back word for word. The Playwright spec mistakes.spec.ts checks the same replies in the browser.
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

const input = (text: string[] = [], choice: string | null = null): Input => ({
  ...emptyInput(),
  text,
  choice,
});

function replies(
  i: Interaction,
  generalHint: string,
): { label: string; actual: string; expected: string }[] {
  const out: { label: string; actual: string; expected: string }[] = [];
  const spec = answerSpec(i);
  if (spec.t === "number") {
    for (const m of spec.answer.mistakes ?? []) {
      const r = evaluate(spec, input([String(m.match)]), generalHint);
      out.push({
        label: `answer ${m.match}`,
        actual: r.kind === "not-quite" ? r.body : r.kind,
        expected: m.reply,
      });
    }
  }
  if (spec.t === "multi") {
    spec.parts.forEach((p, k) => {
      for (const m of p.answer.mistakes ?? []) {
        const text = spec.parts.map((q, j) => String(j === k ? m.match : q.answer.value));
        const r = evaluate(spec, input(text), generalHint);
        out.push({
          label: `part ${k + 1} answer ${m.match}`,
          actual: r.kind === "not-quite" ? r.body : r.kind,
          expected: m.reply,
        });
      }
    });
  }
  if (spec.t === "text") {
    const a = spec.i.answer;
    // The correct answer must pass its own checker.
    const good = spec.i.checker === "set" ? (a.values ?? []).join(", ") : (a.value ?? "");
    const ok = evaluate(spec, input([good]), generalHint);
    out.push({ label: "the answer", actual: ok.kind, expected: "correct" });
    for (const m of a.mistakes ?? []) {
      const r = evaluate(spec, input([m.match]), generalHint);
      out.push({
        label: `answer ${m.match}`,
        actual: r.kind === "not-quite" ? r.body : r.kind,
        expected: m.reply,
      });
    }
  }
  if (spec.t === "ei") {
    out.push({
      label: "tables",
      actual: evaluate(spec, input([EI_KEY]), generalHint).kind,
      expected: "correct",
    });
    const bad = evaluate(spec, input(["EEEEEEEE"]), generalHint);
    out.push({
      label: "wrong cells",
      actual: bad.kind === "not-quite" ? bad.body : bad.kind,
      expected: spec.wrongReply ?? generalHint,
    });
  }
  if (spec.t === "choice") {
    for (const o of spec.choice.options.filter((o) => o.reply)) {
      const r = evaluate(spec, input([], o.id), generalHint);
      out.push({
        label: `option ${o.id}`,
        actual: r.kind === "not-quite" ? r.body : r.kind,
        expected: o.reply as string,
      });
    }
  }
  if (i.type === "trap-summary") {
    for (const o of i.trap.options.filter((o) => o.reply)) {
      const r = evaluate({ t: "choice", choice: i.trap }, input([], o.id), generalHint);
      out.push({
        label: `trap ${o.id}`,
        actual: r.kind === "not-quite" ? r.body : r.kind,
        expected: o.reply as string,
      });
    }
  }
  return out;
}

describe("every mistake reply of every lesson screen, follow-up and twin", () => {
  for (const l of lessons) {
    it(`lesson ${l.id}`, () => {
      let n = 0;
      for (const s of l.screens) {
        for (const [where, i] of [
          [s.id, s.interaction],
          [`${s.id} twin`, s.twin],
        ] as const) {
          if (!i) continue;
          for (const r of replies(i, l.generalHint)) {
            expect(r.actual, `${where} ${r.label}`).toBe(r.expected);
            n++;
          }
        }
      }
      expect(n).toBeGreaterThan(0);
    });
  }
});

describe("every mistake reply of every bank problem", () => {
  for (const b of banks) {
    it(`bank ${b.lesson}`, () => {
      for (const p of b.problems) {
        if (
          p.answer.type === "expression" ||
          p.answer.type === "set" ||
          p.answer.type === "interval"
        ) {
          const a = p.answer;
          const good = a.type === "set" ? a.values.join(", ") : a.value;
          expect(evaluatePractice(a, input([good])).kind, `${p.id} answer`).toBe("correct");
        }
        if (p.answer.type !== "number") continue;
        for (const m of p.answer.mistakes ?? []) {
          const r = evaluatePractice(p.answer, input([String(m.match)]));
          expect(r, `${p.id} ${m.match}`).toEqual({ kind: "not-quite", body: m.reply });
        }
      }
    });
  }
});
