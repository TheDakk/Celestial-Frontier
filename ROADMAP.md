# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — 2026-09-09 · INDIVIDUAL REFERENCES / OPTIONAL MOBILE PACKAGE

**Current objective:** Nick requests completion of individual species references and mobile
model delivery. The browser proof of concept remains the path to a later engine game. The six
reference inputs and optional delivery package are implemented; full canonical output quality
and physical-phone acceptance remain separate gates. Latest user question—how the model reaches
a phone—was answered: an explicit in-game Install downloads pinned HTTPS files into browser OPFS,
with Pause/resume and verification, no separate installer. The experimental model is 6.69 GB/
6.23 GiB, not an approved mandatory phone download. Target iPhone/iOS identification is pending.

**Checkpoint:** this batch starts from signed 83ee60f3db1db3f78596afe7519584ef2d1f14fb. The signed
commit containing this handoff is the completed local checkpoint; Git supplies its exact SHA.
[Batch index](audits/AI_SPECIES_MOBILE_20260909/README.md) and
[paired handoff for Claude](audits/AI_SPECIES_MOBILE_20260909/HANDOFF.md) retain source, exact
artifacts, every first failure and all accumulated review links. The prior handoff is archived
verbatim. No hosted action, new schedule, engine pivot, model download or Claude invocation.

### Approved direction and unchanged authorities

Landfalls are large cohesive static paintings with multiple canonical flora/fauna, shared light,
materials, atmosphere, grounded anatomy and foliage overlap. Compendium retains seeded individuals
and flora properties; later articulated 2D battle rigs cover land, flying and aquatic families.
Universal objects share the painted language. Whole-image recoil is not a limb rig. Nick’s praise
of the latest finish is retained without inventing exact-PNG approval or a species/count waiver.

Named Earth anatomy, full genomes/lineage, biome mapping, saves, gameplay clocks and accepted base
control placement remain authoritative. The compiler admits only Earth
CF1|g:999@90,-60|s:424242@560,170|p:133#2, environment cwe1:148:50c1b7d6, epoch 0, all 19 genomes.
The six reference/display indices are Civet, Persimmon, Platypus, Frog, Devil’s Club, Cranberry.
D-9e stays gated. This is not universal taxonomy, physical season/orbit clocks or exact-image sharing.

### Implemented in this batch

- Four new unedited authored reference PNGs supplement retained Civet/Platypus. The manifest binds
  all six original image hashes, source geometry, full genomes/visual keys and diagnostic rules;
  independent reference caveats are retained. They are inputs, not local-model quality evidence.
- V2 conditioning/render schemas preserve V1 bytes and the full canonical snapshot. The runtime
  checks order/identity/hash/geometry and sequentially encodes six 480×320 references. The exact
  prompt is 452/512 tokens; the denoiser handles 5,904 image tokens versus 2,904 previously. No hard
  masks/boxes/count control is available. High-quality resampling applies to V2 only.
- The controller can recover a byte-identical V1 original for the same snapshot/model/derivative
  under V2 selection. Arbitrary changed-model discovery still needs its own index. Native model
  storage disclosures survive progress/refills, preserve explicit collapse and keep Pause usable.
- The six-reference runtime is 37,451,014 bytes/35.72 MiB without weights. The combined optional
  app/PWA is 56,529,354 bytes/53.91 MiB, 97 files; its same-size retained pair is 107.82 MiB. The optional
  SW admits only explicit exact-model GET/Range outside CacheStorage and counts all existing build
  response payloads before installing a candidate under 256 MiB. Worker imports now require an
  explicit worker role bound to the same retained build. Normal SW bytes remain unchanged.
- Pinned installed TS7 CLI compilation supplies exact read-only delivery/SHA diagnostic modules;
  no alternate storage implementation, dependency install or fake model readiness is used.
- Frozen local preview serves a hash-pinned copy of the Vite client with only its eager disabled
  HMR connection omitted. Helpers/error reporting remain, installed dependency bytes are untouched,
  and no exception filter is added. Static game package does not include this dev-only correction.
- Current art/species/generation/UI/save/codebase references and v2 development notes are updated.
  No production version or Guide/Training flow changes. Existing full-painting inspection remains.

### Verification and retained first failures

