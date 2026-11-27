/* The rules of a meal, pure: what a beast likes, what a flora tastes of, what a meal does to a companion, what one
   does to the explorer, and the order "Mend" serves its flora in.

   Two authorities meet here.

   LEGACY celestial-frontier.html, v1.8.9, for everything but the companion's meal:
   - a beast's tastes, seeded by its genome: two flavours it loves, one it dislikes (`faunaTastes` 18879-18884);
   - a flora's flavour: the stat it nourishes (`floraStat` 19240); the flavours' names (`STAT_META` 19231-19237);
   - a meal's taste for a beast: loved, disliked or neither (`feedPair` 18918-18920);
   - the explorer's meal, with its poison (`healExplorer` 19340-19369): the poison's chance is 0.08 + tier x 0.07,
     held to 0.05..0.6; the healing is round(12 + tier x 9 + chance x 30), raised by the worn meal gear; a toxic
     meal costs ceil(healing before gear x 0.6) and never the last point of health; a good one heals, raises the
     stat the flora nourishes by 1 + tier (+1 with the Xenobotany Lab) up to 330, unlocks `fieldmedic`, and
     `gambler` when the chance was over 0.4;
   - "Mend — safest meals" picks, of the flora a beast does not dislike, those it loves first and the lowest grade
     first (19042-19048).

   Dakk's decision D13 (2026-09-25) for the companion's meal, in place of the legacy roll (`feedPair` 18921-18975:
   poison, death, and one of four events per taste): no roll and no companion poison. Loved: +2 fed, +3 for a flora
   of tier 4 or more, and 0.25 hurt mended. Neutral: +1 and 0.10. Disliked: nothing, and harmless. The flora is
   eaten every time. Fed stops at 200 as it did (18945). The first meal pays 1 experience and each flavour newly
   tasted pays 2, each remembered as a bond memory of the companion's and each paid once a species, by the legacy
   ledger of firsts (`awardXPOnce` 18200-18208; Dakk, 2026-11-27; `feedMeal`). The numbers are
   `@cf/domain-acquisition`'s (`companion-care.ts`), the painted port's table for D13; the tier is the Compendium
   page's own (the legacy `grade.tier`, 18917), where the painted port graded the genome afresh. */
import {
  COMPANION_CARE_XP_V1, COMPANION_FEED_POLICY_V2, COMPANION_FIRST_MEAL_MEMORY_V1, COMPANION_XP_MAX_V1, companionTasteMemoryIdV1, faunaTastesV1,
} from '@cf/domain-acquisition/companion-care';
import { floraStat } from '@cf/domain-strays';

export const FLAVOURS = Object.freeze(['vit', 'fer', 'res', 'agi', 'ins'] as const);
export type Flavour = (typeof FLAVOURS)[number];
/** The flavours as the legacy card and its meals named them (`STAT_META` 19231-19237). */
export const FLAVOUR_NAMES: Readonly<Record<Flavour, string>> = Object.freeze({
  vit: 'Vitality', fer: 'Ferocity', res: 'Resilience', agi: 'Agility', ins: 'Insight',
});
export type Taste = 'loved' | 'neutral' | 'disliked';

/** The stat a flora nourishes (`floraStat` 19240). */
export const flavourOf = (plant: Readonly<{ seed?: unknown }>): Flavour => floraStat(plant as { seed?: number }) as Flavour;
/** What a flora of this flavour is to this beast (`feedPair` 18919-18920). */
export function tasteOf(beast: Readonly<{ seed?: unknown }>, flavour: Flavour): Taste {
  const tastes = faunaTastesV1(beast);
  return tastes.likes.includes(flavour) ? 'loved' : tastes.dislikes.includes(flavour) ? 'disliked' : 'neutral';
}

export const FED_MAX = 200;
const round6 = (value: number): number => Math.round(value * 1e6) / 1e6;

export interface FeedMeal {
  readonly taste: Taste;
  readonly flavour: Flavour;
  readonly tier: number;
  readonly fedAfter: number;
  /** What the meal added to fed, after the cap. */
  readonly fedGain: number;
  readonly hurtAfter: number;
  readonly mended: boolean;
  readonly xpAfter: number;
  readonly xpGain: number;
  /** The firsts this meal is: bond memories the companion did not hold. */
  readonly newMemories: ReadonlyArray<Readonly<{ id: string; kind: string }>>;
  /** Of those firsts, the ones that paid experience, by their names in the species' ledger, in the order paid. */
  readonly firstsPaid: readonly string[];
}
/** The legacy ledger's name for the first meal (18968) and for a flavour first tasted (18969). */
export const FIRST_MEAL = 'welcome';
export const firstTaste = (flavour: Flavour): string => `taste:${flavour}`;
/** The ledger's key for a first of the species with this Compendium id (`awardXPOnce` 18203). */
export const xpFirstKey = (speciesId: string, first: string): string => `${speciesId}|${first}`;
/** The experience a paid first is worth (D13: 1 for the first meal, 2 for a flavour). */
export const firstXp = (first: string): number => first === FIRST_MEAL ? COMPANION_CARE_XP_V1.firstMeal : COMPANION_CARE_XP_V1.newFlavour;

/** What one meal does to a companion (D13). `memories` are the ids of the bond memories it holds; `paidFirsts`
    are the firsts its species' ledger already holds, by name.
    Two records meet at a first. The bond memory is the companion's own (D13): a beast with no memory of a first
    meal, or of a flavour, makes one, whatever came before it. The experience is the species' (Dakk, 2026-11-27,
    by the legacy ledger): it is paid when the memory is new AND the ledger does not hold that first for the
    species. So a beast lost and tamed again remembers its firsts anew and is paid for none its species was
    already paid for. */
