/* faunaoverrides3.ts — THE MORPHOLOGY PASS, wave 8: THE FISH SYSTEM.
   106 of the catalog's 631 fauna are fish and nothing reached them — the
   largest single uncovered group in the game, larger than the birds.

   Built like wave 4's quadruped system rather than as 106 painters: ONE
   traced body whose PROFILE, TAIL, SNOUT, DORSAL and PATTERN are the
   species. Proportion carries identity before decoration (wave 4); every
   mark blends (wave 5); the painter may overflow and the shared fit pass
   frames it (wave 6); the name seeds real variation so two labels can never
   coincide (wave 7); and NEVER override what already excels (wave 4) —
   Seahorse, Angelfish, Lionfish, Flounder, Halibut and Mudskipper have
   their own painters already and are deliberately ABSENT.

   Every key in the table below was read out of the catalog, not recalled
   from knowledge of what fish exist — the wave-7 lesson, enforced by
   tools/overridecheck.mjs. */
import { mulberry32, TAU } from '@cf/domain-rand';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
export type Painter3 = (c: Ctx, g: G, p: Pal, name: string) => void;
const S = 440;

export function nameSeed3(name: string): number {
  let h = 0x27D4;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x9E37) >>> 0;
  return h >>> 0;
}
function nrng(g: G, name: string, salt: number): () => number {
  return mulberry32((((g.seed as number) ^ nameSeed3(name) ^ salt) >>> 0));
}
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
  return 1 + (mixSalt(nameSeed3(name), salt) / 4294967296 - 0.5) * 2 * amt;
}
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
function eye(c: Ctx, x: number, y: number, r: number): void {
  c.fillStyle = '#f3efe4'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#0c0f14'; c.beginPath(); c.arc(x, y, r * 0.60, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.34, r * 0.22, 0, TAU); c.fill();
}

export interface FishSpec {
  /** body silhouette — the single strongest identity cue */
  profile: 'fusiform' | 'deep' | 'eel' | 'globe' | 'box' | 'ribbon';
  len: number;        /** half-length as a fraction of S */
  depth: number;      /** half-height at the deepest point */
  tail: 'forked' | 'lunate' | 'round' | 'point' | 'shark' | 'fan' | 'none';
  snout: 'blunt' | 'jaw' | 'bill' | 'shovel' | 'tube' | 'hammer';
  dorsal: 'one' | 'sail' | 'two' | 'spiny' | 'none' | 'sharkfin';
  pattern?: 'bands' | 'stripes' | 'spots' | 'mottle';
  shark?: boolean;    /** gill slits, swept pectorals, heterocercal tail */
  lure?: boolean;     /** the anglerfish esca */
  glow?: boolean;     /** photophore rows */
  teeth?: boolean;
  hue?: string;       /** only where colour IS the identity */
}

/** the half-height of the body at t (0 = tail peduncle, 1 = snout tip) */
function heightAt(profile: FishSpec['profile'], t: number, depth: number): number {
  const bell = Math.sin(Math.PI * Math.min(1, Math.max(0, t)) ** 0.85);
  switch (profile) {
    case 'deep': return depth * 1.62 * bell ** 0.72;
    case 'globe': return depth * 1.95 * bell ** 0.48;
    case 'box': return depth * 1.30 * (0.30 + 0.70 * bell ** 0.30);
    case 'eel': return depth * 0.52 * (0.42 + 0.58 * bell ** 0.30);
    case 'ribbon': return depth * 0.72 * (0.55 + 0.45 * bell ** 0.25);
    default: return depth * bell;
  }
}

