/* A5 gap #6 (INVENTORY.md row #53): Scavenge (flora capture) — UI OUTCOME test.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. Scavenge was the
 * only capture verb never pressed anywhere, and its DIRECT test
 * (arc4-capture-action.test.ts) calls commitArc4CaptureAttemptV1() itself and
 * never reloads. Here the exact shipped main.ts sections are sliced,
 * type-stripped and executed with an injected env (the explorer-meal /
 * binder / charter pattern):
 *   - the Main `captureCardController` construction (the real
 *     CaptureCardController wired to runCaptureCardAction),
 *   - Arc4CaptureActionOutcome / lastArc4CaptureResult / commitArc4CaptureAction,
 *   - the capture card model and presentation-fence helpers,
 *   - refreshCaptureCardState,
 *   - captureOutcomeCopy / runCaptureCardAction.
 * The test presses the `[data-capture-action="scavenge"]` button the real
 * controller rendered in JSDOM, then reads the COMMITTED v5 save back from a
 * real memory backend with readSaveV5 (twice), reboots a fresh F4 runtime from
 * that durable save, re-renders the card and presses again.
 *
 * Harness glue (not shipped code): the Survey mount markup and the attach
 * call are showSurvey's exact lines (asserted verbatim below). Stubbed
 * externals: navigation (nav = Earth's surface; surveyOwnsCurrentCaptureSurface
 * → true), the planetside preview (planetsideMatchesFullRoster → true), toast,
 * chips, other panels, tame audio (null), the custom-name index, and the
 * follow-up progression refresh queue (queueArc9ProgressionRefresh is a
 * separate owner; its call is asserted, its receipt is not part of this test). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  capturePresentationFenceV1,
  createEmptyOwnershipStateV1,
  formatCaptureChancePercentV1,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  projectCapturePresentationV1,
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { describeSpecies } from '@cf/domain-genome';
import { DOMAINS, createSessionRNG } from '@cf/domain-sessionrng';
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
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc2LootLegacyMigration,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc4Ownership,
  readArc5OwnershipMigration,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  commitArc4CaptureAttemptV1,
  publishArc4CaptureFields,
  verifyArc4CommittedCaptureV1,
} from '../apps/game/src/arc4-capture-action.js';
import { composeAcquisitionSnapshotV1 } from '../apps/game/src/acquisition-snapshot.js';
import {
  CAPTURE_CARD_OUTCOME_SCHEMA,
  CAPTURE_CARD_READ_MODEL_SCHEMA,
  CAPTURE_CARD_VERB_ORDER,
  CaptureCardController,
} from '../apps/game/src/capture-card.js';
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
const HOME = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });

beforeAll(() => installCaptureHooks());

/** A bounded SessionRNG seed whose first captureSuccess draw always hits
 * (same search as arc4-capture-action.test.ts). */
function seedForSuccessDraw(predicate: (value: number) => boolean): number {
  for (let seed = 0; seed < 100_000; seed++) {
    if (predicate(createSessionRNG(seed).at(DOMAINS.captureSuccess, 0))) return seed;
  }
  throw new Error('scavenge outcome test could not find a bounded SessionRNG seed');
}
const HIT_SEED = seedForSuccessDraw((value) => value < 0.001);

