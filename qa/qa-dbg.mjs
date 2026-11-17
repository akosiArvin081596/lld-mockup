import { launch, ctx, sleep } from "./clint-lib.mjs";
const b = await launch(); const c = await ctx(b,[1440,900]); const p = await c.newPage(); const reqs=[];
p.on("response", async r=>{ if(/_next\/image|\/media\//.test(r.url())) { const h=r.headers(); reqs.push([decodeURIComponent(r.url().split("/").pop()).replace("_next/image?url=","").slice(0,60), h["content-length"]||"?"]); } });
await p.goto("http://127.0.0.1:3421/"); await sleep(3500);
for (let i=0;i<12;i++){ await p.keyboard.press("PageDown"); await sleep(1200); }
const big = reqs.filter(([u])=>/w=(2048|3840|1920)/.test(u)); console.log("total image/media requests", reqs.length, "| w>=1920:", big.map(x=>x.join(" ")).join(" || "));
const tot = reqs.reduce((s,[,l])=>s+(+l||0),0); console.log("bytes (known content-length):", tot);
console.log(reqs.filter(([,l])=>+l>300000).map(x=>x.join(" ")).join("\n"));
// parallax on legacy barrel / partners
for (const y of [828, 5796]) { await p.evaluate((y)=>{document.documentElement.style.scrollBehavior="auto"; scrollTo(0,y)}, y); await sleep(800); console.log("y",y, JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll(".lld-px-img, .lld-px img")].filter(i=>{const r=i.getBoundingClientRect();return r.width>100&&r.bottom>72&&r.top<innerHeight}).slice(0,3).map(i=>{const cs=getComputedStyle(i);return (i.getAttribute("alt")||"").slice(0,14)+" t="+cs.translate+" s="+cs.scale}))));
 await p.evaluate((y)=>{scrollTo(0,y+30)}, y); await sleep(500); console.log("  +30px", JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll(".lld-px-img, .lld-px img")].filter(i=>{const r=i.getBoundingClientRect();return r.width>100&&r.bottom>72&&r.top<innerHeight}).slice(0,3).map(i=>{const cs=getComputedStyle(i);return " t="+cs.translate+" s="+cs.scale})))); }
await b.close();
