# Phase 3 · Chapter 3 · Step 3A: Widgets and checkers for real numbers

Start only after `v0.2-chapter-2` exists. Paste into Claude Code. Use plan mode first.

---

Phase 3, step 3A. Add the engine parts for Chapter 3 (real numbers, roots, powers, inequalities). Requirements: SRD FR-70, FR-71. Design: DESIGN-SYSTEM §5.

1. **NumberLine** new modes:
   - `zoom`: decimal search. The learner picks the next digit; the line zooms ×10 around the interval (1 → 0.1 → 0.01 → 0.001). Show the square (or cube) of each end, for example 1.41² = 1.9881 and 1.42² = 2.0164.
   - `interval`: draw intervals with filled (included) and empty (excluded) endpoints, a shaded range and arrows for infinite intervals. The learner drags two orange endpoints and toggles each endpoint filled or empty. Also support two separate parts ("x < −√5 or x > √5").
   - `mirror` extension: mirror two points at once to show that multiplication by −1 changes their order.
2. **E/I table**: two 2 × 2 tables (+ and ×) with choice cells "E" or "I".
3. **FractionStrips** mode `mediant`; **SquareTiles** mode `compare` (a square of side *a* inside a square of side *b*).
4. **Checkers**:
   - `expression`: equivalence with `mathjs` (simplify the difference to 0; fall back to evaluation at 10 random points). Accept √ as `sqrt`, implicit multiplication, `^`.
   - `set`: a set of solutions in any order, including radicals ("2 ± √3" means two values).
   - `interval`: parse "−2 < x < 3", "(−2, 3)", "x ≤ −1 or x > 7", "(−inf, 3) U (7, inf)"; compare endpoints and open/closed.
   - `none` for equations with roots that have no solution after the check.
   Unit-test each checker, with at least 10 cases each, including wrong forms that must fail.
5. Add new modes and states to `/design-system`.

Check: `build`, `test`, `lint`, `validate:content` pass. Screenshots in `qa/phase-3/3A/`. Commit: `phase-3A: chapter 3 widgets and checkers`.

Then stop and show me the screenshots and the checker test list.
