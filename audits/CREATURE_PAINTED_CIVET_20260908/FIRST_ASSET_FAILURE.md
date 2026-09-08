# First painted asset — transparency failure

The built-in image generator produced the requested rich painted Civet, but1536×1024 PNG
has RGB channels only (`srgb 3.0`, opaque true). The checkerboard is painted into the pixels,
not an alpha preview. This output cannot be composited as a resident. Original bytes retained
in civet-first-opaque.png. A single targeted background-extraction edit follows; no silent
manual chroma key, anatomy replacement or production admission.