interface TestWindow extends Window {
  readonly Element: typeof Element;
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
    throw new Error(`Main Scavenge section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Scavenge section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, inclusive ? right + end.length : right);
}

/* showSurvey's capture mount markup and attach call, re-run by the harness. */
const SURVEY_CAPTURE_MOUNT_HTML = '<section data-capture-card-body aria-label="Biosphere capture"></section>';
const SURVEY_CAPTURE_ATTACH = '    captureCardController.attach(captureMount);';

/* Inclusive end anchors keep every section clear of the neighbouring combat
 * code that is edited concurrently. */
const MAIN_SCAVENGE_SOURCE = [
  // the one Main capture controller, wired to runCaptureCardAction
  exactMainSection(
    'const captureCardController = new CaptureCardController({',
    '    void runCaptureCardAction(request, presentationFence);\n  },\n});\n',
    true,
  ),
  // the outcome type, lastArc4CaptureResult, isArc4CaptureVerb, commitArc4CaptureAction
  exactMainSection('type Arc4CaptureActionOutcome = Readonly<{', '\nfunction captureActivePlayCountdown('),
  // card model builders and capturePresentationFenceForSurface
  exactMainSection(
    'function captureActivePlayCountdown(',
    'observedActivePlayMs: runtime.diagnostics().activePlayMs,\n  });\n}\n',
    true,
  ),
  // refreshCaptureCardState
  exactMainSection('function refreshCaptureCardState(', '\ntype SurveyFocusIdentity'),
  // captureOutcomeCopy, runCaptureCardAction
  exactMainSection(
    'function captureOutcomeCopy(',
    "    toast('Capture presentation unavailable', 'Nothing was spent. Reopen Survey to try again.', true);\n  }\n}\n",
    true,
  ),
].join('\n');

const HARNESS_SURVEY_MOUNT = `
function __harnessPresentCaptureCard() {
  card.innerHTML = '${SURVEY_CAPTURE_MOUNT_HTML}';
  const captureMount = card.querySelector('[data-capture-card-body]');
${SURVEY_CAPTURE_ATTACH}
  refreshCaptureCardState();
}`;

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

/** Exact, unique string replacement (CLAUDE.md rule 2). */
function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main Scavenge source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

interface CaptureResult {
  readonly hit: boolean;
  readonly speciesId: string;
  readonly speciesName: string;
  readonly kingdom: string;
  readonly firstForSpecies: boolean;
  readonly remainingAfter: number;
  readonly ownedRowId: string | null;
  readonly stardustReward: number;
  readonly revision: number;
}

interface ExecutableMainScavenge {
  readonly present: () => void;
  readonly result: () => CaptureResult | null;
  readonly controller: () => CaptureCardController;
}

function executableMainScavenge(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMainScavenge {
  const source = mutations.reduce(replaceExact, MAIN_SCAVENGE_SOURCE) + HARNESS_SURVEY_MOUNT;
  const transformed = transformSync('main-scavenge.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    present: () => __harnessPresentCaptureCard(),
    result: () => lastArc4CaptureResult,
    controller: () => captureCardController,
  }; }`)(env) as ExecutableMainScavenge;
}

/* ---------------- durable fixtures (real F4 runtime over a memory backend) ---------------- */

function earth(): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress({ galaxy: HOME, star: SOL, planet: { seed: 133 } });
  if (!result.ok) throw new Error(result.reason);
  return result.address;
}

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
  readonly arc4: unknown;
  readonly arc5: unknown;
  readonly arc5Evidence: unknown;
}

/** Boot exactly as a document does: read the committed v5 save back from
 * storage and create the F4 runtime and ownership states from those bytes. */
