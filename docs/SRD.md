# Software Requirements Document: Lang Lessons

Version 2.0 · 7 November 2026 · Owner: Emu

Changes in 2.0: the design source is the FigCraft file (no PNG references); navigation is Home, Progress, Rule book; new Progress screen; time tracking; progress backup and restore; hosting as a static PWA (§11).

## 1. Purpose

This document gives the requirements for Lang Lessons. Lang Lessons is a web app, hosted as a static site, that Emu opens from any device with interactive lessons for Serge Lang's *Basic Mathematics*, chapters 1–4. The app teaches like Brilliant: the learner does a task first, then sees the rule.

The build has four phases. Each phase delivers one chapter of the book, complete: its lessons, its practice banks and its part of the coverage map.

## 2. Users

There is one user: an adult who completed high school mathematics many years ago. The user knows arithmetic but is slow. Symbols and proofs are new. The user studies in sessions of 8–15 minutes, on a phone or on a laptop.

## 3. Content sources

| Source | File | Use |
| --- | --- | --- |
| Lesson design (19 lessons) | `docs/lesson-design/lesson-design.md` | Screen outlines, goals, mistake replies, rule status table |
| Coverage map | `docs/lesson-design/coverage-map.md` | Every topic and exercise group of Lang ch. 1–4 → lesson screen, bank or skip |
| Practice banks | `docs/lesson-design/practice-banks.md` | 164 original problems with answers, one bank per lesson |
| Pilot lesson | `content/lessons/lesson-1.2.json` | Complete example of a lesson in JSON |
| Rules | `content/rules.json` | All rules of ch. 1–4 with Lang's status |
| Book (local only) | `docs/source/lang-ch1-4.pdf` | Check fidelity. Never copy text from it. |

Each phase converts the Markdown of its chapter into JSON in `content/`. The JSON is the source of truth for the app.

## 4. Phases

| Phase | Chapter | Lessons | Banks | New engine work |
| --- | --- | --- | --- | --- |
| 1 | Ch 1: Numbers | 1.1–1.8 (8) | 1.1–1.8 (8) | Foundation: scaffold, tokens, app shell (tab bar and sidebar), design system route, lesson engine, Home, Progress, Rule book, practice mode, coverage map screen, backup and restore, first deploy. Widgets: number line, thermometer, rule card, proof stepper, balance, area model, square tiles, fraction strips. Checkers: number, choice, multi-part, proof. |
| 2 | Ch 2: Linear equations | 2.1–2.3 (3) | 2.1–2.3 (3) | Elimination board widget; balance `system` mode; checker for pairs and triples (x, y, z); "no solution" answer. |
| 3 | Ch 3: Real numbers | 3.1–3.6 (6) | 3.1–3.6 (6) | Number line `zoom`, `mirror`, `interval`; E/I table; checkers for expressions (mathjs), solution sets, intervals; "no solution" for equations with roots. |
| 4 | Ch 4: Quadratic equations | 4.1–4.2 (2) | 4.1–4.2 (2) | Square tiles `complete`; discriminant slider on the number line; checker for roots with radicals. Course complete: final coverage check, full regression. |

Each phase is complete only when its acceptance criteria (§9) pass. Do not start the next phase before that.

## 5. Scope rules

In scope for all phases:

- Lessons, practice banks and coverage map for the chapter of the phase.
- The rule book and design system route grow with each phase.
- Progress saved in localStorage on each device, with a backup file to move it between devices (FR-85, FR-86).
- After each phase, the hosted app is updated (§11).

Out of scope:

- Accounts, log-in, servers, databases, payments, third-party analytics, social features. (The Progress screen uses only local data.)
- Automatic sync between devices (open decision; see §11.4).
- Timers, lives, streak penalties, leaderboards.
- Any text or exercise copied from Lang's book.
- Dark mode (open decision; not before Phase 4).

## 6. Functional requirements

Each requirement has an ID. Tests and commits refer to these IDs. The "Phase" column gives the first phase that needs the requirement.

### 6.1 Course and navigation

