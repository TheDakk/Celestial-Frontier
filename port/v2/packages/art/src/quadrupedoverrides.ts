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
import { coatMaterial, type Material, countershade, coatSpots, coatRosettes, coatBars, coatPatches, coatBlotches, coatBrindle, coatShaggy, shaggyRim, coatBlocks } from './skin.js';

type G = Record<string, unknown>;
type Ctx = CanvasRenderingContext2D;
export interface Pal { base: string; cr: number; cg: number; cb: number; lit: string; dark: string }
const S = 440;
/** ★ how much fine material detail every mammal gets. 0 reproduces the old
    flat look exactly; 1 is the full coat. Portraits are generated at runtime
    and cached, there is an art-hold law about boot responsiveness and a
    standing phone-heat mandate, so this exists to be turned DOWN. */
const MAT_DETAIL = 1;

/** the families that have a body plan AND a skull in the tables below. Named
    once because `family` and `skull` are now two independent choices from the
    same set (wave 35). */
export type MammalFamily = 'felid' | 'canid' | 'ursid' | 'bovid' | 'cervid' | 'equid' | 'camelid'
  | 'suid' | 'mustelid' | 'rodent' | 'pachyderm' | 'generic'
  /* ★ wave 9: the families that had no plan at all and fell through to
     'generic' — 21 routed mammals, and they looked it. */
  | 'marsupial' | 'procyonid' | 'xenarthran' | 'pinniped' | 'burrower'
  /* ★ wave 35: the hyenas were canids, and three blockers said so. */
  | 'hyaenid';

