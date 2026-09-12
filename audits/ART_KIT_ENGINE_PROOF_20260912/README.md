# First Art Kit v4 engine proof — 2026-09-12

Status: prepared; native inference not yet run. Source and fitted inputs must be committed
before the one measured run. No painting or phone performance is accepted.

The first twelve masters and review sheets remain in ../ART_KIT_ENGINE_FIRST_20260912.
This directory preserves derived inputs only: source originals remain unchanged.
`prepared-manifest.json` records original/PNG/raw RGBA hashes and offline ImageMagick
fitting operations. `recipe.json` is compiled from canonical Earth data, never a hand-typed
system card. Its SHA-256 is 497dbf701285e6fdb90b8522b712b07a26e054b4c4b72b79807dc2547d13dac9.
`compiler/` retains authoring source provenance; `kit-client.mjs` bundles the app-owned
warm client alone, not the game or a delivery pack.

## Run boundary

One native run, no sweep/retry. Settings: 1024×576 painting, 384-square organism passes,
seed133, four steps at strength0.2, one finisher step at0.08. Six exact canonical residents
are placed in depth order on the Earth plate. Atlas conditions each cut-out; triptych
conditions the finisher. Placement boxes are pre-finisher geometry, not automatic
post-finisher segmentation or identity acceptance.

From the repository root, after a signed clean source commit, native browser execution:

```sh
node tools/local-image-generation/run-kit-engine-proof.mjs audits/ART_KIT_ENGINE_PROOF_20260912 audits/ART_KIT_ENGINE_PROOF_20260912/native-01
```

The runner verifies the existing pinned model cache, serves exact local inputs and model
files, records source hashes, progress and renderer heap observations, and saves raw
organism captures even if the isolation-key gate later fails. Four warm sessions and
encoded reference caching belong to the worker. Expanded transformer operands exist
in worker memory only; storage writes for expansion are zero. No old --landfall/--variant
command, integrated chain, pack, GitHub write or native prompt sweep is authorized.

## Text capacity

Nick requested 512→5120 tokens. The complete kit prompt is never truncated. Actual
wrapped token length is padded only to the next16 positions, not always5120. ONNX
input dimensions are dynamic; native capacity/performance are unqualified before this
run. Float16 embeddings alone rise from7.5MiB at512 to75MiB at5120; attention intermediate
memory and time also grow. Historical512-token diagnostic contracts remain unchanged.

## Checks

- worker-tests.log:17 PASS, including two simulated landings with four total session
  creations, one encoder, six organism passes + one finisher each; cache-bypass mutant
  fails the same reuse oracle. Overflow5121, key/background, expansion/hash and shape
  controls cover rejection paths; existing exact first-step diagnostic checks pass.
- compiler-runtime-tests.log:23 PASS, including full kit order/source mapping, warm
  Worker reuse, cancellation/new-worker and wrong output geometry rejection.
- typecheck.log: tsc PASS. validate.log: root validation PASS, exact50-probe baseline.
- No unit test acquires the checkout lock. Short authoring builds and the actual native
  runner do; test suites exercise isolated fakes and pure compiler data.

These checks do not qualify a native painting. Normal-game V1/V2 action wiring and
replacement/removal of its old OPFS layer remain pending, as do the remaining Part K
integration defects. Input anatomy/style findings remain open. First engine painting
acceptance gates animation proof, then the rest of the library.
