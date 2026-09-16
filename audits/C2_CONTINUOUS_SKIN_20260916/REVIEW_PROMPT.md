# Consolidated C2 implementation, motion and universal-plan review

Review this as one package. Start with [README.md](README.md), the evidence block below,
[UNIVERSAL_ANIMATION_PLAN.md](UNIVERSAL_ANIMATION_PLAN.md),
[CREATURE_ANIMATION.md](../../CREATURE_ANIMATION.md) and the C2 sections of the
[codebase reference](../../celestial-frontier-codebase-reference.md). Source and exact-run
receipts take precedence over older status prose. Do not treat an older passing diagnostic
as qualification for a subsequently changed runtime.

Nick's goal is fluid, recognizable, fully animated organisms fighting in seeded biome arenas:
whole-body anticipation, push-off, commitment, strike, impact, recoil and recovery, with coherent
secondary motion. Evaluate whether the delivered motion conveys that behavior. Translation,
part movement or a numeric PASS alone does not establish an animal that feels alive.

## Latest evidence — refresh this block before handing off a newer source

- **Candidate:** `candidate-10/manifest.json`; Civet and fox authored masters plus one actual
  painter-observed procedural quadruped. Source paintings and on-disk atlases are retained.
- **Native gates:** `native-12/report.json` is **DIAGNOSTIC_PASS** for all three subjects with
  the actual Kernel05 Wasm normal-pass leaf: **1,201 poses each**, zero changed rest/final-rest
  RGBA channels, rendered contact, source joins and gate-loop budgets passing. Actual normal
  passes are **4,844 / 4,840 / 4,840** for Civet / fox / procedural, with **zero robust fallbacks**.
  This remains diagnostic evidence bound to the report's exact source snapshot.
- **Paced capture:** unprofiled `motion-06/report.json` is **DIAGNOSTIC_REVIEW** with all three
  admissions passing the unchanged strict **<2 ms** limit. Watch all three ten-second films:
  [Civet](motion-06/civet-10s.webm), **60.003 fps / 1.6 ms** creature update p95;
  [fox](motion-06/fox-10s.webm), **60.002 fps / 1.7 ms**;
  [procedural](motion-06/procedural-10s.webm), **60.002 fps / 0.9 ms**. Each encoded film has 608
  video frames and about 10.2 seconds, with finite, nonzero decoded audio. Audio is labelled
  provisional presentation, not C3 listening acceptance. This is a diagnostic three-creature
  film set; clean signed-source qualification and human visual acceptance remain pending.
- **Arithmetic comparison:** `cpu-kernel-05/report-final.json` compares all **3,633 poses**
  with Kernel04 in both Float32 and Float64: field buffers, rendered part buffers and statistics
  are identical; rest and hard pins are exact and the actual backend is Wasm. Original sources,
  profile, shape, contact and motion limits remain unchanged. Earlier comparisons and failures
  remain retained. Microbenchmarks do not establish paced performance.
- **Focused checks:** `checks/kernel05-node.txt` records **117 Node tests**;
  `checks/kernel05-runtime-vitest.txt` records **15 runtime tests**; game typecheck passes.
  `checks/kernel05-root-validation.txt` passes, including the unchanged 50-probe fingerprint.
- **Completed bounded optimization:** Kernel05 moves local rotation, RHS assembly and symmetric
  sweeps into the installed-Clang Wasm leaf. JavaScript retains guarded fallback, input validation,
  orientation projection, contacts and final shape/publication checks. Non-identity semantic
  admission rejects the mutated bytecode control. Motion, topology and the solver profile are
  unchanged. No further optimization loop is planned; review the films and then obtain unchanged
  clean signed-source native gates/captures once signing works.
- **Qualification hold:** three local signed-checkpoint attempts were refused by the 1Password
  agent, including PTY; no new commit exists. Nick has been asked to resolve the refusal, but
  no actual Git-signing prompt is confirmed. A read-only check matches the configured public
  key to one listed agent identity; the cause remains unresolved despite the unlocked report.
  Do not bypass signing or relabel dirty diagnostics. Final clean signed films, Nick's visual
  acceptance, ordinary-game promotion and universal coverage remain pending.

## Review the implementation and retained negative controls

1. **Paint and topology.** Verify original master and atlas hashes, accepted anatomy, material
   ownership, exact source interpolation, real originating faces, part order and depth. Skin
   attachments come from source-owned paint, including proximal axial/upper-limb boundaries
   whose bones are siblings. Distinct limbs and distal occlusion contacts must stay separate.
   Check C03 as the continuous-field control, C06's detached proximal joins and C07's missing
   proximal body-skin attachments. Neither positive triangle areas nor bone ancestry alone
   proves a continuous animal. Inspect the independent source-join observer and narrow-gap
   negative control, including its observational treatment of unrelated overlaps.
