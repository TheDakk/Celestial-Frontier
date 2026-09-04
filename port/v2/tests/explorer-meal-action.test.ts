import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  createSpecimenLotV1,
  ownershipContentId,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  type DiscoveryRecordId,
  type SpecimenLotId,
} from '@cf/domain-acquisition';
import { ARC5_EXPLORER_MEAL_RECEIPT_KIND_V1 } from '@cf/domain-acquisition/explorer-meal-internal';
import { makeGenome, speciesGrade } from '@cf/domain-genome';
import { projectEngineeringCapabilities } from '@cf/domain-loot';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  migrateLegacyEngineeringState,
} from '@cf/domain-opportunity';
import { DOMAINS, createSessionRNG } from '@cf/domain-sessionrng';
import {
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC3_ENGINEERING_NAMESPACE,
  ARC3_ENGINEERING_SEGMENT,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc3EngineeringCarrier,
  encodeArc4Ownership,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc2LootLegacyMigration,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc2EngineeringLoadout,
  readArc5OwnershipMigration,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC5_EXPLORER_MEAL_DOMAIN_V1,
  commitArc5ExplorerMealActionV1,
  projectArc5ExplorerMealActionPreviewV1,
  publishArc5ExplorerMealAchievementFields,
} from '../apps/game/src/explorer-meal-action.js';
import {
  COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
  CompendiumExplorerMealController,
  projectCompendiumExplorerMealV1,
} from '../apps/game/src/compendium-explorer-meal.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(baseline, 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');

interface TestWindow extends Window {
  readonly Element: typeof Element;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => TestDom;
};

type MainMealRecord = Parameters<typeof projectCompendiumExplorerMealV1>[0]['record'];
type MainMealRow = readonly [string, MainMealRecord];
interface ExecutableMainExplorerMeal {
  readonly controller: CompendiumExplorerMealController;
  readonly projectCurrent: (
    row: MainMealRow,
    generation: number,
  ) => ReturnType<typeof projectCompendiumExplorerMealV1> | null;
}

function exactMainSection(start: string, end: string): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main explorer meal section must be unique: ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main explorer meal section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

/** Execute the shipped Main controller, projector, coordinator, publisher and
 * presentation chain. This uses the same exact-declaration transform pattern
 * as runtime-hardening.test.ts; it is not a retyped model of Main behavior. */
