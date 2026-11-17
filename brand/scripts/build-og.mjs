// Open Graph card: public/og-image.jpg (1200x630).
// The client's official artwork (public/brand/crest-full.png: crest plus the
// official "LIQUID LEGACY DISTRIBUTION" lettering) centred on the slate
// texture, with one quiet descriptor line in letterspaced Libre Franklin caps.
// The descriptor is outlined with opentype.js, so no system fonts are involved.
//
// `pnpm logos` runs this last. Standalone:  node brand/scripts/build-og.mjs
import opentype from "opentype.js";
import sharp from "sharp";

const ROOT = process.cwd();
const W = 1200;
const H = 630;
const STONE = "#A8A093";
const BRONZE = "#755D45";
const TAGLINE = "WINE & SPIRITS DISTRIBUTION · EST. 2026";

const franklin = opentype.loadSync(`${ROOT}/brand/fonts/libre-franklin/LibreFranklin-Medium.ttf`);

/** Outline a line of text with tracking (em). Returns { d, width }. */
function outline(font, text, size, tracking, x, y) {
  const glyphs = font.stringToGlyphs(text, { features: { liga: false } });
  const s = size / font.unitsPerEm;
  let cx = x;
  let d = "";
  glyphs.forEach((g, i) => {
    d += g.getPath(cx, y, size).toPathData(2);
    cx += g.advanceWidth * s;
    if (i < glyphs.length - 1) cx += font.getKerningValue(g, glyphs[i + 1]) * s + tracking * size;
  });
  return { d, width: cx - x };
}

// slate, slightly calmed, with a soft vignette (no glow, no colour)
const bg = await sharp(`${ROOT}/public/media/texture-slate.jpg`).resize(W, H, { fit: "cover" }).modulate({ brightness: 0.86 }).toBuffer();
const vignette = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="v" cx="0.5" cy="0.47" r="0.72">
      <stop offset="0.55" stop-color="#12110F" stop-opacity="0"/>
      <stop offset="1" stop-color="#12110F" stop-opacity="0.62"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#v)"/>
  </svg>`,
);

// official crest + lettering, trimmed to its artwork and centred
const crestH = 500;
const crest = await sharp(`${ROOT}/public/brand/crest-full.png`).trim({ threshold: 1 }).resize({ height: crestH }).png().toBuffer();
const cm = await sharp(crest).metadata();
const crestTop = 58; // the artwork carries ~50px of soft shadow below the lettering

// descriptor line under the artwork, flanked by two short bronze hairlines
const size = 13;
const tracking = 0.32;
const probe = outline(franklin, TAGLINE, size, tracking, 0, 0);
const baseline = crestTop + crestH + 6;
const tx = (W - probe.width) / 2;
const tag = outline(franklin, TAGLINE, size, tracking, tx, baseline);
const ruleY = Math.round(baseline - size * 0.36);
const overlay = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="${Math.round(tx - 22 - 48)}" y="${ruleY}" width="48" height="1" fill="${BRONZE}"/>
    <rect x="${Math.round(tx + probe.width + 22)}" y="${ruleY}" width="48" height="1" fill="${BRONZE}"/>
    <path fill="${STONE}" d="${tag.d}"/>
  </svg>`,
);

await sharp(bg)
  .composite([
    { input: vignette },
    { input: crest, left: Math.round((W - cm.width) / 2), top: crestTop },
    { input: overlay },
  ])
  .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(`${ROOT}/public/og-image.jpg`);

console.log("og-image.jpg built");
