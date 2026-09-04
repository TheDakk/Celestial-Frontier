/* Arc 9 Binder projection and exact set-claim owner.

   The Binder collects canonical species TYPES, never procedural individuals.
   Eight legacy sets can be proven entirely from the current Compendium and
   claimed once through one F4 receipt/CAS. The eighth is Seeker of Legends:
   exact deterministic Paragon identities own its progress. The Finder remains
   read-only; Paragon acquisition is not duplicated outside Discover Life. */
import {
  ABILITY_THEMES,
  STAT_HUES,
  STAT_NAMES,
  abilityTheme,
} from '@cf/domain-combatcore';
import { REALM_ORDER } from '@cf/domain-genome';
import {
  FA_BODY,
  FA_SIZE,
  RARITY_V17,
  STAT_KEYS,
  displayRarity,
} from '@cf/domain-speciestraits';
import { canonicalJson, sha256Hex } from '@cf/domain-acquisition';
import { floraStat } from '@cf/domain-strays';
import type { CodexEntry, SaveStateV2 } from '@cf/persistence';
import {
  prepareArc9ProgressionRefreshV1,
  type Arc9ProgressionProjectionV1,
} from './arc9-progression-projection.js';
import type {
  F4RuntimeActionCommitOutcome,
  F4RuntimeAuthority,
} from './f4-runtime-authority.js';
import {
  ARC9_PARAGON_COUNT_V1,
  ARC9_PARAGON_MILESTONE_COUNT_V1,
  ARC9_PARAGON_MILESTONE_NAME_V1,
  ARC9_PARAGON_MILESTONE_STARDUST_V1,
  projectArc9ParagonCatalogueV1,
  type Arc9ParagonCatalogueSlotV1,
} from './paragon-finder.js';

export const ARC9_BINDER_SET_CLAIM_RECEIPT_KIND_V1 = 'arc9-binder-set-claim-v1' as const;
export const ARC9_BINDER_SET_CLAIM_WITNESS_SCHEMA_V1 =
  'cf-v2-arc9-binder-set-claim-witness/v1' as const;
const ARC9_BINDER_SET_CLAIM_OPERATION_PREFIX_V1 = 'arc9.binder-claim:';
const MAX_CODEX_ROWS = 3_000;
const MAX_CLAIMED_SET_ROWS = 200;
const MAX_STARDUST = Number.MAX_SAFE_INTEGER;

export const ARC9_BINDER_CLAIMABLE_SET_IDS_V1 = Object.freeze([
  'kingdoms', 'flavors', 'themes', 'bodies', 'realms', 'xeno', 'court', 'para10',
] as const);
export type Arc9BinderClaimableSetIdV1 =
  (typeof ARC9_BINDER_CLAIMABLE_SET_IDS_V1)[number];

export interface Arc9BinderSlotV1 {
  readonly id: string;
  readonly label: string;
  readonly have: boolean;
  readonly color: string;
}

export interface Arc9BinderPageV1 {
  readonly id: string;
  readonly icon: string;
  readonly name: string;
  readonly found: number;
  readonly total: number;
  readonly slots: readonly Arc9BinderSlotV1[];
}

export interface Arc9BinderSetV1 {
  readonly id: Arc9BinderClaimableSetIdV1;
  readonly name: string;
  readonly description: string;
  readonly stardust: number;
  readonly progress: string;
  readonly complete: boolean;
  readonly claimed: boolean;
}

export interface Arc9BinderReadModelV1 {
  readonly schema: 'cf-v2-arc9-binder/v1';
  readonly pages: readonly Arc9BinderPageV1[];
  readonly sets: readonly Arc9BinderSetV1[];
  readonly claimedSetIds: readonly string[];
  readonly paragon: Readonly<{
    status: 'finder-ready';
    found: number;
    total: typeof ARC9_PARAGON_COUNT_V1;
    slots: readonly Arc9ParagonCatalogueSlotV1[];
    milestoneClaimed: boolean;
    note: string;
  }>;
}

