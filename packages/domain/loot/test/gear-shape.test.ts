import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  EXCEPTIONAL_CRAFT_OWNER_ID_V1,
  LEGACY_AFFIX_DEFINITIONS,
  SLOTTED_GEAR_BASES_V1,
  createGearInstance,
  createGearInventory,
  decodeGearInstance,
  decodeGearInventory,
  encodeGearInstance,
  encodeGearInventory,
  getFixedCraftGenerationPlan,
  grantGear,
  hasValidAffixLayout,
  makeGearSourceActionId,
  mayBeWellMade,
  migrateLegacyGear,
  type GearGenerationPlan,
  type GearInstance,
  type GearNaturalAffix,
} from '@cf/domain-loot';

const fieldSource = makeGearSourceActionId({ kind: 'conquest', ownerId: 'shape-test', actionKey: 'world-1' });
const craftSource = (baseId: string, receipt: number) => makeGearSourceActionId({
  kind: 'craft', ownerId: EXCEPTIONAL_CRAFT_OWNER_ID_V1, actionKey: `recipe:${baseId}`, receiptId: `receipt:${receipt}`,
});

const plan = (baseId: string, changes: Partial<GearGenerationPlan> = {}): GearGenerationPlan => ({
  baseId,
  generationSeed: 0x5eed,
  itemLevel: 1,
  quality: 0,
  rarityTier: 1,
  naturalAffixes: [],
  craftedModifier: null,
  drawback: null,
  upgrade: 0,
  sockets: [],
  ...changes,
});

type Key = GearNaturalAffix['affixId'];
/** One stored modifier at its weakest authored value, from spoils unless said;
 * the first of a piece is its prefix and the second its suffix. */
const row = (affixId: Key, position: 0 | 1, more: Record<string, unknown> = {}): GearNaturalAffix => ({
  affixId,
  tier: 3,
  value: LEGACY_AFFIX_DEFINITIONS.find((definition) => definition.key === affixId)!.min,
  role: position === 0 ? 'prefix' : 'suffix',
  source: 'spoils',
  ...more,
} as GearNaturalAffix);
const pair = (first: Key, second: Key) => [row(first, 0), row(second, 1)];
const make = (baseId: string, changes: Partial<GearGenerationPlan> = {}, ordinal = 0) => (
  createGearInstance(fieldSource, ordinal, plan(baseId, changes))
);
/** The stored bytes of a piece after a hostile hand has edited them. */
const edited = (piece: GearInstance, edit: (raw: Record<string, any>) => void): string => {
  const raw = JSON.parse(encodeGearInstance(piece)) as Record<string, any>;
  edit(raw);
  return JSON.stringify(raw);
};
const readsBack = (piece: GearInstance): string => {
  const bytes = encodeGearInstance(piece);
  const read = decodeGearInstance(bytes);
  expect(read).toEqual(piece);
  expect(encodeGearInstance(read)).toBe(bytes);
  return bytes;
};
const migratedRig = () => migrateLegacyGear({
  sourceActionId: makeGearSourceActionId({ kind: 'legacy-migration', ownerId: 'shape-test', actionKey: 'items-v1' }),
  itemCounts: [['rig1', 1]],
  equipped: { tool: 'rig1' },
  equippedAffixes: { tool: { k: 'yield', v: 0.2, forId: 'rig1' } },
}).instances[0]!;
/** A Meteorite Pendant forged from pure exceptional stock whose modifier is yield. */
const forgedYieldMeteor = () => {
  for (let receipt = 0; receipt < 200; receipt++) {
    const source = craftSource('meteor', receipt);
    const forgedPlan = getFixedCraftGenerationPlan('meteor', receipt, source);
    if (forgedPlan.craftedModifier?.affixId === 'exceptional-v1:yield') return { source, forgedPlan };
  }
  throw new Error('no forged yield modifier in 200 receipts');
};
const UNIQUE_BASES = SLOTTED_GEAR_BASES_V1.filter((base) => base.category === 'relic' || base.id.startsWith('cg-'));
const CRAFTED_BASES = SLOTTED_GEAR_BASES_V1.filter((base) => !UNIQUE_BASES.includes(base));

const digest = (pieces: readonly GearInstance[]) => {
  const text = pieces.map(encodeGearInstance).join('\n');
  return { pieces: pieces.length, length: text.length, sha256: createHash('sha256').update(text).digest('hex') };
};

