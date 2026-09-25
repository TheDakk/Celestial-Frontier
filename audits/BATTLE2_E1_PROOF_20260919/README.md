# E1.5 — battle2 native proof, 2026-09-19 (anthropic lane)

**Diagnostic study for the single stop's review packet; not visual acceptance.** Two REAL source paint-skin fits on the
REAL `BattleStage` over the accepted Earth-temperate plates, in Microsoft Edge over the shared CDP launcher, driven by
`port/v2/tools/battle2-proof/native-runner.mjs` (bundle → flat asset server → browser → stills + 10 s webm + `ffprobe`).
Everything numeric is read from the live stage; every source read is hashed into each `report.json`.

Producer: this lane's `apps/game/src` at the commit named in each report (`e86a66ab` merge of `openai/mac@4cb5f7a3` +
E1 commits). Rigs: Codex's candidate-10 Civet (`civet-sentinel-input-01`) and the five `crab-fits-03` bindings, through
`battle2/parts-rig.ts` (performance owner + contact solver; Civet on the quadruped compatibility solver, crabs on the family
solver — labelled). Attacks: `compileAnatomyAttack` per turn (Civet `bite (jaw)`, then `claw`); crabs have no admitted melee
on this producer (S4/R3) and stage as targets. Script: three turns — hit 9 → target dodges → hit 21! (faint).

## Final runs (one per crab; all `DIAGNOSTIC_PASS`)

| Run | Right side | Refusals L/R | Film CPU p95 | Frame Δ p95 | Bite contact → target stand |
|---|---|---:|---:|---:|---:|
| `civet-vs-crab-04/` | Crab | 0 / 0 | 2.1 ms | 16.8 ms | 0.179 frame widths |
| `civet-vs-coconut-crab-01/` | Coconut Crab | 0 / 0 | 2.2 ms | 16.7 ms | 0.179 frame widths |
| `civet-vs-freshwater-crab-01/` | Freshwater Crab | 0 / 0 | 2.1 ms | 16.8 ms | 0.179 frame widths |
| `civet-vs-mud-crab-01/` | Mud Crab | 0 / 0 | 2.2 ms | 16.7 ms | 0.179 frame widths |
| `civet-vs-vent-crab-01/` | Vent Crab | 0 / 0 | 2.2 ms | 16.8 ms | 0.179 frame widths |

Each run folder: `report.json` (gates, per-turn beats, contact-joint world position at impact, refusal log, encoded media),
`battle-10s.webm` (1024×576, ~60 fps, 602 captured frames), 12 stills (per turn: approach 50 %, impact, reaction 50 %,
return end). `review-sheet.png` = one row per pairing: approach 50 % · bite impact · dodge reaction · faint impact ·
return end.

## What the film caught that the numeric gates could not (both fixed in the same batch)

- **F1 — invisible combatants.** Run `03` passes every gate (zero refusals, contact instants agree) — and runs `01`/`02`
  fail only on F2 — while the stills
  show the arena, the Wild effect and the damage number with **no creatures**. Codex's paint-skin meshes are in
  *normalized* cut-out units (0..1); the stage contract takes `cutout` as the rig's display-unit size, so the parts rig
  was drawn ~0.3 px tall. The vitest outcome test used the same wrong units on both sides of its jaw check and passed.
  Fix: `parts-rig.ts` reports `cutout` 1×1, `sourceSize` for pixels, `jointPosition` in display units; the vitest check now
  asserts the run-up contract (jaw past the run-up end, inside the attacker's half-width). Runs `01`–`03` keep their
  reports and stills as the evidence; their empty-arena films were not retained.
- **F2 — the victory rear-up refused as a planted stance.** Run `02` logged 21 refusals, all in turn 2 after the return:
  the quadruped `victory` clip under the compatibility solver with feet planted exceeds the 8 % compression bound. It is
  a lift, not a stance: `plantedFor` now frees `victory`; the vitest outcome-2 rows include a Civet win.

## Observations for Nick's eye (not verdicts)

- **V-E1-1** Both rigs render at real scale on the accepted plates; the Civet is the painted paint-skin quadruped, the
  crabs are the raw painter texture (R9 finished textures pending).
- **V-E1-2** The run-up is 0.05 of the frame in every pairing — the choreography's minimum run-up (15 % of the stand
  distance), because both silhouettes are wide enough that `standDistance − halfWidths − gap` falls below it. So the bite
  lands 0.179 frame widths (~183 px) from the crab's stand, at its splayed leg tips, while the Wild effect erupts at the
  body. Contact reference (silhouette box vs body box) and the minimum run-up are choreography/kit questions for Nick.
- **V-E1-3** At turn 2's return end the fainted crab stands upright again — the faint recovers (the V2 finding, now
  on the stage). The defeat pose is not held; R3/R4 clip authoring.
- **V-E1-4** Timing bar, damage number pop/rise, DODGE and the painted Wild sequence land on the beats; effect impact
  = anatomy contact instant (`effectImpactAt` = `attack.contactMs` in every report).
- Interim, labelled: the solver still adds its stride dx during the run-up and stance feet plant to the body (R3
  `travel:'stage'` pending); the Civet runs on the compatibility solver until the sentinel passes on the family path.

## How to reproduce
```
cd port/v2 && node tools/battle2-proof/native-runner.mjs \
  ../../audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01 \
  ../../audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab \
  ../../audits/BATTLE2_E1_PROOF_20260919/civet-vs-crab-05      # new folder required; macOS: approved out-of-sandbox run
```
