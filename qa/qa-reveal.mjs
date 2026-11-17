// Item 3: reveal cascade timing per section on desktop snapping viewports.
import { launch, ctx, BASE, VPS, OUT, sleep } from "./clint-lib.mjs";
const names = process.argv[2] ? [process.argv[2]] : ["d1440"];
const shots = process.argv[3] !== "noshots";
const b = await launch();
const installer = () => {
  window.__rec = []; window.__ev = [];
  const prog = (el) => {
    const type = el.dataset.reveal;
    if (type === "mask") { const s = el.querySelector(".lld-mask > span"); if (!s) return 1; const m = new DOMMatrix(getComputedStyle(s).transform); const h = s.getBoundingClientRect().height || 1; return Math.max(0, Math.min(1, 1 - m.m42 / (h * 1.05))); }
    if (type === "line") { const m = new DOMMatrix(getComputedStyle(el).transform); return m.a; }
    if (type === "image") { const cp = getComputedStyle(el).clipPath; const mm = cp.match(/inset\(([^)]*)\)/); if (!mm) return 1; const v = mm[1].split(/\s+/).map(parseFloat); return 1 - (isNaN(v[2]) ? 0 : v[2]) / 100; }
    return +getComputedStyle(el).opacity;
  };
  const rowsOrder = (items) => {
    const boxes = items.filter(el => el.offsetWidth > 0 || el.offsetHeight > 0).map(el => ({ el, r: el.getBoundingClientRect() })).sort((a, b) => a.r.top - b.r.top);
    const rows = []; for (const bx of boxes) { const row = rows[rows.length-1]; if (row && bx.r.top - row[0].r.top <= 32) row.push(bx); else rows.push([bx]); }
    return rows.flatMap(row => row.sort((a,b)=>a.r.left-b.r.left).map(x=>x.el));
  };
  for (const ev of ["keydown","scroll","scrollend"]) window.addEventListener(ev, () => window.__ev.push([ev, performance.now()]), { passive: true });
  new MutationObserver((muts) => {
    for (const m of muts) {
      const sec = m.target; if (!sec.hasAttribute || !sec.hasAttribute("data-in")) continue;
      const t0 = performance.now();
      const bar = document.querySelector("[data-site-header]").offsetHeight;
      const items = [...sec.querySelectorAll("[data-reveal]")].filter(el => el.closest("[data-section]") === sec && el.dataset.revealOrder !== "manual");
      const ordered = rowsOrder(items);
      const entry = { sec: sec.dataset.section, t0, topOffset: Math.round(sec.getBoundingClientRect().top - bar), scrollY: Math.round(scrollY), n: ordered.length,
        els: ordered.map(el => ({ tag: el.tagName+"."+(el.dataset.reveal)+":"+(el.textContent.trim().slice(0,18)||el.className.toString().slice(0,18)), start: null, end: null, p0: null })) };
      window.__rec.push(entry);
      let frames = 0;
      const tick = () => {
        const t = performance.now() - t0;
        ordered.forEach((el, i) => { const p = prog(el), e = entry.els[i]; if (e.p0 === null) e.p0 = +p.toFixed(2); if (e.start === null && p > 0.03 && (e.p0 < 0.9)) e.start = Math.round(t); if (e.end === null && p >= 0.985 && e.start !== null) e.end = Math.round(t); });
        if (t < 5200) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }).observe(document, { attributes: true, attributeFilter: ["data-in"], subtree: true });
};
for (const name of names) {
  const vp = VPS[name];
  const c = await ctx(b, vp); const p = await c.newPage(); await p.addInitScript(installer);
  await p.goto(BASE + "/"); await sleep(4500);
  for (let i = 0; i < 11; i++) {
    const before = await p.evaluate(() => scrollY);
    await p.evaluate(() => { window.__ev.push(["pd", performance.now()]); });
    await p.keyboard.press("PageDown");
    await p.evaluate(() => new Promise(res => { const h = () => { removeEventListener("scrollend", h); res(); }; addEventListener("scrollend", h); setTimeout(res, 3000); }));
    const lock = Date.now();
    const after = await p.evaluate(() => scrollY);
    if (shots) {
      for (const ms of [150, 600, 1300, 2800]) {
        const wait = ms - (Date.now() - lock) - 90; if (wait > 0) await sleep(wait);
        await p.screenshot({ path: `${OUT}/reveal-${name}-${String(i+1).padStart(2,"0")}-${ms}.jpg`, type: "jpeg", quality: 60 });
      }
    } else await sleep(5300);
    await sleep(2400);
    if (after === before) break;
  }
  const rec = await p.evaluate(() => ({ rec: window.__rec, ev: window.__ev }));
  console.log(`\n===== ${name}`);
  for (const r of rec.rec) {
    // lock time: first scrollend after the last 'pd' before t0 ... approximate: last scrollend before t0+3000 and after last pd preceding t0
    const pds = rec.ev.filter(e => e[0] === "pd" && e[1] <= r.t0 + 50).map(e => e[1]); const pd = pds[pds.length - 1] ?? 0;
    const se = rec.ev.find(e => e[0] === "scrollend" && e[1] >= pd); const lockDelta = se ? Math.round(r.t0 - se[1]) : null;
    const starts = r.els.map(e => e.start);
    const ok = starts.filter(s => s !== null); const unfinished = r.els.filter(e => e.end === null);
    // order violations
    let viol = 0; for (let i = 1; i < starts.length; i++) if (starts[i] !== null && starts[i-1] !== null && starts[i] < starts[i-1] - 40) viol++;
    const gaps = []; for (let i = 1; i < starts.length; i++) if (starts[i] !== null && starts[i-1] !== null) gaps.push(starts[i] - starts[i-1]);
    const durs = r.els.filter(e => e.start !== null && e.end !== null).map(e => e.end - e.start);
    const med = (a) => a.length ? a.sort((x,y)=>x-y)[Math.floor(a.length/2)] : null;
    console.log(`${r.sec}: n=${r.n} topOffsetAtStart=${r.topOffset} t0-vs-scrollend=${lockDelta}ms firstStart=${Math.min(...ok)} lastStart=${Math.max(...ok)} medGap=${med(gaps)} medDur=${med(durs)} orderViolations=${viol} neverStarted=${r.els.filter(e=>e.start===null).length} unfinished=${unfinished.length} preVisible=${r.els.filter(e=>e.p0>=0.9).length}`);
    if (viol || unfinished.length || r.els.some(e=>e.start===null)) console.log("   detail:", r.els.map(e => `${e.tag}[${e.start}-${e.end}]`).join(" | "));
  }
  await c.close();
}
await b.close();
