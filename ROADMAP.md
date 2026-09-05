# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## SESSION HANDOFF — 2026-09-05 · BATCH 4 · STEP 3b FAST GREEN

### Morning report

OpenAI/Codex on macOS, physical root /Users/nick/Projects/celestial-frontier-openai-mac,
branch openai/review-batch4-gameplay-20260905, matching origin tracking branch.
Base develop9ea01041dcdc711190bbf909ea8bb743cd993734; clean openai/mac stays84b6f22.
Step3b is implemented; full fast301files/3100tests/1skip passes.
Commit the implementation, then run clean-source Slice→small→large, stopping at first red.
Accept/push before 3c bounded Landing presentation extraction. The committed overnight instructions own the full ordered scope;
the overnight report and REDS JSON retain all exact evidence and historical failures.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; accepted source `b572dbf5840c4fee5cbfbfa175b14e1c07f1c3cd` | `419a00bd06971ed2f1e7f1367b73842702a099ea` pushed 2026-09-05 08:30:49 | Typecheck/artunused PASS; 286 files / 2,964 passed / 1 skipped; four workers | Slice PASS 368.569s; small/large phone PASS 15.471s / 15.551s, both zero findings/instrument failures |
| 2a accepted st-scan | Accepted source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`; documentation successor follows | `2ae776b17244d8207cb37ee45d9adf52eb99f21d` pushed 2026-09-05 08:48:02 | Typecheck/artunused PASS; 286 files / 2,980 passed / 1 skipped; four workers | Slice 369.674s; small/large phone 15.652s / 15.871s PASS; zero findings/instrument failures |
| 2b descent/wave-offs | Accepted source `879cad4e58b2d8d6cb924964f9a592e346e36dce`; documentation successor follows | `8546ad225d485541b377bef62db50c6c841256d6` pushed 2026-09-05 10:33:35 | Typecheck/artunused PASS; 290 files / 3,019 passed / 1 skipped; four workers | Slice 373.47s; small/large phone 15.576s / 16.338s PASS; zero findings/instrument failures |
| 2c 50-Paragon hunt | Accepted source `16cb949f2caa0398708f195f39c43822df336780`; documentation successor follows | `4647b21cca897f34095daa5b4f5ef12ab3f3ba5c` pushed 2026-09-05 11:58:07 UTC | Typecheck/artunused PASS; 292 files / 3,047 passed / 1 skipped; four workers | Slice 370.62s; small/large phone 15.875s / 16.029s PASS; zero findings/instrument failures |
| 2d exact-instance progression | Accepted source `a6c5b4ac8d6c02337dd0b45a6b1cf667c191b303`; documentation successor follows | `63685b8a6378d423db9fccf4211100403964bddd` pushed 2026-09-05 12:09:41 UTC | Typecheck/artunused PASS; 297 files / 3,071 passed / 1 skipped; four workers | Slice 371.504s; small/large phone 16.058s / 16.1s PASS; zero findings/instrument failures |
| 2e mature Atlas | Accepted source `890ab26a02a332327228e73eb7986e62b10e281b`; documentation successor follows | `f21feed5881b478bb2aeec4c1af7e93b076a870a` pushed 2026-09-05 12:44:13 UTC | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | Slice 375.248s; small/large phone 16.533s / 15.995s PASS; zero findings/instrument failures |
| 3a authority controls | Accepted source `f21feed5881b478bb2aeec4c1af7e93b076a870a`; documentation successor follows | `07965ee86256929529a9f6207922eef97bd5e5a9` pushed 2026-09-05 12:45:59 UTC | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | No app-source changes; browser not repeated at this checkpoint |
| 3b same-owner lists | Implemented; signed source follows | Acceptance/push pending | Typecheck/artunused PASS; 301 files / 3100 passed / 1 skipped | Pending clean-source Slice and both phones |
| 3c bounded extraction | Not started; narrow landing-card presentation owner identified | Pending ordered checkpoint | No code extraction claimed | Not run |
| 3d phone analysis | Existing accepted2a evidence analyzed; fresh profile still pending | Pending final clean-source measurement | Interim measured diagnostics only; limits below | Existing two-row results only; no new run |

### Decisions made unattended and current implementation

# Stretch 3b — one production research-order owner

Prepared patch: `/private/tmp/cf-step3b-research-alias/step3b.patch`.
SHA256: `515cc6b4c36a02811fe705a5e2e335d0ba8b806ca5ea138909a8c52ea6ef0765`.
Applied at the ordered checkpoint after primary acceptance. Exact execution evidence is recorded with this checkpoint.

`port/v2/packages/domain/opportunity/src/state.ts:33–41` remains the canonical frozen six-ID tuple. `engineering-panel.ts` imports that public `RESEARCH_IDS` through the app's existing dependency and exports `ENGINEERING_RESEARCH_ORDER` as its alias. The public export name and its derived `EngineeringResearchRowId` union remain unchanged. Only the duplicate production tuple is removed: no runtime action, recipe/research content, package/lockfile or browser contract changes.

Independent expectations remain: the panel test authors six literal rows at `port/v2/tests/engineering-panel.test.ts:141–171`, checks their rendered order at `:475–484`, and rejects a missing row and swapped order at `:1237–1247`. `port/v2/tools/engineering-browser-contract.mjs:3–13` explicitly owns its separate six literal IDs; `:958–971` binds the observed research/action inventory to that independent list. Neither oracle is rebuilt from the aliased producer tuple. Thus a missing producer field cannot disappear from both sides through this deduplication.

Current bulletin79 outcomes; SHA256351c1279d7b36fa795a414f4d56a6237d57c0575675b80f69fcbc5471c6ae042.
Current Compendium producer61021aad1dc3f48f37449d49e237ace6bc8f7fbfd4f467d0f43d356d0046fa1a.
Measurement4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12,
ruler, ceilings and samples unchanged. SceneMemory native heap stays quarantined.
Full local Vitest uses four workers with unchanged selection/timeouts.

### Parked scope and paired handoff

Weekly lifecycle/joins, Forge Training, living portrait preview and unrelated bulk WIP stay
parked. No care/bond/missions, random loot/affix/socket/vendor tables, achievement quantities,
conquest-imbue coexistence or extra Guardian cache. Audio-source backup is outside this batch.
No legacy player-import door; v1 codec, evidence importBlob and planned Glass ledgers remain.
Combined Arc4.5, separate Arc5.5 HUMAN and real-device Gate C remain open.
Protected portraits, CI/policy and release are untouched. Prior reds/signing outage remain
history; no unchanged-source browser retry. Edge phones are targeted diagnostics only.

Codex completes this acceptance/push and continues the ordered scope. Claude reviews pushed
checkpoints later; Nick need not open another app now. Proposed PR base develop, source
openai/review-batch4-gameplay-20260905; final title/body at completion. BudgetUNFROZEN/PUBLIC,
private fallback3,000, zero hosted attempts authorized. Branch pushes trigger no workflow.
No PR, label, hosted attempt, merge, purchase or release is authorized.
