# Pack 7 C2 bounded repair — review request

Please review the result of the two authorized corrections. Nick owns final acceptance.
No GitHub write, kit edit, repaint, new clip curves, third repair or larger rework is authorized
by this document. No new ten-second capture ran because the prescribed Civet gate failed.
Accepted labelled portrait fallback remains retained; it is not articulated acceptance.

## Changes actually applied

Source1873abe0. Civet head patch0.025→0.045, new neck patch0.040 at chest parent pivot.
Head sourceCentre remains[0.35,0.49]; new neck uses the same fur sample centre. One33-part atlas,
2047x1006. Original master, turnaround, masks, clips, pivots and CreatureRigV1 unchanged.
The larger square crop contains253magenta pixels in a corner outside the retained disc.
The original guard rejected this before masking. It now checks only retained disc/coverage
ink; a retained-magenta negative control still refuses. Initial failure retained.

Fox re-observation changes only three knees on the same hash-bound master:
hindNear[.328,.775],foreFar[.782,.670],foreNear[.663,.680]. HindFar already had sufficient slack.
Roots, ankles, paws, ground, identity, materials, clip set and mask polygons unchanged.
Joint-axis alpha admission passes using the existing1.2% hidden-axis tolerance. Bounds/bone
lengths/recipe and mask binding hashes rebuilt; one22-part atlas. Candidate record lives at
candidate-01/fox.landmarks.json. It is authored master data, not a procedural gene override.

## Native outcomes

- Civet rest:0changedRGBAchannels against keyed master.
- Civet7400ms actual GSAP hit pose, full head+neck+chest rest union143503pixels:
  old0.025declaration24473transparent pixels; corrected declaration24370. Required target0
  FAILS. Both were rendered with identical resolved pose at native1254square resolution.
  No region erosion, convenient crop or dropped boundary pixels. This strict rest-union
  number includes vacated silhouette boundary as well as joint gaps; do not relabel all24370
  as an internal hole. Visual inspection separately confirms an open throat seam and other
  articulated seams in civet-hit-7400-repaired.png. The repair has not held shape.
- Fox rest:0changedRGBAchannels. Old record still refuses exactly1375ms with the unchanged
  compression-bound reason. Corrected record:1200samples over the10second interval at120Hz,
  no refusal, maximum compression5.0189%BL under unchanged8%cap.
- Actual Claude compileBodyCard reports fox legSlack: hindFar4.2306%,foreFar3.1921%,
  hindNear4.0101%,foreNear3.2313%; card.notes is empty. No manually entered body card.
- Same scan Civet max5.8267%,procedural5.2172%; those contact passes do not establish shape.

## Review scope

1. Confirm both requested patch radii/pivot binding, same sample centre, retained-ink guard,
   renderer measurement and old declaration negative are implemented as specified.
2. Inspect old/repaired7400ms PNGs and red missing-pixel overlay. Explain why the prescribed
   patches cover only103additional pixels in this gate and why the throat seam remains.
3. Separate legitimate vacated outer silhouette from actual opened joint seams when assessing
   the requested rest-silhouette oracle. Propose any necessary ruler clarification explicitly;
   do not weaken or retroactively mark this failed gate passed.
4. Accept or identify a specific defect in the corrected fox authored record/card/contact proof.
5. If further Civet work is justified, propose ONE concrete bounded next repair with its exact
   changed data/code and positive/negative evidence for Nick to authorize. No repair in this review.

## Evidence

native-gates-01/report.json records the native browser, exact source/input hashes, actual body
cards,7400ms pose, dense diagnostics and both controls. Native gate statusFAIL is preserved.
RESULT.json is a compact extraction. candidate-01 has corrected declarations/record/atlases;
old controls remain under C2_PARTS_ATLAS_20260913 and CIVET_2D_PROOF_20260912.
The included native PNGs are rendered evidence, not newly generated artwork.
Typecheck,7rig/contact tests,2patch tests and root validation pass. No unit checkout lock.
Read-only corrected GSAP SHA6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74
matches. Claude-owned modules are not copied/edited. No GitHub action; PR42parked.
