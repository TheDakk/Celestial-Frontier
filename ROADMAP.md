# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
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

## SESSION HANDOFF — 2026-09-08 · STATIC LANDING ART AND SHARED ANATOMY

**Nick’s latest direction is explicit:** the generated Living Worlds triptych and full landfall
compositions align with his vision “100%”. Landings should show one large cohesive **static**
painting, with multiple canonical flora/fauna where appropriate. The same organism identities
must appear in Compendium, with future articulated 2D battle sprites suggesting depth through
posing, overlap and scale. Live resident animation on the landing screen is no longer needed now.
Upgrade universal objects with the same painted direction. Existing flora effects/healing,
classification, discovery/capture rules and full genomes remain gameplay data, not inferred pixels.
[Decision + supplied screenshot](audits/STATIC_LANDING_PORTRAIT_20260908/DIRECTION_DECISION.md).

The [midgame packet](audits/MIDGAME_ART_DIRECTION_20260908/README.md) retains four original images,
complete built-in imagegen prompts and exact workspace hashes: discovery atlas, approved Living
Worlds triptych, six-organism Earth landfall, and fungal-biome landfall concept. Two full-size
landfalls are 1672×941. Earth depicts Civet/Platypus/Frog and Persimmon/Cranberry/Devil’s Club;
its Civet face/coat still drifts from the selected exact authoring master, so composition approval
is not exact identity parity. Fungal fauna are insect/gastropod/amphibian with moss/ferns; this
is an allowed-family concept, **not an exact generated encounter**. One bounded read-only known
foreign-system derivation retained all three worlds’ habitat/painter/profile conflicts in
[alien-source](audits/MIDGAME_ART_DIRECTION_20260908/alien-source/README.md). D-9e remains open.
No seed sweep or reroll was performed in this authoring batch. The generator does not yet produce the
shown quality on demand across all worlds. Broader implementation requires a proved generation
architecture; neither a local model/compositor nor an online service is embedded by these images.

Nick additionally requests daylight/night, planetary rotation/orbit and seasonal conditions in
landfall images, plus shareable discoveries. [TIME_AND_SHARING](audits/MIDGAME_ART_DIRECTION_20260908/TIME_AND_SHARING.md)
separates current source from the proposed versioned appearance recipe. Current day/dusk/night is
seed-fixed; cosmetic system orbits do not establish a physical season clock. CF1 native Share/Follow
preserves location, not a time-specific picture. Preserve existing codes, full genomes, lineage,
active-play economy and all current clock laws. Do not claim seasonal simulation or native creature
share/import already implemented. Exact recorded appearance needs a separately versioned snapshot
recipe, while revisiting a location may show its current conditions.

### Completed static foundation — detailed history archived

The approved `?paintedlanding=1` still remains the full19-genome-admitted, optional single-Civet
Earth prototype in the accepted DOM band.960x430 losslessWebP600,756bytes has exact declared
640KiB admission; decoded resized RGB matches its untouched1875x839 authoring original. It is
not a universal generator. Default page loading differs from service-worker precaching; no
zero-network/zero-storage default claim. [Implementation/native review](audits/STATIC_LANDING_PORTRAIT_20260908/README.md).
The frozen64179 preview is older evidence, not a preview of current local AI or storage code.

Pure shared kinematics has15 mathematical tests; family rigs/skins/gaits remain unimplemented.
The prior Civet/water studies and selected matte retain all first alpha/checkerboard/scrollbar/
paw-pixel/native-toggle/instrument failures and their later scoped passes. They do not qualify
fluid locomotion, all-species animation or fine-alpha quality. Nick's static landing decision
ended bespoke moving-resident/parts rework. [Motion reference](CREATURE_ANIMATION.md),
[water study](audits/CIVET_WATER_AND_MOTION_20260908/README.md),
[painted parts](audits/CIVET_PAINTED_PARTS_20260908/README.md),
[original Civet](audits/CREATURE_PAINTED_CIVET_20260908/README.md),
[cohesion](audits/CREATURE_SCENE_COHESION_20260908/README.md).
Signed predecessor commits, original failed signing receipts, frozen preview identities and
full verification detail are preserved verbatim at the top of ROADMAP_ARCHIVE.md. Current
signing/caffeinate/Git status belongs to the final local-development handoff below.