| ID | Phase | Requirement |
| --- | --- | --- |
| FR-01 | 1 | The home screen (frames H01, DH1) shows a Continue card for the lesson in progress, then all 19 lessons in book order, grouped by chapter, with title, book section and minutes. On desktop, Chapter 1 or the current chapter is in the main column and later chapters are in a side card. |
| FR-02 | 1 | Each lesson shows one state: locked, open, in progress (with screen number), complete. Lessons of later phases show "Coming soon". |
| FR-03 | 1 | A lesson opens when the previous lesson is complete. Settings has "Unlock all" for testing. |
| FR-04 | 1 | Tap a lesson row to open the lesson. A complete lesson row also shows "Practice", which opens the bank of that lesson. |
| FR-05 | 1 | The navigation has three destinations: Home, Progress, Rule book. Below 900 px: bottom tab bar (H01–H03). From 900 px: left sidebar 248 px (DH1–DH3). The lesson and practice players hide the navigation. |
| FR-06 | 1 | Progress (`/progress`, frames H02, DH2) shows: four stat tiles (lessons done / 19, rules earned / total, current bank correct / total, minutes this week); a 7-day bar chart of minutes (today highlighted); "Needs practice" (bank problems in state "not yet", each with Practice); "By chapter" (lessons done per chapter with a bar). |
| FR-07 | 1 | Progress links to Coverage ("See coverage map", under By chapter) and to Settings ("Settings and backup", at the end). `/design-system` is linked from Settings. |

### 6.2 Lesson player

| ID | Phase | Requirement |
| --- | --- | --- |
| FR-10 | 1 | The player loads `content/lessons/<id>.json` and shows one screen at a time. |
| FR-11 | 1 | The lesson bar shows close, one segment per screen (done = green, current = ink, next = grey) and "n / total". |
| FR-12 | 1 | Close saves the position. The lesson opens again at the saved screen. |
| FR-13 | 1 | Each screen shows label, title, prompt and interaction, in the layouts of `DESIGN-SYSTEM.md` §6. |
| FR-14 | 1 | The primary button shows "Check" while the screen needs an answer. "Check" is disabled until there is an answer. |
| FR-15 | 1 | After Check, the feedback sheet slides up. Correct: teal sheet, title and one line of why. Not quite: red sheet, matched mistake reply or general hint. |
| FR-16 | 1 | After correct: "Continue". After not quite: "Try again" and "Show me why". |
| FR-17 | 1 | The checker compares the answer with the correct value, then with each `mistakes[].match` in order. The first match gives the reply. |
| FR-18 | 1 | The Hint button opens the hint drawer. Maximum two hints per screen, one at a time ("HINT 1/2"). |
| FR-19 | 1 | After two wrong answers, "Show me why" plays the worked solution (`showMe`). Then the player shows the `twin` problem, if the screen has one. |
| FR-20 | 1 | Screens without an answer show "Continue" at once. |
| FR-21 | 1 | The last screen saves `rulesEarned` to the rule book and marks the lesson complete. |
| FR-22 | 1 | Number input accepts "-" and "−", spaces, a leading "+", fractions "a/b" and decimals. It rejects letters, except in expression inputs. |

### 6.3 Practice banks

| ID | Phase | Requirement |
| --- | --- | --- |
| FR-30 | 1 | Each lesson has a practice bank in `content/practice/bank-<id>.json`. Each problem has: number, prompt, answer type, answer, worked solution, Lang type (for example "§2 ex. 14–21"), optional stretch flag. |
| FR-31 | 1 | Practice mode shows one problem at a time with Check, feedback and up to two hints, like the lesson player. |
| FR-32 | 1 | Answer types: `number`, `numbers` (several values), `pair`, `triple`, `expression`, `set` (solutions), `interval`, `choice`, `self-check`. |
| FR-33 | 1 | `self-check` is for proofs and drawings. The app shows the problem, the learner writes on paper, then taps "Show solution". The learner marks "I got it" or "Not yet". |
| FR-34 | 1 | The bank screen shows each problem's state: not tried, correct, not yet. "Practice again" shows only "not yet" problems first. |
| FR-35 | 1 | Stretch problems show a "STRETCH" label and are optional for bank completion. |
| FR-36 | 1 | A bank is complete when all non-stretch problems are correct or marked "I got it". |
| FR-37 | 1 | Each problem shows its Lang type, so the learner can find the matching exercises in the book. |

### 6.4 Coverage map

| ID | Phase | Requirement |
| --- | --- | --- |
| FR-40 | 1 | Coverage data is in `content/coverage.json`. Each row: chapter, section, Lang topic or exercise group, where (lesson screens and/or bank), note, kind (`topic`, `exercises`, `skip`). |
| FR-41 | 1 | The Coverage screen lists rows grouped by chapter and section, in book order. |
| FR-42 | 1 | Each row shows a status from progress: not started, in progress, covered (all its lesson screens done and bank problems correct). Skip rows show "Later chapter in Lang" and the reason. |
| FR-43 | 1 | Each row links to its lesson screen or bank. |
| FR-44 | 1 | The Coverage screen shows a total for each chapter, for example "Chapter 1: 42 of 58 covered". |
| FR-45 | each | Each phase adds the rows of its chapter. Rows for later chapters show "Coming in phase n". |

### 6.5 Rule book

