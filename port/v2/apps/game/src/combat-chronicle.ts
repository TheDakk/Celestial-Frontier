/* Browser-free Arc 8 Combat Chronicle presentation.

   This owner accepts only the registered, replay-verified settlement and its
   registered matching audio projection. It narrates that immutable result;
   it cannot run combat, draw gameplay RNG, mutate an outcome, save progress,
   or award an achievement. DOM publication uses created nodes + textContent
   exclusively so combatant/ability names are never interpreted as markup. */
import {
  isCombatSettlementPlanV1,
  type CombatSettlementPlanV1,
} from '@cf/domain-combatcore';
import { hashInt, mulberry32 } from '@cf/domain-rand';
import {
  isCombatCuePlanV1,
  type AudioCounterpartReceipt,
  type CombatCuePlanV1,
  type CombatCueSide,
  type CombatCueV1,
} from '@cf/audio';

export const COMBAT_CHRONICLE_SCHEMA_V1 = 'cf-v2-combat-chronicle/v1' as const;
export const COMBAT_CHRONICLE_START_DELAY_MS = 420 as const;
export const COMBAT_CHRONICLE_ROW_DELAY_MS = 240 as const;

export type CombatChronicleRowKindV1 =
  | 'intro'
  | 'initiative'
  | 'tick'
  | 'stun'
  | 'dodge'
  | 'damage'
  | 'death'
  | 'statistics';

export type CombatChronicleToneV1 =
  | 'faint'
  | 'burn'
  | 'heal'
  | 'stun'
  | 'miss'
  | 'damage'
  | 'critical'
  | 'death'
  | 'statistics';

export interface CombatChronicleRowV1 {
  readonly kind: CombatChronicleRowKindV1;
  readonly tone: CombatChronicleToneV1;
  readonly displayText: string;
  readonly shareText: string;
  readonly transcriptIndex: number | null;
  readonly actorSide: CombatCueSide | null;
  readonly targetSide: CombatCueSide | null;
  /** Compatibility projection for the exact damage cue owned by this row.
   * Other registered families are resolved from kind/transcriptIndex without
   * widening the immutable Chronicle row schema. */
  readonly damageCue: CombatCueV1 | null;
}

export interface CombatChronicleStepV1 {
  readonly transcriptIndex: number;
  readonly hpA: number;
  readonly hpB: number;
  readonly rows: readonly CombatChronicleRowV1[];
}

export interface CombatChronicleV1 {
  readonly schema: typeof COMBAT_CHRONICLE_SCHEMA_V1;
  readonly battleId: string;
  readonly transcriptFingerprint: string;
  readonly championName: string;
  readonly defenderName: string;
  readonly maxHpA: number;
  readonly maxHpB: number;
  readonly initialRows: readonly CombatChronicleRowV1[];
  readonly steps: readonly CombatChronicleStepV1[];
  readonly statisticsRows: readonly CombatChronicleRowV1[];
  readonly winnerSide: CombatCueSide | null;
  readonly resultText: string;
  readonly shareText: string;
}

export interface CombatChronicleCueEmissionV1 {
  readonly plan: CombatCuePlanV1;
  readonly cue: CombatCueV1;
  readonly counterpart: AudioCounterpartReceipt;
}
/** Compatibility alias for the original damage-only consumer name. */
export type CombatChronicleDamageEmissionV1 = CombatChronicleCueEmissionV1;

export type CombatChronicleStopReasonV1 = 'close' | 'detach' | 'hidden' | 'dispose' | 'replace' | 'skip';

export interface CombatChronicleControllerOptions {
  readonly root: HTMLElement;
  readonly onCue?: (emission: CombatChronicleCueEmissionV1) => void;
  /** Deprecated damage-only option retained for source-compatible callers. */
  readonly onDamageCue?: (emission: CombatChronicleDamageEmissionV1) => void;
  readonly onShare?: (shareText: string) => void;
  /** The presentation owner must stop every voice for the abandoned generation. */
  readonly onStopVoices?: (
    reason: CombatChronicleStopReasonV1,
    presentationGeneration: number,
  ) => void;
}

const CHRONICLES = new WeakSet<object>();

