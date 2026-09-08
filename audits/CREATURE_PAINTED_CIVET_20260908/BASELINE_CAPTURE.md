# Canonical Civet baseline capture — September 8, 2026

The first isolated native capture **PASS** at source checkpoint
`5e222931efd642c03ce55c5e67f7670a7aef890c`. It used Codex/macOS in the exact
`/Users/nick/Projects/celestial-frontier-openai-mac` checkout on `openai/mac`, Node26.8.1,
the shared toolchain lock and exclusive checkout lock, and the existing raw-CDP launcher
outside the macOS sandbox. Edge152.0.4191.66 / CDP1.3 provenance is retained in
[the immutable report](baseline/report.json). All38 bundled source files matched after
capture; zero Runtime exceptions or cleanup failures occurred, and the browser closed.
No product source, genome, placement, save, test or hosted state changed.

The harness derives the Civet's complete genome directly from the immutable Earth resident
plan and enters the actual `renderSpeciesPortraitCanvas` dispatcher. Its native880px
transparent ink allocation is captured before the current fit/portrait finishing. The
440px image uses the current finished portrait owner;132px uses the actual thumbnail owner
and also equals the independently downsampled440px source. The300px view is a downsample
of that same440px source, matching the current display-scale convention.

- [Transparent anatomy crop](baseline/civet-alpha-crop.png):410×217,42,815bytes,
  SHA256`9dc23b9a6532e2bcfafca8df174c27fcf1448a15a4d9177746693270010ca052`.
- [Original880px transparent ink](baseline/civet-ink-880.png):64,832bytes.
- Current portraits: [440px](baseline/civet-current-440.png), [300px](baseline/civet-current-300.png),
  [132px](baseline/civet-current-132.png).
- [Native review screenshot](baseline/native-baseline-review.png).
- [Exact Earth background](baseline/earth-background-original.webp),
  [original residents](baseline/earth-residents-original.png), and
  [five residents with only Civet omitted](baseline/earth-residents-without-civet.png).

Raw alpha>12 bounds are `(243,399)` through `(628,591)`,386×193. The lowest solid
alpha≥230 contact row is564. The crop adds12px padding while retaining the original pixels,
including its translucent shadow; it performs no keying, retouching or anatomy alteration.
Civet's unchanged scene anchor is `x=.72`, `groundY=.77`, relative width`.15`, no flip.

The audit independently composed each of the six actual dispatcher ink allocations with
the production alpha/contact/placement calculation. That six-body canvas matched the
actual `renderEarthResidentLayerV1` pixels exactly. Omitting Civet from the same composition
changed pixels and left the other five bodies at their existing positions. This allows
the later local review bench to stage a new candidate without covering a legacy Civet.
The Earth background copy matches SHA256
`2993cd8054a2424f20ba24040717acdb17aa9c7157500cd5b945170cd1f625d8`.

Visual inspection of the anatomy crop and native review screenshot confirmed a very flat
tan body, pointed muzzle, round ears, mask, spots, ringed tail and four planted legs.
These are honest current pixels and remain far below the approved painted target. This
capture establishes the reference, not aesthetic approval, articulated motion, native
game integration or new certification. Existing verification blockers remain unchanged.

The retained [runner](baseline-runner.mjs), [harness](baseline-harness.ts) and
[HTML](baseline.html) produced the fresh `baseline/` directory once. The runner refuses
an existing output directory; this packet was not retried.
