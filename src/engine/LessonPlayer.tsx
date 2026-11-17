import { useMath } from "./useMath";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Interaction, Lesson, Rule, Screen } from "../../content/schema";
import { Button, FeedbackSheet, HintDrawer, LessonBar, TryBox } from "../components";
import { hasLesson, loadLesson, loadRules } from "../content/load";
import { Math as Tex, RichText } from "../math";
import { activeLine, trayChips } from "../widgets";
import type { Removed } from "../widgets/balanceLogic";
import { checkProofLine } from "./check";
import { requestPersistentStorage, useProgress } from "../store";
import {
  answerSpec,
  emptyInput,
  evaluate,
  hasAnswer,
  partStates,
  type Input,
  type Outcome,
} from "./answers";
import { PlayerFrame } from "./PlayerFrame";
import { ScreenRenderer, type ProofState, type Verdict } from "./ScreenRenderer";
import { useActiveTime } from "./useActiveTime";
import styles from "./LessonPlayer.module.css";

type Phase = "answering" | "feedback" | "show-me";

export function LessonPlayer() {
  const { id = "" } = useParams();
  const [lesson, setLesson] = useState<Lesson | null | undefined>(undefined);
  const [rules, setRules] = useState<Map<string, Rule>>(new Map());

  useEffect(() => {
    let live = true;
    void Promise.all([loadLesson(id), loadRules()]).then(([l, r]) => {
      if (!live) return;
      setRules(new Map(r.map((x) => [x.id, x])));
      setLesson(l);
    });
    return () => {
      live = false;
    };
  }, [id]);

  if (lesson === undefined) return <p className={styles.status}>Loading…</p>;
  if (!lesson || !hasLesson(id)) {
    return (
      <div className={styles.status}>
        <p>This lesson is not available yet.</p>
        <Link to="/">Back to Home</Link>
      </div>
    );
  }
  return <Player lesson={lesson} rules={rules} />;
}

