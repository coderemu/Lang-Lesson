import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { loadMath } from "../engine/check/expr";
import { CompareTiles, EITable, IntervalLine, MediantStrips, ZoomLine } from "./index";
import {
  EI_KEY,
  decimalText,
  digitVerdict,
  eiWrongCells,
  mediant,
  nextDigit,
  partText,
  partWords,
  powText,
} from "./ch3";

beforeAll(async () => {
  await loadMath();
});

describe("zoom logic", () => {
  it("formats decimals and powers", () => {
    expect(decimalText(141, 2)).toBe("1.41");
    expect(powText(141, 2, 2)).toBe("1.9881");
    expect(powText(142, 2, 2)).toBe("2.0164");
    expect(powText(15, 1, 2)).toBe("2.25");
    expect(powText(10, 1, 2)).toBe("1");
  });
  it("finds the digits of √2", () => {
    expect(nextDigit(2, 2, 1, 0)).toBe(4);
    expect(nextDigit(2, 2, 14, 1)).toBe(1);
    expect(nextDigit(2, 2, 141, 2)).toBe(4);
  });
  it("finds the digits of the cube root of 2", () => expect(nextDigit(2, 3, 1, 0)).toBe(2));
  it("judges a digit", () => {
    expect(digitVerdict(2, 2, 1, 0, 5)).toBe("high");
    expect(digitVerdict(2, 2, 1, 0, 3)).toBe("low");
    expect(digitVerdict(2, 2, 1, 0, 4)).toBe("right");
  });
});

describe("zoom widget", () => {
  it("zooms with right digits and refuses wrong ones", async () => {
    const user = userEvent.setup();
    render(<ZoomLine spec={{ n: 2, p: 2, depth: 3 }} />);
    await user.click(screen.getByRole("button", { name: "Digit 5" }));
    expect(screen.getByTestId("zoom-msg").textContent).toMatch(/more than 2/);
    await user.click(screen.getByRole("button", { name: "Digit 4" }));
    expect(screen.getByTestId("zoom-msg").textContent).toMatch(/between 1\.4 and 1\.5/);
    await user.click(screen.getByRole("button", { name: "Digit 1" }));
    await user.click(screen.getByRole("button", { name: "Digit 4" }));
    expect(screen.getByTestId("zoom-msg").textContent).toMatch(/Search finished/);
    expect(screen.getByRole("button", { name: "Digit 0" })).toBeDisabled();
  });
});

describe("interval logic", () => {
  const P = { lo: -2, hi: 5, loClosed: false, hiClosed: true };
  it("writes text for the checker", () => {
    expect(partText(P, -5, 10)).toBe("(-2, 5]");
    expect(partText({ lo: 1, hi: 10, loClosed: true, hiClosed: true }, -5, 10)).toBe("[1, inf)");
    expect(partText({ lo: -5, hi: 3, loClosed: true, hiClosed: false }, -5, 10)).toBe("(-inf, 3)");
  });
  it("describes a part in words", () => {
    expect(partWords(P, -5, 10)).toBe("from minus 2, excluded, to 5, included");
  });
});

describe("interval widget", () => {
  it("moves an end with the arrow keys and toggles the end", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IntervalLine spec={{ min: -5, max: 10 }} value="(-2, 5]" onChange={onChange} />);
    const right = screen.getByTestId("interval-0-hi");
    right.focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("(-2, 6]");
    await user.keyboard(" ");
    expect(onChange).toHaveBeenLastCalledWith("(-2, 5)");
    await user.click(screen.getByRole("button", { name: /Left end/ }));
    expect(onChange).toHaveBeenLastCalledWith("[-2, 5]");
  });
  it("an end on the edge means infinity", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<IntervalLine spec={{ min: -5, max: 10 }} value="(7, 9)" onChange={onChange} />);
    screen.getByTestId("interval-0-hi").focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("(7, inf)");
  });
  it("draws two parts", () => {
    render(<IntervalLine spec={{ min: -5, max: 10, parts: 2 }} value="(-inf, 3) U (7, inf)" />);
    expect(screen.getByTestId("interval-1-lo").getAttribute("aria-valuenow")).toBe("7");
    expect(screen.getByTestId("interval-0-hi").getAttribute("aria-valuenow")).toBe("3");
  });
});

describe("E/I table", () => {
  it("knows the right tables", () => {
    expect(EI_KEY).toBe("EIIEEEEI");
    expect(eiWrongCells("EIIEEEEE")).toEqual([7]);
  });
  it("fills a cell", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<EITable value="--------" onChange={onChange} />);
    await user.click(screen.getByTestId("ei-add-01"));
    expect(onChange).toHaveBeenCalledWith("-E------");
  });
  it("marks wrong cells", () => {
    render(<EITable value="EEIEEEEE" showWrong />);
    expect(screen.getByTestId("ei-add-01").getAttribute("data-wrong")).toBe("true");
    expect(screen.getByTestId("ei-add-00").getAttribute("data-wrong")).toBe("false");
  });
});

describe("mediant and compare", () => {
  it("adds tops and bottoms", () => expect(mediant(1, 3, 1, 2)).toEqual({ n: 2, d: 5 }));
  it("shows the mediant strip", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediantStrips spec={{ a: 1, b: 3, c: 1, d: 2 }} value={null} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /Add the tops/ }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
  it("shows the mediant text when open", () => {
    render(<MediantStrips spec={{ a: 1, b: 3, c: 1, d: 2 }} value={1} />);
    expect(screen.getAllByRole("img")[0].getAttribute("aria-label")).toMatch(/2\/5/);
  });
  it("compares squares with the keyboard", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CompareTiles spec={{ b: 5, a: 3 }} value={3} onChange={onChange} />);
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toMatch(/9 and 25/);
  });
});
