# Arc 1C SceneMemory source-normalized ruler activation evidence — 2026-08-30

## Scope and authority

This audit preserves the three non-certifying, one-attempt/no-retry calibration observations used
to replace SceneMemory's fragile absolute post-route V8 ceiling. All three were collected from the
same clean committed source `553b06bc5b477a90e0d7284360fa84ab99704fb7`, branch `openai/mac`,
build SHA-256 `82557aa745288a5889f11ebbd37f1cedbb8154792d61703ba7fded2939e6ad3b`
(52 files), Microsoft Edge `152.0.4191.53`, JavaScript `15.2.23.6`, CDP `1.3` and the fixed two-pass
snapshot policy scoring pass two. Each report completed all 44 calibration outcomes, recorded zero
findings/fatal events, closed browser/server/workspace-lock ownership and used distinct phone and
desktop target/document identities. These are calibration observations, not PASS certificates.

## Immutable carriers

| Candidate | Raw JSON | Deterministic gzip |
|---|---:|---:|
| `20260830-pr35-553b06b-v8-growth-calibration1` | 786,775 B · `44ee4f8395ff1acf20902233cba37c114ce249077cb9843b1414f08600287fd6` | 45,001 B · `7beffdb6ee47b26c96d0d37448dd4685c5ac89c90bd9927de97df416c4db52fe` |
| `20260830-pr35-553b06b-v8-growth-calibration2` | 787,056 B · `f46c978ce56ae96d864e2059809fcb6356c3955c872ae1a266778c79805a7ac4` | 44,996 B · `833a7e92166a28a8466c4b7c855564e3884c25a657302f26decdc416c0819fbb` |
| `20260830-pr35-553b06b-v8-growth-calibration3` | 786,758 B · `0212064dd859e8fb60fe8e4df3c04e89f76844653ede182803e6db21b6e1f34d` | 44,938 B · `380b06b8b3d2f91fa7369c5103aacb0fd8fc9ae26a42d2aa06c77b5a8466a373` |

The carriers are respectively:

- `ARC1C_SCENEMEM_PR35_V8_GROWTH_CALIBRATION1_20260830_553B06B.json.gz`
- `ARC1C_SCENEMEM_PR35_V8_GROWTH_CALIBRATION2_20260830_553B06B.json.gz`
- `ARC1C_SCENEMEM_PR35_V8_GROWTH_CALIBRATION3_20260830_553B06B.json.gz`

The active browser-free replay binds every raw/gzip byte identity, source/build/browser/lifecycle
fact and independently recomputes the normalized values below.

## Derived ruler

For each profile, let `B` be the scored fixed-second `initial.heap.usedSize`, and let the judged
points be final warmup/precondition, cycles 1–4 and BFCache. For each judged point `q`:

```text
growth(q) = max(0, q.heap.usedSize - B)
working(q) = growth(q) + q.heap.embedderHeapUsedSize + q.heap.backingStorageSize
```

The active input-v5 ruler uses:

- initial V8 safety: 12 MiB (`12,582,912`);
- initial aggregate safety: 18 MiB (`18,874,368`);
- post-initial V8 growth: 6 MiB (`6,291,456`);
- normalized working set: 12 MiB (`12,582,912`).

The first two are intentionally broad boot-safety stops. They prevent an equal persistent
allocation from being hidden by baseline subtraction while leaving ordinary fixed source growth
and allocator phase far from the boundary. The latter two judge route-retained growth. Raw V8 and
raw aggregate maxima remain serialized diagnostics, not post-route admission ceilings. Existing
embedder, backing, heap range/slope, DOM, listener, resource, transient peak, ownership, pending,
answerability, BFCache and surface-vista limits are unchanged.

## Exact observed maxima and headroom

| Profile | Initial V8 max / headroom | Initial aggregate max / headroom | V8 growth max / headroom | Normalized working max / headroom |
|---|---:|---:|---:|---:|
| phone | 6,957,192 / 5,625,720 | 12,151,518 / 6,722,850 | 5,387,552 / 903,904 | 11,098,217 / 1,484,695 |
| desktop | 6,963,660 / 5,619,252 | 11,306,464 / 7,567,904 | 5,677,328 / 614,128 | 11,352,882 / 1,230,030 |

Worst route-growth headroom is 614,128 bytes (9.76%); worst normalized-working-set headroom is
1,230,030 bytes (9.78%). The old absolute 12 MiB post-route V8 ceiling would already reject two of
the three clean desktop BFCache samples: 12,605,240 and 12,614,748 bytes. That instability occurred
with one unchanged source/build/browser and therefore directly supports normalization rather than
another Edge- or source-version rebaseline.

## Stability and negative controls

All six profile lanes retained the same ordered route inventories, one settled scope, 19 leases,
19 textures and 18,350,080 live Canvas bytes. Warm DOM/listener counts were flat; BFCache retained
the expected two-document counts. Warm aggregate range / maximum positive slope remained:

- candidate 1: phone 317,700 / 103,929.2; desktop 323,352 / 108,260.4;
- candidate 2: phone 341,864 / 110,970.4; desktop 352,732 / 117,031.6;
- candidate 3: phone 336,752 / 111,249.2; desktop 332,240 / 108,878.4.

Every value stays below the unchanged 524,288-byte range and 131,072-byte-per-cycle slope limits.
Subtracting one fixed baseline leaves those range/slope calculations mathematically unchanged.

Browser-free controls prove: a constant source-footprint offset applied to initial plus every
judged point stays green; a point-only retained increase fails; exact four-limit boundaries pass and
the next byte fails; an equal persistent offset beyond either initial safety stop fails; missing or
detached initial evidence fails; historical input-v3/verdict-v2 and input-v4/verdict-v3 reports
still replay; and the retained DOM/listener, ownership, resource, range and slope reds remain red.
The current baseline is additionally bound to the exact profile, document token and
`${profile}-initial` scored-snapshot role; cross-profile and same-profile-warmup substitutions are
red. Named verification re-derives the complete profile-v3 metric summary from retained raw points,
so changing a displayed normalized metric without changing its evidence is also red. The input-v5
initial heap carrier projects exactly `usedSize`, `embedderHeapUsedSize` and
`backingStorageSize`; raw CDP `totalSize` and synthetic future fields remain diagnostic-only and
are rejected if injected into the versioned contract.
The current serialized boundary is report-v4, profile-v3, input-v5, verdict-v4 and budget-v5.

## Decision

This is a measurement-contract repair, not a product-memory waiver. It removes fixed shipped
source/allocator phase from the route-growth verdict while preserving broad boot safety and every
leak/ownership/plateau control. Compatible Edge point versions remain provenance only and never
trigger recalibration. The next certification must run once, without automatic retry, on the exact
clean signed activation source and must pass its named verifier before any later browser stage.
