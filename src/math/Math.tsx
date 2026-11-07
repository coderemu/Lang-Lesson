import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";
import { katexOptions } from "./macros";
import { spokenTex } from "./spoken";

interface MathProps {
  tex: string;
  display?: boolean;
  className?: string;
}

/** Renders TeX with KaTeX. The minus sign is a true minus (U+2212). */
export function Math({ tex, display = false, className }: MathProps) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, { ...katexOptions, displayMode: display, output: "htmlAndMathml" }),
    [tex, display],
  );
  const Tag = display ? "div" : "span";
  // The reading in words is the accessible name. The rendered math is a picture for screen readers.
  return (
    <Tag
      className={className}
      role="img"
      aria-label={spokenTex(tex)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
