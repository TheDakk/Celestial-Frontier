/* Prime Codex presentation boundary.

   The nine signatures come only from CombatCore's canonical Guardian/Prime
   registry. The five ending ids come only from Persistence's compatibility
   registry; this layer supplies the exact established player-facing copy and
   the legacy Balance predicate without creating another progression system.
   Imported unknown ending ids remain visible, protected evidence and can
   never become a write target. */
import {
  PRIME_SIGNATURES_V1,
  type PrimeSignatureDefinitionV1,
  type PrimeSignatureIdV1,
} from '@cf/domain-combatcore';
import {
  FRONTIER_ENDING_IDS,
  isKnownFrontierEndingId,
  type FrontierEndingId,
  type SaveStateV2,
} from '@cf/persistence';

export const PRIME_CODEX_PANEL_SCHEMA_V1 = 'cf-v2-prime-codex-panel/v1';

export interface FrontierEndingDefinitionV1 {
  readonly id: FrontierEndingId;
  readonly title: string;
  readonly label: string;
  readonly description: string;
  readonly balanceOnly: boolean;
}

const ENDING_DEFINITIONS_BY_ID = Object.freeze({
  conquer: Object.freeze({
    id: 'conquer', title: 'Sovereign of the Frontier',
    label: '⚔ Conquer the Frontier',
    description: 'Rule it. Claim every sector and bend the wild to your will.',
    balanceOnly: false,
  }),
  protect: Object.freeze({
    id: 'protect', title: 'Warden of Life',
    label: '🛡 Protect rare biospheres',
    description: 'Guard the living wonders — no rare biosphere lost on your watch.',
    balanceOnly: false,
  }),
  terraform: Object.freeze({
    id: 'terraform', title: 'World-Shaper',
    label: '🌱 Terraform dead worlds',
    description: 'Seed life into barren rock and make the silent worlds bloom.',
    balanceOnly: false,
  }),
  preserve: Object.freeze({
    id: 'preserve', title: 'The Unseen Hand',
    label: '👁 Preserve, do not interfere',
    description: 'Witness everything. Disturb nothing. Let the galaxy be.',
    balanceOnly: false,
  }),
  balance: Object.freeze({
    id: 'balance', title: 'Prismatic Pathfinder',
    label: '✦ Balance all paths',
    description: 'The true ending — for one who has walked every road.',
    balanceOnly: true,
  }),
} satisfies Readonly<Record<FrontierEndingId, FrontierEndingDefinitionV1>>);

export const FRONTIER_ENDINGS_V1: readonly FrontierEndingDefinitionV1[] = Object.freeze(
  FRONTIER_ENDING_IDS.map((id) => ENDING_DEFINITIONS_BY_ID[id]),
);

export type PrimeCodexProtectionReasonV1 =
  | 'state-shape'
  | 'prime-fill-shape'
  | 'prime-claim-shape'
  | 'frontier-unlocked-shape'
  | 'frontier-unlocked-mismatch'
  | 'frontier-ending-shape'
  | 'frontier-ending-unknown'
  | 'frontier-ending-before-unlock'
  | 'balance-authority-shape'
  | 'balance-ending-mismatch';

export interface PrimeCodexClaimV1 {
  readonly title: string;
  readonly sub: string;
  readonly tier: number;
  readonly hex: string;
}

export interface PrimeCodexSignatureRowV1 {
  readonly definition: PrimeSignatureDefinitionV1;
  readonly claim: PrimeCodexClaimV1 | null;
}

export interface PrimeCodexBalanceAuthorityV1 {
  readonly conqueredWorlds: number;
  readonly mindClaimed: boolean;
  readonly cataloguedSpecies: number;
  readonly unlocked: boolean;
}

export type PrimeCodexFrontierStateV1 =
  | Readonly<{ kind: 'locked' }>
  | Readonly<{ kind: 'open'; balance: PrimeCodexBalanceAuthorityV1 }>
  | Readonly<{
    kind: 'chosen'; ending: FrontierEndingDefinitionV1;
    balance: PrimeCodexBalanceAuthorityV1;
  }>
  | Readonly<{ kind: 'protected'; endingToken: string | null }>;

