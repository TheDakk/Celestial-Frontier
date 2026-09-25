/* A5 gap #3 (INVENTORY.md row #42, "Top gap"): Compendium Breed — UI OUTCOME test.

   CLAUDE.md rule 7: assert the OUTCOME, not the code path. The direct tests in
   arc5-breed-action.test.ts call commitArc5BreedActionV1() themselves, so they
   stay green even if the shipped Compendium never reaches it. Here the exact
   shipped main.ts sections (the Breed module-level result cells, the
   CompendiumBreedController wiring, its projector, currentCompendiumDetailRow,
   and the Breed writer/copy/presentation chain) are sliced, type-stripped and
   executed with an injected env (the explorer-meal-action.test.ts pattern).
   The test selects both parents and presses `[data-arc5-breed-confirm]` in
   JSDOM, then reads the COMMITTED v5 save back from a real memory backend with
   readSaveV5 (twice), reboots a fresh F4 runtime from exactly that save, and
   re-renders the Compendium Breed body from it.

   Rules asserted (BREEDING_AND_SHARING.md): nonlethal — both parents stay
   owned and enter active-play Recovery (8 min success / 2 min failure); the
   child gets half the lower parent's `fed`; +2 XP newborn, +5 XP for the first
   exact species pair only; a press during Recovery is refused.

   Only what the sections need from outside is stubbed: toast / ceremony /
   chips / progression-refresh sinks, the unrelated write-hold flags, and
   refreshCompendiumFeedState (reduced to re-projecting this one controller,
   as explorer-meal-action.test.ts does). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import {
  ARC5_BREED_FAILURE_RECOVERY_MS_V1,
  ARC5_BREED_SUCCESS_RECOVERY_MS_V1,
  arc5BreedSpeciesPairXpKeyV1,
  companionBreedOddsV1,
} from '@cf/domain-acquisition/breed-internal';
import { createSessionRNG, DOMAINS } from '@cf/domain-sessionrng';
import {
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
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
  type V5Extensions,
} from '@cf/persistence';
import {
  commitArc5BreedActionV1,
  publishArc5BreedSaveFieldsV1,
} from '../apps/game/src/arc5-breed-action.js';
import {
  COMPENDIUM_BREED_OUTCOME_SCHEMA,
  CompendiumBreedController,
  projectCompendiumBreedV1,
  type CompendiumBreedActionRequestV1,
  type CompendiumBreedReadModelV1,
} from '../apps/game/src/compendium-breed.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_070_000;
const START_ACTIVE_PLAY_MS = 60_000;
const GENERATION = 7;

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
    throw new Error(`Main Breed section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Breed section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

const MAIN_BREED_SOURCE = [
  // the module-level Breed outcome/result cells
  exactMainSection(
    'let lastArc5BreedOutcome: string | null = null;',
    '\nlet lastArc5RenameOutcome: string | null = null;',
  ),
  // the Compendium Breed controller and its onAction owner
  exactMainSection(
    'const compendiumBreedController = new CompendiumBreedController({',
    '\nconst compendiumRenameController = new CompendiumRenameController({',
  ),
  // the live projector
  exactMainSection(
    'function projectCurrentCompendiumBreed(',
    '\nfunction projectCurrentCompendiumRename(',
  ),
  // the Compendium detail row resolver the writer re-verifies against
  exactMainSection(
    'function currentCompendiumDetailRow(): [string, CodexRecord] | null {',
    '\nfunction refreshCompendiumFeedState(): void {',
  ),
  // request verification, the sole Breed writer, its copy and presentation
  exactMainSection(
    'type Arc5BreedCommitOutcome =',
    '\ntype Arc5RenameCommitOutcome =',
  ),
].join('\n');

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

/** Exact, unique string replacement (CLAUDE.md rule 2): a drifted needle must
 * fail loudly, never silently leave the control unmutated. */
function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main Breed source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

type BreedRow = readonly [string, Readonly<{ id: string; name: string; g: Record<string, unknown> }>];

