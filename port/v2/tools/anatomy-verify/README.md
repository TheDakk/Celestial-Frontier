# anatomy-verify — Track T1, the label-free anatomy verifier (design + retained calibration slices)

Status 2026-09-20 early hours: **design, with three calibration slices that are NOT a verifier.** Nothing here admits
or refuses a creature in the game. Owner: Claude (anthropic lane). Program: `audits/VISION_PROGRAM_20260920/PROGRAM.md`.

## Why a verifier, and what "trust" means
Runtime generation of new anatomy by the local model is admitted only when (1) an automatic verifier reports the
template's counts on every known-good master and refuses every mutant, both directions; (2) a human-labelled battery
gives the model's correctness rate and, above all, the **verifier's miss rate** (a wrong creature that gets through);
(3) a runtime contract retains verified originals and refuses everything else into the painted library.

## What the three slices found on the six known masters (five painter crabs, the keyed Civet)
| Slice | Method | Result | Why it is not enough |
|---|---|---|---|
| 1 `silhouette.mjs` | body core by erosion, appendages = components of the rest | crabs: 1–5 "legs" of 8 | near and far legs **cross** in the painting, so components merge; erosion is capped at 32 px and the 1254 px Civet needs a scaled or downsampled pass |
| 2 `skeleton.mjs` | downscale, Zhang–Suen thinning, endpoints in a ground band | crabs: 0–2 feet of 8; Civet: empty | tips thin to two-pixel diagonals that read as non-endpoints; junction rule over-fires on staircases; the Civet master is **fully opaque and key-painted** (alpha 255 everywhere) — it must be keyed first (`keyAndDespill`), as every generated image will |
| 3 (inline) | components inside the bottom band of the box | every crab: 2 | the painter draws **far legs higher than near legs** (perspective), so one ground band sees only the two lowest tips |

Lesson: limb counting from a silhouette with crossing, perspective-shortened limbs is a structural problem, not a
threshold problem. The robust verifier is template-aware: it fits the family's landmark graph to the silhouette.

## T1 design (one anatomy round; not started as code)
1. **Key** → alpha (`keyAndDespill`), downsample to a fixed working scale.
2. **Distance transform + ridge skeleton** (not thinning): the medial axis with per-pixel radius, then a graph with
   junction clustering (merge junctions within one radius) and branch attributes (length, mean radius, direction,
   attachment point on the body ridge).
3. **Template graph matching**: each family template already carries rest landmarks and bone lengths; from them, the
   expected branch classes (legs: radius, downward direction, attachment along the body axis; head; tail; claws;
   fins; wings). Match branches to classes by geometry; count per class; report unmatched branches as findings.
4. **Verdict**: counts inside the template's expectation AND no unmatched major branch ⇒ ADMIT; else REFUSE with reasons.
5. **Calibration and both-way controls**: positives = every painter canvas with a known template (the 631 named fauna
   rendered by `port/v2/tools/speciesstrip.mjs`, plus the crab masters and the keyed Earth masters); mutants from the
   crab label maps (erase one leg, duplicate one leg, merge two legs, double the head) and from the painter canvases
   (occlude a limb). T1 passes only when every positive is ADMIT and every mutant is REFUSE, per template.
6. **T2 battery** then runs the local model's cut-out generation across templates and Nick labels a sample; the two
   numbers decide the trust threshold.

`silhouette.mjs` and `skeleton.mjs` stay as retained calibration code with their measured failures; they are inputs
to step 2/3, not shortcuts around them.

## Slice 4 — `tips.mjs` (multi-scale tip detector), 2026-09-20, after the P1 painting existed
A limb tip is a boundary pixel whose (2R+1)² window is mostly empty (fill < 0.22), taken over R ∈ {8,14,22,32} at a
512 px working scale and clustered; direction = tip minus the local mass centre; classification is still naive
(down-pointing = foot). `calibrate.mjs` runs it over the six masters and Codex's painted coconut crab:

