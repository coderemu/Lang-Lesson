import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { PracticeBank, PracticeProblem } from "../../content/schema";
import {
  Button,
  ChoiceChip,
  FeedbackSheet,
  HintChip,
  HintDrawer,
  LessonBar,
  NumberSlot,
} from "../components";
import { loadBank } from "../content/load";
import { RichText } from "../math";
import { requestPersistentStorage, useProgress } from "../store";
import {
  emptyInput,
  evaluatePractice,
  NOT_QUITE,
  type Input,
  type PracticeOutcome,
} from "./answers";
import { PlayerFrame } from "./PlayerFrame";
import { useActiveTime } from "./useActiveTime";
import styles from "./PracticePlayer.module.css";
import lessonStyles from "./LessonPlayer.module.css";
import ruleStyles from "./ScreenRenderer.module.css";

/** `/practice/:id/:n`. Query `only=not-yet` plays the "not yet" problems only (FR-34). */
export function PracticePlayer() {
  const { id = "", n = "1" } = useParams();
  const [bank, setBank] = useState<PracticeBank | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void loadBank(id).then((b) => live && setBank(b));
    return () => {
      live = false;
    };
  }, [id]);
  if (bank === undefined) return <p className={lessonStyles.status}>Loading…</p>;
  if (!bank) {
    return (
      <div className={lessonStyles.status}>
        <p>This bank is not available yet.</p>
        <Link to="/">Back to Home</Link>
      </div>
    );
  }
  return <Problem key={`${id}/${n}`} bank={bank} n={Number(n)} />;
}

type Phase = "answering" | "feedback" | "solution";

