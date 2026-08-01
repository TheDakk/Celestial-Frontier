/* speciesoverrides.ts — THE MORPHOLOGY PASS (wave 1+). A hand-written
   override layer that sits ATOP the verbatim hdart engine. speciesPortrait
   consults resolveOverride() FIRST (by the genome's _earthName / family);
   anything unmatched falls through to the byte-verbatim hdPortrait* painters,
   so the ~1,200 species we have not corrected stay parity-exact. Every
   correction here is a NAMED deviation (D-ART-*) with before/after sheets in
   the morphology-pass record. Approved by Nick 2026-08-01.

   Style law preserved: rim-lit painterly figurine, grounding shadow, deep
   vignette — the strongest existing work (Elephant/Owl/Sunflower) is the bar.
   These override painters draw a real SILHOUETTE FAMILY (Nick's audit §8/§9
   structural families) and take their PALETTE from the genome, so a corrected
   species still belongs to its rarity/color roll — bodies, not recolors. */
import { mulberry32, TAU } from '@cf/domain-rand';
import { SP_COLOR, SP_HEX } from '@cf/domain-speciestraits';
import { FLORA_ICONIC, FLORA_DUPES, floraLadder, type Pal } from './floraoverrides.js';
import { FAUNA_NAME } from './faunaoverrides.js';
import { QUAD_SPEC, faunaQuadruped } from './quadrupedoverrides.js';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
const S = 440;

/* ---- shared painterly furniture (matches the verbatim engine's feel) ---- */
function newCanvas(): { cv: HTMLCanvasElement; c: Ctx } {
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  return { cv, c: cv.getContext('2d')! };
}
/** ★ THE FIT PASS (Nick 2026-08-01: "make sure the animals fit within the
    window" — Hippo's muzzle and Giraffe's head were running off frame).
    The subject is painted to a TRANSPARENT layer, its ink measured, then
    scaled+centred into the frame with a margin. This is the verbatim
    engine's own convention for flora (_fitPlant) generalised to every
    override painter, so NO subject can ever clip again — backward and
    forward at once. */
const FIT_MARGIN = 0.90;
function fitInk(src: HTMLCanvasElement, dst: Ctx): void {
  const sc = src.getContext('2d')!;
  const data = sc.getImageData(0, 0, S, S).data;
  let x0 = S, y0 = S, x1 = -1, y1 = -1;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (data[(y * S + x) * 4 + 3]! > 12) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return;                       /* nothing drawn — leave the frame */
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const target = S * FIT_MARGIN;
  const k = Math.min(1, target / w, target / h);   /* only ever shrink */
  const dw = w * k, dh = h * k;
  dst.drawImage(src, x0, y0, w, h, (S - dw) / 2, (S - dh) / 2, dw, dh);
}
function palette(g: G): { base: string; cr: number; cg: number; cb: number; lit: string; dark: string } {
  /* mirror the verbatim engine's color read EXACTLY (hdart.verbatim.js:201):
     SP_HEX[ SP_COLOR[ color % SP_COLOR.length ] ] */
  const spc = SP_COLOR as readonly number[], sph = SP_HEX as readonly string[];
  const forced = (g as { _forceHex?: string })._forceHex;
  const hex = forced || sph[spc[((g.color as number) || 0) % spc.length] as number] || '#b08a6a';
  const n = parseInt(hex.slice(1), 16), cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
  const lit = `rgb(${Math.min(255, cr * 1.4 | 0)},${Math.min(255, cg * 1.4 | 0)},${Math.min(255, cb * 1.4 | 0)})`;
  const dark = `rgb(${cr * 0.42 | 0},${cg * 0.42 | 0},${cb * 0.42 | 0})`;
  return { base: hex, cr, cg, cb, lit, dark };
}
function vignette(c: Ctx, warm = false): void {
  const bg = c.createRadialGradient(S * 0.5, S * 0.44, 20, S * 0.5, S * 0.5, S * 0.62);
  bg.addColorStop(0, warm ? '#151109' : '#0a1016'); bg.addColorStop(1, '#05060c');
  c.fillStyle = bg; c.fillRect(0, 0, S, S);
}
function groundShadow(c: Ctx, cx = S * 0.5, cy = S * 0.82, rx = S * 0.26): void {
  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.beginPath(); c.ellipse(cx, cy, rx, S * 0.04, 0, 0, TAU); c.fill();
}
function floorFade(c: Ctx): void {
  const fg = c.createLinearGradient(0, S * 0.72, 0, S);
  fg.addColorStop(0, 'rgba(6,8,14,0)'); fg.addColorStop(1, 'rgba(6,8,14,0.5)');
  c.fillStyle = fg; c.fillRect(0, S * 0.72, S, S * 0.28);
}
/* a rim light so a dark subject never dissolves into the vignette (D-ART-3
   at the source: bodies are drawn WITH separation, not rescued after) */
