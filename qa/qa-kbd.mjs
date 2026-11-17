import { launch, ctx, BASE, OUT, sleep } from "./clint-lib.mjs";
const b = await launch(); const c = await ctx(b, [1440, 900]); const p = await c.newPage();
await p.goto(BASE + "/"); await sleep(4500);
const rows = [];
for (let i = 0; i < 75; i++) {
  await p.keyboard.press("Tab"); await sleep(i < 3 ? 400 : 650);
  const r = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); const r = a.getBoundingClientRect(); const bar = document.querySelector("[data-site-header]").offsetHeight; const inHeader = !!a.closest("[data-site-header]"); const after = getComputedStyle(a, "::after"); const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0; const shadow = cs.boxShadow !== "none"; const grp = a.closest(".group,[class*=group]"); return { tag: a.tagName.toLowerCase(), name: (a.getAttribute("aria-label") || a.textContent || a.getAttribute("name") || a.id || "").trim().replace(/\s+/g, " ").slice(0, 34), href: a.getAttribute("href"), ring, ringColor: cs.outlineColor, off: cs.outlineOffset, shadow, w: Math.round(r.width), vis: r.width > 0 && r.top >= (inHeader ? 0 : bar - 1) && r.bottom <= innerHeight + 1, top: Math.round(r.top), y: Math.round(scrollY), sec: a.closest("section,footer,header")?.id || a.closest("section,footer,header")?.tagName.toLowerCase() }; });
  rows.push(r); if (r.tag === "body") break;
}
const skip = rows[0]; console.log("first tab stop:", JSON.stringify(skip));
console.log("total tab stops:", rows.length);
let prev = ""; for (const r of rows) { console.log(`${r.vis ? " " : "!"} ${r.sec || "?"}\t${r.tag}\t${r.name}\t${r.href || ""}\tring=${r.ring ? r.ringColor + "/" + r.off : "NONE"}${r.shadow ? " shadow" : ""}\ttop=${r.top}`); }
const noRing = rows.filter(r => !r.ring); console.log("\nno native outline:", noRing.map(r => `${r.tag}:${r.name}`).join(" | "));
console.log("not in viewport when focused:", rows.filter(r => !r.vis).map(r => `${r.tag}:${r.name}(top=${r.top})`).join(" | ") || "none");
// skip link
await p.evaluate(() => { scrollTo(0, 0); document.activeElement.blur(); }); await sleep(800); await p.keyboard.press("Tab"); await sleep(400);
const sk = await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { text: a.textContent, visible: r.width > 0 && r.top >= 0 && r.top < 200 && getComputedStyle(a).clip !== "rect(0px, 0px, 0px, 0px)", rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }; });
await p.screenshot({ path: `${OUT}/kbd-skiplink.png`, clip: { x: 0, y: 0, width: 700, height: 140 } });
await p.keyboard.press("Enter"); await sleep(1500); const after = await p.evaluate(() => ({ active: document.activeElement.id, y: scrollY, hash: location.hash }));
console.log("skip link:", JSON.stringify(sk), "->", JSON.stringify(after));
// form field focus visibility
await p.locator("header >> a", { hasText: "Contact" }).first().click(); await sleep(2500); await p.locator("#contact-name").focus(); await sleep(500);
await p.screenshot({ path: `${OUT}/kbd-form-focus.png`, clip: { x: 760, y: 140, width: 640, height: 200 } });
const ff = await p.evaluate(() => { const e = document.getElementById("contact-name"); const cs = getComputedStyle(e); return { outline: cs.outlineStyle, border: cs.borderColor, shadow: cs.boxShadow }; }); console.log("form field focus style:", JSON.stringify(ff));
await b.close();
