# Phase 2 · Chapter 2 · Step 2A: Widgets and checkers for linear equations

Start only after `v0.1-chapter-1` exists. Paste into Claude Code. Use plan mode first.

---

Phase 2, step 2A. Add the engine parts for Chapter 2 (linear equations). Requirements: SRD FR-68, FR-69. Design: DESIGN-SYSTEM §5 (Elimination board, Balance).

1. **EliminationBoard** in `src/widgets/` with modes:
   - `two-unknowns`: two equation rows as coefficient tiles in variable colours (*x* blue, *y* magenta, *z* teal). Row actions: "× k" (number slot for k), "add rows", "subtract rows". The new row animates in (terms move to their place, 240 ms). When one letter cancels, its tiles fade out.
   - `three-unknowns`: three rows; the learner picks two pairs and removes the same letter from each pair.
   - `general`: rows with letters *a, b, c, d, u, v*; a live readout of *ad* − *bc*; when *ad* − *bc* = 0, a note "No single solution".
   - Keyboard: Tab between rows and actions, Enter to apply. `aria-live` reads each new row.
2. **Balance** mode `system`: two balances, one for each equation, linked to the elimination board.
3. **Checkers**: `pair`, `triple`, `none` ("No solution") and `many` (for the trap of lesson 2.3). Accept "(4, 3)", "x = 4, y = 3" and two separate slots. Unit-test each.
4. Add the `EliminationInteraction` screen type to the ScreenRenderer.
5. Add every new widget mode and state to `/design-system`.

Check: `build`, `test`, `lint`, `validate:content` pass. Screenshots of the new widget states at 390 and 1440 px in `qa/phase-2/2A/`. Commit: `phase-2A: chapter 2 widgets and checkers`.

Then stop and show me the screenshots.
