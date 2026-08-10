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

## ▶▶▶ SESSION HANDOFF — 2026-08-10 · WAVE 2C 56/56 PASS; READY TO COMMIT/PUSH ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: C:\Projects\celestial-frontier-openai-windows
## Owner/branch: OpenAI/Codex on openai/windows. Clean reset-baseline HEAD is
## bc26e800c7adca72805a832e753ace1a8f9837ba; Wave 1 is d005090f, Wave 2a is 00e499c, and Wave 2b is
## committed/pushed as 9c148f071bb8e4ad8d3e92358c6408fc234f22bd. Wave 2c is uncommitted but all 56
## bounded targets have author-separated PASS and the integrated gates are green with the five source
## SHAs unchanged. This bounded checkpoint is READY TO COMMIT/PUSH on openai/windows. PR #7 is
## historical/merged; no reset PR, new 1,250-row tally, final certification, image-inclusive ZIP,
## release, deployment or version bump exists. Read next: PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md ·
## port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md · ART_DIRECTION.md ·
## PROCEDURAL_CHARACTERISTICS.md · LINEAGE_AND_BREEDING.md · port/PROPORTION_ARC.md ·
## port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/README.md.

## ★ FROZEN FULL-RESET R1 BASELINE — COMPLETE REVIEW, NOT CERTIFICATION
## The clean bc26e8 capture covers all 1,250 identities in 181 families / 233 packets and remains
## 516 PASS · 14 POLISH · 720 FAIL: fauna 151/6/474 · flora 125/0/207 · fungi 16/0/11 ·
## microbes 12/2/6 · procedural 212/6/22 (PASS/POLISH/FAIL). Authority:
## port/v2/apps/game/smoke/full-reset-results-2026-08-10-r1/results.json. Never add scoped wave
## results to 516 or fabricate a post-wave catalogue tally.

## ★ ACCEPTED CHECKPOINTS BELOW THE FROZEN LEDGER
## Wave 1: committed/pushed d005090f; root 38 + fish 59 + tree 48 + fauna2 32 = 177/177 scoped PASS.
## Wave 2a: committed/pushed 00e499c; Mammal A 4 + worms/sessile 13 + S1–S3 15 = 32/32 scoped PASS.
## Wave 2b: committed/pushed 9c148f0; Mammal B 25 + Bird B1 21 + Invert I 5 = 51/51 scoped PASS.
## Wave 2c: uncommitted; Mammal C 13 + Bird B2 28 + Invert II 15 = 56/56 scoped PASS, integrated
## gates green, READY TO COMMIT/PUSH. Vanilla Orchid r6 remains a separate 234-asset continuity PASS. None is a new
## full-catalogue score.

## ★ WAVE 2C — EXACTLY 56/56 AUTHOR-SEPARATED PASS
## Mammal C: 13/13 PASS. The first whole-form preview was 0/13 candidate-ready. R2 reached 8 PASS /
## 5 FAIL (Wolf · Pampas Fox · Red Panda · Possum · Tasmanian Devil); R3 reached 11/13, and both R3
## and R4 failed closed on Red Panda's leg/body join and Tasmanian Devil's integrated chest band.
## R5 closed both before the independent shared judgment returned 13/13 PASS.
##
## Bird B2: 28/28 PASS. The first independent shared judgment returned 25 PASS / 3 FAIL: Eider Duck
## stood above rather than low in water; Rail's cocked tail was detached and its bill read too straight;
## Avocet's bill was a straight spike rather than recurved. The bounded repair changed only those three;
## final A/B rejudgment returned 3/3 PASS while the other 25 targets +72 controls stayed exact.
##
## Invert II: 15/15 PASS. The first author preview failed closed at 10/15 on Brine Shrimp · Freshwater
## Shrimp · Tadpole Shrimp · Vent Shrimp · Amphipod; bounded R2 made those five candidate-ready while
## ten retained targets +27 controls stayed exact. The first independent shared judgment then returned
## 13 PASS / 2 FAIL on Krill and Tadpole Shrimp. Final bounded repair made the compound eyes and organic
## leaf-limb field survive card scale; the second judge returned 2/2 PASS.

