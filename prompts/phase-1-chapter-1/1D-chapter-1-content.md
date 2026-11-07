# Phase 1 · Chapter 1 · Step 1D: All of Chapter 1 (lessons, banks, coverage)

Paste into Claude Code. Use plan mode first. This step is long: do it as the sub-steps below, and commit after each one.

---

Phase 1, step 1D. Complete Chapter 1: lessons 1.1 and 1.3–1.8, banks 1.1–1.8 and every Chapter 1 row of the coverage map. Follow `docs/CONTENT-GUIDE.md` exactly. Requirements: FR-30 to FR-37, FR-40 to FR-45, FR-65 to FR-67.

**D1 · Widgets for Chapter 1.** Build, add to `/design-system` and test:

- AreaModel: modes `distribute`, `width-2`, `doubling-strip`.
- SquareTiles: mode `expand`.
- FractionStrips: modes `cut`, `add`, `invert`.

Commit: `phase-1D1: chapter 1 widgets`.

**D2 · Lessons.** Convert these sections of `lesson-design.md` into JSON, one lesson at a time, in this order: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8. For each lesson:

1. Write `content/lessons/lesson-n.n.json`.
2. Run `validate:content`. Fix all errors.
3. Recalculate every answer. If an answer in the doc looks wrong, stop and tell me. Do not change it yourself.
4. Check every proof against Lang's proof in `docs/source/lang-ch1-4.pdf` (if present). Report each place where the steps differ.
5. Play the lesson in the browser from start to end.
6. Commit: `phase-1D2: lesson n.n`.

**D3 · Practice banks.** Convert Banks 1.1 and 1.3–1.8 of `practice-banks.md` into `content/practice/bank-n.n.json`. Bank 1.2 already exists: check it against the doc. Keep every problem, its number and its answer. Mark the stretch problems. Add `verify` to every number answer. Commit: `phase-1D3: chapter 1 banks`.

**D4 · Coverage.** Add every Chapter 1 row of `coverage-map.md` to `content/coverage.json`, in book order. Keep the 11 starter rows; fix their screen IDs if a lesson changed. Each row must point to existing screens or bank problems. Commit: `phase-1D4: chapter 1 coverage`.

Check before you finish:

- `validate:content` passes with all 8 lessons, 8 banks and all Chapter 1 coverage rows.
- A table in `qa/phase-1/1D/report.md` with: lesson, number of screens, number of mistake replies, bank, number of problems (and stretch), coverage rows that point to it.
- A list of every place where you were not sure about the content.

Then stop and show me the report.
