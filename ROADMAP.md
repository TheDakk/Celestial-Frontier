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

## SESSION HANDOFF — 2026-09-05 local · B–D PILOT PRODUCTION CHECKPOINT

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/mac`, upstream `origin/openai/mac`. The existing real sync `bc211bef1f4def92a27933b7c79a090d8913fae4`
contains develop `c1791e210158de864fdd475323c3091d9ecbae58` / PR #41. This batch began clean
at `fbf7d953284a04db56b4fe53f444becf710928ff`; fetch passed and develop was already an ancestor.
No additional merge, rebase or other-agent change. The former handoff is archived verbatim.

Nick lifted the B–D status-only bound: **Start B–D production under the existing pilot approval
stop.** This production checkpoint adds12 optimized files (9,985,126 bytes), isolated review
entry `audiovisual-pilot.html`, and lazy real-game `?avpilot=1` integration. Existing system →
Survey → Earth landing → biosphere remains the journey owner. No gameplay is invented to stage art.

### Production and verification state

- B: canonical starter Scout at132/300/512; one transparent Blender atmosphere layer over the
  exact existing Earth temperate vista. Coarse first landscape rejected and retained privately.
- Eight body plans at132/300/440 in static/animated presentation are selectable in the study.
  Protected portrait pixels remain; 300 uses the440 source. **All anatomical animation remains
  INCOMPLETE.** Only an external frame marker animates, respecting reduced motion/visibility.
- C: eight original REAPER/Surge PCM16/48kHz cues, finite24-second phrase/bed plus UI/ship/combat
  candidates. Existing audio runtime/lifetime owner; at most4 pilot voices/one per category;
  decoded-data cache19,503,360B, with native playing buffers additional. Canonical creature voices
  remain. Short navigation audio is tied to trusted existing controls after explicit activation;
  other short cues remain audition-only. Human/matched-current listening remains open.
- D: reusable scoped tokens and three isolated Survey/Compendium/Inventory studies. The optional
  playable controls yield to existing cards/panels/Training/modals; ship eligibility refreshes on
  committed loadout publication. No Phase2 chrome edit. Build admission enforces128MiB complete
  pack. Aggregate256MiB retained-update enforcement and physical Safari/PWA proof remain open.
- Sources: new durable196-file B/C bundle224,632,891B; independent iCloud package198files,
  uploaded → all evicted → all downloaded/current →197/197 checksums plus SHA256SUMS verified.
  Scratch truncation rejected. Verified2026-09-06 00:37:00UTC (September5 local). Tar SHA
  `3e319afc9e35991a99aebc9a6940662d8c6f01e41fbbda0b35d2db6ae61bf38f`.
  `audits/AAA_PILOT_BCD_BACKUP_20260905.md`/JSON own evidence; no private paths in public records.
  BatchA originals/backup remain immutable; OneDrive copied/unverified status unchanged.
- Final candidate build and focused tests pass. Full source/check results and exact final pushed
  head are recorded by the following verification checkpoint in `audits/AAA_PILOT_BCD_20260905.md`.
  Only Compendium producer authority/live test pins were derived anew; measurement authority,
  numeric ceilings, artlock references and quarantined SceneMemory authorities are unchanged.

Current ledgers: `AAA_GAP_AUDIT.md`, `AAA_COVERAGE_LEDGER.md`, `AUDIO_LICENSES.md`,
`port/AAA_ASSET_POLICY.md`. Human art/anatomy/listening/iPhone acceptance is not an automated PASS.
No Phase2/top bar/dock/rails before Nick's integrated-pilot approval.

### Privacy and tools

Command-line only. No desktop capture, existing-window/browser inspection, accessibility or
Computer Use. Inspect only generated files and isolated headless game renders. Normal REAPER
settings/projects are untouched. REAPER CLI starts the desktop process; `-nosplash` only hides
its splash. Future authorized renders can use macOS `open -j -g` to request hidden/background
startup, but dialog-free/headless operation is not proven. No further audio render in this batch.

### Paired next steps

- **Codex:** finish the exact-source browser-free develop check, source-bound local review and
  normal branch checkpoint/push; then retain the pilot stop. Present honest gaps rather than
  scale unfinished families. No hosted authority. A future technical follow-up must close the
 256MiB retained-update admission gap before claiming release-ready offline storage.
- **Claude:** may independently review the pushed pilot source/proofs/rights when Nick requests;
  no sync, PR, label or hosted run is implied. Leave anthropic/mac c860f57 and173c806 alone.
- **Nick:** review the local direction/listening package and decide whether to refine or retain
  static creature fallbacks. Real iPhone/Safari/PWA and listening feedback remain needed. No need
  to open Claude or authorize GitHub now. Artlock CI lane, ITP save protection and confirmation
  of DECISIONS row19 wording remain open. Phase2 requires the separate pilot approval.

Budget UNFROZEN, PUBLIC, private fallback3,000; zero hosted authority. Established SSH origin
`git@github.com:TheDakk/Celestial-Frontier.git`, authenticated TheDakk; batch fetch passed.
Only normal `openai/mac` branch pushes are authorized and trigger no workflow. No PR, hosted
attempt, label, merge, purchase, release or deployment. No legacy import door or changes to
Settings/Guide/Training code, workflows, Actions policy or protected portrait/artlock references.
