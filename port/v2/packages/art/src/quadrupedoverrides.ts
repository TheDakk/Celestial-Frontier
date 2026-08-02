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
import { type Form } from './surface.js';
import { alienEyes, alienSkin, alienGlow, alienSail, alienArmor, type AlienTraits } from './alientraits.js';
import { Tube, pathThrough, spline } from './torso.js';
import { countershade, coatSpots, coatRosettes, coatBars, coatPatches, coatBlotches, coatBrindle, coatShaggy, shaggyRim, coatBlocks } from './skin.js';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;

export interface QuadSpec {
  legs: number;                 /* leg length as a fraction of S */
  depth: number;                /* body depth (belly) */
  len?: number;                 /* body length */
  neck: number;                 /* neck length */
  back?: 'level' | 'humped' | 'sloped' | 'arched' | 'saddle';
  muzzle?: number;              /* snout projection */
  jaw?: 'fine' | 'broad' | 'barrel';
  ears?: 'tiny' | 'small' | 'round' | 'large' | 'huge' | 'fan';
  tail?: 'none' | 'stub' | 'tuft' | 'bushy' | 'long' | 'plume' | 'banded' | 'paddle';
  coat?: 'plain' | 'spots' | 'rosettes' | 'stripes' | 'patches' | 'panda' | 'shaggy' | 'banded'
    | 'bands' | 'brindle' | 'fawn' | 'blotches';
  /* ★ ARC STAGE 3 WAVE 4 — WHERE THE MASS SITS. The torso is a solid now
     (torso.ts), and these four numbers place its anatomy: how far the flank
     tucks up, how far the shoulder and haunch stand proud, how deep the
     brisket is, how heavy the hindquarters are. Each is 0..1 and each
     DEFAULTS from the species' own legs/depth/len — so every existing spec
     keeps a body derived from its own numbers, never from a band (D-ART-83),
     and a species whose reference row names a build overrides it explicitly. */
  waist?: number;
  muscle?: number;
  chest?: number;
  rump?: number;
  /* ★ ARC STAGE 3 WAVE 5 — THE FAMILY BODY PLAN. Nick's anatomy audit named
     this as the single biggest remaining defect, and named it eight times:
     "cats using long-legged ungulate bodies · canids using deer-like torsos
     and legs · bears using pig/ungulate bodies · camels using deer bodies
     with humps added". It was true. One leg painter drew a hoofed ungulate
     limb — thin cannon bone, small oval foot — for every mammal in the
     catalogue, so a cheetah, a wolf and a grizzly all stood on deer legs.

     A family is NOT a band (D-ART-83). It carries only what is true of every
     member by anatomy — a cat has paws and a crouched limb, a bear walks on
     its soles, an antelope has a cannon bone and cloven hooves — and every
     NUMBER still comes from the species' own row. Two cats share a foot;
     they do not share a body. */
  family?: 'felid' | 'canid' | 'ursid' | 'bovid' | 'cervid' | 'equid' | 'camelid'
    | 'suid' | 'mustelid' | 'rodent' | 'pachyderm' | 'generic'
    /* ★ wave 9: the families that had no plan at all and fell through to
       'generic' — 21 routed mammals, and they looked it. */
    | 'marsupial' | 'procyonid' | 'xenarthran' | 'pinniped' | 'burrower';
  foot?: 'hoof' | 'cloven' | 'paw' | 'plantigrade' | 'pad' | 'claw' | 'flipper';
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

/** ★ WAVE 6 — THE SKULL. Nick, after looking at the wave-5 export: *"the heads
    of the animals all look the same to me. They didn't look unique."* He was
    right, and my own visual audit had landed on the same thing independently.
    Every mammal in the catalogue wore ONE head: an ellipse, a smaller ellipse
    stuck on the front for a muzzle, a dark dot for a nose, and one big eye in
    the middle of the face. A cat, a horse, a bear and a pig got the same
    drawing at four sizes.

    A skull is a PROFILE, and the profile is most of what tells species apart:
    how long the face is, how abruptly the forehead drops to the muzzle (the
    "stop" — a dog has a sharp one, a horse has none at all), how much jaw
    hangs beneath, and — the one nobody draws — WHERE THE EYE IS. A predator's
    eyes face forward near the middle of the face; a grazer's sit high, wide
    and far back, which is why a horse looks like prey and a cat does not.

    So the head is built the same way the torso and the limbs are: as a solid
    with a radius profile (torso.ts), which also means it takes the body's
    light and its coat for free, and the eye can be placed ON the surface with
    real foreshortening instead of floated over it.

    Per-species `muzzle` and `jaw` still modulate every one of these numbers —
    the family sets the KIND of skull, the species sets its proportions. */
const SKULL: Record<string, {
  len: number;       /* nose-to-occiput, x headR */
  cranium: number;   /* braincase radius, x headR */
  stop: number;      /* 0 = one straight wedge (horse), 1 = a sharp forehead (cat) */
  muzzle: number;    /* radius at the nose, x headR */
  jaw: number;       /* mandible mass hanging under the muzzle */
  eyeU: number;      /* 0 occiput … 1 nose */
  eyePhi: number;    /* 0 = forward-facing predator, 1 = high and lateral prey */
  eyeR: number;      /* x headR */
  nose: 'wet' | 'disc' | 'nostril';
  tilt: number;      /* how far the muzzle points down off the neck */
}> = {
  felid: { len: 1.70, cranium: 1.00, stop: 0.62, muzzle: 0.46, jaw: 0.34, eyeU: 0.50, eyePhi: 0.22, eyeR: 0.175, nose: 'wet', tilt: 0.06 },
  canid: { len: 2.45, cranium: 0.86, stop: 0.44, muzzle: 0.28, jaw: 0.26, eyeU: 0.40, eyePhi: 0.34, eyeR: 0.15, nose: 'wet', tilt: 0.10 },
  ursid: { len: 2.00, cranium: 1.06, stop: 0.20, muzzle: 0.46, jaw: 0.36, eyeU: 0.36, eyePhi: 0.28, eyeR: 0.13, nose: 'wet', tilt: 0.12 },
  bovid: { len: 2.40, cranium: 0.80, stop: 0.10, muzzle: 0.44, jaw: 0.34, eyeU: 0.32, eyePhi: 0.74, eyeR: 0.16, nose: 'nostril', tilt: 0.16 },
  cervid: { len: 2.30, cranium: 0.78, stop: 0.16, muzzle: 0.36, jaw: 0.28, eyeU: 0.31, eyePhi: 0.72, eyeR: 0.17, nose: 'wet', tilt: 0.16 },
  equid: { len: 2.85, cranium: 0.82, stop: 0.05, muzzle: 0.50, jaw: 0.42, eyeU: 0.28, eyePhi: 0.70, eyeR: 0.15, nose: 'nostril', tilt: 0.18 },
  camelid: { len: 2.10, cranium: 0.72, stop: 0.26, muzzle: 0.38, jaw: 0.34, eyeU: 0.33, eyePhi: 0.62, eyeR: 0.165, nose: 'nostril', tilt: 0.10 },
  /* a pig's snout ends in a flat cartilage DISC, and that disc is the animal */
  suid: { len: 2.25, cranium: 0.86, stop: 0.04, muzzle: 0.52, jaw: 0.40, eyeU: 0.28, eyePhi: 0.58, eyeR: 0.11, nose: 'disc', tilt: 0.20 },
  mustelid: { len: 1.80, cranium: 0.84, stop: 0.38, muzzle: 0.32, jaw: 0.24, eyeU: 0.46, eyePhi: 0.36, eyeR: 0.15, nose: 'wet', tilt: 0.08 },
  rodent: { len: 1.70, cranium: 0.98, stop: 0.46, muzzle: 0.32, jaw: 0.26, eyeU: 0.46, eyePhi: 0.44, eyeR: 0.195, nose: 'wet', tilt: 0.10 },
  pachyderm: { len: 1.95, cranium: 1.16, stop: 0.34, muzzle: 0.54, jaw: 0.40, eyeU: 0.38, eyePhi: 0.56, eyeR: 0.10, nose: 'nostril', tilt: 0.10 },
  marsupial: { len: 1.85, cranium: 0.96, stop: 0.34, muzzle: 0.40, jaw: 0.32, eyeU: 0.44, eyePhi: 0.46, eyeR: 0.20, nose: 'wet', tilt: 0.12 },
  procyonid: { len: 1.95, cranium: 0.92, stop: 0.36, muzzle: 0.34, jaw: 0.26, eyeU: 0.44, eyePhi: 0.38, eyeR: 0.19, nose: 'wet', tilt: 0.14 },
  /* an anteater or a pangolin is almost all snout, and the eye is tiny and far
     back — that proportion alone is the whole group's silhouette */
  xenarthran: { len: 3.10, cranium: 0.70, stop: 0.06, muzzle: 0.22, jaw: 0.14, eyeU: 0.24, eyePhi: 0.50, eyeR: 0.09, nose: 'wet', tilt: 0.22 },
  pinniped: { len: 1.70, cranium: 1.05, stop: 0.30, muzzle: 0.52, jaw: 0.30, eyeU: 0.42, eyePhi: 0.30, eyeR: 0.22, nose: 'wet', tilt: 0.06 },
  burrower: { len: 2.95, cranium: 0.74, stop: 0.08, muzzle: 0.26, jaw: 0.18, eyeU: 0.26, eyePhi: 0.52, eyeR: 0.08, nose: 'wet', tilt: 0.24 },
  generic: { len: 2.00, cranium: 0.94, stop: 0.30, muzzle: 0.42, jaw: 0.34, eyeU: 0.40, eyePhi: 0.40, eyeR: 0.19, nose: 'wet', tilt: 0.10 },
};

/** ★ WAVE 5 — THE FAMILY BODY PLANS.

    Nick's anatomy audit, on the previous export: *"Several global passes
    caused unrelated species to inherit the same body scaffold… cats using
    long-legged ungulate bodies; canids using deer-like torsos and legs;
    bears using pig/ungulate bodies; camels using deer bodies with humps
    added."* Every one of those was real, and all four had the same cause:
    ONE hoofed cursorial limb and ONE mass distribution served the whole
    catalogue, so the only thing separating a cheetah from an impala was
    four numbers and a coat.

    These entries hold only what is TRUE OF EVERY MEMBER OF THE FAMILY by
    anatomy — where a family carries its mass, how thin its lower limb gets,
    how folded it stands, what it puts on the ground. They are DEFAULTS: any
    species may override any of them from its own reference row, and the
    per-species legs/depth/len/neck numbers are untouched. That is the line
    D-ART-83 draws. A shared foot is anatomy; a shared body would be a band. */
const FAMILY: Record<string, {
  waist: number; muscle: number; chest: number; rump: number;
  foot: 'hoof' | 'cloven' | 'paw' | 'plantigrade' | 'pad' | 'claw' | 'flipper';
  cannon: number;    /* 1 = pencil cannon bone, 0 = a column with no ankle */
  crouch: number;    /* 1 = folded and low, 0 = straight-legged and tall */
}> = {
  /* a cat is a deep chest and a tucked waist over a short folded limb */
  felid: { waist: 0.74, muscle: 0.88, chest: 0.80, rump: 0.60, foot: 'paw', cannon: 0.52, crouch: 0.74 },
  /* a dog is leggier and narrower than a cat, and it still has paws */
  canid: { waist: 0.60, muscle: 0.58, chest: 0.84, rump: 0.46, foot: 'paw', cannon: 0.64, crouch: 0.52 },
  /* a bear is a shoulder hump, a heavy rump, no waist at all, and soles */
  ursid: { waist: 0.10, muscle: 0.96, chest: 0.70, rump: 0.90, foot: 'plantigrade', cannon: 0.16, crouch: 0.78 },
  bovid: { waist: 0.30, muscle: 0.52, chest: 0.62, rump: 0.66, foot: 'cloven', cannon: 0.90, crouch: 0.26 },
  cervid: { waist: 0.56, muscle: 0.36, chest: 0.50, rump: 0.44, foot: 'cloven', cannon: 1.00, crouch: 0.22 },
  equid: { waist: 0.32, muscle: 0.74, chest: 0.70, rump: 0.82, foot: 'hoof', cannon: 0.98, crouch: 0.20 },
  /* a camel carries a high chest on long soft-padded legs */
  camelid: { waist: 0.44, muscle: 0.42, chest: 0.78, rump: 0.40, foot: 'pad', cannon: 0.82, crouch: 0.32 },
  suid: { waist: 0.08, muscle: 0.62, chest: 0.82, rump: 0.50, foot: 'cloven', cannon: 0.70, crouch: 0.40 },
  /* a long low tube on very short legs */
  mustelid: { waist: 0.82, muscle: 0.38, chest: 0.46, rump: 0.38, foot: 'paw', cannon: 0.34, crouch: 0.70 },
  rodent: { waist: 0.38, muscle: 0.34, chest: 0.42, rump: 0.74, foot: 'paw', cannon: 0.38, crouch: 0.66 },
  pachyderm: { waist: 0.04, muscle: 0.72, chest: 0.66, rump: 0.70, foot: 'pad', cannon: 0.10, crouch: 0.08 },
  /* unfamilied species keep exactly the wave-4 behaviour, so nothing that
     was already good moves without someone choosing to move it (D-ART-14) */
  /* a marsupial carries its weight BEHIND — heavy haunches, a thick tail
     base, short forelimbs, and it sits low */
  marsupial: { waist: 0.40, muscle: 0.52, chest: 0.50, rump: 0.86, foot: 'paw', cannon: 0.26, crouch: 0.70 },
  /* a raccoon walks on its soles with an arched back and a hunched shoulder */
  procyonid: { waist: 0.54, muscle: 0.44, chest: 0.56, rump: 0.62, foot: 'plantigrade', cannon: 0.28, crouch: 0.66 },
  /* sloths, armadillos, anteaters, pangolins: a low deep body on short limbs
     ending in the enormous digging or hooking CLAWS that define the group */
  xenarthran: { waist: 0.26, muscle: 0.54, chest: 0.62, rump: 0.60, foot: 'claw', cannon: 0.30, crouch: 0.58 },
  /* a seal or a walrus has no standing limb at all — it is a torpedo resting
     on the ground with flippers, and drawing it four legs is the whole error */
  pinniped: { waist: 0.06, muscle: 0.34, chest: 0.72, rump: 0.30, foot: 'flipper', cannon: 0.04, crouch: 0.04 },
  /* an aardvark or a mole: an arched back over powerful short digging forelimbs */
  burrower: { waist: 0.18, muscle: 0.70, chest: 0.58, rump: 0.66, foot: 'claw', cannon: 0.22, crouch: 0.62 },
  generic: { waist: -1, muscle: -1, chest: -1, rump: -1, foot: 'paw', cannon: 0.62, crouch: 0.45 },
};

function pal(p: Pal, spec: QuadSpec): Pal {
  if (!spec.hue) return p;
  const n = parseInt(spec.hue.slice(1), 16), cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
  return { base: spec.hue, cr, cg, cb,
    lit: `rgb(${Math.min(255, cr * 1.28 | 0)},${Math.min(255, cg * 1.28 | 0)},${Math.min(255, cb * 1.28 | 0)})`,
    dark: `rgb(${cr * 0.45 | 0},${cg * 0.45 | 0},${cb * 0.45 | 0})` };
}

/* ⚠ smoothTop() and traceBody() were REMOVED in arc stage 3 wave 4. They drew
   the torso as a FLAT OUTLINE — a sampled back line and a hand-written belly
   bezier — and three waves of this arc were spent chasing cusps, orphaned
   subpaths and tangent mismatches along the seam where their two halves met.
   A solid has no seam to chase (torso.ts). History is in git at 095e28e. */

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

