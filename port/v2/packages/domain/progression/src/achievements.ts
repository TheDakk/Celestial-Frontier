/* Arc 9A achievement content and pure projection authority.

   This is the complete v1.8.9 catalogue, moved out of the legacy UI section
   without changing ids, order, categories, icons, names, descriptions, or
   completion semantics. Sixty-eight rows are safe aggregate projections.
   Twenty-eight rows were `t:null` in v1.8.9 and are unlocked by the exact
   action that witnessed them. Those rows stay explicitly event-owned: this
   domain never guesses a one-time event from a cumulative counter.

   The app/save writer is intentionally not connected in this batch. A future
   action owner may persist one of the event-owned ids, while the projection
   below can render that durable fact. */

export const ACHIEVEMENT_SCORE_CREDIT = 6;
export const ACHIEVEMENT_CATALOGUE_SIZE = 96;
export const AUTO_ACHIEVEMENT_COUNT = 68;
export const EVENT_OWNED_ACHIEVEMENT_COUNT = 28;
/** v1.8.9/import-v2 preserves at most ACH.length + 50 unique compatibility ids. */
export const MAX_UNLOCKED_ACHIEVEMENT_IDS = ACHIEVEMENT_CATALOGUE_SIZE + 50;

export const ACHIEVEMENT_CATEGORIES = Object.freeze([
  'Cataloguing', 'Breeding', 'Rarity', 'Worlds', 'Stellar', 'Exploration',
  'Engineering', 'Cosmic Events', 'Conquest', 'Survival', 'Husbandry',
  'Duels', 'Legacy',
] as const);
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export interface AchievementSnapshot {
  readonly cataloguedSpeciesCount: number;
  readonly ownedKingdomCount: number;
  readonly ownedRealmCount: number;
  readonly hybridCount: number;
  readonly maxGeneration: number;
  readonly bestRawRarityTier: number;
  readonly ownedDisplayRarityTierCount: number;
  readonly surveyedLivingWorldCount: number;
  readonly surveyedWorldTypeCount: number;
  readonly surfaceWorldCount: number;
  readonly surveyedStarClassCount: number;
  readonly galaxyCount: number;
  readonly craftCount: number;
  readonly equippedGearCount: number;
  readonly ascentChapterIndex: number;
  readonly minedOutWorldCount: number;
  readonly miningLoadCount: number;
  readonly cosmicMaterialCount: number;
  readonly coronaSkimCount: number;
  readonly beaconCount: number;
  readonly cosmicEventCount: number;
  readonly settledWorldCount: number;
  readonly guardianCount: number;
  readonly stardustHarvestCount: number;
  readonly lifetimeStardust: number;
  readonly breedAttemptCount: number;
  readonly breedWinCount: number;
  readonly feedCount: number;
  readonly poisonousMealLossCount: number;
  readonly duelCount: number;
  readonly duelWinCount: number;
  readonly namedDiscoveryCount: number;
  readonly sharedCodeCount: number;
  readonly followedShareCodeCount: number;
  readonly hasJumpDrive: boolean;
  readonly hasLongRangeArray: boolean;
  readonly hasIntergalacticDrive: boolean;
  readonly hasCosmicGear: boolean;
}

export type AchievementNumericField = {
  [K in keyof AchievementSnapshot]: AchievementSnapshot[K] extends number ? K : never
}[keyof AchievementSnapshot];
export type AchievementFlagField = {
  [K in keyof AchievementSnapshot]: AchievementSnapshot[K] extends boolean ? K : never
}[keyof AchievementSnapshot];

export type ProjectedAchievementRule =
  | Readonly<{ kind: 'at-least'; field: AchievementNumericField; minimum: number }>
  | Readonly<{ kind: 'greater-than'; left: AchievementNumericField; right: AchievementNumericField }>
  | Readonly<{ kind: 'flag'; field: AchievementFlagField }>
  | Readonly<{ kind: 'all'; rules: readonly ProjectedAchievementRule[] }>;

