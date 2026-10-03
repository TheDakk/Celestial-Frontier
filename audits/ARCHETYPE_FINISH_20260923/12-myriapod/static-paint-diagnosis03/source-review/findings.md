# Consolidated source plan after static03

This is a source-only review of the19 fully pinned target-inversion faces in report.json's union and the22 root-pin source-edge traces in root-edge-inspection.json. The union comes from the audit agent's target-only scan of121 canonical poses for each of hit/dodge/tame, not a full new ARAP/static battery. This review executed no pose, solver or test. Direct source RGBA crops and their hashes are retained here.

## Near row: correct source ownership

All five affected near parts show clipped shaft or retained fringe below their existing body-side hip cuts. Their observed problematic source extents are:

| Part | Traced source edge | Source interpretation | Proposed additional outer-envelope point(s) |
|---|---|---|---|
| leg1-near | [1009,733]–[1016,740] | Gold/orange upper-shaft edge continues into faint fringe; not trunk | [1018,737] |
| leg3-near | [881,705]–[897,727] | Gold upper-shaft edge and fringe below its collar | [886,705],[901,727] |
| leg5-near | [783,724]–[789,732] | Retained alpha1 limb fringe | [792,730] |
| leg6-near | [701,708]–[708,713] | Semitransparent upper-shaft edge and fringe, above the previously repaired outer point | [707,709] |
| leg13-near | [270,707]–[270,708] | Two retained alpha1 limb-fringe pixels | [274,708] |

These bounded points sit on the outer-envelope side of the visible descending gold limbs. Existing hip-cut endpoints, lower contours and every source pixel remain untouched; no alpha cutoff, automatic nearest-joint ownership or root-pin deletion is proposed. They address all five near cases in the measured union together.

## Far row: retain genuine collars, resolve coarse sampling

Far0/3/4/5/6/7/10 root traces include brown opaque dorsal trunk-rim pixels below the visible gold leg attachments. Those collars are anatomically body-owned; all far masks remain unchanged. Fine mesh supports must distinguish the short gold thigh/knee area from this real fixed boundary.

The source strip also shows far8/11 have the same short, visibly bent gold proximal spans. They were not flagged by this three-action target union, and this review does not assert an unobserved failure. Applying the same source-authoring sampling/core policy to all remaining far spans avoids choosing density solely from the first failing phase. Five far spans(1/2/9/12/13) already use local8/32 detail and16px bend cores. The proposed final nine receive the same existing sampling option and source-centered±8 bend-core declaration:

| Far index | Manual observed hip/Knee envelope | Sampling rectangle after10px margin(x,y,width,height) |
|---|---|---|
|0|[1001,596]–[1037,645]|[991,586,56,69]|
|3|[822,580]–[864,634]|[812,570,62,74]|
|4|[762,576]–[804,628]|[752,566,62,72]|
|5|[700,573]–[744,626]|[690,563,64,73]|
|6|[640,575]–[684,628]|[630,565,64,73]|
|7|[578,580]–[623,634]|[568,570,65,74]|
|8|[517,588]–[562,643]|[507,578,65,75]|
|10|[396,595]–[439,650]|[386,585,63,75]|
|11|[337,591]–[380,647]|[327,581,63,76]|

The envelopes are conservative manual source extents, not measured alpha bounding boxes. The existing Knee centers lie in each gold bend in the viewed source;±8 describes that central bend without claiming an exact internal biological joint. Retain pin:true, all inherited body/contact locks, all landmarks/sockets/contact definitions and the existing limits. No mask transfers the brown rim to a limb.

This plan is not acceptance or a promise that refining the field removes every later refusal. Parent owns candidate authorization, changed intake and measured qualification.
