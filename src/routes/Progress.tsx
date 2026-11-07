import { Link } from "react-router-dom";
import type { PracticeBank } from "../../content/schema";
import { CHAPTER_TITLES, COURSE, lessonsOfChapter } from "../content/course";
import { useBanks, useRules } from "../content/useContent";
import { RichText } from "../math";
import { bankCounts, useProgress, weekSeconds, weekdayIndex, type ProgressData } from "../store";
import { PageHeader } from "./PageHeader";
import styles from "./app.module.css";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** The bank to show in the tile: the one with the most recent work (highest id with any progress). */
export function currentBankId(data: ProgressData, banks: Map<string, PracticeBank>): string | null {
  const touched = [...banks.keys()].filter(
    (id) => Object.keys(data.banks[id]?.problems ?? {}).length > 0,
  );
  if (touched.length) return touched.sort().at(-1) ?? null;
  const done = COURSE.filter((l) => data.lessons[l.id]?.state === "complete" && banks.has(l.id));
  if (done.length) return done[done.length - 1].id;
  return [...banks.keys()].sort()[0] ?? null;
}

/** Non-stretch problems of a bank. */
export const requiredProblems = (bank: PracticeBank) => bank.problems.filter((p) => !p.stretch);

export function Progress() {
  const data = useProgress();
  const rules = useRules();
  const banks = useBanks();

  const lessonsDone = COURSE.filter((l) => data.lessons[l.id]?.state === "complete").length;
  const earned = Object.keys(data.rules).length;
  const week = weekSeconds(data);
  const weekMin = Math.round(week.reduce((a, b) => a + b, 0) / 60);
  const bankId = banks ? currentBankId(data, banks) : null;
  const bank = bankId ? banks?.get(bankId) : undefined;
  const bankCorrect = bankId ? bankCounts(data, bankId).correct : 0;
  const bankTotal = bank?.problems.length ?? 0;

  const needs: { bank: PracticeBank; id: string }[] = [];
  if (banks) {
    for (const [lessonId, b] of banks) {
      for (const p of b.problems) {
        if (data.banks[lessonId]?.problems[p.id]?.state === "not-yet")
          needs.push({ bank: b, id: p.id });
      }
    }
  }

  const max = Math.max(...week, 60);
  const today = weekdayIndex();

  return (
    <div className={styles.page}>
      <PageHeader label="PROGRESS" title="Your progress" />
      <div className={styles.progressGrid}>
        <div className={styles.gTiles}>
          <div className={styles.tiles}>
            <Tile value={lessonsDone} of={COURSE.length} label="Lessons done" />
            <Tile value={earned} of={rules?.length ?? 0} label="Rules earned" />
            <Tile
              value={bankCorrect}
              of={bankTotal}
              label={bankId ? `Bank ${bankId} correct` : "Bank correct"}
            />
            <Tile value={weekMin} unit="min" label="Time this week" />
          </div>
        </div>
        <div className={styles.gWeek}>
          <section className={`${styles.card} ${styles.cardPad}`} aria-label="This week">
            <div className={styles.cardHead}>
              <p className={styles.eyebrow}>This week</p>
              <p className={styles.meta}>{weekMin} min</p>
            </div>
            <div
              className={styles.bars}
              role="img"
              aria-label={`Minutes per day, this week: ${week.map((s) => Math.round(s / 60)).join(", ")}`}
            >
              {week.map((s, k) => (
                <div key={k} className={styles.barCol}>
                  {s > 0 && (
                    <div
                      className={styles.bar}
                      data-today={k === today}
                      style={{ height: `${Math.max(6, (s / max) * 100)}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className={styles.days} aria-hidden="true">
              {DAYS.map((d, k) => (
                <span key={k} data-today={k === today}>
                  {d}
                </span>
              ))}
            </div>
          </section>
        </div>
        <div className={styles.gNeeds}>
          <section className={`${styles.card} ${styles.cardPad}`} aria-label="Needs practice">
            <div className={styles.cardHead}>
              <p className={styles.eyebrow}>Needs practice</p>
              <p className={styles.meta}>
                {needs.length} {needs.length === 1 ? "problem" : "problems"}
              </p>
            </div>
            {needs.length === 0 && (
              <p className={styles.empty}>
                Nothing to repeat. Problems you miss will show up here.
              </p>
            )}
            <div>
              {needs.map(({ bank: b, id }) => {
                const p = b.problems.find((x) => x.id === id)!;
                return (
                  <div key={id} className={styles.practiceRow}>
                    <div className={styles.practiceText}>
                      <span className={styles.rowTitle}>
                        <RichText text={p.prompt} />
                      </span>
                      <span className={styles.rowMeta}>
                        Bank {b.lesson} · no. {p.n} · {p.langType}
                      </span>
                    </div>
                    <Link
                      to={`/practice/${b.lesson}/${p.n}`}
                      className={styles.pill}
                      aria-label={`Practice problem ${p.n} of bank ${b.lesson}`}
                    >
                      Practice
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <div className={styles.gChapter}>
          <section className={`${styles.card} ${styles.cardPad}`} aria-label="By chapter">
            <p className={styles.eyebrow}>By chapter</p>
            <div>
              {[1, 2, 3, 4].map((c) => {
                const ls = lessonsOfChapter(c);
                const done = ls.filter((l) => data.lessons[l.id]?.state === "complete").length;
                return (
                  <div key={c} className={styles.chapterRow}>
                    <div className={styles.chapterLine}>
                      <span>
                        <strong>{c}</strong> · {CHAPTER_TITLES[c]}
                      </span>
                      <span className={styles.meta}>
                        {done} of {ls.length} lessons
                      </span>
                    </div>
                    <div
                      className={styles.trackDark}
                      role="img"
                      aria-label={`${done} of ${ls.length} lessons done`}
                    >
                      <div style={{ width: `${(done / ls.length) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/coverage" className={styles.link}>
              See coverage map
            </Link>
          </section>
        </div>
        <div className={styles.gSettings}>
          <Link to="/settings" className={`${styles.card} ${styles.linkRow}`}>
            Settings and backup <span aria-hidden="true">›</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Tile({
  value,
  of,
  unit,
  label,
}: {
  value: number;
  of?: number;
  unit?: string;
  label: string;
}) {
  return (
    <div className={styles.tile}>
      <p className={styles.tileValue}>
        {value} {of !== undefined && <span className={styles.tileUnit}>/ {of}</span>}
        {unit && <span className={styles.tileUnit}>{unit}</span>}
      </p>
      <p className={styles.tileLabel}>{label}</p>
    </div>
  );
}
