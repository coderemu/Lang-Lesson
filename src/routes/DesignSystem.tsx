import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  ChoiceChip,
  FeedbackSheet,
  HintChip,
  HintDrawer,
  LessonBar,
  NumberSlot,
  ReasonChip,
  ReasonSlot,
  RuleCard,
  TrapBox,
  TryBox,
} from "../components";
import { Math } from "../math";
import styles from "./DesignSystem.module.css";

const COLORS: { token: string; role: string }[] = [
  { token: "ink", role: "Text, math, lines, the Continue button" },
  { token: "ink-soft", role: "Secondary text" },
  { token: "ink-muted", role: "Muted text (14px and up)" },
  { token: "paper", role: "Page" },
  { token: "surface", role: "Widget stage" },
  { token: "line", role: "Borders" },
  { token: "grid", role: "Graph grid" },
  { token: "primary", role: "Brand action: Check, focus, links" },
  { token: "primary-bright", role: "Plus direction, variable a" },
  { token: "negative", role: "Minus direction, drag handles" },
  { token: "rule", role: "Lang's rule, variable b" },
  { token: "correct", role: "Correct, variable c" },
  { token: "incorrect", role: "Not quite" },
  { token: "hint", role: "Hint" },
  { token: "progress", role: "Progress, mastery" },
  { token: "correct-text", role: "Text on correct tint" },
  { token: "incorrect-text", role: "Text on not-quite tint" },
  { token: "hint-text", role: "Text on hint tint" },
  { token: "negative-text", role: "Text on minus tint" },
  { token: "progress-text", role: "Text on progress tint" },
];
const TINTS = ["rule", "correct", "primary", "negative", "incorrect", "hint", "progress"];

