/* Outposts P3 — one deterministic F4 receipt per outpost action (D14; N4 §5 P3): start a site, build its next stage, abandon it
   (full refund), or choose a finished Sanctuary's residents.

   The derive re-reads EVERY fact inside the transaction (the pattern of binder-sets.ts): the carrier, the Charter unlock, research,
   landed/conquered worlds, the landings counter, the companions' meals (Arc 5 ownership) and the parts on hand (the Arc 2 loot carrier,
   whose legacy `items` mirror must agree before and after). Parts are spent or refunded on the Arc 2 carrier itself, so the Fabricator,
   Inventory and the legacy mirror see one truth; Stardust moves on `essence`. Deeds are counted from the counters those owners already
   write, against the baseline recorded when the stage opened — so the Landing, Mine, Bioscan and Feed transactions are unchanged and a
   deed done before a stage opened can never count. Draws no RNG; reads no clock beyond the committed active-play snapshot. */
import { SCENE_OWNERSHIP_ADDRESS_RESOLVER, canonicalJson, sha256Hex, type OwnershipStateV2 } from '@cf/domain-acquisition';
import {
  arc2LootLegacyMirrorMatches,
  prepareArc2LootInventoryWrite,
  projectArc2LootLegacyMirror,
  readArc2Loot,
  type Arc2LootStackableCountV1,
} from './arc2-loot.js';
import { readArc5OwnershipMigration } from './arc5-ownership-migration.js';
import type { SaveStateV2 } from './import-v2.js';
import type { V5ExtensionWrite, V5Extensions } from './migration-v5.js';
import type { F4OutcomeDerivation } from './outcome-transaction.js';
import { outpostProjectsWriteV1, readOutpostProjectsV1 } from './outposts-carrier.js';
import {
  abandonOutpostV1,
  buildOutpostStageV1,
  setSanctuaryResidentsV1,
  startOutpostV1,
  type OutpostKindV1,
  type OutpostSaveFactsV1,
  type OutpostTransitionV1,
  type OutpostWorldContextV1,
} from './outposts.js';

export const OUTPOST_OPERATION_V1 = 'outpost-project' as const;
export const OUTPOST_WITNESS_SCHEMA_V1 = 'cf-v2-outpost-witness/v1' as const;

export type OutpostRequestV1 =
  | Readonly<{ kind: 'start'; outpost: OutpostKindV1; context: OutpostWorldContextV1 }>
  | Readonly<{ kind: 'build'; siteId: string; standingHere: boolean }>
  | Readonly<{ kind: 'abandon'; siteId: string }>
  | Readonly<{ kind: 'residents'; siteId: string; residents: readonly string[] }>;

