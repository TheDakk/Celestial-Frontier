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
| 1 — core integration | Slice PASS; small-phone Guide controls instrument-red | `5c07efe` local; `5ac99f9` pushed 07:13:39 UTC; fast 286 / 2,959 / 1; large phone not run |
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

Second Slice on corrected source `d260f19` stopped at 125.132s after passing Survey:
`Arc 5 legacy-carrier upgrade rehearsal exact Pertar capture card did not reach its exact Pertar surface/card/three-enabled-row outcome within 10000ms`.
All three controls are present/enabled. Existing capture evidence rejects the new
`ownershipV2.explorerMeal` diagnostic: replay returns false; removing only that field from a
clone returns true. Align its explicit strict shape and current fixture prefixes; keep historical
provenance and planned Glass ledgers. Full errors are in the overnight REDS JSON. No Glass ran.

The current fixture correction independently reproduces both old progression witnesses before
removing the obsolete Survey counts/ordinal. Capture outcomes retain the same seeded draws.
Current diagnostics remain exact; historical pre-Meal replay is explicitly flagged. No new
instrument owner, budget, timeout or historical Glass ledger change is introduced.

Diagnostic correction full fast stopped at two cases: Glass's separate current selftest fixture
also omitted Explorer Meal, and historical Final11 replay exceeded its unchanged five-second
unit-test limit under concurrent load. The former fixture is aligned; no timeout changed.
Exact outputs and counts (2 failed files / 2 tests) are retained in the overnight report.
The next run isolated Final11 alone. Its new per-field controls repeated the full large replay;
they now test the existing strict UI boundary directly while all full integration/historical
replays remain. Every field/flag/restoration case and the five-second timeout are preserved.

Diagnostic correction final fast PASS: **286 files / 2,954 passed / 1 skipped**;
typecheck/artunused and Glass selftest PASS. New correction commit precedes clean-source
Slice → small-phone → large-phone. No game source or Compendium authority changed.

Third Slice on `46b8dbc` passed Capture setup and stopped at Tame greeting result observation
(145.897s). Capture/global/ownership succeeded; the exact result checker appears stale against
the four Scout XP fields and waits past toast expiry. Investigate that bounded owner; do not
extend timeouts or change gameplay without evidence. Full finding retained; no Glass ran.

Scout-result correction final fast PASS: **286 files / 2,955 passed / 1 skipped**;
typecheck/artunused PASS. Exact no-Scout fields and replay preservation are required. New
commit precedes the next browser sequence; checkpoint 1 still awaits all browser gates/push.

Fourth Slice on `b422860` passed greeting start and every audio lifecycle clause, then failed
only final capture receipt/result verification (150.495s). Current capture combines plan,
Scout and save facts in a settlement witness; the old consumer still expects the inner plan.
Bind the full wrapper independently. Exact red retained; no Glass/audio/product change.

Combined-receipt focused checks PASS (44 tests / 37 wrapper controls). Full fast hit only
one existing malformed-CLI child timeout (20,224ms / 20,000ms). Local Vitest now runs all
cases with `--maxWorkers=4`; no timeout, assertion, CI or budget setting changes. Original
red is retained. This bounds scheduling contention without expanding instrument work.

Periodic backup checkpoint: full four-worker Vitest PASS **286 files / 2,956 passed /
1 skipped**; typecheck/artunused PASS. Commit and branch-push the full-wrapper correction
near the two-hour checkpoint, with all four browser reds retained. This is backup progress,
not completed step-1 acceptance: Slice and both phones still must pass before step 2 begins.

Periodic backup `5ac99f9` was pushed and remote-tracking verified at **07:13:39 UTC**.
Fifth Slice passed full Tame audio and actual Sample hit, then stopped only because two
intentional Arc5 corruptions now also fail the stronger receipt check (151.516s). Align the
existing expected failure lists; all positive hit/pending checks are true. No Glass ran.

Dependent-control correction final fast PASS: **286 files / 2,958 passed / 1 skipped**;
typecheck/artunused PASS. Four corruption failure sets and existing inner-witness mutation
targets are aligned. New commit precedes the next Slice/phone sequence.

Clean `a0bd9da`: Slice PASS in **365.632s**, then small-phone Glass stopped on one
`SHIPYARD_STATE_TRUTH` finding (recipeMatch/recipeTruth only; zero instrument failures).
The large-phone canary did not run. Exact source/log hashes and literal finding are retained
in the overnight report/REDS JSON. Current recipe expectations are being compared with the
approved core owner before a bounded correction; step 2 remains unintegrated.

Shipyard oracle correction fast PASS: **286 files / 2,959 passed / 1 skipped**;
typecheck/artunused PASS. Seventeen independent effect-support literals and their local seal
now reflect the signed core. All 62 rows/statuses/enabled states and existing corruption
controls remain. Commit before the next clean-source browser sequence.

Clean `5c07efe`: Slice PASS in **367.006s**; Shipyard passes. Small-phone Glass then
stops instrument-red at four F2 Guide controls (all 22 product topics true, zero product
findings). Repair only their stale removal/contradiction behavior. The full literal finding
is retained in the REDS JSON; large phone did not run.

The new actual-Guide replay passed focused checks but full typecheck caught its overly
narrow inferred Map key. The test now accepts an arbitrary search string with the exact
catalogue topic value type. Original TS2345 is retained; later fast gates did not run.

Guide-control correction final fast PASS: **286 files / 2,962 passed / 1 skipped**;
typecheck/artunused PASS. Two explicit forbidden claims and audio paragraph 5 fix the
existing checker; actual 22-topic replay and exact historical failure controls pass.
Commit before the next clean-source Slice/phone sequence.

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
