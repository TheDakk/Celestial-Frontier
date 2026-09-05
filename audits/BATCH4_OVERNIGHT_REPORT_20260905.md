# Batch 4 overnight report — 2026-09-05

This is a live checkpoint report, not final acceptance. Base develop:
`9ea01041dcdc711190bbf909ea8bb743cd993734`; owned review branch:
`openai/review-batch4-gameplay-20260905` (OpenAI/Codex, macOS,
`/Users/nick/Projects/celestial-frontier-openai-mac`). Clean `openai/mac` remains `84b6f22`.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5`; periodic backup `5ac99f9efc86b1e19d2ec0c5d59c70cc5653fffb` | 2026-09-05 07:13:39 (backup) | Typecheck/artunused PASS; 286 files / 2,956 passed / 1 skipped; four workers | Five retained Slice reds; actual Tame/Sample pass; corruption expectation repair pending; neither Glass ran |
| 2a accepted st-scan | Pending | — | — | — |
| 2b descent/wave-offs | Pending | — | — | — |
| 2c 50-Paragon hunt | Pending | — | — | — |
| 2d exact-instance progression | Pending | — | — | — |
| 2e mature Atlas | Pending | — | — | — |
| 3a authority controls | In signed core | Pending | Included in full Vitest | No UI change |
| 3b same-owner lists | Pending | — | — | — |
| 3c bounded extraction | Pending | — | — | — |
| 3d phone analysis | Pending | — | — | — |

## Decisions made unattended

- Preserve the real signed `5377069` as merge parent; select WIP hunks only in later checkpoints.
  Fresh-start develop owns the player-door removal, evidence import seam and planned ledgers.
- Core remains 77 outcomes. Restore existing Pureforged detail and exact Feed status/audio
  chronology instead of deleting the prior positive/negative copy controls.
- Refresh only the measured current Compendium producer after final build. Measurement authority
  `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`, ruler, numeric
  ceilings and samples remain unchanged. Printer exit 2 names quarantined/historical SceneMemory
  and the stale producer before repinning; it is not a failed product profile.

## Blocked / reverted

Core first fast run stopped at artunused, before Vitest:

```text
tests/explorer-meal-action.test.ts(26,3): error TS6133: 'SCENE_ENGINEERING_ADDRESS_RESOLVER' is declared but its value is never read.
```

Removed that unused import. First full Vitest: **13 failed / 273 passed files; 21 failed /
2,930 passed / 1 skipped tests**. The next full run: **1 failed / 285 passed files; 3 failed /
2,948 passed / 1 skipped tests**. Those remaining errors were:

```text
FAIL tests/guide-release.test.ts > describes the exact live Engineering and Inventory actions without promoting dormant rows
AssertionError: expected false to be true // Object.is equality
FAIL tests/guide-release.test.ts > keeps Compendium browsing bounded while documenting first-find and narrow Feed writes
AssertionError: expected false to be true // Object.is equality
FAIL tests/guide-release.test.ts > keeps the cumulative v2.0 bulletin structured, unique, and bound to key outcomes
AssertionError: expected [ Array(1) ] to deeply equal []
Missing obsolete copy: /committed Feed may produce one deterministic acknowledgement only from its trusted gesture, exact current ownership successor, and still-current accessible result/
```

Mutation spans were scoped to their actual action owners; inventory anchors reflect new explicit
core owners. Charter “counterfeits” cannot match “counts”; Scout “grants no Scout XP” cannot
match an affirmative XP award. Restored prior Pureforged positive and upgrade/vendor negative
controls. Detailed local logs (including targeted repairs) are under
`/private/tmp/cf-overnight-batch4-20260905`; checkpoint evidence records hashes/counts.
No product step has been reversed. No red gate was followed by a browser gate.

<details><summary>First full-run failing cases (verbatim)</summary>

```text
FAIL  tests/arc5-scout-main-wiring.test.ts > Arc 5 player-live Field Scout wiring > negative-controls surface, coordinator, heartbeat, fixed point, and non-optimism
FAIL  tests/arc9-atlas-favorite-main-wiring.test.ts > Arc 9 Atlas Favorite Main and HTML wiring > owns split accessible controls and a route-independent Favorite action
FAIL  tests/arc9-atlas-favorite-main-wiring.test.ts > Arc 9 Atlas Favorite Main and HTML wiring > negative-controls accessibility, 44px geometry, and read-only/Training fences
FAIL  tests/arc9-atlas-favorite-main-wiring.test.ts > Arc 9 Atlas Favorite Main and HTML wiring > negative-controls heartbeat ordering, one-CAS settlement, exact checkpoint, and focus
FAIL  tests/arc9-sharing-main-wiring.test.ts > Arc 9 CF1 Share/Follow Main durability wiring > negative-controls read-only capture and direct native clipboard bypasses
FAIL  tests/compendium-budget.test.ts > Arc 1A Compendium budget authority > fails the current producer closed without rebinding historical samples
FAIL  tests/compendium-feed-main-wiring.test.ts > player-live Compendium Feed wiring > owns one exact nonoptimistic action from real fauna detail through durable publication
FAIL  tests/compendium-feed-main-wiring.test.ts > player-live Compendium Feed wiring > rejects broken ownership, retry, publication, audio, counterpart and ceiling wiring
FAIL  tests/evidence-chain-tools.test.ts > Slice → Glass → Arc 4 recovery evidence chain > requires an exact clean Slice predecessor for full Glass and binds the newest release semantics in both directions
FAIL  tests/exceptional-crafting-evidence-contract.test.ts > Pureforged browser-evidence truth > binds Slice Guide and release evidence to the live feature and still-open advanced systems
FAIL  tests/exceptional-crafting-evidence-contract.test.ts > Pureforged browser-evidence truth > binds Glass Guide and release evidence to the same current boundary
FAIL  tests/exceptional-crafting-evidence-contract.test.ts > Pureforged browser-evidence truth > fails closed when each Slice owner loses one required outcome or negative control
FAIL  tests/exceptional-crafting-evidence-contract.test.ts > Pureforged browser-evidence truth > fails closed when each Glass owner loses one required outcome or negative control
FAIL  tests/nodom.test.ts > ★ GATE B — no-DOM / no-nondeterminism lint over packages/domain > scans the exact domain source inventory (80 files)
FAIL  tests/runtime-hardening.test.ts > synchronous semantic panel refill focus > executes the real rec refill and its final disabled-state projection
FAIL  tests/slicesmoke-feed-causal-chain.test.ts > Slice Arc 5 Feed causal-chain evidence > wires both decisions to native Compendium interaction and reload evidence
FAIL  tests/slicesmoke-sixth-red-contract.test.ts > sixth Slice red contract repairs > binds Guide navigation to publication and the exact current 41-topic capability identity
FAIL  tests/slicesmoke-sixth-red-contract.test.ts > sixth Slice red contract repairs > keeps every rendered Guide and release oracle green on current exact copy before browser spend
FAIL  tests/slicesmoke-sixth-red-contract.test.ts > sixth Slice red contract repairs > executes Guide split-markup, contradiction, polarity, and exact-restoration controls
FAIL  tests/world-roster.test.ts > MAIN-3 — full world roster vs Planetside preview > statically keeps main on MAIN-3 and rejects a direct duplicate ecology constructor
FAIL  packages/domain/combatcore/test/guardian-prime.test.ts > encounter identity, suppression, and settlement-safe projections > keeps canonical minting above combatcore without recreating the scene dependency cycle
```

</details>

Final browser-copy alignment retained all old removal/contradiction controls, restored the
implemented Atlas travel wording, and standardized the accepted/weekly Charter boundary in
Charters and Chapters. An intermediate full run passed **286 files / 2,951 tests / 1 skipped**;
the subsequent exact source run found three case-sensitive `guide-release` expectations:

```text
FAIL tests/guide-release.test.ts > uses current-slice copy for partial topics and explicit copy for unavailable topics
AssertionError: expected false to be true // Object.is equality
FAIL tests/guide-release.test.ts > documents live Scout, conquest, Prime, ranks, achievements, and starter Charter joins without claiming their open successors
AssertionError: expected false to be true // Object.is equality
FAIL tests/guide-release.test.ts > documents Starter Charters, Binder claims, progression ceremonies, and Frontier endings at their exact live boundaries
AssertionError: expected false to be true // Object.is equality
```

No browser ran after those reds. Root validator passed: **1,010 renders / zero failures;
50 fingerprints identical to the v1.0 baseline**. Final fast/browser results follow below.

## WIP still parked

All `cf1b9a7843200ecc281c5113b4139909dc0e3a29` WIP is parked until individually completed:
accepted Starter, descent, Paragons, creature progression and Atlas are staged recovery scopes.
Weekly lifecycle/joins, Forge Training, living portrait preview and unrelated bulk copy remain
excluded. Audio-source backup destination is outside this batch. No care/bond/missions or
reserved loot/reward/conquest product decisions are fabricated.

## Proposed PR — prepare only

Base: `develop`. Source: `openai/review-batch4-gameplay-20260905`.
Title/body and exact final SHA will be finalized after every list item has a disposition.
No PR, label, hosted attempt, integration merge, purchase or release is authorized.
Claude reads the pushed branch for morning review; Nick need not open the other app overnight.

## Checkpoint 1 fast evidence

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.616,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.504,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run"
    ],
    "exitCode": 0,
    "seconds": 38.737,
    "log": "3-npx.log",
    "sha256": "420538bbe31683e6cd92192f74b27d62a177bfbf20818b60cb78641c67a2c61d"
  }
]
```