/** THE FISH. One traced body; the spec is the species. */
export function fishBody(c: Ctx, g: G, pIn: Pal, spec: FishSpec, name = ''): void {
  const r = nrng(g, name, 0xF15E);
  const p: Pal = spec.hue ? { ...pIn } : pIn;
  const cx = S * 0.47, cy = S * 0.50;
  const len = S * spec.len * nvar(name, 0x11, 0.10);
  const depth = S * spec.depth * nvar(name, 0x22, 0.14);
  const nose = cx + len, ped = cx - len;          /* snout tip → caudal peduncle */
  const N = 44;

  /* soft water shadow — a fish is not standing on anything */
  c.fillStyle = 'rgba(0,0,0,0.34)';
  c.beginPath(); c.ellipse(cx, cy + depth * 1.9 + S * 0.05, len * 0.72, S * 0.022, 0, 0, TAU); c.fill();

  const top: Array<[number, number]> = [], bot: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = ped + (nose - ped) * t;
    const h = heightAt(spec.profile, t, depth);
    /* the back is deeper than the belly on almost every fish */
    top.push([x, cy - h * 1.04]);
    bot.push([x, cy + h * 0.92]);
  }
  const trace = (): void => {
    c.moveTo(top[0]![0], top[0]![1]);
    for (let i = 1; i < top.length; i++) {
      const [x0, y0] = top[i - 1]!, [x1, y1] = top[i]!;
      c.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    for (let i = bot.length - 1; i > 0; i--) {
      const [x0, y0] = bot[i]!, [x1, y1] = bot[i - 1]!;
      c.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    c.closePath();
  };

  /* ── the TAIL, behind the body ── */
  const pedH = heightAt(spec.profile, 0, depth);
  const tRef = heightAt(spec.profile, 0.14, depth);   /* the body AT the peduncle */
  c.fillStyle = p.dark;
  const tl = len * (spec.tail === 'lunate' ? 0.46 : spec.tail === 'shark' ? 0.52 : 0.36);
  const maxH = heightAt(spec.profile, 0.5, depth);
  /* and CLAMPED to the body it hangs off: a deep-bodied tang measured 3.35x
     its peduncle and grew a tail taller than the fish. A tail is never much
     bigger than the body that swings it. */
  const th = Math.min(tRef * (spec.tail === 'lunate' ? 3.35 : spec.tail === 'fan' ? 2.55 : 2.15), maxH * 1.30);
  if (spec.tail === 'forked' || spec.tail === 'lunate') {
    c.beginPath();
    c.moveTo(ped + pedH * 0.4, cy);
    c.lineTo(ped - tl, cy - th);
    c.quadraticCurveTo(ped - tl * 0.34, cy, ped - tl, cy + th);
    c.closePath(); c.fill();
  } else if (spec.tail === 'shark') {
    c.beginPath();   /* heterocercal: the upper lobe is longer */
    c.moveTo(ped + pedH * 0.4, cy);
    c.quadraticCurveTo(ped - tl * 0.5, cy - th * 0.7, ped - tl * 1.05, cy - th * 1.35);
    c.quadraticCurveTo(ped - tl * 0.42, cy - th * 0.25, ped - tl * 0.30, cy + th * 0.10);
    c.quadraticCurveTo(ped - tl * 0.55, cy + th * 0.72, ped - tl * 0.62, cy + th * 0.80);
    c.quadraticCurveTo(ped - tl * 0.20, cy + th * 0.30, ped + pedH * 0.4, cy);
    c.closePath(); c.fill();
  } else if (spec.tail === 'round' || spec.tail === 'fan') {
    /* a fan GROWS FROM THE PEDUNCLE. As a free-standing ellipse it read as a
       dark disc parked behind the fish, touching nothing. */
    c.beginPath();
    c.moveTo(ped + pedH * 0.3, cy - tRef * 0.85);
    c.quadraticCurveTo(ped - tl * 1.20, cy - th * 0.92, ped - tl * 1.02, cy);
    c.quadraticCurveTo(ped - tl * 1.20, cy + th * 0.92, ped + pedH * 0.3, cy + tRef * 0.85);
    c.closePath(); c.fill();
  } else if (spec.tail === 'point') {
    c.beginPath();
    c.moveTo(ped + pedH * 0.4, cy - pedH * 0.8);
    c.quadraticCurveTo(ped - tl, cy, ped + pedH * 0.4, cy + pedH * 0.8);
    c.closePath(); c.fill();
  }
  if (spec.tail !== 'none') {   /* the fin rays */
    c.strokeStyle = 'rgba(20,26,34,0.28)'; c.lineWidth = 1.8;
    for (let i = -3; i <= 3; i++) {
      c.beginPath(); c.moveTo(ped, cy); c.lineTo(ped - tl * 0.88, cy + i * th * 0.30); c.stroke();
    }
  }

  /* ── the DORSAL, behind the body so it grows out of the back ── */
  const dorsalAt = (t: number): [number, number] => {
    const x = ped + (nose - ped) * t;
    return [x, cy - heightAt(spec.profile, t, depth) * 1.02];
  };
  c.fillStyle = p.dark;
  if (spec.dorsal === 'sail') {
    const [x0, y0] = dorsalAt(0.28), [x1, y1] = dorsalAt(0.86);
    c.beginPath(); c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2, y1 - depth * 2.5, x1, y1);
    c.lineTo(x1, y1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,26,34,0.30)'; c.lineWidth = 1.8;
    for (let i = 1; i < 9; i++) {
      const t = 0.28 + (0.58 * i) / 9, [dx, dy] = dorsalAt(t);
      c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + depth * 0.20, dy - depth * (1.35 - Math.abs(i - 4.5) * 0.20)); c.stroke();
    }
  } else if (spec.dorsal === 'sharkfin') {
    const [x0, y0] = dorsalAt(0.46);
    c.beginPath(); c.moveTo(x0 + depth * 0.7, y0);
    c.quadraticCurveTo(x0 + depth * 0.1, y0 - depth * 1.5, x0 - depth * 0.9, y0 - depth * 0.10);
    c.closePath(); c.fill();
  } else if (spec.dorsal === 'spiny' && spec.profile === 'ribbon') {
    c.fillStyle = `rgba(${Math.min(255, p.cr * 0.5 + 120 | 0)},${p.cg * 0.4 | 0},${p.cb * 0.4 + 30 | 0},0.9)`;
    c.beginPath();
    for (let i = 0; i <= 30; i++) { const u = i / 30; const [dx, dy] = dorsalAt(0.05 + 0.90 * u); if (!i) c.moveTo(dx, dy); else c.lineTo(dx, dy - depth * (1.25 * Math.sin(Math.PI * u) ** 0.4)); }
    for (let i = 30; i >= 0; i--) { const [dx, dy] = dorsalAt(0.05 + (0.90 * i) / 30); c.lineTo(dx, dy); }
    c.closePath(); c.fill();
    c.fillStyle = p.dark;
  } else if (spec.dorsal === 'spiny') {
    const [x0, y0] = dorsalAt(0.30), [x1] = dorsalAt(0.80);
    c.beginPath(); c.moveTo(x0, y0);
    for (let i = 0; i <= 8; i++) {
      const t = 0.30 + (0.50 * i) / 8, [dx, dy] = dorsalAt(t);
      c.lineTo(dx, dy - depth * (i % 2 ? 0.52 : 0.98));
    }
    c.lineTo(x1, dorsalAt(0.80)[1]); c.closePath(); c.fill();
  } else if (spec.dorsal === 'two') {
    for (const [a, b] of [[0.30, 0.48], [0.58, 0.76]] as const) {
      const [x0, y0] = dorsalAt(a), [x1, y1] = dorsalAt(b);
      c.beginPath(); c.moveTo(x0, y0);
      c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - depth * 1.05, x1, y1);
      c.closePath(); c.fill();
    }
  } else if (spec.dorsal === 'one') {
    const [x0, y0] = dorsalAt(0.32), [x1, y1] = dorsalAt(0.72);
    c.beginPath(); c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - depth * 1.34, x1, y1);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,26,34,0.26)'; c.lineWidth = 1.6;
    for (let i = 1; i < 6; i++) {
      const [dx, dy] = dorsalAt(0.32 + (0.40 * i) / 6);
      c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + depth * 0.10, dy - depth * 0.80); c.stroke();
    }
  }
  if (spec.dorsal === 'none' && (spec.profile === 'eel' || spec.profile === 'ribbon')) {
    /* the continuous median fin — an eel's whole read */
    c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.72)`;
    for (const side of [-1, 1] as const) {
      c.beginPath();
      for (let i = 0; i <= 30; i++) {
        const tt = 0.06 + (0.84 * i) / 30;
        const x = ped + (nose - ped) * tt;
        const h = heightAt(spec.profile, tt, depth);
        const y = cy + side * h * (side < 0 ? 1.04 : 0.92);
        if (!i) c.moveTo(x, y);
        else c.lineTo(x, y + side * depth * (0.42 + 0.30 * Math.sin(tt * Math.PI)));
      }
      for (let i = 30; i >= 0; i--) {
        const tt = 0.06 + (0.84 * i) / 30;
        const x = ped + (nose - ped) * tt;
        const h = heightAt(spec.profile, tt, depth);
        c.lineTo(x, cy + side * h * (side < 0 ? 1.04 : 0.92));
      }
      c.closePath(); c.fill();
    }
  }
  /* the anal fin, mirrored below */
  if (spec.dorsal !== 'none' && spec.profile !== 'globe') {
    const ax = ped + (nose - ped) * 0.26, ax2 = ped + (nose - ped) * 0.46;
    const ay = cy + heightAt(spec.profile, 0.26, depth) * 0.90, ay2 = cy + heightAt(spec.profile, 0.46, depth) * 0.90;
    c.beginPath(); c.moveTo(ax, ay);
    c.quadraticCurveTo((ax + ax2) / 2, (ay + ay2) / 2 + depth * 0.62, ax2, ay2);
    c.closePath(); c.fill();
  }

  /* ── the BILL / long jaw, drawn before the body so it seats in the head ── */
  if (spec.snout === 'bill') {
    c.fillStyle = p.dark;
    c.beginPath();
    c.moveTo(nose - depth * 0.1, cy - depth * 0.16);
    c.lineTo(nose + len * 0.52, cy - depth * 0.03);
    c.lineTo(nose + len * 0.52, cy + depth * 0.03);
    c.lineTo(nose - depth * 0.1, cy + depth * 0.14);
    c.closePath(); c.fill();
  } else if (spec.snout === 'shovel') {
    c.fillStyle = p.dark;
    c.beginPath(); c.ellipse(nose + len * 0.14, cy + depth * 0.10, len * 0.20, depth * 0.26, -0.12, 0, TAU); c.fill();
  } else if (spec.snout === 'tube') {
    c.fillStyle = p.base;
    c.beginPath(); c.ellipse(nose + len * 0.13, cy, len * 0.16, depth * 0.13, 0, 0, TAU); c.fill();
  }

  /* ── THE BODY ── */
  const bg = c.createLinearGradient(0, cy - depth * 1.6, 0, cy + depth * 1.4);
  bg.addColorStop(0, p.lit);
  bg.addColorStop(0.42, p.base);
  bg.addColorStop(1, p.dark);   /* countershading: dark back is wrong — fish are dark ABOVE */
  const bg2 = c.createLinearGradient(0, cy - depth * 1.6, 0, cy + depth * 1.4);
  bg2.addColorStop(0, p.dark); bg2.addColorStop(0.46, p.base); bg2.addColorStop(1, p.lit);
  c.fillStyle = bg2;   /* dark above, pale below — the real countershading */
  c.beginPath(); trace(); c.fill();
  void bg;

  /* the pattern, clipped to the body so marks are SKIN not stickers */
  c.save(); c.beginPath(); trace(); c.clip();
  if (spec.pattern === 'bands') {
    for (let i = 0; i < 7; i++) {
      const t = 0.16 + i * 0.115, x = ped + (nose - ped) * t;
      softMark(c, x, cy - depth * 0.15, depth * 0.30, depth * 1.30, '22,28,20', 0.34);
    }
  } else if (spec.pattern === 'stripes') {
    for (let i = -2; i <= 2; i++) {
      softMark(c, cx, cy + i * depth * 0.46, len * 0.92, depth * 0.16, i % 2 ? '235,232,220' : '24,28,34', 0.30);
    }
  } else if (spec.pattern === 'spots') {
    for (let i = 0; i < 34; i++) {
      softMark(c, ped + r() * (nose - ped), cy - depth + r() * depth * 2, 5 + r() * 6, 4 + r() * 5, '24,28,20', 0.36);
    }
  } else if (spec.pattern === 'mottle') {
    for (let i = 0; i < 20; i++) {
      softMark(c, ped + r() * (nose - ped), cy - depth + r() * depth * 2, 12 + r() * 12, 9 + r() * 9, '26,30,24', 0.24);
    }
  }
  /* the lateral line — on nearly every bony fish, and it reads */
  c.strokeStyle = 'rgba(240,244,255,0.16)'; c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(ped + (nose - ped) * 0.08, cy - depth * 0.10);
  c.quadraticCurveTo(cx, cy - depth * 0.30, nose - depth * 0.4, cy - depth * 0.16);
  c.stroke();
  if (spec.glow) {   /* photophore rows — the deep-sea read */
    for (let i = 0; i < 16; i++) {
      const x = ped + (nose - ped) * (0.10 + i * 0.055);
      softMark(c, x, cy + heightAt(spec.profile, 0.10 + i * 0.055, depth) * 0.62, 5, 5, '150,235,255', 0.85);
    }
  }
  if (spec.shark) {   /* the five gill slits */
    c.strokeStyle = 'rgba(18,24,32,0.40)'; c.lineWidth = 2.6;
    for (let i = 0; i < 5; i++) {
      const x = ped + (nose - ped) * (0.66 + i * 0.035);
      c.beginPath(); c.moveTo(x, cy - depth * 0.20); c.lineTo(x - depth * 0.10, cy + depth * 0.52); c.stroke();
    }
  }
  c.restore();
  c.strokeStyle = 'rgba(214,228,248,0.30)'; c.lineWidth = 2;   /* the rim */
  c.beginPath(); trace(); c.stroke();

  /* ── the PECTORAL fin, in front of the body ── */
  const pfx = ped + (nose - ped) * (spec.shark ? 0.62 : 0.66);
  const pfy = cy + heightAt(spec.profile, 0.66, depth) * 0.30;
  c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.86)`;
  c.save(); c.translate(pfx, pfy);
  if (spec.shark) {
    c.rotate(0.62);
    c.beginPath(); c.ellipse(0, 0, len * 0.44, depth * 0.20, 0, 0, TAU); c.fill();
  } else {
    c.rotate(0.44);
    c.beginPath(); c.ellipse(0, 0, len * 0.22, depth * 0.34, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(20,26,34,0.25)'; c.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-len * 0.20, i * depth * 0.14); c.stroke(); }
  }
  c.restore();

  /* ── the HEAD: jaw line, teeth, eye, and the angler's lure ── */
  const hx = nose - depth * 0.55, hy = cy;
  if (spec.snout === 'jaw' || spec.snout === 'hammer') {
    c.strokeStyle = 'rgba(16,20,26,0.42)'; c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(nose - (spec.snout === 'hammer' ? depth * 0.2 : len * 0.02), cy + depth * 0.16);
    c.lineTo(hx - depth * 0.55, cy + depth * 0.38); c.stroke();
  } else {
    c.strokeStyle = 'rgba(16,20,26,0.36)'; c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(nose - depth * 0.06, cy + depth * 0.20);
    c.quadraticCurveTo(hx, cy + depth * 0.44, hx - depth * 0.50, cy + depth * 0.30); c.stroke();
  }
  if (spec.teeth) {
    c.fillStyle = '#f2eee0';
    for (let i = 0; i < 7; i++) {
      const x = nose - depth * 0.15 - i * depth * 0.28;
      c.beginPath(); c.moveTo(x, cy + depth * 0.20); c.lineTo(x - depth * 0.09, cy + depth * 0.52); c.lineTo(x + depth * 0.09, cy + depth * 0.26); c.closePath(); c.fill();
    }
  }
  if (spec.lure) {   /* the esca on its illicium — the anglerfish's whole story */
    c.strokeStyle = p.dark; c.lineWidth = 3.4; c.lineCap = 'round';
    const lx = nose - depth * 0.30, ly = cy - depth * 1.02;
    const ex = lx + len * 0.30, ey = ly - depth * 1.05;
    c.beginPath(); c.moveTo(lx, ly); c.quadraticCurveTo(lx + len * 0.06, ly - depth * 0.95, ex, ey); c.stroke();
    softMark(c, ex, ey, depth * 0.60, depth * 0.60, '190,245,255', 0.55);
    c.fillStyle = '#eafcff'; c.beginPath(); c.arc(ex, ey, depth * 0.17, 0, TAU); c.fill();
  }
  /* the gill cover (operculum) — every bony fish has one and it reads as a head */
  if (!spec.shark) {
    c.strokeStyle = 'rgba(16,22,30,0.30)'; c.lineWidth = 2.4;
    const ox = ped + (nose - ped) * 0.74;
    c.beginPath();
    c.moveTo(ox, cy - heightAt(spec.profile, 0.74, depth) * 0.92);
    c.quadraticCurveTo(ox - depth * 0.30, cy, ox + depth * 0.10, cy + heightAt(spec.profile, 0.74, depth) * 0.86);
    c.stroke();
  }
  eye(c, nose - depth * (spec.profile === 'eel' ? 0.9 : 0.70), cy - depth * 0.34,
    Math.max(4, depth * (spec.profile === 'globe' ? 0.22 : 0.18)));
}

