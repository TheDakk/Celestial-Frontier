import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ACTIVE_PLAY_CAPTURE_CYCLE_MS,
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  createEmptyOwnershipStateV1,
  migrateOwnershipStateV1ToV2,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  preflightCaptureV1,
  sha256Hex,
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  DOMAINS,
  createSessionRNG,
} from '@cf/domain-sessionrng';
import {
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
  applyV5ExtensionWrites,
  createF4MultiOutcomePreDrawTransactionOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  encodeArc4Ownership,
  exportSaveV2,
  importSaveV2,
  planF4MultiOutcomeDraws,
  prepareArc2LootLegacyMigration,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  projectF4MultiOutcomeDrawAdvance,
  readArc4Ownership,
  readArc5OwnershipMigration,
  readF4Authority,
  type ContentRegistry,
  type F4MultiOutcomePreDrawDeriveInput,
  type F4MultiOutcomePreDrawInput,
  type F4MultiOutcomePreDrawSaveCodec,
  type F4MultiOutcomePreDrawSettlementAuthorizer,
  type SaveStateV2,
  type StorageBackend,
  type V5Extensions,
} from '@cf/persistence';
import {
  navFromCanonicalCF1Address,
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  composeAcquisitionSnapshotV1,
} from '../apps/game/src/acquisition-snapshot.js';
import {
  ARC4_CAPTURE_DOMAINS,
  certifyArc4CaptureCapacityV1,
  isArc4CaptureCapacityCertificateV1,
  isArc4CaptureDerivedSettlementV1,
  settleCertifiedArc4CaptureV1,
  type Arc4CaptureCapacityCertificateV1,
} from '../apps/game/src/arc4-capture-capacity.js';
import { canonicalWorldRoster } from '../apps/game/src/world-roster.js';

beforeAll(() => installCaptureHooks());

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(baseline, 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;
const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL = Object.freeze({ seed: 424242, x: 560, y: 170 });

function saveCodec(
  registry: ContentRegistry = REGISTRY,
  now = NOW,
  receiptKind = 'capture-attempt',
): F4MultiOutcomePreDrawSaveCodec {
  return Object.freeze({
    now,
    receiptKind,
    prepare: (writable: Parameters<F4MultiOutcomePreDrawSaveCodec['prepare']>[0]) => (
      prepareV5SaveWrite(writable, registry, now)
    ),
    importLegacy: (raw: string) => importSaveV2(raw, registry, now),
    exportLegacy: (state: SaveStateV2) => exportSaveV2(state, now),
  });
}

const CAPTURE_CODEC = saveCodec();
const TEST_SETTLEMENT_AUTHORIZER: F4MultiOutcomePreDrawSettlementAuthorizer = Object.freeze({
  authorize(
    derivation: Parameters<F4MultiOutcomePreDrawSettlementAuthorizer['authorize']>[0],
    prepared: Parameters<F4MultiOutcomePreDrawSettlementAuthorizer['authorize']>[1],
  ) {
    return Object.freeze({ kind: 'authorized-settlement' as const, derivation, prepared });
  },
});

function completeSaveDigest(prepared: ReturnType<typeof prepareV5SaveWrite>): string {
  return sha256Hex(JSON.stringify({
    extensions: prepared.extensions,
    operations: prepared.operations,
  }));
}

function addressOf(): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({ galaxy: HOME_GALAXY, star: SOL, planet: { seed: 133 } });
  if (!resolved.ok) throw new Error(`Earth address fixture failed: ${resolved.reason}`);
  return resolved.address;
}

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`empty v4 fixture failed: ${imported.reason}`);
  imported.state.customNames.push(['p133', 'Earth Prime'], ['c-orphan', 'Keep Me']);
  return imported.state;
}

