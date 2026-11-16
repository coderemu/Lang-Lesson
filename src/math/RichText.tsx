import { Fragment } from "react";
import { Math } from "./Math";

interface RichTextProps {
  text: string;
}

const DOLLAR = "\u0001";

/** Plain text with inline math between $...$. Write \$ for a dollar sign (money). */
export function RichText({ text }: RichTextProps) {
  const parts = text.replace(/\\\$/g, DOLLAR).split(/\$([^$]+)\$/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Math key={i} tex={part} />
        ) : (
          <Fragment key={i}>{part.replaceAll(DOLLAR, "$")}</Fragment>
        ),
      )}
    </>
  );
}
