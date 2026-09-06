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

## SESSION HANDOFF — 2026-09-06 · U1 UNIFORM LAUNCHER LOCAL PASS / VISUAL APPROVAL STOP

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`,
branch openai/mac, upstream origin/openai/mac. SSH origin is
`git@github.com:TheDakk/Celestial-Frontier.git`; authentication/read/fetch passed as TheDakk
in this uninterrupted session. Develop c1791e210158de864fdd475323c3091d9ecbae58 is already
an ancestor. Root main.js is absent. Ambient .DS_Store remains untracked and untouched.
The signed records-only successor to tested `88e9216ec869280900ac55df69c54238c260ea83` carries this handoff and
evidence for normal openai/mac branch push; the exact pushed SHA is reported separately.
No other worktree was edited; neither develop/main nor the live site changes in this batch.

### U1 uniform launcher and exact-source evidence

Nick directs one uniform UI across devices: keep the phone's bottom app-launcher feel,
use modest capped scaling, and use extra screen space for gameplay and panel content.
This supersedes side rails/bottom-right-only utilities and continues U1 before visual review.
The same nine native controls/order now occupy the bottom launcher. Phone 58/64/36/44
layout is preserved. Tablet 701–1099 uses 672px tray / 72px pitch / 66px boards / 48px targets / 40px
faces; desktop >=1100 caps at 752px / 80px pitch / 74px boards / 56px targets / 44px faces. Prime
stays with its boards; rails keep hidden compatibility IDs. Painted wide gaps own the
panel boundary. Narrow landscape <=900 keeps the phone arrangement and open-panel right
safe column. Caption/hint clear measured dock height; existing wide utility-panel/toast
anchors follow its edge. Notifications remains at the shelf bell, consistent with phone.
No panel interiors, new state/schema/RNG/receipts/import doors or art/audio changes here.
The earlier persistent notification implementation remains as documented in SAVE_SYSTEM.

Exact tested source `88e9216ec869280900ac55df69c54238c260ea83` from a fresh separate root-main.js-free checkout:
typecheck/artunused PASS; Vitest 311 files / 3312 tests PASS / 1 skipped; Glass selftest PASS;
fresh normal build and three-view review PASS (9 images / all 9 native opener/Close/focus
journeys), plus 61 exact trusted native button deliveries and three complete public
trail traces. Slice develop `20260906102037388-94777-7b436467e0c7` PASS, 371,828ms.

- small-phone (targeted-diagnostic): `20260906102651049-95109-ccbffa7de984` PASS, 14,236ms, zero findings/instrument failures.
- large-phone (targeted-diagnostic): `20260906102706994-95230-74564ef387e2` PASS, 13,979ms, zero findings/instrument failures.

Each selected owner ran once. Normal review preceded Slice for early visual diagnosis;
Slice then both phones used the same unchanged source. Full Glass/Compendium/production/
hosted certification and real-device/human acceptance were not performed. All nine normal
images were inspected: compact consistent launcher, no new clipping/access blocker.
Existing tablet nameplate ellipsis remains. Nick's visual approval is still required.
Evidence and retained red history: audits/UI_U1_LAUNCHER_REVISION_20260906.md,
UI_U1_LAUNCHER_REDS_20260906.json and UI_U1_LAUNCHER_88e9216_20260906/manifest.json.

3101576 stopped at obsolete release-copy checks;294cc79 passed static/normal review but
Slice correctly refused an old empty-sky point now covered by Settings. The successor
measures an exposed root-canvas point and retains trusted click, owned-canvas negative
control, exact restore and real dismissal outcomes. Late Glass release-clause probes are
included in this final source. Product bytes have not changed since 3101576.
The 6a88f85 normal review also observed Cosmos→Milky Way after Notifications Close.
No direct product Close-to-navigation mechanism was found; its cause remains unresolved.
The successor adds delivered trusted event ownership and public-trail chronology to the
normal review. Its PASS does not retroactively explain the red or prove a product repair;
Claude/Nick should review that retained observation before accepting U1.
Slice/Glass observe actual launcher owners/gaps; historical control IDs/ledgers remain.
The hidden-opener case explicitly injects a hide of dockatlas; Survey does not naturally
hide it. Current refs and accepted amendment agree; historical records are preserved.

Current producer 8253df4e53f89585d76ec5352980d688d3f646d48c97170c235507e83bba5a2e and
all components are pinned together. Measurement 4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12
and ruler/ceilings/history stay unchanged. Draft 81-bullet authority is
687ef4b59445d308b9e633876da3ed77456d9f903e2e4cf2d9a6e9538f13a60d. Workflows, Actions
policy, artlock/protected portraits and package manifests/locks are untouched by this revision.

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

### Paired next steps and approval boundary

- Codex/macOS: U1 local revision is complete; stop before U2 for Nick's visual review.
  Retain the same compact responsive language in later approved panel batches.
- Claude/macOS: review the published openai/mac checkpoint if Nick requests it. It is
  outside develop, so anthropic/mac does not have it. Do not copy unmerged files or
  disturb c860f57 / 173c806. After future integration, fetch and merge develop on a clean
  owned branch through the parallel protocol. Unrelated work can continue.
- Nick: review the new phone/tablet/desktop sheets. No GitHub action is needed now;
  PR details are not needed. Open Claude only when you want its review. Future integration
  needs a separately scoped reviewed PR into develop and exact hosted authorization.

U2–U4 have not started. Resolve the pasted stacking order against Settings-above-Training
before U2. Integrated audiovisual pilot approval, artlock CI lane, ITP save protection and
DECISIONS row 19 remain open. No Phase 2. Budget UNFROZEN; repository PUBLIC per last
verification, private fallback 3,000, zero hosted attempts/labels/PRs/merges/releases/
purchases/deploys authorized. Normal openai/mac branch push is authorized and triggers
no workflow (zero hosted minutes). No release or deployment performed.
