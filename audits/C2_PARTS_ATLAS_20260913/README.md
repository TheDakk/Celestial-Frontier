# C2 authored masks and one Civet atlas — implementation checkpoint

Matches code as of 2026-09-13. This is a static parts-intake checkpoint, not the ten-second
animation proof and not a claim that the joint cuts hold shape at motion extremes.

`civet.part-masks.json` declares22 priority polygons with record joint names, far/near layers,
an explicit torso remainder, immutable master SHA256, record recipe hash and declaration hash.
The declaration describes this authored master only; it contains no clip curves or gene edits.
`port/v2/tools/creature-animation/part-masks.mjs` admits the original record/master before
partitioning the keyed pixels. Each visible pixel belongs to exactly one part; the independent
reconstruction rejects missing/extra pixels, overlap and changed colour. Source pixels remain
unchanged. Ownership colours in civet/ownership.png are diagnostic labels, not a new painting.

`build-authored-parts.mjs` uses the existing keyer and pinned rig-atlas.mjs. It writes a separate
copy per part, one2046×919 atlas, its manifest, the actual CreatureRigV1 binding, and receipt.
The packer uses fixed sort/padding/extrusion, no rotation/trim or timestamps. Readback of every
part from the packed atlas differs in **zero RGBA channels**. Static reassembly differs in
**zero visible RGBA channels** from the keyed master. Original magenta-key master hash unchanged.
These are offline comparisons; native Pixi rest rendering has not been measured for this atlas.

The polygon declaration is an initial fit. The ownership map shows that the narrow crest
between the ears still falls to the torso/chest remainder; the head boundary needs correction
before motion qualification. Pixel coverage alone cannot establish anatomical ownership. It still needs boundary inspection at the real
Motion timeline extremes, turnaround-derived joint patches hidden behind the base parts,
and the native rest-pixel check. The joint-patch builder is not implemented here. The fox
and fresh painter-emitted procedural masks/atlases remain next. The existing material observer
fix in9ae342da remains authoritative; do not reuse the historical incorrect procedural fur record.

The rig accepts CONTRACTS§2 radians and offsets in body-length units; no Claude motion,
effects, battle2, soundkit or worldlife source was copied or edited. Pack3's nine additional
family joint inventories apply when those painter observers are implemented. No generic
quadruped labels may be emitted for a different family. This checkpoint adds no such observers.

## Checks and missing body-card data

Two mask tests use positive reconstruction and deliberate missing-part, duplicate-part,
changed-colour, changed-declaration, wrong-master, wrong-record and unknown-joint controls.
Existing rig runtime controls, v2 typecheck and root validation are recorded alongside.
The24full-suite failures reported by Claude remain C5 admission; the full suite was not rerun.

Civet's record supplies identity, quadruped template/version, dimensions, ground line, layers,
landmarks, bone lengths/bounds check, material surface, clip-set ID and recipe hash. It does
not explicitly supply mass class, locomotion, realm, natural weapons or luminous status,
per-part materials, secondary lag order or numeric joint rotation limits. Motion Kit§3 calls
for these. Do not parse raw genes out of speciesVisualKey to invent named Earth anatomy.
Claude's compileBodyCard owns its documented fallbacks/notes; final proof must retain those
notes and use its actual emitted timings. No body card was typed or alternate compiler added.

C1's authorized second pass missed its fringe target; further intake is pending Nick's scope
choice. This independent C2 code proceeds without interpreting that as image acceptance.
No kit edit, source sound recording, model inference, main.ts hunk, GitHub write or history rewrite.


## Pack4 continuation — corrected mask and turnaround joint underlaps

civet.part-masks-v2.json fixes the head crest so it follows the head. Original declaration
and its initial atlas are historical evidence; civet-v2 is the corrected22-part base.
civet-patched is the current32-part atlas (2047×951), with10 round underlaps sampled from
painted fur in the retained turnaround, never generated. Every patch pixel is confined to
opaque base paint in that patch's own far/near layer, and patches precede base parts there.
This guarantees offline rest occlusion; native GPU rest admission follows on committed source.

