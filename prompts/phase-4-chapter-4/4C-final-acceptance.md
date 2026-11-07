# Phase 4 · Chapter 4 · Step 4C: Final acceptance (whole course)

Paste into Claude Code.

---

Phase 4, step 4C. Test Chapter 4 against SRD §9.1, then the whole course against SRD §9.3. Do not add features.

1. Playwright play-through of lessons 4.1–4.2 and banks 4.1–4.2 (correct path and every mistake reply).
2. Keyboard-only play-through of lesson 4.1 (drag the corner by keyboard).
3. Full regression: every lesson and bank of chapters 1–4, in course order, in one Playwright run with a fresh store. At the end:
   - all 19 lessons complete;
   - all 19 banks complete;
   - the Coverage screen shows every row of chapters 1–4 as covered, except skip rows;
   - the rule book holds every rule of `rules.json` with the right status.
4. Coverage audit: compare `content/coverage.json` row by row with `docs/lesson-design/coverage-map.md`. Every row is present, in book order, and points to existing screens and problems. Write the result in `qa/phase-4/coverage-audit.md`.
5. Bank audit: compare each bank with `practice-banks.md`. Same problems, same numbers, same answers. Write the result in `qa/phase-4/bank-audit.md`.
6. axe check on every route. Fix serious and critical issues.
7. Lighthouse on Home and one lesson (mobile): performance, accessibility and best practices 90 or more.
8. Screenshots of every lesson's first screen at 390 px in `qa/phase-4/4C/`.

Write `qa/phase-4/ACCEPTANCE.md` with SRD §9.1 and §9.3. If all pass: commit `phase-4: course complete` and tag `v1.0`.

Before the tag: run the offline and update tests of step 1F against `npm run preview` again (the new chapter must be in the precache, and old progress must survive). After the tag, tell me to push (`git push && git push --tags`); Cloudflare publishes the new version. Then open the live URL with Playwright at 390 × 844 and confirm that the new chapter is on Home.

Then stop and show me `ACCEPTANCE.md`, the coverage audit and the bank audit.
