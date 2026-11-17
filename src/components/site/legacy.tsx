import Image from "next/image";

import { InkGroup } from "@/components/site/ink-group";
import { InkWords } from "@/components/site/ink-words";
import { legacy } from "@/content/site";

/**
 * Our Legacy (obsidian). The house's "About" page: the story and its principles on a dark
 * stone ground on the left, the barrel photograph running the full height of the screen off
 * the right edge, and a wax-seal detail set as an inset across the boundary between them.
 * Desktop: one full screen, a snap point, content centered below the fixed header.
 *
 * Signature move, "Ink" (motion-sections.css, CONTRACT section 9): the heading and the two
 * paragraphs write in line by line like a pen, starting with the gold initial; each
 * principle's gold dash draws, then its text follows; the photographs open top to bottom
 * like a cellar door. The h2 is set here rather than through SectionHeading so it can take
 * the ink reveal instead of the shared word mask; its type matches SectionHeading exactly.
 */
export function Legacy() {
  const [first, ...rest] = legacy.paragraphs;
  const initial = first.charAt(0);
  const afterInitial = first.slice(1);

  return (
    <section
      id={legacy.id}
      data-section={legacy.id}
      aria-labelledby={`${legacy.id}-title`}
      className="section-screen overflow-hidden bg-obsidian"
    >
      {/* Dark stone ground under the text (static), softened by a vignette. */}
      <div aria-hidden="true" data-surface className="pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[62vw]">
        <Image src="/media/texture-slate.jpg" alt="" fill sizes="62vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_45%,transparent_0%,rgb(var(--obsidian)/0.55)_60%,rgb(var(--obsidian)/0.95)_100%)]" />
      </div>

      <div className="container relative">
        <div className="lg:w-[55%] lg:pr-8 xl:pr-12">
          <InkGroup>
            <header className="max-w-2xl">
              <h2 id={`${legacy.id}-title`} className="text-[clamp(2.5rem,3.4vw+0.5rem,5rem)] leading-[1.05]">
                <InkWords text={legacy.title} />
              </h2>
            </header>
            <div className="mt-8 max-w-prose space-y-5 text-stone lg:mt-6 lg:space-y-4 lg:text-[clamp(1.0625rem,0.5vw+0.6rem,1.3125rem)]">
              <p className="font-serif-text text-[1.1875rem] leading-[1.6] text-parchment/90 lg:text-[clamp(1.125rem,0.6vw+0.6rem,1.5rem)]">
                {/*
                  Gold initial, about three lines tall: the first stroke of the pen. It is the real first
                  letter (no separate screen-reader copy), set directly against the rest of the word.
                */}
                <span
                  className="ink-w float-left mr-3 mt-[0.32rem] font-serif text-[5.25rem] leading-[0.74] text-gold lg:text-[clamp(5rem,3vw+2.4rem,7.25rem)]"
                >
                  {initial}
                </span>
                <InkWords text={afterInitial} />
              </p>
              {rest.map((paragraph) => (
                <p key={paragraph}>
                  <InkWords text={paragraph} />
                </p>
              ))}
            </div>
          </InkGroup>

          {/* Below desktop: the barrel photograph sits in the flow, edge to edge. */}
          <figure className="relative -mx-5 mt-14 sm:-mx-6 md:mt-16 lg:hidden">
            <div data-reveal="cellar" className="relative aspect-[4/5] overflow-hidden bg-coal sm:aspect-[4/3]">
              <Image src="/media/legacy-barrel.jpg" alt={legacy.barrelAlt} fill sizes="100vw" className="object-cover" />
            </div>
          </figure>

          {/* Principles: three columns with thin gold dividers between them. */}
          <ul className="legacy-principles mt-14 grid gap-9 sm:grid-cols-3 sm:gap-0 md:mt-16 lg:mt-8">
            {legacy.principles.map((principle, i) => (
              <li key={principle.title} className="relative sm:px-6 sm:first:pl-0 sm:last:pr-0">
                {i > 0 ? (
                  <span
                    aria-hidden="true"
                    data-reveal="fade"
                    className="absolute inset-y-0 left-0 hidden w-px bg-gold/30 sm:block"
                  />
                ) : null}
                <span aria-hidden="true" data-reveal="line" className="block h-px w-8 bg-gold" />
                <div data-reveal="up" className="mt-3">
                  <h3 className="text-[1.25rem] leading-snug lg:text-[clamp(1.25rem,0.7vw+0.7rem,1.75rem)]">{principle.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-stone lg:text-[clamp(0.9375rem,0.35vw+0.65rem,1.1875rem)]">{principle.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Desktop: the photograph runs the full height of the screen and bleeds off the right edge. */}
      <figure className="absolute inset-y-0 right-0 hidden w-[38vw] lg:block">
        <div data-reveal="cellar" className="relative h-full overflow-hidden bg-coal">
          <Image
            src="/media/legacy-barrel.jpg"
            alt={legacy.barrelAlt}
            fill
            sizes="38vw"
            className="object-cover object-[30%_60%]"
          />
        </div>
      </figure>

      {/*
        Desktop: the wax-seal detail, an editorial inset across the boundary between the text
        and the barrel photograph, in the lower third, with a gold hairline frame offset behind it.
      */}
      <figure className="absolute bottom-[11%] left-[62vw] hidden w-[clamp(15rem,17vw,20rem)] -translate-x-1/2 lg:block">
        <span aria-hidden="true" data-reveal="fade" className="absolute inset-0 translate-x-[10px] translate-y-[10px] border border-gold/55" />
        <div data-reveal="cellar" className="relative aspect-[4/5] overflow-hidden bg-coal">
          <Image
            src={legacy.sealImage.src}
            alt={legacy.sealImage.alt}
            fill
            sizes="(min-width: 1024px) 20rem, 0px"
            className="object-cover"
          />
        </div>
      </figure>
    </section>
  );
}
