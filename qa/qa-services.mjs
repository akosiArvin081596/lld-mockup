import { launch, ctx, BASE, OUT, sleep } from "./clint-lib.mjs";
const b = await launch(); const R = (ok, msg, extra = "") => console.log(`${ok ? "PASS" : "FAIL"} ${msg} ${extra}`);
const panel = (p) => p.evaluate(() => { const pn = document.querySelector("#services [data-reveal='doors'], #services div[aria-hidden='true'].lld-px"); const img = [...pn.querySelectorAll("img")].filter(i => +getComputedStyle(i).opacity > 0.5).map(i => (i.getAttribute("src") + i.currentSrc).match(/service-(\w+)/)?.[1]); const cap = [...pn.querySelectorAll("p")].filter(e => +getComputedStyle(e).opacity > 0.5).map(e => e.textContent.slice(0, 28)); const pressed = [...document.querySelectorAll("#services button[aria-pressed=true]")].map(e => e.textContent.trim()); return { img: img.join("+"), cap: cap.join("|"), pressed: pressed.join("|") }; });
for (const vp of [[1440, 900], [1280, 720]]) {
  const c = await ctx(b, vp); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(4000);
  await p.locator("header >> a", { hasText: "Services" }).first().click(); await sleep(4000);
  console.log(`\n== ${vp.join("x")} initial:`, JSON.stringify(await panel(p)));
  const btns = p.locator("#services ul button");
  const n = await btns.count();
  for (let i = 0; i < n; i++) { await btns.nth(i).hover(); await sleep(900); const s = await panel(p); const t = await btns.nth(i).textContent(); R(s.pressed === t.trim() && s.img.split("+").length === 1, `hover row ${i + 1} "${t.trim()}"`, JSON.stringify(s)); if (i === 3) await p.screenshot({ path: `${OUT}/services-hover4-${vp[0]}.png` }); }
  await p.mouse.move(5, 500); await sleep(300);
  // keyboard focus
  await p.locator("#services h2, #services-title").first().evaluate(e => e.setAttribute("tabindex", "-1")); await p.locator("#services-title").focus(); 
  for (let i = 0; i < n; i++) { await p.keyboard.press("Tab"); await sleep(800); const f = await p.evaluate(() => document.activeElement.textContent.trim()); const s = await panel(p); R(s.pressed === f, `Tab focus row ${i + 1} "${f}"`, JSON.stringify(s)); }
  const ring = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor, off: cs.outlineOffset }; }); console.log("   focus ring:", JSON.stringify(ring));
  await p.screenshot({ path: `${OUT}/services-focus-${vp[0]}.png` });
  // Enter/Space on button
  await c.close();
}
for (const vp of [[768, 1024], [390, 844]]) {
  const c = await ctx(b, vp); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(3500);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const s = document.getElementById("services"); scrollTo(0, s.getBoundingClientRect().top + scrollY - 72); }); await sleep(2500);
  await p.screenshot({ path: `${OUT}/services-${vp[0]}-a.png` });
  await p.evaluate(() => scrollBy(0, 700)); await sleep(2500); await p.screenshot({ path: `${OUT}/services-${vp[0]}-b.png` });
  const info = await p.evaluate(() => ({ btns: document.querySelectorAll("#services button").length, visBtn: [...document.querySelectorAll("#services button")].filter(b => b.offsetParent).length, panelVisible: !!document.querySelector("#services div[aria-hidden=true].lld-px")?.offsetParent })); console.log(vp.join("x"), JSON.stringify(info));
  await c.close();
}
await b.close();
