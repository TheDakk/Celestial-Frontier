# P1 Coconut Crab — one-generation anatomy finding

**Not admitted; P1 remains incomplete.** The exact compiled prompt was sent once to the built-in
`image_gen.imagegen` tool with the supplied anatomy guide and the prompt-required Discovery Atlas
style reference. The generated master has six independently visible walking-leg tips (three on
each side), against eight required walking legs. Two chains are missing or occluded beyond
observation; they were not invented. The claw pose and stance also differ from the painter.
This is retained for Track T, not a changed-prompt retry. No template, kit or gate changed.

[Comparison sheet](comparison-sheet.png) · [Numbered walking-tip trace](intake-01/walking-tip-observations.png)
· [New visible-surface ownership](intake-01/observed-ownership.png).

## Generation provenance

- [Exact sent prompt](generation-01/sent-prompt.txt), SHA256
  `c35fbf4093e44d7ca0d0267a627c365823d1059daf41f21b7bf3068ff2628eb4`.
- [Original delivered PNG](generation-01/coconut-crab-master.png), SHA256
  `7954331dc3ce80bf3b4e2e3759bd0b5c576d659ff5fcb4d01b8efc536bba8890`.
- [Prepared request](generation-01/request.json) and [completed result](generation-01/result.json).
  Model version and seed are not exposed by this built-in tool. No alternate model, local
  finisher, prompt augmentation or second generation was used. Original tool PNG remains in place.
- Read-only compiler packet:
  `/Users/nick/Projects/celestial-frontier-anthropic-mac/audits/VISION_PROGRAM_20260920/P1-coconut-crab-packet/`.
  Prompt retention was explicitly requested. No sibling files were edited or synced; the guide
  was attached by its original path, and its labels were never reused. Both reference hashes
  are retained in the request. The sheet uses this lane's byte-identical painter master.
- Source/toolchain: local signed `e2f2585a`, Node **26.9.0**, uninterrupted session reusing the
  [authorized toolchain receipt](../ANATOMY_SINGLE_RUN_20260919/00-toolchain/receipt.json).

## Intake outcomes

| Stage | Actual outcome and diagnosis |
|---|---|
| PNG format | Existing master inspector PASS: 1254×1254, 1,543,355 bytes; minimum 384 square satisfied. This is not quality acceptance. |
| Technical prompt | Requested 1024 square, opaque magenta field and ≥8% margins. Delivered alpha at 1254 square; left/right painted bounds are 21/29 px. Larger originals are retained per kit; no resizing of the master. |
| Key/despill | Existing `intakeAuthoredPixels` diagnostic isolation PASS. Delivered alpha preserved, zero eroded/despilled pixels, **zero RGBA channel changes**. Forcing the magenta keyer on this alpha export would resurrect invisible RGB. |
| NEW painting masks | Eleven provisional visible-surface regions, independently authored from this PNG: six walking regions, two claws, two eyes and body/unresolved remainder. All 562,676 nonzero-alpha pixels retained exactly once; visible reconstruction differs in **zero channels**. These are observation masks, not a complete anatomical joint mask declaration. |
| Anatomy | Six visible walking tips, two claws, two stalked eyes; two required walking chains unresolved. Different claw pose/stance. No definitive claim about hidden limb presence or automatic verifier accuracy. |
| Landmarks/admission | Measured partial new-painting observations sent to existing `checkFamilyGeometry`; actual refusal **`Skeleton pose: exact landmark inventory`**. No source landmark coordinates reused. Provisional screen-to-family foot names are explicitly unqualified. |
| Observed surface split/binding | Not run: no complete admitted anatomical record. The provisional visible-part extraction is not the ARAP observed-surface split. |
| Native rows / film / CPU | Not run / no P1 film / unmeasured. No admitted binding exists. Prior Civet or crab films are not presented as P1 evidence. |
| Master / animation acceptance | `masterIntakeAccepted:false`, `animationReady:false`; Nick's sheet verdict remains pending. |

[Pixel intake and full alpha histogram](intake-01/pixel-intake.json),
[format check](intake-01/master-format-check.json),
[observations and new polygons](intake-01/painted-observations.json),
[part conservation](intake-01/visible-part-receipt.json),
[incomplete record](intake-01/incomplete-record.json),
[actual family refusal and downstream statuses](intake-01/family-admission.json),
[sheet source hashes](sheet-receipt.json).

The visible-part files and labels are diagnostic only; complete eight-leg masks and the remaining
landmarks cannot be supplied faithfully from unobservable anatomy. No fabricated missing leg,
relaxed presence declaration, reused canvas mask, fallback portrait film or visual acceptance.
This retains the requested failure finding while leaving the downstream P1 deliverables blocked.

## Validation and instrument notes

[Existing authored-intake and family-record tests](intake-01/existing-chain-tests.log) pass,
including their malformed-input controls. [Root validate](intake-01/validate.log) passes.
The accepted painter record is separately checked alongside the refused partial P1 observation
in [admission control](intake-01/admission-control.json); this proves current admission remains
usable, not that the human limb count is an automated test. All evidence PNGs are decoded and
hashed in [integrity manifest](integrity.json). No application or runtime source changed.

An initial inspection crop assumed 1280 pixels and exceeded the delivered 1254 width; the crop
was corrected to the actual dimensions without modifying the master. An initial exploratory
alpha counter grouped opaque pixels with partial alpha; the retained 256-bin histogram corrects
that: 1,009,840 transparent, 561,764 partial and 912 opaque pixels. The initial commentary's
seven-tip estimate was corrected to the six numbered visible tips after inspecting both sides.
None of these inspection corrections triggered generation or altered source pixels.

[Evidence producer](build-evidence.mjs) documents deterministic intake, provisional observations
and sheet construction. It refuses existing output; do not run it over this retained packet.
The comparison displays full source canvases at a common 620-pixel box, not equal creature size.
Civet is a quality reference; the painter's smaller occupancy is source framing, not anatomy scale.

## Handoff

Roster remains held. R4 and the earlier accumulated anatomy packet remain completed history;
Codex R9 stays canonical for a separately authorized future re-merge. PR42 remains parked.
No fetch, push, PR, merge, release or deploy occurred. This packet is an anatomy refusal,
not a solver S2 regression: no shared solver or skin implementation changed.

Codex: retain generation 01 and do not synthesize missing anatomy or start a changed-prompt
retry, P2/P3/P4 or the roster. Claude: review this packet for the P1/Track T finding and Nick's
sheet decision, using it read-only; no sync is authorized. Nick need not open the other app
for a Git handoff. No hosted action or PR is needed. Commit identity/signature is reported
with this packet's final delivery; local ahead is measured only against cached upstream.
