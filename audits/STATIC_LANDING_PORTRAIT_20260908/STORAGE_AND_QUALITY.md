# Storage and image quality — current static landing pilot

September 8, 2026. Nick explicitly authorized ImageMagick resizing and encoding
while preserving the artwork's quality. This note separates compression quality,
display resolution, disk storage and runtime memory. It adds no test or device
measurement beyond the retained parent batch observations and export receipt.

## What the export preserves

The original generated painting remains unchanged at **1875×839**, 2,885,444 bytes,
SHA `e7ef04af6c5d75bad9e41a26082f814a95893928e814309dd8a720e4fa2a2740`.
ImageMagick 7.1.2-31 used Lanczos resampling for the **960×430** display reference,
then encoded a lossless WebP of **600,756 bytes** (about 586.7 KiB / 0.573 MiB),
SHA `cd2c616abb35610f6ec63382f6476436f27a8c1a2c698757c8a66d34a5b2e0ec`.
The exact commands and original result are in [export-lossless/receipt.json](export-lossless/receipt.json).

The reference and decoded WebP have identical 8-bit RGB bytes: the compression
introduces no additional pixel loss at 960×430. **Resampling is still a reduction
in detail** compared with the full master, especially when zoomed beyond the
export's native size. Lossless encoding does not mean that a smaller image retains
all original spatial detail. The full master remains available for a separately
qualified higher-resolution export; no such runtime tier is claimed here.

The first export exceeded the old 512 KiB runtime ceiling. Its receipt retains
`ENCODING_EXACT_BUT_OVER_RUNTIME_BUDGET`; it was not rewritten green. The applied
loader now allows a separately declared exact count under a **640 KiB hard maximum**.
This recipe declares **600,756 bytes** and the fixed SHA. Existing loads without
that declaration retain **512 KiB**. Exact length and digest binding are source
requirements; current integration verification remains pending at this note's
creation boundary. [Current packet status](README.md).

## Disk bytes are not runtime memory

The session's storage observation reported approximately **211 GiB free**, a
**6.2 GiB checkout**, and **630 MiB in audits**. These are the parent batch's dated
local storage observations, not fresh measurements from this documentation task.
Checkout/audit size is not the game's download size or its browser memory use.
No retained audit evidence was deleted to reduce those figures.

One 960×430 logical 8-bit RGBA buffer is `960 × 430 × 4` = **1,651,200 bytes**,
about **1.575 MiB**. The 600,756-byte WebP is compressed storage/transfer size.
Actual browser decode buffers, canvas backing stores, texture uploads, GPU storage,
driver copies and temporary processing can add separate allocations. Their real
number and lifetime are not established by this arithmetic; one leased image
does not prove one total CPU/GPU copy or immediate driver memory release.

At this exact compressed size, **100 assets would be about 57.3 MiB on disk**.
That is only a storage illustration, not a proposed resident cache or evidence
that hundreds of decoded paintings fit the mobile budget. No 100-asset library
was produced or admitted by this batch.

## Scalable direction, not implemented by this pilot

Nick requires the finished scene to be produced on demand as a world is visited,
without preparing and installing an image for every possible seed. Reusing
approved organism families, materials, environment pieces and lighting recipes
is one possible implementation; no compositor, model or service is selected yet.
Any chosen pipeline needs bounded retention, resolution tiers and retirement
measured on target devices. This requirement is not a completed all-world
renderer, cache qualification or performance result.

The current pilot contains one optional canonical Earth still. Physical iPhone,
Safari/PWA, native heap/heat, universal coverage, exact Compendium/battle identity
and all prior verification blockers remain separate from the lossless export.

## Player storage and generation decision

The new evidence build's exact PWA asset table plus service worker totals
**18,987,535 bytes (18.108 MiB)**. Every listed digest was checked against the
written build. Two equally sized complete versions would total 37,975,070 bytes
(36.216 MiB), before browser metadata, saves, HTTP cache duplication and temporary
update candidates. This is an asset-byte measurement, not measured installed
Safari/iPhone storage. [Exact inventory](player-storage-build.json). The first
parser incorrectly expected a bare ASSETS array; its pre-enumeration failure
remains in [player-storage-first-parse.json](player-storage-first-parse.json).

Current `pwa-build.ts` excludes source maps and enforces a **128 MiB shipped-pack
ceiling**. It precaches the emitted runtime asset library for offline installation,
including optional art. Current cache ownership retains one active and one prior
complete build. The 128 MiB limit is per build, not a promise of 128 MiB total
browser storage. Existing 256 MiB retained-update qualification remains open.

Nick has now clarified the intent: **produce the final landfall painting on demand
as the player visits a world**. Millions of possible worlds do not mean millions
of paintings installed beforehand. The current runtime generates seeded worlds;
this one prepared still demonstrates the quality and display target, not the
required production art generator.

The implementation remains unresolved. No local renderer/model, compositor or
remote generation service has been selected. A service option would need an
explicit latency, storage, cost, complete-identity and shared-image retention
policy; a seed alone would not guarantee exact image pixels. No paid cloud
service, model, price or hosted call is approved. The next bounded scope is
**one on-demand scene proof** from an existing canonical world/roster at the
approved quality, before more prepainted planet-catalogue work. No new cache,
generation algorithm or image-per-seed archive is implemented by this clarification.