function executableMainExplorerMeal(env: Record<string, unknown>): ExecutableMainExplorerMeal {
  const source = [
    exactMainSection(
      'const compendiumExplorerMealController = new CompendiumExplorerMealController({',
      '\nconst compendiumAuditionController =',
    ),
    exactMainSection(
      'function projectCurrentCompendiumExplorerMeal(',
      '\nfunction projectCurrentCompendiumBreed(',
    ),
    exactMainSection(
      'type Arc5ExplorerMealCommitOutcome =',
      '\ntype Arc5BreedCommitOutcome =',
    ),
  ].join('\n');
  const transformed = transformSync('main-explorer-meal.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    controller: compendiumExplorerMealController,
    projectCurrent: projectCurrentCompendiumExplorerMeal,
  }; }`)(env) as ExecutableMainExplorerMeal;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((settle) => { resolve = settle; });
  return { promise, resolve };
}

function baseState(lab = true): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  return {
    ...imported.state,
    hp: 40,
    HP_MAX: 100,
    pstats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 },
    techOwned: lab ? ['lab1'] : [],
  };
}

function engineering(lab = true) {
  return migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
    revision: 0,
    worlds: [],
    stars: [],
    research: lab ? ['lab1'] : [],
  }, {
    resolveWorldSeed: () => [],
    resolveStarSeed: () => [],
  });
}

function floraPoisonChance(seed: number): number {
  const tier = speciesGrade(makeGenome(seed, 'flora', 0.4)).tier;
  return Math.max(0.05, Math.min(0.6, 0.08 + tier * 0.07));
}

function floraSeedFor(highRisk: boolean): number {
  for (let seed = 0; seed < 10_000; seed++) {
    if ((floraPoisonChance(seed) > 0.4) === highRisk) return seed;
  }
  throw new Error(`no ${highRisk ? 'high' : 'ordinary'}-risk Flora seed found`);
}

function sessionSeedFor(poisonChance: number, poisoned: boolean): number {
  for (let seed = 0; seed < 10_000; seed++) {
    const draw = createSessionRNG(seed).at(DOMAINS.healOutcome, 0);
    if ((draw < poisonChance) === poisoned) return seed;
  }
  throw new Error(`no ${poisoned ? 'poison' : 'safe'} meal SessionRNG seed found`);
}

const ORDINARY_RISK_FLORA_SEED = floraSeedFor(false);
const HIGH_RISK_FLORA_SEED = floraSeedFor(true);

function ownership(floraSeed = ORDINARY_RISK_FLORA_SEED) {
  const genome = makeGenome(floraSeed, 'flora', 0.4);
  const flora = canonicalGenomeIdentityV1(genome);
  const discovery = createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', 'explorer-meal-action-flora') as DiscoveryRecordId,
    speciesId: flora.speciesId,
    legacyCodexId: 'explorer-meal-action-flora',
    legacySourceIndex: 0,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  });
  const foodLotId = ownershipContentId('specimen', 'explorer-meal-action-flora') as SpecimenLotId;
  return Object.freeze({
    foodLotId,
    poisonChance: floraPoisonChance(floraSeed),
    record: Object.freeze({
      id: 'explorer-meal-action-flora',
      name: 'Test Flora',
      g: genome,
    }),
    source: createInitialOwnershipStateV1({
      catalogSpecies: [createCatalogSpeciesV1({
        identity: flora,
        alias: null,
        firstObservationId: discovery.recordId,
      })],
      discoveries: [discovery],
      creatures: [],
      specimenLots: [createSpecimenLotV1({
        lotId: foodLotId,
        speciesId: flora.speciesId,
        kind: 'flora',
        quantity: 2,
        origin: 'legacy',
        acquisitionRecordId: discovery.recordId,
      })],
      biosphereProgress: [],
      legacyBioX: [],
      scoutCreatureId: null,
    }),
  });
}

async function fixture(input: Readonly<{
  lab?: boolean;
  withHealingGear?: boolean;
  failReceiptCommit?: boolean;
  floraSeed?: number;
  poisoned?: boolean;
}> = {}) {
  const lab = input.lab ?? true;
  const state = baseState(lab);
  const engineeringState = engineering(lab);
  const owned = ownership(input.floraSeed);
  const sessionSeed = sessionSeedFor(owned.poisonChance, input.poisoned ?? false);
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: input.withHealingGear === false ? {
      items: [], equip: {}, equipAff: {},
    } : {
      items: [['surgeon', 1]], equip: { gloves: 'surgeon' }, equipAff: {},
    },
    capacity: 8,
  });
  if (loot.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${loot.kind}`);
  const withEngineering = applyV5ExtensionWrites(loot.extensions, [{
    segment: ARC3_ENGINEERING_SEGMENT,
    namespace: ARC3_ENGINEERING_NAMESPACE,
    carrier: encodeArc3EngineeringCarrier(engineeringState),
  }]).extensions;
  const f4 = prepareF4AuthorityUpdate(
    withEngineering,
    { activePlayMs: 0 },
    createSessionRNG(sessionSeed).state(),
  );
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(owned.source).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture was ${arc5.kind}`);
  const loadout = readArc2EngineeringLoadout(arc5.extensions);
  if (loadout.kind !== 'loaded') throw new Error(`loadout fixture was ${loadout.kind}`);
  const base = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await base.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(base, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`V5 fixture was ${migrated.kind}`);
  await base.apply(initialSave.operations);
  let receiptAttempts = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) {
        receiptAttempts++;
        if (input.failReceiptCommit === true) throw new Error('forced meal storage failure');
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
    initialExtensions: arc5.extensions,
    restoredAuthority: f4.authority,
    freshSessionSeed: 0,
    ownerId: 'explorer-meal-tab',
    token: 'explorer-meal-document',
    leaseTtlMs: 1_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`meal lease was ${heartbeat.kind}`);
  return {
    backend, repository, runtime, state, engineeringState, owned,
    ownershipV2: arc5.state,
    ownershipEvidence: arc5.evidence,
    capabilities: loadout.capabilities,
    sessionSeed,
    receiptAttempts: () => receiptAttempts,
  };
}

function actionInput(f: Awaited<ReturnType<typeof fixture>>) {
  return {
    runtime: f.runtime,
    ownershipV2: f.ownershipV2,
    engineering: f.engineeringState,
    capabilities: f.capabilities,
    state: f.state,
    foodLotId: f.owned.foodLotId,
    codecNow: NOW,
  };
}

function mainMealHarness(
  f: Awaited<ReturnType<typeof fixture>>,
  publisher: typeof publishArc5ExplorerMealAchievementFields =
    publishArc5ExplorerMealAchievementFields,
) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" aria-label="Compendium" style="display:block">
      <button id="codexback" type="button">Back</button>
      <button type="button" data-pnx="codex">Close</button>
      <section data-arc5-explorer-meal-body aria-label="Eat flora"></section>
    </aside>
  </body></html>`);
  const document = dom.window.document;
  const generation = 7;
  const row = Object.freeze([
    f.owned.record.id,
    f.owned.record,
  ] as const) satisfies MainMealRow;
  const completion = deferred<Readonly<{ title: string; detail: string }>>();
  const scheduleReload = vi.fn();
  const progressionCeremony = vi.fn();
  const progressionRefresh = vi.fn();
  const visualToast = vi.fn((title: string, detail: string) => {
    completion.resolve(Object.freeze({ title, detail }));
  });
  const env = {
    CompendiumExplorerMealController,
    document,
    codexGeneration: generation,
    codexMode: 'detail',
    codexDetailLogicalId: row[0],
    openPanelId: () => 'codex',
    currentCompendiumDetailRow: () => row,
    compendiumFixtureRows: null,
    projectCompendiumExplorerMealV1,
    f4Runtime: f.runtime,
    arc5OwnershipState: f.ownershipV2 as typeof f.ownershipV2 | null,
    arc5OwnershipEvidence: f.ownershipEvidence as typeof f.ownershipEvidence | null,
    arc5OwnershipProtection: null as string | null,
    arc3EngineeringState: f.engineeringState,
    arc3EngineeringProtection: null as string | null,
    readArc2EngineeringLoadout,
    projectEngineeringCapabilities,
    f4RuntimeMayMutate: (candidate: unknown) => candidate === f.runtime,
    save: f.state,
    ownershipStateDigestV2,
    ownershipStateDigestV1,
    ownershipSourceStateV1,
    ARC5_OWNERSHIP_MIGRATION_VERSION,
    ARC5_OWNERSHIP_EXTENSION_TARGETS,
    activePersist: null as Promise<boolean> | null,
    importWriteInFlight: false,
    replacementTransaction: null as object | null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    commitArc5ExplorerMealActionV1,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null as string | null,
    publishArc5ExplorerMealAchievementFields: publisher,
    presentProgressionCeremony: progressionCeremony,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    queueArc9ProgressionRefresh: progressionRefresh,
    lastArc5ExplorerMealResult: null as unknown,
    lastArc5ExplorerMealOutcome: null as string | null,
    lastArc5BootstrapOutcome: null as string | null,
    COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
    refreshCompendiumFeedState: () => undefined,
    hudText: vi.fn(),
    updateChips: vi.fn(),
    showCompendiumFeedVisualToast: visualToast,
  };
  const executable = executableMainExplorerMeal(env);
  env.refreshCompendiumFeedState = () => {
    executable.controller.setState(executable.projectCurrent(row, generation));
  };
  const model = executable.projectCurrent(row, generation);
  if (model?.availability !== 'ready') {
    dom.window.close();
    throw new Error(`Main explorer meal fixture was ${model?.availability ?? 'absent'}`);
  }
  const mount = document.querySelector<HTMLElement>('[data-arc5-explorer-meal-body]')!;
  executable.controller.setState(model);
  executable.controller.attach(mount);
  return {
    dom,
    env,
    controller: executable.controller,
    mount,
    completion: completion.promise,
    scheduleReload,
    progressionCeremony,
    progressionRefresh,
    visualToast,
  };
}

