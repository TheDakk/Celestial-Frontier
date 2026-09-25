/* A5 gap #7 (INVENTORY.md rows #43 and #44): Compendium companion Rename and
   Field Scout — UI OUTCOME tests.

   CLAUDE.md rule 7: assert the OUTCOME, not the code path. The direct tests in
   arc5-rename-action.test.ts / arc5-scout-action.test.ts call the domain
   writers themselves, so they stay green even if the shipped Compendium never
   reaches them. Here the exact shipped main.ts sections (each feature's
   module-level result cells, its Compendium controller wiring, its projector,
   currentCompendiumDetailRow, and its writer/copy/presentation chain) are
   sliced, type-stripped and executed with an injected env (the
   explorer-meal-action.test.ts pattern). The tests choose a companion, type
   into the rendered name field or pick a Scout, press the rendered
   `[data-arc5-rename-confirm]` / `[data-arc5-scout-confirm]` in JSDOM, then
   read the COMMITTED v5 save back from a real memory backend with readSaveV5
   (twice), reboot a fresh F4 runtime from exactly that save, and re-render
   the Compendium body from it.

   v2 renames one exact companion (ownership `nickname`), not the species; the
   Field Scout lives in ownership `scoutCreatureId` (the creature Hostile
   Bioscan damages instead of the explorer — checked here with the shipped
   bioscan preflight on the durable ownership).

   Only what the sections need from outside is stubbed: ceremony / chips /
   progression-refresh sinks, the unrelated write-hold flags, and
   refreshCompendiumFeedState (reduced to re-projecting the one mounted
   controller, as explorer-meal-action.test.ts does). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { cleanName } from '@cf/domain-strays';
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
import { preflightArc5BioscanV1 } from '@cf/domain-acquisition/bioscan-internal';
import { createSessionRNG } from '@cf/domain-sessionrng';
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
  commitArc5RenameActionV1,
  publishArc5RenameAchievementFields,
} from '../apps/game/src/arc5-rename-action.js';
import {
  commitArc5ScoutActionV1,
  publishArc5ScoutCharterFieldsV1,
} from '../apps/game/src/arc5-scout-action.js';
import {
  COMPENDIUM_RENAME_OUTCOME_SCHEMA,
  CompendiumRenameController,
  projectCompendiumRenameV1,
  type CompendiumRenameActionRequestV1,
  type CompendiumRenameReadModelV1,
} from '../apps/game/src/compendium-rename.js';
import {
  COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
  CompendiumScoutController,
  projectCompendiumScoutV1,
  type CompendiumScoutActionRequestV1,
  type CompendiumScoutReadModelV1,
} from '../apps/game/src/compendium-scout.js';
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
const NOW = 1_753_900_080_000;
const GENERATION = 11;

interface TestWindow extends Window {
  readonly Element: typeof Element;
  readonly Event: typeof Event;
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
    throw new Error(`Main Compendium section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Compendium section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

const DETAIL_ROW_SECTION = exactMainSection(
  'function currentCompendiumDetailRow(): [string, CodexRecord] | null {',
  '\nfunction refreshCompendiumFeedState(): void {',
);

const MAIN_RENAME_SOURCE = [
  exactMainSection('let lastArc5RenameOutcome: string | null = null;', '\nlet lastArc5ScoutOutcome: string | null = null;'),
  exactMainSection(
    'const compendiumRenameController = new CompendiumRenameController({',
    '\nconst compendiumScoutController = new CompendiumScoutController({',
  ),
  exactMainSection('function projectCurrentCompendiumRename(', '\nfunction projectCurrentCompendiumScout('),
  DETAIL_ROW_SECTION,
  exactMainSection('type Arc5RenameCommitOutcome =', '\ntype Arc5ScoutCommitOutcome ='),
].join('\n');

const MAIN_SCOUT_SOURCE = [
  exactMainSection(
    'let lastArc5ScoutOutcome: string | null = null;',
    '\nlet worldIdentityState: CanonicalWorldIdentityStateV1 = createEmptyWorldIdentityState();',
  ),
  exactMainSection(
    'const compendiumScoutController = new CompendiumScoutController({',
    '\nconst compendiumCreatureProgressionSurface = new CompendiumCreatureProgressionSurfaceV1({',
  ),
  exactMainSection(
    'function projectCurrentCompendiumScout(',
    '\nfunction currentCompendiumDetailRow(): [string, CodexRecord] | null {',
  ),
  DETAIL_ROW_SECTION,
  exactMainSection('type Arc5ScoutCommitOutcome =', '\ntype Arc4CaptureActionOutcome ='),
].join('\n');

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

/** Exact, unique string replacement (CLAUDE.md rule 2): a drifted needle must
 * fail loudly, never silently leave the control unmutated. */
