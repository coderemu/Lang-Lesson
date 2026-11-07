import { useState } from "react";
import type { ProofInteraction, Rule } from "../../content/schema";
import { Math as Tex } from "../math";
import {
  AreaModel,
  Balance,
  FractionStrips,
  SquareTiles,
  MirrorPicture,
  NumberLine,
  ProofStepper,
  Stage,
  Thermometer,
  TrapSummary,
  trayChips,
} from "../widgets";
import type { Removed } from "../widgets/balanceLogic";
import { fmt } from "../widgets/geometry";
import styles from "./DesignSystem.module.css";

/** Sample data for the design-system page only. Lesson text lives in content/. */
const RULES = new Map<string, Rule>(
  [
    ["N1", "Adding zero", "0 + \\va{a} = \\va{a}"],
    ["N2", "Additive inverse", "\\va{a} + (-\\va{a}) = 0"],
    ["comm-add", "Commutativity of addition", "\\va{a} + \\vb{b} = \\vb{b} + \\va{a}"],
  ].map(([id, name, statement]) => [
    id,
    {
      id,
      label: name.toUpperCase(),
      name,
      statement,
      status: "assumed" as const,
      lesson: "1.2",
      book: "Ch 1 §1",
    },
  ]),
);
const PROOF: ProofInteraction = {
  type: "proof",
  goal: "a + b = 0",
  lines: [
    { math: "\\va{a} + \\vb{b} = 0", reason: null },
    { math: "-\\va{a} + \\va{a} + \\vb{b} = -\\va{a} + 0", reason: "add-both" },
    { math: "0 + \\vb{b} = -\\va{a} + 0", reason: "N2" },
    { math: "\\vb{b} = -\\va{a}", reason: "N1" },
  ],
  tray: ["N1", "N2", "comm-add", "add-both"],
  steps: [{ id: "add-both", label: "add −a to both sides" }],
  feedback: { correctTitle: "Proved.", correctWhy: "Sample." },
};
const CHIPS = trayChips(PROOF, RULES);
const noop = () => undefined;

