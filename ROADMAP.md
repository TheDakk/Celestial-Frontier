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

## SESSION HANDOFF — 2026-09-06 · U1 UNIFORM LAUNCHER REVISION / VERIFYING

Codex/macOS owns /Users/nick/Projects/celestial-frontier-openai-mac on openai/mac,
upstream origin/openai/mac. Last pushed source8d92f0765562e02b1b208845e2c2873a1da9a8f3;
develop c1791e210158de864fdd475323c3091d9ecbae58 is already an ancestor. SSH origin remains
git@github.com:TheDakk/Celestial-Frontier.git; authentication/read/fetch passed as TheDakk
in this uninterrupted session. No fresh tool update pass is due. Only ambient .DS_Store
is untracked; it and other worktrees remain untouched. Root main.js is absent.

### U1 uniform launcher revision

Nick reviewed the prior U1 phone/desktop/tablet sheets. Phone improved, but larger screens
lost its layout. He directs one uniform UI across devices, retaining a bottom app-launcher
feel with compact capped scaling and productive use of extra screen space. This supersedes
the earlier side rails and bottom-right-only utilities, and continues U1 before its visual stop.

The same nine native controls/order now occupy the bottom launcher. Phone58/64/36/44 layout
is unchanged. Tablet701–1099 uses672px tray/72px pitch/66px boards/48px targets/40px faces;
desktop>=1100 caps at752px tray/80px pitch/74px boards/56px targets/44px faces. Prime stays
in the launcher; rails retain hidden compatibility IDs. Wide painted tray gaps own the
panel boundary. Narrow landscape<=900 keeps the phone arrangement and open-panel right
safe column. Caption/hint clear measured launcher height; existing wide utility-panel/toast
anchors follow its edge. Notification history remains at the shelf bell across devices.
No panel interiors, stack redesign, state/schema/RNG/receipts/import doors or art/audio changes.

Slice and Glass now observe actual dock owners and closest-button input through nested
labels. Gap controls use real launcher gaps. Hidden-opener fallback explicitly injects a hide
of the actual dockatlas after native Atlas/Survey input, preserving the historical test identity
and making that setup honest. Whole hidden rail roots are challenged/restored. Historical
ledgers, thresholds, measurement/ruler/ceilings, workflows, Actions policy and artlock stay intact.
The normal review tests all nine native open/Close/focus journeys and scaled launcher geometry.

Preparation passed typecheck,44 focused Slice tests,42 focused Glass tests, syntax/expression
checks. Current producer8253df4e53f89585d76ec5352980d688d3f646d48c97170c235507e83bba5a2e
and all components are pinned together; sealed measurement matches. A first preparatory
printer preceded the final release-copy cleanup; its output is retained, not certification.
Draft bulletin count remains81 with current launcher/Prime wording. Current refs and accepted
amendment agree; prior review records remain historical.

Required new-source verification: fresh checkout/no main.js; typecheck/artunused/full Vitest/
Glass selftest; fresh normal build and three-view review; Slice develop then small/large phone
canaries, each selected owner once, stopping on red. Normal visual diagnosis precedes the
longer browser chain so geometry faults fail early; Slice-to-Glass source ordering remains.
No previous source's PASS is claimed for this revision. Preceding exact cfd63ae checkpoint
passed locally and lives in audits/UI_U1_FINAL_cfd63ae_20260906; current revision evidence
lives in audits/UI_U1_LAUNCHER_REVISION_20260906.md and its forthcoming exact-source carriers.

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

- Codex: finish exact-source local checks and inspect the new comparison sheets, record
  failures before signed successors, then normal branch push and stop before U2 for visual review.
- Claude: prior and new U1 work remain outside develop. Review the published openai/mac
  checkpoint when ready; no manual copying or synchronization of unmerged work. Leave
  anthropic/mac c860f57 and173c806 untouched. Fetch/merge develop only after integration,
  on a clean owned branch under the parallel protocol.
- Nick: no GitHub action or app switch needed now. Review the revised compact launcher
  across devices before U2; open Claude when you want its review. PR fields are not needed.

U2–U4 have not started. Same visual language governs those later panel batches; resolve the
pasted stacking order against Settings-above-Training before U2. Integrated audiovisual pilot
approval, artlock CI lane, ITP save protection and DECISIONS row19 remain open. No Phase2.
Budget UNFROZEN; repository PUBLIC per last verification, private fallback3,000, zero hosted
attempts/labels/PRs/merges/releases/purchases/deploys authorized. Normal openai/mac branch push
is authorized and triggers nothing. Develop/main/live site remain unchanged.