const TYPE_SCALE: { name: string; style: React.CSSProperties; spec: string; sample: string }[] = [
  {
    name: "Display",
    spec: "Bricolage 44/48 · 800",
    sample: "Each number has one undo",
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 44,
      lineHeight: "48px",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
  },
  {
    name: "Title",
    spec: "Bricolage 32/36 · 800",
    sample: "Your course",
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 32,
      lineHeight: "36px",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
  },
  {
    name: "Sheet title",
    spec: "Bricolage 22–24 · 800",
    sample: "Rule book",
    style: { fontFamily: "var(--font-display)", fontSize: 24, lineHeight: 1.2, fontWeight: 800 },
  },
  {
    name: "Body",
    spec: "Inter 18/28 · 400",
    sample: "Start at 3. Make 5 hops to the left.",
    style: { fontSize: 18, lineHeight: "28px" },
  },
  {
    name: "Small",
    spec: "Inter 16/24 · 400",
    sample: "Chapters 1–4 · 19 lessons",
    style: { fontSize: 16, lineHeight: "24px" },
  },
  {
    name: "Caption",
    spec: "Inter 14/20 · 400",
    sample: "§1 · 8 min",
    style: { fontSize: 14, lineHeight: "20px" },
  },
  {
    name: "Button",
    spec: "Inter 18 · 600",
    sample: "Check",
    style: { fontSize: 18, fontWeight: 600 },
  },
  {
    name: "Label",
    spec: "IBM Plex Mono 14 · caps · 0.08em",
    sample: "EXPLORE · RULE N2",
    style: { fontFamily: "var(--font-label)", fontSize: 14, letterSpacing: "0.08em" },
  },
];

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64];
const RADII = [
  { name: "Chips", value: "var(--radius-sm)", px: 6 },
  { name: "Cards, inputs", value: "var(--radius-md)", px: 12 },
  { name: "Stages, sheets", value: "var(--radius-lg)", px: 20 },
  { name: "Buttons", value: "var(--radius-pill)", px: 999 },
];
const MOTION = [
  [
    "Hop on number line",
    "Arc draws, ring moves one unit: 240 ms per unit, ease-out. Step number appears with each hop.",
  ],
  ["Feedback sheet", "Slides up 180 ms ease-out. Never shakes the screen."],
  ["Equation change", "Terms move to their new place, 240 ms."],
  ["Proof line unlock", "Next line fades from 35% to 100%, 180 ms."],
  ["Balance", "Beam tilts to max 8°, spring (stiffness 200, damping 20)."],
  ["Reduced motion", "All of the above become a 120 ms fade."],
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className={styles.h2}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Spec({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className={styles.spec}>
      <p className={styles.specName}>{name}</p>
      <div className={styles.specBody}>{children}</div>
    </div>
  );
}

function Interactive() {
  const [chip, setChip] = useState(false);
  const [slot, setSlot] = useState("");
  const [trap, setTrap] = useState<boolean | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  return (
    <>
      <Spec name="Live (try it)">
        <ChoiceChip selected={chip} onClick={() => setChip(!chip)}>
          Tap me
        </ChoiceChip>
        <NumberSlot label="Live number slot" value={slot} onChange={setSlot} compact />
        <HintChip open={hintOpen} onClick={() => setHintOpen(!hintOpen)} />
      </Spec>
      {hintOpen && (
        <HintDrawer
          index={1}
          total={2}
          text="Think of the thermometer. Which way does it move?"
          onHide={() => setHintOpen(false)}
        />
      )}
      <Spec name="Trap box · live">
        <div className={styles.wide}>
          <TrapBox
            question="True or false: $-a$ is always negative."
            answer={trap}
            correct={false}
            onAnswer={setTrap}
          />
        </div>
      </Spec>
    </>
  );
}

export function DesignSystem() {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <p className={styles.label}>LANG VISUALS</p>
        <h1 className={styles.h1}>Design system</h1>
        <p className={styles.lead}>
          Every token and component state of the app. <Link to="/settings">Settings</Link> links
          here.
        </p>
        <nav className={styles.toc} aria-label="Sections">
          {[
            "colour",
            "type",
            "space",
            "radius",
            "motion",
            "buttons",
            "choices",
            "slots",
            "reasons",
            "feedback",
            "hints",
            "bar",
            "cards",
          ].map((s) => (
            <a key={s} href={`#${s}`}>
              {s}
            </a>
          ))}
        </nav>
      </header>

      <Section id="colour" title="Colour">
        <div className={styles.swatches}>
          {COLORS.map((c) => (
            <div key={c.token} className={styles.swatch}>
              <span
                className={styles.chipColor}
                style={{ background: `var(--color-${c.token})` }}
              />
              <div>
                <p className={styles.swatchName}>--color-{c.token}</p>
                <p className={styles.swatchRole}>{c.role}</p>
              </div>
            </div>
          ))}
          {TINTS.map((t) => (
            <div key={t} className={styles.swatch}>
              <span className={styles.chipColor} style={{ background: `var(--tint-${t})` }} />
              <div>
                <p className={styles.swatchName}>--tint-{t}</p>
                <p className={styles.swatchRole}>Solid tint of {t}</p>
              </div>
            </div>
          ))}
        </div>
        <Spec name="Variables keep their colour">
          <Math tex="\va{a} + \vb{b} = \vc{c}" className={styles.mathBig} />
        </Spec>
      </Section>

      <Section id="type" title="Type scale">
        {TYPE_SCALE.map((t) => (
          <div key={t.name} className={styles.typeRow}>
            <p className={styles.typeMeta}>
              {t.name} · {t.spec}
            </p>
            <p style={t.style}>{t.sample}</p>
          </div>
        ))}
        <div className={styles.typeRow}>
          <p className={styles.typeMeta}>Math · STIX Two Text via KaTeX · 22–36</p>
          <Math tex="-(\va{a} + \vb{b}) = -\va{a} - \vb{b}" className={styles.mathBig} />
        </div>
      </Section>

      <Section id="space" title="Space">
        <div className={styles.spaceRow}>
          {SPACING.map((s) => (
            <div key={s} className={styles.spaceItem}>
              <span className={styles.spaceBar} style={{ width: s, height: s }} />
              <span className={styles.caption}>{s}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="radius" title="Radius and elevation">
        <div className={styles.spaceRow}>
          {RADII.map((r) => (
            <div key={r.name} className={styles.spaceItem}>
              <span className={styles.radiusBox} style={{ borderRadius: r.value }} />
              <span className={styles.caption}>
                {r.name} · {r.px === 999 ? "pill" : r.px}
              </span>
            </div>
          ))}
          <div className={styles.spaceItem}>
            <span
              className={styles.radiusBox}
              style={{ borderRadius: 20, boxShadow: "0 -4px 20px rgb(0 0 0 / 10%)" }}
            />
            <span className={styles.caption}>Overlay shadow (sheet, hint drawer)</span>
          </div>
        </div>
      </Section>

      <Section id="motion" title="Motion">
        <dl className={styles.motion}>
          {MOTION.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.caption}>No confetti. Show the move, not a celebration.</p>
      </Section>

      <Section id="buttons" title="Buttons">
        <Spec name="Primary · default, disabled">
          <Button>Check</Button>
          <Button disabled>Check</Button>
        </Spec>
        <Spec name="Primary · hover, focus (forced)">
          <Button className={styles.forceHover}>Check</Button>
          <Button className={styles.forceFocus}>Check</Button>
        </Spec>
        <Spec name="Continue">
          <Button variant="continue">Continue</Button>
        </Spec>
        <Spec name="Secondary · default, hover (forced)">
          <Button variant="secondary">Show me why</Button>
          <Button variant="secondary" className={styles.forceHover}>
            Show me why
          </Button>
        </Spec>
        <Spec name="Hint · default, open">
          <Button variant="hint">Hint</Button>
          <Button variant="hint" open>
            Hint
          </Button>
        </Spec>
      </Section>

      <Section id="choices" title="Choice chip">
        <Spec name="Unselected, selected, correct, wrong, disabled">
          <ChoiceChip>Above zero</ChoiceChip>
          <ChoiceChip selected>Below zero</ChoiceChip>
          <ChoiceChip state="correct" selected>
            Below zero
          </ChoiceChip>
          <ChoiceChip state="wrong" selected>
            Above zero
          </ChoiceChip>
          <ChoiceChip disabled>Not now</ChoiceChip>
        </Spec>
      </Section>

      <Section id="slots" title="Number slot">
        <Spec name="Empty, focused, filled, wrong, correct">
          <NumberSlot label="Empty slot" value="" />
          <NumberSlot label="Focused slot" value="" className={styles.forceSlotFocus} />
          <NumberSlot label="Filled slot" value="−2" />
          <NumberSlot label="Wrong slot" value="2" state="wrong" />
          <NumberSlot label="Correct slot" value="−2" state="correct" />
        </Spec>
        <Spec name="Mobile size 76 × 60">
          <NumberSlot label="Compact slot" value="−5" compact />
        </Spec>
      </Section>

      <Section id="reasons" title="Reason chip and slot">
        <Spec name="Chip · in tray, placed, wrong, disabled">
          <ReasonChip>N2</ReasonChip>
          <ReasonChip state="placed">N2</ReasonChip>
          <ReasonChip state="wrong">N1</ReasonChip>
          <ReasonChip state="disabled">N4</ReasonChip>
        </Spec>
        <Spec name="Slot · empty, active, filled, locked">
          <ReasonSlot />
          <ReasonSlot state="active" />
          <ReasonSlot state="filled">
            <ReasonChip state="placed">N2</ReasonChip>
          </ReasonSlot>
          <ReasonSlot state="locked" />
        </Spec>
      </Section>

      <Section id="feedback" title="Feedback sheet">
        <div className={styles.sheets}>
          <FeedbackSheet kind="correct" title="Yes, −2." actions={<Button block>Continue</Button>}>
            You hop 5 units left from 3. That stops at −2.
          </FeedbackSheet>
          <FeedbackSheet
            kind="not-quite"
            title="Not quite."
            actions={
              <>
                <Button variant="secondary">Show me why</Button>
                <Button>Try again</Button>
              </>
            }
          >
            That is 7 + 9. A minus number moves to the left. Which direction did you hop?
          </FeedbackSheet>
          <FeedbackSheet kind="wrong-reason" title="Not N4.">
            N4 removes two minus signs. Which rule makes a sum zero?
          </FeedbackSheet>
        </div>
      </Section>

      <Section id="hints" title="Hint drawer and chip">
        <Spec name="Closed (chip), open (chip)">
          <HintChip />
          <HintChip open />
        </Spec>
        <div className={styles.sheets}>
          <HintDrawer index={1} total={2} text="Look at the sign of the first number." />
          <HintDrawer index={2} total={2} text="Add 5 to both sides first." />
        </div>
        <Interactive />
      </Section>

      <Section id="bar" title="Lesson bar">
        <div className={styles.bars}>
          <LessonBar total={14} current={1} />
          <LessonBar total={14} current={7} />
          <LessonBar total={14} current={14} />
        </div>
      </Section>

      <Section id="cards" title="Rule card, Try box, Trap box">
        <div className={styles.cards}>
          <RuleCard
            label="RULE N2 · ADDITIVE INVERSE"
            statement="\va{a} + (-\va{a}) = 0"
            spoken="a plus minus a equals zero"
          />
          <TryBox>Now start at $-3$ and add $+3$. Where do you land? Why?</TryBox>
          <TrapBox
            question="True or false: $-a$ is always negative."
            answer={null}
            correct={false}
          />
          <TrapBox
            question="True or false: $-a$ is always negative."
            answer={true}
            correct={false}
          />
          <TrapBox
            question="True or false: $-a$ is always negative."
            answer={false}
            correct={false}
          />
        </div>
      </Section>
    </div>
  );
}
