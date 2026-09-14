# Long-session log

Packages per WORK_ORDER.md. One entry per package on acceptance: commit, evidence paths, what was not done. Per-package drafts live in LOG-A1.md etc. until folded in here.

| Package | Status | Commit | Evidence |
|---|---|---|---|
| A1 motion compiler | accepted (mechanical); open decision: procedural material owner (genome says translucent, painter record says fur) | see git log | audits/LONG_SESSION_20260913/a1-pose-sheets/ (civet, fox, procedural sheets + cards + timelines, byte-identical on re-run); 25 tests |
| A2 effects sequencer | accepted (mechanical); travel mode per theme (melee: hold-and-reveal; projectile: slide) to be set in A3 | see git log | audits/LONG_SESSION_20260913/a2-sequence-sheet/ (12-frame sheet, identical SHA on re-run); 21 tests |
| A5 world-life | accepted (mechanical); wiring to the real plate is A3/A6 | see git log | audits/LONG_SESSION_20260913/a5-life-sheet/ (landfall and arena sheets, replay digest reproduced); 29 tests |
| A4 sound derivation | accepted (mechanical); listening is Nick's | see git log | audits/LONG_SESSION_20260913/a4-voices/ (nine placeholder-archetype WAVs, byte-identical on re-render); 19 tests |
| A3 battle scene v2 | accepted (mechanical); Nick's eye on the capture; fixture rig until C2; main.ts wiring pending | see git log | audits/LONG_SESSION_20260913/a3-battle/proof-run-01/civet-vs-platypus-10s.mp4 + nine beat frames; 25 tests |
| A6 part 1 defects | accepted (mechanical): K19, K20, K21, K22 part 1, K24, K25, K27, K28, K29, K30/31 fixed with negative controls; K22 part 2 (import t:0) left for Nick's decision | uncommitted on anthropic/mac at handoff (Nick commits after review; no git write by the agent) | audits/LONG_SESSION_20260913/LOG-A6-defects.md; smoke 553/0, validate PASS |
| A6 part 2 docs and wiring | built and green on the mechanical gates; Nick's eye on the flagged studies is open: `?battle2=1` (A3 stage over the Chronicle mount) and `?worldlife=1` (A5 layer over the landfall vista); material owner flipped to record-first per CONTRACTS §5; MOTION_KIT/SOUND_KIT marked "matches code as of 2026-09-13" | uncommitted on anthropic/mac at handoff (Nick commits after review); three announced main.ts hunks, listed in LOG-A6-wiring.md | audits/LONG_SESSION_20260913/LOG-A6-wiring.md; tests/battle2-wiring (11), tests/worldlife-wiring (10), tests/motion-body-card (13, record-first controls); typecheck 0; validate PASS; smoke 553/0 |


## Suite baseline note (2026-09-13)

