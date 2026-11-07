# Prompt 00 · Kickoff (no code)

Before you paste this: open FigCraft with `open -a FigCraft --args --control 7979`, open `Basic Mathematics Lang.figcraft`, and check that `/mcp` in Claude Code shows `figcraft-app` as connected (see `design/FIGCRAFT.md` §1).

Paste this into Claude Code in plan mode.

---

You are starting a new project: Lang Lessons. Read these files in this order:

1. `CLAUDE.md`
2. `docs/SRD.md`
3. `design/DESIGN-SYSTEM.md`, `design/tokens.css`, `design/FIGCRAFT.md`, `design/figcraft-map.json`
4. `content/schema.ts`, `content/rules.json`, `content/lessons/lesson-1.2.json`, `content/practice/bank-1.2.json`, `content/coverage.json`
5. `docs/CONTENT-GUIDE.md`, `docs/DEPLOY.md`
6. `docs/lesson-design/lesson-design.md`, `coverage-map.md`, `practice-banks.md`

Do not write code yet.

Check the kit first:

- If one of the files in `docs/lesson-design/` is missing, stop and tell me which.
- Check the FigCraft connection: run `inspect_document` with depth 1. Every frame of `figcraft-map.json` must exist on page "Screens" with the same id and name. Take a `screenshot` of H01, S03 and D4 to confirm you can see them. If the server is not connected, stop and tell me.
- Run `variable.list` and compare the 27 colours with `design/tokens.css`. Report every difference.
- Check that `lesson-1.2.json`, `bank-1.2.json` and `coverage.json` agree with `schema.ts`, and that each `designRef` in the lesson exists in `figcraft-map.json`.

Then give me:

1. A summary of the product in five lines.
2. The plan for Phase 1 (Chapter 1), split into the six steps 1A–1F of `prompts/phase-1-chapter-1/`. For each step: files you will create, libraries you will add, tests you will write, the FigCraft frames you will compare with, and the risks.
3. A list of questions where the SRD, the design system and the frames are not clear or disagree. Do not guess.

Wait for my approval before you start step 1A.
