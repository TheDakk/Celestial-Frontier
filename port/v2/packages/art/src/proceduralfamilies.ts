/* proceduralfamilies.ts — WAVE 20: the structural families the Platinum audit
   found missing from the PROCEDURAL spread.

   The audit's verdict on both categories was the same sentence: "All 60 outputs
   remain variations of the same [cap-and-stem trio / bubble colony]." Wave 17
   had already made the wave-1 families reachable from a nameless genome, but
   two things were still wrong and this wave fixes both:

     1. TOO FEW FAMILIES. Six fungal and four microbial forms cannot carry 60
        organisms each. The audit names the ones it wants; they are here.
     2. A SKEWED SELECTOR. `form % 6` is not a uniform choice — the raw gene
        clumps, so half a sample came back puffballs and five microbes in six
        were the same amoeba in different colours. The picker now avalanches
        the seed before it chooses (the same murmur3 finish the degenerate-salt
        bug taught us to use), so the spread is actually flat. */
import { mulberry32, TAU } from '@cf/domain-rand';

type Ctx = CanvasRenderingContext2D;
type G = Record<string, unknown>;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;

function seeded(g: G, salt: number): () => number { return mulberry32((((g.seed as number) ^ salt) >>> 0)); }
function ground(c: Ctx, cx = S * 0.5, cy = S * 0.84, rx = S * 0.20): void {
  c.fillStyle = 'rgba(0,0,0,0.40)'; c.beginPath(); c.ellipse(cx, cy, rx, S * 0.026, 0, 0, TAU); c.fill();
}
function lump(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.34, y - r * 0.4, 2, x, y, r * 1.15);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.62, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function shade(p: Pal, m: number): string {
  return `rgb(${Math.min(255, p.cr * m | 0)},${Math.min(255, p.cg * m | 0)},${Math.min(255, p.cb * m | 0)})`;
}
/* a soft radial mark that reaches zero alpha — THE PATTERN LAW (D-ART-16) */
function softMark(c: Ctx, x: number, y: number, r: number, rgb: string, a: number): void {
  const gg = c.createRadialGradient(x, y, 0, x, y, r);
  gg.addColorStop(0, `rgba(${rgb},${a})`); gg.addColorStop(0.55, `rgba(${rgb},${a * 0.5})`);
  gg.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

/** How many structural families each of the two kingdoms offers a nameless
    genome. Exported so the spread test asserts against the REAL tables. */
export const FAMILY_COUNT: Readonly<Record<string, number>> = { fungi: 13, microbe: 13 };

/** Which family a nameless genome gets, as an index into its kingdom's table.
 *
 *  Lives here, and is exported, so the spread test can call THE SELECTOR THE
 *  RENDERER CALLS. A test that re-implements this hash would have agreed with
 *  the bug below and stayed green through it.
 *
 *  ⚠ Every step is unsigned. `h ^= h >>> 16` is an int32 XOR that comes back
 *  NEGATIVE whenever the high bit is set, and `-3 % 13` is -3, which indexes
 *  an array to `undefined`. The first cut shipped without the final `>>> 0`
 *  and 22 of 60 procedural fungi painted nothing at all. */
export function procFamilyIndex(g: G, kingdom: string): number {
  let h = (((g.seed as number) >>> 0) ^ ((((g.form as number) || 0) >>> 0) * 0x9E3779B1)) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h % (FAMILY_COUNT[kingdom] || 1);
}

/* ═══════════ FUNGI ═══════════ */

/** TOOTH (hydnoid): a cap whose underside hangs in soft downward spines. */
export function fungiTooth(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x7007);
  ground(c, S * 0.5, S * 0.86, S * 0.19);
  /* the wood it juts from — a rounded bough with bark, not a brown rectangle */
  c.strokeStyle = '#2a1d15'; c.lineWidth = S * 0.115; c.lineCap = 'round';
  c.beginPath(); c.moveTo(S * 0.08, S * 0.70);
  c.quadraticCurveTo(S * 0.5, S * 0.78, S * 0.92, S * 0.70); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,0.38)'; c.lineWidth = S * 0.042;
  c.beginPath(); c.moveTo(S * 0.10, S * 0.745);
  c.quadraticCurveTo(S * 0.5, S * 0.825, S * 0.90, S * 0.745); c.stroke();
  c.strokeStyle = 'rgba(96,74,54,0.40)'; c.lineWidth = 1.6; c.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const y = S * (0.665 + r() * 0.075);
    c.beginPath(); c.moveTo(S * (0.10 + r() * 0.3), y);
    c.lineTo(S * (0.42 + r() * 0.46), y + (r() - 0.5) * 8); c.stroke();
  }
  const heads = 1 + (r() < 0.45 ? 1 : 0);
  for (let k = 0; k < heads; k++) {
    const cx = S * (0.5 + (k - (heads - 1) / 2) * 0.30), cy = S * (0.44 + k * 0.05);
    const w = S * (0.19 - k * 0.03), h = S * 0.10;
    /* THE SPINES FIRST, behind the cap, so the cap's edge overlaps them and
       they read as hanging FROM it rather than sitting under it */
    for (let i = 0; i < 46; i++) {
      const u = (i / 45) * 2 - 1;
      const sx = cx + u * w * 0.93;
      const drop = h * (1.5 + Math.cos(u * 1.5) * 1.15) * (0.7 + r() * 0.55);
      const tw = 2.6 * Math.sqrt(Math.max(0.1, 1 - u * u * 0.7));
      const gg = c.createLinearGradient(sx, cy, sx, cy + drop);
      gg.addColorStop(0, p.dark); gg.addColorStop(0.45, p.base); gg.addColorStop(1, p.lit);
      c.strokeStyle = gg; c.lineWidth = tw; c.lineCap = 'round';
      c.beginPath(); c.moveTo(sx, cy + h * 0.2);
      c.quadraticCurveTo(sx + (r() - 0.5) * 5, cy + drop * 0.6, sx + (r() - 0.5) * 9, cy + drop);
      c.stroke();
    }
    /* the cap over them */
    c.fillStyle = lump(c, p, cx, cy - h * 0.3, w);
    c.beginPath(); c.moveTo(cx - w, cy + h * 0.28);
    c.bezierCurveTo(cx - w * 0.92, cy - h * 1.25, cx + w * 0.92, cy - h * 1.25, cx + w, cy + h * 0.28);
    c.quadraticCurveTo(cx, cy + h * 0.62, cx - w, cy + h * 0.28);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(232,240,255,0.30)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - w * 0.9, cy - h * 0.1);
    c.bezierCurveTo(cx - w * 0.7, cy - h * 1.05, cx + w * 0.2, cy - h * 1.15, cx + w * 0.72, cy - h * 0.5);
    c.stroke();
  }
}

/** JELLY (tremelloid): a wet translucent lobed mass welded to a branch. */
export function fungiJelly(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x1E11);
  /* the branch it grips */
  c.strokeStyle = '#33241a'; c.lineWidth = 26; c.lineCap = 'round';
  c.beginPath(); c.moveTo(S * 0.06, S * 0.36); c.quadraticCurveTo(S * 0.5, S * 0.50, S * 0.94, S * 0.40); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 10;
  c.beginPath(); c.moveTo(S * 0.06, S * 0.42); c.quadraticCurveTo(S * 0.5, S * 0.56, S * 0.94, S * 0.46); c.stroke();
  const cx = S * 0.5, cy = S * 0.50;
  /* the mass is built from OVERLAPPING soft lobes, not one blob — a jelly
     fungus is a folded brain, and folds are what make it read */
  const lobes = 7 + (r() * 4 | 0);
  const pts: Array<[number, number, number]> = [];
  for (let i = 0; i < lobes; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.55) * S * 0.15;
    pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.72, S * (0.055 + r() * 0.055)]);
  }
  /* A visible attachment keeps the mass from reading as a cloud floating below
     the branch: tremelloid folds grow FROM a wet, compressed grip. */
  const tether = c.createLinearGradient(cx, S * 0.48, cx, cy + S * 0.02);
  tether.addColorStop(0, p.dark); tether.addColorStop(0.58, p.base); tether.addColorStop(1, p.lit);
  c.strokeStyle = tether; c.lineWidth = 18; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx, S * 0.48); c.quadraticCurveTo(cx - S * 0.015, S * 0.54, cx, cy + S * 0.02); c.stroke();
  for (const [x, y, rad] of pts) {
    const gg = c.createRadialGradient(x - rad * 0.3, y - rad * 0.4, 2, x, y, rad * 1.1);
    gg.addColorStop(0, `rgba(${Math.min(255, p.cr + 70)},${Math.min(255, p.cg + 60)},${Math.min(255, p.cb + 50)},0.88)`);
    gg.addColorStop(0.6, `rgba(${p.cr},${p.cg},${p.cb},0.78)`);
    gg.addColorStop(1, `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.68)`);
    c.fillStyle = gg; c.beginPath(); c.ellipse(x, y, rad, rad * 0.86, r() * 0.6, 0, TAU); c.fill();
  }
  /* the wet highlight — jelly fungi are GLOSSY, and gloss is half the read */
  for (const [x, y, rad] of pts) {
    c.fillStyle = 'rgba(255,255,255,0.26)';
    c.beginPath(); c.ellipse(x - rad * 0.3, y - rad * 0.42, rad * 0.34, rad * 0.20, -0.5, 0, TAU); c.fill();
  }
  /* the seam where lobe meets lobe */
  c.strokeStyle = `rgba(${p.cr * 0.34 | 0},${p.cg * 0.34 | 0},${p.cb * 0.34 | 0},0.62)`; c.lineWidth = 2.2;
  for (const [x, y, rad] of pts) { c.beginPath(); c.ellipse(x, y, rad * 0.92, rad * 0.78, 0, 0.4, 2.6); c.stroke(); }
}

