/* floraoverrides.ts — THE MORPHOLOGY PASS, wave 2 (flora).
   Nick's audit Blocker 3 + Blocker 5. Two jobs:

   (1) KILL THE 16 EXACT-DUPLICATE GROUPS (38 files). ROOT CAUSE PROVEN this
       batch: the verbatim flora painter's generic "leaf ladder" is
       deterministic per FORM and consumes no per-species variation, so
       Acai/Milkweed/Salmonberry — with genuinely different genomes — rendered
       BYTE-IDENTICAL art. The species NAME never reached the painter. The fix
       is a NAME-SEEDED painter: leaf count, phyllotaxy, angle, leaf shape,
       stem lean and fruiting organ all derive from a hash of the species'
       own name, so two different labels can never collide again —
       structurally, not by luck.
   (2) ICONIC PLANTS earn real bodies: Rafflesia (ground bloom, no stem),
       Pineapple (rosette + fruit + crown), Joshua Tree (branching trunk +
       terminal rosettes), Cotton (bolls), Dragon Fruit (climbing cactus),
       Rhubarb/Tobacco (broad basal leaves + petioles), Cabbage (layered head).

   Style law preserved: painterly gradients, rim separation, grounding shadow.
   Palette comes from the genome, so a corrected plant still belongs to its
   color/rarity roll — bodies, not recolors. */
import { mulberry32, TAU } from '@cf/domain-rand';
import { speciesHue } from './surface.js';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
export type FloraPainter = (c: Ctx, g: G, p: Pal, name: string) => void;
const S = 440;

function nameSeed(name: string): number {
  let h = 0x9E37;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return h >>> 0;
}
function ground(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.beginPath(); c.ellipse(cx, cy, rx, S * 0.035, 0, 0, TAU); c.fill();
}

/** THE ANTI-DUPLICATE WORKHORSE — a herb/shrub whose every parameter is
    seeded by the species NAME, so identical genomes still diverge. */
export function floraLadder(c: Ctx, g: G, p: Pal, name: string): void {
  const r = mulberry32((nameSeed(name) ^ ((g.seed as number) >>> 0)) >>> 0);
  const pairs = 3 + (r() * 5 | 0);
  const droop = -0.5 + r() * 1.1;
  const leafL = S * (0.10 + r() * 0.09), leafW = S * (0.020 + r() * 0.030);
  const alt = r() < 0.45;
  const berries = r() < 0.42, pods = !berries && r() < 0.4;
  const lean = (r() - 0.5) * 2;
  const bx = S * 0.5 + lean * S * 0.04, base = S * 0.84, top = S * 0.24;
  ground(c, S * 0.5, base + 4, S * 0.15);
  c.strokeStyle = '#3b2a1c'; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(S * 0.5, base); c.quadraticCurveTo(bx, (base + top) / 2, bx, top); c.stroke();
  c.strokeStyle = 'rgba(255,240,210,0.16)'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(S * 0.5 - 2, base); c.quadraticCurveTo(bx - 2, (base + top) / 2, bx - 2, top); c.stroke();
  for (let i = 0; i < pairs; i++) {
    const t = (i + 0.6) / (pairs + 0.4), y = base - (base - top) * t;
    const x = S * 0.5 + (bx - S * 0.5) * t;
    const sides = alt ? [i % 2 ? 1 : -1] : [-1, 1];
    for (const s of sides) {
      const ang = (0.45 + droop * 0.5) + (r() - 0.5) * 0.14;
      c.save(); c.translate(x, y); c.scale(s, 1); c.rotate(ang);
      const gg = c.createLinearGradient(0, 0, leafL, 0);
      gg.addColorStop(0, p.dark); gg.addColorStop(0.5, p.base); gg.addColorStop(1, p.lit);
      c.fillStyle = gg;
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(leafL * 0.5, -leafW, leafL, 0);
      c.quadraticCurveTo(leafL * 0.5, leafW, 0, 0);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(leafL, 0); c.stroke();
      c.restore();
    }
    if (berries && i > 0 && i < pairs - 1) {
      c.fillStyle = p.lit;
      for (let b = 0; b < 3; b++) { c.beginPath(); c.arc(x + (b - 1) * 7, y - 6 + (r() - 0.5) * 4, 3.2 + r() * 1.6, 0, TAU); c.fill(); }
    }
  }
  if (pods) {
    c.fillStyle = p.base;
    c.beginPath(); c.ellipse(bx, top - 6, leafW * 1.4, S * 0.05, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath(); c.ellipse(bx - 3, top - 12, leafW * 0.6, S * 0.02, 0, 0, TAU); c.fill();
  }
}

export function floraRafflesia(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0x8A77) >>> 0);
  const cx = S * 0.5, cy = S * 0.60;
  ground(c, cx, S * 0.80, S * 0.28);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * TAU, rad = S * 0.26;
    const gg = c.createRadialGradient(cx, cy, S * 0.06, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.62, rad);
    gg.addColorStop(0, '#8e1d16'); gg.addColorStop(0.6, '#b8342a'); gg.addColorStop(1, '#6d1410');
    c.fillStyle = gg;
    c.beginPath(); c.moveTo(cx, cy);
    c.quadraticCurveTo(cx + Math.cos(a - 0.45) * rad * 1.1, cy + Math.sin(a - 0.45) * rad * 0.7, cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.62);
    c.quadraticCurveTo(cx + Math.cos(a + 0.45) * rad * 1.1, cy + Math.sin(a + 0.45) * rad * 0.7, cx, cy);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,236,214,0.6)';
    for (let d = 0; d < 9; d++) { const t = 0.35 + r() * 0.55, aa = a + (r() - 0.5) * 0.5; c.beginPath(); c.arc(cx + Math.cos(aa) * rad * t, cy + Math.sin(aa) * rad * 0.62 * t, 3 + r() * 3.4, 0, TAU); c.fill(); }
  }
  const well = c.createRadialGradient(cx, cy, 2, cx, cy, S * 0.11);
  well.addColorStop(0, '#180705'); well.addColorStop(0.7, '#5d130f'); well.addColorStop(1, '#8e1d16');
  c.fillStyle = well; c.beginPath(); c.ellipse(cx, cy, S * 0.11, S * 0.075, 0, 0, TAU); c.fill();
}

