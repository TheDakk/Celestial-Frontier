/* A meal for a companion, committed: one press of a flora in the Feed picker, or one press of "Mend — safest
   meals", in one receipt, or nothing at all.

   LEGACY celestial-frontier.html, v1.8.9, for what stands around the meal:
   - Feed stands on a beast the Compendium holds, and its picker lists the flora held (15146-15148, 19025-19027);
   - the flora is always eaten: it leaves the Compendium (`feedPair` 18915, `removeFromCodex` 18808-18821) and can
     be scavenged again;
   - every meal is counted in `stats.feeds` (19184) and the achievements are looked at (19211; `feed5`);
   - "Mend — safest meals" stands after training on a hurt beast, and serves up to ten meals in one press, the
     safest first, until the beast is whole or no safe flora is left (19029-19063; the order is `mendOrder`). By
     D13's numbers a safe meal mends 0.10 at least, so the tenth always makes a beast whole and the limit of ten
     is never what ends a run; it is kept as the legacy rule it is.
   What a meal does to the companion is Dakk's decision D13 (2026-09-25), not the legacy roll: `meals.ts`. With no
   roll there is no toxic bite, so a meal never fails, `stats.feedfails` never rises, a beast never dies of one,
   and Mend never stops for one. A companion that rests, or is away, is not fed (D13: Rest locks "breed, combat,
   dispatch and Feed until ready"); the lock is read on the receipt's own clock of active play.

   NOT SAID HERE: the `fed` deed (19185). Its listeners are the weekly Charter `wk-feed` (24760) and a lesson of
   training (25423), neither built; the facts hold what each needs. Of the legacy game's lines about how the beast
   took the meal (`FEED_EVENTS` 18893-18912), which the roll D13 removed picked among, one a taste is said
   (`MEAL_LINES` in `notices.ts`). */
import { createCreatureInstanceV1, withoutSpeciesV1, type CreatureInstanceV1, type OwnershipStateContentsV1, type OwnershipStateV1 } from '@cf/domain-acquisition';
import { withCompanionBondMemoriesV1 } from '@cf/domain-acquisition/companion-care';
import type { SaveStateV2 } from '@cf/persistence';
import { creatureCondition, type CreatureConditionLabel } from './bioscan-hazard';
import { bondOf, companionLock } from './bond';
import { commitCare, refreshProgression, refuse, settleCare, type CareAuthority, type CareDoor, type CareOutcome, type CareReceipt, type CareStaged } from './commit';
import { MEND_MEALS_MAX, feedMeal, flavourOf, mendOrder, tasteOf, type Flavour, type Taste } from './meals';
import { compendiumRow, contentsOf, ownershipOf, stageOwnership } from './ownership';

export const FEED_ACTION = 'feed' as const;
export const FEED_RECEIPT_KIND_V1 = 'care-feed-v1' as const;
export const MEND_ACTION = 'mend' as const;
export const MEND_RECEIPT_KIND_V1 = 'care-mend-v1' as const;

/** One flora eaten. */
export interface FedMealV1 {
  readonly floraId: string;
  readonly floraName: string;
  readonly taste: Taste;
  readonly flavour: Flavour;
  readonly tier: number;
  readonly fedAfter: number;
  readonly fedGain: number;
  readonly hurtBefore: number;
  readonly hurtAfter: number;
  readonly mended: boolean;
  readonly condition: CreatureConditionLabel;
  readonly xpGain: number;
  readonly xpAfter: number;
  /** The bond memories this meal made: the first meal, a flavour first tasted. */
  readonly newMemoryIds: readonly string[];
}
export interface FeedFactsV1 {
  readonly speciesId: string;
  readonly name: string;
  /** The meals served, in order: one for Feed, up to ten for Mend. */
  readonly meals: readonly FedMealV1[];
  /** Why a Mend ended: the beast is whole, no safe flora is left, or ten were served. Null for Feed. */
  readonly halt: 'mended' | 'out-of-safe-flora' | 'ten-served' | null;
  /** `stats.feeds` afterwards. */
  readonly feeds: number;
  readonly bond: Readonly<{ levelBefore: number; levelAfter: number; memories: number }>;
  readonly achievementIds: readonly string[];
}
export type FeedActionOutcomeV1 = CareOutcome<FeedFactsV1>;

export interface FeedActionInputV1 {
  readonly runtime: CareAuthority;
  /** The last stored state. */
  readonly state: SaveStateV2;
  /** The Compendium id of the beast fed. */
  readonly speciesId: string;
  /** The Compendium id of the flora picked. */
  readonly floraId: string;
  readonly codecNow: number;
}
export type MendActionInputV1 = Omit<FeedActionInputV1, 'floraId'>;

interface Plant { readonly id: string; readonly name: string; readonly genome: Readonly<{ seed?: unknown }>; readonly tier: number }
/** The flora the Compendium holds, in its order, as a meal reads them. */
const larder = (state: SaveStateV2): Plant[] => state.codex.filter(([, entry]) => entry.kind === 'Flora')
  .map(([id, entry]) => ({ id, name: entry.name, genome: entry.g, tier: entry.tier ?? 0 }));

