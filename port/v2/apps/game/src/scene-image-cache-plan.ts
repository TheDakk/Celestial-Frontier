/* Pure advisory disk planning for the browser image PoC. No deletion,
 * capability detection, storage API, clocks, model loading or gameplay writes.
 * Policy source: audits/ON_DEMAND_LOCAL_GENERATION_REQUIREMENTS_20260908.md.
 * These provisional decimal-byte ceilings do not change PWA pack or RAM/GPU
 * limits. A valid plan does not prove image quality or reserve physical space. */
export const SCENE_IMAGE_CACHE_PLAN_SCHEMA_V1 = 'cf.art.scene-image-cache-plan.v1' as const;
export const SCENE_IMAGE_CACHE_PROFILE_BYTES_V1 = Object.freeze({
  conservative: 500_000_000,
  'qualified-phone': 1_000_000_000,
  'qualified-desktop': 2_000_000_000,
});
export const SCENE_IMAGE_CACHE_DESKTOP_MAX_BYTES_V1 = 5_000_000_000;
export const SCENE_IMAGE_CACHE_MAX_ENTRIES_V1 = 4096;
export type SceneImageCacheProfileV1 = keyof typeof SCENE_IMAGE_CACHE_PROFILE_BYTES_V1;
export type SceneImageCacheEntryKindV1 = 'scene-variant' | 'original' | 'recipe' | 'save' | 'build' | 'model';

/** Caller-supplied verification evidence, never established by this planner.
 * An origin copy must name an inventoried original. An outside-origin copy
 * must remain protected independently of this origin/cache and its executor.
 * The eventual executor must recheck the evidence and retention atomically;
 * a receipt string or model seed alone is not an exact-copy proof. */
export interface SceneImageExactCopyV1 {
  readonly kind: 'verified-exact-copy';
  readonly copyId: string;
  readonly domain: 'origin' | 'outside-origin';
  readonly contentSha256: string;
  readonly bytes: number;
  readonly receiptId: string;
  readonly protected: true;
}
export interface SceneImageCacheEntryV1 {
  /** One physical stored blob, not another alias to already-counted bytes. */
  readonly id: string;
  readonly kind: SceneImageCacheEntryKindV1;
  readonly bytes: number;
  readonly contentSha256: string;
  readonly lastUseSequence: number;
  readonly pinned: boolean;
  readonly leased: boolean;
  readonly inFlight: boolean;
  readonly exactCopy: SceneImageExactCopyV1 | null;
}
export interface SceneImageCacheCandidateV1 {
  readonly id: string;
  readonly bytes: number;
  readonly contentSha256: string;
  /** Additional TEMPORARY bytes beyond final `bytes`; neither is already in
   * originUsage or otherReservations. Zero means no extra temporary copy. */
  readonly peakStagingBytes: number;
  readonly exactCopy: SceneImageExactCopyV1 | null;
}
export interface SceneImageCachePlanInputV1 {
  readonly inventoryRevision: number;
  readonly reservationRevision: number;
  readonly profile: SceneImageCacheProfileV1;
  /** Explicit desktop setting, including a lower cap; null uses the profile.
   * Other profiles cannot opt into a desktop allowance. */
  readonly desktopCeilingBytes: number | null;
  /** Same-origin only: usage already includes all installed/unknown bytes.
   * Development filesystem model caches must not be charged to origin usage. */
  readonly estimate: Readonly<{ usageBytes: number; quotaBytes: number }> | null;
  /** Disjoint FUTURE margins; never repeat bytes already in origin usage. */
  readonly safetyHeadroomBytes: number;
  readonly saveAndUpdateReserveBytes: number;
  readonly otherReservationsBytes: number;
  readonly entries: readonly SceneImageCacheEntryV1[];
  readonly candidate: SceneImageCacheCandidateV1;
}
export interface SceneImageCacheAccountingV1 {
  readonly inventoriedBytes: number;
  readonly originUsageBytes: number;
  readonly quotaBytes: number;
  readonly currentSceneBytes: number;
  readonly protectedSceneBytes: number;
  readonly eligibleSceneBytes: number;
  readonly otherCommittedOriginBytes: number;
  readonly futureReserveBytes: number;
  readonly candidateBytes: number;
  readonly peakStagingBytes: number;
  readonly requiredReclaimBytes: number;
  readonly projectedSceneBytes: number;
  /** Includes final candidate, temporary staging and reserved future margins. */
  readonly projectedPeakOriginBytes: number;
}
export interface SceneImageCachePlanV1 {
  readonly schema: typeof SCENE_IMAGE_CACHE_PLAN_SCHEMA_V1;
  readonly advisory: true;
  /** `admit` means only that this proposed arithmetic fits supplied evidence. */
  readonly status: 'admit' | 'pause';
  readonly reason: 'within-budget' | 'eviction-proposed' | 'insufficient-disposable-space'
    | 'missing-estimate' | 'invalid-input' | 'inconsistent-accounting' | 'protected-retention-required';
  readonly inventoryRevision: number | null;
  readonly reservationRevision: number | null;
  readonly requestedSceneCeilingBytes: number | null;
  /** Candidate-specific final ceiling, allowing for its extra staging bytes. */
  readonly effectiveSceneCeilingBytes: number | null;
  readonly accounting: SceneImageCacheAccountingV1 | null;
  /** No partial eviction proposal is issued when candidate admission pauses. */
  readonly evictionIds: readonly string[];
  readonly reclaimedBytes: number;
  /** Remaining required reclaim AFTER the proposed IDs, not actual deletion. */
  readonly remainingShortfallBytes: number | null;
}

