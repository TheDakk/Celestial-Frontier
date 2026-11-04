# Fruit Bat first-fold diagnosis

Six first-refusal poses were independently reconstructed through the actual canonical GSAP player, performance owner and contact resolver. Each resolved pose equals the retained static01 attempted publication, and each refusal and complete ARAP statistics object reproduce exactly. The private failed output never publishes. No full row, battery or native film was repeated.

| Row | First refusal ms | Triangle / part | Source bounding box px | Failed area ratio |
| --- | --- | --- | --- | --- |
| approach:flight | 45.06666666666667 | 711 / leg-far-foot | [548, 900, 587, 920] | -0.1368155802523082 |
| approach:crawl | 264.76666666666665 | 711 / leg-far-foot | [548, 900, 587, 920] | -0.05190613221132258 |
| melee:claw | 184.3111111111111 | 654 / leg-near-foot | [705, 900, 744, 920] | -0.06656341240587019 |
| dodge | 40.2 | 711 / leg-far-foot | [548, 900, 587, 920] | -0.09159531963188892 |
| faint | 122.86666666666666 | 711 / leg-far-foot | [548, 900, 587, 920] | -0.07158628861025876 |
| presentation | 5333.333333333333 | 711 / leg-far-foot | [548, 900, 587, 920] | -0.5752353499963268 |

The measured failures are two ankle/foot collar triangles, not wing triangles. Each has three pinned vertices:

- Far triangle711: pure `legFarFoot` at `[567.5,920]`, and pure `root` at `[548,900]` and `[587,900]`.
- Near triangle654: pure `legNearFoot` at `[724.5,920]`, and pure `root` at `[705,900]` and `[744,900]`.

Both root-owned corners also occur in the foot, upper-leg and body part interpolations. Their rest signed doubled area is780 px². The moving foot anchor crosses the line fixed by the two root anchors under the refused poses. All three are prescribed pins, so orientation projection cannot repair this triangle while preserving those target constraints. The full diagnostic retains target positions, failed private positions, signed areas, weights, two-ring nearby pins, actual joint/pivot anchors and attempted/resolved poses.

Targeted proposal: inspect actual source labels and painted limb outlines at these two ankle collars, then correct any demonstrably misplaced root ownership into the visible anatomical limb owner. Preserve the master, observed landmarks, motion, solver, pins policy, limits and tolerances. A wing-only ownership repair does not directly correct these measured triangles. If those root corners are outside painted alpha or their ownership is geometrically valid, do not relabel them blindly; assess the local authored support mesh instead. This diagnosis does not independently prove that any particular uninspected pixel is mislabeled.

Source and fit authority: record/binding/static inputs all remain byte-identical; all56 bundled source hashes remain unchanged,55 match static01 and the remaining source is this diagnostic. See `fold-diagnosis-01.sources.json`. The parent owns any changed-input qualification and art decision.
