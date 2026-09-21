# battle2 — battle scene v2 (A3)

Matches code as of 2026-09-19 (E1.1–E1.4 coded; see the E1 section). Consumes the A1 motion compiler, the A2 effects sequencer and the A5 world-life adapter; implements MOTION_KIT §5 timing and §7 ARENA staging. Everything but `stage.ts` is pure and clock-free; the stage takes an injected clock.

| File | Owns |
|---|---|
| `arena.ts` | D2 G6 (2026-09-21): `combatantScale(..., { frameFill })` — a frame-fill target in [1/2, 1] for apex guardians (kit GUARDIAN RULE); absent, byte-identical to the mass-class rule (`arena-frame-fill.test.ts`: fill within 2 % on 720/1080, identity, bounds). Not yet wired to a guardian context (no guardian record exists). |
| `arena.ts` (existing) | `composeArena` (plates at .10/.50/1.20 with overscan, stands at x = 1/3 and 2/3 on the ground line), `parallaxOffset` (pure function of the run-up displacement), `combatantScale` (creature height 1/3..1/2 of frame by mass class), `selectArena` (home-versus-visitor rule, seeded pick with mulberry32; returns a recipe id only). |
| `fixture-rig.ts` | `CreatureRigV1` (CONTRACTS §2) + `BattleRigV1` (adds cut-out size, foot anchor, label). `cutFixtureParts` partitions the keyed alpha by nearest bone segment into 19 parts (head group, neck, torso, 4 × leg upper/lower/paw, tail0..3), each pivoting at its parent joint, layered far/near; with `underlapPx` / `underlapByLimit` every ancestor also carries its descendants' cut bands beneath them (parents drawn first, `FIXTURE_DRAW_ORDER`) so joints do not open wedges when they rotate (batch 4). `rig-render.ts` renders a cut in a pose without a browser for gates. `solvePose` is forward kinematics over the motion template GRAPH. `createFixtureRig` binds parts to sprites through a structural factory. Label: `fixture rig (landmark-derived parts)`. |
| `fallback.ts` | Whole-portrait rig (one sprite, foot pivot) and root-offset clips taken from the action library's own root tracks, so a portrait's beats land on the same milliseconds as a rigged combatant. Label: `whole-portrait fallback (no landmark record; hit pose approximated by root offsets)`. |
| `choreography.ts` | `buildTurnPlan` → absolute ms for ready, command, approach (≤ 500, mass-scaled), action, impact (= effect `impactAt`), hitstop (70 × attacker mass, cap 140), flash (2 frames + 120), shake (6 px × mass over 180), damage number (90 / 420 / 160), reaction (hit / dodge / faint), return (≤ 500), idle. `sampleTurn(plan, ms)` → stage state. Idle runs additively under every one-shot with its clock frozen through hitstop. Melee themes hold the sweep across both stands and reveal by alpha; cast themes slide origin → contact. Reduced motion: ready-state pose, no shake, no flash, no effect; the number is shown static. |
| `stage.ts` | `BattleStage` (structural Pixi 8: plates, world life, two rig holders, effects container, near plate, flash, timing bar, cursor, damage number) and `turnPlanInputFromTranscriptEvent`, the combat outcome adapter from a `SettledDuelTranscriptV1.log` entry (`{side, an, dn, dmg, crit, hpA, hpB}` / `{dodge:true, an, dn}` / `{stun:true}` / `{tick:true}`) to a `TurnPlanInput`. Champion A stands left, defender B right. |
| `parts-rig.ts` | (E1.1) `createPartsRig` — `BattleRigV1` kind `'parts'` around Codex's source paint-skin `CreatureRigV1`: every stage pose goes through Codex's performance owner and the contact solver (family solver; quadruped bindings keep the compatibility solver until the Civet sentinel passes on the family path), refusals are counted and leave the last valid pose (R4/Q3 interim), `jointPosition(joint)` reads the resolved skeleton for the outcome tests. Imported by path, never through `index.ts` (pixi.js typing note in the file). |
| `habitat-arena.ts` | (E1.3) `selectHabitatArena` — Codex's `compileHabitatBattle`/`containHabitatBody` decide each side's medium and band on the home/visitor world (or the labelled dry Earth-temperate default); READY gives the stands' y (ground line, or the body contained in its band), UNSUPPORTED returns the reason and both habitats, never a clipped sprite. |
| `cue-plan.ts` | (B1) `buildTurnCuePlan` places the Sound Kit §4 cues on the turn beats (the ability impact cue is the hitstop frame) and admits them per beat through the §5 mix; `TurnCuePlayer` fires them once each from the injected clock and drops anything later than 90 ms. |