## ★ FINAL SHARED-R2 EVIDENCE — SEALED; JUDGMENT COMPLETE
## Evidence: port/v2/apps/game/smoke/wave2c-shared-final-r2-evidence-2026-08-10. Manifest SHA-256:
## BCB5282571903AC2057F6A5B9F7FCA09C6DE8372E4FEFEEAD8D34340930CE330. It binds 249 rows = 56
## targets +193 protected controls, 747 surfaces/run and 1,494 physical PNG hash/dimension checks.
## Current/repeat is exact on 249/249 rows and 747/747 surfaces; all 579 protected surfaces match the
## shared baseline; all 168 target surfaces changed. The final R2 changed only Eider Duck · Rail ·
## Avocet · Krill · Tadpole Shrimp (15 surfaces); the other 244 rows /732 surfaces stayed exact.
## Three 139-file input snapshots have zero drift, and all three negative controls were rejected.

## ★ FROZEN WAVE-2C SOURCE SHAS
## quadrupedoverrides.ts 45B1C645952DAC02EFF9B0D5266BA31DCED6D89176F51417B85A7B0F0B37BB59 ·
## mammaloverrides.ts 50B3B2FFEBF2C6DF1842B9E545CEBC79C4880F376FDD96CA8E8C612150C47EC2 ·
## faunaoverrides.ts D7917829228DEFFF764D9C5224D55A4C6A708B9FCEDAE4FF7E34149375A907C5 ·
## birdoverrides.ts C7D536C679460E0BE8ADF38CF14DF0FF3EB4F4E35C6827D8D51DF2997FE8BD21 ·
## invertoverrides.ts 6A4020DD69E65473E8034C58FA398A3099A1339B94D83A838A10EE5C905451A0.

## ★ WHOLE-FORM / FAIL-CLOSED LAW
## One named whole form owns silhouette, anatomy, attachments and material on one winning route. A
## changed pixel, source-complete branch, green author gate or current-only preview cannot replace an
## author-separated 440/300/132 A/B verdict. Reopen only named blockers; every accepted target and
## control stays frozen. A pasted seam, rigid ladder, wrong posture or missing card-size cue remains FAIL.

## ★ FINAL INTEGRATED WAVE-2C GATES — GREEN; FIVE SOURCE SHAS UNCHANGED
## typecheck and artunused PASS; Vitest 23 files /238 passed /1 skipped; speccheck 418 declared /
## 0 unread /0 inert; overridecheck 1,014/1,014 live +1,010/1,010 Earth; speciesaudit 1,250/1,250
## with 0 failure /0 duplicate pairs /0 clipped; hybridcheck PASS with 11/11 injected failures rejected;
## hybridmatrix and speciesstrip selftests PASS; coveragegap 1,010/1,010 with 0 remaining;
## fullresetlayout and fullresetreview serialized selftests PASS; git diff --check PASS. No tracked or
## untracked generated leakage exists. This closes checkpoint readiness only, not the reset PR,
## full recertification, ZIP, merge, release or deployment.

## ★ DEFERRED P2 CLEANUP — DO NOT DISTURB FROZEN EVIDENCE
## No P0/P1 source blocker exists. Later pixel-neutral work may make Mammal C's marsupial-c1 dispatcher
## arm explicit (quadrupedoverrides.ts:1864), remove Skua's unreachable Snow-Petrel colour alternative
## (faunaoverrides.ts:3171), and simplify exact Invert-II legacy opts shadowed by named early returns
## (invertoverrides.ts:1005,1632,2937–2957). Do not fold these into this checkpoint; require fresh hashes.

## ★ NEXT — COMPLETE IN THIS ORDER
## 1. Commit/push only the accepted Wave-2c source/evidence-bound docs on openai/windows. Do not open or
##    merge the reset PR at this bounded checkpoint.
## 2. Continue the remaining r1 non-PASS rows in bounded owner/family waves with source frozen during
##    judgment. Only after every row closes may a clean 1,250 collector, final hybrid evidence, literal
##    certification and dated image-inclusive ZIP begin.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex — Wave 2b commit 9c148f0 is pushed/synchronized; Wave 2c is uncommitted,
## 56/56 independently PASS, integrated-green and READY TO COMMIT/PUSH. No reset PR is due at this checkpoint.
## Other side: Anthropic/Claude Code does not have Wave 2a/2b/2c through develop; Nick does not need to
## open it now and files must never be copied manually. After a future reviewed Codex PR merges into
## develop, Claude starts clean, fetches and merges origin/develop into anthropic/windows under
## PARALLEL_GIT_PROTOCOL.md. develop, main and the live site are unchanged; no release occurred.
