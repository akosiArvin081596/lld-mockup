"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

import { SectionHeading } from "@/components/ui/section-heading";
import { processSection } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * "From Cellar to Counter": a pinned scrollytelling chapter.
 *
 * Desktop (lg+): the section is four snap blocks tall. The blocks are invisible scroll and snap
 * targets; one sticky stage (the screen minus the nav bar, pinned under the bar) holds the
 * heading, a vertical stepper and the photo frame while the four snaps advance the step.
 * - Stepper: inactive steps are compact rows (number and title, stone, AA). The active step
 *   expands to its body and points; a thin gold line beside the rows fills to it.
 *   Each row is a button that scrolls to its step.
 * - Photo: the new step wipes in left to right and slowly pushes in; the caption line fills.
 * Active step = the snap block whose top sits closest to the nav bar's bottom edge, among
 * blocks in the upper 40% of the screen (step 1 by default and before any scroll).
 *
 * Below lg: steps stack naturally, each with its photo; nothing is pinned or snapped.
 * Reduced motion: no zoom, crossfade, expand or reveal animation; switches are instant.
 */
export function Process() {
  // Active step plus the one before it: the new photo wipes in over the previous one.
  const [steps, setSteps] = useState({ active: 0, prev: -1 });
  const active = steps.active;
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const columnRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  /** Left column padding that lines it up with the photo frame (top) and caption (bottom). */
  const [align, setAlign] = useState({ top: 0, bottom: 0 });

  // Compose the left column to the photo's extents: heading on the photo's top edge, stepper
  // ending on the caption line. Only when the column's content fits that span; otherwise the
  // column keeps the full stage height (short screens).
  useEffect(() => {
    const column = columnRef.current;
    const figure = figureRef.current;
    if (!column || !figure || !("ResizeObserver" in window)) return;
    const measure = () => {
      const col = column.getBoundingClientRect();
      const fig = figure.getBoundingClientRect();
      if (!col.height || !fig.height) return;
      // The column's real content: the heading block and the stepper list (not their stretched wrappers).
      const heading = column.querySelector("header")?.offsetHeight ?? 0;
      const list = column.querySelector("ol")?.offsetHeight ?? 0;
      const content = heading + list + 32;
      const top = Math.max(0, Math.round(fig.top - col.top));
      const bottom = Math.max(0, Math.round(col.bottom - fig.bottom));
      const fits = content + 24 <= col.height - top - bottom;
      setAlign((prev) => {
        const next = fits ? { top, bottom } : { top: 0, bottom: 0 };
        return prev.top === next.top && prev.bottom === next.bottom ? prev : next;
      });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(column);
    ro.observe(figure);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      const limit = window.innerHeight * 0.4;
      let best = 0;
      let bestDistance = Infinity;
      blockRefs.current.forEach((el, n) => {
        if (!el || el.offsetParent === null) return; // hidden below lg
        const top = el.getBoundingClientRect().top;
        if (top > limit) return;
        const distance = Math.abs(top - bar);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = n;
        }
      });
      setSteps((cur) => (cur.active === best ? cur : { active: best, prev: cur.active }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scrollend", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("scrollend", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = (n: number) => {
    const block = blockRefs.current[n];
    if (!block) return;
    // The desktop pager glides with the page's own easing; otherwise scroll natively.
    if (document.documentElement.classList.contains("pager")) {
      window.dispatchEvent(new CustomEvent("lld:goto", { detail: { element: block } }));
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    block.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const count = processSection.steps.length;
  const total = String(count).padStart(2, "0");
  const current = processSection.steps[active];

  return (
    <section
      id={processSection.id}
      aria-labelledby={`${processSection.id}-title`}
      data-section="process"
      className="relative snap-start bg-obsidian py-24 md:py-32 lg:py-0"
    >
      {/* ---------- Desktop: pinned stage over four invisible snap blocks ---------- */}
      <div className="hidden lg:block">
        <div className="sticky top-[var(--header-h)] z-10 h-[calc(100svh-var(--header-h))]">
          <div className="container grid h-full grid-cols-12 gap-x-16 pb-12 pt-10 xl:gap-x-24">
            <div
              ref={columnRef}
              className="col-span-5 flex min-h-0 flex-col"
              style={{ paddingTop: align.top, paddingBottom: align.bottom }}
            >
              <SectionHeading id={`${processSection.id}-title`} label={processSection.label} title={processSection.title} />

              <div className={cn("flex min-h-0 flex-1 flex-col pt-8 [@media(max-height:760px)]:pt-4", "justify-end")}>
                {/* Wrapper carries the row size; the progress line sits beside the list, not inside it. */}
                {/* Signature "The route": on lock-in a gold line travels down the track and each
                    step number lights as it passes (motion-hero.css). */}
                <div data-reveal="route" className="lld-stepper relative">
                  {/* Progress line: a track beside the rows, filled to the active step's marker. */}
                  <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[7px]">
                    <span className="lld-route-track absolute bottom-0 left-[3px] top-[calc(var(--row)/2)] w-px bg-stone/20" />
                    <span
                      className="absolute left-[3px] top-[calc(var(--row)/2)] w-px bg-gold transition-[height] duration-1000 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none"
                      style={{ height: `calc(var(--row) * ${active})` }}
                    />
                    <span className="lld-route-line absolute bottom-0 left-[3px] top-[calc(var(--row)/2)] w-px bg-gilt" />
                  </div>

                <ol className="relative">
                  {processSection.steps.map((step, n) => {
                    const isActive = n === active;
                    return (
                      <li key={step.number} data-reveal="up" className="relative pl-9">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute left-0 top-[calc(var(--row)/2-3.5px)] h-[7px] w-[7px] rotate-45 border transition-colors duration-500",
                            n <= active ? "border-gold bg-gold" : "border-stone/50 bg-obsidian",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => goTo(n)}
                          aria-current={isActive ? "step" : undefined}
                          className="group flex h-[var(--row)] w-full items-center gap-5 text-left"
                        >
                          <span
                            style={{ "--n": n } as CSSProperties}
                            className={cn(
                              "lld-route-num lld-stepper-num w-7 font-medium tabular-nums transition-colors duration-500",
                              isActive ? "text-gold" : "text-stone",
                            )}
                          >
                            {step.number}
                          </span>
                          <span
                            className={cn(
                              "lld-stepper-title font-serif-text leading-none transition-colors duration-500",
                              isActive ? "text-parchment" : "text-stone group-hover:text-parchment/85",
                            )}
                          >
                            {step.title}
                          </span>
                        </button>

                        {/* Expands for the active step (grid rows 0fr to 1fr). */}
                        <div
                          className="grid transition-[grid-template-rows] duration-1000 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none"
                          style={{ gridTemplateRows: isActive ? "1fr" : "0fr" }}
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div
                              className={cn(
                                "pb-5 pl-12 transition-opacity duration-700 motion-reduce:transition-none",
                                isActive ? "opacity-100 delay-200" : "opacity-0",
                              )}
                            >
                              <p className="lld-stepper-copy max-w-[34rem] leading-relaxed text-stone">
                                {step.body}
                              </p>
                              <ul className="mt-3 space-y-1.5">
                                {step.points.map((point) => (
                                  <li key={point} className="lld-stepper-copy flex items-baseline gap-3 text-parchment/85">
                                    <span aria-hidden="true" className="h-px w-3 shrink-0 translate-y-[-0.3em] bg-gold" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                </div>
              </div>
            </div>

            <div className="col-span-7 flex min-h-0">
              {/* Fills the stage: the frame takes every pixel of height left after the caption. */}
              <figure ref={figureRef} className="flex h-full w-full flex-col">
                {/* The frame stays put; the photo slides in from the left behind it (slide-frame). */}
                <div data-reveal="slide-frame" className="lld-px grain relative min-h-0 flex-1 overflow-hidden bg-char">
                  <div className="lld-frame-inner absolute inset-0">
                  {processSection.steps.map((step, n) => (
                    <Image
                      key={step.number}
                      src={step.image.src}
                      alt={n === active ? step.image.alt : ""}
                      aria-hidden={n === active ? undefined : true}
                      fill
                      sizes="(min-width: 1920px) 1000px, 55vw"
                      // Step change: the new photo wipes in left to right over the previous one.
                      className={cn(
                        "lld-px-img object-cover motion-reduce:transition-none motion-reduce:transform-none",
                        n === active
                          ? "z-[2] scale-[1.07] [clip-path:inset(0_0_0_0)] [transition:clip-path_1000ms_cubic-bezier(0.33,1,0.68,1),transform_9s_cubic-bezier(0.2,0,0.2,1)]"
                          : n === steps.prev
                            ? "z-[1] scale-100 [clip-path:inset(0_0_0_0)] [transition:transform_9s_cubic-bezier(0.2,0,0.2,1)]"
                            : "z-0 scale-100 [clip-path:inset(0_100%_0_0)] [transition:none]",
                      )}
                    />
                  ))}
                  </div>
                </div>
                {/* Caption entrance: the number slides in, the line draws left to right, then the title. */}
                <figcaption className="mt-5 flex items-center gap-5 text-[0.9375rem]">
                  <span data-reveal="up" className="font-medium tabular-nums text-gold">{current.number}</span>
                  <span aria-hidden="true" data-reveal="line" className="relative h-px flex-1 bg-stone/25">
                    <span
                      className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-1000 ease-[cubic-bezier(0.33,1,0.68,1)] motion-reduce:transition-none"
                      style={{ width: `${((active + 1) / count) * 100}%` }}
                    />
                  </span>
                  <span data-reveal="up" className="text-stone">{current.title}</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* Invisible snap targets: they give the chapter its height (four screens under the bar). */}
        <div aria-hidden="true" className="-mt-[calc(100svh-var(--header-h))]">
          {processSection.steps.map((step, n) => (
            <div
              key={step.number}
              ref={(el) => {
                blockRefs.current[n] = el;
              }}
              data-snap-stop
              className="pointer-events-none h-[calc(100svh-var(--header-h))] snap-start"
            />
          ))}
        </div>
      </div>

      {/* ---------- Below lg: steps stack, each with its photo ---------- */}
      <div className="container lg:hidden">
        <SectionHeading id={`${processSection.id}-title-m`} label={processSection.label} title={processSection.title} />
        <ol className="mt-12">
          {processSection.steps.map((step) => (
            <li key={step.number} data-section={`process-${step.number}`} className="py-10 sm:py-12">
              <div data-reveal="image" className="lld-px relative mb-8 aspect-[4/3] overflow-hidden bg-char">
                <Image
                  src={step.image.src}
                  alt={step.image.alt}
                  fill
                  sizes="(min-width: 640px) 90vw, 100vw"
                  className="lld-px-img object-cover"
                />
              </div>
              <p data-reveal="up" className="text-[0.875rem] font-medium tabular-nums text-gold">
                {step.number}
                <span className="text-stone"> / {total}</span>
              </p>
              <h3 data-reveal="up" className="mt-2.5 text-4xl leading-none sm:text-[2.75rem]">
                {step.title}
              </h3>
              <p data-reveal="up" className="mt-5 max-w-md text-base leading-relaxed text-stone sm:text-[1.0625rem]">
                {step.body}
              </p>
              <ul data-reveal="up" className="mt-4 space-y-1.5">
                {step.points.map((point) => (
                  <li key={point} className="flex items-baseline gap-3 text-parchment/85">
                    <span aria-hidden="true" className="h-px w-3 shrink-0 translate-y-[-0.3em] bg-gold" />
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