/** TRUFFLE: a warty hypogeous ball, half out of the soil, one cut open. */
export function fungiTruffle(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x7014);
  /* The soil it is buried in.
     ⚠ This was `fillRect(0, S*0.56, S, S*0.44)`. The gradient softened the TOP
     edge and nothing softened the SIDES, so once the fit pass scales the ink
     layer the soil ends in two hard vertical walls at the frame — the audit's
     "hard-edged brown rectangle with sharp vertical sides". A ground plane has
     no edges; it fades out in every direction it is not anchored in. */
  const sg = c.createRadialGradient(S * 0.5, S * 0.78, S * 0.06, S * 0.5, S * 0.78, S * 0.36);
  sg.addColorStop(0, 'rgba(26,19,13,0.98)'); sg.addColorStop(0.55, 'rgba(42,31,22,0.90)');
  sg.addColorStop(0.82, 'rgba(48,36,26,0.42)'); sg.addColorStop(1, 'rgba(48,36,26,0)');
  c.fillStyle = sg;
  c.beginPath(); c.ellipse(S * 0.5, S * 0.78, S * 0.36, S * 0.22, 0, 0, TAU); c.fill();
  /* ★ and the two balls were at FIXED positions and FIXED radii — part of the
     seven constant painters D-ART-143 records. Vary them as ratios. */
  const b0 = 0.36 + r() * 0.09, b1 = 0.62 + r() * 0.09;
  const balls: Array<[number, number, number]> = [
    [S * b0, S * (0.63 + r() * 0.04), S * (0.148 + r() * 0.036)],
    [S * b1, S * (0.69 + r() * 0.04), S * (0.112 + r() * 0.032)]];
  for (const [bx, by, rad] of balls) {
    c.fillStyle = lump(c, p, bx, by, rad);
    /* a truffle is LUMPY, never a sphere — walk the rim with noise */
    c.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * TAU;
      const q = rad * (0.90 + Math.sin(a * 4 + 1) * 0.05 + Math.sin(a * 7) * 0.045);
      const x = bx + Math.cos(a) * q, y = by + Math.sin(a) * q;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath(); c.fill();
    c.strokeStyle = shade(p, 0.38); c.lineWidth = 2.1; c.stroke();
    /* THE WARTS — a truffle's rind is a pavement of pyramidal scales */
    for (let i = 0; i < 90; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * rad * 0.94;
      const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d;
      const key = ((x - bx) / rad * -0.5 + (y - by) / rad * -0.86) * 0.5 + 0.5;   /* obey the light */
      const w = 4 + r() * 4;
      c.fillStyle = shade(p, 0.55 + key * 0.9);
      c.beginPath(); c.moveTo(x, y - w * 0.6); c.lineTo(x + w * 0.55, y + w * 0.4); c.lineTo(x - w * 0.55, y + w * 0.4);
      c.closePath(); c.fill();
      c.fillStyle = `rgba(0,0,0,${0.10 + (1 - key) * 0.16})`;
      c.beginPath(); c.moveTo(x, y - w * 0.6); c.lineTo(x + w * 0.55, y + w * 0.4); c.lineTo(x + w * 0.1, y + w * 0.4);
      c.closePath(); c.fill();
    }
  }
  /* THE CUT FACE on the small one — the marbled gleba is the identity */
  const [gx, gy, gr] = balls[1]!;
  c.save();
  c.beginPath(); c.ellipse(gx + gr * 0.28, gy - gr * 0.1, gr * 0.82, gr * 0.94, 0.4, 0, TAU); c.clip();
  /* ⚠ THIS WAS INVERTED. It filled the face BRIGHT (`shade(p, 1.55)`) and then
     ruled sixteen evenly-spaced dark beziers across it — "a striped golf ball".
     Real gleba is the other way round and is not ruled: DARK flesh laced with
     pale veins that BRANCH. Fill dark, then grow a few trunks and hang short
     branches off them at angles. */
  c.fillStyle = shade(p, 0.78); c.fillRect(gx - gr, gy - gr * 1.2, gr * 2.4, gr * 2.4);
  c.lineCap = 'round';
  const vein = (x0: number, y0: number, ang: number, len: number, w: number, depth: number): void => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    const mx = (x0 + x1) / 2 + Math.cos(ang + 1.57) * len * (r() - 0.5) * 0.5;
    const my = (y0 + y1) / 2 + Math.sin(ang + 1.57) * len * (r() - 0.5) * 0.5;
    c.strokeStyle = `rgba(236,232,220,${0.30 + depth * 0.16})`;
    c.lineWidth = w;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
    if (depth > 0 && w > 0.6) {
      const n = 1 + (r() < 0.55 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        vein(mx, my, ang + (r() - 0.5) * 1.7, len * (0.42 + r() * 0.26), w * 0.62, depth - 1);
      }
    }
  };
  for (let i = 0; i < 6; i++) {
    const a0 = r() * TAU;
    vein(gx + gr * 0.28 + Math.cos(a0) * gr * 0.8, gy - gr * 0.1 + Math.sin(a0) * gr * 0.9,
      a0 + Math.PI + (r() - 0.5) * 0.9, gr * (0.7 + r() * 0.5), 2.0, 2);
  }
  c.restore();
  c.strokeStyle = 'rgba(240,240,230,0.35)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(gx + gr * 0.28, gy - gr * 0.1, gr * 0.82, gr * 0.94, 0.4, 0, TAU); c.stroke();
}

/** CUP (pezizoid): a stalkless bowl, its inner face turned to the viewer. */
export function fungiCup(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xC0FE);
  ground(c, S * 0.5, S * 0.82, S * 0.20);
  /* ★ D-ART-143 — the cup ARRANGEMENT varies: 1-3 cups, positions and sizes
     as seeded RATIOS (never canvas scale, D-ART-34), so two genomes cannot
     draw the same picture. */
  const nC = 1 + (r() < 0.7 ? 1 : 0) + (r() < 0.35 ? 1 : 0);
  const cups: Array<[number, number, number]> = [];
  for (let ci = 0; ci < nC; ci++) {
    cups.push([S * (0.32 + r() * 0.36), S * (0.50 + r() * 0.22), S * (0.085 + r() * 0.10)]);
  }
  for (const [cx, cy, rad] of cups) {
    /* the outer wall, seen below the rim */
    c.fillStyle = shade(p, 0.62);
    c.beginPath(); c.ellipse(cx, cy + rad * 0.28, rad * 0.96, rad * 0.72, 0, 0, Math.PI); c.fill();
    /* THE BOWL: the inner face is LIT FROM ABOVE and darkest at its floor —
       that gradient is the whole illusion of depth */
    const gg = c.createRadialGradient(cx, cy - rad * 0.5, rad * 0.1, cx, cy + rad * 0.15, rad * 1.15);
    gg.addColorStop(0, shade(p, 0.34)); gg.addColorStop(0.5, p.base); gg.addColorStop(1, p.lit);
    c.fillStyle = gg;
    c.beginPath(); c.ellipse(cx, cy, rad, rad * 0.62, 0, 0, TAU); c.fill();
    /* the wavy rim a cup fungus always has */
    c.strokeStyle = shade(p, 1.35); c.lineWidth = 3.4;
    c.beginPath();
    for (let i = 0; i <= 60; i++) {
      const a = (i / 60) * TAU;
      const q = 1 + Math.sin(a * 5 + 0.6) * 0.045;
      const x = cx + Math.cos(a) * rad * q, y = cy + Math.sin(a) * rad * 0.62 * q;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.closePath(); c.stroke();
    /* fine hairs on the outside — many cup fungi are shaggy */
    c.strokeStyle = `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.55)`; c.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) {
      const a = Math.PI * (0.05 + r() * 0.9);
      const x = cx + Math.cos(a) * rad * 0.95, y = cy + rad * 0.28 + Math.sin(a) * rad * 0.70;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); c.stroke();
    }
  }
}

