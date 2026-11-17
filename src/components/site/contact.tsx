import type { CSSProperties } from "react";
import Image from "next/image";

import { contact, contactDetails } from "@/content/site";
import { cn } from "@/lib/utils";

import { ContactForm } from "./contact/contact-form";

type DetailKey = keyof typeof contactDetails;

const detailHref: Record<DetailKey, (value: string) => string | undefined> = {
  email: (v) => `mailto:${v}`,
  phone: (v) => `tel:${v.replace(/[^\d+]/g, "")}`,
  location: () => undefined,
};

/**
 * Contact, as a split screen (lg and up): the still life (envelope, wax seal, pen and a tumbler
 * of amber on walnut) fills the left half to the window edge, with the heading set over a soft
 * bottom gradient; the form sits on solid coal on the right. Below lg the photograph becomes a
 * banner above the form.
 *
 * Signature "Lamp on" (motion-hero.css, CONTRACT section 9): the still life brightens from 0.45
 * as a warm light sweeps across it left to right, the heading writes in, the intro slides in,
 * then the form fields appear row by row with a gold underline drawing left to right. Everything is visible without JS or with reduced motion.
 */
/**
 * Big screens (about 1700 x 1000 and up): the form panel scales up a step so the right half is
 * as full as the photograph. Scoped descendant variants, so the form component is untouched.
 */
// Written out in full: Tailwind only generates class names it can read literally.
const bigPanel = [
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_label]:text-[1.0625rem]",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_input:not([type=checkbox])]:h-14",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_select]:h-14",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_input]:text-[1.0625rem]",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_select]:text-[1.0625rem]",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_textarea]:min-h-[9rem]",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_textarea]:text-[1.0625rem]",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_form_.grid]:gap-y-6",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_button[type=submit]]:h-16",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_button[type=submit]]:px-12",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_button[type=submit]]:text-[1.0625rem]",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_dt]:text-[1.0625rem]",
  "[@media(min-width:1700px)_and_(min-height:1000px)]:[&_dd]:text-[1rem]",
].join(" ");

export function Contact() {
  // Only details that have been filled in are shown.
  const details = (Object.keys(contactDetails) as DetailKey[])
    .map((key) => ({ key, value: contactDetails[key] as string }))
    .filter((d) => d.value.trim() !== "");

  return (
    <section
      id={contact.id}
      aria-labelledby={`${contact.id}-title`}
      data-section="contact"
      className="section-screen overflow-clip bg-coal py-0 lg:py-0"
    >
      <div className="grid flex-1 lg:grid-cols-2">
        {/* The photograph, with the heading over its lower edge. */}
        {/* At lg it holds one screen and stays put if the form grows (for example with every error showing). */}
        <div className="relative flex min-h-[29rem] flex-col justify-end sm:min-h-[34rem] lg:sticky lg:top-[var(--header-h)] lg:h-[calc(100svh-var(--header-h))] lg:min-h-0 lg:self-start">
          {/* Signature "Lamp on": the still life brightens while a warm light sweeps across it. */}
          <div data-reveal="lamp" className="absolute inset-0 overflow-hidden bg-char">
            <Image
              src="/media/contact-still.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[44%_50%] lg:object-[42%_50%]"
            />
            <div aria-hidden="true" className="lld-lamp-sweep" />
            {/* Only the lower edge is shaded, so the heading reads at AA and the still life stays clear.
                Phones get a deeper, taller shade: the heading sits over brighter parts of the photo there. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-obsidian from-[0%] via-obsidian/[0.82] via-[55%] to-obsidian/0 lg:h-[50%] lg:from-obsidian/[0.92] lg:via-obsidian/60 lg:via-50%"
            />
          </div>

          <header className="relative px-6 pb-8 pt-24 sm:px-10 sm:pb-12 lg:px-14 lg:pb-14 xl:px-20 xl:pb-16 [@media(min-width:1024px)_and_(max-height:800px)]:pb-10">
            <h2
              id={`${contact.id}-title`}
              data-reveal="write"
              className="text-[2.5rem] leading-[1.04] text-parchment sm:text-[3.25rem] lg:text-[3.25rem] xl:text-[4rem]"
            >
              {contact.title}
            </h2>
            <p data-reveal="up" className="mt-4 max-w-[34rem] text-[1.0625rem] leading-relaxed text-parchment/[0.88] sm:text-lg lg:mt-5">
              {contact.intro}
            </p>
          </header>
        </div>

        {/* The form, on solid coal. */}
        <div
          data-reveal="form"
          className={cn(bigPanel, "flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-8 xl:px-20 xl:py-10 [@media(min-width:1024px)_and_(max-height:800px)]:py-5")}
        >
          <div className="w-full max-w-[40rem] lg:mx-auto [@media(min-width:1700px)_and_(min-height:1000px)]:max-w-[50rem]">
            <ContactForm />

            <dl style={{ "--row": 5 } as CSSProperties} className="lld-row mt-8 grid gap-x-8 gap-y-4 border-t border-bronze/30 pt-6 sm:grid-cols-2 lg:mt-6 lg:pt-5 [@media(min-width:1024px)_and_(max-height:800px)]:mt-4 [@media(min-width:1024px)_and_(max-height:800px)]:pt-4">
              {contact.guidance.map((item) => (
                <div key={item.title}>
                  <dt className="text-[0.9375rem] font-medium text-parchment/90">{item.title}</dt>
                  <dd className="mt-1 text-[0.875rem] leading-relaxed text-stone [@media(min-width:1024px)_and_(max-height:800px)]:leading-snug">{item.body}</dd>
                </div>
              ))}
            </dl>

            {details.length > 0 ? (
              <dl style={{ "--row": 6 } as CSSProperties} className="lld-row mt-6 flex flex-wrap gap-x-10 gap-y-3">
                {details.map(({ key, value }) => {
                  const href = detailHref[key](value);
                  return (
                    <div key={key}>
                      <dt className="text-[0.875rem] text-stone">{contact.detailLabels[key]}</dt>
                      <dd className="mt-1 text-[1rem] text-parchment">
                        {href ? (
                          <a
                            href={href}
                            className="underline decoration-bronze underline-offset-4 transition-colors duration-300 hover:text-gold"
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
