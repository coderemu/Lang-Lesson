# Phase 1 · Chapter 1: acceptance

Steps 1E and 1F, tested against SRD §9.1 and §9.2. The last checks need your deploy (public URL). Commands: `npm run build`, `npm run test`, `npm run lint`, `npm run validate:content` and `npm run e2e` (two Playwright projects: mobile 390 × 844 and desktop 1440 × 900).

**Result: every criterion that can be tested before the deploy passes. Open items: criterion 9.1.11 and "live at its public URL" (they need your deploy), and the findings in "Differences and decisions" below.**

## SRD §9.1: every phase

| # | Criterion | Result | Proof |
| --- | --- | --- | --- |
| 1 | Each lesson plays from the first to the last screen at 390 px and at 1440 px | Pass | `e2e/chapter-1.spec.ts` (lessons 1.1, 1.3–1.8) and `e2e/lesson-1.2.spec.ts` (lesson 1.2), run in both projects. Each test answers every screen correctly, checks the screen counter, and checks that the lesson is saved as complete with its rules. |
| 2 | Each mistake in the lesson JSON gives its exact reply | Pass | `e2e/mistakes.spec.ts`: 716 cases from the JSON of lessons 1.1–1.8 (number-line and follow-up answers, number and multi-number inputs, choice options, trap options, and every wrong proof reason on every line). `src/engine/content-mistakes.test.ts` checks the same replies for every screen, follow-up and twin, and for the bank problems. One reply cannot be produced by a control: screen 1.2.03, answer 8 (3 + 5 is outside the line). The test lists it as the only exception. |
| 3 | Lessons and banks can be done with the keyboard only | Pass | Lessons 1.1, 1.3, 1.7 (`chapter-1.spec.ts`, keyboard tests), lesson 1.2 (`lesson-1.2.spec.ts`), bank 1.1 with number, numbers, choice and self-check problems (`banks.spec.ts`). The tests use Tab, arrows, typing and Enter only. The first control of each screen takes focus, and the feedback sheet button takes focus after Check. |
| 4 | Close in a lesson or bank, open again: same place | Pass | `e2e/persistence.spec.ts`: lesson 1.6 (close after screen 5, reload, Resume opens screen 6) and bank 1.4 (close at problem 5, reload, "Continue practice" opens problem 5). |
| 5 | Each bank has every problem of `practice-banks.md` with the same answers | Pass | `src/content/banks-doc.test.ts` compares number, answer text and Lang type of all 8 banks with the doc tables. It found two small differences in bank 1.2 (problems 11 and 12: "both sides" for "the two sides"). I changed the answer text to the doc wording. Number answers are recomputed by `validate:content` (`verify`). |
| 6 | The Coverage screen shows every row of `coverage-map.md`; each row links to an existing screen or problem | Pass | `e2e/acceptance.spec.ts`: 57 rows shown; with all lessons and banks done every row is "Covered" and the total reads "Chapter 1: 57 of 57 covered"; with no progress it reads "0 of 57". Every link of every row (more than 80 different links) was opened and shows a screen or a problem. Chapters 2–4 read "Coming in phase n". Screenshot: `qa/phase-1/1E/coverage-done-390.png`, `-1440.png`. |
| 7 | The rule book shows the rules of the chapter with the status of the "Assumed or proved" table | Pass, with one finding | `src/content/rules-table.test.ts` compares every rule of lessons 1.2–1.8 with the table: all 38 rules of the table have the table status, except Theorem 1 (table: "one case proved, three left to the reader"; rule book: "Left to reader"). Four rules of Chapter 1 are not in the table (`solve-sum`, `cancel-add`, `divides`, `frac-ops`). Finding: `rules.json` gives `cancel-add` to lesson 1.2, but `lesson-1.2.json` does not list it in `rulesEarned`, so a learner who finishes 1.2 earns 10 of the 11 rules. See "Differences and decisions". Screenshot: `rules-done-*.png`. |
| 8 | `/design-system` shows every new widget mode | Pass | `acceptance.spec.ts` checks the 19 widget entries (number line ×4 modes, thermometer, balance, proof stepper, area model ×3 modes, square tiles, fraction strips ×3 modes, trap summary, mirror picture). Screenshots: `design-system-widgets-390.png`, `-1440.png`. |
| 9 | `build`, `test`, `e2e` and `validate:content` pass with no errors | Pass | See "Final run" at the end of this file. |
| 10 | Screenshots at 390 and 1440 px are saved | Pass | `qa/phase-1/1E/` (22 screens at both sizes, made by `npm run qa:1e`), and `1A`–`1D`. |
| 11 | The hosted app shows the new chapter after deploy; old progress is still there | Partly. The rest needs your deploy | Before the deploy: `e2e/pwa.spec.ts` ("a new build shows the update toast, and progress survives the update") builds a second version, shows "New version ready. Reload.", reloads, and the progress and the saved lesson position are unchanged. After your deploy I open the live URL and check Home. |

