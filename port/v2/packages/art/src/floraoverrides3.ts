/* floraoverrides3.ts — WAVE 19: the Platinum-audit iconic flora.
   The audit's flora blockers are all the same class: a species whose
   GROWTH FORM is famous, rendered by a generic habit. A cabbage is not "a
   rosette"; it is a tight ball of wrapped leaves. A carrot is not "a
   rosette with an umbel"; the ROOT is the thing you picture. Corn is a
   stalk with an ear. These are hand-drawn because their form IS the name.

   Palette still comes from the genome, but where COLOUR is part of the
   real-world identity (a carrot's orange root, a watermelon's rind) it is
   blended toward the true hue — the audit compares to real counterparts. */
import { mulberry32, TAU } from '@cf/domain-rand';
import type { ArtContext2D } from './speciescanvas.js';

type Ctx = ArtContext2D;
type G = Record<string, unknown>;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;

function seeded(g: G, salt: number): () => number { return mulberry32((((g.seed as number) ^ salt) >>> 0)); }
function shadow(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.42)'; c.beginPath(); c.ellipse(cx, cy, rx, S * 0.024, 0, 0, TAU); c.fill();
}
/** blend the rolled palette toward a real-world anchor (identity colour) */
function toward(p: Pal, r: number, g2: number, b: number, k = 0.6): Pal {
  const cr = (r * k + p.cr * (1 - k)) | 0, cg = (g2 * k + p.cg * (1 - k)) | 0, cb = (b * k + p.cb * (1 - k)) | 0;
  return {
    base: `rgb(${cr},${cg},${cb})`, cr, cg, cb,
    lit: `rgb(${Math.min(255, cr * 1.4 | 0)},${Math.min(255, cg * 1.4 | 0)},${Math.min(255, cb * 1.4 | 0)})`,
    dark: `rgb(${cr * 0.45 | 0},${cg * 0.45 | 0},${cb * 0.45 | 0})`,
  };
}
function lit(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.34, y - r * 0.4, 2, x, y, r * 1.2);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.6, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
const LEAFG = { r: 74, g: 122, b: 52 };   /* a foliage green anchor */
function leafPal(p: Pal): Pal { return toward(p, LEAFG.r, LEAFG.g, LEAFG.b, 0.82); }

/** a palmate leaf (hemp, watermelon, strawberry lobes) drawn along a stem */
function palmate(c: Ctx, p: Pal, x: number, y: number, ang: number, len: number, fingers = 7): void {
  c.save(); c.translate(x, y); c.rotate(ang);
  for (let i = 0; i < fingers; i++) {
    const t = (i / (fingers - 1) - 0.5) * 2;
    const a = t * 0.95, L = len * (1 - Math.abs(t) * 0.38);
    c.save(); c.rotate(a);
    c.fillStyle = lit(c, p, L * 0.5, 0, L * 0.4);
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(L * 0.45, -L * 0.16, L, 0);
    c.quadraticCurveTo(L * 0.45, L * 0.16, 0, 0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,34,16,0.30)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.92, 0); c.stroke();
    c.restore();
  }
  c.restore();
}

