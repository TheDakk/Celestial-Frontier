# Painted variations in motion — September 16

Review: http://127.0.0.1:49816/painted-motion/ . Three paintings of two actual game
genomes now have native ten-second motion films. The approved seed10271 candidate02
is preserved; two new authoring calls produced a broader seed10271 variant and a
crystalline seed10032 variant. These are candidate art, not newly accepted masters.

| Painting | Final fitted rig | Final capture | Rig update p95 | Encoded duration / frames |
|---|---|---|---|---|
| Approved direction, 10271 | rig-approved-05 | native-approved-05 | 1.3 ms | 10.099 s / 606 |
| Broad rosette, 10271 | rig-broad-02 | native-broad-03 | 1.6 ms | 10.099 s / 606 |
| Crystalline, 10032 | rig-crystalline-02 | native-crystalline-02 | 1.7 ms | 10.100 s / 606 |

All three recorded approximately60fps. Exact rest and final rest differ by zero
channels from keyed source. Each passes484 individual-clip and601 blended-sequence
source-join/shape samples.602 rest/presentation samples fit inside the review frame;
the previous rest-only framing fails for every candidate. The separated-mesh control
fails by approximately12.54px.36 final leg parts pass the detached-island check.
See results.json and each source-hashed native report. These are dirty diagnostic
runs, not release certificates. Timings are this Mac, not the iPhone.

## Defects corrected

- Native-alpha PNGs were re-keyed using invisible RGB. Authored intake now preserves
  delivered RGBA, refuses empty/mixed-border images and retains the old opaque-key
  result exactly. The former path turns a256-pixel subject into900opaque pixels.
- Review framing considered only the rest silhouette. It now fits actual deformed
  vertices across the complete sequence and tests the old framing as a control.
- A mask correction exposed a2,792-pixel foreleg fragment mistakenly assigned to a
  hind leg. Corrected depth priority and polygon boundaries remove cross-limb and
  tail-to-leg assignments without deleting paint. The former fragment passes rest
  and seam checks but fails the new island test. All intermediate masks/captures
  are retained; only the final directories in the table are review candidates.
- The preview server ignored Range requests. The replacement loopback server gives
  correct206/416 responses. The page uses one video, explicit Play, separate stills,
  direct links and visible error handling. Embedded playback was verified. The
  initial sandbox connection failure was wrongly described as an outage and was
  corrected; the exact origin of the user's earlier blank frame is not proven.

## Scope and remaining qualification

The source genomes, named Earth anatomy, accepted game art, kit and motion producer
are unchanged. Authored per-master landmarks/masks differ; clip curves do not.
This establishes shared motion over three painted inputs, not automatic extraction
of arbitrary generated anatomy. The new crystalline output delivered transparency
despite the key request; margins/key uniformity are not master-intake accepted.
Body-card timing remains genome-derived. Planted paw contact, hidden-view turns,
open-mouth interiors, source-to-paint proportion conformance, other families,
ordinary-game integration and the physical phone still need their own evidence.
Visual quality remains Nick's decision; no generic placeholder is called complete.

## Reproduce

Run prepare-painted-variation.mjs with the corresponding final observation JSON and
a new output directory. It hashes the painting and observation, writes22parts and
one deterministic atlas, refuses detached limb islands, and builds continuous skin.
Run family-review/native-runner.mjs under tools/with-toolchain-lock.mjs with the rig,
port/v2/apps/game/src producer, and a new capture directory; on macOS use approved
out-of-sandbox execution. Do not overlap native owners. No inference is involved.

Twelve focused tool tests and root validation pass (tests.txt/root-validation.txt).
Review builder: port/v2/tools/family-review/build-painted-preview.mjs. Server:
`node port/v2/tools/family-review/review-server.mjs /private/tmp/cf-animation-preview-20260916 49816`.

OpenAI/Codex continues locally on openai/mac. Claude need not open or sync now.
Review only when Nick requests it; GitHub step none, PR42 parked, no history rewrite.
