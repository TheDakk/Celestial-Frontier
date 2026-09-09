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

### Completed shared foundation and static landing prototype

[CREATURE_ANIMATION.md](CREATURE_ANIMATION.md) is the current anatomy/motion reference. The document
Nick recalled is [PROCEDURAL_CHARACTERISTICS.md](PROCEDURAL_CHARACTERISTICS.md), together with
SPECIES_AND_GENOME and named Earth bibles. Its legacy B15 analysis now has a current V2 overlay.
The [source taxonomy](audits/CIVET_PAINTED_PARTS_20260908/SOURCE_TAXONOMY.md) records actual named,
lineage, modern and HD owner precedence, source hashes and conflicts. Modern quadruped counts come
from body/locomotion; raw FA_LIMBS are total limb counts and not guaranteed rendered anatomy.
Raw eye/trait/limb omissions, extremophile locomotion disagreement and four-wing routing remain
recorded conflicts. Never create a second loose skeleton classifier or silently change identities.

`port/v2/tools/creature-animation/kinematics.ts` implements pure immutable transforms, length-aware
two-bone chains and finite smooth chain waves. It accepts geometry, not genomes/names/RNG/clocks.
15 focused mathematical tests PASS; the receipt is explicitly transcribed from the original tool
output, not a raw log. No unchanged rerun. This is not family rig/skin/gait/native animation coverage.
All land/air/water/flexible/radial/flora adapters and a shared resolved anatomy/skin owner remain
future work; static landings reduce immediate motion scope, not procedural identity requirements.
Static verification: all three V2 TypeScript programs and root validation PASS on unchanged
source; 1,010 named renders, zero boot errors and 50 original fingerprints retained. Legacy HTML
is byte-identical. [Corrected result](audits/CIVET_PAINTED_PARTS_20260908/static-corrected-results.json).
The first new static instrument ENOENT for absent optional root main.js remains intact with zero
steps reached; the corrected runner is separate and treats that file as optional like validate.js.

The optional `?paintedlanding=1` single-Civet Earth display prototype is implemented and has
scoped focused/static/native verification. [Packet](audits/STATIC_LANDING_PORTRAIT_20260908/README.md).
Nick authorized ImageMagick resize/encode. The untouched 1875×839 original remains; its 960×430
lossless WebP is600,756 bytes, SHA `cd2c616abb35610f6ec63382f6476436f27a8c1a2c698757c8a66d34a5b2e0ec`.
Decoded RGB exactly matches the resized reference. Downsampling still reduces master detail;
desktop1440×1000@1 and phone390×844@2 were inspected, not every enlarged/high-DPR display.
The original export-over512KiB receipt remains. This new asset declares exact600756 under a
640KiB explicit-size cap; all older undeclared loads retain512KiB. Decode dimensions stay960×430.

The new still uses the unchanged full Earth request/all19-genome admission, one actual leased
opaque canvas and accepted DOM band. Its exact scene ID is `painted-earth-civet-landing-v1`.
No empty resident layer, worker dependency on the still path or new gameplay data. Existing
`livingvista=1`, fallback, biome authority, UI placement and all19 roster rows remain. Static-load
callbacks retain the older visibility limit: they can settle while hidden; no animation loop.
Default makes no painted page-loader request, but offline service-worker precaching can still
fetch the optional asset. No zero-network/zero-storage default claim or heap saving is made.

Verification: first11 focused files/146 tests PASS, then TS2352 in the mutable deep-clone test.
The explicit unknown bridge fixed only that fixture; its5 tests and all3 V2 TypeScript programs
plus root validation then PASS. Legacy HTML byte-identical;1010 named renders/0 boot errors/50
original fingerprints. Both first and corrected receipts are retained. One immutable97-file
Vite evidence build produced native desktop/phone PASS, then the blocked observer wrongly treated
server-wide served-file inventory as page traffic. V3 corrected only the request-owner ruler;
wrong-SHA and default modes PASS with10 negative controls on the same build, without rerunning
passed modes. V2's red stays red. Real leases/textures/sprites retire and canvas shrinks1×1;
full-genome proof is focused admission, not native pixel inspection. No full battery admission.
Independent read-only review matched all50 static/37 v2/43 v3 source hashes and both97-file builds.

