/* fungioverrides2.ts — WAVE 18: the Platinum-audit fungi + canonical fixes.
   The audit called the fungi system "dramatically better" but flagged six
   iconic species whose SIGNATURE the shared families cannot express, plus
   the four cross-kingdom canonical conflicts. These are bespoke painters —
   the override law working exactly as designed: a family for the many, a
   hand-drawn form for the few that define themselves.

   Palette is read from the genome like every other painter; species whose
   COLOUR is their identity (Fly Agaric red, Lion's Mane white) force it. */
import { mulberry32, TAU } from '@cf/domain-rand';

type Ctx = CanvasRenderingContext2D;
type G = Record<string, unknown>;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;

function seeded(g: G, salt: number): () => number { return mulberry32((((g.seed as number) ^ salt) >>> 0)); }
function shadow(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.42)'; c.beginPath(); c.ellipse(cx, cy, rx, S * 0.026, 0, 0, TAU); c.fill();
}
function lit3(c: Ctx, hex: string, x: number, y: number, r: number): CanvasGradient {
  const n = parseInt(hex.slice(1), 16), cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
  const gg = c.createRadialGradient(x - r * 0.34, y - r * 0.4, 2, x, y, r * 1.2);
  gg.addColorStop(0, `rgb(${Math.min(255, cr * 1.4 | 0)},${Math.min(255, cg * 1.4 | 0)},${Math.min(255, cb * 1.4 | 0)})`);
  gg.addColorStop(0.6, hex);
  gg.addColorStop(1, `rgb(${cr * 0.42 | 0},${cg * 0.42 | 0},${cb * 0.42 | 0})`);
  return gg;
}

/* ── FLY AGARIC: the red cap with white warts is the whole point ── */
export function fungiFlyAgaric(c: Ctx, g: G, _p: Pal): void {
  const r = seeded(g, 0xF1A6);
  for (let k = 0; k < 3; k++) {
    const cx = S * (0.32 + k * 0.18), by = S * (0.80 - k * 0.02), sc = 1 - k * 0.14;
    shadow(c, cx, by + 4, S * 0.09 * sc);
    c.fillStyle = '#efe7d2';   /* the pale stalk with a ring */
    c.beginPath(); c.moveTo(cx - S * 0.022 * sc, by); c.lineTo(cx - S * 0.030 * sc, by - S * 0.18 * sc);
    c.lineTo(cx + S * 0.030 * sc, by - S * 0.18 * sc); c.lineTo(cx + S * 0.022 * sc, by); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.ellipse(cx, by - S * 0.14 * sc, S * 0.040 * sc, S * 0.012 * sc, 0, 0, TAU); c.fill();
    const capY = by - S * 0.18 * sc, capR = S * 0.085 * sc;
    c.fillStyle = lit3(c, '#c8261f', cx, capY, capR);   /* THE RED CAP */
    c.beginPath(); c.ellipse(cx, capY, capR, capR * 0.72, 0, Math.PI, TAU); c.fill();
    c.beginPath(); c.ellipse(cx, capY, capR, capR * 0.22, 0, 0, Math.PI); c.fill();
    for (let i = 0; i < 12; i++) {   /* the white warts */
      const a = -0.2 - r() * 2.7, d = capR * (0.2 + r() * 0.7);
      c.fillStyle = 'rgba(248,246,236,0.92)';
      c.beginPath(); c.arc(cx + Math.cos(a) * d, capY + Math.sin(a) * d * 0.7, capR * (0.06 + r() * 0.05), 0, TAU); c.fill();
    }
  }
}

/* ── LION'S MANE: a hanging pom-pom of soft tooth-like spines ── */
export function fungiLionsMane(c: Ctx, g: G, _p: Pal): void {
  const r = seeded(g, 0x110E);
  const cx = S * 0.5, cy = S * 0.44, R = S * 0.20;
  shadow(c, cx, S * 0.82, S * 0.16);
  /* the mass, built from soft lobes so it reads as a cushion of flesh */
  for (let i = 0; i < 60; i++) {
    const a = r() * TAU, d = r() ** 0.6 * R;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 1.05;
    const rr = R * (0.18 + r() * 0.12);
    const gg = c.createRadialGradient(x - rr * 0.3, y - rr * 0.35, 1, x, y, rr);
    gg.addColorStop(0, '#f6f1e2'); gg.addColorStop(0.6, '#e6dcc2'); gg.addColorStop(1, '#b8ac8e');
    c.fillStyle = gg; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
  }
  /* the tooth spines hang DOWN off the underside — the signature */
  c.lineCap = 'round';
  for (let i = 0; i < 80; i++) {
    const a = r() * TAU, d = r() ** 0.5 * R * 0.95;
    const x = cx + Math.cos(a) * d, y = cy + Math.abs(Math.sin(a)) * d * 0.5 + R * 0.2;
    const len = R * (0.14 + r() * 0.22);
    c.strokeStyle = i % 3 ? '#efe7d2' : '#d8cdb0'; c.lineWidth = 3 - (i % 2);
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6, y + len); c.stroke();
  }
}

