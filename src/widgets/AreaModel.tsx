import { motion, useReducedMotion } from "motion/react";
import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { Math as Tex } from "../math";
import { distribute, distributeTex, doubling, clampInt, fmtNumber, num, width2 } from "./explore";
import styles from "./widgets.module.css";

export interface AreaModelProps {
  mode: "distribute" | "width-2" | "doubling-strip";
  spec: Record<string, number | string>;
  /** distribute: the split; width-2: the number N; doubling-strip: the steps done. */
  value: number | null;
  onChange?: (v: number) => void;
  onEnter?: () => void;
  disabled?: boolean;
}

const W = 342;

/** Area model with modes distribute, width-2 and doubling-strip (DESIGN-SYSTEM §5). */
export function AreaModel(props: AreaModelProps) {
  const { mode, spec, disabled } = props;
  const reduce = useReducedMotion();
  if (mode === "distribute") return <Distribute {...props} reduce={Boolean(reduce)} />;
  if (mode === "width-2") return <Width2 {...props} reduce={Boolean(reduce)} />;
  void disabled;
  return <Doubling {...props} spec={spec} reduce={Boolean(reduce)} />;
}

function useSlider(
  min: number,
  max: number,
  value: number,
  onChange: ((v: number) => void) | undefined,
  onEnter: (() => void) | undefined,
  enabled: boolean,
) {
  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!enabled) return;
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (step) {
      e.preventDefault();
      onChange?.(clampInt(value + step, min, max));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };
  return key;
}

function Distribute({
  spec,
  value,
  onChange,
  onEnter,
  disabled,
  reduce,
}: AreaModelProps & { reduce: boolean }) {
  const a = num(spec, "a", 3);
  const b = num(spec, "b", 4);
  const c = num(spec, "c", 2);
  const total = b + c;
  const [turned, setTurned] = useState(false);
  const split = clampInt(value ?? b, 1, total - 1);
  const d = distribute(a, split, total);
  const rows = turned ? total : a;
  const cols = turned ? a : total;
  const u = Math.min(300 / cols, 130 / rows, 40);
  const x0 = (W - cols * u) / 2;
  const y0 = 34;
  const interactive = !disabled && !turned && Boolean(onChange);
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.focus();
    place(e);
  };
  const place = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const v = clampInt((x - x0) / u, 1, total - 1);
    if (v !== split) onChange?.(v);
  };
  const key = useSlider(1, total - 1, split, onChange, onEnter, interactive);
  const description = turned
    ? `The rectangle is turned: ${total} by ${a}. The area is ${d.area}, the same as ${a} by ${total}.`
    : `${a} times ${total} is split into ${a} times ${split} and ${a} times ${d.right}. The areas are ${d.areaLeft} and ${d.areaRight}. Together they are ${d.area}.`;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.area}
        viewBox={`0 0 ${W} ${y0 + rows * u + 34}`}
        role={interactive ? "slider" : "img"}
        aria-label="Area model, split the rectangle"
        aria-valuemin={interactive ? 1 : undefined}
        aria-valuemax={interactive ? total - 1 : undefined}
        aria-valuenow={interactive ? split : undefined}
        aria-valuetext={interactive ? description : undefined}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={down}
        onPointerMove={(e) => e.buttons === 1 && interactive && place(e)}
        onKeyDown={key}
        data-interactive={interactive}
      >
        {turned ? (
          <rect x={x0} y={y0} width={cols * u} height={rows * u} className={styles.partB} />
        ) : (
          <>
            <motion.rect
              y={y0}
              height={rows * u}
              className={styles.partB}
              initial={false}
              animate={{ x: x0, width: split * u }}
              transition={{ duration: reduce ? 0.12 : 0.12 }}
            />
            <motion.rect
              y={y0}
              height={rows * u}
              className={styles.partC}
              initial={false}
              animate={{ x: x0 + split * u, width: (total - split) * u }}
              transition={{ duration: reduce ? 0.12 : 0.12 }}
            />
          </>
        )}
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={x0 + i * u}
            x2={x0 + i * u}
            y1={y0}
            y2={y0 + rows * u}
            className={styles.gridLine}
          />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={x0}
            x2={x0 + cols * u}
            y1={y0 + i * u}
            y2={y0 + i * u}
            className={styles.gridLine}
          />
        ))}
        {turned ? (
          <text x={x0 + (cols * u) / 2} y={y0 + (rows * u) / 2 + 6} className={styles.areaText}>
            {d.area}
          </text>
        ) : (
          <>
            <text x={x0 + (split * u) / 2} y={y0 + (rows * u) / 2 + 6} className={styles.areaText}>
              {d.areaLeft}
            </text>
            <text
              x={x0 + split * u + ((total - split) * u) / 2}
              y={y0 + (rows * u) / 2 + 6}
              className={styles.areaText}
            >
              {d.areaRight}
            </text>
          </>
        )}
        <text x={x0 - 8} y={y0 + (rows * u) / 2 + 5} textAnchor="end" className={styles.sideA}>
          {rows}
        </text>
        {!turned && (
          <>
            <text x={x0 + (split * u) / 2} y={y0 - 12} className={styles.sideB}>
              {split}
            </text>
            <text
              x={x0 + split * u + ((total - split) * u) / 2}
              y={y0 - 12}
              className={styles.sideC}
            >
              {total - split}
            </text>
            <circle
              cx={x0 + split * u}
              cy={y0}
              r={11}
              className={styles.handle}
              data-testid="split-handle"
            />
          </>
        )}
      </svg>
      <p className={styles.equationSmall}>
        {turned ? (
          <Tex tex={`${total} \\cdot ${a} = ${a} \\cdot ${total} = ${d.area}`} />
        ) : (
          <Tex tex={distributeTex(a, split, d.right)} />
        )}
      </p>
      {num(spec, "turn", 0) === 1 && (
        <button
          type="button"
          className={styles.mini}
          onClick={() => setTurned(!turned)}
          aria-pressed={turned}
          disabled={disabled}
        >
          Turn the rectangle
        </button>
      )}
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}

