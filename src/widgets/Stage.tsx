import type { ReactNode } from "react";
import styles from "./widgets.module.css";

/** The grey stage every widget sits on (DESIGN-SYSTEM §5): surface fill, radius 20. */
export function Stage({
  children,
  readout,
  tone = "neutral",
}: {
  children: ReactNode;
  /** Live readout under the widget, for example "Ring at −3". */
  readout?: ReactNode;
  tone?: "neutral" | "correct" | "wrong";
}) {
  return (
    <div className={styles.stage} data-tone={tone}>
      {children}
      {readout && <p className={styles.readout}>{readout}</p>}
    </div>
  );
}
