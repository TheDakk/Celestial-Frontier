# Four painted crabs — no-hidden intake, partial completion

Authority: Nick's September20 direction and Claude's sibling read-only
`audits/VISION_PROGRAM_20260920/P1-four-crabs-review/README.md`.
The original four generation01 masters are immutable1254×1254 RGBA. No repaint,
resize, alpha/channel change, reused canvas labels, hidden/absent declaration,
raw-clip/limit/threshold change or native film. Nick's art verdict is still pending.

## Completed: Vent Crab

[Observed coordinates/polygons](vent-crab-observation.json), [mask + landmarks](vent-crab-fit-01/mask-landmarks.png),
[record](vent-crab-fit-01/record.json), [binding](vent-crab-fit-01/binding.json),
[shared split receipt](vent-crab-fit-01/receipt.json), [static rows](vent-crab-static-01.json).

25parts (body,16walking segments,6claw segments,2stalked eyes), eight contact chains,
3794field vertices at boundaryStep24/interiorStep56. The shared hidden-01 intake,
observed surface split and contact locks are unchanged. All12static rows plus the
existing10-second presentation pass: exact rest, maximum planted drift0.0226671px
against0.25px; maximum seam gap0.00007038px. No native pixel-rest/film or CPU claim.
The record has no anatomy presence override. Proximal attachments and partly occluded
rear-chain endpoints are explicitly authored observations, not independent pose/visual
acceptance. Native films remain held for the CPU decision and split continuity guard.

## Unresolved: three chain locations

The review says eight visible walking legs on all four. During new mask authoring,
Codex could trace only seven separate painted chains on these three masters:

| Subject | Unresolved chain | Retained draft | Detector overlay |
|---|---|---|---|
|Crab|fourth right / leg3Near|[23mask parts](crab-draft-masks/receipt.json)|[Candidate IDs](crab-tip-candidates.png)|
|Freshwater Crab|fourth left / leg3Far|[23mask parts](freshwater-crab-draft-masks/receipt.json)|[Candidate IDs](freshwater-crab-tip-candidates.png)|
|Mud Crab|fourth left / leg3Far|[23mask parts](mud-crab-draft-masks/receipt.json)|[Candidate IDs](mud-crab-tip-candidates.png)|

These drafts are NOT admitted rigs. Original visible pixels reconstruct exactly from
the draft masks, but the missing chain is not filled with body/claw paint or inferred
hidden. The unchanged complete-landmark check rejects each with
`Skeleton pose: exact landmark inventory`; [refusal ledger](refusals.json).
No binding, vertex count or static animation PASS is invented for these rows.
This is an unresolved authoring/reviewer count discrepancy, not a definitive species
or model-anatomy verdict. Nick was asked for foot/knee coordinates and directed use of
the tip detector; the detector run and comparison are retained below.

## Detector evidence requested by Nick

`detect-candidates.mjs` imports Claude's `tips.mjs` read-only, without copying or
modifying it. Source hashes, original image hashes, exact parameters, working-scale
outputs and mapped master coordinates are in each `*-tip-candidates.json`.
Window radii8/14/22/32/48/64,512working scale,alpha128; no detector threshold tuning.
Mapped coordinates are quantized working-cell centres, not exact subpixel ground truth.

The **raw downward candidate counts reproduce Claude's9/9/9/11**. They are not eight
unique walking feet: candidates include claw fingers and duplicates along the same toe.
For example Crab1/10 share its right middle toe,3/12 share its front-right toe;6/8
are left claw tips and7 is a right claw tip. Freshwater7/9 are its two low-left feet,
6/15 the same upper-left toe;3/10 and4/5 are claw fingers. Mud7/11 share its far-left
toe,4/13 share its lower-left toe;5/8 and6/9 are claw fingers. The naive classifier
reports4/5/6/8feet and is expressly not a certified admission tool in Claude's README.
Neither raw candidate count nor classifier count supplies the unresolved ownership.

The next required input is an identified painted foot/knee or labelled chain path on
these three immutable masters. Do not generate a new image, add hidden presence or
silently borrow a toe already assigned to another leg. Once locations are resolved,
finish the records/splits/bindings and static rows before claiming a five-painted-subject
vertex table. Coconut accepted fit04 and Vent currently supply two measured bindings.

## Mud Crab T2 and validation

[Facial orbs finding](mud-crab-T2.json): the species line said exactly two eyes; two
stalked eyes and two dark facial orbs are retained. Orbs remain body paint, no extra
eye joints. This T2 finding is not an intake refusal and caused no repaint.

Tool syntax checks pass. [Root validate](validate.log) passes with unchanged50-probe
v1.0 fingerprint. Runtime/hidden contracts, clips, limits and accepted Coconut inputs
are unchanged. Node26.9.0 uses the uninterrupted September19 receipt; builds and static
checks ran under the shared toolchain lock. These are offline results, not CPU timing.

Signed local checkpoint **890b3f5f**, verified in
[signature receipt](producer-signature.json). Earlier1Password refusal is resolved. No fetch, push, PR, merge, release or deploy. Codex resumes
from the specific unresolved coordinates; Claude can review these candidate overlays
read-only. No app switch for Git is needed; no sync/copy to the sibling worktree.