## Checkpoint 1 first browser red — retained, no retry of unchanged source

Real signed-core merge `e77e5e09a0840a2ad7d33a81c95c7bc784523ae5` has parents
`9ea01041dcdc711190bbf909ea8bb743cd993734` and `53770697f6613da3ba469868dae24cf0edc3f58d`.
Slice stopped after **33.262s**; neither Glass canary started:

```text
SLICE SMOKE: FAIL — 1 finding
SLICE SMOKE: FAILURE TITLES
  1. POINTER EARTH SURVEY
POINTER EARTH SURVEY: Survey did not reach its exact same-document fixed point before the dependent action
```

```json
{
  "source": "e77e5e09a0840a2ad7d33a81c95c7bc784523ae5",
  "exitCode": 1,
  "seconds": 33.262,
  "firstFailure": "POINTER EARTH SURVEY",
  "assessment": {
    "status": "pending",
    "reasons": [
      "Survey action commit: exact raw revision successor",
      "Survey action commit: exact live runtime successor",
      "Survey action commit: exact SessionRNG successor",
      "Survey action commit: exact action receipt",
      "Survey action commit: exact persistence outcome",
      "Survey action commit: exact published world outcome"
    ]
  },
  "expected": {
    "documentToken": "2023af8c-e4fd-4ad7-8608-61017b9e5f01",
    "renderedSerial": 1,
    "surveyTarget": "world",
    "route": {
      "mode": "system",
      "gal": 999,
      "galX": 90,
      "galY": -60,
      "star": 424242,
      "starX": 560,
      "starY": 170,
      "planet": null,
      "planetOrdinal": null,
      "navGalaxyKey": "CF1|g:999@90,-60",
      "navStarKey": "CF1|g:999@90,-60|s:424242@560,170",
      "navWorldKey": null,
      "epoch": 0
    },
    "presentation": {
      "cardOpen": true,
      "cardTitle": "Earth",
      "actionOk": true,
      "actionLabel": "\u26f3 Land"
    },
    "settlement": "commit"
  },
  "logSha256": "5c19919decee1fcfefc00bc35cab5b295577a8539cb46c57796aec836d7e71c4"
}
```

