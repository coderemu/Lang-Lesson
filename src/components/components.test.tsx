import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  ChoiceChip,
  FeedbackSheet,
  HintChip,
  HintDrawer,
  LessonBar,
  NumberSlot,
  ReasonChip,
  ReasonSlot,
  RuleCard,
  TrapBox,
  TryBox,
} from ".";
import { RichText } from "../math";

describe("Button", () => {
  it("renders each variant and is keyboard reachable", async () => {
    render(
      <>
        <Button>Check</Button>
        <Button variant="continue">Continue</Button>
        <Button variant="secondary">Show me why</Button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Check" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute(
      "data-variant",
      "continue",
    );
    expect(screen.getByRole("button", { name: "Show me why" })).toHaveAttribute(
      "data-variant",
      "secondary",
    );
  });
  it("disabled does not fire onClick", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Check
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
  it("hint variant reports open state", () => {
    const { rerender } = render(<Button variant="hint">Hint</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
    rerender(
      <Button variant="hint" open>
        Hint
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });
});

describe("ChoiceChip", () => {
  it("toggles selected with the keyboard", async () => {
    function Demo() {
      const [s, setS] = useState(false);
      return (
        <ChoiceChip selected={s} onClick={() => setS(!s)}>
          Below zero
        </ChoiceChip>
      );
    }
    render(<Demo />);
    const chip = screen.getByRole("button", { name: "Below zero" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await userEvent.tab();
    expect(chip).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip).toHaveAttribute("data-selected", "true");
  });
  it("correct and wrong states use words, not colour alone", () => {
    render(
      <>
        <ChoiceChip state="correct">A</ChoiceChip>
        <ChoiceChip state="wrong">B</ChoiceChip>
      </>,
    );
    expect(screen.getByText("(correct)")).toBeInTheDocument();
    expect(screen.getByText("(not quite)")).toBeInTheDocument();
  });
  it("disabled chip is disabled", () => {
    render(<ChoiceChip disabled>A</ChoiceChip>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("NumberSlot", () => {
  it("is reachable, takes input and marks filled", async () => {
    function Demo() {
      const [v, setV] = useState("");
      return <NumberSlot label="Answer" value={v} onChange={setV} />;
    }
    render(<Demo />);
    const input = screen.getByLabelText("Answer");
    expect(input).toHaveAttribute("data-filled", "false");
    await userEvent.tab();
    expect(input).toHaveFocus();
    await userEvent.keyboard("-2");
    expect(input).toHaveValue("-2");
    expect(input).toHaveAttribute("data-filled", "true");
  });
  it("wrong state sets aria-invalid and data-state", () => {
    render(<NumberSlot label="Answer" value="2" state="wrong" />);
    expect(screen.getByLabelText("Answer")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Answer")).toHaveAttribute("data-state", "wrong");
  });
  it("correct state sets data-state", () => {
    render(<NumberSlot label="Answer" value="-2" state="correct" />);
    expect(screen.getByLabelText("Answer")).toHaveAttribute("data-state", "correct");
  });
});

describe("ReasonChip and ReasonSlot", () => {
  it("chip is reachable and clickable in the tray", async () => {
    const onClick = vi.fn();
    render(<ReasonChip onClick={onClick}>N2</ReasonChip>);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });
  it("chip states change data-state; disabled blocks", () => {
    render(
      <>
        <ReasonChip state="wrong">N1</ReasonChip>
        <ReasonChip state="disabled">N4</ReasonChip>
      </>,
    );
    expect(screen.getByRole("button", { name: "N1" })).toHaveAttribute("data-state", "wrong");
    expect(screen.getByRole("button", { name: "N4" })).toBeDisabled();
  });
  it("slot shows why? when active and locked when locked", () => {
    const { rerender } = render(<ReasonSlot state="active" />);
    expect(screen.getByText("why?")).toHaveAttribute("data-state", "active");
    rerender(<ReasonSlot state="locked" />);
    expect(screen.getByText("locked")).toHaveAttribute("aria-disabled", "true");
    rerender(<ReasonSlot state="filled">N2</ReasonSlot>);
    expect(screen.getByText("N2")).toHaveAttribute("data-state", "filled");
  });
});

describe("FeedbackSheet", () => {
  it("renders the correct sheet with a live region and actions", async () => {
    render(
      <FeedbackSheet kind="correct" title="Yes, −2." actions={<Button>Continue</Button>}>
        Why.
      </FeedbackSheet>,
    );
    const sheet = screen.getByRole("status");
    expect(sheet).toHaveAttribute("data-kind", "correct");
    expect(screen.getByRole("heading", { name: "Yes, −2." })).toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Continue" })).toHaveFocus();
  });
  it("not-quite and wrong-reason kinds set data-kind", () => {
    const { rerender } = render(<FeedbackSheet kind="not-quite" title="Not quite." />);
    expect(screen.getByRole("status")).toHaveAttribute("data-kind", "not-quite");
    rerender(<FeedbackSheet kind="wrong-reason" title="Not N4." />);
    expect(screen.getByRole("status")).toHaveAttribute("data-kind", "wrong-reason");
  });
});

describe("HintDrawer", () => {
  it("shows HINT 1/2 and hides on click or keyboard", async () => {
    const onHide = vi.fn();
    render(<HintDrawer index={1} total={2} text="Look at the sign." onHide={onHide} />);
    expect(screen.getByText("HINT 1/2")).toBeInTheDocument();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onHide).toHaveBeenCalledOnce();
  });
  it("hint chip reports open state", async () => {
    const { rerender } = render(<HintChip />);
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute("aria-expanded", "false");
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Hint" })).toHaveFocus();
    rerender(<HintChip open />);
    expect(screen.getByRole("button", { name: "Hint" })).toHaveAttribute("aria-expanded", "true");
  });
});

describe("LessonBar", () => {
  it("marks done, current and next segments", () => {
    const { container } = render(<LessonBar total={5} current={3} />);
    const states = [...container.querySelectorAll("[data-state]")].map((e) =>
      e.getAttribute("data-state"),
    );
    expect(states).toEqual(["done", "done", "current", "next", "next"]);
    expect(screen.getByText("3 / 5")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  });
  it("close button is reachable", async () => {
    const onClose = vi.fn();
    render(<LessonBar total={5} current={1} onClose={onClose} />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe("RuleCard, TryBox, TrapBox", () => {
  it("rule card shows label, math and spoken form", () => {
    const { container } = render(
      <RuleCard
        label="RULE N2 · ADDITIVE INVERSE"
        statement="\va{a} + (-\va{a}) = 0"
        spoken="a plus minus a equals zero"
      />,
    );
    expect(screen.getByText("RULE N2 · ADDITIVE INVERSE")).toBeInTheDocument();
    expect(screen.getByText(/a plus minus a equals zero/)).toBeInTheDocument();
    expect(container.querySelector(".var-a")).not.toBeNull();
  });
  it("try box renders inline math", () => {
    const { container } = render(<TryBox>Start at $-3$.</TryBox>);
    expect(screen.getByText("TRY")).toBeInTheDocument();
    expect(container.querySelector(".katex")).not.toBeNull();
  });
  it("trap box answers with the keyboard and shows the result state", async () => {
    function Demo() {
      const [a, setA] = useState<boolean | null>(null);
      return <TrapBox question="True or false?" answer={a} correct={false} onAnswer={setA} />;
    }
    render(<Demo />);
    const box = screen.getByLabelText("One last trap");
    expect(box).toHaveAttribute("data-answered", "false");
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "False" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(box).toHaveAttribute("data-answered", "true");
    expect(screen.getByRole("button", { name: /False/ })).toHaveAttribute("data-state", "correct");
    expect(screen.getByRole("button", { name: /True/ })).toBeDisabled();
  });
});

describe("RichText", () => {
  it("renders $…$ parts with KaTeX and keeps plain text", () => {
    const { container } = render(<RichText text="Add $a+b$ now" />);
    expect(container.textContent).toContain("Add ");
    expect(container.querySelectorAll(".katex")).toHaveLength(1);
  });
});
