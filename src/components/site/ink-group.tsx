"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Legacy "Ink" reveal: the heading and paragraphs inside this group write in like a pen,
 * one line after another, each line left to right.
 *
 * The group is one `data-reveal="ink"` item in the section's cascade. This component only
 * measures: it gives every `.ink-w` word its line number across the whole group (`--l`) and
 * its horizontal position within that line (`--x`, 0 to 1). motion-sections.css turns those
 * into the delay of each word's left-to-right clip wipe. Without JS every word simply has
 * `--l: 0`, so the lines wipe in together; with reduced motion nothing is hidden at all.
 */
export function InkGroup({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const measure = () => {
      const words = Array.from(root.querySelectorAll<HTMLElement>(".ink-w"));
      const box = root.getBoundingClientRect();
      if (!words.length || box.width === 0) return;
      let line = -1;
      let lineTop = Number.NEGATIVE_INFINITY;
      for (const word of words) {
        // The words only ever animate clip-path, so their boxes are their real layout positions.
        const r = word.getBoundingClientRect();
        const top = r.top - box.top;
        if (top > lineTop + 4) {
          line += 1;
          lineTop = top;
        }
        const left = r.left - box.left;
        word.style.setProperty("--l", String(line));
        word.style.setProperty("--x", (Math.max(0, left) / box.width).toFixed(3));
      }
    };

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    // Webfonts change line breaks once they load.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => resize.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal="ink" className={cn("relative", className)}>
      {children}
    </div>
  );
}
