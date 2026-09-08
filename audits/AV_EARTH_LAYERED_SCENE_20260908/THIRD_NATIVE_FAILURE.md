# Third native Earth failure — transient canvas translation entered resting layout

Recorded 2026-09-08. `native-desktop-visible/review.json` remains **FAIL**.
The preceding `native-phone-visible` attempt passed against the same frozen
`earth-layered-visible-evidence-dist-20260908` product. The desktop failure
stopped that chain before the blocked-image and default native stages.

## Retained failure and the diagnostic limitation

Desktop stopped at the initial composition assertion **Vista y violates
measured chrome band**. The first instrument called its acceptor before saving
the returned composition. That failing sample's exact Sprite coordinates and
DOM boundaries were therefore not retained. The later failure screenshot does
not recover the precise failing geometry or transient offset. This is an
instrument evidence omission, and the original report is preserved as such.

The fresh `native-earth-layers-diagnostic-runner.mjs` changed only evidence
publication order and failure capture, plus its own metadata. It ran against
the unchanged frozen product/build and **passed**. This is a separate diagnostic
result; it does not turn the earlier desktop red into a pass or authorize a
blind repeat. It retained the following exact geometry:

| Measurement | Initial composition | After native Survey reopen/Close |
|---|---:|---:|
| Canvas CSS origin | (0, 0) | (0, 0) |
| Top chrome bottom | 287 | 287 |
| Planetside top | 664.5 | 664.5 |
| Expected center Y | 475.75 | 475.75 |
| Actual center Y | 475.73777831625193 | 475.75 |
| Residual Y offset | −0.01222168374807 | 0 |
| Panorama width | 789.2093023255812 | 789.2093023255812 |
| Panorama height | 353.5 | 353.5 |

The initial residue happened to fit the existing **0.02-pixel** comparison.
The later native Survey action caused a new layout publication and the residue
vanished. The diagnostic passed with unchanged tolerances; it did not prove
that every native landing settled correctly. There were no Runtime exceptions
or cleanup failures in the red or diagnostic run.

## Source-supported mechanism

Successful native landing builds the surface and then calls
`triggerCameraShake()`. That function animates the **canvas element itself**
with CSS translations for 160 or 220 ms, according to the existing policy.
Its old completion/cancellation callback only removed the animation from the
active set.

`currentEarthLayeredLayout()` measures `app.canvas.getBoundingClientRect()` and
subtracts its top coordinate from the fixed DOM top and lower boundaries.
If the canvas is translated by a transient vertical displacement δ at the
moment the pair is published, both local boundaries shift by −δ. Their distance
and therefore the pair's scale/height stay unchanged, while the center becomes:

`published center Y = (top chrome bottom + Planetside top) / 2 − δ`

When the animation returns the canvas to its resting position, that local
Sprite center can retain the transient subtraction. The layout observer reacts
to element size changes; a translation alone need not deliver another size
notification. This mechanism explains a y-only residue with unchanged width
and height and is consistent with the exact diagnostic sample. The first red's
specific δ remains **unknown** because that geometry was not recorded.

## Bounded product and observer correction

The product successor changes the shake release callback: after removing the
finished/cancelled impulse, when no impulse remains and the exact Earth layered
variant still owns the view, it resynchronizes that paired presentation. It
does not change native landing outcomes, artwork, motion duration, UI placement
or the numeric comparison tolerance.

`native-earth-layers-settled-runner.mjs` is a new immutable observer. Immediately
before its single native Earth Land, it starts a passive requestAnimationFrame
journal capped at **120 frames / 2,000 ms**. The journal records actual canvas
rectangles and computed transforms, active camera-shake/animation state, DOM
band boundaries, and any paired Sprite positions/scales. It observes only;
it does not replay Land, force a shake, cancel native animation, change a policy
or call layout synchronization.

After the pair is ready, the runner waits read-only for the current active
shake count to reach zero, samples resting frames, and persists the journal
and an open-Survey composition **before** the native Survey Close can cause
another layout publication. Its summary records observed motion/end events,
resting pair coordinates and the old raw-rectangle formula applied to captured
transient samples. These journal calculations are diagnostic evidence, not a
substitute for the full composition acceptor. The normal closed-Survey checks
retain the same **0.02-pixel** acceptor and all DOM/pixel/mutant/resource checks.

Missing transient motion within the bound is explicitly reported as a
limitation, not repaired with replay. Cleanup stops the observer and saves its
remaining rows even on failure. No new timing threshold was substituted for
native animation state. This runner and note were prepared without a browser,
build or test execution. A fresh source/build and fresh native outputs are
required for the product successor; its verification is still pending here.
All earlier runners and reports remain unchanged.

- Desktop visible red report SHA-256: `180ab94e6aed1874320ab1fe59e18450cc9d17783d82b6dcc241f5f50fd122ea`.
- Desktop diagnostic PASS report SHA-256: `924d0cb8d7d6cf008923f2d8324fc07f763b9770fc1fdfd060eedfe5d1f03413`.
- Preserved diagnostic runner SHA-256: `1432423fbb222a76a88638cd221052c53ca058d81fabc7b31c2199b3a1be5482`.
- New settled runner SHA-256: `76ca9686c913f52568b2fc3b7268085818806c6de8edcb7590abc091e5b770cf`.
