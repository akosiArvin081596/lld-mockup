import { chromium } from "playwright";
export const BASE = process.env.BASE || "http://localhost:3410";
export const OUT = "qa/output/clint";
export const VPS = { d2000:[2000,1100], d1440:[1440,900], d1280:[1280,720], t768:[768,1024], m390:[390,844] };
export async function launch() { return chromium.launch(); }
export async function ctx(browser, [w,h], opts = {}) {
  const { confirmed = true, ...rest } = opts;
  const c = await browser.newContext({ viewport: { width: w, height: h }, ...rest });
  if (confirmed && rest.javaScriptEnabled !== false) {
    await c.addInitScript((k) => { try { localStorage.setItem(k, JSON.stringify({ confirmedAt: Date.now() })); } catch {} }, "lld-age-confirmed");
  }
  return c;
}
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
