# Decisions from the kickoff (7 November 2026)

These answers settle the open questions of the kickoff. If one conflicts with another file, this file wins.

1. `validate:content` checks all nine rules of SRD §8 (the 1B prompt says eight by mistake).
2. `.claude/settings.json` stays as it is. `run_command` is not allowed in advance, because it could also run write commands. Approve each read-only call (`variable.list`, `node.find`, `node.get`) when asked.
3. The book is `docs/source/lang-ch1-4.pdf` (renamed). Git ignores it.
4. KaTeX math renders in STIX Two Text (override the KaTeX font stack), so it matches the frames.
5. KaTeX loads lazily. The first load stays under 300 KB gzip (NFR-06).
6. The stale "Paper" and "M1–M6" mentions and "six widgets" in `lesson-design.md` are not edited. FigCraft frames S01–S14 and the eight widgets of the SRD are the truth.
7. Dark mode: not before Phase 4. Congruence stretch (1.5) and the √3 proof (1.7): left out. No mixed review lessons: the course stays at 19 lessons. Proofs: "tap the reason" only.
8. If a Chapter 1 bank problem needs an `expression` answer, stop and ask (the schema marks it Phase 3).
9. Feedback sheets follow the frames (S11, S12): the Continue button in the correct sheet is the blue primary button, and "Show me why" is a blue-outline button. The ink Continue variant stays in the button set but the lesson player does not use it in sheets. The sheet icon stays (NFR-03), although the frames have none.