function authorityExtensions(seed: number): V5Extensions {
  const arc2 = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: [['earpiece', 1], ['diplobeacon', 1], ['prismpendant', 1]],
      equip: { ears: 'earpiece', necklace: 'diplobeacon' },
      equipAff: { ears: { k: 'contact', v: 7, forId: 'earpiece' } },
    },
    capacity: 6,
  });
  if (arc2.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${arc2.kind}`);
  const f4 = prepareF4AuthorityUpdate(
    arc2.extensions,
    { activePlayMs: 0 },
    createSessionRNG(seed).state(),
  );
  const arc4 = applyV5ExtensionWrites(
    f4.extensions,
    encodeArc4Ownership(createEmptyOwnershipStateV1()).writes,
  ).extensions;
  const arc5 = prepareArc5OwnershipMigration({
    extensions: arc4,
    resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  });
  if (arc5.kind !== 'prepared') throw new Error(`Arc 5 fixture was ${arc5.kind}`);
  return arc5.extensions;
}

function seedForSuccessDraw(predicate: (value: number) => boolean): number {
  for (let seed = 0; seed < 100_000; seed++) {
    if (predicate(createSessionRNG(seed).at(DOMAINS.captureSuccess, 0))) return seed;
  }
  throw new Error('capacity test could not find a bounded SessionRNG seed');
}

const HIT_SEED = seedForSuccessDraw((value) => value < 0.001);
const MISS_SEED = seedForSuccessDraw((value) => value > 0.99);

function readyPreflight(extensions: V5Extensions) {
  const address = addressOf();
  const rosterResult = canonicalWorldRoster(address, 0);
  if (!rosterResult.ok) throw new Error(`Earth roster fixture failed: ${rosterResult.reason}`);
  const nav = navFromCanonicalCF1Address(address);
  if (!nav.ok) throw new Error(`Earth nav fixture failed: ${nav.reason}`);
  const composed = composeAcquisitionSnapshotV1({
    nav: nav.state,
    address,
    roster: rosterResult.roster,
    ecologyEpoch: rosterResult.roster.ecologyEpoch,
    fullRosterFingerprint: rosterResult.roster.fullRosterFingerprint,
    extensions,
  });
  if (composed.kind !== 'ready') throw new Error(`snapshot fixture was ${composed.reason}`);
  const preflight = preflightCaptureV1(composed.snapshot, 'tame');
  if (preflight.kind !== 'ready') throw new Error(`preflight fixture was ${preflight.reason}`);
  return preflight;
}

function valueFreeInput(
  state: SaveStateV2,
  extensions: V5Extensions,
  activePlayMs = 123,
  codec: F4MultiOutcomePreDrawSaveCodec = CAPTURE_CODEC,
): F4MultiOutcomePreDrawInput {
  const projected = projectF4MultiOutcomeDrawAdvance(extensions, ARC4_CAPTURE_DOMAINS);
  if (projected.kind !== 'projected') throw new Error(`projection fixture was ${projected.reason}`);
  return Object.freeze({
    domains: projected.plan.domains,
    counters: projected.plan.counters,
    receiptOrdinal: projected.plan.receiptOrdinal,
    activePlayMs,
    currentAuthority: projected.plan.currentAuthority,
    nextSessionRng: projected.plan.nextSessionRng,
    codec,
    draft: state,
    extensions,
  });
}

function evaluatedInput(
  proof: Arc4CaptureCapacityCertificateV1,
  state: SaveStateV2,
  extensions: V5Extensions,
  activePlayMs = 123,
  codec: F4MultiOutcomePreDrawSaveCodec = CAPTURE_CODEC,
): F4MultiOutcomePreDrawDeriveInput<Arc4CaptureCapacityCertificateV1> {
  const planned = planF4MultiOutcomeDraws(extensions, ARC4_CAPTURE_DOMAINS);
  if (planned.kind !== 'planned') throw new Error(`value plan fixture was ${planned.reason}`);
  return Object.freeze({
    plan: planned.plan,
    draws: planned.plan.draws,
    receiptOrdinal: planned.plan.receiptOrdinal,
    activePlayMs,
    currentAuthority: planned.plan.currentAuthority,
    nextSessionRng: planned.plan.nextSessionRng,
    codec,
    proof,
    draft: state,
    extensions,
  });
}

async function settleThroughGenuineOwner(
  preflight: ReturnType<typeof readyPreflight>,
  state: SaveStateV2,
  extensions: V5Extensions,
  activePlayMs = 123,
): Promise<Extract<ReturnType<typeof settleCertifiedArc4CaptureV1>, { kind: 'derived' }>> {
  const backend = createMemoryBackend();
  const lease = createTabLeaseClient(backend, {
    ownerId: 'arc4-genuine-settlement',
    token: 'arc4-genuine-settlement-session',
    ttlMs: 1_000,
    now: () => 0,
  });
  const acquired = await lease.acquire();
  if (acquired.kind !== 'acquired') throw new Error(`genuine settlement lease was ${acquired.kind}`);
  const owner = createF4MultiOutcomePreDrawTransactionOwner(
    createRevisionedRepository(backend),
    REGISTRY,
  );
  const settlements: ReturnType<typeof settleCertifiedArc4CaptureV1>[] = [];
  const outcome = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
    expectedRevision: 0,
    grant: acquired.grant,
    writable: { state, extensions },
    snapshot: { activePlayMs },
    domains: ARC4_CAPTURE_DOMAINS,
    receiptKind: 'capture-attempt',
    now: NOW,
    preDraw: (input, authorizer) => {
      const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw: input });
      if (certified.kind !== 'certified') {
        return { kind: 'refused' as const, reason: certified.reason };
      }
      return authorizer.ready(certified.certificate, (draw, settlementAuthorizer) => {
        const settled = settleCertifiedArc4CaptureV1({
          preflight,
          draw,
          authorizer: settlementAuthorizer,
        });
        settlements.push(settled);
        if (settled.kind !== 'derived') throw new Error(`genuine settlement was ${settled.reason}`);
        return settled.authorization;
      });
    },
  });
  if (outcome.kind !== 'committed') throw new Error(`genuine settlement commit was ${outcome.kind}`);
  const settled = settlements[0];
  if (settled?.kind !== 'derived') throw new Error('genuine settlement result disappeared');
  return settled;
}

describe('Arc 4 registered all-scenario capture capacity certificate', () => {
  it('certifies miss plus every hit, selects the real plan, and prepares the exact complete save', async () => {
    const state = baseState();
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const preDraw = valueFreeInput(state, extensions);
    const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw });
    expect(certified.kind).toBe('certified');
    if (certified.kind !== 'certified') return;
    const { certificate } = certified;
    expect(isArc4CaptureCapacityCertificateV1(certificate)).toBe(true);
    expect(isArc4CaptureCapacityCertificateV1({ ...certificate })).toBe(false);
    expect(Object.isFrozen(certificate)).toBe(true);
    expect(certificate.receiptKind).toBe('capture-attempt');
    expect(certificate.candidateOrder).toEqual(
      preflight.pool.map((candidate) => candidate.identity.speciesId),
    );
    expect(certificate.scenarios).toHaveLength(preflight.pool.length + 1);
    expect(certificate.scenarios[0]).toMatchObject({
      kind: 'miss', candidateSpeciesId: null, sourceOrdinal: null,
      firstForSpecies: false, tier: null, stardustReward: 0,
    });
    expect(certificate.scenarios.slice(1).map((row) => row.candidateSpeciesId))
      .toEqual(certificate.candidateOrder);
    expect(certificate.scenarios.every((row) => (
      /^[0-9a-f]{64}$/u.test(row.successorDigest)
        && /^[0-9a-f]{64}$/u.test(row.ownershipV2Digest)
        && /^[0-9a-f]{64}$/u.test(row.ownershipWritesDigest)
        && /^[0-9a-f]{64}$/u.test(row.arc5MigrationWritesDigest)
        && /^[0-9a-f]{64}$/u.test(row.legacyV4Digest)
        && /^[0-9a-f]{64}$/u.test(row.completeSaveDigest)
    ))).toBe(true);
    expect(JSON.stringify(certificate)).not.toMatch(/candidateDraw|successDraw|"value"/u);

    const settled = await settleThroughGenuineOwner(preflight, state, extensions);
    expect(isArc4CaptureDerivedSettlementV1(settled)).toBe(true);
    expect(isArc4CaptureDerivedSettlementV1({ ...settled })).toBe(false);
    expect(settled.plan.hit).toBe(true);
    expect(settled.derivation.extensionWrites).toHaveLength(
      ARC4_OWNERSHIP_EXTENSION_TARGETS.length + 1,
    );
    expect(settled.derivation.extensionWrites?.map(({ segment, namespace }) => ({ segment, namespace })))
      .toEqual([
        ...ARC4_OWNERSHIP_EXTENSION_TARGETS,
        ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
      ]);
    expect(settled.stardustReward).toBe(
      settled.plan.firstForSpecies && settled.plan.tier >= 5 ? settled.plan.tier - 3 : 0,
    );
    expect(settled.derivation.state.essence).toBe(state.essence + settled.stardustReward);
    expect(settled.derivation.state.stats.essenceEarned)
      .toBe((state.stats.essenceEarned ?? 0) + settled.stardustReward);
    expect(settled.derivation.state.customNames).toContainEqual(['p133', 'Earth Prime']);
    expect(settled.derivation.state.customNames).toContainEqual(['c-orphan', 'Keep Me']);

    const product = applyV5ExtensionWrites(extensions, settled.derivation.extensionWrites ?? []);
    const f4 = prepareF4AuthorityUpdate(
      product.extensions,
      { activePlayMs: preDraw.activePlayMs },
      preDraw.nextSessionRng,
    );
    const prepared = prepareV5SaveWrite(
      { state: settled.derivation.state, extensions: f4.extensions },
      REGISTRY,
      NOW,
    );
    expect(prepared.operations.map(({ store, key }) => [store, key])).toEqual([
      ['player', 'v5:player'],
      ['creatures', 'v5:creatures'],
      ['catalog', 'v5:catalog'],
      ['inventory', 'v5:inventory'],
      ['settings', 'v5:settings'],
      ['meta', 'save'],
    ]);
    expect(completeSaveDigest(settled.prepared)).toBe(completeSaveDigest(prepared));
    const ownership = readArc4Ownership(prepared.extensions, SCENE_OWNERSHIP_ADDRESS_RESOLVER);
    expect(ownership.kind).toBe('loaded');
    if (ownership.kind === 'loaded') {
      expect(ownershipStateDigestV1(ownership.state))
        .toBe(ownershipStateDigestV1(settled.plan.successor));
    }
    const arc5 = readArc5OwnershipMigration(
      prepared.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(arc5.kind).toBe('loaded');
    expect(prepared.extensions.player?.[
      ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
    ]).not.toEqual(extensions.player?.[
      ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
    ]);
    if (arc5.kind === 'loaded') {
      expect(ownershipStateDigestV2(arc5.state)).toBe(settled.ownershipV2Digest);
      expect(ownershipStateDigestV2(arc5.state)).toBe(
        ownershipStateDigestV2(migrateOwnershipStateV1ToV2(settled.plan.successor)),
      );
    }
    expect(readF4Authority(prepared.extensions)).toEqual({
      kind: 'loaded',
      authority: { activePlayMs: preDraw.activePlayMs, sessionRng: preDraw.nextSessionRng },
    });
    const imported = importSaveV2(prepared.legacyV4Raw, REGISTRY, NOW);
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.state.codex).toEqual(prepared.canonicalState.codex);
      expect(imported.state.bioX).toEqual(prepared.canonicalState.bioX);
      expect(imported.state.scoutId).toBe(prepared.canonicalState.scoutId);
      expect(imported.state.essence).toBe(prepared.canonicalState.essence);
    }
  }, 20_000);

  it('joins the real pre-draw owner and publishes the selected certified save in one CAS', async () => {
    const state = baseState();
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const initial = prepareV5SaveWrite({ state, extensions }, REGISTRY, NOW);
    const base = createMemoryBackend();
    await base.apply(initial.operations);
    let receiptCas = 0;
    const backend: StorageBackend = {
      ...base,
      async compareAndApply(checks, operations, clearStores) {
        if (operations.some(({ store }) => store === 'receipts')) receiptCas++;
        return base.compareAndApply(checks, operations, clearStores);
      },
    };
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc4-capacity-test',
      token: 'arc4-capacity-session',
      ttlMs: 1_000,
      now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`capacity lease was ${acquired.kind}`);
    const owner = createF4MultiOutcomePreDrawTransactionOwner(
      createRevisionedRepository(backend),
      REGISTRY,
    );
    const trace: string[] = [];
    let selectedDigest: string | null = null;
    let selectedCompleteSaveDigest: string | null = null;
    const outcome = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state, extensions },
      snapshot: { activePlayMs: 123 },
      domains: ARC4_CAPTURE_DOMAINS,
      receiptKind: 'capture-attempt',
      now: NOW,
      preDraw: (input, authorizer) => {
        trace.push('capacity');
        const certified = certifyArc4CaptureCapacityV1({
          preflight, preDraw: input,
        });
        return certified.kind === 'certified'
          ? authorizer.ready(certified.certificate, (draw, settlementAuthorizer) => {
            trace.push('derive');
            const settled = settleCertifiedArc4CaptureV1({
              preflight, draw, authorizer: settlementAuthorizer,
            });
            if (settled.kind !== 'derived') {
              throw new Error(`certified capacity settlement was ${settled.reason}`);
            }
            selectedDigest = ownershipStateDigestV1(settled.plan.successor);
            const selectedRow = certified.certificate.scenarios.find((row) => (
              settled.plan.hit
                ? row.kind === 'hit'
                  && row.candidateSpeciesId === settled.plan.candidate?.identity.speciesId
                  && row.sourceOrdinal === settled.plan.candidate?.sourceOrdinal
                : row.kind === 'miss'
            ));
            if (selectedRow === undefined) throw new Error('selected certificate row disappeared');
            selectedCompleteSaveDigest = selectedRow.completeSaveDigest;
            expect(completeSaveDigest(settled.prepared)).toBe(selectedCompleteSaveDigest);
            return settled.authorization;
          })
          : { kind: 'refused' as const, reason: certified.reason };
      },
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(trace).toEqual(['capacity', 'derive']);
    expect(receiptCas).toBe(1);
    expect(completeSaveDigest(outcome.saved)).toBe(selectedCompleteSaveDigest);
    expect(outcome.saved.operations.map(({ store, key }) => [store, key])).toEqual([
      ['player', 'v5:player'],
      ['creatures', 'v5:creatures'],
      ['catalog', 'v5:catalog'],
      ['inventory', 'v5:inventory'],
      ['settings', 'v5:settings'],
      ['meta', 'save'],
    ]);
    const reloaded = readArc4Ownership(
      outcome.saved.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind === 'loaded') {
      expect(ownershipStateDigestV1(reloaded.state)).toBe(selectedDigest);
    }
    const reloadedArc5 = readArc5OwnershipMigration(
      outcome.saved.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(reloadedArc5.kind).toBe('loaded');
    if (reloadedArc5.kind === 'loaded') {
      expect(outcome.saved.extensions.player?.[
        ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
      ]).toBeDefined();
    }
    expect(await createRevisionedRepository(backend).readReceipt(0)).toEqual(outcome.receipt);
  }, 20_000);

  it('rejects substituted registry/time codecs and a non-capture receipt kind before CAS', async () => {
    const state = baseState();
    expect(REGISTRY.materials).toContain('Ag');
    state.cargo.push(['Ag', 5]);
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const restrictedRegistry = structuredClone(REGISTRY);
    restrictedRegistry.materials = restrictedRegistry.materials.filter((id) => id !== 'Ag');
    const backend = createMemoryBackend();
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc4-codec-context', token: 'arc4-codec-context-session',
      ttlMs: 1_000, now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`codec-context lease was ${acquired.kind}`);
    let mutationCalls = 0;
    const repository = createRevisionedRepository(backend);
    const owner = createF4MultiOutcomePreDrawTransactionOwner({
      async mutate(input) {
        mutationCalls++;
        return repository.mutate(input);
      },
    }, restrictedRegistry);
    let settlementCalls = 0;
    const substituted = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state, extensions },
      snapshot: { activePlayMs: 123 },
      domains: ARC4_CAPTURE_DOMAINS,
      receiptKind: 'capture-attempt',
      now: NOW + 86_400_000,
      preDraw: (input, authorizer) => {
        const certified = certifyArc4CaptureCapacityV1({
          preflight,
          preDraw: { ...input, codec: saveCodec(REGISTRY, NOW) },
        });
        if (certified.kind !== 'certified') {
          return { kind: 'refused' as const, reason: certified.reason };
        }
        return authorizer.ready(certified.certificate, (draw, settlementAuthorizer) => {
          settlementCalls++;
          const settled = settleCertifiedArc4CaptureV1({
            preflight, draw, authorizer: settlementAuthorizer,
          });
          if (settled.kind !== 'derived') throw new Error(settled.reason);
          return settled.authorization;
        });
      },
    });
    expect(substituted).toMatchObject({
      kind: 'rejected', stage: 'derive', message: 'certificate-input-mismatch',
    });
    expect(settlementCalls).toBe(1);

    let wrongKindSettlementCalls = 0;
    const wrongKind = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state, extensions },
      snapshot: { activePlayMs: 123 },
      domains: ARC4_CAPTURE_DOMAINS,
      receiptKind: 'not-a-capture',
      now: NOW,
      preDraw: (input, authorizer) => {
        const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw: input });
        if (certified.kind !== 'certified') {
          return { kind: 'refused' as const, reason: certified.reason };
        }
        return authorizer.ready(certified.certificate, () => {
          wrongKindSettlementCalls++;
          throw new Error('wrong receipt kind settlement must not run');
        });
      },
    });
    expect(wrongKind).toEqual({ kind: 'pre-draw-refused', reason: 'input-invalid' });
    expect(wrongKindSettlementCalls).toBe(0);
    expect(mutationCalls).toBe(0);
    expect(await repository.readReceipt(0)).toBeUndefined();
  }, 20_000);

  it('uses one frozen registry snapshot across certification and the final prepared save', async () => {
    const state = baseState();
    state.cargo.push(['Ag', 5]);
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const mutableRegistry = structuredClone(REGISTRY);
    const backend = createMemoryBackend();
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc4-registry-snapshot', token: 'arc4-registry-snapshot-session',
      ttlMs: 1_000, now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`registry-snapshot lease was ${acquired.kind}`);
    const owner = createF4MultiOutcomePreDrawTransactionOwner(
      createRevisionedRepository(backend),
      mutableRegistry,
    );
    /* A later owner of the caller's registry reference cannot change either
       half of this commit's compatibility codec. */
    mutableRegistry.materials = mutableRegistry.materials.filter((id) => id !== 'Ag');
    const outcome = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state, extensions },
      snapshot: { activePlayMs: 123 },
      domains: ARC4_CAPTURE_DOMAINS,
      receiptKind: 'capture-attempt',
      now: NOW,
      preDraw: (input, authorizer) => {
        const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw: input });
        if (certified.kind !== 'certified') {
          return { kind: 'refused' as const, reason: certified.reason };
        }
        return authorizer.ready(certified.certificate, (draw, settlementAuthorizer) => {
          const settled = settleCertifiedArc4CaptureV1({
            preflight, draw, authorizer: settlementAuthorizer,
          });
          if (settled.kind !== 'derived') throw new Error(settled.reason);
          return settled.authorization;
        });
      },
    });
    expect(outcome.kind).toBe('committed');
    if (outcome.kind !== 'committed') return;
    expect(outcome.saved.canonicalState.cargo).toContainEqual(['Ag', 5]);
    expect(JSON.parse(outcome.saved.legacyV4Raw)).toMatchObject({ cargo: [['Ag', 5]] });
  }, 20_000);

  it('rejects cloned or second-authorized results after a genuine certified settlement', async () => {
    const state = baseState();
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const backend = createMemoryBackend();
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc4-settlement-brand', token: 'arc4-settlement-brand-session',
      ttlMs: 1_000, now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`settlement-brand lease was ${acquired.kind}`);
    let mutationCalls = 0;
    const repository = createRevisionedRepository(backend);
    const owner = createF4MultiOutcomePreDrawTransactionOwner({
      async mutate(input) {
        mutationCalls++;
        return repository.mutate(input);
      },
    }, REGISTRY);
    const attempt = (attack: 'clone' | 'second') => (
      owner.commit<Arc4CaptureCapacityCertificateV1, string>({
        expectedRevision: 0,
        grant: acquired.grant,
        writable: { state, extensions },
        snapshot: { activePlayMs: 123 },
        domains: ARC4_CAPTURE_DOMAINS,
        receiptKind: 'capture-attempt',
        now: NOW,
        preDraw: (input, authorizer) => {
          const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw: input });
          if (certified.kind !== 'certified') {
            return { kind: 'refused' as const, reason: certified.reason };
          }
          return authorizer.ready(certified.certificate, (draw, settlementAuthorizer) => {
            const settled = settleCertifiedArc4CaptureV1({
              preflight, draw, authorizer: settlementAuthorizer,
            });
            if (settled.kind !== 'derived') throw new Error(settled.reason);
            if (attack === 'clone') return { ...settled.authorization };
            const f4 = prepareF4AuthorityUpdate(
              draw.extensions,
              { activePlayMs: draw.activePlayMs },
              draw.nextSessionRng,
            );
            return settlementAuthorizer.authorize(
              { state: draw.draft, witness: 'uncertified-no-op' },
              draw.codec.prepare({ state: draw.draft, extensions: f4.extensions }),
            );
          });
        },
      })
    );
    await expect(attempt('clone')).resolves.toMatchObject({ kind: 'rejected', stage: 'derive' });
    await expect(attempt('second')).resolves.toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect(mutationCalls).toBe(0);
    expect(await repository.readReceipt(0)).toBeUndefined();
  }, 20_000);

  it('refuses a structural settlement substitute before it can expose prepared data or change a witness', async () => {
    const state = baseState();
    const extensions = authorityExtensions(HIT_SEED);
    const beforeAuthority = readF4Authority(extensions);
    const preflight = readyPreflight(extensions);
    const backend = createMemoryBackend();
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc4-settlement-substitute',
      token: 'arc4-settlement-substitute-session',
      ttlMs: 1_000,
      now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`settlement substitute lease was ${acquired.kind}`);
    let mutationCalls = 0;
    const repository = createRevisionedRepository(backend);
    const owner = createF4MultiOutcomePreDrawTransactionOwner({
      async mutate(input) {
        mutationCalls++;
        return repository.mutate(input);
      },
    }, REGISTRY);
    let substituteCalls = 0;
    let exposedPrepared: Parameters<
      F4MultiOutcomePreDrawSettlementAuthorizer['authorize']
    >[1] | undefined;
    const substituteResults: ReturnType<typeof settleCertifiedArc4CaptureV1>[] = [];
    const outcome = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state, extensions },
      snapshot: { activePlayMs: 123 },
      domains: ARC4_CAPTURE_DOMAINS,
      receiptKind: 'capture-attempt',
      now: NOW,
      preDraw: (input, authorizer) => {
        const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw: input });
        if (certified.kind !== 'certified') {
          return { kind: 'refused' as const, reason: certified.reason };
        }
        return authorizer.ready(certified.certificate, (draw, settlementAuthorizer) => {
          const substitute = Object.freeze({
            authorize(
              derivation: Parameters<
                F4MultiOutcomePreDrawSettlementAuthorizer['authorize']
              >[0],
              prepared: Parameters<
                F4MultiOutcomePreDrawSettlementAuthorizer['authorize']
              >[1],
            ) {
              substituteCalls++;
              exposedPrepared = prepared;
              return Object.freeze({
                kind: 'authorized-settlement' as const,
                derivation,
                prepared,
              });
            },
          });
          const settled = settleCertifiedArc4CaptureV1({
            preflight,
            draw,
            authorizer: substitute,
          });
          substituteResults.push(settled);
          /* This branch is the former exploit. If the substitute receives the
             private prepared row, the genuine capability can pair it with a
             changed receipt witness and the test must observe an illegal CAS. */
          if (settled.kind === 'derived' && exposedPrepared !== undefined) {
            return settlementAuthorizer.authorize(
              { ...settled.derivation, witness: 'substituted-receipt-witness' },
              exposedPrepared,
            );
          }
          return settled as never;
        });
      },
    });
    expect(outcome).toMatchObject({ kind: 'rejected', stage: 'derive' });
    expect(substituteResults).toEqual([{
      kind: 'refused', reason: 'certificate-input-mismatch',
    }]);
    expect(substituteCalls).toBe(0);
    expect(exposedPrepared).toBeUndefined();
    expect(mutationCalls).toBe(0);
    expect(await repository.revision()).toBe(0);
    expect(await repository.readReceipt(0)).toBeUndefined();
    expect(readF4Authority(extensions)).toEqual(beforeAuthority);
  }, 20_000);

  it('returns a real capacity refusal with zero value derivation, receipt, or CAS', async () => {
    const state = baseState();
    state.bioX.push([999, [1, 0]]);
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const backend = createMemoryBackend();
    const lease = createTabLeaseClient(backend, {
      ownerId: 'arc4-capacity-refusal',
      token: 'arc4-capacity-refusal-session',
      ttlMs: 1_000,
      now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`capacity refusal lease was ${acquired.kind}`);
    const repository = createRevisionedRepository(backend);
    let mutationCalls = 0;
    let deriveCalls = 0;
    const owner = createF4MultiOutcomePreDrawTransactionOwner({
      async mutate(input) {
        mutationCalls++;
        return repository.mutate(input);
      },
    }, REGISTRY);
    const beforeAuthority = readF4Authority(extensions);
    const outcome = await owner.commit<Arc4CaptureCapacityCertificateV1, string>({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state, extensions },
      snapshot: { activePlayMs: 123 },
      domains: ARC4_CAPTURE_DOMAINS,
      receiptKind: 'capture-attempt',
      now: NOW,
      preDraw: (input, authorizer) => {
        const certified = certifyArc4CaptureCapacityV1({
          preflight, preDraw: input,
        });
        return certified.kind === 'certified'
          ? authorizer.ready(certified.certificate, (_draw, settlementAuthorizer) => {
            deriveCalls++;
            return settlementAuthorizer.authorize(
              { state, witness: 'must-not-run' },
              input.codec.prepare({ state, extensions }),
            );
          })
          : { kind: 'refused' as const, reason: certified.reason };
      },
    });
    expect(outcome).toEqual({ kind: 'pre-draw-refused', reason: 'v4-round-trip-failed' });
    expect(deriveCalls).toBe(0);
    expect(mutationCalls).toBe(0);
    expect(await repository.readReceipt(0)).toBeUndefined();
    expect(readF4Authority(extensions)).toEqual(beforeAuthority);
  }, 20_000);

  it('selects the certified miss without catalogue, ownership, or Stardust', async () => {
    const state = baseState();
    const extensions = authorityExtensions(MISS_SEED);
    const preflight = readyPreflight(extensions);
    const preDraw = valueFreeInput(state, extensions);
    const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw });
    if (certified.kind !== 'certified') throw new Error(`miss certificate was ${certified.reason}`);
    const settled = await settleThroughGenuineOwner(preflight, state, extensions);
    expect(settled.plan.hit).toBe(false);
    expect(settled.plan.firstForSpecies).toBe(false);
    expect(settled.stardustReward).toBe(0);
    expect(settled.derivation.state.codex).toEqual(state.codex);
    expect(settled.derivation.state.essence).toBe(state.essence);
    expect(settled.derivation.state.stats.essenceEarned).toBe(state.stats.essenceEarned);
    const productExtensions = applyV5ExtensionWrites(
      extensions,
      settled.derivation.extensionWrites ?? [],
    ).extensions;
    const ownership = readArc4Ownership(
      productExtensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(ownership.kind).toBe('loaded');
    if (ownership.kind === 'loaded') {
      expect(ownership.state).toMatchObject({
        catalogSpecies: [], discoveries: [], creatures: [], specimenLots: [],
        biosphereProgress: [{ used: 1, successful: [] }],
      });
    }
    const arc5 = readArc5OwnershipMigration(
      productExtensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    expect(arc5.kind).toBe('loaded');
    expect(productExtensions.player?.[
      ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
    ]).not.toEqual(extensions.player?.[
      ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
    ]);
    if (arc5.kind === 'loaded') {
      expect(ownershipStateDigestV2(arc5.state)).toBe(settled.ownershipV2Digest);
    }
  }, 20_000);

  it('refuses absent, corrupt, future, and source-drifted Arc 5 authority before draws', () => {
    const state = baseState();
    const aligned = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(aligned);
    const namespace = ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace;
    const carrier = aligned.player?.[namespace];
    if (carrier === undefined) throw new Error('Arc 5 fixture certificate disappeared');

    const absent = structuredClone(aligned) as Record<string, Record<string, unknown>>;
    delete absent.player?.[namespace];

    const corrupt = structuredClone(aligned) as Record<
      string,
      Record<string, { version: number; json: string }>
    >;
    corrupt.player![namespace] = { version: carrier.version, json: '{}' };

    const future = structuredClone(aligned) as Record<
      string,
      Record<string, { version: number; json: string }>
    >;
    future.player![namespace] = { version: carrier.version + 1, json: carrier.json };

    const drift = structuredClone(aligned) as Record<
      string,
      Record<string, { version: number; json: string }>
    >;
    const driftedCertificate = JSON.parse(carrier.json) as Record<string, unknown>;
    driftedCertificate.sourceDigest = `${driftedCertificate.sourceDigest}` === '0'.repeat(64)
      ? 'f'.repeat(64) : '0'.repeat(64);
    drift.player![namespace] = {
      version: carrier.version,
      json: JSON.stringify(driftedCertificate),
    };

    const controls = Object.freeze([
      ['base-absent', absent],
      ['base-corrupt', corrupt],
      ['base-future', future],
      ['base-source-drift', drift],
    ] as const);
    for (const [reason, extensions] of controls) {
      const before = structuredClone(extensions);
      expect(certifyArc4CaptureCapacityV1({
        preflight,
        preDraw: valueFreeInput(state, extensions as unknown as V5Extensions),
      }), reason).toEqual({
        kind: 'refused',
        reason: `arc5-migration:${reason}`,
        scenario: { kind: 'miss', candidateSpeciesId: null, sourceOrdinal: null },
      });
      expect(extensions, reason).toEqual(before);
    }
  }, 20_000);

  it('rejects certificate clones, cross-snapshot reuse, changed drafts, plan clones, accessors, and proxies', () => {
    const state = baseState();
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const preDraw = valueFreeInput(state, extensions);
    const certified = certifyArc4CaptureCapacityV1({ preflight, preDraw });
    if (certified.kind !== 'certified') throw new Error(`control certificate was ${certified.reason}`);
    const realDraw = evaluatedInput(certified.certificate, state, extensions);
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: { ...preDraw, domains: [...ARC4_CAPTURE_DOMAINS].reverse() },
    })).toEqual({ kind: 'refused', reason: 'domain-order-mismatch' });
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: { ...preDraw, receiptOrdinal: preDraw.receiptOrdinal + 1 },
    })).toEqual({ kind: 'refused', reason: 'snapshot-authority-mismatch' });
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: { ...preDraw, activePlayMs: ACTIVE_PLAY_CAPTURE_CYCLE_MS },
    })).toEqual({ kind: 'refused', reason: 'snapshot-authority-mismatch' });
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: {
        ...preDraw,
        draft: { ...preDraw.draft, EPOCH_BASE: preflight.snapshot.ecologyEpoch + 1 },
      },
    })).toEqual({ kind: 'refused', reason: 'draft-ecology-epoch-mismatch' });
    let codecPrepareReads = 0;
    const accessorCodec = {
      now: NOW,
      receiptKind: 'capture-attempt',
      importLegacy: CAPTURE_CODEC.importLegacy,
      exportLegacy: CAPTURE_CODEC.exportLegacy,
    } as Record<string, unknown>;
    Object.defineProperty(accessorCodec, 'prepare', {
      enumerable: true,
      get() {
        codecPrepareReads++;
        return CAPTURE_CODEC.prepare;
      },
    });
    Object.freeze(accessorCodec);
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: { ...preDraw, codec: accessorCodec as unknown as typeof preDraw.codec },
    })).toEqual({ kind: 'refused', reason: 'input-invalid' });
    expect(codecPrepareReads).toBe(0);
    expect(settleCertifiedArc4CaptureV1({
      preflight,
      draw: { ...realDraw, proof: { ...certified.certificate } as Arc4CaptureCapacityCertificateV1 },
      authorizer: TEST_SETTLEMENT_AUTHORIZER,
    })).toEqual({ kind: 'refused', reason: 'certificate-unregistered' });
    const otherPreflight = readyPreflight(extensions);
    expect(otherPreflight.snapshot.fingerprint).toBe(preflight.snapshot.fingerprint);
    expect(otherPreflight).not.toBe(preflight);
    expect(settleCertifiedArc4CaptureV1({
      preflight: otherPreflight,
      draw: realDraw,
      authorizer: TEST_SETTLEMENT_AUTHORIZER,
    })).toEqual({ kind: 'refused', reason: 'preflight-mismatch' });
    const changedState = structuredClone(state);
    changedState.essence += 1;
    expect(settleCertifiedArc4CaptureV1({
      preflight,
      draw: { ...realDraw, draft: changedState },
      authorizer: TEST_SETTLEMENT_AUTHORIZER,
    })).toEqual({ kind: 'refused', reason: 'certificate-input-mismatch' });
    expect(settleCertifiedArc4CaptureV1({
      preflight,
      draw: { ...realDraw, plan: { ...realDraw.plan } as never },
      authorizer: TEST_SETTLEMENT_AUTHORIZER,
    })).toEqual({ kind: 'refused', reason: 'draw-plan-mismatch' });

    let settlementAccessorReads = 0;
    const accessorSettlement = {
      preflight, authorizer: TEST_SETTLEMENT_AUTHORIZER,
    } as Record<string, unknown>;
    Object.defineProperty(accessorSettlement, 'draw', {
      enumerable: true,
      get() {
        settlementAccessorReads++;
        return realDraw;
      },
    });
    expect(settleCertifiedArc4CaptureV1(accessorSettlement as never))
      .toEqual({ kind: 'refused', reason: 'certificate-input-mismatch' });
    expect(settlementAccessorReads).toBe(0);

    let proofAccessorReads = 0;
    const accessorDraw = { ...realDraw } as Record<string, unknown>;
    Object.defineProperty(accessorDraw, 'proof', {
      enumerable: true,
      get() {
        proofAccessorReads++;
        return certified.certificate;
      },
    });
    expect(settleCertifiedArc4CaptureV1({
      preflight,
      draw: accessorDraw as unknown as typeof realDraw,
      authorizer: TEST_SETTLEMENT_AUTHORIZER,
    })).toEqual({ kind: 'refused', reason: 'certificate-input-mismatch' });
    expect(proofAccessorReads).toBe(0);

    let authorizerAccessorReads = 0;
    const accessorAuthorizer = {} as Record<string, unknown>;
    Object.defineProperty(accessorAuthorizer, 'authorize', {
      enumerable: true,
      get() {
        authorizerAccessorReads++;
        return TEST_SETTLEMENT_AUTHORIZER.authorize;
      },
    });
    Object.freeze(accessorAuthorizer);
    expect(settleCertifiedArc4CaptureV1({
      preflight,
      draw: realDraw,
      authorizer: accessorAuthorizer as unknown as F4MultiOutcomePreDrawSettlementAuthorizer,
    })).toEqual({ kind: 'refused', reason: 'certificate-input-mismatch' });
    expect(authorizerAccessorReads).toBe(0);

    const trappingSettlement = new Proxy({
      preflight, draw: realDraw, authorizer: TEST_SETTLEMENT_AUTHORIZER,
    }, {
      ownKeys() { throw new Error('settlement proxy trap'); },
    });
    expect(settleCertifiedArc4CaptureV1(trappingSettlement))
      .toEqual({ kind: 'refused', reason: 'certificate-input-mismatch' });

    let inputAccessorReads = 0;
    const accessorInput = { preflight } as Record<string, unknown>;
    Object.defineProperty(accessorInput, 'preDraw', {
      enumerable: true,
      get() {
        inputAccessorReads++;
        return preDraw;
      },
    });
    expect(certifyArc4CaptureCapacityV1(accessorInput as never))
      .toEqual({ kind: 'refused', reason: 'input-invalid' });
    expect(inputAccessorReads).toBe(0);

    let extensionAccessorReads = 0;
    const accessorPreDraw = { ...preDraw } as Record<string, unknown>;
    Object.defineProperty(accessorPreDraw, 'extensions', {
      enumerable: true,
      get() {
        extensionAccessorReads++;
        return extensions;
      },
    });
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: accessorPreDraw as unknown as F4MultiOutcomePreDrawInput,
    })).toEqual({ kind: 'refused', reason: 'input-invalid' });
    expect(extensionAccessorReads).toBe(0);
    const trapping = new Proxy({ preflight, preDraw }, {
      ownKeys() { throw new Error('capacity proxy trap'); },
    });
    expect(certifyArc4CaptureCapacityV1(trapping))
      .toEqual({ kind: 'refused', reason: 'input-invalid' });
  }, 20_000);

  it('rejects per-segment and global namespace overflow before scenario preparation', () => {
    const state = baseState();
    const extensions = authorityExtensions(HIT_SEED);
    const preflight = readyPreflight(extensions);
    const preDraw = valueFreeInput(state, extensions);
    const carrier = Object.freeze({ version: 99, json: '{}' });

    const perSegment = structuredClone(extensions) as Record<
      string,
      Record<string, { version: number; json: string }>
    >;
    const settings = (perSegment.settings ??= {});
    for (let index = 0; index < 65; index++) {
      settings[`test.segment-bound-${index}`] = carrier;
    }
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: { ...preDraw, extensions: perSegment as unknown as V5Extensions },
    })).toEqual({ kind: 'refused', reason: 'extensions-corrupt' });

    const global = structuredClone(extensions) as Record<
      string,
      Record<string, { version: number; json: string }>
    >;
    for (const segment of ['player', 'creatures', 'catalog', 'inventory', 'settings']) {
      const namespaces = (global[segment] ??= {});
      for (let index = 0; index < 30; index++) {
        namespaces[`test.global-${segment}-${index}`] = carrier;
      }
    }
    expect(certifyArc4CaptureCapacityV1({
      preflight,
      preDraw: { ...preDraw, extensions: global as unknown as V5Extensions },
    })).toEqual({ kind: 'refused', reason: 'extensions-corrupt' });
    expect(readF4Authority(extensions)).toEqual({
      kind: 'loaded', authority: preDraw.currentAuthority,
    });
  }, 20_000);
});
