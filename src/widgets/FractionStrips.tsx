import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent } from "react";
import { Math as Tex } from "../math";
import { addFractions, clampInt, cutPieces, maxCuts, num } from "./explore";
import styles from "./widgets.module.css";

export interface FractionStripsProps {
  mode: "cut" | "add" | "invert";
  spec: Record<string, number | string | number[]>;
  /** cut: times cut; add: step 0–2; invert: 0 or 1. */
  value: number | null;
  onChange?: (v: number) => void;
  onEnter?: () => void;
  disabled?: boolean;
}

const W = 342;
const BAR_X = 21;
const BAR_W = 300;
const BAR_H = 36;

function Strip({
  y,
  units = 1,
  pieces,
  shaded,
  label,
  tone = "main",
  reduce,
}: {
  y: number;
  /** Length of the strip in units of 1. */
  units?: number;
  pieces: number;
  shaded: number;
  label: string;
  tone?: "main" | "result";
  reduce: boolean;
}) {
  const unitW = BAR_W / Math.max(1, Math.ceil(units));
  const width = unitW * units;
  const pw = width / pieces;
  return (
    <g>
      <rect x={BAR_X} y={y} width={width} height={BAR_H} rx={4} className={styles.stripBase} />
      <motion.rect
        x={BAR_X}
        y={y}
        height={BAR_H}
        rx={4}
        className={tone === "result" ? styles.stripSum : styles.stripShade}
        initial={false}
        animate={{ width: shaded * pw }}
        transition={{ duration: reduce ? 0.12 : 0.18 }}
      />
      {Array.from({ length: pieces + 1 }, (_, i) => (
        <line
          key={i}
          x1={BAR_X + i * pw}
          x2={BAR_X + i * pw}
          y1={y}
          y2={y + BAR_H}
          className={styles.stripLine}
        />
      ))}
      <text x={BAR_X + width + 6} y={y + BAR_H / 2 + 5} className={styles.stripLabel}>
        {label}
      </text>
    </g>
  );
}

