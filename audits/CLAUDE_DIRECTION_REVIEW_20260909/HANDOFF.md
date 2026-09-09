# Claude review — new game direction and accumulated implementation

Prepared September 9, 2026 for Nick's explicit request that Claude review **all changes since its
last review**, including the new game direction. Actual Claude completed its read-only review of
signed `8bdbea9a65b1f64c09906fd99589d75e5d8bc50a` at12:49UTC: **no merge yet**, with explicitly
limited inspected scope. [Original response](CLAUDE_RESPONSE.md), [receipt](CLAUDE_RECEIPT.json),
[all finding dispositions](REVIEW_DISPOSITION.md) and [native visual clarification](NATIVE_VISUAL_RECHECK.md)
are retained. The correction successor is not automatically covered by that source review.
Follow ROADMAP.md and PARALLEL_GIT_PROTOCOL.md from each agent's own correct workspace.

## Prior review baselines — scope before this requested review

- Latest completed Claude response before this request: September 6 U2 review of executable
  `3a61352fb1ba5348d1a73ee4d6e7ce33f1f2967d`, product
  `3f1578e2e416cf5e566e1f799c16ea0a081ae037`. The retained
  [response receipt](../UI_U2_CLAUDE_REVIEW_20260906/RESPONSE_RECEIPT.json) records the exact supplied
  response hash. Claude confirmed the instrument diagnosis, found no product defect in that
  narrow review and judged the unfinished draft **not ready**. It ran no tests/browser.
- Latest broader review before this request: September 4 `develop`
  `7bf3e84761da2d1abe21dc6fe751b4bad2308f3b`, in
  [the full-project review](../CELESTIAL_FRONTIER_FULL_REVIEW_20260904.md).
  The September 10 review mentioned in older notes was planned, not completed.
- Do not treat the narrow U2 response as a review of all intervening gameplay or later AI work.
  The intended review is the accumulated current candidate, with both baselines available.

## Nick's current vision — material new direction

Celestial Frontier should have an identifiable rich natural-history painting style across the
whole game: fauna, flora, astronomical bodies and universal objects. The approved
[Living Worlds and full landfall references](../MIDGAME_ART_DIRECTION_20260908/README.md)
set the target. Subjects belong inside one painting through common lighting, atmosphere,
contact shadows, grounded anatomy, vegetation overlap and consistent detail. A cutout animal
placed over an unrelated background does not meet this direction.

Landfall now means a **large, cohesive static composition**, potentially containing multiple
canonical organisms. Moving individual residents in this landing painting is unnecessary now.
The same complete individual identities go to Compendium and their appropriate categories;
flora healing/effects and all other properties come from game data. Future battles should use
articulated 2D sprites with posing/overlap/scale suggesting depth, in the spirit of older Pokémon
battles. Shared anatomy and family rigs must account for land, flying and aquatic animals;
whole-image recoil is not sufficient, and one Civet animation does not prove universal rigs.

Earth fauna and flora retain their named anatomy, proportions, markings and growth habit.
The Earth reference sheet's generic berry bush cannot replace Cranberry runners, a Persimmon
crown/fruit, or Devil's Club canes/leaves. Alien flora can use coherent fans, pods, porous tissues
and branching forms, governed by the seeded form/color/biome. Reference sheets are visual
inspiration, not instructions to overwrite canonical species. Full genomes, ordered lineage,
biome mappings, Earth rules, deterministic identities and accepted UI placement stay binding.

The **browser game remains a proof of concept for a future engine game**. Nick specifically
wants on-demand local AI generation during play without requiring players to install separate
software. Matching the approved reference quality is a hard requirement; a successful model
run or fast image does not qualify the model. A native engine switch, online generation service,
or pre-generated library of millions of pictures has not been selected.

Nick also wants planetary rotation/daylight and eventually seasonal/orbital conditions to affect
appearance, plus shareable discoveries. Current day/dusk/night is seed-fixed, and cosmetic
orbits do not prove seasonal simulation. CF1 shares location; exact time-specific image sharing
and native creature sharing are not implemented. Versioned appearance recipes must preserve
replay and identity without changing the deterministic game or active-play clock laws.

Storage should be bounded and responsive to actual device/storage capability. Provisional
500MB/1GB caches and larger desktop choices are under investigation. Cache size is not total
model/download size. Sole original discoveries must not silently disappear when capacity fills;
recreation from a seed is not proof of exact original-pixel recovery.

**Newest Land interaction:** clicking Land should queue preparation, replace its button in the
existing UI position with “Landing” progress and an ETA, and allow other activities while it runs.
Completion should notify the player and offer an explicit return to that planet. It must not
steal navigation or keep the save transaction open. Exploration, fleet management and
Compendium are proposed activities already aligned with the game; no new reward economy or
fake waiting minigame is approved by this direction. Multiworld scheduling, background-tab
GPU behavior, durable-job recovery and original-image retention still need implementation.