The old setup expected an `arc9-survey-v1` write from opening Earth's card. Approved core
`startPlanetSurvey` deliberately keeps **living-world** inspection write-free and gives its
Survey/hazard transaction to explicit Discover Life. Nonliving Mercury and star observations
still write, and those expectations remain. Existing `current` settlement means a completed
Survey owner with `current:world`; inspection preserves the earlier diagnostic, so that mode
cannot honestly represent the new action. The existing fixed-point assessor receives a narrow
world-inspection expectation requiring exact unchanged raw/save/RNG/runtime/receipt authority,
unchanged prior outcome and the same idle route/card/action. Existing star/current/commit
contracts and subsequent Atlas/Share/Land commits remain. Focused mutation controls require a
write or outcome drift to fail. No new collector, budget, timeout or retry owner is added.

Automatic approval review initially rejected broad `git add -A` because three resolved files
still had unmerged index entries. Their contents were separately checked for conflict markers,
Slice syntax and the 77-count, then those exact three files were staged. The empty unmerged
list and clean staged diff allowed the normal signed merge commit; no approval bypass occurred.

### Inspection repair diagnostics

The first focused run passed 127 of 128 cases and stopped on two stale test-only mutation
markers in `tests/slicesmoke-arc0-landing-contract.test.ts`:

```text
collects one awaited action across a held and explicitly released convergence reload
Expected []
Received: receipt control splice guard: expected one marker, got 0
Received: Ocean split mutant: expected one marker, got 0
```

The markers now name the injected receipt/Ocean writes. That file then passed 12/12; the
realistic compact-snapshot early fixed-point suite passed 49/49. Those focused outputs are
retained in the subagent transcript, not a fabricated disk log. The first full repair gate
stopped at typecheck (artunused and Vitest did not start):

```text
> cf-v2@0.0.0 typecheck
> tsc --noEmit && tsc --noEmit -p apps/game/tsconfig.json && tsc --noEmit -p apps/game/tsconfig.worker.json

tests/slicesmoke-initial-core-flow-fixed-point.test.ts(226,79): error TS2345: Argument of type '{ readonly documentToken: "initial-milky-way-owner-token"; readonly renderedSerial: 8; readonly surveyTarget: 'world'; readonly settlement: 'inspection'; readonly route: { readonly gal: 999; ... 11 more ...; readonly navStarKey: 'CF1|g:999@90,-60|s:424242@560,170'; }; readonly presentation: { readonly cardOpen: true...' is not assignable to parameter of type 'Readonly<{ readonly documentToken: string; readonly renderedSerial: number; readonly surveyTarget: "star" | "world"; readonly route: Readonly<{ readonly mode: "galaxy" | "system"; readonly gal: number; ... 10 more ...; readonly epoch: number; }>; readonly presentation?: Readonly<...> | null; readonly settlement?: "c...'.
  Types of property 'settlement' are incompatible.
    Type '"inspection"' is not assignable to type '"commit" | "current" | "either"'.
tests/slicesmoke-initial-core-flow-fixed-point.test.ts(233,20): error TS2322: Type '"inspection"' is not assignable to type '"commit" | "current" | "either"'.
tests/slicesmoke-initial-core-flow-fixed-point.test.ts(252,59): error TS2345: Argument of type '{ readonly documentToken: "initial-milky-way-owner-token"; readonly renderedSerial: 8; readonly surveyTarget: 'world'; readonly settlement: 'inspection'; readonly route: { readonly gal: 999; ... 11 more ...; readonly navStarKey: 'CF1|g:999@90,-60|s:424242@560,170'; }; readonly presentation: { readonly cardOpen: true...' is not assignable to parameter of type 'Readonly<{ readonly documentToken: string; readonly renderedSerial: number; readonly surveyTarget: "star" | "world"; readonly route: Readonly<{ readonly mode: "galaxy" | "system"; readonly gal: number; ... 10 more ...; readonly epoch: number; }>; readonly presentation?: Readonly<...> | null; readonly settlement?: "c...'.
  Types of property 'settlement' are incompatible.
    Type '"inspection"' is not assignable to type '"commit" | "current" | "either"'.
tests/slicesmoke-initial-core-flow-fixed-point.test.ts(254,71): error TS2345: Argument of type '{ readonly documentToken: "initial-milky-way-owner-token"; readonly renderedSerial: 8; readonly surveyTarget: 'world'; readonly settlement: 'inspection'; readonly route: { readonly gal: 999; ... 11 more ...; readonly navStarKey: 'CF1|g:999@90,-60|s:424242@560,170'; }; readonly presentation: { readonly cardOpen: true...' is not assignable to parameter of type 'Readonly<{ readonly documentToken: string; readonly renderedSerial: number; readonly surveyTarget: "star" | "world"; readonly route: Readonly<{ readonly mode: "galaxy" | "system"; readonly gal: number; ... 10 more ...; readonly epoch: number; }>; readonly presentation?: Readonly<...> | null; readonly settlement?: "c...'.
  Types of property 'settlement' are incompatible.
    Type '"inspection"' is not assignable to type '"commit" | "current" | "either"'.
```

