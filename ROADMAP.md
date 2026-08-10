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

## ▶▶▶ SESSION HANDOFF — 2026-08-10 · WAVE 2D 50/50 PASS; READY TO COMMIT/PUSH ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: C:\Projects\celestial-frontier-openai-windows
## Owner/branch: OpenAI/Codex on openai/windows. Clean reset-baseline HEAD is
## bc26e800c7adca72805a832e753ace1a8f9837ba; Wave 1 is d005090f, Wave 2a is 00e499c,
## Wave 2b is 9c148f0, Wave 2c is committed/pushed as dc015cfde4385530686cf8fff7e36e13ce67769c,
## and Wave 2d is the current uncommitted bounded checkpoint. Its 50 changed targets are independently
## PASS and final integrated gates are green; it is ready to commit/push. PR #7 is
## historical/merged. No reset PR, new 1,250-row tally, final certification, image-inclusive ZIP,
## merge, release, deployment, or version bump exists. Read next: PROCESS_LAWS.md ·
## PARALLEL_GIT_PROTOCOL.md · port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md ·
## ART_DIRECTION.md · PROCEDURAL_CHARACTERISTICS.md · LINEAGE_AND_BREEDING.md ·
## port/PROPORTION_ARC.md · port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/README.md.

## ★ FROZEN FULL-RESET R1 BASELINE — COMPLETE REVIEW, NOT CERTIFICATION
## The clean bc26e8 capture covers all 1,250 identities in 181 families /233 packets and remains
## 516 PASS ·14 POLISH ·720 FAIL: fauna 151/6/474 · flora 125/0/207 · fungi 16/0/11 ·
## microbes 12/2/6 · procedural 212/6/22 (PASS/POLISH/FAIL). Authority:
## port/v2/apps/game/smoke/full-reset-results-2026-08-10-r1/results.json. Scoped wave results never
## mutate this ledger and must not be added to 516.

## ★ ACCEPTED CHECKPOINTS BELOW THE FROZEN LEDGER
## Wave 1: committed/pushed d005090f; root 38 + fish 59 + tree 48 + fauna2 32 =177/177 scoped PASS.
## Wave 2a: committed/pushed 00e499c; Mammal A 4 + worms/sessile 13 + S1–S3 15 =32/32 scoped PASS.
## Wave 2b: committed/pushed 9c148f0; Mammal B 25 + Bird B1 21 + Invert I 5 =51/51 scoped PASS.
## Wave 2c: committed/pushed dc015cf; Mammal C 13 + Bird B2 28 + Invert II 15 =56/56 scoped PASS.
## Wave 2d: uncommitted/ready; Mammal D 16 + Bird B3 27 + Invert III 7 =50/50 scoped PASS. Vanilla
## Orchid r6 remains a separate 234-asset continuity PASS. None is a new
## full-catalogue score.

## ★ WAVE 2D — EXACTLY 50/50 AUTHOR-SEPARATED PASS
## Mammal D: 16/16 PASS. The first shared preview failed closed on Fisher's tail silhouette,
## Marten's ears, Wolverine's claws, Sea Otter's body rotation, Hyrax's ear scale, and Mole's
## snout/forepaw separation. Bounded R2 changed those six. The first independent final judgment
## returned 15 PASS /1 FAIL because Civet still lacked its long pointed muzzle; Civet-only R4
## changed 3/3 surfaces, preserved the other 303 rows /909 surfaces, and independently closed 16/16.
##
## Bird B3: 27/27 PASS. The initial author screen was 11 candidate-ready /16 blocked: Chough · Crow ·
## Raven · Peacock · Pheasant · Rooster · Quetzal · Sandgrouse · Cockatoo · Macaw · Parrot · Dove ·
## Pigeon · Finch · Swift · Hornbill. R2 changed exactly those 16 and left only Pheasant's too-short
## tail, Quetzal's too-short streamers, and Macaw's too-short tail open. R3 changed exactly those
## three; the independent final judge returned 27 PASS /0 FAIL with 100 lane controls exact.
##
## Invert III: 7/7 PASS. Sea Spider · Camel Spider · Pseudoscorpion · Scorpion · Spider · Tarantula ·
## Millipede received exact-name whole forms. The first screen kept Camel Spider open because its
## paired chelicerae/gape vanished at 132px and Tarantula open because fangs/palps were weak. R2
## changed exactly those two while the other five targets stayed exact; independent final judgment
## returned 7 PASS /0 FAIL.

