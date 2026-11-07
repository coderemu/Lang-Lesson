# Phase 1 · Chapter 1 · Step 1E: Acceptance

Paste into Claude Code.

---

Phase 1, step 1E. Test Chapter 1 against the acceptance criteria in SRD §9.1 and §9.2. Do not add features.

1. Playwright: one play-through for each lesson 1.1–1.8 (correct path and every mistake reply) and one for each bank 1.1–1.8 (answer each problem; use "I got it" for self-check).
2. Keyboard-only play-through of lessons 1.1, 1.3 and 1.7.
3. Persistence test: close in the middle of lesson 1.6 and bank 1.4, open again, continue at the same place.
4. After all Chapter 1 lessons and banks are done, the Coverage screen must show every Chapter 1 row as covered. Report the chapter total.
5. Rule book: compare the earned rules and their status with the "Assumed or proved" table in `lesson-design.md` (rows for lessons 1.2–1.8). List each difference.
6. Run an accessibility check (axe with Playwright) on Home, Progress, a lesson screen of each widget type, a bank screen, Rule book, Coverage and Settings. Fix all serious and critical issues.
7. Check the JavaScript size of the first load (NFR-06). Offline mode and install are step 1F.
8. Screenshots of every new screen at 390 and 1440 px in `qa/phase-1/1E/`.

Write `qa/phase-1/ACCEPTANCE.md` with each criterion of SRD §9.1 and §9.2, the result (pass or fail) and the proof (test name or screenshot).

Mark the 9.2 criteria about hosting as "pending 1F". If all other criteria pass: commit `phase-1E: chapter 1 accepted`. Do not tag yet; step 1F tags the release.

Then stop and show me `ACCEPTANCE.md`.
