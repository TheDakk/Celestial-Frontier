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
