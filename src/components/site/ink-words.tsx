import { Fragment } from "react";

/**
 * Splits text into word spans for the Legacy "Ink" reveal (motion-sections.css). The spaces
 * stay as plain text between the spans, so wrapping, copy and paste and screen readers read
 * the text normally. InkGroup measures which line each word sits on.
 */
export function InkWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, w) => (
        <Fragment key={w}>
          {w > 0 ? " " : null}
          <span className="ink-w">{word}</span>
        </Fragment>
      ))}
    </>
  );
}