function ownershipOf(extensions: V5Extensions): OwnershipStateV2 | null | 'protected' {
  const read = readArc5OwnershipMigration(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (read.kind === 'absent') return null;
  if (read.kind !== 'loaded') return 'protected';
  return read.state;
}
const fedTotalOf = (ownership: OwnershipStateV2 | null): number =>
  ownership === null ? 0 : ownership.creatures.reduce((sum, c) => sum + (Number.isSafeInteger(c.fed) ? (c.fed as number) : 0), 0);

/** The facts every outpost decision reads, from ONE save + extensions (the card, the board and the transaction all use this). */
export function outpostSaveFactsV1(state: SaveStateV2, extensions: V5Extensions): OutpostSaveFactsV1 | null {
  const loot = readArc2Loot(extensions);
  const items: Record<string, number> = {};
  if (loot.kind === 'loaded') for (const [id, n] of projectArc2LootLegacyMirror(loot.state).items) items[id] = n;
  else for (const [id, n] of state.items) items[id] = n;
  const ownership = ownershipOf(extensions);
  if (ownership === 'protected') return null;
  return Object.freeze({
    honouredCharters: Object.freeze([...state.chDone]),
    research: Object.freeze([...state.techOwned]),
    landed: Object.freeze([...state.landed]),
    conquered: Object.freeze(state.conquered.map(([key]) => Number(key)).filter((n) => Number.isSafeInteger(n))),
    landings: Number.isSafeInteger(state.stats.landings) ? state.stats.landings! : 0,
    fedTotal: fedTotalOf(ownership),
    items: Object.freeze(items),
    stardust: Number.isSafeInteger(state.essence) ? state.essence : 0,
  });
}

/** Derive one outpost action for the generic F4 deterministic owner. Throws on any refusal (the owner commits nothing). */
export function deriveOutpostActionV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  receiptOrdinal: number;
  activePlayMs: number;
  request: OutpostRequestV1;
}>): F4OutcomeDerivation {
  const { draft, request } = input;
  const read = readOutpostProjectsV1(input.extensions);
  if (read.kind !== 'loaded') throw new Error(`outposts carrier is ${read.reason}`);
  const facts = outpostSaveFactsV1(draft, input.extensions);
  if (facts === null) throw new Error('outposts: companion ownership is protected');
  let transition: OutpostTransitionV1;
  if (request.kind === 'start') transition = startOutpostV1(read.state, facts, request.outpost, request.context, input.activePlayMs);
  else if (request.kind === 'build') transition = buildOutpostStageV1(read.state, facts, request.siteId, { standingHere: request.standingHere === true }, input.activePlayMs);
  else if (request.kind === 'abandon') transition = abandonOutpostV1(read.state, request.siteId);
  else if (request.kind === 'residents') {
    const ownership = ownershipOf(input.extensions);
    if (ownership === 'protected') throw new Error('outposts: companion ownership is protected');
    transition = setSanctuaryResidentsV1(read.state, request.siteId, request.residents, ownership === null ? [] : ownership.creatures.map((c) => c.creatureId));
  } else throw new Error('outposts: unknown request');
  if (transition.kind !== 'ok') throw new Error(`outposts refused: ${transition.reason}`);

  const writes: V5ExtensionWrite[] = [];
  const deltas = Object.entries(transition.itemDeltas).filter(([, d]) => d !== 0).sort(([a], [b]) => (a < b ? -1 : 1));
  if (deltas.length > 0) {
    const loot = readArc2Loot(input.extensions);
    if (loot.kind !== 'loaded' || loot.state.kind !== 'inventory') throw new Error(`outposts: parts carrier is ${loot.kind === 'loaded' ? loot.state.kind : loot.kind}`);
    if (!arc2LootLegacyMirrorMatches(loot.state, draft)) throw new Error('outposts: parts mirror disagrees with its carrier');
    const counts = new Map(loot.state.stackableCounts.map((row) => [row.baseId, row.count] as const));
    for (const [id, delta] of deltas) {
      const next = (counts.get(id) ?? 0) + delta;
      if (!Number.isSafeInteger(next) || next < 0) throw new Error(`outposts: part ${id} would go negative`);
      if (next === 0) counts.delete(id); else counts.set(id, next);
    }
    const stackableCounts: Arc2LootStackableCountV1[] = [...counts.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([baseId, count]) => ({ baseId, count }));
    const prepared = prepareArc2LootInventoryWrite({ extensions: input.extensions, inventory: loot.state.inventory, stackableCounts });
    if (prepared.kind !== 'prepared') throw new Error(`outposts: parts write ${prepared.reason}`);
    const mirror = projectArc2LootLegacyMirror(prepared.state);
    draft.items = mirror.items.map(([id, n]) => [id, n] as [string, number]);
    writes.push(prepared.write);
  }
  if (transition.stardustDelta !== 0) {
    const next = draft.essence + transition.stardustDelta;
    if (!Number.isSafeInteger(next) || next < 0) throw new Error('outposts: Stardust would go negative');
    draft.essence = next;
  }
  writes.push(outpostProjectsWriteV1(transition.state));
  const siteId = request.kind === 'start' ? transition.site!.id : request.siteId;
  return Object.freeze({
    state: draft,
    extensionWrites: Object.freeze(writes),
    witness: canonicalJson({ schema: OUTPOST_WITNESS_SCHEMA_V1, receiptOrdinal: input.receiptOrdinal, action: request.kind,
      siteDigest: sha256Hex(siteId), built: transition.site?.built ?? null, items: Object.fromEntries(deltas),
      stardust: transition.stardustDelta } as never),
  });
}