The full `vitest run` on this tree has 24 failing tests in 12 files. All 24 fail identically on Codex's committed head openai/mac 1e65e006 (verified in a temporary detached checkout of that exact commit, then removed): app-chrome-main-wiring (3), compendium-budget (2), current-producer-authorities (suite), evidence-build-runtime (2, needs the evidence build with onnxruntime), exceptional-crafting-evidence-contract (2), guide-release (1), painted-earth-mount-ownership (12), pwa-offline (1), slicesmoke-sixth-red-contract (1), and three `node:test` .mjs files under tools/ that vitest collects with 0 tests. None is caused by the merge or by packages A1 to A6. They belong to Codex's lane (C5 pruning and exact-head admission) and are recorded here so nobody mistakes them for new reds.
| A7 pose editor | accepted (mechanical); Nick's tool | 20f50f70 | audits/LONG_SESSION_20260913/a7-pose-editor/capture-01/; 11 tests |
| B1–B4 batch 2 | built and green (typecheck 0; 26 suites / 220 tests; root validate PASS); live capture REVIEW (602 frames, cues within one frame of their beats; found and fixed the frozen particle count and the pale-on-pale disc); Nick's eye open on the four B3 sheets and the capture; audio port and impact hold decided on Nick's delegation (LOG-B.md) | see git log | audits/LONG_SESSION_20260913/LOG-B.md; b3-family-sheets/; b-batch-capture/proof-run-01/ (A1 procedural evidence refreshed) |
| B5, B8, B10, B11 batch 3 | built and green; residents on the landfall under ?worldlife=1, voices per creature in battle2, phone particle budget, leg-slack diagnostic | see git log | audits/LONG_SESSION_20260913/LOG-B.md (batch 3 section) |
| C2 unblock (batch 4) | seam oracle, limit-driven boundary-band underlap on the fixture rig (head/neck seams 4,106/3,306 → 1/6 on the real master), authorization issued to Codex under Nick's delegation | see git log | audits/C2_BOUNDED_REPAIR_20260913/ (CLAUDE_REVIEW_RESPONSE, CLAUDE_UNDERLAP_DEMONSTRATION, AUTHORIZATION), LOG-B.md batch 4 |
| A11 family motion templates | accepted (mechanical); synthetic landmarks, not anatomy evidence; myriapod, cephalopod, flyer-membrane, primate built in B3 (LOG-B.md) | see git log | audits/LONG_SESSION_20260913/a11-family-sheets/ (nine sheets, byte-identical on re-run); 54 motion tests |

- 2026-09-13 Wild second intake reviewed: travel ACCEPT, impact TARGETED INTAKE FIX (two clusters), registration ACCEPT, no further erosion; response in audits/WILD_V43_PROOF_20260913/second-pass/.
- 2026-09-13 Wild targeted impact pass reviewed: both clusters ACCEPT (tuft rose streak and leaf rim are master paint; my second-pass read corrected); C1 mechanical intake complete pending Nick's eye; response in audits/WILD_V43_PROOF_20260913/targeted-pass/.

## C2 band authorization — native gate pending

Prior signed evidencea822b07; ten authorization audit files importedd1c9fbc4verbatim, no
port/v2source extracted. Four supplied Claude-lane files hash-match sibling read-only sources.
Supplied authorization now covers every ancestor/descendant ownership cut, per-cut depth
distance-to-descendantpivot×sin(cumulative limit)×1.1, floor.02W, capW/8, angleclamped90°
for maximum sweep as in Claude's demonstration. No clips/pivots/masks/kit/8%bound change.

C2_BAND_UNDERLAPS_20260913/civet:23cuts,16bands,246750duplicated opaque descendant pixels;
38parts, one2047x1589atlas. Bands attach to ancestor joints in descendant layer, drawn before
base parts. Grouping equal joint/layer prevents extra draw objects while each cut has its own
receipt. Bands replace optional discs in this candidate; original disc-only atlas retained.
Nonancestor adjacencies are reported, not silently given invented ancestry. New authoring kind
band projects to existing runtime joint-patch binding; CreatureRigV1 remains unchanged.