/* ── CABBAGE: a tight ball of WRAPPED leaves, outer leaves flaring ── */
export function floraCabbage(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0xCAB6);
  const p = leafPal(pIn);
  const cx = S * 0.5, cy = S * 0.54, R = S * 0.20;
  shadow(c, cx, cy + R * 0.95, R * 1.05);
  /* the outer leaves flare away from the head */
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + i * 0.14);
    const ex = cx + Math.cos(a) * R * 1.5, ey = cy + Math.sin(a) * R * 0.62 + R * 0.2;
    c.fillStyle = lit(c, p, ex, ey, R * 0.5);
    c.save(); c.translate(cx, cy + R * 0.25); c.rotate(a - Math.PI * 0.5);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(R * 0.5, -R * 0.75, R * 1.15, -R * 0.30);
    c.quadraticCurveTo(R * 0.85, R * 0.28, 0, 0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(240,248,232,0.22)'; c.lineWidth = 2;   /* the pale ribs */
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(R * 0.6, -R * 0.28, R * 1.05, -R * 0.30); c.stroke();
    c.restore();
  }
  /* THE HEAD — overlapping wrapped LOBES. Concentric rings read as a
     snail shell; a cabbage is leaves folded over one another. */
  c.fillStyle = lit(c, p, cx, cy, R);
  c.beginPath(); c.ellipse(cx, cy, R, R * 0.94, 0, 0, TAU); c.fill();
  for (let k = 0; k < 22; k++) {
    const a2 = r() * TAU, d = r() ** 0.55 * R * 0.82;
    const lx = cx + Math.cos(a2) * d, ly = cy + Math.sin(a2) * d * 0.9;
    const lr = R * (0.26 + r() * 0.22);
    const pale = toward(p, 226, 238, 206, 0.30 + r() * 0.3);
    c.fillStyle = lit(c, pale, lx, ly, lr);
    c.save(); c.translate(lx, ly); c.rotate(a2 * 0.4 + r());
    c.beginPath(); c.ellipse(0, 0, lr, lr * 0.72, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(245,252,238,0.34)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, lr, lr * 0.72, 0, -2.5, 0.5); c.stroke();
    c.restore();
  }
  /* the tight inner whorl */
  c.fillStyle = lit(c, toward(p, 236, 246, 216, 0.5), cx - R * 0.06, cy - R * 0.08, R * 0.30);
  c.beginPath(); c.ellipse(cx - R * 0.05, cy - R * 0.06, R * 0.28, R * 0.24, 0.3, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(250,255,240,0.4)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx - R * 0.05, cy - R * 0.06, R * 0.28, R * 0.24, 0.3, 0, TAU); c.stroke();
  void r;
}

/* ── CARROT: the ORANGE TAPROOT is the picture, with feathery tops ── */
export function floraCarrot(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0xCA77);
  const root = toward(pIn, 226, 118, 30, 0.72);   /* carrot orange IS the identity */
  const leaf = leafPal(pIn);
  const cx = S * 0.5, top = S * 0.46;
  shadow(c, cx, S * 0.86, S * 0.14);
  /* the feathery umbelliferous tops — finely divided, NOT broad leaves */
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.30;
    const L = S * (0.26 + (i % 2) * 0.05);
    c.strokeStyle = leaf.dark; c.lineWidth = 3; c.lineCap = 'round';
    const ex = cx + Math.cos(a) * L, ey = top + Math.sin(a) * L;
    c.beginPath(); c.moveTo(cx, top); c.quadraticCurveTo(cx + Math.cos(a) * L * 0.5, top + Math.sin(a) * L * 0.7, ex, ey); c.stroke();
    for (let k = 1; k <= 7; k++) {   /* the fine pinnae, in threes */
      const u = k / 8;
      const px = cx + (ex - cx) * u, py = top + (ey - top) * u;
      c.strokeStyle = k % 2 ? leaf.base : leaf.lit; c.lineWidth = 2;
      for (const s of [-1, 1] as const) {
        c.beginPath(); c.moveTo(px, py);
        c.lineWidth = 1.4;
        c.quadraticCurveTo(px + s * 7, py - 5, px + s * 11, py - 11); c.stroke();
        c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + s * 6, py + 1, px + s * 9, py + 5); c.stroke();
      }
    }
  }
  /* THE ROOT — a long tapering cone with the classic ring grooves */
  const rw = S * 0.075, rTop = S * 0.50, rBot = S * 0.86;
  c.fillStyle = lit(c, root, cx, rTop + (rBot - rTop) * 0.3, rw * 1.4);
  c.beginPath();
  c.moveTo(cx - rw, rTop);
  c.quadraticCurveTo(cx - rw * 0.5, rBot - S * 0.06, cx, rBot);
  c.quadraticCurveTo(cx + rw * 0.5, rBot - S * 0.06, cx + rw, rTop);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(120,52,10,0.30)'; c.lineWidth = 2;
  for (let i = 1; i <= 6; i++) {
    const t = i / 7, y = rTop + (rBot - rTop) * t, w = rw * (1 - t * 0.85);
    c.beginPath(); c.moveTo(cx - w, y); c.quadraticCurveTo(cx, y + 5, cx + w, y); c.stroke();
  }
  c.strokeStyle = root.dark; c.lineWidth = 1.6;   /* the rootlets */
  for (let i = 0; i < 6; i++) { const t = 0.3 + r() * 0.6, y = rTop + (rBot - rTop) * t, s = r() < 0.5 ? -1 : 1; c.beginPath(); c.moveTo(cx + s * rw * (1 - t * 0.8), y); c.lineTo(cx + s * (rw + 14), y + 8); c.stroke(); }
  c.strokeStyle = 'rgba(255,240,220,0.28)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(cx - rw * 0.35, rTop + 8); c.quadraticCurveTo(cx - rw * 0.2, rBot - S * 0.10, cx - 2, rBot - S * 0.02); c.stroke();
}