## ★ FINAL WAVE-2D R4 EVIDENCE — SEALED; JUDGMENT COMPLETE
## Pre-edit baseline seal: 7C68250E3BED9AE64FD5066A4D5389C45056600F09E48B1287253AB20E6B877F.
## Final root: port/v2/apps/game/smoke/wave2d-shared-final-r4-evidence-2026-08-10.
## Manifest SHA-256: DC21922F21E881348263C1B7CE6E8E68C6686752CE782FAA607B3AE6E7398BCE.
## It binds 304 rows =50 targets +254 protected controls and 912 surfaces/run. Current/repeat is
## exact on 912/912 surfaces; all 762 protected surfaces match the pre-edit baseline; all 150 target
## surfaces changed. R4 changed only Civet's 3 surfaces; the other 303 rows /909 surfaces stayed
## exact. All 1,824 PNG hash/dimension checks pass, three 139-file input snapshots have zero drift,
## and all four negative controls were rejected.

## ★ FROZEN WAVE-2D SOURCE SHAS
## faunaoverrides.ts 63D7A9B1E3AE8E2FE359137A030E1AE8AEFC3328ACB5C88FB6E59E7F014A2DA2 ·
## birdoverrides.ts 48FFA589F2273F0F29FD85DF1F05FD070477ADE70F1CDEB7698F5321E5702DC7 ·
## quadrupedoverrides.ts 544F5A6582F467E744C5F2A3ABF0EDF61DE5A5180CF5658155594E5FF86316C1 ·
## mammaloverrides.ts 776FB86FF9A42E348A9278F98F7DC03584568C65A09C637CB1D7BFA38BB7A46E ·
## invertoverrides.ts 2BB40BD1838D6B6B01F09B01D3BC4CBE7B00D0F0C219FEA5926BF076A4F39677.

## ★ PIXEL-NEUTRAL P2 CLEANUP — CLOSED WITH FRESH PROOF
## The Wave-2c deferred cleanup is now source-explicit and pixel-neutral: Mammal C has an explicit
## marsupial-c1 dispatcher arm; Skua's unreachable Snow-Petrel colour alternative is removed; and
## exact Invert-II legacy non-hue options shadowed by named early returns are removed. The shared
## pre-edit/final evidence keeps all 254 protected rows /762 surfaces byte-exact. These are
## route-proven cleanup changes, not visual retcons.

## ★ WHOLE-FORM / FAIL-CLOSED LAW
## One named whole form owns silhouette, anatomy, attachments and material on one winning route.
## Author screens authorize a capture, never a verdict. A changed pixel, green static gate or
## current-only preview cannot replace an author-separated 440/300/132 A/B judgment. Reopen only
## named blockers, freeze every accepted neighbour, and require exact repeat and source/input
## provenance. A pasted seam, wrong posture, missing topology or card-size cue remains FAIL.

## ★ FINAL INTEGRATED WAVE-2D GATES — GREEN; READY TO COMMIT/PUSH
## All five source SHAs and the 139-input aggregate 58553184F25A8E2D4EDBA4811BEE8087BCAA7E48AC2AD978D96D264FEC793CBC
## stayed exact. git diff --check, typecheck and artunused PASS; Vitest 23 files /238 pass /1 skip;
## speccheck 419/0/0 +5/5 selftest; coveragegap 1,010/1,010; artaudit 23 sources /0; tokencheck
## selftest 16/16 (normal 445-value /23-dead /14-alias diagnostic is non-verdict); overridecheck
## 1,014/1,014 routes +1,010/1,010 species; speciesaudit 1,250/1,250 with 0 fail/duplicate/clipped;
## hybridcheck PASS with 11 negatives; hybridmatrix/speciesstrip/fullresetlayout selftests PASS;
## fullresetreview PASS 10/10 join /6 packets /9 changed fixture. No nonignored generated leakage;
## renderer drained. This authorizes only the Wave-2d checkpoint commit/push—not the reset PR, full
## recertification, ZIP, merge, release, or deployment.
## Full 1,250 recertification, the image-inclusive ZIP, reset PR, merge, release and deployment remain OPEN.

## ★ NEXT — CHECKPOINT THEN CONTINUE THE RESET
## 1. Create one intentional Wave-2d checkpoint commit and push openai/windows; do not open the
##    reset PR or include unrelated files.
## 2. Continue the remaining frozen-r1 non-PASS rows in bounded named owner lanes with the same
##    440/300/132 A/B, protected-control and independent-judge ruler.
## 3. Only after every remaining row closes may a clean 1,250 collector, final hybrid evidence,
##    literal certification and dated image-inclusive ZIP begin.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex — Wave 2c commit dc015cf is pushed/synchronized; Wave 2d is
## uncommitted and READY TO COMMIT/PUSH. No reset PR is due at this checkpoint.
## Other side: Anthropic/Claude Code does not have these bounded checkpoints through develop; Nick
## does not need to open it now and files must never be copied manually. After a future reviewed
## Codex PR merges openai/windows into develop, Claude starts clean, fetches, and merges
## origin/develop into anthropic/windows under PARALLEL_GIT_PROTOCOL.md. develop, main and the live
## site are unchanged; no release occurred.
