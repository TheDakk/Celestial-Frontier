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
  const cx = S * 0.46, cy = S * 0.52, bw = S * 0.20, bh = S * 0.135;
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
  for (let i = 1; i < 5; i++) { const x = cx - bw * 0.6 + i * bw * 0.3; c.beginPath(); c.moveTo(x, cy - bh * 0.8); c.quadraticCurveTo(x + bh * 0.1, cy, x, cy + bh * 0.7); c.stroke(); }
  c.strokeStyle = 'rgba(214,226,244,0.4)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, -2.8, 0.3); c.stroke();
  /* the blunt snout with the circular mouth */
  const hx = cx + bw * 0.92;
  c.fillStyle = bg; c.beginPath(); c.ellipse(hx, cy + bh * 0.1, bh * 0.5, bh * 0.55, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(20,16,14,0.7)'; c.beginPath(); c.arc(hx + bh * 0.3, cy + bh * 0.1, bh * 0.14, 0, TAU); c.fill();
  c.fillStyle = '#12151b'; c.beginPath(); c.arc(hx - bh * 0.05, cy - bh * 0.15, bh * 0.10, 0, TAU); c.fill();
  void r;
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
  const cx = S * 0.5, cy = S * 0.5, rr = S * 0.14;
  const bg = c.createRadialGradient(cx - rr * 0.3, cy - rr * 0.35, 2, cx, cy, rr);
  bg.addColorStop(0, `rgba(${Math.min(255, p.cr + 60)},${Math.min(255, p.cg + 70)},${Math.min(255, p.cb + 40)},0.85)`);
  bg.addColorStop(0.7, `rgba(${p.cr},${p.cg},${p.cb},0.62)`);
  bg.addColorStop(1, `rgba(${p.cr * 0.6 | 0},${p.cg * 0.6 | 0},${p.cb * 0.6 | 0},0.35)`);
  c.fillStyle = bg; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(240,255,230,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.stroke();
  /* the cup-shaped chloroplast — the defining organelle */
  c.fillStyle = 'rgba(30,90,40,0.6)';
  c.beginPath(); c.arc(cx, cy + rr * 0.15, rr * 0.72, 0.3, Math.PI - 0.3); c.fill();
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