/* ── CORN: a tall stalk, strap leaves, a tassel, and a visible EAR ── */
export function floraCorn(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0xC02E);
  const leaf = leafPal(pIn);
  const cx = S * 0.48, base = S * 0.88, top = S * 0.12;
  shadow(c, cx, base + 4, S * 0.13);
  /* the stalk, with visible nodes */
  c.strokeStyle = leaf.dark; c.lineWidth = S * 0.022; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx + S * 0.02, (base + top) / 2, cx + S * 0.01, top); c.stroke();
  c.strokeStyle = leaf.lit; c.lineWidth = 2;
  for (let i = 1; i <= 5; i++) { const y = base - (base - top) * (i / 6); c.beginPath(); c.moveTo(cx - S * 0.014, y); c.lineTo(cx + S * 0.018, y); c.stroke(); }
  /* long arching strap leaves, alternating sides */
  for (let i = 0; i < 6; i++) {
    const s = i % 2 ? 1 : -1;
    const y = base - (base - top) * (0.12 + i * 0.135);
    const L = S * (0.30 - i * 0.02);
    c.fillStyle = lit(c, leaf, cx + s * L * 0.4, y - S * 0.04, L * 0.4);
    c.beginPath();
    c.moveTo(cx, y);
    c.quadraticCurveTo(cx + s * L * 0.55, y - S * 0.09, cx + s * L, y + S * 0.03);
    c.quadraticCurveTo(cx + s * L * 0.55, y - S * 0.02, cx, y + S * 0.012);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(235,248,220,0.25)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(cx, y); c.quadraticCurveTo(cx + s * L * 0.55, y - S * 0.055, cx + s * L * 0.96, y + S * 0.026); c.stroke();
  }
  /* THE EAR — a husked cob with silk, the thing that says maize */
  const ey = base - (base - top) * 0.40, ex = cx + S * 0.055;
  c.fillStyle = lit(c, toward(pIn, 232, 206, 88, 0.7), ex, ey, S * 0.05);
  c.save(); c.translate(ex, ey); c.rotate(0.34);
  c.beginPath(); c.ellipse(0, 0, S * 0.032, S * 0.085, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(120,96,28,0.28)';   /* the kernel rows */
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * S * 0.009, -S * 0.08); c.lineTo(i * S * 0.009, S * 0.08); c.lineWidth = 1.4; c.strokeStyle = 'rgba(120,96,28,0.28)'; c.stroke(); }
  c.fillStyle = leaf.base;   /* the husk wrapping the lower half */
  c.beginPath(); c.moveTo(-S * 0.034, S * 0.09); c.quadraticCurveTo(0, -S * 0.02, S * 0.034, S * 0.09);
  c.quadraticCurveTo(0, S * 0.12, -S * 0.034, S * 0.09); c.closePath(); c.fill();
  c.strokeStyle = '#d8b46a'; c.lineWidth = 1.6; c.lineCap = 'round';   /* the SILK */
  for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo((i - 4) * 3, -S * 0.082); c.quadraticCurveTo((i - 4) * 6, -S * 0.12, (i - 4) * 9 + 4, -S * 0.145); c.stroke(); }
  c.restore();
  /* THE TASSEL at the very top */
  c.strokeStyle = toward(pIn, 210, 188, 120, 0.6).base; c.lineWidth = 2.4; c.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.20;
    c.beginPath(); c.moveTo(cx + S * 0.01, top);
    c.quadraticCurveTo(cx + Math.cos(a) * S * 0.05, top - S * 0.05, cx + Math.cos(a) * S * 0.085, top - S * 0.075 + Math.abs(i - 4) * 3);
    c.stroke();
  }
  void r;
}

