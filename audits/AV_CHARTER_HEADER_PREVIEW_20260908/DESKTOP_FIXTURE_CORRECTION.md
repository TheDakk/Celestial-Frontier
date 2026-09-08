# Desktop scroll-fixture correction — 2026-09-08

The scrollbar-corrected run passed all four phone conditions, including large/max text and
forced colors, with zero changed header pixels and exact restoration. It then stopped before
desktop scrolling: at1440×1000 the entire native Charters body fits (scrollHeight=clientHeight=691).
The opened geometry and original runner are retained. This is a fixture precondition failure,
not missing product scroll or title leakage; no desktop PASS was issued.

Use a realistic1440×768 desktop viewport in the successor so the actual content overflows.
Retain the strict actual-overflow, native-wheel, rendered-line/header overlap, Close and pixel
assertions. Do not resize the panel or inject fake content. Product/build/profile bytes remain
unchanged; the fresh native-desktop-corrected chain is separately recorded.
