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

## SESSION HANDOFF — 2026-09-05 · BACKUP CLOSED; PORTABLE SHIP PASS; AUDIO OPEN

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, openai/mac,
tracking origin/openai/mac. Base develop remains c1791e210158de864fdd475323c3091d9ecbae58.
The clean sync bc211be passed301 files/3,100 tests/1 skip plus typecheck/artunused without root
main.js. No game/test inputs changed in these source/documentation checkpoints; no battery rerun.

### Completed backup checkpoint

Signed/pushed629e0cceeb4df474ab2a7c8f9da21085c368aead closes source preservation. The37 immutable
source inputs plus sorted ustar passed forced iCloud eviction/download and38/38 destination
checksums; truncated scratch control correctly failed. Native39/39 per-file uploaded/current
states were recorded because global brctl status/monitor timed out. No fabricated status line.
OneDrive listing responded and copy completed, but brctl rejected its non-CloudDocs path;
secondary remains COPIED/UNVERIFIED. Full paths are in a companion private index outside the
immutable bundle and Git. See audits/AAA_BATCH_A_BACKUP_20260905.md/.json.

### Portable replay checkpoint

See audits/AAA_BATCH_A_PORTABLE_REPLAY_20260905.md/.json. Seven derivative files now use explicit
bundle/config/tool dependency paths; original37 inputs are unchanged. Four Python AST and one
JavaScript parse check pass. The RPP's embedded MIDI/Surge state is unchanged; its output path
is rebound for the fresh directory. Lua's derivative sink strings match the final preserved RPP.

One ship save/separate-process render passed. PNG hashes differ only in metadata; decoded image
header/scanlines are identical. This proves relocated ship-terminal replay only. No Lanternback
or other tool-readiness reruns occurred.

Portable audio is OPEN: one fresh-config REAPER render launch waited45.02s with no output; the
process later disappeared without a retained exit code or WAV/FLAC files. The log only shows
Metal context creation. Cause unknown; UI automation permission unavailable. Nick has a pending
question about any startup dialog. Do not call this audio/plugin/waveform/listening acceptance.
The private derivative work/results are preserved separately, excluding generated REAPER
.runtime defaults/config/registration. Next bounded step is to identify the startup/render
blocker with UI access or Nick's observation and finish the one-cue output comparison.

### Next checkpoint and boundaries

B–D input status table is next, with no production work yet. Eight body plans still need all
132/300/440 static+animated conditions; existing concept/readiness examples do not close them.
128MiB complete pack/256MiB aggregate update policy remains reserved; enforcement/device proof
is open. Installed-PWA promise remains conditional on retained ready content. The integrated
pilot approval stop and Phase2/topbar/dock/rails boundary remain.

- Codex: checkpoint this partial portable result, then record the requested B–D status table.
  Audio remains a visible open prerequisite; no blind repeat or larger diagnostic loop.
- Claude: continue its own work; anthropic/mac c860f57 and unmerged173c806 are untouched.
  Audiovisual records stay on openai/mac; no manual copying or GitHub action requested.
- Nick: REAPER observation or native UI permission is needed to resolve the remaining audio
  proof. No need to open Claude. Artlock CI lane, ITP save protection and DECISIONS row19 remain open.

Budget UNFROZEN, PUBLIC, private fallback3,000. Established SSH origin/account is
`git@github.com:TheDakk/Celestial-Frontier.git` / TheDakk. Only normal branch pushes authorized;
no workflow trigger, hosted attempt, label, PR, merge, release, purchase, protected-portrait,
artlock-reference, Settings/Guide/Training/import-door or workflow/Actions-policy edit.
