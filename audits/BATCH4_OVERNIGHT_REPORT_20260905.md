# Batch 4 overnight report — 2026-09-05

This is a live checkpoint report, not final acceptance. Base develop:
`9ea01041dcdc711190bbf909ea8bb743cd993734`; owned review branch:
`openai/review-batch4-gameplay-20260905` (OpenAI/Codex, macOS,
`/Users/nick/Projects/celestial-frontier-openai-mac`). Clean `openai/mac` remains `84b6f22`.

| Step | Commit SHA | Pushed UTC | Fast gates | Browser gates |
| --- | --- | --- | --- | --- |
| 1 signed core integration | Real merge candidate, SHA follows after browser gates | Pending | Typecheck/artunused PASS; 286 files / 2,951 passed / 1 skipped (38.13s) | Pending on clean committed source |
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
