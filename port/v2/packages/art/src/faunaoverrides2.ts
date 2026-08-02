/* faunaoverrides2.ts — THE MORPHOLOGY PASS, wave 7.
   The next fauna block by review rank: REPTILES & AMPHIBIANS · RODENTS &
   SMALL MAMMALS · PRIMATES · the remaining MARINE specialists.

   Built on the laws the earlier waves established:
   · proportion carries identity before decoration (wave 4)
   · every mark BLENDS — radial falloff, never a stamped polygon (wave 5)
   · the painter may overflow; the shared fit pass frames it (wave 6)
   · NEVER override what already excels (wave 4) — Chameleon, Crocodile,
     Frilled Lizard, Poison Dart Frog, Seahorse, Pangolin, Armadillo, Giant
     Anteater, Beaver and Fruit Bat scored well and are deliberately ABSENT. */
import { mulberry32, TAU } from '@cf/domain-rand';
import { rootedSpine } from './surface.js';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
export type Painter2 = (c: Ctx, g: G, p: Pal, name: string) => void;
const S = 440;

/** the species NAME as a seed — the anti-duplicate law (D-ART-8), applied
    to fauna: identical options must still yield distinct animals. */
export function nameSeed(name: string): number {
  let h = 0x9E37;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return h >>> 0;
}
/** a per-species rng: genome seed XOR name hash XOR the painter's salt */
function nrng(g: G, name: string, salt: number): () => number {
  return mulberry32((((g.seed as number) ^ nameSeed(name) ^ salt) >>> 0));
}
/** a name-driven multiplier in [1-amt, 1+amt] — proportion varies per species */
/** THE AVALANCHE. XOR-ing a small salt into a hash and dividing by 2^32
    perturbs only the lowest bits, so every "independent" variation axis
    collapsed to the same number and near-neighbour names produced
    near-identical animals. Mix the salt in with a large odd multiplier and
    scramble, so one bit of change rewrites the whole value. */
function mixSalt(h: number, salt: number): number {
  let x = (h ^ Math.imul(salt | 1, 0x9E3779B1)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x7FEB352D) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 0x846CA68B) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x >>> 0;
}
function nvar(name: string, salt: number, amt: number): number {
  return 1 + (mixSalt(nameSeed(name), salt) / 4294967296 - 0.5) * 2 * amt;
}
function ground(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.beginPath(); c.ellipse(cx, cy, rx, S * 0.032, 0, 0, TAU); c.fill();
}
function grad(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r * 1.2);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.62, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function rim(c: Ctx, path: () => void, w = 2.2): void {
  c.save(); c.strokeStyle = 'rgba(216,228,246,0.44)'; c.lineWidth = w;
  c.beginPath(); path(); c.stroke(); c.restore();
}
function eye(c: Ctx, x: number, y: number, r: number, slit = false): void {
  c.fillStyle = '#f2efe6'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#0d1016';
  if (slit) { c.beginPath(); c.ellipse(x, y, r * 0.30, r * 0.86, 0, 0, TAU); c.fill(); }
  else { c.beginPath(); c.arc(x, y, r * 0.62, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.22, 0, TAU); c.fill();
}
/** the wave-5 pattern law: a mark that melts into the skin */
function softMark(c: Ctx, x: number, y: number, rx: number, ry: number, rgb: string, a: number, rot = 0): void {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, ry / rx);
  const gg = c.createRadialGradient(0, 0, rx * 0.10, 0, 0, rx);
  gg.addColorStop(0, `rgba(${rgb},${a})`);
  gg.addColorStop(0.55, `rgba(${rgb},${a * 0.82})`);
  gg.addColorStop(0.82, `rgba(${rgb},${a * 0.34})`);
  gg.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gg; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
  c.restore();
}