Adapter/disclosure 46/46, current PWA/fidelity/mount owners 66/66, all three TypeScript programs and
root validation pass (1,010 renders, zero boot errors, 50 original deterministic fingerprints).
Reference-helper 16/16; runtime-pack 12/12; mobile 8 pure +8 actual package/HTTP; mirror6 pure; final
installed-CLI diagnostic 8/8; frozen-preview 5 +8 HTTP controls pass in their exact separate receipts.
Do not add repeated corrections into a fictitious aggregate or claim a full profile/certificate.

The actual V2 painting reached verified retained Ready in 135.671 seconds; exact PNG SHA
44f03a6c6c2e47c38d93106ce4ba08a3dcd7bac17320fd582aa57b8b6aa4c400. Distinct fauna and plant motifs
improve, but Platypus body plan, plant diagnostics and canonical placements still fail the exact
manual review. V1-only landfall-fidelity.ts did not assess this V2 image. Actual generation,
Notifications responsiveness, explicit View, unchanged original after reload/resize and 44 unchanged
source hashes are recorded. Nine worker-entry requests were measured, but no native worker IDs
were enumerated. The aggregate native run remains FAIL due to Vite-client WebSocket exceptions.
No unchanged generation was repeated just to repair transport. Corrected no-inference native boot
passes actual Skip→durable Sol→new-document reload, two served-client captures, zero WebSockets/
model requests/runtime exceptions/crashes, 20 unchanged sources and complete cleanup. Two favicon 404s
remain; this is not a zero-network-error claim.

Native full-model runs 01/02 both remain aggregate FAIL. Run 01's hard reload bypassed the PWA
controller; run 02 uses normal reload and verifies the exact activated controller. Run 02 records
actual Install/Pause/reload/Range resume of all 20 files (6,691,020,416 bytes / 6,392 chunks) in
108.690 seconds from an existing local mirror, not a phone/internet estimate. All 21 model requests
belong to the service worker; no model data enters CacheStorage. Both servers close before offline
reload. Native UI rehash takes 79.775 seconds; read-only production delivery opens all 20 native
Blobs with exact sizes/head/tail hashes and rejects an actual shifted-slice mutation. All 27 source
hashes remain unchanged; the owned browser/profile/servers/locks are removed. The final module
observer and pending worker Network.enable timed out; those failures stay recorded.

The smaller module diagnostics reproduced failure online. Native request metadata revealed that
static worker imports have destination worker but empty resultingClientId. The optional SW had
mistakenly required every import to create a new worker. Explicit persisted worker-role ownership
now admits those imports through the existing exact retained-build/cache/asset guards. Ten package/
ownership and two reply controls, all 34 existing PWA tests, three TypeScript programs and root
validation pass. The independent review found no material remaining admission defect.

Current package03 is independently verified with all 426 inputs unchanged. Its unmodified served
bytes pass native online/offline module proof (offline-runtime-native-04): actual worker replies
through its pre-GPU guard, 95 asset hashes match, lazy WASM bytes match offline, model namespace is
absent, all 12 sources are unchanged and cleanup completes. No model inference or phone claim.
The instrumented diagnosis and three earlier module failures remain immutable. See the batch
WORKER_IMPORT_DIAGNOSIS.md and HANDOFF.md for exact hashes, commands and limits.

All first failures remain: frozen fixture mutation; declaration/import mismatch; strict existing
fixture destination; sandbox HTTP bind refusal; Vite server/client transport; TS7 compiler API,
strip-only parameter-property and Node26 removed transform-mode failures. Each correction records
its changed source and exact scope. No broad admission, hosted battery or certificate chain ran.

### Remaining acceptance and next bounded work

The references are implemented; whole-scene species fidelity is still open. Individual global
reference groups do not enforce desired anatomy/count/location. Keep the current quality gate
closed and use the exact independent observation list for the next targeted control change; no
unchanged prompt sweep or unbounded new-model search. Prior rejected outputs stay rejected.

The model is 6,691,020,416 bytes/6.23 GiB, with optional desktop Q8 derivative 352,323,881 bytes separate.
No mandatory player model or storage-budget increase was selected. Phone model/iOS is still unknown.
Physical full install/internet-CDN delivery, Safari/PWA graph allocation, complete generation,
foreground FPS, memory/buffers/thermals, offline durability and latency require actual device tests.
NativeWASM source-version correspondence is corroborated from embedded build text and npm integrity;
reproduced build, selected-component SBOM and full distribution qualification remain open.

