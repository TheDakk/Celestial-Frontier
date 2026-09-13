# Wild v4.3 second intake — review response

Date: 2026-09-13. Reviewer: Claude, read-only. Reviewed from `cf-wild-second-intake-review-20260913.zip` (source 56509c0c): `wild-phases-review.png`, `travel-fringe-200.png`, `impact-fringe-200.png`, the second-pass `keyed/` and `registered/` copies for travel and impact, the unchanged registered launch, `receipt.json`, `tests.txt`, `validate.txt`, and both anchor files against their `.before` copies. Every image was inspected at 100% and as 200% crops over a dark arena ground, with 400% zooms of the flagged clusters. Hashes of the four second-pass PNGs match the receipt. No master, kit or code was edited; no image generated. Nick owns final image acceptance.

## Verdicts

| Item | Verdict |
|---|---|
| Wild launch (unchanged) | **ACCEPT** (stands from the first review) |
| Wild travel, second pass | **ACCEPT** as intake (one optional point touch, listed below) |
| Wild impact, second pass | **TARGETED INTAKE FIX** (two small clusters; art accepted) |
| Registration after the pass | **ACCEPT** |
| Retained fur and leaf shapes | **ACCEPT**; no further erosion |
| C1 | **not complete** until the impact fix is done and re-registered |

## What the pass achieved

The pink halo reported in the first review is gone from both phases. On the registered copies over a dark ground at 100% the travel sweep reads clean end to end; the impact burst reads clean except for one tuft. Compared with the before crops, the shapes are intact: leaf outlines, torn edges, the three-stroke taper and the burst fibres all survive. The one-pixel erosion removed only the outermost single-pixel flecks and about one pixel of the finest stroke tips at 1254; that is why the alpha bounds shrank (travel width 1162 to 1136, impact 752 to 725 at 1254) while nothing moved. Acceptable; a second erosion would start eating fibre tips and must not run.

## Residual pink, with coordinates (keyed copies, 1254 square, top-left origin)

**Travel** (my count of visibly pink edge pixels: 44 keyed, all isolated one-to-three pixel specks):
- The only cluster worth a touch: two small enclosed holes in the top stroke at x 832 to 850, y 498 to 514, whose inner rims are pink. At the registered scale this is a two-pixel pink dot at about (610, 455); at arena scale it will not resolve. Optional.
- Single specks at leaf tips and stroke undersides: around (719 to 725, 771 to 777), (940 to 955, 620 to 625), (205 to 220, 492 to 505), (45 to 55, 575 to 585). Not visible at 100%. No action.

**Impact** (my count: 31 keyed, but concentrated):
- **Cluster 1, fix required:** the pale fibre tuft at the lower right, x 930 to 1000, y 845 to 925. Pink shows between the fibres along the whole tuft and reads as a pink tint at 100% on the registered copy (around x 760 to 785, y 625 to 648 at 1024). This is the one residual that will be seen in the arena.
- **Cluster 2, fix required:** the flung leaf at the top right, x 1040 to 1095, y 350 to 440, has a pale pink rim on its right edge, and the small tuft just below it (x 1040 to 1070, y 415 to 440) has a pink edge. Reads at 200%, marginal at 100%.
- No other cluster reads at 100%.

## Why the mechanical target failed, and what the count is measuring

The receipt's unresolved lists include pixels that are not contamination. The painted `#9fb6d6` sheen streak at x 705 to 760, y 318 to 340 (RGB about 198, 189, 200) is counted as unresolved in impact, and dark umber shadow pixels (for example 545, 438 in travel, RGB 75, 16, 26) are counted in travel. Both are the painting. A pass that "resolved" them would erase the sheen the table requires and dull the shadows. With those excluded, the visible pink is 44 travel and 31 impact by my measure, and only the two impact clusters above are legible. Recommendation for the intake record only: report the count split into pink band versus excluded sheen and umber, and protect low-saturation pale pixels from any despill. The under-40 number should not drive a third global pass.

## Registration

The transform is unchanged: uniform scale, left and top for both phases are byte-identical to the before files; only image paths, hashes and alpha bounds differ. Anchor residuals are within half a pixel (travel 0, -0.2; impact 0.24, -0.48). Travel's registered bounds x 138 to 812, y 348 to 708 still span origin (205, 563) to just short of contact (819); impact's x 574 to 874, y 384 to 678 still contain contact (819, 563). Both `wild-anchors.json` and `wild-anchors-master-fallback.json` parse with the committed A2 parser (`effects/anchors.ts`, run read-only): PARSE OK for each. Compatible with CONTRACTS sections 4 and 6.

## Smallest next correction (intake only; needs Nick's go, no automatic retry)

One explicit-target pass on a copy of the second-pass keyed impact, using the tool's existing explicit-target mode (the one `tests.txt` covers): targets limited to the two rectangles above, neighbour radius 8, **no erosion**, sheen and low-saturation pale pixels excluded. If Nick wants travel touched in the same pass, add the hole-rim rectangle x 828 to 854, y 494 to 518 and fill the two enclosed transparent holes inside it (alpha only, fewer than 16 pixels each). Then re-cut the registered impact (and travel if touched) from the corrected keyed copies, replace the hashes in both anchor files and the receipt, and record the pass. No repaint, no generation, no kit change.

## Conclusion for Nick

The second pass did what was asked: the halo is gone and nothing in the art was lost. Travel is ready. Impact needs one small targeted touch on the lower-right tuft and the top-right leaf rim, then both phases are ready for C2 staging.