function Width2({
  spec,
  value,
  onChange,
  onEnter,
  disabled,
  reduce,
}: AreaModelProps & { reduce: boolean }) {
  const max = num(spec, "max", 8);
  const N = clampInt(value ?? num(spec, "n", 6), 1, 2 * max + 1);
  const w = width2(N);
  const cols = Math.max(w.n, 1);
  const u = Math.min(30, 280 / (max + 1));
  const x0 = 24;
  const y0 = 28;
  const interactive = !disabled && Boolean(onChange);
  const key = useSlider(1, 2 * max + 1, N, onChange, onEnter, interactive);
  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (!interactive) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.focus();
    place(e);
  };
  const place = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const n = clampInt((x - x0) / u, 0, max);
    const next = Math.max(1, n * 2 + (w.odd ? 1 : 0));
    if (next !== N) onChange?.(next);
  };
  const description = `${N} squares: ${w.odd ? `${w.n} columns of 2, and 1 square left over. ${N} is odd.` : `${w.n} columns of 2. ${N} is even.`}`;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.area}
        viewBox={`0 0 ${W} ${y0 + 2 * u + 34}`}
        role={interactive ? "slider" : "img"}
        aria-label="Area model, a block two squares wide"
        aria-valuemin={interactive ? 1 : undefined}
        aria-valuemax={interactive ? 2 * max + 1 : undefined}
        aria-valuenow={interactive ? N : undefined}
        aria-valuetext={interactive ? description : undefined}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={down}
        onPointerMove={(e) => e.buttons === 1 && interactive && place(e)}
        onKeyDown={key}
        data-interactive={interactive}
      >
        {Array.from({ length: w.n }, (_, c) =>
          [0, 1].map((r) => (
            <motion.rect
              key={`${c}-${r}`}
              x={x0 + c * u + 1}
              y={y0 + r * u + 1}
              width={u - 2}
              height={u - 2}
              rx={4}
              className={styles.block}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0.12 : 0.12 }}
            />
          )),
        )}
        {w.odd && (
          <rect
            x={x0 + cols * u * (w.n === 0 ? 0 : 1) + 1}
            y={y0 + 1}
            width={u - 2}
            height={u - 2}
            rx={4}
            className={styles.oddSquare}
            data-testid="odd-square"
          />
        )}
        <circle
          cx={x0 + w.n * u + (w.odd ? u : 0) + 12}
          cy={y0 + u}
          r={11}
          className={styles.handle}
          data-testid="width-handle"
        />
        <text x={x0} y={y0 + 2 * u + 28} className={styles.areaLabel}>
          {w.odd ? `2 × ${w.n} + 1` : `2 × ${w.n}`}
        </text>
      </svg>
      <p className={styles.equationSmall}>
        <Tex tex={w.tex} />
      </p>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}

