# The per-species mammal fixes — prescribed, not yet applied

Three agents rendered all 144 audited mammals family by family and prescribed exact spec
changes. Waves 32–34 applied the **family/skull tables**, the **four cross-family painter
bugs** and the **ear subset**. What follows is the rest: already diagnosed, pure execution.

⚠ This file is a CONDENSED record. The agents produced ~100 items; the highest-value ones
are here. To regenerate the full set, re-run the three prompts recorded in git history for
waves 32–34 — they are reproducible and cheap (each agent renders and looks).

---

## ★ WRONG FAMILY CHASSIS — do these first, the plans cannot reach them
Nick's own audit rows name these, and no table fix helps until the routing changes.
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

## ★ THE BIGGEST REMAINING PAINTER BUGS (each clears several species)
- **`tail: 'banded'`** draws its bands as 2px segments on a path that does not follow the
  tail's own curve, so EVERY banded tail renders as a plain dark curl — Coati, Kinkajou,
  Raccoon, Red Panda, Civet, Sand Cat, Wildcat.
- **`tail: 'tuft'`** ends in a dark ellipse — a blob, not a tuft. Warthog, Camel, Bactrian,
  Dromedary, Zebra, Rhinoceros, all elephants.
- **Horn/tusk anchors** use `headX + 0.7…1.5·headR` — a fixed offset from the head CENTRE —
  while the real muzzle end is at `headAxis(1.0)`, 1.5–2.5·headR away on long skulls. So
  warthog and boar tusks sprout beside the eye and the rhino's horns float off the nose.
  Anchor to `head.pt(0.88…0.98, ±)`.
- **The limb-exit occlusion** (radial gradient, alpha 0.40, radius 0.95·rr centred *above*
  the axis) reads as a pasted dark disc on any pale deep-bodied animal: Elk's "shoulder and
  haunch decals", Saiga's "airbrushed disc", Polar Bear's "flat-disc primitive punched into
  the rump". Alpha ≈0.18, radius ≈0.55·RAD, clipped below the axis.
- **`coat: 'shaggy'`** calls `shaggyRim` isotropically, pushing straight quills through the
  silhouette on back, belly, chest and rump alike — Alpaca's hedgehog outline, Caribou's
  ears-to-tail comb, Wild Boar's below-the-belly straw. Needs a dorsal phi window.
- **`SKULL.nosePad` is never read** by the `disc` or `nostril` nose branches — the suid's
  1.30 does nothing. D-ART-100; `speccheck` cannot see it because the field IS read for
  other nose kinds.

## ★ NEW AXES THE AUDIT REQUIRES (a missing signature beats a wrong proportion)
- `skull?: keyof SKULL` — per-species skull family, defaulting to `spec.family`. Unblocks
  Sloth, both tapirs, Hippopotamus, Walrus. **Highest-value new axis.**
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
