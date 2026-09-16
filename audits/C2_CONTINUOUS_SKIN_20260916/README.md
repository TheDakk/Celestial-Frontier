# C2 continuous painted skin — September 16

Worktree: OpenAI/Codex, macOS, `celestial-frontier-openai-mac`, `openai/mac`.
This repairs the C2 parts-rig proof from the approved masters; it does not change
Art/Motion/Sound Kit wording, generate art, retune individual creature clips, or
edit Claude-owned modules. GitHub step: none. PR42 remains parked.

## Repair

The previous seam bridges could cover alpha gaps while stretching single strips
of paint across large articulated regions. The replacement reuses the exact
packed source pixels in a continuous triangulated skin, separating overlapping
near/far limb surfaces by their actual anatomical ownership. Proximal sockets
remain shared; opposing feet cannot accidentally become one physical triangle.
Weights diffuse along those surfaces. A fixed four-by-four ARAP shape solve
preserves local painted shape with immutable paw handles and an orientation
constraint. Source and atlas bytes, UV reconstruction, part count and depth
layers remain unchanged. Rest parity is verified by rendered RGBA comparison.

The runtime compiles sparse weights once. Every frame reads fresh joint
transforms and publishes geometry only after the complete pose passes. There is
no previous-frame deformation state, clock, random source or creature-specific
curve. The producer remains the read-only GSAP adapter bound to SHA-256
`6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74`.

## Preserved diagnostic evidence

- Candidate01: coarse shared mesh before topology diffusion.
- Candidate02: first diffusion experiment; retained offline folds.
- Candidate03: contact pins and shape solver before anatomical limb separation.
  Its interrupted offline JSON is empty and is not a valid qualification receipt.
- Native01: real Civet diagnostic. Exact rest and 1,201 motion samples passed,
  but creature CPU p95 was 3.2 ms; it correctly failed the 2 ms budget.
- Candidate04: split anatomical surfaces, same atlas and original source pixels.
- Candidate05: hash admission and folded-back limb routing; its three bindings
  are byte-identical to Candidate04.
- Native02: the new rendered-contact gate caught 1.303 native pixels of Civet
  paw-paint drift while the corresponding bone was fixed.
- Candidate06: pins every source-supported lower paw contour before diffusion.
  Native03 measures about 0.000055 native pixels of residual contact error in
  the completed planted frames. It then correctly refuses a chest face at the
  additional hit-peak pose. Visual strike inspection also exposed a reopened
  body/upper-leg attachment, so this candidate is not accepted.

## Admission

Final evidence must bind the exact source and candidate, pass source/rest checks,
exercise 1,201 poses across the full ten seconds, measure the rendered paw
contours as well as bones, and remain below 2 ms per creature update. Captures
must independently establish 60 Hz pacing and encoded frame count, both battle
roles, all choreography phases, head/jaw/ear/tail movement and exact endpoints.
Numeric checks do not confer Nick's visual acceptance. The actual ten-second
Civet, fox and procedural films are the C2 review deliverable.

## Native04 and the added surface-continuity check

Candidate07 passes the current native rest, dense-pose, painted-paw and CPU
gates: 1,201 samples each; rest/final rest zero changed channels; CPU p95
1.10/1.30/0.40 ms for Civet/fox/procedural; largest planted paint drift below
0.000064 native pixels. This is DIAGNOSTIC_PASS on uncommitted source.

Full strike images still show opened shoulder/body cuts on Civet and fox. This
is a visual failure, not acceptance. The previous bone-ancestor cut inventory
omitted proximal skin contacts between neck/fore-upper and tail-root/hind-upper
because those bones are siblings. Bone hierarchy and continuous body skin are
different relationships. The next intake derives complete source-alpha
adjacency, shares proximal body-to-upper-limb skin and preserves separate
limb-to-limb/distal surfaces. It creates no bands or new source pigment.

An independent source-join probe will compare actual published mesh positions
on both sides of each admitted attachment, using all affine breakpoints along
the source edges. This closes the gap left by positive-triangle/contact checks,
which cannot establish that separately posed surfaces remain joined.

