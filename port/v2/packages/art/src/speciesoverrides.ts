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
import { FAUNA2_NAME } from './faunaoverrides2.js';
import { FAUNA3_NAME } from './faunaoverrides3.js';
import { BIRD_NAME } from './birdoverrides.js';
import { QUAD2_SPEC } from './mammaloverrides.js';
import { INVERT_NAME } from './invertoverrides.js';
import { FLORA2_SPEC } from './florarost.js';
import { planFor } from './proceduraloverrides.js';
import { faunaKiwi, faunaMudskipper, faunaPyrosome, faunaSalp, faunaTripodFish } from './faunaoverrides4.js';
import { floraCabbage, floraCarrot, floraCorn, floraHemp, floraTobacco, floraWatermelon, floraStrawberry, floraKiwiFruit } from './floraoverrides3.js';
import { fungiFlyAgaric, fungiLionsMane, fungiMaitake, fungiStinkhorn, fungiCordyceps, lichenMat, microbeForam, tardigrade, macroAlgaeSheet, microAlgaeCell, algaeBloom } from './fungioverrides2.js';
import { procFamilyIndex, FAMILY_COUNT, fungiTooth, fungiJelly, fungiTruffle, fungiCup, fungiClub, microbeRods, microbeSpiral, microbeFilament, microbeChain, microbeFlagellate, microbePlates, microbeMat } from './proceduralfamilies.js';
import { fishBody } from './faunaoverrides3.js';
import { insectBody, myriapod } from './invertoverrides.js';
import { plantBody } from './floraoverrides2.js';
import { reptSnake, reptTurtle } from './faunaoverrides2.js';
import { faunaBird } from './faunaoverrides.js';

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
const INK = S * 2;            /* the oversized ink layer */
const INK_OFF = S * 0.5;      /* painter origin, so overflow in EVERY direction survives */
/** an ink layer a painter cannot overflow: 2S canvas, origin offset by S/2 */
function newInk(): { cv: HTMLCanvasElement; c: Ctx } {
  const cv = document.createElement('canvas'); cv.width = cv.height = INK;
  const c = cv.getContext('2d')!;
  c.translate(INK_OFF, INK_OFF);
  return { cv, c };
}
/** ★ diagnostic for the audit's CLIP SENTINEL: set when a subject's ink
    reaches the ink layer's own edge — i.e. it was cut at DRAW time and no
    amount of fitting can restore it. Should always stay empty. */
