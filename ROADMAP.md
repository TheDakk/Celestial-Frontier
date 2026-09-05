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

## SESSION HANDOFF — 2026-09-05 · BATCH A CLI AUDIO RENDER RECORDED

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/mac`, tracking `origin/openai/mac`. Develop remains
`c1791e210158de864fdd475323c3091d9ecbae58`. The real sync
`bc211bef1f4def92a27933b7c79a090d8913fae4` passed typecheck, artunused and 301 files /
3,100 tests / 1 skip with root main.js absent. No game/test inputs changed in these
private-source/documentation checkpoints; unchanged gates were not repeated.

**Privacy boundary (Nick): command line only.** No screen inspection, screenshots,
accessibility, Computer Use or requests to enable them. Read only task files/logs and
owned processes; leave normal application settings/projects alone. Earlier UI-access
requests are withdrawn and retained only in archived history.

### Checkpoint state

- Source preservation **CLOSED** at signed/pushed
  `629e0cceeb4df474ab2a7c8f9da21085c368aead`: forced iCloud eviction/download and
  38/38 checksums (37 immutable inputs plus sorted ustar), with actual per-file
  upload/current states and a rejected truncated scratch control. OneDrive remains
  COPIED / UNVERIFIED because brctl refused its non-CloudDocs eviction. No UI workaround.
  Evidence: `audits/AAA_BATCH_A_BACKUP_20260905.md` and JSON. Originals stay immutable.
- Seven derivative path fixes and ship replay were recorded at
  `cb3e9a7d92059ffadefca9015250e288f5f6d930`. One relocated ship scene/render has identical
  decoded image data; only PNG metadata differs. Relative ecosystem.py is retained.
- The input-status handoff was signed/pushed as
  `9d6bc9aba52d561a714287091e8a699474467dfb`.
- **Audio CLI continuation succeeded:** one relocated RPP render exited 0 in 40.277s,
  ending 2026-09-05 23:34:41 UTC, producing WAV and FLAC. Only the RPP output path differs
  from the original; MIDI and Surge state are unchanged. The corrected launcher retained
  process ownership until exit and reused task resources initialized from the original
  fresh `[REAPER]` configuration, without copying excluded/user configuration. The first
  incomplete attempt remains unexplained. Nick reported audio-device-selection prompts;
  unattended first-start is not proven and user interaction cannot be excluded.
  WAV is stereo 48 kHz / 24-bit / 4 seconds, non-silent/unclipped. Samples differ from the
  stored master; cause and listening equivalence are unproved. FLAC hashes/STREAMINFO
  were compared; native decode setup failed on both files, so no new FLAC decode pass.
  Evidence: `audits/AAA_BATCH_A_PORTABLE_REPLAY_20260905.md` and JSON. Logs, scripts and
  results are privately preserved and hashed, excluding application config/registration.
  The final response identifies this documentation checkpoint's exact pushed SHA.

The requested selected ship/audio replay results are recorded. They demonstrate local path
portability for those renders, not universal unattended startup, every recipe/machine, exact
synthesized audio identity, or human approval. No further readiness launches this batch.

### B–D standing and approval stop

`audits/AAA_BATCH_B_D_INPUT_STATUS_20260905.md` remains current: **no B–D production started**.
B needs a pilot ship/biome plus quadruped, biped, avian, serpentine, arthropod, tentacled,
aquatic and flora/fungus at 132 / 300 / 440, static and animated (48 conditions). Unfaithful
families retain their correct static portrait and remain incomplete. C needs the authored
sound set/listening pack; D needs actual-game integration, styleguide, three mockups and
device/human acceptance. Existing readiness/concept examples are not accepted pilot assets.
The 128 MiB complete-pack / 256 MiB retained-update policy is reserved; enforcement/device
proof remains open. Offline is an installed, complete-ready-PWA promise while data is retained.

Nick's latest bound is B–D status only. He must lift it before production. The integrated-pilot
approval stop still prevents Phase 2/top bar/dock/rails. No protected portrait/artlock reference,
import door, Settings/Guide/Training, workflow or Actions-policy edit. Artlock CI lane, ITP save
protection and confirmation of DECISIONS row 19 wording remain Nick's open decisions.

### Paired next steps

- **Codex:** bounded Batch A evidence is checkpointed. Continue only under the command-line
  privacy boundary; no further REAPER launch in this batch. Future unattended audio work
  needs supported device setup, without a guessed config edit. Await lifting of the B–D
  status-only bound before pilot production; retain the integrated-pilot approval stop.
- **Claude:** may read the pushed audiovisual records when useful; no immediate sync or
  review action is required. Anthropic/mac c860f57 and unmerged 173c806 remain untouched.
- **Nick:** no need to change normal REAPER settings for this completed file render or
  open Claude. To begin actual pilot graphics/sound/integration, lift the B–D status-only
  bound while retaining the integrated-pilot approval stop. No GitHub action is needed.

Budget UNFROZEN, PUBLIC, private fallback 3,000; zero hosted authority. Established SSH origin
`git@github.com:TheDakk/Celestial-Frontier.git` / TheDakk; this batch's fetch passed. Only normal
openai/mac branch pushes are authorized and trigger no workflow. No hosted attempt, label,
PR, merge, purchase, release or deployment. Superseded handoff archived verbatim.
