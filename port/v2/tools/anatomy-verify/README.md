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
