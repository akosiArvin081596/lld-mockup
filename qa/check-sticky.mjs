import { chromium } from "playwright";
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
await c.addInitScript(() => { try { localStorage.setItem("lld-age-confirmed", JSON.stringify({ confirmedAt: Date.now() })); } catch {} });
const p = await c.newPage();
await p.goto("http://localhost:3410/", { waitUntil: "networkidle" });
const steps = await p.evaluate(() => [...document.querySelectorAll("[data-snap-stop]")].map(e => Math.round(e.getBoundingClientRect().top + scrollY - 72)));
for (const [i, y] of steps.entries()) {
  await p.evaluate((y) => window.scrollTo(0, y), y);
  await p.waitForTimeout(1300);
  const r = await p.evaluate(() => {
    const img = [...document.querySelectorAll("#process img")].find(im => getComputedStyle(im).opacity > 0.9 && im.getBoundingClientRect().width > 300);
    const stage = img?.closest("[class*='sticky']") || document.querySelector("#process [class*='sticky']");
    return { stageTop: stage ? Math.round(stage.getBoundingClientRect().top) : null, photo: img?.getAttribute("src")?.split("/").pop()?.split("?")[0] ?? img?.currentSrc?.split("url=")[1]?.split("&")[0] };
  });
  console.log(`step ${i + 1}: sticky stage top=${r.stageTop}px  photo=${decodeURIComponent(r.photo || "?")}`);
}
await b.close();
