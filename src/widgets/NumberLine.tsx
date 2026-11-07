import { motion, useReducedMotion } from "motion/react";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { NumberLineSpec } from "../../content/schema";
import { Math as Tex } from "../math";
import {
  AXIS_Y,
  LINE_H,
  LINE_W,
  clamp,
  fmt,
  hopsBetween,
  spoken,
  splitEquation,
  valueAtX,
  xOf,
} from "./geometry";
import styles from "./widgets.module.css";

export type WidgetState = "idle" | "correct" | "wrong";

export interface NumberLineProps {
  mode: "place" | "hops" | "compare" | "mirror";
  spec: NumberLineSpec;
  /** The learner's ring. null = not moved yet. */
  value: number | null;
  onChange?: (value: number) => void;
  /** Enter checks the answer. */
  onEnter?: () => void;
  disabled?: boolean;
  state?: WidgetState;
  /** TeX with "?" for the live equation of `hops`. */
  equation?: string;
  label?: string;
}

const HOP_S = 0.24; // 240 ms per unit (DESIGN-SYSTEM §7)

/** Number line with modes place, hops, compare and mirror. SVG viewBox 342 × 120 (frame S01). */
export function NumberLine(props: NumberLineProps) {
  const { mode, spec, value, onChange, disabled, state = "idle" } = props;
  const reduce = useReducedMotion();
  const { min, max } = spec;
  const ring = value ?? spec.ringStart ?? 0;
  const interactive = (mode === "place" || mode === "hops") && !disabled;
  const dragging = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const setFromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * LINE_W;
    const v = valueAtX(x, min, max);
    if (v !== value) onChange?.(v);
  };
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.focus();
    setFromPointer(e);
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) setFromPointer(e);
  };
  const up = () => {
    dragging.current = false;
  };
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!interactive) return;
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (step) {
      e.preventDefault();
      onChange?.(clamp(ring + step, min, max));
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange?.(min);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange?.(max);
    } else if (e.key === "Enter") {
      e.preventDefault();
      props.onEnter?.();
    }
  };

  const ringColor =
    state === "correct"
      ? "var(--color-correct)"
      : state === "wrong"
        ? "var(--color-incorrect)"
        : "var(--color-negative)";

  /* Description for screen readers; it changes with the state (NFR-01). */
  const start = spec.start ?? 0;
  let description = "";
  if (mode === "place") description = `Ring at ${spoken(ring)}.`;
  if (mode === "hops") {
    const h = hopsBetween(start, ring);
    description = `Ring at ${spoken(ring)}. ${h.n} ${h.n === 1 ? "hop" : "hops"}${h.dir === "none" ? "" : ` to the ${h.dir}`} of ${spoken(start)}.`;
  }
  if (mode === "mirror")
    description = `${spoken(spec.mirrorOf ?? 0)} and ${spoken(-(spec.mirrorOf ?? 0))} are mirror points across 0.`;
  if (mode === "compare")
    description = (spec.paths ?? [])
      .map(
        (p) =>
          `${p.start} plus ${p.adds.join(" plus ")} ends at ${p.adds.reduce((a, b) => a + b, p.start)}.`,
      )
      .join(" ");

  const eq = props.equation ? splitEquation(props.equation) : null;
  const moved = value !== null;

  return (
    <figure className={styles.figure} data-mode={mode}>
      {mode === "hops" && eq && (
        <p className={styles.equation} data-testid="hops-equation">
          <Tex tex={eq.left} />{" "}
          <span className={styles.eqValue} data-moved={moved}>
            {moved ? fmt(ring) : "?"}
          </span>
          {eq.right && <Tex tex={eq.right} />}
        </p>
      )}
      {mode === "compare" ? (
        <ComparePaths spec={spec} reduce={Boolean(reduce)} />
      ) : (
        <svg
          ref={svgRef}
          className={styles.line}
          viewBox={`0 0 ${LINE_W} ${LINE_H}`}
          role={interactive ? "slider" : "img"}
          aria-label={
            props.label ?? (mode === "hops" ? "Number line, make the hops" : "Number line")
          }
          aria-valuemin={interactive ? min : undefined}
          aria-valuemax={interactive ? max : undefined}
          aria-valuenow={interactive ? ring : undefined}
          aria-valuetext={interactive ? description : undefined}
          aria-disabled={disabled || undefined}
          tabIndex={interactive ? 0 : -1}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={key}
          data-interactive={interactive}
        >
          <Axis
            min={min}
            max={max}
            bold={
              mode === "place" || mode === "hops"
                ? ring
                : mode === "mirror"
                  ? spec.mirrorOf
                  : undefined
            }
          />
          {mode === "place" && !moved && !disabled && (
            <path
              d={`M ${xOf(ring, min, max) + 8} 56 Q ${xOf(ring, min, max) + 40} 20 ${xOf(ring, min, max) + 78} 38`}
              className={styles.dragHint}
            />
          )}
          {mode === "hops" && <Hops spec={spec} ring={ring} reduce={Boolean(reduce)} />}
          {mode === "mirror" && <Mirror spec={spec} reduce={Boolean(reduce)} />}
          {(mode === "place" || mode === "hops") && (
            <motion.circle
              r={10}
              cy={AXIS_Y}
              className={styles.ring}
              style={{ stroke: ringColor }}
              initial={false}
              animate={{ cx: xOf(ring, min, max) }}
              transition={reduce ? { duration: 0.12 } : { duration: HOP_S, ease: "easeOut" }}
              data-testid="ring"
            />
          )}
        </svg>
      )}
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}