| Subject | expected feet | found feet | note |
|---|---:|---:|---|
| crab (painter) | 8 | **8** | claws not classified (0 of 2–4 tips) |
| coconut-crab (painter) | 8 | **8** | ADMIT on the naive classifier |
| freshwater-crab (painter) | 8 | **8** | claw tips over-counted (6) |
| mud-crab (painter) | 8 | 3 | the painter plants near and far leg pairs on the SAME tip: two limbs, one tip — a genuine silhouette ambiguity; the merged tip is twice as thick, which the distance transform can see |
| vent-crab (painter) | 8 | 7 | hairy edges spawn tips; one pair merges |
| civet (keyed) | 4 | 0 | limbs thicker than the largest window; needs R ≈ 48–64 at this scale and a length measure that does not stop at the first junction |
| **P1 painted coconut crab** | 6 visible | **6** | the model's painting is the cleanest subject; claw tips (two per claw) land in feet/other |

What works: tip detection itself (exact on 4 of 7 including the painted master). What is next, in order: (1) tip
thickness from the distance transform to split merged tips and to size the window per limb; (2) classification by
geometry from the template's rest landmarks (attachment side, direction band, protrusion length measured along the
limb, not by the first junction); (3) the positives battery: every named painter canvas via `speciesstrip.mjs` with
its template; (4) mutants from the crab label maps; (5) only then a verdict. Hidden pairs are declared by the record
(P1 verdict law 2) and never inferred here.

## Slice 5 — `thickness.mjs` (exact Euclidean distance transform; tip thickness), same night
Windows up to R = 64 and the DT behind each downward tip: civet now yields 5 down-tips (four feet + tail, thickness
13–35 on a body DT of 89); mud-crab yields 8 down-tips whose thicknesses 5–23 show the merged pairs at ~2.5× the
single-limb median; the painted P1 coconut crab yields 11 down-tips (six feet at 3.6–6.3, claw fingers and the eye
stalks at 8–23). Next: (1) split a tip whose thickness exceeds ~1.6× the subject's single-limb median into two limbs
when the template's expected count says so and report it as a finding otherwise; (2) classification by template
geometry; (3) the positives battery; (4) mutants.

## Slice 6 — same-toe merge and thinness classification, 2026-09-20 (Nick: "go ahead and fix the merge")
The doubled-tip defect Codex reproduced is fixed: two candidates are one tip when the straight path between them stays
inside the mask and never crosses anything thicker than 1.8× the thicker tip (`sameToeMax` 90 working px). Effect on
raw downward tips: painted vent crab 11 → 8 (exact), painted freshwater 9 → 7 (exact), painted coconut 7 thin tips → 6.
Classification is the open problem, and three rules were tried in this slice with the eleven-subject battery
(five painter crabs, the keyed Civet, five painted crabs with species-visible expectations 8/8/8/8/8/4/6/7/7/7/8):
- direction ("points down"): drops rear legs that point upward — wrong by construction;
- thinness alone (≤ 1.6× the thin reference): 2 of 11 exact; over-counts eye stalks, spines/hairs (painter vent crab: 36)
  and claw fingertips, which are thin;
- thinness + multi-radius + pincer-pair + eye-stalk rules: the pincer rule is either too loose (adjacent feet flagged,
  0 of 11) or too tight (nothing flagged, 1 of 11) depending on the divergence/palm tests.
Lesson recorded rather than tuned further by hand: the tip detector is sound; **class assignment needs the template
graph** (step 3 of the design) — which tip belongs to which limb chain, decided by walking each tip back to the body
along the distance-transform ridge and matching the attachment point and path thickness profile to the template's
rest proportions. Claw fingers then resolve as two tips on one chain whose path joins at the palm; eye stalks as tips
whose chain roots on the carapace top; spines as tips whose chain length is a fraction of a leg segment. The next
slice builds that walk-back and the per-subject debug overlay (`calibrate.mjs` gains class colours) so every
threshold change is judged against pictures, not counts alone.

## Slice 7 — `walkback.mjs` (ridge walk-back per tip), 2026-09-20
Greedy ascent on the distance transform from each tip into the body, recording path length, the thin run (samples with
DT < 1.6× thin) and the entry point (DT ≥ 3× thin). On the painted crab, walking feet enter after 41–247 steps with
thin runs of 18–72; the claw palms on the painted coconut show as tips of thickness 38–40 that enter after a short
thin run (7–17); its eye stalk is the one tip entering from above (y 16 → 52). These are the features step 3 matches
against the template's rest proportions; the matching itself is next.

