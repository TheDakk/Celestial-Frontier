# C2 guarded normal-pass leaf — September 16

The preserved motion-05 capture met the Civet budget but fox still reached 2.1 ms. This bounded extension uses the same compiled leaf and fixed memory for local rotation, RHS assembly and symmetric sweeps. JavaScript retains input validation/normalization, the unchanged robust normal pass, orientation projection, hard contacts, all final shape checks and publication. There is no new backend/module system, package, installation, motion change, iteration reduction or threshold relaxation.

The 2,019-byte leaf exports exactly `pass(i32 × 13) -> i32`. It returns 1 after a normal pass. If any dot/cross norm lies outside the existing guarded range, it returns 0 before any position or RHS write; JS recomputes the entire robust pass. Rotation scratch may contain a prefix and is wholly overwritten by fallback. Target, position, rotation, RHS and invariant arrays share one fixed private memory; no per-frame copy is introduced. `__builtin_sqrt` compiles to the Wasm operation with `-fno-math-errno`, `-ffp-contract=off` and `-fno-fast-math`. Strict object admission still refuses relocations, global/data/table sections and imported functions, and requires the exact signature and return type. `reproducibility.json` confirms byte-identical rebuilding using the installed compiler.

The real bytecode mutation control found that a rest-only rotation admission pose could conceal a corrupted cross-term. Admission now uses a fixed non-identity affine pose on the actual topology, then compares position, rotation and RHS exactly with the independent JS calculation. The add-to-subtract module mutant is now rejected to JS fallback. This one-time semantic admission is normal runtime behavior and is excluded from diagnostic counters; it is not a capture-only warmup.

`ArapScratch` exposes readonly `sweepBackend`, `normalPasses` and `robustFallbacks`. Counts are live per scratch: completed leaf passes and guarded leaf refusals respectively. A wholly JS scratch has zero leaf counts. CreatureRigV1 remains unchanged.

`arap-before.mjs`, its helper/embedded bytes, C source and binary retain kernel04. `report-final.json` binds both that baseline and the final current source: all 3,633 poses in each precision have exact field buffers, exact rendered part buffers and identical statistics. Rest/pins remain exact and independent source joins, rendered contacts and folds pass. Each creature/precision uses 4,840 normal leaf passes and zero robust fallbacks. The intermediate report is retained.

Focused controls cover absent Wasm, denied memory, a valid mutated binary, invariant snapshots, malformed input/forbidden sections, robust extreme recovery, and a late failure in a disconnected component. The latter proves the first component reaches rotation calculation while neither position nor RHS is changed when the later component refuses. Existing thin/reflected/collapsed-fold, hard-pin, no-progress, atomicity, historical arithmetic and numeric controls remain green: 24 focused tests total.

Final Node CPU median milliseconds, compared with kernel04: Civet 0.543 → 0.425; fox 0.580 → 0.466; procedural 0.135 → 0.106 (about 20–22% less kernel time). These are microbenchmarks. Actual loaded-backend native evidence and the unchanged live under-2-ms gate remain the parent's capture responsibility.

```sh
node port/v2/tools/creature-animation/build-arap-sweep.mjs
node --test port/v2/tools/creature-animation/arap-skin.test.mjs port/v2/tools/creature-animation/arap-kernel-parity.test.mjs port/v2/tools/creature-animation/arap-kernel-numerics.test.mjs port/v2/tools/creature-animation/compiled-skin-field.test.mjs port/v2/tools/creature-animation/wasm-arap-sweep.test.mjs
node audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-05/compare.mjs /private/tmp/cf-arap-normal-pass-comparison.json
```