export function isCombatChronicleV1(value: unknown): value is CombatChronicleV1 {
  return value !== null && typeof value === 'object'
    && CHRONICLES.has(value)
    && (value as CombatChronicleV1).schema === COMBAT_CHRONICLE_SCHEMA_V1;
}

const VERBS = Object.freeze([
  Object.freeze(['grazes', 'nicks', 'clips the flank of']),
  Object.freeze(['strikes', 'slashes across', 'bites into']),
  Object.freeze(['hammers', 'rakes deep into', 'tears into']),
  Object.freeze(['savages', 'crushes', 'rends']),
  Object.freeze(['devastates', 'all but breaks', 'eviscerates']),
] as const);

function row(input: CombatChronicleRowV1): CombatChronicleRowV1 {
  return Object.freeze(input);
}

function numberField(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`registered combat transcript ${label} is invalid`);
  }
  return value;
}

function booleanField(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new TypeError(`registered combat transcript ${label} is invalid`);
  }
  return value;
}

function stringField(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`registered combat transcript ${label} is invalid`);
  }
  return value;
}

function rawAbilityName(plan: CombatSettlementPlanV1, side: CombatCueSide): string | null {
  const ability = side === 'A' ? plan.transcript.A.ab : plan.transcript.B.ab;
  const name = (ability as Readonly<Record<string, unknown>>).n;
  return typeof name === 'string' && name.length > 0 ? name : null;
}

function sideForNames(
  actor: string,
  target: string,
  championName: string,
  defenderName: string,
): readonly [CombatCueSide | null, CombatCueSide | null] {
  const aToB = actor === championName && target === defenderName;
  const bToA = actor === defenderName && target === championName;
  if (aToB === bToA) return [null, null];
  return aToB ? ['A', 'B'] : ['B', 'A'];
}

function matchingDamageCue(
  cuePlan: CombatCuePlanV1,
  transcriptIndex: number,
): CombatCueV1 {
  const matches = cuePlan.cues.filter((cue) => cue.stage === 'transcript'
    && cue.transcriptIndex === transcriptIndex
    && cue.families.includes('damage'));
  if (matches.length !== 1 || matches[0]?.impact === null
    || matches[0]?.counterparts.filter((part) => part.family === 'damage').length !== 1) {
    throw new TypeError('registered combat cue plan does not exactly own the damage transcript');
  }
  return matches[0];
}

interface ChronicleTally {
  hit: number;
  miss: number;
  crit: number;
  big: number;
  dealt: number;
  burn: number;
  thorn: number;
  heal: number;
  stun: number;
}

function tally(): ChronicleTally {
  return { hit: 0, miss: 0, crit: 0, big: 0, dealt: 0, burn: 0, thorn: 0, heal: 0, stun: 0 };
}

function statisticsLine(name: string, stats: ChronicleTally): string {
  return `${name}: ${stats.hit} hits · ${stats.crit} crits · biggest ${stats.big} · ${stats.dealt} dealt`
    + (stats.burn ? ` · ${stats.burn} burned` : '')
    + (stats.heal ? ` · ${stats.heal} healed` : '')
    + (stats.stun ? ` · ${stats.stun} staggers` : '');
}

