# S2b — settling a Guardian party fight in one receipt (design, Claude, 2026-09-25)

Decision: `port/DECISIONS.md` §20. Engine: `packages/domain/combatcore/src/encounter.ts` (`runEncounterV1`, parity-locked to `runDuel`).
This note fixes how a party fight becomes ONE F4 receipt, without disturbing the single-champion settlement that every current test,
verifier, Chronicle, audio cue and battle2 scene reads.

## 1. One-member parties change nothing

A party of one is today's fight. The planner produces the exact existing `CombatSettlementPlanV1`, with no new fields, the same witness
and the same receipt. The parity law of the engine makes that provable: `runEncounterV1` with one Balanced Auto fighter equals `runDuel`.

## 2. A multi-member plan = the decisive leg + a `party` block

- `champion`, `transcript`, `outcome`, `xp` and `injury` describe the **decisive leg**: the leg that ended the fight (the winner's leg on a
  win, or the last fighter's leg on a loss). Everything that reads a plan today keeps working, and it shows the decisive leg.
- A new optional `party` block carries the rest, and it is part of the witness:
  `{ schema: 'cf-v2-combat-party/v1', mode, stances[], decisions[], encounterFingerprint, members[] }`. Each member has
  `{ index, champion, legEnd: 'fighter-fell'|'swapped'|'cap'|'not-fought'|'decisive', injury }`.
- The member injury follows §20:
  - a fighter that fell, was swapped out or yielded at the cap enters `set-recovery` (no wound);
  - a fighter that never fought is `none`;
  - the explorer never gets Recovery. The explorer takes today's `damage-player` rule only when it is the decisive loser, and otherwise
    `none` (it left the stage).
- **Verification.** The planner re-runs `runEncounterV1(plan, decisions)` and requires a `finished` result. The supplied decisive leg
  must equal the engine's leg field for field; this replaces `buildTranscript`'s `runDuel` re-run when `party` is present.
- **Rewards.** Conquest, Guardian capture, Prime claim and Stardust are unchanged (they depend only on the outcome).
- **XP.** The decisive champion gets today's XP. The other members get **none** until Codex's S4 sets the split (a placeholder, stated
  on the card).

## 3. Writers apply the party's Recovery on the right carrier, in the same CAS

A party can mix owned fauna (Arc 5 ownership), captured Guardians (the Guardian companion overlay) and the explorer. The persistence
derive already writes the decisive champion on its carrier. It then applies each non-decisive member's `set-recovery`:
- owned fauna onto the same ownership successor, or a fresh one if the decisive champion was not on that carrier;
- captured Guardians onto the overlay successor.

Each member must be available (no unfinished Recovery) at the committed snapshot's active-play clock, which is the rule the persistence
owner already enforces for the champion. One member id may appear only once.

## 4. Command decisions and the open fight

Slice 1 settles **Auto** only: the whole fight resolves before the commit, so there is no open state.

Command (slice 2) keeps the fight a pure function of (plan, decisions):
- The plan is sealed and committed as an **open-encounter record** in its own receipt (Recovery-free), and every decision appends
  through CAS.
- The final settlement consumes the record.
- A reload re-simulates to the pending Break. Closing the tab cannot escape: the open record blocks the party's other actions until it
  is answered (`Withdraw` is always offered).

## 5. Order of work

1. The planner: `party` input → verification through `runEncounterV1` → the `party` block. Unit tests include "one member == today"
   byte-equality.
2. Persistence: apply member Recovery on both carriers. Tests: a mixed party (owned + Guardian); a member already in Recovery refuses;
   one-member parity.
3. App: the Guardian card party picker (up to 3, Guardians/Titans only), stances, Auto/Command switch, forecast "Auto vs your plan";
   the Chronicle shows every leg; battle2 swap beats.
4. The Command open-encounter record (slice 2), then Codex's S4 instrument, then Nick's six-scenario playtest.