function Problem({ bank, n }: { bank: PracticeBank; n: number }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const onlyNotYet = params.get("only") === "not-yet";
  useActiveTime();

  const index = Math.max(
    0,
    bank.problems.findIndex((p) => p.n === n),
  );
  const problem = bank.problems[index];
  const { setProblem, setBankPosition } = useProgress.getState();

  const [phase, setPhase] = useState<Phase>("answering");
  const [input, setInput] = useState<Input>(emptyInput);
  const [outcome, setOutcome] = useState<PracticeOutcome | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false); // self-check: solution shown
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBankPosition(bank.lesson, index);
    void requestPersistentStorage();
    const t = window.setTimeout(
      () => stageRef.current?.querySelector<HTMLElement>("input")?.focus(),
      0,
    );
    return () => window.clearTimeout(t);
  }, [bank.lesson, index, setBankPosition]);

  const answer = problem.answer;
  const hints = problem.hints ?? [];

  const nextProblem = useMemo((): PracticeProblem | null => {
    const progress = useProgress.getState().banks[bank.lesson]?.problems ?? {};
    for (let k = index + 1; k < bank.problems.length; k++) {
      const p = bank.problems[k];
      if (!onlyNotYet || progress[p.id]?.state === "not-yet") return p;
    }
    return null;
    // Recomputed when the phase changes, so the stored state of this problem is included.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank, index, onlyNotYet, phase]);

  const goNext = () => {
    if (nextProblem) {
      navigate(`/practice/${bank.lesson}/${nextProblem.n}${onlyNotYet ? "?only=not-yet" : ""}`);
    } else {
      navigate(`/practice/${bank.lesson}`);
    }
  };
  const close = () => navigate(`/practice/${bank.lesson}`);

  const retry = () => {
    setPhase("answering");
    setOutcome(null);
    setInput(emptyInput());
    setHintOpen(false);
    window.setTimeout(() => stageRef.current?.querySelector<HTMLElement>("input")?.focus(), 0);
  };

  const mark = (state: "correct" | "not-yet") => {
    // A problem already correct stays correct.
    const cur = useProgress.getState().banks[bank.lesson]?.problems[problem.id]?.state;
    setProblem(
      bank.lesson,
      problem.id,
      cur === "correct" && state === "not-yet" ? "correct" : state,
    );
  };

  const check = () => {
    const result = evaluatePractice(answer, input);
    if (result.kind === "invalid") {
      setInvalid(result.body);
      return;
    }
    setInvalid(null);
    setHintOpen(false);
    setOutcome(result);
    setPhase("feedback");
    if (result.kind === "correct") mark("correct");
    else {
      mark("not-yet");
      setWrongCount((c) => c + 1);
    }
  };

  const selfMark = (m: "got-it" | "not-yet") => {
    mark(m === "got-it" ? "correct" : "not-yet");
    goNext();
  };

  const isSelf = answer.type === "self-check";
  const isNone = answer.type === "none";
  const supported = ["number", "numbers", "choice", "self-check", "none"].includes(answer.type);

  const hasInput =
    answer.type === "number"
      ? (input.text[0] ?? "").trim() !== ""
      : answer.type === "numbers"
        ? answer.values.every((_, k) => (input.text[k] ?? "").trim() !== "")
        : answer.type === "choice"
          ? input.choice !== null
          : true;

  const toggleHint = () => {
    if (!hintOpen) {
      setHintsShown((c) => Math.max(c, 1));
      setHintOpen(true);
    } else if (hintsShown < hints.length) setHintsShown((c) => c + 1);
    else setHintOpen(false);
  };

  const onSubmit = () => {
    if (phase === "feedback") return outcome?.kind === "correct" ? goNext() : retry();
    if (phase === "solution") return goNext();
    if (isSelf) {
      if (!revealed) setRevealed(true);
      return;
    }
    if (!supported) return goNext();
    if (hasInput) check();
  };

  const verdict =
    phase === "feedback" && outcome ? (outcome.kind === "correct" ? "correct" : "wrong") : "idle";

  /* Answer area */
  const answerArea = () => {
    if (answer.type === "number") {
      return (
        <div className={ruleStyles.row}>
          <NumberSlot
            label="Your answer"
            value={input.text[0] ?? ""}
            onChange={(v) => setInput({ ...input, text: [v] })}
            state={verdict === "idle" ? "default" : verdict}
            disabled={phase !== "answering"}
          />
          {hints.length > 0 && phase === "answering" && (
            <HintChip onClick={toggleHint} open={hintOpen} />
          )}
        </div>
      );
    }
    if (answer.type === "numbers") {
      return (
        <div className={ruleStyles.row}>
          {answer.values.map((_, k) => (
            <NumberSlot
              key={k}
              label={`Your answer ${k + 1}`}
              value={input.text[k] ?? ""}
              onChange={(v) => {
                const text = [...input.text];
                text[k] = v;
                setInput({ ...input, text });
              }}
              state={verdict === "idle" ? "default" : verdict}
              disabled={phase !== "answering"}
              compact
            />
          ))}
        </div>
      );
    }
    if (answer.type === "choice") {
      return (
        <div className={ruleStyles.chips} role="group" aria-label="Choices">
          {answer.options.map((o, k) => (
            <ChoiceChip
              key={k}
              selected={input.choice === String(k)}
              state={
                verdict === "idle" || input.choice !== String(k)
                  ? "default"
                  : k === answer.correct
                    ? "correct"
                    : "wrong"
              }
              disabled={phase !== "answering"}
              onClick={() => setInput({ ...input, choice: String(k) })}
            >
              <RichText text={o} />
            </ChoiceChip>
          ))}
        </div>
      );
    }
    if (isSelf) {
      return revealed ? (
        <SolutionBox problem={problem} />
      ) : (
        <p className={styles.paper}>Write your solution on paper. Then tap “Show solution”.</p>
      );
    }
    return <p className={styles.paper}>This kind of problem comes in a later phase.</p>;
  };

  /* Primary and sheet */
  let primary: React.ReactNode;
  if (isSelf && revealed) {
    primary = (
      <div className={styles.selfButtons}>
        <Button
          type="button"
          variant="secondary"
          onClick={() => selfMark("not-yet")}
          data-testid="not-yet"
        >
          Not yet
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => selfMark("got-it")}
          data-testid="got-it"
        >
          I got it
        </Button>
      </div>
    );
  } else if (isSelf) {
    primary = (
      <Button type="submit" variant="primary" data-testid="show-solution">
        Show solution
      </Button>
    );
  } else if (!supported || isNone) {
    primary = (
      <Button type="submit" variant="primary">
        Continue
      </Button>
    );
  } else {
    primary = (
      <Button
        type="submit"
        variant="primary"
        disabled={!hasInput}
        data-testid="primary"
        style={phase === "answering" ? undefined : { visibility: "hidden" }}
        tabIndex={phase === "answering" ? 0 : -1}
      >
        Check
      </Button>
    );
  }

  let sheet: React.ReactNode = null;
  if (phase === "feedback" && outcome && outcome.kind !== "invalid") {
    if (outcome.kind === "correct") {
      sheet = (
        <FeedbackSheet
          kind="correct"
          title="Correct."
          actions={
            <Button type="submit" variant="primary" data-testid="continue">
              {nextProblem ? "Next problem" : "Finish"}
            </Button>
          }
        >
          <RichText text={`Answer: ${problem.answerText}`} />
        </FeedbackSheet>
      );
    } else {
      sheet = (
        <FeedbackSheet
          kind="not-quite"
          title={NOT_QUITE}
          actions={
            <>
              {wrongCount >= 2 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPhase("solution")}
                  data-testid="show-me"
                >
                  Show me why
                </Button>
              )}
              <Button type="submit" variant="primary" data-testid="try-again">
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
  if (phase === "solution") {
    sheet = (
      <FeedbackSheet
        kind="not-quite"
        title="Here is the solution."
        actions={
          <Button type="submit" variant="primary" data-testid="continue">
            {nextProblem ? "Next problem" : "Finish"}
          </Button>
        }
      >
        <RichText text={`Answer: ${problem.answerText}`} />
      </FeedbackSheet>
    );
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

  return (
    <PlayerFrame
      bar={<LessonBar total={bank.problems.length} current={index + 1} onClose={close} />}
      label={`PRACTICE · ${problem.langType.toUpperCase()}`}
      title={`Problem ${problem.n}`}
      prompt={<RichText text={problem.prompt} />}
      aside={problem.stretch ? <p className={styles.stretch}>STRETCH · optional</p> : undefined}
      primary={primary}
      sheet={sheet}
      drawer={drawer}
      onSubmit={onSubmit}
    >
      <div ref={stageRef} className={lessonStyles.stage}>
        {phase === "solution" && <SolutionBox problem={problem} />}
        {phase !== "solution" && answerArea()}
        {invalid && (
          <p className={ruleStyles.invalid} role="alert">
            {invalid}
          </p>
        )}
      </div>
    </PlayerFrame>
  );
}

function SolutionBox({ problem }: { problem: PracticeProblem }) {
  return (
    <section className={lessonStyles.showMe} aria-label="Solution" data-testid="solution">
      <p className={lessonStyles.noteLabel}>SOLUTION</p>
      <p className={lessonStyles.noteText}>
        <RichText text={`Answer: ${problem.answerText}`} />
      </p>
      {problem.solution && (
        <ol className={lessonStyles.steps}>
          {problem.solution.map((s, k) => (
            <li key={k}>
              <RichText text={s.replace(/\$/g, "")} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