export interface QuadSpec {
  legs: number;                 /* leg length as a fraction of S */
  depth: number;                /* body depth (belly) */
  len?: number;                 /* body length */
  neck: number;                 /* neck length */
  /* ★ wave 35 — 'roached': the rump stands HIGHER than the shoulder, over an
     arch that peaks behind the mid-back. It is the opposite of 'sloped' and
     three rows need it (Raccoon, Aardvark, Sloth); 'arched' peaks in the
     middle and could not say it. */
  back?: 'level' | 'humped' | 'sloped' | 'arched' | 'saddle' | 'roached';
  muzzle?: number;              /* snout projection */
  jaw?: 'fine' | 'broad' | 'barrel';
  ears?: 'tiny' | 'small' | 'round' | 'large' | 'huge' | 'fan';
  tail?: 'none' | 'stub' | 'tuft' | 'bushy' | 'long' | 'plume' | 'banded' | 'paddle' | 'flow';
  /** ★ POLISH — the dairy udder: a pink rounded bag between the hind legs (Cow) */
  udder?: boolean;
  /** ★ POLISH WAVE — small COAT ACCENTS that are whole identities: a pale rump
      patch (banteng), a dark lower-flank band (gazelle/springbok), vertical
      rump stripes (impala). One axis, several species. */
  accent?: 'rumpPatch' | 'flankBand' | 'rumpStripes' | 'chestBlaze';
  /** ★ GOLD AUDIT — the glider membrane: a loose furred sheet slung from
      foreleg to hindleg, sagging below the belly line (Sugar Glider, Colugo) */
  patagium?: boolean;
  /** ★ D-ART-134 — a pale tail TIP is a species mark (fox, wolf, wild dog),
      not a universal feature. It used to be stamped on every brush tail. */
  tailTip?: string;
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
  family?: MammalFamily;
  /* ★ wave 35 — THE SKULL IS NOT ALWAYS THE FAMILY'S. A family body plan is
     anatomy shared by every member (a xenarthran's claws, a suid's cloven
     foot), but a HEAD can diverge inside a family while the body does not.
     A sloth is a xenarthran with a short round face, and it was wearing the
     anteater's 3.10-length tube snout because they share a family; a tapir
     has a proboscis, and the suid skull hard-wires the flat cartilage DISC
     that is a pig's whole identity — the reference row warns against it by
     name. Neither could be reached from the table at all.
     Defaults to `family`, so every existing row is byte-unchanged. */
  skull?: MammalFamily;
  foot?: 'hoof' | 'cloven' | 'paw' | 'plantigrade' | 'pad' | 'claw' | 'flipper';
  horn?: 'nose' | 'twinnose' | 'ossicone' | 'palmate' | 'branched' | 'tuskup' | 'tuskdown' | 'curl'
    | 'straight' | 'spiral' | 'lyre' | 'prong' | 'shorthorn'
    /* ★ wave 38 G2 — the bovine horn: out from a fused forehead boss, then up.
       'curl' was covering caprids AND bovines and could be neither. */
    | 'boss'
    /* wave 38 G10 — the water buffalo's backswept crescent, no boss */
    | 'sweep';   /* wave 10: the bovid horn is the species */
  humps?: 1 | 2;
  /* ★ wave 35 — a trunk has a LENGTH. `true` is an elephant's, reaching the
     ground; a fraction is a short proboscis that stops in mid-air on purpose —
     a tapir's, which is its single identifying feature and the reason it must
     not wear a pig's nose disc. */
  trunk?: boolean | number;
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
  mat?: Material;
  /** ★ wave 13 — an ear has a SHAPE, not only a size. Defaults per family. */
  /* ⚠ 'hidden' was declared here, set on the WHOLE pinniped family plus Mole
     and Sloth, and had no branch in the shape switch — so it fell through to
     the default cup and a true seal was drawn with an external ear.
     D-ART-100 again, found by the wave-32 family audit. */
  earShape?: 'round' | 'point' | 'tuft' | 'leaf' | 'drop' | 'spoon' | 'hidden';
  /** ★ wave 13 — and an eye has a PUPIL, which no mammal here had. */
  pupil?: 'round' | 'slit' | 'bar';
  iris?: string;
  tailScale?: number;
  /* ★ wave 22b — a mane is drawn BEHIND and BACK from the head, never centred
     on it: centred, it swallows the muzzle and eyes and the animal loses the
     only part anyone actually reads. */
  mane?: 'lion' | 'ruff' | 'crest' | 'crestUp';
  /** ★ wave 40 — the body's POSTURE. 'stand' (default) is the horizontal
      quadruped this painter has always drawn; 'sentinel' rears it onto its
      hind legs with the forelimbs tucked (meerkat, prairie dog, ground
      squirrel). It rotates the SPINE, so the silhouette, coat, material,
      shading and rim all follow without knowing anything about it. */
  pose?: 'sentinel' | 'hang';
  /* ★ WAVE 39 — THE OKAPI PROBLEM. Its coat runs on the HINDQUARTERS ONLY and
     is PALE on a dark ground — the exact inverse of what `coat:'stripes'` does,
     and its verifier called the inversion "real and damning". Two axes, both
     general: which stretch of the body the marks occupy, and what colour they
     are. (`coatZone` is the axis mammal-species-fixes.md asked for and nobody
     had built; `coatRgb` is what makes a light-on-dark coat expressible at all
     — every mark in skin.ts defaulted to a dark tone.) */
  coatZone?: [number, number];
  coatRgb?: [number, number, number];
  /** ★ wave 38 — carry this species' coat pattern down onto the four limbs.
      Opt-in, because on most mammals the legs really are plainer than the
      flank; on a zebra, an okapi, a panda or a leopard they are not, and the
      reference rows say so explicitly. */
  legMarks?: boolean;
  /** ★ wave 45 — a solid pale LOWER LEG (a stocking). Distinct from legMarks,
      which carries the coat pattern: a stocking is a change of colour, not a
      mark on a ground, and it is what separates Gaur from Buffalo. */
  stockings?: string;
  /** ★ wave 51 — NECK CARRIAGE, overriding the family's. 1 is the browsing
      ungulate's high head (and the angle every mammal used to get); 0 carries
      the skull level with the withers and throws it forward. A species whose
      reference row names the carriage — a giraffe, a gerenuk, a stalking
      cheetah — sets it here; everyone else inherits the family plan. */
  carry?: number;
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
  /** ★ wave 13/16 — how big the nose pad is against the muzzle end, and how the
      lip runs. A dog's pad is a quarter of its snout; a cat's is a stud. */
  nosePad: number;
  lip: 'straight' | 'curl' | 'droop' | 'cleft';
  cheek: number;   /** the cheek/jowl mass that stops a muzzle reading as a plank */
  tilt: number;      /* how far the muzzle points down off the neck */
}> = {
  /* ★ D-ART-132 — THE CATS WERE RENDERING AS COWS, and it was arithmetic.
     cranium 1.00 made the braincase DIAMETER (2·headR) 1.25× the whole skull's
     LENGTH, so a felid head could only ever be a sphere with a nub on it —
     which is why 10 of 17 felid heads were flagged non-unique and why a
     Clouded Leopard's head was interchangeable with a Cougar's. No per-species
     value could escape it. eyeR 0.235 on that braincase made the eye a third
     of the face, the reason every cat read as a toy. */
  felid: { len: 1.68, cranium: 0.80, stop: 0.72, muzzle: 0.40, jaw: 0.30, eyeU: 0.44, eyePhi: 0.22, eyeR: 0.185, nose: 'wet', tilt: 0.06, nosePad: 0.95, lip: 'curl', cheek: 0.78 },
  /* ★ D-ART-133 — a canid skull LONGER than a bovid's (2.45 vs 2.40) with the
     lowest cheek of any predator is an ungulate wedge, which is why Wolf,
     Dingo and Dog all read as small horses. */
  canid: { len: 2.20, cranium: 0.86, stop: 0.52, muzzle: 0.28, jaw: 0.26, eyeU: 0.40, eyePhi: 0.34, eyeR: 0.140, nose: 'wet', tilt: 0.10, nosePad: 1.45, lip: 'straight', cheek: 0.66 },
  /* ★ D-ART-133 — a bear's eye is famously tiny against a huge skull and it is
     most of what makes a bear head read as a bear; 0.175 gave a 7.5px eye with
     a 16px socket wash, so Black, Sun and Spectacled Bear were one big-eyed
     dark ball. */
  ursid: { len: 1.90, cranium: 1.06, stop: 0.28, muzzle: 0.46, jaw: 0.36, eyeU: 0.36, eyePhi: 0.28, eyeR: 0.100, nose: 'wet', tilt: 0.18, nosePad: 1.15, lip: 'droop', cheek: 0.88 },
  /* ★ D-ART-132 — eyePhi 0.74 put the eye 75% of the way to the dorsal
     outline, i.e. ON the head's silhouette — literally the "eye is set on the
     crown rather than the side of the face" complaint. The eye was too BIG,
     not too high. jaw 0.34 sized a chin ellipse that projects past the nose as
     a detached pale bar (the same artifact on Cattle, Wild Horse, Llama and
     Zebra — one bug across four families). */
  bovid: { len: 2.40, cranium: 0.80, stop: 0.10, muzzle: 0.44, jaw: 0.24, eyeU: 0.32, eyePhi: 0.68, eyeR: 0.165, nose: 'nostril', tilt: 0.16, nosePad: 0.80, lip: 'droop', cheek: 0.66 },
  cervid: { len: 2.30, cranium: 0.78, stop: 0.16, muzzle: 0.36, jaw: 0.28, eyeU: 0.31, eyePhi: 0.72, eyeR: 0.225, nose: 'wet', tilt: 0.16, nosePad: 0.72, lip: 'straight', cheek: 0.48 },
  /* ★ GOLD AUDIT — the equid head read as "a fat oval slab": the wedge comes
     from a longer, slimmer skull — smaller braincase, narrower muzzle and
     jaw, less jowl, head angled further down off the poll. */
  equid: { len: 2.95, cranium: 0.74, stop: 0.05, muzzle: 0.44, jaw: 0.36, eyeU: 0.28, eyePhi: 0.70, eyeR: 0.205, nose: 'nostril', tilt: 0.26, nosePad: 0.90, lip: 'droop', cheek: 0.58 },
  camelid: { len: 2.10, cranium: 0.72, stop: 0.26, muzzle: 0.38, jaw: 0.34, eyeU: 0.33, eyePhi: 0.62, eyeR: 0.22, nose: 'nostril', tilt: 0.10, nosePad: 0.66, lip: 'cleft', cheek: 0.44 },
  /* a pig's snout ends in a flat cartilage DISC, and that disc is the animal */
  suid: { len: 2.25, cranium: 0.86, stop: 0.04, muzzle: 0.52, jaw: 0.40, eyeU: 0.28, eyePhi: 0.58, eyeR: 0.155, nose: 'disc', tilt: 0.20, nosePad: 1.30, lip: 'straight', cheek: 0.60 },
  /* ★ D-ART-133 — THE WORST HEAD IN THE TABLE, and it explains 12 of 14
     generic mustelid heads: cranium 0.84 against len 1.80 gave a Stoat a 27px
     braincase over a 28px skull, i.e. a SPHERE with a 9px pimple for a muzzle,
     at every hue. A mustelid skull is a low flat wedge. */
  mustelid: { len: 2.10, cranium: 0.60, stop: 0.20, muzzle: 0.26, jaw: 0.16, eyeU: 0.54, eyePhi: 0.36, eyeR: 0.135, nose: 'wet', tilt: 0.02, nosePad: 1.20, lip: 'curl', cheek: 0.22 },
  rodent: { len: 1.70, cranium: 0.98, stop: 0.46, muzzle: 0.32, jaw: 0.26, eyeU: 0.46, eyePhi: 0.44, eyeR: 0.25, nose: 'wet', tilt: 0.10, nosePad: 0.58, lip: 'cleft', cheek: 0.40 },
  pachyderm: { len: 1.95, cranium: 1.16, stop: 0.34, muzzle: 0.54, jaw: 0.40, eyeU: 0.38, eyePhi: 0.56, eyeR: 0.140, nose: 'nostril', tilt: 0.10, nosePad: 0.70, lip: 'droop', cheek: 0.90 },
  marsupial: { len: 1.85, cranium: 0.96, stop: 0.34, muzzle: 0.40, jaw: 0.32, eyeU: 0.44, eyePhi: 0.46, eyeR: 0.250, nose: 'wet', tilt: 0.12, nosePad: 0.74, lip: 'straight', cheek: 0.44 },
  procyonid: { len: 1.95, cranium: 0.92, stop: 0.36, muzzle: 0.34, jaw: 0.26, eyeU: 0.44, eyePhi: 0.38, eyeR: 0.24, nose: 'wet', tilt: 0.14, nosePad: 0.84, lip: 'straight', cheek: 0.38 },
  /* an anteater or a pangolin is almost all snout, and the eye is tiny and far
     back — that proportion alone is the whole group's silhouette */
  xenarthran: { len: 3.10, cranium: 0.70, stop: 0.06, muzzle: 0.22, jaw: 0.14, eyeU: 0.24, eyePhi: 0.50, eyeR: 0.13, nose: 'wet', tilt: 0.22, nosePad: 0.44, lip: 'straight', cheek: 0.14 },
  pinniped: { len: 1.70, cranium: 1.05, stop: 0.30, muzzle: 0.52, jaw: 0.30, eyeU: 0.42, eyePhi: 0.30, eyeR: 0.275, nose: 'wet', tilt: 0.06, nosePad: 0.86, lip: 'curl', cheek: 0.82 },
  burrower: { len: 2.95, cranium: 0.74, stop: 0.08, muzzle: 0.26, jaw: 0.18, eyeU: 0.26, eyePhi: 0.52, eyeR: 0.12, nose: 'wet', tilt: 0.24, nosePad: 0.52, lip: 'straight', cheek: 0.16 },
  /* ★ wave 35 — a hyena's head is the most massive thing on it: a short deep
     muzzle under a broad crested cranium, with the jaw musculature of a
     bone-cracker. On the canid wedge it was reading as a pony's. */
  hyaenid: { len: 1.95, cranium: 1.10, stop: 0.34, muzzle: 0.44, jaw: 0.44, eyeU: 0.42, eyePhi: 0.26, eyeR: 0.130, nose: 'wet', tilt: 0.14, nosePad: 1.10, lip: 'straight', cheek: 0.88 },
  generic: { len: 2.00, cranium: 0.94, stop: 0.30, muzzle: 0.42, jaw: 0.34, eyeU: 0.40, eyePhi: 0.40, eyeR: 0.235, nose: 'wet', tilt: 0.10, nosePad: 0.80, lip: 'straight', cheek: 0.50 },
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
  ear: 'round' | 'point' | 'tuft' | 'leaf' | 'drop' | 'spoon' | 'hidden';
  mat: Material;
  pupil: 'round' | 'slit' | 'bar';
  iris: string;
  cannon: number;    /* 1 = pencil cannon bone, 0 = a column with no ankle */
  crouch: number;    /* 1 = folded and low, 0 = straight-legged and tall */
  /* ★ WAVE 51 — NECK CARRIAGE. `headY = shoulderY - neckLen * 0.86` was
     HARD-CODED, so every mammal in the catalogue carried its head up and
     forward at 57° off the shoulder — a browsing ungulate's carriage — and
     that is most of why twelve canids and thirteen felids read as one pony.
     Unlike the limb (whose upper half the body occludes entirely, D-ART-149)
     NOTHING occludes this: the neck angle IS the silhouette, and it is the
     first thing anyone reads. A carnivore carries its skull at or below the
     withers with the muzzle thrown forward; a horse, a deer and a camel carry
     it up. 1 reproduces the old angle exactly, so every family left at 1 is
     byte-unchanged (D-ART-14). */
  carry: number;     /* 1 = head high (ungulate), 0 = head level and forward */
  /* ★ WAVE 60 — HEAD MASS relative to the body. A bear's head is enormous and a
     deer's is small on a long neck; sizing every skull off one bodyH ratio is
     part of why the ursids read as a "sheep chassis" (small head on a woolly
     barrel). Optional, defaults to 1 = the wave-22 sizing, byte-unchanged. */
  headScale?: number;
}> = {
  /* a cat is a deep chest and a tucked waist over a short folded limb */
  /* ★ D-ART-132 — cannon 0.52 made the ankle half-width 0.63·legW while the
     paw ellipse under it is 0.66·legW, so THE PAW WAS DRAWN INSIDE THE LIMB
     and never appeared: 15 of 17 felid rows reported "hoof-like tips, no
     paws". waist/chest/rump were all too low for the tuck, brisket and croup
     terms to register, so every cat was a barrel with a disc on its haunch. */
  felid: { waist: 0.95, muscle: 0.88, chest: 0.98, rump: 0.82, foot: 'paw', cannon: 0.74, crouch: 0.95, carry: 0.28, ear: 'round', pupil: 'slit', iris: '#c9a233', mat: 'pelt' },
  /* a dog is leggier and narrower than a cat, and it still has paws */
  /* ★ D-ART-133 — the croup lift is 0.22·(rump·0.66+muscle·0.48) against a
     withers lift of only 0.17·muscle, so at 0.46/0.58 a dog's HIP stood 30%
     higher than its SHOULDER: a rump-high pony topline. A dog's withers must
     be the highest point. */
  canid: { waist: 0.86, muscle: 0.90, chest: 0.94, rump: 0.30, foot: 'paw', cannon: 0.58, crouch: 0.66, carry: 0.32, ear: 'point', pupil: 'round', iris: '#a97a34', mat: 'fur' },
  /* a bear is a shoulder hump, a heavy rump, no waist at all, and soles */
  /* ★ D-ART-133 — THE WORST SINGLE NUMBER IN THE TABLE. rump 0.90 with muscle
     0.96 lifted the croup 0.232·bodyH against a withers 0.163·bodyH, so the
     family plan built every bear RUMP-HIGH — the exact inverse of the shoulder
     hump that IS the ursid read, and why "no shoulder hump above the rump"
     lands on Grizzly. cannon 0.16 also left the sole only 7% proud of the
     ankle, so the plantigrade foot read as a hoof nub. */
  ursid: { waist: 0.16, muscle: 1.00, chest: 0.84, rump: 0.40, foot: 'plantigrade', cannon: 0.32, crouch: 0.78, carry: 0.22, ear: 'round', pupil: 'round', iris: '#4a3524', mat: 'pelt', headScale: 1.3 },
  /* ★ D-ART-132 — muscle drives the withers gauss; at 0.52 the shoulder rose
     0.088·bodyH, which is "no shoulder hump / level-backed" on Bison, Bull,
     Eland, Nilgai, Hartebeest and Wildebeest at once. */
  bovid: { waist: 0.30, muscle: 0.68, chest: 0.82, rump: 0.82, foot: 'cloven', cannon: 0.90, crouch: 0.26, carry: 1.00, ear: 'spoon', pupil: 'bar', iris: '#5a4326', mat: 'fur' },
  cervid: { waist: 0.56, muscle: 0.36, chest: 0.50, rump: 0.44, foot: 'cloven', cannon: 1.00, crouch: 0.22, carry: 1.00, ear: 'leaf', pupil: 'bar', iris: '#3f2c1a', mat: 'fur' },
  equid: { waist: 0.32, muscle: 0.74, chest: 0.70, rump: 0.82, foot: 'hoof', cannon: 0.98, crouch: 0.20, carry: 1.00, ear: 'point', pupil: 'bar', iris: '#3a2a1c', mat: 'fur', headScale: 0.92 },
  /* a camel carries a high chest on long soft-padded legs */
  camelid: { waist: 0.44, muscle: 0.42, chest: 0.78, rump: 0.40, foot: 'pad', cannon: 0.82, crouch: 0.32, carry: 1.00, ear: 'leaf', pupil: 'bar', iris: '#4a3220', mat: 'pelt' },
  suid: { waist: 0.08, muscle: 0.62, chest: 0.82, rump: 0.50, foot: 'cloven', cannon: 0.70, crouch: 0.40, carry: 0.25, ear: 'drop', pupil: 'round', iris: '#4d3826', mat: 'fur' },
  /* a long low tube on very short legs */
  /* ★ D-ART-133 — cannon 0.34 made the ankle 0.717·legW while the paw pad is a
     FIXED legW·0.66, so the pad was NARROWER than the leg it caps and rendered
     as a dark hole inside a pale tube: the "hollow cylinder with an open end
     cap" on Weasel, Wolverine, Stoat, Mink, Fisher, Marten, Mongoose, Otter
     and Badger — nine species, one number. waist 0.82 also pinched the MIDDLE
     of a family that has no mid-body pinch at all. */
  mustelid: { waist: 0.30, muscle: 0.68, chest: 0.56, rump: 0.56, foot: 'paw', cannon: 0.60, crouch: 0.80, carry: 0.75, ear: 'round', pupil: 'round', iris: '#2b2118', mat: 'fur' },
  rodent: { waist: 0.38, muscle: 0.34, chest: 0.42, rump: 0.74, foot: 'paw', cannon: 0.38, crouch: 0.66, carry: 0.50, ear: 'round', pupil: 'round', iris: '#241a12', mat: 'fur' },
  pachyderm: { waist: 0.04, muscle: 0.72, chest: 0.66, rump: 0.70, foot: 'pad', cannon: 0.10, crouch: 0.08, carry: 1.00, ear: 'round', pupil: 'round', iris: '#553f28', mat: 'hide' },
  /* unfamilied species keep exactly the wave-4 behaviour, so nothing that
     was already good moves without someone choosing to move it (D-ART-14) */
  /* a marsupial carries its weight BEHIND — heavy haunches, a thick tail
     base, short forelimbs, and it sits low */
  marsupial: { waist: 0.40, muscle: 0.52, chest: 0.50, rump: 0.86, foot: 'paw', cannon: 0.26, crouch: 0.70, carry: 1.00, ear: 'round', pupil: 'round', iris: '#2a1f16', mat: 'fur' },
  /* a raccoon walks on its soles with an arched back and a hunched shoulder */
  procyonid: { waist: 0.54, muscle: 0.44, chest: 0.56, rump: 0.62, foot: 'plantigrade', cannon: 0.28, crouch: 0.66, carry: 1.00, ear: 'round', pupil: 'round', iris: '#2f2418', mat: 'pelt' },
  /* sloths, armadillos, anteaters, pangolins: a low deep body on short limbs
     ending in the enormous digging or hooking CLAWS that define the group */
  xenarthran: { waist: 0.26, muscle: 0.54, chest: 0.62, rump: 0.60, foot: 'claw', cannon: 0.30, crouch: 0.58, carry: 0.30, ear: 'round', pupil: 'round', iris: '#221a14', mat: 'hide' },
  /* a seal or a walrus has no standing limb at all — it is a torpedo resting
     on the ground with flippers, and drawing it four legs is the whole error */
  pinniped: { waist: 0.06, muscle: 0.34, chest: 0.72, rump: 0.30, foot: 'flipper', cannon: 0.04, crouch: 0.04, carry: 1.00, ear: 'hidden', pupil: 'round', iris: '#14120f', mat: 'fur' },
  /* an aardvark or a mole: an arched back over powerful short digging forelimbs */
  burrower: { waist: 0.18, muscle: 0.70, chest: 0.58, rump: 0.66, foot: 'claw', cannon: 0.22, crouch: 0.62, carry: 1.00, ear: 'round', pupil: 'round', iris: '#1d1610', mat: 'fur' },
  /* ★ wave 35 — THE HYENAS WERE CANIDS AND IT SHOWED. Nick's audit has three
     blocker rows here and all three describe the same animal: a pony. A hyaenid
     is not a dog — it is massive through the shoulder, neck and jaw and light
     behind, so the topline falls away from the withers instead of rising to a
     croup; it stands on a short folded limb rather than a cursorial one; and
     its round ear is nothing like a dog's prick ear. One table row, three
     blockers. */
  hyaenid: { waist: 0.52, muscle: 0.92, chest: 0.86, rump: 0.28, foot: 'paw', cannon: 0.62, crouch: 0.46, carry: 0.26, ear: 'round', pupil: 'round', iris: '#6b5230', mat: 'fur' },
  generic: { waist: -1, muscle: -1, chest: -1, rump: -1, foot: 'paw', cannon: 0.62, crouch: 0.45, carry: 1.00, ear: 'round', pupil: 'round', iris: '#3a2b1c', mat: 'fur' },
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
  /* ★ WAVE 38 — THE CAMEL'S HUMPS ARE PART OF THE BACK. They used to be filled
     flat in `p.base` AFTER the coat and the material layers, so they could never
     carry either: a bald tan dome with a hard seam sitting on a shaggy animal,
     which is exactly how the gold pass reported all three camels. Folded into
     `topY` they become part of the body SOLID — the same fix wave 4 applied to
     the torso and wave 35 to the tail — so they inherit the coat, the material,
     the countershading and the rim light, and the seam is not fixed, it is
     unreachable. */
  const humpAt = (t: number): number => {
    if (!spec.humps) return 0;
    /* ⚠ SUMMING TWO GAUSSIANS MERGES THEM. At width 0.155 the bactrian's pair
       overlapped in the middle and added to a single broad dome — one hump on
       the animal whose TWO humps are the only thing separating it from a
       dromedary. Take the MAX, and narrow them, so the saddle between the two
       stays open. */
    const two = spec.humps === 2;
    const hxs = two ? [0.30, 0.72] : [0.5];
    const w = two ? 0.115 : 0.155;
    let lift = 0;
    for (const hu of hxs) lift = Math.max(lift, Math.exp(-(((t - hu) / w) ** 2)));
    return bodyH * (two ? 0.46 : 0.62) * lift;   /* ★ POLISH — the dromedary hump reads taller */
  };
  const topY = (t: number): number => topYBase(t) - humpAt(t);
  const topYBase = (t: number): number => {
    /* t: 0 at the rump, 1 at the shoulder */
    if (back === 'humped') return cy - bodyH * (0.55 + 0.42 * Math.pow(t, 2.2));
    if (back === 'sloped') return cy - bodyH * (0.40 + 0.55 * t);
    if (back === 'arched') return cy - bodyH * (0.52 + 0.30 * Math.sin(t * Math.PI));
    /* ★ wave 35 — the roach: highest over the HIP and falling away forward to
       the shoulder, the arch a raccoon, an aardvark and a sloth all carry */
    if (back === 'roached') return cy - bodyH * (0.86 - 0.34 * t + 0.16 * Math.sin(t * Math.PI));
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
  /* ⚠ WAVE 51 — A HAUNCH CANNOT BE AUTHORED HERE, AND THIS IS WHY (D-ART-152).
     A thigh and a shoulder lobe were added to this function — `+0.20·rumpF`
     at u 0.19 and `+0.11·muscleF` at u 0.83 — typechecked, rendered, and
     changed almost NOTHING. The reason is structural, not a matter of
     coefficients: `ventral` and `dorsal` do not describe an outline. They
     feed `RAD = (ventral - dorsal)/2` and an AXIS at their midpoint, and
     `Tube` sweeps ONE SCALAR RADIUS — a circular cross-section (torso.ts).
     So every unit the belly is pushed DOWN raises the back by half a unit and
     grows the radius by half: an asymmetric mass is not expressible, and the
     rear simply got rounder. It is the same shape of finding as D-ART-149 —
     the knee was lowered, rendered, and reverted because occlusion was
     binding rather than joint height.
     ★ So the haunch is a TORSO-ENGINE item, not a table item: it needs
     `Tube` to accept a radius that varies with phi as well as u. Do not
     retry it by tuning numbers in this function. */
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
  /* ★ WAVE 52 — THE THIGH AND THE UPPER ARM, AT LAST ON THE VENTRAL SIDE ONLY.
     D-ART-152 recorded why this could not be done before: these terms were
     tried in `ventral()`, where they feed RAD and the axis midpoint, so half
     of every downward push came straight back up as a raised topline and the
     rear just got rounder. `Tube` now carries a separate ventral profile
     (torso.ts, wave 52), so mass added here goes DOWN and nowhere else — the
     back stays exactly where the species' own back profile put it.
     This is what "where does the limb leave the silhouette" was waiting for:
     the leg no longer drops out of a flat line, it emerges from the bottom of
     a mass that is part of the torso outline, which is what a shoulder and a
     haunch actually are. Centred on `legUs` — 0.175 and 0.84 — so the bulges
     sit exactly over the limbs they belong to rather than near them.
     Both are driven by numbers the species already has (`rumpF`, `muscleF`),
     so no row gains a per-species value and nothing is rolled to 140 animals
     as a band (D-ART-83). */
  const RADV = (u: number): number => RAD(u) + bodyH * (
    0.20 * rumpF * gauss(u, 0.175, 0.115)      /* the thigh, standing proud of the flank */
    + 0.12 * muscleF * gauss(u, 0.840, 0.095)  /* the upper arm, behind the elbow */
  );
  /* the axis is INSET by the end caps, so the animal's overall length is still
     the 2·bodyW its spec asked for — a dome on the rump adds body, not frame */
  const axA = cx - bodyW + RAD(0) * 0.80, axB = cx + bodyW - RAD(1) * 0.80;
  const AX0 = (u: number): [number, number] => [axA + (axB - axA) * u, (ventral(u) + dorsal(u)) / 2];
  /* ★ WAVE 40 — POSE. `faunaQuadruped` has always drawn exactly one posture: a
     horizontal animal with four feet on `groundY`. Three species in the gold
     pass fail on that alone — a meerkat's sentinel stance, a sloth hanging
     beneath a branch — and it was filed as needing "a different body-axis
     construction, not a parameter".
     That turned out to be exactly right, and also cheaper than it sounds: the
     AXIS is the only thing that decides where the body goes. The Tube, the
     silhouette, the coat, the material, the countershading and the rim light
     are all derived from it (wave 4), so re-orienting the axis re-poses every
     one of them for free. This is what "re-author the shape" looks like when
     the shape is already a solid: rotate its spine, and nothing else needs to
     know. Contrast G9, where the elephant ear is a hand-drawn outline with no
     such abstraction and could not be moved at all. */
  const hanging = spec.pose === 'hang';
  const branchY = groundY - legLen - bodyH * 2.05;
  const poseA = spec.pose === 'sentinel' ? -1.34 : 0;
  const pvx = (axA + axB) / 2, pvy = cy;
  const cosA = Math.cos(poseA), sinA = Math.sin(poseA);
  const spin = (x: number, y: number): [number, number] => {
    if (!poseA) return [x, y];
    const dx = x - pvx, dy = y - pvy;
    return [pvx + dx * cosA - dy * sinA, pvy + dx * sinA + dy * cosA];
  };
  /* stand the rotated animal back on its feet: with the spine vertical the rump
     end has swung down, so the whole body is lifted until it clears the hocks */
  let poseDY = 0;
  if (poseA) {
    const r0 = spin(...AX0(0));
    poseDY = (groundY - legLen * 0.86) - r0[1];
  }
  const AX = (u: number): [number, number] => {
    const q = spin(...AX0(u));
    return [q[0], q[1] + poseDY];
  };
  const body = new Tube({ P: AX, R: RAD, Rv: RADV });

  if (hanging) {
    /* ★ WAVE 40 — THE BRANCH. A hanging animal needs something to hang FROM,
       or it reads as falling. Drawn first so the limbs and their hooks close
       over it, and the cast shadow goes on the BRANCH rather than the ground —
       there is no ground contact to cast one. */
    const bg2 = c.createLinearGradient(0, branchY - S * 0.022, 0, branchY + S * 0.022);
    bg2.addColorStop(0, '#6a5540'); bg2.addColorStop(0.45, '#4e3d2c'); bg2.addColorStop(1, '#2e241a');
    c.fillStyle = bg2;
    c.beginPath(); c.rect(0, branchY - S * 0.020, S, S * 0.040); c.fill();
    c.strokeStyle = 'rgba(24,18,12,0.30)'; c.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const yy = branchY - S * 0.016 + i * S * 0.0055;
      c.beginPath(); c.moveTo(0, yy); c.lineTo(S, yy + (i % 2 ? 2 : -2)); c.stroke();
    }
    c.fillStyle = 'rgba(0,0,0,0.30)';
    c.beginPath(); c.ellipse(cx, branchY + S * 0.020, bodyW * 0.70, S * 0.012, 0, 0, TAU); c.fill();
  } else {
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.beginPath(); c.ellipse(cx, groundY + 6, bodyW * 0.92, S * 0.032, 0, 0, TAU); c.fill();
  }

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
  /* ★ WAVE 40 — in a sentinel stance only the HIND pair carries weight. The
     forelimbs are held tucked against the chest and never reach the ground, so
     they are drawn as a short folded arm rather than a leg stretched from the
     shoulder down to `groundY` — which is what a pose-blind limb would do, and
     would put two enormous forelegs down a standing meerkat's front. */
  const tucked = (hind: boolean): boolean => spec.pose === 'sentinel' && !hind;
  /* ★ WAVE 40 — HANGING. A sloth spends its life inverted under a branch, and
     its reference row asks for exactly that. The body needs no rotation: what
     inverts is the LIMBS, which reach UP to the branch instead of down to the
     ground, and the hook claws close over it. `branchY` is where they end. */
  const legTube = (u: number, xoff: number, hind: boolean): Tube => {
    const a = AX(u);
    const rootX = a[0] + xoff, rootY = a[1] - RAD(u) * 0.22;
    if (hanging) {
      /* up and slightly outward, then hooking over the branch */
      const reach = rootY - branchY;
      return new Tube({
        P: pathThrough([
          [rootX, rootY],
          [rootX + (hind ? -legW * 0.5 : legW * 0.5), rootY - reach * 0.45],
          [rootX + (hind ? -legW * 0.8 : legW * 0.8), branchY + legW * 0.35],
        ]),
        R: (t: number) => legW * (1.16 - t * 0.42),
      });
    }
    if (tucked(hind)) {
      /* down and slightly forward, ending clear of the belly: a held forearm */
      const L = legLen * 0.52;
      return new Tube({
        P: pathThrough([
          [rootX, rootY],
          [rootX + legW * 0.55, rootY + L * 0.42],
          [rootX + legW * 0.30, rootY + L * 0.92],
        ]),
        R: (t: number) => legW * (1.28 - t * 0.62),
      });
    }
    /* ★ D-ART-136 — `crouch` WAS ALMOST INERT. It moved the knee height by
       0.16 of the drop and the knee x by under one legW across its whole
       range, so felid 0.74 and bovid 0.26 produced VISUALLY IDENTICAL straight
       columns — "four straight unjointed tubes with no hock or elbow" on
       Wildcat, Caracal, Saiga and a dozen others. A documented field that
       cannot change the drawing is the D-ART-100 shape wearing a number.
       The range is now wide enough to actually fold a limb, and the hind leg
       gets a real HOCK REVERSAL: the ankle kicks BACK the way a digitigrade
       hind limb does, which is the single clearest "this is a mammal, not a
       table" cue in the silhouette. */
    const kneeY = rootY + (groundY - rootY) * (0.70 - crouch * 0.34);
    const kneeX = rootX + (hind ? -legW * (0.30 + crouch * 2.20) : legW * (0.20 + crouch * 1.30));
    /* the hock: on a folded hind limb the ankle sits BEHIND the knee, so the
       shank swings forward again to plant the foot under the hip */
    const hockY = rootY + (groundY - rootY) * (0.84 - crouch * 0.10);
    const hockX = kneeX + (hind ? legW * (0.20 + crouch * 1.30) : -legW * (0.10 + crouch * 0.30));
    const footX = rootX + (hind ? legW * (0.16 + crouch * 0.34) : -legW * 0.10);
    const spine = pathThrough([
      [rootX, rootY],
      [rootX + (kneeX - rootX) * 0.42, rootY + (kneeY - rootY) * 0.44],
      [kneeX, kneeY],
      [hockX, hockY],
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
    /* ★ WAVE 53 — THE CAUDAL PROFILE, i.e. why the leg was "a straight tube in
       every family". `wprof` is symmetric, so the limb was a cone of circles:
       there is no gaskin, no flexor mass behind the forearm, and above all no
       POINT OF HOCK — the calcaneus that sticks out backwards and is the single
       clearest "this is a leg and not a dowel" cue in a side view.
       The normal here points CRANIALLY (the axis runs down the leg), so `Rv` is
       the caudal side and mass added to it goes backwards only — the front of
       the cannon stays the straight line it should be.
       ⚠ Placed LOW on purpose. The body occludes the upper limb (D-ART-149) and
       wave 52's haunch occludes a little more of it, so a bulge at mid-thigh
       would be invisible; the hock at t≈0.74 is in the part that actually
       shows. Scaled by `crouch`, so a folded carnivore limb gets the fuller
       flexor mass and a cursorial hoofed one stays lean — family-derived, no
       new per-species number (D-ART-83). */
    const wprofV = (t: number): number => wprof(t) * (1
      + 0.40 * Math.exp(-(((t - 0.74) / 0.115) ** 2)) * (0.34 + crouch * 0.66)
      + 0.16 * Math.exp(-(((t - 0.46) / 0.140) ** 2)) * crouch);
    return new Tube({ P: spine, R: wprof, Rv: wprofV });
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
      /* ★ WAVE 49 — THE FOOT THAT MADE EVERY CARNIVORE A PONY. Three faults,
         and the third had been inverting the read since the paw was written:
           · the pad was 0.66·legW wide against a felid ankle of 0.525·legW —
             barely proud of the limb, so the leg simply ended;
           · it was a FIXED coat×0.52, which is a mid-tan on a cream leopard
             (no value break at all) and mud on a near-black wolf;
           · THE TOES WERE PAINTED LIGHTER THAN THE PAD (0.62 over 0.52), so
             the one shape that says "toes, not a hoof" read as a highlight
             sitting on the tip — which is exactly what a fetlock looks like.
         Nick's engine independently filed all twelve canids and twelve felids
         as one hoofed chassis; a tint-diagnostic render (limb flat blue, foot
         flat red) showed the foot is the only part of the limb the body does
         NOT occlude, so it carries the whole family read on its own.
         ⚠ D-ART-141: the tone is DERIVED, not fixed — a pale coat darkens, a
         dark coat LIFTS. Darkening a black wolf's paw deletes the only
         structural separation it has, which is how three earlier fixes in
         this file were right about the defect and wrong about the remedy. */
      /* ★ GOLD AUDIT ROUND 2 — wave 49 made the pale-coat paw a SOLID DARK
         CAP (pad 0.50 + toes 0.62), and at catalogue scale a dark block on
         the end of a pale leg is a HOOF whatever its interior detail — Nick's
         gold audit filed nine small cats as "hoof-like feet" with that paw
         live. The paw now reads by SHAPE: a coat-toned fan WIDER than the
         ankle, three toe lobes protruding from the front silhouette, dark
         creases between them and claw ticks — value shift kept mild. */
      const lum = p.cr * 0.299 + p.cg * 0.587 + p.cb * 0.114;
      const padK = lum > 92 ? 0.82 : 1.28;
      const toeK = lum > 92 ? 0.70 : 1.48;
      c.fillStyle = dark(padK);
      c.beginPath(); c.ellipse(x, gy - legW * 0.22, legW * 1.06, legW * 0.44, 0, 0, TAU); c.fill();
      c.fillStyle = dark(toeK);
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.ellipse(x + i * legW * 0.44, gy - legW * 0.06, legW * 0.30, legW * 0.26, 0, 0, TAU); c.fill();
      }
      /* the creases BETWEEN the toes — a fan of three lobes only reads as toes
         if something separates them; without this it is one rounded cap */
      c.strokeStyle = `rgba(24,18,14,${0.55 * m})`;
      c.lineWidth = Math.max(1, legW * 0.085); c.lineCap = 'round';
      for (const s of [-1, 1] as const) {
        c.beginPath();
        c.moveTo(x + s * legW * 0.22, gy - legW * 0.34);
        c.lineTo(x + s * legW * 0.22, gy + legW * 0.02);
        c.stroke();
      }
      /* the claw ticks off each toe front */
      c.strokeStyle = `rgba(30,24,18,${0.65 * m})`; c.lineWidth = Math.max(1, legW * 0.07);
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.moveTo(x + i * legW * 0.44 - legW * 0.24, gy - legW * 0.02);
        c.lineTo(x + i * legW * 0.44 - legW * 0.34, gy + legW * 0.06); c.stroke();
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
    /* ★ GOLD AUDIT ROUND 2 — on a vertical limb the countershade pales the
       BOTTOM, which paints the pale-cannon-and-dark-hoof read of an ungulate
       onto every cat. Paw-footed families keep the coat tone down the leg. */
    countershade(c, limb, lp, FAM0.foot === 'paw' ? 0.45 : 0.85);
    if (!spec.alien?.skin) coatMaterial(c, limb, r, lp, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL * 0.45, len: 0.6 });
    /* ★ WAVE 38 — A MARKING CAN REACH A LEG NOW. Filed in two worklists as
       "STRUCTURALLY UNREACHABLE — the four leg Tubes are filled before the coat
       clip and never revisited". The second half was true and the conclusion did
       not follow: this clip is open, `limb` is a real Tube, and every coat*
       function in skin.ts takes a Tube — the call shape is identical to the
       coatMaterial line directly above. ~15 lines, and it unlocks the zebra's
       banded legs, the okapi's striped haunches, the panda's black limbs and
       the spotting that should run down every felid's limb.
       Opt-in per species (`legMarks`), NOT automatic: switching it on for every
       patterned coat would repaint ~50 animals in one commit, which is exactly
       the global pass artlock exists to stop (D-ART-83). */
    /* ★ WAVE 45, G10 — STOCKINGS. Buffalo ≈ Gaur survived every earlier attempt
       because the thing that actually separates them is Gaur's pale lower legs,
       and nothing here could say it: `legMarks` carries the coat's PATTERN, and
       a pattern is dark marks on a ground, not a solid change of colour partway
       down a limb. This is a band of a different colour on the cannon, which is
       what a stocking is — and it is also the okapi's, the bongo's and every
       white-socked bovid's. Drawn inside the limb's own clip, so it follows the
       taper and takes the countershading rather than sitting on top of it. */
    if (spec.stockings && !spec.alien?.skin) {
      const sockTop = 0.62;
      c.fillStyle = spec.stockings;
      c.globalAlpha = m < 1 ? 0.72 : 1;
      c.beginPath();
      for (let i = 0; i <= 18; i++) {
        const t2 = sockTop + (i / 18) * (1 - sockTop);
        const e = limb.envelope(t2, 1);
        if (i === 0) c.moveTo(e[0], e[1]); else c.lineTo(e[0], e[1]);
      }
      for (let i = 18; i >= 0; i--) {
        const t2 = sockTop + (i / 18) * (1 - sockTop);
        const e = limb.envelope(t2, -1);
        c.lineTo(e[0], e[1]);
      }
      c.closePath(); c.fill();
      c.globalAlpha = 1;
    }
    if (spec.legMarks && !spec.alien?.skin) {
      if (coat === 'bands') coatBars(c, limb, r, lp, { count: 7, width: 1.15, phiTop: 1.62, phiEnd: -1.45, lean: 0.02, forkRate: 0, hard: true, rgb: spec.coatRgb ?? [18, 15, 16] });
      else if (coat === 'stripes') coatBars(c, limb, r, lp, { count: 5, width: 0.85, phiEnd: -0.95, forkRate: 0 });
      else if (coat === 'spots') coatSpots(c, limb, r, lp, { count: 20, size: 0.52, soft: 0.14, rgb: [24, 17, 10] });
      else if (coat === 'rosettes') coatRosettes(c, limb, r, lp, { count: 7, size: 0.5 });
      else if (coat === 'patches') coatPatches(c, limb, r, lp, { nu: 4, nphi: 3, seam: 0.78, rgb: [126, 74, 26] });
      else if (coat === 'panda') coatBlocks(c, limb, lp, [{ u0: 0, u1: 1, phiLo: -1.6, phiHi: 1.7, rgb: '#15181e' }]);
    }
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
    /* a tucked forelimb ends in a small held paw, not a foot planted on the
       ground line — drawFoot draws at `groundY` by construction */
    if (hanging) {
      /* THE HOOK. A sloth's claws are the whole animal — two or three scythes
         that close OVER the branch, and they carry its entire weight. */
      c.strokeStyle = `rgba(${226 * m | 0},${220 * m | 0},${200 * m | 0},0.95)`;
      c.lineWidth = Math.max(2, legW * 0.30); c.lineCap = 'round';
      for (let k = -1; k <= 1; k++) {
        const hx2 = ft[0] + k * legW * 0.34;
        c.beginPath();
        c.moveTo(hx2, ft[1] + legW * 0.10);
        c.quadraticCurveTo(hx2 + legW * 0.22, branchY - legW * 0.42, hx2 - legW * 0.30, branchY - legW * 0.52);
        c.stroke();
      }
    } else if (tucked(hind)) {
      const dk = (k: number): string => `rgb(${p.cr * k * m | 0},${p.cg * k * m | 0},${p.cb * k * m | 0})`;
      c.fillStyle = dk(0.54);
      c.beginPath(); c.ellipse(ft[0], ft[1], legW * 0.52, legW * 0.40, 0.3, 0, TAU); c.fill();
    } else {
      drawFoot(ft[0], m, hind);
    }
  };
  /* ★ LIMB PAIRS. The genome's locomotion genes have described many-legged
     creatures since v1.0 and the art has only ever drawn four legs. Pairs are
     spaced along the torso so a six- or eight-legged animal still reads as
     one body, not a train of hips — and they sit under the HAUNCH and the
     SHOULDER, the two places the radius profile puts the mass. */
  const pairs = spec.alien?.legPairs ?? 2;
  const legUs: number[] = [];
  for (let i = 0; i < pairs; i++) legUs.push(0.175 + (i / Math.max(1, pairs - 1)) * 0.665);
  const coat = spec.coat ?? 'plain';
  /* ★ WAVE 62 — A PINNIPED HAS NO STANDING LEGS. The quadruped leg loop gave
     Seal/Sea Lion/Fur Seal four dog legs with paw pads ("the terrestrial
     quadruped loaf", gp3/5). A pinniped rests its bulk on the ground: one broad
     FORE-flipper sweeps down-and-back from the chest, and the HIND flippers
     trail straight back from the rump as a fan. Walrus keeps this too. */
  if (FAM0.foot === 'flipper') {
    const dk = (k: number): string => `rgb(${p.cr * k | 0},${p.cg * k | 0},${p.cb * k | 0})`;
    /* hind flippers: two stacked fans trailing back past the rump */
    const rump = AX(0.02);
    for (const [dy, m] of [[-bodyH * 0.10, 0.55], [bodyH * 0.06, 1]] as const) {
      const fy = rump[1] + bodyH * 0.22 + dy, fx = rump[0] - bodyW * 0.06;
      c.fillStyle = dk(0.62 * m);
      c.beginPath(); c.moveTo(fx, fy);
      c.quadraticCurveTo(fx - bodyW * 0.34, fy - bodyH * 0.24, fx - bodyW * 0.52, fy - bodyH * 0.10);
      c.quadraticCurveTo(fx - bodyW * 0.40, fy + bodyH * 0.06, fx - bodyW * 0.52, fy + bodyH * 0.22);
      c.quadraticCurveTo(fx - bodyW * 0.30, fy + bodyH * 0.24, fx, fy + bodyH * 0.10);
      c.closePath(); c.fill();
      c.strokeStyle = `rgba(0,0,0,0.25)`; c.lineWidth = 1.4;   /* the digit rays */
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(fx - bodyW * 0.08, fy + bodyH * 0.02); c.lineTo(fx - bodyW * 0.48, fy - bodyH * 0.08 + i * bodyH * 0.14); c.stroke(); }
    }
    /* the fore-flipper: a broad paddle from the chest, angled down-back */
    const chest = AX(0.78);
    c.fillStyle = dk(0.58);
    c.save(); c.translate(chest[0] - bodyW * 0.05, chest[1] + bodyH * 0.30); c.rotate(0.9);
    c.beginPath(); c.ellipse(0, bodyH * 0.22, bodyW * 0.11, bodyH * 0.34, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.4;
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * bodyW * 0.035, bodyH * 0.04); c.lineTo(i * bodyW * 0.05, bodyH * 0.5); c.stroke(); }
    c.restore();
  } else {
  for (const u of legUs) drawLeg(u, -legW * 0.66, u < 0.5, true);      /* far side, shaded */
  for (const u of legUs) drawLeg(u, legW * 0.34, u < 0.5, false);      /* near side */
  }

  /* ═══ the neck is computed AND DRAWN BEFORE THE TORSO (wave 6) ═══
     It used to be drawn over the body, so its outline crossed the shoulder
     and its own countershading disagreed with the body's along that line —
     a wedge stuck onto the chest, which is exactly the defect the legs had
     before wave 4. Same answer, and it needs no blending: on a real animal
     the base of the neck IS inside the body, so root it in the chest and
     let the torso's own mass cover the join (D-ART-94). */
  /* ---- neck + head: where most species are actually recognized ---- */
  const neckLen = S * spec.neck;
  /* ★ WAVE 40 — the shoulder is a point ON THE BODY, and it was hand-computed
     from cx/topY, so a re-posed animal left its neck and head behind in the
     old horizontal frame. Derived from the axis for a posed animal, which is
     where it should always have come from. */
  const shoulderX = spec.pose ? AX(0.92)[0] : cx + bodyW * 0.82;
  const shoulderY = spec.pose ? AX(0.92)[1] : topY(1) + bodyH * 0.12;
  /* ★ WAVE 51 — the neck's ELEVATION is the family's, not a constant. The old
     pair (0.55, 0.86) is one vector of length 1.0208 at 1.0026 rad off
     horizontal; keeping that length and swinging only the ANGLE means a
     family at carry = 1 lands on the identical point (byte-unchanged), while
     a carnivore's skull comes down to the withers and is thrown FORWARD by
     the same neck. See the `carry` note in FAMILY. */
  const carryF = spec.carry ?? FAM0.carry;
  const neckAng = 1.0026 * (0.10 + 0.90 * carryF);
  const neckReach = neckLen * 1.0208;
  const headX = shoulderX + neckReach * Math.cos(neckAng);
  const headY = shoulderY - neckReach * Math.sin(neckAng);
  /* ★ WAVE 22b — A HEAD BELONGS TO THE ANIMAL'S LENGTH, not only its depth.
     Sized purely off bodyH, a sand cat got a 28px skull on a 210px body — 13%,
     where a real carnivore's head is about a fifth of its body. Long shallow
     animals came out as tubes with a pea on the end. Deep-bodied, heavy-jawed
     species are unchanged, because for them the depth term still wins. */
  const headR = Math.max(
    bodyH * (spec.jaw === 'barrel' ? 0.62 : spec.jaw === 'broad' ? 0.52 : 0.42),
    bodyW * 0.20,
  ) * (FAM0.headScale ?? 1);
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
    /* ★ WAVE 51 — the mid control swings WITH the head, or a lowered head just
       bends the neck into an arch that rises and falls again. The old pair
       (0.30, -0.45)·neckLen is 0.5408·neckLen at 0.0198 rad under the head
       vector, so expressing it that way is exact at carry = 1. */
    const cA = neckAng - 0.0198, cR = neckLen * 0.5408;
    return [m * m * ax + 2 * m * t * (shoulderX + cR * Math.cos(cA)) + t * t * headX,
      m * m * ay + 2 * m * t * (shoulderY - cR * Math.sin(cA)) + t * t * headY];
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
  if (!spec.alien?.skin) coatMaterial(c, neckTube, r, p, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL * 0.55 });
  /* the coat CONTINUES onto the neck — a giraffe's patches run up it, a
     tiger's bars cross it. A pattern that stops at the shoulder is a shirt. */
  if (coat === 'patches') coatPatches(c, neckTube, r, p, { nu: 7, nphi: 4, seam: 0.78, rgb: [126, 74, 26] });
  else if (coat === 'stripes') coatBars(c, neckTube, r, p, { count: 7, width: 0.9, phiEnd: -0.9, forkRate: 0.1 });
  else if (coat === 'bands') coatBars(c, neckTube, r, p, { count: 9, width: 1.1, phiEnd: -1.4, lean: 0.02, forkRate: 0, hard: true, rgb: [18, 15, 16] });
  else if (coat === 'spots') coatSpots(c, neckTube, r, p, { count: 34, size: 0.8, soft: 0.13, rgb: [24, 17, 10] });
  else if (coat === 'rosettes') coatRosettes(c, neckTube, r, p, { count: 12, size: 0.8 });
  else if (coat === 'shaggy') coatShaggy(c, neckTube, r, p, { count: 46 });
  c.restore();
  if (coat === 'shaggy') shaggyRim(c, neckTube, r, p, Math.max(4, bodyH * 0.095), 0.70);
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
  /* ★ THE MATERIAL LAYER, between the shading and the markings — fur, pelt or
     hide laid in the body own coordinates so it wraps the form. This is the
     prototype for the graphics upgrade; MAT_DETAIL is the cost dial. */
  if (!spec.alien?.skin) coatMaterial(c, body, r, p, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL });
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
    coatBars(c, body, r, p, { count: 21, width: 1.25, phiTop: 1.66, phiEnd: -1.42, lean: 0.03, forkRate: 0.12, hard: true,
      rgb: spec.coatRgb ?? [18, 15, 16],
      ...(spec.coatZone ? { u0: spec.coatZone[0], u1: spec.coatZone[1] } : {}) });
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
    /* ★ wave 35 — A PANDA'S RUMP IS WHITE. Two full-girth bands, one at each
       end, is a BELTED COW, and Nick's row says exactly that: "the body is a
       cow-like quadruped". The real animal has ONE black band — the shoulder
       yoke that carries down into the forelegs — over an otherwise white body.
       So the rear band goes, and the front one pulls back off the neck to sit
       where a shoulder actually is. */
    /* ⚠ and the prescribed 0.60–0.86 was checked by rendering it: it leaves a
       WHITE CHEST in front of the black, so the band read as a saddle rather
       than a shoulder yoke. A panda's black runs from mid-back FORWARD through
       the shoulders and chest, stopping at the white neck. */
    coatBlocks(c, body, p, [
      { u0: 0.64, u1: 1.0, phiLo: -1.5, phiHi: 1.6, rgb: '#15181e' },
    ]);
  } else if (coat === 'brindle') {
    coatBrindle(c, body, r, p, { count: 120 });
  } else if (coat === 'shaggy') {
    coatShaggy(c, body, r, p, { count: 170 });
  } else if (coat === 'banded' && !spec.alien?.skin) {
    /* ★ WAVE 39 — THE ARMOUR BANDS WERE TRIANGULAR WEDGES. `phiEnd: -1.2`
       against `phiTop: 1.6` tapers each bar to a point well above the belly, so
       an armadillo's and a pangolin's hinged bands rendered as "pale triangular
       wedges that read as tiger stripes rather than hinged bands" — the
       verifier's words, and the reason both animals read as painted rather than
       armoured. A carapace band is a HOOP: it runs the full girth at constant
       width. Narrower, more of them, and carried right down to the ventral
       line so nothing tapers. */
    coatBars(c, body, r, p, { count: 10, width: 1.35, phiTop: 1.66, phiEnd: -1.52, lean: 0, forkRate: 0, hard: true, alpha: 0.5, rgb: [26, 20, 14] });
  }
  /* an alien SKIN FINISH replaces the coat treatment, inside the same clip
     so it reads as the animal's own surface and obeys the surface laws */
  if (spec.alien?.skin) alienSkin(c, spec.alien.skin, torsoForm, p, r);
  /* ★ THE OCCLUSION AT THE LIMB EXITS — the shadow a body casts into its own
     armpit and groin. Drawn inside the clip so it darkens the BODY where each
     leg passes under it, which is the other half of the join reading as one
     piece of anatomy rather than two shapes touching. */
  if (!spec.alien?.skin) {
    /* ★ wave 35 — IT WAS READING AS A PASTED DISC, not as a shadow. At alpha
       0.40 over a radius of 0.95·rr, centred only 0.66·rr below the axis, the
       gradient reached well ABOVE the axis and covered most of the flank — so
       on any pale deep-bodied animal it showed as a dark circle punched into
       the side. Three independent audit rows describe the same artifact:
       Elk's "shoulder and haunch decals", Saiga's "airbrushed disc", Polar
       Bear's "flat-disc primitive punched into the rump".
       An armpit shadow is small, faint, and entirely BELOW the axis — so it is
       clipped there, which is what stops it becoming a decal no matter how deep
       the body is. */
    for (const u of legUs) {
      const a = AX(u), rr = RAD(u);
      const oy = a[1] + rr * 0.62, orad = rr * 0.55;
      const og = c.createRadialGradient(a[0], oy, orad * 0.06, a[0], oy, orad);
      og.addColorStop(0, 'rgba(12,9,10,0.18)');
      og.addColorStop(0.55, 'rgba(12,9,10,0.09)');
      og.addColorStop(1, 'rgba(12,9,10,0)');
      c.save();
      c.beginPath(); c.rect(a[0] - orad * 1.3, a[1], orad * 2.6, rr * 1.8); c.clip();
      c.fillStyle = og;
      c.beginPath(); c.ellipse(a[0], oy, orad, orad * 0.78, 0, 0, TAU); c.fill();
      c.restore();
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
    /* ★ wave 35 — SHORTER AND DENSER. At 0.20·bodyH the strands were long
       enough to read individually, so even a correctly-hanging coat came out
       as a palisade of separate spikes. Shaggy is MASS: many short overlapping
       tufts make a ragged edge, a few long ones make a hedgehog. */
    shaggyRim(c, body, r, p, Math.max(6, bodyH * 0.125), 0.88);
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
  /* ⚠ THE FLAT HUMP DOME IS GONE (wave 38). It was two `p.base` half-ellipses
     drawn here — after the coat, after the material, after the rim light — so a
     camel's hump was the one part of the animal wearing no fur, finished with a
     hard pale outline stroke. `humpAt()` in topY now carries them, so there is
     no second shape to seam against the first. `seat()` also still anchored to
     the pre-wave-7 back line while the drawn silhouette had moved to the tube's
     envelope; the tail got that correction in wave 7 and the humps never did. */


  /* ★ WAVE 22b — THE MANE (Nick: "the lion head with mane looks awful, can't
     even tell its face"). It is drawn HERE — before the head, behind it — and
     offset BACK from the face, because a mane that is centred on the skull
     covers the muzzle and eyes and the animal loses the only part anyone
     reads. A real mane frames a face; it never fills it. */
  if (spec.mane === 'crest' || spec.mane === 'crestUp') {
    /* ★ GOLD AUDIT — THE EQUID MANE: hair rooted along the TOP EDGE of the
       neck from poll to withers. 'crest' hangs (horse); 'crestUp' stands
       erect (donkey/zebra/wild ass). Its absence was the audit's #1 equid
       complaint after the body itself. */
    const dxn = headX - nRoot[0], dyn = headY - nRoot[1];
    const L3 = Math.hypot(dxn, dyn) || 1;
    let nxv = dyn / L3, nyv = -dxn / L3;
    if (nyv > 0) { nxv = -nxv; nyv = -nyv; }            /* the crest is the UPPER edge */
    const bakX = -dxn / L3, bakY = -dyn / L3;           /* back toward the withers */
    const up = spec.mane === 'crestUp';
    const mr2 = mulberry32((((g.seed as number) ^ 0x4A9E) >>> 0));
    c.lineCap = 'round';
    for (let i = 0; i < (up ? 34 : 44); i++) {
      const t = 0.04 + (i / (up ? 33 : 43)) * 0.94;
      const s3 = t * t * (3 - 2 * t);
      const nr3 = RAD(nRootU) * 0.98 * nThick * (1 - s3) + headR * 0.52 * s3;
      const [qx, qy] = nq(t);
      const bx3 = qx + nxv * nr3 * 0.92, by3 = qy + nyv * nr3 * 0.92;
      const shade3 = 0.30 + mr2() * 0.22;
      c.strokeStyle = `rgb(${p.cr * shade3 | 0},${p.cg * shade3 | 0},${p.cb * shade3 | 0})`;
      c.lineWidth = up ? 2.6 + mr2() * 1.6 : 2.0 + mr2() * 2.0;
      const hl = up ? nr3 * (0.42 + mr2() * 0.22) : nr3 * (1.05 + mr2() * 0.55);
      c.beginPath(); c.moveTo(bx3, by3);
      if (up) {   /* erect brush: short strokes standing off the crest */
        c.lineTo(bx3 + nxv * hl + bakX * hl * 0.25, by3 + nyv * hl + bakY * hl * 0.25);
      } else {    /* hanging sheet: hair falls back-and-down over the neck side */
        c.quadraticCurveTo(bx3 + bakX * hl * 0.35 + nxv * hl * 0.35, by3 + nyv * hl * 0.35 + hl * 0.30,
          bx3 + bakX * hl * 0.55, by3 + hl * 0.95);
      }
      c.stroke();
    }
    /* the forelock, falling between the ears onto the forehead */
    if (!up) {
      const fs = 0.32;
      c.strokeStyle = `rgb(${p.cr * fs | 0},${p.cg * fs | 0},${p.cb * fs | 0})`;
      for (let i = 0; i < 5; i++) {
        c.lineWidth = 1.8 + mr2() * 1.4;
        c.beginPath(); c.moveTo(headX + (i - 2) * 2, headY - headR * 0.85);
        c.quadraticCurveTo(headX - headR * 0.35, headY - headR * 0.55 + i, headX - headR * (0.45 + mr2() * 0.2), headY - headR * 0.15); c.stroke();
      }
    }
  } else if (spec.mane) {
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
  /* ★ wave 35 — the head's family, which is the body's family unless the row
     says otherwise (see QuadSpec.skull) */
  const SK = SKULL[spec.skull ?? spec.family ?? 'generic']!;
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
  /* ★ WAVE 53 — A SKULL IS NOT SYMMETRIC ABOUT ITS OWN AXIS, and drawing it
     that way is most of why every head read as a faceted wedge. `headProf` is
     described in its own comment as "the profile of the face: braincase, the
     stop, the muzzle" — and all three of those are DORSAL features. Mirroring
     them underneath put a braincase-sized bulge below the axis where a throat
     should be, and dug the stop's dip into the underside of the muzzle, so the
     head came out as a spindle with a pinch in the middle instead of a skull.
     The ventral line of a real head is much shallower and has no stop at all:
     it runs from the angle of the jaw forward to the chin in one easy taper.
     Now that `Tube` carries a second profile (wave 52) that is simply sayable. */
  const headProfV = spline([
    [0.00, skCran * 0.50],
    [0.18, skCran * 0.82],   /* the cheek and the angle of the jaw */
    [0.42, skMuz * 1.22],    /* no stop underneath — the line runs on through */
    [0.70, skMuz * 0.90],
    [1.00, skMuz * 0.58],    /* the chin sits well above the nose */
  ]);
  const head = new Tube({ P: headAxis, R: headProf, Rv: headProfV });
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
  if (!spec.alien?.skin) coatMaterial(c, head, r, p, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL * 0.40, len: 0.7 });
  /* the coat runs onto the face — a tiger is striped across the cheek, a
     giraffe patched over the crown. A pattern that stops at the ears is a hood. */
  if (coat === 'patches') coatPatches(c, head, r, p, { nu: 4, nphi: 3, seam: 0.76, rgb: [126, 74, 26] });
  else if (coat === 'stripes') coatBars(c, head, r, p, { count: 6, width: 0.75, phiEnd: -0.8, forkRate: 0 });
  else if (coat === 'spots') coatSpots(c, head, r, p, { count: 22, size: 0.62, soft: 0.16, rgb: [24, 17, 10] });
  else if (coat === 'rosettes') coatRosettes(c, head, r, p, { count: 7, size: 0.6 });
  else if (coat === 'shaggy') coatShaggy(c, head, r, p, { count: 34 });
  c.restore();
  /* ★ WAVE 16 — THE CHEEK. Without a jowl the muzzle leaves the skull as a
     plank: the audit's words on animal after animal. A cat's broad cheek ruff,
     a horse's masseter, a bear's heavy jaw — all the same mass in different
     amounts, and it is what makes a head read as a skull with meat on it. */
  if (SK.cheek > 0.05) {
    const ck = head.pt(0.34, -0.30);
    const cr2 = headR * SK.cheek * 0.66;
    const cg2 = c.createRadialGradient(ck[0], ck[1], cr2 * 0.1, ck[0], ck[1], cr2);
    const cl = body.light(0.95, -0.2);
    const cm = 0.62 + cl * 0.62;
    cg2.addColorStop(0, `rgba(${Math.min(255, p.cr * cm) | 0},${Math.min(255, p.cg * cm) | 0},${Math.min(255, p.cb * cm) | 0},0.85)`);
    cg2.addColorStop(1, `rgba(${Math.min(255, p.cr * cm) | 0},${Math.min(255, p.cg * cm) | 0},${Math.min(255, p.cb * cm) | 0},0)`);
    c.fillStyle = cg2;
    c.beginPath(); c.ellipse(ck[0], ck[1], cr2 * 1.15, cr2 * 0.92, -0.12, 0, TAU); c.fill();
  }

  /* the nose, ON the end of the muzzle rather than beside it */
  const nosePt = head.pt(0.965, -0.10);
  /* ★ D-ART-100 AGAIN, wave 35 — `SKULL.nosePad` was read by the 'wet' branch
     ONLY. The suid's 1.30 and the pachyderm's 0.70 were set, documented as
     "how big the nose pad is against the muzzle end", and could not change the
     drawing, because the two branches that need it most never looked. speccheck
     is structurally blind to this one: the field IS read, so it is not inert —
     it is inert ON THREE QUARTERS OF ITS USERS, which no gate here can see.
     Grep every reader of a field, not just the first. */
  const npad = SK.nosePad;
  if (name === 'Saiga') {
    /* ★ GOLD AUDIT — "the defining enlarged inflatable-looking nasal structure
       is missing/too subtle. Make the bulbous hanging nose the dominant facial
       trait." A saiga's proboscis is a swollen trunk that overhangs the mouth
       and points DOWN. Drawn over the muzzle end, in coat colour. */
    c.save(); c.translate(nosePt[0], nosePt[1]); c.rotate(ang); c.scale(1.45, 1.45);
    const bg2 = c.createRadialGradient(-skMuz * 0.2, -skMuz * 0.3, skMuz * 0.1, 0, 0, skMuz * 1.3);
    bg2.addColorStop(0, p.lit); bg2.addColorStop(0.55, p.base); bg2.addColorStop(1, p.dark);
    c.fillStyle = bg2;
    c.beginPath();
    c.moveTo(-skMuz * 0.9, -skMuz * 0.55);
    c.quadraticCurveTo(skMuz * 0.75, -skMuz * 0.70, skMuz * 0.72, skMuz * 0.25);   /* swollen bridge */
    c.quadraticCurveTo(skMuz * 0.66, skMuz * 0.95, skMuz * 0.10, skMuz * 1.02);   /* the drooping tip */
    c.quadraticCurveTo(-skMuz * 0.55, skMuz * 0.90, -skMuz * 0.9, skMuz * 0.30);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(24,16,18,0.72)';   /* downward nostrils at the tip */
    for (const s2 of [-1, 1] as const) {
      c.beginPath(); c.ellipse(skMuz * (0.30 + s2 * 0.14), skMuz * 0.88, skMuz * 0.11, skMuz * 0.16, 0.2, 0, TAU); c.fill();
    }
    c.restore();
  } else if (SK.nose === 'disc') {
    /* a pig's rostral disc: a flat plate seen almost edge-on, with two pits */
    c.fillStyle = `rgb(${Math.min(255, p.cr * 1.12) | 0},${p.cg * 0.86 | 0},${p.cb * 0.88 | 0})`;
    c.save(); c.translate(nosePt[0], nosePt[1]); c.rotate(ang);
    c.beginPath(); c.ellipse(0, 0, skMuz * 0.42 * npad, skMuz * 0.92 * npad, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(28,18,20,0.62)';
    for (const s2 of [-1, 1] as const) { c.beginPath(); c.ellipse(skMuz * 0.10 * npad, s2 * skMuz * 0.34 * npad, skMuz * 0.13 * npad, skMuz * 0.19 * npad, 0, 0, TAU); c.fill(); }
    c.restore();
  } else if (SK.nose === 'nostril') {
    /* a grazer has no black button — just a soft nostril slit in coat colour */
    c.strokeStyle = 'rgba(26,18,20,0.55)'; c.lineWidth = Math.max(1.6, skMuz * 0.16 * npad); c.lineCap = 'round';
    c.beginPath();
    c.moveTo(nosePt[0] - skMuz * 0.30 * npad, nosePt[1] - skMuz * 0.12 * npad);
    c.quadraticCurveTo(nosePt[0] - skMuz * 0.02, nosePt[1] - skMuz * 0.30 * npad, nosePt[0] + skMuz * 0.14 * npad, nosePt[1] - skMuz * 0.04);
    c.stroke();
  } else {
    /* ⚠ EVERY MAMMAL HAD THE SAME SMALL DARK DOT. A nose pad is sized against
       the muzzle it sits on — a dog's takes a quarter of its snout end, a
       bear's is enormous, a cat's is a stud — and the audit called it "a dot
       nose" on animal after animal. */
    const np = skMuz * 0.46 * npad;
    c.fillStyle = 'rgba(20,14,16,0.86)';
    c.beginPath(); c.ellipse(nosePt[0], nosePt[1] - np * 0.24, np, np * 0.80, ang, 0, TAU); c.fill();
    /* the two nostril slits, which is what makes it a NOSE and not a bead */
    c.fillStyle = 'rgba(0,0,0,0.55)';
    for (const s2 of [-1, 1] as const) {
      c.beginPath();
      c.ellipse(nosePt[0] - np * 0.10, nosePt[1] - np * 0.24 + s2 * np * 0.34, np * 0.22, np * 0.13, ang + s2 * 0.5, 0, TAU);
      c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.20)';
    c.beginPath(); c.ellipse(nosePt[0] - skMuz * 0.12, nosePt[1] - skMuz * 0.26, skMuz * 0.15, skMuz * 0.10, ang, 0, TAU); c.fill();
  }
/* ★ WAVE 16 — THE LIP. One ruled quadratic across the face was "a straight
     mouth seam" in the audit's words on nearly every animal. A real mouth line
     starts at the corner under the cheek, runs forward along the jaw, and ends
     in a shape the family owns: a cat's upcurl, a horse's or a bear's droop, a
     camel's and a rodent's cleft upper lip. */
  const lipCol = 'rgba(18,12,12,0.42)';
  c.strokeStyle = lipCol;
  c.lineWidth = Math.max(1.4, headR * (spec.jaw === 'barrel' ? 0.13 : 0.062));
  c.lineCap = 'round';
  const q0 = head.pt(0.40, -0.86), q1 = head.pt(0.70, -1.02), q2 = head.pt(0.93, -0.70);
  c.beginPath(); c.moveTo(q0[0], q0[1]); c.quadraticCurveTo(q1[0], q1[1], q2[0], q2[1]); c.stroke();
  if (SK.lip === 'curl') {
    /* the corner hooks UP — the thing that makes a cat look like a cat */
    c.beginPath(); c.moveTo(q0[0], q0[1]);
    c.quadraticCurveTo(q0[0] - headR * 0.14, q0[1] - headR * 0.02, q0[0] - headR * 0.20, q0[1] - headR * 0.13);
    c.stroke();
  } else if (SK.lip === 'droop') {
    /* a heavy hanging lower lip: horse, bear, bovid */
    c.beginPath(); c.moveTo(q2[0], q2[1]);
    c.quadraticCurveTo(q2[0] + headR * 0.10, q2[1] + headR * 0.24, q2[0] - headR * 0.06, q2[1] + headR * 0.30);
    c.stroke();
  } else if (SK.lip === 'cleft') {
    /* the split upper lip of a camel or a rodent */
    c.beginPath(); c.moveTo(q2[0] - headR * 0.02, q2[1] - headR * 0.16);
    c.lineTo(q2[0] - headR * 0.02, q2[1] + headR * 0.05); c.stroke();
  }
  /* THE CHIN — a lower jaw that ends in something. Without it the muzzle has
     no depth and reads as a rectangle glued to the face. */
  if (SK.jaw > 0.10) {
    /* ★ D-ART-134 — phi −1.30 is BEYOND the ventral silhouette, so the chin
       ellipse hung in space below and ahead of the muzzle. That is the
       "floating lip bar" on Wild Pig and Peccary, the "hooked grey mechanical
       lip bar" on Llama, the "hard-edged tan stick projecting past the nose"
       on Wild Horse and the "detached lower lip" on Cattle — one artifact
       across five families. −0.95 sits it flush on the surface it belongs to. */
    const ch = head.pt(0.86, -0.95);
    c.fillStyle = `rgb(${(p.cr * 0.70) | 0},${(p.cg * 0.70) | 0},${(p.cb * 0.72) | 0})`;
    c.beginPath(); c.ellipse(ch[0], ch[1], headR * 0.20 * SK.jaw * 3, headR * 0.13 * SK.jaw * 3, ang, 0, TAU); c.fill();
  }

  /* ---- ears: family-defining (fennec vs hippo vs koala) ---- */
  const ears = spec.ears ?? 'small';
  /* ⚠ WAVE 4 — 'round' EARS WERE 0.62·headR AND SAT ON THE CROWN, so two dark
     discs wider than the skull merged into a fluffy cloud on the top of every
     cat and bear in the catalogue. A round ear is a small cup set at the
     TOP-BACK of the head; the ear is the read on a fennec, never on a tiger. */
  const earShape = spec.earShape ?? FAM0.ear;
  /* ★ D-ART-134 — 'hidden' means NO EXTERNAL EAR: a seal, a mole, a sloth. It
     had no branch below, so every one of them wore the default cup.
     ⚠ D-ART-137 — AND THE FIX FOR THAT WAS `return`, WHICH LEFT THE FUNCTION.
     Everything below this point — the face markings, THE EYE, the horns, the
     trunk and the TAIL — was skipped for every species that has no external
     ear. Sloth, Mole, Seal, Fur Seal, Sea Lion and Walrus rendered with a
     blank head and no eye at all, and the Walrus lost the tusks that ARE the
     animal. `earShape:'hidden'` suppresses an EAR; it was suppressing the
     face. Found by rendering the six, never by reading the table — the same
     lesson as D-ART-88, one level down: a fix can be correct about the thing
     it names and wrong about where it stops. */
  const earR = headR * (ears === 'huge' ? 1.15 : ears === 'large' ? 0.62 : ears === 'round' ? 0.38 : ears === 'small' ? 0.30 : 0.17) * (spec.earScale ?? 1);
  if (earShape === 'hidden') {
    /* no external pinna — draw nothing, and fall through to the face */
  } else if (ears === 'fan') {
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
    /* ★ wave 36 — IT WAS A FLAT DARK ELLIPSE, and its own comment above claims
       it is "drawn behind the head so the head overlaps its root" — it is drawn
       AFTER the head, so it never was. Another documented-but-false claim, the
       same shape as D-ART-137. Two fixes: the fan is shaded across its span
       like the piece of skin it is (an elephant's ear is thin and lit through,
       pale at the ragged margin, dark in the folded hollow) rather than filled
       with one p.dark; and it is set further back so the cheek and the eye stay
       clear of it. */
    const es = spec.earScale ?? 1;
    const fw = headR * 1.16 * es, fh = headR * 1.72 * es;
    const fx = headX - headR * 1.22, fy = headY + headR * 0.24;
    for (const s of [-1, 1] as const) {
      const off = s * headR * 0.16;
      const fg = c.createLinearGradient(fx + off + fw * 0.40, fy - fh * 0.40, fx + off - fw * 0.90, fy + fh * 0.50);
      const k2 = s < 0 ? 0.52 : 1;
      const tone = (v: number): string =>
        `rgb(${Math.min(255, p.cr * v * k2) | 0},${Math.min(255, p.cg * v * k2) | 0},${Math.min(255, p.cb * v * k2) | 0})`;
      fg.addColorStop(0, tone(0.46));      /* the hollow where it meets the skull */
      fg.addColorStop(0.55, tone(0.78));
      fg.addColorStop(1, tone(1.06));      /* the thin lit margin */
      c.fillStyle = fg;
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
      /* ★ D-ART-136 — THE EARS WERE 0.22·headR APART. Any ear bigger than
         ~0.25·headR therefore overlapped ITSELF into a single blob, and
         'huge' (1.15·headR) produced one cone or disc larger than the whole
         cranium. That one number owns the Fennec Fox, Serval, Sand Cat, Maned
         Wolf, African Wild Dog, Polar Bear and Wild Ass blockers — seven
         species reported as "a single giant disc-ear pasted over the skull".
         The separation now SCALES with the ear, so a big ear pushes its pair
         apart instead of swallowing it, and the far ear sits back and smaller
         for depth. */
      /* ★ wave 36 — THE ROOT SEPARATION SCALED WITH THE EAR'S SIZE, and it is
         the skull that decides where an ear is rooted, not the ear. At
         earR 1.96·headR (Donkey) the pair was pushed 1.38·headR apart while
         each triangle was 1.44·headR wide, so the two ears MERGED into one
         grey blob larger than the head — Nick saw it on the proof sheet. The
         roots are a property of the cranium and are fixed here; a longer ear
         SPLAYS outward instead of translating away from its own pair, which
         is what a real long-eared animal does. */
      /* ★ WAVE 38, G1 — THE ROUND EAR WAS RENDERING AS A COILED HORN, and it is
         the single most-reported defect in the 1,250-asset gold pass: nine
         verifiers independently wrote "a spiral horn-disc", "a coiled
         horn/shell", "a concentric spiral disc where the ear should be", across
         Jaguar, Leopard, Tiger, Clouded Leopard, Ocelot, Cougar, Panda, Red
         Panda, Possum, Sloth Bear, Spectacled Bear, Kinkajou, Coati, Pangolin,
         Sloth and Meerkat — ~60 mammals, every family whose default ear is
         'round'.
         ⚠ AND WAVE 36 MADE IT WORSE. Fixing the donkey's merged pair, I cut the
         root separation from 0.46·headR to 0.38 and lifted both ears clear of
         the skull. For a 'round' ear (earR = 0.38·headR, cup 0.92·earR wide)
         that seats two two-tone ellipses CONCENTRICALLY on the crown — near
         cup, far cup inside it, concha inside that — and concentric rings on a
         skull read as a horn. A fix correct for the case it was looking at,
         wrong for the sibling case in the same branch: the partial-fix defect
         this file already records twice.
         Three changes, and the third is the one that kills the ring:
           1. the pair sits ON THE SIDE of the skull, not above it, so the ear
              base is occluded by the head and cannot close into a disc;
           2. the roots separate with the ear so near and far never nest;
           3. the far ear is SMALLER and gets NO concha — it is a silhouette
              behind, not a second ring inside. */
      const sepE = 0.30 + (earR / headR) * 0.42;
      const ex = headX - headR * (s < 0 ? sepE + 0.20 : Math.max(0.12, sepE - 0.24));
      /* the ear grows UP from the skull, but its BASE stays buried in the head:
         an ear that clears the crown entirely is a shape sitting on an animal */
      const ey = headY - headR * 0.30 - earR * 0.34;
      const m = s < 0 ? 0.62 : 1;
      /* ★ wave 36 — AND IT WAS FILLED AT 0.52 OF THE COAT, which on any pale
         animal is not an ear, it is a HOLE. That flat dark shape is most of why
         the donkey's pair read as one grey mass even once the geometry was
         right, and why 53 'large'-eared species all wear the same dark cap.
         The BACK of a real ear is coat-coloured, a shade under the flank; the
         dark part is the concha inside it, which the `inner` fill below already
         draws. Contrast belongs between the two surfaces, not between the ear
         and the animal. */
      c.fillStyle = `rgb(${Math.min(255, p.cr * 0.86 * m) | 0},${Math.min(255, p.cg * 0.84 * m) | 0},${Math.min(255, p.cb * 0.84 * m) | 0})`;
      /* ⚠ WAVE 13 SHIPPED HALF A FIX. The shape switch below was added, but this
         branch — taken by every 'large' and 'huge' ear — was left drawing the old
         two-tone ellipse, so earShape did nothing for a wild dog, an aardvark, a
         deer, a rabbit or a fennec. The mammal re-measure caught it in one line:
         "the same two-leaf token used on the African Wild Dog and the Armadillo".
         SIZE and SHAPE are orthogonal — 'ears' sets how big, 'earShape' sets what
         kind — and the size branch had quietly been deciding both. Same lesson as
         the speccheck blind spot: a fix that covers part of its own surface reads
         as done and is not. */
      {
        /* ★ WAVE 13 — THE EAR SHAPE. Everything here used to be one rounded cup
           at four sizes, which is most of why a wolf, a deer and a bear read as
           the same head. Each shape below is a family signature legible at
           thumbnail size, and it is the FIRST thing that differs. */
        /* the concha: a warm SHADOWED cavity, not a pale wash. With the ear's
           back now at coat tone (above), this is what carries the read — an ear
           is two surfaces at different angles to the light, and the inner one
           is always the darker in profile. */
        const inner = `rgba(${Math.min(255, p.cr * 0.46) | 0},${Math.min(255, p.cg * 0.36) | 0},${Math.min(255, p.cb * 0.35) | 0},${0.78 * m})`;
        /* ★ WAVE 38, G1 — THE FAR EAR IS A SILHOUETTE, NOT A SECOND EAR. Drawn
           at the same size with its own concha it became a ring nested inside
           the near ear's ring, and that pair of rings IS the reported "coiled
           horn". A real far ear in profile is smaller (further away), flatter
           (edge-on) and shows no cavity at all. `far` gates every concha fill
           in the shape switch below. */
        const far = s < 0;
        /* the splay: a short ear sits nearly upright, a long one leans out, so
           a donkey reads as two long ears in a V and never as one mass */
        c.save(); c.translate(ex, ey); c.rotate(-s * (0.18 + (earR / headR) * 0.34));
        if (far) c.scale(0.80, 0.88);
        if (earShape === 'point' || earShape === 'tuft') {
          /* a canid/equid triangle: straight sides to a sharp tip */
          c.beginPath();
          c.moveTo(-earR * 0.72, earR * 0.52);
          c.lineTo(0, -earR * 1.15);
          c.lineTo(earR * 0.72, earR * 0.46);
          c.closePath(); c.fill();
          if (!far) {
            c.fillStyle = inner;
            c.beginPath();
            c.moveTo(-earR * 0.36, earR * 0.30);
            c.lineTo(0, -earR * 0.72);
            c.lineTo(earR * 0.36, earR * 0.26);
            c.closePath(); c.fill();
          }
          if (earShape === 'tuft') {
            /* the black brush a lynx and a caracal wear on the tip, which is
               the entire difference between them and any other cat */
            c.strokeStyle = `rgba(18,15,12,${0.9 * m})`; c.lineCap = 'round';
            for (let i = -1; i <= 1; i++) {
              c.lineWidth = Math.max(1.4, earR * 0.13);
              c.beginPath(); c.moveTo(i * earR * 0.14, -earR * 1.05);
              c.lineTo(i * earR * 0.30, -earR * 1.85); c.stroke();
            }
          }
        } else if (earShape === 'leaf') {
          /* a deer's long oval, held out sideways and cupped forward */
          c.rotate(-s * 0.22);
          c.beginPath(); c.ellipse(0, -earR * 0.30, earR * 0.52, earR * 1.10, 0, 0, TAU); c.fill();
          if (!far) {
            c.fillStyle = inner;
            c.beginPath(); c.ellipse(0, -earR * 0.28, earR * 0.28, earR * 0.78, 0, 0, TAU); c.fill();
          }
        } else if (earShape === 'spoon') {
          /* a bovid's ear points OUT to the side, not up */
          c.rotate(s * 0.95);
          c.beginPath(); c.ellipse(0, -earR * 0.42, earR * 0.44, earR * 0.94, 0, 0, TAU); c.fill();
          if (!far) {
            c.fillStyle = inner;
            c.beginPath(); c.ellipse(0, -earR * 0.40, earR * 0.24, earR * 0.66, 0, 0, TAU); c.fill();
          }
        } else if (earShape === 'drop') {
          /* a pig's ear flops FORWARD over the eye */
          c.rotate(s * 0.30 + 0.55);
          c.beginPath();
          c.moveTo(-earR * 0.60, -earR * 0.40);
          c.quadraticCurveTo(earR * 0.75, -earR * 0.55, earR * 0.42, earR * 0.85);
          c.quadraticCurveTo(-earR * 0.10, earR * 0.50, -earR * 0.60, -earR * 0.40);
          c.closePath(); c.fill();
        } else {
          /* the rounded cup — a cat, a bear, a rodent */
          c.beginPath(); c.ellipse(0, 0, earR * 0.92, earR, 0, 0, TAU); c.fill();
          if (!far) {
            /* ★ WAVE 38, G1 — A CONCENTRIC CAVITY IS A RING, AND A RING ON A
               SKULL IS A HORN. The concha was an ellipse at (0, 0.08·earR)
               inside an ellipse at (0,0): dead centre, leaving an even rim all
               the way round. Stacked with the far ear's identical pair that is
               four nested ovals, which is exactly what the gold pass's nine
               verifiers described as a coiled horn or shell.
               A real conchal bowl is NOT concentric — it opens FORWARD, so the
               rim is thick at the back of the ear and thin at the front. Offset
               it toward the muzzle and the ring cannot close. */
            c.fillStyle = inner;
            c.beginPath();
            c.ellipse(earR * 0.24, earR * 0.10, earR * 0.40, earR * 0.64, -0.14, 0, TAU);
            c.fill();
          }
        }
        c.restore();
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
    /* ★ WAVE 51 — NO VISIBLE SCLERA. This was a near-white `#f2efe6` disc at the
       FULL eye radius with the iris drawn at 0.80 of it, so every mammal in the
       catalogue wore a pale ring all the way round its eye. A visible white
       sclera is a HUMAN trait: on a wolf, a cat, a bear or a horse seen in
       profile the aperture is essentially all iris, and the pale ring is most of
       why these faces read as toys. Nine family batches independently reported
       it as "a big circular eye with a pale sclera ring".
       It is also D-ART-141 exactly — on a dark animal the only light element
       should be STRUCTURAL, and this one is not. The specular glint below is
       the light the eye is actually entitled to. */
    /* ★ WAVE 13 — THE IRIS AND THE PUPIL. Every mammal in the catalogue had the
       same round black dot on the same white disc. A pupil is one of the
       strongest tells in nature — a cat's vertical slit, a goat's or a horse's
       HORIZONTAL BAR, which is the most recognisable eye any grazing animal has
       and was simply not drawn. */
    c.fillStyle = spec.iris ?? FAM0.iris;
    c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fill();
    const pup = spec.pupil ?? FAM0.pupil;
    c.fillStyle = '#0b0d12';
    if (pup === 'slit') {
      c.beginPath(); c.ellipse(ex, ey, er * 0.22, er * 0.74, 0, 0, TAU); c.fill();
    } else if (pup === 'bar') {
      c.beginPath(); c.ellipse(ex, ey, er * 0.74, er * 0.26, 0, 0, TAU); c.fill();
    } else {
      c.beginPath(); c.arc(ex, ey, er * 0.52, 0, TAU); c.fill();
    }
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
    /* ★ wave 35 — THE HORN WAS ANCHORED TO THE HEAD'S CENTRE. `headX + 0.9…1.5·
       headR` is a fixed offset from the middle of the skull, but the muzzle end
       is at headAxis(1.0) — 1.5–2.5·headR away on a long skull — so the horn
       floated beside the nose instead of standing on it, and on the Rhinoceros
       it read as a small cream nub pointing sideways off the face. The horn of a
       rhino IS the rhino. Anchored to the skull's own DORSAL surface, it stands
       on the nose at any skull length, and it is sized off headR so it reads. */
    c.fillStyle = '#d9cfbc';
    const nasalHorn = (base: [number, number], h: number): void => {
      const w = headR * 0.26;
      c.beginPath();
      c.moveTo(base[0] - w, base[1] + w * 0.24);
      /* swept forward, the way a real nasal horn curves */
      c.quadraticCurveTo(base[0] - w * 0.30, base[1] - h * 0.70, base[0] + w * 0.90, base[1] - h);
      c.quadraticCurveTo(base[0] + w * 0.86, base[1] - h * 0.44, base[0] + w, base[1] + w * 0.16);
      c.closePath(); c.fill();
    };
    /* the big anterior horn on the nose, then the smaller frontal one behind it */
    nasalHorn(head.pt(0.90, 1.24), headR * 1.30);
    if (horn === 'twinnose') nasalHorn(head.pt(0.60, 1.32), headR * 0.66);
  } else if (horn === 'ossicone') {
    c.strokeStyle = p.dark; c.lineWidth = 7; c.lineCap = 'round';
    for (const s of [-1, 1] as const) { c.beginPath(); c.moveTo(headX - headR * 0.1 + s * headR * 0.3, headY - headR * 0.6); c.lineTo(headX - headR * 0.15 + s * headR * 0.4, headY - headR * 1.25); c.stroke();
      c.fillStyle = '#3a2c1c'; c.beginPath(); c.arc(headX - headR * 0.15 + s * headR * 0.4, headY - headR * 1.3, 7, 0, TAU); c.fill(); }
  } else if (horn === 'palmate') {   /* moose */
    c.fillStyle = '#c9b596';
    for (const s of [-1, 1] as const) {
      /* ★ POLISH — the palms mount HIGH and tilt UP, not low-horizontal */
      c.save(); c.translate(headX - headR * 0.1, headY - headR * 0.95); c.scale(s, 1);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(headR * 1.0, -headR * 1.05, headR * 2.0, -headR * 1.30);
      c.quadraticCurveTo(headR * 2.1, -headR * 0.45, headR * 0.9, headR * 0.10);
      c.closePath(); c.fill();
      c.strokeStyle = '#c9b596'; c.lineWidth = 5; c.lineCap = 'round';
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(headR * (1.2 + i * 0.24), -headR * (0.95 + i * 0.10)); c.lineTo(headR * (1.3 + i * 0.28), -headR * (1.55 + i * 0.10)); c.stroke(); }
      c.restore();
    }
  } else if (horn === 'branched') {   /* deer/elk — caribou gets its own sweep */
    c.strokeStyle = '#b8a184'; c.lineWidth = 6; c.lineCap = 'round';
    const caribou = name === 'Caribou' || name === 'Reindeer';
    if (caribou) {
      /* ★ POLISH — long C-SWEPT beams arcing back then FORWARD over the head,
         plus the flat brow shovel over the nose: the caribou signature the
         generic three-tine fork could not say. */
      for (const s2 of [-1, 1] as const) {
        const bx0 = headX - headR * 0.15 + s2 * headR * 0.26, by0 = headY - headR * 0.6;
        c.lineWidth = s2 < 0 ? 5 : 6;
        c.beginPath(); c.moveTo(bx0, by0);
        c.bezierCurveTo(bx0 - headR * 1.3, by0 - headR * 1.2, bx0 - headR * 0.4, by0 - headR * 2.6, bx0 + headR * 0.9, by0 - headR * 2.35);
        c.stroke();
        for (let i = 0; i < 3; i++) {   /* tines off the top of the C */
          c.beginPath(); c.moveTo(bx0 - headR * (0.1 - i * 0.35), by0 - headR * (2.1 + i * 0.12));
          c.lineTo(bx0 + headR * (0.15 + i * 0.4), by0 - headR * (2.6 + i * 0.05)); c.stroke();
        }
      }
      /* the brow shovel: a flat palm jutting forward over the muzzle */
      c.fillStyle = '#b8a184';
      c.beginPath(); c.moveTo(headX - headR * 0.05, headY - headR * 0.55);
      c.quadraticCurveTo(headX - headR * 1.0, headY - headR * 0.85, headX - headR * 1.25, headY - headR * 0.35);
      c.quadraticCurveTo(headX - headR * 0.7, headY - headR * 0.25, headX - headR * 0.05, headY - headR * 0.35);
      c.closePath(); c.fill();
    } else
    for (const s of [-1, 1] as const) {
      const bx0 = headX - headR * 0.15 + s * headR * 0.28, by0 = headY - headR * 0.65;
      c.beginPath(); c.moveTo(bx0, by0); c.quadraticCurveTo(bx0 + s * headR * 0.7, by0 - headR * 1.1, bx0 + s * headR * 0.5, by0 - headR * 1.9); c.stroke();
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(bx0 + s * headR * (0.25 + i * 0.16), by0 - headR * (0.6 + i * 0.45)); c.lineTo(bx0 + s * headR * (1.0 + i * 0.2), by0 - headR * (0.9 + i * 0.5)); c.stroke(); }
    }
  } else if (horn === 'curl' || horn === 'boss' || horn === 'sweep') {
    /* ★ WAVE 38, G2 — `curl` DREW A CLOSED RING ACROSS THE FACE. The arc ran
       −0.4 → 4.2, which is 4.6 rad ≈ 264°, at lineWidth 9 with ROUND caps: the
       two ends come within a stroke width of each other and weld shut, so the
       horn rendered as a torus. Its centre was at headY − 0.2·headR — on the
       FACE, not above it — so the ring sat over the eye. Gaur, Banteng, Water
       Buffalo and Buffalo were all independently reported as "wearing a cream
       donut", and Takin's verify note found the ring drawn straight across the
       eye line. Impossible geometry at any size.
       Two rules now, and they are cheap to keep: an arc may not exceed ~180°,
       and it is rooted at the POLL — `head.pt(u≈0.28, phi≈1.15)`, the top-back
       of the skull behind the eye — never at a hand-written offset from the
       head's centre.
       And the token is SPLIT, because it was covering two different animals:
       a caprid curls back over its neck; a bovine's sweep out sideways from a
       heavy forehead boss and hook up. One shape could not be both, which is
       why all 13 species wore the same ring. */
    const poll = head.pt(0.28, 1.15);
    const hw = Math.max(4, headR * (horn === 'curl' ? 0.20 : 0.17));
    if (horn === 'boss') {
      /* the fused keratin helmet — a musk ox, a buffalo, a gaur. 'sweep' is
         the same family of horn WITHOUT it: a water buffalo carries enormous
         backswept crescents and no boss at all, which is the one feature that
         separates it from the buffalo/gaur/banteng cluster it was drawn into. */
      c.fillStyle = 'rgb(88,70,48)';
      c.beginPath();
      c.ellipse(poll[0] + headR * 0.06, poll[1] + headR * 0.08, headR * 0.74, headR * 0.36, -0.14, 0, TAU);
      c.fill();
      c.strokeStyle = 'rgba(40,30,18,0.7)'; c.lineWidth = 2.4;   /* the centre parting of the fused helmet */
      c.beginPath(); c.moveTo(poll[0] + headR * 0.06, poll[1] - headR * 0.24); c.lineTo(poll[0] + headR * 0.06, poll[1] + headR * 0.36); c.stroke();
    }
    c.lineCap = 'round';
    for (const s of [-1, 1] as const) {
      const m2 = s < 0 ? 0.70 : 1;   /* the far horn sits back and duller */
      c.strokeStyle = `rgb(${194 * m2 | 0},${174 * m2 | 0},${142 * m2 | 0})`;
      c.lineWidth = hw * (s < 0 ? 0.88 : 1);
      const bx = poll[0] - headR * (s < 0 ? 0.16 : 0);
      const by = poll[1] - headR * (s < 0 ? 0.10 : 0);
      if (horn === 'boss' || horn === 'sweep') {
        /* out and back, then hooking UP — never a closed curve. 'sweep' runs
           half again as far and much flatter: the crescent of a water buffalo. */
        const sw = horn === 'sweep';
        c.beginPath();
        c.moveTo(bx - headR * 0.26, by + headR * 0.06);
        c.quadraticCurveTo(bx - headR * (sw ? 1.50 : 1.00), by + headR * (sw ? 0.34 : 0.22),
          bx - headR * (sw ? 1.72 : 1.16), by - headR * (sw ? 0.30 : 0.46));
        c.stroke();
      } else {
        /* the caprid scimitar: up off the poll, over, and back down the neck.
           −0.44 → −3.50 counterclockwise is 3.06 rad ≈ 175°, comfortably open. */
        const R2 = headR * 0.74;
        const ccx = bx - R2 * 0.75, ccy = by + R2 * 0.35;
        c.beginPath(); c.arc(ccx, ccy, R2, -0.44, -3.50, true); c.stroke();
        /* the growth rings that make a horn keratin rather than a wire */
        if (s > 0) {
          c.strokeStyle = 'rgba(70,56,36,0.34)'; c.lineWidth = Math.max(1.2, hw * 0.20);
          for (let i = 1; i < 6; i++) {
            const a2 = -0.44 - (3.06 * i) / 6;
            const ux = Math.cos(a2), uy = Math.sin(a2);
            c.beginPath();
            c.moveTo(ccx + ux * (R2 - hw * 0.45), ccy + uy * (R2 - hw * 0.45));
            c.lineTo(ccx + ux * (R2 + hw * 0.45), ccy + uy * (R2 + hw * 0.45));
            c.stroke();
          }
        }
      }
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
        if (horn === 'straight') {
          /* ★ POLISH — the ANNULATIONS: ring ridges up the lower two-thirds,
             "smooth putty" was the verdict without them. Ticks across the
             horn's own quadratic path so they follow its sweep. */
          c.lineWidth = 2.2; c.strokeStyle = 'rgba(90,74,46,0.75)';
          const cx3 = bx2 + s * headR * 0.10, cy3 = by2 - HL * 0.6;
          const ex3 = bx2 - headR * 0.30 + s * headR * 0.34, ey3 = by2 - HL;
          for (let k = 1; k <= 6; k++) {
            const t = k / 10;   /* lower 60% of the horn */
            const mx3 = (1 - t) * (1 - t) * bx2 + 2 * (1 - t) * t * cx3 + t * t * ex3;
            const my3 = (1 - t) * (1 - t) * by2 + 2 * (1 - t) * t * cy3 + t * t * ey3;
            c.beginPath(); c.moveTo(mx3 - 4, my3 + 1.5); c.lineTo(mx3 + 4, my3 - 1.5); c.stroke();
          }
          c.lineWidth = 8; c.strokeStyle = '#cbb894';
        }
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
    /* ★ wave 35 — same centre-anchor bug as the nasal horn, and on the suids it
       was the more visible of the two: a warthog's tusks left the head beside
       the EYE and stood straight up like a second pair of horns. A tusk erupts
       from the mouth line, so it is anchored to the jaw side of the muzzle and
       the pair straddles it. Widths were fixed pixel counts (5, 6, 10) too, so
       an elephant and a warthog wore the same 10px tusk; they scale now. */
    c.fillStyle = '#efe6d4';
    const dir = horn === 'tuskup' ? -1 : 1;
    /* a boar's tusks come out at the mouth corner and sweep up and back; an
       elephant's and a walrus's leave the front of the jaw and drop */
    const base = head.pt(horn === 'tuskup' ? 0.80 : 0.90, -0.62);
    const w = headR * 0.12;
    const L = headR * (horn === 'tuskup' ? 1.05 : 1.55);
    for (const s of [-1, 1] as const) {
      const tx = base[0] + s * headR * 0.10, ty = base[1] + s * headR * 0.05;
      const m2 = s < 0 ? 0.80 : 1;   /* the far tusk sits behind and duller */
      c.fillStyle = `rgb(${239 * m2 | 0},${230 * m2 | 0},${212 * m2 | 0})`;
      c.beginPath(); c.moveTo(tx - w, ty);
      c.quadraticCurveTo(tx - w * 1.30, ty + dir * L * 0.62, tx + w * 1.05, ty + dir * L);
      c.quadraticCurveTo(tx + w * 1.85, ty + dir * L * 0.56, tx + w, ty);
      c.closePath(); c.fill();
    }
    if (horn === 'tuskdown' && FAM0.foot === 'flipper') {
      /* ★ POLISH — THE WALRUS MOUSTACHE: the dense bristle pad either side of
         the tusk roots, "the bristle moustache pad" gp6 asked for. */
      c.strokeStyle = 'rgba(226,210,180,0.85)'; c.lineWidth = 1.6; c.lineCap = 'round';
      for (let k = 0; k < 26; k++) {
        const s2 = k % 2 ? 1 : -1;
        const bx2 = base[0] + s2 * headR * (0.12 + (k % 5) * 0.05), by2 = base[1] - headR * 0.04 + (k % 3) * headR * 0.045;
        c.beginPath(); c.moveTo(bx2, by2);
        c.lineTo(bx2 + s2 * headR * (0.16 + (k % 4) * 0.04), by2 + headR * 0.10); c.stroke();
      }
    }
  }
  if (spec.trunk) {
    /* ⚠ the trunk stopped at knee height. "A long muscular trunk REACHING THE
       GROUND" is the first mustRead on every elephant row, and a trunk that
       stops in mid-air is the one thing everybody notices. It now runs to the
       ground line and curls, and it tapers, because a trunk is a cone. */
    /* ★ wave 35 — how far down the trunk reaches. 1 is the elephant's, to the
       ground; a tapir's 0.16 is a short mobile snout that hangs just past the
       lip. Every intermediate point is placed along the SAME curve, so a short
       trunk is a shortened elephant trunk rather than a different drawing. */
    const tk = typeof spec.trunk === 'number' ? spec.trunk : 1;
    const tRoot: [number, number] = [headX + headR * 0.70, headY + headR * 0.18];
    const tDrop = (groundY - headR * 0.12 - headY) * tk;
    const tEnd: [number, number] = [headX + headR * (0.70 + 0.25 * tk), headY + tDrop];
    const trunkT = new Tube({
      P: pathThrough([tRoot,
        [headX + headR * (0.70 + 0.85 * tk), headY + tDrop * 0.34],
        [headX + headR * (0.70 + 0.72 * tk), headY + tDrop * 0.70],
        tEnd,
        [headX + headR * (0.70 + 1.05 * tk), headY + tDrop + headR * 0.10 * tk]]),
      R: (t2: number) => headR * (0.30 - t2 * 0.16),
    });
    c.fillStyle = p.base;
    c.beginPath(); trunkT.trace(c, 36); c.fill();
    c.save(); c.beginPath(); trunkT.trace(c, 36); c.clip();
    countershade(c, trunkT, p, 0.9);
    c.restore();
    /* ★ wave 35 — the annulation rings were laid on a HAND-WRITTEN line that
       happened to follow the old elephant curve, so on any other trunk length
       they marched off into empty space. They ride the tube's own axis now,
       and their width comes from its own radius — so they stay ON the trunk
       whatever it is attached to (the same lesson as the tail bands below). */
    c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = headR * 0.12;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const [tx, ty] = trunkT.axis(t);
      const rw = headR * (0.30 - t * 0.16) * 0.72;
      c.beginPath(); c.moveTo(tx - rw, ty); c.lineTo(tx + rw, ty); c.stroke();
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
  if (spec.accent) {
    /* clipped to the torso so the accent is SKIN, not a sticker */
    c.save(); c.beginPath(); body.trace(c, 64); c.clip();
    if (spec.accent === 'rumpPatch') {
      const [ax2, ay2] = AX(0.09);
      const pg2 = c.createRadialGradient(ax2, ay2, 2, ax2, ay2, bodyH * 0.62);
      pg2.addColorStop(0, 'rgba(244,242,232,0.85)'); pg2.addColorStop(0.7, 'rgba(244,242,232,0.55)'); pg2.addColorStop(1, 'rgba(244,242,232,0)');
      c.fillStyle = pg2; c.beginPath(); c.arc(ax2, ay2, bodyH * 0.62, 0, TAU); c.fill();
    } else if (spec.accent === 'flankBand') {
      for (let i = 0; i <= 18; i++) {
        const u = 0.12 + (i / 18) * 0.74;
        const [ax2, ay2] = AX(u);
        const gg2 = c.createRadialGradient(ax2, ay2 + RAD(u) * 0.52, 1, ax2, ay2 + RAD(u) * 0.52, bodyH * 0.16);
        gg2.addColorStop(0, 'rgba(38,30,22,0.6)'); gg2.addColorStop(1, 'rgba(38,30,22,0)');
        c.fillStyle = gg2; c.beginPath(); c.arc(ax2, ay2 + RAD(u) * 0.52, bodyH * 0.16, 0, TAU); c.fill();
      }
    } else if (spec.accent === 'rumpStripes') {
      c.strokeStyle = 'rgba(24,18,12,0.75)'; c.lineWidth = bodyH * 0.07; c.lineCap = 'round';
      for (const u of [0.05, 0.11, 0.17]) {
        const [ax2, ay2] = AX(u);
        c.beginPath(); c.moveTo(ax2, ay2 - RAD(u) * 0.9); c.lineTo(ax2 - bodyW * 0.02, ay2 + RAD(u) * 0.5); c.stroke();
      }
    } else if (spec.accent === 'chestBlaze') {
      /* ★ GOLD AUDIT — the Tasmanian Devil's white chest crescent: a pale
         band low across the chest, ahead of the forelegs. */
      const [ax2, ay2] = AX(0.86);
      c.strokeStyle = 'rgba(244,242,234,0.90)'; c.lineWidth = bodyH * 0.15; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(ax2 - bodyW * 0.02, ay2 + RAD(0.86) * 0.30);
      c.quadraticCurveTo(ax2 - bodyW * 0.10, ay2 + RAD(0.86) * 0.85, ax2 + bodyW * 0.08, ay2 + RAD(0.86) * 0.92);
      c.stroke();
    }
    c.restore();
  }
  if (spec.patagium) {
    /* ★ GOLD AUDIT — THE PATAGIUM: drawn over the torso, sagging below the
       belly between the two leg roots, with a pale free edge. On a standing
       side view this loose flank sheet IS how a glider reads. */
    const [fx2, fy2] = AX(0.80), [hx2, hy2] = AX(0.20);
    const belly = Math.max(fy2 + RAD(0.80) * 0.7, hy2 + RAD(0.20) * 0.7);
    c.fillStyle = `rgba(${p.cr * 0.52 | 0},${p.cg * 0.52 | 0},${p.cb * 0.50 | 0},0.95)`;
    c.beginPath();
    c.moveTo(fx2, fy2 + RAD(0.80) * 0.45);
    c.quadraticCurveTo((fx2 + hx2) / 2, belly + bodyH * 0.85, hx2, hy2 + RAD(0.20) * 0.45);
    c.quadraticCurveTo((fx2 + hx2) / 2, belly + bodyH * 0.10, fx2, fy2 + RAD(0.80) * 0.45);
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(242,236,224,0.80)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(fx2, fy2 + RAD(0.80) * 0.45);
    c.quadraticCurveTo((fx2 + hx2) / 2, belly + bodyH * 0.85, hx2, hy2 + RAD(0.20) * 0.45); c.stroke();
  }
  if (spec.udder) {
    /* ★ POLISH — the udder hangs from the belly ahead of the hind legs, with
       two visible teats; pink against any coat. */
    const [ux, uy0] = AX(0.28);
    const uy = uy0 + RAD(0.28) * 0.94;
    const ug = c.createRadialGradient(ux - 6, uy - 4, 2, ux, uy, bodyH * 0.24);
    ug.addColorStop(0, '#f0c8c8'); ug.addColorStop(0.7, '#dea8ac'); ug.addColorStop(1, '#b87a84');
    c.fillStyle = ug;
    c.beginPath(); c.ellipse(ux, uy, bodyW * 0.16, bodyH * 0.20, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(140,80,90,0.6)'; c.lineWidth = 2; c.lineCap = 'round';
    for (const dx of [-0.5, 0.4]) { c.beginPath(); c.moveTo(ux + dx * bodyW * 0.09, uy + bodyH * 0.16); c.lineTo(ux + dx * bodyW * 0.09, uy + bodyH * 0.26); c.stroke(); }
  }
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
    /* ★ wave 36 — AND THEY WERE A STRAW BROOM. Nick's proof sheet showed it on
       Hyena, Wolf, Fox, Snow Leopard, Bison and Elk: 110 DEAD-STRAIGHT strokes
       of one fixed 1.5px width, each reaching up to 0.90 of the tail's own
       width out of it, at up to 0.62 alpha in p.lit/p.dark. That is not fur —
       it is a bundle of high-contrast straws stuck in a tube.
       Exactly the three faults the shaggy rim had (wave 35): straight, too
       long, too few. Fur is CURVED, SHORT and DENSE, it varies in weight, and
       it lies mostly ALONG the form with only a little of it standing out. */
    const hr = mulberry32((((g.seed as number) ^ 0x7A17) >>> 0));
    for (let i = 0; i < 210; i++) {
      const t = 0.10 + hr() * 0.88;
      const [hx2, hy2] = at(t);
      const [nx2, ny2] = at(Math.min(1, t + 0.02));
      const tanA = Math.atan2(ny2 - hy2, nx2 - hx2);
      const side = hr() < 0.5 ? 1 : -1;
      const w = widthAt(t);
      const L = w * (0.16 + hr() * 0.34);
      const px = Math.cos(tanA + side * Math.PI / 2), py = Math.sin(tanA + side * Math.PI / 2);
      /* weighted toward the tip, not out to the side: the brush LIES ALONG the
         tail and only frays at its edge */
      const ux = px * 0.46 + Math.cos(tanA) * 0.90, uy = py * 0.46 + Math.sin(tanA) * 0.90;
      const m2 = side > 0 ? 1.18 : 0.66;
      c.strokeStyle = `rgb(${Math.min(255, p.cr * m2) | 0},${Math.min(255, p.cg * m2) | 0},${Math.min(255, p.cb * m2) | 0})`;
      c.globalAlpha = 0.14 + hr() * 0.26;
      c.lineWidth = Math.max(1, w * (0.045 + hr() * 0.075));
      const sx = hx2 + px * w * 0.28, sy = hy2 + py * w * 0.28;
      c.beginPath(); c.moveTo(sx, sy);
      c.quadraticCurveTo(sx + px * w * 0.24 + ux * L * 0.45, sy + py * w * 0.24 + uy * L * 0.45,
        sx + px * w * 0.34 + ux * L, sy + py * w * 0.34 + uy * L);
      c.stroke();
    }
    c.globalAlpha = 1;
    /* the pale tip most brush-tailed carnivores wear */
    const [tipx, tipy] = at(1);
    /* ★ D-ART-134 — this pale ellipse was stamped on EVERY plume/bushy tail
       unconditionally: the "glowing white ball at its tip" reported
       independently on Horse, Wild Horse, Wild Pony, Giant Anteater, Wolf,
       Fisher, Fennec Fox, Fox, Red Fox, Pampas Fox, Jackal, Hyena and Mink.
       A white tail tip is a species mark, so it is opt-in now. */
    c.fillStyle = spec.tailTip ?? 'rgba(0,0,0,0)';
    c.beginPath(); c.ellipse(tipx, tipy, widthAt(1) * 0.60, widthAt(1) * 0.50, 0.3, 0, TAU); c.fill();
  } else if (tail === 'flow') {
    /* ★ GOLD AUDIT — THE EQUID TAIL: a full hanging SHEET of hair from a
       high dock, falling nearly to the hocks and swaying slightly back —
       not a brush, not a plume, not a tuft. */
    const TL = bodyH * 1.9 * (spec.tailScale ?? 1);
    const hr4 = mulberry32((((g.seed as number) ^ 0x51AE) >>> 0));
    c.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const u = i / 25;
      const sway = (u - 0.5) * bodyW * 0.14 + (hr4() - 0.5) * bodyW * 0.04;
      const len4 = TL * (0.72 + hr4() * 0.30);
      const shade4 = 0.26 + hr4() * 0.24;
      c.strokeStyle = i % 4 === 3 ? p.base : `rgb(${p.cr * shade4 | 0},${p.cg * shade4 | 0},${p.cb * shade4 | 0})`;
      c.lineWidth = 2.0 + hr4() * 2.4;
      c.beginPath(); c.moveTo(tx0 + (u - 0.5) * bodyW * 0.05, ty0 + hr4() * bodyH * 0.04);
      c.bezierCurveTo(
        tx0 - bodyW * 0.10 + sway * 0.4, ty0 + len4 * 0.35,
        tx0 - bodyW * 0.17 + sway, ty0 + len4 * 0.72,
        tx0 - bodyW * 0.15 + sway * 1.3, ty0 + len4);
      c.stroke();
    }
  } else if (tail === 'long' || tail === 'tuft') {
    /* ★ D-ART-136 — THIS BRANCH IGNORED tailScale COMPLETELY. The sweep was
       hard-coded, so a leopard's tail was ~32% of its body and NO spec value
       could lengthen it — tailScale was read only by 'bushy' and 'plume', and
       there it scales WIDTH. That is why "the tail is far too short" is the
       top-cited defect on six felid rows and unfixable from the table. */
    const TS = spec.tailScale ?? 1;
    const ex2 = tx0 - bodyW * 0.42 * TS, ey2 = ty0 + bodyH * 0.9 * TS;
    c.strokeStyle = p.base; c.lineWidth = bodyH * 0.20; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx0, ty0);
    c.quadraticCurveTo(tx0 - bodyW * 0.55 * TS, ty0 + bodyH * 0.10, ex2, ey2); c.stroke();
    /* ★ wave 35 — `tailTip` WAS READ BY THE BRUSH BRANCH ONLY, so a plain or
       tufted tail could not have a tip at all. That is the whole signature of a
       stoat (black-tipped in summer) and of every ermine-tailed mustelid, and
       the table had no way to say it. Drawn BEFORE the tuft, so a species can
       have both a dark tip and terminal hair. */
    if (spec.tailTip) {
      /* the tip is a THIRD of the tail on a stoat, not a dot on the end — so
         it is the last stretch of the tail's own curve restroked, which also
         means it cannot drift off the tail the way a pasted ellipse would */
      const tipAt = (t: number): [number, number] => {
        const m = 1 - t;
        return [m * m * tx0 + 2 * m * t * (tx0 - bodyW * 0.55 * TS) + t * t * ex2,
          m * m * ty0 + 2 * m * t * (ty0 + bodyH * 0.10) + t * t * ey2];
      };
      c.strokeStyle = spec.tailTip; c.lineWidth = bodyH * 0.20; c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i <= 12; i++) {
        const [px, py] = tipAt(0.66 + (i / 12) * 0.34);
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    }
    if (tail === 'tuft') {
      /* ★ wave 35 — A TUFT IS HAIR, NOT A BEAD. This was one dark ellipse
         stuck on the tail end, and it read as exactly that on Warthog, Camel,
         Bactrian, Dromedary, Zebra, Rhinoceros and every elephant — a blob.
         A real terminal tuft is a spray of strands leaving the tip, spreading
         as they fall and breaking the silhouette, so the tail ENDS in hair
         instead of stopping at a dot. Same fix the brush tail got in wave 21;
         this branch never received it. */
      const tr = mulberry32((((g.seed as number) ^ 0x51F7) >>> 0));
      /* the tail's own direction at the tip, so the tuft hangs off the END of
         the tail rather than in a fixed compass direction */
      const dx = ex2 - tx0, dy = ey2 - ty0;
      const dl = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / dl, uy = dy / dl;
      const L = bodyH * 0.46;
      c.lineCap = 'round';
      for (let i = 0; i < 34; i++) {
        const spread = (tr() - 0.5) * 1.15;
        const ax2 = Math.atan2(uy, ux) + spread;
        const len = L * (0.45 + tr() * 0.75);
        const m2 = 0.34 + tr() * 0.30;
        c.strokeStyle = `rgb(${p.cr * m2 | 0},${p.cg * m2 | 0},${p.cb * m2 | 0})`;
        c.globalAlpha = 0.45 + tr() * 0.45;
        c.lineWidth = Math.max(1.2, bodyH * (0.020 + tr() * 0.022));
        const sx = ex2 + ux * bodyH * 0.04 * tr(), sy = ey2 + uy * bodyH * 0.04 * tr();
        c.beginPath(); c.moveTo(sx, sy);
        c.quadraticCurveTo(sx + Math.cos(ax2) * len * 0.55, sy + Math.sin(ax2) * len * 0.55 + len * 0.16,
          sx + Math.cos(ax2) * len, sy + Math.sin(ax2) * len + len * 0.34);
        c.stroke();
      }
      c.globalAlpha = 1;
    }
  } else if (tail === 'banded') {
    /* ★ wave 35 — THE RINGED TAIL DID NOT HAVE RINGS. The tail was stroked
       along a quadratic bezier, and then the four "bands" were placed with a
       DIFFERENT, hand-written formula (0.45·t + 0.1·t²) that is not that curve
       — so they drifted off the tail and what remained was four 2px ticks in
       empty space. Every banded tail in the catalogue rendered as a plain dark
       curl: Coati, Kinkajou, Raccoon, Red Panda, Civet, Sand Cat, Wildcat.
       A ring is a mark ON a solid, so the tail is a Tube now and the rings are
       laid across its OWN axis, clipped to its own surface — they cannot leave
       it, whatever the curve does or how the species scales it. */
    const TS = spec.tailScale ?? 1;
    const tailAt = (t: number): [number, number] => {
      const m = 1 - t;
      const p1x = tx0 - bodyW * 0.45 * TS, p1y = ty0 + bodyH * 0.10;
      const p2x = tx0 - bodyW * 0.55 * TS, p2y = ty0 + bodyH * 0.80 * TS;
      return [m * m * tx0 + 2 * m * t * p1x + t * t * p2x,
        m * m * ty0 + 2 * m * t * p1y + t * t * p2y];
    };
    const tailR = (t: number): number => bodyH * 0.20 * (1 - t * 0.30);
    const tailT = new Tube({ P: tailAt, R: tailR });
    c.fillStyle = p.base;
    c.beginPath(); tailT.trace(c, 36); c.fill();
    c.save();
    c.beginPath(); tailT.trace(c, 36); c.clip();
    countershade(c, tailT, p, 0.85);
    /* six dark rings, each a short segment of the axis stroked wide enough to
       cross the whole tail and clipped back to it — so a ring is a ring at any
       bend, and the alternation reads even at thumbnail size */
    c.lineCap = 'butt';
    for (let i = 0; i < 6; i++) {
      const t0 = 0.08 + i * 0.155;
      const a2 = tailAt(t0), b2 = tailAt(Math.min(1, t0 + 0.075));
      c.strokeStyle = 'rgba(30,23,18,0.86)';
      c.lineWidth = tailR(t0) * 2.6;
      c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke();
    }
    c.restore();
    /* the tip is dark on every ringed tail in the catalogue */
    const tp = tailAt(1);
    c.fillStyle = 'rgba(30,23,18,0.86)';
    c.beginPath(); c.arc(tp[0], tp[1], tailR(1) * 0.94, 0, TAU); c.fill();
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
    /* ★ D-ART-134 — this was a p.dark ellipse pasted on the rump, and it is
       the "hard-edged flat maroon disc" on Pig, the DARK blob where Elk's
       cream rump patch belongs, the "unexplained dark blotch on the near
       haunch" on Duiker, and the dark cap on Seal, Fur Seal, Sea Lion, Sloth
       and Wombat. A stub tail is a short cone continuous with the rump, in
       coat colour, not a disc in shadow colour. */
    const sg = c.createLinearGradient(tx0 - bodyH * 0.22, ty0, tx0 + bodyH * 0.06, ty0 + bodyH * 0.26);
    sg.addColorStop(0, p.base); sg.addColorStop(1, p.dark);
    c.fillStyle = sg;
    c.beginPath();
    c.moveTo(tx0 - bodyH * 0.02, ty0 - bodyH * 0.08);
    c.quadraticCurveTo(tx0 - bodyH * 0.26, ty0 + bodyH * 0.06, tx0 - bodyH * 0.20, ty0 + bodyH * 0.30);
    c.quadraticCurveTo(tx0 - bodyH * 0.04, ty0 + bodyH * 0.16, tx0 + bodyH * 0.04, ty0 + bodyH * 0.06);
    c.closePath(); c.fill();
  }
}

/* ---- the species table: PROPORTION carries identity, then decoration ---- */
export const QUAD_SPEC: Record<string, QuadSpec> = {
  /* big cats — same family, different builds and coats */
  /* ★ wave 22b — Lion had NO route and fell through to the verbatim engine,
     where the mane rendered as a ring of spikes over an unreadable face. */
  'Lion': { legs: 0.1236, depth: 0.1426, len: 0.2455, neck: 0.06, muzzle: 0.34, jaw: 'broad', ears: 'round', tail: 'tuft', mane: 'lion', hue: '#c19a5b', family: 'felid' },
  'Jaguar': { legs: 0.114, depth: 0.1395, len: 0.2287, neck: 0.07, muzzle: 0.35, jaw: 'broad', ears: 'round', tail: 'long', coat: 'rosettes' , hue: "#c8983c", family: 'felid' , legMarks: true, tailScale: 1.8 },
  'Leopard': { legs: 0.1253, depth: 0.1080, len: 0.2287, neck: 0.07, muzzle: 0.32, ears: 'round', tail: 'long', coat: 'rosettes' , hue: "#d3ab5e", family: 'felid' , legMarks: true, tailScale: 1.8 },
  'Snow Leopard': { legs: 0.1221, depth: 0.1140, len: 0.2399, neck: 0.07, muzzle: 0.30, ears: 'round', tail: 'long', coat: 'rosettes', hue: '#cfd4dc', family: 'felid' , legMarks: true, tailScale: 2.1 },
  /* ★ wave 35 — Nick's row: "current ungulate-like body lacks deep chest,
     tucked waist, feline paws/head". It is the one felid NOT built like a big
     cat — a whippet: extreme waist tuck, light hindquarters, and a tail nearly
     as long as the body it steers. Those four numbers are the animal, and the
     felid plan alone could never reach them because the felid plan describes a
     leopard. */
  'Cheetah': { legs: 0.1938, depth: 0.1050, len: 0.1976, neck: 0.09, muzzle: 0.28, ears: 'round', tail: 'long', coat: 'spots', face: 'tears', hue: '#d8b477', family: 'felid', waist: 1.0, chest: 0.95, rump: 0.52, tailScale: 1.9 , legMarks: true },
  'Cougar': { legs: 0.1482, depth: 0.1120, len: 0.2287, neck: 0.08, muzzle: 0.30, ears: 'round', tail: 'long' , hue: "#b08655", family: 'felid', tailScale: 1.7, tailTip: '#241f1d' },
  'Lynx': { legs: 0.1495, depth: 0.1226, len: 0.186, neck: 0.06, muzzle: 0.26, ears: 'large', tail: 'stub', coat: 'spots' , hue: "#b9a184", family: 'felid', earShape: 'tuft' },
  /* the pixel-siblings, separated */
  'Rhinoceros': { legs: 0.0835, depth: 0.1886, len: 0.263, neck: 0.045, muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'twinnose', hue: '#8b8b8e', family: 'pachyderm' },
  'Wild Sheep': { legs: 0.1345, depth: 0.1529, len: 0.1881, neck: 0.075, muzzle: 0.35, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#9d8a6e', family: 'bovid' },
  'Hippopotamus': { legs: 0.0486, depth: 0.1789, len: 0.3227, neck: 0.03, muzzle: 0.62, jaw: 'barrel', ears: 'tiny', tail: 'stub', hue: '#8a6f74', family: 'pachyderm' },
  /* the humped and the long-necked */
  'Camel': { legs: 0.1846, depth: 0.1629, len: 0.1804, neck: 0.20, back: 'level', muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#c8a173', family: 'camelid' },
  'Bactrian Camel': { legs: 0.176, depth: 0.1667, len: 0.1914, neck: 0.19, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 2, hue: '#b08a5e', family: 'camelid' },
  'Dromedary Camel': { legs: 0.1935, depth: 0.159, len: 0.176, neck: 0.20, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#cba777', family: 'camelid' },
  'Giraffe': { legs: 0.2438, depth: 0.1573, len: 0.1652, neck: 0.34, back: 'sloped', muzzle: 0.40, ears: 'large', tail: 'tuft', coat: 'patches', horn: 'ossicone', hue: '#e0c07a' , family: 'cervid' , legMarks: true },
  'Llama': { legs: 0.1938, depth: 0.1434, len: 0.1506, neck: 0.20, muzzle: 0.35, ears: 'large', tail: 'stub', hue: '#d8cbb4', family: 'camelid', earScale: 1.5 },
  'Alpaca': { legs: 0.1594, depth: 0.1448, len: 0.152, neck: 0.18, muzzle: 0.30, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#ddd2bd', family: 'camelid' },
  /* antlered + horned */
  'Moose': { legs: 0.2181, depth: 0.1843, len: 0.2116, neck: 0.10, back: 'humped', muzzle: 0.62, jaw: 'broad', ears: 'large', tail: 'stub', horn: 'palmate', hue: '#5b4433', family: 'cervid' },
  'Elk': { legs: 0.2035, depth: 0.1594, len: 0.2092, neck: 0.13, back: 'sloped', muzzle: 0.48, ears: 'large', tail: 'stub', horn: 'branched', hue: '#9c7748', family: 'cervid' },
  'Deer': { legs: 0.1973, depth: 0.139, len: 0.1709, neck: 0.12, muzzle: 0.42, ears: 'large', tail: 'stub', horn: 'branched', coat: 'spots', hue: '#b98a58', family: 'cervid' },
  /* ★ wave 35 — the warm brown half of the Caribou/Reindeer split; see Caribou */
  'Reindeer': { legs: 0.1782, depth: 0.1505, len: 0.1974, neck: 0.11, muzzle: 0.44, ears: 'small', tail: 'stub', horn: 'branched', hue: '#9c7548', family: 'cervid' },
  'Sheep': { legs: 0.1448, depth: 0.1548, len: 0.1777, neck: 0.08, muzzle: 0.36, ears: 'small', tail: 'stub', horn: 'curl', hue: '#a98f6d', family: 'bovid' },
  'Bison': { legs: 0.1211, depth: 0.1881, len: 0.2313, neck: 0.05, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'small', tail: 'tuft', coat: 'shaggy', horn: 'sweep', hue: '#5c4535', family: 'bovid' },
  'Water Buffalo': { legs: 0.1249, depth: 0.1765, len: 0.246, neck: 0.06, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'sweep', hue: '#77736e', family: 'bovid' },
  /* bears, differentiated */
  'Grizzly Bear': { legs: 0.0916, depth: 0.1717, len: 0.2534, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#7a5636', family: 'ursid' },
  'Brown Bear': { legs: 0.0963, depth: 0.1881, len: 0.2313, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#70502f', family: 'ursid' },
  'Polar Bear': { legs: 0.1112, depth: 0.1696, len: 0.2642, neck: 0.10, back: 'level', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#eef2f6', family: 'ursid', earScale: 0.50 },
  'Black Bear': { legs: 0.101, depth: 0.1729, len: 0.2268, neck: 0.05, muzzle: 0.42, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#3b3a40', family: 'ursid' },
  'Panda': { legs: 0.0825, depth: 0.1844, len: 0.2269, neck: 0.04, back: 'arched', muzzle: 0.30, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'panda', face: 'mask', hue: '#f0f2f4', family: 'ursid' , legMarks: true },
  'Sun Bear': { legs: 0.0939, depth: 0.1438, len: 0.2004, neck: 0.05, muzzle: 0.38, ears: 'round', tail: 'stub', hue: '#2f2b2c', family: 'ursid' },
  'Sloth Bear': { legs: 0.1001, depth: 0.1697, len: 0.2227, neck: 0.05, muzzle: 0.55, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#2b2726', family: 'ursid' },
  /* canids + small mammals where ears/tails are the read */
  'Red Fox': { legs: 0.1118, depth: 0.104, len: 0.1962, neck: 0.06, muzzle: 0.44, jaw: 'fine', ears: 'large', tail: 'plume', hue: '#d1651f', family: 'canid', tailScale: 1.7 , tailTip: '#f2efe6' },
  'Arctic Fox': { legs: 0.1046, depth: 0.1072, len: 0.1847, neck: 0.06, muzzle: 0.36, ears: 'small', tail: 'plume', hue: '#eaf0f5', family: 'canid', tailScale: 1.7 , tailTip: '#f6f5f2' },
  /* ★ wave 21 — the audit: "ears should dominate the head; reduce body size and
     increase bushy tail". A fennec is a desert fox scaled DOWN around ears that
     were not scaled down with it. */
  'Fennec Fox': { legs: 0.0667, depth: 0.0799, len: 0.1048, neck: 0.03, muzzle: 0.30, ears: 'huge', tail: 'plume', hue: '#e6cfa4', earScale: 1.30, tailScale: 1.6, family: 'canid', earShape: 'point' , tailTip: '#20191a' },
  'Wolf': { legs: 0.155, depth: 0.1377, len: 0.2033, neck: 0.08, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'bushy', hue: '#7d7f86', family: 'canid' , tailTip: '#241f1d' },
  'Hyena': { legs: 0.1442, depth: 0.1492, len: 0.208, neck: 0.08, back: 'sloped', muzzle: 0.42, jaw: 'broad', ears: 'large', tail: 'bushy', coat: 'spots', hue: '#a08a63', family: 'hyaenid' },
  /* ⚠ WAVE 42, CODE PASS — THIS COMMENT WAS TRUE IN WAVE 4 AND IS FALSE NOW,
     which is worse than no comment: it points a maintainer at the wrong engine.
     It claimed "the pachyderms + Zebra/Tiger/Lion/Red Panda/Raccoon are
     DELIBERATELY ABSENT — the verbatim engine already nails them". Every
     species it names is routed through THIS painter today (Lion and Rhinoceros
     and Hippopotamus in this table; Tiger, Zebra, Raccoon, Red Panda and all
     four elephants in QUAD2_SPEC), and several were rebuilt here this session.
     The principle it states is still right and still load-bearing —
     ★ never override what already excels (D-ART-14) — so the principle stays
     and the stale species list goes. A rule outlives its examples. */
  'Walrus': { legs: 0.0303, depth: 0.1631, len: 0.2943, neck: 0.04, muzzle: 0.50, jaw: 'barrel', ears: 'tiny', tail: 'none', horn: 'tuskdown', hue: '#a3705f', family: 'pinniped'  },
  /* equines + swine */
  'Horse': { legs: 0.1964, depth: 0.166, len: 0.1999, neck: 0.14, muzzle: 0.50, ears: 'small', tail: 'flow', mane: 'crest', hue: '#8a5a35', family: 'equid' },
  'Wild Boar': { legs: 0.0955, depth: 0.1423, len: 0.2101, neck: 0.05, back: 'sloped', muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'tuskup', coat: 'shaggy', hue: '#5a4a3e', family: 'suid', earShape: 'point' },
  'Warthog': { legs: 0.1087, depth: 0.1405, len: 0.1958, neck: 0.05, back: 'sloped', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'tuskup', mane: 'crestUp', hue: '#6b5647', family: 'suid', earShape: 'point' },
  /* ★ wave 35 — a tapir is barrel-bodied like a suid, so it keeps that BODY;
     but the suid skull hard-wires the flat cartilage nose disc that is a pig's
     whole identity, and the reference row warns against it by name. It gets a
     pachyderm head and the short prehensile proboscis it is known for. */
  'Tapir': { legs: 0.1099, depth: 0.1542, len: 0.2276, neck: 0.05, muzzle: 0.48, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#4a4348', family: 'suid', skull: 'pachyderm', trunk: 0.16 },
};
