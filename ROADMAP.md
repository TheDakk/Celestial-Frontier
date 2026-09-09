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

## SESSION HANDOFF — 2026-09-09 · ACTUAL CLAUDE REVIEW AND CONTROLLER CORRECTIONS

**Current objective:** resume after Nick's accidental stop, collect the actual Claude response,
verify its findings, complete bounded corrections, preserve evidence and sign locally. This
review/correction batch is complete at signed `af4002783860422b6ffb5ca6b3a47b03099c8514`.
Its documentation-only successor records this exact signature and refreshed handoff; checked
implementation bytes are unchanged. Neither checkpoint has been pushed or merged.
Next substantive work is reliable canonical species/individual conditioning and reference quality,
not another unchanged progress/cache/kernel loop. No new generation or six-run step sweep occurred.

### Direction and implementation boundary

Nick approved the Living Worlds triptych and full landfalls “100%”: large cohesive **static**
paintings with multiple canonical flora/fauna, common light, materials, atmosphere, grounded anatomy
and vegetation overlap. The same complete individual identities belong in Compendium; future
articulated 2D family rigs must cover land, flying and aquatic creatures. Whole-portrait recoil is
staging polish, not a rig. Moving residents inside the landing painting is unnecessary now.
Universal objects should share the same identifiable painted direction. The approved finish is a
hard quality gate; a successful or fast model run cannot qualify artwork.

