/* A5 gap #8 (INVENTORY.md rows #30-33): the Atlas verbs — Favorite, Home,
 * Remove and the TIMED Undo — as UI OUTCOME tests.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. Each verb was
 * proven only by calling its transaction directly (DIRECT). Undo is
 * time-windowed, and that timing is exactly what a press catches. Here the
 * exact shipped main.ts sections are sliced, type-stripped and executed with
 * an injected env:
 *   - the Star Atlas state, the Undo window, fillAtlas and the panel's
 *     delegated click listener,
 *   - arc9AtlasRowActionBlocked and the four runners (Home, Remove, Undo,
 *     Favorite).
 * The test presses the rendered `[data-atlas-favorite]`, `[data-atlas-home]`,
 * `[data-atlas-remove]` and `[data-atlas-undo]` controls, reads the COMMITTED
 * v5 save back from a real memory backend with readSaveV5 after each press,
 * drives the Undo window on the injected performance clock, and reboots a
 * fresh F4 runtime from the durable save.
 *
 * Stubbed externals: the panel manager (fillPanel → innerHTML; openPanelId
 * → 'atlas'), focus restoration, toast, the heartbeat settle, the reload
 * scheduler, travel (not pressed), and world identity (current, no landings). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readCombatSettlementAuthorityV1,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import { NAV_HOME } from '@cf/scene';
import {
  commitArc9AtlasFavoriteV1,
  operationForArc9AtlasFavoriteV1,
  publishArc9AtlasFavoriteFieldsV1,
} from '../apps/game/src/arc9-atlas-favorite-action.js';
import {
  commitArc9AtlasHomeV1,
  commitArc9AtlasRemoveV1,
  commitArc9AtlasUndoV1,
  operationForArc9AtlasHomeV1,
  operationForArc9AtlasRemoveV1,
  operationForArc9AtlasUndoV1,
  publishArc9AtlasHomeFieldsV1,
  publishArc9AtlasRemoveFieldsV1,
  publishArc9AtlasUndoFieldsV1,
} from '../apps/game/src/arc9-atlas-row-actions.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';
import {
  projectStarAtlasV1,
  renderStarAtlasV1,
  STAR_ATLAS_FILTERS_V1,
  STAR_ATLAS_VIEWS_V1,
} from '../apps/game/src/star-atlas-panel.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_080_000;
const BEFORE_ID = 'atlas:before';
const TARGET_ID = 'atlas:target';
const AFTER_ID = 'atlas:after';
const UNDO_WINDOW_MS = 8_000;

interface TestWindow extends Window { readonly Element: typeof Element; close(): void }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

/* ---------------- the exact shipped Main sections ---------------- */

function exactMainSection(start: string, end: string): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main Atlas section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Atlas section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

const MAIN_ATLAS_SOURCE = [
  // Atlas state, the timed Undo, fillAtlas and the panel's click listener
  exactMainSection("let arc9AtlasView: StarAtlasViewV1 = 'list';", '/* CHARTERS — current-slice projection'),
  // the row-action gate and the Home / Remove / Undo / Favorite runners
  exactMainSection('function arc9AtlasRowActionBlocked(): boolean {', '\nfunction freshCurrentBioscanReady('),
].join('\n');

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main Atlas source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

function executableMainAtlas(env: Record<string, unknown>, mutations: readonly MainMutation[]): { fill: () => void } {
  const source = mutations.reduce(replaceExact, MAIN_ATLAS_SOURCE);
  const transformed = transformSync('main-atlas.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return { fill: () => fillAtlas() }; }`)(env) as { fill: () => void };
}

/* ---------------- durable fixtures ---------------- */

function atlasEntry(id: string, favorite: boolean, ordinal: number): [string, Record<string, unknown>] {
  return [id, {
    id,
    title: `Chart ${ordinal}`,
    sub: `Exact Atlas row ${ordinal}`,
    thumb: null,
    sq: ordinal % 2 === 0,
    badge: ordinal === 1 ? 'Life' : '',
    where: {
      gal: { x: 90 + ordinal, y: -60, seed: 999, size: 1_500 },
      star: { x: ordinal, y: -ordinal, seed: 424_242 + ordinal },
      pseed: 133 + ordinal,
      type: 'planet',
    },
    fav: favorite,
    t: NOW - ordinal,
    star: ordinal === 1 ? 'G' : '',
    retained: { ordinal, nested: [`row:${ordinal}`] },
  }];
}

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
}

