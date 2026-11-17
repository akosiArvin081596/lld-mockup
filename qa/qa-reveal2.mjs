// Item 3 (rev 2): generic cascade measurement. Records, per [data-reveal] element, when its computed look first changes and last changes after data-in="true".
import { launch, ctx, BASE, VPS, OUT, sleep } from "./clint-lib.mjs";
const names = process.argv[2] ? [process.argv[2]] : ["d1440"]; const shots = process.argv[3] === "shots";
const b = await launch();
const installer = () => {
  window.__rec = []; window.__ev = [];
  for (const ev of ["scroll", "scrollend", "keydown"]) window.addEventListener(ev, () => window.__ev.push([ev, performance.now()]), { passive: true });
  const sigOf = (el) => { const parts = []; const nodes = [el, ...[...el.querySelectorAll("*")].slice(0, 30)]; for (const n of nodes) { const cs = getComputedStyle(n); parts.push(cs.opacity + "|" + cs.transform + "|" + cs.clipPath + "|" + cs.filter + "|" + cs.translate + "|" + cs.scale); } return parts.join("#"); };
  const seen = new Set();
  new MutationObserver((muts) => {
    for (const m of muts) {
      const sec = m.target; if (sec.getAttribute?.("data-in") !== "true" || seen.has(sec)) continue; seen.add(sec);
      const t0 = performance.now(); const bar = document.querySelector("[data-site-header]").offsetHeight;
      const items = [...sec.querySelectorAll("[data-reveal]")].filter(el => el.closest("[data-section]") === sec && el.dataset.revealOrder !== "manual" && (el.offsetWidth || el.offsetHeight));
      const entry = { sec: sec.dataset.section, t0, topOffset: Math.round(sec.getBoundingClientRect().top - bar), els: items.map(el => { const r = el.getBoundingClientRect(); return { kind: el.dataset.reveal, text: (el.textContent.trim().slice(0, 22) || el.className.toString().slice(0, 18)).replace(/\s+/g, " "), left: Math.round(r.left), top: Math.round(r.top + scrollY), sig0: null, start: null, last: null }; }) };
      window.__rec.push(entry);
      const tick = () => { const t = performance.now() - t0; items.forEach((el, i) => { const e = entry.els[i]; const s = sigOf(el); if (e.sig0 === null) { e.sig0 = s; e.prev = s; return; } if (s !== e.prev) { if (e.start === null) e.start = Math.round(t); e.last = Math.round(t); e.prev = s; } }); if (t < 5000) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
  }).observe(document, { attributes: true, attributeFilter: ["data-in"], subtree: true });
};
for (const name of names) {
  const c = await ctx(b, VPS[name]); const p = await c.newPage(); await p.addInitScript(installer);
  await p.goto(BASE + "/"); await sleep(4500);
  for (let i = 0; i < 11; i++) {
    await p.keyboard.press("PageDown");
    await p.evaluate(() => new Promise(res => { const h = () => { removeEventListener("scrollend", h); res(); }; addEventListener("scrollend", h); setTimeout(res, 3000); }));
    const lock = Date.now();
    if (shots) for (const ms of [150, 600, 1300, 2800]) { const w = ms - (Date.now() - lock) - 90; if (w > 0) await sleep(w); await p.screenshot({ path: `${OUT}/reveal2-${name}-${String(i + 1).padStart(2, "0")}-${ms}.jpg`, type: "jpeg", quality: 60 }); }
    await sleep(shots ? 2400 : 5600);
  }
  const rec = await p.evaluate(() => ({ rec: window.__rec, ev: window.__ev }));
  console.log(`\n===== ${name}`);
  for (const r of rec.rec) {
    const pds = rec.ev.filter(e => e[0] === "keydown" && e[1] <= r.t0 + 50).map(e => e[1]); const pd = pds[pds.length - 1] ?? 0; const se = rec.ev.find(e => e[0] === "scrollend" && e[1] >= pd);
    const moving = r.els.filter(e => e.start !== null).sort((a, b) => a.start - b.start); const still = r.els.filter(e => e.start === null);
    const starts = [...new Set(moving.map(e => e.start))]; const gaps = []; for (let i = 1; i < moving.length; i++) gaps.push(moving[i].start - moving[i - 1].start); gaps.sort((a, b) => a - b);
    console.log(`\n${r.sec}: items=${r.els.length} animating=${moving.length} static=${still.length} offsetAtActivation=${r.topOffset}px t0-vs-scrollend=${se ? Math.round(r.t0 - se[1]) : "?"}ms firstStart=${moving[0]?.start} lastStart=${moving.at(-1)?.start} medGap=${gaps[Math.floor(gaps.length / 2)]} lastEnd=${Math.max(...moving.map(e => e.last))}`);
    console.log("  order:", moving.map(e => `${e.start}:${e.kind}"${e.text.slice(0, 14)}"@x${e.left},y${e.top}`).join("  "));
    if (still.length) console.log("  STATIC (never changed):", still.map(e => `${e.kind}"${e.text.slice(0, 18)}"`).join(", "));
  }
  await c.close();
}
await b.close();
