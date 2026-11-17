import { beforeAll, describe, expect, it } from "vitest";
import { checkPractice } from "./index";
import {
  checkExpression,
  checkInterval,
  checkSet,
  loadMath,
  parseInterval,
  parseSet,
  sameExpression,
} from "./expr";

beforeAll(async () => {
  await loadMath();
});

const ok = (r: { kind: string }) => r.kind === "correct";

describe("expression checker", () => {
  const a = { value: "2/(sqrt(x+2*h)+sqrt(x))", variables: ["x", "h"] };
  it("accepts the same form", () =>
    expect(ok(checkExpression(a, "2/(sqrt(x+2*h)+sqrt(x))"))).toBe(true));
  it("accepts √ and implicit multiplication", () =>
    expect(ok(checkExpression(a, "2/(√(x+2h)+√x)"))).toBe(true));
  it("accepts an equal form", () =>
    expect(ok(checkExpression({ value: "4*a^2*b", variables: ["a", "b"] }, "2·2·b·a²"))).toBe(
      true,
    ));
  it("accepts U+2212", () =>
    expect(ok(checkExpression({ value: "-1+sqrt(2)", variables: [] }, "−1 + √2"))).toBe(true));
  it("accepts a reordered sum", () =>
    expect(ok(checkExpression({ value: "6+2*sqrt(5)", variables: [] }, "2√5 + 6"))).toBe(true));
  it("rejects a wrong value", () =>
    expect(ok(checkExpression({ value: "6+2*sqrt(5)", variables: [] }, "6+sqrt(5)"))).toBe(false));
  it("rejects a wrong sign", () =>
    expect(ok(checkExpression({ value: "sqrt(5)+2", variables: [] }, "sqrt(5)-2"))).toBe(false));
  it("rejects a different function of x", () =>
    expect(ok(checkExpression(a, "2/(sqrt(x+h)+sqrt(x))"))).toBe(false));
  it("flags unreadable text as invalid", () =>
    expect(checkExpression(a, "2/(").kind).toBe("invalid"));
  it("flags empty text as invalid", () => expect(checkExpression(a, "  ").kind).toBe("invalid"));
  it("returns the reply of a matching mistake", () => {
    const r = checkExpression(
      {
        value: "sqrt(5)+2",
        variables: [],
        mistakes: [{ match: "sqrt(5)-2", reply: "Use the opposite sign." }],
      },
      "√5 − 2",
    );
    expect(r).toEqual({ kind: "mistake", reply: "Use the opposite sign." });
  });
  it("compares numbers without letters", () =>
    expect(sameExpression("(1+2)^2", "9", [])).toBe(true));
});

describe("set checker", () => {
  it("accepts any order", () => expect(ok(checkSet({ values: ["1", "-7"] }, "-7, 1"))).toBe(true));
  it("accepts 'or'", () => expect(ok(checkSet({ values: ["2", "-3"] }, "2 or -3"))).toBe(true));
  it("accepts braces and a Unicode minus", () =>
    expect(ok(checkSet({ values: ["2", "-3"] }, "{2; −3}"))).toBe(true));
  it("accepts fractions", () =>
    expect(ok(checkSet({ values: ["2", "-2/3"] }, "-2/3, 2"))).toBe(true));
  it("reads ± as two values", () =>
    expect(ok(checkSet({ values: ["2+sqrt(3)", "2-sqrt(3)"] }, "2 ± √3"))).toBe(true));
  it("reads ±√10", () =>
    expect(ok(checkSet({ values: ["sqrt(10)", "-sqrt(10)"] }, "±√10"))).toBe(true));
  it("rejects a missing value", () =>
    expect(ok(checkSet({ values: ["3", "-3"] }, "3"))).toBe(false));
  it("rejects an extra value", () =>
    expect(ok(checkSet({ values: ["3", "-3"] }, "3, -3, 0"))).toBe(false));
  it("rejects the wrong sign", () =>
    expect(ok(checkSet({ values: ["1", "-7"] }, "1, 7"))).toBe(false));
  it("does not count a repeat twice", () =>
    expect(ok(checkSet({ values: ["3"] }, "3, 3"))).toBe(true));
  it("flags text as invalid", () =>
    expect(checkSet({ values: ["3"] }, "three").kind).toBe("invalid"));
  it("gives the reply of a mistake", () =>
    expect(
      checkSet(
        { values: ["3", "-3"], mistakes: [{ match: "3", reply: "Look at the mirror." }] },
        "3",
      ),
    ).toEqual({ kind: "mistake", reply: "Look at the mirror." }));
  it("parses to sorted numbers", () => expect(parseSet("3, -1")).toEqual([-1, 3]));
});

