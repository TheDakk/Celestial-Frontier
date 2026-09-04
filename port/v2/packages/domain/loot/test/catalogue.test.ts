import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { readTrackedV1Source } from '../../../../test-support/tracked-v1-source.js';
import {
  LOOT_CATALOGUE_V1,
  SLOTTED_GEAR_BASES_V1,
  STACKABLE_CATALOGUE_V1,
  UNIVERSAL_RARITY_TIERS,
} from '@cf/domain-loot';

const ALL_IDS = [
  'plate', 'wire', 'chip', 'frame', 'lens', 'pellet', 'weave', 'cell', 'cryogel',
  'coil', 'navcore', 'hullseg', 'fuelcell', 'servo', 'cryocap', 'jumpdrive', 'array',
  'igdrive', 'autoext', 'cscoop', 'rig1', 'rig2', 'rig3', 'fieldsuit', 'hazmat',
  'thermal', 'presshull', 'cryoline', 'struts', 'stabil', 'anchor', 'headlamp', 'visor',
  'voidhelm', 'earpiece', 'resonator', 'meteor', 'compass', 'diplobeacon',
  'prismpendant', 'gripgloves', 'surgeon', 'fieldlegs', 'greaves', 'magboots',
  'gravboots', 'rl-stone', 'rl-ocean', 'rl-flame', 'rl-sky', 'rl-life', 'rl-mind',
  'rl-star', 'rl-void', 'rl-prism', 'cg-proto', 'cg-genesis', 'cg-void', 'cg-chron',
  'cg-dark', 'cg-plasma', 'cg-corona',
] as const;

