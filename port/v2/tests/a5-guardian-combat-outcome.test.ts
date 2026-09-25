/* A5 gap #1 (INVENTORY.md rows #55-57) and gap #9 (rows #81-82): a Guardian
 * fight through the COMBAT CARD, and the XP / achievement ledger after it —
 * UI OUTCOME tests.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. Combat moves the
 * biggest rewards (conquest, XP, Recovery, the Prime Signature) and was proven
 * only at the persistence-writer level with a stub app writer. Here the exact
 * shipped main.ts sections are sliced, type-stripped and executed with an
 * injected env (the explorer-meal / breed / scavenge pattern):
 *   - Main's §20 plan state and combat projection lets,
 *   - the Main `combatCardController` construction (the real
 *     CombatCardController wired to runArc6CombatCardAction),
 *   - projectCurrentArc6CombatSurface / refreshCombatCardState,
 *   - arc6CombatOutcomeCopy / protectArc6CombatAfterDurability /
 *     commitCurrentArc6Combat,
 *   - runArc6CombatCardAction.
 * The world is a REAL Guardian world of the home galaxy with native fauna
 * (canonicalWorldRoster over the real address); the champion is a real owned
 * companion in the committed Arc 4 / Arc 5 ownership carriers. The test presses
 * the rendered `[data-combat-challenge]` button, then reads the COMMITTED v5
 * save back from a real memory backend with readSaveV5 (twice), reboots a
 * fresh F4 runtime from that durable save, and re-renders the card from it.
 *
 * Harness glue (not shipped code): the Survey combat mount markup and the
 * attach call are showSurvey's exact lines (asserted verbatim below). Stubbed
 * externals: navigation (nav = the Guardian world's surface;
 * surveyOwnsCurrentCaptureSurface → true), the planetside preview
 * (planetsideMatchesFullRoster → true), toast, chips, panels, audio (null),
 * the Chronicle presentation (asserted called once with the committed
 * outcome; presentation is its own owner), the progression ceremony, and the
 * follow-up progression refresh queue (asserted, not executed). */
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
  ownershipContentId,
  ownershipStateDigestV2,
  sha256Hex,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { guardianAcquisitionStateDigestV1 } from '@cf/domain-acquisition/guardian-acquisition-internal';
import { guardianCompanionStateDigestV1 } from '@cf/domain-acquisition/guardian-companion-internal';
import {
  COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
  PRIME_SIGNATURE_IDS_V1,
  projectGuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { makeGenome, type Genome } from '@cf/domain-genome';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { regionAt } from '@cf/domain-strays';
import {
  canonicalCF1WorldAddressFromNav,
  navFromCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
  guardianLegacyCompanionSliceMatchesV1,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc5OwnershipMigration,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  arc6CombatOpenPolicyReasonV1,
  commitArc6CombatActionV1,
  projectArc6CombatChampionAvailabilityV1,
  projectArc6CombatChampionRosterV1,
} from '../apps/game/src/arc6-combat-action.js';
import {
  COMBAT_CARD_OUTCOME_SCHEMA,
  CombatCardController,
  projectCombatCardReadModelV1,
} from '../apps/game/src/combat-card.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_060_000;
/* Active play already accrued before the press (the Recovery deadline is measured from it). */
const START_ACTIVE_PLAY_MS = 60_000;

/* A real Guardian world of the home galaxy with native fauna (found by scanning
 * galaxyScene(999) for projectOrdinaryGuardianV1(planet) ∧ fauna > 0). */
const GUARDIAN_WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({ seed: 833203739, x: -904.6798150045797, y: -391.44599365862086 }),
  planet: Object.freeze({ seed: 3400127692 }),
});
const WORLD_TYPE = 'terran';
/* Earth: native fauna, no Guardian — its strongest native defends (a conquest). */
const EARTH_WORLD = Object.freeze({
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({ seed: 424242, x: 560, y: 170 }),
  planet: Object.freeze({ seed: 133 }),
});
interface WorldSpec { readonly spec: typeof GUARDIAN_WORLD | typeof EARTH_WORLD; readonly worldType: string }
const GUARDIAN: WorldSpec = Object.freeze({ spec: GUARDIAN_WORLD, worldType: WORLD_TYPE });
const EARTH: WorldSpec = Object.freeze({ spec: EARTH_WORLD, worldType: 'terran' });

