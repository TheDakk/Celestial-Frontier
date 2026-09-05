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

## SESSION HANDOFF — 2026-09-05 · UNATTENDED BATCH 4 · CHECKPOINT 2e GREEN

### Morning report

OpenAI/Codex on macOS, physical checkout `/Users/nick/Projects/celestial-frontier-openai-mac`,
branch `openai/review-batch4-gameplay-20260905`, matching origin tracking branch.
Base develop `9ea01041dcdc711190bbf909ea8bb743cd993734`; untouched clean `openai/mac` stays `84b6f22`.
Signed core `5377069` joined through real merge `e77e5e0`; no signed history rewritten.
Current accepted implementation source `890ab26a02a332327228e73eb7986e62b10e281b`. This documentation successor is being
committed/pushed; the next step records its actual pushed SHA/time. Full exact evidence and every
red remain in `audits/BATCH4_OVERNIGHT_REPORT_20260905.md` and the sibling REDS JSON.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; accepted source `b572dbf5840c4fee5cbfbfa175b14e1c07f1c3cd` | `419a00bd06971ed2f1e7f1367b73842702a099ea` pushed 2026-09-05 08:30:49 | Typecheck/artunused PASS; 286 files / 2,964 passed / 1 skipped; four workers | Slice PASS 368.569s; small/large phone PASS 15.471s / 15.551s, both zero findings/instrument failures |
| 2a accepted st-scan | Accepted source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`; documentation successor follows | `2ae776b17244d8207cb37ee45d9adf52eb99f21d` pushed 2026-09-05 08:48:02 | Typecheck/artunused PASS; 286 files / 2,980 passed / 1 skipped; four workers | Slice 369.674s; small/large phone 15.652s / 15.871s PASS; zero findings/instrument failures |
| 2b descent/wave-offs | Accepted source `879cad4e58b2d8d6cb924964f9a592e346e36dce`; documentation successor follows | `8546ad225d485541b377bef62db50c6c841256d6` pushed 2026-09-05 10:33:35 | Typecheck/artunused PASS; 290 files / 3,019 passed / 1 skipped; four workers | Slice 373.47s; small/large phone 15.576s / 16.338s PASS; zero findings/instrument failures |
| 2c 50-Paragon hunt | Accepted source `16cb949f2caa0398708f195f39c43822df336780`; documentation successor follows | `4647b21cca897f34095daa5b4f5ef12ab3f3ba5c` pushed 2026-09-05 11:58:07 UTC | Typecheck/artunused PASS; 292 files / 3,047 passed / 1 skipped; four workers | Slice 370.62s; small/large phone 15.875s / 16.029s PASS; zero findings/instrument failures |
| 2d exact-instance progression | Accepted source `a6c5b4ac8d6c02337dd0b45a6b1cf667c191b303`; documentation successor follows | `63685b8a6378d423db9fccf4211100403964bddd` pushed 2026-09-05 12:09:41 UTC | Typecheck/artunused PASS; 297 files / 3,071 passed / 1 skipped; four workers | Slice 371.504s; small/large phone 16.058s / 16.1s PASS; zero findings/instrument failures |
| 2e mature Atlas | Accepted source `890ab26a02a332327228e73eb7986e62b10e281b`; documentation successor follows | Push follows; actual SHA/time recorded by next checkpoint | Typecheck/artunused PASS; 301 files / 3,100 passed / 1 skipped; four workers | Slice 375.248s; small/large phone 16.533s / 15.995s PASS; zero findings/instrument failures |
| 3a authority controls | Already implemented in signed core and verified by all full suites | Pending ordered stretch checkpoint | Malformed/shallow mint, public clone refusal and three WorldConfig controls present | No UI change; no extra browser run |
| 3b same-owner lists | One bounded Research-ID alias patch prepared; not integrated | Pending ordered checkpoint | Independently authored browser lists retained | Not run |
| 3c bounded extraction | Not started; narrow landing-card presentation owner identified | Pending ordered checkpoint | No code extraction claimed | Not run |
| 3d phone analysis | Existing accepted2a evidence analyzed; fresh profile still pending | Pending final clean-source measurement | Interim measured diagnostics only; limits below | Existing two-row results only; no new run |

### Latest completed outcome and decisions made unattended

Atlas now offers List and Chart views, the authored All/Favorites/Visited/Conquered/Life filters, canonical coordinates, Home, exact-row Remove and a single eight-second Undo. Undo is bound to its deletion receipt and route sidecar: an originally absent route stays absent, while a formerly present route must still match before restoration. Chart clusters open the existing List actions for their exact members and return focus to their Chart origin or owning Close. Existing travel, hyperlane, motion, speed and Favorite owners remain authoritative. No companion, reward, progression, import-door or protected-portrait behavior was added. Guide, Training and all eight current references agree; the draft remains 79 outcomes and all rendered hash pins move together. Only the current Compendium producer is refreshed; measurement authority, ruler, ceilings and samples remain unchanged. After this checkpoint is accepted, all five primary items are complete and the separately ordered stretch list follows.
The renderer preserves the existing noninteractive DIV row, native data-sel/data-aid and count identifiers alongside its new controls. Source-owner tests now read the correct renderer; Travel and Home negative controls bind exact precommit/publication spans. The real refill test executes the shipped projection, renderer and availability owner. All prior expectations remain.

The first signed Atlas browser run also caught a missing visible explanation on unavailable routes. The existing Route unavailable message is restored in List/cluster rows and unmapped Chart destinations; disabled actions and byte-stable refusal behavior are preserved. The existing renderer test covers both presentations.

- Nick's committed `audits/BATCH4_OVERNIGHT_INSTRUCTIONS_20260905.md` owns scope and order:
  checkpoint/push after every completed step and approximately two hours; no PR/hosted attempt.
- Current draft: 79 outcomes; rendered ordered-li SHA-256 `351c1279d7b36fa795a414f4d56a6237d57c0575675b80f69fcbc5471c6ae042`.
- Current Compendium producer: `dc31cbe1f60ebd435576d929936d694b3fa4f36a0fa307d0ad8c0ff5269f9d18`. Measurement authority
  `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`, ruler, ceilings and
  samples unchanged. SceneMemory native heap remains quarantined from develop.
- Local Vitest uses four workers after recorded CPU contention; full selection and original
  timeouts remain. Existing strict consumers/copy controls follow the approved product;
  no new collector, ruler, timeout, workflow or policy change.
- Fresh v2 has no legacy player import door; v1.8.9 codec, evidence-only importBlob and planned
  Glass ledgers remain. Canonical identity and one lease-fenced receipt/CAS govern every write.

### Blocked / reverted and parked work

Core's eight browser reds were corrected on new commits and retained verbatim; Step2a's missing
import and five stale copy checks were corrected before its green browser run. No unchanged
source browser retry. See the report for all subsequent exact failures and dispositions.
No product step has been reverted unless explicitly recorded in the table/report.
Remaining `cf1b9a7` WIP is parked until individually completed. Weekly lifecycle/joins, Forge
Training, living portrait preview and unrelated bulk copy remain excluded. No companion
care/bond/missions, random loot/affix/socket/vendor tables, achievement quantities, conquest-imbue
coexistence or extra Guardian first-victory cache. Audio-source backup destination is outside
this batch. Protected portraits, CI/policy, main and the live release remain untouched.
Combined post-Arc-5 Arc4.5 review, separate Arc5.5 HUMAN combat review and Gate C real-device v2
persistence remain open. Phone checks here are local Edge targeted diagnostics, not full matrix
certification or Chrome named-verifier proof; actual source/report IDs remain in the full report.

### Paired handoff and next action

Codex pushes this completed checkpoint, then proceeds to **3a existing narrow authority controls** in the authorized order.
Claude reads the pushed branch through Git for morning review; no copying or integration before
Nick's exact hosted authorization. Nick need not open another app overnight. Proposed PR base
`develop`, source `openai/review-batch4-gameplay-20260905`; final title/body follows at completion.
Budget UNFROZEN, PUBLIC, private fallback 3,000, zero hosted attempts authorized. Branch pushes
trigger no workflow. Established SSH origin/account checks passed as `TheDakk`; no auth change.
