"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Keeps the age gate's `gate-exempt` class in step with client-side navigation (the inline
 * bootstrap sets it on full page loads). Legal pages are exempt; returning to any other page
 * while unconfirmed shows the gate again and moves focus into it.
 */
export function AgeGateRoute({ pattern }: { pattern: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const exempt = new RegExp(pattern).test(pathname);
    root.classList.toggle("gate-exempt", exempt);
    const open = root.classList.contains("js") && !root.classList.contains("age-ok") && !exempt;
    if (open) document.getElementById("age-gate")?.focus({ preventScroll: true });
  }, [pathname, pattern]);

  return null;
}
