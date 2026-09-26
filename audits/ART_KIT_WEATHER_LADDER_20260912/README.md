# Deterministic weather intensity ladder — September 12

Nick accepts the9f51f2c9 weather/mat painting and Cranberry mat as the new baseline.
Its original PNG and raw finisher are unchanged. The audit/result qualityAccepted is true;
ordinary Land now compiles weather-mat-v1 and shows its matching immediate composite.
Future generated outputs are not automatically granted human acceptance.

No model inference for this ladder. Exactly six variants reuse the accepted raw finisher,
seed133 and masks. Baseline output reproduces byte-for-byte at decoded pixels. Wet pigment
amount, organism geometry/alpha and placement stay fixed. A separate seeded stream selects
additional droplets so original droplet and rain positions persist. Specular opacity is
multiplied, clamped to1; doubling rain repeats the original count with extra seeded strokes.

| Variant | Droplet count | Specular strength | Rain density |
| --- | --- | --- | --- |
| Accepted |1x (357)|1x|1x (1062)|
| A |2x (714)|2x|1x|
| B |3x (1071)|3x|1x|
| C |1x|1x|2x (2124)|
| D |2x|2x|2x|
| E |3x|3x|2x|
| F |3x|2x|2x|

Nick selects the compiler rain default;1x stays active until then. All six qualityAccepted
false pending selection. Contact sheet contains native1024x576 variants and a fitted
Living Worlds triptych; the original triptych is in the approved direction audit.
Early offline assertions caught rounding before doubling rain count (2123vs2124); fixed
by doubling the rounded baseline count. Montage needed its explicit installed font.
These were offline tooling corrections, no new variants or model runs.

Next: single iPhone probe using precomputed accepted text, only VAE encoder/transformer/
decoder, no retry after session loss. Then Civet animation proof. No kit/GitHub changes.
