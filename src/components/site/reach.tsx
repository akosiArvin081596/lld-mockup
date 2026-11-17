import Image from "next/image";
import Link from "next/link";

import { SectionHeading } from "@/components/ui/section-heading";
import { UsMap } from "@/components/site/us-map";
import { coverage, headerCta, reach, usStates } from "@/content/site";


const stateNames = new Map<string, string>(usStates.map(([code, name]) => [code, name]));

/**
 * Reach (obsidian). The map leads, and draws its state outlines as it scrolls in
 * (motion-sections.css): coverage built market by market. States in `coverage.states`
 * fill gold. While that list is empty the map claims nothing and the note invites the
 * visitor to ask about their state.
 */
export function Reach() {
  const served = coverage.states.map((code) => code.toUpperCase()).filter((code) => stateNames.has(code));
  const hasCoverage = served.length > 0;

  return (
    <section
      id={reach.id}
      data-section={reach.id}
      aria-labelledby={`${reach.id}-title`}
      className="section-screen overflow-hidden bg-obsidian"
    >
      {/*
        The dusk highway, clearly visible. The scrim is directional: strong only where the copy
        sits (right on desktop, top on mobile) and light behind the map, plus soft top and bottom
        edges so the photo meets the neighbouring sections cleanly.
      */}
      <div aria-hidden="true" data-reveal="push" className="lld-px pointer-events-none absolute inset-0 overflow-hidden">
        {/* The source is a deep dusk exposure (mean luminance about 13%), so it is lifted here to read clearly. */}
        <Image
          src="/media/reach-highway.jpg"
          alt=""
          fill
          sizes="100vw"
          className="lld-px-img object-cover object-[center_35%] [filter:brightness(1.7)_contrast(1.08)_saturate(1.1)]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/90 via-obsidian/55 to-obsidian/25 lg:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-l from-obsidian/95 from-[26%] via-obsidian/50 via-[50%] to-transparent lg:block" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-obsidian/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-obsidian/60 to-transparent" />
      </div>
      <div className="container relative">
        <div className="grid gap-y-14 lg:grid-cols-12 lg:items-center lg:gap-x-12">
          <div className="lg:order-2 lg:col-span-4 lg:col-start-9">
            <SectionHeading id={`${reach.id}-title`} label={reach.label} title={reach.title} />
            <p data-reveal="up" className="mt-7 max-w-prose text-lg text-parchment/85">
              {reach.body}
            </p>

            {hasCoverage ? (
              <div data-reveal="up" className="mt-10">
                <h3 className="font-sans text-[0.9375rem] font-medium text-parchment">{reach.legend}</h3>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-stone">
                  {served.map((code) => (
                    <li key={code} className="flex items-center gap-3">
                      <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-gold/85" />
                      {stateNames.get(code)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p data-reveal="up" className="mt-9">
                <Link
                  href={headerCta.href}
                  className="font-serif-text text-[1.1875rem] italic leading-snug text-gilt underline decoration-gold/40 underline-offset-[6px] transition-colors duration-300 hover:text-parchment hover:decoration-gilt"
                >
                  {reach.emptyNote}
                </Link>
              </p>
            )}
          </div>

          <div className="lg:order-1 lg:col-span-8 lg:mx-auto lg:w-full lg:max-w-[calc((100svh-var(--header-h)-5rem)*1.617)]">
            <UsMap label={reach.mapLabel} highlighted={served} />
          </div>
        </div>
      </div>
    </section>
  );
}