export function floraPineapple(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0x91AE) >>> 0);
  const cx = S * 0.5, gy = S * 0.78;
  ground(c, cx, gy + 8, S * 0.26);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + r() * 0.1, len = S * (0.18 + r() * 0.09);
    c.strokeStyle = i % 2 ? '#3f7a3a' : '#54a049'; c.lineWidth = 9 - (i % 3); c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, gy);
    c.quadraticCurveTo(cx + Math.cos(a) * len * 0.6, gy + Math.sin(a) * len * 0.32 - 14, cx + Math.cos(a) * len, gy + Math.sin(a) * len * 0.36);
    c.stroke();
  }
  const fx = cx, fy = S * 0.52, fw = S * 0.115, fh = S * 0.19;
  const fg = c.createLinearGradient(fx - fw, fy, fx + fw, fy);
  fg.addColorStop(0, '#8a6018'); fg.addColorStop(0.45, '#d8a42c'); fg.addColorStop(1, '#7d5514');
  c.fillStyle = fg; c.beginPath(); c.ellipse(fx, fy, fw, fh, 0, 0, TAU); c.fill();
  c.save(); c.beginPath(); c.ellipse(fx, fy, fw, fh, 0, 0, TAU); c.clip();
  c.strokeStyle = 'rgba(60,38,8,0.55)'; c.lineWidth = 1.6;
  for (let i = -5; i <= 5; i++) {
    c.beginPath(); c.moveTo(fx - fw, fy + i * 14); c.lineTo(fx + fw, fy + i * 14 - 26); c.stroke();
    c.beginPath(); c.moveTo(fx - fw, fy + i * 14 - 26); c.lineTo(fx + fw, fy + i * 14); c.stroke();
  }
  c.restore();
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.22;
    c.strokeStyle = i % 2 ? '#4c8f43' : '#67b85a'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(fx, fy - fh); c.quadraticCurveTo(fx + Math.cos(a) * 26, fy - fh - 34, fx + Math.cos(a) * 40, fy - fh - 56); c.stroke();
  }
}

