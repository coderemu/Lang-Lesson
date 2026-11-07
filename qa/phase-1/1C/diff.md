# Step 1C: differences between the app and the FigCraft frames

Screenshots: `qa/phase-1/1C/` (`S01`–`S14` at 390 × 844 in the state of the frame; `D2` and `D4` at 1440 × 900). They are made by `e2e/qa-1c.spec.ts`.
Method: FigCraft screenshots of S01–S10 and S11–S12 next to the app screenshots, and `get_node` readings of S01, S02, S03, S07 and S10 for the geometry (number line 342 × 120, tick x = 21 + 30·i, axis y 70, ring 24 px, thermometer tube 24 × 236, balance beam 280 × 6, proof line math 19/26, chips). S04, S05, S06, S09, S13, S14 and the desktop frames were compared by eye only. Differences of 1–2 px are not listed.

| Frame | Area | Difference | Status |
| --- | --- | --- | --- |
| S01, S03, S06 | Focus ring | After keyboard use the number line shows a 2 px blue focus ring (WCAG 2.2). The frames show none. | Accepted (a11y) |
| S01 | Check button | The frame shows Check enabled before the ring moves. FR-14 says Check stays disabled until there is an answer. | Accepted (FR-14) |
| S01 | Drag hint | The dashed arc next to the ring shows only before the first move. | Matches |
| S02 | Stage | No grey stage, as in the frame. The guess ring starts at 0 and the stem and "your guess" label follow it. "now" and "your guess" are widget labels, not lesson text. | Matches |
| S03 | Try box position | Mobile: under the stage (frame order). Desktop: in the text column (D2). The Hint chip below the stage has no counterpart in S03; lesson 1.2.03 has hints in the JSON. | Accepted (content) |
| S03 | Hops | Arcs 16 px high with step numbers 5 4 3 2 1 above, start dot 14 px, live equation with the result in orange. The ring is free in −5…5 (not locked to the hop direction), so the "stopped at 2" mistake can be reached. | Matches |
| S04 | Compare | Two paths with blue arcs, 8 in bold, then the question and two chips side by side. Path labels use STIX 16; the frame uses Inter 14. | Accepted |
| S05 | Rule card | The JSON lists N1 and N2; the app shows both cards (the frame shows only N2). The picture is on the last card. The caption "a and −a are mirror images…" in the frame is not in the lesson JSON, so it is not shown. The statement size is 28 px. | Accepted (content) |
| S05 | WORDS MATTER note | Amber tint, below the cards (frame order). | Matches |
| S06 | Mirror readout | The frame text "Two mirror moves across 0" is not in the JSON and is not shown. Both −4 and 4 are bold. | Accepted (content) |
| S07–S09 | Proof stepper | Lines, "given", pink rule chips, grey step chips, orange dashed "why?" slot, 45% locked lines with empty dashed slots, tray of white chips. The frames show different proof texts; the app uses lesson 1.2 JSON. The wrong chip is red inside its slot. | Matches |
| S09 | Wrong-reason sheet | Amber sheet with a "Not N4." title and the reply from `wrongReasonReplies`; one "Try again" button. The page is taller than the frame (math wraps to two lines), so the tray is partly under the sheet. | Accepted |
| S10 | Balance | x block, cubes in rows, hangers as triangles, pan labels "x + 3" and "5" with italic x, readout "Level: both pans weigh the same". The frame shows Check enabled (see S01). | Matches |
| S11 | Correct sheet | Teal sheet with the icon (NFR-03) and a blue Continue (DECISIONS #9). | Matches decision |
| S12 | Not-quite sheet | The frame title is "Not quite. Almost correct."; the app title is "Not quite." and the body is the mistake reply from the JSON. One "Try again" button on the first wrong answer; "Show me why" appears after the second (FR-19). | Accepted (content, FR-19) |
| S13 | Two parts | Parts divided by a line; the second slot wraps below its expression on 390 px because the expression is wide. Hint drawer floats above the action area. | Accepted |
| S14 | Summary | Rule id chips (44 px column), rule statements in math, trap box with True and False, button "Next: Minus times minus". The N2 statement wraps because the JSON statement is long. | Accepted (content) |
| D2, D4 | Desktop | Text column 440 px with the Try box under the prompt; widget column to the right, numbers and proof about 1.3× larger; action bar with a 240 px button. Frame D2/D4 were compared by eye. | Matches |

## Notes

- Mistake "8" on screen 1.2.03 (3 + 5) is outside the number line (−5 to 5), so no control can produce it. The checker handles it (unit test) and the e2e test lists it as the only unreachable mistake.
- First-load JavaScript is now 225 KB gzip (limit 300 KB). It was 166 KB in 1B (the `motion` library and the widgets are new). Step 1E checks NFR-06 again.
- Focus: the first control of each screen gets focus; the feedback sheet button gets focus after Check, so Enter continues. Keyboard-only play-through of all 14 screens passes.
- Reduced motion: the e2e test checks that the sheet animation is 120 ms or less and that the five hop arcs show.
