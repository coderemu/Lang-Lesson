import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components";
import { CloseIcon } from "../components";
import { courseLesson } from "../content/course";
import { hasBank } from "../content/load";
import { useLoaded } from "../content/useContent";
import { loadBank } from "../content/load";
import { RichText } from "../math";
import { useProgress } from "../store";
import { PageHeader } from "./PageHeader";
import styles from "./BankOverview.module.css";
import app from "./app.module.css";

const STATE_LABEL = { correct: "Correct", "not-yet": "Not yet", none: "Not tried" } as const;

/** `/practice/:id`: the bank overview (FR-34). Without navigation. */
export function BankOverview() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const bank = useLoaded(() => loadBank(id));
  const progress = useProgress((s) => s.banks[id]);
  const lesson = courseLesson(id);

  if (!hasBank(id)) {
    return (
      <div className={styles.page}>
        <PageHeader
          label="PRACTICE"
          title="Bank not available"
          subtitle="This bank comes in a later phase."
        />
        <Link to="/">Back to Home</Link>
      </div>
    );
  }
  if (!bank)
    return (
      <div className={styles.page}>
        <PageHeader label="PRACTICE" title={`Bank ${id}`} subtitle="Loading…" />
      </div>
    );

  const stateOf = (pid: string) => progress?.problems[pid]?.state ?? "none";
  const notYet = bank.problems.filter((p) => stateOf(p.id) === "not-yet");
  const required = bank.problems.filter((p) => !p.stretch);
  const correct = required.filter((p) => stateOf(p.id) === "correct").length;
  const complete = correct === required.length;
  const firstOpen = bank.problems.find((p) => stateOf(p.id) !== "correct") ?? bank.problems[0];
  const resumeAt = bank.problems[Math.min(progress?.position ?? 0, bank.problems.length - 1)];
  const started = Object.keys(progress?.problems ?? {}).length > 0;

  return (
    <div className={styles.page}>
      <button
        type="button"
        className={styles.close}
        onClick={() => navigate("/")}
        aria-label="Close bank"
      >
        <CloseIcon size={22} />
      </button>
      <PageHeader
        label={`PRACTICE · LESSON ${id}`}
        title={bank.title + (lesson ? `: ${lesson.title}` : "")}
        subtitle={`${correct} of ${required.length} correct${complete ? ". Bank complete." : ""}${bank.note ? ` ${bank.note}` : ""}`}
      />
      <div className={styles.actions}>
        <Link
          to={`/practice/${id}/${(started ? resumeAt : firstOpen).n}`}
          className={styles.primary}
          data-testid="start-practice"
        >
          {started ? "Continue practice" : "Start practice"}
        </Link>
        {notYet.length > 0 && (
          <Link
            to={`/practice/${id}/${notYet[0].n}?only=not-yet`}
            className={styles.secondary}
            data-testid="practice-again"
          >
            Practice again ({notYet.length} not yet)
          </Link>
        )}
      </div>
      <ul className={`${app.card} ${styles.list}`}>
        {[...notYet, ...bank.problems.filter((p) => stateOf(p.id) !== "not-yet")].map((p) => (
          <li key={p.id} className={styles.item}>
            <Link to={`/practice/${id}/${p.n}`} className={styles.itemLink}>
              <span className={styles.num}>{p.n}</span>
              <span className={styles.text}>
                <span className={app.rowTitle}>
                  <RichText text={p.prompt} />
                </span>
                <span className={app.rowMeta}>
                  {p.langType}
                  {p.stretch && <strong className={styles.stretch}> · STRETCH</strong>}
                </span>
              </span>
              <span className={styles.state} data-state={stateOf(p.id)}>
                {STATE_LABEL[stateOf(p.id) as keyof typeof STATE_LABEL]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={() => navigate("/")}>
        Back to Home
      </Button>
    </div>
  );
}