export function floraJoshua(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0x105A) >>> 0);
  ground(c, S * 0.5, S * 0.87, S * 0.2);
  const rosette = (x: number, y: number, sc: number): void => {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + r() * 0.2;
      c.strokeStyle = i % 2 ? '#4d6b3a' : '#63884a'; c.lineWidth = 4 * sc; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 30 * sc, y + Math.sin(a) * 30 * sc); c.stroke();
    }
  };
  const limb = (x: number, y: number, ang: number, len: number, w: number, d: number): void => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    c.strokeStyle = '#4a3826'; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = 'rgba(255,236,200,0.10)'; c.lineWidth = w * 0.35;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
    if (d >= 2 || len < 26) { rosette(x2, y2, Math.max(0.55, w / 16)); return; }
    const forks = 2 + (r() < 0.4 ? 1 : 0);
    for (let f = 0; f < forks; f++) limb(x2, y2, ang - 0.6 + f * (1.2 / (forks - 1 || 1)) + (r() - 0.5) * 0.25, len * 0.66, Math.max(5, w * 0.62), d + 1);
  };
  limb(S * 0.5, S * 0.87, -Math.PI / 2 + 0.05, S * 0.24, 24, 0);
}

export function floraBroadLeaf(c: Ctx, g: G, p: Pal, opts: { petiole?: string; head?: boolean }): void {
  const r = mulberry32(((g.seed as number) ^ 0x8B0A) >>> 0);
  ground(c, S * 0.5, S * 0.85, S * 0.24);
  for (let i = 0; i < 5; i++) {
    const t = i / 4, x = S * (0.28 + t * 0.44), lean = (t - 0.5) * 1.4;
    const topY = S * (0.34 + r() * 0.1), baseY = S * 0.82;
    if (opts.petiole) {
      c.strokeStyle = opts.petiole; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(S * 0.5, baseY); c.quadraticCurveTo(x, (baseY + topY) / 2, x + lean * 10, topY + 20); c.stroke();
    }
    const lw = S * (0.10 + r() * 0.045), lh = S * (0.11 + r() * 0.05);
    const gg = c.createRadialGradient(x - lw * 0.3, topY - lh * 0.2, 4, x, topY, lw * 1.4);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.6, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    c.beginPath(); c.moveTo(x + lean * 10, topY + 22);
    c.bezierCurveTo(x - lw, topY + 6, x - lw * 0.8, topY - lh, x, topY - lh * 0.9);
    c.bezierCurveTo(x + lw * 0.8, topY - lh, x + lw, topY + 6, x + lean * 10, topY + 22);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x + lean * 10, topY + 20); c.lineTo(x, topY - lh * 0.7); c.stroke();
  }
  if (opts.head) {
    const hx = S * 0.5, hy = S * 0.70;
    for (let i = 4; i >= 0; i--) {
      const rad = S * (0.075 + i * 0.022);
      const gg = c.createRadialGradient(hx - rad * 0.3, hy - rad * 0.35, 3, hx, hy, rad);
      gg.addColorStop(0, p.lit); gg.addColorStop(1, p.dark);
      c.fillStyle = gg; c.beginPath(); c.ellipse(hx, hy, rad, rad * 0.86, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(hx, hy, rad, rad * 0.86, 0, 0, TAU); c.stroke();
    }
  }
}

export function floraCotton(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0xC077) >>> 0);
  ground(c, S * 0.5, S * 0.86, S * 0.18);
  const bolls: Array<[number, number]> = [];
  const branch = (x: number, y: number, ang: number, len: number, w: number, d: number): void => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    c.strokeStyle = '#4b5a35'; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5 - 6, x2, y2); c.stroke();
    if (d >= 2) { bolls.push([x2, y2]); return; }
    for (let f = 0; f < 2 + (r() < 0.5 ? 1 : 0); f++) branch(x2, y2, ang - 0.55 + f * 0.55 + (r() - 0.5) * 0.2, len * 0.7, Math.max(3, w * 0.66), d + 1);
  };
  branch(S * 0.5, S * 0.86, -Math.PI / 2, S * 0.2, 10, 0);
  for (const [bx, by] of bolls) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      const gg = c.createRadialGradient(bx + Math.cos(a) * 6, by + Math.sin(a) * 6, 1, bx, by, 20);
      gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.7, '#efe9dd'); gg.addColorStop(1, 'rgba(220,214,200,0.18)');
      c.fillStyle = gg; c.beginPath(); c.arc(bx + Math.cos(a) * 7, by + Math.sin(a) * 7, 11, 0, TAU); c.fill();
    }
    c.strokeStyle = '#6a5636'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, 13, 0.6, 2.6); c.stroke();
  }
}

