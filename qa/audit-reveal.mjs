// Lists visible content in each section that is NOT part of the reveal system
// (no data-reveal on itself or an ancestor inside its section), so it would sit
// still while its neighbours animate. Usage: node qa/audit-reveal.mjs [url]
import { chromium } from "playwright";
const url = process.argv[2] || "http://localhost:3410/";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
await c.addInitScript(() => { try { localStorage.setItem("lld-age-confirmed", JSON.stringify({ confirmedAt: Date.now() })); } catch {} });
const p = await c.newPage();
await p.goto(url, { waitUntil: "networkidle" });
const report = await p.evaluate(() => {
  const out = {};
  const sections = [...document.querySelectorAll("main [data-section], footer[data-section], main section, footer")].filter((el, i, a) => a.indexOf(el) === i && !el.parentElement.closest("[data-section]"));
  for (const sec of sections) {
    const name = sec.getAttribute("data-section") || sec.id || sec.tagName.toLowerCase();
    if (name === "hero") continue; // hero has its own load sequence
    const misses = [];
    const candidates = sec.querySelectorAll("h1,h2,h3,h4,p,li,a,button,img,video,svg,input,select,textarea,label,figcaption,blockquote,span,small,dt,dd");
    for (const el of candidates) {
      if (el.closest("[data-reveal]")) continue;
      if (el.closest("[aria-hidden='true']") && !["IMG","VIDEO"].includes(el.tagName)) continue;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width < 2 || r.height < 2 || cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
      // only leaf-ish content: has direct text, or is media/control
      const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!direct && !["IMG","VIDEO","SVG","svg","INPUT","SELECT","TEXTAREA","BUTTON"].includes(el.tagName)) continue;
      // skip if an ancestor already reported
      if (misses.some(m => m.el.contains(el))) continue;
      misses.push({ el, tag: el.tagName.toLowerCase(), text: (el.getAttribute("alt") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60), cls: (el.getAttribute("class") || "").slice(0, 60) });
    }
    if (misses.length) out[name] = misses.map(m => `${m.tag}${m.text ? ` "${m.text}"` : ""}${m.cls ? `  [${m.cls}]` : ""}`);
  }
  return out;
});
for (const [k, v] of Object.entries(report)) { console.log(`\n== ${k} (${v.length} not animated)`); v.slice(0, 40).forEach(x => console.log("  - " + x)); }
if (!Object.keys(report).length) console.log("every visible element is part of the reveal system");
await b.close();