function Player({ lesson, rules }: { lesson: Lesson; rules: Map<string, Rule> }) {
  const navigate = useNavigate();
  const progress = useProgress((s) => s.lessons[lesson.id]);
  const { startLesson, setScreen, completeScreen, recordAttempt, completeLesson } =
    useProgress.getState();
  useActiveTime();

  const total = lesson.screens.length;
  const [params] = useSearchParams();
  const [idx, setIdx] = useState(() => {
    // Coverage links open a given screen: ?screen=1.2.06
    const wanted = lesson.screens.findIndex((s) => s.id === params.get("screen"));
    if (wanted >= 0) return wanted;
    // A finished lesson opens from the start. A lesson in progress opens at the saved screen (FR-12).
    if (!progress || progress.state === "complete") return 0;
    return Math.min(progress.screen, total - 1);
  });
  const screen = lesson.screens[idx];
  const isLast = idx === total - 1;

  const [phase, setPhase] = useState<Phase>("answering");
  const [input, setInput] = useState<Input>(emptyInput);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [onTwin, setOnTwin] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [trapDone, setTrapDone] = useState(false);
  const [removed, setRemoved] = useState<Removed>({ l: 0, r: 0 });
  const [proofDone, setProofDone] = useState<Record<number, string>>({});
  const [proofPending, setProofPending] = useState<string | null>(null);
  const [proofWrong, setProofWrong] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const focusFirst = () =>
    window.setTimeout(
      () =>
        mainRef.current
          ?.querySelector<HTMLElement>(
            '[role="slider"], input:not([disabled]), button[aria-pressed]:not([disabled]), [role="group"] button:not([disabled]), [data-testid^="cube"]',
          )
          ?.focus(),
      0,
    );

  useEffect(() => {
    startLesson(lesson.id, total);
    void requestPersistentStorage();
  }, [lesson.id, total, startLesson]);

  const interaction: Interaction = onTwin && screen.twin ? screen.twin : screen.interaction;
  const spec = useMemo(() => answerSpec(interaction), [interaction]);
  const isTrap = interaction.type === "trap-summary";
  const mathReady = useMath(
    spec.t === "text" || (interaction.type === "number-line" && interaction.mode === "interval"),
  );
  const hints = screen.hints ?? [];
  const proofI = interaction.type === "proof" ? interaction : null;
  const proofDoneSet = useMemo(() => new Set(Object.keys(proofDone).map(Number)), [proofDone]);
  const proofActive = proofI ? activeLine(proofI, proofDoneSet) : 0;
  const proofComplete = proofI ? proofActive >= proofI.lines.length : false;

  const resetScreen = useCallback(() => {
    setPhase("answering");
    setInput(emptyInput());
    setOutcome(null);
    setWrongCount(0);
    setOnTwin(false);
    setHintsShown(0);
    setHintOpen(false);
    setInvalid(null);
    setTrapDone(false);
    setRemoved({ l: 0, r: 0 });
    setProofDone({});
    setProofPending(null);
    setProofWrong(false);
  }, []);

  // New screen: move focus to the first field. (State is reset in `advance`.)
  useEffect(() => {
    const t = focusFirst();
    return () => window.clearTimeout(t);
  }, [idx]);

  const advance = () => {
    completeScreen(lesson.id, screen.id);
    if (isLast) {
      completeLesson(lesson.id, lesson.rulesEarned);
      navigate("/");
      return;
    }
    setScreen(lesson.id, idx + 1);
    resetScreen();
    setIdx(idx + 1);
  };

  const close = () => {
    setScreen(lesson.id, idx);
    navigate("/");
  };

  const retry = () => {
    setPhase("answering");
    setOutcome(null);
    setInput(emptyInput());
    setHintOpen(false);
    setProofPending(null);
    setProofWrong(false);
    focusFirst();
  };

  const checkProof = () => {
    if (!proofI || proofPending === null) return;
    const expected = proofI.lines[proofActive].reason as string;
    const result = checkProofLine(expected, proofPending, proofI.wrongReasonReplies);
    recordAttempt(lesson.id, screen.id);
    setHintOpen(false);
    if (result.kind === "correct") {
      const next = { ...proofDone, [proofActive]: proofPending };
      setProofDone(next);
      setProofPending(null);
      setProofWrong(false);
      if (activeLine(proofI, new Set(Object.keys(next).map(Number))) >= proofI.lines.length) {
        setOutcome({
          kind: "correct",
          title: proofI.feedback.correctTitle,
          body: proofI.feedback.correctWhy,
        });
        setPhase("feedback");
      }
      return;
    }
    const chip = trayChips(proofI, rules).find((c) => c.id === proofPending);
    setProofWrong(true);
    setWrongCount((n) => n + 1);
    setOutcome({
      kind: "wrong-reason",
      title: `Not ${chip?.label ?? proofPending}.`,
      body: result.kind === "mistake" ? result.reply : lesson.generalHint,
    });
    setPhase("feedback");
  };

  const check = () => {
    if (proofI) return proofComplete ? advance() : checkProof();
    if (spec.t === "none") return advance();
    if (!hasAnswer(spec, input) || !mathReady) return;
    const result = evaluate(spec, input, lesson.generalHint);
    if (result.kind === "invalid") {
      setInvalid(result.body);
      return;
    }
    setInvalid(null);
    setHintOpen(false);
    recordAttempt(lesson.id, screen.id);
    setOutcome(result);
    setPhase("feedback");
    if (result.kind === "not-quite") setWrongCount((n) => n + 1);
  };

  const showMe = () => {
    setPhase("show-me");
    setHintOpen(false);
  };

  const afterShowMe = () => {
    // FR-19: after the worked solution, the twin problem. Without a twin, try again.
    if (screen.twin) {
      setOnTwin(true);
      setWrongCount(0);
      setHintsShown(0);
      retry();
    } else {
      retry();
    }
  };

  const toggleHint = () => {
    if (!hintOpen) {
      setHintsShown((n) => Math.max(n, 1));
      setHintOpen(true);
    } else if (hintsShown < hints.length) {
      setHintsShown((n) => n + 1);
    } else {
      setHintOpen(false);
    }
  };

  const onSubmit = () => {
    if (phase === "show-me") return afterShowMe();
    if (phase === "feedback") {
      if (outcome?.kind === "correct") return advance();
      return retry();
    }
    if (isTrap) return advance();
    check();
  };

  const verdict: Verdict =
    phase === "feedback" && outcome ? (outcome.kind === "correct" ? "correct" : "wrong") : "idle";
  const canCheck = hasAnswer(spec, input);

  /* Primary button */
  let primaryLabel: string;
  if (isTrap)
    primaryLabel = screen.buttonLabel ?? (lesson.next ? `Next: ${lesson.next.title}` : "Finish");
  else if (proofI) primaryLabel = screen.buttonLabel ?? "Check";
  else if (spec.t === "none") primaryLabel = screen.buttonLabel ?? (isLast ? "Finish" : "Continue");
  else primaryLabel = screen.buttonLabel ?? "Check";

  const primary = (
    <Button
      type="submit"
      variant="primary"
      disabled={proofI ? proofPending === null : !isTrap && spec.t !== "none" && !canCheck}
      data-testid="primary"
      style={phase === "answering" ? undefined : { visibility: "hidden" }}
      tabIndex={phase === "answering" ? 0 : -1}
    >
      {primaryLabel}
    </Button>
  );

  /* Feedback sheet */
  let sheet: React.ReactNode = null;
  if (phase === "feedback" && outcome && outcome.kind !== "invalid") {
    if (outcome.kind === "correct") {
      sheet = (
        <FeedbackSheet
          kind="correct"
          title={outcome.title}
          actions={
            <Button type="submit" variant="primary" data-testid="continue" autoFocus>
              {isLast ? "Finish" : "Continue"}
            </Button>
          }
        >
          <RichText text={outcome.body} />
        </FeedbackSheet>
      );
    } else if (outcome.kind === "wrong-reason") {
      sheet = (
        <FeedbackSheet
          kind="wrong-reason"
          title={outcome.title}
          actions={
            <Button type="submit" variant="primary" data-testid="try-again" autoFocus>
              Try again
            </Button>
          }
        >
          <RichText text={outcome.body} />
        </FeedbackSheet>
      );
    } else {
      const canShowMe = wrongCount >= 2 && Boolean(screen.showMe) && !onTwin;
      sheet = (
        <FeedbackSheet
          kind="not-quite"
          title={outcome.title}
          actions={
            <>
              {canShowMe && (
                <Button type="button" variant="secondary" onClick={showMe} data-testid="show-me">
                  Show me why
                </Button>
              )}
              <Button type="submit" variant="primary" data-testid="try-again" autoFocus>
                Try again
              </Button>
            </>
          }
        >
          <RichText text={outcome.body} />
        </FeedbackSheet>
      );
    }
  }
  if (phase === "show-me") {
    sheet = null;
  }

  const drawer =
    hintOpen && hintsShown > 0 && hints[hintsShown - 1] ? (
      <HintDrawer
        index={hintsShown as 1 | 2}
        total={hints.length as 1 | 2}
        text={hints[hintsShown - 1]}
        onHide={() => setHintOpen(false)}
      />
    ) : null;

  const trapNote =
    isTrap && trapDone && interaction.type === "trap-summary" ? (
      <p className={styles.trapNote} role="status">
        <strong>{trapTitle(interaction, input)}</strong>{" "}
        <RichText text={trapBody(interaction, input)} />
      </p>
    ) : null;

  const onTrap = (choiceId: string) => {
    if (trapDone) return;
    setInput({ ...input, choice: choiceId });
    setTrapDone(true);
    recordAttempt(lesson.id, screen.id);
  };

  const proofState: ProofState | undefined = proofI
    ? {
        active: proofActive,
        done: proofDone,
        pending: proofPending,
        wrong: proofWrong,
        onPick: (chip) => {
          if (phase !== "answering" || proofComplete) return;
          setProofPending(chip);
          setProofWrong(false);
        },
      }
    : undefined;

  const showAside = !onTwin && (screen.tryTask || screen.note);

  return (
    <PlayerFrame
      bar={<LessonBar total={total} current={idx + 1} onClose={close} />}
      label={onTwin ? "TRY ANOTHER" : screen.label}
      title={screen.title}
      prompt={<RichText text={onTwin ? "Now try this one." : screen.prompt} />}
      aside={
        showAside ? (
          <>
            {screen.tryTask && <TryBox>{screen.tryTask}</TryBox>}
            {screen.note && (
              <aside className={styles.note} aria-label={screen.note.label}>
                <p className={styles.noteLabel}>{screen.note.label}</p>
                <p className={styles.noteText}>
                  <RichText text={screen.note.text} />
                </p>
              </aside>
            )}
          </>
        ) : null
      }
      caption={phase === "answering" ? screen.caption : undefined}
      primary={primary}
      sheet={sheet}
      drawer={drawer}
      onSubmit={onSubmit}
    >
      <div ref={mainRef} className={styles.stage}>
        {phase === "show-me" && screen.showMe ? (
          <ShowMe
            steps={screen.showMe.steps}
            onContinue={afterShowMe}
            hasTwin={Boolean(screen.twin)}
          />
        ) : (
          <ScreenRenderer
            key={`${screen.id}-${onTwin}`}
            screen={screen}
            interaction={interaction}
            rules={rules}
            input={input}
            onInput={setInput}
            verdict={verdict}
            slotStates={verdict === "idle" ? undefined : partStates(spec, input)}
            locked={phase === "feedback" && outcome?.kind === "correct"}
            hintChip={
              hints.length > 0 && phase === "answering"
                ? { onClick: toggleHint, open: hintOpen }
                : null
            }
            invalidMessage={invalid}
            onTrap={onTrap}
            trapNote={trapNote}
            onEnter={onSubmit}
            proof={proofState}
            removed={removed}
            onRemoved={setRemoved}
          />
        )}
      </div>
    </PlayerFrame>
  );
}

