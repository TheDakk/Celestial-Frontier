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
import { profileTube } from './torso.js';
import { coatMaterial } from './skin.js';

/** the cost dial for fish scales — see BIRD_MAT_DETAIL / MAT_DETAIL. 0 is free
    and restores the pre-wave-21 flat body exactly. */
const FISH_MAT_DETAIL = 1;

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
  tail: 'forked' | 'lunate' | 'round' | 'point' | 'shark' | 'fan' | 'none' | 'veil';
  snout: 'blunt' | 'jaw' | 'bill' | 'shovel' | 'tube' | 'hammer';
  dorsal: 'one' | 'sail' | 'two' | 'spiny' | 'none' | 'sharkfin';
  /** ★ GOLD AUDIT — sail height multiplier + bright membrane: a sailfish's
      sail must DOMINATE the silhouette, not sit as a dark sliver */
  sailScale?: number;
  pattern?: 'bands' | 'stripes' | 'spots' | 'mottle' | 'clown' | 'lateral';
  shark?: boolean;    /** gill slits, swept pectorals, heterocercal tail */
  lure?: boolean;     /** the anglerfish esca */
  glow?: boolean;     /** photophore rows */
  teeth?: boolean;
  hue?: string;       /** only where colour IS the identity */
  /* ★ WAVE 21 — THE SIGNATURES. The Platinum audit's fish findings were all the
     same shape: "current fish silhouette is generic; add <the one thing>." Each
     of these is that one thing, expressed IN THE SYSTEM rather than as a
     bespoke painter, so the whole roster can reach for it and a Flying Fish and
     a Flying Gurnard stay recognisably siblings. */
  wings?: 'glide' | 'fan';   /** pectorals so enlarged they ARE the animal */
  dome?: boolean;            /** a transparent cranial dome over upward tubular eyes */
  droop?: boolean;           /** loose gelatinous face — the blobfish read */
  gape?: boolean;            /** an enormous open filter-feeding mouth + broad gills */
  eyeless?: boolean;         /** cave/blind fish — the missing eye IS the species */
  barbels?: boolean;         /** ★ WAVE 66 — the catfish's whiskers, rooted ON the snout */
  /* ★ WAVE 62 — reef-fish signatures gp5 failed the family for */
  scalpel?: string;          /** the surgeonfish's bright caudal-peduncle spine, colour given */
  beak?: boolean;            /** the parrotfish's fused white tooth plate */
  bighead?: number;          /** head mass multiplier for the deep-sea predators */
  paddle?: boolean;          /** a broad flat rostrum, not a spike */
  eyespot?: boolean;         /** the false eye near the tail + a true-eye mask */
  /* ★ GP7 — opt-in silhouette axes. These are deliberately absent from every
     existing row: a specialist fish may ask for its diagnostic outline
     without moving one pixel on the shared fish scaffold. */
  forehead?: 'vertical';     /** blunt male mahi brow instead of a pointed nose */
  dorsalSpan?: 'eye-tail';   /** one low, continuous fin from behind the eye to the peduncle */
  headPlan?: 'flat-wide';    /** dorsoventrally flattened head dominated by a broad mouth */
  bodyTaper?: 'strong';      /** wedge sharply from that head into a narrow caudal body */
  pectoralBase?: 'broad';    /** wide-rooted benthic pectorals, not free-standing fins */
  /** Opt-in non-teleost skin: suppresses the universal bony-fish scale mesh. */
  smoothSkin?: boolean;
  /** A shark's mouth is a real anatomical opening, never the generic jaw score. */
  sharkMouth?: 'crescent' | 'terminal';
  /** Cichlids need a spiny fore-dorsal that resolves into a soft rear lobe. */
  cichlidDorsal?: boolean;
  /** Sailfish pelvic fins are long threads, not the shared low ventral lobe. */
  pelvicThreads?: boolean;
  /** Species-only high-contrast fin tips (reef-shark blacktip read). */
  finTips?: boolean;
  /** Whale-shark white spot-and-bar lattice, deliberately not generic fish spots. */
  whalePattern?: boolean;
  /** Whale-shark flank keels, kept opt-in because a lateral line is not a keel. */
  flankRidges?: boolean;
  /** Broad, low scaleless head for catfish rather than the shared lens point. */
  flatHead?: boolean;
  /** A thick visible terminal lip; currently used only by the cichlid route. */
  thickLips?: boolean;
  /** Remora's ridged dorsal suction plate, kept separate from the dorsal fin. */
  suctionDisc?: boolean;
  /** Archerfish's bold wedge bars and raised shooting mouth. */
  archerBars?: boolean;
  /** Translucent low-density skin for snailfish, distinct from blobfish droop. */
  gelatinous?: boolean;
  /** Ventral adhesive disc, used by the snailfish rather than generic fins. */
  bellySucker?: boolean;
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

/** ★ wave 42 — the smallest honest peduncle for a profile whose heightAt(0)
    is exactly zero (fusiform/deep/globe: sin(0)=0). See the pedH note below. */
function tRefFloor(profile: FishSpec['profile'], depth: number): number {
  return heightAt(profile, 0.12, depth) * 0.55;
}