async function bootFromDurableSave(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`Scavenge boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`Scavenge boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-scavenge-${tag}-tab`, token: `a5-scavenge-${tag}-document`,
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Scavenge lease was ${heartbeat.kind}`);
  const arc4 = readArc4Ownership(runtime.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (arc4.kind !== 'loaded' || arc4.state.mode !== 'current') throw new Error(`Scavenge boot Arc 4 was ${arc4.kind}`);
  const arc5 = readArc5OwnershipMigration(runtime.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (arc5.kind !== 'loaded') throw new Error(`Scavenge boot Arc 5 was ${arc5.kind}`);
  return {
    backend, repository, runtime, state: saved.state,
    arc4: arc4.state, arc5: arc5.state, arc5Evidence: arc5.evidence,
  };
}

async function freshFixture(): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state = imported.state;
  const arc2 = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: state.items, equip: state.equip, equipAff: state.equipAff },
    capacity: 6,
  });
  if (arc2.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${arc2.kind}`);
  const f4 = prepareF4AuthorityUpdate(arc2.extensions, { activePlayMs: 0 }, createSessionRNG(HIT_SEED).state());
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(createEmptyOwnershipStateV1()).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture was ${arc5.kind}`);
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`Scavenge fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  return bootFromDurableSave(backend, 'first');
}

/* ---------------- the Main harness ---------------- */

function mainScavengeHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section id="card" aria-label="Survey" style="display:block"></section>
  </body></html>`);
  const document = dom.window.document;
  const card = document.getElementById('card')!;
  const nav = navFromCanonicalCF1Address(earth());
  if (!nav.ok) throw new Error(nav.reason);
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const queueProgressionRefresh = vi.fn();
  const env: Record<string, unknown> & {
    save: SaveStateV2;
    activePersist: unknown;
    productActionInFlight: boolean;
    lastPersistenceOutcome: string | null;
    lastArc4CaptureOutcome: string | null;
    arc4OwnershipState: unknown;
    arc5OwnershipState: unknown;
  } = {
    document,
    Element: dom.window.Element,
    card,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    __CF_EVIDENCE_BUILD__: false,
    // the durable authorities, exactly as boot published them
    nav: nav.state,
    save: f.state,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    arc4OwnershipState: f.arc4,
    arc4OwnershipProtection: null,
    arc5OwnershipState: f.arc5,
    arc5OwnershipEvidence: f.arc5Evidence,
    arc5OwnershipProtection: null,
    lastArc5BootstrapOutcome: 'committed-published',
    currentCapturePresentationFence: null,
    lastArc4CaptureOutcome: null,
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
    fillPlanetside: vi.fn(),
    // the real owners main.ts imports
    CaptureCardController,
    CAPTURE_CARD_OUTCOME_SCHEMA,
    CAPTURE_CARD_READ_MODEL_SCHEMA,
    CAPTURE_CARD_VERB_ORDER,
    canonicalCF1WorldAddressFromNav,
    canonicalWorldRoster,
    composeAcquisitionSnapshotV1,
    capturePresentationFenceV1,
    projectCapturePresentationV1,
    formatCaptureChancePercentV1,
    commitArc4CaptureAttemptV1,
    verifyArc4CommittedCaptureV1,
    publishArc4CaptureFields,
    ownershipStateDigestV1,
    ownershipSourceStateV1,
    describeSpecies,
    ARC5_OWNERSHIP_MIGRATION_VERSION,
    // presentation / neighbouring-owner externals
    tameGreetingAudioOwner: null,
    syncCustomNameIndex: vi.fn(),
    queueArc9ProgressionRefresh: queueProgressionRefresh,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    toast,
    updateChips: vi.fn(),
    openPanelId: () => null,
    fillCharters: vi.fn(),
    fillCodex: vi.fn(),
    codexFilter: '',
    gameEvent: vi.fn(),
  };
  const exec = executableMainScavenge(env, mutations);
  exec.present();
  const scavengeButton = () => card.querySelector<HTMLButtonElement>('button[data-capture-action="scavenge"]');
  const budget = () => card.querySelector<HTMLElement>('[data-capture-budget]');
  return { dom, env, exec, card, toast, scheduleReload, queueProgressionRefresh, scavengeButton, budget };
}
type Harness = ReturnType<typeof mainScavengeHarness>;

/** Wait until the press the shipped controller dispatched has fully settled. */
async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (!h.env.productActionInFlight && h.env.activePersist === null
      && !String(h.env.lastArc4CaptureOutcome).endsWith('-pending')) {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`Scavenge press never settled (${String(h.env.lastArc4CaptureOutcome)})`);
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