2. **Skin solve and optimization.** Check folds, collapsed/thin faces, overflow, atomic refusal,
   exact rest, hard pins and the closed solver profile. No threshold, iteration profile, anatomy,
   creature curve or source paint may be changed to produce a timing PASS. Review the kernel03
   numerical comparison and its visible-displacement mutant. For the Kernel05 Wasm normal-pass
   leaf, require bounded validated memory/export handling, non-identity semantic admission,
   atomic robust fallback and the same complete published outputs and constraints; compilation
   alone is not evidence of correctness.
3. **Sampling across cuts.** Compare the retained Native06 unguarded procedural strike with
   the guarded result: the same two opaque internal samples improve from alpha 192/191 to 255/255.
   The disposable one-texel guard must copy exact adjacent-owner opaque RGBA only across proven
   shared-field joins, leave originals/layout intact, and avoid outer silhouettes, nonopaque
   paint and independent limb boundaries. Verify exact full rendered rest before and after
   motion. Retain the old 0.75 alpha-over result, unshared-field, silhouette and immutable-source
   controls. The guard cannot conceal geometric separation or supply missing painted anatomy.
4. **Contact and transition behavior.** Check actual deformed paw contours, including fringe,
   separately from bone positions. Preserve perspective/raised-paw offsets, the one-native-pixel
   rendered-contact limit and unchanged 8% compression bound. Keep the fixed-bone/moving-skin
   negative control. Inspect support release and replanting through the existing approach and
   return windows, plus epsilon-sized samples around transitions. One seeded idle must continue
   across both battle roles and pause during both hitstops. Role changes must not reset its phase;
   intentional impact keys must not be softened to hide a consumer discontinuity.
5. **Runtime contract and determinism.** Check CreatureRigV1/PoseTarget joint names, radians,
   body-length offsets and root-only displacement against the pinned GSAP producer. All frames
   use explicit time; sparse keys reset, failed samples do not partially publish, and replay
   does not use a generation clock or new RNG draw. Review missing/foreign joints, bad hashes,
   switched candidates, malformed profiles, overflow, backwards time and disposal controls.
6. **Timing and evidence admission.** Creature CPU timing includes producer sampling, support/
   contact solving and geometry publication; rig-only timing is separate. Require live 60 Hz
   pacing, independently decoded ten-second duration/frame count and strict update p95 <2 ms.
   Review the retained slow-producer/slow-IK controls and late-turn timing arrays. A 60 fps video
   can still fail CPU admission. No profiled run, dense loop, warm-up assertion or cherry-picked
   interval may replace the complete unprofiled capture. Verify every consumed file, candidate,
   generated bundle and served asset against the prior qualifying source snapshot.

## Watch the actual motion and painting separately from the numeric gates

Watch all three Motion06 ten-second diagnostic films named above at normal speed; each exists
and has passed capture admission. Earlier stopped attempts remain historical evidence. Inspect
strike, recoil and transition frames at native size and in their actual battle presentation.
Compare the subject with its original master and the accepted rain-E painting beside the arena.

- Does the Civet remain recognizable and painterly through idle, push-off, strike, recoil and
  return, without hard cuts, holes, spikes, rubbery collapse or smeared face/torso markings?
  Do head, jaw, ears, tail and all four legs move with purposeful coordination?
- Do paws stay visually planted in idle/hit and leave/return during the lunge? Does the body
  carry weight, rather than merely slide while the limbs move?
- Do fox and the procedural specimen reuse the same template, compiler and curves with zero
  creature-specific motion edits? Are their proportions and actually painted materials retained?
- Does the staged turn show approach, commitment, hitstop, Wild impact, short shake, damage and
  recovery at the approved tempo? Evaluate contact with the opponent, facing, scale, overlap,
  arena grounding and legibility alongside the effect and audio timing.
- Treat the authored view honestly. An animated side-view head does not prove looking behind,
  a complete body turn or a convincing bite. Those behaviors need suitable source/view coverage,
  mouth/occlusion articulation and observed action/contact. Do not infer them from moving joints,
  a mirrored portrait or the standalone aim helper; actual gaze/view declarations remain absent.
- The Platypus opponent is still **labelled portrait staging**. This study does not demonstrate
  two articulated fighters. Production needs two independently animated combatants using their
  admitted anatomy, clips and contact behavior. Keep provisional sound presentation separate
  from approved recordings, listening acceptance and complete audio coverage.

