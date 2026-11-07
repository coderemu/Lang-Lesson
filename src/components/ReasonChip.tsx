import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./ReasonChip.module.css";

export type ReasonChipState = "tray" | "placed" | "wrong" | "disabled";

interface ReasonChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  state?: ReasonChipState;
  children: ReactNode;
}

export function ReasonChip({
  state = "tray",
  className,
  children,
  type = "button",
  disabled,
  ...rest
}: ReasonChipProps) {
  return (
    <button
      type={type}
      className={[styles.chip, className ?? ""].join(" ")}
      data-state={state}
      disabled={disabled || state === "disabled"}
      aria-invalid={state === "wrong" || undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

export type ReasonSlotState = "empty" | "active" | "filled" | "locked";

interface ReasonSlotProps {
  state?: ReasonSlotState;
  /** Chip content when filled. */
  children?: ReactNode;
}

export function ReasonSlot({ state = "empty", children }: ReasonSlotProps) {
  const text = state === "locked" ? "locked" : state === "active" ? "why?" : "";
  return (
    <span
      className={styles.slot}
      data-state={state}
      aria-disabled={state === "locked" || undefined}
    >
      {state === "filled" ? children : text}
    </span>
  );
}