/** A cup cluster with a visible mycelial holdfast.  This is a distinct
 *  procedural anatomy from the ordinary stalkless cup: the low body is kept
 *  clear of the field by a lit outer wall, short supports, and a companion
 *  fruiting cup. */
export function fungiCupAnchored(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xC0A7);
  const base = S * 0.79;
  ground(c, S * 0.50, S * 0.84, S * 0.25);
  /* A decomposing twig gives the cups a real substrate without turning their
     stalkless bowls into generic cap-and-stem mushrooms. */
  c.strokeStyle = '#332419'; c.lineWidth = S * 0.052; c.lineCap = 'round';
  c.beginPath(); c.moveTo(S * 0.19, base); c.quadraticCurveTo(S * 0.49, base - S * 0.052, S * 0.80, base + S * 0.010); c.stroke();
  c.strokeStyle = 'rgba(154,111,69,0.40)'; c.lineWidth = S * 0.010;
  c.beginPath(); c.moveTo(S * 0.22, base - S * 0.010); c.quadraticCurveTo(S * 0.49, base - S * 0.052, S * 0.77, base); c.stroke();

  const drawCup = (cx: number, cy: number, rad: number, lean: number): void => {
    /* A short root-like attachment plus a pale lower wall fixes the former
       floating dark bowl read while retaining the pezizoid opening. */
    c.strokeStyle = shade(p, 0.55); c.lineWidth = rad * 0.52; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx, cy + rad * 0.42); c.quadraticCurveTo(cx + lean * rad * 0.22, cy + rad * 0.76, cx + lean * rad * 0.36, base - S * 0.012); c.stroke();
    c.strokeStyle = shade(p, 1.16); c.lineWidth = Math.max(2, rad * 0.10);
    c.beginPath(); c.moveTo(cx - rad * 0.08, cy + rad * 0.42); c.quadraticCurveTo(cx + lean * rad * 0.12, cy + rad * 0.73, cx + lean * rad * 0.28, base - S * 0.015); c.stroke();

    const outer = c.createLinearGradient(cx - rad, cy, cx + rad, cy + rad * 0.9);
    outer.addColorStop(0, shade(p, 0.44)); outer.addColorStop(0.48, p.base); outer.addColorStop(1, p.lit);
    c.fillStyle = outer;
    c.beginPath();
    c.moveTo(cx - rad * 0.93, cy + rad * 0.03);
    c.quadraticCurveTo(cx - rad * 0.72, cy + rad * 1.02, cx, cy + rad * 1.10);
    c.quadraticCurveTo(cx + rad * 0.72, cy + rad * 1.02, cx + rad * 0.93, cy + rad * 0.03);
    c.closePath(); c.fill();
    c.strokeStyle = shade(p, 0.34); c.lineWidth = 2.4; c.stroke();

    const bowl = c.createRadialGradient(cx - rad * 0.26, cy - rad * 0.32, 2, cx, cy, rad * 1.10);
    bowl.addColorStop(0, shade(p, 0.28)); bowl.addColorStop(0.50, shade(p, 0.66)); bowl.addColorStop(0.82, p.base); bowl.addColorStop(1, p.lit);
    c.fillStyle = bowl; c.beginPath(); c.ellipse(cx, cy, rad, rad * 0.58, lean * 0.10, 0, TAU); c.fill();
    c.strokeStyle = p.lit; c.lineWidth = Math.max(2.8, rad * 0.11);
    c.beginPath(); c.ellipse(cx, cy, rad, rad * 0.58, lean * 0.10, 0, TAU); c.stroke();
    c.strokeStyle = `rgba(${p.cr * 0.32 | 0},${p.cg * 0.32 | 0},${p.cb * 0.32 | 0},0.86)`; c.lineWidth = 1.8;
    c.beginPath(); c.ellipse(cx, cy + rad * 0.16, rad * 0.64, rad * 0.30, lean * 0.10, 0, TAU); c.stroke();
  };

  const mainX = S * (0.44 + r() * 0.06), mainY = S * (0.52 + r() * 0.035);
  drawCup(mainX, mainY, S * (0.125 + r() * 0.022), -0.45 + r() * 0.90);
  drawCup(mainX + S * (0.18 + r() * 0.06), mainY + S * (0.085 + r() * 0.035), S * (0.068 + r() * 0.018), -0.60 + r() * 1.20);
  /* A few raised substrate nodules make the attachment read as a colony rather
     than two unrelated bowls. */
  c.fillStyle = `rgba(${p.cr * 0.62 | 0},${p.cg * 0.62 | 0},${p.cb * 0.62 | 0},0.70)`;
  for (let i = 0; i < 5; i++) {
    const x = mainX - S * 0.11 + i * S * 0.055, y = base - S * (0.006 + r() * 0.020);
    c.beginPath(); c.ellipse(x, y, S * (0.016 + r() * 0.008), S * 0.010, r() * TAU, 0, TAU); c.fill();
  }
}

/** CLUB (clavarioid): unbranched fingers standing straight out of the litter. */
export function fungiClub(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xC1AB);
  ground(c, S * 0.5, S * 0.84, S * 0.20);
  const n = 6 + (r() * 6 | 0);
  const order: number[] = [];
  for (let i = 0; i < n; i++) order.push(i);
  for (const i of order) {
    const u = (i / (n - 1)) * 2 - 1;
    const bx = S * 0.5 + u * S * 0.19 + (r() - 0.5) * 10;
    const by = S * 0.83 - Math.abs(u) * S * 0.012;
    const H = S * (0.30 + r() * 0.24) * (1 - Math.abs(u) * 0.24);
    const w = S * (0.016 + r() * 0.014);
    const lean = (r() - 0.5) * 0.34 + u * 0.12;
    const tx = bx + Math.sin(lean) * H, ty = by - Math.cos(lean) * H;
    /* the club swells toward the tip and is rounded off — a clavaria is a
       finger, not a spike, so the top must be a dome */
    const gg = c.createLinearGradient(bx - w, 0, bx + w * 1.6, 0);
    gg.addColorStop(0, p.dark); gg.addColorStop(0.42, p.base); gg.addColorStop(1, p.lit);
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(bx - w * 0.62, by);
    c.bezierCurveTo(bx - w * 1.15, by - H * 0.55, tx - w * 1.25, ty + H * 0.16, tx, ty - w * 0.5);
    c.bezierCurveTo(tx + w * 1.25, ty + H * 0.16, bx + w * 1.15, by - H * 0.55, bx + w * 0.62, by);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.20)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(bx + w * 0.2, by - H * 0.08);
    c.quadraticCurveTo(bx + Math.sin(lean) * H * 0.55 + w * 0.3, by - H * 0.55, tx + w * 0.1, ty + w * 0.4);
    c.stroke();
  }
}

/* ═══════════ MICROBES ═══════════ */

/** RODS (bacilli): capsule cells scattered in the field, some dividing. */
export function microbeRods(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x0D0B);
  const n = 9 + (r() * 6 | 0);
  for (let i = 0; i < n; i++) {
    const cx = S * (0.16 + r() * 0.68), cy = S * (0.18 + r() * 0.64);
    const L = S * (0.055 + r() * 0.06), w = S * (0.019 + r() * 0.008);
    const a = r() * TAU;
    c.save(); c.translate(cx, cy); c.rotate(a);
    const gg = c.createLinearGradient(0, -w, 0, w);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.55, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    /* a capsule: two hemispherical caps on a straight wall */
    c.beginPath();
    c.moveTo(-L + w, -w); c.lineTo(L - w, -w);
    c.arc(L - w, 0, w, -Math.PI / 2, Math.PI / 2);
    c.lineTo(-L + w, w); c.arc(-L + w, 0, w, Math.PI / 2, -Math.PI / 2);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.30)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-L + w, -w * 0.55); c.lineTo(L - w, -w * 0.55); c.stroke();
    /* the septum of a cell caught mid-division */
    if (r() < 0.34) {
      c.strokeStyle = `rgba(${p.cr * 0.4 | 0},${p.cg * 0.4 | 0},${p.cb * 0.4 | 0},0.7)`; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, -w); c.lineTo(0, w); c.stroke();
    }
    c.restore();
  }
}

