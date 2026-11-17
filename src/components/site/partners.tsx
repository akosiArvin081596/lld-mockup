import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { partners } from "@/content/site";


/**
 * Partners (coal). Producers on one side, the trade on the other.
 * Desktop: two panels side by side on one top line. Each panel sets its photo beside its
 * text, and the text rows (title, body, points, CTA, then a flexible spacer) share grid tracks across both panels
 * through subgrid, so every row and both CTAs line up. The photos fill the panel height,
 * which is sized from the viewport.
 * Below desktop: the panels stack, photo above text.
 * On short desktop screens (760px tall or less) the photo column narrows so every row stays
 * on one line and the section still fits one screen.
 * The photo eases in slowly while its panel is hovered or its CTA is focused.
 * CTA hrefs carry the inquiry type the contact form preselects; keep them as in site.ts.
 */
export function Partners() {
  return (
    <section
      id={partners.id}
      data-section={partners.id}
      aria-labelledby={`${partners.id}-title`}
      className="section-screen overflow-hidden bg-coal"
    >
      <div className="container">
        <SectionHeading id={`${partners.id}-title`} label={partners.label} title={partners.title} />

        <div className="relative mt-14 grid gap-y-20 md:mt-16 lg:mt-10 lg:min-h-[min(62svh,48rem,calc(100svh-20.5rem))] lg:grid-cols-2 lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-x-14 lg:gap-y-0 xl:gap-x-20">
          {/* Centre divider between the two sides (desktop). Draws top to bottom in the reveal. */}
          <span
            aria-hidden="true"
            data-reveal="divider"
            className="pointer-events-none absolute inset-y-0 left-[calc(50%-0.5px)] hidden w-px bg-bronze/35 lg:block"
          />
          {partners.panels.map((panel) => (
            <article
              key={panel.key}
              aria-labelledby={`partners-${panel.key}-title`}
              className="group flex flex-col lg:row-span-5 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:grid-rows-subgrid lg:gap-x-8 lg:[@media(max-height:760px)]:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)] lg:[@media(max-height:760px)]:gap-x-6"
            >
              <div
                data-reveal="side"
                className="lld-px relative aspect-[4/3] overflow-hidden bg-obsidian sm:aspect-[16/10] lg:col-start-1 lg:row-span-5 lg:row-start-1 lg:aspect-auto">
                <Image
                  src={panel.image.src}
                  alt={panel.image.alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, 100vw"
                  className="lld-px-img object-cover transition-transform duration-[1200ms] ease-out-quint group-focus-within:scale-[1.045] group-hover:scale-[1.045] motion-reduce:transition-none motion-reduce:group-focus-within:scale-100 motion-reduce:group-hover:scale-100"
                />
              </div>

              <h3
                id={`partners-${panel.key}-title`}
                data-reveal="up"
                className="mt-8 text-[1.625rem] leading-[1.2] lg:col-start-2 lg:row-start-1 lg:mt-0 lg:text-[clamp(1.5rem,0.9vw+0.75rem,2.25rem)]"
              >
                {panel.title}
              </h3>
              <p data-reveal="up" className="mt-4 max-w-[52ch] text-stone lg:col-start-2 lg:row-start-2 lg:mt-3 lg:text-[clamp(1.0625rem,0.45vw+0.7rem,1.3125rem)]">{panel.body}</p>

              <ul className="mt-6 space-y-2 lg:col-start-2 lg:row-start-3 lg:mt-5 lg:text-[clamp(1.0625rem,0.45vw+0.7rem,1.3125rem)]">
                {panel.points.map((point) => (
                  <li key={point} data-reveal="up" className="flex items-baseline gap-4 text-parchment/90">
                    <span aria-hidden="true" className="h-px w-4 shrink-0 translate-y-[-0.3em] bg-gold" />
                    {point}
                  </li>
                ))}
              </ul>

              <div data-reveal="up" className="mt-8 lg:col-start-2 lg:row-start-4 lg:mt-6">
                <Button asChild variant="outline" size="md">
                  <Link href={panel.cta.href}>{panel.cta.label}</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
