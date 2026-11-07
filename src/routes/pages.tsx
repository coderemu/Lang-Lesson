import { useParams } from "react-router-dom";
import { PageHeader } from "./PageHeader";

/* Empty pages: step 1B fills them. */

export const Home = () => (
  <PageHeader
    label="BASIC MATHEMATICS · LANG"
    title="Your course"
    subtitle="Chapters 1–4 · 19 lessons"
  />
);
export const Progress = () => <PageHeader label="BASIC MATHEMATICS · LANG" title="Your progress" />;
export const RuleBook = () => <PageHeader label="BASIC MATHEMATICS · LANG" title="Rule book" />;
export const Coverage = () => <PageHeader label="BASIC MATHEMATICS · LANG" title="Coverage map" />;
export const Settings = () => <PageHeader label="BASIC MATHEMATICS · LANG" title="Settings" />;

export function Lesson() {
  const { id } = useParams();
  return <PageHeader label="LESSON" title={`Lesson ${id ?? ""}`} />;
}
export function Practice() {
  const { id } = useParams();
  return <PageHeader label="PRACTICE" title={`Bank ${id ?? ""}`} />;
}
