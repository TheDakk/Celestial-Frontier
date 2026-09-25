/* The v2 encounter resolver (Nick 2026-09-25, port/DECISIONS.md §20; N1 stage S1).

   A Guardian/Titan fight takes a RELAY party of up to 3: one fighter on stage at a time, and the defender's lost HP carries over to
   the next leg. Each fighter has one pre-fight STANCE. The fight pauses at BREAKS (a fighter's first drop to ⅓ HP; before the next
   fighter comes in). In AUTO the resolver answers every Break itself, including the sensible swap. In COMMAND it returns `paused` until
   the player's next decision is supplied. The result is a PURE function of (plan, decisions): a reload re-simulates to the same Break,
   and the same plan always gives the same fight (no attempt counter, no reroll).

   PARITY LAW: one fighter + Balanced + Auto reproduces the verbatim v1.8.9 `runDuel` exactly (winner, HP, the whole log): the same
   seeds, the same RNG draws in the same order, the same 26 half-turn cap and tie coins. A leg is `runDuel`'s loop with two additions
   that draw no randomness: a carried defender HP and the Break hook. Balanced adds no ability fields, so it draws nothing extra.
   `test/encounter.test.ts` holds that control over the golden fixture pairs. `combatcore.verbatim.js` is never edited.

   Stance numbers are PLACEHOLDERS for Codex's S4 balance instrument (one right stance per threat, none best everywhere, and
   Command's best swap only a small edge over Auto's own swap). */
import { hashInt, mulberry32 } from '@cf/domain-rand';
import { battleStats, type BattleStats } from './combatcore.verbatim.js';

export const ENCOUNTER_SCHEMA_V1 = 'cf-v2-encounter/v1' as const;
export const ENCOUNTER_PARTY_MAX_V1 = 3;
export const ENCOUNTER_LEG_HALF_TURNS_V1 = 26;
/** A fighter's first drop to this fraction of its max HP opens a Break. */
export const ENCOUNTER_LOW_HP_FRACTION_V1 = 1 / 3;

export type EncounterStanceV1 = 'balanced' | 'press' | 'guard' | 'evade';
export const ENCOUNTER_STANCES_V1 = Object.freeze(['balanced', 'press', 'guard', 'evade'] as const);
/** Placeholder tuning (S4 owns the numbers): multipliers on the fighter's own ability hooks. */
export const ENCOUNTER_STANCE_TUNING_V1 = Object.freeze({
  press: Object.freeze({ dealt: 1.15, taken: 1.10 }),
  guard: Object.freeze({ dealt: 0.90, taken: 0.85, openerBlunt: 0.5 }),
  evade: Object.freeze({ dealt: 0.90, dodge: 0.08 }),
});

/** §20 Guardian phase (N1 §4.3, S7): when a Guardian or Titan first falls to half health it changes to a telegraphed second behavior.
 *  The change is announced at a Break BEFORE it applies (Hold / Swap / Withdraw), then lasts for the rest of the fight, across legs.
 *  Placeholder numbers (one constant; Codex's S4 instrument owns them): the phased defender hits 20% harder and takes 10% less. */
export const ENCOUNTER_GUARDIAN_PHASE_V1 = Object.freeze({ atFraction: 0.5, dealt: 1.2, taken: 0.9 });
export type EncounterDefenderKindV1 = 'fauna' | 'guardian' | 'titan';
/** Whether a defender of this kind has the phase change (Guardians and Titans only). */
export function encounterHasGuardianPhaseV1(kind: string | undefined | null): boolean { return kind === 'guardian' || kind === 'titan'; }

export type EncounterModeV1 = 'auto' | 'command';
export type EncounterDecisionV1 = 'hold' | 'swap' | 'withdraw';