/* ── HEMP: a branched herb with the unmistakable palmate leaf ── */
export function floraHemp(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0x4E30);
  const leaf = leafPal(pIn);
  const cx = S * 0.5, base = S * 0.88, top = S * 0.16;
  shadow(c, cx, base + 4, S * 0.14);
  c.strokeStyle = leaf.dark; c.lineWidth = S * 0.016; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, base); c.lineTo(cx, top); c.stroke();
  /* branch pairs, longest at the bottom — a conical herb habit */
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const y = base - (base - top) * (0.10 + t * 0.80);
    const L = S * (0.22 - t * 0.11);
    for (const s of [-1, 1] as const) {
      c.strokeStyle = leaf.dark; c.lineWidth = 3;
      const bx = cx + s * L * 0.5, by = y - L * 0.24;
      c.beginPath(); c.moveTo(cx, y); c.lineTo(bx, by); c.stroke();
      /* THE LEAF — serrated palmate fingers, 7 of them */
      palmate(c, leaf, bx, by, s < 0 ? Math.PI + 0.35 : -0.35, L * 0.85, 7);
    }
  }
  palmate(c, leaf, cx, top + S * 0.01, -Math.PI / 2, S * 0.12, 7);
  void r;
}

/* ── TOBACCO: very large broad leaves up a tall flowering stem ── */
export function floraTobacco(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0x70BA);
  const leaf = leafPal(pIn);
  const cx = S * 0.5, base = S * 0.90, top = S * 0.14;
  shadow(c, cx, base + 4, S * 0.16);
  c.strokeStyle = leaf.dark; c.lineWidth = S * 0.016; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + S * 0.01, top); c.stroke();
  /* the huge basal leaves, shrinking upward — the tobacco signature */
  for (let i = 0; i < 6; i++) {
    const t = i / 5, s = i % 2 ? 1 : -1;
    const y = base - (base - top) * (0.05 + t * 0.72);
    const L = S * (0.30 - t * 0.15);
    c.fillStyle = lit(c, leaf, cx + s * L * 0.5, y - L * 0.15, L * 0.5);
    c.save(); c.translate(cx, y); c.rotate(s < 0 ? Math.PI - 0.22 : 0.22);
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(L * 0.25, -L * 0.42, L * 0.85, -L * 0.34, L, 0);
    c.bezierCurveTo(L * 0.85, L * 0.34, L * 0.25, L * 0.42, 0, 0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(235,248,220,0.26)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.94, 0); c.stroke();
    for (let k = 1; k <= 4; k++) { const u = k / 5; c.beginPath(); c.moveTo(L * u, 0); c.lineTo(L * (u + 0.12), -L * 0.18); c.stroke(); c.beginPath(); c.moveTo(L * u, 0); c.lineTo(L * (u + 0.12), L * 0.18); c.stroke(); }
    c.restore();
  }
  /* the terminal cluster of pink trumpet flowers */
  const fp = toward(pIn, 232, 158, 190, 0.6);
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.42, d = S * 0.055;
    const fx = cx + Math.cos(a) * d, fy = top + Math.sin(a) * d * 0.7 + S * 0.02;
    c.strokeStyle = leaf.dark; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx + S * 0.01, top + S * 0.02); c.lineTo(fx, fy); c.stroke();
    c.fillStyle = fp.base;
    c.save(); c.translate(fx, fy); c.rotate(a + Math.PI / 2);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-S * 0.014, -S * 0.03, 0, -S * 0.042);
    c.quadraticCurveTo(S * 0.014, -S * 0.03, 0, 0); c.closePath(); c.fill();
    c.fillStyle = fp.lit; c.beginPath(); c.ellipse(0, -S * 0.042, S * 0.014, S * 0.008, 0, 0, TAU); c.fill();
    c.restore();
  }
  void r;
}

