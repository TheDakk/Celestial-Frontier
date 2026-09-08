# First native Earth failure — observer ownership mismatch

Recorded 2026-09-08. This preserves the first phone attempt as **FAIL**.
The failed instrument is `native-earth-layers-source-runner.mjs`; the report is
`native-phone/review.json`. No desktop, blocked-image or default native stage
ran after this failure. No product or frozen-build correction is required by
this finding.

## Exact failure and source distinction

The native runner stopped at `landReceipt`, line 296: it expected the landing
policy's `biomeKey` to be `temperate`, but the committed witness contained `null`.
This was an observer defect introduced while adapting the Mars runner to Earth.

`port/v2/apps/game/src/descent-policy.ts` calls the lifted `biomeFor` directly.
`port/v2/packages/domain/strays/src/strays.verbatim.js:111` explicitly returns
`null` for Earth seed 133, preserving Earth's name instead of relabeling home
with a procedural biome. The descent policy therefore legitimately stores
`biomeKey: null`.

The visual profile is a separate owner.
`port/v2/apps/game/src/world-roster.ts` selects `temperate` as the canonical
`terran` presentation fallback, and `biome-vista-surface.ts` reads that registered
roster profile into the visual request. The new scene's exact request and
`surfaceVistaLastBiome` must still be `temperate`. Conflating these two fields
made the instrument reject a correct landing before it could inspect the art.

## Retained native witness

The read-only predecessor and successor rows were saved before interpretation:

- Document token: `7cb00e77-37b5-4642-8a19-7dc647460013`, unchanged.
- Canonical world: `CF1|g:999@90,-60|s:424242@560,170|p:133#2`.
- Revision: **3 → 4**, with one new exact **`receipt:0`**, kind `arc0-land`.
- Session RNG seed: **2404930356**, unchanged; receipt ordinal **0 → 1**.
- Random draw counters: **`{}` → `{}`**; `drawsConsumed: 0`.
- HP: **100 → 100**; damage **0**.
- Native CTA: **Land safely**, success **100%**, enabled and hit-testable.
- Descent result: `landed`; navigation `surface`; `safeReason: earth`;
  required domains `[]`; persistence outcome `success`.
- Planet type: `terran`; landing-policy biome key: **`null`**.
- Weather: `rain`; `stormActive: true`; storm-adjusted ordinary chance 90%,
  overridden by Earth's existing safe policy to the observed 100%.
- Runtime landing owner: idle, no fault, outcome `committed:4`; rendered world
  and navigation world both exactly Earth 133 ordinal 2 at ecology epoch 0.

The first report ran from `2026-09-08T16:44:33.064Z` to
`2026-09-08T16:44:36.091Z`. It records zero Runtime exceptions, zero surface-vista
faults and no cleanup failures. The built background was fetched once with HTTP
200, but that response alone is not art acceptance.

At failure, the pair was **pending**, the resident worker was active, and the
background was ready. One background canvas was retained by the pair loader;
no scene vista was mounted, no resident layer was published, and the variant
was still null. Pair readiness, alpha/pixel checks, native Survey reopen,
control geometry and scene-resource retirement were **not reached**. None is
accepted by this attempt. The failure screenshot is diagnostic only.

## Bounded correction and preservation

`native-earth-layers-policy-runner.mjs` is a new immutable observer version. It
changes only the exact landing-policy expectation to `null`, adds an explanatory
comment distinguishing that policy from the presentation profile, updates the
usage comment, and adds its own source plus the verified domain-strays
index/verbatim and biome-profile index carriers. All visual `temperate`
assertions, native inputs, draw/receipt/HP assertions, pixel controls, resource
checks and failure handling remain unchanged.

The source runner and failed report are preserved byte-for-byte. The frozen
runtime build remains `port/v2/apps/game/smoke/earth-layered-evidence-dist-20260908`.
No browser or test job was run when preparing this correction; its native
result is pending. Any later attempt must use a fresh output directory.

- Failed runner SHA-256: `e7567722f50724992376eb744dd187b46fbb811b3fbb0fa8a88830a9fee90889`.
- Failed report SHA-256: `d14b15597a842a55275d86a59cd8645f61d0d1388cda1d44a472d77179c4217d`.
- New policy runner SHA-256: `81f8044d5b62304746049aea1f03d7919cdd6eeccc673e5a8267d08a9c504a7b`.
- New policy runner binds **46** explicit source carriers.