function ShowMe({
  steps,
  onContinue,
  hasTwin,
}: {
  steps: { math?: string; text: string }[];
  onContinue: () => void;
  hasTwin: boolean;
}) {
  return (
    <section className={styles.showMe} aria-label="Worked solution" data-testid="show-me-steps">
      <p className={styles.noteLabel}>WORKED SOLUTION</p>
      <ol className={styles.steps}>
        {steps.map((s, k) => (
          <li key={k}>
            <RichText text={s.text} />
            {s.math && <Tex tex={s.math} className={styles.stepMath} />}
          </li>
        ))}
      </ol>
      <Button type="button" variant="primary" onClick={onContinue} data-testid="show-me-continue">
        {hasTwin ? "Try a similar one" : "Try again"}
      </Button>
    </section>
  );
}

function trapTitle(i: Extract<Interaction, { type: "trap-summary" }>, input: Input): string {
  return input.choice === i.trap.correct ? i.trap.feedback.correctTitle : "Not quite.";
}
function trapBody(i: Extract<Interaction, { type: "trap-summary" }>, input: Input): string {
  if (input.choice === i.trap.correct) return i.trap.feedback.correctWhy;
  return i.trap.options.find((o) => o.id === input.choice)?.reply ?? i.trap.feedback.correctWhy;
}

export type { Screen };