The matching public declaration now admits `inspection` alongside the unchanged existing modes.
No game code or Compendium producer changed during this repair. Final fast results follow.

Inspection repair final fast: typecheck/artunused PASS; **286 files / 2,954 passed / 1 skipped**
(37.82s Vitest). These results apply to the correction committed after `e77e5e0`; the browser
run will start only from the resulting clean source.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.343,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.481,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run"
    ],
    "exitCode": 0,
    "seconds": 38.452,
    "log": "3-npx.log",
    "sha256": "0a5fc974cf11c4a920d5739b8fe36abad67eead61c6bd189cef5d6917536c42d"
  }
]
```

## Checkpoint 1 second browser red — current diagnostic inventory

Source `d260f19c01e57815bfb7f3a94ee27b23d867fb08` passed the corrected Survey stage,
then stopped after **125.132s**; no Glass canary ran:

```text
SLICE SMOKE: FAIL — 1 finding
SLICE SMOKE: FAILURE TITLES
  1. harness
harness: Arc 5 legacy-carrier upgrade rehearsal exact Pertar capture card did not reach its exact Pertar surface/card/three-enabled-row outcome within 10000ms
```

The retained UI has exactly Tame, Scavenge and Sample, all model-enabled/native-enabled,
with loaded current ownership. A read-only replay of the existing completeness predicate gives
`retainedComplete:false`; removing only the newly authored `ownershipV2.explorerMeal` field
from a diagnostic clone gives `true`. The field itself is valid new core output; its old strict
consumer inventory must be aligned without allowing unknown or missing current fields.
The related fresh Pertar receipt prefix must reflect living-world inspection's zero write,
while historical fixtures and Glass's planned-ledger matching retain their explicit provenance.
The full literal browser error lines for both failed sources are retained in
`BATCH4_OVERNIGHT_REDS_20260905.json`. Second raw-log SHA-256:
`0d229db23924e6cc93f391313620866fd37758ad6c739246686f798c4fc986e7`.
No product change, timeout extension, weaker ruler or unchanged-source rerun follows this red.

The correction keeps the current diagnostic inventory exact (including Explorer Meal) and
admits the exact pre-Meal v3 shape only through the existing explicit historical replay flag.
The current fresh-Pertar prefix is independently derived as boot receipt 0 plus Land receipt 1;
inspection adds neither revision nor receipt. Capture draws retain their seeded domain/count
addresses, so species and odds do not change. The pure-source derivation first reproduced the
historical boot `arc9p1:8bfd4634e1e932eabead451a44fdf8e7ef35693c58b0179ebf8045a68558c05b`
and Sample `arc9p1:ca4c7dff47e0659ad90ee11f24441920e8fde2ccbc6cd474bd4b174338f4f6a1`.
Removing only the obsolete Survey aggregate increments (living/type counts 3/3 → 2/2) and
moving the Sample progression receipt 4 → 3 gives
`arc9p1:2fc001a89819c20cca537ce2dff25ce5b88a1497e7d4a913d9a8b23217cb9013`.
The existing Landing state-seal validator keeps its documented canonical-SHA requirement;
no observed browser seal was copied into a new acceptance pin. Historical Glass planned
ledgers remain unchanged. These are bounded repairs to existing product-evidence owners,
not new collectors, budgets, schema authorities or retry rules.

## Checkpoint 1 diagnostic correction — fast red retained

Full fast on the diagnostic/prefix repair: typecheck and artunused PASS; Vitest
**2 failed / 284 passed files; 2 failed / 2,952 passed / 1 skipped** (39.31s).

```text
FAIL tests/arc4-recovery-tool.test.ts > Arc 4 real-time recovery certificate instrument > retains Final11 as a failure while its immutable bundle replays green
Error: Test timed out in 5000ms.
FAIL tests/evidence-chain-tools.test.ts > Slice → Glass → Arc 4 recovery evidence chain > requires an exact clean Slice predecessor for full Glass and binds the newest release semantics in both directions
GLASS MATRIX INSTRUMENT FAILURE
GLASS MATRIX REPORT SELFTEST: Arc 4 presentation/geometry/return controls failed
```

The existing Glass current selftest fixture separately omitted Explorer Meal. Its strict
completeness check therefore correctly rejected the fixture. Add the exact new idle field to
that current fixture only; historical planned ledgers are untouched. The Final11 case was
previously green in the focused run and exceeded its existing five-second unit-test timeout
under the full concurrent run; no timeout or test intent was changed. Full log SHA-256:
`e728f8e15ce216d3197c5d68b90d97813d782f2143624563ddeb7f8533960f33`.
No browser ran after this red.

After the Glass fixture correction, full fast had **1 failed / 285 passed files;
1 failed / 2,953 passed / 1 skipped** (38.67s), solely the same Final11 timeout:
`Error: Test timed out in 5000ms.` Log SHA-256
`fd7d1225e68d2940e3d5c93104c063cb025aae6b9cc384744aea0d4b06047ff6`.
Diagnosis refined the initial load attribution: the newly added eight Meal-field wrong/missing
controls were each replaying the entire large retained recovery bundle three times. They now
exercise the same exported strict UI completeness boundary directly, with both historical flags
and restoration controls. Existing full-bundle positive, subtree and historical-integration
replays remain. No case, field, acceptance condition or timeout was removed or enlarged.

## Checkpoint 1 diagnostic correction — final fast PASS

Typecheck and artunused PASS; Vitest **286 files / 2,954 passed / 1 skipped**.
The reduced repeated work preserves all field and full-recovery outcomes under unchanged
timeouts. Glass selftest also PASS on the corrected current fixture. No game source changed
since the original core merge; current producer and measurement pins remain unchanged.
A new correction commit now precedes the next clean-source browser sequence.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.142,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.362,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run"
    ],
    "exitCode": 0,
    "seconds": 38.408,
    "log": "3-npx.log",
    "sha256": "4182ffcf1747ca2f150688de02476ad5d8d0429255540b2e26db85f63d1bee87"
  }
]
```

