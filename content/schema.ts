/**
 * Content schema for Lang Lessons.
 * All learner-facing text lives in content/*.json and must agree with these types.
 *
 * Math strings are TeX for KaTeX. Use the macros \va{}, \vb{}, \vc{} for the
 * coloured variables a, b, c. Use "-" in TeX; KaTeX renders a true minus.
 * Plain text strings may contain inline math between $...$.
 */

/* ───────────── Rules ───────────── */

export type RuleStatus = "assumed" | "proved" | "left-to-reader" | "shown";

export interface Rule {
  id: string;                 // "N2", "comm-add", "thm-4", "IN-3"
  label: string;              // "RULE N2 · ADDITIVE INVERSE"
  name: string;               // "Additive inverse"
  statement: string;          // TeX
  spoken?: string;            // "a plus minus a equals zero"
  status: RuleStatus;
  lesson: string;             // lesson where the learner earns it, "1.2"
  book: string;               // "Ch 1 §1"
  example?: string;           // TeX
}

/* ───────────── Lessons ───────────── */

export type ScreenKind =
  | "recall" | "hook" | "explore" | "name-it" | "prove-it" | "practice" | "trap-summary";

export interface Lesson {
  id: string;                 // "1.2"
  title: string;
  book: { chapter: 1 | 2 | 3 | 4; sections: string };   // sections: "§1–2"
  minutes: number;
  pilot?: boolean;
  goal: string;
  needs: string[];            // lesson ids
  rulesEarned: string[];      // rule ids saved at the end
  generalHint: string;        // used when a wrong answer matches no mistake
  next?: { id: string; title: string };
  screens: Screen[];
}

export interface Screen {
  id: string;                 // "1.2.03" (lesson.screen)
  kind: ScreenKind;
  label: string;              // "EXPLORE", "PRACTICE · 2 OF 4"
  title: string;
  prompt: string;
  designRef?: string;         // FigCraft frame names, e.g. "S03, D2" (see design/figcraft-map.json)
  interaction: Interaction;
  tryTask?: string;           // shown in the Try box
  note?: { label: string; text: string };   // "WORDS MATTER"
  hints?: [string] | [string, string];      // at most two
  showMe?: WorkedSolution;
  twin?: Interaction;         // after "Show me why"
  caption?: string;           // small line above the button
  buttonLabel?: string;       // default "Check" / "Continue"
}

export interface WorkedSolution {
  steps: { math?: string; text: string }[];
}

/* Answers and feedback */

export interface Mistake<T = number | string> {
  match: T;
  reply: string;
}

export interface Feedback {
  correctTitle: string;       // "Yes, −2."
  correctWhy: string;         // one line of why
}

export interface NumberAnswer extends Feedback {
  value: number;
  mistakes?: Mistake<number>[];
}

/* Interactions (discriminated union on "type") */

export type Interaction =
  | NoInteraction
  | RuleCardInteraction
  | NumberLineInteraction
  | ThermometerInteraction
  | NumberInputInteraction
  | MultiNumberInputInteraction
  | ChoiceInteraction
  | ProofInteraction
  | BalanceInteraction
  | AreaModelInteraction
  | SquareTilesInteraction
  | FractionStripsInteraction
  | EliminationInteraction
  | TextInputInteraction
  | EITableInteraction
  | TrapSummaryInteraction;

export interface NoInteraction { type: "none" }

export interface RuleCardInteraction {
  type: "rule-card";
  ruleIds: string[];
  picture?: "mirror" | "hops" | "area" | "tiles" | "strips" | "balance";
}

export interface NumberLineSpec {
  min: number;
  max: number;
  step?: number;              // default 1
  start?: number;             // ink dot
  add?: number;               // for mode "hops"
  ringStart?: number;         // initial ring position
  paths?: { start: number; adds: number[] }[];  // mode "compare"
  mirrorOf?: number;          // mode "mirror"
}

export interface NumberLineInteraction {
  type: "number-line";
  mode: "place" | "hops" | "compare" | "mirror" | "zoom" | "interval";
  // zoom: widget { min, max, target, power } (find target by digits); interval: widget { min, max, intervals? }
  widget: NumberLineSpec;
  equation?: string;          // TeX shown above the line; "?" replaced live
  answer?: NumberAnswer;      // absent for pure explore screens
  followUp?: ChoiceInteraction | NumberInputInteraction | TextInputInteraction;
}

export interface ThermometerInteraction {
  type: "thermometer";
  mode: "guess";
  widget: { min: number; max: number; start: number; change: number };
  result: number;
  guessFeedback: { sameSide: Feedback; otherSide: Feedback };  // compared with the sign of result
}

export interface NumberInputInteraction {
  type: "number-input";
  expression: string;         // TeX before the slot, "3 + (-5) ="
  answer: NumberAnswer;
}

export interface MultiNumberInputInteraction {
  type: "multi-number-input";
  parts: { prompt?: string; expression: string; answer: NumberAnswer }[];
}

export interface ChoiceInteraction {
  type: "choice";
  question?: string;
  options: { id: string; label: string; reply?: string }[];   // reply for wrong options
  correct: string;            // option id
  feedback: Feedback;
}

export interface ProofLine {
  math: string;               // TeX
  reason: string | null;      // rule id or a step id from `steps`; null = given/start
  reasonLabel?: string;       // text on the chip when it is not a rule, e.g. "add −a to both sides"
}

