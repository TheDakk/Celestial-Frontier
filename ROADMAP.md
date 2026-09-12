# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — 2026-09-12 · PHONE REPORTED, MAC INSTALLED PATH PROVED; WEATHER NEXT

Nick approves Kit v4.1, wiring0d825fe5/0e37e6c6 as production path, and cd6b609f/0eed6a21
as accepted painting/tier-2 baseline. Original unchanged/qualityAccepted true. Edge/runners
246cc619 rejected; no further erosion experiments or kit edits (frozen paragraph/4E intact).

Physical iPhone17Pro/iOS26.6.2 over USB-C: Safari physical session confirmed; probe4715e0f2
reports1GiB per-WebGPU-buffer limit, f16,41.23GB quota, no exposed JS/native/GPU memory API.
Encoder loaded2.788s, then automation session lost during text-encoder load; transformer/
finisher not observed, cause unconfirmed. Nick reports12GB RAM;1GiB is not total RAM.
Phone tier UNQUALIFIED; no retry. Probe reported before Mac work; transient server/driver
closed. Evidence audits/IPHONE_KIT_PROBE_20260912.

Mac ordinary Download/resume -> installed OPFS parent model -> Land -> one finisher ->
retained PNG completed on72fdbc89:204.265s install,199.50ms composite,31.333s Land-to-ready.
PNG byte-identical to accepted baseline, parameters unchanged. native-02 raw FAIL is an
extra reload-instrument race; fix requires new timeOrigin. reload-01 on6ed3958d PASS,
retained reload/Inspect without download/inference. Earlier native-01 failed before any
model request on initial-RAF timing; negative controls cover both corrected instrument
failures. No second native finisher. Evidence audits/MAC_INSTALLED_KIT_20260912.

Authorized weather/mat profile implemented and prepared (not yet run):
audits/ART_KIT_WEATHER_MAT_20260912. Same inputs/seed133/prompt402/one0.35finisher/4px masks.
Cranberry connected16%-wide low mat, same centre/ground, overlapping accepted branches
for more berries. Other placements/species unchanged. Deterministic weather AFTER finisher,
from system-card weather/water/time/light and recipe seed: wet fur/leaves, sparse diffuse
sky-facing droplets, one precipitation density across whole frame. No invented sun.
Raw finisher and final weathered PNG both retained. Normal game baseline stays accepted
until Nick's visual decision. Tests/TypeScript/root validate pass, static mat inspected.
NEXT sign then exactly one native run per audit README; review beside baseline, six crops
and actual post-finisher pixel-order control. No parameter sweep or kit edit. Then Civet
animation end-to-end proof per CODEX_HANDOFF; no Effects class before separate approval.

OpenAI/Codex macOS owns /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Last signed6ed3958d; preparation/evidence commit follows.
Cached refs only, unrelated .DS_Store untouched, same startup receipt. GitHub step NONE,
PR42 parked; budget UNFROZEN/public/private fallback3000 but zero hosted authority.
No push/label/dispatch/merge/release/deploy, pack or integrated chain. Unit tests hold no
checkout lease. Claude need not open/sync; only after eventual authorized develop
integration may clean anthropic/mac fetch/merge origin/develop. Report IDs/ahead at stops.