## Candidate10 and Native06

Candidate08 closed the missing source attachments. Native05 passed Civet and
then correctly failed Fox at 2191.6667 ms: three folded triangles between named
poses. Candidate09 admitted proximal limb influences on the axial surface,
fixing those folds but retaining severe hip compression. Candidate10 also lets
limb surfaces inherit the axial/proximal muscle transforms shared by their
sockets. Distal Ankle/Paw influences stay branch-exclusive and original paw
pins stay fixed. This removes the abrupt influence-space boundary at shoulder
and tail/hip cuts. Geometry, atlas, solver profile and motion curves are unchanged.

The exact current producer export is preserved under `current-producer-poses/`.
Candidate10's `current-pose-quality.json` covers all 3,603 resolved poses and
actual Float32 part geometry. The same qualifier rejects Candidate08 at the
retained Fox failure. Source joins, rendered contours, strain and trajectory
measurements remain separate; positive area does not establish attractive shape.

Native06 is **DIAGNOSTIC_PASS** for all three on the dirty source snapshot:

| Subject | Rest / final changed channels | Dense poses | Whole creature CPU p95 | Largest source-join gap |
| --- | --- | --- | --- | --- |
| Civet | 0 / 0 | 1,201 | 1.10 ms | 0.000130 px |
| Fox | 0 / 0 | 1,201 | 1.30 ms | 0.000132 px |
| Procedural | 0 / 0 | 1,201 | 0.40 ms | 0.000064 px |

CPU now includes motion sampling, contact solving and geometry publication;
publication-only timing is separately labelled. The old timer's omitted stages
have slow-sampling and slow-IK negative controls. The earlier visible Fox foreleg
paint strand is gone in Native06 strike. Full motion, source transitions and the
three clean-source films still require inspection; no visual acceptance is claimed.

The current check receipt includes 100 passing Node tool tests, 15 passing
runtime tests, typecheck and root validation. Root validation reports all 1,010
Earth renders clean and the unchanged fifty-probe determinism fingerprint.
`UNIVERSAL_ANIMATION_PLAN.md` records Nick's whole-animal goal and the actual
coverage boundary: two authored masters and one procedural quadruped, with
other families and ordinary-game integration still requiring real adapters.

## Temporal handoffs

The full-motion preflight found two consumer discontinuities that named stills
and positive triangle checks cannot detect. At an epsilon of 0.00001 ms,
releasing the planted solver moved the source field by 45.51 / 54.70 / 8.20 px
(Civet / fox / procedural). Replanting at return end moved it by
10.09 / 11.08 / 0.32 px. The second turn also restarted a different idle phase,
causing 13.37 / 94.89 / 25.13 px jumps. `transition-before/` retains the actual
current-producer probe and source receipt. The fast impact keys and hitstop
boundaries themselves were continuous; they are not being weakened.

The consumer repair carries the same subject idle clock across both roles and
smoothly releases/reacquires the admitted contact correction inside the existing
approach/return windows. It does not edit the producer's creature curves, approved
beat timings, source paint or 8% bound. `transition-after/` now measures only
0.00000012–0.0000045 native pixels across the previously discontinuous boundaries
at the same epsilon. The old jumps remain failing controls. Tests also establish
exact grounded-solver equality, refused over-bound endpoints and identical
explicit-time poses after 30/60/120 Hz histories.

The v2 pose export and Candidate10's `current-pose-v2-quality.json` pass all
3,603 dense poses plus thirty named observations under the corrected consumer.
Native qualification and films must use this new source snapshot.

## Sampling guard and first live film

Native07 passes all three current-consumer subjects: exact rest/final rest zero
changed channels, 1,201 poses each, joins and painted contacts within their
unchanged bounds. The default decoder now builds a disposable sampling texture
with one-texel opaque neighbor guards only at proven shared skin cuts. It never
rewrites original PNG bytes, atlas layout or independent limb silhouettes.
Actual procedural strike samples at `[827,947]` and `[840,948]` change from
alpha 192/191 in Native06 to 255/255 in Native07; all three rest images remain
pixel-identical. The original bilinear rendering is retained as the control.

