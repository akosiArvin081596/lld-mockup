import { launch, ctx, BASE, OUT, sleep } from "./clint-lib.mjs";
const b = await launch(); const R = (ok, msg, extra = "") => console.log(`${ok ? "PASS" : "FAIL"} ${msg} ${extra}`);
const toContact = async (p) => { await p.locator("header >> a", { hasText: "Contact" }).first().click(); await sleep(2500); };
const mobileGo = async (p) => { await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; const s = document.getElementById("contact"); scrollTo(0, s.getBoundingClientRect().top + scrollY - 72); }); await sleep(800); };
const fill = async (p, o = {}) => {
  const v = { name: "QA Tester", company: "Clint QA Co", email: "qa@example.com", phone: "", inquiry: "supplier", state: "NY", message: "Automated QA dry run. Please ignore.", consent: true, ...o };
  await p.fill("#contact-name", v.name); await p.fill("#contact-company", v.company); await p.fill("#contact-email", v.email); if (v.phone) await p.fill("#contact-phone", v.phone);
  if (v.inquiry) await p.selectOption("#contact-inquiryType", v.inquiry); if (v.state) await p.selectOption("#contact-state", v.state); await p.fill("#contact-message", v.message); if (v.consent) await p.check("#contact-consent");
};
const inspect = (p) => p.evaluate(() => { const a = document.activeElement; const invalid = [...document.querySelectorAll("#contact [aria-invalid=true]")].map(e => ({ id: e.id, desc: e.getAttribute("aria-describedby"), err: document.getElementById((e.getAttribute("aria-describedby") || "").split(" ").pop())?.textContent })); const live = [...document.querySelectorAll("#contact [aria-live],#contact [role=alert],#contact [role=status]")].map(e => `${e.getAttribute("aria-live") || e.getAttribute("role")}:${e.textContent.trim().slice(0, 70)}`); return { active: a.id || a.tagName, invalid, live, btnDisabled: document.querySelector("#contact button[type=submit]")?.disabled }; });
for (const vp of [[1440, 900], [390, 844]]) {
  console.log(`\n== ${vp.join("x")}`);
  const c = await ctx(b, vp); const p = await c.newPage(); const posts = []; const errs = [];
  p.on("request", r => { if (r.method() === "POST" && /api\/contact/.test(r.url())) posts.push(r.postData()); }); p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); });
  await p.goto(BASE + "/"); await sleep(4000); if (vp[0] > 1000) await toContact(p); else await mobileGo(p);
  // 1 empty submit
  await p.getByRole("button", { name: "Send inquiry" }).click(); await sleep(600); let s = await inspect(p);
  R(s.active === "contact-name" && s.invalid.length >= 6 && posts.length === 0, "empty submit: error summary, focus on first field, no POST", JSON.stringify({ active: s.active, n: s.invalid.length, posts: posts.length }));
  console.log("   invalid:", s.invalid.map(i => `${i.id}:${i.err}`).join(" | ")); console.log("   live:", s.live.join(" || "));
  await p.screenshot({ path: `${OUT}/contact-empty-${vp[0]}.png` });
  // 2 bad email only
  await fill(p, { email: "foo@" }); await p.getByRole("button", { name: "Send inquiry" }).click(); await sleep(600); s = await inspect(p);
  R(s.active === "contact-email" && s.invalid.length === 1 && posts.length === 0, "bad email: single error, focus on email, no POST", JSON.stringify({ active: s.active, inv: s.invalid.map(i => i.id + ":" + i.err) }));
  await p.screenshot({ path: `${OUT}/contact-bademail-${vp[0]}.png` });
  for (const bad of ["a@b", "a b@c.com", "@x.com", "x@y..com"]) { await p.fill("#contact-email", bad); await p.getByRole("button", { name: "Send inquiry" }).click(); await sleep(250); const ss = await inspect(p); console.log(`   email "${bad}" -> invalid:${ss.invalid.map(i => i.id).join(",") || "none"} posts:${posts.length}`); }
  // consent unchecked
  await p.fill("#contact-email", "qa@example.com"); await p.uncheck("#contact-consent"); await p.getByRole("button", { name: "Send inquiry" }).click(); await sleep(400); s = await inspect(p); R(s.invalid.some(i => i.id === "contact-consent") && posts.length === 0, "consent unchecked is blocked", s.active);
  await p.check("#contact-consent");
  // whitespace-only name
  await p.fill("#contact-name", "   "); await p.getByRole("button", { name: "Send inquiry" }).click(); await sleep(400); s = await inspect(p); R(s.invalid.some(i => i.id === "contact-name") && posts.length === 0, "whitespace-only name blocked");
  await p.fill("#contact-name", "QA Tester");
  // 3 valid submit with delay to see sending state (real request, 1 POST)
  if (vp[0] > 1000) {
    await sleep(3200);
    const p0 = p.getByRole("button", { name: "Send inquiry" }); await p0.click(); await sleep(150);
    const sending = await p.evaluate(() => ({ dis: document.querySelector("#contact button[type=submit]")?.disabled, txt: document.querySelector("#contact button[type=submit]")?.textContent.trim() })); console.log("   during send:", JSON.stringify(sending));
    await sleep(1800);
    const body = await p.evaluate(() => document.getElementById("contact").innerText); R(/Thank you/.test(body), "valid submit shows success", body.match(/Thank you[^]{0,80}/)?.[0].replace(/\n/g, " "));
    console.log("   POSTs sent:", posts.length, "payload keys:", posts[0] ? Object.keys(JSON.parse(posts[0])).join(",") : "-");
    console.log("   focus after success:", await p.evaluate(() => document.activeElement.tagName + ":" + document.activeElement.textContent.slice(0, 20)));
    await p.screenshot({ path: `${OUT}/contact-success-${vp[0]}.png` });
  } else {
    await p.screenshot({ path: `${OUT}/contact-filled-${vp[0]}.png` });
  }
  console.log("   errs:", errs.join(" | ") || "none");
  await c.close();
}
// Mocked failure states (no real POST)
{
  const c = await ctx(b, [1440, 900]); const p = await c.newPage(); await p.goto(BASE + "/"); await sleep(4000); await toContact(p);
  for (const [status, body] of [[500, { ok: false, error: "send_failed" }], [429, { ok: false, error: "rate_limited" }], [429, { ok: false, error: "busy" }], [503, { ok: false, error: "not_configured" }], [400, { ok: false, errors: { email: "Server says bad email" } }]]) {
    await p.route("**/api/contact", (r) => r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));
    await fill(p); await sleep(3200); await p.getByRole("button", { name: "Send inquiry" }).click(); await sleep(1200);
    const t = await p.evaluate(() => ({ txt: [...document.querySelectorAll("#contact [role=alert],#contact [aria-live]")].map(e => e.textContent.trim()).filter(Boolean).join(" || "), kept: document.getElementById("contact-name")?.value, dis: document.querySelector("#contact button[type=submit]")?.disabled, inv: [...document.querySelectorAll("#contact [aria-invalid=true]")].map(e => e.id).join(",") }));
    console.log(`mock ${status} ${body.error || "field-errors"} ->`, JSON.stringify(t));
    if (status === 500) await p.screenshot({ path: `${OUT}/contact-error-500.png` });
    await p.unroute("**/api/contact");
  }
  // network failure
  await p.route("**/api/contact", (r) => r.abort()); await sleep(100); await p.getByRole("button", { name: /Send inquiry/ }).click().catch(() => {}); await sleep(1200);
  console.log("network abort ->", await p.evaluate(() => [...document.querySelectorAll("#contact [role=alert],#contact [aria-live]")].map(e => e.textContent.trim()).filter(Boolean).join(" || ")));
  await c.close();
}
await b.close();