export interface PrimeCodexProjectionV1 {
  readonly schema: typeof PRIME_CODEX_PANEL_SCHEMA_V1;
  readonly kind: 'projected' | 'protected';
  readonly reason: PrimeCodexProtectionReasonV1 | null;
  readonly rows: readonly PrimeCodexSignatureRowV1[];
  readonly claimedCount: number;
  readonly frontierUnlocked: boolean;
  readonly frontier: PrimeCodexFrontierStateV1;
}

const CLAIM_FIELDS = Object.freeze(['title', 'sub', 'tier', 'hex', 'where'] as const);
const ENDING_SLUG = /^[a-z][a-z0-9-]{0,31}$/u;
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/u;
const SIGNATURE_IDS = new Set<string>(PRIME_SIGNATURES_V1.map(({ id }) => id));

function plainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function ownData(value: object, field: PropertyKey): PropertyDescriptor | null {
  const descriptor = Object.getOwnPropertyDescriptor(value, field);
  return descriptor && 'value' in descriptor && descriptor.enumerable === true
    ? descriptor : null;
}

function exactDenseArray(value: unknown): value is readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return false;
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
    || length.value < 0 || Reflect.ownKeys(value).length !== length.value + 1) return false;
  for (let index = 0; index < length.value; index++) {
    if (ownData(value, String(index)) === null) return false;
  }
  return true;
}

function claimFrom(value: unknown): PrimeCodexClaimV1 | null {
  if (!plainRecord(value)) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== CLAIM_FIELDS.length
    || keys.some((key) => typeof key !== 'string' || !CLAIM_FIELDS.includes(key as typeof CLAIM_FIELDS[number]))) {
    return null;
  }
  const fields: Partial<Record<typeof CLAIM_FIELDS[number], unknown>> = {};
  for (const field of CLAIM_FIELDS) {
    const descriptor = ownData(value, field);
    if (descriptor === null) return null;
    fields[field] = descriptor.value;
  }
  if (typeof fields.title !== 'string' || fields.title.length < 1 || fields.title.length > 48
    || typeof fields.sub !== 'string' || fields.sub.length > 32
    || !Number.isSafeInteger(fields.tier) || (fields.tier as number) < 0 || (fields.tier as number) > 14
    || typeof fields.hex !== 'string' || !HEX_COLOR.test(fields.hex)) return null;
  return Object.freeze({
    title: fields.title,
    sub: fields.sub,
    tier: fields.tier as number,
    hex: fields.hex,
  });
}

function protectedProjection(
  reason: PrimeCodexProtectionReasonV1,
  claims: ReadonlyMap<PrimeSignatureIdV1, PrimeCodexClaimV1>,
  frontierUnlocked: boolean,
  endingToken: string | null,
): PrimeCodexProjectionV1 {
  return Object.freeze({
    schema: PRIME_CODEX_PANEL_SCHEMA_V1,
    kind: 'protected',
    reason,
    rows: Object.freeze(PRIME_SIGNATURES_V1.map((definition) => Object.freeze({
      definition,
      claim: claims.get(definition.id) ?? null,
    }))),
    claimedCount: claims.size,
    frontierUnlocked,
    frontier: Object.freeze({ kind: 'protected', endingToken }),
  });
}

/** Read-only projection over imported/durable Prime and ending authority.
 * It never repairs a mismatch or interprets an unknown future ending id. */
