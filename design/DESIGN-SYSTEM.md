# Lang Visuals: design system

Source of truth: the FigCraft file "Basic Mathematics Lang", page **Screens** (read it through the FigCraft MCP; see `FIGCRAFT.md` and `figcraft-map.json`). The frames show layout, spacing, type and colour. This file gives the rules, the states the frames do not show (hover, focus, disabled, motion, icons) and the screens that have no frame (Coverage, Settings, design system route). If a frame and this file disagree, follow the frame and report it.

Mood: a graph-paper workbook. White paper, near-black ink, one blue for actions. Other colours appear only when they mean something.

## 1. Colour

All values are in `tokens.css`. Use the variable, never the hex.

| Role | Token | Use |
| --- | --- | --- |
| Ink | `--color-ink` | Text, math, lines, the Continue button |
| Ink soft / muted | `--color-ink-soft`, `--color-ink-muted` | Secondary text; muted only at 14px+ |
| Paper, surface, line, grid | `--color-paper`, `--color-surface`, `--color-line`, `--color-grid` | Page, widget stage, borders, graph grid |
| Brand action | `--color-primary` | Check button, focus ring, links, selected chip |
| Plus direction, variable *a* | `--color-primary-bright` | Right/up on the line, *a* in formulas |
| Minus direction, drag handle | `--color-negative` | Left/down on the line, every draggable handle |
| Lang's rule, variable *b* | `--color-rule` | Rule cards, reason chips, *b* in formulas |
| Correct, variable *c* | `--color-correct` | Correct sheet, *c* in formulas |
| Not quite | `--color-incorrect` | Not-quite sheet, input border on error |
| Hint | `--color-hint` | Hint drawer, Hint button text (`--color-hint-text`) |
| Progress | `--color-progress` | Done segments in the lesson bar, mastery |

On a tint, use the matching `*-text` token for text (AA contrast).

Each variable keeps its colour in the whole course: *a* blue, *b* magenta, *c* teal. In KaTeX, use `\va{a}`, `\vb{b}`, `\vc{c}`.

## 2. Type

| Style | Font | Size / line | Weight | Tracking |
| --- | --- | --- | --- | --- |
| Display (desktop title) | Bricolage Grotesque | 44 / 48 | 800 | −0.02em |
| Title (mobile title, section heads) | Bricolage Grotesque | 32 / 36 | 800 | −0.02em |
| Sheet title, widget names | Bricolage Grotesque | 22–24 / 1.2 | 800 | 0 |
| Body | Inter | 18 / 28 | 400 | 0 |
| Small | Inter | 16 / 24 | 400 | 0 |
| Caption | Inter | 14 / 20 | 400 | 0 |
| Button | Inter | 18 | 600 | 0 |
| Label | IBM Plex Mono, UPPERCASE | 14 | 400 | 0.08em |
| Math | STIX Two Text (KaTeX) | 22–36; 56 on desktop stage | 400, italic for letters | 0 |

Labels name the screen kind (EXPLORE, NAME IT, PROVE IT, PRACTICE · 2 OF 4) and rules (RULE N2 · ADDITIVE INVERSE).

## 3. Space, radius, elevation

- Space scale: 4, 8, 12, 16, 24, 32, 48, 64. Group related items tight (8–12), separate groups wide (24–48).
- Radius: chips 6, cards and inputs 12, widget stages and sheets 20, buttons pill.
- No drop shadows, except on the two overlays: the feedback sheet and the open hint drawer (`0 -4px 20px rgb(0 0 0 / 10%)`). Elsewhere, separation comes from surface colour, borders and space.

## 4. Components