`motion-01` records the first actual ten-second Civet film, but is **FAIL**:
60.003 fps, 608 encoded frames and validated audio pass, while inclusive creature
CPU p95 is 2.50 ms (rig publication 2.40 ms), above the unchanged 2 ms limit.
The runner correctly stopped before fox. The film and its MP4/contact-sheet
inspection derivatives are diagnostic evidence, not a passing final capture.
The next repair compiles repeated interpolation/shape-solver work once while
preserving motion, the shape profile, timing thresholds and artwork.

The local checkpoint is staged but three signing attempts were refused by the
1Password agent, including the configured signer in an interactive terminal.
No unsigned fallback or GitHub write occurred. Clean committed qualification
waits for Git/SSH signing approval. Diagnostic development remains separate.

Qualification and full-motion review results follow on clean committed source.

## Live CPU optimization and profile

`cpu-kernel-01` compiles invariant solver topology and removes redundant pinned
work, with identical output bytes and statistics on 3,633 current poses in both
Float32 and Float64. Its CPU microbenchmarks improve 6–8%; they do not establish
live frame performance. A separate part-interpolation experiment was slower,
was not adopted, and is retained under `performance/part-kernel-experiment`.

Native08 passes all three creatures on this source. The profiled `motion-02`
run passes Civet at 60.003 fps / 1.70 ms inclusive p95, but Fox hits exactly
2.00 ms and correctly fails the strict under-2-ms budget, stopping before the
procedural capture. Both films and CPU profiles are retained. `cpu-summary.json`
attributes the dominant cost to the shape solver. Profiling can affect timing;
final clean qualification must run without the profiler. No threshold, solver
profile, pose curve or source artwork has been relaxed.

Final focused checks at this stage: 106 Node tests, 15 runtime tests, and the game
typecheck pass; separate logs are in `checks/final-*`. Later performance changes
must repeat affected checks before their own native evidence.

The second bounded kernel change (`cpu-kernel-02`) compacts movable solve rows,
retaining vertex order, every addition/division, pins and iteration counts. It
preserves all 3,633 current poses byte-for-byte in Float32 and Float64 with
identical solver statistics, and improves CPU micro medians another 5–7%.
107 tool tests, 15 runtime tests and game typecheck pass on this source
(`checks/kernel02-*`). Native09 and an unprofiled full capture are next; these
microbenchmarks do not replace either.

Native09 passes rest/final-rest0 and the dense gates on all three subjects
(1.00/1.20/0.30 ms gate-loop p95). The unprofiled `motion-03` still fails on Civet
at2.20ms despite60fps, stopping before Fox. Retain it as evidence that profiled
or tight-loop timings do not establish the actual paced budget. The installed
Clang supports the WebAssembly target but no WebAssembly linker is installed;
no compiler package/backend is added. A final bounded numeric fast path is
being evaluated with explicitly measured rounding differences, unchanged solver
profile and exact hard pins. No passing final film set is claimed.

Kernel03 preserves every actual Float32 field/part vertex over all3,633poses;
Float64 difference is at most9.85e-13nativepx. Exact no-progress termination
removes141 redundant Fox sweeps without changing published geometry.110tooltests,
15runtimetests and typecheck pass. Native10 passes allthree gate subjects, but
unprofiled `motion-04` still fails Civet60fps/2.20ms. Its retained per-frame
arrays show late-turn cost (last second mean2.175ms), so a cold-start-only remedy
would not explain this result. No later creature was captured after the failure.

The next bounded implementation compiles only symmetric arithmetic sweeps with
the already installed Clang. A relocation-free single-function Wasm object can
be admitted by a strict export builder without adding a linker or dependency.
All shape/constraint/motion logic remains under the existing owners; actual
output parity and live timing must qualify the compiled leaf before acceptance.

