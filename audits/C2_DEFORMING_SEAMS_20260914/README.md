# C2 deforming seams — September 14

Status: candidate-02 prepared; native rendering and visual acceptance pending.
Nick authorized the fourth mechanism for all parts after the static-source support diagnosis,
and asked for continued repairs without intermediate Claude review. The latest target is
fluid whole-body battle motion for all procedural and named Earth life, including land,
air, aquatic and plant families. Three quadrupeds qualify the shared approach, not universal coverage.

The runtime stretches existing descendant-edge pigment between the two joint transforms.
At rest the new strips have zero area. Original capped rigid underlaps remain; strips share
their existing drawables and atlas. No new paint, changed originals, skeleton/curve edits,
contact-bound relaxation or added atlas is involved. Only actual immediate parent joints
are stitched. Incidental ancestor overlap and sibling contacts remain independent.
The source-depth cap governs copied ink; it is not a new clamp on approved joint motion.

Candidate-01 is a rejected compiler prototype: it stitched incidental ancestral overlaps
and incorrectly treated source depth as a motion-displacement budget. It was never rendered
or accepted. Candidate-02 resolves actual painted parents and retains the original source cap.
Civet: 4522 edges, 16 groups, 38 drawables. Fox: 4909 edges, 16 groups, 38 drawables.
Procedural: 1773 edges, 14 groups, 35 drawables. All packed source RGBA channels match.

Native gates use independent shared ownership edges and actual renderer pixels. They require
rest zero changed channels, no uncovered swept cut pixels, the original ear failures in the
rigid negative control, and update p95 below 2 ms. The historical fixed-disc ruler remains a
recorded FAIL: its rigid-notch false positive is independently reproduced, not erased.
A native gate is not whole-shape acceptance. Capture follows only qualified unchanged inputs;
full motion, silhouette and staging still require inspection. Claude-owned modules stay read-only.

Static verification: 370 Vitest files, 4348 tests passed / 1 skipped; typecheck PASS;
root validate PASS including unchanged 50-probe fingerprint; browser bundle compiles.
No GitHub write, kit edit, new artwork or source recording in this batch. No main.ts hunk.

## Native attempt 01 and raster repair

Signed source e649a2e2: rest changed channels 0; both ears, jaw and torso/chest pass.
Original far-ear controls reproduce 3 uncovered pixels at each stride extreme; strips 0.
Near hind upper strike has one gap at canvas pixel570,661. Native report retained unchanged.
The point lies 0.0002px from a triangle edge. Independent 1/256px raster quantization
reproduces the crack; full-precision math covers it. Adjacent strips now overlap by
1/64 source pixel along their edge ends, still exactly zero-area at rest. No gate
threshold/alpha waiver, source-pixel or curve change. New failing-control test passes.
Continue all pairs under unchanged rest/cut/performance requirements; capture still pending.

Native attempt02 (ffe0d344) retains rest0 and closes the one hind strike pixel. Nine pairs
reached; neck/head strike has no gap but leaves the original cut-out canvas, so the diagnostic
correctly refuses INSTRUMENT_FAIL. Render target now includes half a canvas of transparent
padding on each side, at original pixel scale, with matching measurement translation. A
negative-controlled test preserves gap counts under padding and still refuses canvas escape.
No motion, image, source atlas or coverage threshold change. Continue native qualification.

## Native attempt03: cuts pass, full shape rejected locally

On 71e96f97 all62 true cuts pass (Civet21, fox21, procedural20), rest0 for all;
update p95 0.60/0.60/0.30ms. All three dense1200-sample contact scans pass under
the unchanged8% bound. But inspection of full strike/recoil PNGs shows duplicate
fur/ear contours exposed by static underlaps and strip-like stretching at broad
joints. This mechanical PASS is explicitly NOT visual acceptance. No10s capture
was declared complete; Codex continues repair under Nick's authorization.

Candidate04 replaces rigid overlaps and stretched strips with an alpha-adaptive
conforming mesh shared by all source parts. Refinement follows ink boundaries
and true cuts; neighbouring cells include the same edge vertices. Each part
samples only its original atlas frame, clipped to its original bounds. Joint
weights come from actual ownership/cuts; shared coordinates share deformation.
No per-creature curve, anatomy, frame count, palette or kit edits. Existing matrix
and part-composition owners remain. This is not the old fixed Civet-literal grid.
Candidate03 is the same prototype before duplicate vertex removal, never native
accepted. Candidate04 deduplicates interpolation vertices: 16097 Civet,18256 fox,
2621 procedural part vertices. Source atlases unchanged. Native pixel equality
and timing are pending; full animated shape still needs direct inspection.
The runtime remains quadruped-qualified only; all-family painter coverage is open.