export type Arc9BinderProjectionV1 =
  | Readonly<{ kind: 'projected'; model: Arc9BinderReadModelV1 }>
  | Readonly<{ kind: 'protected'; reason: string }>;

interface BinderOwnership {
  readonly tiers: ReadonlySet<number>;
  readonly realms: ReadonlySet<string>;
  readonly bodies: ReadonlySet<number>;
  readonly themes: ReadonlySet<string>;
  readonly flavors: ReadonlySet<string>;
  readonly kinds: ReadonlySet<string>;
  readonly sizes: ReadonlySet<number>;
  readonly court: ReadonlySet<number>;
  readonly paragons: number;
  readonly xeno: boolean;
}

interface SetDefinition {
  readonly id: Arc9BinderClaimableSetIdV1;
  readonly name: string;
  readonly description: string;
  readonly stardust: number;
  readonly progress: (ownership: BinderOwnership) => string;
  readonly complete: (ownership: BinderOwnership) => boolean;
}

const KIND_SLOTS = Object.freeze(['Fauna', 'Flora', 'Fungi', 'Microbe'] as const);
const SET_DEFINITIONS: readonly SetDefinition[] = Object.freeze([
  Object.freeze({
    id: 'kingdoms', name: 'Four Crowns', description: 'Own all four kingdoms', stardust: 25,
    progress: (own: BinderOwnership) => `${own.kinds.size} / ${KIND_SLOTS.length}`,
    complete: (own: BinderOwnership) => own.kinds.size >= KIND_SLOTS.length,
  }),
  Object.freeze({
    id: 'flavors', name: 'The Five Flavors',
    description: 'Own a flora of every stat flavor', stardust: 40,
    progress: (own: BinderOwnership) => `${own.flavors.size} / ${STAT_KEYS.length}`,
    complete: (own: BinderOwnership) => own.flavors.size >= STAT_KEYS.length,
  }),
  Object.freeze({
    id: 'themes', name: 'Master of Arts',
    description: 'Own a beast of every ability theme', stardust: 80,
    progress: (own: BinderOwnership) => `${own.themes.size} / ${Object.keys(ABILITY_THEMES).length}`,
    complete: (own: BinderOwnership) => own.themes.size >= Object.keys(ABILITY_THEMES).length,
  }),
  Object.freeze({
    id: 'bodies', name: 'The Bestiary', description: 'Own every fauna body plan', stardust: 80,
    progress: (own: BinderOwnership) => `${own.bodies.size} / ${FA_BODY.length}`,
    complete: (own: BinderOwnership) => own.bodies.size >= FA_BODY.length,
  }),
  Object.freeze({
    id: 'realms', name: 'Warden of Realms',
    description: 'Own a species from every realm', stardust: 100,
    progress: (own: BinderOwnership) => `${own.realms.size} / ${REALM_ORDER.length}`,
    complete: (own: BinderOwnership) => own.realms.size >= REALM_ORDER.length,
  }),
  Object.freeze({
    id: 'xeno', name: 'Against All Odds',
    description: 'Catalogue an extremophile — life that should not be possible', stardust: 60,
    progress: (own: BinderOwnership) => `${own.xeno ? 1 : 0} / 1`,
    complete: (own: BinderOwnership) => own.xeno,
  }),
  Object.freeze({
    id: 'court', name: 'The Apex Court',
    description: 'Claim Apex Guardians of all three summit crowns — every guardian bears one', stardust: 150,
    progress: (own: BinderOwnership) => ['I', 'II', 'III']
      .map((label, index) => `${label} ${own.court.has(12 + index) ? '✓' : '—'}`).join(' · '),
    complete: (own: BinderOwnership) => own.court.size >= 3,
  }),
  Object.freeze({
    id: 'para10', name: ARC9_PARAGON_MILESTONE_NAME_V1,
    description: 'Find 10 of the Fifty Paragons',
    stardust: ARC9_PARAGON_MILESTONE_STARDUST_V1,
    progress: (own: BinderOwnership) => `${own.paragons} / ${ARC9_PARAGON_MILESTONE_COUNT_V1}`,
    complete: (own: BinderOwnership) => own.paragons >= ARC9_PARAGON_MILESTONE_COUNT_V1,
  }),
]);

function plainRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain record`);
  }
  const prototype = Object.getPrototypeOf(value);
  if ((prototype !== Object.prototype && prototype !== null)
    || Reflect.ownKeys(value).some((key) => typeof key !== 'string')) {
    throw new TypeError(`${label} must be a string-keyed plain record`);
  }
  return value as Record<string, unknown>;
}

function checkedInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new RangeError(`${label} is outside its exact integer range`);
  }
  return value as number;
}

function checkedCodexEntry(value: unknown, index: number): CodexEntry {
  const entry = plainRecord(value, `Binder Compendium row ${index}`);
  if (typeof entry.id !== 'string' || typeof entry.name !== 'string'
    || typeof entry.kind !== 'string' || typeof entry.realm !== 'string'
    || (entry.tier !== null && (!Number.isInteger(entry.tier)
      || (entry.tier as number) < 0 || (entry.tier as number) > 14))) {
    throw new TypeError(`Binder Compendium row ${index} has invalid identity`);
  }
  plainRecord(entry.g, `Binder Compendium genome ${index}`);
  return entry as unknown as CodexEntry;
}

function checkedClaimedSets(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.length > MAX_CLAIMED_SET_ROWS) {
    throw new RangeError('Binder claimed-set carrier exceeds its bound');
  }
  const known = new Set<string>(ARC9_BINDER_CLAIMABLE_SET_IDS_V1);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) {
      throw new RangeError('Binder claimed-set carrier is not canonical');
    }
    seen.add(id);
    result.push(id);
  }
  return Object.freeze(result);
}

function checkedCodex(value: unknown): readonly CodexEntry[] {
  if (!Array.isArray(value) || value.length > MAX_CODEX_ROWS) {
    throw new RangeError('Binder Compendium carrier exceeds its bound');
  }
  const ids = new Set<string>();
  return Object.freeze(value.map((row, index) => {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string'
      || ids.has(row[0])) {
      throw new TypeError(`Binder Compendium pair ${index} is invalid`);
    }
    ids.add(row[0]);
    return checkedCodexEntry(row[1], index);
  }));
}

function positiveModulo(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function ownershipOf(entries: readonly CodexEntry[], paragons: number): BinderOwnership {
  const tiers = new Set<number>();
  const realms = new Set<string>();
  const bodies = new Set<number>();
  const themes = new Set<string>();
  const flavors = new Set<string>();
  const kinds = new Set<string>();
  const sizes = new Set<number>();
  const court = new Set<number>();
  let xeno = false;
  for (const entry of entries) {
    const genome = plainRecord(entry.g, `Binder genome ${entry.id}`);
    if (entry.tier !== null) tiers.add(entry.tier);
    if ((REALM_ORDER as readonly string[]).includes(entry.realm)) realms.add(entry.realm);
    if ((KIND_SLOTS as readonly string[]).includes(entry.kind)) kinds.add(entry.kind);
    if (entry.kind === 'Fauna') {
      const body = checkedInteger(genome.body, 0, Number.MAX_SAFE_INTEGER, 'fauna body');
      const size = checkedInteger(genome.size, 0, Number.MAX_SAFE_INTEGER, 'fauna size');
      bodies.add(positiveModulo(body, FA_BODY.length));
      sizes.add(positiveModulo(size, FA_SIZE.length));
      themes.add(abilityTheme(genome));
      if (genome.x) xeno = true;
      if (genome.apex && entry.tier !== null && entry.tier >= 12 && entry.tier <= 14) {
        court.add(entry.tier);
      }
    }
    if (entry.kind === 'Flora') flavors.add(floraStat(genome));
  }
  return Object.freeze({ tiers, realms, bodies, themes, flavors, kinds, sizes, court, paragons, xeno });
}

function slot(id: string, label: string, have: boolean, color: string): Arc9BinderSlotV1 {
  return Object.freeze({ id, label, have, color });
}

function page(
  id: string,
  icon: string,
  name: string,
  slots: readonly Arc9BinderSlotV1[],
): Arc9BinderPageV1 {
  return Object.freeze({
    id, icon, name, slots: Object.freeze([...slots]),
    found: slots.filter(({ have }) => have).length,
    total: slots.length,
  });
}

function abilityThemeLabel(id: string): string {
  const value = ABILITY_THEMES[id];
  if (!value || typeof value !== 'object') return id;
  const label = (value as Record<string, unknown>).label;
  return typeof label === 'string' ? label : id;
}

function abilityThemeColor(id: string): string {
  const value = ABILITY_THEMES[id];
  if (!value || typeof value !== 'object') return '#ffd96a';
  const color = (value as Record<string, unknown>).col;
  return typeof color === 'string' ? color : '#ffd96a';
}

function modelOf(state: SaveStateV2): Arc9BinderReadModelV1 {
  const entries = checkedCodex(state.codex);
  const claimedSetIds = checkedClaimedSets(state.claimedSets);
  const paragonProjection = projectArc9ParagonCatalogueV1(entries);
  if (paragonProjection.kind !== 'projected') {
    throw new TypeError(`Binder Paragon projection is protected: ${paragonProjection.reason}`);
  }
  const paragonCatalogue = paragonProjection.catalogue;
  const own = ownershipOf(entries, paragonCatalogue.found);
  const pages: readonly Arc9BinderPageV1[] = Object.freeze([
    page('spectrum', '🎨', 'The Spectrum', RARITY_V17.map((rarity) => slot(
      String(rarity.t), rarity.name,
      [...own.tiers].some((tier) => displayRarity(tier).t === rarity.t), rarity.hex,
    ))),
    page('realms', '🗺', 'The Sixteen Realms', REALM_ORDER.map((realm) => slot(
      realm, realm, own.realms.has(realm), '#8fb4ff',
    ))),
    page('bodies', '🦴', 'Body Plans', FA_BODY.map((body, index) => slot(
      String(index), body, own.bodies.has(index), '#7fe6a0',
    ))),
    page('themes', '✧', 'Ability Themes', Object.keys(ABILITY_THEMES).map((id) => slot(
      id, abilityThemeLabel(id), own.themes.has(id), abilityThemeColor(id),
    ))),
    page('flavors', '🌿', 'Flora Flavors', STAT_KEYS.map((id, index) => slot(
      id, STAT_NAMES[index] ?? id, own.flavors.has(id), STAT_HUES[index] ?? '#9fe06a',
    ))),
    page('sizes', '📏', 'Size Classes', FA_SIZE.map((size, index) => slot(
      String(index), size, own.sizes.has(index), '#cfd6f2',
    ))),
  ]);
  const claimed = new Set(claimedSetIds);
  const sets = Object.freeze(SET_DEFINITIONS.map((definition): Arc9BinderSetV1 => Object.freeze({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    stardust: definition.stardust,
    progress: definition.progress(own),
    complete: definition.complete(own),
    claimed: claimed.has(definition.id),
  })));
  return Object.freeze({
    schema: 'cf-v2-arc9-binder/v1',
    pages,
    sets,
    claimedSetIds,
    paragon: Object.freeze({
      status: 'finder-ready',
      found: paragonCatalogue.found,
      total: paragonCatalogue.total,
      slots: paragonCatalogue.slots,
      milestoneClaimed: claimed.has('para10'),
      note: 'Named one-of-a-kind deep-spectrum legends at fixed deterministic worlds.',
    }),
  });
}

export function projectArc9BinderReadModelV1(state: SaveStateV2): Arc9BinderProjectionV1 {
  try {
    return Object.freeze({ kind: 'projected', model: modelOf(state) });
  } catch (error) {
    return Object.freeze({
      kind: 'protected',
      reason: error instanceof Error ? error.message : 'Binder projection failed',
    });
  }
}

export function operationForArc9BinderSetClaimV1(setId: Arc9BinderClaimableSetIdV1): string {
  if (!(ARC9_BINDER_CLAIMABLE_SET_IDS_V1 as readonly string[]).includes(setId)) {
    throw new RangeError('Binder set id is not claimable');
  }
  return `${ARC9_BINDER_SET_CLAIM_OPERATION_PREFIX_V1}${setId}`;
}

export interface Arc9BinderSetClaimFactsV1 {
  readonly schema: typeof ARC9_BINDER_SET_CLAIM_WITNESS_SCHEMA_V1;
  readonly setId: Arc9BinderClaimableSetIdV1;
  readonly stardust: number;
  readonly priorClaimedSetIds: readonly string[];
  readonly nextClaimedSetIds: readonly string[];
  readonly essenceBefore: number;
  readonly essenceAfter: number;
  readonly earnedBefore: number;
  readonly earnedAfter: number;
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
  readonly receiptOrdinal: number;
}

export type Arc9BinderSetClaimActionOutcomeV1 =
  | Readonly<{ kind: 'current'; setId: Arc9BinderClaimableSetIdV1 }>
  | Readonly<{ kind: 'refused'; detail: string; transaction?: F4RuntimeActionCommitOutcome }>
  | Readonly<{
    kind: 'committed';
    state: SaveStateV2;
    facts: Arc9BinderSetClaimFactsV1;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>
  | Readonly<{
    kind: 'committed-convergence';
    detail: string;
    transaction: Extract<F4RuntimeActionCommitOutcome, { readonly kind: 'committed' }>;
  }>;

function claimableSet(model: Arc9BinderReadModelV1, setId: Arc9BinderClaimableSetIdV1): Arc9BinderSetV1 {
  const row = model.sets.find(({ id }) => id === setId);
  if (!row) throw new RangeError('Binder set row is missing');
  return row;
}

function checkedProgressionAfterClaim(
  draft: SaveStateV2,
): Readonly<{
  priorUnlockedIds: readonly string[];
  nextUnlockedIds: readonly string[];
  addedAchievementIds: readonly string[];
  priorBestRankIndex: number;
  nextBestRankIndex: number;
  projection: Arc9ProgressionProjectionV1;
}> {
  const refresh = prepareArc9ProgressionRefreshV1(draft);
  if (refresh.kind === 'protected') throw new Error(`progression:${refresh.reason}`);
  if (refresh.kind === 'ready') {
    draft.unlocked = [...refresh.successorState.unlocked];
    draft.stats = { ...refresh.successorState.stats };
    return Object.freeze({
      priorUnlockedIds: refresh.source.unlockedIds,
      nextUnlockedIds: refresh.successor.unlockedIds,
      addedAchievementIds: refresh.addedAchievementIds,
      priorBestRankIndex: refresh.priorBestRankIndex,
      nextBestRankIndex: refresh.nextBestRankIndex,
      projection: refresh.successor,
    });
  }
  return Object.freeze({
    priorUnlockedIds: refresh.projection.unlockedIds,
    nextUnlockedIds: refresh.projection.unlockedIds,
    addedAchievementIds: Object.freeze([]),
    priorBestRankIndex: refresh.projection.savedBestRankIndex,
    nextBestRankIndex: refresh.projection.rewards.bestRankIndex,
    projection: refresh.projection,
  });
}

export async function commitArc9BinderSetClaimV1(input: Readonly<{
  state: SaveStateV2;
  setId: Arc9BinderClaimableSetIdV1;
  codecNow: number;
  authority: Pick<F4RuntimeAuthority, 'commitAction'>;
}>): Promise<Arc9BinderSetClaimActionOutcomeV1> {
  const source = projectArc9BinderReadModelV1(input.state);
  if (source.kind !== 'projected') return Object.freeze({ kind: 'refused', detail: source.reason });
  const sourceSet = claimableSet(source.model, input.setId);
  if (sourceSet.claimed) return Object.freeze({ kind: 'current', setId: input.setId });
  if (!sourceSet.complete) return Object.freeze({ kind: 'refused', detail: 'set-incomplete' });
  const operation = operationForArc9BinderSetClaimV1(input.setId);
  let selected: Readonly<{
    facts: Arc9BinderSetClaimFactsV1;
    witness: string;
    expectedStateJson: string;
  }> | null = null;
  const transaction = await input.authority.commitAction({
    state: input.state,
    operation,
    receiptKind: ARC9_BINDER_SET_CLAIM_RECEIPT_KIND_V1,
    codecNow: input.codecNow,
    derive: ({ draft, receiptOrdinal, canonicalizeState }) => {
      const current = projectArc9BinderReadModelV1(draft);
      if (current.kind !== 'projected') throw new Error(current.reason);
      const row = claimableSet(current.model, input.setId);
      if (row.claimed || !row.complete) throw new Error(row.claimed ? 'set-already-claimed' : 'set-incomplete');
      const essenceBefore = checkedInteger(draft.essence, 0, MAX_STARDUST, 'Binder Stardust');
      const stats = plainRecord(draft.stats, 'Binder stats');
      const earnedBefore = checkedInteger(stats.essenceEarned ?? 0, 0, MAX_STARDUST, 'Binder lifetime Stardust');
      if (essenceBefore > MAX_STARDUST - row.stardust
        || earnedBefore > MAX_STARDUST - row.stardust) {
        throw new RangeError('Binder Stardust reward would overflow');
      }
      const priorClaimedSetIds = current.model.claimedSetIds;
      draft.claimedSets = [...priorClaimedSetIds, input.setId];
      draft.essence = essenceBefore + row.stardust;
      draft.stats = { ...draft.stats, essenceEarned: earnedBefore + row.stardust };
      const progression = checkedProgressionAfterClaim(draft);
      const facts: Arc9BinderSetClaimFactsV1 = Object.freeze({
        schema: ARC9_BINDER_SET_CLAIM_WITNESS_SCHEMA_V1,
        setId: input.setId,
        stardust: row.stardust,
        priorClaimedSetIds,
        nextClaimedSetIds: Object.freeze([...draft.claimedSets]),
        essenceBefore,
        essenceAfter: draft.essence,
        earnedBefore,
        earnedAfter: draft.stats.essenceEarned!,
        priorUnlockedIds: progression.priorUnlockedIds,
        nextUnlockedIds: progression.nextUnlockedIds,
        addedAchievementIds: progression.addedAchievementIds,
        priorBestRankIndex: progression.priorBestRankIndex,
        nextBestRankIndex: progression.nextBestRankIndex,
        receiptOrdinal,
      });
      const witness = `${ARC9_BINDER_SET_CLAIM_WITNESS_SCHEMA_V1}:${sha256Hex(canonicalJson(facts))}`;
      selected = Object.freeze({
        facts,
        witness,
        expectedStateJson: canonicalJson(canonicalizeState(draft)),
      });
      return Object.freeze({ state: draft, witness });
    },
  });
  if (transaction.kind !== 'committed') {
    return Object.freeze({ kind: 'refused', detail: transaction.kind, transaction });
  }
  const plan = selected as Readonly<{
    facts: Arc9BinderSetClaimFactsV1;
    witness: string;
    expectedStateJson: string;
  }> | null;
  if (!plan) return Object.freeze({ kind: 'committed-convergence', detail: 'missing-plan', transaction });
  const verified = projectArc9BinderReadModelV1(transaction.state);
  const verifiedSet = verified.kind === 'projected'
    ? verified.model.sets.find(({ id }) => id === input.setId) : undefined;
  if (transaction.plan.operation !== operation
    || transaction.plan.receiptOrdinal !== plan.facts.receiptOrdinal
    || transaction.receipt.ordinal !== plan.facts.receiptOrdinal
    || transaction.receipt.kind !== ARC9_BINDER_SET_CLAIM_RECEIPT_KIND_V1
    || transaction.receipt.witness !== plan.witness
    || canonicalJson(transaction.state) !== canonicalJson(transaction.saved.canonicalState)
    || canonicalJson(transaction.state) !== plan.expectedStateJson
    || !verifiedSet?.claimed
    || transaction.state.essence !== plan.facts.essenceAfter
    || transaction.state.stats.essenceEarned !== plan.facts.earnedAfter
    || canonicalJson(transaction.state.claimedSets) !== canonicalJson(plan.facts.nextClaimedSetIds)
    || canonicalJson(transaction.state.unlocked) !== canonicalJson(plan.facts.nextUnlockedIds)
    || transaction.state.stats.bestRank !== plan.facts.nextBestRankIndex) {
    return Object.freeze({ kind: 'committed-convergence', detail: 'committed-verification-mismatch', transaction });
  }
  return Object.freeze({
    kind: 'committed', state: transaction.state, facts: plan.facts, transaction,
  });
}

export function publishArc9BinderSetClaimFieldsV1(
  target: SaveStateV2,
  outcome: Extract<Arc9BinderSetClaimActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  if (canonicalJson(target.claimedSets) !== canonicalJson(outcome.facts.priorClaimedSetIds)
    || target.essence !== outcome.facts.essenceBefore
    || (target.stats.essenceEarned ?? 0) !== outcome.facts.earnedBefore
    || canonicalJson(target.unlocked) !== canonicalJson(outcome.facts.priorUnlockedIds)
    || (target.stats.bestRank ?? 0) !== outcome.facts.priorBestRankIndex) {
    throw new TypeError('Binder publication requires its exact live parent');
  }
  target.claimedSets = [...outcome.state.claimedSets];
  target.essence = outcome.state.essence;
  target.stats = { ...outcome.state.stats };
  target.unlocked = [...outcome.state.unlocked];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

export function renderArc9BinderPanelV1(model: Arc9BinderReadModelV1): string {
  const pages = model.pages.map((candidate) => '<section class="binder-page" '
    + `data-binder-page="${escapeHtml(candidate.id)}"><h4>${candidate.icon} ${escapeHtml(candidate.name)} `
    + `<span class="sub">${candidate.found} / ${candidate.total}</span></h4>`
    + '<div class="binder-grid">'
    + candidate.slots.map((candidateSlot) => `<span class="binder-slot${candidateSlot.have ? '' : ' missing'}"`
      + (candidateSlot.have ? ` style="border-color:${escapeHtml(candidateSlot.color)};color:${escapeHtml(candidateSlot.color)}"` : '')
      + `>${candidateSlot.have ? escapeHtml(candidateSlot.label) : '?'}</span>`).join('')
    + '</div></section>').join('');
  const sets = model.sets.map((set) => '<div class="binder-set" data-binder-set="'
    + `${escapeHtml(set.id)}"><span><b>${escapeHtml(set.name)}</b> — ${escapeHtml(set.description)}</span>`
    + (set.claimed
      ? '<span class="binder-claimed">claimed ✓</span>'
      : set.complete
        ? `<button type="button" data-binder-claim="${escapeHtml(set.id)}">Claim ✦ ${set.stardust}</button>`
        : `<span class="sub">${escapeHtml(set.progress)}</span>`)
    + '</div>').join('');
  const paragons = model.paragon.slots.map((slot) => `<button type="button" class="binder-slot paragon${slot.found ? '' : ' missing'}"`
    + ` data-binder-paragon="${slot.index}"`
    + ` aria-label="Plot course to Paragon ${slot.number}${slot.found ? `: ${escapeHtml(slot.ownedName ?? slot.expectedName)}` : ''}"`
    + (slot.found ? ` style="border-color:${escapeHtml(slot.color)};color:${escapeHtml(slot.color)}"` : '')
    + `>${slot.found ? escapeHtml(slot.ownedName ?? slot.expectedName) : `#${slot.number} — ?`}</button>`).join('');
  return '<section class="records-binder" data-arc9-binder><h3>🗂 Binder</h3>'
    + '<p class="sub">Collect types, not individuals — these slots are identical for every explorer.</p>'
    + pages
    + `<section class="binder-paragons"><h4>🜲 The Fifty Paragons <span class="sub">${model.paragon.found} / ${model.paragon.total}</span></h4>`
    + `<p class="sub">${escapeHtml(model.paragon.note)}</p><div class="binder-grid">${paragons}</div></section>`
    + '<h4>🏅 Sets</h4>' + sets + '</section>';
}