export interface ProofInteraction {
  type: "proof";
  goal: string;               // TeX of the statement to prove
  lines: ProofLine[];
  tray: string[];             // rule ids and step ids offered as chips
  steps?: { id: string; label: string }[];   // non-rule reasons, e.g. { id: "add-both", label: "add −a to both sides" }
  wrongReasonReplies?: Record<string, string>;   // reply when that chip is chosen wrongly
  feedback: Feedback;
}

export interface BalanceInteraction {
  type: "balance";
  mode: "solve" | "system";
  widget: { left: { x: number; units: number }; right: { x: number; units: number } };
  answer: NumberAnswer;       // value of x
}

export interface AreaModelInteraction {
  type: "area-model";
  mode: "distribute" | "width-2" | "doubling-strip";
  widget: Record<string, number | string>;
  answer?: NumberAnswer;
  followUp?: ChoiceInteraction | NumberInputInteraction | TextInputInteraction;
}

export interface SquareTilesInteraction {
  type: "square-tiles";
  mode: "expand" | "complete" | "compare";
  widget: Record<string, number | string>;
  answer?: NumberAnswer;
  followUp?: ChoiceInteraction | NumberInputInteraction | TextInputInteraction;
}

export interface FractionStripsInteraction {
  type: "fraction-strips";
  mode: "cut" | "add" | "invert" | "mediant";
  widget: Record<string, number | string | number[]>;
  answer?: NumberAnswer;
  followUp?: ChoiceInteraction | NumberInputInteraction | TextInputInteraction;
}

export interface EliminationInteraction {
  type: "elimination";
  mode: "two-unknowns" | "three-unknowns" | "general";
  equations: string[];        // TeX rows
  balance?: boolean;          // show the linked balances (Balance mode "system")
  answer: { values: Record<string, number> | "none" | "many" } & Feedback;
  mistakes?: Mistake<string>[];
}

/** Typed algebra answer (Phase 3). `value` for expression and interval, `values` for set. */
export interface TextAnswer extends Feedback {
  value?: string;             // mathjs text, e.g. "sqrt(5)+2", "x < 3 or x > 7"
  values?: string[];          // set: each a mathjs text
  variables?: string[];       // expression: the letters in the answer
  mistakes?: Mistake<string>[];   // matched with the same checker
  noRootDenominator?: boolean;    // expression: equal values are not enough if a root stays in a denominator
  formReply?: string;             // reply for that case
}

export interface TextInputInteraction {
  type: "text-input";
  checker: "expression" | "set" | "interval";
  expression?: string;        // TeX before the slot, "x ="
  answer: TextAnswer;
}

/** E/I tables (lesson 3.1). Cells hold "E" or "I"; the learner fills them. */
export interface EITableInteraction {
  type: "ei-table";
  feedback: Feedback;
  wrongReply?: string;        // shown when a cell is wrong
}

export interface TrapSummaryInteraction {
  type: "trap-summary";
  trap: ChoiceInteraction;    // true/false on the usual mistake
  summary: string[];          // rule ids shown as rows
}

/* ───────────── Practice banks ───────────── */

export type PracticeAnswer =
  | { type: "number"; value: number; mistakes?: Mistake<number>[] }
  | { type: "numbers"; values: number[]; ordered: boolean }        // several separate results
  | { type: "pair"; values: { x: number; y: number } }
  | { type: "triple"; values: { x: number; y: number; z: number } }
  | { type: "expression"; value: string; variables: string[]; noRootDenominator?: boolean; formReply?: string }  // checked by equivalence
  | { type: "set"; values: string[] }                              // solutions as mathjs text, "1+sqrt(5)"
  | { type: "interval"; value: string }                            // e.g. "(-2, 1/2)", "(-inf,3) U (7,inf)"
  | { type: "choice"; options: string[]; correct: number }
  | { type: "none" }                                               // "Is there a solution?" Chips: yes / no solution
  | { type: "self-check" };                                        // proofs and drawings

export interface PracticeProblem {
  id: string;                 // "b1.2.06"
  n: number;                  // number in the bank
  prompt: string;             // text with inline $math$
  answer: PracticeAnswer;
  answerText: string;         // the answer as in practice-banks.md, shown after Check
  solution?: string[];        // worked steps
  langType: string;           // "§2 ex. 14–21"
  stretch?: boolean;
  hints?: [string] | [string, string];
  verify?: string;            // optional mathjs expression that must equal the answer, for validate:content
}

export interface PracticeBank {
  lesson: string;             // "1.2"
  title: string;              // "Bank 1.2"
  note?: string;              // e.g. "Lang §1 has no exercises; these follow the text"
  problems: PracticeProblem[];
}

/* ───────────── Coverage map ───────────── */

export interface CoverageRow {
  id: string;                 // "c1.2.03"
  chapter: 1 | 2 | 3 | 4;
  section: string;            // "§2", "§1, ex. 9–11", "" for chapter 4
  kind: "topic" | "exercises" | "skip";
  topic: string;              // Lang's topic or exercise group, in our words
  lessonScreens: string[];    // screen ids, e.g. ["1.2.06", "1.2.07"]
  bankProblems: string[];     // problem ids, or ["bank:1.2"] for the whole bank
  note?: string;              // "Assumed", "Lang refers to a later chapter"
}

export interface Coverage {
  _note?: string;             // free text for authors; the app ignores it
  rows: CoverageRow[];
}
