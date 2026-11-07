import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ProofInteraction, Rule } from "../../content/schema";
import {
  Balance,
  NumberLine,
  ProofStepper,
  Thermometer,
  TrapSummary,
  trayChips,
  activeLine,
} from "./index";
import { layout } from "./Balance";
import { pathUnits } from "./NumberLine";
import {
  describeBalance,
  isLevel,
  tiltDegrees,
  weights,
  xAlone,
  xValue,
  type BalanceSpec,
} from "./balanceLogic";
import {
  fmt,
  hopsBetween,
  spoken,
  splitEquation,
  thermoValueAtY,
  thermoY,
  valueAtX,
  xOf,
} from "./geometry";

describe("number line geometry (frame S01: tick x = 21 + 30·i)", () => {
  it("places ticks 30 apart", () => {
    expect(xOf(-5, -5, 5)).toBe(21);
    expect(xOf(0, -5, 5)).toBe(171);
    expect(xOf(5, -5, 5)).toBe(321);
  });
  it("snaps an x position to the nearest integer and stays in range", () => {
    expect(valueAtX(100, -5, 5)).toBe(-2);
    expect(valueAtX(-50, -5, 5)).toBe(-5);
    expect(valueAtX(900, -5, 5)).toBe(5);
    expect(valueAtX(xOf(3, -2, 10), -2, 10)).toBe(3);
  });
  it("formats numbers", () => {
    expect(fmt(-3)).toBe("−3");
    expect(spoken(-3)).toBe("minus 3");
    expect(spoken(4)).toBe("4");
    expect(splitEquation("3 + (-5) = ?")).toEqual({ left: "3 + (-5) = ", right: "" });
    expect(splitEquation("no")).toBeNull();
    expect(hopsBetween(3, -2)).toEqual({ n: 5, dir: "left" });
    expect(hopsBetween(3, 4)).toEqual({ n: 1, dir: "right" });
    expect(hopsBetween(3, 3)).toEqual({ n: 0, dir: "none" });
  });
  it("lists the unit moves of a path", () => {
    expect(pathUnits({ start: 3, adds: [2, -1] })).toEqual([
      { from: 3, to: 4 },
      { from: 4, to: 5 },
      { from: 5, to: 4 },
    ]);
  });
});

describe("thermometer geometry (frame S02)", () => {
  it("puts 15 at y 20, 0 at y 152 and −10 at y 240", () => {
    expect(thermoY(15, -10, 15)).toBeCloseTo(20);
    expect(thermoY(0, -10, 15)).toBeCloseTo(152);
    expect(thermoY(-10, -10, 15)).toBeCloseTo(240);
  });
  it("inverts y to a value", () => {
    expect(thermoValueAtY(152, -10, 15)).toBe(0);
    expect(thermoValueAtY(-100, -10, 15)).toBe(15);
    expect(thermoValueAtY(900, -10, 15)).toBe(-10);
  });
});

describe("balance logic (DESIGN-SYSTEM §7)", () => {
  const spec: BalanceSpec = { left: { x: 1, units: 3 }, right: { x: 0, units: 5 } };
  it("finds the hidden x and starts level", () => {
    expect(xValue(spec)).toBe(2);
    expect(isLevel(spec, { l: 0, r: 0 })).toBe(true);
    expect(tiltDegrees(spec, { l: 0, r: 0 })).toBe(0);
  });
  it("tips towards the heavier pan, at most 8°", () => {
    expect(tiltDegrees(spec, { l: 1, r: 0 })).toBeGreaterThan(0); // right pan is heavier: down
    expect(tiltDegrees(spec, { l: 0, r: 1 })).toBeLessThan(0);
    expect(Math.abs(tiltDegrees(spec, { l: 3, r: 0 }))).toBe(8);
    expect(weights(spec, { l: 1, r: 0 })).toEqual({ left: 4, right: 5 });
  });
  it("is level again after the same number of cubes leaves each pan, and then x stands alone", () => {
    expect(isLevel(spec, { l: 3, r: 3 })).toBe(true);
    expect(xAlone(spec, { l: 3, r: 3 })).toBe(true);
    expect(xAlone(spec, { l: 1, r: 1 })).toBe(false);
  });
  it("describes its state for screen readers", () => {
    expect(describeBalance(spec, { l: 0, r: 0 })).toContain("The balance is level.");
    expect(describeBalance(spec, { l: 1, r: 0 })).toContain("The right pan is heavier.");
    expect(describeBalance(spec, { l: 0, r: 1 })).toContain("The left pan is heavier.");
    expect(describeBalance(spec, { l: 3, r: 5 })).toContain("Right pan: empty");
  });
  it("lays cubes out row by row", () => {
    expect(layout(true, 3).cubes).toHaveLength(3);
    expect(layout(false, 5).cubes.map((c) => c.y)).toEqual([-22, -22, -22, -46, -46]);
    expect(layout(false, 0).cubes).toEqual([]);
  });
});