  /* ═════════ ARC STAGE 3 WAVE 4 — THE BODY IS A SOLID ═════════
     Nick: "there's a line between their body, almost like it looks like the
     legs are hooked in." There was, and it was structural, not cosmetic: the
     torso was a FLAT OUTLINE, so a limb could only ever be BUTTED against it
     and a coat mark could only ever float on it. Both of wave 4's asks come
     off the same fix — the torso is now a generalized cylinder (torso.ts)
     with a real radius profile, so
       · a shoulder and a haunch are BULGES IN THE BODY and a leg leaves a
         mass of muscle continuous with the trunk,
       · every point of the surface has a normal, hence a foreshortening and
         a shading value, which is what lets skin.ts lay a coat ON it.
     D-ART-83: the shape LANGUAGE is shared because every mammal has a
     ribcage; the VALUES all default from this species' own legs/depth/len. */
  const topY = (t: number): number => {
    /* t: 0 at the rump, 1 at the shoulder */
    if (back === 'humped') return cy - bodyH * (0.55 + 0.42 * Math.pow(t, 2.2));
    if (back === 'sloped') return cy - bodyH * (0.40 + 0.55 * t);
    if (back === 'arched') return cy - bodyH * (0.52 + 0.30 * Math.sin(t * Math.PI));
    /* ★ the AFRICAN elephant's saddle. Its reference note says it outright —
       'the back dips in a concave curve; the head is the highest point in
       Asian elephants but not here' — and the render had a convex topline
       rising to the skull, i.e. it was drawing the wrong species. Two peaks
       at the shoulder and the hip with a dip between them. */
    if (back === 'saddle') return cy - bodyH * (0.64 - 0.16 * Math.sin(t * Math.PI));
    /* even a level back gets a gentle withers-to-rump curve — a ruler
       straight spine reads as a table edge, never as an animal */
    return cy - bodyH * (0.50 + 0.08 * t + 0.07 * Math.sin(t * Math.PI));
  };
  const FAM0 = FAMILY[spec.family ?? 'generic']!;
  const c01 = (v: number): number => Math.max(0, Math.min(1, v));
  const slim = c01((bodyW * 2) / Math.max(1, bodyH * 1.2) / 1.25 - 1.16);
  const legRatio = c01(spec.legs / Math.max(0.02, spec.depth) / 1.15 - 0.48);
  const barrelK = spec.jaw === 'barrel' ? 0.20 : 1;
  /* the order of preference IS the law: this species' own row first, then what
     is anatomically true of its family, and only then a shape derived from its
     own legs/depth/len. A family default never overrides an explicit value, and
     'generic' (-1) declines to have an opinion at all — so every animal that
     was already right in wave 4 is byte-unchanged until someone gives it a
     family on purpose (D-ART-14). */
  const famV = (v: number, derived: number): number => (v >= 0 ? v : derived);
  const waistF = (spec.waist ?? famV(FAM0.waist, c01(0.20 + slim * 0.46 + legRatio * 0.34))) * barrelK;
  const muscleF = spec.muscle ?? famV(FAM0.muscle, c01(0.32 + legRatio * 0.28 + (1 - slim) * 0.24));
  const chestF = spec.chest ?? famV(FAM0.chest, c01(0.28 + (1 - legRatio) * 0.34 + slim * 0.22));
  const rumpF = spec.rump ?? famV(FAM0.rump, c01(0.32 + (1 - legRatio) * 0.30));
  /* ★ WAVE 7 — THE MASS GOES UP, NOT DOWN. Waves 4–6 built the torso as a
     radius profile hung under a fixed BACK LINE, so every bulge of shoulder or
     haunch muscle pushed the BELLY down by twice as much as it raised the back.
     On a slim pale animal that showed as two grey spheres hanging below the
     gut — Nick's audit called them exactly that, and it cost the Gerenuk, an
     asset his strict re-audit had approved as leave-alone.
     It was backwards. On a standing animal the belly is the STEADY line (all
     four feet are on the ground and the gut hangs where it hangs); the BACK is
     what rises over the croup and the withers. So the two outlines are authored
     directly — a near-level ventral line with a brisket and a waist tuck, and
     the species' own back profile lifted by its muscle — and the radius is
     derived from the gap between them instead of imposing it. */
  const rjit = nvq(0x2B, 0.03);
  const gauss = (u: number, c0: number, w: number): number => Math.exp(-(((u - c0) / w) ** 2));
  const ventral = (u: number): number => cy + bodyH * (
    0.54
    + 0.15 * chestF * gauss(u, 0.74, 0.17)      /* the brisket hangs lowest */
    - 0.24 * waistF * gauss(u, 0.45, 0.18)      /* and the flank tucks up */
    - 0.30 * gauss(u, 0.00, 0.16)               /* closing at the tail root */
    - 0.34 * gauss(u, 1.00, 0.15));             /* and at the base of the neck */
  const dorsal = (u: number): number => topY(u)
    - bodyH * 0.22 * (rumpF * 0.66 + muscleF * 0.48) * gauss(u, 0.17, 0.14)   /* the croup */
    - bodyH * 0.17 * muscleF * gauss(u, 0.86, 0.13)                           /* the withers */
    + bodyH * 0.26 * gauss(u, 0.00, 0.15)
    + bodyH * 0.30 * gauss(u, 1.00, 0.14);
  const RAD = (u: number): number => Math.max(bodyH * 0.05, ((ventral(u) - dorsal(u)) / 2) * rjit);
  /* the axis is INSET by the end caps, so the animal's overall length is still
     the 2·bodyW its spec asked for — a dome on the rump adds body, not frame */
  const axA = cx - bodyW + RAD(0) * 0.80, axB = cx + bodyW - RAD(1) * 0.80;
  const AX = (u: number): [number, number] => [axA + (axB - axA) * u, (ventral(u) + dorsal(u)) / 2];
  const body = new Tube({ P: AX, R: RAD });

  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.beginPath(); c.ellipse(cx, groundY + 6, bodyW * 0.92, S * 0.032, 0, 0, TAU); c.fill();

