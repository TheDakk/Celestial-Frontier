# Civet body restoration and head detail motion — September 16, 2026

Nick identified missing body beneath the neck in the facing preview and authorized continued repair. The cause was concrete: the head-view `replaces` list hid the original neck part, which also contains substantial chest fur. A replacement head must not remove that body coverage.

## Result

The original neck stays visible underneath the source-backed forward-facing head. Head replacement admission now follows the actual joint graph and permits only parts owned by the head subtree; trying to replace neck/chest/body refuses before view allocation. The original head, jaw and ear parts are replaced, while torso, neck, chest and legs remain present.

The new profile now responds to existing earFarTip, earNearTip and jaw tracks through hash-bound source-space support regions. Pose-to-source rotation bases are declared in the view data. Local rotation fields are integrated in 32 fixed steps, with active supports recomputed after each preceding local deformation. This avoids the one-step surface inversion and the discontinuity caused by selecting active vertices only from their undeformed positions. There is no clock input, new creature curve, weakened joint limit, geometry clamp or folded-triangle waiver. It does not paint a mouth interior or claim a full head turnaround; the frontal source view is still not used in the films.

No master or kit bytes changed. No image generation, local-model run, Claude-owned module edit, ordinary-game promotion or main.ts hunk.

## Evidence

- `motion-01/report.json`: three actual ten-second clips at about 60 fps. A dense scan covers 601 poses per pairing (1,803 total), including head-surface orientation and opponent articulation.
- `facingCoverage` in that report: six native-size rendered comparisons at idle, anticipation, strike, impact hold, recoil and return. **Zero missing protected body pixels in every pose.** The old neck-hidden control loses 9,684–15,783 protected pixels on the same final poses. Protection counts range from 366,488 to 426,930 opaque body pixels; empty-ruler checks are enforced.
- `body-protected-idle.png`, `body-restored-idle.png`, `body-old-neck-hidden-idle.png`: native isolated geometry/pixel evidence without the arena hiding a gap.
- `detail-envelope-04.json`: all 36 combinations of ear ±0.3 rad and jaw through the producer's −0.4363323 rad extreme pass the source-mesh orientation check. Actual current motion is additionally checked natively.
- `tool-tests.txt`: 14 tests, including the actual former neck-removal declaration as a refusal control, hash/atlas checks, old straight-leg control, authored source-head envelope, detail motion/rest/deterministic seek, reflected-triangle controls, and existing left/right turn/contact behavior.
- `focused-tests.txt`: 8 existing aim/contact/performance tests. Game typecheck and root validation remain separate receipts; root fingerprint unchanged.

Whole-frame CPU p95 in the new films: Civet pair 2.9 ms, fox pair 2.6 ms, procedural pair 1.7 ms. These include the scene and rendering work; existing selected-left-rig timing fields still do not measure the added head and opponent independently. No physical-phone or clean-signed-source performance qualification is claimed.

## Diagnosed failures retained

`native-01` isolates the successful body repair before new facial detail motion. `native-02` refuses triangle 741 near the jaw: the source pose basis was inverted, and abrupt one-step local blending folded geometry. `detail-envelope-01` through `03` retain source-support failures. Final source support `head-04` plus recomputed active support ownership passes `detail-envelope-04`; `native-03` independently passes actual body coverage and motion before the full `motion-01` films.

`head-tests-02.txt` exposed output mutation before nonfinite-input rejection; input validation now precedes output publication. Later successful receipts do not overwrite that failure.

## Viewing and next work

Review at `http://127.0.0.1:49816/neck/` while the local preview server runs. It provides Before/After switching at the same playback time. Temporary MP4 viewing copies live under `/private/tmp/cf-animation-preview-20260916/neck/`; canonical WebM films and native stills are under `motion-01/`. Original facing preview remains available at `/facing/`.

This closes the observed missing-body defect on the tested poses, not universal animation or final visual acceptance. Next larger gates remain source-backed head-view transitions, actual rendered Platypus contact/joins, family-specific painter coverage, ordinary-game integration and physical iPhone qualification. Nick owns visual acceptance. GitHub step none; PR42 parked.
