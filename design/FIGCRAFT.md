# Design source: the FigCraft file

The approved screens are in a FigCraft file. Claude Code reads it through the FigCraft MCP server. There are no PNG reference images in this kit: look at the frames themselves.

- File: `/Users/emu/Documents/Learning/Lang Chapter Build/Basic Mathematics Lang.figcraft`
- Page: **Screens** (id 2). Do not use other pages (for example "Visual system" or "Screens V2") unless Emu says so.
- Variables: collection **Lang Visuals** (27 colours). They are the same values as `design/tokens.css`.
- Frame list, node ids, routes and lesson screens: `design/figcraft-map.json`.

## 1. Connect (one time, by Emu)

1. Start FigCraft with the control port and open the file:
   ```
   open -a FigCraft --args --control 7979
   ```
   Then open `Basic Mathematics Lang.figcraft` in FigCraft.
2. Add the server to Claude Code, in the project folder:
   ```
   claude mcp add figcraft-app -- /Users/emu/figcraft/target/release/figcraft-cli mcp --attach 7979
   ```
3. Start `claude` and type `/mcp`. The list must show `figcraft-app` as connected.

FigCraft must be open with the file in front during every session that compares screens. If a FigCraft tool fails, stop and ask Emu to open FigCraft. Do not continue without the design.

## 2. Rules

- **Read only.** Never change, save or move anything in the FigCraft file. `.claude/settings.json` blocks the tools that change the file. Do not try other ways to change it.
- **The frames are the target** for layout, spacing, type, colour and copy placement. `DESIGN-SYSTEM.md` gives the rules and the states that the frames do not show: icons, hover and focus, disabled, motion, keyboard. If a frame and `DESIGN-SYSTEM.md` disagree, follow the frame and report the difference.
- **Text comes from `content/`**, not from the frames. The frames show the same text, but the JSON is the source of truth. If they differ, report it. Do not change the JSON to match a frame.
- **Numbers on Home, Progress and Rule book frames are sample data** (2 of 19 lessons, 46 min, and so on). Compute the real values from the store.
- **The status bar (9:41, signal, battery) is part of the phone mockup.** Do not build it.
- Use raw hex values only in `tokens.css`. In the frames, a fill bound to a variable shows `boundVariables`; map it to the token with the same name (`color/primary` → `--color-primary`, `tint/hint` → `--tint-hint`).

## 3. Tools to use

| Need | Tool | Example |
| --- | --- | --- |
| See a frame | `screenshot` | `ids: [161]`, `scale: 2` |
| Exact sizes, padding, gaps, fonts, colours | `get_node` | `id: 161, depth: 4` (use `outline: true` first for the tree) |
| Find a frame by name | `run_command` with `node.find` | `{"command":"node.find","params":{"name":"S03"}}` |
| Check the variables | `run_command` with `variable.list` | compare with `tokens.css` |
| The whole page | `inspect_document` | `depth: 1` |

`run_command` is allowed only for the read commands `node.find`, `node.get` and `variable.list`.

## 4. How to compare a built screen with its frame

1. Find the frame for the route or screen in `design/figcraft-map.json` (the lesson JSON also has `designRef`, for example `"S03, D2"`).
2. Take a FigCraft `screenshot` of the frame at scale 1.
3. Take a Playwright screenshot of the app at the same viewport (390 × 844 or 1440 × 900) and in the same state (for example: Check pressed with the wrong answer for S12).
4. Read the frame with `get_node` for every value that looks different: padding, gap, font size, line height, colour variable, radius.
5. Write the result in the step's `diff.md`: frame, app screenshot path, each difference, and fixed or not fixed with the reason.

Small differences from font rendering (1–2 px) are acceptable. Differences in layout order, colour role, type style, radius or missing elements are not.