/* ── WATERMELON: a CREEPING vine with lobed leaves and a striped fruit ── */
export function floraWatermelon(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0x2A7E);
  const leaf = leafPal(pIn);
  const base = S * 0.80;
  shadow(c, S * 0.5, base + S * 0.06, S * 0.30);
  /* the runner creeping ALONG the ground — not an upright stalk */
  c.strokeStyle = leaf.dark; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(S * 0.12, base);
  c.bezierCurveTo(S * 0.32, base - S * 0.07, S * 0.62, base + S * 0.05, S * 0.88, base - S * 0.03);
  c.stroke();
  for (let i = 0; i < 5; i++) {   /* lobed leaves on short petioles */
    const t = 0.1 + i * 0.19;
    const x = S * (0.12 + t * 0.76), y = base - Math.sin(t * 3.2) * S * 0.05;
    c.strokeStyle = leaf.dark; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y - S * 0.06); c.stroke();
    palmate(c, leaf, x + 6, y - S * 0.06, -Math.PI / 2 + (r() - 0.5) * 0.6, S * 0.085, 5);
    if (i % 2) {   /* the curling tendril */
      c.strokeStyle = leaf.base; c.lineWidth = 1.8; c.beginPath();
      for (let k = 0; k < 12; k++) { const a = k * 0.9, rr = 3 + k * 0.7; c.lineTo(x - 8 + Math.cos(a) * rr, y - S * 0.03 + Math.sin(a) * rr * 0.6); }
      c.stroke();
    }
  }
  /* THE FRUIT — a big striped melon resting on the ground */
  const fx = S * 0.58, fy = base + S * 0.005, fr = S * 0.135;
  const rind = toward(pIn, 46, 110, 48, 0.7);
  c.fillStyle = lit(c, rind, fx, fy, fr);
  c.beginPath(); c.ellipse(fx, fy, fr, fr * 0.82, -0.08, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(18,50,20,0.55)'; c.lineWidth = 5;   /* the dark rind stripes */
  for (let i = -2; i <= 2; i++) {
    c.beginPath();
    c.ellipse(fx, fy, fr * (0.24 + Math.abs(i) * 0.30), fr * 0.82, -0.08, -Math.PI * 0.52, Math.PI * 0.52);
    c.stroke();
  }
  c.strokeStyle = 'rgba(240,255,235,0.30)'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(fx - fr * 0.18, fy - fr * 0.22, fr * 0.42, fr * 0.30, -0.5, -0.4, 1.6); c.stroke();
}

/* ── WILD STRAWBERRY: trifoliate leaves, a runner, white flowers, fruit ── */
export function floraStrawberry(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0x57A2);
  const leaf = leafPal(pIn);
  const cx = S * 0.46, base = S * 0.80;
  shadow(c, cx, base + S * 0.04, S * 0.22);
  /* the RUNNER — the stolon that says strawberry */
  c.strokeStyle = leaf.dark; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(S * 0.72, base + S * 0.03, S * 0.86, base - S * 0.02); c.stroke();
  c.fillStyle = leaf.base; c.beginPath(); c.ellipse(S * 0.86, base - S * 0.02, S * 0.022, S * 0.014, 0, 0, TAU); c.fill();
  /* TRIFOLIATE leaves — three toothed leaflets per stalk */
  const trifoliate = (x: number, y: number, sc: number): void => {
    for (const a of [-Math.PI / 2 - 0.75, -Math.PI / 2, -Math.PI / 2 + 0.75]) {
      const L = S * 0.085 * sc;
      c.save(); c.translate(x, y); c.rotate(a);
      c.fillStyle = lit(c, leaf, L * 0.5, 0, L * 0.5);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(L * 0.42, -L * 0.42, L, -L * 0.05);
      c.quadraticCurveTo(L * 0.42, L * 0.42, 0, 0);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,34,16,0.35)'; c.lineWidth = 1.6;   /* the toothed edge */
      c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.9, -L * 0.04); c.stroke();
      for (let k = 1; k <= 4; k++) { const u = k / 5; c.beginPath(); c.moveTo(L * u, -L * 0.03); c.lineTo(L * (u + 0.1), -L * 0.24); c.stroke(); }
      c.restore();
    }
  };
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * S * 0.10, y = base - S * 0.02 - (i === 1 ? S * 0.03 : 0);
    c.strokeStyle = leaf.dark; c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx, base); c.lineTo(x, y - S * 0.07); c.stroke();
    trifoliate(x, y - S * 0.07, 1 - Math.abs(i - 1) * 0.15);
  }
  /* the white five-petal flowers */
  const fw = { base: '#f4f2ea', cr: 244, cg: 242, cb: 234, lit: '#ffffff', dark: '#c8c4b4' };
  for (const [fx, fy] of [[cx - S * 0.13, base - S * 0.15], [cx + S * 0.12, base - S * 0.19]] as const) {
    c.strokeStyle = leaf.dark; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, base); c.lineTo(fx, fy); c.stroke();
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU;
      c.fillStyle = fw.base;
      c.beginPath(); c.ellipse(fx + Math.cos(a) * S * 0.018, fy + Math.sin(a) * S * 0.018, S * 0.014, S * 0.011, a, 0, TAU); c.fill();
    }
    c.fillStyle = '#e8c93c'; c.beginPath(); c.arc(fx, fy, S * 0.010, 0, TAU); c.fill();
  }
  /* THE FRUIT — a red heart-shaped berry with seed pits */
  const berry = toward(pIn, 206, 40, 46, 0.75);
  const bx = cx + S * 0.02, by = base - S * 0.055, br = S * 0.045;
  c.fillStyle = lit(c, berry, bx, by, br);
  c.beginPath(); c.moveTo(bx, by + br);
  c.bezierCurveTo(bx - br * 1.3, by + br * 0.1, bx - br * 0.9, by - br * 0.9, bx, by - br * 0.45);
  c.bezierCurveTo(bx + br * 0.9, by - br * 0.9, bx + br * 1.3, by + br * 0.1, bx, by + br);
  c.closePath(); c.fill();
  c.fillStyle = 'rgba(250,240,190,0.85)';   /* the achene pits */
  for (let i = 0; i < 14; i++) { const a = r() * TAU, d = r() ** 0.6 * br * 0.8; c.beginPath(); c.ellipse(bx + Math.cos(a) * d, by + Math.sin(a) * d - br * 0.05, 1.8, 2.6, a, 0, TAU); c.fill(); }
  c.fillStyle = leaf.dark;   /* the calyx */
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.5; c.beginPath(); c.ellipse(bx + Math.cos(a) * br * 0.5, by - br * 0.55 + Math.sin(a) * br * 0.2, br * 0.32, br * 0.14, a, 0, TAU); c.fill(); }
}

