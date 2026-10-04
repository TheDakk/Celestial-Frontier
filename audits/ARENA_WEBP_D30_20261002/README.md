# D30: arena plates ship as WebP (Claude, 2026-10-02)

Dakk's D30 (`audits/MAILBOX/DECISIONS.md`): the painted battle arenas ship as high-quality WebP runtime copies inside the offline
pack, at the native 1672 × 941, so every biome works offline from install. The PNG masters stay in the repo untouched. The 128 MiB
pack cap is unchanged.

## What is here
- `receipt.json` (`cf.arena-webp-receipt/v1`) covers all 45 sets: the temperate fallback set plus the 44 C132 inventory rows. Each
  plate records its source PNG (path, SHA-256, bytes), its WebP (path, SHA-256, bytes), whether the alpha is identical, and PSNR,
  SSIM and worst 8×8 block SSIM.
- `switch-runtimes.mjs` is the one-time switch.
  - The 9 registered delivery manifests name the WebP runtimes, each with a `runtimeSource` PNG pin.
  - Each of the 36 pending candidates gets a `d29/delivery.webp.pending.json`. No set is registered and no acceptance is written.

Reproduce from `port/v2`:
1. `node tools/morph/arena-webp.mjs` writes the copies and this receipt. It is deterministic: each plate is encoded twice in the
   run and the bytes must match.
2. From the repo root, `node audits/ARENA_WEBP_D30_20261002/switch-runtimes.mjs`.
3. `node tools/morph/build-shipped-battle2.mjs`.

## Encoder (`port/v2/tools/morph/arena-webp.mjs`; sharp 0.35.4, libwebp 1.6.0)
- **FAR.** Lossy RGB, quality 88, effort 6, sharp-YUV. Every source alpha must be 255, and the decoded alpha is 255.
- **MID and NEAR.** Lossy RGB with lossless alpha (alphaQuality 100). The decoded alpha equals the PNG runtime's byte for byte; the
  encoder throws otherwise. Before encoding, the magenta key colour under alpha 0 is replaced by a 24-pixel ring-by-ring bleed of the
  visible edge colours, so 4:2:0 chroma cannot pull magenta into the visible edge. Pixels with alpha above 0 are never changed.
- **Metrics.** PSNR and luma SSIM over the visible pixels. For keyed plates they are measured premultiplied, over black. The
  reference is the PNG runtime.

## Quality chosen: 88 (the brief's starting point; it fits with a wide margin)

| Plate | n | Mean size | Max size | Mean SSIM | Min SSIM | Min PSNR | Worst 8×8 block |
|---|---:|---:|---:|---:|---:|---:|---:|
| FAR | 45 | 301 KiB | 451 KiB | 0.9844 | 0.9776 | 37.5 dB | 0.852 |
| MID | 45 | 208 KiB | 297 KiB | 0.9888 | 0.9805 | 34.1 dB | 0.787 |
| NEAR | 45 | 79 KiB | 124 KiB | 0.9897 | 0.9773 | 32.8 dB | 0.832 |

- 45 sets: 274.2 MiB of PNG runtimes become 25.8 MiB of WebP (9.4 %).
- At 2× on the temperate lakeshore and the hotglow cloud deck, the crops show no visible fringe or banding. The cloud deck loses a
  little of its finest grain.
- Higher quality is affordable. In a trial on five sample plates, quality 92 made them 20–32 % larger, which projects well
  under the target. Raising it is one flag (`--quality=`), then a re-switch.

## Pack totals (vite production build, PWA plugin cap check passing)

| | Pinned battle2 | Runtime bundle | Service worker | Shipped pack |
|---|---:|---:|---:|---:|
| Before (9 sets as PNG) | 97,839,472 B (93.3 MiB) | 25,199,306 B | 78,442 B | **123,117,220 B (117.41 MiB)** |
| After (9 sets as WebP) | 42,597,416 B (40.6 MiB) | 25,199,333 B | 78,438 B | **67,875,187 B (64.73 MiB)** |
| Projected, all 45 registered | +20,513,318 B (the 36 pending WebP triplets) | | | **88,388,505 B (84.29 MiB)** |

The projection is under the 115 MiB target and the unchanged 128 MiB cap. `tests/pwa-battle2-assets.test.ts` enforces it from the
real file sizes, using a fixed 32 MiB runtime allowance above the measured 24.0 MiB. Its negative control: the same 45 sets at PNG
size bust the cap.

## Not done
- The 36 candidates are **not registered**. Their acceptance records stay pending (`qualityAccepted: false`). A relayed message that
  Dakk had accepted them was not acted on, because acceptance must be recorded by Dakk. Once it is recorded, each set is
  `d29/acceptance.json` plus one line in `port/v2/tools/morph/arena-deliveries.json` naming its WebP manifest.
- The four gas-giant cloud decks (ammonia-v2, banded-v2, hotglow, stormeye) have recipe medium `"air"`. Their WebP manifests carry
  `"medium": "ground"` plus a `mediumNote`. `arena-sets.mjs` admits `air` only in that form; there is no air routing medium.
- The local certificate servers (`glassmatrix.mjs`, `scenemem.mjs`, `compendiummem.mjs`, `arc4recovery.mjs`, `devpreviewcheck.mjs`)
  have no `.webp` MIME row, so they serve these files as `application/octet-stream`. The game decodes through `createImageBitmap`,
  which sniffs the bytes, so plates still draw. Those instruments were left untouched.
- No browser or native run was made. Phone decode time and memory for WebP plates are unmeasured; D30 asks for one more I5
  measurement afterwards.
