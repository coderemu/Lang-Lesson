# Phase 1 · Chapter 1 · Step 1B: Lesson engine, practice, rule book, coverage

Paste into Claude Code. Use plan mode first.

---

Phase 1, step 1B. Build the engine and the four main screens. Requirements: SRD FR-01 to FR-07, FR-10 to FR-22, FR-30 to FR-37, FR-40 to FR-45, FR-50 to FR-52, FR-80 to FR-87. Architecture: SRD §10. Design: DESIGN-SYSTEM §6; FigCraft frames H01–H03, DH1–DH3.

Do this:

1. **Content loading.** Copy `content/schema.ts` into the app (or import it from `content/`). Load lessons, banks, coverage and rules with dynamic `import()`, so each lesson is a separate chunk.
2. **Validator.** Write `scripts/validate-content.ts` and the npm script `validate:content`. It must check all eight rules of SRD §8. Use `zod` schemas that mirror `schema.ts`. Use `mathjs` only inside the validator for `verify`. Make it pass on the current content files.
3. **Answer checkers** in `src/engine/check/`: pure functions for `number`, `numbers`, `multi-number-input`, `choice`, `proof` (one line at a time), `self-check`, `none`. Number parsing per FR-22 (accepts −, -, +, spaces, `a/b`, decimals). Each returns `correct`, `mistake` (with reply) or `unknown`. Unit-test every checker, including each mistake of `lesson-1.2.json` and `bank-1.2.json`.
4. **Store** in `src/store/` with Zustand `persist`, key `lang-lessons/v1`: lesson progress, bank progress, rule book, active minutes per day (FR-80a), settings (unlock all). Add a version number and a migrate function. Call `navigator.storage.persist()` on first use (FR-87).
5. **Lesson player** (`/lesson/:id`): LessonBar, ScreenRenderer (by interaction type; for widgets not built yet, show a placeholder box with the widget name), Check/Continue logic, FeedbackSheet, HintDrawer (max two), Show me why after two wrong answers, twin problem, save position on close, rulesEarned on the last screen. Mobile and desktop layouts from DESIGN-SYSTEM §6.
6. **Practice player** (`/practice/:id`): same frame as the lesson player. Bank overview with each problem's state (not tried, correct, not yet), "Practice again" with "not yet" first, STRETCH label, self-check flow ("Show solution", then "I got it" or "Not yet"), Lang type on each problem.
7. **Home** (`/`): match H01 and DH1. Continue card for the lesson in progress; 19 lessons grouped by chapter (titles, sections and minutes from the course map in `lesson-design.md`); lesson row states done, current, open, locked; "Practice" on done rows. Lessons without a JSON file show "Coming in phase n". On desktop, later chapters go in the side card.
7a. **Progress** (`/progress`): match H02 and DH2 (FR-06, FR-07). All numbers come from the store. Add links to Coverage and to Settings.
8. **Rule book** (`/rules`): match H03 and DH3 (FR-50, FR-51): filter chips with counts, rule list cards, equal-height three-column grid on desktop.
9. **Coverage** (`/coverage`): DESIGN-SYSTEM §6.4 (no frame). Rows grouped by chapter and section, status of each row from progress, links to screens and bank problems, chapter totals, "Coming in phase n" for chapters without rows.
10. **Settings** (`/settings`, DESIGN-SYSTEM §6.4): Back up progress (FR-85), Restore from backup with version check, summary and confirmation (FR-86), Unlock all, Reset progress (with confirmation), About (version, link to `/design-system`). Unit-test backup → restore round trip and a bad file.
11. Tests: engine coverage 90% or more. A Playwright test that opens lesson 1.2, answers screen 1 wrong (3), reads the exact reply, answers correctly, then closes and reopens at screen 2.

Check before you finish:

- `build`, `test`, `lint` and `validate:content` pass.
- Screenshots of Home, Progress, Rule book, Coverage, Settings, Practice (bank 1.2) and one placeholder lesson screen at 390 × 844 and 1440 × 900 in `qa/phase-1/1B/`. For Home, Progress and Rule book, seed the store with the sample state of the frames (lessons 1.1–1.2 done, 1.3 at screen 4) and compare with H01–H03 and DH1–DH3. Write the differences in `qa/phase-1/1B/diff.md`.
- Commit: `phase-1B: engine, practice, rule book, coverage`.

Then stop and show me the screenshots.
