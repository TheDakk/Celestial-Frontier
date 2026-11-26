// Ported from SOURCE tests/starter-charters.test.ts:177-194 (module SOURCE apps/game/src/starter-charter-action.ts):
// a deed's own transaction carries the Charter progress, its reward writes and one composed witness.
import { describe, expect, it } from 'vitest';
import {
  applyV5ExtensionWrites,
  prepareArc2LootLegacyMigration,
  readArc2Loot,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import { stageStarterCharterActionV1 } from '../src/guidance';

function state(): SaveStateV2 {
  return {
    EPOCH_BASE: 0, essence: 10, explorerName: 'Dakk', lastAnomKey: null,
    stats: { essenceEarned: 20, bestRank: 0 }, pstats: {}, hp: 10, HP_MAX: 10,
    customNames: [], conquered: [], cargo: [], cgx: [], items: [], equip: {}, equipAff: {},
    pinnedRecipe: null, cargoTab: 'mat', seenSp: [], journal: [], mined: [], mineX: [], skimX: [],
    bioX: [], techOwned: [], claimedSets: [], ascCh: 0, ascProg: {}, nameHue: -1,
    savedView: null, fsMode: '', toneMode: '', fontMode: '', sndOn: true, fxOn: true,
    chartsOn: true, shakeOn: true, salvageConfirm: true, notifOn: true, tipsOn: true,
    sfxVol: 1, glassTint: 0, motionMode: 0, cardExpand: 0, notifications: [],
    surveyedSet: [], galSeen: [], surfSeen: [133], xpFirsts: [], sysSeen: [], starKindsSeen: [],
    ptypesSeen: [], eventKeysSeen: [], evAnnounced: [], unlocked: [], landed: [], contacted: [],
    waveOffs: [], primeFill: {}, frontierUnlocked: false, frontierEnding: null, seenGuide: false,
    tutDone: true, rnSeen: '', tutSnapPending: null, scoutId: null, chWeek: -1, chProg: {},
    chacc: [], chDone: [], homeId: null, voiceOn: true, combatSfxOn: true, logMap: [], codex: [],
  };
}

const EXTENSIONS = {} as V5Extensions;

// SOURCE tests/starter-charters.test.ts:82-96
function world(galaxy: object, star: object, planetSeed: number): CanonicalCF1WorldAddress {
  const address = resolveCF1WorldAddress({ galaxy, star, planet: { seed: planetSeed } });
  if (!address.ok) throw new Error(`starter Charter world fixture failed: ${address.reason}`);
  return address.address;
}
const solWorld = (planetSeed: number): CanonicalCF1WorldAddress =>
  world({ seed: 999, x: 90, y: -60 }, { seed: 424242, x: 560, y: 170 }, planetSeed);
const foreignWorld = (planetSeed: number): CanonicalCF1WorldAddress => world(
  { seed: 3_959_248_028, x: -6_974_362.37248769, y: 4_279_128.574915975 },
  { seed: 1_420_541_153, x: 100.5842142929323, y: -1_171.697432242334 }, planetSeed,
);

describe('the Starter Charter join of a deed', () => {
  it('keeps generic Charter witness composition JSON-only and duplicate-key protected', () => {
    for (const predecessorWitness of [
      'opaque-witness',
      JSON.stringify({ starterCharter: { forged: true } }),
    ]) {
      const draft = state();
      draft.chacc = ['st-land'];
      const staged = stageStarterCharterActionV1({
        draft,
        extensions: EXTENSIONS,
        predecessorWrites: Object.freeze([]),
        predecessorWitness,
        event: { kind: 'landfall', address: foreignWorld(133) },
        receiptOrdinal: 2,
      });
      expect(staged.kind).toBe('refused');
    }
  });

  it('binds the Charter fact into the deed witness, and leaves the witness alone when no Charter moved', () => {
    const draft = state();
    draft.chacc = ['st-land'];
    const landing = foreignWorld(133);
    const staged = stageStarterCharterActionV1({
      draft, extensions: EXTENSIONS, predecessorWrites: Object.freeze([]),
      predecessorWitness: JSON.stringify({ deed: 'landing' }),
      event: { kind: 'landfall', address: landing }, receiptOrdinal: 2,
    });
    expect(staged.kind).toBe('ready');
    if (staged.kind !== 'ready') return;
    expect(draft).toMatchObject({ chDone: ['st-land'], chacc: [], essence: 20 });
    expect(staged.fact).toMatchObject({
      changed: true, event: { kind: 'landfall', worldKey: landing.key, planetSeed: 133 },
      progressIds: ['st-land'], completions: [{ id: 'st-land', stardust: 10, gearId: null, alreadyProven: false }],
    });
    expect(JSON.parse(staged.witness)).toEqual({ deed: 'landing', starterCharter: JSON.parse(JSON.stringify(staged.fact)) });
    expect(staged.extensionWrites).toEqual([]);

    const idle = state();
    const quiet = stageStarterCharterActionV1({
      draft: idle, extensions: EXTENSIONS, predecessorWrites: Object.freeze([]), predecessorWitness: 'opaque-witness',
      event: { kind: 'scout-set', scoutId: 's1' }, receiptOrdinal: 3,
    });
    expect(quiet).toMatchObject({ kind: 'ready', witness: 'opaque-witness', fact: { changed: false, event: { kind: 'scout-set', scoutId: 's1' } } });
    expect(idle).toEqual(state());
  });

  it('a gear reward replaces the deed\u2019s own write of the same carrier instead of adding a second owner', () => {
    const draft = state();
    draft.chacc = ['st-mercury'];
    const migrated = prepareArc2LootLegacyMigration({
      extensions: {}, legacy: { items: draft.items, equip: draft.equip, equipAff: draft.equipAff }, capacity: 12,
    });
    if (migrated.kind !== 'prepared') throw new Error(`starter Charter loot fixture was ${migrated.kind}`);
    // The deed's own writes are the migration's: the Charter's gear lands on top of them, in the same carrier.
    const staged = stageStarterCharterActionV1({
      draft, extensions: EXTENSIONS, predecessorWrites: [migrated.write], predecessorWitness: '{}',
      event: { kind: 'landfall', address: solWorld(131) }, receiptOrdinal: 4,
    });
    expect(staged).toMatchObject({ kind: 'ready' });
    if (staged.kind !== 'ready') return;
    const identities = staged.extensionWrites.map(({ segment, namespace }) => `${segment}/${namespace}`);
    expect(new Set(identities).size).toBe(identities.length);
    expect(identities).toEqual([`${migrated.write.segment}/${migrated.write.namespace}`]);
    expect(staged.extensions).toEqual(applyV5ExtensionWrites(EXTENSIONS, staged.extensionWrites).extensions);
    const loot = readArc2Loot(staged.extensions);
    expect(loot.kind === 'loaded' && loot.state.kind === 'inventory' && loot.state.inventory.entries.map(({ instance }) => instance.baseId))
      .toEqual(['headlamp']); // SOURCE tests/starter-charters.test.ts:386-392
    expect(draft).toMatchObject({ chDone: ['st-mercury'], essence: 20, items: [['headlamp', 1]], equip: { helmet: 'headlamp' } });
  });
});
