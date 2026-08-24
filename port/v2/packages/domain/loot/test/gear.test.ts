import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CORE_GEAR_BASES_V1,
  LEGACY_AFFIX_DEFINITIONS,
  createGearInstance,
  decodeGearInstance,
  encodeGearInstance,
  gearInstanceId,
  hasValidAffixLayout,
  isAffixCompatible,
  makeGearSourceActionId,
  migrateLegacyGear,
  parseGearInstanceId,
  parseGearSourceActionId,
  rollLegacyAffix,
  type GearGenerationPlan,
  type GearInstance,
  type LegacyGearMigrationInput,
} from '@cf/domain-loot';

const earthWorldId = 'CF1|g:999@90,-60|s:424242@560,170|p:133#2';
const source = makeGearSourceActionId({
  kind: 'discovery', ownerId: 'expedition-v5', actionKey: 'survey-1',
  worldId: earthWorldId, receiptId: 'receipt:12',
});
const migrationSource = makeGearSourceActionId({
  kind: 'legacy-migration', ownerId: 'save-v2-user', actionKey: 'items-v1',
  receiptId: 'migration:v4-v5',
});

const fourNaturalAffixes = [
  { affixId: 'yield', tier: 1, value: 0.10, role: 'prefix' },
  { affixId: 'strike', tier: 2, value: 0.02, role: 'prefix' },
  { affixId: 'contact', tier: 3, value: 4, role: 'suffix' },
  { affixId: 'heal', tier: 4, value: 0.08, role: 'suffix' },
] as const;

const generationPlan = (
  naturalAffixes: GearGenerationPlan['naturalAffixes'] = fourNaturalAffixes,
  generationSeed = 0x1234_5678,
): GearGenerationPlan => ({
  baseId: 'rig1',
  generationSeed,
  itemLevel: 1,
  quality: 0,
  rarityTier: 1,
  naturalAffixes,
  craftedModifier: null,
  drawback: null,
  upgrade: 0,
  sockets: [],
});

const migrationInput = (): LegacyGearMigrationInput => ({
  sourceActionId: migrationSource,
  itemCounts: [['plate', 3], ['rl-star', 1], ['fieldsuit', 1], ['rig1', 2]],
  equipped: { helmet: 'rl-star', suit: 'fieldsuit', tool: 'rig1' },
  equippedAffixes: {
    helmet: { k: 'contact', v: 9, forId: 'rl-star' },
    suit: { k: 'scut', v: 0, forId: 'fieldsuit' },
    tool: { k: 'yield', v: 0.05, forId: 'rig1' },
  },
});

