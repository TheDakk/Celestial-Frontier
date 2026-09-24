# Tarantula candidate-06 — independent visual review and initial authoring

This is a bounded first manual authoring prototype, not an intake or acceptance
result. Only this `authoring.json` and review were written. No rig, solver,
static battery, native run, landmark optimizer or new image generation was
executed. Parent owns presence and subsequent qualification.

## Authorities

- Actual source `candidate-06/master.png`: SHA-256 `a63b700253d16406f8fdf5ec5055875f2235554b3ccd81bd5fb2e515b2b37de5`.
- New `candidate-06/authoring.json`: creation SHA-256 `66580e52033f75b0b2ad072ff9d7e1ebd3e77c9d15b1adad6bae1e7826ba750a`.
- Parent declaration `candidate-06/presence.json`: SHA-256 `2d694050a6517ff5800ea172ca6f38fa1425a5838a1f76fc0ccf9c09fc39f165`.

The retained pose guide was not read to obtain coordinates. Every coordinate
below was authored by inspecting this master, including read-only in-memory
close views of the mouth and right front limb; no altered image was saved.
Prior archetype authoring was consulted only for JSON fields, part naming and
material convention, with its landmarks omitted from the read.

## Eight walking chains

I independently distinguish **eight walking-foot tips**, separate from the
short hairy pedipalps and the mouth hooks. Numbering is anterior 1 to posterior
4 on each side, following the graph convention.

| Chain | Authored visible major bend (px) | Authored terminal tip (px) |
| --- | --- | --- |
| leg1Far | [1006, 398] | [1219, 677] |
| leg1Near | [1053, 744] | [1229, 976] |
| leg2Far | [850, 232] | [1068, 350] |
| leg2Near | [895, 830] | [921, 1106] |
| leg3Far | [533, 217] | [402, 327] |
| leg3Near | [623, 792] | [511, 1092] |
| leg4Far | [328, 374] | [137, 613] |
| leg4Near | [350, 788] | [105, 984] |

The four far tips occupy the upper-right, high upper-right, high upper-left,
and outer-left positions. Four near tips occupy the lower-right, lower-center
right, lower-center left, and lower-left positions. Far4's proximal route
passes behind the abdomen; its exposed outer bend and distal tip remain
visible. This is partial proximal occlusion, not an invisible whole chain.
The authoring does not invent pixels or claim to observe its internal root.

The common `cephalothorax` pivot `[735,535]` is an estimated internal center of
the visible carapace. It satisfies the existing shared-root representation;
it is not a claim that eight separate anatomical hips are directly visible at
one point. Root `[666,548]` and abdomen `[444,520]` are manually estimated body
centers. Knee landmarks mark visible major bends/segment transitions in the
existing two-span representation, not a claim that a biological spider has
only two leg segments. Near1 and near3 are less sharply localized than the
raised far arches; retain that uncertainty rather than treating pixel precision
as measurement certainty. None was chosen by solving a pose or testing limits.

## Mask ownership and mouth uncertainty

The 20 authored parts are 16 walking-leg upper/distal spans, abdomen, two
chelicera hooks and body remainder. Priority is explicit: hooks and near legs
first, then the visibly occluding abdomen, then far legs, then remainder.
At knee overlaps, the distal mask is first. Far4's polygon describes only its
exposed upper arc; abdomen priority preserves the surface that covers the
unseen proximal route. The polygons are initial contour approximations,
subject to actual label/fit review; their presence is not proof of a perfect
split or successful deformation.

Two separate downward-curved dark hooks are visible at the mouth. Their
approximate endpoints are near `[859,665]` and far `[887,665]`; near/far naming
uses foreground/depth appearance and remains uncertain at the exact boundary.
The small masks target those dark hook surfaces. The adjacent short hairy
pedipalps and head/eye region remain body-owned, since the family graph has no
independent pedipalp/head joints. No extra walking legs are counted from them.

Parent's existing declaration remains authoritative: sting absent; hidden and
folded arrays empty. No declaration was inferred or rewritten by this review.

## Retained image limits

All visible walking tips appear intact, but the requested 8% margin is not
met. Parent's `master-integrity.json` reports a 1254-square RGBA image, positive
alpha reaching x=0/y=1253 through fringe, and diagnostic alpha>127 bounds
x=94…1237/y=201…1122 (16 pixels to the right edge). That threshold is a diagnostic
lens only; it is not an intake alpha threshold. Colored/low-alpha fringe is
retained without retouching, erosion or reassignment by opacity threshold.
The ground-line value 0.9 is a framing reference beneath the main visible feet,
not an inferred common terrain plane for the different perspective heights.

Codex parent now owns the first IC-3/static qualification and any diagnosed
correction. Nick reviews the art; Claude consumes only the signed result under
the authorized handoff. No technical pass is claimed here.
