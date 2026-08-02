/* invertoverrides.ts — THE MORPHOLOGY PASS, wave 10b: THE INVERTEBRATES.
   The last large uncovered block: ~67 arthropods and ~22 soft-bodied and
   radial animals. Wave 3 gave beetles, dragonflies, the springtail, the
   fiddler crab and the horseshoe crab real bodies and they scored well, so
   they are deliberately ABSENT here (D-ART-14).

   Body plans, not decorations — an arthropod is legible almost entirely
   from its TAGMATA (how many body sections) and its LEG COUNT:
     · insect     3 sections · 6 legs · antennae
     · arachnid   2 sections · 8 legs · NO antennae
     · myriapod   many segments, a leg pair on each
     · crab       one wide carapace, claws forward, 8 walking legs
     · shrimp     a curled abdomen ending in a tail fan
   and the soft-bodied ones from how they hold water: a worm's segments, a
   slug's foot and cerata, a jelly's bell and trailing tentacles, a coral's
   branching, a sponge's tube.

   Every key was read out of the catalog (the wave-7 lesson) and is checked
   by tools/overridecheck.mjs; the shadow check keeps it from re-covering
   what waves 3 and 7 already own. */
import { mulberry32, TAU } from '@cf/domain-rand';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
export type PainterI = (c: Ctx, g: G, p: Pal, name: string) => void;
const S = 440;

function nseed(name: string): number {
  let h = 0x1B7F;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return h >>> 0;
}
const nrng = (g: G, name: string, salt: number): (() => number) => mulberry32((((g.seed as number) ^ nseed(name) ^ salt) >>> 0));
/* THE BUCKET BUG: this helper quantised the name hash to 1,000 buckets, so
   at 650 species two names sharing a spec collided by birthday — the audit's
   duplicate sentinel caught Copepod = Tadpole Shrimp. It uses the full 32-bit
   hash now, and the same one-line fix was applied to every wave that copied
   it (7, 8, 9, 10a, 10b). */
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
const nv = (name: string, salt: number, amt: number): number =>
  1 + (mixSalt(nseed(name), salt) / 4294967296 - 0.5) * 2 * amt;

function shadow(c: Ctx, cx: number, cy: number, rx: number): void {
  c.fillStyle = 'rgba(0,0,0,0.42)';
  c.beginPath(); c.ellipse(cx, cy, rx, S * 0.026, 0, 0, TAU); c.fill();
}
function shell(c: Ctx, p: Pal, x: number, y: number, r: number): CanvasGradient {
  const gg = c.createRadialGradient(x - r * 0.34, y - r * 0.40, 2, x, y, r * 1.18);
  gg.addColorStop(0, p.lit); gg.addColorStop(0.58, p.base); gg.addColorStop(1, p.dark);
  return gg;
}
function rim(c: Ctx, path: () => void, w = 2): void {
  c.save(); c.strokeStyle = 'rgba(212,226,246,0.38)'; c.lineWidth = w;
  c.beginPath(); path(); c.stroke(); c.restore();
}
function softMark(c: Ctx, x: number, y: number, rx: number, ry: number, rgb: string, a: number, rot = 0): void {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, ry / rx);
  const gg = c.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx);
  gg.addColorStop(0, `rgba(${rgb},${a})`); gg.addColorStop(0.55, `rgba(${rgb},${a * 0.8})`);
  gg.addColorStop(0.82, `rgba(${rgb},${a * 0.32})`); gg.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = gg; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
}
function eyeDot(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#0d1017'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.32, r * 0.30, 0, TAU); c.fill();
}
/** a jointed limb — D-ART-31, which is even more of the read on a spider */
function limb(c: Ctx, x0: number, y0: number, x1: number, y1: number, kx: number, ky: number, w: number, col: string): void {
  c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = w;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(kx, ky); c.stroke();
  c.lineWidth = w * 0.62;
  c.beginPath(); c.moveTo(kx, ky); c.lineTo(x1, y1); c.stroke();
}