export interface EncounterCombatantV1 {
  readonly name: string;
  readonly genome: Readonly<Record<string, unknown>> & { readonly seed: number };
  /** Precomputed battle stats (as `runDuel` accepts); otherwise derived from the genome. */
  readonly stats?: BattleStats;
}
export interface EncounterFighterV1 extends EncounterCombatantV1 {
  readonly stance: EncounterStanceV1;
  /** Current health on entry (a wounded companion); absent = full. */
  readonly startHp?: number;
}
export interface EncounterPlanV1 {
  readonly party: readonly EncounterFighterV1[];
  /** `phase: true` = a Guardian/Titan with the §20 phase change (absent = none; the v1 parity path never has it). */
  readonly defender: EncounterCombatantV1 & { readonly phase?: boolean };
  readonly mode: EncounterModeV1;
}

export interface EncounterBreakV1 {
  readonly ordinal: number;
  /** `phase` = the defender is about to change (announced before the change applies). */
  readonly kind: 'low-hp' | 'next-fighter' | 'phase';
  readonly fighterIndex: number;
  readonly nextIndex: number | null;
  readonly fighterHp: number;
  readonly fighterMax: number;
  readonly defenderHp: number;
  readonly defenderMax: number;
  readonly options: readonly EncounterDecisionV1[];
}

export interface EncounterLegV1 {
  readonly fighterIndex: number;
  /** `runDuel`'s own result shape for this leg (A = the fighter, B = the defender). */
  readonly A: BattleStats; readonly B: BattleStats;
  readonly log: readonly Record<string, unknown>[];
  readonly winner: 'A' | 'B' | null;
  readonly hpA: number; readonly hpB: number; readonly maxA: number; readonly maxB: number;
  readonly turnA0: boolean;
  /** The defender's HP when this leg began (the previous leg's end: the relay carries it). */
  readonly hpBStart: number;
  /** How the leg ended: the fighter fell, left (swap), the party withdrew, the defender fell, or the half-turn cap was reached. */
  readonly end: 'fighter-fell' | 'swapped' | 'withdrew' | 'defender-fell' | 'cap';
}

export interface EncounterFighterResultV1 {
  readonly index: number;
  readonly fought: boolean;
  readonly hpEnd: number;
  readonly max: number;
  readonly fell: boolean;
  readonly swappedOut: boolean;
}

export type EncounterResultV1 =
  | Readonly<{ schema: typeof ENCOUNTER_SCHEMA_V1; status: 'paused'; pendingBreak: EncounterBreakV1; decisionsUsed: number;
      breaks: readonly EncounterBreakRecordV1[]; legs: readonly EncounterLegV1[] }>
  | Readonly<{ schema: typeof ENCOUNTER_SCHEMA_V1; status: 'finished';
      outcome: 'party' | 'defender' | 'withdrawn' | 'draw';
      legs: readonly EncounterLegV1[]; breaks: readonly EncounterBreakRecordV1[];
      fighters: readonly EncounterFighterResultV1[]; defenderHp: number; defenderMax: number; decisionsUsed: number }>;

export interface EncounterBreakRecordV1 {
  readonly break: EncounterBreakV1;
  readonly decision: EncounterDecisionV1;
  readonly by: 'auto' | 'player';
}

function stanceStats(stats: BattleStats, stance: EncounterStanceV1): BattleStats {
  if (stance === 'balanced') return stats;   // parity: no new ability fields, so no new RNG draws
  const ab = { ...stats.ab } as BattleStats['ab'];
  const num = (key: string, fallback: number): number => (typeof ab[key] === 'number' ? ab[key] as number : fallback);
  if (stance === 'press') {
    ab.dmg = num('dmg', 1) * ENCOUNTER_STANCE_TUNING_V1.press.dealt;
    ab.taken = num('taken', 1) * ENCOUNTER_STANCE_TUNING_V1.press.taken;
  } else if (stance === 'guard') {
    ab.dmg = num('dmg', 1) * ENCOUNTER_STANCE_TUNING_V1.guard.dealt;
    ab.taken = num('taken', 1) * ENCOUNTER_STANCE_TUNING_V1.guard.taken;
  } else if (stance === 'evade') {
    ab.dmg = num('dmg', 1) * ENCOUNTER_STANCE_TUNING_V1.evade.dealt;
    ab.dodge = num('dodge', 0) + ENCOUNTER_STANCE_TUNING_V1.evade.dodge;
  } else {
    throw new RangeError(`unknown encounter stance ${String(stance)}`);
  }
  return { ...stats, ab };
}

