# Independent offline runner review — 2026-09-09

Reviewer: OpenAI/Codex mobile-delivery agent. Read-only source review on macOS,
`/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`, starting signed
`8c10463a7b0330e12f5ca42f958c85ab9b7eb6a3`. No tests, native browser, model access,
locks, hosted actions or implementation edits were performed by this reviewer.

Reviewed sources after the correction below:

| Source | SHA256 |
| --- | --- |
| `tools/local-image-generation/offline-landfall-proof.mjs` | `18d97a6e22249be19026dccd91e66c989fdb1696b96110f6721603f5e7abb29f` |
| `tools/local-image-generation/run-mobile-model-delivery.mjs` | `526e1864c1a2aee2302bbf2e9f96e7e2382755540cccc8180f5773861602a488` |

One material observer gap was found and corrected by the owner before this receipt:
unchanged empty worker-startup arrays had been sufficient to claim no reload
inference. The actual earlier offline module proof had no stage-worker entry in
its Network ledger, and earlier generation lacked discovered worker IDs, so this
could have passed with a blind instrument. The corrected helper requires startup
evidence to increase during known inference before treating it as available,
retains all before/after lists, and rejects any subsequently observed new startup.
When that positive observation is unavailable, `noReloadInference` is null and
`workerStartupEvidenceAvailable` is false. Repeated route/original/jobs=0 observations
support the narrower `noReloadJobObserved` result. This is not complete native worker
enumeration, and no dedicated-worker debugger attachment or constructor replacement
was introduced.

No other material flaw found in this bounded review:

- Explicit installation, exact activated-controller checks, normal reload, offline
  server closure, native verification and existing Blob readback remain in the owner.
  Only service workers receive Network/Fetch debugger commands. The module-only proof
  uses the actual existing pre-GPU rejection message; default invocation still performs
  no inference. The new helper runs only with the explicit boolean landfall option.
- The helper conditionally closes Notifications, selects only the canonical Earth
  Survey card, uses trusted native Land, and checks committed Earth scene, idle gameplay
  transaction, one unchanged V2 job, portable q8=false, real progress and visible ETA.
  Model execution requested and drawing-step observed remain distinct evidence.
- Native Inspect invokes the product's read/hash owner. The helper reads the already
  displayed Blob before Close, verifies PNG dimensions/content digest and the full input
  identity in originalId, rejects a changed digest, and performs no storage injection or
  unavailable static /src import. View and Survey inspection after normal offline reload
  must retain the same original bytes and ID with no job at both observations.
- Failures propagate to the owner receipt. It independently closes target/browser/owned
  profile and servers, validates mirror integrity, rechecks package/source hashes and
  releases its lock. An active worker on failure is removed with the owned browser.

This review does not claim native success, model allocation safety, latency, species
fidelity, phone/CDN support or distribution approval. The real portable-model attempt
remains responsible for those measured outcomes; its per-stage product timeout stays
600 seconds and the helper has one 15-minute observation bound without retry.

## Changed live-install observation — native02 preparation

Native01 remains FAIL: its live directory inventory encountered `NotFoundError` while
installation was writing, before Pause or the Land helper. The receipt did not identify
which entry disappeared; it establishes neither data loss nor a product storage cause.
Its 31 measured source hashes and complete cleanup are retained, together with the exact
failed runner/helper in `native-01/failed-observer-source/`.

The changed runner has SHA256
`b7737886109f93bf08bb95dc71742ca104fb7353ecb9edc72379e9c2a241f353`;
the helper SHA above is unchanged. Bounded read-only review found no material flaw in
`readNativeCommittedPrefix`: it waits for the exact active-manifest marker and named
fourth 1 MiB chunk without enumerating a changing directory. Only expected missing/empty
live entries yield pending. Invalid markers, invalid committed chunk geometry and unrelated
storage errors still fail. After native Pause settles, the complete inventory remains
strict, and both the paused and fully installed inventories must retain the observed
attempt ID. This only repairs observation timing; it does not relax model verification.
The owner reports 15 runner controls passing, including positive/negative prefix controls;
this reviewer did not execute them. Native02 is a new changed attempt, not a retry that
relabels native01, and its result must be read separately.
