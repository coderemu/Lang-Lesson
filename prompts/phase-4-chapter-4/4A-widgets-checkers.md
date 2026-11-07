# Phase 4 · Chapter 4 · Step 4A: Widgets and checkers for quadratic equations

Start only after `v0.3-chapter-3` exists. Paste into Claude Code. Use plan mode first.

---

Phase 4, step 4A. Add the engine parts for Chapter 4 (quadratic equations). Requirements: SRD FR-72, FR-73. Design: DESIGN-SYSTEM §5 (Square tiles).

1. **SquareTiles** mode `complete`: show *x*² and two strips of *bx*/2. The missing corner is a dashed orange square. The learner drags a corner tile of the correct size into the gap; a wrong size does not fit and shows its size. Then the equation updates: *x*² + *bx* + (*b*/2)² = (*x* + *b*/2)². Support a leading coefficient: first a "÷ a" step.
2. **Discriminant slider**: a number line with sliders for *a*, *b*, *c* and a live readout of *b*² − 4*ac*. Show the roots as points on the line: two points (> 0), one point (= 0), no point and the note "No real solution" (< 0).
3. **Checker** for roots with radicals: accept "(1 ± √5)/2", "1/2 ± √5/2", "0.5 ± 1.118…" (decimal within 0.001), and the two roots as a set. Unit-test with at least 15 cases.
4. Add new modes and states to `/design-system`.

Check: `build`, `test`, `lint`, `validate:content` pass. Screenshots in `qa/phase-4/4A/`. Commit: `phase-4A: chapter 4 widgets and checkers`.

Then stop and show me the screenshots.