interface ExecutableMainBreed {
  readonly controller: CompendiumBreedController;
  readonly projectCurrent: (row: BreedRow, generation: number) => CompendiumBreedReadModelV1 | null;
  readonly commit: (request: CompendiumBreedActionRequestV1) => Promise<Readonly<{ kind: string; detail: string }>>;
  readonly outcome: () => string | null;
  readonly result: () => Readonly<Record<string, unknown>> | null;
}

function executableMainBreed(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMainBreed {
  const source = mutations.reduce(replaceExact, MAIN_BREED_SOURCE);
  const transformed = transformSync('main-breed.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    controller: compendiumBreedController,
    projectCurrent: projectCurrentCompendiumBreed,
    commit: commitCompendiumBreedAction,
    outcome: () => lastArc5BreedOutcome,
    result: () => lastArc5BreedResult,
  }; }`)(env) as ExecutableMainBreed;
}

/* ---------------- durable fixtures (real F4 runtime over a memory backend) ---------------- */

function sessionSeedFor(predicate: (first: number, second: number) => boolean): number {
  for (let seed = 0; seed < 200_000; seed++) {
    const rng = createSessionRNG(seed);
    if (predicate(rng.at(DOMAINS.breedOutcome, 0), rng.at(DOMAINS.breedOutcome, 1))) return seed;
  }
  throw new Error('no bounded SessionRNG control seed found');
}

/* 0.08 is the domain's floor odds, so these draws succeed for any pair. */
const SUCCESS_TWICE_SEED = sessionSeedFor((first, second) => first < 0.08 && second < 0.08);
/* 0.97 is the domain's ceiling odds, so this draw fails for any pair. */
const FAILURE_SEED = sessionSeedFor((first) => first >= 0.97);

const LEFT_GENOME = makeGenome(11, 'fauna', 0.45);
const RIGHT_GENOME = makeGenome(22, 'fauna', 0.65);
const LEFT_ID = ownershipContentId('creature', 'a5-breed-outcome-left') as CreatureInstanceId;
const RIGHT_ID = ownershipContentId('creature', 'a5-breed-outcome-right') as CreatureInstanceId;
const LEFT_FED = 80;
const RIGHT_FED = 30;
const PARENT_XP = 7;

function ownershipSource() {
  const identities = [canonicalGenomeIdentityV1(LEFT_GENOME), canonicalGenomeIdentityV1(RIGHT_GENOME)] as const;
  const discoveries = identities.map((identity, index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `a5-breed-outcome-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `a5-breed-outcome-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: true,
  }));
  const creature = (id: CreatureInstanceId, index: 0 | 1) => createCreatureInstanceV1({
    creatureId: id,
    speciesId: identities[index].speciesId,
    genomeIdentity: identities[index].genomeIdentity,
    genome: identities[index].genome,
    nickname: index === 0 ? 'Aster' : 'Comet',
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: identities[index].genome.gen as number },
    xp: PARENT_XP,
    hurt: 0,
    fed: index === 0 ? LEFT_FED : RIGHT_FED,
    brood: index === 0 ? 3 : 4,
    assignment: null,
    bond: null,
  });
  return createInitialOwnershipStateV1({
    catalogSpecies: identities.map((identity, index) => createCatalogSpeciesV1({
      identity, alias: null, firstObservationId: discoveries[index]!.recordId,
    })),
    discoveries,
    creatures: [creature(LEFT_ID, 0), creature(RIGHT_ID, 1)],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: null,
  });
}

/** The Compendium detail row for the left parent's species (a real fauna record). */
const ROW: BreedRow = Object.freeze([
  'a5-breed-outcome-left',
  Object.freeze({ id: 'a5-breed-outcome-left', name: 'Aster species', g: LEFT_GENOME as unknown as Record<string, unknown> }),
] as const);

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
  readonly ownershipV2: OwnershipStateV2;
  readonly evidence: unknown;
  readonly setNow: (value: number) => void;
}

async function fixtureAt(sessionSeed: number): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`breed base save failed: ${imported.reason}`);
  const state: SaveStateV2 = { ...imported.state, stats: { ...imported.state.stats, essenceEarned: 750 } };
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(sessionSeed).state());
  const arc4: V5Extensions = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(ownershipSource()).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(`breed Arc 5 fixture was ${arc5.kind}`);
  const backend = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`breed v5 fixture was ${migration.kind}`);
  await backend.apply(initialSave.operations);
  const repository = createRevisionedRepository(backend);
  let monotonicNow = 0;
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: arc5.extensions, initialState: initialSave.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 0,
    ownerId: 'a5-breed-tab', token: 'a5-breed-document',
    leaseTtlMs: 10_000_000, now: () => monotonicNow, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`breed lease was ${heartbeat.kind}`);
  monotonicNow = START_ACTIVE_PLAY_MS; // one minute of eligible active play before the press
  return {
    backend, repository, runtime, state: initialSave.canonicalState,
    ownershipV2: arc5.state, evidence: arc5.evidence,
    setNow: (value) => { monotonicNow = value; },
  };
}

/** A reload: release the first document's lease, read the committed v5 save
 * back from storage, and boot a fresh F4 runtime from exactly that save. */
async function rebootFromDurableSave(previous: DurableFixture): Promise<DurableFixture> {
  await previous.runtime.release();
  const saved = await readSaveV5(previous.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`reload read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`reload F4 authority was ${authority.kind}`);
  const ownership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`reload Arc 5 ownership was ${ownership.kind}`);
  const repository = createRevisionedRepository(previous.backend);
  let monotonicNow = 0;
  const runtime = createF4RuntimeAuthority({
    backend: previous.backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: 'a5-breed-reloaded-tab', token: 'a5-breed-reloaded-document',
    leaseTtlMs: 10_000_000, now: () => monotonicNow, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`reloaded breed lease was ${heartbeat.kind}`);
  return {
    backend: previous.backend, repository, runtime, state: saved.state,
    ownershipV2: ownership.state, evidence: ownership.evidence,
    setNow: (value) => { monotonicNow = value; },
  };
}

