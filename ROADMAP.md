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

## SESSION HANDOFF — 2026-09-12 · FIRST V4 ENGINE PROOF PREPARED

Nick approved v4 at `6f5c396e`, with engine-first §9. Four MIDGAME images remain
direction, hashed Atlas/triptych the class locks. V3 and both v3 candidates stay
rejected. 4E turnaround remains byte-identical to the approved draft.

Signed `1e60f29fa51898b0615d54c44f8c758f1e8cba7d` retains the twelve input masters,
exact compiler prompts and two shown sheets. No Atlas frames/dark plates appeared;
the conditional v4.1 background amendment was not triggered. None is quality-accepted:
requested native sizes were missed, margins are inadequate, Civet identity and plate
composition need review. Preserve originals; no further library painting now.

The first engine proof is prepared in `audits/ART_KIT_ENGINE_PROOF_20260912`.
`compileEarthKitEngineV4` compiles six organism prompts/placements and one finisher
from canonical Earth data and the kit. App-owned warm client + stage-worker kit route
retain four sessions and one VAE encoder; pinned expansion occurs in worker memory.
Nine fitted RGBA inputs are hashed offline. Nick's tenfold text ceiling is 5120 tokens,
actual lengths rounded to 16, no truncation. Native larger-sequence behavior is unmeasured.
Settings: 1024×576, 384-square passes, seed133, four steps at0.2, one finisher at0.08.
17 worker/math/legacy-diagnostic and23 compiler/runtime tests, tsc and root validate PASS;
cache-bypass/overflow/background/expansion/cancellation negative controls are retained.

Next: signed clean source, then ONE `run-kit-engine-proof.mjs` native run using the
prepared directory and a new result directory, with approved native browser execution.
No automatic retry after red. Show untouched painting beside Living Worlds at native
size and with organism placement boxes; inspect post-finisher identity separately.
Normal-game V1/V2 action has not yet been rewired, old OPFS layer is not yet removed,
and Part K1–11,17,33–35 is not closed. New kit reference fitting covers K17's path;
ten original tool files are tracked, but K35 boot control remains pending.
No unit-test checkout lock, old --landfall --variant run, integrated chain, pack build
or six-reference prompt sweep. Current receipt is not painting acceptance.

After the first engine painting is accepted, do the Animation and battle track below,
then remaining families/forms/biomes twelve at a time. The inactive Effects proposal
is retained in ART_KIT_ENGINE_FIRST_20260912; no effects before v4.1 row approval.
Actual target-iPhone maxBufferSize/shader-f16/quota/transformer-load-memory probe still
gates storage/delivery engineering. Artwork durability and later register/pruning/split
work remain scheduled under program v4. No prior failure is relabelled.

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
openai/mac tracking origin/openai/mac. Entry1e60f29f is19 ahead/0 behind cached upstream,
130 ahead/0 behind cached origin/develop. No fetch. New signed commit IDs/counts are
reported at each stop; use git log for the final head. .DS_Store remains untouched.
Same uninterrupted September12 Node26.8.2 startup receipt applies.

GitHub step none; PR42 parked, base develop/source openai/mac, title/body unchanged.
Budget UNFROZEN/PUBLIC, private fallback3000, exact hosted attempts authorized zero.
No push, label, dispatch, merge, release or deploy. Develop/main/live unchanged.
Claude Code need not open now. Only after eventual authorized develop integration
may clean anthropic/mac fetch/merge origin/develop at its next batch. Do not copy
worktrees. Resume here and CODEX_HANDOFF's engine-first amendment, never PAUSED_CHECKPOINT.
