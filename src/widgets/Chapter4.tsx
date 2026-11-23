import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { Math as Tex } from "../math";
import { clampInt, num } from "./explore";
import { cornerFits, discriminant, realRoots, rootCount } from "./ch4";
import { fmt } from "./geometry";
import styles from "./widgets.module.css";
import c4 from "./ch4.module.css";

/* ───────── Square tiles · complete ───────── */

export interface CompleteTilesProps {
  /** b: the coefficient in x² + bx. Use an even number. */
  spec: Record<string, number | string>;
  /** Side of the corner tile the learner has chosen. */
  value: number | null;
  onChange?: (v: number) => void;
  onEnter?: () => void;
  disabled?: boolean;
}

const W = 342;

/** x² and two strips of bx/2. Drag the orange corner to the gap. Only a (b/2) × (b/2) tile fits. */
export function CompleteTiles({ spec, value, onChange, onEnter, disabled }: CompleteTilesProps) {
  const b = num(spec, "b", 6);
  const half = b / 2;
  const s = clampInt(value ?? 1, 1, b);
  const u = 120 / b;
  const X = 110; // side of x² (x is not a number: the picture is symbolic)
  const x0 = (W - X - b * u) / 2 + 20;
  const y0 = 24;
  const gx = x0 + X;
  const gy = y0 + X;
  const fit = cornerFits(s, b);
  const interactive = !disabled && Boolean(onChange);
  const place = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const v = clampInt((x - gx) / u, 1, b);
    if (v !== s) onChange?.(v);
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
      onChange?.(clampInt(s + step, 1, b));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };
  const gap = `The gap in the corner is ${half} by ${half}.`;
  const description = fit
    ? `${gap} The corner tile is ${s} by ${s}. It fits. The area is ${s * s}. Now x squared plus ${b}x plus ${s * s} is the square of x plus ${half}.`
    : `${gap} The corner tile is ${s} by ${s}. It does not fit: it is too ${s < half ? "small" : "big"}.`;
  return (
    <figure className={styles.figure} data-testid="complete-tiles">
      <svg
        className={styles.area}
        viewBox={`0 0 ${W} ${y0 + X + b * u + 6}`}
        role={interactive ? "slider" : "img"}
        aria-label="Square tiles, complete the square"
        aria-valuemin={interactive ? 1 : undefined}
        aria-valuemax={interactive ? b : undefined}
        aria-valuenow={interactive ? s : undefined}
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
        <rect x={x0} y={y0} width={X} height={X} className={styles.tileA} />
        <rect x={gx} y={y0} width={half * u} height={X} className={styles.tileStrip} />
        <rect x={x0} y={gy} width={X} height={half * u} className={styles.tileStrip} />
        <text x={x0 + X / 2} y={y0 + X / 2 + 6} className={styles.areaText}>
          x²
        </text>
        <text x={gx + (half * u) / 2} y={y0 + X / 2 + 6} className={styles.areaText}>
          {fmt(half)}x
        </text>
        <text x={x0 + X / 2} y={gy + (half * u) / 2 + 6} className={styles.areaText}>
          {fmt(half)}x
        </text>
        <rect x={gx} y={gy} width={half * u} height={half * u} className={c4.gap} />
        <rect
          x={gx}
          y={gy}
          width={s * u}
          height={s * u}
          className={c4.tile}
          data-fit={fit}
          data-testid="corner-tile"
        />
        <text x={gx + (s * u) / 2} y={gy + (s * u) / 2 + 6} className={styles.areaText}>
          {s}×{s}
        </text>
        <circle
          cx={gx + s * u}
          cy={gy + s * u}
          r={11}
          className={styles.handle}
          data-testid="complete-handle"
        />
      </svg>
      <p className={styles.equationSmall}>
        {fit ? (
          <Tex tex={`x^2 + ${b}x + ${s * s} = (x + ${half})^2`} />
        ) : (
          <span>
            {s} × {s} does not fit
          </span>
        )}
      </p>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}

/* ───────── Discriminant slider ───────── */