/* ---------------- the Main harness ---------------- */

function mainBreedHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" aria-label="Compendium" style="display:block">
      <div data-sel="codex-detail">
        <section class="compendium-feed" data-arc5-breed-body aria-label="Breed companions"></section>
      </div>
    </aside>
  </body></html>`);
  const document = dom.window.document;
  const scheduleReload = vi.fn();
  const ceremony = vi.fn();
  const progressionRefresh = vi.fn();
  const toast = vi.fn();
  const env: Record<string, unknown> & {
    save: SaveStateV2;
    arc5OwnershipState: OwnershipStateV2 | null;
    arc5OwnershipEvidence: unknown;
    arc5OwnershipProtection: string | null;
    activePersist: unknown;
    productActionInFlight: boolean;
    lastPersistenceOutcome: string | null;
    lastArc5BootstrapOutcome: string | null;
    refreshCompendiumFeedState: () => void;
  } = {
    document,
    CompendiumBreedController,
    projectCompendiumBreedV1,
    COMPENDIUM_BREED_OUTCOME_SCHEMA,
    codexGeneration: GENERATION,
    codexMode: 'detail',
    codexDetailLogicalId: ROW[0],
    openPanelId: () => 'codex',
    activeCodexSource: () => [ROW],
    compendiumFixtureRows: null,
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
    ARC5_OWNERSHIP_MIGRATION_VERSION,
    ARC5_OWNERSHIP_EXTENSION_TARGETS,
    ownershipStateDigestV1,
    ownershipStateDigestV2,
    ownershipSourceStateV1,
    companionBreedOddsV1,
    activePersist: null,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    commitArc5BreedActionV1,
    publishArc5BreedSaveFieldsV1,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    lastArc5BootstrapOutcome: null,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    presentProgressionCeremony: ceremony,
    queueArc9ProgressionRefresh: progressionRefresh,
    toast,
    fillCharters: vi.fn(),
    updateChips: vi.fn(),
    refreshCompendiumFeedState: () => undefined,
  };
  const exec = executableMainBreed(env, mutations);
  // Main's refresh re-projects every Compendium controller; this body mounts only Breed.
  env.refreshCompendiumFeedState = () => {
    exec.controller.setState(exec.projectCurrent(ROW, GENERATION));
    exec.controller.refresh();
  };
  const mount = document.querySelector<HTMLElement>('[data-arc5-breed-body]')!;
  // fillCodexDetail: setState(projected) then attach(the declared body)
  exec.controller.setState(exec.projectCurrent(ROW, GENERATION));
  exec.controller.attach(mount);
  return { dom, env, exec, mount, scheduleReload, ceremony, progressionRefresh, toast };
}
type Harness = ReturnType<typeof mainBreedHarness>;

function parentRadio(h: Harness, kind: 'primary' | 'mate', id: string): HTMLInputElement | null {
  return h.mount.querySelector<HTMLInputElement>(
    `input[data-arc5-breed-choice="${kind}"][data-arc5-breed-creature-id="${id}"]`,
  );
}
function confirmButton(h: Harness): HTMLButtonElement | null {
  return h.mount.querySelector<HTMLButtonElement>('[data-arc5-breed-confirm]');
}

/** Choose this detail's companion and a distinct mate with native radio clicks. */
function chooseParents(h: Harness, leftId: string, rightId: string): HTMLButtonElement {
  const primary = parentRadio(h, 'primary', leftId);
  expect(primary, 'Main must render the detail companion as a primary parent choice').not.toBeNull();
  expect(primary!.disabled, 'the ready detail companion must be selectable').toBe(false);
  primary!.click();
  const mate = parentRadio(h, 'mate', rightId); // the controller re-rendered the body
  expect(mate, 'Main must render the second companion as a mate choice').not.toBeNull();
  expect(mate!.disabled, 'the ready mate must be selectable').toBe(false);
  mate!.click();
  const confirm = confirmButton(h);
  expect(confirm, 'Main must render the Breed confirm control').not.toBeNull();
  expect(confirm!.textContent).toBe('Confirm Breed');
  expect(confirm!.disabled, 'two distinct ready parents must enable Confirm Breed').toBe(false);
  return confirm!;
}

/** Wait until the press the shipped controller started has fully settled. */
async function settled(h: Harness): Promise<void> {
  await vi.waitFor(() => {
    if (h.exec.controller.diagnostics().pendingWork !== 0 || h.exec.outcome() === 'pending') {
      throw new Error('Breed still pending');
    }
  }, { timeout: 5_000, interval: 2 });
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

async function durableOwnership(backend: StorageBackend) {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable read was ${saved.kind}`);
  const ownership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`durable Arc 5 ownership was ${ownership.kind}`);
  return { saved, ownership: ownership.state };
}

