// Item 2: nav anchors, active item, process stepper, keyboard stepping.
import { launch, ctx, BASE, VPS, OUT, sleep } from "./clint-lib.mjs";
const names = process.argv.slice(2).length ? process.argv.slice(2) : ["d1440"];
const b = await launch();
const settle = (p) => p.evaluate(() => new Promise(res => { let t; const done = () => { clearTimeout(t); t = setTimeout(res, 700); }; addEventListener("scroll", done, { passive: true }); done(); setTimeout(res, 5000); }));
const state = (p) => p.evaluate(() => {
  const bar = document.querySelector("[data-site-header]").offsetHeight;
  const secs = [...document.querySelectorAll("main section, footer")];
  const cur = secs.find(s => { const r = s.getBoundingClientRect(); return r.top <= bar + 10 && r.bottom > bar + 10; });
  const procImgs = [...document.querySelectorAll("#process img")].filter(i => i.offsetWidth > 0 && +getComputedStyle(i).opacity > 0.5).map(i => (i.getAttribute("src") + i.currentSrc).match(/process-(\w+)/)?.[1]);
  return { y: Math.round(scrollY), sec: cur?.id || cur?.tagName, top: cur && Math.round(cur.getBoundingClientRect().top - bar), nav: [...document.querySelectorAll("header nav a[aria-current='true']")].map(a => a.textContent.trim()).join(","), step: document.querySelector("#process [aria-current='step']")?.textContent.slice(0, 10), procImgs: procImgs.join("+") };
});
for (const name of names) {
  const vp = VPS[name]; const desk = vp[0] >= 1024;
  const c = await ctx(b, vp); const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(BASE + "/"); await sleep(4000);
  console.log(`\n===== ${name} ${vp.join("x")}`);
  if (desk) {
    const links = [["About","legacy"],["Services","services"],["Process","process"],["Partners","partners"],["Contact","contact"],["Partner with us","contact"]];
    for (const start of ["top", "bottom"]) {
      for (const [label, id] of links) {
        await p.evaluate((s) => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, s === "top" ? 0 : 1e6); }, start); await sleep(900);
        await p.locator("header >> a", { hasText: label }).first().click(); await settle(p);
        const s = await state(p);
        const ok = s.sec === id && Math.abs(s.top) <= 1 && (label === "Partner with us" ? true : s.nav === label);
        console.log(`${ok ? "PASS" : "FAIL"} from ${start}: click "${label}" -> ${JSON.stringify(s)}`);
      }
    }
    // hero CTAs + footer links
    await p.evaluate(() => { scrollTo(0, 0); }); await sleep(900);
    for (const [txt, id] of [["Our services", "services"], ["Partner with us", "contact"]]) {
      await p.evaluate(() => scrollTo(0, 0)); await sleep(900);
      await p.locator("main section").first().getByRole("link", { name: txt }).click(); await settle(p); const s = await state(p);
      console.log(`${s.sec === id && Math.abs(s.top) <= 1 ? "PASS" : "FAIL"} hero CTA "${txt}" -> ${JSON.stringify(s)}`);
    }
    // Process stepper
    await p.locator("header >> a", { hasText: "Process" }).first().click(); await settle(p);
    const seq = [];
    for (let i = 0; i < 4; i++) { await sleep(1300); const s = await state(p); seq.push(s); if (i < 3) { await p.keyboard.press("PageDown"); await settle(p); } }
    console.log("process down:", seq.map(s => `${s.step}|${s.procImgs}|y${s.y}`).join("  "));
    const up = [];
    for (let i = 0; i < 4; i++) { await sleep(1300); const s = await state(p); up.push(s); if (i < 3) { await p.keyboard.press("PageUp"); await settle(p); } }
    console.log("process up  :", up.map(s => `${s.step}|${s.procImgs}|y${s.y}`).join("  "));
    await p.screenshot({ path: `${OUT}/process-${name}-up-end.png` });
    for (const n of [3, 1, 2, 0]) {
      await p.locator("#process ol button").nth(n).click(); await settle(p); await sleep(1300); const s = await state(p);
      console.log(`click row ${n + 1} -> step=${s.step} img=${s.procImgs} y=${s.y}`);
      await p.screenshot({ path: `${OUT}/process-${name}-row${n + 1}.png` });
    }
    // keyboard: ArrowDown/Up and PageDown/Up/Space from services
    await p.locator("header >> a", { hasText: "Services" }).first().click(); await settle(p);
    for (const k of ["ArrowDown", "ArrowDown", "PageDown", "ArrowUp", "PageUp", "Space", "End", "Home"]) {
      const before = (await state(p)).y; await p.keyboard.press(k); await settle(p); const s = await state(p);
      console.log(`key ${k}: ${before} -> ${s.y} (${s.sec} top=${s.top}) delta=${s.y - before}`);
    }
  } else {
    // mobile/tablet: open menu, click each link, check landing + menu closed + scroll unlocked
    for (const [label, id] of [["About","legacy"],["Services","services"],["Process","process"],["Partners","partners"],["Contact","contact"]]) {
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0); }); await sleep(600);
      await p.getByRole("button", { name: "Open menu" }).click(); await sleep(700);
      await p.locator("#mobile-menu").getByRole("link", { name: label }).click(); await settle(p); await sleep(500);
      const s = await state(p); const menuHidden = await p.evaluate(() => getComputedStyle(document.getElementById("mobile-menu")).visibility); const ov = await p.evaluate(() => document.documentElement.style.overflow);
      console.log(`${s.sec === id && Math.abs(s.top) <= 2 && menuHidden === "hidden" && !ov ? "PASS" : "FAIL"} menu "${label}" -> ${JSON.stringify(s)} menu=${menuHidden} overflowLock="${ov}"`);
    }
  }
  console.log("pageerrors:", errs.join("|") || "none");
  await c.close();
}
await b.close();
