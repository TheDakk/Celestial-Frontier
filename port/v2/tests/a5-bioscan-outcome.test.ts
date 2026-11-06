/* A5 gap #2 (INVENTORY.md row #16): Bioscan / Discover Life — UI OUTCOME test.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. bioscan-action.test.ts
 * calls commitBioscanActionV1() itself, so it stays green even if the world
 * card never reaches it. Here the exact shipped main.ts sections are sliced,
 * type-stripped and executed with an injected env (the explorer-meal /
 * binder / charter pattern):
 *   - the Bioscan card-state types + `currentBioscanCardState`,
 *   - canonicalRosterForBioscanCard / projectCurrentBioscanCardState /
 *     bioscanCardActionHtml (the card projection and the rendered control),
 *   - the survey card's delegated click owner (`card.addEventListener('click', …)`),
 *   - the Bioscan outcome/result cells,
 *   - freshCurrentBioscanReady / protectArc9BioscanAfterDurability / runArc9Bioscan.
 * The test presses the `[data-act="bioscan"]` button main.ts rendered in JSDOM,
 * then reads the COMMITTED v5 save back from a real memory backend with
 * readSaveV5 (twice), reboots a fresh F4 runtime from that durable save and
 * re-renders the card from it.
 *
 * Harness glue (not shipped code): presentPlanetSurvey is a heavy renderer
 * (descriptors, vista, planetside); the harness re-runs only its two exact
 * Bioscan lines (asserted verbatim below) and paints bioscanCardActionHtml.
 * Stubbed externals: navigation (activeCardWorldAddress → Earth), toast,
 * HUD/chips/ceremony/camera shake, other panels, the read-only boundary
 * (blockPlayerMutation → false), and the unrelated write-hold flags. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  migrateOwnershipStateV1ToV2,
  ownershipContentId,
  ownershipSourceStateV1,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { projectEngineeringCapabilities } from '@cf/domain-loot';
import {
  LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA,
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  migrateLegacyEngineeringState,
  projectWorldOpportunity,
} from '@cf/domain-opportunity';
import { DOMAINS, createSessionRNG } from '@cf/domain-sessionrng';
import { resolveCF1WorldAddress, type CanonicalCF1WorldAddress } from '@cf/scene';
import {
  ARC3_ENGINEERING_NAMESPACE,
  ARC3_ENGINEERING_SEGMENT,
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  finishedShelterPlanetSeedsV1,
  EMPTY_OUTPOST_PROJECTS_V1,
  buildOutpostStageV1,
  startOutpostV1,
  outpostProjectsWriteV1,
  readOutpostProjectsV1,
  type OutpostProjectsStateV1,
  arc2LootLegacyMirrorMatches,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc2LootCarrier,
  encodeArc3EngineeringCarrier,
  encodeArc4Ownership,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc2LootLegacyMigration,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc2EngineeringLoadout,
  readArc2Loot,
  readArc3Engineering,
  readArc5OwnershipMigration,
  readCombatSettlementAuthorityV1,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC9_BIOSCAN_RECEIPT_KIND_V1,
  commitBioscanActionV1,
  projectBioscanActionV1,
  publishBioscanActionV1,
} from '../apps/game/src/bioscan-action.js';
import {
  deriveArc9SurveyFactV1,
  prepareArc9SurveySettlementV1,
} from '../apps/game/src/arc9-survey-action.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';
import { canonicalWorldRoster, isCanonicalWorldRoster } from '../apps/game/src/world-roster.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
const HOME = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });
/** SessionRNG seeds proven by bioscan-action.test.ts on Earth: 5 draws a
 * hostile encounter, 0xB105CA7 a clear one. */
const HOSTILE_SEED = 5;
const CLEAR_SEED = 0xB105CA7;
/** High enough that doubled damage cannot hide behind the 1-HP floor. */
const START_HP = 60;

beforeAll(() => installCaptureHooks());

