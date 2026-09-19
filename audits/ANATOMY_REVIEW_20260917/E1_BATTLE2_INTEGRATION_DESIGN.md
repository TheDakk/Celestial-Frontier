# E1 — battle2 integration design (Track B, anthropic lane)

Status: **DESIGN ONLY**, 2026-09-17, per Nick's D4 ("design now, code after R3 reaches develop").
Owner: Claude (anthropic lane; `battle2/`, `effects/`, `soundkit/`, `worldlife/` are reserved here).
Inputs from the Codex lane arrive by merge (PR42 split), never by copying: `creature-rig.ts`,
`creature-rig-performance.ts`, `creature-rig-contact.ts`, `creature-rig-frame.ts`, `anatomy-attacks.ts`,
`battle-habitat.ts`, `motion/*` (post R1b/R2b/R3), `tools/creature-animation/*`.
No code is written by this document. Every bullet below is a contract the two lanes must agree on.

## 0. What exists on each side today (verified in source)

Anthropic lane (`apps/game/src/battle2`, matches code as of 2026-09-13):
- `choreography.ts` — pure turn plan: ready → command → approach (≤500 ms, mass-scaled) → action → impact
  (= effect `impactAt`) → hitstop (70×mass, cap 140) → flash/shake/number → reaction → return → idle.
  `sampleTurn(plan, ms)` gives both combatants' poses additively over idle; hitstop freezes idle clocks.
- `stage.ts` — structural Pixi stage: three parallax plates, two `BattleRigV1` holders, effect player,
  flash, timing bar, cursor, damage number, cue player; `turnPlanInputFromTranscriptEvent` adapts a
  settled `SettledDuelTranscriptV1.log` row. The stage never changes HP or rewards.
- `cue-plan.ts` — Sound Kit cues on the beats, admitted per beat, fired once from the injected clock.
- `fixture-rig.ts` / `fallback.ts` — the interim `BattleRigV1` kinds `'fixture'` (quadruped-only
  Voronoi cut with underlap) and `'portrait'`; `kind:'parts'` is reserved for the C2 rig.
- `effects/*` — sequencer (kit §5 timing), theme library (Wild painted; ten procedural, labelled),
  seeded emitter, Pixi host.
- `battle2-wiring.ts` — `?battle2=1` study over the Chronicle mount; Civet fixture only; one arena.

Codex lane (post `6b11407d`, R1b/R2b pending):
- `loadCreatureRigV1(record, binding, master, alpha, atlas)` → `CreatureRigV1` (paint-skin mesh, ARAP,
  pins, atomic `applyPose`, `dispose`), `readCreatureRigRuntimeDiagnostics`.
- `createCreatureRigPerformance(record, rig, players)` → `play/sample/update(ms, resolve)`; `resolve`
  receives `{actionId, elapsedMs, durationMs, loop}`.
- `createFamilyContactSolver(record)` → `resolve(pose, phase)` with stance/swing; `contactPaintDriftPx`.
- `anatomy-attacks.ts` — `attackRepertoire(card, medium, declaration)`, `compileAnatomyAttack(card,
  medium, ordinal, verb?)` → `{attack, timeline, contactMs, contactPhase}` (brachyuran row lands in R3).
- `battle-habitat.ts` — `resolvePhysicalHabitat`, `compileHabitatBattle` (READY/UNSUPPORTED, bands,
  ground line), `containHabitatBody`.

## 1. Integration contract (the seam between lanes)

### 1.1 `BattleRigV1` kind `'parts'` — adapter in the anthropic lane
`battle2/parts-rig.ts` (new, anthropic) wraps Codex's `CreatureRigV1`:
- `kind:'parts'`, `label:'source paint-skin rig (C2)'`, `cutout` = record geometry, `foot` =
  `[landmarks.root.x, geometry.groundLineY]`, `bodyLength` = **`card.scaleLength`** (R1b N1), not the
  body axis; `bounds` from the keyed alpha box.
