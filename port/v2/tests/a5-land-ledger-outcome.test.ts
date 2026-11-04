/* A5 gaps #81/#82 on the LAND path (INVENTORY.md: "the XP ledger after Land / capture / Feed presses"; "#81 passive Charter banking").
 *
 * The ledger was proven only through its own transaction (arc0-landing-action, arc9-progression). Here the exact shipped main.ts sections
 * run in JSDOM over a REAL F4 runtime and memory backend: the survey card's delegated click listener (its `landcta` branch),
 * landWithPilotPresentation, doLand and publishArc0LandingFields, and the real Arc 0 landing transaction. The test presses Land on
 * Earth from the Sol system and reads the committed v5 save back (twice) and after a reboot: the world is landed, the field-sample
 * Stardust and cargo, the ascent Charter progress (passive banking) and the unlocked achievements equal what the committed receipt's
 * own witness facts say — and differ from before the press. The live save equals the durable save.
 * Mutation controls break the wiring: the press never lands; the committed ledger fields never publish to the live save. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { MAX_GEAR_CAPACITY } from '@cf/domain-loot';
import {
  V4_PRIMARY_KEY, applyV5ExtensionWrites, arc2LootLegacyMirrorMatches, createEmptyWorldIdentityState, encodeWorldIdentityExtensionWrites, prepareArc2LootLegacyMigration, createMemoryBackend, createRevisionedRepository, encodeArc2LootCarrier, importSaveV2, migrateStoredV4ToV5,
  prepareF4AuthorityUpdate, prepareV5SaveWrite, readArc2Loot, readF4Authority, readSaveV5, type ContentRegistry, type SaveStateV2, type StorageBackend,
} from '@cf/persistence';
import {
  canonicalCF1WorldAddressFromNav, getProvenGalaxyKey, getProvenPlanetKey, getProvenStarKey, isProvenPlanetFor, land, navFromCanonicalCF1Address, reconcileV2Chapters,
  resolveCF1StarAddress, resolveCF1World,
} from '@cf/scene';
import { commitArc0LandingAction, operationForArc0Landing } from '../apps/game/src/arc0-landing-action.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_065_000;
beforeAll(() => installCaptureHooks());
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };

function exactMainSection(start: string, end: string): string {
  const a = MAIN_SOURCE.split(start).length - 1, b = MAIN_SOURCE.split(end).length - 1;
  if (a !== 1 || b !== 1) throw new Error(`Main landing anchors must be unique (${a}/${b}): ${start} -> ${end}`);
  const left = MAIN_SOURCE.indexOf(start);
  return MAIN_SOURCE.slice(left, MAIN_SOURCE.indexOf(end, left + start.length));
}
const MAIN_LAND = [
  exactMainSection('function activeCardPlanetState(): Extract<NavState, { mode: \'surface\' }> | null {', '\nfunction atlasRouteIdentityMatches('),
  exactMainSection('function publishArc0LandingFields(', '\nlet lastArc0AtlasOutcome:'),
  exactMainSection('async function landWithPilotPresentation(trusted: boolean): Promise<boolean> {', "\ncard.addEventListener('click', async (e) => {"),
  exactMainSection("card.addEventListener('click', async (e) => {", '\nlet worldHarvestPendingSeed'),
].join('\n');
interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }
function replaceExact(source: string, m: MainMutation): string {
  const n = source.split(m.needle).length - 1;
  if (n !== 1) throw new Error(`mutation "${m.name}" needle must occur once; found ${n}`);
  return source.replace(m.needle, () => m.replacement);
}

function solAndEarth() {
  const address = resolveCF1StarAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 } });
  if (!address.ok) throw new Error('sol');
  const sol = navFromCanonicalCF1Address(address.address);
  if (!sol.ok || sol.state.mode !== 'system') throw new Error('sol nav');
  const earth = resolveCF1World(sol.state.star, { seed: 133 });
  if (!earth.ok) throw new Error('earth');
  return { sol: sol.state, earth: earth.planet };
}

interface Fixture { backend: StorageBackend; repository: ReturnType<typeof createRevisionedRepository>; runtime: F4RuntimeAuthority; state: SaveStateV2 }
async function freshFixture(): Promise<Fixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  // Main's boot prepares the Arc 2 loot carrier and the canonical world-identity carrier before any action (the landing refuses without them)
  const loot = prepareArc2LootLegacyMigration({ extensions: {}, legacy: imported.state, capacity: MAX_GEAR_CAPACITY });
  if (loot.kind !== 'prepared') throw new Error(`loot ${loot.kind}`);
  const f4 = prepareF4AuthorityUpdate(loot.extensions, { activePlayMs: 0 }, createSessionRNG(0).state());
  const extensions = applyV5ExtensionWrites(f4.extensions, encodeWorldIdentityExtensionWrites(createEmptyWorldIdentityState())).extensions;
  const backend = createMemoryBackend(), initial = prepareV5SaveWrite({ state: imported.state, extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  if ((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind !== 'migrated') throw new Error('v5');
  await backend.apply(initial.operations);
  return boot(backend, 'first');
}
async function boot(backend: StorageBackend, tag: string): Promise<Fixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(saved.kind);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(authority.kind);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({ backend, repository, registry: REGISTRY, initialRevision: await repository.revision(), initialExtensions: saved.extensions,
    initialState: saved.state, restoredAuthority: authority.authority, freshSessionSeed: 0, ownerId: `a5-land-${tag}`, token: `a5-land-${tag}`, leaseTtlMs: 1_000_000,
    now: () => 0, visible: true, answerable: true });
  if ((await runtime.heartbeat()).kind !== 'owned') throw new Error('lease');
  return { backend, repository, runtime, state: saved.state };
}
async function durable(f: Fixture) { const s = await readSaveV5(f.backend, REGISTRY, NOW); if (s.kind !== 'loaded') throw new Error(s.kind); return s; }

function harness(f: Fixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM('<!doctype html><html><body><section id="card" style="display:block"></section></body></html>'), document = dom.window.document;
  const card = document.getElementById('card')!;
  const g = globalThis as Record<string, unknown>, w = dom.window as unknown as Record<string, unknown>, DOM_GLOBALS = ['Element', 'HTMLElement', 'HTMLButtonElement', 'Event'] as const;
  const prior = DOM_GLOBALS.map((k) => [k, g[k]] as const); for (const k of DOM_GLOBALS) g[k] = w[k];
  const { sol, earth } = solAndEarth();
  const ceremony = vi.fn(), scheduleReload = vi.fn(), progression = vi.fn();
  let arc2 = readArc2Loot(f.runtime.extensions);
  const env: Record<string, unknown> & { nav: { mode: string }; save: SaveStateV2; activePersist: unknown; productActionInFlight: boolean; lastArc0LandingOutcome: string | null } = {
    document, card, Date: Object.freeze({ now: () => NOW }), performance: Object.freeze({ now: () => 17 }), __CF_EVIDENCE_BUILD__: false, structuredClone,
    save: f.state, nav: sol, cardCtx: { p: { seed: 133 }, gal: sol.gal, star: sol.star, planet: earth }, savedRouteWriteHeld: false, cardTravelAction: null,
    f4Runtime: f.runtime, f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => runtime !== null && runtime.diagnostics().leaseOwned && !runtime.diagnostics().staleBlocked,
    f4LastCheckpointAt: 0, lastPersistenceOutcome: null, lastArc0LandingOutcome: null, settleF4Heartbeat: async () => undefined,
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    productActionInFlight: false, productActionCoordinator: createProductActionCoordinator(), smokeProductActionHold: createProductActionDiagnosticHold(),
    trainingActive: () => false, blockPlayerMutation: () => false, lastStarterCharterAcceptStatus: null,
    smokeRejectNextArc0LandingStorage: false, smokeStaleNextArc0LandingAuthority: false, smokeRejectArc0LandingStorageBoundary: false, smokeRejectNextArc0LandingPublication: false,
    lastSmokeArc0LandingFaultWitness: null,
    // the real owners main.ts imports
    commitArc0LandingAction, operationForArc0Landing, projectWorldOpportunity, readArc2Loot, encodeArc2LootCarrier, arc2LootLegacyMirrorMatches, reconcileV2Chapters,
    land, isProvenPlanetFor, getProvenGalaxyKey, getProvenStarKey, getProvenPlanetKey, canonicalCF1WorldAddressFromNav,
    planetNodeForProof: (_star: unknown, planet: { seed: number }) => ({ seed: planet.seed }),
    arc2LootState: arc2.kind === 'loaded' ? arc2.state : null, worldIdentityState: null, worldIdentityProtection: null,
    inventoryPanelController: { setState: vi.fn() },
    // presentation (not under test)
    audiovisualPilot: null, renderedSceneReceipt: { serial: 0 }, currentEcologyEpoch: () => 0, queueCurrentAiLandfall: vi.fn(), pilotSceneSnapshot: vi.fn(),
    tameGreetingAudioOwner: null, isAiActionTarget: () => false, hideSurvey: vi.fn(), playWhoosh: vi.fn(), buildCurrentSceneTransaction: vi.fn(), triggerCameraShake: vi.fn(),
    hudText: vi.fn(), updateChips: vi.fn(), refreshPlanetSurveyCard: vi.fn(), toast: vi.fn(), toastCharterCompletion: vi.fn(), openPanelId: () => null, fillCharters: vi.fn(),
    fillRecords: vi.fn(), refreshEngineeringPanelState: vi.fn(), gameEvent: vi.fn(), trainingStepId: () => null, presentProgressionCeremony: ceremony,
    scheduleF4AuthorityConvergenceReload: scheduleReload, queueArc9ProgressionRefresh: progression, app: { canvas: { focus: vi.fn() } },
  };
  void arc2;
  const source = mutations.reduce(replaceExact, MAIN_LAND);
  const t = transformSync('main-land.ts', source);
  if (t.errors.length) throw new Error(JSON.stringify(t.errors));
  new Function('env', `with (env) { ${t.code}; }`)(env);
  card.innerHTML = '<button data-act="landcta">Land</button>';
  const restore = () => { for (const [k, v] of prior) { if (v === undefined) delete g[k]; else g[k] = v; } dom.window.close(); };
  return { env, card, ceremony, scheduleReload, progression, restore };
}
async function settled(env: { activePersist: unknown; productActionInFlight: boolean }): Promise<void> {
  for (let i = 0; i < 5_000; i++) { if (env.activePersist === null && !env.productActionInFlight) { for (let k = 0; k < 8; k++) await new Promise((r) => setTimeout(r, 0)); return; } await new Promise((r) => setTimeout(r, 0)); }
  throw new Error('land press never settled');
}

async function scenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  const h = harness(f, mutations);
  try {
    const before = await durable(f), start = await f.repository.revision();
    h.card.querySelector<HTMLButtonElement>('[data-act="landcta"]')!.click();
    await settled(h.env);
    expect(await f.repository.revision(), `land: one durable revision (${String(h.env.lastArc0LandingOutcome)})`).toBe(start + 1);
    const receipt = await f.repository.readReceipt(0);
    expect(receipt, 'land: the receipt is the Arc 0 landing').not.toBeNull();
    const facts = JSON.parse(receipt!.witness) as { schema: string; landing: string; permanentLanding: boolean; descent?: { kind: string };
      sample: { kind: string; stardust?: number } | null; achievement: { id: string; added: boolean } | null;
      charter: { banked: boolean; delta: Record<string, number> } };
    expect(facts.schema, 'land: the receipt is the Arc 0 landing').toBe('cf-v2-arc0-landing-witness/v1');
    expect(facts.permanentLanding && facts.landing === 'first', 'land: Earth from Sol is a first permanent landing').toBe(true);
    expect(facts.charter.banked, 'land: the landing banks Charter progress (#81)').toBe(true);
    for (let read = 0; read < 2; read++) {
      const saved = await durable(f);
      expect(saved.state.landed.length, 'land: the world is durably landed').toBeGreaterThan(before.state.landed.length);
      if (facts.sample?.kind === 'reward') expect(saved.state.essence, 'land: the field-sample Stardust is durable (the XP/economy ledger)').toBe(before.state.essence + (facts.sample.stardust ?? 0));
      for (const [goal, delta] of Object.entries(facts.charter.delta)) {
        expect((saved.state.ascProg as Record<string, number>)[goal] ?? 0, `land: passive ascent Charter goal ${goal} was banked by exactly its delta`)
          .toBe(((before.state.ascProg as Record<string, number>)[goal] ?? 0) + delta);
      }
      expect(Object.keys(facts.charter.delta).length, 'land: the landing moved at least one Charter goal').toBeGreaterThan(0);
      if (facts.achievement?.added) expect(saved.state.unlocked, 'land: the landing achievement is durably unlocked').toContain(facts.achievement.id);
    }
    const saved = await durable(f);
    for (const key of ['landed', 'essence', 'cargo', 'ascProg', 'ascCh', 'unlocked', 'stats', 'savedView'] as const) {
      expect(JSON.stringify(h.env.save[key]), `land: the live ${key} equals the durable save`).toBe(JSON.stringify(saved.state[key]));
    }
    expect(h.env.nav.mode, 'land: the live route is the surface').toBe('surface');
    expect(h.ceremony).toHaveBeenCalledOnce();
    expect(h.progression).toHaveBeenCalledOnce(); // the bounded Arc 9 catch-up is queued for the landing operation
    expect(h.scheduleReload).not.toHaveBeenCalled();
    await f.runtime.release();
    f = await boot(f.backend, 'reloaded');
    expect(JSON.stringify(f.state.ascProg), 'land: the reboot keeps the banked Charter progress').toBe(JSON.stringify(saved.state.ascProg));
    expect(f.state.essence).toBe(saved.state.essence);
  } finally {
    h.restore();
    await f.runtime.release();
  }
}

describe('A5 #81/#82 on Land — the ledger after a real Land press', () => {
  it('pressing Land banks the landing, its Stardust, the passive ascent Charter progress and achievements durably (read twice, reboot)', async () => {
    await scenario();
  }, 30_000);
  const MUTANTS: readonly Readonly<{ mutation: MainMutation; failsWith: RegExp }>[] = [
    { mutation: { name: 'UNWIRED: the press never lands', needle: '    const landed = await doLand();\n', replacement: '    const landed = false;\n' }, failsWith: /land: one durable revision/u },
    { mutation: { name: 'UNPUBLISHED: the committed ledger never reaches the live save', needle: '      publishArc0LandingFields(attempt.transaction.state, facts);\n', replacement: '' },
      failsWith: /land: the live .* equals the durable save/u },
  ];
  for (const { mutation, failsWith } of MUTANTS) {
    it(`negative control — ${mutation.name}: the outcome test fails`, async () => {
      await expect(scenario([mutation])).rejects.toThrow(failsWith);
    }, 30_000);
  }
});