  /* ---- legs: back pair first (depth), then front ---- */
  /* ★ ARC STAGE 3 (Nick: "the elephant legs are way too long… like they are big
     tree trunks"). Leg thickness was a pure fraction of BODY DEPTH, so the
     deepest-bodied animals — elephant, hippo, rhino — grew columns 28px wide.
     A limb is proportioned against the whole animal, not just how deep its
     chest is, so the depth term is now CAPPED against body length. Slimmer
     animals are unchanged because their depth term still wins. */
  /* ★ ARC STAGE 3 (Nick: "the elephant legs are way too long… like they are big
     tree trunks"). Leg thickness was a pure fraction of BODY DEPTH, so the
     deepest-bodied animals grew columns 28px wide. A limb is proportioned
     against the whole animal, so the depth term is CAPPED against body length
     (D-ART-85). Slimmer animals are unchanged; their depth term still wins. */
  const legW = Math.max(7, Math.min(bodyH * 0.30, bodyW * 0.115));

  /* ★ WAVE 4 — A LEG IS A TAPERED SOLID, NOT TWO STROKES. Two round-capped
     lines of constant width gave every mammal a pair of pipes with a bead
     where they met. A real limb is one continuous form: thick with muscle at
     the top, narrowing hard through the joint, thin at the cannon bone, and
     flaring again at the foot. Built as a Tube, so its silhouette is the true
     envelope of that taper and its ends are domes, not caps. */
  /* ★ WAVE 5 — THE LIMB BELONGS TO A FAMILY. `cannon` is how thin the lower
     limb gets (1 = an antelope's pencil cannon bone, 0 = a bear's column);
     `crouch` is how much the limb zig-zags (a cat and a bear stand folded, a
     horse stands nearly straight). Between them they are the difference
     between a deer leg and a cat leg, which is what Nick's audit kept
     naming. */
  const cannon = FAM0.cannon, crouch = FAM0.crouch;
  const foot = spec.foot ?? FAM0.foot;
  const legTube = (u: number, xoff: number, hind: boolean): Tube => {
    const a = AX(u);
    const rootX = a[0] + xoff, rootY = a[1] - RAD(u) * 0.22;
    /* a crouched limb folds high and hard; a columnar one drops straight */
    const kneeY = rootY + (groundY - rootY) * (0.62 - crouch * 0.16);
    const kneeX = rootX + (hind ? -legW * (0.30 + crouch * 0.75) : legW * (0.20 + crouch * 0.45));
    const footX = rootX + (hind ? legW * (0.16 + crouch * 0.34) : -legW * 0.10);
    const spine = pathThrough([
      [rootX, rootY],
      [rootX + (kneeX - rootX) * 0.42, rootY + (kneeY - rootY) * 0.44],
      [kneeX, kneeY],
      [kneeX + (footX - kneeX) * 0.58, kneeY + (groundY - kneeY) * (0.52 + crouch * 0.12)],
      [footX, groundY - legW * 0.24],
    ]);
    /* the widths the family actually has, interpolated between a columnar
       plantigrade limb and a cursorial hoofed one */
    const lerp = (a2: number, b2: number): number => a2 + (b2 - a2) * cannon;
    const wJoint = lerp(1.02, 0.72), wCannon = lerp(0.94, 0.44), wAnkle = lerp(0.88, 0.40);
    const wprof = (t: number): number => legW * (
      t < 0.32 ? 1.62 - t * (1.62 - 1.14) / 0.32                       /* the thigh */
        : t < 0.58 ? 1.14 + ((t - 0.32) / 0.26) * (wJoint - 1.14)      /* into the joint */
          : t < 0.86 ? wJoint + ((t - 0.58) / 0.28) * (wCannon - wJoint)
            : wAnkle);
    return new Tube({ P: spine, R: wprof });
  };
  /** ★ THE FOOT IS THE FAMILY'S SIGNATURE ON THE GROUND, and every mammal in
      the catalogue was standing on the same small oval. A hoof is a hard
      block, a paw is a padded fan of toes, a bear plants its whole sole, a
      camel and an elephant spread a soft round pad. */
  const drawFoot = (x: number, m: number, hind: boolean): void => {
    const dark = (k: number): string => `rgb(${p.cr * k * m | 0},${p.cg * k * m | 0},${p.cb * k * m | 0})`;
    const gy = groundY;
    if (foot === 'hoof') {
      c.fillStyle = `rgb(${44 * m | 0},${38 * m | 0},${34 * m | 0})`;
      c.beginPath();
      c.moveTo(x - legW * 0.34, gy - legW * 0.52);
      c.lineTo(x + legW * 0.34, gy - legW * 0.52);
      c.quadraticCurveTo(x + legW * 0.42, gy, x + legW * 0.30, gy);
      c.lineTo(x - legW * 0.30, gy);
      c.quadraticCurveTo(x - legW * 0.42, gy, x - legW * 0.34, gy - legW * 0.52);
      c.closePath(); c.fill();
    } else if (foot === 'cloven') {
      c.fillStyle = `rgb(${40 * m | 0},${34 * m | 0},${30 * m | 0})`;
      for (const s of [-1, 1] as const) {
        c.beginPath();
        c.ellipse(x + s * legW * 0.20, gy - legW * 0.16, legW * 0.22, legW * 0.34, s * 0.10, 0, TAU);
        c.fill();
      }
    } else if (foot === 'paw') {
      /* the pad, then three toes across its front — a cat and a dog both put
         a rounded fan on the ground, never a peg */
      c.fillStyle = dark(0.52);
      c.beginPath(); c.ellipse(x, gy - legW * 0.20, legW * 0.66, legW * 0.40, 0, 0, TAU); c.fill();
      c.fillStyle = dark(0.62);
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.ellipse(x + i * legW * 0.34, gy - legW * 0.08, legW * 0.20, legW * 0.17, 0, 0, TAU); c.fill();
      }
    } else if (foot === 'plantigrade') {
      /* a bear puts its heel down: a long sole with claws at the front */
      c.fillStyle = dark(0.48);
      c.beginPath();
      c.ellipse(x + legW * 0.24, gy - legW * 0.22, legW * (hind ? 1.05 : 0.86), legW * 0.40, 0, 0, TAU);
      c.fill();
      c.fillStyle = `rgba(238,232,216,${0.72 * m})`;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.ellipse(x + legW * (0.62 + i * 0.16), gy - legW * 0.44, legW * 0.07, legW * 0.13, 0.5, 0, TAU);
        c.fill();
      }
    } else if (foot === 'claw') {
      /* an anteater or an armadillo walks on its KNUCKLES to keep the claws
         off the ground, and those claws are longer than the whole foot */
      c.fillStyle = dark(0.48);
      c.beginPath(); c.ellipse(x, gy - legW * 0.26, legW * 0.54, legW * 0.36, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(232,226,208,0.9)';
      for (let i = 0; i < 3; i++) {
        const u2 = i / 2;
        c.beginPath();
        c.moveTo(x + legW * (0.10 + u2 * 0.22), gy - legW * 0.46);
        c.quadraticCurveTo(x + legW * (0.72 + u2 * 0.26), gy - legW * 0.34, x + legW * (0.60 + u2 * 0.24), gy - legW * 0.02);
        c.quadraticCurveTo(x + legW * (0.44 + u2 * 0.18), gy - legW * 0.24, x + legW * (0.06 + u2 * 0.20), gy - legW * 0.34);
        c.closePath(); c.fill();
      }
    } else if (foot === 'flipper') {
      /* ★ A SEAL HAS NO FOOT. Nick's strict audit had the Walrus as approved and
         the mammal audit called the current one "a tusked dachshund" — because
         the quadruped painter gave it four standing legs. A pinniped rests its
         bulk on the ground and pushes with a broad flipper swept BACK. */
      c.save(); c.translate(x, gy - legW * 0.30); c.rotate(hind ? 0.55 : 0.30);
      const fg = c.createLinearGradient(0, -legW, 0, legW);
      fg.addColorStop(0, dark(0.86)); fg.addColorStop(1, dark(0.40));
      c.fillStyle = fg;
      c.beginPath(); c.ellipse(legW * 0.55, 0, legW * 1.45, legW * 0.52, 0, 0, TAU); c.fill();
      c.strokeStyle = `rgba(0,0,0,${0.30 * m})`; c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const u2 = i / 3;
        c.beginPath();
        c.moveTo(legW * 0.35, -legW * 0.30 + u2 * legW * 0.60);
        c.lineTo(legW * 1.85, -legW * 0.22 + u2 * legW * 0.46);
        c.stroke();
      }
      c.restore();
    } else {   /* 'pad' — camel, elephant: a broad soft disc that spreads */
      c.fillStyle = dark(0.50);
      c.beginPath(); c.ellipse(x, gy - legW * 0.16, legW * 0.92, legW * 0.36, 0, 0, TAU); c.fill();
      c.fillStyle = `rgba(226,218,200,${0.42 * m})`;
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.ellipse(x + i * legW * 0.42, gy - legW * 0.26, legW * 0.14, legW * 0.10, 0, 0, TAU); c.fill();
      }
    }
  };
  const drawLeg = (u: number, xoff: number, hind: boolean, far: boolean): void => {
    const limb = legTube(u, xoff, hind);
    const m = far ? 0.58 : 1;
    /* ⚠ WAVE 5 — THE ROUNDNESS GRADIENT WAS ANCHORED TO THE CANVAS, not to the
       limb: one horizontal linear gradient spanning the foot's x. As soon as
       families gave cats and bears a CROUCHED leg, the thigh sat well to one
       side of the shin, so the two halves sampled different parts of that
       gradient and every bent leg grew a hard tonal step at the knee. A limb
       is a tube like any other — shade it with the tube's own machinery, which
       follows wherever it bends. (Same lesson as D-ART-91: a tone has to be
       computed in the geometry it belongs to.) */
    const lp: typeof p = m < 1
      ? { ...p, cr: p.cr * m, cg: p.cg * m, cb: p.cb * m }
      : p;
    c.fillStyle = `rgb(${lp.cr | 0},${lp.cg | 0},${lp.cb | 0})`;
    c.beginPath(); limb.trace(c, 40); c.fill();
    c.save(); c.beginPath(); limb.trace(c, 40); c.clip();
    countershade(c, limb, lp, 0.85);
    c.restore();
    /* ⚠ AN ATTEMPT TO BLEND THE NEAR LEG BY REPAINTING ITS ROOT IN FLANK COLOUR
       PUT A PALE OVAL ON EVERY ANIMAL'S SHOULDER AND HAUNCH. It could not
       match: the flank it was blending into is countershaded and coated, and a
       flat swatch of "roughly that colour" over the top of it is a patch, not a
       blend. The join needs no blending at all once you look at a real animal
       from the side — the near leg's thigh is INSIDE the body outline and you
       see it from the stifle down. So all four legs are drawn BEHIND the torso
       and the body's own mass covers every root. Nothing to seam. */
    const ft = limb.axis(0.985);
    drawFoot(ft[0], m, hind);
  };
  /* ★ LIMB PAIRS. The genome's locomotion genes have described many-legged
     creatures since v1.0 and the art has only ever drawn four legs. Pairs are
     spaced along the torso so a six- or eight-legged animal still reads as
     one body, not a train of hips — and they sit under the HAUNCH and the
     SHOULDER, the two places the radius profile puts the mass. */
  const pairs = spec.alien?.legPairs ?? 2;
  const legUs: number[] = [];
  for (let i = 0; i < pairs; i++) legUs.push(0.175 + (i / Math.max(1, pairs - 1)) * 0.665);
  for (const u of legUs) drawLeg(u, -legW * 0.66, u < 0.5, true);      /* far side, shaded */
  for (const u of legUs) drawLeg(u, legW * 0.34, u < 0.5, false);      /* near side */

  const coat = spec.coat ?? 'plain';
  /* ═══ the neck is computed AND DRAWN BEFORE THE TORSO (wave 6) ═══
     It used to be drawn over the body, so its outline crossed the shoulder
     and its own countershading disagreed with the body's along that line —
     a wedge stuck onto the chest, which is exactly the defect the legs had
     before wave 4. Same answer, and it needs no blending: on a real animal
     the base of the neck IS inside the body, so root it in the chest and
     let the torso's own mass cover the join (D-ART-94). */
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
  /* ★ WAVE 4 — THE NECK IS A TAPERED SOLID. Nick: "thin necks at the shoulder
     on the big cats." It was one constant-width round-capped stroke, so a
     lion's neck was the same thickness at the skull as at the chest, and the
     round cap left a visible bead where it entered the body — the same
     "hooked in" line as the legs, in a second place. A real neck is a cone:
     WIDE where it leaves the shoulders, narrowing into the skull. Built from
     the same Tube, rooted INSIDE the chest, so there is no join at all. */
  const nRootU = 0.86;
  const nRoot = AX(nRootU);
  const nq = (t: number): [number, number] => {
    const m = 1 - t;
    const ax = shoulderX - bodyW * 0.1, ay = shoulderY + bodyH * 0.2;
    return [m * m * ax + 2 * m * t * (shoulderX + neckLen * 0.30) + t * t * headX,
      m * m * ay + 2 * m * t * (shoulderY - neckLen * 0.45) + t * t * headY];
  };
  const neckPts: Array<[number, number]> = [[nRoot[0] - RAD(nRootU) * 0.20, nRoot[1]],
    nq(0.25), nq(0.55), nq(0.82), [headX, headY + headR * 0.10]];
  /* a short-necked animal has a THICK neck and a long-necked one a slender
     one — the same ratio a real skeleton shows, driven by this species' own
     neck length rather than a category */
  const nThick = neckLen > S * 0.16 ? 0.62 : 0.92;
  const neckTube = new Tube({
    P: pathThrough(neckPts),
    R: (t: number) => {
      const s = t * t * (3 - 2 * t);
      return RAD(nRootU) * 0.98 * nThick * (1 - s) + headR * 0.52 * s;
    },
  });
  c.fillStyle = p.base;
  c.beginPath(); neckTube.trace(c, 44); c.fill();
  c.save(); c.beginPath(); neckTube.trace(c, 44); c.clip();
  if (!spec.alien?.skin) countershade(c, neckTube, p, 0.9);
  /* the coat CONTINUES onto the neck — a giraffe's patches run up it, a
     tiger's bars cross it. A pattern that stops at the shoulder is a shirt. */
  if (coat === 'patches') coatPatches(c, neckTube, r, p, { nu: 7, nphi: 4, seam: 0.78, rgb: [126, 74, 26] });
  else if (coat === 'stripes') coatBars(c, neckTube, r, p, { count: 7, width: 0.9, phiEnd: -0.9, forkRate: 0.1 });
  else if (coat === 'bands') coatBars(c, neckTube, r, p, { count: 9, width: 1.1, phiEnd: -1.4, lean: 0.02, forkRate: 0, hard: true, rgb: [18, 15, 16] });
  else if (coat === 'spots') coatSpots(c, neckTube, r, p, { count: 34, size: 0.8, soft: 0.13, rgb: [24, 17, 10] });
  else if (coat === 'rosettes') coatRosettes(c, neckTube, r, p, { count: 12, size: 0.8 });
  else if (coat === 'shaggy') coatShaggy(c, neckTube, r, p, { count: 46 });
  c.restore();
  if (coat === 'shaggy') shaggyRim(c, neckTube, r, p, Math.max(5, bodyH * 0.15), 0.45);
  /* ---- the torso: a SOLID whose radius profile is the species ---- */
  c.fillStyle = p.base;
  c.beginPath(); body.trace(c); c.fill();

  /* ---- the skin, inside the body's own surface ---- */
  c.save();
  c.beginPath(); body.trace(c); c.clip();
  /* the torso as a FORM as well, for the alien traits that still take one */
  const torsoForm: Form = { cx, cy, rx: bodyW, ry: bodyH * 1.15 };
  /* ★ COUNTERSHADING FIRST. Dark along the spine, pale under the belly. It is
     the shading a round body actually produces, every real mammal wears it,
     and not one of ours had it — which is most of why they read as cut-outs
     with a gradient rather than as solids. */
  if (!spec.alien?.skin) countershade(c, body, p, 1);
  if (coat === 'spots') {
    coatSpots(c, body, r, p, { count: 150, size: 0.92, soft: 0.13, rgb: [24, 17, 10] });
  } else if (coat === 'fawn') {
    coatSpots(c, body, r, p, { count: 60, size: 0.8, soft: 0.4, rgb: [246, 242, 228], phiLo: -0.4, phiHi: 1.3 });
  } else if (coat === 'rosettes') {
    coatRosettes(c, body, r, p, { count: 38, core: name === 'Jaguar' });
  } else if (coat === 'stripes') {
    /* ★ THE TIGER. Fifteen "stripes" were fifteen COLUMNS OF FIVE SOFT DOTS,
       and that is exactly what they looked like at full size — a polka grid.
       A bar is now one continuous tapered band from over the spine down the
       flank, leaning back, dying to a point above the belly, and some of them
       fork, because real ones do. */
    coatBars(c, body, r, p, { count: 19, width: 1, phiEnd: -0.78, forkRate: 0.3 });
  } else if (coat === 'bands') {
    /* the zebra: full contrast, and the bands CROSS the belly rather than
       stopping at it, which is the difference between a zebra and a tiger */
    coatBars(c, body, r, p, { count: 21, width: 1.25, phiTop: 1.66, phiEnd: -1.42, lean: 0.03, forkRate: 0.12, hard: true, rgb: [18, 15, 16] });
  } else if (coat === 'blotches') {
    /* ⚠ WAVE 6 — A COAT NAME WHOSE MEANING CHANGED UNDER ITS USERS. 'patches'
       used to mean soft irregular blotches, so a wild dog, a Friesian cow and
       a colugo all used it quite reasonably. Wave 4 redefined it as the
       GIRAFFE's reticulated tiling — and the visual audit came straight back
       with 'the African Wild Dog reads as a young giraffe', which it did.
       Redefining a shared enum value silently re-skins every existing user:
       the giraffe keeps 'patches', the blotched animals get their own name. */
    coatBlotches(c, body, r, p, { count: 22, rgb: [46, 30, 16] });
  } else if (coat === 'patches') {
    /* ★ THE GIRAFFE. Its patches are a TILING with pale seams between them,
       not a scatter of blobs — so they are Voronoi cells in skin space,
       shrunk to open the seam, and filled HARD. The crisp border is the
       animal; softening it was never blending, it was losing the feature. */
    coatPatches(c, body, r, p, { nu: 10, nphi: 6, seam: 0.80, rgb: [126, 74, 26] });
  } else if (coat === 'panda') {
    coatBlocks(c, body, p, [
      { u0: 0.72, u1: 1.0, phiLo: -1.5, phiHi: 1.6, rgb: '#15181e' },
      { u0: 0.0, u1: 0.22, phiLo: -1.5, phiHi: 1.6, rgb: '#15181e' },
    ]);
  } else if (coat === 'brindle') {
    coatBrindle(c, body, r, p, { count: 120 });
  } else if (coat === 'shaggy') {
    coatShaggy(c, body, r, p, { count: 170 });
  } else if (coat === 'banded' && !spec.alien?.skin) {
    coatBars(c, body, r, p, { count: 7, width: 2.2, phiTop: 1.6, phiEnd: -1.2, lean: 0.01, forkRate: 0, hard: true, alpha: 0.55, rgb: [26, 20, 14] });
  }
  /* an alien SKIN FINISH replaces the coat treatment, inside the same clip
     so it reads as the animal's own surface and obeys the surface laws */
  if (spec.alien?.skin) alienSkin(c, spec.alien.skin, torsoForm, p, r);
  /* ★ THE OCCLUSION AT THE LIMB EXITS — the shadow a body casts into its own
     armpit and groin. Drawn inside the clip so it darkens the BODY where each
     leg passes under it, which is the other half of the join reading as one
     piece of anatomy rather than two shapes touching. */
  if (!spec.alien?.skin) {
    for (const u of legUs) {
      const a = AX(u), rr = RAD(u);
      const og = c.createRadialGradient(a[0], a[1] + rr * 0.66, rr * 0.08, a[0], a[1] + rr * 0.66, rr * 0.95);
      og.addColorStop(0, 'rgba(12,9,10,0.40)');
      og.addColorStop(0.55, 'rgba(12,9,10,0.20)');
      og.addColorStop(1, 'rgba(12,9,10,0)');
      c.fillStyle = og;
      c.beginPath(); c.ellipse(a[0], a[1] + rr * 0.66, rr * 0.95, rr * 0.72, 0, 0, TAU); c.fill();
    }
  }
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
    shaggyRim(c, body, r, p, Math.max(7, bodyH * 0.20), 0.6);
  }
  /* the rim light along the true dorsal envelope, fading at both ends — a
     flat stroke along a level back read as a hard table edge (review catch) */
  c.save();
  const rimG = c.createLinearGradient(cx - bodyW, 0, cx + bodyW, 0);
  rimG.addColorStop(0, 'rgba(220,232,250,0)');
  rimG.addColorStop(0.25, 'rgba(220,232,250,0.30)');
  rimG.addColorStop(0.7, 'rgba(232,242,255,0.40)');
  rimG.addColorStop(1, 'rgba(220,232,250,0)');
  c.strokeStyle = rimG; c.lineWidth = 2.2; c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i <= 40; i++) {
    const e = body.envelope(0.03 + (i / 40) * 0.9, 1);
    if (i === 0) c.moveTo(e[0], e[1]); else c.lineTo(e[0], e[1]);
  }
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
  /* ═══════ WAVE 6 — THE SKULL AS A SOLID (see SKULL above) ═══════ */
  const mz = spec.muzzle ?? 0.5;
  const SK = SKULL[spec.family ?? 'generic']!;
  /* the species still sets the proportions of its family's skull: a warthog
     and a boar are both suid wedges, at different lengths and heft */
  const heft = spec.jaw === 'barrel' ? 1.42 : spec.jaw === 'broad' ? 1.16 : spec.jaw === 'fine' ? 0.86 : 1;
  /* ★ AND THE SAFETY NET IMMEDIATELY EARNED ITS KEEP. Wave 6's first build gave
     every felid one skull, every bovid one skull, and artlock's [SAME] ratchet
     failed the commit: 4,322 → 4,350 look-alike pairs. It was right. A family
     may set the KIND of skull; it must not hand out the same face, and several
     cats share the same `muzzle` and `jaw` values so nothing else separated
     them. The species' own name varies its real dimensions here, the same
     device legLen and the body radius already use for exactly this reason
     (D-ART-20) — so two specs that happen to match still cannot render the
     same head. (Better still would be driving this from the reference row's
     `headFrac`, which is measured per species; that is the next improvement.) */
  const skLen = headR * SK.len * (0.84 + mz * 0.34) * nvq(0x5C, 0.085);
  const skMuz = headR * SK.muzzle * (0.72 + mz * 0.56) * heft * nvq(0x71, 0.10);
  const skCran = headR * SK.cranium * (spec.jaw === 'barrel' ? 1.12 : 1) * nvq(0x93, 0.06);
  const ang = SK.tilt + (spec.neck > 0.16 ? 0.10 : 0) + (nvq(0xA7, 1) - 1) * 0.05;
  const occ: [number, number] = [headX - Math.cos(ang) * skLen * 0.42, headY - Math.sin(ang) * skLen * 0.42 - headR * 0.06];
  const headAxis = (t: number): [number, number] =>
    [occ[0] + Math.cos(ang) * skLen * t, occ[1] + Math.sin(ang) * skLen * t];
  /* the radius profile IS the profile of the face: braincase, the stop, the
     muzzle, and the nose. A cat dips hard behind a short blunt muzzle; a horse
     barely dips at all and runs long and even to the nostril. */
  const headProf = spline([
    [0.00, skCran * 0.52],
    [0.16, skCran],
    [0.36, skCran * (1 - SK.stop * 0.46)],
    [0.62, skMuz * 1.18],
    [0.86, skMuz],
    [1.00, skMuz * 0.74],
  ]);
  const head = new Tube({ P: headAxis, R: headProf });
  /* THE MANDIBLE, drawn first so the skull overlaps it and the jaw line is a
     shadowed edge under the cheek rather than an outline drawn on it */
  if (SK.jaw > 0.05) {
    const jd = headR * SK.jaw * heft;
    const jaw = new Tube({
      P: (t: number) => {
        const a2 = headAxis(0.26 + t * 0.72);
        return [a2[0], a2[1] + jd * (0.62 + 0.24 * t)];
      },
      R: (t: number) => jd * (0.42 + Math.sin(Math.min(1, 0.2 + t) * Math.PI) * 0.52),
    });
    c.fillStyle = `rgb(${p.cr * 0.66 | 0},${p.cg * 0.66 | 0},${p.cb * 0.66 | 0})`;
    c.beginPath(); jaw.trace(c, 30); c.fill();
  }
  c.fillStyle = p.base;
  c.beginPath(); head.trace(c, 52); c.fill();
  c.save(); c.beginPath(); head.trace(c, 52); c.clip();
  if (!spec.alien?.skin) countershade(c, head, p, 0.92);
  /* the coat runs onto the face — a tiger is striped across the cheek, a
     giraffe patched over the crown. A pattern that stops at the ears is a hood. */
  if (coat === 'patches') coatPatches(c, head, r, p, { nu: 4, nphi: 3, seam: 0.76, rgb: [126, 74, 26] });
  else if (coat === 'stripes') coatBars(c, head, r, p, { count: 6, width: 0.75, phiEnd: -0.8, forkRate: 0 });
  else if (coat === 'spots') coatSpots(c, head, r, p, { count: 22, size: 0.62, soft: 0.16, rgb: [24, 17, 10] });
  else if (coat === 'rosettes') coatRosettes(c, head, r, p, { count: 7, size: 0.6 });
  else if (coat === 'shaggy') coatShaggy(c, head, r, p, { count: 34 });
  c.restore();
  /* the nose, ON the end of the muzzle rather than beside it */
  const nosePt = head.pt(0.965, -0.10);
  if (SK.nose === 'disc') {
    /* a pig's rostral disc: a flat plate seen almost edge-on, with two pits */
    c.fillStyle = `rgb(${Math.min(255, p.cr * 1.12) | 0},${p.cg * 0.86 | 0},${p.cb * 0.88 | 0})`;
    c.save(); c.translate(nosePt[0], nosePt[1]); c.rotate(ang);
    c.beginPath(); c.ellipse(0, 0, skMuz * 0.42, skMuz * 0.92, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(28,18,20,0.62)';
    for (const s2 of [-1, 1] as const) { c.beginPath(); c.ellipse(skMuz * 0.10, s2 * skMuz * 0.34, skMuz * 0.13, skMuz * 0.19, 0, 0, TAU); c.fill(); }
    c.restore();
  } else if (SK.nose === 'nostril') {
    /* a grazer has no black button — just a soft nostril slit in coat colour */
    c.strokeStyle = 'rgba(26,18,20,0.55)'; c.lineWidth = Math.max(1.6, skMuz * 0.16); c.lineCap = 'round';
    c.beginPath();
    c.moveTo(nosePt[0] - skMuz * 0.30, nosePt[1] - skMuz * 0.12);
    c.quadraticCurveTo(nosePt[0] - skMuz * 0.02, nosePt[1] - skMuz * 0.30, nosePt[0] + skMuz * 0.14, nosePt[1] - skMuz * 0.04);
    c.stroke();
  } else {
    c.fillStyle = 'rgba(20,14,16,0.82)';
    c.beginPath(); c.ellipse(nosePt[0], nosePt[1] - skMuz * 0.12, skMuz * 0.40, skMuz * 0.32, ang, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.20)';
    c.beginPath(); c.ellipse(nosePt[0] - skMuz * 0.12, nosePt[1] - skMuz * 0.26, skMuz * 0.15, skMuz * 0.10, ang, 0, TAU); c.fill();
  }
  /* the mouth line, following the jaw rather than ruled across the face */
  c.strokeStyle = 'rgba(18,12,12,0.34)';
  c.lineWidth = Math.max(1.4, headR * (spec.jaw === 'barrel' ? 0.13 : 0.06));
  c.beginPath();
  const m0 = head.pt(0.44, -0.92), m1 = head.pt(0.72, -1.0), m2 = head.pt(0.94, -0.62);
  c.moveTo(m0[0], m0[1]); c.quadraticCurveTo(m1[0], m1[1], m2[0], m2[1]); c.stroke();

  /* ---- ears: family-defining (fennec vs hippo vs koala) ---- */
  const ears = spec.ears ?? 'small';
  /* ⚠ WAVE 4 — 'round' EARS WERE 0.62·headR AND SAT ON THE CROWN, so two dark
     discs wider than the skull merged into a fluffy cloud on the top of every
     cat and bear in the catalogue. A round ear is a small cup set at the
     TOP-BACK of the head; the ear is the read on a fennec, never on a tiger. */
  const earR = headR * (ears === 'huge' ? 1.15 : ears === 'large' ? 0.62 : ears === 'round' ? 0.38 : ears === 'small' ? 0.30 : 0.17) * (spec.earScale ?? 1);
  if (ears === 'fan') {
    /* ★ ARC STAGE 3 — AN ELEPHANT'S EAR IS NOT A RABBIT'S. Routed as 'huge' it
       got two upright ellipses standing off the crown, which is the single most
       wrong thing on the animal. An elephant ear is a broad FAN hanging down
       the side of the head, its top edge folded over, its lower edge ragged,
       reaching well below the jaw. Drawn behind the head so the head overlaps
       its root and it belongs to the skull. */
    /* ⚠ TWO BUGS HERE AT ONCE. (1) earScale was never applied to a fan, so the
       African elephant's 1.30 and the Asian's 0.80 did nothing and the two
       species wore the same ear — which is one of only two features that tell
       them apart. (2) The fan was 1.55·headR wide centred barely behind the
       skull, so it covered the entire face; the comment above claims the head
       overlaps its root, and it never did. Smaller, and set BACK. */
    const es = spec.earScale ?? 1;
    const fw = headR * 1.16 * es, fh = headR * 1.72 * es;
    const fx = headX - headR * 1.02, fy = headY + headR * 0.24;
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
  } else {
    /* the pair sits at the TOP-BACK of the skull and the far one is set
       further back and darker, so the head reads as a solid with two ears on
       it rather than a disc wearing a hat */
    for (const s of [-1, 1] as const) {
      const ex = headX - headR * (s < 0 ? 0.62 : 0.40), ey = headY - headR * (0.56 + (ears === 'huge' ? 0.18 : 0));
      const m = s < 0 ? 0.62 : 1;
      c.fillStyle = `rgb(${p.cr * 0.52 * m | 0},${p.cg * 0.52 * m | 0},${p.cb * 0.54 * m | 0})`;
      if (ears === 'huge' || ears === 'large') {
        c.save(); c.translate(ex, ey); c.rotate(s * 0.30 - 0.12);
        c.beginPath(); c.ellipse(0, -earR * 0.52, earR * 0.50, earR, 0, 0, TAU); c.fill();
        c.fillStyle = `rgba(${Math.min(255, p.cr * 1.05) | 0},${Math.min(255, p.cg * 0.86) | 0},${Math.min(255, p.cb * 0.84) | 0},${0.5 * m})`;
        c.beginPath(); c.ellipse(0, -earR * 0.5, earR * 0.28, earR * 0.68, 0, 0, TAU); c.fill();
        c.restore();
      } else {
        /* a cup, not a disc: the pinna with a paler inner bowl */
        c.beginPath(); c.ellipse(ex, ey, earR * 0.92, earR, -s * 0.2, 0, TAU); c.fill();
        c.fillStyle = `rgba(${Math.min(255, p.cr * 1.02) | 0},${Math.min(255, p.cg * 0.84) | 0},${Math.min(255, p.cb * 0.82) | 0},${0.45 * m})`;
        c.beginPath(); c.ellipse(ex, ey + earR * 0.08, earR * 0.52, earR * 0.60, -s * 0.2, 0, TAU); c.fill();
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
    /* ★ WAVE 6 — THE EYE SITS ON THE SKULL, AT ITS FAMILY'S OWN PLACE. It used
       to be pinned to the middle of the head ellipse for every animal alive,
       which is most of why Nick said the heads all looked the same. A
       predator's eyes face forward around the middle of the face; a grazer's
       are high, wide and set well back — that placement alone is the
       difference between something that hunts and something that is hunted.
       Placed through the skull's own surface, so it foreshortens with it. */
    const eyeAt = head.pt(SK.eyeU * nvq(0xC3, 0.07), -0.35 + SK.eyePhi * 1.62 * nvq(0xD1, 0.05));
    const ex = eyeAt[0], ey = eyeAt[1], er = headR * SK.eyeR;
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
    /* ⚠ the trunk stopped at knee height. "A long muscular trunk REACHING THE
       GROUND" is the first mustRead on every elephant row, and a trunk that
       stops in mid-air is the one thing everybody notices. It now runs to the
       ground line and curls, and it tapers, because a trunk is a cone. */
    const tRoot: [number, number] = [headX + headR * 0.70, headY + headR * 0.18];
    const tEnd: [number, number] = [headX + headR * 0.95, groundY - headR * 0.12];
    const trunkT = new Tube({
      P: pathThrough([tRoot,
        [headX + headR * 1.55, headY + (tEnd[1] - headY) * 0.34],
        [headX + headR * 1.42, headY + (tEnd[1] - headY) * 0.70],
        tEnd,
        [headX + headR * 1.75, groundY - headR * 0.02]]),
      R: (t2: number) => headR * (0.30 - t2 * 0.16),
    });
    c.fillStyle = p.base;
    c.beginPath(); trunkT.trace(c, 36); c.fill();
    c.save(); c.beginPath(); trunkT.trace(c, 36); c.clip();
    countershade(c, trunkT, p, 0.9);
    c.restore();
    c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = headR * 0.12;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6, tx = headX + headR * (0.75 + 1.0 * t), ty = headY + headR * (0.2 + 1.7 * t);
      c.beginPath(); c.moveTo(tx - headR * 0.2, ty); c.lineTo(tx + headR * 0.2, ty); c.stroke();
    }
  }

  /* ---- tail ---- */
  const tail = spec.tail ?? 'stub';
  /* ⚠ THE TAIL WAS STILL ANCHORED TO THE PRE-WAVE-7 BODY. It started at a
     hand-written offset from cx/cy, but wave 7 moved the rear of the torso to
     the envelope of the tube and moved the axis off cy entirely — so a thick
     round-capped tail now began OUTSIDE the rump and its blunt start showed as
     the hard-edged block the mammal audit reported on species after species.
     Anchored to the solid it grows from, it starts inside the body. */
  const tAnchor = AX(0.035);
  const tx0 = tAnchor[0] - RAD(0.035) * 0.35, ty0 = tAnchor[1] - RAD(0.035) * 0.30;
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
  'Lion': { legs: 0.1236, depth: 0.1426, len: 0.2455, neck: 0.06, muzzle: 0.34, jaw: 'broad', ears: 'round', tail: 'tuft', mane: 'lion', hue: '#c19a5b', family: 'felid' },
  'Jaguar': { legs: 0.114, depth: 0.1395, len: 0.2287, neck: 0.07, muzzle: 0.35, jaw: 'broad', ears: 'round', tail: 'long', coat: 'rosettes' , hue: "#c8983c", family: 'felid' },
  'Leopard': { legs: 0.1253, depth: 0.1268, len: 0.2287, neck: 0.07, muzzle: 0.32, ears: 'round', tail: 'long', coat: 'rosettes' , hue: "#d3ab5e", family: 'felid' },
  'Snow Leopard': { legs: 0.1221, depth: 0.133, len: 0.2399, neck: 0.07, muzzle: 0.30, ears: 'round', tail: 'plume', coat: 'rosettes', hue: '#cfd4dc', family: 'felid' },
  'Cheetah': { legs: 0.1938, depth: 0.1205, len: 0.1976, neck: 0.09, muzzle: 0.28, ears: 'round', tail: 'long', coat: 'spots', face: 'tears', hue: '#d8b477', family: 'felid' },
  'Cougar': { legs: 0.1482, depth: 0.1268, len: 0.2287, neck: 0.08, muzzle: 0.30, ears: 'round', tail: 'long' , hue: "#b08655", family: 'felid' },
  'Lynx': { legs: 0.1495, depth: 0.1226, len: 0.186, neck: 0.06, muzzle: 0.26, ears: 'large', tail: 'stub', coat: 'spots' , hue: "#b9a184", family: 'felid' },
  /* the pixel-siblings, separated */
  'Rhinoceros': { legs: 0.0835, depth: 0.1886, len: 0.263, neck: 0.045, muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'twinnose', hue: '#8b8b8e', family: 'pachyderm' },
  'Wild Sheep': { legs: 0.1345, depth: 0.1529, len: 0.1881, neck: 0.075, muzzle: 0.35, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#9d8a6e', family: 'bovid' },
  'Hippopotamus': { legs: 0.0486, depth: 0.1789, len: 0.3227, neck: 0.03, muzzle: 0.62, jaw: 'barrel', ears: 'tiny', tail: 'stub', hue: '#8a6f74', family: 'pachyderm' },
  /* the humped and the long-necked */
  'Camel': { legs: 0.1846, depth: 0.1629, len: 0.1804, neck: 0.20, back: 'level', muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#c8a173', family: 'camelid' },
  'Bactrian Camel': { legs: 0.176, depth: 0.1667, len: 0.1914, neck: 0.19, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 2, hue: '#b08a5e', family: 'camelid' },
  'Dromedary Camel': { legs: 0.1935, depth: 0.159, len: 0.176, neck: 0.20, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#cba777', family: 'camelid' },
  'Giraffe': { legs: 0.2438, depth: 0.1573, len: 0.1652, neck: 0.34, back: 'sloped', muzzle: 0.40, ears: 'large', tail: 'tuft', coat: 'patches', horn: 'ossicone', hue: '#e0c07a' , family: 'cervid' },
  'Llama': { legs: 0.1938, depth: 0.1434, len: 0.1506, neck: 0.20, muzzle: 0.35, ears: 'large', tail: 'stub', hue: '#d8cbb4', family: 'camelid' },
  'Alpaca': { legs: 0.1594, depth: 0.1448, len: 0.152, neck: 0.18, muzzle: 0.30, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#ddd2bd', family: 'camelid' },
  /* antlered + horned */
  'Moose': { legs: 0.2181, depth: 0.1843, len: 0.2116, neck: 0.10, back: 'humped', muzzle: 0.62, jaw: 'broad', ears: 'large', tail: 'stub', horn: 'palmate', hue: '#5b4433', family: 'cervid' },
  'Elk': { legs: 0.2035, depth: 0.1594, len: 0.2092, neck: 0.13, back: 'sloped', muzzle: 0.48, ears: 'large', tail: 'stub', horn: 'branched', hue: '#9c7748', family: 'cervid' },
  'Deer': { legs: 0.1973, depth: 0.139, len: 0.1709, neck: 0.12, muzzle: 0.42, ears: 'large', tail: 'stub', horn: 'branched', coat: 'spots', hue: '#b98a58', family: 'cervid' },
  'Reindeer': { legs: 0.1782, depth: 0.1505, len: 0.1974, neck: 0.11, muzzle: 0.44, ears: 'small', tail: 'stub', horn: 'branched', hue: '#a8917a', family: 'cervid' },
  'Sheep': { legs: 0.1448, depth: 0.1548, len: 0.1777, neck: 0.08, muzzle: 0.36, ears: 'small', tail: 'stub', horn: 'curl', hue: '#a98f6d', family: 'bovid' },
  'Bison': { legs: 0.1211, depth: 0.1881, len: 0.2313, neck: 0.05, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'small', tail: 'tuft', coat: 'shaggy', hue: '#5c4535', family: 'bovid' },
  'Water Buffalo': { legs: 0.1249, depth: 0.1765, len: 0.246, neck: 0.06, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'curl', hue: '#4f4a48', family: 'bovid' },
  /* bears, differentiated */
  'Grizzly Bear': { legs: 0.0916, depth: 0.1717, len: 0.2534, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#7a5636', family: 'ursid' },
  'Brown Bear': { legs: 0.0963, depth: 0.1881, len: 0.2313, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#70502f', family: 'ursid' },
  'Polar Bear': { legs: 0.1112, depth: 0.1696, len: 0.2642, neck: 0.10, back: 'level', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#eef2f6', family: 'ursid' },
  'Black Bear': { legs: 0.101, depth: 0.1729, len: 0.2268, neck: 0.05, muzzle: 0.42, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#3b3a40', family: 'ursid' },
  'Panda': { legs: 0.0825, depth: 0.1844, len: 0.2269, neck: 0.04, back: 'arched', muzzle: 0.30, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'panda', face: 'mask', hue: '#f0f2f4', family: 'ursid' },
  'Sun Bear': { legs: 0.0939, depth: 0.1438, len: 0.2004, neck: 0.05, muzzle: 0.38, ears: 'round', tail: 'stub', hue: '#2f2b2c', family: 'ursid' },
  'Sloth Bear': { legs: 0.1001, depth: 0.1697, len: 0.2227, neck: 0.05, muzzle: 0.55, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#2b2726', family: 'ursid' },
  /* canids + small mammals where ears/tails are the read */
  'Red Fox': { legs: 0.1118, depth: 0.104, len: 0.1962, neck: 0.06, muzzle: 0.44, jaw: 'fine', ears: 'large', tail: 'plume', hue: '#d1651f', family: 'canid' },
  'Arctic Fox': { legs: 0.1046, depth: 0.1072, len: 0.1847, neck: 0.06, muzzle: 0.36, ears: 'small', tail: 'plume', hue: '#eaf0f5', family: 'canid' },
  /* ★ wave 21 — the audit: "ears should dominate the head; reduce body size and
     increase bushy tail". A fennec is a desert fox scaled DOWN around ears that
     were not scaled down with it. */
  'Fennec Fox': { legs: 0.0667, depth: 0.0799, len: 0.1048, neck: 0.03, muzzle: 0.30, ears: 'huge', tail: 'plume', hue: '#e6cfa4', earScale: 1.85, tailScale: 1.6, family: 'canid' },
  'Wolf': { legs: 0.155, depth: 0.1377, len: 0.2033, neck: 0.08, muzzle: 0.46, ears: 'large', tail: 'bushy', hue: '#7d7f86', family: 'canid' },
  'Hyena': { legs: 0.1442, depth: 0.1492, len: 0.208, neck: 0.08, back: 'sloped', muzzle: 0.42, jaw: 'broad', ears: 'large', tail: 'bushy', coat: 'spots', hue: '#a08a63', family: 'canid' },
  'Koala': { legs: 0.0551, depth: 0.1434, len: 0.1506, neck: 0.03, muzzle: 0.20, jaw: 'broad', ears: 'huge', tail: 'none', hue: '#a8adb4', family: 'marsupial' },
  /* ⚠ the pachyderms + Zebra/Tiger/Lion/Red Panda/Raccoon are DELIBERATELY
     ABSENT: the verbatim engine already nails them (Elephant 4.5/5; Nick's
     audit lists the others among its stronger reads). Never override what
     already excels — a generic system cannot beat bespoke work. */
  'Walrus': { legs: 0.0303, depth: 0.1631, len: 0.2943, neck: 0.04, muzzle: 0.50, jaw: 'barrel', ears: 'tiny', tail: 'none', horn: 'tuskdown', hue: '#a3705f', family: 'pinniped'  },
  /* equines + swine */
  'Horse': { legs: 0.1964, depth: 0.1524, len: 0.1999, neck: 0.14, muzzle: 0.50, ears: 'small', tail: 'plume', hue: '#8a5a35', family: 'equid' },
  'Wild Boar': { legs: 0.0955, depth: 0.1423, len: 0.2101, neck: 0.05, back: 'sloped', muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'tuskup', coat: 'shaggy', hue: '#5a4a3e', family: 'suid' },
  'Warthog': { legs: 0.1087, depth: 0.1405, len: 0.1958, neck: 0.05, back: 'sloped', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'tuskup', hue: '#6b5647', family: 'suid' },
  'Tapir': { legs: 0.1099, depth: 0.1542, len: 0.2276, neck: 0.05, muzzle: 0.48, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#4a4348', family: 'suid' },
};