beforeAll(() => installCaptureHooks());

interface TestWindow extends Window {
  readonly Element: typeof Element;
  readonly Event: typeof Event;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

/* ---------------- the exact shipped Main sections ---------------- */

function exactMainSection(start: string, end: string, inclusive = false): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main combat section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main combat section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, inclusive ? right + end.length : right);
}

/* showSurvey's combat mount markup and attach call, re-run by the harness. */
const SURVEY_COMBAT_MOUNT_HTML = '<section data-combat-card-body aria-label="Conquest combat"></section>';
const SURVEY_COMBAT_ATTACH = '    combatCardController.attach(combatMount);';

const MAIN_COMBAT_SOURCE = [
  // Main's combat projection and §20 plan state
  exactMainSection(
    'let currentArc6CombatProjection: Arc6CombatSurfaceProjection | null = null;',
    'let lastArc6CombatOutcome: string | null = null;\n',
    true,
  ),
  // the one Main combat controller, wired to runArc6CombatCardAction
  exactMainSection(
    'const combatCardController = new CombatCardController({',
    '    void runArc6CombatCardAction(request);\n  },\n});\n',
    true,
  ),
  // projectCurrentArc6CombatSurface, refreshCombatCardState
  exactMainSection('function projectCurrentArc6CombatSurface(', '\nfunction refreshCaptureCardState('),
  // arc6CombatOutcomeCopy, protectArc6CombatAfterDurability, commitCurrentArc6Combat
  exactMainSection('function arc6CombatOutcomeCopy(', '\nfunction presentCommittedCombatChronicle('),
  // runArc6CombatCardAction
  exactMainSection('async function runArc6CombatCardAction(', '\nfunction engineeringOutcomeConverges('),
].join('\n');

const HARNESS_SURVEY_MOUNT = `
function __harnessPresentCombatCard() {
  card.innerHTML = '${SURVEY_COMBAT_MOUNT_HTML}';
  const combatMount = card.querySelector('[data-combat-card-body]');
${SURVEY_COMBAT_ATTACH}
  refreshCombatCardState();
}`;

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

/** Exact, unique string replacement (CLAUDE.md rule 2). */
function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main combat source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

interface ExecutableMainCombat {
  readonly present: () => void;
  readonly lastOutcome: () => string | null;
  readonly controller: () => CombatCardController;
  /** The F4 heartbeat's card refresh (main.ts runs refreshCombatCardState() each owned heartbeat). */
  readonly heartbeatRefresh: () => void;
}

