import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  EXCEPTIONAL_CRAFT_OWNER_ID_V1,
  LEGACY_AFFIX_DEFINITIONS,
  SLOTTED_GEAR_BASES_V1,
  createGearInstance,
  decodeGearInstance,
  encodeGearInstance,
  getFixedCraftGenerationPlan,
  makeGearSourceActionId,
  migrateLegacyGear,
  type GearGenerationPlan,
  type GearInstance,
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

const digest = (pieces: readonly GearInstance[]) => {
  const text = pieces.map(encodeGearInstance).join('\n');
  return { pieces: pieces.length, length: text.length, sha256: createHash('sha256').update(text).digest('hex') };
};

/** Every kind of piece the game could store before the shape gained a
 * property and a source: built, forged with the painted port's modifier,
 * holding one or two unsourced modifiers, and migrated from a legacy save. */
function piecesOfTheOldShape(): readonly GearInstance[] {
  const built = SLOTTED_GEAR_BASES_V1.map((base, index) => createGearInstance(
    craftSource(base.id, index), 0, getFixedCraftGenerationPlan(base.id, 0x5eed + index),
  ));
  const forged = SLOTTED_GEAR_BASES_V1.map((base, index) => {
    const source = craftSource(base.id, 100 + index);
    return createGearInstance(source, 0, getFixedCraftGenerationPlan(base.id, 0xf07e + index, source));
  });
  const oneModifier = LEGACY_AFFIX_DEFINITIONS.flatMap((definition, index) => [0, 9].map((tier) => createGearInstance(
    fieldSource, index * 2 + (tier === 0 ? 0 : 1), plan('rig1', {
      naturalAffixes: [{ affixId: definition.key, tier, value: definition.max, role: 'prefix' }],
    }),
  )));
  const twoModifiers = createGearInstance(fieldSource, 20, plan('fieldsuit', {
    naturalAffixes: [
      { affixId: 'yield', tier: 3, value: 0.21, role: 'prefix' },
      { affixId: 'contact', tier: 5, value: 9, role: 'suffix' },
    ],
  }));
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
  return [...built, ...forged, ...oneModifier, twoModifiers, ...migrated];
}

describe('@cf/domain-loot: the stored shape of a piece', () => {
  it('a piece made before this change still reads byte for byte', () => {
    const pieces = piecesOfTheOldShape();
    expect(digest(pieces)).toEqual({
      pieces: 140, length: 88_845, sha256: '1220f43d91a9f301c4e452b5595c1057e0cdd33a4a006e54de2812e4357e1644',
    });
    for (const piece of pieces) {
      const bytes = encodeGearInstance(piece);
      expect(encodeGearInstance(decodeGearInstance(bytes))).toBe(bytes);
    }
    expect(encodeGearInstance(createGearInstance(fieldSource, 3, plan('rig1', {
      naturalAffixes: [{ affixId: 'strike', tier: 9, value: 0.06, role: 'prefix' }],
    })))).toBe(
      '{"schema":1,"tableVersion":1,"construction":"generated","instanceId":"gear1|loot1|conquest|shape-test|world-1||||3",'
      + '"baseId":"rig1","baseName":"Mining Rig I","slot":"tool","baseTier":1,"itemLevel":1,"quality":0,"rarityTier":1,'
      + '"rarity":"uncommon","tags":["gear","tool","yield"],"baseEffects":{"yield":0.5},"implicits":["yield"],'
      + '"naturalAffixes":[{"affixId":"strike","tier":9,"value":0.06,"role":"prefix"}],"upgrade":0,"sockets":[],'
      + '"generation":{"seed":24301,"ordinal":3},"legacyAffix":null,'
      + '"provenance":{"kind":"conquest","sourceActionId":"loot1|conquest|shape-test|world-1|||"}}',
    );
  });
});
