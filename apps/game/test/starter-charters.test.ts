// The Starter Charters follow the legacy game (LEGACY: celestial-frontier.html of the live branch, version 1.8.9);
// each rule cites its line there. The board comes back as data: the screen builds the elements. The accept that
// commits through the runtime is not built yet.
import { describe, expect, it } from 'vitest';
import {
  WEEKLY_CHARTER_CYCLE_ACTIVE_MS,
  applyV5ExtensionWrites,
  createEmptyWorldIdentityState,
  encodeWorldIdentityExtensionWrites,
  prepareArc2LootLegacyMigration,
  readArc2Loot,
  recordCanonicalWorldLanding,
  weeklyCharterSlateV1,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  STARTER_CHARTER_CAP_V1,
  STARTER_CHARTER_DEFINITIONS_V1,
  projectStarterCharterBoardV1,
  stageStarterCharterAcceptV1,
  stageStarterCharterEventV1,
} from '../src/guidance';

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

function exactAddress(candidate: unknown): CanonicalCF1WorldAddress {
  const address = resolveCF1WorldAddress(candidate);
  if (!address.ok) throw new Error(`starter Charter world fixture failed: ${address.reason}`);
  return address.address;
}

function solWorld(planetSeed: number): CanonicalCF1WorldAddress {
  return exactAddress({
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424242, x: 560, y: 170 },
    planet: { seed: planetSeed },
  });
}

function foreignWorld(planetSeed: number): CanonicalCF1WorldAddress {
  return exactAddress({
    galaxy: { seed: 3_959_248_028, x: -6_974_362.37248769, y: 4_279_128.574915975 },
    star: { seed: 1_420_541_153, x: 100.5842142929323, y: -1_171.697432242334 },
    planet: { seed: planetSeed },
  });
}

function landedIdentityExtensions(candidate: unknown): V5Extensions {
  const address = exactAddress(candidate);
  const landed = recordCanonicalWorldLanding(
    createEmptyWorldIdentityState(), address, {},
  );
  if (landed.capacityProtected) throw new Error('starter Charter world fixture exceeded capacity');
  return applyV5ExtensionWrites({}, encodeWorldIdentityExtensionWrites(landed.state)).extensions;
}

/** Extensions that hold the gear inventory of `save`, as a migrated save holds it (SOURCE tests/starter-charters.test.ts:111-116). */
function lootExtensions(save: SaveStateV2): V5Extensions {
  const loot = prepareArc2LootLegacyMigration({
    extensions: {}, legacy: { items: save.items, equip: save.equip, equipAff: save.equipAff }, capacity: 12,
  });
  if (loot.kind !== 'prepared') throw new Error(`starter Charter loot fixture was ${loot.kind}`);
  return loot.extensions;
}

