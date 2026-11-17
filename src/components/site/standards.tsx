import Image from "next/image";

import { SectionHeading } from "@/components/ui/section-heading";
import { standards } from "@/content/site";

/**
 * Our Standards. The page's only light band: parchment over cotton paper, ink text.
 * Desktop: a split screen. The left 48% is the crate photograph, full bleed from the nav
 * bar's edge to the bottom of the section; the right half holds the heading and the four
 * standards, vertically centred, with type that scales up on large screens.
 * Below desktop: the photograph runs edge to edge at the top, then the text.
 *
 * Signature, "Stamp of approval" (motion-sections.css): the photograph develops from dark;
 * each short gold-deep rule draws, then its title and text press in.
 */
export function Standards() {
  return (
    <section
      id={standards.id}
      data-section={standards.id}
      aria-labelledby={`${standards.id}-title`}
      className="section-screen surface-light overflow-hidden"
    >
      {/* Cotton paper, multiplied into the parchment so the band reads as a printed page. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Image src="/media/texture-paper.jpg" alt="" fill sizes="100vw" className="object-cover opacity-70 mix-blend-multiply" />
      </div>

      {/* The photograph: in the flow and edge to edge below desktop; the full-height left half on desktop. */}
      <div
        data-reveal="develop"
        className="lld-px relative -mt-8 aspect-[4/3] overflow-hidden bg-ink/10 sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:left-0 lg:mt-0 lg:aspect-auto lg:w-[48vw]"
      >
        <Image
          src={standards.image.src}
          alt={standards.image.alt}
          fill
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="lld-px-img object-cover"
        />
        {/* A soft feathered edge into the paper (desktop). */}
        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-r from-transparent to-parchment/60 lg:block" />
      </div>

      {/*
        Text column. Desktop: starts 4vw after the photograph and ends on the page's content edge
        (the shared container's right padding line: max 1920px, clamp(1.25rem, 4.5vw, 6rem) gutters), so there is no dead band on either side.
      */}
      <div className="relative mt-12 px-5 sm:px-6 lg:mt-0 lg:pl-[52vw] lg:pr-[calc(max(0px,(100vw-1920px)/2)+clamp(1.25rem,4.5vw,6rem))]">
        <SectionHeading
          id={`${standards.id}-title`}
          label={standards.label}
          title={standards.title}
          className="lg:max-w-none lg:[&_h2]:text-[clamp(2.75rem,3.6vw,5rem)]"
        />

        <ul className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:mt-[clamp(2.5rem,4.5svh,4rem)] lg:gap-x-[clamp(2.5rem,3.5vw,4.5rem)] lg:gap-y-[clamp(2.25rem,5svh,4rem)]">
          {standards.items.map((item) => (
            <li key={item.title}>
              <span aria-hidden="true" data-reveal="line" className="mb-4 block h-px w-10 bg-gold-deep lg:w-12" />
              <h3 data-reveal="press" className="text-[1.4375rem] leading-[1.25] lg:text-[clamp(1.5rem,1.75vw,2.25rem)]">
                {item.title}
              </h3>
              <p
                data-reveal="press"
                className="mt-2.5 max-w-[40ch] text-ink-muted lg:mt-3 lg:text-[clamp(1.0625rem,1.1vw,1.4375rem)] lg:leading-[1.55]"
              >
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