## Slice 8 — `register.mjs` (IC-1 first cut: feet → template legs), 2026-09-20
Feet = thin tips whose ridge walk-back runs thin before entering the body; assigned per side by angular order about the
thick-core centroid; unmatched template legs reported as hidden candidates. Scored against Codex's hand-authored
landmarks: **painted coconut crab, far side: 3 of 3 feet within 8 px; painted vent crab: 6 of 8 feet coincide with the
hand landmarks (≤ 15 px)** with zero hand work. What fails, with the reason measured:
- the two rear legs whose tips rest against the carapace are not silhouette tips (the window is full of carapace);
  re-detecting on a limbs-only mask (thick core removed) explodes to 100+ false ends at every segment joint — not usable;
- the two claws: their finger pairs are thin tips, and the palm cannot be separated from the carapace by any thickness
  threshold (one blob from 3× to 7× thin), so "same palm" never fires;
- the near-side leg order is inverted once a tip is missing (order by rank cannot survive a gap).
Next (IC-1 second cut, the way the guide was meant to be used): estimate the guide → painting similarity transform
from the confidently matched feet (≥ 3 per side), predict every remaining guide landmark (claws, rear legs, eyes) through
it, then refine each prediction locally on the painting's ridge (nearest thin/thick structure within a radius scaled by
the transform). Hidden = a predicted landmark whose refinement finds no paint. Rank order is replaced by proximity to the
prediction, which survives gaps. Scored the same way, on all five painted crabs, before any writer is touched.

## Slice 9 — `guidefit.mjs` (guide → painting similarity from feet), 2026-09-20: measured and rejected
A global similarity fitted on foot correspondences has residuals of 180–200 px on both painted crabs: the painter
guide splays its legs straight while the painting folds them, so feet do not relate to the guide by any rigid or
similar transform, and every landmark predicted through it is 200–400 px off. Keep the least-squares similarity
(`fitSimilarity`) and the gap-tolerant assignment; change the ANCHOR. Next cut, root-anchored: fit the transform on the
carapace (thick-core box/centroid ↔ guide carapace box), which is what the painting does preserve; predict only the
body-attached joints through it (leg roots, claw bases, eye roots); assign each found foot to the leg whose predicted
root is nearest in angle about the centre; place knees along the foot→root ridge path at the guide's segment ratio;
grow claws outward from the predicted base along the ridge into the thick palm and its two thin finger tips; grow rear
legs outward from their predicted roots until the thin path ends (this finds the tips that rest against the carapace).
Hidden = a root whose outward growth finds no thin path. Every step is a local search from a predicted anchor, never a
global pose assumption.

## Slice 10 — `rootfit.mjs` (root-anchored: carapace transform + outward ridge walks), 2026-09-20: measured, not enough
Results against the hand landmarks: roots median 167–212 px, feet median 336–349 px (with a few exact hits: vent
leg3Far 5 px, claw dactyl tip 14 px, coconut eye tip 16 px), claws and eyes 190–320 px. Two measured causes:
(1) no thickness threshold isolates the carapace on these paintings — the claw palms are as thick as the body, so the
"core box" spans 750–870 px of a 1254 px canvas at every fraction of the maximum thickness; (2) even the guide's own
carapace box does not map the roots: the painter guide draws roots on the carapace's side edge while the painting shows
them at their visible emergence under a perspective the guide does not have. So the guide gives **counts, order and
rough directions**, not geometry, and box/similarity anchoring of any kind is the wrong primitive.
Conclusion for IC-1 (recorded, not tuned further): the compiler must build the painting's OWN structure first — the
ridge graph (medial axis with radii, junctions clustered, branches with length/thickness/attachment) — and match that
graph to the template graph topologically (leg chains = long thin branches attached to the body in order along each
side; claws = thick branches ending in a pincer pair; eyes = short thin branches from the carapace top), using the
guide only to break ties. Codex's mask authoring already works this way by hand; IC-1 automates that reading. What
exists and is sound for it: keying, downscale, distance transform, multi-scale tip detection with same-toe merge,
per-tip walk-back, the eleven-subject battery and Codex's hand landmarks as the score. Nothing here is a gate.
