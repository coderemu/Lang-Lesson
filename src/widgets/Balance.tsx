import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  describeBalance,
  isLevel,
  remaining,
  tiltDegrees,
  weights,
  type BalanceSpec,
  type Removed,
} from "./balanceLogic";
import styles from "./widgets.module.css";

export interface BalanceProps {
  mode: "solve";
  spec: BalanceSpec;
  removed: Removed;
  onChange: (removed: Removed) => void;
  disabled?: boolean;
}

const CX = 171;
const PIVOT_Y = 41;
const ARM = 90; // pan hangers hang 90 units from the pivot
const CUBE = 22;

/** Cubes of a pan, row by row from the bottom. Positions are relative to the pan centre and top (frame S10). */
export function layout(hasX: boolean, units: number): { cubes: { x: number; y: number }[] } {
  const perRow = hasX ? 2 : 3;
  const centre = hasX ? 24 : 0;
  const cubes: { x: number; y: number }[] = [];
  let left = units;
  for (let r = 0; left > 0; r++) {
    const n = Math.min(left, perRow);
    for (let i = 0; i < n; i++) {
      cubes.push({ x: centre - (n * (CUBE + 2) - 2) / 2 + i * (CUBE + 2), y: -CUBE - 24 * r });
    }
    left -= n;
  }
  return { cubes };
}

/** Balance, mode `solve` (frame S10). Tap an orange cube to remove it. */
export function Balance({ spec, removed, onChange, disabled }: BalanceProps) {
  const reduce = useReducedMotion();
  const target = tiltDegrees(spec, removed);
  const [angle, setAngle] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const controls = animate(current.current, target, {
      ...(reduce ? { duration: 0.12 } : { type: "spring" as const, stiffness: 200, damping: 20 }),
      onUpdate: (v) => {
        current.current = v;
        setAngle(v);
      },
    });
    return () => controls.stop();
  }, [target, reduce]);

  const rad = (angle * Math.PI) / 180;
  const dx = ARM * Math.cos(rad);
  const dy = ARM * Math.sin(rad);
  const leftTop = { x: CX - dx, y: PIVOT_Y - dy };
  const rightTop = { x: CX + dx, y: PIVOT_Y + dy };
  const rem = remaining(spec, removed);
  const level = isLevel(spec, removed);
  const w = weights(spec, removed);

  const removeLeft = () => rem.left > 0 && !disabled && onChange({ ...removed, l: removed.l + 1 });
  const removeRight = () =>
    rem.right > 0 && !disabled && onChange({ ...removed, r: removed.r + 1 });

  const pan = (
    top: { x: number; y: number },
    hasX: boolean,
    units: number,
    onRemove: () => void,
    side: string,
  ) => {
    const lay = layout(hasX, units);
    const base = top.y + 105; // pan top
    return (
      <g transform={`translate(${top.x} ${base})`}>
        <polygon points={`0,${-105} -48,0 48,0`} className={styles.hanger} />
        <rect x={-52} y={0} width={104} height={8} rx={4} className={styles.pan} />
        {hasX && (
          <g transform="translate(-45 -42)">
            <rect width={42} height={42} rx={8} className={styles.xBlock} />
            <text x={21} y={31} textAnchor="middle" className={styles.xBlockText}>
              x
            </text>
          </g>
        )}
        {lay.cubes.map((c, i) => {
          const last = i === lay.cubes.length - 1;
          return (
            <g
              key={i}
              transform={`translate(${c.x} ${c.y})`}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Remove one cube from the ${side} pan`}
              aria-disabled={disabled || undefined}
              className={styles.cube}
              data-testid={`cube-${side}`}
              data-last={last}
              onClick={onRemove}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }
              }}
            >
              <rect width={CUBE} height={CUBE} rx={5} />
            </g>
          );
        })}
      </g>
    );
  };

  const labelOf = (hasX: boolean, units: number) =>
    hasX ? (
      <>
        <tspan fontStyle="italic">x</tspan>
        {units > 0 ? ` + ${units}` : ""}
      </>
    ) : (
      String(units)
    );

  return (
    <figure className={styles.figure}>
      <svg
        className={styles.balance}
        viewBox="0 0 342 184"
        role="group"
        aria-label="Balance. Tap the orange cubes to remove them."
      >
        <polygon points={`${CX - 22},172 ${CX + 22},172 ${CX},146`} className={styles.base} />
        <rect x={CX - 3} y={40} width={6} height={110} className={styles.post} />
        <g
          transform={`rotate(${angle} ${CX} ${PIVOT_Y})`}
          data-testid="beam"
          data-angle={angle.toFixed(2)}
        >
          <rect x={31} y={PIVOT_Y - 3} width={280} height={6} rx={3} className={styles.beam} />
        </g>
        <circle cx={CX} cy={PIVOT_Y} r={7} className={styles.pivot} />
        {pan(leftTop, spec.left.x > 0, rem.left, removeLeft, "left")}
        {pan(rightTop, spec.right.x > 0, rem.right, removeRight, "right")}
        <text x={leftTop.x} y={176} textAnchor="middle" className={styles.panLabel}>
          {labelOf(spec.left.x > 0, rem.left)}
        </text>
        <text x={rightTop.x} y={176} textAnchor="middle" className={styles.panLabel}>
          {labelOf(spec.right.x > 0, rem.right)}
        </text>
      </svg>
      <p className={styles.balanceReadout} data-level={level} data-testid="balance-readout">
        {level
          ? "Level: both pans weigh the same"
          : w.left > w.right
            ? "The left pan is heavier"
            : "The right pan is heavier"}
      </p>
      <span className="sr-only" aria-live="polite" role="status">
        {describeBalance(spec, removed)}
      </span>
    </figure>
  );
}