Native --band-gates renders rest, actual7400msrecoil,strike and both approachstride extrema
(mapped from timelinebody quarter/threequarter into the phase's actual duration). Read-only
Claude seam-oracle.mjs measures all cut descendant-joint discs; report includes pose-minus-rest
for bands and disc-only controls. No positive residual is called a tolerated2pxrim without
proof. No capture until rest0channels and per-cut gate pass. Stop exactly on declared atlas,
rest,seam or unpredictedshape failure. Fox acceptedcandidate01 and procedural remain next.

## Band gate stop — native-gates-01 on2ec4f4be

Seam FAIL; no captures and no fox/procedural continuation. Rest0RGBAchanged for both bands
and disc-only;38parts/2047x1589atlas passes. Recoilhead1771→0,butneck1473→912,jaw2350→1478;
strikehead2010→1032. All23cut entries have somepositiveframedelta; repeateddescendantdiscs
are shared counts, not independent totals. Approach uses actualquarter/threequarterstride
body key times mapped into the phase. Clear14pxtransparentneckrun atx1080,y663..676 exceeds
the authorized2pxrim. Other ankle/tailgaps remain visible. No thresholdwaiver or thirdmechanism.

RESULT.json and REVIEW_PROMPT.md are the review handoff; fullold/bandnativePNGs and external
oracle reports retained. Declaration records12nonancestoradjacencies instead of inventing
new attachments. Cause of remaining failures is not yet established. Typecheck,7rig/contact
tests,2bandtests,rootvalidate pass; nativegatefailure controls the stop. Nick/Claude review
next; no app switch or branchsync needed. PR42parked, no GitHub/kit/history/main.ts changes.

## C2 pair-band amendment — native gate pending

ReviewZIP held one bareCLAUDE_REVIEW_RESPONSE.md; committed at Nick's explicit audit path,
with amendment copied verbatim from Claude's referenced authorization,3bc8db0c. No source
extracted/copied/edited in Claude-owned paths. Prior composite-gate FAIL remains retained.

Three changes only: resolve unowned joints to owning parts (root/pelvis→explicit remainder),
cap band depth by halfdescendantminboxdimension, gate pair-isolated with oracle --disc=.06.
The oldjointwalk negative misseships; correctedwalk includesKnee/Root andtail1/tail0 chains.
Civet now29cuts,16groupedbands,335420opaque duplicatedpixels,38parts,2039x2047atlas. Exactly
sixtrue siblings remain unbanded. Same masks/record/curves/8%bound/kit; one runtime atlas.

Per-cut diagnostic PNGs contain only that cut's subset of the runtime grouped band, preserving
descendant ink and ancestor attachment. Native pair view contains ancestorbase + thatcutband
+ descendantbase; unrelated grouped-band contributions are excluded. Disc-only control uses
the same two bases and original disc for the descendant where one exists. Both controls have
their own rest baseline. Fullrest still requires0RGBAchangedchannels; no renderer/rig changes.
Render actualGSAP/contact recoil7400ms,strike,and bothauthoredstrideextremes; independent
read-only seamoracle perpair withdisc.06. Stop on firstpositivepair delta, preserving all
fourposedframes and rest/control for thatpair; no latercreature/capture iffailed. No rimwaiver.

Fourbandtests (hipancestry/sibling/sizecap controls included),7rig/contacttests,typecheck and
rootvalidate required; no checkoutlock insideunit tests. Nativeclean-source run next.

## Pair gate stop — native-gates-01 onf3c6fe7d

First pair head--ear-far FAIL. Oracle disc.06,close.02,alpha8,restpivot974/296; baseline76
for both variants. Bands above rest: recoil+731,strike+1492,quarterstride+922,threequarter
+1047. Disc-only deltas+762/+1492/+957/+1082 retained. Both fullrest0RGBAchanged; atlas
38parts2039x2047 withinbudget. No laterpair or motioncapture or fox/procedural continuation.
Stop matches explicitauthorization; no fourthmechanism/thresholdwaiver. Measured cause is
not inferred from counts alone. PerpairPNGs and all oracleJSONs retained.

RESULT.json/REVIEW_PROMPT.md provide copy-ready Claude handoff. Fourbandtests,7rig/contact
tests,typecheck,rootvalidate passed. Nick/delegatedClaude review firstpair next; Codex stops.
No branchsync/appswitch needed; no GitHub/PR42/kit/8%bound/history/main.ts change.

## Codex consolidated C-lane review batch — engineering ready, packages not auto-accepted

Nick authorized independent roadmap-wide audit/fixes without one-by-one review pauses.
Starting b50668b0; all changes on openai/mac. C1 active Wild hashes/dimensions rechecked;
C2 packed-part verifier includes hidden bands (original and candidate all channels match),
plus reproduced seam-ruler false positive (rigid translation0→140; actualgap94). Agreed
pair gate unchanged, no new native capture or visual acceptance. C3 exact voice intake and
C4 master runtime-minimum/PNG integrity intake added; no source sound or library rollout.

Six authorized new-lever weather variants now ready from saved raw finisher, no inference,
source/masks/alpha unchanged. E remains active. C5 removes stale336MiBclaim and repairs
Vitest/Node separation, source fixtures, notification checkpoint recording, companion glow,
landscape dock coverage, missing-icon contrast finding, exact style/inert restoration,
five review locks and callback-overflow reporting. Two main.ts hunks: mayRecord checkpoint
guard and binary companion glow. No Claude-owned modules/tests, kit or history changes.

Final full Vitest4338pass/3authorityfail/1skip. Node tools19pass, worker/weather6pass,
typecheck/rootvalidate(50probeparity)/smoke pass. No fullnative/hosted green claim.
Remaining Compendium authority failures retained, no baseline/ceiling waiver.15pilot pack
candidates11,363,130bytes inventoried, not deleted before source/import/delivery admission.
AUDIT.md, final-checks.json, REVIEW_PROMPT.md and WEATHER_DETAILS_REVIEW_20260913 form one
consolidated review handoff. C2/C3/C4/C5 remain incomplete as explicitly listed there.
GitHub NONE; PR42 parked; LFS on explicit go; promotion uses three merge-commit tiers.


## September 14 — Codex independent failure repairs

Nick deferred Claude review and requested local correction. The three C-lane authority
failures are repaired by audited live source/build rebinding with fixed ruler/ceilings/
historical samples unchanged. Unit workers no longer build or take the checkout lock;
a standalone pre-test owner supplies source-bound evidence. C2 retained-frame cut
observer removes the rigid-motion confound but still finds3transparent pixels at each
head--ear-far stride extreme; the named-pair stop and original FAIL remain. No capture,
model/kit/art change, Claude-owned edit, GitHub write or history rewrite. Details and
verification: audits/C_LANE_REPAIRS_20260914/README.md and checks.json. No external review
requested now. C3/C4/phone/pruning prerequisites remain as recorded in ROADMAP.md.


## September 14 — independent C3/C4/P1 coding continuation

Signed prior repairs in f36cb38d after Nick unlocked 1Password (106 ahead of upstream,
217 ahead of cached develop at that stop). Continued without Claude: C3 offline voice
Opus export with source and lossy-output true-peak checks, exact decoded duration, byte
budgets and protected original hashes; C4 complete ordered twelve-slot intake, exercised
against twelve existing accepted masters; P1 asynchronous native PNG hash with yielding
fallback and one identity-key calculation per store operation. The acceptance test now
waits for ready/failed outcomes, preserving altered-image refusal. No storage policy,
kit, Claude-owned module, main.ts, source recording, painting, inference, native capture,
GitHub or history change. Compendium producer binding refreshed for the changed app bundle
only; no ruler/ceiling/sample change or native certificate. C2 named-pair FAIL still stops
captures. Full checks, limitations and combined later review prompt are recorded in
audits/C_SYSTEMS_CONTINUATION_20260914; C3/C4 complete packages remain open.


## September 14 — C2 ear repair limit investigated

Nick requested another attempt along Claude's underlap method. Hash-verified inverse mapping
of the six retained zero-alpha samples finds no source ink in the complete descendant image
under the head transform. That image contains every permitted static band, so increasing
band depth cannot close the opening at the cut's silhouette endpoint. No depth/cap/ink,
mask/pivot/clip, master/atlas, oracle or runtime change; no native capture. Three support
controls added and the bounded next two-joint-strip proposal recorded in
C2_EAR_SUPPORT_20260914/README.md. C2 remains unresolved; the incorporated review's prohibition
on a fourth mechanism after failure requires Nick's scope decision. Claude/GitHub: none.

## September14 C2 authorized deforming seams


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
