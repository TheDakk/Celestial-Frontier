import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATALOGUE_SIZE,
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_SCORE_CREDIT,
  AUTO_ACHIEVEMENT_COUNT,
  EVENT_OWNED_ACHIEVEMENT_COUNT,
  MAX_UNLOCKED_ACHIEVEMENT_IDS,
  evaluateAchievementUnlocks,
  projectAchievementCatalogue,
  type AchievementDefinition,
  type AchievementSnapshot,
  type ProjectedAchievementRule,
} from '@cf/domain-progression';

const emptySnapshot = (): AchievementSnapshot => ({
  cataloguedSpeciesCount: 0,
  ownedKingdomCount: 0,
  ownedRealmCount: 0,
  hybridCount: 0,
  maxGeneration: 0,
  bestRawRarityTier: 0,
  ownedDisplayRarityTierCount: 0,
  surveyedLivingWorldCount: 0,
  surveyedWorldTypeCount: 0,
  surfaceWorldCount: 0,
  surveyedStarClassCount: 0,
  galaxyCount: 0,
  craftCount: 0,
  equippedGearCount: 0,
  ascentChapterIndex: 0,
  minedOutWorldCount: 0,
  miningLoadCount: 0,
  cosmicMaterialCount: 0,
  coronaSkimCount: 0,
  beaconCount: 0,
  cosmicEventCount: 0,
  settledWorldCount: 0,
  guardianCount: 0,
  stardustHarvestCount: 0,
  lifetimeStardust: 0,
  breedAttemptCount: 0,
  breedWinCount: 0,
  feedCount: 0,
  poisonousMealLossCount: 0,
  duelCount: 0,
  duelWinCount: 0,
  namedDiscoveryCount: 0,
  sharedCodeCount: 0,
  followedShareCodeCount: 0,
  hasJumpDrive: false,
  hasLongRangeArray: false,
  hasIntergalacticDrive: false,
  hasCosmicGear: false,
});

const maximumSnapshot = (): AchievementSnapshot => ({
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
  breedWinCount: 999_999_999,
  feedCount: 1_000_000_000,
  poisonousMealLossCount: 1_000_000_000,
  duelCount: 1_000_000_000,
  duelWinCount: 1_000_000_000,
  namedDiscoveryCount: 5_000,
  sharedCodeCount: 1_000_000_000,
  followedShareCodeCount: 1_000_000_000,
  hasJumpDrive: true,
  hasLongRangeArray: true,
  hasIntergalacticDrive: true,
  hasCosmicGear: true,
});