/* ═══════════════ INSECTS: three tagmata, six legs, antennae ═══════════════ */
export interface InsectSpec {
  wings?: 'none' | 'folded' | 'open' | 'lace';
  waist?: boolean;            /** the wasp/ant petiole */
  abdomen: number;            /** abdomen length multiplier */
  antennae?: 'short' | 'long' | 'feather' | 'none';
  sting?: boolean;
  raptor?: boolean;           /** mantis forelegs */
  jumper?: boolean;           /** the huge hind femur of a grasshopper */
  stick?: boolean;            /** absurdly elongated everything */
  fuzzy?: boolean;            /** the bee/bumblebee pile */
  pattern?: 'bands' | 'spots';
}
export function insectBody(c: Ctx, g: G, p: Pal, spec: InsectSpec, name = ''): void {
  const r = nrng(g, name, 0x15EC);
  const cx = S * 0.50, cy = S * 0.52;
  const sc = (spec.stick ? 1.35 : 1) * nv(name, 0x11, 0.10);
  const th = S * 0.052 * sc * (spec.stick ? 0.42 : 1);          /* thorax half-height */
  /* the abdomen-to-thorax RATIO, which survives the fit pass where a shared
     overall scale would not */
  const abL = S * 0.105 * spec.abdomen * sc * nv(name, 0x12, 0.18);
  shadow(c, cx, cy + th * 2.6, S * 0.15);

  /* ── six legs: three a side, jointed, the middle pair splayed widest ── */
  const legCol = p.dark;
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 3; i++) {
      const bx = cx - th * 0.8 + i * th * 0.9;
      const spread = (0.9 + i * 0.32) * th * (spec.stick ? 3.2 : 1.9);
      const drop = th * (1.5 + i * 0.30);
      const jump = spec.jumper && i === 2;
      if (jump) {   /* THE JUMPING FEMUR — a grasshopper's whole silhouette */
        c.fillStyle = shell(c, p, bx + s * th * 0.3, cy + th * 0.2, th * 0.9);
        c.save(); c.translate(bx + s * th * 0.35, cy + th * 0.15); c.rotate(s * 0.55);
        c.beginPath(); c.ellipse(0, 0, th * 0.95, th * 0.42, 0, 0, TAU); c.fill(); c.restore();
        limb(c, bx + s * th * 0.9, cy + th * 0.5, bx + s * spread * 0.7, cy + drop * 1.5,
          bx + s * spread * 1.25, cy + th * 0.1, 4.2, legCol);
      } else {
        limb(c, bx, cy + th * 0.5, bx + s * spread * 0.72, cy + drop,
          bx + s * spread, cy + th * (spec.stick ? -0.6 : 0.1), spec.stick ? 3 : 4, legCol);
      }
    }
  }
  if (spec.raptor) {   /* THE MANTIS STRIKE — folded, spined, held up front */
    for (const s of [-1, 1] as const) {
      const ox = cx - th * 1.5, oy = cy - th * 0.2;
      limb(c, ox, oy, ox - th * 2.3, oy - th * 0.4, ox - th * 1.1, oy + th * 1.5, 6, p.base);
      c.strokeStyle = 'rgba(30,24,16,0.5)'; c.lineWidth = 1.6;
      for (let k = 0; k < 5; k++) {
        const u = k / 5;
        c.beginPath();
        c.moveTo(ox - th * (1.1 + u * 1.2), oy + th * (1.5 - u * 1.9));
        c.lineTo(ox - th * (1.1 + u * 1.2) - 5, oy + th * (1.5 - u * 1.9) + 6); c.stroke();
      }
      void s; break;   /* one visible foreleg reads better than two overlapping */
    }
  }

  /* ── wings, behind the body ── */
  if (spec.wings && spec.wings !== 'none') {
    const open = spec.wings === 'open';
    /* an OPEN wing is a display surface, not a flap: scale it off the THORAX
       and give it a real span. Sized off the abdomen it came out smaller
       than the body it hangs from. */
    const wl = open ? th * 5.2 : abL * 1.25;
    const wh = open ? th * 2.9 : th * 0.85;
    for (const s of [-1, 1] as const) {
      c.save(); c.translate(cx + th * (open ? -0.1 : 0.4), cy - th * (open ? 0.5 : 0.35));
      c.rotate(open ? s * 0.30 : s * 0.16);
      const wing = (L: number, H: number, tilt: number, alpha: number): void => {
        c.save(); c.rotate(tilt);
        c.fillStyle = spec.wings === 'lace' ? `rgba(226,238,255,${alpha * 0.62})` : `rgba(${p.cr},${p.cg},${p.cb},${alpha})`;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(L * 0.30, -H * 1.05, L * 0.86, -H * 0.62);
        c.quadraticCurveTo(L * 1.12, -H * 0.05, L * 0.72, H * 0.52);
        c.quadraticCurveTo(L * 0.30, H * 0.62, 0, 0);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(240,246,255,0.34)'; c.lineWidth = 1.3;   /* the venation */
        for (let k = -1; k <= 2; k++) {
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, k * H * 0.28, L * 0.90, k * H * 0.34); c.stroke();
        }
        c.restore();
      };
      if (open) {
        wing(wl * 0.78, wh * 0.72, 0.62, 0.62);          /* the HINDWING, behind */
        wing(wl, wh, -0.10, 0.78);                        /* the FOREWING, larger */
        if (spec.pattern === 'spots') {                   /* eyespots ride the wing */
          for (const k of [0.42, 0.68]) softMark(c, wl * k, -wh * 0.30, wh * 0.28, wh * 0.28, '28,22,16', 0.42);
        }
      } else {
        wing(wl, wh, 0, spec.wings === 'lace' ? 0.55 : 0.55);
      }
      c.restore();
    }
  }

  /* ── abdomen ── */
  const ax = cx + th * 1.1 + abL * 0.45;
  if (spec.waist) {   /* the petiole: a thread you can see daylight through */
    c.strokeStyle = p.dark; c.lineWidth = th * 0.28; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx + th * 0.85, cy + th * 0.1); c.lineTo(ax - abL * 0.42, cy + th * 0.16); c.stroke();
  }
  c.fillStyle = shell(c, p, ax, cy + th * 0.1, abL * 0.5);
  c.beginPath(); c.ellipse(ax, cy + th * 0.12, abL * 0.52, th * (spec.stick ? 0.6 : 0.92), 0.06, 0, TAU); c.fill();
  rim(c, () => c.ellipse(ax, cy + th * 0.12, abL * 0.52, th * (spec.stick ? 0.6 : 0.92), 0.06, -2.8, 0.3));
  if (spec.pattern === 'bands') {
    for (let i = 0; i < 4; i++) softMark(c, ax - abL * 0.34 + i * abL * 0.26, cy + th * 0.12, abL * 0.11, th * 0.85, '24,20,12', 0.55);
  } else if (spec.pattern === 'spots') {
    for (let i = 0; i < 9; i++) softMark(c, ax - abL * 0.4 + r() * abL * 0.85, cy + th * 0.12 + (r() - 0.5) * th, 5 + r() * 4, 4 + r() * 3, '26,20,12', 0.42);
  }
  if (spec.fuzzy) {   /* the pile — a bee is FURRY, and that is most of a bee */
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.6 + 90 | 0)},${Math.min(255, p.cg * 0.6 + 80 | 0)},${Math.min(255, p.cb * 0.5 + 40 | 0)},0.7)`;
    c.lineWidth = 2;
    for (let i = 0; i < 46; i++) {
      const a = r() * TAU, d = 0.75 + r() * 0.35;
      const hx = cx + Math.cos(a) * th * 1.05 * d, hy = cy + Math.sin(a) * th * 1.05 * d;
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(a) * 8, hy + Math.sin(a) * 8); c.stroke();
    }
  }
  if (spec.sting) {
    c.fillStyle = '#2b2119';
    c.beginPath(); c.moveTo(ax + abL * 0.5, cy + th * 0.12);
    c.lineTo(ax + abL * 0.5 + th * 0.9, cy + th * 0.3); c.lineTo(ax + abL * 0.48, cy + th * 0.42); c.closePath(); c.fill();
  }

  /* ── thorax + head ── */
  c.fillStyle = shell(c, p, cx, cy, th * 1.15);
  c.beginPath(); c.ellipse(cx, cy, th * 1.15, th * 0.95, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx, cy, th * 1.15, th * 0.95, 0, -2.8, 0.3));
  const hx = cx - th * 1.75, hy = cy - th * 0.12;
  c.fillStyle = shell(c, p, hx, hy, th * 0.78);
  c.beginPath(); c.ellipse(hx, hy, th * 0.78, th * 0.70, 0, 0, TAU); c.fill();
  eyeDot(c, hx - th * 0.30, hy - th * 0.22, th * 0.24);
  const ant = spec.antennae ?? 'short';
  if (ant !== 'none') {
    c.strokeStyle = p.dark; c.lineWidth = ant === 'feather' ? 3 : 2.4; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      const L = th * (ant === 'long' ? 3.4 : ant === 'feather' ? 2.0 : 1.5);
      const ex = hx - L, ey = hy - th * 0.6 + s * th * 0.34 - L * 0.28;
      c.beginPath(); c.moveTo(hx - th * 0.5, hy - th * 0.35);
      c.quadraticCurveTo(hx - L * 0.6, hy - th * 0.9 + s * th * 0.2, ex, ey); c.stroke();
      if (ant === 'feather') {   /* the moth's plumed antenna */
        c.lineWidth = 1.4;
        for (let k = 1; k <= 6; k++) {
          const u = k / 7, px = hx - th * 0.5 + (ex - (hx - th * 0.5)) * u, py = hy - th * 0.35 + (ey - (hy - th * 0.35)) * u;
          c.beginPath(); c.moveTo(px, py); c.lineTo(px + 6, py - 7); c.stroke();
          c.beginPath(); c.moveTo(px, py); c.lineTo(px - 3, py - 8); c.stroke();
        }
        c.lineWidth = 3;
      }
    }
  }
}

/* ═══════════════ ARACHNIDS: two tagmata, eight legs, NO antennae ═══════════════ */
export function arachnid(c: Ctx, g: G, p: Pal, opts: { big?: boolean; hairy?: boolean; sting?: boolean; longleg?: boolean; claws?: boolean }, name = ''): void {
  const r = nrng(g, name, 0xA8AC);
  const cx = S * 0.50, cy = S * 0.52;
  const b = S * 0.050 * (opts.big ? 1.25 : 1) * nv(name, 0x21, 0.12);
  const squat = nv(name, 0x22, 0.22);         /* abdomen aspect — a RATIO, so the fit pass keeps it */
  const splay = nv(name, 0x23, 0.20);         /* how far the legs reach relative to the body */
  shadow(c, cx, cy + b * 2.4, S * 0.16);
  const reach = b * (opts.longleg ? 8.2 : 2.9) * splay;   /* the span IS the animal */
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {                 /* EIGHT legs — the count is the read */
      const a = -0.75 + i * 0.52;
      const ox = cx - b * 0.4 + i * b * 0.34;
      const kx = ox + s * Math.cos(a) * reach * 0.62, ky = cy - b * 0.55 - Math.sin(a) * reach * 0.30;
      const ex = ox + s * Math.cos(a) * reach, ey = cy + b * 1.4 + i * b * 0.18;
      limb(c, ox, cy, ex, ey, kx, ky, opts.hairy ? 6 : (opts.longleg ? 2.6 : 4), p.dark);
      if (opts.hairy) {
        c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.8)`; c.lineWidth = 1.4;
        for (let k = 0; k < 5; k++) {
          const u = k / 5, px = ox + (kx - ox) * u, py = cy + (ky - cy) * u;
          c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * 7, py - 6); c.stroke();
        }
      }
    }
  }
  if (opts.claws) {   /* the scorpion/pseudoscorpion pedipalps */
    for (const s of [-1, 1] as const) {
      const px = cx - b * 1.9, py = cy + s * b * 0.85;
      c.strokeStyle = p.dark; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - b * 0.7, cy + s * b * 0.3); c.lineTo(px, py); c.stroke();
      c.fillStyle = shell(c, p, px, py, b * 0.7);
      c.beginPath(); c.ellipse(px - b * 0.35, py, b * 0.62, b * 0.34, s * 0.3, 0, TAU); c.fill();
      c.strokeStyle = p.dark; c.lineWidth = 4;
      c.beginPath(); c.moveTo(px - b * 0.8, py - b * 0.16); c.lineTo(px - b * 1.5, py - b * 0.34); c.stroke();
      c.beginPath(); c.moveTo(px - b * 0.8, py + b * 0.10); c.lineTo(px - b * 1.45, py + b * 0.02); c.stroke();
    }
  }
  /* the abdomen — bulbous on a spider, a segmented TAIL on a scorpion */
  if (opts.sting) {
    let tx = cx + b * 1.0, ty = cy + b * 0.1;
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      tx += b * 0.42; ty -= b * (0.10 + u * 0.62);
      c.fillStyle = shell(c, p, tx, ty, b * 0.34);
      c.beginPath(); c.ellipse(tx, ty, b * (0.36 - u * 0.10), b * (0.32 - u * 0.09), -0.5 - u, 0, TAU); c.fill();
    }
    c.fillStyle = '#2a2018';   /* the telson */
    c.beginPath(); c.moveTo(tx + b * 0.2, ty - b * 0.1);
    c.quadraticCurveTo(tx + b * 0.9, ty - b * 0.5, tx + b * 0.35, ty - b * 1.05);
    c.quadraticCurveTo(tx + b * 0.2, ty - b * 0.4, tx - b * 0.1, ty - b * 0.2); c.closePath(); c.fill();
  } else {
    const ax = cx + b * 1.15;
    c.fillStyle = shell(c, p, ax, cy + b * 0.12, b * 1.1);
    c.beginPath(); c.ellipse(ax, cy + b * 0.12, b * 1.15 * squat, b * 0.98 / squat, 0.05, 0, TAU); c.fill();
    rim(c, () => c.ellipse(ax, cy + b * 0.12, b * 1.15 * squat, b * 0.98 / squat, 0.05, -2.8, 0.3));
    for (let i = 0; i < 10; i++) softMark(c, ax - b + r() * b * 2, cy + b * 0.12 + (r() - 0.5) * b * 1.6, 6 + r() * 5, 5 + r() * 4, '24,18,12', 0.36);
  }
  /* the cephalothorax and the EIGHT eyes */
  c.fillStyle = shell(c, p, cx - b * 0.5, cy - b * 0.1, b);
  c.beginPath(); c.ellipse(cx - b * 0.45, cy, b * 1.0, b * 0.86, 0, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx - b * 0.45, cy, b * 1.0, b * 0.86, 0, -2.9, 0.25));
  for (let i = 0; i < 4; i++) {
    eyeDot(c, cx - b * 1.15 + (i % 2) * b * 0.26, cy - b * 0.34 + Math.floor(i / 2) * b * 0.26, b * 0.11);
  }
}