export type EventAchievementOwner =
  | 'landing:earth'
  | 'survey:world-civilized'
  | 'survey:world-spacefaring'
  | 'survey:star-sol'
  | 'survey:star-binary'
  | 'survey:star-black-hole'
  | 'survey:star-neutron-star'
  | 'survey:star-magnetar'
  | 'survey:star-white-dwarf'
  | 'survey:star-red-giant'
  | 'survey:star-red-supergiant'
  | 'survey:star-protostar'
  | 'survey:star-brown-dwarf'
  | 'travel:wormhole'
  | 'travel:quasar-galaxy'
  | 'travel:dwarf-galaxy'
  | 'atlas:first-favorite'
  | 'beacon:follow'
  | 'event:once-a-decade'
  | 'conquest:first-settlement'
  | 'survival:hostile-field-strike'
  | 'survival:below-twenty-hp'
  | 'care:flora-heal'
  | 'care:high-risk-flora-heal'
  | 'breed:legendary-pair'
  | 'naming:first-discovery-name'
  | 'sharing:first-code-sent'
  | 'sharing:first-code-followed';

export type AchievementEvaluation =
  | Readonly<{ kind: 'projection'; rule: ProjectedAchievementRule }>
  | Readonly<{ kind: 'event-owner'; owner: EventAchievementOwner }>;

export interface AchievementDefinition {
  readonly id: string;
  readonly category: AchievementCategory;
  readonly icon: string;
  readonly name: string;
  readonly description: string;
  readonly evaluation: AchievementEvaluation;
}

const atLeast = (field: AchievementNumericField, minimum: number): ProjectedAchievementRule =>
  Object.freeze({ kind: 'at-least', field, minimum });
const greaterThan = (left: AchievementNumericField, right: AchievementNumericField): ProjectedAchievementRule =>
  Object.freeze({ kind: 'greater-than', left, right });
const flag = (field: AchievementFlagField): ProjectedAchievementRule => Object.freeze({ kind: 'flag', field });
const all = (...rules: readonly ProjectedAchievementRule[]): ProjectedAchievementRule =>
  Object.freeze({ kind: 'all', rules: Object.freeze([...rules]) });
const projected = (rule: ProjectedAchievementRule): AchievementEvaluation =>
  Object.freeze({ kind: 'projection', rule });
const eventOwned = (owner: EventAchievementOwner): AchievementEvaluation =>
  Object.freeze({ kind: 'event-owner', owner });
const achievement = (
  id: string,
  category: AchievementCategory,
  icon: string,
  name: string,
  description: string,
  evaluation: AchievementEvaluation,
): AchievementDefinition => Object.freeze({ id, category, icon, name, description, evaluation });

