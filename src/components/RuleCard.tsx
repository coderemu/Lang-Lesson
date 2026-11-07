import type { ReactNode } from "react";
import { Math } from "../math";
import styles from "./RuleCard.module.css";

interface RuleCardProps {
  /** "RULE N2 · ADDITIVE INVERSE" */
  label: string;
  /** TeX of the statement. */
  statement: string;
  /** "a plus minus a equals zero" */
  spoken?: string;
  picture?: ReactNode;
}

export function RuleCard({ label, statement, spoken, picture }: RuleCardProps) {
  return (
    <article className={styles.card} aria-label={label}>
      <p className={styles.label}>{label}</p>
      <Math tex={statement} className={styles.statement} />
      {picture && <div className={styles.picture}>{picture}</div>}
      {spoken && <p className={styles.spoken}>Say: {spoken}</p>}
    </article>
  );
}
