/* D16 CFB EXPORT (v1.8.9 `shareCreature` / v1.6 `shareChampion`) — browser-free OUTCOME test.

   The exact shipped main.ts friendly-duel section (controller + projector + runFriendlyDuel) runs over a REAL F4 runtime and memory
   backend. Explorer 1 presses the real "Share code" button on their companion: the code appears in the read-only box and reaches the
   clipboard. Explorer 2 pastes THAT code into the real Duel input and presses Duel: one durable receipt settles a duel whose challenger
   is explorer 1's creature — same name, same combat identity (battle stats and seed). v1's codec is used verbatim (encodeCreature /
   decodeCreature); the tracked v1 source confirms the share shape. Controls: a tampered code refuses and writes nothing; a different
   companion exports a different identity; a Main mutant whose clipboard hook is gone never reports "Copied". */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER, canonicalGenomeIdentityV1, createCatalogSpeciesV1, createCreatureInstanceV1, createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1, ownershipContentId, type CreatureInstanceId, type DiscoveryRecordId,
} from '@cf/domain-acquisition';
import { battleStats, decodeCreature, planFriendlyDuelV1 } from '@cf/domain-combatcore';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  V4_PRIMARY_KEY, applyV5ExtensionWrites, createMemoryBackend, createRevisionedRepository, encodeArc4Ownership, importSaveV2, migrateStoredV4ToV5,
  prepareArc5OwnershipMigration, prepareF4AuthorityUpdate, prepareV5SaveWrite, readArc5OwnershipMigration, readSaveV5, type ContentRegistry, type SaveStateV2,
} from '@cf/persistence';
import { mirrorCompanionCodexXpV1 } from '../apps/game/src/companion-codex-mirror.js';
import { FriendlyDuelController, commitFriendlyDuelActionV1, friendlyDuelResultCopyV1, projectFriendlyDuelV1 } from '../apps/game/src/friendly-duel.js';
import { createF4RuntimeAuthority, type F4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { createProductActionCoordinator, createProductActionDiagnosticHold } from '../apps/game/src/product-action-coordinator.js';
import { readTrackedV1Source } from '../test-support/tracked-v1-source.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
const MAIN_SOURCE = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const NOW = 1_753_900_090_000;
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as { JSDOM: new (html: string) => { window: Window & typeof globalThis } };
const left = MAIN_SOURCE.indexOf('let lastFriendlyDuelOutcome: string | null = null;');
const MAIN_DUEL = MAIN_SOURCE.slice(left, MAIN_SOURCE.indexOf('/* §20 Command (Nick 2026-09-25): the Break loop.', left));

async function explorer(seed: number, nickname: string, xp: number) {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const identity = canonicalGenomeIdentityV1(makeGenome(seed, 'fauna', 0.6));
  const discoveryId = ownershipContentId('discovery', `cfb-${seed}`) as DiscoveryRecordId, creatureId = ownershipContentId('creature', `cfb-${seed}`) as CreatureInstanceId;
  const source = createInitialOwnershipStateV1({
    catalogSpecies: [createCatalogSpeciesV1({ identity, alias: null, firstObservationId: discoveryId })],
    discoveries: [createLegacyDiscoveryRecordV1({ recordId: discoveryId, speciesId: identity.speciesId, legacyCodexId: `s${seed}`, legacySourceIndex: 0,
      from: 'CFB fixture', legacyLocation: null, firstForSpecies: true })],
    creatures: [createCreatureInstanceV1({ creatureId, speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity, genome: identity.genome, nickname,
      origin: 'legacy', acquisitionRecordId: discoveryId, lineage: { kind: 'none', generation: identity.genome.gen as number }, xp, hurt: 0, fed: null, brood: null,
      assignment: null, bond: null })],
    specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
  const state: SaveStateV2 = { ...imported.state, codex: [[`s${seed}`, { id: `s${seed}`, name: `Species ${seed}`, kind: 'Fauna', tier: null, realm: 'Wild', sapient: 0,
    from: 'CFB fixture', hybrid: false, g: { ...identity.genome, xp, hurt: 0 }, where: null }]] as never };
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(3).state());
  const arc5 = prepareArc5OwnershipMigration({ extensions: applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(source).writes).extensions, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(arc5.kind);
  const backend = createMemoryBackend(), initial = prepareV5SaveWrite({ state, extensions: arc5.extensions }, REGISTRY, NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  if ((await migrateStoredV4ToV5(backend, REGISTRY, NOW)).kind !== 'migrated') throw new Error('v5');
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  let monotonic = 0;
  const runtime = createF4RuntimeAuthority({ backend, repository, registry: REGISTRY, initialRevision: 0, initialExtensions: arc5.extensions, initialState: initial.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 0, ownerId: `cfb-${seed}`, token: `cfb-${seed}`, leaseTtlMs: 10_000_000, now: () => monotonic, visible: true, answerable: true });
  if ((await runtime.heartbeat()).kind !== 'owned') throw new Error('lease');
  monotonic = 60_000;
  return { backend, repository, runtime, state: initial.canonicalState, ownership: arc5.state, evidence: arc5.evidence, seed, genome: identity.genome, creatureId };
}

function mount(e: Awaited<ReturnType<typeof explorer>>, mutations: readonly { needle: string; replacement: string }[] = []) {
  const dom = new JSDOM('<!doctype html><body><section data-friendly-duel-body></section></body>'), document = dom.window.document;
  const clipboard = vi.fn(async () => undefined);
  const row = [`s${e.seed}`, e.state.codex[0]![1]] as const;
  const env: Record<string, unknown> = {
    document, FriendlyDuelController, mirrorCompanionCodexXpV1, commitFriendlyDuelActionV1, friendlyDuelResultCopyV1, projectFriendlyDuelV1, canonicalGenomeIdentityV1, readArc5OwnershipMigration,
    SCENE_OWNERSHIP_ADDRESS_RESOLVER, navigator: { clipboard: { writeText: clipboard } },
    save: e.state, f4Runtime: e.runtime, arc5OwnershipState: e.ownership, arc5OwnershipEvidence: e.evidence, arc5OwnershipProtection: null, compendiumFixtureRows: null,
    currentCompendiumDetailRow: () => row, f4RuntimeMayMutate: (r: F4RuntimeAuthority | null) => r !== null && r.diagnostics().leaseOwned && !r.diagnostics().staleBlocked,
    activePersist: null, importWriteInFlight: false, replacementTransaction: null, replacementReloadPending: false, trainingCheckpointWriteHeld: false,
    productActionCoordinator: createProductActionCoordinator(), productActionInFlight: false, smokeProductActionHold: createProductActionDiagnosticHold(),
    settleF4Heartbeat: async () => undefined, Date: Object.freeze({ now: () => NOW }), performance: Object.freeze({ now: () => 1 }), f4LastCheckpointAt: 0,
    lastPersistenceOutcome: null, scheduleF4AuthorityConvergenceReload: vi.fn(), queueArc9ProgressionRefresh: vi.fn(), toast: vi.fn(),
  };
  const source = mutations.reduce((src, m) => { if (src.split(m.needle).length !== 2) throw new Error(`needle ${m.needle}`); return src.replace(m.needle, () => m.replacement); }, MAIN_DUEL);
  const t = transformSync('main-cfb.ts', source);
  if (t.errors.length) throw new Error(JSON.stringify(t.errors));
  const exec = new Function('env', `with (env) { ${t.code}; return { controller: friendlyDuelController, project: projectCurrentFriendlyDuel, outcome: () => lastFriendlyDuelOutcome }; }`)(env) as
    { controller: FriendlyDuelController; project: (r: unknown) => unknown; outcome: () => string | null };
  const el = document.querySelector<HTMLElement>('[data-friendly-duel-body]')!;
  exec.controller.setState(exec.project(row) as never);
  exec.controller.attach(el);
  return { dom, el, exec, clipboard };
}
async function share(m: ReturnType<typeof mount>, kind: 'plain' | 'champion' = 'plain'): Promise<string> {
  const button = m.el.querySelector<HTMLButtonElement>(`[data-friendly-duel-share="${kind}"]`);
  expect(button, `Main must render the ${kind} share button`).not.toBeNull();
  button!.click();
  await new Promise((r) => setTimeout(r, 0)); await new Promise((r) => setTimeout(r, 0));
  return m.el.querySelector<HTMLInputElement>('[data-friendly-duel-share-code]')!.value;
}
async function duelWith(m: ReturnType<typeof mount>, code: string): Promise<void> {
  const input = m.el.querySelector<HTMLInputElement>('[data-friendly-duel-code]')!;
  input.value = code; input.dispatchEvent(new m.dom.window.Event('input', { bubbles: true }));
  m.el.querySelector<HTMLButtonElement>('[data-friendly-duel-fight]')!.click();
  await vi.waitFor(() => { if (m.exec.controller.diagnostics().pending) throw new Error('pending'); }, { timeout: 5_000, interval: 2 });
}
const identity = (g: Record<string, unknown>) => ({ seed: (g.seed as number) >>> 0, stats: battleStats(g as never) });

describe('D16 CFB export: share your own creature as a CFB- code', () => {
  it('v1.8.9 parity: the tracked v1 share encodes {g, n} as CFB-, and the champion code adds the level (exhibit on decode)', () => {
    const v1 = readTrackedV1Source().script;
    expect(v1).toContain('function encodeCreature(entry, champ){');
    expect(v1).toContain("const o={g:entry.genome, n:entry.name};");
    expect(v1).toContain("return 'CFB-'+b64encUtf8(JSON.stringify(o))");
    expect(v1).toContain('if(o.x!=null){ gen.xp=clamp((+o.x)|0, 0, 6*81); out.exhibit=true; }');
  });

  it('ROUND TRIP: Share code on explorer 1 → paste into explorer 2\'s real Duel → one durable duel against the same creature', async () => {
    const one = await explorer(4_242, 'Aster', 0), two = await explorer(7_777, 'Briar', 0);
    const m1 = mount(one);
    expect(m1.el.querySelector('[data-friendly-duel-share="champion"]'), 'no champion code before it has earned XP').toBeNull();
    const code = await share(m1);
    expect(code.startsWith('CFB-')).toBe(true);
    expect(m1.clipboard).toHaveBeenCalledWith(code);
    expect(m1.el.querySelector('[data-friendly-duel-share-status]')?.textContent).toBe('Copied ✓');
    // the code IS explorer 1's creature: name + combat identity
    const decoded = decodeCreature(code)!;
    expect(decoded.name).toBe('Aster');
    expect(identity(decoded.genome as never)).toEqual(identity(one.genome as never));
    // explorer 2 pastes it into the real Duel control: one receipt, and the settled challenger is Aster
    const m2 = mount(two);
    await duelWith(m2, code);
    expect(await two.repository.revision()).toBe(1);
    const saved = await readSaveV5(two.backend, REGISTRY, NOW);
    expect(saved.kind === 'loaded' && saved.state.stats.duels).toBe(1);
    const plan = planFriendlyDuelV1({ mine: { creatureId: two.creatureId, name: 'Briar', genome: { ...two.genome, xp: 0, hurt: 0 } as never }, code });
    if ('status' in plan) throw new Error('refused');
    expect(plan.challenger.name).toBe('Aster');
    expect(identity(plan.challenger.genome as never)).toEqual(identity(one.genome as never));
    expect(m2.el.querySelector('[data-friendly-duel-status]')?.textContent).toMatch(/Aster|Briar|draw/u);
    // sharing writes nothing on explorer 1
    expect(await one.repository.revision()).toBe(0);
    await one.runtime.release(); await two.runtime.release();
  });

  it('a leveled companion also offers a CHAMPION code that arrives at its level as an exhibition challenger', async () => {
    const one = await explorer(4_242, 'Aster', 40);
    const m = mount(one);
    const code = await share(m, 'champion');
    const decoded = decodeCreature(code)!;
    expect((decoded as { exhibit?: boolean }).exhibit).toBe(true);
    expect((decoded.genome as { xp?: number }).xp).toBe(40);
    expect((decodeCreature(await share(m, 'plain'))!.genome as { xp?: number }).xp, 'the plain code travels at level 1').toBeUndefined();
    await one.runtime.release();
  });

  it('controls: a tampered code refuses and writes nothing; another companion exports another identity', async () => {
    const one = await explorer(4_242, 'Aster', 0), other = await explorer(9_001, 'Cinder', 0), two = await explorer(7_777, 'Briar', 0);
    const code = await share(mount(one)), otherCode = await share(mount(other));
    expect(identity(decodeCreature(otherCode)!.genome as never)).not.toEqual(identity(decodeCreature(code)!.genome as never));
    const m2 = mount(two);
    await duelWith(m2, code.slice(0, 10) + '!!!' + code.slice(13));
    expect(await two.repository.revision()).toBe(0);
    expect(m2.exec.outcome()).toBe('refused:code:invalid');
    await one.runtime.release(); await other.runtime.release(); await two.runtime.release();
  });

  it('mutation control: a Main whose clipboard hook is gone never reports Copied (the box still shows the code)', async () => {
    const one = await explorer(4_242, 'Aster', 0);
    const m = mount(one, [{ needle: 'copy: async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } } });', replacement: '});' }]);
    const code = await share(m);
    expect(code.startsWith('CFB-')).toBe(true);
    expect(m.clipboard).not.toHaveBeenCalled();
    expect(m.el.querySelector('[data-friendly-duel-share-status]')?.textContent).toBe('Code ready — copy it from the box.');
    await one.runtime.release();
  });
});
