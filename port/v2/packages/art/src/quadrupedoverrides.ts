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
  ears?: 'tiny' | 'small' | 'round' | 'large' | 'huge';
  tail?: 'none' | 'stub' | 'tuft' | 'bushy' | 'long' | 'plume' | 'banded';
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
function smoothTop(c: Ctx, cx: number, bodyW: number, topY: (t: number) => number): void {
  const N = 14, pts: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([cx - bodyW + bodyW * 2 * t, topY(t)]); }
  c.moveTo(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i]!, b = pts[i + 1]!;
    c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  const last = pts[pts.length - 1]!;
  c.lineTo(last[0], last[1]);
}
function traceBody(c: Ctx, cx: number, cy: number, bodyW: number, bodyH: number, topY: (t: number) => number): void {
  c.beginPath();
  c.moveTo(cx - bodyW, cy + bodyH * 0.1);
  c.quadraticCurveTo(cx - bodyW * 1.04, cy - bodyH * 0.22, cx - bodyW * 0.94, topY(0.04));
  smoothTop(c, cx, bodyW, topY);
  /* down the shoulder into a DEEP CHEST (the brisket hangs lowest here) */
  c.quadraticCurveTo(cx + bodyW * 1.10, cy + bodyH * 0.26, cx + bodyW * 0.86, cy + bodyH * 0.70);
  /* forward of the ribs the belly TUCKS UP — the single line that stops a
     torso being a slab */
  c.quadraticCurveTo(cx + bodyW * 0.36, cy + bodyH * 0.86, cx - bodyW * 0.02, cy + bodyH * 0.50);
  /* and swells again into the ROUNDED RUMP over the hind leg */
  c.quadraticCurveTo(cx - bodyW * 0.52, cy + bodyH * 0.30, cx - bodyW * 0.86, cy + bodyH * 0.58);
  c.quadraticCurveTo(cx - bodyW * 1.08, cy + bodyH * 0.36, cx - bodyW, cy + bodyH * 0.1);
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
  const legW = Math.max(7, bodyH * 0.30);
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
  const headR = bodyH * (spec.jaw === 'barrel' ? 0.62 : spec.jaw === 'broad' ? 0.52 : 0.42);
  c.strokeStyle = p.base; c.lineWidth = Math.max(10, bodyH * (neckLen > S * 0.16 ? 0.36 : 0.62));
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(shoulderX - bodyW * 0.1, shoulderY + bodyH * 0.2);
  c.quadraticCurveTo(shoulderX + neckLen * 0.30, shoulderY - neckLen * 0.45, headX, headY);
  c.stroke();
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
  const earR = headR * (ears === 'huge' ? 1.25 : ears === 'large' ? 0.75 : ears === 'round' ? 0.62 : ears === 'small' ? 0.4 : 0.22);
  if (ears !== 'tiny' || true) {
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
    c.fillStyle = '#0d1016'; c.beginPath(); c.arc(headX + headR * 0.08, headY - headR * 0.12, headR * 0.16, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(headX + headR * 0.03, headY - headR * 0.18, headR * 0.06, 0, TAU); c.fill();
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
    c.strokeStyle = p.base; c.lineWidth = bodyH * (tail === 'plume' ? 0.55 : 0.44); c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx0, ty0); c.quadraticCurveTo(tx0 - bodyW * 0.4, ty0 + bodyH * 0.2, tx0 - bodyW * 0.5, ty0 + bodyH * 0.85); c.stroke();
    c.strokeStyle = p.lit; c.lineWidth = bodyH * 0.16;
    c.beginPath(); c.moveTo(tx0 - bodyW * 0.42, ty0 + bodyH * 0.5); c.lineTo(tx0 - bodyW * 0.5, ty0 + bodyH * 0.85); c.stroke();
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
  } else if (tail === 'stub') {
    c.fillStyle = p.dark; c.beginPath(); c.ellipse(tx0 - 4, ty0 + bodyH * 0.1, bodyH * 0.16, bodyH * 0.20, 0.3, 0, TAU); c.fill();
  }
}

