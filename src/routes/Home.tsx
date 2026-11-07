import { Link } from "react-router-dom";
import { LockIcon } from "../components";
import {
  CHAPTER_TITLES,
  COURSE,
  lessonsOfChapter,
  phaseOfChapter,
  type CourseLesson,
} from "../content/course";
import { hasBank, hasLesson } from "../content/load";
import { useDesktop } from "../content/useContent";
import { lessonState, useProgress, type LessonState } from "../store";
import { PageHeader } from "./PageHeader";
import styles from "./app.module.css";

const ids = COURSE.map((l) => l.id);

type RowState = LessonState | "soon";

export function Home() {
  const data = useProgress();
  const desktop = useDesktop();

  const stateOf = (l: CourseLesson): RowState => {
    const s = lessonState(data, ids, l.id);
    if (!hasLesson(l.id) && s !== "complete" && s !== "in-progress") return "soon";
    return s;
  };

  // The lesson to continue: in progress first, else the first open lesson that exists.
  const inProgress = COURSE.find((l) => stateOf(l) === "in-progress");
  const next = inProgress ?? COURSE.find((l) => stateOf(l) === "open");
  const currentChapter = next?.chapter ?? 1;

  const chapters = [1, 2, 3, 4];
  const mainChapters = desktop ? [currentChapter] : chapters;
  const laterChapters = chapters.filter((c) => c !== currentChapter);

  const continueCard = next && (
    <ContinueCard lesson={next} state={stateOf(next)} screen={data.lessons[next.id]?.screen ?? 0} />
  );

  return (
    <div className={styles.page}>
      <PageHeader
        label="BASIC MATHEMATICS · LANG"
        title="Your course"
        subtitle="Chapters 1–4 · 19 lessons"
      />
      <div className={styles.cols}>
        <div className={styles.col}>
          {!desktop && continueCard}
          {mainChapters.map((c) => (
            <ChapterList key={c} chapter={c} stateOf={stateOf} data={data} />
          ))}
        </div>
        {desktop && (
          <div className={`${styles.col} ${styles.side}`}>
            {continueCard}
            <div className={`${styles.card} ${styles.cardPad}`}>
              <p className={styles.eyebrow}>Later chapters</p>
              <div className={styles.rows}>
                {laterChapters.map((c) => (
                  <div
                    key={c}
                    className={styles.row}
                    style={{ padding: "12px 0" }}
                    data-state="locked"
                  >
                    <div className={styles.rowText}>
                      <span className={styles.rowTitle}>
                        Chapter {c} · {CHAPTER_TITLES[c]}
                      </span>
                      <span className={styles.rowMeta}>
                        {lessonsOfChapter(c).length} lessons ·{" "}
                        {hasChapterContent(c)
                          ? `opens after Chapter ${c - 1}`
                          : `coming in phase ${phaseOfChapter(c)}`}
                      </span>
                    </div>
                    <LockIcon size={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const hasChapterContent = (c: number) => lessonsOfChapter(c).some((l) => hasLesson(l.id));

function ContinueCard({
  lesson,
  state,
  screen,
}: {
  lesson: CourseLesson;
  state: RowState;
  screen: number;
}) {
  const total = useProgress((x) => x.lessons[lesson.id]?.total);
  const percent = total ? Math.min(100, Math.round((screen / total) * 100)) : 0;
  const started = state === "in-progress";
  const meta = `Chapter ${lesson.chapter} ${lesson.sections} · ${lesson.minutes} min${started ? ` · screen ${screen + 1}` : ""}`;
  return (
    <section className={styles.continue} aria-label="Continue">
      <p className={styles.continueLabel}>
        {started ? "CONTINUE" : "START"} · LESSON {lesson.id}
      </p>
      <h2 className={styles.continueTitle}>{lesson.title}</h2>
      <p className={styles.continueMeta}>{meta}</p>
      {started && (
        <div className={styles.track} aria-hidden="true">
          <div className={styles.trackFill} style={{ width: `${percent}%` }} />
        </div>
      )}
      {state !== "soon" && (
        <Link to={`/lesson/${lesson.id}`} className={styles.resume}>
          {started ? "Resume" : "Start"}
        </Link>
      )}
    </section>
  );
}

function ChapterList({
  chapter,
  stateOf,
  data,
}: {
  chapter: number;
  stateOf: (l: CourseLesson) => RowState;
  data: ReturnType<typeof useProgress.getState>;
}) {
  const lessons = lessonsOfChapter(chapter);
  const done = lessons.filter((l) => data.lessons[l.id]?.state === "complete").length;
  return (
    <section aria-label={`Chapter ${chapter}`} className={styles.col} style={{ gap: 10 }}>
      <div className={styles.chapterHead}>
        <p className={styles.eyebrow}>
          Chapter {chapter} · {CHAPTER_TITLES[chapter]}
        </p>
        <p className={styles.meta}>
          {done} of {lessons.length} done
        </p>
      </div>
      <div className={`${styles.card} ${styles.rows}`}>
        {lessons.map((l) => (
          <LessonRow
            key={l.id}
            lesson={l}
            state={stateOf(l)}
            screen={data.lessons[l.id]?.screen ?? 0}
          />
        ))}
      </div>
    </section>
  );
}

function LessonRow({
  lesson,
  state,
  screen,
}: {
  lesson: CourseLesson;
  state: RowState;
  screen: number;
}) {
  const meta = [lesson.sections, `${lesson.minutes} min`];
  if (state === "in-progress") meta.push(`screen ${screen + 1}`);
  if (state === "soon") meta.push(`Coming in phase ${phaseOfChapter(lesson.chapter)}`);
  const clickable = state === "open" || state === "in-progress" || state === "complete";
  const inner = (
    <>
      <span className={styles.badge} data-state={state}>
        {state === "complete" ? <Check /> : lesson.id}
      </span>
      <span className={styles.rowText}>
        <span className={styles.rowTitle}>{lesson.title}</span>
        <span className={styles.rowMeta}>{meta.join(" · ")}</span>
      </span>
      {state === "locked" && <LockIcon size={20} />}
    </>
  );
  return (
    <div className={styles.row} data-state={state}>
      {clickable ? (
        <Link to={`/lesson/${lesson.id}`} className={styles.rowMain}>
          {inner}
        </Link>
      ) : (
        <div className={styles.rowMain} aria-disabled="true">
          {inner}
        </div>
      )}
      {state === "complete" && hasBank(lesson.id) && (
        <Link
          to={`/practice/${lesson.id}`}
          className={styles.link}
          aria-label={`Practice lesson ${lesson.id}`}
        >
          Practice
        </Link>
      )}
    </div>
  );
}

const Check = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-label="Done" role="img">
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
