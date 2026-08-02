/* quadrupedoverrides.ts — THE MORPHOLOGY PASS, wave 4 (the quadruped system).

   The agents' #1 fauna finding: ONE bloated body + four sticks served cats,
   bears, foxes, rhinos, hippos and deer, so Jaguar ≈ Leopard ≈ Cheetah and
   Rhino ≈ Hippo were pixel-siblings. Nick's audit §5.4 named the same list.

   THE STRUCTURE (carried from wave 3's wing/insect work, on Nick's
   instruction to apply it everywhere): one parameterized mammal painter
   whose SPEC is the species — leg length, body depth, neck length, back
   profile, muzzle, ear family, tail family, coat pattern, and the signature
   organ (trunk / horn / antler / tusk / hump). Proportion carries identity
   BEFORE decoration does; the coat pattern is clipped to the body so it
   reads as fur, not stickers; a species-true hue overrides the roll only
   where the real animal's color IS its identity (white polar bear, the
   panda's blocking) — everything else still belongs to its rarity palette.

   Everything unlisted still falls through to the byte-verbatim engine. */
import { mulberry32, TAU } from '@cf/domain-rand';
import { formMark, furRim, rootedSpine, ellipsePts, type Form } from './surface.js';
import { alienEyes, alienSkin, alienGlow, alienSail, alienArmor, type AlienTraits } from './alientraits.js';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;

export interface QuadSpec {
  legs: number;                 /* leg length as a fraction of S */
  depth: number;                /* body depth (belly) */
  len?: number;                 /* body length */
  neck: number;                 /* neck length */
  back?: 'level' | 'humped' | 'sloped' | 'arched';
  muzzle?: number;              /* snout projection */
  jaw?: 'fine' | 'broad' | 'barrel';
  ears?: 'tiny' | 'small' | 'round' | 'large' | 'huge' | 'fan';
  tail?: 'none' | 'stub' | 'tuft' | 'bushy' | 'long' | 'plume' | 'banded' | 'paddle';
  coat?: 'plain' | 'spots' | 'rosettes' | 'stripes' | 'patches' | 'panda' | 'shaggy' | 'banded';
  horn?: 'nose' | 'twinnose' | 'ossicone' | 'palmate' | 'branched' | 'tuskup' | 'tuskdown' | 'curl'
    | 'straight' | 'spiral' | 'lyre' | 'prong' | 'shorthorn';   /* wave 10: the bovid horn is the species */
  humps?: 1 | 2;
  trunk?: boolean;
  hue?: string;                 /* species-true color where color IS identity */
  /* ★ wave 14: strangeness INSIDE our rendering language. An alien trait is
     an ADDITION to a body this system already draws well, never a
     replacement — a six-legged creature still gets the jointed limbs, deep
     chest and tucked waist, it simply has three pairs. Earth species leave
     this undefined and are byte-unchanged. */
  alien?: AlienTraits;
  face?: 'mask' | 'tears' | 'none';
  /* ★ wave 21 — the Platinum audit on the fennec: "ears should dominate the
     head". An ear category is a SHAPE; this is the multiplier on its scale,
     for the handful of animals whose feature is outsized for their family. */
  earScale?: number;
  tailScale?: number;
  /* ★ wave 22b — a mane is drawn BEHIND and BACK from the head, never centred
     on it: centred, it swallows the muzzle and eyes and the animal loses the
     only part anyone actually reads. */
  mane?: 'lion' | 'ruff';
}

function pal(p: Pal, spec: QuadSpec): Pal {
  if (!spec.hue) return p;
  const n = parseInt(spec.hue.slice(1), 16), cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
  return { base: spec.hue, cr, cg, cb,
    lit: `rgb(${Math.min(255, cr * 1.28 | 0)},${Math.min(255, cg * 1.28 | 0)},${Math.min(255, cb * 1.28 | 0)})`,
    dark: `rgb(${cr * 0.45 | 0},${cg * 0.45 | 0},${cb * 0.45 | 0})` };
}

/** the back line as a SMOOTH curve — sampled then joined through midpoints,
    so a sloped or humped back never reads as a faceted table edge */
function smoothTop(c: Ctx, cx: number, bodyW: number, topY: (t: number) => number, continuing = false): void {
  /* ★ ARC STAGE 3 WAVE 2 (Nick: "the rear hump is still kind of jagged… they're
     not pointy polygon-looking, they're round").
     THIS FUNCTION BEGAN WITH moveTo, WHICH STARTS A NEW SUBPATH. Wave 1 rebuilt
     the rear as one continuous bezier and then called this immediately after —
     so the bezier was orphaned in its own subpath and canvas closed it with a
     STRAIGHT LINE across the haunch. That straight chord is the jagged rear
     hump; the curve I "fixed" it with was never even connected to the body.
     When continuing an open path, join to the current point instead.
     Also: the first and last spans used quadratics through midpoints but the
     LAST point was reached with lineTo — a flat segment right at the shoulder.
     The whole spine is now one smooth chain end to end. */
  const N = 18, pts: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([cx - bodyW + bodyW * 2 * t, topY(t)]); }
  if (continuing) c.lineTo(pts[0]![0], pts[0]![1]);
  else c.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i]!, b = pts[i + 1]!;
    c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  const last = pts[pts.length - 1]!, prev = pts[pts.length - 2]!;
  c.quadraticCurveTo(prev[0], prev[1], last[0], last[1]);
}
function traceBody(c: Ctx, cx: number, cy: number, bodyW: number, bodyH: number, topY: (t: number) => number): void {
  /* ★ WAVE 22b — Nick: "the bodies… are not proportionate". The chest, waist
     tuck and rump were all fractions of bodyH, so on a LONG SHALLOW animal —
     a sand cat, a caracal, a possum — the modulation was a few pixels across
     two hundred, and the torso came out a featureless capsule. The belly line
     is now driven by a floor that also knows the animal's LENGTH, so a slim
     body still gets a real brisket and a real waist. */
  /* the belly stays anchored to bodyH — driving it off a length-aware floor
     pushed the whole underline BELOW where the legs attach, and the animals
     came out as planks on stilts. What a slim body actually lacked was not a
     deeper belly but a deeper WAIST, so only the tuck's excursion grows. */
  const slim = Math.min(1, (bodyW * 0.34) / Math.max(1, bodyH));   /* 1 when long and shallow */
  const tuck = 0.50 - slim * 0.20;        /* the waist rises further on a lithe animal */
  const chest = 0.70 + slim * 0.10;
  /* ★ ARC STAGE 3 (Nick: "the bodies, especially in the rear, are a bit pointy
     still… it shouldn't have sharp edges anywhere"). The old path CLOSED at
     (cx-bodyW, cy+0.1·bodyH) and restarted toward the back line from there, so
     the incoming and outgoing tangents met at an angle — a CUSP, right on the
     rump, on every mammal in the catalogue. The rear is now one continuous
     bezier that sweeps from the underside all the way round to the back line
     with no closing seam, so there is nowhere for a corner to form. */
  c.beginPath();
  c.moveTo(cx - bodyW, topY(0));
  smoothTop(c, cx, bodyW, topY, true);
  /* down the shoulder into a DEEP CHEST (the brisket hangs lowest here) */
  c.bezierCurveTo(cx + bodyW * 1.16, cy - bodyH * 0.04, cx + bodyW * 1.12, cy + bodyH * (chest * 0.62), cx + bodyW * 0.90, cy + bodyH * chest);
  /* forward of the ribs the belly TUCKS UP — the single line that stops a
     torso being a slab */
  c.quadraticCurveTo(cx + bodyW * 0.36, cy + bodyH * (chest + 0.16), cx - bodyW * 0.02, cy + bodyH * tuck);
  /* and swells again into the ROUNDED RUMP over the hind leg */
  c.quadraticCurveTo(cx - bodyW * 0.52, cy + bodyH * (tuck - 0.20), cx - bodyW * 0.80, cy + bodyH * 0.56);
  /* ONE sweep round the haunch and back up to where the spine began. Both
     control points sit outside the body, so the curve bulges — a rump is the
     roundest part of a mammal, never the sharpest. */
  c.bezierCurveTo(cx - bodyW * 1.15, cy + bodyH * 0.42, cx - bodyW * 1.18, cy - bodyH * 0.06, cx - bodyW, topY(0));
  c.closePath();
}