## Checkpoint 1 third browser red — capture result fields

Clean source `46b8dbc12b0f4ff756076f7bd398dc28c9b52f59` passed the corrected Capture
surface/prefix and stopped after **145.897s**:

```text
SLICE SMOKE: FAIL — 1 finding
SLICE SMOKE: FAILURE TITLES
  1. ARC 4 TAME GREETING AUDIO START
ARC 4 TAME GREETING AUDIO START: bounded post-release observation did not prove the exact result/global/ownership/claim/counterpart/runtime/toast clauses
```

Retained assessment: result false; global/ownership/runtime true; claim/counterpart/toast false
at final observation. The committed capture result contains the four new Scout XP fields.
Investigate its existing strict result comparison first: the expected audio poll may reject the
current result until its native toast expires. No change to audio/gameplay or timeout is assumed.
Full exact finding/observation is in the REDS JSON. Log SHA-256:
`4735b626b69b9aa6e7610a9d3bb4639517816bd38293c6c615af5d990945eef2`.
Neither Glass canary ran; no unchanged-source browser retry.

Two existing strict capture-result inventories omitted the Scout fields: generic Pertar action
results and the Tame greeting start observation. Both prescribed fixtures have no Field Scout;
the independent expectation is exactly `null / null / null / 0`, with unknown and missing fields
still refused. Preserve all four fields in the existing Tame close/reopen result projection too.
No product/audio change, new collector or timeout change is required for this correction.

## Checkpoint 1 Scout result correction — final fast PASS

Focused checks PASS 4 files / 43 tests. Full fast: typecheck/artunused PASS; Vitest
**286 files / 2,955 passed / 1 skipped**. All original no-Scout result, missing/wrong-field,
unknown-key and close/reopen restoration boundaries remain strict. A bounded read-only sweep
found no further living-world Survey receipt assumptions: the three late receipt-bearing
Survey setups target Mercury and correctly remain. Commit the correction before the next
unchanged-source browser sequence.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.322,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.147,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run"
    ],
    "exitCode": 0,
    "seconds": 38.485,
    "log": "3-npx.log",
    "sha256": "88f403ccd30e21d7c356e41942c86eb4ec80b74753c2b031171edc4025627257"
  }
]
```

## Checkpoint 1 fourth browser red — combined capture settlement receipt

Clean source `b42286039b6e7dff1a080d91623550de34944745` passed Tame greeting start and
all actual audio lifecycle clauses, then stopped after **150.495s**:

```text
SLICE SMOKE: FAIL — 1 finding
SLICE SMOKE: FAILURE TITLES
  1. ARC 4 TAME GREETING AUDIO
