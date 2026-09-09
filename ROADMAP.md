# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — 2026-09-08 · CIVET SHALLOW WATER AND ARTICULATED MOTION

**Latest bounded result:** Nick identified the paws as standing in shallow water, asked to remove
unfinished residents from review, and reported invisible breathing/reset and rigid recoil. The
[current study](audits/CIVET_WATER_AND_MOTION_20260908/README.md) now shows only the painted Civet,
with four narrow borrowed-background waterlines, submerged contact shadows and faint broken
ripples. This supersedes the earlier mud/pebble interpretation. The accepted Civet anchor and native
game roster remain unchanged. Two stronger breath cycles last 6 s, brace/thrust 1.6 s and reaction
1.1 s. Twelve local neck/leg/tail transforms preserve four whole planted paw regions while freeing
the lower-left tail. Stop/reset pose is disabled at rest; Creature/Environment tabs keep the subject
beside controls. Width changes preserve the active clip; there is no idle loop.

This improves the one-view study, but **does not finish fluid locomotion or production blending**.
Legs remain planted and somewhat image-deformed; the creature is still warmer/sharper than the
rainy landscape, and fine fringe/whiskers need attention. Separately painted overlapping parts or
a proper 3D rig are needed for hidden limb surfaces, stepping and turning. Human art acceptance,
native integration and the five unfinished residents’ rich painted replacements remain open.
No native Guide/Training/release-note, version, save, roster, RNG, lineage, biome or accepted UI
placement changed. The current game retains its existing painters and whole-portrait battle motion.

**Signing restored:** after Nick confirmed 1Password open, the prior studies committed with a
valid SSH signature as `86ea06b79e11382b62173fbb2ccfc8c90fb37baa` (735 files). The earlier failed
signer remains in its original packet. `SIGNING_RESTORED.json` records both the new success and
default verification’s missing allowed-signers configuration; command-scoped verification using
the existing public signing key passed, with no persistent config change or unsigned fallback.
The new water/motion signed commit subsequently failed with the same “failed to fill whole
buffer” / exit 128 after waiting for signing. HEAD remains that commit, cached upstream 41 ahead/0
behind; the new completed work is staged. `SIGNING_NEW_BATCH_FAILURE.md` preserves this separate
failure. Nick was asked to unlock/approve Git signing and confirm changed readiness for one retry.
No unsigned fallback, persistent configuration change or automatic retry. Resolve HEAD and any
later restored-state receipt; all tested source hashes remain in the packet.
The previous full handoff is archived verbatim at the top of ROADMAP_ARCHIVE.md.

### Current source, art and native evidence

`port/v2/tools/painted-creature/civet-articulated-rig.ts` and its focused test are separate from
the earlier rig. Exact original 29-field Earth epoch 0 Civet genome/seed 3212817920 remains the
admission. The selected calmer 768×512 WebP is unchanged: 179,816 bytes, SHA
`186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365`. All original RGB is retained;
alpha repair and rejected busier generation remain in the preceding scene-cohesion packet.
Current two meshes share one creature texture, with a 49×33 connected grid / 3,072 triangles and
76,248 owned typed-array bytes per mesh. No painted limb separation or hidden anatomy was invented.

[Final results](audits/CIVET_WATER_AND_MOTION_20260908/final-results.json),
[source/still review](audits/CIVET_WATER_AND_MOTION_20260908/SOURCE_REVIEW.md), and
[visual limits](audits/CIVET_WATER_AND_MOTION_20260908/VISUAL_REVIEW.md) are the current entry points.
44 focused rig tests PASS, including complete finite-clip sweeps and mutation controls. Final
study typecheck, runner syntax, three V2 TypeScript programs and root validation PASS: 1,010 clean
named renders, zero boot errors, 50 unchanged original fingerprints. No unchanged rig rerun.

Final native Edge 152.0.4191.66 / CDP 1.3 PASS: desktop 1440×1000@1 and emulated phone 390×844@2,
34 frame observations / 18 control groups / three actual-canvas WebM captures per mode. Real native
buttons complete two breath crests with intervening descent, brace retreat then thrust and tail
travel on the same sequence without cancellation, returning to exact rest pixels. Actual leg ink
moves and all four nonempty paw regions stay bit-exact. Constant-rest, subpixel, rigid-block,
frozen-tail and held-breath controls reject. Real width changes continue motion; Stop resets.
Water toggle changes/restores pixels; eight water faults reject and restoration passes.
All four immersion/ripple/shadow contributions are nonempty. 407,189 unowned background pixels
remain exact; five old residents are absent. Creature luma ratio .905494, alpha preserved.
Water retirement restores pixels, then the live hero sibling is actually rendered. Both mesh
geometries, six buffers, two textures/sources/bitmaps and all owned roots retire; repeat is inert.
Runtime/cleanup errors 0; browser closed. Report SHA
`1d230a9cbded6b5ae256c1dff14672f23869e35af8ccc7331924363efc0cc917` binds ten source inputs.