/** SPIRALS (spirilla / spirochetes): helical cells with polar flagella. */
export function microbeSpiral(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x5914);
  const n = 4 + (r() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const cx = S * (0.22 + r() * 0.56), cy = S * (0.22 + r() * 0.56);
    const turns = 2.2 + r() * 2.2, L = S * (0.14 + r() * 0.12), amp = S * (0.026 + r() * 0.02);
    const a = r() * TAU;
    c.save(); c.translate(cx, cy); c.rotate(a);
    const pts: Array<[number, number]> = [];
    for (let k = 0; k <= 90; k++) {
      const t = k / 90;
      pts.push([(t - 0.5) * L * 2, Math.sin(t * turns * TAU) * amp]);
    }
    /* the cell body, drawn as a tapering stroke so the helix has volume */
    for (let k = 0; k < pts.length - 1; k++) {
      const t = k / (pts.length - 1);
      const [x0, y0] = pts[k]!, [x1, y1] = pts[k + 1]!;
      c.lineWidth = S * 0.014 * (0.55 + Math.sin(t * Math.PI) * 0.75);
      c.strokeStyle = y0 < 0 ? p.lit : p.base;   /* the near half of each turn is lit */
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    /* the flagellum whipping off each pole */
    c.strokeStyle = `rgba(${Math.min(255, p.cr + 60)},${Math.min(255, p.cg + 60)},${Math.min(255, p.cb + 70)},0.45)`;
    c.lineWidth = 1.2;
    for (const e of [-1, 1] as const) {
      c.beginPath(); c.moveTo(e * L, 0);
      for (let k = 0; k <= 24; k++) { const t = k / 24; c.lineTo(e * (L + t * L * 0.6), Math.sin(t * 9) * 5 * t); }
      c.stroke();
    }
    c.restore();
  }
}

/** FILAMENT: a trichome — cells strung end to end in a long unbranched thread. */
export function microbeFilament(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xF17A);
  const n = 3 + (r() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const y0 = S * (0.20 + (i / n) * 0.60) + (r() - 0.5) * S * 0.05;
    const w = S * (0.020 + r() * 0.012);
    const wob = S * (0.03 + r() * 0.05), ph = r() * TAU;
    const at = (t: number): [number, number] => [S * 0.06 + t * S * 0.88, y0 + Math.sin(t * 3.4 + ph) * wob];
    /* THE SHEATH — a filament is a tube with cells INSIDE it, and the tube's
       continuous outline is what separates it from a chain of loose blobs */
    c.strokeStyle = `rgba(${Math.min(255, p.cr + 40)},${Math.min(255, p.cg + 40)},${Math.min(255, p.cb + 40)},0.22)`;
    c.lineWidth = w * 2.4; c.lineCap = 'round';
    c.beginPath();
    for (let k = 0; k <= 60; k++) { const [x, y] = at(k / 60); if (k === 0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
    /* THE THREAD ITSELF is one continuous smooth-sided tube. A filament drawn
       as separate beads is a CHAIN — a different family in this same table —
       so the cells are marked by cross-walls ON the tube, never by gaps in it. */
    const tg = c.createLinearGradient(0, y0 - w, 0, y0 + w);
    tg.addColorStop(0, p.lit); tg.addColorStop(0.42, p.base); tg.addColorStop(1, p.dark);
    c.strokeStyle = tg; c.lineWidth = w * 2; c.lineCap = 'round';
    c.beginPath();
    for (let k = 0; k <= 60; k++) { const [x, y] = at(k / 60); if (k === 0) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
    /* the CROSS-WALLS — short bars across the tube, foreshortened at nothing
       because they lie flat on it. They are what turn a rope into cells. */
    const cells = 22 + (r() * 12 | 0);
    for (let k = 1; k < cells; k++) {
      const t = k / cells;
      const [x, y] = at(t);
      const [x2, y2] = at(Math.min(1, t + 0.01));
      const a = Math.atan2(y2 - y, x2 - x);
      c.save(); c.translate(x, y); c.rotate(a);
      c.strokeStyle = `rgba(${p.cr * 0.42 | 0},${p.cg * 0.42 | 0},${p.cb * 0.42 | 0},0.50)`;
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(0, -w * 0.92); c.lineTo(0, w * 0.92); c.stroke();
      c.restore();
    }
    /* the specular running the length of the tube — one light, one highlight */
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = w * 0.5;
    c.beginPath();
    for (let k = 0; k <= 60; k++) { const [x, y] = at(k / 60); if (k === 0) c.moveTo(x, y - w * 0.5); else c.lineTo(x, y - w * 0.5); }
    c.stroke();
    /* the HETEROCYST — the one specialised swollen cell in a cyanobacterial
       trichome, and the detail that makes a filament read as alive */
    const ht = 0.25 + r() * 0.5;
    const [hx, hy] = at(ht);
    c.fillStyle = lump(c, p, hx, hy, w * 1.5);
    c.beginPath(); c.arc(hx, hy, w * 1.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.30)'; c.lineWidth = 1.4;
    c.beginPath(); c.arc(hx, hy, w * 1.5, -2.4, 0.2); c.stroke();
  }
}

/** CHAIN (streptococcus): cocci budding into strings and tetrads. */
export function microbeChain(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xC4A1);
  const strands = 3 + (r() * 2 | 0);
  for (let s = 0; s < strands; s++) {
    let x = S * (0.14 + r() * 0.34), y = S * (0.18 + r() * 0.58);
    let a = r() * TAU;
    const rad = S * (0.030 + r() * 0.016);
    const len = 5 + (r() * 7 | 0);
    for (let i = 0; i < len; i++) {
      c.fillStyle = lump(c, p, x, y, rad);
      c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
      /* the SEPTUM: adjacent cocci flatten where they touch, and that flat
         contact is what turns beads-on-a-string into a living chain */
      c.strokeStyle = `rgba(${p.cr * 0.42 | 0},${p.cg * 0.42 | 0},${p.cb * 0.42 | 0},0.55)`;
      c.lineWidth = 1.6;
      c.beginPath(); c.arc(x, y, rad * 0.97, a - 1.1, a + 1.1); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.24)'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(x, y, rad * 0.86, -2.5, -0.9); c.stroke();
      a += (r() - 0.5) * 0.62;
      x += Math.cos(a) * rad * 1.72; y += Math.sin(a) * rad * 1.72;
      if (x < S * 0.08 || x > S * 0.92 || y < S * 0.08 || y > S * 0.92) break;
    }
  }
}

/** FLAGELLATE: a teardrop cell driven by one long undulating flagellum. */
export function microbeFlagellate(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xF1A6);
  const n = 3 + (r() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const cx = S * (0.24 + r() * 0.52), cy = S * (0.24 + r() * 0.52);
    const L = S * (0.070 + r() * 0.045), w = L * (0.52 + r() * 0.14);
    const a = r() * TAU;
    c.save(); c.translate(cx, cy); c.rotate(a);
    /* the flagellum FIRST, behind the cell */
    c.strokeStyle = `rgba(${Math.min(255, p.cr + 70)},${Math.min(255, p.cg + 70)},${Math.min(255, p.cb + 80)},0.50)`;
    c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-L * 0.9, 0);
    for (let k = 0; k <= 40; k++) { const t = k / 40; c.lineTo(-L * 0.9 - t * L * 3.0, Math.sin(t * 11) * L * 0.30 * (0.3 + t)); }
    c.stroke();
    /* the teardrop body — blunt at the front, drawn to a point at the rear */
    const gg = c.createRadialGradient(L * 0.2, -w * 0.35, 2, 0, 0, L * 1.15);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.55, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(L, 0);
    c.bezierCurveTo(L * 0.7, -w, -L * 0.3, -w * 0.9, -L * 0.95, 0);
    c.bezierCurveTo(-L * 0.3, w * 0.9, L * 0.7, w, L, 0);
    c.closePath(); c.fill();
    /* the eyespot and the nucleus — the two organelles that read at this size */
    c.fillStyle = 'rgba(220,72,48,0.85)';
    c.beginPath(); c.ellipse(L * 0.42, -w * 0.28, L * 0.10, L * 0.075, 0, 0, TAU); c.fill();
    softMark(c, -L * 0.2, w * 0.10, L * 0.42, '20,26,20', 0.30);
    c.strokeStyle = 'rgba(255,255,255,0.34)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(L * 0.72, -w * 0.44); c.quadraticCurveTo(0, -w * 0.92, -L * 0.6, -w * 0.34); c.stroke();
    c.restore();
  }
}

