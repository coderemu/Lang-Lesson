import type { ButtonHTMLAttributes } from "react";
import { AlertBadge, CheckBadge } from "./icons";
import styles from "./ChoiceChip.module.css";

export type ChoiceState = "default" | "correct" | "wrong";

interface ChoiceChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  selected?: boolean;
  /** Result after Check. Words and an icon carry the meaning, not colour alone. */
  state?: ChoiceState;
}

export function ChoiceChip({
  selected = false,
  state = "default",
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ChoiceChipProps) {
  const cls = [styles.chip, className ?? ""].join(" ");
  return (
    <button
      type={type}
      className={cls}
      aria-pressed={selected}
      data-state={state}
      data-selected={selected}
      disabled={disabled}
      {...rest}
    >
      {state === "correct" && <CheckBadge size={20} />}
      {state === "wrong" && <AlertBadge size={20} />}
      <span>{children}</span>
      {state === "correct" && <span className="sr-only"> (correct)</span>}
      {state === "wrong" && <span className="sr-only"> (not quite)</span>}
    </button>
  );
}
