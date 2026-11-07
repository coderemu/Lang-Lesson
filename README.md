# Lang Lessons: Claude Code starter kit

This kit holds everything that Claude Code needs to build Lang Lessons. Lang Lessons is a web app with interactive lessons, in the style of Brilliant, for Serge Lang's *Basic Mathematics*, chapters 1–4.

The build has four phases, one for each chapter. Each phase delivers its chapter complete: the lessons, the practice banks and the coverage map.

## What is in the kit

| Path | What it is |
| --- | --- |
| `CLAUDE.md` | Project rules. Claude Code reads this file at the start of each session. |
| `.claude/settings.json` | Lets Claude Code read the FigCraft file, and blocks every tool that could change it. |
| `docs/SRD.md` | Software requirements (v2.0): phases, functions, quality, hosting, acceptance criteria. |
| `docs/CONTENT-GUIDE.md` | How to convert the design doc into lesson, bank and coverage JSON. |
| `docs/DEPLOY.md` | How to put the app online (Cloudflare Pages), install it on your phone, and move progress between devices. |
| `docs/lesson-design/` | **You add** the three tabs of the lesson design doc here (step 2). |
| `docs/source/` | **You add** the Lang PDF here (step 3). Git ignores this folder. |
| `design/FIGCRAFT.md` | How Claude Code connects to the FigCraft file and compares screens with it. |
| `design/figcraft-map.json` | Every FigCraft frame: node id, route and lesson screen. |
| `design/DESIGN-SYSTEM.md` | Rules, component states, layouts, motion; the screens that have no frame. |
| `design/tokens.css`, `design/tokens.json` | Design tokens (same values as the FigCraft variables). |
| `content/` | Schema, 66 rules, pilot lesson 1.2 (each screen has a `designRef` to its frame), bank 1.2, starter coverage. |
| `prompts/` | 16 prompts: the kickoff, then four phase folders. Paste them into Claude Code in order. |

## How to start

1. **Make the project folder.** Unzip the kit into a new folder, for example `~/Projects/lang-lessons`. This folder becomes the code repository.
2. **Add the lesson design doc.** Open "Lang Basic Mathematics: Lesson Design Doc". Download each of the three tabs as Markdown into `docs/lesson-design/`:
   - main tab → `lesson-design.md`
   - Coverage map tab → `coverage-map.md`
   - Practice banks tab → `practice-banks.md`
3. **Add the book (local only).** Copy the Lang PDF to `docs/source/lang-ch1-4.pdf`. Git never stores it.
4. **Open the design.** Start FigCraft with the control port, then open `Basic Mathematics Lang.figcraft`:
   ```
   open -a FigCraft --args --control 7979
   ```
   Keep FigCraft open while Claude Code works.
5. **Connect FigCraft to Claude Code.** In the project folder:
   ```
   claude mcp add figcraft-app -- /Users/emu/figcraft/target/release/figcraft-cli mcp --attach 7979
   ```
6. **Start Claude Code:** `cd ~/Projects/lang-lessons`, then `git init`, then `claude`. Type `/mcp` and check that `figcraft-app` is connected.
7. **Paste the prompts in order**, one step per session. After each step, do the check in the prompt before you go on.

## The four phases

| Phase | Prompts | Result | Git tag |
| --- | --- | --- | --- |
| — | `00-kickoff.md` | Claude Code reads the kit, checks it and gives a plan. No code. | — |
| **1 · Chapter 1: Numbers** | `1A` foundation, app shell, design system route · `1B` engine, Home, Progress, Rule book, practice, coverage, settings and backup · `1C` pilot widgets and lesson 1.2 · `1D` lessons 1.1–1.8, banks 1.1–1.8, coverage ch. 1 · `1E` acceptance · `1F` PWA and first deploy | Chapter 1 complete and online | `v0.1-chapter-1` |
| **2 · Chapter 2: Linear equations** | `2A` elimination board and checkers · `2B` lessons, banks, coverage · `2C` acceptance | Chapter 2 complete: 3 lessons, 3 banks | `v0.2-chapter-2` |
| **3 · Chapter 3: Real numbers** | `3A` zoom, intervals, expression checkers · `3B` lessons, banks, coverage · `3C` acceptance | Chapter 3 complete: 6 lessons, 6 banks | `v0.3-chapter-3` |
| **4 · Chapter 4: Quadratic equations** | `4A` complete-the-square tiles, discriminant · `4B` lessons, banks, coverage · `4C` final acceptance | Course complete: 19 lessons, 19 banks, full coverage map | `v1.0` |

Phase 1 is the largest, because it also builds the foundation (design system, app shell, lesson engine, practice, rule book, progress, coverage) and puts the app online. Phases 2–4 add only new widgets, checkers and content; at the end of each, you push and the live app updates.

## Where the app lives

The app is a static PWA. You host it free on Cloudflare Pages, open it from any browser, and install it on your phone. Progress stays on each device; use Settings → Back up / Restore to move it. Details: `docs/DEPLOY.md`.

## How to work with Claude Code

- Start each step in plan mode (press Shift+Tab two times). Read the plan, then approve it.
- Use one session per step. Type `/clear` between steps. `CLAUDE.md` carries the rules into each new session.
- Do not paste the next prompt until the check of the current step passes.
- Do not start a phase before the tag of the previous phase exists.
- If a result is wrong, describe what is wrong and name the frame. Example: "Screen 1.2.03 at 390 px: the hop numbers overlap the ring. Compare with FigCraft frame S03." Claude Code can open the frame itself.
- If you change a frame in FigCraft, tell Claude Code which frame changed. If you add a frame, add it to `design/figcraft-map.json`.
- If Claude Code reports a content question (an answer that looks wrong, a proof that differs from Lang), decide it yourself. Then update the design doc too, so the doc and the app agree.