function rimStroke(c: Ctx, path: () => void, hue = 'rgba(200,214,236,0.5)', w = 2): void {
  c.save(); c.strokeStyle = hue; c.lineWidth = w; c.beginPath(); path(); c.stroke(); c.restore();
}

/* ============================ FUNGI FAMILIES ============================ */
/* Nick audit §8: replace the one mushroom with structural families. */
function fungiBracket(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* shelf/bracket colony fanning off a vertical wood substrate */
  const r = mulberry32(((g.seed as number) ^ 0xB47) >>> 0);
  c.fillStyle = '#231812'; c.fillRect(S * 0.16, S * 0.10, S * 0.14, S * 0.78);   /* the log */
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(S * 0.26, S * 0.10, S * 0.04, S * 0.78);
  const shelves = 4 + (r() * 3 | 0);
  for (let i = 0; i < shelves; i++) {
    const y = S * (0.20 + i * (0.62 / shelves)) + (r() - 0.5) * 10;
    const w = S * (0.30 + r() * 0.22), h = S * (0.055 + r() * 0.03);
    const gg = c.createLinearGradient(S * 0.30, y - h, S * 0.30 + w, y + h);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.6, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    c.beginPath(); c.moveTo(S * 0.30, y);
    c.quadraticCurveTo(S * 0.30 + w * 0.6, y - h, S * 0.30 + w, y - h * 0.2);
    c.quadraticCurveTo(S * 0.30 + w * 0.6, y + h, S * 0.30, y + h);
    c.closePath(); c.fill();
    /* concentric growth bands (Turkey Tail signature) */
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1.4;
    for (let b = 1; b <= 3; b++) { c.beginPath(); c.ellipse(S * 0.30, y, w * (b / 3.4), h * (b / 3.4), 0, -1.0, 1.0); c.stroke(); }
  }
}
function fungiPuffball(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* one or two round spore balls at ground level */
  const r = mulberry32(((g.seed as number) ^ 0xF00B) >>> 0);
  groundShadow(c);
  const balls = 1 + (r() < 0.4 ? 1 : 0);
  for (let i = 0; i < balls; i++) {
    const bx = S * (0.5 + (i - (balls - 1) / 2) * 0.22), by = S * 0.66, rad = S * (0.16 - i * 0.03);
    const gg = c.createRadialGradient(bx - rad * 0.35, by - rad * 0.4, 2, bx, by, rad * 1.15);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.7, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg; c.beginPath(); c.arc(bx, by, rad, 0, TAU); c.fill();
    rimStroke(c, () => c.arc(bx, by, rad, -2.4, 0.3), 'rgba(220,228,244,0.4)', 2);
    /* pocked spore-warts */
    c.fillStyle = 'rgba(0,0,0,0.18)';
    for (let d = 0; d < 22; d++) { const a = r() * TAU, dd = Math.pow(r(), 0.6) * rad * 0.82; c.beginPath(); c.arc(bx + Math.cos(a) * dd, by + Math.sin(a) * dd * 0.9, 1 + r() * 2, 0, TAU); c.fill(); }
  }
}
function fungiCoral(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* branching antler-like fingers rising from the ground */
  const r = mulberry32(((g.seed as number) ^ 0xC0A1) >>> 0);
  groundShadow(c, S * 0.5, S * 0.84, S * 0.2);
  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number): void => {
    if (depth > 4 || len < 8) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    c.strokeStyle = depth < 2 ? p.dark : p.base; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(ang) * len * 0.5 + (r() - 0.5) * 10, y + Math.sin(ang) * len * 0.5, x2, y2); c.stroke();
    c.strokeStyle = p.lit; c.lineWidth = Math.max(1, w * 0.4);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
    const forks = 2 + (r() < 0.4 ? 1 : 0);
    for (let f = 0; f < forks; f++) grow(x2, y2, ang - 0.5 + f * (1.0 / (forks - 1 || 1)) + (r() - 0.5) * 0.3, len * (0.7 + r() * 0.15), Math.max(1.5, w * 0.66), depth + 1);
  };
  const trunks = 3 + (r() * 2 | 0);
  for (let t = 0; t < trunks; t++) grow(S * (0.34 + t * (0.32 / trunks)), S * 0.82, -Math.PI / 2 + (r() - 0.5) * 0.4, S * 0.16, 12, 0);
}
function fungiEarthstar(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* splayed star rays around a central spore sac */
  const r = mulberry32(((g.seed as number) ^ 0xEA57) >>> 0);
  groundShadow(c, S * 0.5, S * 0.72, S * 0.22);
  const cx = S * 0.5, cy = S * 0.6, rays = 6 + (r() * 3 | 0);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU, inner = S * 0.09, outer = S * (0.20 + r() * 0.05);
    const gg = c.createLinearGradient(cx, cy, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer * 0.5);
    gg.addColorStop(0, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(cx + Math.cos(a - 0.28) * inner, cy + Math.sin(a - 0.28) * inner * 0.5);
    c.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer * 0.5);
    c.lineTo(cx + Math.cos(a + 0.28) * inner, cy + Math.sin(a + 0.28) * inner * 0.5);
    c.closePath(); c.fill();
  }
  const sac = c.createRadialGradient(cx - 4, cy - 5, 2, cx, cy, S * 0.1);
  sac.addColorStop(0, p.lit); sac.addColorStop(0.7, p.base); sac.addColorStop(1, p.dark);
  c.fillStyle = sac; c.beginPath(); c.arc(cx, cy, S * 0.1, 0, TAU); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(cx, cy - S * 0.02, S * 0.012, 0, TAU); c.fill();   /* apical pore */
}
function fungiMold(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* a fuzzy spreading surface colony — no cap, no stem (Yeast/Mold/Mildew) */
  const r = mulberry32(((g.seed as number) ^ 0x310D) >>> 0);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 240; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.5) * S * 0.34;
    const x = S * 0.5 + Math.cos(a) * d, y = S * 0.52 + Math.sin(a) * d * 0.82, rad = 3 + r() * 10;
    const gg = c.createRadialGradient(x, y, 0, x, y, rad);
    gg.addColorStop(0, `rgba(${p.cr},${p.cg},${p.cb},0.10)`); gg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
  }
  c.restore();
  /* sporangia dots peppering the fuzz */
  for (let i = 0; i < 60; i++) { const a = r() * TAU, d = Math.pow(r(), 0.6) * S * 0.3; c.fillStyle = `rgba(${p.cr * 1.3 | 0},${p.cg * 1.3 | 0},${p.cb * 1.3 | 0},0.5)`; c.beginPath(); c.arc(S * 0.5 + Math.cos(a) * d, S * 0.52 + Math.sin(a) * d * 0.82, 1 + r() * 1.8, 0, TAU); c.fill(); }
}
function fungiMorel(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* conical honeycomb-pitted cap on a pale stalk */
  const r = mulberry32(((g.seed as number) ^ 0x503E) >>> 0);
  groundShadow(c, S * 0.5, S * 0.84, S * 0.16);
  const cx = S * 0.5, base = S * 0.82, ch = S * 0.34, cw = S * 0.14;
  c.fillStyle = '#e8ddc4'; c.beginPath(); c.moveTo(cx - cw * 0.5, base); c.quadraticCurveTo(cx - cw * 0.3, base - S * 0.16, cx - cw * 0.4, base - S * 0.2); c.lineTo(cx + cw * 0.4, base - S * 0.2); c.quadraticCurveTo(cx + cw * 0.3, base - S * 0.16, cx + cw * 0.5, base); c.closePath(); c.fill();
  const top = base - S * 0.2;
  const cap = c.createLinearGradient(cx - cw, top, cx + cw, top - ch);
  cap.addColorStop(0, p.dark); cap.addColorStop(0.5, p.base); cap.addColorStop(1, p.lit);
  c.fillStyle = cap;
  c.beginPath(); c.moveTo(cx - cw, top); c.quadraticCurveTo(cx - cw * 0.9, top - ch, cx, top - ch); c.quadraticCurveTo(cx + cw * 0.9, top - ch, cx + cw, top); c.quadraticCurveTo(cx, top + cw * 0.3, cx - cw, top); c.closePath(); c.fill();
  /* honeycomb pits — the one thing that makes it a morel */
  c.save(); c.beginPath(); c.moveTo(cx - cw, top); c.quadraticCurveTo(cx - cw * 0.9, top - ch, cx, top - ch); c.quadraticCurveTo(cx + cw * 0.9, top - ch, cx + cw, top); c.closePath(); c.clip();
  c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 2;
  for (let yy = top - ch; yy < top; yy += 12) for (let xx = cx - cw; xx < cx + cw; xx += 14) { const off = ((yy / 12) | 0) % 2 ? 7 : 0; c.beginPath(); c.moveTo(xx + off, yy); c.lineTo(xx + off + 7, yy + 6); c.lineTo(xx + off, yy + 12); c.lineTo(xx + off - 7, yy + 6); c.closePath(); c.stroke(); }
  c.restore();
}

