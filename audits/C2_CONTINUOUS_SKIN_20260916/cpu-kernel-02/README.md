# C2 compact ARAP solve rows — September 16

The diagnostic `motion-02` capture passed Civet at 1.7 ms but fox reached 2.0 ms, failing the existing strict under-2-ms update gate. Both reached 60 fps. The preserved browser profiles identify `solveArapSkin` as the dominant cost; the remaining kernels are small. This is one bounded additional optimization, not a new backend or a reduction in motion or quality.

`arap-before.mjs` is the verbatim kernel used by motion-02. The optimized kernel compiles each movable solve row into a compact inventory containing its position index, degree, original adjacency offset, first eight neighbors and unchanged divisor. Each sweep handles four/eight-neighbor blocks without rediscovering their topology; wider rows preserve the ordered adjacency remainder. Every addition, division, traversal, rotation, pin, target, solver iteration and orientation check is unchanged. Candidate-10 is not rebaked.

`report.json` records exact output-buffer and solver-stat parity for 3,633 current poses in each of Float32 and Float64. Targets remain unchanged. The one-bit mutation fails comparison. `arap-kernel-parity.test.mjs` independently compares the retained kernel on degree-3/4/8/11 meshes, both precisions, empty/mixed/all pinned sets and repeated seeks; the six existing ARAP controls still pass, including impossible fixed folds, thin reflected triangles and atomic refusal.

```sh
node --test port/v2/tools/creature-animation/arap-skin.test.mjs port/v2/tools/creature-animation/arap-kernel-parity.test.mjs
node audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-02/compare.mjs /private/tmp/cf-arap-row-comparison.json
```

Warm Node CPU median milliseconds: Civet 0.878 → 0.836; fox 0.972 → 0.912; procedural 0.216 → 0.205. Native profiles, videos and the failed motion-02 report remain intact. These microbenchmarks establish a bounded computational improvement and numeric identity; the next real browser capture must decide the unchanged live frame-time gate.
