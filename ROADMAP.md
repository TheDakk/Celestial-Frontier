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

## ▶▶▶ SESSION HANDOFF — as of 2026-08-09. ★ GOLD PASS 7 + FINAL PACKAGE COMPLETE
## AND PUSHED; DRAFT PR #7 IS OPEN FOR NICK REVIEW. ◀◀◀

## ★ COLD START — READ THIS BLOCK, THEN THE LINKED REFERENCES
## Current workspace: C:\Projects\celestial-frontier-openai-windows
## Current owner/branch: OpenAI/Codex on openai/windows. HEAD and origin/develop were both
## e16da09 when this batch began. The complete GP7 implementation is commit a9345c1 and is pushed
## to origin/openai/windows; this live handoff records that published branch state.
## Integration path: openai/windows → reviewed draft PR → develop. Never commit directly to
## develop or main; no release, main merge, live-site deploy or version bump is authorized here.
## The v1 single-file game remains the production reference. This batch changes the deterministic
## port/v2 Canvas species-art catalogue, its review instruments, evidence and handoff documents.
## Read next: PROCESS_LAWS.md · PARALLEL_GIT_PROTOCOL.md · ART_DIRECTION.md ·
## port/HANDOFF_NEXT_SESSION.md · port/v2/DEVIATIONS.md · port/v2/reference/GOLD_PASS_7.md.

## ★ BOTH NICK REVIEWS ARE ACCOUNTED FOR — NOT JUST THE EARLIER HANDOFF
## 1. port/v2/reference/NICK_GOLD_AUDIT_2026-08-08.md is the complete 1,250-item audit:
##    381 GOLD / 810 POLISH / 59 FIX. SHA-256:
##    382A9EA1618B86E976AA9180A6BD743851D3F5F227744CCDDB87692283E4C865.
## 2. port/v2/reference/NICK_PATCH_REVIEW_2026-08-08.md is the fixed-species patch review:
##    15 PASS / 25 PASS-WITH-POLISH / 19 STILL-FIX / 1 regression before the final refinements.
##    Nick's Downloads copy, Celestial_Frontier_2026-08-08_Fixed_Species_Patch_Review.md,
##    is byte-identical to the committed reference. Both SHA-256 values are:
##    4C533151EFEC55B5FC741CD771E34CA0E32919F981E76D5C4BB390D4F4B72460.
## These two documents, the round-3 carry record and the actual current pixels jointly define GP7.

## ★ COMPLETE CATALOGUE COVERAGE — ONE RECORD FOR EVERY ASSET
## The catalogue is 1,250 assets: 631 Earth fauna · 332 Earth flora · 27 Earth fungi ·
## 20 Earth microbes · 240 procedural organisms.
## GP7 freshly judged every changed asset: 503 current-pixel verdicts across 95 drift strips.
## The 747 byte-unchanged assets retain their exact prior one-by-one round-3/Nick verdicts.
## A separate 62-item family-matched control set was judged across 39 strips. Total judge packet:
## 134 pre-rendered strips. No asset was inferred from a family or omitted from the ledger.
## Final strict fresh-drift result: 301 FAIL / 37 POLISH / 165 PASS = 503 exact joins.
## Control result: 47 FAIL / 4 POLISH / 11 PASS = 62 exact joins.
## The strict judge demoted 21/32 previously acceptable controls (66%) versus 62/160 previously
## acceptable drift assets (39%), a 27-point ruler effect. Treat the strict bands as a demanding
## defect-finding lens, not as a calibrated continuation of Nick's GOLD/POLISH/FIX ruler.
## ⚠ MIXED-RULER CAVEAT: reference/goldpass7-results.json merges the 503 strict verdicts with
## 747 carried verdicts and therefore reports 618 FAIL / 415 POLISH / 217 PASS. That 1,250 total
## is useful for per-asset traceability only; it is NOT an honest single-ruler catalogue score.
## Never quote it as regression or completion percentage without the 62-control calibration.

## ★ THE PROCEDURAL RESULT WAS CORRECTED AFTER NEGATIVE-CONTROLLING THE INSTRUMENT
## Drift strips 11–15 originally rendered blank red cells and produced a bogus 57/57 FAIL.
## Cause: baseline names (fungi-h0-s1), art-lock names (f0·1#121) and renderer names
## (proc:fungi:h0:s1) were three incompatible namespaces; the merge also silently dropped rows.
## The checked 240-row procedural identity bridge now proves a bijection, render/merge fail closed
## on an unmapped identity or unpainted cell, and bundle freshness includes the consuming app source.
## Re-rendered current pixels were independently re-judged: the affected 57 are 57/57 PASS.
## The other 183 procedural assets were byte-unchanged and carry their prior verdicts, so all 240
## procedural organisms are covered. Do not resurrect the blank-frame findings.

