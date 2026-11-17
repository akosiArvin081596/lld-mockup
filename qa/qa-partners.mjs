import { launch, ctx, BASE, OUT, sleep } from "./clint-lib.mjs";
const b = await launch(); const R = (ok, msg, extra = "") => console.log(`${ok ? "PASS" : "FAIL"} ${msg} ${extra}`);
const sel = (p) => p.evaluate(() => { const s = document.querySelector("#contact select"); const st = [...document.querySelectorAll("#contact select")].map(x => x.name + "=" + x.value); const bar = document.querySelector("[data-site-header]").offsetHeight; const c = document.getElementById("contact").getBoundingClientRect().top - bar; return { selects: st.join(","), y: Math.round(scrollY), contactTop: Math.round(c), url: location.pathname + location.search + location.hash }; });
for (const vp of [[1440, 900], [390, 844]]) {
  console.log(`\n== ${vp.join("x")}`);
  for (const [q, exp] of [["supplier", "supplier"], ["retail", "retail"], ["importer", "importer"], ["bogus", ""], ["", ""]]) {
    const c = await ctx(b, vp); const p = await c.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0, 120)); });
    await p.goto(BASE + `/${q ? "?inquiry=" + q : ""}#contact`); await sleep(5000); const s = await sel(p);
    R(s.selects.split(",")[0]?.endsWith("=" + exp) && Math.abs(s.contactTop) <= 2, `fresh load ?inquiry=${q || "(none)"}#contact`, JSON.stringify(s) + (errs.length ? " ERR:" + errs.join("|") : ""));
    if (q === "supplier") await p.screenshot({ path: `${OUT}/inquiry-fresh-${vp[0]}.png` });
    await c.close();
  }
  // same-page clicks
  const c = await ctx(b, vp); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(4000);
  const goPartners = async () => { await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const s = document.getElementById("partners"); scrollTo(0, s.getBoundingClientRect().top + scrollY - 72); }); await sleep(3300); };
  await goPartners();
  await p.getByRole("link", { name: "Submit your brand" }).click(); await sleep(3000); let s = await sel(p); R(s.selects.includes("inquiryType=supplier") && Math.abs(s.contactTop) <= 2, "same-page click 'Submit your brand' -> supplier + lands on contact", JSON.stringify(s));
  await goPartners(); await p.getByRole("link", { name: "Open an account" }).click(); await sleep(3000); s = await sel(p); R(s.selects.includes("inquiryType=retail") && Math.abs(s.contactTop) <= 2, "same-page click 'Open an account' -> retail", JSON.stringify(s));
  // manual change then click same CTA again
  await p.locator("#contact select").first().selectOption("media"); await goPartners(); await p.getByRole("link", { name: "Open an account" }).click(); await sleep(3000); s = await sel(p);
  R(s.selects.includes("inquiryType=retail"), "re-click same CTA after manual change re-applies retail", JSON.stringify(s));
  await goPartners(); await p.getByRole("link", { name: "Submit your brand" }).click(); await sleep(3000); s = await sel(p); R(s.selects.includes("inquiryType=supplier"), "then other CTA -> supplier", JSON.stringify(s));
  // header CTA keeps selection?
  await p.screenshot({ path: `${OUT}/inquiry-click-${vp[0]}.png` });
  await c.close();
}
await b.close();