export const ACHIEVEMENTS: readonly AchievementDefinition[] = Object.freeze([
  achievement('first', 'Cataloguing', '🧬', 'First Specimen', 'Catalogue your first species', projected(atLeast('cataloguedSpeciesCount', 1))),
  achievement('field10', 'Cataloguing', '📓', 'Field Biologist', 'Catalogue 10 species', projected(atLeast('cataloguedSpeciesCount', 10))),
  achievement('field50', 'Cataloguing', '🏛', 'Menagerie', 'Catalogue 50 species', projected(atLeast('cataloguedSpeciesCount', 50))),
  achievement('codex150', 'Cataloguing', '📚', 'Grand Archive', 'Catalogue 150 species', projected(atLeast('cataloguedSpeciesCount', 150))),
  achievement('codex300', 'Cataloguing', '🌠', 'Cosmic Library', 'Catalogue 300 species', projected(atLeast('cataloguedSpeciesCount', 300))),
  achievement('kingdoms', 'Cataloguing', '🌿', 'Four Kingdoms', 'Catalogue flora, fauna, fungi and microbes', projected(atLeast('ownedKingdomCount', 4))),
  achievement('realms8', 'Cataloguing', '🗺', 'Realm Ranger', 'Own species from 8 of the 16 realms', projected(atLeast('ownedRealmCount', 8))),
  achievement('realms16', 'Cataloguing', '🏆', 'Master of Realms', 'Own species from all 16 realms', projected(atLeast('ownedRealmCount', 16))),

  achievement('hybrid', 'Breeding', '🧪', 'Hybrid Vigor', 'Your Compendium breeds its first hybrid', projected(atLeast('hybridCount', 1))),
  achievement('gene10', 'Breeding', '⚗️', 'Gene Smith', '10 hybrids bred', projected(atLeast('hybridCount', 10))),
  achievement('gene50', 'Breeding', '🔬', 'Geneticist', '50 hybrids bred', projected(atLeast('hybridCount', 50))),
  achievement('gen5', 'Breeding', '🧫', 'Dynasty', 'Reach a generation-5 hybrid line', projected(atLeast('maxGeneration', 5))),
  achievement('gen10', 'Breeding', '👑', 'Bloodline Eternal', 'Reach a generation-10 hybrid line', projected(atLeast('maxGeneration', 10))),

  achievement('rare', 'Rarity', '🔷', 'Deep Find', 'Discover something Rare or better', projected(atLeast('bestRawRarityTier', 3))),
  achievement('legend', 'Rarity', '🌟', 'Gold Rush', 'Discover a Legendary', projected(atLeast('bestRawRarityTier', 5))),
  achievement('unique', 'Rarity', '✦', 'Star-Touched', 'Discover a Celestial', projected(atLeast('bestRawRarityTier', 7))),
  achievement('mythic', 'Rarity', '🧿', 'Beyond the Veil', 'Discover a Primordial', projected(atLeast('bestRawRarityTier', 8))),
  achievement('transc', 'Rarity', '💫', 'One in a Million', 'Discover a Transcendent', projected(atLeast('bestRawRarityTier', 9))),
  achievement('summit', 'Rarity', '🗻', 'Beyond the Million', 'Own an Apex Guardian&#8217;s bloodline — a forced Transcendent summit', projected(atLeast('bestRawRarityTier', 12))),
  achievement('tiers8', 'Rarity', '🎨', 'Full Spectrum', 'Own species of 8 different rarity tiers', projected(atLeast('ownedDisplayRarityTierCount', 8))),
  achievement('tiers12', 'Rarity', '🌈', 'The Deep Spectrum', 'Own species of all 10 rarity tiers, Common through Transcendent', projected(atLeast('ownedDisplayRarityTierCount', 10))),

  achievement('survey5', 'Worlds', '🛰', 'Eyes Down', 'Survey 5 living worlds', projected(atLeast('surveyedLivingWorldCount', 5))),
  achievement('survey25', 'Worlds', '🌍', 'World Walker', 'Survey 25 living worlds', projected(atLeast('surveyedLivingWorldCount', 25))),
  achievement('survey100', 'Worlds', '🛸', 'Centurion', 'Survey 100 living worlds', projected(atLeast('surveyedLivingWorldCount', 100))),
  achievement('survey250', 'Worlds', '🛰', 'Survey Fleet', 'Survey 250 living worlds', projected(atLeast('surveyedLivingWorldCount', 250))),
  achievement('worldset', 'Worlds', '🪐', 'Planetary Census', 'Survey all 8 world types', projected(atLeast('surveyedWorldTypeCount', 8))),
  achievement('surface5', 'Worlds', '👣', 'Groundfall', 'Stand on the surface of 5 worlds', projected(atLeast('surfaceWorldCount', 5))),
  achievement('surface25', 'Worlds', '🥾', 'Trailblazer', 'Stand on the surface of 25 worlds', projected(atLeast('surfaceWorldCount', 25))),
  achievement('home', 'Worlds', '🏠', 'Homecoming', 'Stand on Earth', eventOwned('landing:earth')),
  achievement('civ', 'Worlds', '🏘', 'We Are Not Alone', 'Scan a civilized world', eventOwned('survey:world-civilized')),
  achievement('spacefar', 'Worlds', '🚀', 'Peer Review', 'Scan a spacefaring civilization', eventOwned('survey:world-spacefaring')),

  achievement('sol', 'Stellar', '☀️', 'Old Neighborhood', 'Survey the Sun', eventOwned('survey:star-sol')),
  achievement('binary', 'Stellar', '☀☀', 'Twin Suns', 'Survey a binary star system', eventOwned('survey:star-binary')),
  achievement('seebh', 'Stellar', '🕳', 'Event Horizon', 'Survey a stellar black hole', eventOwned('survey:star-black-hole')),
  achievement('seens', 'Stellar', '🗼', 'Lighthouse', 'Survey a neutron star', eventOwned('survey:star-neutron-star')),
  achievement('seemag', 'Stellar', '🧲', 'Starquake', 'Survey a magnetar', eventOwned('survey:star-magnetar')),
  achievement('seewd', 'Stellar', '🕯', 'Stellar Ember', 'Survey a white dwarf', eventOwned('survey:star-white-dwarf')),
  achievement('seerg', 'Stellar', '🔴', 'Swollen Sun', 'Survey a red giant', eventOwned('survey:star-red-giant')),
  achievement('seesg', 'Stellar', '🐘', 'Titan', 'Survey a red supergiant', eventOwned('survey:star-red-supergiant')),
  achievement('seeproto', 'Stellar', '🥚', 'Genesis', 'Survey a protostar', eventOwned('survey:star-protostar')),
  achievement('seebd', 'Stellar', '🟤', 'Almost a Star', 'Survey a brown dwarf', eventOwned('survey:star-brown-dwarf')),
  achievement('stellarset', 'Stellar', '🌃', 'Stellar Census', 'Survey 8 different star classes', projected(atLeast('surveyedStarClassCount', 8))),

  achievement('gal5', 'Exploration', '🌌', 'Island Hopper', 'Fly inside 5 different galaxies', projected(atLeast('galaxyCount', 5))),
  achievement('gal25', 'Exploration', '🗺', 'Intergalactic', 'Fly inside 25 different galaxies', projected(atLeast('galaxyCount', 25))),
  achievement('gal100', 'Exploration', '♾', 'Pan-Galactic', 'Fly inside 100 different galaxies', projected(atLeast('galaxyCount', 100))),
  achievement('worm', 'Exploration', '🌀', 'Threadneedle', 'Fly through a wormhole', eventOwned('travel:wormhole')),
  achievement('quasar', 'Exploration', '🔆', 'Blinding Light', 'Visit a quasar galaxy', eventOwned('travel:quasar-galaxy')),
  achievement('dwarfg', 'Exploration', '🌫', 'Small Wonders', 'Visit a dwarf galaxy', eventOwned('travel:dwarf-galaxy')),
  achievement('curator', 'Exploration', '★', 'Curator', 'Favorite a place in your Star Atlas', eventOwned('atlas:first-favorite')),

  achievement('crafter', 'Engineering', '🛠', 'Fabricator', 'Craft your first part', projected(atLeast('craftCount', 1))),
  achievement('crafts25', 'Engineering', '⚙', 'Assembly Line', 'Craft 25 things', projected(atLeast('craftCount', 25))),
  achievement('geared', 'Engineering', '🎽', 'Outfitted', 'Equip a piece of explorer gear', projected(atLeast('equippedGearCount', 1))),
  achievement('shipwright', 'Engineering', '⚡', 'Shipwright', 'Build the Jump Drive', projected(flag('hasJumpDrive'))),
  achievement('arraybuilt', 'Engineering', '📡', 'The Long Ear', 'Build the Long-Range Array', projected(flag('hasLongRangeArray'))),
  achievement('rimbreaker', 'Engineering', '🌌', 'Rim-Breaker', 'Build the Intergalactic Drive', projected(flag('hasIntergalacticDrive'))),
  achievement('ascended', 'Engineering', '⬆', 'The Last Chapter', 'Complete all three Chapters', projected(all(atLeast('ascentChapterIndex', 3), flag('hasIntergalacticDrive')))),
  achievement('lastvein', 'Engineering', '⛏', 'To the Last Vein', 'Mine a world completely dry', projected(atLeast('minedOutWorldCount', 1))),
  achievement('richstrike', 'Engineering', '💎', 'Prospector&#8217;s Luck', 'Mine 250 loads of ore', projected(atLeast('miningLoadCount', 250))),
  achievement('cosmicfind', 'Engineering', '✦', 'Touched the Cosmos', 'Recover a cosmic material from the deepest worlds or a star', projected(atLeast('cosmicMaterialCount', 1))),
  achievement('skimmer', 'Engineering', '☀', 'Sun-Skimmer', 'Skim a star&#8217;s corona for its stellar cosmic', projected(atLeast('coronaSkimCount', 1))),
  achievement('cosmicgear', 'Engineering', '🌟', 'Forged from Starstuff', 'Forge a piece of cosmic gear', projected(flag('hasCosmicGear'))),

  achievement('daily', 'Cosmic Events', '🗓', 'Pilgrim', 'Follow the Traveler’s Beacon', eventOwned('beacon:follow')),
  achievement('anomaly5', 'Cosmic Events', '🕯', 'Devout', 'Follow 5 different Beacons', projected(atLeast('beaconCount', 5))),
  achievement('anomaly25', 'Cosmic Events', '⛩', 'Lighthouse Keeper', 'Follow 25 different Beacons', projected(atLeast('beaconCount', 25))),
  achievement('event1', 'Cosmic Events', '👁', 'Witness', 'Travel to a cosmic event', projected(atLeast('cosmicEventCount', 1))),
  achievement('event5', 'Cosmic Events', '🌩', 'Storm Chaser', 'Travel to 5 cosmic events', projected(atLeast('cosmicEventCount', 5))),
  achievement('event25', 'Cosmic Events', '📜', 'Chronicler', 'Travel to 25 cosmic events', projected(atLeast('cosmicEventCount', 25))),
  achievement('decade', 'Cosmic Events', '💫', 'Once in a Lifetime', 'Witness the once-a-decade event', eventOwned('event:once-a-decade')),

  achievement('settle1', 'Conquest', '🏴', 'Flagplanter', 'Conquer and settle a world', eventOwned('conquest:first-settlement')),
  achievement('settle5', 'Conquest', '🏰', 'Dominion', 'Settle 5 worlds', projected(atLeast('settledWorldCount', 5))),
  achievement('settle25', 'Conquest', '🏯', 'Empire', 'Settle 25 worlds', projected(atLeast('settledWorldCount', 25))),
  achievement('guard1', 'Conquest', '👑', 'Regicide', 'Defeat a named Apex Guardian', projected(atLeast('guardianCount', 1))),
  achievement('guard5', 'Conquest', '⚜️', 'Throne Breaker', 'Defeat 5 Apex Guardians', projected(atLeast('guardianCount', 5))),
  achievement('harvest10', 'Conquest', '⛏', 'Quartermaster', 'Harvest Stardust 10 times', projected(atLeast('stardustHarvestCount', 10))),
  achievement('essence500', 'Conquest', '☄', 'Stockpiler', 'Earn 500 Stardust lifetime', projected(atLeast('lifetimeStardust', 500))),

  achievement('survivor', 'Survival', '🩸', 'Bitten, Not Beaten', 'Survive a hostile strike in the field — a bioscan gone wrong, or a wary first contact', eventOwned('survival:hostile-field-strike')),
  achievement('brink', 'Survival', '💔', 'On the Brink', 'Drop below 20 HP and live to tell it', eventOwned('survival:below-twenty-hp')),
  achievement('fieldmedic', 'Survival', '💚', 'Field Medic', 'Heal yourself with flora', eventOwned('care:flora-heal')),
  achievement('gambler', 'Survival', '🎰', 'Cruel Bargain', 'Heal with flora above 40% poison risk and survive', eventOwned('care:high-risk-flora-heal')),

  achievement('bred1', 'Husbandry', '💞', 'Matchmaker', 'Successfully breed a pair', projected(atLeast('breedWinCount', 1))),
  achievement('bred10', 'Husbandry', '🐣', 'Brood Master', '10 successful breedings', projected(atLeast('breedWinCount', 10))),
  achievement('bredfail', 'Husbandry', '🎲', 'High Roller', 'Lose a pair to a failed breeding', projected(greaterThan('breedAttemptCount', 'breedWinCount'))),
  achievement('bredlegend', 'Husbandry', '☣', 'Forbidden Science', 'Breed two Legendary-or-better creatures', eventOwned('breed:legendary-pair')),
  achievement('feed5', 'Husbandry', '🍽', 'Zookeeper', 'Feed flora to fauna 5 times', projected(atLeast('feedCount', 5))),
  achievement('feedfail', 'Husbandry', '☠', 'Bitter Harvest', 'Lose a beast to a poisonous meal', projected(atLeast('poisonousMealLossCount', 1))),

  achievement('duel1', 'Duels', '🤺', 'Sparring Partner', 'Fight a creature duel', projected(atLeast('duelCount', 1))),
  achievement('duelw1', 'Duels', '🏅', 'Victor', 'Win a creature duel', projected(atLeast('duelWinCount', 1))),
  achievement('duelw5', 'Duels', '🏆', 'Champion', 'Win 5 creature duels', projected(atLeast('duelWinCount', 5))),
  achievement('duelw25', 'Duels', '🐉', 'Apex', 'Win 25 creature duels', projected(atLeast('duelWinCount', 25))),

  achievement('namer', 'Legacy', '✎', 'Cartographer', 'Name a discovery', eventOwned('naming:first-discovery-name')),
  achievement('names5', 'Legacy', '🖋', 'Toponymist', 'Name 5 discoveries', projected(atLeast('namedDiscoveryCount', 5))),
  achievement('names15', 'Legacy', '🗃', 'Atlas Author', 'Name 15 discoveries', projected(atLeast('namedDiscoveryCount', 15))),
  achievement('share', 'Legacy', '📡', 'Signal Sent', 'Share a discovery code', eventOwned('sharing:first-code-sent')),
  achievement('share5', 'Legacy', '📻', 'Broadcaster', 'Share 5 discovery codes', projected(atLeast('sharedCodeCount', 5))),
  achievement('wayfarer', 'Legacy', '🧭', 'Wayfarer', 'Travel by a share code', eventOwned('sharing:first-code-followed')),
  achievement('jumps5', 'Legacy', '🕸', 'Networked', 'Follow 5 share codes', projected(atLeast('followedShareCodeCount', 5))),
]);

