/* skin.ts — THE COAT AS A SKIN, arc stage 3 wave 4.

   ★ Nick, 2026-08-02: "think of it like a skin, not like you're painting on
   top of the animal… a lot of games have skins."

   What was there: every pattern was a scatter of soft radial blobs clipped
   to the body outline. The tiger's fifteen "stripes" were fifteen COLUMNS OF
   FIVE DOTS, and at 440px that is exactly what they looked like — a polka
   grid. Blobs cannot say "vertical bar", cannot say "hard-edged patch with a
   pale seam", and cannot wrap.

   A skin is not a texture, it is a thing with a SHAPE that lies on a
   SURFACE. So every coat here is authored in the torso's own coordinates —
   u along the spine, phi around the girth (see torso.ts) — and mapped onto
   the body. Four consequences, all of which are what "skin" means:

     · a stripe is a stripe: one continuous tapered band from the spine down
       the flank, not a stack of dots
     · it FORESHORTENS as it wraps toward the silhouette, because a fixed
       angular width covers fewer pixels near the rim
     · it takes the body's LIGHT, so the same mark is bleached on the lit
       shoulder and drowned under the belly
     · it can be hard-edged where the animal is hard-edged. A giraffe's
       patches have crisp borders and pale seams; softening them was never
       "blending", it was losing the feature.

   D-ART-69 still holds — a signature wears the body's light — and this is
   the machinery that finally makes it cheap to obey. */

import { Tube } from './torso.js';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
type RNG = () => number;

export interface Coatable { cr: number; cg: number; cb: number; base: string; lit: string; dark: string }

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const rgbStr = (r: number, g: number, b: number): string => `rgb(${r | 0},${g | 0},${b | 0})`;
const mixRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** ★ COUNTERSHADING — the one thing almost every real mammal has and none of
    ours had. Dark along the spine, pale under the belly. It costs two
    gradients and does more for "this is a solid animal" than any marking,
    because it is the shading the body's own roundness produces. */
export function countershade(c: Ctx, t: Tube, p: Coatable, strength = 1): void {
  /* ⚠ THE FIRST BUILD OF THIS PAINTED VERTICAL STRIPS — one gradient per slice
     of u — and every animal came out RIBBED, because two neighbouring slices
     computed slightly different gradients and the boundary between them showed
     as a line. Bands run the other way now: along the whole body, one per ring
     of girth, each filled with a gradient ACROSS itself, so consecutive bands
     meet at exactly the colour they both already have. There is no seam to
     show. (A tone you compute per patch has to agree with its neighbour at the
     shared edge, or the patching itself becomes the texture.) */
  const NB = 20;
  const PHI = 1.5708;
  const at = (u: number, i: number): [number, number] => {
    if (i === 0) return t.envelope(u, 1);
    if (i === NB) return t.envelope(u, -1);
    return t.pt(u, PHI - (i / NB) * PHI * 2);
  };
  const tone = (phi: number, u: number): [number, number, number] => {
    const L = t.light(u, phi);
    /* dark along the spine is the light's own shadow; the pale belly is real
       countershaded fur, so it survives even where the light does not reach */
    /* ⚠ at 0.46 this pale band scaled with the local radius, so over the
       shoulder and haunch bulges it climbed high enough up the flank to read
       as a pale OVAL stuck on the muscle instead of as the underside of a
       round animal. Countershading should be felt, not seen. */
    const belly = clamp01(-Math.sin(phi) * 0.95);
    const shade = (L - 0.5) * 0.62 * strength;
    const col: [number, number, number] = shade < 0
      ? mixRgb([p.cr, p.cg, p.cb], [p.cr * 0.26, p.cg * 0.26, p.cb * 0.31], -shade * 1.8)
      : mixRgb([p.cr, p.cg, p.cb], [255, 250, 238], shade * 1.1);
    return mixRgb(col, [Math.min(255, p.cr * 1.55 + 42), Math.min(255, p.cg * 1.55 + 40), Math.min(255, p.cb * 1.46 + 34)], belly * 0.30 * strength);
  };
  const N = 26;
  for (let i = 0; i < NB; i++) {
    const phiA = PHI - (i / NB) * PHI * 2, phiB = PHI - ((i + 1) / NB) * PHI * 2;
    const a = at(0.5, i), b = at(0.5, i + 1);
    const g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
    const ca = tone(phiA, 0.5), cb = tone(phiB, 0.5);
    g.addColorStop(0, `rgb(${ca[0] | 0},${ca[1] | 0},${ca[2] | 0})`);
    g.addColorStop(1, `rgb(${cb[0] | 0},${cb[1] | 0},${cb[2] | 0})`);
    c.fillStyle = g;
    c.beginPath();
    for (let k = 0; k <= N; k++) c.lineTo(...at(k / N, i));
    for (let k = N; k >= 0; k--) c.lineTo(...at(k / N, i + 1));
    c.closePath(); c.fill();
  }
}

