# C2 bounded Wasm sweep leaf — September 16

The preserved unprofiled motion-04 trace still exceeded the live CPU gate. This change moves only the repeated ordered symmetric sweep loops into a 1,301-byte WebAssembly C leaf. JavaScript still owns target assembly, rotations/norms, projection, hard contacts, shape checks and publication. The prior JS sweep remains the actual fallback. No iteration count, pose, solver profile, constraint, threshold, geometry or painted source changes. No software, linker, package or service was installed.

The installed Apple Clang compiles `arap-sweep.c` to a relocation-free Wasm object with `-O3 -ffp-contract=off -fno-fast-math -fno-builtin -nostdlib`. `build-arap-sweep.mjs` is a strict artifact adapter, not a linker: it admits exactly one seven-i32-parameter void function and `env.__linear_memory`, refuses relocations, imported functions, globals, data, tables and other sections, strips permitted compiler metadata, and adds only the sole function export. The checked-in `.wasm` and generated JS byte module are byte-identical on rebuild (`reproducibility.json`).

Each rig scratch receives fixed, private Wasm memory containing positions, RHS and snapshotted row data. JS and the leaf use the same Float64 views; there is no per-pass copy. A single exact semantic admission check runs on that topology before exposing the kernel. Missing Wasm, blocked compilation/memory or a failed check selects the unchanged JS implementation. This is normal runtime behavior, not a proof-only warmup. `ArapScratch.sweepBackend` records the actual per-scratch selection as `wasm` or `js`; the public CreatureRigV1 contract is unchanged.

`arap-before.mjs` retains kernel03. `report-final.json` compares all 3,633 current poses in each of Float32 and Float64 against it: every field buffer, actual rendered part buffer and statistic is byte/value-identical; rest and hard pins exact; independent source-join, contact and fold checks pass. Every tested scratch reports `wasm`. The earlier `report.json` is retained; the final report refreshes provenance after snapshotting the row count so detached/mutated caller source arrays cannot change the leaf inventory.

The five new controls exercise the real leaf, exact fallback with Wasm absent or memory denied, an actual valid add-to-subtract bytecode mutant rejected by semantic admission, topology snapshots and malformed rows, and forbidden artifact sections. The existing reflected/thin/collapsed-fold, pin, exact no-progress, atomicity, historical exact-arithmetic and numeric controls still pass: 22 focused tests total.

Final warm Node CPU medians (ms): Civet 0.748 → 0.524; fox 0.821 → 0.582; procedural 0.185 → 0.131. This is roughly 29–30% less kernel time, not a native/live acceptance claim. The parent native/capture run must record the actual loaded backend and decide the unchanged under-2-ms gate.

```sh
node port/v2/tools/creature-animation/build-arap-sweep.mjs
node --test port/v2/tools/creature-animation/arap-skin.test.mjs port/v2/tools/creature-animation/arap-kernel-parity.test.mjs port/v2/tools/creature-animation/arap-kernel-numerics.test.mjs port/v2/tools/creature-animation/compiled-skin-field.test.mjs port/v2/tools/creature-animation/wasm-arap-sweep.test.mjs
node audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-04/compare.mjs /private/tmp/cf-arap-wasm-comparison.json
```
