// Renders the brand book to deliverables/LLD-Brand-Book.pdf and one PNG per
// page in deliverables/brand-book-pages/ (1920 wide).
//
// Run from the project root:  pnpm brand-book
//
// A tiny static server runs inside this process (random free port, closed at
// the end) so fonts and images load over http; nothing is fetched from the
// network and no separate process is left behind.
import { createServer } from "node:http";
import { readFile, mkdir, rm } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const OUT_PDF = `${ROOT}/deliverables/LLD-Brand-Book.pdf`;
const OUT_PAGES = `${ROOT}/deliverables/brand-book-pages`;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ttf": "font/ttf",
};
// Only these folders are served.
const ALLOWED = ["/brand-book/", "/brand/fonts/", "/brand/logos/", "/public/brand/", "/public/media/"];

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!ALLOWED.some((p) => path.startsWith(p))) {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("response", (r) => {
    // the website screenshots are optional slots
    if (r.status() >= 400 && !r.url().includes("/brand-book/assets/")) problems.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(`${base}/brand-book/index.html`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
  });
  await page.waitForFunction(() => window.__clearspaceReady === true, null, { timeout: 5000 });
  await page.waitForTimeout(300);

  // overflow check: anything poking out of its page
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll(".page")].flatMap((p, i) =>
      [...p.querySelectorAll(".frame > *")]
        .filter((el) => el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow === "visible" && el.clientHeight > 0 && el.tagName !== "TABLE")
        .map((el) => `page ${i + 1}: <${el.tagName.toLowerCase()} class="${el.className}"> content ${el.scrollHeight}px in ${el.clientHeight}px`),
    ),
  );

  await mkdir(`${ROOT}/deliverables`, { recursive: true });
  await page.pdf({ path: OUT_PDF, width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true });

  await rm(OUT_PAGES, { recursive: true, force: true });
  await mkdir(OUT_PAGES, { recursive: true });
  const pages = await page.$$(".page");
  for (const [i, el] of pages.entries()) {
    await el.screenshot({ path: `${OUT_PAGES}/page-${String(i + 1).padStart(2, "0")}.png` });
  }

  console.log(`brand book: ${pages.length} pages`);
  console.log(`  ${OUT_PDF}`);
  console.log(`  ${OUT_PAGES}/`);
  if (overflow.length) console.log("overflow:\n  " + overflow.join("\n  "));
  if (problems.length) console.log("problems:\n  " + problems.join("\n  "));
} finally {
  await browser.close();
  server.close();
}