function durableOwnership(extensions: V5Extensions) {
  const arc4 = readArc4Ownership(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (arc4.kind !== 'loaded') throw new Error(`durable Arc 4 ownership was ${arc4.kind}`);
  const arc5 = readArc5OwnershipMigration(extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (arc5.kind !== 'loaded') throw new Error(`durable Arc 5 ownership was ${arc5.kind}`);
  return { v1: arc4.state, v2: arc5.state };
}

/* ---------------- the scenario (also re-run against each Main mutant) ---------------- */

async function pressScavengeScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const harnesses: Harness[] = [];
  try {
    const h = mainScavengeHarness(f, mutations);
    harnesses.push(h);
    const button = h.scavengeButton();
    expect(button, 'Main must render the Scavenge control').not.toBeNull();
    expect(button!.disabled, 'the Scavenge control must be enabled').toBe(false);
    expect(button!.dataset.modelEnabled).toBe('true');
    const yieldBefore = Number(h.budget()!.dataset.remaining);
    expect(yieldBefore).toBeGreaterThan(0);
    expect(Number(h.budget()!.dataset.used)).toBe(0);
    expect(await f.repository.revision()).toBe(0);
    expect(await f.backend.keys('receipts')).toEqual([]);
    const codexBefore = f.state.codex.length;
    const essenceBefore = f.state.essence;

    // Press; then a double-tap on the now-disabled control, and a forced
    // re-enabled press while the first is still in flight.
    button!.click();
    expect(button!.disabled, 'the pressed control must be disabled while in flight').toBe(true);
    button!.click();
    button!.disabled = false;
    button!.click();
    await settled(h);

    // (1) the durable outcome, read back from the real backend
    expect(await f.repository.revision(), 'scavenge: pressing Scavenge must commit exactly one revision').toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'scavenge: exactly one receipt').toHaveLength(1);
    expect((await f.repository.readReceipt(0))?.kind).toBe('capture-attempt');
    const saved = await durableSave(f);
    const authority = readF4Authority(saved.extensions);
    expect(authority.kind).toBe('loaded');
    if (authority.kind === 'loaded') {
      expect(authority.authority.sessionRng.draws, 'scavenge: exactly one candidate and one success draw')
        .toEqual({ [DOMAINS.captureCandidate]: 1, [DOMAINS.captureSuccess]: 1 });
    }
    const owned = durableOwnership(saved.extensions);
    expect(owned.v2.specimenLots, 'scavenge: exactly one durable specimen lot').toHaveLength(1);
    expect(owned.v1.specimenLots).toHaveLength(1);
    expect(owned.v2.creatures, 'scavenge: flora capture adds no creature').toHaveLength(0);
    const lot = owned.v2.specimenLots[0]!;
    expect(owned.v2.catalogSpecies.map(({ speciesId }) => speciesId),
      'scavenge: the Compendium catalogue gains exactly the scavenged species').toEqual([lot.speciesId]);
    expect(owned.v2.biosphereProgress[0], 'scavenge: exactly one Biosphere Yield spent').toMatchObject({ used: 1 });
    expect(saved.state.codex, 'scavenge: the durable Compendium gains exactly one page').toHaveLength(codexBefore + 1);

    const result = h.exec.result();
    expect(h.env.lastArc4CaptureOutcome).toBe('scavenge-committed:1');
    expect(result, 'scavenge: the committed result must be published').not.toBeNull();
    expect(result).toMatchObject({ hit: true, firstForSpecies: true, speciesId: lot.speciesId, revision: 1 });
    expect(['flora', 'fungi']).toContain(result!.kingdom);
    expect(result!.ownedRowId).toBe(lot.lotId);
    expect(result!.remainingAfter).toBe(yieldBefore - 1);
    expect(saved.state.essence, 'scavenge: durable Stardust must be the start plus the Rare Find reward only')
      .toBe(essenceBefore + result!.stardustReward);

    // (2) the live save publishes exactly the durable save
    expect(JSON.stringify(h.env.save), 'scavenge: the live save must equal the durable save')
      .toBe(JSON.stringify(saved.state));
    expect(h.env.lastPersistenceOutcome).toBe('arc4-scavenge-committed:1');
    expect(h.env.activePersist).toBeNull();
    expect(h.env.productActionInFlight).toBe(false);
    expect(h.exec.controller().diagnostics().pendingWork, 'the controller must settle its one press').toBe(0);
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.queueProgressionRefresh).toHaveBeenCalledTimes(1);
    expect(h.queueProgressionRefresh).toHaveBeenCalledWith('arc4.capture.scavenge');
    expect(h.toast).toHaveBeenCalledTimes(1);
    expect(h.toast).toHaveBeenCalledWith(`Scavenged ${result!.speciesName}.`, expect.stringContaining('New Compendium page'), true);
    // the refreshed card shows the spent Yield and a fresh idle control
    expect(Number(h.budget()!.dataset.used), 'the refreshed card must show one spent Yield').toBe(1);
    expect(Number(h.budget()!.dataset.remaining)).toBe(yieldBefore - 1);
    // a second independent read of the same storage is identical
    expect(JSON.stringify(await durableSave(f))).toBe(JSON.stringify(saved));

    // (3) reboot a fresh F4 runtime from the committed save and re-render the card from it
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded');
    expect(f.state.codex, 'the reloaded save keeps the Compendium page').toEqual(saved.state.codex);
    expect(JSON.stringify(f.state)).toBe(JSON.stringify(saved.state));
    const reloaded = mainScavengeHarness(f, mutations);
    harnesses.push(reloaded);
    expect(Number(reloaded.budget()!.dataset.used), 'the reloaded card must still show one spent Yield').toBe(1);

    // (4) a second deliberate press after reload is a NEW attempt: it spends
    // one more Yield and can never duplicate the species already scavenged
    // this cycle (no second lot, page or Rare Find for it).
    const again = reloaded.scavengeButton();
    expect(again?.disabled, 'the reloaded Scavenge control must be enabled').toBe(false);
    again!.click();
    await settled(reloaded);
    expect(await f.repository.revision(), 'a second press commits one more attempt, never two').toBe(2);
    expect(await f.backend.keys('receipts')).toHaveLength(2);
    const second = await durableSave(f);
    const ownedAfter = durableOwnership(second.extensions);
    expect(ownedAfter.v2.biosphereProgress[0]).toMatchObject({ used: 2 });
    expect(ownedAfter.v2.specimenLots.filter(({ speciesId }) => speciesId === lot.speciesId),
      'the first species must never gain a second lot this cycle').toHaveLength(1);
    const lotSpecies = ownedAfter.v2.specimenLots.map(({ speciesId }) => speciesId);
    expect(new Set(lotSpecies).size, 'no species may hold two lots from one cycle').toBe(lotSpecies.length);
    const codexIds = second.state.codex.map(([id]) => id);
    expect(new Set(codexIds).size, 'no duplicate Compendium page').toBe(codexIds.length);
    expect(second.state.codex.slice(0, saved.state.codex.length)).toEqual(saved.state.codex);
    expect(JSON.stringify(reloaded.env.save), 'the second press: live save must equal the durable save')
      .toBe(JSON.stringify(second.state));
    const secondResult = reloaded.exec.result();
    expect(secondResult?.speciesId === lot.speciesId && secondResult?.hit,
      'the second press must not re-scavenge the first species').not.toBe(true);
  } finally {
    for (const h of harnesses) h.dom.window.close();
    await f.runtime.release();
  }
}

