// For every section below the hero that has NOT locked in yet, list [data-reveal] elements
// whose computed style is already final (opacity 1, no transform, no clip-path), i.e. they
// would just "be there" while their neighbours animate. Usage: node qa/audit-start-states.mjs [url]
import { chromium } from "playwright";
const url = process.argv[2] || "http://localhost:3410/";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
await c.addInitScript(() => { try { localStorage.setItem("lld-age-confirmed", JSON.stringify({ confirmedAt: Date.now() })); } catch {} });
const p = await c.newPage();
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
const res = await p.evaluate(() => {
  const out = {};
  for (const sec of document.querySelectorAll("[data-section]")) {
    if (sec.parentElement.closest("[data-section]")) continue;
    const name = sec.getAttribute("data-section");
    if (name === "hero" || sec.getAttribute("data-in") === "true") continue;
    const bad = [];
    for (const el of sec.querySelectorAll("[data-reveal]")) {
      const isHidden = (node) => { const cs = getComputedStyle(node); return Number(cs.opacity) < 0.99 || (cs.transform && cs.transform !== "none") || (cs.clipPath && cs.clipPath !== "none") || (cs.filter && cs.filter !== "none"); };
      // Passes if the element itself, any ancestor up to the section, or any descendant starts hidden
      // (wrappers whose children animate count as animated).
      let ok = isHidden(el);
      for (let a = el.parentElement; !ok && a && a !== sec; a = a.parentElement) ok = isHidden(a);
      if (!ok) ok = [...el.querySelectorAll("*")].some(isHidden);
      if (!ok) bad.push(`${el.tagName.toLowerCase()} data-reveal="${el.getAttribute("data-reveal")}" "${(el.textContent || el.getAttribute("alt") || "").trim().replace(/\s+/g, " ").slice(0, 50)}"`);
    }
    out[name] = { total: sec.querySelectorAll("[data-reveal]").length, alreadyFinal: bad };
  }
  return { cls: document.documentElement.className, out };
});
// Strict visual pass (added for sticky stages): is any part of a [data-reveal] element actually
// painted before its section locks in? Considers opacity along the ancestor chain, full
// clip-paths, zero scale and clipping by overflow ancestors, so a photo that only "has a transform"
// somewhere no longer passes. Dark start states (brightness 0.6 or less) count as hidden.
const strict = await p.evaluate(() => {
  const out = {};
  const painted = (n) => n.tagName === "IMG" || n.tagName === "VIDEO" || n.tagName === "svg" ||
    [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()) ||
    (getComputedStyle(n).backgroundColor !== "rgba(0, 0, 0, 0)" && getComputedStyle(n).backgroundColor !== "transparent");
  const darkStart = (cs) => { const m = /brightness\(([\d.]+)\)/.exec(cs.filter); return m && Number(m[1]) <= 0.6; };
  const shows = (n, sec) => {
    const r = n.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    let op = 1;
    for (let a = n; a && a !== sec.parentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      op *= Number(cs.opacity);
      if (op < 0.05 || /100%/.test(cs.clipPath) || darkStart(cs)) return false;
      if (cs.transform !== "none") { const m = new DOMMatrix(cs.transform); if (Math.abs(m.a) < 0.01 || Math.abs(m.d) < 0.01) return false; }
      if (a !== n && /hidden|clip/.test(cs.overflow)) {
        const c = a.getBoundingClientRect();
        if (r.right <= c.left + 1 || r.left >= c.right - 1 || r.bottom <= c.top + 1 || r.top >= c.bottom - 1) return false;
      }
    }
    return true;
  };
  for (const sec of document.querySelectorAll("[data-section]")) {
    if (sec.parentElement.closest("[data-section]")) continue;
    const name = sec.getAttribute("data-section");
    if (name === "hero" || sec.getAttribute("data-in") === "true") continue;
    const bad = [];
    for (const el of sec.querySelectorAll("[data-reveal]")) {
      if (!(el.offsetWidth || el.offsetHeight)) continue;
      const nodes = [el, ...el.querySelectorAll("*")].filter(painted);
      if (nodes.some((n) => shows(n, sec))) bad.push(`${el.tagName.toLowerCase()} data-reveal="${el.getAttribute("data-reveal")}" "${(el.textContent || el.querySelector("img")?.alt || "").trim().replace(/\s+/g, " ").slice(0, 40)}"`);
    }
    out[name] = bad;
  }
  return out;
});
console.log("html classes:", res.cls);
for (const [k, v] of Object.entries(res.out)) { console.log(`\n== ${k}: ${v.total} reveal elements, ${v.alreadyFinal.length} start already final`); v.alreadyFinal.slice(0, 30).forEach(x => console.log("  - " + x)); }
console.log("\n-- strict visual pass (painted before lock-in) --");
for (const [k, v] of Object.entries(strict)) { console.log(`== ${k}: ${v.length} painted before lock-in`); v.slice(0, 20).forEach((x) => console.log("  - " + x)); }
await b.close();