function requireValue(condition: boolean): asserts condition {
  if (!condition) throw new TypeError('Invalid scene cache planning input');
}
function count(value: unknown, positive = false): number {
  requireValue(typeof value === 'number' && Number.isSafeInteger(value)
    && !Object.is(value, -0) && value >= (positive ? 1 : 0));
  return value;
}
function sum(...values: number[]): number {
  return count(values.reduce((total, value) => total + value, 0));
}
function token(value: unknown): string {
  requireValue(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u.test(value));
  return value;
}
function sha(value: unknown): string {
  requireValue(typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value));
  return value;
}
function flag(value: unknown): boolean {
  requireValue(typeof value === 'boolean'); return value;
}
/** Read each supplied descriptor once, rejecting getters/hooks and extra keys. */
function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value));
  requireValue(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  const actual = Reflect.ownKeys(value);
  requireValue(actual.length === keys.length && actual.every(key => typeof key === 'string' && keys.includes(key)));
  const data = Object.create(null) as Record<string, unknown>;
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    requireValue(!!descriptor && Object.hasOwn(descriptor, 'value') && descriptor.enumerable === true);
    data[key] = descriptor.value;
  }
  return data;
}
function copyEvidence(value: unknown): SceneImageExactCopyV1 | null {
  if (value === null) return null;
  const data = fields(value, ['kind', 'copyId', 'domain', 'contentSha256', 'bytes', 'receiptId', 'protected']);
  requireValue(data.kind === 'verified-exact-copy' && data.protected === true
    && (data.domain === 'origin' || data.domain === 'outside-origin'));
  return { kind: 'verified-exact-copy', protected: true, copyId: token(data.copyId),
    domain: data.domain, contentSha256: sha(data.contentSha256), bytes: count(data.bytes, true),
    receiptId: token(data.receiptId) };
}
function readEntry(value: unknown): SceneImageCacheEntryV1 {
  const data = fields(value, ['id', 'kind', 'bytes', 'contentSha256', 'lastUseSequence', 'pinned', 'leased', 'inFlight', 'exactCopy']);
  requireValue(typeof data.kind === 'string' && ['scene-variant', 'original', 'recipe', 'save', 'build', 'model'].includes(data.kind));
  return { id: token(data.id), kind: data.kind as SceneImageCacheEntryKindV1,
    bytes: count(data.bytes, true), contentSha256: sha(data.contentSha256),
    lastUseSequence: count(data.lastUseSequence), pinned: flag(data.pinned), leased: flag(data.leased),
    inFlight: flag(data.inFlight), exactCopy: copyEvidence(data.exactCopy) };
}
function readEntries(value: unknown): SceneImageCacheEntryV1[] {
  requireValue(Array.isArray(value));
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  requireValue(!!length && Object.hasOwn(length, 'value'));
  const size = count(length.value);
  requireValue(size <= SCENE_IMAGE_CACHE_MAX_ENTRIES_V1 && Reflect.ownKeys(value).length === size + 1);
  const entries: SceneImageCacheEntryV1[] = [];
  for (let index = 0; index < size; index++) {
    const item = Object.getOwnPropertyDescriptor(value, String(index));
    requireValue(!!item && Object.hasOwn(item, 'value') && item.enumerable === true);
    entries.push(readEntry(item.value));
  }
  return entries;
}
function readInput(value: unknown): SceneImageCachePlanInputV1 {
  const data = fields(value, ['inventoryRevision', 'reservationRevision', 'profile', 'desktopCeilingBytes',
    'estimate', 'safetyHeadroomBytes', 'saveAndUpdateReserveBytes', 'otherReservationsBytes', 'entries', 'candidate']);
  requireValue(typeof data.profile === 'string' && Object.hasOwn(SCENE_IMAGE_CACHE_PROFILE_BYTES_V1, data.profile));
  const profile = data.profile as SceneImageCacheProfileV1;
  const desktopCeilingBytes = data.desktopCeilingBytes === null ? null : count(data.desktopCeilingBytes);
  requireValue(desktopCeilingBytes === null || (profile === 'qualified-desktop'
    && desktopCeilingBytes <= SCENE_IMAGE_CACHE_DESKTOP_MAX_BYTES_V1));
  const estimate = data.estimate === null ? null : fields(data.estimate, ['usageBytes', 'quotaBytes']);
  const candidate = fields(data.candidate, ['id', 'bytes', 'contentSha256', 'peakStagingBytes', 'exactCopy']);
  return {
    inventoryRevision: count(data.inventoryRevision), reservationRevision: count(data.reservationRevision),
    profile, desktopCeilingBytes,
    estimate: estimate === null ? null : { usageBytes: count(estimate.usageBytes), quotaBytes: count(estimate.quotaBytes) },
    safetyHeadroomBytes: count(data.safetyHeadroomBytes),
    saveAndUpdateReserveBytes: count(data.saveAndUpdateReserveBytes), otherReservationsBytes: count(data.otherReservationsBytes),
    entries: readEntries(data.entries), candidate: { id: token(candidate.id), bytes: count(candidate.bytes, true),
      contentSha256: sha(candidate.contentSha256), peakStagingBytes: count(candidate.peakStagingBytes),
      exactCopy: copyEvidence(candidate.exactCopy) },
  };
}
function hasSurvivingCopy(
  entry: Pick<SceneImageCacheEntryV1, 'id' | 'contentSha256' | 'bytes' | 'exactCopy'>,
  inventory: ReadonlyMap<string, SceneImageCacheEntryV1>,
  candidateId: string,
): boolean {
  const copy = entry.exactCopy;
  if (copy === null || copy.copyId === entry.id || copy.copyId === candidateId
    || copy.contentSha256 !== entry.contentSha256 || copy.bytes !== entry.bytes) return false;
  if (copy.domain === 'outside-origin') return !inventory.has(copy.copyId);
  const original = inventory.get(copy.copyId);
  return original?.kind === 'original' && original.contentSha256 === copy.contentSha256
    && original.bytes === copy.bytes && !original.inFlight;
}