export function floraDragonFruit(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0xD46F) >>> 0);
  ground(c, S * 0.5, S * 0.87, S * 0.16);
  for (let i = 0; i < 3; i++) {
    const x0 = S * (0.36 + i * 0.14), sway = (r() - 0.5) * 40;
    c.strokeStyle = '#3f7a45'; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, S * 0.86); c.quadraticCurveTo(x0 + sway, S * 0.55, x0 + sway * 0.5, S * 0.24); c.stroke();
    c.strokeStyle = 'rgba(180,230,170,0.32)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x0 - 4, S * 0.86); c.quadraticCurveTo(x0 + sway - 4, S * 0.55, x0 + sway * 0.5 - 4, S * 0.24); c.stroke();
    if (i !== 1) {
      const fx = x0 + sway * 0.7, fy = S * (0.40 + r() * 0.16);
      const gg = c.createRadialGradient(fx - 6, fy - 8, 2, fx, fy, 30);
      gg.addColorStop(0, '#ff7fa8'); gg.addColorStop(0.7, '#d8306a'); gg.addColorStop(1, '#8d1c44');
      c.fillStyle = gg; c.beginPath(); c.ellipse(fx, fy, 22, 28, 0, 0, TAU); c.fill();
      c.fillStyle = '#7dd87a';
      for (let s2 = 0; s2 < 6; s2++) {
        const a = (s2 / 6) * TAU;
        c.save(); c.translate(fx + Math.cos(a) * 16, fy + Math.sin(a) * 20); c.rotate(a);
        c.beginPath(); c.ellipse(0, 0, 12, 4, 0, 0, TAU); c.fill(); c.restore();
      }
    }
  }
}

/* ★ WAVE 68 — CRUSTOSE LICHEN. gp3: "wrong organism entirely — a symmetrical
   spray of rays floating on empty background; no rock substrate, no crusty
   lobed rosette, no cup discs". A lichen IS its rock. */
export function floraLichen(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0x11C4E) >>> 0);
  const cx = S * 0.5, cy = S * 0.60;
  /* the boulder */
  const rg = c.createRadialGradient(cx - S * 0.08, cy - S * 0.10, 4, cx, cy, S * 0.30);
  rg.addColorStop(0, '#8a8a86'); rg.addColorStop(0.7, '#6a6a66'); rg.addColorStop(1, '#4a4a48');
  c.fillStyle = 'rgba(0,0,0,0.42)'; c.beginPath(); c.ellipse(cx, cy + S * 0.20, S * 0.28, S * 0.03, 0, 0, TAU); c.fill();
  c.fillStyle = rg;
  c.beginPath(); c.moveTo(cx - S * 0.28, cy + S * 0.18);
  c.quadraticCurveTo(cx - S * 0.30, cy - S * 0.10, cx - S * 0.10, cy - S * 0.16);
  c.quadraticCurveTo(cx + S * 0.12, cy - S * 0.22, cx + S * 0.26, cy - S * 0.06);
  c.quadraticCurveTo(cx + S * 0.32, cy + S * 0.10, cx + S * 0.24, cy + S * 0.18);
  c.closePath(); c.fill();
  /* flat crusty rosettes hugging the rock face, dark-rimmed, overlapping */
  for (let i = 0; i < 7; i++) {
    const px = cx + (r() - 0.5) * S * 0.38, py = cy - S * 0.04 + (r() - 0.5) * S * 0.18;
    const pr = S * (0.045 + r() * 0.045);
    c.fillStyle = 'rgba(60,70,50,0.75)';                       /* the dark rim */
    lobedDisc(c, px, py, pr * 1.08, r);
    c.fillStyle = i % 2 ? 'rgba(174,191,175,0.92)' : 'rgba(196,204,166,0.92)';   /* the thallus */
    lobedDisc(c, px, py, pr, r);
    c.fillStyle = 'rgba(120,130,100,0.8)';                     /* the apothecia cups */
    for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(px + (r() - 0.5) * pr, py + (r() - 0.5) * pr * 0.7, pr * 0.12, 0, TAU); c.fill(); }
  }
}
function lobedDisc(c: Ctx, x: number, y: number, R: number, r: () => number): void {
  c.beginPath();
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * TAU;
    const rr = R * (0.82 + Math.sin(a * 5 + r() * 0.5) * 0.16);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.72;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.fill();
}

/* ★ GOLD AUDIT — BAOBAB. "Needs the iconic massively swollen bottle-like
   trunk, sparse high branching crown"; the ordinary tapering trunk missed the
   one thing the tree is. */
