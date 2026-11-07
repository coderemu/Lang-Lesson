/** A plain-words reading of a TeX string, used as the accessible name of rendered math. */
export function spokenTex(tex: string): string {
  let s = tex;
  // Coloured variables and text blocks keep their content.
  s = s.replace(/\\v[abc]\{([^{}]*)\}/g, "$1").replace(/\\text\{([^{}]*)\}/g, " $1 ");
  // Fractions, possibly nested one level deep, are read "a over b".
  for (let k = 0; k < 3; k++) {
    s = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, " ($1) over ($2) ");
    s = s.replace(/\\binom\{([^{}]*)\}\{([^{}]*)\}/g, " $1 choose $2 ");
  }
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, " square root of $1 ");
  s = s.replace(/\^\{?2\}?/g, " squared ").replace(/\^\{?3\}?/g, " cubed ");
  s = s.replace(/\^\{([^{}]*)\}/g, " to the power $1 ").replace(/\^(\w)/g, " to the power $1 ");
  const words: [RegExp, string][] = [
    [/\\cdot|\\times/g, " times "],
    [/\\Rightarrow/g, " implies "],
    [/\\ne\b/g, " is not equal to "],
    [/\\equiv/g, " is congruent to "],
    [/\\mid/g, " divides "],
    [/\\le\b/g, " is at most "],
    [/\\ge\b/g, " is at least "],
    [/\\(left|right|quad|qquad)\b/g, " "],
    [/\\[,;! ]/g, " "],
    [/=/g, " equals "],
    [/\+/g, " plus "],
    [/-/g, " minus "],
    [/</g, " is less than "],
    [/>/g, " is greater than "],
    [/\\[a-zA-Z]+/g, " "],
    [/[{}]/g, ""],
  ];
  for (const [re, to] of words) s = s.replace(re, to);
  return s.replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").trim();
}