## ★ FINAL TARGETED FIX OUTCOMES — NO TARGET REMAINS IN THE STRICT FAIL BAND
## PASS: Arctic Blueberry · Bearberry · Crowberry · Cranberry · Giant Kelp · Huckleberry ·
## Harvestman · Kelp · Mahi-Mahi · Monkfish · Aardvark · Cat · Clouded Leopard.
## POLISH: Lingonberry · Mountain Cranberry · Harpy Eagle · Bobcat · Caracal · Fishing Cat ·
## Lynx · Ocelot. These now carry their requested identity cues but retain the named finish work.
## The fixes include distinct berry growth habits, real kelp stipes/blades/holdfasts, a fused-body
## long-legged Harvestman, Mahi-Mahi/Monkfish silhouettes, Harpy Eagle crest/chest identity,
## mammal tails/feline faces/ruffs/rosettes, and six dead or shadowed flora routes removed.
## All 15 former HARD near-duplicate pairs were cleared. Art-lock confusable pairs under 1.5
## improved 686 → 507; colour-blind SHAPE pairs under 2 improved 92 → 73. The non-gated WATCH
## population under 2.5 rose 3,327 → 5,196 and remains future catalogue-polish work, not hidden.

## ★ FINAL AUTOMATED CERTIFICATION — GREEN ON THE FROZEN SOURCE
## npm test: 23/23 files; 234 passed, 1 skipped. TypeScript: PASS.
## speccheck: 301 declared fields · 0 unread · 0 inert; self-test 5/5.
## overridecheck: 1,014/1,014 routes live · 0 dead; controls baseline+A–F+restore PASS.
## coveragegap: 1,010/1,010 Earth species · 0 remaining.
## artaudit: 23 sources · 0 findings. Procedural bridge, strip and GP7 collector self-tests: PASS.
## speciesaudit: 1,250/1,250 painted · 0 failures · 0 duplicate pairs · 0 clipped.
## artlock: exactly 503/1,250 drift — flora 213 · fauna 93 · quadruped 75 · procedural 57
## advisory · species 29 · invert 18 · bird 18; 0 undeclared hard drift; 0 HARD pairs.
## artbattery: 6/6 PASS. The only diagnostic is Vite's existing >500 kB chunk warning.

## ★ REVIEW EXPORTS AND PACKAGE STATE
## The frozen source was exported in full: 1,250 native 440×440 PNG portraits in five set ZIPs
## and 196 labelled family contact sheets across 152 families. Paths:
## port/v2/apps/game/smoke/species-fullsize/ and
## port/v2/apps/game/smoke/catalogue-review/.
## The fail-closed package gate validated exact per-set counts, 440×440 dimensions, SHA-256
## manifests, identity-to-filename joins, 1,250 unique rows and every required review record.
## Final master artifact (305,291,135 bytes; SHA-256
## 47B730C0323241F8E171DC3A96D4EFD5C67FA0C3CA12333CA17EBE10540D398F):
## port/v2/apps/game/smoke/Celestial_Frontier_GP7_Complete_Catalogue_Review_2026-08-09.zip.
## Documentation, packaging, commit and branch push are complete. Draft PR #7 is open.

## ★ NEXT — COMPLETE IN THIS ORDER
## 1. Nick reviews draft PR #7 described below. Do not deploy.
## 2. Nick reviews the finished ZIP and records only named PASS / POLISH / FIX follow-ups.
## 3. Merge the reviewed PR to develop only after approval; never merge it directly to main.
## 4. Re-run proportional gates only if source changes after the frozen certification above.

## ★ NEXT HUMAN REVIEW — PACKAGE READY
## Nick opens the master ZIP and reviews catalogue-review first: all 196 labelled sheets, family by
## family, with the final target sheets checked first (kelps, seven berry habits, Harvestman,
## Mahi-Mahi/Monkfish/Harpy Eagle, Aardvark and the seven feline refinements). The five full-size
## set directories provide the 1,250 individual 440×440 portraits for any uncertain thumbnail.
## Record feedback by exact species name and PASS / POLISH / FIX. Do not start another global art
## sweep: any follow-up is a named, bounded target list protected by artlock and matched controls.

## ★ PARALLEL GIT HANDOFF — EXACT SAFE SYNCHRONIZATION
## Current side: OpenAI/Codex — GP7 is certified, packaged and pushed on origin/openai/windows.
## Draft PR #7 is open: https://github.com/TheDakk/Celestial-Frontier/pull/7.
## GitHub step now: Nick reviews PR #7 and merges it to develop only when approved. Pushing and
## opening the PR did not update develop.
## PR base: develop
## PR source: openai/windows
## Copy-ready title: GP7: complete Earth catalogue art pass and review package
## Copy-ready description: Completes GP7 across all 1,250 catalogue assets using 503 fresh drift
## verdicts, 747 carried per-asset verdicts and 62 controls. Incorporates Nick's gold audit and
## fixed-species patch review, corrects the procedural review bridge, resolves targeted fauna/flora
## defects, and adds deterministic export/package verification. Validation: Vitest 234 pass/1 skip;
## TypeScript; spec/override/coverage/art audits; speciesaudit 1,250/1,250; artlock 503 declared or
## advisory drift with 0 HARD pairs; artbattery 6/6. After merge, both agent branches can import the
## work from develop. No release or deployment is included.
## Other side: Anthropic/Claude Code does NOT have this batch yet and Nick does not need to open that
## application now. It may continue unrelated work, but must not expect GP7 or copy files manually.
## Only after the PR is merged into develop, at Claude Code's next coding batch: first make sure the
## anthropic/windows worktree is clean; then fetch origin and merge origin/develop into
## anthropic/windows under PARALLEL_GIT_PROTOCOL.md. If it is not clean, finish or commit its work
## before pulling/switching/merging. OpenAI/Codex follows the same clean-start merge procedure at its
## next batch after develop moves. Release status: develop/main/live site are unchanged; no release
## or deployment has been performed.
