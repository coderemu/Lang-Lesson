import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Math as Tex } from "../math";
import { clampInt, num, tiles, tilesTex } from "./explore";
import styles from "./widgets.module.css";

export interface SquareTilesProps {
  mode: "expand";
  spec: Record<string, number | string>;
  /** The size of a (the first part of the side). */
  value: number | null;
  onChange?: (v: number) => void;
  onEnter?: () => void;
  disabled?: boolean;
}

const W = 342;

/** Square tiles, mode `expand`: a square of side a + b split into a², two ab strips and b². */
export function SquareTiles({ spec, value, onChange, onEnter, disabled }: SquareTilesProps) {
  const reduce = useReducedMotion();
  const total = num(spec, "total", 5);
  const a = clampInt(value ?? num(spec, "a", 3), 1, total - 1);
  const t = tiles(a, total);
  const S = 150;
  const u = S / total;
  const x0 = (W - S) / 2;
  const y0 = 24;
  const interactive = !disabled && Boolean(onChange);
  const place = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const v = clampInt((x - x0) / u, 1, total - 1);
    if (v !== a) onChange?.(v);
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
      onChange?.(clampInt(a + step, 1, total - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };
  const tr = reduce ? { duration: 0.12 } : { duration: 0.12 };
  const description = `A square with side ${total}, split as ${a} and ${t.b}. The parts have areas ${t.aa}, ${t.ab}, ${t.ab} and ${t.bb}. Together they are ${t.area}.`;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.area}
        viewBox={`0 0 ${W} ${y0 + S + 22}`}
        role={interactive ? "slider" : "img"}
        aria-label="Square tiles, split the side"
        aria-valuemin={interactive ? 1 : undefined}
        aria-valuemax={interactive ? total - 1 : undefined}
        aria-valuenow={interactive ? a : undefined}
        aria-valuetext={interactive ? description : undefined}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={(e) => {
          if (!interactive) return;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          e.currentTarget.focus();
          place(e);
        }}
        onPointerMove={(e) => e.buttons === 1 && interactive && place(e)}
        onKeyDown={key}
        data-interactive={interactive}
      >
        <motion.rect
          y={y0}
          height={a * u}
          className={styles.tileA}
          initial={false}
          animate={{ x: x0, width: a * u }}
          transition={tr}
        />
        <motion.rect
          y={y0}
          height={a * u}
          className={styles.tileStrip}
          initial={false}
          animate={{ x: x0 + a * u, width: t.b * u }}
          transition={tr}
        />
        <motion.rect
          y={y0 + a * u}
          className={styles.tileStrip}
          initial={false}
          animate={{ x: x0, width: a * u, height: t.b * u }}
          transition={tr}
        />
        <motion.rect
          className={styles.tileB}
          initial={false}
          animate={{ x: x0 + a * u, y: y0 + a * u, width: t.b * u, height: t.b * u }}
          transition={tr}
        />
        {Array.from({ length: total + 1 }, (_, i) => (
          <g key={i}>
            <line x1={x0 + i * u} x2={x0 + i * u} y1={y0} y2={y0 + S} className={styles.gridLine} />
            <line x1={x0} x2={x0 + S} y1={y0 + i * u} y2={y0 + i * u} className={styles.gridLine} />
          </g>
        ))}
        <text x={x0 + (a * u) / 2} y={y0 + (a * u) / 2 + 6} className={styles.areaText}>
          {t.aa}
        </text>
        <text x={x0 + a * u + (t.b * u) / 2} y={y0 + (a * u) / 2 + 6} className={styles.areaText}>
          {t.ab}
        </text>
        <text x={x0 + (a * u) / 2} y={y0 + a * u + (t.b * u) / 2 + 6} className={styles.areaText}>
          {t.ab}
        </text>
        <text
          x={x0 + a * u + (t.b * u) / 2}
          y={y0 + a * u + (t.b * u) / 2 + 6}
          className={styles.areaText}
        >
          {t.bb}
        </text>
        <text x={x0 + (a * u) / 2} y={y0 - 8} className={styles.sideB}>
          {a}
        </text>
        <text x={x0 + a * u + (t.b * u) / 2} y={y0 - 8} className={styles.sideC}>
          {t.b}
        </text>
        <circle
          cx={x0 + a * u}
          cy={y0}
          r={11}
          className={styles.handle}
          data-testid="tiles-handle"
        />
      </svg>
      <p className={styles.equationSmall}>
        <Tex tex={tilesTex(a, t.b)} />
      </p>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}