function Axis({
  min,
  max,
  bold,
  boldAlso,
}: {
  min: number;
  max: number;
  bold?: number;
  boldAlso?: number[];
}) {
  const ticks: number[] = [];
  for (let v = min; v <= max; v++) ticks.push(v);
  return (
    <g>
      <line x1={10} x2={LINE_W - 10} y1={AXIS_Y} y2={AXIS_Y} className={styles.axis} />
      {ticks.map((v) => {
        const x = xOf(v, min, max);
        const h = v === 0 ? 12 : 6;
        return (
          <g key={v}>
            <line x1={x} x2={x} y1={AXIS_Y - h} y2={AXIS_Y + h} className={styles.tick} />
            <text
              x={x}
              y={98}
              className={styles.tickLabel}
              data-bold={v === bold || boldAlso?.includes(v)}
              data-zero={v === 0}
            >
              {fmt(v)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** One orange arc per unit, and the step numbers above them (frame S03). */
function Hops({ spec, ring, reduce }: { spec: NumberLineSpec; ring: number; reduce: boolean }) {
  const start = spec.start ?? 0;
  const { min, max } = spec;
  const { n, dir } = hopsBetween(start, ring);
  const sign = dir === "left" ? -1 : 1;
  // Arcs that were already drawn do not wait; new arcs follow one after the other (240 ms each).
  const [seen, setSeen] = useState(n);
  const [before, setBefore] = useState(n);
  if (seen !== n) {
    setBefore(Math.min(seen, n));
    setSeen(n);
  }
  const arcs = Array.from({ length: n }, (_, i) => {
    const x1 = xOf(start + sign * i, min, max);
    const x2 = xOf(start + sign * (i + 1), min, max);
    return { i, x1, x2 };
  });
  return (
    <g>
      {arcs.map(({ i, x1, x2 }) => {
        const delay = reduce ? 0 : Math.max(0, i - before) * HOP_S;
        return (
          <g key={`${start}-${sign}-${i}`}>
            <motion.path
              d={`M ${x1} 62 Q ${(x1 + x2) / 2} 36 ${x2} 62`}
              className={styles.hop}
              initial={reduce ? { opacity: 0 } : { pathLength: 0 }}
              animate={reduce ? { opacity: 1 } : { pathLength: 1 }}
              transition={reduce ? { duration: 0.12 } : { duration: HOP_S, delay, ease: "easeOut" }}
            />
            <motion.text
              x={(x1 + x2) / 2}
              y={30}
              className={styles.hopNumber}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: reduce ? 0.12 : 0.12,
                delay: delay + (reduce ? 0 : HOP_S * 0.6),
              }}
            >
              {i + 1}
            </motion.text>
          </g>
        );
      })}
      <circle cx={xOf(start, min, max)} cy={AXIS_Y} r={7} className={styles.startDot} />
    </g>
  );
}

/** a and −a, with a dashed arc over 0 (frame S06). */
function Mirror({ spec, reduce }: { spec: NumberLineSpec; reduce: boolean }) {
  const a = spec.mirrorOf ?? 0;
  const { min, max } = spec;
  const xa = xOf(a, min, max);
  const xm = xOf(-a, min, max);
  const x0 = xOf(0, min, max);
  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: reduce ? 0.12 : 0.24 },
  };
  return (
    <g>
      <line x1={x0} x2={x0} y1={20} y2={AXIS_Y - 14} className={styles.mirrorAxis} />
      <motion.path
        d={`M ${xa} 60 Q ${x0} -4 ${xm} 60`}
        className={styles.mirrorArcDashed}
        {...fade}
      />
      <motion.path d={`M ${xa} 60 Q ${x0} 20 ${xm} 60`} className={styles.mirrorArc} {...fade} />
      <circle cx={xa} cy={AXIS_Y} r={7} className={styles.dotA} />
      <circle cx={xm} cy={AXIS_Y} r={9} className={styles.dotMinusA} />
    </g>
  );
}

/** Two paths side by side (frame S04). */
function ComparePaths({ spec, reduce }: { spec: NumberLineSpec; reduce: boolean }) {
  const { min, max } = spec;
  const paths = spec.paths ?? [];
  const rowH = 72;
  return (
    <svg
      className={styles.line}
      viewBox={`0 0 ${LINE_W} ${rowH * paths.length + 4}`}
      role="img"
      aria-label="Two paths on the number line"
    >
      {paths.map((p, k) => {
        const y = 38 + k * rowH;
        const label = `${fmt(p.start)}${p.adds.map((a) => ` ${a < 0 ? "−" : "+"} ${Math.abs(a)}`).join("")}`;
        const end = p.adds.reduce((s, a) => s + a, p.start);
        const marks = [...new Set([min, 0, p.start, end, max])].filter((v) => v >= min && v <= max);
        return (
          <g key={k}>
            <text x={2} y={y - 22} className={styles.pathLabel}>
              {label}
            </text>
            <line x1={10} x2={LINE_W - 10} y1={y} y2={y} className={styles.axis} />
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((v) => (
              <line
                key={v}
                x1={xOf(v, min, max)}
                x2={xOf(v, min, max)}
                y1={y - 5}
                y2={y + 5}
                className={styles.tick}
              />
            ))}
            {marks.map((v) => (
              <text
                key={v}
                x={xOf(v, min, max)}
                y={y + 22}
                className={styles.tickLabel}
                data-bold={v === end}
                data-zero={v === 0}
              >
                {fmt(v)}
              </text>
            ))}
            {pathUnits(p).map(({ from, to }, i) => {
              const x1 = xOf(from, min, max);
              const x2 = xOf(to, min, max);
              return (
                <motion.path
                  key={i}
                  d={`M ${x1} ${y - 4} Q ${(x1 + x2) / 2} ${y - 22} ${x2} ${y - 4}`}
                  className={styles.hopPlus}
                  initial={reduce ? { opacity: 0 } : { pathLength: 0 }}
                  animate={reduce ? { opacity: 1 } : { pathLength: 1 }}
                  transition={{ duration: 0.12, delay: reduce ? 0 : i * 0.06 }}
                />
              );
            })}
            <circle cx={xOf(p.start, min, max)} cy={y} r={6} className={styles.startDot} />
            <circle cx={xOf(end, min, max)} cy={y} r={6} className={styles.dotA} />
          </g>
        );
      })}
    </svg>
  );
}

/** Each unit move of a path: from one integer to the next. */
export function pathUnits(p: { start: number; adds: number[] }): { from: number; to: number }[] {
  const units: { from: number; to: number }[] = [];
  let at = p.start;
  for (const add of p.adds) {
    const dir = add < 0 ? -1 : 1;
    for (let i = 0; i < Math.abs(add); i++) {
      units.push({ from: at, to: at + dir });
      at += dir;
    }
  }
  return units;
}
