// Liquid Legacy Distribution: flat vector logo system.
//
// Builds every mark from outlined type (opentype.js) and hand-placed geometry
// (laurel, crown, shield, rings). No live text, no strokes, no masks: each SVG
// is a single filled path with a tight viewBox and the color baked in.
//
// Run from the project root:  pnpm logos
//
// Writes:
//   brand/logos/<mark>.svg                    masters (gold)
//   public/brand/<mark>-<color>.svg           web copies
//   deliverables/logo-suite/svg|png|crest     client exports
//   public/favicon.ico, icon.svg, apple-touch-icon.png, icon-*.png
//   deliverables/logo-suite/contact-sheet.png review sheet
//   public/og-image.jpg                       via build-og.mjs
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import opentype from "opentype.js";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const ROOT = process.cwd();
const FONTS = `${ROOT}/brand/fonts`;
const OUT_MASTER = `${ROOT}/brand/logos`;
const OUT_WEB = `${ROOT}/public/brand`;
const OUT_DELIV = `${ROOT}/deliverables/logo-suite`;
const ONLY = process.argv.includes("--fast"); // skip PNG exports while iterating
const VERBOSE = process.argv.includes("--verbose");

const COLORS = {
  gold: "#BF9F66",
  parchment: "#EFE8DA",
  ink: "#1A1815",
  "gold-deep": "#7A5C30",
};
const OBSIDIAN = "#12110F";
const PARCHMENT = "#EFE8DA";

const font = {
  dec: opentype.loadSync(`${FONTS}/cinzel-decorative/CinzelDecorative-Bold.ttf`),
  decBlack: opentype.loadSync(`${FONTS}/cinzel-decorative/CinzelDecorative-Black.ttf`),
  bold: opentype.loadSync(`${FONTS}/cinzel/Cinzel-Bold.ttf`),
  black: opentype.loadSync(`${FONTS}/cinzel/Cinzel-Black.ttf`),
  regular: opentype.loadSync(`${FONTS}/cinzel/Cinzel-Regular.ttf`),
};

/* ------------------------------------------------------------------------ */
/* Geometry core                                                             */
/* A shape is an array of closed contours. A contour is { s: {x,y}, segs }   */
/* where each seg is { t: "L", p } or { t: "C", c1, c2, p }.                 */
/* ------------------------------------------------------------------------ */

const pt = (x, y) => ({ x, y });
const add = (a, b) => pt(a.x + b.x, a.y + b.y);
const sub = (a, b) => pt(a.x - b.x, a.y - b.y);
const mul = (a, k) => pt(a.x * k, a.y * k);
const lerp = (a, b, t) => pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
const len = (a) => Math.hypot(a.x, a.y);
const norm = (a) => mul(a, 1 / (len(a) || 1));
const perp = (a) => pt(-a.y, a.x);
const rot = (a, ang) => pt(a.x * Math.cos(ang) - a.y * Math.sin(ang), a.x * Math.sin(ang) + a.y * Math.cos(ang));
const DEG = Math.PI / 180;
const METRICS = { x: null }; // filled in by the builders that define a clear-space unit

/** opentype.js commands -> shape (quadratics promoted to cubics). */
function fromOT(cmds) {
  const shape = [];
  let cur = null;
  let last = null;
  for (const c of cmds) {
    if (c.type === "M") {
      cur = { s: pt(c.x, c.y), segs: [] };
      shape.push(cur);
      last = cur.s;
    } else if (c.type === "L") {
      cur.segs.push({ t: "L", p: pt(c.x, c.y) });
      last = pt(c.x, c.y);
    } else if (c.type === "Q") {
      const q = pt(c.x1, c.y1);
      const p = pt(c.x, c.y);
      cur.segs.push({ t: "C", c1: lerp(last, q, 2 / 3), c2: lerp(p, q, 2 / 3), p });
      last = p;
    } else if (c.type === "C") {
      const p = pt(c.x, c.y);
      cur.segs.push({ t: "C", c1: pt(c.x1, c.y1), c2: pt(c.x2, c.y2), p });
      last = p;
    }
  }
  // drop closing segments that return exactly to the start
  for (const k of shape) {
    const l = k.segs[k.segs.length - 1];
    if (l && l.t === "L" && Math.hypot(l.p.x - k.s.x, l.p.y - k.s.y) < 1e-9) k.segs.pop();
  }
  return shape.filter((k) => k.segs.length);
}

function mapShape(shape, f) {
  return shape.map((k) => ({
    s: f(k.s),
    segs: k.segs.map((g) => (g.t === "L" ? { t: "L", p: f(g.p) } : { t: "C", c1: f(g.c1), c2: f(g.c2), p: f(g.p) })),
  }));
}
const translate = (shape, dx, dy) => mapShape(shape, (p) => pt(p.x + dx, p.y + dy));
const scale = (shape, k, ky = k) => mapShape(shape, (p) => pt(p.x * k, p.y * ky));
const rotate = (shape, ang, c = pt(0, 0)) => mapShape(shape, (p) => add(c, rot(sub(p, c), ang)));
const mirrorX = (shape) => reverseShape(mapShape(shape, (p) => pt(-p.x, p.y)));

function segPoint(a, g, t) {
  if (g.t === "L") return lerp(a, g.p, t);
  const u = 1 - t;
  return pt(
    u * u * u * a.x + 3 * u * u * t * g.c1.x + 3 * u * t * t * g.c2.x + t * t * t * g.p.x,
    u * u * u * a.y + 3 * u * u * t * g.c1.y + 3 * u * t * t * g.c2.y + t * t * t * g.p.y,
  );
}
function splitSeg(a, g, t) {
  if (g.t === "L") {
    const m = lerp(a, g.p, t);
    return [{ t: "L", p: m }, { t: "L", p: g.p }];
  }
  const p01 = lerp(a, g.c1, t), p12 = lerp(g.c1, g.c2, t), p23 = lerp(g.c2, g.p, t);
  const p012 = lerp(p01, p12, t), p123 = lerp(p12, p23, t);
  const m = lerp(p012, p123, t);
  return [
    { t: "C", c1: p01, c2: p012, p: m },
    { t: "C", c1: p123, c2: p23, p: g.p },
  ];
}
/** Sub-segment of g (starting at a) between t0 and t1. */
function subSeg(a, g, t0, t1) {
  let start = a;
  let seg = g;
  if (t0 > 0) {
    const [, right] = splitSeg(a, g, t0);
    start = segPoint(a, g, t0);
    seg = right;
  }
  const tt = t0 >= 1 ? 1 : (t1 - t0) / (1 - t0);
  if (tt < 1) seg = splitSeg(start, seg, tt)[0];
  return { a: start, g: seg };
}

