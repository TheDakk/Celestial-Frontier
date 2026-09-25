/* §20 order item 2 / D16: the v1.8.9 FRIENDLY DUEL, ported (Nick 2026-09-25: "then v1's friendly duel (+8 XP)").

   v1.8.9 (`fightNow`, no `onResolve`): your creature fights a challenger pasted as a `CFB-` code. The fight is free sport — nothing is
   lost, nobody is wounded. The ledger: every duel counts (`stats.duels`); a WIN pays `stats.duelwins` + 8 XP to your creature; a loss or
   draw pays PARTICIPATION XP — 3 when the challenger was taken below 25% ("a fight taken to the wire"), else 2 ("a bout survived").
   Each credit rides its own anti-farm window (a win never eats the participation window and vice versa; v1's round 8/A-B catches).

   v2 changes exactly one thing, by law: v1's windows were 30 s of WALL CLOCK (`Date.now`). v2 never lets the device clock pay, so the
   windows are 30 s of the persisted ACTIVE-PLAY clock (the persistence owner applies them at the committed clock). This module is the
   pure fight: decode the challenger (v1's own decoder: untrusted genomes are normalised, injuries and levels never travel, a champion
   code is exhibit-only) and run v1's `runDuel`. */
import { decodeCreature, runDuel, type DuelResult } from './combatcore.verbatim.js';
import type { Genome } from '@cf/domain-genome';

export const FRIENDLY_DUEL_SCHEMA_V1 = 'cf-v2-friendly-duel/v1' as const;
/** v1.8.9 class XP for a duel win. */
export const FRIENDLY_DUEL_WIN_XP_V1 = 8;
/** v1.8.9 participation XP: a loss/draw that took the challenger below 25% health, and any other loss/draw. */
export const FRIENDLY_DUEL_CLOSE_XP_V1 = 3;
export const FRIENDLY_DUEL_BOUT_XP_V1 = 2;
export const FRIENDLY_DUEL_CLOSE_FRACTION_V1 = 0.25;
/** v1.8.9's 30 s anti-farm window, measured on the ACTIVE-PLAY clock in v2 (never the device clock). */
export const FRIENDLY_DUEL_CREDIT_WINDOW_ACTIVE_MS_V1 = 30_000;
const CODE_MAX = 8_192;

export interface FriendlyDuelCompanionV1 {
  readonly creatureId: string;
  readonly name: string;
  /** The companion's exact stored genome including its own xp/hurt (xp feeds its class level, as in v1). */
  readonly genome: Readonly<Genome>;
}

export interface FriendlyDuelPlanV1 {
  readonly schema: typeof FRIENDLY_DUEL_SCHEMA_V1;
  readonly mine: FriendlyDuelCompanionV1;
  readonly challenger: Readonly<{ name: string; genome: Readonly<Record<string, unknown>>; exhibit: boolean }>;
  readonly code: string;
  readonly transcript: DuelResult;
  readonly winner: 'A' | 'B' | null;
  /** Loss/draw only: the challenger ended below 25% of its health. */
  readonly close: boolean;
}

export type FriendlyDuelPlanningOutcomeV1 =
  | FriendlyDuelPlanV1
  | Readonly<{ status: 'refused'; reason: 'code-invalid' | 'companion-invalid' }>;

/** Plan one friendly duel: decode the challenger code exactly as v1 did and run v1's duel. Pure and deterministic. */
export function planFriendlyDuelV1(input: Readonly<{ mine: FriendlyDuelCompanionV1; code: string }>): FriendlyDuelPlanningOutcomeV1 {
  const mine = input?.mine;
  if (!mine || typeof mine.creatureId !== 'string' || mine.creatureId.length < 1 || typeof mine.name !== 'string'
    || !mine.genome || typeof mine.genome !== 'object' || !Number.isSafeInteger(mine.genome.seed) || mine.genome.kingdom !== 'fauna') {
    return Object.freeze({ status: 'refused', reason: 'companion-invalid' });
  }
  const code = typeof input.code === 'string' ? input.code.trim() : '';
  if (code.length < 5 || code.length > CODE_MAX) return Object.freeze({ status: 'refused', reason: 'code-invalid' });
  const decoded = decodeCreature(code);
  if (decoded === null || !decoded.genome || typeof decoded.genome !== 'object') {
    return Object.freeze({ status: 'refused', reason: 'code-invalid' });
  }
  const challenger = Object.freeze({
    name: typeof decoded.name === 'string' && decoded.name.length > 0 ? decoded.name : 'Challenger',
    genome: Object.freeze({ ...(decoded.genome as Record<string, unknown>) }),
    exhibit: decoded.exhibit === true,
  });
  const transcript = runDuel({ name: mine.name, genome: mine.genome as Genome }, { name: challenger.name, genome: challenger.genome as never });
  const winner = transcript.winner === 'A' ? 'A' : transcript.winner === 'B' ? 'B' : null;
  const hpB = Number(transcript.hpB), maxB = Math.max(1, Number(transcript.maxB));
  return Object.freeze({
    schema: FRIENDLY_DUEL_SCHEMA_V1, mine, challenger, code, transcript, winner,
    close: winner !== 'A' && hpB / maxB < FRIENDLY_DUEL_CLOSE_FRACTION_V1,
  });
}

/** v1.8.9's ledger for one duel at an active-play instant, given the last credited instants (null = never). */
export function friendlyDuelCreditV1(input: Readonly<{
  winner: 'A' | 'B' | null;
  close: boolean;
  activePlayMs: number;
  lastWinCreditAt: number | null;
  lastParticipationAt: number | null;
}>): Readonly<{ kind: 'win' | 'win-cooldown' | 'participation' | 'participation-cooldown'; xp: number; duelWin: boolean;
    cooldownRemainingMs: number }> {
  const open = (last: number | null): boolean => last === null || input.activePlayMs - last > FRIENDLY_DUEL_CREDIT_WINDOW_ACTIVE_MS_V1;
  const remaining = (last: number | null): number => (last === null ? 0
    : Math.max(0, FRIENDLY_DUEL_CREDIT_WINDOW_ACTIVE_MS_V1 - (input.activePlayMs - last)));
  if (input.winner === 'A') {
    return open(input.lastWinCreditAt)
      ? Object.freeze({ kind: 'win', xp: FRIENDLY_DUEL_WIN_XP_V1, duelWin: true, cooldownRemainingMs: 0 })
      : Object.freeze({ kind: 'win-cooldown', xp: 0, duelWin: false, cooldownRemainingMs: remaining(input.lastWinCreditAt) });
  }
  return open(input.lastParticipationAt)
    ? Object.freeze({ kind: 'participation', xp: input.close ? FRIENDLY_DUEL_CLOSE_XP_V1 : FRIENDLY_DUEL_BOUT_XP_V1, duelWin: false, cooldownRemainingMs: 0 })
    : Object.freeze({ kind: 'participation-cooldown', xp: 0, duelWin: false, cooldownRemainingMs: remaining(input.lastParticipationAt) });
}