/* ═══════════════ MYRIAPODS: many segments, a leg pair on each ═══════════════ */
export function myriapod(c: Ctx, g: G, p: Pal, opts: { flat?: boolean; coil?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x33DD);
  const cx = S * 0.48, cy = S * 0.52;
  /* the SEGMENT COUNT is a ratio the fit pass cannot flatten */
  const N = (opts.flat ? 17 : 24) + Math.round((nv(name, 0x32, 1) - 1) * 5);
  const segR = S * (opts.flat ? 0.028 : 0.024) * nv(name, 0x31, 0.12);
  shadow(c, cx, cy + segR * 3.4, S * 0.20);
  const path = (i: number): [number, number] => {
    const u = i / (N - 1);
    const a = -0.5 + u * (opts.coil ? 5.2 : 1.5);
    const rad = S * (opts.coil ? 0.10 + 0.055 * u : 0.30);
    return opts.coil
      ? [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.62]
      : [cx - S * 0.20 + u * S * 0.40, cy - Math.sin(u * Math.PI * 1.6) * S * 0.035];
  };
  for (let i = N - 1; i >= 0; i--) {
    const [x, y] = path(i);
    const legLen = segR * (opts.flat ? 2.6 : 1.5);
    c.strokeStyle = p.dark; c.lineWidth = opts.flat ? 3 : 2.2; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x + s * legLen * 0.5, y + legLen * 0.7, x + s * legLen * (opts.flat ? 1.0 : 0.72), y + legLen * (opts.flat ? 0.7 : 1.0));
      c.stroke();
    }
    c.fillStyle = shell(c, p, x, y, segR);
    c.beginPath(); c.ellipse(x, y, segR * 1.05, segR * (opts.flat ? 0.78 : 0.95), 0, 0, TAU); c.fill();
    if (i % 2 === 0) softMark(c, x, y + segR * 0.3, segR * 0.7, segR * 0.4, '22,18,12', 0.3);
  }
  const [hx, hy] = path(0);
  c.fillStyle = shell(c, p, hx, hy, segR * 1.2);
  c.beginPath(); c.ellipse(hx - segR * 0.6, hy, segR * 1.15, segR * 1.0, 0, 0, TAU); c.fill();
  eyeDot(c, hx - segR * 1.0, hy - segR * 0.28, segR * 0.20);
  c.strokeStyle = p.dark; c.lineWidth = 2.6; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(hx - segR * 1.2, hy + s * segR * 0.2);
    c.quadraticCurveTo(hx - segR * 3.0, hy + s * segR * 0.8, hx - segR * 4.0, hy + s * segR * 0.3); c.stroke();
  }
  /* SEGMENT TINT — a myriapod's plates alternate subtly along the body,
     which is what makes the segmentation read at a glance */
  for (let i = 0; i < N; i += 1) {
    if (r() < 0.45) continue;
    const [sx2, sy2] = path(i);
    softMark(c, sx2, sy2 - segR * 0.2, segR * (0.5 + r() * 0.4), segR * (0.3 + r() * 0.3),
      r() < 0.5 ? '22,16,10' : '248,240,220', 0.10 + r() * 0.12);
  }
  if (opts.flat) {   /* the centipede's venom claws */
    c.strokeStyle = '#d8a24a'; c.lineWidth = 3.4;
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.moveTo(hx - segR * 1.4, hy + s * segR * 0.3);
      c.quadraticCurveTo(hx - segR * 2.4, hy + s * segR * 1.1, hx - segR * 1.9, hy + s * segR * 1.5); c.stroke();
    }
  }
}

