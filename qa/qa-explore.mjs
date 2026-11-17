import { launch, ctx, BASE, sleep } from "./clint-lib.mjs";
const b = await launch(); const c = await ctx(b,[1440,900]); const p = await c.newPage();
const logs=[]; p.on("console", m=>logs.push(m.type()+": "+m.text()));
await p.goto(BASE+"/"); await sleep(3500);
const info = await p.evaluate(()=>{
  const q=(s)=>[...document.querySelectorAll(s)];
  return {
    snap: getComputedStyle(document.documentElement).scrollSnapType,
    docH: document.documentElement.scrollHeight,
    sections: q("[data-section]").map(s=>({tag:s.tagName,id:s.id,cls:s.className.slice(0,80),top:Math.round(s.getBoundingClientRect().top+scrollY),h:Math.round(s.getBoundingClientRect().height),snap:getComputedStyle(s).scrollSnapAlign})),
    topLevel: q("main > *, body > *").map(s=>s.tagName+"#"+s.id+"."+String(s.className).slice(0,50)),
    h1: q("h1").length, header:q("[data-site-header]").length,
  };
});
console.log(JSON.stringify(info,null,1)); console.log(logs.join("\n"));
await b.close();
