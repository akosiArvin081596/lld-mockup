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
// Strict visual pass: before a section locks in, only its SURFACE may be painted.
// Checks EVERY painted descendant of each section (not only [data-reveal]): img, video, picture,
// svg, canvas, direct text, background-image, visible border. Exempt: the section element itself
// and anything inside an element marked `data-surface` (solid colour, grain, texture layers).
// A node counts as painted unless something on its path to the section hides it: opacity under
// 0.05, a fully closed clip-path, zero scale, or being clipped out by an overflow ancestor.
// A dim start (filter: brightness) does NOT count as hidden.
const strict = await p.evaluate(() => {
  const out = {};
  const MEDIA = new Set(["IMG", "VIDEO", "PICTURE", "CANVAS", "svg"]);
  const isPaintedNode = (n) => {
    if (MEDIA.has(n.tagName)) return true;
    if (n.closest("svg") && n.tagName !== "svg") return false; // svg counted once, as a whole
    if ([...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) return true;
    const cs = getComputedStyle(n);
    if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
    const sides = ["Top", "Right", "Bottom", "Left"];
    return sides.some((k) => parseFloat(cs["border" + k + "Width"]) > 0 && cs["border" + k + "Style"] !== "none" && !/rgba\([^)]*,\s*0\)|transparent/.test(cs["border" + k + "Color"]));
  };
  const shows = (n, sec) => {
    const r = n.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    let op = 1;
    for (let a = n; a && a !== sec.parentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      op *= Number(cs.opacity);
      if (op < 0.05 || /100%/.test(cs.clipPath)) return false;
      if (cs.transform !== "none") { const m = new DOMMatrix(cs.transform); if (Math.abs(m.a) < 0.01 || Math.abs(m.d) < 0.01) return false; }
      if (a !== n && /hidden|clip/.test(cs.overflow)) {
        const c = a.getBoundingClientRect();
        if (r.right <= c.left + 1 || r.left >= c.right - 1 || r.bottom <= c.top + 1 || r.top >= c.bottom - 1) return false;
      }
    }
    return true;
  };
  const label = (n) => {
    const tag = n.tagName.toLowerCase();
    const src = n.getAttribute("src") || "";
    const cs = getComputedStyle(n);
    const what = n.tagName === "IMG"
      ? (new URL(src, location.href).searchParams.get("url") || src).split("/").pop()
      : cs.backgroundImage !== "none" ? "background-image " + cs.backgroundImage.slice(0, 40)
      : (n.textContent || "").trim().replace(/\s+/g, " ").slice(0, 34) || "border " + cs.borderTopWidth + " " + cs.borderTopColor;
    const owner = n.closest("[data-reveal]");
    return `${tag}${n.className && typeof n.className === "string" ? "." + n.className.split(" ")[0] : ""} "${what}"${owner ? ` (in data-reveal="${owner.dataset.reveal}")` : " (no data-reveal)"}`;
  };
  for (const sec of document.querySelectorAll("[data-section]")) {
    if (sec.parentElement.closest("[data-section]")) continue;
    const name = sec.getAttribute("data-section");
    if (name === "hero" || sec.getAttribute("data-in") === "true") continue;
    const bad = [];
    for (const n of sec.querySelectorAll("*")) {
      if (n.closest("[data-surface]")) continue;
      if (!isPaintedNode(n)) continue;
      if (shows(n, sec)) bad.push(label(n));
    }
    out[name] = bad;
  }
  return out;
});
console.log("html classes:", res.cls);
for (const [k, v] of Object.entries(res.out)) { console.log(`\n== ${k}: ${v.total} reveal elements, ${v.alreadyFinal.length} start already final`); v.alreadyFinal.slice(0, 30).forEach(x => console.log("  - " + x)); }
console.log("\n-- strict visual pass: anything painted besides the surface before lock-in --");
for (const [k, v] of Object.entries(strict)) { console.log(`== ${k}: ${v.length} painted before lock-in`); v.slice(0, 40).forEach((x) => console.log("  - " + x)); }
await b.close();
