import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { cornerFits, discriminant, realRoots, rootCount } from "./ch4";
import { CompleteTiles, DiscriminantSlider } from "./Chapter4";

describe("chapter 4 logic", () => {
  it("discriminant", () => {
    expect(discriminant(2, 3, -2)).toBe(25);
    expect(discriminant(3, -2, 1)).toBe(-8);
  });
  it("roots", () => {
    expect(realRoots(2, 3, -2)).toEqual([-2, 0.5]);
    expect(realRoots(1, -6, 9)).toEqual([3]);
    expect(realRoots(1, 2, 5)).toEqual([]);
  });
  it("root count", () => {
    expect([rootCount(1), rootCount(0), rootCount(-8)]).toEqual([2, 1, 0]);
  });
  it("corner fits only at b/2", () => {
    expect(cornerFits(3, 6)).toBe(true);
    expect(cornerFits(6, 6)).toBe(false);
  });
});

function Harness() {
  const [v, setV] = useState<number | null>(null);
  return <CompleteTiles spec={{ b: 6 }} value={v} onChange={setV} />;
}

describe("CompleteTiles", () => {
  it("a wrong corner does not fit and shows its size", () => {
    render(<Harness />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText(/1 × 1 does not fit/)).toBeInTheDocument();
  });
  it("arrow keys change the size; 3 fits and updates the equation", () => {
    render(<Harness />);
    const s = screen.getByRole("slider");
    fireEvent.keyDown(s, { key: "ArrowRight" });
    fireEvent.keyDown(s, { key: "ArrowRight" });
    expect(s).toHaveAttribute("aria-valuenow", "3");
    expect(s.getAttribute("aria-valuetext")).toMatch(/It fits/);
    expect(screen.getByTestId("corner-tile")).toHaveAttribute("data-fit", "true");
  });
  it("too big is described", () => {
    render(<Harness />);
    const s = screen.getByRole("slider");
    fireEvent.keyDown(s, { key: "End" });
    for (let i = 0; i < 6; i++) fireEvent.keyDown(s, { key: "ArrowRight" });
    expect(s.getAttribute("aria-valuetext")).toMatch(/too big/);
  });
  it("Enter calls onEnter", () => {
    let n = 0;
    render(<CompleteTiles spec={{ b: 6 }} value={3} onChange={() => {}} onEnter={() => n++} />);
    fireEvent.keyDown(screen.getByRole("slider"), { key: "Enter" });
    expect(n).toBe(1);
  });
});

describe("DiscriminantSlider", () => {
  it("shows two, one and no solution", () => {
    render(<DiscriminantSlider spec={{ a: 1, b: 2, c: -3 }} />);
    expect(screen.getByTestId("root-note")).toHaveTextContent("Two solutions");
    expect(screen.getAllByTestId("root-dot")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Value of c"), { target: { value: "1" } });
    expect(screen.getByTestId("root-note")).toHaveTextContent("One solution");
    expect(screen.getAllByTestId("root-dot")).toHaveLength(1);
    fireEvent.change(screen.getByLabelText("Value of c"), { target: { value: "5" } });
    expect(screen.getByTestId("root-note")).toHaveTextContent("No real solution");
    expect(screen.queryAllByTestId("root-dot")).toHaveLength(0);
  });
});
