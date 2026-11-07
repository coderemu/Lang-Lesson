import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";
import { katexOptions } from "./macros";

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
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
