import { BulbIcon } from "./icons";
import styles from "./HintDrawer.module.css";

interface HintDrawerProps {
  /** 1 or 2. */
  index: 1 | 2;
  total: 1 | 2;
  text: string;
  onHide?: () => void;
}

/** Floats 12 px from the screen sides, just above the action area. */
export function HintDrawer({ index, total, text, onHide }: HintDrawerProps) {
  return (
    <aside className={styles.drawer} role="region" aria-label={`Hint ${index} of ${total}`}>
      <div className={styles.top}>
        <span className={styles.label}>
          HINT {index}/{total}
        </span>
        <button type="button" className={styles.hide} onClick={onHide}>
          Hide
        </button>
      </div>
      <p className={styles.body}>{text}</p>
    </aside>
  );
}

interface HintChipProps {
  onClick?: () => void;
  open?: boolean;
}

/** The closed state: a pill in the answer row. */
export function HintChip({ onClick, open = false }: HintChipProps) {
  return (
    <button
      type="button"
      className={styles.chip}
      onClick={onClick}
      aria-expanded={open}
      data-open={open}
    >
      <BulbIcon size={16} />
      Hint
    </button>
  );
}