/** Every kind of piece the game could make before the shape gained a property
 * and a source: built, forged with the painted port's modifier, and migrated
 * from a legacy save. No writer made a stored modifier row. */
function piecesOfTheOldShape(): readonly GearInstance[] {
  const built = SLOTTED_GEAR_BASES_V1.map((base, index) => createGearInstance(
    craftSource(base.id, index), 0, getFixedCraftGenerationPlan(base.id, 0x5eed + index),
  ));
  const forged = SLOTTED_GEAR_BASES_V1.map((base, index) => {
    const source = craftSource(base.id, 100 + index);
    return createGearInstance(source, 0, getFixedCraftGenerationPlan(base.id, 0xf07e + index, source));
  });
  const migrated = migrateLegacyGear({
    sourceActionId: makeGearSourceActionId({ kind: 'legacy-migration', ownerId: 'shape-test', actionKey: 'items-v1' }),
    itemCounts: SLOTTED_GEAR_BASES_V1.map((base) => [base.id, base.id === 'rig1' ? 2 : 1] as const),
    equipped: { tool: 'rig1', helmet: 'rl-star', suit: 'cg-proto' },
    equippedAffixes: {
      tool: { k: 'yield', v: 0.05, forId: 'rig1' },
      helmet: { k: 'contact', v: 9, forId: 'rl-star' },
      suit: { k: 'heal', v: 0.2, forId: 'cg-proto' },
    },
  }).instances;
  return [...built, ...forged, ...migrated];
}

