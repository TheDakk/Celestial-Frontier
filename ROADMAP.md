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

## SESSION HANDOFF — 2026-09-09 · USER-REQUESTED PAUSE

**Newest scoped request:** [12-second desert living-painting preview](audits/LOCAL_AI_DESERT_MOTION_20260909/README.md)
rendered as1024x576/24fpsMP4 plusGIF: gentle camera, dust and approximate distant heat haze.
Loop/control/source/cleanup checks passed. This is ambience over the unchanged PNG; creatures
remain fixed poses and no universal rig or game integration was added. Broader work stays paused.

**Latest scoped request:** one text-only alien desert local generation completed in58.751s at
1024x576, without any reference image. [Exact output/recipe/review](audits/LOCAL_AI_DESERT_TEST_20260909/README.md).
Source/runtime integrity, collected browser-event check, three refusal controls and cleanup passed.
It demonstrates a different conceptual biome; finish is smoother/more stylized than target and
art/anatomy remain unaccepted. Broader development stays paused; no downloads/hosted actions.

**Later scoped request:** Nick authorized one standalone local fungal-biome visual generation.
[Experiment and exact outcome](audits/LOCAL_AI_FUNGAL_TEST_20260909/README.md). This uses the
existing developer model/derivative; broader development and the pending integration stay paused.
The one render completed in71.126s at1024x576; raw PNG and supplemental runtime/browser/source
checks are retained. It is reference-guided concept output, with art/anatomy review still open.
No new download, hosted action or schedule.

Nick paused development because account usage is nearly exhausted. **Do not code, build or run
models until he resumes.** The complete self-contained restart record is
[audits/AI_PORTABLE_CLOSURE_20260909/PAUSED_CHECKPOINT.md](audits/AI_PORTABLE_CLOSURE_20260909/PAUSED_CHECKPOINT.md).
The [Claude handoff](audits/AI_PORTABLE_CLOSURE_20260909/HANDOFF.md) points to this current record.
The previous live handoff is preserved VERBATIM at the top of ROADMAP_ARCHIVE.md, including every
older verification blocker. No evidence or failure has been deleted or relabeled.

Signed HEAD f6eed9b4c65a1aafc0ddd19f0be73851b3c87d13 contains the prior84-file batch. Current
continuation is UNCOMMITTED, final integrated code UNVERIFIED. openai/mac, recorded13ahead/0behind
origin/openai/mac9bf;124ahead/0behind origin/developc179. No fresh fetch/push. .DS_Store untouched.
Signing restored with configured1Password op-ssh-sign; do not override signer with ssh-keygen.

Completed: exact-six-reference portable first-step native diagnostic succeeded; execution85.013s,
readback0.275ms, explicit partial terminal/no PNG,28sourcehashesunchanged and cleanup passed.
Earlier offline normal-game600s aggregate FAIL remains unchanged. Earlier focused45/runtime12/
threeTS/rootvalidate passed before the later integration. Current implementation adds bounded
browser-derived336MiB block32 outputs, transactional OPFS adapter and explicit Prepare/Verify
controls, bounded original lookup, pinned plan packaging and offline native proof. Latest storage/
controller/pack/observer changes have NOT been tested; no new pack or integrated native run exists.

On resume: follow fresh startup/protocol, inspect dirty inventory, add missing parent-inventory
assessor controls/review, run saved integrated chain outside Seatbelt, then only after PASS build
new pinned optional pack and run one changed --landfall --variant offline native attempt. Inspect
exact PNG/species fidelity afterward. All copy-ready commands, pins, evidence and limits are in
the checkpoint. Do not reuse package03 for changed-source evidence or repeat an unchanged failure.

Art/reference fidelity, real iPhone delivery/performance, HUMAN audio and historical UI/admission
blockers remain open. Target iPhone/iOS unknown.6.23GiB optional model/336MiB derivative are separate
from500MiB–1GiB painting cache and GPU RAM. No invented phone/art acceptance, hosted action or schedule.

Codex next step: remain paused; retain this working copy. GitHub step NONE: PR42 parked Draft/
unlabeled at9bf, base develop/source openai/mac; no Ready/label/Actions/merge/deploy/push authority.
Claude next step: no need to open now; its checkout lacks these local changes. Accumulated review
packet and future PR title/body are recorded. Only after verified develop integration may clean
anthropic/mac fetch/merge origin/develop. Develop/main/live unchanged. Budget recorded UNFROZEN/
PUBLIC, private fallback3000, zero new exact hosted attempt authorized.
