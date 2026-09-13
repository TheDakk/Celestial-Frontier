# Quadruped 2D proof — September 12

Status: source prepared; native captures pending. Nick authorizes this bounded replacement
for the abandoned Blender projection proof. No inference, 3D render, effect painting or kit edit.
Claude's supplied review is retained verbatim at
`../CLAUDE_CIVET_REVIEW_20260912/CLAUDE_CIVET_ARCHITECTURE_REVIEW.md` (signed 7f2aa40b).

## Anatomy authority and scope

For the named Civet's source proportions, `faunaResetViverridD` wins over `QUAD2_SPEC.Civet`.
The specialized owner uses the spec for palette and its dispatch tag; it actually draws body
span .300–.650, ground .795, head centre (.755,.470), head radii (.070,.058), and muzzle .125.
The generic spec's legs .078, depth .1039, half-length .188 and muzzle .38 do not describe
that drawing. A source comment now makes that precedence explicit; no source pixels or named
Earth genes were changed. The existing source-bound phenotype bridge independently checks it.

An authored master is its own approved view, so `civet.landmarks.json` measures that image,
not the differently posed vector portrait. It preserves the exact Earth genome visual key
and seed; `fox.landmarks.json` identifies an authored family reference (seed 0 is a declared
asset identity, not a generated Earth individual). Both bind SHA-256 of the original PNG,
normalized landmarks, ground, layer order, material, shared template/clip ids, bone lengths,
bounds result and the complete recipe hash. The Civet's raised forepaw and perspective depth
are immutable rest support offsets, not corrected into a different pose.

The procedural control uses the existing first two-leg-pair quadruped in the fixed audit fan:
seed 1597751321. `resolveProceduralCanvas` passes an optional observation callback to its actual
winning `faunaQuadruped` owner. That owner emits points from the same drawn limb Tubes, body
axis, neck/head, ear roots and banded tail curve. Intake transforms all coordinates into the
same oversized ink canvas; no second gene classifier or manual procedural landmark file.
This first adapter supports the observed ordinary four-leg, visible-ear, banded-tail geometry.
Other shapes refuse an incomplete/out-of-bounds record; universal quadruped coverage is not claimed.

## Template and proof

`port/v2/tools/creature-animation/quadruped-template.mjs` reuses the affine composition and
IK primitives of `kinematics.ts` and the inherited-transform, normalized-weight and planted-foot
mechanisms of the older Civet study. Shared graph: root/pelvis/spine/chest/neck/head/jaw, four
three-bone legs, tail chain and two ears. Shared finite idle/attack/hit curves are relative to
bone length; no per-creature clip overrides. The alpha quadtree refines silhouette cells and
triangulates conforming fans; shared vertices span fine/coarse boundaries. Two disjoint depth
index sets retain every source triangle once. They preserve the one-view source overlap;
they do not invent hidden limb surfaces or allow unrestricted crossing.

Master key/despill is the accepted deterministic intake algorithm. Rest equality compares the
keyed intake Sprite and mesh rendered at native size using the same untouched texture. Raw
magenta originals remain retained. Pixel-perfect rest does not mean keeping a magenta backdrop.
Controls refuse serpent geometry, swapped PNG, corrupted JSON, and landmarks off painted alpha.
Clip-extreme checks detect triangle flips/expansion/spikes. Their success is not visual acceptance.
If any specimen fails shape or rest equality, its review capture explicitly uses the authorized
whole-portrait fallback instead of claiming a working mesh.

The isolated Pixi stage shows Civet (or unchanged-template reuse control) versus Platypus.
It uses the retained **unoccupied biome plate from E's recipe**, with intact accepted E beside
it: baking E's six resident figures into the moving battle backdrop would duplicate actors.
Opponent motion is whole-portrait hit staging. The template proof does not claim a Platypus rig.
Push-in, banner, strike, flash, short shake, damage number, recoil and return are finite. Existing
whoosh and survey-ping cues accompany this isolated choreography; combat outcome integration
and listening approval remain separate. No normal-game battle route is changed in this proof.

Native runner: `node port/v2/tools/quadruped-proof/runner.mjs /absolute/new-output-directory`.
It requires committed scoped source, holds the checkout lock only in the CLI artifact owner,
hashes the isolated bundle inputs, captures ten seconds per subject, measures frame intervals
and per-creature updates, and closes its browser/server. Unit tests never acquire the lock.

Checks before native run: three template tests with negative controls; 79 existing bridge,
kinematics and articulated-rig tests; V2 package TypeScript and root validate all PASS.
An initial negative-test fixture hit a proportion bound before its intended alpha test; the
fixture was corrected and the failure retained in this account. No acceptance threshold changed.


## First native result — source 2c33f8c7

All three native Sprite/mesh rest comparisons are pixel-identical. Admission controls and
painter-observer pixel equality pass, and locked support vertices have zero movement in
idle/hit. Shape fails: Civet8, fox14, procedural7 of51 extrema violate the shared triangle
bounds; worst signed area ratios −.793/−2.069/−1.457. Fox also records8 unreachable IK
samples. All captures are explicitly WHOLE-PORTRAIT FALLBACK; articulated success is not
claimed. Fallback capture fps58.70/60.00/60.00; Civet misses60. Zero browser exceptions.

Independent ffprobe found9.875/8.317/8.316-second recordings despite the10-second sampled
timelines. The first artifacts remain under /private/tmp/cf-quadruped-proof-20260912-01,
with committed reports and hash index at attempt-01. The recorder is corrected to resume
audio before recording, start its silent track immediately, await recorder start, and request
every canvas frame explicitly. The next capture changes no artwork, anatomy, template curves
or thresholds. This is an instrument correction, not another art/rig experiment.


Second capture attempt (2652f5cb) timed out awaiting the capture promise before any file was
returned. Browser/server closed; report retained at attempt-02. No anatomy/curve change or
successful capture is claimed. The next instrument correction uses real native button input
for audio activation, with separate five-second audio/recorder-start deadlines to diagnose
rather than enlarge the timeout. No automatic retry of unchanged source.


Third attempt (4eb7e24c) identified the startup deadlock specifically as recorder-start, not
audio resume. With captureStream(0), requesting a frame before any post-stream canvas draw
left the recorder waiting for video metadata while the animation waited for recorder start.
Correction: render the unchanged rest stage once after recorder.start, then request that
frame. Native click and the short deadlines remain. Report retained at attempt-03.
