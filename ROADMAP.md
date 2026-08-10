# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO) are the SOURCE OF TRUTH we pull from for a
## full-system review/edit later. RULE: whenever we change a system, update its doc IN THE
## SAME BATCH (and bump its "matches code as of" marker) — the same way we run validate and
## update this roadmap. A change isn't done until its markdown reflects it. Also keep
## celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable. (Split first done 2026-07-21
## when this crossed ~285KB / 4,272 lines and stopped reading in one pass.)

## ▶▶▶ SESSION HANDOFF — 2026-08-10 · WAVE 1 177/177 PASS + READY TO COMMIT; VANILLA DEFERRED OPEN ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: C:\Projects\celestial-frontier-openai-windows
## Owner/branch: OpenAI/Codex on openai/windows. Clean reset-baseline HEAD is
## bc26e800c7adca72805a832e753ace1a8f9837ba. Wave 1 is an uncommitted nine-art-file batch plus
## hybridmatrixaudit.ts/hybridmatrix.mjs audit updates on top. Independent review and the complete
## Wave-1 gate set are finished; this bounded checkpoint is READY TO COMMIT. PR #7 is historical
## and merged. No reset PR, 1,250 PASS certification, final image-inclusive ZIP, release, deployment,
## or version bump exists. Integration remains openai/windows → reviewed draft PR → develop; never
## commit directly to develop or main.
## Read next: PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md ·
## port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md · ART_DIRECTION.md ·
## PROCEDURAL_CHARACTERISTICS.md · LINEAGE_AND_BREEDING.md · port/PROPORTION_ARC.md ·
## port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/README.md.

## ★ FROZEN FULL-RESET R1 BASELINE — COMPLETE REVIEW, NOT CERTIFICATION
## The clean bc26e8 capture covers all 1,250 identities in 181 families / 233 packets and was judged
## fresh at native 440px, unlabeled 300px, actual unlabeled 132px, labelled old/current, and exact
## set+species mustRead/procedural-plan contracts. Collector result: 516 PASS · 14 POLISH · 720 FAIL,
## all rows fresh and all required evidence reviewed; literal certification eligibility is false.
## Per-set truth: fauna 151/6/474 · flora 125/0/207 · fungi 16/0/11 · microbes 12/2/6 ·
## procedural 212/6/22 (PASS/POLISH/FAIL). Frozen authority:
## port/v2/apps/game/smoke/full-reset-results-2026-08-10-r1/results.json.
## GP7, GP7.1 and their r1/r2/r3 remain quarantined history and cannot replace this baseline.

## ★ WAVE 1 — EXACTLY 177/177 TARGETS INDEPENDENTLY PASS
## Scope is exactly 177 reset non-PASS targets: root 38 (2 fungi + 8 microbes + 28 procedural) ·
## fish 59 · tree 48 · fauna2 32. Independent frozen-source rejudging closed root 38/38, fish 59/59,
## tree 48/48 and fauna2 32/32 PASS at 440/300/132, with their named protected controls and repeat
## evidence intact. Do NOT add 177 to the frozen baseline tally: these are changed scoped pixels, not
## a new 1,250-row collector result, and the remaining catalogue has not been post-Wave-1 rejudged.
## Source ownership is bounded to alientraits.ts, invertoverrides.ts, proceduralfamilies.ts,
## proceduraloverrides.ts, speciesoverrides.ts, faunaoverrides3.ts, florarost.ts,
## floraoverrides2.ts and faunaoverrides2.ts.

## ★ WHOLE-FORM / ROUTING LAW + PIXEL-NEUTRAL CLEANUP
## A named whole-form repair must own one winning route and return before older generic painters;
## later details behind an early return are dead, while an overlay after a whole-form painter risks
## double-painting seams. Prove the winning route before editing. Remove or narrow shadowed same-target
## code only with target/control hashes. The tree cleanup made strictSignature/resetTreeSignature
## mutually exclusive for their 39 overlapping names and removed impossible orchard/citrus arms.
## Proof was exactly 0/174 drift across the 58 tree target/control surfaces at 440/300/132 and 0/332
## Earth-flora native drift. Declared spec fields remain read; no inert cleanup was accepted.

## ★ APPLE CONTINUITY CLOSED PASS; VANILLA IS THE SOLE OPEN HYBRID DEFECT
## Apple's continuity repair is independently judged PASS at source SHA-256
## D3801E5A234D0D58DF6BAD1515D7583D53ED96C1939EABBE8B02376204503624: all 58/58 tree
## target/control rows are exact at 440/300/132 (174/174 hashes), and all five lineage stages are
## unique with pixel distance from pure strictly increasing as the anchor falls. Schema v3 validates
## 234/234 assets and both browser orders are stable. Judge evidence:
## C:\Users\Nick\.codex\visualizations\2026\08\09\019fe72d-20c7-73a0-bac7-d2c64d10673d\
## flora-tree-focus\evidence-apple-continuity-judge.
## The earlier Green Algae stop was a real schema-v2 harness contract bug, not transient provenance:
## schema v3 now distinguishes the current flora catalogue owner from the retained legacy microbe
## route and its sentinels are green. The matrix remains FAIL_BYTE_IDENTICAL_STAGES solely because
## pre-existing Vanilla Orchid is identical across all five stages; broader continuity stays OPEN
## for a later bounded wave and does NOT block this Wave-1 checkpoint commit.

## ★ NEXT — COMPLETE IN THIS ORDER
## 1. Commit the completed Wave-1 source, hybrid audit repair and living docs on openai/windows, then
##    push that branch. Do not add unrelated files and do not commit to develop/main.
## 2. Open a reviewed DRAFT PR with base develop and source openai/windows. Copy-ready title:
##    `art: complete full-reset Wave 1`. Summary: exact 177-target independent closure, Apple
##    continuity PASS, schema-v3 Green Algae provenance repair, and all checkpoint gates complete.
##    Boundary: Vanilla Orchid continuity stays OPEN for a later bounded wave; no 1,250 certificate.
## 3. Continue the remaining baseline non-PASS rows in bounded owner/family waves with author-separated
##    judging; never carry a verdict across changed pixels or repair while a judge holds source frozen.
## 4. Repair/rejudge Vanilla Orchid in its own later bounded continuity wave; do not call the current
##    matrix PASS while FAIL_BYTE_IDENTICAL_STAGES remains.
## 5. After all rows close, make a fresh clean 1,250 capture/collector run, resolve the broader hybrid
##    matrix, run literal certification, and build the dated image-inclusive ZIP. Until then, the full
##    post-repair 1,250 collection, certification, ZIP and reset PR remain OPEN.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex — Wave 1 is gate-complete and ready to commit/push on openai/windows,
## then open the reviewed draft PR above to develop. Other side: Anthropic/Claude Code does not have
## this work and Nick does not need to open it now;
## never copy files manually. After a future reviewed Codex PR is merged into develop, Claude starts
## from a clean anthropic/windows worktree, fetches origin and merges origin/develop under the protocol.
## Codex performs the same clean-start synchronization after develop moves. Release status: develop,
## main and the live site are unchanged; no release or deployment performed.
