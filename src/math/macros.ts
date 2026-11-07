/** Coloured variables. \htmlClass needs trust, which math/trust.ts limits to that one command. */
export const macros: Record<string, string> = {
  "\\va": "\\htmlClass{var-a}{#1}",
  "\\vb": "\\htmlClass{var-b}{#1}",
  "\\vc": "\\htmlClass{var-c}{#1}",
};

export const katexOptions = {
  macros,
  throwOnError: false,
  trust: (context: { command: string }) => context.command === "\\htmlClass",
  strict: "ignore" as const,
};
