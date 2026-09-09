# Ordered individual species adapter — 2026-09-09

This source batch extends the optional local landfall adapter from one anatomical image to six
ordered whole-image guides. It does not grant pixel fidelity, mobile performance or art acceptance.
No model inference, browser launch, download, installation or hosted action was run by this owner.

## Product contract

`landfall-conditioning.ts` keeps the V1 compiler and canonical output bytes unchanged, and adds
`buildLandfallConditioningV2(snapshot)` / `buildCanonicalLandfallConditioningV2(request, liveRoster)`.
The second retains live-brand admission; both reuse the existing exact Earth epoch-0/full19 gate.
The V2 schema is `cf.art.landfall-conditioning.v2`, with recipe prefix `lfc2:` and unchanged
`lfas1:` snapshot identity. Stable reference slots follow the accepted display order:

| Image | Named subject |
| --- | --- |
| 1 | Civet |
| 2 | Persimmon |
| 3 | Platypus |
| 4 | Frog |
| 5 | Devil's Club |
| 6 | Cranberry |

Every requirement contains its complete `subjectIdentityKey`, full genome, named diagnostics and
matching resident. No genome, lineage, biome, save, accepted placement or gameplay clock changes.
`qualityAccepted:false`, `referenceStatus:unresolved` and the explicit absence of a fidelity
guarantee remain. Text identifies each image's subject; the worker has no instance masks or boxes.

`LocalAiRuntimeConfigV1.reference` remains the required historical single-reference carrier.
Its optional `references` selects V2 only when all six records are present and valid. Each record:

```ts
{
  imageIndex: 1, // ordered 1..6, no duplicates or omissions
  url: '/__local_ai/references/civet.webp',
  sha256: '<SHA-256 of encoded source image bytes>',
  width: 480, height: 320, // prepared encoder geometry
  sourceWidth: 768, sourceHeight: 512, // actual decoded source geometry
  speciesVisualKey: '<complete canonical individual identity>'
}
```

The other records use their own exact source dimensions, encoded hashes and complete identities.
`validateLocalAiReferencesV2` requires six unique identities/hashes, source aspect3:2, safe integer
source dimensions1..8192 and area≤16,777,216, fixed480×320 preparation and ordered indices1..6.
`localAiReferenceBindingV2` serializes the same fields excluding URL in a fixed property order.
The controller admits only same-origin routes and exact canonical subject identities.

The model recipe is `cf.ai-landfall-render.v2`; it contains complete V2 conditioning plus ordered
`references` bindings. Existing model revision, manifest, seed133, four steps and1024×576 output
remain. Before work, the runtime rederives the entire canonical V2 conditioning and compares exact
bindings. It fetches/hashes/decodes/encodes one guide at a time, checks actual source geometry and
closes its bitmap/scratch canvas. Completed source bytes leave scope before the next fetch;
JavaScript GC timing is not guaranteed. Six307,200-byte latent buffers (1,843,200bytes) are retained
and then transferred in order with the text embedding to the unchanged worker. One stage worker
runs at a time. Late hash/geometry/cancel/worker failures stop subsequent references and publication.

Six guides increase denoiser image tokens from2,904 to5,904 (including the2,304 output-image tokens).
With512 text tokens, total token context grows from3,416 to6,416. This is not a cost-neutral change;
actual GPU memory, latency and phone behavior need measured evidence. No performance claim follows
from the bounded reference-fetch/latent retention policy.

## Historical original compatibility

Default single-reference preparation is byte-identical to the prior native-game02 canonical V1
conditioning. When V2 is enabled, `find` and `inspect` first read the current exact recipe. If absent,
they may rebuild the exact historical V1 input from the same admitted snapshot, model revision,
derivative choice and retained historical reference. Existing store input/content verification
still owns every read. A mismatched world/environment/snapshot, changed recipe bytes or unknown
schema cannot use this fallback. No original-store schema, index, record, deletion or recompression
changes. This is deliberately scoped V2→V1 compatibility, not general cross-model discovery.

## Verification and first failure

`controls-01` retained all six measured source/test files before running the three focused suites:
63 PASS / one fixture FAIL. The negative fixture directly mutated a frozen reference binding before
runtime admission. `FIXTURE_CORRECTION.json` explains the correction: detach bindings through the
actual JSON transport, then alter those detached fields. Product guards were unchanged.

`controls-02`: all64 adapter tests plus34 existing PWA offline tests PASS (98 total), followed by
all three TypeScript programs PASS. Exact commands, exit codes, raw logs and measured file hashes
are retained. Its source inventory includes the three adapter owners/tests and the PWA test; the
mobile owner's separate receipt binds its actual PWA builder source.

A subsequent read found that identical synthetic encoder values demonstrated tensor count and
transfer but did not independently prove final slot order. The same positive runtime case now
uses distinct1..6 encoder values and asserts each final slot's307,200 bytes and480×320 geometry.
The runtime GC comment was also clarified; runtime behavior is unchanged by that wording update.
The final focused result is recorded in `controls-03`.

All synthetic workers/images and storage fakes are explicitly labelled. V1 retained conditioning
bytes are compared to immutable native-game02 recipe; current image bytes/visual approval and
actual six-reference inference belong to the parent batch's separate reference/native receipts.


## Reviewed resampling and storage-control corrections

The reference-set manifest names browser-high-quality resampling. The V2 preparation now explicitly
sets imageSmoothingEnabled=true and imageSmoothingQuality=high before drawing. V1 preparation keeps
its historical browser default. The same positive runtime cases assert both policies separately.

Source review of the actual install path found each progress refill replaced the model-storage
`details` with a closed element, making Pause unstable. The controller now owns native `toggle`
state separately for Notifications and Survey using `data-ai-model-storage`. A captured listener
updates only connected details under the corresponding real surface. It never refills, moves
focus/scroll or overrides an explicit user collapse. Subsequent HTML preserves the state through
install/progress/pause/verify. Pagehide removes the listener, aborts active delivery and closes the
inspector. This does not imply native geometry/physical-phone qualification.

`controls-04`:46 runtime/controller tests PASS, followed by a TypeScript fixture failure from a new
direct jsdom import without declarations. Its exact sources, logs and correction note are retained.
`controls-05`: the existing createRequire/typed-Document fixture pattern passes the same46 checks
and all three TypeScript programs, with no package/dependency change. Updated final-source.json
binds these reviewed product files. Native delivery evidence is a separate parent-run scope.
