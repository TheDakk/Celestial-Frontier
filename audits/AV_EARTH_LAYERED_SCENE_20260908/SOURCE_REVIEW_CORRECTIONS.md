# Pre-check lifecycle corrections

Independent loader review found malformed response accessors could escape before cleanup, canvas
allocation was outside its cleanup block, and duplicate resident results could replace an owned
canvas. Corrected protocol parsers return refusal on thrown access; allocation/copy is enclosed
by bitmap cleanup; duplicate results close without a second canvas. Copy failure publishes
fallback only after the bitmap closes. These were found by source review before any test run.
The app recipe was split from the painter into a pure plan module to preserve worker-only heavy
painting. No lifted painter, genome, runtime dependency or old protocol was edited.

Automation pause was followed by complete deletion at Nick's request; local schedule absence
was verified. Retain automation-pause.json as its chronological predecessor, not current state.

## Final display/lease ownership review

Independent source review found rollback and scene-exit Sprite cleanup could throw before lease
retirement, allowing a loader refusal to shrink still-live backing canvases. Main now retains
sprite/lease/canvas entries together, attempts each display operation independently, retires
safe siblings and returns `retained-failure` when rollback still owns resources. The loader
preserves both backing canvases on that disposition. Scene cleanup aggregates failures and
continues the other world scopes. Failed entries remain reachable for explicit later retry.

Installed Pixi sets `destroyed` before `removeFromParent`, so that flag alone is insufficient.
The final check requires actual parent detachment and null/empty texture ownership even after
partial destruction. Every operation failure remains an error; retries do not erase it.
Focused resource tests exercise throwing releases/setters and recovery; loader tests cover both
arrival orders and retained-failure. Display partial-destruction handling was source-reviewed,
not fault-injected into native Pixi. Native exit tests remain a separate scope.


## Resting layout after canvas-only camera motion

The first desktop-visible run stopped on a y-position mismatch, but the observer had not
serialized the compared composition. Its exact offset remains unknown. A fresh observer-only
diagnostic retained a successful initial composition with center475.73777831625193 instead of
475.75, then exact475.75 after Survey reopened/closed. Source establishes that landing translates
app.canvas through Web Animations for160/220ms. The new DOM-to-canvas layout subtracts the
transient canvas.top, and the animation can end without a ResizeObserver size change.

The scoped product correction refreshes the exact Earth pair when the final tracked impulse
finishes (or rejects). Other variants and camera-shake policy remain unchanged. Focused tests
exercise the actual callback lifetime and a missing-settlement negative control; final execution
and native observations are recorded in the batch README. The native observer persists measured
geometry before judging it and waits for actual animation settlement without changing tolerance,
cancelling motion or forcing product synchronization. This source-derived mechanism does not
retroactively reconstruct the missing first-failure geometry.

Separate source risks remain outside this demonstrated fixed-viewport path: the optional layout's
visibility predicate reads the element itself, whereas the native observer includes ancestors;
position-only chrome/class changes need not trigger ResizeObserver. Native resize/re-entry and
all hidden-ancestor arrangements are not qualified by this static batch.