/** ★ THE PATTERN LAW (Nick 2026-08-01): a coat mark must BLEND into the
    skin at its edges — never a hard-edged polygon stamped on top. Every
    mark is a radial gradient whose alpha falls to zero at the rim, and
    organic patches are built from OVERLAPPING soft marks so their outline
    is irregular the way a real coat is. Applies to every patterned
    creature, in this wave and every wave after. */
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

/** THE AVALANCHE. XOR-ing a small salt into a hash and dividing by 2^32
    perturbs only the lowest bits, so every "independent" variation axis
    collapsed to the same number and near-neighbour names produced
    near-identical animals. Mix the salt in with a large odd multiplier and
    scramble, so one bit of change rewrites the whole value. */
function mixSaltQ(h: number, salt: number): number {
  let x = (h ^ Math.imul(salt | 1, 0x9E3779B1)) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0; x = Math.imul(x, 0x7FEB352D) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 0x846CA68B) >>> 0;
  x = (x ^ (x >>> 16)) >>> 0;
  return x >>> 0;
}
export function nameSeedQ(name: string): number {
  let h = 0x4D3F;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x85EB) >>> 0;
  return h >>> 0;
}
export function faunaQuadruped(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name = ''): void {
  const r = mulberry32((((g.seed as number) ^ 0x9AD4 ^ nameSeedQ(name)) >>> 0));
  /* the species NAME varies real proportion, so two specs that happen to
     match cannot render the same animal — D-ART-20 applied back to wave 4,
     now the largest table in the game at ~130 species */
  const nvq = (salt: number, amt: number): number => 1 + (mixSaltQ(nameSeedQ(name), salt) / 4294967296 - 0.5) * 2 * amt;
  const p = pal(p0, spec);
  const groundY = S * 0.80;
  const legLen = S * spec.legs * nvq(0x11, 0.06);
  const bodyH = S * spec.depth;
  const bodyW = S * (spec.len ?? 0.30);
  const cy = groundY - legLen - bodyH * 0.55;
  const cx = S * 0.52;
  const back = spec.back ?? 'level';

  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.beginPath(); c.ellipse(cx, groundY + 6, bodyW * 0.92, S * 0.032, 0, 0, TAU); c.fill();

  /* ---- legs: back pair first (depth), then front ---- */
  /* ★ ARC STAGE 3 (Nick: "the elephant legs are way too long… like they are big
     tree trunks"). Leg thickness was a pure fraction of BODY DEPTH, so the
     deepest-bodied animals — elephant, hippo, rhino — grew columns 28px wide.
     A limb is proportioned against the whole animal, not just how deep its
     chest is, so the depth term is now CAPPED against body length. Slimmer
     animals are unchanged because their depth term still wins. */
  const legW = Math.max(7, Math.min(bodyH * 0.30, bodyW * 0.115));
  const drawLeg = (lx: number, shade: number, len: number, hind: boolean): void => {
    const col = shade < 1 ? p.dark : p.base;
    const top = cy + bodyH * 0.42, jitter = (r() - 0.5) * 3;
    /* the joint sits below mid-limb; a hock kicks BACK, a knee eases forward */
    const kneeY = top + (groundY - top) * 0.54;
    const kneeX = lx + (hind ? -legW * 0.42 : legW * 0.26);
    const footX = lx + jitter + (hind ? legW * 0.12 : -legW * 0.04);
    c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = legW * (shade < 1 ? 1.02 : 1.20);          /* the upper limb carries muscle */
    c.beginPath(); c.moveTo(lx, top); c.quadraticCurveTo(lx + (kneeX - lx) * 0.6, top + (kneeY - top) * 0.55, kneeX, kneeY); c.stroke();
    c.lineWidth = legW * (shade < 1 ? 0.56 : 0.66);          /* the cannon bone is THIN */
    c.beginPath(); c.moveTo(kneeX, kneeY); c.quadraticCurveTo(kneeX + (footX - kneeX) * 0.5, kneeY + (groundY - kneeY) * 0.5, footX, groundY - len * 0.04); c.stroke();
    c.fillStyle = col;   /* the foot */
    c.beginPath(); c.ellipse(footX + 1, groundY, legW * 0.52, legW * 0.30, 0, 0, TAU); c.fill();
  };
  /* ★ LIMB PAIRS. The genome's locomotion genes have described many-legged
     creatures since v1.0 and the art has only ever drawn four legs. Pairs are
     spaced along the torso so a six- or eight-legged animal still reads as
     one body, not a train of hips. */
  const pairs = spec.alien?.legPairs ?? 2;
  for (let i = 0; i < pairs; i++) {
    const t = i / (pairs - 1);                            /* 0 = rear, 1 = front */
    const back = -0.62 + t * 1.18;
    drawLeg(cx + bodyW * back, 0.8, legLen, t < 0.5);      /* far side, shaded */
    drawLeg(cx + bodyW * (back + 0.10), 1, legLen, t < 0.5);
  }

  /* ---- the torso: a profile whose BACK LINE is the species ---- */
  const topY = (t: number): number => {
    /* t: 0 at the rump, 1 at the shoulder */
    if (back === 'humped') return cy - bodyH * (0.55 + 0.42 * Math.pow(t, 2.2));
    if (back === 'sloped') return cy - bodyH * (0.40 + 0.55 * t);
    if (back === 'arched') return cy - bodyH * (0.52 + 0.30 * Math.sin(t * Math.PI));
    /* even a level back gets a gentle withers-to-rump curve — a ruler
       straight spine reads as a table edge, never as an animal */
    return cy - bodyH * (0.50 + 0.08 * t + 0.07 * Math.sin(t * Math.PI));
  };
  const bodyGrad = c.createLinearGradient(cx, cy - bodyH, cx, cy + bodyH * 0.6);
  bodyGrad.addColorStop(0, p.lit); bodyGrad.addColorStop(0.55, p.base); bodyGrad.addColorStop(1, p.dark);
  c.fillStyle = bodyGrad;
  c.beginPath();
  traceBody(c, cx, cy, bodyW, bodyH, topY);
  c.fill();

  /* ---- coat pattern, CLIPPED to the torso so it reads as fur ---- */
  c.save();
  traceBody(c, cx, cy, bodyW, bodyH, topY);
  c.clip();
  const coat = spec.coat ?? 'plain';
  /* the torso as a FORM, so every mark below knows the shape it lies on */
  const torsoForm: Form = { cx, cy, rx: bodyW, ry: bodyH * 1.15 };
  if (coat === 'spots') {
    for (let i = 0; i < 78; i++) {
      const x = cx - bodyW + r() * bodyW * 2, y = cy - bodyH * 1.0 + r() * bodyH * 1.85;
      const rr = 5 + r() * 5;
      formMark(c, x, y, rr, rr * (0.7 + r() * 0.4), '24,18,10', 0.55 + r() * 0.18, torsoForm);
    }
  } else if (coat === 'rosettes') {
    for (let i = 0; i < 38; i++) {
      const x = cx - bodyW + r() * bodyW * 2, y = cy - bodyH * 1.0 + r() * bodyH * 1.85, rad = 8 + r() * 6;
      /* the ring as 4-6 soft marks around a circle — broken and blended,
         the way a real rosette sits in the fur */
      const n = 4 + (r() * 3 | 0);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + r() * 0.5;
        formMark(c, x + Math.cos(a) * rad * 0.78, y + Math.sin(a) * rad * 0.66, rad * 0.42, rad * 0.34, '28,20,10', 0.5 + r() * 0.16, torsoForm);
      }
      formMark(c, x + 1, y + 1, rad * 0.34, rad * 0.28, '46,32,14', 0.30, torsoForm);
    }
  } else if (coat === 'stripes') {
    for (let i = 0; i < 15; i++) {
      const x = cx - bodyW + (i / 14) * bodyW * 2 + (r() - 0.5) * 8;
      const rot = (r() - 0.5) * 0.4, w = 5 + r() * 3, h = bodyH * (0.6 + r() * 0.35);
      /* a band built from stacked soft marks — edges melt into the coat */
      for (let k = 0; k < 5; k++) {
        const t = (k / 4 - 0.5) * 2;
        formMark(c, x + Math.sin(rot) * -t * h * 0.5, cy + t * h * 0.5, w, w * 1.25, '20,14,8', 0.62, torsoForm);
      }
    }
  } else if (coat === 'patches') {
    /* Nick 2026-08-01: "the giraffe could use a LOT more spots, and they
       read as octagons" — the old 6-gon stamp is gone. Each patch is a
       CLUSTER of overlapping soft marks, so its outline is irregular and
       its edge dissolves into the hide. */
    for (let i = 0; i < 84; i++) {
      const x = cx - bodyW + r() * bodyW * 2, y = cy - bodyH * 1.05 + r() * bodyH * 1.9;
      const rad = 8 + r() * 8;
      const lobes = 3 + (r() * 3 | 0);
      for (let k = 0; k < lobes; k++) {
        const a = r() * TAU, d = rad * 0.42 * r();
        formMark(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, rad * (0.62 + r() * 0.34), rad * (0.5 + r() * 0.3), '122,74,28', 0.60 + r() * 0.16, torsoForm);
      }
    }
  } else if (coat === 'panda') {
    c.fillStyle = '#15181e';   /* the shoulder band + forelimb blocking */
    c.beginPath(); c.ellipse(cx + bodyW * 0.30, cy, bodyW * 0.34, bodyH * 1.1, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(cx - bodyW * 0.72, cy + bodyH * 0.3, bodyW * 0.3, bodyH * 0.9, 0, 0, TAU); c.fill();
  } else if (coat === 'shaggy') {
    /* the UNDERCOAT: clumps that follow the form rather than parallel scratches */
    for (let i = 0; i < 44; i++) {
      const x = cx - bodyW + r() * bodyW * 2, y = cy - bodyH * 0.9 + r() * bodyH * 1.8;
      formMark(c, x, y, 7 + r() * 7, 4 + r() * 4, r() < 0.6 ? '28,20,12' : '236,228,208', 0.16 + r() * 0.18, torsoForm);
    }
  } else if (coat === 'banded' && !spec.alien?.skin) {
    c.fillStyle = 'rgba(26,20,14,0.5)';
    for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(cx - bodyW * 0.6 + i * bodyW * 0.35, cy + bodyH * 0.1, bodyW * 0.10, bodyH * 0.8, 0.25, 0, TAU); c.fill(); }
  }
  /* an alien SKIN FINISH replaces the coat treatment, inside the same clip
     so it reads as the animal's own surface and obeys the surface laws */
  if (spec.alien?.skin) alienSkin(c, spec.alien.skin, torsoForm, p, r);
  c.restore();
  if (spec.alien?.sail) {
    alienSail(c, cx + bodyW * 0.05, topY(0.5) + bodyH * 0.05, bodyW * 0.62, bodyH * 1.5, p);
  }
  if (spec.alien?.armor) alienArmor(c, torsoForm, p);
  if (spec.alien?.lumin) alienGlow(c, torsoForm, p, r, 10);
  if (coat === 'shaggy') {
    /* ★ THE FUR RIM — tufts pushed THROUGH the outline. Without this a
       "shaggy" coat is noise inside a machined edge, and the silhouette
       (the first thing the eye reads) still says "smooth plastic". */
    furRim(c, ellipsePts(cx, cy, bodyW * 0.98, bodyH * 1.02, 0, 72), cx, cy,
      p.dark, Math.max(7, bodyH * 0.22), r, 0.62);
    furRim(c, ellipsePts(cx, cy, bodyW * 0.98, bodyH * 1.02, 0, 72), cx, cy,
      p.lit, Math.max(5, bodyH * 0.15), r, 0.28);
  }
  /* the belly shadow + top rim: form, not just outline */
  c.save();
  /* the rim light FADES at both ends — a flat stroke along a level back
     read as a hard table edge (review catch) */
  const rimG = c.createLinearGradient(cx - bodyW, 0, cx + bodyW, 0);
  rimG.addColorStop(0, 'rgba(220,232,250,0)');
  rimG.addColorStop(0.25, 'rgba(220,232,250,0.34)');
  rimG.addColorStop(0.7, 'rgba(232,242,255,0.46)');
  rimG.addColorStop(1, 'rgba(220,232,250,0)');
  c.strokeStyle = rimG; c.lineWidth = 2.6;
  c.beginPath();
  smoothTop(c, cx, bodyW, topY);
  c.stroke(); c.restore();

  /* ---- humps (camel) sit ON the back line ---- */
  if (spec.humps) {
    /* A HUMP GROWS OUT OF THE BACK. Both were seated at topY(0.5) minus a
       fixed offset, so each floated in a gap above the spine — and with two
       humps the rear one hovered over a back line it never touched. Each
       hump is now seated at the back line AT ITS OWN x, sunk slightly in. */
    const hxs = spec.humps === 1 ? [0.5] : [0.32, 0.68];
    const seat = (u: number): [number, number] => {
      const hx = cx - bodyW + 2 * bodyW * u;
      return [hx, topY(u) + bodyH * 0.06];
    };
    c.fillStyle = p.base;
    for (const u of hxs) { const [hx, hy] = seat(u); c.beginPath(); c.ellipse(hx, hy, bodyW * 0.30, bodyH * 0.46, 0, Math.PI, TAU); c.fill(); }
    c.strokeStyle = 'rgba(220,232,250,0.32)'; c.lineWidth = 2;
    for (const u of hxs) { const [hx, hy] = seat(u); c.beginPath(); c.ellipse(hx, hy, bodyW * 0.30, bodyH * 0.46, 0, Math.PI, TAU); c.stroke(); }
  }


  /* ---- neck + head: where most species are actually recognized ---- */
  const neckLen = S * spec.neck;
  const shoulderX = cx + bodyW * 0.82, shoulderY = topY(1) + bodyH * 0.12;
  const headX = shoulderX + neckLen * 0.55, headY = shoulderY - neckLen * 0.86;
  /* ★ WAVE 22b — A HEAD BELONGS TO THE ANIMAL'S LENGTH, not only its depth.
     Sized purely off bodyH, a sand cat got a 28px skull on a 210px body — 13%,
     where a real carnivore's head is about a fifth of its body. Long shallow
     animals came out as tubes with a pea on the end. Deep-bodied, heavy-jawed
     species are unchanged, because for them the depth term still wins. */
  const headR = Math.max(
    bodyH * (spec.jaw === 'barrel' ? 0.62 : spec.jaw === 'broad' ? 0.52 : 0.42),
    bodyW * 0.20,
  );
  c.strokeStyle = p.base; c.lineWidth = Math.max(10, bodyH * (neckLen > S * 0.16 ? 0.36 : 0.62));
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(shoulderX - bodyW * 0.1, shoulderY + bodyH * 0.2);
  c.quadraticCurveTo(shoulderX + neckLen * 0.30, shoulderY - neckLen * 0.45, headX, headY);
  c.stroke();
  /* ★ WAVE 22b — THE MANE (Nick: "the lion head with mane looks awful, can't
     even tell its face"). It is drawn HERE — before the head, behind it — and
     offset BACK from the face, because a mane that is centred on the skull
     covers the muzzle and eyes and the animal loses the only part anyone
     reads. A real mane frames a face; it never fills it. */
  if (spec.mane) {
    const mr = headR * (spec.mane === 'lion' ? 2.05 : 1.45);
    const mx = headX - headR * (spec.mane === 'lion' ? 0.62 : 0.50);
    const my = headY + headR * 0.16;
    /* the mass first: overlapping soft lobes, so its outline is ragged rather
       than a disc, and DARKER than the coat so the lit face reads against it */
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU + r() * 0.24;
      const d = mr * (0.52 + r() * 0.42);
      const lobe = mr * (0.30 + r() * 0.22);
      const key = (-Math.cos(a) * 0.4 - Math.sin(a) * 0.86) * 0.5 + 0.5;
      const m2 = 0.42 + key * 0.42;
      c.fillStyle = `rgb(${p.cr * m2 | 0},${p.cg * m2 | 0},${p.cb * m2 | 0})`;
      c.beginPath(); c.ellipse(mx + Math.cos(a) * d, my + Math.sin(a) * d * 0.94, lobe, lobe * 0.86, a, 0, TAU); c.fill();
    }
    /* the hair itself, sweeping outward and DOWN off the ruff so the mane
       breaks its own silhouette instead of ending on a circle */
    c.lineCap = 'round';
    for (let i = 0; i < 240; i++) {
      const a = r() * TAU;
      const d0 = mr * (0.34 + r() * 0.46);
      const x0 = mx + Math.cos(a) * d0, y0 = my + Math.sin(a) * d0 * 0.94;
      const L = mr * (0.16 + r() * 0.30);
      const key = (-Math.cos(a) * 0.4 - Math.sin(a) * 0.86) * 0.5 + 0.5;
      const m2 = 0.34 + key * 0.72;
      c.strokeStyle = `rgb(${Math.min(255, p.cr * m2 | 0)},${Math.min(255, p.cg * m2 | 0)},${Math.min(255, p.cb * m2 | 0)})`;
      c.globalAlpha = 0.24 + r() * 0.42; c.lineWidth = 1.0 + r() * 1.4;
      c.beginPath(); c.moveTo(x0, y0);
      c.quadraticCurveTo(x0 + Math.cos(a) * L * 0.6, y0 + Math.sin(a) * L * 0.6 + L * 0.25,
        x0 + Math.cos(a) * L, y0 + Math.sin(a) * L + L * 0.55);
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  if ((spec.coat ?? 'plain') === 'patches') {
    /* the neck carries the same SOFT patches (was a dashed stroke — a hard
       edge, exactly what Nick flagged) */
    const nSteps = 12;
    for (let i = 1; i < nSteps; i++) {
      const t = i / nSteps, mt = 1 - t;
      const nx = mt * mt * (shoulderX - bodyW * 0.1) + 2 * mt * t * (shoulderX + neckLen * 0.30) + t * t * headX;
      const ny = mt * mt * (shoulderY + bodyH * 0.2) + 2 * mt * t * (shoulderY - neckLen * 0.45) + t * t * headY;
      const rr = Math.max(6, bodyH * 0.16);
      softMark(c, nx + (r() - 0.5) * 6, ny + (r() - 0.5) * 6, rr * (0.8 + r() * 0.5), rr * (0.7 + r() * 0.4), '122,74,28', 0.55 + r() * 0.15, r() * 3);
    }
  }
  const headGrad = c.createRadialGradient(headX - headR * 0.3, headY - headR * 0.35, 2, headX, headY, headR * 1.3);
  headGrad.addColorStop(0, p.lit); headGrad.addColorStop(0.6, p.base); headGrad.addColorStop(1, p.dark);
  c.fillStyle = headGrad;
  c.beginPath(); c.ellipse(headX, headY, headR, headR * 0.86, 0, 0, TAU); c.fill();
  /* the muzzle — length and heft separate deer from hippo from cat */
  const mz = spec.muzzle ?? 0.5;
  if (mz > 0.05) {
    c.fillStyle = p.base;
    const mw = headR * (0.7 + mz * 1.5), mh = headR * (spec.jaw === 'barrel' ? 0.86 : spec.jaw === 'broad' ? 0.66 : 0.46);
    const mxc = headX + headR * 0.55 + mw * 0.35, myc = headY + headR * 0.22;
    if (spec.jaw === 'barrel') {
      /* a hippo's snout is a BLUNT ROUND BLOCK, not a taper (Nick: "it's not
         round") — a rounded-rectangle muzzle with a domed end */
      const bw = mw * 0.62, bh = mh * 0.66;
      c.beginPath();
      c.moveTo(mxc - bw, myc - bh * 0.72);
      c.lineTo(mxc + bw * 0.34, myc - bh * 0.88);
      c.quadraticCurveTo(mxc + bw * 1.06, myc - bh * 0.82, mxc + bw * 1.06, myc);
      c.quadraticCurveTo(mxc + bw * 1.06, myc + bh * 0.86, mxc + bw * 0.34, myc + bh * 0.92);
      c.lineTo(mxc - bw, myc + bh * 0.8);
      c.closePath(); c.fill();
      /* the two nostril pads on top of the blunt end */
      c.fillStyle = 'rgba(24,16,18,0.5)';
      for (const s2 of [-1, 1] as const) { c.beginPath(); c.ellipse(mxc + bw * 0.72, myc + s2 * bh * 0.34, bh * 0.16, bh * 0.12, 0, 0, TAU); c.fill(); }
      c.fillStyle = p.base;
    } else {
      c.beginPath(); c.ellipse(mxc, myc, mw * 0.6, mh * 0.6, 0.12, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(20,14,16,0.75)';   /* the nose */
    c.beginPath(); c.ellipse(headX + headR * 0.55 + mw * 0.85, headY + headR * 0.16, mh * 0.26, mh * 0.20, 0, 0, TAU); c.fill();
    if (spec.jaw === 'barrel') {   /* hippo: the vast mouth line */
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(headX + headR * 0.2, headY + headR * 0.5); c.quadraticCurveTo(headX + headR * 1.1, headY + headR * 0.66, headX + headR * 1.5, headY + headR * 0.35); c.stroke();
    }
  }
  c.save();
  c.strokeStyle = 'rgba(220,232,250,0.4)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(headX, headY, headR, headR * 0.86, 0, -2.7, 0.3); c.stroke(); c.restore();

  /* ---- ears: family-defining (fennec vs hippo vs koala) ---- */
  const ears = spec.ears ?? 'small';
  const earR = headR * (ears === 'huge' ? 1.25 : ears === 'large' ? 0.75 : ears === 'round' ? 0.62 : ears === 'small' ? 0.4 : 0.22) * (spec.earScale ?? 1);
  if (ears === 'fan') {
    /* ★ ARC STAGE 3 — AN ELEPHANT'S EAR IS NOT A RABBIT'S. Routed as 'huge' it
       got two upright ellipses standing off the crown, which is the single most
       wrong thing on the animal. An elephant ear is a broad FAN hanging down
       the side of the head, its top edge folded over, its lower edge ragged,
       reaching well below the jaw. Drawn behind the head so the head overlaps
       its root and it belongs to the skull. */
    const fw = headR * 1.55, fh = headR * 2.05;
    const fx = headX - headR * 0.62, fy = headY + headR * 0.20;
    for (const s of [-1, 1] as const) {
      const off = s * headR * 0.16;
      c.fillStyle = s < 0 ? `rgb(${p.cr * 0.52 | 0},${p.cg * 0.52 | 0},${p.cb * 0.52 | 0})` : p.dark;
      c.beginPath();
      c.moveTo(fx + off + fw * 0.42, fy - fh * 0.46);
      c.bezierCurveTo(fx + off - fw * 0.72, fy - fh * 0.60, fx + off - fw * 0.96, fy + fh * 0.10, fx + off - fw * 0.52, fy + fh * 0.52);
      c.bezierCurveTo(fx + off - fw * 0.20, fy + fh * 0.70, fx + off + fw * 0.20, fy + fh * 0.52, fx + off + fw * 0.40, fy + fh * 0.18);
      c.closePath(); c.fill();
      if (s > 0) {
        /* the folded top margin, and the veins that make it read as skin */
        c.strokeStyle = `rgba(${p.cr * 0.42 | 0},${p.cg * 0.42 | 0},${p.cb * 0.42 | 0},0.55)`;
        c.lineWidth = Math.max(1.4, headR * 0.06);
        c.beginPath();
        c.moveTo(fx + off + fw * 0.36, fy - fh * 0.40);
        c.bezierCurveTo(fx + off - fw * 0.52, fy - fh * 0.50, fx + off - fw * 0.74, fy - fh * 0.04, fx + off - fw * 0.44, fy + fh * 0.34);
        c.stroke();
        c.lineWidth = Math.max(1, headR * 0.035);
        for (let i = 0; i < 4; i++) {
          const u = i / 3;
          c.beginPath();
          c.moveTo(fx + off + fw * 0.30, fy - fh * 0.24 + u * fh * 0.44);
          c.quadraticCurveTo(fx + off - fw * 0.20, fy - fh * 0.10 + u * fh * 0.52,
            fx + off - fw * (0.62 - u * 0.16), fy + fh * (0.06 + u * 0.30));
          c.stroke();
        }
      }
    }
  } else if (ears !== 'tiny' || true) {
    for (const s of [-1, 1] as const) {
      const ex = headX - headR * 0.25 + s * headR * 0.42, ey = headY - headR * (ears === 'huge' ? 0.85 : 0.72);
      c.fillStyle = p.dark;
      if (ears === 'huge' || ears === 'large') {
        c.save(); c.translate(ex, ey); c.rotate(s * 0.32);
        c.beginPath(); c.ellipse(0, -earR * 0.5, earR * 0.52, earR, 0, 0, TAU); c.fill();
        c.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},0.55)`;
        c.beginPath(); c.ellipse(0, -earR * 0.5, earR * 0.3, earR * 0.7, 0, 0, TAU); c.fill();
        c.restore();
      } else {
        c.beginPath(); c.arc(ex, ey, earR, 0, TAU); c.fill();
      }
    }
  }
  /* face markings */
  if (spec.face === 'mask') {   /* panda patches */
    c.fillStyle = '#15181e';
    for (const s of [-1, 1] as const) { c.beginPath(); c.ellipse(headX - headR * 0.2 + s * headR * 0.42, headY - headR * 0.12, headR * 0.30, headR * 0.24, s * 0.4, 0, TAU); c.fill(); }
  } else if (spec.face === 'tears') {   /* cheetah tear lines */
    c.strokeStyle = 'rgba(22,16,10,0.8)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(headX + headR * 0.05, headY - headR * 0.05); c.quadraticCurveTo(headX + headR * 0.5, headY + headR * 0.3, headX + headR * 0.85, headY + headR * 0.35); c.stroke();
  }
  /* the eye, last so it always reads — and an alien eye is the single most
     alien thing a face can do, so it routes here rather than replacing the head */
  if (spec.alien?.eyes && spec.alien.eyes !== 'normal') {
    alienEyes(c, headX + headR * 0.08, headY - headR * 0.12, headR * 0.16, spec.alien.eyes, p);
    if (spec.alien.tendrils) {   /* the tendril-fringed head gene */
      c.strokeStyle = p.dark; c.lineCap = 'round'; c.lineWidth = Math.max(2, headR * 0.09);
      for (let i = 0; i < 6; i++) {
        const a2 = -0.9 + i * 0.34;
        const bx2 = headX + headR * (0.6 + mz * 0.6), by2 = headY + headR * 0.28;
        c.beginPath(); c.moveTo(bx2, by2);
        c.quadraticCurveTo(bx2 + headR * 0.7, by2 + Math.sin(a2) * headR * 0.7,
          bx2 + headR * 1.25, by2 + Math.sin(a2) * headR * 1.35);
        c.stroke();
      }
    }
  } else {
    /* ★ ARC STAGE 2 — THE MAMMALS HAD NO WHITES IN THEIR EYES.
       Nick: "make sure their heads, eyes, etc all are distinguishable."
       Every other painter family here draws a three-layer eye — pale sclera,
       dark pupil, catchlight — and this one, the LARGEST family in the
       catalogue, drew a single dark dot with a 0.06R speck on it. Against a
       mid-tone flank that is a smudge, and the conformance sensor could not
       find a face on Wolf, Lion, Tiger, Cat, Deer, Koala, Sand Cat, Caracal or
       Possum. It was not the sensor: they genuinely had no readable eye.
       The eye is also enlarged 0.16R -> 0.21R, because an eye a player cannot
       locate at thumbnail size is not an eye. */
    const ex = headX + headR * 0.08, ey = headY - headR * 0.12, er = headR * 0.21;
    /* a soft socket, so the eye is SET INTO the skull rather than stuck on */
    softMark(c, ex, ey + er * 0.1, er * 2.1, er * 1.7, '18,14,10', 0.34);
    c.fillStyle = '#f2efe6'; c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    c.fillStyle = '#0d1016'; c.beginPath(); c.arc(ex, ey, er * 0.62, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath(); c.arc(ex - er * 0.30, ey - er * 0.35, er * 0.24, 0, TAU); c.fill();
    /* the lid line — the one stroke that stops an eye reading as a bead */
    c.strokeStyle = `rgba(${p.cr * 0.34 | 0},${p.cg * 0.34 | 0},${p.cb * 0.34 | 0},0.75)`;
    c.lineWidth = Math.max(1.2, er * 0.28); c.lineCap = 'round';
    c.beginPath(); c.arc(ex, ey, er * 1.06, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
  }

  /* ---- the signature organ ---- */
  const horn = spec.horn;
  if (horn === 'nose' || horn === 'twinnose') {
    c.fillStyle = '#d9cfbc';
    const nx = headX + headR * (mz > 0.05 ? 1.5 : 0.9), ny = headY + headR * 0.05;
    c.beginPath(); c.moveTo(nx - 10, ny + 6); c.quadraticCurveTo(nx + 2, ny - headR * 1.3, nx + 14, ny + 4); c.closePath(); c.fill();
    if (horn === 'twinnose') { c.beginPath(); c.moveTo(nx - 26, ny + 6); c.quadraticCurveTo(nx - 20, ny - headR * 0.6, nx - 10, ny + 5); c.closePath(); c.fill(); }
  } else if (horn === 'ossicone') {
    c.strokeStyle = p.dark; c.lineWidth = 7; c.lineCap = 'round';
    for (const s of [-1, 1] as const) { c.beginPath(); c.moveTo(headX - headR * 0.1 + s * headR * 0.3, headY - headR * 0.6); c.lineTo(headX - headR * 0.15 + s * headR * 0.4, headY - headR * 1.25); c.stroke();
      c.fillStyle = '#3a2c1c'; c.beginPath(); c.arc(headX - headR * 0.15 + s * headR * 0.4, headY - headR * 1.3, 7, 0, TAU); c.fill(); }
  } else if (horn === 'palmate') {   /* moose */
    c.fillStyle = '#c9b596';
    for (const s of [-1, 1] as const) {
      c.save(); c.translate(headX - headR * 0.1, headY - headR * 0.7); c.scale(s, 1);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(headR * 1.2, -headR * 0.7, headR * 2.2, -headR * 0.5);
      c.quadraticCurveTo(headR * 2.0, headR * 0.1, headR * 0.9, headR * 0.25);
      c.closePath(); c.fill();
      c.strokeStyle = '#c9b596'; c.lineWidth = 5; c.lineCap = 'round';
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(headR * (1.4 + i * 0.22), -headR * 0.5); c.lineTo(headR * (1.5 + i * 0.26), -headR * 1.05); c.stroke(); }
      c.restore();
    }
  } else if (horn === 'branched') {   /* deer/elk */
    c.strokeStyle = '#b8a184'; c.lineWidth = 6; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      const bx0 = headX - headR * 0.15 + s * headR * 0.28, by0 = headY - headR * 0.65;
      c.beginPath(); c.moveTo(bx0, by0); c.quadraticCurveTo(bx0 + s * headR * 0.7, by0 - headR * 1.1, bx0 + s * headR * 0.5, by0 - headR * 1.9); c.stroke();
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx0 + s * headR * (0.25 + i * 0.16), by0 - headR * (0.6 + i * 0.45)); c.lineTo(bx0 + s * headR * (1.0 + i * 0.2), by0 - headR * (0.9 + i * 0.5)); c.stroke(); }
    }
  } else if (horn === 'curl') {   /* ram */
    c.strokeStyle = '#c2ae8e'; c.lineWidth = 9; c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      c.beginPath(); c.arc(headX - headR * 0.1 + s * headR * 0.5, headY - headR * 0.2, headR * 0.66, -0.4, 4.2, s < 0); c.stroke();
    }
  } else if (horn === 'straight' || horn === 'spiral' || horn === 'lyre' || horn === 'prong' || horn === 'shorthorn') {
    /* THE BOVID HORN. An antelope IS its horns: an oryx's metre-long
       straight rapiers, a kudu's corkscrew, an impala's lyre. Drawn as one
       generic spike they all became the same goat. */
    c.strokeStyle = '#cbb894'; c.lineCap = 'round';
    const HL = headR * (horn === 'straight' ? 2.5 : horn === 'spiral' ? 2.0 : horn === 'lyre' ? 1.7 : horn === 'prong' ? 1.0 : 0.72);
    c.lineWidth = horn === 'shorthorn' ? 7 : 8;
    for (const s of [-1, 1] as const) {
      const bx2 = headX - headR * 0.15 + s * headR * 0.34, by2 = headY - headR * 0.62;
      if (horn === 'spiral') {   /* the kudu corkscrew: a swept curve with turns */
        c.beginPath(); c.moveTo(bx2, by2);
        for (let i = 1; i <= 22; i++) {
          const u = i / 22;
          c.lineTo(bx2 + s * (Math.sin(u * 9) * headR * 0.22 + u * headR * 0.30), by2 - u * HL);
        }
        c.stroke();
      } else if (horn === 'lyre') {   /* out, then sweeping back up */
        c.beginPath(); c.moveTo(bx2, by2);
        c.bezierCurveTo(bx2 + s * headR * 0.9, by2 - HL * 0.42, bx2 - s * headR * 0.2, by2 - HL * 0.80, bx2 + s * headR * 0.7, by2 - HL);
        c.stroke();
      } else if (horn === 'prong') {
        c.beginPath(); c.moveTo(bx2, by2); c.lineTo(bx2 + s * headR * 0.16, by2 - HL); c.stroke();
        c.lineWidth = 5;
        c.beginPath(); c.moveTo(bx2 + s * headR * 0.10, by2 - HL * 0.58); c.lineTo(bx2 + s * headR * 0.62, by2 - HL * 0.74); c.stroke();
        c.lineWidth = 8;
      } else {   /* straight rapier / short goat horn, angled back */
        c.beginPath(); c.moveTo(bx2, by2);
        c.quadraticCurveTo(bx2 + s * headR * 0.10, by2 - HL * 0.6, bx2 - headR * 0.30 + s * headR * 0.34, by2 - HL);
        c.stroke();
      }
      if (horn === 'straight' || horn === 'spiral') {   /* the annulations */
        c.strokeStyle = 'rgba(60,48,30,0.30)'; c.lineWidth = 2;
        for (let i = 1; i < 7; i++) {
          const yy = by2 - (HL * i) / 7;
          c.beginPath(); c.moveTo(bx2 - 5 + s * i, yy); c.lineTo(bx2 + 5 + s * i, yy); c.stroke();
        }
        c.strokeStyle = '#cbb894'; c.lineWidth = 8;
      }
    }
  } else if (horn === 'tuskup' || horn === 'tuskdown') {
    c.fillStyle = '#efe6d4';
    const dir = horn === 'tuskup' ? -1 : 1;
    for (const s of [-1, 1] as const) {
      const tx = headX + headR * (mz > 0.05 ? 1.1 : 0.7) + s * headR * 0.16, ty = headY + headR * 0.3;
      c.beginPath(); c.moveTo(tx - 5, ty);
      c.quadraticCurveTo(tx + dir * -6, ty + dir * headR * 0.9, tx + 6, ty + dir * headR * 1.45);
      c.quadraticCurveTo(tx + 10, ty + dir * headR * 0.8, tx + 6, ty);
      c.closePath(); c.fill();
    }
  }
  if (spec.trunk) {
    c.strokeStyle = p.base; c.lineWidth = headR * 0.52; c.lineCap = 'round';
    c.beginPath(); c.moveTo(headX + headR * 0.75, headY + headR * 0.2);
    c.quadraticCurveTo(headX + headR * 1.7, headY + headR * 1.2, headX + headR * 1.2, headY + headR * 2.1); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = headR * 0.12;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6, tx = headX + headR * (0.75 + 1.0 * t), ty = headY + headR * (0.2 + 1.7 * t);
      c.beginPath(); c.moveTo(tx - headR * 0.2, ty); c.lineTo(tx + headR * 0.2, ty); c.stroke();
    }
  }

  /* ---- tail ---- */
  const tail = spec.tail ?? 'stub';
  const tx0 = cx - bodyW * 0.98, ty0 = cy - bodyH * 0.1;
  if (tail === 'bushy' || tail === 'plume') {
    /* ★ WAVE 21 — A BRUSH IS NOT A TUBE. One constant-width round-capped stroke
       gave every fox, snow leopard and fennec in the catalogue an orange PIPE
       lying behind it. A plume tapers from a narrow root, swells through its
       length, and finishes in loose hair that breaks the outline. */
    const k = (tail === 'plume' ? 0.52 : 0.42) * (spec.tailScale ?? 1);
    /* the same sweep the original stroke traced — the shape was never the
       problem, the constant width and the round cap were */
    const at = (t: number): [number, number] => {
      const m = 1 - t;
      return [m * m * tx0 + 2 * m * t * (tx0 - bodyW * 0.40) + t * t * (tx0 - bodyW * 0.50),
        m * m * ty0 + 2 * m * t * (ty0 + bodyH * 0.20) + t * t * (ty0 + bodyH * 0.85)];
    };
    const widthAt = (t: number): number => bodyH * k * (0.34 + Math.sin(t * Math.PI * 0.86 + 0.20) * 0.80);
    c.lineCap = 'round';
    const SEG = 20;
    for (let i = 0; i < SEG; i++) {
      const t0 = i / SEG, t1 = (i + 1) / SEG;
      const [ax, ay] = at(t0), [bxp, byp] = at(t1);
      c.lineWidth = widthAt(t0);
      c.strokeStyle = i < SEG * 0.4 ? p.base : (i < SEG * 0.78 ? p.lit : p.base);
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bxp, byp); c.stroke();
    }
    /* THE GUARD HAIRS. Sprayed at a random angle they made a starburst — the
       kiwi's mistake, again. Every hair leaves the tail SIDEWAYS off the local
       tangent and sweeps toward the tip, so the brush lies along the tail. */
    const hr = mulberry32((((g.seed as number) ^ 0x7A17) >>> 0));
    c.lineWidth = 1.5;
    for (let i = 0; i < 110; i++) {
      const t = 0.12 + hr() * 0.86;
      const [hx2, hy2] = at(t);
      const [nx2, ny2] = at(Math.min(1, t + 0.02));
      const tanA = Math.atan2(ny2 - hy2, nx2 - hx2);
      const side = hr() < 0.5 ? 1 : -1;
      const w = widthAt(t);
      const L = w * (0.35 + hr() * 0.55);
      const px = Math.cos(tanA + side * Math.PI / 2), py = Math.sin(tanA + side * Math.PI / 2);
      const ux = px * 0.72 + Math.cos(tanA) * 0.68, uy = py * 0.72 + Math.sin(tanA) * 0.68;
      c.strokeStyle = side > 0 ? p.lit : p.dark;
      c.globalAlpha = 0.22 + hr() * 0.40;
      c.beginPath();
      c.moveTo(hx2 + px * w * 0.25, hy2 + py * w * 0.25);
      c.lineTo(hx2 + px * w * 0.55 + ux * L, hy2 + py * w * 0.55 + uy * L);
      c.stroke();
    }
    c.globalAlpha = 1;
    /* the pale tip most brush-tailed carnivores wear */
    const [tipx, tipy] = at(1);
    c.fillStyle = 'rgba(246,244,238,0.50)';
    c.beginPath(); c.ellipse(tipx, tipy, widthAt(1) * 0.60, widthAt(1) * 0.50, 0.3, 0, TAU); c.fill();
  } else if (tail === 'long' || tail === 'tuft') {
    c.strokeStyle = p.base; c.lineWidth = bodyH * 0.18; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx0, ty0); c.quadraticCurveTo(tx0 - bodyW * 0.5, ty0 + bodyH * 0.1, tx0 - bodyW * 0.42, ty0 + bodyH * 0.9); c.stroke();
    if (tail === 'tuft') { c.fillStyle = p.dark; c.beginPath(); c.ellipse(tx0 - bodyW * 0.42, ty0 + bodyH * 0.95, bodyH * 0.16, bodyH * 0.22, 0, 0, TAU); c.fill(); }
  } else if (tail === 'banded') {
    c.strokeStyle = p.base; c.lineWidth = bodyH * 0.42; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx0, ty0); c.quadraticCurveTo(tx0 - bodyW * 0.45, ty0 + bodyH * 0.1, tx0 - bodyW * 0.55, ty0 + bodyH * 0.8); c.stroke();
    c.strokeStyle = 'rgba(28,22,18,0.75)'; c.lineWidth = bodyH * 0.42;
    for (let i = 0; i < 4; i++) {
      const t = 0.2 + i * 0.22;
      const bxp = tx0 - bodyW * (0.45 * t + 0.1 * t * t), byp = ty0 + bodyH * (0.1 + 0.7 * t * t);
      c.beginPath(); c.moveTo(bxp, byp); c.lineTo(bxp - bodyW * 0.03, byp + bodyH * 0.09); c.stroke();
    }
  } else if (tail === 'paddle') {
    /* ★ ARC STAGE 3 — the beaver's reference row names "flat scaly paddle tail"
       as a mustRead, and the system had no tail that could say it. A beaver's
       tail is a broad flat oar held low behind, crosshatched with scutes. */
    const px = tx0 - bodyW * 0.42, py = ty0 + bodyH * 0.62;
    c.save(); c.translate(px, py); c.rotate(0.30);
    const pg = c.createLinearGradient(0, -bodyH * 0.5, 0, bodyH * 0.5);
    pg.addColorStop(0, p.dark); pg.addColorStop(0.45, p.base); pg.addColorStop(1, p.dark);
    c.fillStyle = pg;
    c.beginPath(); c.ellipse(0, 0, bodyW * 0.52, bodyH * 0.40, 0, 0, TAU); c.fill();
    /* the scutes — a diamond crosshatch, foreshortened toward the rim so the
       pattern lies ON the paddle instead of floating over it */
    c.strokeStyle = `rgba(${p.cr * 0.38 | 0},${p.cg * 0.38 | 0},${p.cb * 0.38 | 0},0.55)`;
    c.lineWidth = 1.3;
    for (let i = -4; i <= 4; i++) {
      const u = i / 4;
      const fore = Math.sqrt(Math.max(0.05, 1 - u * u));
      c.beginPath(); c.moveTo(u * bodyW * 0.50, -bodyH * 0.38 * fore);
      c.lineTo(u * bodyW * 0.50, bodyH * 0.38 * fore); c.stroke();
      c.beginPath(); c.moveTo(-bodyW * 0.50 * fore, u * bodyH * 0.36);
      c.lineTo(bodyW * 0.50 * fore, u * bodyH * 0.36); c.stroke();
    }
    c.strokeStyle = 'rgba(236,242,252,0.28)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, bodyW * 0.50, bodyH * 0.38, 0, -2.6, -0.4); c.stroke();
    c.restore();
    /* the thick muscular root joining it to the rump */
    c.strokeStyle = p.base; c.lineWidth = bodyH * 0.34; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx0, ty0 + bodyH * 0.2);
    c.lineTo(px + bodyW * 0.22, py - bodyH * 0.12); c.stroke();
  } else if (tail === 'stub') {
    c.fillStyle = p.dark; c.beginPath(); c.ellipse(tx0 - 4, ty0 + bodyH * 0.1, bodyH * 0.16, bodyH * 0.20, 0.3, 0, TAU); c.fill();
  }
}

/* ---- the species table: PROPORTION carries identity, then decoration ---- */
export const QUAD_SPEC: Record<string, QuadSpec> = {
  /* big cats — same family, different builds and coats */
  /* ★ wave 22b — Lion had NO route and fell through to the verbatim engine,
     where the mane rendered as a ring of spikes over an unreadable face. */
  'Lion': { legs: 0.1236, depth: 0.1426, len: 0.2455, neck: 0.06, muzzle: 0.34, jaw: 'broad', ears: 'round', tail: 'tuft', mane: 'lion', hue: '#c19a5b' },
  'Jaguar': { legs: 0.114, depth: 0.1395, len: 0.2287, neck: 0.07, muzzle: 0.35, jaw: 'broad', ears: 'round', tail: 'long', coat: 'rosettes' },
  'Leopard': { legs: 0.1253, depth: 0.1268, len: 0.2287, neck: 0.07, muzzle: 0.32, ears: 'round', tail: 'long', coat: 'rosettes' },
  'Snow Leopard': { legs: 0.1221, depth: 0.133, len: 0.2399, neck: 0.07, muzzle: 0.30, ears: 'round', tail: 'plume', coat: 'rosettes', hue: '#cfd4dc' },
  'Cheetah': { legs: 0.1938, depth: 0.1205, len: 0.1976, neck: 0.09, muzzle: 0.28, ears: 'round', tail: 'long', coat: 'spots', face: 'tears', hue: '#d8b477' },
  'Cougar': { legs: 0.1482, depth: 0.1268, len: 0.2287, neck: 0.08, muzzle: 0.30, ears: 'round', tail: 'long' },
  'Lynx': { legs: 0.1495, depth: 0.1226, len: 0.186, neck: 0.06, muzzle: 0.26, ears: 'large', tail: 'stub', coat: 'spots' },
  /* the pixel-siblings, separated */
  'Rhinoceros': { legs: 0.0835, depth: 0.1886, len: 0.263, neck: 0.045, muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'twinnose', hue: '#8b8b8e' },
  'Wild Sheep': { legs: 0.1345, depth: 0.1529, len: 0.1881, neck: 0.075, muzzle: 0.35, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#9d8a6e' },
  'Hippopotamus': { legs: 0.0486, depth: 0.1789, len: 0.3227, neck: 0.03, muzzle: 0.62, jaw: 'barrel', ears: 'tiny', tail: 'stub', hue: '#8a6f74' },
  /* the humped and the long-necked */
  'Camel': { legs: 0.1846, depth: 0.1629, len: 0.1804, neck: 0.20, back: 'level', muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#c8a173' },
  'Bactrian Camel': { legs: 0.176, depth: 0.1667, len: 0.1914, neck: 0.19, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 2, hue: '#b08a5e' },
  'Dromedary Camel': { legs: 0.1935, depth: 0.159, len: 0.176, neck: 0.20, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#cba777' },
  'Giraffe': { legs: 0.2438, depth: 0.1573, len: 0.1652, neck: 0.34, back: 'sloped', muzzle: 0.40, ears: 'large', tail: 'tuft', coat: 'patches', horn: 'ossicone', hue: '#e0c07a' },
  'Llama': { legs: 0.1938, depth: 0.1434, len: 0.1506, neck: 0.20, muzzle: 0.35, ears: 'large', tail: 'stub', hue: '#d8cbb4' },
  'Alpaca': { legs: 0.1594, depth: 0.1448, len: 0.152, neck: 0.18, muzzle: 0.30, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#ddd2bd' },
  /* antlered + horned */
  'Moose': { legs: 0.2181, depth: 0.1843, len: 0.2116, neck: 0.10, back: 'humped', muzzle: 0.62, jaw: 'broad', ears: 'large', tail: 'stub', horn: 'palmate', hue: '#5b4433' },
  'Elk': { legs: 0.2035, depth: 0.1594, len: 0.2092, neck: 0.13, back: 'sloped', muzzle: 0.48, ears: 'large', tail: 'stub', horn: 'branched', hue: '#9c7748' },
  'Deer': { legs: 0.1973, depth: 0.139, len: 0.1709, neck: 0.12, muzzle: 0.42, ears: 'large', tail: 'stub', horn: 'branched', coat: 'spots', hue: '#b98a58' },
  'Reindeer': { legs: 0.1782, depth: 0.1505, len: 0.1974, neck: 0.11, muzzle: 0.44, ears: 'small', tail: 'stub', horn: 'branched', hue: '#a8917a' },
  'Sheep': { legs: 0.1448, depth: 0.1548, len: 0.1777, neck: 0.08, muzzle: 0.36, ears: 'small', tail: 'stub', horn: 'curl', hue: '#a98f6d' },
  'Bison': { legs: 0.1211, depth: 0.1881, len: 0.2313, neck: 0.05, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'small', tail: 'tuft', coat: 'shaggy', hue: '#5c4535' },
  'Water Buffalo': { legs: 0.1249, depth: 0.1765, len: 0.246, neck: 0.06, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'curl', hue: '#4f4a48' },
  /* bears, differentiated */
  'Grizzly Bear': { legs: 0.0916, depth: 0.1717, len: 0.2534, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#7a5636' },
  'Brown Bear': { legs: 0.0963, depth: 0.1881, len: 0.2313, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#70502f' },
  'Polar Bear': { legs: 0.1112, depth: 0.1696, len: 0.2642, neck: 0.10, back: 'level', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#eef2f6' },
  'Black Bear': { legs: 0.101, depth: 0.1729, len: 0.2268, neck: 0.05, muzzle: 0.42, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#3b3a40' },
  'Panda': { legs: 0.0825, depth: 0.1844, len: 0.2269, neck: 0.04, back: 'arched', muzzle: 0.30, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'panda', face: 'mask', hue: '#f0f2f4' },
  'Sun Bear': { legs: 0.0939, depth: 0.1438, len: 0.2004, neck: 0.05, muzzle: 0.38, ears: 'round', tail: 'stub', hue: '#2f2b2c' },
  'Sloth Bear': { legs: 0.1001, depth: 0.1697, len: 0.2227, neck: 0.05, muzzle: 0.55, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#2b2726' },
  /* canids + small mammals where ears/tails are the read */
  'Red Fox': { legs: 0.1118, depth: 0.104, len: 0.1962, neck: 0.06, muzzle: 0.44, jaw: 'fine', ears: 'large', tail: 'plume', hue: '#d1651f' },
  'Arctic Fox': { legs: 0.1046, depth: 0.1072, len: 0.1847, neck: 0.06, muzzle: 0.36, ears: 'small', tail: 'plume', hue: '#eaf0f5' },
  /* ★ wave 21 — the audit: "ears should dominate the head; reduce body size and
     increase bushy tail". A fennec is a desert fox scaled DOWN around ears that
     were not scaled down with it. */
  'Fennec Fox': { legs: 0.0667, depth: 0.0799, len: 0.1048, neck: 0.03, muzzle: 0.30, ears: 'huge', tail: 'plume', hue: '#e6cfa4', earScale: 1.85, tailScale: 1.6 },
  'Wolf': { legs: 0.155, depth: 0.1377, len: 0.2033, neck: 0.08, muzzle: 0.46, ears: 'large', tail: 'bushy', hue: '#7d7f86' },
  'Hyena': { legs: 0.1442, depth: 0.1492, len: 0.208, neck: 0.08, back: 'sloped', muzzle: 0.42, jaw: 'broad', ears: 'large', tail: 'bushy', coat: 'spots', hue: '#a08a63' },
  'Koala': { legs: 0.0551, depth: 0.1434, len: 0.1506, neck: 0.03, muzzle: 0.20, jaw: 'broad', ears: 'huge', tail: 'none', hue: '#a8adb4' },
  /* ⚠ the pachyderms + Zebra/Tiger/Lion/Red Panda/Raccoon are DELIBERATELY
     ABSENT: the verbatim engine already nails them (Elephant 4.5/5; Nick's
     audit lists the others among its stronger reads). Never override what
     already excels — a generic system cannot beat bespoke work. */
  'Walrus': { legs: 0.0303, depth: 0.1631, len: 0.2943, neck: 0.04, muzzle: 0.50, jaw: 'barrel', ears: 'tiny', tail: 'none', horn: 'tuskdown', hue: '#a3705f' },
  /* equines + swine */
  'Horse': { legs: 0.1964, depth: 0.1524, len: 0.1999, neck: 0.14, muzzle: 0.50, ears: 'small', tail: 'plume', hue: '#8a5a35' },
  'Wild Boar': { legs: 0.0955, depth: 0.1423, len: 0.2101, neck: 0.05, back: 'sloped', muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'tuskup', coat: 'shaggy', hue: '#5a4a3e' },
  'Warthog': { legs: 0.1087, depth: 0.1405, len: 0.1958, neck: 0.05, back: 'sloped', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'tuskup', hue: '#6b5647' },
  'Tapir': { legs: 0.1099, depth: 0.1542, len: 0.2276, neck: 0.05, muzzle: 0.48, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#4a4348' },
};
