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

## SESSION HANDOFF — 2026-09-12 · CONTACT REVISION AWAITS PAINTING ACCEPTANCE

Nick accepts all twelve first v4 authoring inputs including the Earth plate. The four
MIDGAME images remain direction; v4 is canonical and4E unchanged. V3 and its images
remain rejected. Claude's review is verbatim in signed4a00a72b. ART_KIT.md has no changes.
The two v4.1 wording proposals remain unapproved in
`audits/ART_KIT_CONTACT_REVISION_20260912/KIT_V4_1_PROPOSALS.md`; the size proposal still
conflicts with the accepted1672×941 plate being below the2560×1440 scene table.

Nick unlocked1Password signing. Source cd6b609f56ea992e14a196637a611446315e41b2 is signed
and verified. Exactly ONE authorized native contact revision ran on that unchanged
committed source. The run is consumed: do not retry, sweep or start another painting.
Same12 masters, seed133, plate, canonical snapshot and nine fitted inputs. Compiler
composition: Civet height30%, Platypus18%, Frog width12% (x0.23), Persimmon height42%;
one plate-derived grass cut-out overlays both animals' lowest feet. One-pixel alpha
erosion/neighbour despill, zero organism passes, one0.35 finisher with interior latent
protection. Runtime projection402 tokens, padded416, ceiling512; no kit edit.

Result: native execution PASS. Warm engine24.173s, session preparation7.890s, total32.063s.
Four sessions loaded once before warm timing; no extra warm-up inference.109/2304
latent tokens protected. Native composite pixels match the prepared static preview.
All six registered box IoUs round to100%, Civet height30%. Registration is not semantic
segmentation; Cranberry is least certain (correlation0.573). Codex inspected native
painting, both reference comparisons, boxes and six200% crops: six species preserved,
subtle dark contact/foreground overlap at both animals' feet, no visible pink fringe.
These are Codex findings; Nick's painting acceptance and overall direction verdict
remain pending. `qualityAccepted` remains false. No broader completion is claimed.

Evidence: audits/ART_KIT_CONTACT_REVISION_20260912/README.md; native-01/painting.png;
review/beside-first-painting.png, beside-triptych.png, registered-boxes.png; six200% crops
and review.json. Exact runtime prompt is prepared/runtime-prompt.txt. Existing checks:
21 worker/math/lifecycle/legacy,24 compiler/runtime, box-registration negative controls,
TypeScript and root validation pass. Tests run no browser/inference/checkout lock.

NEXT: show result and stop for Nick's painting verdict. Separately obtain wording
approval before any kit edit; do not silently resolve the size-table inconsistency.
After painting acceptance, animation/Civet proof below precedes library rollout.
Normal-game V1/V2 wiring, old OPFS removal and remaining Part K work remain pending.
Actual target-iPhone maxBufferSize/shader-f16/quota/transformer-load-memory probe gates
storage/delivery work. No old --landfall --variant, integrated chain or pack restart.

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

OpenAI/Codex on macOS owns /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Signed source cd6b609f is25 ahead/0 behind upstream and136
ahead/0 behind cached origin/develop; the evidence commit follows it (26/137 ahead).
Final evidence ID/counts are reported at stop. No fetch; .DS_Store untouched. Same
uninterrupted September12 Node26.8.2 startup receipt applies.
GitHub step none; PR42 parked (develop <- openai/mac), existing title/body unchanged.
No push, label, dispatch, merge, release or deploy. Codex stops here for painting and
kit-wording decisions. Claude Code need not open or sync now; only after an eventual
exactly authorized develop integration may clean anthropic/mac fetch/merge origin/develop
at its next batch. No cross-worktree copies. Resume here, never PAUSED_CHECKPOINT.
