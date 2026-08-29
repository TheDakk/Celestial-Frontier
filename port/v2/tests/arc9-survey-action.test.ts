import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CanonicalCF1StarAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC9_SURVEY_RECEIPT_KIND_V1,
  commitArc9SurveySettlementV1,
  deriveArc9SurveyFactV1,
  operationForArc9SurveyV1,
  prepareArc9SurveySettlementV1,
  publishArc9SurveyFieldsV1,
  type Arc9SurveyActionOutcomeV1,
} from '../apps/game/src/arc9-survey-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_080_000;
const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });

const WORLD = Object.freeze({
  living: Object.freeze({
    galaxy: HOME_GALAXY,
    star: Object.freeze({ seed: 833203739, x: -904.6798150045797, y: -391.44599365862086 }),
    planet: Object.freeze({ seed: 1778576065 }),
  }),
  lifeless: Object.freeze({
    galaxy: HOME_GALAXY,
    star: Object.freeze({ seed: 833203739, x: -904.6798150045797, y: -391.44599365862086 }),
    planet: Object.freeze({ seed: 1884604321 }),
  }),
  civilized: Object.freeze({
    galaxy: HOME_GALAXY,
    star: Object.freeze({ seed: 1608650541, x: -781.4384521013126, y: -279.9377176654525 }),
    planet: Object.freeze({ seed: 1575384169 }),
  }),
  advanced: Object.freeze({
    galaxy: HOME_GALAXY,
    star: Object.freeze({ seed: 4052891079, x: -101.48705160291865, y: -45.18662302521989 }),
    planet: Object.freeze({ seed: 3661060526 }),
  }),
  earth: Object.freeze({
    galaxy: HOME_GALAXY,
    star: Object.freeze({ seed: 424242, x: 560, y: 170 }),
    planet: Object.freeze({ seed: 133 }),
  }),
  collisionA: Object.freeze({
    galaxy: Object.freeze({ seed: 1594395733, x: -5501.81, y: -11753.64 }),
    star: Object.freeze({ seed: 4077594722, x: -271.54, y: -67.36 }),
    planet: Object.freeze({ seed: 488332735 }),
  }),
  collisionB: Object.freeze({
    galaxy: Object.freeze({ seed: 1336287406, x: -2657.91, y: -11817.01 }),
    star: Object.freeze({ seed: 1391422746, x: -646.79, y: 119.97 }),
    planet: Object.freeze({ seed: 488332735 }),
  }),
} as const);

const STAR = Object.freeze({
  sol: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 424242, x: 560, y: 170 }) }),
  binary: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 904783243, x: -884.7057853611186, y: -219.026545856148 }) }),
  BH: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 4278635935, x: -686.1230598092079, y: -733.0088191400282 }) }),
  NS: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 729068929, x: -736.7237938377075, y: 61.177555879577994 }) }),
  MAG: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 2563295997, x: -718.0755883874372, y: -258.9377444498241 }) }),
  WD: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 1052211025, x: -687.3863019808196, y: -418.28537888545543 }) }),
  RG: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 1426111096, x: -768.9087665411644, y: -95.77863371931016 }) }),
  SG: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 563950025, x: -338.65479613188654, y: -195.42429688666016 }) }),
  PROTO: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 412604657, x: -715.1403196742758, y: -157.66362113971263 }) }),
  BD: Object.freeze({ galaxy: HOME_GALAXY, star: Object.freeze({ seed: 406337352, x: -864.4042974715121, y: -349.37369136465713 }) }),
} as const);

beforeAll(() => installCaptureHooks());

const WORLD_ADDRESSES = new Map<keyof typeof WORLD, CanonicalCF1WorldAddress>();
const STAR_ADDRESSES = new Map<keyof typeof STAR, CanonicalCF1StarAddress>();