function checkedPlan(plan: EncounterPlanV1): void {
  if (!plan || !Array.isArray(plan.party) || plan.party.length < 1 || plan.party.length > ENCOUNTER_PARTY_MAX_V1) {
    throw new RangeError(`an encounter party holds 1 to ${ENCOUNTER_PARTY_MAX_V1} fighters`);
  }
  if (plan.mode !== 'auto' && plan.mode !== 'command') throw new RangeError('encounter mode must be auto or command');
  for (const fighter of plan.party) {
    if (!(ENCOUNTER_STANCES_V1 as readonly string[]).includes(fighter.stance)) throw new RangeError('encounter fighter stance is invalid');
    if (!Number.isSafeInteger(fighter.genome?.seed)) throw new RangeError('encounter fighter needs an integer genome seed');
  }
  if (!Number.isSafeInteger(plan.defender?.genome?.seed)) throw new RangeError('encounter defender needs an integer genome seed');
}

/** The Auto policy: hold, except the sensible swap — at a fighter's low-HP Break, a waiting teammate comes in when the defender is
 *  doing at least as well as the current fighter. Auto never withdraws. */
export function autoEncounterDecisionV1(b: EncounterBreakV1): EncounterDecisionV1 {
  if (b.kind === 'low-hp' && b.nextIndex !== null && b.options.includes('swap')
    && b.defenderHp / b.defenderMax >= b.fighterHp / b.fighterMax) return 'swap';
  return 'hold';
}

