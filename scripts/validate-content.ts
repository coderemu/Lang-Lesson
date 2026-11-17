/**
 * npm run validate:content
 * Checks lessons, banks, coverage and rules against content/schema.ts (SRD §8, nine rules).
 * zod schemas mirror schema.ts. mathjs is used only here, for `verify`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate } from "mathjs";
import { z } from "zod";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const CURRENT_PHASE = 3;

/* ───────── zod schemas (mirror content/schema.ts) ───────── */

const mistake = <T extends z.ZodTypeAny>(match: T) =>
  z.object({ match, reply: z.string().min(1) }).strict();
const feedback = { correctTitle: z.string().min(1), correctWhy: z.string().min(1) };
const numberAnswer = z
  .object({ value: z.number(), ...feedback, mistakes: z.array(mistake(z.number())).optional() })
  .strict();

const choice = z
  .object({
    type: z.literal("choice"),
    question: z.string().optional(),
    options: z
      .array(z.object({ id: z.string(), label: z.string(), reply: z.string().optional() }).strict())
      .min(2),
    correct: z.string(),
    feedback: z.object(feedback).strict(),
  })
  .strict();
const numberInput = z
  .object({ type: z.literal("number-input"), expression: z.string(), answer: numberAnswer })
  .strict();
const textAnswer = z
  .object({
    value: z.string().optional(),
    values: z.array(z.string()).optional(),
    variables: z.array(z.string()).optional(),
    ...feedback,
    mistakes: z.array(mistake(z.string())).optional(),
  })
  .strict();
const textInput = z
  .object({
    type: z.literal("text-input"),
    checker: z.enum(["expression", "set", "interval"]),
    expression: z.string().optional(),
    answer: textAnswer,
  })
  .strict();
const followUp = z.discriminatedUnion("type", [choice, numberInput, textInput]);
const widgetSpec = z.record(z.string(), z.unknown());

const interaction = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }).strict(),
  z
    .object({
      type: z.literal("rule-card"),
      ruleIds: z.array(z.string()).min(1),
      picture: z.enum(["mirror", "hops", "area", "tiles", "strips", "balance"]).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("number-line"),
      mode: z.enum(["place", "hops", "compare", "mirror", "zoom", "interval"]),
      widget: widgetSpec,
      equation: z.string().optional(),
      answer: numberAnswer.optional(),
      followUp: followUp.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("thermometer"),
      mode: z.literal("guess"),
      widget: z
        .object({ min: z.number(), max: z.number(), start: z.number(), change: z.number() })
        .strict(),
      result: z.number(),
      guessFeedback: z
        .object({ sameSide: z.object(feedback).strict(), otherSide: z.object(feedback).strict() })
        .strict(),
    })
    .strict(),
  numberInput,
  z
    .object({
      type: z.literal("multi-number-input"),
      parts: z
        .array(
          z
            .object({ prompt: z.string().optional(), expression: z.string(), answer: numberAnswer })
            .strict(),
        )
        .min(2),
    })
    .strict(),
  choice,
  z
    .object({
      type: z.literal("proof"),
      goal: z.string(),
      lines: z
        .array(
          z
            .object({
              math: z.string(),
              reason: z.string().nullable(),
              reasonLabel: z.string().optional(),
            })
            .strict(),
        )
        .min(2),
      tray: z.array(z.string()),
      steps: z.array(z.object({ id: z.string(), label: z.string() }).strict()).optional(),
      wrongReasonReplies: z.record(z.string(), z.string()).optional(),
      feedback: z.object(feedback).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("balance"),
      mode: z.enum(["solve", "system"]),
      widget: widgetSpec,
      answer: numberAnswer,
    })
    .strict(),
  z
    .object({
      type: z.literal("area-model"),
      mode: z.enum(["distribute", "width-2", "doubling-strip"]),
      widget: widgetSpec,
      answer: numberAnswer.optional(),
      followUp: followUp.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("square-tiles"),
      mode: z.enum(["expand", "complete", "compare"]),
      widget: widgetSpec,
      answer: numberAnswer.optional(),
      followUp: followUp.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("fraction-strips"),
      mode: z.enum(["cut", "add", "invert", "mediant"]),
      widget: widgetSpec,
      answer: numberAnswer.optional(),
      followUp: followUp.optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("elimination"),
      mode: z.enum(["two-unknowns", "three-unknowns", "general"]),
      equations: z.array(z.string()),
      balance: z.boolean().optional(),
      answer: z
        .object({
          values: z.union([z.record(z.string(), z.number()), z.literal("none"), z.literal("many")]),
          ...feedback,
        })
        .strict(),
      mistakes: z.array(mistake(z.string())).optional(),
    })
    .strict(),
  textInput,
  z
    .object({
      type: z.literal("ei-table"),
      feedback: z.object(feedback).strict(),
      wrongReply: z.string().optional(),
    })
    .strict(),
  z
    .object({ type: z.literal("trap-summary"), trap: choice, summary: z.array(z.string()) })
    .strict(),
]);