function flatten(k, n = 24) {
  const pts = [k.s];
  let a = k.s;
  for (const g of k.segs) {
    if (g.t === "L") pts.push(g.p);
    else for (let i = 1; i <= n; i++) pts.push(segPoint(a, g, i / n));
    a = g.p;
  }
  return pts;
}
function signedArea(k) {
  const p = flatten(k);
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    s += p[i].x * q.y - q.x * p[i].y;
  }
  return s / 2;
}
function reverseContour(k) {
  const pts = [k.s, ...k.segs.map((g) => g.p)];
  const segs = [];
  for (let i = k.segs.length - 1; i >= 0; i--) {
    const g = k.segs[i];
    const to = pts[i];
    segs.push(g.t === "L" ? { t: "L", p: to } : { t: "C", c1: g.c2, c2: g.c1, p: to });
  }
  return { s: pts[pts.length - 1], segs };
}
const reverseShape = (shape) => shape.map(reverseContour);

// Outer contours of the fonts wind this way; everything we draw matches it so
// that overlapping parts union under the nonzero rule inside a single <path>.
const OUTER_SIGN = Math.sign(signedArea(fromOT(font.bold.charToGlyph("I").getPath(0, 0, 100).commands)[0]));
const asOuter = (k) => (Math.sign(signedArea(k)) === OUTER_SIGN ? k : reverseContour(k));
const asHole = (k) => (Math.sign(signedArea(k)) === OUTER_SIGN ? reverseContour(k) : k);

/** Exact bounding box (cubic extrema). */
function bbox(shape) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (p) => {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  };
  for (const k of shape) {
    let a = k.s;
    take(a);
    for (const g of k.segs) {
      take(g.p);
      if (g.t === "C") {
        for (const axis of ["x", "y"]) {
          const p0 = a[axis], p1 = g.c1[axis], p2 = g.c2[axis], p3 = g.p[axis];
          const A = -p0 + 3 * p1 - 3 * p2 + p3, B = 2 * (p0 - 2 * p1 + p2), C = p1 - p0;
          const roots = [];
          if (Math.abs(A) < 1e-12) { if (Math.abs(B) > 1e-12) roots.push(-C / B); }
          else {
            const d = B * B - 4 * A * C;
            if (d >= 0) { const s = Math.sqrt(d); roots.push((-B + s) / (2 * A), (-B - s) / (2 * A)); }
          }
          for (const t of roots) if (t > 0 && t < 1) take(segPoint(a, g, t));
        }
      }
      a = g.p;
    }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

/** Rounded, compact path data. */
function toD(shape, prec = 2) {
  const f = (v) => {
    let s = (Math.round(v * 10 ** prec) / 10 ** prec).toFixed(prec);
    s = s.replace(/\.?0+$/, "");
    if (s === "-0") s = "0";
    return s;
  };
  const P = (p) => `${f(p.x)} ${f(p.y)}`;
  return shape
    .map((k) => {
      let d = `M${P(k.s)}`;
      for (const g of k.segs) d += g.t === "L" ? `L${P(g.p)}` : `C${P(g.c1)} ${P(g.c2)} ${P(g.p)}`;
      return d + "Z";
    })
    .join("");
}

/* ---------------------------- primitives -------------------------------- */

const KAPPA = 0.5522847498;
function ellipse(cx, cy, rx, ry = rx) {
  const k = { s: pt(cx + rx, cy), segs: [] };
  const q = [
    [pt(cx + rx, cy + ry * KAPPA), pt(cx + rx * KAPPA, cy + ry), pt(cx, cy + ry)],
    [pt(cx - rx * KAPPA, cy + ry), pt(cx - rx, cy + ry * KAPPA), pt(cx - rx, cy)],
    [pt(cx - rx, cy - ry * KAPPA), pt(cx - rx * KAPPA, cy - ry), pt(cx, cy - ry)],
    [pt(cx + rx * KAPPA, cy - ry), pt(cx + rx, cy - ry * KAPPA), pt(cx + rx, cy)],
  ];
  for (const [c1, c2, p] of q) k.segs.push({ t: "C", c1, c2, p });
  return k;
}
const disc = (cx, cy, r) => [asOuter(ellipse(cx, cy, r))];
const ring = (cx, cy, r0, r1) => [asOuter(ellipse(cx, cy, r1)), asHole(ellipse(cx, cy, r0))];
function poly(points) {
  return { s: points[0], segs: points.slice(1).map((p) => ({ t: "L", p })) };
}
const rect = (x, y, w, h) => [asOuter(poly([pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h)]))];

/** Closed Catmull-Rom spline through points -> smooth cubic contour. */
function smoothClosed(points, tension = 1) {
  const n = points.length;
  const k = { s: points[0], segs: [] };
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    k.segs.push({
      t: "C",
      c1: add(p1, mul(sub(p2, p0), tension / 6)),
      c2: sub(p2, mul(sub(p3, p1), tension / 6)),
      p: p2,
    });
  }
  return k;
}
/** Open Catmull-Rom spline as segments from points[0]. */
function smoothOpen(points, tension = 1) {
  const segs = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(n - 1, i + 2)];
    segs.push({ t: "C", c1: add(p1, mul(sub(p2, p0), tension / 6)), c2: sub(p2, mul(sub(p3, p1), tension / 6)), p: p2 });
  }
  return segs;
}

/* ------------------------------ clipping -------------------------------- */
/**
 * Keep the part of `shape` where f(p) <= 0. `trace(a, b)` returns the points
 * strictly between a and b along the boundary f = 0 (straight for planes).
 * Contours here cross a boundary at most twice, which is all the marks need.
 */
