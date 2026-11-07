import { RichText } from "../math";
import { ChoiceChip } from "./ChoiceChip";
import styles from "./Boxes.module.css";

interface TrapBoxProps {
  question: string;
  /** null until the learner answers. */
  answer: boolean | null;
  /** The correct answer to the question. */
  correct: boolean;
  onAnswer?: (value: boolean) => void;
}

export function TrapBox({ question, answer, correct, onAnswer }: TrapBoxProps) {
  const answered = answer !== null;
  const stateFor = (value: boolean) =>
    !answered || answer !== value ? "default" : value === correct ? "correct" : "wrong";
  return (
    <aside className={styles.trap} aria-label="One last trap" data-answered={answered}>
      <p className={styles.trapLabel}>ONE LAST TRAP</p>
      <p className={styles.trapText}>
        <RichText text={question} />
      </p>
      <div className={styles.chips} role="group" aria-label="True or false">
        {[true, false].map((value) => (
          <ChoiceChip
            key={String(value)}
            selected={answer === value}
            state={stateFor(value)}
            disabled={answered}
            onClick={() => onAnswer?.(value)}
          >
            {value ? "True" : "False"}
          </ChoiceChip>
        ))}
      </div>
    </aside>
  );
}
