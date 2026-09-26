# D13 stage 2: companion missions (Claude, 2026-09-26)

Nick decided D13 ("yes"). This batch is N3 stages **2b** (carrier and transactions) and **2c** (the board), which are Claude's.
Branch `claude/n3-missions`, cut from `anthropic/mac` `832dc18b`. Every commit is signed G.

## What landed
| Stage | What | Owner files |
|---|---|---|
| 2b | The pure domain: mission types, lengths, the sealed outcome, and the dispatch / claim / recall ownership successors. The carrier `player/arc5.missions` v1. The three transactions. | `packages/domain/acquisition/src/companion-missions.ts`, `packages/persistence/src/arc5-missions.ts`, `apps/game/src/arc5-mission-action.ts` |
| 2c | The mission board beside Care & bond in the Compendium detail, iPhone first with 44 px targets. It has the slots, Away/Ready badges and the disclosure before dispatch. Recall takes two taps. The return reveal is the `role=status` text counterpart, and the mission Chronicle shows the latest returns. Main's `runCompanionMission` owns the transactions and publication. | `apps/game/src/mission-board.ts`, `apps/game/src/main.ts` (one block before `let lastArc6CommandOutcome`, outside every test slice) |

**The rules (also in `BREEDING_AND_SHARING.md`):**
- **Shape:** one companion per mission, two field slots, and any landed world as the target.
- **Types:** Prospect brings the world's canonical deposits; Survey brings Stardust and a lore line, never a species.
- **Durations:** 10 / 25 / 60 active-play minutes, with Long needing a Trusted bond. The wound chance is disclosed before dispatch and Devoted halves it. A wound is never Critical, and it halves Prospect materials.
- **Dispatch:** three `companion-mission` SessionRNG draws seal the result.
- **Claim:** happens only at the active-play boundary and pays exactly the sealed result. That includes XP on the ownership row AND on the Compendium mirror row, the bond firsts, and a memento on the first Long return from a world.
- **Full hold:** the claim is refused and the mission stays ready. **Recall:** the companion comes home with nothing.

**Calls I made (reversible):**
- **Mission ID:** `mission:<receiptOrdinal>`. `rest:` stays reserved.
- **Injured companions stay home:** a companion at Injured or worse (hurt ≥ 0.3) must Rest before a field mission.
- **Wound bands:** the heavier band (Injured, Long only) is the lower half of the wound roll.
- **Materials split:** Prospect materials go ⅔ to a drawn deposit and ⅓ to the next.
- **Claim-time results:** the memento and the bond memories are decided at claim, because they depend on history, not chance.

## The placeholder rate table for Codex's stage 2a (`MISSION_RATES_V1`)
| Length | Active minutes | Prospect materials | Survey Stardust | XP | Wound chance | Wound bands | Bond needed |
|---|---|---|---|---|---|---|---|
| Short | 10 | 3 | 0 | +2 | 0% | — | 0 |
| Standard | 25 | 8 | 1 | +4 | 10% | Bruised 0.15 | 0 |
| Long | 60 | 18 | 3 | +8 | 20% | Bruised 0.15 / Injured 0.35 | 2 (Trusted) |

- **Other fixed values:** 2 field slots. Devoted (bond 3) halves the wound chance. A companion can dispatch only below hurt 0.3.
- **Ceiling:** `companionMissionHourlyCeilingV1()` gives 36 materials and 6 Stardust per active hour, which equals the proposal ceiling. A test pins it.
- **Codex:** replace the table (one place) with the 2a rates and prove the ≤ 15% economy share. Then build the 2d instruments, which should keep the double-claim, two-tab, reload, full-hold and clock checks already present in the tests.

## Tests
- `tests/arc5-missions-action.test.ts` (7). Real F4 runtime plus memory backend, with durable read-back:
  - the rate ceiling;
  - the sealed result as a pure function of the draws (wound halves materials; Devoted halves the chance);
  - dispatch seals and locks, and a reboot cannot reroll;
  - with the device clock ±1 day, the claim still refuses before the boundary;
  - at the boundary the claim pays exactly the sealed result, once;
  - double claim, and a stale second tab, both refused;
  - a full hold keeps the mission ready and loses nothing;
  - recall pays nothing;
  - two slots (a third mission is refused);
  - a Survey pays its Stardust and lore;
  - controls: a corrupt carrier is protected, a stale ownership refused.
- `tests/a5-missions-outcome.test.ts` (6). It slices the shipped Main block over a real runtime and presses the real board with the device clock a day ahead:
  - the disclosure;
  - Send pressed twice commits one dispatch;
  - Away turns to Ready on play;
  - Claim pressed twice pays once;
  - the live save equals the durable one;
  - the reveal and the Chronicle;
  - Recall arms on the first tap, pays nothing on the second.
  - Four Main mutants fail it (unwired Claim, unpublished hold, unpublished mirror XP, no reveal), plus a guard that every mutation needle exists.
- A bug found by the UI test: the board's refusal used `offer?.refusal ?? 'input-invalid'`, which turned every *allowed* offer (refusal `null`) into a refusal. It is fixed.

## Not done here
- **The D15 audio return expression.** The return reveal ships its text counterpart (`role=status`, `aria-live`). Playing the creature's voice on return needs a new `mission-returned` expression kind in the audio owner (`tame-greeting-audio.ts`), with the same claim / counterpart / replay-fence machinery as `feed-completed`. `audio-production-plan.ts` already maps `'mission-returned' → 'alert'`. That is a bounded follow-up.
- **The Kindred sidegrade** ("preferred mission type, +1 material there") needs a preferred-type choice UI. It is not built, so bond 4 unlocks nothing mission-specific yet.

## Proposed player-visible bullets (Codex's sealed inventory — for the batched re-measure, not edited here)
- **New Features & Systems:** "🧭 COMPANION MISSIONS — send a companion to a world you've landed on: Prospect brings back that world's materials, Survey brings a little Stardust and a story. 10, 25 or 60 minutes of play; the risk is shown before it leaves, and you can recall it any time. Two at once."
- **Gameplay:** "A returning companion earns XP and bond memories; its first long mission to a world leaves a memento."

## Asks for Codex
1. **Stage 2a:** the rate table and the ≤ 15% economy-share instrument. Replace `MISSION_RATES_V1` only.
2. **Stage 2d:** extend the instruments. The mission carrier and receipts are `arc5-companion-mission-{dispatch,claim,recall}`.
3. **Optional:** review the carrier's strict read. The derives re-read the carrier and ownership inside the transaction.

## Open questions (for Nick)
- Should an Injured companion be allowed on a Short (0% wound) mission, or keep "Rest first" for every length?
