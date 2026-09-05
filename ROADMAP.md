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

## SESSION HANDOFF — 2026-09-05 · UNATTENDED BATCH 4 · CHECKPOINT 1 IN PROGRESS

### Morning report

Base develop: `9ea01041dcdc711190bbf909ea8bb743cd993734`. OpenAI/Codex on macOS in
`/Users/nick/Projects/celestial-frontier-openai-mac`, temporarily on Nick's explicitly named
`openai/review-batch4-gameplay-20260905`. The clean `openai/mac` tip remains `84b6f22`.
Signed Batch 4 core `53770697f6613da3ba469868dae24cf0edc3f58d` is being joined by a real merge;
WIP `cf1b9a7843200ecc281c5113b4139909dc0e3a29` stays parked except individually completed steps.

| Step | State | Commit / push / gates |
| --- | --- | --- |
| 1 — core integration | First Slice red; bounded expectation repair | Merge `e77e5e0`; fast green 286 / 2,951 / 1; first living-world setup expected an obsolete write |
| 2a — accepted st-scan | Pending | Recover only completed authored scope |
| 2b — descent/wave-offs | Pending | Canonical-address deterministic outcome |
| 2c — 50-Paragon hunt | Pending | Existing authored table only |
| 2d — exact-instance progression | Pending | Existing XP/level owners |
| 2e — mature Atlas | Pending | Existing route/record owners |
| 3a — narrow domain assertions | Present in signed core; verify | No new suite |
| 3b — shared list ownership | Pending | Preserve independent test expectations |
| 3c — bounded main extraction | Pending | Only step-2 code |
| 3d — phone analytical pass | Pending | Measure only, no performance changes |

### Decisions made unattended

- Nick's overnight checkpoint protocol supersedes the older no-intermediate-push campaign rule:
  each completed step runs its fast gates, applicable browser gates, commits and pushes this
  exact bounded review branch. No hosted run or PR follows a branch push.
- Fresh-start develop owns import-door removal, its tests, planned Glass ledgers and the initial
  77-bullet count. Core outcome copy may change the rendered bullet hash; later added outcomes
  change count and every pin together. No stale 78-count or save-export prerequisite is carried.
- The standalone authority printer can report exit 2 for stale/quarantined SceneMemory and the
  deliberately not-yet-updated Compendium producer. Its observed Compendium producer is copied
  only after proving measurement inputs unchanged. No ruler, ceilings or samples change.

### Blocked / reverted

Checkpoint 1 first fast run: typecheck PASS; artunused stopped before Vitest with
`tests/explorer-meal-action.test.ts(26,3): error TS6133: 'SCENE_ENGINEERING_ADDRESS_RESOLVER' is declared but its value is never read.`
The unused import was removed from the recovered test; no assertion/product behavior changed.
Corrected fast run follows. Original output is retained in the checkpoint evidence. No product
step has required reversal. Temporary bullet-hash extraction also refused a stale syntax delimiter
before producing output; the corrected read-only extraction uses TypeScript stripping and the
actual rendered li text. An initial printer command used the root directory and was corrected to
port/v2; these command setup errors are not product gate results.

The corrected first full Vitest run stopped at **13 failed / 273 passed files; 21 failed /
2,930 passed / 1 skipped tests**. Fixed inventories, literal copy assertions and mutation spans
still described the pre-core source. Repairs preserve independent expected values and scope each
mutant to its actual action owner. The next full run reduced this to **1 failed / 285 passed
files; 3 failed / 2,948 passed / 1 skipped tests**, all Guide/release expectations after restoring
existing Pureforged and Feed chronology detail. A Charter contradiction regex mistook
“counterfeits” for “counts”; it now requires a word boundary. A release Scout contradiction
mistook “grants no Scout XP” for a positive award; its exact verb/negative boundary is explicit.
The historical Pureforged positive control and item-upgrade/vendor negative controls remain.
Original diagnostics and final results are indexed in the overnight report. No product step
has been reversed or counted complete on red evidence.

Browser-free copy review then found Glass's shortened Feed expectation, a missing reverse-passive
Feed contradiction, omitted implemented Atlas travel detail, and two case-sensitive Charter
sentence carriers. These are aligned to the existing outcome and removal controls. That final
Guide sentence restoration exposed three additional stale `guide-release` expectations (same
1-file / 3-test red count); only those expectations are being aligned. The previous full source
run passed 286 files / 2,951 tests / 1 skipped. It is retained as an intermediate result, not
substituted for the final corrected source. Root validate passed 1,010 renders and all 50 original
fingerprints. The current draft remains 77; no new player-visible outcome was invented.

Final corrected core source: typecheck PASS, artunused PASS, Vitest **286 files / 2,951 passed /
1 skipped** (38.13s). Root validate PASS (1,010 renders and all 50 fingerprints). The real
merge is now committed for unchanged-source local browser gates; checkpoint 1 is not complete
until those gates pass and the branch is pushed.

First clean-source Slice on merge `e77e5e0` stopped after 33.262s:
`POINTER EARTH SURVEY: Survey did not reach its exact same-document fixed point before the dependent action`.
Its setup expected a discovery commit from living-world card inspection, which is deliberately
read-only in the approved core. Mercury/nonliving and star commits remain. The bounded existing
assessor repair checks unchanged raw/save/RNG/receipts/runtime and prior outcome, with negative
controls; it does not fake `current:world` or alter product behavior. Neither phone Glass ran.
The failed log SHA is `5c19919decee1fcfefc00bc35cab5b295577a8539cb46c57796aec836d7e71c4`.
No unchanged-source browser retry; the correction will be a new commit. Full details are in
`audits/BATCH4_OVERNIGHT_REPORT_20260905.md`.

Inspection repair focused checks passed after correcting stale test mutation labels (12/12
Arc0 cases and 49/49 early fixed-point cases). Full fast then stopped at the stale public
TypeScript union (`inspection` not assignable to `commit | current | either`); its corresponding
`.d.mts` declaration is now aligned. Artunused/Vitest did not run after that typecheck red.
No game source, producer pin, measurement input or hosted policy changed in this repair.

Inspection correction final fast PASS: **286 files / 2,954 passed / 1 skipped** (37.82s);
typecheck and artunused PASS. It is committed separately from `e77e5e0` before the next
unchanged-source Slice/phone sequence. Checkpoint 1 remains pending browser acceptance/push.

### Scope and continuation

The full instruction is committed in `audits/BATCH4_OVERNIGHT_INSTRUCTIONS_20260905.md`.
No companion care/bond/missions; random loot/affix/socket/vendor quantities; achievement rewards;
conquest-imbue coexistence; extra Guardian first-victory cache; protected portraits/art locks;
CI/policy edits; hosted attempts; purchases or release. Preserve combined post-Arc-5 Arc 4.5
review and the separate Arc 5.5 HUMAN combat gate. V2 starts fresh: no player import door;
v1.8.9 codec and evidence-only importBlob remain. Gate C is real-device v2 persistence.
Audio-source backup destination is outside this batch and remains pending.

### Paired handoff

Codex continues the ordered overnight checkpoints and pushes each completed step; no PR opens.
Claude's morning review reads this branch through Git, without copying files or integrating it
before Nick's separate hosted authorization. Nick need not open another app overnight. Final
report supplies proposed `develop` ← `openai/review-batch4-gameplay-20260905` PR fields.
Budget UNFROZEN, PUBLIC, private fallback 3,000; zero hosted attempts authorized. Normal SSH
origin `git@github.com:TheDakk/Celestial-Frontier.git`, established `TheDakk` authentication and
current fetch passed. Main/live site and both parked/review backup refs remain unchanged.