const SLOTTED_GOLDEN = [
  ['rig1', 'tool', 'Mining Rig I', 1, null, 1, 'uncommon', { yield: 0.5 }],
  ['rig2', 'tool', 'Mining Rig II', 2, null, 3, 'rare', { yield: 1 }],
  ['rig3', 'tool', 'Plasma Bore III', 3, null, 5, 'legendary', { yield: 2, strike: 0.04 }],
  ['fieldsuit', 'suit', 'Field Suit', 1, null, 1, 'uncommon', { scut: 0.25, land: 5 }],
  ['hazmat', 'suit', 'Hazmat Suit', 2, null, 3, 'rare', { scut: 0.45, land: 8 }],
  ['thermal', 'suit', 'Thermal Weave', 3, null, 5, 'legendary', { scut: 0.45, land: 10, landfam: { lava: 30, venus: 30 } }],
  ['presshull', 'suit', 'Pressure Shell', 3, null, 5, 'legendary', { scut: 0.45, land: 10, landfam: { gas: 30, venus: 30 } }],
  ['cryoline', 'suit', 'Cryo Lining', 3, null, 5, 'legendary', { scut: 0.45, land: 10, landfam: { ice: 30 } }],
  ['struts', 'module', 'Landing Struts', 1, null, 1, 'uncommon', { struts: 2, land: 5 }],
  ['stabil', 'module', 'Descent Stabilizers', 2, null, 3, 'rare', { struts: 3, land: 15 }],
  ['anchor', 'module', 'Gravitic Anchor', 3, null, 5, 'legendary', { land100: 1 }],
  ['headlamp', 'helmet', 'Miner’s Headlamp', 1, null, 1, 'uncommon', { strike: 0.02 }],
  ['visor', 'helmet', 'Scout Visor', 2, null, 3, 'rare', { scut: 0.15 }],
  ['voidhelm', 'helmet', 'Voidglass Visor', 3, null, 5, 'legendary', { scut: 0.25, strike: 0.02 }],
  ['earpiece', 'ears', 'Comms Earpiece', 1, null, 1, 'uncommon', { contact: 10 }],
  ['resonator', 'ears', 'Vein Resonator', 2, null, 3, 'rare', { strike: 0.06 }],
  ['meteor', 'necklace', 'Meteorite Pendant', 1, null, 1, 'uncommon', { strike: 0.02 }],
  ['compass', 'necklace', 'Star Compass', 2, null, 3, 'rare', { speed: 1 }],
  ['diplobeacon', 'necklace', 'Diplomat’s Beacon', 2, null, 3, 'rare', { contact: 20 }],
  ['prismpendant', 'necklace', 'Prismatic Pendant', 3, null, 5, 'legendary', { contact: 10, heal: 0.2, strike: 0.02 }],
  ['gripgloves', 'gloves', 'Grip Gloves', 1, null, 1, 'uncommon', { yield: 0.25 }],
  ['surgeon', 'gloves', 'Surgeon’s Gloves', 2, null, 3, 'rare', { heal: 0.35 }],
  ['fieldlegs', 'legs', 'Field Leggings', 1, null, 1, 'uncommon', { scut: 0.1 }],
  ['greaves', 'legs', 'Stabilizer Greaves', 2, null, 3, 'rare', { land: 5, struts: 1 }],
  ['magboots', 'boots', 'Mag-Boots', 1, null, 1, 'uncommon', { land: 5 }],
  ['gravboots', 'boots', 'Graviton Boots', 3, null, 5, 'legendary', { land: 10, struts: 1 }],
  ['rl-stone', 'suit', 'Graven Aegis', 3, null, 7, 'celestial', { scut: 0.45, struts: 2 }],
  ['rl-ocean', 'boots', 'Tidewalker Boots', 3, null, 7, 'celestial', { land: 6, struts: 1 }],
  ['rl-flame', 'gloves', 'Emberforged Gauntlets', 3, null, 7, 'celestial', { yield: 0.2, strike: 0.08 }],
  ['rl-sky', 'module', 'Skysail Module', 3, null, 7, 'celestial', { speed: 1, land: 4 }],
  ['rl-life', 'necklace', 'Verdant Locket', 3, null, 7, 'celestial', { heal: 0.3 }],
  ['rl-mind', 'ears', 'Mindreader Coil', 3, null, 7, 'celestial', { contact: 12 }],
  ['rl-star', 'helmet', 'Starcrowned Helm', 3, null, 7, 'celestial', { strike: 0.1, contact: 4 }],
  ['rl-void', 'legs', 'Voidwoven Leggings', 3, null, 7, 'celestial', { scut: 0.15, speed: 1 }],
  ['rl-prism', 'tool', 'Prismatic Lathe', 3, null, 7, 'celestial', { yield: 1.5, strike: 0.12 }],
  ['cg-proto', 'suit', 'Protomatter Carapace', 4, 8, 8, 'primordial', { scut: 0.55, land: 12 }],
  ['cg-genesis', 'necklace', 'Genesis Locket', 4, 8, 8, 'primordial', { heal: 0.5 }],
  ['cg-void', 'legs', 'Void-Phase Greaves', 5, 9, 9, 'transcendent', { scut: 0.28, speed: 1 }],
  ['cg-chron', 'module', 'Chronal Drive', 5, 9, 9, 'transcendent', { speed: 2, land: 6 }],
  ['cg-dark', 'tool', 'Dark Matter Bore', 5, 9, 9, 'transcendent', { yield: 2.5, strike: 0.10 }],
  ['cg-plasma', 'gloves', 'Plasma Gauntlets', 5, 7, 7, 'celestial', { yield: 0.4, strike: 0.1 }],
  ['cg-corona', 'suit', 'Coronal Aegis', 5, 7, 7, 'celestial', { scut: 0.50, land: 10, skimguard: 1 }],
] as const;

const slottedProjection = () => SLOTTED_GEAR_BASES_V1.map((base) => [
  base.id, base.slot, base.name, base.tier, base.authoredRarityTier,
  base.rarityTier, base.rarity, base.effects,
]);

interface LegacyItemLiteral {
  readonly id: string;
  readonly cat: string;
  readonly slot?: string;
  readonly tier: number;
  readonly rar?: number;
  readonly fam: string;
  readonly hue: string;
  readonly name: string;
  readonly d: string;
  readonly cost: Record<string, number>;
  readonly parts?: Record<string, number>;
  readonly sd?: number;
  readonly req?: string;
  readonly sig?: string;
  readonly eff?: Record<string, unknown>;
  readonly unlock?: string;
}

