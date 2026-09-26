/* §20 step 4 — Command Breaks: UI OUTCOME test (A5 pattern; CLAUDE.md rule 7: assert the OUTCOME, not the code path).

   The exact shipped main.ts sections (the combat card controller + its onAction owner, refreshCombatCardState, the combat writer
   chain from arc6CombatOutcomeCopy to runArc6CombatCardAction, and the Command Break loop runArc6CommandCardAction) are sliced,
   type-stripped and executed with an injected env over a REAL F4 runtime and memory backend. The test picks a Guardian party and
   Command with the real <select>s, presses the real Challenge and Break buttons in JSDOM, and reads the COMMITTED v5 save back:
   the sealed open-encounter record, each appended answer, a reboot that lands on the same Break, and the one settlement that closes
   the record. Mutation controls re-run the scenario against Main mutants and require it to fail.

   Only what the sections need from outside is stubbed: the surface projection (a fixed Guardian world over the live runtime's
   roster), the Chronicle presentation, toasts, ceremony and refresh sinks, and the unrelated write-hold flags. */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  ownershipStateDigestV2,
  type CreatureInstanceId,
  type DiscoveryRecordId,
} from '@cf/domain-acquisition';
import {
  COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
  autoEncounterDecisionV1,
  projectGuardianPrimeEncounterV1,
  runEncounterV1,
  type EncounterDecisionV1,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { guardianAcquisitionStateDigestV1 } from '@cf/domain-acquisition/guardian-acquisition-internal';
import { guardianCompanionStateDigestV1 } from '@cf/domain-acquisition/guardian-companion-internal';
import { resolveCF1WorldAddress } from '@cf/scene';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
  guardianLegacyCompanionSliceMatchesV1,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc5OwnershipMigration,
  readCombatOpenEncounterV1,
  readF4Authority,
  readSaveV5,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import {
  arc6CombatOpenPolicyReasonV1,
  arc6CommandAnswerFinishesV1,
  commitArc6CombatActionV1,
  decideArc6CommandEncounterV1,
  openArc6CommandEncounterV1,
  projectArc6CombatChampionAvailabilityV1,
  projectArc6CombatChampionRosterV1,
  projectArc6CommandBreakV1,
} from '../apps/game/src/arc6-combat-action.js';
import {
  COMBAT_CARD_OUTCOME_SCHEMA,
  CombatCardController,
  combatCardCommandBreakV1,
  projectCombatCardReadModelV1,
} from '../apps/game/src/combat-card.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';

installCaptureHooks();
const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_080_000;
const START_ACTIVE_PLAY_MS = 60_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };

/* ---------------- the exact shipped Main sections ---------------- */

function exactMainSection(start: string, end: string): string {
  const startCount = MAIN_SOURCE.split(start).length - 1, endCount = MAIN_SOURCE.split(end).length - 1;
  if (startCount !== 1 || endCount !== 1) throw new Error(`Main Command section anchors must be unique (${startCount}/${endCount}): ${start}`);
  const left = MAIN_SOURCE.indexOf(start), right = MAIN_SOURCE.indexOf(end, left + start.length);
  if (right <= left) throw new Error(`Main Command section is missing: ${start}`);
  return MAIN_SOURCE.slice(left, right);
}
const MAIN_COMMAND_SOURCE = [
  exactMainSection('let currentArc6CombatProjection: Arc6CombatSurfaceProjection | null = null;', '\ninterface ApproachEcologyPresentation'),
  exactMainSection('function refreshCombatCardState(', '\nfunction refreshCaptureCardState('),
  exactMainSection('function arc6CombatOutcomeCopy(', '\nfunction engineeringOutcomeConverges('),
  exactMainSection('let lastArc6CommandOutcome: string | null = null;', '\n/* D14 Outposts (N4 Option A;'), // ends at its own block (Outposts follows, 2026-09-26)
].join('\n');

interface MainMutation { readonly name: string; readonly needle: string; readonly replacement: string }
function replaceExact(source: string, mutation: MainMutation): string {
  const count = source.split(mutation.needle).length - 1;
  if (count !== 1) throw new Error(`mutation "${mutation.name}" needle must occur exactly once; found ${count}`);
  return source.replace(mutation.needle, () => mutation.replacement);
}
interface ExecutableMain {
  readonly controller: CombatCardController;
  readonly refresh: () => void;
  readonly commandOutcome: () => string | null;
  readonly combatOutcome: () => string | null;
}
function executableMain(env: Record<string, unknown>, mutations: readonly MainMutation[]): ExecutableMain {
  const source = mutations.reduce(replaceExact, MAIN_COMMAND_SOURCE);
  const transformed = transformSync('main-command.ts', source);
  if (transformed.errors.length > 0) throw new Error(JSON.stringify(transformed.errors));
  return new Function('env', `with (env) { ${transformed.code}; return {
    controller: combatCardController, refresh: () => refreshCombatCardState(),
    commandOutcome: () => lastArc6CommandOutcome, combatOutcome: () => lastArc6CombatOutcome,
  }; }`)(env) as ExecutableMain;
}

