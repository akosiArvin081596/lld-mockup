// Turns the selected Higgsfield sources in media-src/ into web-ready files in public/.
// Run from the project root: node brand/scripts/process-media.mjs
// Source prompts and job ids are logged in brand/media-prompts.md.
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const SRC = "media-src";
const OUT = "public/media";
const BRAND = "public/brand";
await mkdir(OUT, { recursive: true });
await mkdir(BRAND, { recursive: true });

const jpeg = { quality: 80, progressive: true, mozjpeg: true };

/** [source, output, width] : the chosen take for each slot. */
const photos = [
  ["hero-a.png", "hero-poster.jpg", 1920],
  ["select-b.png", "process-select.jpg", 1600],
  ["store-a.png", "process-store.jpg", 1600],
  ["sell-b.png", "process-sell.jpg", 1600],
  ["deliver-d.png", "process-deliver.jpg", 1600],
  ["barrel-a.png", "legacy-barrel.jpg", 1200],
  ["cellar-a.png", "partners-cellar.jpg", 1200],
  ["shop-e.png", "partners-shop.jpg", 1200],
];

for (const [src, out, width] of photos) {
  await sharp(`${SRC}/${src}`)
    .resize({ width, withoutEnlargement: true })
    .sharpen({ sigma: 0.5 })
    .jpeg(jpeg)
    .toFile(`${OUT}/${out}`);
  console.log("photo", out);
}

// Slate texture: warm the slight blue cast toward the obsidian palette.
await sharp(`${SRC}/slate-a.png`)
  .resize({ width: 1920 })
  .modulate({ saturation: 0.35, brightness: 0.82 })
  .tint({ r: 46, g: 41, b: 34 })
  .jpeg(jpeg)
  .toFile(`${OUT}/texture-slate.jpg`);
console.log("photo texture-slate.jpg");

// Crest: background removed from the supplied artwork (unaltered otherwise).
// Full lockup (crest + wordmark) and crest-only crop. For dark backgrounds only.
await sharp(`${SRC}/crest-nobg.png`).png({ compressionLevel: 9, effort: 10 }).toFile(`${BRAND}/crest-full.png`);
await sharp(`${SRC}/crest-nobg.png`)
  .extract({ left: 200, top: 120, width: 1040, height: 1050 })
  .extend({ top: 48, bottom: 48, left: 48, right: 48, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(`${BRAND}/crest-mark.png`);
console.log("brand crest-full.png, crest-mark.png");