const SNAPSHOT_NUMERIC_BOUNDS = Object.freeze({
  cataloguedSpeciesCount: 1_500,
  ownedKingdomCount: 4,
  ownedRealmCount: 16,
  hybridCount: 1_000_000_000,
  maxGeneration: 1_000_000_000,
  bestRawRarityTier: 14,
  ownedDisplayRarityTierCount: 10,
  surveyedLivingWorldCount: 60_000,
  surveyedWorldTypeCount: 8,
  surfaceWorldCount: 60_000,
  surveyedStarClassCount: 8,
  galaxyCount: 20_000,
  craftCount: 1_000_000_000,
  equippedGearCount: 9,
  ascentChapterIndex: 3,
  minedOutWorldCount: 1_000_000_000,
  miningLoadCount: 1_000_000_000,
  cosmicMaterialCount: 1_000_000_000,
  coronaSkimCount: 1_000_000_000,
  beaconCount: 1_000_000_000,
  cosmicEventCount: 1_000_000_000,
  settledWorldCount: 20_000,
  guardianCount: 1_000_000_000,
  stardustHarvestCount: 1_000_000_000,
  lifetimeStardust: 1_000_000_000,
  breedAttemptCount: 1_000_000_000,
  breedWinCount: 1_000_000_000,
  feedCount: 1_000_000_000,
  poisonousMealLossCount: 1_000_000_000,
  duelCount: 1_000_000_000,
  duelWinCount: 1_000_000_000,
  namedDiscoveryCount: 5_000,
  sharedCodeCount: 1_000_000_000,
  followedShareCodeCount: 1_000_000_000,
} satisfies Readonly<Record<AchievementNumericField, number>>);