/** Exact v1.8.9 Chronicle projection over one already-settled duel. */
export function projectCombatChronicleV1(
  settlement: CombatSettlementPlanV1,
  cuePlan: CombatCuePlanV1,
): CombatChronicleV1 {
  if (!isCombatSettlementPlanV1(settlement)) {
    throw new TypeError('registered combat settlement plan is required');
  }
  if (!isCombatCuePlanV1(cuePlan)) {
    throw new TypeError('registered combat cue plan is required');
  }
  if (cuePlan.battleId !== settlement.battleId
    || cuePlan.transcriptFingerprint !== settlement.transcriptFingerprint) {
    throw new TypeError('registered combat cue plan does not match this settlement');
  }

  const championName = settlement.champion.name;
  const defenderName = settlement.encounter.defender.name;
  const championSeed = settlement.champion.kind === 'player'
    ? settlement.champion.genomeSeed : settlement.champion.genome.seed;
  const defenderSeed = settlement.encounter.defender.battleGenome.seed;
  const narrator = mulberry32(hashInt(championSeed >>> 0, defenderSeed >>> 0, 0xba7d) >>> 0);
  const pick = <T>(values: readonly T[]): T => values[(narrator() * values.length) | 0]!;
  const initialRows = Object.freeze([
    row({
      kind: 'intro', tone: 'faint',
      displayText: settlement.encounter.defender.kind === 'fauna'
        ? `The conquest begins — ${championName} faces ${defenderName}…`
        : `👑 ${defenderName} rises. The world itself holds its breath…`,
      shareText: 'The duel begins.', transcriptIndex: null,
      actorSide: null, targetSide: null, damageCue: null,
    }),
    row({
      kind: 'initiative', tone: 'faint',
      displayText: `Initiative: ${settlement.transcript.turnA0 ? championName : defenderName} moves first (AGI ${
        settlement.transcript.turnA0
          ? `${settlement.transcript.A.agi} vs ${settlement.transcript.B.agi}`
          : `${settlement.transcript.B.agi} vs ${settlement.transcript.A.agi}`
      }).`,
      shareText: `Initiative: ${settlement.transcript.turnA0 ? championName : defenderName} moves first.`,
      transcriptIndex: null,
      actorSide: settlement.transcript.turnA0 ? 'A' : 'B',
      targetSide: settlement.transcript.turnA0 ? 'B' : 'A', damageCue: null,
    }),
  ]);
  const stats = { A: tally(), B: tally() };
  const steps: CombatChronicleStepV1[] = [];

  for (let transcriptIndex = 0; transcriptIndex < settlement.transcript.log.length; transcriptIndex++) {
    const event = settlement.transcript.log[transcriptIndex]!;
    const hpA = numberField(event.hpA, 'hpA');
    const hpB = numberField(event.hpB, 'hpB');
    const rows: CombatChronicleRowV1[] = [];
    if (event.tick === true) {
      const bA = numberField(event.bA, 'burn A');
      const bB = numberField(event.bB, 'burn B');
      const rA = numberField(event.rA, 'regen A');
      const rB = numberField(event.rB, 'regen B');
      const display: string[] = [];
      const plain: string[] = [];
      if (bA) { display.push(`${championName} burns for ${bA}`); plain.push(`${championName} burns for ${bA}`); }
      if (bB) { display.push(`${defenderName} burns for ${bB}`); plain.push(`${defenderName} burns for ${bB}`); }
      if (rA) { display.push(`${championName} knits ${rA} back`); plain.push(`${championName} knits ${rA} back`); }
      if (rB) { display.push(`${defenderName} knits ${rB} back`); plain.push(`${defenderName} knits ${rB} back`); }
      stats.A.burn += bB;
      stats.B.burn += bA;
      stats.A.heal += rA;
      stats.B.heal += rB;
      rows.push(row({
        kind: 'tick', tone: bA || bB ? 'burn' : 'heal',
        displayText: `— ${display.join(' · ')}`, shareText: `   ...${plain.join(' / ')}`,
        transcriptIndex, actorSide: null, targetSide: null, damageCue: null,
      }));
    } else if (event.stun === true) {
      const actor = stringField(event.an, 'stunned attacker');
      const target = stringField(event.dn, 'stun target');
      const sides = sideForNames(actor, target, championName, defenderName);
      stats[sides[0] ?? 'A'].miss++;
      rows.push(row({
        kind: 'stun', tone: 'stun',
        displayText: `${actor} is staggered — the strike never comes!`,
        shareText: `${actor} is staggered — the strike never comes!`,
        transcriptIndex, actorSide: sides[0], targetSide: sides[1], damageCue: null,
      }));
    } else if (event.dodge === true) {
      const actor = stringField(event.an, 'dodging attacker');
      const target = stringField(event.dn, 'dodging defender');
      const sides = sideForNames(actor, target, championName, defenderName);
      stats[sides[0] ?? 'A'].miss++;
      rows.push(row({
        kind: 'dodge', tone: 'miss',
        displayText: `${actor} lunges — but ${target} ${pick(['slips aside', 'melts away', 'is simply not there'])}!`,
        shareText: `${actor} lunges — but ${target} evades!`,
        transcriptIndex, actorSide: sides[0], targetSide: sides[1], damageCue: null,
      }));
    } else {
      const side = event.side;
      if (side !== 'A' && side !== 'B') throw new TypeError('registered combat transcript damage side is invalid');
      const targetSide: CombatCueSide = side === 'A' ? 'B' : 'A';
      const actor = stringField(event.an, 'attacker');
      const target = stringField(event.dn, 'defender');
      const damage = numberField(event.dmg, 'damage');
      const critical = booleanField(event.crit, 'critical');
      const firstStrike = booleanField(event.fs, 'first strike');
      const execute = booleanField(event.ex, 'execute');
      const stagger = booleanField(event.stp, 'stagger');
      const thorns = numberField(event.tb, 'thorns');
      const lifesteal = numberField(event.ls, 'lifesteal');
      const defenderMax = side === 'A' ? settlement.transcript.maxB : settlement.transcript.maxA;
      const fraction = damage / Math.max(1, defenderMax);
      const verbs = VERBS[fraction < 0.06 ? 0 : fraction < 0.12 ? 1 : fraction < 0.2 ? 2 : fraction < 0.3 ? 3 : 4];
      const verb = pick(verbs);
      const rawAbility = rawAbilityName(settlement, side);
      const ability = rawAbility ?? 'its art';
      let display = `${critical ? 'CRITICAL! ' : ''}${actor}`
        + (firstStrike ? `, striking from ${pick(['ambush', 'the first breath', 'nowhere'])},` : '')
        + ` ${verb} ${target} with ${ability} for ${damage}`
        + (execute ? ' — punishing the wounded' : '')
        + (stagger ? ` — ${target} reels, staggered` : '');
      let plain = `${critical ? 'CRITICAL! ' : ''}${actor}${firstStrike ? ' (first strike)' : ''}`
        + ` ${verb} ${target} with ${ability} for ${damage}`
        + (execute ? ' (execute)' : '') + (stagger ? ' (stagger)' : '');
      if (thorns) { display += ` — thorns bite back for ${thorns}`; plain += ` — thorns recoil ${thorns}`; }
      if (lifesteal) { display += ` — and drinks ${lifesteal} vitality`; plain += ` — drains ${lifesteal}`; }
      const damageCue = matchingDamageCue(cuePlan, transcriptIndex);
      if (damageCue.actorSide !== side || damageCue.targetSide !== targetSide
        || damageCue.impact?.damage !== damage) {
        throw new TypeError('registered combat damage cue does not match its transcript row');
      }
      rows.push(row({
        kind: 'damage', tone: critical ? 'critical' : 'damage',
        displayText: `${display}.`, shareText: `${plain}.`, transcriptIndex,
        actorSide: side, targetSide, damageCue,
      }));
      const own = stats[side];
      const other = stats[targetSide];
      own.hit++;
      own.dealt += damage;
      if (critical) own.crit++;
      if (damage > own.big) own.big = damage;
      if (stagger) own.stun++;
      if (lifesteal) own.heal += lifesteal;
      if (thorns) other.thorn += thorns;
      const downed = side === 'A' && hpB <= 0 ? defenderName : side === 'B' && hpA <= 0 ? championName : null;
      if (downed !== null) rows.push(row({
        kind: 'death', tone: 'death',
        displayText: `☠ ${downed} falls — slain by ${actor}’s ${rawAbility ?? 'final blow'}.`,
        shareText: `*** ${downed} falls — slain by ${actor}.`, transcriptIndex,
        actorSide: side, targetSide, damageCue: null,
      }));
    }
    steps.push(Object.freeze({ transcriptIndex, hpA, hpB, rows: Object.freeze(rows) }));
  }

  const lineA = statisticsLine(championName, stats.A);
  const lineB = statisticsLine(defenderName, stats.B);
  const statisticsRows = Object.freeze([lineA, lineB].map((text) => row({
    kind: 'statistics', tone: 'statistics', displayText: `📊 ${text}`, shareText: `-- ${text}`,
    transcriptIndex: null, actorSide: null, targetSide: null, damageCue: null,
  })));
  const winnerSide = settlement.transcript.winner;
  const winnerName = winnerSide === 'A' ? championName : winnerSide === 'B' ? defenderName : null;
  const resultText = winnerSide === 'A'
    ? `🏴 World settled! ${championName} triumphs — bioscans here are safe and ☄ Stardust awaits.`
    : settlement.champion.kind === 'player'
      ? '💀 You were overpowered. The world holds.'
      : settlement.injury.status === 'set-hurt' && settlement.injury.reason === 'bred-crawl-home'
        ? `🩸 ${championName} was broken — it crawls home Critical. The world holds.`
        : `💀 ${championName} fell — lost forever. The world holds.`;
  const classLine = (name: string, statsBlock: CombatSettlementPlanV1['transcript']['A']): string => {
    const cls = statsBlock.cls;
    return name + (cls ? ` (${cls} Lv${statsBlock.lvl})` : '');
  };
  const allShareRows = [...initialRows, ...steps.flatMap((step) => step.rows), ...statisticsRows];
  const shareText = '⚔ BATTLE LOG — Celestial Frontier\n'
    + `${classLine(championName, settlement.transcript.A)} vs ${classLine(defenderName, settlement.transcript.B)}\n`
    + `Power ${settlement.transcript.A.total} vs ${settlement.transcript.B.total}\n\n`
    + `${allShareRows.map((entry) => entry.shareText).join('\n')}\n\n`
    + (winnerName ? `Winner: ${winnerName}` : 'A draw — both champions stand.');
  const chronicle: CombatChronicleV1 = Object.freeze({
    schema: COMBAT_CHRONICLE_SCHEMA_V1,
    battleId: settlement.battleId,
    transcriptFingerprint: settlement.transcriptFingerprint,
    championName,
    defenderName,
    maxHpA: settlement.transcript.maxA,
    maxHpB: settlement.transcript.maxB,
    initialRows,
    steps: Object.freeze(steps),
    statisticsRows,
    winnerSide,
    resultText,
    shareText,
  });
  CHRONICLES.add(chronicle);
  return chronicle;
}

