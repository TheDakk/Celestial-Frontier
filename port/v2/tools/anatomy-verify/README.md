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

## Slice 11 — `ridge.mjs` + `chains.mjs` (the painting's ridge graph and limb chains), 2026-09-20 evening
The graph is read from the thinned working mask (the DT local-maximum ridge was far too noisy: 173 endpoints).
Lessons that cost an hour each, recorded so nobody repeats them: (1) node detection must use the crossing number
(background→skeleton transitions around the pixel), never the raw 8-neighbour count, or every diagonal staircase is a
junction; (2) the edge walker needs a visited set and a 4-neighbour preference or it stops at staircase corners;
(3) spur pruning must judge a spur against the junction it hangs from, fixed ONCE on the original skeleton (after a
sibling is removed the junction stops looking like one and the walk runs through it into the trunk — that is how
whole legs and both claws vanished); (4) the spur rule is the disc rule — an artefact is a spur whose tip never leaves
its junction's own disc — not "shorter than k× thickness", which eats claws (their base is the thick palm);
(5) walks must stop when ADJACENT to a junction pixel, since 8-connectivity lets them bypass it diagonally.
State on the painted vent crab: both claws present, 5 of 8 feet within 25 px of Codex's hand landmarks straight from
chain endpoints (7, 8, 6, 9, 10 px), one leg still cut into a second component; painted coconut: legs on one side
still merged at the trunk, 2 of 8 within 25 px. Next: find the remaining cut (pass/floor interaction), then the
template match over chains (side, order along the body, claws = forked thick chains, eyes = short knob chains).

