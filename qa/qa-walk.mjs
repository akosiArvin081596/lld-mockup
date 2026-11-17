// Item 1/2: walk every snap stop at each viewport, check fit/overflow/nav/active.
import { launch, ctx, BASE, VPS, OUT, sleep } from "./clint-lib.mjs";
const only = process.argv[2];
const b = await launch();
const probe = () => {
  const bar = document.querySelector("[data-site-header]").offsetHeight;
  const vw = innerWidth, vh = innerHeight;
  const secs = [...document.querySelectorAll("main section, footer")];
  const cur = secs.find(s => { const r = s.getBoundingClientRect(); return r.top <= bar + 10 && r.bottom > bar + 10; });
  const r = cur?.getBoundingClientRect();
  const issues = [];
  if (cur) {
    // descendants overflowing the section horizontally or past right edge of viewport
    for (const el of cur.querySelectorAll("*")) {
      const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") continue;
      const e = el.getBoundingClientRect(); if (!e.width || !e.height) continue;
      if (el.closest("[aria-hidden='true']") && !el.closest("figure")) continue;
      if (e.right > vw + 1 && !el.closest("svg")) issues.push(`right-overflow ${el.tagName}.${String(el.className).slice(0,30)} r=${Math.round(e.right)}`);
      if (e.left < -1 && !el.closest("svg")) issues.push(`left-overflow ${el.tagName}.${String(el.className).slice(0,30)} l=${Math.round(e.left)}`);
    }
    // text-bearing leaf elements cut by section bottom or viewport bottom
    for (const el of cur.querySelectorAll("h1,h2,h3,p,li,a,button,label,input,select,textarea,figcaption,span")) {
      if (el.children.length && el.tagName==="SPAN") continue;
      if (!el.textContent.trim() && !/INPUT|SELECT|TEXTAREA/.test(el.tagName)) continue;
      const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
      const e = el.getBoundingClientRect(); if (!e.height) continue;
      if (e.bottom > vh + 1 && r.top <= bar+2 && r.height <= vh-bar+2) issues.push(`below-viewport ${el.tagName} "${el.textContent.trim().slice(0,30)}" b=${Math.round(e.bottom)}`);
      if (e.top < bar - 1 && e.bottom > 0 && r.top <= bar+2) issues.push(`under-bar ${el.tagName} "${el.textContent.trim().slice(0,30)}" t=${Math.round(e.top)}`);
    }
  }
  return {
    scrollY: Math.round(scrollY), maxScroll: document.documentElement.scrollHeight - vh,
    hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth || document.body.scrollWidth > innerWidth,
    sw: document.documentElement.scrollWidth, bar, vh,
    sec: cur ? (cur.id || cur.tagName.toLowerCase()) : null,
    secTop: r && Math.round(r.top), secH: r && Math.round(r.height), secBottom: r && Math.round(r.bottom),
    nav: [...document.querySelectorAll("header nav a[aria-current]")].map(a => a.textContent.trim()).join(","),
    issues: [...new Set(issues)].slice(0, 8),
  };
};
for (const [name, vp] of Object.entries(VPS)) {
  if (only && only !== name) continue;
  const snapping = vp[0] >= 1024 && vp[1] >= 640;
  const c = await ctx(b, vp); const p = await c.newPage();
  const logs = []; p.on("console", m => { if (["error","warning"].includes(m.type())) logs.push(m.type()+": "+m.text().slice(0,200)); }); p.on("pageerror", e => logs.push("pageerror "+e.message));
  await p.goto(BASE + "/"); await sleep(3800);
  console.log(`\n=== ${name} ${vp.join("x")} snapping=${snapping}`);
  if (snapping) {
    let last = -1, i = 0;
    for (; i < 16; i++) {
      const s = await p.evaluate(probe);
      await p.screenshot({ path: `${OUT}/walk-${name}-${String(i).padStart(2,"0")}-${s.sec}.png` });
      console.log(i, JSON.stringify(s));
      if (s.scrollY === last && i > 0) break; last = s.scrollY;
      await p.keyboard.press("PageDown"); await sleep(1500);
    }
  } else {
    const ids = await p.evaluate(() => [...document.querySelectorAll("main section, footer")].map(s => s.id || s.tagName.toLowerCase()));
    let i = 0;
    for (const id of ids) {
      await p.evaluate((id) => { const el = id==="footer" ? document.querySelector("footer") : (document.getElementById(id) || document.querySelector("main section")); const bar = document.querySelector("[data-site-header]").offsetHeight; document.documentElement.style.scrollBehavior="auto"; scrollTo(0, el.getBoundingClientRect().top + scrollY - (id==="" ? 0 : bar)); }, id);
      await sleep(900);
      const s = await p.evaluate(probe);
      await p.screenshot({ path: `${OUT}/walk-${name}-${String(i++).padStart(2,"0")}-${id||"hero"}.png` });
      console.log(id||"hero", JSON.stringify(s));
    }
    // sizes of each section vs viewport
    console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll("main section, footer")].map(s => [s.id||s.tagName, Math.round(s.getBoundingClientRect().height)]))));
  }
  console.log("console:", logs.length ? logs.join(" | ") : "clean");
  await c.close();
}
await b.close();