**First failures retained:** `static-first.json` passed 44 rig tests, then stopped at study
TypeScript MIME/readonly-filter errors. `native-first/report.json` passed desktop motion, then
Water off→on threw because Pixi normalized empty undefined filters to null; phone/water probes/
disposal were not reached. Corrected empty-chain semantics retain strict nonempty foreign-filter
rejection. Final source has new immutable outputs; neither first aggregate is relabelled green.
Source review also corrected exact-paw thresholds, two-cycle proof, completion versus cancellation,
actual resize coverage and explicit geometry buffer destruction before relevant final runs.

This authoring bench alone uses preserveDrawingBuffer/MediaRecorder for actual-canvas evidence;
its framebuffer/recording overhead is not production performance evidence. Isolated desktop/CDP
phone emulation is not physical touch, Safari/PWA or real background qualification. No full
admission, Compendium/Slice/Glass/Recovery, native-heap or human art certification follows.

### Prior study evidence remains binding

The [original Civet packet](audits/CREATURE_PAINTED_CIVET_20260908/README.md) retains 113 rig tests,
final native desktop/phone PASS (eight probes/five control groups each), exact original asset,
two opaque checkerboard generator failures and three alpha-extraction attempts. Native paw-pixel
FAIL, encoded-PNG/raw-RGB analysis FAIL and scrollbar FAIL remain; the first stops did not reach
phone/disposal, and original scrollbar geometry was not fully retained. The original 4.2 s breath,
1 s strike/.7 s recoil rig remains immutable comparison evidence, superseded only in this study.

The [cohesion packet](audits/CREATURE_SCENE_COHESION_20260908/README.md) retains its rejected busy
fur generation, damaged nose/tail matte, selected calmer original-RGB/nose-alpha repair, eight
motion probes/eleven controls per final mode and first zero-alpha legacy-ground-ruler failure.
Its final report SHA is `2707b001df593cbc7d163d556457d95a54bf8d544de5e189b037da179941bbb7`.
Both packets and all original first failures remain untouched by this batch; no automatic red
retry, cloud backup retry or retroactive PASS. Fine alpha and human acceptance remain open.
Earlier 374-file and combined 734-file staging recoveries/readback/reverse-check receipts remain
historical in their packets/smoke paths; signed 86ea06b now contains those completed studies.

### Authority, art direction and exact identity

Nick’s local campaign still ends **2026-09-09T03:11:15Z** (September 8, 23:11:15 Eastern).
Claude review is Thursday, September 10. No extension or broad rework loop. The
`celestial-frontier-48-hour-coding` automation was deleted; **do not recreate scheduled prompts**.
[Campaign authority](audits/AV_24H_CAMPAIGN_20260907.md).

Continue the approved painted universe/creature sheets in PAINTED_SPACE_PIPELINE_20260908 and
biome/UI addendum in PAINTED_SPACE_DIRECTION_ADDENDUM_20260908. The new exact copies/hashes in
[PAINTED_EARTH_AND_ALIEN_FLORA_20260908](audits/PAINTED_EARTH_AND_ALIEN_FLORA_20260908/README.md)
are now reflected in ART_DIRECTION, SPECIES_AND_GENOME, BIOME_ATLAS and the codebase reference:

- Earth fauna retain named anatomy, proportions, markings, natural colors and movement. Earth
  flora retain actual growth habit, branching/crown, leaves, flowers and fruit; a generic sheet
  berry shrub must not replace Cranberry, Persimmon or Devil’s Club.
- Alien flora may have rich fans, pods, fronds, branching clusters and porous tissues, with
  coherent attached growth. Seeded forms/colors, lineage and biome profile remain authoritative.
  Sheet accents and exposed roots are examples, not universal recolor/uprooting instructions.
- Preserve CF controls, emoji, text and placement. UI references are material/graphic inspiration.
  The animal study remains Civet; the Earth sheet confirms its treatment, without a style restart.

### Local review, startup and Git ownership

