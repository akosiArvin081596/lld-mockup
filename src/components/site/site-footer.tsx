import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { brand, contactDetails, footer, nav } from "@/content/site";

const linkClass =
  "rounded-sm text-parchment/75 underline decoration-transparent underline-offset-4 transition-colors duration-300 hover:text-parchment hover:decoration-gold/60 focus-visible:text-parchment";

/** An explicit reveal slot (motion-hero.css / motion-sections.css), in units of --motion-step. */
const slot = (i: number) => ({ "data-reveal-order": "manual", style: { "--i": i } as CSSProperties });

/**
 * Site footer: the closing screen, a bookend to the hero.
 * The hero still runs full bleed under an obsidian gradient (darker toward the bottom). The
 * official crest, the closing line and the call to action sit in the centre; a full-width
 * band at the bottom carries the links, any published contact details and the legal row.
 * Desktop: one full screen below the nav bar (`section-screen`), so the last snap shows only
 * the footer. Below desktop it takes its natural height and stacks.
 *
 * Reveal order is scripted (manual slots) so it reads as one closing sequence: the image
 * fades up, the crest seals with its glint, the title writes in, the body and CTA slide in,
 * then the bottom band. Column ordering would otherwise pull the bottom-left links first.
 */
export function SiteFooter() {
  const { closing } = footer;
  const phone: string = contactDetails.phone;
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";
  const hasContact = Boolean(contactDetails.email || contactDetails.phone || contactDetails.location);
  const words = closing.title.split(" ");

  return (
    <footer
      data-section="footer"
      aria-labelledby="footer-closing-title"
      className="section-screen overflow-hidden bg-obsidian max-lg:min-h-0"
    >
      {/* The hero still, full bleed, under a strong obsidian gradient. */}
      <div aria-hidden="true" data-reveal="fade" {...slot(0)} className="pointer-events-none absolute inset-0">
        <Image src={closing.image.src} alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian/75 via-obsidian/80 to-obsidian/[0.97]" />
      </div>

      <div className="container relative flex flex-1 flex-col">
        {/* Centre: crest, closing line, call to action. */}
        <div className="my-auto flex flex-col items-center py-12 text-center lg:py-0">
          <div data-reveal="seal" {...slot(1)} className="relative w-fit">
            <Link href="/" aria-label={`${brand.name}, home`} className="block rounded-sm">
              <Image
                src="/brand/crest-full.png"
                alt={footer.crestAlt}
                // Display-size width/height (no `sizes`): Next serves a small 1x/2x srcset, and the URL
                // differs from the hero's priority crest, so its LCP check never confuses the two.
                width={340}
                height={385}
                loading="lazy"
                className="h-auto w-[clamp(9rem,min(15vw,24svh),21.25rem)]"
              />
            </Link>
            {/* Seal: one gold glint crosses the crest once it has emerged (the hero's lld-glint). */}
            <div aria-hidden="true" className="lld-glint seal-glint">
              <Image
                src="/brand/crest-full.png"
                alt=""
                width={340}
                height={385}
                loading="lazy"
                className="h-auto w-[clamp(9rem,min(15vw,24svh),21.25rem)]"
              />
            </div>
          </div>

          <h2
            id="footer-closing-title"
            data-reveal="mask"
            {...slot(2.5)}
            className="mt-[clamp(1.5rem,3.5svh,2.75rem)] text-[clamp(2.25rem,4vw,4.5rem)] leading-[1.06]"
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
          <p data-reveal="up" {...slot(4)} className="mt-4 max-w-[44ch] text-[clamp(1.0625rem,1.15vw,1.375rem)] text-parchment/85">
            {closing.body}
          </p>
          <div data-reveal="up" {...slot(4.75)} className="mt-[clamp(1.5rem,3svh,2.25rem)]">
            <Button asChild variant="primary" size="lg">
              <Link href={closing.cta.href}>{closing.cta.label}</Link>
            </Button>
          </div>
        </div>

        {/* Bottom band: links, contact details when published, then the legal row under a gold rule. */}
        <div className="mt-auto">
          <div className="flex flex-col gap-6 pb-6 text-[0.9375rem] lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <nav aria-labelledby="footer-nav-heading" data-reveal="up" {...slot(6)}>
              <h2 id="footer-nav-heading" className="sr-only">
                {footer.navHeading}
              </h2>
              <ul className="flex flex-wrap gap-x-7 gap-y-2">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {hasContact ? (
              <div data-reveal="up" {...slot(6.5)}>
                <h2 className="sr-only">{footer.contactHeading}</h2>
                <ul className="flex flex-wrap gap-x-7 gap-y-2">
                  {contactDetails.email ? (
                    <li>
                      <a href={`mailto:${contactDetails.email}`} className={linkClass}>
                        {contactDetails.email}
                      </a>
                    </li>
                  ) : null}
                  {phone ? (
                    <li>
                      <a href={telHref} className={linkClass}>
                        {phone}
                      </a>
                    </li>
                  ) : null}
                  {contactDetails.location ? <li className="text-parchment/75">{contactDetails.location}</li> : null}
                </ul>
              </div>
            ) : null}

            <nav aria-labelledby="footer-legal-heading" data-reveal="up" {...slot(7)}>
              <h2 id="footer-legal-heading" className="sr-only">
                {footer.legalHeading}
              </h2>
              <ul className="flex flex-wrap gap-x-7 gap-y-2">
                {footer.legalLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div data-reveal="line" {...slot(7.75)} aria-hidden="true" className="h-px w-full bg-gold/45" />
          <div
            data-reveal="fade"
            {...slot(8.5)}
            className="flex flex-col gap-3 pt-6 text-[0.8125rem] leading-relaxed text-stone md:flex-row md:items-baseline md:justify-between md:gap-10"
          >
            <p>
              <span className="font-serif-text text-[0.9375rem] italic text-parchment/90">{footer.responsibility}</span>
              <span className="mt-1 block md:ml-3 md:mt-0 md:inline">{footer.ageNotice}</span>
            </p>
            <p>
              {footer.copyright}
              <span className="mt-1 block md:ml-4 md:mt-0 md:inline">
                {footer.credit.prefix}{" "}
                <a
                  href={footer.credit.href}
                  target="_blank"
                  rel="noopener"
                  className="text-parchment/80 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gilt hover:decoration-gilt"
                >
                  {footer.credit.name}
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