/** The beast a meal is for; raises a `CareRefusal` when the Compendium holds no such beast. */
function beastOf(ownership: OwnershipStateV1, speciesId: string): CreatureInstanceV1 {
  const row = compendiumRow(ownership, speciesId);
  if (row === null) return refuse('not-in-compendium');
  if (row.species.kingdom !== 'fauna') return refuse('not-a-beast');
  if (row.creature === null) return refuse('no-creature');
  return row.creature;
}

/** Serves these flora to the beast in order, on the receipt's draft, and stages the carrier's step. */
function serve(receipt: CareReceipt, speciesId: string, pick: (creature: CreatureInstanceV1, plants: readonly Plant[], served: number) => Plant | null): Omit<FeedFactsV1, 'halt'> & { extensionWrites: CareStaged<FeedFactsV1>['extensionWrites'] } {
  const { draft, extensions, activePlayMs } = receipt;
  const ownership = ownershipOf(extensions);
  const before = beastOf(ownership, speciesId);
  // A companion that rests, or is away, is not fed; one that recovers after a union is.
  const lock = companionLock(before, activePlayMs);
  if (lock === 'resting' || lock === 'away') return refuse(lock);
  let creature = before;
  let contents: OwnershipStateContentsV1 = contentsOf(ownership);
  let plants = larder(draft);
  const meals: FedMealV1[] = [];
  for (let plant = pick(creature, plants, 0); plant !== null; plant = pick(creature, plants, meals.length)) {
    const eaten = plant;
    const row = compendiumRow(ownership, eaten.id);
    if (row === null) return refuse('food:not-in-compendium');
    if (row.species.kingdom !== 'flora') return refuse('food:not-flora');
    const flavour = flavourOf(eaten.genome);
    const meal = feedMeal({
      taste: tasteOf(creature.genome, flavour), tier: eaten.tier, flavour, fed: creature.fed ?? 0, hurt: creature.hurt ?? 0, xp: creature.xp ?? 0,
      memories: (creature.bond?.memories ?? []).map(({ id }) => id),
    });
    const hurtBefore = creature.hurt ?? 0;
    creature = createCreatureInstanceV1({
      ...creature,
      fed: meal.fedAfter,
      // A beast made whole holds no hurt at all (18957).
      hurt: meal.hurtAfter === 0 ? null : meal.hurtAfter,
      xp: meal.xpGain > 0 ? meal.xpAfter : creature.xp,
      bond: withCompanionBondMemoriesV1(creature.bond, meal.newMemories, activePlayMs),
    });
    // The meal is always eaten: the flora leaves the Compendium (18915).
    contents = withoutSpeciesV1(contents, row.species.speciesId);
    plants = plants.filter(({ id }) => id !== eaten.id);
    meals.push(Object.freeze({
      floraId: eaten.id, floraName: eaten.name, taste: meal.taste, flavour, tier: eaten.tier, fedAfter: meal.fedAfter, fedGain: meal.fedGain,
      hurtBefore, hurtAfter: meal.hurtAfter, mended: meal.mended, condition: creatureCondition(meal.hurtAfter).label,
      xpGain: meal.xpGain, xpAfter: meal.xpAfter, newMemoryIds: Object.freeze(meal.newMemories.map(({ id }) => id)),
    }));
  }
  const fed = creature;
  const unlockedBefore = new Set(draft.unlocked);
  const name = draft.codex.find(([id]) => id === speciesId)?.[1].name ?? '';
  const extensionWrites = stageOwnership({
    draft, extensions, parent: ownership, touched: [speciesId],
    contents: { ...contents, creatures: contents.creatures.map((row) => row.creatureId === fed.creatureId ? fed : row) },
  });
  // Every meal is counted (19184), then the achievements are looked at (19211).
  draft.stats = { ...draft.stats, feeds: (draft.stats.feeds ?? 0) + meals.length };
  refreshProgression(draft);
  return {
    speciesId, name, meals: Object.freeze(meals), feeds: draft.stats.feeds ?? 0,
    bond: Object.freeze({ levelBefore: bondOf(before.bond?.memories.length ?? 0).level, levelAfter: bondOf(fed.bond?.memories.length ?? 0).level, memories: fed.bond?.memories.length ?? 0 }),
    achievementIds: Object.freeze(draft.unlocked.filter((id) => !unlockedBefore.has(id))), extensionWrites,
  };
}

