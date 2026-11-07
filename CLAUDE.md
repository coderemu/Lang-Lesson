# CLAUDE.md: Lang Lessons

Interactive companion lessons for Serge Lang's *Basic Mathematics*, chapters 1–4, in the style of Brilliant. One learner: an adult who relearns mathematics from the start. Personal use only.

## Read first

- `docs/DECISIONS.md`: answers to the kickoff questions. It wins over other files.
- `docs/SRD.md`: requirements, the four phases and acceptance criteria. The SRD wins over other files if they conflict.
- `design/DESIGN-SYSTEM.md`: every visual and motion decision. Do not invent styles.
- `content/schema.ts`: the content types. Lessons, banks and coverage are data, not code.
- `docs/CONTENT-GUIDE.md`: how to convert the design doc into JSON. Follow it exactly.
- `docs/lesson-design/`: the full course design (19 lessons), coverage map and practice banks.
- `design/FIGCRAFT.md` and `design/figcraft-map.json`: the approved screens live in a FigCraft file. Read them through the `figcraft-app` MCP server (read only). Match them.
- `docs/DEPLOY.md`: how the app is built and hosted.
- `docs/source/lang-ch1-4.pdf` (local only): Lang's book. Use it to check proofs and order. Never copy its text.

## Phases

The build has four phases, one per chapter of the book. Each phase delivers the chapter's lessons, practice banks and coverage rows. Do not start work of a later phase. A phase is complete only when `qa/phase-n/ACCEPTANCE.md` shows that all criteria of SRD §9 pass, and the git tag exists (`v0.1-chapter-1`, `v0.2-chapter-2`, `v0.3-chapter-3`, `v1.0`).

## Stack

- Vite + React 18 + TypeScript (strict). No Next.js, no server. The app is a static site (PWA) that any static host can serve.
- Routing: React Router with `createBrowserRouter`. The host must send unknown paths to `index.html` (see `docs/DEPLOY.md`).
- Offline and install: `vite-plugin-pwa` (precache app shell, fonts and all content chunks).
- Styling: CSS Modules + the CSS variables in `src/styles/tokens.css`. No Tailwind, no UI kit.
- Math: KaTeX. Use the macros `\va{}`, `\vb{}`, `\vc{}` for coloured variables.
- Motion: `motion` (Framer Motion). Respect `prefers-reduced-motion`.
- State: Zustand with `persist` (localStorage).
- Answer checking: plain TypeScript for numbers and choices. Add `mathjs` only when expression answers arrive (lesson 1.3).
- Tests: Vitest + Testing Library for logic and components. Playwright for one full play-through of each lesson.
- Fonts: `@fontsource-variable` packages for Bricolage Grotesque, Inter, STIX Two Text; `@fontsource` for IBM Plex Mono.

## Commands

- `npm run dev`: start the dev server.
- `npm run build`: type check and build.
- `npm run test`: unit and component tests.
- `npm run e2e`: Playwright play-throughs.
- `npm run validate:content`: check all lesson JSON against the schema and `rules.json`.
- `npm run preview`: serve the production build locally (test PWA and offline here).
- `npm run deploy`: build and publish to the host in `docs/DEPLOY.md` (added in step 1F).

## Structure

```
src/
  styles/        tokens.css, fonts.css, global.css
  components/    Button, ChoiceChip, NumberSlot, ReasonChip, FeedbackSheet, HintDrawer, LessonBar, RuleCard
  widgets/       NumberLine, Thermometer, ProofStepper, Balance, AreaModel, FractionStrips, SquareTiles
  engine/        lesson player, screen renderer, answer checkers, mistake matcher
  store/         progress, rule book
  widgets/ (Ph 2+) EliminationBoard, EITable, DiscriminantSlider
  shell/         AppShell: TabBar (mobile), Sidebar (desktop)
  routes/        Home, Progress, RuleBook, Lesson, Practice, Coverage, Settings, DesignSystem
  math/          KaTeX wrapper and macros
content/         schema.ts, rules.json, coverage.json, lessons/*.json, practice/*.json
                 (source of truth for all learner text)
scripts/         validate-content.ts
qa/phase-n/      screenshots, reports, ACCEPTANCE.md
```

## Rules for content

- All learner-facing text comes from `content/`. Never hard-code lesson text in components.
- Do not change the meaning of lesson text. If text looks wrong, stop and ask.
- Learner text uses ASD-STE100 style: short sentences (20 words or fewer for steps), imperative steps, conditions first, no contractions.
- Keep Lang's rule names (N1–N12, POS 1–2, IN 1–3, POW 1–3, Theorems 1–4) and his section order.
- Do not copy Lang's text or exercises. Problems are original variants.
- Show the minus sign as U+2212 (−). Accept "-" in input.

## Rules for design

- The FigCraft frames are the visual target (`design/FIGCRAFT.md`). Never change the FigCraft file. If FigCraft is not open, stop and ask.
- Use tokens only. No raw hex values in components, except inside `tokens.css`.
- Colour has meaning. Blue `#448AFF` = plus direction and variable *a*. Orange `#FF9800` = minus direction and draggable handles. Magenta `#AD1457` = Lang's rules and variable *b*. Teal `#009688` = correct and variable *c*. Red = not quite. Amber = hint. Green = progress. Ink blue `#1565C0` = the one brand action colour.
- Orange handles are the only parts the learner can drag.
- Never show an error with colour alone. Words carry the meaning.
- Smallest text is 14px. Body text is 18px.
- Mobile first: design at 390px, then 1440px desktop.

## Rules for accessibility

- WCAG 2.2 AA.
- Each drag has a keyboard and a tap alternative: arrow keys move one unit, Enter checks.
- Each widget has a text description for screen readers that changes with its state.
- Touch targets are 44 × 44 px minimum.

## How to work

- One step per session (for example 1B). Start in plan mode. Show the plan, wait for approval.
- After each step: run `build`, `test`, `lint` and `validate:content`. Fix all errors. Commit with the message in the prompt, for example `phase-1B: engine, practice, rule book, coverage`.
- Every lesson and every bank must have coverage rows that point to it. Update `content/coverage.json` in the same commit as the content.
- Recalculate every answer you put in JSON. If the design doc looks wrong, stop and ask. Do not fix content yourself.
- Take a Playwright screenshot of new screens at 390 × 844 and 1440 × 900. Compare each with its FigCraft frame (FIGCRAFT.md §4). Write the differences in the step's `diff.md`.
- Never commit secrets. The app has no API keys and no server.
- If a requirement is not clear, ask. Do not guess on content or math.
