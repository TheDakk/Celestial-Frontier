# C2 parts motion — review response (Claude, read-only)

Date: 2026-09-13. Reviewed from the three C2 review archives (fox, procedural, failed-parts): `proof-02/civet-10s.webm` at normal speed plus frames cut at 1.7, 2.1, 7.25, 7.40 and 7.60 s (200 to 250 percent zooms of the head), the five civet stills, the fox and procedural fallback stills and clips, both reports, `REVIEW_SUMMARY.json`, `fox-plans.json`, `creature-rig.ts`, `creature-rig-contact.ts`, and, read-only in Codex's worktree, `C2_PARTS_ATLAS_20260913/civet.part-masks-v2.json`, `civet.joint-patches-v2.json` and the README. No kit, source or image edited. Nick owns final visual acceptance.

## 1. Civet parts rig: the neck disconnection

**What opens.** At the hit recoil (head −20°, neck −12°, both authored in the quadruped `hit` clip) the head part rotates about the neck landmark while the head/neck boundary in `civet.part-masks-v2.json` is a straight ownership cut with exactly one owner per pixel. The rotation opens a wedge along that cut whose width grows with distance from the pivot: at the outer ends of the boundary (about half a neck-thickness from the pivot, roughly 50 px at 1254) the wedge is about 15 to 18 px wide at 20°. The head joint patch (`{ joint: "head", radius: 0.025 }`, a 31 px disc at the pivot) covers the middle of the cut and not its ends, so the throat and the crest show arena behind them at 7.40 s (`civet-hit.png`), and a softer seam remains at 7.60 s as the head settles. The same wedge appears smaller at the strike (2.1 s) because the melee neck angles are smaller. Nothing is wrong with the transform: pivots, layer order (patches under base parts, neck and chest drawn over the head) and `applyPose` are all doing what the contract says.

**Minimum correction (Codex's declaration, no rig or contract change):**
- Raise the `head` joint patch radius from 0.025 to 0.045 (the builder's cap is 0.05), so the disc reaches the boundary ends. Its `sourceCentre` stays a painted fur sample from the turnaround.
- Add a `neck` joint patch of radius 0.040 at the neck's parent pivot (the chest landmark), because the neck bone rotates −12° on the same recoil and its lower cut has no patch at all today.
- Keep the one-owner mask invariant; the patches are the sanctioned duplicated pixels and already draw beneath the base parts.

**Evidence and negative control.** Re-render the same `hit` pose at the same time (7.40 s frame, or `applyPose` of the recoil key) and count pixels inside the rest silhouette of the head∪neck∪chest region that are transparent (arena visible): target 0 with the two patches; the current 0.025-only declaration must count more than 0 on the same frame (that is the failing control); the rest render must still differ in 0 RGBA channels from the keyed master. This is one bounded generic repair and it is justified before another full parts capture: it is a declaration change, hashed, with a still-frame gate that predicts moving overlap, which the rest check never could.

## 2. Fox contact refusal at 1375 ms (command phase)

**Diagnosis: record geometry, not the timeline.** From the compiled cards in the report, rest-pose leg slack (two-bone reach minus the vertical hip-to-ankle distance, at the rest horizontal offset):

| leg | civet | fox | procedural |
|---|---|---|---|
| hindFar | +4.7 % BL | +4.2 % | +3.7 % |
| foreFar | +2.3 % | +0.2 % | +1.4 % |
| hindNear | +4.3 % | +0.7 % | +3.7 % |
| foreNear | +0.2 % | **0.0 %** (straightness 1.000) | +1.4 % |

The fox's foreNear chain is authored perfectly collinear (hip, knee, ankle on one line) and its foreFar and hindNear are within 1 percent of straight. The solver's "compression" is the amount the planted paw would have to be lifted past the leg's reach, and it pushes the root by that amount to keep the paw planted; with zero rest slack every upward body motion converts one to one into that number. At 1375 ms the fox is in the command phase where the idle bob (up to 0.9 % BL lift) and the alert lift with its chest and neck rotations stack on the straight leg, and the 8 % bound trips at the first dense sample. The civet's foreNear is nearly as straight (0.2 %) and passes only because it is lighter and its lifts smaller. **Do not relax the bound**; a straight rest leg is an observer error: a standing fox's carpal and tarsal joints are never collinear.

**Bounded correction (Codex's observer/record lane):** re-observe the fox with the knee landmarks off the hip–ankle line so every leg has rest slack of at least 3 % BL (straightness ≤ 0.97, what the civet's hind legs already have). Negative control: the current fox record must still refuse at 1375 ms; the corrected record must pass the 120 Hz dense scan with `maxCompression` under 8 %. The `compileBodyCard` proportion envelope is in my lane and could add a `leg-slack` bound that refuses a collinear chain at compile time with a named reason; I will add it if Codex prefers the compiler to catch it first, but the record must be corrected either way.

## 3. Whole-portrait fallback clips (fox, procedural, civet fallback): ACCEPT as labelled presentation

Staging, timing and ground registration read correctly: both combatants sit on the 0.78 ground line, facing is right for each stand, the run-up and return land on the choreography beats, the hitstop and flash are on the strike frame, parallax follows the run-up, and the Wild sweep and impact are placed from the attacker's origin to the target's contact. Overlap at the contact is acceptable for a portrait. The labels are legible in every frame and the rain E painting beside them makes the source honest. Readability: the procedural orange quadruped reads as the painter's own output, not library art, and says so. Two small notes, not fixes: the damage number in the parts clip reads "−12" with a leading minus while the choreography's number is the bare amount (the proof page's own caption), and the fallback's root-driven compression on the hit is subtle enough that the hit reads mostly through the number and flash. ACCEPT for fallback presentation; this does not close the parts rig.

## 4. One bounded generic repair before another parts capture: YES

The neck patch change in section 1 (two declaration numbers, one still-frame gate with a failing control) is justified now and should precede any new ten-second capture. The fox record correction in section 2 is a second bounded change in the observer with its own control; it should land before the fox is captured again. Neither is a broad rework, and nothing here approves the rig on Nick's behalf.

GitHub step: none. PR42 stays parked.
