# Fit07 dodge: required stride exceeds source support reach

The existing target scan retained 10 dodge refusals from 49 through 70 ms. Their geometric support distances were calculated without calling the contact solver. The first error (49 ms) and largest retained geometric excess (63 ms) were then each replayed once through real GSAP/performance/contact. Both actual attempted poses exactly match the retained raw poses; both original and nested support-candidate refusals are preserved with full stacks. No ARAP, row battery, browser or source edit occurred. All 47 inventoried source files remained unchanged.

| Sample | Group0 state | Painted target distance | Provisional support reach | Excess |
| --- | --- | --- | --- | --- |
| 49 ms | planted | 96.7169666735476 px | 96.673344630615 px | 0.04362204293258792 px |
| 63 ms | swing at0.050000000000000044 | 100.0293931593744 px | 96.673344630615 px | 3.356048528759379 px |

Both geometric targets lie above the socket, so downward-only compression cannot make them reachable. At 63 ms the body has retreated 27.0911720676681 px while the foot has moved only about0.537363 px horizontally and retracted0.244870 px toward the socket. This is the long first source-step interval combined with delayed group0 swing; it is not an incorrect lift direction or keyframe clock. The repeated knee/root/source-support geometry exactly matches fit06: socket[1022,639], knee[1014,609], endpoint[1057,558], support[1061,563.2], offset[4,5.2] source pixels. Its new rendered vertex index is122; the new mesh did not move the selected support point.

Unlike the earlier46.666666666666664 ms case, the provisional painted-support candidate now fails its reach guard before a solve. The support remains mixed, with every nonzero contributor retained. These measurements establish failure of the current candidate geometry; they do not pretend that a mixed surface is exactly rigid or prove arbitrary global IK infeasibility.

A bounded next model to evaluate is an explicitly declared compact-only subdivision of each nonzero source-travel interval into two equal signed substeps. This would preserve every authored root waypoint/time, total root displacement, original lift/retraction amplitudes, all contact chains and every numerical gate, while alternating the two groups sooner. Keep zero-travel holds and stage-owned travel unchanged. This is a cadence/model change, not a fitted threshold or a change to the painted anatomy. It remains **unimplemented and unqualified**; root owns the decision and changed-source checks. No reduction of clip distance or weakening of reach/paint limits is supported here.
