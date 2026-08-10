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

## ▶▶▶ SESSION HANDOFF — 2026-08-10 · WAVE 2B 51/51 PASS; READY TO COMMIT/PUSH ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Workspace: C:\Projects\celestial-frontier-openai-windows
## Owner/branch: OpenAI/Codex on openai/windows. Clean reset-baseline HEAD is
## bc26e800c7adca72805a832e753ace1a8f9837ba; Wave 1 is d005090f and Wave 2a is committed/pushed as
## 00e499cb130e906b5475d2d466c07e2d7a6d1282. Wave 2b is local/uncommitted, all 51 assigned rows
## have author-separated PASS, and the final integrated gates are green with frozen source SHAs unchanged.
## This checkpoint is READY TO COMMIT/PUSH. PR #7 is historical/merged; no reset PR, new 1,250-row tally,
## final certification, image-inclusive ZIP, release, deployment or version bump exists. Read next:
## PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md ·
## port/v2/reference/FULL_CATALOG_RESET_AUDIT_2026-08-09.md · ART_DIRECTION.md ·
## PROCEDURAL_CHARACTERISTICS.md · LINEAGE_AND_BREEDING.md · port/PROPORTION_ARC.md ·
## port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/README.md.

## ★ FROZEN FULL-RESET R1 BASELINE — COMPLETE REVIEW, NOT CERTIFICATION
## The clean bc26e8 capture covers all 1,250 identities in 181 families / 233 packets and was judged
## fresh at 440/300/132 plus labelled old/current and exact set+species contracts. Its immutable result
## is 516 PASS · 14 POLISH · 720 FAIL; literal certification eligibility is false. Per-set truth:
## fauna 151/6/474 · flora 125/0/207 · fungi 16/0/11 · microbes 12/2/6 · procedural 212/6/22
## (PASS/POLISH/FAIL). Authority: port/v2/apps/game/smoke/full-reset-results-2026-08-10-r1/results.json.
## Never add Wave 1, Wave 2a or Wave 2b scoped results to 516 or fabricate a catalogue tally.

## ★ ACCEPTED CHECKPOINTS BELOW THE FROZEN LEDGER
## Wave 1: committed/pushed d005090f; root 38 + fish 59 + tree 48 + fauna2 32 = 177/177 scoped PASS.
## Wave 2a: committed/pushed 00e499c; Mammal A 4 + worms/sessile 13 + S1–S3 15 = 32/32 scoped PASS.
## Vanilla Orchid r6 is separately continuity-PASS: 234/234 assets, exact pure portrait, five unique
## integrated stages, both browser orders and eleven negative controls. None is a new full-catalogue score.

## ★ WAVE 2B — EXACTLY 51/51 AUTHOR-SEPARATED PASS
## Mammal B: 25/25 PASS at 440/300/132. R2 failed closed at 19 PASS / 6 FAIL; bounded R3 repaired
## Brown Bear · Grizzly Bear · Bobcat · Lynx · Serval · Sand Cat, and the independent judge returned
## 6/6 PASS. Final sources: quadrupedoverrides.ts
## 288E54795D4EBD52EE131E4691AFED98AA7409BC033228FE0274B099B6FE7DAE and mammaloverrides.ts
## 2BB3541963F610B3D4504BEC423C982E1F11E902BD6200AD64E332B8F853CEAA. Sealed evidence:
## port/v2/apps/game/smoke/wave2-mammal-b-r3-sealed-evidence-2026-08-10. Manifest SHA-256
## B31B8BD7D84DDA513AF7714E1C0CBEDB6AB056D9FF99965193129160968C1C92; 600 PNG checks,
## 300/300 current/repeat surfaces exact, exact six changed and all 94 retained rows exact.
##
## Bird B1: 21/21 PASS. Initial independent review failed closed at 17 PASS / 4 FAIL; bounded R2
## repaired Secretary Bird · Rhea · Seriema · Hummingbird, and the independent judge returned 4/4 PASS.
## Final sources: faunaoverrides.ts 783DCCE7641E9EA826296922E9787CEE33857A6853CD96563E88F374F1C9BF10 and
## birdoverrides.ts B5DEBDCA726F48E8405F1D9F47D019E8472A2786825F35DCCFF1E147936494DF. Evidence:
## port/v2/apps/game/smoke/wave2b-bird-b1-r2-evidence-2026-08-10. Its 432 PNGs have zero
## hash/dimension/repeat errors; all 51 protected rows are exact and exactly four targets changed.
##
## Invert I: 5/5 PASS — Banana Slug · Chiton · Comb Jelly · Portuguese Man-of-War · Isopod.
## The first candidate failed closed on Banana Slug's four-tentacle/eye read at 132; a Banana-only
## refinement changed 3/3 target surfaces while the other four targets +20 controls stayed 72/72 exact.
## Final invertoverrides.ts SHA-256 is
## 9173B81703BE955B857ED5D3A39B09DD196967C63DE40E764D8F79EDB1832B1D. Evidence:
## C:\Users\Nick\.codex\visualizations\2026\08\09\019fe72d-20c7-73a0-bac7-d2c64d10673d\
## invert-wave2-isolated-topology-i\{final-current,final-repeat}; 150/150 PNGs are complete and exact,
## with matching aggregate SHA-256
## 0BDE0E3C01EF7E5FBEACFCA885D544BB02F73470B7E9B9A8854D9FBAA953671F.

## ★ WHOLE-FORM / FAIL-CLOSED LAW
## One named whole form owns silhouette, anatomy, attachments and material on one winning route. Code
## behind an early return is absent anatomy; another same-target body creates seams. Source completion,
## changed hashes and green author gates never replace an author-separated 440/300/132 verdict. A failed
## delivery-size cue reopens only that bounded target and freezes every accepted target/control.

## ★ FINAL INTEGRATED WAVE-2B GATES — GREEN; FIVE SOURCE SHAS UNCHANGED
## typecheck and artunused PASS; speccheck reports 417 declared / 0 unread / 0 unobservable;
## overridecheck reports 1,014/1,014 catalogue routes and 1,010/1,010 Earth routes;
## speciesaudit reports 1,250/1,250 portraits with 0 failures, duplicates or clipping; targeted/full
## diff checks PASS. This closes checkpoint readiness only, not the reset PR or full certification.

## ★ NEXT — COMPLETE IN THIS ORDER
## 1. Commit/push only the reviewed Wave-2b source/doc scope on openai/windows. No reset PR/merge is due.
## 2. Continue remaining frozen-r1 non-PASS rows in bounded owner/family waves with source frozen during
##    independent review; never carry a verdict across changed pixels.
## 3. Only after every row closes, run a new clean 1,250 collector, final hybrid evidence, literal
##    1,250/1,250 certification and dated image-inclusive ZIP. Until then, reset PR/release stay OPEN.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex — 00e499c is pushed/synchronized; Wave 2b is local/uncommitted and READY
## TO COMMIT/PUSH. No reset PR exists. Other side: Anthropic/Claude Code
## does not have Wave 2a/2b through develop, Nick does not need to open it now, and files must never be
## copied manually. After a future reviewed Codex PR merges into develop, Claude starts clean, fetches,
## and merges origin/develop into anthropic/windows under PARALLEL_GIT_PROTOCOL.md; Codex follows the
## same rule after develop moves. develop, main and the live site are unchanged; no release occurred.
