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

## SESSION HANDOFF — 2026-09-05 · BATCH 4 · STEP 2e FAST GREEN

### Morning report

OpenAI/Codex on macOS, physical root /Users/nick/Projects/celestial-frontier-openai-mac,
branch openai/review-batch4-gameplay-20260905, matching origin tracking branch.
Base develop9ea01041dcdc711190bbf909ea8bb743cd993734; clean openai/mac stays84b6f22.
Step2e is implemented; full fast301files/3100tests/1skip passes.
Commit the implementation, then run clean-source Slice→small→large, stopping at first red.
Accept/push before 3a narrow authority controls, then the remaining stretch list. The committed overnight instructions own the full ordered scope;
the overnight report and REDS JSON retain all exact evidence and historical failures.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; accepted source `b572dbf5840c4fee5cbfbfa175b14e1c07f1c3cd` | `419a00bd06971ed2f1e7f1367b73842702a099ea` pushed 2026-09-05 08:30:49 | Typecheck/artunused PASS; 286 files / 2,964 passed / 1 skipped; four workers | Slice PASS 368.569s; small/large phone PASS 15.471s / 15.551s, both zero findings/instrument failures |
| 2a accepted st-scan | Accepted source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`; documentation successor follows | `2ae776b17244d8207cb37ee45d9adf52eb99f21d` pushed 2026-09-05 08:48:02 | Typecheck/artunused PASS; 286 files / 2,980 passed / 1 skipped; four workers | Slice 369.674s; small/large phone 15.652s / 15.871s PASS; zero findings/instrument failures |
| 2b descent/wave-offs | Accepted source `879cad4e58b2d8d6cb924964f9a592e346e36dce`; documentation successor follows | `8546ad225d485541b377bef62db50c6c841256d6` pushed 2026-09-05 10:33:35 | Typecheck/artunused PASS; 290 files / 3,019 passed / 1 skipped; four workers | Slice 373.47s; small/large phone 15.576s / 16.338s PASS; zero findings/instrument failures |
| 2c 50-Paragon hunt | Accepted source `16cb949f2caa0398708f195f39c43822df336780`; documentation successor follows | `4647b21cca897f34095daa5b4f5ef12ab3f3ba5c` pushed 2026-09-05 11:58:07 UTC | Typecheck/artunused PASS; 292 files / 3,047 passed / 1 skipped; four workers | Slice 370.62s; small/large phone 15.875s / 16.029s PASS; zero findings/instrument failures |
| 2d exact-instance progression | Accepted source `a6c5b4ac8d6c02337dd0b45a6b1cf667c191b303`; documentation successor follows | `63685b8a6378d423db9fccf4211100403964bddd` pushed 2026-09-05 12:09:41 UTC | Typecheck/artunused PASS; 297 files / 3,071 passed / 1 skipped; four workers | Slice 371.504s; small/large phone 16.058s / 16.1s PASS; zero findings/instrument failures |
| 2e mature Atlas | Implemented; signed source follows | Acceptance/push pending | Typecheck/artunused PASS; 301 files / 3100 passed / 1 skipped | Pending clean-source Slice and both phones |
| 3a authority controls | Already implemented in signed core and verified by all full suites | Pending ordered stretch checkpoint | Malformed/shallow mint, public clone refusal and three WorldConfig controls present | No UI change; no extra browser run |
| 3b same-owner lists | One bounded Research-ID alias patch prepared; not integrated | Pending ordered checkpoint | Independently authored browser lists retained | Not run |
| 3c bounded extraction | Not started; narrow landing-card presentation owner identified | Pending ordered checkpoint | No code extraction claimed | Not run |
| 3d phone analysis | Existing accepted2a evidence analyzed; fresh profile still pending | Pending final clean-source measurement | Interim measured diagnostics only; limits below | Existing two-row results only; no new run |

### Decisions made unattended and current implementation

Atlas now offers List and Chart views, the authored All/Favorites/Visited/Conquered/Life filters, canonical coordinates, Home, exact-row Remove and a single eight-second Undo. Undo is bound to its deletion receipt and route sidecar: an originally absent route stays absent, while a formerly present route must still match before restoration. Chart clusters open the existing List actions for their exact members and return focus to their Chart origin or owning Close. Existing travel, hyperlane, motion, speed and Favorite owners remain authoritative. No companion, reward, progression, import-door or protected-portrait behavior was added. Guide, Training and all eight current references agree; the draft remains 79 outcomes and all rendered hash pins move together. Only the current Compendium producer is refreshed; measurement authority, ruler, ceilings and samples remain unchanged. After this checkpoint is accepted, all five primary items are complete and the separately ordered stretch list follows.
The renderer preserves the existing noninteractive DIV row, native data-sel/data-aid and count identifiers alongside its new controls. Source-owner tests now read the correct renderer; Travel and Home negative controls bind exact precommit/publication spans. The real refill test executes the shipped projection, renderer and availability owner. All prior expectations remain.

The first signed Atlas browser run also caught a missing visible explanation on unavailable routes. The existing Route unavailable message is restored in List/cluster rows and unmapped Chart destinations; disabled actions and byte-stable refusal behavior are preserved. The existing renderer test covers both presentations.

Current bulletin79 outcomes; SHA256351c1279d7b36fa795a414f4d56a6237d57c0575675b80f69fcbc5471c6ae042.
Current Compendium producerdc31cbe1f60ebd435576d929936d694b3fa4f36a0fa307d0ad8c0ff5269f9d18.
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
