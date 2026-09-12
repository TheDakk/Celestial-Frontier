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

## SESSION HANDOFF — 2026-09-12 · FIRST V4 ENGINE PAINTING AWAITS FEEDBACK

Nick approved v4 at6f5c396e, with engine-first§9. Four MIDGAME images remain direction;
hashed Atlas/triptych are the class locks. V3 and both candidates stay rejected.
4E turnaround is unchanged. No further reference or effect painting is authorized now.

Signed1e60f29f retains the twelve input masters, exact prompts and shown review sheets.
No Atlas frames/dark plates appeared; conditional v4.1 background amendment was not
triggered. Captures have size/margin, Civet identity and plate-composition findings;
none is quality-accepted. Preserve originals.

Signed engine commit30ef7d15e7bbc22d3684bf4b069e616d67288d4a completed the ONE native
run in audits/ART_KIT_ENGINE_PROOF_20260912/native-01. Engine execution PASS,425.707s,
1024×576, six384-square organism passes at four steps/strength0.2, seed133, one0.08
finisher. All four sessions created once, VAE encoder once, pinned in-worker expansion
347,332,608 bytes with0 storage writes. Warm reuse across two landings has simulated
negative-controlled evidence, not a second native run. No native retry was made.

Nick's tenfold text ceiling5120 is implemented with actual tensor lengths rounded to16,
no truncation. Prompts1730–1860 tokens (positions1744–1872) succeeded;5120 native maximum
is unmeasured. Text inference26.14–28.86s per prompt. Mac maxBufferSize4,294,967,292,
shader-f16 true; worker/native/GPU memory unavailable, renderer heap is not equivalent.
This does not qualify Nick's target iPhone or any storage/delivery tier.

The untouched painting, native-pixel comparison beside Living Worlds and organism boxes
are shown. Six subjects remain visible, but Civet face/identity, Cranberry habit,
Frog readability and cold crowded scene composition remain unresolved. Boxes are
pre-finisher placement geometry, not post-finisher segmentation. Low-strength finisher
preserved input defects. Stop for Nick's painting feedback; no sweep or another run.

Compiler `compileEarthKitEngineV4` and app-owned warm client run through stage-worker's
kit route. Nine references were fitted/hash-verified offline. Normal-game V1/V2 action
is not yet rewired, old OPFS layer is not yet removed, Part K1–11,17,33–35 is not closed.
New kit offline fitting addresses K17 on this path; ten original tool files are tracked,
K35 boot control pending.17 worker/math/diagnostic +23 compiler/runtime tests, tsc and
root validate PASS, with cache-bypass/overflow/background/expansion/cancellation controls.
No unit-test checkout lock, old --landfall --variant, integrated chain or pack build.

After painting acceptance, prove Animation and battle track below before library rollout.
Inactive Effects proposal in ART_KIT_ENGINE_FIRST_20260912 needs v4.1 approval before
any effect. Actual target-iPhone maxBufferSize/shader-f16/quota/load-memory probe gates
storage/delivery engineering. Artwork durability and later defect/pruning/split work
remain scheduled. See engine-proof README for exact evidence and limitations.

## Review export — September 12

Nick requested all current review images and prompts as a zip. The verified export is
`/private/tmp/celestial-frontier-art-review-20260912.zip`: all45 current PNGs, the exact
12 authoring prompts,7 runtime prompts and7 chat-wrapped strings, current ART_KIT v4,
review instructions, image index and measured evidence. PNG bytes are unchanged; all
archive entries/CRC and native prompt hashes are verified. The review guide, exact
prompt Markdown, manifest, receipt and reproducible exporter are committed under
`audits/ART_KIT_REVIEW_EXPORT_20260912/`. This is a review archive, not a runtime pack.
No new painting/inference or Github action. Painting acceptance remains pending.

Nick's 30 MB per-zip limit is handled by three independently extractable numbered
parts in `/private/tmp/`, all below 29,000,000 bytes. Part1 contains direction images
and native painting outputs, part2 masters/fitted inputs, part3 sheets/comparisons.
Upload all three to the same Claude conversation before review. Every part includes
the review guide, exact prompts, v4 kit and evidence; all45 PNGs are preserved exactly
once across the set. `split-review.py` and `split-archive-receipt.json` in the export
audit own reproducibility, exact paths/sizes/hashes and integrity verification.

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
openai/mac tracking origin/openai/mac. Native source30ef7d15 is20 ahead/0 behind cached
upstream,131 ahead/0 behind cached origin/develop. Signed evidenceb5a577f9 is21 ahead
of upstream/132 ahead of develop. Review export commit follows; exact final ID/ahead
counts are reported at stop and available in git log. No fetch.
.DS_Store remains untouched. Same uninterrupted September12 Node26.8.2 receipt applies.

GitHub step none; PR42 parked, base develop/source openai/mac, title/body unchanged.
Budget UNFROZEN/PUBLIC, private fallback3000, exact authorized hosted attempts zero.
No push, label, dispatch, merge, release or deploy. Develop/main/live unchanged.
Codex waits for painting feedback. Claude Code need not open now; only after eventual
authorized develop integration may clean anthropic/mac fetch/merge origin/develop
at its next batch. Do not copy worktrees. Resume here and CODEX_HANDOFF's engine-first
amendment, never PAUSED_CHECKPOINT.