function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

type DetailRow = readonly [string, Readonly<{ id: string; name: string; g: Record<string, unknown> }>];

interface ExecutableMainRename {
  readonly controller: CompendiumRenameController;
  readonly projectCurrent: (row: DetailRow, generation: number) => CompendiumRenameReadModelV1 | null;
  readonly commit: (request: CompendiumRenameActionRequestV1) => Promise<Readonly<{ kind: string; detail: string }>>;
  readonly outcome: () => string | null;
}
interface ExecutableMainScout {
  readonly controller: CompendiumScoutController;
  readonly projectCurrent: (row: DetailRow, generation: number) => CompendiumScoutReadModelV1 | null;
  readonly commit: (request: CompendiumScoutActionRequestV1) => Promise<Readonly<{ kind: string; detail: string }>>;
  readonly outcome: () => string | null;
}

function executable<T>(file: string, base: string, returns: string, env: Record<string, unknown>, mutations: readonly MainMutation[]): T {
  const source = mutations.reduce(replaceExact, base);
  const transformed = transformSync(file, source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return ${returns}; }`)(env) as T;
}

/* ---------------- durable fixtures (real F4 runtime over a memory backend) ---------------- */

const GENOME = makeGenome(1_208, 'fauna', 0.54);
const ALPHA_ID = ownershipContentId('creature', 'a5-rename-scout-alpha') as CreatureInstanceId;
const BETA_ID = ownershipContentId('creature', 'a5-rename-scout-beta') as CreatureInstanceId;

function ownershipSource() {
  const identity = canonicalGenomeIdentityV1(GENOME);
  const discoveries = [0, 1].map((index) => createLegacyDiscoveryRecordV1({
    recordId: ownershipContentId('discovery', `a5-rename-scout-${index}`) as DiscoveryRecordId,
    speciesId: identity.speciesId,
    legacyCodexId: `a5-rename-scout-${index}`,
    legacySourceIndex: index,
    from: 'Legacy',
    legacyLocation: null,
    firstForSpecies: index === 0,
  }));
  const twin = (creatureId: CreatureInstanceId, nickname: string, index: 0 | 1) => createCreatureInstanceV1({
    creatureId,
    speciesId: identity.speciesId,
    genomeIdentity: identity.genomeIdentity,
    genome: identity.genome,
    nickname,
    origin: 'legacy',
    acquisitionRecordId: discoveries[index]!.recordId,
    lineage: { kind: 'none', generation: identity.genome.gen as number },
    xp: 9,
    hurt: 0,
    fed: 4,
    brood: 2,
    assignment: null,
    bond: null,
  });
  return createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({
      identity, alias: 'Shared species', firstObservationId: discoveries[0]!.recordId,
    })],
    discoveries,
    creatures: [twin(ALPHA_ID, 'Alpha', 0), twin(BETA_ID, 'Beta', 1)],
    specimenLots: [],
    biosphereProgress: [],
    legacyBioX: [],
    scoutCreatureId: ALPHA_ID,
  });
}

const ROW: DetailRow = Object.freeze([
  'a5-rename-scout-species',
  Object.freeze({ id: 'a5-rename-scout-species', name: 'Shared species', g: GENOME as unknown as Record<string, unknown> }),
] as const);

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
  readonly ownershipV2: OwnershipStateV2;
  readonly evidence: unknown;
}

async function fixtureAt(configure: (state: SaveStateV2) => void = () => undefined): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`base save failed: ${imported.reason}`);
  const state: SaveStateV2 = { ...imported.state };
  configure(state);
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0xA5FEE001).state());
  const arc4: V5Extensions = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(ownershipSource()).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture was ${arc5.kind}`);
  const backend = createMemoryBackend();
  const initialSave = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initialSave.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`v5 fixture was ${migration.kind}`);
  await backend.apply(initialSave.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: arc5.extensions, initialState: initialSave.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 0,
    ownerId: 'a5-rename-scout-tab', token: 'a5-rename-scout-document',
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`lease was ${heartbeat.kind}`);
  return {
    backend, repository, runtime, state: initialSave.canonicalState,
    ownershipV2: arc5.state, evidence: arc5.evidence,
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
  const runtime = createF4RuntimeAuthority({
    backend: previous.backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: 'a5-rename-scout-reloaded-tab', token: 'a5-rename-scout-reloaded-document',
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`reloaded lease was ${heartbeat.kind}`);
  return {
    backend: previous.backend, repository, runtime, state: saved.state,
    ownershipV2: ownership.state, evidence: ownership.evidence,
  };
}

async function durable(backend: StorageBackend) {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable read was ${saved.kind}`);
  const ownership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`durable Arc 5 ownership was ${ownership.kind}`);
  return { saved, ownership: ownership.state };
}

function nickname(ownership: OwnershipStateV2, id: string): string | null | undefined {
  return ownership.creatures.find((row) => row.creatureId === id)?.nickname;
}

/* ---------------- the Main harness (shared env, one feature mounted) ---------------- */

type Feature = 'rename' | 'scout';

function sharedEnv(f: DurableFixture, document: Document) {
  const scheduleReload = vi.fn();
  const ceremony = vi.fn();
  const progressionRefresh = vi.fn();
  const env: Record<string, unknown> & {
    save: SaveStateV2;
    arc5OwnershipState: OwnershipStateV2 | null;
    arc5OwnershipProtection: string | null;
    activePersist: unknown;
    productActionInFlight: boolean;
    lastPersistenceOutcome: string | null;
    lastStarterCharterAcceptStatus: string | null;
    refreshCompendiumFeedState: () => void;
  } = {
    document,
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
    smokeForceReadOnly: false,
    arc5OwnershipState: f.ownershipV2,
    arc5OwnershipEvidence: f.evidence,
    arc5OwnershipProtection: null,
    ARC5_OWNERSHIP_MIGRATION_VERSION,
    ARC5_OWNERSHIP_EXTENSION_TARGETS,
    ownershipStateDigestV1,
    ownershipStateDigestV2,
    ownershipSourceStateV1,
    cleanName,
    activePersist: null,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    lastArc5BootstrapOutcome: null,
    lastStarterCharterAcceptStatus: null,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    presentProgressionCeremony: ceremony,
    queueArc9ProgressionRefresh: progressionRefresh,
    updateChips: vi.fn(),
    refreshCompendiumFeedState: () => undefined,
    // Rename
    CompendiumRenameController,
    projectCompendiumRenameV1,
    COMPENDIUM_RENAME_OUTCOME_SCHEMA,
    commitArc5RenameActionV1,
    publishArc5RenameAchievementFields,
    // Scout
    CompendiumScoutController,
    projectCompendiumScoutV1,
    COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
    commitArc5ScoutActionV1,
    publishArc5ScoutCharterFieldsV1,
  };
  return { env, scheduleReload, ceremony, progressionRefresh };
}

function domFor(feature: Feature): TestDom {
  const body = feature === 'rename'
    ? '<section class="compendium-feed" data-arc5-rename-body aria-label="Rename companion"></section>'
    : '<section class="compendium-feed" data-arc5-scout-body aria-label="Field Scout"></section>';
  return new JSDOM(`<!doctype html><html><body>
    <aside id="codexpanel" aria-label="Compendium" style="display:block"><div data-sel="codex-detail">${body}</div></aside>
  </body></html>`);
}

function mainRenameHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = domFor('rename');
  const shared = sharedEnv(f, dom.window.document);
  const exec = executable<ExecutableMainRename>('main-rename.ts', MAIN_RENAME_SOURCE, `{
    controller: compendiumRenameController,
    projectCurrent: projectCurrentCompendiumRename,
    commit: commitCompendiumRenameAction,
    outcome: () => lastArc5RenameOutcome,
  }`, shared.env, mutations);
  shared.env.refreshCompendiumFeedState = () => {
    exec.controller.setState(exec.projectCurrent(ROW, GENERATION));
    exec.controller.refresh();
  };
  const mount = dom.window.document.querySelector<HTMLElement>('[data-arc5-rename-body]')!;
  exec.controller.setState(exec.projectCurrent(ROW, GENERATION));
  exec.controller.attach(mount);
  return { dom, exec, mount, ...shared };
}
type RenameHarness = ReturnType<typeof mainRenameHarness>;

function mainScoutHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = domFor('scout');
  const shared = sharedEnv(f, dom.window.document);
  const exec = executable<ExecutableMainScout>('main-scout.ts', MAIN_SCOUT_SOURCE, `{
    controller: compendiumScoutController,
    projectCurrent: projectCurrentCompendiumScout,
    commit: commitCompendiumScoutAction,
    outcome: () => lastArc5ScoutOutcome,
  }`, shared.env, mutations);
  shared.env.refreshCompendiumFeedState = () => {
    exec.controller.setState(exec.projectCurrent(ROW, GENERATION));
    exec.controller.refresh();
  };
  const mount = dom.window.document.querySelector<HTMLElement>('[data-arc5-scout-body]')!;
  exec.controller.setState(exec.projectCurrent(ROW, GENERATION));
  exec.controller.attach(mount);
  return { dom, exec, mount, ...shared };
}
type ScoutHarness = ReturnType<typeof mainScoutHarness>;

async function settled(h: RenameHarness | ScoutHarness): Promise<void> {
  await vi.waitFor(() => {
    if (h.exec.controller.diagnostics().pendingWork !== 0 || h.exec.outcome() === 'pending') {
      throw new Error('Compendium action still pending');
    }
  }, { timeout: 5_000, interval: 2 });
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

/* ---------------- Rename helpers ---------------- */

function renameRadio(h: RenameHarness, id: string): HTMLInputElement {
  const radio = h.mount.querySelector<HTMLInputElement>(`input[data-arc5-rename-creature-id="${id}"]`);
  expect(radio, `Main must render a Rename choice for ${id}`).not.toBeNull();
  return radio!;
}
function renameConfirm(h: RenameHarness): HTMLButtonElement {
  const button = h.mount.querySelector<HTMLButtonElement>('[data-arc5-rename-confirm]');
  expect(button, 'Main must render the Rename confirm control').not.toBeNull();
  return button!;
}
/** Choose one exact companion, then type into the rendered name field. */
function typeName(h: RenameHarness, id: string, raw: string): HTMLButtonElement {
  const radio = renameRadio(h, id);
  expect(radio.disabled, 'the ready companion must be selectable').toBe(false);
  radio.click();
  const editor = h.mount.querySelector<HTMLInputElement>('[data-arc5-rename-input]');
  expect(editor, 'Main must render the name field').not.toBeNull();
  expect(editor!.disabled).toBe(false);
  editor!.value = raw;
  editor!.dispatchEvent(new h.dom.window.Event('input', { bubbles: true }));
  return renameConfirm(h);
}
function renameLabel(h: RenameHarness, id: string): string {
  return renameRadio(h, id).closest('label')?.textContent ?? '';
}

/* ---------------- Rename scenarios ---------------- */

const RAW_NAME = '  <Nova>&"\'  ';
const CLEAN_NAME = 'Nova';

async function renamePressScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await fixtureAt();
  const harnesses: RenameHarness[] = [];
  try {
    const h = mainRenameHarness(f, mutations);
    harnesses.push(h);
    expect(cleanName(RAW_NAME, 24)).toBe(CLEAN_NAME);
    const unlockedBefore = [...f.state.unlocked];
    expect(unlockedBefore).not.toContain('namer');
    const confirm = typeName(h, ALPHA_ID, RAW_NAME);
    expect(h.mount.querySelector('[data-arc5-rename-preview]')?.textContent,
      'the preview must show the sanitized name').toBe(`Saved name: ${CLEAN_NAME}`);
    expect(confirm.disabled, 'a different valid name must enable Rename').toBe(false);
    expect(await f.repository.revision()).toBe(0);

    confirm.click();
    expect(h.exec.outcome(), 'the press must reach Main\'s Rename writer').toBe('pending');
    const refilled = renameConfirm(h);
    expect(refilled.disabled, 'the pending refill keeps Rename, disabled').toBe(true);
    refilled.click(); // double-tap
    await settled(h);

    // (1) exactly one durable rename, sanitized, with the namer join
    expect(await f.repository.revision(), 'Rename must commit exactly one revision').toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'Rename must commit exactly one receipt').toHaveLength(1);
    const first = await durable(f.backend);
    expect(nickname(first.ownership, ALPHA_ID), 'the committed save must hold the sanitized name').toBe(CLEAN_NAME);
    expect(nickname(first.ownership, BETA_ID), 'the same-species twin keeps its own name').toBe('Beta');
    expect(first.ownership.creatures.map((row) => ({ ...row, nickname: null })),
      'Rename changes nothing but the one nickname')
      .toEqual(f.ownershipV2.creatures.map((row) => ({ ...row, nickname: null })));
    expect(first.ownership.scoutCreatureId).toBe(ALPHA_ID);
    expect(first.saved.state.unlocked, 'the committed save joins namer exactly once')
      .toEqual([...unlockedBefore, 'namer']);
    expect(h.env.save.unlocked, 'the live save must publish the durable namer achievement')
      .toEqual(first.saved.state.unlocked);
    expect(h.env.arc5OwnershipState && ownershipStateDigestV2(h.env.arc5OwnershipState),
      'the live ownership must publish the committed successor').toBe(ownershipStateDigestV2(first.ownership));
    expect(h.exec.outcome(), 'the Rename must settle as a verified commit').toBe('committed:1');
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.env.lastPersistenceOutcome).toBe('arc5-rename-committed:1');
    expect(h.env.activePersist).toBeNull();
    expect(h.env.productActionInFlight).toBe(false);
    expect(h.ceremony).toHaveBeenCalledWith(expect.objectContaining({ addedAchievementIds: ['namer'] }));
    expect(h.progressionRefresh).toHaveBeenCalledWith('arc5.companion-rename');
    const status = h.mount.querySelector<HTMLElement>('[data-arc5-rename-status]');
    expect(status?.dataset.kind).toBe('committed');
    expect(status?.textContent).toContain(`${CLEAN_NAME} is now this exact companion’s durable name.`);
    expect(renameLabel(h, ALPHA_ID), 'the refreshed Compendium must show the new name')
      .toContain(`${CLEAN_NAME} · `);
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW))).toBe(JSON.stringify(first.saved));

    // (2) reload: the name, the namer join and the rendered label survive
    f = await rebootFromDurableSave(f);
    expect(nickname(f.ownershipV2, ALPHA_ID), 'the reloaded save keeps the sanitized name').toBe(CLEAN_NAME);
    expect(f.state.unlocked).toEqual([...unlockedBefore, 'namer']);
    const reloaded = mainRenameHarness(f, mutations);
    harnesses.push(reloaded);
    expect(renameLabel(reloaded, ALPHA_ID), 'the reloaded Compendium must show the new name').toContain(`${CLEAN_NAME} · `);

    // (3) a second rename after reload: namer is an idempotent join, not a second award
    typeName(reloaded, BETA_ID, 'Vega').click();
    await settled(reloaded);
    expect(await f.repository.revision()).toBe(2);
    const second = await durable(f.backend);
    expect(nickname(second.ownership, BETA_ID)).toBe('Vega');
    expect(nickname(second.ownership, ALPHA_ID)).toBe(CLEAN_NAME);
    expect(second.saved.state.unlocked.filter((id) => id === 'namer'),
      'namer stays exactly once after a second rename').toEqual(['namer']);
    expect(reloaded.ceremony).toHaveBeenCalledWith(expect.objectContaining({ addedAchievementIds: [] }));
  } finally {
    for (const h of harnesses) { h.exec.controller.dispose(); h.dom.window.close(); }
    await f.runtime.release();
  }
}

async function unchangedRenameScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  const f = await fixtureAt();
  const h = mainRenameHarness(f, mutations);
  try {
    const savedBefore = JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW));
    // the same name after sanitizing
    const confirm = typeName(h, ALPHA_ID, '  Alpha<>  ');
    expect(h.mount.querySelector('[data-arc5-rename-preview]')?.textContent).toBe('Enter a different name.');
    expect(confirm.disabled, 'an unchanged name must not enable Rename').toBe(true);
    confirm.click();
    // input that sanitizes to nothing
    const editor = h.mount.querySelector<HTMLInputElement>('[data-arc5-rename-input]')!;
    editor.value = ' <>&"\' ';
    editor.dispatchEvent(new h.dom.window.Event('input', { bubbles: true }));
    expect(h.mount.querySelector('[data-arc5-rename-preview]')?.textContent)
      .toBe('Enter a name containing supported characters.');
    expect(renameConfirm(h).disabled, 'an empty sanitized name must not enable Rename').toBe(true);
    renameConfirm(h).click();
    await settled(h);
    expect(h.exec.outcome(), 'an unchanged name must never reach Main\'s writer').toBeNull();

    // a forged unchanged request (what a stale control could carry) is refused by Main before any claim
    const model = h.exec.projectCurrent(ROW, GENERATION)!;
    const forged = await h.exec.commit(Object.freeze({
      surface: model.surface,
      contextKey: model.contextKey,
      ownershipRevision: model.ownershipRevision!,
      ownershipDigest: model.ownershipDigest!,
      creatureId: ALPHA_ID,
      nicknameBefore: 'Alpha',
      rawName: '  Alpha<>  ',
      nicknameAfter: 'Alpha',
    }));
    expect(forged.kind, 'Main must refuse an unchanged rename').toBe('unavailable');
    expect(await f.repository.revision(), 'unchanged input writes nothing').toBe(0);
    expect(await f.backend.keys('receipts')).toEqual([]);
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW)), 'the save is byte-identical').toBe(savedBefore);
  } finally {
    h.exec.controller.dispose();
    h.dom.window.close();
    await f.runtime.release();
  }
}

/* ---------------- Scout helpers and scenarios ---------------- */

function scoutRadio(h: ScoutHarness, id: string): HTMLInputElement {
  const radio = h.mount.querySelector<HTMLInputElement>(`input[data-arc5-scout-creature-id="${id}"]`);
  expect(radio, `Main must render a Field Scout choice for ${id}`).not.toBeNull();
  return radio!;
}
function scoutConfirm(h: ScoutHarness): HTMLButtonElement {
  const button = h.mount.querySelector<HTMLButtonElement>('[data-arc5-scout-confirm]');
  expect(button, 'Main must render the Field Scout confirm control').not.toBeNull();
  return button!;
}
function scoutLabel(h: ScoutHarness, id: string): string {
  return scoutRadio(h, id).closest('label')?.textContent ?? '';
}
function bioscanTarget(ownership: OwnershipStateV2): string | null {
  const preflight = preflightArc5BioscanV1(ownership);
  if (preflight.kind !== 'ready') throw new Error(`bioscan preflight was ${preflight.reason}`);
  return preflight.preflight.scoutBefore?.creatureId ?? null;
}

const STARTER_SCOUT_READY = (state: SaveStateV2): void => {
  state.chDone = ['st-land', 'st-mine'];
  state.chacc = ['st-scout'];
  state.stats = { ...state.stats, charters: 2 };
};

async function scoutPressScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await fixtureAt(STARTER_SCOUT_READY);
  const harnesses: ScoutHarness[] = [];
  try {
    const h = mainScoutHarness(f, mutations);
    harnesses.push(h);
    const essenceBefore = f.state.essence;
    expect(bioscanTarget(f.ownershipV2), 'Alpha starts as the bioscan target').toBe(ALPHA_ID);
    expect(scoutLabel(h, ALPHA_ID)).toContain('· Field Scout ✓');
    expect(scoutConfirm(h).disabled, 'nothing chosen, nothing to confirm').toBe(true);
    scoutRadio(h, BETA_ID).click();
    const confirm = scoutConfirm(h);
    expect(confirm.textContent).toBe('Name Field Scout');
    expect(confirm.disabled, 'a ready non-Scout companion must enable Name Field Scout').toBe(false);

    confirm.click();
    expect(h.exec.outcome(), 'the press must reach Main\'s Field Scout writer').toBe('pending');
    const refilled = scoutConfirm(h);
    expect(refilled.disabled, 'the pending refill keeps the confirm, disabled').toBe(true);
    refilled.click(); // double-tap
    await settled(h);

    // (1) exactly one durable role change + the Starter Charter join
    expect(await f.repository.revision(), 'Name Field Scout must commit exactly one revision').toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'Name Field Scout must commit exactly one receipt').toHaveLength(1);
    const first = await durable(f.backend);
    expect(first.ownership.scoutCreatureId, 'the committed save must hold the new Field Scout').toBe(BETA_ID);
    expect(bioscanTarget(first.ownership), 'the durable Scout is who the bioscan now damages').toBe(BETA_ID);
    expect(first.ownership.creatures, 'the Scout role changes no companion').toEqual(f.ownershipV2.creatures);
    expect(first.saved.state.chDone, 'the committed save completes the st-scout Starter Charter')
      .toEqual(['st-land', 'st-mine', 'st-scout']);
    expect(first.saved.state.chacc).toEqual([]);
    expect(first.saved.state.essence).toBe(essenceBefore + 15);
    expect(h.env.save.chDone, 'the live save must publish the completed st-scout Charter')
      .toEqual(first.saved.state.chDone);
    expect(h.env.save.essence).toBe(essenceBefore + 15);
    expect(h.env.arc5OwnershipState && ownershipStateDigestV2(h.env.arc5OwnershipState),
      'the live ownership must publish the committed successor').toBe(ownershipStateDigestV2(first.ownership));
    expect(h.exec.outcome(), 'the Field Scout change must settle as a verified commit').toBe('committed:1');
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.env.lastPersistenceOutcome).toBe('arc5-scout-committed:1');
    expect(h.env.lastStarterCharterAcceptStatus).toMatch(/through Field Scout duty\.$/u);
    expect(h.env.activePersist).toBeNull();
    expect(h.progressionRefresh).toHaveBeenCalledWith('arc5.field-scout');
    expect(h.mount.querySelector<HTMLElement>('[data-arc5-scout-status]')?.textContent)
      .toContain('Field Scout named.');
    expect(scoutLabel(h, BETA_ID), 'the refreshed Compendium must mark the new Field Scout').toContain('· Field Scout ✓');
    expect(scoutLabel(h, ALPHA_ID)).not.toContain('Field Scout ✓');
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW))).toBe(JSON.stringify(first.saved));

    // (2) a stale replay of the committed request is refused and writes nothing
    const replay = await h.exec.commit(h.exec.controller.diagnostics().lastRequest!);
    expect(replay.kind, 'a replayed Field Scout request must be refused').toBe('unavailable');
    expect(await f.repository.revision()).toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);

    // (3) reload: the role survives and renders; then stand it down through the UI
    f = await rebootFromDurableSave(f);
    expect(f.ownershipV2.scoutCreatureId, 'the reloaded save keeps the Field Scout').toBe(BETA_ID);
    expect(f.state.chDone).toEqual(['st-land', 'st-mine', 'st-scout']);
    const reloaded = mainScoutHarness(f, mutations);
    harnesses.push(reloaded);
    expect(scoutLabel(reloaded, BETA_ID), 'the reloaded Compendium must mark the Field Scout').toContain('· Field Scout ✓');
    scoutRadio(reloaded, BETA_ID).click();
    const standDown = scoutConfirm(reloaded);
    expect(standDown.textContent).toBe('Stand down');
    standDown.click();
    await settled(reloaded);
    expect(await f.repository.revision()).toBe(2);
    const second = await durable(f.backend);
    expect(second.ownership.scoutCreatureId, 'Stand down must durably clear the role').toBeNull();
    expect(bioscanTarget(second.ownership), 'with no Scout the explorer takes bioscan damage').toBeNull();
    expect(second.saved.state.essence, 'standing down pays nothing').toBe(essenceBefore + 15);
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, NOW))).toBe(JSON.stringify(second.saved));
    f = await rebootFromDurableSave(f);
    expect(f.ownershipV2.scoutCreatureId).toBeNull();
  } finally {
    for (const h of harnesses) { h.exec.controller.dispose(); h.dom.window.close(); }
    await f.runtime.release();
  }
}

describe('A5 — Compendium Rename and Field Scout are UI outcomes that survive reload', () => {
  it('Rename: a typed name is sanitized, committed once with namer, survives re-read and reload, and a second rename keeps namer once', async () => {
    await renamePressScenario();
  });

  it('Rename: an unchanged or empty-after-sanitizing name writes nothing', async () => {
    await unchangedRenameScenario();
  });

  it('Field Scout: naming a Scout commits once (with the st-scout Charter join), sets the bioscan target, survives reload, and stands down durably', async () => {
    await scoutPressScenario();
  });

  /* NEGATIVE CONTROLS. Each mutant edits the executed Main section by one
   * exact unique string; the unmutated source passes the same scenario above.
   * Each mutant must FAIL, and fail with the assertion that names what broke. */
  const MUTANTS: ReadonlyArray<Readonly<{
    mutation: MainMutation;
    feature: Feature;
    scenario: (mutations: readonly MainMutation[]) => Promise<void>;
    failsWith: RegExp;
  }>> = [
    {
      feature: 'rename',
      mutation: {
        name: 'the Rename controller no longer hands the press to Main',
        needle: '    void runCompendiumRenameAction(request);',
        replacement: '    void request;',
      },
      scenario: renamePressScenario,
      failsWith: /the press must reach Main's Rename writer: expected null to be 'pending'/u,
    },
    {
      feature: 'rename',
      mutation: {
        name: 'Main hands the domain a different raw name than the one confirmed',
        needle: '      rawName: request.rawName,',
        replacement: "      rawName: request.rawName + ' II',",
      },
      scenario: renamePressScenario,
      failsWith: /the committed save must hold the sanitized name: expected 'Nova\s+II' to be 'Nova'/u,
    },
    {
      feature: 'rename',
      mutation: {
        name: 'Main commits but never publishes namer to the live save',
        needle: '      publishArc5RenameAchievementFields(save, attempt.transaction.state);\n',
        replacement: '',
      },
      scenario: renamePressScenario,
      failsWith: /the live save must publish the durable namer achievement/u,
    },
    {
      feature: 'rename',
      mutation: {
        name: 'Main drops its presentation-currency guard (an unchanged forged rename is no longer refused up front)',
        needle: '  if (!compendiumRenameRequestIsCurrent(request, parent)) {',
        replacement: '  if (false) {',
      },
      scenario: unchangedRenameScenario,
      failsWith: /Main must refuse an unchanged rename: expected 'refused' to be 'unavailable'/u,
    },
    {
      feature: 'scout',
      mutation: {
        name: 'the Field Scout controller no longer hands the press to Main',
        needle: '    void runCompendiumScoutAction(request);',
        replacement: '    void request;',
      },
      scenario: scoutPressScenario,
      failsWith: /the press must reach Main's Field Scout writer: expected null to be 'pending'/u,
    },
    {
      feature: 'scout',
      mutation: {
        name: 'Main asks the domain for the old Scout instead of the chosen one',
        needle: '      scoutCreatureId: request.scoutAfter,',
        replacement: '      scoutCreatureId: request.scoutBefore,',
      },
      scenario: scoutPressScenario,
      failsWith: /Name Field Scout must commit exactly one revision: expected \+0 to be 1/u,
    },
    {
      feature: 'scout',
      mutation: {
        name: 'Main commits but never publishes the Charter completion to the live save',
        needle: '        publishArc5ScoutCharterFieldsV1(sourceState, attempt.transaction.state);\n',
        replacement: '',
      },
      scenario: scoutPressScenario,
      failsWith: /the live save must publish the completed st-scout Charter/u,
    },
    {
      feature: 'scout',
      mutation: {
        name: 'Main keeps the old ownership live (the Compendium still marks the old Scout)',
        needle: '      arc5OwnershipState = attempt.ownershipV2;\n',
        replacement: '',
      },
      scenario: scoutPressScenario,
      failsWith: /the live ownership must publish the committed successor/u,
    },
  ];

  for (const { mutation, feature, scenario, failsWith } of MUTANTS) {
    it(`negative control (${feature}) — ${mutation.name}: the outcome test fails`, async () => {
      const base = feature === 'rename' ? MAIN_RENAME_SOURCE : MAIN_SCOUT_SOURCE;
      expect(() => replaceExact(base, mutation)).not.toThrow();
      await expect(scenario([mutation])).rejects.toThrow(failsWith);
    });
  }

  it('negative control — the mutation helper refuses a drifted needle instead of running unmutated', () => {
    expect(() => replaceExact(MAIN_RENAME_SOURCE, {
      name: 'drifted', needle: 'void runCompendiumRenameAction(nonexistent', replacement: '',
    })).toThrow(/found 0/u);
    expect(MAIN_RENAME_SOURCE).toContain('async function commitCompendiumRenameAction(');
    expect(MAIN_SCOUT_SOURCE).toContain('async function commitCompendiumScoutAction(');
    expect(MAIN_SCOUT_SOURCE).toContain('async function runCompendiumScoutAction(request: CompendiumScoutActionRequestV1): Promise<void> {');
  });
});