function clip(shape, f, trace = () => []) {
  const out = [];
  for (const k of shape) {
    // split every segment at its roots
    const pieces = [];
    let a = k.s;
    for (const g of k.segs) {
      const N = 48;
      const ts = [];
      let prevT = 0, prevV = f(a);
      for (let i = 1; i <= N; i++) {
        const t = i / N;
        const v = f(segPoint(a, g, t));
        if ((prevV <= 0) !== (v <= 0)) {
          let lo = prevT, hi = t, vlo = prevV;
          for (let j = 0; j < 40; j++) {
            const mid = (lo + hi) / 2;
            const vm = f(segPoint(a, g, mid));
            if ((vm <= 0) === (vlo <= 0)) { lo = mid; vlo = vm; } else hi = mid;
          }
          ts.push((lo + hi) / 2);
        }
        prevT = t; prevV = v;
      }
      const bounds = [0, ...ts, 1];
      for (let i = 0; i < bounds.length - 1; i++) {
        const s = subSeg(a, g, bounds[i], bounds[i + 1]);
        const mid = segPoint(s.a, s.g, 0.5);
        pieces.push({ a: s.a, g: s.g, inside: f(mid) <= 0 });
      }
      a = g.p;
    }
    if (pieces.every((p) => p.inside)) { out.push(k); continue; }
    if (pieces.every((p) => !p.inside)) continue;
    // rotate so we begin at an entry
    let start = pieces.findIndex((p, i) => p.inside && !pieces[(i - 1 + pieces.length) % pieces.length].inside);
    const ordered = [...pieces.slice(start), ...pieces.slice(0, start)];
    const c = { s: ordered[0].a, segs: [] };
    let last = null;
    for (let i = 0; i < ordered.length; i++) {
      const p = ordered[i];
      if (!p.inside) continue;
      if (last && Math.hypot(last.x - p.a.x, last.y - p.a.y) > 1e-6) {
        for (const q of trace(last, p.a)) c.segs.push({ t: "L", p: q });
        c.segs.push({ t: "L", p: p.a });
      }
      c.segs.push(p.g);
      last = p.g.p;
    }
    if (Math.hypot(last.x - c.s.x, last.y - c.s.y) > 1e-6) {
      for (const q of trace(last, c.s)) c.segs.push({ t: "L", p: q });
    }
    out.push(c);
  }
  return out;
}
/** Keep the side of the line through p0->p1 that lies to its left (screen coords: n = perp). */
function clipLine(shape, p0, p1, keepSide = 1) {
  const n = perp(norm(sub(p1, p0)));
  return clip(shape, (p) => -keepSide * ((p.x - p0.x) * n.x + (p.y - p0.y) * n.y));
}
const clipX = (shape, x, keep /* "lt" | "gt" */) => clip(shape, (p) => (keep === "lt" ? p.x - x : x - p.x));
const clipY = (shape, y, keep) => clip(shape, (p) => (keep === "lt" ? p.y - y : y - p.y));
/** Remove the vertical band x0..x1 from a shape (pieces overlap nothing). */
const cutBandX = (shape, x0, x1) => [...clipX(shape, x0, "lt"), ...clipX(shape, x1, "gt")];

/* ------------------------------ type ------------------------------------ */

/** Set text as outlines. tracking in em. Returns { shape, width }. */
function setText(f, text, size, { tracking = 0, kern = true, x = 0, y = 0 } = {}) {
  const glyphs = f.stringToGlyphs(text, { features: { liga: false, rlig: false } });
  const s = size / f.unitsPerEm;
  let cx = x;
  const shape = [];
  glyphs.forEach((g, i) => {
    shape.push(...fromOT(g.getPath(cx, y, size).commands));
    cx += g.advanceWidth * s;
    if (i < glyphs.length - 1) {
      if (kern) cx += f.getKerningValue(g, glyphs[i + 1]) * s;
      cx += tracking * size;
    }
  });
  return { shape, width: cx - x };
}
const glyphShape = (f, ch, size, x = 0, y = 0) => fromOT(f.charToGlyph(ch).getPath(x, y, size).commands);

/** Place glyphs along a circle. side "top" reads clockwise over the top, "bottom" reads left to right under it. */
function textOnCircle(f, text, size, { cx = 0, cy = 0, r, rSpacing = r, side = "top", tracking = 0, fitArc = null, center = side === "top" ? 0 : 180 }) {
  const glyphs = f.stringToGlyphs(text, { features: { liga: false } });
  const s = size / f.unitsPerEm;
  if (fitArc !== null) {
    // solve the tracking that makes the run span fitArc degrees at rSpacing
    const natural = glyphs.reduce((w, g, i) => w + g.advanceWidth * s + (i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) * s : 0), 0);
    tracking = ((fitArc * DEG * rSpacing) - natural) / (glyphs.length - 1) / size;
  }
  const adv = glyphs.map((g, i) => g.advanceWidth * s + (i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) * s + tracking * size : 0));
  const total = adv.reduce((a, b) => a + b, 0) - (glyphs.length ? 0 : 0);
  const shape = [];
  let run = 0;
  glyphs.forEach((g, i) => {
    const w = g.advanceWidth * s;
    const mid = run + w / 2 - total / 2;
    run += adv[i];
    if (!g.path || !g.path.commands || g.path.commands.length === 0) return; // space
    const ang = (side === "top" ? center + (mid / rSpacing) / DEG : center - (mid / rSpacing) / DEG) * DEG;
    let local = fromOT(g.getPath(-w / 2, 0, size).commands);
    const rr = r;
    const P = pt(cx + rr * Math.sin(ang), cy - rr * Math.cos(ang));
    local = rotate(local, side === "top" ? ang : ang - Math.PI);
    shape.push(...translate(local, P.x, P.y));
  });
  return { shape, arc: (total / rSpacing) / DEG, tracking };
}

/* ------------------------------------------------------------------------ */
/* Marks                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * LLD monogram letters, interlocked. Cap height 100, origin at the baseline
 * of the optical centre. Echoes the crest: a swash L whose foot sweeps under
 * everything, a taller second L, and a D whose stem the second L's foot
 * passes behind before it surfaces inside the D's counter.
 */