/* ── MAITAKE: a dense rosette of overlapping frond-like caps ── */
export function fungiMaitake(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x0A17);
  const cx = S * 0.5, base = S * 0.80;
  shadow(c, cx, base + 4, S * 0.20);
  c.fillStyle = '#d8cdb4';   /* the fused pale stem base */
  c.beginPath(); c.moveTo(cx - S * 0.05, base); c.quadraticCurveTo(cx, base - S * 0.14, cx + S * 0.05, base); c.closePath(); c.fill();
  const brown = p.cr + p.cg + p.cb < 300 ? p.base : '#a07a4c';
  for (let i = 0; i < 40; i++) {   /* many overlapping ruffled fronds */
    const t = i / 39;
    const a = -Math.PI * 0.9 + t * Math.PI * 0.8;
    const rad = S * (0.13 + (i % 4) * 0.05);
    const fx = cx + Math.cos(a) * rad, fy = base - S * 0.12 - Math.abs(Math.sin(a)) * S * 0.24 - (i % 4) * 7;
    c.fillStyle = lit3(c, brown, fx, fy, S * 0.05);
    c.save(); c.translate(fx, fy); c.rotate((r() - 0.5) * 0.5);
    c.beginPath(); c.ellipse(0, 0, S * (0.058 + r() * 0.026), S * 0.030, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(0, 0, S * 0.045, S * 0.024, 0, -2.6, 0.3); c.stroke();
    c.restore();
  }
}

/* ── STINKHORN: a tall pale stalk crowned with a dark slimy gleba ── */
export function fungiStinkhorn(c: Ctx, g: G, _p: Pal): void {
  const r = seeded(g, 0x571C);
  for (let k = 0; k < 2; k++) {
    const cx = S * (0.40 + k * 0.18), base = S * 0.82, h = S * (0.52 - k * 0.08);
    shadow(c, cx, base + 4, S * 0.08);
    /* the volva (egg sac) at the base */
    c.fillStyle = '#e6ddc6'; c.beginPath(); c.ellipse(cx, base, S * 0.05, S * 0.028, 0, 0, TAU); c.fill();
    /* the spongy pale stalk */
    const sg = c.createLinearGradient(cx - S * 0.03, 0, cx + S * 0.03, 0);
    sg.addColorStop(0, '#c8bda0'); sg.addColorStop(0.45, '#efe8d4'); sg.addColorStop(1, '#c8bda0');
    c.fillStyle = sg;
    c.beginPath();
    c.moveTo(cx - S * 0.028, base); c.quadraticCurveTo(cx - S * 0.018, base - h * 0.6, cx - S * 0.020, base - h);
    c.lineTo(cx + S * 0.020, base - h); c.quadraticCurveTo(cx + S * 0.018, base - h * 0.6, cx + S * 0.028, base);
    c.closePath(); c.fill();
    for (let i = 0; i < 22; i++) { c.fillStyle = 'rgba(120,105,80,0.22)'; c.beginPath(); c.arc(cx + (r() - 0.5) * S * 0.03, base - r() * h, 2 + r() * 2, 0, TAU); c.fill(); }
    /* the dark olive-green gleba cap, dripping */
    const cy2 = base - h;
    c.fillStyle = '#3a4a26';
    c.beginPath(); c.ellipse(cx, cy2, S * 0.038, S * 0.05, 0, Math.PI * 0.9, TAU * 1.05); c.fill();
    c.beginPath(); c.moveTo(cx - S * 0.03, cy2); c.quadraticCurveTo(cx, cy2 + S * 0.06, cx + S * 0.03, cy2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(20,28,14,0.5)';
    for (let i = 0; i < 8; i++) { const x = cx - S * 0.028 + r() * S * 0.056; c.beginPath(); c.ellipse(x, cy2 + S * 0.02 + r() * S * 0.02, 3, 5, 0, 0, TAU); c.fill(); }
  }
}

/* ── CORDYCEPS: slender orange clubs erupting from a buried host ── */
export function fungiCordyceps(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0xC0DA);
  const cx = S * 0.5, base = S * 0.80;
  shadow(c, cx, base + 6, S * 0.16);
  /* the host (a buried insect/caterpillar hint) */
  c.fillStyle = '#5a4632';
  c.beginPath(); c.ellipse(cx, base, S * 0.13, S * 0.045, -0.1, 0, TAU); c.fill();
  for (let i = 0; i < 6; i++) { c.strokeStyle = 'rgba(30,22,14,0.5)'; c.lineWidth = 2; const x = cx - S * 0.1 + i * S * 0.04; c.beginPath(); c.moveTo(x, base - S * 0.02); c.lineTo(x, base + S * 0.02); c.stroke(); }
  const club = p.cr > p.cb ? p.base : '#d97a28';
  const n = 5 + (r() * 3 | 0);
  for (let i = 0; i < n; i++) {   /* the clubs — thin stalks with a knobbed, granular head */
    const bx = cx + (i - (n - 1) / 2) * S * 0.05 + (r() - 0.5) * 10;
    const h = S * (0.28 + r() * 0.16), tilt = (r() - 0.5) * 0.4;
    const tx = bx + Math.sin(tilt) * h, ty = base - S * 0.02 - h;
    c.strokeStyle = '#c8a86a'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx, base - S * 0.02); c.quadraticCurveTo(bx + Math.sin(tilt) * h * 0.5, base - h * 0.5, tx, ty); c.stroke();
    c.fillStyle = lit3(c, club, tx, ty - S * 0.03, S * 0.03);
    c.beginPath(); c.ellipse(tx, ty - S * 0.03, S * 0.022, S * 0.05, tilt, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,240,200,0.4)';   /* the granular perithecia */
    for (let k = 0; k < 10; k++) { c.beginPath(); c.arc(tx + (r() - 0.5) * S * 0.03, ty - S * 0.06 + r() * S * 0.06, 1.6, 0, TAU); c.fill(); }
  }
}

