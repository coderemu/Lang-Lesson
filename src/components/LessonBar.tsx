import { CloseIcon } from "./icons";
import styles from "./LessonBar.module.css";

interface LessonBarProps {
  total: number;
  /** 1-based number of the current screen. */
  current: number;
  onClose?: () => void;
}

export function LessonBar({ total, current, onClose }: LessonBarProps) {
  return (
    <header className={styles.bar}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close lesson">
        <CloseIcon size={22} />
      </button>
      <div
        className={styles.segments}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={`Screen ${current} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const state = n < current ? "done" : n === current ? "current" : "next";
          return <span key={n} className={styles.segment} data-state={state} />;
        })}
      </div>
      <span className={styles.count}>
        {current} / {total}
      </span>
    </header>
  );
}
