# The per-species mammal fixes — prescribed, not yet applied

Three agents rendered all 144 audited mammals family by family and prescribed exact spec
changes. Waves 32–34 applied the **family/skull tables**, the **four cross-family painter
bugs** and the **ear subset**. What follows is the rest: already diagnosed, pure execution.

⚠ This file is a CONDENSED record. The agents produced ~100 items; the highest-value ones
are here. To regenerate the full set, re-run the three prompts recorded in git history for
waves 32–34 — they are reproducible and cheap (each agent renders and looks).

---

## ✅ WRONG FAMILY CHASSIS — ALL DONE (wave 35), verified by rendering each one
Nick's own audit rows name these, and no table fix helps until the routing changes.
All six landed. ⚠ Two prescriptions below were WRONG when rendered and were
corrected against the animal — see the notes in the source:
- **Panda's band**: the prescribed `{u0: 0.60, u1: 0.86}` leaves a WHITE CHEST in
  front of the black, so it read as a saddle. It ships as `{0.64, 1.0}` — black
  from mid-back forward through the shoulders, stopping at the white neck.
- **`skull` needed a partner**: the tapirs also needed `trunk` to take a NUMBER
  (a short proboscis), or the pig-disc fix just leaves them noseless.
- **Cheetah** — "current ungulate-like body". Add `waist: 1.0, chest: 0.95, rump: 0.52,
  tailScale: 1.9`. It is the one felid NOT built like a big cat: whippet waist, light
  hindquarters, near body-length tail.
- **Panda** — "the body is a cow-like quadruped". Needs the round ursid torso; and in the
  `coat: 'panda'` block delete the second band `{u0: 0.0, u1: 0.22}` and widen the first to
  `{u0: 0.60, u1: 0.86}` — a panda's rump is white, and the two full bands are what make it
  read as a belted cow.
- **Hyena · Spotted Hyena · Striped Hyena** — `family: 'canid'` → a NEW `hyaenid` entry.
  FAMILY `{ waist: 0.52, muscle: 0.92, chest: 0.86, rump: 0.28, foot: 'paw', cannon: 0.62,
  crouch: 0.46, ear: 'round', pupil: 'round', iris: '#6b5230', mat: 'fur' }`; SKULL
  `{ len: 1.95, cranium: 1.10, stop: 0.34, muzzle: 0.44, jaw: 0.44, eyeU: 0.42, eyePhi: 0.26,
  eyeR: 0.130, nose: 'wet', tilt: 0.14, nosePad: 1.10, lip: 'straight', cheek: 0.88 }`.
  Three blockers, one table row. Also Striped Hyena `coat: 'stripes'` → `'plain'`.
- **Sloth** — drawn with the anteater's 3.10-len tube snout. Needs a per-species `skull`
  override (see NEW AXES) plus `tail: 'none'` (the stub tail is the dark disc on its
  shoulder) and `back: 'roached'`.
- **Tapir · Mountain Tapir** — the suid skull hard-wires `nose: 'disc'`, so they get a pig
  nose the reference explicitly warns against. Needs the `skull` override + `trunk: 0.16`.

## ✅ THE BIGGEST REMAINING PAINTER BUGS — ALL SIX DONE (wave 35)
Every one verified by rendering the species it was said to affect, before and after.
- ✅ **`tail: 'banded'`** — the bands were placed with a DIFFERENT formula from the curve
  they were meant to sit on. The tail is a `Tube` now and the rings are laid across its own
  axis, clipped to its own surface. Coati, Kinkajou, Raccoon, Red Panda, Civet, Sand Cat,
  Wildcat all have real ringed tails.
- ✅ **`tail: 'tuft'`** — now a spray of strands leaving the tip along the tail's own
  direction, not a dark ellipse.
- ✅ **Horn/tusk anchors** — both anchored to `head.pt()` on the skull's own surface. The
  Rhinoceros has two horns standing on its nose; boar and warthog tusks leave the mouth.
- ✅ **The limb-exit occlusion** — alpha 0.18, radius 0.55·RAD, clipped below the axis.
  Elk's rump decal is gone.
- ✅ **`coat: 'shaggy'`** — the rim is anisotropic (heaviest on the spine, thin on the
  belly, faded at the caps), and it HANGS. ⚠ the first cut normalised the gravity vector to
  unit length, which steered the hair without weighing it and left the Yak's dorsal
  palisade intact — gravity must SHORTEN what points up. Also shortened and densified:
  long sparse strands read as spikes, short dense ones read as wool.
- ✅ **`SKULL.nosePad`** — read by all three nose branches now.

