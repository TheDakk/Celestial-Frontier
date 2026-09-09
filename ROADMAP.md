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

## SESSION HANDOFF — 2026-09-09 · FULL PAINTING / STATIC RUNTIME / FIDELITY CONTRACT

**Current objective:** Nick asks to continue species fidelity, mobile delivery and normal-game AI,
and says “The latest image looks fantastic.” Carry the favorable painted finish forward while
preserving canonical species/count/botany requirements. Continue the browser proof of concept for
a later engine game. No engine pivot, new scheduled prompt, hosted generation service, GitHub
write or release. Claude's intended app review remains pending; no review was dispatched here.

**Checkpoint:** this batch starts from signed `309809f4df12c711d75822eff1e21bc9ad8a1463`.
The completed local checkpoint is the commit containing this handoff (parent above); Git records
its full SHA and SSH signature. Source, current references, immutable first failures and the
[paired handoff](audits/AI_LANDFALL_CONTINUATION_20260909/HANDOFF.md) are included. Do not claim
all three requested priorities are finished: physical phone/full model delivery, approved species
fidelity and shipping/combined PWA qualification remain open.

### Approved direction and preserved authority

Landfalls are large cohesive static paintings with multiple canonical flora/fauna, shared light,
materials and atmosphere, grounded anatomy and vegetation overlap. Compendium retains full seeded
individuals and flora effects. Later articulated 2D battle rigs must cover land, flying and aquatic
families; universal objects share this finish. Whole-portrait recoil is not a limb rig. Nick's
latest praise is favorable finish feedback, not an explicit PNG-SHA approval or waiver of named
species/count requirements. Earlier failed images/reviews remain intact.

All named Earth anatomy, full genomes/ordered lineage, biome mapping, saves, gameplay clocks and
accepted base control placement remain authoritative. The live compiler still admits only Earth
`CF1|g:999@90,-60|s:424242@560,170|p:133#2`, environment `cwe1:148:50c1b7d6`, epoch 0, all 19 genomes.
Its displayed six are Civet, Platypus, Frog, Persimmon, Cranberry and Devil's Club. D-9e stays gated;
there is no universal taxonomy, real orbital/season clock or exact-image sharing implementation.

### Current source and evidence

[LOCAL_AI_GENERATION.md](LOCAL_AI_GENERATION.md) owns current behavior.
[Continuation packet](audits/AI_LANDFALL_CONTINUATION_20260909/README.md) owns this batch's receipts.
The entire previous handoff is preserved verbatim at the top of ROADMAP_ARCHIVE.

- `landfall-viewer.ts`: explicit native modal for the unchanged retained Blob, Fit painting and
  actual-size panning, keyboard/Close/focus, lifetime background isolation including late roots,
  stale/successor decode protection and URL/DOM cleanup on Close/pagehide. It adds no game save,
  world navigation, inference, image recompression or base control relocation.
- Controller/main: Ready rows offer Inspect; normal Survey exposes a restored original after
  reload when page job rows are absent. A fresh store read/hash and both view/inspection sequence
  checks precede opening. Close invalidates pending reads. Actual world presentation still uses
  the previous transactional sprite/lease owner; a failed replacement retains prior visible art.
- `runtime-pack.mjs`: builds/verifies the exact locked ORT WebGPU + actual Asyncify JS/WASM closure,
  Tokenizers, project helpers, reference and available notices as static `/__local_ai/` files.
  First actual pack is **28,393,596 bytes / 27.08 MiB**, 23 payload files plus inventory, no weights.
  The separate external inventory SHA is `e2442474afd168c2a7a9f1fb798591583b3ead962ef9135a0980c0f9d739ae21`.
  Local output `/private/tmp/cf-runtime-pack-20260909-build-01`; rebuild from pinned sources rather
  than depending on temporary survival. Combined app/update/PWA, distribution and phone gates stay open.
- Static runtime config now uses an installed-only schema. No automatic model fetch or developer
  fallback; explicit successful OPFS verification is mandatory before a job starts. Failed
  verification keeps it closed. Retained-original inspection does not require model readiness.
- `landfall-fidelity.ts`: detached full-identity/anchor/diagnostic review contract, exact encoded
  PNG/recipe/reference digests, six complete unique observation records and explicit counts.
  Incomplete, duplicate, mixed, stale or inconsistent records refuse. Both actual old outputs are
  negative controls; positive observations are synthetic. It is not imported into the live game,
  does not authenticate reviewers or recognize pixels, and never grants full quality acceptance.
  The actual graph has five inputs and no mask/box input; whole-reference tokens/global text
  do not enforce per-instance location or count. Ordered identity-bound references are the next
  feasible input adapter, not a proven spatial/fidelity guarantee.

### Verification scope — preserve first failures

Controller/main/viewer first set: 35 PASS / one fixture FAIL (HTML attribute insertion order after
restoration). Corrected per-attribute name/presence/value ruler: seven viewer PASS, unchanged product
source. Added pagehide case plus main ownership: 22 PASS. Controller installed-only/inspection
initial 15 PASS, then 16 PASS after a read-only review found and corrected the concurrent inspection
read/close race. Exact raw logs and initial sources are retained.

Fidelity first 18 PASS, then combined TypeScript stopped on its inferred `never` helper. Explicit
never-returning function declaration enables narrowing without changing guards or tests; corrected
source passed the same 18 cases. Subsequent all three TypeScript programs and root validation pass:
1,010 renders, zero boot errors, 50 unchanged original deterministic fingerprints. Runtime pack
first controls 11/11 PASS; first actual build and separate external-SHA verification PASS.
No full profile/certificate or current native inference is claimed.