/* ============================ REPTILES ============================ */
/** SNAKE: a coiled body of tapering segments, no limbs, forked tongue */
export function reptSnake(c: Ctx, g: G, p: Pal, opts: { hood?: boolean; rattle?: boolean; banded?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x5AE1);
  const cx = S * 0.48, cy = S * 0.56;
  ground(c, cx, S * 0.80, S * 0.24);
  /* THE COIL — one CONTINUOUS body. The first cut stamped 46 discs along
     the spiral and read as a string of beads (a caterpillar, not a snake):
     the gaps between stamps were the whole problem. It is now a dense
     round-capped ribbon — 200 short segments, each shaded across its own
     girth — so the surface is unbroken and the coil still overlaps itself
     back-to-front. */
  const N = 200, turns = 1.62 * nvar(name, 0x11, 0.16);
  const R0 = S * 0.255 * nvar(name, 0x22, 0.10), W0 = S * 0.050 * nvar(name, 0x33, 0.22);
  const pts: Array<{ x: number; y: number; w: number }> = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    const a = u * TAU * turns + 0.55;
    const rad = R0 - S * 0.155 * u;
    const taper = u < 0.10 ? 0.55 + 4.5 * u : 1 - 0.62 * ((u - 0.10) / 0.90) ** 1.5;  /* blunt neck, fine tail */
    pts.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad * 0.52, w: W0 * taper });
  }
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = N - 1; i > 0; i--) {   /* back to front: the coil reads as stacked */
    const a0 = pts[i]!, a1 = pts[i - 1]!, w = (a0.w + a1.w) * 0.5;
    c.strokeStyle = p.dark; c.lineWidth = w * 2.06;                      /* underside */
    c.beginPath(); c.moveTo(a0.x, a0.y + w * 0.16); c.lineTo(a1.x, a1.y + w * 0.16); c.stroke();
    c.strokeStyle = p.base; c.lineWidth = w * 1.86;                      /* the body */
    c.beginPath(); c.moveTo(a0.x, a0.y); c.lineTo(a1.x, a1.y); c.stroke();
    c.strokeStyle = p.lit; c.lineWidth = w * 0.58;                       /* dorsal light */
    c.globalAlpha = (i % 5) < 3 ? 0.52 : 0.30;   /* broken into scale rows, not one hose stripe */
    c.beginPath(); c.moveTo(a0.x, a0.y - w * 0.42); c.lineTo(a1.x, a1.y - w * 0.42); c.stroke();
    c.strokeStyle = 'rgba(20,16,12,0.16)'; c.lineWidth = w * 0.30;        /* the scale seam */
    c.globalAlpha = (i % 5) === 4 ? 0.9 : 0;
    c.beginPath(); c.moveTo(a0.x, a0.y + w * 0.30); c.lineTo(a1.x, a1.y + w * 0.30); c.stroke();
    c.globalAlpha = 1;
    if (opts.banded && (i % 16) < 7) {                                   /* bands BLEND (the pattern law) */
      softMark(c, (a0.x + a1.x) / 2, (a0.y + a1.y) / 2, w * 1.15, w * 1.0, '26,18,12', 0.42);
    }
  }
  /* the head rides the coil's outer end */
  /* the head sits at the ribbon's own leading end — it used to be placed by
     a hand-guessed offset and floated free of the body */
  const head = pts[0]!, neck = pts[3]!;
  const hAng = Math.atan2(head.y - neck.y, head.x - neck.x);
  const hx = head.x + Math.cos(hAng) * S * 0.030, hy = head.y + Math.sin(hAng) * S * 0.030;
  if (opts.hood) {   /* THE HOOD — a cobra's whole silhouette. Drawn in the
       body's own colour it disappeared into the coil behind it, so it now
       carries its own lighter face, a dark rim and the spectacle mark. */
    const hoodW = S * 0.165, hoodH = S * 0.135;
    const hcx = hx - S * 0.055, hcy = hy + S * 0.018;
    c.save(); c.translate(hcx, hcy); c.rotate(-0.20);
    const hood = (): void => {   /* a shield: wide shoulders, notched below */
      c.moveTo(-hoodW * 0.30, hoodH * 0.92);
      c.quadraticCurveTo(-hoodW * 1.02, hoodH * 0.42, -hoodW * 0.92, -hoodH * 0.30);
      c.quadraticCurveTo(-hoodW * 0.62, -hoodH * 1.02, 0, -hoodH * 1.06);
      c.quadraticCurveTo(hoodW * 0.62, -hoodH * 1.02, hoodW * 0.92, -hoodH * 0.30);
      c.quadraticCurveTo(hoodW * 1.02, hoodH * 0.42, hoodW * 0.30, hoodH * 0.92);
      c.quadraticCurveTo(0, hoodH * 0.66, -hoodW * 0.30, hoodH * 0.92);
    };
    const hg = c.createRadialGradient(-hoodW * 0.15, -hoodH * 0.35, 3, 0, 0, hoodW * 1.15);
    hg.addColorStop(0, '#f0e6cc'); hg.addColorStop(0.42, p.lit); hg.addColorStop(1, p.dark);
    c.fillStyle = hg;
    c.beginPath(); hood(); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(18,14,10,0.55)'; c.lineWidth = 3;
    c.beginPath(); hood(); c.closePath(); c.stroke();
    softMark(c, -hoodW * 0.34, -hoodH * 0.10, hoodW * 0.30, hoodH * 0.26, '24,16,10', 0.62);
    softMark(c, hoodW * 0.34, -hoodH * 0.10, hoodW * 0.30, hoodH * 0.26, '24,16,10', 0.62);
    c.strokeStyle = 'rgba(24,16,10,0.32)'; c.lineWidth = 2;   /* the rib lines */
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * hoodW * 0.24, hoodH * 0.72); c.lineTo(i * hoodW * 0.34, -hoodH * 0.80); c.stroke(); }
    c.restore();
  }
  c.fillStyle = grad(c, p, hx, hy, S * 0.055);
  c.beginPath(); c.ellipse(hx, hy, S * 0.058, S * 0.042, -0.3, 0, TAU); c.fill();
  rim(c, () => c.ellipse(hx, hy, S * 0.058, S * 0.042, -0.3, 0, TAU));
  eye(c, hx + S * 0.022, hy - S * 0.012, 5.5, true);
  c.strokeStyle = '#c8384a'; c.lineWidth = 2.6; c.lineCap = 'round';   /* forked tongue */
  const tx = hx + S * 0.055, ty = hy + S * 0.006;
  c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + 22, ty + 4); c.stroke();
  c.beginPath(); c.moveTo(tx + 22, ty + 4); c.lineTo(tx + 34, ty - 2); c.stroke();
  c.beginPath(); c.moveTo(tx + 22, ty + 4); c.lineTo(tx + 34, ty + 11); c.stroke();
  /* SCALE MOTTLE along the coil — a snake's skin is never one flat tone */
  for (let i = 0; i < 40; i++) {
    const k = Math.floor(r() * (pts.length - 1));
    const q = pts[k]!;
    /* INSIDE the ribbon: offset ≤ 0.3·w and radius ≤ 0.35·w keeps every
       mark's falloff within the body's girth (Nick's artifact report) */
    softMark(c, q.x + (r() - 0.5) * q.w * 0.6, q.y + (r() - 0.5) * q.w * 0.5,
      q.w * (0.20 + r() * 0.15), q.w * (0.16 + r() * 0.12),
      r() < 0.55 ? '24,18,12' : '250,248,236', 0.10 + r() * 0.12);
  }
  if (opts.rattle) {
    c.fillStyle = '#d8c9a8';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(cx - S * 0.20 - i * 9, cy + S * 0.10 + i * 3, 8 - i, 6 - i * 0.6, 0.3, 0, TAU); c.fill(); }
  }
}
/** LIZARD/MONITOR: low sprawled body, four splayed legs, long tapering tail */
export function reptLizard(c: Ctx, g: G, p: Pal, opts: { crest?: boolean; long?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x112A);
  const cy = S * 0.56, bw = S * (opts.long ? 0.20 : 0.17) * nvar(name, 0x44, 0.16),
    bh = S * 0.072 * nvar(name, 0x55, 0.22), cx = S * 0.44;
  ground(c, cx, cy + bh + S * 0.06, S * 0.24);
  /* tail first, behind the body */
  c.strokeStyle = p.base; c.lineWidth = bh * 1.1; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx - bw * 0.8, cy);
  c.quadraticCurveTo(cx - bw * 2.0, cy + bh * 0.6, cx - bw * 2.6, cy - bh * 1.4); c.stroke();
  c.strokeStyle = p.dark; c.lineWidth = bh * 0.5;
  c.beginPath(); c.moveTo(cx - bw * 1.6, cy + bh * 0.35);
  c.quadraticCurveTo(cx - bw * 2.2, cy + bh * 0.2, cx - bw * 2.6, cy - bh * 1.4); c.stroke();
  /* the sprawled legs — elbows OUT, the reptile read */
  c.strokeStyle = p.dark; c.lineWidth = bh * 0.42; c.lineCap = 'round';
  for (const sx of [-0.55, 0.55]) for (const sy of [-1, 1] as const) {
    const lx = cx + bw * sx, ly = cy + bh * 0.5;
    c.beginPath(); c.moveTo(lx, ly);
    c.quadraticCurveTo(lx + sx * 26, ly + 16 + sy * 4, lx + sx * 40, ly + 26);
    c.stroke();
    for (let d = -1; d <= 1; d++) { c.beginPath(); c.moveTo(lx + sx * 40, ly + 26); c.lineTo(lx + sx * 52 + d * 5, ly + 32 + d * 3); c.stroke(); }
  }
  c.fillStyle = grad(c, p, cx, cy, bw);
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, bw, bh, 0, -2.8, 0.3));
  for (let i = 0; i < 26; i++) softMark(c, cx - bw + r() * bw * 2, cy - bh + r() * bh * 2, 5 + r() * 4, 4 + r() * 3, '26,20,12', 0.4);
  if (opts.crest) {
    c.fillStyle = p.dark;
    for (let i = 0; i < 9; i++) { const x = cx - bw * 0.7 + i * (bw * 0.18); c.beginPath(); c.moveTo(x, cy - bh * 0.9); c.lineTo(x + 5, cy - bh * 1.7); c.lineTo(x + 10, cy - bh * 0.9); c.closePath(); c.fill(); }
  }
  const hx = cx + bw * 1.12, hy = cy - bh * 0.15;
  c.fillStyle = grad(c, p, hx, hy, bh * 1.3);
  c.beginPath(); c.ellipse(hx, hy, bh * 1.35, bh * 0.78, -0.1, 0, TAU); c.fill();
  rim(c, () => c.ellipse(hx, hy, bh * 1.35, bh * 0.78, -0.1, -2.8, 0.3));
  eye(c, hx - bh * 0.2, hy - bh * 0.3, 5.5, true);
  c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(hx - bh * 0.6, hy + bh * 0.28); c.lineTo(hx + bh * 1.25, hy + bh * 0.2); c.stroke();
}
/** TURTLE/TORTOISE: domed scuted shell, stump legs, retracted neck */
export function reptTurtle(c: Ctx, g: G, p: Pal, opts: { flippers?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x7011);
  const cx = S * 0.48, cy = S * 0.54, sw = S * 0.21 * nvar(name, 0x66, 0.14),
    sh = S * 0.135 * nvar(name, 0x77, 0.20);   /* dome height per species */
  ground(c, cx, cy + sh + S * 0.05, S * 0.24);
  /* limbs */
  c.fillStyle = p.dark;
  if (opts.flippers) {
    for (const s of [-1, 1] as const) {
      c.save(); c.translate(cx + s * sw * 0.72, cy + sh * 0.45); c.rotate(s * 0.5);
      c.beginPath(); c.ellipse(0, 0, sw * 0.52, sh * 0.24, 0, 0, TAU); c.fill(); c.restore();
    }
  } else {
    for (const s of [-1, 1] as const) for (const o of [0.55, -0.15]) {
      c.beginPath(); c.ellipse(cx + s * sw * (0.72 + o * 0.1), cy + sh * 0.62, sw * 0.16, sh * 0.30, s * 0.3, 0, TAU); c.fill();
    }
  }
  /* the shell — dome + scute grid + rim */
  const gg = c.createRadialGradient(cx - sw * 0.3, cy - sh * 0.7, 4, cx, cy, sw * 1.1);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.6, p.base); gg.addColorStop(1, p.dark);
  c.fillStyle = gg;
  c.beginPath(); c.ellipse(cx, cy, sw, sh, 0, Math.PI, TAU); c.fill();
  c.fillStyle = p.dark;
  c.beginPath(); c.ellipse(cx, cy, sw, sh * 0.30, 0, 0, Math.PI); c.fill();
  c.save(); c.beginPath(); c.ellipse(cx, cy, sw, sh, 0, Math.PI, TAU); c.clip();
  /* scute boundaries as GROOVES, not drawn-on lines (Nick: "the lines on
     turtle shells are all blended together"): a wide soft shadow under a
     thin darker centre, weakest at the dome's lit crown */
  const seam = (draw: () => void): void => {
    c.strokeStyle = 'rgba(24,18,12,0.14)'; c.lineWidth = 6; c.beginPath(); draw(); c.stroke();
    c.strokeStyle = 'rgba(24,18,12,0.26)'; c.lineWidth = 2.2; c.beginPath(); draw(); c.stroke();
    c.strokeStyle = 'rgba(240,236,220,0.10)'; c.lineWidth = 1.2;   /* the groove's lit lip */
    c.save(); c.translate(0, -1.4); c.beginPath(); draw(); c.stroke(); c.restore();
  };
  for (let i = -2; i <= 2; i++) seam(() => c.ellipse(cx, cy, sw * (0.28 + Math.abs(i) * 0.26), sh * (0.30 + Math.abs(i) * 0.28), 0, Math.PI, TAU));
  for (let i = -3; i <= 3; i++) seam(() => { c.moveTo(cx + i * sw * 0.26, cy); c.quadraticCurveTo(cx + i * sw * 0.30, cy - sh * 0.55, cx + i * sw * 0.34, cy - sh); });
  /* and each scute's centre rises slightly — the shell reads as plates, not
     as a balloon with a net drawn on it */
  for (let i = -2; i <= 2; i++) for (let k = 0; k < 3; k++) {
    const ex = cx + i * sw * 0.30, ey = cy - sh * (0.25 + k * 0.26);
    softMark(c, ex, ey, sw * 0.10, sh * 0.08, '250,246,232', 0.10);
  }
  c.restore();
  rim(c, () => c.ellipse(cx, cy, sw, sh, 0, Math.PI, TAU), 2.4);
  /* SCUTE WEAR — the plates of a shell are not uniform; the older centre
     is darker and scuffed, which is most of what makes a shell look old */
  c.save();
  c.beginPath(); c.ellipse(cx, cy, sw, sh, 0, Math.PI, TAU); c.clip();
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU, d = r() ** 0.6;
    softMark(c, cx + Math.cos(a) * sw * d, cy - Math.abs(Math.sin(a)) * sh * d,
      sw * (0.07 + r() * 0.09), sh * (0.09 + r() * 0.11),
      r() < 0.6 ? '30,24,14' : '245,238,214', 0.10 + r() * 0.12);
  }
  c.restore();
  /* head on a short neck */
  const hx = cx + sw * 1.08, hy = cy - sh * 0.18;
  c.strokeStyle = p.base; c.lineWidth = sh * 0.42; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx + sw * 0.75, cy - sh * 0.1); c.lineTo(hx, hy); c.stroke();
  c.fillStyle = grad(c, p, hx, hy, sh * 0.5);
  c.beginPath(); c.ellipse(hx, hy, sh * 0.52, sh * 0.38, -0.1, 0, TAU); c.fill();
  eye(c, hx + sh * 0.06, hy - sh * 0.1, 4.5);
}
/** FROG: crouched haunches, long folded hind legs, wide mouth, domed eyes */
export function amphFrog(c: Ctx, g: G, p: Pal, opts: { warty?: boolean }, name = ''): void {
  const r = nrng(g, name, 0xF209);
  const cx = S * 0.5, cy = S * 0.56, bw = S * 0.155 * nvar(name, 0x88, 0.16),
    bh = S * 0.125 * nvar(name, 0x99, 0.20);
  ground(c, cx, cy + bh + S * 0.05, S * 0.20);
  /* THE FOLDED HIND LEG — a frog's whole silhouette. The first cut drew a
     small pad and a thin curve and read as a spider: the leg needs its THREE
     masses (thick thigh folded up beside the body, shin angled down and back,
     long foot flat on the ground with splayed toes). */
  for (const s of [-1, 1] as const) {
    const tx = cx + s * bw * 0.80, ty = cy + bh * 0.02;
    c.fillStyle = grad(c, p, tx, ty, bw * 0.52);
    c.save(); c.translate(tx, ty); c.rotate(s * -0.42);
    c.beginPath(); c.ellipse(0, 0, bw * 0.50, bh * 0.44, 0, 0, TAU); c.fill();
    c.restore();
    const sx2 = cx + s * bw * 1.18, sy2 = cy + bh * 0.72;
    c.fillStyle = p.dark;
    c.save(); c.translate(sx2, sy2); c.rotate(s * 0.75);
    c.beginPath(); c.ellipse(0, 0, bw * 0.40, bh * 0.20, 0, 0, TAU); c.fill();
    c.restore();
    const fx = cx + s * bw * 1.30, fy = cy + bh * 1.06;   /* the flat foot */
    c.fillStyle = p.dark;
    c.save(); c.translate(fx, fy); c.rotate(s * 0.18);
    c.beginPath(); c.ellipse(0, 0, bw * 0.34, bh * 0.12, 0, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = p.dark; c.lineWidth = bh * 0.11; c.lineCap = 'round';
    for (let d = -1; d <= 1; d++) {
      c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + s * bw * 0.56, fy + d * bh * 0.20); c.stroke();
    }
  }
  c.fillStyle = grad(c, p, cx, cy, bw);
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, bw, bh, 0, -2.8, 0.3));
  if (opts.warty) for (let i = 0; i < 30; i++) softMark(c, cx - bw + r() * bw * 2, cy - bh * 0.8 + r() * bh * 1.6, 5 + r() * 4, 4 + r() * 3, '30,24,14', 0.42);
  else for (let i = 0; i < 16; i++) softMark(c, cx - bw + r() * bw * 2, cy - bh * 0.8 + r() * bh * 1.6, 7 + r() * 6, 5 + r() * 4, '20,30,16', 0.35);
  /* the front arms PROP the body up — straight, not dangling */
  c.strokeStyle = p.base; c.lineWidth = bh * 0.17; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx + s * bw * 0.40, cy + bh * 0.52);
    c.quadraticCurveTo(cx + s * bw * 0.52, cy + bh * 0.92, cx + s * bw * 0.46, cy + bh * 1.14); c.stroke();
    c.strokeStyle = p.dark; c.lineWidth = bh * 0.09;
    for (let d = -1; d <= 1; d++) { c.beginPath(); c.moveTo(cx + s * bw * 0.46, cy + bh * 1.14); c.lineTo(cx + s * bw * (0.46 + 0.22) + d * 3, cy + bh * (1.14 + d * 0.10)); c.stroke(); }
    c.strokeStyle = p.base; c.lineWidth = bh * 0.17;
  }
  /* the wide mouth line and the domed eyes on top */
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(cx - bw * 0.62, cy - bh * 0.12); c.quadraticCurveTo(cx, cy + bh * 0.34, cx + bw * 0.62, cy - bh * 0.12); c.stroke();
  for (const s of [-1, 1] as const) {
    const ex = cx + s * bw * 0.44, ey = cy - bh * 0.72;
    c.fillStyle = grad(c, p, ex, ey, bh * 0.34);
    c.beginPath(); c.arc(ex, ey, bh * 0.34, 0, TAU); c.fill();
    eye(c, ex, ey - bh * 0.05, bh * 0.20);
    /* the TYMPANUM — the disc behind a frog's eye, and a real field mark */
    softMark(c, cx + s * bw * 0.70, cy - bh * 0.30, bh * 0.20, bh * 0.20, '30,24,16', 0.45);
  }
}

