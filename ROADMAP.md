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

## SESSION HANDOFF — 2026-09-06 local · U1 LOCAL CHECKS PASS / VISUAL APPROVAL STOP

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`,
branch openai/mac, upstream origin/openai/mac. SSH origin is
`git@github.com:TheDakk/Celestial-Frontier.git`; this batch's authentication/read/fetch
preflight passed as TheDakk. Develop c1791e210158de864fdd475323c3091d9ecbae58 is already
an ancestor. U1 began at ec5188f5059fb3ce7ae8b99af68c51709f2ee9b6. No other worktree was
edited. Root main.js is absent. Ambient .DS_Store remains untracked and untouched.
Signed successor history is preserved. The final evidence/docs commit follows the tested
source below and is intended for normal openai/mac branch push; its actual push receipt is
reported to Nick. Neither develop, main nor the live site is updated by this branch push.

### U1 implementation and review evidence

Normal-game U1 has shared presentation tokens/local Inter, five labelled phone boards plus
four utilities at64px centres, Inventory in the nameplate, contextual Survey/Charts,
desktop/tablet rails and bottom-right Records/Notifications/Guide/Settings. Existing font,
text-size and tone preferences remain authoritative. Persistent read/unread notifications
use existing admitted checkpoints; product-action notices stay buffered until settlement,
and protected/Training notices remain session-only. No schema/RNG/product-receipt or legacy
import-door changes. UI_PRESENTATION.md, SAVE_SYSTEM.md and the codebase reference agree.

Exact tested source `cfd63ae6a024d806c2df02fd65b64f066f973021`: typecheck/artunused PASS,311 Vitest files/
3,300 tests PASS/1 skipped, Glass selftest PASS. Slice `20260906091030879-84426-e7f8f021242a` PASS
(374208ms). Small/large phone canaries PASS with zero findings/instrument failures:
20260906091646886-84800-e3a2e6e93436 (small-phone); 20260906091702950-84915-6ed69372fd67 (large-phone). Fresh normal build and three-view review PASS,9 images,
zero console errors. Evidence: `audits/UI_U1_FINAL_cfd63ae_20260906/`; overall checkpoint and complete red
history: `audits/UI_U1_CHECKPOINT_20260906.md` and `UI_U1_REDS_20260906.json`.
This is local U1 evidence, not full Glass/Compendium certification or real-device approval.
All nine normal-review images were inspected; VISUAL_REVIEW.md records visual choices,
text truncation and the approved tablet layout difference. No visible U1 access blocker was found.

Compendium's default label now fits with zero phone horizontal padding: natural54.338px
inside56px available;58px chip/64px pitch/font unchanged. The default Inter dock is92px;
larger Settings text can grow its auto row. Caption backing passes bright-art contrast and
clears the existing measured hint height by8px with164px minimum bottom offset. No new
observer was added. Current Compendium producer `0df5435f66dbd057b15690404aeb38a4dcfb2d09c2bb344a53288acac237535e` and all component pins agree.
Measurement4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12, ruler,
ceilings, samples and paired baseline are unchanged. Bulletin remains81 outcomes.
No workflow/Actions-policy/production-golden/artlock changes. Game manifests were restored
to sealed values earlier; GSAP stays in isolated authoring tools. Desktop rail pseudo-element
contrast sampling is an explicit future U4 coverage item, not covered by these phone canaries.
The normal-review restore checks cover mutated properties and geometry, not full attribute bytes.

### Tooling and session startup

Nick replaced the chat schedule with coding-session startup maintenance. The
`maintain-game-development-tools` automation is deleted; no replacement timer/task exists.
At each new coding session, after repository identity/sync and before code/build/render,
check official stable availability; automatically apply eligible updates to approved idle
authoring tools under the shared lock; verify changed capabilities and record results or
deferrals. Reuse the receipt within the uninterrupted session. This is the agent startup
runbook, not an idle-app launch hook. AGENTS.md, PARALLEL_GIT_PROTOCOL.md, UI_TOOLCHAIN.md,
PROCESS_LAWS.md and personal `nick-game-toolchain` memory carry it across sessions.
No tool was installed/updated merely to move the schedule. Sealed runtime/test dependencies,
parked tools and GitHub/purchase authority remain unchanged.

ImageMagick7.1.2-31, FFmpeg/ffprobe9.0.1, Python3.12.14 and gh2.100.0 are installed and
verified. Node26.7.0 remained active;26.8.1 was deferred because managed jobs were running.
Tooling capability/tests7 each and shared-lock tests6 passed; root validate previously passed
50 fingerprints/1,010 renders/zero boot errors. UI_TOOLCHAIN.md owns the full dated inventory.
Blender produced pilot ships/creatures/environments; Surge/REAPER produced pilot audio.
Inkscape is CLI-tested, with finished icon/emblem study scheduled for U3 after U1 approval
and U2. GSAP is staged/verified, not game-integrated. AssetPack/DevTools are parked.
M4 Pro16-core GPU was enumerated through Metal; prior pilot recipes used CPU/four threads.
Future working copies should qualify Metal or reported Windows RTX4080 OptiX; no GPU render,
benchmark or Windows inspection occurred. Immutable masters stay unchanged. A nonempty REAPER
license file exists (contents not read, recognition unverified); fully GUI-free Surge rendering
remains unproven. Players install none of these authoring tools.

### Paired next steps and approval stops

- **Codex/macOS:** publish final docs/evidence by the authorized normal openai/mac branch
  push and report its exact SHA; then stop for Nick's U1 visual approval before U2.
- **Claude:** review the published openai/mac U1 checkpoint and comparison sheets. These
  changes are not in develop; continue unrelated work without manual file copying. After
  eventual authorized integration, use a clean owned branch to fetch/merge origin/develop
  under the protocol. Leave anthropic/mac c860f57 and173c806 untouched.
- **Nick:** review phone/desktop/tablet comparison sheets before U2. Inter, desktop utility
  pitch44px (+2 over legacy diagram), rail pitch52px (44target+8gap, +10) remain visual choices.
  No GitHub action is needed; PR fields are not needed. Open Claude only when you want its
  review, not to synchronize unmerged files. Emoji stay through U2; choose the U3 SVG study
  before replacement.

U2–U4 have not started. Resolve U2's pasted stacking order against the earned
Settings-above-Training law before implementation. Integrated audiovisual pilot approval
remains open; no Phase2/release/deployment. Artlock CI lane, ITP save protection and DECISIONS
row19 wording remain open. Budget UNFROZEN, repository PUBLIC per last verified state,
private fallback3,000; zero hosted attempts/labels/PRs/merges/releases/purchases authorized.
The normal openai/mac branch push triggers no workflow.
