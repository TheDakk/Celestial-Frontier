# Local model delivery — September 9, 2026

Implemented the opt-in browser delivery/storage component, exact pinned runtime manifest, and incremental SHA-256 owner. This is installation infrastructure. It does not approve the model, a generated painting, a phone, or automatic downloading. Main/provider integration is owned by the parent batch.

## Verification

- [First focused run](controls-01/result.json): **31/32 passed**, retained unchanged with [failed fixture source](controls-01/failed-local-model-delivery.test.ts). The excess-body fixture could reject its entire first stream chunk before persisting a prefix, so its following request was legitimately a full GET. The test incorrectly assumed that request was a resume. No delivery code changed for this failure.
- [Corrected focused run](controls-02/result.json): **32/32 passed**. The resumed-Range control now independently cancels after one committed chunk, asserts `Range: bytes=1048576-`, rejects a server that ignores it, then proves restoration. The excessive-body refusal remains separate.
- [Adapter syntax and scoped strict TypeScript](adapter-checks-01/result.json): **PASS** for the audit runner/entry and the three delivery/hash/manifest sources. This is not the entire concurrent game build.
- [Native OPFS receipt](native-01/result.json): **PASS on first native execution**, eight observations and five trusted clicks on isolated desktop Edge `152.0.4191.66`, CDP `1.3`. [Native review](native-01/REVIEW.md) states exact outcomes and limits.

## Installation contract

`createLocalModelDeliveryV1({manifest, baseUrl?, onStatus?, ...})` exposes `install({signal?,restart?})`, `verify({signal?})`, `status()` and `openFile(path): Promise<Blob>`. A newly opened instance must verify actual stored chunks before `openFile`. No caller is entitled to readiness merely from a marker. The source-derived default manifest has 20 required runtime files, **6,691,020,416 bytes**, revision `3bffc0efef1d9f84727036cdbc44df3b6ab51131`; it excludes the upstream README only. The default source is that exact Hugging Face revision. An explicit loopback `baseUrl` supports an isolated development source. Creating the component does not fetch weights.

Files stream into immutable OPFS chunks of at most 1 MiB. The owner rehashes the stored prefix before exact HTTP Range resume and hashes read-back committed bytes before publishing the tiny ready marker. Each write uses the native writable stream close boundary. Web Locks serialize this owner across tabs; origin storage estimates and actual quota failures stop installation without eviction. Failed attempts and earlier verified installations remain present. Partial storage is reusable after cancellation/reload; a failed hash never publishes readiness. Status includes bytes/files, manifest digest, error and attempt identity. `qualityAccepted` and `deviceQualified` remain false.

`openFile` composes stored Files into a Blob without constructing one whole model-file ArrayBuffer in delivery code. Browser backing-store behavior and ORT's later per-shard CPU/GPU allocations are separate, unqualified costs. The scoped tests cover corrupted/reopened storage, byte limits, quota refusal, concurrent calls, manifest validation, and SHA known answers/Node-crypto comparisons. The native audit materializes only its tiny fixture in the observer to compare `openFile` and Blob URL bytes.

## Boundaries retained

No actual weights were downloaded or copied; no inference ran. No library, runtime lock, gameplay identity, save, scene cache or generated painting was changed by this component. No hosted actions occurred. The native probe records secure-context/OPFS/Web Locks/WebGPU/f16/adapter limits and storage estimates; `supported` means that capability conjunction only, never phone qualification. Real iPhone/Safari/PWA installation, multi-gigabyte cold delivery, storage eviction/persistence behavior, RAM/thermals, ORT consumption, art acceptance and all [prior roadmap blockers](../../ROADMAP.md) remain open. A Web Lock cannot reserve quota against unrelated storage owners, and this owner never automatically deletes their data.

The first-run receipts are immutable. The native runner refuses an existing `start.json`; a justified new attempt requires a distinct packet and retained predecessor. Parent owns current reference updates, final batch validation and signed checkpoint.