const hints = z.union([z.tuple([z.string()]), z.tuple([z.string(), z.string()])]);

const screen = z
  .object({
    id: z.string(),
    kind: z.enum(["recall", "hook", "explore", "name-it", "prove-it", "practice", "trap-summary"]),
    label: z.string(),
    title: z.string(),
    prompt: z.string(),
    designRef: z.string().optional(),
    interaction,
    tryTask: z.string().optional(),
    note: z.object({ label: z.string(), text: z.string() }).strict().optional(),
    hints: hints.optional(),
    showMe: z
      .object({
        steps: z.array(z.object({ math: z.string().optional(), text: z.string() }).strict()),
      })
      .strict()
      .optional(),
    twin: interaction.optional(),
    caption: z.string().optional(),
    buttonLabel: z.string().optional(),
  })
  .strict();

const lessonSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    book: z
      .object({
        chapter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        sections: z.string(),
      })
      .strict(),
    minutes: z.number(),
    pilot: z.boolean().optional(),
    goal: z.string(),
    needs: z.array(z.string()),
    rulesEarned: z.array(z.string()),
    generalHint: z.string(),
    next: z.object({ id: z.string(), title: z.string() }).strict().optional(),
    screens: z.array(screen).min(1),
  })
  .strict();

const practiceAnswer = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("number"),
      value: z.number(),
      mistakes: z.array(mistake(z.number())).optional(),
    })
    .strict(),
  z
    .object({ type: z.literal("numbers"), values: z.array(z.number()), ordered: z.boolean() })
    .strict(),
  z
    .object({
      type: z.literal("pair"),
      values: z.object({ x: z.number(), y: z.number() }).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("triple"),
      values: z.object({ x: z.number(), y: z.number(), z: z.number() }).strict(),
    })
    .strict(),
  z
    .object({ type: z.literal("expression"), value: z.string(), variables: z.array(z.string()) })
    .strict(),
  z.object({ type: z.literal("set"), values: z.array(z.string()) }).strict(),
  z.object({ type: z.literal("interval"), value: z.string() }).strict(),
  z
    .object({
      type: z.literal("choice"),
      options: z.array(z.string()).min(2),
      correct: z.number().int(),
    })
    .strict(),
  z.object({ type: z.literal("none") }).strict(),
  z.object({ type: z.literal("self-check") }).strict(),
]);