ARC 4 TAME GREETING AUDIO: isolated native Tame did not arm silently, bind exactly one durable greeting to its assertive toast, remain single-start through close/reopen/refresh/wait, or reload without replay
```

Only `committedTame` and `exactResult` are false. Fixture, answerable document, silent arm,
voice owner, accessible counterpart, close/reopen/wait, reload and fresh-fixture isolation are
true. Current producer `arc4-capture-capacity.ts` wraps the plan in
`cf-v2-arc4-capture-settlement-witness/v1`; the existing receipt consumer still expects the
inner `cf-v2-capture-plan-witness/v1` at the top level. Bind the entire combined receipt's
Scout/Charter/save facts independently before using its inner event; do not merely unwrap or
accept unknown fields. Full literal finding is in the REDS JSON. Log SHA-256:
`4f30b14f1b589f4f72328b0402a76d052134e1e211ad57338c1c075bfcaccdaa`.
Neither phone canary ran; no unchanged-source retry or audio/gameplay change follows.
The existing failure output retains the classifier/controls, not the full in-memory Tame bundle;
only seven screenshots were emitted before this stop. No full retained-bundle replay is claimed.
Current-wrapper validation is independently derived from source and focused controls; the next
clean-source browser run must establish actual acceptance. The migration digest hashes exactly
five ordered Arc5-only `{segment, namespace, carrier}` writes with `JSON.stringify`, matching
the authored writer; sorted canonical JSON or combined Arc4+Arc5 writes would be incorrect.

## Checkpoint 1 combined-receipt correction — scheduling timeout retained

Focused checks PASS **4 files / 44 tests**, including 37 strict wrapper mutations/restorations.
Full fast: typecheck/artunused PASS; Vitest **1 failed / 285 passed files;
1 failed / 2,955 passed / 1 skipped** (40.29s). Its only failure was:

```text
FAIL tests/evidence-chain-tools.test.ts > Slice → Glass → Arc 4 recovery evidence chain > fails closed on one representative malformed profile call per evidence producer
Error: Test timed out in 20000ms.
```

That case runs three child programs and took 20,224ms under the full concurrent run. No
assertion failure was reported. Preserve the exact log SHA-256
`f248823efe22e2f54550abed84882078f2013b309f16e1759461a42eedbe5f4b`.
Unattended execution choice: run the same complete local Vitest selection with
`--maxWorkers=4` to bound CPU contention. This changes local scheduling only; every case,
assertion, timeout, CI command and budget policy stays unchanged. Retain this limit for
subsequent overnight checkpoints. The source is unchanged by the scheduling choice.
No browser ran after the timeout.

## Periodic backup checkpoint — combined-receipt correction fast-green

The complete test selection with four local workers PASS: **286 files / 2,956 passed /
1 skipped**; typecheck and artunused PASS. Every existing timeout is unchanged. The 37 new
wrapper controls operate on the small receipt boundary and restore the positive source.
This correction is being committed and branch-pushed as Nick's roughly two-hour backup
checkpoint. **Step 1 remains incomplete until Slice and both phone canaries pass.** No later
gameplay layer is integrated and no hosted run/PR/label follows this push. Exact commit/push
metadata will be added after the operation; the new clean committed source owns the next
browser sequence.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.543,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.31,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run",
      "--maxWorkers=4"
    ],
    "exitCode": 0,
    "seconds": 57.041,
    "log": "3-npx.log",
    "sha256": "ef493efb891cef216eb2a24e15ea376af4c8289cc6c19e83b0393780b55e3da9"
  }
]
```

## Periodic backup 1 — pushed

Commit `5ac99f9efc86b1e19d2ec0c5d59c70cc5653fffb` was pushed to
`origin/openai/review-batch4-gameplay-20260905` at **2026-09-05 07:13:39 UTC**;
the remote-tracking SHA matched. Fast gates PASS **286 / 2,956 / 1** with four local workers.
This is the authorized periodic backup, not completed core acceptance. No PR/label/hosted run.

## Checkpoint 1 fifth browser red — stronger corruption controls

That clean pushed source passed the full Tame audio classification and actual Sample hit,
then stopped after **151.516s**:

```text
SLICE SMOKE: FAIL — 1 finding
SLICE SMOKE: FAILURE TITLES
  1. ARC 4 SAMPLE HIT
ARC 4 SAMPLE HIT: one held native action did not remain non-optimistic then commit hidden ordinal-13 first-page/+2 truth
```

The retained positive pending and hit assessments are fully true. The deliberately corrupted
`hitRetainedArc5Control` and `hitTargetDigestControl` now correctly fail five checks:
`durableEvidence`, `arc5CarrierSuccessor`, `receipt`, `unrelatedDurable`, `ownershipV2Live`.
The existing Slice expectation still lists the old four failures, omitting `receipt`.
Align only these expected failure sets and identical migration mutants with the strengthened
binding; do not remove the receipt check or change the positive product outcome. Full literal
finding is retained in the REDS JSON. Log SHA-256:
`216a21cf7182c68aea982f358d26f12d60e2bbb46c75141b25fc53e2f3a72f19`.
Neither phone canary ran; the next correction will precede a new committed-source run.

## Checkpoint 1 dependent-control correction — final fast PASS