const SNAPSHOT_FLAG_FIELDS = Object.freeze([
  'hasJumpDrive', 'hasLongRangeArray', 'hasIntergalacticDrive', 'hasCosmicGear',
] as const satisfies readonly AchievementFlagField[]);

function assertAchievementSnapshot(snapshot: AchievementSnapshot): void {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    throw new TypeError('achievement snapshot must be an object');
  }
  for (const [field, maximum] of Object.entries(SNAPSHOT_NUMERIC_BOUNDS) as Array<[AchievementNumericField, number]>) {
    const value = snapshot[field];
    if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
      throw new RangeError(`${field} must be a bounded non-negative integer`);
    }
  }
  for (const field of SNAPSHOT_FLAG_FIELDS) {
    if (typeof snapshot[field] !== 'boolean') throw new TypeError(`${field} must be boolean`);
  }
}

function evaluateRule(rule: ProjectedAchievementRule, snapshot: AchievementSnapshot): boolean {
  switch (rule.kind) {
    case 'at-least': return snapshot[rule.field] >= rule.minimum;
    case 'greater-than': return snapshot[rule.left] > snapshot[rule.right];
    case 'flag': return snapshot[rule.field];
    case 'all': return rule.rules.every((part) => evaluateRule(part, snapshot));
  }
}