describe('starter Charters', () => {
  it('the ten ids, events and payments equal the table', () => {
    // LEGACY celestial-frontier.html:24720-24739 (st-conq listens for 'conquest', 24727; the combat settlement completes it).
    expect(STARTER_CHARTER_DEFINITIONS_V1.map(({ id, chain, event, count, stardust, gearId }) => [id, chain, event, count, stardust, gearId])).toEqual([
      ['st-land', 'trades', 'landfall', 1, 10, null],
      ['st-mine', 'trades', 'mined', 1, 15, null],
      ['st-scan', 'trades', 'bioscan', 1, 15, 'earpiece'],
      ['st-scout', 'trades', 'scout-set', 1, 15, null],
      ['st-conq', 'trades', 'conquest', 1, 25, null],
      ['st-mercury', 'tour', 'landfall', 1, 10, 'headlamp'],
      ['st-mars', 'tour', 'landfall', 1, 10, 'magboots'],
      ['st-giants', 'tour', 'mined', 5, 15, 'meteor'],
      ['st-ice', 'tour', 'landfall', 1, 10, 'fieldlegs'],
      ['st-comp', 'tour', 'crafted', 1, 15, null],
    ]);
    expect(STARTER_CHARTER_CAP_V1).toBe(3); // LEGACY celestial-frontier.html:24752
  });

  it('each Charter pays its table Stardust once when its deed completes it', () => {
    const land = state();
    land.chacc = ['st-land'];
    expect(stageStarterCharterEventV1({
      draft: land, extensions: EXTENSIONS, event: { kind: 'landfall', address: solWorld(134) }, receiptOrdinal: 1,
    })).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'st-land', stardust: 10, gearId: null, alreadyProven: false }] } });
    expect(land).toMatchObject({ chDone: ['st-land'], chacc: [], essence: 20, stats: { essenceEarned: 30, charters: 1 } });
    expect(stageStarterCharterEventV1({
      draft: land, extensions: EXTENSIONS, event: { kind: 'landfall', address: solWorld(134) }, receiptOrdinal: 2,
    }).kind).toBe('current');
    expect(land.essence).toBe(20);

    const craft = state();
    craft.chDone = ['st-mercury', 'st-mars', 'st-giants', 'st-ice'];
    craft.chacc = ['st-comp'];
    expect(stageStarterCharterEventV1({
      draft: craft, extensions: EXTENSIONS, event: { kind: 'crafted', baseId: 'coil', category: 'gear' }, receiptOrdinal: 3,
    }).kind).toBe('current');
    expect(stageStarterCharterEventV1({
      draft: craft, extensions: EXTENSIONS, event: { kind: 'crafted', baseId: 'coil', category: 'comp' }, receiptOrdinal: 4,
    }).kind).toBe('ready');
    expect(craft).toMatchObject({ chacc: [], essence: 25 });
    expect(craft.chDone).toContain('st-comp');
  });

  it('a Charter that pays gear grants it and wears it in the same staging', () => {
    const scan = state();
    scan.chDone = ['st-land', 'st-mine'];
    scan.chacc = ['st-scan'];
    const extensions = lootExtensions(scan);
    const staged = stageStarterCharterEventV1({
      draft: scan, extensions, event: { kind: 'bioscan', address: foreignWorld(133) }, receiptOrdinal: 6,
    });
    expect(staged).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'st-scan', stardust: 15, gearId: 'earpiece' }] } });
    expect(scan).toMatchObject({ essence: 25, items: [['earpiece', 1]] });
    expect(Object.values(scan.equip)).toEqual(['earpiece']);
    if (staged.kind !== 'ready') return;
    const loot = readArc2Loot(applyV5ExtensionWrites(extensions, staged.facts.extensionWrites).extensions);
    expect(loot.kind === 'loaded' && loot.state.kind === 'inventory' && loot.state.inventory.entries[0]?.instance)
      .toMatchObject({ baseId: 'earpiece', provenance: { kind: 'expedition' } }); // SOURCE tests/starter-charters.test.ts:391-393
  });

  it('st-conq does not complete on a landfall, nor on any other deed', () => {
    const conquest = state();
    conquest.items = [['jumpdrive', 1]];
    conquest.chDone = ['st-land', 'st-mine', 'st-scan', 'st-scout'];
    conquest.chacc = ['st-conq'];
    const before = structuredClone(conquest);
    for (const event of [
      { kind: 'landfall', address: foreignWorld(133) }, { kind: 'landfall', address: solWorld(134) },
      { kind: 'mined', address: foreignWorld(133) }, { kind: 'bioscan', address: foreignWorld(133) },
      { kind: 'scout-set', scoutId: 's1' }, { kind: 'crafted', baseId: 'coil', category: 'comp' },
    ] as const) {
      expect(stageStarterCharterEventV1({ draft: conquest, extensions: EXTENSIONS, event, receiptOrdinal: 7 }).kind, event.kind).toBe('current');
    }
    expect(conquest).toEqual(before);
  });

  it('a fourth accept is refused and a third is taken', () => {
    const two = state();
    two.chacc = ['wk-land', 'wk-mine'];
    expect(stageStarterCharterAcceptV1({ draft: two, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 1 }).kind).toBe('ready');
    expect(two.chacc).toEqual(['wk-land', 'wk-mine', 'st-land']);
    const before = structuredClone(two);
    expect(stageStarterCharterAcceptV1({ draft: two, extensions: EXTENSIONS, id: 'st-mercury', receiptOrdinal: 2 }))
      .toEqual({ kind: 'refused', reason: 'Three charters is a full slate — see one through first.' });
    expect(two).toEqual(before);
  });

  it('st-conq cannot be accepted at stage 0 and can at stage 1', () => {
    const learned = (): SaveStateV2 => { const s = state(); s.chDone = ['st-land', 'st-mine', 'st-scan', 'st-scout']; return s; };
    const row = (s: SaveStateV2) => {
      const board = projectStarterCharterBoardV1(s);
      if (board.kind !== 'projected') throw new Error(board.reason);
      return board.board.rows.find(({ definition }) => definition.id === 'st-conq');
    };
    const stage0 = learned();
    // LEGACY celestial-frontier.html:24826-24835 and 25176-25177: the row is left off and a note stands in its place.
    expect(row(stage0)).toBeUndefined();
    const held = projectStarterCharterBoardV1(stage0);
    expect(held.kind === 'projected' && held.board.lockedNote).toEqual([
      { icon: 'ascent' }, ' The next trade awaits the stars — build the ', { icon: 'jump-drive' }, ' Jump Drive.',
    ]);
    expect(stageStarterCharterAcceptV1({ draft: stage0, extensions: EXTENSIONS, id: 'st-conq', receiptOrdinal: 1 }).kind).toBe('refused');
    expect(stage0.chacc).toEqual([]);
    const stage1 = learned();
    stage1.items = [['jumpdrive', 1]];
    expect(row(stage1)).toMatchObject({ status: 'available' });
    const open = projectStarterCharterBoardV1(stage1);
    expect(open.kind === 'projected' && open.board.lockedNote).toBeNull();
    expect(stageStarterCharterAcceptV1({ draft: stage1, extensions: EXTENSIONS, id: 'st-conq', receiptOrdinal: 2 }).kind).toBe('ready');
    expect(stage1.chacc).toEqual(['st-conq']);
  });

  it('reveals one live link per chain, exposes st-scan only in sequence, and enforces the three-slot cap', () => {
    const fresh = projectStarterCharterBoardV1(state());
    expect(fresh.kind).toBe('projected');
    if (fresh.kind !== 'projected') return;
    expect(fresh.board.rows.map(({ definition, status }) => [definition.id, status])).toEqual([
      ['st-land', 'available'], ['st-mercury', 'available'],
    ]);
    const blocked = state();
    blocked.chDone = ['st-land', 'st-mine'];
    const scan = projectStarterCharterBoardV1(blocked);
    expect(scan.kind === 'projected' && scan.board.rows[0]).toMatchObject({
      definition: { id: 'st-scan', event: 'bioscan' }, status: 'available',
    });
    const full = state();
    full.chacc = ['wk-land', 'wk-mine', 'wk-scan'];
    const acceptance = stageStarterCharterAcceptV1({
      draft: structuredClone(full), extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 1,
    });
    expect(acceptance).toMatchObject({ kind: 'refused', reason: 'Three charters is a full slate — see one through first.' });
  });

  it('makes st-scan count from acceptance and never backfills an older Survey record', () => {
    const scannedBeforeAcceptance = state();
    scannedBeforeAcceptance.chDone = ['st-land', 'st-mine'];
    scannedBeforeAcceptance.surveyedSet = [foreignWorld(133).key];
    const accepted = stageStarterCharterAcceptV1({
      draft: scannedBeforeAcceptance,
      extensions: EXTENSIONS,
      id: 'st-scan',
      receiptOrdinal: 1,
    });
    expect(accepted.kind).toBe('ready');
    expect(scannedBeforeAcceptance).toMatchObject({
      chacc: ['st-scan'],
      chDone: ['st-land', 'st-mine'],
      chProg: {},
      essence: 10,
    });
  });

  it('accepts a live row, completes already-proven work atomically, and never counts training Earth', () => {
    const fresh = state();
    const accepted = stageStarterCharterAcceptV1({
      draft: fresh, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 1,
    });
    expect(accepted.kind).toBe('ready');
    expect(fresh.chacc).toEqual(['st-land']);
    expect(fresh.chDone).toEqual([]);
    expect(fresh.essence).toBe(10);

    const proven = state();
    proven.surfSeen.push(134);
    const completed = stageStarterCharterAcceptV1({
      draft: proven, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 2,
    });
    expect(completed.kind).toBe('ready');
    expect(proven.chDone).toEqual(['st-land']);
    expect(proven.chacc).toEqual([]);
    expect(proven.essence).toBe(20);
    expect(proven.stats).toMatchObject({ essenceEarned: 30, charters: 1 });
  });

  it('uses exact current-world identity for proven landfalls instead of leaf-only Earth identity', () => {
    const mars = landedIdentityExtensions({
      galaxy: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
      planet: { seed: 134 },
    });
    const current = state();
    const completed = stageStarterCharterAcceptV1({
      draft: current, extensions: mars, id: 'st-land', receiptOrdinal: 2,
    });
    expect(completed.kind).toBe('ready');
    expect(current).toMatchObject({ chDone: ['st-land'], chacc: [], essence: 20 });

    const foreignEarthSeed = landedIdentityExtensions({
      galaxy: { seed: 3_959_248_028, x: -6_974_362.37248769, y: 4_279_128.574915975 },
      star: { seed: 1_420_541_153, x: 100.5842142929323, y: -1_171.697432242334 },
      planet: { seed: 133 },
    });
    const aliased = state();
    const accepted = stageStarterCharterAcceptV1({
      draft: aliased, extensions: foreignEarthSeed, id: 'st-land', receiptOrdinal: 3,
    });
    expect(accepted.kind).toBe('ready');
    expect(aliased.chacc).toEqual([]);
    expect(aliased.chDone).toEqual(['st-land']);
    expect(aliased.essence).toBe(20);
  });

  it('settles matching event filters and counts giant Mine presses rather than auto loads', () => {
    const mine = state();
    mine.chDone = ['st-mercury', 'st-mars'];
    mine.chacc = ['st-giants'];
    mine.chProg = { 'st-giants': 3 };
    const offworld = stageStarterCharterEventV1({
      draft: mine, extensions: EXTENSIONS,
      event: { kind: 'mined', address: solWorld(134) }, receiptOrdinal: 3,
    });
    expect(offworld.kind).toBe('current');
    expect(mine.chProg['st-giants']).toBe(3);
    const giant = stageStarterCharterEventV1({
      draft: mine, extensions: EXTENSIONS,
      event: { kind: 'mined', address: solWorld(135) }, receiptOrdinal: 4,
    });
    expect(giant.kind).toBe('ready');
    expect(mine.chProg['st-giants']).toBe(4);
    expect(mine.chDone).toEqual(['st-mercury', 'st-mars']);
  });

  it('rejects foreign leaf-seed aliases from Sol-tour event credit', () => {
    const falseMercury = state();
    falseMercury.chacc = ['st-mercury'];
    const foreignBase = foreignWorld(133);
    const foreignMercuryLeafAlias = Object.freeze({
      ...solWorld(131),
      galaxy: foreignBase.galaxy,
      star: foreignBase.star,
    }) as CanonicalCF1WorldAddress;
    expect(stageStarterCharterEventV1({
      draft: falseMercury, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: foreignMercuryLeafAlias }, receiptOrdinal: 6,
    }).kind).toBe('current');
    expect(falseMercury).toMatchObject({ chacc: ['st-mercury'], chDone: [], essence: 10 });

    const wrongOrdinal = state();
    wrongOrdinal.chacc = ['st-mercury'];
    const mercury = solWorld(131);
    const wrongMercuryOrdinal = Object.freeze({
      ...mercury,
      planet: Object.freeze({ ...mercury.planet, ordinal: mercury.planet.ordinal + 1 }),
    }) as CanonicalCF1WorldAddress;
    expect(stageStarterCharterEventV1({
      draft: wrongOrdinal, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: wrongMercuryOrdinal }, receiptOrdinal: 7,
    }).kind).toBe('current');
    expect(wrongOrdinal).toMatchObject({ chacc: ['st-mercury'], chDone: [], essence: 10 });
  });

  it('does not let landfall counterfeit an accepted Discover Life Charter', () => {
    const landing = state();
    landing.chacc = ['st-land', 'st-scan'];
    const result = stageStarterCharterEventV1({
      draft: landing, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: solWorld(131) }, receiptOrdinal: 5,
    });
    expect(result).toMatchObject({ kind: 'ready' });
    expect(landing.chDone).toContain('st-land');
    expect(landing.chDone).not.toContain('st-scan');
    expect(landing.chacc).toContain('st-scan');
  });

  it('protects a multi-row landfall reward when its exact gear carrier is absent', () => {
    const landing = state();
    landing.chacc = ['st-land', 'st-mercury', 'st-scan'];
    const result = stageStarterCharterEventV1({
      draft: landing, extensions: EXTENSIONS,
      event: { kind: 'landfall', address: solWorld(131) }, receiptOrdinal: 5,
    });
    /* Mercury includes gear, so an absent Arc 2 carrier protects the whole
       reward instead of paying a partial Stardust/gear successor. */
    expect(result).toMatchObject({ kind: 'refused', reason: 'starter-gear:absent' });
    expect(landing.chDone).toContain('st-land');
    expect(landing.chDone).not.toContain('st-scan');
  });

  it('a completion settles the achievements and rank it proves in the same staging', () => {
    const draft = state();
    draft.chacc = ['st-land'];
    draft.stats = { ...draft.stats, essenceEarned: 495 };
    const staged = stageStarterCharterEventV1({
      draft, extensions: EXTENSIONS, event: { kind: 'landfall', address: solWorld(134) }, receiptOrdinal: 9,
    });
    expect(staged.kind).toBe('ready');
    if (staged.kind !== 'ready') return;
    expect(draft.stats.essenceEarned).toBe(505);
    expect(staged.facts.addedAchievementIds.length).toBeGreaterThan(0);
    expect(draft.unlocked).toEqual([...staged.facts.nextUnlockedIds]);
    expect(staged.facts.nextUnlockedIds).toEqual([...staged.facts.priorUnlockedIds, ...staged.facts.addedAchievementIds]);
    expect(draft.stats.bestRank).toBe(staged.facts.nextBestRankIndex);
  });

  // SOURCE tests/starter-charters.test.ts:644-653
  it('the starter event stager counts the weekly board in the SAME transaction when given its active-play snapshot, and is unchanged without one', () => {
    const cycle = [...Array(50).keys()].find((c) => weeklyCharterSlateV1(c).includes('wk-land'))!, at = WEEKLY_CHARTER_CYCLE_ACTIVE_MS * cycle + 1, id = 'wk-land' as const;
    const withSnapshot = state(); withSnapshot.chDone = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq']; withSnapshot.chWeek = cycle;
    if (id) { withSnapshot.chacc = [id]; withSnapshot.chProg = { [id]: 0 }; }
    const without = structuredClone(withSnapshot);
    const staged = stageStarterCharterEventV1({ draft: withSnapshot, extensions: EXTENSIONS, event: { kind: 'landfall', address: solWorld(134) }, receiptOrdinal: 3, activePlayMs: at });
    const plain = stageStarterCharterEventV1({ draft: without, extensions: EXTENSIONS, event: { kind: 'landfall', address: solWorld(134) }, receiptOrdinal: 3 });
    if (id) { expect(staged).toMatchObject({ kind: 'ready', facts: { weekly: { progressIds: [id] } } }); expect(withSnapshot.chProg[id]).toBe(1); }
    expect(plain.kind).toBe('current'); expect(without.chProg[id ?? 'none']).toBe(id ? 0 : undefined);
  });

  it('the ten descriptions are the legacy game\'s words', () => {
    // LEGACY celestial-frontier.html:24720-24739 (&#8217; is the apostrophe; the wrench picture before "Shipyard" at 24739 is
    // left for the screen to draw as an icon: this branch holds no emoji).
    expect(STARTER_CHARTER_DEFINITIONS_V1.map(({ description }) => description)).toEqual([
      'Land on any world — press Land on its survey card, or dive in and confirm the descent. A first footfall pays field samples.',
      'Land on a lifeless world and press Mine Deposits — the elements stock your Cargo hold for research.',
      'Land on a living world and survey its biosphere — mind the danger percentage, or send a scout. Then tame what you find.',
      'Open one of your fauna in the Compendium and press Scout — it takes the hit when a bioscan turns hostile.',
      'Press Conquer Planet on a world with fauna and pick a champion — yourself, or one of your beasts.',
      'Sol’s innermost world bakes in the glare. Stand on it — the sunward veins run rich.',
      'Mars waited a long age for boots. Land, and read the rust from the ground.',
      'Mine Jupiter or Saturn’s deep decks — 5 loads between them.',
      'Uranus or Neptune — stand at the edge of Sol’s long dark, where the ices wait.',
      'Assemble any T2 component at the Shipyard — the Jump Drive is built from these.',
    ]);
  });

  it('accepted rows stand in the order they were accepted, then the open link of each chain', () => {
    // LEGACY celestial-frontier.html:24850 ([...chacc] keeps the order of acceptance) and 25153-25175.
    const s = state();
    s.chacc = ['st-mercury', 'st-land'];
    const board = projectStarterCharterBoardV1(s);
    expect(board.kind === 'projected' && board.board.rows.map(({ definition, status }) => [definition.id, status]))
      .toEqual([['st-mercury', 'accepted'], ['st-land', 'accepted']]);
  });

  it('no row is ever held back as unavailable: every row is accepted or available', () => {
    // LEGACY celestial-frontier.html:24837-24853: the board lists only accepted and available Charters.
    for (const definition of STARTER_CHARTER_DEFINITIONS_V1) expect(Object.keys(definition)).not.toContain('availability');
    const board = projectStarterCharterBoardV1(state());
    if (board.kind !== 'projected') throw new Error(board.reason);
    for (const row of board.board.rows) expect(Object.keys(row).sort()).toEqual(['claimable', 'definition', 'progress', 'status']);
  });

  it('an available row whose deed is already done reads as a claim, and the board counts the honoured Charters', () => {
    // LEGACY celestial-frontier.html:25167-25172 (Claim) and 25179-25180 (the honoured count).
    const claims = (s: SaveStateV2) => {
      const board = projectStarterCharterBoardV1(s, EXTENSIONS);
      if (board.kind !== 'projected') throw new Error(board.reason);
      return [board.board.rows.map(({ definition, claimable }) => [definition.id, claimable]), board.board.honored];
    };
    expect(claims(state())).toEqual([[['st-land', false], ['st-mercury', false]], 0]);
    const s = state();
    s.chDone = ['st-land'];
    s.surfSeen.push(131);
    s.stats = { ...s.stats, charters: 4 };
    expect(claims(s)).toEqual([[['st-mine', false], ['st-mercury', true]], 4]);
  });

  it('the board is inert until training ends, except the graduation accept, which is never already proven', () => {
    // LEGACY celestial-frontier.html:24882-24883 (refused) and 24889-24891 (no proof from training).
    const recruit = state();
    recruit.tutDone = false;
    recruit.surfSeen.push(134);
    const before = structuredClone(recruit);
    expect(stageStarterCharterAcceptV1({ draft: recruit, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 1 }).kind).toBe('refused');
    expect(recruit).toEqual(before);
    expect(stageStarterCharterAcceptV1({ draft: recruit, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 1, graduation: true }).kind).toBe('ready');
    expect(recruit).toMatchObject({ chacc: ['st-land'], chDone: [], essence: 10 });
  });

  it('a deed during training counts for no Charter', () => {
    // LEGACY celestial-frontier.html:24908.
    const recruit = state();
    recruit.tutDone = false;
    recruit.chacc = ['st-land'];
    expect(stageStarterCharterEventV1({ draft: recruit, extensions: EXTENSIONS, event: { kind: 'landfall', address: solWorld(134) }, receiptOrdinal: 1 }).kind).toBe('current');
    expect(recruit).toMatchObject({ chacc: ['st-land'], chDone: [], essence: 10 });
  });

  it('Make planetfall has no filter: any first landing counts, Earth included', () => {
    // LEGACY celestial-frontier.html:24720 (no filt); the landfall event itself fires once per world, 13192-13200.
    const s = state();
    s.chacc = ['st-land'];
    expect(stageStarterCharterEventV1({ draft: s, extensions: EXTENSIONS, event: { kind: 'landfall', address: solWorld(133) }, receiptOrdinal: 1 }).kind).toBe('ready');
    expect(s.chDone).toEqual(['st-land']);
  });

  it('accepting a landfall Charter replays the worlds already landed on through its filter', () => {
    // LEGACY celestial-frontier.html:24896-24900.
    const mercury = state();
    mercury.landed = [131];
    expect(stageStarterCharterAcceptV1({ draft: mercury, extensions: lootExtensions(mercury), id: 'st-mercury', receiptOrdinal: 1 }))
      .toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'st-mercury', alreadyProven: true }] } });
    const mars = state();
    mars.landed = [131];
    mars.chDone = ['st-mercury'];
    expect(stageStarterCharterAcceptV1({ draft: mars, extensions: EXTENSIONS, id: 'st-mars', receiptOrdinal: 2 }))
      .toMatchObject({ kind: 'ready', facts: { completions: [] } });
    const land = state();
    land.landed = [133];
    expect(stageStarterCharterAcceptV1({ draft: land, extensions: EXTENSIONS, id: 'st-land', receiptOrdinal: 3 }))
      .toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'st-land', alreadyProven: true }] } });
  });
});
