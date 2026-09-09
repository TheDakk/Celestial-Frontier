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

## SESSION HANDOFF — 2026-09-09 · SPECIES / DELIVERY / NORMAL-GAME AI

**Current objective:** Nick explicitly asks to finish species fidelity, mobile model delivery and
normal in-game AI integration. Continue the browser proof of concept for the future engine game.
No engine pivot, scheduled prompt, hosted generation service, GitHub write or release is requested.
The bounded coding/verification batch is complete; product acceptance is not. Source/evidence
are committed together in the checkpoint containing this handoff (resolve its full identifier
with `git log -1 --format='%H %s'`). Parent is signed `98cb65c8c79d8e70bd6c6becb7d64b8a81b552a8`.
No local painting is accepted, full mobile model delivery is not qualified, and shipping runtime
packaging is unfinished. Do not describe the three requested priorities as fully completed.

**Review clarification:** Nick says Claude has not reviewed the work yet. His intended review
in the Claude app remains **pending**. The saved CLI response at 12:49 UTC on 8bdbea9a retains its
actual limited inspected scope in `audits/CLAUDE_DIRECTION_REVIEW_20260909/`; it is not Nick's
intended app review, nor acceptance of this new batch. Do not dispatch another review instead
of doing the requested work. Prior response/request/receipts/disposition stay immutable.

### Approved direction and identity boundary

Nick approved the Living Worlds triptych/full landfalls 100%: large cohesive static paintings
with multiple canonical flora/fauna, shared light/materials/atmosphere, grounded anatomy and
vegetation overlap. Compendium preserves complete individual identities and flora effects;
future articulated 2D family rigs cover land, flying and aquatic fauna. Whole-portrait recoil
is not a rig. Universal objects should carry the same identifiable painted finish. Local model
quality must match those references; successful inference or capability checks cannot accept art.

All named Earth rules, full seeded genomes/ordered lineage, biome mapping, saves, current clocks
and accepted control placement remain authoritative. The first adapter admits only canonical
Earth `CF1|g:999@90,-60|s:424242@560,170|p:133#2`, environment `cwe1:148:50c1b7d6`, epoch 0 / all 19 genomes.
Its six depicted residents are Civet/Platypus/Frog and Persimmon/Cranberry/Devil's Club. It does not
claim a geographic species database, universal coverage, seasonal physics or exact image sharing.
D-9e remains gated. Current day/dusk/night is seed-fixed, not a new real-time orbital season model.

### Current batch implementation — current reference owns details

[LOCAL_AI_GENERATION.md](LOCAL_AI_GENERATION.md) describes the source boundary; references
ART_DIRECTION, UI_PRESENTATION, SAVE_SYSTEM and codebase-reference refresh in the same batch.

- `landfall-conditioning.ts`: source-backed named anatomy/botany and exact anchors; all19 genomes
  retained. Six records, strict unsupported refusals, no generic Earth limb/color substitution.
  Exact current model/chat token count 472/512 (initially 376), no truncation. Anatomy reference copied unchanged from the authoring
  generator: 1536×1024 Platypus PNG SHA`0b4584f76ce18f42e38e0c28e9a42758280d0c0de390d45371422a7e4c91fe57`.
  Diagnostic reference usable with documented hump/tail/bill/finish/orientation limits; it is
  not accepted whole-scene art. No local candidate quality acceptance.
- `local-model-delivery.ts`: explicit OPFS installation,1MiB immutable chunks, Web Locks, HTTP
  Range resume, incrementalSHA256/readback and atomic manifest-bound readiness. No auto-fetch
  until explicit install. All origin usage/headroom counted; actual quota errors refuse ready.
  No whole-shard JS buffer in delivery. Corrupt attempts and exact originals never auto-delete.
- `ai-landfall-originals.ts`/`ai-landfall-jobs.ts`: separate native IndexedDB immutable originals,
  atomic original/latest commit followed by verified reread, max16MiB image; no game-save fields.
  One active/three waiting/twelve terminalmetadata jobs, full recipe identity. Explicit cancel,
  no cancel on navigation, no Ready before retention. Jobs themselves are not reload-durable.
