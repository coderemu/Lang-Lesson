import type { ReactNode } from "react";
import type { Rule } from "../../content/schema";
import { TrapBox } from "../components";
import { ruleChipLabel } from "../content/ruleChip";
import { Math as Tex } from "../math";
import styles from "./widgets.module.css";

export interface TrapSummaryProps {
  summary: string[];
  rules: Map<string, Rule>;
  question: string;
  answer: boolean | null;
  correct: boolean;
  onAnswer: (value: boolean) => void;
  note?: ReactNode;
}

/** Summary rows and the trap box (frame S14). */
export function TrapSummary({
  summary,
  rules,
  question,
  answer,
  correct,
  onAnswer,
  note,
}: TrapSummaryProps) {
  return (
    <>
      {summary.length > 0 && (
        <div className={styles.summary} role="list" aria-label="Rules you earned">
          {summary.map((id) => {
            const r = rules.get(id);
            return r ? (
              <div key={id} className={styles.summaryRow} role="listitem">
                <span className={styles.ruleId}>{ruleChipLabel(id)}</span>
                <Tex tex={r.statement} className={styles.summaryMath} />
              </div>
            ) : null;
          })}
        </div>
      )}
      <TrapBox question={question} answer={answer} correct={correct} onAnswer={onAnswer} />
      {note}
    </>
  );
}
