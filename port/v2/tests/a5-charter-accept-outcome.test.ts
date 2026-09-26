/* A5 gap #4 — Starter and Weekly Charter Accept, asserted as a UI OUTCOME.
 *
 * CLAUDE.md rule 7: assert the outcome, not the code path. The direct tests in
 * starter-charters.test.ts call commitStarterCharterAcceptV1() themselves, so
 * they stay green even if the shipped Charters panel never reaches it. Here the
 * exact shipped main.ts sections (the Charters panel filler, its click owner,
 * runStarterCharterAccept and its pilot wrapper) are sliced, type-stripped and
 * executed with an injected env (the explorer-meal-action.test.ts pattern). The
 * test presses the Accept button main.ts rendered in JSDOM, then reads the
 * COMMITTED v5 save back from a real memory backend with readSaveV5, reboots a
 * fresh F4 runtime from that durable save, and re-renders the panel from it.
 *
 * Only what the sections need from outside is stubbed: the panel manager
 * (panels.ts binds the global document at import), toast / ceremony / chips,
 * the unrelated write-hold flags, and ascStage (the ship chassis stage). */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { projectV2Charter } from '@cf/scene';
import {
  arc2LootLegacyMirrorMatches,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc2LootCarrier,
  migrateStoredV4ToV5,
  prepareArc2LootLegacyMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc2Loot,
  readF4Authority,
  readSaveV5,
  V4_PRIMARY_KEY,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1,
  STARTER_CHARTER_IDS_V1,
  commitStarterCharterAcceptV1,
  isWeeklyCharterIdV1,
  operationForStarterCharterAcceptV1,
  operationForWeeklyCharterAcceptV1,
  projectStarterCharterBoardV1,
  publishStarterCharterAcceptFieldsV1,
  renderStarterCharterBoardV1,
} from '../apps/game/src/starter-charters.js';
import {
  WEEKLY_CHARTER_CYCLE_ACTIVE_MS,
  projectWeeklyCharterBoardV1,
  renderWeeklyCharterBoardV1,
  weeklyCharterCycleV1,
  weeklyCharterSlateV1,
} from '../apps/game/src/weekly-charters.js';
import { capturePanelRefillFocus } from '../apps/game/src/panel-refill-focus.js';
import {
  createF4RuntimeAuthority,
  type F4RuntimeAuthority,
} from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';
import REGISTRY_JSON from '../../baseline-v1.8.9/content-registry.json';

const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
const CODEC_NOW = 10;
const WEEK = WEEKLY_CHARTER_CYCLE_ACTIVE_MS;
const TRADES_DONE = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq'];
const here = path.dirname(fileURLToPath(import.meta.url));
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');

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
    throw new Error(`Main Charter section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Charter section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

const MAIN_CHARTER_SOURCE = [
  // the module-level pending/outcome/status cells the panel and the action share
  exactMainSection(
    'let starterCharterAcceptPendingId: CharterAcceptIdV1 | null = null;',
    '\nlet arc9BinderClaimPendingId',
  ),
  // boundedCollectionActionsWritable, starterCharterPanelStatus, syncBoundedCollectionButtons
  exactMainSection(
    'function boundedCollectionActionsWritable(): boolean {',
    '\nfunction fillRecords(): void {',
  ),
  // fillCharters, the Charters panel registration and its click owner
  exactMainSection(
    'function fillCharters(): void {',
    '\nconst primeCodexOpener = appChrome.primeCodexOpener();',
  ),
  // refusal policy, the live active-play clock, runStarterCharterAccept and its pilot wrapper
  exactMainSection(
    'type BoundedCollectionRefusalV1 =',
    '\nasync function runArc9BinderSetClaim(',
  ),
].join('\n');

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

/** Exact, unique string replacement (CLAUDE.md rule 2): a drifted needle must
 * fail loudly, never silently leave the control unmutated. */
function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main Charter source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

interface ExecutableMainCharters {
  readonly pendingId: () => string | null;
  readonly outcome: () => string | null;
  readonly status: () => string | null;
}

function executableMainCharters(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMainCharters {
  const source = mutations.reduce(replaceExact, MAIN_CHARTER_SOURCE);
  const transformed = transformSync('main-charters.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    pendingId: () => starterCharterAcceptPendingId,
    outcome: () => lastStarterCharterAcceptOutcome,
    status: () => lastStarterCharterAcceptStatus,
  }; }`)(env) as ExecutableMainCharters;
}

