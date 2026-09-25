/* A5 gap #10 (INVENTORY.md row #90): choosing a Frontier ending — an
 * IRREVERSIBLE endgame choice — as a UI OUTCOME test.
 *
 * CLAUDE.md rule 7: assert the OUTCOME, not the code path. The choice was
 * proven only by calling its transaction (DIRECT). Here the exact shipped
 * main.ts sections are sliced, type-stripped and executed with an injected
 * env: frontierEndingPanelStatus + fillPrimeCodex, the Prime panel's click
 * listener, and runArc9FrontierEndingChoice. The test presses the rendered
 * `[data-frontier-ending-id]` controls, reads the COMMITTED v5 save back from
 * a real memory backend with readSaveV5, proves a second choice (and a forced
 * locked Balance choice) can never write, and reboots a fresh F4 runtime.
 *
 * Stubbed externals: the panel manager (fillPanel → innerHTML; openPanelId →
 * 'prime'), toast, the heartbeat settle and the reload scheduler. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { PRIME_SIGNATURES_V1 } from '@cf/domain-combatcore';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY,
  createMemoryBackend,
  createRevisionedRepository,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  ARC9_FRONTIER_ENDING_OPERATION_V1,
  ARC9_FRONTIER_ENDING_RECEIPT_KIND_V1,
  commitArc9FrontierEndingChoiceV1,
} from '../apps/game/src/arc9-frontier-ending-action.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  FRONTIER_ENDINGS_V1,
  projectPrimeCodexV1,
  renderPrimeCodexPanelV1,
} from '../apps/game/src/prime-codex-panel.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_080_000;

interface TestWindow extends Window { readonly Element: typeof Element; close(): void }
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

function exactMainSection(start: string, end: string): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main Frontier section anchors must be unique (${startCount}/${endCount}): ${start} -> ${end}`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Frontier section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

const MAIN_FRONTIER_SOURCE = [
  exactMainSection('function frontierEndingPanelStatus(): string | null {', "/* THE STAR ATLAS ('log' in the game)"),
  exactMainSection(
    "document.getElementById('primepanel')!.addEventListener('click', (event) => {",
    "const combatChroniclePanel = document.getElementById('combatpanel')!;",
  ),
  exactMainSection(
    'async function runArc9FrontierEndingChoice(requestedEndingId: string): Promise<void> {',
    '\nasync function runArc9NameplateChoice(',
  ),
].join('\n');

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }

function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) {
    throw new Error(`mutation "${mutation.name}" needle must occur exactly once in the executed Main Frontier source; found ${count}`);
  }
  return source.replace(mutation.needle, () => mutation.replacement);
}

function executableMainFrontier(env: Record<string, unknown>, mutations: readonly MainMutation[]): { fill: () => void; outcome: () => string | null } {
  const source = mutations.reduce(replaceExact, MAIN_FRONTIER_SOURCE);
  const transformed = transformSync('main-frontier.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    fill: () => fillPrimeCodex(),
    outcome: () => lastArc9FrontierEndingOutcome,
  }; }`)(env) as { fill: () => void; outcome: () => string | null };
}

/* ---------------- durable fixtures: all nine Signatures, Balance still locked ---------------- */

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
  for (const signature of PRIME_SIGNATURES_V1) {
    state.primeFill[signature.id] = {
      title: signature.guardianName, sub: signature.signatureName, tier: signature.tier, hex: '#9fb6d6', where: null,
    };
  }
  state.frontierUnlocked = true;
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0).state());
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`Frontier fixture was ${migrated.kind}`);
  await backend.apply(initial.operations);
  return bootFromDurableSave(backend, 'first');
}

async function bootFromDurableSave(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`Frontier boot read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`Frontier boot F4 authority was ${authority.kind}`);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY,
    initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state,
    restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `a5-frontier-${tag}-tab`, token: `a5-frontier-${tag}-document`,
    leaseTtlMs: 1_000_000, now: () => 0, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Frontier lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: saved.state };
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

function mainFrontierHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body><section id="primepanel" style="display:block"></section></body></html>`);
  const document = dom.window.document;
  const panel = document.getElementById('primepanel')!;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>;
  const DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'Event'] as const;
  const prior = DOM_GLOBALS.map((key) => [key, g[key]] as const);
  for (const key of DOM_GLOBALS) g[key] = w[key];
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const env: Record<string, unknown> & { save: SaveStateV2; activePersist: unknown; productActionInFlight: boolean } = {
    document,
    Element: dom.window.Element,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    save: f.state,
    f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => {
      if (runtime === null) return false;
      const diagnostics = runtime.diagnostics();
      return diagnostics.leaseOwned && !diagnostics.staleBlocked;
    },
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    arc9FrontierEndingPending: false,
    lastArc9FrontierEndingOutcome: null,
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
    ARC9_FRONTIER_ENDING_OPERATION_V1,
    commitArc9FrontierEndingChoiceV1,
    projectPrimeCodexV1,
    renderPrimeCodexPanelV1,
    fillPanel: (_id: string, html: string) => { panel.innerHTML = html; },
    openPanelId: () => 'prime',
    toast,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
  };
  const exec = executableMainFrontier(env, mutations);
  exec.fill();
  const ending = (id: string) => panel.querySelector<HTMLButtonElement>(`[data-frontier-ending-id="${id}"]`);
  const restore = () => {
    for (const [key, value] of prior) { if (value === undefined) delete g[key]; else g[key] = value; }
    dom.window.close();
  };
  return { dom, env, exec, panel, ending, toast, scheduleReload, restore };
}
type Harness = ReturnType<typeof mainFrontierHarness>;

