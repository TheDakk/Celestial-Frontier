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