/* ── REINDEER LICHEN: a pale, densely branched cushion (canonical, unified
   across the flora + fungi copies) ── */
export function lichenMat(c: Ctx, g: G, _p: Pal): void {
  const r = seeded(g, 0x11CE);
  const cx = S * 0.5, base = S * 0.78;
  shadow(c, cx, base + 6, S * 0.22);
  const pale = '#c9d0c2';
  const draw = (x: number, y: number, a: number, len: number, w: number, d: number): void => {
    if (d > 6 || len < 4) return;
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    c.strokeStyle = d < 2 ? '#9aa294' : pale; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a - 0.2) * len * 0.6, y + Math.sin(a - 0.2) * len * 0.6, ex, ey); c.stroke();
    /* lichen forks in THREES, tightly — that density is the read */
    draw(ex, ey, a - 0.5 - r() * 0.2, len * 0.72, w * 0.72, d + 1);
    draw(ex, ey, a + 0.05, len * 0.72, w * 0.72, d + 1);
    draw(ex, ey, a + 0.5 + r() * 0.2, len * 0.72, w * 0.72, d + 1);
  };
  for (let k = -3; k <= 3; k++) draw(cx + k * S * 0.035, base, -Math.PI / 2 + k * 0.12, S * 0.13, 6, 0);
  for (let i = 0; i < 40; i++) { const a = r() * TAU, dd = r() * S * 0.16; c.fillStyle = 'rgba(230,236,224,0.4)'; c.beginPath(); c.arc(cx + Math.cos(a) * dd, base - S * 0.14 + Math.sin(a) * dd * 0.7, 2, 0, TAU); c.fill(); }
}

/* ── FORAMINIFERAN: a chambered spiral test with radiating pseudopodia ── */
export function microbeForam(c: Ctx, g: G, pIn: Pal): void {
  /* a foram's test is CALCITE — pale and translucent is the identity, so the
     genome tint is admitted only as a wash over it (the macroalgae rule) */
  const p = greenBias(pIn, 226, 212, 186, 0.55);
  const r = seeded(g, 0xF04A);
  const cx = S * 0.47, cy = S * 0.52;
  /* the chambers of a trochospiral test: each ~22% larger than the last and
     placed so it OVERLAPS its neighbour — they must fuse into one shell, not
     read as a handful of loose bubbles (the audit's "amorphous cell") */
  const N = 8, grow = 1.225;
  const cham: Array<[number, number, number]> = [];
  let rr = S * 0.0185;
  for (let i = 0; i < N; i++) {
    const a = 0.7 + i * 0.86;
    const d = rr * 1.52;
    cham.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr]);
    rr *= grow;
  }
  /* the fine radiating pseudopodia — they stream from the APERTURE side and
     all around the test, thinning to nothing */
  c.lineCap = 'round';
  for (let i = 0; i < 76; i++) {
    const a = (i / 76) * TAU + r() * 0.06;
    const r0 = S * (0.085 + r() * 0.05), len = S * (0.10 + r() * 0.15);
    c.strokeStyle = `rgba(${Math.min(255, p.cr + 20)},${Math.min(255, p.cg + 20)},${Math.min(255, p.cb + 24)},${0.10 + r() * 0.18})`;
    c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    c.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); c.stroke();
  }
  /* oldest chamber first so the newest sits proud on top, as it grew */
  for (let i = 0; i < N; i++) {
    const [x, y, q] = cham[i]!;
    const gg = c.createRadialGradient(x - q * 0.34, y - q * 0.4, 1, x, y, q * 1.05);
    gg.addColorStop(0, `rgb(${Math.min(255, p.cr * 1.28 | 0)},${Math.min(255, p.cg * 1.28 | 0)},${Math.min(255, p.cb * 1.28 | 0)})`);
    gg.addColorStop(0.62, p.base); gg.addColorStop(1, `rgb(${p.cr * 0.58 | 0},${p.cg * 0.58 | 0},${p.cb * 0.56 | 0})`);
    c.fillStyle = gg; c.beginPath(); c.arc(x, y, q, 0, TAU); c.fill();
    /* the SUTURE — a soft seam, not an outline: it only reads where this
       chamber meets the shell, so the test stays one solid body */
    c.strokeStyle = `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.48 | 0},0.55)`;
    c.lineWidth = 1.4; c.beginPath(); c.arc(x, y, q, 0, TAU); c.stroke();
    /* the perforate wall — a foram test is punched with fine pores */
    for (let k = 0; k < 14; k++) {
      const pa = r() * TAU, pd = Math.sqrt(r()) * q * 0.82;
      c.fillStyle = `rgba(${p.cr * 0.62 | 0},${p.cg * 0.62 | 0},${p.cb * 0.6 | 0},0.30)`;
      c.beginPath(); c.arc(x + Math.cos(pa) * pd, y + Math.sin(pa) * pd, 0.9, 0, TAU); c.fill();
    }
  }
  /* THE APERTURE — the single opening in the final chamber the pseudopodia
     stream out of */
  const [lx, ly, lq] = cham[N - 1]!;
  const aa = Math.atan2(ly - cy, lx - cx) + 0.9;
  c.fillStyle = 'rgba(24,20,14,0.62)';
  c.save(); c.translate(lx + Math.cos(aa) * lq * 0.62, ly + Math.sin(aa) * lq * 0.62); c.rotate(aa);
  c.beginPath(); c.ellipse(0, 0, lq * 0.16, lq * 0.34, 0, 0, TAU); c.fill(); c.restore();
}