## Continuous-field candidate rejected before native launch

The offline shape check rejects candidate04: Civet strike1237 inverted triangles,
1118 containing visible source ink; fox1716/1544; procedural213/169. This is not a
transparent-mesh-only artefact. Rest has no inversion. The historical cut-local PASS
cannot qualify this different deformation. Candidate03 uses the same field without
vertex deduplication and is also rejected. No native skin run or ten-second capture
has run. `paint-skin` now refuses folded posed triangles before publishing any buffer;
its area reference is precomputed, with a passing rigid-motion and failing fold control.
A capsule-weight scratch comparison also fails and is not adopted. The next repair
must preserve separate overlapping limbs while smoothing true articulated joints.
Do not lower motion amplitudes, contact bounds, shape gates or alpha thresholds to pass.

`creature-rig-frame.ts` adds a PoseTarget-compatible collector for frame owners: call
`target.sample(() => player.seek(ms))` to apply the whole rig once per producer frame.
It resets omitted joints, discards incomplete producer samples, and publishes no partial
frame on failure. The existing immediate adapter remains for compatibility. This new
adapter is tested; live battle2 adoption is pending in its read-only owner. No main.ts hunk.

Signing: two failures for the continuous-field checkpoint after three earlier successful
signed checkpoints. Public-key enumeration succeeds; no root cause established. The
native runner refused the dirty tree before opening a browser. Never bypass signing.
Current signed head71e96f97:110ahead/0behind upstream,221ahead/0behind cacheddevelop.

Whole-universe requirement and actual family gaps are in FAMILY_COVERAGE.md. No claim
of all-family animation, finished C2, newly recorded C3 or completed C4/C5 is made.

Final static checks: 371 files,4351 tests passed/1skipped;37Node tool tests;typecheck/root
validate PASS. See continuation-checks.json. Last signed71e96f97,110aheadupstream.

## September14 retry — textured hinges, candidate05

The previously staged batch is signed345061d1 (111aheadupstream/222aheadcacheddevelop).
Nick asked Codex to retry C2 and confirmed1Password unlocked. Candidate03/04 remain rejected.
Candidate05 retains independent rigid base parts and the62cut-qualified swept geometry.
It disables exposed rigid underlap quads and interpolates each hinge across a contiguous
run of the descendant's own source pixels, inward along the cut normal within the original
depth cap. Every run stops before alpha<=8 or source bounds; no repaint, erode, new ink,
new atlas, anatomy/clip/contact change. Single-pixel fallback only where no inward run
exists. Civet4492textured/30single-pixel;fox4885/24;procedural1609/164.
Tests verify source holes/bounds/caps, actual atlas UVs and absence of the duplicate quad,
with the original constant-UV/visible-quad controls. All39tool tests,7focused runtime tests,
typecheck and root validate pass. Native rest/cut/shape/timing qualification follows.
No main.ts hunk, kit edit or GitHub action; same approved toolchain receipt for continued C2.

## September 14 — complete ancestral contact inventory, candidate06

Signed candidate05 source9d2dff26 (112ahead upstream/223ahead cached develop) produced
native-hinges-01:62cut gates PASS, rest0, p95 .60/.60/.30ms. Full shapes still FAIL:
angular internal openings remain after duplicate ears were removed. No ten-second capture.
The compiler had omitted non-immediate ancestral contacts. Candidate06 includes all of
those actual shared edges: Civet29cuts/5070edges, fox32/5920, procedural26/1924.
Root/pelvis ink resolves to torso despite its declared spine joint. True sibling contacts
remain independent; regression controls refuse a foreign leg as ancestor. Same masters,
38/38/35drawables, atlases, recorded anatomy, curves and8% bound; no main.ts hunk.
Textured source walks and rest-degenerate hinges are unchanged. Forty Node tool tests,
7focused runtime tests, typecheck and root validate pass (checks/hinge6-*.log.gz).
Next: native rest/all87cut gates and full-shape inspection. No visual acceptance inferred.

