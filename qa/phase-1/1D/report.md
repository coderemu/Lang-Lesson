# Step 1D: Chapter 1 content report

`validate:content` passes with 8 lessons, 8 banks and 57 coverage rows (all 57 Chapter 1 rows of `coverage-map.md`, same order, same sections). Render tests open every lesson screen and every bank problem. The Playwright spec `e2e/chapter-1.spec.ts` plays lessons 1.1 and 1.3–1.8 from the first to the last screen with correct answers (lesson 1.2 has its own spec). `e2e/banks-smoke.spec.ts` opens every bank problem. Full bank play-throughs and the mistake-reply tests for the new lessons are step 1E.

## Table

| Lesson | Screens | Mistake replies (incl. twins, wrong-reason replies) | Bank | Problems (stretch) | Self-check problems | Coverage rows pointing to the lesson | Coverage rows pointing to the bank |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 Numbers on a line | 10 | 13 | 1.1 | 6 (0) | 2 | 2 | 3 |
| 1.2 Undo moves | 14 | 28 | 1.2 | 12 (0) | 7 | 9 | 3 |
| 1.3 Minus times minus | 15 | 57 | 1.3 | 10 (0) | 8 | 3 | 3 |
| 1.4 Powers and three famous formulas | 14 | 47 | 1.4 | 11 (0) | 9 | 6 | 4 |
| 1.5 Even, odd and divisibility | 13 | 40 | 1.5 | 13 (1) | 7 | 4 | 4 |
| 1.6 Fractions | 17 | 31 | 1.6 | 13 (1) | 2 | 11 | 6 |
| 1.7 Square root of 2 is not a fraction | 9 | 19 | 1.7 | 8 (0) | 8 | 4 | 2 |
| 1.8 Division and inverses | 15 | 36 | 1.8 | 12 (0) | 3 | 11 | 4 |

Totals: 107 screens, 73 bank problems (2 stretch), 57 coverage rows.

## Where the content differs from the design doc or goes beyond one step per screen

The prompt says "one screen per step". I split a step into several screens where the answers have different types (CONTENT-GUIDE §1.1) or where a step holds two proofs.

- **1.1** (10 screens): practice is five PRACTICE screens (place −4, place 0, place 3, farther from 0, cave and hill). The thermometer step uses the guess widget (start 3°, change −8°). The timeline step uses a number line where one step is 100 years (my choice).
- **1.3** (15 screens): the hook is a screen with no answer, because the doc says "do not give the answer yet". N10 gets its own PROVE IT screen after the result (−1)(−1) = 1. Practice is three screens (two products, the expansion as a choice, and a justify-each-step proof).
- **1.4** (14 screens): the three formulas are three PROVE IT screens. Practice is five screens.
- **1.5** (13 screens): step 5 is two PROVE IT screens (even + odd as Lang does it, then odd + odd). Practice is three screens. The congruence stretch is left out (DECISIONS #7).
- **1.6** (17 screens): addition has two explore screens (same denominator, then a common denominator). The multiplication and powers step is a separate NAME IT screen. Practice is four screens. The half-life step uses the doubling strip in halving mode, not fraction strips.
- **1.7** (9 screens): the zoom number line is Phase 3, so the decimal search is a choice screen and a number-input screen. The √3 proof stretch is left out (DECISIONS #7).
- **1.8** (15 screens): step 4 is a NAME IT screen (inverse) and a PROVE IT screen (uniqueness). The balance step is a number-input, because the balance widget has integer cubes only. The last button says "Finish chapter 1" and the lesson has no `next` (lesson 2.1 does not exist in Phase 1).

## Fidelity to Lang's proofs

I checked each proof against `docs/source/lang-ch1-4.pdf` (text read through macOS PDFKit; nothing copied).

| Screen | Result |
| --- | --- |
| 1.3.05 (b + c)a = ba + ca | Same steps as Lang. |
| 1.3.06 0a = 0 | Same idea and order. Lang's last step ("the left side is simply 0a") is two lines here (N2, N1). Lang uses associativity of addition there without naming it; the screen does the same. |
| 1.3.07 N7, 1.3.08 N8 | Same as Lang. |
| 1.3.09 N9, 1.3.11 N10 | Lang leaves them to the reader. My proofs follow the bank hints (N8, N9, N4). |
| 1.3.10 (−1)(−1) = 1 | Same as Lang (N8, N6, N4). |
| 1.3.14 (2a)(−3b)(5c) = −30abc | Lang only shows the result for a similar product. The reasons here (commutativity, N9, N8, multiply) are mine. |
| 1.4.06–1.4.08 formulas | Same as Lang. I added the step "write the square as a product" and, in the first two, "add the equal terms". |
| 1.5.05 even + odd | Same as Lang, with associativity and distributivity as the reasons. |
| 1.5.06 odd + odd | Lang leaves this to the reader. The proof is mine and uses "commutativity" for regrouping (it also needs associativity). |
| 1.5.07 odd square | Same as Lang. I use the formula from lesson 1.4 for (2n + 1)². |
| 1.6.07 Theorem 3 | Same as Lang (greatest common divisor, cancel, contradiction). |
| 1.7.06 Theorem 4 | Same as Lang. |
| 1.8.05, 1.8.06 | Same as Lang. |
| 1.8.09 cross-multiplication | Only the first direction (a/b = c/d gives ad = bc). Lang also proves the converse. |

## Places where I was not sure about the content

1. **Self-check for algebraic answers.** Bank problems with algebraic answers are self-check (your decision). That is 8 problems of bank 1.3, 9 of 1.4, and the expressions of 1.5–1.8 proofs. In the lessons the same answers are `choice` screens.
2. **"Lowest form" in bank 1.6 problem 4.** A number input cannot tell 3/4 from 6/8, so this problem is self-check.
3. **Bank 1.5 problem 4** says "odd × odd is odd". That is Lang's exercise 7, which the bank does not contain. The solution proves it in one line only through the reference.
4. **Bank 1.6 problem 12** ("one fifth die") is solved as 4/5 survive each period: 10,000 · (4/5)³ = 5,120, the same as the doc.
5. **Mistake replies from the doc tables.** All are copied word for word: 1.1 (two), 1.3 (two), 1.4 (three), 1.5 (two: the "same n" reply is on a wrong tray chip), 1.6 (two), 1.7 (two: the "stops at m is even" reply is on a wrong tray chip), 1.8 (two: the "divides by x" reply is the True option of the trap).
6. **Mistake "8" on lesson 1.2 screen 3** (found in 1C) cannot be produced with the number line. No change.
7. **Twin problems** with word text (cave and hill, walk and cycle, the power of 2 of 40, √5) carry their numbers in the expression line, because a twin has no prompt of its own.
8. **Screen count.** Lessons 1.3 (15), 1.6 (17) and 1.8 (15) are over the "10–14 screens" guideline of the design doc, because of the splits above.
9. **Chip names.** The two distributivity rules are named "Distributivity, left" and "Distributivity, right" in the tray, so two chips never have the same name.
10. **UI strings** that are not in `content/` (for example "Not quite.", "Show solution", "Turn the rectangle", "Cut each piece in two") are interface text. Tell me if they should move to a strings file.