function lettersLLD({ weight = "bold" } = {}) {
  const H = 100; // cap height
  const sz = H / 0.7; // Cinzel cap height is 700/1000
  const dec = weight === "black" ? font.decBlack : font.dec;
  const roman = weight === "black" ? font.black : font.bold;
  const gap = 4.2; // knockout gap, in cap-height units

  // L1: decorative swash L
  let L1 = glyphShape(dec, "L", sz, 0, 0);
  // L2: roman L, taller, rising above the line like the crest
  const tall = 1.1;
  const L2x = 41.5;
  let L2 = glyphShape(roman, "L", sz * tall, L2x, 0);
  // D: roman D
  const Dx = 110.5;
  let D = glyphShape(roman, "D", sz, Dx, 0);
  const dStem0 = Dx + (42 / 1000) * sz; // D left edge (serif)
  // D stem (without serif) ~ 42..200 units; the serif overhangs a little
  const stemL = Dx + (60 / 1000) * sz, stemR = Dx + (205 / 1000) * sz;

  // L2's foot passes behind D's stem: cut L2 in a band around the stem
  void stemR;
  L2 = clipX(L2, Dx + (42 / 1000) * sz - gap, "lt");

  // L1's swash foot passes in front of L2 and D: clear both above the foot.
  const footTop = (x) => topEdgeAt(L1, x);
  const below = (shape) =>
    clip(
      shape,
      (p) => {
        const y = footTop(p.x);
        return y === null ? -1 : p.y - (y - gap);
      },
      (a, b) => {
        const n = 10, pts = [];
        for (let i = 1; i < n; i++) {
          const x = a.x + ((b.x - a.x) * i) / n;
          const y = footTop(x);
          if (y !== null) pts.push(pt(x, y - gap));
        }
        return pts;
      },
    );
  // The swash runs in front of L2: its top edge is a straight diagonal in
  // the font (311,-16 to 854,-139 units), so L2 is trimmed parallel to it
  // at a true perpendicular gap.
  {
    const k = sz / 1000;
    const a = pt(311 * k, 16 * k), b = pt(854 * k, 139 * k);
    const dir = norm(sub(b, a));
    let up = perp(dir);
    if (up.y > 0) up = mul(up, -1);
    const a2 = add(a, mul(up, gap * 1.5));
    L2 = clip(L2, (p) => -((p.x - a2.x) * up.x + (p.y - a2.y) * up.y));
  }
  void below;
  void dStem0;
  let shape = [...L1, ...L2, ...D];
  const b = bbox(shape);
  return translate(shape, -b.cx, 0);
}

/** Topmost y of the part of `shape` that lies below the baseline at x (the swash foot), or null. */
function topEdgeAt(shape, x) {
  let best = null;
  for (const k of shape) {
    const pts = flatten(k, 40);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) {
        const y = a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
        if (x > 34 && y > -2 && (best === null || y < best)) best = y;
      }
    }
  }
  return best;
}

/** Five-point crown. Width 100, base at y = 0, extends upward. */
function crown({ jewels = true } = {}) {
  const W = 100;
  const bandH = 15;
  const gap = 4;
  const shape = [];
  // band, gently arched like the crest's circlet
  const band = {
    s: pt(-W / 2, 0),
    segs: [
      { t: "C", c1: pt(-W / 4, 2.6), c2: pt(W / 4, 2.6), p: pt(W / 2, 0) },
      { t: "L", p: pt(W / 2, -bandH) },
      { t: "C", c1: pt(W / 4, -bandH + 2.6), c2: pt(-W / 4, -bandH + 2.6), p: pt(-W / 2, -bandH) },
    ],
  };
  shape.push(asOuter(band));
  if (jewels) {
    for (const x of [-30, 0, 30]) {
      const yy = -bandH / 2 + 1.6;
      const r = x === 0 ? 3.2 : 2.6;
      shape.push(asHole(poly([pt(x, yy - r * 1.25), pt(x + r, yy), pt(x, yy + r * 1.25), pt(x - r, yy)])));
    }
  }
  // body: five points with concave valleys
  const y0 = -bandH - gap; // body bottom (follows the arch)
  const tips = [
    pt(-W / 2 - 4, -58),
    pt(-W / 4, -50),
    pt(0, -66),
    pt(W / 4, -50),
    pt(W / 2 + 4, -58),
  ];
  const valleyY = -33;
  const body = { s: pt(-W / 2, y0), segs: [] };
  body.segs.push({ t: "L", p: tips[0] });
  for (let i = 0; i < 4; i++) {
    const a = tips[i], b = tips[i + 1];
    const vx = (a.x + b.x) / 2;
    const v = pt(vx, valleyY);
    // concave sweep: leave tip steeply, settle into a rounded valley
    body.segs.push({ t: "C", c1: pt(a.x + (vx - a.x) * 0.25, a.y + (valleyY - a.y) * 0.75), c2: pt(vx - (vx - a.x) * 0.45, valleyY), p: v });
    body.segs.push({ t: "C", c1: pt(vx + (b.x - vx) * 0.45, valleyY), c2: pt(b.x - (b.x - vx) * 0.25, b.y + (valleyY - b.y) * 0.75), p: b });
  }
  body.segs.push({ t: "L", p: pt(W / 2, y0) });
  body.segs.push({ t: "C", c1: pt(W / 4, y0 + 2.6), c2: pt(-W / 4, y0 + 2.6), p: pt(-W / 2, y0) });
  shape.push(asOuter(body));
  // pearls on the tips; the centre carries a cross pattée
  tips.forEach((t, i) => {
    if (i === 2) return;
    const r = 4.6;
    shape.push(...disc(t.x, t.y - r * 0.55, r));
  });
  {
    const c = tips[2];
    const r = 5.2;
    shape.push(...disc(c.x, c.y - r * 0.5, r));
    // small cross above the centre pearl
    const cy = c.y - r * 2 - 6.5;
    const arm = 6.2, th = 3.4;
    shape.push(...rect(-th / 2, cy - arm, th, arm * 2 + 2.4));
    shape.push(...rect(-arm, cy - th / 2 - 1, arm * 2, th));
  }
  return shape;
}