- `applyPose(pose)` delegates to the performance owner's `update`, never to `rig.applyPose` directly,
  so the contact solver and the R4 refusal policy always run. The stage's `#place`/facing stays as is.
- Refusal policy (R4/Q3): the adapter holds the last valid pose, increments a counter surfaced in
  `Battle2Status.rigs`, and never throws into `tick()`. A normal turn with any refusal fails the E1
  outcome test.
- Disposal: adapter → performance owner → `rig.dispose()` (atlas texture destroyed once).

### 1.2 Turn plan clips from the anatomy attack, not from `delivery`
`choreography.ts` today builds the attacker's action clip as `makeClip(A, input.delivery)` (`melee`|`cast`).
E1 replaces the attacker action input with an **attack selection** made once per turn in the wiring:
- `compileAnatomyAttack(card, medium, ordinal, verb?)` chooses the verb deterministically
  (`fnv1a(speciesVisualKey)+ordinal`), returns the timeline and `contactMs`.
- `TurnPlanInput` gains `attack?: { verb, timeline, contactMs, contactJoint }`; when present the plan uses
  its timeline as `clips.attacker.action` and **`impactLocal = contactMs`** (today: `impactOffset(delivery)`).
  The effect schedule must agree: `buildEffectSchedule` is checked against `contactMs` exactly as it is
  checked against the strike phase today (`turn plan: effect impact … disagrees` stays a hard error).
- Melee/cast delivery for the effect still comes from the theme table; the *motion* comes from anatomy.
  A theme with `cast` delivery on a creature whose repertoire has no cast verb plays `cast` from the
  family library (existing behaviour), with the effect origin at the contact joint's world position.

### 1.3 Contact phases through the performance owner
The stage drives each parts rig with the turn-relative clock; the adapter passes
`{actionId: clip.actionId, elapsedMs, durationMs, loop, realm: card.realm, weight}` to the solver via
`update(ms, resolve)`. Blend weight comes from `sampleTurn` (approach in/out); per R1b N11, root travel
is never multiplied by the weight. The approach run-up (`plan.runUp`, ≤500 ms) is the **stage's**
displacement; the solver's own stride-per-cycle root travel is disabled in arena mode by passing
`travel:'stage'` in the phase (a new optional field, Codex R3) so feet plant against the stage's motion
and the two never add.

### 1.4 Arena selection and placement
- `compileHabitatBattle({contextId, seed, round, kind, home, visitor, left, right})` replaces
  `selectArena` (stub) — READY gives `worldKey`, `groundY`, per-side `medium`, `band`, `x`.
- The arena recipe for `worldKey` is the kit's three-plate set for that biome family (D3 order);
  until a family has plates, the accepted Earth-temperate set is used **and labelled** in `status()`.
- `containHabitatBody(band, wantedCentreY, paintedHeight)` sets each holder's y; a body that cannot fit
  its medium is a labelled failure, never clipped.
- UNSUPPORTED → the current Chronicle path (no stage), with the reason in `status()`.

### 1.5 Guardians (P5) — same pipeline, larger
- A guardian is an apex record (raw grade 12–14) at 1536 square; `combatantScale` already scales by
  mass class; add `massClass 'titanic'` mapping for guardians and a frame-fill rule (kit GUARDIAN RULE:
  fills the battle screen) as a `combatantScale` option, not a special rig.
- Boss choreography (multi-phase entrance, phase change) is a Motion Kit §4 addition proposed
  separately; not in E1's first slice.

### 1.6 Reduced motion, cancellation, cleanup
- Reduced motion: existing `plan.reducedMotion` path (ready pose, static number, no effect); the parts
  rig receives `applyPose({})` once and is not updated per tick.
- Cancellation: `dispose(reason)` order — cue player → effect player → both adapters → app; already
  total in `battle2-wiring.ts`; extend to the performance owners.
- Chronicle stays the accessible owner of the outcome; E1 changes presentation only.