function checkedUnlockedIds(unlockedIds: readonly string[]): ReadonlySet<string> {
  if (!Array.isArray(unlockedIds) || unlockedIds.length > MAX_UNLOCKED_ACHIEVEMENT_IDS) {
    throw new RangeError(`unlocked achievement ids must contain at most ${MAX_UNLOCKED_ACHIEVEMENT_IDS} rows`);
  }
  const ids = new Set<string>();
  for (const value of unlockedIds) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/u.test(value)) {
      throw new TypeError('unlocked achievement id is malformed');
    }
    ids.add(value);
  }
  return ids;
}

/** Returns only newly eligible aggregate achievements, in canonical order.
 * Event-owned rows are intentionally never inferred here. */
export function evaluateAchievementUnlocks(
  snapshot: AchievementSnapshot,
  unlockedIds: readonly string[] = Object.freeze([]),
): readonly string[] {
  assertAchievementSnapshot(snapshot);
  const unlocked = checkedUnlockedIds(unlockedIds);
  return Object.freeze(ACHIEVEMENTS
    .filter((definition) => definition.evaluation.kind === 'projection'
      && !unlocked.has(definition.id)
      && evaluateRule(definition.evaluation.rule, snapshot))
    .map((definition) => definition.id));
}

export type AchievementProjectionStatus = 'unlocked' | 'eligible' | 'locked' | 'event-owner-required';