interface TestWindow extends Window {
  readonly Element: typeof Element;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

/* ---------------- the exact shipped Main sections ---------------- */

function exactMainSection(start: string, end: string): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main Bioscan section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Bioscan section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

/** presentPlanetSurvey's two Bioscan lines, re-run by the harness card
 * painter. Asserted verbatim so the glue cannot drift from the product. */
const PRESENT_SURVEY_BIOSCAN_LINES =
  '  const roster = canonicalRosterForBioscanCard(address, preparedCaptureRoster);\n'
  + '  currentBioscanCardState = projectCurrentBioscanCardState(address, roster);';

const MAIN_BIOSCAN_SOURCE = [
  // Bioscan card-state types and the module-level card state
  exactMainSection('type ReadyBioscanProjectionV1 =', '\ninterface CardTravelAction'),
  // card roster, card projection and the rendered Discover Life control
  exactMainSection('function canonicalRosterForBioscanCard(', '\nfunction projectCurrentLandingCardState('),
  // the survey card's delegated click owner (dispatches data-act="bioscan")
  exactMainSection("card.addEventListener('click', async (e) => {", '\n/* Play-time harvest'),
  // module-level outcome / result cells
  exactMainSection('let lastArc9BioscanOutcome: string | null = null;', '\nlet lastArc9AtlasFavoriteOutcome'),
  // freshCurrentBioscanReady, protectArc9BioscanAfterDurability, runArc9Bioscan
  exactMainSection('function freshCurrentBioscanReady(', '\nasync function settleArc9Survey('),
].join('\n');

/** Harness-only card painter: presentPlanetSurvey's Bioscan lines + the
 * shipped bioscanCardActionHtml. */
const HARNESS_CARD_PAINTER = `
function __harnessPresentBioscanCard(preparedCaptureRoster = null) {
  const address = activeCardWorldAddress();
  if (address === null) { currentBioscanCardState = null; card.innerHTML = ''; return false; }
${PRESENT_SURVEY_BIOSCAN_LINES}
  card.innerHTML = '<div class="card-actions">' + bioscanCardActionHtml(currentBioscanCardState) + '</div>';
  return true;
}`;

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

/** Exact, unique string replacement (CLAUDE.md rule 2). */
function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main Bioscan source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

interface ExecutableMainBioscan {
  readonly present: () => boolean;
  readonly outcome: () => string | null;
  readonly result: () => Record<string, unknown> | null;
  readonly cardState: () => { kind: string } | null;
}

function executableMainBioscan(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMainBioscan {
  const source = mutations.reduce(replaceExact, MAIN_BIOSCAN_SOURCE) + HARNESS_CARD_PAINTER;
  const transformed = transformSync('main-bioscan.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    present: () => __harnessPresentBioscanCard(),
    outcome: () => lastArc9BioscanOutcome,
    result: () => lastArc9BioscanResult,
    cardState: () => currentBioscanCardState,
  }; }`)(env) as ExecutableMainBioscan;
}

/* ---------------- durable fixtures (real F4 runtime over a memory backend) ---------------- */

function earth(): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress({ galaxy: HOME, star: SOL, planet: { seed: 133 } });
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

function emptyOwnership() {
  return createInitialOwnershipStateV1({
    catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
}

/** An assigned Field Scout (same construction as bioscan-action.test.ts). */
function scoutOwnership(hurt = 0): OwnershipStateV2 {
  const identity = canonicalGenomeIdentityV1(makeGenome(71, 'fauna', 0.4));
  const recordId = ownershipContentId('discovery', 'a5-bioscan-scout') as DiscoveryRecordId;
  const creatureId = ownershipContentId('creature', 'a5-bioscan-scout') as CreatureInstanceId;
  const discovery = createLegacyDiscoveryRecordV1({
    recordId, speciesId: identity.speciesId, legacyCodexId: 'a5-bioscan-scout',
    legacySourceIndex: 0, from: 'Legacy', legacyLocation: null, firstForSpecies: true,
  });
  const creature = createCreatureInstanceV1({
    creatureId, speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity,
    genome: identity.genome, nickname: 'Aegis', origin: 'legacy', acquisitionRecordId: recordId,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp: 9, hurt, fed: 7, brood: 3, assignment: null, bond: null,
  });
  return migrateOwnershipStateV1ToV2(createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({ identity, alias: null, firstObservationId: recordId })],
    discoveries: [discovery], creatures: [creature], specimenLots: [],
    biosphereProgress: [], legacyBioX: [], scoutCreatureId: creatureId,
  }));
}

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
  readonly ownershipV2: OwnershipStateV2;
  readonly ownershipEvidence: unknown;
  readonly engineering: unknown;
  readonly arc2LootState: unknown;
}

/** Boot exactly as a document does: read the committed v5 save back from
 * storage and create the F4 runtime and owner states from those bytes. */
async function bootFromDurableSave(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`Bioscan boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`Bioscan boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-bioscan-${tag}-tab`, token: `a5-bioscan-${tag}-document`,
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Bioscan lease was ${heartbeat.kind}`);
  const ownership = readArc5OwnershipMigration(runtime.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`Bioscan boot ownership was ${ownership.kind}`);
  const engineering = readArc3Engineering(runtime.extensions, SCENE_ENGINEERING_ADDRESS_RESOLVER);
  if (engineering.kind !== 'loaded') throw new Error(`Bioscan boot engineering was ${engineering.kind}`);
  const loot = readArc2Loot(runtime.extensions);
  if (loot.kind !== 'loaded') throw new Error(`Bioscan boot loot was ${loot.kind}`);
  return {
    backend, repository, runtime, state: saved.state,
    ownershipV2: ownership.state, ownershipEvidence: ownership.evidence,
    engineering: engineering.state, arc2LootState: loot.state,
  };
}

async function freshFixture(sessionSeed: number, ownershipV2?: OwnershipStateV2, outposts: OutpostProjectsStateV1 | null = null): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state: SaveStateV2 = {
    ...imported.state, hp: START_HP, HP_MAX: 100,
    pstats: { vit: 50, fer: 50, res: 50, agi: 50, ins: 50 }, techOwned: [],
    stats: { ...imported.state.stats, bestRank: 0 }, unlocked: [],
  };
  const engineering = migrateLegacyEngineeringState({
    schema: LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, revision: 0,
    worlds: [], stars: [], research: [],
  }, { resolveWorldSeed: () => [], resolveStarSeed: () => [] });
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: state.items, equip: state.equip, equipAff: state.equipAff },
    capacity: 8,
  });
  if (loot.kind !== 'prepared') throw new Error(loot.kind);
  const engineered = applyV5ExtensionWrites(loot.extensions, [{
    segment: ARC3_ENGINEERING_SEGMENT, namespace: ARC3_ENGINEERING_NAMESPACE,
    carrier: encodeArc3EngineeringCarrier(engineering),
  }]).extensions;
  const f4 = prepareF4AuthorityUpdate(engineered, { activePlayMs: 0 }, createSessionRNG(sessionSeed).state());
  const source = ownershipV2 === undefined ? emptyOwnership() : ownershipSourceStateV1(ownershipV2);
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(source).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(arc5.kind);
  const backend = createMemoryBackend();
  const withOutposts = outposts === null ? arc5.extensions : applyV5ExtensionWrites(arc5.extensions, [outpostProjectsWriteV1(outposts)]).extensions;
  const initial = prepareV5SaveWrite({ state, extensions: withOutposts }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`Bioscan fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  return bootFromDurableSave(backend, 'first');
}

/* ---------------- the Main harness ---------------- */

function mainBioscanHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section id="card" aria-label="Survey" style="display:block"></section>
  </body></html>`);
  const document = dom.window.document;
  const card = document.getElementById('card')!;
  const address = earth();
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const ceremony = vi.fn();
  const gameEvent = vi.fn();
  const cameraShake = vi.fn();
  const env: Record<string, unknown> & {
    save: SaveStateV2;
    activePersist: unknown;
    productActionInFlight: boolean;
    lastPersistenceOutcome: string | null;
    arc5OwnershipState: unknown;
    arc5OwnershipProtection: string | null;
  } = {
    document,
    Element: dom.window.Element,
    card,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    esc: (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
    }[c]!)),
    // the durable authorities, exactly as boot published them
    save: f.state,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    arc5OwnershipState: f.ownershipV2,
    arc5OwnershipEvidence: f.ownershipEvidence,
    arc5OwnershipProtection: null,
    lastArc5BootstrapOutcome: 'committed-published',
    arc3EngineeringState: f.engineering,
    arc3EngineeringProtection: null,
    arc2LootState: f.arc2LootState,
    lastStarterCharterAcceptStatus: null,
    lastArc9SurveyOutcome: null,
    f4AuthorityReloadScheduled: false,
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    // write-hold flags (unrelated owners)
    smokeForceReadOnly: false,
    activePersist: null,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    trainingActive: () => false,
    ecologyEpochBlocksActions: () => false,
    currentEcologyEpoch: () => 0,
    blockPlayerMutation: () => false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    // navigation: the open card is Earth's (nav is not under test)
    activeCardWorldAddress: () => address,
    isAiActionTarget: () => false,
    surveyDockEl: card,
    // the real domain owners main.ts imports
    canonicalWorldRoster,
    isCanonicalWorldRoster,
    deriveArc9SurveyFactV1,
    prepareArc9SurveySettlementV1,
    readArc2EngineeringLoadout,
    readCombatSettlementAuthorityV1,
    projectEngineeringCapabilities,
    projectWorldOpportunity,
    projectBioscanActionV1,
    // D14: Main's presentation hint (Main-local outpostShelteredAt), read from the same runtime carrier
    outpostShelteredAt: (seed: number) => { const r = readOutpostProjectsV1(f.runtime.extensions); return r.kind === 'loaded' && finishedShelterPlanetSeedsV1(r.state).includes(seed >>> 0); },
    commitBioscanActionV1,
    publishBioscanActionV1,
    ownershipStateDigestV2,
    readArc5OwnershipMigration,
    readArc2Loot,
    encodeArc2LootCarrier,
    arc2LootLegacyMirrorMatches,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    ARC4_OWNERSHIP_EXTENSION_TARGETS,
    ARC5_OWNERSHIP_EXTENSION_TARGETS,
    ARC5_OWNERSHIP_MIGRATION_VERSION,
    // presentation externals
    toast,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    presentProgressionCeremony: ceremony,
    gameEvent,
    triggerCameraShake: cameraShake,
    hudText: vi.fn(),
    updateChips: vi.fn(),
    refreshCompendiumFeedState: vi.fn(),
    openPanelId: () => null,
    fillCharters: vi.fn(),
    fillRecords: vi.fn(),
    refreshEngineeringPanelState: vi.fn(),
    toastCharterCompletion: vi.fn(),
    playRaritySting: vi.fn(),
    inventoryPanelController: { setState: vi.fn() },
  };
  const exec = executableMainBioscan(env, mutations);
  env.refreshPlanetSurveyCard = () => exec.present();
  exec.present();
  const bioscanButton = () => card.querySelector<HTMLButtonElement>('button[data-act="bioscan"]');
  /** A stale control: the same markup main.ts rendered before the commit. */
  const injectStaleBioscan = (): HTMLButtonElement => {
    const stale = document.createElement('button');
    stale.type = 'button';
    stale.dataset.act = 'bioscan';
    stale.dataset.bioscanWorld = address.key;
    card.append(stale);
    return stale;
  };
  return {
    dom, env, exec, card, address, toast, scheduleReload, ceremony, gameEvent, cameraShake,
    bioscanButton, injectStaleBioscan,
  };
}
type Harness = ReturnType<typeof mainBioscanHarness>;

/** Wait until the press the shipped click owner started has fully settled. */
async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (!h.env.productActionInFlight && h.env.activePersist === null && h.exec.outcome() !== 'pending') {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`Bioscan press never settled (outcome ${h.exec.outcome()})`);
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

function scoutHurt(extensions: Parameters<typeof readArc5OwnershipMigration>[0]): number | null {
  const ownership = readArc5OwnershipMigration(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`durable ownership was ${ownership.kind}`);
  const scoutId = ownership.state.scoutCreatureId;
  return ownership.state.creatures.find(({ creatureId }) => creatureId === scoutId)?.hurt ?? null;
}

/* ---------------- the scenario (also re-run against each Main mutant) ---------------- */

type Case = 'clear' | 'explorer' | 'scout';

async function pressBioscanScenario(which: Case, mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture(
    which === 'clear' ? CLEAR_SEED : HOSTILE_SEED,
    which === 'scout' ? scoutOwnership(0) : undefined,
  );
  const harnesses: Harness[] = [];
  try {
    const h = mainBioscanHarness(f, mutations);
    harnesses.push(h);
    const key = h.address.key;
    const scoutBefore = which === 'scout' ? scoutHurt(f.runtime.extensions) : null;
    expect(h.exec.cardState()?.kind, 'the card must project a ready Discover Life').toBe('ready');
    const button = h.bioscanButton();
    expect(button, 'Main must render an enabled Discover Life control').not.toBeNull();
    expect(button!.disabled).toBe(false);
    expect(button!.dataset.bioscanWorld).toBe(key);
    const declaredProbability = Number(button!.dataset.bioscanProbability);
    const declaredDamage = Number(button!.dataset.bioscanDamage);
    if (which === 'clear') {
      expect(button!.textContent).toMatch(/Discover Life/u);
    } else {
      expect(declaredProbability, 'a hostile world must declare its danger on the control').toBeGreaterThan(0);
      expect(declaredDamage, 'a hostile world must declare its field damage on the control').toBeGreaterThan(0);
      expect(button!.textContent).toContain(`⚠ ${declaredProbability}% danger`);
    }
    expect(await f.repository.revision()).toBe(0);
    expect(await f.backend.keys('receipts')).toEqual([]);

    // Press, then a double-tap on the still-painted control while the first is in flight.
    button!.click();
    button!.click();
    await settled(h);

    // (1) the durable outcome, read back from the real backend
    const saved = await durableSave(f);
    expect(saved.state.surveyedSet, `${which}: durable surveyedSet must record the scanned world exactly once`)
      .toEqual([key]);
    expect(saved.state.stats.surveys, `${which}: durable survey count must be 1`).toBe(1);
    expect(await f.repository.revision(), `${which}: pressing Discover Life must commit exactly one revision`).toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, `${which}: exactly one receipt`).toHaveLength(1);
    expect((await f.repository.readReceipt(0))?.kind).toBe(ARC9_BIOSCAN_RECEIPT_KIND_V1);
    const authority = readF4Authority(saved.extensions);
    expect(authority.kind).toBe('loaded');
    if (authority.kind === 'loaded') {
      expect(authority.authority.sessionRng.ordinal, `${which}: one receipt ordinal`).toBe(1);
      expect(authority.authority.sessionRng.draws, `${which}: exactly one hazard draw`)
        .toEqual({ [DOMAINS.surveyHazard]: 1 });
    }
    if (which === 'explorer') {
      expect(saved.state.hp, 'explorer: durable HP must be the start HP less the declared damage (floor 1)')
        .toBe(Math.max(1, START_HP - declaredDamage));
    }
    const result = h.exec.result();
    expect(h.exec.outcome()).toBe(`committed:${which}:1`);
    expect(result).toMatchObject({ worldKey: key, target: which, revision: 1, receiptOrdinal: 0 });

    // (2) the hazard landed on the declared target, with the declared damage
    if (which === 'clear') {
      expect(saved.state.hp, 'clear: durable explorer HP is untouched').toBe(START_HP);
      expect(saved.state.stats.scanhits ?? 0).toBe(0);
      expect(saved.state.unlocked).not.toContain('survivor');
    } else {
      expect(result!.damage, `${which}: settled damage must equal the declared damage`).toBe(declaredDamage);
      expect(saved.state.stats.scanhits, `${which}: one durable close call`).toBe(1);
      expect(saved.state.unlocked, `${which}: the hostile scan joins survivor`).toContain('survivor');
    }
    if (which === 'explorer') {
      expect(h.toast).toHaveBeenCalledWith(
        '⚠ Hostile life encountered', expect.stringContaining(`cost ${declaredDamage} HP`), true,
      );
    }
    if (which === 'scout') {
      expect(saved.state.hp, 'scout: the assigned Scout absorbs it; durable explorer HP is untouched')
        .toBe(START_HP);
      const after = scoutHurt(saved.extensions);
      expect(after, 'scout: durable Scout injury must be the published injury').toBe(result!.scoutHurtAfter);
      expect(after!, 'scout: durable Scout injury must rise').toBeGreaterThan(scoutBefore!);
      expect(after!, 'scout: never beyond Critical').toBeLessThanOrEqual(0.85);
      const durableOwnership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
      if (durableOwnership.kind !== 'loaded') throw new Error(`durable ownership was ${durableOwnership.kind}`);
      expect(
        ownershipStateDigestV2(h.env.arc5OwnershipState as OwnershipStateV2),
        'scout: the live ownership must publish the durable Scout injury',
      ).toBe(ownershipStateDigestV2(durableOwnership.state));
    }

    // (3) the live save publishes exactly the durable save (no live-only reward or damage)
    expect(JSON.stringify(h.env.save), `${which}: the live save must equal the durable save`)
      .toBe(JSON.stringify(saved.state));
    expect(h.env.lastPersistenceOutcome).toBe('arc9-bioscan-committed:1');
    expect(h.env.activePersist).toBeNull();
    expect(h.env.productActionInFlight).toBe(false);
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.ceremony).toHaveBeenCalledTimes(1);
    expect(h.gameEvent).toHaveBeenCalledWith('bioscan', { worldKey: key });
    // the refreshed card shows the record, not a second control
    expect(h.exec.cardState()?.kind).toBe('recorded');
    expect(h.card.querySelector('[data-bioscan-status="recorded"]')?.textContent).toContain('Life recorded');
    expect(h.bioscanButton(), 'a recorded world must not render a Discover Life control').toBeNull();
    // a second independent read of the same storage is identical
    expect(JSON.stringify(await durableSave(f))).toBe(JSON.stringify(saved));

    // (4) a stale press after the commit records nothing
    h.injectStaleBioscan().click();
    await settled(h);
    expect(h.exec.outcome(), 'a second press must not reach a second commit')
      .toBe('unavailable:presentation-or-write-authority');
    expect(await f.repository.revision(), 'a second press must not commit').toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);

    // (5) reboot a fresh F4 runtime from the committed save and re-render the card from it
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded');
    expect(f.state.surveyedSet, 'the reloaded save keeps the survey record').toEqual([key]);
    expect(f.state.hp).toBe(saved.state.hp);
    if (which === 'scout') expect(scoutHurt(f.runtime.extensions)).toBe(result!.scoutHurtAfter);
    const reloaded = mainBioscanHarness(f, mutations);
    harnesses.push(reloaded);
    expect(reloaded.exec.cardState()?.kind, 'the reloaded card must show the world as recorded').toBe('recorded');
    expect(reloaded.bioscanButton()).toBeNull();
    reloaded.injectStaleBioscan().click();
    await settled(reloaded);
    expect(reloaded.exec.outcome(), 'a press after reload must not reach a commit')
      .toBe('unavailable:presentation-or-write-authority');
    expect(await f.repository.revision()).toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);
    const reread = await durableSave(f);
    expect(JSON.stringify(reread.state)).toBe(JSON.stringify(saved.state));
  } finally {
    for (const h of harnesses) h.dom.window.close();
    await f.runtime.release();
  }
}

describe('A5 #16 — Discover Life is a UI outcome that survives reload', () => {
  it('a clear bioscan commits the survey record once, pays no damage, refuses a second press, and survives reload', async () => {
    await pressBioscanScenario('clear');
  }, 20_000);

  it('a hostile bioscan with no Scout applies the declared damage to the explorer, durably', async () => {
    await pressBioscanScenario('explorer');
  }, 20_000);

  it('a hostile bioscan with an assigned Scout lands on the Scout (explorer HP untouched), durably', async () => {
    await pressBioscanScenario('scout');
  }, 20_000);

  it('the harness card painter re-runs presentPlanetSurvey\'s exact Bioscan lines', () => {
    expect(MAIN_SOURCE.split(PRESENT_SURVEY_BIOSCAN_LINES).length - 1).toBe(1);
    expect(MAIN_BIOSCAN_SOURCE).toContain("  else if (a === 'bioscan') {\n    const recorded = await runArc9Bioscan();");
    expect(MAIN_BIOSCAN_SOURCE).toContain('async function runArc9Bioscan(): Promise<boolean> {');
  });

  /* NEGATIVE CONTROLS. Each mutant edits the executed Main source by one
   * exact unique string; the unmutated source passes the scenario above.
   * Each mutant must FAIL, with the assertion that names what broke. */
  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; which: Case; failsWith: RegExp }>> = [
    {
      mutation: {
        name: 'UNWIRED: the card click owner no longer runs the bioscan',
        needle: '    const recorded = await runArc9Bioscan();',
        replacement: '    const recorded = false;',
      },
      which: 'clear',
      failsWith: /clear: durable surveyedSet must record the scanned world exactly once/u,
    },
    {
      mutation: {
        name: 'DROPPED COMMIT: the runner never reaches the durable transaction',
        needle: '    const attempt = await commitBioscanActionV1({',
        replacement: "    const attempt = { kind: 'refused', detail: 'mutant-dropped', convergence: 'none' } as const; void ({",
      },
      which: 'explorer',
      failsWith: /explorer: durable surveyedSet must record the scanned world exactly once/u,
    },
    {
      mutation: {
        name: 'DOUBLED DAMAGE (live): the damage is applied again after publication',
        needle: '      publishBioscanActionV1(sourceState, attempt);\n',
        replacement: '      publishBioscanActionV1(sourceState, attempt);\n'
          + '      sourceState.hp = Math.max(1, sourceState.hp - attempt.settlement.damage);\n',
      },
      which: 'explorer',
      failsWith: /explorer: the live save must equal the durable save/u,
    },
    {
      mutation: {
        name: 'DOUBLED DAMAGE (durable): the commit starts from an already-damaged parent',
        needle: '      state: sourceState,\n      address: fresh.address,',
        replacement: '      state: { ...sourceState, hp: Math.max(1, sourceState.hp - fresh.projection.hazard.finalDamage) },\n'
          + '      address: fresh.address,',
      },
      which: 'explorer',
      failsWith: /explorer: durable HP must be the start HP less the declared damage/u,
    },
    {
      mutation: {
        name: 'UNPUBLISHED SCOUT INJURY: the durable Scout result never reaches the live ownership',
        needle: '        arc5OwnershipState = attempt.ownershipV2;\n        arc5OwnershipEvidence = attempt.ownershipV2Evidence;\n        arc5OwnershipProtection = null;\n        lastArc5BootstrapOutcome = \'bioscan-committed-published\';',
        replacement: '        lastArc5BootstrapOutcome = \'bioscan-committed-published\';',
      },
      which: 'scout',
      failsWith: /scout: the live ownership must publish the durable Scout injury/u,
    },
  ];

  for (const { mutation, which, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_BIOSCAN_SOURCE, mutation)).not.toThrow();
      await expect(pressBioscanScenario(which, [mutation])).rejects.toThrow(failsWith);
    }, 20_000);
  }

  it('negative control — the mutation helper refuses a drifted needle instead of running unmutated', () => {
    expect(() => replaceExact(MAIN_BIOSCAN_SOURCE, {
      name: 'drifted', needle: 'await runArc9BioscanNonexistent(', replacement: '',
    })).toThrow(/found 0/u);
  });
});

/* D14 Outposts P5 — the Field Shelter's reward, through the SAME Discover Life press on the same hostile world. */
function shelterOn133(finished: boolean): OutpostProjectsStateV1 {
  const ctx = { world: { galaxySeed: 999, starSeed: 424242, planetSeed: 133, name: 'Earth', systemPlanetSeeds: [133] }, hasFauna: true, standingHere: true };
  const facts = (landings: number) => ({ honouredCharters: ['st-comp'], research: [] as string[], landed: [133], conquered: [] as number[], landings, fedTotal: 0,
    items: { hullseg: 2, cryocap: 1, servo: 1, cell: 1, fuelcell: 1 }, stardust: 100 });
  let t = startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts(1), 'shelter', ctx, 10); if (t.kind !== 'ok') throw new Error(t.reason);
  for (const [n, landings] of (finished ? [[1, 1], [2, 1], [3, 2]] : [[1, 1], [2, 1]]) as [number, number][]) {
    t = buildOutpostStageV1(t.state, facts(landings), 'shelter@133', { standingHere: true }, 10 + n); if (t.kind !== 'ok') throw new Error(t.reason);
  }
  return t.state;
}
describe('D14 — a finished Field Shelter makes Discover Life hazard-free (P5)', () => {
  it('the hostile world declares no danger and the press wounds nobody; control: an UNFINISHED shelter protects nothing', async () => {
    for (const finished of [true, false]) {
      const f = await freshFixture(HOSTILE_SEED, undefined, shelterOn133(finished));
      const h = mainBioscanHarness(f);
      try {
        const button = h.bioscanButton();
        expect(button, 'Main must render Discover Life').not.toBeNull();
        const probability = Number(button!.dataset.bioscanProbability);
        if (finished) expect(probability, 'a sheltered world declares no danger').toBe(0);
        else expect(probability, 'control: an unfinished shelter leaves the danger').toBeGreaterThan(0);
        button!.click();
        await settled(h);
        const saved = await durableSave(f);
        expect(saved.state.surveyedSet).toEqual([h.address.key]);
        if (finished) expect(saved.state.hp, 'sheltered: the explorer is untouched').toBe(START_HP);
        else expect(saved.state.hp, 'control: the same hostile draw wounds the explorer').toBeLessThan(START_HP);
      } finally { h.dom.window.close(); await f.runtime.release(); }
    }
  }, 120_000);
});
