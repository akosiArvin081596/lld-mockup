import { launch, ctx, BASE, sleep } from "./clint-lib.mjs";
const b = await launch(); const c = await ctx(b,[1440,900]); const p = await c.newPage();
const bad = /—|–|\b(unlock|elevate|seamless|seamlessly|empower|unleash|revolutioni[sz]e|cutting-edge|world-class|next-level|lorem|ipsum|todo|tbd|placeholder|synergy|leverage)\b|fast-paced|✨|[\u{1F300}-\u{1FAFF}]/giu;
for (const path of ["/","/privacy","/terms","/accessibility","/zzz"]) { await p.goto(BASE+path); await sleep(2500);
  const t = await p.evaluate(()=>document.body.innerText + "\n" + [...document.querySelectorAll("[alt],[aria-label],title")].map(e=>e.getAttribute("alt")||e.getAttribute("aria-label")||e.textContent).join("\n")+ "\n"+document.title+"\n"+document.querySelector("meta[name=description]")?.content);
  const hits=[...t.matchAll(bad)].map(m=>m[0]); console.log(path, hits.length?("HITS: "+[...new Set(hits)].join(",")):"clean", "chars", t.length); }
// parallax moves
await p.goto(BASE+"/"); await sleep(4000);
const par = async () => p.evaluate(()=>{ const imgs=[...document.querySelectorAll(".lld-px-img")].filter(i=>{const r=i.getBoundingClientRect();return r.width>100&&r.bottom>72&&r.top<innerHeight}); return imgs.slice(0,2).map(i=>{const cs=getComputedStyle(i);return (i.getAttribute("src")||"").slice(-26)+" translate="+cs.translate+" scale="+cs.scale}); });
for (const y of [828, 1000, 1656]) { await p.evaluate((y)=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,y)}, y); await sleep(800); console.log("y",y, JSON.stringify(await par())); }
const hasTimeline = await p.evaluate(()=>CSS.supports("animation-timeline","view()")); console.log("animation-timeline supported:", hasTimeline);
await b.close();
