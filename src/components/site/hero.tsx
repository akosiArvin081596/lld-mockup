"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { hero, legacy } from "@/content/site";
import { cn } from "@/lib/utils";

const SRC_1080 = "/media/hero-1080.mp4";
const SRC_720 = "/media/hero-720.mp4";
const DESKTOP = "(min-width: 1024px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

const CREST = "/brand/crest-full.png";

/** Split the headline into two balanced lines for the masked rise. */
function headlineLines(title: string): string[] {
  const words = title.split(" ");
  if (words.length < 3) return [title];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/**
 * The signature moment: the official crest over the warehouse film, with a one-time load
 * sequence (motion-hero.css).
 *
 * Video: no `autoPlay` attribute and `preload="none"`, so nothing downloads until this
 * component decides, and never while the age gate is open. Under reduced motion or Save-Data it never starts on its own (the
 * <source> media queries also exclude reduced motion before any JS runs); the visitor can
 * still press play, and Save-Data then gets the 720p file. While the hero is off screen the
 * film and its slow push rest, and they resume when it returns, unless the visitor paused.
 * The pause/play toggle satisfies WCAG 2.2.2.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const saveData = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    video.muted = true;

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    saveData.current = conn?.saveData === true;
    const autoplay = !window.matchMedia(REDUCED).matches && !saveData.current;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // While the age gate covers the page the film neither plays nor downloads (first visits
    // always see the gate, and the film would starve the gate's own images of bandwidth).
    // It starts the moment the visitor enters.
    const root = document.documentElement;
    const gateOpen = () =>
      root.classList.contains("js") && !root.classList.contains("age-ok") && !root.classList.contains("gate-exempt");
    const start = () => {
      if (!autoplay || userPaused.current) return;
      video.preload = "auto";
      video.play().catch(() => setPlaying(false));
    };
    let gateWatch: MutationObserver | null = null;
    if (gateOpen()) {
      gateWatch = new MutationObserver(() => {
        if (gateOpen()) return;
        gateWatch?.disconnect();
        start();
      });
      gateWatch.observe(root, { attributes: true, attributeFilter: ["class"] });
    } else {
      start();
    }

    // Rest while off screen; resume on return unless the visitor paused it themselves.
    let pausedForOffscreen = false;
    const observer = new IntersectionObserver(([entry]) => {
      const away = !entry.isIntersecting;
      setOffscreen(away);
      if (away && !video.paused) {
        pausedForOffscreen = true;
        video.pause();
      } else if (!away && pausedForOffscreen && !userPaused.current) {
        pausedForOffscreen = false;
        video.play().catch(() => setPlaying(false));
      }
    });
    observer.observe(section);

    return () => {
      gateWatch?.disconnect();
      observer.disconnect();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  // The scroll cue retires as soon as the visitor scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      userPaused.current = true;
      video.pause();
      return;
    }
    userPaused.current = false;
    // First play: no <source> matched (reduced motion), or Save-Data asks for the lighter file.
    if (video.played.length === 0 && (!video.currentSrc || saveData.current)) {
      video.src = !saveData.current && window.matchMedia(DESKTOP).matches ? SRC_1080 : SRC_720;
    }
    video.preload = "auto";
    video.play().catch(() => setPlaying(false));
  };

  const lines = headlineLines(hero.title);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      data-section="hero"
      data-in="true"
      className={cn(
        "relative isolate flex min-h-[100svh] snap-start items-center overflow-hidden bg-obsidian",
        offscreen && "lld-offscreen",
      )}
    >
      {/* Media stack: film (slow push), scrims, scroll-exit shade, and the load blackout on top. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="lld-hero-exit-media absolute inset-0">
          <div className="lld-kenburns absolute inset-0">
            <Image src="/media/hero-poster.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="none"
              poster="/media/hero-poster.jpg"
              aria-hidden="true"
              tabIndex={-1}
            >
              <source media={`${DESKTOP} and (prefers-reduced-motion: no-preference)`} src={SRC_1080} type="video/mp4" />
              <source media="(prefers-reduced-motion: no-preference)" src={SRC_720} type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="absolute inset-0 bg-obsidian/35" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 58% 62% at 50% 50%, rgb(18 17 15 / 0.62) 0%, rgb(18 17 15 / 0.38) 55%, rgb(18 17 15 / 0) 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-obsidian/70 to-obsidian/0" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/0" />
        <div className="grain absolute inset-0" />
        <div className="lld-hero-exit-shade absolute inset-0 bg-obsidian opacity-0" />
        <div className="lld-blackout lld-seq absolute inset-0 bg-black opacity-0" />
      </div>

      <div className="container relative pb-24 pt-[calc(var(--header-h)+1.5rem)] lg:pb-[6.5rem] lg:pt-[calc(var(--header-h)+1rem)]">
        <div className="lld-hero-exit-copy mx-auto flex max-w-5xl flex-col items-center text-center">
          {/* Depth: the crest drifts slower than the page as the hero leaves. */}
          <div className="lld-hero-crest-depth">
            <div
              id="hero-crest"
              className="lld-crest lld-seq relative w-[12rem] sm:w-[15rem] lg:w-[clamp(11rem,calc(75vh-23rem),21rem)]"
            >
              <Image
                src={CREST}
                alt={legacy.crestAlt}
                width={1440}
                height={1631}
                priority
                sizes="(min-width: 1024px) 336px, (min-width: 640px) 240px, 200px"
                className="h-auto w-full"
              />
              <span aria-hidden="true" className="lld-glint lld-seq">
                <Image src={CREST} alt="" width={1440} height={1631} sizes="(min-width: 1024px) 336px, (min-width: 640px) 240px, 200px" priority className="h-auto w-full" />
              </span>
            </div>
          </div>

          <h1
            id="hero-title"
            className="mt-7 text-[2.625rem] leading-[1.06] tracking-[-0.01em] sm:text-6xl lg:mt-8 lg:text-[clamp(3.5rem,calc(6.6vh+0.75rem),4.75rem)]"
          >
            {/* Each line is its own block; each word sweeps in from the left, 90ms apart (--w). */}
            {lines.map((line, i) => {
              const before = lines.slice(0, i).join(" ").split(" ").filter(Boolean).length;
              return (
                <Fragment key={line}>
                  {i > 0 ? " " : null}
                  <span className="lld-hline">
                    {line.split(" ").map((word, k) => (
                      <Fragment key={k}>
                        {k > 0 ? " " : null}
                        <span className="lld-word lld-seq" style={{ "--w": before + k } as CSSProperties}>
                          {word}
                        </span>
                      </Fragment>
                    ))}
                  </span>
                </Fragment>
              );
            })}
          </h1>

          <p
            className="lld-settle lld-seq mt-6 max-w-2xl lg:mt-5 text-lg leading-relaxed text-parchment/90 sm:text-xl"
            style={{ "--d": "1.65s" } as CSSProperties}
          >
            {hero.lede}
          </p>

          {/* CTAs settle left to right. */}
          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center sm:gap-4 lg:mt-8">
            <Button asChild size="lg" className="lld-settle lld-seq" style={{ "--d": "1.85s" } as CSSProperties}>
              <Link href={hero.primaryCta.href}>{hero.primaryCta.label}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="lld-settle lld-seq border-parchment/50 text-parchment hover:border-gold hover:bg-obsidian/30 hover:text-gold"
              style={{ "--d": "2.02s" } as CSSProperties}
            >
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll cue: decorative, retires on first scroll. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 transition-opacity duration-500",
          scrolled ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="lld-cue lld-seq relative h-12 w-px overflow-hidden bg-parchment/20">
          <span className="lld-cue-light absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-gilt/0 via-gilt to-gilt/0" />
        </div>
      </div>

      <div className="container pointer-events-none absolute inset-x-0 bottom-0 flex justify-end pb-6 sm:pb-8">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? hero.video.pauseLabel : hero.video.playLabel}
          className="lld-hero-ctrl lld-seq pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-sm border border-parchment/40 text-parchment/90 transition-colors duration-300 hover:border-gold hover:text-gold"
        >
          {playing ? (
            <Pause aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <Play aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </section>
  );
}