## What changed since the narrow U2 review

The source at `ff1669a2b7906a362f985cd810c6592834857caa` contains 19 commits after the reviewed
U2 executable. That source precedes the progress/shape experiment in this packet.

| Area | Implemented scope | Practical limit |
| --- | --- | --- |
| UI/gameplay presentation | Survey/Close evidence correction; Scout landing presentation tied to durable results; Chronicle battle staging; Charter settlement audio and compact preview | Older U2 instrument and native admission gaps remain; placement/Training/save authority unchanged |
| Space graphics | Protostar, magnetar and generated third-star graphics; optional finite Earth turn/material, canonical painted Mars, inhabited two-layer Earth | Finite Earth turn is not a seamless rotation; broader art/biome conflicts remain |
| Static landfall foundation | Optional `?paintedlanding=1` opaque Earth/Civet painting, all-19-genome admission, accepted DOM band, fallback/cancel/leased cleanup | Single supported Earth study; separate from `?livingvista=1`; not universal generation |
| Creature authoring | Selected rich Civet, alpha extraction with Nick's explicit ImageMagick authorization, cohesion/water/articulated studies, shared mathematical kinematics | Fine edges and fluid family locomotion unqualified; static landfall decision ended bespoke resident-motion rework |
| Audio | Combat duck/recovery smoothing (25ms/90ms) with overlapping combat ownership; native offline DSP evidence | No physical speaker/headphone/mobile human listening acceptance |
| Painted loader | Enforces the existing 8-second monotonic boundary and cancels retired work | This old static-loader deadline is separate from long AI generation |
| Canonical appearance | Versioned detached immutable snapshot exported from actual live branded roster: complete 19 genomes and six display identities | Exact Earth epoch0 only; detached JSON cannot grant live roster authority |
| Scene storage | Pure advisory reserve-aware LRU planner, 500MB/1GB/2GB profiles and bounded desktop override, verified surviving copies and protected originals | No deletion executor, atomic cross-tab storage, player setting or device qualification |
| Local AI proof | Actual sequential browser WebGPU model stages, reference conditioning, deterministic pipeline math, hashes/licensing, cancellation, worker/bitmap/canvas cleanup | Development proof only; no embedded/shipped model or accepted artwork |
| Performance | Verified Q8 block128→32 derivative preserves represented operands and reuses original shards | One Mac/recipe speed result; GPU accumulation changes raw pixels from original graph |
| New landing prototype | Page-owned Land/progress/ETA, journal navigation, completion notice and explicit return; opt-in fixed denoiser shapes | Isolated proof, no normal-game landing/save hook or persistent multiworld queue |

For a broader refresh, September4→U2 also includes save/focus hardening, isolated diagnostic
builds, bounded CI lanes, the fresh-start v2 decision, research/expeditions and Batch4 progression,
U1 responsive shell/notification history, and U2 measured sheets/Training Settings. Review the
actual diff from the broader baseline rather than assuming those systems were re-reviewed.

## Six checkpoints after parked PR42

PR42 last published head is `9bfec7dc4a06d97dfd29f8f5424553336776c9fb`. These completed signed
local checkpoints had not been pushed when this new batch started:

1. `ceb107fdcf6f33f8d60cfd071fbea907a4bb68df` — browser AI proof, audio and loader.
2. `5dcd6e64801cf44c0c55da47c41fbcc9d8408e99` — verified Q8 repack and profiling.
3. `c430380fcec424b2d03c71afd9e12858086f77e0` — canonical appearance snapshot bridge.
4. `e7157ec204f7f2bec5934fd4b80344a9e0d9e298` — protected advisory scene-cache planner.
5. `acfbce776ff10dda0a6d476bbb795b878803bfcc` — reference cleanup and identity-only experiment.
6. `ff1669a2b7906a362f985cd810c6592834857caa` — documentation/signature handoff.

The successor containing this packet adds the landing prototype and fixed-shape experiment.
Its exact checkpoint and measured verdict will be recorded in the final local handoff.

## What the local AI evidence actually proves

The ignored developer cache contains 20 pinned runtime files totaling **6,691,020,416 bytes**
(6.23GiB) plus a 7,792-byte README. ORT Web1.29.0 runs the pinned FLUX.2 Klein4B model through
text → reference encoding → four denoising steps → image decoding, using a separate owned
worker per graph. The block32 derivative adds352,323,881bytes (~336MiB). These are developer
artifacts, not a selected player download. CPU-assigned operators are retained in the warnings.
No phone/browser fleet or cold-download qualification exists.

The earlier same768 recipe fell from about239seconds to69seconds after Q8 repacking.
The latest identity-only1024×576 baseline took69,948ms on this M4 Pro24GiB Mac: text12.47s,
reference preparation/encode1.12s, denoise51.83s, final decode4.31s. Those timings include local
stage loads but exclude initial download and the runner's prior hash verification. They are not
an all-device ETA or a guarantee about foreground gaming performance.