export interface AchievementProjectionRow extends AchievementDefinition {
  readonly status: AchievementProjectionStatus;
}

export interface AchievementCatalogueProjection {
  readonly rows: readonly AchievementProjectionRow[];
  readonly unsupportedUnlockedIds: readonly string[];
  readonly rankCreditCount: number;
  readonly unlockedKnownCount: number;
  readonly eligibleProjectionCount: number;
  readonly eventOwnerRequiredCount: number;
}

/** Projects the full 96-row catalogue without mutating or laundering unknown
 * compatibility ids. Unknown ids remain explicit save evidence and retain
 * their legacy rank credit, but never become a known achievement row. */
export function projectAchievementCatalogue(
  snapshot: AchievementSnapshot,
  unlockedIds: readonly string[],
): AchievementCatalogueProjection {
  assertAchievementSnapshot(snapshot);
  const unlocked = checkedUnlockedIds(unlockedIds);
  const knownIds = new Set(ACHIEVEMENTS.map(({ id }) => id));
  const unsupportedUnlockedIds = Object.freeze([...unlocked].filter((id) => !knownIds.has(id)));
  let unlockedKnownCount = 0;
  let eligibleProjectionCount = 0;
  let eventOwnerRequiredCount = 0;
  const rows = Object.freeze(ACHIEVEMENTS.map((definition): AchievementProjectionRow => {
    let status: AchievementProjectionStatus;
    if (unlocked.has(definition.id)) {
      status = 'unlocked';
      unlockedKnownCount++;
    } else if (definition.evaluation.kind === 'event-owner') {
      status = 'event-owner-required';
      eventOwnerRequiredCount++;
    } else if (evaluateRule(definition.evaluation.rule, snapshot)) {
      status = 'eligible';
      eligibleProjectionCount++;
    } else {
      status = 'locked';
    }
    return Object.freeze({ ...definition, status });
  }));
  return Object.freeze({
    rows,
    unsupportedUnlockedIds,
    rankCreditCount: unlocked.size,
    unlockedKnownCount,
    eligibleProjectionCount,
    eventOwnerRequiredCount,
  });
}
