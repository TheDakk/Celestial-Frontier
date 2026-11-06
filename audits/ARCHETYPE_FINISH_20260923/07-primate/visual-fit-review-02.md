# Chimpanzee fit-02 — source and label review

Reviewed the unchanged original master, the new `fit-02/labels.png`, its record
and label-authoring receipt, and the prior repair's corresponding authoring and
receipt. This is a visual/source review, not another intake, static run, solver
execution or native measurement.

Current record recipe:
`9b9ee55debbae28a7a1346158954c2915449c28f6b4c5e135cbdc7a8128d6a69`.

## Anatomy and ownership

The source retains exactly **two hind-leg chains and two arm chains**, with two
feet and two knuckle-bearing hands. The far leg remains distinct below its
overlap with the near thigh; the correction does not erase a limb or invent
another one. Ear anatomy remains attached to the head. The near ear is clearly
visible; this review does not infer a separately visible far ear. Tail absence
agrees with the retained explicit declaration.

The revised near-leg-upper polygon assigns the continuous posterior
near-haunch rim to that near thigh. The former root/far-thigh split crossed
continuous fur without a corresponding visible anatomical separation. The new
ownership follows that surface while preserving the existing upper hip/body
interface, knee boundary, and separate far shin/foot. I found no source-based
objection to this bounded ownership correction.

The record's far hip corresponds to `[320,550]` in the 1254-pixel source space.
This remains an explicitly estimated occluded pelvic attachment. The painting
supports the region but does not expose the exact internal joint. The far knee
also retains its documented occlusion uncertainty. Neither a label change nor
a successful technical check would convert those estimates into observed
joint centers.

## Retained label-count comparison

These counts were measured by the existing label writers and read from
`audits/ARCHETYPE_REPAIRS_20260922/07-primate/fit-02/label-authoring-receipt.json`
and this packet's `fit-02/label-authoring-receipt.json`. The differences below
are arithmetic comparisons of those receipts; this review did not rerun the
writer or independently recount image pixels.

| Part | Prior repair fit-02 | Current fit-02 | Change |
| --- | ---: | ---: | ---: |
| near-leg-upper | 74,620 | 77,725 | +3,105 |
| far-leg-upper | 5,556 | 3,077 | −2,479 |
| body | 147,269 | 146,643 | −626 |

All other part counts in the two receipts are unchanged. The three deltas sum
to zero. The current writer receipt reports zero changed RGBA channels, zero
eroded pixels and zero despilled pixels. Exact polygon changes and their
creation-time hashes remain in `anatomy-review-01.md`.

## Retained art limitations

Faint colored edge fringe and isolated faint specks remain in the original
source. Side margins around the outer extremities remain narrow; this review
does not certify the requested margin. The visible limb endpoints appear
intact rather than cropped. These source-art limitations were not removed or
hidden by the ownership correction and remain for Dakk's visual review.

No additional script, test, fit or image operation was run to write this
review. Parent-owned static/native receipts separately establish their stated
technical results. Codex parent owns sealing the packet; Claude receives only
the signed result through the authorized handoff.