/* ═══════════════ CRUSTACEANS ═══════════════ */
export function crabBody(c: Ctx, g: G, p: Pal, opts: { wide?: boolean; hermit?: boolean; big?: boolean }, name = ''): void {
  const r = nrng(g, name, 0xC2AB);
  const cx = S * 0.50, cy = S * 0.50;
  const cw = S * (opts.wide ? 0.155 : 0.125) * (opts.big ? 1.2 : 1) * nv(name, 0x41, 0.12);
  const ch = cw * (opts.wide ? 0.62 : 0.74) * nv(name, 0x42, 0.18);   /* carapace ASPECT */
  shadow(c, cx, cy + ch * 1.9, cw * 1.3);
  c.strokeStyle = p.dark; c.lineCap = 'round';
  for (const s of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {                /* four walking legs a side */
      const a = -0.30 + i * 0.42;
      const ox = cx + s * cw * 0.62, oy = cy + ch * (-0.1 + i * 0.16);
      const kx = ox + s * cw * (0.62 + i * 0.10), ky = oy - ch * (0.42 - i * 0.22);
      const ex = ox + s * cw * (1.05 + i * 0.07), ey = oy + ch * (0.85 + i * 0.24);
      limb(c, ox, oy, ex, ey, kx, ky, 5.5 - i * 0.5, p.dark);
    }
  }
  if (opts.hermit) {   /* the borrowed shell — the hermit crab's whole story */
    const sx = cx + cw * 0.95, sy = cy + ch * 0.3, R = cw * 0.95;
    for (let i = 90; i >= 0; i--) {
      const u = i / 90, a = u * TAU * 2.6, rad = R * u;
      const wx = sx + Math.cos(a) * rad * 0.9, wy = sy + Math.sin(a) * rad * 0.78, wr = R * 0.30 * (0.34 + u * 0.8);
      const gg = c.createRadialGradient(wx - wr * 0.4, wy - wr * 0.45, 1, wx, wy, wr * 1.15);
      gg.addColorStop(0, '#e6d7b8'); gg.addColorStop(0.55, '#c3a878'); gg.addColorStop(1, '#7d6842');
      c.fillStyle = gg; c.beginPath(); c.arc(wx, wy, wr, 0, TAU); c.fill();
    }
  }
  /* the carapace */
  const carap = (): void => {
    c.moveTo(cx - cw, cy);
    c.quadraticCurveTo(cx - cw * 0.86, cy - ch * 1.15, cx, cy - ch * 1.05);
    c.quadraticCurveTo(cx + cw * 0.86, cy - ch * 1.15, cx + cw, cy);
    c.quadraticCurveTo(cx + cw * 0.72, cy + ch * 1.02, cx, cy + ch * 0.98);
    c.quadraticCurveTo(cx - cw * 0.72, cy + ch * 1.02, cx - cw, cy);
  };
  c.fillStyle = shell(c, p, cx, cy, cw);
  c.beginPath(); carap(); c.closePath(); c.fill();
  rim(c, () => { carap(); c.closePath(); }, 2.4);
  for (let i = 0; i < 12; i++) softMark(c, cx - cw * 0.8 + r() * cw * 1.6, cy - ch * 0.6 + r() * ch * 1.3, 7 + r() * 6, 5 + r() * 4, '26,20,14', 0.24);
  /* THE CLAWS, IN FRONT of the carapace — a crab holds its chelae forward,
     and drawn before the shell they were buried underneath it */
  for (const s of [-1, 1] as const) {
    const px = cx + s * cw * 1.02, py = cy - ch * 0.86;
    limb(c, cx + s * cw * 0.52, cy - ch * 0.3, px, py, cx + s * cw * 1.06, cy - ch * 0.14, 7.5, p.dark);
    c.save(); c.translate(px, py); c.rotate(s * -0.62);
    c.fillStyle = shell(c, p, 0, 0, cw * 0.34);
    c.beginPath(); c.ellipse(0, 0, cw * 0.34, cw * 0.19, 0, 0, TAU); c.fill();
    c.strokeStyle = p.dark; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cw * 0.20, -cw * 0.09); c.quadraticCurveTo(cw * 0.52, -cw * 0.22, cw * 0.64, -cw * 0.10); c.stroke();
    c.lineWidth = 5;
    c.beginPath(); c.moveTo(cw * 0.20, cw * 0.06); c.quadraticCurveTo(cw * 0.50, cw * 0.10, cw * 0.62, -cw * 0.02); c.stroke();
    c.restore();
  }
  c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';   /* eyestalks */
  for (const s of [-1, 1] as const) {
    c.beginPath(); c.moveTo(cx + s * cw * 0.24, cy - ch * 0.78); c.lineTo(cx + s * cw * 0.30, cy - ch * 1.30); c.stroke();
    eyeDot(c, cx + s * cw * 0.30, cy - ch * 1.36, cw * 0.075);
  }
}

