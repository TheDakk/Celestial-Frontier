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

## ▶▶▶ SESSION HANDOFF — 2026-08-10 · RESET FOUNDATION READY TO COMMIT; 1,250-ROW JUDGING NEXT ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: C:\Projects\celestial-frontier-openai-windows
## Owner/branch: OpenAI/Codex on openai/windows. The reset-foundation batch is still uncommitted on
## top of local HEAD 3528bfb. Independent bounded diff review and the integrated post-review gate
## pass found no blockers; the foundation is ready to commit. PR #7 is
## historical/already merged. No reset PR, full PASS, final ZIP, release, deployment or version bump
## exists. Integration remains openai/windows → reviewed draft PR → develop; never commit to develop
## or main directly.
## Read next: PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md ·
## port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md ·
## port/v2/reference/BAT_FAMILY_RESET_REVIEW_2026-08-10.md · ART_DIRECTION.md ·
## LINEAGE_AND_BREEDING.md · PROCEDURAL_CHARACTERISTICS.md · port/PROPORTION_ARC.md ·
## port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/README.md.

## ★ IMMUTABLE SCOPE / HISTORY BOUNDARY
## GP7, GP7.1 and r1/r2/r3 stay quarantined historical evidence. None of their bands is a reset
## verdict. Scope is exactly 1,250 identities: 631 Earth fauna + 332 flora + 27 fungi + 20 microbes
## + 240 procedural. The route inventory is 1,014 because Green Algae, Reindeer Lichen, Snow Algae
## and Tardigrade each occur in two sets; every join uses set+species, never display name alone.

## ★ RESET FOUNDATION ACCEPTED — CLEAN COMMIT STILL REQUIRED BEFORE OFFICIAL CAPTURE
## 1. Review references and every new layout/comparison/collector join are exact set+species.
## 2. Breeding stores the selected Earth lineage's `_earthBlendKingdom` without changing the lifted
##    RNG stream. Fauna uses its lineage-aware HD scaffold; flora/fungi/microbe use the exact named
##    owner. Portrait/thumb caches share a canonical key over the complete deterministic genome.
## 3. `hybridcheck` drives production pixels across every kingdom, duplicate names, parent orders,
##    lineage/cache/repeat cases and injected failures.
## 4. `fullresetlayout` derives the official 181 families / 233 packets (10 max) and 46 production
##    procedural plan families. `fullresetreview` binds each row to clean 40-hex provenance, native
##    440px, unlabeled 300px, actual unlabeled 132px, labelled old/current and exact
##    mustRead/procedural-plan hashes; certification can write only for 1,250 fresh PASS.
## The independent bounded diff review found no blocker in `gp71rejudge`, `fullresetlayout` or
## `fullresetreview`; its selftests and negative controls passed. Post-review syntax, TypeScript,
## unused-code, 238-pass/1-skipped Vitest, reset-tool, hybrid-matrix and diff checks also passed.
## This accepts the reset foundation, not any catalogue-wide art verdict. The official capture starts
## only after this exact batch is committed and the worktree is clean.

## ★ FIRST NEGATIVE-CONTROL FAMILY — FROZEN PASS, FAMILY SCOPE ONLY
## Refine2d remained FAIL because digit/thumb/foot/rear-membrane support did not survive all delivery
## bands. With source frozen, independent refine3 review returned Bat PASS · Fruit Bat PASS ·
## Insect-Eating Bat PASS · Vampire Bat PASS at 440/300/132px. Repeat hashes match and five nearby
## controls are byte-identical to refine2d. Exact hashes/ruler/sources:
## port/v2/reference/BAT_FAMILY_RESET_REVIEW_2026-08-10.md.
## This is four frozen rows, not a 1,250-row score; any new bat pixel invalidates carry.

## ★ HYBRID / PIXI TRUTH — AUTOMATION GREEN DOES NOT MEAN SEAMLESS
## The provisional 12-lineage × 5-stage matrix is source/hash bound but was captured from a dirty
## worktree, so it is diagnostic only. Route/cache outcomes are correct; visual continuity is OPEN.
## Fruit Bat changes renderer generation between pure and bred stages; Vanilla Orchid is byte-
## identical across all five anchors; Apple and Oyster Mushroom remain unreviewed. Rerun the matrix
## from the clean commit after repairing these outcome gaps.
## Pixi owns galaxy/world presentation. Species are still deterministic Canvas2D → data URL → DOM
## image. Upgrade in stages: anatomy/lineage continuity → resolution-aware portrait seam → bounded
## Pixi living-preview proof → later mesh/skeletal production pipeline. Shaders cannot fix anatomy.

## ★ HYGIENE LANDED IN THE WORKING BATCH
## The orphan `packages/art/src/5` 26,400×19,800 PNG is removed after exact consumer/signature proof.
## Twelve superseded local painters and definite no-op locals are removed; isolated proof kept all
## 1,246 non-bat portraits byte-identical. The v2 DPR law is restored: touch/coarse pointer cap 2,
## desktop cap 3. These are cleanup/presentation results, never organism PASS evidence.

## ★ NEXT — EXACT PROCEDURE AFTER CLEAN FOUNDATION COMMIT
## 1. Commit the bounded foundation on openai/windows; require a clean 40-hex HEAD.
## 2. Capture a new 1,250-current evidence root. Run `fullresetlayout --prepare` with `--per=10
##    --packets --source-commit=<40_HEX_HEAD>`, then `fullresetreview --compare` against the frozen
##    old root and `fullresetreview --template` for 233 empty fresh packets. Copy-ready commands are
##    in port/v2/README.md and the reset authority.
## 3. Judge all rows fresh, family by family: fauna → flora → fungi → microbes → procedural. Collect
##    only exact hash-bound PASS/POLISH/FAIL reasons; repair confirmed rows, commit cleanly and recapture.
## 4. Resolve the hybrid visual-continuity failures and rerun `hybridcheck` + `hybridmatrix` from a
##    clean commit. Do the bounded Pixi preview only after source anatomy and lineage continuity pass.
## 5. Run `fullresetreview --certify` and build the dated image-inclusive ZIP only after collection
##    reports 1,250 fresh PASS, zero POLISH/FAIL/carried rows. Until then, literal 100% stays blocked.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## OpenAI/Codex: keep this accepted worktree untouched by other apps; commit and push openai/windows.
## Only then open a reviewed draft PR with base develop and source
## openai/windows; no placeholder title/number is recorded yet. Claude Code: do not open it now and do
## not copy files manually. After Nick reviews and merges a future Codex PR, Claude must start with a
## clean worktree, fetch origin, and merge origin/develop into anthropic/windows under the protocol.
## Codex performs the same clean-start synchronization after develop moves. No release/deploy here.
