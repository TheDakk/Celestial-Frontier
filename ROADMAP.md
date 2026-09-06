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

## SESSION HANDOFF — 2026-09-06 local · TOOLING READY / U1 CHECKPOINT PENDING

Verified owner: OpenAI/Codex on macOS, physical workspace
`/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, upstream
`origin/openai/mac`. U1 began at ec5188f5059fb3ce7ae8b99af68c51709f2ee9b6, still the last
pushed head. Develop c1791e210158de864fdd475323c3091d9ecbae58 is already an ancestor.
SSH origin is git@github.com:TheDakk/Celestial-Frontier.git; this batch's authentication,
repository-read and fetch preflight passed as TheDakk. No SSH configuration changed.
No other agent's worktree was edited. Root main.js is absent; ambient untracked .DS_Store
is excluded and remains untouched. Signed successors preserve the original history.

### U1 implementation and exact-source evidence

Nick accepted `port/UI_PARITY_PROGRAM_U1_U4.md`. The normal game now has shared presentation
tokens, local Inter, five labelled phone boards plus four utilities at 64px centres,
Inventory in the nameplate, contextual Survey/Charts, desktop/tablet rails and bottom-right
Records/Notifications/Guide/Settings. Existing font/text-size/tone preferences remain active.
Notifications preserve explicit read/unread state through existing admitted checkpoints;
product-action notices stay privately buffered until settlement. Protected/Training notices
remain session-only. No schema, product receipt, RNG or legacy import-door changes.
Current references: UI_PRESENTATION.md, SAVE_SYSTEM.md and the codebase reference.

Exact source 06c6db3de3722e98788c2e5cc2e9a5ffd5a29c69 passed a fresh checkout's typecheck,
artunused, 311 Vitest files / 3,300 tests / 1 skipped and Glass selftest with no root main.js.
Immutable Slice run 20260906081806742-78145-ba27abe04ef9 passed in 374,536ms. Its exact
report, log and ten screenshots are in `audits/UI_U1_SLICE_06c6db3_20260906/`.

Small-phone stopped at run 20260906082423040-78387-ac3e5c4b06d1. Caption contrast, large-text
caption/hint clearance and the corrected compressed-grid negative control passed. The next
finding samples the transparent outer Records button although the visible emoji sits on a
dark inner face. Bounded instrument correction is prepared: sample actual utility glyphs
and unread badges, preserve native button identities and direct text, and update the related
nonmodal contrast mutant to the exact visible U1 membership (phone nine; desktop Prime plus
four utilities). Keep thresholds, historical control IDs and planned ledgers unchanged.
Large-phone, normal build and final visual comparison have not run after this red.

`audits/UI_U1_CHECKPOINT_20260906.md` and `UI_U1_REDS_20260906.json` retain every failure and
correction. Earlier successful Slice runs are preserved separately; none is claimed as a
completed U1 checkpoint or a full Glass certificate. Subsequent verification must use a new
clean signed source and stop after any red, without an unchanged-source retry. The existing
smokereport wrapper runs Slice once and adds immutable report/terminal verification.

Caption backing now preserves bright-art contrast. Long captions use the capped available
width; the phone caption clears the existing measured hint height by 8px while retaining
164px as its nominal minimum. No extra observer was added. The current Compendium producer is
ffb80c98195f8bb2e9bbeccdf6f52e5923843c2ed6f2a668634d6c35f5b26939. All component pins and the
appended narrative agree. Measurement authority 4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12,
sealed ruler, ceilings, samples and paired baseline are unchanged. The draft bulletin remains
81 outcomes. Workflows, Actions policy, production goldens, SceneMemory budget and artlock
references were not changed. Game manifests were restored to their sealed values earlier;
GSAP remains isolated in authoring tools.

### Tooling and hardware

ImageMagick 7.1.2-31, FFmpeg/ffprobe 9.0.1 and Python 3.12.14 are installed and verified;
GitHub CLI is 2.100.0. Node 26.7.0 remains active; 26.8.1 was deferred because managed Node
jobs were running. `UI_TOOLCHAIN.md` owns the full inventory, actual use and before-use rules.
`tools/development-toolchain.mjs` passed seven tests and seven capability checks; shared tool
lock tests passed six cases. Root validate passed 50 fingerprints, 1,010 renders and zero
boot errors. The original ImageMagick parser failure and corrected checks are retained in
the dated tooling evidence. These are tooling results, not artistic acceptance.

Nick replaced scheduled maintenance with a coding-session startup runbook on2026-09-06.
The `maintain-game-development-tools` thread automation is deleted. At the beginning of each
new game coding session, the agent checks official stable availability, applies eligible
updates to idle approved authoring tools under the shared lock, verifies changed capabilities
and records results/deferrals before development. Continued messages do not trigger another
update pass. This is an agent startup preflight, not an idle-app launch hook. AGENTS.md,
PARALLEL_GIT_PROTOCOL.md, UI_TOOLCHAIN.md and the personal `nick-game-toolchain` skill carry
it across sessions. Runtime/test dependencies, sealed inputs, parked tools and GitHub authority
remain unchanged. No tool installation/update was run merely to change this scheduling policy.

Blender has produced pilot ships/creatures/environments; Surge and REAPER have produced pilot
audio. Inkscape is CLI-tested but has not produced finished UI art: its icon/emblem study is
U3, after U1 visual approval and U2 panels/overlays. GSAP is staged and verified, not integrated.
ImageMagick/FFmpeg are ready for asset preparation and audio export/loudness work.

Blender enumerated the M4 Pro's 16-core GPU through Metal. Preserved pilot recipes used CPU
with four threads. Future working copies should explicitly select Metal, or OptiX after
qualifying Nick's reported Windows RTX 4080 and driver. No GPU render/benchmark or Windows
inspection occurred. Immutable source originals remain unchanged. REAPER has a nonempty
license file; key contents were not read and validity/recognition is unverified. Fully GUI-free
Surge patch/state rendering remains unproven. AssetPack/DevTools are parked; no extension is
loaded and no game integration has occurred.

### Paired next steps and approval stops

- **Codex:** run the signed utility contrast successor through the
  required fresh static → Slice → small-phone → large-phone sequence once. After success,
  build the normal distributable and capture/inspect phone, desktop and tablet comparisons.
  Preserve the fresh-build log binding the review images to that exact source. Publish by
  normal openai/mac branch push, then stop for Nick's visual review before U2.
- **Claude:** final U1 review is not ready. OpenAI work has not reached develop; continue
  unrelated work without copying files or assuming these changes are integrated. Review the
  published U1 checkpoint when ready. Leave anthropic/mac c860f57 and 173c806 alone.
- **Nick:** no GitHub action or app switch is needed now; PR fields are not needed. Review
  the final comparison sheets before U2. Inter, desktop utility pitch 44px (+2px over the old
  diagram) and rail pitch 52px (44px target plus retained 8px gap, +10px) remain visual decisions.
  Emoji remain through U2; the U3 SVG study requires a separate choice before replacement.

U2–U4 have not started. Resolve U2's pasted stacking order against the earned Settings-above-
Training law before implementing it. Integrated audiovisual pilot approval remains open;
no Phase 2, release or deployment. Artlock CI lane, ITP save protection and DECISIONS row 19
wording stay open. Budget UNFROZEN, repository PUBLIC per last verified state, private fallback
3,000; zero hosted attempts, labels, PRs, merges, releases, purchases or deploys authorized.
A normal openai/mac branch push is authorized and triggers no workflow.
