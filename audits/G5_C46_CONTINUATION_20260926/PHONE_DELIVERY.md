# Three canonical finished originals for phone delivery — C46

D26 remains open. This separate delivery production uses only the already eligible
Crab, Freshwater Crab and Mud Crab under the unchanged alpha===255 mask. It does
not rerun or relabel the old five-crab proof and does not attempt Cougar again.

## Exact runtime identities

The native client calls the actual `finishSourceV1` with each canonical record's
species visual key and genome seed. Legacy crab records encode that canonical
genome inside their tagged `speciesVisualKey`; the reader reconstructs it and
requires an exact roundtrip through the actual `speciesVisualKey` function and
an equal record seed. The runtime uses the full visual key as `individualId`.
Old proof-only IDs such as `crab` are never substituted.

The model identity is the actual `creatureFinishModelHashV1`: SHA-256 of the
canonical JSON runtime manifest, not the old authoring-manifest file bytes. The
runtime manifest's `sourceManifestSha256` separately binds the exact cached-model
authoring manifest. The expected runtime hash is
`640a9635fe4137f415f6179185b3a9c7c12e52bac1588e78e026b15f1226cb2b`.

Genuine generated rig/label pins, canonical record bytes, master PNG, labels,
binding, shipped alpha, and atlas are checked before production and again before
publication. Finished originals pass the actual finished-atlas admission,
including unchanged conservation and original rig authority. `phone-source-preflight.json`
records 5,128 / 11,755 / 11,441 eligible pixels for the three sources.

## Two runtime contract fixes

- `individualId` now has the same 2,048-character engineering bound as `visualKey`.
  Exact identity strings and key hashing are unchanged. Canonical crab IDs are
  739–747 characters and were previously refused by the inconsistent512 limit.
  Missing, empty, non-string and2,049-character values refuse; SHA fields also
  require strings rather than permitting object coercion.
- `createFinishInferV1` now accepts the worker's actual `Uint8ClampedArray` output
  and copies its exact bytes, retaining the existing output-length check. It also
  copies accepted Uint8Array/ArrayBuffer output. Other typed-array kinds refuse.
  The positive test reuses/zeroes the sender's view immediately after delivery,
  proving the adapter takes its own exact copy.

Unchanged bounds: source dimensions at most4,194,304 pixels, PNG8MiB, binding16MiB,
receipt1MiB, bounded serial queue1–8. No alpha, erosion, latent-mask, conservation,
source-admission, identity-value or release-default rule changes.

## Prepared production and publication

Parent runs only after signing a clean checkpoint and granting the browser slot:

```
node audits/G5_C46_CONTINUATION_20260926/phone-native-runner.mjs /private/tmp/cf-c46-phone-native-20260926-01
```

The copied harness performs three new real inferences with fresh transferred
buffers, exact runtime keys, actual IndexedDB retention, duplicate/cache checks,
and delivery into a fresh phone-tier store with Worker construction forbidden.
All six source buffers must detach. The raw engine receipt string is retained
verbatim as `originalReceipt`, with no receipt rebinding or reserialization.

After PASS, the publisher verifies the signed native head, every native producer
source hash, exact PNG bytes, exact runtime receipt/key/model, genuine source
pins, unchanged conservation and atlas admission before writing anything:

```
node audits/G5_C46_CONTINUATION_20260926/phone-publisher.mjs --verify NATIVE_DIR
node audits/G5_C46_CONTINUATION_20260926/phone-publisher.mjs --publish NATIVE_DIR port/v2/apps/game/public/library/creature-finish
```

Each exact key receives `original.png` and `receipt.json`. Existing different
bytes refuse. Exact-existing files are idempotent. The publisher does not modify
the library manifest. Parent coordinates the existing deterministic manifest
builder only after these files are verified and written.

Then run `node audits/G5_C46_CONTINUATION_20260926/phone-consumer.mjs`. It uses the
actual `createCreatureFinishDeliveryV1`, its real generated bundled manifest pin,
and filesystem-backed HTTP responses to fetch all three canonical keys. Every
result is checked again by actual finished-atlas admission. It does not inject a
manifest pin or fake consumer. This proves actual consumer reachability, not
physical-phone rendering or visual-quality approval.

## Evidence status

`phone-contract-tests.log`: three genuine canonical source/receipt tests, with
old-ID/wrong-key/model/labels/PNG corruption controls. These use deterministic
identity inference for tests only; they are not the new production originals.
`runtime-contract-tests.log`: final engine/adapter controls; the initial stale
Civet unavailable-source assertion is retained separately in
`runtime-contract-stale-civet-control.log.gz` (lossless raw-output SHA/size in its adjacent receipt). C46 now publishes that genuine source,
so the refreshed assertion expects its real fit. `runtime-app-typecheck.log`
records application TypeScript. Native production has not yet been run by this
agent; do not claim it passed until the parent records a PASS receipt.

## Parent native production and library result

PASS on clean signed `cf1a24da3203c7848ec60d8e31e7220074f97dc0`, retained byte-exact in `native-cf1a24da/`. Three inferences, one worker creation (one of each model session), six detached transfers, unchanged conservation with zero alpha/outside edits, actual IndexedDB cache, fresh phone-tier store delivery and zero phone model construction. The harness uses the real worker via its audit adapter; it does not execute the separate `createFinishInferV1` application adapter or ordinary main.ts controls. Those adapter response/identity contracts have their separate passing unit controls.

Publisher verified all producer hashes while they still matched the native checkpoint, then wrote all six exact files. Only afterward was the G3 manifest regenerated:603 files/65,315,121 bytes; manifest SHA `8e1cb6d72521ffd84a0700ba4bd2443ef2efd5f15e4fe75a72735bc174567cd3`. This expected manifest change means rerunning historical producer verification requires its original checkpoint; never rewrite that native receipt. `publication.json` retains exact keys/identities/hashes. PNG sizes34,690/42,794/42,238 bytes (119,722 total); receipts31,741 bytes total. `phone-consumer.json` then proves all three through the actual bundled-pin consumer with seven filesystem-backed HTTP responses and finished-atlas admission.

The originals are committed under `apps/game/public/library/creature-finish/<key>/` on the OpenAI branch only; no site deployment. Original PNG inspection retains source silhouettes/alpha and subtle texture, with striping visible on Crab. This is technical delivery acceptance, not Nick's quality approval or physical-iPhone testing. D26 remains pending; none of this supersedes the old five-crab proof or produces Cougar.
