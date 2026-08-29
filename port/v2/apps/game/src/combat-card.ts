/* Arc 6 Survey-card combat presentation.

   This file owns only detached read models, exact legacy 160-run odds, and
   one delegated DOM controller. Main owns navigation/revalidation and the
   durable action. The controller cannot plan a fight, mutate a save, play
   audio, or publish an unverified combat result. */
import {
  battleStats,
  runDuel,
  type BattleStats,
  type CombatSettlementChampionV1,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import { hashInt } from '@cf/domain-rand';
import type { Genome } from '@cf/domain-genome';
import type { OwnershipStateV2 } from '@cf/domain-acquisition';
import type { SaveStateV2 } from '@cf/persistence';
import {
  ARC6_PLAYER_CHAMPION_ID,
  projectArc6CombatChampionAvailabilityV1,
  projectArc6CombatChampionV1,
  type Arc6CombatChampionRosterV1,
} from './arc6-combat-action.js';

export const COMBAT_CARD_READ_MODEL_SCHEMA = 'cf-v2-combat-card-read-model/v1' as const;
export const COMBAT_CARD_OUTCOME_SCHEMA = 'cf-v2-combat-card-outcome/v1' as const;

export type CombatOddsBandV1 = 'Favored' | 'Even' | 'Dangerous' | 'Overwhelming';

export interface CombatCardChampionOptionV1 {
  readonly id: string;
  readonly kind: 'player' | 'owned-fauna';
  readonly label: string;
  readonly power: number;
  readonly ability: string;
  readonly disabled: boolean;
  readonly disabledReason: string | null;
}

export interface CombatCardForecastV1 {
  readonly probability: number;
  readonly percent: string;
  readonly sampleSize: number;
  readonly decisiveRuns: number;
  readonly closeRuns: number;
  readonly band: CombatOddsBandV1;
  readonly color: string;
  readonly why: string;
}

export interface CombatCardReadModelV1 {
  readonly schema: typeof COMBAT_CARD_READ_MODEL_SCHEMA;
  readonly contextKey: string;
  readonly observedActivePlayMs: number;
  readonly defender: Readonly<{
    readonly kind: 'titan' | 'guardian' | 'fauna';
    readonly label: string;
    readonly name: string;
    readonly tier: number;
    readonly power: number;
    readonly ability: string;
  }>;
  readonly championOptions: readonly CombatCardChampionOptionV1[];
  readonly selectedChampionId: string;
  readonly forecast: CombatCardForecastV1;
  readonly stakes: string;
  readonly reward: string;
  readonly policy: string;
  readonly unavailableReason: string | null;
}

export type CombatCardActionRequestV1 =
  | Readonly<{ readonly kind: 'select'; readonly championId: string }>
  | Readonly<{ readonly kind: 'challenge'; readonly championId: string }>;

export interface CombatCardActionOutcomeV1 {
  readonly schema: typeof COMBAT_CARD_OUTCOME_SCHEMA;
  readonly kind: 'verified-win' | 'verified-loss' | 'verified-draw' | 'refused' | 'committed-unknown';
  readonly convergence: 'none' | 'read-only-reload';
  readonly title: string;
  readonly detail: string;
}

function fnv1a32(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function statsSignature(seed: number, stats: BattleStats): string {
  return [
    seed >>> 0, stats.vit, stats.fer, stats.res, stats.agi, stats.ins,
    stats.total, stats.lvl || 0, fnv1a32(JSON.stringify(stats.ab || null)),
  ].join(',');
}

const FORECAST_MEMO = new Map<string, CombatCardForecastV1>();

function oddsBand(probability: number): Readonly<{
  band: CombatOddsBandV1;
  color: string;
}> {
  if (probability >= 0.75) return Object.freeze({ band: 'Favored', color: '#7fe6a0' });
  if (probability >= 0.45) return Object.freeze({ band: 'Even', color: '#ffd96a' });
  if (probability >= 0.15) return Object.freeze({ band: 'Dangerous', color: '#ff8a72' });
  return Object.freeze({ band: 'Overwhelming', color: '#ff5a4a' });
}

function oddsPercent(probability: number): string {
  const rounded = Math.round(probability * 100);
  return rounded <= 0 ? '<1%' : rounded >= 100 ? '>99%' : `${rounded}%`;
}

function whyLine(champion: BattleStats, defender: BattleStats): string {
  const bits: string[] = [];
  if (champion.agi > defender.agi + 8) bits.push('you strike first');
  else if (defender.agi > champion.agi + 8) bits.push('it strikes first');
  if (champion.fer - defender.res * 0.45 > defender.fer - champion.res * 0.45) {
    bits.push('your blows land harder');
  } else bits.push('its blows land harder');
  if (champion.vit * 3 > defender.vit * 3 * 1.25) bits.push('you outlast it');
  else if (defender.vit * 3 > champion.vit * 3 * 1.25) bits.push('it outlasts you');
  const abilityName = champion.ab?.n;
  if (typeof abilityName === 'string' && abilityName.length > 0) bits.push(`✧ ${abilityName}`);
  return bits.slice(0, 3).join(' · ');
}

function championCombatant(champion: CombatSettlementChampionV1): Readonly<{
  name: string;
  genome: Readonly<Genome> | { readonly seed: number };
  stats?: BattleStats;
  isPlayer?: boolean;
}> {
  return champion.kind === 'player'
    ? Object.freeze({
      name: champion.name,
      genome: Object.freeze({ seed: champion.genomeSeed }),
      stats: champion.stats as BattleStats,
      isPlayer: true,
    })
    : Object.freeze({ name: champion.name, genome: champion.genome });
}

/** Exact legacy `trueOdds`/`oddsBand`/`oddsWhy` projection. It changes only
 * the champion pairing seed; the actual settlement still runs its one
 * canonical unvaried duel. */
export function projectCombatCardForecastV1(
  champion: CombatSettlementChampionV1,
  encounter: GuardianPrimeEncounterV1,
  sampleSize = 160,
): CombatCardForecastV1 {
  if (!Number.isSafeInteger(sampleSize) || sampleSize < 1 || sampleSize > 1_000) {
    throw new RangeError('combat forecast sample size must be 1–1000');
  }
  const projected = championCombatant(champion);
  const championSeed = projected.genome.seed >>> 0;
  const defenderSeed = encounter.defender.battleGenome.seed >>> 0;
  const championStats = projected.stats ?? battleStats(projected.genome as Genome);
  const defenderStats = battleStats(encounter.defender.battleGenome as Genome);
  const key = `${statsSignature(championSeed, championStats)}|${statsSignature(defenderSeed, defenderStats)}|${sampleSize}`;
  const memo = FORECAST_MEMO.get(key);
  if (memo !== undefined) return memo;
  let wins = 0;
  let decisiveRuns = 0;
  let closeRuns = 0;
  for (let index = 0; index < sampleSize; index++) {
    const variedGenome = Object.freeze({
      ...projected.genome,
      seed: hashInt(championSeed, index, 0x51ee) >>> 0,
    }) as unknown as Genome;
    const result = runDuel({
      name: projected.name,
      genome: variedGenome,
      stats: championStats,
      isPlayer: projected.isPlayer,
    }, {
      name: encounter.defender.name,
      genome: encounter.defender.battleGenome as Genome,
      stats: defenderStats,
    });
    if (result.winner !== 'A' && result.winner !== 'B') continue;
    decisiveRuns++;
    if (result.winner === 'A') wins++;
    const hpA = typeof result.hpA === 'number' ? result.hpA : 0;
    const hpB = typeof result.hpB === 'number' ? result.hpB : 0;
    const maxA = typeof result.maxA === 'number' ? result.maxA : 1;
    const maxB = typeof result.maxB === 'number' ? result.maxB : 1;
    if (Math.abs(hpA / Math.max(1, maxA) - hpB / Math.max(1, maxB)) < 0.15) closeRuns++;
  }
  const probability = decisiveRuns > 0 ? wins / decisiveRuns : 0.5;
  const band = oddsBand(probability);
  const result = Object.freeze({
    probability,
    percent: oddsPercent(probability),
    sampleSize,
    decisiveRuns,
    closeRuns,
    band: band.band,
    color: band.color,
    why: whyLine(championStats, defenderStats),
  });
  if (FORECAST_MEMO.size > 400) FORECAST_MEMO.clear();
  FORECAST_MEMO.set(key, result);
  return result;
}

function abilityName(stats: BattleStats): string {
  return typeof stats.ab?.n === 'string' && stats.ab.n.length > 0
    ? stats.ab.n : 'Unknown ability';
}

function championOption(
  champion: CombatSettlementChampionV1,
  state: SaveStateV2,
  companionDisabledReason: string | null,
): CombatCardChampionOptionV1 {
  const stats = champion.kind === 'player'
    ? champion.stats as BattleStats : battleStats(champion.genome as Genome);
  const tooWounded = champion.kind === 'player'
    && champion.currentHp < Math.ceil(state.HP_MAX * 0.25);
  return Object.freeze({
    id: champion.kind === 'player' ? ARC6_PLAYER_CHAMPION_ID : champion.creatureId,
    kind: champion.kind,
    label: champion.kind === 'player'
      ? `${champion.name} — ${champion.currentHp}/${state.HP_MAX} HP`
      : champion.name,
    power: stats.total,
    ability: abilityName(stats),
    disabled: tooWounded || companionDisabledReason !== null,
    disabledReason: tooWounded
      ? 'Below quarter health; mend or send a creature.' : companionDisabledReason,
  });
}

function stakesFor(champion: CombatSettlementChampionV1): string {
  if (champion.kind === 'player') {
    return 'Loss wounds you but never kills you; your HP stops at 1.';
  }
  const hurt = typeof champion.genome.hurt === 'number' ? champion.genome.hurt : 0;
  if (champion.legacyBredLineage && hurt < 0.85) {
    return 'First bred-line defeat: crawls home Critical. Fielding it Critical risks permanent loss.';
  }
  return champion.legacyBredLineage
    ? 'Critical repeat defeat: this champion is permanently lost.'
    : 'Defeat: this wild or unbred champion is permanently lost.';
}

/** Project one truthful current card. No candidate other than the selected
 * champion pays the 160-duel simulation cost. */
export function projectCombatCardReadModelV1(input: Readonly<{
  readonly contextKey: string;
  readonly encounter: GuardianPrimeEncounterV1;
  readonly state: SaveStateV2;
  readonly ownershipV2: OwnershipStateV2;
  readonly championRoster: Arc6CombatChampionRosterV1;
  readonly observedActivePlayMs: number;
  readonly selectedChampionId: string | null;
  readonly unavailableReason: string | null;
}>): CombatCardReadModelV1 | null {
  const champions: Array<Readonly<{
    champion: CombatSettlementChampionV1;
    disabledReason: string | null;
  }>> = [];
  const playerAvailability = projectArc6CombatChampionAvailabilityV1({
    ownershipV2: input.ownershipV2,
    guardianRoster: input.championRoster,
    championId: ARC6_PLAYER_CHAMPION_ID,
    observedActivePlayMs: input.observedActivePlayMs,
  });
  if (playerAvailability.kind !== 'available') return null;
  const player = projectArc6CombatChampionV1({
    state: input.state,
    ownershipV2: input.ownershipV2,
    guardianRoster: input.championRoster,
    championId: ARC6_PLAYER_CHAMPION_ID,
  });
  if (player !== null) champions.push(Object.freeze({ champion: player, disabledReason: null }));
  for (const row of input.championRoster.champions) {
    const creature = row.creature;
    const champion = projectArc6CombatChampionV1({
      state: input.state,
      ownershipV2: input.ownershipV2,
      guardianRoster: input.championRoster,
      championId: creature.creatureId,
    });
    if (champion === null) continue;
    const availability = projectArc6CombatChampionAvailabilityV1({
      ownershipV2: input.ownershipV2,
      guardianRoster: input.championRoster,
      championId: creature.creatureId,
      observedActivePlayMs: input.observedActivePlayMs,
    });
    champions.push(Object.freeze({
      champion,
      disabledReason: availability.kind === 'available'
        ? null : availability.detail,
    }));
  }
  if (champions.length === 0) return null;
  const options = champions.map(({ champion, disabledReason }) => (
    championOption(champion, input.state, disabledReason)
  ));
  const requested = input.selectedChampionId === null ? -1
    : options.findIndex((row) => row.id === input.selectedChampionId && !row.disabled);
  const firstEnabled = options.findIndex((row) => !row.disabled);
  const selectedIndex = requested >= 0 ? requested : firstEnabled >= 0 ? firstEnabled : 0;
  const selected = champions[selectedIndex]!.champion;
  const selectedOption = options[selectedIndex]!;
  const defenderStats = battleStats(input.encounter.defender.battleGenome as Genome);
  const defenderLabel = input.encounter.defender.kind === 'titan'
    ? 'Elemental Titan' : input.encounter.defender.kind === 'guardian'
      ? 'Apex Guardian' : 'Apex native';
  return Object.freeze({
    schema: COMBAT_CARD_READ_MODEL_SCHEMA,
    contextKey: input.contextKey,
    observedActivePlayMs: input.observedActivePlayMs,
    defender: Object.freeze({
      kind: input.encounter.defender.kind,
      label: defenderLabel,
      name: input.encounter.defender.name,
      tier: input.encounter.defender.tier,
      power: defenderStats.total,
      ability: abilityName(defenderStats),
    }),
    championOptions: Object.freeze(options),
    selectedChampionId: selectedOption.id,
    forecast: projectCombatCardForecastV1(selected, input.encounter),
    stakes: stakesFor(selected),
    reward: input.encounter.defender.kind === 'titan'
      ? 'Win: conquer the world, capture the Titan, claim its Prime Signature, earn exact Stardust and champion XP.'
      : input.encounter.defender.kind === 'guardian'
        ? 'Win: conquer the world, capture its Guardian, and earn exact Stardust and champion XP.'
        : 'Win: conquer the world and earn exact Stardust and champion XP.',
    policy: 'Current conquest fields one champion. Party roles and retreat remain a named design gate; no hidden tactics are implied.',
    unavailableReason: input.unavailableReason ?? selectedOption.disabledReason,
  });
}

function esc(value: unknown): string {
  return String(value).replace(/[&<>"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  })[character]!);
}

export class CombatCardController {
  readonly #root: HTMLElement;
  readonly #onNativeChallengeGesture: (() => void) | null;
  readonly #onAction: (request: CombatCardActionRequestV1) => void;
  #mount: HTMLElement | null = null;
  #model: CombatCardReadModelV1 | null = null;
  #pending: Readonly<{ championId: string; contextKey: string }> | null = null;
  #outcome: CombatCardActionOutcomeV1 | null = null;
  #convergence = false;
  #disposed = false;
  #onChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement) || !target.matches('[data-combat-champion]')) return;
    const championId = target.value;
    if (!this.#model?.championOptions.some((row) => (
      row.id === championId && !row.disabled
    ))) return;
    this.#onAction(Object.freeze({ kind: 'select', championId }));
  };
  #onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-combat-challenge]');
    if (button === null || this.#model === null || this.#pending !== null || this.#convergence) return;
    const option = this.#model.championOptions.find((row) => (
      row.id === this.#model!.selectedChampionId
    ));
    if (!option || option.disabled || this.#model.unavailableReason !== null) return;
    if (event.isTrusted) this.#onNativeChallengeGesture?.();
    this.#pending = Object.freeze({
      championId: option.id,
      contextKey: this.#model.contextKey,
    });
    this.#outcome = null;
    this.#render();
    this.#onAction(Object.freeze({ kind: 'challenge', championId: option.id }));
  };

  constructor(options: Readonly<{
    readonly root: HTMLElement;
    readonly onNativeChallengeGesture?: () => void;
    readonly onAction: (request: CombatCardActionRequestV1) => void;
  }>) {
    this.#root = options.root;
    this.#onNativeChallengeGesture = options.onNativeChallengeGesture ?? null;
    this.#onAction = options.onAction;
    this.#root.addEventListener('change', this.#onChange);
    this.#root.addEventListener('click', this.#onClick);
  }

  attach(mount: HTMLElement): void {
    if (this.#disposed) throw new Error('combat card controller is disposed');
    this.#mount = mount;
    this.#render();
  }

  detach(): void {
    this.#mount?.replaceChildren();
    this.#mount = null;
  }

  setState(model: CombatCardReadModelV1 | null): void {
    if (model !== null && (model.schema !== COMBAT_CARD_READ_MODEL_SCHEMA
      || !Object.isFrozen(model) || !Object.isFrozen(model.championOptions))) {
      throw new TypeError('combat card requires one frozen v1 read model');
    }
    if (this.#pending !== null && model?.contextKey !== this.#pending.contextKey) return;
    this.#model = model;
    if (model === null) this.#outcome = null;
    this.#render();
  }

  settle(outcome: CombatCardActionOutcomeV1): void {
    if (outcome.schema !== COMBAT_CARD_OUTCOME_SCHEMA || !Object.isFrozen(outcome)) {
      throw new TypeError('combat card requires one frozen v1 action outcome');
    }
    if (this.#pending === null) throw new Error('combat card has no pending challenge to settle');
    this.#pending = null;
    this.#outcome = outcome;
    this.#convergence = outcome.convergence === 'read-only-reload';
    this.#render();
  }

  clearPending(): void {
    this.#pending = null;
    this.#render();
  }

  dispose(): void {
    if (this.#disposed) return;
    this.detach();
    this.#root.removeEventListener('change', this.#onChange);
    this.#root.removeEventListener('click', this.#onClick);
    this.#model = null;
    this.#pending = null;
    this.#outcome = null;
    this.#disposed = true;
  }

  #render(): void {
    if (this.#mount === null) return;
    const model = this.#model;
    if (model === null) {
      this.#mount.replaceChildren();
      return;
    }
    const pending = this.#pending !== null;
    const selected = model.championOptions.find((row) => row.id === model.selectedChampionId)!;
    const disabled = pending || this.#convergence || selected.disabled
      || model.unavailableReason !== null;
    const options = model.championOptions.map((row) => (
      `<option value="${esc(row.id)}"${row.id === model.selectedChampionId ? ' selected' : ''}${row.disabled ? ' disabled' : ''}>`+
      `${esc(row.label)} · ${row.power} power · ${esc(row.ability)}`+
      `${row.disabledReason === null ? '' : ` — ${esc(row.disabledReason)}`}</option>`
    )).join('');
    const status = this.#outcome === null
      ? model.unavailableReason ?? (pending ? 'The duel is settling. Do not press again.' : '')
      : `${this.#outcome.title} ${this.#outcome.detail}`;
    this.#mount.innerHTML =
      '<h3 class="combat-card-title">⚔ Conquest challenge</h3>' +
      `<p class="combat-card-defender"><b>${esc(model.defender.label)}:</b> ${esc(model.defender.name)} · tier ${model.defender.tier} · ${model.defender.power} power · ✧ ${esc(model.defender.ability)}</p>` +
      '<label class="combat-card-label" for="combat-champion-select">Choose your champion</label>' +
      `<select id="combat-champion-select" data-combat-champion data-focus-key="combat-champion"${pending || this.#convergence ? ' disabled' : ''}>${options}</select>` +
      `<div class="combat-card-forecast" style="--combat-odds-color:${esc(model.forecast.color)}"><b>${esc(model.forecast.band)} · ${esc(model.forecast.percent)}</b> over ${model.forecast.sampleSize} deterministic simulations</div>` +
      `<p class="combat-card-why">${esc(model.forecast.why)}</p>` +
      `<p class="combat-card-stakes"><b>Risk:</b> ${esc(model.stakes)}</p>` +
      `<p class="combat-card-reward"><b>Outcome:</b> ${esc(model.reward)}</p>` +
      `<p class="combat-card-policy">${esc(model.policy)}</p>` +
      `<button type="button" data-combat-challenge data-focus-key="combat-challenge"${disabled ? ' disabled' : ''}>${pending ? 'Settling duel…' : `Challenge ${esc(model.defender.name)}`}</button>` +
      `<p class="combat-card-status" role="status" aria-live="polite"${this.#convergence ? ' data-convergence="read-only-reload"' : ''}>${esc(status)}</p>`;
    this.#mount.setAttribute('aria-busy', pending ? 'true' : 'false');
  }
}
