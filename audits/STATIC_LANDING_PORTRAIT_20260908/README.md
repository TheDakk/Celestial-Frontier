# Static Earth landing painting — observer preparation

Prepared 2026-09-08; **NOT INSTALLED; native observer/chain NOT RUN**. The generated
original is retained, but explicit ImageMagick resize/encoding permission remains pending.
The six runtime candidate files are preserved under [prepared-source](prepared-source/)
and as [prepared-runtime.patch](prepared-runtime.patch). Existing live files were restored
to HEAD and new runtime files are absent; no placeholder digest or unresolved asset is installed.

[The original preparation receipt](prepared-runtime.json) retains the first wrong-path
apply-check failure. [The corrected check](prepared-runtime-check.json) passed against the
actual patch once, without applying it. A clean apply check is not compilation or runtime proof.

The separate [math-foundation static chain](../CIVET_PAINTED_PARTS_20260908/static-corrected-results.json)
passed all three V2 TypeScript programs and root validation after restoration. The retained
candidate lives outside V2 TypeScript inclusion and was **not validated by that PASS**.
Its focused tests, asset build and native checks remain unexecuted.

Next required sequence: obtain the requested resize/encoding permission, export the intended
960×430 asset, apply the reviewed patch with its valid asset digest, freeze the resulting source,
then run the focused candidate tests, static checks, one evidence build and the bounded native
chain below under parent scheduling. Stop on the first red. No existing receipt is promoted to
candidate acceptance, and neither native runner should run against the restored live tree.

`native-landing-still-runner.mjs` is an independent copy adapted from the retained
[settled Earth observer](../AV_EARTH_LAYERED_SCENE_20260908/native-earth-layers-settled-runner.mjs).
The original remains unchanged. `native-landing-still-chain.mjs` runs desktop
1440×1000 at DPR 1, phone 390×844 at DPR 2, wrong-asset fallback and default fallback,
in that order on four fresh origins. It stops on the first nonzero/timeout,
ambiguous report or source/dist drift. Each observer has a 90-second native-work
bound; the child process limit is 150 seconds including startup/cleanup.

The parent supplies one frozen evidence dist, a new output directory, the shared
foreground and checkout leases, and approved macOS browser execution outside
Seatbelt. No runner acquires nested locks or builds/tests sources.

Expected runtime contract:

- `?paintedlanding=1`, variant `painted-earth-civet-landing-v1`, one actual labeled
  `earth-painted-landing-still` sprite backed by one opaque 960×430 owned canvas.
- Exact native Earth Survey/Land, one durable safe-Earth receipt, same full
  navigation address/environment/profile; the actual Planetside DOM retains
  count 19 and the canonical full-roster fingerprint. All 19 genome equality and
  each-resident mutation rejection belong to the source-bound focused admission
  tests retained at [prepared-source/port/v2/tests/painted-earth-landing-binding.test.ts](prepared-source/port/v2/tests/painted-earth-landing-binding.test.ts)
  (application and execution pending). No private runtime roster or mutation hook is introduced
  or claimed.
- Actual Pixi geometry independently agrees with the existing upper-chrome to
  Biosphere DOM band. The same composition acceptor receives the baseline,
  hidden sprite, visible globe/cloud, old H÷2 placement, and restored observations.
  Full-stage paint deltas and exact restores supplement 35 native canvas hit
  samples and unchanged DOM control rectangles. One full opaque image replaces
  the earlier two-layer expectation; no individual-resident proof is asserted.
- Wrong-asset mode fulfils only the exact new image URL with the prior valid
  `earth-riverbank-v1.webp` bytes, correct MIME/200 and a different SHA. The loader
  must report `painted vista SHA-256 mismatch`, make one fetch and retain canonical
  fallback. Default mode must make zero new painted-asset requests.
- Native Escape (desktop) or Survey/Leave world (phone) retires the actual sprite,
  texture/source/lease and shrinks the owned still canvas to 1×1; fallback keeps
  its existing 960×430 cache. Loader abort/decode/current/last state and the cloud
  container's actual retirement remain measured.

This is a bounded optional static landing pilot. It does not establish human art
acceptance, complete anatomy from pixels, Compendium portrait extraction, live
creature animation, full battery certification, physical iPhone/Safari or native
GPU-driver memory release. Preserve prior D-9e and verification blockers in the
root handoff; this packet does not supersede earlier evidence.
