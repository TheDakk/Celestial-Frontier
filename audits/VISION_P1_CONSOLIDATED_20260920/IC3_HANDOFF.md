# IC-3: stable writer boundary for the intake compiler

Authority: Nick September20; PROGRAM.md§5 on anthropic lane read-only. No sibling source
copied, edited or synced. No new painting/P2/roster until compiler acceptance.

Claude IC-1/IC-2 owns guide registration, hidden inference and pixel ownership. Codex owns
these existing shared writers under `port/v2/tools/creature-animation/`:

1. `sealFamilyRecord` in `family-record.mjs`: complete family inventory, normalized landmarks,
   explicit `cf.anatomy-presence/v2` hidden/absent declarations and input/source hashes.
   `inferHiddenLandmarks` in `hidden-anatomy.mjs` implements the accepted template rule;
   writer never silently declares hidden because a landmark or painted part is missing.
2. `buildAuthoredParts` in `build-authored-parts.mjs`: record file, immutable master file,
   declaration file, new output path. Delivered RGBA remains1254² for these five paintings.
   For the existing label-map contract, declaration schema is `cf.painter-part-intake/v1`,
   with recordRecipeHash, cutoutSha256, adjacent labels.png hash and ordered parts
   `{id,joint,layer}`; labels are1-based indices,0 transparent. Declaration hash uses hashJSON.
   “Painter” names the existing data format; it does not authorize reusing canvas labels.
   This writer cuts/atlas-packs and independently verifies coverage and unchanged channels.
3. `buildPaintSkin`: parts directory, seam groups, sealed record, explicit boundary/interior
   candidate settings. Keep the CPU gate decision separate from successful mesh compilation.
4. `splitObservedSurfaces`: binding/record/source-join probe, root fixed, contact endpoints
   from `familyContactChains(familyContractForRecord(record))`, visible shape joints only.
   Hidden chains have no paint/weights/contact. It returns binding + contactPins receipt.
5. Static/native owners are unchanged: actual GSAP → performance → family contact solve →
   compiled field/ARAP → published parts. Exact rest,0.25px planted drift and seam checks
   remain required. Native performance is measured, never inferred from static success.

No per-creature override, seeded landmark, polygon, mask fringe edit or binding patch belongs
in compiler output production. Existing authored outputs are frozen regression truth only:

| Subject | Current accepted fit | Explicit hidden chains |
|---|---|---|
| Coconut | VISION_P1_COCONUT_20260920/hidden-01/fit-04 | leg3Far,leg3Near |
| Crab | VISION_P1_FOUR_CRABS_20260920/intake-02/crab-fit-01 | leg3Near |
| Freshwater | VISION_P1_FOUR_CRABS_20260920/intake-02/freshwater-crab-fit-03 | leg3Far |
| Mud | VISION_P1_FOUR_CRABS_20260920/intake-02/mud-crab-fit-01 | leg3Far |
| Vent | VISION_P1_FOUR_CRABS_20260920/intake-01/vent-crab-fit-01 | none |

Paths above are under audits/. CPU series must not replace canonical fits before Nick’s
choice. The observation files/hand-authored labels must not be inputs to automated IC-1/2;
comparison only. Acceptance must record landmark error and its bound, hidden-set equality,
all static rows, source joins and exact rest, with zero hand edits. Erased-leg, duplicate-leg
and wrong-template-guide mutants must refuse. Missing chains cannot automatically become
hidden merely to make those negative controls pass; registration must distinguish reviewed
occlusion from missing anatomy. No automatic intake acceptance is claimed today.

The sibling register.mjs is currently a detector/registration slice, not a complete sealed
record/label output. Codex will integrate its completed, reviewed outputs at this boundary;
no duplicate registration algorithm is introduced on this lane.