## C2 current state — matches code as of 2026-09-14

The current candidate06 repairs all recorded ancestral contacts using original descendant
texture and zero-area resting hinges; unowned pelvis/root ink resolves to the torso.
Civet has29contacts/5070edges, fox32/5920, procedural26/1924, in the unchanged38/38/35drawables.
Separate sibling contacts remain independent. Candidate05 on signed9d2dff26 removed duplicate
ear ink but still shows angular openings: native-hinges-01 has rest0 and62listed cuts PASS,
p95 .60/.60/.30ms, but is visually unaccepted. The old gate missed entire omitted pairs.
The new independent ownership inventory requires all87contacts before native sampling;
all three candidate05 bindings fail that negative control. Candidate06 passes43tool tests,
7focused runtime tests, typecheck and root validate. Native render/capture is pending signing.

Signed checkpoints this retry:345061d1 and9d2dff26. Current HEAD9d2dff26 is112ahead/0behind
origin/openai/mac and223ahead/0behind cachedorigin/develop. Two subsequent1Password signing
requests failed, including a PTY retry; public-key enumeration succeeds. The checked repair
is staged. Unlocked vault is not proof of a successful signing authorization; do not bypass
the configured signer or the clean-source native guard. No new10second capture has run.
The continuous-field candidates03/04 remain rejected for visible triangle foldovers.

Next after signing: runner --hinge-gates to a new native-hinges-02 directory, inspect complete
poses as well as87cut results, then --hinge-parts with the unchanged-source gate report only
if shapes hold. Same accepted masters/arena/E, Motion Kit curves and8% contact bound.
No main.ts hunk, kit edit, painting/inference, 3D, GitHub write or history rewrite.
Universal family coverage and actual omissions remain in FAMILY_COVERAGE.md. C2 is open.

## September 14 — three-part junction repair, candidate07

1Password signing succeeded: e852a1c0,113ahead upstream/224ahead cached develop. Native-hinges-02
on that exact source passes all87contact pairs, rest0channels, updatep95 .80/.90/.40ms. Full
shapes remain unaccepted. Pair coverage cannot close a hole between three different posed
copies of the same original ownership vertex. The independently retained-frame diagnostic
(junction-diagnostic/) finds Civet strike839 and fox strike1326 uncovered native pixels at
such points; all rest counts0. This is a new measured blind spot, not a waiver of old failures.

Candidate07 adds64point sockets (18Civet/25fox/21procedural) to existing Mesh drawables. Each
requires three/four touching source owners with a common painted ancestor present. The vertices
follow their unchanged part transforms; the closure uses a touching descendant's original atlas
texel. Pure sibling crossings and edges along separate limbs remain unstitched. No new ink,
atlas, drawable, mask, record, clip, bound, kit, main.ts or Claude-owned path change. Rest is
zero-area. The native gate independently rebuilds the junction inventory from atlas ownership
and checks full-frame alpha, alongside all87pair gates and preserved ear controls. Forty-six
tool tests,7runtime tests,typecheck/rootvalidate PASS; candidate-07/checks.json records these.
Next: sign, native-hinges-03, inspect whole shapes;10second motion only when shape holds.

## Candidate07 handoff update — signing authentication failure

Candidate07 remains staged, not natively qualified. Final checks:46Node tool tests,7focused
runtime tests,typecheck and root validate PASS. All64junction sources independently verify as
fully opaque original atlas texels; the procedural source was corrected before commit to avoid
one160-alpha pixel (opaque-source-revision.json). Same geometry/curves/masters/atlas budget.

The two commit attempts at16:32:08/16:32:21UTC failed. Relevant local1Password events identify
Secure Enclave/system biometric authentication failure before key retrieval, not merely a
missing socket or an unanswered Git question. See signing-authentication.json for sanitized
facts. Nick has been asked to unlock with his account password inside1Password; no passwords
are requested in chat and no security settings/signing helper have changed. Do not retry native
qualification until the configured signed commit succeeds. HEAD e852a1c0:113ahead/0behind
upstream,224ahead/0behind cacheddevelop. No GitHub writes; Claude needs no action/app switch.

Pair-only native-hinges-02 PASS is not C2 acceptance. The64point-socket repair addresses a
measured additional defect, but full poses and10second motion still require native review.
