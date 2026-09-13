# Wild v4.3 sequence and arena intake — review response

Date: 2026-09-13. Reviewer: Claude, read-only. Reviewed from the two archives `cf-wild-v43-review-part1/part2-20260913.zip` (source f802dde7 / 9ae342da): `wild-masters-review.png`, `wild-registered-review.png`, the three 1254-square masters, the three `keyed/` and three `registered/` PNGs (each inspected at 100% and as 200% crops composited over a dark ground), `wild-anchors.json`, `wild-anchors-master-fallback.json`, `intake.json`, `generation.json`, the three `*.prompt.txt`, `ART_KIT.md` section 4K, the Discovery Atlas and Living Worlds references, `ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png`, `acceptance.json`, `despill-receipt.json` and `mid-verification.json`. The old v4.2 sheet was used for comparison only. Could not inspect: the original generator sessions (not in the packet); nothing else was missing. No kit or code was edited; no image generated. Nick owns final acceptance.

## Verdicts

| Item | Verdict |
|---|---|
| Wild launch | **ACCEPT** (one optional intake touch, see fringe) |
| Wild travel | **TARGETED INTAKE FIX** (fringe only; art accepted) |
| Wild impact | **TARGETED INTAKE FIX** (fringe only; art accepted) |
| Sequence consistency and registration | **ACCEPT** |
| MID despill | **ACCEPT** as intake; no repaint |

## Materials and identity (visual)

All three phases now read as Wild and as one family: tawny and ochre fur-fibre strokes with visible directional brushwork, olive and umber torn leaves, dark airborne earth flecks, and a small cool sheen. Nothing reads as Frost, fire, crystal or a blue body. Nothing reads as a severed animal part: the launch tufts are loose fibre, the strokes are force marks. The hand matches the Discovery Atlas cut-outs (tactile, painted, restrained). The `#9fb6d6` sheen appears only as thin pale streaks at the impact's upper-left and lower-left arcs (master `wild-impact.png` around x 630 to 780, y 300 to 330 and x 640 to 760, y 760 to 800) and is small, as the table requires.

Shape family: launch curls up from the origin, travel is a long three-stroke sweep, impact converges to a burst with flung leaves and grit; same direction (left to right), same materials, scale steps small → large → medium. Legibility at runtime: the main strokes survive the arena scale (about 0.67 of the 1024 canvas); the finest earth flecks in travel and impact will vanish or become noise at that scale, which is acceptable and slightly preferable to a cleaner, more graphic look.

## Fringe and keying (visual, 200%)

The disclosed unresolved counts (launch 89, travel 597, impact 529) are visible as magenta spill where fibres and leaf tips meet the key. Locations on the **keyed** files (1254 square, top-left origin):

- **Travel:** magenta-tinted pixels along the underside of the top stroke and in the cavities between the top and middle strokes, x 560 to 900, y 420 to 640; also small pink specks on isolated flecks across x 700 to 1100, y 440 to 720. This is the densest case and will read as a pink halo over a dark arena.
- **Impact:** pink at fur tips and leaf edges across the burst, strongest x 820 to 1160, y 380 to 600, and on the small flung leaves at the top right (x 1000 to 1200, y 280 to 420).
- **Launch:** a few pink specks on the lower tufts and the left-most leaves, x 60 to 420, y 560 to 760; minor.

No holes, no lost fur or leaf edges, no dark plate or frame contamination in any phase.

**Smallest fix (intake only, on copies, no repaint):** a second despill pass with a wider inward neighbour search (radius 6 to 8 instead of the current) plus magenta-band suppression: for any pixel with alpha below 255 whose hue lies in the magenta band, desaturate toward its nearest opaque interior neighbour before the one-pixel erode. Re-run the counts; the target is under 40 unresolved on travel and impact. The registered copies must be re-cut from the corrected keyed copies, not re-derived from the masters.

## Registration and anchors (image and anchor fit; not animation)

- Registered files are 1024 square with alpha, uniform downscale plus translation only, as claimed. Launch bounds x 157 to 387, y 412 to 631 contain the origin (205, 563); travel bounds x 135 to 826 span origin to just past contact (819); impact bounds x 563 to 876 contain the contact (819, 563). Convergence is sensible for the melee hold-and-reveal interpretation: the travel sweep already spans both stands, which is exactly what A3's melee mode wants.
- `wild-anchors.json` and `wild-anchors-master-fallback.json` **both parse with the committed A2 parser** (`effects/anchors.ts`, run read-only): `PARSE OK` for each, including the added `alphaBoundsPixels`. Compatible with CONTRACTS sections 4 and 6. The registered set uses the same file for `image` and `keyedImage`, which the parser accepts; keep the master-fallback file as the per-phase anchor record.
- Metadata note (not a defect): once the corrected keyed copies exist, their SHA-256 values must replace the current `imageSha256` fields, and the registration receipt should record the second despill pass.

## MID despill

The 190-pixel correction is verified on a copy with alpha unchanged and the accepted FAR/MID/NEAR hashes intact. At 200% the left margin (x 0 to 320, y 380 to 600) and right margin (x 1360 to 1672, y 420 to 600) show clean foliage silhouettes; the remaining pink dots are the painting's own flowers and berries, not key contamination, with at most a few single pale pixels at the finest leaf tips that will sit over the far plate's sky and not read. Accept as intake. No repaint.

## Conclusion for Nick

The art is right: this is the Wild sequence in the approved hand and material vocabulary, and the palette collision with Frost is gone. Accept launch as is. Accept travel and impact subject to one intake-only despill pass (no repaint, no new generation), then re-register and re-hash. Accept the MID intake. With that single pass done, these images are ready for C2 staging.