/** the tone a mark should take at (u,phi) — a dark mark all but vanishes in
    deep shadow and burns out slightly on the lit shoulder, which is what
    stops a pattern reading as a decal */
function markTone(t: Tube, u: number, phi: number, dark: [number, number, number], p: Coatable): { col: string; a: number } {
  const L = t.light(u, phi);
  const F = t.facing(u, phi);
  /* ⚠ THE FIRST VERSION BLEACHED A MARK ALMOST WHITE WHERE THE LIGHT WAS
     STRONG, and since this engine lights from the upper LEFT and every animal
     faces right, that erased the stripes off the whole rear half of the tiger.
     "Wears the body's light" (D-ART-69) does not mean the light can delete the
     feature: a black stripe in sunlight is a black stripe with a sheen on it.
     The light now adds a highlight and takes away almost nothing. */
  const sheen = clamp01(L - 0.46) * 0.40;
  const lit = mixRgb(dark, [Math.min(255, dark[0] * 2.0 + 46), Math.min(255, dark[1] * 2.0 + 42), Math.min(255, dark[2] * 2.0 + 38)], sheen);
  /* in real shadow everything converges on the body's own shadow colour */
  const shad = mixRgb(lit, [p.cr * 0.30, p.cg * 0.30, p.cb * 0.34], clamp01(0.44 - L) * 1.15);
  /* near the silhouette the surface is edge-on: the mark is still there, but
     compressed and dimmer, never a full-strength blob sitting on the rim */
  return { col: rgbStr(shad[0], shad[1], shad[2]), a: 0.74 + 0.26 * F };
}

/** SPOTS. Cheetah spots are solid and round; a fawn's are soft and pale.
    Both are the same call with different edges. */
export function coatSpots(c: Ctx, t: Tube, r: RNG, p: Coatable, o: {
  count?: number; rgb?: [number, number, number]; size?: number; soft?: number;
  phiLo?: number; phiHi?: number; uLo?: number; uHi?: number;
} = {}): void {
  const count = o.count ?? 120, dark = o.rgb ?? [26, 19, 12], soft = o.soft ?? 0.14;
  const size = o.size ?? 1;
  const phiLo = o.phiLo ?? -1.05, phiHi = o.phiHi ?? 1.45;
  const uLo = o.uLo ?? 0.03, uHi = o.uHi ?? 0.97;
  for (let i = 0; i < count; i++) {
    const u = uLo + r() * (uHi - uLo);
    const phi = phiLo + r() * (phiHi - phiLo);
    if (t.facing(u, phi) < 0.06) continue;
    const rad = t.radius(u) * 0.11 * size * (0.68 + r() * 0.66);
    const { col, a } = markTone(t, u, phi, dark, p);
    t.withMark(c, u, phi, (cc) => {
      const g = cc.createRadialGradient(0, 0, rad * (1 - soft * 2), 0, 0, rad);
      g.addColorStop(0, `rgba(${col.slice(4, -1)},${a})`);
      g.addColorStop(1 - soft, `rgba(${col.slice(4, -1)},${a * 0.92})`);
      g.addColorStop(1, `rgba(${col.slice(4, -1)},0)`);
      cc.fillStyle = g;
      cc.beginPath(); cc.ellipse(0, 0, rad * (0.85 + r() * 0.3), rad * (0.8 + r() * 0.3), r() * TAU, 0, TAU); cc.fill();
    });
  }
}

/** ROSETTES. A broken ring of marks with a warmer centre — a jaguar's have a
    spot inside, a leopard's do not. */