function Doubling({
  spec,
  value,
  onChange,
  onEnter,
  disabled,
  reduce,
}: AreaModelProps & { reduce: boolean }) {
  const start = num(spec, "start", 50000);
  const factor = num(spec, "factor", 2);
  const steps = num(spec, "steps", 3);
  const unit = typeof spec.unit === "string" ? spec.unit : "";
  const k = clampInt(value ?? 0, 0, steps);
  const d = doubling(start, factor, k);
  const interactive = !disabled && Boolean(onChange);
  const key = useSlider(0, steps, k, onChange, onEnter, interactive);
  const GAP = 26;
  const boxW = Math.min(76, (W - 24 - steps * GAP) / (steps + 1));
  const y = 26;
  const grow = factor >= 1;
  const description = `After ${k} ${factor >= 1 ? "doublings" : "halvings"}: ${fmtNumber(d.value).replace(/\\,/g, ",")}${unit ? ` ${unit}` : ""}.`;
  return (
    <figure className={styles.figure}>
      <svg
        className={styles.area}
        viewBox={`0 0 ${W} 120`}
        role={interactive ? "slider" : "img"}
        aria-label={grow ? "Doubling strip" : "Halving strip"}
        aria-valuemin={interactive ? 0 : undefined}
        aria-valuemax={interactive ? steps : undefined}
        aria-valuenow={interactive ? k : undefined}
        aria-valuetext={interactive ? description : undefined}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={(e) => {
          if (!interactive) return;
          e.currentTarget.focus();
          onChange?.(Math.min(steps, k + 1));
        }}
        onKeyDown={key}
        data-interactive={interactive}
      >
        {Array.from({ length: steps + 1 }, (_, i) => {
          const x = 12 + i * (boxW + GAP);
          const done = i <= k;
          const v = start * Math.pow(factor, i);
          const h = grow ? 30 + (i / steps) * 40 : 70 - (i / steps) * 40;
          return (
            <g key={i}>
              {i > 0 && (
                <text x={x - GAP / 2} y={y + 52} className={styles.areaLabel} textAnchor="middle">
                  {grow ? "×2" : "÷2"}
                </text>
              )}
              <motion.rect
                x={x}
                y={y + 80 - h}
                width={boxW}
                height={h}
                rx={6}
                className={done ? (i === 0 ? styles.block : styles.partB) : styles.oddSquare}
                initial={false}
                animate={{ opacity: done ? 1 : 0.8 }}
                transition={{ duration: reduce ? 0.12 : 0.18 }}
              />
              <text
                x={x + boxW / 2}
                y={y + 80 - h + 18}
                className={styles.areaLabel}
                textAnchor="middle"
                data-dim={!done}
              >
                {done ? fmtNumber(v).replace(/\\,/g, ",") : "?"}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={styles.equationSmall}>
        <Tex tex={d.tex} />
        {unit ? <span className={styles.unit}> {unit}</span> : null}
      </p>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
      {interactive && (
        <button
          type="button"
          className={styles.mini}
          onClick={() => onChange?.(Math.min(steps, k + 1))}
          disabled={k >= steps}
        >
          {grow ? "Double" : "Halve"} once more
        </button>
      )}
    </figure>
  );
}
