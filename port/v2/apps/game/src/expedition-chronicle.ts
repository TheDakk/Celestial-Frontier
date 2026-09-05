/* Arc 9 Expedition Chronicle / Museum read model.

   This owner projects history only from already-durable, independently
   verified facts. It writes no journal, receipt, save field, reward or RNG
   domain. The four bounded galleries deliberately retain their separate
   ordering authorities instead of inventing a false global timestamp. */
import {
  isOwnershipStateV1,
  type OwnershipStateV1,
} from '@cf/domain-acquisition';
import {
  COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1,
  COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1,
  type CombatSettlementAuthorityV1,
  type SaveStateV2,
} from '@cf/persistence';
/* `CombatSettlementAuthorityV1` is the canonical result of the persistence
   reader rather than a WeakMap-branded object. Main supplies only that reader
   result; the schema/version checks below keep this read model fail-closed if
   another caller accidentally supplies an unrelated structural object. */

export const EXPEDITION_CHRONICLE_SCHEMA_V1 = 'cf-v2-expedition-chronicle/v1' as const;
export const EXPEDITION_CHRONICLE_SECTION_LIMIT_V1 = 60;

export type ExpeditionChronicleSectionIdV1 =
  | 'battles' | 'discoveries' | 'prime-codex' | 'legacy-journal';

export interface ExpeditionChronicleEntryV1 {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly outcome: 'gain' | 'victory' | 'setback' | 'record';
}

export interface ExpeditionChronicleSectionV1 {
  readonly id: ExpeditionChronicleSectionIdV1;
  readonly title: string;
  readonly empty: string;
  readonly entries: readonly ExpeditionChronicleEntryV1[];
  readonly omitted: number;
}

export interface ExpeditionChronicleReadModelV1 {
  readonly schema: typeof EXPEDITION_CHRONICLE_SCHEMA_V1;
  readonly sections: readonly ExpeditionChronicleSectionV1[];
  readonly entryCount: number;
}

export interface ExpeditionChronicleProjectionInputV1 {
  readonly save: SaveStateV2;
  readonly ownership: OwnershipStateV1;
  readonly combat: CombatSettlementAuthorityV1;
}

export type ExpeditionChronicleProjectionOutcomeV1 =
  | Readonly<{ readonly kind: 'projected'; readonly model: ExpeditionChronicleReadModelV1 }>
  | Readonly<{ readonly kind: 'protected'; readonly reason: 'invalid-authority' }>;

const safeText = (value: unknown, maximum: number): string | null => (
  typeof value === 'string' && value.length <= maximum && !/[\u0000-\u001f\u007f]/u.test(value)
    ? value : null
);

function boundedLatestFirst<T>(rows: readonly T[]): Readonly<{ rows: readonly T[]; omitted: number }> {
  const omitted = Math.max(0, rows.length - EXPEDITION_CHRONICLE_SECTION_LIMIT_V1);
  return Object.freeze({
    rows: Object.freeze(rows.slice(-EXPEDITION_CHRONICLE_SECTION_LIMIT_V1).reverse()),
    omitted,
  });
}

function boundedAuthorityOrder<T>(rows: readonly T[]): Readonly<{ rows: readonly T[]; omitted: number }> {
  const omitted = Math.max(0, rows.length - EXPEDITION_CHRONICLE_SECTION_LIMIT_V1);
  return Object.freeze({
    rows: Object.freeze(rows.slice(0, EXPEDITION_CHRONICLE_SECTION_LIMIT_V1)),
    omitted,
  });
}

function section(
  id: ExpeditionChronicleSectionIdV1,
  title: string,
  empty: string,
  entries: readonly ExpeditionChronicleEntryV1[],
  omitted: number,
): ExpeditionChronicleSectionV1 {
  return Object.freeze({ id, title, empty, entries: Object.freeze(entries), omitted });
}

function shortIdentity(value: string): string {
  if (value.length <= 28) return value;
  return `${value.slice(0, 12)}…${value.slice(-10)}`;
}