export function coatRosettes(c: Ctx, t: Tube, r: RNG, p: Coatable, o: {
  count?: number; core?: boolean; size?: number;
} = {}): void {
  const count = o.count ?? 34, size = o.size ?? 1;
  for (let i = 0; i < count; i++) {
    const u = 0.05 + r() * 0.9;
    const phi = -1.0 + r() * 2.4;
    if (t.facing(u, phi) < 0.08) continue;
    const rad = t.radius(u) * 0.24 * size * (0.74 + r() * 0.46);
    const { col, a } = markTone(t, u, phi, [24, 17, 10], p);
    const n = 4 + (r() * 3 | 0);
    t.withMark(c, u, phi, (cc) => {
      /* the ring: separate petals with gaps, the way a real rosette breaks */
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * TAU + r() * 0.4;
        const px = Math.cos(ang) * rad * 0.72, py = Math.sin(ang) * rad * 0.66;
        const pr = rad * (0.26 + r() * 0.16);
        const g = cc.createRadialGradient(px, py, pr * 0.4, px, py, pr);
        g.addColorStop(0, `rgba(${col.slice(4, -1)},${a})`);
        g.addColorStop(0.7, `rgba(${col.slice(4, -1)},${a * 0.85})`);
        g.addColorStop(1, `rgba(${col.slice(4, -1)},0)`);
        cc.fillStyle = g;
        cc.beginPath(); cc.ellipse(px, py, pr * 1.25, pr * 0.9, ang, 0, TAU); cc.fill();
      }
      if (o.core) {
        cc.fillStyle = `rgba(${col.slice(4, -1)},${a * 0.7})`;
        cc.beginPath(); cc.ellipse(0, 0, rad * 0.20, rad * 0.17, 0, 0, TAU); cc.fill();
      }
    });
  }
}

/** ★ BARS AND BANDS — the tiger and the zebra. ONE continuous tapered band
    running from over the spine down the flank, leaning back as it goes, and
    dying to a point before (tiger) or across (zebra) the belly. Some fork,
    because real ones do. This is the mark the old blob system could not make
    at all. */
export function coatBars(c: Ctx, t: Tube, r: RNG, p: Coatable, o: {
  count?: number; rgb?: [number, number, number]; width?: number;
  phiEnd?: number; phiTop?: number; lean?: number; forkRate?: number;
  hard?: boolean; alpha?: number;
} = {}): void {
  const count = o.count ?? 17;
  const dark = o.rgb ?? [22, 15, 9];
  const wBase = o.width ?? 1;
  const phiTop = o.phiTop ?? 1.62, phiEnd = o.phiEnd ?? -0.9;
  const lean = o.lean ?? 0.055, forkRate = o.forkRate ?? 0.28;
  const alpha = o.alpha ?? 1;
  /* the pitch: how many pixels of body each stripe owns */
  const pitch = (t.speed(0.5) * 0.9) / Math.max(1, count);

  const band = (u0: number, wScale: number, pTop: number, pEnd: number, skew: number): void => {
    const N = 22;
    const left: Array<[number, number]> = [], right: Array<[number, number]> = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const phi = pTop + (pEnd - pTop) * s;
      const u = u0 - lean * s * s + skew * s;
      if (u < -0.02 || u > 1.02) continue;
      /* the band is widest a third of the way down and tapers to a point */
      const taper = Math.sin(Math.min(1, 0.12 + s * 0.95) * Math.PI) * 0.72 + 0.30 * (1 - s);
      /* ⚠ the width was a fraction of the BODY RADIUS, so on a deep short
         animal nineteen bars each came out as wide as the gap between them and
         the whole flank merged into one smear. A stripe is spaced against its
         NEIGHBOURS: the width follows the pitch, so a tiger reads as stripes at
         any body size (D-ART-85, applied to markings). */
      const wpx = pitch * 0.30 * wBase * wScale * taper;
      const du = wpx / Math.max(1e-6, t.speed(u));
      left.push(t.pt(Math.max(0, u - du), phi));
      right.push(t.pt(Math.min(1, u + du), phi));
    }
    if (left.length < 3) return;
    const midPhi = (pTop + pEnd) / 2;
    const { col, a } = markTone(t, u0, midPhi, dark, p);
    const top = t.pt(u0, pTop), bot = t.pt(u0, pEnd);
    const g = c.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    const tt = markTone(t, u0, pTop, dark, p), tb = markTone(t, u0, pEnd, dark, p);
    g.addColorStop(0, `rgba(${tt.col.slice(4, -1)},${tt.a * alpha})`);
    g.addColorStop(0.5, `rgba(${col.slice(4, -1)},${a * alpha})`);
    g.addColorStop(1, `rgba(${tb.col.slice(4, -1)},${tb.a * alpha})`);
    c.fillStyle = g;
    if (!o.hard) { c.shadowColor = `rgba(${col.slice(4, -1)},${a * 0.5})`; c.shadowBlur = 3.5; }
    c.beginPath();
    c.moveTo(left[0]![0], left[0]![1]);
    for (let i = 1; i < left.length; i++) c.lineTo(left[i]![0], left[i]![1]);
    for (let i = right.length - 1; i >= 0; i--) c.lineTo(right[i]![0], right[i]![1]);
    c.closePath(); c.fill();
    c.shadowBlur = 0;
  };

  for (let i = 0; i < count; i++) {
    const u0 = 0.04 + (i / Math.max(1, count - 1)) * 0.9 + (r() - 0.5) * 0.022;
    const wScale = 0.7 + r() * 0.7;
    const pEnd = phiEnd + (r() - 0.5) * 0.35;
    band(u0, wScale, phiTop + r() * 0.12, pEnd, (r() - 0.5) * 0.03);
    if (r() < forkRate) {
      /* a fork: a short second prong splitting off the lower half */
      band(u0 - lean * 0.5 + 0.022, wScale * 0.55, (phiTop + pEnd) * 0.5, pEnd - 0.12, 0.012);
    }
  }
}