/* ── the canonical TARDIGRADE: a plump 8-legged water bear with claws ── */
function shade2(p: Pal, m: number): string { return `rgb(${p.cr * m | 0},${p.cg * m | 0},${p.cb * m | 0})`; }
export function tardigrade(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x7A16);
  /* ★ WAVE 46 — THIS PAINTER DREW ONE FIXED ANIMAL. `r` was created on the line
     above and never called once: every dimension below was a constant, so every
     genome routed here rendered the SAME tardigrade and differed only in
     palette. The gold pass caught it as "the seed produced no variation", and
     the fingerprints prove it — m0·5, m2·5, m2·9 and m2·17 sit at distance
     0.00 from each other, a four-way byte-identical clique.
     ⚠ The wave-20 fix made the family PICKER spread properly (procFamilyIndex
     avalanches the seed). Nobody checked whether the families it picks can
     actually draw more than one thing. A uniform chooser over constant painters
     is still a mono-template — it just distributes the sameness evenly.
     Every axis here is a RATIO off the seed, never a canvas scale (D-ART-34,
     the fit pass erases absolute size). */
  const v = (salt: number, amt: number): number => {
    const rr = seeded(g, salt);
    return 1 + (rr() - 0.5) * 2 * amt;
  };
  const cx = S * 0.46, cy = S * 0.52,
    bw = S * 0.20 * v(0x11, 0.16), bh = S * 0.135 * v(0x22, 0.20);
  shadow(c, cx, cy + bh + S * 0.05, S * 0.20);
  /* FOUR PAIRS of stubby legs, each ending in claws — the audit's ask */
  c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const lx = cx - bw * 0.66 + i * bw * 0.44;
    for (const s of [-1, 1] as const) {
      /* ⚠ the far leg of each pair was drawn at the SAME lx with a 4px vertical
         nudge, so it vanished inside the near leg and eight legs read as four.
         Offset it BACK and darken it, the way every other paired limb in this
         codebase is handled. */
      const lo = s < 0 ? -bh * 0.30 : 0;
      const ly = cy + bh * (s < 0 ? 0.50 : 0.64);
      c.strokeStyle = s < 0 ? shade2(p, 0.55) : p.dark; c.lineWidth = bh * (s < 0 ? 0.24 : 0.30);
      c.beginPath(); c.moveTo(lx + lo, cy + bh * 0.3); c.quadraticCurveTo(lx + lo + s * bh * 0.1, ly, lx + lo - bh * 0.14, ly + bh * 0.42); c.stroke();
      c.strokeStyle = p.dark; c.lineWidth = 2;   /* the claws */
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(lx + lo - bh * 0.14, ly + bh * 0.42); c.lineTo(lx + lo - bh * 0.14 + k * 4, ly + bh * 0.60); c.stroke(); }
    }
  }
  /* the plump segmented body */
  const bg = c.createRadialGradient(cx - bw * 0.3, cy - bh * 0.4, 4, cx, cy, bw);
  bg.addColorStop(0, p.lit); bg.addColorStop(0.6, p.base); bg.addColorStop(1, p.dark);
  c.fillStyle = bg;
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(20,16,12,0.22)'; c.lineWidth = 2;   /* the cuticle segment folds */
  /* ★ wave 46 — the fold COUNT varies now too: four segments was a constant on
     an animal whose whole surface read is its segmentation. */
  const segs = 4 + Math.floor(r() * 3);
  for (let i = 1; i < segs; i++) {
    const x = cx - bw * 0.66 + i * (bw * 1.32 / segs);
    c.beginPath(); c.moveTo(x, cy - bh * 0.8); c.quadraticCurveTo(x + bh * 0.1, cy, x, cy + bh * 0.7); c.stroke();
  }
  c.strokeStyle = 'rgba(214,226,244,0.4)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, -2.8, 0.3); c.stroke();
  /* the blunt snout with the circular mouth */
  const hx = cx + bw * 0.92;
  c.fillStyle = bg; c.beginPath(); c.ellipse(hx, cy + bh * 0.1, bh * 0.5, bh * 0.55, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(20,16,14,0.7)'; c.beginPath(); c.arc(hx + bh * 0.3, cy + bh * 0.1, bh * 0.14, 0, TAU); c.fill();
  c.fillStyle = '#12151b'; c.beginPath(); c.arc(hx - bh * 0.05, cy - bh * 0.15, bh * 0.10, 0, TAU); c.fill();
}

