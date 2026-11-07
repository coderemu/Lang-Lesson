import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Lesson, PracticeBank } from "../../content/schema";
import { LessonPlayer } from "./LessonPlayer";
import { PracticePlayer } from "./PracticePlayer";

/** Every screen of every lesson and every problem of every bank renders without an error. */
const lessons = Object.values(
  import.meta.glob<{ default: Lesson }>("../../content/lessons/lesson-*.json", { eager: true }),
).map((m) => m.default);
const banks = Object.values(
  import.meta.glob<{ default: PracticeBank }>("../../content/practice/bank-*.json", {
    eager: true,
  }),
).map((m) => m.default);

describe("all lessons render", () => {
  for (const lesson of lessons) {
    it(`lesson ${lesson.id}: ${lesson.screens.length} screens`, async () => {
      for (const s of lesson.screens) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[`/lesson/${lesson.id}?screen=${s.id}`]}>
            <Routes>
              <Route path="/lesson/:id" element={<LessonPlayer />} />
            </Routes>
          </MemoryRouter>,
        );
        expect(await screen.findByRole("heading", { level: 1, name: s.title })).toBeInTheDocument();
        expect(screen.queryByTestId("widget-placeholder")).toBeNull();
        unmount();
      }
    });
  }
});

describe("all banks render", () => {
  for (const bank of banks) {
    it(`bank ${bank.lesson}: ${bank.problems.length} problems`, async () => {
      for (const p of bank.problems) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[`/practice/${bank.lesson}/${p.n}`]}>
            <Routes>
              <Route path="/practice/:id/:n" element={<PracticePlayer />} />
            </Routes>
          </MemoryRouter>,
        );
        expect(
          await screen.findByRole("heading", { level: 1, name: `Problem ${p.n}` }),
        ).toBeInTheDocument();
        unmount();
      }
    });
  }
});