describe("NumberLine", () => {
  const spec = { min: -5, max: 5, ringStart: 0 };
  it("moves the ring one unit with the arrow keys and checks with Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onEnter = vi.fn();
    render(
      <NumberLine mode="place" spec={spec} value={null} onChange={onChange} onEnter={onEnter} />,
    );
    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith(-1);
    await user.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith(-5);
    await user.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith(5);
    await user.keyboard("{Enter}");
    expect(onEnter).toHaveBeenCalled();
  });
  it("places the ring by tapping the line", () => {
    const onChange = vi.fn();
    render(<NumberLine mode="place" spec={spec} value={null} onChange={onChange} />);
    const svg = screen.getByRole("slider");
    svg.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 342,
      height: 120,
      right: 342,
      bottom: 120,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.pointerDown(svg, { clientX: xOf(-3, -5, 5), clientY: 70, pointerId: 1 });
    expect(onChange).toHaveBeenCalledWith(-3);
    fireEvent.pointerMove(svg, { clientX: xOf(2, -5, 5), clientY: 70, pointerId: 1 });
    expect(onChange).toHaveBeenLastCalledWith(2);
    fireEvent.pointerUp(svg, { pointerId: 1 });
  });
  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberLine mode="place" spec={spec} value={-3} onChange={onChange} disabled />);
    expect(screen.queryByRole("slider")).toBeNull();
    await user.keyboard("{ArrowLeft}");
    expect(onChange).not.toHaveBeenCalled();
  });
  it("describes the ring and the hops", () => {
    const { rerender } = render(<NumberLine mode="place" spec={spec} value={-2} />);
    expect(screen.getByRole("status")).toHaveTextContent("Ring at minus 2.");
    rerender(
      <NumberLine
        mode="hops"
        spec={{ min: -5, max: 5, start: 3, add: -5, ringStart: 3 }}
        value={-2}
        equation="3 + (-5) = ?"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Ring at minus 2. 5 hops to the left of 3.",
    );
    expect(screen.getByTestId("hops-equation")).toHaveTextContent("−2");
  });
  it("shows ? in the equation until the ring moves", () => {
    render(
      <NumberLine
        mode="hops"
        spec={{ min: -5, max: 5, start: 3, add: -5, ringStart: 3 }}
        value={null}
        equation="3 + (-5) = ?"
      />,
    );
    expect(screen.getByTestId("hops-equation")).toHaveTextContent("?");
  });
  it("describes compare and mirror modes", () => {
    const { rerender } = render(
      <NumberLine
        mode="compare"
        spec={{
          min: -2,
          max: 10,
          paths: [
            { start: 3, adds: [5] },
            { start: 5, adds: [3] },
          ],
        }}
        value={null}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("3 plus 5 ends at 8. 5 plus 3 ends at 8.");
    rerender(<NumberLine mode="mirror" spec={{ min: -5, max: 5, mirrorOf: 4 }} value={null} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "4 and minus 4 are mirror points across 0.",
    );
  });
});

describe("Thermometer", () => {
  const spec = { min: -10, max: 15, start: 10, change: -15 };
  it("moves the guess with arrow keys and describes the result after Check", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Thermometer spec={spec} value={null} onChange={onChange} />);
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith(-1);
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(1);
    rerender(<Thermometer spec={spec} value={-6} onChange={onChange} revealed />);
    expect(screen.getByRole("status")).toHaveTextContent("fell from 10 to minus 5");
    expect(screen.queryByRole("slider")).toBeNull();
  });
});

