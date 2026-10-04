# Native pixel observer correction — 2026-09-08

The first native run passed phone pilot/current and the transparency causal control (2479
changed pixels). Large/max-text hiding left the crop byte-identical; restoration changed60
pixels, so the one-attempt chain stopped before forced-colors/desktop. Source/served bytes
and browser/server cleanup remained intact. Retain native-first runner, JSON and every PNG.

Independent decoded-PNG comparison locates all60 changes in a6×10 device-pixel rectangle,
x706–711/y182–191 of the712×192 crop: CSS x363–366/y225–230 at DPR2. Each changes uniformly
from rgb(64,84,119), the source-defined #405477 scrollbar color, to rgb(48,64,94).
The objective label ends at x209 and Close at x357. No title/Close/objective pixel differs.
This supports native overlay-scrollbar fading; the original run did not instrument fade timing.

The successor observer excludes only the computed ::-webkit-scrollbar width at the native
panel's right edge. Unknown/negative/>12px lane sizes fail. Independent geometry must prove
both Close and real objective ink remain wholly inside the retained crop; otherwise it fails.
The crop still spans the whole top padding and title band. Objective visibility comparisons,
transparent-backing fault, exact attribute restoration, native actions and zero-pixel criteria
remain strict. No product code, opacity, scrolling, scrollbar or screenshot timing is changed.
The unchanged successful build/profile/root validation are reused, with a fresh isolated browser
and fresh native-scrollbar-corrected output. This is observer correction, not a new certificate.
