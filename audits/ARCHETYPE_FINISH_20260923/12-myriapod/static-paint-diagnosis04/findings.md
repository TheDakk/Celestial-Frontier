# Fit07/static04: hard constraints versus soft collar folds

Exactly hit26.25ms and dodge23.333333333333332ms were reconstructed from canonical sources and reproduce the original20/7 ARAP folds and statistics. All those first-refusal folds belong to leg3-far. None is fully pinned. Five hit faces and one dodge face are already inverted in the Float32 LBS target; the others invert during ARAP/projection. Full original refusal objects and reconstructed poses/field coordinates are in `report.json`. No report pose was used as input.

The target-only diagnostic attempts121 canonical hit and121 canonical dodge samples, without ARAP or publishing geometry. Hit resolves all121; dodge resolves111 and refuses10 at49–70ms (`leg0Far outside accommodatable reach`, with the support-candidate reach refusal retained as cause). It finds three fully pinned target-inverted triangles across near1/6/13 later in these rows. It does not claim those are the only potential soft ARAP failures. Tame and the other green rows/presentation/native were not run.

| Hard target face | Part | Source vertices/owners |
|---|---|---|
|107|leg1-near|80[1008, 753.5] leg1NearKnee; 76[1018, 744] root; 81[1018, 763] leg1NearKnee|
|502|leg6-near|346[695, 734] leg6NearKnee; 342[705, 724] root; 347[705, 744] leg6NearKnee|
|1092|leg13-near|736[263, 734] leg13NearKnee; 732[273, 724] root; 737[273, 744] leg13NearKnee|

Exact remaining root source-edge pixels: near1[1012,731]alpha5 and[1013,732]alpha2; near6[703,706]alpha5,[704,706]alpha1,[705,707]alpha1,[706,708]alpha1; near13[272,705]alpha1,[273,706]alpha1. These are newly exposed edges after the prior contour correction, not grounds to delete retained alpha. Root owns a complete source-contour review to avoid a succession of single-pixel repairs.

## Far3 collar evidence

Far3 socket is[851,629], Knee[835,592], Foot[866,536]. The explicit pure-Knee region is x827–843,y584–600. The part has209 field supports:56root pins,6Knee pins,2Foot pins and145free vertices. The first-fold envelope is[819.5,597]–[856,627]. Its22 distinct folded faces have minimum double-area10px² and minimum angle14.720405542641132°, with maximum longest-edge²/double-area4.75625. No near-degenerate rest triangle was measured here; these values are descriptive, not new gates.

One concrete target conflict is face2673: root1567[822,607] and1570[822,612] oppose free1599[824,609.5]. The free point is root54.13585355293069%, Foot40.4321053495699%, Knee4.574258188589935% plus retained small contributors. Its target crosses the root-pinned edge (hit area ratio−1.7864670350006548). Nearby free1605[828.5,614.5] similarly carries root54.59161605258007%, Foot42.4472889323699%, Knee2.4692462721788648%. A local Knee-core declaration leaves this collar mostly influenced by Foot/root; whether the underlying source point should follow the proximal limb or the trunk requires source review, not blind refinement or pin release.

Five folded-face root supports trace the source left contour[818,611]–[832,632]. It includes alpha1 fringe and opaque paint up to253. The exact trace for1567 uses[818,611],[818,612],[819,613],[820,614],[820,615],[821,616],[822,617];1570 additionally uses[822,618],[823,619]. Other affected root IDs1604,1613,1615 continue that same edge. Every coordinate/RGBA is retained in `root-edge-inspection.json`.

The suspected fine-mesh coverage gap is **not supported by actual fit07 authoring**: candidate09 refinement index8 is x812,y570,width62,height74, boundary8/interior32. All five measured far3 root supports and all their traced source-edge pixels are inside it. `refinement-coverage.json` records this exact containment; a guessed narrower rectangle must not drive another fit. The measured defect is a collar/ownership/influence interaction, not evidence that merely extending this refinement box will fix it.

No solver, gate, limit, source mask, regional declaration or runtime file was edited by this diagnostic. Triage received source pixels for independent anatomical review; the contact owner received the new49ms reach refusal. Any next change must follow that diagnosis and receive its own actual qualification.

Execution: toole93d43 exit0, exactly2ARAP reproductions and242target-only attempts. 58 loaded-source and62 retained static-source hashes matched at execution. Source authority: record`87434dc5b868915b31575e47ba8deab0006eb16a100c6e496512a54019607791`, binding`541cc0657e235e5a3d7586a877200312ab3f6aeb9380b08442b8d64e03a97ab0`.