function legacyAchievementMetadata(): Array<{
  id: string;
  category: string;
  icon: string;
  name: string;
  description: string;
}> {
  const html = readFileSync(fileURLToPath(new URL('../../../../../../celestial-frontier.html', import.meta.url)), 'utf8');
  const begin = html.indexOf('const ACH=[');
  const end = html.indexOf('];\n/* survey hooks', begin);
  expect(begin).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(begin);
  const rows: Array<{ id: string; category: string; icon: string; name: string; description: string }> = [];
  const pattern = /\{id:'([^']+)',\s*cat:'([^']+)',\s*ic:'([^']+)',\s*name:'([^']+)',\s*d:'([^']+)',\s*t:/gu;
  const decode = (value: string): string => value.replace(/\\u([0-9a-f]{4})/giu,
    (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
  for (const match of html.slice(begin, end).matchAll(pattern)) {
    rows.push({
      id: match[1]!,
      category: match[2]!,
      icon: match[3]!,
      name: decode(match[4]!),
      description: decode(match[5]!),
    });
  }
  return rows;
}

function ruleSignature(rule: ProjectedAchievementRule): string {
  switch (rule.kind) {
    case 'at-least': return `${rule.field}>=${rule.minimum}`;
    case 'greater-than': return `${rule.left}>${rule.right}`;
    case 'flag': return rule.field;
    case 'all': return rule.rules.map(ruleSignature).join('&');
  }
}

const EXPECTED_PROJECTED_RULES = Object.freeze({
  first: 'cataloguedSpeciesCount>=1', field10: 'cataloguedSpeciesCount>=10', field50: 'cataloguedSpeciesCount>=50',
  codex150: 'cataloguedSpeciesCount>=150', codex300: 'cataloguedSpeciesCount>=300', kingdoms: 'ownedKingdomCount>=4',
  realms8: 'ownedRealmCount>=8', realms16: 'ownedRealmCount>=16', hybrid: 'hybridCount>=1', gene10: 'hybridCount>=10',
  gene50: 'hybridCount>=50', gen5: 'maxGeneration>=5', gen10: 'maxGeneration>=10', rare: 'bestRawRarityTier>=3',
  legend: 'bestRawRarityTier>=5', unique: 'bestRawRarityTier>=7', mythic: 'bestRawRarityTier>=8',
  transc: 'bestRawRarityTier>=9', summit: 'bestRawRarityTier>=12', tiers8: 'ownedDisplayRarityTierCount>=8',
  tiers12: 'ownedDisplayRarityTierCount>=10', survey5: 'surveyedLivingWorldCount>=5', survey25: 'surveyedLivingWorldCount>=25',
  survey100: 'surveyedLivingWorldCount>=100', survey250: 'surveyedLivingWorldCount>=250',
  worldset: 'surveyedWorldTypeCount>=8', surface5: 'surfaceWorldCount>=5', surface25: 'surfaceWorldCount>=25',
  stellarset: 'surveyedStarClassCount>=8', gal5: 'galaxyCount>=5', gal25: 'galaxyCount>=25', gal100: 'galaxyCount>=100',
  crafter: 'craftCount>=1', crafts25: 'craftCount>=25', geared: 'equippedGearCount>=1', shipwright: 'hasJumpDrive',
  arraybuilt: 'hasLongRangeArray', rimbreaker: 'hasIntergalacticDrive',
  ascended: 'ascentChapterIndex>=3&hasIntergalacticDrive', lastvein: 'minedOutWorldCount>=1',
  richstrike: 'miningLoadCount>=250', cosmicfind: 'cosmicMaterialCount>=1', skimmer: 'coronaSkimCount>=1',
  cosmicgear: 'hasCosmicGear', anomaly5: 'beaconCount>=5', anomaly25: 'beaconCount>=25',
  event1: 'cosmicEventCount>=1', event5: 'cosmicEventCount>=5', event25: 'cosmicEventCount>=25',
  settle5: 'settledWorldCount>=5', settle25: 'settledWorldCount>=25', guard1: 'guardianCount>=1',
  guard5: 'guardianCount>=5', harvest10: 'stardustHarvestCount>=10', essence500: 'lifetimeStardust>=500',
  bred1: 'breedWinCount>=1', bred10: 'breedWinCount>=10', bredfail: 'breedAttemptCount>breedWinCount',
  feed5: 'feedCount>=5', feedfail: 'poisonousMealLossCount>=1', duel1: 'duelCount>=1', duelw1: 'duelWinCount>=1',
  duelw5: 'duelWinCount>=5', duelw25: 'duelWinCount>=25', names5: 'namedDiscoveryCount>=5',
  names15: 'namedDiscoveryCount>=15', share5: 'sharedCodeCount>=5', jumps5: 'followedShareCodeCount>=5',
} satisfies Readonly<Record<string, string>>);

const EXPECTED_EVENT_OWNERS = Object.freeze({
  home: 'landing:earth', civ: 'survey:world-civilized', spacefar: 'survey:world-spacefaring',
  sol: 'survey:star-sol', binary: 'survey:star-binary', seebh: 'survey:star-black-hole',
  seens: 'survey:star-neutron-star', seemag: 'survey:star-magnetar', seewd: 'survey:star-white-dwarf',
  seerg: 'survey:star-red-giant', seesg: 'survey:star-red-supergiant', seeproto: 'survey:star-protostar',
  seebd: 'survey:star-brown-dwarf', worm: 'travel:wormhole', quasar: 'travel:quasar-galaxy',
  dwarfg: 'travel:dwarf-galaxy', curator: 'atlas:first-favorite', daily: 'beacon:follow',
  decade: 'event:once-a-decade', settle1: 'conquest:first-settlement', survivor: 'survival:hostile-field-strike',
  brink: 'survival:below-twenty-hp', fieldmedic: 'care:flora-heal', gambler: 'care:high-risk-flora-heal',
  bredlegend: 'breed:legendary-pair', namer: 'naming:first-discovery-name', share: 'sharing:first-code-sent',
  wayfarer: 'sharing:first-code-followed',
} satisfies Readonly<Record<string, string>>);

function singleRulePositiveAndNegative(
  definition: AchievementDefinition,
): { positive: AchievementSnapshot; negatives: AchievementSnapshot[] } {
  if (definition.evaluation.kind !== 'projection') throw new TypeError('projection rule required');
  const applyPositive = (rule: ProjectedAchievementRule, target: AchievementSnapshot): AchievementSnapshot => {
    switch (rule.kind) {
      case 'at-least': return { ...target, [rule.field]: rule.minimum };
      case 'greater-than': return { ...target, [rule.left]: 1, [rule.right]: 0 };
      case 'flag': return { ...target, [rule.field]: true };
      case 'all': return rule.rules.reduce((current, part) => applyPositive(part, current), target);
    }
  };
  const positive = applyPositive(definition.evaluation.rule, emptySnapshot());
  const negatives: AchievementSnapshot[] = [];
  const addNegatives = (rule: ProjectedAchievementRule): void => {
    switch (rule.kind) {
      case 'at-least':
        negatives.push({ ...positive, [rule.field]: Math.max(0, rule.minimum - 1) });
        break;
      case 'greater-than':
        negatives.push({ ...positive, [rule.left]: 0, [rule.right]: 0 });
        break;
      case 'flag':
        negatives.push({ ...positive, [rule.field]: false });
        break;
      case 'all':
        rule.rules.forEach(addNegatives);
        break;
    }
  };
  addNegatives(definition.evaluation.rule);
  return { positive, negatives };
}

describe('@cf/domain-progression — Arc 9A achievements', () => {
  it('matches all 96 committed v1.8.9 metadata rows in exact canonical order', () => {
    expect(ACHIEVEMENTS).toHaveLength(ACHIEVEMENT_CATALOGUE_SIZE);
    expect(legacyAchievementMetadata()).toHaveLength(ACHIEVEMENT_CATALOGUE_SIZE);
    expect(ACHIEVEMENTS.map(({ id, category, icon, name, description }) => ({
      id, category, icon, name, description,
    }))).toEqual(legacyAchievementMetadata());
    expect(new Set(ACHIEVEMENTS.map(({ id }) => id)).size).toBe(ACHIEVEMENT_CATALOGUE_SIZE);
    expect(ACHIEVEMENT_CATEGORIES).toEqual([
      'Cataloguing', 'Breeding', 'Rarity', 'Worlds', 'Stellar', 'Exploration',
      'Engineering', 'Cosmic Events', 'Conquest', 'Survival', 'Husbandry', 'Duels', 'Legacy',
    ]);
    expect(ACHIEVEMENT_SCORE_CREDIT).toBe(6);
  });

  it('binds every aggregate rule and every event-owned boundary independently', () => {
    const projected = Object.fromEntries(ACHIEVEMENTS.flatMap(({ id, evaluation }) =>
      evaluation.kind === 'projection' ? [[id, ruleSignature(evaluation.rule)]] : []));
    const events = Object.fromEntries(ACHIEVEMENTS.flatMap(({ id, evaluation }) =>
      evaluation.kind === 'event-owner' ? [[id, evaluation.owner]] : []));
    expect(projected).toEqual(EXPECTED_PROJECTED_RULES);
    expect(events).toEqual(EXPECTED_EVENT_OWNERS);
    expect(Object.keys(projected)).toHaveLength(AUTO_ACHIEVEMENT_COUNT);
    expect(Object.keys(events)).toHaveLength(EVENT_OWNED_ACHIEVEMENT_COUNT);
  });

  it('proves every aggregate rule at its exact positive and just-below boundary', () => {
    for (const definition of ACHIEVEMENTS) {
      if (definition.evaluation.kind !== 'projection') continue;
      const { positive, negatives } = singleRulePositiveAndNegative(definition);
      expect(evaluateAchievementUnlocks(positive), definition.id).toContain(definition.id);
      for (const negative of negatives) {
        expect(evaluateAchievementUnlocks(negative), definition.id).not.toContain(definition.id);
      }
    }
  });

  it('evaluates all 68 projections but never guesses one of the 28 event-owned achievements', () => {
    const unlocks = evaluateAchievementUnlocks(maximumSnapshot());
    expect(unlocks).toHaveLength(AUTO_ACHIEVEMENT_COUNT);
    expect(unlocks).toEqual(ACHIEVEMENTS
      .filter(({ evaluation }) => evaluation.kind === 'projection')
      .map(({ id }) => id));
    for (const id of Object.keys(EXPECTED_EVENT_OWNERS)) expect(unlocks).not.toContain(id);
    expect(evaluateAchievementUnlocks(emptySnapshot())).toEqual([]);
  });

  it('suppresses already durable unlocks and projects event rows only from their stored ids', () => {
    expect(evaluateAchievementUnlocks(maximumSnapshot(), ['first', 'home'])).not.toContain('first');
    const projection = projectAchievementCatalogue(emptySnapshot(), ['home']);
    expect(projection.rows).toHaveLength(96);
    expect(projection.rows.find(({ id }) => id === 'home')?.status).toBe('unlocked');
    expect(projection.rows.find(({ id }) => id === 'sol')?.status).toBe('event-owner-required');
    expect(projection.rows.find(({ id }) => id === 'first')?.status).toBe('locked');
    expect(projection.unlockedKnownCount).toBe(1);
    expect(projection.eventOwnerRequiredCount).toBe(27);
  });

  it('preserves unknown compatibility ids as explicit unsupported evidence and legacy rank credit', () => {
    const projection = projectAchievementCatalogue(emptySnapshot(), ['first', 'future-achievement', 'future-achievement']);
    expect(projection.unsupportedUnlockedIds).toEqual(['future-achievement']);
    expect(projection.rankCreditCount).toBe(2);
    expect(projection.unlockedKnownCount).toBe(1);
    expect(projection.rows.find(({ id }) => id === 'future-achievement')).toBeUndefined();
  });

  it('fails closed on malformed/unbounded snapshots and unlock carriers', () => {
    expect(() => evaluateAchievementUnlocks({ ...emptySnapshot(), cataloguedSpeciesCount: -1 })).toThrow(/cataloguedSpeciesCount/);
    expect(() => evaluateAchievementUnlocks({ ...emptySnapshot(), galaxyCount: 20_001 })).toThrow(/galaxyCount/);
    expect(() => evaluateAchievementUnlocks({ ...emptySnapshot(), hasJumpDrive: 1 as never })).toThrow(/hasJumpDrive/);
    expect(() => projectAchievementCatalogue(emptySnapshot(), ['bad id'])).toThrow(/malformed/);
    expect(() => projectAchievementCatalogue(emptySnapshot(), Array.from({ length: MAX_UNLOCKED_ACHIEVEMENT_IDS + 1 }, (_, i) => `a${i}`)))
      .toThrow(/at most/);
  });

  it('keeps the manifest and projections immutable and entropy/clock-free', () => {
    expect(Object.isFrozen(ACHIEVEMENTS)).toBe(true);
    expect(ACHIEVEMENTS.every((row) => Object.isFrozen(row) && Object.isFrozen(row.evaluation))).toBe(true);
    const projection = projectAchievementCatalogue(maximumSnapshot(), []);
    expect(Object.isFrozen(projection)).toBe(true);
    expect(Object.isFrozen(projection.rows)).toBe(true);
    expect(projection.rows.every(Object.isFrozen)).toBe(true);
    const source = readFileSync(fileURLToPath(new URL('../src/achievements.ts', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/Math\.random\s*\(/u);
    expect(source).not.toMatch(/Date\.now\s*\(/u);
    expect(source).not.toMatch(/performance\.now\s*\(/u);
  });

  it('keeps the new owner exported without introducing a second package dependency', () => {
    const index = readFileSync(fileURLToPath(new URL('../src/index.ts', import.meta.url)), 'utf8');
    const packageJson = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(index.match(/export \* from '\.\/achievements\.js';/gu)).toHaveLength(1);
    expect(index.match(/export \* from '\.\/rank\.js';/gu)).toHaveLength(1);
    expect(packageJson.dependencies).toEqual({ '@cf/domain-rand': '*' });
  });
});
