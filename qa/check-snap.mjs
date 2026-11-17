import { chromium } from "playwright";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
await c.addInitScript(() => { try { localStorage.setItem("lld-age-confirmed", JSON.stringify({ confirmedAt: Date.now() })); } catch {} });
const p = await c.newPage();
for (const path of ["/", "/privacy", "/terms", "/accessibility", "/nope"]) {
  await p.goto("http://localhost:3410" + path, { waitUntil: "networkidle" });
  const snap = await p.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType);
  await p.keyboard.press("PageDown"); await p.waitForTimeout(700);
  const y = await p.evaluate(() => Math.round(scrollY));
  const max = await p.evaluate(() => Math.round(document.documentElement.scrollHeight - innerHeight));
  console.log(`${path.padEnd(15)} snap=${snap.padEnd(12)} after PageDown scrollY=${y} of ${max}`);
}
await b.close();