export const CLIPPED: string[] = [];
function fitInk(src: HTMLCanvasElement, dst: Ctx, who: string): void {
  const sc = src.getContext('2d')!;
  const data = sc.getImageData(0, 0, INK, INK).data;
  let x0 = INK, y0 = INK, x1 = -1, y1 = -1;
  for (let y = 0; y < INK; y++) {
    const row = y * INK;
    for (let x = 0; x < INK; x++) {
      if (data[(row + x) * 4 + 3]! > 12) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return;                       /* nothing drawn — leave the frame */
  if (x0 <= 0 || y0 <= 0 || x1 >= INK - 1 || y1 >= INK - 1) CLIPPED.push(who);
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
  /* ★ THE SUBSTRATE. This painter was pure haze at 0.10 alpha, which on a
     NAMED species sat over a vignette and read fine — but a procedural genome
     has nothing behind it, so the fit pass scaled a cloud of dust to fill the
     frame and the colony vanished. A mould grows ON something: the crust it
     spreads across gives the spores a body to belong to. */
  {
    const cx = S * 0.5, cy = S * 0.54;
    const cg = c.createRadialGradient(cx - S * 0.06, cy - S * 0.05, 4, cx, cy, S * 0.34);
    cg.addColorStop(0, `rgba(${p.cr * 0.55 | 0},${p.cg * 0.55 | 0},${p.cb * 0.5 | 0},0.85)`);
    cg.addColorStop(0.7, `rgba(${p.cr * 0.34 | 0},${p.cg * 0.34 | 0},${p.cb * 0.32 | 0},0.62)`);
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = cg;
    c.beginPath();
    for (let i = 0; i <= 26; i++) {   /* a ragged spreading crust, not a disc */
      const a = (i / 26) * TAU, rr = S * (0.26 + Math.sin(a * 3.1) * 0.035 + r() * 0.03);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.62;
      if (!i) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath(); c.fill();
  }
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
    /* ★ WAVE 20 — a PENNATE valve, not a striped pill. The old ribs ran the
       full height of the ellipse as straight bars and read as a barcode. A real
       pennate diatom has a RAPHE slit down the long axis with a nodule at each
       pole and one at the centre, and its striae run from the raphe OUT to the
       margin — short, angled, and stopping where the valve curves away. */
    const RX = S * 0.34, RY = S * 0.15;
    c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, 0, TAU); c.stroke();
    const ribs = 22 + (r() * 10 | 0);
    for (let i = 1; i < ribs; i++) {
      const u = (i / ribs) * 2 - 1;
      const x = cx + u * RX;
      const yh = RY * Math.sqrt(Math.max(0, 1 - u * u));
      const lean = u * 0.30;                       /* striae fan away from centre */
      for (const s of [-1, 1] as const) {
        c.globalAlpha = 0.45 + (1 - Math.abs(u)) * 0.5;
        c.beginPath();
        c.moveTo(x + lean * 4, cy + s * RY * 0.13);
        c.lineTo(x + lean * 10, cy + s * yh * 0.94);
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    /* the raphe and its three nodules */
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(cx - RX * 0.90, cy); c.lineTo(cx - RX * 0.10, cy); c.stroke();
    c.beginPath(); c.moveTo(cx + RX * 0.10, cy); c.lineTo(cx + RX * 0.90, cy); c.stroke();
    c.fillStyle = `rgba(${Math.min(255, p.cr * 1.6 | 0)},${Math.min(255, p.cg * 1.6 | 0)},${Math.min(255, p.cb * 1.6 | 0)},0.85)`;
    for (const nx of [cx - RX * 0.92, cx, cx + RX * 0.92]) { c.beginPath(); c.arc(nx, cy, 3.2, 0, TAU); c.fill(); }
    /* the glass has THICKNESS — a lens highlight along the upper valve face */
    c.strokeStyle = 'rgba(255,255,255,0.34)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(cx, cy, RX * 0.93, RY * 0.88, 0, -2.5, -0.6); c.stroke();
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
  'Coral Fungus': fungiCoral,
  'Morel': fungiMorel,
  'Mold': fungiMold, 'Mildew': fungiMold, 'Yeast': fungiMold,
  /* wave 18 — the Platinum-audit bespoke fungi, whose signature the shared
     families cannot express (a family for the many, a hand form for the few) */
  'Fly Agaric': fungiFlyAgaric,
  "Lion's Mane": fungiLionsMane,
  'Maitake': fungiMaitake,
  'Stinkhorn': fungiStinkhorn,
  'Cordyceps': fungiCordyceps,
};
const MICROBE_NAME: Record<string, Painter> = {
  'Tardigrade': tardigrade,   /* wave 18: the canonical 8-legged water bear */
  'Diatom': microbeDiatom, 'Radiolarian': microbeDiatom, 'Dinoflagellate': microbeDiatom,
  'Paramecium': microbeCiliate, 'Euglena': microbeCiliate,
  'Amoeba': microbeAmoeba, 'Foraminiferan': microbeAmoeba, 'Green Algae': microbeAmoeba,
};

/** Return a corrected portrait data URL, or null to fall through to the
    verbatim engine. Matches by the genome's _earthName. */
/** Cross-kingdom + iconic bespoke routing (wave 18, the Platinum audit). */
const CANON: Record<string, (c: Ctx, g: G, p: Pal) => void> = {
  /* Tardigrade is an ANIMAL in both kingdoms it appears in (audit canonical) */
  'fauna|Tardigrade': tardigrade,
  /* Foraminiferan gets its chambered test */
  'microbe|Foraminiferan': microbeForam,
  /* Green Algae: MACRO in flora (a green sheet), MICRO in microbe (a cell) */
  'flora|Green Algae': macroAlgaeSheet,
  'microbe|Green Algae': microAlgaeCell,
  /* Snow / Ice Algae: a tinted bloom field in each kingdom it appears in */
  'flora|Snow Algae': algaeBloom, 'microbe|Snow Algae': algaeBloom,
  'flora|Ice Algae': algaeBloom, 'microbe|Ice Algae': algaeBloom,
  /* Reindeer Lichen: one canonical pale branching mat across flora + fungi */
  'flora|Reindeer Lichen': lichenMat, 'fungi|Reindeer Lichen': lichenMat,
  /* Sea Lettuce: a green macroalgal sheet, not a purple strap */
  'flora|Sea Lettuce': macroAlgaeSheet,
  /* ★ wave 19 — the iconic flora whose GROWTH FORM is the name (audit bucket C) */
  'flora|Cabbage': floraCabbage,
  'flora|Carrot': floraCarrot,
  'flora|Corn': floraCorn,
  'flora|Hemp': floraHemp,
  'flora|Tobacco': floraTobacco,
  'flora|Watermelon': floraWatermelon,
  'flora|Wild Strawberry': floraStrawberry,
  'flora|Kiwi Fruit': floraKiwiFruit,
  /* ★ wave 19 — the fauna blockers whose SIGNATURE the shared systems cannot
     express (audit bucket D) */
  'fauna|Kiwi': faunaKiwi,
  'fauna|Mudskipper': faunaMudskipper,
  'fauna|Pyrosome': faunaPyrosome,
  'fauna|Salp': faunaSalp,
  'fauna|Tripod Fish': faunaTripodFish,
};
export function resolveOverride(g: G): string | null {
  /* normalize the curly apostrophe (U+2019) to ASCII — the roster uses it
     (Lion's Mane), which is exactly the mojibake Nick's audit caught */
  const name = String((g as { _earthName?: string })._earthName || '').replace(/[’‘]/g, "'");
  /* ★ WAVE 13: a genome with NO Earth name — every procedural species and
     every creature a player breeds — used to fall straight through to the
     verbatim engine, which meant twelve waves of work stopped at the edge of
     the Earth catalogue. It now picks a body plan FROM THE GENOME, and only
     falls through when the plan has no Earth analogue worth forcing. */
  if (!name) return resolveProcedural(g);
  if (!name) return null;
  const kingdom = g.kingdom as string;
  /* ★ WAVE 18 — CANONICAL + CROSS-KINGDOM audit blockers. Four organisms live
     in TWO kingdoms each (the 1,014-vs-1,010 count delta), and a few iconic
     species need a bespoke painter regardless of which family the kingdom
     branch would pick. This map runs FIRST, keyed by kingdom+name, so each
     copy renders correctly for its role. */
  const canon = CANON[kingdom + '|' + name];
  if (canon) {
    const { cv, c } = newCanvas();
    vignette(c, kingdom === 'fungi');
    floorFade(c);
    const ink = newInk();
    canon(ink.c, g, palette(g) as Pal);
    fitInk(ink.cv, c, kingdom + ':' + name);
    return cv.toDataURL();
  }
  /* FLORA (wave 2): iconic bespoke bodies first, then the name-seeded ladder
     for every member of the 16 byte-duplicate groups */
  if (kingdom === 'flora') {
    /* wave 2's bespoke painters win, then wave 11's plant system, then the
       wave-2 anti-duplicate ladder for anything neither covers */
    const iconic = FLORA_ICONIC[name] || FLORA2_SPEC[name];
    const dupe = !iconic && FLORA_DUPES.includes(name);
    if (!iconic && !dupe) return null;
    const { cv, c } = newCanvas();
    vignette(c, false);
    floorFade(c);
    const ink = newInk();
    (iconic || floraLadder)(ink.c, g, palette(g) as Pal, name);
    fitInk(ink.cv, c, 'flora:' + name);
    return cv.toDataURL();
  }
  /* FAUNA (wave 3): species whose defining anatomy was categorically wrong */
  if (kingdom === 'fauna') {
    const fp = FAUNA_NAME[name] || FAUNA2_NAME[name] || FAUNA3_NAME[name] || BIRD_NAME[name] || INVERT_NAME[name];
    const quad = !fp ? (QUAD_SPEC[name] || QUAD2_SPEC[name]) : undefined;   /* wave 4: the mammal system */
    if (!fp && !quad) return null;
    const { cv, c } = newCanvas();
    vignette(c, false);
    floorFade(c);
    const ink = newInk();
    if (fp) fp(ink.c, g, palette(g) as Pal, name);
    else faunaQuadruped(ink.c, g, palette(g) as Pal, quad!, name);
    fitInk(ink.cv, c, 'fauna:' + name);
    return cv.toDataURL();
  }
  const painter = kingdom === 'fungi' ? FUNGI_NAME[name] : kingdom === 'microbe' ? MICROBE_NAME[name] : undefined;
  if (!painter) return null;
  const { cv, c } = newCanvas();
  vignette(c, kingdom === 'fungi');
  floorFade(c);
  const ink = newInk();
  painter(ink.c, g, palette(g));
  fitInk(ink.cv, c, kingdom + ':' + name);
  return cv.toDataURL();
}

/** How many species wave 1 corrects (for the record + the audit sentinel). */
export const OVERRIDE_COUNT = new Set([...Object.keys(FUNGI_NAME), ...Object.keys(MICROBE_NAME), ...Object.keys(FLORA_ICONIC), ...FLORA_DUPES, ...Object.keys(FAUNA_NAME), ...Object.keys(FAUNA2_NAME), ...Object.keys(FAUNA3_NAME), ...Object.keys(BIRD_NAME), ...Object.keys(INVERT_NAME), ...Object.keys(QUAD_SPEC), ...Object.keys(QUAD2_SPEC)]).size;

/* ★ THE PROCEDURAL PATH (wave 13). Draws a genome that has no Earth name
   through whichever of our systems its own genes describe, so a bred
   creature inherits the fit pass, the pattern law and the surface laws.
   Returns null — i.e. falls through to the verbatim engine — for the body
   plans with no Earth analogue, which the verbatim engine draws better than
   a forced mapping would (D-ART-14 applied to a whole rendering path). */
export function resolveProcedural(g: G): string | null {
  /* ★ WAVE 17 — THE LAST MONO-TEMPLATE (Nick's audit §12/§13, for the
     PROCEDURAL spread). Wave 1 gave the NAMED fungi and microbes structural
     families, but every procedural genome in those two kingdoms still fell
     through to the verbatim engine — where all 20 rendered as the SAME three
     mushrooms and the SAME bubble cluster, differing only in colour. Heat
     changed nothing structural. The families already exist; they just were
     never reachable without a name. The genome's own `form` gene picks one. */
  const kingdom = String(g.kingdom || '');
  if (kingdom === 'fungi' || kingdom === 'microbe') {
    /* ★ WAVE 20 — TWO THINGS WERE STILL WRONG HERE.
       (1) SIX fungal and FOUR microbial forms cannot carry 60 organisms each,
           which is exactly what the Platinum audit reported ("all 60 outputs
           remain variations of the same cap-and-stem trio / bubble colony").
           The families it names are now present: tooth, jelly, truffle, cup,
           club, parasitic club and lichen on the fungal side; rods, spirals,
           filaments, chains, flagellates, plates and mats on the microbial.
       (2) `form % 6` IS NOT A UNIFORM CHOICE. The raw gene clumps, so a
           twelve-cell sample came back half puffballs and five microbes in six
           were the same amoeba in different colours — a mono-template with
           extra steps. Avalanche the seed before choosing (the murmur3 finish
           the degenerate-salt bug taught us to reach for), then take the
           modulus of a genuinely mixed number. The picker itself lives in
           proceduralfamilies.ts (procFamilyIndex) so the spread test can call
           the real thing rather than a copy that would agree with its bugs. */
    const FUNGI_FAM = [fungiBracket, fungiPuffball, fungiCoral, fungiMorel, fungiMold, fungiEarthstar,
      fungiTooth, fungiJelly, fungiTruffle, fungiCup, fungiClub, fungiCordyceps, lichenMat];
    const MICROBE_FAM = [tardigrade, microbeDiatom, microbeCiliate, microbeAmoeba, microbeForam,
      microbeRods, microbeSpiral, microbeFilament, microbeChain, microbeFlagellate,
      microbePlates, microbeMat, microAlgaeCell];
    const fam = kingdom === 'fungi' ? FUNGI_FAM : MICROBE_FAM;
    /* the table and FAMILY_COUNT must agree — if they ever drift, the spread
       test says so by name rather than this silently painting an empty frame */
    const painter = fam[procFamilyIndex(g, kingdom) % fam.length]!;
    const { cv, c } = newCanvas();
    vignette(c, kingdom === 'fungi');
    floorFade(c);
    const ink = newInk();
    painter(ink.c, g, palette(g));
    fitInk(ink.cv, c, 'proc:' + kingdom + ':' + String(g.seed));
    if (g.lumin) {
      /* the genome's lumin flag, visible here too (D-ART-49) — drawn on the
         framed canvas so the glow spills past the subject's silhouette */
      const pl = palette(g);
      const gg = c.createRadialGradient(S * 0.5, S * 0.46, 8, S * 0.5, S * 0.5, S * 0.42);
      gg.addColorStop(0, `rgba(${Math.min(255, pl.cr * 0.5 + 120 | 0)},${Math.min(255, pl.cg * 0.5 + 150 | 0)},255,0.20)`);
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gg; c.fillRect(0, 0, S, S);
    }
    return cv.toDataURL();
  }
  const plan = planFor(g as Record<string, unknown>);
  if (!plan) return null;
  const pal = palette(g) as Pal;
  const isFlora = plan.kind === 'plant';
  const { cv, c } = newCanvas();
  vignette(c, false);
  floorFade(c);
  const ink = newInk();
  /* the label is the plan, not a species — it keeps fitInk's clip reporting
     actionable without pretending a procedural creature has a name */
  const who = 'proc:' + plan.kind + ':' + String(g.seed);
  switch (plan.kind) {
    case 'quad': faunaQuadruped(ink.c, g, pal, plan.spec, who); break;
    case 'fish': fishBody(ink.c, g, pal, plan.spec, who); break;
    case 'insect': insectBody(ink.c, g, pal, plan.spec, who); break;
    case 'bird': faunaBird(ink.c, g, pal, plan.spec, who); break;
    case 'snake': reptSnake(ink.c, g, pal, { banded: plan.banded }, who); break;
    case 'myriapod': myriapod(ink.c, g, pal, { flat: plan.flat }, who); break;
    case 'turtle': reptTurtle(ink.c, g, pal, {}, who); break;
    case 'plant': plantBody(ink.c, g, pal, plan.spec, who); break;
  }
  fitInk(ink.cv, c, who);
  void isFlora;
  return cv.toDataURL();
}