describe("Balance", () => {
  const spec: BalanceSpec = { left: { x: 1, units: 3 }, right: { x: 0, units: 5 } };
  it("removes a cube when it is tapped or when Enter is pressed on it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Balance mode="solve" spec={spec} removed={{ l: 0, r: 0 }} onChange={onChange} />);
    expect(screen.getByTestId("balance-readout")).toHaveTextContent("Level");
    await user.click(screen.getAllByTestId("cube-left")[0]);
    expect(onChange).toHaveBeenLastCalledWith({ l: 1, r: 0 });
    const right = screen.getAllByTestId("cube-right")[0];
    right.focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith({ l: 0, r: 1 });
  });
  it("tips when the pans differ and ignores taps when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Balance mode="solve" spec={spec} removed={{ l: 1, r: 0 }} onChange={onChange} disabled />,
    );
    expect(screen.getByTestId("balance-readout")).toHaveTextContent("right pan is heavier");
    await user.click(screen.getAllByTestId("cube-left")[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ProofStepper", () => {
  const rules = new Map<string, Rule>(
    ["N1", "N2"].map((id) => [
      id,
      { id, label: id, name: id, statement: "a", status: "assumed", lesson: "1.2", book: "" },
    ]),
  );
  const proof: ProofInteraction = {
    type: "proof",
    goal: "g",
    lines: [
      { math: "a", reason: null },
      { math: "b", reason: "N2" },
      { math: "c", reason: "add" },
      { math: "d", reason: "N1" },
    ],
    tray: ["N1", "N2", "add"],
    steps: [{ id: "add", label: "add to both sides" }],
    feedback: { correctTitle: "t", correctWhy: "w" },
  };
  it("builds tray chips and finds the active line", () => {
    const chips = trayChips(proof, rules);
    expect(chips.map((c) => [c.label, c.kind])).toEqual([
      ["N1", "rule"],
      ["N2", "rule"],
      ["add to both sides", "step"],
    ]);
    expect(activeLine(proof, new Set())).toBe(1);
    expect(activeLine(proof, new Set([1]))).toBe(2);
    expect(activeLine(proof, new Set([1, 2, 3]))).toBe(4);
  });
  it("shows given, done, active and locked lines and reports taps", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(
      <ProofStepper
        proof={proof}
        chips={trayChips(proof, rules)}
        active={2}
        done={{ 1: "N2" }}
        pending={null}
        wrong={false}
        onPick={onPick}
      />,
    );
    const lines = screen.getAllByRole("listitem");
    expect(lines.map((l) => l.getAttribute("data-state"))).toEqual([
      "given",
      "done",
      "active",
      "locked",
    ]);
    await user.click(screen.getByRole("button", { name: "add to both sides" }));
    expect(onPick).toHaveBeenCalledWith("add");
    expect(screen.getByRole("status")).toHaveTextContent("Line 3 of 4 needs a reason.");
  });
  it("marks a wrong chip and finishes", () => {
    const chips = trayChips(proof, rules);
    const { rerender } = render(
      <ProofStepper
        proof={proof}
        chips={chips}
        active={1}
        done={{}}
        pending="N1"
        wrong
        onPick={() => undefined}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Chosen: N1.");
    rerender(
      <ProofStepper
        proof={proof}
        chips={chips}
        active={4}
        done={{ 1: "N2", 2: "add", 3: "N1" }}
        pending={null}
        wrong={false}
        onPick={() => undefined}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("The proof is complete.");
    expect(screen.getByRole("button", { name: "N1" })).toBeDisabled();
  });
});

describe("TrapSummary", () => {
  it("shows the rules and answers the trap", async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const rules = new Map<string, Rule>([
      [
        "N2",
        {
          id: "N2",
          label: "N2",
          name: "N2",
          statement: "a",
          status: "assumed",
          lesson: "1.2",
          book: "",
        },
      ],
    ]);
    render(
      <TrapSummary
        summary={["N2", "missing"]}
        rules={rules}
        question="Q"
        answer={null}
        correct={false}
        onAnswer={onAnswer}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "False" }));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });
});
