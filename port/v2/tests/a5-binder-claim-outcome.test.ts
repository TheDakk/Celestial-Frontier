/* A5 gap #5 (INVENTORY.md row #84): Binder Set claim — UI OUTCOME test.

   CLAUDE.md rule 7: assert the OUTCOME, not the code path. This file never
   calls commitArc9BinderSetClaimV1 itself. It executes the exact shipped
   Main sections (Records fill, the Records-panel click owner, the claim
   runner and its module-level state), presses the rendered
   `[data-binder-claim]` button in JSDOM, then reads the COMMITTED save back
   from the real memory backend with readSaveV5.

   The negative controls mutate the executed Main source by unique exact
   string replacement and prove the same outcome assertions then fail in
   both directions (nothing paid / overpaid). */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import {
  canonicalWorldLandingCount,
  createEmptyWorldIdentityState,
  createMemoryBackend,
  createRevisionedRepository,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readCombatSettlementAuthorityV1,
  readF4Authority,
  readSaveV5,
  V4_PRIMARY_KEY,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import {
  classifyRealm,
  describeSpecies,
  makeGenome,
  sapienceTier,
  type Genome,
} from '@cf/domain-genome';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  ARC9_BINDER_CLAIMABLE_SET_IDS_V1,
  commitArc9BinderSetClaimV1,
  operationForArc9BinderSetClaimV1,
  projectArc9BinderReadModelV1,
  publishArc9BinderSetClaimFieldsV1,
  renderArc9BinderPanelV1,
} from '../apps/game/src/binder-sets.js';
import { paragonCodexIdV1, paragonGenomeV1 } from '../apps/game/src/paragon-finder.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';
import { capturePanelRefillFocus } from '../apps/game/src/panel-refill-focus.js';
import { projectArc9RecordsRankReadModelV1 } from '../apps/game/src/records-rank-model.js';
import { renderArc9RecordsRankPanelV1 } from '../apps/game/src/records-rank-panel.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 10;

interface TestWindow extends Window {
  readonly Element: typeof Element;
  close(): void;
}
interface TestDom { readonly window: TestWindow }
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => TestDom };

/** One exact replacement applied to the executed Main source. */
type MainMutation = readonly [from: string, to: string];

function exactMainSection(start: string, end: string): string {
  const startCount = MAIN_SOURCE.split(start).length - 1;
  const endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) {
    throw new Error(`Main Binder section must be unique: ${start} -> ${end} (${startCount}/${endCount})`);
  }
  const left = MAIN_SOURCE.indexOf(start);
  const right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (left < 0 || right <= left) throw new Error(`Main Binder section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}

function mainBinderSource(): string {
  return [
    // module-level claim state
    exactMainSection('let arc9BinderClaimPendingId:', '\nlet lastArc9ShareSendOutcome:'),
    // refusal classifier shared with Starter Charters
    exactMainSection('type BoundedCollectionRefusalV1 =', '\n/** The expedition\'s own active-play clock'),
    // Records fill + button writability + panel status
    exactMainSection('function boundedCollectionActionsWritable(): boolean {', '\nfunction frontierEndingPanelStatus('),
    // the Records-panel click owner that dispatches the claim
    exactMainSection(
      "document.getElementById('recpanel')!.addEventListener('click', async (event) => {",
      '\nconst inventoryPanelController =',
    ),
    // the claim runner
    exactMainSection('async function runArc9BinderSetClaim(', '\nfunction arc9TravelInspectionOnly('),
  ].join('\n');
}

function applyMutations(source: string, mutations: readonly MainMutation[]): string {
  let result = source;
  for (const [from, to] of mutations) {
    const count = result.split(from).length - 1;
    if (count !== 1) throw new Error(`Negative-control mutation must match exactly once (found ${count}): ${from}`);
    result = result.replace(from, () => to);
  }
  return result;
}

interface ExecutableMainBinder {
  readonly fillRecords: () => void;
  readonly pendingId: () => string | null;
  readonly lastOutcome: () => string | null;
  readonly lastStatus: () => string | null;
}

/** Execute the shipped Main Binder chain with an injected environment. Same
 * exact-declaration transform pattern as explorer-meal-action.test.ts; it is
 * not a retyped model of Main behaviour. */
function executableMainBinder(
  env: Record<string, unknown>,
  mutations: readonly MainMutation[],
): ExecutableMainBinder {
  const source = applyMutations(mainBinderSource(), mutations);
  const transformed = transformSync('main-binder-claim.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    fillRecords,
    pendingId: () => arc9BinderClaimPendingId,
    lastOutcome: () => lastArc9BinderClaimOutcome,
    lastStatus: () => lastArc9BinderClaimStatus,
  }; }`)(env) as ExecutableMainBinder;
}