| Component | Spec | States |
| --- | --- | --- |
| **Button / Primary** | Pill, `--color-primary` fill, white 18/600 text, padding 16 × 40; full width on mobile | default, hover (−6% lightness), focus (2px ring offset 2), disabled (surface fill, muted text) |
| **Button / Continue** | Same shape, ink fill | default, focus |
| **Button / Secondary** | Pill, 2px ink border, ink text | default, hover (surface fill), focus |
| **Button / Hint** | Text button, bulb icon 20px, `--color-hint-text` | default, open |
| **Choice chip** | Radius 12, 2px border `--color-line`, 14 × 24 padding, body text | unselected, selected (primary border, 8% primary tint, primary 600 text), correct, wrong (after check), disabled |
| **Number slot** | 96 × 64 (mobile 76 × 60), radius 12, 2px border, math font 30–32 | empty, focused (primary border), filled, wrong (incorrect border), correct (correct border) |
| **Reason chip** | Radius 6, `--tint-rule` fill, mono 14 `--color-rule` text, 10 × 14 padding | in tray, placed, wrong (shake 0, red outline + reply), disabled |
| **Reason slot** | Radius 6, 2px dashed border; "why?" in `--color-negative-text` when active, "locked" muted when locked | empty, active, filled, locked |
| **Feedback sheet** | Bottom sheet over the action area, radius 24 top corners, padding 24 24 40, gap 8; icon 24 + title Inter 20/28 700 in the `*-text` colour + body 16/24 ink + actions (one full-width button, or two equal buttons with gap 12) | correct (`--tint-correct`), not quite (`--tint-incorrect`), wrong reason in a proof (`--tint-hint`, title "Not N4." style) |
| **Hint drawer** | Floats 12 px from the screen sides, just above the action area; radius 20, `--tint-hint` fill, 1.5px `--color-hint` border; top row: label "HINT 1/2" mono `--color-hint-text` + "Hide" text button; body 16/24 | closed (Hint chip in the answer row: pill, `--tint-hint`, 14/600 `--color-hint-text`), hint 1, hint 2 |
| **Lesson bar** | Close icon 22, segmented bar (gap 3–4, height 6–8), counter mono 14 | segments: done = progress, current = ink, next = line |
| **Rule card** | Radius 12, 2px `--color-rule` border, padding 24–32; label mono rule colour; statement math 32–36; optional picture; spoken form 16/24 soft | default |
| **Try box** | Radius 12, 1.5px line border; "TRY" label mono primary + body 16 | default |
| **Trap box** | Radius 12, `--tint-hint`; "ONE LAST TRAP" label + question + True/False chips | default, answered |

| **Tab bar** (mobile) | Fixed bottom, height 84, paper fill, 1px top border `--color-line`; three equal items: icon 24 + label 14/18 600, gap 4 | active (`--color-primary`), inactive (`--color-ink-muted`) |
| **Sidebar** (desktop) | Width 248, `--color-surface` fill, 1px right border; padding 32 20; brand "Lang Lessons" Bricolage 24 + label "BASIC MATHEMATICS"; nav items: icon 24 + label 16/22 600, padding 10 12, radius 10 | active (`--tint-primary` fill, primary text), inactive (`--color-ink-soft`) |
| **Continue card** | `--color-primary` fill, radius 20, padding 20, gap 10; label mono `--tint-primary`; title Bricolage 26/30 white; meta 14 `--tint-primary`; progress track 6 px (white 25%) with white fill; "Resume" pill white with primary text | default |
| **Lesson row** | Padding 14 16, gap 14, rows divided by 1px `--color-line` inside a card (radius 16, 1.5px border); status badge 36 circle; title 16/22 600; meta 14/20 | done (green badge, white check, "Practice" link), current (`--tint-primary` row, primary ring badge with number, primary meta "screen n"), open (ring badge, ink), locked (surface badge, muted text, lock icon), coming soon |
| **Stat tile** | `--color-surface`, radius 16, padding 14 16; value Bricolage 30 + unit Inter 16/600 muted; label 14 `--color-ink-soft` | default |
| **Section card** | Paper, radius 16, 1.5px `--color-line` border, padding 16; head row: mono label muted + optional 14 muted value | default |
| **Rule list card** | Section card, padding 16, gap 8: top row (rule id chip `--tint-rule` + name 16/22 600); statement STIX 21/28 with coloured variables; bottom row: status badge (pill 14/600) left, "Lesson n.n · Ch n §n" 14 muted right | status: Assumed (`--color-surface` / `--color-ink-soft`), Proved (`--tint-correct` / `--color-correct-text`), Left to reader (`--tint-hint` / `--color-hint-text`) |
| **Filter chip** | Pill, padding 10 14, 14/600 | selected (ink fill, white text), unselected (1.5px `--color-line` border, `--color-ink-soft`) |

