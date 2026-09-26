# C46 follow-up — reject mismatched alpha at the final card consumer

Parent review identified a missing enforcement point: `cardEligibleV1` was only a helper; `PaintedCardSource` accepted a finished card master based on recipe, dimensions and buffer length alone. Enabling supplementary ownership labels for the four opaque sources could therefore let an unchanged opaque source reach the card renderer.

`PaintedCardSource.#card` now compares every candidate alpha byte against the exact admitted `arch.master.master` before substituting finished pixels. A mismatch uses the original painter master and omits `finishedSha256`. No source alpha is normalized, changed or rebound. There is no import from the route module, so the consumer does not gain a cycle. Stage admission and the four label pins remain unchanged; D26 stays open.

Verification (`card-alpha-tests.log`): **8/8 PASS** across two final-consumer controls and the existing route suite. The real opaque Civet source is box-downscaled through the actual finished-card adapter with its correct recipe/size, then offered to the consumer. The resulting card is byte-identical to the painter, keeps transparent background pixels, has no finished tag, and leaves the retained opaque RGBA unchanged. A Crab candidate with modified RGB and exact source alpha changes the rendered card and receives its finished tag; changing one originally transparent alpha byte from 0 to 1 returns the exact painter, followed by a second genuine positive. App TypeScript exits 0 (`card-alpha-tsc.log`).

Only the card source and its new focused test file were edited for this follow-up. No native/browser job, publication or commit was performed.