Nick owns final image/motion acceptance. Report numeric correctness and human motion/art judgment
as distinct outcomes; neither can substitute for the other.

## Review the universal plan against real coverage

Use [UNIVERSAL_ANIMATION_PLAN.md](UNIVERSAL_ANIMATION_PLAN.md) as the direction and current
boundary. The real proof inventory is **two hash-bound authored masters and one four-legged,
banded-tail procedural organism**, seed 1597751321, owner
`resolveProceduralCanvas:quad/faunaQuadruped`. Loader, part-mask intake and planted-contact
admission still use the quadruped graph. Fourteen motion-template names and synthetic pose sheets
do not establish fourteen working painter/rig integrations.

Check the plan's shared runtime, anatomy-specific templates and winning-painter emitted records
against `LOG-A11.md`/`LOG-B.md` under `../LONG_SESSION_20260913/` and the actual painter routes.
Record concrete missing adapters for reset Earth mammals, other tails, additional leg pairs,
pinnipeds/gliders and nonquadruped families. Fixed fore/hind naming cannot represent extra pairs.
Bird/insect wings, fish fins and flukes, radial/cephalopod arms, myriapod legs and plant branches
must match the actual painter's counts, materials, joints and supported medium; no missing part
may be silently invented or routed to a generic quadruped. Source-bound alternate views, extreme
proportions, real procedural reuse, ordinary-game integration and physical-phone performance each
need their own qualification. The required production endpoint is two animated fighters, not a
universal-coverage claim from this three-specimen desktop study.

## Reviewer commands and execution boundary

From the repository root, read the current local identity without fetching or writing GitHub:

```sh
git branch --show-current
git rev-parse HEAD
git status --short
git rev-list --left-right --count origin/openai/mac...HEAD
```

The focused pure/tool tests do not acquire the checkout lock:

```sh
node --test port/v2/tools/creature-animation/*.test.mjs port/v2/tools/quadruped-proof/*.test.mjs
```

Then, from `port/v2`, run the focused runtime checks and game typecheck:

```sh
./node_modules/.bin/vitest run apps/game/src/creature-rig.test.ts apps/game/src/creature-rig-contact.test.ts apps/game/src/creature-rig-frame.test.ts apps/game/src/creature-rig-performance.test.ts
./node_modules/.bin/tsc --noEmit -p apps/game/tsconfig.json
```

For source provenance, inspect each report's `sources`, `candidate`, `captureSnapshot`,
`dirtyAtStart` and diagnostic status. Re-hash actual consumed files; distinguish an archived
snapshot from current edited source. The read-only producer's `motion/gsap-adapter.ts` is pinned
to SHA-256 `6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74`.

Native reproduction is a separate coordinated action after the signing/clean-source hold clears.
Use new output directories and unchanged committed source between gate and capture. Do not launch
it during this read-only review or automatically retry a red run. The runner owns the browser and
its workspace lock; unit tests must never take that lock. On macOS its browser-owning invocation
requires the normal approved out-of-sandbox execution. Command templates, from the repository root:

```sh
node port/v2/tools/quadruped-proof/parts-motion-runner.mjs NEW_GATE_DIRECTORY READ_ONLY_PRODUCER_SRC --skin-gates --candidate=EXACT_CANDIDATE_MANIFEST
node port/v2/tools/quadruped-proof/parts-motion-runner.mjs NEW_CAPTURE_DIRECTORY READ_ONLY_PRODUCER_SRC --skin-parts NEW_GATE_DIRECTORY/report.json --candidate=EXACT_CANDIDATE_MANIFEST
```

`--diagnostic` binds a dirty snapshot for investigation; it is never an alternative to clean
qualification. `--cpu-profile` is diagnostic-only and does not replace unprofiled paced evidence.

## Requested review response

Return one consolidated list ordered by severity. For each finding give the source path/line or
creature, video time and frame; expected versus observed behavior; whether it is reproduced; the
missing/failing negative control; and the smallest bounded repair. Separate confirmed code or
evidence defects, human motion/art concerns, unimplemented universal-plan work and proposed kit/
new-view changes. State exactly which source/report was reviewed and whether clean qualification
and all three required films were available. Preserve failures and historical evidence.

Do not repaint, modify masters, change approved kit wording, invent completion, or implement changes
in this review. GitHub step is none; PR42 stays parked. No push, label, dispatch, merge, release,
deployment, new branch or history rewrite is authorized by this prompt.