describe('A5 #53 — Scavenge is a UI outcome that survives reload', () => {
  it('a pressed Scavenge commits one specimen and one Compendium page exactly once, survives re-read and reboot, and cannot duplicate', async () => {
    await pressScavengeScenario();
  }, 30_000);

  it('the harness Survey mount re-runs showSurvey\'s exact capture mount lines', () => {
    expect(MAIN_SOURCE.split(`? '${SURVEY_CAPTURE_MOUNT_HTML}'`).length - 1).toBe(1);
    expect(MAIN_SOURCE.split(`\n${SURVEY_CAPTURE_ATTACH}\n`).length - 1).toBe(1);
    expect(MAIN_SCAVENGE_SOURCE).toContain('void runCaptureCardAction(request, presentationFence);');
    expect(MAIN_SCAVENGE_SOURCE).toContain('async function commitArc4CaptureAction(');
  });

  /* NEGATIVE CONTROLS. Each mutant edits the executed Main source by one
   * exact unique string; the unmutated source passes the scenario above.
   * Each mutant must FAIL, with the assertion that names what broke. */
  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; failsWith: RegExp }>> = [
    {
      mutation: {
        name: 'UNWIRED: the capture controller press never reaches runCaptureCardAction',
        needle: '    void runCaptureCardAction(request, presentationFence);',
        replacement: '    void request; void presentationFence;',
      },
      failsWith: /scavenge: pressing Scavenge must commit exactly one revision/u,
    },
    {
      mutation: {
        name: 'DROPPED COMMIT: the action never reaches the durable capture transaction',
        needle: '      attempt = await commitArc4CaptureAttemptV1({',
        replacement: "      attempt = { kind: 'refused', detail: 'mutant-dropped', convergence: 'none', transaction: null } as never; void ({",
      },
      failsWith: /scavenge: pressing Scavenge must commit exactly one revision/u,
    },
    {
      mutation: {
        name: 'DOUBLED PAGE (live): the Compendium page is published twice',
        needle: '      publishArc4CaptureFields(save, transaction.state);',
        replacement: '      publishArc4CaptureFields(save, transaction.state);\n      save.codex = [...save.codex, ...save.codex];',
      },
      failsWith: /scavenge: the live save must equal the durable save/u,
    },
    {
      mutation: {
        name: 'DOUBLED REWARD (durable): the commit starts from a pre-paid parent',
        needle: '        state: save,\n        nav,',
        replacement: '        state: { ...save, essence: save.essence + 25, stats: { ...save.stats, essenceEarned: (save.stats.essenceEarned ?? 0) + 25 } },\n        nav,',
      },
      failsWith: /scavenge: durable Stardust must be the start plus the Rare Find reward only/u,
    },
  ];

  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_SCAVENGE_SOURCE, mutation)).not.toThrow();
      await expect(pressScavengeScenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }

  it('negative control — the mutation helper refuses a drifted needle instead of running unmutated', () => {
    expect(() => replaceExact(MAIN_SCAVENGE_SOURCE, {
      name: 'drifted', needle: 'void runCaptureCardActionNonexistent(', replacement: '',
    })).toThrow(/found 0/u);
  });
});