describe('@cf/domain-loot — receipt identity and GearInstance authority', () => {
  it('encodes the bounded sourceActionId + ordinal pair injectively rather than hashing it', () => {
    const left = makeGearSourceActionId({ kind: 'craft', ownerId: 'a:b', actionKey: 'c' });
    const right = makeGearSourceActionId({ kind: 'craft', ownerId: 'a', actionKey: 'b:c' });
    const ids = new Set([
      gearInstanceId(left, 0),
      gearInstanceId(left, 1),
      gearInstanceId(right, 0),
      gearInstanceId(right, 1),
    ]);
    expect(ids.size).toBe(4);
    for (const id of ids) expect(gearInstanceId(...Object.values(parseGearInstanceId(id)) as [string, number])).toBe(id);
    const canonicalWorld = makeGearSourceActionId({
      kind: 'discovery', ownerId: 'owner|with-delimiter', actionKey: 'action/%',
      worldId: earthWorldId, missionId: 'mission|alpha', receiptId: 'receipt:1',
    });
    expect(canonicalWorld).toContain('CF1%7Cg%3A999');
    expect(makeGearSourceActionId(parseGearSourceActionId(canonicalWorld))).toBe(canonicalWorld);
    const maximumPlain = makeGearSourceActionId({
      kind: 'legacy-migration',
      ownerId: 'o'.repeat(192),
      actionKey: 'a'.repeat(192),
      worldId: 'w'.repeat(512),
      missionId: 'm'.repeat(512),
      receiptId: 'r'.repeat(512),
    });
    expect(maximumPlain.length).toBeLessThanOrEqual(2_048);
    expect(makeGearSourceActionId(parseGearSourceActionId(maximumPlain))).toBe(maximumPlain);
    const maximumReserved = makeGearSourceActionId({
      kind: 'craft', ownerId: 'owner', actionKey: '|/%'.repeat(50), receiptId: '|'.repeat(512),
    });
    expect(maximumReserved.length).toBeLessThanOrEqual(2_048);
    expect(makeGearSourceActionId(parseGearSourceActionId(maximumReserved))).toBe(maximumReserved);
    const nonBmp = makeGearSourceActionId({
      kind: 'craft', ownerId: '😀'.repeat(160), actionKey: 'forge',
    });
    expect(makeGearSourceActionId(parseGearSourceActionId(nonBmp))).toBe(nonBmp);
    expect(() => makeGearSourceActionId({
      kind: 'craft', ownerId: '|'.repeat(192), actionKey: '|'.repeat(192),
      worldId: '|'.repeat(512), missionId: '|'.repeat(512), receiptId: '|'.repeat(512),
    })).toThrow('bounded');
    expect(() => makeGearSourceActionId({ kind: 'craft', ownerId: 'bad\nowner', actionKey: 'c' })).toThrow('printable');
    expect(() => makeGearSourceActionId({ kind: 'craft', ownerId: '\ud800', actionKey: 'c' })).toThrow('printable');
    expect(() => gearInstanceId(left, 65_536)).toThrow('ordinal');
    expect(() => parseGearInstanceId(gearInstanceId(left, 1).replace(/\|1$/, '|01'))).toThrow();
  });

  it('preserves the exact caller-owned seed and canonical generation plan', () => {
    const first = createGearInstance(source, 0, generationPlan());
    const replay = createGearInstance(source, 0, generationPlan());
    const next = createGearInstance(source, 1, generationPlan());
    const alternateSeed = createGearInstance(source, 0, generationPlan(fourNaturalAffixes, 0x8765_4321));
    expect(replay).toEqual(first);
    expect(replay).not.toBe(first);
    expect(next.instanceId).not.toBe(first.instanceId);
    expect(alternateSeed.instanceId).toBe(first.instanceId);
    expect(alternateSeed.generation.seed).toBe(0x8765_4321);
    expect(alternateSeed).not.toEqual(first);
    expect(first.provenance).toEqual({
      sourceActionId: source,
      kind: 'discovery',
      worldId: earthWorldId,
      receiptId: 'receipt:12',
    });
    const base = CORE_GEAR_BASES_V1.find((candidate) => candidate.id === first.baseId);
    expect(base).toBeDefined();
    expect(first).toMatchObject({
      construction: 'generated',
      baseName: base!.name,
      slot: base!.slot,
      baseTier: base!.tier,
      rarityTier: base!.rarityTier,
      rarity: base!.rarity,
      baseEffects: base!.effects,
      implicits: base!.implicits,
      upgrade: 0,
      sockets: [],
      generation: { seed: 0x1234_5678, ordinal: 0 },
      legacyAffix: null,
    });
    expect('craftedModifier' in first).toBe(false);
    expect('drawback' in first).toBe(false);
    expect(first.itemLevel).toBe(1);
    expect(first.quality).toBe(0);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.baseEffects)).toBe(true);
    expect(Object.isFrozen(first.naturalAffixes)).toBe(true);
    expect(Object.isFrozen(first.generation)).toBe(true);
    expect(Object.isFrozen(first.provenance)).toBe(true);
  });

  it('ports the exact six legacy definitions and v1.8.9 roll curve vectors', () => {
    expect(LEGACY_AFFIX_DEFINITIONS.map(({ key, percent, min, max }) => ({ key, percent, min, max }))).toEqual([
      { key: 'yield', percent: true, min: 0.10, max: 0.35 },
      { key: 'strike', percent: true, min: 0.02, max: 0.06 },
      { key: 'scut', percent: true, min: 0.08, max: 0.25 },
      { key: 'contact', percent: false, min: 4, max: 12 },
      { key: 'land', percent: false, min: 4, max: 12 },
      { key: 'heal', percent: true, min: 0.08, max: 0.20 },
    ]);
    expect(rollLegacyAffix(0, 0)).toEqual({ key: 'contact', value: 9 });
    expect(rollLegacyAffix(1, 1)).toEqual({ key: 'yield', value: 0.19 });
    expect(rollLegacyAffix(123_456_789, 5)).toEqual({ key: 'scut', value: 0.15 });
    expect(rollLegacyAffix(0xffff_ffff, 9)).toEqual({ key: 'strike', value: 0.04 });
    expect(rollLegacyAffix(42, 9)).toEqual({ key: 'scut', value: 0.22 });
    expect(rollLegacyAffix(42, 10)).toEqual({ key: 'yield', value: 0.24 });
    expect(rollLegacyAffix(42, 14)).toEqual({ key: 'scut', value: 0.20 });
    expect(rollLegacyAffix(42, 0)).toEqual({ key: 'contact', value: 6 });
    expect(() => rollLegacyAffix(42, 15)).toThrow('legacy affix tier');
  });

  it('enforces compatibility, uniqueness, and the 0–2 prefix / 0–2 suffix caps', () => {
    for (const naturalAffixes of [[], fourNaturalAffixes] as const) {
      const instance = createGearInstance(source, naturalAffixes.length, generationPlan(naturalAffixes));
      expect(hasValidAffixLayout(instance), instance.baseId).toBe(true);
      expect(new Set(instance.naturalAffixes.map((affix) => affix.affixId)).size).toBe(instance.naturalAffixes.length);
      expect(instance.naturalAffixes.filter((affix) => affix.role === 'prefix').length).toBeLessThanOrEqual(2);
      expect(instance.naturalAffixes.filter((affix) => affix.role === 'suffix').length).toBeLessThanOrEqual(2);
      for (const affix of instance.naturalAffixes) {
        const definition = LEGACY_AFFIX_DEFINITIONS.find((candidate) => candidate.key === affix.affixId)!;
        expect(isAffixCompatible(instance, affix), `${instance.baseId}/${affix.affixId}`).toBe(true);
        expect(affix.value).toBeGreaterThanOrEqual(definition.min);
        expect(affix.value).toBeLessThanOrEqual(definition.max);
      }
    }

    const fourAffixes = createGearInstance(source, 9, generationPlan());
    const wrongSlot = { ...fourAffixes, slot: fourAffixes.slot === 'tool' ? 'helmet' : 'tool' } as GearInstance;
    expect(isAffixCompatible(wrongSlot, fourAffixes.naturalAffixes[0]!)).toBe(false);

    expect(() => createGearInstance(source, 10, generationPlan([
      { affixId: 'yield', tier: 1, value: 0.10, role: 'prefix' },
      { affixId: 'strike', tier: 1, value: 0.02, role: 'prefix' },
      { affixId: 'scut', tier: 1, value: 0.08, role: 'prefix' },
    ]))).toThrow('layout');
    expect(() => createGearInstance(source, 11, generationPlan([
      { affixId: 'contact', tier: 1, value: 4, role: 'suffix' },
      { affixId: 'land', tier: 1, value: 4, role: 'suffix' },
      { affixId: 'heal', tier: 1, value: 0.08, role: 'suffix' },
    ]))).toThrow('layout');
    expect(() => createGearInstance(source, 12, generationPlan([
      { affixId: 'yield', tier: 1, value: 0.10, role: 'prefix' },
      { affixId: 'yield', tier: 1, value: 0.10, role: 'suffix' },
    ]))).toThrow('layout');
  });

  it('migrates every duplicate copy deterministically and binds the old worn affix to one exact instance', () => {
    const migrated = migrateLegacyGear(migrationInput());
    const reordered = migrateLegacyGear({
      ...migrationInput(),
      itemCounts: [['rig1', 2], ['plate', 3], ['fieldsuit', 1], ['rl-star', 1]],
    });
    expect(reordered).toEqual(migrated);
    expect(migrated.stackableCounts).toEqual([{ baseId: 'plate', count: 3 }]);
    expect(migrated.instances).toHaveLength(4);
    expect(new Set(migrated.instances.map((instance) => instance.instanceId)).size).toBe(4);

    const rigs = migrated.instances.filter((instance) => instance.baseId === 'rig1');
    expect(rigs).toHaveLength(2);
    expect(rigs[0]).toMatchObject({
      construction: 'legacy', baseName: 'Mining Rig I', baseTier: 1,
      itemLevel: 1, quality: 0, rarityTier: 1, rarity: 'uncommon',
      baseEffects: { yield: 0.5 }, implicits: ['yield'], naturalAffixes: [],
      upgrade: 0, sockets: [],
      legacyAffix: { affixId: 'yield', value: 0.05, forBaseId: 'rig1' },
    });
    expect(rigs[1]!.legacyAffix).toBeNull();
    expect(migrated.equipped.find((binding) => binding.slot === 'tool')?.instanceId).toBe(rigs[0]!.instanceId);
    expect(isAffixCompatible(rigs[0]!, rigs[0]!.legacyAffix!)).toBe(true);
    expect(migrated.instances.find((instance) => instance.baseId === 'fieldsuit')?.legacyAffix?.value).toBe(0);
    for (const instance of migrated.instances) {
      const encoded = encodeGearInstance(instance);
      expect(encodeGearInstance(decodeGearInstance(encoded))).toBe(encoded);
    }
  });

  it('fails closed on duplicate, stale, incompatible, unknown, and malformed legacy state', () => {
    const duplicate = migrationInput();
    expect(() => migrateLegacyGear({ ...duplicate, itemCounts: [...duplicate.itemCounts, ['rig1', 1]] })).toThrow('repeats');
    expect(() => migrateLegacyGear({ ...migrationInput(), equipped: { helmet: 'rig1' }, equippedAffixes: {} })).toThrow('canonical base');
    expect(() => migrateLegacyGear({ ...migrationInput(), equipped: { tool: 'rig2' }, equippedAffixes: {} })).toThrow('not owned');
    expect(() => migrateLegacyGear({
      ...migrationInput(), equippedAffixes: { tool: { k: 'yield', v: 0.2, forId: 'rig2' } },
    })).toThrow('stale');
    expect(() => migrateLegacyGear({
      ...migrationInput(), equippedAffixes: { tool: { k: 'luck' as never, v: 0.2, forId: 'rig1' } },
    })).toThrow('unknown');
    expect(() => migrateLegacyGear({
      ...migrationInput(), equippedAffixes: { tool: { k: 'yield', v: 9, forId: 'rig1' } },
    })).toThrow('outside');
    expect(() => migrateLegacyGear({
      ...migrationInput(), equipped: {}, equippedAffixes: { tool: { k: 'yield', v: 0.2, forId: 'rig1' } },
    })).toThrow('no equipped base');
    expect(() => migrateLegacyGear({
      ...migrationInput(), sourceActionId: makeGearSourceActionId({ kind: 'discovery', ownerId: 'save-v2-user', actionKey: 'items-v1' }),
    })).toThrow('migration sourceActionId');
    expect(() => createGearInstance(migrationSource, 0, generationPlan())).toThrow('reserved');
    expect(() => migrateLegacyGear({ ...migrationInput(), itemCounts: [['invented-base', 1]] })).toThrow('unknown base');
  });

  it('has strict generated and migrated JSON fixed points and rejects future, forged, and extra fields', () => {
    const gear = createGearInstance(source, 7, generationPlan());
    const encoded = encodeGearInstance(gear);
    expect(encodeGearInstance(decodeGearInstance(encoded))).toBe(encoded);
    const forged = JSON.parse(encoded) as Record<string, unknown>;
    forged.baseName = 'Forged Rig';
    expect(() => decodeGearInstance(JSON.stringify(forged))).toThrow('does not match');

    const forgedImplicit = JSON.parse(encoded) as Record<string, unknown>;
    (forgedImplicit.implicits as string[]).push('invented-power');
    expect(() => decodeGearInstance(JSON.stringify(forgedImplicit))).toThrow('does not match');

    const forgedGeneration = JSON.parse(encoded) as Record<string, unknown>;
    (forgedGeneration.generation as Record<string, unknown>).seed = 0x1_0000_0000;
    expect(() => decodeGearInstance(JSON.stringify(forgedGeneration))).toThrow('generationSeed');

    const fractionalGeneration = JSON.parse(encoded) as Record<string, unknown>;
    (fractionalGeneration.generation as Record<string, unknown>).seed = 0.5;
    expect(() => decodeGearInstance(JSON.stringify(fractionalGeneration))).toThrow('generationSeed');

    const forgedWorld = JSON.parse(encoded) as Record<string, unknown>;
    (forgedWorld.provenance as Record<string, unknown>).worldId = `${earthWorldId}-forged`;
    expect(() => decodeGearInstance(JSON.stringify(forgedWorld))).toThrow('provenance');

    const relabeledKind = JSON.parse(encoded) as Record<string, unknown>;
    (relabeledKind.provenance as Record<string, unknown>).kind = 'guardian';
    expect(() => decodeGearInstance(JSON.stringify(relabeledKind))).toThrow('provenance');

    const unauthorizedCrafted = JSON.parse(encoded) as Record<string, unknown>;
    unauthorizedCrafted.craftedModifier = { affixId: 'yield', tier: 1, value: 0.1 };
    expect(() => decodeGearInstance(JSON.stringify(unauthorizedCrafted))).toThrow('unknown or missing');

    const unauthorizedDrawback = JSON.parse(encoded) as Record<string, unknown>;
    unauthorizedDrawback.drawback = { affixId: 'land', tier: 1, value: -1 };
    expect(() => decodeGearInstance(JSON.stringify(unauthorizedDrawback))).toThrow('unknown or missing');

    const unauthorizedUpgrade = JSON.parse(encoded) as Record<string, unknown>;
    unauthorizedUpgrade.upgrade = 1;
    expect(() => decodeGearInstance(JSON.stringify(unauthorizedUpgrade))).toThrow('upgrade table');

    const unauthorizedSocket = JSON.parse(encoded) as Record<string, unknown>;
    (unauthorizedSocket.sockets as string[]).push('invented-socket');
    expect(() => decodeGearInstance(JSON.stringify(unauthorizedSocket))).toThrow('socket catalogue');
    const future = JSON.parse(encoded) as Record<string, unknown>;
    future.schema = 2;
    expect(() => decodeGearInstance(JSON.stringify(future))).toThrow('unsupported');
    const extra = JSON.parse(encoded) as Record<string, unknown>;
    extra.reroll = true;
    expect(() => decodeGearInstance(JSON.stringify(extra))).toThrow('unknown or missing');

    const migrated = migrateLegacyGear(migrationInput()).instances[0]!;
    const migratedRaw = JSON.parse(encodeGearInstance(migrated)) as Record<string, unknown>;
    (migratedRaw.baseEffects as Record<string, unknown>).yield = 99;
    expect(() => decodeGearInstance(JSON.stringify(migratedRaw))).toThrow('does not match');

    const wrongBase = JSON.parse(encodeGearInstance(migrated)) as Record<string, unknown>;
    wrongBase.baseId = 'rig2';
    (wrongBase.legacyAffix as Record<string, unknown>).forBaseId = 'rig2';
    expect(() => decodeGearInstance(JSON.stringify(wrongBase))).toThrow('ordinal does not encode');
  });

  it('contains no hidden occurrence RNG or wall-clock source', () => {
    const sourceText = readFileSync(fileURLToPath(new URL('../src/gear.ts', import.meta.url)), 'utf8');
    expect(sourceText).not.toMatch(/Math\.random\s*\(/);
    expect(sourceText).not.toMatch(/Date\.now\s*\(/);
    expect(sourceText).toContain('Occurrence is deliberately outside this module');
  });
});
