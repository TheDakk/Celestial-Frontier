# G6 — Claude's review of the bear static refusals and the frame-fill stage (2026-09-22)

Codex's signed bear comparison fit (`fit-01/`, producer `1ff30009`, static evidence `b8829a88`) is merged into this
lane. Its STATIC_VERDICT is RED for native animation: 15/20 action rows + presentation refuse on the painted-support
fixed-point residual (0.254–0.269 px against 0.25), gallop hits the scale-compression bound at 180.267 ms; exact rest
PASS. Codex asked Claude to review those refusals before any native G6 use. This is that review.

## 1. What the battle stage actually plays — measured on the real stage, same fit
`port/v2/apps/game/src/battle2/d2-guardian-fill.test.ts` drives Codex's fit through a whole turn on the E1 harness
(idle → cadence approach → melee → hit → faint/victory) as attacker and as target, 1024×576 and 1920×1080:

| Supports model | Samples | Refusals | Stance reach (body lengths) |
|---|---:|---:|---:|
| **rest** (the parts rig's default since 2026-09-21; what the stage plays) | 216 per turn × 4 turns | **0** | 0.120 |
| observed painted supports (`contactSupports:'observed'`, Codex's static mode) | 216 | **77** | 0.117 |

So the static RED is the observed-support iteration on this fit, not the family solver or the rig: under rest
supports the bear poses every phase the stage uses with zero refusals. The finding, its numbers and the diagnostic
asks (iteration sweep / per-support breakdown / gate scale / gallop bone) are handed to Codex in ROADMAP's Codex
block; nothing in the solver, its gates or the fit was changed here.

## 2. G6 built: the guardian fills the frame
- `BattleRigV1.guardian` (fixture-rig.ts) carries the record's `guardian` block through the parts rig
  (`desktopOnly:true, cpuP95GateMs:5, landmarkComparisonBoundPx:60, requestedMasterSize:1536, actualMasterSize:1254`).
- `stage.ts`: a rig with a guardian block is scaled with `combatantScale(..., { frameFill: GUARDIAN_FRAME_FILL })`,
  `GUARDIAN_FRAME_FILL = 0.9` — an option of the existing scale, not a species branch (D2 §4).
- Outcome tests (8/8, battle2 54/54): drawn standing height (holder scale × bounds × cut-out) within 2 % of
  0.9 × frame through the whole turn on both viewports and both sides, zero refusals; the crab beside it keeps the
  mass-class scale byte-identical (`toBe` against `combatantScale` without the option) and stays ≤ 0.5 of the frame.

## 3. Film
See `audits/BATTLE2_D2_GUARDIAN_FILM_20260922/README.md`: `bear-vs-crab-01` (rest fill 0.9; two eye findings — rearing head leaves the frame, stands overlap) and `bear-vs-crab-02` (fill sizes the tallest pose, guardian stands; both answered; 3.00 ms). Nick picks the look; each is one constant.

## 4. Left for Codex / Nick
Codex: §1's diagnostics, a rest-supports mode in `static.ts` (so the static verdict reports the mode the stage
plays), the freshwater reach regression, mud/vent folded declarations. Nick: nothing new to decide from G6; the
1254² size finding stands as Codex recorded it; the §6 60 px comparison (G3) is recorded in README slice 37 of
`port/v2/tools/anatomy-verify/README.md` (all four paws named; two pads 14–17 px outside the bound).