function legacyItemsFromSource(): readonly LegacyItemLiteral[] {
  const source = readTrackedV1Source().script;
  const start = source.indexOf('const ITEMS=[');
  const end = source.indexOf('\n];\nconst ITEM_BY', start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return runInNewContext(source.slice(start + 'const ITEMS='.length, end + 2), Object.create(null)) as LegacyItemLiteral[];
}

describe('@cf/domain-loot — canonical legacy catalogue manifest', () => {
  it('exposes the exact 62 IDs and the content-registry slot split without collisions', () => {
    expect(LOOT_CATALOGUE_V1).toHaveLength(62);
    expect(STACKABLE_CATALOGUE_V1).toHaveLength(20);
    expect(SLOTTED_GEAR_BASES_V1).toHaveLength(42);
    expect(LOOT_CATALOGUE_V1.map((definition) => definition.id)).toEqual(ALL_IDS);
    expect(new Set(LOOT_CATALOGUE_V1.map((definition) => definition.id)).size).toBe(62);
    expect(STACKABLE_CATALOGUE_V1.every((definition) => definition.slot === null)).toBe(true);
    expect(SLOTTED_GEAR_BASES_V1.every((definition) => definition.slot !== null)).toBe(true);

    const registryPath = fileURLToPath(new URL('../../../../../baseline-v1.8.9/content-registry.json', import.meta.url));
    const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as { items: Record<string, { slot: string | null }> };
    expect(Object.entries(registry.items).map(([id, value]) => [id, value.slot])).toEqual(
      LOOT_CATALOGUE_V1.map((definition) => [definition.id, definition.slot]),
    );
  });

  it('pins every slotted base name, tier, authored rarity override, resolved rarity, and effect', () => {
    expect(slottedProjection()).toEqual(SLOTTED_GOLDEN);

    const broken = structuredClone(slottedProjection());
    (broken[0]![7] as { yield: number }).yield = 9;
    expect(broken).not.toEqual(SLOTTED_GOLDEN);
  });

  it('carries every source-owned v1.8.9 catalogue field without handwritten substitute content', () => {
    const sourceProjection = legacyItemsFromSource().map((item) => ({
      id: item.id,
      category: item.cat,
      slot: item.slot ?? null,
      name: item.name,
      family: item.fam,
      hue: item.hue,
      description: item.d,
      tier: item.tier,
      authoredRarityTier: item.rar ?? null,
      effects: item.eff ?? {},
      implicits: Object.keys(item.eff ?? {}).sort(),
      materialCost: item.cost,
      partCost: item.parts ?? null,
      stardustCost: item.sd ?? null,
      prerequisiteId: item.req ?? null,
      signatureId: item.sig ?? null,
      unlock: item.unlock ?? null,
    }));
    const portProjection = LOOT_CATALOGUE_V1.map((item) => ({
      id: item.id,
      category: item.category,
      slot: item.slot,
      name: item.name,
      family: item.family,
      hue: item.hue,
      description: item.description,
      tier: item.tier,
      authoredRarityTier: item.authoredRarityTier,
      effects: item.effects,
      implicits: item.implicits,
      materialCost: item.materialCost,
      partCost: item.partCost,
      stardustCost: item.stardustCost,
      prerequisiteId: item.prerequisiteId,
      signatureId: item.signatureId,
      unlock: item.unlock,
    }));
    expect(portProjection).toEqual(sourceProjection);

    const drift = structuredClone(portProjection);
    drift[0]!.description = 'invented replacement';
    expect(drift).not.toEqual(sourceProjection);
  });

  it('uses the universal ten-tier vocabulary verbatim and preserves the two system effects', () => {
    expect(UNIVERSAL_RARITY_TIERS.map(({ tier, id, name }) => ({ tier, id, name }))).toEqual([
      { tier: 0, id: 'common', name: 'Common' },
      { tier: 1, id: 'uncommon', name: 'Uncommon' },
      { tier: 2, id: 'notable', name: 'Notable' },
      { tier: 3, id: 'rare', name: 'Rare' },
      { tier: 4, id: 'exotic', name: 'Exotic' },
      { tier: 5, id: 'legendary', name: 'Legendary' },
      { tier: 6, id: 'mythic', name: 'Mythic' },
      { tier: 7, id: 'celestial', name: 'Celestial' },
      { tier: 8, id: 'primordial', name: 'Primordial' },
      { tier: 9, id: 'transcendent', name: 'Transcendent' },
    ]);
    expect(STACKABLE_CATALOGUE_V1.find((definition) => definition.id === 'autoext')?.effects).toEqual({ auto: 1 });
    expect(STACKABLE_CATALOGUE_V1.find((definition) => definition.id === 'cscoop')?.effects).toEqual({ skim: 1, skimguard: 1 });
  });
});
