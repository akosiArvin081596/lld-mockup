import { launch, ctx, BASE, VPS, OUT, sleep } from "./clint-lib.mjs";
const b = await launch();
for (const [name, vp] of Object.entries(VPS)) { if (process.argv[2] && process.argv[2] !== name) continue;
  const c = await ctx(b, vp); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(4500);
  const snaps = vp[0] >= 1024 && vp[1] >= 640; const log = [];
  const probe = async (label) => { const r = await p.evaluate(() => { const de = document.documentElement; const vw = de.clientWidth; scrollTo({ left: 200, top: scrollY, behavior: "instant" }); const sx = scrollX; scrollTo({ left: 0, top: scrollY, behavior: "instant" });
      const culprits = []; for (const el of document.querySelectorAll("body *")) { const r = el.getBoundingClientRect(); if (r.width === 0 || r.right <= vw + 1) continue; let clipped = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a); if (/(hidden|clip|auto|scroll)/.test(o.overflowX) ) { const ar = a.getBoundingClientRect(); if (ar.right <= vw + 1 || true) { clipped = true; break; } } } if (!clipped && getComputedStyle(el).position !== "fixed") culprits.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)}`); }
      return { sw: de.scrollWidth, cw: vw, canScrollX: sx, culprits: culprits.slice(0, 4), y: Math.round(scrollY) }; }); log.push(`${label}: sw=${r.sw}/cw=${r.cw} scrollX_after_try=${r.canScrollX} ${r.culprits.join(" ; ")}`); return r; };
  await probe("load");
  if (snaps) { for (let i = 1; i <= 11; i++) { await p.keyboard.press("PageDown"); await sleep(3300); await probe("stop" + i); } }
  else { const H = await p.evaluate(() => document.documentElement.scrollHeight); let i = 0; for (let y = 600; y < H; y += vp[1] * 0.8) { await p.evaluate((y) => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, y); }, y); await sleep(1500); await probe("y" + Math.round(y)); } }
  const bad = log.filter(l => !/scrollX_after_try=0/.test(l)); console.log(`\n== ${name} ${vp.join("x")}: ${bad.length}/${log.length} probes could scroll horizontally`); bad.slice(0, 6).forEach(l => console.log("   " + l)); if (!bad.length) console.log("   widths:", log.map(l => l.match(/sw=(\d+)\/cw=(\d+)/).slice(1).join("/")).join(" "));
  await c.close();
}
await b.close();
