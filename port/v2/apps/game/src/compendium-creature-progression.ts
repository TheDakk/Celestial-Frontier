/* Exact-instance creature progression presentation.

   Species identity still comes from the canonical Compendium record, while
   XP, wounds, assignment and Recovery belong to one stable owned creature
   ID. This owner is deliberately read-only: it derives the existing CombatCore
   level/class curve without changing ownership, genomes or active-play time. */
import {
  canonicalGenomeIdentityV1,
  isOwnershipStateV2,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type CreatureInstanceV1,
  type OwnershipStateV2,
  type SpeciesId,
} from '@cf/domain-acquisition';
import {
  projectCompanionAvailabilityV1,
} from '@cf/domain-acquisition/companion-availability';
import {
  projectCreatureClassProgressionV1,
  type CreatureInnateArt,
} from '@cf/domain-combatcore';

export const COMPENDIUM_CREATURE_PROGRESSION_SCHEMA_V1 =
  'cf-v2-compendium-creature-progression/v1' as const;
export const COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1 = 24 as const;

export type CompendiumCreatureProgressionAvailabilityV1 =
  | 'ready' | 'fixture' | 'non-fauna' | 'protected' | 'no-companion';

export type CompendiumCreatureProgressionStatusV1 =
  | 'ready' | 'mission' | 'recovery' | 'recovered' | 'exhibit' | 'retired';

export interface CompendiumCreatureProgressionRecordV1 {
  readonly id: string;
  readonly name: string;
  readonly g: Readonly<Record<string, unknown>>;
}

export interface CompendiumCreatureProgressionRowV1 {
  readonly creatureId: CreatureInstanceId;
  readonly label: string;
  readonly historical: boolean;
  readonly status: CompendiumCreatureProgressionStatusV1;
  readonly statusDetail: string | null;
  readonly xp: number;
  readonly level: number;
  readonly levelFloorXp: number;
  readonly nextLevelXp: number | null;
  readonly levelProgressXp: number;
  readonly levelProgressSpanXp: number;
  readonly levelProgressPercent: number;
  readonly className: string;
  readonly classGroup: string;
  readonly awakenedInnateSlots: 1 | 2 | 3;
  readonly innateArts: readonly CreatureInnateArt[];
  readonly nextInnateLevel: 3 | 6 | null;
  readonly woundFraction: number;
}

export interface CompendiumCreatureProgressionV1 {
  readonly schema: typeof COMPENDIUM_CREATURE_PROGRESSION_SCHEMA_V1;
  readonly availability: CompendiumCreatureProgressionAvailabilityV1;
  readonly detail: string;
  readonly speciesId: SpeciesId | null;
  readonly ownershipRevision: number | null;
  readonly ownershipDigest: string | null;
  readonly totalRows: number;
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly rows: readonly CompendiumCreatureProgressionRowV1[];
}

function unavailable(
  availability: Exclude<CompendiumCreatureProgressionAvailabilityV1, 'ready'>,
  detail: string,
  speciesId: SpeciesId | null = null,
  ownershipRevision: number | null = null,
  ownershipDigest: string | null = null,
  rows: readonly CompendiumCreatureProgressionRowV1[] = Object.freeze([]),
  totalRows = rows.length,
  pageIndex = 0,
): CompendiumCreatureProgressionV1 {
  return Object.freeze({
    schema: COMPENDIUM_CREATURE_PROGRESSION_SCHEMA_V1,
    availability,
    detail,
    speciesId,
    ownershipRevision,
    ownershipDigest,
    totalRows,
    pageIndex,
    pageCount: totalRows === 0 ? 0
      : Math.ceil(totalRows / COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1),
    rows,
  });
}

function checkedText(value: unknown, label: string, maximum: number): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError(`${label} must be non-empty bounded text`);
  }
  return value;
}

function shortId(value: string): string { return value.slice(-8); }