- `local-ai-runtime.ts` uses pinned real ORT graph workers; ordered actual stage/step progress,
  bounded reference stream/SHA/full binding, exact shapes, cancel/deadline/cleanup. PNG stays
  native1024×576. The normal Land action queues only after independently durable scene publication.
  Survey/Notifications own progress, ETA, cancel and explicit View. The game remains usable.
  `?localai=1` is default-off experimental access; local preview server supplies verified cached
  model/runtime files. No production PWA runtime pack or mobile model shipping selection yet.

### Verification during this batch

[AI integration packet](audits/AI_GAME_INTEGRATION_20260909/README.md) and
[native delivery packet](audits/LOCAL_MODEL_DELIVERY_20260909/README.md) retain first results.
Compiler16PASS/tokenizer376PASS. Delivery/hash32PASS after one retained fixture1FAIL; actual native
small-file OPFS auditPASS on its first execution (8observations/5trustedclicks): cancel/HTTPabort,
reload/exactRange resume, SHAready/reload/no-download, Blob URL equality, corrupt refusal and
preserved attempts. This is2MiB synthetic data on desktop Edge, not the6.23GiB model/phone proof.
Original/job15focusedPASS (initial11PASS/2instrumentFAIL retained, then13 and15 on changed tests).
Runtime19PASS/1progress-instrumentFAIL, corrected sole casePASS; no inference claim from doubles.
Main wiring/layout/retirement66PASS after retained first56PASS/3FAIL/1importFAIL/3unhandled fixture
errors. Added globals/signature and native1024×576 containment checks corrected the instruments;
no weakening of original ownership/negative controls. Preview server8HTTPfixturePASS.
Controller/expanded actual-main ownership23PASS. Final all3TypeScript/rootvalidatePASS after a
retained test-only mock-type error;1010renders/0booterrors/50originalfingerprints. The changed
472-token prompt subsequently passed16compilerchecks/all3TS/rootvalidate again. No stale4121
full-profile result is being applied to this source.

Actual normal-game native01 produced and retained a1024×576PNG in74.047s, passed real Land/
Notifications/View/reload observations, then remained aggregateFAIL on a premature resize sample.
Its same-world final observation was mounted again; result and exact failed runner stay intact.
Native02 changed the count/reference-exclusivity prose, restored game-palette preview buttons and
waited for settled same-original resize. It passes: four trusted clicks, twenty observations, four actual workers,
74.307s to verified Ready, Notifications usable during inference, no auto-navigation, exactPNG
retained across reload with zero reinference and settled320×568 containment.34source hashes
unchanged; browser/server/target/checkout lock closed. [Native review](audits/AI_GAME_INTEGRATION_20260909/NATIVE_REVIEW.md).
ORT CPU-placement messages/favicon404s remain logged; no uncaught game exception/crash observed.
This is not phone qualification, gameplayFPS or a fullcertificate. The small-screen painting is
only roughly 76×43 in the accepted band: contained but insufficiently legible, an open UI quality issue.

Both outputs are visually rejected. First fuses Civet/Platypus traits and omits separateCivet;
second makes four mammals, omitsFrog and still has wrongbotany/scale/anchors. The clearer prompt
changes the failure, not acceptance. Current raw PNG: 1,520,711 B SHA
`aebec1c3b9cf9bb3761ff0178d77b7d525aa7683d5ee5f448408a5f0949fd7e5` is retained unchanged, not promoted.

### Remaining product acceptance

The pinned 20 runtime model files are 6,691,020,416 B / ~6.23 GiB plus runtime, saves, image originals and
liveGPU/RAM. Optional Q8block32 adds352,323,881B. Nothing is selected for shipping and Nick's
modest player-storage requirement is not raised by a dev download. ActualM4Pro24GiB inference
is established on earlier recipes; physical phone/Safari/PWA full install, buffers/thermals,
uniqueRAM/VRAM and foreground gameplayFPS remain unqualified. Nick was asked which phone to
qualify; no answer yet. A capability probe never substitutes for actual phone evidence.

