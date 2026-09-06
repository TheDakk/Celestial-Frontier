# Celestial Frontier family proof review

These three sheets were assembled from the frozen generated game captures in `cf-pilot-final-game-evidence-20260905`. The assembly copied the portrait regions and their surrounding frame markers at 1:1 pixel size. It did not resize, repaint, retouch, or regenerate any portrait. Original headings and long genome diagnostics are omitted from the sheets; each pair retains its source filename, and the manifest records the crop rectangles.

| Sheet | Coverage | Pixel dimensions | Bytes |
| --- | --- | --- | --- |
| families-440-comparison.png | Eight native 440 px static / frame-accent pairs | 1968 × 2520 | 982,066 |
| families-300-comparison.png | Eight 300 px display static / frame-accent pairs | 1408 × 1960 | 543,681 |
| families-132-comparison.png | Eight native 132 px static / frame-accent pairs | 736 × 1288 | 180,565 |

The 300 px captures display the existing 440 px portrait resource at 300 px in the browser. They are not separate native 300 px portrait assets. The sheets preserve those captured display pixels without further scaling. Open the files at 100% for size comparisons; an inline viewer may scale the whole sheet.

All eight original 440 px family captures were inspected individually. The final sheets were then inspected across all eight families at all three sizes, including both sides of every pair. This is an agent visual review of generated files, not Nick's approval or a physical-device review.

| Family | Visual finding |
| --- | --- |
| Quadruped / Wolf | Complete silhouette remains inside the frame. The small view retains head, legs and tail; fine fur details reduce at 132 px. No pair mismatch. |
| Biped / Kangaroo | Ears, seated hindquarters and tail remain readable and uncropped. No pair mismatch. |
| Avian / Eagle hybrid | Beak, feet and avian silhouette remain clear. Fine crossed-line wing detail is less distinct at 132 px. No pair mismatch. |
| Serpentine / seed 10 | Coil, face and tongue remain readable and uncropped. Repeated scale detail becomes texture at 132 px. No pair mismatch. |
| Arthropod / Dragonfly | The portrait occupies a small fraction of its frame. At 132 px the legs and translucent wings are faint; body segments remain visible. This is the weakest small-size readability in this set. No clipping or pair mismatch. |
| Tentacled / Octopus | Head and arm fan remain readable and inside the frame. Small suckers reduce to points at 132 px. No pair mismatch. |
| Aquatic / Blue Whale | Long silhouette and tail remain fully inside the frame. Dark fins and ventral grooves lose contrast at 132 px. No pair mismatch. |
| Flora / fungus / seed 42 | Cap and stem remain distinct at all sizes. Fine cap lattice merges at 132 px. No clipping or pair mismatch. |

No new portrait clipping, missing image, or difference between the paired portrait pixels was found. The noted detail limits belong to the retained portraits; this review makes no protected-art edit request. The retained art is visibly simple and static. It should be presented as the preservation/fallback proof, not as completed living-creature graphics.

All eight anatomical animations remain **INCOMPLETE**. The right-hand view retains static anatomy and only permits the separate external frame accent to move. A still proof sheet cannot demonstrate motion, timing, reduced-motion behavior, or faithful rigs. The source diagnostic records the frame-marker motion control separately; this assembly did not rerun it.

`assembly-manifest.json` verifies all 37 PNGs against their existing `review.json` hashes and records all 38 original files with unchanged bytes and modification timestamps. Each of the 24 source comparisons has identical captured static and right-side portrait pixels. The exported PNGs were reopened and compared byte-for-byte with their composed RGB pixels. Only this scratch output directory was written; no game/art files, source captures, browser session, or desktop surface were changed or captured.

Python: `bundled-python-3.12`

Pillow: **12.3.0**, installed at `bundled-python/Pillow-12.3.0`.

No physical iPhone, Safari, installed-PWA, human visual, or human listening acceptance is inferred. The pilot approval stop remains in effect.
