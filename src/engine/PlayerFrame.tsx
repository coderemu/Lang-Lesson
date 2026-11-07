import type { FormEvent, ReactNode } from "react";
import styles from "./PlayerFrame.module.css";

interface PlayerFrameProps {
  bar: ReactNode;
  label: string;
  title: string;
  prompt?: ReactNode;
  /** Under the prompt in the text column (Try box, note). */
  aside?: ReactNode;
  /** The stage column: widget, answer row. */
  children: ReactNode;
  caption?: string;
  /** The primary button. It is the submit button of the form. */
  primary: ReactNode;
  /** Covers the action area. */
  sheet?: ReactNode;
  /** Floats above the action area. */
  drawer?: ReactNode;
  onSubmit: () => void;
}

/** The frame of the lesson and practice players (DESIGN-SYSTEM §6.1, §6.2). */
export function PlayerFrame({
  bar,
  label,
  title,
  prompt,
  aside,
  children,
  caption,
  primary,
  sheet,
  drawer,
  onSubmit,
}: PlayerFrameProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form className={styles.frame} onSubmit={submit} noValidate>
      {bar}
      <div className={styles.content}>
        <div className={styles.text}>
          <p className={styles.label}>{label}</p>
          <h1 className={styles.title}>{title}</h1>
          {prompt && <p className={styles.prompt}>{prompt}</p>}
          {aside}
        </div>
        <div className={styles.stage}>{children}</div>
      </div>
      <div className={styles.footer}>
        {drawer && <div className={styles.drawer}>{drawer}</div>}
        {sheet && <div className={styles.sheet}>{sheet}</div>}
        <div className={styles.actions}>
          {caption && <p className={styles.caption}>{caption}</p>}
          <div className={styles.primary}>{primary}</div>
        </div>
      </div>
    </form>
  );
}