function project(input: ExpeditionChronicleProjectionInputV1): ExpeditionChronicleReadModelV1 | null {
  try {
    if (!input || typeof input !== 'object' || !input.save || !input.ownership || !input.combat
      || !isOwnershipStateV1(input.ownership) || input.ownership.mode !== 'current'
      || input.combat.schema !== COMBAT_SETTLEMENT_AUTHORITY_SCHEMA_V1
      || input.combat.version !== COMBAT_SETTLEMENT_AUTHORITY_VERSION_V1
      || !Array.isArray(input.ownership.catalogSpecies)
      || !Array.isArray(input.ownership.discoveries) || !Array.isArray(input.combat.battles)
      || !Array.isArray(input.combat.conquests) || !Array.isArray(input.combat.lossXp)
      || !Array.isArray(input.save.journal)
      || !input.save.primeFill || typeof input.save.primeFill !== 'object') return null;

    const conquered = new Set(input.combat.conquests.map((row) => row.worldKey));
    const battleSlice = boundedLatestFirst(input.combat.battles);
    const battles = battleSlice.rows.map((row): ExpeditionChronicleEntryV1 => {
      const worldKey = safeText(row.worldKey, 2_048);
      if (worldKey === null || !Number.isSafeInteger(row.receiptOrdinal)) {
        throw new TypeError('invalid combat history');
      }
      const victory = row.outcome === 'champion-win';
      const draw = row.outcome === 'draw';
      return Object.freeze({
        id: `battle:${row.receiptOrdinal}`,
        title: victory ? (conquered.has(worldKey) ? 'World conquered' : 'Battle won')
          : draw ? 'Battle drawn' : 'Expedition defeated',
        detail: `${shortIdentity(worldKey)} · durable battle receipt ${row.receiptOrdinal}`,
        outcome: victory ? 'victory' : draw ? 'record' : 'setback',
      });
    });

    const speciesById = new Map(input.ownership.catalogSpecies.map((row) => [row.speciesId, row]));
    const discoveryRows = input.ownership.discoveries.filter((row) => row.firstForSpecies);
    /* Registered ownership deliberately canonicalizes discoveries by their
       immutable record id, not by a timestamp. Preserve that authority order;
       reversing it would visually invent a newest-first chronology. */
    const discoverySlice = boundedAuthorityOrder(discoveryRows);
    const discoveries = discoverySlice.rows.map((row): ExpeditionChronicleEntryV1 => {
      const recordId = safeText(row.recordId, 192);
      const speciesId = safeText(row.speciesId, 192);
      if (recordId === null || speciesId === null) throw new TypeError('invalid discovery history');
      const species = speciesById.get(row.speciesId);
      if (!species || species.firstObservationId !== row.recordId) {
        throw new TypeError('discovery history is not catalogue-bound');
      }
      const alias = species.alias === null ? null : safeText(species.alias, 96);
      if (species.alias !== null && alias === null) throw new TypeError('invalid species alias');
      const source = row.provenance.kind === 'world'
        ? `${row.acquisition} · ${shortIdentity(row.provenance.worldKey)}`
        : 'preserved legacy observation';
      return Object.freeze({
        id: `discovery:${recordId}`,
        title: alias === null ? `First ${species.kingdom} discovery` : alias,
        detail: `${source} · ${shortIdentity(speciesId)}`,
        outcome: 'gain',
      });
    });

    const primeRows = Object.entries(input.save.primeFill).sort(([left], [right]) => (
      left.localeCompare(right)
    ));
    /* PrimeFill has identity order but no claim-time authority. */
    const primeSlice = boundedAuthorityOrder(primeRows);
    const prime = primeSlice.rows.map(([id, row]): ExpeditionChronicleEntryV1 => {
      const primeId = safeText(id, 96);
      const title = safeText(row?.title, 96);
      const sub = safeText(row?.sub, 256);
      if (primeId === null || title === null || sub === null
        || !Number.isSafeInteger(row?.tier) || row.tier < 0 || row.tier > 14) {
        throw new TypeError('invalid Prime history');
      }
      return Object.freeze({
        id: `prime:${primeId}`,
        title,
        detail: `${sub} · tier ${row.tier}`,
        outcome: 'victory',
      });
    });

    /* The compatibility Journal retains its established append order. */
    const journalSlice = boundedLatestFirst(input.save.journal);
    const legacy = journalSlice.rows.map((row, index): ExpeditionChronicleEntryV1 => {
      const name = safeText(row.n, 28);
      const where = safeText(row.w, 16);
      if (name === null || where === null || !Number.isFinite(row.t) || row.t < 0
        || row.t > 4_102_444_800_000 || !Number.isSafeInteger(row.s)) {
        throw new TypeError('invalid legacy journal history');
      }
      return Object.freeze({
        id: `legacy:${row.t}:${row.s}:${index}`,
        title: name,
        detail: where.length === 0 ? 'Preserved imported record' : where,
        outcome: 'record',
      });
    });

    const sections = Object.freeze([
      section('battles', 'Battle Chronicle', 'No durable battles recorded yet.', battles, battleSlice.omitted),
      section('discoveries', 'Discovery Museum', 'No first-species discoveries recorded yet.', discoveries, discoverySlice.omitted),
      section('prime-codex', 'Prime Victories', 'No Prime Signatures claimed yet.', prime, primeSlice.omitted),
      section(
        'legacy-journal',
        'Legacy Journal',
        'No imported Journal entries yet — live Journal writing is not connected in this development slice.',
        legacy,
        journalSlice.omitted,
      ),
    ]);
    return Object.freeze({
      schema: EXPEDITION_CHRONICLE_SCHEMA_V1,
      sections,
      entryCount: sections.reduce((total, row) => total + row.entries.length, 0),
    });
  } catch { return null; }
}