Icons: simple 2px strokes, round caps. Correct = white check on teal circle. Not quite = white "!" on red circle.

## 5. Widgets

Every widget sits on a stage: `--color-surface`, radius 20. Orange handles are the only draggable parts. Each widget:

- takes `spec` (from the lesson JSON), `value` and `onChange`;
- supports pointer drag, tap-to-place and keyboard (arrows move one unit; Enter = Check);
- gives an `aria-live` text description of its state, for example "Ring at minus 2. 5 hops to the left of 3.".

| Widget | Chapter | Look (see 03 Math widgets) | Behaviour and modes |
| --- | --- | --- | --- |
| **Number line** | 1, 3 | Ink axis 2px, ticks every unit, 0 tick taller, labels STIX 16–22, start point ink dot, orange ring for the learner, hop arcs orange 3px with step numbers | `place` (put a value), `hops` (start + add n; arcs animate 240 ms per unit), `compare` (two paths side by side), `mirror` (show a and −a, dashed arc over 0), `zoom` (decimal search, 1 → 0.1 → 0.01), `interval` (filled/empty endpoints, shaded range, infinite arrows) |
| **Thermometer** | 1 | Vertical number line, rounded tube, `--color-primary-bright` mercury, dashed zero line, orange guess ring | `guess` (drag guess, then animate change and show result) |
| **Area model** | 1, 3 | Rectangle split into tinted parts: *b* part `--tint-rule`, *c* part `--tint-correct`, white unit grid lines, side labels in variable colours, orange split handle | `distribute` (slide split, areas update), `width-2` (even/odd blocks), `doubling-strip` (repeated ×2 or ÷2) |
| **Square tiles** | 1, 3, 4 | *x*² square `--tint-primary`, two strips `--tint-rule`, corner square dashed orange when missing | `expand` ((a+b)²), `complete` (drag the missing corner), `compare` (a² < b² nesting) |
| **Fraction strips** | 1, 3 | Bars 36px high, radius 4, shaded part `--color-primary-bright`, orange dashed guide line, labels STIX right side | `cut` (tap to divide finer), `add` (common denominator), `invert` (flip m/n), `mediant` |
| **Balance** | 1, 2, 3 | Triangle stand `--color-line`, ink beam 4px, triangle hangers, *x* box white with primary border, ink unit cubes, orange dashed cube = selectable | `solve` (remove same from two pans; beam tips if unequal), `system` (two balances for two equations; add/subtract rows) |
| **Proof stepper** | All | Stage with lines: expression (math 22–32) left, reason chip right; current line white with primary border; future lines 35% opacity "locked"; tray of reason chips below | lines unlock in order; tray holds only earned rules |
| **Elimination board** | 2 | Rows of equations as coefficient tiles in variable colours; row actions "× k", "add row", "subtract row" | `two-unknowns`, `three-unknowns`, `general` (letters a, b, c, d with *ad* − *bc* readout) |
| **E/I table** | 3 | 2 × 2 tables for + and ×, empty cells as number slots | fill cells, then check |

## 6. Screen layouts

Frame keys refer to `figcraft-map.json`. Measure exact values with `get_node`.

### 6.1 Lesson player, mobile (390 × 844) — S01–S14

Top to bottom: lesson bar (padding 8 20 0; close icon; 14 segments height 6, gap 3, radius 3), content (padding 36 24 0, gap 20; 16 on dense screens like S05, S07–S10), action area (padding 16 24 40, gap 12: caption 14 muted centred, then full-width primary button, padding 18). The feedback sheet covers the action area. No status bar: it is part of the phone mockup.

