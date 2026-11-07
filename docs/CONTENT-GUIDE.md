# Content guide: from the design doc to JSON

Each chapter phase converts three kinds of content into JSON. Follow the examples exactly:

| Kind | Source (Markdown) | Target (JSON) | Example to copy |
| --- | --- | --- | --- |
| Lesson | `docs/lesson-design/lesson-design.md`, section "### n.n …" | `content/lessons/lesson-n.n.json` | `content/lessons/lesson-1.2.json` |
| Practice bank | `docs/lesson-design/practice-banks.md`, section "### Bank n.n" | `content/practice/bank-n.n.json` | `content/practice/bank-1.2.json` |
| Coverage rows | `docs/lesson-design/coverage-map.md`, the table of the chapter | rows in `content/coverage.json` | the starter rows in `content/coverage.json` |
| Rules | "Assumed or proved" table in `lesson-design.md` | `content/rules.json` (already complete) | — |

## 1. Lessons

### 1.1 Screens

- Each numbered step of the outline is one screen, in the same order. Do not merge, split, add or remove steps.
- Screen ID: `<lesson>.<two-digit step>`, for example `1.6.04`.
- `kind` from the first word of the step: Recall → `recall`, Hook → `hook`, Explore → `explore`, Name it → `name-it`, Prove it → `prove-it`, Use it / Practice → `practice`, Trap → `trap-summary`.
- `label`: the kind in capitals (RECALL, PUZZLE for hooks, EXPLORE, NAME IT, PROVE IT). Practice screens: "PRACTICE · n OF m". The last screen: "LESSON n.n COMPLETE".
- `title`: 2–6 words that name the idea of the screen.
- `prompt`: the step text, in STE (§4). Put math between `$…$`.
- If a step has two or more problems ("Practice: A; B; C"), make one `multi-number-input` screen with one part per problem. If the problems need different answer types, split the step into consecutive screens with the same label and note this in the commit.

### 1.2 Interactions

Choose the interaction from the widget named in the step:

| Step says | Interaction |
| --- | --- |
| number line, hops, place | `number-line` with the mode that fits |
| thermometer | `thermometer` |
| rule card, Name it with a rule | `rule-card` (rule IDs from `rules.json`) |
| Prove it | `proof` (§1.3) |
| balance | `balance` |
| area model, doubling strip, width 2 | `area-model` |
| square tiles | `square-tiles` |
| fraction strips | `fraction-strips` |
| a calculation with one number answer | `number-input` |
| a question with options, True/False | `choice` |
| two equations / three unknowns (Ch 2) | `elimination` |
| Trap … Save … | `trap-summary` |

An explore or name-it screen that only shows something still needs one small task: add a `followUp` question that checks the idea. Take the question from the step text where possible.

### 1.3 Proofs

- Use Lang's proof, line by line. Open `docs/source/lang-ch1-4.pdf` and follow his steps and order. Do not copy his sentences.
- The first line has `reason: null` (given or start).
- Each later line has one reason: a rule ID or a step ID (`steps`) for moves that are not rules ("add −a to both sides").
- The tray holds the correct reasons plus 1–3 earned rules that are wrong for every line.
- Give `wrongReasonReplies` for each tray chip: say what that rule does, then ask one question.

### 1.4 Answers, mistakes, hints

- Put the answer from the outline in `answer.value`. Recalculate it yourself. If your result differs from the outline, stop and report it.
- Mistakes: copy each row of the lesson's "Likely mistake | Reply" table to the screen it belongs to. Add 1–2 more likely mistakes per practice screen (sign error, wrong operation). Each reply: what is correct, the exact error, one question.
- Hints: at most two. Hint 1 points to the idea. Hint 2 gives the first step.
- `showMe` and `twin`: add both to each practice screen. The twin uses new numbers of the same type.
- `correctTitle`: "Yes, <answer>." `correctWhy`: one sentence of why.

### 1.5 Lesson fields

- `rulesEarned`: the rules of the lesson in the "Assumed or proved" table.
- `needs`: from the "Needs:" line.
- `minutes`: from the heading.
- `next`: the next lesson in the course map.

## 2. Practice banks

- One problem per table row, same order, same numbers. `id` = `b<lesson>.<two-digit n>`.
- `prompt`: the problem text in STE, math between `$…$`.
- `answerText`: the "Answer" cell, exactly.
- `answer.type`:
  - one number → `number`;
  - several separate numbers in one problem → `numbers`;
  - (x, y) → `pair`; (x, y, z) → `triple`;
  - "x = a or x = b", "±" → `set`;
  - an inequality answer → `interval`;
  - an algebraic expression → `expression`;
  - "No solution" or "No real solution" → `none`;
  - Prove / Show / Justify / Draw → `self-check`.
- `solution`: 1–4 short steps. For `self-check`, the steps are the model proof.
- `langType`: the "Lang type" cell, exactly.
- Mark rows that start with "Stretch:" with `"stretch": true` and remove the word from the prompt.
- Add `verify` (a mathjs expression) for each `number` answer, so `validate:content` can recompute it.

## 3. Coverage map

- One row per table row of the chapter, same order. `id` = `c<chapter>.<section number>.<two-digit row>`; use `0` as the section number for Chapter 4.
- `kind`: `exercises` if the topic starts with "Exercise"; `skip` for rows of the "Deliberate skips" table; else `topic`.
- "Where" column → `lessonScreens` ("L 1.2.6–1.2.8" → `["1.2.06","1.2.07","1.2.08"]`) and `bankProblems` ("Bank 1.2" → the IDs of the problems of that Lang type in the bank; if the row covers the whole bank, list all its problem IDs).
- "Note" column → `note`.
- After each lesson change, check that each row still points to the right screen. Screen numbers in the doc can be off by one where a lesson gained screens; follow the content of the step, not only the number.

## 4. Writing style (ASD-STE100)

- Steps: imperative, 20 words or fewer. Descriptions: 25 words or fewer.
- Conditions first: "If the pressure is low, …".
- No contractions, no idioms, present tense.
- One word, one meaning: use "minus a" for −a, "both sides" or "the two sides" for an equation, "hop" for one unit on the number line.
- Say what is correct before you name the error.

## 5. Fidelity to Lang

- Keep Lang's order inside a section, his rule names and his notation.
- Where Lang says a proof is left to the reader, make it a Prove it screen and give the status `left-to-reader`.
- Where Lang sends a topic to a later chapter, add one note line with that reference. Do not teach the topic.
- Never copy his sentences, examples or exercises. Use new numbers and new wording.
