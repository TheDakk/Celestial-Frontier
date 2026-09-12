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

## SESSION HANDOFF — 2026-09-12 · APPROVED V4, ENGINE FIRST

Nick approved ART_KIT v4 at signed `6f5c396e92e82f64daa1a087c24d0d564c7e69aa`,
with the reordered §9 now in [ART_KIT.md](ART_KIT.md). The four approved MIDGAME
images remain direction; triptych/atlas remain the hashed scene/cut-out locks.
V3 and both v3 candidates are rejected. Keep 4E turnaround byte-identical to 6f5c396e.

First input batch is captured and shown in two review sheets; none of the twelve
masters is quality-accepted. No cut-out inherited a frame/dark plate. All requested
native sizes failed (cut-outs 1254 square; plate 1672×941), with margin, Civet identity
and plate-composition findings retained in the audit. The pure compiler reproduces all
twelve exact prompts from canonical Earth data and named painter-family diagnostics.
21 focused tests, tsc and root validate pass. The next engine gap is prompt capacity:
Civet is 1812 tokens before chat wrapping versus the old worker's 512 limit.

The bounded input scope is Earth temperate biome plate, six Earth cut-outs (Civet,
Platypus, Frog, Persimmon, Cranberry, Devil's Club), and five family references
(mammal quadruped, bird, fish, insect, reptile). Show the twelve-input sheets.
The one conditioning owner must compile system cards from canonical game data;
no manually typed card. First cut-out batch: inspect every capture for Atlas frames
or dark plate backgrounds. If found, propose one v4.1 cut-out-block sentence and
stop for Nick's approval before applying it or repainting.

Then main deliverable: rebuild landfall-conditioning.ts as one kit interpreter;
offline pre-fit/hash refs; unfreeze steps/seed/size; per-organism passes composed
on the plate plus one low-strength stage-worker.mjs finisher; warm sessions across
landings; VAE encoder once; in-worker expansion replaces OPFS variant storage.
One measured native painting beside Living Worlds at native size with organism boxes.
Fix blocking Part K 1–11, 17, 33–35 with negative controls. Ten tools already tracked;
K35 boot control pending. No unit-test checkout lock, old --landfall --variant run,
old integrated-chain/pack restart or six-reference prompt sweep.

After the first painting is accepted, do the Animation and battle track below,
then remaining family/form/biome library twelve at a time, showing every sheet.
Effects class is a separate v4.1 proposal: no effect painting before approval.
Actual iPhone maxBufferSize/shader-f16/quota/transformer-load memory probe still gates
storage/delivery engineering; artwork durability, pruning/split, later phone tier
and remaining rollout follow the revised program. No prior failure is relabelled.

## Animation and battle track

Scheduled after the first engine painting is accepted and before the library rollout:
one Blender master rig per painter family with gene-driven proportions within per-family
bounds, canid first; the kit 4E turnaround as reference; the finisher paints each creature's
texture atlas once in the frozen style; Blender renders the token pose and the clip set
(idle, melee, ranged or cast, hit, faint, victory, with land, flying and aquatic variants)
using that texture; export to Pixi as skeleton plus texture or sprite sheets. Battle staging
uses the landfall plate as backdrop, depth by scale and overlap, and the turn choreography:
push-in, ability banner, strike, hit flash, short shake, damage number, recoil, return.
The eleven ability themes become painted effect sheets, which requires a v4.1 Effects
cut-out class; propose the row and stop for Nick's approval before painting any effect.
Proof before scale: the Civet end to end (master, texture, idle, attack, hit, one staged turn
in the browser) shown beside its own landfall painting. Families in order: mammal quadruped,
bird, fish, insect, reptile, then the rest.

## Git and session boundary

OpenAI/Codex on macOS owns /Users/nick/Projects/celestial-frontier-openai-mac,
openai/mac tracking origin/openai/mac. Approved entry commit 6f5c396e is 18 ahead/0
behind cached upstream, 129 ahead/0 behind cached origin/develop. No fetch. .DS_Store
untouched. Same uninterrupted September 12 Node26.8.2 startup receipt applies.
[Current evidence](audits/ART_KIT_ENGINE_FIRST_20260912/README.md) owns exact work/results.

GitHub step none; PR42 parked, base develop/source openai/mac, title/body unchanged.
Budget recorded UNFROZEN/PUBLIC, private fallback3000; exact authorized hosted attempts
zero. No push, label, dispatch, merge, release or deploy. Develop/main/live unchanged.
Claude Code need not open now; these are Codex-local changes. Only after eventual
authorized develop integration may clean anthropic/mac fetch/merge origin/develop
at its next batch. Do not manually copy worktrees. Resume from this handoff and
CODEX_HANDOFF's appended engine-first order, never PAUSED_CHECKPOINT's restart.