export function shrimpBody(c: Ctx, g: G, p: Pal, opts: { claws?: boolean; stout?: boolean; tiny?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x5E1D);
  const cx = S * 0.50, cy = S * 0.50;
  const L = S * 0.145 * (opts.tiny ? 0.66 : 1) * nv(name, 0x51, 0.12);
  /* RATIO, not scale — the fit pass would erase a size-only difference */
  const h = L * (opts.stout ? 0.42 : 0.30) * nv(name, 0x52, 0.20);
  const curl = nv(name, 0x53, 0.24);          /* how tightly the abdomen comma-curls */
  shadow(c, cx, cy + h * 2.6, L * 0.9);
  /* the abdomen CURLS — a shrimp at rest is a comma, never a rod */
  const seg = 7;
  for (let i = seg - 1; i >= 0; i--) {
    const u = i / (seg - 1);
    const a = 0.35 + u * 1.15 * curl;
    const x = cx + Math.cos(a) * L * (0.55 + u * 0.75);
    const y = cy - h * 0.3 + Math.sin(a) * L * (0.30 + u * 0.62);
    const rr = h * (1.0 - u * 0.45);
    c.fillStyle = shell(c, p, x, y, rr);
    c.beginPath(); c.ellipse(x, y, rr * 1.15, rr, a - 1.4, 0, TAU); c.fill();
    rim(c, () => c.ellipse(x, y, rr * 1.15, rr, a - 1.4, -2.8, 0.3), 1.6);
    c.strokeStyle = p.dark; c.lineWidth = 2;   /* the swimmerets */
    c.beginPath(); c.moveTo(x, y + rr * 0.6); c.lineTo(x + rr * 0.4, y + rr * 1.5); c.stroke();
  }
  const u1 = 1, a1 = 0.35 + u1 * 1.15 * curl;
  const tx = cx + Math.cos(a1) * L * 1.30, ty = cy - h * 0.3 + Math.sin(a1) * L * 0.92;
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.78)`;   /* THE TAIL FAN */
  for (let k = -2; k <= 2; k++) {
    c.save(); c.translate(tx, ty); c.rotate(a1 - 1.4 + k * 0.26);
    c.beginPath(); c.ellipse(h * 0.9, 0, h * 0.95, h * 0.22, 0, 0, TAU); c.fill(); c.restore();
  }
  /* the carapace and rostrum */
  c.fillStyle = shell(c, p, cx - L * 0.15, cy - h * 0.2, h * 1.5);
  c.beginPath(); c.ellipse(cx - L * 0.18, cy - h * 0.18, h * 1.55, h * 1.15, -0.16, 0, TAU); c.fill();
  rim(c, () => c.ellipse(cx - L * 0.18, cy - h * 0.18, h * 1.55, h * 1.15, -0.16, -2.9, 0.25), 2);
  c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx - L * 0.5, cy - h * 0.7); c.lineTo(cx - L * 1.05, cy - h * 1.5); c.stroke();
  for (const s of [-1, 1] as const) {   /* the long sweeping antennae */
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - L * 0.55, cy - h * 0.3 + s * h * 0.2);
    c.quadraticCurveTo(cx - L * 1.5, cy + s * h * 1.4, cx - L * 2.0, cy + s * h * (2.4 + s * 0.6)); c.stroke();
  }
  if (opts.claws) {   /* the lobster/crayfish chelae */
    for (const s of [-1, 1] as const) {
      const px = cx - L * 0.95, py = cy + h * (0.3 + s * 0.75);
      limb(c, cx - L * 0.45, cy + h * 0.3, px, py, cx - L * 0.75, cy + h * (0.2 + s * 0.5), 6, p.dark);
      c.fillStyle = shell(c, p, px, py, h * 0.8);
      c.save(); c.translate(px, py); c.rotate(s * 0.35);
      c.beginPath(); c.ellipse(-h * 0.3, 0, h * 0.85, h * 0.42, 0, 0, TAU); c.fill();
      c.strokeStyle = p.dark; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-h * 0.9, -h * 0.16); c.lineTo(-h * 1.9, -h * 0.34); c.stroke();
      c.beginPath(); c.moveTo(-h * 0.9, h * 0.12); c.lineTo(-h * 1.8, h * 0.06); c.stroke();
      c.restore();
    }
  }
  for (let i = 0; i < 4; i++) {   /* walking legs under the carapace */
    c.strokeStyle = p.dark; c.lineWidth = 2.4;
    const ox = cx - L * 0.5 + i * h * 0.5;
    c.beginPath(); c.moveTo(ox, cy + h * 0.7); c.lineTo(ox - h * 0.3, cy + h * 1.9); c.stroke();
  }
  eyeDot(c, cx - L * 0.62, cy - h * 0.5, h * 0.24);
  /* CARAPACE SPECKLE — the mottling that separates one crustacean from the
     next when both are the same silhouette */
  for (let i = 0; i < 20; i++) {
    const a = r() * TAU, d = r() ** 0.7;
    softMark(c, cx - L * 0.18 + Math.cos(a) * h * 1.4 * d, cy - h * 0.18 + Math.sin(a) * h * d,
      h * (0.14 + r() * 0.16), h * (0.10 + r() * 0.12),
      r() < 0.55 ? '26,18,12' : '250,240,220', 0.10 + r() * 0.14);
  }
}

/* ═══════════════ SOFT BODIES ═══════════════ */
export function wormBody(c: Ctx, g: G, p: Pal, opts: { bristles?: boolean; flat?: boolean; sucker?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x0202);
  const cx = S * 0.48, cy = S * 0.54;
  const N = 30, th = S * (opts.flat ? 0.040 : 0.030) * nv(name, 0x61, 0.16);
  const wave = nv(name, 0x62, 0.30);   /* how hard the body undulates — a RATIO */
  shadow(c, cx, cy + th * 2.4, S * 0.20);
  const at = (i: number): [number, number] => {
    const u = i / (N - 1);
    return [cx - S * 0.21 + u * S * 0.42, cy + Math.sin(u * Math.PI * 2.1 * wave) * S * 0.052 * wave];
  };
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = N - 1; i > 0; i--) {
    const [x0, y0] = at(i), [x1, y1] = at(i - 1);
    const u = i / (N - 1);
    const w = th * (opts.flat ? 1.0 : (0.55 + 0.55 * Math.sin(Math.PI * u ** 0.8)));
    if (opts.bristles) {   /* the polychaete's parapodia — a bristle worm bristles */
      c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.7 + 60 | 0)},${p.cg * 0.7 | 0},${p.cb * 0.7 | 0},0.85)`;
      c.lineWidth = 2;
      for (const s of [-1, 1] as const) {
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (r() - 0.5) * 6, y0 + s * w * 2.3); c.stroke();
      }
    }
    c.strokeStyle = p.dark; c.lineWidth = w * 2.1;
    c.beginPath(); c.moveTo(x0, y0 + w * 0.14); c.lineTo(x1, y1 + w * 0.14); c.stroke();
    c.strokeStyle = p.base; c.lineWidth = w * 1.9;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.strokeStyle = p.lit; c.lineWidth = w * 0.5; c.globalAlpha = (i % 3) ? 0.45 : 0.2;   /* the wet segments */
    c.beginPath(); c.moveTo(x0, y0 - w * 0.45); c.lineTo(x1, y1 - w * 0.45); c.stroke();
    c.globalAlpha = 1;
  }
  const [hx, hy] = at(0);
  c.fillStyle = shell(c, p, hx, hy, th * 1.2);
  c.beginPath(); c.ellipse(hx - th * 0.3, hy, th * 1.15, th * 0.95, 0, 0, TAU); c.fill();
  if (opts.sucker) { c.fillStyle = 'rgba(20,14,12,0.6)'; c.beginPath(); c.ellipse(hx - th * 1.1, hy, th * 0.5, th * 0.62, 0, 0, TAU); c.fill(); }
  else { eyeDot(c, hx - th * 0.7, hy - th * 0.3, th * 0.16); }
}