function executableMainCombat(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMainCombat {
  const source = mutations.reduce(replaceExact, MAIN_COMBAT_SOURCE) + HARNESS_SURVEY_MOUNT;
  const transformed = transformSync('main-combat.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    present: () => __harnessPresentCombatCard(),
    lastOutcome: () => lastArc6CombatOutcome,
    controller: () => combatCardController,
    heartbeatRefresh: () => refreshCombatCardState(),
  }; }`)(env) as ExecutableMainCombat;
}

/* ---------------- durable fixtures (real F4 runtime over a memory backend) ---------------- */

function guardianWorld(world: WorldSpec = GUARDIAN): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(world.spec);
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

const CHAMPION_ID = ownershipContentId('creature', 'a5-guardian-combat-champion') as CreatureInstanceId;

interface ChampionSpec { readonly genome: Genome; readonly xp: number }

function ownershipSource(spec: ChampionSpec) {
  const identity = canonicalGenomeIdentityV1(spec.genome);
  const discovery = createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', 'a5-guardian-combat-0') as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: 'a5-guardian-combat-0',
    legacySourceIndex: 0,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  });
  return createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({ identity, alias: null, firstObservationId: discovery.recordId })],
    discoveries: [discovery],
    creatures: [createCreatureInstanceV1({
      creatureId: CHAMPION_ID,
      speciesId: identity.speciesId,
      genomeIdentity: identity.genomeIdentity,
      genome: identity.genome,
      nickname: 'Vanguard',
      origin: 'legacy',
      acquisitionRecordId: discovery.recordId,
      lineage: { kind: 'none', generation: identity.genome.gen as number },
      xp: spec.xp,
      hurt: 0,
      fed: 0,
      brood: 0,
      assignment: null,
      bond: null,
    })],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
}

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
  readonly ownershipV2: OwnershipStateV2;
  readonly evidence: unknown;
}

async function freshFixture(spec: ChampionSpec): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`combat base save failed: ${imported.reason}`);
  const state = imported.state;
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0).state());
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(ownershipSource(spec)).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(`combat Arc 5 fixture was ${arc5.kind}`);
  const backend = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`combat v5 fixture was ${migration.kind}`);
  await backend.apply(initialSave.operations);
  return bootFromDurableSave(backend, 'first', START_ACTIVE_PLAY_MS);
}

/** Boot exactly as a document does: read the committed v5 save back from
 * storage and create the F4 runtime and ownership state from those bytes. */
/** `activePlayMs` is the TOTAL active-play clock the booted document observes
 * (the committed clock plus the play accrued since boot). */
async function bootFromDurableSave(backend: StorageBackend, tag: string, activePlayMs: number): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`combat boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`combat boot F4 authority was ${authority.kind}`);
  const ownership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`combat boot Arc 5 ownership was ${ownership.kind}`);
  const repository = createRevisionedRepository(backend);
  let monotonicNow = 0;
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-combat-${tag}-tab`, token: `a5-combat-${tag}-document`,
    leaseTtlMs: 100_000_000, now: () => monotonicNow, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`combat lease was ${heartbeat.kind}`);
  const committedMs = runtime.diagnostics().activePlayMs;
  if (activePlayMs < committedMs) throw new Error(`combat boot cannot rewind the active-play clock (${committedMs})`);
  monotonicNow = activePlayMs - committedMs;
  if (runtime.diagnostics().activePlayMs !== activePlayMs) {
    throw new Error(`combat boot active play is ${runtime.diagnostics().activePlayMs}, expected ${activePlayMs}`);
  }
  return {
    backend, repository, runtime, state: saved.state,
    ownershipV2: ownership.state, evidence: ownership.evidence,
  };
}

/* ---------------- the Main harness ---------------- */

/* combat-card.ts reads the DOM constructors from the global scope (as in a
 * browser); each harness installs its own window's, restored after the scenario. */
const priorGlobals = new Map<string, unknown>();
function installDomGlobals(window: TestWindow & Record<string, unknown>): void {
  for (const key of ['Element', 'Event', 'HTMLSelectElement', 'HTMLButtonElement']) {
    if (!priorGlobals.has(key)) priorGlobals.set(key, (globalThis as Record<string, unknown>)[key]);
    (globalThis as Record<string, unknown>)[key] = window[key];
  }
}
function restoreDomGlobals(): void {
  for (const [key, value] of priorGlobals) {
    if (value === undefined) delete (globalThis as Record<string, unknown>)[key];
    else (globalThis as Record<string, unknown>)[key] = value;
  }
  priorGlobals.clear();
}

function mainCombatHarness(f: DurableFixture, mutations: readonly MainMutation[] = [], world: WorldSpec = GUARDIAN) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section id="card" aria-label="Survey" style="display:block"></section>
  </body></html>`);
  installDomGlobals(dom.window as TestWindow & Record<string, unknown>);
  const document = dom.window.document;
  const card = document.getElementById('card')!;
  const address = guardianWorld(world);
  const nav = navFromCanonicalCF1Address(address);
  if (!nav.ok) throw new Error(nav.reason);
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const queueProgressionRefresh = vi.fn();
  const presentChronicle = vi.fn();
  const ceremony = vi.fn();
  const gameEvent = vi.fn();
  const env: Record<string, unknown> & {
    save: SaveStateV2;
    activePersist: unknown;
    productActionInFlight: boolean;
    lastPersistenceOutcome: string | null;
    arc5OwnershipState: unknown;
    arc5OwnershipProtection: unknown;
  } = {
    document,
    Element: dom.window.Element,
    card,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    // the durable authorities, exactly as boot published them
    nav: nav.state,
    lastCard: Object.freeze({ ptype: world.worldType, planetSeed: address.planet.seed }),
    save: f.state,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    arc5OwnershipState: f.ownershipV2,
    arc5OwnershipEvidence: f.evidence,
    arc5OwnershipProtection: null,
    lastArc5BootstrapOutcome: 'committed-published',
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    // write-hold flags (unrelated owners)
    activePersist: null,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    ecologyEpochBlocksActions: () => false,
    currentEcologyEpoch: () => 0,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    // navigation / Survey presentation (not under test)
    surveyOwnsCurrentCaptureSurface: () => true,
    planetsideMatchesFullRoster: () => true,
    // the real owners main.ts imports
    CombatCardController,
    COMBAT_CARD_OUTCOME_SCHEMA,
    projectCombatCardReadModelV1,
    arc6CombatOpenPolicyReasonV1,
    commitArc6CombatActionV1,
    projectArc6CombatChampionAvailabilityV1,
    projectArc6CombatChampionRosterV1,
    canonicalCF1WorldAddressFromNav,
    canonicalWorldRoster,
    canonicalGenomeIdentityV1,
    PRIME_SIGNATURE_IDS_V1,
    COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
    projectGuardianPrimeEncounterV1,
    projectWorldOpportunity,
    regionAt,
    sha256Hex,
    ownershipStateDigestV2,
    guardianAcquisitionStateDigestV1,
    guardianCompanionStateDigestV1,
    guardianLegacyCompanionSliceMatchesV1,
    readArc5OwnershipMigration,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    ARC5_OWNERSHIP_MIGRATION_VERSION,
    // presentation / neighbouring-owner externals
    tameGreetingAudioOwner: null,
    combatChronicleAudioSession: null,
    presentCommittedCombatChronicle: presentChronicle,
    presentProgressionCeremony: ceremony,
    refreshCaptureCardState: vi.fn(),
    syncCustomNameIndex: vi.fn(),
    queueArc9ProgressionRefresh: queueProgressionRefresh,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    toast,
    updateChips: vi.fn(),
    openPanelId: () => null,
    closePanels: vi.fn(),
    fillCharters: vi.fn(),
    fillCodex: vi.fn(),
    codexFilter: '',
    gameEvent,
  };
  const exec = executableMainCombat(env, mutations);
  exec.present();
  const challenge = () => card.querySelector<HTMLButtonElement>('button[data-combat-challenge]');
  const championOption = () => card.querySelector<HTMLOptionElement>(`select[data-combat-champion] option[value="${CHAMPION_ID}"]`);
  /** Choose the owned companion in the card's real champion <select> (a native change event). */
  const chooseCompanion = () => {
    const select = card.querySelector<HTMLSelectElement>('select[data-combat-champion]');
    if (select === null) throw new Error('combat card has no champion select');
    select.value = CHAMPION_ID;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  };
  return { dom, env, exec, card, championOption, chooseCompanion, toast, scheduleReload, queueProgressionRefresh, presentChronicle, ceremony, gameEvent, challenge };
}
type Harness = ReturnType<typeof mainCombatHarness>;