/* ---------------- a Guardian world and a three-companion party ---------------- */

const WORLD = (() => {
  const resolved = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 3824583279, x: -820.9489546869881, y: -620.6852987115271 }, planet: { seed: 2456455053 } });
  if (!resolved.ok) throw new Error(resolved.reason);
  return resolved.address;
})();
const OPPORTUNITY = projectWorldOpportunity(WORLD);
const ENCOUNTER: GuardianPrimeEncounterV1 = (() => {
  const encounter = projectGuardianPrimeEncounterV1({ world: WORLD, descriptor: { worldType: OPPORTUNITY.source.planetType }, regionIndex: 0,
    faunaRoster: [{ speciesId: 'command-guardian-native', genome: makeGenome(1, 'fauna', 0.5) }], claimedSignatureIds: [], conquered: false });
  if (encounter === null || (encounter.defender.kind !== 'guardian' && encounter.defender.kind !== 'titan')) throw new Error('no Guardian/Titan fixture');
  return encounter;
})();
const GENOME_WEIGHT = 0.5;
const genomeOf = (seed: number) => {
  const g = makeGenome(seed, 'fauna', GENOME_WEIGHT);
  return canonicalGenomeIdentityV1(g);
};
const idOf = (seed: number) => ownershipContentId('creature', `command-break-${seed}`) as CreatureInstanceId;
const simulate = (seeds: readonly number[], decisions: readonly EncounterDecisionV1[]) => runEncounterV1({
  mode: 'command', defender: { name: ENCOUNTER.defender.name, genome: ENCOUNTER.defender.battleGenome as never, phase: true },   // a Guardian: §20 phase
  party: seeds.map((seed) => ({ name: `Companion ${seed}`, genome: { ...genomeOf(seed).genome, xp: 0, hurt: 0 } as never, stance: 'balanced' as const })),
}, decisions);
function autoAnswers(seeds: readonly number[]): readonly EncounterDecisionV1[] {
  const decisions: EncounterDecisionV1[] = [];
  for (let guard = 0; guard < 16; guard++) {
    const result = simulate(seeds, decisions);
    if (result.status === 'finished') return decisions;
    decisions.push(autoEncounterDecisionV1(result.pendingBreak));
  }
  throw new Error('never finished');
}
const SEEDS = (() => {
  for (let base = 5; base < 8_000; base += 11) {
    const seeds = [base, base + 1_000, base + 2_000];
    try { if (autoAnswers(seeds).length >= 2) return seeds; } catch { /* next */ }
  }
  throw new Error('no Command party fixture');
})();
const ANSWERS = autoAnswers(SEEDS);

interface DurableFixture {
  readonly backend: StorageBackend;
  readonly repository: ReturnType<typeof createRevisionedRepository>;
  readonly runtime: F4RuntimeAuthority;
  readonly state: SaveStateV2;
  readonly ownershipV2: ReturnType<typeof ownershipOf>;
  readonly evidence: unknown;
}
function ownershipOf() {
  const rows = SEEDS.map((seed, index) => ({ seed, index, identity: genomeOf(seed),
    discoveryId: ownershipContentId('discovery', `command-break-${seed}`) as DiscoveryRecordId }));
  const first = (row: typeof rows[number]) => rows.findIndex((o) => o.identity.speciesId === row.identity.speciesId) === row.index;
  return createInitialOwnershipStateV1({
    catalogSpecies: rows.filter(first).map((row) => createCatalogSpeciesV1({ identity: row.identity, alias: null, firstObservationId: row.discoveryId })),
    discoveries: rows.map((row) => createLegacyDiscoveryRecordV1({ recordId: row.discoveryId, speciesId: row.identity.speciesId,
      legacyCodexId: `s${row.seed}`, legacySourceIndex: row.index, from: 'Command fixture', legacyLocation: null, firstForSpecies: first(row) })),
    creatures: rows.map((row) => createCreatureInstanceV1({ creatureId: idOf(row.seed), speciesId: row.identity.speciesId,
      genomeIdentity: row.identity.genomeIdentity, genome: row.identity.genome, nickname: `Companion ${row.seed}`, origin: 'legacy',
      acquisitionRecordId: row.discoveryId, lineage: { kind: 'none', generation: row.identity.genome.gen as number },
      xp: 0, hurt: 0, fed: null, brood: null, assignment: null, bond: null })),
    specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
}

async function bootRuntime(backend: StorageBackend, tag: string): Promise<DurableFixture> {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`read was ${saved.kind}`);
  const authority = readF4Authority(saved.extensions);
  if (authority.kind !== 'loaded') throw new Error(`F4 authority was ${authority.kind}`);
  const ownership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(`ownership was ${ownership.kind}`);
  const repository = createRevisionedRepository(backend);
  let monotonicNow = 0;
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: await repository.revision(),
    initialExtensions: saved.extensions, initialState: saved.state, restoredAuthority: authority.authority, freshSessionSeed: 0,
    ownerId: `command-tab-${tag}`, token: `command-document-${tag}`, leaseTtlMs: 10_000_000, now: () => monotonicNow, visible: true, answerable: true,
  });
  if ((await runtime.heartbeat()).kind !== 'owned') throw new Error('lease');
  monotonicNow = START_ACTIVE_PLAY_MS;
  return { backend, repository, runtime, state: saved.state, ownershipV2: ownership.state as never, evidence: ownership.evidence };
}

