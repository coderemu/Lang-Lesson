import { Link } from "react-router-dom";
import type { CoverageRow } from "../../content/schema";
import { CHAPTER_TITLES, phaseOfChapter } from "../content/course";
import { useBanks, useCoverage } from "../content/useContent";
import { RichText } from "../math";
import {
  bankOfProblem,
  chapterTotals,
  lessonOfScreen,
  rowStatus,
  type RowStatus,
} from "../engine/coverage";
import { useProgress } from "../store";
import { PageHeader } from "./PageHeader";
import styles from "./Coverage.module.css";
import app from "./app.module.css";

const STATUS_LABEL: Record<RowStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  covered: "Covered",
  skip: "Later chapter in Lang",
};

export function Coverage() {
  const data = useProgress();
  const coverage = useCoverage();
  const banks = useBanks();
  if (!coverage || !banks)
    return <PageHeader label="BASIC MATHEMATICS · LANG" title="Coverage map" subtitle="Loading…" />;

  return (
    <div className={app.page}>
      <PageHeader
        label="BASIC MATHEMATICS · LANG"
        title="Coverage map"
        subtitle="Every topic and exercise group of Lang, and where this course covers it."
      />
      {[1, 2, 3, 4].map((chapter) => {
        const rows = coverage.rows.filter((r) => r.chapter === chapter);
        const totals = chapterTotals(coverage.rows, chapter, data, banks);
        const sections = [...new Set(rows.map((r) => r.section))];
        return (
          <section key={chapter} className={styles.chapter} aria-label={`Chapter ${chapter}`}>
            <div className={app.chapterHead}>
              <p className={app.eyebrow}>
                Chapter {chapter} · {CHAPTER_TITLES[chapter]}
              </p>
              <p className={app.meta} data-testid={`total-${chapter}`}>
                {rows.length === 0
                  ? `Coming in phase ${phaseOfChapter(chapter)}`
                  : `Chapter ${chapter}: ${totals.covered} of ${totals.total} covered`}
              </p>
            </div>
            {sections.map((section) => (
              <div key={section} className={`${app.card} ${styles.section}`}>
                {section && <p className={`${app.eyebrow} ${styles.sectionHead}`}>{section}</p>}
                {rows
                  .filter((r) => r.section === section)
                  .map((r) => (
                    <Row key={r.id} row={r} status={rowStatus(r, data, banks)} />
                  ))}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function Row({ row, status }: { row: CoverageRow; status: RowStatus }) {
  const lessons = [...new Set(row.lessonScreens.map(lessonOfScreen))];
  return (
    <div className={styles.row} data-testid="coverage-row" data-status={status}>
      <div className={styles.main}>
        <p className={styles.topic}>
          <RichText text={row.topic} />
        </p>
        <p className={styles.where}>
          {lessons.map((l) => (
            <Link
              key={l}
              to={`/lesson/${l}?screen=${row.lessonScreens.find((s) => lessonOfScreen(s) === l)}`}
            >
              Lesson {l} · screen{" "}
              {row.lessonScreens
                .filter((s) => lessonOfScreen(s) === l)
                .map((s) => Number(s.split(".")[2]))
                .join(", ")}
            </Link>
          ))}
          {row.bankProblems.map((b) => bankLink(b))}
          {row.kind === "skip" && row.note}
          {row.kind !== "skip" && row.note && <span>{row.note}</span>}
        </p>
      </div>
      <span className={styles.status} data-status={status}>
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}

function bankLink(b: string) {
  if (b.startsWith("bank:")) {
    const id = b.slice(5);
    return (
      <Link key={b} to={`/practice/${id}`}>
        Bank {id}
      </Link>
    );
  }
  const bank = bankOfProblem(b);
  const n = Number(b.split(".").at(-1));
  return bank ? (
    <Link key={b} to={`/practice/${bank}/${n}`}>
      Bank {bank} · no. {n}
    </Link>
  ) : null;
}