function creature(ownership: OwnershipStateV2, id: string) {
  return ownership.creatures.find((row) => row.creatureId === id);
}

/** Every rendered parent radio for `id` is disabled and names its Recovery. */
function expectRecoveryShown(h: Harness, id: string, remaining: string, message: string): void {
  const radios = [...h.mount.querySelectorAll<HTMLInputElement>(`input[data-arc5-breed-creature-id="${id}"]`)];
  expect(radios.length, `${message}: the parent must still be rendered (nonlethal)`).toBeGreaterThan(0);
  for (const radio of radios) {
    expect(radio.disabled, `${message}: a recovering parent must not be selectable`).toBe(true);
    expect(radio.title, message).toBe(
      `Recovery ${remaining} active play remaining; Breed, combat, and dispatch are locked.`,
    );
  }
}

/* ---------------- scenarios (also re-run against each Main mutant) ---------------- */

const PAIR_KEY = arc5BreedSpeciesPairXpKeyV1(
  canonicalGenomeIdentityV1(LEFT_GENOME).speciesId,
  canonicalGenomeIdentityV1(RIGHT_GENOME).speciesId,
);

async function successPressScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await fixtureAt(SUCCESS_TWICE_SEED);
  const harnesses: Harness[] = [];
  try {
    const h = mainBreedHarness(f, mutations);
    harnesses.push(h);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.backend.keys('receipts')).toEqual([]);
    const confirm = chooseParents(h, LEFT_ID, RIGHT_ID);
    const summary = h.mount.querySelector<HTMLElement>('[data-arc5-breed-summary]');
    expect(summary?.dataset.parentA).toBe(LEFT_ID);
    expect(summary?.dataset.parentB).toBe(RIGHT_ID);
    expect(summary?.textContent).toContain('Both parents remain yours. Success gives 8 active-play minutes of Recovery; failure gives 2.');

    // a double-tap: the second press lands on the refilled, now-disabled control
    confirm.click();
    expect(h.exec.outcome(), 'the press must reach Main\'s Breed writer').toBe('pending');
    expect(h.mount.getAttribute('aria-busy')).toBe('true');
    const refilled = confirmButton(h);
    expect(refilled?.disabled, 'the pending refill keeps Confirm Breed, disabled').toBe(true);
    refilled!.click();
    confirm.click(); // the detached pre-refill node
    await settled(h);

    // (1) exactly one durable outcome
    expect(h.exec.outcome(), 'the confirmed Breed must commit exactly one success').toBe('committed:success:1');
    expect(await f.repository.revision(), 'Confirm Breed must commit exactly one revision').toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'Confirm Breed must commit exactly one receipt').toHaveLength(1);
    const first = await durableOwnership(f.backend);
    expect(readF4Authority(first.saved.extensions), 'exactly one breed outcome draw is durable').toEqual({
      kind: 'loaded',
      authority: {
        activePlayMs: START_ACTIVE_PLAY_MS,
        sessionRng: { seed: SUCCESS_TWICE_SEED, ordinal: 1, draws: { [DOMAINS.breedOutcome]: 1 } },
      },
    });
    const readyAt = START_ACTIVE_PLAY_MS + ARC5_BREED_SUCCESS_RECOVERY_MS_V1;
    const ownership = first.ownership;
    expect(ownership.creatures, 'the committed save must hold both parents and the child').toHaveLength(3);
    for (const id of [LEFT_ID, RIGHT_ID]) {
      const parent = creature(ownership, id);
      expect(parent, 'breeding is nonlethal: both parents remain owned in the committed save').toBeDefined();
      expect(parent!.assignment, 'each parent must carry the durable 8-minute active-play Recovery')
        .toEqual({ kind: 'recovery', readyAtActivePlayMs: readyAt });
      expect(parent!.xp).toBe(PARENT_XP);
    }
    expect(creature(ownership, LEFT_ID)!.fed).toBe(LEFT_FED);
    expect(creature(ownership, RIGHT_ID)!.fed).toBe(RIGHT_FED);
    const child = ownership.creatures.find((row) => row.creatureId !== LEFT_ID && row.creatureId !== RIGHT_ID)!;
    expect(child.origin).toBe('bred');
    expect(child.fed, 'the child gets half the lower parent\'s fed').toBe(Math.floor(Math.min(LEFT_FED, RIGHT_FED) / 2));
    expect(child.xp, 'the newborn gets +2 XP plus the one-time +5 first-pair XP').toBe(2 + 5);
    expect(child.assignment).toBeNull();
    expect(first.saved.state.xpFirsts, 'the first-pair XP key is durably claimed').toEqual([PAIR_KEY]);
    expect(first.saved.state.ascProg['c3-breed'], 'the hybrid-bloodline Charter tally is durable').toBe(1);

    // the live copy published exactly the durable fixed point
    expect(h.env.save.xpFirsts, 'the live save must publish the durable XP-first claim').toEqual([PAIR_KEY]);
    expect(h.env.save.ascProg['c3-breed'], 'the live save must publish the durable Charter tally').toBe(1);
    expect(h.env.arc5OwnershipState, 'the live ownership must be the committed successor').not.toBeNull();
    expect(ownershipStateDigestV2(h.env.arc5OwnershipState!), 'the live ownership must publish the committed successor')
      .toBe(ownershipStateDigestV2(ownership));
    expect(h.env.arc5OwnershipProtection).toBeNull();
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.env.lastPersistenceOutcome).toBe('arc5-breed-committed:1');
    expect(h.env.activePersist).toBeNull();
    expect(h.env.productActionInFlight).toBe(false);
    expect(h.progressionRefresh).toHaveBeenCalledWith('arc5.companion-breed');
    expect(h.exec.result()).toMatchObject({ result: 'success', childCreatureId: child.creatureId, childXpAwarded: 7 });
    const status = h.mount.querySelector<HTMLElement>('[data-arc5-breed-status]');
    expect(status?.dataset.kind).toBe('committed-success');
    expect(status?.textContent).toContain('New bloodline secured.');
    expect(status?.textContent).toContain('Both parents remain yours and enter 8 active-play minutes of Recovery.');
    expectRecoveryShown(h, LEFT_ID, '8:00', 'the refreshed Compendium must show the detail parent in Recovery');
    expectRecoveryShown(h, RIGHT_ID, '8:00', 'the refreshed Compendium must show the mate in Recovery');
    expect(confirmButton(h), 'no Breed confirm is offered while the detail parent recovers').toBeNull();
    // a second read of the same storage is identical
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW))).toBe(JSON.stringify(first.saved));

    // (2) a second press during Recovery is refused: the exact captured request replayed through Main's writer
    const captured = h.exec.controller.diagnostics().lastRequest!;
    const replay = await h.exec.commit(captured);
    expect(replay.kind, 'a replayed Breed during Recovery must be refused').toBe('unavailable');
    expect(await f.repository.revision(), 'a replayed Breed must not commit').toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);

    // (3) reload: boot a fresh runtime from the committed save and re-render Breed from it
    f = await rebootFromDurableSave(f);
    expect(f.runtime.diagnostics().activePlayMs).toBe(START_ACTIVE_PLAY_MS);
    expect(ownershipStateDigestV2(f.ownershipV2), 'the reloaded ownership is the committed successor')
      .toBe(ownershipStateDigestV2(ownership));
    expect(f.state.xpFirsts).toEqual([PAIR_KEY]);
    const reloaded = mainBreedHarness(f, mutations);
    harnesses.push(reloaded);
    expectRecoveryShown(reloaded, LEFT_ID, '8:00', 'the reloaded Compendium must still show the detail parent in Recovery');
    expectRecoveryShown(reloaded, RIGHT_ID, '8:00', 'the reloaded Compendium must still show the mate in Recovery');
    expect(confirmButton(reloaded)).toBeNull();
    // the durable Recovery also binds the shipped domain writer after reload
    const refused = await commitArc5BreedActionV1({
      runtime: f.runtime, ownershipV2: f.ownershipV2, state: f.state,
      parentCreatureIds: [LEFT_ID, RIGHT_ID], codecNow: NOW,
    });
    expect(refused.kind, 'the reloaded Recovery must refuse a second Breed').toBe('refused');
    expect(await f.repository.revision()).toBe(1);

    // Recovery is active-play time: one millisecond short still locks, the boundary releases
    f.setNow(ARC5_BREED_SUCCESS_RECOVERY_MS_V1 - 1);
    reloaded.env.refreshCompendiumFeedState();
    expectRecoveryShown(reloaded, LEFT_ID, '0:01', 'Recovery must hold until its active-play boundary');
    f.setNow(ARC5_BREED_SUCCESS_RECOVERY_MS_V1);
    reloaded.env.refreshCompendiumFeedState();
    const again = chooseParents(reloaded, LEFT_ID, RIGHT_ID);
    again.click();
    await settled(reloaded);
    expect(reloaded.exec.outcome(), 'the same pair breeds again after Recovery').toBe('committed:success:2');
    const second = await durableOwnership(f.backend);
    expect(second.ownership.creatures).toHaveLength(4);
    const secondChild = second.ownership.creatures.find((row) => (
      row.creatureId !== LEFT_ID && row.creatureId !== RIGHT_ID && row.creatureId !== child.creatureId
    ))!;
    expect(secondChild.xp, 'a repeat of the exact species pair pays only the +2 newborn XP').toBe(2);
    expect(second.saved.state.xpFirsts, 'the pair key is claimed once').toEqual([PAIR_KEY]);
    expect(creature(second.ownership, LEFT_ID)!.assignment).toEqual({
      kind: 'recovery', readyAtActivePlayMs: readyAt + ARC5_BREED_SUCCESS_RECOVERY_MS_V1,
    });
  } finally {
    for (const h of harnesses) { h.exec.controller.dispose(); h.dom.window.close(); }
    await f.runtime.release();
  }
}