async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (!h.env.productActionInFlight && h.env.activePersist === null && h.exec.lastOutcome() !== 'pending') {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`combat press never settled (${String(h.exec.lastOutcome())})`);
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

function durableChampion(extensions: Parameters<typeof readArc5OwnershipMigration>[0]) {
  const ownership = readArc5OwnershipMigration(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`durable Arc 5 ownership was ${ownership.kind}`);
  const creature = ownership.state.creatures.find((row) => row.creatureId === CHAMPION_ID);
  if (creature === undefined) throw new Error('durable champion row is missing');
  return creature;
}

/* ---------------- the champions ---------------- */

/* An ordinary starter companion: the Guardian beats it (defeat → Recovery). */
const WEAK: ChampionSpec = Object.freeze({ genome: makeGenome(42, 'fauna', 0.5), xp: 0 });

/* ---------------- the scenario (also re-run against each Main mutant) ---------------- */

async function pressGuardianScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture(WEAK);
  const harnesses: Harness[] = [];
  try {
    const h = mainCombatHarness(f, mutations);
    harnesses.push(h);
    expect(h.championOption(), 'the card must offer the owned companion').not.toBeNull();
    expect(h.championOption()!.disabled).toBe(false);
    h.chooseCompanion();
    expect(h.championOption()!.selected, 'combat: choosing the companion must re-render the card with it selected').toBe(true);
    const button = h.challenge();
    expect(button, 'Main must render the Challenge control on a Guardian world').not.toBeNull();
    expect(button!.textContent).toMatch(/^Challenge /u);
    expect(button!.disabled, 'the Challenge control must be enabled').toBe(false);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.backend.keys('receipts')).toEqual([]);
    const before = durableChampion((await durableSave(f)).extensions);
    expect(before.assignment).toBeNull();
    const stardustBefore = f.state.essence;

    // Press; then a double-tap on the now-disabled control, and a forced
    // re-enabled press while the first is still in flight.
    button!.click();
    // the card re-renders its pending state: the live control is locked
    const pending = h.challenge();
    expect(pending?.disabled, 'the pressed control must lock while in flight').toBe(true);
    expect(pending?.textContent).toBe('Settling duel…');
    pending!.click();
    pending!.disabled = false;
    pending!.click();
    button!.click();
    await settled(h);

    // (1) the durable outcome, read back from the real backend
    expect(await f.repository.revision(), 'combat: pressing Challenge must commit exactly one revision').toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'combat: exactly one receipt').toHaveLength(1);
    const receipt = await f.repository.readReceipt(0);
    expect(receipt?.kind).toBe('combat-settlement');
    const saved = await durableSave(f);
    expect(h.exec.lastOutcome(), 'combat: the Guardian must defeat the starter companion')
      .toBe('committed:1:defender-win');
    // Defeat is Recovery, never loss (§20): the champion stays owned, gains no
    // wound, and is in Recovery for exactly the active-play placeholder.
    const champion = durableChampion(saved.extensions);
    expect(champion.assignment, 'combat: the defeated champion must be in durable Recovery').toEqual({
      kind: 'recovery', readyAtActivePlayMs: START_ACTIVE_PLAY_MS + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
    });
    expect(champion.hurt, 'combat: defeat adds no wound (§20)').toBe(0);
    expect(saved.state.conquered.some(([seed]) => Number(seed) === GUARDIAN_WORLD.planet.seed),
      'combat: a lost Guardian fight never conquers').toBe(false);
    expect(saved.state.essence, 'combat: a lost fight pays no Stardust').toBe(stardustBefore);
    // (XP ledger, gap #9) whatever the defeat taught is on the durable row and nowhere twice
    expect(champion.xp ?? 0).toBeGreaterThanOrEqual(before.xp ?? 0);

    // (2) the live save publishes exactly the durable save
    expect(JSON.stringify(h.env.save), 'combat: the live save must equal the durable save')
      .toBe(JSON.stringify(saved.state));
    expect(h.env.lastPersistenceOutcome).toBe('arc6-combat-committed:1');
    expect(h.env.activePersist).toBeNull();
    expect(h.env.productActionInFlight).toBe(false);
    expect(h.env.arc5OwnershipProtection).toBeNull();
    expect(ownershipStateDigestV2(h.env.arc5OwnershipState as OwnershipStateV2),
      'combat: the live ownership must equal the durable ownership')
      .toBe(ownershipStateDigestV2((readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER) as { state: OwnershipStateV2 }).state));
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.presentChronicle, 'combat: the committed fight is presented once').toHaveBeenCalledTimes(1);
    expect(h.queueProgressionRefresh).toHaveBeenCalledTimes(1);
    expect(h.queueProgressionRefresh).toHaveBeenCalledWith('arc6.combat-settlement');
    expect(h.toast).toHaveBeenCalledTimes(1);
    expect(h.toast.mock.calls[0]![1], 'combat: the player is told the champion is recovering').toContain('recovering');
    // Until the next heartbeat the settled card still shows the old model; a
    // re-press there is refused (the projection was consumed) and commits nothing.
    const stale = h.challenge();
    if (stale !== null && !stale.disabled) {
      stale.click();
      await settled(h);
      expect(await f.repository.revision(), 'combat: a re-press before the heartbeat refresh must not fight again').toBe(1);
    }
    // the heartbeat's refresh no longer offers the recovering champion
    h.exec.heartbeatRefresh();
    expect(h.championOption()?.disabled, 'combat: the card must not offer a champion in Recovery').toBe(true);
    // a second independent read of the same storage is identical
    expect(JSON.stringify(await durableSave(f))).toBe(JSON.stringify(saved));

    // (3) reboot a fresh F4 runtime from the committed save, still inside the Recovery window
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded', START_ACTIVE_PLAY_MS + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 - 1);
    expect(JSON.stringify(f.state)).toBe(JSON.stringify(saved.state));
    expect(durableChampion((await durableSave(f)).extensions).assignment).toEqual(champion.assignment);
    const reloaded = mainCombatHarness(f, mutations);
    harnesses.push(reloaded);
    expect(reloaded.championOption()?.disabled,
      'combat: after reboot the champion is still recovering on the active-play clock').toBe(true);
    reloaded.chooseCompanion(); // a forced choice of a disabled option is refused by the card
    reloaded.exec.heartbeatRefresh();
    expect(reloaded.championOption()?.selected, 'combat: Main must refuse to select a recovering champion').toBe(false);
    expect(await f.repository.revision(), 'combat: a recovering champion cannot fight again').toBe(1);

    // (4) reboot once the Recovery elapsed on the ACTIVE-PLAY clock: the same
    // companion is offered again and its next Challenge is a new, second fight.
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'recovered', START_ACTIVE_PLAY_MS + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1);
    const recovered = mainCombatHarness(f, mutations);
    harnesses.push(recovered);
    expect(recovered.championOption()?.disabled,
      'combat: Recovery ends on the active-play clock and the champion can fight again').toBe(false);
    recovered.chooseCompanion();
    const again = recovered.challenge();
    expect(again?.disabled, 'combat: the recovered champion\'s Challenge must be enabled').toBe(false);
    again!.click();
    await settled(recovered);
    expect(await f.repository.revision(), 'combat: the second fight commits one more revision').toBe(2);
    expect(await f.backend.keys('receipts')).toHaveLength(2);
    const second = await durableSave(f);
    expect(JSON.stringify(recovered.env.save)).toBe(JSON.stringify(second.state));
  } finally {
    for (const h of harnesses) { h.exec.controller().dispose(); h.dom.window.close(); }
    restoreDomGlobals();
    await f.runtime.release();
  }
}


