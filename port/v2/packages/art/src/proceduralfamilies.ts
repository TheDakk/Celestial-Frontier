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
  c.beginPath(); c.moveTo(S * 0.06, S * 0.30); c.quadraticCurveTo(S * 0.5, S * 0.44, S * 0.94, S * 0.34); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 10;
  c.beginPath(); c.moveTo(S * 0.06, S * 0.36); c.quadraticCurveTo(S * 0.5, S * 0.50, S * 0.94, S * 0.40); c.stroke();
  const cx = S * 0.5, cy = S * 0.56;
  /* the mass is built from OVERLAPPING soft lobes, not one blob — a jelly
     fungus is a folded brain, and folds are what make it read */
  const lobes = 7 + (r() * 4 | 0);
  const pts: Array<[number, number, number]> = [];
  for (let i = 0; i < lobes; i++) {
    const a = r() * TAU, d = Math.pow(r(), 0.55) * S * 0.15;
    pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.72, S * (0.055 + r() * 0.055)]);
  }
  for (const [x, y, rad] of pts) {
    const gg = c.createRadialGradient(x - rad * 0.3, y - rad * 0.4, 2, x, y, rad * 1.1);
    gg.addColorStop(0, `rgba(${Math.min(255, p.cr + 70)},${Math.min(255, p.cg + 60)},${Math.min(255, p.cb + 50)},0.80)`);
    gg.addColorStop(0.6, `rgba(${p.cr},${p.cg},${p.cb},0.68)`);
    gg.addColorStop(1, `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.55)`);
    c.fillStyle = gg; c.beginPath(); c.ellipse(x, y, rad, rad * 0.86, r() * 0.6, 0, TAU); c.fill();
  }
  /* the wet highlight — jelly fungi are GLOSSY, and gloss is half the read */
  for (const [x, y, rad] of pts) {
    c.fillStyle = 'rgba(255,255,255,0.26)';
    c.beginPath(); c.ellipse(x - rad * 0.3, y - rad * 0.42, rad * 0.34, rad * 0.20, -0.5, 0, TAU); c.fill();
  }
  /* the seam where lobe meets lobe */
  c.strokeStyle = `rgba(${p.cr * 0.4 | 0},${p.cg * 0.4 | 0},${p.cb * 0.4 | 0},0.40)`; c.lineWidth = 1.6;
  for (const [x, y, rad] of pts) { c.beginPath(); c.ellipse(x, y, rad * 0.92, rad * 0.78, 0, 0.4, 2.6); c.stroke(); }
}

/** TRUFFLE: a warty hypogeous ball, half out of the soil, one cut open. */
export function fungiTruffle(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x7014);
  /* the soil it is buried in */
  const sg = c.createLinearGradient(0, S * 0.56, 0, S * 0.96);
  sg.addColorStop(0, 'rgba(48,36,26,0.0)'); sg.addColorStop(0.25, 'rgba(48,36,26,0.92)');
  sg.addColorStop(1, 'rgba(26,19,13,0.98)');
  c.fillStyle = sg; c.fillRect(0, S * 0.56, S, S * 0.44);
  const balls: Array<[number, number, number]> = [[S * 0.40, S * 0.66, S * 0.145], [S * 0.66, S * 0.72, S * 0.105]];
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
  c.beginPath(); c.ellipse(gx + gr * 0.28, gy - gr * 0.1, gr * 0.72, gr * 0.86, 0.4, 0, TAU); c.clip();
  c.fillStyle = shade(p, 1.55); c.fillRect(gx - gr, gy - gr * 1.2, gr * 2.4, gr * 2.4);
  c.strokeStyle = shade(p, 0.42); c.lineWidth = 2.2; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const y0 = gy - gr + (i / 15) * gr * 2;
    c.beginPath(); c.moveTo(gx - gr, y0);
    c.bezierCurveTo(gx - gr * 0.2, y0 + (r() - 0.5) * 14, gx + gr * 0.4, y0 + (r() - 0.5) * 14, gx + gr * 1.2, y0 + (r() - 0.5) * 8);
    c.stroke();
  }
  c.restore();
  c.strokeStyle = 'rgba(240,240,230,0.35)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(gx + gr * 0.28, gy - gr * 0.1, gr * 0.72, gr * 0.86, 0.4, 0, TAU); c.stroke();
}

/** CUP (pezizoid): a stalkless bowl, its inner face turned to the viewer. */
export function fungiCup(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xC0FE);
  ground(c, S * 0.5, S * 0.82, S * 0.20);
  const cups: Array<[number, number, number]> = [[S * 0.46, S * 0.56, S * 0.175], [S * 0.70, S * 0.70, S * 0.10]];
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
  const cx = S * 0.5, cy = S * 0.5, rad = S * 0.20;
  /* the cell beneath the armour */
  c.fillStyle = lump(c, p, cx, cy, rad * 0.92);
  c.beginPath(); c.arc(cx, cy, rad * 0.92, 0, TAU); c.fill();
  /* THE COCCOLITHS: discs pinned to the sphere. Each is foreshortened by how
     far off centre it sits and rotated to lie flat on the surface — that is
     what stops them looking like stickers (THE SURFACE LAWS). */
  const N = 30;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU * 3.6 + r() * 0.3;
    const d = Math.sqrt((i + 0.5) / N) * rad * 0.98;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    const off = d / rad;
    const fore = Math.sqrt(Math.max(0.06, 1 - off * off));
    const tilt = Math.atan2(y - cy, x - cx) + Math.PI / 2;
    const pr = rad * 0.235;
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
  /* the film: overlapping soft lobes, three layers deep, so it reads as a
     THICKNESS of colony rather than a painted patch */
  for (let layer = 0; layer < 3; layer++) {
    const m = 0.68 + layer * 0.26;
    for (let i = 0; i < 26; i++) {
      const x = S * (0.12 + r() * 0.76), y = S * (0.22 + r() * 0.56);
      softMark(c, x, y, S * (0.06 + r() * 0.09), `${p.cr * m | 0},${p.cg * m | 0},${p.cb * m | 0}`, 0.16 + layer * 0.07);
    }
  }
  /* the individual cells packed inside it, dense at the centre */
  for (let i = 0; i < 320; i++) {
    const x = S * (0.10 + r() * 0.80), y = S * (0.20 + r() * 0.60);
    const dx = (x - S * 0.5) / (S * 0.42), dy = (y - S * 0.5) / (S * 0.34);
    if (dx * dx + dy * dy > 1) continue;
    const a = r() * TAU;
    c.strokeStyle = shade(p, 1.15 + r() * 0.4);
    c.globalAlpha = 0.30 + r() * 0.45; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); c.stroke();
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
