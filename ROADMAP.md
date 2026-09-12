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

## SESSION HANDOFF — 2026-09-12 · ONE CONTACT REVISION PREPARED

Nick accepts the twelve v4 first authoring inputs including the Earth plate. The first
native painting is a targeted revision; earlier Codex species/style doubts are superseded.
Claude's review is verbatim in audits/CLAUDE_FULL_REVIEW_20260910/ART_REVIEW_RESPONSE_20260912.md,
signed4a00a72b, SHA c0615602bbfd49e0f1df3afee476ff752f8ed59cd0b4d456784798db6617a1fd.
Four MIDGAME direction images remain canonical. V3 and its images stay rejected.
ART_KIT v4 and4E remain unchanged. Two v4.1 proposals require Nick's separate approval;
size proposal conflicts with the accepted plate being below the current scene table.
See audits/ART_KIT_CONTACT_REVISION_20260912/KIT_V4_1_PROPOSALS.md.

Nick authorizes exactly ONE next experiment on the same12 masters, same seed133, same
plate and first proof's nine fitted inputs. Code is prepared; native run not yet started.
Compiler data in earth-resident-plan sets Civet height30%, Platypus18%, Frog width12%
and x0.23, Persimmon height42%. Other anchors remain. One grass cut-out from the plate's
own lower band overlays both animals' feet. Keyer erodes alpha one pixel and despills
from clean inward neighbours; premultiplied scaling avoids hidden key-colour bleed.
Zero organism inference passes. Exactly one finisher at0.35 with visible-interior latent
masks. Runtime projection: frozen style; visual Light/Mineral/Atmosphere/pigments from
game data; subject; layout. No reference metadata/hashes/technical/negative blocks or
percentage anchors. Restored512 ceiling; actual402 chat tokens padded416 positions.

Prepared input folder: audits/ART_KIT_CONTACT_REVISION_20260912/prepared. All12 accepted
master hashes, first nine fitted inputs and canonical snapshot are unchanged. A final
compiler receipt exactly reproduces recipe.json; initial receipts/logs remain historical.
Static compositor preview is retained; it is NOT a native painting.21 worker/math/
lifecycle/legacy tests,24 compiler/runtime tests, box-registration control pass. Initial
bad fixture aspect and TypeScript annotation errors are preserved separately.

SIGNING BLOCKER: the prepared source commit failed twice with
`1Password: agent returned an error`. Native inference has NOT started; the authorized
run remains unused. Nick has been asked to unlock/allow Git signing in1Password.
All work is staged, including the native comparison/registration review tool. Do not
bypass signing or rerun preparation/tests merely because signing resumes. The runner
requires a clean committed source; resume with the signed commit, then the one run.

Next: sign clean prepared source, then one run with run-kit-engine-proof.mjs using the
prepared folder and a new native-01 result directory. Warm all four sessions by loading
only (no extra painting/inference), then time the actual engine; report prep and total too.
Show native result beside triptych and first painting, with200% crops and per-organism
boxes. Acceptance: identifiable at100%, all six species pass, contact shadows under
Civet/Platypus, no pink fringe at200%, box IoU≥0.90, Civet height≥28%, warm engine<240s.
Post boxes come from image registration plus visual review, not copied placement data;
registration is not segmentation. No native retry or prompt sweep after this one run.

Normal-game V1/V2 wiring, old OPFS removal and remaining Part K work are pending.
No unit-test checkout lock, old --landfall --variant, integrated chain or pack build.
Actual target-iPhone maxBufferSize/shader-f16/quota/load-memory probe still gates
storage/delivery work. Animation/Civet proof follows painting acceptance, then remaining
library12 at a time. Effects need separate v4.1 approval. The review export remains in
three <30MB zips; paths/hashes in ART_KIT_REVIEW_EXPORT_20260912/split-archive-receipt.json.

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

OpenAI/Codex macOS owns /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Entry4a00a72b is24 ahead/0 behind upstream,135 ahead/0 behind
cached origin/develop. Prepared code commit follows; final IDs/counts reported at stop.
No fetch. .DS_Store untouched. Same uninterrupted September12 Node26.8.2 receipt applies.
GitHub step none; PR42 parked (develop <- openai/mac), title/body unchanged. Budget
UNFROZEN/PUBLIC, private fallback3000; exact hosted authority zero. No push, label,
dispatch, merge, release or deploy; develop/main/live unchanged. Claude Code need not
open now. Only after an eventual authorized develop integration may clean anthropic/mac
fetch/merge origin/develop at its next batch. No worktree copies. Resume here, never
PAUSED_CHECKPOINT's restart.