export function DesignWidgets() {
  const [place, setPlace] = useState<number | null>(null);
  const [hops, setHops] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [removed, setRemoved] = useState<Removed>({ l: 0, r: 0 });
  const [trap, setTrap] = useState<boolean | null>(null);
  const [split, setSplit] = useState<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [dbl, setDbl] = useState<number | null>(null);
  const [half, setHalf] = useState<number | null>(null);
  const [tilesA, setTilesA] = useState<number | null>(null);
  const [cut, setCut] = useState<number | null>(null);
  const [add, setAdd] = useState<number | null>(null);
  const [inv, setInv] = useState<number | null>(null);
  const [live, setLive] = useState<{ done: Record<number, string>; pending: string | null }>({
    done: {},
    pending: null,
  });
  const liveActive = PROOF.lines.findIndex(
    (l, k) => l.reason !== null && live.done[k] === undefined,
  );

  return (
    <>
      <p className={styles.note}>
        Every widget is controlled (<code>spec</code>, <code>value</code>, <code>onChange</code>).
        Drag the orange ring, tap the line, or focus it and use the arrow keys.
      </p>

      <div className={styles.widgetGrid}>
        <Spec name="Number line · place · live">
          <Stage readout={place !== null ? `Ring at ${fmt(place)}` : undefined}>
            <NumberLine
              mode="place"
              spec={{ min: -5, max: 5, ringStart: 0 }}
              value={place}
              onChange={setPlace}
            />
          </Stage>
        </Spec>
        <Spec name="Number line · place · correct and wrong">
          <Stage tone="correct" readout="Ring at −3">
            <NumberLine
              mode="place"
              spec={{ min: -5, max: 5 }}
              value={-3}
              state="correct"
              disabled
            />
          </Stage>
          <Stage tone="wrong" readout="Ring at 3">
            <NumberLine mode="place" spec={{ min: -5, max: 5 }} value={3} state="wrong" disabled />
          </Stage>
        </Spec>
        <Spec name="Number line · hops · live">
          <Stage>
            <NumberLine
              mode="hops"
              spec={{ min: -5, max: 5, start: 3, add: -5, ringStart: 3 }}
              value={hops}
              onChange={setHops}
              equation="3 + (-5) = ?"
            />
          </Stage>
        </Spec>
        <Spec name="Number line · compare">
          <Stage>
            <NumberLine
              mode="compare"
              spec={{
                min: -2,
                max: 10,
                paths: [
                  { start: 3, adds: [5] },
                  { start: 5, adds: [3] },
                ],
              }}
              value={null}
            />
          </Stage>
        </Spec>
        <Spec name="Number line · mirror">
          <Stage>
            <NumberLine mode="mirror" spec={{ min: -5, max: 5, mirrorOf: 4 }} value={null} />
          </Stage>
        </Spec>
        <Spec name="Rule card picture · mirror">
          <div className={styles.wide}>
            <MirrorPicture />
          </div>
        </Spec>
        <Spec name="Thermometer · guess · live">
          <Thermometer
            spec={{ min: -10, max: 15, start: 10, change: -15 }}
            value={guess}
            onChange={setGuess}
            revealed={revealed}
          />
          <button type="button" className={styles.mini} onClick={() => setRevealed(!revealed)}>
            {revealed ? "Back to guess" : "Show result"}
          </button>
        </Spec>
        <Spec name="Balance · solve · live">
          <Stage>
            <Balance
              mode="solve"
              spec={{ left: { x: 1, units: 3 }, right: { x: 0, units: 5 } }}
              removed={removed}
              onChange={setRemoved}
            />
          </Stage>
          <button type="button" className={styles.mini} onClick={() => setRemoved({ l: 0, r: 0 })}>
            Reset
          </button>
        </Spec>
        <Spec name="Balance · solve · tipped (one cube removed from the left pan)">
          <Stage>
            <Balance
              mode="solve"
              spec={{ left: { x: 1, units: 3 }, right: { x: 0, units: 5 } }}
              removed={{ l: 1, r: 0 }}
              onChange={noop}
              disabled
            />
          </Stage>
        </Spec>
        <Spec name="Proof stepper · start">
          <ProofStepper
            proof={PROOF}
            chips={CHIPS}
            active={1}
            done={{}}
            pending={null}
            wrong={false}
            onPick={noop}
          />
        </Spec>
        <Spec name="Proof stepper · part-way">
          <ProofStepper
            proof={PROOF}
            chips={CHIPS}
            active={2}
            done={{ 1: "add-both" }}
            pending={null}
            wrong={false}
            onPick={noop}
          />
        </Spec>
        <Spec name="Proof stepper · wrong reason">
          <ProofStepper
            proof={PROOF}
            chips={CHIPS}
            active={2}
            done={{ 1: "add-both" }}
            pending="N1"
            wrong
            onPick={noop}
          />
        </Spec>
        <Spec name="Proof stepper · live (tap a chip; Check is in the lesson)">
          <ProofStepper
            proof={PROOF}
            chips={CHIPS}
            active={liveActive < 0 ? PROOF.lines.length : liveActive}
            done={live.done}
            pending={live.pending}
            wrong={false}
            onPick={(chip) => setLive({ ...live, pending: chip })}
          />
          <button
            type="button"
            className={styles.mini}
            onClick={() => {
              if (
                liveActive >= 0 &&
                live.pending &&
                live.pending === PROOF.lines[liveActive].reason
              ) {
                setLive({ done: { ...live.done, [liveActive]: live.pending }, pending: null });
              } else setLive({ ...live, pending: null });
            }}
          >
            Check this line
          </button>
          <button
            type="button"
            className={styles.mini}
            onClick={() => setLive({ done: {}, pending: null })}
          >
            Reset
          </button>
        </Spec>
        <Spec name="Area model · distribute · live (with turn)">
          <Stage>
            <AreaModel
              mode="distribute"
              spec={{ a: 3, b: 4, c: 2, turn: 1 }}
              value={split}
              onChange={setSplit}
            />
          </Stage>
        </Spec>
        <Spec name="Area model · width-2 · live (odd and even)">
          <Stage>
            <AreaModel mode="width-2" spec={{ n: 7, max: 6 }} value={width} onChange={setWidth} />
          </Stage>
        </Spec>
        <Spec name="Area model · doubling-strip · live">
          <Stage>
            <AreaModel
              mode="doubling-strip"
              spec={{ start: 50000, factor: 2, steps: 3 }}
              value={dbl}
              onChange={setDbl}
            />
          </Stage>
        </Spec>
        <Spec name="Area model · doubling-strip · halving">
          <Stage>
            <AreaModel
              mode="doubling-strip"
              spec={{ start: 40, factor: 0.5, steps: 3, unit: "g" }}
              value={half}
              onChange={setHalf}
            />
          </Stage>
        </Spec>
        <Spec name="Square tiles · expand · live">
          <Stage>
            <SquareTiles
              mode="expand"
              spec={{ total: 5, a: 3 }}
              value={tilesA}
              onChange={setTilesA}
            />
          </Stage>
        </Spec>
        <Spec name="Fraction strips · cut · live">
          <Stage>
            <FractionStrips
              mode="cut"
              spec={{ num: 1, den: 2, max: 16 }}
              value={cut}
              onChange={setCut}
            />
          </Stage>
        </Spec>
        <Spec name="Fraction strips · add · live">
          <Stage>
            <FractionStrips
              mode="add"
              spec={{ n1: 2, d1: 3, n2: 1, d2: 4 }}
              value={add}
              onChange={setAdd}
            />
          </Stage>
        </Spec>
        <Spec name="Fraction strips · add · same denominator (sum over 1)">
          <Stage>
            <FractionStrips mode="add" spec={{ n1: 3, d1: 5, n2: 8, d2: 5 }} value={1} />
          </Stage>
        </Spec>
        <Spec name="Fraction strips · invert · live">
          <Stage>
            <FractionStrips mode="invert" spec={{ m: 2, n: 3 }} value={inv} onChange={setInv} />
          </Stage>
        </Spec>
        <Spec name="Trap summary · live">
          <TrapSummary
            summary={["N1", "N2"]}
            rules={RULES}
            question="True or false: $-a$ is always a negative number."
            answer={trap}
            correct={false}
            onAnswer={setTrap}
            note={trap !== null ? <Tex tex="\\text{Answered.}" /> : undefined}
          />
        </Spec>
      </div>
    </>
  );
}

function Spec({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className={styles.spec}>
      <p className={styles.specName}>{name}</p>
      <div className={styles.specBody} style={{ flexDirection: "column", alignItems: "stretch" }}>
        {children}
      </div>
    </div>
  );
}
