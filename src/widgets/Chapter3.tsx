import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { Math as Tex } from "../math";
import { parseInterval } from "../engine/check/expr";
import {
  decimalText,
  digitVerdict,
  eiEmpty,
  eiWrongCells,
  mediant,
  partsText,
  partWords,
  powText,
  readBrackets,
  type Part,
} from "./ch3";
import { AXIS_Y, LINE_W, clamp, fmt, spoken, valueAtX, xOf } from "./geometry";
import { clampInt } from "./explore";
import styles from "./widgets.module.css";
import c3 from "./ch3.module.css";

/* ───────── Number line · zoom ───────── */

export interface ZoomLineProps {
  /** Find the p-th root of n digit by digit. */
  spec: { n: number; p?: number; depth?: number };
  /** Digits chosen so far. Start with the integer part. */
  onChange?: (digits: number[]) => void;
  disabled?: boolean;
}

/** Decimal search: pick the next digit, the line zooms ×10 (1 → 0.1 → 0.01 → 0.001). */
export function ZoomLine({ spec, onChange, disabled }: ZoomLineProps) {
  const p = spec.p ?? 2;
  const depth = spec.depth ?? 3;
  const [digits, setDigits] = useState<number[]>([]); // after the integer part
  const [tried, setTried] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState("");
  const intPart = Math.floor(Math.pow(spec.n, 1 / p) + 1e-9);
  const k = digits.length;
  const m = digits.reduce((acc, d) => acc * 10 + d, intPart);
  const done = k >= depth;
  const lo = m;
  const hi = m + 1;
  const loText = decimalText(lo, k);
  const hiText = decimalText(hi, k);

  const pick = (d: number) => {
    if (done || disabled) return;
    const v = digitVerdict(spec.n, p, m, k, d);
    const cand = decimalText(10 * m + d, k + 1);
    if (v === "right") {
      const next = [...digits, d];
      setDigits(next);
      setTried({});
      setMsg(`Yes. The root is between ${cand} and ${decimalText(10 * m + d + 1, k + 1)}.`);
      onChange?.(next);
    } else {
      setTried((t) => ({ ...t, [d]: v }));
      const sq = powText(10 * m + d, k + 1, p);
      setMsg(
        v === "high"
          ? `${cand} to the power ${p} is ${sq}. That is more than ${spec.n}. Try a smaller digit.`
          : `The next digit up still fits. ${cand} to the power ${p} is ${sq}, less than ${spec.n}. Try a larger digit.`,
      );
    }
  };
  const x = (i: number) => 21 + i * 30; // ten steps from x = 21 to x = 321
  const description = `The root of ${spec.n} is between ${loText} and ${hiText}. ${
    done ? "Search finished." : `Pick the next digit, 0 to 9.`
  }`;
  return (
    <figure className={styles.figure} data-testid="zoom-line">
      <svg
        className={styles.line}
        viewBox={`0 0 ${LINE_W} 120`}
        role="img"
        aria-label={`Number line zoom. ${description}`}
      >
        <line x1={10} x2={LINE_W - 10} y1={AXIS_Y} y2={AXIS_Y} className={styles.axis} />
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={AXIS_Y - 8} y2={AXIS_Y + 8} className={c3.zoomTick} />
            {(i === 0 || i === 10 || i % 5 === 0) && (
              <text x={x(i)} y={98} className={c3.zoomLabel}>
                {decimalText(10 * m + i, k + 1)}
              </text>
            )}
          </g>
        ))}
        <line x1={x(0)} x2={x(10)} y1={AXIS_Y} y2={AXIS_Y} className={c3.seg} />
        <text x={x(0)} y={40} className={c3.zoomLabel}>
          {loText}
        </text>
        <text x={x(10)} y={40} className={c3.zoomLabel}>
          {hiText}
        </text>
      </svg>
      <p className={c3.zoomText} data-testid="zoom-squares">
        <span>
          <Tex tex={`${loText}^{${p}} = ${powText(lo, k, p)}`} />
        </span>
        <span>
          <Tex tex={`${hiText}^{${p}} = ${powText(hi, k, p)}`} />
        </span>
      </p>
      <div className={c3.ctrls} role="group" aria-label="Next digit">
        {Array.from({ length: 10 }, (_, d) => (
          <button
            key={d}
            type="button"
            className={c3.digit}
            data-state={tried[d] ? "tried" : undefined}
            disabled={disabled || done}
            onClick={() => pick(d)}
            aria-label={`Digit ${d}`}
          >
            {d}
          </button>
        ))}
      </div>
      <p className={c3.zoomMsg} role="status" aria-live="polite" data-testid="zoom-msg">
        {msg ||
          (done
            ? ""
            : `The root of ${spec.n} is between ${loText} and ${hiText}. Pick the next digit.`)}
        {done &&
          ` Search finished: the root of ${spec.n} is between ${loText} and ${hiText}. The digits do not stop.`}
      </p>
      <span className="sr-only">{description}</span>
    </figure>
  );
}

