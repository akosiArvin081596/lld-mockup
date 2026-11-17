// Item 3b: nothing stays hidden. Modes: scroll (motion on, full scroll-through), reduced, nojs.
import { launch, ctx, BASE, VPS, OUT, sleep } from "./clint-lib.mjs";
const [mode, name] = process.argv.slice(2);
const b = await launch();
const hiddenScan = () => {
  const out = [];
  const els = document.querySelectorAll("h1,h2,h3,h4,p,li,a,button,label,figcaption,input,select,textarea,img,dt,dd,span.lld-line,[data-reveal]");
  for (const el of els) {
    if (el.closest("#age-gate") || el.closest("#mobile-menu") || el.closest(".sr-only") || el.closest("[hidden]")) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) continue;
    let cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
    if (!(el.textContent || "").trim() && !/^(IMG|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !el.dataset.reveal) continue;
    let op = 1, why = []; for (let n = el; n && n !== document.documentElement; n = n.parentElement) { const s = getComputedStyle(n); op *= +s.opacity; if (s.clipPath && s.clipPath !== "none") why.push("clip:"+s.clipPath.slice(0,25)); if (s.visibility === "hidden") op = 0; }
    if (el.closest(".lld-mask") || el.classList.contains("lld-line")) { const sp = el.closest(".lld-mask > span") || el; const m = new DOMMatrix(getComputedStyle(sp).transform); if (Math.abs(m.m42) > 2) why.push("maskY:"+Math.round(m.m42)); }
    if (op < 0.95) why.push("opacity:"+op.toFixed(2));
    if (el.dataset.reveal === "line") { const m = new DOMMatrix(cs.transform); if (m.a < 0.95) why.push("scaleX:"+m.a.toFixed(2)); }
    if (el.dataset.reveal === "up") { const m = new DOMMatrix(cs.transform); if (Math.abs(m.m42) > 1) why.push("translateY:"+m.m42.toFixed(0)); }
    if (why.length) out.push(`${el.tagName.toLowerCase()}[${el.dataset.reveal||""}] "${(el.textContent||el.alt||"").trim().slice(0,30)}" ${why.join(" ")} (sec ${el.closest("[data-section],section,footer")?.id||el.closest("[data-section]")?.dataset.section||"?"})`);
  }
  return out;
};
const snaps = (vp) => vp[0] >= 1024 && vp[1] >= 640;
const run = async (name, vp) => {
  const opts = mode === "reduced" ? { reducedMotion: "reduce" } : mode === "nojs" ? { javaScriptEnabled: false } : {};
  const c = await ctx(b, vp, opts); const p = await c.newPage();
  await p.goto(BASE + "/"); await sleep(mode === "nojs" ? 6000 : 4500);
  if (mode === "scroll") {
    if (snaps(vp)) { for (let i = 0; i < 12; i++) { await p.keyboard.press("PageDown"); await sleep(3200); } }
    else { const H = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < H; y += vp[1] * 0.6) { await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y); await sleep(700); } await sleep(3200); }
  }
  let res = (await p.evaluate(hiddenScan)).filter(x => !/\(sec hero\)/.test(x) && !/clip:inset\(0%/.test(x) && !(snaps(vp) && /\(sec (services|process)\)/.test(x) && /opacity:0\.00/.test(x)) );
  // For reduced/nojs also scan with everything in view is unnecessary; opacity is document-wide.
  console.log(`\n[${mode}] ${name} ${vp.join("x")}: ${res.length} hidden`); res.slice(0, 60).forEach(x => console.log("   ", x));
  if (mode !== "scroll") { await p.screenshot({ path: `${OUT}/vis-${mode}-${name}.png`, fullPage: false }); }
  if (mode === "scroll" && snaps(vp)) {
    // skipped sections: jump to End, then straight back to top
    await p.keyboard.press("End"); await sleep(2500); await p.keyboard.press("Home"); await sleep(2500);
    const lost = await p.evaluate(() => [...document.querySelectorAll("[data-section]")].filter(s => !s.hasAttribute("data-in")).map(s => s.dataset.section));
    console.log("   sections never activated after End/Home:", lost.join(",") || "none");
  }
  await c.close();
};
const list = name ? [[name, VPS[name]]] : Object.entries(VPS);
for (const [n, vp] of list) await run(n, vp);
await b.close();
