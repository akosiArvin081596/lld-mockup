"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Plays each section's reveal once, when the section locks in, as a reading-order cascade.
 *
 * Every `[data-section]` starts without `data-in` (then "pending", then "true"); its `[data-reveal]` children are hidden by
 * motion-hero.css only under `html.js` + `prefers-reduced-motion: no-preference`.
 *
 * On activation the controller:
 * 1. collects the `[data-reveal]` elements that belong to the activating section(s) (sections
 *    activating in the same frame share one cascade, so nested ones such as a Process step
 *    never restart the count), skipping `data-reveal-order="manual"`;
 * 2. sorts them column by column: the left column top to bottom first, then the next column
 *    to the right (see readingOrder);
 * 3. writes `--i` (in units of the 170ms base step, compressed so the last item starts by
 *    1.9s), then sets `data-in` on the next frame so the start styles have applied.
 *
 * "Active" (desktop snapping, lg and at least 640px tall): the section is snapped (its top at
 * the nav bar's bottom edge), or at least 35% of it is visible below the bar, or it fills 55% of the screen, or (tall sections) its top
 * is in the upper quarter. Free scrolling (phones, short screens): its top is 15% into view.
 * Nothing activates while the age gate covers the page.
 *
 * Safety net: 1.5s after activation, nested sections that are on screen are activated too,
 * and anything still hidden once its cascade should be over is shown outright.
 */

const SNAP_QUERY = "(min-width: 1024px) and (min-height: 640px)";
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);
const BASE_STEP_MS = 170;
const LAST_START_MS = 1900;
const SAFETY_MS = 1500;
const ITEM_MS = 1500;

