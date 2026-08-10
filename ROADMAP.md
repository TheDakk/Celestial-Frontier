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

## ▶▶▶ SESSION HANDOFF — 2026-08-10 · WAVE 2A 32/32 PASS; READY TO COMMIT/PUSH ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: C:\Projects\celestial-frontier-openai-windows
## Owner/branch: OpenAI/Codex on openai/windows. Clean reset-baseline HEAD is
## bc26e800c7adca72805a832e753ace1a8f9837ba; accepted Wave 1 is committed and pushed as d005090f.
## Wave 2a is a bounded, uncommitted working batch on top. Mammal A, worms+sessile, S1–S3 and
## Vanilla r6 all have independent PASS. The 32 catalogue targets and focused continuity repair are
## closed; this checkpoint is READY TO COMMIT/PUSH on openai/windows. PR #7 is historical/merged;
## no reset PR, 1,250 PASS certification, final image-inclusive ZIP, release, deployment or version
## bump exists. Read next: PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md ·
## port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md · ART_DIRECTION.md ·
## PROCEDURAL_CHARACTERISTICS.md · LINEAGE_AND_BREEDING.md · port/PROPORTION_ARC.md ·
## port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/README.md.

## ★ FROZEN FULL-RESET R1 BASELINE — COMPLETE REVIEW, NOT CERTIFICATION
## The clean bc26e8 capture covers all 1,250 identities in 181 families / 233 packets and was judged
## fresh at 440/300/132 plus labelled old/current and exact set+species contracts. Its immutable result
## is 516 PASS · 14 POLISH · 720 FAIL; literal certification eligibility is false. Per-set truth:
## fauna 151/6/474 · flora 125/0/207 · fungi 16/0/11 · microbes 12/2/6 · procedural 212/6/22
## (PASS/POLISH/FAIL). Authority: port/v2/apps/game/smoke/full-reset-results-2026-08-10-r1/results.json.
## Never add scoped repair results to 516 or fabricate a post-wave catalogue tally.

## ★ WAVE 1 — COMMITTED/PUSHED d005090f; EXACTLY 177/177 SCOPED PASS
## Root 38 (2 fungi + 8 microbes + 28 procedural) · fish 59 · tree 48 · fauna2 32 all closed PASS
## under independent 440/300/132 review with protected controls and repeat evidence. These 177 scoped
## results remain distinct from a new full 1,250-row collector result.

## ★ WAVE 2A — EXACTLY 32/32 CATALOGUE TARGETS PASS; CHECKPOINT CLOSED
## Mammal A is 4/4 PASS: Colugo · Sugar Glider · Fur Seal · Sea Lion. Worms+sessile is 13/13 PASS:
## Earthworm · Flatworm · Ice Worm · Lancelet · Marine Worm · Polychaete Worm · Scale Worm ·
## Barnacle · Coral · Cold-Water Coral · Deep-Water Coral · Sea Cucumber · Sponge. S1–S3 is 15/15
## PASS: its bounded R2 independently closed Caddisfly · Diving Beetle · Firefly · Water Beetle at
## 440/300/132. Frozen `faunaoverrides.ts` SHA-256 is
## EE6CC43E6A326942C3508878470F9490EE1CF21C50DC5C9BE35229AA130EF3F5; the immutable recapture binds
## that hash before A, between A/B and after B with zero drift across 139 build inputs. All 156
## current/repeat PNGs are hash/dimension/repeat exact, and all 22 protected rows are byte-identical
## at every scale. Across the three catalogue batches, Wave 2a is 32/32 independently PASS. This is scoped
## wave status only, never a new catalogue total.

## ★ VANILLA ORCHID r6 — INDEPENDENT CONTINUITY PASS
## Frozen `floraoverrides2.ts` SHA-256 is
## 5BB258D5CD808C63EE2FA2625D100ABA2E0FC6BA31EF62B60661D8114E00135E. Evidence at
## port/v2/apps/game/smoke/hybrid-continuity-wave2-vanilla-2026-08-10-r6 validates 234/234 assets,
## exact source snapshots/dimensions/hashes and both browser orders. Vanilla's pure portrait remains
## exact to 3f6834b7f984b35186fa1c441eeb4537d3e5793d446e447b021a1e3687939a25; all five stages are unique,
## integrated and progressively farther from pure as the anchor falls. `hybridcheck` now requires five
## focused lineages covering all four kingdoms and rejects eleven injected negative controls, including
## focused-species substitution and Vanilla stage collapse. The prior Vanilla byte-identical blocker is closed. This does not certify
## every possible bloodline or the full catalogue; final hybrid/certification scope remains OPEN.

## ★ WHOLE-FORM / ROUTING LAW STILL GOVERNS WAVE 2
## One named whole form owns silhouette, anatomy, attachments and material on one winning route. Code
## behind an early return is absent anatomy; painting another same-target body afterward creates seams.
## Prove dispatch ownership, freeze same-painter controls, and accept cleanup only with pixel evidence.

## ★ NEXT — COMPLETE IN THIS ORDER
## 1. Commit only the accepted Wave 2a source/tool/doc scope on openai/windows, then push that branch.
##    Do not include unrelated files and do not commit directly to develop/main.
## 2. Continue remaining r1 non-PASS rows in owner/family waves with source frozen during judgement.
##    No reset PR/merge is due until the reset reaches its next integration boundary.
## 3. Only after every row closes, run a new clean 1,250 collector, final hybrid evidence, literal
##    certification and the dated image-inclusive ZIP. Until then, the reset PR/release stay OPEN.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex — d005090f is pushed; Wave 2a is independently closed and READY TO
## COMMIT/PUSH locally on openai/windows. No reset PR exists. Other side: Anthropic/Claude Code does not have this batch,
## Nick does not need to open it now, and files must never be copied manually. After a future reviewed
## Codex PR merges into develop, Claude starts clean, fetches, and merges origin/develop into
## anthropic/windows under PARALLEL_GIT_PROTOCOL.md; Codex follows the same rule after develop moves.
## develop, main and the live site are unchanged; no release or deployment occurred.