export function slugBody(c: Ctx, g: G, p: Pal, opts: { cerata?: boolean; plated?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x51A6);
  const cx = S * 0.48, cy = S * 0.56;
  const L = S * 0.185 * nv(name, 0x71, 0.14), h = S * 0.048 * nv(name, 0x72, 0.16);
  shadow(c, cx, cy + h * 1.6, L * 0.9);
  if (opts.cerata) {   /* the nudibranch's plumes — the most flamboyant animal here */
    for (let i = 0; i < 16; i++) {
      const u = i / 15, x = cx - L * 0.72 + u * L * 1.44;
      const len = h * (1.5 + Math.sin(u * Math.PI) * 1.4);
      const col = `rgba(${Math.min(255, p.cr * 0.5 + 120 | 0)},${Math.min(255, p.cg * 0.6 + 40 | 0)},${Math.min(255, p.cb * 0.5 + 110 | 0)},0.9)`;
      c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, cy - h * 0.3);
      c.quadraticCurveTo(x + 6, cy - h * 0.3 - len * 0.7, x + (r() - 0.5) * 10, cy - h * 0.3 - len); c.stroke();
    }
  }
  c.fillStyle = shell(c, p, cx, cy, L * 0.6);   /* the muscular foot */
  c.beginPath();
  c.moveTo(cx - L * 0.92, cy + h * 0.5);
  c.quadraticCurveTo(cx - L * 0.98, cy - h * 0.85, cx - L * 0.35, cy - h * 0.92);
  c.quadraticCurveTo(cx + L * 0.55, cy - h * 1.0, cx + L * 0.92, cy - h * 0.30);
  c.quadraticCurveTo(cx + L * 1.02, cy + h * 0.42, cx + L * 0.60, cy + h * 0.56);
  c.closePath(); c.fill();
  rim(c, () => { c.moveTo(cx - L * 0.92, cy + h * 0.5); c.quadraticCurveTo(cx - L * 0.98, cy - h * 0.85, cx - L * 0.35, cy - h * 0.92); c.quadraticCurveTo(cx + L * 0.55, cy - h * 1.0, cx + L * 0.92, cy - h * 0.30); }, 2);
  if (opts.plated) {   /* the chiton's eight overlapping plates */
    c.fillStyle = `rgba(${p.cr * 0.6 | 0},${p.cg * 0.6 | 0},${p.cb * 0.6 | 0},0.85)`;
    for (let i = 0; i < 8; i++) {
      const x = cx - L * 0.7 + i * L * 0.20;
      c.beginPath(); c.ellipse(x, cy - h * 0.42, L * 0.13, h * 0.46, 0, Math.PI, TAU); c.fill();
    }
  } else {
    for (let i = 0; i < 14; i++) softMark(c, cx - L * 0.8 + r() * L * 1.6, cy - h * 0.4 + (r() - 0.5) * h, 8 + r() * 7, 5 + r() * 5, '30,24,16', 0.22);
  }
  c.strokeStyle = p.base; c.lineWidth = h * 0.30; c.lineCap = 'round';   /* the eyestalks */
  for (const [dx, dy] of [[0.10, -0.95], [0.20, -0.72]] as const) {
    c.beginPath(); c.moveTo(cx + L * 0.86, cy - h * 0.55);
    c.quadraticCurveTo(cx + L * (0.86 + dx * 0.4), cy - h * 1.0, cx + L * (0.86 + dx), cy + h * dy);
    c.stroke();
    eyeDot(c, cx + L * (0.86 + dx), cy + h * dy, h * 0.16);
  }
}

export function jellyBody(c: Ctx, g: G, p: Pal, opts: { comb?: boolean; float?: boolean; barrel?: boolean }, name = ''): void {
  const r = nrng(g, name, 0x1E11);
  const cx = S * 0.50, cy = S * 0.38;
  const bw = S * (opts.barrel ? 0.115 : 0.135) * nv(name, 0x81, 0.14);
  const bh = bw * (opts.comb ? 1.15 : opts.float ? 0.72 : 0.80);
  if (opts.float) {   /* the man-of-war's gas float rides ABOVE the water */
    c.fillStyle = `rgba(${Math.min(255, p.cr * 0.6 + 90 | 0)},${Math.min(255, p.cg * 0.5 + 70 | 0)},${Math.min(255, p.cb * 0.5 + 120 | 0)},0.9)`;
    c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(220,200,255,0.6)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx - bw * 0.7, cy - bh * 0.5);
    c.quadraticCurveTo(cx, cy - bh * 1.7, cx + bw * 0.7, cy - bh * 0.5); c.stroke();   /* the crest */
  } else {
    const bg = c.createRadialGradient(cx - bw * 0.3, cy - bh * 0.4, 3, cx, cy, bw * 1.2);
    bg.addColorStop(0, 'rgba(255,255,255,0.55)');
    bg.addColorStop(0.5, `rgba(${p.cr},${p.cg},${p.cb},0.55)`);
    bg.addColorStop(1, `rgba(${p.cr},${p.cg},${p.cb},0.16)`);
    c.fillStyle = bg;
    c.beginPath(); c.ellipse(cx, cy, bw, bh, 0, Math.PI, TAU); c.fill();
    c.beginPath(); c.ellipse(cx, cy, bw, bh * 0.34, 0, 0, Math.PI); c.fill();
    rim(c, () => c.ellipse(cx, cy, bw, bh, 0, Math.PI, TAU), 2.2);
    if (opts.comb) {   /* the ctenophore's eight iridescent comb rows */
      for (let i = -3; i <= 3; i++) {
        c.strokeStyle = `hsla(${(i + 4) * 40},90%,70%,0.55)`; c.lineWidth = 3;
        c.beginPath(); c.moveTo(cx + i * bw * 0.24, cy - bh * 0.9);
        c.quadraticCurveTo(cx + i * bw * 0.30, cy, cx + i * bw * 0.20, cy + bh * 0.3); c.stroke();
      }
    }
  }
  const tips = opts.float ? 26 : opts.comb ? 2 : 18;
  const drift = opts.comb ? 0.55 : 1;   /* a ctenophore's pair TRAILS, it does not stand */
  for (let i = 0; i < tips; i++) {
    const u = i / Math.max(1, tips - 1);
    const x = cx - bw * 0.86 + u * bw * 1.72;
    const len = S * (opts.float ? 0.20 + r() * 0.18 : opts.comb ? 0.20 : 0.13 + r() * 0.10) * drift;
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.7 + 60 | 0)},${Math.min(255, p.cg * 0.7 + 60 | 0)},${Math.min(255, p.cb * 0.7 + 70 | 0)},${opts.float ? 0.7 : 0.55})`;
    c.lineWidth = opts.comb ? 3 : 2.2; c.lineCap = 'round';
    const sway = opts.comb ? (i === 0 ? -1 : 1) * bw * 0.9 : (r() - 0.5) * 34;
    c.beginPath(); c.moveTo(x, cy + bh * (opts.float ? 0.7 : 0.28));
    c.bezierCurveTo(x + sway * 0.7, cy + bh + len * 0.35, x - sway * 0.5, cy + bh + len * 0.72,
      x + sway * 1.15, cy + bh + len);
    c.stroke();
  }
  if (!opts.float && !opts.comb) {   /* the four frilled oral arms */
    for (let i = 0; i < 4; i++) {
      const x = cx - bw * 0.34 + i * bw * 0.23;
      c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.5)`; c.lineWidth = 7;
      c.beginPath(); c.moveTo(x, cy + bh * 0.2);
      c.quadraticCurveTo(x + (r() - 0.5) * 20, cy + bh * 1.6, x + (r() - 0.5) * 30, cy + bh * 2.5); c.stroke();
    }
  }
}

