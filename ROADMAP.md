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

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/mac`, upstream `origin/openai/mac`. U1 began at ec5188f5059fb3ce7ae8b99af68c51709f2ee9b6.
Develop c1791e210158de864fdd475323c3091d9ecbae58 is already an ancestor; no merge was needed.
SSH origin is git@github.com:TheDakk/Celestial-Frontier.git; this batch's authenticated
account/read/fetch preflight passed as TheDakk. No further hosted authority exists.

Nick accepted `port/UI_PARITY_PROGRAM_U1_U4.md`. U1 implements the normal game's shared
presentation tokens, local Inter, phone5+4dock at64px centers, relocated Inventory/scene
controls, desktop/tablet rails and bottom-right Records/Notifications/Guide/Settings.
Notifications preserve read/unread state through admitted existing save checkpoints;
product-action notices remain privately buffered until settlement, protected/Training
notices session-only. No save schema, action receipt, RNG or legacy import door changes.
References: UI_PRESENTATION.md, SAVE_SYSTEM.md and celestial-frontier-codebase-reference.md.

Exact source4af8073531613859c318af84a1df61ae6d37735b passed fresh typecheck, artunused,
310 Vitest files/3,261 tests/1skip and Glass selftest with root main.js absent. Slice then
reported five dependent findings: three old Records rail-opener calls and one Inventory
rail-opener call now hit the intentionally hidden compatibility controls; the Inventory
ledger sequence consequently did not run. The bounded successor moves instrument callers,
native pointer receipts and restored-focus contracts to visible dockrecords and topbar
dockinventory, retaining both actual rail-gap mutations and all Inventory outcomes. The
same relocation is being applied to directly dependent Glass callers. No product changes
or producer re-derivation in this correction. Producer remains60562956b771f572e3481075e78fdf95c764589c05ec6b6146a8f8db273c517c;
measurement/ruler/ceilings/history unchanged. Successor full verification is pending.
No phone canaries or comparison capture ran after red. `audits/UI_U1_CHECKPOINT_20260906.md`
and `UI_U1_REDS_20260906.json` retain every attempt and original red output.

Geometry decisions remain human review:44px utility targets imply44px desktop utility
pitch (+2 from legacy);44px rail targets plus the retained8px gap give52px rail pitch
(+10 from legacy). Phone64px centers are unchanged. Inter and these desktop adjustments
need Nick's review. Emoji remain pending U3; U2–U4 have not started. U2's pasted stack order
conflicts with the earned Settings-above-Training-card law and must be resolved first.

### Tooling and hardware

ImageMagick7.1.2-31, FFmpeg/ffprobe9.0.1 and Python3.12.14 are installed and verified;
GitHub CLI was updated to2.100.0. Node26.7.0 remains active;26.8.1 is deferred while managed
Node jobs run. `UI_TOOLCHAIN.md` owns exact inventory, purposes and before-use checking.
`tools/development-toolchain.mjs` verifies synthetic outcomes and versions; its7 tests
and7 capability checks pass. Shared tool lock tests6PASS. Root validate passes50fingerprints,
1,010renders and zero boot errors. An ImageMagick metric-parser red is preserved with its
strict-parser/binary-pixel-fixture correction in the dated tooling evidence.

The local daily09:00 America/New_York automation `maintain-game-development-tools` updates
idle active authoring tools under the shared lock, verifies changes and refreshes records.
It needs the Mac/app running; every batch also checks before use. It does not update game
runtime/test dependencies, sealed inputs, or parked tools and grants no GitHub authority.
A reusable personal `nick-game-toolchain` skill is installed for future Codex game tasks.

Blender enumerates Apple M4 Pro (GPU -16cores) through Metal. Preserved pilot recipes used
CPU/four render threads. Next artwork working copies should explicitly select Metal or,
after device/driver qualification on Windows, OptiX for Nick's reported RTX4080. No GPU
render/benchmark or Windows inspection was performed. No immutable source originals changed.
REAPER has a nonempty license file; validity/recognition unverified and key contents unread.
A fully GUI-free Surge patch/state render remains unproven; no Pedalboard/DawDreamer install.
AssetPack/DevTools's earlier isolated setup is parked; no extension loaded or game integration.

### Paired next steps and approval stop

- **Codex:** finish the bounded U1 instrument correction, sign the successor, then run its
  fresh required static → Slice → two phone canary sequence, stopping on red. Capture and
  inspect normal-game phone/desktop/tablet comparison sheets only after that succeeds.
  Publish evidence by branch push only, then stop before U2 for Nick's visual review.
- **Claude:** final U1 review is not ready yet. Unmerged OpenAI work is not on develop;
  continue unrelated work without copying files. Leave anthropic/mac c860f57 and173c806 alone.
- **Nick:** no GitHub action, PR or app switch is needed now. After the successful U1 sheets,
  judge layout/Inter/desktop spacing and request Claude's review if desired. Inkscape's UI
  art/icon study is U3, after the U1 stop and U2 panel/overlay work.

Integrated audiovisual pilot approval is still open; no Phase2, no release. Artlock CI lane,
ITP save protection and DECISIONS row19 wording stay open. BudgetUNFROZEN, repositoryPUBLIC
per last verified state, private fallback3,000; zero hosted attempts, labels, PRs, merges,
releases, purchases or deploys. An openai/mac branch push triggers no workflow. Ambient
untracked .DS_Store remains untouched and is not part of the change.