## SRD §9.2: extra for Phase 1

| Criterion | Result | Proof |
| --- | --- | --- |
| Lesson 1.2 matches its FigCraft frames (S01–S14, D2, D4) | Partly checked | `qa/phase-1/1C/diff.md`. S01, S02, S03, S07 and S10 were measured with `get_node`. The other frames were compared by eye. The differences are listed there (for example Check stays disabled until there is an answer, and the frame texts that are not in the lesson JSON). |
| Home, Progress and Rule book match H01–H03 and DH1–DH3 | Pass, with listed differences | `qa/phase-1/1B/diff.md` (values measured with `get_node`, fixed in `3a2468e`). |
| The app is live at its public URL | Pending: needs your deploy | Steps in `docs/DEPLOY.md` §2. |
| The app installs on a phone | Pass in the browser. Phone test is yours | `e2e/pwa.spec.ts` ("manifest and icons make the app installable"): manifest fields, icons 192, 512 and maskable 512 load as PNG, and Chrome reports no installability errors (`Page.getInstallabilityErrors`). |
| The app works offline | Pass | `e2e/pwa.spec.ts` ("offline: …"): after one load, with the network off, Home, lesson 1.2 (two screens), bank 1.2 (one answer), lesson 1.6 and bank 1.8 (never opened before) work from the precache of 97 files. |
| Every route opens directly by URL | Pass | `e2e/pwa.spec.ts` ("every route opens directly by URL") on the production build: status 200 and a heading for 9 paths. `public/_redirects` sends other paths to `index.html` on the host. |
| A backup made on one browser restores on another browser | Pass | `e2e/pwa.spec.ts` ("a backup made in one browser context restores in a fresh context"): the downloaded file restores the same state in a new browser context. Unit tests: round trip and bad files (`src/store/store.test.ts`). |
| `/design-system` shows every token and component state | Pass | `/design-system` (1A tokens and components, 1C and 1D widgets); the widgets are asserted in criterion 8. |

## Accessibility (WCAG 2.2 AA, axe)

`e2e/a11y.spec.ts` runs axe with the tags wcag2a, wcag2aa, wcag21a, wcag21aa and wcag22aa at 390 px on: Home, Progress, Rule book, Coverage, Settings, bank overview, three bank problem types, `/design-system`, 19 lesson screens (every widget type and every interaction type), and the feedback sheets (correct, not quite, wrong reason) and the hint drawer. Serious and critical issues: **0**. Found and fixed in 1E:

- **Colour contrast.** Three text colours failed AA on their tints: `--color-ink-muted` (#767676 on the grey surface: 4.2), `--color-negative-text` (#c26a00: 3.6) and `--color-progress-text` (#4e7d1e on its tint: 4.4). I changed them in `src/styles/tokens.css` to #666666, #a65a00 and #49751b (ratios 4.7 and higher). This moves them away from the FigCraft variable values; see "Differences and decisions".
- **Names of math buttons (critical).** Choice buttons that hold only math had no readable name. The `Math` component now gives each rendered formula a spoken reading (for example "minus 6a plus 8b") as its accessible name (`src/math/spoken.ts`, tested).
- **Locked proof lines** are marked `aria-disabled`.

## Other findings fixed in 1E

- In the bank player, "Show me why" jumped to the next problem: the solution sheet reused the clicked button as a submit button. The sheet now has its own key (`PracticePlayer.tsx`).
- Lesson 1.5 (screen 6) and lesson 1.8 (screen 6) had wrong-reason replies for chips that are not in the tray. They are removed, and `validate:content` now rejects such replies. Lesson 1.3 screen 14 had no reply for its step chip; I added one.
- The twin of three practice screens carried no numbers (1D); fixed then, and tested here.
- The doubling strip's "×2" labels overlapped the boxes, and the Hint chip stretched across the stage on desktop. Both fixed.

## Bundle size (NFR-06)

In step 1E first-load JavaScript was **230 KB gzip** (limit 300 KB); step 1F lowered it to 153 KB (see below). Each lesson is its own chunk of about 4 KB gzip, the rules about 3 KB. KaTeX is not loaded lazily yet (DECISIONS #5 asks for lazy loading): it is in the first chunk, and the budget still holds. Offline mode and install are tested in step 1F.

## Differences and decisions (for you)

1. **Lesson 1.2 and `cancel-add`.** `rules.json` lists the cancellation law for addition under lesson 1.2, and the rule-book sample frame counts it (11 rules). `lesson-1.2.json` does not earn it. I did not change lesson text. Options: add `cancel-add` to `rulesEarned` of lesson 1.2 (one word in the JSON), or move the rule in `rules.json`.
2. **Three text colours** differ from the FigCraft variables (contrast, see above). The design file is not changed. If you prefer the original colours, the tokens must be fixed in the design instead.
3. **Pilot lesson 1.2** has two proof screens (1.2.08 and 1.2.09) where some tray chips have no wrong-reason reply (they get the general hint).
4. **Bank mistake replies.** Only bank 1.2 has mistake replies. The design doc gives none for the other banks.
5. **Theorem 1** (table: one case proved, three left to the reader): lesson 1.5 proves two cases. The rule book says "Left to reader".

## Step 1F: PWA, offline and first deploy

- **Build:** `vite-plugin-pwa` with a prompt update, manifest (name "Lang Lessons", short name "Lang", theme #1565C0, white background, standalone, start URL and scope from `base`), icons `public/icons/` (made by `npm run icons`), `public/_redirects`, and `npm run deploy` (Wrangler; no token in the repository).
- **Precache:** 97 files (about 1.8 MB): the app shell, all 8 lesson chunks, 8 bank chunks, rules and coverage, the woff2 fonts and the icons. The KaTeX ttf and woff files are left out.
- **Settings → About** shows the version (package version, git hash).
- **First-load size:** each screen except Home is now its own chunk. First-load JavaScript is **153 KB gzip** (was 230 KB).
- **Lighthouse (mobile, Home, production build):** performance **92**, accessibility **100**, best practices **100** (`qa/phase-1/1F/lighthouse-home-mobile.json`). Lighthouse 12 has no PWA category; installability is checked in the browser test above.
- **Repository:** `git ls-files | grep -i pdf` is empty. `docs/source/` is ignored.

## Final run

| Command | Result |
| --- | --- |
| `npm run build` | passes (type check and build) |
| `npm run test` | 215 tests pass; engine coverage 94% statements, 96% lines (threshold 90%) |
| `npm run lint` | passes (ESLint and Prettier) |
| `npm run validate:content` | OK: 8 lessons, 8 banks, 57 coverage rows, 66 rules |
| `npm run e2e` | 825 passed, 0 failed. 747 are skipped on purpose: the mistake-reply spec and the axe spec run in the mobile project only (the replies and the accessibility checks do not depend on the width) |

One earlier run had a single failure: the keyboard-only test of lesson 1.3 pressed Enter in the 120 ms before the player moved focus to the first control of a new screen. The test now waits for focus to settle; the next full run was clean.

`npm run e2e:preview` (production build, 5 tests): passes.
