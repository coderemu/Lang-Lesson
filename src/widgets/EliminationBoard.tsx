import { motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { Button, NumberSlot } from "../components";
import { BalanceSystem } from "./Balance";
import {
  cancelled,
  combineRows,
  describeCancel,
  describeRow,
  determinant,
  formatQ,
  parseEquation,
  parseQ,
  q,
  qIsZero,
  rowKind,
  scaleRow,
  VARIABLES,
  type Q,
  type Row,
  type Variable,
} from "./eliminationLogic";
import styles from "./widgets.module.css";

export interface EliminationBoardProps {
  mode: "two-unknowns" | "three-unknowns" | "general";
  /** TeX rows, for example "2x + y = 1". */
  equations: string[];
  /** Show two linked balances above the rows (Balance mode `system`). */
  balance?: boolean;
  disabled?: boolean;
}

const MINUS = "−";
const MAX_ROWS = 9;

/** One term of a row: sign and number, then the coloured letter. */
function Term({ v, c, first, ghost }: { v: Variable; c: Q; first: boolean; ghost?: boolean }) {
  const abs = q(Math.abs(c.n), c.d);
  const num = abs.n === 1 && abs.d === 1 ? "" : formatQ(abs);
  const neg = c.n < 0;
  return (
    <span
      className={styles.elimTerm}
      data-ghost={ghost || undefined}
      aria-hidden={ghost || undefined}
    >
      {first ? (
        neg && <span className={styles.elimSign}>{MINUS}</span>
      ) : (
        <span className={styles.elimOp}>{neg ? MINUS : "+"}</span>
      )}
      <span className={styles.elimTile} data-var={v}>
        {num}
        <i>{v}</i>
      </span>
    </span>
  );
}

function RowView({ row, vars, fresh }: { row: Row; vars: Variable[]; fresh: boolean }) {
  const shown = vars.filter((v) => !qIsZero(row.coef[v]));
  const gone = fresh ? cancelled(row, vars) : [];
  return (
    <span className={styles.elimEq}>
      {shown.length === 0 && <span className={styles.elimZero}>0</span>}
      {shown.map((v, k) => (
        <Term key={v} v={v} c={row.coef[v]} first={k === 0} />
      ))}
      {gone.map((v) => (
        <Term key={`gone-${v}`} v={v} c={q(1)} first={false} ghost />
      ))}
      <span className={styles.elimEquals}>=</span>
      <span className={styles.elimRhs}>{formatQ(row.rhs)}</span>
    </span>
  );
}

/**
 * Elimination board (Chapter 2). Pick one row and multiply it, or pick two rows and add or subtract them.
 * The new row joins the list. The board never gives the answer: the learner types it.
 */
export function EliminationBoard({ mode, equations, balance, disabled }: EliminationBoardProps) {
  const reduce = useReducedMotion();
  const vars = VARIABLES[mode];
  const start = useMemo(
    () => equations.map((e, k) => ({ ...parseEquation(e), label: String(k + 1) })),
    [equations],
  );
  const [rows, setRows] = useState<Row[]>(start);
  const [picked, setPicked] = useState<number[]>([]);
  const [k, setK] = useState("");
  const [message, setMessage] = useState("");
  const [live, setLive] = useState("");

  const pickedRows = [...picked].sort((a, b) => a - b);
  const toggle = (i: number) =>
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i].slice(-2)));

  const push = (row: Row, how: string) => {
    if (rows.length >= MAX_ROWS) {
      setMessage(`The board holds ${MAX_ROWS} rows. Use Undo last row.`);
      return;
    }
    const kind = rowKind(row, vars);
    const note =
      kind === "contradiction"
        ? " This is never true."
        : kind === "identity"
          ? " This is always true."
          : "";
    setRows((r) => [...r, row]);
    setPicked([]);
    setMessage("");
    setLive(
      `Row ${row.label}: ${describeRow(row, vars)}. ${how}. ${describeCancel(row, vars)}${note}`,
    );
  };

  const multiply = () => {
    if (pickedRows.length !== 1) return setMessage("Tap one row, then multiply.");
    const factor = parseQ(k);
    if (factor === null || qIsZero(factor))
      return setMessage("Type a number that is not 0, for example 2 or 1/2.");
    const src = rows[pickedRows[0]];
    push(
      scaleRow(src, factor, String(rows.length + 1)),
      `${formatQ(factor)} times row ${src.label}`,
    );
  };
  const combine = (sign: 1 | -1) => {
    if (pickedRows.length !== 2) return setMessage("Tap two rows first.");
    const [a, b] = pickedRows.map((i) => rows[i]);
    const row = combineRows(a, b, sign, String(rows.length + 1));
    push(row, `Row ${a.label} ${sign === 1 ? "plus" : "minus"} row ${b.label}`);
  };
  const undo = () => {
    if (rows.length <= start.length) return;
    setRows((r) => r.slice(0, -1));
    setPicked([]);
    setMessage("");
    setLive(`Row ${rows[rows.length - 1].label} removed.`);
  };

  // Balances show the two picked rows, or the first two rows.
  const balanceRows = pickedRows.length === 2 ? pickedRows : [0, 1];
  const det = mode === "general" ? determinant(rows[0], rows[1]) : null;
  const lastIndex = rows.length - 1;

  return (
    <figure className={styles.figure}>
      {balance && <BalanceSystem rows={balanceRows.map((i) => ({ row: rows[i], vars }))} />}
      <ol className={styles.elimRows} aria-label="Equations">
        {rows.map((row, i) => (
          <motion.li
            key={i}
            className={styles.elimItem}
            initial={i >= start.length && !reduce ? { opacity: 0, y: -10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className={styles.elimRow}
              aria-pressed={picked.includes(i)}
              disabled={disabled}
              onClick={() => toggle(i)}
              data-testid={`row-${i + 1}`}
            >
              <span className="sr-only">{`Row ${row.label}: ${describeRow(row, vars)}`}</span>
              <span className={styles.elimVisual} aria-hidden="true">
                <span className={styles.elimTag}>R{row.label}</span>
                <RowView
                  row={row}
                  vars={vars}
                  fresh={i === lastIndex && i >= start.length && !reduce}
                />
              </span>
            </button>
          </motion.li>
        ))}
      </ol>
      <div className={styles.elimActions} role="group" aria-label="Row actions">
        <span className={styles.elimTimes} aria-hidden="true">
          ×
        </span>
        <NumberSlot
          label="Multiply by"
          value={k}
          onChange={setK}
          compact
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              multiply();
            }
          }}
        />
        <Button variant="secondary" onClick={multiply} disabled={disabled}>
          Multiply row
        </Button>
        <Button variant="secondary" onClick={() => combine(1)} disabled={disabled}>
          Add rows
        </Button>
        <Button variant="secondary" onClick={() => combine(-1)} disabled={disabled}>
          Subtract rows
        </Button>
        <Button
          variant="secondary"
          onClick={undo}
          disabled={disabled || rows.length <= start.length}
        >
          Undo last row
        </Button>
      </div>
      {det && (
        <p className={styles.elimDet} data-zero={qIsZero(det)} data-testid="determinant">
          <span>
            <i>ad</i> {MINUS} <i>bc</i> = {formatQ(rows[0].coef.x)} · {formatQ(rows[1].coef.y)}{" "}
            {MINUS} {formatQ(rows[0].coef.y)} · {formatQ(rows[1].coef.x)} = {formatQ(det)}
          </span>
          {qIsZero(det) && <strong> No single solution</strong>}
        </p>
      )}
      {message && (
        <p className={styles.elimMessage} role="alert">
          {message}
        </p>
      )}
      {rows.slice(start.length).some((r) => rowKind(r, vars) !== "normal") && (
        <p className={styles.elimMessage} data-testid="row-note">
          {rows
            .slice(start.length)
            .map((r) =>
              rowKind(r, vars) === "contradiction"
                ? `Row ${r.label} says ${describeRow(r, vars)}. That is never true.`
                : rowKind(r, vars) === "identity"
                  ? `Row ${r.label} says 0 = 0. That is always true.`
                  : "",
            )
            .filter(Boolean)
            .join(" ")}
        </p>
      )}
      <span className="sr-only" aria-live="polite" role="status">
        {live}
      </span>
    </figure>
  );
}