**Every generated candidate is still rejected for production.** Native-resolution recheck of the
latest identity-only output finds one visible head/tail and improved dry-bank grounding, but
ambiguous body/leg attachment and proportions/face drift. “One coherent Civet” was too strong;
Claude's proposed second head is also unsubstantiated. Platypus and named botany remain wrong.
Earlier candidates duplicate/fuse Civets
or place feet in water. Quality remains `false`; there was no seed sweep, retouch, or promotion.
See [all raw runs, original failures and visual reviews](../LOCAL_AV_AI_CONTINUATION_20260909/README.md).
The fixed-shape experiment must retain the same weights, references, dimensions, four steps,
noise seed and arithmetic; success requires its actual runtime overrides and output comparison,
not a declared option alone. Results belong in this packet's batch evidence.

## Verification and review priorities

The prior clean integration head passed4,121tests/one skip and the browser-free develop profile.
That result does **not** certify the later accumulated head. Later scoped evidence includes
268audio tests/six DSP renders,17converter+38bridge controls,33snapshot/Earth/roster tests,
24cache planner tests,30controller tests/six native reference scenarios/10 observer controls,
and20conditioning controls. The current packet records its additional checks separately.

Please review in this order:

1. Does the architecture credibly reach Nick's target painting quality and exact individual/
   botanical fidelity? Identify model/conditioning blockers without lowering the art bar.
2. Does the prototype queue/progress use actual completed work, preserve cancellation, keep
   navigation responsive, avoid false completion at step4/4, and state ETA limits honestly?
3. Is the path to normal gameplay safe: durable landing settles first, separate bounded world-key
   jobs, no stale-world painting/autonavigation, and notices buffered outside active product saves?
4. Check canonical data authority, original retention/cache failure behavior, tensor math and
   resource ownership. Speed must not silently change identity, resolution or generation steps.
5. Review accumulated gameplay/graphics/audio scope and documentation; call out missed Guide/
   Training/release surfaces if a player-facing normal-game capability changed.
6. Give findings with severity, exact file/line and reproducible evidence; separate confirmed
   defects, risks and product decisions. Give merge/no-merge for the **exact** reviewed head.

Preserve every first red and immutable raw result. Open blockers include full changed-head
Compendium/Slice/Glass admission, old U2 and native resize/exit unknowns, phone/Safari/PWA and
human art/audio checks, D-9e habitat/painter/profile conflicts, retained-update sizing, original
retention and cache execution, model delivery/quality/device qualification, shared family skins,
seasons and exact-image sharing. SceneMemory stays production-only/quarantined; do not activate.
The iCloud backup's two automatic-review rejections remain; do not retry or recreate schedules.

## Git and safe handoff

Codex owns macOS `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`, tracking
`origin/openai/mac`, SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`.
Fresh develop is `c1791e210158de864fdd475323c3091d9ecbae58`. The first fetch failed once with
**SSH agent communication failure**; this did not establish a locked vault.
[Original failure](REMOTE_READ_FAILURE.json) remains. Nick then reported1Password unlocked;
the distinct recovery attempt passed SSH as TheDakk, repository read, fetch and PR42 read at
12:11UTC. [Recovery receipt](SSH_READ_RECOVERY.json) confirms the same develop and parked Draft
head9bf, with six local commits still ahead before this batch. No push, merge or new Claude
verdict is implied by successful read authentication.

[PR42](https://github.com/TheDakk/Celestial-Frontier/pull/42) is the existing parked Draft,
base `develop`, source `openai/mac`, last-known title “Refine responsive UI and add bounded
audiovisual and painted-world prototypes”. Its title/body need an accumulated-head refresh
before any Ready/owner-label step. Budget mode is UNFROZEN/PUBLIC, private fallback3000;
there are zero new exact hosted-run authorizations. No release/deployment/version bump.

Claude completed the fresh local read-only invocation from its verified Anthropic/macOS
workspace, reading this signed source's immutable Git objects without importing refs, copying
source or merging into its worktree. No fetch, hosted action, test/build, source write or existing
session reuse occurred. The exact request, original CLI response and invocation/signature receipts
are retained in this packet. Nick does not need to open Claude now to obtain this completed review.

Codex keeps the correction and review record signed locally on openai/mac. GitHub step now: none;
PR42 remains parked at its older remote head. Its accumulated title/body must be refreshed before
any future Ready/owner-label step, explicitly distinguishing playable changes from quarantined
qualityAccepted:false AI/storage research and listing exact-head completed/pending admission.
No new PR is needed. After a future verified develop merge, Claude may fetch/merge origin/develop
into its clean anthropic/mac branch; a dirty worktree must first finish or commit its own work.
The read-only review did not install these local changes in Claude's workspace. Develop/main/live
site remain unchanged. Budget UNFROZEN/PUBLIC, private fallback3000, zero new hosted attempts.
