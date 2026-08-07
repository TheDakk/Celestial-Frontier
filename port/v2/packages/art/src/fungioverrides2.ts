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
  /* ★ WAVE 63 — THE CASCADE IS THE SPECIES. gp3: "a pom-pom of LONG icicle
     spines cascading downward over the whole mass". The old spines were short
     stubs on the underside; they now drape the ENTIRE ball — long tapering
     icicles from every part of the surface, longest at the bottom, so the
     silhouette itself is a shaggy waterfall of teeth. */
  c.lineCap = 'round';
  for (let i = 0; i < 160; i++) {
    const a = r() * TAU, d = r() ** 0.5 * R * 1.0;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 1.05;
    /* longer the lower the root sits — the cascade grows down the face */
    const droop = 0.52 + ((y - (cy - R)) / (2 * R)) * 0.48;
    const len = R * droop * (0.7 + r() * 0.6);
    c.strokeStyle = i % 3 ? '#efe7d2' : '#d8cdb0'; c.lineWidth = 3.4 - (i % 2);
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + (r() - 0.5) * 5, y + len * 0.6, x + (r() - 0.5) * 9, y + len);
    c.stroke();
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
  /* ★ WAVE 63 — RUFFLED SPOON FRONDS. gp3: "smooth chocolate lobes with no
     ruffled spoon-shaped fronds". Each frond is now a small FAN with a wavy
     outer margin and a pale growing edge, pointing outward from the rosette. */
  for (let i = 0; i < 60; i++) {
    const ring = i % 3;                              /* three concentric rows fill the rosette */
    const t = (i / 59);
    const a = -Math.PI * 0.9 + t * Math.PI * 0.8;
    const rad = S * (0.05 + ring * 0.065);
    const fx = cx + Math.cos(a) * rad, fy = base - S * 0.10 - Math.abs(Math.sin(a)) * S * (0.10 + ring * 0.07) - ring * 5;
    const out = Math.atan2(fy - (base - S * 0.22), fx - cx);   /* frond points outward */
    const fl = S * (0.065 + r() * 0.03), fw = fl * 0.62;
    c.fillStyle = lit3(c, brown, fx, fy, fl);
    c.save(); c.translate(fx, fy); c.rotate(out + (r() - 0.5) * 0.4);
    c.beginPath(); c.moveTo(0, 0);
    /* the fan: out to a WAVY margin traced in three scallops */
    c.quadraticCurveTo(fl * 0.5, -fw * 0.7, fl * 0.9, -fw * 0.5);
    c.quadraticCurveTo(fl * 1.02, -fw * 0.2, fl * 0.94, 0);
    c.quadraticCurveTo(fl * 1.06, fw * 0.25, fl * 0.9, fw * 0.5);
    c.quadraticCurveTo(fl * 0.5, fw * 0.7, 0, 0);
    c.closePath(); c.fill();
    /* the pale wavy growing edge */
    c.strokeStyle = 'rgba(238,228,204,0.55)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(fl * 0.9, -fw * 0.5);
    c.quadraticCurveTo(fl * 1.02, -fw * 0.2, fl * 0.94, 0);
    c.quadraticCurveTo(fl * 1.06, fw * 0.25, fl * 0.9, fw * 0.5); c.stroke();
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
  /* ★ WAVE 64 — THE HOST IS AN INSECT, not "an anonymous smooth ellipse"
     (gp3). A curled segmented caterpillar with a dark head capsule and stubby
     legs — the horror of a cordyceps needs a recognisable victim. */
  c.fillStyle = '#5a4632';
  const segN = 7;
  for (let i = 0; i < segN; i++) {   /* overlapping segments in a curl */
    const u = i / (segN - 1);
    const sx = cx - S * 0.12 + u * S * 0.24, sy = base - Math.sin(u * Math.PI) * S * 0.028;
    const sr = S * (0.030 - Math.abs(u - 0.4) * 0.012);
    const gg = c.createRadialGradient(sx - sr * 0.3, sy - sr * 0.4, 1, sx, sy, sr * 1.1);
    gg.addColorStop(0, '#7a6248'); gg.addColorStop(1, '#42321f');
    c.fillStyle = gg; c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
  }
  c.fillStyle = '#2c2014';   /* the head capsule, tucked down */
  c.beginPath(); c.arc(cx + S * 0.125, base + S * 0.008, S * 0.024, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(30,22,14,0.8)'; c.lineWidth = 2; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {   /* stubby legs beneath */
    const x = cx - S * 0.08 + i * S * 0.045;
    c.beginPath(); c.moveTo(x, base + S * 0.02); c.lineTo(x + S * 0.008, base + S * 0.042); c.stroke();
  }
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
  /* ★ WAVE 68 — the branching starts AT THE GROUND. gp3 failed it for 'eight
     thick bare vertical trunks' under the fine crown: short thin first
     segments, more of them, so the cushion sits on fuzz, not on stilts. */
  for (let k = -4; k <= 4; k++) draw(cx + k * S * 0.030, base, -Math.PI / 2 + k * 0.11, S * 0.062, 3.6, 0);
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
/** ★ WAVE 56 — 'filament', because Sea Lettuce and Green Algae were the SAME
    CALL. Both routed to this painter with no argument at all — same function,
    same seed — so [SHAPE] had them at 0.12, second on the backlog behind the
    ice/snow pair. Their reference rows are not close: sea lettuce is
    "paper-thin translucent membranous sheets with wildly ruffled crinkled
    edges", which is what this painter draws and draws well; green algae is
    "soft hair-like filaments or tubular strands in loose tufts" with "no
    stem" — a drifting hair tuft, which this painter had no way to say. */
export function macroAlgaeSheet(c: Ctx, g: G, pIn: Pal, form: 'sheet' | 'filament' = 'sheet'): void {
  const p = greenBias(pIn, 58, 132, 66);
  const r = seeded(g, form === 'filament' ? 0xF11A : 0x5EA1);
  const cx = S * 0.5, base = S * 0.82;
  if (form === 'filament') {
    /* a loose tuft: many fine strands from a small holdfast, splaying and
       curling as they rise. No sheet, no midrib, no stem. */
    shadow(c, cx, base + 4, S * 0.08);
    c.fillStyle = '#4a6a3a';
    c.beginPath(); c.ellipse(cx, base, S * 0.022, S * 0.011, 0, 0, TAU); c.fill();
    c.lineCap = 'round';
    for (let i = 0; i < 130; i++) {
      const lean = (r() - 0.5) * 2;
      const L = S * (0.20 + r() ** 0.7 * 0.42);
      const tipX = cx + lean * S * 0.26 * (0.4 + r() * 0.6);
      const tipY = base - L;
      const lit = 0.55 + r() * 0.45;
      c.strokeStyle = `rgba(${Math.min(255, p.cr * lit + 30 | 0)},${Math.min(255, p.cg * lit + 46 | 0)},${Math.min(255, p.cb * lit + 24 | 0)},${0.38 + r() * 0.5})`;
      c.lineWidth = 1 + r() * 2.1;
      c.beginPath(); c.moveTo(cx + (r() - 0.5) * S * 0.03, base);
      c.quadraticCurveTo(cx + lean * S * 0.10, base - L * 0.58, tipX, tipY);
      c.stroke();
    }
    return;
  }
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
/** ★ WAVE 56 — THE SUBSTRATE, because Ice Algae and Snow Algae were ONE
    PICTURE. Both routed here and the only thing that differed was the hue, so
    artlock's colour-blind [SHAPE] check put them at distance **0.00** — the
    top row of the backlog and the most literal duplicate in the catalogue.
    They are not the same organism and their reference rows never said they
    were. Snow algae is "pink-red staining lying in patches across snow" with
    "a sharp boundary where footprints or melt channels cut the colour". Ice
    algae is "brown-gold staining and drips on the UNDERSIDE of ice" with
    "stringy mucilage strands trailing down into the water" — it hangs from a
    ceiling, and nothing in this painter could hang.
    The rng salt differs too: with one seed the 220 bloom specks landed in
    identical positions, so even a real structural change would have left the
    stain itself a perfect match. */
export function algaeBloom(c: Ctx, g: G, p: Pal, mode: 'snow' | 'ice' = 'snow'): void {
  const r = seeded(g, mode === 'ice' ? 0x1CE0 : 0x5A0E);
  const cx = S * 0.5, cy = mode === 'ice' ? S * 0.40 : S * 0.54;
  if (mode === 'ice') {
    /* THE ICE IS A CEILING. A slab across the top, its underside stained, with
       mucilage strands hanging into open water below — the whole read is
       "this is clinging beneath something", which no amount of recolouring a
       snow field could say. */
    const ig = c.createLinearGradient(0, S * 0.06, 0, cy);
    ig.addColorStop(0, 'rgba(226,238,250,0.95)'); ig.addColorStop(0.72, 'rgba(188,208,228,0.80)');
    ig.addColorStop(1, 'rgba(150,176,200,0.55)');
    c.fillStyle = ig; c.beginPath(); c.rect(0, S * 0.04, S, cy - S * 0.04); c.fill();
    /* the brine channels cutting up into the slab */
    c.strokeStyle = 'rgba(120,150,178,0.45)'; c.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = S * (0.08 + r() * 0.84);
      c.beginPath(); c.moveTo(x, cy); c.lineTo(x + (r() - 0.5) * S * 0.05, cy - S * (0.10 + r() * 0.18)); c.stroke();
    }
    /* the stained underside, then the strands trailing DOWN out of it */
    for (let i = 0; i < 200; i++) {
      const x = cx + (r() - 0.5) * S * 0.84, y = cy - r() ** 1.6 * S * 0.11;
      c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${0.12 + r() * 0.28})`;
      c.beginPath(); c.arc(x, y, 2 + r() * 5, 0, TAU); c.fill();
    }
    c.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = S * (0.07 + r() * 0.86), L = S * (0.06 + r() ** 1.5 * 0.34);
      c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},${0.30 + r() * 0.40})`;
      c.lineWidth = 1.2 + r() * 2.6;
      c.beginPath(); c.moveTo(x, cy - S * 0.01);
      c.quadraticCurveTo(x + (r() - 0.5) * S * 0.06, cy + L * 0.55, x + (r() - 0.5) * S * 0.09, cy + L);
      c.stroke();
      /* the drip at the tip — the reference row asks for drips by name */
      if (r() > 0.55) {
        c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.55)`;
        c.beginPath(); c.arc(x + (r() - 0.5) * S * 0.09, cy + L, 1.6 + r() * 2.4, 0, TAU); c.fill();
      }
    }
    return;
  }
  /* the snow ground */
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
  /* ★ the SHARP BOUNDARY the reference row names — a melt channel or a
     footprint cutting clean through the stain. It is the one hard edge on an
     organism that otherwise has no edges at all, so it is the read. */
  /* ⚠ at lineWidth S*0.02–0.05 and full alpha these read as two black BARS
     painted across the bloom, not as channels cut through it. A melt channel
     is a narrow parting that clears most but not all of the stain. */
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.globalAlpha = 0.72;
  for (let i = 0; i < 2; i++) {
    const y0 = cy + (r() - 0.5) * S * 0.26;
    c.strokeStyle = 'rgba(0,0,0,1)'; c.lineWidth = S * (0.006 + r() * 0.008); c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - S * (0.16 + r() * 0.14), y0);
    c.quadraticCurveTo(cx, y0 + (r() - 0.5) * S * 0.10, cx + S * (0.16 + r() * 0.14), y0 + (r() - 0.5) * S * 0.10);
    c.stroke();
  }
  c.restore();
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
      /* ★ WAVE 67 — the dished centre is WARM GOLD, not a black hole. gp3:
         "the cap upper surface renders as a hard-edged near-black ellipse".
         The vase interior is the same egg-yolk flesh, just a shade deeper. */
      {
        const ig = c.createRadialGradient(cx, capY - capW * 0.20, 1, cx, capY - capW * 0.20, capW * 0.6);
        ig.addColorStop(0, 'rgba(178,118,30,0.95)'); ig.addColorStop(0.7, 'rgba(214,148,44,0.9)'); ig.addColorStop(1, 'rgba(232,163,58,0.0)');
        c.fillStyle = ig;
        c.beginPath(); c.ellipse(cx, capY - capW * 0.22, capW * 0.62, capW * 0.15, 0, 0, TAU); c.fill();
      }
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
  /* ★ WAVE 63 — DEEP BRAIN FOLDS. gp3: "the convoluted brain-like folding that
     IS this organism is absent". Each fold is a dark VALLEY stroke with a lit
     ridge highlight hugging its edge — twice as many, wider, wandering in arcs
     so the surface reads as folded flesh, not a smooth blob with pencil lines. */
  c.lineCap = 'round';
  for (let i = 0; i < 24; i++) {
    const a = r() * TAU, d = r() * R * 0.66;
    const sx = cx + Math.cos(a) * d, sy = cy + Math.sin(a) * d * 0.74;
    const ex = sx + (r() - 0.5) * R * 0.9, ey = sy + (r() - 0.5) * R * 0.6;
    const mx = (sx + ex) / 2 + (r() - 0.5) * R * 0.5, my = (sy + ey) / 2 + (r() - 0.5) * R * 0.4;
    c.strokeStyle = `rgba(${(p.cr * 0.42) | 0},${(p.cg * 0.42) | 0},${(p.cb * 0.45) | 0},0.65)`;
    c.lineWidth = 4.5;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 1.6) | 0},${Math.min(255, p.cg * 1.4) | 0},${Math.min(255, p.cb * 1.3) | 0},0.45)`;
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(sx, sy - 3); c.quadraticCurveTo(mx, my - 3, ex, ey - 3); c.stroke();
  }
  c.strokeStyle = 'rgba(255,255,255,0.30)'; c.lineWidth = 2.4;
  c.beginPath(); c.ellipse(cx - R * 0.16, cy - R * 0.30, R * 0.34, R * 0.20, -0.4, Math.PI, TAU); c.stroke();
}