export function sessileBody(c: Ctx, g: G, p: Pal, opts: { kind: 'branch' | 'tube' | 'fan' | 'sac' }, name = ''): void {
  const r = nrng(g, name, 0x5E55);
  const cx = S * 0.50, base = S * 0.76;
  const H = S * 0.30 * nv(name, 0x91, 0.16);
  shadow(c, cx, base + 4, S * 0.16);
  if (opts.kind === 'branch') {   /* a coral colony: recursive, thickening down */
    const draw = (x: number, y: number, a: number, len: number, w: number, d: number): void => {
      if (d > 4 || len < 6) return;
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      c.strokeStyle = d < 2 ? p.dark : p.base; c.lineWidth = w; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a - 0.2) * len * 0.6, y + Math.sin(a - 0.2) * len * 0.6, ex, ey); c.stroke();
      draw(ex, ey, a - 0.42 - r() * 0.2, len * 0.72, w * 0.68, d + 1);
      draw(ex, ey, a + 0.42 + r() * 0.2, len * 0.72, w * 0.68, d + 1);
    };
    draw(cx, base, -Math.PI / 2, H * 0.42, 15, 0);
    for (let i = 0; i < 30; i++) {   /* the polyps */
      const a = r() * TAU, d = r() * H * 0.55;
      softMark(c, cx + Math.cos(a) * d, base - H * 0.45 + Math.sin(a) * d * 0.7, 5, 5,
        `${Math.min(255, p.cr * 0.5 + 120 | 0)},${Math.min(255, p.cg * 0.6 + 60 | 0)},${Math.min(255, p.cb * 0.5 + 90 | 0)}`, 0.5);
    }
  } else if (opts.kind === 'tube') {   /* a sponge: a thick chimney with an osculum */
    const w = S * 0.095;
    const gg = c.createLinearGradient(cx - w, 0, cx + w, 0);
    gg.addColorStop(0, p.dark); gg.addColorStop(0.42, p.base); gg.addColorStop(1, p.dark);
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(cx - w * 1.15, base);
    c.quadraticCurveTo(cx - w * 0.78, base - H * 0.6, cx - w * 0.86, base - H);
    c.lineTo(cx + w * 0.86, base - H);
    c.quadraticCurveTo(cx + w * 0.78, base - H * 0.6, cx + w * 1.15, base);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(12,14,20,0.72)';
    c.beginPath(); c.ellipse(cx, base - H, w * 0.86, w * 0.30, 0, 0, TAU); c.fill();
    for (let i = 0; i < 44; i++) softMark(c, cx - w + r() * w * 2, base - r() * H, 4 + r() * 4, 4 + r() * 4, '20,16,12', 0.28);
    rim(c, () => c.ellipse(cx, base - H, w * 0.86, w * 0.30, 0, 0, TAU), 2);
  } else if (opts.kind === 'fan') {   /* a sea fan / sea squirt cluster */
    for (let i = 0; i < 40; i++) {
      const u = i / 39, a = -Math.PI / 2 + (u - 0.5) * 1.5;
      c.strokeStyle = i % 2 ? p.base : p.dark; c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(cx, base);
      c.quadraticCurveTo(cx + Math.cos(a) * H * 0.35, base - H * 0.55, cx + Math.cos(a) * H * 0.62, base - H * (0.85 + Math.sin(u * Math.PI) * 0.25));
      c.stroke();
    }
  } else {   /* a sac: sea cucumber / salp / pyrosome, lying along the floor */
    const L = S * 0.185, h = S * 0.058;
    const cy2 = base - h * 1.2;
    c.fillStyle = shell(c, p, cx, cy2, L * 0.6);
    c.beginPath(); c.ellipse(cx, cy2, L, h, -0.05, 0, TAU); c.fill();
    rim(c, () => c.ellipse(cx, cy2, L, h, -0.05, -2.8, 0.3), 2);
    c.strokeStyle = p.dark; c.lineWidth = 3; c.lineCap = 'round';   /* the papillae */
    for (let i = 0; i < 14; i++) {
      const x = cx - L * 0.86 + (i / 13) * L * 1.72;
      c.beginPath(); c.moveTo(x, cy2 - h * 0.7); c.lineTo(x + (r() - 0.5) * 8, cy2 - h * 1.5); c.stroke();
    }
    for (let i = 0; i < 8; i++) {   /* the feeding tentacles at the mouth */
      const a = -1.2 + i * 0.30;
      c.strokeStyle = `rgba(${p.cr},${p.cg},${p.cb},0.85)`; c.lineWidth = 3;
      c.beginPath(); c.moveTo(cx - L * 0.95, cy2);
      c.quadraticCurveTo(cx - L * 1.2, cy2 + Math.sin(a) * h, cx - L * 1.35, cy2 + Math.sin(a) * h * 2.2); c.stroke();
    }
  }
}

