# Phase 1 · Chapter 1 · Step 1A: Foundation and design system route

Paste into Claude Code. Use plan mode first.

---

Phase 1, step 1A. Build the foundation of the app and the app shell. Requirements: SRD §5, FR-05, NFR-05, NFR-06, NFR-08, NFR-10. Design: `design/DESIGN-SYSTEM.md` §1–§4 and §6.3; FigCraft frames H01–H03 and DH1–DH3 for the shell (`design/FIGCRAFT.md`).

Do this:

1. Create the project: Vite + React 18 + TypeScript (strict), ESLint, Prettier, Vitest, Testing Library, Playwright. Keep the existing `.gitignore` (it excludes `docs/source/`). Keep `.claude/settings.json` as it is. Set `base` in `vite.config.ts` from an environment variable `VITE_BASE` (default `/`).
2. Add the fonts with `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/inter`, `@fontsource-variable/stix-two-text` and `@fontsource/ibm-plex-mono` (400). Load only the weights in the design system.
3. Copy `design/tokens.css` to `src/styles/tokens.css`. Check it against FigCraft `variable.list` once more. Add `global.css` with body text 18/28 Inter, paper background, ink text and a 2px primary focus ring with 2px offset.
4. Add KaTeX with the macros `\va`, `\vb`, `\vc` (coloured with `--color-var-a/b/c`). Make a `<Math tex="…" display? />` component and a `<RichText text="…">` component that renders `$…$` parts with KaTeX.
5. Add routing (React Router, `createBrowserRouter`, with `basename` from `import.meta.env.BASE_URL`) with these routes, each with an empty page for now: `/`, `/progress`, `/rules`, `/lesson/:id`, `/practice/:id`, `/coverage`, `/settings`, `/design-system`.
5a. Build the app shell in `src/shell/`: the bottom tab bar below 900 px (match H01–H03) and the left sidebar from 900 px (match DH1–DH3), with Home, Progress and Rule book. The shell wraps `/`, `/progress`, `/rules`, `/coverage` and `/settings`. Lesson and practice routes have no shell. Read the tab bar and sidebar values with `get_node` (frames 1059 and 1580).
6. Build these components in `src/components/` to the exact specs in DESIGN-SYSTEM §4, with all states:
   Button (Primary, Continue, Secondary, Hint, Disabled), ChoiceChip, NumberSlot, ReasonChip, ReasonSlot, FeedbackSheet (correct, not quite), HintDrawer, LessonBar, RuleCard, TryBox, TrapBox.
7. Build `/design-system`: colour swatches with roles, the type scale, spacing, radii, motion rules, then every component of DESIGN-SYSTEM §4 in every state. Where a component appears in a FigCraft frame (for example the feedback sheets in S11, S12, S09, the hint drawer in S13, the lesson bar in S01), match the frame.
8. Add a component test for each component: it renders, it is keyboard reachable, and its states change the right attributes.

Check before you finish:

- `npm run build`, `npm run test` and `npm run lint` pass.
- Take Playwright screenshots of `/design-system` and of the empty shell (`/`, `/progress`, `/rules`) at 390 × 844 and 1440 × 900. Save them in `qa/phase-1/1A/`. Compare the shell with H01–H03 and DH1–DH3, and the components with the frames named above (FIGCRAFT.md §4). Write the differences in `qa/phase-1/1A/diff.md`.
- Commit: `phase-1A: foundation and design system`.

Then stop and show me the screenshots and the difference list.
