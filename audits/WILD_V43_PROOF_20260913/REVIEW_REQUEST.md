# Claude review request — C1 Wild v4.3 / arena intake

Review the attached files read-only. Nick's art direction is unchanged. ART_KIT v4.3 is
approved from e89cb621 with the exact adoption metadata changes; do not propose another art
direction or re-review accepted kit wording. The Earth temperate arena FAR/MID/NEAR is accepted
as template v1. The old Wild sequence's shapes/phases were accepted but its palette was
rejected as Frost. New Wild phases were painted once each in f802dde7. Metadata-only alpha
bounds were added in9ae342da for the A2 parser. No staging or animation acceptance is claimed.

## Files to inspect

1. audits/WILD_V43_PROOF_20260913/wild-masters-review.png, then wild-launch.png,
   wild-travel.png and wild-impact.png at native1254-square size.
2. keyed/ and registered/ phase PNGs on a neutral dark background; inspect edges at100% and200%.
   wild-registered-review.png shows the common1024-square layout.
3. wild-anchors.json for registered files, wild-anchors-master-fallback.json for original
   per-phase anchors, intake.json, generation.json and all three exact *.prompt.txt files.
4. ART_KIT.md§4K (especially the closed theme material table), the approved Discovery Atlas
   reference and Living Worlds triptych. The old v4.2 Wild review sheet is comparison only,
   never an accepted palette reference.
5. audits/ARENA_V1_ACCEPTANCE_20260912/arena-template-v1.png, arena-mid-despilled.png,
   acceptance.json and despill-receipt.json, plus the C1 mid-verification.json.

## Questions to answer

- Does each phase now read as Wild—claw rake, fur tufts, torn leaves, kicked earth and wind
  streaks in warm ochre/earth—with #9fb6d6 only as a small sheen? Does anything still read
  as Frost, fire, a literal severed animal part, or a different painting hand?
- Do launch, travel and impact form one material/shape family at the same direction and
  intended scale? Are fine marks legible at runtime size without excess visual noise?
- Identify any visible magenta fringe, holes, lost fur/leaf edges, or dark plate/frame
  contamination at100%/200%. Existing keyer unresolved-pixel counts are89/597/529; those
  are disclosed, not a zero-fringe claim. Give phase and pixel/crop location for each defect.
- Does the intake registration preserve sensible launch origin, sweep and impact convergence?
  The generator enlarged the originals beyond requested bounds. Registered copies use
  uniform downscale+translation, no warp/crop/repaint; active anchors align within.5pixel.
  Empty anchors are virtual. Distinguish image/anchor fit from animation, which is not yet
  staged. Melee sweep hold-and-reveal is the intended A3 interpretation, not projectile slide.
- Is the registered anchor JSON compatible with CONTRACTS§4/6 and the committed A2 parser,
  including the added alphaBoundsPixels? If you have A2 code locally, validate it read-only;
  otherwise state that compatibility is unverified rather than assuming it passes.
- Did MID's completed intake-only pass preserve the accepted arena? It corrected exactly190
  RGB pixels, alpha unchanged, on a copy; do not request a repaint for accepted composition.

## Return format

Give separate ACCEPT / TARGETED INTAKE FIX / REJECT verdicts for launch, travel, impact,
sequence consistency/registration, and MID despill. Separate visual findings from metadata
or future choreography issues. Name every reviewed file and any file you could not inspect.
For each necessary correction, give the smallest concrete change and a crop/coordinate.
Conclude whether Nick can accept these images for C2 staging. Nick owns final acceptance.
No kit wording changes, new image generation, code edits, commits, merges, GitHub writes or
history rewrites for this review. Return Markdown for Nick to supply to Codex as
WILD_V43_REVIEW_RESPONSE_20260913.md. Independent C2 rig coding continues during this review.
