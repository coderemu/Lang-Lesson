import { describe, expect, it } from "vitest";
import { spokenTex } from "./spoken";

describe("spokenTex", () => {
  it.each([
    ["2n + 1", "2n plus 1"],
    ["-6a + 8b", "minus 6a plus 8b"],
    ["\\va{a} + (-\\va{a}) = 0", "a plus (minus a) equals 0"],
    ["(x + 4)^2", "(x plus 4) squared"],
    ["x^3", "x cubed"],
    ["2^{10}", "2 to the power 10"],
    ["\\dfrac{2}{3} \\cdot \\dfrac{3}{2} = 1", "(2) over (3) times (3) over (2) equals 1"],
    ["\\text{So } a + b \\text{ is odd}", "So a plus b is odd"],
    ["a \\ne 0", "a is not equal to 0"],
    ["\\sqrt{2}", "square root of 2"],
    ["n^2 < 5", "n squared is less than 5"],
    ["3 \\mid 12", "3 divides 12"],
  ])("%s", (tex, spoken) => {
    expect(spokenTex(tex)).toBe(spoken);
  });
});
