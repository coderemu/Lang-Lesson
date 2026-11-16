# Lean plan for Phases 2–4 (16 November 2026)

This plan replaces the "How to work" section of `CLAUDE.md` and the step-by-step flow of `prompts/phase-2…4` for the rest of the build. The product does not change: same 19 lessons, same banks, coverage map, rule book, widgets, Lang's order and rule names, STE text, and accessibility rules. Only the way of working changes, to use less credit.

## What stays (the original idea)

- Lessons, banks and coverage rows are JSON in `content/`, converted from `docs/lesson-design/` with `docs/CONTENT-GUIDE.md`.
- Every answer is recalculated. Proofs follow Lang. No lesson text is invented or changed in meaning. If content looks wrong, stop and ask.
- Each widget is controlled, works with pointer, tap and keyboard, and has a live text description.
- `validate:content` (nine rules) must pass. Each mistake reply gives its exact text.
- SRD §9.1 criteria 1–10 are still the acceptance test of each phase.

## What changes

| Before (Phase 1) | Now | Why it saves credit |
| --- | --- | --- |
| One session for everything | One fresh session per phase | A long session re-reads all its history on every turn. |
| Plan mode and a pause for each step (A, B, C…) | One short plan per phase, then build the whole phase without pauses | Removes about two planning rounds and two reports per phase. |
| Read large docs in full | Read only the sections of the chapter (`grep -n` for the heading, then that range) | The design docs cover four chapters. |
| Lesson JSON written through generator scripts, one file and one run at a time | Write each lesson JSON directly, then run `validate:content` once per lesson | Fewer round trips. |
| Full Playwright suite several times (about 5 minutes, 1,500 tests) | While building: only the specs of the new lessons, mobile project. Full `npm run e2e` once at the end of the phase | The suite is data-driven: new lessons are picked up without new test code. |
| Screenshot of every screen, read back one by one | One screenshot per new widget mode, at 390 px only. No screenshot of text-only screens | Images are expensive to read. |
| FigCraft comparison and `diff.md` per step | None. No FigCraft frames exist for Chapters 2–4. Reuse the existing components and tokens | No design reads. |
| Long report per step | One `qa/phase-n/ACCEPTANCE.md` per phase (table of criteria, proof, open questions) | One report instead of three. |
| Deploy, Lighthouse, live URL | Dropped. The app runs on localhost (`npm run dev`). Criterion 9.1.11 is "not applicable" | Decision of 8 November. |
| Commit after every sub-step | Three commits per phase: widgets and checkers, content, acceptance. Then the tag | Less overhead, same history value. |

## Rules for each phase session

1. Read `CLAUDE.md`, this file, `docs/DECISIONS.md`, the three prompt files of the phase, and the chapter's sections in `lesson-design.md`, `practice-banks.md` and `coverage-map.md`. Do not read Phase 1 QA reports.
2. Write one plan (about 30 lines). List every content question in that plan, so there is one round of answers. Wait for approval once.
3. Build in this order: widgets and checkers (with unit tests and a `/design-system` entry) → lessons → banks → coverage rows → acceptance.
4. Reuse before you build: `src/widgets/` (NumberLine, Balance, AreaModel, SquareTiles, FractionStrips, ProofStepper), `src/engine/answers.ts` and `check/`, `e2e/lesson-helpers.ts` (`playScreen`, `mistakeCases`), `e2e/state.ts`. Add the new chapter to the lists in `e2e/chapter-1.spec.ts`, `mistakes.spec.ts`, `banks.spec.ts` and `a11y.spec.ts` (rename files only if needed).
5. Prefer a simple interaction where the design allows it. Use `choice`, `number-input` or `proof` when a new widget mode would only show something. Build a new widget mode only where the learner must act on it. List each such choice in ACCEPTANCE.md.
6. Run long test runs in the background and wait for the result. Do not poll.
7. End of phase: `build`, `test`, `lint`, `validate:content`, full `e2e`. Write `qa/phase-n/ACCEPTANCE.md`. Commit. Tag (`v0.2-chapter-2`, `v0.3-chapter-3`, `v1.0`).

## Phase contents

| Phase | Lessons | New code | Notes |
| --- | --- | --- | --- |
| 2 · Linear equations | 2.1, 2.2, 2.3 | Elimination board (`two-unknowns`, `three-unknowns`, `general`), Balance `system`, checkers `pair`, `triple`, "no solution" | Smallest phase. Start here. |
| 3 · Real numbers | 3.1–3.6 | Number line `zoom` and `interval`, E/I table, Fraction strips `mediant`, Square tiles `compare`, checkers `expression` (mathjs), `set`, `interval` | Largest phase. With the `expression` checker, decide if the Chapter 1 self-check problems change to typed answers (default: leave them). |
| 4 · Quadratic equations | 4.1, 4.2 | Square tiles `complete`, discriminant slider, checker for roots with radicals | Ends with SRD §9.3 (all 19 lessons, full regression). Dark mode stays out unless asked. |

## Open items carried from Phase 1

- `cancel-add` is in `rules.json` for lesson 1.2 but not in that lesson's `rulesEarned`.
- Three text colours were darkened for contrast and differ from the FigCraft variables.

Neither blocks Phases 2–4.

## Model and limits

Use one phase per session. If a weekly limit for one model is nearly used, run the phase on another model: the plan and the tests do not depend on the model.
