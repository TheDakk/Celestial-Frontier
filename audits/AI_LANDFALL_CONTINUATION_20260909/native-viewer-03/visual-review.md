# Independent retained-painting UI review — 2026-09-09

The four PNG screenshots were actually viewed. This is a review of the new viewer using the **unchanged native-game-02 original**, not a new image-generation result. Original/displayed Blob SHA-256 is `aebec1c3b9cf9bb3761ff0178d77b7d525aa7683d5ee5f448408a5f0949fd7e5` (1,520,711 bytes, 1024×576).

## Visible UI outcome

- **Desktop, 1280×1000:** the entire landscape is visible without cropping or stretching. The dark surround separates the painting from the application; title, Close, Fit painting and Actual size are readable and unobscured. The image is centered at its original size, leaving generous dark space above/below. This is useful inspection space, not a larger or newly detailed painting.
- **Small fit, 320×568:** the title and all three controls fit cleanly. The caption wraps inside the dialog and stays readable. The full image fits at approximately 278×156 pixels, so individual fauna and botanical details are still too small for confident anatomy review in this mode. The surrounding empty space is a consequence of preserving the wide image's proportions in portrait orientation.
- **Small actual-size/panned:** fur, bill, leaf and fruit details can be examined at native image scale. The image intentionally extends beyond the viewport; visible horizontal and vertical scrollbars support the retained panning state. Controls and caption remain available outside the image viewport. The screenshot demonstrates the panned result; physical touch ergonomics are not established by a desktop browser viewport.
- **Reload:** the fourth screenshot restores the same full painting and controls. There is no visible new crop, altered artwork or replacement image. Reload evidence applies to this exact retained recipe; it does not establish discovery across different model recipes.

No visible clipped controls, illegible text, distorted painting or overlap requires another viewer change in these captures. The colors and restrained controls suit the dark game presentation.

## Artwork remains rejected for species fidelity

The river, wet rocks, foliage, roots and soft forest light are cohesive. The screenshot nevertheless contains the same four mammal bodies, missing Frog, incomplete Platypus anatomy and selected-Civet identity drift recorded in `../../AI_GAME_INTEGRATION_20260909/native-game-02/VISUAL_REVIEW.md`. Simplified botany and the polished illustrative finish also remain unresolved. A larger inspection surface makes those failures easier to see; it does not repair or accept them. `qualityAccepted` remains false.

## Receipt scope and exact captures

`result.json` records PASS for the native UI flow, unchanged hashes for 36 source owners, trusted keyboard/control observations, a rejected and restored tiny-image negative control, no inference/model requests, and successful target/browser/server/checkout-lock cleanup. The retained image was explicitly seeded through the original store for this UI-only audit. Recorded browser: macOS Microsoft Edge 152.0.4191.66. No new execution was performed by this reviewer. This is not phone, mobile GPU, model-delivery, offline-cache or production certification. Three favicon 404 events remain in the receipt; they are not hidden or treated as model errors.

| Screenshot | SHA-256 |
| --- | --- |
| 01-desktop-full-painting.png | `0ad4865995dbff39d8337f1fb8762cad690c6f4982ac2a9e5bd0e9e31f42fced` |
| 02-small-full-painting.png | `7f5450c15a32782ab57f8ff0d72db50389623e8aa4e4c54cdc2379390af6592f` |
| 03-small-actual-size-detail.png | `16cfb789895f148e19509acb44edbf80e5e97126a0cb9f565c9aa7c0b9b2aa4c` |
| 04-reloaded-original-inspection.png | `af6635508e578a5179eeecd569d45fcad5acdbea9120a27bb495df6bc3539d95` |

Viewer source: `1ccd6e3a334addad39f25b87e5727f596f9a4b69659d38b56fe9a896143b88af`. Controller source: `5c7c59d0b1931d2c9a5e70821a5a3b7d607532ce3052beb1b0cb2746e76f5145`. These are the native03 receipt's sources, not the earlier read-only review snapshot.