/* ---------------------------------------------------------------- fixtures */

function baseState(): SaveStateV2 {
  return {
    EPOCH_BASE: 0, essence: 10, explorerName: 'Dakk', lastAnomKey: null,
    stats: { essenceEarned: 20, bestRank: 0 }, pstats: {}, hp: 10, HP_MAX: 10,
    customNames: [], conquered: [], cargo: [], cgx: [], items: [], equip: {}, equipAff: {},
    pinnedRecipe: null, cargoTab: 'mat', seenSp: [], journal: [], mined: [], mineX: [], skimX: [],
    bioX: [], techOwned: [], claimedSets: [], ascCh: 0, ascProg: {}, nameHue: -1,
    savedView: null, fsMode: '', toneMode: '', fontMode: '', sndOn: true, fxOn: true,
    chartsOn: true, shakeOn: true, salvageConfirm: true, notifOn: true, tipsOn: true,
    sfxVol: 1, glassTint: 0, motionMode: 0, cardExpand: 0, notifications: [],
    surveyedSet: [], galSeen: [], surfSeen: [], xpFirsts: [], sysSeen: [], starKindsSeen: [],
    ptypesSeen: [], eventKeysSeen: [], evAnnounced: [], unlocked: [], landed: [], contacted: [],
    waveOffs: [], primeFill: {}, frontierUnlocked: false, frontierEnding: null, seenGuide: false,
    tutDone: true, rnSeen: '', tutSnapPending: null, scoutId: null, chWeek: -1, chProg: {},
    chacc: [], chDone: [], homeId: null, voiceOn: true, combatSfxOn: true, logMap: [], codex: [],
  };
}

/** Four Crowns (kingdoms, +25) complete: one species of each kingdom. */
function kingdomCodex(): SaveStateV2['codex'] {
  return ['fauna', 'flora', 'fungi', 'microbe'].map((kingdom, index) => {
    const g = makeGenome(100 + index, kingdom, 0.5) as unknown as Record<string, unknown>;
    return [`s${100 + index}`, {
      id: `s${100 + index}`, name: `Species ${index}`,
      kind: kingdom[0]!.toUpperCase() + kingdom.slice(1), tier: 1,
      realm: 'Forest', sapient: 0, from: 'Test', hybrid: false, g, where: null,
    }];
  }) as SaveStateV2['codex'];
}

/** Seeker of Legends (para10, +120) complete: ten exact Paragons. */
function paragonCodex(count = 10): SaveStateV2['codex'] {
  return Array.from({ length: count }, (_, index) => {
    const g = { ...paragonGenomeV1(index) } as unknown as Genome;
    const description = describeSpecies(g);
    const id = paragonCodexIdV1(index);
    return [id, {
      id, name: description.name, kind: description.kind, tier: description.grade.tier,
      realm: classifyRealm(g), sapient: sapienceTier(g), from: `Paragon site #${index + 1}`,
      hybrid: false, g: g as unknown as Record<string, unknown>, where: null,
    }];
  });
}

