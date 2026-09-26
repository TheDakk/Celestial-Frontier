# Inkscape confirmation — September 8, 2026

Nick requested another test because the GUI launches normally. Inkscape 1.4.4 again
completed `--version` and an isolated 128×128 SVG→PNG export outside the sandbox under
the shared toolchain lock. Both commands exited zero. Dimensions/colors and visual
inspection passed; the PNG is byte-for-byte identical to the previous successful export
(SHA256 d92fb5e826d2faca239fe5dc946caa48de27a88adfd1a15b073c48f7ad81b3a3).

Both commands emitted a GDK `Failed to initialize CVDisplayLink!` warning. The export
completed normally; this is not a reproduced crash. Keep outside-sandbox execution for
Inkscape jobs. Its role remains vector/emblem authoring and raster export; Nick's emoji
choice is unchanged. No update, reinstall or existing-window closure occurred.

The original manifest/controller remains instrument-red: it expected ImageMagick's zero
AE result as the string `0`, but this version emitted `0 (0)` with exit zero. Direct
byte equality, the retained zero-difference log and visual inspection establish the actual
export result in artifact-verdict.json without another Inkscape run. Do not relabel that
original controller receipt. Earlier GDK/GTK registration crashes remain preserved in the
September 6 audit; the exact underlying cause remains unproved.
