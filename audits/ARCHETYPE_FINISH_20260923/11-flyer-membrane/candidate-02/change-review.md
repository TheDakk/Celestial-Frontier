# Fruit Bat candidate02 — bounded label ownership correction

This is the same paint03 master with manually corrected source ownership. No new painting, intake, tests, solver changes or numerical landmark search was performed. Root authoring.json and fit-01 remain immutable. The current generation request is retained at ../request.json; ../generation-receipt.json identifies the original tool output. This candidate's master.png is an exact byte copy, not a new image request.

- Original authoring SHA-256: `1a88593285413314910c8a29f951dbacc5aa0c9b3a870d5dcae274fe9d6c9a3e`.
- New authoring SHA-256: `3d619e738f1411ce37ea22ca58576e2f827a1918ee74c7f19abc8ac58727345b`.
- All 21 landmarks, material overrides, graph names, part count/order, groundLineY and parent declaration values remain identical.

| Exact source copy | SHA-256 |
| --- | --- |
| master.png | ba6037964ac289b10cb7ccac9c44bdf05395deeec827a412fa4e97be5f7ca1a7 |
| prompt.txt | f1713b7201837b939222a965582363fdec3f1bd25fec555599547cf35743fe88 |
| subject-source.json | 11b0449e8b28659334e36aba28200712f679e0c4d7ca886b188c16cd58baa9e3 |
| presence.json | 90cf2f6724cac8198eb24d82d7fedff1b33d8f3038c794e394002d4a404f95db |

## Observed reasons

Fit01 body.png retains narrow painted strips along the far wing's upper outline and body-side descending edge, the near wing's long leading edge, and small low membrane scallop/tip fragments. The main internal wing cuts are contiguous. Outer envelopes are expanded locally around those observed surfaces; the near-wing lower shared endpoints expand together.

At the near thumb, a close source view shows the brown far membrane inside/behind the curved dark claw. The previous polygon enclosed a triangular far-membrane patch. Its new outline follows the hook's visible curve instead, so that background patch is left to the correct far-wing owner. No thumb endpoint or wing landmark moves.

Both feet have root-owned outer fringe at the lower-limb/foot contours. Read-only diagnostic crops of the existing body image found 100 positive-alpha body pixels in source rectangle x520…609/y845…944 (actual residual extent x569…609/y866…933), and 280 in x680…769/y825…939 (extent x682…769/y825…908). These counts describe those bounded windows only, include fringe and nearby membrane where present, and are not claimed to be all foot pixels. The actual master confirms that the ankle/foot regions are limb surfaces; the torso does not extend to the claw tips. The foot and upper-leg outer envelopes now include their visible narrow edge strips while keeping the existing anatomical landmarks fixed.

Parent/peer's separate fold-diagnosis-01.json identifies far-foot triangle711 and near-foot triangle654 with two body-owned pinned upper corners. That diagnostic motivated inspecting these source labels; coordinates were not moved to satisfy a solver. This authoring makes no claim that the changed fit will pass.

## Exact polygon changes

The following old and new pixel vertices retain the authoring decisions for review. Changes concern outer envelopes, the shared lower-edge endpoints, and the near-thumb silhouette. Other seven polygons are unchanged.

### wing-near-distal

Before: `[[435,477],[503,791],[476,769],[437,750],[394,746],[366,756],[337,735],[295,725],[251,728],[214,751],[189,726],[174,706],[151,692],[121,685],[89,691],[50,705],[45,683],[86,668],[130,643],[205,599],[280,555],[357,510],[410,477],[435,466]]`

After: `[[435,477],[503,797],[476,774],[437,755],[394,751],[366,761],[337,740],[295,730],[251,733],[214,756],[189,731],[174,711],[151,697],[121,690],[89,696],[45,710],[40,680],[83,663],[126,638],[201,594],[276,550],[357,510],[410,477],[435,466]]`

### wing-near-wrist

Before: `[[435,477],[397,453],[396,438],[415,418],[415,442],[427,458],[438,465],[647,419],[651,430],[694,831],[656,806],[620,787],[572,772],[539,778],[503,791]]`

After: `[[435,477],[417,469],[405,463],[399,456],[397,448],[399,439],[404,433],[411,430],[408,436],[405,443],[406,451],[412,458],[423,463],[438,465],[647,419],[651,430],[699,842],[660,814],[623,794],[575,778],[539,783],[503,797]]`

### wing-near-elbow

Before: `[[651,430],[652,419],[831,532],[822,540],[763,760],[749,776],[716,811],[694,831]]`

After: `[[651,430],[652,419],[831,532],[822,540],[763,760],[753,782],[722,818],[699,842]]`

### wing-far-wrist

Before: `[[394,355],[375,353],[362,338],[363,321],[381,310],[378,332],[390,343],[604,301],[600,680],[480,680],[342,612]]`

After: `[[394,355],[375,353],[362,338],[363,321],[381,310],[378,332],[390,343],[505,312],[609,289],[604,301],[600,680],[480,680],[342,612]]`

### wing-far-elbow

Before: `[[604,301],[606,291],[785,411],[785,419],[808,531],[748,582],[681,635],[600,680]]`

After: `[[604,301],[610,283],[793,403],[785,419],[808,531],[748,582],[681,635],[600,680]]`

### wing-far-base

Before: `[[785,419],[785,411],[839,444],[848,486],[874,520],[842,538],[808,531]]`

After: `[[785,419],[793,403],[850,439],[853,484],[882,520],[842,538],[808,531]]`

### leg-far-foot

Before: `[[549,874],[578,875],[579,899],[574,919],[567,938],[552,935],[545,920],[536,924],[523,912],[524,891],[537,880]]`

After: `[[549,874],[578,875],[592,895],[592,921],[578,944],[549,947],[534,932],[521,931],[510,916],[512,886],[537,874]]`

### leg-far-upper

Before: `[[612,758],[683,767],[697,800],[659,815],[625,849],[587,891],[560,902],[537,887],[550,860],[576,824],[595,790]]`

After: `[[612,758],[683,767],[697,800],[670,824],[639,858],[600,891],[565,913],[528,892],[543,852],[570,816],[595,790]]`

### leg-near-foot

Before: `[[705,851],[739,852],[752,877],[750,910],[734,936],[709,938],[693,930],[691,916],[710,908],[716,891],[708,878],[697,878],[696,863]]`

After: `[[705,851],[739,852],[754,870],[766,901],[758,930],[739,945],[698,947],[680,932],[682,910],[694,897],[685,883],[686,859]]`

### leg-near-upper

Before: `[[750,748],[829,747],[818,786],[787,824],[754,859],[731,886],[702,884],[692,864],[710,838],[730,802]]`

After: `[[750,748],[829,747],[818,786],[805,818],[772,863],[746,893],[700,899],[680,878],[699,837],[730,802]]`

The full master RGBA is unchanged; no threshold, erosion, trimming or pixel recoloring is used. Isolated distant alpha flecks have not been asserted to be anatomy and remain retained. Actual candidate02 raster ownership still needs inspection; this is a bounded corrective draft, not a declaration of zero residual labels. Parent owns changed intake/static/native qualification, Nick art review and the signed handoff.
