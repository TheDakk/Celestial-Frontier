# Guardian size — one look for Nick (2026-09-24)

**Why.** Tonight's review found that the arena tests only ever played turn one. With every turn played, the Brown Bear
guardian's victory rear-up left the TOP of the frame. The fix (`combatantPresentation`'s top cap: every fighter's tallest pose
stays inside the frame above its stand) shrank the bear at rest from 0.70 to **0.55** of the frame. That is the -02 look Nick
chose on 2026-09-22, minus a fifth of its height. This page shows the one lever that wins the size back without leaving the
frame: stand the guardian lower, in the foreground.

**`guardian-size-sheet-01.png`** (full-size stills stay local; rerun the films to regenerate them). Rows are the guardian's stand line. Columns: walking in, the claw swing (dodge turn;
the hit turn's impact still is bleached by the hit flash by design), then two victory stills (the rear-up).

| stand line | bear at rest (fraction of frame height) | refusals | CPU p95 | film |
|---|---|---|---|---|
| 0.78 (as shipped: the arena's ground line) | **0.550** | 0 / 0 | 2.5 ms | `bear-stand-0.78/` |
| 0.87 | **0.615** | 0 / 0 | 2.6 ms | `bear-stand-0.87/` |
| 0.95 (foreground) | **0.673** | 0 / 0 | 2.5 ms | `bear-stand-0.95/` |

In every row the victory rear-up stays inside the frame (the cap holds by construction; the stills show it). The opponent
stays on the ground line (0.78), so a lower guardian reads as nearer the camera.

**How it was made.** The real stage runs in Edge through `tools/battle2-proof/native-runner.mjs`, with Codex's observed-supports bear
(`VISION_D2_GUARDIAN_20260921/fit-01`) against crab-fits-03 and the 2026-09-22 script. `script.guardianStandY` is a
LOOK-STUDY knob in the harness only. It moves the guardian's stand before presentation AND after placement. The first run
set it only before placement, which enlarged the bear but left it standing on 0.78; the report's `stands` exposed that, and
those films were discarded. The report now also records `restFill` per side.

**Decision (Nick).** Keep 0.55 as shipped, or stand guardians lower (0.95 gives 0.67). If lower, it becomes one constant
next to `GUARDIAN_STANDS` in `battle2/arena.ts`, with a test that the tallest pose stays in frame at that line. Nothing in the game changed.
