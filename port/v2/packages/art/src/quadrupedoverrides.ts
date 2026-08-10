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

/** Full-reset Wave 2d routes are deliberately exact-name values.  The plan is
    not a family bucket: every value below owns one catalogue identity. */
export type MammalDPlan = 'Badger' | 'Civet' | 'Fisher' | 'Giant Otter' | 'Marten' | 'Mink'
  | 'Mongoose' | 'Otter' | 'River Otter' | 'Sea Otter' | 'Wolverine' | 'Capybara'
  | 'Hyrax' | 'Mara' | 'Marsh Rodent' | 'Mole';

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
  tail?: 'none' | 'stub' | 'thick' | 'tuft' | 'bushy' | 'long' | 'plume' | 'banded' | 'paddle' | 'muscular' | 'flow';
  /** ★ POLISH — the dairy udder: a pink rounded bag between the hind legs (Cow) */
  udder?: boolean;
  /** ★ POLISH WAVE — small COAT ACCENTS that are whole identities: a pale rump
      patch (banteng), a dark lower-flank band (gazelle/springbok), vertical
      rump stripes (impala). One axis, several species. */
  accent?: 'rumpPatch' | 'flankBand' | 'rumpStripes' | 'chestBlaze' | 'chestCrescent' | 'chestU';
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
  /** Opt-in black brush length/weight for tuft-eared cats. */
  earTuftScale?: number;
  /** Opt-in fan of silhouette-breaking cheek fur (bobcat/lynx). */
  cheekRuff?: number;
  /** Opt-in paw enlargement for snow-footed or wetland cats. */
  pawScale?: number;
  /** Capybara-style toe webbing, retained as a named-only paw accent. */
  webbedFeet?: boolean;
  /** Orange rodent enamel, distinct from the ordinary dark mammal mouth. */
  incisors?: 'orange';
  /** Per-species skull scale; family default remains the fallback. */
  headScale?: number;
  /** Ocelot's elongated chain rosettes, distinct from leopard rings. */
  rosetteChain?: boolean;
  /** Named-only ring scale for smoky snow-leopard or compact jaguar rosettes. */
  rosetteScale?: number;
  /** Named-only spot sizing for small cats; generic spots remain unchanged. */
  spotScale?: number;
  /** Paired dark cheek bars used by the ocelot. */
  cheekBars?: boolean;
  /** A carried, upward-curled tail rather than the default hanging sweep. */
  tailPose?: 'raised' | 'upright';
  /** Catalogue-scale domestic-cat face accents; deliberately opt-in. */
  domesticCatFace?: boolean;
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
  mane?: 'lion' | 'ruff' | 'crest' | 'crestUp' | 'bison' | 'hyena';
  /** ★ wave 40 — the body's POSTURE. 'stand' (default) is the horizontal
      quadruped this painter has always drawn; 'sentinel' rears it onto its
      hind legs with the forelimbs tucked (meerkat, prairie dog, ground
      squirrel). It rotates the SPINE, so the silhouette, coat, material,
      shading and rim all follow without knowing anything about it. */
  pose?: 'sentinel' | 'hang' | 'glide';
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
  /** Named only: an extra shoulder mass for bears, bison and high-withers bovids. */
  shoulderHump?: number;
  /** Named only: make the planted claws read at thumbnail size without changing every paw. */
  clawScale?: number;
  /** Named muzzle material/colour (tan bear muzzle, pale sloth-bear snout). */
  muzzleHue?: string;
  /** Distinct face signatures that cannot be inferred from a coat pattern. */
  faceMark?: 'spectacles' | 'muzzleBars' | 'whiteBlaze' | 'darkMask';
  /** A true loose throat fold, separate from the torso/chest mass. */
  dewlap?: number;
  /** Named vertical head placement relative to the withers (positive lowers it). */
  headDrop?: number;
  /** Eared seal posture: chest propped on a long fore-flipper, never a prone loaf. */
  pinnipedPose?: 'fur-seal' | 'sea-lion';
  /** Named glider whole-form: colugo encloses the tail; sugar glider does not. */
  gliderPlan?: 'colugo' | 'sugar-glider';
  /** Legacy generic membrane switch, retained until a separately proven pixel-neutral cleanup. */
  patagium?: boolean;
  /** Full-reset Wave 2b: exact named bear/cat/hyaena whole-form owner. */
  mammalBPlan?: 'ursid-r1' | 'felid-r1' | 'hyaenid-r1';
  /** Full-reset Wave 2c: exact named canid/procyonid/marsupial whole-form owner. */
  mammalCPlan?: 'canid-c1' | 'procyonid-c1' | 'marsupial-c1';
  /** Full-reset Wave 2d: one exact named whole-form owner per catalogue identity. */
  mammalDPlan?: MammalDPlan;
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

/** A glider is not a side-on quadruped with a sagging flank patch.  Colugo and
    Sugar Glider both failed precisely because the old patagium could not join
    neck, wrists, ankles and tail into one visible membrane.  This deliberately
    narrow pose is opt-in, preserves every standing mammal, and gives those two
    animals their read-at-a-glance plan before any coat decoration. */