/** Resolve an encounter from its sealed plan and the decisions made so far (Command); Auto needs none. */
export function runEncounterV1(plan: EncounterPlanV1, decisions: readonly EncounterDecisionV1[] = []): EncounterResultV1 {
  checkedPlan(plan);
  const defender = plan.defender;
  const B0 = defender.stats || (battleStats(defender.genome as never) as BattleStats);
  const maxB = B0.vit * 3;
  const phaseEnabled = defender.phase === true;
  let phaseActive = false;
  const phasedB = (): BattleStats => {
    const ab = { ...B0.ab } as BattleStats['ab'];
    ab.dmg = (typeof ab.dmg === 'number' ? ab.dmg : 1) * ENCOUNTER_GUARDIAN_PHASE_V1.dealt;
    ab.taken = (typeof ab.taken === 'number' ? ab.taken : 1) * ENCOUNTER_GUARDIAN_PHASE_V1.taken;
    return { ...B0, ab };
  };
  let hpBCarried = maxB;
  const legs: EncounterLegV1[] = [];
  const breaks: EncounterBreakRecordV1[] = [];
  const fighters: EncounterFighterResultV1[] = [];
  let decisionIndex = 0, breakOrdinal = 0;
  const lowBreakDone = new Set<number>();

  /* Every Break goes through here. Command without a supplied decision pauses the whole resolution (it will be re-run from the start
     with one more decision, which reproduces the same fight up to this point because nothing here draws randomness). */
  type Resolved = { decision: EncounterDecisionV1 } | { paused: EncounterBreakV1 };
  const resolveBreak = (b: Omit<EncounterBreakV1, 'ordinal'>): Resolved => {
    const full: EncounterBreakV1 = Object.freeze({ ...b, ordinal: breakOrdinal++, options: Object.freeze([...b.options]) });
    if (plan.mode === 'auto') {
      const decision = autoEncounterDecisionV1(full);
      breaks.push(Object.freeze({ break: full, decision, by: 'auto' as const }));
      return { decision };
    }
    if (decisionIndex >= decisions.length) return { paused: full };
    const decision = decisions[decisionIndex++]!;
    if (!full.options.includes(decision)) throw new RangeError(`decision ${decision} is not offered at this Break`);
    breaks.push(Object.freeze({ break: full, decision, by: 'player' as const }));
    return { decision };
  };

  let outcome: 'party' | 'defender' | 'withdrawn' | 'draw' | null = null;
  for (let index = 0; index < plan.party.length && outcome === null; index++) {
    const mine = plan.party[index]!;
    const nextIndex = index + 1 < plan.party.length ? index + 1 : null;
    const A = stanceStats(mine.stats || (battleStats(mine.genome as never) as BattleStats), mine.stance);
    let B = phaseActive ? phasedB() : B0;
    const r = mulberry32(hashInt(mine.genome.seed >>> 0, defender.genome.seed >>> 0, 0xD0E1) >>> 0);
    const maxA = A.vit * 3;
    let hpA = mine.startHp === undefined ? maxA : Math.max(1, Math.min(maxA, Math.round(mine.startHp)));
    let hpB = hpBCarried;
    const hpBStart = hpB;
    let turnA = A.agi > B.agi || (A.agi === B.agi
      && ((hashInt(hashInt(mine.genome.seed >>> 0, 0x9E37, 0x71EB), defender.genome.seed >>> 0, 0x85EB) >>> 8) & 1) === 0);
    const turnA0 = turnA;
    let rampA = 0, rampB = 0, firstA = true, firstB = true;
    let shredA = 0, shredB = 0, skipA = false, skipB = false;
    const log: Record<string, unknown>[] = [];
    const an0 = mine.name, dn0 = defender.name;
    const abA = A.ab as Record<string, number | undefined>;
    let abB = B.ab as Record<string, number | undefined>;
    const guardOpener = mine.stance === 'guard';
    const strike = (): void => {
      const att = turnA ? abA : abB, def = turnA ? abB : abA;
      const attS = turnA ? A : B, defS = turnA ? B : A;
      const an = turnA ? an0 : dn0, dn = turnA ? dn0 : an0;
      if (turnA ? skipA : skipB) {
        if (turnA) skipA = false; else skipB = false;
        log.push({ an, dn, stun: true, hpA, hpB });
        return;
      }
      if (def.dodge && r() < def.dodge) {
        log.push({ an, dn, dodge: true, hpA, hpB });
        return;
      }
      const crit = r() < Math.min(0.95, attS.ins / 420 + (att.critB || 0));
      const ramp = turnA ? rampA : rampB;
      let fs = false, ex = false, tb = 0, ls = 0, stp = false;
      let dmg = attS.fer * (1 + ramp) * (0.8 + r() * 0.5) - defS.res * 0.45;
      if (att.dmg) dmg *= att.dmg;
      if (def.taken) dmg *= def.taken;
      if (att.first && (turnA ? firstA : firstB)) {
        // Guard blunts the defender's opener toward neutral; the fighter's own opener is unchanged
        const first = !turnA && guardOpener ? 1 + (att.first - 1) * ENCOUNTER_STANCE_TUNING_V1.guard.openerBlunt : att.first;
        dmg *= first; fs = true;
      }
      if (att.enrage) { const mf = turnA ? (1 - hpA / maxA) : (1 - hpB / maxB); dmg *= 1 + att.enrage * mf; }
      if (att.gambit) dmg *= (1 - att.gambit * 0.45) + r() * att.gambit * 1.45;
      dmg *= 1 + (turnA ? shredB : shredA);
      if (att.execB && (turnA ? (hpB < maxB * 0.5) : (hpA < maxA * 0.5))) { dmg *= 1 + att.execB; ex = true; }
      dmg = Math.max(2, Math.round(attS.fer * 0.10), Math.round(dmg));
      if (crit) dmg = Math.round(dmg * 1.7);
      if (def.cap) dmg = Math.min(dmg, Math.max(3, Math.round((turnA ? maxB : maxA) * def.cap)));
      if (turnA) { hpB = Math.max(0, hpB - dmg); firstA = false; } else { hpA = Math.max(0, hpA - dmg); firstB = false; }
      if (att.shred) { if (turnA) shredB += att.shred; else shredA += att.shred; }
      if (def.thorns) {
        tb = Math.max(1, Math.round(dmg * def.thorns));
        if (turnA) hpA = Math.max(0, hpA - tb); else hpB = Math.max(0, hpB - tb);
      }
      if (att.stun && r() < att.stun) { if (turnA) skipB = true; else skipA = true; stp = true; }
      if (crit && att.drink) {
        ls = Math.round(dmg * 0.3);
        if (turnA) hpA = Math.min(maxA, hpA + ls); else hpB = Math.min(maxB, hpB + ls);
      }
      log.push({ an, dn, dmg, crit, fs, ex, tb, ls, stp, side: turnA ? 'A' : 'B', hpA, hpB });
    };
    let end: EncounterLegV1['end'] | null = null;
    let paused: EncounterBreakV1 | null = null;
    for (let round = 0; round < ENCOUNTER_LEG_HALF_TURNS_V1 && hpA > 0 && hpB > 0; round++) {
      strike();
      const att = turnA ? abA : abB;
      if (hpA > 0 && hpB > 0 && att.dbl && r() < att.dbl) strike();
      let rA = 0, rB = 0, bA = 0, bB = 0;
      if (hpA > 0 && abA.regen) { rA = Math.round(maxA * abA.regen * 0.5); hpA = Math.min(maxA, hpA + rA); }
      if (hpB > 0 && abB.regen) { rB = Math.round(maxB * abB.regen * 0.5); hpB = Math.min(maxB, hpB + rB); }
      if (abA.ramp) rampA += abA.ramp * 0.5;
      if (abB.ramp) rampB += abB.ramp * 0.5;
      if (abA.burn && hpB > 0) { bB = Math.max(1, Math.round(maxB * abA.burn * 0.5)); hpB = Math.max(0, hpB - bB); }
      if (abB.burn && hpA > 0) { bA = Math.max(1, Math.round(maxA * abB.burn * 0.5)); hpA = Math.max(0, hpA - bA); }
      if (rA || rB || bA || bB) log.push({ tick: true, rA, rB, bA, bB, hpA, hpB });
      turnA = !turnA;
      /* §20 Guardian phase: the first time the defender is at or below half health (and both still stand), a Break announces the change;
         it applies after the answer (Hold/Swap/Withdraw), for the rest of the fight. Draws nothing. */
      if (phaseEnabled && !phaseActive && hpA > 0 && hpB > 0 && hpB <= maxB * ENCOUNTER_GUARDIAN_PHASE_V1.atFraction) {
        phaseActive = true;
        const resolved = resolveBreak({ kind: 'phase', fighterIndex: index, nextIndex, fighterHp: hpA, fighterMax: maxA,
          defenderHp: hpB, defenderMax: maxB, options: nextIndex !== null ? ['hold', 'swap', 'withdraw'] : ['hold', 'withdraw'] });
        if ('paused' in resolved) { phaseActive = false; paused = resolved.paused; break; }
        B = phasedB(); abB = B.ab as Record<string, number | undefined>;
        if (resolved.decision === 'swap') { end = 'swapped'; break; }
        if (resolved.decision === 'withdraw') { end = 'withdrew'; break; }
      }
      // the low-HP Break: draws nothing, so Hold continues the identical fight
      if (hpA > 0 && hpB > 0 && !lowBreakDone.has(index) && hpA <= maxA * ENCOUNTER_LOW_HP_FRACTION_V1) {
        lowBreakDone.add(index);
        const resolved = resolveBreak({ kind: 'low-hp', fighterIndex: index, nextIndex, fighterHp: hpA, fighterMax: maxA,
          defenderHp: hpB, defenderMax: maxB, options: nextIndex !== null ? ['hold', 'swap', 'withdraw'] : ['hold', 'withdraw'] });
        if ('paused' in resolved) { paused = resolved.paused; break; }
        if (resolved.decision === 'swap') { end = 'swapped'; break; }
        if (resolved.decision === 'withdraw') { end = 'withdrew'; break; }
      }
    }
    const fa = hpA / maxA, fb = hpB / maxB;
    const winner: 'A' | 'B' | null = end !== null || paused !== null ? null
      : (hpA <= 0 && hpB <= 0) ? null : hpA <= 0 ? 'B' : hpB <= 0 ? 'A'
      : fa > fb ? 'A' : fa < fb ? 'B'
      : (((hashInt(hashInt(mine.genome.seed >>> 0, 0x9E37, 0x71EB), defender.genome.seed >>> 0, 0x85EB) >>> 9) & 1) === 0 ? 'A' : 'B');
    if (end === null && paused === null) end = hpB <= 0 ? 'defender-fell' : hpA <= 0 ? 'fighter-fell' : 'cap';
    legs.push(Object.freeze({ fighterIndex: index, A, B, log: Object.freeze(log), winner, hpA, hpB, maxA, maxB, turnA0, hpBStart,
      end: (end ?? 'cap') as EncounterLegV1['end'] }));
    fighters.push(Object.freeze({ index, fought: true, hpEnd: hpA, max: maxA, fell: hpA <= 0, swappedOut: end === 'swapped' }));
    hpBCarried = hpB;
    if (paused !== null) {
      return Object.freeze({ schema: ENCOUNTER_SCHEMA_V1, status: 'paused', pendingBreak: paused, decisionsUsed: decisionIndex,
        breaks: Object.freeze([...breaks]), legs: Object.freeze([...legs]) });
    }
    if (end === 'withdrew') { outcome = 'withdrawn'; break; }
    if (winner === 'A') { outcome = 'party'; break; }
    if (hpA <= 0 && hpB <= 0) { outcome = 'draw'; break; }
    if (end === 'swapped') continue;   // the swap itself was the decision: the next fighter enters at once
    // the fighter fell or lost the leg at the cap: the next fighter may come in (a Break), or the defender wins
    if (nextIndex === null) { outcome = 'defender'; break; }
    const resolved = resolveBreak({ kind: 'next-fighter', fighterIndex: index, nextIndex, fighterHp: Math.max(0, hpA), fighterMax: maxA,
      defenderHp: hpB, defenderMax: maxB, options: ['hold', 'withdraw'] });
    if ('paused' in resolved) {
      return Object.freeze({ schema: ENCOUNTER_SCHEMA_V1, status: 'paused', pendingBreak: resolved.paused, decisionsUsed: decisionIndex,
        breaks: Object.freeze([...breaks]), legs: Object.freeze([...legs]) });
    }
    if (resolved.decision === 'withdraw') { outcome = 'withdrawn'; break; }
  }
  if (outcome === null) outcome = 'defender';
  for (let index = fighters.length; index < plan.party.length; index++) {
    const f = plan.party[index]!, max = (f.stats || (battleStats(f.genome as never) as BattleStats)).vit * 3;
    fighters.push(Object.freeze({ index, fought: false, hpEnd: f.startHp === undefined ? max : Math.max(1, Math.min(max, Math.round(f.startHp))), max, fell: false, swappedOut: false }));
  }
  return Object.freeze({ schema: ENCOUNTER_SCHEMA_V1, status: 'finished', outcome, legs: Object.freeze(legs), breaks: Object.freeze(breaks),
    fighters: Object.freeze(fighters), defenderHp: hpBCarried, defenderMax: maxB, decisionsUsed: decisionIndex });
}