const bankSchema = z
  .object({
    lesson: z.string(),
    title: z.string(),
    note: z.string().optional(),
    problems: z
      .array(
        z
          .object({
            id: z.string(),
            n: z.number().int(),
            prompt: z.string(),
            answer: practiceAnswer,
            answerText: z.string(),
            solution: z.array(z.string()).optional(),
            langType: z.string(),
            stretch: z.boolean().optional(),
            hints: hints.optional(),
            verify: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

const coverageSchema = z
  .object({
    _note: z.string().optional(),
    rows: z.array(
      z
        .object({
          id: z.string(),
          chapter: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
          section: z.string(),
          kind: z.enum(["topic", "exercises", "skip"]),
          topic: z.string(),
          lessonScreens: z.array(z.string()),
          bankProblems: z.array(z.string()),
          note: z.string().optional(),
        })
        .strict(),
    ),
  })
  .strict();

const rulesSchema = z
  .object({
    rules: z.array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          name: z.string(),
          statement: z.string(),
          spoken: z.string().optional(),
          status: z.enum(["assumed", "proved", "left-to-reader", "shown"]),
          lesson: z.string(),
          book: z.string(),
          example: z.string().optional(),
        })
        .strict(),
    ),
  })
  .passthrough();

/* ───────── run ───────── */

const errors: string[] = [];
const fail = (file: string, msg: string) => errors.push(`${file}: ${msg}`);

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function parse<T extends z.ZodTypeAny>(schema: T, data: unknown, file: string): z.infer<T> | null {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  for (const issue of r.error.issues)
    fail(file, `schema (rule 1) at ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  return null;
}

const dup = (ids: string[]): string[] => ids.filter((id, i) => ids.indexOf(id) !== i);

const rulesFile = parse(
  rulesSchema,
  readJson(join(ROOT, "content/rules.json")),
  "content/rules.json",
);
const ruleIds = new Set(rulesFile?.rules.map((r) => r.id) ?? []);
for (const id of dup(rulesFile?.rules.map((r) => r.id) ?? []))
  fail("content/rules.json", `duplicate rule id ${id}`);

const figmap = readJson(join(ROOT, "design/figcraft-map.json")) as { frames: { key: string }[] };
const frameKeys = new Set(figmap.frames.map((f) => f.key));

const lessons = new Map<string, z.infer<typeof lessonSchema>>();
const banks = new Map<string, z.infer<typeof bankSchema>>();
const screenIds = new Set<string>();
const problemIds = new Set<string>();

for (const f of readdirSync(join(ROOT, "content/lessons")).filter((f) => f.endsWith(".json"))) {
  const file = `content/lessons/${f}`;
  const lesson = parse(lessonSchema, readJson(join(ROOT, file)), file);
  if (!lesson) continue;
  lessons.set(lesson.id, lesson);
  // Rule 2
  for (const id of dup(lesson.screens.map((s) => s.id)))
    fail(file, `duplicate screen id ${id} (rule 2)`);
  lesson.screens.forEach((s) => screenIds.add(s.id));

  const checkRule = (id: string, where: string) => {
    if (!ruleIds.has(id)) fail(file, `${where}: rule id "${id}" is not in rules.json (rule 3)`);
  };
  lesson.rulesEarned.forEach((r) => checkRule(r, "rulesEarned"));

  for (const s of lesson.screens) {
    const i = s.interaction;
    // Rule 4 (the tuple type already limits it; keep the check for clear errors)
    if ((s.hints?.length ?? 0) > 2) fail(file, `${s.id}: more than two hints (rule 4)`);
    // Rule 9
    for (const ref of (s.designRef ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)) {
      if (!frameKeys.has(ref))
        fail(file, `${s.id}: designRef "${ref}" is not in figcraft-map.json (rule 9)`);
    }
    // Rule 3
    if (i.type === "rule-card") i.ruleIds.forEach((r) => checkRule(r, s.id));
    if (i.type === "trap-summary") i.summary.forEach((r) => checkRule(r, s.id));
    if (i.type === "proof") {
      const stepIds = new Set((i.steps ?? []).map((x) => x.id));
      for (const id of i.tray)
        if (!ruleIds.has(id) && !stepIds.has(id))
          fail(file, `${s.id}: tray item "${id}" is neither a rule nor a step (rule 3)`);
      for (const l of i.lines)
        if (l.reason && !ruleIds.has(l.reason) && !stepIds.has(l.reason))
          fail(file, `${s.id}: reason "${l.reason}" is neither a rule nor a step (rule 3)`);
      for (const l of i.lines)
        if (l.reason && !i.tray.includes(l.reason))
          fail(file, `${s.id}: reason "${l.reason}" is not in the tray`);
      for (const chip of Object.keys(i.wrongReasonReplies ?? {}))
        if (!i.tray.includes(chip))
          fail(file, `${s.id}: wrongReasonReplies has "${chip}", which is not in the tray`);
    }
    // Rule 5
    const numberCheck = (
      a: { value: number; mistakes?: { match: number }[] } | undefined,
      where: string,
    ) => {
      if (a?.mistakes?.some((m) => Math.abs(m.match - a.value) < 1e-9))
        fail(file, `${where}: the correct answer is also a mistake match (rule 5)`);
    };
    const choiceCheck = (c: z.infer<typeof choice>, where: string) => {
      if (!c.options.some((o) => o.id === c.correct))
        fail(file, `${where}: correct option "${c.correct}" does not exist`);
      if (c.options.find((o) => o.id === c.correct)?.reply)
        fail(file, `${where}: the correct option has a mistake reply (rule 5)`);
    };
    const visit = (x: z.infer<typeof interaction>, where: string) => {
      if (x.type === "number-input") numberCheck(x.answer, where);
      if (x.type === "multi-number-input")
        x.parts.forEach((p, k) => numberCheck(p.answer, `${where} part ${k + 1}`));
      if (x.type === "text-input") {
        const ok = x.checker === "set" ? Boolean(x.answer.values?.length) : Boolean(x.answer.value);
        if (!ok) fail(file, `${where}: text-input "${x.checker}" has no answer value`);
        if (x.checker === "expression" && !x.answer.variables)
          fail(file, `${where}: expression answer needs "variables"`);
      }
      if (x.type === "choice") choiceCheck(x, where);
      if (x.type === "trap-summary") choiceCheck(x.trap, where);
      if (
        x.type === "number-line" ||
        x.type === "balance" ||
        x.type === "area-model" ||
        x.type === "square-tiles" ||
        x.type === "fraction-strips"
      ) {
        numberCheck(x.answer, where);
        if ("followUp" in x && x.followUp) visit(x.followUp, `${where} follow-up`);
      }
      if (x.type === "elimination") {
        const keys = (x.mistakes ?? []).map((m) => m.match);
        const v = x.answer.values;
        if (v === "none" || v === "many") {
          if (keys.includes(v))
            fail(file, `${where}: the correct answer is also a mistake match (rule 5)`);
        } else if (
          keys.includes(
            Object.entries(v)
              .map(([k, n]) => `${k}=${n}`)
              .join(";"),
          )
        ) {
          fail(file, `${where}: the correct answer is also a mistake match (rule 5)`);
        }
      }
    };
    visit(i, s.id);
    if (s.twin) visit(s.twin, `${s.id} twin`);
  }
  if (lesson.needs.some((n) => n === lesson.id)) fail(file, "lesson needs itself");
}

for (const f of readdirSync(join(ROOT, "content/practice")).filter((f) => f.endsWith(".json"))) {
  const file = `content/practice/${f}`;
  const bank = parse(bankSchema, readJson(join(ROOT, file)), file);
  if (!bank) continue;
  banks.set(bank.lesson, bank);
  for (const id of dup(bank.problems.map((p) => p.id)))
    fail(file, `duplicate problem id ${id} (rule 2)`);
  bank.problems.forEach((p) => problemIds.add(p.id));
  for (const p of bank.problems) {
    if ((p.hints?.length ?? 0) > 2) fail(file, `${p.id}: more than two hints (rule 4)`);
    if (p.answer.type === "number") {
      const a = p.answer;
      if (a.mistakes?.some((m) => Math.abs(m.match - a.value) < 1e-9))
        fail(file, `${p.id}: the correct answer is also a mistake match (rule 5)`);
      // Rule 8
      if (p.verify !== undefined) {
        try {
          const got = Number(evaluate(p.verify));
          if (!Number.isFinite(got) || Math.abs(got - a.value) > 1e-9)
            fail(
              file,
              `${p.id}: verify "${p.verify}" = ${got}, but the answer is ${a.value} (rule 8)`,
            );
        } catch (e) {
          fail(
            file,
            `${p.id}: verify "${p.verify}" cannot be evaluated (${(e as Error).message}) (rule 8)`,
          );
        }
      }
    }
    if (
      p.answer.type === "choice" &&
      (p.answer.correct < 0 || p.answer.correct >= p.answer.options.length)
    )
      fail(file, `${p.id}: choice index out of range`);
  }
}

// Rules 6 and 7: coverage
const coverage = parse(
  coverageSchema,
  readJson(join(ROOT, "content/coverage.json")),
  "content/coverage.json",
);
const pointedScreens = new Set<string>();
const pointedBanks = new Set<string>();
if (coverage) {
  for (const id of dup(coverage.rows.map((r) => r.id)))
    fail("content/coverage.json", `duplicate row id ${id} (rule 2)`);
  for (const r of coverage.rows) {
    for (const s of r.lessonScreens) {
      pointedScreens.add(s.split(".").slice(0, 2).join("."));
      if (!screenIds.has(s))
        fail("content/coverage.json", `${r.id}: lesson screen "${s}" does not exist (rule 6)`);
    }
    for (const b of r.bankProblems) {
      if (b.startsWith("bank:")) {
        const id = b.slice(5);
        pointedBanks.add(id);
        if (!banks.has(id))
          fail("content/coverage.json", `${r.id}: bank "${id}" does not exist (rule 6)`);
      } else {
        const bankId = /^b(\d+\.\d+)\./.exec(b)?.[1];
        if (bankId) pointedBanks.add(bankId);
        if (!problemIds.has(b))
          fail("content/coverage.json", `${r.id}: bank problem "${b}" does not exist (rule 6)`);
      }
    }
  }
  for (const [id, lesson] of lessons) {
    if (lesson.book.chapter <= CURRENT_PHASE && !pointedScreens.has(id))
      fail("content/coverage.json", `lesson ${id} has no coverage row that points to it (rule 7)`);
  }
  for (const [id, bank] of banks) {
    const chapter = Number(id.split(".")[0]);
    if (chapter <= CURRENT_PHASE && !pointedBanks.has(id))
      fail("content/coverage.json", `bank ${id} has no coverage row that points to it (rule 7)`);
    void bank;
  }
}

if (errors.length) {
  console.error(`validate:content found ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(
  `validate:content OK: ${lessons.size} lesson(s), ${banks.size} bank(s), ${coverage?.rows.length ?? 0} coverage row(s), ${ruleIds.size} rule(s).`,
);
