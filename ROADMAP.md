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

## SESSION HANDOFF — 2026-09-05 local · PRODUCTION COMPARISON / PILOT REFINEMENT

OpenAI/Codex on macOS owns `/Users/nick/Projects/celestial-frontier-openai-mac`, branch
`openai/mac`, upstream `origin/openai/mac`. Review began clean and synchronized at
`7a1f3848f0d7571fd9d06956cd6910650c95b87e`. SSH origin remains
`git@github.com:TheDakk/Celestial-Frontier.git`, previously authenticated as TheDakk;
this batch’s fetch passed. `origin/develop` remains
`c1791e210158de864fdd475323c3091d9ecbae58`, included by real sync
`bc211bef1f4def92a27933b7c79a090d8913fae4`. No merge or other-agent changes.
The superseded handoff is archived verbatim. This batch changes review records/captures only.

### Nick’s direction and current judgment

Nick says live production looks substantially better than the pilot and wants the existing
game upgraded. He specifically reaffirmed the hard-won clickable/accessible window behavior
after overlay defects. Preserve those outcomes throughout art integration; do not replace them
with screenshot-only acceptance. Existing PROCESS_LAWS, Slice and Glass remain the owners.

`audits/AAA_PRODUCTION_PILOT_REVIEW_20260905.md`/JSON contain the actual public-site comparison,
captures, limitations and suggested next pass. Live footer: v1.8.9 / build92098e9. Local pilot:
the 7a1f384 source and existing built delivery at `http://127.0.0.1:4179/`.
Use `/audiovisual-pilot.html` for the study or `/?avpilot=1` for the playable pilot; opening
the checked-in source HTML with `file://` is not a usable delivery path. Local preview hosting
is a developer task, not something players must run.

The pilot does not yet demonstrate the requested graphical upgrade. The main observed issue
is composition: a large orbital globe competes with the landed landscape; the phone splits
attention among vista, globe, biosphere and notices. The study’s sparse layout and green Scout
are preliminary. Production supplies useful world framing, material readability and interface
hierarchy. Some differences predate B–D; no claim that every issue was introduced by the pilot.

Recommended bounded Phase1 refinement: one coherent Earth arrival → ecosystem → Shipyard
sequence, with richer terrain/material/light and the existing native interaction owners.
This does not replace the full eight-family132/300/440 static/animated sweep. All anatomical
animation remains INCOMPLETE; protected portraits stay unchanged. Matched audio listening,
real iPhone evidence and human direction acceptance remain open. No Phase2/chrome migration.

The old `audits/aaa-pilot-bcd-20260905/temperate-comparison.png` has empty landscape panes and
cannot establish ecology preservation or improvement. History remains intact; the new review
includes a fresh populated capture. The actual difference there is subtle, not an accepted
graphics upgrade. The source/technical results below do not establish aesthetic quality.

### Existing checkpoint and this review’s limits

B–D product/source verification remains at `ab91d59ad0ff6badefa19fdc134c3f395241da57`:
browser-free develop308files/3,224passed/1skip, root main.js absent, root validate50probes and
1,010Earth renders, policy81controls. Prior local red/correction and producer-only derivation
remain recorded. Pack15,607,722B;128MiB admission exists,256MiB retained-update enforcement open.
The independent B/C iCloud backup remains verified; immutable BatchA originals and OneDrive
status unchanged. See `audits/AAA_PILOT_BCD_20260905.md`, backup records and current gap ledger.

This review loaded only owned isolated headless game pages at1440×1000 and390×844,DPR1.
One v2 Shipyard path preserved the44×44Close center hit, pilot-control suppression, native
Close outcome and focus return to dockshipyard. This is not a complete input/accessibility
certificate or physical iPhone/Safari/PWA proof. No full battery or audio render repeated.
No desktop, existing browser/profile, accessibility automation or normal REAPER access.

### Paired next steps

- **Codex:** carry Nick’s production-quality reference and overlay constraints into the next
  bounded Phase1 refinement. Use the review before a materially larger art rework. Preserve
  scene/ship pointer transparency, window/Training/modal ownership, Close/focus/scroll/contrast
  and phone geometry. No Phase2 until Nick accepts the integrated pilot. No hosted authority.
- **Claude:** can review the pushed comparison and existing owners if Nick requests. No app
  switch, sync, PR, label, hosted run or merge is needed now. Leave anthropic/mac c860f57 and
  its unmerged173c806 negative control alone.
- **Nick:** respond to the suggested visual direction in the current task; the next artwork
  should improve the real playable scene. Artlock CI lane, ITP save protection and DECISIONS
  row19 wording remain open. The integrated-pilot approval stop stands.

Budget UNFROZEN, repository PUBLIC, private fallback3,000. Only a normal openai/mac branch
push is authorized; it triggers no workflow. Zero hosted runs, labels, PRs, merges, purchases,
releases or deployments. No Settings/Guide/Training code work without re-sync, no legacy import
door, workflow/policy edits, protected portrait changes or artlock-reference edits.