Initial source samples containing magenta were refused; joint-patch-initial-refusal.json names
the offending crops. The second attempt found the builder had limited coverage to the near
layer even for far-leg patches; joint-patch-second-refusal.txt retains that finding. Coverage
now follows the base part's actual layer. Corrected declaration civet.joint-patches-v2.json
binds the exact turnaround SHA. The cropped fur tone at moving joints still needs visual
review; a hidden texture patch is not proof of a good moving silhouette.

parts-rest-runner.mjs / parts-rest-entry.mjs provide a bounded native Pixi comparison against
the whole keyed master. They refuse dirty source, record bundled source hashes, use one
isolated loopback browser and compare every rendered RGBA channel, with a missing-head
negative control. This is a rest-render test, not invented clip curves or animation acceptance.


## Native rest admission — PASS on de9c9a32

native-rest-01 stopped before browser launch: Rolldown output.file rejected Pixi's multiple
chunks. That failure is preserved; the runner now uses output.dir. native-rest-02 then passed
in native WebGL:32parts,0changedRGBAchannels against the whole keyed master. Missing-head
negative control changes234,525channels. Mean empty-pose update0.0068ms over1000measurements
after200warmups. This measures pose updates only, not60fpsanimation or contact mechanics.
Source hashes/browser provenance and native screenshot are in native-rest-02/report.json.

Next interop check found a producer-side contract mismatch: Claude's GSAP adapter broadcasts
root offsets to all joints, compounding translation in a hierarchical rig. Actual-producer
probe and prepared minimal patch/review request: ../C2_MOTION_INTEROP_20260913/. Protected
Claude sources were read only and remain unchanged. Ownership decision pending; no workaround
silently changes CreatureRigV1 semantics. Motion/fox/procedural/captures/C3 still outstanding.

## Pack5 — independent fox and procedural parts

C1 mechanical intake is now complete per supplied final review; no further Wild correction.
Fox has22 authored parts, one2038x1085atlas,0changedvisible-rest and packed RGBA channels.
The head/ears/jaw,12leg segments,3tail segments,neck/chest/torso have authored mask ownership.
No fox turnaround has been supplied; no joint patches or motion acceptance claimed for fox.

Optional painter capture reads actual ink at semantic stage boundaries, assigning pixels whose
visible RGBA changed. It never mutates painter state/RNG. Tube subdivisions follow the actual
painted axis; overlapping new paint owns changed pixels, identical overpaint retains previous
ownership. Empty occluded stages are omitted. This supplies visible masks, not hidden surfaces.
Unsupported nonquad or non-four-legged/banded-tail capture refuses; remaining family observers
must use LOG-A11/LOG-B inventories when implemented. Native observer parity, actual material and
hash-bound record checks are prepared in painter-parts-entry; native execution follows commit.

Targeted tests include missing/unknown labels, conflicting owners, rehashed wrong record,
foreign family joints, painted alpha loss, colour change and duplicate parts. Native rest/motion
are separate gates. No model, main.ts, protected Claude module, kit or GitHub change.

## Fox native rest — PASS on18bd7368

native-fox-rest-01 retains source hashes/browser provenance and the rendered master comparison:
22parts,0changedRGBAchannels. Missing-head negative changes284037channels. Mean empty-pose
update0.0069ms. This qualifies the rest atlas, not joint shape/contact/fps or motion captures.
Pack6 supplied audio-owner/impact-hold decisions are recorded; no protected source integrated.

### Native painter mask observation — first refusal retained

native-painter-parts-01 on cee01f47 refused because capture altered ordinary painter pixels;
no mask/record artifacts admitted. Direct repeated getImageData on the live Canvas2D surface
is the suspected cause (readbacks can change rendering execution). Capture now copies the
surface to a separate willReadFrequently canvas before reading; no draw/RNG command changed.
This hypothesis is not yet native-qualified. The next bounded comparison uses a NEW
native-painter-parts-02 directory on committed source. It records changed-channel count/max
on failure and a deliberately corrupted-pixel control. Typecheck,4focusedtests/rootvalidate
pass. No motion, staging or C3 acceptance. Original refusal remains in report.json.
