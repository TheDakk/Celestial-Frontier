# First native phone setup failure — retained, 2026-09-08

native-phone/review.json remains FAIL after17.63s. The runner waited for surface mode after its
first real Mars Land click. The page remained in Sol/system with Mars Survey open, HP98, exact
learned next-approach disclosure+20% and guaranteed100% arrival/0HP risk. Runtime lastOutcome was
arc0-land-committed:5, SessionRNG ordinal2, descent.success1/descent.damage1. No painted-image
request, vista worker, vista fault or Runtimeexception occurred; the composition was not reached.

The existing landing owner main.ts handles an actual wave-off by applying damage, recording
exact-world learned approach data, refreshing Survey and returning false without changing route.
The retained UI/state match that branch, not a missing paint or unsolicited navigation after
arrival. The first runner failed to observe the actual landing receipt before requiring arrival.
It retained a limited failure snapshot without the durable witness; do not invent missing facts.
This result does not explain or close older MilkyWay/resize/portrait navigation failures.

Correction is confined to a new runner: capture raw readonly before/after checkpoints, exact
arc0-land witness and native action/idle outcome. Accept only a verified first landed result or
one exact committed wave-off. Only the latter plus the100% exact-world CTA permits one guaranteed
second native action, which must record a new exact landed receipt. No arbitrary action retry,
fixture/persistence write, SessionRNG change or product modification. Source/evidence build and
all first-run bytes remain unchanged; desktop/blocked/default were not run after this red.
