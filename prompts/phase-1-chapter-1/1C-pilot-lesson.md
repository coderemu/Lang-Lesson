# Phase 1 · Chapter 1 · Step 1C: Pilot widgets and lesson 1.2

Paste into Claude Code. Use plan mode first.

---

Phase 1, step 1C. Build the widgets for lesson 1.2 and make the lesson match its FigCraft frames. Requirements: SRD FR-60 to FR-64, NFR-01 to NFR-04. Design: DESIGN-SYSTEM §5–§7. Frames: S01–S14 (one per screen; see `designRef` in the lesson JSON), D2 and D4 (`design/FIGCRAFT.md`). Before you build a widget, read its frame with `get_node` (depth 4) for the exact geometry: for example the number line in S01 is 342 × 120 with tick x = 21 + 30·i and the axis at y 70.

Build these widgets in `src/widgets/`. Each is a controlled component (`spec`, `value`, `onChange`), with pointer drag, tap to place, keyboard (arrow keys move one unit, Enter checks) and an `aria-live` description.

1. **NumberLine** with modes `place`, `hops`, `compare`, `mirror`. Hops: an orange arc per unit, 240 ms per unit, step numbers above the arcs. The live equation above the line replaces `?` with the ring value.
2. **Thermometer** with mode `guess`. On Check: animate the mercury from start by change, then show the result and the `guessFeedback` that matches the sign of the guess.
3. **RuleCard** with picture `mirror` (as on S05).
4. **ProofStepper** (S07, S08, S09, D4): lines unlock one at a time; the active slot is the dashed orange "why?" chip; locked lines at 45% opacity with an empty dashed slot; reason tray from `tray` (rules show their short label, steps show their `label`); a wrong chip turns red in its slot and opens the hint-style sheet with its `wrongReasonReplies` text (S09), not the red sheet.
5. **Balance** with mode `solve` (S10): tap a cube on one pan to remove it; the beam tips (max 8°, spring) when the two pans differ; the answer is the value of x when only x is left.
6. **TrapSummary** (S14): summary rows in a card (rule id chip in a 44 px column, statement in math), then the trap box with True/False chips.

Then:

7. Play `content/lessons/lesson-1.2.json` from screen 1 to 14 in the player. Fix the engine where a screen does not render as the JSON says. Do not change the lesson text.
8. Add each widget, in every mode and state, to `/design-system`.
9. Playwright play-through of lesson 1.2: one correct path; one path that triggers every mistake reply in the file and checks its exact text; one keyboard-only path; one path with reduced motion.

Check before you finish:

- `build`, `test`, `e2e`, `lint`, `validate:content` pass.
- Screenshots of each lesson 1.2 screen at 390 × 844 in the state its frame shows (for example S12 after Check with the answer 2; S13 with the hint drawer open), and of screens 3 and 7 at 1440 × 900, in `qa/phase-1/1C/`. Compare each with its FigCraft frame (S01–S14, D2, D4) as in FIGCRAFT.md §4 and list the differences in `qa/phase-1/1C/diff.md`. Fix every difference in layout, type or colour. Differences of 1–2 px from font rendering are acceptable.
- Commit: `phase-1C: pilot widgets and lesson 1.2`.

Then stop. Show me the app screenshots next to the FigCraft screenshots.