async function failurePressScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await fixtureAt(FAILURE_SEED);
  const harnesses: Harness[] = [];
  try {
    const h = mainBreedHarness(f, mutations);
    harnesses.push(h);
    const before = await readSaveV5(f.backend, REGISTRY, NOW);
    if (before.kind !== 'loaded') throw new Error(`pre-press read was ${before.kind}`);
    chooseParents(h, LEFT_ID, RIGHT_ID).click();
    expect(h.exec.outcome(), 'the press must reach Main\'s Breed writer').toBe('pending');
    await settled(h);

    expect(h.exec.outcome(), 'the confirmed Breed must commit exactly one failure').toBe('committed:failure:1');
    expect(await f.repository.revision()).toBe(1);
    expect(await f.backend.keys('receipts')).toHaveLength(1);
    const { saved, ownership } = await durableOwnership(f.backend);
    expect(ownership.creatures, 'a failed pairing adds no child and loses no parent').toHaveLength(2);
    const readyAt = START_ACTIVE_PLAY_MS + ARC5_BREED_FAILURE_RECOVERY_MS_V1;
    for (const id of [LEFT_ID, RIGHT_ID]) {
      expect(creature(ownership, id)!.assignment, 'each parent must carry the durable 2-minute Recovery')
        .toEqual({ kind: 'recovery', readyAtActivePlayMs: readyAt });
    }
    expect(creature(ownership, LEFT_ID)!.fed).toBe(LEFT_FED);
    expect(saved.state.xpFirsts, 'a failure claims no first-pair XP').toEqual([]);
    expect(JSON.stringify(saved.state), 'a failure changes no save field').toBe(JSON.stringify(before.state));
    const status = h.mount.querySelector<HTMLElement>('[data-arc5-breed-status]');
    expect(status?.dataset.kind).toBe('committed-failure');
    expect(status?.textContent).toContain('Both parents remain safe and enter 2 active-play minutes of Recovery.');
    expectRecoveryShown(h, LEFT_ID, '2:00', 'the refreshed Compendium must show the detail parent in Recovery');
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW))).toBe(JSON.stringify(saved));

    f = await rebootFromDurableSave(f);
    const reloaded = mainBreedHarness(f, mutations);
    harnesses.push(reloaded);
    expectRecoveryShown(reloaded, LEFT_ID, '2:00', 'the reloaded Compendium must still show the 2-minute Recovery');
    expectRecoveryShown(reloaded, RIGHT_ID, '2:00', 'the reloaded Compendium must still show the 2-minute Recovery');
    expect(ownershipStateDigestV2(f.ownershipV2)).toBe(ownershipStateDigestV2(ownership));
  } finally {
    for (const h of harnesses) { h.exec.controller.dispose(); h.dom.window.close(); }
    await f.runtime.release();
  }
}