| ID | Phase | Requirement |
| --- | --- | --- |
| FR-50 | 1 | The rule book lists earned rules with name, statement, picture or example, Lang's status and lesson. |
| FR-51 | 1 | Filter chips with counts: All, Assumed, Proved, Left to reader (frames H03, DH3). Mobile: one column; desktop: three-column grid of equal-height cards. Each card: rule id chip, name, statement, status badge, lesson and book section. |
| FR-52 | 1 | Proof steppers take their reason tray from the rule book plus the rules of the current lesson. |

### 6.6 Widgets and checkers

Full widget specifications are in `DESIGN-SYSTEM.md` §5.

| ID | Phase | Widget or checker |
| --- | --- | --- |
| FR-60 | 1 | Number line: `place`, `hops`, `compare`, `mirror` |
| FR-61 | 1 | Thermometer: `guess` |
| FR-62 | 1 | Rule card, Try box, Trap box, Choice, Number slot, multi-part Number slots |
| FR-63 | 1 | Proof stepper |
| FR-64 | 1 | Balance: `solve` |
| FR-65 | 1 | Area model: `distribute`, `width-2`, `doubling-strip` |
| FR-66 | 1 | Square tiles: `expand` |
| FR-67 | 1 | Fraction strips: `cut`, `add`, `invert` |
| FR-68 | 2 | Elimination board: `two-unknowns`, `three-unknowns`, `general`; Balance `system` |
| FR-69 | 2 | Checkers: `pair`, `triple`, "no solution" |
| FR-70 | 3 | Number line `zoom`, `interval`; E/I table; Fraction strips `mediant`; Square tiles `compare` |
| FR-71 | 3 | Checkers: `expression` (mathjs equivalence), `set`, `interval` |
| FR-72 | 4 | Square tiles `complete`; discriminant slider |
| FR-73 | 4 | Checker for roots with radicals, for example (1 ± √5)/2 |

### 6.7 Progress and data

| ID | Phase | Requirement |
| --- | --- | --- |
| FR-80 | 1 | The store keeps, per lesson: state, current screen, screens done, attempts per screen, last session date. |
| FR-80a | 1 | The store keeps active learning time per calendar day (local time). Count time only while a lesson or practice screen is visible and the learner acted in the last 2 minutes. |
| FR-81 | 1 | The store keeps, per bank problem: state and attempts. |
| FR-82 | 1 | The store keeps the rule book (rule IDs, date earned). |
| FR-83 | 1 | All data stays in localStorage under `lang-lessons/v1`. Settings has "Reset progress" with a confirmation. |
| FR-85 | 1 | Settings has "Back up progress": it downloads `lang-lessons-backup-YYYY-MM-DD.json` with the whole store and its version. |
| FR-86 | 1 | Settings has "Restore from backup": it reads a backup file, checks its version, shows a summary (lessons done, last date) and asks for confirmation before it replaces local progress. A bad file shows an error and changes nothing. |
| FR-87 | 1 | The app asks the browser for persistent storage (`navigator.storage.persist()`) on first use, so the browser does not clear progress. |
| FR-84 | 1 | `npm run validate:content` checks lessons, banks, coverage and rules (§8). |

## 7. Quality requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | Accessibility: WCAG 2.2 AA. Each drag has a keyboard alternative. Each widget has a live text description. |
| NFR-02 | Touch targets 44 × 44 px minimum. Text 14 px minimum. |
| NFR-03 | Colour is never the only signal. Feedback has words and an icon. |
| NFR-04 | With `prefers-reduced-motion`, all motion becomes a fade of 120 ms or less. |
| NFR-05 | Layout works from 360 to 1920 px. Mobile layout below 900 px. |
| NFR-06 | Initial JavaScript under 300 KB gzip, not counting fonts. Lessons load on demand. |
| NFR-07 | The app works offline after the first load, including every lesson and bank that exists. It can be installed to the home screen (PWA manifest, icons, standalone display). |
| NFR-10 | The app is static files only. It runs from any HTTPS static host and from a sub-path (configurable `base`). |
| NFR-11 | A new deploy updates the app on the next visit and shows "New version ready. Reload." It never loses progress. |
| NFR-08 | TypeScript strict. No `any` in engine code. |
| NFR-09 | Test coverage of `src/engine` 90% or more. One Playwright play-through per lesson and per bank. |

## 8. Content validation

`npm run validate:content` must fail if one of these is true:

1. A lesson, bank or coverage file does not agree with `content/schema.ts`.
2. Two screens or problems in one file have the same ID.
3. A rule ID in a lesson does not exist in `rules.json`.
4. A screen has more than two hints.
5. A correct answer is also a mistake match.
6. A coverage row points to a lesson screen or bank problem that does not exist.
7. A lesson or bank of the current phase has no coverage row that points to it.
8. A number answer fails a recomputation, where the bank gives a `verify` expression.
9. A `designRef` in a lesson names a frame that is not in `design/figcraft-map.json`.

