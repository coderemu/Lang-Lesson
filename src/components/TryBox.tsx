import type { ReactNode } from "react";
import { RichText } from "../math";
import styles from "./Boxes.module.css";

export function TryBox({ children }: { children: string | ReactNode }) {
  return (
    <aside className={styles.try} aria-label="Try">
      <p className={styles.tryLabel}>TRY</p>
      <p className={styles.tryText}>
        {typeof children === "string" ? <RichText text={children} /> : children}
      </p>
    </aside>
  );
}