/* ---- the species table: PROPORTION carries identity, then decoration ---- */
export const QUAD_SPEC: Record<string, QuadSpec> = {
  /* big cats — same family, different builds and coats */
  'Jaguar': { legs: 0.10, depth: 0.11, len: 0.29, neck: 0.07, muzzle: 0.35, jaw: 'broad', ears: 'round', tail: 'long', coat: 'rosettes' },
  'Leopard': { legs: 0.11, depth: 0.10, len: 0.29, neck: 0.07, muzzle: 0.32, ears: 'round', tail: 'long', coat: 'rosettes' },
  'Snow Leopard': { legs: 0.11, depth: 0.11, len: 0.29, neck: 0.07, muzzle: 0.30, ears: 'round', tail: 'plume', coat: 'rosettes', hue: '#cfd4dc' },
  'Cheetah': { legs: 0.16, depth: 0.085, len: 0.28, neck: 0.09, muzzle: 0.28, ears: 'round', tail: 'long', coat: 'spots', face: 'tears', hue: '#d8b477' },
  'Cougar': { legs: 0.13, depth: 0.10, len: 0.29, neck: 0.08, muzzle: 0.30, ears: 'round', tail: 'long' },
  'Lynx': { legs: 0.13, depth: 0.095, len: 0.24, neck: 0.06, muzzle: 0.26, ears: 'large', tail: 'stub', coat: 'spots' },
  /* the pixel-siblings, separated */
  'Rhinoceros': { legs: 0.075, depth: 0.155, len: 0.32, neck: 0.045, muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'twinnose', hue: '#8b8b8e' },
  'Wild Sheep': { legs: 0.115, depth: 0.115, len: 0.25, neck: 0.075, muzzle: 0.35, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#9d8a6e' },
  'Hippopotamus': { legs: 0.048, depth: 0.175, len: 0.33, neck: 0.03, muzzle: 0.62, jaw: 'barrel', ears: 'tiny', tail: 'stub', hue: '#8a6f74' },
  /* the humped and the long-necked */
  'Camel': { legs: 0.145, depth: 0.105, len: 0.28, neck: 0.20, back: 'level', muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#c8a173' },
  'Bactrian Camel': { legs: 0.14, depth: 0.11, len: 0.29, neck: 0.19, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 2, hue: '#b08a5e' },
  'Dromedary Camel': { legs: 0.15, depth: 0.10, len: 0.28, neck: 0.20, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#cba777' },
  'Giraffe': { legs: 0.19, depth: 0.10, len: 0.26, neck: 0.34, back: 'sloped', muzzle: 0.40, ears: 'large', tail: 'tuft', coat: 'patches', horn: 'ossicone', hue: '#e0c07a' },
  'Llama': { legs: 0.15, depth: 0.09, len: 0.24, neck: 0.20, muzzle: 0.35, ears: 'large', tail: 'stub', hue: '#d8cbb4' },
  'Alpaca': { legs: 0.13, depth: 0.10, len: 0.22, neck: 0.18, muzzle: 0.30, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#ddd2bd' },
  /* antlered + horned */
  'Moose': { legs: 0.18, depth: 0.13, len: 0.30, neck: 0.10, back: 'humped', muzzle: 0.62, jaw: 'broad', ears: 'large', tail: 'stub', horn: 'palmate', hue: '#5b4433' },
  'Elk': { legs: 0.17, depth: 0.115, len: 0.29, neck: 0.13, back: 'sloped', muzzle: 0.48, ears: 'large', tail: 'stub', horn: 'branched', hue: '#9c7748' },
  'Deer': { legs: 0.16, depth: 0.095, len: 0.25, neck: 0.12, muzzle: 0.42, ears: 'large', tail: 'stub', horn: 'branched', coat: 'spots', hue: '#b98a58' },
  'Reindeer': { legs: 0.15, depth: 0.11, len: 0.27, neck: 0.11, muzzle: 0.44, ears: 'small', tail: 'stub', horn: 'branched', hue: '#a8917a' },
  'Sheep': { legs: 0.12, depth: 0.11, len: 0.25, neck: 0.08, muzzle: 0.36, ears: 'small', tail: 'stub', horn: 'curl', hue: '#a98f6d' },
  'Bison': { legs: 0.105, depth: 0.145, len: 0.30, neck: 0.05, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'small', tail: 'tuft', coat: 'shaggy', hue: '#5c4535' },
  'Water Buffalo': { legs: 0.11, depth: 0.14, len: 0.31, neck: 0.06, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'curl', hue: '#4f4a48' },
  /* bears, differentiated */
  'Grizzly Bear': { legs: 0.085, depth: 0.15, len: 0.29, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#7a5636' },
  'Brown Bear': { legs: 0.085, depth: 0.15, len: 0.29, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#70502f' },
  'Polar Bear': { legs: 0.10, depth: 0.14, len: 0.32, neck: 0.10, back: 'level', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#eef2f6' },
  'Black Bear': { legs: 0.09, depth: 0.14, len: 0.28, neck: 0.05, muzzle: 0.42, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#3b3a40' },
  'Panda': { legs: 0.075, depth: 0.155, len: 0.27, neck: 0.04, back: 'arched', muzzle: 0.30, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'panda', face: 'mask', hue: '#f0f2f4' },
  'Sun Bear': { legs: 0.085, depth: 0.12, len: 0.24, neck: 0.05, muzzle: 0.38, ears: 'round', tail: 'stub', hue: '#2f2b2c' },
  'Sloth Bear': { legs: 0.09, depth: 0.14, len: 0.27, neck: 0.05, muzzle: 0.55, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#2b2726' },
  /* canids + small mammals where ears/tails are the read */
  'Red Fox': { legs: 0.10, depth: 0.085, len: 0.24, neck: 0.06, muzzle: 0.44, jaw: 'fine', ears: 'large', tail: 'plume', hue: '#d1651f' },
  'Arctic Fox': { legs: 0.095, depth: 0.09, len: 0.22, neck: 0.06, muzzle: 0.36, ears: 'small', tail: 'plume', hue: '#eaf0f5' },
  'Fennec Fox': { legs: 0.085, depth: 0.075, len: 0.18, neck: 0.05, muzzle: 0.34, ears: 'huge', tail: 'plume', hue: '#e6cfa4' },
  'Wolf': { legs: 0.13, depth: 0.10, len: 0.28, neck: 0.08, muzzle: 0.46, ears: 'large', tail: 'bushy', hue: '#7d7f86' },
  'Hyena': { legs: 0.125, depth: 0.115, len: 0.27, neck: 0.08, back: 'sloped', muzzle: 0.42, jaw: 'broad', ears: 'large', tail: 'bushy', coat: 'spots', hue: '#a08a63' },
  'Koala': { legs: 0.05, depth: 0.12, len: 0.18, neck: 0.03, muzzle: 0.20, jaw: 'broad', ears: 'huge', tail: 'none', hue: '#a8adb4' },
  /* ⚠ the pachyderms + Zebra/Tiger/Lion/Red Panda/Raccoon are DELIBERATELY
     ABSENT: the verbatim engine already nails them (Elephant 4.5/5; Nick's
     audit lists the others among its stronger reads). Never override what
     already excels — a generic system cannot beat bespoke work. */
  'Walrus': { legs: 0.03, depth: 0.16, len: 0.30, neck: 0.04, muzzle: 0.50, jaw: 'barrel', ears: 'tiny', tail: 'none', horn: 'tuskdown', hue: '#a3705f' },
  /* equines + swine */
  'Horse': { legs: 0.16, depth: 0.105, len: 0.29, neck: 0.14, muzzle: 0.50, ears: 'small', tail: 'plume', hue: '#8a5a35' },
  'Wild Boar': { legs: 0.085, depth: 0.115, len: 0.26, neck: 0.05, back: 'sloped', muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'tuskup', coat: 'shaggy', hue: '#5a4a3e' },
  'Warthog': { legs: 0.095, depth: 0.11, len: 0.25, neck: 0.05, back: 'sloped', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'tuskup', hue: '#6b5647' },
  'Tapir': { legs: 0.10, depth: 0.13, len: 0.27, neck: 0.05, muzzle: 0.48, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#4a4348' },
};