function faunaGlider(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: NonNullable<QuadSpec['gliderPlan']>): void {
  const p = pal(p0, spec);
  const name = plan === 'colugo' ? 'Colugo' : 'Sugar Glider';
  const r = mulberry32((((g.seed as number) ^ 0x4C1D ^ nameSeedQ(name)) >>> 0));
  const colugo = plan === 'colugo';
  const cx = S * 0.50, cy = S * (colugo ? 0.47 : 0.45);
  const wing = S * (colugo ? 0.345 : 0.305);
  const headR = S * (colugo ? 0.098 : 0.088);
  const tone = (k: number): string => `rgb(${Math.min(255, p.cr * k) | 0},${Math.min(255, p.cg * k) | 0},${Math.min(255, p.cb * k) | 0})`;

  /* A shallow cast shadow gives the spread whole-form depth without inventing
     a ground contact for an airborne animal. */
  c.fillStyle = 'rgba(0,0,0,0.34)';
  c.beginPath(); c.ellipse(cx, S * 0.83, S * 0.22, S * 0.025, 0, 0, TAU); c.fill();

  /* Sugar Glider's tail is a true furred appendage, rooted under the rump and
     deliberately OUTSIDE the wrist-to-ankle membrane. The old dark stroke ran
     across the body and read as a pasted stripe. This filled taper starts broad
     beneath the torso and carries a broken fur rim for a body-length plume. */
  if (!colugo) {
    const tg = c.createLinearGradient(cx, cy + S * 0.10, cx - S * 0.25, cy + S * 0.39);
    tg.addColorStop(0, tone(0.95)); tg.addColorStop(0.55, tone(0.67)); tg.addColorStop(1, tone(0.42));
    c.fillStyle = tg; c.beginPath();
    c.moveTo(cx - S * 0.038, cy + S * 0.105);
    c.bezierCurveTo(cx - S * 0.112, cy + S * 0.18, cx - S * 0.265, cy + S * 0.245, cx - S * 0.282, cy + S * 0.350);
    c.bezierCurveTo(cx - S * 0.291, cy + S * 0.408, cx - S * 0.205, cy + S * 0.432, cx - S * 0.150, cy + S * 0.370);
    c.bezierCurveTo(cx - S * 0.101, cy + S * 0.300, cx - S * 0.014, cy + S * 0.205, cx + S * 0.038, cy + S * 0.105);
    c.closePath(); c.fill();
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 1.28) | 0},${Math.min(255, p.cg * 1.24) | 0},${Math.min(255, p.cb * 1.20) | 0},0.44)`;
    c.lineWidth = 1.7; c.lineCap = 'round';
    /* Short fibres stay INSIDE the broad plume. Long radial strokes turned the
       old attempt into a comb; width and tapered mass now carry bushiness. */
    for (let i = 0; i < 24; i++) {
      const t = (i + 0.5) / 24;
      const x = cx - S * (0.052 + 0.205 * t) + (r() - 0.5) * S * 0.020;
      const y = cy + S * (0.135 + 0.260 * t) + (r() - 0.5) * S * 0.010;
      const side = i % 2 ? 1 : -1;
      c.beginPath(); c.moveTo(x, y);
      c.lineTo(x + side * S * (0.010 + r() * 0.006), y + S * (0.006 + r() * 0.006)); c.stroke();
    }
  }

  /* Trace the one continuous membrane silhouette. Colugo's rear free edges
     converge on the TAIL TIP itself, enclosing the entire tail. Sugar Glider's
     stop at the ankles/rump, leaving its separate plume anatomically honest. */
  const traceMembrane = (): void => {
    c.beginPath();
    c.moveTo(cx, cy - S * 0.175);
    c.quadraticCurveTo(cx + S * 0.080, cy - S * 0.145, cx + wing, cy - S * 0.055);
    c.quadraticCurveTo(cx + wing * 1.02, cy + S * 0.005, cx + wing * (colugo ? 0.73 : 0.76), cy + S * (colugo ? 0.215 : 0.220));
    if (colugo) {
      c.quadraticCurveTo(cx + S * 0.085, cy + S * 0.295, cx, cy + S * 0.385);
      c.quadraticCurveTo(cx - S * 0.085, cy + S * 0.295, cx - wing * 0.73, cy + S * 0.215);
    } else {
      c.quadraticCurveTo(cx + S * 0.090, cy + S * 0.190, cx, cy + S * 0.155);
      c.quadraticCurveTo(cx - S * 0.090, cy + S * 0.190, cx - wing * 0.76, cy + S * 0.220);
    }
    c.quadraticCurveTo(cx - wing * 1.02, cy + S * 0.005, cx - wing, cy - S * 0.055);
    c.quadraticCurveTo(cx - S * 0.080, cy - S * 0.145, cx, cy - S * 0.175);
    c.closePath();
  };
  const mg = c.createRadialGradient(cx - wing * 0.16, cy - wing * 0.24, 8, cx, cy, wing * 1.38);
  mg.addColorStop(0, `rgba(${Math.min(255, p.cr * 1.28) | 0},${Math.min(255, p.cg * 1.22) | 0},${Math.min(255, p.cb * 1.16) | 0},0.96)`);
  mg.addColorStop(0.58, `rgba(${p.cr | 0},${p.cg | 0},${p.cb | 0},0.90)`);
  mg.addColorStop(1, `rgba(${p.cr * 0.38 | 0},${p.cg * 0.38 | 0},${p.cb * 0.42 | 0},0.92)`);
  c.fillStyle = mg; traceMembrane(); c.fill();
  c.strokeStyle = 'rgba(232,239,232,0.82)'; c.lineWidth = 3.2; c.lineJoin = 'round'; c.stroke();

  if (colugo) {
    c.save(); traceMembrane(); c.clip();
    for (let i = 0; i < 46; i++) {
      const x = cx + (r() - 0.5) * wing * 1.78, y = cy + (r() - 0.35) * S * 0.43;
      softMark(c, x, y, S * (0.014 + r() * 0.020), S * (0.008 + r() * 0.014), i % 3 ? '76,88,64' : '176,165,128', i % 3 ? 0.40 : 0.28, r() * TAU);
    }
    c.restore();
  }

  /* Shoulder-to-wrist and hip-to-ankle bones terminate on the free edge; short
     digit rays make "to the fingertips" survive without pasted-on hands. */
  c.strokeStyle = `rgba(${p.cr * 0.45 | 0},${p.cg * 0.42 | 0},${p.cb * 0.38 | 0},0.90)`;
  c.lineWidth = 3.4; c.lineCap = 'round';
  for (const side of [-1, 1]) {
    const wristX = cx + side * wing, wristY = cy - S * 0.055;
    const ankleX = cx + side * wing * (colugo ? 0.73 : 0.76), ankleY = cy + S * (colugo ? 0.215 : 0.220);
    c.beginPath(); c.moveTo(cx + side * S * 0.040, cy - S * 0.045);
    c.lineTo(cx + side * wing * 0.58, cy - S * 0.015); c.lineTo(wristX, wristY); c.stroke();
    c.beginPath(); c.moveTo(cx + side * S * 0.028, cy + S * 0.065);
    c.lineTo(cx + side * wing * 0.42, cy + S * 0.125); c.lineTo(ankleX, ankleY); c.stroke();
    c.lineWidth = 1.8;
    for (const dy of [-0.020, 0, 0.020]) {
      c.beginPath(); c.moveTo(cx + side * wing * 0.88, cy - S * 0.043);
      c.lineTo(wristX, wristY + S * dy); c.stroke();
    }
    c.lineWidth = 3.4;
  }

  /* A central furred body overlaps every limb root. Colugo's body tapers into
     the enclosed tail ridge and reaches the exact same tip as its membrane. */
  const bodyG = c.createLinearGradient(cx - S * 0.05, cy - S * 0.10, cx + S * 0.06, cy + S * 0.20);
  bodyG.addColorStop(0, tone(1.22)); bodyG.addColorStop(0.58, tone(0.90)); bodyG.addColorStop(1, tone(0.48));
  c.fillStyle = bodyG; c.beginPath(); c.ellipse(cx, cy + S * 0.010, S * (colugo ? 0.064 : 0.058), S * (colugo ? 0.165 : 0.145), 0, 0, TAU); c.fill();
  if (colugo) {
    c.fillStyle = bodyG; c.beginPath();
    c.moveTo(cx - S * 0.046, cy + S * 0.080);
    c.bezierCurveTo(cx - S * 0.041, cy + S * 0.205, cx - S * 0.020, cy + S * 0.330, cx, cy + S * 0.385);
    c.bezierCurveTo(cx + S * 0.020, cy + S * 0.330, cx + S * 0.041, cy + S * 0.205, cx + S * 0.046, cy + S * 0.080);
    c.closePath(); c.fill();
  }

  /* Ears are rooted behind the skull; Sugar Glider's large rounded ears flank
     the face while Colugo keeps compact cups. */
  c.fillStyle = tone(0.58);
  for (const side of [-1, 1]) {
    c.beginPath(); c.ellipse(cx + side * headR * 0.84, cy - S * 0.185, headR * (colugo ? 0.26 : 0.43), headR * (colugo ? 0.36 : 0.50), side * 0.35, 0, TAU); c.fill();
  }
  const bg = c.createRadialGradient(cx - headR * 0.32, cy - S * 0.18 - headR * 0.36, 2, cx, cy - S * 0.18, headR * 1.2);
  bg.addColorStop(0, p.lit); bg.addColorStop(1, p.dark);
  c.fillStyle = bg; c.beginPath(); c.ellipse(cx, cy - S * 0.18, headR, headR * 0.88, 0, 0, TAU); c.fill();
  c.fillStyle = tone(1.08);
  c.beginPath(); c.ellipse(cx, cy - S * 0.105, headR * 0.50, headR * 0.38, 0, 0, TAU); c.fill();

  if (!colugo) {
    /* Crown-to-nose facial stripe only: it ends at the pink nose and never
       crosses the torso or impersonates the tail. */
    c.fillStyle = 'rgba(27,29,36,0.92)'; c.beginPath();
    c.moveTo(cx - headR * 0.18, cy - S * 0.258);
    c.quadraticCurveTo(cx - headR * 0.13, cy - S * 0.180, cx - headR * 0.08, cy - S * 0.112);
    c.quadraticCurveTo(cx, cy - S * 0.086, cx + headR * 0.08, cy - S * 0.112);
    c.quadraticCurveTo(cx + headR * 0.13, cy - S * 0.180, cx + headR * 0.18, cy - S * 0.258);
    c.closePath(); c.fill();
  }

  /* huge forward eyes are a colugo/sugar-glider identity cue, not decorative
     highlights.  They deliberately break the head silhouette at thumbnail size. */
  for (const side of [-1, 1]) {
    const ex = cx + side * headR * 0.48, ey = cy - S * 0.19;
    c.fillStyle = '#10131a'; c.beginPath(); c.arc(ex, ey, headR * 0.34, 0, TAU); c.fill();
    c.fillStyle = 'rgba(236,244,250,0.90)'; c.beginPath(); c.arc(ex - headR * 0.10, ey - headR * 0.11, headR * 0.095, 0, TAU); c.fill();
  }
  c.fillStyle = colugo ? '#26231e' : '#d7a8a0';
  c.beginPath(); c.arc(cx, cy - S * 0.105, headR * 0.13, 0, TAU); c.fill();
}

/** Fur seals and sea lions rotate their hind flippers FORWARD under the pelvis
    and can support themselves on all four limbs. This named-only whole-form
    plan makes the four weight-bearing contacts structural; true seals and
    Walrus never enter it and retain their prone anatomy and pixels. */
function faunaEaredPinniped(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: NonNullable<QuadSpec['pinnipedPose']>): void {
  const p = pal(p0, spec);
  const seaLion = plan === 'sea-lion';
  const name = seaLion ? 'Sea Lion' : 'Fur Seal';
  const r = mulberry32((((g.seed as number) ^ 0xE4E3 ^ nameSeedQ(name)) >>> 0));
  const cx = S * 0.48, cy = S * 0.58;
  const bw = S * (seaLion ? 0.270 : 0.250), bh = S * (seaLion ? 0.128 : 0.116);
  const headR = S * (seaLion ? 0.096 : 0.087);
  const tone = (k: number): string => `rgb(${Math.min(255, p.cr * k) | 0},${Math.min(255, p.cg * k) | 0},${Math.min(255, p.cb * k) | 0})`;
  const groundY = S * 0.795;

  c.fillStyle = 'rgba(0,0,0,0.34)'; c.beginPath();
  c.ellipse(cx + S * 0.015, groundY + S * 0.015, bw * 1.30, S * 0.030, 0, 0, TAU); c.fill();

  /* FAR limbs first. Both hind roots angle forward (toward the head, +x), so
     even the darker pair says eared-seal locomotion rather than trailing fins. */
  c.fillStyle = tone(0.54);
  c.beginPath();
  c.moveTo(cx - bw * 0.88, cy + bh * 0.20);
  c.bezierCurveTo(cx - bw * 0.84, cy + bh * 0.78, cx - bw * 0.78, groundY - S * 0.032, cx - bw * 0.62, groundY - S * 0.010);
  c.quadraticCurveTo(cx - bw * 0.39, groundY + S * 0.004, cx - bw * 0.32, groundY - S * 0.032);
  c.quadraticCurveTo(cx - bw * 0.55, groundY - S * 0.070, cx - bw * 0.75, groundY - S * 0.078);
  c.bezierCurveTo(cx - bw * 0.76, cy + bh * 0.48, cx - bw * 0.92, cy + bh * 0.30, cx - bw * 0.88, cy + bh * 0.20);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(cx + bw * 0.53, cy - bh * 0.42);
  c.bezierCurveTo(cx + bw * 0.70, cy + bh * 0.18, cx + bw * 0.88, groundY - S * 0.10, cx + bw * 1.03, groundY - S * 0.015);
  c.quadraticCurveTo(cx + bw * 1.18, groundY + S * 0.010, cx + bw * 1.24, groundY - S * 0.030);
  c.bezierCurveTo(cx + bw * 1.09, groundY - S * 0.072, cx + bw * 0.88, cy + bh * 0.02, cx + bw * 0.66, cy - bh * 0.62);
  c.closePath(); c.fill();

  /* Low rear barrel to raised chest, with broad overlap over every limb root. */
  const bg = c.createLinearGradient(cx - bw, cy - bh, cx + bw, cy + bh);
  bg.addColorStop(0, tone(0.54)); bg.addColorStop(0.52, tone(1.03)); bg.addColorStop(1, tone(0.46));
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(cx - bw, cy + bh * 0.30);
  c.bezierCurveTo(cx - bw * 1.00, cy - bh * 0.58, cx - bw * 0.40, cy - bh * 0.98, cx + bw * 0.28, cy - bh * 0.62);
  c.bezierCurveTo(cx + bw * 0.70, cy - bh * 0.52, cx + bw * 0.83, cy - bh * 1.40, cx + bw * 1.02, cy - bh * 1.75);
  c.bezierCurveTo(cx + bw * 1.22, cy - bh * 0.72, cx + bw * 1.08, cy + bh * 0.66, cx + bw * 0.48, cy + bh * 0.86);
  c.bezierCurveTo(cx - bw * 0.02, cy + bh * 1.04, cx - bw * 0.72, cy + bh * 0.94, cx - bw, cy + bh * 0.30);
  c.closePath(); c.fill();

  /* short contour strokes provide a furred neck for Fur Seal and sleek folds
     for Sea Lion without altering their shared chest-first geometry. */
  c.strokeStyle = seaLion ? `rgba(${p.cr * 0.36 | 0},${p.cg * 0.30 | 0},${p.cb * 0.26 | 0},0.35)` : `rgba(${p.cr * 1.24 | 0},${p.cg * 1.18 | 0},${p.cb * 1.08 | 0},0.34)`;
  c.lineCap = 'round';
  for (let i = 0; i < (seaLion ? 36 : 62); i++) {
    const x = cx - bw * 0.78 + r() * bw * 1.48, y = cy - bh * 0.50 + r() * bh * 1.25;
    c.lineWidth = 1.2 + r() * 1.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x - S * 0.015, y + S * (0.010 + r() * 0.020)); c.stroke();
  }

  /* NEAR hind flipper: broad pelvic root, forward-rotated hock, planted webbed
     foot. It crosses under the belly instead of projecting behind the rump. */
  const hindG = c.createLinearGradient(cx - bw * 0.78, cy, cx - bw * 0.18, groundY);
  hindG.addColorStop(0, tone(0.92)); hindG.addColorStop(1, tone(0.46));
  c.fillStyle = hindG; c.beginPath();
  c.moveTo(cx - bw * 0.84, cy + bh * 0.28);
  c.bezierCurveTo(cx - bw * 0.72, cy + bh * 0.92, cx - bw * 0.55, groundY - S * 0.025, cx - bw * 0.30, groundY - S * 0.008);
  c.quadraticCurveTo(cx - bw * 0.04, groundY + S * 0.012, cx + bw * 0.02, groundY - S * 0.035);
  c.quadraticCurveTo(cx - bw * 0.24, groundY - S * 0.083, cx - bw * 0.50, groundY - S * 0.082);
  c.bezierCurveTo(cx - bw * 0.66, cy + bh * 0.55, cx - bw * 0.86, cy + bh * 0.40, cx - bw * 0.84, cy + bh * 0.28);
  c.closePath(); c.fill();

  /* NEAR fore-flipper: the long shoulder-to-ground lever that lifts the chest. */
  const foreG = c.createLinearGradient(cx + bw * 0.55, cy - bh * 0.55, cx + bw * 0.72, groundY);
  foreG.addColorStop(0, tone(0.94)); foreG.addColorStop(1, tone(0.42));
  c.fillStyle = foreG; c.beginPath();
  c.moveTo(cx + bw * 0.48, cy - bh * 0.58);
  c.bezierCurveTo(cx + bw * 0.58, cy + bh * 0.04, cx + bw * 0.56, groundY - S * 0.090, cx + bw * 0.54, groundY - S * 0.018);
  c.quadraticCurveTo(cx + bw * 0.68, groundY + S * 0.010, cx + bw * 0.82, groundY - S * 0.020);
  c.quadraticCurveTo(cx + bw * 0.72, groundY - S * 0.072, cx + bw * 0.70, groundY - S * 0.118);
  c.bezierCurveTo(cx + bw * 0.72, cy + bh * 0.08, cx + bw * 0.74, cy - bh * 0.62, cx + bw * 0.48, cy - bh * 0.58);
  c.closePath(); c.fill();

  /* Toe/web lines terminate inside each planted fan, so the four contacts read
     as feet rather than a second pair of tails. */
  c.strokeStyle = 'rgba(18,16,17,0.42)'; c.lineWidth = 1.8; c.lineCap = 'round';
  for (const [x0, x1] of [[-0.72, -0.34], [-0.47, -0.02], [0.58, 0.79], [0.94, 1.20]] as const) {
    for (const dy of [-0.014, 0, 0.014]) {
      c.beginPath(); c.moveTo(cx + bw * x0, groundY - S * 0.056);
      c.lineTo(cx + bw * x1, groundY - S * (0.020 + dy)); c.stroke();
    }
  }

  /* neck and dog-like head held above the chest */
  const hx = cx + bw * 1.00, hy = cy - bh * 1.66;
  c.fillStyle = tone(0.74); c.beginPath(); c.ellipse(hx - headR * 0.55, hy + headR * 0.60, headR * 0.60, headR * 0.94, -0.46, 0, TAU); c.fill();
  const hg = c.createRadialGradient(hx - headR * 0.34, hy - headR * 0.30, 2, hx, hy, headR * 1.3);
  hg.addColorStop(0, tone(1.28)); hg.addColorStop(1, tone(0.46)); c.fillStyle = hg;
  c.beginPath(); c.ellipse(hx, hy, headR, headR * 0.82, -0.08, 0, TAU); c.fill();
  c.fillStyle = tone(1.10); c.beginPath(); c.ellipse(hx + headR * 0.70, hy + headR * 0.18, headR * 0.68, headR * 0.38, 0.06, 0, TAU); c.fill();
  c.fillStyle = '#171517'; c.beginPath(); c.ellipse(hx + headR * 1.18, hy + headR * 0.17, headR * 0.15, headR * 0.11, 0, 0, TAU); c.fill();
  c.fillStyle = '#111318'; c.beginPath(); c.arc(hx + headR * 0.16, hy - headR * 0.18, headR * 0.17, 0, TAU); c.fill();
  c.fillStyle = 'rgba(238,244,248,0.86)'; c.beginPath(); c.arc(hx + headR * 0.10, hy - headR * 0.24, headR * 0.052, 0, TAU); c.fill();

  /* visible external ear flap, set behind the head rather than a generic dot */
  c.fillStyle = seaLion ? '#8e6250' : '#775747'; c.beginPath();
  c.ellipse(hx - headR * 0.70, hy - headR * 0.35, headR * 0.30, headR * 0.40, -0.64, 0, TAU); c.fill();
  c.fillStyle = 'rgba(44,28,26,0.62)'; c.beginPath(); c.ellipse(hx - headR * 0.70, hy - headR * 0.35, headR * 0.13, headR * 0.22, -0.64, 0, TAU); c.fill();

  /* muzzle whisker fan makes the head read as a pinniped, not a dog. */
  c.strokeStyle = 'rgba(238,232,214,0.62)'; c.lineWidth = 1.2; c.lineCap = 'round';
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(hx + headR * 0.82, hy + headR * 0.24); c.lineTo(hx + headR * (1.34 + i * 0.05), hy + headR * (0.34 + i * 0.15)); c.stroke(); }
}

/** Reset Wave 2b's bear, cat, and hyaena rows need a different skeleton, not
    more dials on the old shared barrel. These helpers own one continuous named
    silhouette each: attachments overlap beneath one coat/light field, while
    diagnostic marks are clipped into that same form. No unlisted mammal can
    reach this route. */
function mammalBTone(p: Pal, k: number, alpha = 1): string {
  const rr = Math.max(0, Math.min(255, p.cr * k)) | 0;
  const gg = Math.max(0, Math.min(255, p.cg * k)) | 0;
  const bb = Math.max(0, Math.min(255, p.cb * k)) | 0;
  return alpha === 1 ? `rgb(${rr},${gg},${bb})` : `rgba(${rr},${gg},${bb},${alpha})`;
}

function mammalBFill(c: Ctx, paths: readonly Path2D[], p: Pal, x0: number, y0: number, x1: number, y1: number): void {
  const fill = c.createLinearGradient(x0, y0, x1, y1);
  fill.addColorStop(0, p.lit);
  fill.addColorStop(0.42, mammalBTone(p, 1.04));
  fill.addColorStop(0.76, p.base);
  fill.addColorStop(1, p.dark);
  c.fillStyle = fill;
  /* Fill ordered, overlapping components one at a time. Adding oppositely wound
     limb/body subpaths to one Path2D cancels their overlap under the nonzero
     rule and opens black paper-cut voids at shoulders, hips, and knees. Shared
     gradient coordinates keep these solid overlaps visually continuous. */
  for (const path of paths) c.fill(path);
}

function mammalBGround(c: Ctx, x: number, y: number, rx: number): void {
  const sh = c.createRadialGradient(x, y, 2, x, y, rx);
  sh.addColorStop(0, 'rgba(0,0,0,0.40)');
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sh;
  c.beginPath(); c.ellipse(x, y, rx, S * 0.035, 0, 0, TAU); c.fill();
}

function faunaResetUrsid(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name: string): void {
  const p = pal(p0, spec);
  const r = mulberry32((((g.seed as number) ^ 0xB3A2 ^ nameSeedQ(name)) >>> 0));
  const brown = name === 'Brown Bear' || name === 'Grizzly Bear';
  const black = name === 'Black Bear';
  const panda = name === 'Panda';
  const polar = name === 'Polar Bear';
  const sloth = name === 'Sloth Bear';
  const spectacled = name === 'Spectacled Bear';
  const sun = name === 'Sun Bear';
  const groundY = S * 0.785;
  const left = polar ? S * 0.145 : S * (sun ? 0.205 : 0.175);
  const right = polar ? S * 0.655 : S * (sun ? 0.630 : 0.650);
  const rumpTop = S * (black ? 0.350 : polar ? 0.365 : panda ? 0.365 : sun ? 0.425 : 0.405);
  const shoulderTop = S * (brown ? (name === 'Grizzly Bear' ? 0.275 : 0.292)
    : black ? 0.410 : polar ? 0.430 : panda ? 0.365 : sloth ? 0.350 : sun ? 0.405 : 0.380);
  const bodyBottom = S * (sun ? 0.665 : panda ? 0.700 : 0.690);
  const hx = S * (polar ? 0.785 : 0.765);
  const hy = S * (polar ? 0.455 : sloth ? 0.440 : sun ? 0.455 : 0.420);
  const headRx = S * (panda ? 0.102 : polar ? 0.076 : sloth ? 0.083 : sun ? 0.080 : 0.090);
  const headRy = headRx * (panda ? 1.02 : 0.90);
  const legW = S * (panda ? 0.052 : polar ? 0.047 : sun ? 0.043 : 0.050);

  mammalBGround(c, S * 0.48, groundY + S * 0.020, S * (polar ? 0.33 : 0.29));

  const total = new Path2D();
  const tail = new Path2D();
  tail.ellipse(left + S * 0.006, bodyBottom - S * 0.105, S * (panda ? 0.038 : 0.027), S * (panda ? 0.034 : 0.025), -0.2, 0, TAU);
  total.addPath(tail);

  const body = new Path2D();
  body.moveTo(left, bodyBottom - S * 0.045);
  body.bezierCurveTo(left - S * 0.030, bodyBottom - S * 0.145, left + S * 0.005, rumpTop + S * 0.018, left + S * 0.075, rumpTop);
  if (brown) {
    /* One broad muscular withers mass, not a row of small dorsal bumps. The
       second curve crests well behind the neck so the hump remains distinct
       from the single visible ear at card scale. */
    body.bezierCurveTo(left + S * 0.180, rumpTop - S * 0.004, right - S * 0.245, rumpTop - S * 0.008,
      right - S * 0.165, shoulderTop + S * 0.045);
    body.bezierCurveTo(right - S * 0.135, shoulderTop - S * 0.035, right - S * 0.060, shoulderTop - S * 0.032,
      right, shoulderTop + S * 0.035);
  } else {
    body.bezierCurveTo(left + S * 0.155, rumpTop - S * (black ? 0.020 : 0.002), right - S * 0.105, shoulderTop - S * 0.010, right, shoulderTop + S * 0.035);
  }
  body.bezierCurveTo(right + S * 0.035, shoulderTop + S * 0.095, right + S * 0.025, bodyBottom - S * 0.020, right - S * 0.030, bodyBottom + S * 0.015);
  body.bezierCurveTo(right - S * 0.145, bodyBottom + S * 0.050, left + S * 0.090, bodyBottom + S * 0.045, left, bodyBottom - S * 0.045);
  body.closePath(); total.addPath(body);

  const bearLeg = (x: number, far: boolean, fore: boolean): Path2D => {
    const q = new Path2D();
    const rootY = bodyBottom - S * (fore ? 0.060 : 0.045);
    const lean = fore ? S * 0.010 : -S * 0.006;
    const w = legW * (far ? 0.82 : 1);
    const ankleX = x + lean + (far ? -S * 0.010 : 0);
    q.moveTo(x - w, rootY);
    q.bezierCurveTo(x - w * 1.18, rootY + S * 0.065, ankleX - w * 0.78, groundY - S * 0.060, ankleX - w * 0.56, groundY - S * 0.026);
    q.quadraticCurveTo(ankleX + w * 0.20, groundY + S * 0.008, ankleX + w * 1.42, groundY - S * 0.006);
    q.quadraticCurveTo(ankleX + w * 1.54, groundY - S * 0.030, ankleX + w * 0.72, groundY - S * 0.054);
    q.bezierCurveTo(ankleX + w * 0.70, groundY - S * 0.110, x + w * 1.18, rootY + S * 0.055, x + w, rootY);
    q.closePath(); return q;
  };
  const legPositions = [left + S * 0.105, left + S * 0.155, right - S * 0.115, right - S * 0.065];
  const legs = legPositions.map((x, i) => bearLeg(x, i === 0 || i === 2, i > 1));
  for (const leg of legs) total.addPath(leg);

  const neck = new Path2D();
  neck.moveTo(right - S * 0.055, shoulderTop + S * 0.020);
  neck.bezierCurveTo(right + S * 0.020, shoulderTop - S * (polar ? 0.010 : 0.035), hx - headRx * 0.95, hy - headRy * 0.74, hx - headRx * 0.56, hy - headRy * 0.52);
  neck.lineTo(hx - headRx * 0.50, hy + headRy * 0.70);
  neck.bezierCurveTo(hx - headRx * 0.92, hy + headRy * 0.88, right + S * 0.010, bodyBottom - S * 0.020, right - S * 0.040, bodyBottom - S * 0.010);
  neck.closePath(); total.addPath(neck);
  const head = new Path2D();
  if (brown) {
    /* Brown/grizzly profile: high forehead folds inward before the short
       muzzle, producing the diagnostic concave/dished face in silhouette. */
    head.moveTo(hx - headRx * 0.84, hy + headRy * 0.48);
    head.bezierCurveTo(hx - headRx * 1.02, hy - headRy * 0.10, hx - headRx * 0.62, hy - headRy * 0.82,
      hx + headRx * 0.05, hy - headRy * 0.88);
    head.bezierCurveTo(hx + headRx * 0.30, hy - headRy * 0.84, hx + headRx * 0.46, hy - headRy * 0.48,
      hx + headRx * 0.28, hy - headRy * 0.06);
    head.bezierCurveTo(hx + headRx * 0.38, hy + headRy * 0.34, hx + headRx * 0.02, hy + headRy * 0.90,
      hx - headRx * 0.58, hy + headRy * 0.78);
    head.quadraticCurveTo(hx - headRx * 0.82, hy + headRy * 0.70, hx - headRx * 0.84, hy + headRy * 0.48);
    head.closePath();
  } else {
    head.ellipse(hx, hy, headRx, headRy, -0.06, 0, TAU);
  }
  total.addPath(head);

  const muzzle = new Path2D();
  const muzzleLen = headRx * (sloth ? 1.22 : polar ? 1.02 : brown ? 0.85 : sun ? 0.66 : 0.78);
  muzzle.moveTo(hx + headRx * (brown ? 0.18 : 0.30), hy - headRy * (brown ? -0.02 : polar ? 0.25 : 0.20));
  if (brown) muzzle.quadraticCurveTo(hx + headRx * 0.40, hy + headRy * 0.05, hx + muzzleLen, hy + headRy * 0.04);
  else if (polar) muzzle.quadraticCurveTo(hx + headRx * 0.68, hy - headRy * 0.34, hx + muzzleLen, hy + headRy * 0.02);
  else muzzle.quadraticCurveTo(hx + headRx * 0.60, hy - headRy * 0.14, hx + muzzleLen, hy + headRy * 0.02);
  muzzle.quadraticCurveTo(hx + muzzleLen * 1.08, hy + headRy * 0.26, hx + muzzleLen * 0.80, hy + headRy * 0.43);
  muzzle.quadraticCurveTo(hx + headRx * 0.44, hy + headRy * 0.48, hx + headRx * 0.20, hy + headRy * 0.30);
  muzzle.closePath(); total.addPath(muzzle);

  const ears: Path2D[] = [];
  const earTall = headRy * (black ? 0.54 : panda ? 0.38 : polar ? 0.30 : 0.40);
  for (const side of brown ? [-1] : [-1, 1]) {
    const ear = new Path2D();
    ear.ellipse(hx - headRx * 0.36 + side * headRx * 0.36, hy - headRy * 0.78,
      headRx * (black ? 0.23 : 0.20), earTall, side * 0.18, 0, TAU);
    ears.push(ear); total.addPath(ear);
  }

  mammalBFill(c, [tail, legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, neck, head, muzzle, ...ears],
    p, left, rumpTop, right + S * 0.16, bodyBottom);
  c.save(); c.clip(total);
  const furCount = sun || polar ? 34 : sloth ? 96 : 66;
  c.strokeStyle = sloth ? 'rgba(220,210,190,0.26)' : mammalBTone(p, 1.34, 0.25);
  c.lineCap = 'round';
  for (let i = 0; i < furCount; i++) {
    const x = left - S * 0.010 + r() * (right - left + S * 0.19);
    const y = rumpTop + r() * (bodyBottom - rumpTop + S * 0.09);
    c.lineWidth = 0.8 + r() * 1.2; c.beginPath(); c.moveTo(x, y);
    c.lineTo(x - S * (0.010 + r() * 0.022), y + S * (0.008 + r() * 0.014)); c.stroke();
  }
  if (name === 'Grizzly Bear') {
    c.strokeStyle = 'rgba(234,218,186,0.48)'; c.lineCap = 'round';
    for (let i = 0; i < 48; i++) {
      const x = left + S * 0.015 + r() * (right - left + S * 0.050);
      const y = rumpTop + S * 0.015 + r() * (bodyBottom - rumpTop + S * 0.025);
      c.lineWidth = 1.1 + r() * 1.1; c.beginPath(); c.moveTo(x, y);
      c.lineTo(x - S * (0.009 + r() * 0.017), y + S * (0.006 + r() * 0.010)); c.stroke();
    }
  }
  c.restore();

  if (panda) {
    /* The shoulder saddle and black legs are anatomy layers, not rectangles
       stamped over the animal. Fill the actual limb paths so the band joins
       the forelegs without reopening the composite-path void. */
    c.fillStyle = '#15171c'; c.save(); c.clip(body);
    c.beginPath(); c.ellipse(right - S * 0.045, shoulderTop + S * 0.105, S * 0.095, S * 0.175, -0.10, 0, TAU); c.fill(); c.restore();
    for (const leg of legs) c.fill(leg);
  }

  const muzzleColour = spec.muzzleHue ?? mammalBTone(p, 1.24);
  const mg = c.createLinearGradient(hx, hy, hx + muzzleLen, hy + headRy * 0.35);
  mg.addColorStop(0, mammalBTone(p, 1.08)); mg.addColorStop(0.34, muzzleColour); mg.addColorStop(1, mammalBTone(p, 0.62));
  c.fillStyle = mg; c.fill(muzzle);
  if (panda) {
    c.fillStyle = '#11141a';
    for (const side of [-1, 1]) { c.beginPath(); c.ellipse(hx + side * headRx * 0.39, hy - headRy * 0.08, headRx * 0.25, headRy * 0.34, side * 0.34, 0, TAU); c.fill(); }
    c.fillStyle = '#15171c'; for (const ear of ears) c.fill(ear);
  }
  if (spectacled) {
    c.strokeStyle = '#e6d6a8'; c.lineWidth = S * 0.016;
    c.beginPath(); c.ellipse(hx + headRx * 0.30, hy - headRy * 0.10, headRx * 0.30, headRy * 0.38, -0.18, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(hx + headRx * 0.08, hy + headRy * 0.08); c.lineTo(hx - headRx * 0.20, hy + headRy * 0.70); c.stroke();
  }
  if (sloth || sun) {
    c.save(); c.clip(body); c.strokeStyle = sloth ? '#e2d4a6' : '#e4bd62';
    c.lineWidth = S * (sloth ? 0.026 : 0.023); c.lineCap = 'round';
    c.beginPath(); c.arc(right - S * 0.105, bodyBottom - S * 0.105, S * 0.054, sloth ? 0.12 : 0.02, sloth ? Math.PI - 0.10 : Math.PI - 0.24); c.stroke();
    if (sloth) { c.beginPath(); c.moveTo(right - S * 0.105, bodyBottom - S * 0.050); c.lineTo(right - S * 0.105, bodyBottom - S * 0.010); c.stroke(); }
    c.restore();
  }

  c.fillStyle = '#101319'; c.beginPath();
  c.ellipse(hx + headRx * 0.32, hy - headRy * 0.15, headRx * 0.105, headRy * 0.115, 0, 0, TAU); c.fill();
  c.fillStyle = 'rgba(240,244,245,0.90)'; c.beginPath(); c.arc(hx + headRx * 0.29, hy - headRy * 0.19, headRx * 0.030, 0, TAU); c.fill();
  c.fillStyle = '#171518'; c.beginPath(); c.ellipse(hx + muzzleLen * 1.02, hy + headRy * 0.08, headRx * 0.17, headRy * 0.14, 0.10, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(31,24,23,0.72)'; c.lineWidth = 2.2; c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx + headRx * 0.50, hy + headRy * 0.34); c.quadraticCurveTo(hx + muzzleLen * 0.78, hy + headRy * 0.48, hx + muzzleLen * 0.92, hy + headRy * 0.30); c.stroke();

  const clawLen = S * (black ? 0.014 : brown ? 0.030 : sloth ? 0.035 : sun ? 0.033 : polar ? 0.023 : 0.020);
  c.strokeStyle = brown || sloth || sun ? '#ead9ad' : '#c9bea6';
  c.lineWidth = 2.4; c.lineCap = 'round';
  for (const x of [legPositions[1]!, legPositions[3]!]) {
    for (let i = 0; i < 3; i++) {
      const sx = x + legW * (0.35 + i * 0.34);
      c.beginPath(); c.moveTo(sx, groundY - S * 0.012); c.quadraticCurveTo(sx + clawLen * 0.72, groundY - S * 0.002, sx + clawLen, groundY + S * 0.006); c.stroke();
    }
  }
}

interface MammalBFelidShape {
  body: number; depth: number; leg: number; head: number; tail: number; tailW: number;
  ear: number; paw: number; rump: number; shoulder: number; tuck: number;
}

const MAMMAL_B_FELID: Record<string, MammalBFelidShape> = {
  'Bobcat': { body: 158, depth: 65, leg: 74, head: 35, tail: 22, tailW: 13, ear: 24, paw: 16, rump: 7, shoulder: 3, tuck: 13 },
  'Caracal': { body: 162, depth: 57, leg: 94, head: 31, tail: 66, tailW: 8, ear: 31, paw: 13, rump: 8, shoulder: 1, tuck: 15 },
  'Cat': { body: 150, depth: 55, leg: 65, head: 34, tail: 120, tailW: 8, ear: 23, paw: 12, rump: 8, shoulder: 3, tuck: 16 },
  'Cheetah': { body: 184, depth: 57, leg: 104, head: 29, tail: 142, tailW: 8, ear: 16, paw: 11, rump: 2, shoulder: 8, tuck: 25 },
  'Clouded Leopard': { body: 180, depth: 70, leg: 57, head: 35, tail: 185, tailW: 14, ear: 17, paw: 16, rump: 8, shoulder: 5, tuck: 12 },
  'Cougar': { body: 188, depth: 65, leg: 83, head: 34, tail: 150, tailW: 13, ear: 17, paw: 15, rump: 17, shoulder: 2, tuck: 18 },
  'Jaguar': { body: 190, depth: 82, leg: 62, head: 43, tail: 102, tailW: 14, ear: 17, paw: 18, rump: 5, shoulder: 6, tuck: 9 },
  'Leopard': { body: 192, depth: 65, leg: 76, head: 35, tail: 155, tailW: 11, ear: 17, paw: 15, rump: 6, shoulder: 6, tuck: 20 },
  'Lion': { body: 198, depth: 78, leg: 76, head: 39, tail: 150, tailW: 9, ear: 16, paw: 17, rump: 3, shoulder: 3, tuck: 12 },
  'Lynx': { body: 158, depth: 66, leg: 91, head: 35, tail: 20, tailW: 13, ear: 25, paw: 21, rump: 12, shoulder: 1, tuck: 12 },
  'Ocelot': { body: 158, depth: 62, leg: 67, head: 34, tail: 78, tailW: 9, ear: 17, paw: 14, rump: 6, shoulder: 4, tuck: 13 },
  'Sand Cat': { body: 145, depth: 58, leg: 55, head: 38, tail: 94, tailW: 11, ear: 24, paw: 17, rump: 5, shoulder: 4, tuck: 10 },
  'Serval': { body: 150, depth: 50, leg: 127, head: 27, tail: 44, tailW: 8, ear: 43, paw: 11, rump: 5, shoulder: 2, tuck: 17 },
  'Snow Leopard': { body: 184, depth: 72, leg: 58, head: 38, tail: 190, tailW: 18, ear: 15, paw: 22, rump: 8, shoulder: 6, tuck: 10 },
  'Tiger': { body: 198, depth: 78, leg: 77, head: 39, tail: 146, tailW: 13, ear: 16, paw: 18, rump: 5, shoulder: 5, tuck: 12 },
};

function faunaResetFelid(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name: string): void {
  const p = pal(p0, spec);
  const r = mulberry32((((g.seed as number) ^ 0xF311 ^ nameSeedQ(name)) >>> 0));
  const d = MAMMAL_B_FELID[name] ?? MAMMAL_B_FELID.Cat!;
  const bobbed = name === 'Bobcat' || name === 'Lynx';
  const serval = name === 'Serval';
  const sand = name === 'Sand Cat';
  const framedLongTail = ['Cheetah', 'Clouded Leopard', 'Cougar', 'Leopard', 'Lion', 'Snow Leopard', 'Tiger'].includes(name);
  const groundY = S * 0.790, left = S * (framedLongTail ? (name === 'Clouded Leopard' || name === 'Snow Leopard' ? 0.340 : 0.300) : 0.265), right = left + d.body;
  const bodyBottom = groundY - d.leg + 10, baseTop = bodyBottom - d.depth;
  const rumpTop = baseTop - d.rump, shoulderTop = baseTop - d.shoulder;
  const tailBaseY = rumpTop + d.depth * 0.58;
  const raisedTail = name === 'Cat';
  const tipX = Math.max(S * 0.035, left - d.tail);
  const tipY = raisedTail ? S * 0.255 : bobbed ? tailBaseY + 8 : serval ? tailBaseY + 48
    : groundY - (name === 'Clouded Leopard' || name === 'Snow Leopard' ? 31 : 42);
  const hx = right + d.head * 0.72, hy = shoulderTop + d.head * (sand ? 0.48 : 0.66);
  const headRy = d.head * (sand ? 0.74 : name === 'Jaguar' ? 0.90 : 0.82);
  const bigJaw = name === 'Jaguar' || name === 'Lion' || name === 'Tiger';

  mammalBGround(c, S * 0.49, groundY + S * 0.016, S * 0.33);

  let lionMane: Path2D | undefined;
  if (name === 'Lion') {
    const mane = new Path2D();
    mane.moveTo(hx - d.head * 1.08, hy - headRy * 0.96);
    for (let i = 0; i <= 14; i++) {
      const a = -Math.PI * 0.78 + i * (Math.PI * 1.62 / 14);
      const rr = d.head * (i % 2 ? 1.36 : 1.18);
      const x = hx - d.head * 0.28 + Math.cos(a) * rr;
      const y = hy + headRy * 0.12 + Math.sin(a) * rr;
      if (i === 0) mane.moveTo(x, y); else mane.lineTo(x, y);
    }
    mane.closePath();
    lionMane = mane;
  }

  const total = new Path2D();
  const tail = new Path2D();
  tail.moveTo(left + 8, tailBaseY - d.tailW);
  if (bobbed) {
    /* A bobcat/lynx tail is a thick rounded stump carried off the rump, not a
       shortened version of the generic diagonal tail curve. */
    tail.bezierCurveTo(left - d.tail * 0.30, tailBaseY - d.tailW * 0.82,
      tipX - d.tailW * 0.35, tipY - d.tailW * 0.58, tipX, tipY);
    tail.quadraticCurveTo(tipX - d.tailW * 0.18, tipY + d.tailW * 0.74,
      tipX + d.tailW * 0.64, tipY + d.tailW * 0.82);
    tail.bezierCurveTo(left - d.tail * 0.34, tailBaseY + d.tailW * 1.10,
      left - 2, tailBaseY + d.tailW * 1.08, left + 8, tailBaseY + d.tailW);
  } else if (raisedTail) {
    tail.bezierCurveTo(left - 45, tailBaseY - 20, tipX - 18, S * 0.335, tipX, tipY);
    tail.quadraticCurveTo(tipX + 8, tipY - 7, tipX + d.tailW * 1.15, tipY + 2);
    tail.bezierCurveTo(tipX + 9, S * 0.360, left - 25, tailBaseY + 18, left + 8, tailBaseY + d.tailW);
  } else {
    const outwardControl = Math.max(S * 0.028, left - d.tail * 0.72);
    const returnControl = Math.max(S * 0.040, left - d.tail * 0.58);
    tail.bezierCurveTo(left - d.tail * 0.22, tailBaseY + 8, outwardControl, tipY - 22, tipX, tipY);
    tail.quadraticCurveTo(tipX - 3, tipY + d.tailW * 0.55, tipX + d.tailW * 0.72, tipY + d.tailW * 0.72);
    tail.bezierCurveTo(returnControl, tipY + d.tailW * 0.82, left - d.tail * 0.12, tailBaseY + d.tailW * 1.25, left + 8, tailBaseY + d.tailW);
  }
  tail.closePath(); total.addPath(tail);

  const body = new Path2D();
  body.moveTo(left, rumpTop + 10);
  body.bezierCurveTo(left + d.body * 0.13, rumpTop - 7, left + d.body * 0.37, baseTop + 4, left + d.body * 0.56, baseTop + 5);
  body.bezierCurveTo(left + d.body * 0.74, baseTop + 4, right - 24, shoulderTop - 6, right, shoulderTop + 7);
  body.bezierCurveTo(right + 8, shoulderTop + d.depth * 0.42, right - 1, bodyBottom - 7, right - 28, bodyBottom + 3);
  body.quadraticCurveTo(left + d.body * 0.60, bodyBottom - d.tuck, left + d.body * 0.43, bodyBottom - d.tuck * 1.10);
  body.quadraticCurveTo(left + d.body * 0.26, bodyBottom + 9, left + 18, bodyBottom - 2);
  body.bezierCurveTo(left - 8, bodyBottom - 17, left - 12, rumpTop + 31, left, rumpTop + 10);
  body.closePath(); total.addPath(body);

  const catLeg = (x: number, hind: boolean, far: boolean): Path2D => {
    const q = new Path2D(), y0 = bodyBottom - (hind ? 22 : 26), w = (hind ? 15 : 11) * (far ? 0.82 : 1);
    const gY = groundY - (far ? 4 : 0), paw = d.paw * (far ? 0.82 : 1);
    q.moveTo(x - w, y0);
    if (hind) {
      q.bezierCurveTo(x - w * 1.15, y0 + d.leg * 0.22, x + 18, y0 + d.leg * 0.36, x + 20, y0 + d.leg * 0.47);
      q.bezierCurveTo(x + 18, y0 + d.leg * 0.61, x - 6, gY - 32, x - 6, gY - 18);
    } else {
      q.bezierCurveTo(x - w * 0.92, y0 + d.leg * 0.32, x - 9, y0 + d.leg * 0.48, x - 6, y0 + d.leg * 0.58);
      q.bezierCurveTo(x - 2, y0 + d.leg * 0.73, x + 1, gY - 29, x + 2, gY - 17);
    }
    q.quadraticCurveTo(x + paw * 0.52, gY - 5, x + paw, gY - 7);
    q.quadraticCurveTo(x + paw * 1.20, gY - 15, x + paw * 0.72, gY - 23);
    if (hind) q.bezierCurveTo(x + 8, gY - 36, x + w * 1.05, y0 + d.leg * 0.22, x + w, y0);
    else q.bezierCurveTo(x + 11, gY - 42, x + w * 1.08, y0 + d.leg * 0.18, x + w, y0);
    q.closePath(); return q;
  };
  const legs = [catLeg(left + 35, true, true), catLeg(left + 61, true, false), catLeg(right - 48, false, true), catLeg(right - 24, false, false)];
  for (const leg of legs) total.addPath(leg);

  const neck = new Path2D();
  neck.moveTo(right - 37, shoulderTop + 2);
  neck.quadraticCurveTo(right + 12, shoulderTop - 3, hx - d.head * 0.58, hy - headRy * 0.68);
  neck.lineTo(hx - d.head * 0.45, hy + headRy * 0.70);
  neck.quadraticCurveTo(right + 10, bodyBottom - 6, right - 24, bodyBottom - 3);
  neck.closePath(); total.addPath(neck);

  const ruffs: Path2D[] = [];
  if (name === 'Tiger') {
    const ruff = new Path2D();
    ruff.moveTo(hx - d.head * 0.72, hy - headRy * 0.26);
    ruff.lineTo(hx - d.head * 1.14, hy + headRy * 0.05);
    ruff.lineTo(hx - d.head * 0.88, hy + headRy * 0.24);
    ruff.lineTo(hx - d.head * 1.02, hy + headRy * 0.52);
    ruff.lineTo(hx - d.head * 0.46, hy + headRy * 0.62);
    ruff.closePath(); ruffs.push(ruff); total.addPath(ruff);
  }
  const head = new Path2D();
  if (bobbed) {
    /* The bobcat/lynx cheek fan is the skull's own lower outline: two deep
       pointed lobes and a rear flare, rather than a hidden same-colour patch
       under the neck. This keeps the ruff seamless and legible at 132 px. */
    head.moveTo(hx - d.head * 0.76, hy - headRy * 0.58);
    head.bezierCurveTo(hx - d.head * 0.24, hy - headRy * 0.92, hx + d.head * 0.58, hy - headRy * 0.72,
      hx + d.head * 0.84, hy - headRy * 0.18);
    head.quadraticCurveTo(hx + d.head * 0.96, hy + headRy * 0.30, hx + d.head * 0.52, hy + headRy * 0.54);
    head.lineTo(hx + d.head * 0.28, hy + headRy * 1.08);
    head.lineTo(hx - d.head * 0.02, hy + headRy * 0.68);
    head.lineTo(hx - d.head * 0.56, hy + headRy * 1.22);
    head.lineTo(hx - d.head * 0.50, hy + headRy * 0.52);
    head.lineTo(hx - d.head * 1.16, hy + headRy * 0.34);
    head.lineTo(hx - d.head * 0.78, hy + headRy * 0.02);
    head.quadraticCurveTo(hx - d.head * 1.02, hy - headRy * 0.32, hx - d.head * 0.76, hy - headRy * 0.58);
    head.closePath();
  } else {
    head.ellipse(hx, hy, sand ? d.head * 1.12 : d.head, headRy, -0.06, 0, TAU);
  }
  total.addPath(head);
  const muzzle = new Path2D();
  const muzzleLen = d.head * (bigJaw ? 0.86 : name === 'Cheetah' ? 0.63 : sand ? 0.90 : 0.70);
  muzzle.moveTo(hx + d.head * 0.28, hy - headRy * 0.08);
  muzzle.quadraticCurveTo(hx + d.head * 0.58, hy - headRy * 0.12, hx + muzzleLen, hy + headRy * 0.04);
  muzzle.quadraticCurveTo(hx + muzzleLen * 1.10, hy + headRy * (bigJaw ? 0.34 : 0.28), hx + d.head * 0.58, hy + headRy * (bigJaw ? 0.52 : 0.40));
  muzzle.quadraticCurveTo(hx + d.head * 0.28, hy + headRy * 0.40, hx + d.head * 0.20, hy + headRy * 0.18);
  muzzle.closePath(); total.addPath(muzzle);

  const pointEars = ['Bobcat', 'Caracal', 'Cat', 'Lynx', 'Sand Cat', 'Serval'].includes(name);
  const earPaths: Path2D[] = [];
  for (const side of [-1, 1]) {
    const ex = hx - d.head * (sand ? 0.05 : 0.36) + side * d.head * (sand ? 0.46 : serval ? 0.48 : 0.30);
    const baseY = hy - headRy * (sand ? 0.38 : serval ? 0.58 : 0.68);
    const ear = new Path2D();
    if (serval) {
      /* The serval's ears are extraordinarily large rounded upright ovals;
         sharp generic cat triangles lose that identity at thumbnail scale. */
      ear.ellipse(ex, baseY - d.ear * 0.43, d.ear * 0.36, d.ear * 0.60, side * 0.08, 0, TAU);
    } else if (sand) {
      /* Sand-cat ears sit low and far apart on a broad, flattened skull. */
      ear.moveTo(ex - d.ear * 0.66, baseY + d.ear * 0.12);
      ear.quadraticCurveTo(ex - d.ear * 0.44, baseY - d.ear * 0.60, ex, baseY - d.ear * 1.15);
      ear.quadraticCurveTo(ex + d.ear * 0.44, baseY - d.ear * 0.60, ex + d.ear * 0.66, baseY + d.ear * 0.12);
    } else if (pointEars) {
      ear.moveTo(ex - d.ear * 0.46, baseY + d.ear * 0.18);
      ear.quadraticCurveTo(ex - d.ear * 0.10, baseY - d.ear * 0.34, ex + side * d.ear * 0.18, baseY - d.ear);
      ear.quadraticCurveTo(ex + d.ear * 0.50, baseY - d.ear * 0.22, ex + d.ear * 0.44, baseY + d.ear * 0.20);
    } else {
      ear.ellipse(ex, baseY - d.ear * 0.24, d.ear * 0.50, d.ear * 0.58, side * 0.22, 0, TAU);
    }
    ear.closePath(); earPaths.push(ear); total.addPath(ear);
  }

  mammalBFill(c, [tail, legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, neck, ...ruffs],
    p, left, baseTop, right + d.head * 1.5, bodyBottom);
  if (lionMane) {
    const mg = c.createRadialGradient(hx - d.head * 0.44, hy - d.head * 0.45, 3, hx - d.head * 0.25, hy, d.head * 1.45);
    mg.addColorStop(0, '#8a673d'); mg.addColorStop(0.68, '#5b412b'); mg.addColorStop(1, '#2e261e');
    c.fillStyle = mg; c.fill(lionMane);
  }
  mammalBFill(c, [head, muzzle, ...earPaths], p, left, baseTop, right + d.head * 1.5, bodyBottom);

  c.save(); c.clip(total);
  if (name === 'Cheetah' || name === 'Bobcat' || name === 'Serval') {
    const count = name === 'Serval' ? 30 : name === 'Cheetah' ? 46 : 28;
    const size = name === 'Serval' ? 4.2 : name === 'Cheetah' ? 3.2 : 2.8;
    for (let i = 0; i < count; i++) {
      const x = left + 13 + r() * (d.body - 22), y = baseTop + 12 + r() * (d.depth + 16);
      c.fillStyle = `rgba(30,24,19,${0.72 + r() * 0.20})`; c.beginPath(); c.arc(x, y, size * (0.72 + r() * 0.55), 0, TAU); c.fill();
    }
    if (name === 'Serval') {
      c.strokeStyle = 'rgba(30,24,19,0.86)'; c.lineWidth = 6;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(right - 32 + i * 9, shoulderTop); c.lineTo(right - 45 + i * 9, shoulderTop + 42); c.stroke(); }
    }
  } else if (name === 'Jaguar' || name === 'Leopard' || name === 'Snow Leopard' || name === 'Ocelot') {
    const count = name === 'Ocelot' ? 15 : 24;
    for (let i = 0; i < count; i++) {
      const chainRow = name === 'Ocelot' ? Math.floor(i / 5) : 0;
      const chainCol = name === 'Ocelot' ? i % 5 : 0;
      const x = name === 'Ocelot'
        ? left + 24 + chainCol * ((d.body - 52) / 4) + (chainRow % 2) * 5
        : left + 16 + r() * (d.body - 28);
      const y = name === 'Ocelot' ? baseTop + 16 + chainRow * 15 : baseTop + 14 + r() * (d.depth + 11);
      const rx = (name === 'Ocelot' ? 9.5 : name === 'Snow Leopard' ? 8 : 6) * (name === 'Ocelot' ? 1 : 0.78 + r() * 0.52);
      const ry = (name === 'Ocelot' ? 4.3 : name === 'Snow Leopard' ? 6.5 : 5.2) * (name === 'Ocelot' ? 1 : 0.78 + r() * 0.50);
      c.strokeStyle = name === 'Snow Leopard' ? 'rgba(52,57,67,0.78)' : 'rgba(38,28,18,0.88)';
      c.lineWidth = name === 'Snow Leopard' ? 3.0 : 2.7; c.beginPath(); c.ellipse(x, y, rx, ry, name === 'Ocelot' ? (chainRow - 1) * 0.08 : r() * 0.7 - 0.35, 0, TAU); c.stroke();
      if (name === 'Jaguar') { c.fillStyle = 'rgba(34,24,17,0.88)'; c.beginPath(); c.arc(x, y, 1.7, 0, TAU); c.fill(); }
    }
    if (name === 'Ocelot') {
      c.strokeStyle = 'rgba(38,28,18,0.86)'; c.lineWidth = 3.4; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(right - 55, baseTop + 15 + i * 12); c.quadraticCurveTo(right - 31, baseTop + 19 + i * 12, right - 14, baseTop + 25 + i * 12); c.stroke(); }
    }
  } else if (name === 'Clouded Leopard') {
    for (let i = 0; i < 13; i++) {
      const x = left + 18 + r() * (d.body - 34), y = baseTop + 18 + r() * (d.depth + 4);
      c.strokeStyle = 'rgba(45,33,25,0.88)'; c.lineWidth = 4.4; c.beginPath();
      c.ellipse(x, y, 12 + r() * 8, 7 + r() * 5, r() * 0.8 - 0.4, 0, TAU); c.stroke();
      softMark(c, x, y, 10 + r() * 5, 5 + r() * 3, '208,184,132', 0.28, r() * TAU);
    }
  } else if (name === 'Tiger' || name === 'Cat') {
    const stripes = name === 'Tiger' ? 13 : 7;
    c.fillStyle = name === 'Tiger' ? 'rgba(31,25,21,0.92)' : 'rgba(34,39,45,0.72)';
    for (let i = 0; i < stripes; i++) {
      const x = left + 12 + i * ((d.body - 26) / stripes);
      const q = new Path2D(); q.moveTo(x - 3, baseTop - 3); q.lineTo(x + 5, baseTop - 1);
      q.quadraticCurveTo(x + 2, baseTop + d.depth * 0.36, x - 1 + (i % 2 ? 7 : -5), bodyBottom - 12 - (i % 3) * 7);
      q.lineTo(x - 7 + (i % 2 ? 7 : -5), bodyBottom - 10 - (i % 3) * 7);
      q.quadraticCurveTo(x - 3, baseTop + d.depth * 0.34, x - 3, baseTop - 3); q.closePath(); c.fill(q);
    }
  }
  c.restore();

  if (name === 'Tiger' || name === 'Sand Cat') {
    c.save(); c.clip(total); c.strokeStyle = name === 'Tiger' ? 'rgba(31,25,21,0.94)' : 'rgba(72,63,52,0.78)';
    c.lineWidth = name === 'Tiger' ? 8 : 6;
    for (let i = 1; i <= (name === 'Tiger' ? 7 : 5); i++) {
      const t = i / (name === 'Tiger' ? 8 : 6), x = left - d.tail * t;
      const y = tailBaseY * (1 - t) + tipY * t;
      c.beginPath(); c.moveTo(x, y - d.tailW * 1.4); c.lineTo(x + 3, y + d.tailW * 1.4); c.stroke();
    }
    if (name === 'Sand Cat') {
      for (const x of [left + 55, right - 28]) {
        for (let j = 0; j < 2; j++) { c.beginPath(); c.moveTo(x - 15, groundY - 27 - j * 15); c.lineTo(x + 18, groundY - 25 - j * 15); c.stroke(); }
      }
    }
    c.restore();
  }

  const muzzleG = c.createLinearGradient(hx, hy, hx + muzzleLen, hy + headRy * 0.35);
  muzzleG.addColorStop(0, mammalBTone(p, 1.22)); muzzleG.addColorStop(1, mammalBTone(p, 0.70)); c.fillStyle = muzzleG; c.fill(muzzle);
  c.fillStyle = mammalBTone(p, 0.50, 0.74);
  for (const ear of earPaths) { c.save(); c.clip(ear); c.fillRect(hx - d.head * 1.2, hy - d.ear * 1.8, d.head * 2.4, d.ear * 1.55); c.restore(); }

  const eyeX = hx + d.head * 0.26, eyeY = hy - headRy * 0.18;
  c.fillStyle = '#d7aa54'; c.beginPath(); c.ellipse(eyeX, eyeY, d.head * 0.125, d.head * 0.105, 0, 0, TAU); c.fill();
  c.strokeStyle = '#121318'; c.lineWidth = Math.max(1.8, d.head * 0.055); c.beginPath(); c.moveTo(eyeX, eyeY - d.head * 0.085); c.lineTo(eyeX, eyeY + d.head * 0.085); c.stroke();
  c.fillStyle = '#16151a'; c.beginPath(); c.ellipse(hx + muzzleLen * 1.04, hy + headRy * 0.08, d.head * 0.13, d.head * 0.105, 0.08, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(32,25,23,0.76)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(hx + d.head * 0.48, hy + headRy * 0.35); c.quadraticCurveTo(hx + muzzleLen * 0.82, hy + headRy * 0.48, hx + muzzleLen * 0.95, hy + headRy * 0.29); c.stroke();

  if (name === 'Cheetah') {
    c.strokeStyle = '#25201c'; c.lineWidth = 4.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(eyeX + 1, eyeY + 3); c.quadraticCurveTo(hx + d.head * 0.42, hy + headRy * 0.16, hx + d.head * 0.60, hy + headRy * 0.33); c.stroke();
  }
  if (name === 'Tiger') {
    c.fillStyle = '#f2e8d5'; c.beginPath(); c.ellipse(hx + d.head * 0.05, hy + headRy * 0.19, d.head * 0.36, headRy * 0.30, -0.10, 0, TAU); c.fill();
    c.fillStyle = '#f5eee1'; c.beginPath(); c.ellipse(eyeX - d.head * 0.03, eyeY - d.head * 0.16, d.head * 0.23, d.head * 0.095, -0.16, 0, TAU); c.fill();
  }
  if (name === 'Ocelot' || name === 'Cougar') {
    c.strokeStyle = 'rgba(28,24,22,0.90)'; c.lineWidth = 3.2; c.lineCap = 'round';
    for (const off of [-0.06, 0.10]) { c.beginPath(); c.moveTo(hx + d.head * 0.30, hy + headRy * off); c.lineTo(hx + d.head * 0.76, hy + headRy * (off + 0.18)); c.stroke(); }
  }
  if (name === 'Bobcat' || name === 'Lynx' || name === 'Caracal') {
    const tuft = name === 'Caracal' ? d.ear * 0.76 : d.ear * 0.46;
    c.strokeStyle = '#18171a'; c.lineWidth = name === 'Caracal' ? 4.3 : 3.3; c.lineCap = 'round';
    for (const side of [-1, 1]) {
      const ex = hx - d.head * 0.36 + side * d.head * 0.30, ey = hy - headRy * 0.68 - d.ear;
      c.beginPath(); c.moveTo(ex + side * d.ear * 0.18, ey + 3); c.quadraticCurveTo(ex + side * tuft * 0.32, ey - tuft * 0.55, ex + side * tuft * 0.12, ey - tuft); c.stroke();
    }
  }
  if (name === 'Serval' || name === 'Caracal') {
    c.strokeStyle = '#201b19'; c.lineWidth = name === 'Serval' ? 5.4 : 4.6;
    for (const side of [-1, 1]) {
      const ex = hx - d.head * 0.36 + side * d.head * 0.30;
      c.beginPath(); c.moveTo(ex - d.ear * 0.26, hy - headRy * 0.74); c.lineTo(ex + d.ear * 0.16, hy - headRy * 0.74 - d.ear * 0.62); c.stroke();
    }
  }
  if (name === 'Cougar') {
    c.fillStyle = '#211d1c'; c.beginPath(); c.arc(tipX + d.tailW * 0.28, tipY + d.tailW * 0.22, d.tailW * 0.86, 0, TAU); c.fill();
  }
  if (name === 'Lion') {
    c.fillStyle = '#30251d'; c.beginPath(); c.ellipse(tipX + 3, tipY + 2, d.tailW * 1.45, d.tailW * 1.85, -0.35, 0, TAU); c.fill();
  }
  if (name === 'Sand Cat') {
    c.fillStyle = '#2c2925'; c.beginPath(); c.arc(tipX + d.tailW * 0.30, tipY + d.tailW * 0.18, d.tailW * 0.78, 0, TAU); c.fill();
  }

  c.strokeStyle = 'rgba(24,22,22,0.55)'; c.lineWidth = 1.5; c.lineCap = 'round';
  for (const x of [left + 61, right - 24]) {
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + 3 + i * d.paw * 0.24, groundY - 8); c.lineTo(x + 5 + i * d.paw * 0.28, groundY - 3); c.stroke(); }
  }
  if (name === 'Cat' || name === 'Sand Cat' || name === 'Tiger' || name === 'Ocelot') {
    c.strokeStyle = 'rgba(235,235,226,0.72)'; c.lineWidth = 1.2;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(hx + d.head * 0.54, hy + headRy * 0.26); c.lineTo(hx + d.head * (1.14 + i * 0.04), hy + headRy * (0.30 + i * 0.13)); c.stroke(); }
  }
}

function faunaResetHyaenid(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name: string): void {
  const p = pal(p0, spec), striped = name === 'Striped Hyena';
  const r = mulberry32((((g.seed as number) ^ 0x48A3 ^ nameSeedQ(name)) >>> 0));
  const groundY = S * 0.790, left = S * 0.225, right = S * 0.665;
  const shoulderTop = S * 0.325, rumpTop = S * (striped ? 0.475 : 0.455), bodyBottom = S * 0.655;
  const hx = S * 0.775, hy = S * 0.420, headRx = S * 0.090, headRy = S * 0.078;
  mammalBGround(c, S * 0.49, groundY + S * 0.018, S * 0.30);

  if (striped) {
    const mane = new Path2D(); mane.moveTo(left + S * 0.020, rumpTop + S * 0.012);
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, x = left + S * 0.025 + (right - left - S * 0.035) * t;
      const y = rumpTop * (1 - t) + shoulderTop * t - S * (i % 2 ? 0.055 : 0.080);
      mane.lineTo(x, y);
    }
    mane.lineTo(right - S * 0.010, shoulderTop + S * 0.035); mane.closePath();
    const mg = c.createLinearGradient(left, rumpTop, right, shoulderTop); mg.addColorStop(0, '#4b4136'); mg.addColorStop(1, '#262420');
    c.fillStyle = mg; c.fill(mane);
  }

  const total = new Path2D();
  const tail = new Path2D();
  tail.moveTo(left + S * 0.020, rumpTop + S * 0.085);
  tail.bezierCurveTo(left - S * 0.075, rumpTop + S * 0.105, left - S * 0.110, groundY - S * 0.105, left - S * 0.075, groundY - S * 0.065);
  tail.quadraticCurveTo(left - S * 0.035, groundY - S * 0.040, left - S * 0.002, groundY - S * 0.090);
  tail.bezierCurveTo(left - S * 0.020, groundY - S * 0.145, left - S * 0.020, rumpTop + S * 0.100, left + S * 0.020, rumpTop + S * 0.085); tail.closePath(); total.addPath(tail);
  const body = new Path2D(); body.moveTo(left, rumpTop + S * 0.025);
  body.bezierCurveTo(left + S * 0.075, rumpTop - S * 0.010, right - S * 0.115, shoulderTop - S * 0.015, right, shoulderTop + S * 0.025);
  body.bezierCurveTo(right + S * 0.018, shoulderTop + S * 0.115, right - S * 0.020, bodyBottom, right - S * 0.055, bodyBottom + S * 0.012);
  body.bezierCurveTo(right - S * 0.155, bodyBottom + S * 0.028, left + S * 0.075, bodyBottom + S * 0.020, left, rumpTop + S * 0.025); body.closePath(); total.addPath(body);

  const hyenaLeg = (x: number, fore: boolean, far: boolean): Path2D => {
    const q = new Path2D(), y0 = bodyBottom - S * 0.035;
    const len = S * (fore ? 0.185 : 0.135), w = S * (fore ? 0.026 : 0.023) * (far ? 0.82 : 1);
    q.moveTo(x - w, y0); q.bezierCurveTo(x - w, y0 + len * 0.38, x - w * 0.30, groundY - S * 0.060, x, groundY - S * 0.025);
    q.quadraticCurveTo(x + S * 0.025, groundY - S * 0.005, x + S * 0.050, groundY - S * 0.014);
    q.quadraticCurveTo(x + S * 0.055, groundY - S * 0.034, x + w * 0.62, groundY - S * 0.050);
    q.bezierCurveTo(x + w * 0.72, groundY - S * 0.090, x + w * 1.12, y0 + len * 0.20, x + w, y0); q.closePath(); return q;
  };
  const legs = [hyenaLeg(left + S * 0.070, false, true), hyenaLeg(left + S * 0.120, false, false), hyenaLeg(right - S * 0.090, true, true), hyenaLeg(right - S * 0.040, true, false)];
  for (const leg of legs) total.addPath(leg);
  const neck = new Path2D(); neck.moveTo(right - S * 0.080, shoulderTop + S * 0.018);
  neck.bezierCurveTo(right + S * 0.010, shoulderTop - S * 0.020, hx - headRx * 0.76, hy - headRy * 0.76, hx - headRx * 0.40, hy - headRy * 0.50);
  neck.lineTo(hx - headRx * 0.36, hy + headRy * 0.72);
  neck.bezierCurveTo(right + S * 0.010, bodyBottom - S * 0.035, right - S * 0.050, bodyBottom - S * 0.005, right - S * 0.080, shoulderTop + S * 0.018); neck.closePath(); total.addPath(neck);
  const head = new Path2D(); head.ellipse(hx, hy, headRx, headRy, -0.04, 0, TAU); total.addPath(head);
  const muzzle = new Path2D(); muzzle.moveTo(hx + headRx * 0.20, hy - headRy * 0.08);
  muzzle.quadraticCurveTo(hx + headRx * 0.72, hy - headRy * 0.16, hx + headRx * 1.18, hy + headRy * 0.05);
  muzzle.quadraticCurveTo(hx + headRx * 1.30, hy + headRy * 0.42, hx + headRx * 0.56, hy + headRy * 0.62);
  muzzle.quadraticCurveTo(hx + headRx * 0.22, hy + headRy * 0.50, hx + headRx * 0.10, hy + headRy * 0.18); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) {
    const ex = hx - headRx * 0.35 + side * headRx * 0.30, by = hy - headRy * 0.64;
    const ear = new Path2D();
    if (striped) { ear.moveTo(ex - headRx * 0.22, by); ear.lineTo(ex + side * headRx * 0.08, by - headRy * 0.98); ear.lineTo(ex + headRx * 0.27, by + headRy * 0.06); ear.closePath(); }
    else ear.ellipse(ex, by - headRy * 0.20, headRx * 0.28, headRy * 0.42, side * 0.20, 0, TAU);
    ears.push(ear); total.addPath(ear);
  }
  mammalBFill(c, [tail, legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, neck, head, muzzle, ...ears],
    p, left, shoulderTop, hx + headRx * 1.3, bodyBottom);
  c.save(); c.clip(total);
  if (striped) {
    for (let i = 0; i < 8; i++) {
      const t = (i + 0.5) / 8, x = left + S * (0.030 + i * 0.049);
      const top = rumpTop * (1 - t) + shoulderTop * t;
      softMark(c, x, (top + bodyBottom) * 0.5, S * 0.015, (bodyBottom - top) * 0.52,
        '53,47,42', 0.90, -0.10 + i * 0.018);
    }
  } else {
    for (let i = 0; i < 42; i++) {
      const x = left + r() * (right - left), y = shoulderTop + S * 0.030 + r() * (bodyBottom - shoulderTop);
      softMark(c, x, y, S * (0.008 + r() * 0.010), S * (0.006 + r() * 0.008), '52,43,34', 0.75, r() * TAU);
    }
  }
  c.restore();
  const mg = c.createLinearGradient(hx, hy, hx + headRx * 1.25, hy + headRy * 0.40); mg.addColorStop(0, mammalBTone(p, 1.10)); mg.addColorStop(1, mammalBTone(p, 0.54)); c.fillStyle = mg; c.fill(muzzle);
  c.fillStyle = '#151419'; c.beginPath(); c.ellipse(hx + headRx * 1.19, hy + headRy * 0.08, headRx * 0.15, headRy * 0.14, 0, 0, TAU); c.fill();
  c.fillStyle = '#c99a50'; c.beginPath(); c.arc(hx + headRx * 0.28, hy - headRy * 0.16, headRx * 0.11, 0, TAU); c.fill();
  c.fillStyle = '#111318'; c.beginPath(); c.arc(hx + headRx * 0.30, hy - headRy * 0.16, headRx * 0.055, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(27,23,22,0.76)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(hx + headRx * 0.42, hy + headRy * 0.38); c.lineTo(hx + headRx * 1.08, hy + headRy * 0.34); c.stroke();
  c.fillStyle = striped ? 'rgba(38,33,29,0.72)' : 'rgba(66,48,39,0.66)'; for (const ear of ears) c.fill(ear);
}

function faunaMammalB(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: NonNullable<QuadSpec['mammalBPlan']>, name: string): void {
  if (plan === 'ursid-r1') { faunaResetUrsid(c, g, p0, spec, name); return; }
  if (plan === 'felid-r1') { faunaResetFelid(c, g, p0, spec, name); return; }
  faunaResetHyaenid(c, g, p0, spec, name);
}

/** Wave 2c's thirteen mammals opt into one of three source-frozen whole-form
    painters.  Each form owns silhouette, limbs, head and tail before markings
    are clipped into that shared topology; no generic quadruped receives these
    branches. */
function mammalCEye(c: Ctx, x: number, y: number, rx: number, iris = '#9b6a30'): void {
  c.fillStyle = '#efe4cb'; c.beginPath(); c.ellipse(x, y, rx * 1.22, rx, -0.08, 0, TAU); c.fill();
  c.fillStyle = iris; c.beginPath(); c.arc(x + rx * 0.12, y, rx * 0.66, 0, TAU); c.fill();
  c.fillStyle = '#111318'; c.beginPath(); c.arc(x + rx * 0.22, y, rx * 0.38, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.82)'; c.beginPath(); c.arc(x + rx * 0.42, y - rx * 0.35, Math.max(1.4, rx * 0.17), 0, TAU); c.fill();
}

function mammalCNose(c: Ctx, x: number, y: number, rx: number, ry: number, fill = '#18171a'): void {
  const ng = c.createRadialGradient(x - rx * 0.28, y - ry * 0.34, 1, x, y, rx);
  ng.addColorStop(0, '#55545a'); ng.addColorStop(0.34, fill); ng.addColorStop(1, '#090a0d');
  c.fillStyle = ng; c.beginPath(); c.ellipse(x, y, rx, ry, 0.05, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.33)'; c.beginPath(); c.ellipse(x - rx * 0.27, y - ry * 0.31, rx * 0.18, ry * 0.15, 0, 0, TAU); c.fill();
}

function mammalCProfileEye(c: Ctx, x: number, y: number, radius: number, iris: string): void {
  c.fillStyle = 'rgba(32,28,27,0.74)'; c.beginPath(); c.ellipse(x, y, radius * 1.28, radius * 0.82, -0.10, 0, TAU); c.fill();
  c.fillStyle = iris; c.beginPath(); c.arc(x + radius * 0.15, y, radius * 0.55, 0, TAU); c.fill();
  c.fillStyle = '#111318'; c.beginPath(); c.arc(x + radius * 0.24, y, radius * 0.30, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.78)'; c.beginPath(); c.arc(x + radius * 0.38, y - radius * 0.22, Math.max(1.1, radius * 0.13), 0, TAU); c.fill();
}

function mammalCFurGrain(
  c: Ctx, clip: Path2D, r: () => number,
  x0: number, y0: number, x1: number, y1: number,
  count: number, light = 'rgba(255,239,210,0.22)', dark = 'rgba(50,34,29,0.20)',
): void {
  c.save(); c.clip(clip); c.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
    const len = S * (0.008 + r() * 0.018), rise = S * (r() * 0.007 - 0.0035);
    c.strokeStyle = r() > 0.46 ? light : dark; c.lineWidth = 1.15 + r() * 0.75;
    c.beginPath(); c.moveTo(x - len * 0.55, y - rise); c.quadraticCurveTo(x, y + rise * 0.35, x + len * 0.55, y + rise); c.stroke();
  }
  c.restore();
}

function faunaResetCanidC(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name: string): void {
  const p = pal(p0, spec);
  const r = mulberry32((((g.seed as number) ^ 0xC41D ^ nameSeedQ(name)) >>> 0));
  const red = name === 'Red Fox' || name === 'Fox';
  const pampas = name === 'Pampas Fox';
  const wolf = name === 'Wolf';
  const dingo = name === 'Dingo';
  const dog = name === 'Dog';
  const groundY = S * 0.805;
  const bodyW = S * (red ? 0.318 : pampas ? 0.326 : wolf ? 0.368 : dingo ? 0.342 : 0.338);
  const bodyH = S * spec.depth * (wolf ? 1.10 : dog ? 1.07 : 1.03);
  const legLen = S * spec.legs * (wolf ? 1.05 : dingo ? 1.02 : 0.97);
  const left = S * (red ? 0.350 : pampas ? 0.330 : wolf ? 0.275 : dingo ? 0.315 : 0.325);
  const right = left + bodyW;
  const bodyBottom = groundY - legLen + S * 0.018;
  const rumpTop = bodyBottom - bodyH * (red ? 0.78 : pampas ? 0.82 : wolf ? 0.82 : 0.76);
  const shoulderTop = bodyBottom - bodyH * (wolf ? 1.05 : dog ? 0.95 : dingo ? 0.94 : 0.90);
  const headRx = S * (wolf ? 0.103 : dingo ? 0.079 : dog ? 0.082 : pampas ? 0.071 : 0.069);
  const headRy = S * (wolf ? 0.075 : dingo ? 0.060 : dog ? 0.062 : 0.054);
  const hx = Math.min(S * 0.805, right + S * (wolf ? 0.065 : 0.060));
  const hy = shoulderTop + headRy * (wolf ? 1.08 : 1.12);
  const muzzleLen = S * (wolf ? 0.077 : dingo ? 0.071 : dog ? 0.066 : pampas ? 0.073 : 0.072);
  const earH = S * (wolf ? 0.058 : dingo ? 0.073 : dog ? 0.056 : pampas ? 0.068 : 0.064);
  const legW = S * (wolf ? 0.029 : dog ? 0.027 : 0.024);

  mammalBGround(c, S * 0.49, groundY + S * 0.018, S * (wolf ? 0.34 : 0.31));

  const total = new Path2D();
  let tipX: number, tipY: number, tailW: number;
  const tail = new Path2D();
  if (dog) {
    tipX = left - S * 0.075; tipY = rumpTop - S * 0.105; tailW = S * 0.033;
    tail.moveTo(left + bodyW * 0.14, rumpTop + bodyH * 0.42);
    tail.bezierCurveTo(left - S * 0.060, rumpTop + S * 0.010, left - S * 0.105, rumpTop - S * 0.090, tipX, tipY);
    tail.quadraticCurveTo(tipX + S * 0.038, tipY - S * 0.030, tipX + S * 0.068, tipY + S * 0.006);
    tail.bezierCurveTo(left - S * 0.015, rumpTop - S * 0.050, left + bodyW * 0.16, rumpTop + bodyH * 0.20, left + bodyW * 0.14, rumpTop + bodyH * 0.42);
  } else {
    const tailLen = S * (red ? 0.305 : pampas ? 0.255 : wolf ? 0.205 : 0.215);
    tipX = Math.max(S * 0.022, left - tailLen);
    tipY = rumpTop + bodyH * (red ? 0.78 : pampas ? 0.96 : wolf ? 1.02 : 0.90);
    tailW = S * (red ? 0.050 : pampas ? 0.040 : wolf ? 0.036 : 0.034);
    tail.moveTo(left + bodyW * 0.15, rumpTop + bodyH * 0.30);
    tail.bezierCurveTo(left - tailLen * 0.32, rumpTop + bodyH * 0.34, tipX + tailLen * 0.12, tipY - tailW * 0.78, tipX, tipY);
    tail.quadraticCurveTo(tipX - tailW * 0.06, tipY + tailW * 0.70, tipX + tailW * 0.66, tipY + tailW * 0.92);
    tail.bezierCurveTo(left - tailLen * 0.42, tipY + tailW * 0.70, left + bodyW * 0.02, rumpTop + bodyH * 0.76, left + bodyW * 0.16, rumpTop + bodyH * 0.50);
  }
  tail.closePath(); total.addPath(tail);

  const body = new Path2D();
  body.moveTo(left + bodyW * 0.02, rumpTop + bodyH * 0.16);
  body.bezierCurveTo(left + bodyW * 0.06, rumpTop - bodyH * 0.10, right - bodyW * 0.22, shoulderTop - bodyH * 0.10, right, shoulderTop + bodyH * 0.08);
  body.bezierCurveTo(right + bodyW * 0.025, shoulderTop + bodyH * 0.52, right - bodyW * 0.055, bodyBottom + bodyH * 0.04, right - bodyW * 0.14, bodyBottom);
  body.bezierCurveTo(right - bodyW * 0.29, bodyBottom - bodyH * (wolf ? 0.12 : 0.22), left + bodyW * 0.38, bodyBottom - bodyH * (red ? 0.30 : 0.20), left + bodyW * 0.11, bodyBottom - bodyH * 0.01);
  body.bezierCurveTo(left - bodyW * 0.035, bodyBottom - bodyH * 0.15, left - bodyW * 0.040, rumpTop + bodyH * 0.34, left + bodyW * 0.02, rumpTop + bodyH * 0.16);
  body.closePath(); total.addPath(body);

  const canidLeg = (x: number, fore: boolean, far: boolean): Path2D => {
    const q = new Path2D();
    const y0 = bodyBottom - bodyH * (fore ? 0.17 : 0.13);
    const w = legW * (far ? 0.80 : 1);
    const hock = fore ? S * 0.002 : S * 0.020;
    q.moveTo(x - w, y0);
    q.bezierCurveTo(x - w * 1.08, y0 + legLen * 0.30, x - w * 0.45 + hock, groundY - S * 0.070, x - w * 0.20 + hock, groundY - S * 0.031);
    q.quadraticCurveTo(x + S * 0.024 + hock, groundY - S * 0.018, x + S * 0.047 + hock, groundY - S * 0.025);
    q.quadraticCurveTo(x + S * 0.051 + hock, groundY - S * 0.045, x + w * 0.60 + hock, groundY - S * 0.053);
    q.bezierCurveTo(x + w * 0.64, groundY - S * 0.090, x + w * 1.14, y0 + legLen * 0.25, x + w, y0);
    q.closePath(); return q;
  };
  const legs = [
    canidLeg(left + bodyW * 0.18, false, true), canidLeg(left + bodyW * 0.29, false, false),
    canidLeg(right - bodyW * 0.19, true, true), canidLeg(right - bodyW * 0.08, true, false),
  ];
  for (const leg of legs) total.addPath(leg);

  const neck = new Path2D();
  neck.moveTo(right - bodyW * 0.16, shoulderTop + bodyH * 0.02);
  neck.bezierCurveTo(right + bodyW * 0.03, shoulderTop - bodyH * 0.06, hx - headRx * 0.78, hy - headRy * 0.74, hx - headRx * 0.42, hy - headRy * 0.48);
  neck.lineTo(hx - headRx * 0.34, hy + headRy * 0.72);
  neck.bezierCurveTo(right + bodyW * 0.02, bodyBottom - bodyH * 0.12, right - bodyW * 0.09, bodyBottom, right - bodyW * 0.16, shoulderTop + bodyH * 0.02);
  neck.closePath(); total.addPath(neck);

  const head = new Path2D();
  if (wolf || dingo || dog) {
    head.moveTo(hx - headRx, hy - headRy * 0.32);
    head.quadraticCurveTo(hx - headRx * 0.50, hy - headRy * 1.08, hx + headRx * 0.40, hy - headRy * 0.82);
    head.quadraticCurveTo(hx + headRx * 1.02, hy - headRy * 0.30, hx + headRx * 0.76, hy + headRy * 0.58);
    head.quadraticCurveTo(hx - headRx * 0.04, hy + headRy * 1.02, hx - headRx, hy + headRy * 0.38);
  } else {
    head.moveTo(hx - headRx, hy - headRy * 0.26);
    head.quadraticCurveTo(hx - headRx * 0.38, hy - headRy * 1.04, hx + headRx * 0.55, hy - headRy * 0.70);
    head.quadraticCurveTo(hx + headRx * 0.92, hy - headRy * 0.12, hx + headRx * 0.55, hy + headRy * 0.54);
    head.quadraticCurveTo(hx - headRx * 0.18, hy + headRy * 0.88, hx - headRx, hy + headRy * 0.32);
  }
  head.closePath(); total.addPath(head);

  const muzzle = new Path2D();
  const jawDepth = (wolf || dingo || dog) ? headRy * 0.62 : headRy * 0.43;
  muzzle.moveTo(hx + headRx * 0.14, hy - headRy * 0.05);
  muzzle.bezierCurveTo(hx + headRx * 0.72, hy - headRy * 0.12, hx + muzzleLen * 0.86, hy - headRy * 0.04, hx + muzzleLen, hy + headRy * 0.12);
  muzzle.quadraticCurveTo(hx + muzzleLen * 0.94, hy + jawDepth, hx + headRx * 0.35, hy + jawDepth);
  muzzle.quadraticCurveTo(hx + headRx * 0.08, hy + headRy * 0.36, hx + headRx * 0.14, hy - headRy * 0.05);
  muzzle.closePath(); total.addPath(muzzle);

  const ears: Path2D[] = [];
  for (const side of [-1, 1]) {
    const ex = hx - headRx * 0.44 + side * headRx * (wolf ? 0.40 : 0.43);
    const by = hy - headRy * 0.66;
    const ear = new Path2D();
    if (dog && side === 1) {
      ear.moveTo(ex - earH * 0.20, by); ear.quadraticCurveTo(ex + earH * 0.42, by + earH * 0.20, ex + earH * 0.30, by + earH * 0.76);
      ear.quadraticCurveTo(ex - earH * 0.12, by + earH * 0.61, ex - earH * 0.28, by + earH * 0.08);
    } else {
      ear.moveTo(ex - earH * 0.30, by + earH * 0.16);
      ear.quadraticCurveTo(ex - earH * 0.10, by - earH * 0.42, ex + side * earH * 0.11, by - earH);
      ear.quadraticCurveTo(ex + earH * 0.35, by - earH * 0.34, ex + earH * 0.30, by + earH * 0.18);
    }
    ear.closePath(); ears.push(ear); total.addPath(ear);
  }

  mammalBFill(c, [tail, legs[0]!, legs[2]!, ...ears, body, legs[1]!, legs[3]!, neck, head, muzzle],
    p, tipX, Math.min(tipY, shoulderTop - earH), hx + muzzleLen, groundY);

  mammalCFurGrain(c, total, r, tipX, Math.min(tipY, shoulderTop - earH), hx + muzzleLen, bodyBottom,
    wolf ? 82 : red || pampas ? 74 : 60,
    red ? 'rgba(255,214,158,0.25)' : dingo || dog ? 'rgba(255,228,184,0.22)' : 'rgba(236,235,226,0.20)',
    red ? 'rgba(76,36,24,0.20)' : 'rgba(44,42,43,0.18)');

  c.save(); c.clip(total);
  const belly = c.createLinearGradient(0, shoulderTop, 0, bodyBottom);
  belly.addColorStop(0, 'rgba(255,255,255,0)'); belly.addColorStop(1, 'rgba(238,224,199,0.34)');
  c.fillStyle = belly; c.fillRect(left - S * 0.04, shoulderTop, right - left + S * 0.12, bodyBottom - shoulderTop + S * 0.03);
  c.restore();

  if (spec.stockings) {
    const sockTop = pampas ? bodyBottom - S * 0.012 : dingo ? groundY - legLen * 0.26 : groundY - legLen * 0.58;
    for (const leg of legs) {
      c.save(); c.clip(leg); c.fillStyle = spec.stockings; c.fillRect(0, sockTop, S, groundY - sockTop + S * 0.01); c.restore();
    }
  }
  if (spec.tailTip) {
    c.save(); c.clip(tail);
    const tg = c.createLinearGradient(tipX - tailW, tipY, tipX + tailW * 4.2, tipY);
    tg.addColorStop(0, spec.tailTip); tg.addColorStop(0.46, spec.tailTip); tg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = tg; c.fillRect(tipX - tailW, tipY - tailW * 1.7, tailW * 5.4, tailW * 3.4); c.restore();
  }

  if (red) {
    const throat = new Path2D(); throat.moveTo(hx - headRx * 0.44, hy + headRy * 0.18);
    throat.bezierCurveTo(hx - headRx * 0.62, hy + headRy * 0.56, hx - headRx * 0.44, hy + headRy * 1.25, right - bodyW * 0.03, bodyBottom - bodyH * 0.10);
    throat.bezierCurveTo(right + bodyW * 0.03, bodyBottom - bodyH * 0.36, hx + headRx * 0.18, hy + headRy * 0.52, hx + headRx * 0.14, hy + headRy * 0.18); throat.closePath();
    c.save(); c.clip(total); c.fillStyle = '#f0e8d7'; c.fill(throat); c.restore();
  } else if (dingo) {
    c.save(); c.clip(total); c.fillStyle = 'rgba(245,235,211,0.72)'; c.beginPath(); c.ellipse(hx - headRx * 0.10, hy + headRy * 0.52, headRx * 0.54, headRy * 0.32, -0.18, 0, TAU); c.fill(); c.restore();
  }
  const muzzleG = c.createLinearGradient(hx, hy, hx + muzzleLen, hy + jawDepth);
  muzzleG.addColorStop(0, spec.muzzleHue ?? mammalBTone(p, 1.18)); muzzleG.addColorStop(1, mammalBTone(p, 0.72));
  c.fillStyle = muzzleG; c.fill(muzzle);
  c.fillStyle = 'rgba(42,31,27,0.70)';
  for (const ear of ears) { c.save(); c.clip(ear); c.fillRect(hx - headRx * 1.8, hy - earH * 1.9, headRx * 3.6, earH * 1.45); c.restore(); }
  mammalCProfileEye(c, hx + headRx * 0.28, hy - headRy * 0.17, S * (wolf ? 0.0105 : 0.0095), wolf ? '#b98a48' : '#8b5a2d');
  mammalCNose(c, hx + muzzleLen, hy + headRy * 0.11, S * (wolf ? 0.014 : 0.012), S * 0.009);
  c.strokeStyle = 'rgba(35,27,24,0.78)'; c.lineWidth = 2.4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(hx + headRx * 0.34, hy + jawDepth * 0.74); c.quadraticCurveTo(hx + muzzleLen * 0.77, hy + jawDepth * 0.88, hx + muzzleLen * 0.94, hy + jawDepth * 0.54); c.stroke();
  c.strokeStyle = 'rgba(28,25,24,0.52)'; c.lineWidth = 1.5;
  for (const x of [left + bodyW * 0.29, right - bodyW * 0.08]) for (let i = 0; i < 3; i++) {
    c.beginPath(); c.moveTo(x + S * (0.016 + i * 0.007), groundY - S * 0.026); c.lineTo(x + S * (0.018 + i * 0.008), groundY - S * 0.020); c.stroke();
  }
}

function faunaResetProcyonidC(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name: string): void {
  const p = pal(p0, spec);
  const kinkajou = name === 'Kinkajou';
  const raccoon = name === 'Raccoon';
  const redPanda = name === 'Red Panda';
  const groundY = S * (kinkajou ? 0.725 : 0.805);
  const left = S * (kinkajou ? 0.345 : redPanda ? 0.335 : 0.295);
  const right = S * (kinkajou ? 0.625 : redPanda ? 0.645 : 0.650);
  const rumpTop = S * (kinkajou ? 0.435 : redPanda ? 0.415 : 0.375);
  const shoulderTop = S * (kinkajou ? 0.430 : redPanda ? 0.435 : 0.430);
  const bodyBottom = S * (kinkajou ? 0.605 : redPanda ? 0.645 : 0.650);
  const hx = S * (kinkajou ? 0.695 : redPanda ? 0.735 : 0.735);
  const hy = S * (kinkajou ? 0.465 : redPanda ? 0.470 : 0.475);
  const headRx = S * (kinkajou ? 0.066 : redPanda ? 0.066 : 0.065) * (spec.headScale ?? 1);
  const headRy = headRx * (kinkajou ? 0.96 : 0.91);
  const muzzleLen = S * (kinkajou ? 0.037 : redPanda ? 0.036 : 0.045);
  const legW = S * (kinkajou ? 0.025 : 0.030);

  if (kinkajou) {
    const branch = c.createLinearGradient(0, groundY, 0, groundY + S * 0.055);
    branch.addColorStop(0, '#7d5534'); branch.addColorStop(0.45, '#513720'); branch.addColorStop(1, '#2b2119');
    c.strokeStyle = branch; c.lineWidth = S * 0.038; c.lineCap = 'round';
    c.beginPath(); c.moveTo(S * 0.095, groundY + S * 0.018); c.bezierCurveTo(S * 0.30, groundY - S * 0.015, S * 0.66, groundY + S * 0.016, S * 0.88, groundY - S * 0.010); c.stroke();
    c.strokeStyle = 'rgba(212,160,92,0.34)'; c.lineWidth = S * 0.006;
    c.beginPath(); c.moveTo(S * 0.11, groundY + S * 0.006); c.bezierCurveTo(S * 0.32, groundY - S * 0.022, S * 0.68, groundY + S * 0.008, S * 0.86, groundY - S * 0.018); c.stroke();
  } else mammalBGround(c, S * 0.49, groundY + S * 0.018, S * 0.30);

  const total = new Path2D();
  let tail: Path2D | null = null;
  if (kinkajou) {
    const tailPath = new Path2D();
    tailPath.moveTo(left + S * 0.065, rumpTop + S * 0.075);
    tailPath.bezierCurveTo(S * 0.205, S * 0.475, S * 0.115, S * 0.585, S * 0.155, S * 0.690);
    tailPath.bezierCurveTo(S * 0.190, S * 0.775, S * 0.315, S * 0.755, S * 0.290, S * 0.655);
    tailPath.bezierCurveTo(S * 0.275, S * 0.595, S * 0.205, S * 0.595, S * 0.205, S * 0.655);
    const tg = c.createLinearGradient(S * 0.11, S * 0.48, S * 0.31, S * 0.72);
    tg.addColorStop(0, p.lit); tg.addColorStop(0.48, p.base); tg.addColorStop(1, p.dark);
    c.strokeStyle = tg; c.lineWidth = S * 0.052; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(tailPath);
    c.strokeStyle = 'rgba(255,222,157,0.22)'; c.lineWidth = S * 0.013; c.stroke(tailPath);
    /* The branch crosses the inner loop once: one occlusion is what makes the
       tail visibly grip instead of merely curling in empty space. */
    c.strokeStyle = '#4a321f'; c.lineWidth = S * 0.034; c.lineCap = 'round';
    c.beginPath(); c.moveTo(S * 0.165, groundY + S * 0.010); c.lineTo(S * 0.230, groundY + S * 0.002); c.stroke();
  } else {
    tail = new Path2D();
    const tailLen = S * (redPanda ? 0.305 : 0.235), tailH = S * (redPanda ? 0.054 : 0.043);
    const tipX = Math.max(S * 0.020, left - tailLen), tipY = rumpTop + S * (redPanda ? 0.105 : 0.135);
    tail.moveTo(left + S * 0.060, rumpTop + S * 0.060);
    tail.bezierCurveTo(left - tailLen * 0.35, rumpTop + S * 0.048, tipX + tailLen * 0.18, tipY - tailH, tipX, tipY);
    tail.quadraticCurveTo(tipX - tailH * 0.04, tipY + tailH * 0.70, tipX + tailH * 0.66, tipY + tailH * 0.92);
    tail.bezierCurveTo(left - tailLen * 0.38, tipY + tailH * 0.77, left + S * 0.005, rumpTop + S * 0.155, left + S * 0.065, rumpTop + S * 0.095);
    tail.closePath(); total.addPath(tail);
  }

  const body = new Path2D(); body.moveTo(left + S * 0.018, rumpTop + S * 0.042);
  body.bezierCurveTo(left + S * 0.045, rumpTop - S * 0.022, right - S * 0.105, shoulderTop - S * 0.016, right, shoulderTop + S * 0.025);
  body.bezierCurveTo(right + S * 0.020, shoulderTop + S * 0.100, right - S * 0.015, bodyBottom, right - S * 0.075, bodyBottom + S * 0.012);
  body.bezierCurveTo(right - S * 0.145, bodyBottom + S * 0.030, left + S * 0.090, bodyBottom + S * 0.024, left - S * 0.008, rumpTop + S * 0.118);
  body.quadraticCurveTo(left - S * 0.012, rumpTop + S * 0.070, left + S * 0.018, rumpTop + S * 0.042); body.closePath(); total.addPath(body);

  const leg = (x: number, fore: boolean, far: boolean): Path2D => {
    const q = new Path2D(), y0 = bodyBottom - S * (redPanda ? 0.080 : 0.025), w = legW * (far ? 0.80 : 1);
    q.moveTo(x - w * 1.35, y0 - S * 0.012); q.bezierCurveTo(x - w * 1.38, y0 + S * 0.045, x - w * 0.72, groundY - S * 0.060, x - S * 0.008, groundY - S * 0.026);
    q.quadraticCurveTo(x + S * 0.020, groundY - S * 0.010, x + S * (fore ? 0.054 : 0.046), groundY - S * 0.019);
    q.quadraticCurveTo(x + S * 0.057, groundY - S * 0.038, x + w * 0.76, groundY - S * 0.052);
    q.bezierCurveTo(x + w * 0.92, groundY - S * 0.080, x + w * 1.42, y0 + S * 0.020, x + w * 1.20, y0 - S * 0.010); q.closePath(); return q;
  };
  const legs = [leg(left + S * 0.065, false, true), leg(left + S * 0.115, false, false), leg(right - S * 0.085, true, true), leg(right - S * 0.035, true, false)];
  for (const q of legs) total.addPath(q);
  const neck = new Path2D(); neck.moveTo(right - S * 0.075, shoulderTop + S * 0.012);
  neck.bezierCurveTo(right + S * 0.010, shoulderTop - S * 0.010, hx - headRx * 0.76, hy - headRy * 0.70, hx - headRx * 0.38, hy - headRy * 0.42);
  neck.lineTo(hx - headRx * 0.35, hy + headRy * 0.68); neck.bezierCurveTo(right + S * 0.005, bodyBottom - S * 0.020, right - S * 0.050, bodyBottom, right - S * 0.075, shoulderTop + S * 0.012); neck.closePath(); total.addPath(neck);
  const head = new Path2D(); head.ellipse(hx, hy, headRx, headRy, kinkajou ? -0.02 : -0.08, 0, TAU); total.addPath(head);
  const muzzle = new Path2D(); muzzle.moveTo(hx + headRx * 0.12, hy - headRy * 0.02);
  muzzle.quadraticCurveTo(hx + headRx * 0.62, hy - headRy * 0.12, hx + muzzleLen, hy + headRy * 0.10);
  muzzle.quadraticCurveTo(hx + muzzleLen * 0.98, hy + headRy * 0.46, hx + headRx * 0.26, hy + headRy * 0.50);
  muzzle.quadraticCurveTo(hx + headRx * 0.05, hy + headRy * 0.30, hx + headRx * 0.12, hy - headRy * 0.02); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) {
    const ex = hx - headRx * 0.38 + side * headRx * 0.36, ey = hy - headRy * 0.68;
    const ear = new Path2D(); ear.ellipse(ex, ey - headRy * 0.20, headRx * (redPanda ? 0.30 : 0.25), headRy * (redPanda ? 0.40 : 0.31), side * 0.16, 0, TAU);
    ears.push(ear); total.addPath(ear);
  }
  const fillOrder = redPanda
    ? (tail ? [tail, ...ears, ...legs, body, neck, head, muzzle] : [...ears, ...legs, body, neck, head, muzzle])
    : (tail ? [tail, legs[0]!, legs[2]!, ...ears, body, legs[1]!, legs[3]!, neck, head, muzzle] : [legs[0]!, legs[2]!, ...ears, body, legs[1]!, legs[3]!, neck, head, muzzle]);
  mammalBFill(c, fillOrder, p, S * 0.03, Math.min(rumpTop, shoulderTop), hx + muzzleLen, groundY);
  mammalCFurGrain(c, total, mulberry32((((g.seed as number) ^ 0xC017 ^ nameSeedQ(name)) >>> 0)),
    tail ? S * 0.035 : left - S * 0.02, Math.min(rumpTop, shoulderTop), hx + muzzleLen, bodyBottom,
    kinkajou ? 66 : redPanda ? 78 : 62,
    kinkajou ? 'rgba(255,220,157,0.25)' : redPanda ? 'rgba(255,205,157,0.20)' : 'rgba(245,241,229,0.17)',
    redPanda ? 'rgba(73,27,23,0.21)' : 'rgba(33,33,35,0.18)');

  if (redPanda) {
    for (const q of legs) { c.save(); c.clip(q); c.fillStyle = spec.stockings ?? '#211d1c'; c.fillRect(0, bodyBottom + S * 0.012, S, groundY); c.restore(); }
    c.save(); c.clip(body); const bg = c.createLinearGradient(0, shoulderTop, 0, bodyBottom); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.58, 'rgba(20,18,18,0.12)'); bg.addColorStop(1, '#211d1c'); c.fillStyle = bg; c.fillRect(left, shoulderTop, right - left, bodyBottom - shoulderTop + S * 0.02); c.restore();
  }
  if (tail) {
    c.save(); c.clip(tail); c.strokeStyle = redPanda ? 'rgba(235,196,139,0.82)' : 'rgba(40,38,38,0.86)';
    c.lineWidth = S * (redPanda ? 0.022 : 0.018); c.lineCap = 'round';
    const count = redPanda ? 7 : 6;
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1), x = left - S * (redPanda ? 0.285 : 0.215) * t;
      const y = rumpTop + S * (redPanda ? 0.060 + 0.070 * t : 0.070 + 0.105 * t);
      c.beginPath(); c.moveTo(x - S * 0.006, y - S * 0.055); c.lineTo(x + S * 0.010, y + S * 0.060); c.stroke();
    }
    c.restore();
  }

  if (raccoon) {
    c.save(); c.clip(head);
    c.fillStyle = '#ece7dc'; c.beginPath(); c.ellipse(hx + headRx * 0.12, hy + headRy * 0.13, headRx * 0.67, headRy * 0.58, -0.10, 0, TAU); c.fill();
    c.fillStyle = '#242428'; c.beginPath(); c.ellipse(hx + headRx * 0.21, hy - headRy * 0.11, headRx * 0.69, headRy * 0.27, -0.10, 0, TAU); c.fill(); c.restore();
  } else if (redPanda) {
    c.save(); c.clip(head); c.fillStyle = '#f2ead9';
    c.beginPath(); c.ellipse(hx - headRx * 0.16, hy + headRy * 0.05, headRx * 0.43, headRy * 0.60, -0.05, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(hx + headRx * 0.38, hy + headRy * 0.14, headRx * 0.38, headRy * 0.47, -0.12, 0, TAU); c.fill(); c.restore();
    c.strokeStyle = '#8e3528'; c.lineWidth = S * 0.014; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx + headRx * 0.20, hy - headRy * 0.12); c.quadraticCurveTo(hx + headRx * 0.30, hy + headRy * 0.18, hx + headRx * 0.48, hy + headRy * 0.48); c.stroke();
    c.fillStyle = '#f0e4d1';
    for (const side of [-1, 1]) { const ex = hx - headRx * 0.38 + side * headRx * 0.36, ey = hy - headRy * 0.88; c.beginPath(); c.ellipse(ex, ey, headRx * 0.16, headRy * 0.22, side * 0.16, 0, TAU); c.fill(); }
  }
  const muzzleG = c.createLinearGradient(hx, hy, hx + muzzleLen, hy + headRy * 0.40); muzzleG.addColorStop(0, mammalBTone(p, 1.18)); muzzleG.addColorStop(1, mammalBTone(p, 0.68)); c.fillStyle = muzzleG; c.fill(muzzle);
  const eyeR = S * (kinkajou ? 0.017 : 0.0105);
  if (kinkajou) mammalCEye(c, hx + headRx * 0.24, hy - headRy * 0.14, eyeR, '#21150d');
  else mammalCProfileEye(c, hx + headRx * 0.24, hy - headRy * 0.14, eyeR, '#8b642d');
  if (kinkajou) { c.fillStyle = '#171116'; c.beginPath(); c.arc(hx + headRx * 0.26, hy - headRy * 0.14, eyeR * 0.72, 0, TAU); c.fill(); }
  mammalCNose(c, hx + muzzleLen, hy + headRy * 0.12, S * 0.0115, S * 0.0085);
  c.strokeStyle = 'rgba(39,31,27,0.74)'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx + headRx * 0.28, hy + headRy * 0.38); c.lineTo(hx + muzzleLen * 0.92, hy + headRy * 0.38); c.stroke();
  c.strokeStyle = 'rgba(32,29,28,0.56)'; c.lineWidth = 1.5; c.lineCap = 'round';
  for (const x of [left + S * 0.115, right - S * 0.035]) for (let i = 0; i < 4; i++) {
    c.beginPath(); c.moveTo(x + S * (0.008 + i * 0.008), groundY - S * 0.024); c.lineTo(x + S * (0.010 + i * 0.009), groundY - S * 0.017); c.stroke();
  }
}

function faunaResetMarsupialC(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name: string): void {
  const p = pal(p0, spec);
  const r = mulberry32((((g.seed as number) ^ 0xA57A ^ nameSeedQ(name)) >>> 0));
  const possum = name === 'Possum', quoll = name === 'Quoll';
  const devil = name === 'Tasmanian Devil', wombat = name === 'Wombat';
  const groundY = S * 0.805;
  const left = S * (possum ? 0.310 : quoll ? 0.305 : devil ? 0.270 : 0.255);
  const right = S * (possum ? 0.625 : quoll ? 0.640 : devil ? 0.595 : 0.640);
  const top = S * (possum ? 0.430 : quoll ? 0.460 : devil ? 0.420 : 0.390);
  const bottom = S * (possum ? 0.645 : quoll ? 0.635 : devil ? 0.675 : 0.690);
  const hx = S * (possum ? 0.715 : quoll ? 0.725 : devil ? 0.705 : 0.710);
  const hy = S * (possum ? 0.480 : quoll ? 0.505 : devil ? 0.515 : 0.525);
  const headRx = S * (possum ? 0.064 : quoll ? 0.068 : devil ? 0.090 : 0.087) * (spec.headScale ?? 1);
  const headRy = headRx * (devil ? 0.80 : wombat ? 0.82 : 0.86);
  const muzzleLen = S * (possum ? 0.105 : quoll ? 0.092 : devil ? 0.128 : 0.112);
  const legW = S * (wombat ? 0.043 : devil ? 0.034 : 0.026);

  mammalBGround(c, S * 0.49, groundY + S * 0.020, S * (wombat ? 0.31 : 0.29));
  const total = new Path2D();
  let tail: Path2D | null = null;
  let possumTail: Path2D | null = null;
  if (possum) {
    possumTail = new Path2D(); possumTail.moveTo(left + S * 0.072, top + S * 0.095);
    possumTail.bezierCurveTo(S * 0.238, S * 0.500, S * 0.110, S * 0.575, S * 0.040, S * 0.674);
    possumTail.quadraticCurveTo(S * 0.030, S * 0.690, S * 0.046, S * 0.702);
    possumTail.bezierCurveTo(S * 0.135, S * 0.608, S * 0.252, S * 0.545, left + S * 0.085, top + S * 0.132);
    possumTail.closePath();
    const tg = c.createLinearGradient(left, top, S * 0.04, S * 0.69); tg.addColorStop(0, '#b99b91'); tg.addColorStop(0.45, '#d39c9b'); tg.addColorStop(1, '#d9aaa5');
    c.fillStyle = tg; c.fill(possumTail); total.addPath(possumTail);
  } else if (!wombat) {
    tail = new Path2D();
    const len = S * (quoll ? 0.275 : 0.155), th = S * (quoll ? 0.044 : 0.048);
    const tipX = Math.max(S * 0.025, left - len), tipY = top + S * (quoll ? 0.155 : 0.190);
    tail.moveTo(left + S * 0.070, top + S * 0.090);
    tail.bezierCurveTo(left - len * 0.36, top + S * 0.085, tipX + len * 0.15, tipY - th * 0.64, tipX, tipY);
    tail.quadraticCurveTo(tipX - th * 0.03, tipY + th * 0.52, tipX + th * 0.58, tipY + th * 0.78);
    tail.bezierCurveTo(left - len * 0.38, tipY + th * 0.64, left + S * 0.006, top + S * 0.190, left + S * 0.075, top + S * 0.130);
    tail.closePath(); total.addPath(tail);
  }

  const body = new Path2D(); body.moveTo(left + S * 0.020, top + S * 0.050);
  body.bezierCurveTo(left + S * 0.055, top - S * (wombat ? 0.038 : 0.014), right - S * 0.110, top - S * (devil ? 0.020 : 0.010), right, top + S * 0.035);
  body.bezierCurveTo(right + S * 0.025, top + S * 0.135, right - S * 0.015, bottom, right - S * 0.075, bottom + S * 0.012);
  body.bezierCurveTo(right - S * 0.160, bottom + S * 0.038, left + S * 0.092, bottom + S * 0.040, left - S * 0.012, top + S * (wombat ? 0.205 : 0.145));
  body.quadraticCurveTo(left - S * 0.016, top + S * 0.090, left + S * 0.020, top + S * 0.050); body.closePath(); total.addPath(body);

  const leg = (x: number, fore: boolean, far: boolean): Path2D => {
    const q = new Path2D(), y0 = bottom - S * 0.025, w = legW * (far ? 0.82 : 1);
    if (wombat) {
      q.moveTo(x - w, y0); q.bezierCurveTo(x - w * 1.55, y0 + S * 0.050, x - w * 1.35, groundY - S * 0.060, x - w * 0.65, groundY - S * 0.030);
      q.quadraticCurveTo(x + S * 0.018, groundY - S * 0.008, x + S * 0.060, groundY - S * 0.018);
      q.quadraticCurveTo(x + S * 0.064, groundY - S * 0.044, x + w * 0.80, groundY - S * 0.060);
      q.bezierCurveTo(x + w * 1.40, groundY - S * 0.092, x + w * 1.45, y0 + S * 0.050, x + w, y0);
    } else {
      const shift = fore ? S * 0.006 : S * 0.018;
      q.moveTo(x - w, y0); q.bezierCurveTo(x - w * 1.05, y0 + S * 0.042, x - w * 0.55 + shift, groundY - S * 0.052, x - S * 0.006 + shift, groundY - S * 0.026);
      q.quadraticCurveTo(x + S * 0.020 + shift, groundY - S * 0.010, x + S * 0.050 + shift, groundY - S * 0.020);
      q.quadraticCurveTo(x + S * 0.054 + shift, groundY - S * 0.040, x + w * 0.72 + shift, groundY - S * 0.052);
      q.bezierCurveTo(x + w * 0.90, groundY - S * 0.080, x + w * 1.15, y0 + S * 0.022, x + w, y0);
    }
    q.closePath(); return q;
  };
  const legs = [leg(left + S * 0.075, false, true), leg(left + S * 0.130, false, false), leg(right - S * 0.090, true, true), leg(right - S * 0.035, true, false)];
  for (const q of legs) total.addPath(q);
  const neck = new Path2D(); neck.moveTo(right - S * 0.080, top + S * 0.020);
  neck.bezierCurveTo(right + S * 0.015, top - S * 0.010, hx - headRx * 0.78, hy - headRy * 0.72, hx - headRx * 0.38, hy - headRy * 0.44);
  neck.lineTo(hx - headRx * 0.34, hy + headRy * 0.72); neck.bezierCurveTo(right + S * 0.012, bottom - S * 0.030, right - S * 0.055, bottom, right - S * 0.080, top + S * 0.020); neck.closePath(); total.addPath(neck);

  const head = new Path2D();
  if (devil || wombat) {
    head.moveTo(hx - headRx, hy - headRy * 0.20); head.quadraticCurveTo(hx - headRx * 0.48, hy - headRy * 1.05, hx + headRx * 0.54, hy - headRy * 0.80);
    head.quadraticCurveTo(hx + headRx * 1.02, hy - headRy * 0.16, hx + headRx * 0.72, hy + headRy * 0.62); head.quadraticCurveTo(hx - headRx * 0.08, hy + headRy * 1.02, hx - headRx, hy + headRy * 0.30);
  } else head.ellipse(hx, hy, headRx, headRy, -0.08, 0, TAU);
  head.closePath(); total.addPath(head);
  const muzzle = new Path2D(); muzzle.moveTo(hx + headRx * 0.12, hy - headRy * (devil ? 0.18 : 0.05));
  muzzle.quadraticCurveTo(hx + headRx * 0.65, hy - headRy * 0.15, hx + muzzleLen, hy + headRy * (devil ? 0.02 : 0.11));
  muzzle.quadraticCurveTo(hx + muzzleLen * 0.98, hy + headRy * (devil ? 0.62 : 0.46), hx + headRx * 0.24, hy + headRy * (devil ? 0.66 : 0.50));
  muzzle.quadraticCurveTo(hx + headRx * 0.04, hy + headRy * 0.30, hx + headRx * 0.12, hy - headRy * (devil ? 0.18 : 0.05)); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) {
    const ex = hx - headRx * 0.40 + side * headRx * 0.34, ey = hy - headRy * 0.64;
    const ear = new Path2D(); ear.ellipse(ex, ey - headRy * 0.18, headRx * (possum ? 0.32 : wombat ? 0.22 : 0.26), headRy * (possum ? 0.46 : 0.34), side * 0.18, 0, TAU);
    ears.push(ear); total.addPath(ear);
  }
  const fillOrder = tail ? [tail, legs[0]!, legs[2]!, ...ears, body, legs[1]!, legs[3]!, neck, head, muzzle] : [legs[0]!, legs[2]!, ...ears, body, legs[1]!, legs[3]!, neck, head, muzzle];
  mammalBFill(c, fillOrder, p, S * 0.025, Math.min(top, hy - headRy), hx + muzzleLen, groundY);
  mammalCFurGrain(c, total, r, possum || quoll ? S * 0.035 : left - S * 0.02, Math.min(top, hy - headRy), hx + muzzleLen, bottom,
    wombat ? 86 : devil ? 72 : 68,
    possum ? 'rgba(240,237,226,0.23)' : quoll ? 'rgba(246,213,174,0.20)' : 'rgba(235,223,204,0.15)',
    devil ? 'rgba(0,0,0,0.24)' : 'rgba(53,38,32,0.18)');

  if (possum && possumTail) {
    const bez = (a: number, b: number, d: number, e: number, t: number): number => {
      const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * d + t * t * t * e;
    };
    c.save(); c.clip(possumTail); c.strokeStyle = 'rgba(83,50,52,0.82)'; c.lineWidth = S * 0.006; c.lineCap = 'round';
    for (let i = 1; i <= 13; i++) {
      const t = i / 14;
      const tx = bez(left + S * 0.072, S * 0.238, S * 0.110, S * 0.040, t);
      const ty = bez(top + S * 0.095, S * 0.500, S * 0.575, S * 0.674, t);
      const bx = bez(left + S * 0.085, S * 0.252, S * 0.135, S * 0.046, t);
      const by = bez(top + S * 0.132, S * 0.545, S * 0.608, S * 0.702, t);
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(bx, by); c.stroke();
    }
    c.restore();
  }

  c.save(); c.clip(total);
  if (possum) {
    for (let i = 0; i < 36; i++) {
      const x = left + S * 0.015 + r() * (right - left - S * 0.030), y = top + S * 0.020 + r() * (bottom - top - S * 0.030);
      c.strokeStyle = r() > 0.48 ? 'rgba(233,228,217,0.33)' : 'rgba(45,43,44,0.30)'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(x - S * 0.010, y); c.lineTo(x + S * 0.010, y + S * 0.005); c.stroke();
    }
  } else if (quoll) {
    c.fillStyle = '#f3eee4';
    for (let i = 0; i < 34; i++) {
      const x = left + S * 0.014 + r() * (right - left - S * 0.025), y = top + S * 0.020 + r() * (bottom - top - S * 0.040);
      c.beginPath(); c.arc(x, y, S * (0.0055 + r() * 0.004), 0, TAU); c.fill();
    }
  }
  c.restore();
  if (quoll && tail) {
    c.save(); c.clip(tail); c.fillStyle = '#f3eee4';
    for (let i = 0; i < 11; i++) { const t = (i + 1) / 12; c.beginPath(); c.arc(left - S * 0.25 * t, top + S * (0.095 + 0.075 * t), S * 0.0075, 0, TAU); c.fill(); }
    c.restore();
  }

  if (devil) {
    const blaze = new Path2D(); blaze.moveTo(right - S * 0.047, top + S * 0.042);
    blaze.bezierCurveTo(right - S * 0.020, top + S * 0.054, right + S * 0.005, top + S * 0.104, right + S * 0.010, top + S * 0.150);
    blaze.bezierCurveTo(right + S * 0.003, top + S * 0.215, right - S * 0.009, bottom - S * 0.018, right - S * 0.025, bottom + S * 0.002);
    blaze.bezierCurveTo(right - S * 0.045, bottom - S * 0.014, right - S * 0.057, top + S * 0.176, right - S * 0.058, top + S * 0.102);
    blaze.quadraticCurveTo(right - S * 0.057, top + S * 0.060, right - S * 0.047, top + S * 0.042); blaze.closePath();
    c.save(); c.clip(body);
    const blazeFill = c.createLinearGradient(right - S * 0.07, top, right + S * 0.02, bottom);
    blazeFill.addColorStop(0, '#f3ede2'); blazeFill.addColorStop(0.64, '#e8dfd0'); blazeFill.addColorStop(1, '#cfc3b3');
    c.fillStyle = blazeFill; c.fill(blaze); c.restore();
  }
  if (possum) {
    c.save(); c.clip(head); c.fillStyle = '#eee8dc'; c.beginPath(); c.ellipse(hx + headRx * 0.18, hy + headRy * 0.08, headRx * 0.72, headRy * 0.66, -0.12, 0, TAU); c.fill(); c.restore();
    c.fillStyle = '#d6a2a0';
    for (const side of [-1, 1]) { const ex = hx - headRx * 0.40 + side * headRx * 0.34, ey = hy - headRy * 0.82; c.beginPath(); c.ellipse(ex, ey, headRx * 0.20, headRy * 0.28, side * 0.18, 0, TAU); c.fill(); }
  } else if (devil) {
    c.fillStyle = '#8e5558';
    for (const side of [-1, 1]) { const ex = hx - headRx * 0.40 + side * headRx * 0.34, ey = hy - headRy * 0.82; c.beginPath(); c.ellipse(ex, ey, headRx * 0.16, headRy * 0.21, side * 0.18, 0, TAU); c.fill(); }
  }
  const muzzleG = c.createLinearGradient(hx, hy, hx + muzzleLen, hy + headRy * 0.48);
  muzzleG.addColorStop(0, spec.muzzleHue ?? mammalBTone(p, 1.18)); muzzleG.addColorStop(1, possum ? '#e8d9cc' : quoll ? '#bd716e' : mammalBTone(p, 0.68));
  c.fillStyle = muzzleG; c.fill(muzzle);
  if (devil) {
    const mouth = new Path2D(); mouth.moveTo(hx + headRx * 0.25, hy + headRy * 0.13); mouth.quadraticCurveTo(hx + muzzleLen * 0.72, hy + headRy * 0.18, hx + muzzleLen * 0.94, hy + headRy * 0.34);
    mouth.quadraticCurveTo(hx + muzzleLen * 0.70, hy + headRy * 0.72, hx + headRx * 0.22, hy + headRy * 0.52); mouth.closePath();
    c.fillStyle = '#160f13'; c.fill(mouth); c.fillStyle = '#e7d7bc';
    for (let i = 0; i < 5; i++) { const x = hx + headRx * 0.32 + i * S * 0.017; c.beginPath(); c.moveTo(x, hy + headRy * 0.20); c.lineTo(x + S * 0.006, hy + headRy * 0.38); c.lineTo(x + S * 0.012, hy + headRy * 0.21); c.closePath(); c.fill(); }
    c.fillStyle = '#b64e5b'; c.beginPath(); c.ellipse(hx + headRx * 0.60, hy + headRy * 0.52, headRx * 0.32, headRy * 0.15, 0.10, 0, TAU); c.fill();
  }
  const eyeR = S * (devil ? 0.0115 : wombat ? 0.011 : 0.0095);
  mammalCProfileEye(c, hx + headRx * 0.25, hy - headRy * 0.17, eyeR, devil ? '#7f4f2c' : '#76502b');
  if (wombat) mammalCNose(c, hx + muzzleLen * 0.98, hy + headRy * 0.12, S * 0.031, S * 0.021, '#292526');
  else mammalCNose(c, hx + muzzleLen, hy + headRy * (devil ? 0.05 : 0.12), S * (possum || quoll ? 0.012 : 0.017), S * (possum || quoll ? 0.009 : 0.012), possum || quoll ? '#b96f72' : '#171518');
  c.strokeStyle = 'rgba(31,27,27,0.58)'; c.lineWidth = wombat ? 2.2 : 1.5; c.lineCap = 'round';
  for (const x of [left + S * 0.130, right - S * 0.035]) for (let i = 0; i < (wombat ? 4 : 3); i++) {
    c.beginPath(); c.moveTo(x + S * (0.008 + i * 0.009), groundY - S * 0.025); c.lineTo(x + S * (0.012 + i * 0.010), groundY - S * (wombat ? 0.010 : 0.018)); c.stroke();
  }
}

/** Wave 2d exact-name forms keep the catalogue contract in the silhouette.
    Shared helpers below provide paint, grain and small facial anatomy only;
    every route still supplies its own complete body, limb, skull and tail. */
function mammalDWhiskers(
  c: Ctx, x: number, y: number, length: number, spread: number,
  count = 5, colour = 'rgba(238,232,218,0.70)',
): void {
  c.strokeStyle = colour; c.lineWidth = 1.25; c.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    c.beginPath(); c.moveTo(x, y + (t - 0.5) * spread * 0.28);
    c.quadraticCurveTo(x + length * 0.52, y + (t - 0.5) * spread * 0.58,
      x + length, y + (t - 0.5) * spread); c.stroke();
  }
}

function mammalDInnerEar(c: Ctx, ear: Path2D, fill = 'rgba(45,31,30,0.56)'): void {
  c.save(); c.clip(ear); c.fillStyle = fill; c.fillRect(0, 0, S, S); c.restore();
}

type MammalDMustelid = Extract<MammalDPlan, 'Badger' | 'Fisher' | 'Marten' | 'Mink' | 'Wolverine'>;

function faunaResetMustelidD(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: MammalDMustelid): void {
  const p = pal(p0, spec);
  const r = mulberry32((((g.seed as number) ^ 0xD41D ^ nameSeedQ(plan)) >>> 0));
  const badger = plan === 'Badger', fisher = plan === 'Fisher', marten = plan === 'Marten';
  const mink = plan === 'Mink', wolverine = plan === 'Wolverine';
  const groundY = S * 0.795;
  const left = S * (wolverine ? 0.195 : badger ? 0.205 : 0.265);
  const right = S * (wolverine ? 0.655 : badger ? 0.665 : fisher ? 0.655 : 0.640);
  const bodyBottom = S * (wolverine ? 0.660 : badger ? 0.685 : mink ? 0.665 : 0.655);
  const rumpTop = S * (wolverine ? 0.365 : badger ? 0.435 : mink ? 0.475 : 0.445);
  const shoulderTop = S * (wolverine ? 0.315 : badger ? 0.420 : marten ? 0.405 : fisher ? 0.425 : 0.455);
  const hx = S * (wolverine ? 0.760 : badger ? 0.775 : 0.755);
  const hy = S * (wolverine ? 0.425 : badger ? 0.505 : marten ? 0.455 : fisher ? 0.475 : 0.495);
  const headRx = S * (wolverine ? 0.088 : badger ? 0.076 : fisher ? 0.068 : marten ? 0.064 : 0.058);
  const headRy = headRx * (badger ? 0.72 : wolverine ? 0.86 : 0.80);
  const muzzleLen = headRx * (badger ? 1.18 : wolverine ? 0.90 : fisher ? 0.98 : marten ? 1.02 : 1.06);
  const legW = S * (wolverine ? 0.042 : badger ? 0.032 : fisher ? 0.025 : 0.022);

  mammalBGround(c, S * 0.49, groundY + S * 0.014, S * (wolverine ? 0.31 : 0.28));
  const total = new Path2D();
  const tail = new Path2D();
  const tailBaseY = rumpTop + (bodyBottom - rumpTop) * 0.50;
  if (badger) {
    tail.moveTo(left + S * 0.012, tailBaseY - S * 0.025);
    tail.quadraticCurveTo(left - S * 0.070, tailBaseY - S * 0.012, left - S * 0.075, tailBaseY + S * 0.030);
    tail.quadraticCurveTo(left - S * 0.035, tailBaseY + S * 0.055, left + S * 0.018, tailBaseY + S * 0.024); tail.closePath();
  } else {
    const bush = wolverine ? S * 0.060 : fisher ? S * 0.050 : marten ? S * 0.058 : S * 0.021;
    const tipX = left - S * (wolverine ? 0.135 : fisher ? 0.235 : marten ? 0.245 : 0.230);
    const tipY = groundY - S * (wolverine ? 0.070 : fisher ? 0.095 : marten ? 0.115 : 0.075);
    tail.moveTo(left + S * 0.018, tailBaseY - bush);
    tail.bezierCurveTo(left - S * 0.055, tailBaseY - bush * 1.15, tipX + S * 0.045, tipY - bush * 0.58, tipX, tipY);
    tail.quadraticCurveTo(tipX - bush * 0.28, tipY + bush * 0.54, tipX + bush * 0.40, tipY + bush * 0.72);
    tail.bezierCurveTo(tipX + S * 0.080, tipY + bush * 0.72, left - S * 0.030, tailBaseY + bush * 0.82, left + S * 0.018, tailBaseY + bush * 0.52); tail.closePath();
  }
  total.addPath(tail);

  const body = new Path2D();
  body.moveTo(left, bodyBottom - S * 0.035);
  body.bezierCurveTo(left - S * 0.020, rumpTop + S * 0.055, left + S * 0.045, rumpTop, left + S * 0.105, rumpTop);
  if (wolverine) {
    body.bezierCurveTo(left + S * 0.185, rumpTop - S * 0.008, right - S * 0.135, shoulderTop - S * 0.025, right, shoulderTop + S * 0.048);
  } else {
    body.bezierCurveTo(left + S * 0.155, rumpTop - S * (marten ? 0.018 : 0.004), right - S * 0.100, shoulderTop - S * 0.010, right, shoulderTop + S * 0.025);
  }
  body.bezierCurveTo(right + S * 0.025, shoulderTop + S * 0.090, right + S * 0.010, bodyBottom - S * 0.010, right - S * 0.035, bodyBottom + S * 0.012);
  body.bezierCurveTo(right - S * 0.150, bodyBottom + S * (wolverine ? 0.040 : 0.020), left + S * 0.080, bodyBottom + S * 0.022, left, bodyBottom - S * 0.035); body.closePath();
  total.addPath(body);

  const leg = (x: number, fore: boolean, far: boolean): Path2D => {
    const q = new Path2D();
    const rootY = bodyBottom - S * (fore ? 0.052 : 0.040);
    const w = legW * (far ? 0.82 : 1);
    const ankleX = x + (fore ? S * 0.010 : -S * 0.008);
    q.moveTo(x - w, rootY);
    q.bezierCurveTo(x - w * 1.08, rootY + S * 0.050, ankleX - w * 0.72, groundY - S * 0.056, ankleX - w * 0.42, groundY - S * 0.027);
    q.quadraticCurveTo(ankleX + w * 0.50, groundY + S * 0.005, ankleX + w * (badger && fore ? 2.10 : 1.45), groundY - S * 0.012);
    q.quadraticCurveTo(ankleX + w * (badger && fore ? 2.20 : 1.55), groundY - S * 0.034, ankleX + w * 0.66, groundY - S * 0.052);
    q.bezierCurveTo(ankleX + w * 0.72, groundY - S * 0.085, x + w * 1.15, rootY + S * 0.030, x + w, rootY); q.closePath(); return q;
  };
  const legX = [left + S * 0.075, left + S * 0.130, right - S * 0.105, right - S * 0.050];
  const legs = legX.map((x, i) => leg(x, i > 1, i === 0 || i === 2));
  for (const q of legs) total.addPath(q);

  const neck = new Path2D();
  neck.moveTo(right - S * 0.070, shoulderTop + S * 0.015);
  neck.bezierCurveTo(right + S * 0.010, shoulderTop - S * 0.015, hx - headRx * 0.85, hy - headRy * 0.66, hx - headRx * 0.48, hy - headRy * 0.45);
  neck.lineTo(hx - headRx * 0.38, hy + headRy * 0.74);
  neck.bezierCurveTo(right + S * 0.010, bodyBottom - S * 0.015, right - S * 0.045, bodyBottom, right - S * 0.070, shoulderTop + S * 0.015); neck.closePath(); total.addPath(neck);
  const head = new Path2D(); head.ellipse(hx, hy, headRx, headRy, -0.05, 0, TAU); total.addPath(head);
  const muzzle = new Path2D();
  muzzle.moveTo(hx + headRx * 0.18, hy - headRy * 0.15);
  muzzle.quadraticCurveTo(hx + headRx * 0.72, hy - headRy * 0.15, hx + muzzleLen, hy + headRy * 0.05);
  muzzle.quadraticCurveTo(hx + muzzleLen * 1.08, hy + headRy * 0.34, hx + headRx * 0.50, hy + headRy * 0.48);
  muzzle.quadraticCurveTo(hx + headRx * 0.20, hy + headRy * 0.40, hx + headRx * 0.10, hy + headRy * 0.16); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) {
    const ear = new Path2D();
    const ex = hx - headRx * 0.42 + side * headRx * 0.34, ey = hy - headRy * 0.72;
    ear.ellipse(ex, ey, headRx * (badger ? 0.16 : marten ? 0.35 : fisher ? 0.32 : 0.23),
      headRy * (badger ? 0.22 : marten ? 0.56 : fisher ? 0.46 : 0.32), side * 0.18, 0, TAU);
    ears.push(ear); total.addPath(ear);
  }

  mammalBFill(c, [tail, legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, neck, head, muzzle, ...ears],
    p, left - S * 0.20, Math.min(rumpTop, shoulderTop), hx + muzzleLen, bodyBottom);
  mammalCFurGrain(c, total, r, left - S * 0.20, Math.min(rumpTop, shoulderTop), hx + muzzleLen, bodyBottom,
    wolverine ? 95 : fisher ? 78 : marten ? 68 : mink ? 42 : 60,
    mink ? 'rgba(255,231,205,0.18)' : 'rgba(255,239,210,0.22)', 'rgba(40,28,25,0.22)');

  if (fisher || marten || wolverine) {
    /* Break the tail outline with short overlapping guard hairs. Width alone
       still read as an otter's smooth muscular taper at thumbnail scale. */
    const tipX = left - S * (wolverine ? 0.135 : fisher ? 0.235 : 0.245);
    const tipY = groundY - S * (wolverine ? 0.070 : fisher ? 0.095 : 0.115);
    const bush = S * (wolverine ? 0.060 : fisher ? 0.050 : 0.058);
    c.strokeStyle = mammalBTone(p, 0.88); c.lineWidth = 2.3; c.lineCap = 'round';
    for (let i = 1; i < 12; i++) {
      const t = i / 12, x = left * (1 - t) + tipX * t;
      const y = tailBaseY * (1 - t) + tipY * t, rad = bush * (1 - t * 0.62);
      const tooth = S * (0.008 + (i % 3) * 0.003);
      c.beginPath(); c.moveTo(x + S * 0.006, y - rad * 0.72); c.lineTo(x - tooth, y - rad * (1.00 + (i % 2) * 0.10)); c.stroke();
      c.beginPath(); c.moveTo(x + S * 0.006, y + rad * 0.68); c.lineTo(x - tooth, y + rad * (0.96 + ((i + 1) % 2) * 0.10)); c.stroke();
    }
  }

  if (badger) {
    c.save(); c.clip(body);
    c.strokeStyle = '#252426'; c.lineWidth = S * 0.118; c.lineCap = 'round';
    c.beginPath(); c.moveTo(left + S * 0.045, rumpTop + S * 0.060);
    c.bezierCurveTo(left + S * 0.175, rumpTop + S * 0.010, right - S * 0.120, shoulderTop + S * 0.015, right + S * 0.008, shoulderTop + S * 0.080); c.stroke();
    c.strokeStyle = '#e7e2d7'; c.lineWidth = S * 0.030;
    c.beginPath(); c.moveTo(left + S * 0.020, rumpTop + S * 0.008);
    c.bezierCurveTo(left + S * 0.180, rumpTop - S * 0.012, right - S * 0.080, shoulderTop - S * 0.006, right + S * 0.010, shoulderTop + S * 0.020); c.stroke(); c.restore();
    c.fillStyle = '#eee9df'; c.fill(head); c.fill(muzzle);
    c.strokeStyle = '#242326'; c.lineWidth = S * 0.027; c.lineCap = 'round';
    c.beginPath(); c.moveTo(hx - headRx * 0.62, hy - headRy * 0.38); c.lineTo(hx + muzzleLen * 0.84, hy + headRy * 0.04); c.stroke();
    c.beginPath(); c.moveTo(hx - headRx * 0.48, hy + headRy * 0.24); c.lineTo(hx + muzzleLen * 0.74, hy + headRy * 0.28); c.stroke();
    c.strokeStyle = '#e7e2d7'; c.lineWidth = S * 0.014;
    c.beginPath(); c.moveTo(hx - headRx * 0.62, hy - headRy * 0.68); c.lineTo(hx + muzzleLen * 0.90, hy - headRy * 0.06); c.stroke();
  } else if (wolverine) {
    c.save(); c.clip(body); c.strokeStyle = '#c59b64'; c.lineWidth = S * 0.040; c.lineCap = 'round';
    c.beginPath(); c.moveTo(right - S * 0.010, shoulderTop + S * 0.105);
    c.bezierCurveTo(right - S * 0.130, bodyBottom - S * 0.040, left + S * 0.120, bodyBottom - S * 0.025, left + S * 0.020, tailBaseY + S * 0.030); c.stroke(); c.restore();
  } else if (marten) {
    const bib = new Path2D(); bib.moveTo(hx - headRx * 0.62, hy + headRy * 0.34);
    bib.bezierCurveTo(right + S * 0.025, hy + S * 0.055, right - S * 0.010, bodyBottom - S * 0.025, right - S * 0.075, bodyBottom - S * 0.020);
    bib.quadraticCurveTo(right - S * 0.085, hy + S * 0.025, hx - headRx * 0.42, hy + headRy * 0.18); bib.closePath();
    c.fillStyle = '#e6a85e'; c.fill(bib);
  } else if (mink) {
    c.fillStyle = '#f0e9dc'; c.beginPath(); c.ellipse(hx + headRx * 0.47, hy + headRy * 0.34, headRx * 0.34, headRy * 0.18, 0.02, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,242,221,0.34)'; c.lineWidth = S * 0.010; c.lineCap = 'round';
    c.beginPath(); c.moveTo(left + S * 0.060, rumpTop + S * 0.048); c.quadraticCurveTo((left + right) * 0.5, rumpTop - S * 0.015, right - S * 0.020, shoulderTop + S * 0.050); c.stroke();
  }

  for (const ear of ears) mammalDInnerEar(c, ear);
  mammalCProfileEye(c, hx + headRx * 0.28, hy - headRy * 0.18, S * (wolverine ? 0.010 : 0.0085), '#8f5f2f');
  mammalCNose(c, hx + muzzleLen, hy + headRy * 0.06, S * (wolverine ? 0.016 : 0.013), S * 0.0095);
  if (badger) {
    c.strokeStyle = '#d8c7a5'; c.lineWidth = 2.3; c.lineCap = 'round';
    for (const x of [legX[2]!, legX[3]!]) for (let i = 0; i < 4; i++) {
      const sx = x + legW * (0.55 + i * 0.48); c.beginPath(); c.moveTo(sx, groundY - S * 0.011);
      c.quadraticCurveTo(sx + S * 0.027, groundY + S * 0.001, sx + S * 0.052, groundY + S * 0.006); c.stroke();
    }
  } else if (wolverine) {
    c.strokeStyle = '#dec89f'; c.lineWidth = 2.6; c.lineCap = 'round';
    for (const x of [legX[1]!, legX[3]!]) for (let i = 0; i < 4; i++) {
      const sx = x + legW * (0.45 + i * 0.38); c.beginPath(); c.moveTo(sx, groundY - S * 0.013);
      c.quadraticCurveTo(sx + S * 0.017, groundY - S * 0.001, sx + S * 0.031, groundY + S * 0.005); c.stroke();
    }
  }
}

type MammalDViverrid = Extract<MammalDPlan, 'Civet' | 'Mongoose'>;

function faunaResetViverridD(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: MammalDViverrid): void {
  const p = pal(p0, spec), civet = plan === 'Civet';
  const r = mulberry32((((g.seed as number) ^ 0xD71D ^ nameSeedQ(plan)) >>> 0));
  const groundY = S * 0.795, left = S * 0.300, right = S * (civet ? 0.650 : 0.635);
  const rumpTop = S * (civet ? 0.420 : 0.455), shoulderTop = S * (civet ? 0.405 : 0.440);
  const bodyBottom = S * (civet ? 0.650 : 0.665);
  const hx = S * 0.755, hy = S * (civet ? 0.470 : 0.500);
  const headRx = S * (civet ? 0.070 : 0.060), headRy = S * (civet ? 0.058 : 0.050);
  const muzzleLen = S * (civet ? 0.125 : 0.095), legW = S * (civet ? 0.022 : 0.020);
  mammalBGround(c, S * 0.48, groundY + S * 0.014, S * 0.30);

  const total = new Path2D();
  const tail = new Path2D();
  const tailBaseY = rumpTop + S * 0.100, tipX = S * (civet ? 0.055 : 0.035), tipY = groundY - S * (civet ? 0.080 : 0.060);
  tail.moveTo(left + S * 0.012, tailBaseY - S * (civet ? 0.032 : 0.040));
  tail.bezierCurveTo(left - S * 0.060, tailBaseY - S * 0.045, tipX + S * 0.060, tipY - S * 0.022, tipX, tipY);
  tail.quadraticCurveTo(tipX - S * 0.012, tipY + S * 0.018, tipX + S * 0.030, tipY + S * (civet ? 0.030 : 0.012));
  tail.bezierCurveTo(tipX + S * 0.085, tipY + S * 0.035, left - S * 0.035, tailBaseY + S * (civet ? 0.044 : 0.052), left + S * 0.018, tailBaseY + S * 0.026); tail.closePath();
  total.addPath(tail);
  const body = new Path2D(); body.moveTo(left, bodyBottom - S * 0.035);
  body.bezierCurveTo(left - S * 0.020, rumpTop + S * 0.055, left + S * 0.040, rumpTop, left + S * 0.090, rumpTop);
  body.bezierCurveTo(left + S * 0.165, rumpTop - S * 0.008, right - S * 0.080, shoulderTop - S * 0.010, right, shoulderTop + S * 0.025);
  body.bezierCurveTo(right + S * 0.022, shoulderTop + S * 0.090, right + S * 0.008, bodyBottom - S * 0.008, right - S * 0.035, bodyBottom + S * 0.012);
  body.bezierCurveTo(right - S * 0.130, bodyBottom + S * 0.026, left + S * 0.070, bodyBottom + S * 0.024, left, bodyBottom - S * 0.035); body.closePath(); total.addPath(body);
  const leg = (x: number, far: boolean): Path2D => {
    const q = new Path2D(), w = legW * (far ? 0.82 : 1), y0 = bodyBottom - S * 0.035;
    q.moveTo(x - w, y0); q.bezierCurveTo(x - w, y0 + S * 0.045, x - w * 0.55, groundY - S * 0.052, x, groundY - S * 0.025);
    q.quadraticCurveTo(x + S * 0.020, groundY - S * 0.002, x + S * 0.045, groundY - S * 0.012);
    q.quadraticCurveTo(x + S * 0.048, groundY - S * 0.032, x + w * 0.55, groundY - S * 0.050);
    q.bezierCurveTo(x + w * 0.75, groundY - S * 0.090, x + w * 1.12, y0 + S * 0.028, x + w, y0); q.closePath(); return q;
  };
  const legX = [left + S * 0.070, left + S * 0.120, right - S * 0.095, right - S * 0.045];
  const legs = legX.map((x, i) => leg(x, i === 0 || i === 2)); for (const q of legs) total.addPath(q);
  const neck = new Path2D(); neck.moveTo(right - S * 0.070, shoulderTop + S * 0.012);
  neck.bezierCurveTo(right + S * 0.012, shoulderTop - S * 0.010, hx - headRx * 0.82, hy - headRy * 0.68, hx - headRx * 0.45, hy - headRy * 0.42);
  neck.lineTo(hx - headRx * 0.38, hy + headRy * 0.72); neck.bezierCurveTo(right + S * 0.004, bodyBottom - S * 0.018, right - S * 0.045, bodyBottom, right - S * 0.070, shoulderTop + S * 0.012); neck.closePath(); total.addPath(neck);
  const head = new Path2D(); head.ellipse(hx, hy, headRx, headRy, -0.07, 0, TAU); total.addPath(head);
  const muzzle = new Path2D();
  if (civet) {
    muzzle.moveTo(hx + headRx * 0.02, hy - headRy * 0.16);
    muzzle.bezierCurveTo(hx + headRx * 0.55, hy - headRy * 0.19,
      hx + muzzleLen * 0.82, hy - headRy * 0.08, hx + muzzleLen, hy + headRy * 0.02);
    muzzle.quadraticCurveTo(hx + muzzleLen * 0.96, hy + headRy * 0.17,
      hx + headRx * 0.37, hy + headRy * 0.36);
    muzzle.quadraticCurveTo(hx + headRx * 0.12, hy + headRy * 0.34,
      hx + headRx * 0.01, hy + headRy * 0.10);
  } else {
    muzzle.moveTo(hx + headRx * 0.15, hy - headRy * 0.13);
    muzzle.quadraticCurveTo(hx + headRx * 0.70, hy - headRy * 0.18, hx + muzzleLen, hy + headRy * 0.03);
    muzzle.quadraticCurveTo(hx + muzzleLen * 1.06, hy + headRy * 0.26, hx + headRx * 0.44, hy + headRy * 0.43);
    muzzle.quadraticCurveTo(hx + headRx * 0.18, hy + headRy * 0.38, hx + headRx * 0.08, hy + headRy * 0.12);
  }
  muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) { const ear = new Path2D(); ear.ellipse(hx - headRx * 0.43 + side * headRx * 0.34, hy - headRy * 0.73, headRx * 0.24, headRy * 0.34, side * 0.18, 0, TAU); ears.push(ear); total.addPath(ear); }
  mammalBFill(c, [tail, legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, neck, head, muzzle, ...ears],
    p, tipX, rumpTop, hx + muzzleLen, bodyBottom);
  mammalCFurGrain(c, total, r, tipX, rumpTop, hx + muzzleLen, bodyBottom, civet ? 64 : 72,
    'rgba(255,242,212,0.22)', 'rgba(42,34,28,0.20)');

  if (civet) {
    c.save(); c.clip(body); c.fillStyle = 'rgba(47,42,35,0.72)';
    for (let i = 0; i < 26; i++) {
      const x = left + S * 0.025 + r() * (right - left - S * 0.045), y = rumpTop + S * 0.025 + r() * (bodyBottom - rumpTop - S * 0.045);
      c.beginPath(); c.ellipse(x, y, S * (0.006 + r() * 0.005), S * (0.0045 + r() * 0.004), r() * 0.8 - 0.4, 0, TAU); c.fill();
    }
    c.restore();
    c.save(); c.clip(tail); c.strokeStyle = 'rgba(40,36,34,0.92)'; c.lineWidth = S * 0.022;
    for (let i = 0; i < 8; i++) { const x = tipX + S * (0.037 + i * 0.026); c.beginPath(); c.moveTo(x, tipY - S * 0.060); c.lineTo(x + S * 0.010, tipY + S * 0.080); c.stroke(); }
    c.restore();
    c.save(); c.clip(head); c.fillStyle = 'rgba(34,31,29,0.94)';
    c.beginPath(); c.ellipse(hx + headRx * 0.12, hy - headRy * 0.10, headRx * 0.86, headRy * 0.34, -0.07, 0, TAU); c.fill(); c.restore();
    const muzzlePatch = new Path2D(); muzzlePatch.moveTo(hx + headRx * 0.10, hy);
    muzzlePatch.quadraticCurveTo(hx + muzzleLen * 0.60, hy - headRy * 0.02,
      hx + muzzleLen * 0.89, hy + headRy * 0.06);
    muzzlePatch.quadraticCurveTo(hx + muzzleLen * 0.69, hy + headRy * 0.26,
      hx + headRx * 0.22, hy + headRy * 0.31);
    muzzlePatch.quadraticCurveTo(hx + headRx * 0.08, hy + headRy * 0.24,
      hx + headRx * 0.10, hy); muzzlePatch.closePath();
    c.fillStyle = '#e9dfc8'; c.fill(muzzlePatch);
  }
  for (const ear of ears) mammalDInnerEar(c, ear);
  mammalCProfileEye(c, hx + headRx * 0.30, hy - headRy * 0.17, S * 0.0085, civet ? '#c79a4a' : '#8d6434');
  mammalCNose(c, hx + muzzleLen, hy + headRy * 0.05, S * 0.0125, S * 0.009);
  mammalDWhiskers(c, hx + muzzleLen * 0.78, hy + headRy * 0.24, S * 0.075, S * 0.065, 4);
}

type MammalDOtter = Extract<MammalDPlan, 'Otter' | 'River Otter' | 'Giant Otter'>;

function faunaResetOtterD(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: MammalDOtter): void {
  const p = pal(p0, spec), river = plan === 'River Otter', giant = plan === 'Giant Otter';
  const r = mulberry32((((g.seed as number) ^ 0x0D72 ^ nameSeedQ(plan)) >>> 0));
  const groundY = S * 0.795, left = S * (giant ? 0.285 : 0.315), right = S * (giant ? 0.665 : river ? 0.655 : 0.640);
  const top = S * (giant ? 0.410 : 0.455), bottom = S * (giant ? 0.665 : 0.675);
  const hx = S * 0.755, hy = S * (giant ? 0.485 : 0.520), headRx = S * (giant ? 0.078 : 0.068), headRy = S * (giant ? 0.060 : 0.054);
  mammalBGround(c, S * 0.47, groundY + S * 0.014, S * 0.32);
  const total = new Path2D();
  const tail = new Path2D();
  const baseY = top + (bottom - top) * 0.55, tipX = S * 0.045, tipY = groundY - S * 0.080;
  tail.moveTo(left + S * 0.015, baseY - S * (giant ? 0.048 : 0.036));
  if (giant) {
    tail.bezierCurveTo(left - S * 0.065, baseY - S * 0.065, tipX + S * 0.080, tipY - S * 0.060, tipX, tipY);
    tail.quadraticCurveTo(tipX - S * 0.012, tipY + S * 0.035, tipX + S * 0.055, tipY + S * 0.070);
    tail.bezierCurveTo(tipX + S * 0.135, tipY + S * 0.075, left - S * 0.030, baseY + S * 0.060, left + S * 0.020, baseY + S * 0.038);
  } else {
    tail.bezierCurveTo(left - S * 0.080, baseY - S * 0.040, tipX + S * 0.075, tipY - S * 0.018, tipX, tipY);
    tail.quadraticCurveTo(tipX - S * 0.010, tipY + S * 0.014, tipX + S * 0.035, tipY + S * 0.025);
    tail.bezierCurveTo(tipX + S * 0.105, tipY + S * 0.035, left - S * 0.028, baseY + S * 0.047, left + S * 0.020, baseY + S * 0.030);
  }
  tail.closePath(); total.addPath(tail);
  const body = new Path2D(); body.moveTo(left, bottom - S * 0.035);
  body.bezierCurveTo(left - S * 0.020, top + S * 0.055, left + S * 0.045, top, left + S * 0.110, top);
  body.bezierCurveTo(left + S * 0.200, top - S * 0.012, right - S * 0.080, top - S * 0.005, right, top + S * 0.030);
  body.bezierCurveTo(right + S * 0.025, top + S * 0.105, right + S * 0.010, bottom - S * 0.010, right - S * 0.040, bottom + S * 0.012);
  body.bezierCurveTo(right - S * 0.150, bottom + S * 0.025, left + S * 0.080, bottom + S * 0.022, left, bottom - S * 0.035); body.closePath(); total.addPath(body);
  const paw = (x: number, far: boolean): Path2D => { const q = new Path2D(), w = S * (giant ? 0.026 : 0.023) * (far ? 0.82 : 1), y0 = bottom - S * 0.035;
    q.moveTo(x - w, y0); q.bezierCurveTo(x - w, y0 + S * 0.040, x - w * 0.4, groundY - S * 0.055, x, groundY - S * 0.030);
    q.quadraticCurveTo(x + S * (river ? 0.038 : 0.030), groundY, x + S * (river ? 0.070 : 0.052), groundY - S * 0.012);
    q.quadraticCurveTo(x + S * (river ? 0.070 : 0.053), groundY - S * 0.035, x + w * 0.55, groundY - S * 0.052);
    q.bezierCurveTo(x + w * 0.72, groundY - S * 0.088, x + w, y0 + S * 0.025, x + w, y0); q.closePath(); return q; };
  const pawX = [left + S * 0.080, left + S * 0.135, right - S * 0.100, right - S * 0.045];
  const paws = pawX.map((x, i) => paw(x, i === 0 || i === 2)); for (const q of paws) total.addPath(q);
  const neck = new Path2D(); neck.moveTo(right - S * 0.075, top + S * 0.010);
  neck.bezierCurveTo(right + S * 0.015, top, hx - headRx * 0.85, hy - headRy * 0.75, hx - headRx * 0.42, hy - headRy * 0.48);
  neck.lineTo(hx - headRx * 0.35, hy + headRy * 0.78); neck.bezierCurveTo(right + S * 0.005, bottom - S * 0.020, right - S * 0.040, bottom, right - S * 0.075, top + S * 0.010); neck.closePath(); total.addPath(neck);
  const head = new Path2D(); head.ellipse(hx, hy, headRx, headRy, -0.03, 0, TAU); total.addPath(head);
  const muzzle = new Path2D(); muzzle.moveTo(hx + headRx * 0.10, hy - headRy * 0.12);
  muzzle.quadraticCurveTo(hx + headRx * 0.65, hy - headRy * 0.18, hx + headRx * 1.05, hy + headRy * 0.02);
  muzzle.quadraticCurveTo(hx + headRx * 1.16, hy + headRy * 0.32, hx + headRx * 0.42, hy + headRy * 0.50);
  muzzle.quadraticCurveTo(hx + headRx * 0.08, hy + headRy * 0.46, hx, hy + headRy * 0.14); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) { const ear = new Path2D(); ear.ellipse(hx - headRx * 0.48 + side * headRx * 0.28, hy - headRy * 0.69, headRx * 0.15, headRy * 0.18, side * 0.15, 0, TAU); ears.push(ear); total.addPath(ear); }
  mammalBFill(c, [tail, paws[0]!, paws[2]!, body, paws[1]!, paws[3]!, neck, head, muzzle, ...ears], p, tipX, top, hx + headRx * 1.15, bottom);
  mammalCFurGrain(c, total, r, tipX, top, hx + headRx * 1.15, bottom, giant ? 80 : 58, 'rgba(238,224,198,0.20)', 'rgba(35,30,27,0.18)');
  if (giant) {
    c.strokeStyle = 'rgba(35,29,25,0.40)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(tipX + S * 0.030, tipY + S * 0.020); c.quadraticCurveTo(left - S * 0.090, baseY + S * 0.010, left + S * 0.005, baseY); c.stroke();
    const bib = new Path2D(); bib.moveTo(hx - headRx * 0.62, hy + headRy * 0.18);
    bib.bezierCurveTo(right + S * 0.020, hy + S * 0.030, right - S * 0.005, bottom - S * 0.020, right - S * 0.070, bottom - S * 0.012);
    bib.quadraticCurveTo(right - S * 0.090, hy + S * 0.018, hx - headRx * 0.42, hy + headRy * 0.02); bib.closePath(); c.fillStyle = '#e6d8b8'; c.fill(bib);
  }
  c.fillStyle = giant ? '#d9caa9' : '#d8c6a8';
  c.beginPath(); c.ellipse(hx + headRx * 0.45, hy + headRy * 0.20, headRx * 0.48, headRy * 0.29, 0, 0, TAU); c.fill();
  for (const ear of ears) mammalDInnerEar(c, ear);
  mammalCProfileEye(c, hx + headRx * 0.24, hy - headRy * 0.18, S * 0.0085, '#76532d');
  mammalCNose(c, hx + headRx * 1.05, hy + headRy * 0.04, S * 0.014, S * 0.010);
  mammalDWhiskers(c, hx + headRx * 0.72, hy + headRy * 0.25, S * 0.090, S * 0.078, 5);
  if (river) {
    c.strokeStyle = 'rgba(31,28,27,0.66)'; c.lineWidth = 1.6; c.lineCap = 'round';
    for (const x of [pawX[1]!, pawX[3]!]) for (let i = 0; i < 4; i++) {
      c.beginPath(); c.moveTo(x + S * (0.012 + i * 0.010), groundY - S * 0.037);
      c.lineTo(x + S * (0.018 + i * 0.014), groundY - S * 0.010); c.stroke();
    }
  }
}

function faunaResetSeaOtterD(c: Ctx, g: G, p0: Pal, spec: QuadSpec): void {
  const p = pal(p0, spec);
  const r = mulberry32((((g.seed as number) ^ 0x5EA0 ^ nameSeedQ('Sea Otter')) >>> 0));
  /* A sea otter's entire read is its supine water posture. Keep the water
     horizontal so the diagonal belly, raised hind flippers and chest rock
     cannot be mistaken for another short-legged side-view mustelid. */
  c.strokeStyle = 'rgba(111,190,207,0.30)'; c.lineWidth = 3; c.lineCap = 'round';
  for (const [x0, y, x1] of [[S * 0.10, S * 0.795, S * 0.54], [S * 0.47, S * 0.740, S * 0.90], [S * 0.08, S * 0.690, S * 0.30]] as const) {
    c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) * 0.5, y - S * 0.012, x1, y); c.stroke();
  }
  const total = new Path2D();
  const tail = new Path2D(); tail.moveTo(S * 0.225, S * 0.675);
  tail.bezierCurveTo(S * 0.160, S * 0.710, S * 0.105, S * 0.790, S * 0.080, S * 0.825);
  tail.quadraticCurveTo(S * 0.095, S * 0.850, S * 0.145, S * 0.815);
  tail.bezierCurveTo(S * 0.205, S * 0.780, S * 0.260, S * 0.735, S * 0.265, S * 0.700); tail.closePath(); total.addPath(tail);
  const hindFlippers: Path2D[] = [];
  const flipper1 = new Path2D(); flipper1.moveTo(S * 0.230, S * 0.675);
  flipper1.bezierCurveTo(S * 0.160, S * 0.690, S * 0.095, S * 0.720, S * 0.075, S * 0.755);
  flipper1.quadraticCurveTo(S * 0.130, S * 0.790, S * 0.225, S * 0.742);
  flipper1.quadraticCurveTo(S * 0.270, S * 0.710, S * 0.230, S * 0.675); flipper1.closePath(); hindFlippers.push(flipper1); total.addPath(flipper1);
  const flipper2 = new Path2D(); flipper2.moveTo(S * 0.275, S * 0.690);
  flipper2.bezierCurveTo(S * 0.225, S * 0.735, S * 0.190, S * 0.820, S * 0.215, S * 0.850);
  flipper2.quadraticCurveTo(S * 0.285, S * 0.842, S * 0.335, S * 0.742);
  flipper2.quadraticCurveTo(S * 0.345, S * 0.704, S * 0.275, S * 0.690); flipper2.closePath(); hindFlippers.push(flipper2); total.addPath(flipper2);
  const body = new Path2D(); body.ellipse(S * 0.475, S * 0.515, S * 0.145, S * 0.265, 0.58, 0, TAU); total.addPath(body);
  const neck = new Path2D(); neck.moveTo(S * 0.590, S * 0.350);
  neck.bezierCurveTo(S * 0.625, S * 0.280, S * 0.685, S * 0.245, S * 0.725, S * 0.255);
  neck.lineTo(S * 0.765, S * 0.355); neck.bezierCurveTo(S * 0.705, S * 0.405, S * 0.650, S * 0.435, S * 0.600, S * 0.430); neck.closePath(); total.addPath(neck);
  const head = new Path2D(); head.ellipse(S * 0.730, S * 0.280, S * 0.102, S * 0.087, -0.18, 0, TAU); total.addPath(head);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) { const ear = new Path2D(); ear.ellipse(S * (0.685 + side * 0.052), S * 0.220, S * 0.018, S * 0.020, side * 0.15, 0, TAU); ears.push(ear); total.addPath(ear); }
  mammalBFill(c, [tail, flipper1, flipper2, body, neck, head, ...ears], p, S * 0.07, S * 0.18, S * 0.84, S * 0.85);
  mammalCFurGrain(c, total, r, S * 0.10, S * 0.20, S * 0.82, S * 0.82, 104,
    'rgba(239,224,196,0.25)', 'rgba(42,31,27,0.20)');

  c.save(); c.clip(body); const belly = c.createRadialGradient(S * 0.510, S * 0.455, S * 0.010, S * 0.470, S * 0.520, S * 0.170);
  belly.addColorStop(0, '#d8c6a7'); belly.addColorStop(0.70, '#aa8d69'); belly.addColorStop(1, 'rgba(92,68,50,0.20)'); c.fillStyle = belly;
  c.beginPath(); c.ellipse(S * 0.500, S * 0.500, S * 0.103, S * 0.218, 0.58, 0, TAU); c.fill(); c.restore();

  /* Both forepaws meet around a rock on the chest; the object is intentionally
     stone-grey and occluded by digits so it reads as carried, not a coat spot. */
  const arms: Path2D[] = [];
  for (const side of [-1, 1]) {
    const arm = new Path2D(); arm.moveTo(S * (0.535 + side * 0.015), S * 0.405);
    arm.bezierCurveTo(S * (0.550 + side * 0.060), S * 0.450, S * (0.555 + side * 0.045), S * 0.530, S * (0.535 + side * 0.018), S * 0.550);
    arm.quadraticCurveTo(S * (0.495 + side * 0.020), S * 0.545, S * (0.485 + side * 0.010), S * 0.500);
    arm.bezierCurveTo(S * (0.485 + side * 0.005), S * 0.455, S * (0.500 + side * 0.005), S * 0.420, S * (0.535 + side * 0.015), S * 0.405); arm.closePath(); arms.push(arm);
  }
  mammalBFill(c, arms, p, S * 0.45, S * 0.39, S * 0.61, S * 0.56);
  c.fillStyle = '#777b80'; c.beginPath(); c.ellipse(S * 0.535, S * 0.495, S * 0.055, S * 0.046, -0.22, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(44,46,49,0.66)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(S * 0.505, S * 0.480); c.quadraticCurveTo(S * 0.530, S * 0.462, S * 0.560, S * 0.482); c.stroke();
  c.fillStyle = mammalBTone(p, 1.18); for (const arm of arms) { c.save(); c.clip(arm); c.fillRect(S * 0.47, S * 0.50, S * 0.15, S * 0.08); c.restore(); }
  c.strokeStyle = 'rgba(37,31,28,0.64)'; c.lineWidth = 1.5;
  for (const x of [S * 0.510, S * 0.555]) for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + i * S * 0.007, S * 0.515); c.lineTo(x + i * S * 0.008, S * 0.540); c.stroke(); }

  c.fillStyle = '#d9c6a7'; c.beginPath(); c.ellipse(S * 0.770, S * 0.300, S * 0.050, S * 0.034, -0.10, 0, TAU); c.fill();
  for (const ear of ears) mammalDInnerEar(c, ear);
  mammalCEye(c, S * 0.745, S * 0.258, S * 0.011, '#76512b');
  mammalCNose(c, S * 0.818, S * 0.292, S * 0.015, S * 0.011);
  mammalDWhiskers(c, S * 0.786, S * 0.316, S * 0.095, S * 0.090, 6);
  c.strokeStyle = 'rgba(43,37,34,0.58)'; c.lineWidth = 1.5;
  for (const flipper of hindFlippers) { c.save(); c.clip(flipper); for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(S * (0.075 + i * 0.025), S * 0.725); c.lineTo(S * (0.120 + i * 0.028), S * 0.810); c.stroke(); } c.restore(); }
}

function faunaResetCapybaraD(c: Ctx, g: G, p0: Pal, spec: QuadSpec): void {
  const p = pal(p0, spec), r = mulberry32((((g.seed as number) ^ 0xCA9B ^ nameSeedQ('Capybara')) >>> 0));
  const groundY = S * 0.800, left = S * 0.205, right = S * 0.625, top = S * 0.350, bottom = S * 0.690;
  mammalBGround(c, S * 0.49, groundY + S * 0.016, S * 0.31);
  const total = new Path2D();
  const body = new Path2D(); body.moveTo(left, bottom - S * 0.050);
  body.bezierCurveTo(left - S * 0.018, top + S * 0.095, left + S * 0.060, top, left + S * 0.145, top);
  body.bezierCurveTo(left + S * 0.270, top - S * 0.005, right - S * 0.030, top + S * 0.010, right + S * 0.015, top + S * 0.085);
  body.lineTo(right + S * 0.010, bottom - S * 0.020);
  body.bezierCurveTo(right - S * 0.100, bottom + S * 0.040, left + S * 0.075, bottom + S * 0.040, left, bottom - S * 0.050); body.closePath(); total.addPath(body);
  const leg = (x: number, far: boolean): Path2D => { const q = new Path2D(), w = S * 0.033 * (far ? 0.82 : 1), y0 = bottom - S * 0.040;
    q.moveTo(x - w, y0); q.bezierCurveTo(x - w * 1.10, y0 + S * 0.035, x - w * 0.70, groundY - S * 0.055, x - w * 0.30, groundY - S * 0.030);
    q.quadraticCurveTo(x + S * 0.030, groundY + S * 0.004, x + S * 0.068, groundY - S * 0.012);
    q.quadraticCurveTo(x + S * 0.070, groundY - S * 0.035, x + w * 0.60, groundY - S * 0.053);
    q.bezierCurveTo(x + w * 0.78, groundY - S * 0.085, x + w * 1.14, y0 + S * 0.020, x + w, y0); q.closePath(); return q; };
  const legX = [left + S * 0.080, left + S * 0.145, right - S * 0.105, right - S * 0.040];
  const legs = legX.map((x, i) => leg(x, i === 0 || i === 2)); for (const q of legs) total.addPath(q);
  /* Rectangular skull, with its sensory points all on the roof. */
  const head = new Path2D(); head.moveTo(S * 0.600, S * 0.385); head.lineTo(S * 0.785, S * 0.390);
  head.quadraticCurveTo(S * 0.835, S * 0.405, S * 0.840, S * 0.470); head.lineTo(S * 0.825, S * 0.620);
  head.quadraticCurveTo(S * 0.790, S * 0.675, S * 0.675, S * 0.650); head.lineTo(S * 0.610, S * 0.580);
  head.quadraticCurveTo(S * 0.585, S * 0.480, S * 0.600, S * 0.385); head.closePath(); total.addPath(head);
  const ears: Path2D[] = [];
  for (const x of [S * 0.650, S * 0.735]) { const ear = new Path2D(); ear.ellipse(x, S * 0.373, S * 0.023, S * 0.030, 0, 0, TAU); ears.push(ear); total.addPath(ear); }
  mammalBFill(c, [legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, head, ...ears], p, left, top, S * 0.84, bottom);
  mammalCFurGrain(c, total, r, left, top, S * 0.84, bottom, 82, 'rgba(247,220,180,0.20)', 'rgba(64,42,29,0.20)');
  c.fillStyle = mammalBTone(p, 0.72); c.beginPath(); c.ellipse(S * 0.802, S * 0.540, S * 0.052, S * 0.060, 0.05, 0, TAU); c.fill();
  for (const ear of ears) mammalDInnerEar(c, ear);
  mammalCProfileEye(c, S * 0.753, S * 0.420, S * 0.0105, '#8a5b2d');
  mammalCNose(c, S * 0.824, S * 0.445, S * 0.010, S * 0.007, '#2b2928');
  c.fillStyle = '#dd7b2e'; c.beginPath(); c.roundRect(S * 0.818, S * 0.560, S * 0.020, S * 0.036, S * 0.005); c.fill();
  c.strokeStyle = 'rgba(45,34,29,0.70)'; c.lineWidth = 1.6; c.lineCap = 'round';
  for (const x of [legX[1]!, legX[3]!]) for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + S * (0.014 + i * 0.010), groundY - S * 0.038); c.lineTo(x + S * (0.018 + i * 0.014), groundY - S * 0.010); c.stroke(); }
}

function faunaResetHyraxD(c: Ctx, g: G, p0: Pal, spec: QuadSpec): void {
  const p = pal(p0, spec), r = mulberry32((((g.seed as number) ^ 0x48A9 ^ nameSeedQ('Hyrax')) >>> 0));
  const groundY = S * 0.800, left = S * 0.275, right = S * 0.655, top = S * 0.390, bottom = S * 0.690;
  mammalBGround(c, S * 0.50, groundY + S * 0.015, S * 0.25);
  const total = new Path2D();
  const body = new Path2D(); body.moveTo(left, bottom - S * 0.030);
  body.bezierCurveTo(left - S * 0.040, top + S * 0.080, left + S * 0.065, top - S * 0.010, left + S * 0.180, top);
  body.bezierCurveTo(left + S * 0.290, top - S * 0.002, right + S * 0.020, top + S * 0.070, right + S * 0.010, bottom - S * 0.015);
  body.bezierCurveTo(right - S * 0.100, bottom + S * 0.035, left + S * 0.075, bottom + S * 0.035, left, bottom - S * 0.030); body.closePath(); total.addPath(body);
  const leg = (x: number, far: boolean): Path2D => { const q = new Path2D(), w = S * 0.026 * (far ? 0.82 : 1), y0 = bottom - S * 0.035;
    q.moveTo(x - w, y0); q.lineTo(x - w * 0.55, groundY - S * 0.035); q.quadraticCurveTo(x + S * 0.025, groundY + S * 0.002, x + S * 0.055, groundY - S * 0.014);
    q.lineTo(x + w * 0.65, groundY - S * 0.050); q.lineTo(x + w, y0); q.closePath(); return q; };
  const legX = [left + S * 0.080, left + S * 0.125, right - S * 0.090, right - S * 0.040];
  const legs = legX.map((x, i) => leg(x, i === 0 || i === 2)); for (const q of legs) total.addPath(q);
  const head = new Path2D(); head.ellipse(S * 0.700, S * 0.505, S * 0.105, S * 0.100, -0.02, 0, TAU); total.addPath(head);
  const muzzle = new Path2D(); muzzle.moveTo(S * 0.730, S * 0.480); muzzle.quadraticCurveTo(S * 0.790, S * 0.475, S * 0.825, S * 0.510);
  muzzle.quadraticCurveTo(S * 0.822, S * 0.555, S * 0.750, S * 0.565); muzzle.quadraticCurveTo(S * 0.718, S * 0.545, S * 0.730, S * 0.480); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) { const ear = new Path2D(); ear.ellipse(S * (0.660 + side * 0.040), S * 0.428, S * 0.016, S * 0.020, side * 0.15, 0, TAU); ears.push(ear); total.addPath(ear); }
  mammalBFill(c, [legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, head, muzzle, ...ears], p, left, top, S * 0.83, bottom);
  mammalCFurGrain(c, total, r, left, top, S * 0.82, bottom, 74, 'rgba(247,228,196,0.22)', 'rgba(52,40,34,0.20)');
  c.fillStyle = mammalBTone(p, 1.16); c.fill(muzzle); for (const ear of ears) mammalDInnerEar(c, ear);
  mammalCProfileEye(c, S * 0.735, S * 0.475, S * 0.010, '#80552b'); mammalCNose(c, S * 0.823, S * 0.514, S * 0.012, S * 0.009);
  mammalDWhiskers(c, S * 0.795, S * 0.540, S * 0.082, S * 0.075, 5);
}

function faunaResetMaraD(c: Ctx, g: G, p0: Pal, spec: QuadSpec): void {
  const p = pal(p0, spec), r = mulberry32((((g.seed as number) ^ 0x6A2A ^ nameSeedQ('Mara')) >>> 0));
  const groundY = S * 0.820, left = S * 0.285, right = S * 0.625, top = S * 0.405, bottom = S * 0.590;
  mammalBGround(c, S * 0.50, groundY + S * 0.014, S * 0.27);
  const total = new Path2D();
  const nub = new Path2D(); nub.ellipse(left - S * 0.008, top + S * 0.095, S * 0.016, S * 0.013, 0, 0, TAU); total.addPath(nub);
  const body = new Path2D(); body.moveTo(left, bottom - S * 0.025); body.bezierCurveTo(left - S * 0.020, top + S * 0.055, left + S * 0.050, top, left + S * 0.105, top);
  body.bezierCurveTo(left + S * 0.190, top - S * 0.012, right - S * 0.055, top + S * 0.005, right, top + S * 0.035);
  body.bezierCurveTo(right + S * 0.020, top + S * 0.090, right, bottom - S * 0.005, right - S * 0.035, bottom + S * 0.010);
  body.bezierCurveTo(right - S * 0.120, bottom + S * 0.020, left + S * 0.070, bottom + S * 0.022, left, bottom - S * 0.025); body.closePath(); total.addPath(body);
  const leg = (x: number, hind: boolean, far: boolean): Path2D => { const q = new Path2D(), w = S * 0.018 * (far ? 0.82 : 1), y0 = bottom - S * 0.025;
    const kneeX = x + S * (hind ? 0.032 : -0.012), kneeY = S * (hind ? 0.665 : 0.690), ankleX = x + S * (hind ? 0.010 : 0.018);
    q.moveTo(x - w, y0); q.bezierCurveTo(x - w, S * 0.625, kneeX - w, kneeY, ankleX - w * 0.45, groundY - S * 0.040);
    q.quadraticCurveTo(ankleX + S * 0.020, groundY, ankleX + S * 0.055, groundY - S * 0.010);
    q.quadraticCurveTo(ankleX + S * 0.057, groundY - S * 0.030, ankleX + w * 0.50, groundY - S * 0.046);
    q.bezierCurveTo(kneeX + w * 0.55, kneeY, x + w, S * 0.625, x + w, y0); q.closePath(); return q; };
  const legs = [leg(left + S * 0.070, true, true), leg(left + S * 0.125, true, false), leg(right - S * 0.090, false, true), leg(right - S * 0.040, false, false)]; for (const q of legs) total.addPath(q);
  const neck = new Path2D(); neck.moveTo(right - S * 0.065, top + S * 0.020); neck.bezierCurveTo(S * 0.670, S * 0.350, S * 0.700, S * 0.305, S * 0.720, S * 0.300);
  neck.lineTo(S * 0.765, S * 0.410); neck.bezierCurveTo(S * 0.715, S * 0.475, S * 0.665, S * 0.520, right - S * 0.025, bottom); neck.closePath(); total.addPath(neck);
  const head = new Path2D(); head.ellipse(S * 0.735, S * 0.315, S * 0.067, S * 0.060, -0.04, 0, TAU); total.addPath(head);
  const muzzle = new Path2D(); muzzle.moveTo(S * 0.752, S * 0.300); muzzle.quadraticCurveTo(S * 0.805, S * 0.295, S * 0.840, S * 0.320);
  muzzle.quadraticCurveTo(S * 0.842, S * 0.350, S * 0.770, S * 0.357); muzzle.quadraticCurveTo(S * 0.745, S * 0.340, S * 0.752, S * 0.300); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) { const ear = new Path2D(), ex = S * (0.700 + side * 0.045), by = S * 0.275;
    ear.moveTo(ex - S * 0.022, by); ear.quadraticCurveTo(ex - S * 0.018, S * (side < 0 ? 0.105 : 0.125), ex + S * 0.005, S * (side < 0 ? 0.085 : 0.105));
    ear.quadraticCurveTo(ex + S * 0.035, S * (side < 0 ? 0.150 : 0.165), ex + S * 0.026, by + S * 0.012); ear.closePath(); ears.push(ear); total.addPath(ear); }
  mammalBFill(c, [nub, legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, neck, head, muzzle, ...ears], p, left, S * 0.08, S * 0.85, groundY);
  mammalCFurGrain(c, total, r, left, S * 0.10, S * 0.84, bottom, 62, 'rgba(245,235,215,0.22)', 'rgba(48,43,39,0.18)');
  c.fillStyle = '#ded6c7'; c.beginPath(); c.ellipse(S * 0.770, S * 0.340, S * 0.040, S * 0.023, 0, 0, TAU); c.fill(); for (const ear of ears) mammalDInnerEar(c, ear, 'rgba(117,74,73,0.58)');
  mammalCProfileEye(c, S * 0.756, S * 0.296, S * 0.0095, '#81582d'); mammalCNose(c, S * 0.840, S * 0.321, S * 0.010, S * 0.007);
}

function faunaResetMarshRodentD(c: Ctx, g: G, p0: Pal, spec: QuadSpec): void {
  const p = pal(p0, spec), r = mulberry32((((g.seed as number) ^ 0xAA51 ^ nameSeedQ('Marsh Rodent')) >>> 0));
  const groundY = S * 0.800, left = S * 0.290, right = S * 0.635, top = S * 0.430, bottom = S * 0.685;
  mammalBGround(c, S * 0.46, groundY + S * 0.014, S * 0.30);
  const total = new Path2D();
  const tail = new Path2D(); tail.moveTo(left + S * 0.005, top + S * 0.125); tail.bezierCurveTo(S * 0.190, S * 0.565, S * 0.115, S * 0.675, S * 0.050, S * 0.745);
  tail.quadraticCurveTo(S * 0.045, S * 0.760, S * 0.060, S * 0.764); tail.bezierCurveTo(S * 0.145, S * 0.700, S * 0.230, S * 0.605, left + S * 0.012, top + S * 0.145); tail.closePath(); total.addPath(tail);
  const body = new Path2D(); body.moveTo(left, bottom - S * 0.035); body.bezierCurveTo(left - S * 0.030, top + S * 0.070, left + S * 0.055, top, left + S * 0.130, top);
  body.bezierCurveTo(left + S * 0.230, top - S * 0.005, right - S * 0.040, top + S * 0.015, right + S * 0.010, top + S * 0.075);
  body.lineTo(right, bottom - S * 0.010); body.bezierCurveTo(right - S * 0.100, bottom + S * 0.030, left + S * 0.070, bottom + S * 0.032, left, bottom - S * 0.035); body.closePath(); total.addPath(body);
  const leg = (x: number, hind: boolean, far: boolean): Path2D => { const q = new Path2D(), w = S * 0.025 * (far ? 0.82 : 1), y0 = bottom - S * 0.035;
    q.moveTo(x - w, y0); q.bezierCurveTo(x - w, y0 + S * 0.045, x - w * 0.45, groundY - S * 0.052, x, groundY - S * 0.028);
    q.quadraticCurveTo(x + S * (hind ? 0.045 : 0.028), groundY + S * 0.002, x + S * (hind ? 0.090 : 0.055), groundY - S * 0.012);
    q.quadraticCurveTo(x + S * (hind ? 0.092 : 0.056), groundY - S * 0.035, x + w * 0.55, groundY - S * 0.050);
    q.bezierCurveTo(x + w * 0.72, groundY - S * 0.086, x + w, y0 + S * 0.025, x + w, y0); q.closePath(); return q; };
  const legX = [left + S * 0.075, left + S * 0.130, right - S * 0.090, right - S * 0.035];
  const legs = legX.map((x, i) => leg(x, i < 2, i === 0 || i === 2)); for (const q of legs) total.addPath(q);
  const head = new Path2D(); head.ellipse(S * 0.705, S * 0.520, S * 0.100, S * 0.090, 0, 0, TAU); total.addPath(head);
  const muzzle = new Path2D(); muzzle.moveTo(S * 0.740, S * 0.490); muzzle.lineTo(S * 0.830, S * 0.495); muzzle.quadraticCurveTo(S * 0.855, S * 0.530, S * 0.825, S * 0.575);
  muzzle.lineTo(S * 0.750, S * 0.580); muzzle.quadraticCurveTo(S * 0.720, S * 0.545, S * 0.740, S * 0.490); muzzle.closePath(); total.addPath(muzzle);
  const ears: Path2D[] = [];
  for (const side of [-1, 1]) { const ear = new Path2D(); ear.ellipse(S * (0.665 + side * 0.050), S * 0.438, S * 0.028, S * 0.035, side * 0.15, 0, TAU); ears.push(ear); total.addPath(ear); }
  mammalBFill(c, [tail, legs[0]!, legs[2]!, body, legs[1]!, legs[3]!, head, muzzle, ...ears], p, S * 0.04, top, S * 0.86, bottom);
  mammalCFurGrain(c, total, r, left, top, S * 0.84, bottom, 72, 'rgba(241,219,183,0.20)', 'rgba(55,41,31,0.20)');
  c.save(); c.clip(tail); c.strokeStyle = 'rgba(64,48,42,0.56)'; c.lineWidth = 1.4;
  for (let i = 1; i < 12; i++) { const t = i / 12, x = left * (1 - t) + S * 0.050 * t, y = (top + S * 0.135) * (1 - t) + S * 0.745 * t; c.beginPath(); c.moveTo(x - S * 0.010, y - S * 0.009); c.lineTo(x + S * 0.010, y + S * 0.009); c.stroke(); } c.restore();
  c.fillStyle = '#e1812f'; c.beginPath(); c.roundRect(S * 0.818, S * 0.535, S * 0.026, S * 0.044, S * 0.004); c.fill(); for (const ear of ears) mammalDInnerEar(c, ear);
  mammalCProfileEye(c, S * 0.745, S * 0.495, S * 0.010, '#85592e'); mammalCNose(c, S * 0.835, S * 0.510, S * 0.010, S * 0.007);
  c.strokeStyle = 'rgba(47,38,33,0.68)'; c.lineWidth = 1.5;
  for (const x of [legX[1]!, legX[0]!]) for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + S * (0.018 + i * 0.013), groundY - S * 0.040); c.lineTo(x + S * (0.025 + i * 0.018), groundY - S * 0.010); c.stroke(); }
  mammalDWhiskers(c, S * 0.805, S * 0.560, S * 0.075, S * 0.070, 4);
}

function faunaResetMoleD(c: Ctx, g: G, p0: Pal, spec: QuadSpec): void {
  const p = pal(p0, spec), r = mulberry32((((g.seed as number) ^ 0x601E ^ nameSeedQ('Mole')) >>> 0));
  const groundY = S * 0.790;
  const soil = c.createRadialGradient(S * 0.47, groundY, 2, S * 0.47, groundY, S * 0.33);
  soil.addColorStop(0, 'rgba(67,45,31,0.48)'); soil.addColorStop(0.65, 'rgba(58,39,28,0.22)'); soil.addColorStop(1, 'rgba(40,27,21,0)');
  c.fillStyle = soil; c.beginPath(); c.ellipse(S * 0.47, groundY, S * 0.33, S * 0.055, 0, 0, TAU); c.fill();

  const total = new Path2D();
  const tail = new Path2D(); tail.moveTo(S * 0.280, S * 0.585); tail.bezierCurveTo(S * 0.215, S * 0.570, S * 0.155, S * 0.610, S * 0.125, S * 0.655);
  tail.quadraticCurveTo(S * 0.122, S * 0.670, S * 0.140, S * 0.669); tail.bezierCurveTo(S * 0.190, S * 0.635, S * 0.245, S * 0.625, S * 0.292, S * 0.615); tail.closePath(); total.addPath(tail);
  /* One neckless velvet cylinder: the head is the narrowing front of the body,
     not a separate generic mammal skull. */
  const body = new Path2D(); body.moveTo(S * 0.250, S * 0.610);
  body.bezierCurveTo(S * 0.230, S * 0.475, S * 0.335, S * 0.385, S * 0.500, S * 0.390);
  body.bezierCurveTo(S * 0.650, S * 0.390, S * 0.740, S * 0.455, S * 0.755, S * 0.550);
  body.bezierCurveTo(S * 0.770, S * 0.660, S * 0.660, S * 0.720, S * 0.500, S * 0.715);
  body.bezierCurveTo(S * 0.340, S * 0.715, S * 0.260, S * 0.680, S * 0.250, S * 0.610); body.closePath(); total.addPath(body);
  const hindPaws: Path2D[] = [];
  for (const x of [S * 0.330, S * 0.430]) { const paw = new Path2D(); paw.ellipse(x, S * 0.705, S * 0.060, S * 0.032, -0.10, 0, TAU); hindPaws.push(paw); total.addPath(paw); }
  /* Forepaws sit beside the snout and point out of the silhouette. Their broad
     fans and long straight digits are the mole's diagnostic anatomy. */
  const forePaws: Path2D[] = [];
  const upper = new Path2D(); upper.moveTo(S * 0.665, S * 0.500); upper.bezierCurveTo(S * 0.720, S * 0.435, S * 0.820, S * 0.405, S * 0.880, S * 0.430);
  upper.lineTo(S * 0.845, S * 0.515); upper.quadraticCurveTo(S * 0.755, S * 0.545, S * 0.675, S * 0.555); upper.closePath(); forePaws.push(upper); total.addPath(upper);
  const lower = new Path2D(); lower.moveTo(S * 0.665, S * 0.605); lower.bezierCurveTo(S * 0.735, S * 0.620, S * 0.825, S * 0.670, S * 0.875, S * 0.735);
  lower.lineTo(S * 0.795, S * 0.760); lower.quadraticCurveTo(S * 0.720, S * 0.705, S * 0.650, S * 0.665); lower.closePath(); forePaws.push(lower); total.addPath(lower);
  const snout = new Path2D(); snout.moveTo(S * 0.705, S * 0.525); snout.quadraticCurveTo(S * 0.820, S * 0.515, S * 0.925, S * 0.555);
  snout.quadraticCurveTo(S * 0.835, S * 0.595, S * 0.705, S * 0.592); snout.quadraticCurveTo(S * 0.675, S * 0.558, S * 0.705, S * 0.525); snout.closePath(); total.addPath(snout);
  mammalBFill(c, [tail, hindPaws[0]!, body, hindPaws[1]!, upper, lower], p, S * 0.12, S * 0.38, S * 0.89, S * 0.76);
  mammalCFurGrain(c, total, r, S * 0.22, S * 0.39, S * 0.76, S * 0.72, 110,
    'rgba(214,203,194,0.16)', 'rgba(16,15,17,0.28)');
  const pawFill = c.createLinearGradient(S * 0.68, S * 0.48, S * 0.86, S * 0.70);
  pawFill.addColorStop(0, '#b98a86'); pawFill.addColorStop(0.55, '#9f6f70'); pawFill.addColorStop(1, '#6c4b52'); c.fillStyle = pawFill;
  for (const paw of forePaws) c.fill(paw);
  const snoutFill = c.createLinearGradient(S * 0.700, S * 0.520, S * 0.855, S * 0.565);
  snoutFill.addColorStop(0, '#b98482'); snoutFill.addColorStop(0.70, '#e4a6a0'); snoutFill.addColorStop(1, '#f0b4ad'); c.fillStyle = snoutFill; c.fill(snout);
  mammalCNose(c, S * 0.925, S * 0.557, S * 0.012, S * 0.009, '#7d4c54');
  c.strokeStyle = '#e4c8ad'; c.lineWidth = 2.2; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.moveTo(S * (0.800 + i * 0.012), S * (0.446 + i * 0.010)); c.lineTo(S * (0.905 + i * 0.010), S * (0.413 + i * 0.008)); c.stroke();
    c.beginPath(); c.moveTo(S * (0.790 + i * 0.012), S * (0.693 + i * 0.010)); c.lineTo(S * (0.892 + i * 0.010), S * (0.756 + i * 0.007)); c.stroke();
  }
  mammalDWhiskers(c, S * 0.855, S * 0.578, S * 0.070, S * 0.055, 4, 'rgba(225,209,194,0.58)');
}

function faunaMammalD(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: MammalDPlan): void {
  switch (plan) {
    case 'Badger': case 'Fisher': case 'Marten': case 'Mink': case 'Wolverine':
      faunaResetMustelidD(c, g, p0, spec, plan); return;
    case 'Civet': case 'Mongoose':
      faunaResetViverridD(c, g, p0, spec, plan); return;
    case 'Otter': case 'River Otter': case 'Giant Otter':
      faunaResetOtterD(c, g, p0, spec, plan); return;
    case 'Sea Otter': faunaResetSeaOtterD(c, g, p0, spec); return;
    case 'Capybara': faunaResetCapybaraD(c, g, p0, spec); return;
    case 'Hyrax': faunaResetHyraxD(c, g, p0, spec); return;
    case 'Mara': faunaResetMaraD(c, g, p0, spec); return;
    case 'Marsh Rodent': faunaResetMarshRodentD(c, g, p0, spec); return;
    case 'Mole': faunaResetMoleD(c, g, p0, spec); return;
    default: { const exhaustive: never = plan; return exhaustive; }
  }
}

function faunaMammalC(c: Ctx, g: G, p0: Pal, spec: QuadSpec, plan: NonNullable<QuadSpec['mammalCPlan']>, name: string): void {
  switch (plan) {
    case 'canid-c1': faunaResetCanidC(c, g, p0, spec, name); return;
    case 'procyonid-c1': faunaResetProcyonidC(c, g, p0, spec, name); return;
    case 'marsupial-c1': faunaResetMarsupialC(c, g, p0, spec, name); return;
    default: { const exhaustive: never = plan; return exhaustive; }
  }
}

export function faunaQuadruped(c: Ctx, g: G, p0: Pal, spec: QuadSpec, name = ''): void {
  if (spec.mammalDPlan) { faunaMammalD(c, g, p0, spec, spec.mammalDPlan); return; }
  if (spec.mammalCPlan) { faunaMammalC(c, g, p0, spec, spec.mammalCPlan, name); return; }
  if (spec.mammalBPlan) { faunaMammalB(c, g, p0, spec, spec.mammalBPlan, name); return; }
  if (spec.pinnipedPose) { faunaEaredPinniped(c, g, p0, spec, spec.pinnipedPose); return; }
  if (spec.gliderPlan) { faunaGlider(c, g, p0, spec, spec.gliderPlan); return; }
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
    const shoulder = bodyH * (spec.shoulderHump ?? 0) * Math.exp(-(((t - 0.84) / 0.135) ** 2));
    if (!spec.humps) return shoulder;
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
    lift += shoulder / (bodyH * (two ? 0.46 : 0.62));
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

  if (spec.tail === 'muscular') {
    /* Draw a muscular tail behind the animal so the rump's own surface covers
       the root. Drawing it with the other foreground tails left a visible cap
       over the flank even though both solids were individually correct. */
    const TS = spec.tailScale ?? 1;
    const musAnchor = AX(0.035);
    const musTx0 = musAnchor[0] - RAD(0.035) * 0.35 - bodyH * 0.40;
    const musTy0 = musAnchor[1] - RAD(0.035) * 0.30;
    const tailAt = (t: number): [number, number] => {
      const m = 1 - t;
      const p1x = musTx0 - bodyW * 0.40 * TS, p1y = musTy0 + bodyH * 0.10;
      const p2x = musTx0 - bodyW * 0.76 * TS, p2y = musTy0 + bodyH * 0.64 * TS;
      return [m * m * musTx0 + 2 * m * t * p1x + t * t * p2x,
        m * m * musTy0 + 2 * m * t * p1y + t * t * p2y];
    };
    const tailR = (t: number): number => bodyH * (0.34 * Math.pow(1 - t, 0.72) + 0.025);
    const tailT = new Tube({ P: tailAt, R: tailR });
    c.fillStyle = p.base; c.beginPath(); tailT.trace(c, 48); c.fill();
    c.save(); c.beginPath(); tailT.trace(c, 48); c.clip();
    countershade(c, tailT, p, 0.82);
    coatMaterial(c, tailT, r, p, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL * 0.44, len: 0.76 });
    c.restore();
    c.strokeStyle = 'rgba(236,242,252,0.24)'; c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const e = tailT.envelope(i / 24, 1);
      if (i === 0) c.moveTo(e[0], e[1]); else c.lineTo(e[0], e[1]);
    }
    c.stroke();
  } else if (spec.tail === 'thick') {
    /* Fishing Cat: a short, heavy tail is a silhouette cue, not the generic
       rump-cone used by every stub-tailed mammal. Paint it behind the torso so
       the root is anatomical, keep the end blunt, and carry the dark rings to
       the edge where they survive catalogue scale. This branch is opt-in. */
    const TS = spec.tailScale ?? 1;
    const thickAnchor = AX(0.035);
    const thickTx0 = thickAnchor[0] - RAD(0.035) * 0.18;
    const thickTy0 = thickAnchor[1] + bodyH * 0.02;
    const tailAt = (t: number): [number, number] => {
      const m = 1 - t;
      const p1x = thickTx0 - bodyW * 0.27 * TS, p1y = thickTy0 + bodyH * 0.04;
      const p2x = thickTx0 - bodyW * 0.48 * TS, p2y = thickTy0 + bodyH * 0.25;
      return [m * m * thickTx0 + 2 * m * t * p1x + t * t * p2x,
        m * m * thickTy0 + 2 * m * t * p1y + t * t * p2y];
    };
    const tailR = (t: number): number => bodyH * (0.22 - t * 0.075);
    const tailT = new Tube({ P: tailAt, R: tailR });
    c.fillStyle = p.base; c.beginPath(); tailT.trace(c, 40); c.fill();
    c.save(); c.beginPath(); tailT.trace(c, 40); c.clip();
    countershade(c, tailT, p, 0.82);
    coatMaterial(c, tailT, r, p, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL * 0.40, len: 0.72 });
    c.strokeStyle = 'rgba(25,20,17,0.72)'; c.lineCap = 'butt';
    for (const t0 of [0.46, 0.68]) {
      const a2 = tailAt(t0), b2 = tailAt(Math.min(1, t0 + 0.09));
      c.lineWidth = tailR(t0) * 2.15;
      c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke();
    }
    c.restore();
    const tip = tailAt(1);
    c.fillStyle = spec.tailTip ?? 'rgba(24,20,18,0.90)';
    c.beginPath(); c.ellipse(tip[0], tip[1], tailR(1) * 0.96, tailR(1) * 0.86, 0.18, 0, TAU); c.fill();
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
      /* round 3 — a high-crouch (felid) paw is proportionally BIGGER than a
         canid's against its slim ankle; the extra width is what finally
         separates "paw" from "hoof" on the small cats */
      const legW0 = legW;
      const legW2 = legW0 * (crouch > 0.9 ? 1.24 : 1) * (spec.pawScale ?? 1);
      c.fillStyle = dark(padK);
      c.beginPath(); c.ellipse(x, gy - legW2 * 0.22, legW2 * 1.06, legW2 * 0.44, 0, 0, TAU); c.fill();
      if (spec.webbedFeet) {
        c.fillStyle = `rgba(${Math.min(255, p.cr * 0.92 + 18) | 0},${Math.min(255, p.cg * 0.80 + 16) | 0},${Math.min(255, p.cb * 0.68 + 12) | 0},${0.92 * m})`;
        c.beginPath(); c.moveTo(x - legW2 * 0.72, gy - legW2 * 0.11);
        c.quadraticCurveTo(x, gy - legW2 * 0.62, x + legW2 * 0.76, gy - legW2 * 0.08);
        c.lineTo(x + legW2 * 0.58, gy + legW2 * 0.12); c.lineTo(x - legW2 * 0.58, gy + legW2 * 0.12); c.closePath(); c.fill();
      }
      c.fillStyle = dark(toeK);
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.ellipse(x + i * legW2 * 0.44, gy - legW2 * 0.06, legW2 * 0.30, legW2 * 0.26, 0, 0, TAU); c.fill();
      }
      /* the creases BETWEEN the toes — a fan of three lobes only reads as toes
         if something separates them; without this it is one rounded cap */
      c.strokeStyle = `rgba(24,18,14,${0.55 * m})`;
      c.lineWidth = Math.max(1, legW2 * 0.085); c.lineCap = 'round';
      for (const s of [-1, 1] as const) {
        c.beginPath();
        c.moveTo(x + s * legW2 * 0.22, gy - legW2 * 0.34);
        c.lineTo(x + s * legW2 * 0.22, gy + legW2 * 0.02);
        c.stroke();
      }
      /* the claw ticks off each toe front */
      c.strokeStyle = `rgba(30,24,18,${0.65 * m})`; c.lineWidth = Math.max(1, legW2 * 0.07);
      for (let i = -1; i <= 1; i++) {
        c.beginPath(); c.moveTo(x + i * legW2 * 0.44 - legW2 * 0.24, gy - legW2 * 0.02);
        c.lineTo(x + i * legW2 * 0.44 - legW2 * 0.34, gy + legW2 * 0.06); c.stroke();
      }
    } else if (foot === 'plantigrade') {
      /* a bear puts its heel down: a long sole with claws at the front */
      const claw = spec.clawScale ?? 1;
      c.fillStyle = dark(0.48);
      c.beginPath();
      c.ellipse(x + legW * 0.24, gy - legW * 0.22, legW * (hind ? 1.05 : 0.86), legW * 0.40, 0, 0, TAU);
      c.fill();
      c.fillStyle = `rgba(238,232,216,${0.72 * m})`;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.ellipse(x + legW * (0.62 + i * 0.16), gy - legW * 0.44,
          legW * 0.07 * claw, legW * 0.13 * claw, 0.5, 0, TAU);
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
      else if (coat === 'rosettes') coatRosettes(c, limb, r, lp, { count: 7, size: 0.5 * (spec.rosetteScale ?? 1) });
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
  const headY = shoulderY - neckReach * Math.sin(neckAng) + S * (spec.headDrop ?? 0);
  /* ★ WAVE 22b — A HEAD BELONGS TO THE ANIMAL'S LENGTH, not only its depth.
     Sized purely off bodyH, a sand cat got a 28px skull on a 210px body — 13%,
     where a real carnivore's head is about a fifth of its body. Long shallow
     animals came out as tubes with a pea on the end. Deep-bodied, heavy-jawed
     species are unchanged, because for them the depth term still wins. */
  const headR = Math.max(
    bodyH * (spec.jaw === 'barrel' ? 0.62 : spec.jaw === 'broad' ? 0.52 : 0.42),
    bodyW * 0.20,
  ) * (spec.headScale ?? FAM0.headScale ?? 1);
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
  else if (coat === 'spots') coatSpots(c, neckTube, r, p, { count: 34, size: 0.8 * (spec.spotScale ?? 1), soft: 0.13, rgb: [24, 17, 10] });
  else if (coat === 'rosettes') coatRosettes(c, neckTube, r, p, { count: 12, size: 0.8 * (spec.rosetteScale ?? 1),
    ...(spec.rosetteChain ? { chain: true } : {}) });
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
    coatSpots(c, body, r, p, { count: 150, size: 0.92 * (spec.spotScale ?? 1), soft: 0.13, rgb: [24, 17, 10] });
  } else if (coat === 'fawn') {
    coatSpots(c, body, r, p, { count: 60, size: 0.8, soft: 0.4, rgb: [246, 242, 228], phiLo: -0.4, phiHi: 1.3 });
  } else if (coat === 'rosettes') {
    coatRosettes(c, body, r, p, { count: spec.rosetteChain ? 22 : 38, core: name === 'Jaguar', size: spec.rosetteScale ?? 1,
      ...(spec.rosetteChain ? { chain: true } : {}) });
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
  if (name === 'Striped Hyena') {
    /* A striped hyena's markings are sparse vertical flank bars, not tiger
       bands wrapping the whole body. This deliberately narrow named pass keeps
       every striped felid/equid on its own established coat route. */
    c.save(); c.beginPath(); body.trace(c, 56); c.clip();
    c.strokeStyle = 'rgba(56,44,34,0.38)'; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const u = 0.24 + i * 0.115;
      const a2 = AX(u), rr = RAD(u);
      c.lineWidth = Math.max(1.8, rr * 0.065);
      c.beginPath();
      c.moveTo(a2[0] - rr * 0.18, a2[1] - rr * 0.62);
      c.quadraticCurveTo(a2[0] - rr * 0.12, a2[1], a2[0] - rr * 0.02, a2[1] + rr * 0.54);
      c.stroke();
    }
    c.restore();
  }
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
  } else if (spec.mane === 'bison' || spec.mane === 'hyena') {
    /* These are directional capes, not a lion's circular face ruff. Bison needs
       a heavy head/hump curtain; a striped hyena needs a narrow upright ridge
       over high shoulders. Both are opt-in named silhouettes. */
    const bisonMane = spec.mane === 'bison';
    const [withersX, withersY] = AX(0.84);
    const [backX, backY] = AX(bisonMane ? 0.46 : 0.60);
    const dark = `rgb(${Math.max(0, p.cr * (bisonMane ? 0.42 : 0.34)) | 0},${Math.max(0, p.cg * (bisonMane ? 0.40 : 0.34)) | 0},${Math.max(0, p.cb * (bisonMane ? 0.38 : 0.34)) | 0})`;
    c.fillStyle = dark;
    c.beginPath();
    c.moveTo(backX, backY - bodyH * (bisonMane ? 0.16 : 0.10));
    c.quadraticCurveTo(withersX - bodyW * 0.06, withersY - bodyH * (bisonMane ? 0.42 : 0.26),
      headX - headR * 0.42, headY - headR * 0.24);
    c.quadraticCurveTo(headX - headR * 0.56, headY + headR * (bisonMane ? 1.28 : 0.68),
      withersX - bodyW * 0.04, withersY + bodyH * (bisonMane ? 0.74 : 0.20));
    c.quadraticCurveTo(backX + bodyW * 0.10, backY + bodyH * (bisonMane ? 0.26 : 0.12),
      backX, backY - bodyH * (bisonMane ? 0.16 : 0.10));
    c.closePath(); c.fill();
    const mr3 = mulberry32((((g.seed as number) ^ (bisonMane ? 0xB150 : 0x48EA)) >>> 0));
    c.strokeStyle = `rgba(${Math.min(255, p.cr * 0.82) | 0},${Math.min(255, p.cg * 0.76) | 0},${Math.min(255, p.cb * 0.70) | 0},0.68)`;
    c.lineCap = 'round';
    const strokes = bisonMane ? 92 : 52;
    for (let i = 0; i < strokes; i++) {
      const t = i / Math.max(1, strokes - 1);
      const sx = backX + (withersX - backX) * t + (mr3() - 0.5) * bodyH * 0.10;
      const sy = backY - bodyH * (bisonMane ? 0.15 + 0.20 * Math.sin(t * Math.PI) : 0.09);
      const len = bodyH * (bisonMane ? 0.20 + mr3() * 0.22 : 0.10 + mr3() * 0.11);
      c.lineWidth = Math.max(1.5, bodyH * (bisonMane ? 0.030 : 0.020));
      c.beginPath(); c.moveTo(sx, sy);
      c.quadraticCurveTo(sx - bodyW * 0.04, sy + len * 0.42, sx - bodyW * 0.03, sy + len); c.stroke();
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
  else if (coat === 'rosettes') coatRosettes(c, head, r, p, { count: 7, size: 0.6 * (spec.rosetteScale ?? 1),
    ...(spec.rosetteChain ? { chain: true } : {}) });
  else if (coat === 'shaggy') coatShaggy(c, head, r, p, { count: 34 });
  c.restore();
  if (spec.muzzleHue) {
    /* A bear's tan snout or a sloth bear's pale muzzle is a surface of the
       existing skull, not a second head pasted onto it.  Clipping keeps the
       named colour inside the species' own muzzle profile. */
    const mp = head.pt(0.76, -0.08);
    c.save(); c.beginPath(); head.trace(c, 52); c.clip();
    const mg = c.createRadialGradient(mp[0] - skMuz * 0.22, mp[1] - skMuz * 0.18,
      skMuz * 0.10, mp[0], mp[1], skMuz * 1.05);
    mg.addColorStop(0, spec.muzzleHue);
    mg.addColorStop(0.72, spec.muzzleHue);
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = mg;
    c.beginPath(); c.ellipse(mp[0], mp[1], skMuz * 1.06, skMuz * 0.72, ang, 0, TAU); c.fill();
    c.restore();
  }
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
  if (spec.cheekRuff) {
    /* Bobcat and lynx carry a pointed fan of fur behind the jaw. The first
       cut used five tiny triangles rooted on the face; the skull covered most
       of their shared base and the remainder read as one pale cheek. Build a
       single serrated silhouette in skull coordinates, then lay individual
       hair vanes across it. No unset species enters this branch. */
    const rs = spec.cheekRuff;
    const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
    const rb = headAxis(0.27);
    const rp = (back: number, down: number): [number, number] =>
      [rb[0] - ux * headR * back * rs + vx * headR * down,
        rb[1] - uy * headR * back * rs + vy * headR * down];
    const ruff: Array<[number, number]> = [
      rp(0.02, -0.34), rp(0.72, -0.24), rp(0.26, 0.06),
      rp(1.00, 0.34), rp(0.25, 0.60), rp(0.72, 1.08),
      rp(0.04, 0.80),
    ];
    c.fillStyle = `rgba(${Math.min(255, p.cr * 1.24) | 0},${Math.min(255, p.cg * 1.24) | 0},${Math.min(255, p.cb * 1.24) | 0},0.99)`;
    c.strokeStyle = `rgba(${Math.max(0, p.cr * 0.34) | 0},${Math.max(0, p.cg * 0.34) | 0},${Math.max(0, p.cb * 0.34) | 0},0.92)`;
    c.lineWidth = Math.max(2.4, headR * 0.11); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(ruff[0]![0], ruff[0]![1]);
    for (let i = 1; i < ruff.length; i++) c.lineTo(ruff[i]![0], ruff[i]![1]);
    c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = `rgba(${Math.max(0, p.cr * 0.36) | 0},${Math.max(0, p.cg * 0.36) | 0},${Math.max(0, p.cb * 0.36) | 0},0.84)`;
    c.lineWidth = Math.max(1.8, headR * 0.075); c.lineCap = 'round';
    for (const [back, down] of [[0.64, -0.20], [0.88, 0.34], [0.62, 0.96]] as const) {
      const root = rp(0.08, down * 0.36);
      const tip = rp(back, down);
      c.beginPath(); c.moveTo(root[0], root[1]); c.lineTo(tip[0], tip[1]); c.stroke();
    }
  }
  if (spec.dewlap) {
    /* A dewlap is a hanging throat fold attached to the jaw/neck junction. It
       cannot be simulated by making the whole chest deeper without turning a
       bovid into a barrel. */
    const dk = spec.dewlap;
    const throat = head.pt(0.26, -0.88);
    const neckBase = headAxis(0.10);
    c.fillStyle = `rgba(${Math.max(0, p.cr * 0.62) | 0},${Math.max(0, p.cg * 0.62) | 0},${Math.max(0, p.cb * 0.58) | 0},0.92)`;
    c.beginPath();
    c.moveTo(throat[0] - headR * 0.12, throat[1] - headR * 0.04);
    c.quadraticCurveTo(throat[0] - headR * (0.46 + dk * 0.24), throat[1] + headR * (0.34 + dk * 0.16),
      neckBase[0] - headR * 0.20, neckBase[1] + headR * (0.72 + dk * 0.42));
    c.quadraticCurveTo(neckBase[0] + headR * 0.12, neckBase[1] + headR * (0.34 + dk * 0.22),
      throat[0] + headR * 0.20, throat[1] + headR * 0.12);
    c.closePath(); c.fill();
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

  if (spec.incisors === 'orange') {
    c.save(); c.translate(nosePt[0] - headR * 0.04, nosePt[1] + headR * 0.18); c.rotate(ang);
    c.fillStyle = '#d86f20';
    c.beginPath(); c.rect(-headR * 0.22, -headR * 0.06, headR * 0.15, headR * 0.36); c.fill();
    c.beginPath(); c.rect(headR * 0.02, -headR * 0.06, headR * 0.15, headR * 0.34); c.fill();
    c.restore();
  }
  if (spec.domesticCatFace) {
    /* A domestic cat's whiskers are one of its three catalogue must-reads.
       The family painter had none at all, so the correct slit pupil and short
       muzzle still collapsed into a generic small-mammal face at card scale.
       This fan is opt-in: accepted wild felids retain their exact pixels. */
    const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
    const wr = head.pt(0.68, -0.42);
    for (let i = 0; i < 5; i++) {
      const spread = (i - 2) * 0.22;
      const sx = wr[0] + vx * headR * spread * 0.20;
      const sy = wr[1] + vy * headR * spread * 0.20;
      const len = headR * (1.08 + (2 - Math.abs(i - 2)) * 0.10);
      const ex = sx + ux * len + vx * headR * spread;
      const ey = sy + uy * len + vy * headR * spread;
      c.strokeStyle = 'rgba(10,12,16,0.72)'; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + ux * len * 0.55, sy + uy * len * 0.55, ex, ey); c.stroke();
      c.strokeStyle = 'rgba(236,241,248,0.88)'; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + ux * len * 0.55, sy + uy * len * 0.55, ex, ey); c.stroke();
    }
    c.fillStyle = 'rgba(24,20,22,0.70)';
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.arc(wr[0] - ux * headR * (0.08 + i * 0.10),
        wr[1] + vy * headR * (i - 1) * 0.11, Math.max(1.1, headR * 0.035), 0, TAU); c.fill();
    }
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
            const tuftScale = spec.earTuftScale;
            c.strokeStyle = `rgba(12,10,9,${0.94 * m})`; c.lineCap = 'round';
            if (tuftScale) {
              for (let i = -2; i <= 2; i++) {
                c.lineWidth = Math.max(1.6, earR * 0.15 * (0.90 + tuftScale * 0.18));
                c.beginPath(); c.moveTo(i * earR * 0.085, -earR * 1.05);
                c.lineTo(i * earR * 0.19, -earR * (1.18 + 0.78 * tuftScale)); c.stroke();
              }
            } else {
              for (let i = -1; i <= 1; i++) {
                c.lineWidth = Math.max(1.4, earR * 0.13);
                c.beginPath(); c.moveTo(i * earR * 0.14, -earR * 1.05);
                c.lineTo(i * earR * 0.30, -earR * 1.85); c.stroke();
              }
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
    /* ★ GOLD AUDIT round 3 — one 3px stroke vanished at card scale; the tear
       mark is now a HEAVY black line from the eye's inner corner down the
       muzzle to the lip, doubled with a fainter outer track. */
    c.strokeStyle = 'rgba(18,13,9,0.92)'; c.lineWidth = Math.max(3, headR * 0.11); c.lineCap = 'round';
    c.beginPath(); c.moveTo(headX + headR * 0.02, headY - headR * 0.08);
    c.quadraticCurveTo(headX + headR * 0.38, headY + headR * 0.28, headX + headR * 0.80, headY + headR * 0.38); c.stroke();
    c.strokeStyle = 'rgba(22,16,10,0.55)'; c.lineWidth = Math.max(2, headR * 0.06);
    c.beginPath(); c.moveTo(headX - headR * 0.10, headY - headR * 0.02);
    c.quadraticCurveTo(headX + headR * 0.24, headY + headR * 0.36, headX + headR * 0.62, headY + headR * 0.48); c.stroke();
  }
  if (spec.faceMark) {
    const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
    if (spec.faceMark === 'spectacles') {
      /* Spectacled Bear: pale broken eye-rings and a nose bridge, left open so
         they read as markings rather than the old concentric-disc artifact. */
      c.strokeStyle = 'rgba(238,224,192,0.90)'; c.lineWidth = Math.max(3, headR * 0.20); c.lineCap = 'round';
      for (const side of [-1, 1] as const) {
        const e = head.pt(0.36, -0.34 + side * 0.28);
        c.beginPath(); c.ellipse(e[0], e[1], headR * 0.34, headR * 0.24, ang + side * 0.16, -2.35, 1.10); c.stroke();
      }
      const a = head.pt(0.40, -0.08), b = head.pt(0.56, -0.06);
      c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2 + vx * headR * 0.08, (a[1] + b[1]) / 2 + vy * headR * 0.08, b[0], b[1]); c.stroke();
    } else if (spec.faceMark === 'muzzleBars') {
      /* Cougar's dark cheek/muzzle bars run WITH the short feline muzzle. */
      c.strokeStyle = 'rgba(30,22,16,0.82)'; c.lineWidth = Math.max(2.4, headR * 0.10); c.lineCap = 'round';
      for (const side of [-1, 1] as const) {
        const a = head.pt(0.46, -0.42 + side * 0.18);
        const b = [a[0] + ux * headR * 0.66 + vx * headR * side * 0.20,
          a[1] + uy * headR * 0.66 + vy * headR * side * 0.20] as const;
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
    } else if (spec.faceMark === 'whiteBlaze') {
      /* A blaze is a narrow medial stripe, not a pale mask over both eyes. */
      const a = head.pt(0.18, 0.36), b = head.pt(0.84, 0.28);
      c.strokeStyle = 'rgba(244,238,220,0.88)'; c.lineWidth = Math.max(3, headR * 0.20); c.lineCap = 'round';
      c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2 - vx * headR * 0.10, (a[1] + b[1]) / 2 - vy * headR * 0.10, b[0], b[1]); c.stroke();
    } else { /* darkMask */
      const m = head.pt(0.38, -0.20);
      c.fillStyle = 'rgba(24,18,14,0.52)';
      c.beginPath(); c.ellipse(m[0], m[1], headR * 0.62, headR * 0.44, ang - 0.12, 0, TAU); c.fill();
    }
  }
  if (spec.cheekBars) {
    /* Ocelot: two oblique black cheek stripes running forward-and-down from
       the eye. The first cut ran backward under the neck and vanished. A thin
       pale keyline now separates the paired strokes from a dark phenotype,
       while the dark pass remains the dominant read at catalogue scale. */
    const ux = Math.cos(ang), uy = Math.sin(ang), dx = -Math.sin(ang), dy = Math.cos(ang);
    c.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const q = head.pt(0.38 + i * 0.11, -0.30);
      const len = headR * (0.92 - i * 0.08);
      const mx = q[0] + ux * len * 0.26 + dx * len * (0.28 + i * 0.08);
      const my = q[1] + uy * len * 0.26 + dy * len * (0.28 + i * 0.08);
      const ex = q[0] + ux * len * 0.52 + dx * len * (0.62 + i * 0.08);
      const ey = q[1] + uy * len * 0.52 + dy * len * (0.62 + i * 0.08);
      c.strokeStyle = 'rgba(238,224,188,0.72)';
      c.lineWidth = Math.max(4.2, headR * (0.17 - i * 0.01));
      c.beginPath(); c.moveTo(q[0], q[1]);
      c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      c.strokeStyle = 'rgba(15,11,9,0.96)';
      c.lineWidth = Math.max(2.5, headR * (0.105 - i * 0.008));
      c.beginPath(); c.moveTo(q[0], q[1]);
      c.quadraticCurveTo(mx, my, ex, ey);
      c.stroke();
    }
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
    /* ★ GOLD AUDIT round 3 — "tusks and warts too weak" on the warthog:
       the boar tusk is now thicker and longer, and the warthog gets its
       facial wart bumps beside the eye line. */
    const w = headR * (horn === 'tuskup' ? 0.16 : 0.12);
    const L = headR * (horn === 'tuskup' ? 1.35 : 1.55);
    if (horn === 'tuskup' && name === 'Warthog') {
      c.fillStyle = `rgb(${p.cr * 0.62 | 0},${p.cg * 0.62 | 0},${p.cb * 0.62 | 0})`;
      for (const [u2, phi2, wr] of [[0.62, -0.30, 0.14], [0.50, -0.52, 0.11]] as const) {
        const wp = head.pt(u2, phi2);
        c.beginPath(); c.ellipse(wp[0], wp[1], headR * wr, headR * wr * 0.72, 0, 0, TAU); c.fill();
      }
    }
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
    } else if (spec.accent === 'chestCrescent' || spec.accent === 'chestU') {
      /* The sun/sloth bear marks are a compact chest signal, separate from the
         Tasmanian Devil's horizontal blaze. */
      const [ax2, ay2] = AX(0.80);
      const crescent = spec.accent === 'chestCrescent';
      c.strokeStyle = crescent ? 'rgba(244,208,130,0.94)' : 'rgba(238,226,192,0.92)';
      c.lineWidth = bodyH * (crescent ? 0.14 : 0.12); c.lineCap = 'round';
      c.beginPath();
      if (crescent) {
        c.moveTo(ax2 - bodyW * 0.11, ay2 + RAD(0.80) * 0.20);
        c.quadraticCurveTo(ax2 + bodyW * 0.08, ay2 + RAD(0.80) * 0.82, ax2 + bodyW * 0.17, ay2 + RAD(0.80) * 0.16);
      } else {
        c.moveTo(ax2 - bodyW * 0.12, ay2 + RAD(0.80) * 0.06);
        c.quadraticCurveTo(ax2 - bodyW * 0.08, ay2 + RAD(0.80) * 0.82, ax2 + bodyW * 0.02, ay2 + RAD(0.80) * 0.88);
        c.quadraticCurveTo(ax2 + bodyW * 0.14, ay2 + RAD(0.80) * 0.78, ax2 + bodyW * 0.17, ay2 + RAD(0.80) * 0.10);
      }
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
  if (spec.tailPose === 'upright') {
    /* Coati and warthog carry a real vertical signal tail. A bent horizontal
       tail with rings/tuft decoration cannot communicate that posture. */
    const TS = spec.tailScale ?? 1;
    const p1: [number, number] = [tx0 - bodyW * 0.28 * TS, ty0 - bodyH * 0.40 * TS];
    const p2: [number, number] = [tx0 - bodyW * 0.20 * TS, ty0 - bodyH * 0.98 * TS];
    const p3: [number, number] = [tx0 - bodyW * 0.05 * TS, ty0 - bodyH * 1.42 * TS];
    const tailAt = (t: number): [number, number] => {
      const m = 1 - t;
      return [m * m * m * tx0 + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
        m * m * m * ty0 + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
    };
    const tailR = (t: number): number => bodyH * (0.15 - t * 0.065);
    const tailT = new Tube({ P: tailAt, R: tailR });
    c.fillStyle = p.base; c.beginPath(); tailT.trace(c, 42); c.fill();
    c.save(); c.beginPath(); tailT.trace(c, 42); c.clip();
    countershade(c, tailT, p, 0.80);
    coatMaterial(c, tailT, r, p, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL * 0.34, len: 0.58 });
    if (tail === 'banded') {
      c.lineCap = 'butt'; c.strokeStyle = 'rgba(30,23,18,0.88)';
      for (let i = 0; i < 6; i++) {
        const a2 = tailAt(0.12 + i * 0.14), b2 = tailAt(0.18 + i * 0.14);
        c.lineWidth = tailR(0.12 + i * 0.14) * 2.7;
        c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke();
      }
    }
    c.restore();
    if (tail === 'tuft') {
      const tip = tailAt(1);
      c.strokeStyle = `rgba(${Math.max(0, p.cr * 0.34) | 0},${Math.max(0, p.cg * 0.30) | 0},${Math.max(0, p.cb * 0.26) | 0},0.88)`;
      c.lineCap = 'round'; c.lineWidth = Math.max(1.5, bodyH * 0.035);
      for (let i = -2; i <= 2; i++) {
        c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo(tip[0] + i * bodyH * 0.08, tip[1] - bodyH * 0.10, tip[0] + i * bodyH * 0.11, tip[1] - bodyH * 0.20); c.stroke();
      }
    }
  } else if (tail === 'bushy' || tail === 'plume') {
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
  } else if (tail === 'long' && spec.tailPose === 'raised') {
    /* A domestic cat carries its tail as a long expressive question-mark,
       not the default low hanging sweep. This separate opt-in branch keeps
       every accepted long-tailed felid on the exact existing path. */
    const TS = spec.tailScale ?? 1;
    const p1: [number, number] = [tx0 - bodyW * 0.54 * TS, ty0 + bodyH * 0.18];
    const p2: [number, number] = [tx0 - bodyW * 0.46 * TS, ty0 - bodyH * 0.96 * TS];
    const p3: [number, number] = [tx0 - bodyW * 0.14 * TS, ty0 - bodyH * 1.16 * TS];
    const tailAt = (t: number): [number, number] => {
      const m = 1 - t;
      return [m * m * m * tx0 + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
        m * m * m * ty0 + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
    };
    const tailR = (t: number): number => bodyH * (0.15 - t * 0.045);
    const tailT = new Tube({ P: tailAt, R: tailR });
    c.fillStyle = p.base; c.beginPath(); tailT.trace(c, 44); c.fill();
    c.save(); c.beginPath(); tailT.trace(c, 44); c.clip();
    countershade(c, tailT, p, 0.78);
    coatMaterial(c, tailT, r, p, spec.mat ?? FAM0.mat, { detail: MAT_DETAIL * 0.42, len: 0.72 });
    c.restore();
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
  } else if (tail === 'muscular') {
    /* rendered behind the torso above, so the root joins without a cap seam */
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
  'Lion': { legs: 0.1236, depth: 0.1426, len: 0.2455, neck: 0.06, muzzle: 0.34, jaw: 'broad', ears: 'round', tail: 'tuft', mane: 'lion', hue: '#c19a5b', family: 'felid', mammalBPlan: 'felid-r1' },
  'Jaguar': { legs: 0.108, depth: 0.151, len: 0.2287, neck: 0.07, muzzle: 0.38, jaw: 'broad', ears: 'round', tail: 'long', coat: 'rosettes' , hue: "#c8983c", family: 'felid' , legMarks: true, tailScale: 1.52, headScale: 1.30, pawScale: 1.20, rosetteScale: 1.18, mammalBPlan: 'felid-r1' },
  'Leopard': { legs: 0.1253, depth: 0.1080, len: 0.2287, neck: 0.07, muzzle: 0.32, ears: 'round', tail: 'long', coat: 'rosettes' , hue: "#d3ab5e", family: 'felid' , legMarks: true, tailScale: 1.8, mammalBPlan: 'felid-r1' },
  'Snow Leopard': { legs: 0.114, depth: 0.123, len: 0.2399, neck: 0.07, muzzle: 0.30, ears: 'round', tail: 'long', coat: 'rosettes', hue: '#cfd4dc', family: 'felid' , legMarks: true, tailScale: 3.25, pawScale: 1.34, rosetteScale: 1.52, headScale: 1.10, mammalBPlan: 'felid-r1' },
  /* ★ wave 35 — Nick's row: "current ungulate-like body lacks deep chest,
     tucked waist, feline paws/head". It is the one felid NOT built like a big
     cat — a whippet: extreme waist tuck, light hindquarters, and a tail nearly
     as long as the body it steers. Those four numbers are the animal, and the
     felid plan alone could never reach them because the felid plan describes a
     leopard. */
  'Cheetah': { back: 'arched', legs: 0.202, depth: 0.096, len: 0.215, neck: 0.09, muzzle: 0.28, ears: 'round', tail: 'long', coat: 'spots', face: 'tears', hue: '#d8b477', family: 'felid', waist: 1.0, chest: 1.06, rump: 0.46, tailScale: 2.48, legMarks: true, headScale: 1.28, spotScale: 0.78, carry: 0.56, mammalBPlan: 'felid-r1' },
  'Cougar': { legs: 0.1482, depth: 0.1120, len: 0.2287, neck: 0.08, muzzle: 0.30, ears: 'round', tail: 'long' , hue: "#b08655", family: 'felid', tailScale: 1.7, tailTip: '#241f1d', faceMark: 'muzzleBars', mammalBPlan: 'felid-r1' },
  'Lynx': { back: 'arched', legs: 0.1495, depth: 0.1226, len: 0.186, neck: 0.06, muzzle: 0.26, ears: 'large', tail: 'stub', coat: 'spots' , hue: "#b9a184", family: 'felid', earShape: 'tuft', earTuftScale: 1.38, cheekRuff: 1.76, pawScale: 1.34, spotScale: 0.56, mammalBPlan: 'felid-r1' },
  /* the pixel-siblings, separated */
  'Rhinoceros': { legs: 0.0835, depth: 0.1886, len: 0.263, neck: 0.045, muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'twinnose', hue: '#8b8b8e', family: 'pachyderm' },
  'Wild Sheep': { legs: 0.1345, depth: 0.1529, len: 0.1881, neck: 0.075, muzzle: 0.35, ears: 'small', tail: 'stub', horn: 'curl', coat: 'shaggy', hue: '#9d8a6e', family: 'bovid' },
  'Hippopotamus': { legs: 0.0486, depth: 0.1789, len: 0.3227, neck: 0.03, muzzle: 0.62, jaw: 'barrel', ears: 'tiny', tail: 'stub', hue: '#8a6f74', family: 'pachyderm' },
  /* the humped and the long-necked */
  'Camel': { legs: 0.1846, depth: 0.1629, len: 0.1804, neck: 0.20, back: 'level', muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#c8a173', family: 'camelid' },
  'Bactrian Camel': { legs: 0.176, depth: 0.1667, len: 0.1914, neck: 0.19, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 2, hue: '#b08a5e', family: 'camelid' },
  'Dromedary Camel': { legs: 0.1935, depth: 0.159, len: 0.176, neck: 0.20, muzzle: 0.45, ears: 'small', tail: 'tuft', humps: 1, hue: '#cba777', family: 'camelid', carry: 0.42 },
  'Giraffe': { legs: 0.2438, depth: 0.1573, len: 0.1652, neck: 0.34, back: 'sloped', muzzle: 0.40, ears: 'large', tail: 'tuft', coat: 'patches', horn: 'ossicone', hue: '#e0c07a' , family: 'cervid' , legMarks: true },
  'Llama': { legs: 0.1938, depth: 0.1434, len: 0.1506, neck: 0.20, muzzle: 0.35, ears: 'large', tail: 'stub', hue: '#d8cbb4', family: 'camelid', earScale: 1.5 },
  'Alpaca': { legs: 0.1594, depth: 0.1448, len: 0.152, neck: 0.18, muzzle: 0.30, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#ddd2bd', family: 'camelid' },
  /* antlered + horned */
  'Moose': { legs: 0.2181, depth: 0.1843, len: 0.2116, neck: 0.10, back: 'humped', muzzle: 0.62, jaw: 'broad', ears: 'large', tail: 'stub', horn: 'palmate', hue: '#5b4433', family: 'cervid', shoulderHump: 0.24, dewlap: 0.72 },
  'Elk': { legs: 0.2035, depth: 0.1594, len: 0.2092, neck: 0.13, back: 'sloped', muzzle: 0.48, ears: 'large', tail: 'stub', horn: 'branched', hue: '#9c7748', family: 'cervid' },
  'Deer': { legs: 0.1973, depth: 0.139, len: 0.1709, neck: 0.12, muzzle: 0.42, ears: 'large', tail: 'stub', horn: 'branched', coat: 'spots', hue: '#b98a58', family: 'cervid' },
  /* ★ wave 35 — the warm brown half of the Caribou/Reindeer split; see Caribou */
  'Reindeer': { legs: 0.1782, depth: 0.1505, len: 0.1974, neck: 0.11, muzzle: 0.44, ears: 'small', tail: 'stub', horn: 'branched', hue: '#9c7548', family: 'cervid', shoulderHump: 0.10, dewlap: 0.24 },
  'Sheep': { legs: 0.1448, depth: 0.1548, len: 0.1777, neck: 0.08, muzzle: 0.36, ears: 'small', tail: 'stub', horn: 'curl', hue: '#a98f6d', family: 'bovid' },
  'Bison': { legs: 0.104, depth: 0.1881, len: 0.2313, neck: 0.030, back: 'humped', muzzle: 0.42, jaw: 'broad', ears: 'small', tail: 'tuft', tailScale: 0.58, coat: 'shaggy', horn: 'shorthorn', hue: '#5c4535', family: 'bovid', carry: 0, chest: 1.28, rump: 0.18, shoulderHump: 0.52, mane: 'bison', muzzleHue: '#3b2b24', headScale: 1.18, headDrop: 0.10 },
  'Water Buffalo': { legs: 0.118, depth: 0.184, len: 0.246, neck: 0.06, muzzle: 0.50, jaw: 'broad', ears: 'large', tail: 'tuft', horn: 'sweep', hue: '#77736e', family: 'bovid', earShape: 'drop', earScale: 1.18, headScale: 1.16, shoulderHump: 0.18, dewlap: 0.42, muzzleHue: '#4d4d48' },
  /* bears, differentiated */
  'Grizzly Bear': { legs: 0.0916, depth: 0.1717, len: 0.2534, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#7a5636', family: 'ursid', shoulderHump: 0.24, clawScale: 1.45, muzzleHue: '#b49670', mammalBPlan: 'ursid-r1' },
  'Brown Bear': { legs: 0.0963, depth: 0.1881, len: 0.2313, neck: 0.05, back: 'humped', muzzle: 0.44, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#70502f', family: 'ursid', shoulderHump: 0.18, clawScale: 1.30, muzzleHue: '#b18a62', mammalBPlan: 'ursid-r1' },
  'Polar Bear': { legs: 0.1112, depth: 0.1696, len: 0.2642, neck: 0.10, back: 'level', muzzle: 0.55, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#eef2f6', family: 'ursid', earScale: 0.50, clawScale: 1.28, muzzleHue: '#d8d5c7', mammalBPlan: 'ursid-r1' },
  'Black Bear': { legs: 0.101, depth: 0.1729, len: 0.2268, neck: 0.05, muzzle: 0.42, jaw: 'broad', ears: 'round', tail: 'stub', hue: '#3b3a40', family: 'ursid', shoulderHump: 0.12, clawScale: 1.25, muzzleHue: '#b99a78', mammalBPlan: 'ursid-r1' },
  'Panda': { legs: 0.0825, depth: 0.1844, len: 0.2269, neck: 0.04, back: 'arched', muzzle: 0.30, jaw: 'broad', ears: 'round', tail: 'stub', coat: 'panda', face: 'mask', hue: '#f0f2f4', family: 'ursid' , legMarks: true, mammalBPlan: 'ursid-r1' },
  'Sun Bear': { legs: 0.0939, depth: 0.1438, len: 0.2004, neck: 0.05, muzzle: 0.38, ears: 'round', tail: 'stub', hue: '#2f2b2c', family: 'ursid', accent: 'chestCrescent', clawScale: 1.34, muzzleHue: '#c7ac84', mammalBPlan: 'ursid-r1' },
  'Sloth Bear': { legs: 0.1001, depth: 0.1697, len: 0.2227, neck: 0.05, muzzle: 0.55, ears: 'large', tail: 'stub', coat: 'shaggy', hue: '#2b2726', family: 'ursid', accent: 'chestU', clawScale: 1.52, muzzleHue: '#d4c19c', mammalBPlan: 'ursid-r1' },
  /* canids + small mammals where ears/tails are the read */
  'Red Fox': { legs: 0.1118, depth: 0.104, len: 0.1962, neck: 0.06, muzzle: 0.44, jaw: 'fine', ears: 'large', tail: 'plume', hue: '#d1651f', family: 'canid', tailScale: 1.7, tailTip: '#f2efe6', stockings: '#241b19', mammalCPlan: 'canid-c1' },
  'Arctic Fox': { legs: 0.1046, depth: 0.1072, len: 0.1847, neck: 0.06, muzzle: 0.36, ears: 'small', tail: 'plume', hue: '#eaf0f5', family: 'canid', tailScale: 1.7 , tailTip: '#f6f5f2', muzzleHue: '#d9d3c7' },
  /* ★ wave 21 — the audit: "ears should dominate the head; reduce body size and
     increase bushy tail". A fennec is a desert fox scaled DOWN around ears that
     were not scaled down with it. */
  'Fennec Fox': { legs: 0.0667, depth: 0.0799, len: 0.1048, neck: 0.03, muzzle: 0.30, ears: 'huge', tail: 'plume', hue: '#e6cfa4', earScale: 1.30, tailScale: 1.6, family: 'canid', earShape: 'point' , tailTip: '#20191a' },
  'Wolf': { legs: 0.155, depth: 0.1377, len: 0.2033, neck: 0.08, muzzle: 0.46, jaw: 'broad', ears: 'large', tail: 'bushy', hue: '#7d7f86', family: 'canid', tailTip: '#241f1d', muzzleHue: '#cac5b8', mammalCPlan: 'canid-c1' },
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
  'Walrus': { legs: 0.0303, depth: 0.1631, len: 0.2943, neck: 0.04, muzzle: 0.50, jaw: 'barrel', ears: 'tiny', tail: 'none', horn: 'tuskdown', hue: '#a3705f', family: 'pinniped', headScale: 1.16, muzzleHue: '#b99484' },
  /* equines + swine */
  'Horse': { legs: 0.1964, depth: 0.166, len: 0.1999, neck: 0.14, muzzle: 0.50, ears: 'small', tail: 'flow', mane: 'crest', hue: '#8a5a35', family: 'equid' },
  'Wild Boar': { legs: 0.0955, depth: 0.1423, len: 0.2101, neck: 0.05, back: 'sloped', muzzle: 0.52, jaw: 'broad', ears: 'small', tail: 'stub', horn: 'tuskup', coat: 'shaggy', hue: '#5a4a3e', family: 'suid', earShape: 'point' },
  'Warthog': { legs: 0.1087, depth: 0.155, len: 0.1958, neck: 0.05, back: 'sloped', muzzle: 0.62, jaw: 'broad', ears: 'small', tail: 'tuft', horn: 'tuskup', mane: 'crestUp', hue: '#6b5647', family: 'suid', earShape: 'point', carry: 0.20, tailPose: 'upright' },
  /* ★ wave 35 — a tapir is barrel-bodied like a suid, so it keeps that BODY;
     but the suid skull hard-wires the flat cartilage nose disc that is a pig's
     whole identity, and the reference row warns against it by name. It gets a
     pachyderm head and the short prehensile proboscis it is known for. */
  'Tapir': { legs: 0.1099, depth: 0.1542, len: 0.2276, neck: 0.05, muzzle: 0.48, jaw: 'broad', ears: 'small', tail: 'stub', hue: '#4a4348', family: 'suid', skull: 'pachyderm', trunk: 0.16 },
};
