# Step 1A: differences between the app and the FigCraft frames

Screenshots: `qa/phase-1/1A/` (`home`, `progress`, `rules`, `design-system` at 390 and 1440 px; `crop-*` are sections of `/design-system`). The Home, Progress and Rule book routes hold only their header in 1A. Step 1B fills them.

| Frame | Area | Difference | Status |
| --- | --- | --- | --- |
| H01 (mobile) | Tab bar | Same: 84 px high, padding 10 8 22, icon 24 + label 14/18 600, active primary, 1 px top border. Icons are my own 2 px stroke set (frame icons not extracted). | Fixed / accepted |
| H01–H03 | Header | Same: label mono 14, title Bricolage 32/36, subtitle 16/24, gap 6, content padding 24. | Matches |
| DH1 (desktop) | Sidebar | Same: 248 px, surface fill, 1 px right border, brand, three items 44 px high, active tint. | Matches |
| DH1 | Main padding | 48 64, gap 28, title 40/44. | Matches |
| S12 | Not-quite sheet | The frame has no icon. DESIGN-SYSTEM §4 and NFR-03 ask for an icon, so the app shows the "!" badge. | Not fixed on purpose (NFR-03) |
| S12 | Sheet buttons | Frame: "Show me why" is a blue outline, "Try again" is a blue fill, equal width. DESIGN-SYSTEM says the secondary button has an ink border. The app follows the frame inside the sheet. | Fixed |
| S11 | Correct sheet | Frame has no icon and a blue Continue button (DESIGN-SYSTEM: ink). The app keeps the icon (NFR-03); the demo uses the blue button. The ink "Continue" variant stays in the button set. Decide in 1B which one the player uses. | Open question |
| S11, S12 | Number slot | Frame fills the slot with the tint in the correct and wrong states. | Fixed |
| S13 | Hint drawer | Frame label "HINT 1/1" looks like Inter caps, DESIGN-SYSTEM says mono. The app uses mono (the token spec). Frame shows "1/1" for a one-hint screen. | Not fixed (spec wins on font); 1/1 works |
| S13 | Drawer position | The drawer floats over the second slot and the action area. The component has the right look; its position comes from the lesson player (1B). | Pending 1B |
| S07–S09 | Reason chips and slots | Built to DESIGN-SYSTEM §4. Compared in 1C with the proof stepper. | Pending 1C |
| All | Math font | KaTeX renders in STIX Two Text (see `docs/DECISIONS.md`). Italic and spacing match the frames within 1–2 px. | Accepted |

## Notes

- First-load JavaScript is 151 KB gzip. KaTeX is not yet lazy-loaded; 1B moves it behind the lesson routes if the budget needs it.
- `dist/` holds KaTeX fonts in several formats (ttf, woff, woff2). Step 1F limits the precache to woff2.
- Fonts: only variable `wght` files of the latin sets and IBM Plex Mono 400 are loaded.
