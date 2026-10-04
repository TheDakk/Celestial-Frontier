# Bat (C190 spread-wing reference) — native film, 2026-10-02 (Claude)

Codex's `audits/C168_MEMBRANE_REFERENCES_20261002/spread-bat-contours/fit01`, gull battle script with the name swapped, observed
supports, CF_CPU_THROTTLE=4: **DIAGNOSTIC_PASS** — 749 frames, 0 refusals, claw (legNearFoot) / bite (jaw), CPU p95 3.2 ms.

**HELD — staging, not art:** in the aerial realm the bat is placed so high that only the lower half of its wings shows at the
top edge of the frame, in both the reaction and the late idle (`bat/turn1-hit-reaction-50.png`, `bat/turn3-hit-idle-90.png`).
The aerial band places the flier's centre without fitting the whole (very wide, shallow) wingspan inside the frame. Fix belongs to
the stage's aerial placement (keep the full posed bounds inside the frame for aerial fighters); it is a product change, batched
with the next combined I5 measurement.

**Re-check (side branch `anthropic/next-aerial-fit`, same day):** the hold does not reproduce. The two committed stills and a
2 fps contact sheet of `battle-full.webm` show both bats wholly inside the frame, wingtips well below the timing bar. Measured on
the same placement (stand y 0.4106, fit 0.6964) through the real stage, every published paint-skin vertex of both bats over all
four turns (751 samples at 60 Hz) spans y 0.097–0.507, x 0.230–0.784 of the frame — top 56 px, clear of the bar (20 px) and a
4% margin. Pinned by `port/v2/apps/game/src/battle2/aerial-frame.test.ts`; its control (the foot at the air band's centre,
the body not fitted) puts the wings at y −0.044, above the frame, and the check fails. No placement change was needed.

**Released 2026-10-02:** the hold was a review error — the crop sheet (`native-g2c54/crops.mjs`) shows a fixed band around the ground, cutting off aerial fighters. Full frames show both bats wholly inside the frame (wingtips y≈78–95 px, below the timing bar); a regression test (`battle2/aerial-frame.test.ts`) pins it. **Bat accepted.**