## Compiled sweep and paced capture — Kernel04

The memory-only compiled sweep uses the installed Clang and a strict single-leaf
export builder; no linker, software purchase or dependency installation was
needed. Actual runtime diagnostics record the backend on each loaded rig.
Kernel04 keeps every field/part vertex and solver statistic identical across
3,633 poses in both precisions. Its focused checks pass: 115 Node tests, 15
runtime tests, game typecheck and root validation (including the unchanged
50-probe deterministic fingerprint).

Native11 passes all three subjects at rest/final-rest zero changed channels;
all30 named PNG files are byte-identical to Native10. The unprofiled Motion05
film passes Civet at60.002fps /1.8ms inclusive creature p95; Fox reaches2.1ms
at60.002fps and fails the unchanged strict under2ms budget. The runner stops
before procedural. Full timing arrays remain in the report. These diagnostics
are not clean signed-source qualification or Nick's visual acceptance.

Kernel05 is the next bounded optimization: the same compiled leaf includes
normal-range local rotation and right-hand-side arithmetic. Extreme numerical
ranges must return before changing positions and use the robust JavaScript
path. Exact geometry parity, deliberately corrupted leaf controls and actual
unprofiled films must establish its result. No iteration, pose or budget change.

## Kernel05 — all three diagnostic films meet the measured budget

The guarded compiled normal pass preserves every field and part vertex and
solver statistic across3,633 poses in Float32 and Float64. Its deterministic
rebuild is byte-identical. Controls reject a corrupted arithmetic instruction,
missing/denied Wasm and late numerical refusal without publishing a partial
position; the robust JS path remains available. Actual live counters distinguish
normal compiled passes from robust fallbacks.117 Node tests,15 runtime tests and
game typecheck pass; see `checks/kernel05-*` and `cpu-kernel-05/README.md`.

`native-12/report.json` passes allthree at1,201 dense samples, rest/final-rest
zero changed channels. All30 named native PNG files are byte-identical to
Native11 (`native-12/image-parity.json`). The actual loaded runtimes use the
compiled leaf with zero robust fallbacks on these samples.

`motion-06/report.json` is **DIAGNOSTIC_REVIEW**: allthree unprofiled ten-second
films meet60fps and the unchanged strict under2ms inclusive creature CPU p95:
Civet1.6ms, fox1.7ms, procedural0.9ms. Media frames and decoded audio validate.
Earlier red films remain evidence; no thresholds, iteration counts, motion
curves, artwork or final-rest requirements were relaxed to obtain this result.
The original WebMs and viewing MP4 derivatives are retained beside their hash
receipts. No further performance loop is scheduled without a new finding.

These films use the recorded dirty working-copy snapshot on signed base
`b79fd32e`; they are not a clean committed qualification and are not Nick's visual
acceptance. Three signing requests were refused by the 1Password agent. The
configured public identity matches the one listed by the agent; the refusal's
cause remains unresolved, and no visible approval prompt has been confirmed.
No unsigned commit or GitHub write occurred. Clean signed-source gates and films
remain the next qualification step once signing works.

The universal delivery plan is `UNIVERSAL_ANIMATION_PLAN.md`. The current real
proof envelope remains Civet, fox and one procedural quadruped; other families,
source-bound turning views, two articulated opponents in the ordinary game,
and physical iPhone performance have their own stated acceptance requirements.

## Viewing and final validation receipt

Root validation also passes on Kernel05 (`checks/kernel05-root-validation.txt`):
1,010 Earth renders,43 biome profiles, zero boot/render errors, and the unchanged
50-probe v1.0 fingerprint. The selected MP4s are under `motion-06/viewing-cfr/`;
allthree fully decode with zero error output and strictly increasing frame times.
They normalize playback to60fps and contain609 frames. They are viewing copies,
not measurement evidence; the608-frame original WebMs and measured frame/timing
arrays remain authoritative. The first variable-frame MP4 copies under `viewing/`
are retained but not selected because duplicate/rounded DTS affected validation.
No original capture bytes were changed.