/* ============================ MICROBE FAMILIES ============================ */
/* Nick audit §9: replace the bubble cluster with named morphologies. */
function microbeTardigrade(c: Ctx, g: G, p0: ReturnType<typeof palette>): void {
  /* the water bear — plump segmented barrel, 8 stubby clawed legs. THE icon.
     ⚠ contrast guarantee: a dull/dark roll makes the icon vanish, so warm
     the body toward the real translucent-amber water bear when the rolled
     palette is too desaturated (the D-ART-3 floor, applied at the source) */
  const lum = (p0.cr + p0.cg + p0.cb) / 3;
  const sat = Math.max(p0.cr, p0.cg, p0.cb) - Math.min(p0.cr, p0.cg, p0.cb);
  const p = (lum < 150 || sat < 40)
    ? palette({ ...g, color: undefined, _forceHex: '#d6b483' } as G) as ReturnType<typeof palette>
    : p0;
  const cx = S * 0.46, cy = S * 0.52, bl = S * 0.30, bh = S * 0.17;
  /* legs first (behind body), 4 visible pairs */
  c.fillStyle = p.dark;
  for (let i = 0; i < 4; i++) {
    const lx = cx - bl * 0.42 + i * (bl * 0.26), ly = cy + bh * 0.55;
    for (const s of [-1, 1] as const) {
      c.save(); c.translate(lx, ly); c.rotate(s * 0.25 + (i - 1.5) * 0.06);
      c.beginPath(); c.ellipse(0, S * 0.045, S * 0.028, S * 0.05, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(20,14,10,0.9)';   /* tiny claws */
      for (const cw of [-1, 0, 1]) { c.beginPath(); c.arc(cw * 5, S * 0.09, 2.2, 0, TAU); c.fill(); }
      c.fillStyle = p.dark; c.restore();
    }
  }
  /* the plush body — segmented, front-tapered */
  const bg = c.createRadialGradient(cx - bl * 0.3, cy - bh * 0.4, 4, cx, cy, bl);
  bg.addColorStop(0, p.lit); bg.addColorStop(0.7, p.base); bg.addColorStop(1, p.dark);
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(cx, cy, bl, bh, 0, 0, TAU); c.fill();
  rimStroke(c, () => c.ellipse(cx, cy, bl, bh, 0, -2.6, 0.4), 'rgba(220,228,244,0.5)', 2.4);
  /* body segments */
  c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 2;
  for (let i = 1; i < 5; i++) { const sx = cx - bl * 0.5 + i * (bl * 0.28); c.beginPath(); c.ellipse(sx, cy, bh * 0.5, bh * 0.92, 0, -1.2, 1.2); c.stroke(); }
  /* snout + mouth at the front */
  const snout = cx - bl * 0.92;
  c.fillStyle = p.base; c.beginPath(); c.ellipse(snout, cy, bh * 0.42, bh * 0.6, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.arc(snout - bh * 0.2, cy, bh * 0.18, 0, TAU); c.fill();   /* the terminal mouth */
}
function microbeDiatom(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* rigid geometric silica shell — radial or bilateral glass */
  const r = mulberry32(((g.seed as number) ^ 0xD1A7) >>> 0);
  const cx = S * 0.5, cy = S * 0.5, radial = r() < 0.5;
  c.save(); c.globalCompositeOperation = 'lighter';
  const glass = c.createRadialGradient(cx, cy, 4, cx, cy, S * 0.32);
  glass.addColorStop(0, `rgba(${p.cr * 1.4 | 0},${p.cg * 1.4 | 0},${p.cb * 1.4 | 0},0.5)`); glass.addColorStop(0.8, `rgba(${p.cr},${p.cg},${p.cb},0.22)`); glass.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = glass;
  if (radial) { c.beginPath(); c.arc(cx, cy, S * 0.3, 0, TAU); c.fill(); }
  else { c.beginPath(); c.ellipse(cx, cy, S * 0.34, S * 0.15, 0, 0, TAU); c.fill(); }
  c.restore();
  c.strokeStyle = `rgba(${p.cr * 1.5 | 0},${p.cg * 1.5 | 0},${p.cb * 1.5 | 0},0.6)`; c.lineWidth = 1.6;
  if (radial) {
    const spokes = 12 + (r() * 8 | 0);
    c.beginPath(); c.arc(cx, cy, S * 0.3, 0, TAU); c.stroke();
    c.beginPath(); c.arc(cx, cy, S * 0.3, 0, TAU); c.stroke();
    for (let i = 0; i < spokes; i++) { const a = (i / spokes) * TAU; c.beginPath(); c.moveTo(cx + Math.cos(a) * S * 0.06, cy + Math.sin(a) * S * 0.06); c.lineTo(cx + Math.cos(a) * S * 0.3, cy + Math.sin(a) * S * 0.3); c.stroke(); }
    for (let ring = 1; ring < 4; ring++) { c.globalAlpha = 0.5; c.beginPath(); c.arc(cx, cy, S * 0.3 * (ring / 4), 0, TAU); c.stroke(); c.globalAlpha = 1; }
  } else {
    c.beginPath(); c.ellipse(cx, cy, S * 0.34, S * 0.15, 0, 0, TAU); c.stroke();
    const ribs = 16 + (r() * 8 | 0);
    for (let i = 1; i < ribs; i++) { const x = cx - S * 0.34 + (i / ribs) * S * 0.68; const yh = S * 0.15 * Math.sqrt(Math.max(0, 1 - Math.pow((x - cx) / (S * 0.34), 2))); c.beginPath(); c.moveTo(x, cy - yh); c.lineTo(x, cy + yh); c.stroke(); }
  }
}
function microbeCiliate(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* Paramecium — elongated slipper fringed with cilia, internal vacuoles */
  const r = mulberry32(((g.seed as number) ^ 0xC117) >>> 0);
  const cx = S * 0.5, cy = S * 0.5;
  c.save(); c.translate(cx, cy); c.rotate(-0.35);
  /* cilia fringe */
  c.strokeStyle = `rgba(${p.cr * 1.3 | 0},${p.cg * 1.3 | 0},${p.cb * 1.3 | 0},0.5)`; c.lineWidth = 1.4;
  for (let i = 0; i < 60; i++) { const t = i / 60, x = -S * 0.28 + t * S * 0.56, yh = S * 0.13 * Math.sqrt(Math.max(0, 1 - Math.pow(x / (S * 0.28), 2))); for (const s of [-1, 1]) { const bx = x, by = s * yh; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + (r() - 0.5) * 6, by + s * (8 + r() * 6)); c.stroke(); } }
  const body = c.createRadialGradient(-S * 0.08, -S * 0.04, 6, 0, 0, S * 0.3);
  body.addColorStop(0, `rgba(${p.cr * 1.4 | 0},${p.cg * 1.4 | 0},${p.cb * 1.4 | 0},0.6)`); body.addColorStop(0.7, `rgba(${p.cr},${p.cg},${p.cb},0.34)`); body.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.1)`);
  c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, S * 0.28, S * 0.13, 0, 0, TAU); c.fill();
  rimStroke(c, () => c.ellipse(0, 0, S * 0.28, S * 0.13, 0, 0, TAU), `rgba(${p.cr * 1.5 | 0},${p.cg * 1.5 | 0},${p.cb * 1.5 | 0},0.55)`, 1.6);
  /* the diagonal oral groove + a contractile vacuole or two */
  c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-S * 0.14, -S * 0.05); c.quadraticCurveTo(0, 0, S * 0.06, S * 0.03); c.stroke();
  for (let i = 0; i < 2; i++) { c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.4; c.beginPath(); c.arc(S * (0.06 - i * 0.16), 0, S * 0.035, 0, TAU); c.stroke(); }
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(-S * 0.02, S * 0.01, S * 0.04, S * 0.028, 0, 0, TAU); c.fill();   /* macronucleus */
  c.restore();
}
function microbeAmoeba(c: Ctx, g: G, p: ReturnType<typeof palette>): void {
  /* irregular pseudopod blob with nucleus + vacuoles */
  const r = mulberry32(((g.seed as number) ^ 0xA0EB) >>> 0);
  const cx = S * 0.5, cy = S * 0.5, n = 9 + (r() * 4 | 0), pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rad = S * (0.16 + r() * 0.14); pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.9]); }
  const body = c.createRadialGradient(cx - S * 0.05, cy - S * 0.05, 6, cx, cy, S * 0.3);
  body.addColorStop(0, `rgba(${p.cr * 1.4 | 0},${p.cg * 1.4 | 0},${p.cb * 1.4 | 0},0.55)`); body.addColorStop(0.75, `rgba(${p.cr},${p.cg},${p.cb},0.3)`); body.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.08)`);
  c.fillStyle = body; c.beginPath(); c.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 0; i < n; i++) { const a = pts[i]!, b = pts[(i + 1) % n]!; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  c.closePath(); c.fill();
  rimStroke(c, () => { c.moveTo(pts[0]![0], pts[0]![1]); for (let i = 0; i < n; i++) { const a = pts[i]!, b = pts[(i + 1) % n]!; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } }, `rgba(${p.cr * 1.5 | 0},${p.cg * 1.5 | 0},${p.cb * 1.5 | 0},0.5)`, 1.6);
  c.fillStyle = 'rgba(20,26,34,0.75)'; c.beginPath(); c.arc(cx + S * 0.03, cy - S * 0.02, S * 0.05, 0, TAU); c.fill();   /* nucleus */
  c.fillStyle = 'rgba(255,255,255,0.14)';
  for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx + (r() - 0.5) * S * 0.24, cy + (r() - 0.5) * S * 0.2, S * (0.02 + r() * 0.03), 0, TAU); c.fill(); }
}