function receiptKey(receipt: AudioCounterpartReceipt): string {
  return `${receipt.counterpartKey}\u0000${receipt.eventKey}\u0000${receipt.generation}`;
}

function visible(element: HTMLElement, root: HTMLElement, mount: HTMLElement): boolean {
  if (!element.isConnected || !mount.isConnected || !root.isConnected
    || !mount.contains(element) || !root.contains(mount)) return false;
  for (let cursor: HTMLElement | null = element; cursor !== null; cursor = cursor.parentElement) {
    if (cursor.hidden || cursor.hasAttribute('inert') || cursor.getAttribute('aria-hidden') === 'true'
      || cursor.style.display === 'none' || cursor.style.visibility === 'hidden') return false;
    if (cursor === root) break;
  }
  return true;
}

export class CombatChronicleController {
  readonly #root: HTMLElement;
  readonly #document: Document;
  readonly #onCue: ((emission: CombatChronicleCueEmissionV1) => void) | undefined;
  readonly #onShare: CombatChronicleControllerOptions['onShare'];
  readonly #onStopVoices: CombatChronicleControllerOptions['onStopVoices'];
  #mount: HTMLElement | null = null;
  #chronicle: CombatChronicleV1 | null = null;
  #cuePlan: CombatCuePlanV1 | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #nextStep = 0;
  #generation = 0;
  #captionOwners = new Map<string, HTMLElement>();
  #playedCueIds = new Set<string>();
  #preludePending = false;
  #hidden = false;
  #disposed = false;