describe('A5 — Compendium Breed is a UI outcome that survives reload', () => {
  it('a confirmed success commits one outcome: both parents stay and recover 8 min, the child is saved with half-fed and +7 XP; replay, reload and the Recovery boundary agree', async () => {
    await successPressScenario();
  });

  it('a confirmed failure commits one outcome: no child, both parents recover 2 min, no save field changes; reload agrees', async () => {
    await failurePressScenario();
  });

  it('the odds the Compendium shows are the domain odds for the selected parents', async () => {
    const f = await fixtureAt(SUCCESS_TWICE_SEED);
    const h = mainBreedHarness(f);
    try {
      chooseParents(h, LEFT_ID, RIGHT_ID);
      const model = h.exec.projectCurrent(ROW, GENERATION)!;
      const left = model.primaryParents.find((row) => row.creatureId === LEFT_ID)!;
      const right = model.mateParents.find((row) => row.creatureId === RIGHT_ID)!;
      const summary = h.mount.querySelector<HTMLElement>('[data-arc5-breed-summary]')!;
      expect(Number(summary.dataset.odds))
        .toBe(companionBreedOddsV1(left.tier, right.tier, model.earnedStardustBonus));
      expect(await f.repository.revision(), 'choosing parents writes nothing').toBe(0);
    } finally {
      h.exec.controller.dispose();
      h.dom.window.close();
      await f.runtime.release();
    }
  });

  /* NEGATIVE CONTROLS. Each mutant edits the executed Main section by one
   * exact unique string; the unmutated source passes the same scenario above.
   * Each mutant must FAIL, and fail with the assertion that names what broke. */
  const MUTANTS: ReadonlyArray<Readonly<{
    mutation: MainMutation;
    scenario: typeof successPressScenario;
    failsWith: RegExp;
  }>> = [
    {
      mutation: {
        name: 'the Compendium controller no longer hands the press to Main',
        needle: '    void runCompendiumBreedAction(request);',
        replacement: '    void request;',
      },
      scenario: successPressScenario,
      failsWith: /the press must reach Main's Breed writer: expected null to be 'pending'/u,
    },
    {
      mutation: {
        name: 'the Breed never reaches the durable commit',
        needle: '    const attempt = await commitArc5BreedActionV1({',
        replacement: "    const attempt = await (async (_input: unknown) => ({ kind: 'refused' as const, durability: 'none' as const, convergence: 'none' as const, detail: 'transaction:mutant', transaction: null }))({",
      },
      scenario: successPressScenario,
      failsWith: /the confirmed Breed must commit exactly one success: expected 'refused:transaction:mutant'/u,
    },
    {
      mutation: {
        name: 'Main commits but never publishes the durable save fields to the live save',
        needle: '      publishArc5BreedSaveFieldsV1(sourceState, attempt.transaction.state);\n',
        replacement: '',
      },
      scenario: successPressScenario,
      failsWith: /the confirmed Breed must commit exactly one success: expected 'committed-publication-reload'/u,
    },
    {
      mutation: {
        name: 'Main keeps the pre-breed ownership live (Recovery never shown)',
        needle: '      arc5OwnershipState = attempt.ownershipV2;\n',
        replacement: '',
      },
      scenario: successPressScenario,
      failsWith: /the live ownership must publish the committed successor/u,
    },
    {
      mutation: {
        name: 'Main drops its presentation-currency guard (a stale replay reaches the domain)',
        needle: '  if (!compendiumBreedRequestIsCurrent(request, parent)) {',
        replacement: '  if (false) {',
      },
      scenario: successPressScenario,
      failsWith: /a replayed Breed during Recovery must be refused: expected 'refused' to be 'unavailable'/u,
    },
    {
      mutation: {
        name: 'Main settles the press but never refreshes the Compendium from the committed ownership',
        needle: "    if (copy.convergence === 'none') refreshCompendiumFeedState();",
        replacement: '    void copy.convergence;',
      },
      scenario: failurePressScenario,
      failsWith: /the refreshed Compendium must show the detail parent in Recovery: a recovering parent must not be selectable/u,
    },
  ];

  for (const { mutation, scenario, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_BREED_SOURCE, mutation)).not.toThrow();
      await expect(scenario([mutation])).rejects.toThrow(failsWith);
    });
  }

  it('negative control — the mutation helper refuses a drifted needle instead of running unmutated', () => {
    expect(() => replaceExact(MAIN_BREED_SOURCE, {
      name: 'drifted', needle: 'void runCompendiumBreedAction(nonexistent', replacement: '',
    })).toThrow(/found 0/u);
    expect(MAIN_BREED_SOURCE).toContain('async function commitCompendiumBreedAction(');
    expect(MAIN_BREED_SOURCE).toContain('async function runCompendiumBreedAction(request: CompendiumBreedActionRequestV1): Promise<void> {');
  });
});