/* ── KIWI FRUIT: a woody VINE with big leaves and fuzzy brown fruit ── */
export function floraKiwiFruit(c: Ctx, g: G, pIn: Pal): void {
  const r = seeded(g, 0x1234);
  const leaf = leafPal(pIn);
  const cx = S * 0.42, base = S * 0.88, top = S * 0.14;
  shadow(c, cx, base + 4, S * 0.14);
  /* the twining woody stem */
  c.strokeStyle = '#6a5236'; c.lineWidth = S * 0.014; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, base);
  for (let i = 1; i <= 16; i++) { const u = i / 16; c.lineTo(cx + Math.sin(u * 5.5) * S * 0.075, base - (base - top) * u); }
  c.stroke();
  /* big rounded heart-shaped leaves */
  for (let i = 0; i < 5; i++) {
    const u = 0.12 + i * 0.18;
    const x = cx + Math.sin(u * 5.5) * S * 0.075, y = base - (base - top) * u;
    const s = i % 2 ? 1 : -1, L = S * 0.11;
    c.fillStyle = lit(c, leaf, x + s * L * 0.5, y - L * 0.2, L * 0.6);
    c.save(); c.translate(x, y); c.rotate(s < 0 ? Math.PI + 0.4 : -0.4);
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(L * 0.3, -L * 0.62, L * 1.1, -L * 0.5, L, 0);
    c.bezierCurveTo(L * 1.1, L * 0.5, L * 0.3, L * 0.62, 0, 0);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,34,16,0.28)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(L * 0.92, 0); c.stroke();
    c.restore();
  }
  /* THE FRUIT — fuzzy brown ovals hanging in a pair */
  const skin = { base: '#8a6a44', cr: 138, cg: 106, cb: 68, lit: '#b08a5c', dark: '#4c3a24' };
  for (const [fx, fy, fr] of [[cx + S * 0.14, S * 0.52, S * 0.052], [cx + S * 0.05, S * 0.62, S * 0.045]] as const) {
    c.strokeStyle = '#6a5236'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(fx - S * 0.02, fy - fr * 1.5); c.lineTo(fx, fy - fr); c.stroke();
    c.fillStyle = lit(c, skin, fx, fy, fr);
    c.beginPath(); c.ellipse(fx, fy, fr * 0.78, fr, 0.1, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(210,180,140,0.55)'; c.lineWidth = 1;   /* THE FUZZ, breaking the outline */
    for (let i = 0; i < 46; i++) {
      const a = r() * TAU;
      const ex = fx + Math.cos(a) * fr * 0.78, ey = fy + Math.sin(a) * fr;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + Math.cos(a) * 5, ey + Math.sin(a) * 5); c.stroke();
    }
  }
}