export function feedMeal(input: Readonly<{
  taste: Taste; tier: number; flavour: Flavour; fed: number; hurt: number; xp: number; memories: readonly string[]; paidFirsts: readonly string[];
}>): FeedMeal {
  const row = COMPANION_FEED_POLICY_V2[input.taste];
  const fedAfter = Math.min(FED_MAX, Math.max(0, input.fed + (input.tier >= row.rareTier ? row.fedRare : row.fed)));
  const hurtAfter = round6(Math.max(0, input.hurt - row.mend));
  const held = new Set(input.memories);
  const paid = new Set(input.paidFirsts);
  const newMemories: Array<Readonly<{ id: string; kind: string }>> = [];
  const firstsPaid: string[] = [];
  const first = (memory: string, kind: string, name: string): void => {
    if (held.has(memory)) return;
    newMemories.push(Object.freeze({ id: memory, kind }));
    if (!paid.has(name)) firstsPaid.push(name);
  };
  first(COMPANION_FIRST_MEAL_MEMORY_V1, 'meal', FIRST_MEAL);
  first(companionTasteMemoryIdV1(input.flavour), 'taste', firstTaste(input.flavour));
  const xpGain = firstsPaid.reduce((sum, name) => sum + firstXp(name), 0);
  return Object.freeze({
    taste: input.taste, flavour: input.flavour, tier: input.tier, fedAfter, fedGain: fedAfter - input.fed, hurtAfter, mended: hurtAfter < input.hurt,
    xpAfter: Math.min(COMPANION_XP_MAX_V1, input.xp + xpGain), xpGain, newMemories: Object.freeze(newMemories), firstsPaid: Object.freeze(firstsPaid),
  });
}

/** The flora "Mend — safest meals" would serve this beast, safest first (19042-19048): never one it dislikes,
    those it loves first, the lowest grade first, and as held otherwise. */
export function mendOrder<P extends Readonly<{ genome: Readonly<{ seed?: unknown }>; tier: number }>>(beast: Readonly<{ seed?: unknown }>, plants: readonly P[]): P[] {
  const rank = (plant: P): number => tasteOf(beast, flavourOf(plant.genome)) === 'loved' ? 0 : 1;
  return plants.filter((plant) => tasteOf(beast, flavourOf(plant.genome)) !== 'disliked')
    .sort((a, b) => rank(a) - rank(b) || a.tier - b.tier);
}
/** How many meals one press of Mend serves at most (19041). */
export const MEND_MEALS_MAX = 10;

const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
export const EXPLORER_STAT_MAX = 330;
export const XENOBOTANY_LAB = 'lab1';
export type MealUnlock = 'fieldmedic' | 'gambler';
export interface ExplorerMeal {
  /** The meal nourished; false when it was toxic. */
  readonly ok: boolean;
  /** The poison's chance. */
  readonly pois: number;
  /** The healing a good meal gives, with the worn gear. */
  readonly heal: number;
  /** The health a toxic meal cost; 0 for a good one. */
  readonly dmg: number;
  readonly stat: Flavour;
  /** What a good meal adds to the stat before its ceiling; 0 for a toxic one. */
  readonly gain: number;
  readonly hpAfter: number;
  readonly hpMaxAfter: number;
  readonly pstatsAfter: Readonly<Record<string, number>>;
  /** A toxic meal left the explorer at the last point of health. */
  readonly brink: boolean;
  readonly unlocks: readonly MealUnlock[];
}
/** What one meal does to the explorer (`healExplorer` 19340-19369). `roll` is the receipt's value, or the 0.95 the
    legacy game put in its place in training. */
export function explorerMeal(input: Readonly<{
  tier: number; flavour: Flavour; roll: number; hp: number; hpMax: number; pstats: Readonly<Record<string, number>>; healBonus: number; lab: boolean;
}>): ExplorerMeal {
  const { tier, flavour: stat } = input;
  const pois = clamp(0.08 + tier * 0.07, 0.05, 0.6);
  const healBase = Math.round(12 + tier * 9 + pois * 30);
  const heal = Math.round(healBase * (1 + input.healBonus));
  if (input.roll < pois) {
    // A toxic meal can gut the explorer to the brink; eating medicine never kills (19350-19359).
    const dmg = Math.min(Math.ceil(healBase * 0.6), Math.max(0, input.hp - 1));
    const hpAfter = input.hp - dmg;
    return Object.freeze({
      ok: false, pois, heal, dmg, stat, gain: 0, hpAfter, hpMaxAfter: input.hpMax, pstatsAfter: input.pstats, brink: hpAfter <= 1, unlocks: Object.freeze([]),
    });
  }
  const gain = 1 + tier + (input.lab ? 1 : 0);
  const pstatsAfter = Object.freeze({ ...input.pstats, [stat]: Math.min(EXPLORER_STAT_MAX, (input.pstats[stat] ?? 0) + gain) });
  let hpAfter = Math.min(input.hpMax, input.hp + heal);
  let hpMaxAfter = input.hpMax;
  if (stat === 'vit') {
    // More Vitality is more health, and the health gained comes with it (`recomputeHPMax` 19243).
    hpMaxAfter = Math.max(20, Math.round(pstatsAfter.vit! * 2));
    hpAfter = hpAfter > hpMaxAfter ? hpMaxAfter : hpMaxAfter > input.hpMax ? Math.min(hpMaxAfter, hpAfter + (hpMaxAfter - input.hpMax)) : hpAfter;
  }
  return Object.freeze({
    ok: true, pois, heal, dmg: 0, stat, gain, hpAfter, hpMaxAfter, pstatsAfter, brink: false,
    unlocks: Object.freeze<MealUnlock[]>(pois > 0.4 ? ['fieldmedic', 'gambler'] : ['fieldmedic']),
  });
}