describe('explorer flora meal action', () => {
  it('projects exact values and durably commits HP/stats, one lot, RNG and receipt atomically', async () => {
    const f = await fixture();
    const preview = projectArc5ExplorerMealActionPreviewV1(actionInput(f));
    expect(preview.kind).toBe('ready');
    if (preview.kind !== 'ready') return;
    expect(preview.preview).toMatchObject({
      explorerMealHealBonus: 0.35,
      xenobotanyLab: true,
      nourishment: 2 + preview.preflight.floraTier,
    });

    const before = JSON.stringify(f.state);
    const outcome = await commitArc5ExplorerMealActionV1(actionInput(f));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome).toMatchObject({
      durability: 'committed',
      convergence: 'none',
      transaction: {
        revision: 1,
        plan: { domain: ARC5_EXPLORER_MEAL_DOMAIN_V1, receiptOrdinal: 0 },
        receipt: { ordinal: 0, kind: ARC5_EXPLORER_MEAL_RECEIPT_KIND_V1 },
      },
      settlement: {
        foodBefore: { lotId: f.owned.foodLotId, quantity: 2 },
        foodAfter: { lotId: f.owned.foodLotId, quantity: 1 },
      },
    });
    expect(outcome.transaction.plan.domain).toBe(DOMAINS.healOutcome);
    expect(outcome.transaction.plan.value).toBe(outcome.settlement.consequence.outcomeDraw);
    expect(outcome.settlement.consequence.poisoned).toBe(false);
    expect(outcome.achievementIdsAdded).toEqual(['fieldmedic']);
    expect(outcome.state.unlocked).toEqual([...f.state.unlocked, 'fieldmedic']);
    expect(outcome.transaction.receipt.witness).toBe(outcome.settlement.witness);
    expect(outcome.ownershipWrites.map(({ segment, namespace }) => ({ segment, namespace })))
      .toEqual(ARC5_OWNERSHIP_EXTENSION_TARGETS);
    expect(outcome.ownershipV2.specimenLots[0]!.quantity).toBe(1);
    expect(f.receiptAttempts()).toBe(1);
    expect(await f.repository.revision()).toBe(1);
    expect(JSON.stringify(f.state)).toBe(before);
    const consequence = outcome.settlement.consequence;
    if (consequence.poisoned) {
      expect(outcome.state.hp).toBe(Math.max(1, 40 - consequence.poisonDamage));
      expect(outcome.state.pstats).toEqual(f.state.pstats);
    } else {
      expect(outcome.state.hp).toBe(consequence.hpAfter);
      expect(outcome.state.pstats[consequence.nourishedStat])
        .toBe(50 + consequence.statIncrease);
    }
    const saved = await readSaveV5(f.backend, REGISTRY, NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind === 'loaded') {
      expect(saved.state.hp).toBe(outcome.state.hp);
      expect(saved.state.HP_MAX).toBe(outcome.state.HP_MAX);
      expect(saved.state.pstats).toEqual(outcome.state.pstats);
      expect(saved.state.unlocked).toEqual(outcome.state.unlocked);
      expect(readF4Authority(saved.extensions)).toEqual({
        kind: 'loaded',
        authority: {
          activePlayMs: 0,
          sessionRng: { seed: f.sessionSeed, ordinal: 1, draws: { [DOMAINS.healOutcome]: 1 } },
        },
      });
      const ownershipReload = readArc5OwnershipMigration(
        saved.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      expect(ownershipReload.kind).toBe('loaded');
      if (ownershipReload.kind === 'loaded') {
        expect(ownershipStateDigestV2(ownershipReload.state))
          .toBe(ownershipStateDigestV2(outcome.ownershipV2));
      }
    }
    await f.runtime.release();
  });

  it('joins both safe high-risk meal achievements in the same durable successor', async () => {
    const f = await fixture({ floraSeed: HIGH_RISK_FLORA_SEED });
    const preview = projectArc5ExplorerMealActionPreviewV1(actionInput(f));
    expect(preview.kind).toBe('ready');
    if (preview.kind !== 'ready') return;
    expect(preview.preflight.poisonChance).toBeGreaterThan(0.4);

    const outcome = await commitArc5ExplorerMealActionV1(actionInput(f));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.consequence.poisoned).toBe(false);
    expect(outcome.achievementIdsAdded).toEqual(['fieldmedic', 'gambler']);
    expect(outcome.state.unlocked).toEqual([...f.state.unlocked, 'fieldmedic', 'gambler']);
    const published = { ...f.state, unlocked: [...f.state.unlocked] };
    publishArc5ExplorerMealAchievementFields(
      published,
      outcome.state,
      outcome.achievementIdsAdded,
    );
    expect(published.unlocked).toEqual(outcome.state.unlocked);
    await f.runtime.release();
  });

  it('does not award healing achievements when the high-risk meal poisons', async () => {
    const f = await fixture({ floraSeed: HIGH_RISK_FLORA_SEED, poisoned: true });
    const outcome = await commitArc5ExplorerMealActionV1(actionInput(f));
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.settlement.consequence.poisoned).toBe(true);
    expect(outcome.achievementIdsAdded).toEqual([]);
    expect(outcome.state.unlocked).toEqual(f.state.unlocked);
    await f.runtime.release();
  });

  it('refuses divergent research before RNG and stale loadout during derive without publication', async () => {
    const f = await fixture();
    let calls = 0;
    const refused = await commitArc5ExplorerMealActionV1({
      ...actionInput(f),
      runtime: { async commitOutcome() { calls++; return { kind: 'lease-unavailable' as const }; } },
      state: { ...f.state, techOwned: [] },
    });
    expect(refused).toMatchObject({ kind: 'refused', transaction: null });
    expect(calls).toBe(0);

    const noGear = await fixture({ withHealingGear: false });
    const revisionBefore = await f.repository.revision();
    const stale = await commitArc5ExplorerMealActionV1({
      ...actionInput(f),
      capabilities: noGear.capabilities,
    });
    expect(stale).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      transaction: { kind: 'rejected', stage: 'derive' },
    });
    expect(await f.repository.revision()).toBe(revisionBefore);
    expect(f.runtime.sessionRng).toEqual({ seed: f.sessionSeed, ordinal: 0, draws: {} });
    await f.runtime.release();
    await noGear.runtime.release();
  });

  it('attempts a storage-red meal once and leaves state, lot, RNG and receipt absent', async () => {
    const f = await fixture({ failReceiptCommit: true });
    const savedBefore = await readSaveV5(f.backend, REGISTRY, NOW);
    const outcome = await commitArc5ExplorerMealActionV1(actionInput(f));
    expect(outcome).toMatchObject({
      kind: 'refused',
      durability: 'none',
      convergence: 'read-only-reload',
      detail: 'transaction:forced meal storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(f.receiptAttempts()).toBe(1);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.backend.keys('receipts')).toEqual([]);
    expect(f.runtime.sessionRng).toEqual({ seed: f.sessionSeed, ordinal: 0, draws: {} });
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW)))
      .toBe(JSON.stringify(savedBefore));
    await f.runtime.release();
  });

  it('executes the Main-created native-click path through one durable published fixed point', async () => {
    const f = await fixture();
    const harness = mainMealHarness(f);
    try {
      const button = harness.mount.querySelector<HTMLButtonElement>(
        '[data-arc5-explorer-meal-confirm]',
      )!;
      expect(button.textContent).toBe('Eat 1');
      button.click();
      expect(harness.controller.diagnostics()).toMatchObject({
        pendingWork: 1,
        convergenceLatched: false,
      });

      const toast = await harness.completion;
      expect(toast.title).toBe('Flora meal complete.');
      expect(harness.controller.diagnostics()).toMatchObject({
        pendingWork: 0,
        convergenceLatched: false,
        lastOutcome: { kind: 'committed', convergence: 'none' },
      });
      expect(harness.mount.querySelector('[role="status"]')?.textContent)
        .toMatch(/HP 40 → \d+; [A-Z]+ \+\d+.*exact specimen was consumed/u);
      expect(harness.env.save.hp).toBeGreaterThan(40);
      expect(harness.env.save.unlocked).toContain('fieldmedic');
      expect(harness.env.arc5OwnershipState?.revision).toBe(1);
      expect(harness.env.arc5OwnershipState?.specimenLots[0]?.quantity).toBe(1);
      expect(harness.env.arc5OwnershipProtection).toBeNull();
      expect(harness.env.lastArc5ExplorerMealOutcome).toBe('committed:1');
      expect(harness.env.lastPersistenceOutcome).toBe('arc5-explorer-meal-committed:1');
      expect(harness.env.activePersist).toBeNull();
      expect(harness.env.productActionCoordinator.diagnostics()).toMatchObject({
        busy: false,
        operation: null,
      });
      expect(harness.progressionCeremony).toHaveBeenCalledTimes(1);
      expect(harness.progressionRefresh).toHaveBeenCalledWith('arc5.explorer-meal');
      expect(harness.scheduleReload).not.toHaveBeenCalled();
      expect(f.receiptAttempts()).toBe(1);
      expect(await f.repository.revision()).toBe(1);
      expect(await f.backend.keys('receipts')).toHaveLength(1);

      const saved = await readSaveV5(f.backend, REGISTRY, NOW);
      expect(saved.kind).toBe('loaded');
      if (saved.kind !== 'loaded') return;
      expect(saved.state.hp).toBe(harness.env.save.hp);
      expect(saved.state.HP_MAX).toBe(harness.env.save.HP_MAX);
      expect(saved.state.pstats).toEqual(harness.env.save.pstats);
      expect(saved.state.unlocked).toEqual(harness.env.save.unlocked);
      const loadedOwnership = readArc5OwnershipMigration(
        saved.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      expect(loadedOwnership.kind).toBe('loaded');
      if (loadedOwnership.kind === 'loaded') {
        expect(ownershipStateDigestV2(loadedOwnership.state))
          .toBe(ownershipStateDigestV2(harness.env.arc5OwnershipState!));
      }
    } finally {
      harness.controller.dispose();
      harness.dom.window.close();
      await f.runtime.release();
    }
  });

  it('keeps the durable Main successor while a partial live publication rolls back and latches reload', async () => {
    const f = await fixture();
    const liveBefore = structuredClone(f.state);
    const failingPublisher: typeof publishArc5ExplorerMealAchievementFields = (
      live,
      committed,
      achievementIds,
    ) => {
      publishArc5ExplorerMealAchievementFields(live, committed, achievementIds);
      throw new Error('forced Main explorer meal publication failure');
    };
    const harness = mainMealHarness(f, vi.fn(failingPublisher));
    try {
      harness.mount.querySelector<HTMLButtonElement>(
        '[data-arc5-explorer-meal-confirm]',
      )!.click();
      const toast = await harness.completion;
      expect(toast.title).toBe('Meal saved — reload required.');
      expect(harness.controller.diagnostics()).toMatchObject({
        pendingWork: 0,
        convergenceLatched: true,
        lastOutcome: {
          kind: 'committed-convergence',
          convergence: 'read-only-reload',
        },
      });
      const button = harness.mount.querySelector<HTMLButtonElement>(
        '[data-arc5-explorer-meal-confirm]',
      )!;
      expect(button.disabled).toBe(true);
      expect(button.title).toBe('Reload required before another meal.');
      expect(harness.mount.getAttribute('aria-busy')).toBe('false');

      expect(f.state).toEqual(liveBefore);
      expect(harness.env.arc5OwnershipState).toBeNull();
      expect(harness.env.arc5OwnershipEvidence).toBeNull();
      expect(harness.env.arc5OwnershipProtection).toBe('committed-publication-reload');
      expect(harness.env.lastArc5BootstrapOutcome)
        .toBe('explorer-meal-committed-publication-reload');
      expect(harness.env.lastArc5ExplorerMealOutcome).toBe('committed-publication-reload');
      expect(harness.env.lastPersistenceOutcome).toBe('arc5-explorer-meal-committed:1');
      expect(harness.env.activePersist).toBeNull();
      expect(harness.env.productActionCoordinator.diagnostics()).toMatchObject({
        busy: false,
        operation: null,
      });
      expect(harness.scheduleReload).toHaveBeenCalledTimes(1);
      expect(harness.progressionCeremony).not.toHaveBeenCalled();
      expect(harness.progressionRefresh).toHaveBeenCalledWith('arc5.explorer-meal');
      expect(harness.env.publishArc5ExplorerMealAchievementFields).toHaveBeenCalledTimes(1);
      expect(f.receiptAttempts()).toBe(1);
      expect(await f.repository.revision()).toBe(1);
      expect(await f.backend.keys('receipts')).toHaveLength(1);

      const saved = await readSaveV5(f.backend, REGISTRY, NOW);
      expect(saved.kind).toBe('loaded');
      if (saved.kind !== 'loaded') return;
      expect(saved.state.hp).toBeGreaterThan(liveBefore.hp);
      expect(saved.state.unlocked).toContain('fieldmedic');
      expect(saved.state.pstats).not.toEqual(liveBefore.pstats);
      const loadedOwnership = readArc5OwnershipMigration(
        saved.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      expect(loadedOwnership.kind).toBe('loaded');
      if (loadedOwnership.kind === 'loaded') {
        expect(loadedOwnership.state.revision).toBe(1);
        expect(loadedOwnership.state.specimenLots[0]?.quantity).toBe(1);
      }

      button.click();
      await Promise.resolve();
      expect(f.receiptAttempts()).toBe(1);
      expect(await f.repository.revision()).toBe(1);
    } finally {
      harness.controller.dispose();
      harness.dom.window.close();
      await f.runtime.release();
    }
  });
});
