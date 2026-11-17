import { Fragment, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /**
   * Section name from site.ts. Not rendered: eyebrow labels above every heading read as
   * template chrome (frontend-design skill). Kept so callers stay stable.
   */
  label?: string;
  /** The section's h2. */
  title: string;
  /** Optional intro paragraph under the heading. */
  intro?: string;
  /** id for the h2, used by aria-labelledby on the <section>. */
  id?: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * Shared section header: serif h2 and an optional intro.
 *
 * Reveal (motion-hero.css, played by RevealController when the section locks in): each word
 * of the h2 rises from its own overflow mask with a 70ms word stagger (`--w`); the controller
 * places the heading and intro in the section's reading-order cascade (`--i`). Server-rendered and fully visible without JS or with reduced motion.
 */
export function SectionHeading({ title, intro, id, align = "left", className }: SectionHeadingProps) {
  const words = title.split(" ");
  return (
    <header className={cn("max-w-[clamp(42rem,46vw,60rem)]", align === "center" && "mx-auto text-center", className)}>
      <h2
        id={id}
        data-reveal="mask"
        // Fluid: carries the big screen without overflowing 1280x720.
        className="text-[clamp(2.5rem,3.4vw+0.5rem,5rem)] leading-[1.05]"
      >
        {words.map((word, w) => (
          <Fragment key={w}>
            {w > 0 ? " " : null}
            <span className="lld-mask">
              <span style={{ "--w": w } as CSSProperties}>{word}</span>
            </span>
          </Fragment>
        ))}
      </h2>
      {intro ? (
        <p data-reveal="up" className="mt-6 max-w-prose text-[clamp(1.0625rem,0.55vw+0.8rem,1.375rem)] text-stone">
          {intro}
        </p>
      ) : null}
    </header>
  );
}