function recoveryDuration(value: number): string {
  const seconds = Math.max(1, Math.ceil(value / 1_000));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function rowFor(
  creature: CreatureInstanceV1,
  recordName: string,
  observedActivePlayMs: number,
  historical: boolean,
): CompendiumCreatureProgressionRowV1 {
  const xp = creature.xp ?? 0;
  const progress = projectCreatureClassProgressionV1(creature.genome, xp);
  const {
    level, levelFloorXp, nextLevelXp, levelProgressXp, levelProgressSpanXp,
    levelProgressPercent, className, classGroup, awakenedInnateSlots,
    innateArts, nextInnateLevel,
  } = progress;

  let status: CompendiumCreatureProgressionStatusV1;
  let statusDetail: string | null;
  if (historical) {
    status = 'retired';
    statusDetail = 'Historical companion record; no longer in the active roster.';
  } else if (creature.genome.exhibit === true) {
    status = 'exhibit';
    statusDetail = 'Exhibition challenger; not an owned active companion.';
  } else {
    const availability = projectCompanionAvailabilityV1(creature, observedActivePlayMs);
    if (availability.assignment?.kind === 'mission') {
      status = 'mission';
      statusDetail = 'Away on a companion mission.';
    } else if (availability.assignment?.kind === 'recovery') {
      status = 'recovery';
      statusDetail = `${recoveryDuration(availability.recoveryRemainingActivePlayMs)} of active play remains in Recovery.`;
    } else if (availability.recovered) {
      status = 'recovered';
      statusDetail = 'Recovery is complete; the next companion action may clear its stored assignment.';
    } else {
      status = 'ready';
      statusDetail = null;
    }
  }

  return Object.freeze({
    creatureId: creature.creatureId,
    label: `${creature.nickname ?? recordName} · ${shortId(creature.creatureId)}`,
    historical,
    status,
    statusDetail,
    xp,
    level,
    levelFloorXp,
    nextLevelXp,
    levelProgressXp,
    levelProgressSpanXp,
    levelProgressPercent,
    className,
    classGroup,
    awakenedInnateSlots,
    innateArts,
    nextInnateLevel,
    woundFraction: creature.hurt ?? 0,
  });
}

/** Project every exact live twin plus immutable retired history for one fauna
 * detail. The input ownership object must retain its privileged registration;
 * a deep-equal clone is protected rather than accepted as authority. */
export function projectCompendiumCreatureProgressionV1(input: Readonly<{
  readonly logicalId: string;
  readonly record: CompendiumCreatureProgressionRecordV1;
  readonly ownership: OwnershipStateV2 | null;
  readonly protected: boolean;
  readonly fixture: boolean;
  readonly observedActivePlayMs: number;
  readonly pageIndex?: number;
}>): CompendiumCreatureProgressionV1 {
  let logicalId: string;
  let recordName: string;
  let identity: ReturnType<typeof canonicalGenomeIdentityV1>;
  try {
    logicalId = checkedText(input.logicalId, 'Compendium logical ID', 128);
    const recordId = checkedText(input.record?.id, 'Compendium record ID', 128);
    recordName = checkedText(input.record?.name, 'Compendium record name', 256);
    if (recordId !== logicalId || !input.record.g || typeof input.record.g !== 'object'
      || Array.isArray(input.record.g)) throw new TypeError('record is not authoritative');
    identity = canonicalGenomeIdentityV1(input.record.g);
  } catch {
    return unavailable('protected',
      'Creature progression is unavailable because this Compendium record did not verify.');
  }
  if (input.fixture) {
    return unavailable('fixture',
      'Creature progression is unavailable for diagnostic Compendium fixtures.');
  }
  if (identity.kingdom !== 'fauna') {
    return unavailable('non-fauna',
      'Creature progression belongs to owned fauna companions.', identity.speciesId);
  }
  const ownership = input.ownership;
  if (input.protected || ownership === null || !isOwnershipStateV2(ownership)
    || ownership.mode !== 'current') {
    return unavailable('protected',
      'Creature progression is unavailable while ownership is protected.', identity.speciesId);
  }
  const ownershipDigest = ownershipStateDigestV2(ownership);
  const catalogue = ownership.catalogSpecies.find((candidate) => (
    candidate.speciesId === identity.speciesId
  ));
  if (catalogue === undefined || catalogue.kingdom !== 'fauna'
    || catalogue.genomeIdentity !== identity.genomeIdentity) {
    return unavailable('protected',
      'Creature progression is unavailable because this species does not match ownership authority.',
      identity.speciesId, ownership.revision, ownershipDigest);
  }

  const candidates = [
    ...ownership.creatures
      .filter((creature) => creature.speciesId === identity.speciesId
        && creature.genomeIdentity === identity.genomeIdentity)
      .map((creature) => Object.freeze({ creature, historical: false as const })),
    ...ownership.creatureTombstones
      .map((tombstone) => tombstone.snapshot)
      .filter((creature) => creature.speciesId === identity.speciesId
        && creature.genomeIdentity === identity.genomeIdentity)
      .map((creature) => Object.freeze({ creature, historical: true as const })),
  ];
  const totalRows = candidates.length;
  const pageCount = totalRows === 0 ? 0
    : Math.ceil(totalRows / COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1);
  const requestedPage = input.pageIndex ?? 0;
  if (!Number.isSafeInteger(requestedPage) || requestedPage < 0) {
    return unavailable('protected',
      'Creature progression page authority did not verify.', identity.speciesId,
      ownership.revision, ownershipDigest);
  }
  const pageIndex = pageCount === 0 ? 0 : Math.min(requestedPage, pageCount - 1);
  const pageStart = pageIndex * COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1;
  let rows: readonly CompendiumCreatureProgressionRowV1[];
  try {
    rows = Object.freeze(candidates
      .slice(pageStart, pageStart + COMPENDIUM_CREATURE_PROGRESSION_PAGE_SIZE_V1)
      .map(({ creature, historical }) => (
        rowFor(creature, recordName, input.observedActivePlayMs, historical)
      )));
  } catch {
    return unavailable('protected',
      'Creature progression is unavailable because exact-instance status did not verify.',
      identity.speciesId, ownership.revision, ownershipDigest,
      Object.freeze([]), totalRows, pageIndex);
  }
  if (!candidates.some(({ creature, historical }) => !historical && creature.genome.exhibit !== true)) {
    return unavailable('no-companion',
      'No owned living companion matches this fauna species.', identity.speciesId,
      ownership.revision, ownershipDigest, rows, totalRows, pageIndex);
  }
  return Object.freeze({
    schema: COMPENDIUM_CREATURE_PROGRESSION_SCHEMA_V1,
    availability: 'ready',
    detail: 'Each row is one exact companion; XP awakens innate arts without changing base stats.',
    speciesId: identity.speciesId,
    ownershipRevision: ownership.revision,
    ownershipDigest,
    totalRows,
    pageIndex,
    pageCount,
    rows,
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/gu, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function innateEffectSummary(effects: Readonly<Record<string, number | boolean>>): string {
  return Object.entries(effects).map(([key, value]) => `${key}=${String(value)}`).join(' · ');
}

/** Static semantic markup for the existing Compendium detail. All mutation
 * controls remain in their established owners below this read-only section. */
export function renderCompendiumCreatureProgressionV1(
  model: CompendiumCreatureProgressionV1 | null,
): string {
  if (model === null || model.availability === 'non-fauna' || model.availability === 'fixture') {
    return '';
  }
  const rows = model.rows.map((row) => {
    const xpGoal = row.nextLevelXp === null
      ? `${row.xp} XP · maximum level`
      : `${row.levelProgressXp} / ${row.levelProgressSpanXp} XP to next · ${row.xp} total`;
    const innate = `${row.awakenedInnateSlots} innate art${row.awakenedInnateSlots === 1 ? '' : 's'} awake`;
    const innateArts = row.innateArts.map((art) => (
      `<div class="sub" data-creature-progression-art="${escapeHtml(art.id)}">`
      + `<b>Innate ${art.slot} · ${escapeHtml(art.label)}</b> — ${escapeHtml(art.description)}`
      + ` <code data-creature-progression-art-effects>${escapeHtml(innateEffectSummary(art.effects))}</code>`
      + '</div>'
    )).join('');
    const status = row.status === 'ready' ? ''
      : `<div class="sub" data-creature-progression-status="${escapeHtml(row.status)}">${escapeHtml(row.statusDetail ?? row.status)}</div>`;
    const wounds = row.woundFraction > 0
      ? `<div class="sub" data-creature-progression-wounds>Wounds ${Math.round(row.woundFraction * 100)}%</div>` : '';
    return `<article class="centry" data-creature-progression-id="${escapeHtml(row.creatureId)}" data-creature-progression-history="${String(row.historical)}">`
      + `<div><b>${escapeHtml(row.label)}</b> · L${row.level} ${escapeHtml(row.className)} · ${escapeHtml(row.classGroup)}</div>`
      + `<div class="sub">${escapeHtml(xpGoal)} · ${escapeHtml(innate)}</div>`
      + `<progress aria-label="${escapeHtml(`${row.label} level progress`)}" max="100" value="${row.levelProgressPercent}" style="width:100%"></progress>`
      + innateArts + status + wounds + '</article>';
  }).join('');
  const pager = model.pageCount > 1
    ? '<div class="sub" data-creature-progression-page-status>'
      + `Page ${model.pageIndex + 1} of ${model.pageCount} · ${model.totalRows} exact companions and records`
      + '</div><div class="row" style="gap:8px;margin-top:8px">'
      + `<button type="button" data-creature-progression-page="previous" style="min-height:44px"${model.pageIndex === 0 ? ' disabled' : ''}>Previous</button>`
      + `<button type="button" data-creature-progression-page="next" style="min-height:44px"${model.pageIndex + 1 >= model.pageCount ? ' disabled' : ''}>Next</button>`
      + '</div>' : '';
  return '<section class="compendium-feed" data-arc5-progression-body aria-label="Companion progression">'
    + '<h4 style="margin:0 0 6px">Companion Progression</h4>'
    + `<div class="sub" style="margin-bottom:8px">${escapeHtml(model.detail)}</div>`
    + (rows || `<div class="sub">${escapeHtml(model.detail)}</div>`)
    + pager
    + '</section>';
}