/** One laurel leaf from base b toward direction dir. */
function leaf(b, dir, L, w, bend = 0.06) {
  // lanceolate: pointed base, widest just below the middle, long fine tip
  const u = norm(dir);
  const n = perp(u);
  const t = add(b, mul(u, L));
  const bow = mul(n, bend * L);
  const at = (along, across, extra = pt(0, 0)) => add(add(b, mul(u, L * along)), add(mul(n, across), extra));
  const k = {
    s: b,
    segs: [
      { t: "C", c1: at(0.16, w * 1.05, bow), c2: at(0.58, w * 1.12, bow), p: t },
      { t: "C", c1: at(0.58, -w * 0.98, bow), c2: at(0.16, -w * 0.92, bow), p: b },
    ],
  };
  return asOuter(k);
}

/**
 * Laurel wreath, two mirrored branches on a circle of radius R around (0,0).
 * a0..a1 are angles (deg, screen coords, 90 = bottom) for the left branch.
 */
function wreath({ R = 100, a0 = 106, a1 = 247, stemStart = 76, pairs = 11, leafL = 27, leafW = 0.22, stemW = 3.4, angOut = 30, angIn = 25 } = {}) {
  const branch = [];
  const P = (a) => pt(R * Math.cos(a * DEG), R * Math.sin(a * DEG));
  const tangent = (a) => pt(-Math.sin(a * DEG), Math.cos(a * DEG)); // direction of growth (increasing a)
  const outward = (a) => pt(Math.cos(a * DEG), Math.sin(a * DEG));
  // stem: tapered band along the arc, slightly beyond the first leaf
  const sa0 = stemStart, sa1 = a1 - 4;
  const N = 30;
  const outer = [], inner = [];
  for (let i = 0; i <= N; i++) {
    const a = sa0 + ((sa1 - sa0) * i) / N;
    const t = i / N;
    const w = (stemW * (1 - 0.72 * t) + 0.25) * Math.min(1, 0.22 + t * 9);
    const e = Math.max(0, (a0 - a) / (a0 - sa0)); // 1 at the stem end, 0 from the first leaf
    const c = add(P(a), mul(outward(a), 7 * e * e));
    outer.push(add(c, mul(outward(a), w / 2)));
    inner.push(sub(c, mul(outward(a), w / 2)));
  }
  const stem = { s: inner[0], segs: [{ t: "L", p: outer[0] }, ...smoothOpen(outer), { t: "L", p: inner[N] }, ...smoothOpen(inner.slice().reverse())] };
  branch.push(asOuter(stem));
  // leaves: alternating outer/inner, tapering toward the top
  const span = a1 - a0;
  for (let i = 0; i < pairs; i++) {
    const t = i / pairs;
    const size = 1 - 0.42 * t ** 1.15;
    const L = leafL * size;
    const W = L * leafW;
    for (const side of [1, -1]) {
      const a = a0 + span * (t + (side === -1 ? 0.5 / pairs : 0));
      const ang = (side === 1 ? angOut : angIn) * DEG;
      const dir = add(mul(tangent(a), Math.cos(ang)), mul(outward(a), side * Math.sin(ang)));
      const base = add(P(a), mul(outward(a), side * stemW * 0.2));
      branch.push(leaf(base, dir, side === 1 ? L : L * 0.92, W, 0.05 * side));
    }
  }
  // terminal leaf
  {
    const a = a1;
    const L = leafL * 0.62;
    branch.push(leaf(P(a - 2.5), add(tangent(a), mul(outward(a), 0.08)), L, L * leafW, 0.02));
  }
  return [...branch, ...mirrorX(branch)];
}

/** Heater shield outline as a contour, inset by d. Width W, height H, top at y=0. */
function shieldContour(W, H, d = 0) {
  const a = W / 2 - d;
  const shoulder = H * 0.36;
  const tipAngle = 62 * DEG; // half-angle of the point relative to vertical
  const tipY = H - d / Math.sin(tipAngle);
  const top = d;
  const notch = 0; // flat top
  const ky = (tipY - shoulder);
  const k = {
    s: pt(-a, top),
    segs: [
      { t: "L", p: pt(-notch, top) },
      { t: "L", p: pt(a, top) },
      { t: "L", p: pt(a, shoulder) },
      { t: "C", c1: pt(a, shoulder + ky * 0.56), c2: pt(a * 0.46, tipY - ky * 0.2), p: pt(0, tipY) },
      { t: "C", c1: pt(-a * 0.46, tipY - ky * 0.2), c2: pt(-a, shoulder + ky * 0.56), p: pt(-a, shoulder) },
    ],
  };
  return k;
}

/* ----------------------------- compositions ----------------------------- */

const fit = (shape, h) => {
  const b = bbox(shape);
  return translate(scale(translate(shape, -b.cx, -b.cy), h / b.h), 0, 0);
};
const placeAt = (shape, cx, top, h) => {
  const b = bbox(shape);
  const k = h / b.h;
  return translate(scale(translate(shape, -b.cx, -b.y), k), cx, top);
};

/** Crown over LLD: the compact mark for small sizes. Height 100. */
function crownLLD({ weight = "bold", crownW = 0.62, gapK = 0.1 } = {}) {
  const letters = lettersLLD({ weight });
  const lb = bbox(letters);
  const c = crown();
  const cb = bbox(c);
  const cW = lb.w * crownW;
  const cs = cW / cb.w;
  const crownShape = translate(scale(translate(c, -cb.cx, -cb.y1), cs), 0, lb.y - lb.h * gapK);
  return [...crownShape, ...letters];
}

function monogram() {
  const letters = lettersLLD({ weight: "bold" });
  const lb = bbox(letters);
  const R = 100;
  const L = translate(scale(translate(letters, -lb.cx, -lb.cy), 126 / lb.w), 0, 8);
  METRICS.x = 100 * (126 / lb.w);
  const c = crown();
  const cb = bbox(c);
  const crownShape = translate(scale(translate(c, -cb.cx, -cb.y1), 58 / cb.w), 0, -R + 22);
  const w = wreath({ R });
  return [...w, ...crownShape, ...L];
}