/** ★ PATCHES — the giraffe. Not blobs: a TILING. Real giraffe patches share
    borders and the pale seam between them is a feature, so they are built as
    Voronoi cells in skin space, shrunk to open the seams, and filled with a
    HARD edge. Softening these was the bug; the crisp border IS the animal. */
export function coatPatches(c: Ctx, t: Tube, r: RNG, p: Coatable, o: {
  nu?: number; nphi?: number; rgb?: [number, number, number]; seam?: number;
  phiLo?: number; phiHi?: number; jitter?: number;
} = {}): void {
  const nu = o.nu ?? 9, nphi = o.nphi ?? 6;
  const dark = o.rgb ?? [122, 74, 28], seam = o.seam ?? 0.80;
  const phiLo = o.phiLo ?? -1.1, phiHi = o.phiHi ?? 1.55;
  const jit = o.jitter ?? 0.42;

  /* work in an isotropic metric: u scaled by the body's length in px,
     phi by its mean radius, so cells are round rather than smeared */
  const L = t.speed(0.5), Rm = t.radius(0.5);
  const seeds: Array<[number, number]> = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nphi; j++) {
      const u = (i + 0.5) / nu + ((r() - 0.5) * jit) / nu;
      const phi = phiLo + ((j + 0.5) / nphi + ((r() - 0.5) * jit) / nphi) * (phiHi - phiLo);
      seeds.push([u, phi]);
    }
  }
  const met = (s: [number, number]): [number, number] => [s[0] * L, s[1] * Rm];

  for (let i = 0; i < seeds.length; i++) {
    const s = seeds[i]!;
    if (s[0] < -0.05 || s[0] > 1.05) continue;
    const S = met(s);
    /* start from a generous square and clip by every bisector */
    const span = Math.max(L / nu, (Rm * (phiHi - phiLo)) / nphi) * 1.6;
    let poly: Array<[number, number]> = [
      [S[0] - span, S[1] - span], [S[0] + span, S[1] - span],
      [S[0] + span, S[1] + span], [S[0] - span, S[1] + span]];
    for (let j = 0; j < seeds.length && poly.length; j++) {
      if (j === i) continue;
      const O = met(seeds[j]!);
      const dx = O[0] - S[0], dy = O[1] - S[1];
      const d2 = dx * dx + dy * dy;
      if (d2 > span * span * 6) continue;
      /* keep the half-plane nearer to S */
      const mx = (S[0] + O[0]) / 2, my = (S[1] + O[1]) / 2;
      const inside = (q: [number, number]): number => (q[0] - mx) * dx + (q[1] - my) * dy;
      const out: Array<[number, number]> = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k]!, b = poly[(k + 1) % poly.length]!;
        const ia = inside(a) <= 0, ib = inside(b) <= 0;
        if (ia) out.push(a);
        if (ia !== ib) {
          const ta = inside(a), tb = inside(b);
          const f = ta / (ta - tb);
          out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
        }
      }
      poly = out;
    }
    if (poly.length < 3) continue;
    /* open the seam by pulling the cell in toward its own centre */
    let cx0 = 0, cy0 = 0;
    for (const q of poly) { cx0 += q[0]; cy0 += q[1]; }
    cx0 /= poly.length; cy0 /= poly.length;
    const shrunk = poly.map((q): [number, number] =>
      [cx0 + (q[0] - cx0) * seam, cy0 + (q[1] - cy0) * seam]);

    const { col, a } = markTone(t, s[0], s[1], dark, p);
    c.fillStyle = `rgba(${col.slice(4, -1)},${a})`;
    c.beginPath();
    let started = false;
    for (const q of shrunk) {
      const u = q[0] / L, phi = q[1] / Rm;
      if (u < -0.03 || u > 1.03) { started = false; continue; }
      const [x, y] = t.pt(Math.max(0, Math.min(1, u)), Math.max(-1.57, Math.min(1.57, phi)));
      if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
    }
    c.closePath(); c.fill();
  }
}

