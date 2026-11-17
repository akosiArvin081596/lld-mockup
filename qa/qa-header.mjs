import { launch, ctx, BASE, OUT, sleep } from "./clint-lib.mjs";
const b = await launch();
const R = (ok, msg, extra = "") => console.log(`${ok ? "PASS" : "FAIL"} ${msg} ${extra}`);
const logoVis = (p) => p.evaluate(() => { const h = document.querySelector("[data-site-header]"); const slot = h.querySelector("a[aria-label]").parentElement; const cs = getComputedStyle(slot); const a = h.querySelector("a[aria-label]"); const crest = document.getElementById("hero-crest"); const cr = crest?.getBoundingClientRect(); return { logo: cs.visibility !== "hidden" && +cs.opacity > 0.5, tabbable: a.tabIndex === 0, crestOnScreen: !!cr && cr.bottom > 72 && cr.top < innerHeight, y: Math.round(scrollY) }; });
// Desktop header
{
  const c = await ctx(b, [1440, 900]); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(4500);
  let s = await logoVis(p); R(!s.logo && !s.tabbable, "desktop: no header logo over hero crest", JSON.stringify(s));
  await p.screenshot({ path: `${OUT}/header-hero-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 140 } });
  await p.keyboard.press("PageDown"); await sleep(1800); s = await logoVis(p); R(s.logo && s.tabbable, "desktop: logo appears after scrolling past hero", JSON.stringify(s));
  await p.keyboard.press("PageUp"); await sleep(1800); s = await logoVis(p); R(!s.logo, "desktop: logo hides again back at hero", JSON.stringify(s));
  // video controls
  const vinfo = await p.evaluate(() => { const v = document.querySelector("video"); return { paused: v.paused, src: v.currentSrc, ready: v.readyState, muted: v.muted, loop: v.loop, aria: v.getAttribute("aria-hidden"), poster: v.poster }; }); console.log("   video:", JSON.stringify(vinfo));
  R(!vinfo.paused && /1080/.test(vinfo.src), "desktop: video autoplays 1080 source");
  const btn = p.locator("main section").first().getByRole("button");
  console.log("   hero buttons:", await btn.evaluateAll(els => els.map(e => e.getAttribute("aria-label") + "|" + e.getAttribute("aria-pressed"))));
  await btn.first().click(); await sleep(400); let v = await p.evaluate(() => ({ paused: document.querySelector("video").paused, label: document.querySelector("main section button").getAttribute("aria-label") }));
  R(v.paused && /Play background video/.test(v.label), "pause button pauses and relabels", JSON.stringify(v));
  await btn.first().click(); await sleep(600); v = await p.evaluate(() => ({ paused: document.querySelector("video").paused, label: document.querySelector("main section button").getAttribute("aria-label") }));
  R(!v.paused && /Pause background video/.test(v.label), "play button resumes and relabels", JSON.stringify(v));
  // keyboard activation
  await btn.first().focus(); await p.keyboard.press("Enter"); await sleep(300); v = await p.evaluate(() => document.querySelector("video").paused); R(v === true, "pause via Enter key"); await p.keyboard.press("Space"); await sleep(400); v = await p.evaluate(() => document.querySelector("video").paused); R(v === false, "play via Space key");
  await c.close();
}
// Tablet: crest vs logo while scrolling (free scroll)
for (const vp of [[768, 1024], [390, 844]]) {
  const c = await ctx(b, vp); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(4500);
  const rows = []; for (const y of [0, 100, 250, 400, 600, 800]) { await p.evaluate((y) => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, y); }, y); await sleep(500); rows.push(await logoVis(p)); }
  console.log(`${vp.join("x")} logo/crest by scroll:`, rows.map(r => `y${r.y}:logo=${r.logo},crest=${r.crestOnScreen}`).join("  "));
  R(rows.every(r => !(r.logo && r.crestOnScreen)), `${vp[0]}: header logo and hero crest never both visible`);
  await c.close();
}
// Mobile menu
{
  const c = await ctx(b, [390, 844]); const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); await p.goto(BASE + "/"); await sleep(4500);
  const act = () => p.evaluate(() => { const a = document.activeElement; return (a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 24)); });
  await p.getByRole("button", { name: "Open menu" }).click(); await sleep(700);
  R((await act()).startsWith("A:") || /Close/.test(await act()), "menu open: focus moved into menu", await act());
  await p.screenshot({ path: `${OUT}/menu-open-390.png` });
  const seq = []; let escaped = false; for (let i = 0; i < 10; i++) { await p.keyboard.press("Tab"); seq.push(await act()); const inside = await p.evaluate(() => document.getElementById("mobile-menu").contains(document.activeElement)); if (!inside) escaped = true; }
  for (let i = 0; i < 3; i++) { await p.keyboard.press("Shift+Tab"); const inside = await p.evaluate(() => document.getElementById("mobile-menu").contains(document.activeElement)); if (!inside) escaped = true; }
  R(!escaped, "menu focus trap", seq.join(" > "));
  const lock = await p.evaluate(() => getComputedStyle(document.documentElement).overflow); await p.mouse.wheel(0, 800); await p.keyboard.press("PageDown"); await sleep(500); const y = await p.evaluate(() => scrollY);
  R(lock === "hidden" && y === 0, "menu scroll lock", `overflow=${lock} scrollY=${y}`);
  await p.keyboard.press("Escape"); await sleep(600); let st = await p.evaluate(() => ({ vis: getComputedStyle(document.getElementById("mobile-menu")).visibility, ov: document.documentElement.style.overflow, active: document.activeElement.getAttribute("aria-label"), exp: document.querySelector("[aria-controls=mobile-menu]").getAttribute("aria-expanded") }));
  R(st.vis === "hidden" && !st.ov && /Open menu/.test(st.active) && st.exp === "false", "Esc closes, restores scroll + focus to toggle", JSON.stringify(st));
  // menu CTA click
  await p.getByRole("button", { name: "Open menu" }).click(); await sleep(600); await p.locator("#mobile-menu").getByRole("link", { name: "Partner with us" }).click(); await sleep(2500);
  st = await p.evaluate(() => ({ vis: getComputedStyle(document.getElementById("mobile-menu")).visibility, y: scrollY, ov: document.documentElement.style.overflow, hash: location.hash }));
  R(st.vis === "hidden" && st.y > 5000 && !st.ov, "CTA link closes menu and scrolls to contact", JSON.stringify(st));
  // close button
  await p.evaluate(() => scrollTo(0, 0)); await sleep(500); await p.getByRole("button", { name: "Open menu" }).click(); await sleep(500); await p.getByRole("button", { name: "Close menu" }).click(); await sleep(500);
  R(await p.evaluate(() => getComputedStyle(document.getElementById("mobile-menu")).visibility === "hidden"), "Close button closes");
  // closed menu links not tabbable
  const hiddenTab = await p.evaluate(() => { const m = document.getElementById("mobile-menu"); return getComputedStyle(m).visibility; }); console.log("   closed menu visibility:", hiddenTab);
  // resize to desktop while open
  await p.evaluate(() => scrollTo(0, 0)); await p.getByRole("button", { name: "Open menu" }).click(); await sleep(400); await p.setViewportSize({ width: 1300, height: 800 }); await sleep(600);
  st = await p.evaluate(() => ({ ov: document.documentElement.style.overflow, vis: getComputedStyle(document.getElementById("mobile-menu")).display })); R(!st.ov, "resize to desktop while open releases scroll lock", JSON.stringify(st));
  console.log("   pageerrors:", errs.join("|") || "none");
  await c.close();
}
// Reduced motion video
{
  const c = await ctx(b, [1440, 900], { reducedMotion: "reduce" }); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(2500);
  const v = await p.evaluate(() => ({ paused: document.querySelector("video").paused, label: document.querySelector("main section button")?.getAttribute("aria-label"), poster: document.querySelector("video").poster })); R(v.paused && /Play/.test(v.label), "reduced motion: video not autoplaying, toggle says Play", JSON.stringify(v));
  await p.screenshot({ path: `${OUT}/hero-reduced-1440.png` });
  await c.close();
}
await b.close();