## 2. Outcome tests (the law: assert the outcome, not the code path)
1. **Pinch pays** — a seeded duel with a Crab attacker: the transcript's damage row, the turn plan's
   `impactAt`, the effect's `impactAt`, the cue `ability:*:impact`, and the parts rig's dactyl-tip
   world position at `impactAt` all agree within one frame; HP delta equals the transcript.
2. **No refusal in play** — 100 seeded turns across the five crabs and Civet: zero rig refusals,
   zero exceptions reaching `tick`, cue drop-late count 0 at 60 Hz.
3. **Feet stay planted through the run-up** — stance-foot world positions constant during approach
   while the holder moves (extends Codex's paint-drift gate to the stage transform).
4. **Habitat refusal is visible** — an aquatic-only body in a solid-only arena yields UNSUPPORTED with
   reason, never a clipped sprite.
5. **Reduced motion** — same transcript, `reducedMotion:true`: number shown, no shake/flash/effect, rig
   at rest.

## 3. What Codex must provide for E1 (goes into R3's scope)
- `ContactPhase.travel?: 'solver' | 'stage'` (1.3) with a test that `'stage'` yields zero solver root dx.
- `compileAnatomyAttack` for brachyuran (`pinch`) with an explicit contact phase at strike (R3, already
  in the approved plan) and `contactJoint` in its result.
- `BattleRigV1`-compatible metadata on the record: `groundLineY`, keyed alpha box (already in the
  binding intake receipts).
- Nothing else; the adapter, choreography change, habitat wiring and tests are anthropic-lane work.

## 4. Order of work once R3 is on develop
E1.1 parts-rig adapter + refusal policy → E1.2 attack-driven turn plan + impact agreement → E1.3 habitat
arena selection → E1.4 outcome tests 1–5 → E1.5 `?battle2=1` study with the five crabs + Civet, films
for Nick → then guardians (D2) and the Chronicle cadence sync (pre-existing open item).

## 5. Status — 2026-09-19, coded on `anthropic/mac` (D4 relaxed by Nick: code against Codex's signed producer by local merge)

Merged `openai/mac` `4cb5f7a3` (producer `6a58e40e` + review-diagnosis) into `anthropic/mac`, then coded E1.1 (`battle2/parts-rig.ts`),
E1.2 (`TurnAttack` on the plan; anatomy contact = impact beat; effect schedule `impactAtMs`), E1.3 (`battle2/habitat-arena.ts` wired
before staging), E1.6 (reduced motion), the `RigPoseContext` hand-over (§1.3) and the outcome tests of §2 on the REAL fits (crab-fits-03
× 5, candidate-10 Civet) loaded in vitest with a synthetic texture decoder. Wiring: registered fits stage as parts rigs; attacks come from
`compileAnatomyAttack` per side/ordinal; `status()` gains `arena`, `attacks`, `refusals`.

Pending Codex R3, pinned as `it.fails` (flip when R3 lands): `ContactPhase.travel:'stage'` (§1.3 — until then the solver's stride dx
double-counts next to the run-up and feet plant to the body); the brachyuran attack row + crustacean profile split (crabs cannot attack:
`no admitted brachyuran melee for weapons []`, so they stage as targets); `contactJoint` is already on Codex's attack rows and is read
from there. Quadruped bindings run on the preserved compatibility solver until the Civet sentinel passes on the family path (R1c-b).
E1.5 (`?battle2=1` films for Nick) needs a browser run — deferred to the single stop's packet. Guardians (D2) and the Chronicle cadence
sync remain open.

**E1.5 done (same night):** `audits/BATTLE2_E1_PROOF_20260919/` — five Civet-vs-crab films on the real stage, zero
refusals, review sheet. Two defects found and fixed by the film (invisible rigs from normalized display units; victory
rear-up refused as a planted stance) and three observations for Nick (contact gap at leg tips; faint recovers; raw crab
texture until R9). See its README.
