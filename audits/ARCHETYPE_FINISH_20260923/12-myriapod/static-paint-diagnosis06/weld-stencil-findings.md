# Retained seam stencil diagnosis

Scope: retained fit09 and refused fit10 source geometry. No pose, contact, ARAP, split, intake, static or native run was repeated. Fit10's source seam probe was reconstructed from its retained pre-regional binding and atlas; the split itself was not executed.

The existing splitter takes every nested triangle index from each source-seam sample, intersects the two surfaces' sets, and welds all common indices. It does not filter either interpolation level by barycentric coefficient. A welded body member inherits the existing fixed root owner. This explains a wider locked collar than the set of supports that actually contributes to the sampled seam.

| Fit / support | Source coordinate | Seam samples referencing both surfaces | Exact zero coefficient on both sides | Strictly positive coefficient on both sides | Seam distance range, pixels |
| --- | --- | ---: | ---: | ---: | --- |
| 09 / 1573 | 822,607 | 10 | 10 | 0 | 5–10 |
| 09 / 1576 | 822,612 | 17 | 9 | 8 | 2.23606797749979–7.762087348130012 |
| 09 / 1610 | 826,617 | 18 | 12 | 5 | 2.8284271247461903–8.06225774829855 |
| 10 / 1621 | 841,617 | 13 | 13 | 0 | 3.6055512754639896–7.615773105863909 |
| 10 / 1643 | 851,622 | 5 | 5 | 0 | 5.656854249492381–6.4031242374328485 |

Fit09 support1610's remaining sample has a negative floating-point interpolation coefficient, retained verbatim in the JSON; no epsilon classification was introduced. The positive coefficient maxima for1576 and1610 are0.4 and0.25 respectively. Thus1576 genuinely participates in seam interpolation, while1573 enters this seam's weld only through conservative triangle membership.

For1573[822,607], the actual body pixels[821,616] RGBA[112,52,28,224] and[822,617] RGBA[123,57,35,246] are9.513148795220223 and10.511898020814318 pixels from the support to their pixel centers. At seam[822,617], both surfaces reference field triangle[1575,1573,1576] through a projected corner whose outer and inner weights are both0 for1573. The weld nevertheless includes1573.

Fit10 has exactly two regional pin conflicts, both in the declared far3 soft gold shaft region:1621[841,617] RGBA[152,69,10,252] and1643[851,622] RGBA[92,27,2,252]. Both remain leg3-far label18. All other declared regions are free of inherited pin conflicts. This agrees with the separately authored visual review: excluding those source points solely because they became root pins would discard genuine shaft/socket influence.

For1621, nearest associated body pixels[837,619] and[838,620] have alpha251 and pixel-center distance4.301162633521313. At seam[844,624], its field triangle[1625,1621,1626] enters both conservative stencils with zero outer and inner weight for1621. For1643, nearest associated body pixel[855,626] has alpha252 and pixel-center distance6.3639610306789285. Seam[856,626] similarly includes triangle[1653,1643,1650] with zero effective1643 coefficient. Full exact terms, neighboring body pixel RGBA and source samples are retained in the JSON files.

Every inspected support also appears as one body projected mesh vertex with inner coefficient1 at its source coordinate, despite the source pixel at that coordinate belonging to leg3-far. The body mesh therefore extends over transparent cutout padding. Zero seam coefficient does **not** establish that releasing the root pin would preserve all body-paint interpolation. No pin release or splitter-policy change is proposed.

The source ownership correction and remaining coarse stencil are separate facts. The new gold/brown seam is only about4–6 pixels from the conflicting gold supports, so the previous8-pixel local sampling can span it with conservative corners beyond the painted seam. An explicitly authored4-pixel local refinement covering the observed seam and shaft is geometrically motivated; it is not guaranteed to compile or pass motion. Preserve the source contour, all alpha, landmarks, locks, numerical limits and runtime. The writer must measure admission on that new input before any motion claim.

Evidence: `weld-stencil.json` (7 inputs unchanged; tool48146d, exit0) and `weld-stencil-fit10.json` (10 inputs unchanged; toolfd9c70, exit0). Their source-point reconstruction errors are at most1.6077746776921858e-13 and1.1368683772161603e-13 pixels respectively; these are measured arithmetic errors, not changed acceptance tolerances. Synthetic zero/positive contribution controls passed within both diagnostic helpers. Read-only projection-reference inspection tool dbd498 supplied the transparent-padding caveat.