/** THE FISH. One traced body; the spec is the species. */
export function fishBody(c: Ctx, g: G, pIn: Pal, spec: FishSpec, name = ''): void {
  const r = nrng(g, name, 0xF15E);
  /* ⚠ THIS LINE USED TO READ `spec.hue ? { ...pIn } : pIn` — it COPIED the
     palette when a hue was set and then never applied it. FishSpec has carried
     a documented `hue` field since wave 21 and not one fish has ever used it;
     the whole roster took its rarity roll, which is why the lock reported Cave
     Fish ~ Anchovy and Herring ~ Bonefish as the same picture. A spec field
     that is declared, documented and inert is worse than a missing one,
     because every row that sets it looks correct. */
  let p: Pal = pIn;
  if (spec.hue) {
    const hn = parseInt(spec.hue.slice(1), 16);
    const hr = (hn >> 16) & 255, hg = (hn >> 8) & 255, hb = hn & 255;
    const rgbOf = (a2: number, b2: number, c2: number): string =>
      'rgb(' + (a2 | 0) + ',' + (b2 | 0) + ',' + (c2 | 0) + ')';
    p = { cr: hr, cg: hg, cb: hb, base: spec.hue,
      lit: rgbOf(Math.min(255, hr * 1.30), Math.min(255, hg * 1.30), Math.min(255, hb * 1.28)),
      dark: rgbOf(hr * 0.42, hg * 0.44, hb * 0.48) };
  }
  const cx = S * 0.47, cy = S * 0.50;
  const len = S * spec.len * nvar(name, 0x11, 0.10);
  const depth = S * spec.depth * nvar(name, 0x22, 0.14);
  const nose = cx + len, ped = cx - len;          /* snout tip → caudal peduncle */
  const N = 44;

  /* soft water shadow — a fish is not standing on anything */
  c.fillStyle = 'rgba(0,0,0,0.34)';
  c.beginPath(); c.ellipse(cx, cy + depth * 1.9 + S * 0.05, len * 0.72, S * 0.022, 0, 0, TAU); c.fill();

  const outlineHeights = (t: number): [number, number] => {
    const h = heightAt(spec.profile, t, depth);
    if (spec.bodyTaper === 'strong') {
      /* A monkfish is a broad, low head with a body receding from it, not an
         anglerfish sphere. Keep the front half nearly parallel-sided while
         the rear contracts continuously into the caudal peduncle. */
      const u0 = Math.min(1, Math.max(0, t / 0.62));
      const u = u0 * u0 * (3 - 2 * u0);
      const front = Math.max(0, (t - 0.62) / 0.38);
      return [depth * (0.16 + 0.78 * u - 0.08 * front),
        depth * (0.13 + 0.68 * u - 0.05 * front)];
    }
    if ((spec.sharkMouth === 'terminal' || spec.flatHead) && t >= 0.78) {
      /* Whale sharks terminate in a wide, blunt frontal plane, not the shared
         lens point. The small taper preserves a head while leaving room for a
         full-width mouth and corner eyes. */
      const u = Math.min(1, (t - 0.78) / 0.22);
      return [depth * (spec.flatHead ? 1.18 : 1.06 - 0.15 * u), depth * (spec.flatHead ? 0.94 : 0.88 - 0.12 * u)];
    }
    if (spec.forehead === 'vertical' && t >= 0.82) {
      /* Preserve the laterally-compressed mahi body, but stop both outlines
         from converging to a generic point. The high crown drops steeply to
         a short vertical face; the lower jaw stays shallower. */
      const u = Math.min(1, (t - 0.82) / 0.18);
      return [Math.max(h * 1.04, depth * (1.12 - 0.42 * u)),
        Math.max(h * 0.92, depth * (0.55 - 0.18 * u))];
    }
    return [h * 1.04, h * 0.92];
  };
  const top: Array<[number, number]> = [], bot: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = ped + (nose - ped) * t;
    const [topH, botH] = outlineHeights(t);
    /* the back is deeper than the belly on almost every fish */
    top.push([x, cy - topH]);
    bot.push([x, cy + botH]);
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
  /* ★ WAVE 42, CODE PASS A2 — `heightAt(profile, 0, …)` is EXACTLY ZERO for
     fusiform, deep and globe profiles (their bell term is sin(0)=0), and every
     anchor of the point-tail path is scaled by pedH — so a 'point' tail on any
     of those profiles collapsed to a degenerate line and painted NOTHING. The
     Tripod Fish showed seven orphan ray strokes with no membrane, and every
     PROCEDURAL swimmer that rolls tail%5==='point' with a non-eel body loses
     its tail the same way, forever, invisibly. Floored to a real peduncle:
     no fish's tail attaches through a mathematical point. */
  const pedH = Math.max(heightAt(spec.profile, 0, depth), tRefFloor(spec.profile, depth));
  const tRef = heightAt(spec.profile, 0.14, depth);   /* the body AT the peduncle */
  c.fillStyle = p.dark;
  const tl = len * (spec.tail === 'lunate' ? 0.46 : spec.tail === 'shark' ? 0.52 : 0.36);
  const maxH = heightAt(spec.profile, 0.5, depth);
  /* and CLAMPED to the body it hangs off: a deep-bodied tang measured 3.35x
     its peduncle and grew a tail taller than the fish. A tail is never much
     bigger than the body that swings it. */
  const th = Math.min(tRef * (spec.tail === 'lunate' ? 3.35 : spec.tail === 'fan' ? 2.55 : spec.tail === 'veil' ? 2.4 : 2.15), maxH * 1.30);
  if (spec.tail === 'forked' || spec.tail === 'lunate') {
    c.beginPath();
    c.moveTo(ped + pedH * 0.4, cy);
    c.lineTo(ped - tl, cy - th);
    c.quadraticCurveTo(ped - tl * 0.34, cy, ped - tl, cy + th);
    c.closePath(); c.fill();
  } else if (spec.tail === 'shark') {
    /* Broad and fleshy by construction: the old two needle lobes plus the
       generic ray pass read as a tuna fork even when asymmetry measured right. */
    c.beginPath();
    c.moveTo(ped + pedH * 0.46, cy - pedH * 0.52);
    c.bezierCurveTo(ped - tl * 0.18, cy - th * 0.70, ped - tl * 0.72, cy - th * 1.58, ped - tl * 1.10, cy - th * 1.14);
    c.bezierCurveTo(ped - tl * 0.90, cy - th * 0.52, ped - tl * 0.58, cy - th * 0.10, ped - tl * 0.28, cy + th * 0.08);
    c.bezierCurveTo(ped - tl * 0.54, cy + th * 0.60, ped - tl * 0.64, cy + th * 0.78, ped - tl * 0.40, cy + th * 0.74);
    c.bezierCurveTo(ped - tl * 0.12, cy + th * 0.48, ped + pedH * 0.42, cy + pedH * 0.46, ped + pedH * 0.46, cy - pedH * 0.52);
    c.closePath(); c.fill();
  } else if (spec.tail === 'round' || spec.tail === 'fan') {
    /* a fan GROWS FROM THE PEDUNCLE. As a free-standing ellipse it read as a
       dark disc parked behind the fish, touching nothing. */
    c.beginPath();
    c.moveTo(ped + pedH * 0.3, cy - tRef * 0.85);
    c.quadraticCurveTo(ped - tl * 1.20, cy - th * 0.92, ped - tl * 1.02, cy);
    c.quadraticCurveTo(ped - tl * 1.20, cy + th * 0.92, ped + pedH * 0.3, cy + tRef * 0.85);
    c.closePath(); c.fill();
  } else if (spec.tail === 'veil') {
    /* ★ POLISH — the GOLDFISH's flowing double tail: two overlapping soft
       lobes trailing back and down like silk, each with its own droop. */
    for (const [dy, k, alpha] of [[-0.15, 0.85, 0.75], [0.25, 1.0, 0.95]] as const) {
      c.globalAlpha = alpha;
      c.beginPath();
      c.moveTo(ped + pedH * 0.3, cy + dy * th * 0.4);
      c.quadraticCurveTo(ped - tl * 1.15 * k, cy + dy * th - th * 0.85 * k, ped - tl * 1.5 * k, cy + dy * th - th * 0.25 * k);
      c.quadraticCurveTo(ped - tl * 1.05 * k, cy + dy * th + th * 0.15, ped - tl * 1.45 * k, cy + dy * th + th * 0.85 * k);
      c.quadraticCurveTo(ped - tl * 0.5 * k, cy + dy * th + th * 0.45 * k, ped + pedH * 0.3, cy + dy * th * 0.6);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  } else if (spec.tail === 'point') {
    c.beginPath();
    c.moveTo(ped + pedH * 0.4, cy - pedH * 0.8);
    c.quadraticCurveTo(ped - tl, cy, ped + pedH * 0.4, cy + pedH * 0.8);
    c.closePath(); c.fill();
  }
  if (spec.tail !== 'none' && spec.tail !== 'shark') {   /* teleost fin rays */
    c.strokeStyle = 'rgba(20,26,34,0.28)'; c.lineWidth = 1.8;
    for (let i = -3; i <= 3; i++) {
      c.beginPath(); c.moveTo(ped, cy); c.lineTo(ped - tl * 0.88, cy + i * th * 0.30); c.stroke();
    }
  }

  /* ── the DORSAL, behind the body so it grows out of the back ── */
  const dorsalAt = (t: number): [number, number] => {
    const x = ped + (nose - ped) * t;
    if (spec.forehead === 'vertical' || spec.bodyTaper === 'strong') {
      return [x, cy - outlineHeights(t)[0] * 0.98];
    }
    return [x, cy - heightAt(spec.profile, t, depth) * 1.02];
  };
  c.fillStyle = p.dark;
  if (spec.dorsal === 'sail') {
    const SC = spec.sailScale ?? 1;
    if (spec.dorsalSpan === 'eye-tail') {
      /* The mahi dorsal is not a mid-back triangle: its unbroken base runs
         from just behind the eye almost onto the caudal peduncle. A shallow
         membrane keeps it continuous without turning it into a sailfish. */
      const a = 0.04, b = 0.92, steps = 24;
      c.fillStyle = `rgba(${p.cr * 0.48 | 0},${p.cg * 0.62 | 0},${p.cb * 0.48 | 0},0.92)`;
      c.beginPath();
      for (let i = 0; i <= steps; i++) {
        const u = i / steps, [dx, dy] = dorsalAt(a + (b - a) * u);
        if (!i) c.moveTo(dx, dy); else c.lineTo(dx, dy);
      }
      for (let i = steps; i >= 0; i--) {
        const u = i / steps, [dx, dy] = dorsalAt(a + (b - a) * u);
        c.lineTo(dx, dy - depth * (0.28 + 0.18 * Math.sin(Math.PI * u)));
      }
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(20,26,34,0.28)'; c.lineWidth = 1.5;
      for (let i = 1; i < 16; i++) {
        const u = i / 16, [dx, dy] = dorsalAt(a + (b - a) * u);
        c.beginPath(); c.moveTo(dx, dy);
        c.lineTo(dx, dy - depth * (0.27 + 0.18 * Math.sin(Math.PI * u))); c.stroke();
      }
      c.fillStyle = p.dark;
    } else {
    const [x0, y0] = dorsalAt(0.28), [x1, y1] = dorsalAt(0.86);
    if (SC > 1) {
      /* the billfish sail: a bright cobalt membrane taller than the body */
      const sg = c.createLinearGradient(0, y1 - depth * 2.5 * SC, 0, y0);
      sg.addColorStop(0, 'rgba(58,92,180,0.92)'); sg.addColorStop(1, 'rgba(30,44,96,0.95)');
      c.fillStyle = sg;
    }
    c.beginPath(); c.moveTo(x0, y0);
    c.quadraticCurveTo((x0 + x1) / 2, y1 - depth * 2.5 * SC, x1, y1);
    c.lineTo(x1, y1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,26,34,0.30)'; c.lineWidth = 1.8;
    for (let i = 1; i < 9; i++) {
      const t = 0.28 + (0.58 * i) / 9, [dx, dy] = dorsalAt(t);
      c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + depth * 0.20 * SC, dy - depth * (1.35 - Math.abs(i - 4.5) * 0.20) * SC); c.stroke();
    }
    if (SC > 1) c.fillStyle = p.dark;
    }
  } else if (spec.dorsal === 'sharkfin') {
    /* ★ WAVE 59 — the iconic tall first dorsal. The judge failed sharks for a
       fin that read as a small pale ghost; it is now a big OPAQUE dark triangle
       with a straight leading edge and a swept concave trailing edge, seated on
       the back, plus a small second dorsal further back. */
    const [x0, y0] = dorsalAt(0.42);
    c.fillStyle = p.dark;
    c.beginPath();
    c.moveTo(x0 + len * 0.05, y0);                                   /* rear base */
    c.lineTo(x0 - len * 0.02, y0 - depth * 2.6);                     /* apex, raked back */
    c.quadraticCurveTo(x0 - len * 0.02, y0 - depth * 1.2, x0 - len * 0.10, y0);  /* concave trailing edge to front base */
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(15,20,26,0.4)'; c.lineWidth = 1.5; c.stroke();
    const [x2, y2] = dorsalAt(0.74);   /* the small second dorsal */
    c.fillStyle = p.dark; c.beginPath();
    c.moveTo(x2 + len * 0.02, y2); c.lineTo(x2 - len * 0.01, y2 - depth * 0.9);
    c.quadraticCurveTo(x2 - len * 0.01, y2 - depth * 0.4, x2 - len * 0.05, y2); c.closePath(); c.fill();
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
    /* THE CONTINUOUS MEDIAN FIN. The first cut filled a body-coloured shape
       extending 0.72·depth past a thin eel at 0.72 alpha — its lower lobe
       floated below the belly and read as a translucent SECOND eel (Nick's
       "going off the animal"). It is now a low pale MEMBRANE that HUGS the
       edge: a soft frill reaching only ~0.30·depth, translucent and lit, so
       it belongs to the body instead of doubling it. */
    const fin = `rgba(${Math.min(255, p.cr * 0.6 + 90 | 0)},${Math.min(255, p.cg * 0.6 + 96 | 0)},${Math.min(255, p.cb * 0.6 + 110 | 0)},0.34)`;
    for (const side of [-1, 1] as const) {
      c.fillStyle = fin;
      c.beginPath();
      for (let i = 0; i <= 30; i++) {
        const tt = 0.08 + (0.80 * i) / 30;
        const x = ped + (nose - ped) * tt;
        const h = heightAt(spec.profile, tt, depth);
        const y = cy + side * h * (side < 0 ? 1.02 : 0.94);
        if (!i) c.moveTo(x, y);
        else c.lineTo(x, y + side * depth * 0.30 * Math.sin(tt * Math.PI));   /* hugs, ≤0.30·depth */
      }
      for (let i = 30; i >= 0; i--) {
        const tt = 0.08 + (0.80 * i) / 30;
        const x = ped + (nose - ped) * tt;
        const h = heightAt(spec.profile, tt, depth);
        c.lineTo(x, cy + side * h * (side < 0 ? 1.02 : 0.94));
      }
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(230,240,255,0.20)'; c.lineWidth = 1;   /* the fin's soft edge */
      c.stroke();
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

  /* ★ WAVE 21 — THE WINGS, behind the body so they grow out from under it.
     A flying fish or a gurnard IS its pectorals; drawn at ordinary fin scale
     the audit rightly called both silhouettes generic. */
  const glide = spec.wings === 'glide';
  const wing = (side: -1 | 1): void => {
    if (spec.pectoralBase === 'broad') {
      /* Goosefish pectorals originate on a broad fleshy base and splay along
         the bottom. Draw the root as part of the fin, not as rays converging
         on a pin, so the head reads wide even in this side-on portrait. */
      const wx = ped + (nose - ped) * 0.68, wy = cy + depth * 0.20;
      const span = len * 0.72, chord = depth * 2.15, near = side > 0;
      c.save(); c.translate(wx, wy); c.rotate(side * 0.36);
      const pg = c.createLinearGradient(0, 0, -span, chord * 0.18);
      pg.addColorStop(0, `rgba(${p.cr},${p.cg},${p.cb},${near ? 0.94 : 0.54})`);
      pg.addColorStop(1, `rgba(${Math.min(255, p.cr + 62)},${Math.min(255, p.cg + 70)},${Math.min(255, p.cb + 78)},${near ? 0.62 : 0.30})`);
      c.fillStyle = pg;
      c.beginPath();
      c.moveTo(depth * 0.08, -chord * 0.34);
      c.bezierCurveTo(-span * 0.25, -chord * 0.58, -span * 0.78, -chord * 0.36, -span, -chord * 0.04);
      c.bezierCurveTo(-span * 0.82, chord * 0.34, -span * 0.30, chord * 0.64, depth * 0.08, chord * 0.38);
      c.closePath(); c.fill();
      c.strokeStyle = `rgba(26,24,20,${near ? 0.48 : 0.26})`; c.lineWidth = 1.8;
      for (let i = 0; i <= 9; i++) {
        const u = i / 9, ey = -chord * 0.27 + u * chord * 0.56;
        c.beginPath(); c.moveTo(0, ey * 0.55);
        c.quadraticCurveTo(-span * 0.48, ey, -span * (0.92 - u * 0.05), ey * 0.92); c.stroke();
      }
      c.restore();
      return;
    }
    if (!spec.wings) return;
    const wx = ped + (nose - ped) * 0.64, wy = cy + depth * 0.16;
    /* SCALE IS THE SIGNATURE. The first cut used len*1.35 at 0.2 alpha and the
       wings vanished under the body — the audit's exact complaint, unchanged. */
    const span = glide ? len * 1.85 : len * 1.30;
    const chord = glide ? depth * 2.10 : depth * 3.60;
    const near = side > 0;
    c.save(); c.translate(wx, wy);
    c.rotate(glide ? side * 0.34 : side * 0.46);
    /* a fin membrane is TRANSLUCENT AND LIT — pale at the trailing edge, and
       tinted with the body's own colour at the root so it belongs to the fish */
    const wg = c.createLinearGradient(0, 0, -span, -chord * 0.3);
    const a0 = near ? 0.80 : 0.46, a1 = near ? 0.44 : 0.24;
    wg.addColorStop(0, `rgba(${p.cr},${p.cg},${p.cb},${a0})`);
    wg.addColorStop(0.5, `rgba(${Math.min(255, p.cr + 70)},${Math.min(255, p.cg + 80)},${Math.min(255, p.cb + 100)},${a0 * 0.72})`);
    wg.addColorStop(1, `rgba(${Math.min(255, p.cr + 120)},${Math.min(255, p.cg + 130)},255,${a1})`);
    c.fillStyle = wg;
    c.beginPath();
    c.moveTo(0, -chord * 0.12);
    /* a glider's wing is long and narrow; a gurnard's is a broad round fan */
    c.quadraticCurveTo(-span * 0.52, -chord * (glide ? 0.55 : 0.85), -span, -chord * (glide ? 0.10 : 0.14));
    c.quadraticCurveTo(-span * 0.58, chord * (glide ? 0.34 : 0.86), 0, chord * 0.22);
    c.closePath(); c.fill();
    /* THE RAYS — a pectoral fin is a fan of rays in a membrane, and without
       them a wing this size reads as a painted flap */
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.45 + 60 | 0)},${Math.min(255, p.cg * 0.45 + 70 | 0)},${Math.min(255, p.cb * 0.45 + 90 | 0)},${near ? 0.62 : 0.34})`;
    c.lineWidth = 1.7;
    for (let i = 0; i <= 11; i++) {
      const u = i / 11;
      const ey = -chord * (glide ? 0.22 : 0.55) + u * chord * (glide ? 0.55 : 1.42);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(-span * 0.5, ey * 0.7, -span * (0.95 - u * 0.08), ey);
      c.stroke();
    }
    if (!glide) {   /* the gurnard's membrane is spotted, and the spots wrap it */
      for (let i = 0; i < 26; i++) {
        const u = r(), v = r();
        softMark(c, -span * (0.18 + u * 0.72), (-0.55 + v * 1.35) * chord * (0.3 + u * 0.7),
          4 + r() * 5, 4 + r() * 5, '24,40,96', near ? 0.42 : 0.22);
      }
    }
    c.restore();
  };
  wing(-1);   /* the far wing, behind the body */

  /* ── the BILL / long jaw, drawn before the body so it seats in the head ── */
  if (spec.paddle) {
    /* ★ a paddlefish rostrum is a BROAD FLAT BLADE, a third of the animal —
       drawn as the generic 'bill' spike it disappeared entirely */
    const TIP = nose + len * 0.92;
    /* the rostrum carries the BODY's countershading straight out of the head —
       a separately-shaded blade reads as a plank taped to a fish */
    const pg = c.createLinearGradient(0, cy - depth * 0.8, 0, cy + depth * 0.8);
    pg.addColorStop(0, p.dark); pg.addColorStop(0.46, p.base); pg.addColorStop(1, p.lit);
    c.fillStyle = pg;
    c.beginPath();
    c.moveTo(nose - depth * 2.0, cy - depth * 0.52);
    c.bezierCurveTo(nose + len * 0.30, cy - depth * 0.44, nose + len * 0.70, cy - depth * 0.24, TIP, cy - depth * 0.03);
    c.quadraticCurveTo(TIP + depth * 0.22, cy, TIP, cy + depth * 0.06);
    c.bezierCurveTo(nose + len * 0.70, cy + depth * 0.34, nose + len * 0.30, cy + depth * 0.50, nose - depth * 2.0, cy + depth * 0.58);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(226,236,252,0.24)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(nose - depth * 0.6, cy - depth * 0.60);
    c.bezierCurveTo(nose + len * 0.32, cy - depth * 0.48, nose + len * 0.70, cy - depth * 0.24, TIP - depth * 0.2, cy - depth * 0.02);
    c.stroke();
    /* the electroreceptor pitting, thinning toward the tip as the blade does */
    for (let i = 0; i < 44; i++) {
      const u = Math.sqrt(r());
      const half = depth * (0.80 - u * 0.72);
      softMark(c, nose - depth * 0.6 + u * (TIP - nose + depth * 0.6), cy + (r() - 0.5) * 2 * half, 3, 2.4, '18,24,32', 0.26);
    }
  } else if (spec.snout === 'bill') {
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
  bg.addColorStop(0, p.dark); bg.addColorStop(0.46, p.base); bg.addColorStop(1, p.lit);
  c.fillStyle = bg;   /* dark above, pale below — the real countershading */
  c.beginPath(); trace(); c.fill();

  /* ★ WAVE 21 — THE SCALES. A fish needed no new geometry to earn the
     material layer: `heightAt(profile, t, depth)` already IS a radius profile
     down the body, which is the one thing a Tube wants. profileTube wraps it,
     and the scale rows then curve with the girth instead of tiling flatly
     across the silhouette — the difference between a fish and a fish-shaped
     piece of wallpaper.

     Scaled by `depth`: the material's default density suits a mammal-sized
     torso, and an anchovy is a tenth of one. Left unscaled, a small fish gets
     scales the size of its own head. */
  if (!spec.smoothSkin) {
    const scaleTube = profileTube(ped, nose, cy, (t) =>
      spec.bodyTaper === 'strong' || spec.forehead === 'vertical'
        ? (outlineHeights(t)[0] + outlineHeights(t)[1]) / 1.96
        : heightAt(spec.profile, t, depth));
    c.save(); c.beginPath(); trace(); c.clip();
    coatMaterial(c, scaleTube, r, p, 'scale', { detail: FISH_MAT_DETAIL });
    c.restore();
  }

  /* the pattern, clipped to the body so marks are SKIN not stickers */
  c.save(); c.beginPath(); trace(); c.clip();
  if (spec.archerBars) {
    /* Archerfish carry broad diagonal wedges, not the shared soft band texture. */
    c.fillStyle = 'rgba(30,34,24,0.58)';
    for (const t of [0.26, 0.47, 0.68]) {
      const x = ped + (nose - ped) * t;
      c.beginPath();
      c.moveTo(x - depth * 0.18, cy - depth * 1.46);
      c.lineTo(x + depth * 0.20, cy - depth * 1.22);
      c.lineTo(x - depth * 0.32, cy + depth * 1.34);
      c.lineTo(x - depth * 0.68, cy + depth * 1.08);
      c.closePath(); c.fill();
    }
  } else if (spec.whalePattern) {
    /* A whale shark carries bright spots and cross-bars on a dark, smooth
       ground. Keeping this out of the generic `spots` branch prevents the
       normal soft blotch treatment from turning into a scale-like lattice. */
    c.fillStyle = 'rgba(238,246,250,0.88)';
    for (let ix = 0; ix < 9; ix++) {
      const t = 0.15 + ix * 0.085;
      const x = ped + (nose - ped) * t;
      const h = heightAt(spec.profile, t, depth);
      for (const frac of [-0.46, -0.12, 0.23, 0.53]) {
        c.beginPath(); c.arc(x, cy + h * frac, depth * 0.105, 0, TAU); c.fill();
      }
    }
    c.strokeStyle = 'rgba(232,242,248,0.66)'; c.lineWidth = Math.max(1.6, depth * 0.10);
    for (const frac of [-0.28, 0.16, 0.47]) {
      c.beginPath(); c.moveTo(ped + len * 0.06, cy + depth * frac);
      c.quadraticCurveTo(cx, cy + depth * (frac - 0.07), nose - depth * 0.34, cy + depth * (frac - 0.02)); c.stroke();
    }
  } else if (spec.pattern === 'bands') {
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
  } else if (spec.pattern === 'lateral') {
    /* ★ POLISH — the tetra's single BRIGHT neon stripe, eye to tail */
    c.strokeStyle = 'rgba(120,240,255,0.95)'; c.lineWidth = depth * 0.28; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ped + (nose - ped) * 0.04, cy - depth * 0.06);
    c.quadraticCurveTo(cx, cy - depth * 0.18, nose - depth * 0.5, cy - depth * 0.10); c.stroke();
    c.strokeStyle = 'rgba(255,80,80,0.65)'; c.lineWidth = depth * 0.18;   /* the red under-flash */
    c.beginPath(); c.moveTo(ped + (nose - ped) * 0.04, cy + depth * 0.16);
    c.quadraticCurveTo(cx, cy + depth * 0.10, ped + (nose - ped) * 0.5, cy + depth * 0.14); c.stroke();
  } else if (spec.pattern === 'clown') {
    /* ★ WAVE 59 — three WHITE vertical bands edged in black: the clownfish. */
    for (const t of [0.28, 0.55, 0.80]) {
      const x = ped + (nose - ped) * t;
      c.strokeStyle = 'rgba(12,14,18,0.9)'; c.lineWidth = depth * 0.5;
      c.beginPath(); c.moveTo(x, cy - depth * 1.4); c.lineTo(x - depth * 0.12, cy + depth * 1.4); c.stroke();
      c.strokeStyle = 'rgba(248,250,252,0.96)'; c.lineWidth = depth * 0.32;
      c.beginPath(); c.moveTo(x, cy - depth * 1.4); c.lineTo(x - depth * 0.12, cy + depth * 1.4); c.stroke();
    }
  }
  /* the lateral line — on nearly every bony fish, and it reads */
  c.strokeStyle = 'rgba(240,244,255,0.16)'; c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(ped + (nose - ped) * 0.08, cy - depth * 0.10);
  c.quadraticCurveTo(cx, cy - depth * 0.30, nose - depth * 0.4, cy - depth * 0.16);
  c.stroke();
  if (spec.flankRidges) {
    c.strokeStyle = 'rgba(214,230,236,0.60)'; c.lineWidth = Math.max(2.0, depth * 0.12);
    for (const yFrac of [-0.40, -0.06, 0.28]) {
      c.beginPath(); c.moveTo(ped + len * 0.02, cy + depth * yFrac);
      c.quadraticCurveTo(cx, cy + depth * (yFrac - 0.10), nose - depth * 0.38, cy + depth * (yFrac - 0.04)); c.stroke();
    }
  }
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
    /* ★ WAVE 59 — SHARP COUNTERSHADING. A shark is grey over an abruptly white
       belly with a defined boundary along the flank — not the smooth gradient
       every bony fish gets (the judge's "one continuous scale mesh"). Paint a
       pale belly with a crisp upper edge that dips under the eye and tail. */
    const bly = (t: number): number => cy + heightAt(spec.profile, t, depth) * 0.12;
    const bg3 = c.createLinearGradient(0, cy, 0, cy + depth * 1.5);
    bg3.addColorStop(0, 'rgba(238,242,248,0.0)'); bg3.addColorStop(0.25, 'rgba(238,242,248,0.85)'); bg3.addColorStop(1, 'rgba(246,249,252,0.95)');
    c.fillStyle = bg3;
    c.beginPath();
    c.moveTo(ped, bly(0.02));
    for (let i = 1; i <= 12; i++) { const t = i / 12; c.lineTo(ped + (nose - ped) * t, bly(t)); }
    c.lineTo(nose, cy + depth * 1.6); c.lineTo(ped, cy + depth * 1.6); c.closePath(); c.fill();
  }
  c.restore();
  c.strokeStyle = 'rgba(214,228,248,0.30)'; c.lineWidth = 2;   /* the rim */
  c.beginPath(); trace(); c.stroke();

  if (spec.gelatinous) {
    /* Snailfish retain a soft translucent body instead of teleost-hard edges. */
    c.save(); c.beginPath(); trace(); c.clip();
    const gg = c.createLinearGradient(0, cy - depth * 1.5, 0, cy + depth * 1.5);
    gg.addColorStop(0, 'rgba(246,226,232,0.34)');
    gg.addColorStop(0.55, 'rgba(255,244,246,0.16)');
    gg.addColorStop(1, 'rgba(154,104,112,0.20)');
    c.fillStyle = gg; c.fillRect(ped - depth, cy - depth * 2.2, (nose - ped) + depth * 2, depth * 4.4);
    c.restore();
  }

  if (spec.suctionDisc) {
    /* The remora plate lives on top of the head and resolves into dark ridges. */
    const dx = nose - len * 0.19, dy = cy - depth * 0.93;
    c.save(); c.translate(dx, dy); c.rotate(-0.10);
    c.fillStyle = 'rgba(20,24,28,0.92)';
    c.beginPath(); c.ellipse(0, 0, len * 0.27, Math.max(depth * 0.42, len * 0.045), 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(188,196,192,0.32)'; c.lineWidth = Math.max(1.1, depth * 0.075);
    for (let i = -3; i <= 3; i++) {
      const x = i * len * 0.060;
      c.beginPath(); c.moveTo(x, -depth * 0.30); c.lineTo(x, depth * 0.30); c.stroke();
    }
    c.restore();
  }

  wing(1);   /* the near wing, OVER the body — this is the one that reads */

  /* ── the PECTORAL fin, in front of the body ── */
  /* These fins belong in the foreground. The generic dorsal pass is deliberately
     behind the body so it can grow from a teleost's back; shark, cichlid and
     sail silhouettes lose their identity if that same layering buries them. */
  if (spec.dorsal === 'sharkfin') {
    const [x0, y0] = dorsalAt(0.43);
    c.fillStyle = `rgb(${Math.max(16, p.cr * 0.48) | 0},${Math.max(18, p.cg * 0.50) | 0},${Math.max(22, p.cb * 0.54) | 0})`;
    c.beginPath();
    c.moveTo(x0 - len * 0.13, y0 + depth * 0.05);
    c.lineTo(x0 - len * 0.015, y0 - depth * 3.35);
    c.quadraticCurveTo(x0 + len * 0.055, y0 - depth * 1.05, x0 + len * 0.16, y0 + depth * 0.04);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(218,230,244,0.26)'; c.lineWidth = 1.8; c.stroke();
    const [x2, y2] = dorsalAt(0.72);
    c.fillStyle = p.dark; c.beginPath();
    c.moveTo(x2 - len * 0.045, y2); c.lineTo(x2, y2 - depth * 1.00);
    c.quadraticCurveTo(x2 + len * 0.025, y2 - depth * 0.35, x2 + len * 0.06, y2); c.closePath(); c.fill();
  }
  if (spec.cichlidDorsal) {
    const a = 0.20, b = 0.93, steps = 24;
    c.fillStyle = `rgba(${p.cr * 0.52 | 0},${p.cg * 0.56 | 0},${p.cb * 0.72 | 0},0.96)`;
    c.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, [x, y] = dorsalAt(a + (b - a) * u);
      if (!i) c.moveTo(x, y); else c.lineTo(x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const u = i / steps, [x, y] = dorsalAt(a + (b - a) * u);
      const h = u < 0.48 ? depth * (1.15 - u * 0.35) : depth * (0.82 + Math.sin((u - 0.48) / 0.52 * Math.PI) * 0.58);
      c.lineTo(x, y - h);
    }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,26,34,0.50)'; c.lineWidth = 1.45;
    for (let i = 1; i < 9; i++) {
      const u = i / 10, [x, y] = dorsalAt(a + (b - a) * u);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + depth * 0.11, y - depth * (1.08 - u * 0.36)); c.stroke();
    }
  }
  if (spec.dorsal === 'sail' && spec.pelvicThreads) {
    const a = 0.12, b = 0.94, steps = 28;
    c.fillStyle = `rgba(${Math.min(255, p.cr * 0.72 + 35) | 0},${Math.min(255, p.cg * 0.70 + 45) | 0},${Math.min(255, p.cb * 1.08 + 38) | 0},0.92)`;
    c.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, [x, y] = dorsalAt(a + (b - a) * u);
      if (!i) c.moveTo(x, y); else c.lineTo(x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const u = i / steps, [x, y] = dorsalAt(a + (b - a) * u);
      c.lineTo(x, y - depth * (2.55 + 1.20 * Math.sin(Math.PI * u)));
    }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(228,242,255,0.30)'; c.lineWidth = 1.35;
    for (let i = 1; i < 17; i++) {
      const u = i / 17, [x, y] = dorsalAt(a + (b - a) * u);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - depth * (2.52 + 1.18 * Math.sin(Math.PI * u))); c.stroke();
    }
  }
  if (spec.pelvicThreads) {
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.85 + 36) | 0},${Math.min(255, p.cg * 0.82 + 44) | 0},${Math.min(255, p.cb * 1.12 + 42) | 0},0.92)`;
    c.lineWidth = Math.max(1.8, depth * 0.10); c.lineCap = 'round';
    for (const side of [-1, 1] as const) {
      c.beginPath(); c.moveTo(ped + (nose - ped) * 0.48, cy + depth * 0.72);
      c.quadraticCurveTo(ped + (nose - ped) * 0.32, cy + depth * (1.38 + side * 0.14), ped - len * 0.24, cy + depth * (1.70 + side * 0.22)); c.stroke();
    }
  }
  if (spec.wings || spec.pectoralBase) { /* these ARE the pectorals; a second pair would double them */ }
  else {
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
  }

  /* ── the HEAD: jaw line, teeth, eye, and the angler's lure ── */
  if (spec.finTips) {
    /* Blacktip-style terminal patches sit ON the silhouette; a colour-only
       texture cannot survive the scale mesh or the card-size fit. */
    c.fillStyle = 'rgba(15,18,22,0.96)';
    const [dx, dy] = dorsalAt(0.43);
    c.beginPath(); c.moveTo(dx - len * 0.035, dy - depth * 2.58); c.lineTo(dx + len * 0.012, dy - depth * 3.34); c.lineTo(dx + len * 0.042, dy - depth * 2.46); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(ped - tl * 0.92, cy - th * 1.22); c.lineTo(ped - tl * 1.10, cy - th * 1.14); c.lineTo(ped - tl * 0.84, cy - th * 0.90); c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(ped + len * 0.02, cy + depth * 0.12); c.lineTo(ped + len * 0.22, cy + depth * 0.45); c.lineTo(ped + len * 0.13, cy + depth * 0.58); c.closePath(); c.fill();
  }
  const hx = nose - depth * 0.55;
  if (spec.headPlan === 'flat-wide') {
    /* MONKFISH / GOOSEFISH: the mouth occupies nearly half the animal. Its
       cavity begins behind the eye, opens upward at the front, and carries
       inward-slanting teeth on both jaws. This sits inside the flat outline,
       so it reads as a head with a tapering body rather than a head pasted on. */
    const jawBack = ped + (nose - ped) * 0.56;
    const mouthFront = nose + depth * 0.04;
    const mg = c.createRadialGradient(mouthFront - depth * 0.45, cy + depth * 0.28,
      depth * 0.08, jawBack, cy + depth * 0.28, len * 0.70);
    mg.addColorStop(0, 'rgba(46,30,20,0.92)');
    mg.addColorStop(0.55, 'rgba(20,14,11,0.95)');
    mg.addColorStop(1, 'rgba(5,7,9,0.98)');
    c.fillStyle = mg;
    c.beginPath();
    c.moveTo(mouthFront, cy + depth * 0.02);
    c.quadraticCurveTo(nose - depth * 0.44, cy + depth * 0.04, jawBack, cy + depth * 0.11);
    c.quadraticCurveTo(jawBack - depth * 0.10, cy + depth * 0.27, jawBack, cy + depth * 0.42);
    c.quadraticCurveTo(nose - depth * 0.36, cy + depth * 0.66, mouthFront, cy + depth * 0.55);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(222,205,170,0.42)'; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(mouthFront, cy + depth * 0.02);
    c.quadraticCurveTo(nose - depth * 0.44, cy + depth * 0.04, jawBack, cy + depth * 0.11); c.stroke();
    c.strokeStyle = 'rgba(76,54,38,0.72)'; c.lineWidth = 3.8;
    c.beginPath(); c.moveTo(jawBack, cy + depth * 0.42);
    c.quadraticCurveTo(nose - depth * 0.36, cy + depth * 0.66, mouthFront, cy + depth * 0.55); c.stroke();
    if (spec.teeth) {
      c.fillStyle = '#f2eee0';
      for (let i = 0; i < 7; i++) {
        const u = (i + 0.5) / 7;
        const x = jawBack + (mouthFront - jawBack) * u;
        const tooth = depth * (0.13 + 0.05 * (i % 3) / 2);
        const upper = cy + depth * (0.08 + 0.03 * (1 - u));
        c.beginPath(); c.moveTo(x - depth * 0.07, upper);
        c.lineTo(x - depth * 0.12, upper + tooth);
        c.lineTo(x + depth * 0.06, upper + depth * 0.01); c.closePath(); c.fill();
        const lower = cy + depth * (0.43 + 0.10 * u);
        c.beginPath(); c.moveTo(x - depth * 0.06, lower);
        c.lineTo(x + depth * 0.10, lower - tooth * 0.76);
        c.lineTo(x + depth * 0.08, lower + depth * 0.01); c.closePath(); c.fill();
      }
    }
    /* Frilly dermal tabs break the lower-jaw silhouette, another goosefish
       signature, but stay short enough not to compete with the pectorals. */
    c.strokeStyle = `rgba(${p.cr * 0.42 | 0},${p.cg * 0.40 | 0},${p.cb * 0.36 | 0},0.82)`;
    c.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.4) / 6, x = jawBack + (mouthFront - jawBack) * u;
      const y = cy + depth * (0.46 + 0.11 * u);
      c.beginPath(); c.moveTo(x, y);
      c.quadraticCurveTo(x - depth * 0.06, y + depth * (0.20 + 0.08 * (i % 2)),
        x - depth * 0.18, y + depth * (0.30 + 0.10 * (i % 2))); c.stroke();
    }
  } else {
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
  }
  if (spec.sharkMouth) {
    /* The generic jaw score follows a teleost's tapered cheek. Shark mouths sit
       below (or across the front of) a broad head, and must read as an opening. */
    if (spec.sharkMouth === 'terminal') {
      const mx = nose - depth * 0.42;
      c.fillStyle = 'rgba(5,9,14,0.94)';
      c.beginPath();
      c.roundRect(mx - depth * 0.18, cy - depth * 0.12, depth * 0.96, depth * 0.42, depth * 0.10); c.fill();
      c.strokeStyle = 'rgba(224,232,238,0.62)'; c.lineWidth = Math.max(2, depth * 0.10);
      c.beginPath(); c.moveTo(mx - depth * 0.10, cy - depth * 0.10); c.lineTo(mx + depth * 0.72, cy - depth * 0.10); c.stroke();
    } else {
      c.strokeStyle = 'rgba(8,13,19,0.88)'; c.lineWidth = Math.max(2.4, depth * 0.14); c.lineCap = 'round';
      c.beginPath();
      c.moveTo(nose - depth * 0.22, cy + depth * 0.34);
      c.quadraticCurveTo(nose - depth * 0.90, cy + depth * 0.72, nose - depth * 1.78, cy + depth * 0.42); c.stroke();
      c.strokeStyle = 'rgba(220,232,238,0.38)'; c.lineWidth = Math.max(1.4, depth * 0.07);
      c.beginPath();
      c.moveTo(nose - depth * 0.20, cy + depth * 0.25);
      c.quadraticCurveTo(nose - depth * 0.90, cy + depth * 0.52, nose - depth * 1.72, cy + depth * 0.35); c.stroke();
    }
  }
  if (spec.flatHead) {
    c.fillStyle = 'rgba(20,17,15,0.82)';
    c.beginPath(); c.roundRect(nose - depth * 1.00, cy + depth * 0.12, depth * 1.04, depth * 0.28, depth * 0.10); c.fill();
    c.strokeStyle = 'rgba(210,184,150,0.48)'; c.lineWidth = Math.max(1.6, depth * 0.07);
    c.beginPath(); c.moveTo(nose - depth * 0.98, cy + depth * 0.12); c.lineTo(nose - depth * 0.04, cy + depth * 0.12); c.stroke();
  }
  if (spec.thickLips) {
    c.strokeStyle = 'rgba(224,198,182,0.78)'; c.lineWidth = Math.max(2.4, depth * 0.18); c.lineCap = 'round';
    c.beginPath(); c.moveTo(nose + depth * 0.02, cy + depth * 0.03); c.quadraticCurveTo(nose - depth * 0.28, cy + depth * 0.20, nose - depth * 0.62, cy + depth * 0.16); c.stroke();
    c.strokeStyle = 'rgba(35,24,20,0.70)'; c.lineWidth = Math.max(1.4, depth * 0.07);
    c.beginPath(); c.moveTo(nose + depth * 0.04, cy + depth * 0.10); c.quadraticCurveTo(nose - depth * 0.29, cy + depth * 0.23, nose - depth * 0.60, cy + depth * 0.20); c.stroke();
  }
  if (spec.archerBars) {
    /* A short raised upper lip is the archerfish's shooting nozzle. */
    c.strokeStyle = 'rgba(30,34,24,0.82)'; c.lineWidth = Math.max(1.8, depth * 0.12); c.lineCap = 'round';
    c.beginPath(); c.moveTo(nose + depth * 0.05, cy - depth * 0.10);
    c.quadraticCurveTo(nose - depth * 0.22, cy - depth * 0.54, nose - depth * 0.66, cy - depth * 0.40); c.stroke();
  }
  if (spec.barbels) {
    /* ★ WAVE 66 — the catfish's whiskers: three pairs rooted ON the snout tip
       and jaw, drooping down and back. gp3: "NO barbels — the single most
       identifying feature — in its place a detached blob". */
    c.strokeStyle = 'rgba(30,24,18,0.85)'; c.lineCap = 'round';
    for (const [ry, len2, w2] of [[0.06, 0.9, 2.6], [0.24, 0.62, 2.0], [0.38, 0.42, 1.6]] as const) {
      c.lineWidth = w2;
      c.beginPath(); c.moveTo(nose - depth * 0.1, cy + depth * ry);
      c.quadraticCurveTo(nose + depth * len2 * 0.7, cy + depth * (ry + 0.3), nose + depth * len2, cy + depth * (ry + 0.85)); c.stroke();
      c.beginPath(); c.moveTo(nose - depth * 0.3, cy + depth * ry);
      c.quadraticCurveTo(nose - depth * 0.5 - depth * len2 * 0.3, cy + depth * (ry + 0.5), nose - depth * 0.45 - depth * len2 * 0.4, cy + depth * (ry + 0.95)); c.stroke();
    }
  }
  if (spec.beak) {
    /* ★ WAVE 62 — the parrotfish's fused white tooth PLATE: a solid pale beak
       capping the snout, proud of the profile, with the fused seam. */
    c.fillStyle = '#f0ece0';
    c.beginPath();
    c.moveTo(nose - depth * 0.50, cy - depth * 0.30);
    c.quadraticCurveTo(nose + depth * 0.78, cy - depth * 0.12, nose + depth * 0.28, cy + depth * 0.62);
    c.quadraticCurveTo(nose - depth * 0.52, cy + depth * 0.56, nose - depth * 0.50, cy - depth * 0.30);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,110,90,0.6)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(nose - depth * 0.48, cy + depth * 0.18); c.lineTo(nose + depth * 0.48, cy + depth * 0.20); c.stroke();
  }
  if (spec.scalpel) {
    /* ★ WAVE 62 — the surgeonfish's scalpel: a bright contrasting blade at the
       caudal peduncle, the feature the family is NAMED for. */
    c.fillStyle = spec.scalpel;
    c.save(); c.translate(ped + (nose - ped) * 0.045, cy); c.rotate(-0.45);
    c.beginPath(); c.ellipse(0, 0, depth * 0.34, depth * 0.11, 0, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1.2;
    c.beginPath(); c.ellipse(ped + (nose - ped) * 0.045, cy, depth * 0.30, depth * 0.10, -0.45, 0, TAU); c.stroke();
  }
  /* ★ D-ART-123 — THE CEPHALOFOIL. `snout:'hammer'` has existed since wave 11
     and all it ever did was widen the jaw start by depth*0.2 — about 1.4% of
     body length, i.e. nothing. The audit's verdict was blunt and correct: "a
     generic scaled mackerel; no cephalofoil of any kind". The hammer IS the
     animal, so it is drawn here as what it is: a transverse bar across the
     nose, squared off, with the eyes carried out to its tips. */
  if (spec.snout === 'hammer') {
    const hw = len * 0.30, hth = len * 0.135;      /* broad rooted foil, not a thin domino */
    const hx2 = nose - hth * 1.5;                   /* ★ WAVE 59 — seated BACK so the
       bar overlaps the head instead of floating forward of the tapering nose
       (the judge's "hammer stranded off with a gap of background"). */
    /* a filled neck wedge tying the bar's centre into the body, killing the gap */
    c.fillStyle = p.base;
    c.beginPath();
    c.moveTo(hx2, cy - hw * 0.5); c.lineTo(nose + hth * 0.5, cy - depth * 0.5);
    c.lineTo(nose + hth * 0.5, cy + depth * 0.5); c.lineTo(hx2, cy + hw * 0.5); c.closePath(); c.fill();
    const hg = c.createLinearGradient(hx2, cy - hw, hx2, cy + hw);
    hg.addColorStop(0, p.dark); hg.addColorStop(0.42, p.base); hg.addColorStop(1, p.lit);
    c.fillStyle = hg;
    c.beginPath();
    /* a shallow-arched bar: the leading edge bows forward a little at centre */
    c.moveTo(hx2 - hth * 0.72, cy - hw * 0.92);
    c.quadraticCurveTo(hx2 - hth * 1.28, cy - hw * 0.48, hx2 - hth * 0.72, cy + hw * 0.92);
    c.lineTo(hx2 + hth * 0.86, cy + hw * 0.64);
    c.quadraticCurveTo(hx2 + hth * 1.30, cy, hx2 + hth * 0.86, cy - hw * 0.64);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(16,22,28,0.34)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(hx2 - hth * 0.72, cy - hw * 0.92);
    c.quadraticCurveTo(hx2 - hth * 1.28, cy - hw * 0.48, hx2 - hth * 0.72, cy + hw * 0.92); c.stroke();
    /* the eyes ride the OUTBOARD TIPS — that is the point of the shape */
    for (const sgn of [-1, 1]) {
      c.fillStyle = '#f4f6f4';
       c.beginPath(); c.arc(hx2 - hth * 0.02, cy + sgn * hw * 0.74, depth * 0.18, 0, TAU); c.fill();
      c.fillStyle = '#10161c';
       c.beginPath(); c.arc(hx2 - hth * 0.02, cy + sgn * hw * 0.74, depth * 0.09, 0, TAU); c.fill();
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
  /* ═══ ★ WAVE 21 — THE HEAD SIGNATURES ═══ */

  if (spec.gape) {
    /* BASKING SHARK: the mouth is the animal. A cavernous open gape at the
       front and a gill region so broad it nearly girdles the body. */
    /* A BASKING SHARK'S OPEN MOUTH IS A TUNNEL, not a wedge. The first cut drew
       a black triangle raked with pale lines and read as a broom. It is now a
       round opening with an inner gradient — dark at the throat, catching light
       at the rim — which is what makes an aperture read as a hole in a body. */
    /* Wide, shallow cavity tucked UNDER the conical snout: a tall frontal disc
       reads as a lamprey funnel even when it is correctly dark inside. */
    const mx = nose - depth * 0.72, my = cy + depth * 0.33;
    const mrx = depth * 1.28, mry = depth * 0.58;
    const mg = c.createRadialGradient(mx - mrx * 0.3, my, mrx * 0.15, mx, my, mrx * 2.2);
    mg.addColorStop(0, 'rgba(4,7,11,0.96)');
    mg.addColorStop(0.62, 'rgba(12,18,26,0.92)');
    mg.addColorStop(1, 'rgba(36,46,60,0.80)');
    c.fillStyle = mg;
    c.save(); c.translate(mx, my); c.rotate(-0.16);
    c.beginPath(); c.ellipse(0, 0, mrx, mry, 0, 0, TAU); c.fill();
    /* the gill rakers, a faint comb ON the far wall of the throat */
    c.save(); c.clip();
    c.strokeStyle = 'rgba(140,158,180,0.13)'; c.lineWidth = 1.1;
    for (let i = 0; i < 11; i++) {
      const u = i / 10;
      c.beginPath(); c.moveTo(-mrx * 0.9, -mry + u * mry * 2); c.lineTo(mrx * 0.5, -mry * 0.9 + u * mry * 1.8); c.stroke();
    }
    c.restore();
    /* THE LIP: a thick pale ring all the way round, brightest on the upper jaw */
    c.strokeStyle = 'rgba(236,244,255,0.46)'; c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, 0, mrx, mry, 0, -1.9, 1.2); c.stroke();
    c.strokeStyle = 'rgba(200,214,232,0.30)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(0, 0, mrx, mry, 0, 1.2, TAU - 1.9); c.stroke();
    c.restore();
    /* the broad gill region: slits running nearly the full depth of the body */
    c.strokeStyle = 'rgba(14,20,28,0.52)'; c.lineWidth = 3.2; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const x = ped + (nose - ped) * (0.60 + i * 0.045);
      const h = heightAt(spec.profile, 0.60 + i * 0.045, depth);
      c.beginPath(); c.moveTo(x + depth * 0.14, cy - h * 0.86);
      c.quadraticCurveTo(x - depth * 0.18, cy, x + depth * 0.10, cy + h * 0.88); c.stroke();
    }
  }

  if (spec.droop) {
    /* BLOBFISH: gelatinous, low-density flesh that SAGS. The bulbous nose,
       the loose brow shelf and the downturned mouth are the whole read. */
    const nx = nose - depth * 0.18, ny = cy + depth * 0.22;
    const dg = c.createRadialGradient(nx - depth * 0.2, ny - depth * 0.3, 2, nx, ny, depth * 0.95);
    dg.addColorStop(0, p.lit); dg.addColorStop(0.6, p.base); dg.addColorStop(1, p.dark);
    c.fillStyle = dg;
    c.beginPath(); c.ellipse(nx, ny, depth * 0.82, depth * 0.66, -0.22, 0, TAU); c.fill();
    /* the sagging brow, overhanging the eye */
    c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.9)`;
    c.beginPath();
    c.moveTo(nose - depth * 1.7, cy - depth * 0.72);
    c.quadraticCurveTo(nose - depth * 0.5, cy - depth * 1.05, nose - depth * 0.05, cy - depth * 0.30);
    c.quadraticCurveTo(nose - depth * 0.8, cy - depth * 0.34, nose - depth * 1.7, cy - depth * 0.30);
    c.closePath(); c.fill();
    /* the mouth, turned down at both corners */
    c.strokeStyle = 'rgba(14,18,24,0.55)'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(nose - depth * 0.10, cy + depth * 0.34);
    c.quadraticCurveTo(nose - depth * 1.0, cy + depth * 0.98, nose - depth * 1.9, cy + depth * 0.30);
    c.stroke();
    /* loose skin folds — the flesh hangs off the frame */
    c.strokeStyle = `rgba(${p.cr * 0.5 | 0},${p.cg * 0.5 | 0},${p.cb * 0.5 | 0},0.34)`; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const x0 = nose - depth * (1.6 + i * 0.9);
      c.beginPath(); c.moveTo(x0, cy + depth * (0.30 + i * 0.10));
      c.quadraticCurveTo(x0 - depth * 0.5, cy + depth * (1.0 + i * 0.12), x0 - depth * 1.1, cy + depth * (0.42 + i * 0.10));
      c.stroke();
    }
  }

  if (spec.bighead) {
    /* FANGTOOTH / VIPERFISH: the deep sea builds a head around a mouth. The
       skull is enlarged over the traced body and the fangs are long enough to
       close OUTSIDE it — that overbite is the recognition. */
    const k = spec.bighead;
    const hxx = nose - depth * 0.9;
    /* THE HEAD MUST WEAR THE BODY'S LIGHT. Shaded on its own radial ramp it
       read as a grey box bolted to an orange fish; it now carries the same
       dark-above/pale-below countershading the traced body does, so the two
       are one animal seen under one lamp. */
    const hg = c.createLinearGradient(0, cy - depth * k * 1.4, 0, cy + depth * k * 1.4);
    hg.addColorStop(0, p.dark); hg.addColorStop(0.46, p.base); hg.addColorStop(1, p.lit);
    c.fillStyle = hg;
    /* the head TAPERS BACK INTO THE BODY. Ending it on a curve left a rounded
       box parked on a thin fish; the rear now runs back to where the traced
       body is as deep as the skull, so the two meet without a seam. */
    const back = ped + (nose - ped) * 0.34;
    const bh = heightAt(spec.profile, 0.34, depth);
    const skull = (): void => {
      c.beginPath();
      c.moveTo(nose + depth * 0.15, cy - depth * 0.10);
      c.bezierCurveTo(nose - depth * 0.2, cy - depth * k * 1.30, hxx - depth * k * 1.0, cy - depth * k * 1.05, back, cy - bh * 1.02);
      c.lineTo(back, cy + bh * 0.94);
      c.bezierCurveTo(hxx - depth * k * 1.0, cy + depth * k * 1.15, nose - depth * 0.3, cy + depth * k * 1.34, nose + depth * 0.15, cy + depth * 0.12);
      c.closePath();
    };
    skull(); c.fill();
    c.strokeStyle = 'rgba(214,228,248,0.24)'; c.lineWidth = 2;
    c.beginPath();
    c.moveTo(nose + depth * 0.15, cy - depth * 0.10);
    c.bezierCurveTo(nose - depth * 0.2, cy - depth * k * 1.30, hxx - depth * k * 1.0, cy - depth * k * 1.05, back, cy - bh * 1.02);
    c.stroke();
    /* the gaping jaw hinge, set far back behind the eye */
    c.strokeStyle = 'rgba(10,14,20,0.62)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(nose + depth * 0.10, cy + depth * 0.04);
    c.quadraticCurveTo(hxx - depth * k * 0.2, cy + depth * k * 0.55, hxx - depth * k * 1.05, cy + depth * k * 0.20);
    c.stroke();
    /* THE FANGS — upper and lower, interlocking, past the lip line.
       ★ GOLD AUDIT round 3 — GATED ON `teeth` NOW: they drew for EVERY
       bighead fish, which put sabre fangs on the Mahi-Mahi the moment it
       took the axis for its forehead (his one REGRESSION; the D-ART-161
       shape inverted — a feature UN-gated instead of gated off). */
    if (spec.teeth) {
    c.fillStyle = '#f4f1e4';
    for (let i = 0; i < 6; i++) {
      const u = i / 5;
      const x = nose - depth * 0.05 - u * depth * k * 1.5;
      const L = depth * k * (0.78 - u * 0.32) * (i % 2 ? 0.62 : 1);
      c.beginPath(); c.moveTo(x - depth * 0.12, cy + depth * k * 0.14);
      c.lineTo(x, cy + depth * k * 0.14 + L); c.lineTo(x + depth * 0.12, cy + depth * k * 0.14); c.closePath(); c.fill();
      const L2 = L * 0.78;
      c.beginPath(); c.moveTo(x - depth * 0.10, cy + depth * k * 0.28);
      c.lineTo(x + depth * 0.02, cy + depth * k * 0.28 - L2); c.lineTo(x + depth * 0.14, cy + depth * k * 0.30); c.closePath(); c.fill();
    }
    }
  }

  if (spec.dome) {
    /* BARRELEYE: two upward-pointing TUBULAR eyes inside a transparent
       cranial dome. Drawn last so the glass sits over everything. */
    const dx = nose - depth * 1.05, dy = cy - depth * 0.30, dr = depth * 1.35;
    for (const s of [-0.34, 0.34] as const) {
      const ex = dx + s * depth * 0.62;
      c.fillStyle = 'rgba(96,214,142,0.92)';
      c.beginPath();   /* the barrel: a cylinder standing on end, looking UP */
      c.moveTo(ex - depth * 0.30, dy + dr * 0.42);
      c.lineTo(ex - depth * 0.30, dy - dr * 0.34);
      c.quadraticCurveTo(ex, dy - dr * 0.66, ex + depth * 0.30, dy - dr * 0.34);
      c.lineTo(ex + depth * 0.30, dy + dr * 0.42);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(18,58,34,0.85)';
      c.beginPath(); c.ellipse(ex, dy - dr * 0.36, depth * 0.30, depth * 0.13, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(230,255,238,0.8)';
      c.beginPath(); c.ellipse(ex - depth * 0.08, dy - dr * 0.40, depth * 0.10, depth * 0.05, 0, 0, TAU); c.fill();
    }
    /* the fluid-filled transparent shield over them */
    const gd = c.createRadialGradient(dx - dr * 0.3, dy - dr * 0.4, 2, dx, dy, dr);
    gd.addColorStop(0, 'rgba(232,246,255,0.30)');
    gd.addColorStop(0.72, 'rgba(190,225,250,0.13)');
    gd.addColorStop(1, 'rgba(170,210,240,0.05)');
    c.fillStyle = gd;
    c.beginPath(); c.ellipse(dx, dy, dr * 1.05, dr * 0.86, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(226,242,255,0.42)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(dx, dy, dr * 1.05, dr * 0.86, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2.2;
    c.beginPath(); c.ellipse(dx, dy, dr * 0.92, dr * 0.74, 0, -2.5, -1.1); c.stroke();
  }

  if (spec.eyespot) {
    /* BUTTERFLYFISH: a false eye near the tail and a dark bar hiding the real
       one — a reef fish's entire predator-confusion strategy, and its look. */
    const sx = ped + (nose - ped) * 0.20, sy = cy - depth * 0.30;
    softMark(c, sx, sy, depth * 0.60, depth * 0.60, '18,22,30', 0.75);
    c.fillStyle = 'rgba(12,16,22,0.85)';
    c.beginPath(); c.arc(sx, sy, depth * 0.30, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(248,244,222,0.75)'; c.lineWidth = 2.4;
    c.beginPath(); c.arc(sx, sy, depth * 0.34, 0, TAU); c.stroke();
    c.save(); c.beginPath(); trace(); c.clip();
    c.fillStyle = 'rgba(14,18,26,0.55)';
    const bx = nose - depth * 0.70;
    c.beginPath();
    c.moveTo(bx + depth * 0.34, cy - depth * 2.2); c.lineTo(bx - depth * 0.16, cy - depth * 2.2);
    c.lineTo(bx - depth * 0.50, cy + depth * 2.2); c.lineTo(bx, cy + depth * 2.2);
    c.closePath(); c.fill();
    c.restore();
  }

  if (spec.bellySucker) {
    /* A snailfish's ventral adhesive disc remains visible below the soft body. */
    const sx = nose - len * 0.56, sy = cy + depth * 1.15;
    c.fillStyle = 'rgba(178,122,128,0.86)';
    c.beginPath(); c.ellipse(sx, sy, depth * 0.58, depth * 0.26, -0.08, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(244,218,218,0.54)'; c.lineWidth = Math.max(1.1, depth * 0.07);
    c.beginPath(); c.ellipse(sx, sy, depth * 0.40, depth * 0.15, -0.08, 0, TAU); c.stroke();
  }

  /* ★ WAVE 42, CODE PASS — TWO SPECIES WERE GETTING AN EXTRA, WRONGLY-PLACED EYE.
     · `snout:'hammer'`: D-ART-123 draws the hammerhead's eyes out on the tips of
       the cephalofoil — which is the whole point of the animal — and then this
       generic eye ran anyway, putting a THIRD eye on the body behind the bar.
     · `gape`: the basking shark's open mouth is a dark tunnel centred here, so
       its opaque white eye landed INSIDE its own aperture. Lifted clear of the
       gape rather than suppressed, because a basking shark does have an eye. */
  /* ★ WAVE 62 — `eyeless`: a cave fish's whole identity is NO EYE, and it was
     drawn one anyway ("It HAS AN EYE", gp5, twice). */
  if (!spec.dome && spec.snout !== 'hammer' && !spec.eyeless) {
    const gapeLift = spec.gape ? depth * 0.30 : 0;
    /* ⚠ WAVE 55 — THE FLOOR WAS 4 ABSOLUTE PIXELS, AND THE FIT PASS ERASES
       ABSOLUTE SIZE (D-ART-34). Everything here is drawn on the oversized INK
       layer and then scaled down by `fitInk`, so a floor expressed in raw px is
       a floor on the wrong canvas: a long shallow fish gets `depth*0.18` under
       four px, is clamped to exactly 4, and then shrinks with everything else
       until the eye is a pixel or two and the head reads as blank. A minimum
       has to be a RATIO of the subject to survive the fit, which is the same
       law the painters already follow for every other dimension. */
    eye(c, (spec.sharkMouth === 'terminal' || spec.flatHead) ? nose - depth * 0.24 : spec.headPlan === 'flat-wide' ? nose - len * 0.34 : nose - depth * (spec.profile === 'eel' ? 0.9 : 0.70),
      (spec.sharkMouth === 'terminal' || spec.flatHead) ? cy - depth * 0.46 : spec.headPlan === 'flat-wide' ? cy - depth * 0.53 : cy - depth * 0.34 - gapeLift,
      (spec.sharkMouth === 'terminal' || spec.flatHead) ? depth * 0.105 : spec.headPlan === 'flat-wide' ? depth * 0.18
        : Math.max(len * 0.050, depth * (spec.profile === 'globe' ? 0.22 : spec.bighead ? 0.30 : 0.18)));
  }
}

/* ── the roster: every key read out of the catalog ── */
const F = (spec: FishSpec): Painter3 => (c, g, p, n) => fishBody(c, g, p, spec, n);

export const FAUNA3_NAME: Record<string, Painter3> = {
  /* ── open-water torpedoes: speed is the silhouette ── */
  'Tuna': F({ hue: '#2c4a68', profile: 'fusiform', len: 0.24, depth: 0.085, tail: 'lunate', snout: 'blunt', dorsal: 'two' }),
  'Mackerel': F({ hue: '#43705c', profile: 'fusiform', len: 0.24, depth: 0.062, tail: 'lunate', snout: 'blunt', dorsal: 'two', pattern: 'bands' }),
  'Wahoo': F({ hue: '#2453a6', profile: 'fusiform', len: 0.26, depth: 0.058, tail: 'lunate', snout: 'jaw', dorsal: 'two', pattern: 'bands' }),
  'Bonefish': F({ profile: 'fusiform', len: 0.24, depth: 0.053, tail: 'forked', snout: 'bill', dorsal: 'one', hue: '#dfe4e8' }),
  'Sardine': F({ hue: '#8a99a3', profile: 'fusiform', len: 0.20, depth: 0.055, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Anchovy': F({ profile: 'fusiform', len: 0.21, depth: 0.038, tail: 'forked', snout: 'jaw', dorsal: 'one', hue: '#c3cfd9', pattern: 'stripes' }),
  'Herring': F({ profile: 'deep', len: 0.205, depth: 0.062, tail: 'forked', snout: 'blunt', dorsal: 'one', hue: '#b9cede' }),
  /* ★ GOLD AUDIT round 3 — bighead put FANGS on it (his one regression);
     it stays fangless while dedicated outline axes make the forehead steep
     and carry one continuous dorsal almost from eye to tail. */
  'Mahi-Mahi': F({ hue: '#6cbf3f', profile: 'deep', len: 0.26, depth: 0.066, tail: 'lunate', snout: 'blunt', dorsal: 'sail', forehead: 'vertical', dorsalSpan: 'eye-tail' }),
  'Marlin': F({ hue: '#1f3b7a', profile: 'fusiform', len: 0.25, depth: 0.072, tail: 'lunate', snout: 'bill', dorsal: 'sail' }),
  'Sailfish': F({ hue: '#3a4c94', profile: 'fusiform', len: 0.29, depth: 0.054, tail: 'lunate', snout: 'bill', dorsal: 'sail', sailScale: 3.2, pelvicThreads: true }),
  'Swordfish': F({ hue: '#57405a', profile: 'fusiform', len: 0.25, depth: 0.070, tail: 'lunate', snout: 'bill', dorsal: 'one' }),
  'Flying Fish': F({ hue: '#4a6f8c', profile: 'fusiform', len: 0.22, depth: 0.052, tail: 'forked', snout: 'blunt', dorsal: 'one', wings: 'glide' }),
  'Remora': F({ profile: 'fusiform', len: 0.255, depth: 0.034, tail: 'forked', snout: 'blunt', dorsal: 'two', hue: '#2f343b', suctionDisc: true }),
  /* ── cold and temperate food fish ── */
  'Cod': F({ hue: '#8a7a4e', profile: 'fusiform', len: 0.23, depth: 0.078, tail: 'round', snout: 'blunt', dorsal: 'two', pattern: 'mottle' }),
  'Arctic Cod': F({ profile: 'fusiform', len: 0.235, depth: 0.046, tail: 'forked', snout: 'blunt', dorsal: 'two', hue: '#7d8a63', barbels: true }),
  'Haddock': F({ hue: '#736c78', profile: 'fusiform', len: 0.22, depth: 0.076, tail: 'forked', snout: 'blunt', dorsal: 'two', pattern: 'mottle' }),
  'Pollock': F({ hue: '#5d6b4a', profile: 'fusiform', len: 0.23, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'two' }),
  'Salmon': F({ hue: '#c4705a', profile: 'fusiform', len: 0.24, depth: 0.072, tail: 'forked', snout: 'jaw', dorsal: 'one', pattern: 'spots' }),
  'Trout': F({ hue: '#7b6136', profile: 'fusiform', len: 0.22, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Char': F({ hue: '#b0533f', profile: 'fusiform', len: 0.22, depth: 0.068, tail: 'forked', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Grayling': F({ hue: '#8388a2', profile: 'fusiform', len: 0.21, depth: 0.068, tail: 'forked', snout: 'blunt', dorsal: 'sail' }),
  'Whitefish': F({ hue: '#a4ab93', profile: 'fusiform', len: 0.22, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Icefish': F({ hue: '#cdd6db', profile: 'fusiform', len: 0.21, depth: 0.055, tail: 'forked', snout: 'jaw', dorsal: 'two' }),
  'Cold-Water Fish': F({ profile: 'fusiform', len: 0.21, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'one', hue: '#4f6b7e' }),
  /* ── freshwater ── */
  'Carp': F({ hue: '#96702a', profile: 'deep', len: 0.22, depth: 0.078, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Goldfish': F({ hue: '#ee7b18', profile: 'deep', len: 0.19, depth: 0.078, tail: 'veil', snout: 'blunt', dorsal: 'one' }),
  'Tilapia': F({ hue: '#94907a', profile: 'deep', len: 0.20, depth: 0.082, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Cichlid': F({ hue: '#2f7fbf', profile: 'deep', len: 0.20, depth: 0.080, tail: 'forked', snout: 'blunt', dorsal: 'none', pattern: 'bands', cichlidDorsal: true, thickLips: true }),
  'Perch': F({ hue: '#9fa32f', profile: 'deep', len: 0.21, depth: 0.075, tail: 'forked', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Bass': F({ hue: '#5d7538', profile: 'fusiform', len: 0.22, depth: 0.080, tail: 'forked', snout: 'jaw', dorsal: 'spiny' }),
  'Sea Bass': F({ hue: '#7d8a94', profile: 'fusiform', len: 0.23, depth: 0.082, tail: 'forked', snout: 'jaw', dorsal: 'spiny' }),
  'Walleye': F({ profile: 'fusiform', len: 0.23, depth: 0.058, tail: 'forked', snout: 'jaw', dorsal: 'spiny', hue: '#8d7c43', pattern: 'mottle' }),
  'Pike': F({ hue: '#3c5730', profile: 'fusiform', len: 0.26, depth: 0.058, tail: 'forked', snout: 'jaw', dorsal: 'one', pattern: 'mottle', teeth: true }),
  'Piranha': F({ hue: '#877a86', profile: 'deep', len: 0.18, depth: 0.082, tail: 'forked', snout: 'jaw', dorsal: 'one', teeth: true }),
  'Pacu': F({ hue: '#4f4d47', profile: 'deep', len: 0.20, depth: 0.090, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Tetra': F({ hue: '#1fb6c9', profile: 'deep', len: 0.16, depth: 0.058, tail: 'forked', snout: 'blunt', dorsal: 'one', pattern: 'lateral' }),
  'Minnow': F({ hue: '#a29c86', profile: 'fusiform', len: 0.17, depth: 0.045, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  'Mudminnow': F({ hue: '#63482e', profile: 'fusiform', len: 0.17, depth: 0.050, tail: 'round', snout: 'blunt', dorsal: 'one' }),
  'Killifish': F({ hue: '#5f9d72', profile: 'fusiform', len: 0.17, depth: 0.050, tail: 'round', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Sculpin': F({ hue: '#675340', profile: 'fusiform', len: 0.19, depth: 0.062, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'mottle' }),
  'Sunfish': F({ hue: '#6f8f6a', profile: 'deep', len: 0.18, depth: 0.092, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'spots' }),
  'Catfish': F({ hue: '#4f4438', profile: 'fusiform', len: 0.25, depth: 0.070, tail: 'forked', snout: 'blunt', dorsal: 'one', pattern: 'mottle', barbels: true, smoothSkin: true, flatHead: true }),
  'Arapaima': F({ hue: '#56755f', profile: 'fusiform', len: 0.27, depth: 0.075, tail: 'round', snout: 'blunt', dorsal: 'one' }),
  'Arowana': F({ hue: '#b0a67e', profile: 'ribbon', len: 0.26, depth: 0.060, tail: 'point', snout: 'jaw', dorsal: 'none' }),
  'Tigerfish': F({ hue: '#b4ab9c', profile: 'fusiform', len: 0.23, depth: 0.072, tail: 'forked', snout: 'jaw', dorsal: 'two', pattern: 'stripes', teeth: true }),
  'Archerfish': F({ hue: '#c2b878', profile: 'deep', len: 0.18, depth: 0.070, tail: 'forked', snout: 'jaw', dorsal: 'spiny', archerBars: true }),
  'Knifefish': F({ hue: '#4c4356', profile: 'ribbon', len: 0.25, depth: 0.055, tail: 'point', snout: 'blunt', dorsal: 'none' }),
  /* ⚠ SHAPE, not colour, is what separates this one. Lungfish, Eel and
     Electric Eel shared a profile, a length, a depth, a tail, a snout and a
     dorsal — three identical silhouettes — so the species-true colour pass
     had to carry the entire distinction on hue alone, and it could not: every
     brown that pulled Lungfish clear of Eel pushed it into Electric Eel, and
     back again, for four rounds. A lungfish is genuinely a heavy-bodied fish,
     far stockier than any eel, so the fix is to draw it as one. */
  'Lungfish': F({ profile: 'eel', len: 0.235, depth: 0.068, tail: 'point', snout: 'blunt', dorsal: 'none', pattern: 'mottle', hue: '#6a5b56' }),
  'Blind Fish': F({ profile: 'eel', len: 0.215, depth: 0.038, tail: 'round', snout: 'blunt', dorsal: 'none', hue: '#e6d2cc', eyeless: true }),
  'Cave Fish': F({ profile: 'fusiform', len: 0.155, depth: 0.052, tail: 'round', snout: 'blunt', dorsal: 'one', hue: '#f0b9b0', eyeless: true }),
  'Small Fish': F({ hue: '#a8b7c2', profile: 'fusiform', len: 0.17, depth: 0.048, tail: 'forked', snout: 'blunt', dorsal: 'one' }),
  /* ── ancient and armoured ── */
  'Sturgeon': F({ hue: '#6f6b5c', profile: 'fusiform', len: 0.27, depth: 0.058, tail: 'shark', snout: 'shovel', dorsal: 'one' }),
  'Paddlefish': F({ hue: '#5f7d8c', profile: 'fusiform', len: 0.24, depth: 0.062, tail: 'shark', snout: 'blunt', dorsal: 'one', paddle: true }),
  'Gar': F({ hue: '#79763c', profile: 'eel', len: 0.27, depth: 0.052, tail: 'round', snout: 'jaw', dorsal: 'none', teeth: true }),
  'Bowfin': F({ hue: '#4a5c3c', profile: 'fusiform', len: 0.24, depth: 0.062, tail: 'round', snout: 'jaw', dorsal: 'sail', pattern: 'mottle' }),
  'Coelacanth': F({ hue: '#3b4a5e', profile: 'fusiform', len: 0.23, depth: 0.084, tail: 'fan', snout: 'blunt', dorsal: 'two', pattern: 'spots' }),
  /* ── eels and ribbons ── */
  'Eel': F({ hue: '#9a8a34', profile: 'eel', len: 0.27, depth: 0.044, tail: 'point', snout: 'jaw', dorsal: 'none' }),
  /* ★ GOLD AUDIT — the `gape` tunnel read as "a sucker/circular mouth" on an
     eel; a moray's read is the JAW. Reverted to snout jaw + teeth. */
  'Moray Eel': F({ profile: 'eel', len: 0.28, depth: 0.031, tail: 'point', snout: 'jaw', dorsal: 'sail', pattern: 'spots', teeth: true, hue: '#68793f' }),
  'Electric Eel': F({ hue: '#4e5f52', profile: 'eel', len: 0.28, depth: 0.048, tail: 'point', snout: 'blunt', dorsal: 'none' }),
  'Gulper Eel': F({ hue: '#131520', profile: 'eel', len: 0.27, depth: 0.050, tail: 'point', snout: 'jaw', dorsal: 'none', teeth: true, glow: true }),
  'Oarfish': F({ hue: '#b6bcc6', profile: 'ribbon', len: 0.28, depth: 0.046, tail: 'point', snout: 'blunt', dorsal: 'spiny' }),
  'Pipefish': F({ hue: '#7f8a5a', profile: 'ribbon', len: 0.26, depth: 0.030, tail: 'point', snout: 'tube', dorsal: 'none' }),
  /* ── reef ── */
  'Clownfish': F({ hue: '#f25a13', profile: 'deep', len: 0.16, depth: 0.070, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'clown' }),
  'Damselfish': F({ hue: '#1d5fd6', profile: 'deep', len: 0.15, depth: 0.066, tail: 'forked', snout: 'blunt', dorsal: 'spiny' }),
  'Butterflyfish': F({ hue: '#f5c519', profile: 'deep', len: 0.145, depth: 0.100, tail: 'fan', snout: 'tube', dorsal: 'spiny', pattern: 'bands', eyespot: true }),
  'Surgeonfish': F({ hue: '#6aa6d6', profile: 'deep', len: 0.17, depth: 0.086, tail: 'lunate', snout: 'blunt', dorsal: 'spiny', scalpel: '#f2c018' }),
  'Tang': F({ hue: '#1a44c4', profile: 'deep', len: 0.16, depth: 0.090, tail: 'lunate', snout: 'blunt', dorsal: 'spiny' }),
  'Triggerfish': F({ hue: '#2f8f7a', profile: 'deep', len: 0.17, depth: 0.084, tail: 'fan', snout: 'blunt', dorsal: 'two', pattern: 'mottle' }),
  'Parrotfish': F({ hue: '#0f9fb5', profile: 'deep', len: 0.19, depth: 0.078, tail: 'fan', snout: 'blunt', dorsal: 'one', pattern: 'mottle', beak: true, forehead: 'vertical' }),
  'Wrasse': F({ profile: 'fusiform', len: 0.20, depth: 0.062, tail: 'fan', snout: 'jaw', dorsal: 'one', pattern: 'stripes', teeth: true, hue: '#2f8f7a' }),
  'Cardinalfish': F({ hue: '#c72c26', profile: 'deep', len: 0.15, depth: 0.062, tail: 'forked', snout: 'blunt', dorsal: 'two' }),
  'Rabbitfish': F({ hue: '#c9a936', profile: 'deep', len: 0.17, depth: 0.078, tail: 'forked', snout: 'tube', dorsal: 'spiny', pattern: 'spots' }),
  'Reef Fish': F({ hue: '#e2637f', profile: 'deep', len: 0.17, depth: 0.074, tail: 'fan', snout: 'blunt', dorsal: 'spiny', pattern: 'bands' }),
  'Grouper': F({ hue: '#8b5a3e', profile: 'fusiform', len: 0.22, depth: 0.092, tail: 'round', snout: 'jaw', dorsal: 'spiny', pattern: 'spots' }),
  'Snapper': F({ hue: '#b8474e', profile: 'deep', len: 0.21, depth: 0.080, tail: 'forked', snout: 'jaw', dorsal: 'spiny' }),
  'Mullet': F({ profile: 'fusiform', len: 0.205, depth: 0.066, tail: 'forked', snout: 'shovel', dorsal: 'two', hue: '#aeb6bd' }),
  'Tarpon': F({ hue: '#93a3ad', profile: 'fusiform', len: 0.25, depth: 0.078, tail: 'forked', snout: 'jaw', dorsal: 'one' }),
  'Barracuda': F({ hue: '#8a978a', profile: 'fusiform', len: 0.27, depth: 0.050, tail: 'forked', snout: 'jaw', dorsal: 'two', teeth: true }),
  'Goby': F({ hue: '#c0a86e', profile: 'fusiform', len: 0.16, depth: 0.048, tail: 'round', snout: 'blunt', dorsal: 'two' }),
  'Blenny': F({ hue: '#82913c', profile: 'eel', len: 0.19, depth: 0.042, tail: 'round', snout: 'blunt', dorsal: 'spiny' }),
  'Flying Gurnard': F({ hue: '#a5764a', profile: 'fusiform', len: 0.19, depth: 0.062, tail: 'fan', snout: 'blunt', dorsal: 'one', pattern: 'spots', wings: 'fan' }),
  /* ── inflatable and boxy ── */
  'Pufferfish': F({ hue: '#9c8c5e', profile: 'globe', len: 0.15, depth: 0.070, tail: 'fan', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Boxfish': F({ hue: '#f0d63a', profile: 'box', len: 0.15, depth: 0.070, tail: 'fan', snout: 'blunt', dorsal: 'one', pattern: 'spots' }),
  'Blobfish': F({ hue: '#b78e8a', profile: 'globe', len: 0.17, depth: 0.066, tail: 'round', snout: 'blunt', dorsal: 'none', droop: true }),
  'Ocean Sunfish': F({ hue: '#837d73', profile: 'globe', len: 0.16, depth: 0.098, tail: 'none', snout: 'blunt', dorsal: 'one' }),
  'Snailfish': F({ hue: '#d0a9a0', profile: 'globe', len: 0.17, depth: 0.055, tail: 'round', snout: 'blunt', dorsal: 'none', smoothSkin: true, gelatinous: true, bellySucker: true }),
  /* ── the deep: lures, photophores, teeth ── */
  'Anglerfish': F({ hue: '#201d1b', profile: 'globe', len: 0.16, depth: 0.078, tail: 'round', snout: 'jaw', dorsal: 'none', lure: true, teeth: true }),
  'Lanternfish': F({ hue: '#5f7590', profile: 'fusiform', len: 0.18, depth: 0.052, tail: 'forked', snout: 'blunt', dorsal: 'one', glow: true }),
  'Viperfish': F({ hue: '#3d5566', profile: 'eel', len: 0.24, depth: 0.052, tail: 'forked', snout: 'jaw', dorsal: 'one', glow: true, bighead: 1.15, teeth: true }),
  'Fangtooth': F({ hue: '#513327', profile: 'deep', len: 0.155, depth: 0.072, tail: 'forked', snout: 'jaw', dorsal: 'one', bighead: 1.35, teeth: true }),
  'Dragonfish': F({ hue: '#8a2230', profile: 'eel', len: 0.24, depth: 0.044, tail: 'point', snout: 'jaw', dorsal: 'none', glow: true, teeth: true }),
  'Barreleye': F({ hue: '#3f7a72', profile: 'fusiform', len: 0.18, depth: 0.062, tail: 'fan', snout: 'blunt', dorsal: 'one', glow: true, dome: true }),
  'Deep-Sea Fish': F({ hue: '#6e5563', profile: 'fusiform', len: 0.19, depth: 0.058, tail: 'forked', snout: 'jaw', dorsal: 'one', glow: true }),
  'Monkfish': F({ hue: '#7d6a4e', profile: 'fusiform', len: 0.24, depth: 0.092, tail: 'round', snout: 'jaw', dorsal: 'none', lure: true, teeth: true, pattern: 'mottle', headPlan: 'flat-wide', bodyTaper: 'strong', pectoralBase: 'broad' }),
  /* ── SHARKS: heterocercal tail, gill slits, swept pectorals ── */
  'Shark': F({ profile: 'fusiform', len: 0.29, depth: 0.052, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true, smoothSkin: true, sharkMouth: 'crescent', hue: '#6e7a86' }),
  'Reef Shark': F({ hue: '#838d7e', profile: 'fusiform', len: 0.29, depth: 0.056, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true, smoothSkin: true, sharkMouth: 'crescent', finTips: true }),
  'Juvenile Shark': F({ hue: '#a6b0b4', profile: 'fusiform', len: 0.21, depth: 0.058, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true }),
  'Great White Shark': F({ hue: '#6f7a80', profile: 'fusiform', len: 0.27, depth: 0.086, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true, teeth: true }),
  'Tiger Shark': F({ hue: '#62707a', profile: 'fusiform', len: 0.29, depth: 0.062, tail: 'shark', snout: 'blunt', dorsal: 'sharkfin', shark: true, smoothSkin: true, sharkMouth: 'crescent', pattern: 'bands' }),
  'Mako Shark': F({ hue: '#2f5f8f', profile: 'fusiform', len: 0.26, depth: 0.070, tail: 'shark', snout: 'jaw', dorsal: 'sharkfin', shark: true, teeth: true }),
  'Whale Shark': F({ hue: '#47555f', profile: 'fusiform', len: 0.33, depth: 0.066, tail: 'shark', snout: 'blunt', dorsal: 'sharkfin', shark: true, smoothSkin: true, sharkMouth: 'terminal', whalePattern: true, flankRidges: true }),
  'Basking Shark': F({ hue: '#5f6560', profile: 'fusiform', len: 0.31, depth: 0.070, tail: 'shark', snout: 'blunt', dorsal: 'sharkfin', shark: true, smoothSkin: true, sharkMouth: 'crescent', gape: true }),
  'Hammerhead Shark': F({ hue: '#74806c', profile: 'fusiform', len: 0.32, depth: 0.052, tail: 'shark', snout: 'hammer', dorsal: 'sharkfin', shark: true, smoothSkin: true, sharkMouth: 'crescent' }),
};
