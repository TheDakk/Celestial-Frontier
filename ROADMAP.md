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

## SESSION HANDOFF — 2026-09-05 · BATCH A ICLOUD BACKUP VERIFIED; PORTABLE REPLAY NEXT

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`,
tracking origin/openai/mac. This batch started clean at fba61fb0d51d6d3d377fdcfdd889e016987f41ba.
Develop remains c1791e210158de864fdd475323c3091d9ecbae58 (PR41); signed sync bc211be passed
301 files/3,100 tests/1 skip plus typecheck/artunused with root main.js absent. No game/test input
changed here, so unchanged gates are not repeated. Main/live site remain unchanged.

### Backup checkpoint

**Source-preservation prerequisite CLOSED via primary iCloud forced read-back.** See
`audits/AAA_BATCH_A_BACKUP_20260905.md` and adjacent JSON. Nick selected existing iCloud Drive
and a responsive OneDrive secondary; no purchase. The immutable bundle is37 files/10,742,015 bytes
(35 payload files plus index/restore notes); sorted ustar is10,769,920 bytes. Both copies used
rsync-a with source mtimes preserved. Full paths live in a new companion private backup index;
the37 original bundle inputs remain unchanged.

Global brctl status/monitor timed out without output; native per-file metadata instead proved
39/39 uploaded. iCloud brctl eviction succeeded and all39 destination files became cloud-only;
explicit download requests restored all39. At22:51:46.640097 UTC, all37 files plus tar passed
destination shasum and the source files matched previous public evidence. The truncated scratch
negative control failed as required and was deleted. Backup law now requires forced cloud
read-back, not just sync presence. All exact hashes/timestamps and tool limitations are recorded.

OneDrive listing responded, copy completed and upload metadata was positive, but brctl refused
its non-CloudDocs path. No supported CLI eviction was found; Finder automation permission was
unavailable. Secondary status is COPIED/UNVERIFIED, not “unresponsive/skipped” or verified backup.
A later OneDrive native evict/download plus matching hashes can close it; the primary is complete.

### Remaining authorized Batch A work

Next checkpoint: portable replay in a fresh derivative working copy using CF_AV_BUNDLE_ROOT.
Resolve ship/Lanternback output paths, preserve relative ecosystem.py, isolate REAPER's config,
relocate RPP/Lua outputs and browser verifier dependency. Replay one ship and one audio cue;
compare stored output hashes and report exact matches or documented nondeterminism. Do not rerun
unchanged tool-readiness probes or alter immutable originals. Then give B–D inputs a done/not-started
table only; no B–D work. The128/256MiB installed-pack policy remains reserved, enforcement/device
acceptance open. Eight body plans still require132/300/440 static+animated proof; invented
Lanternback concept does not close canonical coverage. The integrated-pilot approval stop stands;
Phase2/topbar/dock/rails are not authorized.

### Boundaries and paired next steps

- Codex: sign/push this backup evidence checkpoint, then complete the separately recorded
  portable replay and input-status checkpoint. New audiovisual records stay on openai/mac.
- Claude: continue only its own work; leave anthropic/mac c860f57 and unmerged173c806 negative
  control untouched by Codex. No manual copying, synchronization or PR requested now.
- Nick: no GitHub action needed and no need to open Claude now. OneDrive remains an optional
  unverified secondary. Artlock CI lane, ITP save protection and DECISIONS row19 wording stay open.

Budget UNFROZEN, PUBLIC, private fallback3,000. Established SSH origin/account remains
`git@github.com:TheDakk/Celestial-Frontier.git` / TheDakk. Authorized branch push triggers no
workflow; zero hosted runs, labels, PRs, merges, releases or purchases. No Settings/Guide/Training,
import door, workflow, Actions policy, protected-portrait or artlock-reference changes.
