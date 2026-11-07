import { Fragment } from "react";
import { Math } from "./Math";

interface RichTextProps {
  text: string;
}

/** Plain text with inline math between $...$. */
export function RichText({ text }: RichTextProps) {
  const parts = text.split(/\$([^$]+)\$/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <Math key={i} tex={part} /> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}
