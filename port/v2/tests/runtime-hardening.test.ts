import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { transformSync } from 'rolldown/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { capturePanelRefillFocus } from '../apps/game/src/panel-refill-focus.js';

const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');

// Execute the shipped function, not a retyped model of its guards. The existing
// build transformer erases types; dependency injection leaves its control flow intact.
function appFunction(name: string, end: string, env: Record<string, unknown>): (...args: unknown[]) => unknown {
  const start = new RegExp(`(?:async )?function ${name}\\(`).exec(main)?.index;
  if (start === undefined || main.indexOf(end, start) < 0) throw new Error(`Missing ${name}`);
  const source = main.slice(start, main.indexOf(end, start));
  const transformed = transformSync(`${name}.ts`, source);
  if (transformed.errors.length) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return ${name}; }`)(env);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function persistence() {
  const stage = vi.fn(() => ({ kind: 'staged', stage: { epoch: 3 } }));
  const project = vi.fn(() => ({ kind: 'projected', state: { savedView: { id: 'next' }, EPOCH_BASE: 3 } }));
  const commit = vi.fn(async (candidate: unknown) => ({
    kind: 'committed', revision: 9, saved: { canonicalState: candidate },
  }));
  const env = {
    // These source-execution fixtures include the evidence-only fault contract.
    __CF_EVIDENCE_BUILD__: true,
    namedSearchPersistenceHeld: false, namedSearchPersistenceDeferred: false,
    F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER: Symbol('cycle'), F4_LIFECYCLE_CHECKPOINT_OWNER: Symbol('lifecycle'),
    persistHold: false, trainingCheckpointWriteHeld: false, importWriteInFlight: false,
    replacementReloadPending: false, replacementTransaction: null as object | null,
    writable: true, f4RuntimeMayMutate: () => env.writable,
    settleF4Heartbeat: vi.fn(async () => {}),
    f4Runtime: { commit, checkpointParent: () => ({}), diagnostics: () => ({}) },
    ecologyEpochAuthority: {
      stage, commit: vi.fn(() => ({ kind: 'steady', epoch: 3, revision: 9 })),
      reject: vi.fn(), projection: () => ({ state: 'clean' }),
    },
    ecologyActivePlayNow: () => 0,
    projectCheckpointState: project,
    savedRouteWriteHeld: false, save: { savedView: { id: 'old' }, EPOCH_BASE: 2 },
    nav: {}, navToView: () => ({ id: 'next' }), smokeRejectNextPersist: false,
    lastPersistenceOutcome: null as string | null, lastEcologyEdgeOutcome: null as string | null,
    f4LastCheckpointAt: 0, activePersist: null as Promise<boolean> | null,
    scheduleF4AuthorityConvergenceReload: vi.fn(), toast: vi.fn(),
    publishCommittedEcologyEpoch: vi.fn(), suppressEcologyProjection: vi.fn(),
  };
  const persist = appFunction('persistView', '\nlet _persistT', env) as (
    owner?: object | null, intent?: string, cycle?: symbol | null, lifecycle?: symbol | null,
  ) => Promise<boolean>;
  return { env, persist, stage, project, commit };
}

describe('persistView execution-time admission', () => {
  it('commits once, publishes after durability, and clears its own queue tail', async () => {
    const { env, persist, stage, project, commit } = persistence();
    expect(await persist()).toBe(true);
    expect(stage).toHaveBeenCalledTimes(1);
    expect(project).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(env.save).toEqual({ savedView: { id: 'next' }, EPOCH_BASE: 3 });
    expect(env.activePersist).toBeNull();
  });

  it.each(['queue', 'heartbeat'] as const)('rechecks every write hold after the %s await', async (boundary) => {
    const blockers = ['persistHold', 'trainingCheckpointWriteHeld', 'importWriteInFlight',
      'replacementReloadPending', 'replacementTransaction', 'writable', 'namedSearchPersistenceHeld'] as const;
    for (const blocker of blockers) {
      const { env, persist, stage, project, commit } = persistence();
      const gate = deferred<boolean>();
      if (boundary === 'queue') env.activePersist = gate.promise;
      else env.settleF4Heartbeat.mockImplementation(async () => { await gate.promise; });
      const run = persist();
      if (blocker === 'replacementTransaction') env.replacementTransaction = {};
      else if (blocker === 'writable') env.writable = false;
      else env[blocker] = true;
      gate.resolve(true);
      expect(await run, blocker).toBe(false);
      expect(stage, blocker).not.toHaveBeenCalled();
      expect(project, blocker).not.toHaveBeenCalled();
      expect(commit, blocker).not.toHaveBeenCalled();
      if (boundary === 'queue') expect(env.settleF4Heartbeat, blocker).not.toHaveBeenCalled();
      expect(env.save, blocker).toEqual({ savedView: { id: 'old' }, EPOCH_BASE: 2 });
      expect(env.activePersist, blocker).toBeNull();
      expect(env.namedSearchPersistenceDeferred, blocker).toBe(blocker === 'namedSearchPersistenceHeld');
    }
  });

  it('drains an already-started write while refusing a queued writer when import claims ownership', async () => {
    const { env, persist, commit } = persistence();
    const committed = deferred<Awaited<ReturnType<typeof commit>>>();
    const started = deferred<void>();
    commit.mockImplementation(async () => { started.resolve(); return committed.promise; });
    const first = persist();
    await started.promise;
    const queued = persist();
    const drained = env.activePersist;
    env.replacementTransaction = {};
    env.importWriteInFlight = true;
    committed.resolve({ kind: 'committed', revision: 9,
      saved: { canonicalState: { savedView: { id: 'next' }, EPOCH_BASE: 3 } } });
    expect(await first).toBe(true);
    expect(await queued).toBe(false);
    expect(await drained).toBe(false);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(env.activePersist).toBeNull();
  });

  it('retains exact replacement ownership and rejects a released or superseded claim', async () => {
    const owner = {};
    const matching = persistence();
    matching.env.replacementTransaction = owner;
    expect(await matching.persist(owner)).toBe(true);
    for (const next of [null, {}]) {
      const { env, persist, commit } = persistence();
      env.replacementTransaction = owner;
      const gate = deferred<boolean>();
      env.settleF4Heartbeat.mockImplementation(async () => { await gate.promise; });
      const run = persist(owner);
      env.replacementTransaction = next;
      gate.resolve(true);
      expect(await run).toBe(false);
      expect(commit).not.toHaveBeenCalled();
    }
  });

  it('keeps the private heartbeat self-bypass and named-search lifecycle exemption', async () => {
    const cycle = persistence();
    cycle.env.namedSearchPersistenceHeld = true;
    expect(await cycle.persist(null, 'ordinary', cycle.env.F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER)).toBe(true);
    expect(cycle.env.settleF4Heartbeat).not.toHaveBeenCalled();
    const lifecycle = persistence();
    lifecycle.env.namedSearchPersistenceHeld = true;
    expect(await lifecycle.persist(null, 'ordinary', null, lifecycle.env.F4_LIFECYCLE_CHECKPOINT_OWNER)).toBe(true);
    expect(lifecycle.env.settleF4Heartbeat).toHaveBeenCalledTimes(1);
    expect(lifecycle.env.namedSearchPersistenceDeferred).toBe(false);
  });

  it('does not let a private owner bypass a held Training checkpoint or replace an existing queue tail', async () => {
    const { env, persist, commit } = persistence();
    const prior = deferred<boolean>();
    env.activePersist = prior.promise;
    env.trainingCheckpointWriteHeld = true;
    expect(await persist(null, 'ordinary', env.F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER)).toBe(false);
    expect(await persist(null, 'ordinary', null, env.F4_LIFECYCLE_CHECKPOINT_OWNER)).toBe(false);
    expect(env.activePersist).toBe(prior.promise);
    expect(commit).not.toHaveBeenCalled();
    prior.resolve(false);
  });

  it('preserves replacement refusal rearming of the Settings debounce that its claim canceled', () => {
    const { env } = persistence();
    const app = { ticker: { started: true }, stop: () => { app.ticker.started = false; },
      start: () => { app.ticker.started = true; } };
    const replacementEnv = Object.assign(env, {
      app, _persistT: 17, replacementReloadScheduled: false,
      tameGreetingAudioOwner: null, stopF4Heartbeat: vi.fn(), startF4Heartbeat: vi.fn(),
      f4RuntimeMayAnswer: () => false, clearTimeout: vi.fn(), persistSoon: vi.fn(),
      f4Runtime: { ...env.f4Runtime, setAnswerable: vi.fn() },
    });
    const claim = appFunction('claimReplacementTransaction', '\nfunction releaseReplacementTransaction', replacementEnv);
    const release = appFunction('releaseReplacementTransaction', '\nfunction scheduleReplacementReload', replacementEnv);
    const owner = claim('save-import');
    expect(replacementEnv._persistT).toBe(0);
    expect(app.ticker.started).toBe(false);
    release({});
    expect(replacementEnv.persistSoon).not.toHaveBeenCalled();
    release(owner);
    expect(replacementEnv.replacementTransaction).toBeNull();
    expect(app.ticker.started).toBe(true);
    expect(replacementEnv.persistSoon).toHaveBeenCalledTimes(1);
    release(owner);
    expect(replacementEnv.persistSoon).toHaveBeenCalledTimes(1);
  });
});

const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
  JSDOM: new (html: string) => { window: Window & { close(): void } };
};
const windows: Array<{ close(): void }> = [];
function panel() {
  const dom = new JSDOM('<!doctype html><body><button id="outside">Outside</button><aside id="panel"></aside></body>');
  windows.push(dom.window);
  const document = dom.window.document;
  const root = document.getElementById('panel')!;
  const refill = (html: string) => { root.innerHTML = `<button data-pnx="panel">Close</button>${html}`; };
  return { document, root, refill };
}
afterEach(() => { for (const window of windows.splice(0)) window.close(); });

describe('synchronous semantic panel refill focus', () => {
  it('preserves the exact action and row through reorder without claiming scroll', () => {
    const { document, root, refill } = panel();
    const html = '<button data-atlas-travel="a">Travel</button><button data-atlas-favorite="a">Favorite</button>';
    refill(html);
    root.querySelector<HTMLElement>('[data-atlas-favorite]')!.focus();
    const restore = capturePanelRefillFocus(root, ['data-atlas-travel', 'data-atlas-favorite']);
    refill('<button data-atlas-favorite="b">Other</button>' + html);
    const target = root.querySelector<HTMLElement>('[data-atlas-favorite="a"]')!;
    const focus = vi.spyOn(target, 'focus');
    restore();
    expect(document.activeElement).toBe(target);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it.each(['removed', 'disabled', 'duplicate'] as const)('falls back to Close when the action is %s', (state) => {
    const { document, root, refill } = panel();
    refill('<button data-binder-claim="set">Claim</button>');
    root.querySelector<HTMLElement>('[data-binder-claim]')!.focus();
    const restore = capturePanelRefillFocus(root, ['data-binder-claim']);
    refill(state === 'removed' ? '' : state === 'disabled'
      ? '<button data-binder-claim="set" disabled>Claim</button>'
      : '<button data-binder-claim="set">Claim</button><button data-binder-claim="set">Claim</button>');
    restore();
    expect(document.activeElement).toBe(root.querySelector('[data-pnx]'));
  });

  it('does not steal focus from another control or reuse a consumed continuation', () => {
    const { document, root, refill } = panel();
    refill('<button data-binder-claim="set">Claim</button>');
    root.querySelector<HTMLElement>('[data-binder-claim]')!.focus();
    const restore = capturePanelRefillFocus(root, ['data-binder-claim']);
    refill('<button data-binder-claim="set">Claim</button>');
    const outside = document.getElementById('outside')!;
    outside.focus();
    restore();
    expect(document.activeElement).toBe(outside);
    outside.blur();
    restore();
    expect(document.activeElement).toBe(document.body);
  });

  it.each(['atlas', 'rec', 'ch'] as const)('executes the real %s refill and its final disabled-state projection', (id) => {
    const { document, root } = panel();
    root.id = `${id}panel`;
    const env = {
      document, capturePanelRefillFocus,
      save: { logMap: [['a', { title: 'Earth', fav: false }]], stats: {}, galSeen: [], sysSeen: [],
        ptypesSeen: [], starKindsSeen: [], codex: [], surveyedSet: [], journal: [], ascProg: {} },
      atlasRouteStates: { has: () => true }, arc9AtlasFavoritePendingId: null,
      smokeForceReadOnly: false, f4RuntimeMayMutate: () => true, trainingCheckpointWriteHeld: false,
      trainingActive: () => false, ecologyEpochBlocksActions: () => false,
      esc: String, fillPanel: (_id: string, html: string) => {
        root.innerHTML = `<button data-pnx="${id}">Close</button>${html}`;
      },
      f4Runtime: { extensions: {} }, arc5OwnershipState: { mode: 'current' },
      readCombatSettlementAuthorityV1: () => ({ kind: 'loaded', authority: {} }),
      ownershipSourceStateV1: () => ({}),
      projectExpeditionChronicleV1: () => ({ kind: 'projected', model: {} }),
      renderExpeditionChronicleV1: () => '<section data-test-chronicle>Retained expedition history</section>',
      projectArc9RecordsRankReadModelV1: () => ({ kind: 'protected' }),
      projectArc9BinderReadModelV1: () => ({ kind: 'projected', model: {} }),
      renderArc9BinderPanelV1: () => '<button data-binder-claim="set">Claim</button>',
      binderClaimPanelStatus: () => null, canonicalWorldLandingCount: () => 0, worldIdentityState: {},
      projectV2Charter: () => null, ascStage: () => 0,
      projectStarterCharterBoardV1: () => ({ kind: 'projected', board: { acceptedCount: 0, cap: 3 } }),
      renderStarterCharterBoardV1: () => '<button data-starter-charter-accept="st">Accept</button>',
      starterCharterPanelStatus: () => null, starterCharterAcceptPendingId: null, arc9BinderClaimPendingId: null,
      syncBoundedCollectionButtons: (_root: HTMLElement, selector: string) => {
        for (const button of root.querySelectorAll<HTMLButtonElement>(selector)) button.disabled = disabled;
      },
    };
    let disabled = false;
    const [name, end, selector] = id === 'atlas'
      ? ['fillAtlas', "\ndocument.getElementById('atlaspanel')!", '[data-atlas-favorite="a"]']
      : id === 'rec' ? ['fillRecords', '\nfunction frontierEndingPanelStatus', '[data-binder-claim="set"]']
        : ['fillCharters', "\nregisterPanel({ id: 'ch'", '[data-starter-charter-accept="st"]'];
    const fill = appFunction(name!, end!, env);
    fill();
    if (id === 'rec') expect(root.querySelector('[data-test-chronicle]')?.textContent)
      .toBe('Retained expedition history');
    root.querySelector<HTMLElement>(selector!)!.focus();
    fill();
    expect(document.activeElement).toBe(root.querySelector(selector!));
    disabled = true;
    env.smokeForceReadOnly = true;
    fill();
    expect(document.activeElement).toBe(root.querySelector('[data-pnx]'));
  });
});