/* ───────── Number line · interval ───────── */

export interface IntervalLineProps {
  spec: { min: number; max: number; parts?: number };
  /** Text of the drawing, "(−2, 5]" or "(−inf, 3) U (7, inf)"; "" = not drawn yet. */
  value: string;
  onChange?: (text: string) => void;
  onEnter?: () => void;
  disabled?: boolean;
}

const DEFAULT_PART = (min: number, max: number): Part => ({
  lo: Math.min(max - 1, Math.max(min + 1, 0)),
  hi: Math.min(max - 1, Math.max(min + 1, 0)) + 1,
  loClosed: false,
  hiClosed: false,
});

function readParts(value: string, min: number, max: number, count: number): Part[] {
  const out: Part[] = [];
  const own = value.trim() ? readBrackets(value, min, max) : null;
  if (own) {
    for (const q of own) out.push({ ...q, lo: clamp(q.lo, min, max), hi: clamp(q.hi, min, max) });
    while (out.length < count) out.push(DEFAULT_PART(min, max));
    return out.slice(0, count);
  }
  const pieces = value.trim() ? parseInterval(value) : null;
  for (const q of pieces ?? []) {
    out.push({
      lo: Number.isFinite(q.lo) ? clamp(Math.round(q.lo), min, max) : min,
      hi: Number.isFinite(q.hi) ? clamp(Math.round(q.hi), min, max) : max,
      loClosed: q.loClosed,
      hiClosed: q.hiClosed,
    });
  }
  while (out.length < count) out.push(DEFAULT_PART(min, max));
  return out.slice(0, count);
}