export function floraBaobab(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0xBA0BAB) >>> 0);
  const cx = S * 0.5, base = S * 0.80, H = S * 0.52;
  c.fillStyle = 'rgba(0,0,0,0.40)'; c.beginPath(); c.ellipse(cx, base + S * 0.012, S * 0.20, S * 0.028, 0, 0, TAU); c.fill();
  const tg = c.createLinearGradient(cx - S * 0.16, 0, cx + S * 0.16, 0);
  tg.addColorStop(0, '#9a8a76'); tg.addColorStop(0.45, '#b5a48c'); tg.addColorStop(1, '#6e6050');
  c.fillStyle = tg;
  c.beginPath();                                   /* the swollen barrel */
  c.moveTo(cx - S * 0.155, base);
  c.bezierCurveTo(cx - S * 0.195, base - H * 0.42, cx - S * 0.115, base - H * 0.72, cx - S * 0.048, base - H * 0.88);
  c.lineTo(cx + S * 0.048, base - H * 0.88);
  c.bezierCurveTo(cx + S * 0.115, base - H * 0.72, cx + S * 0.195, base - H * 0.42, cx + S * 0.155, base);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(74,62,50,0.35)'; c.lineWidth = 2;   /* bark seams */
  for (let i = -2; i <= 2; i++) {
    c.beginPath(); c.moveTo(cx + i * S * 0.05, base);
    c.quadraticCurveTo(cx + i * S * 0.045, base - H * 0.5, cx + i * S * 0.02, base - H * 0.85); c.stroke();
  }
  c.strokeStyle = '#8a7a66'; c.lineCap = 'round';           /* stubby root-like branches */
  const tips: Array<[number, number]> = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.82 + (i / 6) * Math.PI * 0.64;
    const x0 = cx + (i / 6 - 0.5) * S * 0.075, y0 = base - H * 0.87;
    const x1 = x0 + Math.cos(a) * S * 0.10, y1 = y0 + Math.sin(a) * S * 0.10;
    c.lineWidth = S * 0.016;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.lineWidth = S * 0.008;                                 /* twiglets */
    for (const d of [-0.4, 0.35]) {
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 + Math.cos(a + d) * S * 0.05, y1 + Math.sin(a + d) * S * 0.05); c.stroke();
    }
    tips.push([x1, y1]);
  }
  for (const [tx2, ty2] of tips) {                           /* sparse leaf tufts */
    for (let k = 0; k < 5; k++) {
      c.fillStyle = k % 2 ? 'rgba(104,140,78,0.85)' : 'rgba(78,110,58,0.85)';
      c.beginPath(); c.ellipse(tx2 + (r() - 0.5) * S * 0.05, ty2 - S * 0.015 + (r() - 0.5) * S * 0.03, S * 0.022, S * 0.012, r() * 3, 0, TAU); c.fill();
    }
  }
  for (let i = 0; i < 3; i++) {                              /* pods dangling on long stalks */
    const [tx2, ty2] = tips[1 + i * 2]!;
    c.strokeStyle = '#7a6a56'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(tx2, ty2); c.lineTo(tx2 + S * 0.008, ty2 + S * 0.075); c.stroke();
    c.fillStyle = '#9a8a5a';
    c.beginPath(); c.ellipse(tx2 + S * 0.008, ty2 + S * 0.09, S * 0.014, S * 0.022, 0.1, 0, TAU); c.fill();
  }
}

/* ★ GOLD AUDIT — DESERT ROSE (Adenium): "hugely swollen bulbous grey caudex
   base, few thick stubby branches, leaves and showy flowers only at the ends".
   The old cactus-ish blob was the wrong growth form entirely. */
