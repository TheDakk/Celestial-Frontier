# Static02 source inspection

Direct RGBA crops are retained beside this note; crop-receipt.json gives source hashes and original-pixel rectangles. No source image or label was modified. Findings reference ../root-edge-inspection.json, which independently traces the measured folded-face locks.

Near10: source support553[450,744] is visibly on the gold upper shaft; the shaft is separated from the brown trunk at this height. Its root weld arises through exactly the retained outer fringe pixel[449,724], RGBA[255,0,0,1]. This is a narrow polygon-edge miss, not a true body collar. A bounded outward contour point around[453,724] preserves the existing hip cut while including this pixel.

Far9: root support1565[470,627] sits on the gold thigh while1566[450,627] is padding. Their source welds run back to the brown dorsal trunk rim at[464,640]–[488,646]. The opaque brown pixels there belong to the trunk/attachment boundary; do not transfer them to the leg merely because the mesh shares the support. The apparent problem is a coarse support footprint extending from the genuine collar toward the moving knee.

Far13: root support1942[234,607] sits on the gold thigh while1943[214,607] is padding. Source welds at[222,624]–[237,630] are the visible brown rear trunk rim below the leg's gold attachment, not a detached shaft edge. Preserve this collar. Like far9, finer authored sampling can distinguish the short gold hip-to-knee span from the fixed rim without removing pins.

The unchanged manually authored Knee centers[468,607] and[231,593] lie in their visible golden bend regions. A16px core (±8) fits each central bend as an anatomical authoring approximation, with uncertainty in the internal hinge center; this is not a measured biological hinge or a solver-selected coordinate. Conservative manually viewed proximal envelopes are far9[455,594]–[501,649] andfar13[218,580]–[258,634]. Add10px for local8/32 sampling, preserve the existing masks/body collars, and let actual changed intake/static judge the result. No solver, test or intake was executed by this source review.
