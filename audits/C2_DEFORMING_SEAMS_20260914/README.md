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
