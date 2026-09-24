# Tarantula candidate-08 — source review and initial authoring

This review and authoring inspect paint07's actual delivered master. They are a bounded manual source prototype, not an intake, static, native or solver acceptance. Only these two new files were written; the master, declaration, guide, prior authoring and production source remain unchanged. No rig/solver execution or coordinate optimization was performed.

- Master SHA-256: `55d8a5d00e4eabd761fc64cc42d82da1d3837b0448651d8c78820b9cfe9fb19b`.
- Authoring creation SHA-256: `e2b1b843104349ef23ea7dad5bf43da5296734c821d313f8f32b877b9fc916f0`.
- Parent-owned presence SHA-256: `2d694050a6517ff5800ea172ca6f38fa1425a5838a1f76fc0ccf9c09fc39f165`.

## Visible inventory and all 21 landmarks

Eight separate walking-foot tips remain visible. Numbering runs from anterior 1 to posterior 4 on each side. The two short hairy mouth appendages are pedipalps, not additional walking legs. Two small dark downward hooks at the mouth are the chelicera masks. No extra walking limb or source loss is apparent. Far4's proximal route is partially covered by the abdomen; its exposed outer bend and terminal remain visible. An occluded internal attachment is not asserted as observed paint. Parent's explicit declaration remains sting absent, hidden [], folded []; it was not inferred or rewritten here.

All 21 coordinates below were visually reviewed against this new source. Candidate07 was a structural and visual comparison reference, not authority to skip reviewing unchanged limbs. The unchanged numerical points remain approximate source-supported placements, not a claim that image generation preserved those pixels exactly.

| Landmark | Authored source pixels | Interpretation |
| --- | --- | --- |
| root | [666, 548] | Estimated internal body root |
| cephalothorax | [735, 535] | Estimated common internal pivot, not eight observed hip sockets |
| abdomen | [444, 520] | Approximate visible abdomen center |
| cheliceraFar | [890, 664] | Approximate exposed dark hook endpoint; near/far correspondence uncertain |
| cheliceraNear | [858, 671] | Approximate exposed dark hook endpoint; near/far correspondence uncertain |
| leg1FarKnee | [1006, 398] | Approximate visible major bend or segment transition |
| leg1FarFoot | [1219, 677] | Visible terminal tip center, not a ground-contact inference |
| leg1NearKnee | [1053, 744] | Approximate visible major bend or segment transition |
| leg1NearFoot | [1229, 976] | Visible terminal tip center, not a ground-contact inference |
| leg2FarKnee | [850, 232] | Approximate visible major bend or segment transition |
| leg2FarFoot | [1068, 350] | Visible terminal tip center, not a ground-contact inference |
| leg2NearKnee | [895, 830] | Approximate visible major bend or segment transition |
| leg2NearFoot | [921, 1106] | Visible terminal tip center, not a ground-contact inference |
| leg3FarKnee | [533, 217] | Approximate visible major bend or segment transition |
| leg3FarFoot | [402, 327] | Visible terminal tip center, not a ground-contact inference |
| leg3NearKnee | [529, 826] | Prominent new outward bend; manually authored from changed silhouette |
| leg3NearFoot | [526, 1098] | Visible lower terminal tip center; manually reviewed shifted source |
| leg4FarKnee | [328, 374] | Approximate visible major bend or segment transition |
| leg4FarFoot | [137, 613] | Visible terminal tip center, not a ground-contact inference |
| leg4NearKnee | [350, 745] | Approximate visible major bend or segment transition |
| leg4NearFoot | [105, 984] | Visible terminal tip center, not a ground-contact inference |

## All 20 mask reviews

Priority retains distal-before-upper, near-before-abdomen, abdomen-before-far, and remainder last. The source has 16 leg spans, abdomen, two hook surfaces and body remainder. The head/eyes and hairy pedipalps stay body-owned because the existing graph does not provide independent joints for them. Every polygon was reviewed against the actual source. A polygon is an initial authoring decision; its presence is not proof of a perfect label split.

| Part | Review disposition |
| --- | --- |
| chelicera-near | Redrawn to the exposed dark hook in read-only mouth close view; adjacent hairy tissue excluded where visible |
| chelicera-far | Redrawn to the exposed dark hook in read-only mouth close view; adjacent hairy tissue excluded where visible |
| leg1-near-distal | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg1-near-upper | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg2-near-distal | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg2-near-upper | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg3-near-distal | Redrawn around the new bent lower silhouette through its terminal tip; lower sub-bends remain one contracted span |
| leg3-near-upper | Redrawn from the visible emergence through the main outward bend |
| leg4-near-distal | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg4-near-upper | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| abdomen | Reviewed and retained around visible abdomen; priority occludes the far4 proximal passage |
| leg1-far-distal | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg1-far-upper | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg2-far-distal | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg2-far-upper | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg3-far-distal | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg3-far-upper | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg4-far-distal | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| leg4-far-upper | Reviewed and retained: contour and visible segment ownership remain supported by this source |
| body | Unchanged remainder sentinel; retains otherwise unassigned positive-alpha source, including head/pedipalps and fringe |

## Near3 representation and source uncertainty

The second lower foot from the left belongs to the edited near3 chain. Its pronounced outward bend is around [529,826]. Below it the artwork turns down-right, bends again, then returns down-left toward [526,1098]. The graph still uses one upper and one lower span: the additional painted segment breaks are not extra joints and are not silently claimed to be rigid, straight anatomy. The approximate knee-to-foot line therefore crosses the curved lower silhouette's interior gap in places; masks retain the entire actual painted span, without adding fill. Whether the existing deformation can render this source must be measured later.

Root [666,548], common cephalothorax [735,535] and abdomen [444,520] remain estimated internal centers. Exact biological hinge centers are obscured by hair and projection. No coordinate was selected from a solver outcome or to approach a numerical gate. The small fang endpoints were manually refined to [858,671] and [890,664]; their depth identity and exact proximal emergence remain uncertain.

## Framing and delivered pixels

The retained parent measurement in master-integrity.json reports a 1254-square RGBA source with 492651 positive-alpha pixels, bounds x49…1242/y0…1253, and diagnostic alpha>127 bounds x90…1239/y194…1124. The diagnostic right margin is 14 pixels; the requested 8% margin is not met. Visible tip shapes appear intact, but this is not a crop certificate. Faint fringe reaches the top and bottom edges; all RGBA remains unchanged. The diagnostic alpha threshold is not an intake cutoff. groundLineY 0.9 remains a framing reference, not a claim of one physical ground plane across perspective-separated feet.

Parent owns subsequent IC-3/label review and qualification. Nick reviews the painting; Claude consumes only signed results under the authorized handoff.