| Template | Frames | Notes |
| --- | --- | --- |
| Recall | S01 | Number line `place` on a stage; readout under the line |
| Hook | S02 | Thermometer; button "Check my guess" |
| Explore | S03, S04 | Stage with live equation above the widget; Try box (S03) or question + two choice chips (S04) |
| Name it | S05, S06, S10 | Rule card with picture + WORDS MATTER note (S05); widget + answer row with number slot and Hint chip (S06, S10) |
| Prove it | S07, S08, S09 | Proof list (rows divided by 1px lines: math left, reason chip right); tray of reason chips wraps under the list; locked lines 45% opacity; wrong reason opens the hint-style sheet (S09) |
| Practice | S11, S12, S13 | Answer row(s); correct sheet (S11), not-quite sheet with two buttons (S12), two parts divided by a line + open hint drawer (S13) |
| Summary + trap | S14 | Rules earned as rows in a card (rule id chip 44 px + math); trap box with True/False chips; label in `--color-correct-text`; button "Next: <lesson>" |

### 6.2 Lesson player, desktop (1440 × 900) — D2, D4

- Lesson bar: padding 22 40, 1px bottom border; close, segmented bar (fills the width), counter "n / 14" 14/600 muted.
- Body: padding 72 120 32, gap 72. Text column 440 px: label, title 44/48, prompt 20/30, Try box. Stage column fills the rest: the widget is drawn larger (number line about 1.8× the mobile size; proof list and tray about 1.25×).
- Action bar: padding 20 120 28, 1px top border; caption left; primary button 240 px right. The feedback sheet becomes a panel above the action bar, aligned with the stage column.
- Every screen kind uses this frame on desktop.

### 6.3 App screens — H01–H03 (mobile), DH1–DH3 (desktop)

Mobile: content padding 24 24 110, gap 20; header (label mono primary, title Bricolage 32/36, optional subtitle 16/24 soft); tab bar fixed at the bottom. Desktop: sidebar + main column (padding 48 64, gap 28; title 40/44).

| Screen | Mobile | Desktop |
| --- | --- | --- |
| Home | Header "Your course"; Continue card; chapter head (mono label + "n of 8 done"); lesson list card | Left: chapter lesson list (all lessons of the chapter); right column 380: Continue card + "Later chapters" card (locked rows) |
| Progress | Header; 2 × 2 stat tiles; This week card (7 bars, 24 px wide, radius 6 6 2 2, `--color-progress`, today `--color-primary-bright` and bold day label); Needs practice card (problem + meta + "Practice" pill `--tint-primary`); By chapter card (name, "n of m lessons", 6 px track) | Two equal columns: left = stat tiles + By chapter; right = This week + Needs practice |
| Rule book | Header with "n of 66 rules earned…" subtitle; filter chips (scroll sideways); one column of rule list cards | Filter chips; three-column grid of rule list cards (equal height, gap 16) |

### 6.4 Screens without a frame

- **Coverage** (`/coverage`): app screen frame like Progress. One section card per chapter section; rows like lesson rows: topic 16/22 600, "where" 14 muted, status badge (Not started = surface, In progress = `--tint-primary`, Covered = `--tint-progress` with `--color-progress-text`, Later in Lang = surface + note). Chapter total in the head row.
- **Settings** (`/settings`): app screen frame. Section cards: "Backup" (Back up progress, Restore from backup), "Lessons" (Unlock all), "Danger zone" (Reset progress, red text button with confirmation), "About" (version, link to `/design-system`).
- **Practice bank overview** (`/practice/:id`): app screen frame without navigation; problem list as lesson rows with status badges (Not tried, Correct, Not yet) and STRETCH label; "Practice again" primary button.

## 7. Motion

| Event | Motion |
| --- | --- |
| Hop on number line | Arc draws, ring moves one unit: 240 ms per unit, ease-out. Step number appears with each hop. |
| Feedback sheet | Slides up 180 ms ease-out. Never shakes the screen. |
| Equation change | Terms move to their new place (layout animation), 240 ms. |
| Proof line unlock | Next line fades from 35% to 100%, 180 ms. |
| Balance | Beam tilts to max 8°, spring (stiffness 200, damping 20). |
| Reduced motion | All of the above become a 120 ms fade. |

No confetti. Show the move, not a celebration.