### Authority, art direction and exact identity

The unattended local campaign ended **2026-09-09T03:11:15Z** (September 8, 23:11:15 Eastern).
Nick subsequently directed the develop integration batch recorded in the final handoff. Claude's
planned review remains Thursday, September10. The `celestial-frontier-48-hour-coding` automation
was deleted; **do not recreate scheduled prompts**. No unattended extension or broad art rework
is implied. [Historical campaign authority](audits/AV_24H_CAMPAIGN_20260907.md).

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

### Startup and Git ownership

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

### Current local development — browser AI, audio and canonical snapshots · September9 UTC

Nick explicitly authorizes continued local work tonight on graphics/audio/local AI, **no scheduled
task**. The browser remains the proof of concept for a later engine game; no native-engine pivot.
The embedded model must meet the approved cohesive painting quality. Speed or successful model
execution cannot qualify the art. [Current evidence packet](audits/LOCAL_AV_AI_CONTINUATION_20260909/README.md).
All superseded batch/handoff detail is archived verbatim; all earlier blockers above remain.

Verified ownership: OpenAI/Codex · macOS · `/Users/nick/Projects/celestial-frontier-openai-mac` ·
`openai/mac` · upstream `origin/openai/mac`. Exact SSH origin
`git@github.com:TheDakk/Celestial-Frontier.git`; retained TheDakk SSH/read/push proof. Fresh-read
develop `c1791e210158de864fdd475323c3091d9ecbae58` remains an ancestor. Reuse uninterrupted startup
receipt `TOOLCHAIN_STARTUP_20260908_CIVET`; no new tool/model download or dependency update.
Owned `caffeinate -di` PID33372 and pre-existing `-i` PID93550 were verified running again near
07:52UTC, using an outside-Seatbelt process read after the sandbox refused ps. Both remain
running; no security/lock setting changed. Earlier failures do not prove a locked vault.

**Git boundary:** PR42 is parked Draft/unlabeled at signed9bfec7dc, base develop/source openai/mac.
Its unchanged public title is “Refine responsive UI and add bounded audiovisual and painted-world
prototypes”; title/body need a future authorized accumulated-head refresh before Ready/label.
No GitHub step now. Mode UNFROZEN/PUBLIC, private fallback3000; zero exact new hosted attempts.
No push, Ready, label, hosted test, merge, release, version bump or deployment. Claude need not
open/sync now and does not have these local changes; after a future verified develop merge it
fetches/merges origin/develop into clean anthropic/mac. Never copy files between worktrees.
The earlier push rejection was resolved by exact9bf authorization; the rejected optional public
parking-body edit remains unperformed. iCloud backup blockers above also remain untouched.

Signed/verified local checkpoints after9bf are `ceb107fdcf6f33f8d60cfd071fbea907a4bb68df`
(audio/loader/browser proof) and `5dcd6e64801cf44c0c55da47c41fbcc9d8408e99` (Q8 optimization).
Canonical-input checkpoint `c430380fcec424b2d03c71afd9e12858086f77e0` is also signed/verified;
its first signing/verification both pass after73files. Exact receipt is preserved in the
successor cache-planning batch. Advisory cache checkpoint `e7157ec204f7f2bec5934fd4b80344a9e0d9e298`
is signed/verified after15files. Reference cleanup/identity experiment checkpoint
`acfbce776ff10dda0a6d476bbb795b878803bfcc` is signed/verified after46files; it is5ahead/0behind
origin/openai/mac. This documentation-only successor records that exact implementation head
and its signing receipt; fresh-start Git inspection owns the latest documentation HEAD.
Both checkpoints signed/verified first try; no outstanding scoped code edits. Signing uses existing1Password
IdentityAgent plus command-scoped `/usr/bin/ssh-keygen`, no private-key export or persistent config. Q8 signing
succeeded first try; its wrapper then incorrectly treated an inline public key as a.pub path.
Corrected read-only signature verification passes; no commit retry/vault failure. See retained
`q8-checkpoint-signing.json`. Ambient.DS_Store remains untouched; model bytes are Git-ignored.

