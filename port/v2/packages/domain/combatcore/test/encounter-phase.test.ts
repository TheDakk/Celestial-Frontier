/* §20 Guardian phase (N1 §4.3 / S7): the telegraphed change at half health, in the pure encounter engine. */
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { runEncounterV1, type EncounterFighterV1, type EncounterPlanV1, type EncounterResultV1, type EncounterStanceV1 } from '@cf/domain-combatcore';

const fauna = (seed: number, t = 0.5) => makeGenome(seed, 'fauna', t) as unknown as EncounterFighterV1['genome'];
const fighter = (seed: number, stance: EncounterStanceV1 = 'balanced', t = 0.5): EncounterFighterV1 => ({ name: `F${seed}`, genome: fauna(seed, t), stance });
const finished = (r: EncounterResultV1) => { if (r.status !== 'finished') throw new Error('encounter paused'); return r; };
const phased = (plan: EncounterPlanV1): EncounterPlanV1 => ({ ...plan, defender: { ...plan.defender, phase: true } });
type Decision = 'hold' | 'swap' | 'withdraw';

describe('§20 Guardian phase: the telegraphed change at half health', () => {
  it('a phase Break is announced when the defender first reaches half health, BEFORE the change; the fight is identical up to it', () => {
    let checked = 0;
    for (let i = 0; i < 400 && checked < 25; i++) {
      const base: EncounterPlanV1 = { mode: 'auto', defender: { name: 'G', genome: fauna(70_000 + i, 0.8) },
        party: [fighter(1_000 + i, 'balanced', 0.6), fighter(2_000 + i, 'balanced', 0.6)] };
      const plain = finished(runEncounterV1(base)), withPhase = finished(runEncounterV1(phased(base)));
      expect(plain.breaks.some((b) => b.break.kind === 'phase'), 'no phase without the flag (the parity path)').toBe(false);
      const phaseBreaks = withPhase.breaks.filter((b) => b.break.kind === 'phase');
      expect(phaseBreaks.length).toBeLessThanOrEqual(1);
      if (phaseBreaks.length === 0) continue;
      const b = phaseBreaks[0]!.break;
      expect(b.defenderHp).toBeLessThanOrEqual(b.defenderMax * 0.5);
      expect(b.defenderHp).toBeGreaterThan(0);
      expect(phaseBreaks[0]!.decision, 'Auto holds at the phase Break (Swap is never necessary)').toBe('hold');
      const leg = withPhase.legs.find((l) => l.fighterIndex === b.fighterIndex)!;
      const plainLeg = plain.legs.find((l) => l.fighterIndex === b.fighterIndex)!;
      const cut = leg.log.findIndex((row) => row.hpB === b.defenderHp);
      expect(cut).toBeGreaterThanOrEqual(0);
      expect(leg.log.slice(0, cut + 1)).toEqual(plainLeg.log.slice(0, cut + 1));
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('after the Break the defender changes: its strikes deal more (never less) than the same rows without the phase', () => {
    let harder = 0;
    for (let i = 0; i < 400; i++) {
      const base: EncounterPlanV1 = { mode: 'auto', defender: { name: 'G', genome: fauna(80_000 + i, 0.8) }, party: [fighter(3_000 + i, 'balanced', 0.6)] };
      const plain = finished(runEncounterV1(base)), withPhase = finished(runEncounterV1(phased(base)));
      const pb = withPhase.breaks.find((x) => x.break.kind === 'phase');
      if (!pb) continue;
      const cut = withPhase.legs[0]!.log.findIndex((row) => row.hpB === pb.break.defenderHp);
      const next = (log: readonly Record<string, unknown>[]) => log.slice(cut + 1).find((row) => row.side === 'B' && typeof row.dmg === 'number');
      const after = next(withPhase.legs[0]!.log), plainAfter = next(plain.legs[0]!.log);
      if (!after || !plainAfter || after.crit || plainAfter.crit) continue;
      expect(after.dmg as number).toBeGreaterThanOrEqual(plainAfter.dmg as number);
      if ((after.dmg as number) > (plainAfter.dmg as number)) harder++;
    }
    expect(harder, 'the phase must actually change the defender').toBeGreaterThan(5);
  });

  it('COMMAND pauses at the phase Break; Swap sends the next fighter in; a reload lands on the same Break', () => {
    for (let i = 0; i < 400; i++) {
      const plan = phased({ mode: 'command', defender: { name: 'G', genome: fauna(90_000 + i, 0.8) },
        party: [fighter(4_000 + i, 'balanced', 0.7), fighter(5_000 + i, 'balanced', 0.7)] });
      const d: Decision[] = [];
      let r = runEncounterV1(plan);
      while (r.status === 'paused' && r.pendingBreak.kind !== 'phase') { d.push('hold'); r = runEncounterV1(plan, d); }
      if (r.status !== 'paused' || !r.pendingBreak.options.includes('swap')) continue;
      expect(runEncounterV1(plan, d)).toEqual(r);
      const d2: Decision[] = [...d, 'swap'];
      let s = runEncounterV1(plan, d2);
      while (s.status === 'paused') { d2.push('hold'); s = runEncounterV1(plan, d2); }
      expect(s.fighters[r.pendingBreak.fighterIndex]).toMatchObject({ swappedOut: true });
      return;
    }
    throw new Error('no phase Break with a Swap option');
  });
});
