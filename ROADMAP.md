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

## SESSION HANDOFF — 2026-09-05 local · UI TOOL SETUP / DESIGN REVIEW

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/mac`, upstream `origin/openai/mac`. Setup began clean/synchronized at
`79b2e52ff40f834f4d5bf610c4a3ef55e81a82b6`. SSH origin is
`git@github.com:TheDakk/Celestial-Frontier.git`, freshly authenticated as TheDakk; remote read confirms the unchanged upstream/develop heads.
Recorded origin/develop `c1791e210158de864fdd475323c3091d9ecbae58` is already an ancestor;
no merge or other-agent checkout change. Superseded handoff is archived verbatim.

Nick authorized installing Inkscape and GSAP and checking the existing audiovisual suite.
Inkscape 1.4.4 is installed via Homebrew at /Applications/Inkscape.app with the inkscape CLI;
a new 132px export completed without opening its editor. @cf/game now pins GSAP 3.15.0 with
npm integrity; terminal import and paused 0/50/100 interpolation pass. GSAP is not imported
into runtime code; 29 normal-build source maps contain zero GSAP sources. No player-facing
code, portrait, workflow, Actions policy, artlock reference or import-door change.

`UI_TOOLCHAIN.md` owns the installed inventory, usage/cleanup guidance, costs and architecture
recommendations. `audits/UI_TOOLCHAIN_SETUP_20260905.json` owns setup results. V2 typecheck,
artunused and normal distributable build pass; root validation passes 1,010 Earth renders,
zero boot errors and 50 deterministic probes. Root main.js remains absent. No full admission
battery or new browser certificate was run for an unactivated dependency; existing pilot
proof remains evidence for its original source, not certification of this successor.

Installed Blender 5.2.1, Surge XT 1.3.4 and REAPER 7.79 match the checked earlier readiness records;
passed render tests were not repeated. The Surge CLI binary exists but its previously tested
interface does not provide offline file export. Our existing offline Surge renders use REAPER.
REAPER can still open a window/device dialog: a strict windowless offline audio workflow remains
OPEN. DawDreamer is only an unevaluated option; no replacement, purchase or device change.
FFmpeg/ffprobe/ImageMagick are absent from PATH and checked bundled binary locations; they are
optional, not blockers for the present verified image/audio output pipeline.

### Current visual decision and pilot boundary

Nick says the refined pilot still falls below production's visual quality and is asking Claude
for prioritized design recommendations. No integrated-pilot approval has been given. The next
proposed direction is one complete, polished game screen with a representative panel, matching
production's density, semantic colors and accessible controls before scaling across surfaces.
Any proposed top bar/dock/rail redesign remains a review design until the Phase2 boundary changes.
No new UI rework or art production was performed in this tooling batch.

Previous playable candidate: http://127.0.0.1:4183/?avpilot=1 and
http://127.0.0.1:4183/audiovisual-pilot.html, verified product source
1b208c7fe5b47aefee811ad84b486d5ef7fa106a. Its 308 files/3,239 tests/1 skip and scoped browser
results remain in audits/AAA_PILOT_REFINEMENT_20260905.md. New setup does not replace that
served preview. Galaxy overhaul and all 8 anatomical families remain incomplete. Protected
portraits stay intact. Human listening, real iPhone/Safari/PWA checks and 256 MiB retained-update
enforcement stay open. Source preservation for the prior refinement remains CLOSED under its
forced iCloud read-back evidence; no new production asset masters were made here.

Nick also asked about browser/Steam/Unity/Unreal. Recommendation: preserve browser/PWA and
later assess a bundled desktop build for Steam. No engine migration is required for Steam.
Unity/Unreal would be substantial separate ports. No desktop wrapper, engine install, Steam
payment/account operation or port implementation is authorized by this assessment.

### Paired next steps

- **Codex/macOS:** publish the completed tooling records as a signed branch-only handoff; hold visual
  implementation at the existing pilot stop while Claude's critique and Nick's direction settle.
- **Claude:** review the pushed records/source if requested; continue own unrelated work.
  These setup changes are not in develop. Do not copy files or assume them installed on another
  machine. After eventual separately authorized integration, sync through origin/develop into
  a clean anthropic branch. Leave anthropic/mac c860f57 and its unmerged 173c806 alone.
- **Nick:** no GitHub action or app switch is required for this setup. Share Claude's design
  recommendations when ready; choose visual direction before any broad rollout. Artlock CI lane,
  ITP save protection and DECISIONS row 19 wording stay open.

Budget UNFROZEN, repository PUBLIC per last verified state, private fallback 3,000. Only matching
openai/mac branch publication is authorized; it triggers zero workflows/runner cost. Zero hosted
attempts, labels, PRs, merges, purchases, releases or deployments. Later integration requires a
bounded openai/review-* PR into develop under its own authorization, never a direct main change.
