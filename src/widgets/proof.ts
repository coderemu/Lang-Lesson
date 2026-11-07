import type { ProofInteraction, Rule } from "../../content/schema";
import { reasonChipName } from "../content/ruleChip";

export interface ChipDef {
  id: string;
  label: string;
  kind: "rule" | "step";
}

/** Chips of the tray: rules show their short name, steps show their label. */
export function trayChips(p: ProofInteraction, rules: Map<string, Rule>): ChipDef[] {
  const steps = new Map((p.steps ?? []).map((s) => [s.id, s.label]));
  return p.tray.map((id) =>
    steps.has(id)
      ? { id, label: steps.get(id) as string, kind: "step" as const }
      : { id, label: reasonChipName(id, rules.get(id)?.name), kind: "rule" as const },
  );
}

/** The first line that still needs its reason. Given lines (reason null) are skipped. */
export function activeLine(p: ProofInteraction, done: Set<number>): number {
  const i = p.lines.findIndex((l, k) => l.reason !== null && !done.has(k));
  return i < 0 ? p.lines.length : i;
}