/** PLATES (coccolithophore): a sphere armoured in overlapping calcite discs. */
export function microbePlates(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xB1A7);
  const cx = S * 0.5, cy = S * 0.5, rad = S * (0.16 + r() * 0.08);   /* ★ D-ART-143 — seeded */
  /* the cell beneath the armour */
  c.fillStyle = lump(c, p, cx, cy, rad * 0.92);
  c.beginPath(); c.arc(cx, cy, rad * 0.92, 0, TAU); c.fill();
  /* THE COCCOLITHS: discs pinned to the sphere. Each is foreshortened by how
     far off centre it sits and rotated to lie flat on the surface — that is
     what stops them looking like stickers (THE SURFACE LAWS). */
  const N = 22 + (r() * 16 | 0);   /* ★ D-ART-143 — coccolith count varies */
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU * 3.6 + r() * 0.3;
    const d = Math.sqrt((i + 0.5) / N) * rad * 0.98;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const off = d / rad;
    const fore = Math.sqrt(Math.max(0.06, 1 - off * off));
    const tilt = Math.atan2(y - cy, x - cx) + Math.PI / 2;
    const pr = rad * (0.19 + r() * 0.09);
    const key = ((x - cx) / rad * -0.5 + (y - cy) / rad * -0.86) * 0.5 + 0.5;
    c.save(); c.translate(x, y); c.rotate(tilt);
    c.fillStyle = `rgba(${Math.min(255, 214 * 0.5 + p.cr * 0.5 | 0)},${Math.min(255, 220 * 0.5 + p.cg * 0.5 | 0)},${Math.min(255, 226 * 0.5 + p.cb * 0.5 | 0)},${0.55 + key * 0.35})`;
    c.beginPath(); c.ellipse(0, 0, pr, pr * fore, 0, 0, TAU); c.fill();
    c.strokeStyle = `rgba(255,255,255,${0.18 + key * 0.26})`; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(0, 0, pr, pr * fore, 0, 0, TAU); c.stroke();
    c.strokeStyle = `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.35)`; c.lineWidth = 1;
    c.beginPath(); c.ellipse(0, 0, pr * 0.45, pr * fore * 0.45, 0, 0, TAU); c.stroke();
    c.restore();
  }
  /* the shell's own shading, laid over the plates so they belong to one body */
  const sg = c.createRadialGradient(cx - rad * 0.35, cy - rad * 0.4, rad * 0.1, cx, cy, rad * 1.1);
  sg.addColorStop(0, 'rgba(255,255,255,0.22)'); sg.addColorStop(0.6, 'rgba(255,255,255,0)');
  sg.addColorStop(1, 'rgba(0,0,0,0.30)');
  c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, rad, 0, TAU); c.fill();
}

