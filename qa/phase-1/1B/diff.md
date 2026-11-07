# Step 1B: differences between the app and the FigCraft frames

Screenshots: `qa/phase-1/1B/` (`home`, `progress`, `rules`, `coverage`, `settings`, `practice-overview`, `practice-problem`, `lesson-placeholder`; each at 390 and 1440 px).
Home, Progress and Rule book are seeded with the sample state of the frames (lessons 1.1–1.2 done, 1.3 at screen 4, 11 rules, bank 1.2 10 of 12, 46 min). The seed is in `e2e/qa-1b.spec.ts`.
Method: FigCraft screenshot of each frame next to the Playwright screenshot. I compared layout, order, type style and colour by eye. I did not measure every value with `get_node` in this step. Differences of 1–2 px are not listed.

| Frame | Area | Difference | Status |
| --- | --- | --- | --- |
| H01, DH1 | Locked and unbuilt lessons | The frame shows a lock icon and "§3 · 12 min". The app shows "Coming in phase 1" in the meta line (step 7 of the prompt, FR-02) and no lock icon, because the lesson file does not exist. Lessons 1.4–1.8 get a lock icon again when their files exist. | Accepted (spec) |
| H01 | Continue card bar | Frame bar is about 30% full. App: screens done ÷ screens of the lesson. The sample 1.3 has no file, so 3 of 14 (the sample total) gives 21%. | Accepted (sample data) |
| H01, DH1 | Lesson titles | Titles come from the lesson headings in `lesson-design.md` ("Undo moves: add minus numbers", "Square root of 2 is not a fraction"). They match the frames. The course-map table uses shorter titles. | Matches |
| DH1 | Later chapters card | Frame text: "opens after Chapter 1". App: "coming in phase n" while a chapter has no lesson files (FR-45), and "opens after Chapter n−1" once files exist. | Accepted (spec) |
| H02, DH2 | Needs practice | Prompts render math with KaTeX in STIX Two Text ("6 − x = 9"). The frame shows plain text. | Accepted |
| H02, DH2 | Settings link | The frame has no link to Settings. FR-07 asks for one at the end of Progress. The app adds a link row. | Accepted (FR-07) |
| H02 | This week | Bars use the real Monday–Sunday week with today in blue. The frame sample has today = Saturday. Bar heights scale to the largest day (minimum 60 min). | Matches |
| H03, DH3 | Rule card N2 | The frame shows only "a + (−a) = 0". `rules.json` has the full statement, which wraps to two lines on desktop. Content wins. | Accepted (content) |
| H03, DH3 | Everything else | Header label "RULE BOOK", title "Your rules", subtitle, chips with counts, id chips, status badges, "Lesson 1.2 · Ch 1 §1". | Matches |
| — | Coverage, Settings, Practice overview | No frame. Built from DESIGN-SYSTEM §6.4 with the card and row styles of H02. | n/a |
| S11–S13 | Lesson and practice player | Layout follows DESIGN-SYSTEM §6.1 and §6.2. The lesson widgets are placeholders until step 1C, so the stage shows a dashed box with the widget name. Compared in 1C. | Pending 1C |
| S12 | Not-quite sheet | Sheet uses the 1A component (with icon, NFR-03). "Try again" is the blue primary button, "Show me why" the blue outline (DECISIONS #9). | Matches decision |
| S13 | Hint drawer position | The drawer floats above the action area (mobile) or above the stage column (desktop). Frame position checked in 1C with the real widgets. | Pending 1C |

## Notes

- First-load JavaScript: 166 KB gzip (limit 300 KB). KaTeX is not lazy-loaded yet; the budget holds.
- Learner-facing strings that are not in `content/` (UI text): "Not quite." (sheet title), "Check each step again. You can open a hint." (bank problems without a matched mistake), "Show solution", "I got it", "Not yet", "Try a similar one", "Now try this one." (twin label), "Enter a number, for example 3, −3 or 1/2.". They are interface text, not lesson text. Tell me if they should move to a UI-strings file.
- The number line, balance and thermometer screens take a typed answer in the placeholder, so every lesson 1.2 screen with an answer can be played. Proof screens are Continue-only until 1C.