/** Intervals: orange handles drag or move by arrow keys; buttons toggle filled / empty. */
export function IntervalLine({ spec, value, onChange, onEnter, disabled }: IntervalLineProps) {
  const { min, max } = spec;
  const count = spec.parts ?? 1;
  const parts = readParts(value, min, max, count);
  const [drag, setDrag] = useState<{ part: number; end: "lo" | "hi" } | null>(null);
  const interactive = !disabled && Boolean(onChange);

  const commit = (next: Part[]) => onChange?.(partsText(next, min, max));
  const edit = (i: number, patch: Partial<Part>) =>
    commit(parts.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const move = (i: number, end: "lo" | "hi", v: number) => {
    const q = parts[i];
    const nv = clamp(v, min, max);
    if (end === "lo") edit(i, { lo: Math.min(nv, q.hi) });
    else edit(i, { hi: Math.max(nv, q.lo) });
  };
  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag) return;
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * LINE_W;
    move(drag.part, drag.end, valueAtX(px, min, max));
  };
  const key = (e: KeyboardEvent<SVGElement>, i: number, end: "lo" | "hi") => {
    if (!interactive) return;
    const q = parts[i];
    const cur = end === "lo" ? q.lo : q.hi;
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (step) {
      e.preventDefault();
      move(i, end, cur + step);
    } else if (e.key === " ") {
      e.preventDefault();
      edit(i, end === "lo" ? { loClosed: !q.loClosed } : { hiClosed: !q.hiClosed });
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const description = parts.map((q, i) => `Part ${i + 1}: ${partWords(q, min, max)}.`).join(" ");
  return (
    <figure className={styles.figure} data-testid="interval-line">
      <svg
        className={styles.line}
        viewBox={`0 0 ${LINE_W} 120`}
        role="group"
        aria-label={`Number line, draw the interval. ${description}`}
        onPointerMove={(e) => drag && fromPointer(e)}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <line x1={10} x2={LINE_W - 10} y1={AXIS_Y} y2={AXIS_Y} className={styles.axis} />
        {ticks.map((v) => (
          <g key={v}>
            <line
              x1={xOf(v, min, max)}
              x2={xOf(v, min, max)}
              y1={AXIS_Y - (v === 0 ? 12 : 6)}
              y2={AXIS_Y + (v === 0 ? 12 : 6)}
              className={styles.tick}
            />
            <text x={xOf(v, min, max)} y={98} className={styles.tickLabel} data-zero={v === 0}>
              {fmt(v)}
            </text>
          </g>
        ))}
        {parts.map((q, i) => (
          <g key={i}>
            <line
              x1={xOf(q.lo, min, max)}
              x2={xOf(q.hi, min, max)}
              y1={AXIS_Y}
              y2={AXIS_Y}
              className={c3.range}
            />
            {q.lo <= min && (
              <path
                d={`M ${xOf(min, min, max) - 4} ${AXIS_Y} l 12 -8 v 16 z`}
                className={c3.arrow}
              />
            )}
            {q.hi >= max && (
              <path
                d={`M ${xOf(max, min, max) + 4} ${AXIS_Y} l -12 -8 v 16 z`}
                className={c3.arrow}
              />
            )}
            {(["lo", "hi"] as const).map((end) => {
              const v = end === "lo" ? q.lo : q.hi;
              const closed = end === "lo" ? q.loClosed : q.hiClosed;
              return (
                <circle
                  key={end}
                  cx={xOf(v, min, max)}
                  cy={AXIS_Y}
                  r={10}
                  className={c3.handleOrange}
                  data-closed={closed}
                  data-testid={`interval-${i}-${end}`}
                  role="slider"
                  tabIndex={interactive ? 0 : -1}
                  aria-label={`Part ${i + 1}, ${end === "lo" ? "left" : "right"} end`}
                  aria-valuemin={min}
                  aria-valuemax={max}
                  aria-valuenow={v}
                  aria-valuetext={`${spoken(v)}, ${closed ? "included" : "excluded"}${
                    (end === "lo" && v <= min) || (end === "hi" && v >= max) ? ", no end" : ""
                  }`}
                  onKeyDown={(e) => key(e, i, end)}
                  onPointerDown={(e) => {
                    if (!interactive) return;
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    (e.currentTarget as unknown as HTMLElement).focus?.();
                    setDrag({ part: i, end });
                  }}
                />
              );
            })}
          </g>
        ))}
      </svg>
      {parts.map((q, i) => (
        <div key={i} className={c3.partRow} role="group" aria-label={`Part ${i + 1}`}>
          {count > 1 && <span className={c3.partName}>Part {i + 1}</span>}
          <button
            type="button"
            className={c3.toggle}
            aria-pressed={q.loClosed}
            disabled={!interactive || q.lo <= min}
            onClick={() => edit(i, { loClosed: !q.loClosed })}
          >
            Left end: {q.lo <= min ? "none" : q.loClosed ? "filled" : "empty"}
          </button>
          <button
            type="button"
            className={c3.toggle}
            aria-pressed={q.hiClosed}
            disabled={!interactive || q.hi >= max}
            onClick={() => edit(i, { hiClosed: !q.hiClosed })}
          >
            Right end: {q.hi >= max ? "none" : q.hiClosed ? "filled" : "empty"}
          </button>
        </div>
      ))}
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}

/* ───────── E/I table ───────── */

export interface EITableProps {
  /** 8 cells: the + table, then the × table, each in the order EE, EI, IE, II. "-" = empty. */
  value: string;
  onChange?: (cells: string) => void;
  /** After Check: show the wrong cells. */
  showWrong?: boolean;
  disabled?: boolean;
}

/** Two 2 × 2 tables. Each cell toggles between empty, E and I. */
export function EITable({ value, onChange, showWrong, disabled }: EITableProps) {
  const cells = value.length === 8 ? value : eiEmpty();
  const wrong = showWrong ? eiWrongCells(cells) : [];
  const set = (i: number) => {
    if (disabled) return;
    const cur = cells[i];
    const next = cur === "-" ? "E" : cur === "E" ? "I" : "E";
    onChange?.(cells.slice(0, i) + next + cells.slice(i + 1));
  };
  const table = (title: string, sign: string, offset: number) => (
    <table className={c3.eiTable} aria-label={`${title} table`}>
      <thead>
        <tr>
          <th scope="col">{sign}</th>
          <th scope="col">E</th>
          <th scope="col">I</th>
        </tr>
      </thead>
      <tbody>
        {["E", "I"].map((row, r) => (
          <tr key={row}>
            <th scope="row">{row}</th>
            {[0, 1].map((col) => {
              const i = offset + r * 2 + col;
              const v = cells[i];
              return (
                <td key={col}>
                  <button
                    type="button"
                    className={c3.cell}
                    data-wrong={wrong.includes(i)}
                    data-filled={v !== "-"}
                    disabled={disabled}
                    onClick={() => set(i)}
                    aria-label={`${row} ${sign} ${col === 0 ? "E" : "I"}: ${v === "-" ? "empty, tap to choose" : v}${wrong.includes(i) ? ", not correct" : ""}`}
                    data-testid={`ei-${offset === 0 ? "add" : "mul"}-${r}${col}`}
                  >
                    {v === "-" ? "?" : v}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <figure className={styles.figure} data-testid="ei-table">
      <div className={c3.eiGrid}>
        {table("Addition", "+", 0)}
        {table("Multiplication", "×", 4)}
      </div>
      <span className="sr-only" aria-live="polite" role="status">
        {`Addition: ${[0, 1, 2, 3].map((i) => cells[i]).join(" ")}. Multiplication: ${[4, 5, 6, 7].map((i) => cells[i]).join(" ")}.`}
      </span>
    </figure>
  );
}

/* ───────── Fraction strips · mediant ───────── */

export interface MediantProps {
  spec: Record<string, number | string | number[]>;
  /** 1 = the sum of the tops and bottoms is shown. */
  value: number | null;
  onChange?: (v: number) => void;
  onEnter?: () => void;
  disabled?: boolean;
}

const nn = (spec: Record<string, unknown>, k: string, f: number) =>
  typeof spec[k] === "number" ? (spec[k] as number) : f;

/** Two fractions a/b < c/d as strips, and the strip of (a + c)/(b + d) between them. */
export function MediantStrips({ spec, value, onChange, onEnter, disabled }: MediantProps) {
  const a = nn(spec, "a", 1);
  const b = nn(spec, "b", 3);
  const c = nn(spec, "c", 1);
  const d = nn(spec, "d", 2);
  const m = mediant(a, b, c, d);
  const shown = value === 1;
  const W = 300;
  const X = 21;
  const bar = (y: number, num: number, den: number, cls: string, label: string) => (
    <g>
      <rect x={X} y={y} width={W} height={26} className={c3.big} />
      <rect x={X} y={y} width={(W * num) / den} height={26} className={cls} />
      {Array.from({ length: den - 1 }, (_, i) => (
        <line
          key={i}
          x1={X + ((i + 1) * W) / den}
          x2={X + ((i + 1) * W) / den}
          y1={y}
          y2={y + 26}
          className={c3.strip}
        />
      ))}
      <text x={X} y={y - 6} className={styles.areaText} style={{ textAnchor: "start" }}>
        {label}
      </text>
    </g>
  );
  const description = `The strips show ${a}/${b} and ${c}/${d}. ${
    shown
      ? `Adding the tops and the bottoms gives ${m.n}/${m.d}. It is between the two fractions.`
      : "Press the button to add the tops and the bottoms."
  }`;
  return (
    <figure className={styles.figure} data-testid="mediant-strips">
      <svg
        className={styles.area}
        viewBox={`0 0 342 ${shown ? 170 : 120}`}
        role="img"
        aria-label={description}
      >
        {bar(24, a, b, c3.stripFill, `${a}/${b}`)}
        {bar(76, c, d, c3.stripFill, `${c}/${d}`)}
        {shown && bar(128, m.n, m.d, c3.stripMed, `(${a} + ${c}) / (${b} + ${d}) = ${m.n}/${m.d}`)}
      </svg>
      <div className={c3.ctrls}>
        <button
          type="button"
          className={c3.toggle}
          aria-pressed={shown}
          disabled={disabled}
          onClick={() => onChange?.(shown ? 0 : 1)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onEnter?.())}
        >
          {shown ? "Hide the sum" : "Add the tops and the bottoms"}
        </button>
      </div>
      {shown && (
        <p className={styles.equationSmall}>
          <Tex tex={`\\dfrac{${a}+${c}}{${b}+${d}} = \\dfrac{${m.n}}{${m.d}}`} />
        </p>
      )}
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}

/* ───────── Square tiles · compare ───────── */

export interface CompareTilesProps {
  spec: Record<string, number | string>;
  /** The side a of the small square. */
  value: number | null;
  onChange?: (v: number) => void;
  onEnter?: () => void;
  disabled?: boolean;
}

/** A square of side a inside a square of side b. Move a: a² stays smaller than b². */
export function CompareTiles({ spec, value, onChange, onEnter, disabled }: CompareTilesProps) {
  const b = nn(spec, "b", 5);
  const a = clampInt(value ?? nn(spec, "a", 3), 1, b - 1);
  const W = 342;
  const S = 150;
  const u = S / b;
  const x0 = (W - S) / 2;
  const y0 = 12;
  const interactive = !disabled && Boolean(onChange);
  const place = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const v = clampInt((x - x0) / u, 1, b - 1);
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
      onChange?.(clampInt(a + step, 1, b - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };
  const description = `A square of side ${a} inside a square of side ${b}. The areas are ${a * a} and ${b * b}. The small square fits inside the big square.`;
  return (
    <figure className={styles.figure} data-testid="compare-tiles">
      <svg
        className={styles.area}
        viewBox={`0 0 ${W} ${y0 + S + 10}`}
        role={interactive ? "slider" : "img"}
        aria-label="Square tiles, compare two squares"
        aria-valuemin={interactive ? 1 : undefined}
        aria-valuemax={interactive ? b - 1 : undefined}
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
        <rect x={x0} y={y0} width={S} height={S} className={c3.big} />
        <rect x={x0} y={y0} width={a * u} height={a * u} className={styles.tileA} />
        <text x={x0 + (a * u) / 2} y={y0 + (a * u) / 2 + 6} className={styles.areaText}>
          {a * a}
        </text>
        <text x={x0 + (S + a * u) / 2} y={y0 + (S + a * u) / 2 + 6} className={styles.areaText}>
          {b * b}
        </text>
        <circle
          cx={x0 + a * u}
          cy={y0 + a * u}
          r={11}
          className={styles.handle}
          data-testid="compare-handle"
        />
      </svg>
      <p className={styles.equationSmall}>
        <Tex tex={`${a}^2 = ${a * a} < ${b}^2 = ${b * b}`} />
      </p>
      <span className="sr-only" aria-live="polite" role="status">
        {description}
      </span>
    </figure>
  );
}
