import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RichText } from "./RichText";

describe("RichText", () => {
  it("shows an escaped dollar sign as money, not as math", () => {
    const { container } = render(
      <RichText text={"A ticket costs \\$10 and a child ticket \\$4."} />,
    );
    expect(container.textContent).toBe("A ticket costs $10 and a child ticket $4.");
    expect(container.querySelector(".katex")).toBeNull();
  });
  it("still renders $math$", () => {
    const { container } = render(<RichText text={"Solve $x + 1 = 2$."} />);
    expect(container.querySelector(".katex")).not.toBeNull();
  });
});
