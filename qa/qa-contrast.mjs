// Item 9: pixel-sampled contrast of text over its real background (text hidden, background sampled).
import { launch, ctx, BASE, VPS, sleep } from "./clint-lib.mjs";
const names = process.argv.slice(2).length ? process.argv.slice(2) : ["d1440", "m390"];
const b = await launch();
const lum = (r, g, b2) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2); };
for (const name of names) {
  const vp = VPS[name]; const desk = vp[0] >= 1024; const c = await ctx(b, vp); const p = await c.newPage();
  const lib = await c.newPage(); await lib.setContent("<canvas id=c></canvas>");
  await p.goto(BASE + "/"); await sleep(4500);
  const stops = desk ? 12 : 0; const results = [];
  const gather = async (label) => {
    const cands = await p.evaluate(() => {
      window.__c = []; const bar = 72; const out = [];
      for (const el of document.querySelectorAll("main h1,main h2,main h3,main p,main li,main a,main button,main label,main figcaption,main span,footer *")) {
        if (el.closest("#age-gate,#mobile-menu,.sr-only,[aria-hidden=true]")) continue;
        const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(" "); if (!own) continue;
        const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 6 || r.top < bar - 1 || r.bottom > innerHeight + 1 || r.left < 0 || r.right > innerWidth + 1) continue;
        const cs = getComputedStyle(el); if (cs.visibility === "hidden" || +cs.opacity < 0.95) continue;
        let op = 1; for (let n = el; n; n = n.parentElement) op *= +getComputedStyle(n).opacity; if (op < 0.95) continue;
        const i = window.__c.length; window.__c.push(el);
        out.push({ i, text: own.slice(0, 36), rect: { x: Math.max(0, r.left), y: r.top, width: Math.min(r.width, innerWidth - Math.max(0, r.left)), height: r.height }, filled: /^rgba?\(/.test(cs.backgroundColor) && cs.backgroundColor !== "rgba(0, 0, 0, 0)", color: cs.color, fs: parseFloat(cs.fontSize), fw: +cs.fontWeight });
      }
      return out.slice(0, 40);
    });
    for (const cd of cands) {
      await p.evaluate((i) => { const e = window.__c[i]; e.__old = e.style.cssText; e.style.setProperty("transition", "none", "important"); e.style.setProperty("color", "transparent", "important"); e.style.setProperty("text-decoration-color", "transparent", "important"); e.querySelectorAll("*").forEach(x => { x.__o = x.style.cssText; x.style.setProperty("transition", "none", "important"); x.style.setProperty("color", "transparent", "important"); }); }, cd.i);
      await sleep(30); const buf = await p.screenshot({ clip: cd.rect }); 
      await p.evaluate((i) => { const e = window.__c[i]; e.style.cssText = e.__old; e.querySelectorAll("*").forEach(x => { x.style.cssText = x.__o; }); }, cd.i);
      const px = await lib.evaluate(async (b64) => { const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode(); const cv = document.getElementById("c"); cv.width = img.width; cv.height = img.height; const g = cv.getContext("2d"); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, img.width, img.height).data; const L = []; for (let k = 0; k < d.length; k += 4) L.push([d[k], d[k + 1], d[k + 2]]); return L.filter((_, k) => k % 3 === 0); }, buf.toString("base64"));
      const m = cd.color.match(/[\d.]+/g).map(Number); const fgL = lum(m[0], m[1], m[2]); const ls = px.map(([r, g, b2]) => lum(r, g, b2)).sort((a, b) => a - b);
      const bgWorst = cd.filled ? ls[Math.floor(ls.length*0.5)] : fgL > 0.4 ? ls[Math.floor(ls.length * 0.97)] : ls[Math.floor(ls.length * 0.03)]; // light text: brightest bg is worst
      const ratio = (Math.max(fgL, bgWorst) + 0.05) / (Math.min(fgL, bgWorst) + 0.05);
      const large = cd.fs >= 24 || (cd.fs >= 18.66 && cd.fw >= 700); const need = large ? 3 : 4.5;
      results.push({ label, text: cd.text, ratio: +ratio.toFixed(2), need, fs: cd.fs, pass: ratio >= need });
    }
  };
  if (desk) { await gather("hero"); for (let i = 1; i <= stops; i++) { await p.keyboard.press("PageDown"); await sleep(3600); if (i % 1 === 0) await gather(await p.evaluate(() => { const bar = 72; const s = [...document.querySelectorAll("main section, footer")].find(s => { const r = s.getBoundingClientRect(); return r.top <= bar + 10 && r.bottom > bar + 10; }); return (s?.id || s?.tagName) + "@" + Math.round(scrollY); })); } }
  else { const H = await p.evaluate(() => document.documentElement.scrollHeight); await gather("hero"); for (let y = 700; y < H; y += 620) { await p.evaluate((y) => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, y); }, y); await sleep(3200); await gather("y" + y); } }
  const fails = results.filter(r => !r.pass); const lowest = [...results].sort((a, b) => a.ratio - b.ratio).slice(0, 8);
  console.log(`\n== ${name}: sampled ${results.length} text items, below threshold: ${fails.length}`);
  fails.forEach(f => console.log(`   FAIL ${f.label} "${f.text}" ${f.ratio}:1 (need ${f.need}, ${f.fs}px)`));
  console.log("   lowest:", lowest.map(r => `${r.label}:"${r.text.slice(0, 18)}" ${r.ratio}`).join(" | "));
  await c.close();
}
await b.close();
