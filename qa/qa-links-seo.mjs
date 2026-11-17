import { launch, ctx, sleep } from "./clint-lib.mjs"; import fs from "fs";
const BASE = process.argv[2]; const b = await launch(); const c = await ctx(b, [1440, 900]); const p = await c.newPage(); const req = c.request;
const origin = new URL(BASE).origin; const bad = []; const seen = new Map();
const check = async (u, label) => { if (seen.has(u)) return; let r; try { r = await req.get(u, { maxRedirects: 0, timeout: 20000 }); } catch (e) { seen.set(u, "ERR " + e.message.slice(0, 40)); bad.push(`${label} ${u} ERR`); return; } seen.set(u, r.status()); if (r.status() !== 200) bad.push(`${label} ${u} -> ${r.status()}`); };
const pages = ["/", "/privacy", "/terms", "/accessibility", "/this-page-does-not-exist"];
const metaOut = {};
for (const path of pages) {
  const errs = []; const p2 = await c.newPage(); p2.on("console", m => { if (["error", "warning"].includes(m.type())) errs.push(m.type() + ": " + m.text().slice(0, 160)); }); p2.on("pageerror", e => errs.push("pageerror " + e.message)); const failed = []; p2.on("response", r => { if (r.status() >= 400 && !/this-page-does-not-exist/.test(r.url())) failed.push(r.status() + " " + r.url()); }); p2.on("requestfailed", r => failed.push("FAILED " + r.url().slice(-60)));
  const resp = await p2.goto(BASE + path); await sleep(3500);
  const d = await p2.evaluate(() => {
    const m = (s, a = "content") => document.querySelector(s)?.getAttribute(a) ?? null;
    const urls = { img: [...document.images].flatMap(i => [i.currentSrc || i.src]), source: [...document.querySelectorAll("source")].map(s => s.src), link: [...document.querySelectorAll("link[href]")].map(l => l.href), a: [...document.querySelectorAll("a[href]")].map(a => a.href), video: [...document.querySelectorAll("video")].map(v => v.poster).filter(Boolean) };
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent);
    const imgsNoAlt = [...document.images].filter(i => !i.hasAttribute("alt")).map(i => i.src.slice(-40));
    return { title: document.title, desc: m('meta[name=description]'), canonical: m('link[rel=canonical]', 'href'), robots: m('meta[name=robots]'), lang: document.documentElement.lang, viewport: m('meta[name=viewport]'), themeColor: m('meta[name=theme-color]'),
      og: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map(e => [e.getAttribute("property"), e.content])), tw: Object.fromEntries([...document.querySelectorAll('meta[name^="twitter:"]')].map(e => [e.name, e.content])),
      icons: [...document.querySelectorAll('link[rel*=icon],link[rel=manifest]')].map(l => l.rel + ":" + l.getAttribute("href")), ld, h1: document.querySelectorAll("h1").length, h1text: document.querySelector("h1")?.textContent.trim().slice(0, 50), headings: [...document.querySelectorAll("h1,h2,h3")].map(h => h.tagName + " " + h.textContent.trim().slice(0, 25)).join(" / ").slice(0, 600), imgsNoAlt, urls, mainCount: document.querySelectorAll("main").length, hash: [...document.querySelectorAll("a[href^='#']")].map(a => a.getAttribute("href")).filter(h => h !== "#" && !document.querySelector(h)) };
  });
  metaOut[path] = { status: resp.status(), ...d, urls: undefined, errs, failed };
  for (const [k, list] of Object.entries(d.urls)) for (const u of list) { if (!u || u.startsWith("data:") || u.startsWith("blob:") || u.startsWith("mailto:") || u.startsWith("tel:")) continue; const U = new URL(u); if (U.origin !== origin) { if (k === "a") continue; bad.push(`EXTERNAL ${k} ${u}`); continue; } U.hash = ""; await check(U.toString(), `[${path}] ${k}`); }
  await p2.close();
}
// media files on disk
for (const f of fs.readdirSync("public/media")) await check(`${origin}/media/${f}`, "media");
for (const f of ["/favicon.ico", "/icon.svg", "/apple-touch-icon.png", "/manifest.webmanifest", "/og-image.jpg", "/robots.txt", "/sitemap.xml", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png"]) await check(origin + f, "asset");
for (const [pth, m] of Object.entries(metaOut)) { console.log(`\n## ${pth} status=${m.status} title="${m.title}" lang=${m.lang} h1=${m.h1} ("${m.h1text}") main=${m.mainCount} robots=${m.robots} canonical=${m.canonical}`); console.log("  desc:", m.desc); console.log("  og:", JSON.stringify(m.og)); console.log("  tw:", JSON.stringify(m.tw)); console.log("  icons:", m.icons.join(" ")); console.log("  viewport:", m.viewport, "| themeColor:", m.themeColor, "| imgs w/o alt attr:", m.imgsNoAlt.join(",") || "none", "| dead #anchors:", m.hash.join(",") || "none"); m.ld.forEach((j, i) => { try { const o = JSON.parse(j); console.log("  ld+json", i, "valid;", o["@type"] || o["@graph"]?.map(x => x["@type"]), Object.keys(o).join(",")); } catch (e) { console.log("  ld+json INVALID", e.message); } }); console.log("  console:", m.errs.length ? m.errs.join(" | ") : "clean", "| failed reqs:", m.failed.join(" | ") || "none"); }
console.log(`\nChecked ${seen.size} URLs. Non-200:`, bad.length ? "\n" + bad.join("\n") : "none");
const mf = await (await req.get(origin + "/manifest.webmanifest")).json(); console.log("manifest:", JSON.stringify({ name: mf.name, short: mf.short_name, start: mf.start_url, icons: mf.icons?.map(i => i.src + " " + i.sizes + " " + (i.purpose || "")), theme: mf.theme_color, bg: mf.background_color, display: mf.display }));
for (const ic of mf.icons || []) { const r = await req.get(origin + ic.src); console.log("  manifest icon", ic.src, r.status(), r.headers()["content-type"]); }
const sm = await (await req.get(origin + "/sitemap.xml")).text(); console.log("sitemap locs:", [...sm.matchAll(/<loc>([^<]+)/g)].map(x => x[1]).join(" , "));
console.log("robots.txt:", JSON.stringify(await (await req.get(origin + "/robots.txt")).text()));
const og = await req.get(origin + "/og-image.jpg"); console.log("og-image bytes:", (await og.body()).length);
await b.close();