describe("interval checker", () => {
  const range = { value: "-2 < x < 3" };
  it("accepts the same chain", () => expect(ok(checkInterval(range, "−2 < x < 3"))).toBe(true));
  it("accepts bracket form", () => expect(ok(checkInterval(range, "(−2, 3)"))).toBe(true));
  it("accepts a reversed chain", () => expect(ok(checkInterval(range, "3 > x > -2"))).toBe(true));
  it("rejects a closed end", () => expect(ok(checkInterval(range, "[-2, 3)"))).toBe(false));
  it("rejects <= when < is needed", () =>
    expect(ok(checkInterval(range, "-2 <= x < 3"))).toBe(false));
  it("accepts half-open", () =>
    expect(ok(checkInterval({ value: "-2 < x <= 5" }, "(-2, 5]"))).toBe(true));
  it("accepts a union with inf", () =>
    expect(ok(checkInterval({ value: "x < 3 or x > 7" }, "(-inf,3) U (7,inf)"))).toBe(true));
  it("accepts a union in another order", () =>
    expect(ok(checkInterval({ value: "x < 3 or x > 7" }, "x > 7 or x < 3"))).toBe(true));
  it("accepts x > 2 as (2, ∞)", () =>
    expect(ok(checkInterval({ value: "x > 2" }, "(2, ∞)"))).toBe(true));
  it("accepts 2 < x", () => expect(ok(checkInterval({ value: "x > 2" }, "2 < x"))).toBe(true));
  it("accepts radicals", () =>
    expect(ok(checkInterval({ value: "x > sqrt(5) or x < -sqrt(5)" }, "x < −√5 or x > √5"))).toBe(
      true,
    ));
  it("accepts closed ends with ≤", () =>
    expect(ok(checkInterval({ value: "-1/2 <= x <= 1/2" }, "[-1/2, 1/2]"))).toBe(true));
  it("rejects one part of a union", () =>
    expect(ok(checkInterval({ value: "x < 3 or x > 7" }, "x > 7"))).toBe(false));
  it("rejects the wrong direction", () =>
    expect(ok(checkInterval({ value: "x > 2" }, "x < 2"))).toBe(false));
  it("rejects x < 2 for -2 < x < 2", () =>
    expect(ok(checkInterval({ value: "-2 < x < 2" }, "x < 2"))).toBe(false));
  it("flags nonsense as invalid", () =>
    expect(checkInterval(range, "banana").kind).toBe("invalid"));
  it("parses to sorted pieces", () => expect(parseInterval("x > 7 or x < 3")?.[0].hi).toBe(3));
  it("gives the reply of a mistake", () =>
    expect(
      checkInterval(
        { value: "x > -2", mistakes: [{ match: "x < -2", reply: "Flip the sign." }] },
        "x < -2",
      ),
    ).toEqual({ kind: "mistake", reply: "Flip the sign." }));
});

describe("checkPractice with the new types", () => {
  it("expression", () =>
    expect(
      ok(
        checkPractice(
          { type: "expression", value: "4*a^2*b", variables: ["a", "b"] },
          { text: ["4a^2 b"] },
        ),
      ),
    ).toBe(true));
  it("set", () =>
    expect(ok(checkPractice({ type: "set", values: ["1", "-5"] }, { text: ["-5, 1"] }))).toBe(
      true,
    ));
  it("interval", () =>
    expect(ok(checkPractice({ type: "interval", value: "-3 < x < 3" }, { text: ["(-3,3)"] }))).toBe(
      true,
    ));
});