/** Input evidence must describe one coherent origin revision. Other jobs'
 * reservations exclude this candidate; reserves exclude committed bytes.
 * A future executor must atomically recheck inventory/reservations, pins,
 * leases and exact-copy retention. This advisory function grants no lock. */
export function planSceneImageCacheV1(value: unknown): SceneImageCachePlanV1 {
  let input: SceneImageCachePlanInputV1 | null = null;
  let requested: number | null = null;
  const report = (reason: SceneImageCachePlanV1['reason'], accounting: SceneImageCacheAccountingV1 | null = null,
    effective: number | null = null, ids: readonly string[] = [], reclaimed = 0): SceneImageCachePlanV1 => Object.freeze({
    schema: SCENE_IMAGE_CACHE_PLAN_SCHEMA_V1, advisory: true,
    status: reason === 'within-budget' || reason === 'eviction-proposed' ? 'admit' : 'pause', reason,
    inventoryRevision: input?.inventoryRevision ?? null, reservationRevision: input?.reservationRevision ?? null,
    requestedSceneCeilingBytes: requested, effectiveSceneCeilingBytes: effective,
    accounting: accounting === null ? null : Object.freeze(accounting), evictionIds: Object.freeze([...ids]),
    reclaimedBytes: reclaimed, remainingShortfallBytes: accounting === null ? null
      : Math.max(0, accounting.requiredReclaimBytes - reclaimed),
  });
  try {
    input = readInput(value);
    requested = input.desktopCeilingBytes ?? SCENE_IMAGE_CACHE_PROFILE_BYTES_V1[input.profile];
    const inventory = new Map<string, SceneImageCacheEntryV1>();
    let inventoriedBytes = 0, currentSceneBytes = 0;
    for (const entry of input.entries) {
      requireValue(!inventory.has(entry.id) && entry.id !== input.candidate.id);
      inventory.set(entry.id, entry); inventoriedBytes = sum(inventoriedBytes, entry.bytes);
      if (entry.kind === 'scene-variant') currentSceneBytes = sum(currentSceneBytes, entry.bytes);
    }
    // One claimed physical survivor cannot simultaneously contain different
    // bytes. Reuse is allowed only for identical hash/length assertions.
    const witnesses = new Map<string, SceneImageExactCopyV1>();
    for (const row of [...input.entries, input.candidate]) {
      const copy = row.exactCopy;
      if (copy === null) continue;
      const key = `${copy.domain}:${copy.copyId}`;
      const previous = witnesses.get(key);
      requireValue(previous === undefined || (previous.contentSha256 === copy.contentSha256 && previous.bytes === copy.bytes));
      witnesses.set(key, copy);
    }
    if (input.estimate === null) return report('missing-estimate');
    const { usageBytes, quotaBytes } = input.estimate;
    if (inventoriedBytes > usageBytes) return report('inconsistent-accounting');
    const eligible = input.entries.filter(entry => entry.kind === 'scene-variant'
      && !entry.pinned && !entry.leased && !entry.inFlight
      && hasSurvivingCopy(entry, inventory, input!.candidate.id));
    const eligibleSceneBytes = eligible.reduce((total, entry) => sum(total, entry.bytes), 0);
    const futureReserveBytes = sum(input.safetyHeadroomBytes, input.saveAndUpdateReserveBytes, input.otherReservationsBytes);
    const otherCommittedOriginBytes = usageBytes - currentSceneBytes;
    const finalScene = sum(currentSceneBytes, input.candidate.bytes);
    const peakOrigin = sum(usageBytes, input.candidate.bytes, input.candidate.peakStagingBytes, futureReserveBytes);
    const requiredReclaimBytes = Math.max(0, finalScene - requested, peakOrigin - quotaBytes);
    const effective = Math.min(requested, Math.max(0, quotaBytes
      - sum(otherCommittedOriginBytes, futureReserveBytes, input.candidate.peakStagingBytes)));
    const accounting: SceneImageCacheAccountingV1 = {
      inventoriedBytes, originUsageBytes: usageBytes, quotaBytes, currentSceneBytes,
      protectedSceneBytes: currentSceneBytes - eligibleSceneBytes, eligibleSceneBytes,
      otherCommittedOriginBytes, futureReserveBytes, candidateBytes: input.candidate.bytes,
      peakStagingBytes: input.candidate.peakStagingBytes, requiredReclaimBytes,
      projectedSceneBytes: finalScene, projectedPeakOriginBytes: peakOrigin,
    };
    if (!hasSurvivingCopy(input.candidate, inventory, input.candidate.id)) return report('protected-retention-required', accounting, effective);
    if (eligibleSceneBytes < requiredReclaimBytes) return report('insufficient-disposable-space', accounting, effective);
    // Code-unit ordering is stable across locales and input array permutations.
    eligible.sort((a, b) => a.lastUseSequence - b.lastUseSequence || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const ids: string[] = [];
    let reclaimed = 0;
    for (const entry of eligible) {
      if (reclaimed >= requiredReclaimBytes) break;
      ids.push(entry.id); reclaimed = sum(reclaimed, entry.bytes);
    }
    requireValue(finalScene - reclaimed <= requested && peakOrigin - reclaimed <= quotaBytes);
    return report(ids.length === 0 ? 'within-budget' : 'eviction-proposed', {
      ...accounting, projectedSceneBytes: finalScene - reclaimed, projectedPeakOriginBytes: peakOrigin - reclaimed,
    }, effective, ids, reclaimed);
  } catch {
    return report('invalid-input');
  }
}