function world(name: keyof typeof WORLD): CanonicalCF1WorldAddress {
  const cached = WORLD_ADDRESSES.get(name);
  if (cached) return cached;
  const result = resolveCF1WorldAddress(WORLD[name]);
  if (!result.ok) throw new Error(`Survey world fixture ${name} failed: ${result.reason}`);
  WORLD_ADDRESSES.set(name, result.address);
  return result.address;
}

function star(name: keyof typeof STAR): CanonicalCF1StarAddress {
  const cached = STAR_ADDRESSES.get(name);
  if (cached) return cached;
  const result = resolveCF1StarAddress(STAR[name]);
  if (!result.ok) throw new Error(`Survey star fixture ${name} failed: ${result.reason}`);
  STAR_ADDRESSES.set(name, result.address);
  return result.address;
}

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`Arc 9 Survey base save failed: ${imported.reason}`);
  return imported.state;
}

async function fixture(
  sourceState: SaveStateV2 = baseState(),
  options: Readonly<{ failStorage?: boolean }> = {},
) {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xA9000005).state(),
  );
  const base = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: sourceState, extensions: f4.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Arc 9 Survey fixture was ${migration.kind}`);
  await base.apply(initial.operations);
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptCas++;
        if (options.failStorage === true) throw new Error('forced Arc 9 Survey storage failure');
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions: f4.extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'arc9-survey-tab',
    token: 'arc9-survey-document',
    leaseTtlMs: 1_000_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Arc 9 Survey lease was ${heartbeat.kind}`);
  return {
    backend,
    repository,
    runtime,
    state: initial.canonicalState,
    receiptCas: () => receiptCas,
  };
}