async function settled(h: Harness): Promise<void> {
  for (let turn = 0; turn < 5_000; turn++) {
    if (!h.env.productActionInFlight && h.env.activePersist === null && h.exec.outcome() !== 'pending') {
      for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('Frontier press never settled');
}

/** A button carrying `id` pressed through the panel's own delegated listener,
 * even when the rendered card no longer offers it (a stale or forged control). */
async function forcePress(h: Harness, id: string): Promise<void> {
  const forged = h.dom.window.document.createElement('button');
  forged.dataset.frontierEndingId = id;
  h.panel.append(forged);
  forged.click();
  await settled(h);
}

const BALANCE = FRONTIER_ENDINGS_V1.find((row) => row.balanceOnly)!;
const [FIRST, SECOND] = FRONTIER_ENDINGS_V1.filter((row) => !row.balanceOnly);

async function frontierScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const harnesses: Harness[] = [];
  try {
    const h = mainFrontierHarness(f, mutations);
    harnesses.push(h);
    expect(h.ending(FIRST!.id), 'Main must render the Frontier ending choices').not.toBeNull();
    expect(h.ending(BALANCE.id)?.disabled, 'Balance is locked for this explorer').toBe(true);
    const start = await f.repository.revision();

    // (1) a forced press of the locked Balance ending writes nothing
    await forcePress(h, BALANCE.id);
    expect(await f.repository.revision(), 'frontier: a locked ending must never write').toBe(start);
    expect(h.exec.outcome(), 'frontier: the durable transaction refuses the locked Balance').toBe('refused:preflight:balance-locked');

    // (2) the real choice commits once
    h.ending(FIRST!.id)!.click();
    await settled(h);
    expect(await f.repository.revision(), 'frontier: choosing an ending must commit exactly one revision').toBe(start + 1);
    expect((await f.repository.readReceipt(0))?.kind).toBe(ARC9_FRONTIER_ENDING_RECEIPT_KIND_V1);
    const saved = await durableSave(f);
    expect(saved.state.frontierEnding, 'frontier: the chosen ending is durable').toBe(FIRST!.id);
    expect(JSON.stringify(h.env.save), 'frontier: the live save equals the durable save').toBe(JSON.stringify(saved.state));
    expect(h.panel.querySelector('[data-frontier-state="chosen"]')?.getAttribute('data-frontier-ending'),
      'frontier: the panel shows the chosen legacy').toBe(FIRST!.id);
    expect(h.ending(SECOND!.id), 'no other ending is offered once chosen').toBeNull();

    // (3) irreversible: a second (forged) choice is refused and writes nothing
    await forcePress(h, SECOND!.id);
    expect(await f.repository.revision(), 'frontier: a chosen legacy can never be overwritten').toBe(start + 1);
    expect((await durableSave(f)).state.frontierEnding).toBe(FIRST!.id);
    expect(h.scheduleReload).not.toHaveBeenCalled();

    // (4) reboot: the legacy is what storage says
    await f.runtime.release();
    f = await bootFromDurableSave(f.backend, 'reloaded');
    const reloaded = mainFrontierHarness(f, mutations);
    harnesses.push(reloaded);
    expect(f.state.frontierEnding).toBe(FIRST!.id);
    expect(reloaded.panel.querySelector('[data-frontier-state="chosen"]')?.getAttribute('data-frontier-ending')).toBe(FIRST!.id);
    await forcePress(reloaded, SECOND!.id);
    expect(await f.repository.revision(), 'frontier: after reboot the legacy still cannot be overwritten').toBe(start + 1);
  } finally {
    for (const h of [...harnesses].reverse()) h.restore();
    await f.runtime.release();
  }
}

describe('A5 #90 — the Frontier ending is an irreversible durable UI outcome', () => {
  it('a locked ending never writes; the chosen ending commits once, cannot be overwritten, and survives reboot', async () => {
    expect(FIRST).toBeDefined();
    expect(SECOND).toBeDefined();
    await frontierScenario();
  }, 30_000);

  const MUTANTS: ReadonlyArray<Readonly<{ mutation: MainMutation; failsWith: RegExp }>> = [
    {
      mutation: {
        name: 'UNWIRED: the ending buttons reach nothing',
        needle: '  void runArc9FrontierEndingChoice(button.dataset.frontierEndingId);',
        replacement: '  void button;',
      },
      failsWith: /frontier: choosing an ending must commit exactly one revision|expected null to be/u,
    },
    {
      mutation: {
        name: 'UNPUBLISHED: the committed legacy never reaches the live save',
        needle: '      save.frontierEnding = outcome.endingId;',
        replacement: '      void outcome.endingId;',
      },
      failsWith: /frontier: the live save equals the durable save/u,
    },
    {
      mutation: {
        name: 'DROPPED COMMIT: the choice never reaches the durable transaction',
        needle: '    outcome = await commitArc9FrontierEndingChoiceV1({',
        replacement: "    outcome = { kind: 'refused', detail: 'mutant', convergence: 'none' } as never; void ({",
      },
      failsWith: /frontier: the durable transaction refuses the locked Balance/u,
    },
  ];

  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      expect(() => replaceExact(MAIN_FRONTIER_SOURCE, mutation)).not.toThrow();
      await expect(frontierScenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