async function freshFixture(): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state = imported.state;
  state.logMap = [atlasEntry(BEFORE_ID, true, 0), atlasEntry(TARGET_ID, false, 1), atlasEntry(AFTER_ID, false, 2)];
  state.homeId = BEFORE_ID;
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0xA9000007).state());
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`Atlas fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  return bootFromDurableSave(backend, 'first');
}

async function bootFromDurableSave(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`Atlas boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`Atlas boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-atlas-${tag}-tab`, token: `a5-atlas-${tag}-document`,
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Atlas lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: saved.state };
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

/* ---------------- the Main harness ---------------- */

function mainAtlasHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section id="atlaspanel" style="display:block"></section>
  </body></html>`);
  const document = dom.window.document;
  const panel = document.getElementById('atlaspanel')!;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>;
  const DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'Event'] as const;
  const prior = DOM_GLOBALS.map((key) => [key, g[key]] as const);
  for (const key of DOM_GLOBALS) g[key] = w[key];
  let clock = 1_000;
  /* the Undo expiry timer main.ts arms with window.setTimeout, fired by the harness clock */
  const timers: Array<{ readonly at: number; readonly fn: () => void }> = [];
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const env: Record<string, unknown> & { save: SaveStateV2; activePersist: unknown; productActionInFlight: boolean } = {
    document,
    Element: dom.window.Element,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => clock }),
    window: Object.freeze({ setTimeout: (fn: () => void, ms: number) => { timers.push({ at: clock + ms, fn }); return timers.length; } }),
    save: f.state,
    nav: NAV_HOME,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    lastArc9AtlasFavoriteOutcome: null,
    atlasRouteStates: new WeakMap(),
    worldIdentityProtection: null,
    worldIdentityBootstrapPending: false,
    worldIdentityState: Object.freeze({ records: [] }),
    // write-hold flags (unrelated owners), all idle
    activePersist: null,
    smokeForceReadOnly: false,
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
    // the real owners main.ts imports
    commitArc9AtlasFavoriteV1, operationForArc9AtlasFavoriteV1, publishArc9AtlasFavoriteFieldsV1,
    commitArc9AtlasHomeV1, commitArc9AtlasRemoveV1, commitArc9AtlasUndoV1,
    operationForArc9AtlasHomeV1, operationForArc9AtlasRemoveV1, operationForArc9AtlasUndoV1,
    publishArc9AtlasHomeFieldsV1, publishArc9AtlasRemoveFieldsV1, publishArc9AtlasUndoFieldsV1,
    projectStarAtlasV1, renderStarAtlasV1, STAR_ATLAS_FILTERS_V1, STAR_ATLAS_VIEWS_V1,
    readCombatSettlementAuthorityV1,
    // panel manager / presentation (not under test)
    capturePanelRefillFocus: () => () => undefined,
    fillPanel: (_id: string, html: string) => { panel.innerHTML = html; },
    openPanelId: () => 'atlas',
    closePanels: vi.fn(),
    searchTravel: Object.freeze({ jumpToProvenNav: vi.fn(async () => false) }),
    app: Object.freeze({ canvas: Object.freeze({ focus: vi.fn() }) }),
    toast,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    updateChips: vi.fn(),
    gameEvent: vi.fn(),
    queueArc9ProgressionRefresh: vi.fn(),
    presentProgressionCeremony: vi.fn(),
  };
  const exec = executableMainAtlas(env, mutations);
  exec.fill();
  const button = (attribute: string, id?: string) => panel.querySelector<HTMLButtonElement>(
    id === undefined ? `[${attribute}]` : `[${attribute}="${id}"]`);
  const restore = () => {
    for (const [key, value] of prior) { if (value === undefined) delete g[key]; else g[key] = value; }
    dom.window.close();
  };
  /** Advance the clock and fire every due timer (in order), as the browser would. */
  const advance = (ms: number) => {
    clock += ms;
    for (const timer of timers.splice(0).sort((a, b) => a.at - b.at)) {
      if (timer.at <= clock) timer.fn(); else timers.push(timer);
    }
  };
  return { dom, env, exec, panel, button, toast, scheduleReload, restore, advance, timers };
}
type Harness = ReturnType<typeof mainAtlasHarness>;

async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (!h.env.productActionInFlight && h.env.activePersist === null) {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Atlas press never settled');
}

async function press(h: Harness, attribute: string, id?: string): Promise<void> {
  const control = h.button(attribute, id);
  if (control === null) throw new Error(`Atlas control ${attribute}${id === undefined ? '' : `=${id}`} is not rendered`);
  control.click();
  await settled(h);
}

const ids = (state: SaveStateV2) => state.logMap.map(([id]) => id);
const favOf = (state: SaveStateV2, id: string) => state.logMap.find(([row]) => row === id)?.[1].fav;

/* ---------------- the scenario ---------------- */

async function atlasVerbScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const harnesses: Harness[] = [];
  try {
    const h = mainAtlasHarness(f, mutations);
    harnesses.push(h);
    const start = await f.repository.revision();
    expect(h.button('data-atlas-favorite', TARGET_ID), 'Main must render the Atlas row controls').not.toBeNull();

    // (1) Favorite
    await press(h, 'data-atlas-favorite', TARGET_ID);
    let saved = await durableSave(f);
    expect(favOf(saved.state, TARGET_ID), 'atlas: Favorite must durably star the pressed row').toBe(true);
    expect(await f.repository.revision()).toBe(start + 1);

    // (2) Home
    await press(h, 'data-atlas-home', TARGET_ID);
    saved = await durableSave(f);
    expect(saved.state.homeId, 'atlas: Home must durably point at the pressed row').toBe(TARGET_ID);
    expect(await f.repository.revision()).toBe(start + 2);

    // (3) Remove, then Undo INSIDE the window
    const durableRowBefore = JSON.stringify(saved.state.logMap[2]);
    await press(h, 'data-atlas-remove', AFTER_ID);
    saved = await durableSave(f);
    expect(ids(saved.state), 'atlas: Remove must durably delete the pressed row').toEqual([BEFORE_ID, TARGET_ID]);
    expect(h.button('data-atlas-undo'), 'atlas: Remove must offer Undo').not.toBeNull();
    h.advance(UNDO_WINDOW_MS - 1);
    await press(h, 'data-atlas-undo');
    saved = await durableSave(f);
    expect(ids(saved.state), 'atlas: Undo inside the window must durably restore the row in place')
      .toEqual([BEFORE_ID, TARGET_ID, AFTER_ID]);
    expect(JSON.stringify(saved.state.logMap[2]), 'atlas: Undo restores the exact durable row').toBe(durableRowBefore);
    expect(await f.repository.revision()).toBe(start + 4);

    // (4) Remove again; a repaint at 8 s — before main.ts's 8.05 s expiry timer —
    // no longer offers Undo, and a stale tap restores nothing
    await press(h, 'data-atlas-remove', AFTER_ID);
    expect(h.button('data-atlas-undo')).not.toBeNull();
    h.advance(UNDO_WINDOW_MS);
    const staleUndo = h.button('data-atlas-undo');
    expect(staleUndo, 'the stale Undo control is still painted before any repaint').not.toBeNull();
    h.button('data-atlas-view', 'list')!.click(); // a real control that repaints the Atlas
    expect(h.button('data-atlas-undo'), 'atlas: a repaint after 8 s must no longer offer Undo').toBeNull();
    staleUndo!.click(); // a detached stale node: the delegated listener never sees it
    await press(h, 'data-atlas-view', 'list');
    expect(ids((await durableSave(f)).state), 'atlas: an expired Undo must restore nothing').toEqual([BEFORE_ID, TARGET_ID]);
    expect(await f.repository.revision()).toBe(start + 5);

    // (5) with no repaint at all, main.ts's own expiry timer closes the window
    await press(h, 'data-atlas-remove', BEFORE_ID);
    expect(ids((await durableSave(f)).state)).toEqual([TARGET_ID]);
    expect(h.button('data-atlas-undo')).not.toBeNull();
    h.advance(UNDO_WINDOW_MS + 50);
    expect(h.button('data-atlas-undo'), 'atlas: the Undo window must close after 8 s').toBeNull();
    expect(await f.repository.revision()).toBe(start + 6);
    saved = await durableSave(f);
    expect(JSON.stringify(h.env.save), 'atlas: the live save equals the durable save').toBe(JSON.stringify(saved.state));
    expect(h.scheduleReload.mock.calls.map((call) => String(call[1])), 'atlas: no verb may need a convergence reload').toEqual([]);

    // (6) reboot: every verb's result is what storage says
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded');
    const reloaded = mainAtlasHarness(f, mutations);
    harnesses.push(reloaded);
    expect(ids(f.state)).toEqual([TARGET_ID]);
    expect(f.state.homeId).toBe(TARGET_ID);
    expect(favOf(f.state, TARGET_ID)).toBe(true);
    expect(reloaded.button('data-atlas-remove', AFTER_ID), 'the removed row stays removed after reboot').toBeNull();
    expect(reloaded.button('data-atlas-undo'), 'no Undo survives a reboot').toBeNull();
    // un-favorite after reboot is a new durable press
    await press(reloaded, 'data-atlas-favorite', TARGET_ID);
    expect(favOf((await durableSave(f)).state, TARGET_ID)).toBe(false);
  } finally {
    for (const h of [...harnesses].reverse()) h.restore();
    await f.runtime.release();
  }
}

describe('A5 #30-33 — the Atlas verbs are durable UI outcomes, with a timed Undo', () => {
  it('Favorite, Home, Remove and Undo (inside the 8 s window) each commit exactly once; the window closes; results survive reboot', async () => {
    await atlasVerbScenario();
  }, 30_000);

  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; failsWith: RegExp }>> = [
    {
      mutation: {
        name: 'UNWIRED FAVORITE: the star button reaches nothing',
        needle: '    void runArc9AtlasFavoriteChange(atlasId, !hit[1].fav);',
        replacement: '    void atlasId;',
      },
      failsWith: /atlas: Favorite must durably star the pressed row/u,
    },
    {
      mutation: {
        name: 'WRONG HOME TARGET: Home always clears',
        needle: "    if (atlasId !== undefined) void runArc9AtlasHomeChange(atlasId, save.homeId !== atlasId);",
        replacement: "    if (atlasId !== undefined) void runArc9AtlasHomeChange(atlasId, false);",
      },
      failsWith: /atlas: Home must durably point at the pressed row/u,
    },
    {
      mutation: {
        name: 'UNWIRED REMOVE',
        needle: '    if (atlasId !== undefined) void runArc9AtlasRemove(atlasId);',
        replacement: '    void atlasId;',
      },
      failsWith: /atlas: Remove must durably delete the pressed row/u,
    },
    {
      mutation: {
        name: 'UNTIMED UNDO: the render check ignores the 8 s window',
        needle: '  if (performance.now() >= undo.expiresAt\n',
        replacement: '  if (false\n',
      },
      failsWith: /atlas: a repaint after 8 s must no longer offer Undo/u,
    },
    {
      mutation: {
        name: 'UNARMED EXPIRY TIMER: the panel never repaints the closed window by itself',
        needle: '        window.setTimeout(() => {',
        replacement: '        void (() => {',
      },
      failsWith: /atlas: the Undo window must close after 8 s/u,
    },
    {
      mutation: {
        name: 'UNWIRED UNDO',
        needle: '    void runArc9AtlasUndo();',
        replacement: '    void 0;',
      },
      failsWith: /atlas: Undo inside the window must durably restore the row in place/u,
    },
  ];

  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_ATLAS_SOURCE, mutation)).not.toThrow();
      await expect(atlasVerbScenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