[Current water/motion review](http://127.0.0.1:58523/) is served by PID 13898 / exec 88960 from
`audits/CIVET_WATER_AND_MOTION_20260908/native-filter-state/dist`, fifteen files / 1,724,943 bytes.
Inventory SHA `a485c8f4fe04876205d229db6d02e41ccf0bd24706418d43dc5a92be22e02e50`.
HTTP 200 exact HTML hash verified outside Seatbelt; app-open queued only. README gives the exact
restart command. Dispose is under Details and requires reload. This is a local authoring review,
not a game preview/certificate. Earlier 58519 (PID 598 / exec 25947) and 58521 (PID 7541 / exec84561)
remain separate unchanged comparisons; their immutable inventories are in their packet READMEs.
Prior Earth game preview restart remains `port/playtests/20260908_EARTH_LAYERED_LOCAL_PREVIEW.md`;
its old port/PID is not reverified by this study.

Verified ownership: **OpenAI/Codex · macOS ·
`/Users/nick/Projects/celestial-frontier-openai-mac` · `openai/mac` · `origin/openai/mac`**.
SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`; retained uninterrupted TheDakk
SSH/authenticated repository-read proof applies. No fresh fetch needed for explicit local work.
Cached `origin/develop` `c1791e210158de864fdd475323c3091d9ecbae58` remains an ancestor.
Ambient `.DS_Store` is untouched/untracked. No other worktree or personal UI inspected.

New-session tool startup completed at 2026-09-08T21:51:58.792Z:
[TOOLCHAIN_STARTUP_20260908_CIVET](audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json).
Official stable check plus scoped outdated were current; no eligible update or changed executable.
ImageMagick 7.1.2-31, FFmpeg 9.0.1_1, Blender 5.2.1, Inkscape 1.4.4, REAPER 7.79, Surge 1.3.4,
Node 26.8.1 and GSAP 3.15.0 retained. REAPER’s active process was not interrupted. Use this receipt
only for the uninterrupted session; fresh sessions follow UI_TOOLCHAIN.md and the shared lock.
Terminal/files and isolated CDP only; browser commands ran outside Seatbelt, under the shared
foreground lock and checkout build lease. No personal UI was inspected or jobs interrupted.

### Prior Earth placement and blockers stay binding

`?livingvista=1` remains the optional painted rainy Earth 133#2 riverbank with separate six-resident
layer, admitted by the full request and all 19 ordered epoch 0 genomes. Exact world:
`CF1|g:999@90,-60|s:424242@560,170|p:133#2`; environment `cwe1:148:50c1b7d6`;
profile `temperate/bpd1-6fce883d4d70e3b6bde0fb184b416e8e`. Residents: Civet/Platypus/Frog,
Persimmon/Cranberry/Devil’s Club. BIOME_ATLAS §1.1/profile allows their fauna families/flora forms;
it is not a universal geographic species database. Global D-9e remains dead, unfixed and gated.

The approved 960×430 pair publishes atomically, fits uncropped above Biosphere with 12 px clearance,
hides only its owned globe/cloud deck, and refreshes after the final camera impulse. Existing
fallback, workers, request/epoch fences and retryable cleanup remain. Native controls are unchanged.
Original background SHA `2993cd8054a2424f20ba24040717acdb17aa9c7157500cd5b945170cd1f625d8`,
130,306 bytes; pair RGBA 3,302,400 bytes before scratch/decode/GPU; optional worker 957,316 bytes.
[Earth review packet](audits/AV_EARTH_LAYERED_SCENE_20260908/README.md) retains 351 focused tests,
three typechecks, art/override/spec/root checks and four final native modes PASS. Its frozen
96-file `earth-layered-settled-evidence-dist-20260908` and 134 prior guard controls remain separate.

Preserve Earth-layer first reds: 285 PASS/1 FAIL publication, 306 PASS/2 FAIL expectations with
possible overlapping art-test edit, 308 PASS then adapter parser red, guard 102 FAIL/21 PASS,
first native policy-null, second native DOM-covered center exit, desktop Y red with unknown
original geometry, and observer offset/source camera-shake diagnosis. Final four settled modes
PASS do not close full admission, physical devices, native heap, Reduced/Effects Off reload,
resize/re-entry, hidden ancestors or position-only chrome changes outside fixed-view qualification.

83-row draft SHA `218f02b5130fe78a6fcf76e898b6372b8761b4ef4bb4590137668920980f0793`;
producer `b62563276984183b933e372242e5cd68426727094f57407f9057f1ff4d8e3ba6`;
measurement `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12` unchanged.
No ceiling/ruler/history rebaseline or full Compendium/Slice/Glass/Recovery. Recovery receipts
including the verified 1,177-file Earth staging snapshot and six predecessors remain in the
archived handoff and `port/v2/apps/game/smoke/earth-layered-staged-20260908.json`. The accumulated
Earth checkpoint is signed `5117b4fa18afeb4869ac459b6f95dfd6a586edc6`; the single original EOF
format warning and historical signing failures remain, superseded only as current signing status.

### Earlier blockers retained

Signed `837db4a` U2 attempt: 324 files, 3,494 tests / 1 skip, then TS6133 red; no browser stage.
The binding was later fixed. `3a61352` small-phone instrument red after 3 Capture outcomes/Charters
Close remains; large-phone/Slice not run. `08cd97d` Milky Way / `c57aaaeb` portrait timeouts remain
unknown. Claude's full review stays in `UI_U2_CLAUDE_REVIEW_20260906/RESPONSE.md`. U2–U4 full
admission/Compendium/Slice/Glass, physical device, human art/listening, 256 MiB retained update,
art-lock CI, ITP and DECISIONS 19 remain open; 128 MiB admission exists. SceneMemory remains
production-only/quarantined; no activation.

Earth turn's first full profile (330 files, 3,742 PASS, 1 skip, 5 FAIL in 4 files) is a stopped
aggregate; focused 104/52/32 and static successes do not replace it. Native owner-aware aggregate
FAIL after phone exit plus desktop resize to an unexpected galaxy remains unknown; re-entry was
not reached; fresh desktop PASS is separate. MissingMeshPipe and renderer-extract observer faults/
corrections remain in AV_EARTH_SURFACE_TURN_20260908. Earth turn is finite: 18 seconds / .22 radian
on a nonperiodic atlas, not a seamless revolution. Material proof remains subtle. Mars composition's
216 tests / four native modes PASS and both first observer reds retain their prior immutable packet.

CF1 world sharing is native; CFB/CFB2 domain codecs are not native creature share/import. Preserve
complete immutable genomes, ordered lineage and versioned recipes. Universe orbits are kinematic,
not established N-body simulation. Unity/Unreal remains future portability; no engine install or
restart. Offline Wolf masters have limited poses/neck strike, no jaw/walking/all families, and
remain below the art bar. Private asset masters' hashes are preserved; an independent 94-file /
24 MB iCloud backup waits after 2 automatic review rejections; no retry/cloud write. The original
Dakk project is untouched; no copied third-party runtime assets.

### Next bounded work and paired handoff

The water/motion study is complete for review; do not repeat unchanged checks or start a broad
animation/family loop. The next bounded art decision is a separately painted overlapping-part
pilot for this same Civet if fluid stepping is pursued; first settle the visible style/edge and
scene softness requirements. That work is not implemented by this mesh study. Native integration
must eventually use one exact-identity recipe across existing Compendium/Chronicle/Planetside
owners, with bounded ownership and actual outcomes. The five old Earth residents still require
individual rich painted replacements with named botany/anatomy. Alien plants retain seeded
architecture/palettes and biome mapping. Campaign deadline remains binding; no extension.

Current side: Codex/macOS/`openai/mac` retains this completed study and durable evidence staged
pending the new signer failure. The previous two studies are signed at current HEAD
`86ea06b79e11382b62173fbb2ccfc8c90fb37baa`, cached upstream 41 ahead/0 behind. The original and
new signing failures remain separate; only a confirmed changed signer state permits one retry.
Full diff format output includes immutable compiled Pixi/raw log warnings; authored source PASS
is recorded separately. No unsigned fallback or persistent signing configuration change.
[Staged recovery pointer](audits/CIVET_WATER_AND_MOTION_20260908/RECOVERY_POINTER.md) identifies
the ignored binary snapshot and exact readback/reverse-check receipt; no patch was applied.
GitHub step: none. PR details: not needed. Future separately authorized path is
`openai/mac` → `develop`, never directly `main`. Actions budget UNFROZEN/PUBLIC, private fallback
3000, exact hosted authority none, attempts/cost 0; no workflow is triggered by this batch.

Other side: Claude/macOS/`anthropic/mac` does not have these unmerged changes; **no need to open
or sync Claude now**. Preserve `173c806` and review the durable packet Thursday. Only after a
future authorized exact `develop` merge should Claude fetch/merge `origin/develop` into its own
clean branch. No manual copies or messages to Claude, develop/main promotion, hosted dev update,
release, deployment or version bump occurred. Existing automation stays deleted.
