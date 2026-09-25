# §20 step 4 — Command, friendly duels, Guardian phase (Claude, 2026-09-25)

Decision: `port/DECISIONS.md` §20. Design: `audits/COMBAT_S2_PARTY_20260925/DESIGN.md` §4, `audits/PROPOSALS_20260925/N1_COMBAT_MODEL.md` §4–5.
Reference: `COMBAT_AND_CONQUEST.md` §0 (the Command, friendly duel and phase blocks).

## What landed (signed commits on the fork branch, on top of anthropic/mac d1dbb979)

| Step | Commit | What |
|---|---|---|
| 4a | `dea20680` | **Open-encounter record** (`packages/persistence/src/combat-open-encounter.ts`, carrier `player/combat.open-encounter`): seal in its own Recovery-free receipt; each Break answer appended by CAS on the revision AND the decision count; the settlement consumes it in one receipt; reload re-simulates to the same Break; while open no other fight settles and Breed refuses a held parent; forged/foreign carriers read PROTECTED; Withdraw settles as a fight not won; the explorer fights Guardians in Auto only. |
| 4b | `19e6c84b` | **Break UI**: Play Auto/Command picker (Guardians/Titans), the Break panel (Hold / Swap / Continue / Withdraw / Settle) from the durable record, the finishing answer rides the ordinary settlement; **battle2 relay beats** (`battle2/swap-beats.ts`). |
| 4c | `b7955fcc` | **Friendly duels** (v1.8.9 parity): CFB- paste on a Compendium companion; +8 XP counted win, 2/3 participation XP; 30 s windows on the ACTIVE-PLAY clock; `player/combat.friendly-duels` ledger. |
| 4d | (this commit) | **Guardian phase change** at half health, announced at a phase Break before it applies (+20% dealt / −10% taken, one constant `ENCOUNTER_GUARDIAN_PHASE_V1`); sealed in the open record. Also fixes a 4b regression: the Command runner now schedules Arc 9 progression catch-up (arc9-main-wiring law). |

Tests (outcome, not code path; each new check negative-controlled): `packages/persistence/test/combat-open-encounter.test.ts` (8),
`tests/a5-command-break-outcome.test.ts` (5, 3 Main mutants), `tests/a5-friendly-duel-outcome.test.ts` (5, 2 Main mutants),
`packages/domain/combatcore/test/encounter-phase.test.ts` (3 + a mutation run), `apps/game/src/battle2/swap-beats.test.ts` (2),
the battle2 relay-beat stage test, the breed held-parent refusal. Gate: develop profile 5,273 pass, sole red I5; both typechecks clean.

## Decisions made here (reversible, one line each)
- **Withdraw** settles as a fight not won (draw at a low-HP/phase Break, the defender's leg after a fall); Auto never withdraws.
- **Explorer in Command:** refused (its HP binding would strand the record); the explorer fights Guardians in Auto.
- **Phase numbers:** +20% dealt, −10% taken at ≤50% HP — placeholders in one constant for S4.
- **Phase + parity:** a lone Balanced Auto fighter keeps the verbatim `runDuel` path, so it never meets the phase; any stance, party or
  Command meets it. The card says so. Nick may prefer the phase everywhere (that would break the byte-identical v1 parity law).
- **Friendly duel windows:** v1's 30 s wall clock → 30 s of active play (the clock law). CFB **export** (sharing your code) is not ported.

## Asks for Codex (S4 instrument inputs)
- Tune `ENCOUNTER_STANCE_TUNING_V1`, `ENCOUNTER_GUARDIAN_PHASE_V1` and `COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1` with the decision matrix;
  include the phase Break (kind `'phase'`) and Withdraw in the Command-vs-Auto edge bound (Command's best answer ≤ a small edge).
- Member XP split for party fights (still none for non-decisive members).
- Review the open-encounter record + friendly-duel ledger as persistence carriers (both player-segment, v1 schema, replace-never-delete).
