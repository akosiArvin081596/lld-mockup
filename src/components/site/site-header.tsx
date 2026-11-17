"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { headerCta, headerUi, nav } from "@/content/site";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 40;

/** The official artwork lockup: crest monogram beside the official lettering. */
function Logo({ className, tabbable = true }: { className?: string; tabbable?: boolean }) {
  return (
    <Link
      href="/"
      tabIndex={tabbable ? undefined : -1}
      aria-label={headerUi.logoAlt}
      className={cn("inline-flex shrink-0 items-center gap-2.5", className)}
    >
      {/* Pre-sharpened 2x renders shown at half their pixel size; width/height match the display size (no layout shift). */}
      <Image
        src="/brand/official-monogram-88.png"
        alt=""
        width={51}
        height={44}
        unoptimized
        className="h-11 w-[50.5px]"
      />
      <Image
        src="/brand/official-wordmark-64.png"
        alt=""
        width={124}
        height={32}
        unoptimized
        className="h-8 w-[124px]"
      />
    </Link>
  );
}

/** Two hairlines that read as "menu" without an icon font. */
function MenuGlyph({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative block h-3 w-6">
      <span
        className={cn(
          "absolute left-0 top-0 h-px w-6 bg-current transition-transform duration-300 ease-out-quint motion-reduce:transition-none",
          open && "translate-y-1.5 rotate-45",
        )}
      />
      <span
        className={cn(
          "absolute bottom-0 left-0 h-px w-6 bg-current transition-transform duration-300 ease-out-quint motion-reduce:transition-none",
          open && "-translate-y-1.5 -rotate-45",
        )}
      />
    </span>
  );
}

/** Underline that grows from the left on hover, focus and for the current section. */
const underline =
  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 after:ease-out-quint hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=true]:after:scale-x-100 motion-reduce:after:transition-none";