/** Fraction strips with modes cut, add and invert (DESIGN-SYSTEM §5). */
export function FractionStrips({
  mode,
  spec,
  value,
  onChange,
  onEnter,
  disabled,
}: FractionStripsProps) {
  const reduce = Boolean(useReducedMotion());
  const interactive = !disabled && Boolean(onChange);
  const v = value ?? 0;
  const key = (min: number, max: number) => (e: KeyboardEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (step) {
      e.preventDefault();
      onChange?.(clampInt(v + step, min, max));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };
  const common = (
    min: number,
    max: number,
    label: string,
    height: number,
    description: string,
    children: React.ReactNode,
  ) => (
    <figure className={styles.figure}>
      <svg
        className={styles.area}
        viewBox={`0 0 ${W} ${height}`}
        role={interactive ? "slider" : "img"}
        aria-label={label}
        aria-valuemin={interactive ? min : undefined}
        aria-valuemax={interactive ? max : undefined}
        aria-valuenow={interactive ? v : undefined}
        aria-valuetext={interactive ? description : undefined}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={(e) => {
          if (!interactive) return;
          e.currentTarget.focus();
          onChange?.(v >= max ? max : v + 1);
        }}
        onKeyDown={key(min, max)}
        data-interactive={interactive}
      >
        {children}
      </svg>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );

  if (mode === "cut") {
    const n = num(spec, "num", 1);
    const d = num(spec, "den", 2);
    const limit = maxCuts(d, num(spec, "max", 16));
    const k = clampInt(v, 0, limit);
    const p = cutPieces(n, d, k);
    return (
      <div className={styles.figure}>
        {common(
          0,
          limit,
          "Fraction strip, cut into smaller pieces",
          70,
          `The strip is cut into ${p.pieces} pieces. ${p.shaded} are shaded. The shaded length is the same: ${n} out of ${d}.`,
          <Strip y={16} pieces={p.pieces} shaded={p.shaded} label="" reduce={reduce} />,
        )}
        <p className={styles.equationSmall}>
          <Tex tex={`\\dfrac{${n}}{${d}} = \\dfrac{${p.shaded}}{${p.pieces}}`} />
        </p>
        {interactive && (
          <button
            type="button"
            className={styles.mini}
            onClick={() => onChange?.(Math.min(limit, k + 1))}
            disabled={k >= limit}
          >
            Cut each piece in two
          </button>
        )}
      </div>
    );
  }

  if (mode === "add") {
    const n1 = num(spec, "n1", 2);
    const d1 = num(spec, "d1", 3);
    const n2 = num(spec, "n2", 1);
    const d2 = num(spec, "d2", 4);
    const f = addFractions(n1, d1, n2, d2);
    const step = clampInt(v, 0, d1 === d2 ? 1 : 2);
    const units = Math.max(1, Math.ceil(f.sum / f.d));
    const same = step >= (d1 === d2 ? 0 : 1);
    const pieces = (d: number) => (step >= 1 && d1 !== d2 ? f.d : d) * units;
    const sh1 = step >= 1 && d1 !== d2 ? f.a : n1;
    const sh2 = step >= 1 && d1 !== d2 ? f.b : n2;
    const desc =
      step === 0
        ? `Two strips: ${n1} out of ${d1}, and ${n2} out of ${d2}.`
        : step === 1 && d1 !== d2
          ? `Both strips use ${f.d} pieces: ${f.a} out of ${f.d}, and ${f.b} out of ${f.d}.`
          : `Together: ${f.sum} out of ${f.d}.`;
    void same;
    return (
      <div className={styles.figure}>
        {common(
          0,
          d1 === d2 ? 1 : 2,
          "Fraction strips, add two fractions",
          150,
          desc,
          <>
            <Strip y={8} units={units} pieces={pieces(d1)} shaded={sh1} label="" reduce={reduce} />
            <Strip y={56} units={units} pieces={pieces(d2)} shaded={sh2} label="" reduce={reduce} />
            {step >= (d1 === d2 ? 1 : 2) && (
              <Strip
                y={104}
                units={units}
                pieces={f.d * units}
                shaded={f.sum}
                label=""
                tone="result"
                reduce={reduce}
              />
            )}
          </>,
        )}
        <p className={styles.equationSmall}>
          <Tex
            tex={
              step === 0 && d1 !== d2
                ? `\\dfrac{${n1}}{${d1}} + \\dfrac{${n2}}{${d2}}`
                : step >= (d1 === d2 ? 1 : 2)
                  ? `\\dfrac{${f.a}}{${f.d}} + \\dfrac{${f.b}}{${f.d}} = \\dfrac{${f.sum}}{${f.d}}`
                  : `\\dfrac{${f.a}}{${f.d}} + \\dfrac{${f.b}}{${f.d}}`
            }
          />
        </p>
      </div>
    );
  }

  const m = num(spec, "m", 2);
  const n = num(spec, "n", 3);
  const flipped = clampInt(v, 0, 1) === 1;
  const units = Math.max(1, Math.ceil(Math.max(m / n, n / m)));
  return (
    <div className={styles.figure}>
      {common(
        0,
        1,
        "Fraction strips, turn the fraction upside down",
        flipped ? 110 : 62,
        flipped
          ? `Turned over: ${n} out of ${m}. The product is 1.`
          : `The fraction ${m} out of ${n}.`,
        <>
          <Strip y={10} units={units} pieces={n * units} shaded={m} label="" reduce={reduce} />
          {flipped && (
            <Strip
              y={58}
              units={units}
              pieces={m * units}
              shaded={n}
              label=""
              tone="result"
              reduce={reduce}
            />
          )}
        </>,
      )}
      <p className={styles.equationSmall}>
        <Tex
          tex={
            flipped ? `\\dfrac{${m}}{${n}} \\cdot \\dfrac{${n}}{${m}} = 1` : `\\dfrac{${m}}{${n}}`
          }
        />
      </p>
      {interactive && (
        <button
          type="button"
          className={styles.mini}
          onClick={() => onChange?.(flipped ? 0 : 1)}
          aria-pressed={flipped}
        >
          Turn upside down
        </button>
      )}
    </div>
  );
}