Native viewer first attempt stopped before Inspect: target not visible after toggling Notifications.
Its wait only required mounted=true, which could already hold before asynchronous View completed.
First helper omitted failed geometry; the precise first visibility cause is not proven. Changed
observer waits for mounted+closed Notifications, then revealed controls/frames; it also retains
failed geometry/screenshot/UI. First result/runner are immutable. Native02 passed image/geometry/
panning checks but failed Close focus: resize had closed Notifications, leaving its old Inspect
unusable. The product now captures the intent before storage read and restores the same live
job action, or the visible existing panel opener when its panel has closed. Its corrected ruler
checks that actual panel state rather than demanding a hidden Inspect. Both first failures,
measured source copies and explanations are preserved. The release-note text changed only after
native01 had already closed; no measured source changed in any run.

Final validation03: 26/26 viewer/controller checks, all three TypeScript programs and root
validation PASS. Native03 PASS: 14 trusted clicks, seven observations, full original Blob SHA,
1024×576 desktop fit, 278×156.375 fit at 320×568, actual-size panning, a rejected 40px-image mutant,
keyboard trap/Escape, live focus return, Earth preserved and normal Survey inspection after reload.
No inference/model-file requests; all36 source hashes unchanged and target/browser/server/locks
closed. Screenshots are reviewed for this bounded UI scope, not physical-phone or species approval.
Three favicon404 records remain; this is not a zero-browser-error claim. No broad admission rerun.

### Remaining acceptance and next bounded work

The latest actual model run remains the prior **74.307-second** native02 experiment in
AI_GAME_INTEGRATION_20260909. Its scene is cohesive; species/count/botany remain wrong. This batch
reuses that exact PNG for UI checks and generates no new artwork. Favorable user finish feedback
is retained without relabeling either old negative species review.

The full model is still **6,691,020,416 bytes / 6.23 GiB**, separate from runtime, original art,
saves and GPU/RAM. Optional desktop Q8 derivative adds 352,323,881 bytes. No mandatory player model
is selected or storage budget increased. A 27.08 MiB standalone runtime pack does not qualify the
combined 128 MiB app or 256 MiB retained update. Exact native-component/source-notice correspondence,
deployed headers/offline behavior, physical iPhone/Safari/PWA, full install, RAM/buffers/thermals,
foreground FPS and latency remain unqualified. Nick's target-phone identification is still pending.

Original lookup includes the full model recipe: a changed model recipe after reload cannot
automatically discover an older PNG, though the original remains retained. Cross-recipe discovery
needs its own identity-safe index. Outside-origin backup, export/exact-image sharing, background/
reload-durable jobs, adaptive eviction/reservations and broader canonical worlds remain unfinished.
The old 76×43 base-scene thumbnail remains a separate limit; full inspection preserves that base
layout. All-family rigs/universal objects and real seasons remain future work. Audio has its prior
268 focused checks/six DSP renders; HUMAN listening remains pending.

Next code: ordered full-identity anatomy-reference inputs with a bounded actual output comparison;
never label text/global references as hard spatial control. Integrate the reviewed static pack
into combined app/offline delivery and qualify the actual target phone. Add identity-safe original
discovery across model recipes. Preserve all earlier reds; do not repeat an unchanged prompt sweep,
certificate chain or broad profile. Record code/current-reference changes together.

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

### Fresh-session startup and paired Git handoff

Verified **OpenAI/Codex · macOS · `/Users/nick/Projects/celestial-frontier-openai-mac` · `openai/mac` ·
upstream `origin/openai/mac`**. Origin `git@github.com:TheDakk/Celestial-Frontier.git`; prior SSH read
passed. Starting 309809f4 is ten ahead / zero behind origin/openai/mac at9bfec7dc and121 ahead /
zero behind origin/develop atc1791e21, using the last verified refs. No fresh fetch is needed for
this local continuation; no GitHub writes. Ambient `.DS_Store` stays untouched.

Read ROADMAP first, PROCESS_LAWS before UI/tests and PARALLEL_GIT_PROTOCOL before each batch/handoff.
Reuse `audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json` only within the uninterrupted session;
a truly fresh session completes UI_TOOLCHAIN update/idle/lock startup. Terminal/files/isolated CDP
only. Native browsers start outside macOS Seatbelt under shared foreground and checkout locks.
Existing caffeinate assertions stay unchanged; no lock-screen/security settings or personal UI.
Use configured 1Password SSH socket only via command-scoped SSH_AUTH_SOCK and ssh-keygen; verify
the resulting signature independently with a temporary allowed-signers file. Never export keys.

**Codex next step:** resume the bounded reference-input/delivery work above from this signed local
checkpoint; keep PR42 parked. This checkpoint is eleven ahead of origin/openai/mac and122 ahead of
origin/develop at the last verified refs, zero behind each. **GitHub step: none.** PR #42 stays Draft/unlabeled, base `develop`, source `openai/mac`, old remote head9bfec7dc.
No new PR needed. Before any future authorized push/Ready/owner label, refresh its exact accumulated
head/title/body and run the selected admission lane. Existing title is “Refine responsive UI and
add bounded audiovisual and painted-world prototypes.” Prepared replacement fields belong in
this batch's HANDOFF.md, not in a GitHub write now.

**Claude:** intended app review pending; Nick need not open Claude for this coding batch. Review
the committed packet when wanted. Claude's checkout has not received local Codex changes. Only
after verified develop integration may a clean `anthropic/mac` fetch/merge origin/develop; commit
or finish dirty work first, no manual copying. Develop/main/live site unchanged. Recorded budget
UNFROZEN/PUBLIC, private fallback3,000, zero new exact owner-label attempts. No Ready, labels,
Actions, merge, release/deploy, automation or scheduled prompt.
