/** @module battle2/swap-beats [domain] — §20 relay beats for the painted stage (2026-09-25).
 *
 * A Guardian party fight settles as its DECISIVE leg (the one the stage plays turn by turn); every earlier fighter left the stage
 * first — swapped out, fell, or was worn out at the cap. Before the decisive leg starts, the stage plays one captioned beat per
 * earlier leg (in order), re-derived from the settled plan's own party + decisions by the pure encounter engine, exactly as the
 * Chronicle prelude does, so the stage, the Chronicle and the durable receipt tell the same story. The Chronicle is not paced by
 * these beats (its prelude rows are unpaced intro rows); only the decisive leg's turns release rows at their impacts.
 * Pure and deterministic: no clock, no randomness, no pixi. */
import { encounterHasGuardianPhaseV1, runEncounterV1, type CombatSettlementPlanV1 } from '@cf/domain-combatcore';

/** How long each relay beat holds before the next (or before the decisive leg starts). Reduced motion shortens it. */
export const BATTLE2_SWAP_BEAT_MS_V1 = 1_100;
export const BATTLE2_SWAP_BEAT_REDUCED_MS_V1 = 700;

export interface Battle2SwapBeatV1 {
  readonly fighterName: string;
  readonly how: 'swapped' | 'fell' | 'worn';
  readonly nextName: string | null;
  /** The Guardian's health left after this leg, 0–100. */
  readonly defenderPercent: number;
  readonly text: string;
}

export function battle2SwapBeatsV1(
  party: CombatSettlementPlanV1['party'] | undefined,
  defender: Readonly<{ name: string; battleGenome: Readonly<Record<string, unknown>>; kind?: string | undefined }>,
): readonly Battle2SwapBeatV1[] {
  if (party === undefined || party.members.length < 2) return Object.freeze([]);
  const result = runEncounterV1({
    mode: party.mode,
    defender: { name: defender.name, genome: defender.battleGenome as never, phase: encounterHasGuardianPhaseV1(defender.kind) },
    party: party.members.map((member) => (member.champion.kind === 'player'
      ? { name: member.champion.name, genome: { seed: member.champion.genomeSeed }, stats: member.champion.stats as never, stance: member.stance }
      : { name: member.champion.name, genome: member.champion.genome as never, stance: member.stance })),
  }, party.decisions);
  if (result.status !== 'finished') throw new TypeError('battle2 swap beats: the registered party settlement does not resolve');
  const earlier = result.legs.filter((leg) => leg.fighterIndex !== party.decisiveIndex);
  return Object.freeze(earlier.map((leg, order) => {
    const fighterName = party.members[leg.fighterIndex]!.champion.name;
    const next = order + 1 < earlier.length ? earlier[order + 1]! : result.legs[result.legs.length - 1]!;
    const nextName = party.members[next.fighterIndex]?.champion.name ?? null;
    const how: Battle2SwapBeatV1['how'] = leg.end === 'swapped' ? 'swapped' : leg.end === 'fighter-fell' ? 'fell' : 'worn';
    const defenderPercent = Math.max(0, Math.round((leg.hpB / Math.max(1, leg.maxB)) * 100));
    const verb = how === 'swapped' ? 'steps back' : how === 'fell' ? 'falls' : 'is worn out';
    const text = `↻ ${fighterName} ${verb} — ${defender.name} ${defenderPercent}%${nextName === null ? '' : ` · ${nextName} steps in`}`;
    return Object.freeze({ fighterName, how, nextName, defenderPercent, text });
  }));
}