/* ---- family routing by Earth-species NAME (audit-driven), then draw ---- */
type Painter = (c: Ctx, g: G, p: ReturnType<typeof palette>) => void;
const FUNGI_NAME: Record<string, Painter> = {
  'Turkey Tail': fungiBracket, 'Bracket Fungus': fungiBracket, 'Shelf Fungus': fungiBracket, 'Chicken-of-the-Woods': fungiBracket, 'Oyster Mushroom': fungiBracket, 'Reindeer Lichen': fungiBracket,
  'Giant Puffball': fungiPuffball, 'Earthstar': fungiEarthstar, 'Black Truffle': fungiPuffball,
  'Coral Fungus': fungiCoral, "Lion's Mane": fungiCoral, 'Cordyceps': fungiCoral,
  'Morel': fungiMorel,
  'Mold': fungiMold, 'Mildew': fungiMold, 'Yeast': fungiMold, 'Bracken': fungiMold,
};
const MICROBE_NAME: Record<string, Painter> = {
  'Tardigrade': microbeTardigrade, 'Water Bear': microbeTardigrade,
  'Diatom': microbeDiatom, 'Radiolarian': microbeDiatom,
  'Paramecium': microbeCiliate, 'Euglena': microbeCiliate,
  'Amoeba': microbeAmoeba, 'Foraminiferan': microbeAmoeba,
};

