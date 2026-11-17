"use client";

import { useEffect } from "react";

/**
 * Smooth section pager for the home page (desktop, fine pointer, motion welcome).
 *
 * Native mandatory snap moves with the browser's fixed, quick animation. When this pager is
 * active it adds `html.pager` (motion-hero.css then turns CSS snap off) and moves between the
 * same stops itself with a ~1s easeInOutCubic glide:
 * - wheel: one gesture = one section; trackpad inertia is absorbed while gliding and until the
 *   wheel has been quiet for 300ms;
 * - keys: ArrowDown / PageDown / Space next, ArrowUp / PageUp / Shift+Space previous, Home, End;
 * - in-page links (/#id, #id, /?inquiry=...#contact) glide and push the hash;
 * - scrollbar drag, autoscroll or find-in-page: once scrolling settles, realign to the nearest
 *   stop (or the stop holding the focused element).
 * Stops: the hero (y = 0), every `.section-screen`, and every `[data-snap-stop]` (the Process
 * step blocks), each aligned to the nav bar's bottom edge. They are read fresh on every move,
 * so resizes and late font loads never leave stale positions.
 *
 * Inactive (touch, small or short screens, reduced motion, no JS): nothing changes and native
 * CSS snap / free scroll stays in charge.
 *
 * When a glide ends it dispatches `lld:paged` (RevealController starts that section's reveal).
 * Other components can request a glide with `window.dispatchEvent(new CustomEvent("lld:goto",
 * { detail: { element } }))`; they should check `html.pager` first and scroll natively otherwise.
 */

