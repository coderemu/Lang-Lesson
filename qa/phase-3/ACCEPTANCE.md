# Phase 3 · Chapter 3 (Real numbers): acceptance

Commands, all passing at the end of the phase: `npm run build`, `npm run test` (349 tests), `npm run lint`, `npm run validate:content` (17 lessons, 17 banks, 92 coverage rows), full `npm run e2e` (result: see `qa/phase-3/e2e-full.log` and the summary line below).

Full e2e: 1263 passed, 1082 skipped by design, 1 failed (the bank mistake-count test, which still expected 5 replies; fixed to 10 and re-run: passes). Log: `qa/phase-3/e2e-full.log`.

## SRD §9.1

| # | Criterion | Result | Proof |
| --- | --- | --- | --- |
| 1 | Each lesson plays first to last screen at 390 and 1440 px | Pass | `e2e/chapter-1.spec.ts` now covers 3.1–3.6 in both projects. |
| 2 | Each mistake gives its exact reply | Pass | `e2e/mistakes.spec.ts`: lessons 3.1–3.6 (229 cases: options, typed answers, every wrong proof reason, E/I wrong cells, traps). Unit level: `src/engine/content-mistakes.test.ts` also checks that each typed answer passes its own checker. |
| 3 | Keyboard only | Pass | Whole-lesson keyboard play of 3.1, 3.5 and 3.6 (`chapter-1.spec.ts`); interval ends by arrow keys and Space (`e2e/chapter-3.spec.ts`). |
| 4 | Close, reopen, same place | Pass | `e2e/chapter-3.spec.ts`: bank 3.3 closed after problem 1, reload opens problem 2; stored state kept. |
| 5 | Banks hold every problem with the same answers | Pass | `src/content/banks-doc.test.ts` covers banks 3.1–3.6 (answer text, Lang type). `bank-[123]` play-through in `e2e/banks.spec.ts` with the new typed types. |
| 6 | Coverage shows every Chapter 3 row; links work | Pass | `e2e/acceptance.spec.ts`: Chapter 3 rows, skip rows show "Later chapter in Lang", totals for Chapters 1–3 unchanged or full. |
| 7 | Rule book statuses | Pass | `src/content/rules-table.test.ts`: 17 Chapter 3 rules against the "Assumed or proved" table; each lesson earns exactly its rules. |
| 8 | `/design-system` shows new widget modes | Pass | Seven new entries (zoom, interval ×2, E/I ×2, mediant, compare), checked in `acceptance.spec.ts`. |
| 9 | build, test, e2e, validate:content | Pass | See top. |
| 10 | Screenshots | Pass (390 px only, one per new mode) | `qa/phase-3/shots/`: zoom, interval, ei-table, mediant, compare. |
| 11 | Hosted app | Not applicable | Deploy is dropped. |

axe (WCAG 2.2 AA): new screen types and typed bank problems are in `e2e/a11y.spec.ts`.
mathjs: the number-only build is its own chunk (`number-*.js`, 105 KB gzip). `e2e/chapter-3.spec.ts` checks that it is not requested on a screen without typed answers and is requested on one with typed answers.

## Simpler interactions than the design names

- Number line `mirror` stays one point. Lesson 3.5 and 3.2 use it with a follow-up question (no two-point mirror).
- Number line `interval`: ends move by drag or arrow keys; filled/empty by Space or two buttons. The drawing is written as text into the answer box (two-way), and the `interval` checker reads it. Two parts are supported (design system). Lesson 3.5 asks for one part.
- Lesson 3.3 area model: the screen is a `number-input` with the four-part picture in the prompt. The two root equations are `number-input` and `choice` screens with worked steps in "Show me why"; the Balance widget only models linear units, so the check step is a question ("Does x = 4 solve it?").
- Lesson 3.4 uses the existing `doubling-strip` area model with factor 1/2 for the halving strip.
- Fraction strips `mediant` and Square tiles `compare`: mediant is a button that shows the third strip; compare is a slider for a. Both only explore; a follow-up question holds the answer.
- E/I table: tap a cell to cycle ?, E, I. Check needs all 8 cells.
- Bank proofs, constructions and drawings (3.1 #1–2, 3.2 #1–3 and 9, 3.3 #9, 3.4 #5, 3.5 #1 and 7, 3.6 #1, 2, 5, 9) are `self-check`.
- Bank answers needing a form (3.1 #4, 3.3 #3 and 4) are `numbers` (c, d) with the form named in the prompt. Rationalise answers use `expression` with `noRootDenominator`, so "1/(√5 − 2)" is refused although its value is right.
- The `expression`, `set` and `interval` text boxes accept `sqrt(5)` or `√5`. A help line says so.
- Chapter 1 and 2 self-check problems stay self-check.

## Content decisions and doubts

1. The design doc gives outlines. I wrote the screen text, hints, mistake replies and proof steps in STE style. The mistake rows of the doc are copied (3.1, 3.2, 3.3 partly, 3.4, 3.5, 3.6). Please read the new text. I did not compare each proof with the PDF line by line (a⁰ = 1, a⁻ˣ, IN 1 follow Lang's order from the doc).
2. Lesson 3.3 doc rows "Multiplies the bottom only" and "Multiplies by 3 + √2": I attach them to the practice answers (result "1", and the `noRootDenominator` form reply).
3. Bank 3.1 #4, 3.3 #3 and #4: the prompt says "Write … as c + d√n. Type c, then d". The doc gives only the expression. This is a wording addition for typed input; the meaning is the same.
4. Bank 3.3 #7 uses the `none` chips. Bank 3.4 #5 is `self-check` (yes/no plus a value).
5. Lesson 3.2 step 4 merges "Name it" and "Prove it" in the doc into one proof screen (POS 1 and POS 2 in the prompt). Practice steps with different answer types are split into consecutive screens (3.2 ×3, 3.3 ×3, 3.5 ×3, 3.6 ×2). Screen numbers in coverage follow the content.
6. Mistake replies are plain text (no `$…$`), because the replies are compared as text in the e2e test.
7. `cancel-add` (Phase 1 open item) is unchanged.
8. Form replies of `noRootDenominator` are covered by unit tests, not by the browser mistake spec.