function wordmark({ rules = true } = {}) {
  const top = setText(font.dec, "LiQuid Legacy", 100, { tracking: 0.02 });
  const tb = bbox(top.shape);
  // DISTRIBUTION: spaced roman caps, ~0.26 of the top line's cap height
  const capTop = 70; // cap height at 100px
  const small = 25 / 0.7;
  let dist = setText(font.bold, "DISTRIBUTION", small, { tracking: 0.42, kern: false });
  const db = bbox(dist.shape);
  const lineGap = 34; // baseline of top line to cap top of DISTRIBUTION
  const dy = lineGap + (small * 0.7);
  const shape = [...top.shape];
  const dx = tb.cx - db.cx;
  shape.push(...translate(dist.shape, dx, dy));
  if (rules) {
    const ruleY = dy - small * 0.35;
    const t = 1.6;
    const pad = 16;
    const left0 = tb.x + 10, right1 = tb.x1 - 4;
    const dl = db.x + dx - pad, dr = db.x1 + dx + pad;
    shape.push(...rect(left0, ruleY - t / 2, dl - left0, t));
    shape.push(...rect(dr, ruleY - t / 2, right1 - dr, t));
  }
  void capTop;
  return shape;
}

function lockupHorizontal() {
  const mark = crownLLD({ weight: "black" });
  const H = 100;
  const m = placeAt(mark, 0, 0, H);
  const mb = bbox(m);
  METRICS.x = 100 * (H / bbox(mark).h); // cap height of the monogram L, before normalising
  // wordmark block: two lines, left aligned
  const capL = 33; // cap height of LIQUID LEGACY
  const top = setText(font.dec, "LiQuid Legacy", capL / 0.7, { tracking: 0.03 });
  // DISTRIBUTION: spaced roman caps, sized so that at 0.3em tracking it
  // spans the optical width of the line above (stem of L to arm of Y)
  const tb0 = bbox(top.shape);
  const target = tb0.w - 2;
  const unit = bbox(setText(font.bold, "DISTRIBUTION", 100, { tracking: 0.3, kern: false }).shape).w / 100;
  const smallSz = target / unit;
  const capS = smallSz * 0.7;
  const dist = setText(font.bold, "DISTRIBUTION", smallSz, { tracking: 0.3, kern: false });
  // vertical metrics: centre the two-line block on the mark
  const gapLines = 15.5; // baseline to small cap top
  const blockH = capL + gapLines + capS;
  const blockTop = mb.cy - blockH / 2 + 1.5;
  const baseline1 = blockTop + capL;
  const baseline2 = baseline1 + gapLines + capS;
  const hairX = mb.x1 + 20;
  const textX = hairX + 21;
  const shape = [...m];
  const topShape = translate(top.shape, textX - bbox(top.shape).x, baseline1);
  shape.push(...topShape);
  const dshape = translate(dist.shape, textX - bbox(dist.shape).x + 1, baseline2);
  shape.push(...dshape);
  shape.push(...rect(hairX - 0.9, mb.y + 4, 1.8, mb.h - 8));
  return shape;
}

function seal() {
  const shape = [];
  // outer pair: a firm ring and a fine one; inner pair mirrors it
  shape.push(...ring(0, 0, 98.2, 100));
  shape.push(...ring(0, 0, 95.4, 96.2));
  shape.push(...ring(0, 0, 70.6, 71.4));
  shape.push(...ring(0, 0, 67.6, 69.4));
  // lettering band between the pairs
  const band0 = 71.4, band1 = 95.4;
  const capH = 12.4;
  const size = capH / 0.7;
  const mid = (band0 + band1) / 2;
  const topText = textOnCircle(font.bold, "LIQUID LEGACY DISTRIBUTION", size, { r: mid - capH / 2, rSpacing: mid, side: "top", fitArc: 238 });
  shape.push(...topText.shape);
  const bottom = textOnCircle(font.bold, "EST. 2026", size, { r: mid + capH / 2, rSpacing: mid, side: "bottom", fitArc: 72 });
  shape.push(...bottom.shape);
  if (VERBOSE) console.log(`    seal tracking: top ${topText.tracking.toFixed(3)}em, bottom ${bottom.tracking.toFixed(3)}em`);
  // separators: small diamonds midway between the two runs
  const sepAng = (topText.arc / 2 + (180 - bottom.arc / 2)) / 2;
  for (const sgn of [1, -1]) {
    const a = sgn * sepAng * DEG;
    const c = pt(mid * Math.sin(a), -mid * Math.cos(a));
    const u = pt(Math.sin(a), -Math.cos(a));
    const v = perp(u);
    const d = 2.9;
    shape.push(asOuter(poly([add(c, mul(u, d * 1.35)), add(c, mul(v, d)), sub(c, mul(u, d * 1.35)), sub(c, mul(v, d))])));
  }
  // centre: crown over LLD
  const mark = crownLLD({ weight: "bold" });
  const mb = bbox(mark);
  shape.push(...translate(scale(translate(mark, -mb.cx, -mb.cy), 86 / mb.h), 0, -1.5));
  return shape;
}

function shield() {
  const W = 100, H = 118;
  const shape = [];
  // outer band and inner hairline border
  shape.push(asOuter(shieldContour(W, H, 0)), asHole(shieldContour(W, H, 5.2)));
  shape.push(asOuter(shieldContour(W, H, 8.4)), asHole(shieldContour(W, H, 10)));
  const letters = lettersLLD({ weight: "bold" });
  const lb = bbox(letters);
  const lw = 64;
  shape.push(...translate(scale(translate(letters, -lb.cx, -lb.cy), lw / lb.w), 0, H * 0.43));
  const c = crown();
  const cb = bbox(c);
  shape.push(...translate(scale(translate(c, -cb.cx, -cb.y1), 56 / cb.w), 0, -6));
  return shape;
}

/** Favicon glyph for 16px: crown over a bold L-D, simplified. */
function tinyGlyph() {
  const shape = [];
  const L = glyphShape(font.black, "L", 100 / 0.7);
  const lb = bbox(L);
  shape.push(...translate(L, -lb.cx, 0));
  const c = crown({ jewels: false });
  const cb = bbox(c);
  shape.push(...translate(scale(translate(c, -cb.cx, -cb.y1), 80 / cb.w), 0, -100 - 12));
  return shape;
}

/* ------------------------------------------------------------------------ */
/* Output                                                                    */
/* ------------------------------------------------------------------------ */

function svgFor(shape, color, { pad = 0, title } = {}) {
  const b = bbox(shape);
  // normalise to a 0-origin viewBox, rounded outward to 0.01
  const k = 1;
  const s = translate(shape, -b.x + pad, -b.y + pad);
  const w = Math.ceil((b.w + pad * 2) * 100) / 100;
  const h = Math.ceil((b.h + pad * 2) * 100) / 100;
  void k;
  const t = title ? `<title>${title}</title>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"${title ? ` aria-label="${title}"` : ""}>${t}<path fill="${color}" d="${toD(s)}"/></svg>\n`;
}