export interface DiscriminantSliderProps {
  /** Start values of a, b and c. */
  spec: Record<string, number | string>;
  disabled?: boolean;
}

const AX = { min: -8, max: 8, w: 342, pad: 21 };
const axisX = (v: number) => AX.pad + ((v - AX.min) / (AX.max - AX.min)) * (AX.w - 2 * AX.pad);

/** Sliders for a, b and c. The readout shows b² − 4ac and the real roots on a number line. */
export function DiscriminantSlider({ spec, disabled }: DiscriminantSliderProps) {
  const [abc, setAbc] = useState<[number, number, number]>([
    clampInt(num(spec, "a", 1), 1, 3),
    clampInt(num(spec, "b", 2), -6, 6),
    clampInt(num(spec, "c", -3), -6, 6),
  ]);
  const [a, b, c] = abc;
  const d = discriminant(a, b, c);
  const roots = realRoots(a, b, c);
  const count = rootCount(d);
  const roundTo = (v: number) => Math.round(v * 100) / 100;
  const where = roots.map((r) => roundTo(r)).join(" and ");
  const description =
    count === 0
      ? `a is ${a}, b is ${b}, c is ${c}. b squared minus 4ac is ${d}. It is negative. No real solution.`
      : `a is ${a}, b is ${b}, c is ${c}. b squared minus 4ac is ${d}. ${
          count === 2 ? `Two solutions, at ${where}` : `One solution, at ${where}`
        }.`;
  const set = (k: 0 | 1 | 2, v: number) =>
    setAbc((p) => p.map((x, i) => (i === k ? v : x)) as [number, number, number]);
  const rows: { k: 0 | 1 | 2; name: string; min: number; max: number }[] = [
    { k: 0, name: "a", min: 1, max: 3 },
    { k: 1, name: "b", min: -6, max: 6 },
    { k: 2, name: "c", min: -6, max: 6 },
  ];
  const Y = 40;
  return (
    <figure className={styles.figure} data-testid="discriminant-slider">
      <svg className={styles.area} viewBox={`0 0 ${AX.w} 70`} role="img" aria-label={description}>
        <line x1={axisX(AX.min)} x2={axisX(AX.max)} y1={Y} y2={Y} className={styles.axis} />
        {Array.from({ length: AX.max - AX.min + 1 }, (_, i) => AX.min + i)
          .filter((v) => v % 2 === 0)
          .map((v) => (
            <g key={v}>
              <line x1={axisX(v)} x2={axisX(v)} y1={Y - 6} y2={Y + 6} className={styles.tick} />
              <text x={axisX(v)} y={Y + 26} className={styles.tickLabel}>
                {fmt(v)}
              </text>
            </g>
          ))}
        {roots.map((r) => (
          <circle
            key={r}
            cx={axisX(Math.max(AX.min, Math.min(AX.max, r)))}
            cy={Y}
            r={9}
            className={c4.root}
            data-testid="root-dot"
          />
        ))}
      </svg>
      <div className={c4.sliders}>
        {rows.map((r) => (
          <label key={r.name} className={c4.sliderRow}>
            <Tex tex={r.name} />
            <input
              type="range"
              min={r.min}
              max={r.max}
              step={1}
              value={abc[r.k]}
              disabled={disabled}
              aria-label={`Value of ${r.name}`}
              onChange={(e) => set(r.k, Number(e.target.value))}
            />
            <span className={c4.value}>{fmt(abc[r.k])}</span>
          </label>
        ))}
      </div>
      <p className={styles.equationSmall}>
        <Tex tex={`b^2 - 4ac = ${b < 0 ? `(${b})` : b}^2 - 4(${a})(${c}) = ${d}`} />
      </p>
      <p className={c4.note} data-testid="root-note">
        {count === 0
          ? "No real solution."
          : count === 1
            ? `One solution: x = ${fmt(roundTo(roots[0]))}`
            : `Two solutions: x = ${roots.map((r) => fmt(roundTo(r))).join(" and x = ")}`}
      </p>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}
