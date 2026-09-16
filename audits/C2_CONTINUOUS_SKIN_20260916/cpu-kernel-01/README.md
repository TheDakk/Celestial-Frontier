# C2 ARAP kernel optimization — September 16

The live Civet motion capture exceeded the existing 2 ms update budget. This bounded change precomputes invariant topology, omits unused pinned right-hand-side rows and redundant hard-pin writes, and accumulates four ordered neighbors per loop. It keeps the exact movable-vertex traversal, per-neighbor addition order, rotation arithmetic, solver profile, projection constraints, contact pins, and final shape refusals.

`arap-before.mjs` is the verbatim pre-optimization kernel. `compare.mjs` compares that source against the current kernel using candidate-10 and the current-producer-poses-v2 export. The output must be a new file:

```sh
node audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-01/compare.mjs /private/tmp/cf-arap-new-comparison.json
```

`report.json` records the first indexed-topology optimization. `report-unrolled.json` records the final source, including ordered four-neighbor accumulation. Final evidence: 3,633 current poses, each in Float32 and Float64, all output bytes and solver statistics identical; input buffers unchanged. A one-bit mutation is the failing comparison control. The 13 ARAP/compiled-field tests also pass, including impossible fixed fold, thin-triangle reflection, invalid-input atomicity and current-matrix mutation controls.

Final CPU medians in milliseconds: Civet 0.943 → 0.882; fox 1.033 → 0.959; procedural 0.230 → 0.216. These are warmed Node microbenchmarks, not native frame-time acceptance. Candidate-10, source art, clip curves, the compiled blend field and iteration counts are unchanged. The parent native capture must establish whether total live update time now meets the unchanged 2 ms budget.