const MARKS = {
  "lockup-horizontal": { build: lockupHorizontal, title: "Liquid Legacy Distribution" },
  seal: { build: seal, title: "Liquid Legacy Distribution, Est. 2026" },
  monogram: { build: monogram, title: "Liquid Legacy Distribution monogram" },
  wordmark: { build: wordmark, title: "Liquid Legacy Distribution" },
  shield: { build: shield, title: "Liquid Legacy Distribution shield" },
};

async function main() {
  for (const d of [OUT_MASTER, OUT_WEB, `${OUT_DELIV}/svg`, `${OUT_DELIV}/png`, `${OUT_DELIV}/crest`]) await mkdir(d, { recursive: true });
  const built = {};
  const metrics = {};
  // header lockup and footer seal first: the site references them already
  for (const [name, m] of Object.entries(MARKS)) {
    // normalise everything to a 1000-unit height before writing
    METRICS.x = null;
    let shape = m.build();
    const b = bbox(shape);
    shape = scale(translate(shape, -b.x, -b.y), 1000 / b.h);
    // clear-space unit x (cap height of the monogram L) as a fraction of the mark's height
    metrics[name] = { aspect: +(b.w / b.h).toFixed(4), x: METRICS.x === null ? null : +(METRICS.x / b.h).toFixed(4) };
    built[name] = shape;
    await writeFile(`${OUT_MASTER}/${name}.svg`, svgFor(shape, COLORS.gold, { title: m.title }));
    for (const [cname, hex] of Object.entries(COLORS)) {
      const svg = svgFor(shape, hex, { title: m.title });
      await writeFile(`${OUT_WEB}/${name}-${cname}.svg`, svg);
      await writeFile(`${OUT_DELIV}/svg/${name}-${cname}.svg`, svg);
    }
    console.log(`  ${name}`);
  }

  if (!ONLY) {
    for (const [name, shape] of Object.entries(built)) {
      for (const cname of ["gold", "ink", "parchment"]) {
        const svg = svgFor(shape, COLORS[cname]);
        for (const w of [512, 1024, 2048]) {
          await renderPng(svg, w).then((buf) => writeFile(`${OUT_DELIV}/png/${name}-${cname}-${w}.png`, buf));
        }
      }
    }
    await copyFile(`${ROOT}/public/brand/crest-full.png`, `${OUT_DELIV}/crest/crest-full.png`);
    await copyFile(`${ROOT}/public/brand/crest-mark.png`, `${OUT_DELIV}/crest/crest-mark.png`);
  }

  await writeFile(`${OUT_MASTER}/metrics.json`, JSON.stringify(metrics, null, 2) + "\n");
  await headKit(built);
  await contactSheet(built);
}

/** Render an SVG to a transparent PNG exactly `width` px wide (density from the viewBox). */
async function renderPng(svg, width) {
  const vbW = Number(svg.match(/viewBox="0 0 ([\d.]+)/)[1]);
  return sharp(Buffer.from(svg), { density: (72 * width) / vbW, limitInputPixels: false }).resize({ width }).png({ compressionLevel: 9 }).toBuffer();
}

/* ------------------------------- head kit ------------------------------- */

function squareIcon(shape, size, { radius = 0.18, fill = 0.66, bg = OBSIDIAN, color = COLORS.gold, dy = 0 } = {}) {
  const b = bbox(shape);
  const k = (size * fill) / Math.max(b.w, b.h);
  const s = translate(scale(translate(shape, -b.cx, -b.cy), k), size / 2, size / 2 + dy * size);
  const r = radius * size;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${bg}"/><path fill="${color}" d="${toD(s)}"/></svg>`;
}
const rasterize = (svg, size) => sharp(Buffer.from(svg), { density: 72 * Math.max(1, 1024 / size) }).resize(size, size).png().toBuffer();

// The site's head kit uses the client's OFFICIAL artwork (crown, laurel and
// LLD cropped from the supplied crest, dark grounds only), set on obsidian.
// The hand-built vector suite above is the "logo iterations" deliverable.
const OFFICIAL_MONOGRAM = `${ROOT}/public/brand/official-monogram.png`;

/** Official monogram, trimmed. The laurel ends still stop on straight horizontal cuts in the supplied cut-out, so the bottom 15% is faded out. */
async function officialMark() {
  const trimmed = await sharp(OFFICIAL_MONOGRAM).trim({ threshold: 1 }).png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const fade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="f" x1="0" x2="0" y1="0" y2="1"><stop offset="0.84" stop-color="#fff" stop-opacity="1"/><stop offset="0.985" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#f)"/></svg>`,
  );
  const buf = await sharp(trimmed).composite([{ input: fade, blend: "dest-in" }]).png().toBuffer();
  return { buf, width, height };
}

/** Obsidian tile with the mark fitted inside `fill` of the side, centred. */
async function officialTile(mark, size, { fill, radius = 0, opaque = true }) {
  const box = Math.round(size * fill);
  const m = await sharp(mark.buf).resize({ width: box, height: box, fit: "inside", kernel: "lanczos3" }).sharpen({ sigma: size <= 48 ? 0.6 : 0.4 }).png().toBuffer();
  const mm = await sharp(m).metadata();
  const r = radius * size;
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${OBSIDIAN}"/></svg>`);
  let img = sharp(bg).composite([{ input: m, left: Math.round((size - mm.width) / 2), top: Math.round((size - mm.height) / 2) }]);
  if (opaque) img = sharp(await img.png().toBuffer()).flatten({ background: OBSIDIAN });
  return img.png({ compressionLevel: 9 }).toBuffer();
}

async function headKit(built) {
  // vector stand-ins, kept for the contact sheet and the iterations deliverable
  built["_compact"] = crownLLD({ weight: "black", crownW: 0.6 });
  built["_tiny"] = tinyGlyph();

  const mark = await officialMark();
  // favicon.ico: 32 and 48 rendered directly; at 16 the artwork turns to
  // mush, so the 16 slot is the 32 render reduced (crisper than a native 16).
  const ico32 = await officialTile(mark, 32, { fill: 0.94, radius: 0.12, opaque: false });
  const ico48 = await officialTile(mark, 48, { fill: 0.92, radius: 0.12, opaque: false });
  const ico16 = await sharp(ico32).resize(16, 16, { kernel: "lanczos3" }).png().toBuffer();
  await writeFile(`${ROOT}/public/favicon.ico`, await pngToIco([ico16, ico32, ico48]));

  // icon.svg: an obsidian rounded square carrying the artwork as a data URI,
  // so the tab icon reads on light and dark browser chrome alike.
  const inner = await sharp(mark.buf).resize({ width: 192, height: 192, fit: "inside", kernel: "lanczos3" }).png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 }).toBuffer();
  const im = await sharp(inner).metadata();
  const S = 256, box = 228;
  const w = (im.width / Math.max(im.width, im.height)) * box, h = (im.height / Math.max(im.width, im.height)) * box;
  await writeFile(
    `${ROOT}/public/icon.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" rx="40" fill="${OBSIDIAN}"/><image x="${((S - w) / 2).toFixed(2)}" y="${((S - h) / 2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" href="data:image/png;base64,${inner.toString("base64")}"/></svg>\n`,
  );

  // touch + manifest icons: opaque obsidian squares (the OS applies its own mask)
  await writeFile(`${ROOT}/public/apple-touch-icon.png`, await officialTile(mark, 180, { fill: 0.74 }));
  await writeFile(`${ROOT}/public/icon-192.png`, await officialTile(mark, 192, { fill: 0.8 }));
  await writeFile(`${ROOT}/public/icon-512.png`, await officialTile(mark, 512, { fill: 0.8 }));
  // maskable: the whole mark inside the central 80% safe circle
  await writeFile(`${ROOT}/public/icon-maskable-512.png`, await officialTile(mark, 512, { fill: 0.6 }));

  built["_ico"] = [ico16, ico32, ico48];

  // vector app-icon iterations for the deliverable (not used by the site)
  const iconDir = `${OUT_DELIV}/app-icons-vector`;
  await mkdir(iconDir, { recursive: true });
  await writeFile(`${iconDir}/icon-compact.svg`, squareIcon(built._compact, 64, { radius: 0.16, fill: 0.74 }) + "\n");
  await writeFile(`${iconDir}/icon-monogram-512.png`, await rasterize(squareIcon(built.monogram, 512, { radius: 0, fill: 0.76 }), 512));
  await writeFile(`${iconDir}/icon-compact-180.png`, await rasterize(squareIcon(built._compact, 180, { radius: 0, fill: 0.64 }), 180));
  await writeFile(`${iconDir}/favicon-16-glyph.png`, await rasterize(squareIcon(built._tiny, 16, { radius: 0.14, fill: 0.84 }), 16));
}

