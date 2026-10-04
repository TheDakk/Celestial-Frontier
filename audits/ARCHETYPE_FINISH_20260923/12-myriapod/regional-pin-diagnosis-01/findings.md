# Fit02 regional pin diagnosis

One exact region inspection (`b3d056`, exit 0) examined the 31 declared candidate04 polygons on fit02’s retained pre-regional binding. It used the compiler’s exported `insideSourcePolygon`, the same part membership union, positive-alpha pixel count, and exact inherited-weight conflict rule. It did not run compilation, change authoring, move pins, or emit a new binding.

**21 regions select conflicting inherited root pins; three regions contain painted source but select no field support. Seven regions select at least one unconflicted support. No regions overlap with a different regional joint.** All 31 regions contain positive-alpha paint of their declared part. The first refused region and support exactly reproduce the retained intake refusal.

Field: 916 vertices and 458 inherited pins. `report.json` lists every selected support, source coordinate, inherited weight, contact-lock owner, shared part membership and floor-sampled source alpha/label. `pixelAtFloor` is a diagnostic sampling convention, not a revised alpha or admission rule.

| Region | Owned paint pixels | Selected supports | Selected supports on owned paint | Conflicting pins | Unconflicted selected coordinates |
| --- | ---: | ---: | ---: | ---: | --- |
| leg0-near | 1193 | 1 | 1 | 0 | 7 @ [1057,744] |
| leg1-near | 915 | 1 | 0 | 1 | none |
| leg2-near | 681 | 2 | 2 | 2 | none |
| leg3-near | 799 | 1 | 1 | 1 | none |
| leg4-near | 871 | 1 | 0 | 0 | 97 @ [802.5,724.5] (padding) |
| leg5-near | 960 | 1 | 1 | 1 | none |
| leg6-near | 870 | 1 | 1 | 1 | none |
| leg7-near | 825 | 2 | 1 | 2 | none |
| leg8-near | 805 | 2 | 1 | 2 | none |
| leg9-near | 1023 | 1 | 1 | 1 | none |
| leg10-near | 791 | 1 | 1 | 1 | none |
| leg11-near | 824 | 2 | 1 | 2 | none |
| leg12-near | 853 | 1 | 1 | 0 | 280 @ [313,744] |
| leg13-near | 824 | 1 | 1 | 1 | none |
| leg0-far | 496 | 1 | 1 | 1 | none |
| leg1-far | 573 | 0 | 0 | 0 | none |
| leg2-far | 622 | 0 | 0 | 0 | none |
| leg3-far | 703 | 1 | 1 | 1 | none |
| leg4-far | 620 | 0 | 0 | 0 | none |
| leg5-far | 637 | 1 | 1 | 1 | none |
| leg6-far | 620 | 2 | 2 | 2 | none |
| leg7-far | 652 | 1 | 1 | 1 | none |
| leg8-far | 611 | 1 | 1 | 0 | 476 @ [528.5,607] |
| leg9-far | 609 | 1 | 1 | 1 | none |
| leg10-far | 627 | 1 | 1 | 1 | none |
| leg11-far | 653 | 1 | 1 | 1 | none |
| leg12-far | 615 | 1 | 1 | 1 | none |
| leg13-far | 571 | 1 | 0 | 1 | none |
| head-far-antenna | 4297 | 12 | 5 | 0 | 636 @ [1214,430] (padding); 639 @ [1194.5,450]; 640 @ [1214,470] (padding); 650 @ [1175,509] (padding); 653 @ [1175,548]; 655 @ [1194.5,489.5]; 657 @ [1194.5,528.5] (padding); 659 @ [1155.5,567.5]; 660 @ [1175,587] (padding); 661 @ [1136,587] (padding); 662 @ [1116.5,607] (padding); 664 @ [1155.5,607] |
| head-near-antenna | 2614 | 9 | 5 | 0 | 683 @ [1136,705]; 688 @ [1155.5,724.5]; 689 @ [1175,744]; 690 @ [1155.5,763.5] (padding); 691 @ [1175,783] (padding); 698 @ [1194.5,802.5]; 701 @ [1194.5,841.5] (padding); 702 @ [1214,861]; 710 @ [1234,880.5] (padding) |
| head-mouth-forcipules | 1325 | 1 | 1 | 0 | 686 @ [1116.5,724.5] |

## First conflict and source-join provenance

`leg1-near-proximal-observed-paint` selects only vertex **32**, source **[979,744]**, with inherited weight `[["root",1]]`. It is shared by leg1-near, leg2-near and body. It is not a Foot/contact pin. The exact source pixel at [979,744] has alpha 0: this is a padded field support, not a source pixel that can simply be relabelled.

A separate bounded graph trace (`a2b86f`, exit 0) reproduced all 916 source coordinates and inherited pin weights against the retained field, then returned metadata before diffusion. Vertex32 maps to original field vertex604. It is welded through `body--leg1-near` observed boundary samples at **x958–963/y726–734** and `body--leg2-near` at **x952–964/y732–743**. `root-welds.json` gives equivalent traces for all 26 distinct conflicting supports. This is evidence of coarse field influence extending from a source join, not permission to release the root lock.

For leg1-near the authored socket is [961,707], Knee [1007,758]. No unconflicted field member lies within their axis-aligned coordinate rectangle. The free painted support [998.5,763.5] is already below the Knee; moving a Knee region onto it would change the authored proximal extent merely to evade the lock. That is not recommended.

The three empty far regions are leg1-far (573 owned pixels), leg2-far (622), and leg4-far (620). For example, leg1-far’s socket [972,637] to Knee [955,607] has no free support in that coordinate rectangle; an available painted support [959.5,567.5] is on the distal span. All 14 far socket-to-Knee coordinate rectangles have no unconflicted member, although the existing far8 polygon legitimately includes the free painted support [528.5,607] just outside its rectangle. Rectangle membership is coordinate evidence only, not a complete anatomical test.

## Bounded next authoring step

The available sampling supports do not reliably resolve the source-authored proximal spans at the existing 40/80 density. One explicitly authored local **20/40** refinement of proximal/knee rectangles is supported by the measured empty/pinned regions. Use the existing mesh writer option; preserve source RGBA, labels, landmarks, sockets, presence, contacts, all inherited pins, solver profile and gates. Select rectangles from the observed proximal paint, not from a search for a passing pose. Do not silently use a free distal support or infer a new joint. No refinement or candidate search was performed in this diagnosis.

Viewing the actual fit02 body remainder also shows short proximal edge strips. Source-author review should decide which are real fixed trunk/collar paint and which are remaining limb fringe; this diagnosis does not declare every remaining root-labelled pixel anatomically correct. Refinement can localize a valid source join, but cannot repair wrong texture ownership.

All recorded inputs remained hash-identical during both diagnostics. Parent owns any source mask/region refinement and next intake. No static, film, art or CPU acceptance is claimed.
