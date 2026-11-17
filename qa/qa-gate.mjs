import { launch, ctx, BASE, OUT, sleep } from "./clint-lib.mjs";
const b = await launch();
const gateState = (p) => p.evaluate(() => { const g = document.getElementById("age-gate"); const cs = getComputedStyle(g); const a = document.activeElement; return { visible: cs.display !== "none", role: g.getAttribute("role"), modal: g.getAttribute("aria-modal"), htmlClass: document.documentElement.className, htmlOverflow: getComputedStyle(document.documentElement).overflow, active: a ? a.tagName + "#" + a.id + ":" + (a.textContent || "").trim().slice(0, 24) : null, inGate: g.contains(a), stored: localStorage.getItem("lld-age-confirmed") }; });
const R = (ok, msg, extra = "") => console.log(`${ok ? "PASS" : "FAIL"} ${msg} ${extra}`);
for (const vp of [[1440, 900], [390, 844], [1280, 720]]) {
  console.log(`\n=== viewport ${vp.join("x")}`);
  const c = await ctx(b, vp, { confirmed: false }); const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (["error", "warning"].includes(m.type())) errs.push(m.type() + ":" + m.text().slice(0, 150)); });
  await p.goto(BASE + "/"); await sleep(1500);
  let s = await gateState(p);
  R(s.visible && s.role === "dialog" && s.modal === "true", "first visit shows gate (dialog, aria-modal)", JSON.stringify({ active: s.active, cls: s.htmlClass, ov: s.htmlOverflow }));
  await p.screenshot({ path: `${OUT}/gate-${vp[0]}.png` });
  // hero sequence paused while gate open
  const anim1 = await p.evaluate(() => { const a = document.querySelector("main .lld-crest, main .lld-line"); const an = a?.getAnimations?.()[0]; return an ? { state: an.playState, t: an.currentTime } : null; });
  await sleep(1500);
  const anim2 = await p.evaluate(() => { const a = document.querySelector("main .lld-crest, main .lld-line"); const an = a?.getAnimations?.()[0]; return an ? { state: an.playState, t: an.currentTime } : null; });
  R(anim2 && anim2.state === "paused" && anim2.t === anim1.t, "hero sequence paused while gate open", JSON.stringify([anim1, anim2]));
  // Tab trap
  const seen = new Set(); let escaped = false;
  for (let i = 0; i < 8; i++) { await p.keyboard.press("Tab"); const st = await gateState(p); seen.add(st.active); if (!st.inGate) escaped = true; }
  for (let i = 0; i < 4; i++) { await p.keyboard.press("Shift+Tab"); const st = await gateState(p); seen.add(st.active); if (!st.inGate) escaped = true; }
  R(!escaped, "Tab/Shift+Tab trapped", [...seen].join(" | "));
  // Esc
  await p.keyboard.press("Escape"); s = await gateState(p); R(s.visible, "Esc does not dismiss");
  // scroll lock
  await p.mouse.wheel(0, 1500); await p.keyboard.press("PageDown"); await sleep(500); const y = await p.evaluate(() => scrollY); R(y === 0, "page cannot scroll behind gate", "scrollY=" + y);
  // clicking behind (header) should not be possible: check elementFromPoint
  const top = await p.evaluate(() => { const e = document.elementFromPoint(innerWidth / 2, 40); return e.closest("#age-gate") ? "gate" : e.tagName; }); R(top === "gate", "gate covers header area", top);
  // mobile gate: all content reachable
  const fit = await p.evaluate(() => { const g = document.getElementById("age-gate"); const btns = [...g.querySelectorAll("button,a")].map(e => { const r = e.getBoundingClientRect(); return [e.textContent.trim().slice(0, 20), Math.round(r.top), Math.round(r.bottom)]; }); return { sh: g.scrollHeight, ch: g.clientHeight, btns }; });
  console.log("   gate fit:", JSON.stringify(fit));
  // Confirm
  await p.getByRole("button", { name: "I am 21 or older" }).click(); await sleep(400); s = await gateState(p);
  R(!s.visible && s.htmlClass.includes("age-ok") && !!s.stored, "confirm hides gate + stores", JSON.stringify({ stored: s.stored, active: s.active, ov: s.htmlOverflow }));
  await sleep(1200);
  const anim3 = await p.evaluate(() => { const a = document.querySelector("main .lld-crest, main .lld-line"); const an = a?.getAnimations?.()[0]; return an ? { state: an.playState, t: Math.round(an.currentTime) } : null; });
  R(anim3 && anim3.state !== "paused" && anim3.t < 2500, "hero sequence starts after confirm", JSON.stringify(anim3));
  await p.screenshot({ path: `${OUT}/gate-after-confirm-${vp[0]}.png` });
  await p.reload(); await sleep(800); s = await gateState(p); R(!s.visible, "persists after reload");
  // 30 day logic
  for (const [label, val, expectVisible] of [["29 days old", Date.now() - 29 * 864e5, false], ["31 days old", Date.now() - 31 * 864e5, true], ["exactly 30d+1min", Date.now() - 30 * 864e5 - 60000, true]]) {
    await p.evaluate((v) => localStorage.setItem("lld-age-confirmed", JSON.stringify({ confirmedAt: v })), val); await p.reload(); await sleep(700); s = await gateState(p); R(s.visible === expectVisible, `record ${label} -> gate ${expectVisible ? "shown" : "hidden"}`);
  }
  for (const [label, raw] of [["garbage", "not json"], ["string ts", JSON.stringify({ confirmedAt: "123" })], ["missing", "{}"]]) {
    await p.evaluate((v) => localStorage.setItem("lld-age-confirmed", v), raw); await p.reload(); await sleep(600); s = await gateState(p); R(s.visible, `malformed record (${label}) -> gate shown`);
  }
  await p.evaluate(() => localStorage.removeItem("lld-age-confirmed")); await p.reload(); await sleep(600);
  // Under 21
  const hits = []; await c.route(/responsibility\.org/, (r) => { hits.push(r.request().url()); r.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>stub" }); });
  await p.getByRole("link", { name: "I am under 21" }).click(); await sleep(1200);
  R(hits.length > 0 && /responsibility\.org/.test(p.url()), "Under 21 navigates to responsibility.org", hits.join(",") + " url=" + p.url());
  const stored = await p.evaluate(() => localStorage.getItem("lld-age-confirmed")).catch(() => "n/a"); 
  console.log("   console/page errors:", errs.length ? errs.join(" | ") : "none");
  await c.close();
}
// legal pages exemption and 404
{
  const c = await ctx(b, [1440, 900], { confirmed: false }); const p = await c.newPage();
  for (const path of ["/privacy", "/terms", "/accessibility", "/nope"]) { await p.goto(BASE + path); await sleep(900); const s = await gateState(p).catch(() => null); console.log(`unconfirmed ${path}: gate visible=${s?.visible} cls=${s?.htmlClass}`); }
  await p.goto(BASE + "/privacy"); await sleep(500); await p.locator("header a[href='/'], a[href='/']").first().click(); await sleep(1200); const s2 = await gateState(p); console.log("client nav privacy -> home (unconfirmed): gate visible=", s2.visible, "active=", s2.active);
  await c.close();
}
await b.close();