  constructor(options: CombatChronicleControllerOptions) {
    if (!options?.root) throw new TypeError('Combat Chronicle controller requires a root');
    this.#root = options.root;
    this.#document = options.root.ownerDocument;
    this.#onCue = options.onCue ?? options.onDamageCue;
    this.#onShare = options.onShare;
    this.#onStopVoices = options.onStopVoices;
    this.#root.addEventListener('click', this.#onClick);
    this.#document.addEventListener('visibilitychange', this.#onVisibilityChange);
  }

  get presentationGeneration(): number { return this.#generation; }

  attach(mount: HTMLElement): void {
    this.#assertLive();
    if (!this.#root.contains(mount)) throw new Error('Combat Chronicle mount must belong to root');
    if (this.#mount && this.#mount !== mount) this.#cancel('replace', true);
    this.#mount = mount;
  }

  start(chronicle: CombatChronicleV1, cuePlan: CombatCuePlanV1): number {
    this.#assertLive();
    if (!isCombatChronicleV1(chronicle)) throw new TypeError('projected Combat Chronicle is required');
    if (!isCombatCuePlanV1(cuePlan)
      || cuePlan.battleId !== chronicle.battleId
      || cuePlan.transcriptFingerprint !== chronicle.transcriptFingerprint) {
      throw new TypeError('registered matching combat cue plan is required');
    }
    if (this.#mount === null) throw new Error('Combat Chronicle must be attached before start');
    if (this.#chronicle !== null) this.#cancel('replace', true);
    this.#generation++;
    this.#chronicle = chronicle;
    this.#cuePlan = cuePlan;
    this.#nextStep = 0;
    this.#captionOwners.clear();
    this.#playedCueIds.clear();
    this.#preludePending = true;
    this.#mount.replaceChildren();
    this.#mount.dataset.combatChronicleGeneration = String(this.#generation);
    const log = this.#document.createElement('div');
    this.#mount.append(this.#createHpOwner('A', chronicle.championName, chronicle.maxHpA));
    this.#mount.append(this.#createHpOwner('B', chronicle.defenderName, chronicle.maxHpB));
    log.dataset.combatChronicleLog = 'true';
    log.setAttribute('aria-label', 'Combat Chronicle');
    this.#mount.append(log);
    for (const initial of chronicle.initialRows) this.#appendRow(initial, false);
    const skip = this.#document.createElement('button');
    skip.type = 'button';
    skip.dataset.combatChronicleSkip = 'true';
    skip.style.minHeight = '44px';
    skip.textContent = '⚔ Skip';
    this.#mount.append(skip);
    if (this.#hidden || !visible(this.#mount, this.#root, this.#mount)) {
      this.#cancel('hidden', true);
      return this.#generation;
    }
    this.#schedule(COMBAT_CHRONICLE_START_DELAY_MS);
    return this.#generation;
  }

  counterpartIsCurrent(receipt: AudioCounterpartReceipt): boolean {
    if (receipt === null || typeof receipt !== 'object'
      || typeof receipt.counterpartKey !== 'string'
      || typeof receipt.eventKey !== 'string'
      || !Number.isSafeInteger(receipt.generation)
      || receipt.generation !== this.#generation
      || this.#mount === null || this.#chronicle === null || this.#hidden) return false;
    const caption = this.#captionOwners.get(receiptKey(receipt));
    return caption !== undefined
      && visible(caption, this.#root, this.#mount);
  }

  setHidden(hidden: boolean): void {
    this.#assertLive();
    this.#hidden = hidden;
    if (hidden) this.#cancel('hidden', true);
  }

  close(): void {
    if (this.#disposed) return;
    this.#cancel('close', true);
  }

  detach(): void {
    if (this.#disposed) return;
    this.#cancel('detach', true);
    this.#mount = null;
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#cancel('dispose', true);
    this.#root.removeEventListener('click', this.#onClick);
    this.#document.removeEventListener('visibilitychange', this.#onVisibilityChange);
    this.#mount = null;
    this.#disposed = true;
  }

  readonly #onClick = (event: Event): void => {
    const view = this.#document.defaultView;
    const target = event.target;
    if (!view || !(target instanceof view.Element) || this.#mount === null) return;
    const skip = target.closest<HTMLButtonElement>('button[data-combat-chronicle-skip]');
    if (skip && this.#mount.contains(skip) && !skip.disabled) {
      event.stopPropagation();
      this.#clearTimer();
      this.#onStopVoices?.('skip', this.#generation);
      skip.remove();
      this.#renderRemainderSynchronously();
      return;
    }
    const share = target.closest<HTMLButtonElement>('button[data-combat-chronicle-share]');
    if (share && this.#mount.contains(share) && !share.disabled && this.#chronicle !== null) {
      event.stopPropagation();
      this.#onShare?.(this.#chronicle.shareText);
    }
  };

  readonly #onVisibilityChange = (): void => {
    if (this.#document.hidden) this.#cancel('hidden', true);
  };

  #appendRow(entry: CombatChronicleRowV1, audible: boolean): void {
    const log = this.#mount?.querySelector<HTMLElement>('[data-combat-chronicle-log]');
    if (log === null || log === undefined) return;
    const caption = this.#document.createElement('div');
    caption.dataset.combatChronicleKind = entry.kind;
    caption.dataset.combatChronicleTone = entry.tone;
    if (entry.actorSide !== null) caption.dataset.combatActorSide = entry.actorSide;
    if (entry.targetSide !== null) caption.dataset.combatTargetSide = entry.targetSide;
    caption.textContent = entry.displayText;
    log.append(caption);
    const cues = this.#cuesForRow(entry);
    for (const cue of cues) {
      const counterpart = cue.counterparts[0];
      if (counterpart === undefined || counterpart.family !== cue.families[0]
        || this.#cuePlan === null) continue;
      const receipt: AudioCounterpartReceipt = Object.freeze({
        counterpartKey: counterpart.captionToken,
        eventKey: cue.cueId,
        generation: this.#generation,
      });
      if (!caption.dataset.combatCaptionToken) {
        caption.dataset.combatCaptionToken = receipt.counterpartKey;
        caption.dataset.combatCueId = receipt.eventKey;
        caption.dataset.combatPresentationGeneration = String(receipt.generation);
      }
      this.#captionOwners.set(receiptKey(receipt), caption);
      if (audible) this.#emitCue(cue, receipt);
    }
  }

  #cuesForRow(entry: CombatChronicleRowV1): readonly CombatCueV1[] {
    const plan = this.#cuePlan;
    if (plan === null || entry.kind === 'statistics' || entry.kind === 'death') return [];
    if (entry.kind === 'intro') {
      return plan.cues.filter((cue) => cue.stage === 'prelude'
        && cue.families[0] === 'guardian-entrance');
    }
    if (entry.kind === 'initiative') {
      return plan.cues.filter((cue) => cue.stage === 'prelude'
        && cue.families[0] === 'initiative');
    }
    if (entry.transcriptIndex === null) return [];
    return plan.cues.filter((cue) => cue.stage === 'transcript'
      && cue.transcriptIndex === entry.transcriptIndex);
  }

  #emitCue(cue: CombatCueV1, receipt: AudioCounterpartReceipt): void {
    const plan = this.#cuePlan;
    if (plan === null || this.#playedCueIds.has(cue.cueId)
      || !this.counterpartIsCurrent(receipt)) return;
    this.#playedCueIds.add(cue.cueId);
    this.#onCue?.(Object.freeze({ plan, cue, counterpart: receipt }));
  }

  #emitPrelude(): void {
    if (!this.#preludePending || this.#cuePlan === null) return;
    this.#preludePending = false;
    for (const cue of this.#cuePlan.cues) {
      if (cue.stage !== 'prelude') continue;
      const counterpart = cue.counterparts[0];
      if (counterpart === undefined) continue;
      this.#emitCue(cue, Object.freeze({
        counterpartKey: counterpart.captionToken,
        eventKey: cue.cueId,
        generation: this.#generation,
      }));
    }
  }

  #schedule(delay: number): void {
    this.#timer = setTimeout(() => {
      this.#timer = null;
      this.#advance(true);
    }, delay);
  }

  #advance(audible: boolean): void {
    const chronicle = this.#chronicle;
    if (chronicle === null || this.#mount === null) return;
    if (this.#hidden || !visible(this.#mount, this.#root, this.#mount)) {
      this.#cancel('hidden', true);
      return;
    }
    if (audible) this.#emitPrelude();
    if (this.#nextStep >= chronicle.steps.length) {
      this.#finish(audible);
      return;
    }
    const step = chronicle.steps[this.#nextStep++]!;
    this.#renderStep(step, audible);
    this.#schedule(COMBAT_CHRONICLE_ROW_DELAY_MS);
  }

  #renderRemainderSynchronously(): void {
    const chronicle = this.#chronicle;
    if (chronicle === null) return;
    while (this.#nextStep < chronicle.steps.length) {
      const step = chronicle.steps[this.#nextStep++]!;
      this.#renderStep(step, false);
    }
    this.#finish(false);
  }

  #finish(audible: boolean): void {
    const chronicle = this.#chronicle;
    const mount = this.#mount;
    if (chronicle === null || mount === null
      || mount.querySelector('[data-combat-chronicle-share]')) return;
    mount.querySelector('[data-combat-chronicle-skip]')?.remove();
    for (const entry of chronicle.statisticsRows) this.#appendRow(entry, false);
    const result = this.#document.createElement('p');
    result.dataset.combatChronicleResult = chronicle.winnerSide ?? 'draw';
    result.textContent = chronicle.resultText;
    mount.append(result);
    if (this.#cuePlan !== null) {
      for (const cue of this.#cuePlan.cues) {
        if (cue.stage !== 'resolution') continue;
        const counterpart = cue.counterparts[0];
        if (counterpart === undefined) continue;
        const receipt: AudioCounterpartReceipt = Object.freeze({
          counterpartKey: counterpart.captionToken,
          eventKey: cue.cueId,
          generation: this.#generation,
        });
        if (!result.dataset.combatCaptionToken) {
          result.dataset.combatCaptionToken = receipt.counterpartKey;
          result.dataset.combatCueId = receipt.eventKey;
          result.dataset.combatPresentationGeneration = String(receipt.generation);
        }
        this.#captionOwners.set(receiptKey(receipt), result);
        if (audible) this.#emitCue(cue, receipt);
      }
    }
    const share = this.#document.createElement('button');
    share.type = 'button';
    share.dataset.combatChronicleShare = 'true';
    share.style.minHeight = '44px';
    share.style.width = '100%';
    share.textContent = '⇪ Share battle log';
    mount.append(share);
  }

  #createHpOwner(side: CombatCueSide, name: string, maximum: number): HTMLElement {
    const owner = this.#document.createElement('div');
    owner.dataset.combatHpSide = side;
    const label = this.#document.createElement('span');
    label.dataset.combatHpName = side;
    label.textContent = name;
    const progress = this.#document.createElement('progress');
    progress.dataset.combatHpProgress = side;
    progress.max = maximum;
    progress.value = maximum;
    progress.setAttribute('aria-label', `${name} HP`);
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', String(maximum));
    progress.setAttribute('aria-valuenow', String(maximum));
    progress.setAttribute('aria-valuetext', `${maximum} of ${maximum} HP for ${name}`);
    const value = this.#document.createElement('output');
    value.dataset.combatHpCurrent = side;
    value.textContent = `${maximum} / ${maximum}`;
    owner.append(label, progress, value);
    return owner;
  }