async function durableFixture(codex: SaveStateV2['codex']) {
  const save = baseState();
  save.codex = codex;
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(0xB1D3_0005).state());
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: save, extensions: f4.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migration.kind !== 'migrated') throw new Error(`Binder UI fixture was ${migration.kind}`);
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: f4.extensions, initialState: initial.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 123,
    ownerId: 'binder-ui-tab', token: 'binder-ui-document', leaseTtlMs: 1_000,
    now: () => NOW, visible: true, answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`Binder UI lease was ${heartbeat.kind}`);
  return { backend, repository, runtime, state: initial.canonicalState };
}

type DurableFixture = Awaited<ReturnType<typeof durableFixture>>;

/* ----------------------------------------------------------------- harness */

function mainBinderHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <aside id="recpanel" aria-label="Records" style="display:block"></aside>
  </body></html>`);
  const document = dom.window.document;
  const recpanel = document.getElementById('recpanel')!;
  const toast = vi.fn();
  const scheduleReload = vi.fn();
  const progressionCeremony = vi.fn();
  const updateChips = vi.fn();
  const env: Record<string, unknown> & {
    save: SaveStateV2;
    activePersist: unknown;
    productActionInFlight: boolean;
    lastPersistenceOutcome: string | null;
    productActionCoordinator: ReturnType<typeof createProductActionCoordinator>;
  } = {
    document,
    Element: dom.window.Element,
    Date: Object.freeze({ now: () => NOW }),
    performance: Object.freeze({ now: () => 17 }),
    save: f.state,
    f4Runtime: f.runtime as F4RuntimeAuthority,
    f4RuntimeMayMutate: (candidate?: unknown) =>
      (candidate === undefined ? f.runtime : candidate) === f.runtime,
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
    f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null,
    openPanelId: () => 'rec',
    toast,
    updateChips,
    presentProgressionCeremony: progressionCeremony,
    scheduleF4AuthorityConvergenceReload: scheduleReload,
    fillPanel: (id: string, html: string) => {
      if (id !== 'rec') throw new Error(`unexpected panel fill ${id}`);
      recpanel.innerHTML = html;
    },
    capturePanelRefillFocus,
    esc: (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
    }[c]!)),
    projectArc9RecordsRankReadModelV1,
    renderArc9RecordsRankPanelV1,
    projectArc9BinderReadModelV1,
    renderArc9BinderPanelV1,
    ARC9_BINDER_CLAIMABLE_SET_IDS_V1,
    operationForArc9BinderSetClaimV1,
    commitArc9BinderSetClaimV1,
    publishArc9BinderSetClaimFieldsV1,
    // Chronicle stays in its protected branch; it is not under test here.
    arc5OwnershipState: null,
    readCombatSettlementAuthorityV1,
    canonicalWorldLandingCount,
    worldIdentityState: createEmptyWorldIdentityState(),
  };
  const executable = executableMainBinder(env, mutations);
  executable.fillRecords();

  /** Wait until the claim runner (if the press reached it) fully settles. */
  const settle = async (): Promise<void> => {
    for (let turn = 0; turn < 2_000; turn++) {
      if (executable.pendingId() === null && !env.productActionInFlight && env.activePersist === null) return;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    throw new Error(`Binder claim never settled (pending ${executable.pendingId()})`);
  };
  const claimButton = (setId: string) =>
    recpanel.querySelector<HTMLButtonElement>(`[data-binder-claim="${setId}"]`);
  /** A stale / forged control instance the product never rendered. */
  const forgeClaimButton = (setId: string): HTMLButtonElement => {
    const forged = document.createElement('button');
    forged.type = 'button';
    forged.dataset.binderClaim = setId;
    recpanel.querySelector('[data-arc9-binder]')!.append(forged);
    return forged;
  };
  return {
    dom, env, recpanel, executable, settle, claimButton, forgeClaimButton,
    toast, scheduleReload, progressionCeremony, updateChips,
  };
}

async function durableSave(f: DurableFixture) {
  const saved = await readSaveV5(f.backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable save read was ${saved.kind}`);
  return saved;
}

/* ------------------------------------------------ the case-1 outcome proof */

const AUTHORED = Object.freeze({ kingdoms: 25, para10: 120 } as const);
type AuthoredSet = keyof typeof AUTHORED;

