# Universal animation — shared pose foundation, September 16

This batch removes four-leg assumptions from the shared joint evaluator. It does
not declare other families visually finished. The current painted proof remains
Civet, fox and one procedural quadruped; the other thirteen interoperability
records are explicitly synthetic fixtures from the read-only motion producer.

## Implemented

- `skeleton-pose.mjs` compiles a supplied parent-first joint graph, exact normalized
  landmark inventory and explicit body axis. Child poses inherit transforms;
  translations use that family's body length. The root translation applies once.
  Missing pose keys return to rest. Template and landmark inputs are snapshotted.
- `creature-rig.ts` now uses that evaluator in its actual rendering path. Its
  hash-bound quadruped asset admission and all shape/contact limits remain in
  force. A new family cannot bypass those checks by supplying arbitrary joints.
- Malformed graphs, duplicate/foreign/prototype keys, missing parents, cycles,
  invalid landmarks, absent/degenerate body axes and nonfinite or excessive
  offsets refuse before any display publication.
- The optional quadruped painter observer now refuses six/eight-legged inputs
  before painting. Previously it could overwrite fore/hind entries and describe
  extra-legged paint using four chains. Ordinary drawing of those creatures is
  preserved; correct extra-leg records and templates remain future integration.

## Evidence

`family-interop-01/report.json` binds the actual producer templates/actions and
corrected GSAP adapter. All 14 templates, 161 action entries and 4,644 sampled
poses pass independent forward-kinematics comparisons, exact rest, historical
seek replay, one publication per frame, foreign-joint refusal and the rejected
root-translation broadcast control. Maximum positional disagreement is
8.953072389518057e-16 normalized units. This proves joint/pose interoperability,
not painted masks, skin fit, contacts, visual quality or phone performance.

The live fish inventory has 13 joints including root; the historical LOG-A11
row's count of 14 is a documentation count error. Its listed names and the
actual producer agree on 13. Claude-owned audit/contract files are unchanged.

121 Node tool tests, 20 focused runtime/observer tests, game and package
TypeScript checks, and root validation pass. Root retains 1,010 successful Earth
renders and its unchanged 50-probe v1.0 fingerprint. Unit tests take no checkout
or toolchain lock. Native checks and captures are recorded separately below.

`FAMILY_COVERAGE.json` separates shared pose support from actual painter,
asset-intake, visual and device qualification. No ordinary-game caller is added,
no new kit wording, painting, inference or Claude-owned module change occurs.
Existing toolchain versions and the uninterrupted startup receipt are retained.

## Next implementation boundaries

1. Add actual winning-painter geometry/part observers in the approved family
   order, starting with bird after the bounded quadruped proof. Measure what is
   drawn: joint inventory, appendage counts, material and depth ownership.
2. Add source-bound family asset admission and skin/contact adapters; connect
   them to the shared evaluator. Do not infer unseen parts from a portrait.
3. Prove independent real reuse controls and proportion/material extremes for
   each family. Exercise both animated opponents together in ordinary battle.
4. Qualify the physical iPhone separately at its approved budget. New views,
   painted classes, sheets, sounds and kit wording retain Nick's review stops.

No new branches or GitHub writes. PR42 remains parked. The working batch is on
`openai/mac`; signed base is `b79fd32e`, 117 ahead cached origin/openai/mac and
228 ahead cached origin/develop. Signing has not been retried without a changed
agent/approval state. Clean signed-source qualification remains pending.

## Native regression check

All three native subjects pass 1,201-pose geometry/contact checks and exact
rest/final-rest equality. All 30 named PNGs match the previous C2 native run
byte-for-byte (`native-01/image-parity.json`). The unprofiled ten-second captures
pass their existing timing and media checks:

| Creature | Captured fps | Inclusive creature CPU p95 |
| --- | ---: | ---: |
| civet | 60.003 | 1.40 ms |
| fox | 60.002 | 1.70 ms |
| procedural | 59.903 | 0.90 ms |

These are dirty-source diagnostic results, not signed-source qualification or
Nick’s visual acceptance. The previous six C2 review ZIPs retain their original
snapshot; use this batch’s addendum to review the shared-evaluator change.
