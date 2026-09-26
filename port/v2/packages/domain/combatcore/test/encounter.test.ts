import { describe, expect, it } from 'vitest';
import { canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { makeGenome } from '@cf/domain-genome';
import {
  autoEncounterDecisionV1, battleStats, runDuel, runEncounterV1,
  type EncounterFighterV1, type EncounterPlanV1, type EncounterResultV1, type EncounterStanceV1,
} from '@cf/domain-combatcore';

const fauna = (seed: number, t = 0.5) => makeGenome(seed, 'fauna', t) as unknown as EncounterFighterV1['genome'];
const fighter = (seed: number, stance: EncounterStanceV1 = 'balanced', t = 0.5): EncounterFighterV1 => ({ name: `F${seed}`, genome: fauna(seed, t), stance });
const duelView = (leg: Extract<EncounterResultV1, { status: 'finished' }>['legs'][number]) =>
  ({ A: leg.A, B: leg.B, log: leg.log, winner: leg.winner, hpA: leg.hpA, hpB: leg.hpB, maxA: leg.maxA, maxB: leg.maxB, turnA0: leg.turnA0 });
const finished = (r: EncounterResultV1) => { if (r.status !== 'finished') throw new Error('encounter paused'); return r; };

describe('the v2 encounter resolver (port/DECISIONS.md §20, N1 S1)', () => {
  it('PARITY: one fighter + Balanced + Auto reproduces runDuel byte for byte — the golden probe', () => {
    const a = { name: 'A', genome: makeGenome(1234, 'fauna', 0.5), stats: battleStats(makeGenome(1234, 'fauna', 0.5)) };
    const b = { name: 'B', genome: makeGenome(5678, 'fauna', 0.2), stats: battleStats(makeGenome(5678, 'fauna', 0.2)) };
    const r = finished(runEncounterV1({ mode: 'auto', defender: b as never, party: [{ ...a, stance: 'balanced' } as never] }));
    expect(canon(duelView(r.legs[0]!))).toBe(probeRaw('runDuel'));
  });

  it('PARITY over 400 real pairs (both tiers, every ability family that appears): winner, HP and the whole log', () => {
    let draws = 0, decided = 0;
    for (let i = 0; i < 400; i++) {
      const mine = { name: 'M', genome: fauna(1000 + i * 7, 0.2 + (i % 5) * 0.15) }, theirs = { name: 'T', genome: fauna(90_000 + i * 13, 0.3 + (i % 3) * 0.2) };
      const v1 = runDuel(mine as never, theirs as never) as Record<string, unknown>;
      const r = finished(runEncounterV1({ mode: 'auto', defender: theirs, party: [{ ...mine, stance: 'balanced' }] }));
      expect(canon(duelView(r.legs[0]!)), `pair ${i}`).toBe(canon(v1));
      expect(r.outcome).toBe(v1.winner === 'A' ? 'party' : v1.winner === 'B' ? 'defender' : 'draw');
      if (v1.winner === null) draws++; else decided++;
    }
    expect(decided).toBeGreaterThan(300); expect(draws).toBeLessThan(100);
  });

  it('NEGATIVE CONTROL: a non-Balanced stance changes the fight (parity is not vacuous)', () => {
    let changed = 0;
    for (let i = 0; i < 60; i++) {
      const mine = { name: 'M', genome: fauna(2000 + i) }, theirs = { name: 'T', genome: fauna(80_000 + i) };
      const v1 = canon(runDuel(mine as never, theirs as never));
      for (const stance of ['press', 'guard', 'evade'] as const) {
        const r = finished(runEncounterV1({ mode: 'auto', defender: theirs, party: [{ ...mine, stance }] }));
        if (canon(duelView(r.legs[0]!)) !== v1) changed++;
      }
    }
    expect(changed).toBeGreaterThan(150);
  });

  it('RELAY: every leg starts from the defender HP the previous leg left; a fallen fighter is followed by the next', () => {
    let multi = 0;
    for (let i = 0; i < 200; i++) {
      const defender = { name: 'Guardian', genome: fauna(70_000 + i, 0.95) };
      const r = finished(runEncounterV1({ mode: 'auto', defender, party: [fighter(10 + i, 'balanced', 0.1), fighter(500 + i, 'balanced', 0.1)] }));
      expect(r.legs[0]!.hpBStart).toBe(r.defenderMax);
      for (let leg = 1; leg < r.legs.length; leg++) {
        expect(r.legs[leg]!.hpBStart).toBe(r.legs[leg - 1]!.hpB);
        expect(r.legs[leg]!.hpBStart).toBeLessThanOrEqual(r.defenderMax);   // a regenerating defender may be back to full
        multi++;
      }
    }
    expect(multi).toBeGreaterThan(20);
  });

  it('a party beats a Guardian more often than its first fighter alone (the relay is worth building)', () => {
    let alone = 0, party = 0;
    for (let i = 0; i < 150; i++) {
      const defender = { name: 'G', genome: fauna(60_000 + i, 0.9) };
      const a = fighter(3000 + i, 'balanced', 0.4), b = fighter(4000 + i, 'balanced', 0.4), c = fighter(5000 + i, 'balanced', 0.4);
      if (finished(runEncounterV1({ mode: 'auto', defender, party: [a] })).outcome === 'party') alone++;
      if (finished(runEncounterV1({ mode: 'auto', defender, party: [a, b, c] })).outcome === 'party') party++;
    }
    expect(party).toBeGreaterThan(alone);
  });

  it('COMMAND pauses at each Break and resumes deterministically from the decision list; Auto answers them itself', () => {
    for (let i = 0; i < 300; i++) {
      const plan: EncounterPlanV1 = { mode: 'command', defender: { name: 'G', genome: fauna(50_000 + i, 0.9) }, party: [fighter(700 + i, 'guard', 0.3), fighter(800 + i, 'press', 0.3)] };
      const first = runEncounterV1(plan);
      if (first.status !== 'paused') continue;
      expect(first.pendingBreak.ordinal).toBe(0);
      expect(runEncounterV1(plan)).toEqual(first);   // a reload re-simulates to the same Break
      const decision = first.pendingBreak.options.includes('swap') ? 'swap' : 'hold';
      const next = runEncounterV1(plan, [decision]);
      expect(next.breaks[0]).toMatchObject({ decision, by: 'player' });
      // walk to the end holding every later Break
      const decisions: ('hold' | 'swap' | 'withdraw')[] = [decision];
      let r = next; while (r.status === 'paused') { decisions.push('hold'); r = runEncounterV1(plan, decisions); }
      expect(r.status).toBe('finished');
      expect(runEncounterV1(plan, decisions)).toEqual(r);   // the same plan + decisions give the same fight
      expect(() => runEncounterV1(plan, [...decisions.slice(0, 0), 'bogus' as never])).toThrow(RangeError);
      const auto = finished(runEncounterV1({ ...plan, mode: 'auto' }));
      expect(auto.breaks.every((b) => b.by === 'auto' && b.decision !== 'withdraw')).toBe(true);
      return;
    }
    throw new Error('no fixture reached a Break');
  });

  it('WITHDRAW ends the fight with no winner; SWAP brings the next fighter in at once and the swapped fighter keeps its HP', () => {
    for (let i = 0; i < 300; i++) {
      const plan: EncounterPlanV1 = { mode: 'command', defender: { name: 'G', genome: fauna(40_000 + i, 0.9) }, party: [fighter(900 + i, 'balanced', 0.3), fighter(950 + i, 'balanced', 0.3)] };
      const first = runEncounterV1(plan);
      if (first.status !== 'paused' || first.pendingBreak.kind !== 'low-hp') continue;
      const out = finished(runEncounterV1(plan, ['withdraw']));
      expect(out.outcome).toBe('withdrawn');
      let swapped = runEncounterV1(plan, ['swap']); const d: ('hold' | 'swap' | 'withdraw')[] = ['swap'];
      while (swapped.status === 'paused') { d.push('hold'); swapped = runEncounterV1(plan, d); }
      expect(swapped.fighters[0]).toMatchObject({ swappedOut: true, fell: false, hpEnd: first.pendingBreak.fighterHp });
      expect(swapped.legs[1]!.fighterIndex).toBe(1);
      return;
    }
    throw new Error('no fixture reached a low-HP Break');
  });

  it('the Auto policy: swap only when a teammate waits and the defender is doing at least as well; never withdraw', () => {
    const base = { ordinal: 0, kind: 'low-hp' as const, fighterIndex: 0, fighterMax: 90, defenderMax: 300, options: ['hold', 'swap', 'withdraw'] as const };
    expect(autoEncounterDecisionV1({ ...base, nextIndex: 1, fighterHp: 30, defenderHp: 200 })).toBe('swap');
    expect(autoEncounterDecisionV1({ ...base, nextIndex: 1, fighterHp: 30, defenderHp: 50 })).toBe('hold');
    expect(autoEncounterDecisionV1({ ...base, nextIndex: null, fighterHp: 30, defenderHp: 200, options: ['hold', 'withdraw'] })).toBe('hold');
  });

  it('refuses a malformed plan: party size, stance, mode', () => {
    const d = { name: 'G', genome: fauna(1) };
    expect(() => runEncounterV1({ mode: 'auto', defender: d, party: [] })).toThrow(RangeError);
    expect(() => runEncounterV1({ mode: 'auto', defender: d, party: [fighter(1), fighter(2), fighter(3), fighter(4)] })).toThrow(RangeError);
    expect(() => runEncounterV1({ mode: 'auto', defender: d, party: [{ ...fighter(1), stance: 'berserk' as never }] })).toThrow(RangeError);
    expect(() => runEncounterV1({ mode: 'manual' as never, defender: d, party: [fighter(1)] })).toThrow(RangeError);
  });
});