An ordinary local-only human preview and its isolated browser check PASS:
[Open static Earth prototype](http://127.0.0.1:64179/?paintedlanding=1), PID24408 / exec76755.
It is a frozen dirty-local-only package with parent `acca36b469da2024a7112c3cdd426f351f6bd2f5`,
publishable:false; that parent does not certify changed bytes. Content SHA
`473671306f100ece340e6e78ba2c7d2d9a5902103035c3ba2274e655dd41c0d5`.
The app-panel request was queued. [Server/package receipts](audits/STATIC_LANDING_PORTRAIT_20260908/README.md)
include native review images, exact source/build links and fresh-origin instructions. Earlier
servers stay untouched. No new Compendium art, flora effects, battle rig or multi-world generator.
The original six-file prepared patch and its wrong-path/corrected apply-check receipts remain
historical; do not apply them over this asset-bound implementation.

Two earlier painted-part atlas calls are unaccepted authoring evidence: first opaque checkerboard/
incomplete parts failure, corrected magenta atlas and first ImageMagick alpha extraction. Five
components have not passed assembled-skin/opaque-composite/native review. They are not game assets.
[Packet](audits/CIVET_PAINTED_PARTS_20260908/README.md). User steering ended the bespoke atlas loop.

### Signing, sleep and current prior study

The previously staged 185-file water/motion batch is now SSH-signed as
`afee1924aac880bed4360deae2a26d081ca18d45`, starting this batch 42 ahead/0 behind cached upstream.
One PTY signing retry after Nick confirmed readiness succeeded; command-scoped verification against
the existing public key PASS. No persistent Git configuration, private-key access or unsigned fallback.
Earlier failed-buffer signing receipts remain preserved, including the prior 86ea06b success.
[Exact signing/sleep receipt](audits/CIVET_PAINTED_PARTS_20260908/SIGNING_AND_SLEEP.json).

Existing caffeinate PID93550 runs `-i`, preventing idle system sleep but not display sleep. A separate
`-d -t 7346` assertion PID16793 / exec16947 was verified and expires no later than the existing
campaign deadline 2026-09-09T03:11:15Z. No lock/security/energy settings changed. Recent filtered power
logs did not establish sleep as the cause of signing failures. The successful retry does not isolate
whether PTY, display state or user authorization readiness mattered. Leave the original -i job alone.

The previous [water/motion study](audits/CIVET_WATER_AND_MOTION_20260908/README.md) remains the live
local authoring review at http://127.0.0.1:58523/ (PID13898 / exec88960; verify before claiming live).
It shows one painted Civet with narrow water contact, 12 local transforms and finite controls.
44 rig tests, study/three V2 typechecks/root validation and final desktop/phone native PASS remain
bound to that study. 34 frame observations/18 controls/3 WebM per mode, original first TypeScript and
native filter-toggle FAIL retained. It is planted image deformation, not finished fluid locomotion.
Its report SHA is `1d230a9cbded6b5ae256c1dff14672f23869e35af8ccc7331924363efc0cc917`, fifteen-file
review inventory SHA `a485c8f4fe04876205d229db6d02e41ccf0bd24706418d43dc5a92be22e02e50`.
The 185-file gzip recovery/readback/reverse-check pointer is historical; afee1924 contains the work.
Earlier 58519/58521 reviews are unchanged comparisons. No new native game preview was launched here.
No native Guide/Training/release-note text or version changed: this completed batch adds authoring
evidence, current references and isolated mathematical tooling; the landing runtime candidate is unapplied.

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

### Current directed batch — develop integration, 2026-09-09 UTC

Nick explicitly requests integrating the accumulated commits into develop, then continuing the
on-demand landfall work. This is a new user-directed batch after the unattended campaign ended;
no automation, unattended deadline extension, model installation or generation service is implied.
[Durable integration packet](audits/DEVELOP_INTEGRATION_20260909/README.md) and
[PR description](audits/DEVELOP_INTEGRATION_20260909/PR_DESCRIPTION.md).

Verified row: OpenAI/Codex · macOS · `/Users/nick/Projects/celestial-frontier-openai-mac` ·
`openai/mac` · upstream `origin/openai/mac`. Starting signed head
`a84f4ea959ae51c6423ed6c88e5274bfa88d8786`; fresh fetched develop
`c1791e210158de864fdd475323c3091d9ecbae58` is an ancestor.109 ancestry commits beyond develop,
46 beyond the agent upstream before this repair commit. No incoming merge/conflict. SSH origin
`git@github.com:TheDakk/Celestial-Frontier.git`; retained TheDakk auth and fresh fetch passed.
Tracked source was clean; ambient `.DS_Store` is untouched. Reused uninterrupted startup receipt;
Node26.8.1 rechecked. Old root Vite PID30716 (elapsed9 days) was not interrupted; admission and
producer observation built isolated snapshots with their own dependency installs and locks.

Cumulative starting diff:3,695 files,+1,138,294/−1,286 text lines.96.39% of added text is audits;
runtime/build source54 files,+5,150/−342; verification/authoring111 files,+17,884/−626.
The packet includes exact categories. No workflow or legacy main.js/HTML change against develop.

One clean tracked-only develop rehearsal on a84f4ea9 stopped at344 files/4,104 tests PASS,
4 files/5 tests FAIL,1 skip. TypeScript/art/override/spec/browser stages were not reached. The
first raw14,150-byte log stays SHAe052d24200bc36c60e24f7bdd2bb567e16c2daab80b9cb62a95f4ace4f022db8.
Repairs: AppChrome now owns detached upper/dock geometry; Main preserves accepted Earth placement,
visible Planetside precedence and scaling. The build-mode fixture includes its sealed Earth worker.
The83-bullet authority now binds actual current text SHA
`073174fbd708495367c01a51b488ddb78cb8730de078e0e30d3b720eab8d1158`.

139 focused tests/all3 TypeScript programs/root validation PASS (1010 named renders,0 boot errors,
50 original fingerprints; legacy HTML byte-identical). One isolated97-file evidence build observed
producer `2083bac2808da830f9d8b5c67386c9e1c6816ba4ee56317e121169817fc9f9cb`; measurement remains
`4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`. Only current producer/pins and
an append-only selectionRule transition change. The first budget27PASS/1FAIL for missing narrative
is retained; corrected28PASS. Fixed ruler, ceilings, samples and SceneMemory quarantine unchanged.
Independent review matched current source/report/pins, seven focused source hashes/five log hashes
and the original first-red log. No new native presentation or full certificate claimed.

The first PTY signed-commit attempt exited128: `1Password: failed to fill whole buffer`.
HEAD remains a84f4ea9; all reviewed repairs/evidence stay staged. No unsigned fallback, key/config
change, push or PR. [Exact transcribed signer result](audits/DEVELOP_INTEGRATION_20260909/signing-first-failure.json).
Nick reports 1Password is unlocked and explicitly requested one fresh signing attempt.
Use the existing configured signer without changing keys/security settings; commit the staged repair/evidence,
then run the mandatory tracked-only develop profile **once on that final clean candidate** before publishing. Do not rerun the older failed
head. Its exact final admission result must be placed in the PR description with head/base and
local raw-log location. Do not mistake the scoped results above for that pending full admission.
All older blockers in the preceding sections remain binding; prior signed static landing
`3ee104f86c08973243cc8c8a21c1f9ebba41ae76` and immutable97-file/native packets remain unchanged.

Integration path: normal push `openai/mac` and an unlabeled draft PR, base `develop`, source
`openai/mac`; title “Refine responsive UI and add bounded audiovisual and painted-world prototypes”.
No open PR existed at the fresh read. Develop requires a PR and exact green `battery`; no direct
commit or bypass. Workflow bytes are unchanged: branch push/unlabeled draft creation trigger no
Actions. Actions UNFROZEN/PUBLIC, private fallback3000; no exact owner-label attempt authorized.
After reviewed local admission, Nick applies `actions-budget-approved` for that exact PR/head/base,
one agent-lane test-battery attempt, maximum122 runner-minutes (2+120), no retry. A full chain
requires a separate request. No main merge, release, deploy or version bump.

Other side: Anthropic/Claude Code · macOS · `anthropic/mac` does not yet contain these changes.
**No need to open or sync Claude now.** Preserve173c806 and Thursday September10 review evidence.
After an authorized exact green develop merge, Claude fetches/merges origin/develop into its
clean owned branch at the next batch; no manual copies/messages. Never treat a local commit or
push as integration. Read actual PR/Git metadata to resume; preserve any concurrent user work.

After integration, resume one canonical **on-demand** scene proof after qualifying its runtime
route. Nick's local preference remains conditional on quality, reasonable storage and no separate
player AI setup. Adaptive disposable scene-cache tiers500MB/1GB/2GB/up to5GB are provisional and
separate from RAM/GPU and total model/build/save/update storage. Protect exact originals and
complete discoveries; a seed alone is not an exact-image recovery guarantee. No generator,
adaptive cache, local model, download, physical seasonal clock or exact shared-view storage is
implemented. [Current requirements](audits/ON_DEMAND_LOCAL_GENERATION_REQUIREMENTS_20260908.md).
Preserve approved art, named Earth anatomy/botany, complete genomes/lineage, biome mapping, UI,
saves and clocks. Do not expand a prepainted catalogue or restart the bespoke animation loop.
Fresh sessions read ROADMAP, PROCESS_LAWS, protocol and UI_TOOLCHAIN startup; do not recreate timers.