/* ============================ RODENTS & SMALL MAMMALS ============================ */
/** RODENT: compact haunched body, big round ears, prominent incisors */
export function smallRodent(c: Ctx, g: G, p: Pal, opts: { tail: 'long' | 'bushy' | 'stub'; ears: number; quills?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x0DE5);
  const cx = S * 0.5, cy = S * 0.56, bw = S * 0.145 * nvar(name, 0xAA, 0.18),
    bh = S * 0.125 * nvar(name, 0xBB, 0.20);
  ground(c, cx, cy + bh + S * 0.05, S * 0.18);
  /* tail behind */
  if (opts.tail === 'long') {
    c.strokeStyle = p.dark; c.lineWidth = bh * 0.16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - bw * 0.85, cy + bh * 0.2);
    c.quadraticCurveTo(cx - bw * 2.0, cy + bh * 0.1, cx - bw * 1.8, cy - bh * 1.0); c.stroke();
  } else if (opts.tail === 'bushy') {
    c.strokeStyle = p.base; c.lineWidth = bh * 0.72; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - bw * 0.8, cy + bh * 0.1);
    c.quadraticCurveTo(cx - bw * 1.9, cy - bh * 0.2, cx - bw * 1.5, cy - bh * 1.5); c.stroke();
    c.strokeStyle = p.lit; c.lineWidth = bh * 0.24;
    c.beginPath(); c.moveTo(cx - bw * 1.6, cy - bh * 0.6); c.lineTo(cx - bw * 1.5, cy - bh * 1.5); c.stroke();
  }
  /* the haunched body */
  c.fillStyle = grad(c, p, cx, cy, bw);
  c.beginPath(); c.ellipse(cx, cy, bw, bh, -0.12, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, bw, bh, -0.12, -2.8, 0.3));
  if (opts.quills) {
    /* ★ ROOTED SPINES. Drawn as bare strokes they read as pins stuck into a
       balloon; a real quill parts the coat around its base, so each one gets
       a dark socket where it leaves the skin and tapers to a point. Drawn
       from back to front so the near ones overlap the far ones. */
    const quills: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 46; i++) {
      const a = -Math.PI * 0.98 + r() * Math.PI * 0.96, d = bw * (0.45 + r() * 0.55);
      quills.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, a, 20 + r() * 16]);
    }
    quills.sort((q1, q2) => q1[1] - q2[1]);
    for (const [qx, qy, a, L] of quills) rootedSpine(c, qx, qy, a, L, '#e8dcc0');
  }
  /* haunch + forefeet */
  c.fillStyle = p.dark;
  c.beginPath(); c.ellipse(cx - bw * 0.42, cy + bh * 0.42, bw * 0.36, bh * 0.42, 0, 0, TAU); c.fill();
  c.strokeStyle = p.dark; c.lineWidth = bh * 0.18; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx + bw * 0.5, cy + bh * 0.75); c.lineTo(cx + bw * 0.62, cy + bh * 1.08); c.stroke();
  /* head with ears + incisors */
  const hx = cx + bw * 0.95, hy = cy - bh * 0.35, hr = bh * 0.62;
  /* THE EARS RIDE ABOVE THE HEAD. The first cut centred a tall ellipse only
     0.78·hr above the head centre, so a rabbit's ear (er = 1.6·hr) reached
     BELOW the chin and the head vanished inside one green blob. An ear is
     anchored by its BASE at the skull, and grows upward from there. */
  const er = hr * opts.ears;
  for (const s of [-1, 1] as const) {
    const ebx = hx - hr * 0.28 + s * hr * 0.40;
    const eby = hy - hr * 0.62 - er * 0.82;                /* base at the skull, body above */
    const tilt = s * (0.16 + opts.ears * 0.06);
    c.fillStyle = p.dark;
    c.save(); c.translate(ebx, eby); c.rotate(tilt);
    c.beginPath(); c.ellipse(0, 0, er * 0.40, er * 0.92, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(${Math.min(255, p.cr * 0.55 + 92 | 0)},${Math.min(255, p.cg * 0.5 + 64 | 0)},${Math.min(255, p.cb * 0.5 + 68 | 0)},0.8)`;
    c.beginPath(); c.ellipse(0, er * 0.04, er * 0.22, er * 0.66, 0, 0, TAU); c.fill();   /* the inner ear */
    c.restore();
  }
  c.fillStyle = grad(c, p, hx, hy, hr);
  c.beginPath(); c.ellipse(hx, hy, hr, hr * 0.88, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(hx, hy, hr, hr * 0.88, 0, -2.8, 0.3));
  c.fillStyle = p.base;   /* the snout */
  c.beginPath(); c.ellipse(hx + hr * 0.75, hy + hr * 0.22, hr * 0.42, hr * 0.32, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(24,16,18,0.8)';
  c.beginPath(); c.ellipse(hx + hr * 1.08, hy + hr * 0.16, hr * 0.13, hr * 0.10, 0, 0, TAU); c.fill();
  c.fillStyle = '#f4efdf';   /* THE INCISORS — the rodent read */
  c.beginPath(); c.rect(hx + hr * 0.86, hy + hr * 0.34, hr * 0.16, hr * 0.30); c.fill();
  c.beginPath(); c.rect(hx + hr * 1.04, hy + hr * 0.34, hr * 0.16, hr * 0.28); c.fill();
  eye(c, hx + hr * 0.18, hy - hr * 0.12, hr * 0.19);
  c.strokeStyle = 'rgba(240,240,255,0.4)'; c.lineWidth = 1.4;   /* whiskers */
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(hx + hr * 0.9, hy + hr * 0.2); c.lineTo(hx + hr * 1.9, hy + hr * 0.2 + i * hr * 0.34); c.stroke(); }
}

/* ============================ PRIMATES ============================ */
/** PRIMATE: upright-ish torso, long arms, forward face, expressive brow */
export function primate(c: Ctx, g: G, p: Pal, opts: { build: 'great' | 'lesser' | 'monkey'; tail?: boolean; ruff?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x9A1E);
  const great = opts.build === 'great';
  const lesser = opts.build === 'lesser';
  /* 'lesser' now genuinely sits between great apes and monkeys — it used to
     be an alias for 'monkey', which is how Baboon and Macaque collided */
  const scale = great ? 1 : (lesser ? 0.86 : 0.74);
  const cx = S * 0.5, cy = S * 0.55;
  const bw = S * 0.155 * scale * nvar(name, 0xCC, 0.14), bh = S * 0.165 * scale * nvar(name, 0xDD, 0.16);
  const armReach = nvar(name, 0xEE, 0.22);   /* a gibbon out-reaches a macaque */
  ground(c, cx, cy + bh + S * 0.06, S * 0.20);
  if (opts.tail) {   /* monkey tail, curling behind */
    c.strokeStyle = p.dark; c.lineWidth = bh * 0.14; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - bw * 0.8, cy + bh * 0.3);
    c.bezierCurveTo(cx - bw * 2.4, cy + bh * 0.4, cx - bw * 2.6, cy - bh * 0.9, cx - bw * 1.5, cy - bh * 1.25); c.stroke();
  }
  /* the long arms — a primate's signature reach, drawn behind the torso */
  c.strokeStyle = p.dark; c.lineWidth = bh * (great ? 0.34 : 0.24); c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx + s * bw * 0.66, cy - bh * 0.42);
    c.quadraticCurveTo(cx + s * bw * (great ? 1.5 : 1.3) * armReach, cy + bh * 0.3, cx + s * bw * (great ? 1.15 : 1.0) * armReach, cy + bh * (great ? 1.05 : 0.95) * armReach);
    c.stroke();
    c.fillStyle = p.dark;   /* the hand */
    c.beginPath(); c.ellipse(cx + s * bw * (great ? 1.15 : 1.0) * armReach, cy + bh * (great ? 1.12 : 1.02) * armReach, bh * 0.16, bh * 0.20, s * 0.3, 0, TAU); c.fill();
  }
  /* THE TORSO — broad at the shoulders, narrower at the hips. An ellipse
     made every primate the same ball; the shoulder-to-hip taper is what
     separates a gorilla from a marmoset, so it is traced, not stamped.
     Great apes carry the widest shoulders; monkeys are nearly parallel. */
  const shoulder = bw * (great ? 1.06 : lesser ? 0.94 : 0.86), hip = bw * (great ? 0.78 : 0.86);
  const torso = (): void => {
    c.moveTo(cx - shoulder, cy - bh * 0.42);
    c.quadraticCurveTo(cx - shoulder * 1.06, cy - bh * 0.95, cx, cy - bh * 1.02);   /* shoulder line */
    c.quadraticCurveTo(cx + shoulder * 1.06, cy - bh * 0.95, cx + shoulder, cy - bh * 0.42);
    c.quadraticCurveTo(cx + hip * 1.12, cy + bh * 0.55, cx + hip * 0.86, cy + bh * 0.96);
    c.quadraticCurveTo(cx, cy + bh * 1.20, cx - hip * 0.86, cy + bh * 0.96);        /* seat */
    c.quadraticCurveTo(cx - hip * 1.12, cy + bh * 0.55, cx - shoulder, cy - bh * 0.42);
  };
  c.fillStyle = grad(c, p, cx, cy - bh * 0.15, bw * 1.1);
  c.beginPath(); torso(); c.closePath(); c.fill();
  rim(c, torso);
  /* THE LEGS, IN FRONT of the torso. Drawn behind it they vanished under the
     body and every primate read as a robe with a face. A squatting primate
     shows thigh, shin and a long foot. */
  for (const s of [-1, 1] as const) {
    const tx2 = cx + s * hip * 0.62, ty2 = cy + bh * 0.72;
    c.fillStyle = grad(c, p, tx2, ty2, bw * 0.40);
    c.save(); c.translate(tx2, ty2); c.rotate(s * 0.30);
    c.beginPath(); c.ellipse(0, 0, bw * 0.40, bh * 0.30, 0, 0, TAU); c.fill();   /* thigh */
    c.restore();
    c.strokeStyle = p.dark; c.lineWidth = bh * 0.26; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + s * hip * 0.80, cy + bh * 0.86);
    c.quadraticCurveTo(cx + s * hip * 0.94, cy + bh * 1.16, cx + s * hip * 0.72, cy + bh * 1.30); c.stroke();
    c.fillStyle = p.dark;   /* the long grasping foot */
    c.save(); c.translate(cx + s * hip * 0.76, cy + bh * 1.34); c.rotate(s * 0.12);
    c.beginPath(); c.ellipse(0, 0, bh * 0.28, bh * 0.13, 0, 0, TAU); c.fill();
    c.restore();
  }
  /* the shoulder caps — the mass a great ape carries and a monkey does not */
  for (const s of [-1, 1] as const) {
    softMark(c, cx + s * shoulder * 0.78, cy - bh * 0.58, bw * (great ? 0.40 : 0.28), bh * (great ? 0.34 : 0.24),
      `${Math.min(255, p.cr * 1.18 | 0)},${Math.min(255, p.cg * 1.18 | 0)},${Math.min(255, p.cb * 1.18 | 0)}`, great ? 0.30 : 0.18);
  }
  /* the lighter chest/belly, softly blended */
  softMark(c, cx, cy + bh * 0.25, bw * 0.62, bh * 0.6, '236,226,206', 0.16);
  /* head: forward-facing FACE DISC — what makes a primate read */
  const hr = bh * (great ? 0.56 : 0.48) * nvar(name, 0xF1, 0.14), hx = cx, hy = cy - bh * 1.18;
  if (opts.ruff) {
    c.fillStyle = p.dark;
    for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU; softMark(c, hx + Math.cos(a) * hr * 1.25, hy + Math.sin(a) * hr * 1.15, hr * 0.42, hr * 0.34, `${p.cr},${p.cg},${p.cb}`, 0.7, a); }
  }
  c.fillStyle = grad(c, p, hx, hy, hr);
  c.beginPath(); c.ellipse(hx, hy, hr, hr * 1.05, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(hx, hy, hr, hr * 1.05, 0, -2.9, 0.25));
  /* the bare face + heavy brow */
  const fg = c.createRadialGradient(hx, hy + hr * 0.15, 2, hx, hy + hr * 0.1, hr * 0.86);
  fg.addColorStop(0, `rgba(${Math.min(255, p.cr * 0.7 + 60 | 0)},${Math.min(255, p.cg * 0.7 + 44 | 0)},${Math.min(255, p.cb * 0.7 + 40 | 0)},0.95)`);
  fg.addColorStop(1, `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.2)`);
  c.fillStyle = fg;
  c.beginPath(); c.ellipse(hx, hy + hr * 0.12, hr * 0.72, hr * 0.82, 0, 0, TAU); c.fill();
  c.fillStyle = `rgba(${p.cr * 0.42 | 0},${p.cg * 0.42 | 0},${p.cb * 0.42 | 0},0.85)`;
  c.beginPath(); c.ellipse(hx, hy - hr * 0.34, hr * 0.74, hr * 0.20, 0, 0, TAU); c.fill();   /* brow ridge */
  eye(c, hx - hr * 0.28, hy - hr * 0.05, hr * 0.14);
  eye(c, hx + hr * 0.28, hy - hr * 0.05, hr * 0.14);
  c.fillStyle = 'rgba(30,20,20,0.6)';   /* nostrils + mouth */
  c.beginPath(); c.ellipse(hx - hr * 0.09, hy + hr * 0.34, hr * 0.06, hr * 0.05, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(hx + hr * 0.09, hy + hr * 0.34, hr * 0.06, hr * 0.05, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(30,20,20,0.55)'; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(hx - hr * 0.24, hy + hr * 0.56); c.quadraticCurveTo(hx, hy + hr * 0.66, hx + hr * 0.24, hy + hr * 0.56); c.stroke();
  if (!great) {   /* the round side ears of monkeys/lesser apes */
    for (const s of [-1, 1] as const) { c.fillStyle = p.base; c.beginPath(); c.arc(hx + s * hr * 0.95, hy, hr * 0.24, 0, TAU); c.fill(); }
  }
  /* FUR — a primate's coat breaks the torso's silhouette into shoulder,
     flank and haunch masses instead of one smooth shell */
  c.save();
  c.beginPath(); torso(); c.closePath(); c.clip();
  for (let i = 0; i < 34; i++) {
    const a = r() * TAU, d = r() ** 0.65;
    softMark(c, cx + Math.cos(a) * bw * d, cy + Math.sin(a) * bh * d,
      bw * (0.12 + r() * 0.14), bh * (0.06 + r() * 0.08),
      i % 3 ? '20,16,12' : '242,236,222', 0.08 + r() * 0.09, 1.4 + (r() - 0.5));
  }
  c.restore();
}

/* ============================ MARINE REMAINDER ============================ */
/** RAY: a flat diamond disc with wing-like pectorals and a whip tail */
export function marineRay(c: Ctx, g: G, p: Pal, opts: { sting?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x2A17);
  const cx = S * 0.48, cy = S * 0.50, w = S * 0.27 * nvar(name, 0xF2, 0.16),
    h = S * 0.15 * nvar(name, 0xF3, 0.20);   /* disc sweep per species */
  ground(c, cx, cy + h + S * 0.10, S * 0.24);
  c.strokeStyle = p.dark; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx - w * 0.1, cy + h * 0.6);
  c.quadraticCurveTo(cx - w * 0.6, cy + h * 1.7, cx - w * 1.5, cy + h * 1.9); c.stroke();
  if (opts.sting) { c.fillStyle = '#e8ded0'; c.beginPath(); c.moveTo(cx - w * 1.35, cy + h * 1.86); c.lineTo(cx - w * 1.75, cy + h * 1.98); c.lineTo(cx - w * 1.36, cy + h * 2.02); c.closePath(); c.fill(); }
  const gg = c.createRadialGradient(cx, cy - h * 0.3, 6, cx, cy, w);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.55, p.base); gg.addColorStop(1, p.dark);
  c.fillStyle = gg;
  c.beginPath();
  c.moveTo(cx, cy - h * 0.95);
  c.quadraticCurveTo(cx + w * 0.7, cy - h * 0.5, cx + w, cy + h * 0.35);
  c.quadraticCurveTo(cx + w * 0.4, cy + h * 0.85, cx, cy + h * 0.72);
  c.quadraticCurveTo(cx - w * 0.4, cy + h * 0.85, cx - w, cy + h * 0.35);
  c.quadraticCurveTo(cx - w * 0.7, cy - h * 0.5, cx, cy - h * 0.95);
  c.closePath(); c.fill();
  rim(c, () => { c.moveTo(cx, cy - h * 0.95); c.quadraticCurveTo(cx + w * 0.7, cy - h * 0.5, cx + w, cy + h * 0.35); }, 2.4);
  for (let i = 0; i < 22; i++) softMark(c, cx - w * 0.8 + r() * w * 1.6, cy - h * 0.7 + r() * h * 1.3, 7 + r() * 6, 5 + r() * 4, '236,244,255', 0.18);
  /* the eyes ride ON TOP of the disc (a ray's read), spiracles behind */
  for (const s of [-1, 1] as const) {
    eye(c, cx + s * w * 0.30, cy - h * 0.44, 6);
    c.fillStyle = 'rgba(20,26,34,0.55)';
    c.beginPath(); c.ellipse(cx + s * w * 0.40, cy - h * 0.20, 7, 4.5, s * 0.3, 0, TAU); c.fill();
  }
}
/** BIVALVE/GASTROPOD shells: scallop ribs, spiral snail, ear-shaped abalone */
export function marineShell(c: Ctx, g: G, p: Pal, opts: { kind: 'scallop' | 'spiral' | 'abalone' | 'razor' | 'snail' }, name = ''): void {
  const r = nrng(g, name, 0x5E11);
  const cx = S * 0.5, cy = S * 0.52;
  const sv = nvar(name, 0xF4, 0.18), sv2 = nvar(name, 0xF5, 0.16);
  ground(c, cx, S * 0.76, S * 0.20);
  if (opts.kind === 'scallop') {
    const w = S * 0.20 * sv, h = S * 0.17 * sv2;
    c.fillStyle = grad(c, p, cx, cy, w);
    c.beginPath(); c.moveTo(cx - w * 0.22, cy + h * 0.75);
    c.quadraticCurveTo(cx - w * 1.15, cy + h * 0.1, cx - w * 0.75, cy - h * 0.72);
    c.quadraticCurveTo(cx, cy - h * 1.0, cx + w * 0.75, cy - h * 0.72);
    c.quadraticCurveTo(cx + w * 1.15, cy + h * 0.1, cx + w * 0.22, cy + h * 0.75);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(40,30,20,0.35)'; c.lineWidth = 2.6;   /* the radial ribs */
    for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(cx, cy + h * 0.7); c.lineTo(cx + i * w * 0.17, cy - h * 0.85); c.stroke(); }
    c.fillStyle = p.dark;   /* the hinge ears */
    c.beginPath(); c.moveTo(cx - w * 0.36, cy + h * 0.66); c.lineTo(cx - w * 0.62, cy + h * 0.86); c.lineTo(cx - w * 0.12, cy + h * 0.86); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(cx + w * 0.36, cy + h * 0.66); c.lineTo(cx + w * 0.62, cy + h * 0.86); c.lineTo(cx + w * 0.12, cy + h * 0.86); c.closePath(); c.fill();
    rim(c, () => { c.moveTo(cx - w * 0.75, cy - h * 0.72); c.quadraticCurveTo(cx, cy - h * 1.0, cx + w * 0.75, cy - h * 0.72); }, 2.2);
  } else if (opts.kind === 'snail') {
    /* A SNAIL IS AN ANIMAL, not a shell on the ground: the soft foot glides
       out from under the whorl, and the eyestalks are the whole silhouette. */
    const R = S * 0.155 * sv2;
    const fx = cx - S * 0.02, fy = cy + S * 0.085;
    c.fillStyle = grad(c, p, fx, fy, S * 0.14);   /* the muscular foot */
    c.beginPath();
    c.moveTo(fx - S * 0.20, fy + S * 0.020);
    c.quadraticCurveTo(fx - S * 0.20, fy - S * 0.035, fx - S * 0.05, fy - S * 0.032);
    c.quadraticCurveTo(fx + S * 0.16, fy - S * 0.034, fx + S * 0.215, fy - S * 0.010);
    c.quadraticCurveTo(fx + S * 0.235, fy + S * 0.022, fx + S * 0.16, fy + S * 0.026);
    c.closePath(); c.fill();
    rim(c, () => { c.moveTo(fx - S * 0.20, fy + S * 0.020); c.quadraticCurveTo(fx - S * 0.20, fy - S * 0.035, fx - S * 0.05, fy - S * 0.032); c.quadraticCurveTo(fx + S * 0.16, fy - S * 0.034, fx + S * 0.215, fy - S * 0.010); }, 2);
    const nx = fx + S * 0.185, ny = fy - S * 0.018;   /* the head end + eyestalks */
    c.strokeStyle = p.base; c.lineWidth = S * 0.017; c.lineCap = 'round';
    for (const [dx, dy] of [[0.030, -0.070], [0.052, -0.048]] as const) {
      c.beginPath(); c.moveTo(nx, ny); c.quadraticCurveTo(nx + S * dx * 0.4, ny + S * dy * 0.7, nx + S * dx, ny + S * dy); c.stroke();
      c.fillStyle = '#12161c'; c.beginPath(); c.arc(nx + S * dx, ny + S * dy, S * 0.011, 0, TAU); c.fill();
    }
    const sx = cx + S * 0.010, sy = cy - S * 0.030;   /* the whorl, riding the back */
    for (let i = 110; i >= 0; i--) {
      const u = i / 110, a = u * TAU * 2.9 * sv, rad = R * u;
      const wx = sx + Math.cos(a) * rad * 0.92, wy = sy + Math.sin(a) * rad * 0.80;
      const wr = R * 0.30 * (0.34 + u * 0.82);
      const wg = c.createRadialGradient(wx - wr * 0.4, wy - wr * 0.45, 1, wx, wy, wr * 1.15);
      wg.addColorStop(0, p.lit); wg.addColorStop(0.55, p.base); wg.addColorStop(1, p.dark);
      c.fillStyle = wg;
      c.beginPath(); c.arc(wx, wy, wr, 0, TAU); c.fill();
      if (i % 13 === 0) { c.strokeStyle = 'rgba(30,22,14,0.28)'; c.lineWidth = 1.6; c.beginPath(); c.arc(wx, wy, wr, 0, TAU); c.stroke(); }
    }
    rim(c, () => c.arc(sx, sy, R * 0.95, -2.5, 1.4), 2);
  } else if (opts.kind === 'spiral') {
    const turns = 3.4 * sv, R = S * 0.20 * sv2;
    for (let i = 120; i >= 0; i--) {
      const t = i / 120, a = t * TAU * turns, rad = R * t;
      const x = cx + Math.cos(a) * rad * 0.9, y = cy + Math.sin(a) * rad * 0.75;
      const wr = R * 0.30 * (0.35 + t * 0.8);
      const wg = c.createRadialGradient(x - wr * 0.4, y - wr * 0.45, 1, x, y, wr * 1.15);
      wg.addColorStop(0, p.lit); wg.addColorStop(0.55, p.base); wg.addColorStop(1, p.dark);
      c.fillStyle = wg;
      c.beginPath(); c.arc(x, y, wr, 0, TAU); c.fill();
      if (i % 12 === 0) { c.strokeStyle = 'rgba(30,22,14,0.26)'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, wr, 0, TAU); c.stroke(); }
    }
    c.fillStyle = p.dark;
    c.beginPath(); c.ellipse(cx + R * 0.9, cy + R * 0.62, R * 0.30, R * 0.22, 0.4, 0, TAU); c.fill();   /* the aperture */
    rim(c, () => c.arc(cx, cy, R * 0.95, -2.4, 1.2), 2);
  } else if (opts.kind === 'abalone') {
    const w = S * 0.21 * sv, h = S * 0.145 * sv2;
    c.fillStyle = grad(c, p, cx, cy, w);
    c.beginPath(); c.ellipse(cx, cy, w, h, -0.18, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(cx, cy, w, h, -0.18, 0, TAU); c.clip();
    for (let i = 0; i < 26; i++) softMark(c, cx - w + r() * w * 2, cy - h + r() * h * 2, 12 + r() * 10, 8 + r() * 7, i % 2 ? '120,220,220' : '210,160,240', 0.20, r() * 3);
    c.restore();
    c.fillStyle = 'rgba(18,16,20,0.75)';   /* THE RESPIRATORY HOLES — the abalone read */
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(cx - w * 0.5 + i * w * 0.26, cy - h * 0.42 + i * 3, 5.5 - i * 0.4, 0, TAU); c.fill(); }
    rim(c, () => c.ellipse(cx, cy, w, h, -0.18, -2.8, 0.3), 2.2);
  } else {
    const w = S * 0.27 * sv, h = S * 0.055 * sv2;   /* razor clam: long narrow blade */
    c.fillStyle = grad(c, p, cx, cy, w * 0.6);
    c.save(); c.translate(cx, cy); c.rotate(-0.32);
    c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(40,30,20,0.3)'; c.lineWidth = 1.8;
    for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * w * 0.2, -h); c.lineTo(i * w * 0.2 + 6, h); c.stroke(); }
    c.restore();
    rim(c, () => { c.save(); c.translate(cx, cy); c.rotate(-0.32); c.ellipse(0, 0, w, h, 0, -2.8, 0.3); c.restore(); }, 2);
  }
}

/** SALAMANDER/NEWT: not a lizard — smooth moist skin, no claws, a blunt
    round head, a paddle tail, and (for the axolotl) external gill fronds. */
export function amphSalamander(c: Ctx, g: G, p: Pal, opts: { gills?: boolean; stout?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x5A1A);
  const cy = S * 0.55, cx = S * 0.44;
  const bw = S * (opts.stout ? 0.19 : 0.165) * nvar(name, 0x21, 0.14), bh = S * 0.058 * nvar(name, 0x22, 0.20);
  ground(c, cx, cy + bh + S * 0.055, S * 0.23);
  c.lineCap = 'round';
  c.strokeStyle = p.base; c.lineWidth = bh * 1.5;   /* the PADDLE tail — flattened, finned */
  c.beginPath(); c.moveTo(cx - bw * 0.7, cy);
  c.quadraticCurveTo(cx - bw * 1.8, cy + bh * 0.5, cx - bw * 2.5, cy - bh * 0.9); c.stroke();
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.55)`;
  c.save(); c.translate(cx - bw * 1.9, cy - bh * 0.1); c.rotate(-0.34);
  c.beginPath(); c.ellipse(0, 0, bw * 0.75, bh * 1.5, 0, 0, TAU); c.fill(); c.restore();
  c.strokeStyle = p.dark; c.lineWidth = bh * 0.36;   /* short soft limbs, toes splayed */
  for (const sx of [-0.6, 0.62]) for (const sy of [-1, 1] as const) {
    const lx = cx + bw * sx, ly = cy + bh * 0.55;
    c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx + sx * 20, ly + 14 + sy * 3, lx + sx * 30, ly + 22); c.stroke();
    for (let d = -1; d <= 1; d++) { c.beginPath(); c.moveTo(lx + sx * 30, ly + 22); c.lineTo(lx + sx * 40 + d * 4, ly + 27 + d * 2); c.stroke(); }
  }
  c.fillStyle = grad(c, p, cx, cy, bw);
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, bw, bh, 0, -2.8, 0.3));
  for (let i = 0; i < 20; i++) softMark(c, cx - bw + r() * bw * 2, cy - bh + r() * bh * 2, 6 + r() * 5, 4 + r() * 3, '235,210,120', 0.26);
  c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = bh * 0.34;   /* the wet sheen */
  c.beginPath(); c.moveTo(cx - bw * 0.6, cy - bh * 0.45); c.quadraticCurveTo(cx, cy - bh * 0.72, cx + bw * 0.6, cy - bh * 0.45); c.stroke();
  const hx = cx + bw * 1.05, hy = cy - bh * 0.12;
  if (opts.gills) {   /* THE AXOLOTL READ: three feathered gill stalks a side */
    for (const s of [-1, 1] as const) for (let i = 0; i < 3; i++) {
      const a = -0.5 + i * 0.42, gx = hx - bh * 0.5, gy = hy + s * bh * 0.5;
      c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.5 + 130 | 0)},${p.cg * 0.4 + 60 | 0},${p.cb * 0.4 + 70 | 0},0.9)`;
      c.lineWidth = bh * 0.24;
      const ex = gx - Math.cos(a) * bh * 1.5, ey = gy + s * Math.sin(a + 0.6) * bh * 1.3;
      c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx - bh * 0.6, gy + s * bh * 0.9, ex, ey); c.stroke();
      c.lineWidth = bh * 0.11;
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - bh * 0.55 + k * bh * 0.2, ey + s * bh * 0.5 + k * bh * 0.22); c.stroke(); }
    }
  }
  c.fillStyle = grad(c, p, hx, hy, bh * 1.3);
  c.beginPath(); c.ellipse(hx, hy, bh * 1.30, bh * 0.92, 0, 0, TAU); c.fill();   /* blunt ROUND head */
  rim(c, () => c.ellipse(hx, hy, bh * 1.30, bh * 0.92, 0, -2.8, 0.3));
  eye(c, hx + bh * 0.15, hy - bh * 0.34, bh * 0.24);
  c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(hx - bh * 0.5, hy + bh * 0.34); c.quadraticCurveTo(hx + bh * 0.6, hy + bh * 0.52, hx + bh * 1.2, hy + bh * 0.16); c.stroke();
}

/** STARFISH / BRITTLE STAR: five radial arms from a low central disc */
export function marineStar(c: Ctx, g: G, p: Pal, opts: { brittle?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x57A1);
  const cx = S * 0.5, cy = S * 0.52, R = S * 0.215 * nvar(name, 0x31, 0.14);
  const arms = 5, aw = opts.brittle ? 0.22 : 0.68;   /* plump, not spiky */
  ground(c, cx, cy + S * 0.13, S * 0.20);
  const body = (): void => {
    for (let i = 0; i < arms; i++) {
      const a = -Math.PI / 2 + (i / arms) * TAU;
      const tipx = cx + Math.cos(a) * R, tipy = cy + Math.sin(a) * R * 0.86;
      const l = a - Math.PI / arms, rr = a + Math.PI / arms;
      const inx = cx + Math.cos(l) * R * 0.30, iny = cy + Math.sin(l) * R * 0.30 * 0.86;
      const outx = cx + Math.cos(rr) * R * 0.30, outy = cy + Math.sin(rr) * R * 0.30 * 0.86;
      if (!i) c.moveTo(inx, iny); else c.lineTo(inx, iny);
      /* the tip is ROUNDED — swing wide, then round across the end */
      const tw = opts.brittle ? 0.055 : 0.13;
      c.quadraticCurveTo(cx + Math.cos(a - 0.30) * R * aw, cy + Math.sin(a - 0.30) * R * aw * 0.86,
        tipx + Math.cos(a - 1.57) * R * tw, tipy + Math.sin(a - 1.57) * R * tw * 0.86);
      c.quadraticCurveTo(tipx + Math.cos(a) * R * 0.10, tipy + Math.sin(a) * R * 0.10 * 0.86,
        tipx + Math.cos(a + 1.57) * R * tw, tipy + Math.sin(a + 1.57) * R * tw * 0.86);
      c.quadraticCurveTo(cx + Math.cos(a + 0.30) * R * aw, cy + Math.sin(a + 0.30) * R * aw * 0.86, outx, outy);
    }
  };
  c.fillStyle = grad(c, p, cx, cy, R);
  c.beginPath(); body(); c.closePath(); c.fill();
  rim(c, () => { body(); c.closePath(); });
  c.save(); c.beginPath(); body(); c.closePath(); c.clip();
  for (let i = 0; i < 70; i++) {   /* the tube-foot stipple, blended not stamped */
    const a = r() * TAU, d = r() * R;
    softMark(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.86, 4 + r() * 4, 3 + r() * 3, '250,240,220', 0.22);
  }
  c.restore();
  softMark(c, cx, cy, R * 0.30, R * 0.26, `${p.cr},${p.cg},${p.cb}`, 0.55);   /* the central disc */
  c.fillStyle = 'rgba(255,250,235,0.35)'; c.beginPath(); c.arc(cx, cy, R * 0.055, 0, TAU); c.fill();
}

/** SEA URCHIN: a spined test — the spines ARE the animal */
export function marineUrchin(c: Ctx, g: G, p: Pal, opts: { long?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x5C11);
  const cx = S * 0.5, cy = S * 0.53, R = S * 0.115 * nvar(name, 0x41, 0.16);
  const SP = opts.long ? R * 1.55 : R * 0.95;
  ground(c, cx, cy + R + S * 0.05, S * 0.18);
  c.lineCap = 'round';
  for (let i = 0; i < 88; i++) {
    const a = (i / 88) * TAU + r() * 0.06;
    const len = SP * (0.72 + r() * 0.5);
    c.strokeStyle = i % 3 ? p.dark : p.base;
    c.lineWidth = 3.6 - (i % 3) * 0.7;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78);
    c.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len));
    c.stroke();
  }
  c.fillStyle = grad(c, p, cx, cy, R);
  c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
  for (let i = 0; i < 5; i++) {   /* the test's meridian bands */
    const a = (i / 5) * Math.PI;
    softMark(c, cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.45, R * 0.30, R * 0.24, '18,14,20', 0.34);
  }
  rim(c, () => c.arc(cx, cy, R, 0, TAU), 2);
}

/** SEA ANEMONE: a column crowned with a ring of drifting tentacles */
export function marineAnemone(c: Ctx, g: G, p: Pal, opts: { tall?: boolean }, name = ''): void {
  const r = nrng(g, name, 0xA11E);
  const cx = S * 0.5, colH = S * (opts.tall ? 0.20 : 0.145) * nvar(name, 0x51, 0.16);
  const base = S * 0.74, top = base - colH, colW = S * 0.085 * nvar(name, 0x52, 0.18);
  ground(c, cx, base + S * 0.012, colW * 1.9);
  const tenc = `rgba(${Math.min(255, p.cr * 0.88 + 26 | 0)},${Math.min(255, p.cg * 0.88 + 20 | 0)},${Math.min(255, p.cb * 0.88 + 24 | 0)},0.92)`;
  const tenTip = `rgba(${Math.min(255, p.cr * 0.55 + 100 | 0)},${Math.min(255, p.cg * 0.55 + 84 | 0)},${Math.min(255, p.cb * 0.55 + 92 | 0)},0.95)`;
  c.lineCap = 'round';
  for (let i = 0; i < 46; i++) {   /* the tentacle crown, drifting outward */
    const a = -Math.PI / 2 + (i / 46) * TAU;
    const len = colW * (1.05 + r() * 1.25), sway = (r() - 0.5) * colW * 0.8;
    c.lineWidth = 5.2 - (i % 3) * 0.9;
    const sx2 = cx + Math.cos(a) * colW * 0.72, sy2 = top + Math.sin(a) * colW * 0.30;
    const ex2 = sx2 + Math.cos(a) * len, ey2 = sy2 - len * (0.42 + r() * 0.5);
    const tg = c.createLinearGradient(sx2, sy2, ex2, ey2);   /* colour at the base, pale at the tip */
    tg.addColorStop(0, tenc); tg.addColorStop(1, tenTip);
    c.strokeStyle = tg;
    c.beginPath(); c.moveTo(sx2, sy2);
    c.quadraticCurveTo(sx2 + Math.cos(a) * len * 0.6 + sway, sy2 - len * 0.55, ex2, ey2);
    c.stroke();
  }
  const cg = c.createLinearGradient(cx - colW, 0, cx + colW, 0);
  cg.addColorStop(0, p.dark); cg.addColorStop(0.4, p.base); cg.addColorStop(1, p.dark);
  c.fillStyle = cg;
  c.beginPath();
  c.moveTo(cx - colW * 1.05, base);
  c.quadraticCurveTo(cx - colW * 0.72, top + colH * 0.2, cx - colW * 0.78, top);
  c.lineTo(cx + colW * 0.78, top);
  c.quadraticCurveTo(cx + colW * 0.72, top + colH * 0.2, cx + colW * 1.05, base);
  c.closePath(); c.fill();
  for (let i = 0; i < 14; i++) softMark(c, cx - colW + r() * colW * 2, top + r() * colH, 7 + r() * 5, 5 + r() * 4, '250,235,215', 0.16);
  softMark(c, cx, top, colW * 0.72, colW * 0.30, '20,14,18', 0.45);   /* the oral disc */
  rim(c, () => c.ellipse(cx, top, colW * 0.78, colW * 0.30, 0, 0, TAU), 2);
}

export const FAUNA2_NAME: Record<string, Painter2> = {
  /* ── SNAKES ── the coil, the wedge head, the forked tongue */
  'Cobra': (c, g, p, n) => reptSnake(c, g, p, { hood: true }, n),
  'Mamba': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Viper': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'Mountain Viper': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'Rattlesnake': (c, g, p, n) => reptSnake(c, g, p, { rattle: true, banded: true }, n),
  'Boa': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'Sand Boa': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'Python': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'Anaconda': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'King Snake': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'Garter Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Rat Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Tree Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Vine Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Water Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Grass Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Whip Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Cave Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Cottonmouth': (c, g, p, n) => reptSnake(c, g, p, { banded: true }, n),
  'Racer': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  'Snake': (c, g, p, n) => reptSnake(c, g, p, {}, n),
  /* ── LIZARDS ── the sprawled stance: elbows OUT, belly low, tail long */
  'Monitor Lizard': (c, g, p, n) => reptLizard(c, g, p, { long: true }, n),
  'Komodo Dragon': (c, g, p, n) => reptLizard(c, g, p, { long: true }, n),
  'Gila Monster': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  'Tegu': (c, g, p, n) => reptLizard(c, g, p, { long: true }, n),
  'Gecko': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  'Skink': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  'Anole': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  'Agama': (c, g, p, n) => reptLizard(c, g, p, { crest: true }, n),
  'Whiptail': (c, g, p, n) => reptLizard(c, g, p, { long: true }, n),
  'Iguana': (c, g, p, n) => reptLizard(c, g, p, { crest: true, long: true }, n),
  'Marine Iguana': (c, g, p, n) => reptLizard(c, g, p, { crest: true, long: true }, n),
  'Land Iguana': (c, g, p, n) => reptLizard(c, g, p, { crest: true, long: true }, n),
  'Horned Lizard': (c, g, p, n) => reptLizard(c, g, p, { crest: true }, n),
  'Alligator Lizard': (c, g, p, n) => reptLizard(c, g, p, { long: true }, n),
  'Mountain Lizard': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  'Wall Lizard': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  'Coastal Lizard': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  'Lizard': (c, g, p, n) => reptLizard(c, g, p, {}, n),
  /* ── TURTLES ── the domed scuted shell */
  'Tortoise': (c, g, p, n) => reptTurtle(c, g, p, {}, n),
  'Turtle': (c, g, p, n) => reptTurtle(c, g, p, {}, n),
  'Pond Turtle': (c, g, p, n) => reptTurtle(c, g, p, {}, n),
  'Box Turtle': (c, g, p, n) => reptTurtle(c, g, p, {}, n),
  'Snapping Turtle': (c, g, p, n) => reptTurtle(c, g, p, {}, n),
  'Softshell Turtle': (c, g, p, n) => reptTurtle(c, g, p, {}, n),
  'Sea Turtle': (c, g, p, n) => reptTurtle(c, g, p, { flippers: true }, n),
  /* ── FROGS & TOADS ── folded haunches, domed eyes, wide mouth */
  'Frog': (c, g, p, n) => amphFrog(c, g, p, {}, n),
  'Tree Frog': (c, g, p, n) => amphFrog(c, g, p, {}, n),
  'Glass Frog': (c, g, p, n) => amphFrog(c, g, p, {}, n),
  'Wood Frog': (c, g, p, n) => amphFrog(c, g, p, {}, n),
  'Cave Frog': (c, g, p, n) => amphFrog(c, g, p, {}, n),
  'Bullfrog': (c, g, p, n) => amphFrog(c, g, p, {}, n),
  'Toad': (c, g, p, n) => amphFrog(c, g, p, { warty: true }, n),
  /* ── SALAMANDERS ── smooth skin, paddle tail, NOT lizards */
  'Salamander': (c, g, p, n) => amphSalamander(c, g, p, {}, n),
  'Giant Salamander': (c, g, p, n) => amphSalamander(c, g, p, { stout: true }, n),
  'Alpine Salamander': (c, g, p, n) => amphSalamander(c, g, p, {}, n),
  'Blind Salamander': (c, g, p, n) => amphSalamander(c, g, p, {}, n),
  'Newt': (c, g, p, n) => amphSalamander(c, g, p, {}, n),
  'Olm': (c, g, p, n) => amphSalamander(c, g, p, { gills: true }, n),
  'Axolotl': (c, g, p, n) => amphSalamander(c, g, p, { gills: true, stout: true }, n),
  /* ── RODENTS & SMALL MAMMALS ── incisors, haunch, ear, whisker */
  'Mouse': (c, g, p, n) => smallRodent(c, g, p, { tail: 'long', ears: 0.85 }, n),
  'Rat': (c, g, p, n) => smallRodent(c, g, p, { tail: 'long', ears: 0.70 }, n),
  'Vole': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.50 }, n),
  'Water Vole': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.48 }, n),
  'Shrew': (c, g, p, n) => smallRodent(c, g, p, { tail: 'long', ears: 0.42 }, n),
  'Tree Shrew': (c, g, p, n) => smallRodent(c, g, p, { tail: 'bushy', ears: 0.52 }, n),
  'Lemming': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.40 }, n),
  'Gerbil': (c, g, p, n) => smallRodent(c, g, p, { tail: 'long', ears: 0.72 }, n),
  'Hamster': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.62 }, n),
  'Guinea Pig': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.58 }, n),
  'Jerboa': (c, g, p, n) => smallRodent(c, g, p, { tail: 'long', ears: 1.15 }, n),
  'Gopher': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.36 }, n),
  'Marmot': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.40 }, n),
  'Prairie Dog': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.38 }, n),
  'Pika': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.86 }, n),
  'Capybara': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.34 }, n),
  'Agouti': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.44 }, n),
  'Mara': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.92 }, n),
  'Squirrel': (c, g, p, n) => smallRodent(c, g, p, { tail: 'bushy', ears: 0.62 }, n),
  'Ground Squirrel': (c, g, p, n) => smallRodent(c, g, p, { tail: 'bushy', ears: 0.50 }, n),
  'Flying Squirrel': (c, g, p, n) => smallRodent(c, g, p, { tail: 'bushy', ears: 0.68 }, n),
  'Chipmunk': (c, g, p, n) => smallRodent(c, g, p, { tail: 'bushy', ears: 0.58 }, n),
  'Rabbit': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 1.45 }, n),
  'Hare': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 1.70 }, n),
  'Jackrabbit': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 1.95 }, n),
  'Snowshoe Hare': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 1.55 }, n),
  'Arctic Hare': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 1.20 }, n),
  'Hedgehog': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.40, quills: true }, n),
  'Porcupine': (c, g, p, n) => smallRodent(c, g, p, { tail: 'stub', ears: 0.34, quills: true }, n),
  /* ── PRIMATES ── the shoulder-to-hip taper, the face disc, the reach */
  'Gorilla': (c, g, p, n) => primate(c, g, p, { build: 'great' }, n),
  'Chimpanzee': (c, g, p, n) => primate(c, g, p, { build: 'great' }, n),
  'Orangutan': (c, g, p, n) => primate(c, g, p, { build: 'great', ruff: true }, n),
  'Gibbon': (c, g, p, n) => primate(c, g, p, { build: 'lesser' }, n),
  'Baboon': (c, g, p, n) => primate(c, g, p, { build: 'lesser', tail: true }, n),
  'Mandrill': (c, g, p, n) => primate(c, g, p, { build: 'lesser', tail: true, ruff: true }, n),
  'Macaque': (c, g, p, n) => primate(c, g, p, { build: 'lesser', tail: true }, n),
  'Langur': (c, g, p, n) => primate(c, g, p, { build: 'lesser', tail: true }, n),
  'Proboscis Monkey': (c, g, p, n) => primate(c, g, p, { build: 'lesser', tail: true }, n),
  'Howler Monkey': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true }, n),
  'Spider Monkey': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true }, n),
  'Capuchin': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true }, n),
  'Marmoset': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true, ruff: true }, n),
  'Tamarin': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true, ruff: true }, n),
  'Monkey': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true }, n),
  'Lemur': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true, ruff: true }, n),
  'Aye-Aye': (c, g, p, n) => primate(c, g, p, { build: 'monkey', tail: true, ruff: true }, n),
  /* ── RAYS ── the flat disc and the whip tail */
  'Manta Ray': (c, g, p, n) => marineRay(c, g, p, {}, n),
  'Eagle Ray': (c, g, p, n) => marineRay(c, g, p, {}, n),
  'Stingray': (c, g, p, n) => marineRay(c, g, p, { sting: true }, n),
  'Ray': (c, g, p, n) => marineRay(c, g, p, { sting: true }, n),
  /* ── SHELLS & THE ANIMALS INSIDE THEM ── */
  'Scallop': (c, g, p, n) => marineShell(c, g, p, { kind: 'scallop' }, n),
  'Oyster': (c, g, p, n) => marineShell(c, g, p, { kind: 'scallop' }, n),
  'Clam': (c, g, p, n) => marineShell(c, g, p, { kind: 'scallop' }, n),
  'Giant Clam': (c, g, p, n) => marineShell(c, g, p, { kind: 'scallop' }, n),
  'Mussel': (c, g, p, n) => marineShell(c, g, p, { kind: 'scallop' }, n),
  'Razor Clam': (c, g, p, n) => marineShell(c, g, p, { kind: 'razor' }, n),
  'Abalone': (c, g, p, n) => marineShell(c, g, p, { kind: 'abalone' }, n),
  'Limpet': (c, g, p, n) => marineShell(c, g, p, { kind: 'abalone' }, n),
  'Conch': (c, g, p, n) => marineShell(c, g, p, { kind: 'spiral' }, n),
  'Nautilus': (c, g, p, n) => marineShell(c, g, p, { kind: 'spiral' }, n),
  'Cowrie': (c, g, p, n) => marineShell(c, g, p, { kind: 'abalone' }, n),
  'Snail': (c, g, p, n) => marineShell(c, g, p, { kind: 'snail' }, n),
  'Land Snail': (c, g, p, n) => marineShell(c, g, p, { kind: 'snail' }, n),
  'Sea Snail': (c, g, p, n) => marineShell(c, g, p, { kind: 'snail' }, n),
  'Water Snail': (c, g, p, n) => marineShell(c, g, p, { kind: 'snail' }, n),
  'Freshwater Snail': (c, g, p, n) => marineShell(c, g, p, { kind: 'snail' }, n),
  /* ── RADIAL INVERTEBRATES ── body plans nothing else in the game had ── */
  'Starfish': (c, g, p, n) => marineStar(c, g, p, {}, n),
  'Brittle Star': (c, g, p, n) => marineStar(c, g, p, { brittle: true }, n),
  'Sand Dollar': (c, g, p, n) => marineStar(c, g, p, { brittle: false }, n),
  'Sea Urchin': (c, g, p, n) => marineUrchin(c, g, p, { long: true }, n),
  'Sea Anemone': (c, g, p, n) => marineAnemone(c, g, p, {}, n),
  'Tube Worm': (c, g, p, n) => marineAnemone(c, g, p, { tall: true }, n),
  'Giant Tube Worm': (c, g, p, n) => marineAnemone(c, g, p, { tall: true }, n),
};
