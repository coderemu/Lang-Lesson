import { useState } from "react";
import type { Rule, RuleStatus } from "../../content/schema";
import { ruleChipLabel } from "../content/ruleChip";
import { useRules } from "../content/useContent";
import { Math as Tex } from "../math";
import { useProgress } from "../store";
import { PageHeader } from "./PageHeader";
import styles from "./RuleBook.module.css";
import app from "./app.module.css";

type Filter = "all" | "assumed" | "proved" | "left-to-reader";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "assumed", label: "Assumed" },
  { key: "proved", label: "Proved" },
  { key: "left-to-reader", label: "Left to reader" },
];
const STATUS_LABEL: Record<RuleStatus, string> = {
  assumed: "Assumed",
  proved: "Proved",
  "left-to-reader": "Left to reader",
  shown: "Shown",
};

export function RuleBook() {
  const rules = useRules();
  const earnedIds = useProgress((s) => s.rules);
  const [filter, setFilter] = useState<Filter>("all");

  const total = rules?.length ?? 0;
  const earned = (rules ?? []).filter((r) => earnedIds[r.id]);
  const count = (f: Filter) =>
    f === "all" ? earned.length : earned.filter((r) => r.status === f).length;
  const shown = filter === "all" ? earned : earned.filter((r) => r.status === filter);

  return (
    <div className={app.page}>
      <PageHeader
        label="RULE BOOK"
        title="Your rules"
        subtitle={`${earned.length} of ${total} rules earned. Lang assumes some rules and proves the others.`}
      />
      <div className={styles.filters} role="group" aria-label="Filter rules">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={styles.chip}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label} · {count(f.key)}
          </button>
        ))}
      </div>
      {earned.length === 0 ? (
        <p className={app.empty}>You have no rules yet. Finish a lesson to earn its rules.</p>
      ) : (
        <ul className={styles.grid}>
          {shown.map((r) => (
            <RuleListCard key={r.id} rule={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RuleListCard({ rule }: { rule: Rule }) {
  return (
    <li className={styles.card} data-testid="rule-card">
      <div className={styles.head}>
        <span className={styles.id}>{ruleChipLabel(rule.id)}</span>
        <h2 className={styles.name}>{rule.name}</h2>
      </div>
      <Tex tex={rule.statement} className={styles.statement} />
      <div className={styles.foot}>
        <span className={styles.status} data-status={rule.status}>
          {STATUS_LABEL[rule.status]}
        </span>
        <span className={styles.where}>
          Lesson {rule.lesson} · {rule.book}
        </span>
      </div>
    </li>
  );
}