/* A companion that beats Earth's strongest native (found by a runDuel search). */
const STRONG: ChampionSpec = Object.freeze({ genome: makeGenome(5, 'fauna', 0.9), xp: 0 });

interface Witness {
  readonly outcome: string;
  readonly conquest: { readonly status: string };
  readonly xp: { readonly status: string; readonly amount?: number };
  readonly rewards: { readonly stardust: { readonly status: string; readonly amount: number } };
}

/* Gap #9: the XP / achievement / Stardust ledger read back after the UI action. */
async function pressConquestScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture(STRONG);
  const harnesses: Harness[] = [];
  try {
    const h = mainCombatHarness(f, mutations, EARTH);
    harnesses.push(h);
    h.chooseCompanion();
    const before = durableChampion((await durableSave(f)).extensions);
    const stateBefore = f.state;
    h.challenge()!.click();
    await settled(h);

    expect(await f.repository.revision(), 'conquest: pressing Challenge must commit exactly one revision').toBe(1);
    const receipt = await f.repository.readReceipt(0);
    expect(receipt?.kind).toBe('combat-settlement');
    const witness = JSON.parse(String((receipt as { witness?: unknown }).witness)) as Witness;
    expect(witness.outcome, 'conquest: the strong companion must win').toBe('champion-win');
    expect(h.exec.lastOutcome()).toBe('committed:1:champion-win');
    const saved = await durableSave(f);
    const champion = durableChampion(saved.extensions);
    // the world is durably conquered
    expect(witness.conquest.status).toBe('settle');
    expect(saved.state.conquered.some(([seed]) => Number(seed) === 133), 'conquest: the world must be durably conquered').toBe(true);
    // XP: the durable champion row gained exactly the planned award, once
    expect(witness.xp.status).toBe('award');
    expect(witness.xp.amount).toBeGreaterThan(0);
    expect(champion.xp, 'conquest: the durable champion gained exactly the awarded XP').toBe((before.xp ?? 0) + witness.xp.amount!);
    expect(champion.assignment, 'a winner is not in Recovery').toBeNull();
    // Stardust ledger: balance and lifetime earnings moved by exactly the award
    expect(saved.state.essence, 'conquest: durable Stardust moved by exactly the award')
      .toBe(stateBefore.essence + witness.rewards.stardust.amount);
    expect(saved.state.stats.essenceEarned ?? 0).toBe((stateBefore.stats.essenceEarned ?? 0) + witness.rewards.stardust.amount);
    // achievement ledger: the first conquest durably unlocks the Settler achievement, once
    const added = saved.state.unlocked.slice(stateBefore.unlocked.length);
    expect(added, 'conquest: the first conquest must durably unlock settle1').toContain('settle1');
    expect(new Set(saved.state.unlocked).size, 'no achievement is unlocked twice').toBe(saved.state.unlocked.length);
    expect(h.ceremony, 'conquest: one ceremony').toHaveBeenCalledTimes(1);
    const ceremony = h.ceremony.mock.calls[0]![0] as { revision: number; nextUnlockedIds: readonly string[]; addedAchievementIds: readonly string[] };
    expect(ceremony.revision).toBe(1);
    expect(ceremony.nextUnlockedIds, 'conquest: the ceremony must read the committed unlocks').toEqual(saved.state.unlocked);
    expect(ceremony.addedAchievementIds).toContain('settle1');
    expect(h.gameEvent).toHaveBeenCalledWith('conquest', expect.objectContaining({ outcome: 'champion-win' }));
    expect(JSON.stringify(h.env.save), 'conquest: the live save must equal the durable save').toBe(JSON.stringify(saved.state));

    // reboot: the ledger is what storage says, and a conquered world offers no second fight
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'conquered', START_ACTIVE_PLAY_MS + 1);
    expect(JSON.stringify(f.state)).toBe(JSON.stringify(saved.state));
    expect(durableChampion((await durableSave(f)).extensions).xp).toBe(champion.xp);
    const reloaded = mainCombatHarness(f, mutations, EARTH);
    harnesses.push(reloaded);
    expect(reloaded.challenge(), 'conquest: a conquered world can never be re-won (no card)').toBeNull();
    expect(await f.repository.revision()).toBe(1);
  } finally {
    for (const h of harnesses) { h.exec.controller().dispose(); h.dom.window.close(); }
    restoreDomGlobals();
    await f.runtime.release();
  }
}