export function projectPrimeCodexV1(state: SaveStateV2): PrimeCodexProjectionV1 {
  const claims = new Map<PrimeSignatureIdV1, PrimeCodexClaimV1>();
  if (!plainRecord(state)) return protectedProjection('state-shape', claims, false, null);
  const primeDescriptor = ownData(state, 'primeFill');
  if (primeDescriptor === null || !plainRecord(primeDescriptor.value)) {
    return protectedProjection('prime-fill-shape', claims, false, null);
  }
  for (const key of Reflect.ownKeys(primeDescriptor.value)) {
    if (typeof key !== 'string' || !SIGNATURE_IDS.has(key)) {
      return protectedProjection('prime-fill-shape', claims, false, null);
    }
    const descriptor = ownData(primeDescriptor.value, key);
    const claim = descriptor === null ? null : claimFrom(descriptor.value);
    if (claim === null) return protectedProjection('prime-claim-shape', claims, false, null);
    claims.set(key as PrimeSignatureIdV1, claim);
  }

  const unlockedDescriptor = ownData(state, 'frontierUnlocked');
  if (unlockedDescriptor === null || typeof unlockedDescriptor.value !== 'boolean') {
    return protectedProjection('frontier-unlocked-shape', claims, false, null);
  }
  const frontierUnlocked = unlockedDescriptor.value;
  if (frontierUnlocked !== (claims.size === PRIME_SIGNATURES_V1.length)) {
    return protectedProjection('frontier-unlocked-mismatch', claims, frontierUnlocked, null);
  }

  const endingDescriptor = ownData(state, 'frontierEnding');
  if (endingDescriptor === null || (endingDescriptor.value !== null
    && (typeof endingDescriptor.value !== 'string' || !ENDING_SLUG.test(endingDescriptor.value)))) {
    return protectedProjection('frontier-ending-shape', claims, frontierUnlocked, null);
  }
  const endingToken = endingDescriptor.value as string | null;
  if (endingToken !== null && !isKnownFrontierEndingId(endingToken)) {
    return protectedProjection('frontier-ending-unknown', claims, frontierUnlocked, endingToken);
  }
  if (endingToken !== null && !frontierUnlocked) {
    return protectedProjection('frontier-ending-before-unlock', claims, frontierUnlocked, endingToken);
  }

  const conqueredDescriptor = ownData(state, 'conquered');
  const codexDescriptor = ownData(state, 'codex');
  if (conqueredDescriptor === null || codexDescriptor === null
    || !exactDenseArray(conqueredDescriptor.value) || !exactDenseArray(codexDescriptor.value)) {
    return protectedProjection('balance-authority-shape', claims, frontierUnlocked, endingToken);
  }
  const balance = Object.freeze({
    conqueredWorlds: conqueredDescriptor.value.length,
    mindClaimed: claims.has('mind'),
    cataloguedSpecies: codexDescriptor.value.length,
    unlocked: conqueredDescriptor.value.length >= 3
      && claims.has('mind') && codexDescriptor.value.length >= 40,
  });
  if (endingToken === 'balance' && !balance.unlocked) {
    return protectedProjection('balance-ending-mismatch', claims, frontierUnlocked, endingToken);
  }

  const rows = Object.freeze(PRIME_SIGNATURES_V1.map((definition) => Object.freeze({
    definition,
    claim: claims.get(definition.id) ?? null,
  })));
  const frontier: PrimeCodexFrontierStateV1 = !frontierUnlocked
    ? Object.freeze({ kind: 'locked' })
    : endingToken === null
      ? Object.freeze({ kind: 'open', balance })
      : Object.freeze({
        kind: 'chosen', ending: ENDING_DEFINITIONS_BY_ID[endingToken], balance,
      });
  return Object.freeze({
    schema: PRIME_CODEX_PANEL_SCHEMA_V1,
    kind: 'projected',
    reason: null,
    rows,
    claimedCount: claims.size,
    frontierUnlocked,
    frontier,
  });
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/[<>&"']/gu, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function signatureRow(row: PrimeCodexSignatureRowV1): string {
  const { definition, claim } = row;
  const status = claim === null ? 'Unclaimed' : 'Claimed';
  const body = claim === null
    ? '<p class="prime-guardian">⚔ Guarded by <b>' + esc(definition.guardianName) + '</b></p>'
      + '<p>' + esc(definition.lore) + '</p>'
      + '<p class="sub">📡 ' + esc(definition.reach) + '</p>'
      + '<p class="sub">Hunt: ' + esc(definition.hunt) + '</p>'
    : '<div class="prime-claim" style="--prime-claim-color:' + esc(claim.hex) + '">'
      + '<b>' + esc(claim.title) + '</b>'
      + (claim.sub ? '<span class="sub">' + esc(claim.sub) + '</span>' : '')
      + '<span class="sub">Tier ' + claim.tier + ' record</span></div>';
  return '<details class="prime-signature" data-prime-signature-id="' + esc(definition.id)
    + '" data-prime-signature-state="' + (claim === null ? 'unclaimed' : 'claimed') + '">'
    + '<summary><span class="prime-signature-icon" aria-hidden="true">' + esc(definition.icon)
    + '</span><span><b>' + esc(definition.signatureName) + '</b><span class="sub">'
    + esc(definition.element) + ' · ' + status + '</span></span><span aria-hidden="true">'
    + (claim === null ? '○' : '✓') + '</span></summary><div class="prime-signature-body">'
    + body + '</div></details>';
}

export interface PrimeCodexRenderOptionsV1 {
  readonly pending: boolean;
  readonly writable: boolean;
  readonly status: string | null;
}

function frontierMarkup(
  projection: PrimeCodexProjectionV1,
  options: PrimeCodexRenderOptionsV1,
): string {
  const status = '<p class="sub" role="status" aria-live="polite" data-frontier-ending-status>'
    + esc(options.status ?? '') + '</p>';
  if (projection.frontier.kind === 'protected') {
    const token = projection.frontier.endingToken === null ? ''
      : ' Preserved ending id: <code>' + esc(projection.frontier.endingToken) + '</code>.';
    return '<section class="prime-frontier" data-frontier-state="protected"><h3>Celestial Frontier</h3>'
      + '<p>This record is protected because its saved Prime or ending authority could not be verified.'
      + token + ' Nothing was changed.</p>' + status + '</section>';
  }
  if (projection.frontier.kind === 'locked') {
    return '<section class="prime-frontier" data-frontier-state="locked"><h3>Celestial Frontier</h3>'
      + '<p>Complete all nine elemental Signatures to open the Frontier.</p>' + status + '</section>';
  }
  if (projection.frontier.kind === 'chosen') {
    return '<section class="prime-frontier" data-frontier-state="chosen" data-frontier-ending="'
      + esc(projection.frontier.ending.id) + '"><h3>Celestial Frontier</h3><h4>'
      + esc(projection.frontier.ending.title) + '</h4><p>You chose your legacy: <b>'
      + esc(projection.frontier.ending.title)
      + '</b>. The frontier endures, the infinite galaxy remains open, and so do you.</p>'
      + status + '</section>';
  }
  const balance = projection.frontier.balance;
  const buttons = FRONTIER_ENDINGS_V1.map((ending) => {
    const available = !ending.balanceOnly || balance.unlocked;
    const disabled = !available || options.pending || !options.writable;
    const description = available ? ending.description
      : 'Locked — conquer 3 worlds, find a mind, and catalogue 40+ species';
    return '<button type="button" class="frontier-ending-choice' + (ending.balanceOnly ? ' prism' : '')
      + '" data-frontier-ending-id="' + esc(ending.id) + '"'
      + (disabled ? ' disabled aria-disabled="true"' : '') + '><b>' + esc(ending.label)
      + (available ? '' : ' 🔒') + '</b><span>' + esc(description) + '</span></button>';
  }).join('');
  return '<section class="prime-frontier" data-frontier-state="open"><h3>Celestial Frontier</h3>'
    + '<p>Choose the legacy your Pathfinder will carry. The infinite galaxy stays open afterward.</p>'
    + '<div class="frontier-ending-list" aria-label="Celestial Frontier endings">' + buttons + '</div>'
    + status + '</section>';
}

/** Escaped, bounded markup. Native details and native buttons carry pointer
 * and keyboard activation; Main owns panel lifecycle and the F4 action. */
export function renderPrimeCodexPanelV1(
  projection: PrimeCodexProjectionV1,
  options: PrimeCodexRenderOptionsV1,
): string {
  return '<section class="prime-codex" data-prime-codex="' + PRIME_CODEX_PANEL_SCHEMA_V1 + '">'
    + '<h3>Prime Codex</h3><div class="prime-progress"><span><b>' + projection.claimedCount
    + '</b> / ' + projection.rows.length + ' Signatures</span><progress aria-label="Prime Codex completion" value="'
    + projection.claimedCount + '" max="' + projection.rows.length + '"></progress></div>'
    + '<div class="prime-signature-list" aria-label="Nine elemental Signatures">'
    + projection.rows.map(signatureRow).join('') + '</div>'
    + frontierMarkup(projection, options) + '</section>';
}
