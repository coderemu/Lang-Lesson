# Phase 2 · Chapter 2 (Linear equations): acceptance

Commands, all passing at the end of the phase: `npm run build`, `npm run test` (246 tests), `npm run lint`, `npm run validate:content` (11 lessons, 11 banks, 67 coverage rows), full `npm run e2e` (952 passed, 0 failed, 839 skipped by design; log in `qa/phase-2/e2e-full.log`).

## SRD §9.1

| # | Criterion | Result | Proof |
| --- | --- | --- | --- |
| 1 | Each lesson plays first to last screen at 390 and 1440 px | Pass | `e2e/chapter-1.spec.ts` now covers lessons 2.1, 2.2, 2.3 in both projects. |
| 2 | Each mistake gives its exact reply | Pass | `e2e/mistakes.spec.ts`: lessons 2.1 (15 cases), 2.2, 2.3 (61 cases: options, board answers, "No solution"/"Many solutions" chips, every wrong proof reason, trap). `mistakeCases` in `e2e/lesson-helpers.ts` knows the `elimination` type. |
| 3 | Keyboard only | Pass | `e2e/elimination-keyboard.spec.ts` (pick row, type k, Enter multiplies, add rows, undo, type answer, Check); lessons 2.1 and 2.3 whole-lesson keyboard play (`chapter-1.spec.ts`); bank 2.1 keyboard play (`banks.spec.ts`). |
| 4 | Close, reopen, same place | Pass | `e2e/persistence.spec.ts`: lesson 2.2 close after screen 4, Resume opens screen 5. |
| 5 | Banks hold every problem with the same answers | Pass | `src/content/banks-doc.test.ts` now covers banks 2.1–2.3 (answer text, Lang type). `pair`/`triple` answers are recalculated with exact fractions when the JSON was built, and every `number` answer has `verify`. |
| 6 | Coverage shows every Chapter 2 row; links work | Pass | `e2e/acceptance.spec.ts`: 10 rows (9 counted + skip row). With all done: "Chapter 2: 9 of 9 covered"; with no progress 0 of 9; skip row shows "Later chapter in Lang". Chapter 1 totals unchanged (57). Every link opens. |
| 7 | Rule book statuses | Pass | `src/content/rules-table.test.ts`: `elimination` shown, `elim-three` shown, `general-system` left-to-reader; each lesson earns exactly its rules. |
| 8 | `/design-system` shows new widget modes | Pass | Entries: Elimination board two-unknowns (with balances), three-unknowns, general. Checked in `acceptance.spec.ts`. |
| 9 | build, test, e2e, validate:content | Pass | See top. |
| 10 | Screenshots | Pass (390 px only, by the lean plan) | `qa/phase-2/shots/` (two-unknowns with balances, no solution, three-unknowns, general, bank pair). |
| 11 | Hosted app | Not applicable | Deploy is dropped. The app runs on localhost. |

axe (WCAG 2.2 AA): new screens and bank problem types pass with 0 serious or critical issues (`e2e/a11y.spec.ts`). The first run found `label-content-name-mismatch` on the board rows. Fixed: the row text is now screen-reader text, the tiles are decorative.

## Simpler interactions than the design names

- Balance `system` is a display, not a separate interaction: two level balances above the board show the equations (the picked pair, or rows 1 and 2). They stay level by construction.
- The "No solution" check in lessons is a chip on the board screen, not a separate screen type. Bank `none` is a two-chip choice ("There is a solution" / "No solution").
- The `many` answer is a chip ("Many solutions") on every board screen. No bank uses it.
- Board actions: tap a row to pick it (one for "× k", two for add or subtract). The multiply factor is typed in a box (fractions allowed). There is an "Undo last row" button.
- Three unknowns: the board does not force "same letter from both pairs". The learner builds rows freely. The trap screen teaches the rule.
- Proofs in 2.3 are tap-the-reason steps (DECISIONS 7).
- Answers are typed in separate slots (`x =`, `y =`, `z =`). The checker also accepts "(4, 3)" and "x = 4, y = 3" in one string (unit-tested); the UI shows slots only.
- Screenshots at 390 px only.

## Content decisions and doubts

1. Lesson 2.2 hook ("two more clues"): I used the clues of step 3 as proposed in the plan.
2. Bank 2.1 #9 (boat): the prompt says "120 km in 8 hours in total" so the answer 4 hours is correct. The doc wording alone does not determine it.
3. Bank 2.3 #1, #4, #5 are `self-check`, not `expression` (DECISIONS 8). #2 is a `pair` (the "14" is in the solution text, not checked). #3 is `none`.
4. Bank 2.1 #7 prompt names the unknowns (hours on the highway and in town), to make it a two-unknown problem.
5. The lesson text for the 2.3 proofs (steps 4 and 6) and all mistake replies other than the three tables of the doc are mine, in STE style. Please read them. I did not check them against the PDF for page-level fidelity.
6. A dollar sign in text needs `\$` (new in `RichText`). Used in bank 2.1 #8.
7. Open item from Phase 1 is unchanged (`cancel-add`).