/** BRINDLE / fine ticking — hyena, wild dog, agouti fur. Short streaks that
    run along the girth and break up a flat flank. */
export function coatBrindle(c: Ctx, t: Tube, r: RNG, p: Coatable, o: {
  count?: number; rgb?: [number, number, number]; len?: number;
} = {}): void {
  const count = o.count ?? 90, dark = o.rgb ?? [30, 22, 14], len = o.len ?? 1;
  c.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const u = 0.04 + r() * 0.92, phi = -1.0 + r() * 2.4;
    if (t.facing(u, phi) < 0.08) continue;
    const { col, a } = markTone(t, u, phi, dark, p);
    const dphi = (0.16 + r() * 0.3) * len;
    c.strokeStyle = `rgba(${col.slice(4, -1)},${a * (0.35 + r() * 0.4)})`;
    c.lineWidth = t.radius(u) * (0.03 + r() * 0.035);
    const A = t.pt(u, phi), B = t.pt(Math.min(1, u + (r() - 0.5) * 0.02), Math.max(-1.5, phi - dphi));
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
  }
}

/** SHAGGY — clumps of fur that follow the girth, plus a broken outline. The
    silhouette is the first thing the eye reads and a woolly animal does not
    have a clean one. */
export function coatShaggy(c: Ctx, t: Tube, r: RNG, p: Coatable, o: { count?: number } = {}): void {
  const count = o.count ?? 150;
  c.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const u = 0.02 + r() * 0.96, phi = -1.2 + r() * 2.7;
    const F = t.facing(u, phi);
    if (F < 0.04) continue;
    const L = t.light(u, phi);
    const m = 0.42 + L * 0.95;
    c.strokeStyle = `rgba(${Math.min(255, p.cr * m) | 0},${Math.min(255, p.cg * m) | 0},${Math.min(255, p.cb * m) | 0},${0.24 + r() * 0.4})`;
    c.lineWidth = t.radius(u) * (0.035 + r() * 0.05);
    const dphi = -(0.18 + r() * 0.34);
    const A = t.pt(u, phi);
    const M = t.pt(u - 0.012, phi + dphi * 0.5);
    const B = t.pt(u - 0.026, phi + dphi);
    c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo(M[0], M[1], B[0], B[1]); c.stroke();
  }
}

/** the fur that breaks the SILHOUETTE — walks the envelope and pushes tufts
    through it, so a woolly animal stops having a machined edge */
export function shaggyRim(c: Ctx, t: Tube, r: RNG, p: Coatable, len: number, density = 0.62): void {
  c.lineCap = 'round';
  const N = 96;
  for (let i = 0; i <= N; i++) {
    for (const side of [1, -1] as const) {
      if (r() > density) continue;
      const u = i / N;
      const f = t.frame(u);
      const [x, y] = t.envelope(u, side);
      const nx = f.nx * side, ny = f.ny * side;
      const L = len * (0.45 + r() * 1.0);
      const jitter = (r() - 0.5) * 0.8;
      const ux = nx * Math.cos(jitter) - ny * Math.sin(jitter);
      const uy = nx * Math.sin(jitter) + ny * Math.cos(jitter);
      const lit = t.light(u, side > 0 ? 1.3 : -1.2);
      const m = 0.38 + lit * 0.9;
      c.strokeStyle = `rgba(${Math.min(255, p.cr * m) | 0},${Math.min(255, p.cg * m) | 0},${Math.min(255, p.cb * m) | 0},${0.3 + r() * 0.45})`;
      c.lineWidth = Math.max(1.1, L * 0.2);
      c.beginPath();
      c.moveTo(x - ux * L * 0.5, y - uy * L * 0.5);
      c.quadraticCurveTo(x + ux * L * 0.45, y + uy * L * 0.45, x + ux * L + f.tx * L * 0.2, y + uy * L + f.ty * L * 0.2);
      c.stroke();
    }
  }
}

/** BLOCKING — the panda, the badger, the skunk: a hard field of a second
    colour occupying whole regions of the body rather than a scatter. */
export function coatBlocks(c: Ctx, t: Tube, p: Coatable, blocks: Array<{ u0: number; u1: number; phiLo: number; phiHi: number; rgb: string }>): void {
  for (const b of blocks) {
    c.fillStyle = b.rgb;
    c.beginPath();
    const N = 16;
    for (let i = 0; i <= N; i++) c.lineTo(...t.pt(b.u0 + ((b.u1 - b.u0) * i) / N, b.phiHi));
    for (let i = N; i >= 0; i--) c.lineTo(...t.pt(b.u0 + ((b.u1 - b.u0) * i) / N, b.phiLo));
    c.closePath(); c.fill();
  }
}