## ★ NEW, FOUND BY LOOKING (wave 35) — the next queue
- **⚠ D-ART-137, the worst of them: `if (earShape === 'hidden') return;` left the WHOLE
  painter.** Everything below it — face markings, THE EYE, horns, trunk and tail — was
  skipped for every species with no external ear. Sloth, Mole, Seal, Fur Seal, Sea Lion and
  Walrus rendered with a blank head and no eye, and the Walrus had no tusks. Fixed.
  The lesson is one level below D-ART-88: a fix can be correct about the thing it names and
  wrong about where it stops, and only a render shows you which.
- **`npm run artbattery` could not express a declaration.** It invoked artlock with no
  args, so [DRIFT] read "declared: (nothing)" and the stage FAILED on every legitimate
  change. A gate that cannot pass when the work is right gets ignored — the same failure
  D-ART-109 already recorded once for this exact stage. It forwards args now:
  `npm run artbattery -- --touching=quadruped`.
- **`tail: 'bushy'` is a straw broom.** 110 guard hairs, too long and too straight, spraying
  off a tail that reads as horizontal. Hyena, Wolf, Fox, Snow Leopard, Bison, Elk. This is
  now the most-visible tail defect and it is the same shape of bug wave 21 fixed for width.
- **The elephant's ear fan is a flat dark ellipse** covering the cheek. Its comment claims
  it is "drawn behind the head so the head overlaps its root" — it is drawn AFTER the head,
  so it is not. Another documented-but-false claim.
- **`ears:'large'` + `earShape:'round'` = two dark discs** that dominate the skull on the
  three hyenas and read as a cap. Size and shape compose badly at the top of the range.
- **The hyena bodies are only half-fixed.** The hyaenid head lands; the topline and the long
  straight legs still read pony-ish, because fore and hind limbs are always the same length
  (a listed structural limit) so the sloping back can only ever be faked.

## ★ NEW AXES THE AUDIT REQUIRES (a missing signature beats a wrong proportion)
- ✅ `skull?: MammalFamily` — **LANDED wave 35.** Per-species skull, defaulting to
  `spec.family`. Sloth and both tapirs are done; **Hippopotamus and Walrus are still
  unclaimed and are now one-line table edits.**
- ✅ `back: 'roached'` — **LANDED wave 35** (rump above shoulder). Applied to Sloth;
  **Raccoon and Aardvark still need it and are one-line edits.**
- ✅ `trunk: number` — **LANDED wave 35.** A trunk has a length now; 1 (or `true`) is the
  elephant's, 0.16 is a tapir's proboscis.
- ✅ `tailTip` on plain/tufted tails — **LANDED wave 35.** It was read by the brush branch
  only, so a stoat could not have its black tip. Same D-ART-100 shape as `nosePad`.
- `patagium` — Sugar Glider, Colugo. (Colugo also has NO family declared and falls to
  'generic', so it gets no body plan at all.)
- `mane: 'crest' | 'nape' | 'ruff'` — six equids plus Wild Boar, Warthog, Elk, Reindeer,
  Caribou. `coat: 'shaggy'` is currently misused as a substitute.
- `armor: 'scutes'` — Armadillo, Pangolin. `coat: 'banded'` is a flat paint job with no
  relief in the outline; the carapace must displace the silhouette.
- `clawScale` / `forelimb: 'spade'` — Sloth, Giant Anteater, Wombat, Mole, Aardvark. Claws
  currently render at ~4px, which is why four rows say "no claws whatsoever".
- `coatZone` — a u-range plus an include-legs flag. Okapi's rear-only stripes and Zebra's
  leg stripes are both unreachable today.
- `pinniped limb: 'propped' | 'hauled'` — three blockers at once. Seals are currently drawn
  as standing quadrupeds with paddles glued to the bottom.
- `back: 'roached'` — rump above shoulder. Raccoon, Aardvark, Sloth.
- `tailTip` already added in wave 34; `incisor: 'chisel'` (Beaver, Marsh Rodent) and
  `whisker: 'mystacial'` (Walrus) still needed.

## ★ STRUCTURALLY UNREACHABLE — for the upgrade, not for this engine
- **No marking can appear on a leg.** The four leg Tubes are filled before the coat clip and
  never revisited. Zebra's leg stripes, Okapi's striped upper legs, Panda's black legs.
- **Poses.** Meerkat's sentinel stance, Sea Otter floating supine, the pinniped haul-out —
  `faunaQuadruped` only draws a horizontal quadruped with four feet on `groundY`.
- **Fore and hind limbs are always the same length** (all terminate at `groundY`), so the
  hyena's shorter hind legs can only ever be faked through the topline.
- **Camel humps** are filled flat in `p.base` AFTER the coat and material layers, so they can
  never carry the coat and always show a seam. They must be folded into `topY()`.