Per-ability effects (B2): `effects/theme-library.ts` resolves every kit theme; Wild plays its painted sequence, the other ten play a labelled procedural emitter in the theme's material colour until their sequences are painted. The stage resolves emitters and tint by `plan.theme`.

## Flag-gated wiring (A6 part 2)

`apps/game/src/battle2-wiring.ts` mounts the stage over the Chronicle mount under `?battle2=1` (one guarded dynamic import in `main.ts`): pixi classes passed in, dev-only asset fetch by audit path, Codex's keyer (`kit-contact-math.mjs`, static import) from the kit runtime route, `createFixtureRig` for a combatant with a landmark record and `createPortraitRig` otherwise, each combatant's theme from the combat domain (`abilityTheme`), the transcript log fed through `turnPlanInputFromTranscriptEvent` → `stage.play` → `stage.tick` on the app ticker with `performance.now` injected. `status()` reports rigs, effects (painted / procedural per side), voices (batch 3: one derived voice per side from its record or genome) and audio (the cue log; main.ts passes the accessible audio owner's `decorativeVoicePort()`, so the runtime's own admission still rules every cue). The Chronicle log stays the accessible owner of the outcome; the stage never changes HP or rewards.

Open A3 defaults recorded for Nick: melee themes = `wild, stone, sand` (others cast); run-up = 55 % of the stand distance; damage number rises 7 % of frame height from 30 % above the ground line; cursor blink 250 ms; idle tail 600 ms after the last beat.

## E1 — battle2 integration (Track B), coded 2026-09-19 against Codex's signed producer `6a58e40e` (local merge)

Design: `audits/ANATOMY_REVIEW_20260917/E1_BATTLE2_INTEGRATION_DESIGN.md`. Delivered here: E1.1 parts-rig adapter (`parts-rig.ts`),
E1.2 attack-driven turn plan (`TurnPlanInput.attack`, `TurnAttack`; the action clip is the anatomy timeline and `impactAt − actionStart =
contactMs`; `effects/sequencer.ts` takes `impactAtMs` so the effect schedule lands its impact on the same instant, still a hard error if it
cannot), E1.3 habitat arena selection (`habitat-arena.ts`, wired before staging), E1.6 reduced motion (one rest pose per turn in `play()`,
no per-tick rig update), and the `RigPoseContext` every stage pose now carries (`CombatantSample.context`: clip id, elapsed, duration, blend
weight, stance, travel owner). Outcome tests (`e1-outcomes.test.ts`, `parts-rig.test.ts`, beside the app): the Civet bite pays (contact
instant = effect impact = ability cue placement = damage number, jaw arrives at the target); no refusal in play for the Civet (attacker and
target) and for the five crabs as targets; habitat refusal is visible; reduced motion holds the rig at rest.

Interim, labelled, pinned by `it.fails` so the pins flip green when Codex's R3 lands: (1) `ContactPhase.travel:'stage'` — today the solver
still adds its own stride dx during the run-up and stance feet plant to the body, not the arena; (2) a crab cannot attack — the current
producer admits no brachyuran melee for `weapons []` (S4), so crabs stage as targets and `status().attacks` names the reason; (3) `pinch`
is not an admitted anatomy attack for the Crab. Quadruped bindings use Codex's preserved compatibility solver until the Civet sentinel
passes on the family path (R1c-b).

### E1.5 — native proof (2026-09-19)
`tools/battle2-proof/native-runner.mjs` films two real fits on the real stage in Edge (`audits/BATTLE2_E1_PROOF_20260919/`:
five Civet-vs-crab runs, zero refusals, CPU p95 ≈ 2.2 ms at 60 fps, review sheet). The film caught two defects the
numeric gates could not: the parts rig's display units are normalized (it was drawn 0.3 px tall — `cutout` is now 1×1
with `sourceSize` for pixels), and the quadruped victory rear-up cannot be a planted stance (`plantedFor` frees it).
Observations for Nick: the contact gap stops at a crab's leg tips (silhouette box), and the fainted crab stands back up.
