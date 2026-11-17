"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { useState } from "react";

import { SectionHeading } from "@/components/ui/section-heading";
import { services } from "@/content/site";
import { cn } from "@/lib/utils";


/**
 * What We Do (coal). Six services, not a sequence, so no numbers.
 * Desktop: a ruled list of the services beside a tall photo panel. Pointing at or focusing
 * a service makes it active: its photo crossfades in and its description shows at the
 * foot of the panel. The list itself never moves, so nothing shifts under the pointer.
 * The first service is active by default (screenshot-safe), and every description stays
 * in the list for screen readers.
 * Below desktop: each service shows its photo small, beside its title and description.
 */
export function Services() {
  const [active, setActive] = useState(0);
  // Counts switches so the light sweep plays on each change of service, never on first paint.
  const [switches, setSwitches] = useState(0);
  const show = (i: number) => {
    if (i === active) return;
    setActive(i);
    setSwitches((n) => n + 1);
  };

  return (
    <section
      id={services.id}
      data-section={services.id}
      aria-labelledby={`${services.id}-title`}
      className="section-screen overflow-hidden bg-coal"
    >
      <div className="container">
        <div className="grid gap-y-12 lg:grid-cols-12 lg:items-center lg:gap-x-12">
          <div className="lg:col-span-7">
            <SectionHeading
              id={`${services.id}-title`}
              label={services.label}
              title={services.title}
              intro={services.intro}
            />

            <ul className="mt-12 border-b border-bronze/35 lg:mt-10">
              {services.items.map((item, i) => {
                const isActive = i === active;
                return (
                  <li
                    key={item.title}
                    className="relative grid grid-cols-[5rem_1fr] gap-x-5 py-6 sm:grid-cols-[6.5rem_1fr] lg:block lg:py-0"
                  >
                    {/* Row rule (was border-top): draws from the left as the section locks in. */}
                    <span aria-hidden="true" data-reveal="line" className="absolute inset-x-0 top-0 h-px bg-bronze/35" />
                    <div data-reveal="image" className="lld-px relative aspect-[3/4] overflow-hidden bg-obsidian lg:hidden">
                      <Image src={item.image.src} alt={item.image.alt} fill sizes="104px" className="lld-px-img object-cover" />
                    </div>
                    <div data-reveal="ledger">
                      <h3 className="text-[1.375rem] leading-[1.2] lg:text-[clamp(1.375rem,0.9vw+0.55rem,2rem)]">
                        {/* Below desktop: plain text, no tab stop (there is no panel to drive). */}
                        <span className="lg:hidden">{item.title}</span>
                        {/* Desktop: a toggle that shows this service in the photo panel. */}
                        <button
                          type="button"
                          aria-pressed={isActive}
                          onMouseEnter={() => show(i)}
                          onFocus={() => show(i)}
                          onClick={() => show(i)}
                          className={cn(
                            "hidden w-full items-center rounded-sm py-3 text-left lg:py-[clamp(0.75rem,1.3svh,1.125rem)] outline-offset-[-2px] transition-colors duration-300 lg:flex",
                            isActive ? "text-parchment" : "text-parchment/60 hover:text-parchment",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "block h-px shrink-0 bg-gold transition-[width,margin] duration-300 ease-out-quint motion-reduce:transition-none",
                              isActive ? "mr-4 w-7" : "mr-0 w-0",
                            )}
                          />
                          {item.title}
                        </button>
                      </h3>
                      <p className="mt-2 max-w-[52ch] text-stone lg:sr-only">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop photo panel. Decorative: the descriptions are already in the list. */}
          <div
            aria-hidden="true"
            data-reveal="doors"
            // Column order would open the panel only after all twelve ledger items (about 2s of an
            // empty right half), so it takes an early slot and opens beside the first rows.
            data-reveal-order="manual"
            style={{ "--i": 2 } as CSSProperties}
            className="lld-px hidden overflow-hidden bg-obsidian lg:absolute lg:inset-y-0 lg:right-0 lg:block lg:w-[40vw]"
          >
            {services.items.map((item, i) => (
              <Image
                key={item.title}
                src={item.image.src}
                alt=""
                fill
                sizes="(min-width: 1320px) 520px, 40vw"
                className={cn(
                  "lld-px-img object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
                  i === active ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
            {/* Switching services: a short left-to-right light sweep across the crossfade (remounts per switch). */}
            {switches > 0 ? <div key={switches} className="svc-sweep pointer-events-none absolute inset-0" /> : null}
            {/* The only darkening: a bottom gradient under the caption. The photos themselves stay untouched. */}
            <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-obsidian/90 via-obsidian/45 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 grid p-8 xl:p-[clamp(2.5rem,3vw,4rem)]">
              {services.items.map((item, i) => (
                <p
                  key={item.title}
                  className={cn(
                    "max-w-[40ch] text-parchment/90 transition-opacity duration-500 lg:text-[clamp(1.0625rem,0.5vw+0.75rem,1.375rem)] [grid-area:1/1] motion-reduce:transition-none",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                >
                  {item.body}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