const ACTIVE_QUERY = "(min-width: 1024px) and (min-height: 640px) and (pointer: fine)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const GLIDE_MS = 1000;
const REALIGN_MS = 600;
const WHEEL_THRESHOLD = 40;
const QUIET_MS = 300;
const ALIGN_TOLERANCE = 2;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function SectionPager() {
  useEffect(() => {
    const root = document.documentElement;
    const activeMq = window.matchMedia(ACTIVE_QUERY);
    const reducedMq = window.matchMedia(REDUCED_QUERY);

    let enabled = false;
    let gliding = false;
    let frame = 0;
    let lastWheel = 0;
    let quietRequired = false;
    let accum = 0;
    let settleTimer = 0;
    let lastFocusAt = 0;

    const barHeight = () => document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
    const blocked = () =>
      // The age gate or the mobile menu holds the page.
      (root.classList.contains("js") && !root.classList.contains("age-ok") && !root.classList.contains("gate-exempt")) ||
      root.style.overflow === "hidden";

    /** Where an element's stop is: its top at the bar's bottom edge (the hero at 0). */
    const stopFor = (el: Element) => {
      if (el.matches("[data-section='hero']")) return 0;
      const y = el.getBoundingClientRect().top + window.scrollY - barHeight();
      return Math.max(0, Math.min(maxScroll(), Math.round(y)));
    };

    /** All stops, sorted and de-duplicated. */
    const stops = () => {
      const page = document.querySelector("[data-snap-page]");
      if (!page) return [0];
      const els = [
        ...Array.from(document.querySelectorAll("[data-section='hero']")),
        ...Array.from(document.querySelectorAll(".section-screen, [data-snap-stop]")),
      ].filter((el) => (el as HTMLElement).offsetParent !== null || el.matches("[data-section='hero']"));
      const ys = [0, ...els.map(stopFor)].sort((a, b) => a - b);
      return ys.filter((y, i) => i === 0 || y - ys[i - 1] > ALIGN_TOLERANCE);
    };

    const glideTo = (target: number, duration = GLIDE_MS) => {
      const from = window.scrollY;
      const to = Math.max(0, Math.min(maxScroll(), target));
      if (Math.abs(to - from) <= ALIGN_TOLERANCE) return;
      cancelAnimationFrame(frame);
      gliding = true;
      quietRequired = true;
      root.classList.add("is-paging");
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        window.scrollTo({ top: from + (to - from) * easeInOutCubic(t), behavior: "instant" as ScrollBehavior });
        if (t < 1) {
          frame = requestAnimationFrame(step);
        } else {
          gliding = false;
          root.classList.remove("is-paging");
          // Lock-in: RevealController plays the section that now sits under the bar.
          window.dispatchEvent(new CustomEvent("lld:paged", { detail: { y: to } }));
        }
      };
      frame = requestAnimationFrame(step);
    };

    const go = (dir: 1 | -1) => {
      const y = window.scrollY;
      const list = stops();
      const target =
        dir > 0 ? list.find((s) => s > y + ALIGN_TOLERANCE) : [...list].reverse().find((s) => s < y - ALIGN_TOLERANCE);
      if (target !== undefined) glideTo(target);
    };

    /** True when the event happened inside something that can still scroll that way itself. */
    const scrollsItself = (target: EventTarget | null, dy: number) => {
      let el = target instanceof Element ? target : null;
      while (el && el !== document.body && el !== root) {
        if (el instanceof HTMLSelectElement) return true;
        const { overflowY } = getComputedStyle(el);
        const scrollable = el instanceof HTMLTextAreaElement || overflowY === "auto" || overflowY === "scroll";
        if (scrollable && el.scrollHeight > el.clientHeight + 1) {
          if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
          if (dy < 0 && el.scrollTop > 0) return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || blocked()) return;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(e.deltaX) > Math.abs(dy)) return;
      if (scrollsItself(e.target, dy)) return;
      e.preventDefault();

      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      if (gliding) return;
      if (quietRequired) {
        // Inertia from the last gesture: wait until the wheel has been quiet.
        if (gap < QUIET_MS) return;
        quietRequired = false;
      }
      if (gap > QUIET_MS) accum = 0;
      accum += dy;
      if (Math.abs(accum) >= WHEEL_THRESHOLD) {
        const dir = accum > 0 ? 1 : -1;
        accum = 0;
        go(dir);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || blocked()) return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      let handled = true;
      switch (e.key) {
        case "ArrowDown":
        case "PageDown":
          go(1);
          break;
        case "ArrowUp":
        case "PageUp":
          go(-1);
          break;
        case " ":
          // Space activates buttons; leave it to them.
          if (tag === "BUTTON") return;
          go(e.shiftKey ? -1 : 1);
          break;
        case "Home":
          glideTo(0);
          break;
        case "End":
          glideTo(maxScroll());
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };

    /** In-page links on the home page glide to their section and push the URL. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || blocked()) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!anchor || (anchor as HTMLAnchorElement).target === "_blank") return;
      const url = new URL(anchor.getAttribute("href") ?? "", window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      // preventDefault stops Next's Link; other click listeners (the inquiry preselect) still run.
      e.preventDefault();
      history.pushState(history.state, "", url.pathname + url.search + url.hash);
      glideTo(stopFor(el));
    };

    const onPop = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      glideTo(el ? stopFor(el) : 0);
    };

    const onGoto = (e: Event) => {
      const el = (e as CustomEvent<{ element?: Element }>).detail?.element;
      if (el) glideTo(stopFor(el));
    };

    const onFocusIn = () => {
      lastFocusAt = performance.now();
    };

    /** After a scrollbar drag, autoscroll or find-in-page: settle on the nearest stop. */
    const realign = () => {
      if (gliding || blocked()) return;
      const y = window.scrollY;
      const list = stops();
      if (list.some((s) => Math.abs(s - y) <= ALIGN_TOLERANCE)) return;
      // Keyboard focus moved the page: keep the focused element's section in view.
      const focused = document.activeElement;
      if (performance.now() - lastFocusAt < 800 && focused && focused !== document.body) {
        const top = focused.getBoundingClientRect().top + y - barHeight();
        const holder = [...list].reverse().find((s) => s <= top + ALIGN_TOLERANCE);
        if (holder !== undefined) return glideTo(holder, REALIGN_MS);
      }
      const nearest = list.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a), list[0]);
      glideTo(nearest, REALIGN_MS);
    };
    const onScroll = () => {
      if (gliding) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(realign, 150);
    };
    const hasScrollEnd = "onscrollend" in window;

    const enable = () => {
      if (enabled) return;
      enabled = true;
      root.classList.add("pager");
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKey);
      document.addEventListener("click", onClick, true);
      window.addEventListener("popstate", onPop);
      window.addEventListener("lld:goto", onGoto);
      document.addEventListener("focusin", onFocusIn);
      if (hasScrollEnd) window.addEventListener("scrollend", realign);
      else window.addEventListener("scroll", onScroll, { passive: true });
    };
    const disable = () => {
      if (!enabled) return;
      enabled = false;
      cancelAnimationFrame(frame);
      gliding = false;
      window.clearTimeout(settleTimer);
      root.classList.remove("pager", "is-paging");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("lld:goto", onGoto);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("scrollend", realign);
      window.removeEventListener("scroll", onScroll);
    };
    const evaluate = () => (activeMq.matches && !reducedMq.matches ? enable() : disable());

    evaluate();
    activeMq.addEventListener("change", evaluate);
    reducedMq.addEventListener("change", evaluate);
    return () => {
      activeMq.removeEventListener("change", evaluate);
      reducedMq.removeEventListener("change", evaluate);
      disable();
    };
  }, []);

  return null;
}