describe('@cf/domain-loot: the stored shape of a piece', () => {
  it('a piece made before this change still reads byte for byte', () => {
    const pieces = piecesOfTheOldShape();
    expect(digest(pieces)).toEqual({
      pieces: 127, length: 81_254, sha256: 'fbeb021a3fe5c0bf26ecca3b87ea38c3730f81f7c2f0f08c6312ea024b1da154',
    });
    for (const piece of pieces) {
      const bytes = encodeGearInstance(piece);
      expect(encodeGearInstance(decodeGearInstance(bytes))).toBe(bytes);
    }
    expect(encodeGearInstance(make('rig1', {}, 3))).toBe(
      '{"schema":1,"tableVersion":1,"construction":"generated","instanceId":"gear1|loot1|conquest|shape-test|world-1||||3",'
      + '"baseId":"rig1","baseName":"Mining Rig I","slot":"tool","baseTier":1,"itemLevel":1,"quality":0,"rarityTier":1,'
      + '"rarity":"uncommon","tags":["gear","tool","yield"],"baseEffects":{"yield":0.5},"implicits":["yield"],'
      + '"naturalAffixes":[],"upgrade":0,"sockets":[],'
      + '"generation":{"seed":24301,"ordinal":3},"legacyAffix":null,'
      + '"provenance":{"kind":"conquest","sourceActionId":"loot1|conquest|shape-test|world-1|||"}}',
    );
  });

  it('a piece that uses the new fields is stored as exactly these bytes', () => {
    const legendary = make('rig2', {
      quality: 1,
      naturalAffixes: [row('yield', 0, { source: 'forge', tier: 14 }), row('contact', 1, { source: 'spoils', tier: 0 })],
      property: { id: 'motherlode' },
    }, 7);
    expect(readsBack(legendary)).toBe(
      '{"schema":1,"tableVersion":1,"construction":"generated","instanceId":"gear1|loot1|conquest|shape-test|world-1||||7",'
      + '"baseId":"rig2","baseName":"Mining Rig II","slot":"tool","baseTier":2,"itemLevel":1,"quality":1,"rarityTier":1,'
      + '"rarity":"uncommon","tags":["gear","tool","yield"],"baseEffects":{"yield":1},"implicits":["yield"],'
      + '"naturalAffixes":[{"affixId":"yield","tier":14,"value":0.1,"role":"prefix","source":"forge"},'
      + '{"affixId":"contact","tier":0,"value":4,"role":"suffix","source":"spoils"}],"property":{"id":"motherlode"},'
      + '"upgrade":0,"sockets":[],"generation":{"seed":24301,"ordinal":7},"legacyAffix":null,'
      + '"provenance":{"kind":"conquest","sourceActionId":"loot1|conquest|shape-test|world-1|||"}}',
    );

    const { source, forgedPlan } = forgedYieldMeteor();
    const forgedLegendary = createGearInstance(source, 0, {
      ...forgedPlan, quality: 1, naturalAffixes: [row('contact', 0, { tier: 12 })], property: { id: 'envoy' },
    });
    expect(readsBack(forgedLegendary)).toBe(
      '{"schema":1,"tableVersion":1,"construction":"generated",'
      + '"instanceId":"gear1|loot1|craft|legacy-v1.8.9-items|recipe%3Ameteor|||receipt%3A3|0",'
      + '"baseId":"meteor","baseName":"Meteorite Pendant","slot":"necklace","baseTier":1,"itemLevel":1,"quality":1,'
      + '"rarityTier":1,"rarity":"uncommon","tags":["gear","necklace","strike"],"baseEffects":{"strike":0.02},'
      + '"implicits":["strike"],'
      + '"naturalAffixes":[{"affixId":"contact","tier":12,"value":4,"role":"prefix","source":"spoils"}],'
      + '"property":{"id":"envoy"},"craftedModifier":{"affixId":"exceptional-v1:yield","tier":1,"value":0.2},'
      + '"upgrade":0,"sockets":[],"generation":{"seed":3,"ordinal":0},"legacyAffix":null,'
      + '"provenance":{"kind":"craft","sourceActionId":"loot1|craft|legacy-v1.8.9-items|recipe%3Ameteor|||receipt%3A3",'
      + '"receiptId":"receipt:3"}}',
    );
  });

  it('a piece holds a well-made flag, two modifiers and a property, and reads back the same', () => {
    const modifierSets: readonly (readonly GearNaturalAffix[])[] = [
      [],
      [row('heal', 0, { source: 'spoils' })],
      [row('heal', 0, { source: 'forge' })],
      [row('yield', 0, { source: 'forge' }), row('contact', 1, { source: 'spoils' })],
      [row('yield', 0, { source: 'spoils' }), row('contact', 1, { source: 'spoils' })],
    ];
    let ordinal = 0;
    for (const quality of [0, 1]) {
      for (const naturalAffixes of modifierSets) {
        const piece = make('rig2', { quality, naturalAffixes }, ordinal++);
        expect(piece.quality).toBe(quality);
        expect(piece.naturalAffixes).toEqual(naturalAffixes);
        expect('property' in piece).toBe(false);
        expect(readsBack(piece)).not.toContain('"property"');
        if (naturalAffixes.length < 2) continue;
        const legendary = make('rig2', { quality, naturalAffixes, property: { id: 'mender' } }, ordinal++);
        expect(legendary.property).toEqual({ id: 'mender' });
        expect(legendary.naturalAffixes).toEqual(naturalAffixes);
        expect(readsBack(legendary)).toContain('"property":{"id":"mender"}');
      }
    }
    const fullest = make('rig2', {
      quality: 1,
      naturalAffixes: [row('yield', 0, { source: 'forge', tier: 14 }), row('contact', 1, { source: 'spoils', tier: 0 })],
      property: { id: 'motherlode' },
    }, 99);
    const held = grantGear(createGearInventory(4), 0, fullest);
    if (held.status !== 'committed') throw new Error(`the piece was not taken: ${held.status}`);
    expect(decodeGearInventory(encodeGearInventory(held.state)).entries[0]!.instance).toEqual(fullest);
  });

  it('every stored modifier says where it came from: one with no source is refused', () => {
    const { source: _omitted, ...unsourced } = row('strike', 0);
    expect(() => make('rig1', { naturalAffixes: [unsourced as never] })).toThrow('natural affix 0 has no source');
    expect(() => make('rig1', { naturalAffixes: [row('yield', 0), { ...unsourced, affixId: 'contact', value: 4, role: 'suffix' } as never] }))
      .toThrow('natural affix 1 has no source');
    const sourced = make('rig1', { naturalAffixes: [row('strike', 0, { source: 'forge' })] });
    expect(sourced.naturalAffixes[0]!.source).toBe('forge');
    expect(readsBack(sourced)).toContain('"role":"prefix","source":"forge"}');
    expect(() => decodeGearInstance(edited(sourced, (raw) => { delete raw.naturalAffixes[0].source; })))
      .toThrow('natural affix 0 has no source');
    /* The piece the old shape allowed, one row of four keys, no longer reads. */
    expect(() => decodeGearInstance(
      '{"schema":1,"tableVersion":1,"construction":"generated","instanceId":"gear1|loot1|conquest|shape-test|world-1||||3",'
      + '"baseId":"rig1","baseName":"Mining Rig I","slot":"tool","baseTier":1,"itemLevel":1,"quality":0,"rarityTier":1,'
      + '"rarity":"uncommon","tags":["gear","tool","yield"],"baseEffects":{"yield":0.5},"implicits":["yield"],'
      + '"naturalAffixes":[{"affixId":"strike","tier":9,"value":0.06,"role":"prefix"}],"upgrade":0,"sockets":[],'
      + '"generation":{"seed":24301,"ordinal":3},"legacyAffix":null,'
      + '"provenance":{"kind":"conquest","sourceActionId":"loot1|conquest|shape-test|world-1|||"}}',
    )).toThrow('natural affix 0 has no source');
  });

  it('a modifier keeps the world tier that seeded its roll, from 0 to 14', () => {
    for (const tier of [0, 9, 10, 14]) {
      const piece = make('rig1', { naturalAffixes: [row('yield', 0, { tier })] }, tier);
      expect(piece.naturalAffixes[0]!.tier).toBe(tier);
      readsBack(piece);
    }
    const stored = make('rig1', { naturalAffixes: [row('yield', 0, { tier: 14 })] });
    for (const tier of [15, -1, 1.5, '14', null, [14], true]) {
      expect(() => make('rig1', { naturalAffixes: [row('yield', 0, { tier })] }), String(tier)).toThrow('0 through 14');
      expect(() => decodeGearInstance(edited(stored, (raw) => { raw.naturalAffixes[0].tier = tier; })), String(tier))
        .toThrow('0 through 14');
    }
  });

  it('a piece never holds a third modifier', () => {
    const three = [row('yield', 0), row('contact', 1), row('heal', 1)];
    expect(() => make('rig1', { naturalAffixes: three })).toThrow('at most two modifiers');
    const two = make('rig1', { naturalAffixes: pair('yield', 'contact') });
    expect(() => decodeGearInstance(edited(two, (raw) => { raw.naturalAffixes.push(row('heal', 1)); })))
      .toThrow('at most two modifiers');
  });

  it('a piece never holds two modifiers of one family', () => {
    const shared: readonly (readonly [Key, Key])[] = [
      ['yield', 'strike'], ['strike', 'yield'], ['scut', 'land'], ['scut', 'heal'], ['land', 'heal'],
      ['yield', 'yield'], ['contact', 'contact'],
    ];
    for (const [first, second] of shared) {
      expect(() => make('rig1', { naturalAffixes: pair(first, second) }), `${first}+${second}`).toThrow('one family');
    }
    const apart: readonly (readonly [Key, Key])[] = [
      ['yield', 'scut'], ['yield', 'contact'], ['strike', 'heal'], ['land', 'contact'], ['contact', 'strike'],
    ];
    for (const [index, [first, second]] of apart.entries()) {
      readsBack(make('rig1', { naturalAffixes: pair(first, second) }, index));
    }
    const stored = make('rig1', { naturalAffixes: pair('yield', 'contact') });
    expect(() => decodeGearInstance(edited(stored, (raw) => { raw.naturalAffixes[1] = row('strike', 1); })))
      .toThrow('one family');
  });

  it('the family rule and the limit of two count a forged or migrated modifier too', () => {
    const forgedYield = forgedYieldMeteor();
    const forged = (changes: Partial<GearGenerationPlan>) => (
      createGearInstance(forgedYield.source, 0, { ...forgedYield.forgedPlan, ...changes })
    );
    expect(() => forged({ naturalAffixes: [row('strike', 0)] })).toThrow('one family');
    expect(() => forged({ naturalAffixes: pair('contact', 'heal') })).toThrow('at most two modifiers');
    expect(() => forged({ property: { id: 'envoy' } })).toThrow('needs two modifiers');
    const rare = forged({ naturalAffixes: [row('contact', 0, { source: 'spoils' })] });
    expect(rare.craftedModifier?.affixId).toBe('exceptional-v1:yield');
    readsBack(rare);
    readsBack(forged({ naturalAffixes: [row('contact', 0)], property: { id: 'envoy' } }));

    const migrated = migratedRig();
    expect(hasValidAffixLayout(migrated)).toBe(true);
    expect(hasValidAffixLayout({ ...migrated, naturalAffixes: [row('contact', 0)] })).toBe(true);
    expect(hasValidAffixLayout({ ...migrated, naturalAffixes: [row('strike', 0)] })).toBe(false);
    expect(hasValidAffixLayout({ ...migrated, naturalAffixes: pair('contact', 'heal') })).toBe(false);
    /* The exported check holds a hand-built piece to the same limits as the codec. */
    expect(hasValidAffixLayout({ ...migrated, naturalAffixes: [row('contact', 0, { tier: 14 })] })).toBe(true);
    expect(hasValidAffixLayout({ ...migrated, naturalAffixes: [row('contact', 0, { tier: 15 })] })).toBe(false);
    expect(hasValidAffixLayout({ ...migrated, legacyAffix: { ...migrated.legacyAffix!, value: 0.36 } })).toBe(false);
    expect(hasValidAffixLayout({ ...migrated, legacyAffix: { ...migrated.legacyAffix!, forBaseId: 'rig2' } })).toBe(false);
  });

  it('a property is one of the six named, on a piece with two modifiers, whatever their families', () => {
    const named = ['motherlode', 'seam-sight', 'mender', 'sure-descent', 'forager', 'envoy'] as const;
    for (const [index, id] of named.entries()) {
      const piece = make('fieldsuit', { naturalAffixes: pair('yield', 'contact'), property: { id } }, index);
      expect(piece.property).toEqual({ id });
      readsBack(piece);
    }
    expect(() => make('fieldsuit', { property: { id: 'motherlode' } })).toThrow('needs two modifiers');
    expect(() => make('fieldsuit', { naturalAffixes: [row('yield', 0)], property: { id: 'motherlode' } }))
      .toThrow('needs two modifiers');

    const legendary = make('fieldsuit', { naturalAffixes: pair('yield', 'contact'), property: { id: 'envoy' } });
    const hostile: readonly unknown[] = [
      { id: 'scrape-proof' }, { id: 'Motherlode' }, { id: '' }, { id: ['motherlode'] }, { id: 0 }, {},
      { id: 'motherlode', value: 0.6 }, 'motherlode', ['motherlode'], null, 1, true,
    ];
    for (const property of hostile) {
      const label = JSON.stringify(property);
      expect(() => make('fieldsuit', { naturalAffixes: pair('yield', 'contact'), property: property as never }), label)
        .toThrow(/gear property/);
      expect(() => decodeGearInstance(edited(legendary, (raw) => { raw.property = property; })), label)
        .toThrow(/gear property/);
    }
    expect(() => make('fieldsuit', { naturalAffixes: pair('yield', 'contact'), property: undefined as never }))
      .toThrow(/gear property/);
  });

  it('a relic or a cosmic piece never holds two modifiers, a property or the well-made flag', () => {
    expect(UNIQUE_BASES).toHaveLength(16);
    for (const [index, base] of UNIQUE_BASES.entries()) {
      const one = make(base.id, { naturalAffixes: [row('heal', 0, { source: 'spoils' })] }, index);
      expect(one.naturalAffixes).toHaveLength(1);
      readsBack(one);
      expect(() => make(base.id, { naturalAffixes: pair('yield', 'contact') }), base.id).toThrow('at most one modifier');
      expect(() => make(base.id, { naturalAffixes: pair('yield', 'contact'), property: { id: 'forager' } }), base.id)
        .toThrow('at most one modifier');
      expect(() => make(base.id, { naturalAffixes: [row('heal', 0)], property: { id: 'forager' } }), base.id)
        .toThrow('needs two modifiers');
      expect(() => make(base.id, { quality: 1 }), base.id).toThrow('never be well made');
      expect(() => decodeGearInstance(edited(one, (raw) => { raw.quality = 1; })), base.id).toThrow('never be well made');
      expect(mayBeWellMade(base.id)).toBe(false);
    }
  });

  it('a forged relic or cosmic piece already holds its one modifier and takes no row', () => {
    for (const [index, base] of UNIQUE_BASES.entries()) {
      const source = craftSource(base.id, 300 + index);
      const forgedPlan = getFixedCraftGenerationPlan(base.id, 0xf07e + index, source);
      const forged = createGearInstance(source, 0, forgedPlan);
      expect(forged.craftedModifier, base.id).toBeDefined();
      for (const definition of LEGACY_AFFIX_DEFINITIONS) {
        const label = `${base.id}+${definition.key}`;
        expect(() => createGearInstance(source, 0, { ...forgedPlan, naturalAffixes: [row(definition.key, 0)] }), label)
          .toThrow('at most one modifier');
        expect(() => decodeGearInstance(edited(forged, (raw) => { raw.naturalAffixes = [row(definition.key, 0)]; })), label)
          .toThrow('at most one modifier');
      }
    }
  });

  it('well made is 0 or 1, and the Gravitic Anchor and the Star Compass are never well made', () => {
    const neverWellMade = CRAFTED_BASES.filter((base) => {
      try { readsBack(make(base.id, { quality: 1 })); return false; } catch { return true; }
    }).map((base) => base.id);
    expect(neverWellMade).toEqual(['anchor', 'compass']);
    expect(CRAFTED_BASES.filter((base) => !mayBeWellMade(base.id)).map((base) => base.id)).toEqual(['anchor', 'compass']);
    expect(() => make('anchor', { quality: 1 })).toThrow('never be well made');
    expect(() => mayBeWellMade('plate')).toThrow('slotted');

    const wellMade = make('rig1', { quality: 1 });
    for (const quality of [2, 4_000, -1, 0.5, '1', true, null]) {
      expect(() => make('rig1', { quality: quality as never }), String(quality)).toThrow('0 through 1');
      expect(() => decodeGearInstance(edited(wellMade, (raw) => { raw.quality = quality; })), String(quality))
        .toThrow('0 through 1');
    }
  });

  it('the two modifiers keep their order, the older first', () => {
    const yieldFirst = make('rig1', { naturalAffixes: pair('yield', 'contact') });
    const contactFirst = make('rig1', { naturalAffixes: pair('contact', 'yield') });
    const kinds = (piece: GearInstance) => piece.naturalAffixes.map((affix) => affix.affixId);
    expect(kinds(yieldFirst)).toEqual(['yield', 'contact']);
    expect(kinds(contactFirst)).toEqual(['contact', 'yield']);
    expect(kinds(decodeGearInstance(readsBack(yieldFirst)))).toEqual(['yield', 'contact']);
    expect(kinds(decodeGearInstance(readsBack(contactFirst)))).toEqual(['contact', 'yield']);
    expect(encodeGearInstance(yieldFirst)).not.toBe(encodeGearInstance(contactFirst));

    /* The role is the position and nothing else, so one state has one spelling. */
    const misplaced: readonly (readonly GearNaturalAffix[])[] = [
      [row('yield', 1)],
      [row('yield', 0), row('contact', 0)],
      [row('yield', 1), row('contact', 0)],
      [row('yield', 1), row('contact', 1)],
    ];
    for (const naturalAffixes of misplaced) {
      expect(() => make('rig1', { naturalAffixes }), JSON.stringify(naturalAffixes)).toThrow('prefix');
    }
    expect(() => decodeGearInstance(edited(yieldFirst, (raw) => { raw.naturalAffixes.reverse(); }))).toThrow('prefix');
  });

  it('the source of a modifier is spoils or forge and nothing else', () => {
    const stored = make('rig1', { naturalAffixes: [row('yield', 0, { source: 'spoils' })] });
    for (const source of ['legacy', 'Spoils', 'conquest', '', null, 0, true, ['spoils'], { kind: 'spoils' }]) {
      const label = JSON.stringify(source);
      expect(() => make('rig1', { naturalAffixes: [row('yield', 0, { source })] }), label).toThrow('source');
      expect(() => decodeGearInstance(edited(stored, (raw) => { raw.naturalAffixes[0].source = source; })), label)
        .toThrow('source');
    }
    expect(() => make('rig1', { naturalAffixes: [row('yield', 0, { source: undefined })] })).toThrow('source');
    expect(() => make('rig1', { naturalAffixes: [row('yield', 0, { age: 1 })] })).toThrow('unknown or missing');
    expect(() => decodeGearInstance(edited(stored, (raw) => { raw.naturalAffixes[0].age = 1; })))
      .toThrow('unknown or missing');
  });

  it('a migrated piece cannot be handed a property, a second modifier or the well-made flag by editing its bytes', () => {
    const migrated = migratedRig();
    expect(() => decodeGearInstance(edited(migrated, (raw) => { raw.property = { id: 'motherlode' }; })))
      .toThrow('does not match');
    expect(() => decodeGearInstance(edited(migrated, (raw) => { raw.naturalAffixes = [row('contact', 0)]; })))
      .toThrow('does not match');
    expect(() => decodeGearInstance(edited(migrated, (raw) => { raw.quality = 1; }))).toThrow('does not match');
  });
});