export function projectExpeditionChronicleV1(
  input: ExpeditionChronicleProjectionInputV1,
): ExpeditionChronicleProjectionOutcomeV1 {
  const model = project(input);
  return model === null
    ? Object.freeze({ kind: 'protected', reason: 'invalid-authority' })
    : Object.freeze({ kind: 'projected', model });
}

const esc = (value: unknown): string => String(value ?? '').replace(/[<>&"']/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[char]!));

export function renderExpeditionChronicleV1(model: ExpeditionChronicleReadModelV1): string {
  if (!model || model.schema !== EXPEDITION_CHRONICLE_SCHEMA_V1
    || !Array.isArray(model.sections) || model.sections.length !== 4) {
    throw new TypeError('Expedition Chronicle read model is invalid');
  }
  return '<section class="expedition-chronicle" data-expedition-chronicle="'
    + EXPEDITION_CHRONICLE_SCHEMA_V1 + '"><h3>Expedition Chronicle &amp; Museum</h3>'
    + '<p class="sub">A read-only history assembled from durable expedition facts. It creates no rewards or duplicate save record.</p>'
    + model.sections.map((gallery) => '<details data-chronicle-section="' + esc(gallery.id) + '" open>'
      + '<summary>' + esc(gallery.title) + ' · ' + gallery.entries.length + '</summary>'
      + (gallery.entries.length === 0
        ? '<div class="empty">' + esc(gallery.empty) + '</div>'
        : gallery.entries.map((entry: ExpeditionChronicleEntryV1) => '<article class="centry" data-chronicle-entry="'
          + esc(entry.id) + '" data-chronicle-outcome="' + esc(entry.outcome) + '"><b>'
          + esc(entry.title) + '</b><div class="sub">' + esc(entry.detail) + '</div></article>').join(''))
      + (gallery.omitted > 0 ? '<div class="sub" data-chronicle-omitted="' + gallery.omitted
        + '">' + gallery.omitted + ' additional records remain safely stored.</div>' : '')
      + '</details>').join('') + '</section>';
}