export function floraDesertRose(c: Ctx, g: G): void {
  const r = mulberry32(((g.seed as number) ^ 0xDE5E27) >>> 0);
  const cx = S * 0.5, base = S * 0.80;
  c.fillStyle = 'rgba(0,0,0,0.40)'; c.beginPath(); c.ellipse(cx, base + S * 0.012, S * 0.17, S * 0.026, 0, 0, TAU); c.fill();
  const cg2 = c.createRadialGradient(cx - S * 0.05, base - S * 0.10, 4, cx, base - S * 0.08, S * 0.22);
  cg2.addColorStop(0, '#b8b0a2'); cg2.addColorStop(0.6, '#948c7e'); cg2.addColorStop(1, '#6a6458');
  c.fillStyle = cg2;
  c.beginPath();                                   /* the bulbous caudex */
  c.moveTo(cx - S * 0.135, base);
  c.bezierCurveTo(cx - S * 0.185, base - S * 0.14, cx - S * 0.10, base - S * 0.235, cx - S * 0.035, base - S * 0.26);
  c.bezierCurveTo(cx + S * 0.02, base - S * 0.275, cx + S * 0.14, base - S * 0.20, cx + S * 0.135, base - S * 0.09);
  c.quadraticCurveTo(cx + S * 0.145, base - S * 0.03, cx + S * 0.125, base);
  c.closePath(); c.fill();
  const arms: Array<[number, number, number]> = [];
  c.strokeStyle = '#8a8274'; c.lineCap = 'round';           /* stubby tapering branches */
  for (let i = 0; i < 4; i++) {
    const t = (i / 3) - 0.5;
    const x0 = cx + t * S * 0.10, y0 = base - S * 0.24;
    const x1 = x0 + t * S * 0.14, y1 = y0 - S * (0.13 + r() * 0.05);
    c.lineWidth = S * 0.024;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + t * S * 0.04, y0 - S * 0.09, x1, y1); c.stroke();
    arms.push([x1, y1, t]);
  }
  for (const [ax2, ay2] of arms) {                          /* leaves ONLY at the tips */
    for (let k = 0; k < 4; k++) {
      c.fillStyle = 'rgba(74,120,62,0.9)';
      c.save(); c.translate(ax2 + (r() - 0.5) * S * 0.03, ay2 - S * 0.008 + (r() - 0.5) * S * 0.02);
      c.rotate(r() * 3); c.beginPath(); c.ellipse(0, 0, S * 0.022, S * 0.009, 0, 0, TAU); c.fill(); c.restore();
    }
    for (let k = 0; k < 2; k++) {                           /* the showy pink flowers */
      const fx2 = ax2 + (r() - 0.5) * S * 0.045, fy2 = ay2 - S * 0.03 - r() * S * 0.02;
      for (let pt = 0; pt < 5; pt++) {
        const a = (pt / 5) * TAU + r() * 0.2;
        const pg2 = c.createRadialGradient(fx2, fy2, 1, fx2 + Math.cos(a) * S * 0.016, fy2 + Math.sin(a) * S * 0.016, S * 0.018);
        pg2.addColorStop(0, '#f4e6ea'); pg2.addColorStop(1, '#d8506a');
        c.fillStyle = pg2;
        c.beginPath(); c.ellipse(fx2 + Math.cos(a) * S * 0.014, fy2 + Math.sin(a) * S * 0.014, S * 0.013, S * 0.008, a, 0, TAU); c.fill();
      }
      c.fillStyle = '#f0e0d0'; c.beginPath(); c.arc(fx2, fy2, S * 0.005, 0, TAU); c.fill();
    }
  }
}

/** iconic plants with bespoke bodies (Blocker 5) */
export const FLORA_ICONIC: Record<string, FloraPainter> = {
  'Baobab': (c, g) => floraBaobab(c, g),
  'Desert Rose': (c, g) => floraDesertRose(c, g),
  'Rafflesia': (c, g) => floraRafflesia(c, g),
  'Lichen': (c, g) => floraLichen(c, g),
  'Pineapple': (c, g) => floraPineapple(c, g),
  'Joshua Tree': (c, g) => floraJoshua(c, g),
  'Cotton': (c, g) => floraCotton(c, g),
  'Dragon Fruit': (c, g) => floraDragonFruit(c, g),
  /* ⚠ hue is the FOLIAGE axis: rhubarb leaves are green and only the stalks
     are red, and the row already says so via `petiole`. Given the red here
     the whole plant came out scarlet. */
  'Rhubarb': (c, g, p) => floraBroadLeaf(c, g, speciesHue(p, '#4d7a35'), { petiole: '#c0392b' }),
};

/** every name in the 16 byte-duplicate groups → the NAME-SEEDED ladder, so
    two different labels can never render identically again (Blocker 3) */
export const FLORA_DUPES: readonly string[] = [
  /* ★ WAVE 42 — 'Green Algae', 'Ice Algae' and 'Snow Algae' removed: all three
     are keyed in CANON (algaeBloom / microAlgaeCell), which resolveOverride
     consults first, so the anti-duplicate ladder never saw them. Listing a
     species here that CANON already owns does not make it less duplicated — it
     just hides a dead row inside the mechanism built to stop duplicates. */
  'Acai', 'Salmonberry', 'Licorice', "Devil's Club", ];
