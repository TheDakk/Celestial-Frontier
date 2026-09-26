/* Friendly duel (v1.8.9 parity, +8 XP) — UI OUTCOME test (A5 pattern; CLAUDE.md rule 7: assert the OUTCOME, not the code path).

   The exact shipped main.ts friendly-duel section (controller, projector, runFriendlyDuel) is sliced, type-stripped and executed over a
   REAL F4 runtime + memory backend. The test pastes a real CFB- code into the real input and presses the real Duel button, then reads
   the COMMITTED save back: stats.duels / duelwins, the companion's durable XP (Arc 5 ownership AND its v4 Compendium mirror row) and
   the active-play credit window (a second counted win inside 30 s of PLAY pays nothing; winding the device clock forward never helps;
   30 s of play later it pays again). The v1.8.9 ledger numbers are read from the tracked v1 source (readTrackedV1Source), never main.js.
   Mutation controls re-run the scenario against Main mutants and require it to fail. */
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
  type CreatureInstanceId,
  type DiscoveryRecordId,
} from '@cf/domain-acquisition';
import { encodeCreature, runDuel, FRIENDLY_DUEL_WIN_XP_V1, FRIENDLY_DUEL_CREDIT_WINDOW_ACTIVE_MS_V1 } from '@cf/domain-combatcore';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
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
  readFriendlyDuelLedgerV1,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  FriendlyDuelController,
  commitFriendlyDuelActionV1,
  friendlyDuelResultCopyV1,
  projectFriendlyDuelV1,
} from '../apps/game/src/friendly-duel.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_090_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };

function exactMainSection(start: string, end: string): string {
  const a = MAIN_SOURCE.split(start).length - 1, b = MAIN_SOURCE.split(end).length - 1;
  if (a !== 1 || b !== 1) throw new Error(`Main duel anchors must be unique (${a}/${b})`);
  const left = MAIN_SOURCE.indexOf(start);
  return MAIN_SOURCE.slice(left, MAIN_SOURCE.indexOf(end, left));
}
const MAIN_DUEL_SOURCE = exactMainSection('let lastFriendlyDuelOutcome: string | null = null;', '/* §20 Command (Nick 2026-09-25): the Break loop.');
interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }
function executable(env: Record<string, unknown>, mutations: readonly MainMutation[]) {
  const source = mutations.reduce((src, m) => {
    const n = src.split(m.needle).length - 1;
    if (n !== 1) throw new Error(`mutation "${m.name}" needle found ${n} times`);
    return src.replace(m.needle, () => m.replacement);
  }, MAIN_DUEL_SOURCE);
  const t = transformSync('main-duel.ts', source);
  if (t.errors.length > 0) throw new Error(JSON.stringify(t.errors));
  return new Function('env', `with (env) { ${t.code}; return { controller: friendlyDuelController, project: projectCurrentFriendlyDuel,
    outcome: () => lastFriendlyDuelOutcome }; }`)(env) as { controller: FriendlyDuelController; project: (row: unknown) => unknown; outcome: () => string | null };
}

/* ---------------- the v1.8.9 ledger, read from the tracked v1 source ---------------- */
const V1 = readTrackedV1Source().script;

/* ---------------- fixtures: one companion, a challenger it beats and one it loses to ---------------- */
const MINE_SEED = 4_242;
const MINE_GENOME = makeGenome(MINE_SEED, 'fauna', 0.6);
const MINE_ID = ownershipContentId('creature', 'friendly-duel-mine') as CreatureInstanceId;
const mineForFight = () => ({ name: 'Aster', genome: { ...canonicalGenomeIdentityV1(MINE_GENOME).genome, xp: 0, hurt: 0 } as never });
function challengerCode(want: 'A' | 'B'): string {
  for (let seed = 1; seed < 20_000; seed++) {
    const genome = makeGenome(seed, 'fauna', 0.5);
    const code = encodeCreature({ name: `Rival ${seed}`, genome });
    if (runDuel(mineForFight(), { name: `Rival ${seed}`, genome: genome as never }).winner === want) return code;
  }
  throw new Error(`no ${want} challenger`);
}
const WIN_CODE = challengerCode('A');
const LOSS_CODE = challengerCode('B');