/* ---------------- durable fixtures (real F4 runtime over a memory backend) ---------------- */

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
const veteran = (): SaveStateV2 => { const s = state(); s.chDone = [...TRADES_DONE]; return s; };

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
}

async function fixtureAt(save: SaveStateV2, activePlayMs: number): Promise<DurableFixture> {
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs }, createSessionRNG(0xA5C4_0001).state());
  const loot = prepareArc2LootLegacyMigration({
    extensions: f4.extensions,
    legacy: { items: save.items, equip: save.equip, equipAff: save.equipAff },
    capacity: 12,
  });
  if (loot.kind !== 'prepared') throw new Error(`Charter loot fixture was ${loot.kind}`);
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: save, extensions: loot.extensions }, REGISTRY, CODEC_NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, CODEC_NOW);
  if (migration.kind !== 'migrated') throw new Error(`Charter fixture was ${migration.kind}`);
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: loot.extensions, initialState: initial.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 0,
    ownerId: 'a5-charter-tab', token: 'a5-charter-document',
    leaseTtlMs: 1_000_000, now: () => CODEC_NOW, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Charter lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: initial.canonicalState };
}

/** A reload: release the first document's lease, read the committed v5 save
 * back from storage, and boot a fresh F4 runtime from exactly that save. */
async function rebootFromDurableSave(previous: DurableFixture): Promise<DurableFixture> {
  await previous.runtime.release();
  const saved = await readSaveV5(previous.backend, REGISTRY, CODEC_NOW);
  if (saved.kind !== 'loaded') throw new Error(`reload read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`reload F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(previous.backend);
  const runtime = createF4RuntimeAuthority({
    backend: previous.backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: 'a5-charter-reloaded-tab', token: 'a5-charter-reloaded-document',
    leaseTtlMs: 1_000_000, now: () => CODEC_NOW, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`reloaded Charter lease was ${heartbeat.kind}`);
  return { backend: previous.backend, repository, runtime, state: saved.state };
}

/* ---------------- the Main harness ---------------- */

interface PanelDefStub { readonly id: string; readonly el: HTMLElement; readonly onOpen?: () => void }

function mainChartersHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <button id="objchip" type="button">Charters</button>
    <aside id="chpanel" aria-label="Charters"></aside>
  </body></html>`);
  const document = dom.window.document;
  const panels = new Map<string, PanelDefStub>();
  const loot = readArc2Loot(f.runtime.extensions);
  if (loot.kind !== 'loaded') throw new Error(`Charter harness loot was ${loot.kind}`);
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const ceremony = vi.fn();
  const env: Record<string, unknown> & {
    save: SaveStateV2;
    activePersist: unknown;
    productActionInFlight: boolean;
    lastPersistenceOutcome: string | null;
  } = {
    document,
    Element: dom.window.Element,
    // panels.ts stand-ins (it binds the global document at import): same display/innerHTML contract
    registerPanel: (def: PanelDefStub) => { panels.set(def.id, def); def.el.style.display = 'none'; },
    fillPanel: (id: string, html: string) => { const def = panels.get(id); if (def) def.el.innerHTML = html; },
    openPanelId: () => [...panels.values()].find(({ el }) => el.style.display !== 'none')?.id ?? null,
    capturePanelRefillFocus,
    esc: (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!)),
    projectV2Charter,
    ascStage: () => 0,
    save: f.state,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    smokeForceReadOnly: false,
    activePersist: null,
    importWriteInFlight: false,
    replacementTransaction: null,
    replacementReloadPending: false,
    trainingCheckpointWriteHeld: false,
    trainingActive: () => false,
    ecologyEpochBlocksActions: () => false,
    productActionCoordinator: createProductActionCoordinator(),
    productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined,
    audiovisualPilot: null,
    arc2LootState: loot.state,
    inventoryPanelController: { setState: vi.fn() },
    STARTER_CHARTER_IDS_V1,
    isWeeklyCharterIdV1,
    projectStarterCharterBoardV1,
    renderStarterCharterBoardV1,
    projectWeeklyCharterBoardV1,
    renderWeeklyCharterBoardV1,
    weeklyCharterCycleV1,
    operationForStarterCharterAcceptV1,
    operationForWeeklyCharterAcceptV1,
    commitStarterCharterAcceptV1,
    publishStarterCharterAcceptFieldsV1,
    readArc2Loot,
    encodeArc2LootCarrier,
    arc2LootLegacyMirrorMatches,
    Date: Object.freeze({ now: () => CODEC_NOW }),
    performance: Object.freeze({ now: () => 17 }),
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    toast,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    presentProgressionCeremony: ceremony,
    updateChips: vi.fn(),
    fillRecords: vi.fn(),
  };
  const exec = executableMainCharters(env, mutations);
  const panel = panels.get('ch');
  if (panel === undefined) throw new Error('Main did not register the Charters panel');
  panel.el.style.display = 'block';
  panel.onOpen?.();
  return { dom, env, exec, panel: panel.el, toast, scheduleReload, ceremony };
}
type Harness = ReturnType<typeof mainChartersHarness>;

/** Wait until the press the shipped click owner started has fully settled. */
async function settled(h: Harness): Promise<void> {
  await vi.waitFor(() => {
    if (h.exec.pendingId() !== null || h.exec.outcome() === 'pending') throw new Error('Charter accept still pending');
  }, { timeout: 5_000, interval: 2 });
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}

function acceptButton(h: Harness, attribute: 'data-starter-charter-accept' | 'data-weekly-charter-accept', id: string) {
  return h.panel.querySelector<HTMLButtonElement>(`[${attribute}="${id}"]`);
}

/** A stale control: the same markup main.ts rendered before the commit, as a
 * double-tap on a not-yet-refilled panel or a stale DOM would present it. */
function injectStaleAccept(h: Harness, attribute: 'data-starter-charter-accept' | 'data-weekly-charter-accept', id: string) {
  const stale = h.panel.ownerDocument.createElement('button');
  stale.type = 'button';
  stale.setAttribute(attribute, id);
  stale.textContent = 'Accept';
  h.panel.append(stale);
  return stale;
}

function committedOrdinal(outcome: string | null, id: string): number {
  const match = new RegExp(`^committed:${id}:(\\d+)$`, 'u').exec(outcome ?? '');
  if (match === null) throw new Error(`press outcome was ${String(outcome)}, not committed:${id}:<ordinal>`);
  return Number(match[1]);
}

/* ---------------- scenarios (also re-run against each Main mutant) ---------------- */

async function starterPressScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await fixtureAt(state(), 0);
  const harnesses: Harness[] = [];
  try {
    const h = mainChartersHarness(f, mutations);
    harnesses.push(h);
    const button = acceptButton(h, 'data-starter-charter-accept', 'st-land');
    expect(button, 'Main must render an enabled Starter Accept control for st-land').not.toBeNull();
    expect(button!.disabled).toBe(false);
    expect(button!.textContent).toBe('Accept');
    expect(await f.repository.revision()).toBe(0);
    expect(await f.backend.keys('receipts')).toEqual([]);

    // (3a) a double-tap: the second press lands on the refilled, now-disabled control
    button!.click();
    expect(h.exec.pendingId(), 'the press must start exactly this Charter').toBe('st-land');
    expect(h.panel.getAttribute('aria-busy')).toBe('true');
    expect(h.panel.querySelector('.starter-charter-status')?.textContent)
      .toBe('Saving this Starter Charter acceptance…');
    const refilled = acceptButton(h, 'data-starter-charter-accept', 'st-land');
    expect(refilled, 'the pending refill keeps the control, disabled').not.toBeNull();
    expect(refilled!.disabled).toBe(true);
    refilled!.click();
    button!.click(); // the detached pre-refill node: must not reach the panel's click owner
    await settled(h);

    // (1) exactly one durable accept, published to the live save and the panel
    const ordinal = committedOrdinal(h.exec.outcome(), 'st-land');
    expect(await f.repository.revision(), 'pressing Accept must commit exactly one revision').toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'pressing Accept must commit exactly one receipt').toHaveLength(1);
    expect((await f.repository.readReceipt(ordinal))?.kind).toBe(STARTER_CHARTER_ACCEPT_RECEIPT_KIND_V1);
    const saved = await readSaveV5(f.backend, REGISTRY, CODEC_NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind !== 'loaded') return;
    expect(saved.state.chacc, 'the committed save chacc must hold exactly the pressed Charter').toEqual(['st-land']);
    expect(saved.state.essence, 'an accept alone pays nothing').toBe(10);
    expect(h.env.save.chacc, 'the live save must publish the durable acceptance').toEqual(['st-land']);
    expect(h.exec.status()).toMatch(/^Accepted .+\. Its durable progress is now active\.$/u);
    expect(h.toast).toHaveBeenCalledWith('Charter accepted', expect.stringMatching(/is now active\.$/u), true);
    expect(h.ceremony).toHaveBeenCalledTimes(1);
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.env.activePersist).toBeNull();
    expect(h.env.productActionInFlight).toBe(false);
    expect(h.env.lastPersistenceOutcome).toBe('starter-charter-accept-committed:1');
    expect(h.panel.querySelector('[data-starter-charter="st-land"]')?.getAttribute('data-charter-status'),
      'the refilled panel must show st-land as accepted').toBe('accepted');
    expect(acceptButton(h, 'data-starter-charter-accept', 'st-land')).toBeNull();
    // a second read of the same storage is identical
    expect(JSON.stringify(await readSaveV5(f.backend, REGISTRY, CODEC_NOW))).toBe(JSON.stringify(saved));

    // (3b) a stale Accept pressed after the commit is a no-op, never a second accept or payment
    h.toast.mockClear();
    injectStaleAccept(h, 'data-starter-charter-accept', 'st-land').click();
    await settled(h);
    expect(h.exec.outcome(), 'a second press must be recognised as already accepted').toBe('current:st-land');
    expect(h.exec.status()).toBe('That Starter Charter is already accepted or complete.');
    expect(h.toast).not.toHaveBeenCalled();
    expect(await f.repository.revision(), 'a second press must not commit').toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);

    // reload: boot a fresh runtime from the committed save and re-render the panel from it
    f = await rebootFromDurableSave(f);
    expect(f.state.chacc, 'the reloaded save chacc must hold the acceptance').toEqual(['st-land']);
    expect(f.state.essence).toBe(10);
    const reloaded = mainChartersHarness(f, mutations);
    harnesses.push(reloaded);
    expect(reloaded.panel.querySelector('[data-starter-charter="st-land"]')?.getAttribute('data-charter-status'),
      'the reloaded panel must still show st-land as accepted').toBe('accepted');
    expect(acceptButton(reloaded, 'data-starter-charter-accept', 'st-land')).toBeNull();
    injectStaleAccept(reloaded, 'data-starter-charter-accept', 'st-land').click();
    await settled(reloaded);
    expect(reloaded.exec.outcome(), 'a press after reload must be recognised as already accepted').toBe('current:st-land');
    expect(await f.repository.revision()).toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);
    const reread = await readSaveV5(f.backend, REGISTRY, CODEC_NOW);
    expect(reread.kind === 'loaded' && reread.state.chacc).toEqual(['st-land']);
  } finally {
    for (const h of harnesses) h.dom.window.close();
    await f.runtime.release();
  }
}

async function weeklyPressScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  const cycle = 6;
  const at = cycle * WEEK + 1_234;
  const id = weeklyCharterSlateV1(cycle)[0]!;
  let f = await fixtureAt(veteran(), at);
  const harnesses: Harness[] = [];
  try {
    const h = mainChartersHarness(f, mutations);
    harnesses.push(h);
    expect(f.runtime.diagnostics().activePlayMs).toBe(at);
    expect(h.panel.querySelector('[data-weekly-charter-board]')?.getAttribute('data-weekly-cycle'),
      'the five-trades board must be open on this active-play cycle').toBe(String(cycle));
    const button = acceptButton(h, 'data-weekly-charter-accept', id);
    expect(button, `Main must render an enabled Weekly Accept control for ${id}`).not.toBeNull();
    expect(button!.disabled).toBe(false);

    button!.click();
    expect(h.exec.pendingId(), 'the weekly press must start exactly this Charter').toBe(id);
    const refilled = acceptButton(h, 'data-weekly-charter-accept', id);
    expect(refilled?.disabled, 'the pending refill keeps the weekly control, disabled').toBe(true);
    refilled!.click(); // double-tap on the refilled control
    await settled(h);

    const ordinal = committedOrdinal(h.exec.outcome(), id);
    expect(await f.repository.revision(), 'pressing Weekly Accept must commit exactly one revision').toBe(1);
    const receipts = await f.backend.keys('receipts');
    expect(receipts, 'pressing Weekly Accept must commit exactly one receipt').toHaveLength(1);
    expect(await f.repository.readReceipt(ordinal)).toBeDefined();
    const saved = await readSaveV5(f.backend, REGISTRY, CODEC_NOW);
    expect(saved.kind).toBe('loaded');
    if (saved.kind !== 'loaded') return;
    expect(saved.state.chWeek, 'the committed save chWeek must be the current active-play cycle').toBe(cycle);
    expect(saved.state.chacc, 'the committed save chacc must hold exactly the pressed Weekly Charter').toEqual([id]);
    expect(saved.state.essence, 'a weekly accept alone pays nothing').toBe(10);
    expect(h.env.save.chacc, 'the live save must publish the durable weekly acceptance').toEqual([id]);
    expect(h.env.save.chWeek).toBe(cycle);
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.panel.querySelector(`[data-weekly-charter="${id}"]`)?.getAttribute('data-charter-status'),
      'the refilled weekly board must show the Charter as accepted').toBe('accepted');
    expect(acceptButton(h, 'data-weekly-charter-accept', id)).toBeNull();

    // (3) a stale Weekly Accept after the commit is a no-op
    h.toast.mockClear();
    injectStaleAccept(h, 'data-weekly-charter-accept', id).click();
    await settled(h);
    expect(h.exec.outcome(), 'a second weekly press must be recognised as already accepted').toBe(`current:${id}`);
    expect(h.toast).not.toHaveBeenCalled();
    expect(await f.repository.revision(), 'a second weekly press must not commit').toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);

    // reload
    f = await rebootFromDurableSave(f);
    expect(f.state.chWeek, 'the reloaded save keeps the accepted cycle').toBe(cycle);
    expect(f.state.chacc).toEqual([id]);
    expect(f.runtime.diagnostics().activePlayMs).toBe(at);
    const reloaded = mainChartersHarness(f, mutations);
    harnesses.push(reloaded);
    expect(reloaded.panel.querySelector(`[data-weekly-charter="${id}"]`)?.getAttribute('data-charter-status'),
      'the reloaded weekly board must still show the Charter as accepted').toBe('accepted');
    injectStaleAccept(reloaded, 'data-weekly-charter-accept', id).click();
    await settled(reloaded);
    expect(reloaded.exec.outcome()).toBe(`current:${id}`);
    expect(await f.repository.revision()).toBe(1);
    expect(await f.backend.keys('receipts')).toEqual(receipts);
  } finally {
    for (const h of harnesses) h.dom.window.close();
    await f.runtime.release();
  }
}

describe('A5 — Charter Accept is a UI outcome that survives reload', () => {
  it('(1)+(3) a pressed Starter Accept commits exactly one acceptance, refuses a second press, and survives reload', async () => {
    await starterPressScenario();
  });

  it('(2)+(3) a pressed Weekly Accept commits chWeek = the active-play cycle and the id, refuses a second press, and survives reload', async () => {
    await weeklyPressScenario();
  });

  /* (4) NEGATIVE CONTROLS. Each mutant edits the executed Main section by one
   * exact unique string; the unmutated source passes the same scenario above.
   * Each mutant must FAIL, and fail with the assertion that names what broke. */
  const MUTANTS: ReadonlyArray<Readonly<{
    mutation: MainMutation;
    scenario: typeof starterPressScenario;
    failsWith: RegExp;
  }>> = [
    {
      mutation: {
        name: 'Starter click owner no longer starts the accept',
        needle: '  if (id !== undefined) void acceptStarterCharterWithPilot(id, event.isTrusted);',
        replacement: '  if (id !== undefined) void id;',
      },
      scenario: starterPressScenario,
      failsWith: /the press must start exactly this Charter: expected null/u,
    },
    {
      mutation: {
        name: 'the accept never reaches the durable commit',
        needle: '    outcome = await commitStarterCharterAcceptV1({',
        replacement: '    outcome = await (async (input: { id: CharterAcceptIdV1 }) => ({ kind: \'current\' as const, id: input.id }))({',
      },
      scenario: starterPressScenario,
      failsWith: /press outcome was current:st-land, not committed:st-land/u,
    },
    {
      mutation: {
        name: 'the durable acceptance is never published to the live save',
        needle: '      publishStarterCharterAcceptFieldsV1(sourceState, outcome);\n',
        replacement: '',
      },
      scenario: starterPressScenario,
      failsWith: /the live save must publish the durable acceptance/u,
    },
    {
      mutation: {
        name: 'Main drops its already-accepted guard (the second press is no longer recognised)',
        needle: "  if (save.chacc.includes(id) || save.chDone.includes(id) || weeklyRow?.status === 'completed') {",
        replacement: '  if (false) {',
      },
      scenario: starterPressScenario,
      failsWith: /a second press must be recognised as already accepted/u,
    },
    {
      mutation: {
        name: 'Weekly click owner no longer starts the accept',
        needle: '    if (isWeeklyCharterIdV1(weeklyId)) void acceptStarterCharterWithPilot(weeklyId, event.isTrusted);',
        replacement: '    if (isWeeklyCharterIdV1(weeklyId)) void weeklyId;',
      },
      scenario: weeklyPressScenario,
      failsWith: /the weekly press must start exactly this Charter: expected null/u,
    },
    {
      mutation: {
        name: 'the weekly commit loses its active-play snapshot',
        needle: '      ...(weeklyAtClick !== null ? { activePlayMs: weeklyAtClick } : {}),\n',
        replacement: '',
      },
      scenario: weeklyPressScenario,
      failsWith: /press outcome was refused:.+, not committed:wk-/u,
    },
  ];

  for (const { mutation, scenario, failsWith } of MUTANTS) {
    it(`(4) negative control — ${mutation.name}: the outcome test fails`, async () => {
      // the needle is exact and unique in the executed source (replaceExact throws otherwise)
      expect(() => replaceExact(MAIN_CHARTER_SOURCE, mutation)).not.toThrow();
      await expect(scenario([mutation])).rejects.toThrow(failsWith);
    });
  }

  it('(4) negative control — the mutation helper refuses a drifted needle instead of running unmutated', () => {
    expect(() => replaceExact(MAIN_CHARTER_SOURCE, {
      name: 'drifted', needle: 'void acceptStarterCharterWithPilot(nonexistent', replacement: '',
    })).toThrow(/found 0/u);
    // and the executed source really is the shipped click owner and action
    expect(MAIN_CHARTER_SOURCE).toContain("document.getElementById('chpanel')!.addEventListener('click', (event) => {");
    expect(MAIN_CHARTER_SOURCE).toContain('async function runStarterCharterAccept(id: CharterAcceptIdV1): Promise<boolean> {');
  });
});
