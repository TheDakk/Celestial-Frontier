# Chimpanzee anatomy review 01 — proposed authoring repair

This is a manual visual authoring proposal from the retained original two-leg,
two-arm master. No intake, pose/solver execution, numerical coordinate search,
static battery or new painting was performed. The rejected three-hind-leg
candidate was not used.

## Exact source and change

- Original master: `audits/ARCHETYPE_REPAIRS_20260922/07-primate/master.png`
  SHA-256 `27331ceeb3353de388c97e1c4ecc62b11fd75fa6421852ae4e7a22cba971c408`.
- Original authoring: `audits/ARCHETYPE_REPAIRS_20260922/07-primate/authoring.json`
  SHA-256 `402a13c6964f3abd00b71c2992c92ae12ef88888ac38d5be9d289860f402ebd4`.
- New authoring: `audits/ARCHETYPE_FINISH_20260923/07-primate/authoring.json`
  SHA-256 `89bdeced376527615844022b58d03afbcb343c32d5661e2d889d5f7c20e976a8` at creation, before any parent-owned landmark amendment.

Only `near-leg-upper.polygonPx` changed. Exact original polygon:

```json
[[212,505],[339,486],[452,575],[559,659],[605,732],[582,823],[441,853],[341,760],[249,727],[195,624]]
```

Exact proposed polygon:

```json
[[212,505],[339,486],[452,575],[559,659],[605,732],[582,823],[441,853],[341,760],[249,727],[175,710],[175,575],[202,575]]
```

The last old vertex `[195,624]` is replaced by `[175,710]`, `[175,575]`,
`[202,575]`. The closing segment from `[202,575]` to `[212,505]` remains
on the original upper edge. This leaves the upper hip/body interface above
y=575 in place and adds ownership along the continuous posterior near-haunch
rim below it. The extension returns to the unchanged `[249,727]` vertex before
the visible lower-leg emergence. Coordinates outside painted alpha only bound
the polygon; no new painted pixels are created.

The original image shows one continuous rounded near-thigh fur surface here,
not a visible split between root and far thigh. Existing labels instead put
root on its narrow upper rim and far-leg-upper on the lower rim. For example,
at y=587 near-leg-upper begins at x=200 while the rim to its left is root;
at y=647 it begins at x=207 while the immediately adjacent rim is far-leg-upper.
The retained dodge failure occupies x=195–273/y=587–646.5, next to this edge.
The authoring correction follows visible anatomy; the failure location supports
reviewing this seam but is not a reason to reassign genuinely separate anatomy.

The changed polygon retains its original joint, layer and priority. Every
other polygon and every landmark remains exactly as in the copied authoring.
No master, family contract, solver, pin list, limit or threshold was changed.
The edit does not establish that the historical contact or ARAP refusals pass.

## Separate far-hip hypothesis — not applied here

The master places the paired hind limbs in the same posterior pelvic haunch.
The visible near hip is authored at `[306,545]`; pelvis is `[355,493]`.
The old far hip `[297,670]` lies 125 image pixels below the near hip, well down
the overlapping near-thigh surface. It is not a directly visible far hip hinge.
The far upper leg is largely occluded, and the far knee `[315,773]` is itself
an uncertain estimate near its emergence. The far foot remains `[148,1045]`.

For parent review, propose **`legFarHip: [320,550]`**: an occluded attachment
inside the upper pelvic haunch, slightly offset from the near hip. The source
supports a paired pelvic origin in that region, but it cannot establish this
exact internal point. Confidence is higher in the anatomical region than in
the coordinate's precision. This must be recorded as an explicit authored
occluded-joint hypothesis, not a measured visible joint or a proven correction.
It was chosen from the body/pelvic overlap, without solving poses, evaluating
limits, or selecting among numerical outcomes. The landmark remains unchanged
in this agent's new authoring file; applying this separate hypothesis is the
parent's decision.

## Review boundary and next steps

Codex parent owns any documented far-hip amendment, the next IC-3/intake and
qualification, and the eventual signed packet. Retain all old source and red
receipts. Do not infer anatomical correctness from a green solver alone.
Claude's lane remains read-only; no synchronization or GitHub action was taken.
Nick's art review remains separate from technical acceptance.