Cross-model original discovery, outside-origin backup/export/exact-image sharing, reload-durable
jobs, adaptive eviction/reservations and broader canonical worlds remain unfinished. The 76×43
base scene thumbnail is a separate detail limit; full inspection preserves accepted base placement.
All-family rigs/universal objects and physical seasons remain future work. Audio retains 268 focused
checks/six DSP renders; HUMAN listening is pending. Claude’s intended app review has not happened.

### Older verification blockers — retain, do not silently retry or relabel

Signed837db4 U2 had3494tests/1skip then TS6133red (binding later fixed). 3a61352 small-phone instrument
red after Capture/ChartersClose persists; large-phone/Slice were not run. 08cd97d MilkyWay and
c57aaaeb portrait timeouts remain unknown. U2–U4/full Compendium/Slice/Glass admission, physical
phones, HUMAN art/audio,256MiB retained update (128MiB admission exists), art-lockCI, ITP and
DECISIONS19 remain open. SceneMemory stays production-only/quarantined; no activation or chain run.
Earth-turn330-file aggregate3742PASS/5FAIL/1skip stopped; scoped passes never replace it. Native
phone-exit/desktop-resize unexpected-galaxy outcome remains unknown; re-entry was not reached.
MissingMeshPipe/renderer-extract faults, all Earth-layer alpha/placement/guard/observer first reds,
Mars observer failures and later scoped passes remain in their immutable packets and archive.
Earth turn is finite18s/.22radian, not seamless rotation. D-9e habitat/painter/profile mismatch is
unfixed/gated. Civet fine alpha and all-family motion remain unqualified. The94-file/24MB iCloud
backup remains blocked after two automatic-review rejections; no retry/cloud write. Private masters,
original Dakk project and personal UI remain untouched. No third-party runtime assets copied.

The preceding older-block text is preserved verbatim. This batch does package the already locked
runtime into disposable local optional artifacts; it downloads no new dependency or model and
adds no copied third-party runtime binary to the repository.

### Fresh-session startup and paired Git handoff

Verified OpenAI/Codex · macOS · /Users/nick/Projects/celestial-frontier-openai-mac · openai/mac ·
upstream origin/openai/mac. Origin git@github.com:TheDakk/Celestial-Frontier.git; prior TheDakk SSH/
read proof established. Starting83ee60f3 is11 ahead/0 behind upstream9bfec7dc and122 ahead/0 behind
developc1791e21 at the last verified refs. This local completed checkpoint adds one commit:
12 ahead of origin/openai/mac and123 ahead of origin/develop, zero behind each. No fresh fetch or
GitHub write in this local continuation. Ambient .DS_Store remains untracked and untouched.

Read ROADMAP first, PROCESS_LAWS before UI/tests and PARALLEL_GIT_PROTOCOL before batch/handoff.
Reuse audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json only within this uninterrupted session;
a fresh session completes UI_TOOLCHAIN updates/idle/lock startup. Terminal/files/isolated CDP only.
Native browser owners start outside Seatbelt with shared foreground/checkout locks. Caffeinate
33372/93550 are verified active; no lock-screen/security changes. Sign with command-scoped configured
1Password SSH_AUTH_SOCK and ssh-keygen; independently verify using a temporary allowed-signers file.
Never export keys. Rebuild disposable package outputs from pinned sources if missing.

**Codex:** resume from this signed local checkpoint and exact remaining boundaries above. **GitHub
step: none.** PR42 remains parked Draft/unlabeled at remote9bf, base develop/source openai/mac.
No new PR needed. Its current title is “Refine responsive UI and add bounded audiovisual and
painted-world prototypes.” Before a future exact-authorized push/Ready/owner label, refresh its
accumulated exact head/title/body and selected admission evidence. Copy-ready replacement fields
are in this batch’s HANDOFF.md. Never infer new hosted authority from local coding authorization.

**Claude:** intended app review pending; Nick need not open Claude now. Its checkout does not yet
have local Codex changes. Review the committed packet when wanted; only after verified develop
integration may clean anthropic/mac fetch/merge origin/develop. Finish/commit dirty work first,
no manual copying. Develop/main/live site unchanged. Recorded budget UNFROZEN/PUBLIC, private
fallback3,000, zero new exact hosted/owner-label attempts. No Ready, labels, Actions, merge,
release/deploy, automation or scheduled prompt.