/** MAT (biofilm): a sheeted colony seen from above, layered and streaming. */
export function microbeMat(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x8AA7);
  /* the wetted patch the film has colonised. NOT a rectangle — a hard-edged
     box is the single loudest "painted on" tell in the whole library, so the
     substrate is a ragged organic field with a soft edge. */
  c.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * TAU;
    const q = 1 + Math.sin(a * 3 + 0.7) * 0.10 + Math.sin(a * 5.5 + 2.1) * 0.07 + Math.sin(a * 9) * 0.035;
    const x = S * 0.5 + Math.cos(a) * S * 0.42 * q, y = S * 0.5 + Math.sin(a) * S * 0.33 * q;
    if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.closePath();
  const bgg = c.createRadialGradient(S * 0.5, S * 0.48, S * 0.08, S * 0.5, S * 0.5, S * 0.46);
  bgg.addColorStop(0, 'rgba(30,35,42,0.62)'); bgg.addColorStop(0.7, 'rgba(26,30,36,0.45)');
  bgg.addColorStop(1, 'rgba(22,26,32,0)');
  c.fillStyle = bgg; c.fill();
  /* Keep the soft film subordinate to its cells.  The prior three wide glow
     layers became the whole silhouette, so a biofilm read as a light cloud. */
  for (let layer = 0; layer < 2; layer++) {
    const m = 0.72 + layer * 0.18;
    for (let i = 0; i < 16; i++) {
      const x = S * (0.14 + r() * 0.72), y = S * (0.24 + r() * 0.52);
      softMark(c, x, y, S * (0.035 + r() * 0.045), `${p.cr * m | 0},${p.cg * m | 0},${p.cb * m | 0}`, 0.05 + layer * 0.035);
    }
  }
  /* Raised microcolonies give the sheet an edge, a hierarchy, and discrete
     bodies before the fine cell texture arrives. */
  for (let i = 0; i < 18; i++) {
    const x = S * (0.16 + r() * 0.68), y = S * (0.27 + r() * 0.46);
    const dx = (x - S * 0.5) / (S * 0.38), dy = (y - S * 0.5) / (S * 0.28);
    if (dx * dx + dy * dy > 1) continue;
    const rx = S * (0.018 + r() * 0.020), ry = rx * (0.58 + r() * 0.30);
    const gg = c.createRadialGradient(x - rx * 0.34, y - ry * 0.44, 2, x, y, rx * 1.25);
    gg.addColorStop(0, p.lit); gg.addColorStop(0.58, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg; c.beginPath(); c.ellipse(x, y, rx, ry, r() * TAU, 0, TAU); c.fill();
    c.strokeStyle = `rgba(${p.cr * 0.34 | 0},${p.cg * 0.34 | 0},${p.cb * 0.34 | 0},0.72)`;
    c.lineWidth = 1.5; c.stroke();
  }
  /* the individual cells packed inside it, dense at the centre */
  for (let i = 0; i < 230; i++) {
    const x = S * (0.10 + r() * 0.80), y = S * (0.20 + r() * 0.60);
    const dx = (x - S * 0.5) / (S * 0.42), dy = (y - S * 0.5) / (S * 0.34);
    if (dx * dx + dy * dy > 1) continue;
    const a = r() * TAU;
    c.strokeStyle = shade(p, 1.08 + r() * 0.36);
    c.globalAlpha = 0.46 + r() * 0.34; c.lineWidth = 2.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); c.stroke();
  }
  c.globalAlpha = 1;
  /* the streamers a biofilm trails downstream */
  c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.28)`; c.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const y0 = S * (0.24 + r() * 0.5);
    c.beginPath(); c.moveTo(S * 0.86, y0);
    c.quadraticCurveTo(S * 0.94, y0 + (r() - 0.5) * 40, S * 0.99, y0 + (r() - 0.5) * 60); c.stroke();
  }
  /* gas bubbles trapped under the film */
  for (let i = 0; i < 14; i++) {
    const x = S * (0.16 + r() * 0.68), y = S * (0.24 + r() * 0.52), q = 3 + r() * 7;
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.arc(x, y, q, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.24)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, q, -2.5, -0.6); c.stroke();
  }
}

/* A bounded r2 alternative for the handful of biofilm outputs whose fine cells
   still read as a diffuse cloud.  The three seeded layouts use a single visible
   colony plan: membranes are linked, cells repeat a shared anatomy, and the
   faint envelope contains the colony instead of becoming its silhouette. */
export function microbeStructuredColony(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xCE11);
  const form = ((g.form as number) || 0) % 3;
  const shell = (cx: number, cy: number, rx: number, ry: number): void => {
    const halo = c.createRadialGradient(cx - rx * 0.28, cy - ry * 0.34, 2, cx, cy, Math.max(rx, ry) * 1.12);
    halo.addColorStop(0, `rgba(${p.cr},${p.cg},${p.cb},0.22)`);
    halo.addColorStop(0.68, `rgba(${p.cr},${p.cg},${p.cb},0.10)`);
    halo.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0)`);
    c.fillStyle = halo; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.fill();
    c.strokeStyle = `rgba(${p.cr * 0.52 | 0},${p.cg * 0.52 | 0},${p.cb * 0.52 | 0},0.72)`; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(cx, cy, rx * 0.93, ry * 0.90, 0, 0, TAU); c.stroke();
  };
  const link = (x0: number, y0: number, x1: number, y1: number): void => {
    c.strokeStyle = `rgba(${p.cr * 0.34 | 0},${p.cg * 0.34 | 0},${p.cb * 0.34 | 0},0.85)`; c.lineWidth = S * 0.020; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) * 0.5, (y0 + y1) * 0.5 - S * 0.018, x1, y1); c.stroke();
    c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.68)`; c.lineWidth = S * 0.006;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) * 0.5, (y0 + y1) * 0.5 - S * 0.018, x1, y1); c.stroke();
  };
  const cell = (cx: number, cy: number, rx: number, ry: number, a: number): void => {
    c.save(); c.translate(cx, cy); c.rotate(a);
    const body = c.createRadialGradient(-rx * 0.34, -ry * 0.42, 2, 0, 0, rx * 1.18);
    body.addColorStop(0, p.lit); body.addColorStop(0.54, p.base); body.addColorStop(1, p.dark);
    c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fill();
    c.strokeStyle = `rgba(${p.cr * 0.28 | 0},${p.cg * 0.28 | 0},${p.cb * 0.28 | 0},0.92)`; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.48)'; c.lineWidth = 1.25;
    c.beginPath(); c.moveTo(-rx * 0.45, -ry * 0.36); c.quadraticCurveTo(0, -ry * 0.60, rx * 0.42, -ry * 0.24); c.stroke();
    c.strokeStyle = `rgba(${p.cr * 0.30 | 0},${p.cg * 0.30 | 0},${p.cb * 0.30 | 0},0.82)`; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, -ry * 0.76); c.lineTo(0, ry * 0.76); c.stroke();
    c.restore();
  };

  if (form === 0) {
    /* A sinuous chain is a repeated cell plan with an obvious attachment axis. */
    const cells: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) {
      const t = i / 9, x = S * (0.16 + t * 0.68), y = S * (0.50 + Math.sin(t * TAU * 1.18 + r() * 0.24) * 0.12);
      cells.push([x, y]);
    }
    shell(S * 0.50, S * 0.50, S * 0.39, S * 0.20);
    for (let i = 1; i < cells.length; i++) link(cells[i - 1]![0], cells[i - 1]![1], cells[i]![0], cells[i]![1]);
    for (let i = 0; i < cells.length; i++) cell(cells[i]![0], cells[i]![1], S * (0.034 + (i % 3) * 0.003), S * (0.022 + (i % 2) * 0.003), (i % 2 ? 0.52 : -0.34) + r() * 0.18);
    return;
  }

  if (form === 1) {
    /* A radial holdfast makes the shared centre and its repeated outer cells
       explicit, rather than scattering unrelated marks through a haze. */
    const cx = S * 0.50, cy = S * 0.50, ring = S * 0.145;
    shell(cx, cy, S * 0.245, S * 0.215);
    const petals: Array<[number, number, number]> = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + r() * 0.12;
      const x = cx + Math.cos(a) * ring, y = cy + Math.sin(a) * ring * 0.76;
      petals.push([x, y, a]);
    }
    for (const [x, y] of petals) link(cx, cy, x, y);
    cell(cx, cy, S * 0.050, S * 0.034, -0.28);
    for (let i = 0; i < petals.length; i++) {
      const [x, y, a] = petals[i]!;
      cell(x, y, S * (0.031 + (i % 2) * 0.003), S * 0.021, a + Math.PI / 2);
    }
    return;
  }

  /* Three linked microcolonies: each one repeats the same cell body, while the
     bridges make their larger organism-level structure visible. */
  const groups: Array<[number, number, number]> = [
    [S * 0.33, S * 0.42, 0.84], [S * 0.64, S * 0.46, 1.20], [S * 0.48, S * 0.67, 0.48],
  ];
  link(groups[0]![0], groups[0]![1], groups[1]![0], groups[1]![1]);
  link(groups[0]![0], groups[0]![1], groups[2]![0], groups[2]![1]);
  link(groups[1]![0], groups[1]![1], groups[2]![0], groups[2]![1]);
  for (const [cx, cy, turn] of groups) {
    shell(cx, cy, S * 0.135, S * 0.105);
    for (let i = 0; i < 6; i++) {
      const a = turn + (i / 6) * TAU;
      cell(cx + Math.cos(a) * S * 0.062, cy + Math.sin(a) * S * 0.047,
        S * 0.027, S * 0.018, a + Math.PI / 2);
    }
    cell(cx, cy, S * 0.033, S * 0.022, turn);
  }
}

/** ENOKI: a dense sheaf of very long thin stems with tiny caps — the audit's
    "current broad caps/stems are too generic". The STEM RATIO is the species. */
export function fungiEnoki(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xE110);
  ground(c, S * 0.5, S * 0.90, S * 0.13);
  /* the clump they all rise from */
  c.fillStyle = 'rgba(46,38,28,0.9)';
  c.beginPath(); c.ellipse(S * 0.5, S * 0.88, S * 0.11, S * 0.035, 0, 0, TAU); c.fill();
  const n = 22 + (r() * 10 | 0);
  const stems: Array<[number, number, number, number]> = [];
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const bx = S * 0.5 + u * S * 0.075 + (r() - 0.5) * 8;
    const H = S * (0.50 + r() * 0.26) * (1 - Math.abs(u) * 0.22);
    const lean = u * 0.30 + (r() - 0.5) * 0.16;
    stems.push([bx, H, lean, r()]);
  }
  stems.sort((a, b) => a[3] - b[3]);
  for (const [bx, H, lean, q] of stems) {
    const tx = bx + Math.sin(lean) * H, ty = S * 0.88 - Math.cos(lean) * H;
    const w = S * (0.0075 + q * 0.004);
    const gg = c.createLinearGradient(bx - w * 2, 0, bx + w * 2, 0);
    gg.addColorStop(0, p.dark); gg.addColorStop(0.42, p.lit); gg.addColorStop(1, p.base);
    c.strokeStyle = gg; c.lineWidth = w * 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx, S * 0.88);
    c.quadraticCurveTo(bx + Math.sin(lean) * H * 0.4, S * 0.88 - H * 0.55, tx, ty);
    c.stroke();
    /* the dark velvety base an enoki's stipe always has */
    c.strokeStyle = `rgba(${p.cr * 0.32 | 0},${p.cg * 0.30 | 0},${p.cb * 0.26 | 0},0.75)`;
    c.lineWidth = w * 2.1;
    c.beginPath(); c.moveTo(bx, S * 0.88); c.lineTo(bx + Math.sin(lean) * H * 0.12, S * 0.88 - H * 0.12); c.stroke();
    /* THE CAP — tiny, barely wider than the stem it caps */
    const cw = w * (2.4 + q * 1.5);
    c.fillStyle = lump(c, p, tx, ty, cw);
    c.beginPath();
    c.moveTo(tx - cw, ty + cw * 0.20);
    c.quadraticCurveTo(tx - cw * 0.9, ty - cw * 1.15, tx, ty - cw * 1.10);
    c.quadraticCurveTo(tx + cw * 0.9, ty - cw * 1.15, tx + cw, ty + cw * 0.20);
    c.quadraticCurveTo(tx, ty + cw * 0.50, tx - cw, ty + cw * 0.20);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.24)'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(tx - cw * 0.8, ty - cw * 0.2);
    c.quadraticCurveTo(tx - cw * 0.2, ty - cw * 1.05, tx + cw * 0.6, ty - cw * 0.5); c.stroke();
  }
}

/* ═══════════════════ OWNED ALIEN FLORA + RADIAL FAUNA ═══════════════════
   The legacy fallback represented several alien growth plans as isolated
   discs, trays, or soft clouds. These painters preserve the alien plan while
   giving it one connected substrate, real attachment anatomy, form light, and
   a silhouette that survives the actual 132px Compendium thumbnail. */
export type ProceduralFloraArchitecture =
  | 'fungalForest' | 'lichenMat' | 'crystal' | 'sporeTowers' | 'balloonPods' | 'glassNeedles'
  | 'cane' | 'rosette' | 'tree';

export function proceduralAlienFlora(
  c: Ctx, g: G, p: Pal, architecture: ProceduralFloraArchitecture,
): void {
  const r = seeded(g, 0xA11E), cx = S * 0.5, base = S * 0.84;
  ground(c, cx, base + S * 0.035, S * 0.28);

  if (architecture === 'lichenMat') {
    const mat = c.createRadialGradient(cx - S * 0.08, base - S * 0.08, 2, cx, base - S * 0.07, S * 0.30);
    mat.addColorStop(0, p.lit); mat.addColorStop(0.54, p.base); mat.addColorStop(1, p.dark);
    c.fillStyle = mat; c.beginPath(); c.ellipse(cx, base - S * 0.06, S * 0.29, S * 0.105, 0, 0, TAU); c.fill();
    c.strokeStyle = shade(p, 0.42); c.lineWidth = 3.2; c.stroke();
    for (let i = 0; i < 34; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * S * 0.245, x = cx + Math.cos(a) * d, y = base - S * 0.075 + Math.sin(a) * d * 0.28;
      const q = S * (0.026 + r() * 0.034), turn = a + (r() - 0.5) * 0.7;
      const lobe = c.createRadialGradient(x - q * 0.3, y - q * 0.35, 1, x, y, q);
      lobe.addColorStop(0, p.lit); lobe.addColorStop(0.62, p.base); lobe.addColorStop(1, p.dark);
      c.fillStyle = lobe; c.save(); c.translate(x, y); c.rotate(turn); c.beginPath(); c.ellipse(0, 0, q * 1.55, q * 0.58, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(245,250,235,0.24)'; c.lineWidth = 1.4; c.stroke(); c.restore();
    }
    c.strokeStyle = 'rgba(245,250,235,0.42)'; c.lineWidth = 1.5; c.lineCap = 'round';
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + r() * 0.12, d = S * (0.09 + r() * 0.15); c.beginPath(); c.moveTo(cx, base - S * 0.07); c.quadraticCurveTo(cx + Math.cos(a + 0.24) * d * 0.55, base - S * 0.08 + Math.sin(a) * d * 0.10, cx + Math.cos(a) * d, base - S * 0.07 + Math.sin(a) * d * 0.22); c.stroke(); }
    return;
  }

  if (architecture === 'fungalForest') {
    c.fillStyle = shade(p, 0.38); c.beginPath(); c.ellipse(cx, base, S * 0.24, S * 0.055, 0, 0, TAU); c.fill();
    const trunks = [[-0.16, 0.48, 0.16], [0.02, 0.61, 0.21], [0.19, 0.43, 0.145]] as const;
    for (const [u, h, w] of trunks) {
      const bx = cx + S * u, top = base - S * h, sw = S * w * 0.34;
      const stem = c.createLinearGradient(bx - sw, 0, bx + sw, 0); stem.addColorStop(0, p.dark); stem.addColorStop(0.44, p.lit); stem.addColorStop(1, p.base);
      c.strokeStyle = shade(p, 0.34); c.lineWidth = sw * 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, base); c.quadraticCurveTo(bx - S * u * 0.22, top + S * 0.18, bx + S * u * 0.10, top + S * 0.04); c.stroke();
      c.strokeStyle = stem; c.lineWidth = sw * 1.75; c.stroke();
      const capW = S * w * 1.45, capH = capW * 0.44, tx = bx + S * u * 0.10, ty = top;
      const cap = c.createRadialGradient(tx - capW * 0.25, ty - capH * 0.45, 2, tx, ty, capW); cap.addColorStop(0, p.lit); cap.addColorStop(0.58, p.base); cap.addColorStop(1, p.dark);
      c.fillStyle = cap; c.beginPath(); c.moveTo(tx - capW, ty + capH * 0.18);
      c.quadraticCurveTo(tx - capW * 0.72, ty - capH * 1.20, tx, ty - capH);
      c.quadraticCurveTo(tx + capW * 0.72, ty - capH * 1.20, tx + capW, ty + capH * 0.18);
      c.quadraticCurveTo(tx + capW * 0.56, ty + capH * 0.48, tx + capW * 0.22, ty + capH * 0.28);
      c.quadraticCurveTo(tx, ty + capH * 0.55, tx - capW * 0.22, ty + capH * 0.28);
      c.quadraticCurveTo(tx - capW * 0.56, ty + capH * 0.48, tx - capW, ty + capH * 0.18); c.closePath(); c.fill();
      c.strokeStyle = shade(p, 0.42); c.lineWidth = 2.6; c.stroke();
      c.strokeStyle = 'rgba(245,248,235,0.50)'; c.lineWidth = 1.6;
      for (let k = -5; k <= 5; k++) { c.beginPath(); c.moveTo(tx, ty + capH * 0.17); c.lineTo(tx + k * capW * 0.16, ty + capH * (0.28 + Math.abs(k) * 0.025)); c.stroke(); }
    }
    return;
  }

  if (architecture === 'sporeTowers') {
    c.fillStyle = shade(p, 0.40); c.beginPath(); c.ellipse(cx, base, S * 0.27, S * 0.065, 0, 0, TAU); c.fill();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1) - 0.5), bx = cx + u * S * 0.42, h = S * (0.28 + (1 - Math.abs(u)) * 0.25 + r() * 0.055), top = base - h;
      c.strokeStyle = shade(p, 0.38); c.lineWidth = 17; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, base); c.quadraticCurveTo(bx + u * S * 0.06, base - h * 0.55, bx - u * S * 0.03, top); c.stroke();
      const stem = c.createLinearGradient(bx - 7, 0, bx + 7, 0); stem.addColorStop(0, p.dark); stem.addColorStop(0.45, p.lit); stem.addColorStop(1, p.base);
      c.strokeStyle = stem; c.lineWidth = 11; c.stroke();
      c.strokeStyle = 'rgba(245,250,235,0.36)'; c.lineWidth = 2;
      for (let k = 1; k < 5; k++) { const y = base - h * k / 6; c.beginPath(); c.moveTo(bx - 6, y); c.lineTo(bx + 6, y - u * 3); c.stroke(); }
      const q = S * (0.035 + r() * 0.015), bulb = c.createRadialGradient(bx - q * 0.32, top - q * 0.34, 1, bx, top, q); bulb.addColorStop(0, p.lit); bulb.addColorStop(0.58, p.base); bulb.addColorStop(1, p.dark);
      c.fillStyle = bulb; c.beginPath(); c.ellipse(bx - u * S * 0.03, top, q * 1.15, q * 1.42, -u * 0.24, 0, TAU); c.fill(); c.strokeStyle = shade(p, 0.38); c.lineWidth = 2.2; c.stroke();
    }
    return;
  }

  if (architecture === 'balloonPods') {
    c.strokeStyle = shade(p, 0.36); c.lineWidth = 15; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - S * 0.26, base); c.bezierCurveTo(cx - S * 0.22, base - S * 0.24, cx + S * 0.17, base - S * 0.38, cx + S * 0.24, base - S * 0.62); c.stroke();
    c.strokeStyle = p.base; c.lineWidth = 9; c.stroke();
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.65) / 7.8, x = cx - S * 0.26 + t * S * 0.50 + Math.sin(t * Math.PI) * S * 0.055, y = base - t * S * 0.62 - Math.sin(t * Math.PI) * S * 0.08;
      const side = i % 2 ? 1 : -1, px = x + side * S * (0.07 + r() * 0.025), py = y - S * 0.015, q = S * (0.050 + r() * 0.015);
      c.strokeStyle = p.base; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + px) * 0.5, py + S * 0.025, px, py); c.stroke();
      const pod = c.createRadialGradient(px - q * 0.33, py - q * 0.40, 2, px, py, q * 1.18); pod.addColorStop(0, p.lit); pod.addColorStop(0.52, p.base); pod.addColorStop(1, p.dark);
      c.fillStyle = pod; c.beginPath(); c.ellipse(px, py, q * 0.92, q * 1.32, side * 0.28, 0, TAU); c.fill(); c.strokeStyle = shade(p, 0.35); c.lineWidth = 2.5; c.stroke();
      c.strokeStyle = 'rgba(250,252,239,0.50)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(px, py - q * 1.08); c.quadraticCurveTo(px + side * q * 0.16, py, px, py + q * 1.08); c.stroke();
    }
    return;
  }

  if (architecture === 'cane') {
    c.fillStyle = shade(p, 0.36); c.beginPath(); c.ellipse(cx, base, S * 0.25, S * 0.055, 0, 0, TAU); c.fill();
    for (let i = 0; i < 7; i++) {
      const u = i / 6 - 0.5, bx = cx + u * S * 0.36, h = S * (0.36 + (1 - Math.abs(u)) * 0.24 + r() * 0.05), lean = u * S * 0.05;
      c.strokeStyle = shade(p, 0.35); c.lineWidth = 13; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, base); c.quadraticCurveTo(bx - lean * 0.30, base - h * 0.55, bx + lean, base - h); c.stroke();
      const stem = c.createLinearGradient(bx - 6, 0, bx + 6, 0); stem.addColorStop(0, p.dark); stem.addColorStop(0.45, p.lit); stem.addColorStop(1, p.base);
      c.strokeStyle = stem; c.lineWidth = 8; c.stroke();
      for (let k = 1; k <= 5; k++) {
        const t = k / 6, x = bx + lean * t, y = base - h * t, side = (k + i) % 2 ? 1 : -1;
        c.strokeStyle = 'rgba(245,250,235,0.50)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y); c.stroke();
        const tipX = x + side * S * (0.075 + r() * 0.025), tipY = y - S * (0.025 + r() * 0.025);
        c.fillStyle = k % 2 ? p.base : p.lit; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + tipX) * 0.5, tipY - S * 0.025, tipX, tipY); c.quadraticCurveTo((x + tipX) * 0.55, tipY + S * 0.020, x, y); c.closePath(); c.fill();
        c.strokeStyle = shade(p, 0.40); c.lineWidth = 1.6; c.stroke();
      }
    }
    return;
  }

  if (architecture === 'rosette') {
    const leaves: Array<[number, number, number]> = [];
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + r() * 0.04, len = S * (0.18 + r() * 0.09); leaves.push([a, len, r()]); }
    leaves.sort((a, b) => Math.sin(a[0]) - Math.sin(b[0]));
    for (const [a, len, q] of leaves) {
      const x = cx + Math.cos(a) * len, y = base - S * 0.085 + Math.sin(a) * len * 0.40;
      const spread = 0.26 + q * 0.16;
      const leaf = c.createLinearGradient(cx, base, x, y); leaf.addColorStop(0, p.dark); leaf.addColorStop(0.48, p.base); leaf.addColorStop(1, p.lit);
      c.fillStyle = leaf; c.beginPath(); c.moveTo(cx, base - S * 0.075); c.quadraticCurveTo(cx + Math.cos(a + spread) * len * 0.55, base - S * 0.075 + Math.sin(a + spread) * len * 0.30, x, y); c.quadraticCurveTo(cx + Math.cos(a - spread) * len * 0.55, base - S * 0.075 + Math.sin(a - spread) * len * 0.30, cx, base - S * 0.075); c.closePath(); c.fill();
      c.strokeStyle = shade(p, 0.36); c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(250,252,240,0.38)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, base - S * 0.075); c.lineTo(x, y); c.stroke();
    }
    const heart = c.createRadialGradient(cx - S * 0.02, base - S * 0.11, 1, cx, base - S * 0.09, S * 0.055); heart.addColorStop(0, p.lit); heart.addColorStop(0.65, p.base); heart.addColorStop(1, p.dark);
    c.fillStyle = heart; c.beginPath(); c.arc(cx, base - S * 0.085, S * 0.052, 0, TAU); c.fill();
    return;
  }

  if (architecture === 'tree') {
    c.strokeStyle = shade(p, 0.29); c.lineWidth = 30; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, base); c.quadraticCurveTo(cx - S * 0.035, base - S * 0.36, cx, base - S * 0.58); c.stroke();
    c.strokeStyle = shade(p, 0.52); c.lineWidth = 18; c.stroke();
    const crowns: Array<[number, number, number]> = [[0, -0.58, 0.16], [-0.17, -0.49, 0.13], [0.17, -0.48, 0.13], [-0.10, -0.64, 0.12], [0.11, -0.66, 0.11]];
    for (const [u, v, q] of crowns) {
      const x = cx + S * u, y = base + S * v;
      c.strokeStyle = shade(p, 0.36); c.lineWidth = 8; c.beginPath(); c.moveTo(cx, base - S * 0.30); c.lineTo(x, y + S * q * 0.45); c.stroke();
      const crown = c.createRadialGradient(x - S * q * 0.35, y - S * q * 0.40, 2, x, y, S * q); crown.addColorStop(0, p.lit); crown.addColorStop(0.55, p.base); crown.addColorStop(1, p.dark);
      c.fillStyle = crown; c.beginPath(); c.arc(x, y, S * q, 0, TAU); c.fill(); c.strokeStyle = shade(p, 0.34); c.lineWidth = 2.4; c.stroke();
      c.fillStyle = 'rgba(248,252,235,0.28)'; for (let k = 0; k < 8; k++) { const a = r() * TAU, d = r() * S * q * 0.72; c.beginPath(); c.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, 4.2, 2.2, a, 0, TAU); c.fill(); }
    }
    return;
  }

  const glass = architecture === 'glassNeedles';
  c.fillStyle = shade(p, 0.34); c.beginPath(); c.moveTo(cx - S * 0.28, base); c.lineTo(cx - S * 0.18, base - S * 0.075); c.lineTo(cx + S * 0.20, base - S * 0.065); c.lineTo(cx + S * 0.29, base); c.closePath(); c.fill();
  const count = glass ? 17 : 8;
  const shards: Array<[number, number, number, number]> = [];
  for (let i = 0; i < count; i++) { const u = i / (count - 1) - 0.5, h = S * ((glass ? 0.24 : 0.30) + (1 - Math.abs(u) * 1.5) * (glass ? 0.30 : 0.34) + r() * 0.09); shards.push([cx + u * S * (glass ? 0.48 : 0.42), base - S * 0.035, h, (r() - 0.5) * (glass ? 0.24 : 0.12)]); }
  shards.sort((a, b) => a[2] - b[2]);
  for (const [bx, by, h, lean] of shards) {
    const w = S * (glass ? 0.018 + r() * 0.013 : 0.045 + r() * 0.022), tx = bx + lean * h, ty = by - h;
    const shard = c.createLinearGradient(bx - w, by, tx + w, ty); shard.addColorStop(0, shade(p, 0.48)); shard.addColorStop(0.38, p.base); shard.addColorStop(0.66, p.lit); shard.addColorStop(1, shade(p, 0.36));
    c.fillStyle = shard; c.beginPath(); c.moveTo(bx - w, by); c.lineTo(tx, ty); c.lineTo(bx + w, by); c.lineTo(bx, by + w * 0.55); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(230,246,255,0.58)'; c.lineWidth = glass ? 1.4 : 2.2; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.34)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by - w * 0.20); c.lineTo(tx, ty + h * 0.08); c.stroke();
  }
}

export function proceduralRadialFauna(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x8AD1A), cx = S * 0.50, cy = S * 0.52, core = S * 0.105;
  ground(c, cx, S * 0.82, S * 0.22);
  const arms = 10;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * TAU + r() * 0.035, len = S * (0.20 + r() * 0.045), w = S * (0.040 + r() * 0.010);
    c.save(); c.translate(cx, cy); c.rotate(a);
    const limb = c.createLinearGradient(core * 0.4, -w, len, w); limb.addColorStop(0, p.base); limb.addColorStop(0.62, p.lit); limb.addColorStop(1, p.dark);
    c.fillStyle = limb; c.beginPath(); c.moveTo(core * 0.45, -w);
    c.bezierCurveTo(len * 0.38, -w * 1.34, len * 0.68, w * 0.24, len - w * 0.22, -w * 0.12);
    c.quadraticCurveTo(len + w * 0.20, 0, len - w * 0.22, w * 0.12);
    c.bezierCurveTo(len * 0.67, w * 0.68, len * 0.40, w * 1.28, core * 0.45, w); c.closePath(); c.fill();
    c.strokeStyle = shade(p, 0.36); c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = 'rgba(248,252,245,0.34)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(core * 0.62, -w * 0.30); c.quadraticCurveTo(len * 0.55, -w * 0.18, len * 0.91, 0); c.stroke();
    for (let k = 1; k < 4; k++) { const x = core + (len - core) * k / 4; c.fillStyle = 'rgba(25,25,30,0.48)'; c.beginPath(); c.arc(x, 0, 2.4, 0, TAU); c.fill(); }
    c.restore();
  }
  const body = c.createRadialGradient(cx - core * 0.36, cy - core * 0.40, 2, cx, cy, core * 1.25); body.addColorStop(0, p.lit); body.addColorStop(0.55, p.base); body.addColorStop(1, p.dark);
  c.fillStyle = body; c.beginPath(); c.arc(cx, cy, core, 0, TAU); c.fill(); c.strokeStyle = shade(p, 0.34); c.lineWidth = 3; c.stroke();
  c.fillStyle = 'rgba(20,22,28,0.74)';
  for (let i = 0; i < arms; i++) { const a = (i / arms) * TAU, x = cx + Math.cos(a) * core * 0.55, y = cy + Math.sin(a) * core * 0.55; c.beginPath(); c.arc(x, y, 3.4, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(17,20,25,0.86)'; c.beginPath(); c.ellipse(cx, cy + core * 0.05, core * 0.24, core * 0.18, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(245,250,255,0.58)'; c.lineWidth = 2.2; c.stroke();
  c.fillStyle = 'rgba(245,250,255,0.62)'; c.beginPath(); c.arc(cx - core * 0.22, cy - core * 0.28, core * 0.13, 0, TAU); c.fill();
}