const sectionIds = nav.map((item) => item.href.split("#")[1]).filter(Boolean);

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  // On the home page the hero carries the crest, so the header logo waits until it scrolls away.
  const [crestOut, setCrestOut] = useState(!isHome);
  const [current, setCurrent] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Fresh load with a hash (e.g. /#contact): the browser jumps before fonts and images settle,
  // and content above can still shift. Re-align the target under the bar once the page has
  // settled, unless the visitor has already scrolled or interacted.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let touched = false;
    const touch = () => {
      touched = true;
    };
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true, once: true }));
    const align = () => {
      const target = document.getElementById(id);
      if (touched || !target) return;
      const bar = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      const top = target.getBoundingClientRect().top;
      if (Math.abs(top - bar) > 1) window.scrollTo({ top: window.scrollY + top - bar, behavior: "instant" as ScrollBehavior });
    };
    const timers: number[] = [];
    const settle = () => [0, 400, 1200].forEach((ms) => timers.push(window.setTimeout(align, ms)));
    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });
    document.fonts?.ready.then(align).catch(() => {});
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("load", settle);
      events.forEach((e) => window.removeEventListener(e, touch));
    };
  }, []);

  // Solid after a little scroll. Pages without the hero are always solid.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Show the header logo once the hero crest is out of view (always, off the home page).
  useEffect(() => {
    const crest = isHome ? document.getElementById("hero-crest") : null;
    if (!crest || !("IntersectionObserver" in window)) {
      setCrestOut(true);
      return;
    }
    // The crest counts as gone once it has passed under the bar (its real rendered height).
    const bar = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
    const observer = new IntersectionObserver(([entry]) => setCrestOut(!entry.isIntersecting), {
      rootMargin: `-${bar}px 0px 0px 0px`,
    });
    observer.observe(crest);
    return () => observer.disconnect();
  }, [isHome]);

  // Highlight the nav item for the section under the bar: the one containing y = bar + 10px.
  // (Sections snap to the bar's bottom edge, so this is the section that is locked in.)
  useEffect(() => {
    if (!isHome) {
      setCurrent(null);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      const probe = bar + 10;
      let found: string | null = null;
      for (const id of sectionIds) {
        const rect = document.getElementById(id)?.getBoundingClientRect();
        if (rect && rect.top <= probe && rect.bottom > probe) {
          found = id;
          break;
        }
      }
      setCurrent(found);
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
  }, [isHome]);

  const close = useCallback((restoreFocus = true) => {
    // Release the scroll lock synchronously so an anchor jump in the same click can scroll.
    document.documentElement.style.overflow = "";
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus({ preventScroll: true });
  }, []);

  /**
   * After a menu link: close, then move focus to the link's target section (made focusable
   * with tabindex=-1) so keyboard and screen-reader users continue from there, not from BODY.
   * Falls back to <main>. preventScroll: the navigation does the scrolling.
   */
  const closeToTarget = useCallback(
    (href: string) => {
      close(false);
      const id = href.split("#")[1];
      requestAnimationFrame(() => {
        const target = (id && document.getElementById(id)) || document.getElementById("main");
        if (!target) return;
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    },
    [close],
  );

  // Mobile sheet: scroll lock, focus trap, Esc to close, close when the viewport reaches lg.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";

    const sheet = sheetRef.current;
    const focusables = () =>
      Array.from(sheet?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
    focusables()[0]?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !sheet?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !sheet?.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && close(false);

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open, close]);

  const solid = scrolled || !isHome;
  const showLogo = crestOut || !isHome;

  return (
    <header
      data-site-header
      className={cn("fixed inset-x-0 top-0 z-50 h-[var(--header-h)]", isHome && "lld-header-in lld-seq")}
    >
      {/* Two stacked backgrounds crossfade: a soft top-down shade over the hero, then solid obsidian. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-obsidian/80 via-obsidian/35 to-obsidian/0 transition-opacity duration-300",
          solid && "opacity-0",
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 border-b border-bronze/40 bg-obsidian transition-opacity duration-300",
          solid ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="container relative grid h-full grid-cols-[1fr_auto] items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
        {/* Logo slot keeps its width, so the nav never shifts when the logo arrives. */}
        <div
          className={cn(
            "duration-500 ease-out-quint motion-reduce:transition-none",
            showLogo
              ? "visible translate-y-0 opacity-100 transition-[opacity,transform]"
              : "invisible -translate-y-1 opacity-0 transition-[opacity,transform,visibility]",
          )}
        >
          <Logo tabbable={showLogo} />
        </div>

        <nav aria-label={headerUi.navLabel} className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {nav.map((item) => {
              const id = item.href.split("#")[1];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={current === id ? "true" : undefined}
                    className={cn(
                      "relative py-1.5 text-[0.9375rem] text-parchment/90 transition-colors duration-300 hover:text-parchment aria-[current=true]:text-parchment",
                      underline,
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-4">
          <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
            <Link href={headerCta.href}>{headerCta.label}</Link>
          </Button>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={headerUi.openMenu}
            onClick={() => setOpen(true)}
            className="-mr-2 inline-flex h-11 items-center gap-3 px-2 text-[0.9375rem] text-parchment transition-colors duration-300 hover:text-gold lg:hidden"
          >
            <span aria-hidden="true">{headerUi.menu}</span>
            <MenuGlyph open={false} />
          </button>
        </div>
      </div>

      {/* Mobile menu: a full-screen sheet. `invisible` keeps it out of the tab order when closed. */}
      <div
        id="mobile-menu"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={headerUi.menu}
        className={cn(
          "fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-obsidian duration-300 ease-out-quint motion-reduce:transition-none lg:hidden",
          // Visible at once on open (so focus can move in); fade out before hiding on close.
          open
            ? "visible translate-y-0 opacity-100 transition-[opacity,transform]"
            : "invisible -translate-y-3 opacity-0 transition-[opacity,transform,visibility]",
        )}
      >
        <div className="container flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-bronze/40">
          <Logo />
          <button
            type="button"
            aria-label={headerUi.closeMenu}
            onClick={() => close()}
            className="-mr-2 inline-flex h-11 items-center gap-3 px-2 text-[0.9375rem] text-parchment transition-colors duration-300 hover:text-gold"
          >
            <span aria-hidden="true">{headerUi.close}</span>
            <MenuGlyph open />
          </button>
        </div>

        <nav aria-label={headerUi.navLabel} className="container flex-1 pt-4">
          <ul>
            {nav.map((item, i) => (
              <li
                key={item.href}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
                className={cn(
                  "border-b border-bronze/30 transition-[opacity,transform] duration-500 ease-out-quint motion-reduce:transition-none",
                  open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 motion-reduce:translate-y-0",
                )}
              >
                <Link
                  href={item.href}
                  onClick={() => closeToTarget(item.href)}
                  className="block py-5 font-serif text-[2rem] leading-none text-parchment transition-colors duration-300 hover:text-gold"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="container shrink-0 pb-10 pt-8">
          <Button asChild size="lg" className="w-full">
            <Link href={headerCta.href} onClick={() => closeToTarget(headerCta.href)}>
              {headerCta.label}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