## Slice 12 — terminal-branch classification, five painted crabs, 2026-09-20 night
Skeleton is one component on every painted crab (spur walks stop at missed forks). Classifying each chain by its
terminal branch (last edge) — long and thin = foot, long and thick = claw finger — on the five painted crabs against
Codex's hand landmarks (hit = chain endpoint within 25 px of the hand foot): see the run printed in the commit body.
What remains: (a) the thin reference is still contaminated by claw fingers on the coconut and mud crabs (their fingers
are as thick as some legs' terminal segments) — use the template's expected counts to pick the k thinnest long chains
per side instead of a global threshold; (b) rear legs whose tips rest against the carapace have no endpoint — they are
"loop limbs", thin edges between two body-adjacent junctions, and their foot is the edge point farthest from the body;
(c) eyes: short knob chains from the carapace top, not yet emitted by the graph because the eye stalk merges with the
carapace loop. All three are graph queries, not new thresholds.

## Slice 13 — `assign.mjs` (candidates → named template legs), 2026-09-20 late night
Three candidate kinds now feed naming: terminal-branch endpoints, loop limbs, and **touching limbs** — a rear leg whose
tip rests against the carapace forms a thin junction at the far end of a long edge from the body; on the painted vent
crab both rear feet appear this way within 10–23 px of the hand landmarks. Naming by order from the rear with gaps at
the claw end. Score on the five painted crabs: positions within 25 px 17 of 40 (the earlier chain-only run reached
19 of 35 before per-side count filtering), named within 25 px 11 of 28. Two measured defects to fix next, both in
the per-side selection, not in the graph: (1) `thinSpread × thinnest` drops legs when one terminal branch is unusually
thin (freshwater: 4 feet kept of 7 found); select by expected count with a tolerance band around the median instead;
(2) claw-finger candidates still enter the thin cluster on the mud crab. The naming rule (gaps at the claw end) is
right for all five paintings and should stay until a counter-example appears. Every number above is reproducible with
the runner in the commit body; nothing here is a gate.

## Slice 14 — selection and naming, 2026-09-20 late (recorded state)
Selection: median-band per side + shared-root claw pairs; touching limbs restricted to true limb ends (no non-body
edge continues farther from the body). Five painted crabs: visible foot positions within 25 px **16 of 35**; named
legs within 25 px 5–11 of 31 across the naming variants tried; hidden set exact on 1 of 5.
Naming is the open half and the reason is measured, not guessed: chains root at one of only ~4 body nodes, so
"attachment order" collapsed to identical angles. The attachment that orders legs is the point where each chain's
path first leaves the thick region (first path pixel with DT < bodyDt), which must be computed from the edge paths,
not from the chain's root node. That is the next change; positions and candidate kinds stay as they are.
Addendum (same night): attachment as the path's exit from the thick region also collapses — on the painted crab three
Near legs exit at the same pixel (897,604) because their chains share the trunk edges through one junction cluster
beside the body. The ordering primitive must therefore be the point where a chain SEPARATES from every other chain
(its last shared node), projected onto the body outline; and the body itself should be the largest thick component
at a higher fraction of the maximum thickness so upper leg segments are not "body". Positions stand at 16 of 35;
naming stays open. Stop for the night here; nothing in this folder is a gate.

## Slice 15 — generic classes on the graph (spine / fork / leg), 2026-09-21 early
Selection now uses only family-free rules: spine = terminal branch < 30 px; fork = two long candidates with tips within
~85 master px whose separation points nearly coincide; leg = the rest, sided by the SEPARATION point (tips of forward
limbs cross the midline), ordered by separation angle; touching tips fill missing rear slots only. Two units bugs found
and fixed (thresholds written in master px but compared at working scale; the touching rule rejecting tips that rest
on another leg). Five painted crabs: **visible foot positions within 25 px 21 of 35** (best so far; crab 6/7,
freshwater 5/7), named 8–12 of 30 depending on the variant, hidden sets exact on 0–2 of 5. Naming still degrades
whenever one candidate is wrong, because slot filling is greedy by order. The next step is P5 proper: a small
assignment problem per side (candidates × template slots, cost = order consistency + thinness + length ratio + a
hidden prior at the claw end), solved exactly (≤ 8 candidates × 4 slots), instead of greedy rules. Everything above
is reproducible with the runner in the commit body; nothing here is a gate.

## Slice 16 — exact per-side assignment + thick-terminal forks, 2026-09-21 early
P5 first cut: candidates per side (endpoint chains, loop limbs, touching tips) assigned to template slots by an exact
enumeration under a hard monotone-order constraint with a family-free cost (thinness, length, kind, an empty-slot cost
cheap at the claw end, an unused-candidate cost). A finger whose twin merged into a stub is caught by the
thick-terminal rule. Five painted crabs: named feet within 25 px **14 of 31**, positions 20 of 35, hidden sets exact
1 of 5; the vent crab's rear feet come from touching tips at 10 and 23 px. The dominant remaining error is FALSE
touching-tip candidates (junctions along legs that pass the thin test) filling slots ahead of true legs; the fix is
to score a touching tip by whether the arriving edge's own terminal segment is thin all the way to the junction
(DT profile monotone decreasing), which a mid-leg junction fails. That is the next change. Not a gate.
Addendum: the DT-profile test for touching tips trades recall for precision — named feet 13 of 25 assigned (52 %),
positions 20 of 35, but slots that were correctly filled from touching tips on the freshwater crab are now empty.
Both variants are retained in git; the profile test stays on (a wrong foot in a rig is worse than an empty slot that
the hidden-inference step fills by the template rule). Next: the Civet through the identical code as the second
family, before any further crab tuning — the program's rule.

## Slice 17 — the Civet through the identical code (second family), 2026-09-21 early
`assign.mjs` now takes a template descriptor (`TEMPLATES`: legs per side and slot naming; crab 4×leg0..3+Foot,
quadruped 2×hind/fore+Paw) and nothing else changes between families. First Civet run (keyed opaque master, truth =
the sentinel record's paws): only 2 candidates, both on the "Near" side, best paw error 26 px, the rest wrong. Three
genericity gaps exposed, exactly what the second family was for:
1. **Side is a template property, not x.** Crabs are painted front-on, so Far/Near split by x about the centre;
   quadrupeds are painted side-on, so Far/Near is depth: far legs sit higher and behind, near legs lower and in front.
   The descriptor needs `view: 'front' | 'side'` and the side rule follows it (side view: split by the attachment's y
   and occlusion order).
2. **Thresholds must be in body units.** The candidate rule "terminal ≥ 3× its thickness" and the 30 px spine floor
   are working-pixel constants tuned on thin crab legs; a civet's lower leg is thick and its paw short, so real legs
   are rejected. Express every length as a ratio of the template's rest limb length mapped through the body size.
3. **Body centre must be the template's body axis**, not the thick-region centroid: on the Civet the thick region
   includes the head and the centroid lands at the neck, so every angle is skewed. Use the midpoint of the two thickest
   ridge nodes along the longest thick edge (the spine) as the body axis.
These are the next three changes; each is scored on the five crabs and the Civet together.

## Slice 18 — the compiler made template-driven: graph fixes, body units, view, spine axis, appendage slots, IC-4 first run, 2026-09-21
Runner is now committed (`score.mjs`: five painted crabs + the Civet against the record landmarks, comparison only;
`ic4.mjs`: verdict + the three mutants; `template-rest.mjs`: the descriptor). Baseline reproduced by the runner at
session start: crabs positions 22/35, named 13/25; Civet 0/4 (pool 2). Every rule below was measured on all six.
**Two graph bugs found first, both hiding legs on every subject:** (1) `ridge.mjs` emitted many edges TWICE (de-dup key
was the node-side pixel pair, which differs when a walk enters a junction cluster through another member) — the
duplicates made every Near leg of the Civet a non-terminal; (2) the chain DFS in `chains.mjs` enumerated all simple
paths and went exponential (OOM) the moment the true connectivity appeared; replaced by a multi-source shortest-path
tree from the body nodes (one chain per endpoint, the shortest trunk — what the old de-dup already selected). Effect
alone: crabs positions 22 → 28/35, named 13/25 → 15/29.
**Template descriptor (`template-rest.mjs`):** slots from the family CONTRACT (`familyContactChains`: stations ×
sides), painting conventions of the master format (`view` front/side, `facing`), and REST RATIOS measured once on a
declared reference (brachyuran: the painter crab, `crab-masks-05`; quadruped: the Civet proof fixture — the one
recorded circularity: the Civet's rest ratios come from its own record; scalars only; the next quadruped is the real
test) — body radius R = max DT; leg length 2.90 R (crab) / 1.70 R (civet); terminal thickness 0.036 / 0.087 R; mid
thickness 0.057 / 0.139 R; interior-joint fractions per slot; non-leg appendage classes from the contract graph
(chain: tail 3.07 R; fork: claws 3.84 R; knob: eyes/ears) with attachment joint. Every working-pixel constant in
`assign.mjs` became a ratio (min limb 0.15 × leg, loop/touch edge ≥ 0.30 × leg, end radius ≤ 1.5 × mid thickness,
fork tips ≤ 0.20 × leg with separations ≤ 0.09 × leg): **neutral on the crabs, and it is what admits the Civet's
thick-pawed legs** (endDt 14–16 vs the old constant 6).
Rules tried, with numbers (crabs named / positions unless stated; `ASSIGN_OPTS` reproduces each):
- body/limb split as √(rest proximal thickness) × R (P3 note): crabs named 15 → 11 — the painter reference's legs are
  thinner relative to the body than the painted tier's; length-weighted Otsu on log ridge thickness: 13/33. **0.45 R
  stays** (0.40: 26/37, 0.50: 25/38 — a plateau).
- body axis from the spine ridge: the body edge maximising length × MEAN thickness picked the Civet's neck→head edge
  (axis vertical); **length × MIN thickness** picks the chest→hip spine on the Civet and the carapace ridge on all
  five crabs (centres within 60–80 px of the record roots). Cost on crabs vs the centroid: −1 named (vent).
- rest-angle prior per slot from the reference (weight 0.5/1/2): 15/33, 15/33, 11/19 — the painter draws leg roots in
  a 25° fan, the paintings spread them over 120°+; **rejected**, order stays ordinal. Per-slot rest LENGTH prior
  (0.5/1/2): 14/32, 10/29, 7/23 — **rejected** (2.7–3.15 R nearly uniform, painted legs foreshortened).
- touching tips: the slice-16 DT-profile test and a new "interior" test (the junction lies on another candidate's
  chain) both delete the vent crab's true rear feet (23/55 px); the test that works is **rest-against-body**: another
  edge at the junction is body-thick and the junction is at least leg-thin (crossings of two legs and hairs fail).
  crabs named 15/29 → 23/32. Interior test on top: 14/39 (deletes true tips whose limb continues as a short spur).
- loop limbs generalized: both ends within 0.75 R of the thick region (not both body nodes), foot = the path point
  farthest from the thick region (a leg folded over the carapace is nearer the centre at its tip); limb length from
  the thick-region EXIT (not the separation node — a two-toed paw separates at the ankle); cost = thinness (0.4) +
  |ln(len / rest leg)| (0.5) + kind, unused cost 1.0 for endpoints / 0.5 for loop-touch: together 23/32 → 25/34.
- tuft collapse (a junction whose every branch is short is the limb's tip: tail tufts, toe clusters) + candidates
  within 0.25 R merged + forks only between endpoint candidates + side-view station pairs need not be consecutive:
  the Civet goes from "tail assigned as hindNear" to **all four paws and the tail in the right slots** (errors 20–60
  px at 25 px tolerance: the record's paw is the toe, the skeleton ends in the pad; `refine:'tip'` (push out one end
  radius along the terminal edge) gains 1 named; `refine:'far'` (farthest pixel from the separation) does not).
- thick-terminal finger rule off: 21/44 and positives 2/6 — **stays on**.
**State (tolerance 25 px master):** crabs positions **30/35**, named **24/34** (coconut 4/6, crab 5/6, freshwater
5/7, mud 6/7, vent 4/8); Civet 1/5 named, 0/4 positions — at 60 px: positions 37/39, named 29/39, Civet 4/4 + tail.
Knees at the reference's joint fractions along the ridge path from the exit: 7–110 px (median ≈ 40). Hidden slots
extrapolated one station along the side (or the twin mirrored): 165–735 px from Codex's placements — Codex places
hidden legs BEHIND THE CLAW, not along the sequence; the record rule must be read from Codex's writer before this is
tuned. Nothing here is a gate.
**IC-4 first run (`ic4.mjs`; verdict = every declared-visible slot filled, every declared-hidden slot empty, no
unused endpoint candidate; mutants from Codex's label maps: erase one visible leg, duplicate it 15 % of the width
away, compile under the other family's template):** positives ADMIT 4/6 (the crab refuses — its leg3Far terminal is
claw-thick and the thick-finger rule takes it; the Civet refuses on one unused endpoint), wrong-template REFUSE 6/6,
erased REFUSE 5/10, duplicated REFUSE 6/10. The absorbed mutants are the measured defect to fix next: an erased leg's
slot is refilled by a weak (loop/touch) candidate or the gap slides to the claw end, so the count check never fires.
Next, in order: (1) verdict on EVIDENCE per slot — a slot filled by a loop/touch candidate needs a declared-hidden
neighbour or a resting-junction proof; refuse when the number of endpoint legs + resting tips ≠ declared visible
count; (2) hidden placement by Codex's record rule (read it from the writer); (3) P7 labels by geodesic nearest
chain (not started); (4) re-run IC-4; (5) the second quadruped (the one painted-quadruped exception in PROGRAM §6).

## Slice 19 — IC-4 mutant diagnosis and P7 labels first cut, 2026-09-21 (same session, after the push of slice 18)
**Why erased legs are admitted (measured, `node ic4.mjs` now prints per-side candidate kinds and counts):** the
mutation is correct (the freshwater erase of `leg0far-*` removes 19,083 px — the leg folded over the carapace top);
the compiler's Far endpoint count does not change (e2/t1 before and after) because the slot was ALREADY filled by a
false touching tip in the positive (195 px off) while the true folded leg had no candidate. So the absorbed mutants
are the naming false positives seen in score.mjs, not a verdict bug; a verdict cannot be sharper than the pool.
The independent tip detector (`classifyTips` thin-tip count) as a second count check: 10/7 on the freshwater
positive, 9/8 vent, and erasing a mud leg RAISES it 7 → 10 (the erase edge spawns tips) — **not usable as a count
check; recorded.** The mud crab admits every mutant because its Far side already runs on loops (e2/l3 vs 3).
Precision-first consequence for the verdict: a slot filled by a loop/touch candidate is weak evidence, but the vent
crab's true rear feet ARE loop/touch candidates, so the evidence rule must come from the candidate features, which
slice 18 could not separate (rest-against-body is the best test found). Open.
**P7 labels (`labels.mjs`), first cut:** every mask pixel goes to the part whose ridge path is geodesically nearest
(multi-source chamfer Dijkstra inside the mask; 130–200 ms per crab at the 512 px working scale). Seeds: body = the
body's own ridge pixels (thick edges not on a claw chain — seeding the whole thick REGION gave the claw arm/palm to
the body because it is as thick as the carapace: claws 0.17–0.36 IoU → 0.29–0.50 with ridge seeds), claws = full
chain ridge from the body root, legs = ridge from the thick-region exit to the tip, split upper/lower at the slot's
first joint fraction; loop/touch legs now carry a path too. Against Codex's `labels.png` (IoU per part, working
grid): body 0.35–0.48, claws 0.29–0.50 (freshwater near claw 0.01: it was never a candidate), legs 0.6–0.8 for
correctly named lower segments, 0.3–0.6 upper, 0 wherever the name is wrong — labels inherit naming exactly.
Visible defects on the overlay: upper leg segments cut wedges out of the carapace rim (the rim is nearer a leg
ridge than the carapace ridge); the near claw's arm still goes to the body where the claw chain starts at the palm.
Next for P7: seed the body with its outline ring (P3's "body outline = boundary ring of the thick component"), so a
rim pixel is body unless it lies on a limb's own thin cross-section (DT ≤ limb thickness at that path point).
Nothing here is a gate; naming remains the bottleneck for both the verdict and the labels.
Addendum (same session) — rules measured on the naming bottleneck, all kept OFF by default:
- weak-candidate table (every loop/touch candidate vs the nearest visible foot): loops are 1 true (freshwater 38 px;
  the vent's true rear leg0Near sits at 55 px) against 12 false, with no separating feature (len 26–74, tip body
  distance 0.44–1.02 R on both sides); loops OFF: named 25/39 → 22/37 (the crab and mud crab lose the loop that
  holds their Far order) — kept ON. Touch: true tips have their junction ≤ 1.12 R from the thick region, false ones
  1.37–2.8 R (a junction on another leg's thick base); `touchBodyDistMax` 1.2 R: vent 4/8 → 5/7 but freshwater
  5/7 → 3/6 — the false tip was holding the rear slot, and without it the empty slot slides to the claw end and every
  name shifts by one. **The real defect is the empty-slot prior, not the candidate.**
- even-spacing angular prior (slots evenly spaced from the body-top normal to the side's claw separation, anchors from
  the painting itself, so no reference geometry): 0.3 neutral (25/39), 0.6 → 12/37, 1.0 → 8/31. The legs occupy only
  the forward half of the top→claw span (crab Far separations 2.7–3.4 rad in a 1.6–3.4 span), so the prior pushes
  every name forward. Rejected. (A sign bug in the top normal was found and fixed on the way.)
- P7 leg seeds offset 0.15/0.3/0.5 R out of the thick region: body IoU unchanged (0.35–0.48); the body ceiling is the
  near claw's thick ARM, which is thick-region "body" and seeds as body ridge (visible on the overlay). A claw's arm
  must be cut from the body at the wrist (a DT valley along the thick ridge), which is a P3 question.
- gap-consistency cost (pitch = median angular gap between consecutive candidates; an assignment pays for gaps that
  are not whole multiples of the pitch and for an empty front slot when the last candidate separates within one
  pitch of the claw): 0.3 → 21/37, 0.6 → 20/37, 1.0 → 20/37 (vent +1, mud −4: its Far side runs on loops, so the
  pitch is noise). Rejected; `gapWeight` stays 0.
**Design finding after these rounds (for Nick and the program, not a tuning note):** the legs that no rule can name
correctly — freshwater and crab `leg0Far`, folded flat over the carapace top — have NO candidate of any kind: a limb
painted over the body lies inside the silhouette, so an alpha-only ridge graph cannot see it, and no empty-slot prior
can replace an absent candidate. The compiler needs an INTERIOR-EDGE stage for limbs over the body (colour/edge
evidence inside the mask — the P0 key already yields RGBA; Codex's label maps show these legs as painted regions
with a visible contour). Until then, precision-first: a folded leg is an empty slot, and IC-4's erased-leg mutant
on such a leg is undetectable by construction (the erase removes pixels the graph never saw).
Interior-edge probe (same session, scratch only, not committed as code): a box-filtered luminance Sobel inside the
working mask on the freshwater and crab masters. The folded leg's contour over the carapace IS present as a strong
continuous line (the leg-segment boundaries read as the strongest interior edges), but at a plain magnitude threshold
the painted texture fires everywhere; an interior-edge stage would need a threshold set from the texture level,
hysteresis and long-contour tracking, then the same ridge/graph treatment on the contour-bounded region. Design
item for the program; the alpha-only compiler stays precision-first until it exists.

## Slice 20 — Codex's hidden rule adopted; claw wrist probe, 2026-09-21
Codex's read-only note (`openai-mac/audits/VISION_P1_CONSOLIDATED_20260920/HIDDEN_PLACEMENT_RULE.md`, its commit
`78dc7dc3`) states the record rule exactly (`hidden-anatomy.mjs#inferHiddenLandmarks`, not yet merged into this
lane): root₃ = 2·root₂ − root₁; knee/foot = pair 2's vectors reflected about the contract body-axis line through
the new root; it reproduces all 15 hidden landmarks at 0 px from the SAME hand roots. `assign.mjs` now implements
the same formula generalized to "a declared-hidden station from the two preceding stations of its side" (identical
on crabs; no leg names). Two facts needed to make it work in the compiler: (1) the contract's body axis in the
painting is view-dependent — front view → the spine ridge's top normal (root→carapace is the painting's vertical),
side view → the spine ridge itself; with the spine direction itself the errors were 581–1070 px; (2) the inputs are
the compiler's roots (thick-region exits), not the hand roots, so the residual measures root estimation:
hidden-foot errors crab 108, freshwater 112, mud 391, coconut 709/460 px (the coconut's pair 2 is misnamed at
416/399 px, and the reflection inherits it). Hidden SETS are exact on 5 of 6 subjects (the crab: leg3Far found by
the thick-terminal rule as a claw finger).
Claw wrist probe (P3, scratch): the DT profile along every claw chain from its root has its valley AT the root
(index 0, root DT ≈ palm DT, 0.37–0.85 R) — the chain begins where the thick arm ends, so the wrist lies on the
BODY ridge, between the claw root node and the spine. Next P3 step, implementable: shortest path through body edges
from each claw root to the spine edge; wrist = the DT minimum along it; body seeds exclude the body ridge beyond the
wrist and the claw seeds include it (P7 body 0.35–0.48 IoU is capped by exactly this arm).
Addendum — wrist cut implemented (`wristCut`, on by default): for each forked appendage, the shortest body-edge walk
from its chain root to the spine edge; wrist = the DT minimum along it; the walk's pixels before the wrist leave the
body ridge and join the appendage's ridge. Label IoU (P7): claws coconut 0.48/0.49 → 0.61/0.48, crab 0.39/0.37 →
0.39/0.58, mud 0.41/0.35 → 0.55/0.35, vent 0.50/0.40 → 0.50/0.59; body +0.02–0.04 on every crab (0.37–0.50).
The DT minimum lands at the record's ELBOW, not its base (crab near 48 px, freshwater near 45, vent near 9, coconut
far 73 px): the arm is two thick lobes (base→elbow, elbow→palm) and the valley between them is the elbow. The base
needs the next valley toward the spine — a second cut, same walk. Naming and positions unchanged (30/39, 25/39).
Addendum — verdict evidence and the second cut: (1) `ic4.mjs` strict verdict (a LOOP-filled slot does not count as
found; endpoint or resting tip only): positives 4/6 → 3/6 (the mud crab's Far side runs on loops), erased mutants
REFUSE 5/10 → 7/10, duplicated 6/10 → 8/10, wrong-template 6/6. Precision-first, so strict is the default
(`IC4_STRICT=0` restores the lenient count). (2) `wristCuts` 2 (base = the second DT valley toward the spine, on a
±3 px smoothed profile): claws crab near 0.58 → 0.66, mud far 0.55 → 0.58, coconut far 0.55 → 0.61; body +0.01–0.03;
the elbow valley is 46–131 px from the record's elbow, the "base" valley still 72–200 px from the record's base
(the arm has more than two lobes on these paintings). Default 2.
(3) P7 body-outline seeds (`outlineBand`, boundary pixels near the thick region whose neighbourhood DT exceeds a
limb cross-section): no effect at any band 0.3–1.0 R — the test never fires at a boundary pixel (DT ≈ 1 there);
kept as an option at 0, the outline needs the DT of the nearest RIDGE, not of the pixel. Not pursued further now.

## Slice 21 — interior-edge stage built and measured; the "no candidate" finding CORRECTED, 2026-09-21
**Correction of slice 19's design finding.** The freshwater folded leg DOES have a main-graph candidate at its tip
(`end 136,439`, 1 px from the record): it is misclassified as a claw finger by the thick-terminal rule because its
terminal ridge merges with the carapace outline (termDt 15 vs the leg's own 8). The crab's folded leg is a loop
candidate at 68 px. So an alpha-only graph does see these limbs; what it gets wrong is their RIDGE THICKNESS and
therefore their class. Nick's decision item in the ROADMAP is withdrawn.
**Interior-edge stage (`interiorEdges`, `edgeBlur`, `edgeMinLen`, `interiorTipMax`; all off by default):** working-
scale luminance, box blur at `edgeBlur` × rest leg thickness × R, Sobel, strong = ≥ `interiorEdges` × the mask's
median magnitude, connected runs ≥ `edgeMinLen` × leg length are cut from the working mask; a second ridge graph on
the cut mask supplies extra `interior` candidates (kind treated as an endpoint) — the main graph is untouched.
- global cut (first form): at threshold 2, blur 1 the freshwater folded leg is found at **8 px**, but the body
  fragments (named 5/43); at ≥ 6 nothing is cut (0 px) — raw Sobel cannot separate limb contour from paint texture.
- second pass, candidate-only: thr 2–3 × blur 1 × tip-inside 0.1–2.0 R: at best 25/39 (= unchanged), typically
  18–23 (false interior candidates); the folded leg is rejected by the dedupe/upgrade gate because the main graph
  already has that tip.
- upgrade rules (replace a spine-short or thicker main candidate at the same tip by the cleaner interior chain):
  freshwater `leg0Far` **8 px**, but the far side then over-fills (false touch 88 px and a false endpoint 239 px take
  the freed slots, the hidden set breaks) and the vent crab collapses (0/8): 15–19/43. Rejected as default.
- the same gain without any edge stage: `thickMaxLen` (a thick single terminal is a finger only when finger-short,
  ≤ f × rest leg): f = 0.3/0.5/0.7/1.0 → 21/44, 20/43, 24/41, 25/40 with the freshwater leg at 8 px for f ≤ 0.7 —
  and the same over-fill on that side. Default off.
**Where this leaves the bottleneck, precisely:** on the freshwater far side the true legs are all in the pool; the
naming fails because two FALSE candidates (a touching tip at 88 px, an endpoint at 239 px) are cheaper to place than
to leave unused (unused cost 1.0 for endpoints, 0.5 for resting tips) and the empty-slot prior only makes the claw
end cheap. The next change is the unused/empty economics: an empty slot must be as cheap as leaving a weak candidate
unused, and a candidate's placement cost must include how well its terminal thickness matches the side's other legs
(the false endpoint at 239 px is claw-thick). Nothing here is a gate.
Addendum — naming economics grid (thinness weight 0.4/0.8/1.2 × empty-slot scale 1.0/0.5 × unused-endpoint cost
1.0/0.6, with and without `thickMaxLen` 0.7): the current defaults (0.4 / 1.0 / 1.0, finger bound off) are the best
cell at 25/39; every other cell is 13–24. The cost model is at a local optimum on these six subjects; further gains
need candidate precision (a family-free test that separates the freshwater far side's two false candidates from its
legs), not weights. Recorded; defaults unchanged.
Addendum — contact terminals (`contactRefine`, default on): a slot whose contract chain has a terminal joint beyond
its end (quadruped Paw) is a GROUND CONTACT, so its landmark is the lowest mask pixel of the tip blob (within 2.5
end radii of the skeleton end), family-free through the contract. Civet paws 55/30/49/20 → 18/31/24/21 px, named
1/5 → 3/5; crabs unchanged (no contact terminals). Total named 25/39 → 27/39.
IC-4 state after slice 21 (strict verdict, contact refine, appendage-slot candidates counted as used): positives
ADMIT 4/6 (crab: `leg3Far` taken as a claw finger; mud: Far side on loops), wrong-template REFUSE 6/6, erased 7/10,
duplicated 8/10. The Civet is ADMIT with tail + four paws.
`thickNeedsFork` (a lone thick terminal is a finger only when it separates beside a real fork): erased mutants
REFUSE 10/10 and duplicated 9/10, but naming 27/39 → 23/44 and positives 4/6 → 2/6. Rejected as default (kept as
an option): the verdict must not be bought with names.
**Review sheet (`sheet.mjs`, PROGRAM §5 "a person looks only at the sheet"):** `node sheet.mjs [outDir] [subject…]`
renders one PNG per subject (labels as part colours, body/leg/claw ridges, every candidate ring by kind, assigned
slots as yellow squares with F/N side + station letters, knees/ankles, inferred hidden as yellow rings, wrists, the
spine axis, and the record's landmarks as blue rings for comparison only) plus `sheet-summary.json` with the legend
and per-subject scores. First sheet: `audits/INTAKE_COMPILER_20260921/sheet-01/` (six subjects at the current
defaults: crabs 30/35 positions, 24/34 named; Civet 3/5 named, tail + four paws in slot).

## Slice 22 — separation-point touching tips + finger-length bound as defaults, 2026-09-21
The freshwater far side's false touching tip (74,625, 88 px) is exactly the SEPARATION point of the true leg1Far
chain — the junction where that leg parts from its neighbour, not a tip resting on the body. `touchNotSep` drops a
touching tip within 0.1 R of any endpoint candidate's separation point (narrower than the "interior" test that
deleted the vent crab's true tips): vent 4/8 → 5/7, duplicated mutants REFUSE 10/10, erased 9/10 — but freshwater
5/7 → 3/6 because its true rear leg (136,439) is still a "claw finger" and the empty slot slides. Both together —
`touchNotSep` + `thickMaxLen` 0.7 (a lone thick terminal is a finger only when finger-short) — give the best
naming so far: **29/39** (coconut 4/7, crab 5/6, freshwater 6/7, mud 6/7, vent 5/7, Civet 3/5); positions 30/39
unchanged; hidden sets exact 3/6. Now the defaults. IC-4 with them: strict verdict positives 2/6 (freshwater,
Civet; the crab and mud crab carry a TRUE loop-filled `leg0Far` at 68/10 px that strict evidence refuses; the
coconut fills its declared-hidden `leg3Near` with a thick terminal now allowed as a leg; the vent leaves `leg3Near`
empty after the false tip went), wrong-template 6/6, erased 7/10, duplicated 9/10; lenient (`IC4_STRICT=0`):
positives 3/6, erased 6/10, duplicated 7/10. Sheet regenerated at the new defaults (`sheet-01`).
Where it stands: naming and the verdict now pull against each other on the loop-filled rear legs — a true loop
(crab 68 px, mud 10 px) is indistinguishable from the twelve false loops by any feature measured so far. The next
lever is the loop candidate itself: replace "far point of a thin edge between two near-body nodes" with the same
thin-terminal test the endpoints pass (a loop limb has a thin cross-section over ≥ 0.3 × leg length of its edge),
so a true rear leg becomes strong evidence and the false loops (short thick bridges) drop.
Addendum — loop thin-cross-section test (`loopThinFrac`: ≥ f of the loop edge's pixels leg-thin): 0.3 no change,
0.5/0.7 → 25/38 (drops the crab's TRUE loop). Measured why: the three true loops (crab 68 px, freshwater 38, vent
55) have ridge thickness 21–24 — a leg folded against the carapace shares its outline, so its ridge reads as thick —
and the ten false loops span 11–32; length 42–74 vs 26–69. No feature measured on this set separates them.
Rejected; kept as an option at 0. **Conclusion of the tuning rounds:** on six subjects the compiler is at the
limit of per-rule tuning (29/39 named, positions 30/39); the next real step is more subjects through the same
code — the second painted quadruped (PROGRAM §6's one exception) — so a rule is judged on two families, not one.

## Slice 23 — the second quadruped (Codex's Wolf) through the identical code, 2026-09-21
Codex painted the Wolf under PROGRAM §6's one exception (`openai-mac/audits/VISION_P1_QUADRUPED_20260921/
generation-01/`, declaration `hidden: []`, no hand landmarks by design). It is a declaration-only subject in
`score.mjs` (no positions/names to score), judged by `ic4.mjs` (verdict against the declaration + the
wrong-template mutant) and `sheet.mjs`. First run: all four paws in the right stations and depths (hind pair on one
hip separation, fore pair on the other), wrong-template REFUSE; positive REFUSE on one unused endpoint — the tail.
The Wolf's tail is bushy: its ridge is body-thick all the way to the tuft, so the tail's endpoint chain is only the
tuft (48 px) and the tail slot's length cost rejected it. Generic fix: an appendage's length counts the BODY-edge
run from the spine to the chain's root (Dijkstra over body edges) plus the chain — a bushy tail is a thick run and a
thin tip, a thin tail is all chain. With it: Wolf ADMIT (tail + four paws), Civet ADMIT unchanged, crabs unchanged
(29/39). A chest-fur tuft (735,717, thick, finger-short) is classed as a fork finger and, being a claw, does not
count as unused — a recorded quirk, not a rule.
**Nick's decision (2026-09-21): the IC-4 verdict is STRICT** (a loop-filled slot is not evidence). IC-4 with the
seven subjects: positives ADMIT 3/7 (freshwater, Civet, Wolf), wrong-template REFUSE 7/7, erased 7/10, duplicated
9/10. What the two families showed together: the side-view station assignment, the contact-terminal refinement and
the appendage slots held on a second quadruped with no change; the one change (tail length through the body run)
was forced by the Wolf and left every other subject byte-identical in score. Sheet regenerated (`sheet-01/wolf.png`).

## Slice 24 — declared-hidden slots pre-emptied; ordering primitive measured again, 2026-09-21
`declaredHidden` is now an input to `assignLegs` (score/ic4 pass the record's or presence file's declaration): a
declared-hidden slot takes no candidate and costs nothing (front view: skipped in the enumeration; side view: the
lone-leg case is forced to the other depth). Hidden sets are exact by construction; the coconut's declared-hidden
`leg3Near` no longer fills — its would-be candidate is now an UNUSED endpoint and the strict verdict refuses on
that instead (correct: a strong leg-like endpoint on a declared-hidden leg means the declaration or the candidate is
wrong). Named 29/38 (the denominator drops with the slot), positions 30/39, IC-4 unchanged 3/7 · 7/7 · 7/10 · 9/10.
Ordering: on both remaining near-side errors the separation angle mis-orders legs whose chain shares its trunk with
the claw (vent `leg3Near` separates at 18.8° with its foot at 74°; coconut `leg2Near` at 24.5° before `leg1Near`
at 37.7°), and the foot's own angle orders both correctly — but `orderBy:'tip'` scores 28/38 (vent 5/7 → 4/7,
a far-side loss) with no IC-4 change. Rejected as default; both primitives are recorded. The right primitive is
probably the ROOT along the body outline (neither the separation nor the tip), which the compiler does not yet
estimate independently of the chain — a P6 item.

## Slice 25 — ordering primitives measured side by side, 2026-09-21
Four ordering points for the front-view per-side order, all as options in `assign.mjs` (`orderBy`, `rootMode`):
- `sep` (separation node, slice 15; default): named 29/38.
- `tip` (the foot's own angle): 28/38 — orders both failing NEAR sides correctly (vent 21°/40°/74°, coconut
  28°/49°/63°, matching the record's monotone root and foot angles) but crosses on the far side (vent −1).
- `label` root (centroid of a candidate's geodesic-label border with the body, computed before naming): 28/38 —
  trunk-sharing legs do get distinct roots, but the vent far side loses one.
- `mid` (the point at a fraction 0.3–0.85 of the limb's ridge path): 29/38 at every fraction — fixes the coconut
  near side (4/6 → 5/6), loses one on the vent.
- `depth` (far layer by separation, near layer by mid — a front view's far layer is foreshortened and its limbs
  cross): 29/38, coconut 5/6, vent 4/7. On the vent near side the order is then right except a 2° swap between the
  folded rear leg (a loop) and its neighbour, after which the loop's length cost (|ln(42/200)|) makes the assignment
  shift and leave the front slot empty — the loop-evidence economics of slice 22, not the primitive.
Verdict: no primitive changes IC-4 (3/7 · 7/7 · 7/10 · 9/10); `sep` stays the default. The two near-side errors
that remain are one candidate-order swap (coconut) and one loop-evidence shift (vent); the far sides are right.
Addendum — `loopConfirm` (the interior-edge pass used only to upgrade a loop whose far point carries a thin endpoint
chain on the contour-cut ridge): threshold 2 × blur 1 confirms one loop on the coconut and one on the crab (the
crab's 68 px folded leg) yet the crab loses a name (5/6 → 4/6) and IC-4 is unchanged; 2.5–3 confirm nothing.
Rejected as default; the folded legs' contours are not separable from paint texture at any threshold that leaves
the rest of the crab intact (slice 21's finding, confirmed locally).

## Slice 26 — folded legs declared (Nick's decision), 2026-09-21
Nick's decision on the loop-only rear legs: **declare them.** `declaredFolded` joins `declaredHidden` as an intake
input to `assignLegs` (proposal file `audits/INTAKE_COMPILER_20260921/FOLDED_DECLARATIONS.md`; Codex owns the
presence files; `score.mjs#FOLDED` carries the proposal meanwhile). On a declared-folded slot a loop candidate
pays no kind or length penalty, and the strict verdict accepts a loop there. Declarations: crab `leg0Far`, mud
`leg0Far`, vent `leg0Near`. Result: named 29/39, positions 30/39; **IC-4 positives 3/7 → 5/7** (freshwater, mud,
vent, Civet, Wolf), wrong-template 7/7 refused, erased 6/10, duplicated 6/10 (down from 7/10 · 9/10: a folded slot
now accepts the loop-shaped remnant an erase or a duplicate leaves — the mutants must be re-cut for folded legs,
which is the next IC-4 item). Remaining refusals: the crab's `leg3Far` — short and thick behind the claw, read as a
claw finger (a palm test `thickNeedsPalm` was measured: 26/40, rejected); the coconut's unused endpoint at
(937,1010), 52 px from the record's placed hidden `leg3Far` — the painting shows the leg the fit declares hidden,
and a strict verdict is right to say so. Ordering re-measured with folded declarations: `sep` 5/7 positives,
`depth`/`mid` 4/7 — `sep` stays.
Absorbed mutants after the folded rule, by name (the next IC-4 item): mud erase/dup `leg0Far` (its folded slot is
refilled by one of the mud crab's three false loops — a folded slot must accept only the loop the compiler would
have chosen on the unmutated master, i.e. the mutant runner should compare against the positive's loop, not
re-admit any loop), mud erase/dup `leg3Near`, freshwater erase/dup `leg3Near`, coconut erase `leg2Near`, vent dup
`leg0Far`. Eight of twenty; the other twelve and all seven wrong-template mutants refuse.
Mutant runner fix: a mutant's folded slot counts only when it carries the positive's own loop (far point within
0.25 R). Effect: duplicated 6/10 → 7/10 (mud dup `leg0Far` now refuses); erased unchanged at 6/10 — erasing a
folded leg leaves the carapace rim it lay against, which forms a loop at the same far point, so an erased FOLDED
leg is undetectable by loop evidence by construction (recorded; the declaration path accepts this for folded legs).
Seven absorbed mutants remain, named above.

## Slice 27 — declarations consumed from Codex's presence files, 2026-09-21
Codex applied `folded` to the three fits' `presence.json` (crab `leg0Far` 7407…, mud `leg0Far` 0d81…, vent
`leg0Near` c4cb…; schema stays `cf.anatomy-presence/v2` with the new field; records, masks, bindings, rigs
unchanged; 3/3 focused checks). `score.mjs#declarationOf` now reads a fit's `presence.json` when it exists
(hidden/absent/folded), else the record's `anatomy`, else the declaration-only presence file; the `FOLDED`
proposal map is gone. Verified byte-identical to slice 26: named 29/39, positions 30/39, IC-4 positives 5/7,
wrong-template 7/7, erased 6/10, duplicated 7/10; sheet regenerated.
Correction: commit `0ba7210b` shipped `ic4.mjs` with an identifier collision (it did not run); the IC-4 numbers
recorded above were re-run and confirmed on the fixed file in the following commit. A record written before its
run is a process error; the runner output is now pasted only from a run of the committed file.

## Slice 28 — per-slot confidence measured: the assignment margin is a diagnostic, not a gate, 2026-09-21
`assignLegs` now returns `margins[slot]` = the cost gap between the best assignment and the best one that puts a
different candidate (or nothing) in that slot (front and side views; `score.mjs` prints `error/m<margin>`). Both-way
control on the five wrong named feet vs the right ones: wrong — coconut leg1Near 416 px m0.08, leg2Near 259 m0.14,
mud folded leg0Far 158 m0.25, **freshwater leg3Near 206 m0.88, vent leg2/3Near 429/439 m0.62**; right — mud near
side 5–24 px all m0.04, crab folded leg0Far 68 m0.07, vent far side 3–23 px m0.14–0.17, Civet paws m1.0–1.4. A
margin threshold that refuses the freshwater and vent wrong feet (≥ 0.62) also refuses most right crab feet;
one that keeps the right feet (< 0.04) passes every wrong foot. **Rejected as a gate; kept as output.** The wrong
feet on the freshwater and vent are false candidates the cost model prefers (thick, long endpoints beside the
claw), not close calls — so a confidence over the assignment cannot see them; only candidate precision can.
Label IoU with the applied declarations (P7, for the record, five crabs): body 0.37–0.54; claws far 0.39–0.63, near
0–0.66 (coconut/freshwater near claws were never candidates: 0 / 0.07); legs mean 0.28–0.46 (unchanged in kind
from slice 21: labels inherit naming).
`clawAttached` (an endpoint whose chain joins a fork member's chain outside the body is a claw part): removes the
freshwater false `leg3Near` (704,904) but the slot then empties (the true leg3Near is a LOOP at 38 px, which strict
evidence refuses) and leg2Near slides to 413 px; vent unchanged (its false endpoints are not claw-attached).
28/38, positives 4/7. Rejected; kept at 0. What this measured: freshwater `leg3Near` is a folded leg like the
three declared ones — a second-round declaration, not a rule.
Second-round declarations measured (freshwater `leg3Near`, crab `leg3Far`, vent `leg3Near` as folded, on top of
the applied three): no change on any of the three — the freshwater false endpoint (704,904) still outbids the
loop on a declared-folded slot, the crab's `leg3Far` is an endpoint the finger rule takes, the vent's near order is
unchanged. Declarations are exhausted as a lever too.
**`ic4.mjs` now prints PROGRAM §6's pass honestly:** PASS = verdict ADMIT and, where a hand record exists, every
named landmark within `IC4_BOUND` (default 60) master px. Run of the committed file (`c4e7fabe` shipped this check
with a scope error and a pre-written number — corrected here from the actual run): **PASS 1/7** (Wolf, by verdict,
no record), FAIL 6/7 — coconut (REFUSE), crab (REFUSE), freshwater (ADMIT, worst foot 206), mud (ADMIT, 158),
vent (ADMIT, 439), Civet (ADMIT, paws ≤ 31 px but `tail3` 65 px from the record's tail tip — the tuft junction
vs the hand tip). A verdict that admits a wrong landmark no longer reads as a pass.
Process fix: `check.mjs` runs score, ic4 and sheet on the committed files and exits nonzero on any error; it is
the first command of every commit in this folder from now on. Appendage tips (tail) are now refined like feet: the
Civet's `tail3` moves 65 → 67 px from the record's tail tip — the hand landmark sits at the end of the fur tuft, the
compiler's at the tuft junction; a tuft-length correction (the collapsed tuft's own length) is the P6 item for tails.

## Slice 29 — P6 geometry (option A, Nick 2026-09-21): knees and tails, measured
Knees (32 interior joints on correctly named crab/Civet legs, error vs the record): path start `exit` (current)
median 42 px, 25/32 within 60; `sep` 110 / 8; `root` 48 / 19; knees by the path's own bend (max turning angle,
`kneeMode:'bend'`) median 90 / 8. **`exit` + the reference's joint fraction stays**; bend-based joints are rejected
(painted legs bend at the joint AND at every segment ridge). Tails: a chain collapsed at a tuft junction takes as its
landmark the farthest LEAF within 0.6 R of the junction measured from the chain's approach point (fur tips hang off
several micro-junctions, so graph hops from the one junction miss them; the first two cuts — tuft length along the
terminal direction, hops from the junction — left the Civet at 67 px). Civet `tail3` 65 → **42 px**, and with it
the Civet passes PROGRAM §6's landmark bound: **§6 PASS 2/7** (Civet worst 31 px; Wolf by verdict). Run of the
committed file via `check.mjs`.