Earlier69,034.55ms fixed-shape vs69,948.09ms gave identicalPNG, not a reliable speedup; the prior
same768 Q8gain239s→69s remains scoped evidence. All local candidate art is qualityAccepted:false.
Latest predecessor raw1024×576 had ambiguous Civet legs/body, rodent Platypus and inaccuratebotany.
Two actual conditioning comparisons still reject species/botany quality. Do not perform another
unchanged prose-only sweep or infer that a compiler guarantees generated identity.

Adaptive disposable-image cache planning remains advisory (500MB/1GB/2GB, explicitdesktop≤5GB),
while the new sole-original store does not evict. Origin deletion can still remove art; it is
not a backup. Background/reload job scheduling, cross-owner storage reservations, exact-image
sharing/export, all-family rigs/universalobjects and real seasons remain future work.
Audio smoothing has268focusedchecks/six DSP renders, but HUMAN listening remains open.

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

### Fresh-session startup and next concrete step

Verified ownership **OpenAI/Codex · macOS · `/Users/nick/Projects/celestial-frontier-openai-mac` ·
`openai/mac` · upstream `origin/openai/mac`**, SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`.
Starting 98cb is nine ahead / zero behind remote openai/mac at 9bfec7dc and 120 ahead / zero behind develop at c1791e21 at last
verified fetch 12:11 UTC. No GitHub writes this batch. Ambient .DS_Store stays untouched.

Read ROADMAP first, PROCESS_LAWS before UI/tests and PARALLEL_GIT_PROTOCOL before batches/handoff.
Reuse uninterrupted `audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json`; a truly fresh session
uses UI_TOOLCHAIN update/idle/lock startup. Terminal/files/isolated CDP only; native browser first
attempt outside Seatbelt/shared foreground lock. Caffeinate PID 33372 `-di` and 93550 `-i` verified
running this batch; no lock-screen/security setting changes. 1Password signing uses command-scoped
SSH_AUTH_SOCK and `/usr/bin/ssh-keygen`, then independent temporary allowed-signers verification.

Next bounded work: establish a spatial/per-subject conditioning contract and an executable
count/identity/placement acceptance rubric before another fidelity comparison; prose-only global
conditioning has twice failed. Audit a distributable local browser runtime pack separately from
model bytes, then qualify full installation/inference on Nick's actual target phone once identified.
Add an accessible full-painting inspection treatment for short screens without silently relocating
accepted controls. Keep original retention/recovery and all prior reds. Do not widen into an
unchanged prompt sweep or fullcertificate chain. [Paired review handoff](audits/AI_GAME_INTEGRATION_20260909/HANDOFF.md).
Native02 measures its recorded source hashes. A subsequent controller Retry guard refuses
failed/canceled recipes when model selection changes, preserving the old recipe and directing
the player to land again before any work starts. Its first eleven-case focused run and later
all-three-TypeScript/root validation pass separately; see retry-guard-01 and
validation-retry-guard.json in the AI packet. No later native or full admission is claimed.
Current source is frozen after that guard; only documentation and local signing follow.
No hosted attempt without exact current authority.

**Codex:** completed bounded source/evidence stays locally committed; verify its SSH signature. **GitHub step now: none.** Existing PR42 remains Draft/unlabeled,
base `develop`, source `openai/mac`, remote head 9bfec7dc. No new PR required. Existing title “Refine
responsive UI and add bounded audiovisual and painted-world prototypes” and body need accumulated
exact-head refresh before a future Ready/owner-label; not during this parked state.
**Claude:** intended app review pending; Nick need not open Claude while Codex completes this batch.
Use the committed handoff for later review. Claude's workspace is not synchronized; only after a
verified develop merge may clean `anthropic/mac` fetch/merge origin/develop, finishing dirty work
first. No manual copying. Develop/main/live site unchanged. Budget UNFROZEN/PUBLIC, private fallback
3,000, zero new exact owner-label runs; no Ready/labels/Actions/merge/release/deploy/schedule.