describe('Arc 9 canonical Survey fact and settlement preparation', () => {
  it('regenerates life/civilization and keeps Advanced as one atomic civ + spacefar product', () => {
    const state = baseState();
    state.stats.surveys = 99;
    const before = JSON.stringify(state);
    expect(deriveArc9SurveyFactV1(world('earth'))).toMatchObject({
      target: 'world', planetSeed: 133, planetOrdinal: 2, planetType: 'terran',
      biosphereKey: 'earth', living: true, civilization: 'home',
      eventAchievementIds: [],
    });
    expect(deriveArc9SurveyFactV1(world('civilized'))).toMatchObject({
      target: 'world', planetType: 'terran', biosphereKey: 'complex', living: true,
      civilization: 'civilized', civilizationEra: 'bronze', eventAchievementIds: ['civ'],
    });
    const advanced = prepareArc9SurveySettlementV1(state, world('advanced'));
    expect(advanced).toMatchObject({
      kind: 'ready',
      facts: {
        target: 'world', planetType: 'terran', biosphereKey: 'complex', living: true,
        civilization: 'advanced', civilizationEra: 'postsingular',
        eventAchievementIds: ['civ', 'spacefar'],
      },
      source: { surveys: 99, surveyedSet: [], unlocked: [] },
      successor: {
        surveys: 1, ptypesSeen: ['terran'],
        unlocked: ['civ', 'spacefar'],
      },
      addedEventAchievementIds: ['civ', 'spacefar'],
    });
    if (advanced.kind === 'ready') {
      expect(advanced.successor.surveyedSet).toEqual([world('advanced').key]);
      expect(prepareArc9ProgressionRefreshV1(advanced.successorState).kind).toBe('current');
    }
    expect(JSON.stringify(state)).toBe(before);
  });

  it('counts only living worlds, but every proven world type, using the full key rather than a leaf seed', () => {
    const state = baseState();
    const livingAddress = world('living');
    state.surveyedSet = [livingAddress.planet.seed as unknown as string];
    state.stats.surveys = 1;
    const living = prepareArc9SurveySettlementV1(state, livingAddress);
    expect(living).toMatchObject({
      kind: 'ready',
      facts: { target: 'world', living: true, biosphereKey: 'microbial' },
      successor: { surveys: 2, ptypesSeen: ['desert'] },
    });
    if (living.kind === 'ready') {
      expect(living.successor.surveyedSet).toEqual([
        livingAddress.planet.seed,
        livingAddress.key,
      ]);
    }
    const lifeless = prepareArc9SurveySettlementV1(baseState(), world('lifeless'));
    expect(lifeless).toMatchObject({
      kind: 'ready',
      facts: { target: 'world', living: false, biosphereKey: 'none', planetType: 'gas' },
      successor: { surveys: 0, surveyedSet: [], ptypesSeen: ['gas'] },
    });

    const collisionA = deriveArc9SurveyFactV1(world('collisionA'));
    const collisionB = deriveArc9SurveyFactV1(world('collisionB'));
    expect(collisionA).toMatchObject({ target: 'world', planetSeed: 488332735 });
    expect(collisionB).toMatchObject({ target: 'world', planetSeed: 488332735 });
    expect(collisionA.addressKey).not.toBe(collisionB.addressKey);
    const wrongParent = {
      ...world('collisionA'),
      galaxy: world('collisionB').galaxy,
    } as CanonicalCF1WorldAddress;
    expect(prepareArc9SurveySettlementV1(baseState(), wrongParent)).toEqual({
      kind: 'protected', reason: 'source-unproven',
    });
  });

  it('regenerates exact Sol, binary, and every legacy exotic star owner without caller claims', () => {
    expect(deriveArc9SurveyFactV1(star('sol'))).toMatchObject({
      target: 'star', starKind: 'G', exactSol: true, binary: false,
      eventAchievementIds: ['sol'],
    });
    expect(deriveArc9SurveyFactV1(star('binary'))).toMatchObject({
      target: 'star', starKind: 'A', exactSol: false, binary: true,
      eventAchievementIds: ['binary'],
    });
    const expected = {
      BH: 'seebh', NS: 'seens', MAG: 'seemag', WD: 'seewd',
      RG: 'seerg', SG: 'seesg', PROTO: 'seeproto', BD: 'seebd',
    } as const;
    for (const [kind, achievementId] of Object.entries(expected) as Array<[
      keyof typeof expected, (typeof expected)[keyof typeof expected],
    ]>) {
      expect(deriveArc9SurveyFactV1(star(kind))).toMatchObject({
        target: 'star', starKind: kind, exactSol: false, binary: false,
        eventAchievementIds: [achievementId],
      });
    }
    const forgedSol = {
      ...star('binary'),
      star: star('sol').star,
    } as CanonicalCF1StarAddress;
    expect(prepareArc9SurveySettlementV1(baseState(), forgedSol)).toEqual({
      kind: 'protected', reason: 'source-unproven',
    });
  });

  it('fails closed on carrier and all-achievement capacity before calling a writer', async () => {
    let commits = 0;
    const runtime = { async commitAction() { commits++; return { kind: 'lease-unavailable' as const }; } };
    const surveyed = baseState();
    surveyed.surveyedSet = Array.from({ length: 60_000 }, (_, index) => `legacy:${index}`);
    surveyed.stats.surveys = 60_000;
    await expect(commitArc9SurveySettlementV1({
      runtime, state: surveyed, address: world('living'), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:survey-ledger-capacity', transaction: null,
    });

    const ptypes = baseState();
    ptypes.ptypesSeen = Array.from({ length: 200 }, (_, index) => `compat-${index}`);
    await expect(commitArc9SurveySettlementV1({
      runtime, state: ptypes, address: world('living'), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:world-type-carrier-capacity', transaction: null,
    });

    const starKinds = baseState();
    starKinds.starKindsSeen = Array.from({ length: 200 }, (_, index) => `compat-${index}`);
    await expect(commitArc9SurveySettlementV1({
      runtime, state: starKinds, address: star('sol'), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:star-kind-carrier-capacity', transaction: null,
    });

    const achievements = baseState();
    achievements.unlocked = Array.from({ length: 145 }, (_, index) => `compat:${index}`);
    await expect(commitArc9SurveySettlementV1({
      runtime, state: achievements, address: world('advanced'), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:achievement:achievement-capacity', transaction: null,
    });

    const duplicate = baseState();
    duplicate.ptypesSeen = ['terran', 'terran'];
    await expect(commitArc9SurveySettlementV1({
      runtime, state: duplicate, address: world('advanced'), codecNow: NOW,
    })).resolves.toMatchObject({
      kind: 'refused', detail: 'preflight:world-type-carrier-shape', transaction: null,
    });
    expect(commits).toBe(0);
  });

  it('rejects forged input objects before derivation or mutation', async () => {
    let commits = 0;
    const runtime = { async commitAction() { commits++; return { kind: 'lease-unavailable' as const }; } };
    await expect(commitArc9SurveySettlementV1({
      runtime,
      state: baseState(),
      address: { ...world('advanced') } as CanonicalCF1WorldAddress,
      codecNow: NOW,
    })).resolves.toEqual({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'input:invalid-or-unregistered', transaction: null,
    });
    expect(commits).toBe(0);
  });
});

describe('Arc 9 durable Survey settlement', () => {
  it('commits Advanced in one receipt/CAS, publishes exact fields, and becomes current', async () => {
    const test = await fixture();
    let commitCalls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof test.runtime.commitAction>[0]) {
        commitCalls++;
        return test.runtime.commitAction(input);
      },
    };
    const callerBefore = JSON.stringify(test.state);
    const outcome = await commitArc9SurveySettlementV1({
      runtime, state: test.state, address: world('advanced'), codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'committed', durability: 'committed', convergence: 'none',
      facts: { target: 'world', civilization: 'advanced', eventAchievementIds: ['civ', 'spacefar'] },
      addedEventAchievementIds: ['civ', 'spacefar'],
      successor: { surveys: 1, ptypesSeen: ['terran'], unlocked: ['civ', 'spacefar'] },
      transaction: {
        revision: 1,
        plan: { operation: operationForArc9SurveyV1(world('advanced')), receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC9_SURVEY_RECEIPT_KIND_V1 },
      },
    });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    expect(JSON.stringify(test.state)).toBe(callerBefore);
    if (outcome.kind !== 'committed') return;
    expect(await test.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
    const reloaded = await readSaveV5(test.backend, REGISTRY, NOW);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind === 'loaded') {
      expect(reloaded.state.surveyedSet).toEqual([world('advanced').key]);
      expect(reloaded.state.stats.surveys).toBe(1);
      expect(reloaded.state.unlocked).toEqual(outcome.successor.unlocked);
    }

    const live = baseState();
    const unrelatedStats = live.stats.crafts;
    publishArc9SurveyFieldsV1(live, outcome);
    expect(live.surveyedSet).toEqual([world('advanced').key]);
    expect(live.stats).toMatchObject({ surveys: 1, crafts: unrelatedStats });
    expect(live.unlocked).toEqual(outcome.successor.unlocked);
    const wrongParent = baseState();
    wrongParent.ptypesSeen = ['gas'];
    expect(() => publishArc9SurveyFieldsV1(wrongParent, outcome))
      .toThrow(/exact live parent/u);

    const second = await commitArc9SurveySettlementV1({
      runtime, state: outcome.transaction.state, address: world('advanced'), codecNow: NOW,
    });
    expect(second).toMatchObject({ kind: 'current', durability: 'none', transaction: null });
    expect(commitCalls).toBe(1);
    expect(test.receiptCas()).toBe(1);
    await test.runtime.release();
  });

  it('lands all ten stellar owners from canonical facts and atomically closes Stellar Census', async () => {
    const test = await fixture();
    let state = test.state;
    const targets: Array<keyof typeof STAR> = [
      'sol', 'binary', 'BH', 'NS', 'MAG', 'WD', 'RG', 'SG', 'PROTO', 'BD',
    ];
    for (const target of targets) {
      const outcome = await commitArc9SurveySettlementV1({
        runtime: test.runtime, state, address: star(target), codecNow: NOW,
      });
      expect(outcome.kind).toBe('committed');
      if (outcome.kind !== 'committed') return;
      state = outcome.transaction.state;
    }
    expect(state.starKindsSeen).toEqual(['G', 'A', 'BH', 'NS', 'MAG', 'WD', 'RG', 'SG', 'PROTO', 'BD']);
    expect(state.unlocked).toEqual(expect.arrayContaining([
      'sol', 'binary', 'seebh', 'seens', 'seemag', 'seewd',
      'seerg', 'seesg', 'seeproto', 'seebd', 'stellarset',
    ]));
    expect(prepareArc9ProgressionRefreshV1(state).kind).toBe('current');
    expect(test.receiptCas()).toBe(targets.length);
    expect(await test.repository.readReceipt(targets.length)).toBeUndefined();
    await test.runtime.release();
  });

  it('contains stale and storage failures once with no receipt, retry, or caller mutation', async () => {
    const stale = await fixture();
    await stale.repository.mutate({
      expectedRevision: 0,
      writes: [{ store: 'player', key: 'survey-race-winner', value: 'other-tab' }],
    });
    const staleBefore = JSON.stringify(stale.state);
    const staleOutcome = await commitArc9SurveySettlementV1({
      runtime: stale.runtime, state: stale.state, address: world('advanced'), codecNow: NOW,
    });
    expect(staleOutcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:stale',
      transaction: { kind: 'stale', expectedRevision: 0, actualRevision: 1 },
    });
    expect(stale.receiptCas()).toBe(0);
    expect(await stale.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(stale.state)).toBe(staleBefore);
    await stale.runtime.release();

    const storage = await fixture(baseState(), { failStorage: true });
    let calls = 0;
    const runtime = {
      commitAction(input: Parameters<typeof storage.runtime.commitAction>[0]) {
        calls++;
        return storage.runtime.commitAction(input);
      },
    };
    const storageBefore = JSON.stringify(storage.state);
    const storageOutcome = await commitArc9SurveySettlementV1({
      runtime, state: storage.state, address: star('sol'), codecNow: NOW,
    });
    expect(storageOutcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'read-only-reload',
      detail: 'transaction:forced Arc 9 Survey storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(calls).toBe(1);
    expect(storage.receiptCas()).toBe(1);
    expect(await storage.repository.readReceipt(0)).toBeUndefined();
    expect(JSON.stringify(storage.state)).toBe(storageBefore);
    await storage.runtime.release();
  });

  it('turns missing or altered postcommit evidence into convergence without publishing', async () => {
    const missing = await fixture();
    const missingRuntime = {
      commitAction(input: Parameters<typeof missing.runtime.commitAction>[0]) {
        return missing.runtime.commitAction({
          ...input,
          derive: ({ draft }) => Object.freeze({ state: draft, witness: 'missing-survey-evidence' }),
        });
      },
    };
    const missingOutcome = await commitArc9SurveySettlementV1({
      runtime: missingRuntime, state: missing.state, address: star('sol'), codecNow: NOW,
    });
    expect(missingOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: 'committed-survey-evidence-missing',
    });
    await missing.runtime.release();

    const altered = await fixture();
    const alteredRuntime = {
      async commitAction(input: Parameters<typeof altered.runtime.commitAction>[0]) {
        const result = await altered.runtime.commitAction(input);
        if (result.kind !== 'committed') return result;
        return Object.freeze({
          ...result,
          state: { ...result.state, starKindsSeen: [] },
        }) as Extract<Arc9SurveyActionOutcomeV1, { kind: 'committed' }>['transaction'];
      },
    };
    const alteredOutcome = await commitArc9SurveySettlementV1({
      runtime: alteredRuntime, state: altered.state, address: star('sol'), codecNow: NOW,
    });
    expect(alteredOutcome).toMatchObject({
      kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
      detail: 'committed-survey-fixed-point-mismatch',
    });
    await altered.runtime.release();
  });
});
