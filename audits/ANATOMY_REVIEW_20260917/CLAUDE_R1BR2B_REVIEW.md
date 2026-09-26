# Claude review — R1b/R2b native re-capture (`r1b-r2b-native-01`), 2026-09-19

Reviewer: Claude (anthropic lane). Read-only review of the Codex worktree
`/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, evidence commit `d0437436`
on signed producer `6a58e40e`. Inspected: `r1b-r2b-native-01/` (README, `summary.json`, all nine
`report.json`), `r1b-r2b-static-01/` (README, `contact-pins-01.log`, `readability-01.log`), the producer
diff `6b11407d..6a58e40e` (14 files, +131/−23), the three films (`ffprobe` + 1 fps contact sheets) and
every 25/50/75 still for crab, coconut-crab and freshwater-crab (1× montages, 3× crops), the
`crab-fits-03` pin receipts, and the prior-producer reports (`*-native-03/-04`, `-02`) for comparison.
No edits to either lane, no sync, no tests run, no capture re-run, no GitHub write. The contact sheets
and crops I looked at are committed beside this file in `r1b-r2b-look/`.

## 0. Integrity — verified
- All nine reports name producer `6a58e40e`; `summary.json.status = STOP_FOR_REVIEW`, 3/5 primary, Civet FAIL.
- README values spot-checked against JSON: every quoted drift (0.2504741 / 0.2564678 / 0.2517091 Mud;
  0.3478886 / 0.2549673 / 0.2686878 Vent; 0.2581945 Civet idle), every failing ms, the persimmon fold
  counts (84 @ 67.17 ms, 209 @ 1200 ms) and every p95 row match. `contactPinComparison` records
  zero changed weights / zero pin deltas on all five crabs. Field-vertex counts are unchanged per
  subject across producers (crab 1,274; mud 1,759; vent 1,532; cranberry 3,417; devils-club 4,130).
- Producer diff is exactly the claimed scope: scale table (`motion-scale.mjs`), BodyCard
  `scaleLength/scaleReference`, family solver stride/lift, N12 loading in `specialized-actions.ts`,
  contact-endpoint pins in `split-observed-surfaces.mjs`, harness order in `native-entry.mjs`.
  Nothing in kits, masters, reserved owners or gameplay. I did not re-hash the 800 inputs.
- Films: 1400×800, ~60 fps, 10.10 s each; sequence idle → approach → pinch → hit → idle.

## 1. What I saw (visual, not numeric — Nick's acceptance stays open)
| ID | Subject / clip | Observation |
|---|---|---|
| V1 | scuttle 25/50/75, all three | **Readable for the first time.** Leg lift and the inward arc are visible at 1×; at 3× the swing legs bend and lift while the stance legs stay on the ground line. Small, but no longer the pixel-identical stills of R1/R2. |
| V2 | faint 25/50/75, Crab + Coconut | Clear body lowering and leg splay at 50 % (260 ms) — **but the crab is back at rest height by 75 % (390 ms).** Faint recovers instead of ending down. Under E1 the faint beat must hold a defeated pose; this is a clip-authoring question for R3/R4 (Q3 hold-last-pose is about refusals, not about this). |
| V3 | melee:pinch 25/50/75, all three | Near static at 1× and 3×: claws barely change across 127/253/380 ms. Expected — pinch reachability is R3 — but it means the three "passing" films contain no readable attack. |
| V4 | hit / dodge | Small recoil and lean respectively; readable at 3×, marginal at 1×. |
| V5 | Crab legs, every still | N8 fringes persist and are visible at 1× on the thin leg strokes (stair-stepped, doubled edges at 3×). Pre-existing; not R1b/R2b. |
| V6 | films | No tears, no floating legs, feet on the ground line throughout; readable but subtle; a viewer would call the crab "alive", not "walking". |

Conclusion on the three numeric passes: reviewable, better than R1/R2, not acceptable as the finished
look — V2 and V3 are the two things Nick will notice first.

## 2. N3 — my diagnosis was wrong, and here is what the gate actually measures

**Correction, owned.** In `CLAUDE_R1R2_REVIEW.md` N3 I said the sampled skin vertex "carries diffused
weights (`smoothSkinWeights`), so it moves a fraction of a pixel with the knee", and recommended pinning
it. Codex's read-only comparison shows the vertex nearest each contact landmark was **already rigidly
weighted and pinned** on all five crabs; the R1b pin declaration changed nothing. The premise
(diffusion) was false, so the repair (pinning) was a no-op, and the Mud/Vent failures were never going
to move. That cost one bounded correction cycle. The 0.25 px gate stays; it is not instrument noise;
pinning is not re-proposed.

**What the gate reduces to for a rigid vertex** (derived from `contactPaintDriftPx`, not measured):
```
drift = |(cur − src) − (tgt − rest)| · size          (native-entry.mjs checkContactPaint)
cur = T(src), tgt = T(rest)  for a vertex rigidly bound to the endpoint part, T its world affine
⇒ drift = |(R − I)·o| · size = 2·|o|·sin(θ/2)        o = src − rest (rest offset), θ = part's world rotation
```
Translation cancels; the contact landmark itself is exact (`maxContactError` ~4e-16). So the gate
measures **the rest offset of the nearest painted vertex, rotated by the lower-leg's stance rotation**.
That is exactly Codex's stated hypothesis, and it is derivable from the code — which is why it must be
*measured*, not assumed (§3a).

Consistency check against the receipts (`crab-fits-03/*/receipt.json` `contactPins[].distancePx` = |o|):

| Subject | joint | |o| px | worst drift px | implied θ |
|---|---|---:|---:|---:|
| vent-crab | leg0NearFoot | 2.540 | 0.348 | 7.9° |
| mud-crab | leg0NearFoot | 2.118 | 0.270 | 7.3° |
| mud-crab | leg0FarFoot | 2.165 | 0.252 | 6.7° |
| freshwater-crab | leg0NearFoot | 1.324 | 0.176 | 7.6° |
| crab | leg0NearFoot | 2.013 | 0.133 | 3.8° |
| coconut-crab | leg0FarFoot | 3.141 | 0.144 | 2.6° |

Freshwater rotates as much as Vent and passes because its offset is half; Coconut has the largest
offset and passes because it barely rotates. **Pass/fail is decided by the product of a fit property
(how far the observed landmark sits from the nearest painted pixel) and a motion property (stance
rotation)**, and 0.25 px is achievable only while |o|·sin(θ/2) ≤ 0.125 px. This is consistent on all
five; consistency is not proof.

If §3a proves it, the honest reading is: the *landmark* is planted, the *paint* is not, because the
observed foot landmark is 1.3–3.1 source px from the painted contact pixel. Two repair candidates
exist — move the foot landmark onto the painted contact pixel at fit time (record change, Mud/Vent
refit and re-split), or make the solver plant the painted contact vertex rather than the landmark
(solver contract change, iterated because R depends on the solve). **Neither is chosen here.** The
choice follows the measurement, in its own bounded item, with the gate unchanged.

## 3. One bounded next direction (R1c) — measure, don't repair

Scope: diagnostics and reports only, on the unchanged signed producer `6a58e40e` except where a
harness-only switch is named. No solver, clip, record, threshold, kit or binding change. New numbered
evidence folders; nothing overwritten. Stop after (a)–(c) for review.

### (a) Mud/Vent drift — test the rest-offset hypothesis
- **Instrument:** in `native-entry.mjs` (diagnostic branch only), for every stance contact at every
  sample, record `|o|` (from the pin receipt or recomputed), the endpoint part's world rotation θ
  (from the rig's part affine, atan2 of the linear part), the predicted `2·|o|·sin(θ/2)·size` and the
  measured `contactPaintDriftPx`, for all five crabs, all actions, 121 samples + 601 presentation.
- **Proof criterion:** max |predicted − measured| ≤ 1e-9 px on every sample proves the hypothesis
  exactly (rigid vertex ⇒ closed form). Any residual above Float32 ulp scale disproves it and must be
  reported with the offending sample; do not average it away.
- **Negative controls, both directions:** (1) a synthetic binding whose nearest vertex sits *on* the
  landmark (o = 0) must report zero drift at any θ; (2) a synthetic binding with |o| doubled must report
  exactly doubled drift at the same θ; (3) an unpinned diffused-weight mutant must report a residual
  ≠ 0 (proving the instrument can see the failure mode I wrongly diagnosed).
- **Report:** per crab, |o| and the max stance θ per action, and the θ at which each crab would cross
  0.25 px. No threshold change, no repair.

### (b) Civet sentinel — genuine shared-path regression vs harness/path artifact
- **Artifact discriminator first:** (1) the sentinel adapter's `record.json` / `binding.json` hashes
  must equal the candidate-10 hashes in `civet-sentinel-input-01/input-manifest.json`; (2) drive the
  *same* adapter inputs and the *same* sampled pose stream through `createQuadrupedContactSolver`
  (`planted:true`) and record contact error, drift and compression. If that reproduces the previously
  accepted candidate-10 numbers, the adapter is not the cause. If it does not, the adapter is defective:
  repair the adapter only, re-run the sentinel, and the family-path question stays open.
- **Then the shared path:** A/B the same pose stream through `createFamilyContactSolver`. At the first
  failing sample of `alert` (5.825 ms), `approach:walk` (28.97 ms), `dodge` (6.25 ms), log the hip world
  position, the fixed end target, the reach bounds (`upper+lower`, `|upper−lower|`), which bound is
  violated, and the compression the compat solver applied at the same sample. My hypothesis, to be
  tested not assumed: the family solver has no root-accommodation step (the compat solver shifts the
  root by `compression` up to 8 % body and keeps authored hip rotations; the family solver zeroes hip
  rotations and solves to a fixed end with no accommodation), so authored quadruped root loading pulls
  hips outside reach within a few ms. If confirmed, this is a genuine shared-path gap that also bounds
  brachyuran loading (N12's 8 % faint passes only because 8 % of a 0.094 span is small) — a finding,
  not a clearance.
- **Idle ankle drift 0.258 px:** include Civet's four ankles in (a); the Civet binding predates
  contact pins, so compute |o| directly.
- **Rule:** the compat/family distinction is a diagnosis aid; the sentinel is not passed until the
  family path passes it on the Civet binding.

### (c) Flora fold + CPU — controlled attribution
- **Facts already in evidence:** `normalPasses` is unchanged across producers (cranberry 4,032 → 4,028,
  devils-club 4,032 → 4,028), so the scale change did **not** change ARAP iteration counts; the
  persimmon fold pre-exists on `6b11407d` (132 folds in framing, `persimmon-native-04`), so it is
  **not** caused by R1b. What changed in the harness: per-action rows now run cold (before the
  601-sample presentation warm-up). What is unknown: run-to-run variance.
- **Design (2×2 + variance floor):** (0) three repeats of the exact current configuration to bound
  variance first — if the IQR alone covers 0.7 → 1.9 ms, say so and stop; (1) harness-only switch
  `order = rows-first | presentation-first` (diagnostic flag, default unchanged); (2) diagnostic-only
  scale override reproducing the legacy body-axis reference on the BodyCard for plants (a parameter the
  shipped path cannot read; refused outside the diagnostic entry); five repeats per cell; report median
  and IQR of per-row p95 and per-sample `normalPasses`. Attribution is accepted only for a cell delta
  larger than the IQR; otherwise "unattributed" stands.
- **Persimmon fold diagnosis (no fix):** at `disturb` 67.17 ms, dump the 84 folded triangles' part
  ownership and the joint pair each fold spans; count folds at 1.0 / 0.75 / 0.5 / 0.25 × the current
  disturb amplitude as a diagnostic sweep (not a clamp change) so the next decision knows whether it
  is a leaf/branchTip differential-rotation fold or a mesh-density fold.
- **Reporting gap to close in the same batch:** the native reports carry no readability measurement
  (N2's floors exist only as static tests on fixtures). Each native crab report must record peak swing
  foot displacement as a fraction of lower-leg length and peak carapace dy per action.

### Boundaries
Producer unchanged except the two named diagnostic switches, both refused outside the diagnostic
entry and covered by a test that the shipped `compileBodyCard` ignores them. No R3/R4/R9, no threshold
or clamp change, no re-run of unchanged input to seek a better number, no push. Stop for review.

## 4. Copy-ready direction for Codex
```
Claude's R1b/R2b review is at
/Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md
(read-only; do not sync). N3 is withdrawn as diagnosed; the 0.25 px gate is unchanged.

Authorize one bounded diagnostic batch, R1c, on unchanged producer 6a58e40e — measurements only:
  (a) per-sample predicted 2·|o|·sin(θ/2) vs measured painted-contact drift on all five crabs
      (+ Civet ankles); proof ≤ 1e-9 px; three named negative controls (o=0, |o|×2, diffused mutant).
  (b) Civet: adapter hash check + compat-solver reproduction of candidate-10 numbers, then A/B
      family vs compat solver on the same pose stream with reach bounds and compression logged at
      the first failing samples. Distinction ≠ clearance.
  (c) flora: variance floor (3 repeats), then 2×2 {rows-first | presentation-first} ×
      {declared scale | legacy body-axis scale} with 5 repeats, medians/IQR, normalPasses; persimmon
      fold: part/joint ownership at 67.17 ms + amplitude sweep 1.0/0.75/0.5/0.25 (diagnostic only);
      add peak foot displacement / carapace dy per action to native crab reports.
No solver, clip, record, threshold, clamp, kit or binding change; no R3/R4/R9; no push. Stop for review.
```

## Coordination
- **Nick:** V2 (faint recovers) and V3 (pinch static) are the visual findings on the three films; visual
  acceptance is yours and remains open. R1c is a diagnostic batch; the Mud/Vent repair choice comes
  after its result. R9 addendum is beside this file (`R9_ADDENDUM_FINISHED_TEXTURES.md`).
- **OpenAI/Codex:** R1c as above; then stop. R3 still carries `ContactPhase.travel` and `contactJoint`.
- **Anthropic/Claude:** idle until R1c evidence; E1 code waits for R3 on develop.

## 5. Amendment after Codex's `review-diagnosis-01` (`4cb5f7a3`, same day)

Codex ran a diagnosis batch in parallel with this review. Checked read-only against its artifacts:
- **§3(a) is answered.** Offline replay of all eight failing samples reproduces the recorded drift and the
  rotation-only prediction `(R − I)·o` matches within 2.5e-5 px (`diagnosis-02.json`, e.g. Mud hit
  θ = −6.78°, |o| = 2.118 px). Skin positions are Float32 (`aPosition`), whose ulp at 880 px is ~6e-5,
  so my 1e-9 criterion was written for Float64 and is withdrawn; the closed form is proven to the
  precision the field can express. The three named negative controls (o = 0, |o|×2, diffused mutant)
  are still owed — as tests inside the repair item, not a separate batch.
- **Persimmon ownership is answered.** 84 folds at 67.17 ms sit in `branch-3-foliage` (46) and
  `branch-4-foliage` (52) plus 2 trunk triangles; ablating either group's rigid pins or local rotation
  removes the fold at that one sample. Repair is a design question (coupled rigid-foliage/collar
  targets), not a parameter — nothing adopted, correctly.
- **New defect T1 — transition snap.** Every film jumps 42–57 display px in one frame at approach →
  pinch (encoded frames 225/226; source boundary 3666.67 ms): the solver's accumulated gait root travel
  has no owner across action transitions, so the next non-gait pose drops it. Confirmed on
  `crab-transition.png`. No existing gate asserts inter-action world-position continuity. This is the
  `ContactPhase.travel: 'solver' | 'stage'` contract already queued for R3 (E1 design §3): persistent
  stage displacement gets one explicit owner; fixing it by blending travel is excluded (N11).
- Codex's repair boundary for Mud/Vent (offset-aware painted-support constraint; **do not move source
  landmarks**) selects candidate 2 from §2 and excludes candidate 1. Agreed: landmarks are the observed
  record and set bone lengths.

**Amended next direction (replaces §3/§4 where they overlap):**
1. **R1c-b/c only** (measurement): Civet adapter check + family-vs-compat A/B; flora variance floor +
   2×2 CPU attribution. Do (b) before any solver edit — R2c touches the same shared solver.
2. **R2c** — painted-support contact for all families: end target = paintedRest − R(θ)·o, iterated to
   convergence (|o| is small; ≤ 3 fixed-point steps), both the bone endpoint and the painted vertex
   gated (contact error ≤ 1e-8 image units, painted drift ≤ 0.25 px unchanged); controls o = 0 → identical
   to today's solve, |o|×2 → still ≤ 0.25 px, diffused mutant → fails; static on five crabs + Civet.
3. **R3** as scoped, now explicitly owning T1 via `travel`, plus `contactJoint` and pinch reachability;
   add a continuity gate (max root world-position step between consecutive presentation samples ≤ one
   stride) with a negative control that reproduces today's 57 px snap.
4. One native re-capture after R2c + R3 (eight subjects + Civet), then Nick's look; R4 → R9 after.
5. Persimmon: Nick decides whether foliage rigidity is negotiable before anyone designs the collar
   treatment; its CPU failures stay open regardless.

## 6. Copy-ready bounded direction for Codex (supersedes §4; issued after `4cb5f7a3`)
```
Claude's review + amendment: /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md
(§2, §5, §6; read-only; do not sync). review-diagnosis-01 is accepted as proof of the Mud/Vent cause
(Float32 precision) and of the persimmon fold ownership. 0.25 px and <2 ms gates unchanged.

Authorize, in order, each ending in a signed producer + static checks + STOP:

R1c-b/c (measurement only, unchanged producer 6a58e40e, diagnostic switches refused outside the
  diagnostic entry):
  b. Civet: adapter record/binding hashes == candidate-10 manifest; same pose stream through
     createQuadrupedContactSolver (planted) must reproduce candidate-10 numbers; then A/B against
     createFamilyContactSolver logging hip world position, target, reach bounds, violated bound and
     compat compression at the first failing samples of alert/approach:walk/dodge. Distinction ≠ clearance.
  c. Flora CPU: 3 repeats of the current configuration (variance floor); then 2×2
     {rows-first | presentation-first} × {declared | legacy body-axis scale}, 5 repeats, median/IQR,
     normalPasses. Add peak swing-foot displacement (fraction of lower-leg) and carapace dy per action
     to native crab reports.

R2c (shared solver, all families): plant the observed painted support, not only the joint —
  end target = paintedRest − R(θ)·o, iterated to convergence (≤3 fixed-point steps), source landmarks,
  pixels and joins untouched. Gate both: bone endpoint ≤1e-8 image units AND painted drift ≤0.25 px.
  Controls: o=0 → identical to today's solve; |o|×2 → still ≤0.25 px; diffused-weight mutant → fails;
  five crabs + Civet binding statically. Incorporate R1c-b's finding if the family solver needs root
  accommodation; otherwise record why not.

R3 as planned (CODEX_REPAIR_PLAN §R3) plus: ContactPhase.travel?:'solver'|'stage' owning T1 —
  persistent stage displacement has one owner across action transitions; new continuity gate:
  max root world-position step between consecutive presentation samples ≤ one stride, with a
  negative control reproducing today's 42–57 px snap; compileAnatomyAttack returns contactJoint.
  Do not fix T1 by weighting travel by blend (N11).

Then ONE native re-capture (eight subjects + Civet, new folders) → STOP for Nick's look. R4 → R9 after.
Persimmon collar/foliage repair waits for Nick's decision on foliage rigidity; not in this scope.
No threshold, clamp, kit, record, per-species or reserved-owner change; no unchanged retry; no push.
```

## 7. Chunked program with minimal stops (Nick, 2026-09-19: "go as far as we can in chunks")

Only three stops survive: **S1** Nick's eye (films + first finished-crab sheet; kit first-new-class rule);
**S2** a shared-path red — Civet sentinel or any of the five crabs regressing after a solver/skin change
(fail-closed; no retry, no next stage); **S3** any GitHub write (budget gate). Every other former stop
becomes a pre-answered decision below or a leaf gate: a leaf-item red is recorded and the chunk
continues past it, unless it is S2.

**Pre-answered decisions (so Codex never waits):**
- R1c-b: if the family solver lacks root accommodation, add it in R2c with the compat solver's rule
  (root shift = compression, bound 8 % of scaleLength); if not, record why and move on.
- R1c-c: measurement only; whatever the attribution, no scale or harness change in this chunk.
- Persimmon (R2d): foliage *shape* is not negotiable; world-frame foliage pins are. Implement
  parent-frame rigid leaf groups (rigid relative to their branch tip). Gate: 0 folds at 67.17 ms and
  across all four actions, full-action shape proof; CPU stays a recorded open item (R8/Q4 cap).
  A red here is a leaf red — record and continue with the crabs.
- Node 26.9.0: not inside Chunk 1. Own toolchain batch with a fresh receipt at the Chunk 1/2 boundary.
- R9: the accepted engine finisher, no new model; the sheet includes one crab composited on the
  accepted Earth-temperate arena plate at battle scale (no plate inference).
- Re-capture spec: films must include faint (V2) and the full 12-row cycle, not idle/approach/pinch/hit.

**Chunk 1 (Codex, no stop until the end):** R1c-b/c → R2c → R2d → R3 (+T1 continuity gate,
`travel`, `contactJoint`) → R4 → one native re-capture (eight subjects + Civet, faint-inclusive films)
→ R9 on the five crabs → review sheet → **S1**. Each item: signed producer, static checks, evidence
folder; leaf reds recorded; S2 halts the chunk.

**Chunk 2 (Codex, after S1):** R5/R6/R7 integrity/coverage → R8 phone delivery tier (D1: retained
PNGs, painter fallback, no inference) → PR42 split prepared locally (UI / engine / tools) → **S3**.

**Chunk 3 (Claude, parallel with Chunk 2, needs one decision from Nick):** D4 said E1 code waits for
R3 "on develop", which is behind S3. Recommend relaxing to **"after R3 is signed on openai/mac,
integrated by a local merge of openai/mac into anthropic/mac"** (the lanes have merged history this
way before). Then Claude codes E1 (parts-rig adapter, attack-driven turn plan, arena selection, the
five outcome tests) while Codex runs Chunk 2, and the develop merge lands both at S3.

## 8. Single run, single stop (Nick, 2026-09-19: "most work possible before a stop") — supersedes §7's chunking

**One Codex run, one review packet, one stop at the end.** The only interruptions are S2 (a shared-path
red halts the run; no retry) and S3 (a GitHub write — the run never reaches one). Nick's eye (S1)
moves to the end and reviews an accumulated packet, not each item. Nothing in the run depends on a
visual verdict: R8 phone delivery works with the painter fallback if a finish is later rejected, and
roster sheets are re-rendered from retained inputs if a look is rejected — a late no costs renders,
not code.

**Run order (each item: signed producer, static checks, evidence folder, then continue):**
0. Toolchain first, once: Node 26.9.0 authorized here, fresh receipt; the whole run stays on it.
1. R1c-b/c (measure) → R2c (painted-support contact) → R2d (persimmon parent-frame leaf groups)
   → R3 (+T1 continuity gate, `travel`, `contactJoint`, pinch reachable) → R4 (Q3 refusals).
2. Native re-capture #1: eight subjects + Civet, faint-inclusive full-row films.
3. R9: five crabs finished (accepted finisher, masked 0.35), conservation/rebind/retention gates,
   sheet incl. one arena-scale composite.
4. R5/R6/R7 integrity and coverage → R8 phone delivery tier (D1) with the two phone Glass canaries
   run locally if the toolchain allows, else the retained-PNG/painter-fallback proof on desktop.
5. Roster, by source family nearest the crabs first (clawed crustacean → small crustacean → …):
   fit → bind → native capture → 12-per-sheet review sheet, family after family, **until S2 or the
   roster is exhausted**. Sheets accumulate; none is "accepted" by numbers.
6. PR42 split prepared locally (UI / engine / tools), branches and copy-ready PR text written, not pushed.
7. **STOP.** Review packet = one README indexing: every film, every sheet (crabs painter vs finished,
   each roster family), the refusal counts, the CPU table, the phone-tier proof, and every leaf red
   with its diagnosis. Nick reviews once.

**Pre-answered decisions** — all of §7's, plus: a leaf red anywhere is recorded and the run continues;
a roster family whose fits refuse is recorded and skipped; no threshold, clamp or kit change to make
any number green; no unchanged retry; Q1 open-gape candidates may be painted as candidates (originals
retained) and placed on the crab sheet for the same one stop.

**Claude in parallel (D4 relaxation, Nick's one word):** merge `openai/mac` into `anthropic/mac`
locally at Codex's signed R3 producer (or now, at `4cb5f7a3`, for everything that does not need
`travel`/`contactJoint`), code E1 per `E1_BATTLE2_INTEGRATION_DESIGN.md` — parts-rig adapter,
attack-driven turn plan, habitat arena selection, reduced-motion path, cleanup, the five outcome tests
incl. the duel that pays — and the first guardian design (D2) as a document. Claude's own packet
(battle film per the E1 tests) joins the same one stop.

## 9. S2 fired in R2c (Codex packet `audits/ANATOMY_SINGLE_RUN_20260919/`, 2026-09-19 night) — verdict and the bounded correction

**The stop was right.** R2c's painted-support constraint closes Mud/Vent (all five crabs ≤ 0.0094 px, endpoint error
≤ 4.6e-16) and R1c-b's finding (the family solver lacked root accommodation) is folded in as an 8 %-of-scale
accommodation. The Civet then fails idle at 261.95 ms with 0.2608 px on `foreNearAnkle` — a shared-path red on the
sentinel, halted with no retry. Codex's diagnosis is correct as far as it goes: the support is interpolated from
vertices 444/445, unpinned, 79.7–92.1 % `foreNearPaw` and 7.8–19.8 % `foreNearAnkle`, 13.48 px from the landmark.

**What the numbers say the mechanism is** (derived from the packet, to be measured, not assumed): R2c models the
support as rigid to the END bone and therefore moved the ankle target by `(R−I)·o` ≈ 2·13.48·sin(1.377°/2) ≈ 0.32 px.
The vertex is ~85 % paw-weighted, and the solver holds the paw level (`terminal = −lower`, world rotation ≈ 0), so
~85 % of that shift is an over-correction: 0.85 × 0.32 ≈ 0.27 px — the measured 0.26 px. The rigid-endpoint model was
exact for the crabs only because R1b pinned their supports 100 % to the endpoint. `arapStats.maximumTargetErrorPx` is
0.326 px at the failing sample, so a second mechanism (ARAP residual at the support) must be attributed separately.

**R2c′ — one bounded correction, then resume §8 at the R2c static sweep:**
- Model the painted support by its **actual skin weights**: predicted support = Σ_j w_j · T_j(support_rest) over every
  bone the support's triangle vertices are bound to (barycentric-blended weights, read from the binding, never
  edited), evaluated on the program's matrices. The ≤ 3-pass fixed point corrects the endpoint target by
  `paintedTarget − predicted(pose)`; no pins, no landmark move, no threshold or limit change, terminal rule unchanged.
- **Controls, both directions:** (1) the five crabs reproduce R2c's static rows bit-for-bit (their weights are 100 %
  endpoint, so the model reduces exactly); (2) a synthetic 100 %-terminal-weighted support needs zero correction; a
  50/50 support needs half of the rigid correction; (3) the diffused mutant still fails; (4) log, at every sample, the
  ARAP residual at the support (`published − LBS prediction`) separately from the kinematic residual, so if the Civet
  still exceeds 0.25 px the packet says which mechanism it is.
- **Acceptance:** Civet idle/alert/walk/dodge/hit/faint rows pass the 0.25 px gate on the unchanged candidate-10 binding
  with the family solver; five crabs unchanged. Then the run continues from the native re-capture as §8 orders.
- Sign R2c's halted packet first (1Password is unlocked); it is S2 evidence, not a producer admission.

**R1c-c recorded, not actioned:** with 69 trials and IQRs of 0.7–1.9 ms, the declared plant scale carries most of the
cold Cranberry sway/disturb cost (+1.1/+1.3 ms, above IQR) and Persimmon harvest (+2.4–2.7 ms); warm-up order is a
0.2–0.6 ms effect; `normalPasses` stays 4 in every cell, so the cost is per-pass, not iteration count. The declared
scale is a look decision (N1); its CPU belongs to R8/Q4 (the 2,000-vertex screening cap) — leaf red, carried.

**E1 note (this lane):** `createFamilyContactSolver(record, paintedSupports)` gains an optional second argument in R2c;
at the next re-merge the parts rig passes `observedContactSupports(record, binding)` so the stage runs the same
contact model as the harness.

### Copy-ready for Codex
```
S2 verdict + R2c′ direction: /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md §9
(read-only; do not sync). 1Password is unlocked: sign the halted S2 packet first (evidence, not admission).

R2c′ (one bounded correction): model each painted support by its ACTUAL skin weights — predicted support =
Σ_j w_j·T_j(support_rest) over every bone its triangle vertices are bound to (weights read from the binding, never
edited) — and correct the endpoint target by paintedTarget − predicted(pose) in the existing ≤3-pass fixed point.
No pins, no landmark move, no threshold/limit change, terminal rule unchanged. Log the ARAP residual at the support
(published − LBS prediction) separately from the kinematic residual at every sample.
Controls: five crabs bit-identical to R2c static rows; synthetic 100 %-terminal support → zero correction, 50/50 →
half; diffused mutant fails. Acceptance: Civet rows pass 0.25 px on the unchanged candidate-10 binding, family solver.
Then resume §8 from the R2c static sweep → native re-capture → … as ordered; S2 remains the only halt; no push.
```

## 10. R2c′ ran and S2 fired again (Codex `R2c-prime/`, producers `ca851fb6` halted packet → `dd33865c` R2c′, both signed)

**Codex did exactly what §9 asked, and the stop is right again.** Five crabs bit-for-bit; the weighted-point model
converges to 8e-8 px; Civet idle (0.193 px) and approach (0.060 px) pass; `melee:bite` fails at 54.99 ms with
0.266 px. The packet attributes the vector exactly: kinematic covariance 0.100 px (weights vary across the support's
triangle, so the LBS of the interpolated point ≠ the interpolated LBS) + ARAP/publication 0.181 px = 0.266 px.

**What the 10,515 retained samples say (read here, not in the packet's prose):**

| Support residual | five crabs (pinned supports, R1b) | Civet candidate-10 (unpinned) |
|---|---:|---:|
| ARAP/publication, all rows, max | **0.0001 px** | idle 0.14 · approach 0.20 · bite 0.18 px |
| kinematic covariance, max | ≤ 0.009 px | 0.02–0.11 px |

So two mechanisms remain, and neither is the solver's fault any more:
1. **Covariance** — fixable in the model: predict with the exact per-vertex LBS interpolated at the support (the packet's
   own "exact triangle LBS"), not the LBS of the weighted point. Crabs unchanged (100 % endpoint weights).
2. **Skin-solver freedom at an unpinned support** — the dominant term, and structural: the crabs sit at 0.0000 because
   R1b locked their contact supports at split time; the Civet's candidate-10 binding predates that shared split step.

**Owning the word "pin".** Nick's rule "do not re-propose pinning" was earned by my N3, which asserted diffusion where
none existed (the crabs were already pinned; zero weights changed). This is the opposite case: the crabs are pinned and
measure 0.0000; the Civet is not and measures 0.18 px of solver residual at the very vertex the gate reads. The
correction is not a new device — it is running the Civet through the **same current shared split** every crab
already went through (`splitObservedSurfaces … contactEndpoints`), producing a current-pipeline binding. Candidate-10
stays byte-for-byte as history; no source landmark, limit, terminal rule or threshold moves.

**R2c″ — one bounded correction, then resume §8 at the R2c static sweep:**
- Model: exact per-vertex LBS interpolated at the support; drop the weighted-point prediction. Crabs bit-for-bit.
- Binding: regenerate the Civet binding through the current shared split with contact-endpoint locks, from the
  unchanged candidate-10 inputs (same masks, atlas, record). Receipt must show: weights identical everywhere except
  the support locks (crab-style `contactPins` receipt), `restChanged 0`, atlas hash unchanged.
- Controls, both directions: (a) covariance term → ≤ 1e-6 px on all six under the new model; (b) the Civet on the
  **unpinned** candidate-10 under the new model still fails (proves the lock closes it, not the model); (c) the crabs'
  ARAP residual stays 0.0000; (d) diffused mutant still fails.
- Acceptance: Civet, all rows and presentation, ≤ 0.25 px on the regenerated binding with the family solver. If it
  still fails after both, that is a genuine shared-path red — stop, no third variant.
- E1 (this lane): the parts rig loads the regenerated Civet binding as its fit and passes
  `observedContactSupports(record, binding)` to the family solver; the compat-solver path is then retired for the Civet.

### Copy-ready for Codex
```
R2c′ verdict + R2c″: /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md §10
(read-only; do not sync). Both S2 stops were right; nothing is loosened.
R2c″ (one bounded correction): (1) predict the painted support with the exact per-vertex LBS interpolated at the
support (your "exact triangle LBS"), dropping the weighted-point model — crabs bit-for-bit; (2) regenerate the Civet
binding through the CURRENT shared split with contact-endpoint locks from the unchanged candidate-10 inputs (same
masks/atlas/record; candidate-10 retained byte-for-byte). Receipt: weights identical except the support locks,
restChanged 0, atlas hash unchanged. Controls: covariance ≤ 1e-6 px on all six; unpinned candidate-10 under the new
model still fails; crab ARAP residual stays 0.0000; diffused mutant fails. Acceptance: Civet all rows + presentation
≤ 0.25 px, family solver, regenerated binding. Then resume §8 from the R2c static sweep; S2 remains the only halt;
no third variant if it fails; no push.
```

## 11. R2c″ ran and S2 fired a third time (Codex `R2c-double-prime/`, producers `766e0917` → `224086c9` → `8ecb9209`, signed) — verdict: the instrument, not the data

**What Codex did right.** Stopped at the first shared-path red before any measurement; changed no input, coefficient
or tolerance; preserved candidate-10 byte-for-byte (`input-preservation.json` PASS, receipt shows exactly seven
support weights changed and six pins added); ran the synthetic controls both ways (pinned 0.0000252 px, diffused
mutant 2.648 px); recorded the two leaf reds honestly (the `melee:body` invocation typo, and the pose-exporter reds
that come from `battle2/choreography.ts` / `effects/anchors.ts` being absent in the openai lane — expected until the
next re-merge, not a defect).

**What fired.** `createFamilyContactSolver` now validates every support vertex with `v.barycentric < 0 → throw`
(`port/v2/apps/game/src/creature-rig-contact.ts:94`). At `foreNearAnkle` the support triangle is
(444: 0.7368…, **442: −8.98e−16**, 445: 0.2632…). The three coefficients sum to exactly 1.0 and the two non-zero
ones are the pinned `[foreNearAnkle, 1]` vertices; vertex 442 is the diffused paw/ankle/knee vertex that the split
correctly did **not** pin because its coefficient is zero. The support point lies on the triangle **edge** 444–445;
candidate-10's point-in-triangle solve returned the edge coefficient as a rounding zero with the sign of the
floating-point noise. That is valid interpolation data: a point on an edge is a legitimate barycentric location,
and every other check in the same constructor already carries a rounding tolerance (sum-to-1 at `1e-8`, twice).
Only the sign check has none. So the constructor is internally inconsistent — it accepts a coefficient of
`+8.98e−16` and rejects `−8.98e−16`, although both are the same edge point to any physical precision.

Project law applies verbatim: *when a new instrument fires, suspect the instrument first.* This is not a kinematic
or ARAP residual and says nothing about the contact locks; nothing was measured. It is not a gate threshold
(0.25 px, < 2 ms, exact rest all stand). It is a validator Codex wrote in R2c″ itself, and its rejection of
retained data is the defect.

**Why not the other fix.** The alternative is to make the split snap |b| < ε to exactly 0 on regeneration. That
would change the receipt, re-run the split and make the input-preservation claim depend on which tool ran last.
The data is already correct; the reader should accept correct data. Keep the validator as the single place that
decides what "valid" means.

**R2c‴ — one bounded correction to the constructor, then resume exactly where R2c″ stopped:**
- In `creature-rig-contact.ts` line 94, make the sign check tolerance-consistent with the sum check: reject
  `v.barycentric < −1e-8` (the same `1e-8` already used twice in that constructor), accept anything within rounding
  of zero and use the stored value as-is (its contribution is ≤ 1e-15 px; no snap, no renormalise, no input change).
  Nothing else in the file moves.
- Unit control, both directions, in `creature-rig-contact-weighted.test.ts`: (a) a support whose middle vertex
  carries `−8.975276662232845e−16` (the real 442 value, the other two summing to 1 − that) constructs and predicts
  the same point to 1e-12 as the identical support with that coefficient at `+0`; (b) `−1e-3` still throws
  `invalid support weights`; (c) the existing real-binding test now **constructs the solver** on the regenerated
  Civet binding (`R2c-double-prime/civet-input/`), which is the test that would have caught this before the film.
- Then `native-rest-02` again with the retained `[melee:bite]` list, unchanged inputs, no other change. Every
  R2c″ acceptance item in §10 still stands unrun: exact rest, unpinned-candidate-10 negative control, six-subject
  covariance ≤ 1e-6 px, five-crab bit-identity, Civet all rows + presentation ≤ 0.25 px on the family solver.
- S2 remains the only halt. If native rest or the sweep fails after this, that is the genuine shared-path red and
  no further variant follows.

### Copy-ready for Codex
```
R2c″ verdict + R2c‴: /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md §11
(read-only; do not sync). The stop was right, but the red is the instrument: your new constructor rejects
v.barycentric < 0 with no tolerance while the same constructor tolerates 1e-8 on the sum; vertex 442 at
foreNearAnkle is −8.98e−16 — an edge point with rounding-sign noise, valid data, zero contribution.
R2c‴ (one bounded correction, constructor only): (1) creature-rig-contact.ts:94 — reject only v.barycentric < −1e-8,
use the stored value as-is, no snap/renormalise, no input or tolerance change elsewhere; (2) unit controls both ways:
the real −8.975276662232845e−16 support constructs and predicts identically (1e-12) to the same support at +0; −1e-3
still throws; the real-binding test constructs the family solver on R2c-double-prime/civet-input (the test that
would have caught this); (3) re-run native-rest-02 with [melee:bite] on unchanged inputs, then every §10 acceptance
item exactly as written (exact rest, unpinned candidate-10 still fails, six-subject covariance ≤ 1e-6 px, five-crab
bit-identity, Civet all rows + presentation ≤ 0.25 px). S2 stays the only halt; no further variant after that;
pose-exporter reds from the absent battle2/choreography.ts + effects/anchors.ts are expected until the next
re-merge. No fetch, push, PR, merge.
```

## 12. R2c‴ ran and S2 fired a fourth time (Codex `R2c-triple-prime/`, producers `0dd26298` → `c7b4fdfd`, signed) — verdict: a real design conflict, now measured; direction R2c-L

**What passed.** Native exact rest (`restChanged 0`, shift control 1,511,112 bytes); unpinned candidate-10 negative
control fails as required (bite 70.7 ms, 0.2501 px); exact-model covariance 0 on all six; five crabs bit-identical
to R2c′ across 12 rows + 601 presentation samples; Civet locked supports ≤ 0.000088 px through every completed
sample; 25 contact tests incl. the real-binding constructor; 779 hashes unchanged. The constructor correction was
the one line asked for. Codex stopped at the first throw before any measurement. All correct.

**What fired.** `Contact: joint limit foreFarAnkle melee:bite@102.12 ms: 61.56°` against the quadruped template's
±60°. This is the first time any run has reached the Civet's joint-limit check at all — R2c died at idle 262 ms and
R2c′ at bite 55 ms on paint drift, so the limit conflict was always underneath. It is **not** an instrument defect
this time: I re-derived the requirement offline in this lane (same record `b38684ec…`, same clips, same skeleton
program and two-bone IK as the family solver, limits *reported* instead of thrown, no support model, nothing
written) and the requirement is real and grows past 102 ms.

**Naming the joints first.** In the skeleton program a joint's rotation pivots on its *parent's* landmark
(`skeleton-pose.mjs`, `poseMatrices`). So for a leg chain Root→Knee→Ankle→Paw: the pose key `Knee` is the swing at
the shoulder/hip, `Ankle` is the fold at the elbow/stifle, `Paw` is the fold at the wrist/hock. The limit that fired,
"foreFarAnkle ±60°", is therefore the **elbow fold** of the far foreleg.

**Measured requirement (Civet, planted-contact IK, every row; my sweep, 121 samples per row):**

| Row | Joint (anatomical) | Required | Limit | Driver at the peak |
|---|---|---:|---:|---|
| melee:bite (also claw/gore/headbutt → bite) | foreFarAnkle (elbow fold) | 69.3° @ 125.7 ms | ±60 | anticipation crouch: spine +9°, root dy 0.017 → fore hip drops 79 px; hip-to-wrist distance 245 → 182 px on a 180 + 73 px chain |
| melee:bite | foreNearAnkle (elbow fold) | −62.0° @ 117.8 ms | ±60 | same crouch; 190 + 142 px chain, 332 → 276 px |
| melee:bite | foreNearPaw / foreFarPaw (wrist) | 48.3° / −47.8° | ±40 | same crouch / start of lunge |
| melee:tail | foreFarPaw (wrist) | −60.9° @ 212 ms | ±40 | lunge root dx 0.373 with all four feet planted; hip 125 px ahead of the paw |
| faint | foreFarAnkle / foreNearAnkle (elbow fold) | 91.7° / −91.1° | ±60 | collapse root dy 0.166–0.22 → hip drops 143–164 px |
| faint | foreFarKnee (shoulder swing) | −86.7° | ±75 | end pose of the collapse |
| faint | foreNearPaw / hindFarPaw (wrist / hock) | 76.3° / 63.1° | ±40 | collapse |
| faint | hindFarAnkle (stifle fold) | −72.1° | ±60 | collapse |
| tame | foreFarPaw (wrist) | −45.4° | ±40 | root dx 0.12 |
| idle, approach, hit, alert, cast, dodge, victory, feed, gaits | — | within limits | | |

Codex's exact solver (support model + the 8 % compression shift my lane's version lacks) will differ by a few
degrees — it reached 61.56° at 102 ms where I read 64.0° at 110 ms — but not in kind: the bite crouch needs about
70° of elbow fold and the faint needs about 90°, on both forelegs, on a leg that is painted almost straight (rest
hip-to-wrist 97–99.7 % of the chain's full length).

**Why it is a design conflict and not a Civet defect.** Three things the kit already owns collide: (1) the clips
crouch and collapse the body (`melee()` anticipation dy 0.03, `faint` dy 0.22, spine ±12°); (2) the contact law
plants every foot ("feet plant, weight shifts, nothing hovers or slides" — `MOTION_KIT.md` line 62, Nick's rule);
(3) the template's `limitsDeg` were authored as the *raw-clip* guard ("anatomical joint limits after easing /
secondary overshoot", `ANIMATION_COMPLETION_20260916`), tuned to the shallow authored leg keys. Once the IK
replaces the authored leg keys to honour (1) and (2), the legs must fold as far as a crouching or collapsing animal
actually folds — an elbow at 70–90° is ordinary for a carnivoran — and (3) forbids it. The raw clips passed the
limit battery only because their authored leg angles never fold that far; the film would. The crabs never met this
because the brachyuran limits and clips were built together after R1b. Landmarks are not the cause: near and far
knee sit at the same fraction of leg height (0.53 / 0.54), and the near foreleg with its long lower segment
over-folds too (−62°).

**Self-finding (this lane).** The E1.5 films drove the Civet through the *compat* solver
(`createQuadrupedContactSolver`), which has no joint-limit check; those films show the same 70° crouch fold and
nobody could have flagged it. E1.5 is evidence of contact and cadence, not of anatomical limits. The parts rig moves
to the family solver at the R3 re-merge as already planned; nothing is re-claimed here.

**Direction R2c-L (one bounded change, then resume where R2c‴ stopped).** Under Nick's "everything is authorized"
I am making this design call rather than stopping for it; it is reversible and its values come from measurement.
1. **Measure on the exact solver first.** Add a `reportLimits` flag to the static sweep (sweep tool only; the runtime
   check is untouched) that records, instead of throwing, every sample where a post-IK joint exceeds `limitsDeg`:
   subject, row, ms, joint, required degrees, root dx/dy, spine/chest, hip drop. Run all six subjects, all rows +
   presentation. Control: the five crabs must report zero exceedances (they passed with the check live).
2. **Separate the two questions.** Add `contactLimitsDeg` to the family contract: the post-IK range-of-motion check
   in `createFamilyContactSolver` (line ~150) reads it; every template defaults it to `limitsDeg` (bit-identical
   everywhere except where overridden); the raw-clip authoring guard keeps `limitsDeg` unchanged, so the 169-action
   clip battery keeps its sensitivity. Override the quadruped leg joints from step 1's table with the rule
   *measured max across all six subjects + 10°, rounded up to 5°*. From my numbers that is Knee (shoulder/hip swing)
   ±100, Ankle (elbow/stifle fold) ±105, Paw (wrist/hock fold) ±90; Codex's table governs the final values and is
   recorded beside them in `CREATURE_ANIMATION.md`.
3. **Controls both ways:** (a) a crouch mutant (bite anticipation `dy` ×3) must still throw at the new
   `contactLimitsDeg`; (b) five-crab rows bit-identical to R2c′; (c) the raw-clip limit battery unchanged;
   (d) `contactLimitsDeg` absent ⇒ behaviour identical to today on a synthetic template (unit test).
4. Then resume the §10 acceptance exactly as written: Civet all rows + presentation ≤ 0.25 px on the family
   solver, exact rest, then R2d → R3. S2 remains the only halt; a paint-drift or limit red after this is genuine.

Not chosen: freeing feet during crouch/lunge/collapse (contradicts Nick's contact law and would need his word);
shrinking the crouch/collapse amplitudes (changes the approved look for every quadruped to fit a guard that was
never meant for the solved pose); widening `limitsDeg` itself (silently loosens the authoring guard).

### Copy-ready for Codex
```
R2c‴ verdict + R2c-L: /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md §12
(read-only; do not sync). Everything you ran is accepted; the stop was right, and this time the red is real: the
post-IK limit check reads the raw-clip authoring guard (limitsDeg ±60 on "Ankle" = elbow fold, pivot is the parent
landmark), and the kit's own crouch (bite anticipation) and collapse (faint) with planted feet need ~70° and ~90° of
elbow fold on both Civet forelegs (my offline table is in §12). R2c-L, in order: (1) sweep tool only: a reportLimits
flag that records instead of throws (subject,row,ms,joint,required°,root dx/dy,spine/chest,hip drop), all six
subjects, all rows + presentation; crabs must report zero; (2) add contactLimitsDeg to the family contract, read by
the post-IK check in createFamilyContactSolver, defaulting to limitsDeg for every template (bit-identical), overridden
for quadruped leg joints by the rule measured max + 10° rounded up to 5° (expected about Knee ±100 / Ankle ±105 /
Paw ±90; your table governs, record it in CREATURE_ANIMATION.md); limitsDeg and the 169-action raw-clip battery
unchanged; (3) controls: crouch mutant (bite anticipation dy ×3) still throws; five crabs bit-identical to R2c′;
raw-clip battery unchanged; contactLimitsDeg-absent ⇒ identical behaviour (unit); (4) resume §10 acceptance as
written (Civet all rows + presentation ≤ 0.25 px, exact rest) then R2d → R3. S2 stays the only halt. No fetch,
push, PR, merge.
```

## 13. R2c-L stopped at the compression bound (Codex `R2c-L/`, producers `1523b0b5` → `ddb51313`, signed) — verdict: same conflict, now fully mapped; direction R3-S ends the stop-per-gate loop

**What Codex did.** Exactly step 1 of R2c-L: a tool-only `--reportLimits` sweep in a temporary bundle (one exact
throw replaced, production untouched, preservation receipt to `c7b4fdfd`); five crabs, all 12 rows + presentation,
**zero** exceedances, bit-identical; Civet idle/approach clean and 20 bite samples with 15 exceedances that match my
§12 table (foreFarAnkle 71.8°, foreNearAnkle −61.1°, foreNearPaw 50.1°, foreFarPaw −57.9°); then S2 at bite 157 ms
on the **8 % scale-compression bound** (28.1 px; 24.5 px used at 149 ms; raw root dx 0.259 at the throw). Codex was
right not to derive `contactLimitsDeg` from a partial table and right to stop: the compression throw was outside
the R2c-L scope. Nothing is wrong with the packet.

**What the compression bound is.** When a planted paw is farther from its hip than the leg can reach, the solver
lowers the root until the leg can reach it, and refuses if that drop exceeds 8 % of the pelvis–chest span. At
157 ms the bite's launch key is pulling the root forward toward `dx 0.36` body lengths (the `melee()` default keys
are `[-0.04, 0.36, 0.40, 0.10]`) with **all four paws planted**, so every leg is being dragged behind a body that
has moved 90–125 px ahead of its feet.

**The whole map (Civet, my mirror of the solver's reach/compression/limit kinematics, every gate reported):**

| Row | Root travel | Compression needed | Bound | Limits exceeded (post-shift) |
|---|---|---:|---:|---|
| melee:bite / claw / gore / headbutt | dx → 0.357, dy −0.05 | **69.6 px**, first over at 157 ms (36 px) | 28.1 | elbow 69°, wrist −86°, hock −54° |
| melee:tail | dx → 0.357 | **78.1 px** | 28.1 | elbow 99°, wrist −120° |
| cast (rear-up, dy −0.06) | rise | **286 px** (the solver would cancel the rear-up by dropping the body 286 px) | 28.1 | stifle −123°, hock 109° |
| victory (rear-up, dy −0.08) | rise | **297 px** | 28.1 | stifle −134°, hock 132° |
| dodge (hop back, dx −0.25) | jump | **94 px** | 28.1 | stifle −72°, hock 86° |
| faint (collapse, dy 0.22) | drop | 0 | | elbow ±92°, shoulder −87°, wrist 76° (§12) |
| idle, alert, approach, hit, tame, feed, gaits, kick | | ≤ 20 px | | none (tame wrist −45°) |

Codex's exact solver reads the same shape (its 24.5 px at 149 ms sits on my curve). So the joint-limit stop (§12)
and the compression stop (this section) are one conflict: **the quadruped clip library moves the body (lunge,
rear-up, hop, collapse) while the family solver plants all four feet for every action that is not a gait or a
flight.** Each remaining Civet row will fire a different gate of the same solver, one stop at a time: bite →
compression, cast → compression, dodge → compression, victory → compression, faint → limits. The crabs never met
this because the brachyuran clips were authored *after* R1b for planted feet and a crab does not rear, hop or lunge.

**Why the "feet plant" law is not what is being broken.** `MOTION_KIT.md` line 62 says feet plant, weight shifts,
nothing hovers or slides. A rearing, lunging or leaping animal *lifts* feet; that is not hovering. The contract that
is missing is *which* feet are planted in which action — the gaits already have one (alternating groups), and the
compat rig in E1 already carries a crude one (`plantedFor`, which frees victory and every attack). What the
program lacks is the shared, per-template version of that table, and the solver's post-IK check reads the raw-clip
guard instead of a range of motion for planted folds. R2c-L's `contactLimitsDeg` was half of the fix; the stance
contract is the other half, and it belongs to R3, whose interfaces (`contactJoint`, `travel:'stage'`, per-family
profile) are where E1's three pins already wait.

**Direction R3-S — one package, run without intermediate stops.** Under Nick's "everything is authorized" I am
folding the remaining contact design into R3 and directing it as a single run. Codex stops only for a red outside
this scope (see 6).
1. **Report-all mode first (baseline ledger).** Extend the tool-only sweep flag so *every* `Contact:` throw class
   (reach, compression, joint limit, unresolved endpoint, painted-support residual, drift) is recorded and the
   sweep continues; all six subjects, all rows + presentation. Commit that ledger as the "before" table. Crabs must
   report zero of every class except what they report today (nothing).
2. **Stance contract in the family contract**: per template, per action id (with a default), which leg groups are
   planted. Quadruped: *all* for idle, alert, hit, feed, tame, faint, approach, and the gaits (alternating, as today);
   *hind only* for every `melee:*` except kick (the strike is a head drive from planted hind feet; the fore paws
   follow their authored keys), cast and victory (rear-ups); *none* for dodge (a hop) and kick (as today). Brachyuran:
   *all*, everywhere — bit-identical control. Unplanted legs keep their authored clip keys and the raw-clip guard;
   planted legs are solved as now. The stage owns closing distance (`travel:'stage'`, E1 pin), so no clip needs a
   lunge to reach the opponent; leave the melee root keys as they are for this run — the report-all ledger after
   step 2 tells us whether the hind-planted lunge still exceeds anything (my estimate: hind reach is satisfied at
   dx 0.357 with ≤ 5 px of compression).
3. **`contactLimitsDeg`** as in R2c-L, now derived from the *after* ledger of planted folds only (faint and the bite
   crouch): measured max + 10°, rounded up to 5°, recorded in `CREATURE_ANIMATION.md`; every other template defaults
   to `limitsDeg`; the raw-clip guard and 169-action battery untouched.
4. **Report-all again (after ledger)**: for the Civet, reach/compression/limit classes must be empty on every row +
   presentation; drift ≤ 0.25 px on planted feet is the acceptance; exact rest; five crabs bit-identical to R2c′.
5. **Controls both ways:** crouch mutant (bite anticipation dy ×3) throws on `contactLimitsDeg`; a stance mutant
   that plants all four on the bite throws on compression exactly as today; contract-absent template ⇒ identical
   behaviour (unit); brachyuran contract ⇒ bit-identical rows.
6. **Then the rest of §8 in order** (R2d → R3 interfaces incl. `contactJoint` / `travel:'stage'` / pinch / crustacean
   profile → R4 → full native capture → R9/Q1 → R5–R8 → roster → local PR42 split). **S2 halts only** for: a paint-drift
   red on a planted foot after step 4, an exact-rest red, a crab non-identity, or any throw class the after ledger
   said was empty. A red inside steps 1–5 is fixed and retained in the packet, not stopped on.

Not chosen: shrinking the lunge/rear-up amplitudes (hides the missing contract and changes the approved look);
relaxing the compression bound (a body cannot drop 286 px to keep rearing feet on the ground); freeing all feet
for all actions (throws away R1b/R2c and the contact evidence).

**E1 (this lane) at the re-merge:** `plantedFor` is retired in favour of the shared stance contract; the parts rig
runs the family solver with observed supports; the three pins flip; E1.5 is re-shot on that solver.

### Copy-ready for Codex
```
R2c-L verdict + R3-S: /Users/nick/Projects/celestial-frontier-anthropic-mac/audits/ANATOMY_REVIEW_20260917/CLAUDE_R1BR2B_REVIEW.md §13
(read-only; do not sync). Your R2c-L packet is accepted in full; the compression stop and the limit stop are one
conflict: the quadruped clips move the body (lunge/rear-up/hop/collapse) while the solver plants all four feet for
every non-gait action, and every remaining Civet row fires another gate of it (my full map is in §13: bite 69.6 px,
tail 78 px, cast 286 px, victory 297 px, dodge 94 px against the 28.1 px bound; faint ±92° elbow). R3-S, ONE run,
no stops inside it: (1) report-all mode in the tool-only sweep (every Contact: throw class recorded, sweep continues),
six subjects, all rows + presentation, committed as the BEFORE ledger; (2) a per-template, per-action stance contract
in the family contract: quadruped all-planted for idle/alert/hit/feed/tame/faint/approach + gaits alternating as
today; hind-only for every melee:* except kick, and for cast and victory; none for dodge and kick; brachyuran all,
everywhere (bit-identical control); unplanted legs keep authored keys + raw-clip guard; melee root keys unchanged
for this run (stage owns travel); (3) contactLimitsDeg from the AFTER ledger's planted folds only, measured max + 10°
rounded up to 5°, recorded in CREATURE_ANIMATION.md, other templates default to limitsDeg, raw-clip battery
untouched; (4) report-all AFTER ledger: Civet reach/compression/limit classes empty on every row + presentation,
drift ≤ 0.25 px on planted feet, exact rest, five crabs bit-identical to R2c′; (5) controls: crouch mutant (bite
anticipation dy ×3) throws on contactLimitsDeg; all-four-planted bite mutant throws on compression as today;
contract-absent template identical (unit); (6) then §8 in order: R2d → R3 interfaces (contactJoint, travel:'stage',
pinch, crustacean profile) → R4 → full native capture → R9/Q1 → R5–R8 → roster → local PR42 split. S2 halts ONLY
for a planted-foot drift red after step 4, an exact-rest red, a crab non-identity, or a throw class the after
ledger said was empty; any red inside steps 1–5 is fixed and retained, not stopped on. Signed commits; no fetch,
push, PR, merge.
```
