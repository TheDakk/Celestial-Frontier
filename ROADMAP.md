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

## SESSION HANDOFF — 2026-09-05 · UNATTENDED BATCH 4 · CHECKPOINT 2a GREEN

### Morning report

OpenAI/Codex on macOS, physical checkout `/Users/nick/Projects/celestial-frontier-openai-mac`,
branch `openai/review-batch4-gameplay-20260905`, matching origin tracking branch.
Base develop `9ea01041dcdc711190bbf909ea8bb743cd993734`; untouched clean `openai/mac` stays `84b6f22`.
Signed core `5377069` joined through real merge `e77e5e0`; no signed history rewritten.
Current accepted implementation source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`. This documentation successor is being
committed/pushed; the next step records its actual pushed SHA/time. Full exact evidence and every
red remain in `audits/BATCH4_OVERNIGHT_REPORT_20260905.md` and the sibling REDS JSON.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; accepted source `b572dbf5840c4fee5cbfbfa175b14e1c07f1c3cd` | `419a00bd06971ed2f1e7f1367b73842702a099ea` pushed 2026-09-05 08:30:49 | Typecheck/artunused PASS; 286 files / 2,964 passed / 1 skipped; four workers | Slice PASS 368.569s; small/large phone PASS 15.471s / 15.551s, both zero findings/instrument failures |
| 2a accepted st-scan | Accepted source `4a82f161da2a7b3c4a029421d8a16c23fc62955d`; documentation successor follows | `2ae776b17244d8207cb37ee45d9adf52eb99f21d` pushed 2026-09-05 08:48:02 | Typecheck/artunused PASS; 286 files / 2,980 passed / 1 skipped; four workers | Slice 369.674s; small/large phone 15.652s / 15.871s PASS; zero findings/instrument failures |
| 2b descent/wave-offs | Implemented; commit/browser next | — | Typecheck/artunused PASS; 290 files / 3,012 passed / 1 skipped | Pending clean-source run |
| 2c 50-Paragon hunt | Pending | — | — | — |
| 2d exact-instance progression | Pending | — | — | — |
| 2e mature Atlas | Pending | — | — | — |
| 3a authority controls | In signed core | Pending | Included in full Vitest | No UI change |
| 3b same-owner lists | Pending | — | — | — |
| 3c bounded extraction | Pending | — | — | — |
| 3d phone analysis | Pending | — | — | — |

### Latest completed outcome and decisions made unattended

The accepted st-scan Starter Charter now completes only from a later explicit Discover Life,
settling its authored 15 current/lifetime Stardust and one Earpiece in that Bioscan's single
F4 receipt/CAS. Earlier Survey, Capture and landfall never substitute. Existing inventory
publication, empty-slot equip, capacity, stale-tab and failed-write boundaries remain exact.
Guide, Training, all eight current overlays and six current-reference statements agree;
dated historical carriers remain verbatim. Weekly lifecycle stays parked. Two source-review
Paragon validation gaps and fractional-XP progression compatibility are prepared as bounded
later-step fixes; they are not integrated or claimed tested at this checkpoint.

- Nick's committed `audits/BATCH4_OVERNIGHT_INSTRUCTIONS_20260905.md` owns scope and order:
  checkpoint/push after every completed step and approximately two hours; no PR/hosted attempt.
- Current draft: 77 outcomes; rendered ordered-li SHA-256 `8f7a40185fb2a89c1fe055b0109623f77d087cdc4248ee00fe20398fe3456c4f`.
- Current Compendium producer: `2df5f7497cb3b90e937bb5e3199e0346607b7dccfba4635f5a57e74e46e22a82`. Measurement authority
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

Codex pushes this completed checkpoint, then proceeds to **2b — deterministic descent and canonical wave-offs** in the authorized order.
Claude reads the pushed branch through Git for morning review; no copying or integration before
Nick's exact hosted authorization. Nick need not open another app overnight. Proposed PR base
`develop`, source `openai/review-batch4-gameplay-20260905`; final title/body follows at completion.
Budget UNFROZEN, PUBLIC, private fallback 3,000, zero hosted attempts authorized. Branch pushes
trigger no workflow. Established SSH origin/account checks passed as `TheDakk`; no auth change.

Step2a checkpoint was pushed08:48:02UTC as`2ae776b`; Step2b is now implemented and awaiting
fast/browser acceptance. Authored static-weather descent and canonical learning(+20,cap5) apply;
legacy seed-only counts bind once on their first matching canonical encounter because their
original address is unknowable. Fresh games start empty. This preserves stored learning without
inventing history; full reasoning, exact Pertar facts and current78-bullet hash are in the report.

Step 2b final fast PASS: 290 files / 3,012 tests / 1 skipped; typecheck/artunused pass.
Unused-code and existing-owner reds were corrected and preserved in the report. Product
source is ready for its clean committed browser sequence. No 2c or later work is integrated.