/** Press the shipped control on a complete, unclaimed Set and prove the
 * durable outcome. Throws (with a diagnostic message) when any outcome is
 * wrong; the negative controls rely on exactly this function. */
async function pressAndProveClaim(
  setId: AuthoredSet,
  mutations: readonly MainMutation[] = [],
): Promise<void> {
  const f = await durableFixture(setId === 'kingdoms' ? kingdomCodex() : paragonCodex());
  const h = mainBinderHarness(f, mutations);
  try {
    const stardust = AUTHORED[setId];
    const button = h.claimButton(setId);
    expect(button, `${setId}: Records must render an enabled claim control`).not.toBeNull();
    expect(button!.disabled, `${setId}: claim control must be enabled`).toBe(false);
    expect(button!.textContent).toBe(`Claim ✦ ${stardust}`);
    expect(await f.repository.revision()).toBe(0);

    button!.click();
    await h.settle();

    // Durable (committed) outcome, read back from the real backend.
    const saved = await durableSave(f);
    expect(saved.state.essence, `${setId}: durable current Stardust must be 10 + ${stardust}`)
      .toBe(10 + stardust);
    expect(saved.state.stats.essenceEarned, `${setId}: durable lifetime Stardust must be 20 + ${stardust}`)
      .toBe(20 + stardust);
    expect(saved.state.claimedSets, `${setId}: durable claim record`).toEqual([setId]);
    expect(await f.repository.revision(), `${setId}: exactly one durable revision`).toBe(1);
    expect(await f.backend.keys('receipts'), `${setId}: exactly one F4 receipt`).toHaveLength(1);
    const authority = readF4Authority(saved.extensions);
    expect(authority.kind).toBe('loaded');
    if (authority.kind === 'loaded') {
      expect(authority.authority.sessionRng.ordinal, `${setId}: one receipt ordinal`).toBe(1);
      expect(authority.authority.sessionRng.draws).toEqual({});
    }

    // Live published save agrees with the durable one (no live-only reward).
    expect(h.env.save.essence, `${setId}: live Stardust must equal the durable Stardust`)
      .toBe(saved.state.essence);
    expect(h.env.save.stats.essenceEarned, `${setId}: live lifetime Stardust must equal durable`)
      .toBe(saved.state.stats.essenceEarned);
    expect(h.env.save.claimedSets).toEqual(saved.state.claimedSets);
    expect(h.env.save.unlocked, `${setId}: achievements refresh through the same receipt`)
      .toEqual(saved.state.unlocked);
    expect(h.env.save.stats.bestRank).toBe(saved.state.stats.bestRank);
    expect(h.executable.lastOutcome()).toBe(`committed:${setId}:0`);
    expect(h.env.lastPersistenceOutcome).toBe('arc9-binder-claim-committed:1');
    expect(h.scheduleReload).not.toHaveBeenCalled();
    expect(h.progressionCeremony).toHaveBeenCalledTimes(1);
    expect(h.toast).toHaveBeenCalledWith(
      'Binder Set claimed', expect.stringContaining(`+${stardust} Stardust`), true,
    );

    // The re-rendered Records panel shows the claim, not a second control.
    expect(h.claimButton(setId), `${setId}: claimed Set must not render a claim control`).toBeNull();
    expect(h.recpanel.querySelector(`[data-binder-set="${setId}"] .binder-claimed`)?.textContent)
      .toBe('claimed ✓');
    expect(h.recpanel.querySelector('.binder-action-status')?.textContent)
      .toContain(`Reward: +${stardust} Stardust.`);
    expect(h.recpanel.textContent).toContain(`✦ ${20 + stardust}`);

    // A second, independent re-read shows the identical committed state.
    const reread = await durableSave(f);
    expect(JSON.stringify(reread.state)).toBe(JSON.stringify(saved.state));
    const projected = projectArc9BinderReadModelV1(reread.state);
    expect(projected.kind).toBe('projected');
    if (projected.kind === 'projected') {
      expect(projected.model.sets.find(({ id }) => id === setId)).toMatchObject({
        complete: true, claimed: true, stardust,
      });
    }
  } finally {
    h.dom.window.close();
    await f.runtime.release();
  }
}

