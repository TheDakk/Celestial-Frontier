# Fit03 regional pin diagnosis

Changed inputs: candidate05 / fit03 retain global mesh sampling 40/80, add two explicitly authored proximal-strip refinements at 24/56, and declare 24-pixel Knee patches with pin:true. This diagnostic uses those actual inputs; it is not an unchanged retry of fit02.

One region inspection (`01cb28`, exit 0) and one source-weld trace (`cf42a0`, exit 0) found **five conflicting regions / six inherited root supports**. All 31 regions now contain owned positive-alpha paint, select field supports, and include at least one unconflicted support. No different-joint regional overlap was found. The first error exactly matches the original retained refusal: vertex69 in leg2-near-knee-bend-observed-paint. No compile, diffusion, new fitted binding, static run or gate change was performed.

| Region | Owned paint pixels | Conflicting root supports (source px) | Unconflicted selected supports (source px) |
| --- | ---: | --- | --- |
| leg2-near-knee-bend-observed-paint | 566 | 69 @ [959,744] | 131 @ [940,744]; 133 @ [940,763]; 156 @ [949.5,753.5]; 157 @ [959,763] |
| leg6-near-knee-bend-observed-paint | 571 | 352 @ [714.5,734] | 338 @ [695,734]; 339 @ [705,744]; 343 @ [695,753.5]; 354 @ [714.5,753.5] |
| leg1-far-knee-bend-observed-paint | 527 | 834 @ [959,607]; 837 @ [949.5,617] | 833 @ [949.5,597] |
| leg2-far-knee-bend-observed-paint | 550 | 867 @ [900,607] | 866 @ [890,597] |
| leg12-far-knee-bend-observed-paint | 560 | 1284 @ [293,607] | 1279 @ [293,587]; 1283 @ [283,597] |

Every listed conflict has inherited weight `[["root",1]]`, not a Foot/contact lock. `report.json` retains all31 regions, selected coordinates, weights, source alpha/owner, member parts and source-paint counts. `root-welds.json` retains each exact body adjacency, root-side pixel coordinate, RGBA and alpha. The separate source-weld trace reproduces the retained field coordinates and inherited locks before returning metadata; it emits no binding.

## Concrete remaining ownership errors

Vertex69 [959,744] is itself leg2-near-labelled paint (alpha135), but it is welded to body through nearby source boundaries. The body--leg2-near boundary includes actual gold shaft pixels **[953,732] alpha253**, **[952,731] alpha245**, and **[954,733] alpha232** still labelled body. This is opaque limb paint incorrectly retained by the root remainder. It cannot be fixed by re-labelling the already correct pixel at the field support.

The same support is also welded through body--leg1-near fringe at **[957,726]**, **[959,730]**, **[960,731]**, and two other retained alpha1 root pixels, within source-edge bounds x958–963/y726–734. Correcting only the opaque leg2 strip can leave this second root path. All exact pixels are in root-welds.json.

Near6 vertex352 [714.5,734] is leg6-near paint (alpha249). Its root weld is caused by one retained root pixel **[717,724], RGBA [255,0,0,1]**, on the source boundary. No opacity cutoff or discarded pixel is proposed.

Far1, far2 and far12 are different cases: their root welds reach observed body boundaries approximately y622–640 and include brown trunk pixels. Example root witnesses are far1 [958,640] alpha252; far2 [891,634] alpha253; far12 [285,635] alpha251. Color alone is not an ownership rule. Inspect the actual trunk/hip boundary before reassigning these pixels; this report does not claim they are all wrong or all correct. The existing field can extend a valid fixed collar into a knee patch, so source ownership and sampling must be distinguished.

## Repair boundary

First correct only the manually observed remaining limb shaft/fringe ownership in a fresh source-authoring candidate, including both root paths affecting vertex69. Preserve the desired Knee patch, source landmarks, sockets, presence, source alpha, contact locks and limits. **Do not shrink a knee patch around an ownership error, release a pin, or move Knee influence onto a free distal surface merely to obtain a pass.** If an independently correct trunk/collar still reaches the intended knee region, a source-authored local mesh refinement can localize it using the existing writer; no such search or refinement was performed here.

`root-leakage-footpoints.png` is the requested unchanged renderer applied to the changed fit03 labels and candidate05 source (`5ee906`, exit0). Its 61,886 highlighted body-labelled pixels include the legitimate trunk; this is not a wrong-pixel count. Every nonzero-alpha root pixel is amplified for visibility only. The original source image, labels and authoring stay unchanged. The complete visualization receipt retains exact input/output hashes.

Parent and authoring agent own candidate06 and the next intake. No future result is predicted. All inputs recorded by these diagnostics remained hash-identical.
