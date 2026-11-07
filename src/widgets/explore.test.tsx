import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AreaModel, FractionStrips, SquareTiles } from "./index";
import {
  addFractions,
  clampInt,
  cutPieces,
  distribute,
  distributeTex,
  doubling,
  fmtNumber,
  lcm,
  maxCuts,
  num,
  tiles,
  tilesTex,
  width2,
} from "./explore";

describe("explore logic", () => {
  it("clamps and reads numbers", () => {
    expect(clampInt(7.4, 1, 5)).toBe(5);
    expect(clampInt(-3, 1, 5)).toBe(1);
    expect(num({ a: 3 }, "a", 9)).toBe(3);
    expect(num({ a: "x" }, "a", 9)).toBe(9);
  });
  it("distributes a × (b + c)", () => {
    expect(distribute(3, 4, 6)).toEqual({
      a: 3,
      left: 4,
      right: 2,
      areaLeft: 12,
      areaRight: 6,
      area: 18,
    });
    expect(distributeTex(3, 4, 2)).toBe("3(4 + 2) = 3 \\cdot 4 + 3 \\cdot 2 = 12 + 6 = 18");
  });
  it("width 2: even and odd", () => {
    expect(width2(6)).toMatchObject({ n: 3, odd: false });
    expect(width2(7)).toMatchObject({ n: 3, odd: true, tex: "7 = 2 \\cdot 3 + 1" });
  });
  it("doubling and halving", () => {
    expect(doubling(50000, 2, 3).value).toBe(400000);
    expect(doubling(50000, 2, 0).tex).toBe("50\\,000");
    expect(doubling(40, 0.5, 3).value).toBe(5);
    expect(doubling(40, 0.5, 3).tex).toContain("\\dfrac");
    expect(fmtNumber(1.5)).toBe("1.5");
  });
  it("square tiles", () => {
    expect(tiles(3, 5)).toEqual({ a: 3, b: 2, aa: 9, ab: 6, bb: 4, area: 25 });
    expect(tilesTex(3, 2)).toBe("(3 + 2)^2 = 9 + 2 \\cdot 6 + 4 = 25");
  });
  it("fraction strips", () => {
    expect(cutPieces(1, 2, 2)).toEqual({ shaded: 4, pieces: 8 });
    expect(maxCuts(2, 16)).toBe(3);
    expect(maxCuts(5, 4)).toBe(0);
    expect(lcm(3, 4)).toBe(12);
    expect(addFractions(2, 3, 1, 4)).toEqual({ d: 12, a: 8, b: 3, sum: 11 });
  });
});

describe("explore widgets", () => {
  it("area model distribute: arrows move the split, the text follows", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AreaModel mode="distribute" spec={{ a: 3, b: 4, c: 2 }} value={null} onChange={onChange} />,
    );
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole("status")).toHaveTextContent(
      "3 times 6 is split into 3 times 4 and 3 times 2",
    );
  });
  it("area model distribute: turn the rectangle", async () => {
    const user = userEvent.setup();
    render(
      <AreaModel
        mode="distribute"
        spec={{ a: 3, b: 4, c: 2, turn: 1 }}
        value={null}
        onChange={() => undefined}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Turn the rectangle" }));
    expect(screen.getByRole("status")).toHaveTextContent("The rectangle is turned");
  });
  it("area model width-2: odd numbers show the extra square", () => {
    const { rerender } = render(
      <AreaModel mode="width-2" spec={{ max: 6 }} value={7} onChange={() => undefined} />,
    );
    expect(screen.getByTestId("odd-square")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("7 is odd");
    rerender(<AreaModel mode="width-2" spec={{ max: 6 }} value={6} onChange={() => undefined} />);
    expect(screen.queryByTestId("odd-square")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("6 is even");
  });
  it("doubling strip: one step more with the button, and halving", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <AreaModel
        mode="doubling-strip"
        spec={{ start: 50000, factor: 2, steps: 3 }}
        value={null}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Double once more/ }));
    expect(onChange).toHaveBeenCalledWith(1);
    rerender(
      <AreaModel
        mode="doubling-strip"
        spec={{ start: 40, factor: 0.5, steps: 3, unit: "g" }}
        value={3}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("After 3 halvings: 5 g.");
  });
  it("square tiles: arrows split the side and the areas add up", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SquareTiles mode="expand" spec={{ total: 5, a: 3 }} value={null} onChange={onChange} />,
    );
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(screen.getByRole("status")).toHaveTextContent("areas 9, 6, 6 and 4");
  });
  it("fraction strips: cut, add and invert", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <FractionStrips
        mode="cut"
        spec={{ num: 1, den: 2, max: 16 }}
        value={2}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("cut into 8 pieces. 4 are shaded");
    await user.click(screen.getByRole("button", { name: /Cut each piece in two/ }));
    expect(onChange).toHaveBeenLastCalledWith(3);
    rerender(
      <FractionStrips
        mode="add"
        spec={{ n1: 2, d1: 3, n2: 1, d2: 4 }}
        value={2}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Together: 11 out of 12.");
    rerender(<FractionStrips mode="invert" spec={{ m: 2, n: 3 }} value={0} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Turn upside down/ }));
    expect(onChange).toHaveBeenLastCalledWith(1);
    rerender(<FractionStrips mode="invert" spec={{ m: 2, n: 3 }} value={1} onChange={onChange} />);
    expect(screen.getByRole("status")).toHaveTextContent("The product is 1.");
  });
});