/* ── the roster: every key read out of the catalog ── */
const I = (spec: InsectSpec): PainterI => (c, g, p, n) => insectBody(c, g, p, spec, n);
const A = (o: Parameters<typeof arachnid>[3]): PainterI => (c, g, p, n) => arachnid(c, g, p, o, n);
const M = (o: Parameters<typeof myriapod>[3]): PainterI => (c, g, p, n) => myriapod(c, g, p, o, n);
const C = (o: Parameters<typeof crabBody>[3]): PainterI => (c, g, p, n) => crabBody(c, g, p, o, n);
const P = (o: Parameters<typeof shrimpBody>[3]): PainterI => (c, g, p, n) => shrimpBody(c, g, p, o, n);
const W = (o: Parameters<typeof wormBody>[3]): PainterI => (c, g, p, n) => wormBody(c, g, p, o, n);
const G2 = (o: Parameters<typeof slugBody>[3]): PainterI => (c, g, p, n) => slugBody(c, g, p, o, n);
const J = (o: Parameters<typeof jellyBody>[3]): PainterI => (c, g, p, n) => jellyBody(c, g, p, o, n);
const X = (o: Parameters<typeof sessileBody>[3]): PainterI => (c, g, p, n) => sessileBody(c, g, p, o, n);

export const INVERT_NAME: Record<string, PainterI> = {
  /* ── INSECTS ── */
  'Ant': I({ abdomen: 0.8, waist: true, antennae: 'long' }),
  'Leafcutter Ant': I({ abdomen: 0.85, waist: true, antennae: 'long' }),
  'Termite': I({ abdomen: 1.15, antennae: 'short' }),
  'Bee': I({ abdomen: 0.95, wings: 'lace', antennae: 'short', sting: true, fuzzy: true, pattern: 'bands' }),
  'Honeybee': I({ abdomen: 0.95, wings: 'lace', antennae: 'short', sting: true, fuzzy: true, pattern: 'bands' }),
  'Bumblebee': I({ abdomen: 1.05, wings: 'lace', antennae: 'short', sting: true, fuzzy: true, pattern: 'bands' }),
  'Orchid Bee': I({ abdomen: 0.9, wings: 'lace', antennae: 'short', fuzzy: true, pattern: 'bands' }),
  'Wasp': I({ abdomen: 1.0, waist: true, wings: 'lace', antennae: 'short', sting: true, pattern: 'bands' }),
  'Moth': I({ abdomen: 1.0, wings: 'open', antennae: 'feather', fuzzy: true }),
  'Butterfly': I({ abdomen: 0.9, wings: 'open', antennae: 'long', pattern: 'spots' }),
  'Cicada': I({ abdomen: 1.1, wings: 'folded', antennae: 'short' }),
  'Mantis': I({ abdomen: 1.25, wings: 'folded', antennae: 'long', raptor: true }),
  'Grasshopper': I({ abdomen: 1.15, wings: 'folded', antennae: 'short', jumper: true }),
  'Locust': I({ abdomen: 1.15, wings: 'folded', antennae: 'short', jumper: true }),
  'Cricket': I({ abdomen: 1.0, wings: 'folded', antennae: 'long', jumper: true }),
  'Cockroach': I({ abdomen: 1.2, wings: 'folded', antennae: 'long' }),
  'Aphid': I({ abdomen: 1.05, antennae: 'short' }),
  'Thrips': I({ abdomen: 0.9, wings: 'lace', antennae: 'short' }),
  'Mosquito': I({ abdomen: 0.95, wings: 'lace', antennae: 'feather' }),
  'Black Fly': I({ abdomen: 0.8, wings: 'lace', antennae: 'short' }),
  'Fly': I({ abdomen: 0.85, wings: 'lace', antennae: 'short' }),
  'Stick Insect': I({ abdomen: 2.4, antennae: 'long', stick: true }),
  'Water Strider': I({ abdomen: 1.0, antennae: 'long', stick: true }),
  'Giant Water Bug': I({ abdomen: 1.3, antennae: 'short', raptor: true }),
  'Cold-Adapted Insect': I({ abdomen: 1.0, antennae: 'short', fuzzy: true }),
  'Insect-Eating Bat': I({ abdomen: 1.0, wings: 'open', antennae: 'none' }),
  /* ── ARACHNIDS: eight legs, no antennae ── */
  'Spider': A({}),
  'Tarantula': A({ big: true, hairy: true }),
  'Camel Spider': A({ big: true, hairy: true, longleg: true }),
  'Sea Spider': A({ longleg: true }),
  'Harvestman': A({ longleg: true }),
  'Scorpion': A({ big: true, sting: true, claws: true }),
  'Pseudoscorpion': A({ claws: true }),
  'Deer Tick': A({ big: true }),
  'Mite': A({}),
  /* ── MYRIAPODS ── */
  'Centipede': M({ flat: true }),
  'Giant Centipede': M({ flat: true }),
  'Millipede': M({ coil: true }),
  /* ── CRABS ── */
  'Crab': C({ wide: true }),
  'Mud Crab': C({ wide: true }),
  'Freshwater Crab': C({}),
  'Vent Crab': C({}),
  'Hermit Crab': C({ hermit: true }),
  'Coconut Crab': C({ big: true, wide: true }),
  /* ── SHRIMP, LOBSTER AND KIN ── */
  'Shrimp': P({}),
  'Prawn': P({}),
  'Freshwater Shrimp': P({}),
  'Brine Shrimp': P({ tiny: true }),
  'Fairy Shrimp': P({ tiny: true }),
  'Tadpole Shrimp': P({ tiny: true, stout: true }),
  'Cave Shrimp': P({}),
  'Vent Shrimp': P({}),
  'Krill': P({ tiny: true }),
  'Copepod': P({ tiny: true, stout: true }),
  'Amphipod': P({ tiny: true, stout: true }),
  'Water Flea': P({ tiny: true, stout: true }),
  'Isopod': P({ stout: true }),
  'Giant Isopod': P({ stout: true }),
  'Lobster': P({ claws: true }),
  'Crayfish': P({ claws: true }),
  'Barnacle': X({ kind: 'tube' }),
  /* ── WORMS ── */
  'Earthworm': W({}),
  'Ice Worm': W({}),
  'Marine Worm': W({ bristles: true }),
  'Polychaete Worm': W({ bristles: true }),
  'Scale Worm': W({ bristles: true, flat: true }),
  'Flatworm': W({ flat: true }),
  'Leech': W({ sucker: true }),
  /* ── SLUGS AND KIN ── */
  'Banana Slug': G2({}),
  'Nudibranch': G2({ cerata: true }),
  'Chiton': G2({ plated: true }),
  /* ── JELLIES ── */
  'Jellyfish': J({}),
  'Comb Jelly': J({ comb: true }),
  'Portuguese Man-of-War': J({ float: true }),
  'Salp': J({ barrel: true }),
  'Pyrosome': J({ barrel: true }),
  /* ── SESSILE AND SAC-BODIED ── */
  'Coral': X({ kind: 'branch' }),
  'Cold-Water Coral': X({ kind: 'branch' }),
  'Deep-Water Coral': X({ kind: 'branch' }),
  'Sponge': X({ kind: 'tube' }),
  'Sea Squirt': X({ kind: 'fan' }),
  'Sea Cucumber': X({ kind: 'sac' }),
  'Lancelet': W({}),
};
