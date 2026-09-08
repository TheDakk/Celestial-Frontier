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

## SESSION HANDOFF — 2026-09-08 · EARTH LAYERED SCENE

**Signing restored:** Nick unlocked 1Password and authorized one retry. The accumulated 1,177-file
checkpoint committed successfully as `5117b4fa18afeb4869ac459b6f95dfd6a586edc6`; its SSH signature verified
against the existing configured public signing key. [Signing receipt](audits/SIGNING_RESTORED_20260908/README.md).
The working HEAD may be this documentation-only descendant; resolve it with `git rev-parse HEAD`.
No product source, tests, signing configuration or hosted state changed during the retry.


Nick's latest question concerns the creature→biome mapping. **BIOME_ATLAS.md §1.1 is the
biome→allowed fauna-family/flora-form table**, mirrored by the versioned biome-profile domain.
The optional new Earth scene explicitly checks its six selected canonical residents against
that profile. This is not a universal named-species/geographic ecology database. The older global
D-9e generation filter remains dead, unfixed and decision-gated; see WORLD_GENERATION.md and
port/v2/DEVIATIONS.md. Do not claim it is globally enforced or alter generated rosters to hide it.
[Exact mapping/source review](audits/AV_EARTH_LAYERED_SCENE_20260908/BIOME_MAPPING.md).

### Authority and binding art direction

Nick authorized 24 hours of local graphics/audio/UI coding ending **2026-09-09T03:11:15Z**
(Tuesday, September 8, 23:11:15 Eastern); Claude review is Thursday, September 10. No extension or
broad UI rework loop. [Campaign](audits/AV_24H_CAMPAIGN_20260907.md). The interrupting automation
`celestial-frontier-48-hour-coding` was **DELETED**, with stored removal verified; do not recreate it.

Keep the approved rich painted universe/creature sheets preserved in
PAINTED_SPACE_PIPELINE_20260908 and biome/UI references in PAINTED_SPACE_DIRECTION_ADDENDUM_20260908.
UI is graphic/material inspiration only: retain CF's accepted controls, emoji, text and placement.
Earth organisms retain named anatomy, proportions, markings, canonical colors and appropriate
movement. Alien identities/lineage remain seeded. No project restart or replacement art style.

### Current bounded result and honest visual assessment

`?livingvista=1` now mounts an optional exact Earth 133#2 rainy riverbank painting with a separate
transparent resident layer. Exact world: `CF1|g:999@90,-60|s:424242@560,170|p:133#2`;
environment: `cwe1:148:50c1b7d6`; profile: `temperate/bpd1-6fce883d4d70e3b6bde0fb184b416e8e`.
The full request plus all 19 ordered original epoch 0 genomes bind admission. Selected residents:
Civet/Platypus (mammal), Frog (amphibian), Persimmon (tree), Cranberry/Devil's Club (shrub).
Their current named Compendium bodies/palettes are reused; raw randomized habitat/loco overlays
do not define named Earth ecology. No roster, genome, encounter, RNG, save or share rewrite.

Both 960×430 layers publish atomically with request/epoch fences and bounded workers. The pair
fits uncropped into the measured gap above Biosphere with 12 px clearance. Only its owned
decorative globe/cloud deck is hidden; controls/world/camera remain. Final landing-camera impulse
completion restores resting placement after canvas translation. Original opaque fallback serves
default, failed and conflicting planetturn/avpilot options. Failed ownership cleanup retains
unsafe references for retry and continues sibling cleanup; no pair cache. The asset is 130,306
bytes, SHA `2993cd8054a2424f20ba24040717acdb17aa9c7157500cd5b945170cd1f625d8`; retained RGBA
is 3,302,400 bytes before scratch/decode/GPU. The optional named-art worker is 957,316 bytes, an
unoptimized lazy cost.

Root inspected final phone/desktop captures: the full painted landscape and six residents are
visible above UI, with substantial starfield margins. **Current creatures are flat/simple and
remain well below the approved rich painted/charm target.** This static composition proves
identity/layering, not finished creature art, metre-scale ecology, locomotion, image-to-rig
conversion or articulated battle animation. End this bounded layer/placement batch; next improve
one complete canonical resident toward the approved richness and supported idle/attack motion
before expanding families.

### Verification and immutable failures

[Current review packet](audits/AV_EARTH_LAYERED_SCENE_20260908/README.md),
[final results](audits/AV_EARTH_LAYERED_SCENE_20260908/final-results.json) and
FINAL_SOURCE_REVIEW.md are the entry points. 351 focused tests in 23 files, all 3 TypeScript
programs, art-unused/art-audit/override/spec and root validation PASS. Root validation recorded
1,010 clean renders, 0 boot errors and 50 original fingerprints. Prior 134 guard controls PASS
with exact adapter/snapshot AST boundaries; no global art-route restriction bypass. Source review
found no new blocker. Frozen 96-file evidence:
`port/v2/apps/game/smoke/earth-layered-settled-evidence-dist-20260908`.

All four final native modes PASS on unchanged source/build: phone 390×844@2, desktop 1440×1000@1,
exact missing image and option off. Evidence includes a single native Earth Land with zero draws
and zero damage; independent DOM rectangles and 35 canvas hits; actual paint, hidden-layer,
globe/cloud and old H/2 placement mutants; exact restoration; Survey reopen/Close and native exits.
Actual pair Sprites/Textures/Sources retire and canvases shrink to 1×1; cloud container/children
retire. Passive journals observe landing translation, then zero resting pair Y error before
Survey Close. Zero Runtime exceptions or cleanup failures; all four browsers closed.
Runner SHA: `76ca9686c913f52568b2fc3b7268085818806c6de8edcb7590abc091e5b770cf`.

