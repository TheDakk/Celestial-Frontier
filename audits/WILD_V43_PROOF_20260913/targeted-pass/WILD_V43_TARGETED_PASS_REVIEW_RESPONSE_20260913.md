# Wild v4.3 targeted impact pass — review response

Date: 2026-09-13. Reviewer: Claude, read-only. Reviewed from `cf-wild-pack4-targeted-review-20260913.zip` (source 6b574220): `wild-phases-review.png`, `cluster-1-400.png`, `cluster-2-400.png`, `targeted-pass/keyed/wild-impact.png` and `registered/wild-impact.png`, `receipt.json`, `registration-receipt.json`, `tests.txt`, `validate.txt`, both anchor files against their `.before` copies. Hashes match the receipt. The targeted keyed copy was compared pixel for pixel against the second-pass keyed copy and against the unchanged 1254 master from the first review packet. No master, kit or code edited; no image generated. Nick owns final image acceptance.

## Verdicts

| Cluster | Verdict |
|---|---|
| Cluster 1, lower-right tuft (x 930 to 1000, y 845 to 925) | **ACCEPT** |
| Cluster 2, top-right leaf rim and small tuft (x 1040 to 1095, y 350 to 440) | **ACCEPT**, unchanged, correctly untouched |
| Impact phase as intake | **ACCEPT** |
| Registration | **ACCEPT**; transform byte-identical, alpha unchanged, both anchor files PARSE OK with the A2 parser |
| C1 intake | **complete on the mechanical side**; Nick's eye is the last gate |

## What the comparison showed, and a correction to my second-pass read

The rose streak running down the centre of the tuft is **interior paint from the master**, not spill. Of the 3,705 warm pixels inside the cluster-1 rectangle, 3,651 are byte-identical to the master; the 54 that differ are the edge pixels the two passes corrected. The values along a line through the tuft (for example 238, 149, 122 and 226, 130, 111) are the painter's rose-peach highlight, and the same pixels sit in the master. I read that highlight as pink between fibres at 200% in the second-pass review; that was wrong, and the protected-colour exclusions were right to leave it alone. The nine corrected pixels at the tuft's right edge (x 996 to 999, y 860 to 865) were the only true edge candidates, and after the pass no pixel in the rectangle exceeds a small residue at (996 to 997, 863 to 865), which is interior-adjacent paint at the fibre root and does not read at 100% or 200%.

The leaf rim in cluster 2 is **pale protected paint**: 3,452 of the 3,504 opaque pixels in that rectangle are byte-identical to the master, and the pale pink-white edge is the painted underside highlight of the leaf. Zero eligible targets is the correct result, not a gap.

Fur and leaf shapes: every alpha byte is unchanged from the second pass, so nothing moved or thinned. The protected sheen streak at x 705 to 760, y 318 to 340 is untouched.

## Coordinates of what remains (keyed 1254, for the record; no action)

- (996 to 997, 863 to 865): interior paint at the fibre root, warm rose, master-identical after the pass except the two corrected neighbours.
- Cluster 2 rim (1042 to 1090, 355 to 432): pale protected paint.
- Elsewhere on the phase, my visible-pink edge scan finds 23 isolated single pixels, none in a cluster that reads at 100%.

## Registration

Uniform scale, left and top are unchanged from the before files; only image paths and hashes differ. Registered alpha bounds are x 574 to 874, y 384 to 678, identical to the second pass. Contact (819, 563) lies inside. Both `wild-anchors.json` and `wild-anchors-master-fallback.json` parse with the committed A2 parser.

## Conclusion for Nick

Accept the impact phase. The three Wild phases are now one consistent registered sequence with clean edges, the painted rose highlight and the sheen intact, and anchors the effects sequencer already reads. No further intake correction is needed; the next step is staging them on the arena.