/* ── MACROALGAE: a green sheet/mat (Sea Lettuce, Green Algae-as-flora) ── */
function greenBias(p: Pal, gr: number, gg: number, gb: number, k = 0.62): Pal {
  const j = 1 - k;
  const cr = (gr * k + p.cr * j) | 0, cg = (gg * k + p.cg * j) | 0, cb = (gb * k + p.cb * j) | 0;
  return {
    base: `rgb(${cr},${cg},${cb})`, cr, cg, cb,
    lit: `rgb(${Math.min(255, cr * 1.4 | 0)},${Math.min(255, cg * 1.4 | 0)},${Math.min(255, cb * 1.4 | 0)})`,
    dark: `rgb(${cr * 0.42 | 0},${cg * 0.42 | 0},${cb * 0.42 | 0})`,
  };
}
export function macroAlgaeSheet(c: Ctx, g: G, pIn: Pal): void {
  const p = greenBias(pIn, 58, 132, 66);
  const r = seeded(g, 0x5EA1);
  const cx = S * 0.5, base = S * 0.82;
  shadow(c, cx, base + 4, S * 0.14);
  c.fillStyle = '#4a6a3a';   /* the holdfast */
  c.beginPath(); c.ellipse(cx, base, S * 0.03, S * 0.015, 0, 0, TAU); c.fill();
  /* a few broad ruffled translucent sheets rising and swaying */
  for (let k = -1; k <= 1; k++) {
    const sway = k * S * 0.10;
    const grad = c.createLinearGradient(cx, base, cx + sway, base - S * 0.6);
    grad.addColorStop(0, p.dark); grad.addColorStop(0.5, p.base); grad.addColorStop(1, p.lit);
    c.fillStyle = grad;
    c.beginPath();
    c.moveTo(cx - S * 0.015, base);
    /* left edge, rippling up */
    for (let i = 0; i <= 10; i++) { const u = i / 10; c.lineTo(cx + sway * u - S * 0.06 * u + Math.sin(u * 9 + k) * S * 0.02, base - S * 0.62 * u); }
    /* right edge, back down */
    for (let i = 10; i >= 0; i--) { const u = i / 10; c.lineTo(cx + sway * u + S * 0.06 * u + Math.sin(u * 9 + k + 1) * S * 0.02, base - S * 0.62 * u); }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + sway, base - S * 0.6); c.stroke();
  }
  void r;
}