**Audio/loader:** 25ms duck/90ms recovery preserves canonical combat/music/ambience ownership;
268focused audio tests and six native DSP renders/18PCMplanes pass. Offline-audio adapter limits,
first TS/builder failures and physical listening remain explicit. Painted loading enforces the
existing8-second monotonic boundary;27focused tests pass. All3V2 TS/rootvalidate passed, first
fixture errors retained. LegacyHTML unchanged;1010namedrenders/0booterrors/50fingerprints.
No broad changed-head admission is implied by these scoped checks or prior9bf4121tests/1skip.

**Local model:** actual sequential browser WebGPU inference works on M4 Pro24GiB/Edge152, with
some CPU-assigned operators. Original pinned20files6,691,020,416bytes plus7792-byte README remain
in ignored developer cache. No model is selected, embedded, shipped or phone-qualified. Block32
repack preserves represented Q8 weights, checks all347,332,608new parameter bytes and leaves
original shards unchanged. Graph/data add352,323,881bytes (~336MiB) to this developer cache.
17converter +38bridge checks pass. Same768 dual-reference native comparison:239s→69s; all412
Q8 operations use the wide kernel and samplerGPU206.66s→33.33s. One Mac/recipe only, not unique
RAM/VRAM, cold-cache or cross-device speed. Raw pixels differ but look nearly identical.

**Quality remains open:** original768 scene/identity studies retain facial/detail/grounding limits.
Original1024 duplicates/fuses Civets (300s). Revised480-token one-Civet wording still duplicates
bodies (77s), explicitly rejected. One scene reference/base299-token wording gives one Civet
(68s) but gray/short-face identity drift and feet in water persist. Removing image2 and its text
together is not an isolated image-only ablation. All raw outputs/reviews/exact failed prompt source
remain; original identity wording restored. No seed sweep, retouch or unaccepted asset promotion.

**Current canonical input implementation:** `landfall-appearance-snapshot.ts` requires an actual
branded live roster, reuses exact Earth admission, and exports frozen detached versioned data:
full19genomes/world/ecology/profile/conditions plus6display identities/families/anchors. Preview
limits and runtime/type provenance are omitted; JSON cannot grant live authority. Only canonical
Earth epoch0 is supported. The isolated Node exporter invokes real CF1/roster/vista builders,
records59sources plus the known compiler helper, and the browser proof consumes the snapshot
instead of regex-parsing TS literals. All previous generation inputs match except new metadata.
Snapshot SHA256 `a23ef143d97bb7e72c8b5cc72b858266246fd72682dd29de00e0e3fc69848b3f`.

Nine new + existing Earth/roster tests total33PASS; all3V2 TS/entryTS PASS. First exporter wrongly
rejected Rolldown's virtual helper; failed source/receipt remain. Corrected export/native preflight
and7actual refusal controls pass. Final review caught source-read errors escaping final evidence
publication; the shared recheck now records missing/changed paths, continues and saves FAIL.
Real-file deletion/corruption/restoration control and rootvalidate pass. Source hashes, raw results,
original reds and native cleanup receipts live in the current packet. No generated-art mounting,
model download or gameplay/identity/clock/cache change is part of the snapshot implementation.

Next work: use the source-produced snapshot as the supported appearance boundary; the future
actual-play hook is `requestSurfaceVista`. General-world adapters, reliable exact-identity art,
model/browser/phone delivery, adaptive scene cache, seasons/rotation, exact-image sharing,
universal-object upgrades and shared family battle skins remain unqualified. Keep complete
genomes/lineage/biome authority and accepted UI placement. Do not infer these from a good picture.
Full changed-head admission, SceneMemory quarantine, physical devices/HUMAN art/audio and all
older verification blockers stay open. Finish each bounded batch with local signed work and
current docs; fresh sessions read ROADMAP, PROCESS_LAWS, protocol and UI_TOOLCHAIN first.

