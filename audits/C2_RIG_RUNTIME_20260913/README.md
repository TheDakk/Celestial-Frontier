# C2 parts runtime — independent coding while C1 is reviewed

The visual-review gate applies to staging; it does not block independent C2 implementation.
No new Wild painting was run. Send both C1 review ZIPs with the committed REVIEW_REQUEST.md.

## Implemented

`port/v2/apps/game/src/creature-rig.ts` implements CONTRACTS§2 CreatureRigV1, plus
`loadCreatureRigV1` and the `createCreatureRigPoseTarget` adapter for Claude's
setJoint(name,radians,dx,dy). Uses the existing quadruped GRAPH and record/hash/bounds admission,
plus composeAffine/rotationAround from kinematics.ts. No old fixed-grid or Gaussian skinning.
The .d.mts file declares existing helper exports; it changes no graph, geometry or code.

A hash-bound cf.creature-parts/v1 binding maps one unrotated atlas's frames to cutout-space
rectangles, record joint names, far/near layers, and part/joint-patch kinds. The binding's
recordRecipeHash and atlasSha256 must match; its bindingHash seals the metadata. Hash failures,
unsupported bodies, alpha-fit failures, invalid rectangles, duplicate part IDs and budgets
refuse before decode. Original cutout bytes and alpha are caller-supplied verified inputs;
browser decode consumes the admitted atlas bytes through createImageBitmap. Decoder injection
is used only as a labelled synthetic texture seam in Node tests, not visual proof.

Each part is a real Pixi Sprite in a Container; two fixed depth Containers live under root.
Coordinates are normalized cutout space. Pose keys name child bones pivoting at their parent
landmarks; inherited transforms compose in graph order. Radians and dx/dy in body-length
units match Claude's contract. Missing applyPose keys reset to rest; the PoseTarget adapter
accumulates its streamed setJoint keys and provides explicit reset. No clock, genes or clips
are chosen by the rig. Validate every key before mutating displays; dispose releases owned
frames/atlas, never source master files. One atlas, <=40 parts; phone admission remains the
caller-owned Motion budget (1024), while this desktop loader caps at2048.

## Evidence and limits

Five tests pass against actual Pixi objects: exact identity transforms at rest, layer order,
parent pivot/child inheritance, body-length offsets, PoseTarget equivalence/reset, whole-pose
refusal before mutation, record/cutout/atlas/binding corruption controls, serpent refusal,
alpha-fit refusal, bad rectangles/duplicate IDs/41-part rejection, safe texture disposal,
clock/RNG refusal and deterministic replay. A full-graph40-part mean update over1000 iterations
passes the <2ms Mac CPU budget after warmup. This is not a native GPU/frame-rate measurement.
No timing claim is made for the per-joint adapter's complete browser timeline yet.

Pinned atlas tool controls pass: one atlas, byte/pixel determinism across input order, original
hash preservation and corrupt-input/overflow refusal. These are synthetic controls, not a
creature atlas. Full v2 typecheck and root validation pass. Initial typecheck caught readonly
mutations in deliberately corrupted test fixtures; immutable mutant construction fixed them,
with the initial failure retained. No compiler settings or admission limits weakened.

## Remaining C2

Authored part masks, turnaround-derived joint patches, procedural painter part-mask emission,
record-bound bindings and one real atlas per Civet/fox/procedural creature; actual master rest
pixel comparison, pose-extreme joint inspection, paws/ground/contact checks; browser timing
with Claude's Motion timelines; staged Civet–Platypus turn; three ten-second captures. No
complete rig visual acceptance or C2 package completion yet. No Claude-module, main.ts or kit
edit, source sound, additional inference, new branch, GitHub operation or history rewrite.
