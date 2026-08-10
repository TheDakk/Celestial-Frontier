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

## ▶▶▶ SESSION HANDOFF — 2026-08-09 · GP7.1 STRICT-CONFORMITY REMEDIATION IN PROGRESS ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Current workspace: C:\Projects\celestial-frontier-openai-windows
## Current owner/branch: OpenAI/Codex on openai/windows. PR #7 is merged into develop as
## 52467ba. This is a new bounded GP7.1 remediation batch; its integration vehicle is a draft PR,
## never a direct merge.
## Integration path: openai/windows → reviewed draft PR → develop. Never commit directly to
## develop or main; no release, main merge, live-site deploy or version bump is authorized here.
## Read next: PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md · ART_DIRECTION.md ·
## port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md ·
## port/v2/reference/GP7_SPEC_CONFORMITY_RECHECK_2026-08-09.md.

## ★ THE UPLOADED GP7 CONFORMITY RECHECK IS ACCOUNTED FOR
## Nick supplied Celestial_Frontier_GP7_1250_Asset_Spec_Conformity_Recheck_Full_Package.zip.
## SHA-256: 448BF5A465F195673E87DBEB487A3C3ADFDDE258A319050DD2493ECAB84CC6BB.
## Size: 7,317,675 bytes. It contains 23 metadata entries, all internally coherent, but no
## PNG/JPEG/WebP/GIF portraits, review strips, or packets. It proves a 1,250-row ledger/index,
## not current visual pixels. GP7 evidence remains frozen; do not rewrite carried records to pass.

## ★ MEASURED STATE — NOT A MISLEADING SINGLE SCORE
## Fresh strict current-pixel review: 503 rows / 95 strips = 301 FAIL · 37 POLISH · 165 PASS.
## Byte-unchanged carried review: 747 rows = 317 FAIL · 378 POLISH · 52 PASS.
## The merged 1,250-row inventory is 618 FAIL · 415 POLISH · 217 PASS and is explicitly NOT a
## calibrated catalogue score. Exact work queue: 301 FIX_TO_PASS · 37 POLISH_TO_PASS · 165 FREEZE ·
## 317 REVALIDATE_STRICT_THEN_FIX_IF_CONFIRMED · 378 REVALIDATE_STRICT_THEN_POLISH_IF_CONFIRMED ·
## 52 REVALIDATE_STRICT_THEN_FREEZE. When stale required_fix prose conflicts with a verified
## current-pixel note, verify_why governs the repair.

## ★ GP7.1 WORK NOW IN PROGRESS
## 1. Close the 338 fresh strict named non-PASS rows through opt-in, species-scoped morphology and
##    preserve matched controls. No global repaint, no verdict relabeling.
## 2. Render and strictly rejudge all 747 carried rows. A carried FAIL/POLISH is a review queue,
##    not a confirmed current defect; a carried PASS is not a fresh certification.
## 3. Preserve a dated GP7.1 ledger plus the actual 1,250 current portraits and labelled review
##    strips/contact sheets. Run all art gates and the conformity guard.
## 4. Literal 100% PASS is permitted only when all 1,250 rows are freshly strict PASS, with no
##    carried rows, and the package contains current pixels + strip evidence + manifest + ledger.

## ★ NEW FAIL-CLOSED GUARD
## From port/v2: npm run gp7conformity -- --input <extracted-or-fresh-ledger-dir>
## The tool verifies exact joins, manifests, identity hashes, bands, freshness and action routing.
## --certify fails unless all 1,250 are fresh strict PASS. It validates ledger provenance; it does
## not substitute for rendered image evidence. Self-test passes both positive and negative controls.

## ★ LIVE SOURCE / REVIEW STATE
## GP7.1 has completed its first all-fresh, single-ruler baseline: 1,250 current 440x440 portraits
## and 196 hash-bound review packets collected as 318 FAIL · 301 POLISH · 631 PASS, with zero
## carried rows. It is a repair baseline, not a 100% certification. The largest non-PASS buckets are
## Other plant/harvest (115), procedural (79), fruit/nut trees (27), rodents (17), herbs/spices (17),
## primates (15), and shrubs/bushes (12). Source repairs must remain named/opt-in; generated
## full-catalogue diagnostics are evidence only and must not become a drift baseline or rewrite GP7.
## r2 changed-pixel evidence then independently measured fauna 46 PASS / 42 POLISH / 10 FAIL (98),
## flora+fungi 56 / 62 / 49 (167), and procedural 76 / 21 / 0 (97); the other 888 portraits matched
## their baseline bytes. A second narrow source pass is gated and complete, but no bands were promoted.
## A distinct r3 full 1,250-portrait / 196-packet current evidence set is now captured. It differs
## from r2 in 106 portrait hashes: fauna 13, flora 59, fungi 6, and procedural 28; the other 1,144
## portraits remain byte-identical. R3 has no verdict ledger or certification yet. Independently
## judge its current packets before promoting any band, and retain exact-hash prior evidence only as
## transparent support rather than as a substitute for the final all-fresh strict rejudge.

## ★ NEXT — COMPLETE IN THIS ORDER
## 1. Independently review the r3 packets under the strict ruler and collect only hash-bound verdicts.
## 2. Resolve only confirmed remaining FAIL/POLISH rows, preserving matched controls, then repeat the
##    all-catalogue capture and rejudge until every one of the 1,250 fresh rows is PASS.
## 3. Generate a new dated image-inclusive review ZIP and fresh ledger; run gp7conformity --certify
##    plus full art gates only after the all-PASS collector result exists.
## 4. Commit/push this remediation and evidence-pipeline batch on openai/windows as a draft PR to
##    develop. It must remain a draft and must not be merged or deployed before certification.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex on openai/windows. PR #7 is already merged in develop at 52467ba.
## This GP7.1 batch must be committed and pushed as a NEW draft PR from openai/windows → develop
## only after fresh evidence and gates are complete. Do not create a placeholder PR.
## Claude Code: no need to open it now. After the new Codex PR is merged, Claude must start clean,
## fetch origin, and merge origin/develop into anthropic/windows under PARALLEL_GIT_PROTOCOL.md.
## Codex follows the same clean-start fetch/merge procedure before its next batch after develop moves.
