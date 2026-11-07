const SHORT: Record<string, string> = {
  "comm-add": "Comm.",
  "comm-mul": "Comm.",
  "assoc-add": "Assoc.",
  "assoc-mul": "Assoc.",
  "pos-sum": "Pos. sum",
  "neg-sum": "Neg. sum",
  "solve-sum": "Solve",
  "cancel-add": "Cancel",
  "cancel-mul": "Cancel",
  "cancel-frac": "Cancel",
  "zero-mul": "0 · a",
  distrib: "Distrib.",
  "distrib-right": "Distrib.",
  "thm-1": "Thm 1",
  "thm-2": "Thm 2",
  "thm-2-cor": "Thm 2",
  "thm-3": "Thm 3",
  "thm-4": "Thm 4",
  "thm-roots": "Roots",
  POS1: "POS 1",
  POS2: "POS 2",
  POW1: "POW 1",
  POW2: "POW 2",
  POW3: "POW 3",
  IN1: "IN 1",
  IN2: "IN 2",
  IN3: "IN 3",
};

/** The short label in the rule id chip of a rule card (frames H03, DH3). */
export function ruleChipLabel(id: string): string {
  if (SHORT[id]) return SHORT[id];
  if (/^[A-Z]+\d*$/.test(id)) return id;
  const first = id.split("-")[0];
  const word = first.charAt(0).toUpperCase() + first.slice(1);
  return word.length > 6 ? `${word.slice(0, 5)}.` : word;
}

const FULL: Record<string, string> = {
  "comm-add": "Commutativity",
  "comm-mul": "Commutativity",
  "assoc-add": "Associativity",
  "assoc-mul": "Associativity",
  distrib: "Distributivity, left",
  "distrib-right": "Distributivity, right",
};

/** The name on a reason chip of the proof stepper (frames S07–S09): "N2", "Commutativity". */
export function reasonChipName(id: string, ruleName?: string): string {
  if (FULL[id]) return FULL[id];
  if (/^[A-Z]+\d*$/.test(id)) return id.replace(/^([A-Z]+)(\d)/, "$1 $2").replace(/^N (\d)/, "N$1");
  return ruleName ?? ruleChipLabel(id);
}
