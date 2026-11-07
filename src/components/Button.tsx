import type { ButtonHTMLAttributes } from "react";
import { BulbIcon } from "./icons";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "continue" | "secondary" | "hint";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Hint variant only: the hint drawer is open. */
  open?: boolean;
  /** Full width (mobile). */
  block?: boolean;
}

export function Button({
  variant = "primary",
  open,
  block,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const cls = [styles.button, styles[variant], block ? styles.block : "", className ?? ""].join(
    " ",
  );
  return (
    <button
      type={type}
      className={cls}
      data-variant={variant}
      aria-expanded={variant === "hint" ? Boolean(open) : undefined}
      data-open={variant === "hint" ? Boolean(open) : undefined}
      {...rest}
    >
      {variant === "hint" && <BulbIcon size={20} />}
      {children}
    </button>
  );
}
