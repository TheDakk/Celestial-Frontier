# Fit05 static02: three attempted-pose diagnoses

Exactly hit22.5ms, dodge21ms and tame53.333333333333336ms were reconstructed from their canonical timeline/sample index through actual GSAP, performance, contact, compiled field and ARAP. All three reproduce the original errors and statistics exactly. Original first-refusal objects are retained unchanged in `report.json`; no recorded pose is used as the replay input. Tool4f6f14 exits0; no other sample or complete row is executed.

All reported faces are already folded at the LBS target and all their vertices are hard-pinned. This establishes a contradictory authored root/Knee target constraint; more soft iterations cannot move those pinned points.

| Row | Face | Part | Pinned source coordinates and owners | Target/final area ratio |
|---|---:|---|---|---:|
| hit22.5 |2450|leg9-far|1564[460,617] Knee;1565[470,627] root;1566[450,627] root|−0.12403070409119486|
| dodge21 |2450|leg9-far|same three vertices|−0.01629422861714005|
| hit22.5 |3064|leg13-far|1941[224,597] Knee;1942[234,607] root;1943[214,607] root|−0.10364036013662915|
| tame53.333333333333336 |835|leg10-near|563[440,753.5] Knee;553[450,744] root;564[450,763] Knee|−0.027099362792311864|

All Knee locks come from explicit regional bend patches; all root locks were inherited from observed source joins. Exact poses, targets, weights and nearby pins are retained in `report.json`. The private failed field remains unpublished for all three samples.

`root-edge-inspection.json` traces the five root IDs through retained final source joins, without reconstructing the split or altering the mesh:

- Near10 root553 is linked to body by one retained fringe pixel[449,724], RGBA255/0/0/1. The support point[450,744] itself is limb paint (label11, alpha245). A narrow manual limb-fringe ownership correction can address that false body weld while retaining the pixel and alpha.
- Far9 root1565 is linked through26 body edge pixels in[464,640]–[488,646], alpha1..253. Root1566 uses eight of those pixels. Root1565 itself is limb paint (label24, alpha250); root1566 is transparent padding.
- Far13 root1942 links through17 body edge pixels in[222,624]–[237,630], alpha3..252. Root1943 uses four of those pixels. Root1942 itself is limb paint (label28, alpha252); root1943 is transparent padding.

Unlike the near10 single fringe, the far boundaries include opaque painted attachment edges. This diagnosis does not establish that their body ownership is wrong; visually inspect the trunk/hip contour before any relabel. If the source join is anatomically correct, this is a coarse-field collar reaching toward an explicitly locked bend, and a source-authored local mesh refinement may separate those roles while preserving joins/pins. Do not relabel genuine trunk paint, shrink patches onto anatomically wrong paint, release locks, or relax gates to evade the contradiction. Triage receives the exact pixel lists for independent visual review.

No production, input, mesh, gate or authoring file was changed by this diagnostic. Runtime/source equality refers only to the captured static02 source at execution; subsequent source changes require their own evidence.