describe('A5 #55-57 — a Guardian fight through the combat card is a durable UI outcome', () => {
  it('the fixture world is a real Guardian world with native fauna', () => {
    const address = guardianWorld();
    const roster = canonicalWorldRoster(address, 0);
    if (!roster.ok) throw new Error('roster');
    const fauna = roster.roster.view.all.filter((row) => row.kingdom === 'fauna')
      .map((row) => ({ speciesId: canonicalGenomeIdentityV1(row).speciesId, genome: row as never }));
    expect(fauna.length).toBeGreaterThan(0);
    const encounter = projectGuardianPrimeEncounterV1({
      world: address, descriptor: { worldType: WORLD_TYPE },
      regionIndex: regionAt(address.galaxy.x, address.galaxy.y),
      faunaRoster: fauna, claimedSignatureIds: [], conquered: false,
    });
    expect(encounter?.defender.kind).toBe('guardian');
  });

  it('a pressed Challenge commits one Guardian fight exactly once: the defeated champion is in durable Recovery (no wound), survives re-read and reboot, and fights again only after Recovery on the active-play clock', async () => {
    await pressGuardianScenario();
  }, 60_000);

  it('A5 #81-82 — a pressed conquest pays XP, Stardust and the Settler achievement exactly once into the durable ledger, announced from the committed unlocks, and survives reboot', async () => {
    await pressConquestScenario();
  }, 60_000);

  it('negative control — CEREMONY FROM STALE LEDGER: the ceremony reads the pre-fight unlocks', async () => {
    const mutation: MainMutation = {
      name: 'stale ceremony', needle: '        nextUnlockedIds: verification.state.unlocked,',
      replacement: '        nextUnlockedIds: progressionUnlockedBefore,',
    };
    await expect(pressConquestScenario([mutation])).rejects.toThrow(/conquest: the ceremony must read the committed unlocks/u);
  }, 60_000);

  it('negative control — UNPUBLISHED CONQUEST: the verified save is never published', async () => {
    const mutation: MainMutation = { name: 'unpublished', needle: '      save = verification.state;', replacement: '      void verification.state;' };
    await expect(pressConquestScenario([mutation])).rejects.toThrow(/conquest: the live save must equal the durable save/u);
  }, 60_000);

  it('the harness Survey mount re-runs showSurvey\'s exact combat mount lines', () => {
    expect(MAIN_SOURCE.split(`? '${SURVEY_COMBAT_MOUNT_HTML}'`).length - 1).toBe(1);
    expect(MAIN_SOURCE.split(`\n${SURVEY_COMBAT_ATTACH}\n`).length - 1).toBe(1);
    expect(MAIN_COMBAT_SOURCE).toContain('void runArc6CombatCardAction(request);');
    expect(MAIN_COMBAT_SOURCE).toContain('async function commitCurrentArc6Combat(');
  });

  /* NEGATIVE CONTROLS. Each mutant edits the executed Main source by one exact
   * unique string; each must FAIL with the assertion that names what broke. */
  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; failsWith: RegExp }>> = [
    {
      mutation: {
        name: 'UNWIRED: the card press never reaches runArc6CombatCardAction',
        needle: '    void runArc6CombatCardAction(request);',
        replacement: '    void request;',
      },
      failsWith: /combat: pressing Challenge must commit exactly one revision/u,
    },
    {
      mutation: {
        name: 'UNWIRED SELECT: the champion choice never reaches Main (the explorer fights instead)',
        needle: '      currentArc6ChampionId = request.championId;',
        replacement: '      void request.championId;',
      },
      failsWith: /combat: choosing the companion must re-render the card with it selected/u,
    },
    {
      mutation: {
        name: 'DROPPED COMMIT: the action never reaches the durable combat transaction',
        needle: '    attempt = await commitArc6CombatActionV1({',
        replacement: "    attempt = { kind: 'refused', detail: 'mutant-dropped', convergence: 'none', durability: 'none', transaction: null } as never; void ({",
      },
      failsWith: /combat: pressing Challenge must commit exactly one revision/u,
    },
    {
      mutation: {
        name: 'UNPUBLISHED: the verified save is never published to the live game',
        needle: '      save = verification.state;',
        replacement: '      void verification.state;',
      },
      failsWith: /combat: the live save must equal the durable save/u,
    },
    {
      mutation: {
        name: 'STALE OWNERSHIP: the committed ownership is never published (the card would re-offer a recovering champion)',
        needle: '      arc5OwnershipState = loadedOwnership.state;',
        replacement: '      void loadedOwnership.state;',
      },
      failsWith: /combat: the live ownership must equal the durable ownership/u,
    },
  ];

  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_COMBAT_SOURCE, mutation)).not.toThrow();
      await expect(pressGuardianScenario([mutation])).rejects.toThrow(failsWith);
    }, 60_000);
  }

  it('negative control — the mutation helper refuses a drifted needle instead of running unmutated', () => {
    expect(() => replaceExact(MAIN_COMBAT_SOURCE, {
      name: 'drifted', needle: 'void runArc6CombatCardActionNonexistent(', replacement: '',
    })).toThrow(/found 0/u);
  });
});