## 9. Acceptance criteria

### 9.1 For every phase

1. Each lesson of the chapter plays from the first to the last screen at 390 px and at 1440 px.
2. Each mistake in the lesson JSON gives its exact reply.
3. The learner can do each lesson and bank with the keyboard only.
4. Close the browser in a lesson or bank, then open it again. The app continues at the same place.
5. Each bank of the chapter contains every problem of `practice-banks.md` for that chapter, with the same answers.
6. The Coverage screen shows every row of `coverage-map.md` for that chapter. Each row links to an existing screen or bank problem.
7. The rule book shows the rules of the chapter with the status of the "Assumed or proved" table.
8. `/design-system` shows every new widget mode of the phase.
9. `build`, `test`, `e2e` and `validate:content` pass with no errors.
10. Screenshots at 390 px and 1440 px are saved in `qa/phase-n/`.
11. The hosted app shows the new chapter after deploy, and old progress is still there.

### 9.2 Extra for Phase 1

- Lesson 1.2 matches its FigCraft frames (S01–S14, D2, D4) in layout, type and colour. Home, Progress and Rule book match H01–H03 and DH1–DH3.
- The app is live at its public URL, installs on a phone, and works offline (§11).
- A backup made on one browser restores on another browser.
- `/design-system` shows every token and component state.

### 9.3 Extra for Phase 4

- All 19 lessons, 19 banks and every coverage row are complete.
- The Coverage screen shows chapters 1–4, with skips only for topics that Lang postpones.
- A full regression play-through of all lessons passes.

## 10. Architecture

```
content/lessons/*.json   content/practice/*.json   content/coverage.json   content/rules.json
          │                        │                        │                      │
          ▼                        ▼                        ▼                      ▼
   LessonPlayer              PracticePlayer           CoverageScreen          RuleBook   Home / Progress (read the store)
          └──────────┬─────────────┘                        ▲                      ▲
                     ▼                                      │                      │
              ScreenRenderer ──► widgets/*            store (Zustand + persist) ───┘
                     │
              AnswerChecker (pure functions per answer type)
```

- Content is data. A new lesson or bank must not need new engine code, except a new widget or checker.
- Widgets are controlled components: `spec`, `value`, `onChange`. The engine owns the answer.
- Checkers are pure functions: `(spec, answer) => correct | mistake(reply) | unknown`.

## 11. Hosting

### 11.1 Build

- `npm run build` gives static files in `dist/`. There is no server code.
- `vite-plugin-pwa`: manifest (name "Lang Lessons", short name "Lang", theme `#1565C0`, background `#FFFFFF`, display `standalone`), icons 192, 512 and maskable 512, service worker that precaches the shell, fonts and every lesson and bank chunk. Update type `prompt` (NFR-11).
- SPA fallback: unknown paths return `index.html`. Add the file for the chosen host (for example `public/_redirects` with `/* /index.html 200` for Cloudflare Pages and Netlify).

### 11.2 Host

Default host: **Cloudflare Pages** (free, HTTPS, global). The repository is pushed to a private GitHub repository; Cloudflare Pages builds on each push to `main`. Build command `npm run build`, output `dist`. Alternatives that work with the same build: Netlify, Vercel (static), GitHub Pages (needs `base` set to the repository name and a `404.html` copy of `index.html`).

`docs/source/` (Lang's book) is never committed and never deployed.

### 11.3 Privacy

The site is public, but it holds no personal data: progress stays in the browser. No cookies, no trackers, no external requests after load (fonts are bundled).

### 11.4 Using more than one device

Each browser has its own progress. To move progress: Back up on device A (FR-85), send the file to yourself, Restore on device B (FR-86). Automatic sync needs a server and an account; it is out of scope. If it becomes needed, the open option is a small key-value store (for example Cloudflare KV) with a private sync code, as a separate phase.

## 12. Glossary

| Term | Meaning |
| --- | --- |
| Screen kind | recall, hook, explore, name-it, prove-it, practice, trap-summary |
| Interaction | What the learner does on a screen: number line, choice, number input, proof, balance and so on |
| Mistake reply | A reply for one known wrong answer: what is correct, the error, one question |
| Rule status | assumed, proved, left to the reader, shown |
| Twin | A similar problem after "Show me why", so the learner ends on a correct answer |
| Lang type | The exercise group in Lang that a bank problem practises, for example "§2 ex. 14–21" |
| Self-check | A bank problem the learner does on paper, then compares with the solution |