async function fixture() {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const identity = canonicalGenomeIdentityV1(MINE_GENOME);
  const discoveryId = ownershipContentId('discovery', 'friendly-duel-mine') as DiscoveryRecordId;
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({ identity, alias: null, firstObservationId: discoveryId })],
    discoveries: [createLegacyDiscoveryRecordV1({ recordId: discoveryId, speciesId: identity.speciesId, legacyCodexId: `s${MINE_SEED}`,
      legacySourceIndex: 0, from: 'Duel fixture', legacyLocation: null, firstForSpecies: true })],
    creatures: [createCreatureInstanceV1({ creatureId: MINE_ID, speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity,
      genome: identity.genome, nickname: 'Aster', origin: 'legacy', acquisitionRecordId: discoveryId,
      lineage: { kind: 'none', generation: identity.genome.gen as number }, xp: 0, hurt: 0, fed: null, brood: null, assignment: null, bond: null })],
    specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
  const state: SaveStateV2 = { ...imported.state, codex: [[`s${MINE_SEED}`, { id: `s${MINE_SEED}`, name: 'Aster species', kind: 'Fauna', tier: null,
    realm: 'Wild', sapient: 0, from: 'Duel fixture', hybrid: false, g: { ...identity.genome, xp: 0, hurt: 0 }, where: null }]] as never };
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(3).state());
  const arc5 = prepareArc5OwnershipMigration({ extensions: applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(source).writes).extensions,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(arc5.kind);
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  if ((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind !== 'migrated') throw new Error('v5');
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  let monotonic = 0;
  const runtime = createF4RuntimeAuthority({ backend, repository, registry: REGISTRY, initialRevision: 0, initialExtensions: arc5.extensions,
    initialState: initial.canonicalState, restoredAuthority: f4.authority, freshSessionSeed: 0, ownerId: 'duel-tab', token: 'duel-doc',
    leaseTtlMs: 10_000_000, now: () => monotonic, visible: true, answerable: true });
  if ((await runtime.heartbeat()).kind !== 'owned') throw new Error('lease');
  monotonic = 60_000;
  return { backend, repository, runtime, state: initial.canonicalState, ownership: arc5.state, evidence: arc5.evidence,
    setPlay: (ms: number) => { monotonic = ms; } };
}

function harness(f: Awaited<ReturnType<typeof fixture>>, mutations: readonly MainMutation[] = [], wallClock = { now: NOW }) {
  const dom = new JSDOM('<!doctype html><body><section data-friendly-duel-body></section></body>');
  const document = dom.window.document;
  const toast = vi.fn(), reload = vi.fn();
  const row = [`s${MINE_SEED}`, f.state.codex[0]![1]] as const;
  const env: Record<string, unknown> = {
    document, FriendlyDuelController, commitFriendlyDuelActionV1, friendlyDuelResultCopyV1, projectFriendlyDuelV1,
    canonicalGenomeIdentityV1, readArc5OwnershipMigration, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    save: f.state, f4Runtime: f.runtime, arc5OwnershipState: f.ownership, arc5OwnershipEvidence: f.evidence, arc5OwnershipProtection: null,
    compendiumFixtureRows: null, currentCompendiumDetailRow: () => row,
    f4RuntimeMayMutate: (r: F4RuntimeAuthority | null) => r !== null && r.diagnostics().leaseOwned && !r.diagnostics().staleBlocked,
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(), productActionInFlight: false, smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined, Date: Object.freeze({ now: () => wallClock.now }), performance: Object.freeze({ now: () => 1 }),
    f4LastCheckpointAt: 0, lastPersistenceOutcome: null, scheduleF4AuthorityConvergenceReload: reload, queueArc9ProgressionRefresh: vi.fn(), toast,
  };
  const exec = executable(env, mutations);
  const mount = document.querySelector<HTMLElement>('[data-friendly-duel-body]')!;
  exec.controller.setState(exec.project(row) as never);
  exec.controller.attach(mount);
  return { dom, env, exec, mount, toast, reload };
}
type H = ReturnType<typeof harness>;
async function duel(h: H, code: string): Promise<void> {
  const input = h.mount.querySelector<HTMLInputElement>('[data-friendly-duel-code]');
  expect(input, 'Main must render the challenger code input').not.toBeNull();
  input!.value = code;
  input!.dispatchEvent(new h.dom.window.Event('input', { bubbles: true }));
  const button = h.mount.querySelector<HTMLButtonElement>('[data-friendly-duel-fight]')!;
  expect(button.disabled, 'a pasted code and a ready companion enable Duel').toBe(false);
  button.click();
  button.click();   // double tap: the latch holds
  await vi.waitFor(() => { if (h.exec.controller.diagnostics().pending) throw new Error('pending'); }, { timeout: 5_000, interval: 2 });
}
async function durable(backend: StorageBackend) {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(saved.kind);
  const ownership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(ownership.kind);
  const clock = readF4Authority(saved.extensions);
  if (!saved.state.codex.some(([id]) => id === `s${MINE_SEED}`)) throw new Error(`codex ids ${JSON.stringify(saved.state.codex.map(([id]) => id))}`);
  return { saved, xp: ownership.state.creatures.find((c) => c.creatureId === MINE_ID)!.xp ?? 0,
    mirrorXp: (saved.state.codex.find(([id]) => id === `s${MINE_SEED}`)![1].g as { xp?: number }).xp ?? 0,
    ledger: readFriendlyDuelLedgerV1(saved.extensions), activePlayMs: clock.kind === 'loaded' ? clock.authority.activePlayMs : -1 };
}

async function scenario(mutations: readonly MainMutation[] = []): Promise<void> {
  const f = await fixture();
  const wall = { now: NOW };
  const h = harness(f, mutations, wall);
  // (1) a counted WIN: one receipt, duels +1, duelwins +1, +8 XP on the durable companion and its Compendium mirror
  await duel(h, WIN_CODE);
  let d = await durable(f.backend);
  expect(await f.repository.revision(), `one duel = one revision (Main said ${h.exec.outcome()})`).toBe(1);
  expect(d.saved.state.stats.duels).toBe(1);
  expect(d.saved.state.stats.duelwins).toBe(1);
  expect(d.xp, 'a win pays +8 XP to the durable companion').toBe(8);
  expect(d.mirrorXp, 'and to its Compendium mirror row').toBe(8);
  expect(d.saved.state.codex[0]![1].g).toMatchObject({ hurt: 0 });
  expect(h.env.save as SaveStateV2).toMatchObject({ stats: { duels: 1, duelwins: 1 } });
  expect(h.mount.querySelector('[data-friendly-duel-status]')?.textContent).toContain('+8 XP');
  // (2) a second win inside 30 s of PLAY counts the duel but pays nothing — even with the DEVICE clock wound a day forward
  wall.now = NOW + 86_400_000;
  f.setPlay(60_000 + 10_000);
  await duel(h, WIN_CODE);
  d = await durable(f.backend);
  expect(d.saved.state.stats.duels).toBe(2);
  expect(d.saved.state.stats.duelwins, 'the device clock never reopens the window').toBe(1);
  expect(d.xp).toBe(8);
  // (3) a LOSS in the same moment still teaches: participation rides its own window (v1's A/B catch)
  await duel(h, LOSS_CODE);
  d = await durable(f.backend);
  expect(d.saved.state.stats.duels).toBe(3);
  expect(d.xp - 8, 'participation XP is 2 or 3').toBeGreaterThanOrEqual(2);
  expect(d.xp - 8).toBeLessThanOrEqual(3);
  const afterLoss = d.xp;
  // (4) 30 s of PLAY after the first win, a win pays again
  f.setPlay(60_000 + FRIENDLY_DUEL_CREDIT_WINDOW_ACTIVE_MS_V1 + 5_000);
  await duel(h, WIN_CODE);
  d = await durable(f.backend);
  expect(d.saved.state.stats.duelwins).toBe(2);
  expect(d.xp).toBe(afterLoss + 8);
  expect(d.ledger.kind).toBe('loaded');
  expect(h.reload).not.toHaveBeenCalled();
  await f.runtime.release();
}

describe('friendly duel through the shipped Compendium control (browser-free outcome)', () => {
  it('v1.8.9 parity: the tracked v1 source pays +8 on a counted win and 2/3 participation on the same 30 s windows', () => {
    expect(V1).toContain("awardXP(_mid, 8, 'a duel won')");
    expect(V1).toContain("awardXP(_mid, _close?3:2, _close?'a fight taken to the wire':'a bout survived')");
    expect(V1).toContain('if(_dn-_lastDuelCredit>30000)');
    expect(V1).toContain('if(_dl-_lastDuelPart>30000)');
    expect(V1).toContain('const _close=(res.hpB/Math.max(1,res.maxB))<0.25;');
    expect(FRIENDLY_DUEL_WIN_XP_V1).toBe(8);
    expect(FRIENDLY_DUEL_CREDIT_WINDOW_ACTIVE_MS_V1).toBe(30_000);
  });

  it('real paste + Duel presses: win +8 XP durable, cooldown on the PLAY clock (device clock ignored), participation XP, window reopens', async () => {
    await scenario();
  });

  it('an invalid code writes nothing and says so', async () => {
    const f = await fixture();
    const h = harness(f);
    await duel(h, 'not a code');
    expect(await f.repository.revision()).toBe(0);
    expect(h.exec.outcome()).toBe('refused:code:invalid');
    await f.runtime.release();
  });

  for (const mutation of [
    { name: 'the duel never reaches the writer', needle: '    const outcome = await commitFriendlyDuelActionV1({', replacement: '    const outcome: never = { kind: "refused", detail: "mutant", convergence: "none" } as never; void ({' },
    { name: 'the counters are not published', needle: '    liveStats.duels = committedStats.duels; liveStats.duelwins = committedStats.duelwins;', replacement: '' },
  ] as const) {
    it(`negative control: ${mutation.name} → the scenario fails`, async () => {
      await expect(scenario([mutation])).rejects.toThrow();
    });
  }
});
