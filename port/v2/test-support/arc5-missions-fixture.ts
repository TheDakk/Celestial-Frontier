/* Shared fixture for the D13 stage 2 companion mission tests: three owned companions (the first Trusted, so Long is open), a landed
   Earth in the world identity, a v5 save on a memory backend, and a real F4 runtime per "tab". */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeGenome } from '@cf/domain-genome';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  createCatalogSpeciesV1,
  createCreatureInstanceV1,
  createInitialOwnershipStateV1,
  createLegacyDiscoveryRecordV1,
  ownershipContentId,
  type CompanionBondV1,
  type CreatureInstanceId,
  type DiscoveryRecordId,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { resolveCF1WorldAddress } from '@cf/scene';
import {
  V4_PRIMARY_KEY,
  applyV5ExtensionWrites,
  createEmptyWorldIdentityState,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
  encodeWorldIdentityExtensionWrites,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  readArc5MissionsV1,
  readArc5OwnershipMigration,
  readF4Authority,
  readSaveV5,
  recordCanonicalWorldLanding,
  type ContentRegistry,
  type SaveStateV2,
  type StorageBackend,
} from '@cf/persistence';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const MISSION_REGISTRY = JSON.parse(fs.readFileSync(path.join(here, '..', '..', 'baseline-v1.8.9', 'content-registry.json'), 'utf8')) as ContentRegistry;
export const MISSION_NOW = 1_753_900_090_000;
installCaptureHooks();
export const EARTH = (() => { const r = resolveCF1WorldAddress({ galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 133 } }); if (!r.ok) throw new Error(`earth ${r.reason}`); return r.address; })();
export const EARTH_DEPOSITS = projectWorldOpportunity(EARTH).deposits;
export const MISSION_SEEDS = [4101, 4102, 4103] as const;
export const missionCreatureId = (seed: number) => ownershipContentId('creature', `mission-${seed}`) as CreatureInstanceId;
const trusted = (): CompanionBondV1 => Object.freeze({ level: 2, preferredRole: null, worldsSurvived: 0, guardianVictories: 0, mementoIds: Object.freeze([]),
  memories: Object.freeze(Array.from({ length: 8 }, (_, i) => Object.freeze({ id: `fixture:${i}`, kind: 'fixture', worldKey: null, atActivePlayMs: 0 }))) });

export async function missionFixture(options: Readonly<{ cargo?: Array<[string, number]> }> = {}) {
  const imported = importSaveV2('{}', MISSION_REGISTRY, MISSION_NOW);
  if (!imported.ok) throw new Error(imported.reason);
  const rows = MISSION_SEEDS.map((seed, index) => {
    const identity = canonicalGenomeIdentityV1(makeGenome(seed, 'fauna', 0.5) as never);
    const discoveryId = ownershipContentId('discovery', `mission-${seed}`) as DiscoveryRecordId;
    return { seed, identity, discoveryId, creature: createCreatureInstanceV1({ creatureId: missionCreatureId(seed), speciesId: identity.speciesId, genomeIdentity: identity.genomeIdentity,
      genome: identity.genome, nickname: `Scout ${index + 1}`, origin: 'legacy', acquisitionRecordId: discoveryId,
      lineage: { kind: 'none', generation: identity.genome.gen as number }, xp: 10, hurt: 0, fed: null, brood: null, assignment: null, bond: index === 0 ? trusted() : null }) };
  });
  const source = createInitialOwnershipStateV1({
    catalogSpecies: rows.map((r) => createCatalogSpeciesV1({ identity: r.identity, alias: null, firstObservationId: r.discoveryId })),
    discoveries: rows.map((r, i) => createLegacyDiscoveryRecordV1({ recordId: r.discoveryId, speciesId: r.identity.speciesId, legacyCodexId: `s${r.seed}`,
      legacySourceIndex: i, from: 'Mission fixture', legacyLocation: null, firstForSpecies: true })),
    creatures: rows.map((r) => r.creature), specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: null,
  });
  const state: SaveStateV2 = { ...imported.state, cargo: options.cargo ?? [], codex: rows.map((r) => [`s${r.seed}`, { id: `s${r.seed}`, name: `Species ${r.seed}`, kind: 'Fauna', tier: null,
    realm: 'Wild', sapient: 0, from: 'Mission fixture', hybrid: false, g: { ...r.identity.genome, xp: 10, hurt: 0 }, where: null }]) as never };
  const f4 = prepareF4AuthorityUpdate({}, { activePlayMs: 0 }, createSessionRNG(11).state());
  const landed = recordCanonicalWorldLanding(createEmptyWorldIdentityState(), EARTH).state;
  const base = applyV5ExtensionWrites(applyV5ExtensionWrites(f4.extensions, encodeArc4Ownership(source).writes).extensions, encodeWorldIdentityExtensionWrites(landed)).extensions;
  const arc5 = prepareArc5OwnershipMigration({ extensions: base, resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER });
  if (arc5.kind !== 'prepared') throw new Error(arc5.kind);
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state, extensions: arc5.extensions }, MISSION_REGISTRY, MISSION_NOW);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  if ((await migrateStoredV4ToV5(backend, MISSION_REGISTRY, MISSION_NOW)).kind !== 'migrated') throw new Error('v5');
  await backend.apply(initial.operations);
  return { backend, state: initial.canonicalState, ownership: arc5.state, evidence: arc5.evidence, extensions: arc5.extensions, authority: f4.authority };
}
export type MissionFixture = Awaited<ReturnType<typeof missionFixture>>;

export async function missionTab(f: MissionFixture, name: string, revision = 0, extensions = f.extensions, state = f.state, authority = f.authority) {
  let monotonic = 0;
  const runtime = createF4RuntimeAuthority({ backend: f.backend, repository: createRevisionedRepository(f.backend), registry: MISSION_REGISTRY, initialRevision: revision,
    initialExtensions: extensions, initialState: state, restoredAuthority: authority, freshSessionSeed: 0, ownerId: name, token: `${name}-doc`,
    leaseTtlMs: 10_000_000, now: () => monotonic, visible: true, answerable: true });
  const lease = await runtime.heartbeat();
  return { runtime, lease, setPlay: (ms: number) => { monotonic = ms; } };
}

export async function missionDurable(backend: StorageBackend) {
  const saved = await readSaveV5(backend, MISSION_REGISTRY, MISSION_NOW);
  if (saved.kind !== 'loaded') throw new Error(saved.kind);
  const ownership = readArc5OwnershipMigration(saved.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
  if (ownership.kind !== 'loaded') throw new Error(ownership.kind);
  const clock = readF4Authority(saved.extensions);
  return { saved, ownership: ownership.state as OwnershipStateV2, missions: readArc5MissionsV1(saved.extensions),
    activePlayMs: clock.kind === 'loaded' ? clock.authority.activePlayMs : -1, revision: await createRevisionedRepository(backend).revision(),
    authority: clock.kind === 'loaded' ? clock.authority : null,
    creature: (seed: number) => (ownership.state as OwnershipStateV2).creatures.find((c) => c.creatureId === missionCreatureId(seed))!,
    mirrorXp: (seed: number) => ((saved.state.codex.find(([id]) => id === `s${seed}`)![1].g as { xp?: number }).xp ?? 0) };
}
export const cargoOf = (state: SaveStateV2, id: string) => new Map(state.cargo).get(id) ?? 0;
