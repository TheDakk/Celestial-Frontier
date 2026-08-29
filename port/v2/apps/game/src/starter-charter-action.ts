/* Shared app-side Starter Charter transaction join.

   Exact action owners stage a Charter event against their already-staged
   product extensions, then land the Charter successor and any reward carrier
   replacement in the same F4 transaction. The compact fact is suitable for
   postcommit UI; no presentation or live singleton crosses this boundary. */
import {
  applyV5ExtensionWrites,
  type SaveStateV2,
  type V5ExtensionWrite,
  type V5Extensions,
} from '@cf/persistence';
import {
  stageStarterCharterEventV1,
  type StarterCharterCompletionV1,
  type StarterCharterEventV1,
} from './starter-charters.js';

export type StarterCharterActionEventFactV1 =
  | Readonly<{ kind: 'landfall' | 'mined'; worldKey: string; planetSeed: number }>
  | Readonly<{ kind: 'scout-set'; scoutId: string }>
  | Readonly<{ kind: 'crafted'; baseId: string; category: string }>;

export interface StarterCharterActionFactV1 {
  readonly changed: boolean;
  readonly event: StarterCharterActionEventFactV1;
  readonly progressIds: readonly string[];
  readonly completions: readonly StarterCharterCompletionV1[];
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly addedAchievementIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
}

function compactEvent(event: StarterCharterEventV1): StarterCharterActionEventFactV1 {
  if (event.kind === 'landfall' || event.kind === 'mined') {
    return Object.freeze({
      kind: event.kind,
      worldKey: event.address.key,
      planetSeed: event.address.planet.seed,
    });
  }
  return Object.freeze({ ...event });
}

export type StarterCharterActionStageOutcomeV1 =
  | Readonly<{
    kind: 'ready';
    fact: StarterCharterActionFactV1;
    extensionWrites: readonly V5ExtensionWrite[];
    extensions: V5Extensions;
    witness: string;
  }>
  | Readonly<{ kind: 'refused'; reason: string }>;

function compactFact(
  event: StarterCharterEventV1,
  facts: Exclude<ReturnType<typeof stageStarterCharterEventV1>, { readonly kind: 'refused' }>['facts'],
): StarterCharterActionFactV1 {
  return Object.freeze({
    changed: facts.changed,
    event: compactEvent(event),
    progressIds: Object.freeze([...facts.progressIds]),
    completions: Object.freeze(facts.completions.map((completion) => Object.freeze({ ...completion }))),
    priorUnlockedIds: Object.freeze([...facts.priorUnlockedIds]),
    nextUnlockedIds: Object.freeze([...facts.nextUnlockedIds]),
    addedAchievementIds: Object.freeze([...facts.addedAchievementIds]),
    priorBestRankIndex: facts.priorBestRankIndex,
    nextBestRankIndex: facts.nextBestRankIndex,
  });
}

function mergeSuccessorWrites(
  predecessor: readonly V5ExtensionWrite[],
  successor: readonly V5ExtensionWrite[],
): readonly V5ExtensionWrite[] {
  const writes = [...predecessor];
  const positions = new Map<string, number>();
  writes.forEach(({ segment, namespace }, index) => {
    positions.set(`${segment}\u0000${namespace}`, index);
  });
  for (const write of successor) {
    const identity = `${write.segment}\u0000${write.namespace}`;
    const prior = positions.get(identity);
    if (prior === undefined) {
      positions.set(identity, writes.length);
      writes.push(write);
    } else {
      writes[prior] = write;
    }
  }
  return Object.freeze(writes);
}

function bindWitness(
  predecessor: string,
  fact: StarterCharterActionFactV1,
): string {
  if (!fact.changed) return predecessor;
  const decoded: unknown = JSON.parse(predecessor);
  if (decoded === null || typeof decoded !== 'object' || Array.isArray(decoded)
    || Object.prototype.hasOwnProperty.call(decoded, 'starterCharter')) {
    throw new Error('starter Charter predecessor witness is not composable');
  }
  return JSON.stringify({
    ...(decoded as Readonly<Record<string, unknown>>),
    starterCharter: fact,
  });
}

/** Stage one action event after its product writes. A later Charter reward
 * replacement supersedes the same namespace instead of creating two owners. */
export function stageStarterCharterActionV1(input: Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  predecessorWrites: readonly V5ExtensionWrite[];
  predecessorWitness: string;
  event: StarterCharterEventV1;
  receiptOrdinal: number;
}>): StarterCharterActionStageOutcomeV1 {
  try {
    const predecessor = applyV5ExtensionWrites(input.extensions, input.predecessorWrites);
    const staged = stageStarterCharterEventV1({
      draft: input.draft,
      extensions: predecessor.extensions,
      event: input.event,
      receiptOrdinal: input.receiptOrdinal,
    });
    if (staged.kind === 'refused') {
      return Object.freeze({ kind: 'refused', reason: staged.reason });
    }
    const successor = applyV5ExtensionWrites(
      predecessor.extensions,
      staged.facts.extensionWrites,
    );
    const combined = mergeSuccessorWrites(predecessor.writes, successor.writes);
    const final = applyV5ExtensionWrites(input.extensions, combined);
    if (JSON.stringify(final.extensions) !== JSON.stringify(successor.extensions)) {
      return Object.freeze({
        kind: 'refused', reason: 'starter Charter extension successor mismatch',
      });
    }
    const fact = compactFact(input.event, staged.facts);
    return Object.freeze({
      kind: 'ready',
      fact,
      extensionWrites: final.writes,
      extensions: final.extensions,
      witness: bindWitness(input.predecessorWitness, fact),
    });
  } catch (error) {
    return Object.freeze({
      kind: 'refused',
      reason: error instanceof Error ? error.message : 'starter Charter action staging failed',
    });
  }
}

/** Publish only the fields owned by Starter Charter progress, rewards, and
 * the progression refresh that follows a newly completed Charter. */
export function publishStarterCharterActionFieldsV1(
  target: SaveStateV2,
  committed: SaveStateV2,
): void {
  target.chacc = [...committed.chacc];
  target.chDone = [...committed.chDone];
  target.chProg = { ...committed.chProg };
  target.essence = committed.essence;
  target.stats = { ...committed.stats };
  target.items = committed.items.map(([id, count]) => [id, count]);
  target.equip = { ...committed.equip };
  target.equipAff = Object.fromEntries(Object.entries(committed.equipAff).map(([slot, affix]) => [
    slot, { ...affix },
  ]));
  target.unlocked = [...committed.unlocked];
}
