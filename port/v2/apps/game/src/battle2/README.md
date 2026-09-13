# battle2 — battle scene v2 (A3)

Matches code as of 2026-09-13. Consumes the A1 motion compiler, the A2 effects sequencer and the A5 world-life adapter; implements MOTION_KIT §5 timing and §7 ARENA staging. Everything but `stage.ts` is pure and clock-free; the stage takes an injected clock.

| File | Owns |
|---|---|
| `arena.ts` | `composeArena` (plates at .10/.50/1.20 with overscan, stands at x = 1/3 and 2/3 on the ground line), `parallaxOffset` (pure function of the run-up displacement), `combatantScale` (creature height 1/3..1/2 of frame by mass class), `selectArena` (home-versus-visitor rule, seeded pick with mulberry32; returns a recipe id only). |
| `fixture-rig.ts` | `CreatureRigV1` (CONTRACTS §2) + `BattleRigV1` (adds cut-out size, foot anchor, label). `cutFixtureParts` partitions the keyed alpha by nearest bone segment into 19 parts (head group, neck, torso, 4 × leg upper/lower/paw, tail0..3), each pivoting at its parent joint, layered far/near. `solvePose` is forward kinematics over the motion template GRAPH. `createFixtureRig` binds parts to sprites through a structural factory. Label: `fixture rig (landmark-derived parts)`. |
| `fallback.ts` | Whole-portrait rig (one sprite, foot pivot) and root-offset clips taken from the action library's own root tracks, so a portrait's beats land on the same milliseconds as a rigged combatant. Label: `whole-portrait fallback (no landmark record; hit pose approximated by root offsets)`. |
| `choreography.ts` | `buildTurnPlan` → absolute ms for ready, command, approach (≤ 500, mass-scaled), action, impact (= effect `impactAt`), hitstop (70 × attacker mass, cap 140), flash (2 frames + 120), shake (6 px × mass over 180), damage number (90 / 420 / 160), reaction (hit / dodge / faint), return (≤ 500), idle. `sampleTurn(plan, ms)` → stage state. Idle runs additively under every one-shot with its clock frozen through hitstop. Melee themes hold the sweep across both stands and reveal by alpha; cast themes slide origin → contact. Reduced motion: ready-state pose, no shake, no flash, no effect; the number is shown static. |
| `stage.ts` | `BattleStage` (structural Pixi 8: plates, world life, two rig holders, effects container, near plate, flash, timing bar, cursor, damage number) and `turnPlanInputFromTranscriptEvent`, the combat outcome adapter from a `SettledDuelTranscriptV1.log` entry (`{side, an, dn, dmg, crit, hpA, hpB}` / `{dodge:true, an, dn}` / `{stun:true}` / `{tick:true}`) to a `TurnPlanInput`. Champion A stands left, defender B right. |

## Flag-gated wiring that was NOT done here (A6 / Codex, shared by contract)

One adapter file plus one import in `main.ts`:

1. `apps/game/src/battle2-wiring.ts` (new): builds `BattleStageFactory` from `pixi.js` (`Container`, `Sprite`, `Text`, `Graphics`), `createPixiEffectHost(pixi)`, the world-life factory of CONTRACTS §3, resolves plate and effect textures by the recipe/anchors image names, builds a `BattleRigV1` per combatant (`createFixtureRig` from a landmark record + keyed alpha, or the C2 rig wrapped with `cutout`/`foot`/`label`, or `createPortraitRig` when no record exists), and feeds each Chronicle step through `turnPlanInputFromTranscriptEvent` → `stage.play` → `stage.tick` on the app ticker with `performance.now` as the injected clock.
2. `main.ts`: one import and a flag (`battleScene: 'v1' | 'v2'`, default `v1`) choosing this stage instead of `CombatBattleSceneController`. The Chronicle log stays the accessible owner of the outcome; the stage never changes HP or rewards.

Open A3 defaults recorded for Nick: melee themes = `wild, stone, sand` (others cast); run-up = 55 % of the stand distance; damage number rises 7 % of frame height from 30 % above the ground line; cursor blink 250 ms; idle tail 600 ms after the last beat.
