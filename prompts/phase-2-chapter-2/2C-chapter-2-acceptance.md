# Phase 2 · Chapter 2 · Step 2C: Acceptance

Paste into Claude Code.

---

Phase 2, step 2C. Test Chapter 2 against SRD §9.1. Do not add features.

1. Playwright play-through of lessons 2.1–2.3 (correct path and every mistake reply) and banks 2.1–2.3.
2. Keyboard-only play-through of lesson 2.1 (all elimination board actions by keyboard).
3. Persistence test in the middle of lesson 2.2.
4. Coverage: after all Chapter 2 work, every Chapter 2 row shows covered, the skip row shows "Later chapter in Lang". Chapter 1 totals do not change.
5. Rule book: `elimination`, `elim-three`, `general-system` with the right status.
6. Regression: run all Chapter 1 play-throughs again. All must pass.
7. axe check on each new screen type. Fix serious and critical issues.
8. Screenshots of new screens at 390 and 1440 px in `qa/phase-2/2C/`.

Write `qa/phase-2/ACCEPTANCE.md` (criterion, result, proof). If all pass: commit `phase-2: chapter 2 complete` and tag `v0.2-chapter-2`.

Before the tag: run the offline and update tests of step 1F against `npm run preview` again (the new chapter must be in the precache, and old progress must survive). After the tag, tell me to push (`git push && git push --tags`); Cloudflare publishes the new version. Then open the live URL with Playwright at 390 × 844 and confirm that the new chapter is on Home.

Then stop and show me `ACCEPTANCE.md`.
