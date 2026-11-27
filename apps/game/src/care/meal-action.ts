/* The explorer's meal, committed: one press of a flora in the heal picker, in one receipt of one draw, or nothing
   at all.

   LEGACY celestial-frontier.html, v1.8.9:
   - the heart by the health bar opens the picker on the flora the Compendium holds (26201, 19025-19027); a meal
     may be eaten at full health, for the stat it feeds;
   - the flora is always eaten: it leaves the Compendium (`healExplorer` 19341) and can be scavenged again;
   - the roll is one random value; in training, whatever the lesson, the legacy game put 0.95 in its place and read
     none, so a meal of training is never toxic (19146);
   - what the meal does, its poison and what it unlocks are `explorerMeal` (`meals.ts`; `healExplorer`
     19340-19369); the gear's share is the worn pieces' (`_equipBonus('heal')` 19348) and the Xenobotany Lab adds a
     point of growth (19350);
   - afterwards the achievements are looked at (19158).
   This meal keeps the legacy poison: D13 changed the companion's meal only ("Explorer meals keep their own
   poison").

   NOT SAID HERE: the `healed` deed (19147), whose listener is a lesson of training (25441), not built; the facts
   say `ok`. The painted port (`explorer-meal-action.ts`) graded the flora's genome afresh; the tier here is the
   Compendium page's own, as the legacy game read it (19342). */
import { withoutSpeciesV1 } from '@cf/domain-acquisition';
import { DOMAINS } from '@cf/domain-sessionrng';
import { readArc2EngineeringLoadout, type SaveStateV2, type V5Extensions } from '@cf/persistence';
import {
  commitCare, refreshProgression, refuse, settleCare, unlockAchievement, type CareAuthority, type CareDoor, type CareOutcome, type CareReceipt, type CareStaged,
} from './commit';
import { XENOBOTANY_LAB, explorerMeal, flavourOf, type ExplorerMeal } from './meals';
import { compendiumRow, contentsOf, ownershipOf, stageOwnership } from './ownership';

export const MEAL_ACTION = 'meal' as const;
export const MEAL_RECEIPT_KIND_V1 = 'care-explorer-meal-v1' as const;
export const MEAL_DOMAINS_V1 = Object.freeze([DOMAINS.healOutcome] as const);
/** The value that stands in the roll's place in training (19146). */
export const TRAINING_MEAL_ROLL = 0.95;

export interface ExplorerMealFactsV1 extends ExplorerMeal {
  readonly floraId: string;
  /** The flora's name on its page. */
  readonly name: string;
  readonly tier: number;
  /** Whether a random value was read: none in training. */
  readonly rolled: boolean;
  readonly hpBefore: number;
  readonly achievementIds: readonly string[];
}
export type MealActionOutcomeV1 = CareOutcome<ExplorerMealFactsV1>;
export interface MealActionInputV1 {
  readonly runtime: CareAuthority;
  /** The last stored state. */
  readonly state: SaveStateV2;
  /** The Compendium id of the flora picked. */
  readonly floraId: string;
  readonly codecNow: number;
}

/** The flora picked, as the Compendium and its carrier hold it; raises a `CareRefusal` when it is no flora held. */
function plantOf(state: SaveStateV2, extensions: V5Extensions, floraId: string) {
  const ownership = ownershipOf(extensions);
  const row = compendiumRow(ownership, floraId);
  const page = state.codex.find(([id]) => id === floraId)?.[1];
  if (row === null || page === undefined) return refuse('food:not-in-compendium');
  if (row.species.kingdom !== 'flora' || page.kind !== 'Flora') return refuse('food:not-flora');
  return { ownership, species: row.species, page };
}

function stage(input: MealActionInputV1, receipt: CareReceipt): CareStaged<ExplorerMealFactsV1> {
  const { draft, extensions } = receipt;
  const { ownership, species, page } = plantOf(draft, extensions, input.floraId);
  const loadout = readArc2EngineeringLoadout(extensions);
  if (loadout.kind !== 'loaded') return refuse(`gear:${loadout.kind}`);
  const rolled = draft.tutDone;
  const roll = rolled ? receipt.draws[0] : TRAINING_MEAL_ROLL;
  if (roll === undefined) return refuse('draws:not-the-receipts');
  const tier = page.tier ?? 0;
  const hpBefore = draft.hp;
  const meal = explorerMeal({
    tier, flavour: flavourOf(page.g), roll, hp: draft.hp, hpMax: draft.HP_MAX, pstats: draft.pstats,
    healBonus: loadout.capabilities.explorerMealHealBonus, lab: draft.techOwned.includes(XENOBOTANY_LAB),
  });
  const unlockedBefore = new Set(draft.unlocked);
  // The plant is always eaten (19341).
  const extensionWrites = stageOwnership({ draft, extensions, parent: ownership, touched: [], contents: withoutSpeciesV1(contentsOf(ownership), species.speciesId) });
  // The health's ceiling is not written: the save makes it of Vitality (`hpMaxFromVit` 19239), and it is checked
  // against the meal's own answer once stored.
  draft.hp = meal.hpAfter;
  draft.pstats = { ...meal.pstatsAfter };
  for (const id of meal.unlocks) unlockAchievement(draft, id);
  refreshProgression(draft);
  return {
    facts: Object.freeze({
      ...meal, floraId: input.floraId, name: page.name, tier, rolled, hpBefore, achievementIds: Object.freeze(draft.unlocked.filter((id) => !unlockedBefore.has(id))),
    }),
    extensionWrites,
  };
}

/** Commits one meal. Everything is decided on the receipt's own draft; the caller's state is not touched. */
export function commitMealV1(input: MealActionInputV1): Promise<MealActionOutcomeV1> {
  let training = false;
  return commitCare<ExplorerMealFactsV1>({
    runtime: input.runtime, state: input.state, codecNow: input.codecNow, receiptKind: MEAL_RECEIPT_KIND_V1,
    // A meal of training reads no random value (19146): its receipt is an ordinal alone.
    route: () => training ? { operation: `care.meal:${input.floraId}` } : { domains: MEAL_DOMAINS_V1 },
    preflight: (state, extensions) => { plantOf(state, extensions, input.floraId); training = !state.tutDone; },
    stage: (receipt) => stage(input, receipt),
    verify: (stored, facts) => stored.codex.some(([id]) => id === facts.floraId) ? 'flora'
      : stored.hp !== facts.hpAfter || stored.HP_MAX !== facts.hpMaxAfter ? 'health'
        : stored.pstats[facts.stat] !== facts.pstatsAfter[facts.stat] ? 'stat'
          : facts.achievementIds.some((id) => !stored.unlocked.includes(id)) ? 'achievements' : null,
  });
}

/** One meal as the page makes it. */
export function settleMealV1(deps: Readonly<{ door: CareDoor }>, input: Pick<MealActionInputV1, 'floraId' | 'codecNow'>): Promise<MealActionOutcomeV1> {
  return settleCare(deps.door, MEAL_ACTION, (runtime, durable) => commitMealV1({ ...input, runtime, state: durable }));
}
