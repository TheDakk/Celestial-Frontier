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

## SESSION HANDOFF — 2026-09-12 · ART KIT V4 DIFF REVIEW STOP

Nick's revised September 12 packet supersedes the previous packet and all v3 kit work.
**Direction lock:** the four approved images in
[audits/MIDGAME_ART_DIRECTION_20260908](audits/MIDGAME_ART_DIRECTION_20260908/README.md):
02 Living Worlds triptych, 01 Discovery Atlas, 03 Earth full landfall, 04 fungal full landfall.
V3 and both frontier-sheet-01/frontier-plate-01 paintings are rejected, never references.
Retired v3 lives unchanged at [ART_KIT_v3_20260911.md](audits/ART_KIT_RETIRED/ART_KIT_v3_20260911.md),
SHA-256 `2266febc5937b447572358cee6bde66b4a710a87cff1a841e2aabe0c989204a3`.

**Current stop: show the [ART_KIT.md](ART_KIT.md) v4 diff and await Nick's approval. No painting.**
[Diff and checks](audits/ART_KIT_V4_20260912/README.md). V4 uses the supplied natural-history
style paragraph, no named illustrators/franchises, actual 13 star kinds/hexes, compiler-only
cards, Earth anatomy/fur/feather/botany, inactive people, ten rarity tiers. Layouts, sizes,
magenta key, shared negative and §§7–8 discipline retained. Existing scene/cut-out locks
are hash-verified triptych/atlas, not newly generated sheets. Engine compiler not yet rebuilt.

Read revised packet in Nick's order: [GAME_VOCABULARY_COVERAGE](audits/CLAUDE_FULL_REVIEW_20260910/GAME_VOCABULARY_COVERAGE.md),
[ART_KIT_INTEGRATION](audits/CLAUDE_FULL_REVIEW_20260910/ART_KIT_INTEGRATION.md),
[CODEX_HANDOFF](audits/CLAUDE_FULL_REVIEW_20260910/CODEX_HANDOFF.md), then README and FULL_REVIEW
in that directory. Revised first actions/program v4 override historical v3 sections still
quoted in the supplied packet. Packet remains verbatim; no duplicate packet in the tree.

**Program version 4, after diff approval:**

1. Compile actual family/form/biome rows from source and paint twelve images per batch,
   showing every sheet. About 25 creature family/realm references, 48 flora/fungi/microbe
   forms and 43 live biome plates; source keys, not estimates, decide the exact queue.
   Nobody types a system card; no invented generated class or design-only biome row.
2. Main deliverable: one `landfall-conditioning.ts` interpreter in kit order from unchanged
   game data; six Earth cut-outs on magenta, Earth temperate biome anchor; pre-fit/hash
   reference bytes offline; unfreeze steps/seed/size; per-organism passes and one low-strength
   finisher in `stage-worker.mjs`. Warm sessions across landings, one VAE encoder; in-worker
   expansion replaces OPFS variant storage. One measured native run, native-size painting
   beside the triptych and organism boxes/identity findings; show Nick.
3. Fix blocking Part K 1–10, 11, 17, 33–35, each with negative controls. The ten files are
   tracked already, but K35's missing-file boot control remains pending. Unit tests do not
   acquire the checkout lock. No six-reference prompt sweep, old integrated-chain/new-pack
   restart, or `--landfall --variant` attempt.
4. Actual target-iPhone probe: maxBufferSize, shader-f16, storage quota, memory at transformer
   load. Device/iOS/access remain unestablished. No storage or delivery engineering first.
5. Artwork durability: persist/status, iOS home-screen guidance, PNG share sheet export,
   protected originals and labelled regeneration on loss.
6. Prune and split PR42 after painting acceptance; then phone finisher/tier policy,
   remaining source-owned library, battle staging, listening session and view-envelope sharing.

Verified owner: OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`,
`openai/mac` tracking `origin/openai/mac`; SSH origin git@github.com:TheDakk/Celestial-Frontier.git.
Prior engine checkpoint `77aaeec5` includes all ten tools. This request's signed dirty
checkpoint is `efa77c8d3c99c14dd9a41712d104e628db3ad229` (16 ahead/0 behind cached upstream,
127 ahead/0 behind cached develop). Revised packet commit `7191dbc22071106f3cf5b0d153f3b7acd52a24f6`
is 17/0 and 128/0 respectively. No fetch. .DS_Store remains untouched.
The earlier 1Password signing blockage is resolved by these successful signed checkpoints.

This batch changes documentation only. No generated pixels, engine/UI source, save shape,
runtime/test lock or release identity changed. Prior native aggregate FAIL/species rejections
remain unchanged. Root validation and exact doc/hash checks are recorded in the v4 audit.
Same uninterrupted session uses September 12 Node 26.8.2 startup/capability receipt; no
additional maintenance, native inference, pack build or browser certificate was run.

Codex next step: retain the signed v4 diff-review commit and wait for Nick's diff approval.
GitHub step **none**; PR42 parked, base develop/source openai/mac, title/body unchanged until
split. No push, label, dispatch, merge, release or deploy. Budget recorded UNFROZEN/PUBLIC,
private fallback 3,000; exact hosted attempts authorized/used zero; no fresh SSH remote read.
Claude Code: no need to open now unless Nick wants its review of the v4 diff. These commits
are local to Codex. After eventual authorized develop integration, clean anthropic/mac may
fetch/merge origin/develop at its next batch; never copy between worktrees. Develop/main/live
site remain unchanged. Resume from this handoff, never PAUSED_CHECKPOINT's restart commands.
