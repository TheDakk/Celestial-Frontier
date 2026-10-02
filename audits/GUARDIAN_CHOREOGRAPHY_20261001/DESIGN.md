# Guardian choreography — boss fights on the painted stage (Claude, 2026-10-01)

Dakk's vision: "battle scenes with masterfully drawn guardians" — a Guardian or Titan fight should feel like a Final Fantasy VI /
Chrono Trigger boss encounter (MOTION_KIT §1, read as principles, never copied frames). Until now boss choreography was designed
nowhere: E1 §1.5 (`audits/ANATOMY_REVIEW_20260917/E1_BATTLE2_INTEGRATION_DESIGN.md`) left "multi-phase entrance, phase change" as a
Motion Kit §4 addition "proposed separately". This is that proposal, built behind an opt-in study flag.

**Status: built, opt-in, default OFF** (`?guardianChoreo=1`). It needs Dakk's eye on film before it becomes the default.

## 0. Rules this design keeps

| Rule | Source | How it is kept |
|---|---|---|
| Presentation only: no outcome, reward or RNG change | CLAUDE.md rule 1; `port/DECISIONS.md` §20 ("rewards are identical", "no rerolls") | The program reads the SETTLED transcript and the turn inputs already built from it. It draws nothing and reads no clock. Test check 4 compares flag on/off on a real Guardian settlement. |
| One-fighter Balanced Auto stays byte-identical to v1 | §20 parity; D17 | Nothing in `@cf/domain-combatcore` changed. With the flag off, every turn plan, cue plan, sampled frame and stage frame matches fingerprints pinned from the pre-change code (test check 3). |
| No camera moves | MOTION_KIT §7 ARENA | Nothing pans or zooms. Only the existing shake and flash are used, plus the root alpha for the reveal. |
| Hitstop ≤ 140 ms | MOTION_KIT §5 (`HITSTOP.capMs`) | Every boss hitstop is either `hitstopMs(mass)` (capped) or the cap itself. `buildTurnPlan` refuses a forged strike above it. |
| Every duration scales by mass, within 0.6×–2.0× of base | MOTION_KIT §5 | Every body beat goes through `scaleMs(base, titanic)`. |
| Closed cue vocabulary | SOUND_KIT §4 ("closed"); `soundkit/cues.ts` | Only existing ids. `assertCueId` runs on every set-piece cue. Admission per beat follows kit §5 (`admitCues`, the same function a turn uses). |
| Both combatants idle throughout | MOTION_KIT §7 | Each set piece layers its one-shot over the seeded idle clips, with the idle clocks frozen through its hitstop (the turn's rule). |
| Swap is never necessary; defeat is Recovery | §20 | The relay beats are unchanged. The triumph caption says the fighter "falls back to Recovery", never "dies" or "is lost". |

## 1. Where it lives

| Piece | File |
|---|---|
| Pure program and set pieces (domain) | `port/v2/apps/game/src/battle2/guardian-choreo.ts` |
| Heavy-strike hook in the turn plan | `battle2/choreography.ts`: `TurnPlanInput.guardianStrike` (optional), `shakeOffset` (ONE shake rule) |
| Set-piece cue admission | `battle2/cue-plan.ts`: `admitCues` (refactor of the turn's own admission; output unchanged) |
| Stage rendering | `battle2/stage.ts`: `playSetPiece` / `tickSetPiece` (new); `tick`/`play` unchanged |
| Sequencing | `battle2-wiring.ts`: entrance → relay beats → turns with the phase piece placed → finale |
| Flag | `battle2-gate.ts`: `GUARDIAN_CHOREO_DEFAULT = false`, `guardianChoreoOn(search)`; `main.ts` passes it |
| Tests | `battle2/guardian-choreo.test.ts` (20), one case in `battle2-wiring.test.ts` |

A program exists only when `encounterHasGuardianPhaseV1(defender.kind)` (Guardian or Titan, the kinds with the §20 phase change).
The guardian is the defender, so it stands on the right (side B). Its mass for every boss timing is **titanic, 1.60**
(`MASS_CLASS.titanic`; E1 §1.5: "add massClass 'titanic' mapping for guardians"). A lighter card is floored to 1.60.

## 2. The timing table (titanic, m = 1.60)

| Beat | Duration | Derivation |
|---|---|---|
| reveal | 220 | MOTION_KIT §7 PANELS: open ease-out 220 (the arena fades in as a panel would) |
| rise | 672 | §5 approach 420 (distance-independent) × 1.60 |
| settle | 288 | §5 hit settle 180 × 1.60 |
| roar (rear-up) | 960 | §5 victory 600 × 1.60 (rear, toss, settle). This clip's tallest pose is already measured and kept in frame (`combatantPresentation`, `audits/BATTLE2_GUARDIAN_SIZE_20260924`). |
| collapse / dissolve | 832 | §5 faint 520 × 1.60 |
| phase hitstop | 140 | §5 hitstop cap |
| heavy-strike hitstop | 112 | §5 hitstop 70 × attacker mass 1.60 (≤ 140) |
| shake | 9.6 px for 180 ms | §5 shake 6 px × mass, decaying over 180 (the turn's own rule, `shakeOffset`) |
| flash | 2 white frames + 120 fade | §5 flash |
| caption in / hold / out | 220 / 1,100 / 160 | §7 panel open/close; hold = `BATTLE2_SWAP_BEAT_MS_V1`, so a boss caption reads as long as a §20 relay caption (700 under reduced motion, `BATTLE2_SWAP_BEAT_REDUCED_MS_V1`) |

A heavier input mass is still held at 2.0× base (rise 840 at m = 2.6), and the hitstop stays at its cap.

## 3. Entrance (before the relay beats and the first turn)

| ms | Beat | Picture | Cues |
|---|---|---|---|
| 0–220 | reveal | stage root alpha 0 → 1 (ease-out); the challenger already stands idle | `battle:battle-start` |
| 220–892 | rise | the frame-filling guardian rises from wholly below the frame (`riseFromDy = 1 − its painted top`, measured from the stage's own `bodies()`) into its stand, with a back-out overshoot on arrival (§2: "overshoot on arrival") | — |
| 892 | land | shake 9.6 px / 180 ms | `creature:land-thud` (guardian; impact slot), `battle:shake-rumble` |
| 892–1180 | settle | idle | — |
| 1180–2140 | roar | rear-up (`victory` clip) over the idle | `creature:call` (guardian) |
| 1180–2660 | name card | "Guardian · {name}" (or "Titan · {name}"): in 220, hold 1,100, out 160 | — |

Total 2,660 ms. Under reduced motion: no reveal, rise, shake or pose. The card shows at once for 220 + 700 + 160 = 1,080 ms.
Sound stays (`battle-start`, `call` at 0), as in a reduced-motion turn.

**Choice (reversible):** "rises" means rising up into the frame from below, in the foreground band where the guardian stands
(`GUARDIAN_STANDS.groundY 0.95`). A drop from above (ease-in, landing thud) is the obvious alternative: one sign and one ease in
`buildGuardianEntranceV1`. A walk-in was rejected because a horizontal stage displacement during a gait slides planted feet unless
it runs the A2 cadence solver, which no set piece should own.

## 4. Heavy strike (per turn, the guardian attacking)

Each staged turn where the guardian HITS carries `guardianStrike = { hitstopMs, shakeMass }` (`guardianStrikeV1`):

- **Ordinary hit before the phase change:** hitstop `hitstopMs(max(m, 1.6))` = 112; shake mass 1.60.
- **Critical, or any hit after the phase change:** hitstop at the cap, 140. The phased guardian hits 20% harder
  (`ENCOUNTER_GUARDIAN_PHASE_V1.dealt`), and the stage shows it as the heaviest beat the kit allows.

The turn's whole beat chain moves with `stop` exactly as it already does for mass (hitstopEnd, actionEnd, return, idle). The effect
schedule, the anatomy contact and the impact instant are untouched, so outcomes, numbers and cue beats stay aligned. Dodges and
misses have no hitstop and are left alone. A turn the guardian does not hit is the identical object (test check 3).

## 5. Phase change (at the existing ½-HP change)

**Where.** The engine (`encounter.ts`) changes phase the first time the defender is at or below `atFraction` (0.5) of its max HP
with both fighters still standing. The program finds the first transcript row that crosses ½ with both standing. That is the same
crossing the Chronicle's `guardian-phase` cue listens for, plus the engine's both-standing guard. The set piece plays right after
the last staged turn at or before that row; a burn/regen tick row has no turn of its own. In a §20 party fight, if the earlier
legs already took the guardian to ½ (`guardianDecisiveStartHpV1`, the same engine re-run as the relay beats), the phase piece
plays after the relay beats and before the decisive leg's first turn. A killing blow that crosses ½ is no phase change. Neither is
a fight with no `maxB` on its transcript; that case is labelled in `status().guardian.phase`.

| ms | Beat | Picture | Cues |
|---|---|---|---|
| 0–140 | hitstop | both idle clocks frozen; full-frame white flash 2 frames + 120 fade | `battle:hitstop-thump` (target = guardian side), `battle:flash-sting` |
| 140–1100 | roar | rear-up (`victory` clip); shake 9.6 px / 180 from 140 | `creature:call` (guardian), `battle:shake-rumble` |
| 140–1620 | caption | "⚡ {name} changes — its second phase" (220 / 1,100 / 160) | — |

Total 1,620 ms. Under reduced motion: caption only (0 + 220 + 700 + 160), with the thump and call at 0.

**Music sting.** The kit's vocabulary has no phase sting, and battle2 owns no music. The Chronicle path's guardian motif
(`packages/audio/src/combat-cues.ts`, motif `'phase'`) is the music owner. The stage rides `battle:flash-sting` and the roar. A
dedicated `music:guardian-phase` id would be a Sound Kit §4 change for Dakk (listed below).

## 6. Party relay consistency

The relay beats (`swap-beats.ts`) are unchanged and keep their caption node. Boss captions reuse the same node, the same
1,100 / 700 ms hold and the same centre position, so one caption cadence runs through the whole fight. Order on the stage:
**entrance → relay beats (one per earlier fighter) → [phase piece if it happened in an earlier leg] → decisive turns (phase piece
placed) → finale.** The stage rigs only the decisive fighter, so the entrance shows the challenger who will fight it out. Each
earlier fighter's exit is the relay caption, as before.

## 7. Finale

Taken from the decisive leg's last HP values:

- **Guardian falls** (`hpB ≤ 0`): **collapse** (the faint, 832 ms, only if the last staged turn did not already play it, with the
  idle fading out under it by the turn's own faint rule) → **dissolve** (alpha 1 → 0, sine-in-out, 832 ms) under
  "★ {name} is defeated". `battle:battle-end` at the end. The champion's victory and `victory-sting` already played on the
  last turn.
- **Guardian wins** (`hpA ≤ 0`): the guardian rears and roars (960). The fallen fighter holds its final faint pose and leaves
  (alpha out over its own faint duration, `scaleMs(520, its mass)`). Caption: "↻ {fighter} falls back to Recovery".
  Cues: `battle:defeat-sting`, `creature:call`, then `battle:battle-end`.
- **Cap / draw / withdraw:** no finale. The Chronicle states the result.

## 8. Tests (`battle2/guardian-choreo.test.ts`, 20 cases; one wiring case)

1. **Order and durations from the mass class.** The table above as data, checked for every piece (order, contiguity, durations, the
   hitstop cap, the end time). The cue beats are checked too. *Negative controls:* a piece timed at mass 1.00, a reordered piece and
   a 141 ms hitstop are all reported.
2. **Determinism.** The same inputs give byte-identical pieces, cue plans and samples, with zero `Math.random` / `Date.now` /
   `performance.now` reads. *Negative control:* another seed gives another fingerprint, so equality is not vacuous.
3. **Flag-off byte identity.** The flag is off by default. A 72-case turn matrix (mass × outcome × faint × reduced × rig, with a
   real card and the Wild effect) and a BattleStage's every node over two turns match fingerprints pinned from the pre-change code
   (anthropic/mac `d0059f822`). A non-guardian fight has no program, and every non-hit turn is the identical object. *Negative
   control:* the same matrices with the heavy strike applied no longer match.
4. **Outcomes and RNG untouched (a real Guardian settlement)**, through `planCombatPartySettlementV1` on the home-galaxy fixture
   world. Flag on vs off stages the same attacker, outcome, damage and faint on every turn, and the presentation does differ. The
   settlement object is unchanged, and a fresh plan of the same fight (rewards, XP, receipts) is identical. The engine's legs are
   identical before and after a program is built. *Negative controls:* a nudged damage and a dropped turn are reported.
5. **Phase placement agrees with the engine.** Engine phase Break ⇔ program phase beat, at the first crossing row, after its staged
   turn. Every guardian hit after it is at the cap, and none before it is. Synthetic rows cover a killing blow, a fallen fighter, a
   tick-row crossing, an earlier-leg crossing and a missing `maxB`. *Negative controls:* a removed beat and a beat moved one row
   later or to row 0 disagree.

Stage: the entrance on the real `BattleStage` rises from below into the stand, fades the root in and fires each cue once in order,
then resets the frame; the turn path resumes. Under reduced motion no rig is posed per tick and the camera never moves. Wiring:
flag on gives `entrance → turn 0 → phase → turn 1` on a guardian. Flag absent or false, or a non-guardian defender, gives
today's `turn 0 → turn 1`, with no caption node.

Mutation runs on the real code (each restored afterwards): titanic → medium mass (3 red), the program nudging damage (1 red), the
shake rule × 1.0000001 (3 red), a stricter phase crossing (1 red), the default flag flipped on (1 red).

## 9. For Dakk's eye (decisions; each one is a constant or a line)

1. **Make it the default?** Flip `GUARDIAN_CHOREO_DEFAULT` after a film. That needs a browser run; this batch ran none, by
   instruction.
2. **Rise from below, or drop from above?** One sign and one ease (§3).
3. **A phase music sting:** adding `music:guardian-phase` (and an entrance sting) is a Sound Kit §4 vocabulary change.
4. **Phase-active heavy strikes at the cap.** Every phased hit at 140 ms may feel slow over a long fight. The alternative is the
   cap on criticals only.
5. **Motion Kit §4/§5 text.** Once Dakk accepts this, add a "GUARDIAN set pieces" row to MOTION_KIT §4 (entrance, phase, fall,
   triumph) and the table in §2 above to §5, so the kit owns these numbers.

## 10. Not done here

- No native or browser film (instructed: no browsers). The first film should use the D2 bear (`audits/VISION_D2_GUARDIAN_20260921/fit-01`)
  through `tools/battle2-proof/native-runner.mjs` with `?guardianChoreo=1`. The proof entries do not pass the flag yet.
- The matchup picker (`battle2-matchup.ts`) does not pass the flag. Its fights are not settled Guardian encounters.
- The guardian's own landmark-aware rise (feet appearing last) would need the parts rig's per-joint data. The whole holder rises.
