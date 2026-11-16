import { useState, type ReactNode } from "react";
import type { Interaction, ProofInteraction, Rule, Screen } from "../../content/schema";
import {
  ChoiceChip,
  HintChip,
  NumberSlot,
  RuleCard,
  type ChoiceState,
  type SlotState,
} from "../components";
import { Math as Tex, RichText } from "../math";
import {
  AreaModel,
  Balance,
  EliminationBoard,
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
import { fmt } from "../widgets/geometry";
import type { Removed } from "../widgets/balanceLogic";
import { answerSpec, systemVars, type Input } from "./answers";
import { parseNumber } from "./check";
import styles from "./ScreenRenderer.module.css";

export type Verdict = "idle" | "correct" | "wrong";

/** State of the proof stepper, owned by the lesson player. */
export interface ProofState {
  active: number;
  done: Record<number, string>;
  pending: string | null;
  wrong: boolean;
  onPick: (chipId: string) => void;
}

interface ScreenRendererProps {
  screen: Screen;
  /** The interaction to show: the screen's own, or its twin. */
  interaction: Interaction;
  rules: Map<string, Rule>;
  input: Input;
  onInput: (input: Input) => void;
  verdict: Verdict;
  /** Per-slot state of a multi-number screen after Check. */
  slotStates?: ("correct" | "wrong")[];
  locked: boolean;
  hintChip?: { onClick: () => void; open: boolean } | null;
  invalidMessage?: string | null;
  /** Enter on a widget checks the answer. */
  onEnter?: () => void;
  /** Trap-summary: the learner's True/False. */
  onTrap?: (choiceId: string) => void;
  trapNote?: ReactNode;
  proof?: ProofState;
  removed?: Removed;
  onRemoved?: (r: Removed) => void;
}

const slotState = (verdict: Verdict): SlotState => (verdict === "idle" ? "default" : verdict);
const chipState = (verdict: Verdict, selected: boolean, correct: boolean): ChoiceState =>
  verdict === "idle" || !selected ? "default" : correct ? "correct" : "wrong";

/** Is the answer given by the widget itself, not by a number slot? */
export function widgetGivesAnswer(i: Interaction): boolean {
  return (
    (i.type === "number-line" && (i.mode === "place" || i.mode === "hops") && !i.followUp) ||
    i.type === "thermometer"
  );
}

export function ScreenRenderer(props: ScreenRendererProps) {
  const { interaction: i, input, onInput, verdict, locked } = props;
  const spec = answerSpec(i);
  const widgetAnswer = widgetGivesAnswer(i);
  const ringValue = parseNumber(input.text[0] ?? "");

  const setText = (k: number, v: string) => {
    const text = [...input.text];
    text[k] = v;
    onInput({ ...input, text });
  };
  const setNumber = (n: number) => setText(0, String(n));
  const tone = verdict === "idle" ? "neutral" : verdict;

  const hint = props.hintChip ? <HintChip {...props.hintChip} /> : null;

  const answerRow = (): ReactNode => {
    switch (spec.t) {
      case "number": {
        if (widgetAnswer) return hint ? <div className={styles.row}>{hint}</div> : null;
        const expression = spec.expression ?? (i.type === "balance" ? "x =" : undefined);
        return (
          <div className={styles.row}>
            {expression && <Tex tex={expression} className={styles.expr} />}
            <NumberSlot
              label="Your answer"
              value={input.text[0] ?? ""}
              onChange={(v) => setText(0, v)}
              state={slotState(verdict)}
              disabled={locked}
              compact
            />
            {hint}
          </div>
        );
      }
      case "thermometer":
        return null;
      case "multi":
        return (
          <div className={styles.parts}>
            {spec.parts.map((p, k) => (
              <div key={k} className={styles.part}>
                {p.prompt && (
                  <p className={styles.partPrompt}>
                    <RichText text={p.prompt} />
                  </p>
                )}
                <div className={styles.row}>
                  <Tex tex={p.expression} className={styles.expr} />
                  <NumberSlot
                    label={`Your answer, part ${k + 1}`}
                    value={input.text[k] ?? ""}
                    onChange={(v) => setText(k, v)}
                    state={verdict === "idle" ? "default" : (props.slotStates?.[k] ?? "default")}
                    disabled={locked}
                    compact
                  />
                  {k === spec.parts.length - 1 && hint}
                </div>
              </div>
            ))}
          </div>
        );
      case "choice":
        return (
          <div className={styles.choices}>
            {spec.choice.question && (
              <p className={styles.question}>
                <RichText text={spec.choice.question} />
              </p>
            )}
            <div className={styles.chips} role="group" aria-label="Choices">
              {spec.choice.options.map((o) => (
                <ChoiceChip
                  key={o.id}
                  selected={input.choice === o.id}
                  state={chipState(verdict, input.choice === o.id, o.id === spec.choice.correct)}
                  disabled={locked}
                  onClick={() => onInput({ ...input, choice: o.id })}
                >
                  <RichText text={o.label} />
                </ChoiceChip>
              ))}
            </div>
            {hint}
          </div>
        );
      case "system": {
        const vars = systemVars(spec.i);
        const toggle = (id: "none" | "many") =>
          onInput({ ...input, choice: input.choice === id ? null : id });
        const chip = (id: "none" | "many", label: string) => (
          <ChoiceChip
            selected={input.choice === id}
            state={chipState(verdict, input.choice === id, spec.i.answer.values === id)}
            disabled={locked}
            onClick={() => toggle(id)}
          >
            {label}
          </ChoiceChip>
        );
        return (
          <div className={styles.parts}>
            <div className={styles.row}>
              {vars.map((v, k) => (
                <span key={v} className={styles.row}>
                  <Tex tex={`${v} =`} className={styles.expr} />
                  <NumberSlot
                    label={`Answer for ${v}`}
                    value={input.text[k] ?? ""}
                    onChange={(t) => {
                      const text = [...input.text];
                      text[k] = t;
                      onInput({ ...input, text, choice: null });
                    }}
                    state={slotState(verdict)}
                    disabled={locked}
                    compact
                  />
                </span>
              ))}
              {hint}
            </div>
            <div className={styles.chips} role="group" aria-label="Special cases">
              {chip("none", "No solution")}
              {chip("many", "Many solutions")}
            </div>
          </div>
        );
      }
      case "none":
        return hint ? <div className={styles.row}>{hint}</div> : null;
    }
  };

  const stage = (): ReactNode => {
    switch (i.type) {
      case "none":
        return null;
      case "rule-card":
        return (
          <div className={styles.cards}>
            {i.ruleIds.map((id, k) => {
              const r = props.rules.get(id);
              return r ? (
                <RuleCard
                  key={id}
                  label={r.label}
                  statement={r.statement}
                  spoken={r.spoken}
                  picture={
                    i.picture === "mirror" && k === i.ruleIds.length - 1 ? (
                      <MirrorPicture />
                    ) : undefined
                  }
                />
              ) : null;
            })}
          </div>
        );
      case "number-line": {
        if (i.mode === "zoom" || i.mode === "interval") return null; // Phase 3
        return (
          <Stage
            tone={tone}
            readout={
              i.mode === "place" && ringValue !== null ? `Ring at ${fmt(ringValue)}` : undefined
            }
          >
            <NumberLine
              mode={i.mode}
              spec={i.widget}
              value={ringValue}
              onChange={setNumber}
              onEnter={props.onEnter}
              disabled={locked || verdict === "correct"}
              state={verdict}
              equation={i.equation}
            />
          </Stage>
        );
      }
      case "thermometer":
        return (
          <div className={styles.bare}>
            <Thermometer
              spec={i.widget}
              value={ringValue}
              onChange={setNumber}
              onEnter={props.onEnter}
              revealed={verdict !== "idle"}
              disabled={locked}
            />
          </div>
        );
      case "balance":
        return (
          <Stage>
            <Balance
              mode="solve"
              spec={i.widget as never}
              removed={props.removed ?? { l: 0, r: 0 }}
              onChange={(r) => props.onRemoved?.(r)}
              disabled={locked}
            />
          </Stage>
        );
      case "proof":
        return props.proof ? (
          <ProofBlock proof={i} rules={props.rules} state={props.proof} disabled={locked} />
        ) : null;
      case "trap-summary":
        return (
          <TrapSummary
            summary={i.summary}
            rules={props.rules}
            question={i.trap.question ?? ""}
            answer={input.choice === null ? null : input.choice === "true"}
            correct={i.trap.correct === "true"}
            onAnswer={(v) => props.onTrap?.(v ? "true" : "false")}
            note={props.trapNote}
          />
        );
      case "area-model":
      case "square-tiles":
      case "fraction-strips": {
        const supported =
          i.type === "area-model" ||
          (i.type === "square-tiles" && i.mode === "expand") ||
          (i.type === "fraction-strips" && i.mode !== "mediant");
        if (!supported) return null;
        return (
          <Stage>
            <ExploreWidget interaction={i} onEnter={props.onEnter} disabled={locked} />
          </Stage>
        );
      }
      case "elimination":
        return (
          <Stage>
            <EliminationBoard
              mode={i.mode}
              equations={i.equations}
              balance={i.balance}
              disabled={locked}
            />
          </Stage>
        );
      case "number-input":
      case "multi-number-input":
      case "choice":
        return null;
    }
  };

  return (
    <>
      {stage()}
      {i.type !== "trap-summary" && answerRow()}
      {props.invalidMessage && (
        <p className={styles.invalid} role="alert">
          {props.invalidMessage}
        </p>
      )}
    </>
  );
}

function ProofBlock({
  proof,
  rules,
  state,
  disabled,
}: {
  proof: ProofInteraction;
  rules: Map<string, Rule>;
  state: ProofState;
  disabled: boolean;
}) {
  return (
    <ProofStepper
      proof={proof}
      chips={trayChips(proof, rules)}
      active={state.active}
      done={state.done}
      pending={state.pending}
      wrong={state.wrong}
      onPick={state.onPick}
      disabled={disabled}
    />
  );
}

/** Explore widgets keep their own position. It is not an answer. */
function ExploreWidget({
  interaction: i,
  onEnter,
  disabled,
}: {
  interaction: Extract<Interaction, { type: "area-model" | "square-tiles" | "fraction-strips" }>;
  onEnter?: () => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState<number | null>(null);
  const common = { value, onChange: setValue, onEnter, disabled };
  if (i.type === "area-model") return <AreaModel mode={i.mode} spec={i.widget} {...common} />;
  if (i.type === "square-tiles") return <SquareTiles mode="expand" spec={i.widget} {...common} />;
  return <FractionStrips mode={i.mode as "cut" | "add" | "invert"} spec={i.widget} {...common} />;
}
