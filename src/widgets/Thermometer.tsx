import { motion, useReducedMotion } from "motion/react";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { THERMO, clamp, fmt, spoken, thermoValueAtY, thermoY } from "./geometry";
import styles from "./widgets.module.css";

export interface ThermometerProps {
  spec: { min: number; max: number; start: number; change: number };
  /** The learner's guess. null = not placed yet. */
  value: number | null;
  onChange?: (value: number) => void;
  onEnter?: () => void;
  /** After Check: the mercury moves from `start` by `change` to the result. */
  revealed?: boolean;
  disabled?: boolean;
}

/** Thermometer, mode `guess` (frame S02). */
export function Thermometer({
  spec,
  value,
  onChange,
  onEnter,
  revealed = false,
  disabled,
}: ThermometerProps) {
  const reduce = useReducedMotion();
  const { min, max, start, change } = spec;
  const result = start + change;
  const guess = value ?? 0;
  const dragging = useRef(false);
  const interactive = !disabled && !revealed;
  const level = revealed ? result : start;
  const yLevel = thermoY(level, min, max);
  const yBottom = THERMO.top + THERMO.span + 6;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / 5) * 5; v <= max; v += 5) ticks.push(v);
  const guessY = thermoY(guess, min, max);

  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const y = ((e.clientY - box.top) / box.height) * THERMO.H;
    const v = thermoValueAtY(y, min, max);
    if (v !== value) onChange?.(v);
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const step =
      e.key === "ArrowUp" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowDown" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (step) {
      e.preventDefault();
      onChange?.(clamp(guess + step, min, max));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  const description = revealed
    ? `The temperature fell from ${spoken(start)} to ${spoken(result)} degrees. Your guess was ${spoken(guess)}.`
    : value === null
      ? `The temperature now is ${spoken(start)} degrees. Move the ring to guess where it stops.`
      : `Guess: ${spoken(guess)} degrees.`;

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.thermo}
        viewBox={`0 0 ${THERMO.W} ${THERMO.H}`}
        role={interactive ? "slider" : "img"}
        aria-label="Thermometer, guess the temperature"
        aria-valuemin={interactive ? min : undefined}
        aria-valuemax={interactive ? max : undefined}
        aria-valuenow={interactive ? guess : undefined}
        aria-valuetext={interactive ? description : undefined}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={(e) => {
          if (!interactive) return;
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          e.currentTarget.focus();
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onKeyDown={key}
        data-interactive={interactive}
      >
        <line
          x1={60}
          x2={300}
          y1={thermoY(0, min, max)}
          y2={thermoY(0, min, max)}
          className={styles.zeroLine}
        />
        <rect
          x={THERMO.tubeX}
          y={12}
          width={THERMO.tubeW}
          height={236}
          rx={12}
          className={styles.tube}
        />
        <motion.rect
          x={THERMO.tubeX + 6}
          width={12}
          rx={6}
          className={styles.mercury}
          initial={false}
          animate={{ y: yLevel, height: yBottom - yLevel }}
          transition={
            reduce
              ? { duration: 0.12 }
              : { duration: Math.min(0.9, 0.06 * Math.abs(change) + 0.12), ease: "easeOut" }
          }
        />
        {ticks.map((v) => {
          const y = thermoY(v, min, max);
          return (
            <g key={v}>
              <line x1={134} x2={156} y1={y} y2={y} className={styles.tick} />
              <text
                x={126}
                y={y + 6}
                textAnchor="end"
                className={styles.thermoLabel}
                data-bold={v === start}
                data-zero={v === 0}
              >
                {fmt(v)}
              </text>
            </g>
          );
        })}
        <text
          x={THERMO.tubeX + THERMO.tubeW + 14}
          y={thermoY(start, min, max) + 5}
          className={styles.thermoNow}
        >
          now
        </text>
        <line
          x1={THERMO.tubeX + THERMO.tubeW + 2}
          x2={222}
          y1={guessY}
          y2={guessY}
          className={styles.guessStem}
        />
        <motion.circle
          cx={236}
          r={12}
          className={styles.guessRing}
          initial={false}
          animate={{ cy: guessY }}
          transition={{ duration: reduce ? 0.12 : 0.12 }}
          data-testid="guess-ring"
          data-placed={value !== null}
        />
        <text x={260} y={guessY + 5} className={styles.guessLabel}>
          your guess
        </text>
      </svg>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}
