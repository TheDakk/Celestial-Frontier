/* Deterministic Arc 8 combat/Guardian audio projection.

   This owner accepts only an already-registered combat settlement: combat has
   finished, its canonical transcript has been replay-verified by CombatCore,
   and the encounter/participants are immutable. It translates that evidence
   into caption/visual-owned cue facts. It never runs combat, imports an RNG,
   or invents a result. */
import {
  PRIME_SIGNATURES_V1,
  isCombatSettlementPlanV1,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import { GUARDIAN_EPITHETS, type Genome } from '@cf/domain-genome';

export const COMBAT_CUE_PARTICIPANTS_SCHEMA_V1 = 'cf.audio.combat-cue-participants/v1' as const;
export const COMBAT_CUE_PLAN_SCHEMA_V1 = 'cf.audio.combat-cue-plan/v1' as const;

export type CombatCueSide = 'A' | 'B';
export type CombatCueStage = 'prelude' | 'transcript' | 'resolution';
export type CombatCueFamily =
  | 'guardian-entrance'
  | 'initiative'
  | 'dodge'
  | 'stun-skipped'
  | 'damage'
  | 'critical'
  | 'first-strike'
  | 'execute'
  | 'thorns'
  | 'lifesteal'
  | 'stun-applied'
  | 'burn'
  | 'regen'
  | 'defeat'
  | 'guardian-phase'
  | 'resolution'
  | 'guardian-victory'
  | 'guardian-defeat';

export interface CombatCueAbilityFactV1 {
  readonly theme: string;
  readonly themeLabel: string;
  readonly color: string;
  /** Complete canonical ability record from the settled stat block. */
  readonly fields: Readonly<Record<string, string | number | boolean>>;
}

/** Raw, exact legacy genome facts. Arc 8 deliberately does not pretend an
 * un-authored skin/body index is a physical material or synthesizer weight. */
export interface CombatCueBodyMaterialFactV1 {
  readonly policy: 'legacy-genome-weight-inputs-unmapped';
  readonly genomeSeed: number;
  readonly sizeIndex: number;
  readonly bodyIndex: number;
  readonly skinIndex: number;
  readonly detailIndex: number;
  readonly luminous: boolean;
}

export interface CombatCueParticipantFactV1 {
  readonly side: CombatCueSide;
  readonly role: 'explorer' | 'owned-fauna' | 'defender-fauna' | 'guardian' | 'titan';
  readonly sourceId: string;
  readonly combatName: string;
  readonly statName: string;
  readonly maxHp: number;
  readonly ability: CombatCueAbilityFactV1;
  readonly bodyMaterial: CombatCueBodyMaterialFactV1 | null;
}

export interface CombatCueGuardianFactV1 {
  readonly kind: 'guardian' | 'titan';
  readonly sourceId: string;
  readonly planetSeed: number;
  readonly tier: number;
  readonly epithet: string;
  readonly signatureId: string | null;
  readonly abilityTheme: string;
}

export interface CombatCueParticipantsV1 {
  readonly schema: typeof COMBAT_CUE_PARTICIPANTS_SCHEMA_V1;
  readonly battleId: string;
  readonly transcriptFingerprint: string;
  readonly champion: CombatCueParticipantFactV1;
  readonly defender: CombatCueParticipantFactV1;
  readonly guardian: CombatCueGuardianFactV1 | null;
}

export interface CombatCueCounterpartV1 {
  readonly family: CombatCueFamily;
  readonly captionToken: string;
  readonly visualToken: string;
}

export interface CombatImpactFactV1 {
  readonly damage: number;
  readonly targetMaxHp: number;
  /** Exact legacy playHit input; the renderer applies the legacy clamp. */
  readonly damageFraction: number;
  readonly critical: boolean;
  readonly abilityProc: boolean;
}

export interface CombatGuardianMotifFactV1 extends CombatCueGuardianFactV1 {
  readonly motif: 'entrance' | 'phase' | 'victory' | 'defeat';
}

export interface CombatCueV1 {
  readonly cueId: string;
  readonly ordinal: number;
  readonly stage: CombatCueStage;
  readonly transcriptIndex: number | null;
  readonly families: readonly CombatCueFamily[];
  readonly actorSide: CombatCueSide | null;
  readonly targetSide: CombatCueSide | null;
  readonly defeatedSides: readonly CombatCueSide[];
  readonly ability: CombatCueAbilityFactV1 | null;
  readonly bodyMaterial: CombatCueBodyMaterialFactV1 | null;
  readonly impact: CombatImpactFactV1 | null;
  readonly guardianMotif: CombatGuardianMotifFactV1 | null;
  readonly counterparts: readonly CombatCueCounterpartV1[];
}

export interface CombatCuePlanV1 {
  readonly schema: typeof COMBAT_CUE_PLAN_SCHEMA_V1;
  readonly planId: string;
  readonly battleId: string;
  readonly transcriptFingerprint: string;
  readonly participantSchema: typeof COMBAT_CUE_PARTICIPANTS_SCHEMA_V1;
  readonly skipPolicy: 'legacy-silent';
  readonly resultOnlySkipMotif: 'unsupported-open-policy';
  readonly cues: readonly CombatCueV1[];
}

const PARTICIPANT_FACTS = new WeakSet<object>();
const CUE_PLANS = new WeakSet<object>();

export function isCombatCueParticipantsV1(value: unknown): value is CombatCueParticipantsV1 {
  return value !== null && typeof value === 'object'
    && PARTICIPANT_FACTS.has(value)
    && (value as CombatCueParticipantsV1).schema === COMBAT_CUE_PARTICIPANTS_SCHEMA_V1;
}

export function isCombatCuePlanV1(value: unknown): value is CombatCuePlanV1 {
  return value !== null && typeof value === 'object'
    && CUE_PLANS.has(value)
    && (value as CombatCuePlanV1).schema === COMBAT_CUE_PLAN_SCHEMA_V1;
}

function boundedText(value: unknown, label: string, maximum = 192): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is invalid`);
  return value;
}

function finiteInteger(value: unknown, label: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new TypeError(`${label} is invalid`);
  }
  return value as number;
}

function finiteNumber(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    throw new TypeError(`${label} is invalid`);
  }
  return value;
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  try {
    const actual = Reflect.ownKeys(value);
    return Object.getPrototypeOf(value) === Object.prototype
      && actual.length === expected.length
      && actual.every((key) => typeof key === 'string' && expected.includes(key));
  } catch {
    return false;
  }
}

function sameCanonicalValue(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); } catch { return false; }
}

function hash32(text: string, seed: number): number {
  let value = seed >>> 0;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function digest(text: string): string {
  const left = hash32(text, 2166136261).toString(16).padStart(8, '0');
  const right = hash32([...text].reverse().join(''), 0x9e3779b9).toString(16).padStart(8, '0');
  return `${text.length.toString(36)}-${left}${right}`;
}

function abilityFact(value: unknown): CombatCueAbilityFactV1 {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError('settled combat ability is invalid');
  }
  const fields: Record<string, string | number | boolean> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    boundedText(key, 'combat ability field', 64);
    const child = (value as Record<string, unknown>)[key];
    if (typeof child === 'number') {
      if (!Number.isFinite(child)) throw new TypeError('settled combat ability is invalid');
      fields[key] = Object.is(child, -0) ? 0 : child;
    } else if (typeof child === 'string' || typeof child === 'boolean') fields[key] = child;
    else throw new TypeError('settled combat ability is invalid');
  }
  const theme = boundedText(fields.theme, 'combat ability theme', 64);
  const themeLabel = boundedText(fields.themeLabel, 'combat ability label', 96);
  const color = boundedText(fields.col, 'combat ability color', 32);
  return Object.freeze({ theme, themeLabel, color, fields: Object.freeze(fields) });
}

function bodyMaterialFact(genome: Readonly<Genome>): CombatCueBodyMaterialFactV1 {
  return Object.freeze({
    policy: 'legacy-genome-weight-inputs-unmapped',
    genomeSeed: finiteInteger(genome.seed, 'combat genome seed'),
    sizeIndex: finiteInteger(genome.size, 'combat size index'),
    bodyIndex: finiteInteger(genome.body, 'combat body index'),
    skinIndex: finiteInteger(genome.skin, 'combat skin index'),
    detailIndex: finiteInteger(genome.detail, 'combat detail index'),
    luminous: Boolean(genome.lumin),
  });
}

function participantFacts(plan: CombatSettlementPlanV1): CombatCueParticipantsV1 {
  const champion = plan.champion;
  const aRole = champion.kind === 'player' ? 'explorer' : 'owned-fauna';
  const aSourceId = champion.kind === 'player' ? champion.explorerId : champion.creatureId;
  const aBody = champion.kind === 'player' ? null : bodyMaterialFact(champion.genome);
  const defender = plan.encounter.defender;
  const bRole = defender.kind === 'titan' ? 'titan'
    : defender.kind === 'guardian' ? 'guardian' : 'defender-fauna';
  const a: CombatCueParticipantFactV1 = Object.freeze({
    side: 'A', role: aRole,
    sourceId: boundedText(aSourceId, 'combat champion id'),
    combatName: boundedText(champion.name, 'combat champion name'),
    statName: boundedText(plan.transcript.A.name, 'combat champion stat name'),
    maxHp: finiteNumber(plan.transcript.maxA, 'combat champion maximum HP', 1),
    ability: abilityFact(plan.transcript.A.ab),
    bodyMaterial: aBody,
  });
  const b: CombatCueParticipantFactV1 = Object.freeze({
    side: 'B', role: bRole,
    sourceId: boundedText(defender.sourceId, 'combat defender id'),
    combatName: boundedText(defender.name, 'combat defender name'),
    statName: boundedText(plan.transcript.B.name, 'combat defender stat name'),
    maxHp: finiteNumber(plan.transcript.maxB, 'combat defender maximum HP', 1),
    ability: abilityFact(plan.transcript.B.ab),
    bodyMaterial: bodyMaterialFact(defender.battleGenome),
  });
  let guardian: CombatCueGuardianFactV1 | null = null;
  if (defender.kind === 'guardian') {
    const ep = finiteInteger(defender.battleGenome.ep, 'Guardian epithet index');
    const epithet = GUARDIAN_EPITHETS[ep % GUARDIAN_EPITHETS.length];
    if (epithet === undefined || !defender.name.endsWith(epithet)) {
      throw new TypeError('Guardian epithet does not match its canonical name');
    }
    guardian = Object.freeze({
      kind: 'guardian', sourceId: b.sourceId,
      planetSeed: finiteInteger(plan.encounter.identity.world.planet.seed, 'Guardian planet seed'),
      tier: finiteInteger(defender.tier, 'Guardian tier', 1), epithet,
      signatureId: null, abilityTheme: b.ability.theme,
    });
  } else if (defender.kind === 'titan') {
    const definition = PRIME_SIGNATURES_V1.find((row) => row.id === defender.signatureId);
    if (definition === undefined || definition.guardianName !== defender.name) {
      throw new TypeError('Titan identity does not match its Prime Signature');
    }
    const separator = definition.guardianName.indexOf(', ');
    const epithet = separator < 0
      ? definition.guardianName
      : definition.guardianName.slice(separator + 2);
    guardian = Object.freeze({
      kind: 'titan', sourceId: b.sourceId,
      planetSeed: finiteInteger(plan.encounter.identity.world.planet.seed, 'Titan planet seed'),
      tier: finiteInteger(defender.tier, 'Titan tier', 1),
      epithet: boundedText(epithet, 'Titan epithet'),
      signatureId: definition.id, abilityTheme: b.ability.theme,
    });
  }
  return Object.freeze({
    schema: COMBAT_CUE_PARTICIPANTS_SCHEMA_V1,
    battleId: boundedText(plan.battleId, 'combat battle id'),
    transcriptFingerprint: boundedText(plan.transcriptFingerprint, 'combat transcript fingerprint'),
    champion: a,
    defender: b,
    guardian,
  });
}

/** Snapshot the exact participant/Guardian facts from one canonical settlement.
 * The private registration prevents a structurally plausible drifted clone
 * from becoming cue authority. */
export function projectCombatCueParticipantsV1(
  settlement: CombatSettlementPlanV1,
): CombatCueParticipantsV1 {
  if (!isCombatSettlementPlanV1(settlement)) {
    throw new TypeError('registered completed combat settlement is required');
  }
  const projected = participantFacts(settlement);
  PARTICIPANT_FACTS.add(projected);
  return projected;
}

function inferredSides(
  attackerName: string,
  defenderName: string,
  participants: CombatCueParticipantsV1,
): readonly [CombatCueSide | null, CombatCueSide | null] {
  const aToB = attackerName === participants.champion.combatName
    && defenderName === participants.defender.combatName;
  const bToA = attackerName === participants.defender.combatName
    && defenderName === participants.champion.combatName;
  if (!aToB && !bToA) throw new TypeError('combat transcript names drifted from participants');
  if (aToB && bToA) return [null, null];
  return aToB ? ['A', 'B'] : ['B', 'A'];
}

function motifFact(
  guardian: CombatCueGuardianFactV1,
  motif: CombatGuardianMotifFactV1['motif'],
): CombatGuardianMotifFactV1 {
  return Object.freeze({ ...guardian, motif });
}

/** Pure transcript-to-cue projection. The settlement is named `result` to
 * preserve the documented combatCuePlan(result, participants) contract. */
export function combatCuePlan(
  result: CombatSettlementPlanV1,
  participants: CombatCueParticipantsV1,
): CombatCuePlanV1 {
  if (!isCombatSettlementPlanV1(result)) {
    throw new TypeError('registered completed combat settlement is required');
  }
  if (!isCombatCueParticipantsV1(participants)
    || !sameCanonicalValue(participants, participantFacts(result))) {
    throw new TypeError('registered combat participants do not match this settlement');
  }
  const transcript = result.transcript;
  const planSeed = `${result.battleId}|${result.transcriptFingerprint}|${JSON.stringify(participants)}`;
  const cues: CombatCueV1[] = [];
  const pushCue = (input: Readonly<{
    stage: CombatCueStage;
    transcriptIndex: number | null;
    families: readonly CombatCueFamily[];
    actorSide?: CombatCueSide | null;
    targetSide?: CombatCueSide | null;
    defeatedSides?: readonly CombatCueSide[];
    ability?: CombatCueAbilityFactV1 | null;
    bodyMaterial?: CombatCueBodyMaterialFactV1 | null;
    impact?: CombatImpactFactV1 | null;
    guardianMotif?: CombatGuardianMotifFactV1 | null;
  }>): void => {
    if (input.families.length < 1 || new Set(input.families).size !== input.families.length) {
      throw new TypeError('combat cue families are invalid');
    }
    const ordinal = cues.length;
    const cueDigest = digest(`${planSeed}|${ordinal}|${input.stage}|${String(input.transcriptIndex)}|${input.families.join(',')}`);
    const cueId = `combat-cue:${cueDigest}`;
    const counterparts = Object.freeze(input.families.map((family) => Object.freeze({
      family,
      captionToken: `${cueId}:caption:${family}`,
      visualToken: `${cueId}:visual:${family}`,
    })));
    cues.push(Object.freeze({
      cueId, ordinal, stage: input.stage, transcriptIndex: input.transcriptIndex,
      families: Object.freeze([...input.families]),
      actorSide: input.actorSide ?? null,
      targetSide: input.targetSide ?? null,
      defeatedSides: Object.freeze([...(input.defeatedSides ?? [])]),
      ability: input.ability ?? null,
      bodyMaterial: input.bodyMaterial ?? null,
      impact: input.impact ?? null,
      guardianMotif: input.guardianMotif ?? null,
      counterparts,
    }));
  };

  if (participants.guardian !== null) pushCue({
    stage: 'prelude', transcriptIndex: null, families: ['guardian-entrance'],
    actorSide: 'B', guardianMotif: motifFact(participants.guardian, 'entrance'),
    ability: participants.defender.ability,
    bodyMaterial: participants.defender.bodyMaterial,
  });
  const initiativeSide: CombatCueSide = transcript.turnA0 ? 'A' : 'B';
  pushCue({
    stage: 'prelude', transcriptIndex: null, families: ['initiative'],
    actorSide: initiativeSide,
    ability: initiativeSide === 'A' ? participants.champion.ability : participants.defender.ability,
  });

  let hpA = finiteNumber(transcript.maxA, 'combat maximum HP A', 1);
  let hpB = finiteNumber(transcript.maxB, 'combat maximum HP B', 1);
  let guardianPhaseSeen = false;
  for (let transcriptIndex = 0; transcriptIndex < transcript.log.length; transcriptIndex++) {
    const row = transcript.log[transcriptIndex];
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new TypeError('combat transcript event is malformed');
    }
    const nextHpA = finiteNumber(row.hpA, 'combat event HP A');
    const nextHpB = finiteNumber(row.hpB, 'combat event HP B');
    if (nextHpA > transcript.maxA || nextHpB > transcript.maxB) {
      throw new TypeError('combat transcript HP exceeds its settled maximum');
    }
    const defeated: CombatCueSide[] = [];
    if (hpA > 0 && nextHpA === 0) defeated.push('A');
    if (hpB > 0 && nextHpB === 0) defeated.push('B');

    if (Object.hasOwn(row, 'stun')) {
      if (!exactKeys(row, ['an', 'dn', 'stun', 'hpA', 'hpB']) || row.stun !== true
        || nextHpA !== hpA || nextHpB !== hpB) throw new TypeError('combat stun event is malformed');
      const [actorSide, targetSide] = inferredSides(
        boundedText(row.an, 'combat attacker name'),
        boundedText(row.dn, 'combat defender name'),
        participants,
      );
      pushCue({ stage: 'transcript', transcriptIndex, families: ['stun-skipped'], actorSide, targetSide });
    } else if (Object.hasOwn(row, 'dodge')) {
      if (!exactKeys(row, ['an', 'dn', 'dodge', 'hpA', 'hpB']) || row.dodge !== true
        || nextHpA !== hpA || nextHpB !== hpB) throw new TypeError('combat dodge event is malformed');
      const [actorSide, targetSide] = inferredSides(
        boundedText(row.an, 'combat attacker name'),
        boundedText(row.dn, 'combat defender name'),
        participants,
      );
      pushCue({ stage: 'transcript', transcriptIndex, families: ['dodge'], actorSide, targetSide });
    } else if (Object.hasOwn(row, 'tick')) {
      if (!exactKeys(row, ['tick', 'rA', 'rB', 'bA', 'bB', 'hpA', 'hpB']) || row.tick !== true) {
        throw new TypeError('combat tick event is malformed');
      }
      const rA = finiteInteger(row.rA, 'combat regen A');
      const rB = finiteInteger(row.rB, 'combat regen B');
      const bA = finiteInteger(row.bA, 'combat burn A');
      const bB = finiteInteger(row.bB, 'combat burn B');
      const families: CombatCueFamily[] = [];
      if (bA > 0 || bB > 0) families.push('burn');
      if (rA > 0 || rB > 0) families.push('regen');
      if (defeated.length > 0) families.push('defeat');
      if (families.length < 1) throw new TypeError('combat tick event has no settled effect');
      pushCue({ stage: 'transcript', transcriptIndex, families, defeatedSides: defeated });
    } else {
      if (!exactKeys(row, ['an', 'dn', 'dmg', 'crit', 'fs', 'ex', 'tb', 'ls', 'stp', 'side', 'hpA', 'hpB'])) {
        throw new TypeError('combat damage event is malformed');
      }
      if (row.side !== 'A' && row.side !== 'B') throw new TypeError('combat damage side is malformed');
      const actorSide = row.side;
      const targetSide: CombatCueSide = actorSide === 'A' ? 'B' : 'A';
      const actor = actorSide === 'A' ? participants.champion : participants.defender;
      const target = targetSide === 'A' ? participants.champion : participants.defender;
      if (row.an !== actor.combatName || row.dn !== target.combatName) {
        throw new TypeError('combat damage names drifted from participants');
      }
      const damage = finiteInteger(row.dmg, 'combat damage', 1);
      const thorns = finiteInteger(row.tb, 'combat thorns');
      const lifesteal = finiteInteger(row.ls, 'combat lifesteal');
      if (typeof row.crit !== 'boolean' || typeof row.fs !== 'boolean'
        || typeof row.ex !== 'boolean' || typeof row.stp !== 'boolean') {
        throw new TypeError('combat damage flags are malformed');
      }
      const families: CombatCueFamily[] = ['damage'];
      if (row.crit) families.push('critical');
      if (row.fs) families.push('first-strike');
      if (row.ex) families.push('execute');
      if (thorns > 0) families.push('thorns');
      if (lifesteal > 0) families.push('lifesteal');
      if (row.stp) families.push('stun-applied');
      if (defeated.length > 0) families.push('defeat');
      const targetMaxHp = target.maxHp;
      pushCue({
        stage: 'transcript', transcriptIndex, families, actorSide, targetSide,
        defeatedSides: defeated, ability: actor.ability, bodyMaterial: target.bodyMaterial,
        impact: Object.freeze({
          damage, targetMaxHp, damageFraction: damage / targetMaxHp,
          critical: row.crit, abilityProc: row.fs || row.ex || row.stp,
        }),
      });
    }

    if (!guardianPhaseSeen && participants.guardian !== null
      && hpB > transcript.maxB * 0.5 && nextHpB <= transcript.maxB * 0.5) {
      guardianPhaseSeen = true;
      pushCue({
        stage: 'transcript', transcriptIndex, families: ['guardian-phase'], actorSide: 'B',
        ability: participants.defender.ability,
        bodyMaterial: participants.defender.bodyMaterial,
        guardianMotif: motifFact(participants.guardian, 'phase'),
      });
    }
    hpA = nextHpA;
    hpB = nextHpB;
  }
  if (hpA !== transcript.hpA || hpB !== transcript.hpB) {
    throw new TypeError('combat transcript terminal HP is malformed');
  }
  const winner: CombatCueSide | null = transcript.winner;
  pushCue({
    stage: 'resolution', transcriptIndex: null, families: ['resolution'],
    actorSide: winner,
    defeatedSides: winner === 'A' ? ['B'] : winner === 'B' ? ['A'] : [],
  });
  if (participants.guardian !== null && winner !== null) {
    const guardianWon = winner === 'B';
    pushCue({
      stage: 'resolution', transcriptIndex: null,
      families: [guardianWon ? 'guardian-victory' : 'guardian-defeat'],
      actorSide: 'B',
      ability: participants.defender.ability,
      bodyMaterial: participants.defender.bodyMaterial,
      guardianMotif: motifFact(participants.guardian, guardianWon ? 'victory' : 'defeat'),
    });
  }
  const frozenCues = Object.freeze(cues);
  const planId = `combat-plan:${digest(`${planSeed}|${JSON.stringify(frozenCues)}`)}`;
  const plan: CombatCuePlanV1 = Object.freeze({
    schema: COMBAT_CUE_PLAN_SCHEMA_V1,
    planId,
    battleId: result.battleId,
    transcriptFingerprint: result.transcriptFingerprint,
    participantSchema: COMBAT_CUE_PARTICIPANTS_SCHEMA_V1,
    skipPolicy: 'legacy-silent',
    resultOnlySkipMotif: 'unsupported-open-policy',
    cues: frozenCues,
  });
  CUE_PLANS.add(plan);
  return plan;
}
