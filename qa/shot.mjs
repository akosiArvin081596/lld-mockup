// Screenshot helper for the whole team (Playwright + the Chromium already cached on this Mac).
//
// Usage (from the project root):
//   node qa/shot.mjs <url> <out.png> [--width 1440] [--height 900] [--full] [--reduced-motion]
//                    [--age-gate] [--scroll <px>] [--selector <css>] [--wait <ms>]
//
//   --full            full-page screenshot
//   --reduced-motion  emulate prefers-reduced-motion: reduce (implied by --full unless --motion)
//   --motion          keep motion on in a --full shot
//   --age-gate        do NOT pre-confirm the 21+ gate (to screenshot the gate itself)
//   --scroll <px>     scroll to this offset before the shot (viewport shots)
//   --selector <css>  screenshot only this element
//   --wait <ms>       extra settle time (default 600)
//
// Prints console errors and failed requests so they are visible in the agent's output.
// Output files belong in qa/output/ (git-ignored).
import { chromium } from "playwright";

const args = process.argv.slice(2);
const [url, out] = args;
if (!url || !out) {
  console.error("usage: node qa/shot.mjs <url> <out.png> [flags]");
  process.exit(2);
}
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const width = Number(opt("--width", 1440));
const height = Number(opt("--height", 900));
const wait = Number(opt("--wait", 600));
const scroll = Number(opt("--scroll", 0));
const selector = opt("--selector", "");

const killTimer = setTimeout(() => { console.error("shot.mjs: timed out after 90s"); process.exit(3); }, 90000);
killTimer.unref();
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  // Full-page shots freeze motion (scroll-driven effects depend on scroll position) unless --motion is passed.
  reducedMotion: flag("--reduced-motion") || (flag("--full") && !flag("--motion")) ? "reduce" : "no-preference",
});
if (!flag("--age-gate")) {
  // Must match the AgeGate storage contract in CONTRACT.md.
  await context.addInitScript(() => {
    try {
      localStorage.setItem("lld-age-confirmed", JSON.stringify({ confirmedAt: Date.now() }));
    } catch {}
  });
}
const page = await context.newPage();
const problems = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") problems.push(`[console.${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => problems.push(`[pageerror] ${e.message}`));
page.on("requestfailed", (r) => problems.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ""}`));
page.on("response", (r) => {
  if (r.status() >= 400) problems.push(`[http ${r.status()}] ${r.url()}`);
});

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
if (flag("--full")) {
  // Walk the page so lazy-loaded images load, then wait for them and return to the top.
  await page.evaluate(async () => {
    const step = Math.max(400, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    // Wait only for images that are actually rendered (hidden hover/crossfade layers and
    // display:none variants never start loading), and never longer than 6 seconds.
    const visible = Array.from(document.images).filter((img) => {
      if (img.complete) return false;
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
    });
    await Promise.race([
      Promise.all(
        visible.map((img) => new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); })),
      ),
      new Promise((r) => setTimeout(r, 6000)),
    ]);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}
if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
await page.waitForTimeout(wait);

if (selector) {
  await page.locator(selector).first().screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: flag("--full") });
}
console.log(`saved ${out} (${width}x${height}${flag("--full") ? ", full page" : ""})`);
if (problems.length) console.log(problems.join("\n"));
await browser.close();
