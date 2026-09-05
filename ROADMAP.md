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

## SESSION HANDOFF — 2026-09-05 · BATCH A BACKUP CLOSED; SHIP REPLAY PASS; AUDIO OPEN

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/mac`, tracking `origin/openai/mac`. Develop remains
`c1791e210158de864fdd475323c3091d9ecbae58`. The signed sync
`bc211bef1f4def92a27933b7c79a090d8913fae4` passed typecheck, artunused and 301 files /
3,100 tests / 1 skip with root main.js absent. No game, test or integration inputs changed
in these private-source/documentation checkpoints; unchanged gates were not repeated.

### Checkpoints and source state

- Backup: signed/pushed `629e0cceeb4df474ab2a7c8f9da21085c368aead`.
  **Source-preservation prerequisite CLOSED** by forced iCloud eviction/download and
  38/38 checksum matches: all 37 immutable bundle inputs plus sorted ustar. Native per-file
  metadata proved all 39 package items uploaded, then Current/reallocated after download;
  global brctl status/monitor timeouts are retained. The truncated scratch control failed
  correctly and was deleted. OneDrive was responsive and copied, but brctl refused its
  non-CloudDocs eviction; secondary remains COPIED / UNVERIFIED. Full private locations
  live in the companion backup index. Originals remain unchanged. Evidence:
  `audits/AAA_BATCH_A_BACKUP_20260905.md` and adjacent JSON.
- Portable replay: signed/pushed `cb3e9a7d92059ffadefca9015250e288f5f6d930`.
  Seven derivative files have explicit environment/root bindings, with no historical path
  fallback. Relative ecosystem.py remains intact. Four Python AST and one JavaScript parse
  check pass. The RPP preserves embedded MIDI/Surge state; the derivative Lua's render sinks
  now match that final RPP. One fresh-directory ship save/render passed with identical
  decoded image data; PNG file hashes differ only in recorded render metadata.
  **Portable audio is OPEN:** one fresh-config REAPER attempt produced no files after the
  45.02-second wait; the process later disappeared without a retained exit status. Its log
  only records Metal context creation. Cause unknown; Computer Use permission unavailable.
  Nick was asked about any startup dialog. No duplicate render or audio acceptance claimed.
  Private derivative work/results are preserved, excluding generated application config and
  registration. Evidence: `audits/AAA_BATCH_A_PORTABLE_REPLAY_20260905.md` and JSON.
- B–D inputs: status-only checkpoint delivered in
  `audits/AAA_BATCH_B_D_INPUT_STATUS_20260905.md`. **No B–D production work started.**
  The final user handoff supplies this documentation-only checkpoint's exact pushed SHA.

### Exact next work and boundaries

Next bounded task: identify the REAPER startup/render blocker with native UI access or Nick's
observation, finish the portable audio cue and compare the stored output hashes/waveform facts.
Do not call the whole portable replay prerequisite closed or silently reuse historical readiness.
The verified primary source backup remains closed; secondary OneDrive recovery remains optional
and unverified until its native evict/download plus checksum proof succeeds.

Existing ship/audio tool examples and the invented Lanternback/Jungle concept are not accepted
pilot assets. B still needs a pilot ship/biome and eight body plans at 132 / 300 / 440, static
and animated (48 conditions); unfaithful families retain their correct static portrait and remain
incomplete. C needs the authored sound set/listening pack; D needs actual-game art/audio
integration, styleguide, three mockups and device/human acceptance. The 128 MiB complete-pack /
256 MiB retained-update policy is reserved; enforcement/device proof remains open. Offline is
an installed, complete-ready-PWA promise while data is retained.

Nick's latest bound is B–D status only. Production needs him to lift that bound; the existing
integrated-pilot approval stop still prevents Phase 2/top bar/dock/rails work. No protected
portrait/artlock reference, import door, Settings/Guide/Training, workflow or Actions-policy edit.
Artlock CI lane, ITP save protection and confirmation of DECISIONS row 19 wording stay open.

### Paired next steps

- **Codex:** all authorized unaffected work is checkpointed; portable audio awaits the remaining
  observation/UI access. Keep originals and backup immutable. New audiovisual records remain
  on openai/mac, not develop. Do not start a larger diagnostic loop or B–D production unasked.
- **Claude:** continue its own work. Anthropic/mac c860f57 and unmerged 173c806 negative control
  remain untouched; no cross-agent file copying or immediate synchronization is requested.
- **Nick:** no GitHub action or PR fields needed, and no need to open Claude. Native UI access
  or a REAPER startup observation is needed to close portable audio. All three open decisions
  remain yours. Main/live site are unchanged; no release or deployment occurred.

Budget UNFROZEN, PUBLIC, private fallback 3,000. Established SSH origin/account:
`git@github.com:TheDakk/Celestial-Frontier.git` / TheDakk; current fetch/read passed. Only normal
openai/mac branch pushes are authorized and trigger no workflow. No hosted attempts, labels,
PRs, merges, releases or purchases were performed. Prior handoffs are archived verbatim.
