# Two-pose diagnosis and selector repair

The exact attempted canonical `tame`48ms and `feed`58ms poses both reproduce their original first refusal, contact result and ARAP statistics. `report.json` retains every original `firstRefusal` field unchanged, plus fresh canonical raw/resolved poses; the recorded pose is compared only after reconstruction. For these two rows it happens to equal the attempted pose. The fresh diagnostic calls only those two sample times. Source hashes in `sources.json` matched static01 at execution; subsequent authorized production edits are not certified by that historical equality.

## Tame: contradictory pinned leg4-near face

Two folded faces are342 `[235,229,234]` and344 `[235,236,231]`, source envelope `[822,724]`–`[841,744]`. Face342 is already folded at its target (signed-area ratio−0.06528180027486599) and all three vertices are hard-pinned:

- 235 `[831.5,734]`: newly authored `leg4NearKnee=1`, target `[848.3713899850845,723.3471740484238]`.
- 229 `[822,724]`: inherited `root=1`, target `[829.9388662576675,723.999990105629]`.
- 234 `[841,724]`: inherited `root=1`, target `[848.9389228820801,723.999990105629]`.

The root edge lies between the two fixed root points; the knee-controlled point crosses it. The regional knee rotation is−0.2717021124950709rad, Foot rotation0.2755997732379236rad. Root translation is shared, so it does not by itself change this face's orientation. Face344 has pinned knee235/231 and unpinned mixed236; its target is positive0.9812055494296146 but final private scratch is−0.26102839866777977. ARAP refuses without publishing any field output after128orientation passes. Full original/new weights, nearby pins and selected regional polygons are retained in `report.json`.

`root-edge-inspection.json` traces the root pins through the final retained source-join probe. Vertex229 itself is opaque leg4-near paint (label5, RGBA249/228/172/251), yet shares a body weld through body-labelled fringe pixel`[833,716]`. Vertex234 is transparent padding and shares the body weld through `[832,714]`, `[833,715]`, `[833,716]`. All three fringe pixels have RGBA255/0/0/1. They are retained source pixels, not disposable noise. The narrow source-authoring correction is to include this upper leg contour fringe with its leg while preserving the original hip attachment, all pixels/alpha, landmarks and locks. No pin release, knee-patch evasion, solver or tolerance change was performed here. The separate far-leg swing repair has not been evaluated by this diagnostic; no claim that it repairs this fold.

## Feed: writer/runtime support selection disagrees

The original drift is exactly0.25360331204294534px at `leg5FarFoot`; skeleton endpoints pass. Runtime and the unchanged independent static observer both select part vertex10 `[752,527]`, whose contributing field IDs are1396,1393,1392 with barycentrics16/39,10/39,1/3. The latter two are inherited Foot pins. Vertex1396 `[763.5,528.5]` is unpinned and mixed (`Foot`0.8350374403067324, `root`0.10551494382516603, `Knee`0.04480976134664371, plus other retained weights). Its ARAP movement shifts the painted support by `[-0.20210838317871094,-0.1531882882118225]`px. LBS prediction alone drifts0.000023027638322675856px; target Float32 interpolation drifts0.000001526623722715435px. This is actual rendered mesh drift, not a threshold error.

`selection-inspection.json` identifies why that contributing vertex was unpinned. From endpoint `[748,530]`, the writer selects part vertex3 `[744,527]` at pixel-space distance5, and pins only1392/1393. Vertex10 is also exactly5px away in summed pixel coordinates. The runtime's retained per-corner normalized arithmetic yields5.000000000000031 for vertex3 and4.999999999999989 for vertex10, selecting10. The old writer and the observer therefore certified different painted support points.

The shared `painted-contact-selector.mjs` preserves runtime operation order and strict `<` selection, including its winner10. The writer now uses that selector; the contact-owner agent integrates the same helper. No accepted runtime winner/rest arithmetic is intentionally changed. The old writer is retained verbatim in `selector-before/`. The independent old static observer remains unchanged and already agrees with runtime here. No new paint pin or alpha correction is appropriate for this tie bug.

Six new focused selector controls plus eight existing split controls pass14/14 once (`selector-tests-01.log`, toola29d8f). Controls retain the exact five-pixel tie, detect the old pixel-space mutant and missing contributing pin, preserve first-on-exact-equality and nonsquare runtime arithmetic, reject invalid numbers, and confirm both writer paths lock the actual observed support without source-coordinate/UV changes. This result is not final Centipede admission or S2 replay; root owns the changed-source fit/static/S2/native chain.
