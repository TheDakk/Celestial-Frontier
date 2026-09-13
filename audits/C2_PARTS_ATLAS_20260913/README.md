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