/* ── the roster: every key read out of the catalog ── */
const F = (spec: FishSpec): Painter3 => (c, g, p, n) => fishBody(c, g, p, spec, n);

export const FAUNA3_NAME: Record<string, Painter3> = {
  /* ── open-water torpedoes: speed is the silhouette ── */
  'Tuna': F({ profile: 'fusiform', len: 0.24, depth: 0.085, tail: 'lunate', snout: 'blunt', dorsal: 'two' }),
  'Mackerel': F({ profile: 'fusiform', len: 0.24, depth: 0.062, tail: 'lunate', snout: 'blunt', dorsal: 'two', pattern: 'bands' }),
  'Wahoo': F({ profile: 'fusiform', len: 0.26, depth: 0.058, tail: 'lunate', snout: 'jaw', dorsal: 'two', pattern: 'bands' }),
  'Bonefish': F({ profile: 'fusiform', len: 0.24, depth: 0.062, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Sardine': F({ profile: 'fusiform', len: 0.20, depth: 0.055, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Anchovy': F({ profile: 'fusiform', len: 0.20, depth: 0.048, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Herring': F({ profile: 'fusiform', len: 0.21, depth: 0.058, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Mahi-Mahi': F({ profile: 'deep', len: 0.24, depth: 0.082, tail: 'lunate', snout: 'blunt', dorsal: 'sail' }),
  'Marlin': F({ profile: 'fusiform', len: 0.25, depth: 0.072, tail: 'lunate', snout: 'bill', dorsal: 'sail' }),
  'Sailfish': F({ profile: 'fusiform', len: 0.25, depth: 0.068, tail: 'lunate', snout: 'bill', dorsal: 'sail' }),
  'Swordfish': F({ profile: 'fusiform', len: 0.25, depth: 0.070, tail: 'lunate', snout: 'bill', dorsal: 'one' }),
  'Flying Fish': F({ profile: 'fusiform', len: 0.22, depth: 0.052, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Remora': F({ profile: 'fusiform', len: 0.23, depth: 0.050, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  /* ── cold and temperate food fish ── */
  'Cod': F({ profile: 'fusiform', len: 0.23, depth: 0.078, tail: 'round', snout: 'blunt', dorsal: 'two', pattern: 'mottle' }),
  'Arctic Cod': F({ profile: 'fusiform', len: 0.22, depth: 0.068, tail: 'round', snout: 'blunt', dorsal: 'two' }),
  'Haddock': F({ profile: 'fusiform', len: 0.22, depth: 0.076, tail: 'forked', snout: 'blunt', dorsal: 'two', pattern: 'mottle' }),
  'Pollock': F({ profile: 'fusiform', len: 0.23, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'two' }),
  'Salmon': F({ profile: 'fusiform', len: 0.24, depth: 0.072, tail: 'forked', snout: 'jaw', dorsal: 'one', pattern: 'spots' }),
  'Trout': F({ profile: 'fusiform', len: 0.22, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Char': F({ profile: 'fusiform', len: 0.22, depth: 0.068, tail: 'forked', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Grayling': F({ profile: 'fusiform', len: 0.21, depth: 0.068, tail: 'forked', snout: 'blunt', dorsal: 'sail' }),
  'Whitefish': F({ profile: 'fusiform', len: 0.22, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Icefish': F({ profile: 'fusiform', len: 0.21, depth: 0.055, tail: 'forked', snout: 'jaw', dorsal: 'two' }),
  'Cold-Water Fish': F({ profile: 'fusiform', len: 0.22, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  /* ── freshwater ── */
  'Carp': F({ profile: 'deep', len: 0.22, depth: 0.078, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Goldfish': F({ profile: 'deep', len: 0.19, depth: 0.078, tail: 'fan', snout: 'blunt', dorsal: 'one' }),
  'Tilapia': F({ profile: 'deep', len: 0.20, depth: 0.082, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Cichlid': F({ profile: 'deep', len: 0.19, depth: 0.082, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Perch': F({ profile: 'deep', len: 0.21, depth: 0.075, tail: 'forked', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Bass': F({ profile: 'fusiform', len: 0.22, depth: 0.080, tail: 'forked', snout: 'jaw', dorsal: 'spiny' }),
  'Sea Bass': F({ profile: 'fusiform', len: 0.23, depth: 0.082, tail: 'forked', snout: 'jaw', dorsal: 'spiny' }),
  'Walleye': F({ profile: 'fusiform', len: 0.23, depth: 0.066, tail: 'forked', snout: 'jaw', dorsal: 'two' }),
  'Pike': F({ profile: 'fusiform', len: 0.26, depth: 0.058, tail: 'forked', snout: 'jaw', dorsal: 'one', pattern: 'mottle', teeth: true }),
  'Piranha': F({ profile: 'deep', len: 0.18, depth: 0.082, tail: 'forked', snout: 'jaw', dorsal: 'one', teeth: true }),
  'Pacu': F({ profile: 'deep', len: 0.20, depth: 0.090, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Tetra': F({ profile: 'deep', len: 0.16, depth: 0.058, tail: 'forked', snout: 'blunt', dorsal: 'one', pattern: 'stripes' }),
  'Minnow': F({ profile: 'fusiform', len: 0.17, depth: 0.045, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Mudminnow': F({ profile: 'fusiform', len: 0.17, depth: 0.050, tail: 'round', snout: 'blunt', dorsal: 'one' }),
  'Killifish': F({ profile: 'fusiform', len: 0.17, depth: 0.050, tail: 'round', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Sculpin': F({ profile: 'fusiform', len: 0.19, depth: 0.062, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'mottle' }),
  'Sunfish': F({ profile: 'deep', len: 0.18, depth: 0.092, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'spots' }),
  'Catfish': F({ profile: 'fusiform', len: 0.24, depth: 0.070, tail: 'forked', snout: 'shovel', dorsal: 'one', pattern: 'mottle' }),
  'Arapaima': F({ profile: 'fusiform', len: 0.27, depth: 0.075, tail: 'round', snout: 'blunt', dorsal: 'one' }),
  'Arowana': F({ profile: 'ribbon', len: 0.26, depth: 0.060, tail: 'point', snout: 'jaw', dorsal: 'none' }),
  'Tigerfish': F({ profile: 'fusiform', len: 0.23, depth: 0.072, tail: 'forked', snout: 'jaw', dorsal: 'two', pattern: 'stripes', teeth: true }),
  'Archerfish': F({ profile: 'deep', len: 0.18, depth: 0.070, tail: 'forked', snout: 'jaw', dorsal: 'spiny', pattern: 'bands' }),
  'Knifefish': F({ profile: 'ribbon', len: 0.25, depth: 0.055, tail: 'point', snout: 'blunt', dorsal: 'none' }),
  'Lungfish': F({ profile: 'eel', len: 0.26, depth: 0.062, tail: 'point', snout: 'blunt', dorsal: 'none', pattern: 'mottle' }),
  'Blind Fish': F({ profile: 'fusiform', len: 0.19, depth: 0.055, tail: 'round', snout: 'blunt', dorsal: 'one' }),
  'Cave Fish': F({ profile: 'fusiform', len: 0.19, depth: 0.055, tail: 'round', snout: 'blunt', dorsal: 'one' }),
  'Small Fish': F({ profile: 'fusiform', len: 0.17, depth: 0.048, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  /* ── ancient and armoured ── */
  'Sturgeon': F({ profile: 'fusiform', len: 0.27, depth: 0.058, tail: 'shark', snout: 'shovel', dorsal: 'one' }),
  'Paddlefish': F({ profile: 'fusiform', len: 0.26, depth: 0.058, tail: 'shark', snout: 'bill', dorsal: 'one' }),
  'Gar': F({ profile: 'eel', len: 0.27, depth: 0.052, tail: 'round', snout: 'jaw', dorsal: 'none', teeth: true }),
  'Bowfin': F({ profile: 'fusiform', len: 0.24, depth: 0.062, tail: 'round', snout: 'jaw', dorsal: 'sail', pattern: 'mottle' }),
  'Coelacanth': F({ profile: 'fusiform', len: 0.23, depth: 0.084, tail: 'fan', snout: 'blunt', dorsal: 'two', pattern: 'spots' }),
  'Lamprey': F({ profile: 'eel', len: 0.27, depth: 0.038, tail: 'point', snout: 'tube', dorsal: 'none' }),
  /* ── eels and ribbons ── */
  'Eel': F({ profile: 'eel', len: 0.27, depth: 0.044, tail: 'point', snout: 'jaw', dorsal: 'none' }),
  'Moray Eel': F({ profile: 'eel', len: 0.27, depth: 0.052, tail: 'point', snout: 'jaw', dorsal: 'none', pattern: 'spots', teeth: true }),
  'Electric Eel': F({ profile: 'eel', len: 0.28, depth: 0.048, tail: 'point', snout: 'blunt', dorsal: 'none' }),
  'Gulper Eel': F({ profile: 'eel', len: 0.27, depth: 0.050, tail: 'point', snout: 'jaw', dorsal: 'none', teeth: true, glow: true }),
  'Oarfish': F({ profile: 'ribbon', len: 0.28, depth: 0.046, tail: 'point', snout: 'blunt', dorsal: 'spiny' }),
  'Pipefish': F({ profile: 'ribbon', len: 0.26, depth: 0.030, tail: 'point', snout: 'tube', dorsal: 'none' }),
  /* ── reef ── */
  'Clownfish': F({ profile: 'deep', len: 0.16, depth: 0.070, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Damselfish': F({ profile: 'deep', len: 0.15, depth: 0.066, tail: 'forked', snout: 'blunt', dorsal: 'spiny' }),
  'Butterflyfish': F({ profile: 'deep', len: 0.16, depth: 0.086, tail: 'fan', snout: 'tube', dorsal: 'spiny', pattern: 'bands' }),
  'Surgeonfish': F({ profile: 'deep', len: 0.17, depth: 0.086, tail: 'lunate', snout: 'blunt', dorsal: 'spiny' }),
  'Tang': F({ profile: 'deep', len: 0.16, depth: 0.090, tail: 'lunate', snout: 'blunt', dorsal: 'spiny' }),
  'Triggerfish': F({ profile: 'deep', len: 0.17, depth: 0.084, tail: 'fan', snout: 'blunt', dorsal: 'two', pattern: 'mottle' }),
  'Parrotfish': F({ profile: 'deep', len: 0.19, depth: 0.078, tail: 'fan', snout: 'blunt', dorsal: 'one', pattern: 'mottle' }),
  'Wrasse': F({ profile: 'fusiform', len: 0.20, depth: 0.058, tail: 'fan', snout: 'jaw', dorsal: 'one', pattern: 'stripes' }),
  'Cardinalfish': F({ profile: 'deep', len: 0.15, depth: 0.062, tail: 'forked', snout: 'blunt', dorsal: 'two' }),
  'Rabbitfish': F({ profile: 'deep', len: 0.17, depth: 0.078, tail: 'forked', snout: 'tube', dorsal: 'spiny', pattern: 'spots' }),
  'Reef Fish': F({ profile: 'deep', len: 0.17, depth: 0.074, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Grouper': F({ profile: 'fusiform', len: 0.22, depth: 0.092, tail: 'round', snout: 'jaw', dorsal: 'spiny', pattern: 'spots' }),
  'Snapper': F({ profile: 'deep', len: 0.21, depth: 0.080, tail: 'forked', snout: 'jaw', dorsal: 'spiny' }),
  'Mullet': F({ profile: 'fusiform', len: 0.22, depth: 0.062, tail: 'forked', snout: 'blunt', dorsal: 'two' }),
  'Tarpon': F({ profile: 'fusiform', len: 0.25, depth: 0.078, tail: 'forked', snout: 'jaw', dorsal: 'one' }),
  'Barracuda': F({ profile: 'fusiform', len: 0.27, depth: 0.050, tail: 'forked', snout: 'jaw', dorsal: 'two', teeth: true }),
  'Goby': F({ profile: 'fusiform', len: 0.16, depth: 0.048, tail: 'round', snout: 'blunt', dorsal: 'two' }),
  'Blenny': F({ profile: 'eel', len: 0.19, depth: 0.042, tail: 'round', snout: 'blunt', dorsal: 'spiny' }),
  'Flying Gurnard': F({ profile: 'fusiform', len: 0.19, depth: 0.062, tail: 'fan', snout: 'blunt', dorsal: 'sail', pattern: 'spots' }),
  /* ── inflatable and boxy ── */
  'Pufferfish': F({ profile: 'globe', len: 0.15, depth: 0.070, tail: 'fan', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Boxfish': F({ profile: 'box', len: 0.15, depth: 0.070, tail: 'fan', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Blobfish': F({ profile: 'globe', len: 0.17, depth: 0.062, tail: 'round', snout: 'blunt', dorsal: 'none' }),
  'Ocean Sunfish': F({ profile: 'globe', len: 0.16, depth: 0.098, tail: 'none', snout: 'blunt', dorsal: 'one' }),
  'Snailfish': F({ profile: 'globe', len: 0.17, depth: 0.055, tail: 'round', snout: 'blunt', dorsal: 'none' }),
  /* ── the deep: lures, photophores, teeth ── */
  'Anglerfish': F({ profile: 'globe', len: 0.16, depth: 0.078, tail: 'round', snout: 'jaw', dorsal: 'none', lure: true, teeth: true }),
  'Lanternfish': F({ profile: 'fusiform', len: 0.18, depth: 0.052, tail: 'forked', snout: 'blunt', dorsal: 'one', glow: true }),
  'Viperfish': F({ profile: 'eel', len: 0.24, depth: 0.046, tail: 'forked', snout: 'jaw', dorsal: 'one', glow: true, teeth: true }),
  'Fangtooth': F({ profile: 'deep', len: 0.16, depth: 0.070, tail: 'forked', snout: 'jaw', dorsal: 'one', teeth: true }),
  'Dragonfish': F({ profile: 'eel', len: 0.24, depth: 0.044, tail: 'point', snout: 'jaw', dorsal: 'none', glow: true, teeth: true }),
  'Barreleye': F({ profile: 'fusiform', len: 0.18, depth: 0.062, tail: 'fan', snout: 'blunt', dorsal: 'one', glow: true }),
  'Tripod Fish': F({ profile: 'fusiform', len: 0.20, depth: 0.046, tail: 'point', snout: 'blunt', dorsal: 'one' }),
  'Deep-Sea Fish': F({ profile: 'fusiform', len: 0.19, depth: 0.058, tail: 'forked', snout: 'jaw', dorsal: 'one', glow: true }),
  'Monkfish': F({ profile: 'globe', len: 0.19, depth: 0.062, tail: 'round', snout: 'jaw', dorsal: 'none', lure: true, teeth: true, pattern: 'mottle' }),
  /* ── SHARKS: heterocercal tail, gill slits, swept pectorals ── */
  'Shark': F({ profile: 'fusiform', len: 0.25, depth: 0.070, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true }),
  'Reef Shark': F({ profile: 'fusiform', len: 0.25, depth: 0.066, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true }),
  'Juvenile Shark': F({ profile: 'fusiform', len: 0.21, depth: 0.058, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true }),
  'Great White Shark': F({ profile: 'fusiform', len: 0.27, depth: 0.086, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true, teeth: true }),
  'Tiger Shark': F({ profile: 'fusiform', len: 0.26, depth: 0.080, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true, pattern: 'bands', teeth: true }),
  'Mako Shark': F({ profile: 'fusiform', len: 0.26, depth: 0.070, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true, teeth: true }),
  'Whale Shark': F({ profile: 'fusiform', len: 0.28, depth: 0.092, tail: 'shark', snout: 'blunt', dorsal: 'sharkfin', shark: true, pattern: 'spots' }),
  'Basking Shark': F({ profile: 'fusiform', len: 0.28, depth: 0.086, tail: 'shark', snout: 'blunt', dorsal: 'sharkfin', shark: true }),
  'Hammerhead Shark': F({ profile: 'fusiform', len: 0.26, depth: 0.070, tail: 'shark', snout: 'hammer', dorsal: 'sharkfin', shark: true }),
};