async function freshFixture(): Promise<DurableFixture> {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const state: SaveStateV2 = {
    ...imported.state,
    codex: SEEDS.map((seed) => [`s${seed}`, { id: `s${seed}`, name: `Companion ${seed}`, kind: 'Fauna', tier: null, realm: 'Wild', sapient: 0,
      from: 'Command fixture', hybrid: false, g: { ...genomeOf(seed).genome, xp: 0, hurt: 0 }, where: null }]) as never,
  };
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(7).state());
  const arc4 = applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(ownershipOf()).writes).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions: arc4, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture was ${arc5.kind}`);
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  if ((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind !== 'migrated') throw new Error('v5');
  await backend.apply(initial.operations);
  return bootRuntime(backend, 'first');
}

/* ---------------- the Main harness ---------------- */

function mainHarness(f: DurableFixture, mutations: readonly MainMutation[] = []) {
  const dom = new JSDOM('<!doctype html><html><body><section id="survey"><div data-combat-card-body></div></section></body></html>');
  const document = dom.window.document;
  // the imported card controller tests `instanceof` against the page's DOM classes
  for (const name of ['Element', 'HTMLElement', 'HTMLSelectElement', 'HTMLButtonElement', 'Event'] as const) {
    (globalThis as Record<string, unknown>)[name] = (dom.window as unknown as Record<string, unknown>)[name];
  }
  const toast = vi.fn(), scheduleReload = vi.fn();
  const NAV = Object.freeze({ mode: 'surface' });
  const env: Record<string, unknown> & { save: SaveStateV2; arc5OwnershipState: unknown } = {
    document, card: document.getElementById('survey'), nav: NAV,
    CaptureCardController: class { setPending(): void {} setState(): void {} },
    CombatCardController, projectCombatCardReadModelV1, combatCardCommandBreakV1, COMBAT_CARD_OUTCOME_SCHEMA,
    COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,
    tameGreetingAudioOwner: null, combatChronicleAudioSession: null, currentCapturePresentationFence: null,
    runCaptureCardAction: vi.fn(),
    save: f.state, f4Runtime: f.runtime,
    f4RuntimeMayMutate: (runtime: F4RuntimeAuthority | null = f.runtime) => runtime !== null && runtime.diagnostics().leaseOwned && !runtime.diagnostics().staleBlocked,
    arc5OwnershipState: f.ownershipV2, arc5OwnershipEvidence: f.evidence, arc5OwnershipProtection: null,
    ARC5_OWNERSHIP_MIGRATION_VERSION, ownershipStateDigestV2, readArc5OwnershipMigration, SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    guardianAcquisitionStateDigestV1, guardianCompanionStateDigestV1, guardianLegacyCompanionSliceMatchesV1,
    arc6CombatOpenPolicyReasonV1, arc6CommandAnswerFinishesV1, commitArc6CombatActionV1, decideArc6CommandEncounterV1,
    openArc6CommandEncounterV1, projectArc6CombatChampionAvailabilityV1, projectArc6CombatChampionRosterV1, projectArc6CommandBreakV1,
    projectCurrentArc6CombatSurface: (_roster: unknown, observedActivePlayMs: number) => {
      const runtime = env.f4Runtime as F4RuntimeAuthority;
      const ownership = env.arc5OwnershipState as never;
      const championRoster = projectArc6CombatChampionRosterV1({ ownershipV2: ownership, extensions: runtime.extensions });
      if (championRoster.kind !== 'projected') return null;
      return Object.freeze({ authorityKey: `k:${championRoster.authorityKey}`, contextKey: 'command-world', observedActivePlayMs,
        championRoster, encounter: ENCOUNTER, opportunity: OPPORTUNITY, roster: null });
    },
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false,
    trainingCheckpointWriteHeld: false, ecologyEpochBlocksActions: () => false,
    productActionCoordinator: createProductActionCoordinator(), productActionInFlight: false,
    smokeProductActionHold: createProductActionDiagnosticHold(), settleF4Heartbeat: async () => undefined,
    Date: Object.freeze({ now: () => NOW }), performance: Object.freeze({ now: () => 17 }),
    f4LastCheckpointAt: 0, lastPersistenceOutcome: null, lastArc5BootstrapOutcome: null,
    scheduleF4AuthorityConvergenceReload: scheduleReload, presentProgressionCeremony: vi.fn(), queueArc9ProgressionRefresh: vi.fn(),
    syncCustomNameIndex: vi.fn(), toast, updateChips: vi.fn(), fillCodex: vi.fn(), fillCharters: vi.fn(), codexFilter: null,
    gameEvent: vi.fn(), refreshCaptureCardState: vi.fn(), openPanelId: () => null, openPanel: vi.fn(), closePanels: vi.fn(),
    projectCombatCueParticipantsV1: vi.fn(), combatCuePlan: vi.fn(), projectCombatChronicleV1: vi.fn(),
    location: { search: '' },
  };
  const exec = executableMain(env, mutations);
  const mount = document.querySelector<HTMLElement>('[data-combat-card-body]')!;
  exec.controller.attach(mount);
  exec.refresh();
  return { dom, document, env, exec, mount, toast, scheduleReload };
}
type Harness = ReturnType<typeof mainHarness>;

function change(h: Harness, selector: string, value: string): void {
  const select = h.mount.querySelector<HTMLSelectElement>(selector);
  expect(select, `Main must render ${selector}`).not.toBeNull();
  select!.value = value;
  select!.dispatchEvent(new h.dom.window.Event('change', { bubbles: true }));
}
function press(h: Harness, selector: string): void {
  const button = h.mount.querySelector<HTMLButtonElement>(selector);
  expect(button, `Main must render ${selector}`).not.toBeNull();
  expect(button!.disabled, `${selector} must be enabled`).toBe(false);
  button!.click();
}
async function settled(h: Harness): Promise<void> {
  await vi.waitFor(() => {
    if (h.env.productActionInFlight || h.mount.getAttribute('aria-busy') === 'true') throw new Error('pending');
  }, { timeout: 5_000, interval: 2 });
  for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
}
async function durable(backend: StorageBackend) {
  const saved = await readSaveV5(backend, REGISTRY, NOW);
  if (saved.kind !== 'loaded') throw new Error(`durable read was ${saved.kind}`);
  const open = readCombatOpenEncounterV1(saved.extensions);
  if (open.kind !== 'loaded') throw new Error(`open record ${open.reason}`);
  return { saved, record: open.record };
}
const headline = (h: Harness) => h.mount.querySelector('.combat-card-break-headline')?.textContent ?? null;

/* ---------------- the scenario (also re-run against each Main mutant) ---------------- */

async function commandScenario(mutations: readonly MainMutation[] = []): Promise<void> {
  let f = await freshFixture();
  let h = mainHarness(f, mutations);
  // plan: the lead + two Guardian party slots, then Command, all through the real <select>s
  change(h, '[data-combat-champion]', idOf(SEEDS[0]!));
  change(h, '[data-combat-party-slot="1"]', idOf(SEEDS[1]!));
  change(h, '[data-combat-party-slot="2"]', idOf(SEEDS[2]!));
  change(h, '[data-combat-mode]', 'command');
  press(h, '[data-combat-challenge]');
  await settled(h);

  // (1) the Challenge SEALED the fight: one revision, one receipt, the record holds the party; nothing else moved
  expect(await f.repository.revision(), 'the Command challenge must seal exactly one receipt').toBe(1);
  let d = await durable(f.backend);
  expect(d.record, 'the Command challenge must leave a durable open-encounter record').not.toBeNull();
  expect(d.record!.party.map((m) => (m.champion.kind === 'owned-fauna' ? m.champion.creatureId : ''))).toEqual(SEEDS.map(idOf));
  expect(d.record!.decisions).toEqual([]);
  expect(d.saved.state.stats.duels).toBe(0);
  const firstHeadline = headline(h);
  expect(firstHeadline, 'the card must show the pending Break').toMatch(/^⏸ Break — /u);
  expect(h.mount.querySelector('[data-combat-challenge]'), 'no Challenge button while a Break waits').toBeNull();

  // (2) a reload lands on the SAME Break
  await f.runtime.release();
  f = await bootRuntime(f.backend, 'reloaded');
  h = mainHarness(f, mutations);
  expect(headline(h), 'a reload must land on the same pending Break').toBe(firstHeadline);

  // (3) answer every Break with the real buttons; each non-final answer is appended durably, the final one settles
  for (let i = 0; i < ANSWERS.length; i++) {
    const before = await f.repository.revision();
    press(h, `[data-combat-break="${ANSWERS[i]}"]`);
    // a double tap lands on the now-disabled refill and is ignored
    h.mount.querySelector<HTMLButtonElement>(`[data-combat-break="${ANSWERS[i]}"]`)?.click();
    await settled(h);
    expect(await f.repository.revision(), `answer ${i + 1} must commit exactly one revision`).toBe(before + 1);
    d = await durable(f.backend);
    if (i < ANSWERS.length - 1) expect(d.record!.decisions, `answer ${i + 1} must be appended durably`).toEqual(ANSWERS.slice(0, i + 1));
  }
  // (4) ONE settlement consumed the record: closed, the fight counted, its fallen fighters in Recovery, nobody wounded
  expect(d.record, 'the settlement must close the open-encounter record').toBeNull();
  expect(d.saved.state.stats.duels, 'exactly one duel settles').toBe(1);
  const final = simulate(SEEDS, ANSWERS);
  if (final.status !== 'finished') throw new Error('fixture');
  expect(d.saved.state.stats.duelwins).toBe(final.outcome === 'party' ? 1 : 0);
  const ownership = readArc5OwnershipMigration(d.saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error('ownership');
  const decisive = final.legs[final.legs.length - 1]!.fighterIndex;
  const committedClock = readF4Authority(d.saved.extensions);
  if (committedClock.kind !== 'loaded') throw new Error('clock');
  expect(final.fighters.some((x) => x.index !== decisive && x.fought), 'the fixture must have a fighter who left the stage').toBe(true);
  for (const fighter of final.fighters) {
    const row = ownership.state.creatures.find((c) => c.creatureId === idOf(SEEDS[fighter.index]!))!;
    expect(row.hurt, 'no wound from a Command fight (§20)').toBe(0);
    if (fighter.index !== decisive && fighter.fought) {
      expect(row.assignment, 'a fighter who left the stage enters Recovery').toEqual({ kind: 'recovery', readyAtActivePlayMs: committedClock.authority.activePlayMs + COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 });
    }
    if (!fighter.fought) expect(row.assignment).toBeNull();
  }
  expect(h.scheduleReload).not.toHaveBeenCalled();
  await f.runtime.release();
}

describe('§20 Command Breaks through the shipped card and Main (browser-free outcome)', () => {
  it('Challenge seals, a reload lands on the same Break, each real Break press is durable, and one settlement closes the fight', async () => {
    expect(ANSWERS.length).toBeGreaterThanOrEqual(2);
    await commandScenario();
  });

  it('the fight in Auto (the default) opens no record and settles in one press', async () => {
    const f = await freshFixture();
    const h = mainHarness(f);
    change(h, '[data-combat-champion]', idOf(SEEDS[0]!));
    change(h, '[data-combat-party-slot="1"]', idOf(SEEDS[1]!));
    change(h, '[data-combat-party-slot="2"]', idOf(SEEDS[2]!));
    press(h, '[data-combat-challenge]');
    await settled(h);
    const d = await durable(f.backend);
    expect(d.record).toBeNull();
    expect(d.saved.state.stats.duels).toBe(1);
    expect(await f.repository.revision()).toBe(1);
    await f.runtime.release();
  });

  for (const mutation of [
    { name: 'the Command settlement drops its answers', needle: '      ...(command === null ? {} : { command }),\n', replacement: '' },
    { name: 'the mode switch is ignored', needle: '      currentArc6Plan.mode = request.mode;\n', replacement: '' },
    { name: 'the final answer is appended instead of settling', needle: '    } else if (arc6CommandAnswerFinishesV1(view.record, request.decision)) {', replacement: '    } else if (false) {' },
  ] as const) {
    it(`negative control: ${mutation.name} → the scenario fails`, async () => {
      await expect(commandScenario([mutation])).rejects.toThrow();
    });
  }
});
