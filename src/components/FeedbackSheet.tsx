import type { ReactNode } from "react";
import { AlertBadge, CheckBadge } from "./icons";
import styles from "./FeedbackSheet.module.css";

export type FeedbackKind = "correct" | "not-quite" | "wrong-reason";

interface FeedbackSheetProps {
  kind: FeedbackKind;
  title: string;
  children?: ReactNode;
  /** One full-width button, or two equal buttons. */
  actions?: ReactNode;
}

export function FeedbackSheet({ kind, title, children, actions }: FeedbackSheetProps) {
  return (
    <section
      className={styles.sheet}
      data-kind={kind}
      role="status"
      aria-live="polite"
      aria-label="Feedback"
    >
      <header className={styles.head}>
        {kind === "correct" ? (
          <CheckBadge />
        ) : (
          <AlertBadge color={kind === "wrong-reason" ? "var(--color-hint)" : undefined} />
        )}
        <h2 className={styles.title}>{title}</h2>
      </header>
      {children && <div className={styles.body}>{children}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}
