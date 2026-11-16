import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EliminationBoard } from "./EliminationBoard";
import {
  combineRows,
  describeRow,
  determinant,
  formatQ,
  parseEquation,
  parseQ,
  q,
  rowKind,
  scaleRow,
  VARIABLES,
} from "./eliminationLogic";

const two = VARIABLES["two-unknowns"];

describe("elimination logic", () => {
  it("parses fractions and decimals", () => {
    expect(parseQ("6/7")).toEqual(q(6, 7));
    expect(parseQ("−2")).toEqual(q(-2));
    expect(parseQ("0.5")).toEqual(q(1, 2));
    expect(parseQ("1/0")).toBeNull();
    expect(parseQ("x")).toBeNull();
    expect(formatQ(q(-5, 7))).toBe("−5/7");
  });
  it("parses equations", () => {
    const r = parseEquation("2x + y = 1");
    expect(r.coef.x).toEqual(q(2));
    expect(r.coef.y).toEqual(q(1));
    expect(r.rhs).toEqual(q(1));
    const m = parseEquation("-2x + 5y - z = -1");
    expect([m.coef.x, m.coef.y, m.coef.z]).toEqual([q(-2), q(5), q(-1)]);
    const f = parseEquation("\\tfrac{1}{2}x + y = 2");
    expect(f.coef.x).toEqual(q(1, 2));
  });
  it("adds, subtracts and scales exactly (Lesson 2.1: x = 6/7)", () => {
    const a = parseEquation("2x + y = 1");
    const b = parseEquation("3x - 2y = 4");
    const doubled = scaleRow(a, q(2), "3");
    expect(describeRow(doubled, two)).toBe("4x + 2y = 2");
    const sum = combineRows(doubled, b, 1, "4");
    expect(describeRow(sum, two)).toBe("7x = 6");
    expect(describeRow(scaleRow(sum, q(1, 7), "5"), two)).toBe("x = 6/7");
  });
  it("tells an identity from a contradiction", () => {
    const a = parseEquation("x + 2y = 3");
    const b = parseEquation("2x + 4y = 5");
    const d = combineRows(b, scaleRow(a, q(2), "3"), -1, "4");
    expect(describeRow(d, two)).toBe("0 = −1");
    expect(rowKind(d, two)).toBe("contradiction");
    const same = combineRows(parseEquation("x + y = 1"), parseEquation("x + y = 1"), -1, "3");
    expect(rowKind(same, two)).toBe("identity");
  });
  it("computes ad − bc", () => {
    expect(formatQ(determinant(parseEquation("2x + y = 1"), parseEquation("3x - 2y = 4")))).toBe(
      "−7",
    );
    expect(formatQ(determinant(parseEquation("x + 2y = 3"), parseEquation("2x + 4y = 5")))).toBe(
      "0",
    );
  });
});

describe("EliminationBoard", () => {
  it("adds two rows and announces the new row", async () => {
    const user = userEvent.setup();
    render(<EliminationBoard mode="two-unknowns" equations={["x + y = 10", "x - y = 4"]} />);
    await user.click(screen.getByTestId("row-1"));
    await user.click(screen.getByTestId("row-2"));
    await user.click(screen.getByRole("button", { name: "Add rows" }));
    expect(screen.getByTestId("row-3")).toHaveAccessibleName("Row 3: 2x = 14");
    expect(screen.getByRole("status")).toHaveTextContent("The y term cancelled.");
  });
  it("multiplies with the keyboard: type k, press Enter", async () => {
    const user = userEvent.setup();
    render(<EliminationBoard mode="two-unknowns" equations={["2x + y = 1", "3x - 2y = 4"]} />);
    await user.click(screen.getByTestId("row-1"));
    await user.type(screen.getByLabelText("Multiply by"), "2{Enter}");
    expect(screen.getByTestId("row-3")).toHaveAccessibleName("Row 3: 4x + 2y = 2");
  });
  it("asks for the right number of rows and can undo", async () => {
    const user = userEvent.setup();
    render(<EliminationBoard mode="two-unknowns" equations={["x + y = 10", "x - y = 4"]} />);
    await user.click(screen.getByRole("button", { name: "Add rows" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Tap two rows first.");
    await user.click(screen.getByTestId("row-1"));
    await user.click(screen.getByRole("button", { name: "Multiply row" }));
    expect(screen.getByRole("alert")).toHaveTextContent("number");
    expect(screen.getByRole("button", { name: "Undo last row" })).toBeDisabled();
  });
  it("shows no single solution when ad − bc = 0 (mode general)", () => {
    render(<EliminationBoard mode="general" equations={["x + 2y = 3", "2x + 4y = 5"]} />);
    expect(screen.getByTestId("determinant")).toHaveTextContent("No single solution");
  });
  it("shows a determinant that is not 0 without the note", () => {
    render(<EliminationBoard mode="general" equations={["2x + y = 1", "3x - 2y = 4"]} />);
    expect(screen.getByTestId("determinant")).toHaveTextContent("= −7");
    expect(screen.getByTestId("determinant")).not.toHaveTextContent("No single solution");
  });
  it("shows two balances in system mode", () => {
    render(
      <EliminationBoard mode="two-unknowns" equations={["x + y = 10", "x - y = 4"]} balance />,
    );
    expect(screen.getAllByRole("img", { name: /Both pans are equal/ })).toHaveLength(2);
  });
  it("three unknowns: three rows and z in the rows", () => {
    render(
      <EliminationBoard
        mode="three-unknowns"
        equations={["x + y + z = 6", "x - y + z = 2", "2x + y - z = 1"]}
      />,
    );
    expect(screen.getByTestId("row-3")).toHaveAccessibleName("Row 3: 2x + y − z = 1");
  });
});
