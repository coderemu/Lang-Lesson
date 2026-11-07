# Phase 3 · Chapter 3 · Step 3C: Acceptance

Paste into Claude Code.

---

Phase 3, step 3C. Test Chapter 3 against SRD §9.1. Do not add features.

1. Playwright play-through of lessons 3.1–3.6 (correct path and every mistake reply) and banks 3.1–3.6.
2. Keyboard-only play-through of lessons 3.5 and 3.6 (interval endpoints by keyboard).
3. Persistence test in the middle of bank 3.3.
4. Coverage: every Chapter 3 row covered after all Chapter 3 work; skip rows show their reason. Chapter 1 and 2 totals do not change.
5. Rule book: Chapter 3 rules with the status of the "Assumed or proved" table.
6. Regression: all Chapter 1 and 2 play-throughs pass.
7. axe check on each new screen type. Fix serious and critical issues.
8. Check bundle size again: `mathjs` must load only with lessons and banks that need it.
9. Screenshots in `qa/phase-3/3C/`.

Write `qa/phase-3/ACCEPTANCE.md`. If all pass: commit `phase-3: chapter 3 complete` and tag `v0.3-chapter-3`.

Before the tag: run the offline and update tests of step 1F against `npm run preview` again (the new chapter must be in the precache, and old progress must survive). After the tag, tell me to push (`git push && git push --tags`); Cloudflare publishes the new version. Then open the live URL with Playwright at 390 × 844 and confirm that the new chapter is on Home.

Then stop and show me `ACCEPTANCE.md`.