The next bounded storage work is a pure advisory scene-cache planner. It uses explicit provisional
profiles and origin quota/usage/reservations, never RAM/device-name inference. Only verified exact
surviving copies may be proposed for LRU eviction; sole originals, saves, recipes, models/builds,
pins/leases/inflight entries stay protected. No deletion, migration, settings/UI or executor is
part of this batch. Missing capacity/recovery evidence pauses optional admission. Implementation
now passes24focused cases, all3V2 TS and rootvalidate on unchanged7-file inputs. Conflicting
claims for one surviving copy are rejected; a sole candidate original needs separate protected
retention. Device qualification and atomic cross-tab execution remain separate. No player-facing
Guide/Training/release/version changes. [Contract and controls](audits/LOCAL_AV_AI_CONTINUATION_20260909/SCENE_CACHE_PLAN.md).


Reference cleanup is implemented: every created bitmap closes once, scratch canvases retire,
and cancellation is checked after awaited preparation boundaries.30controller tests PASS;
six native ImageBitmap/Canvas2D scenarios and10negative observer controls PASS, with the
two original prepared hashes exact. Native audit substitutes inference workers explicitly;
64source rows unchanged and browser/server closed. No heap/device/art qualification implied.

The explicit `--identity-only` experiment removes the conflicting scene reference and uses
the selected Civet480x320/matte input alone. Default/dual recipes remain byte-identical;
20parser/server tests,367/512token admission and rootvalidate PASS. Actual1024/Q8 generation
completes in69,948ms, rawPNG1,510,810bytes SHA2b0fea42177e2eeaf94e3c71480d6f0502177c3d1a7f9879c5149ef58ef370b7.
82source rows unchanged, browser closed; full19-genome snapshot/seed/model remain fixed.
One Civet/one tail and dry-bank contact improve, but Platypus reads as a rodent and named
botany/Civet proportions still fail. Root/independent review retainqualityAccepted:false.
No retouch or seed sweep. Reference and wording changed together; no isolated-count claim.
[Raw review](audits/LOCAL_AV_AI_CONTINUATION_20260909/browser-identity-only-1024-01/VISUAL_REVIEW.md).
No game UI/Guide/Training/release/version, actual-play mount or player model download changed.

Next bounded art work must resolve reliable species/individual fidelity before widening to
other worlds/universal objects or accepting this model. The browser pipeline works; approved
painting quality and delivery remain separate blockers. Adaptive-cache execution/protected
original retention, shared family skins, seasons and exact-image sharing remain pending.
Continue only local authorized work; PR42 stays parked and no schedule is created.
Record and sign completed batches, retaining every earlier red and scoped evidence packet.


Completed local handoff: OpenAI/Codex on macOS remains in the exact owned path/branch above.
The latest implementation checkpoint isacfbce776ff10dda0a6d476bbb795b878803bfcc; its successor
contains only this handoff, packet conclusion and the exact signature receipt. Relevant tests
and native source hashes remain unchanged; no further unchanged test/quality rerun. Original
raw results remain immutable, including all first red/instrument and art rejections.
PR42 base develop/source openai/mac remains parked; its accumulated title/body need refreshing
only under future exact publication authority. GitHub step now:none; no hosted attempts used.
Claude does not have these local commits and need not open now. After a future verified merge
into develop, it safely fetches/merges origin/develop into its own clean anthropic/mac.
No release/deployment/version bump; budgetUNFROZEN/PUBLIC with private fallback3000 and zero
new authorized runs. No schedule or unattended follow-up created. Current artwork remains
below acceptance; all remaining graphics/audio/device/storage/animation blockers above persist.