  #renderStep(step: CombatChronicleStepV1, audible: boolean): void {
    for (const entry of step.rows) this.#appendRow(entry, audible);
    this.#setHp('A', step.hpA, this.#chronicle?.maxHpA ?? step.hpA);
    this.#setHp('B', step.hpB, this.#chronicle?.maxHpB ?? step.hpB);
  }

  #setHp(side: CombatCueSide, current: number, maximum: number): void {
    const progress = this.#mount?.querySelector<HTMLProgressElement>(
      `progress[data-combat-hp-progress="${side}"]`,
    );
    const value = this.#mount?.querySelector<HTMLOutputElement>(
      `output[data-combat-hp-current="${side}"]`,
    );
    if (!progress || !value) return;
    progress.max = maximum;
    progress.value = current;
    progress.setAttribute('aria-valuemax', String(maximum));
    progress.setAttribute('aria-valuenow', String(current));
    const name = this.#mount?.querySelector<HTMLElement>(`[data-combat-hp-name="${side}"]`)
      ?.textContent ?? (side === 'A' ? this.#chronicle?.championName : this.#chronicle?.defenderName) ?? '';
    progress.setAttribute('aria-valuetext', `${current} of ${maximum} HP for ${name}`);
    value.textContent = `${current} / ${maximum}`;
  }

  #clearTimer(): void {
    if (this.#timer !== null) clearTimeout(this.#timer);
    this.#timer = null;
  }

  #cancel(reason: CombatChronicleStopReasonV1, clearDom: boolean): void {
    const generation = this.#generation;
    const hadPresentation = this.#chronicle !== null;
    this.#clearTimer();
    this.#captionOwners.clear();
    this.#playedCueIds.clear();
    this.#preludePending = false;
    this.#chronicle = null;
    this.#cuePlan = null;
    this.#nextStep = 0;
    if (clearDom) this.#mount?.replaceChildren();
    if (hadPresentation) this.#onStopVoices?.(reason, generation);
  }

  #assertLive(): void {
    if (this.#disposed) throw new Error('Combat Chronicle controller is disposed');
  }
}