/** Return a corrected portrait data URL, or null to fall through to the
    verbatim engine. Matches by the genome's _earthName. */
export function resolveOverride(g: G): string | null {
  /* normalize the curly apostrophe (U+2019) to ASCII — the roster uses it
     (Lion's Mane), which is exactly the mojibake Nick's audit caught */
  const name = String((g as { _earthName?: string })._earthName || '').replace(/[’‘]/g, "'");
  if (!name) return null;
  const kingdom = g.kingdom as string;
  /* FLORA (wave 2): iconic bespoke bodies first, then the name-seeded ladder
     for every member of the 16 byte-duplicate groups */
  if (kingdom === 'flora') {
    const iconic = FLORA_ICONIC[name];
    const dupe = !iconic && FLORA_DUPES.includes(name);
    if (!iconic && !dupe) return null;
    const { cv, c } = newCanvas();
    vignette(c, false);
    floorFade(c);
    const ink = newCanvas();
    (iconic || floraLadder)(ink.c, g, palette(g) as Pal, name);
    fitInk(ink.cv, c);
    return cv.toDataURL();
  }
  /* FAUNA (wave 3): species whose defining anatomy was categorically wrong */
  if (kingdom === 'fauna') {
    const fp = FAUNA_NAME[name];
    const quad = !fp ? QUAD_SPEC[name] : undefined;   /* wave 4: the mammal system */
    if (!fp && !quad) return null;
    const { cv, c } = newCanvas();
    vignette(c, false);
    floorFade(c);
    const ink = newCanvas();
    if (fp) fp(ink.c, g, palette(g) as Pal, name);
    else faunaQuadruped(ink.c, g, palette(g) as Pal, quad!);
    fitInk(ink.cv, c);
    return cv.toDataURL();
  }
  const painter = kingdom === 'fungi' ? FUNGI_NAME[name] : kingdom === 'microbe' ? MICROBE_NAME[name] : undefined;
  if (!painter) return null;
  const { cv, c } = newCanvas();
  vignette(c, kingdom === 'fungi');
  floorFade(c);
  const ink = newCanvas();
  painter(ink.c, g, palette(g));
  fitInk(ink.cv, c);
  return cv.toDataURL();
}

/** How many species wave 1 corrects (for the record + the audit sentinel). */
export const OVERRIDE_COUNT = new Set([...Object.keys(FUNGI_NAME), ...Object.keys(MICROBE_NAME), ...Object.keys(FLORA_ICONIC), ...FLORA_DUPES, ...Object.keys(FAUNA_NAME), ...Object.keys(QUAD_SPEC)]).size;