Preserve all new first reds: 285 PASS / 1 FAIL cache-publication control; 306 PASS / 2 FAIL test
expectations (one art-test edit potentially overlapped a running read; no immutable input timing
claim); 308 PASS then a new-adapter parser red; first guard controls 102 failed / 21 passed due to
snapshot Object syntax; first native Earth landing policy-null mismatch; second native center-exit
occlusion revealing DOM-covered scenery; desktop-visible Y red lacking compared geometry.
Observer-only diagnostic PASS retained a small offset; source explains the canvas-shake translation,
and the final completion refresh fixes it. The original desktop delta is unknown. Every red remains
in the packet; later focused success is not full admission.

Current 83-row draft SHA: `218f02b5130fe78a6fcf76e898b6372b8761b4ef4bb4590137668920980f0793`;
producer: `b62563276984183b933e372242e5cd68426727094f57407f9057f1ff4d8e3ba6`;
measurement: `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12` (unchanged).
No ceiling/ruler/history rebaseline. No full Compendium/Slice/Glass/Recovery, physical iPhone/Safari/
PWA, native-driver heap, Reduced/Effects Off reload, resize/re-entry or human art/listening acceptance.
Hidden-ancestor visibility and position-only chrome changes remain outside fixed-view qualification.

### Local preview, recovery and session tools

[Local playtest](http://127.0.0.1:58517/?livingvista=1): Skip Training, select Earth in Sol, Land,
close Survey. [Restart/other graphic options](port/playtests/20260908_EARTH_LAYERED_LOCAL_PREVIEW.md).
Server PID 84380 / exec 99962 serves `smoke/dev-preview-earth-layered-local-20260908`. Package
integrity and native boot/Skip/Guide PASS; no diagnostic API/corner badge. Parent `837db4a`,
dirty-local-only, `publishable:false`.
Content: `3fbcdcf310d03e6904c40b76e73c29a68381cb7b2908e44570743b576ac878ed`;
manifest: `e3b12cd3c0264adc9b7727592b72c0b860bd1a710c39e0f87d0ce1d01bc8a5cb`.
Prior star/audio/UI/Mars/Earth code is included; offline Wolf masters/reference sheets are not
runtime assets. Older preview packages are unchanged; do not assume their old ports remain alive.

Current recovery target: `port/v2/apps/game/smoke/earth-layered-staged-20260908.json` and adjacent
`.patch.gz`. **Verify that receipt before claiming the snapshot succeeded.** Retain all six older
recoveries: 989-file Mars composition, 918 painted Mars, 822 material, 773 turn, 654 painted
direction and 647 charm. The new recovery is verified: 1,177 staged files before commit, raw
SHA `49be51f83ed93cd5a80bd59095c76ea80e69b20316ea865480470b62f2ffc5fc`, gzip SHA
`634cc045bba55fc37cb8075a90c0bcd383804c34223f469e93f217f3f89bb4c1`. The recorded single EOF
blank-line formatting warning remains; backup integrity passed with that warning preserved.
That exact index is now the signed checkpoint above. No unsigned fallback or push occurred.
Ambient `.DS_Store` is preserved. Historical manifests and earlier signing failures keep their
original checkpoint bytes; the signing-restoration receipt supersedes their current-status claims.

Verified Codex/macOS: `/Users/nick/Projects/celestial-frontier-openai-mac`; `openai/mac`; upstream
`origin/openai/mac`; signed implementation checkpoint `5117b4fa18afeb4869ac459b6f95dfd6a586edc6`;
39 ahead / 0 behind at that commit, plus this documentation follow-up; resolve current HEAD/counts
with Git. `origin/develop` is an ancestor. SSH origin: `git@github.com:TheDakk/Celestial-Frontier.git`;
uninterrupted TheDakk read/fetch proof is retained. Startup receipt
`audits/TOOLCHAIN_STARTUP_20260907/manifest.json` is reused only within this session; a new session
follows the `UI_TOOLCHAIN.md` runbook. No fresh tool/dependency update this batch. Terminal/files
and isolated CDP only; shared foreground lock, browser commands outside the sandbox. Caffeinate
93550 (`-i`) and new preview 84380 were verified after checks; no foreground build/browser/render
remains. Inkscape CLI outside the sandbox passed previously; original crash cause is unproven.
No scheduled prompt restart.

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

Next: one complete canonical rich-painted creature treatment with coherent whole-body form,
matching light/scale and supported motion, using the mapping and current seeded identity. Keep
Earth-specific anatomy/movement; do not treat the flat composition as approved final art. Preserve
controls and all blockers. Stop at the authorized 24-hour deadline with a documented checkpoint;
no extension.

Current side: Codex/macOS/`openai/mac` owns the signed local checkpoint and documentation follow-up;
commit signing is working again. GitHub step: none. PR details: not needed. Future separately authorized integration is
`openai/mac`→`develop`, never directly `main`. Budget: UNFROZEN/PUBLIC; private fallback 3000;
exact hosted authority required; attempts/cost 0.

Other side: Claude/macOS/`anthropic/mac` does not yet have these unmerged changes; no need to open
or sync now. Review the durable packet Thursday; preserve `173c806`. After a future authorized
exact `develop` merge, Claude may fetch/merge `origin/develop` into its own clean branch. No manual
copies/message to Claude, develop/main promotion, hosted dev update, release, deployment or
version bump occurred.
