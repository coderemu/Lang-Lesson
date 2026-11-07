import type { InputHTMLAttributes } from "react";
import styles from "./NumberSlot.module.css";

export type SlotState = "default" | "wrong" | "correct";

interface NumberSlotProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  value: string;
  onChange?: (value: string) => void;
  state?: SlotState;
  /** Mobile size 76 × 60. */
  compact?: boolean;
  label: string;
}

export function NumberSlot({
  value,
  onChange,
  state = "default",
  compact = false,
  label,
  className,
  ...rest
}: NumberSlotProps) {
  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      aria-label={label}
      aria-invalid={state === "wrong" || undefined}
      className={[styles.slot, compact ? styles.compact : "", className ?? ""].join(" ")}
      data-state={state}
      data-filled={value !== ""}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      {...rest}
    />
  );
}