/* ------------------------------------------------------------------- tests */

describe('A5 #84 Binder Set claim — shipped Records control, durable outcome', () => {
  it.each(['kingdoms', 'para10'] as const)(
    'pressing Claim on a complete, unclaimed %s Set pays the authored Stardust once, durably',
    async (setId) => {
      await pressAndProveClaim(setId);
    },
  );

  it('never pays twice: disabled in-flight press, forced in-flight press, stale control, and post-reload press', async () => {
    const f = await durableFixture(kingdomCodex());
    const h = mainBinderHarness(f);
    try {
      h.claimButton('kingdoms')!.click();
      // Synchronously after the press the runner has claimed the action and
      // re-rendered Records with every claim control disabled.
      expect(h.executable.pendingId()).toBe('kingdoms');
      const inFlight = h.claimButton('kingdoms')!;
      expect(inFlight.disabled).toBe(true);
      expect(inFlight.getAttribute('aria-disabled')).toBe('true');
      expect(h.recpanel.getAttribute('aria-busy')).toBe('true');
      inFlight.click(); // disabled: the Records owner ignores it
      expect(h.executable.lastOutcome()).toBe('pending');
      expect(h.toast).not.toHaveBeenCalled();
      inFlight.disabled = false;
      inFlight.click(); // forced: reaches the runner, which refuses while one claim is pending
      expect(h.executable.lastOutcome()).toBe('unavailable:write-authority');
      expect(h.toast).toHaveBeenCalledWith(
        'Binder claim unavailable', 'Finish the current expedition save, then try again.',
      );
      await h.settle();

      let saved = await durableSave(f);
      expect(saved.state.essence).toBe(35);
      expect(saved.state.stats.essenceEarned).toBe(45);
      expect(saved.state.claimedSets).toEqual(['kingdoms']);
      expect(await f.repository.revision()).toBe(1);
      expect(await f.backend.keys('receipts')).toHaveLength(1);
      expect(h.executable.lastOutcome()).toBe('committed:kingdoms:0');

      // A stale control instance for the already-claimed Set.
      h.forgeClaimButton('kingdoms').click();
      await h.settle();
      expect(h.executable.lastOutcome()).toBe('current:kingdoms');
      expect(h.executable.lastStatus()).toBe('That Binder Set reward is already claimed.');

      // Reload: the live save is replaced by the durable re-read, Records is
      // refilled from it, and a forced press still pays nothing.
      h.env.save = saved.state;
      h.executable.fillRecords();
      expect(h.claimButton('kingdoms')).toBeNull();
      h.forgeClaimButton('kingdoms').click();
      await h.settle();
      expect(h.executable.lastOutcome()).toBe('current:kingdoms');

      saved = await durableSave(f);
      expect(saved.state.essence).toBe(35);
      expect(saved.state.stats.essenceEarned).toBe(45);
      expect(saved.state.claimedSets).toEqual(['kingdoms']);
      expect(await f.repository.revision()).toBe(1);
      expect(await f.backend.keys('receipts')).toHaveLength(1);
      expect(h.env.save.essence).toBe(35);
      expect(h.toast.mock.calls.filter(([title]) => title === 'Binder Set claimed')).toHaveLength(1);
    } finally {
      h.dom.window.close();
      await f.runtime.release();
    }
  });

  it('an incomplete Set renders no claim control and a forced press pays nothing', async () => {
    // Four Crowns complete; every other Set (e.g. The Apex Court) incomplete.
    const f = await durableFixture(kingdomCodex());
    const h = mainBinderHarness(f);
    try {
      for (const id of ARC9_BINDER_CLAIMABLE_SET_IDS_V1.filter((candidate) => candidate !== 'kingdoms')) {
        expect(h.claimButton(id), `${id} is incomplete and must not render a claim control`).toBeNull();
      }
      expect(h.recpanel.querySelector('[data-binder-set="court"] .sub')?.textContent)
        .toBe('I — · II — · III —');
      const before = await durableSave(f);

      h.forgeClaimButton('court').click();
      await h.settle();
      expect(h.executable.lastOutcome()).toBe('refused:locked:court');
      expect(h.executable.lastStatus()).toBe('That Binder Set is incomplete or unavailable. Nothing changed.');
      h.forgeClaimButton('para10').click();
      await h.settle();
      expect(h.executable.lastOutcome()).toBe('refused:locked:para10');

      const after = await durableSave(f);
      expect(JSON.stringify(after.state)).toBe(JSON.stringify(before.state));
      expect(after.state.essence).toBe(10);
      expect(after.state.stats.essenceEarned).toBe(20);
      expect(after.state.claimedSets).toEqual([]);
      expect(await f.repository.revision()).toBe(0);
      expect(await f.backend.keys('receipts')).toHaveLength(0);
      expect(h.env.save.essence).toBe(10);
      expect(h.progressionCeremony).not.toHaveBeenCalled();
    } finally {
      h.dom.window.close();
      await f.runtime.release();
    }
  });

  it('an empty Compendium: no Set can be claimed and a forced Four Crowns press pays nothing', async () => {
    const f = await durableFixture([]);
    const h = mainBinderHarness(f);
    try {
      expect(h.recpanel.querySelectorAll('[data-binder-claim]')).toHaveLength(0);
      expect(h.recpanel.querySelector('[data-binder-set="kingdoms"] .sub')?.textContent).toBe('0 / 4');
      h.forgeClaimButton('kingdoms').click();
      await h.settle();
      expect(h.executable.lastOutcome()).toBe('refused:locked:kingdoms');
      const after = await durableSave(f);
      expect(after.state.essence).toBe(10);
      expect(after.state.claimedSets).toEqual([]);
      expect(await f.repository.revision()).toBe(0);
      expect(await f.backend.keys('receipts')).toHaveLength(0);
    } finally {
      h.dom.window.close();
      await f.runtime.release();
    }
  });

  describe('negative controls: the outcome proof fails when the executed Main source is broken', () => {
    it('UNDER-PAY: a claim control wired to nothing fails the durable Stardust assertion', async () => {
      await expect(pressAndProveClaim('kingdoms', [[
        'if (setId !== undefined) void runArc9BinderSetClaim(setId);',
        'if (setId !== undefined) void 0;',
      ]])).rejects.toThrow(/kingdoms: durable current Stardust must be 10 \+ 25/u);
    });

    it('UNDER-PAY: dropping the durable commit (claim answered "current") fails the durable Stardust assertion', async () => {
      await expect(pressAndProveClaim('kingdoms', [[
        'outcome = await commitArc9BinderSetClaimV1({',
        'outcome = { kind: \'current\', setId } as const; void ({',
      ]])).rejects.toThrow(/kingdoms: durable current Stardust must be 10 \+ 25/u);
    });

    it('OVER-PAY (live): publishing the reward twice fails the live-equals-durable assertion', async () => {
      await expect(pressAndProveClaim('kingdoms', [[
        'publishArc9BinderSetClaimFieldsV1(sourceState, outcome);',
        'publishArc9BinderSetClaimFieldsV1(sourceState, outcome); sourceState.essence += outcome.facts.stardust;',
      ]])).rejects.toThrow(/kingdoms: live Stardust must equal the durable Stardust/u);
    });

    it('OVER-PAY (durable): committing from a pre-paid parent fails the durable Stardust assertion', async () => {
      await expect(pressAndProveClaim('kingdoms', [[
        '      state: sourceState,\n      setId,',
        '      state: { ...sourceState, essence: sourceState.essence + 25 },\n      setId,',
      ]])).rejects.toThrow(/kingdoms: (durable current Stardust must be 10 \+ 25|exactly one durable revision)/u);
    });
  });
});
