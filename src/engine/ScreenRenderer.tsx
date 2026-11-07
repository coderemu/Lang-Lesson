import type { ReactNode } from "react";
import type { Interaction, Rule, Screen } from "../../content/schema";
import {
  ChoiceChip,
  HintChip,
  NumberSlot,
  RuleCard,
  TrapBox,
  type ChoiceState,
  type SlotState,
} from "../components";
import { Math, RichText } from "../math";
import { answerSpec, type AnswerSpec, type Input } from "./answers";
import styles from "./ScreenRenderer.module.css";

export type Verdict = "idle" | "correct" | "wrong";

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
  /** Trap-summary: the learner's True/False. */
  onTrap?: (choiceId: string) => void;
  trapNote?: ReactNode;
}

/** Widgets arrive in step 1C. Until then each one shows a named placeholder. */
function WidgetPlaceholder({
  name,
  mode,
  children,
}: {
  name: string;
  mode?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={styles.placeholder}
      data-testid="widget-placeholder"
      role="group"
      aria-label={`${name} widget, not built yet`}
    >
      <p className={styles.phName}>
        {name}
        {mode ? ` · ${mode}` : ""}
      </p>
      <p className={styles.phNote}>Widget comes in step 1C.</p>
      {children}
    </div>
  );
}

const slotState = (verdict: Verdict): SlotState => (verdict === "idle" ? "default" : verdict);
const chipState = (verdict: Verdict, selected: boolean, correct: boolean): ChoiceState =>
  verdict === "idle" || !selected ? "default" : correct ? "correct" : "wrong";

export function ScreenRenderer(props: ScreenRendererProps) {
  const { interaction: i, input, onInput, verdict, locked } = props;
  const spec = answerSpec(i);

  const setText = (k: number, v: string) => {
    const text = [...input.text];
    text[k] = v;
    onInput({ ...input, text });
  };

  const answerRow = (): ReactNode => {
    switch (spec.t) {
      case "number":
        return (
          <div className={styles.row}>
            {spec.expression && <Math tex={spec.expression} className={styles.expr} />}
            <NumberSlot
              label="Your answer"
              value={input.text[0] ?? ""}
              onChange={(v) => setText(0, v)}
              state={slotState(verdict)}
              disabled={locked}
              compact
            />
            {props.hintChip && <HintChip {...props.hintChip} />}
          </div>
        );
      case "thermometer":
        return (
          <div className={styles.row}>
            <span className={styles.expr}>My guess</span>
            <NumberSlot
              label="Your guess"
              value={input.text[0] ?? ""}
              onChange={(v) => setText(0, v)}
              disabled={locked}
              compact
            />
          </div>
        );
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
                  <Math tex={p.expression} className={styles.expr} />
                  <NumberSlot
                    label={`Your answer, part ${k + 1}`}
                    value={input.text[k] ?? ""}
                    onChange={(v) => setText(k, v)}
                    state={verdict === "idle" ? "default" : (props.slotStates?.[k] ?? "default")}
                    disabled={locked}
                    compact
                  />
                  {k === spec.parts.length - 1 && props.hintChip && (
                    <HintChip {...props.hintChip} />
                  )}
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
            {props.hintChip && <HintChip {...props.hintChip} />}
          </div>
        );
      case "none":
        return props.hintChip ? <HintChip {...props.hintChip} /> : null;
    }
  };

  const stage = (): ReactNode => {
    switch (i.type) {
      case "none":
        return null;
      case "rule-card":
        return (
          <div className={styles.cards}>
            {i.ruleIds.map((id) => {
              const r = props.rules.get(id);
              return r ? (
                <RuleCard
                  key={id}
                  label={r.label}
                  statement={r.statement}
                  spoken={r.spoken}
                  picture={
                    i.picture ? (
                      <WidgetPlaceholder name="Rule card picture" mode={i.picture} />
                    ) : undefined
                  }
                />
              ) : null;
            })}
          </div>
        );
      case "number-line":
      case "area-model":
      case "square-tiles":
      case "fraction-strips":
        return (
          <>
            {"equation" in i && i.equation && <Math tex={i.equation} className={styles.equation} />}
            <WidgetPlaceholder name={widgetName(i.type)} mode={i.mode} />
            {i.type === "number-line" && i.answer && !i.followUp && (
              <p className={styles.note}>
                Type your answer for now. The number line arrives in step 1C.
              </p>
            )}
          </>
        );
      case "thermometer":
        return <WidgetPlaceholder name="Thermometer" mode={i.mode} />;
      case "balance":
        return <WidgetPlaceholder name="Balance" mode={i.mode} />;
      case "proof":
        return (
          <WidgetPlaceholder name="Proof stepper">
            <Math tex={i.goal} className={styles.equation} />
          </WidgetPlaceholder>
        );
      case "elimination":
        return <WidgetPlaceholder name="Elimination board" mode={i.mode} />;
      case "trap-summary":
        return (
          <>
            <div className={styles.summary}>
              {i.summary.map((id) => {
                const r = props.rules.get(id);
                return r ? (
                  <div key={id} className={styles.summaryRow}>
                    <span className={styles.ruleId}>{id}</span>
                    <Math tex={r.statement} />
                  </div>
                ) : null;
              })}
            </div>
            <TrapBox
              question={i.trap.question ?? ""}
              answer={input.choice === null ? null : input.choice === "true"}
              correct={i.trap.correct === "true"}
              onAnswer={(v) => props.onTrap?.(v ? "true" : "false")}
            />
            {props.trapNote}
          </>
        );
      default:
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

function widgetName(type: Interaction["type"]): string {
  return (
    {
      "number-line": "Number line",
      "area-model": "Area model",
      "square-tiles": "Square tiles",
      "fraction-strips": "Fraction strips",
    }[type as "number-line"] ?? type
  );
}

export type { AnswerSpec };
