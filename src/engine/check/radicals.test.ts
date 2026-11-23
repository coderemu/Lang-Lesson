import { beforeAll, describe, expect, it } from "vitest";
import { checkSet, loadMath } from "./expr";

beforeAll(async () => {
  await loadMath();
});

/** Chapter 4: roots with radicals, e.g. x² − x − 1 = 0 gives (1 ± √5)/2. */
const golden = { values: ["(1+sqrt(5))/2", "(1-sqrt(5))/2"] };
const kind = (v: { values: string[] }, t: string) => checkSet(v, t).kind;

describe("roots with radicals", () => {
  it.each([
    "(1 ± √5)/2",
    "(1 ± sqrt(5))/2",
    "1/2 ± √5/2",
    "(1+√5)/2, (1−√5)/2",
    "(1-sqrt(5))/2 or (1+sqrt(5))/2",
    "{(1+sqrt(5))/2; (1-sqrt(5))/2}",
    "0.5 ± 1.118",
    "1.618, -0.618",
    "0.5 + 1.1180, 0.5 - 1.1180",
  ])("accepts %s", (t) => expect(kind(golden, t)).toBe("correct"));

  it.each(["(1 + √5)/2", "1 ± √5/2", "(1 ± √5)/4", "(1 ± √3)/2", "0.5 ± 1.2", "1.6, -0.6"])(
    "refuses %s",
    (t) => expect(kind(golden, t)).toBe("unknown"),
  );

  it("refuses text it cannot read", () => expect(kind(golden, "1 ±")).toBe("invalid"));

  it("a decimal is not accepted for an exact value that is typed exactly wrong", () =>
    expect(kind({ values: ["2", "-3"] }, "2.01, -3")).toBe("unknown"));

  it("one solution: −√2", () => {
    const v = { values: ["-sqrt(2)"] };
    expect(kind(v, "-√2")).toBe("correct");
    expect(kind(v, "-1.4142")).toBe("correct");
    expect(kind(v, "√2")).toBe("unknown");
  });

  it("(√3 ± √7)/2 and 2 ± √3", () => {
    expect(kind({ values: ["(sqrt(3)+sqrt(7))/2", "(sqrt(3)-sqrt(7))/2"] }, "(√3 ± √7)/2")).toBe(
      "correct",
    );
    expect(kind({ values: ["2+sqrt(3)", "2-sqrt(3)"] }, "2 ± √3")).toBe("correct");
  });

  it("matches a mistake reply: only the root divided by 2a", () => {
    const v = { values: ["1/2", "-2"], mistakes: [{ match: "-7/4, -17/4", reply: "r" }] };
    expect(checkSet(v, "-7/4, -17/4")).toEqual({ kind: "mistake", reply: "r" });
  });
});