Aligned four existing expected Arc5-corruption failure sets with the additional receipt rejection.
The burn event/digest mutants now target the intended inner capture witness; no extra outer
field can counterfeit those controls. Focused checks PASS **4 files / 46 tests**. Full fast
PASS: typecheck/artunused; **286 files / 2,958 passed / 1 skipped** with four local workers.
No product, authority, timeout or historical ledger change. Commit before the next clean-source
Slice and two-phone sequence; the published periodic backup remains `5ac99f9` until the next push.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.242,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.289,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run",
      "--maxWorkers=4"
    ],
    "exitCode": 0,
    "seconds": 57.405,
    "log": "3-npx.log",
    "sha256": "ca968f3be8dd65f10439bbc169065d5383ac9037e6b61fc75b899187d3cd3ec2"
  }
]
```


## Checkpoint 1 Slice PASS, sixth browser stop — small-phone recipe truth

Clean source `a0bd9dad7ac827345175ec16ee1bdea3fa4512ba` passed the full local develop
Slice in **365.632s**, including its eight-stage Arc 4 ledger and 14 burn steps, with
zero console errors. Direct runner evidence uses the resolved local Microsoft Edge;
it is not a named structured Chrome certificate. Log SHA-256:
`b06666e5cbdf8a850aeb3c723ff2893d34460fd0707640b8788a90191f3daa09`.

The immediately following small-phone Glass canary stopped after **11.354s**:

```text
GLASS VIEWPORT PRODUCT-RED — small-phone; 6444 ms; findings 1; instrument failures 0
GLASS MATRIX PRODUCT FINDINGS — 1 across 1 viewport classes
COUNTS {"SHIPYARD_STATE_TRUTH":1}
```

Only recipeMatch/recipeTruth are false in the retained Shipyard finding. State, six
research rows, groups, action inventory, diagnostics, geometry, opener and preview
accessibility all pass. Investigate the existing recipe-effect expectations against
the recovered current capability owner. The literal finding is retained in the REDS
JSON; log SHA-256 `b66802de9c3bf18fa9dc3c7a2bcd46661c93b04264b1a0ed6cec9b3f9278b1d2`.
Large-phone Glass did not run. Step 2 remains unintegrated until core acceptance.


## Checkpoint 1 Shipyard oracle correction — final fast PASS

The signed core enabled the existing `scut`, `heal` and `speed` recipe effects. Seventeen
independent recipe rows still said their effects were unavailable. Only those literal
`effectSupport` expectations and their local inventory seal changed; all 62 IDs, ordering,
statuses and enabled flags stay independently authored. Only plate/chip/headlamp are enabled
in this fixture. The Glass predicate and existing Earpiece mutation control stay unchanged.
The existing model test rejects every stale expectation and every regressed producer row,
then restores each. Focused PASS **3 files / 39 tests**; the retained 62-row finding matches
the corrected oracle in a bounded replay, not a new browser result.

Full fast PASS: typecheck, artunused, **286 files / 2,959 passed / 1 skipped**, four local
workers. No product, Compendium authority, timeout, budget or historical ledger change.
Commit this correction before the new clean-source Slice → small-phone → large-phone run.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.393,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.57,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run",
      "--maxWorkers=4"
    ],
    "exitCode": 0,
    "seconds": 56.987,
    "log": "3-npx.log",
    "sha256": "db0d4bbdfd623043046822533121c08afbc04eb29fe8f54998a0801a00a34a9f"
  }
]
```


## Checkpoint 1 second Slice PASS, seventh browser stop — Guide corruption controls

Clean source `5c07efe3d0cfa049bc94a59522913ee5e6e69fe8` passes local develop Slice in
**367.006s** (log SHA `f50be6784fbe3b4ed8becca12c9874619fede6022766a999fb966f34cf62748e`).
Small-phone Glass then passes Shipyard and stops after **12.489s**, exit 2:

```text
GLASS VIEWPORT INSTRUMENT-RED — small-phone; 7910 ms; findings 0; instrument failures 1
GLASS MATRIX INSTRUMENT FAILURE
- small-phone: rendered F2 Guide negative controls failed
```

All 22 rendered product topics pass. The retained control evidence shows four false flags:
Discover Bioscan's contradiction rejection, Discover Audio's removal rejection, and the
Charters/Ascent contradiction rejections. Every required-copy control and every restoration
passes. Correct the bounded existing stale-copy controls while retaining their independent
intent. No product copy is presumed wrong solely because these instrument controls fail.
The full literal diagnostic is retained in the REDS JSON; local parsed copy is
`/private/tmp/cf-guide-seventh-red.json`. Log SHA-256:
`31f8fcb78511d2c331fcbae1f3811b765c48f74aee9dfe69ad4363d40d733543`.
Large-phone Glass did not run; no later gameplay integration or hosted attempt follows.


## Guide-control fast typecheck stop and bounded correction

The focused 60-test check passed, but the complete fast sequence stopped immediately at
TypeScript (1.320s), before artunused or Vitest:

```text
tests/glass-bioscan-copy-contract.test.ts(174,30): error TS2345: Argument of type 'string' is not assignable to parameter of type '"abilities" | "achievements" | "ascent" | "atlas" | "beacon" | "binder" | "breeding" | "charters" | "classes" | "codes" | "colors" | "conquest" | "crafting" | "determinism" | ... 28 more ... | "zoom"'.
```

The test's query is an arbitrary input string, while Map inferred only the authored ID union.
Its key type is explicitly string; its value type remains the exact catalogue topic type.
Unknown queries still return undefined. No assertion or production code changed.
Log SHA-256 `ba8ae07c714c21dcd3d493632340092522b67debe225998dc8ce8c4a5b7abfe8`.


## Checkpoint 1 Guide-control correction — final fast PASS

Two injected stale claims were missing from the existing forbidden arrays, and the audio
paragraph moved from 4 to 5 when Discover Life was added. Added those two exact forbidden
claims and targeted the current audio paragraph. Product copy and every prior required
carrier, mutation and restoration remain. The existing test now executes the actual 22-topic
Glass expression against current rendered Guide bodies; the old source reproduced the exact
four retained failures, and the historical mutants continue to fail with exact old IDs.
Focused PASS **3 files / 60 tests**.

