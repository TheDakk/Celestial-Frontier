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
