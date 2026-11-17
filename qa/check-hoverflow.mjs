// Finds horizontal overflow: elements whose box extends past the viewport's right edge,
// sampled at every section stop and mid-animation. Usage: node qa/check-hoverflow.mjs [url] [width] [height]
import { chromium } from "playwright";
const url = process.argv[2] || "http://localhost:3410/";
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const b = await chromium.launch({ args: ["--hide-scrollbars=false"] });
const c = await b.newContext({ viewport: { width: W, height: H } });
await c.addInitScript(() => { try { localStorage.setItem("lld-age-confirmed", JSON.stringify({ confirmedAt: Date.now() })); } catch {} });
const p = await c.newPage();
await p.goto(url, { waitUntil: "networkidle" });
const stops = await p.evaluate(() => [0, ...[...document.querySelectorAll(".section-screen, [data-snap-stop]")].map(e => Math.round(e.getBoundingClientRect().top + scrollY - 72))]);
const found = new Map();
for (const y of stops) {
  await p.evaluate((y) => window.scrollTo(0, y), y);
  for (const t of [150, 600, 1500]) {
    await p.waitForTimeout(t === 150 ? 150 : t - 150);
    const r = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const sw = document.documentElement.scrollWidth;
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        if (rect.right > vw + 1) {
          // skip if clipped by an overflow-hidden/clip ancestor
          let clipped = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const ox = getComputedStyle(a).overflowX;
            if ((ox === "hidden" || ox === "clip") && a.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
          }
          if (!clipped) out.push(`${el.tagName.toLowerCase()}.${(el.getAttribute("class") || "").split(/\s+/).slice(0, 4).join(".")} right=${Math.round(rect.right)} (vw ${vw}) section=${el.closest("[data-section]")?.getAttribute("data-section") || el.closest("header") ? "header" : "?"}`);
        }
      }
      return { vw, sw, out: out.slice(0, 12) };
    });
    if (r.sw > r.vw) for (const o of r.out) found.set(o.replace(/right=\d+/, "right=…"), `${o}  [scrollY ${y}, t+${t}ms, scrollWidth ${r.sw}]`);
  }
}
console.log(found.size ? [...found.values()].join("\n") : `no horizontal overflow at ${W}x${H}`);
await b.close();
