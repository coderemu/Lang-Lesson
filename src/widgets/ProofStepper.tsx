import { motion, useReducedMotion } from "motion/react";
import type { ProofInteraction } from "../../content/schema";
import { ReasonChip, ReasonSlot } from "../components";
import { Math as Tex } from "../math";
import type { ChipDef } from "./proof";
import styles from "./widgets.module.css";

export interface ProofStepperProps {
  proof: ProofInteraction;
  chips: ChipDef[];
  /** Index of the line that needs a reason; `lines.length` when the proof is complete. */
  active: number;
  /** Reason chosen for each finished line (already checked). */
  done: Record<number, string>;
  /** The chip in the active slot, before or after Check. */
  pending: string | null;
  /** The pending chip was checked and is wrong. */
  wrong: boolean;
  onPick: (chipId: string) => void;
  disabled?: boolean;
}

/** Proof stepper (frames S07–S09, D4). Lines unlock one at a time. */
export function ProofStepper({
  proof,
  chips,
  active,
  done,
  pending,
  wrong,
  onPick,
  disabled,
}: ProofStepperProps) {
  const reduce = useReducedMotion();
  const byId = new Map(chips.map((c) => [c.id, c]));
  const labelOf = (id: string, fallback?: string) => byId.get(id)?.label ?? fallback ?? id;
  const kindOf = (id: string) => byId.get(id)?.kind ?? "rule";
  const description = (() => {
    if (active >= proof.lines.length) return "The proof is complete.";
    const n = active + 1;
    return `Line ${n} of ${proof.lines.length} needs a reason.${pending ? ` Chosen: ${labelOf(pending)}.` : ""}`;
  })();

  const chip = (id: string, state: "placed" | "wrong") => (
    <ReasonChip
      state={state}
      className={kindOf(id) === "step" ? styles.stepChip : undefined}
      tabIndex={-1}
      aria-hidden="true"
    >
      {labelOf(id)}
    </ReasonChip>
  );

  return (
    <div className={styles.proof}>
      <ol className={styles.proofList} aria-label={`Proof: ${proof.goal}`}>
        {proof.lines.map((line, i) => {
          const isGiven = line.reason === null;
          const locked = !isGiven && i > active;
          const isActive = !isGiven && i === active;
          return (
            <motion.li
              key={i}
              className={styles.proofLine}
              data-state={isGiven ? "given" : locked ? "locked" : isActive ? "active" : "done"}
              aria-disabled={locked || undefined}
              initial={false}
              animate={{ opacity: locked ? 0.45 : 1 }}
              transition={{ duration: reduce ? 0.12 : 0.18 }}
            >
              <Tex tex={line.math} className={styles.proofMath} />
              <span className={styles.proofReason}>
                {isGiven && <span className={styles.given}>given</span>}
                {!isGiven && i < active && done[i] && chip(done[i], "placed")}
                {isActive && pending ? (
                  <ReasonSlot state="filled">
                    {chip(pending, wrong ? "wrong" : "placed")}
                  </ReasonSlot>
                ) : null}
                {isActive && !pending && <ReasonSlot state="active" />}
                {locked && <ReasonSlot state="locked" />}
              </span>
            </motion.li>
          );
        })}
      </ol>
      <div className={styles.tray} role="group" aria-label="Reasons">
        {chips.map((c) => (
          <ReasonChip
            key={c.id}
            state="tray"
            className={c.kind === "step" ? styles.stepChip : undefined}
            disabled={disabled || active >= proof.lines.length}
            aria-pressed={pending === c.id}
            onClick={() => onPick(c.id)}
          >
            {c.label}
          </ReasonChip>
        ))}
      </div>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </div>
  );
}
