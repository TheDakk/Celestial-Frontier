# C2 guarded numeric kernel — September 16

The preserved unprofiled `motion-03` capture exceeded the live update budget despite the preceding dense native geometry gate passing. This bounded JS optimization changes only arithmetic implementation: precomputed reciprocal solve divisors; an ordinary-range square-root norm with robust `Math.hypot` fallback for extreme/underflow magnitudes; and exact no-progress termination for orientation sweeps. Solver profiles, maximum iteration counts, hard contacts, pose curves, geometry, source art and acceptance thresholds are unchanged. No backend or tool installation was added.

The reciprocal and norm changes alter double rounding. This is explicitly not an internal byte-parity claim. `arap-before.mjs` retains the prior motion-03 kernel; `arap-before-no-progress.mjs` retains the numeric implementation before exact no-progress termination.

`report-no-progress.json` is the final full comparison against the prior kernel: all 3,633 current poses in both precisions; all actual Float32 field buffers and every rendered part vertex byte-identical; maximum Float64 field difference 9.85e-13 native pixels, far below the proposed 0.001-pixel numeric-comparison guard. Rest and hard-pin targets remain exact. Actual part orientation, independent source-cut continuity and rendered paw contacts all pass. Solver statistics differ at roundoff scale, except orientation sweep counts, which may change when an area lies within roundoff of the existing floor. `report.json` retains the intermediate numeric-only comparison.

`orientation-roundoff.json` records the two fox frames whose sweep counts changed under the numeric-only implementation. `no-progress-effect.json` and its hash-bound receipt separately prove that exact no-progress termination removes 141 redundant sweeps across 20 fox samples (2,548 → 2,407), preserving every published byte and every statistic except the sweep count. A sweep may stop early only when no Float64 coordinate changes under `Object.is`, including signed zero. It still runs the final fold refusal; no tolerance is added to orientation or contact checks.

Final warm Node CPU median milliseconds: Civet 0.824 → 0.756; fox 0.913 → 0.824; procedural 0.205 → 0.204. These microbenchmarks are not a live frame-time pass. The parent native/capture run remains responsible for exact rest pixels, visual motion and the unchanged under-2-ms live gate.

The historical compact-row byte-parity test remains intact against its two retained kernels. Separate numeric tests cover exact Float32 synthetic outputs, bounded Float64 differences, multiple valences and pin partitions, extreme norm magnitudes, and refusal behavior. Real solver controls retain impossible fixed/reflected folds, thin-triangle reflection, partially pinned collapsed geometry, hard contacts and atomic failure. All 17 focused ARAP/compiled-field tests pass.

```sh
node --test port/v2/tools/creature-animation/arap-skin.test.mjs port/v2/tools/creature-animation/arap-kernel-parity.test.mjs port/v2/tools/creature-animation/arap-kernel-numerics.test.mjs port/v2/tools/creature-animation/compiled-skin-field.test.mjs
node audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-03/compare.mjs /private/tmp/cf-arap-numeric-comparison.json
```