export function RevealController() {
  // Re-scan on client navigation: the layout (and this controller) stays mounted.
  const pathname = usePathname();

  // Tell the pre-paint bootstrap the reveal system is alive (otherwise it adds `reveal-off`
  // after 3s and every section simply shows).
  useEffect(() => {
    document.documentElement.classList.add("reveal-ready");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const snapping = window.matchMedia(SNAP_QUERY);
    const timers: number[] = [];
    let frame = 0;

    const gateOpen = () =>
      root.classList.contains("js") && !root.classList.contains("age-ok") && !root.classList.contains("gate-exempt");

    const isActive = (el: Element) => {
      const vh = window.innerHeight;
      const { top, bottom, height } = el.getBoundingClientRect();
      if (bottom <= 0 || top >= vh || height === 0) return false;
      if (!snapping.matches) return top <= vh * 0.85;
      // Sections snap to the nav bar's bottom edge (scroll-padding-top: var(--header-h)).
      const bar = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      const visible = Math.min(bottom, vh) - Math.max(top, bar);
      return (
        Math.abs(top - bar) <= 2 ||
        Math.abs(top) <= 2 ||
        visible >= height * 0.35 ||
        visible >= vh * 0.55 ||
        (top <= vh * 0.25 && bottom >= vh * 0.5)
      );
    };

    /** The reveal elements owned by `section` (not by a section nested inside it). */
    const ownItems = (section: Element) =>
      Array.from(section.querySelectorAll<HTMLElement>("[data-reveal]")).filter(
        (el) => el.closest("[data-section]") === section && el.dataset.revealOrder !== "manual",
      );

    /**
     * Column-major order: the left column builds top to bottom first, then the next column.
     * Two elements share a column when their horizontal ranges overlap by at least half the
     * narrower one's width. Narrow elements seed the columns, so a wide element (a heading
     * across the page) joins the left-most column it overlaps. Columns go left to right;
     * within a column, top to bottom (ties left to right).
     */
    const readingOrder = (items: HTMLElement[]) => {
      const boxes = items
        // Layout size, not the transformed box: a rule at scaleX(0) still takes part.
        .filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0)
        .map((el) => {
          const r = el.getBoundingClientRect();
          // A scaled-down rule reports a zero-width box: use its layout width from the left edge.
          const width = Math.max(r.width, el.offsetWidth);
          return { el, top: r.top, left: r.left, right: r.left + width, width };
        });
      type Box = (typeof boxes)[number];
      const columns: { left: number; right: number; width: number; items: Box[] }[] = [];
      for (const box of [...boxes].sort((x, y) => x.width - y.width)) {
        const home = columns
          .filter((col) => {
            const overlap = Math.min(box.right, col.right) - Math.max(box.left, col.left);
            return overlap >= 0.5 * Math.min(box.width, col.width);
          })
          .sort((x, y) => x.left - y.left)[0];
        if (home) home.items.push(box);
        else columns.push({ left: box.left, right: box.right, width: box.width, items: [box] });
      }
      return columns
        .sort((x, y) => x.left - y.left)
        .flatMap((col) => col.items.sort((x, y) => x.top - y.top || x.left - y.left).map(({ el }) => el));
    };

    const isStillHidden = (el: HTMLElement) => {
      const target = el.dataset.reveal === "mask" ? el.querySelector<HTMLElement>(".lld-mask > span") : el;
      if (!target) return false;
      const cs = getComputedStyle(target);
      // A fully closed wipe has a 100% inset; revealed elements keep an explicit inset(0).
      return Number(cs.opacity) < 0.05 || cs.clipPath.includes("100%") || (el.dataset.reveal === "mask" && cs.transform !== "none");
    };

    const activate = (candidates: Element[]) => {
      // Claim synchronously ("pending") so no later call, including the safety net, can
      // activate the same section twice. CSS treats only data-in="true" as revealed.
      const sections = candidates.filter((s) => !s.hasAttribute("data-in"));
      if (!sections.length) return;
      sections.forEach((s) => {
        s.setAttribute("data-in", "pending");
        observer.unobserve(s);
      });

      const ordered = readingOrder(sections.flatMap(ownItems));
      const step = ordered.length > 1 ? Math.min(BASE_STEP_MS, LAST_START_MS / (ordered.length - 1)) : 0;
      ordered.forEach((el, n) => el.style.setProperty("--i", String((n * step) / BASE_STEP_MS)));

      requestAnimationFrame(() => sections.forEach((s) => s.setAttribute("data-in", "true")));

      // Safety net 1: nested sections already on screen come in with their parent.
      timers.push(
        window.setTimeout(() => {
          const nested = sections.flatMap((s) =>
            Array.from(s.querySelectorAll("[data-section]:not([data-in])")).filter(isActive),
          );
          activate(nested);
        }, SAFETY_MS),
      );
      // Safety net 2: anything still hidden after its cascade should be over is shown outright.
      const cascadeEnd = (ordered.length - 1) * step + ITEM_MS;
      timers.push(
        window.setTimeout(() => {
          sections
            .flatMap(ownItems)
            .filter(isStillHidden)
            .forEach((el) => el.setAttribute("data-revealed", "force"));
        }, cascadeEnd + SAFETY_MS),
      );
    };

    /**
     * Scroll modes:
     * - "pager": the desktop SectionPager glides between stops (html.pager);
     * - "snap": native CSS snap (home page, lg and 640px tall, pager off, e.g. reduced motion);
     * - "free": phones, short screens, other pages.
     * In pager and snap modes a section plays only once scrolling has come to rest on it
     * ("it locks in, then the effects appear"); in free mode, as it comes into view.
     */
    const mode = () =>
      root.classList.contains("pager")
        ? "pager"
        : snapping.matches && document.querySelector("[data-snap-page]")
          ? "snap"
          : "free";

    /** Locked in: the section under the bar's bottom edge (the hero at the top), or fully on screen. */
    const isLocked = (el: Element) => {
      const bar = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      const { top, bottom, height } = el.getBoundingClientRect();
      if (height === 0) return false;
      const probe = el.matches("[data-section='hero']") ? 1 : bar + 10;
      const underBar = top <= probe && bottom > probe;
      const fullyVisible = top >= bar - 2 && bottom <= window.innerHeight + 2;
      return underBar || fullyVisible;
    };

    /** `settled`: scrolling has come to rest (glide end, scrollend, load, gate dismissed). */
    const evaluate = (settled = false) => {
      frame = 0;
      if (gateOpen()) return;
      const m = mode();
      if (m !== "free" && (!settled || root.classList.contains("is-paging"))) return;
      const test = m === "free" ? isActive : isLocked;
      activate(Array.from(document.querySelectorAll("[data-section]:not([data-in])")).filter(test));
    };
    const settledNow = () => evaluate(true);
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => evaluate(false));
    };

    // The observer only signals that something moved (free mode); `evaluate` decides with fresh geometry.
    const observer = new IntersectionObserver(schedule, { threshold: THRESHOLDS });
    document.querySelectorAll("[data-section]:not([data-in])").forEach((el) => observer.observe(el));
    // Rest signals: the pager's glide end, native scrollend (or a 150ms quiet fallback).
    let quiet = 0;
    const onScrollQuiet = () => {
      window.clearTimeout(quiet);
      quiet = window.setTimeout(settledNow, 150);
    };
    const hasScrollEnd = "onscrollend" in window;
    window.addEventListener("lld:paged", settledNow);
    if (hasScrollEnd) window.addEventListener("scrollend", settledNow);
    else window.addEventListener("scroll", onScrollQuiet, { passive: true });
    window.addEventListener("resize", schedule);
    // First check: the page has not been scrolled yet, so it is at rest.
    requestAnimationFrame(settledNow);

    // Re-check once the age gate is dismissed.
    const gateWatch = new MutationObserver(() => {
      if (!gateOpen()) {
        gateWatch.disconnect();
        settledNow();
      }
    });
    if (gateOpen()) gateWatch.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      gateWatch.disconnect();
      window.removeEventListener("lld:paged", settledNow);
      window.removeEventListener("scrollend", settledNow);
      window.removeEventListener("scroll", onScrollQuiet);
      window.clearTimeout(quiet);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname]);

  return null;
}