/* ----------------------------- contact sheet ---------------------------- */
// One review sheet: every mark large and at its real working size, on
// obsidian and on parchment, plus the small sizes magnified 4x (nearest
// neighbour) so stroke weights and counters can be judged pixel by pixel.

const PANEL_H = 760;
const placed = (s, x, y, h, fg) => {
  const b = bbox(s);
  const k = h / b.h;
  return { svg: `<path fill="${fg}" d="${toD(translate(scale(translate(s, -b.x, -b.y), k), x, y))}"/>`, w: b.w * k };
};

function sheetPanel(built, bg, fg, W) {
  let svg = `<rect width="${W}" height="${PANEL_H}" fill="${bg}"/>`;
  // row 1: horizontal marks
  let x = 60;
  for (const [m, h] of [["lockup-horizontal", 150], ["wordmark", 150]]) {
    const p = placed(built[m], x, 60, h, fg);
    svg += p.svg;
    x += p.w + 120;
  }
  // row 2: round and tall marks
  x = 60;
  for (const [m, h] of [["seal", 340], ["monogram", 340], ["shield", 340], ["_compact", 260], ["_tiny", 200]]) {
    const p = placed(built[m], x, 250 + (340 - h) / 2, h, fg);
    svg += p.svg;
    x += p.w + 90;
  }
  // row 3: real sizes (header 36, footer seal 88, everything else 32)
  x = 60;
  for (const [m, h] of [["lockup-horizontal", 36], ["lockup-horizontal", 32], ["seal", 88], ["seal", 64], ["monogram", 32], ["wordmark", 32], ["shield", 32], ["_compact", 32], ["_tiny", 16]]) {
    const p = placed(built[m], x, 630 + (88 - h) / 2, h, fg);
    svg += p.svg;
    x += p.w + 40;
  }
  return svg;
}

async function contactSheet(built) {
  const W = 2400;
  const panelSvg = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${PANEL_H}">${sheetPanel(built, bg, fg, W)}</svg>`;
  const dark = await sharp(Buffer.from(panelSvg(OBSIDIAN, COLORS.gold))).png().toBuffer();
  const light = await sharp(Buffer.from(panelSvg(PARCHMENT, COLORS["gold-deep"]))).png().toBuffer();
  // magnify the real-size row (y 690..800, x 0..1200) of each panel 4x
  const mag = async (buf) => sharp(await sharp(buf).extract({ left: 40, top: 620, width: 1180, height: 110 }).toBuffer()).resize({ width: 2360, kernel: "nearest" }).png().toBuffer();
  const favs = await Promise.all(built._ico.map((buf, i) => sharp(buf).resize({ width: [16, 32, 48][i] * 6, kernel: "nearest" }).png().toBuffer()));
  const H = PANEL_H * 2 + 220 * 2 + 340;
  await sharp({ create: { width: W, height: H, channels: 4, background: "#2a2824" } })
    .composite([
      { input: dark, left: 0, top: 0 },
      { input: light, left: 0, top: PANEL_H },
      { input: await mag(dark), left: 0, top: PANEL_H * 2 },
      { input: await mag(light), left: 0, top: PANEL_H * 2 + 220 },
      ...favs.map((input, i) => ({ input, left: 40 + i * 340, top: PANEL_H * 2 + 460 })),
    ])
    .png()
    .toFile(`${OUT_DELIV}/contact-sheet.png`);
}

await main();
console.log("logos built");
await import("./build-og.mjs");