/** Null when the stored state holds what these facts say; else the first thing that is not there. */
function verify(stored: SaveStateV2, facts: FeedFactsV1): string | null {
  const last = facts.meals.at(-1)!;
  const g = stored.codex.find(([id]) => id === facts.speciesId)?.[1].g;
  return facts.meals.some(({ floraId }) => stored.codex.some(([id]) => id === floraId)) ? 'flora'
    : g === undefined || (Number(g.fed) || 0) !== last.fedAfter ? 'fed'
      : (Number(g.hurt) || 0) !== last.hurtAfter ? 'hurt'
        : last.xpGain > 0 && g.xp !== last.xpAfter ? 'experience'
          : ((g.bond as { memories?: unknown[] } | undefined)?.memories?.length ?? 0) !== facts.bond.memories ? 'bond'
            : (stored.stats.feeds ?? 0) !== facts.feeds ? 'feeds'
              : facts.achievementIds.some((id) => !stored.unlocked.includes(id)) ? 'achievements' : null;
}

/** Commits one meal. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export function commitFeedV1(input: FeedActionInputV1): Promise<FeedActionOutcomeV1> {
  const { speciesId, floraId } = input;
  return commitCare<FeedFactsV1>({
    runtime: input.runtime, state: input.state, codecNow: input.codecNow, receiptKind: FEED_RECEIPT_KIND_V1,
    route: () => ({ operation: `care.feed:${speciesId}:${floraId}` }),
    preflight: (state, extensions) => {
      const ownership = ownershipOf(extensions);
      beastOf(ownership, speciesId);
      const plant = compendiumRow(ownership, floraId);
      if (plant === null) return refuse('food:not-in-compendium');
      if (plant.species.kingdom !== 'flora' || !larder(state).some(({ id }) => id === floraId)) return refuse('food:not-flora');
    },
    stage: (receipt) => {
      const { extensionWrites, ...facts } = serve(receipt, speciesId, (_creature, plants, served) => {
        if (served > 0) return null;
        return plants.find(({ id }) => id === floraId) ?? refuse(compendiumRow(ownershipOf(receipt.extensions), floraId) === null ? 'food:not-in-compendium' : 'food:not-flora');
      });
      return { facts: { ...facts, halt: null }, extensionWrites };
    },
    verify,
  });
}

/** Why "Mend — safest meals" does not stand, or cannot serve, in the legacy order; null when a press serves a meal. */
export type MendGateV1 = 'training' | 'healthy' | 'no-safe-flora';
/** The first thing in the way of a Mend for this beast, as the stored state and its carrier hold it. */
function mendGate(state: SaveStateV2, creature: CreatureInstanceV1): MendGateV1 | null {
  if (!state.tutDone) return 'training';
  if (!((creature.hurt ?? 0) > 0)) return 'healthy';
  return mendOrder(creature.genome, larder(state)).length === 0 ? 'no-safe-flora' : null;
}

/** Commits one press of "Mend — safest meals". */
export function commitMendV1(input: MendActionInputV1): Promise<FeedActionOutcomeV1> {
  const { speciesId } = input;
  const gate = (state: SaveStateV2, extensions: Parameters<typeof ownershipOf>[0]): void => {
    const blocked = mendGate(state, beastOf(ownershipOf(extensions), speciesId));
    if (blocked !== null) refuse(`mend:${blocked}`);
  };
  return commitCare<FeedFactsV1>({
    runtime: input.runtime, state: input.state, codecNow: input.codecNow, receiptKind: MEND_RECEIPT_KIND_V1,
    route: () => ({ operation: `care.mend:${speciesId}` }),
    preflight: gate,
    stage: (receipt) => {
      gate(receipt.draft, receipt.extensions);
      let halt: FeedFactsV1['halt'] = 'ten-served';
      const { extensionWrites, ...facts } = serve(receipt, speciesId, (creature, plants, served) => {
        // While it is hurt, and at most ten times, the safest flora held is served (19041-19048).
        if (served >= MEND_MEALS_MAX) return null;
        if (!((creature.hurt ?? 0) > 0)) { halt = 'mended'; return null; }
        const safest = mendOrder(creature.genome, plants)[0];
        if (safest === undefined) { halt = 'out-of-safe-flora'; return null; }
        return safest;
      });
      // Whole with the tenth meal is a beast mended.
      return { facts: { ...facts, halt: facts.meals.at(-1)!.hurtAfter === 0 ? 'mended' : halt }, extensionWrites };
    },
    verify,
  });
}

/** What a meal needs of the page: the save loop's door. */
export interface FeedSettleDeps { readonly door: CareDoor }
/** One meal as the page makes it. */
export function settleFeedV1(deps: FeedSettleDeps, input: Pick<FeedActionInputV1, 'speciesId' | 'floraId' | 'codecNow'>): Promise<FeedActionOutcomeV1> {
  return settleCare(deps.door, FEED_ACTION, (runtime, durable) => commitFeedV1({ ...input, runtime, state: durable }));
}
/** One press of "Mend — safest meals" as the page makes it. */
export function settleMendV1(deps: FeedSettleDeps, input: Pick<MendActionInputV1, 'speciesId' | 'codecNow'>): Promise<FeedActionOutcomeV1> {
  return settleCare(deps.door, MEND_ACTION, (runtime, durable) => commitMendV1({ ...input, runtime, state: durable }));
}