The browser remains a local on-demand AI proof of concept for a later engine game. No engine
pivot, hosted generation service, player installer or pre-generated million-image library has been
selected. Reference sheets inspire art; they never replace named Earth anatomy/botany, full seeded
genomes, ordered lineage, biome mapping, discovery/capture rules, flora healing/effects, saves or
accepted UI placement. [Complete new direction and changes since Claude's prior reviews](audits/CLAUDE_DIRECTION_REVIEW_20260909/HANDOFF.md).

Current optional `?paintedlanding=1` is one all-19-genome-admitted Earth/Civet study in the accepted
DOM band. `?livingvista=1` is the separate six-resident layered study; `?paintedvista=1` is canonical
barren Mars. They are default-off developer studies, not universal AI in the game. Their draft
release bullet says “optional”; clarify developer-query access before a future Ready candidate.
The accepted Earth world is `CF1|g:999@90,-60|s:424242@560,170|p:133#2`, environment
`cwe1:148:50c1b7d6`, with Civet/Platypus/Frog and Persimmon/Cranberry/Devil's Club in its display plan.
The snapshot retains all19 canonical genomes. It is not a geographic species database. D-9e stays open.

### Actual Claude review, not an inferred approval

The installed Claude CLI completed a fresh read-only review at12:49:06UTC of signed
`8bdbea9a65b1f64c09906fd99589d75e5d8bc50a`. Its own Anthropic/macOS root, `anthropic/mac` branch
and SSH origin were verified. It read immutable local Git objects without importing refs/copying
source or changing its workspace; no tests/build/browser/fetch/hosted action or existing-session
reuse. [Original response](audits/CLAUDE_DIRECTION_REVIEW_20260909/CLAUDE_RESPONSE.md),
[receipt](audits/CLAUDE_DIRECTION_REVIEW_20260909/CLAUDE_RECEIPT.json), original CLI JSON/request/
wrapper and exact artifact hashes are committed in that packet. Claude explicitly lists inspected
and uninspected scope; it did not review every accumulated file. Its verdict is **no merge yet**.

The packet distinguishes the prior narrow September6 U2 executable3a61352/product3f1578e response
from the broader September4 develop7bf3e847 review and inventories both intervening changes.
The actual review does not certify the correction successor. [Disposition of all15findings](audits/CLAUDE_DIRECTION_REVIEW_20260909/REVIEW_DISPOSITION.md)
records confirmed bugs, latent risks, unsupported claims and next work rather than applying every
suggestion blindly. Immediate category-zero audio silence is intentional; installed origin-model
bytes are already accounted for; four steps follow the model card, not a proved scheduler defect.
Phone impossibility and identity preservation “by construction” are not established by this proof.

Native-resolution independent rechecks see one Civet head/eye pair/two ears/one tail, with ambiguous
body/leg attachment. The old “coherent Civet” phrase was too strong; Claude's second-head claim is
unsubstantiated. Platypus and named botany still fail. Original reviews and PNG remain unchanged;
[clarification](audits/CLAUDE_DIRECTION_REVIEW_20260909/NATIVE_VISUAL_RECHECK.md) owns current interpretation.
All generated candidates remain **qualityAccepted:false**; none is retouched or promoted.

### Completed bounded correction and exact evidence

The isolated `tools/local-image-generation/` proof now has Land → ordered progress/ETA → ready
notice → explicit View landfall, plus a read-only canonical Field journal. The same page-owned job
survives panel navigation; completion never auto-returns. Work fraction is not elapsed-time percent;
denoise4/4 still requires decode and PNG publication. First-run ETA estimates remaining denoising
plus final processing; only an exact repeated successful page-local recipe calibrates total ETA.
This is not mounted on the normal-game Land button, its notification ledger or save transaction.

The review correction adds a panel-independent friendly failure/canceled message, retaining raw
errors in evidence. It checks already-requested cancellation at the decode await; native input
cannot preempt the synchronous conversion/publication span. Publication/return bind exact full
recipe/job, PNG, world/environment/epoch/snapshot identity to the existing Earth panel. Changed
identity, notice, panel or image refuses return and leaves the journal/notice intact. This is
research display binding, not a live route-authority or multiworld scheduler.

- Controller42/42PASS,35existing+7new, including same-turn cancellation, removed-guard rejection,
  post-publication cancel remaining inert, pre-publication destination change, eight stale bindings,
  exact restoration, friendly failures and retry. [Source-bound receipt](audits/CLAUDE_DIRECTION_REVIEW_20260909/review-controller-01.json).
- One real-browser [review-controller audit](audits/CLAUDE_DIRECTION_REVIEW_20260909/review-controller-native-01/result.json)
  passes three fresh-page flows with16trusted clicks, two hidden-ancestor negative/restored controls,
  six identity-mutation refusals and restored return. Real held HTTP, explicitly synthetic2×1RGB
  workers; no ONNX/inference/art acceptance. Six source rows unchanged; targets/browser/server closed.
  Root inspected friendly failure in journal and cancel on Earth screenshots. No phone qualification.
- RootvalidationPASS after correction:1010namedrenders/0booterrors/50originalfingerprints; legacy
  HTML SHA5d0844c45efa29ef0bd4d9f8254daeb1662d6f9e0934ceb6e30219d04e477746 unchanged.
  No normal-game/V2runtime source changed; no broader unchanged profile repetition.
- Earlier real1024×576 fixed-shape run remains69,034.55ms versus69,948.09ms, samePNG SHA
  2b0fea42177e2eeaf94e3c71480d6f0502177c3d1a7f9879c5149ef58ef370b7. Real resolved dimensions
  prove the override took effect. One0.914s/1.31% difference is not a reliable new speedup; opt-in only.
  Prior same768 Q8 gain239s→69s stands. Initial download/hash verification are outside those times.
  The eight ORT CPU-placement messages are retained, not claimed zero browser-log errors.
- Preserve earlier87-test aggregate84PASS/3localhostEPERM, separate4serverPASS, later35controller+
  8observer controls and native preparation01 circular-Socket instrumentFAIL. Separate corrected
  preparation02 six scenariosPASS remains scoped predecessor evidence, not a current-source rerun.
  [Batch result](audits/CLAUDE_DIRECTION_REVIEW_20260909/BATCH_RESULT.md) owns all receipts and limits.

### What remains unimplemented or unqualified

The model runtime inventory is6,691,020,416bytes/~6.23GiB, developer-only/ignored. Optional Q8block32
adds352,323,881 graph/data bytes while preserving represented weights and original shards. No model
is embedded or selected for shipping. Actual M4Pro24GiB inference is proved; uniqueRAM/VRAM,
phone/Safari/PWA features/buffers/thermals, cold download, foreground gameFPS and delivery are not.
Four-step schedule/mathematical inputs stay pinned. Prose prompts are handwritten for one Earth
scene; canonical genome→anatomy/conditioning compilation and accepted individual fidelity are missing.

The24-test cache planner is advisory: decimal500MB/1GB/2GB, explicit desktop≤5GB, origin-installed/
unknown bytes counted once. Only variants with verified protected exact copies are disposable.
New sole originals pause admission until separate protected retention exists. No storage executor,
atomic cross-tab reservation/eviction, durable multiworld job, model installer or device selector.
A seed is not exact-pixel recovery. CF1 shares location; exact-image/time-specific discovery sharing
needs retained pixels plus versioned appearance provenance. Native creature share/import, physical
seasons/daylight/orbital clock and universal skins/rigs remain future work. Current day/dusk/night is
seed-fixed; orbits are kinematic, not N-body/season simulation. No active-play clock law changes.
Audio25/90ms smoothing has268focusedchecks/six native DSP renders, but human listening remains open.

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

### Fresh-session startup, next action and paired Git handoff

Verified ownership: **OpenAI/Codex · macOS · `/Users/nick/Projects/celestial-frontier-openai-mac` ·
`openai/mac` · upstream `origin/openai/mac`**, SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`.
Original agent-communication fetch failure is preserved. After Nick reported1Password unlocked,
the distinct12:11UTC recovery authenticated TheDakk and passed repository read/fetch and PR42 read.
This does not infer the vault was previously locked. Both8bdbea9a and correction source
`af4002783860422b6ffb5ca6b3a47b03099c8514` are signed and independently verified. The
[correction signature receipt](audits/CLAUDE_DIRECTION_REVIEW_20260909/CORRECTION_SIGNATURE.json)
is retained by the following documentation-only checkpoint. That source is8ahead/0behind
origin/openai/mac and119ahead/0behind origin/develop; its doc successor adds one local commit.
Ambient.DS_Store is untouched; no scoped working changes remain after final documentation signing.
Last verified origin/openai/mac is9bfec7dc4a06d97dfd29f8f5424553336776c9fb; origin/develop is
c1791e210158de864fdd475323c3091d9ecbae58. Current source contains those ancestors; no GitHub write.

Read ROADMAP first, PROCESS_LAWS before UI/tests and PARALLEL_GIT_PROTOCOL before each batch/
handoff; consult affected current refs. Startup receipt `audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json`
was reused within this resumed uninterrupted session. A truly fresh session follows UI_TOOLCHAIN's
update/idle/lock runbook. Terminal/files and isolated CDP only; native browsers outside Seatbelt under
shared foreground lock. Existing caffeinate assertions were retained; no screen-lock settings changed.

Next bounded coding work: source-driven conditioning compilation for supported canonical species,
then one fixed-seed/reference-controlled anatomy comparison (e.g. Platypus). Reconcile pinned
scheduler sources before changing steps. Keep accepted paintings and all generated failures intact;
do not widen universal-object/species volume or run a materially larger exploratory sweep first.
Before gameplay integration implement durable-original retention and world-owned jobs outside the
landing save transaction, then qualify devices and required exact-head admission.

**Codex:** completed corrections/review evidence stay signed locally; no push. **GitHub step now:
none.** Existing [PR42](https://github.com/TheDakk/Celestial-Frontier/pull/42), base `develop`, source
`openai/mac`, stays Draft/unlabeled at9bf; its existing title “Refine responsive UI and add bounded
audiovisual and painted-world prototypes” and body need accumulated-head refresh before future
Ready/owner-label. No new PR needed. **Claude:** the requested local read-only review is complete;
Nick need not open its app now. Its workspace does not have these source changes. Only after a
future verified develop merge may clean `anthropic/mac` fetch/merge origin/develop; dirty work
must be finished/committed first. No manual source copying. Develop/main/live site unchanged.
BudgetUNFROZEN/PUBLIC, private fallback3000, zero new exact owner-label attempts; no Ready, label,
workflow dispatch/rerun, merge, release/deploy/version bump, automation or scheduled prompt.
The old4121tests/1skip at9bf do not certify this later head; obey the protocol's selected lane.
