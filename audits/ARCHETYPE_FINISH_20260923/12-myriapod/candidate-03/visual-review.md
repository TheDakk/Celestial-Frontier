# Centipede candidate03 — independent inventory and first source authoring

**Observed inventory:14 near walking chains +14 far walking chains,2ultimate appendages and2antennae.** The added anterior far chain is now separately visible. This review counts the actual master and does not borrow an intended count or coordinate from the guide.

- Master SHA-256: `e8173ea57501d604451cde79ec04715f28b683393c5de423750b4403abe4246e`.
- Initial authoring SHA-256: `da9020ec9c45507bf8ff41786614c943044d90e3c14c2b818e14148000ac9083`.
- Parent-owned presence SHA-256: `cae77bbdf0505d7019f67276201e7b965fde5cb305d5d7caffe4c43caff0117c`.

Only authoring.json and this review were written. No image generation/edit, runtime change, intake, rig/solver test or native film was executed. The original/rejected masters and prior reviews remain unchanged.

## Fourteen independently visible walking pairs

Index0 is anterior, nearest the head at right; index13 is posterior at left. Each row below records a manually observed source chain: a painted lateral attachment/socket estimate, visible major knee bend and distal foot point. Coordinates are authored source pixels, not exact biological measurements. Each far chain can be traced through its own exposed bend and tip. The row assignment follows attachment position along the actual trunk, not station coordinates in the guide.

| Index | Side | Fixed socket | Knee | Foot |
| --- | --- | --- | --- | --- |
| 0 | Far | [1022,639] | [1014,609] | [1057,558] |
| 0 | Near | [1024,710] | [1066,768] | [1026,824] |
| 1 | Far | [972,637] | [955,607] | [994,553] |
| 1 | Near | [961,707] | [1007,758] | [968,821] |
| 2 | Far | [911,632] | [895,600] | [933,543] |
| 2 | Near | [900,702] | [947,754] | [908,816] |
| 3 | Far | [851,629] | [835,592] | [866,536] |
| 3 | Near | [856,702] | [885,751] | [847,812] |
| 4 | Far | [791,623] | [775,588] | [812,532] |
| 4 | Near | [797,696] | [826,745] | [786,811] |
| 5 | Far | [731,621] | [713,585] | [748,530] |
| 5 | Near | [737,690] | [768,742] | [724,809] |
| 6 | Far | [671,623] | [653,587] | [687,529] |
| 6 | Near | [658,694] | [707,743] | [664,813] |
| 7 | Far | [610,629] | [591,592] | [626,535] |
| 7 | Near | [599,704] | [642,751] | [600,817] |
| 8 | Far | [549,638] | [530,600] | [569,539] |
| 8 | Near | [539,710] | [575,757] | [530,824] |
| 9 | Far | [488,643] | [468,607] | [503,551] |
| 9 | Near | [480,714] | [514,765] | [467,828] |
| 10 | Far | [427,645] | [409,608] | [443,558] |
| 10 | Near | [421,716] | [444,763] | [397,831] |
| 11 | Far | [366,642] | [350,604] | [387,552] |
| 11 | Near | [362,713] | [381,758] | [333,824] |
| 12 | Far | [305,633] | [289,598] | [330,542] |
| 12 | Near | [302,705] | [324,751] | [275,818] |
| 13 | Far | [246,627] | [231,593] | [266,536] |
| 13 | Near | [244,700] | [263,746] | [214,815] |

The ultimate far appendage runs from approximately[193,640] to[46,548], andultimate near from[183,686] to[63,800]. They are the15th total leg pair, distinct from the14ordinary walking pairs. Two antennae terminate around[1208,415] and[1220,863]. Compact paired mouth claws below the head are not counted as legs or antennae.

Core source points are root[640,665],head[1070,669],mandible[1112,724], withhead fixed socket[1027,660]. The antenna/ultimate coordinates above complete the63 movable-joint landmarks. The head plus28hip plus2ultimate attachments total31source-fixed sockets. All94 authored points were checked directly against retained positive alpha; this is point-on-source inspection only, not an anatomical or rig acceptance test. Thin distal extremities include low-alpha paint retained by the source; no alpha threshold was used to discard or reinterpret it.

## Thirty-two texture owners and regional weighting

The texture inventory is exactly28whole walking limbs +2ultimate appendages +head +body. Whole-limb polygons use manually observed paths with authored contour envelopes; these polygons still need actual raster-label review. No walking legs are combined. The head texture contains the visible antennae and mouth paint but explicitly seeds the two antenna controllers andmandible in three separate observed regions. Each leg has one proximal region assigned to its Knee, withthe lower span retaining theordinary Foot split defaults. All31regions use pin:false. No added texture parts or regional shape-lock pins are requested.

Each regional extent is an initial source authoring decision. It must contain named-part paint andan eligible existing support; if it meets an inherited pin or other-region conflict, intake must refuse andretain evidence. No region was chosen by running a solver or searching a threshold. The compiler may not silently snap the region to a nearby vertex.

The trunk is explicitly rigid in this representation. Painted segmentation does not imply eight independently animated trunk controllers. Source hips are fixed sockets carried by thetrunk; each ordinary walking leg keeps its independent two-span support chain. Thetwo ultimate appendages have one controller each, so their visible bends do not claim separate knees. The63-joint/32-owner inventory remains within the unchanged64/32caps.

## Source uncertainty and framing

Sockets are visible attachment estimates; painterly joints andinternal anatomy are not exactly observable. Distal points identify painted terminal regions rather than a scientifically measured outermost pixel/contact plane. Polygon envelopes andregional subdivisions remain subject to the first compiled labels andintake receipts. No hidden/absent/folded declaration was inferred; parent owns presence.json.

Parent's retained master-integrity.json reports positive-alpha bounds[39,50]…[1227,1197], diagnostic core bounds[42,414]…[1224,871], andno border pixels. Main tips appear complete, but the requested8% horizontal safe margin is missed. The diagnostic core cutoff is not an intake alpha cutoff. Every delivered pixel/fringe remains unchanged. No crop or motion acceptance is claimed.

Parent owns the first regional intake andsubsequent qualification; Nick reviews art; Claude consumes only signed results through theauthorized handoff.