After the test-only Map typing correction, full fast PASS: typecheck/artunused,
**286 files / 2,962 passed / 1 skipped**, four local workers. No game source, producer,
measurement, timeout or hosted setting changed. Commit before the next clean-source browser
sequence. Later patches are being context-refreshed to preserve this correction.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.354,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.47,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run",
      "--maxWorkers=4"
    ],
    "exitCode": 0,
    "seconds": 60.55,
    "log": "3-npx.log",
    "sha256": "4831b471ce92033aaace3995236cffb9d1ce726fd4c18c61971fb649590b495c"
  }
]
```


## Checkpoint 1 third Slice PASS, eighth browser stop — bulletin corruption controls

Clean source `d2afe528e11ba3fb7b9b75762fbeb458fb491a3a` passes local develop Slice in
**367.432s** (log SHA `57ad10b60f75e3d191448db7da8f176a81e22332e598575ad1ca0aea484790d7`).
Small-phone Glass passes the repaired 22-topic Guide controls, then stops after **13.182s**:

```text
GLASS VIEWPORT INSTRUMENT-RED — small-phone; 8544 ms; findings 0; instrument failures 1
GLASS MATRIX INSTRUMENT FAILURE
- small-phone: development-release reorder/inventory/authority controls did not fail closed
```

The actual 77-outcome bulletin baseline passes every contract. Inspect the existing deliberately
corrupted release variants and their exact expected rejection. Full literal finding is retained
in the REDS JSON; parsed local artifact `/private/tmp/cf-release-eighth-red.json`.
Log SHA-256 `7c1717838996b2987c64483c02d475f00f76596222f02504fc359ea69d2e14ef`.
Large-phone Glass did not run. No unchanged-source retry or later gameplay integration.


## Release-control fast typecheck stop and bounded correction

Focused executable checks passed, but full typecheck stopped (1.548s), before the remaining
fast gates, because the new test imports an existing JavaScript browser-contract owner without
its own declaration shim:

```text
tests/exceptional-crafting-evidence-contract.test.ts(6,43): error TS7016: Could not find a declaration file for module '../tools/engineering-browser-contract.mjs'. '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/engineering-browser-contract.mjs' implicitly has an 'any' type.
```

The import now has the same narrow `@ts-expect-error` declaration-boundary annotation used by
the existing Engineering test. No assertion, runtime behavior, compiler setting or product
interface changed. Log SHA-256
`02b545be88c6cda1919a1423c2c8c7c64502897a9bdb5b04837b986187384676`.
The first edit attempt's unique-match assertion refused the wrong imported symbol before any
write. A mistakenly sequenced fast invocation then repeated the same TypeScript failure;
its separate log remains in `step1-release-controls-typed-fast`. The corrected import is
`hasUnnegatedSentenceClaim`; a new fast run follows. No browser ran after either failure.


## Checkpoint 1 bulletin-control correction and current references — final fast PASS

The sole false clause among 196 aggregate release controls was the generic Travel Research
reach claim. The existing predicate recognized named drives but omitted that explicit generic
subject. Its one-line addition rejects unnegated reach expansion while accepting “never
extends” and “does not increase” permanent reach. The existing focused test executes Main's
actual release renderer plus the complete Glass detail/mutation expressions. All controls and
restoration pass; removing the added clause reproduces the sole historical failure. Focused
PASS **1 file / 8 tests**, with all 11 truthful, 14 unavailable and 13 Shipyard contradiction
rows independently retained.

Five current references now describe the actual Research/Scout/Meal/Chronicle owners, removed
player import door, current Guide split and strict inspection/Meal diagnostics. The original
2026-09-01 Survey evidence row stays verbatim beneath a separate current refinement; its old
certification is not applied to new semantics. Two current bulletin-hash statements now match
`379bb64ef214edb961813d069e8b0f95fcba21fc7564095cae0a4da136b09e70`; historical hashes stay intact.

Full corrected fast PASS: typecheck/artunused, **286 files / 2,964 passed / 1 skipped**,
four local workers. No game-source, producer/measurement, numeric ruler, timeout or hosted
setting change. Commit these completed corrections before the next clean-source browser run.

```json
[
  {
    "command": [
      "npm",
      "run",
      "typecheck"
    ],
    "exitCode": 0,
    "seconds": 2.381,
    "log": "1-npm.log",
    "sha256": "4ce11e8b8a14cc6283afc2585afaca07e681322648d1555920619e16fda9399e"
  },
  {
    "command": [
      "npm",
      "run",
      "artunused"
    ],
    "exitCode": 0,
    "seconds": 1.533,
    "log": "2-npm.log",
    "sha256": "0a00203248d2bce2fe82d1f427c268b10884560f6e7d3187b224c0c8cc2c028b"
  },
  {
    "command": [
      "npx",
      "vitest",
      "run",
      "--maxWorkers=4"
    ],
    "exitCode": 0,
    "seconds": 57.688,
    "log": "3-npx.log",
    "sha256": "e69f17bba996d002a9a407b1ec7d27f94a1a9175354f8ac1bb4a4f0f04538375"
  }
]
```