/* ── a single MICROALGAL cell (Green Algae-as-microbe): one cell + chloroplast ── */
export function microAlgaeCell(c: Ctx, g: G, pIn: Pal): void {
  const p = greenBias(pIn, 70, 150, 80);
  const r = seeded(g, 0x3CE1);
  /* ★ WAVE 46 — a fixed-radius sphere in a fixed place: every genome routed
     here drew the same cell, and m0·12 / m1·7 / m0·6 landed within 0.24 of one
     another. Radius, cell shape and the chloroplast's reach now come off the
     seed — an algal cell is round, but not all algal cells are the same round. */
  const cz = seeded(g, 0x3CE2);
  const rr = S * 0.14 * (0.78 + cz() * 0.46);
  const squash = 0.88 + cz() * 0.26;
  const cx = S * 0.5, cy = S * 0.5;
  const bg = c.createRadialGradient(cx - rr * 0.3, cy - rr * 0.35, 2, cx, cy, rr);
  bg.addColorStop(0, `rgba(${Math.min(255, p.cr + 60)},${Math.min(255, p.cg + 70)},${Math.min(255, p.cb + 40)},0.85)`);
  bg.addColorStop(0.7, `rgba(${p.cr},${p.cg},${p.cb},0.62)`);
  bg.addColorStop(1, `rgba(${p.cr * 0.6 | 0},${p.cg * 0.6 | 0},${p.cb * 0.6 | 0},0.35)`);
  c.fillStyle = bg; c.beginPath(); c.ellipse(cx, cy, rr, rr * squash, 0, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(240,255,230,0.35)'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, rr, rr * squash, 0, 0, TAU); c.stroke();
  /* the cup-shaped chloroplast — the defining organelle */
  c.fillStyle = 'rgba(30,90,40,0.6)';
  c.beginPath(); c.arc(cx, cy + rr * 0.15, rr * (0.58 + cz() * 0.30), 0.3, Math.PI - 0.3); c.fill();
  for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(200,240,180,0.5)'; c.beginPath(); c.arc(cx + (r() - 0.5) * rr, cy + (r() - 0.3) * rr * 0.8, 2, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(cx - rr * 0.35, cy - rr * 0.4, rr * 0.12, 0, TAU); c.fill();   /* pyrenoid glint */
}

/* ── SNOW/ICE ALGAE bloom: a tinted field speckled with cells on a pale ground ── */
export function algaeBloom(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x5A0E);
  const cx = S * 0.5, cy = S * 0.54;
  /* the snow/ice ground */
  const gg = c.createRadialGradient(cx, cy - S * 0.05, 8, cx, cy, S * 0.32);
  gg.addColorStop(0, 'rgba(230,238,248,0.9)'); gg.addColorStop(0.7, 'rgba(200,214,232,0.6)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gg; c.beginPath(); c.ellipse(cx, cy, S * 0.30, S * 0.20, 0, 0, TAU); c.fill();
  /* the coloured bloom staining it — watermelon-snow red/green per palette */
  for (let i = 0; i < 220; i++) {
    const a = r() * TAU, d = r() ** 0.5 * S * 0.28;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.66;
    c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${0.10 + r() * 0.22})`;
    c.beginPath(); c.arc(x, y, 2 + r() * 4, 0, TAU); c.fill();
  }
  for (let i = 0; i < 40; i++) { const a = r() * TAU, d = r() ** 0.6 * S * 0.26; c.fillStyle = `rgba(${Math.min(255, p.cr * 1.3 | 0)},${Math.min(255, p.cg * 1.3 | 0)},${Math.min(255, p.cb * 1.3 | 0)},0.6)`; c.beginPath(); c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.66, 1.5 + r() * 1.5, 0, TAU); c.fill(); }
}

/** ★ WAVE 17 — THE CAP-AND-STEM SYSTEM.

    Seven fungi were still unrouted, and FIVE of them are on Nick's own
    still-not-fixed list: Chanterelle, Death Cap, Destroying Angel, Shiitake,
    Jelly Fungus. His audit said the same thing about each — "current generic
    yellow/purple/red mushrooms lack <the one structure>" — and the structures
    he named are all things a shared cap-and-stem painter can carry:

      · a FUNNEL cap with a wavy lobed margin and blunt forking RIDGES running
        down the stem, which is a chanterelle and is not gills
      · a RING (the skirt left by the veil) and a VOLVA (the sac cupping the
        base) — between them the two features that identify the deadly
        amanitas, and the reason "a yellow mushroom" is not an acceptable
        Death Cap
      · a PORE surface instead of gills, over a barrel stem with a raised white
        net — a bolete is a different animal from an agaric
      · veil FRINGE on an inrolled margin, and a CRACKED cap showing pale flesh

    The colour is forced for the species whose colour IS the identification,
    because for a Death Cap and a Destroying Angel getting that wrong is not a
    cosmetic error. */
export interface CapSpec {
  cap: 'convex' | 'funnel' | 'flat' | 'domed';
  gills: 'blade' | 'ridge' | 'pore' | 'none';
  hue: string;
  gillHue?: string;
  stem?: 'slender' | 'stout' | 'bulbous';
  ring?: boolean;
  volva?: boolean;
  net?: boolean;
  veil?: boolean;
  crack?: boolean;
  glow?: boolean;
  fibrils?: boolean;   /** faint radiating fibres on the cap (Death Cap) */
  count?: number;
  scale?: number;
}
/* ★ D-ART-116 — THE DAMP SHEEN. A mushroom cap is the one surface in the
   catalogue that is genuinely slightly WET, and a flat radial gradient cannot
   say so. The gills, pores and fibrils were already modelled (waves 14-18);
   this is the last thing separating a cap from a painted dome: a tight
   off-centre highlight up and left, matching the engine light, falling off
   fast the way a moist curved surface does rather than blooming like paint. */
function capSheen(c: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  if (rx < 6) return;
  c.save();
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, Math.PI, TAU); c.clip();
  const hx = cx - rx * 0.34, hy = cy - ry * 0.52;
  const g = c.createRadialGradient(hx, hy, rx * 0.02, hx, hy, rx * 0.62);
  g.addColorStop(0, 'rgba(255,253,245,0.30)');
  g.addColorStop(0.35, 'rgba(255,253,245,0.11)');
  g.addColorStop(1, 'rgba(255,253,245,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, Math.PI, TAU); c.fill();
  c.restore();
}

export function fungiCap(c: Ctx, g: G, _p: Pal, spec: CapSpec): void {
  const r = seeded(g, 0xC4B7);
  const n = spec.count ?? 1;
  const base = S * 0.78;
  shadow(c, S * 0.5, base + 4, S * 0.20);

  for (let k = 0; k < n; k++) {
    const t = n === 1 ? 0.5 : k / (n - 1);
    const sc = (spec.scale ?? 1) * (n === 1 ? 1 : 0.52 + r() * 0.30);
    const cx = S * 0.5 + (n === 1 ? 0 : (t - 0.5) * S * 0.26) + (r() - 0.5) * S * 0.02;
    const stemH = S * 0.20 * sc * (spec.stem === 'slender' ? 1.22 : spec.stem === 'bulbous' ? 0.78 : 1);
    const capW = S * 0.105 * sc * (spec.cap === 'funnel' ? 1.05 : 1);
    const capY = base - stemH;

    /* ── the VOLVA: a sac-like cup the stem grows out of. On an amanita this
       is the single feature that separates edible from lethal. ── */
    if (spec.volva) {
      c.fillStyle = '#efeadd';
      c.beginPath();
      c.moveTo(cx - capW * 0.44, base);
      c.quadraticCurveTo(cx - capW * 0.50, base - stemH * 0.20, cx - capW * 0.22, base - stemH * 0.24);
      c.lineTo(cx + capW * 0.22, base - stemH * 0.24);
      c.quadraticCurveTo(cx + capW * 0.50, base - stemH * 0.20, cx + capW * 0.44, base);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,112,96,0.40)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(cx - capW * 0.24, base - stemH * 0.22); c.lineTo(cx - capW * 0.02, base - stemH * 0.10); c.stroke();
    }

    /* ── the stem ── */
    const sw = capW * (spec.stem === 'bulbous' ? 0.46 : spec.stem === 'slender' ? 0.17 : 0.24);
    const sg = c.createLinearGradient(cx - sw, 0, cx + sw, 0);
    const stemHue = spec.gillHue ?? '#efe9d8';
    sg.addColorStop(0, stemHue);
    sg.addColorStop(0.45, stemHue);
    sg.addColorStop(1, 'rgba(0,0,0,0.22)');
    c.fillStyle = sg;
    c.beginPath();
    if (spec.stem === 'bulbous') {
      /* a porcini's stem is FATTER than its cap is tall — the whole read */
      c.moveTo(cx - sw * 0.62, capY);
      c.quadraticCurveTo(cx - sw * 1.30, capY + stemH * 0.55, cx - sw * 0.92, base);
      c.lineTo(cx + sw * 0.92, base);
      c.quadraticCurveTo(cx + sw * 1.30, capY + stemH * 0.55, cx + sw * 0.62, capY);
    } else {
      c.moveTo(cx - sw, capY);
      c.quadraticCurveTo(cx - sw * 1.10, capY + stemH * 0.6, cx - sw * 0.86, base);
      c.lineTo(cx + sw * 0.86, base);
      c.quadraticCurveTo(cx + sw * 1.10, capY + stemH * 0.6, cx + sw, capY);
    }
    c.closePath(); c.fill();
    if (spec.net) {
      /* the raised white reticulation over a bolete's upper stem */
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.1;
      for (let i = 0; i < 7; i++) {
        const y = capY + stemH * (0.06 + i * 0.055);
        c.beginPath(); c.moveTo(cx - sw * 0.9, y); c.lineTo(cx + sw * 0.9, y); c.stroke();
      }
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.moveTo(cx + i * sw * 0.4, capY); c.lineTo(cx + i * sw * 0.44, capY + stemH * 0.42); c.stroke();
      }
    }
    if (spec.ring) {
      /* the skirt — the torn veil left hanging on the stem */
      c.fillStyle = '#f4efe2';
      c.beginPath();
      c.ellipse(cx, capY + stemH * 0.30, sw * 2.1, stemH * 0.055, 0, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(190,182,164,0.6)';
      c.beginPath();
      c.moveTo(cx - sw * 2.0, capY + stemH * 0.30);
      c.quadraticCurveTo(cx, capY + stemH * 0.40, cx + sw * 2.0, capY + stemH * 0.30);
      c.lineTo(cx + sw * 1.7, capY + stemH * 0.31);
      c.quadraticCurveTo(cx, capY + stemH * 0.36, cx - sw * 1.7, capY + stemH * 0.31);
      c.closePath(); c.fill();
    }

    /* ── the underside: BLADE gills, forking RIDGES, or a PORE sponge ── */
    const und = spec.gillHue ?? '#efe6d0';
    if (spec.gills !== 'none' && spec.cap !== 'funnel') {
      c.fillStyle = und;
      c.beginPath(); c.ellipse(cx, capY + capW * 0.10, capW * 0.94, capW * 0.20, 0, 0, Math.PI); c.fill();
      if (spec.gills === 'pore') {
        /* a sponge, not blades — a bolete has no gills at all */
        c.fillStyle = 'rgba(120,110,74,0.45)';
        for (let i = 0; i < 46; i++) {
          const px = cx + (r() - 0.5) * capW * 1.7, py = capY + capW * (0.02 + r() * 0.16);
          c.beginPath(); c.arc(px, py, 0.9 + r() * 0.7, 0, TAU); c.fill();
        }
      } else {
        c.strokeStyle = 'rgba(120,108,86,0.42)'; c.lineWidth = 1;
        for (let i = -9; i <= 9; i++) {
          const px = cx + (i / 9) * capW * 0.88;
          c.beginPath(); c.moveTo(px, capY + capW * 0.02);
          c.lineTo(px * 0.06 + cx * 0.94, capY + capW * 0.20); c.stroke();
        }
      }
    }

    /* ── the cap ── */
    c.fillStyle = lit3(c, spec.hue, cx, capY, capW);
    c.beginPath();
    if (spec.cap === 'funnel') {
      /* ★ THE CHANTERELLE. Nick's note: "blunt forking ridges, not blade gills;
         a VASE profile, not a flat cap." A funnel dips in the centre and its
         margin is wavy and irregularly lobed — nothing like a domed agaric. */
      c.moveTo(cx - capW, capY - capW * 0.10);
      c.quadraticCurveTo(cx - capW * 0.55, capY + capW * 0.34, cx, capY + capW * 0.16);
      c.quadraticCurveTo(cx + capW * 0.55, capY + capW * 0.34, cx + capW, capY - capW * 0.10);
      c.quadraticCurveTo(cx + capW * 0.62, capY - capW * 0.46, cx, capY - capW * 0.30);
      c.quadraticCurveTo(cx - capW * 0.62, capY - capW * 0.46, cx - capW, capY - capW * 0.10);
      c.closePath(); c.fill();
      /* the ridges RUN DOWN onto the stem — decurrent, blunt, forking */
      c.strokeStyle = 'rgba(150,110,40,0.45)'; c.lineWidth = 1.6; c.lineCap = 'round';
      for (let i = -5; i <= 5; i++) {
        const px = cx + (i / 5) * capW * 0.78;
        c.beginPath(); c.moveTo(px, capY + capW * 0.08);
        c.quadraticCurveTo(cx + (px - cx) * 0.4, capY + capW * 0.34, cx + (px - cx) * 0.13, capY + stemH * 0.22);
        c.stroke();
      }
    } else if (spec.cap === 'flat') {
      c.ellipse(cx, capY, capW, capW * 0.30, 0, Math.PI, TAU); c.fill();
      capSheen(c, cx, capY, capW, capW * 0.30);
    } else {
      const dome = spec.cap === 'domed' ? 0.78 : 0.56;
      c.ellipse(cx, capY + capW * 0.06, capW, capW * dome, 0, Math.PI, TAU); c.fill();
      capSheen(c, cx, capY + capW * 0.06, capW, capW * dome);
      if (spec.veil) {
        /* the inrolled margin fringed with white veil remnants (shiitake) */
        c.fillStyle = 'rgba(244,240,228,0.85)';
        for (let i = -6; i <= 6; i++) {
          const px = cx + (i / 6) * capW * 0.92;
          c.beginPath(); c.ellipse(px, capY + capW * 0.06, capW * 0.06, capW * 0.05, 0, 0, TAU); c.fill();
        }
      }
      if (spec.fibrils) {
        /* the faint radiating fibrils its row names — and the thing that
           distinguishes a Death Cap from the plain white Destroying Angel */
        c.strokeStyle = 'rgba(70,86,44,0.34)'; c.lineWidth = 1;
        for (let i = 0; i < 22; i++) {
          const a = Math.PI + (i / 21) * Math.PI;
          c.beginPath();
          c.moveTo(cx + Math.cos(a) * capW * 0.20, capY + capW * 0.06 + Math.sin(a) * capW * dome * 0.20);
          c.lineTo(cx + Math.cos(a) * capW * 0.95, capY + capW * 0.06 + Math.sin(a) * capW * dome * 0.95);
          c.stroke();
        }
      }
      if (spec.crack) {
        /* a shiitake's cap splits, showing pale flesh through the brown */
        c.fillStyle = 'rgba(238,230,212,0.72)';
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI * (0.15 + r() * 0.7), d = 0.25 + r() * 0.6;
          c.save();
          c.translate(cx + Math.cos(a) * capW * d, capY + capW * 0.06 + Math.sin(a) * capW * dome * d);
          c.rotate(a);
          c.beginPath(); c.ellipse(0, 0, capW * (0.09 + r() * 0.09), capW * 0.035, 0, 0, TAU); c.fill();
          c.restore();
        }
      }
    }
    if (spec.glow) {
      /* the light comes from the GILLS and the stem, never the cap top */
      const gg = c.createRadialGradient(cx, capY + capW * 0.16, 1, cx, capY + capW * 0.16, capW * 2.2);
      gg.addColorStop(0, 'rgba(150,255,190,0.55)');
      gg.addColorStop(0.45, 'rgba(110,230,160,0.20)');
      gg.addColorStop(1, 'rgba(110,230,160,0)');
      c.fillStyle = gg;
      c.beginPath(); c.arc(cx, capY + capW * 0.16, capW * 2.2, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(190,255,215,0.85)'; c.lineWidth = 1.2;
      for (let i = -6; i <= 6; i++) {
        const px = cx + (i / 6) * capW * 0.84;
        c.beginPath(); c.moveTo(px, capY + capW * 0.03); c.lineTo(cx + (px - cx) * 0.2, capY + capW * 0.20); c.stroke();
      }
    }
    c.strokeStyle = 'rgba(240,246,252,0.20)'; c.lineWidth = 2;
    c.beginPath();
    c.ellipse(cx, capY + capW * 0.06, capW * 0.96, capW * 0.52, 0, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
  }
}

/** ★ THE JELLY FUNGUS — Nick's row: "current cap-and-stem mushrooms do not
    represent gelatinous lobes or ears". It has no stem at all: it is a
    translucent brain of convoluted folds sitting straight on the bark. */
export function fungiJellyBrain(c: Ctx, g: G, p: Pal): void {
  const r = seeded(g, 0x1E11);
  const cx = S * 0.50, cy = S * 0.56, R = S * 0.155;
  shadow(c, cx, cy + R * 0.92, R * 0.94);
  /* the bark it sits on, because "no stem" needs something to sit ON */
  c.fillStyle = '#4a3a2a';
  c.beginPath(); c.ellipse(cx, cy + R * 0.86, R * 1.05, R * 0.20, 0, 0, TAU); c.fill();
  const lobes: Array<[number, number, number]> = [];
  for (let i = 0; i < 11; i++) {
    const a = r() * TAU, d = r() * R * 0.52;
    lobes.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.74, R * (0.30 + r() * 0.34)]);
  }
  /* translucency: overlapping soft lobes at partial alpha, so light passes
     through where they cross — which is what "gelatinous" looks like */
  for (const [lx, ly, lr] of lobes) {
    const gg = c.createRadialGradient(lx - lr * 0.3, ly - lr * 0.35, lr * 0.1, lx, ly, lr);
    gg.addColorStop(0, `rgba(${Math.min(255, p.cr * 1.5) | 0},${Math.min(255, p.cg * 1.3) | 0},${Math.min(255, p.cb * 1.2) | 0},0.62)`);
    gg.addColorStop(0.7, `rgba(${p.cr | 0},${p.cg | 0},${p.cb | 0},0.50)`);
    gg.addColorStop(1, `rgba(${(p.cr * 0.6) | 0},${(p.cg * 0.6) | 0},${(p.cb * 0.62) | 0},0.30)`);
    c.fillStyle = gg;
    c.beginPath(); c.ellipse(lx, ly, lr, lr * 0.82, r() * TAU, 0, TAU); c.fill();
  }
  /* the brain-like convolutions */
  c.strokeStyle = `rgba(${(p.cr * 0.55) | 0},${(p.cg * 0.55) | 0},${(p.cb * 0.58) | 0},0.5)`;
  c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const a = r() * TAU, d = r() * R * 0.62;
    const sx = cx + Math.cos(a) * d, sy = cy + Math.sin(a) * d * 0.74;
    c.beginPath();
    c.moveTo(sx, sy);
    c.quadraticCurveTo(sx + (r() - 0.5) * R * 0.5, sy + (r() - 0.5) * R * 0.4,
      sx + (r() - 0.5) * R * 0.7, sy + (r() - 0.5) * R * 0.5);
    c.stroke();
  }
  c.strokeStyle = 'rgba(255,255,255,0.30)'; c.lineWidth = 2.4;
  c.beginPath(); c.ellipse(cx - R * 0.16, cy - R * 0.30, R * 0.34, R * 0.20, -0.4, Math.PI, TAU); c.stroke();
}
