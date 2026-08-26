import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  ACTIVE_PLAY_CAPTURE_CYCLE_MS,
  canonicalJson,
  capturePresentationFenceV1,
  createEmptyOwnershipStateV1,
  createLegacyProtectedOwnershipStateV1,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  type AcquisitionVerbV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { MAX_ACTIVE_PLAY_MS } from '@cf/domain-progression';
import { DOMAINS, createSessionRNG } from '@cf/domain-sessionrng';
import {
  applyV5ExtensionWrites,
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  arc4OwnershipLegacyMirrorMatches,
  createMemoryBackend,
  createRevisionedRepository,
  encodeArc4Ownership,
  importSaveV2,
  prepareArc2LootLegacyMigration,
  prepareArc5OwnershipMigration,
  prepareF4AuthorityUpdate,
  readArc4Ownership,
  readArc5OwnershipMigration,
  type ContentRegistry,
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
  commitArc4CaptureAttemptV1,
  prepareArc4AppBootstrap,
  prepareArc4CaptureDraftV1,
  publishArc4CaptureFields,
  publishArc4LegacyCompatibilityFields,
  stageArc4BootstrapLegacyProjection,
  verifyArc4CommittedCaptureV1,
  type Arc4CaptureAttemptInputV1,
  type Arc4CaptureAttemptOutcomeV1,
} from '../apps/game/src/arc4-capture-action.js';
import { composeAcquisitionSnapshotV1 } from '../apps/game/src/acquisition-snapshot.js';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { canonicalWorldRoster, type CanonicalWorldRoster } from '../apps/game/src/world-roster.js';

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

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`empty v4 fixture failed: ${imported.reason}`);
  imported.state.customNames.push(['p133', 'Earth Prime'], ['c-orphan', 'Keep Me']);
  return imported.state;
}

function addressOf(): CanonicalCF1WorldAddress {
  const resolved = resolveCF1WorldAddress({ galaxy: HOME_GALAXY, star: SOL, planet: { seed: 133 } });
  if (!resolved.ok) throw new Error(`Earth address fixture failed: ${resolved.reason}`);
  return resolved.address;
}

function captureContext(): Readonly<{
  address: CanonicalCF1WorldAddress;
  nav: unknown;
  roster: CanonicalWorldRoster;
}> {
  const address = addressOf();
  const roster = canonicalWorldRoster(address, 0);
  if (!roster.ok) throw new Error(`Earth roster fixture failed: ${roster.reason}`);
  const nav = navFromCanonicalCF1Address(address);
  if (!nav.ok) throw new Error(`Earth nav fixture failed: ${nav.reason}`);
  return Object.freeze({ address, nav: nav.state, roster: roster.roster });
}

function presentationFence(
  context: ReturnType<typeof captureContext>,
  extensions: V5Extensions,
  observedActivePlayMs = 0,
): string {
  const composed = composeAcquisitionSnapshotV1({
    nav: context.nav,
    address: context.address,
    roster: context.roster,
    ecologyEpoch: context.roster.ecologyEpoch,
    fullRosterFingerprint: context.roster.fullRosterFingerprint,
    extensions,
  });
  if (composed.kind !== 'ready') throw new Error(`capture fence was ${composed.reason}`);
  const fence = capturePresentationFenceV1(composed.snapshot, { observedActivePlayMs });
  if (fence === null) throw new Error('capture fence could not be projected');
  return fence;
}

function seedForSuccessDraw(predicate: (value: number) => boolean): number {
  for (let seed = 0; seed < 100_000; seed++) {
    if (predicate(createSessionRNG(seed).at(DOMAINS.captureSuccess, 0))) return seed;
  }
  throw new Error('capture action test could not find a bounded SessionRNG seed');
}

const HIT_SEED = seedForSuccessDraw((value) => value < 0.001);
const MISS_SEED = seedForSuccessDraw((value) => value > 0.99);

function authorityExtensions(seed: number, withContact = true): Readonly<{
  extensions: V5Extensions;
  authority: ReturnType<typeof prepareF4AuthorityUpdate>['authority'];
  ownershipV2: OwnershipStateV2;
}> {
  const arc2 = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: {
      items: withContact
        ? [['earpiece', 1], ['diplobeacon', 1], ['prismpendant', 1]] : [],
      equip: withContact ? { ears: 'earpiece', necklace: 'diplobeacon' } : {},
      equipAff: withContact ? { ears: { k: 'contact', v: 7, forId: 'earpiece' } } : {},
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
  return Object.freeze({
    authority: f4.authority,
    extensions: arc5.extensions,
    ownershipV2: arc5.state,
  });
}

async function runtimeFixture(
  seed: number,
  state = baseState(),
  failReceiptCommit = false,
  withContact = true,
  transformExtensions: (extensions: V5Extensions) => V5Extensions = (extensions) => extensions,
) {
  const initial = authorityExtensions(seed, withContact);
  const initialExtensions = transformExtensions(initial.extensions);
  const base = createMemoryBackend();
  let receiptCas = 0;
  const backend: StorageBackend = {
    ...base,
    async compareAndApply(checks, operations, clearStores) {
      if (operations.some(({ store }) => store === 'receipts')) receiptCas++;
      if (failReceiptCommit && operations.some(({ store }) => store === 'receipts')) {
        throw new Error('forced post-settlement storage failure');
      }
      return base.compareAndApply(checks, operations, clearStores);
    },
  };
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend,
    repository,
    registry: REGISTRY,
    initialRevision: 0,
    initialExtensions,
    restoredAuthority: initial.authority,
    freshSessionSeed: 0,
    ownerId: `arc4-action-${seed}`,
    token: `arc4-action-token-${seed}`,
    leaseTtlMs: 1_000,
    now: () => 0,
    visible: true,
    answerable: true,
  });
  const heartbeat = await runtime.heartbeat();
  if (heartbeat.kind !== 'owned') throw new Error(`capture runtime lease was ${heartbeat.kind}`);
  return {
    backend, repository, runtime, state,
    ownershipV2: initial.ownershipV2,
    receiptCas: () => receiptCas,
  };
}

type Arc5CaptureProtectionVariant =
  | 'base-absent' | 'base-corrupt' | 'base-future' | 'base-source-drift';

function withArc5CaptureProtection(
  extensions: V5Extensions,
  variant: Arc5CaptureProtectionVariant,
): V5Extensions {
  const copy = structuredClone(extensions) as Record<
    string,
    Record<string, { version: number; json: string }>
  >;
  const namespace = ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace;
  const carrier = copy.player?.[namespace];
  if (carrier === undefined) throw new Error('Arc 5 capture fixture manifest disappeared');
  if (variant === 'base-absent') {
    for (const target of ARC5_OWNERSHIP_EXTENSION_TARGETS) {
      delete copy[target.segment]?.[target.namespace];
    }
  } else if (variant === 'base-corrupt') {
    copy.player![namespace] = { version: carrier.version, json: '{}' };
  } else if (variant === 'base-future') {
    copy.player![namespace] = { version: carrier.version + 1, json: carrier.json };
  } else {
    const manifest = JSON.parse(carrier.json) as Record<string, unknown>;
    manifest.sourceDigest = `${manifest.sourceDigest}` === '0'.repeat(64)
      ? 'f'.repeat(64) : '0'.repeat(64);
    copy.player![namespace] = {
      version: carrier.version,
      json: JSON.stringify(manifest),
    };
  }
  return copy as unknown as V5Extensions;
}

function nextCaptureValues(state: ReturnType<typeof createSessionRNG>['state'] extends () => infer S
  ? S : never): readonly number[] {
  const rng = createSessionRNG(state.seed, state.draws, state.ordinal);
  return Object.freeze([
    rng.at(DOMAINS.captureCandidate, state.draws[DOMAINS.captureCandidate] ?? 0),
    rng.at(DOMAINS.captureSuccess, state.draws[DOMAINS.captureSuccess] ?? 0),
  ]);
}

function committed(
  value: Arc4CaptureAttemptOutcomeV1,
): Extract<Arc4CaptureAttemptOutcomeV1, { kind: 'committed' }> {
  if (value.kind !== 'committed') throw new Error(`capture outcome was ${value.kind}`);
  return value;
}

describe('Arc 4 headless durable capture action', () => {
  it('stages the exact ecology epoch without mutating the caller', () => {
    const state = baseState();
    state.EPOCH_BASE = 77;
    const { roster } = captureContext();
    const staged = prepareArc4CaptureDraftV1(state, roster);
    expect(staged).not.toBe(state);
    expect(staged.EPOCH_BASE).toBe(roster.ecologyEpoch);
    expect(state.EPOCH_BASE).toBe(77);
  });

  it('commits and independently verifies Tame, Scavenge, Sample, and a miss', async () => {
    const context = captureContext();
    const cases: readonly Readonly<{ verb: AcquisitionVerbV1; seed: number; hit: boolean }>[] = [
      { verb: 'tame', seed: HIT_SEED, hit: true },
      { verb: 'scavenge', seed: HIT_SEED, hit: true },
      { verb: 'sample', seed: HIT_SEED, hit: true },
      { verb: 'tame', seed: MISS_SEED, hit: false },
    ];
    for (const row of cases) {
      const fixture = await runtimeFixture(row.seed);
      const beforeArc5Carriers = ARC5_OWNERSHIP_EXTENSION_TARGETS.map((target) => (
        structuredClone(fixture.runtime.extensions[target.segment]?.[target.namespace])
      ));
      const outcome = committed(await commitArc4CaptureAttemptV1({
        runtime: fixture.runtime,
        ownershipV2: fixture.ownershipV2,
        state: fixture.state,
        ...context,
        presentationFence: presentationFence(context, fixture.runtime.extensions),
        verb: row.verb,
        codecNow: NOW,
      }));
      expect(outcome).toMatchObject({
        durability: 'committed', convergence: 'none',
        settlement: { plan: { verb: row.verb, hit: row.hit, spent: 1 } },
      });
      expect(outcome.transaction.receipt).toMatchObject({
        ordinal: 0, kind: 'capture-attempt', witness: outcome.settlement.plan.witness,
      });
      expect(outcome.transaction.plan.draws.map(({ domain }) => domain)).toEqual([
        DOMAINS.captureCandidate, DOMAINS.captureSuccess,
      ]);
      expect(outcome.transaction.state.EPOCH_BASE).toBe(context.roster.ecologyEpoch);
      expect(outcome.settlement.derivation.extensionWrites).toHaveLength(
        ARC4_OWNERSHIP_EXTENSION_TARGETS.length + ARC5_OWNERSHIP_EXTENSION_TARGETS.length,
      );
      expect((outcome.settlement.derivation.extensionWrites ?? []).map(({ segment, namespace }) => ({
        segment, namespace,
      }))).toEqual([
        ...ARC4_OWNERSHIP_EXTENSION_TARGETS,
        ...ARC5_OWNERSHIP_EXTENSION_TARGETS,
      ]);
      expect(fixture.receiptCas()).toBe(1);
      expect(await fixture.repository.readReceipt(0)).toEqual(outcome.transaction.receipt);
      const verified = verifyArc4CommittedCaptureV1({
        runtimeExtensions: fixture.runtime.extensions,
        committed: outcome,
      });
      expect(verified).toMatchObject({
        kind: 'verified', durability: 'committed', convergence: 'none',
        plan: { verb: row.verb, hit: row.hit },
      });
      const loaded = readArc4Ownership(
        fixture.runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      expect(loaded.kind).toBe('loaded');
      if (loaded.kind === 'loaded') {
        expect(loaded.state.biosphereProgress[0]).toMatchObject({ used: 1 });
        expect(arc4OwnershipLegacyMirrorMatches(loaded.state, outcome.transaction.state)).toBe(true);
      }
      const loadedArc5 = readArc5OwnershipMigration(
        fixture.runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      expect(loadedArc5.kind).toBe('loaded');
      expect(fixture.runtime.extensions.player?.[
        ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
      ]).not.toEqual(beforeArc5Carriers[0]);
      if (loadedArc5.kind === 'loaded' && verified.kind === 'verified') {
        expect(loadedArc5.evidence.representationVersion)
          .toBe(ARC5_OWNERSHIP_MIGRATION_VERSION);
        expect(verified.ownershipV2Evidence).toEqual(loadedArc5.evidence);
        expect(ownershipStateDigestV2(loadedArc5.state))
          .toBe(outcome.settlement.ownershipV2Digest);
        expect(verified.ownershipV2).toEqual(loadedArc5.state);
      }
      await fixture.runtime.release();
    }
  }, 20_000);

  it('captures input once, ignores after-call mutation, and never invokes input accessors', async () => {
    const context = captureContext();
    const fixture = await runtimeFixture(HIT_SEED);
    const originalEssence = fixture.state.essence;
    const input: Arc4CaptureAttemptInputV1 = {
      runtime: fixture.runtime,
      ownershipV2: fixture.ownershipV2,
      state: fixture.state,
      ...context,
      presentationFence: presentationFence(context, fixture.runtime.extensions),
      verb: 'tame',
      codecNow: NOW,
    };
    const pending = commitArc4CaptureAttemptV1(input);
    fixture.state.essence += 777;
    fixture.state.stats.essenceEarned = 777;
    Object.assign(input as unknown as Record<string, unknown>, {
      nav: null, address: null,
      presentationFence: `cpf1:${'0'.repeat(64)}`,
      verb: 'sample', codecNow: -1,
    });
    const outcome = committed(await pending);
    expect(outcome.preflight.verb).toBe('tame');
    expect(outcome.sourceDraft.essence).toBe(originalEssence);
    expect(outcome.sourceDraft.stats.essenceEarned).not.toBe(777);
    expect(verifyArc4CommittedCaptureV1({
      runtimeExtensions: fixture.runtime.extensions,
      committed: outcome,
    }).kind).toBe('verified');

    let getterReads = 0;
    const hostile = { ...input } as Record<string, unknown>;
    Object.defineProperty(hostile, 'state', {
      enumerable: true,
      get() { getterReads++; return fixture.state; },
    });
    await expect(commitArc4CaptureAttemptV1(hostile as unknown as Arc4CaptureAttemptInputV1))
      .resolves.toEqual({
        kind: 'refused', durability: 'none', convergence: 'none',
        detail: 'input:invalid-or-unregistered', transaction: null,
      });
    expect(getterReads).toBe(0);
  }, 20_000);

  it('refuses invalid live snapshot authority before values, receipt, or CAS', async () => {
    const context = captureContext();
    const fixture = await runtimeFixture(HIT_SEED);
    const beforeRng = fixture.runtime.sessionRng;
    const outcome = await commitArc4CaptureAttemptV1({
      runtime: fixture.runtime,
      ownershipV2: fixture.ownershipV2,
      state: fixture.state,
      nav: null,
      address: context.address,
      roster: context.roster,
      presentationFence: presentationFence(context, fixture.runtime.extensions),
      verb: 'tame',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'snapshot:surface-nav-required',
      transaction: { kind: 'pre-draw-refused', reason: 'snapshot:surface-nav-required' },
    });
    expect(fixture.runtime.sessionRng).toEqual(beforeRng);
    expect(fixture.receiptCas()).toBe(0);
    expect(await fixture.repository.readReceipt(0)).toBeUndefined();
  });

  it('refuses every protected Arc 5 base before values, ordinal, draws, receipt CAS, or publication', async () => {
    const context = captureContext();
    const variants = Object.freeze([
      'base-absent',
      'base-corrupt',
      'base-future',
      'base-source-drift',
    ] as const);
    for (const variant of variants) {
      const fixture = await runtimeFixture(
        HIT_SEED,
        baseState(),
        false,
        true,
        (extensions) => withArc5CaptureProtection(extensions, variant),
      );
      const beforeRng = fixture.runtime.sessionRng;
      const beforeValues = nextCaptureValues(beforeRng);
      const beforeDiagnostics = fixture.runtime.diagnostics();
      const beforeRevision = fixture.runtime.revision;
      const beforeExtensions = structuredClone(fixture.runtime.extensions);
      const beforeState = structuredClone(fixture.state);
      const beforeArc4 = readArc4Ownership(
        fixture.runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      const beforeArc5 = readArc5OwnershipMigration(
        fixture.runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );

      const outcome = await commitArc4CaptureAttemptV1({
        runtime: fixture.runtime,
        ownershipV2: fixture.ownershipV2,
        state: fixture.state,
        ...context,
        presentationFence: presentationFence(context, fixture.runtime.extensions),
        verb: 'tame',
        codecNow: NOW,
      });

      expect(outcome, variant).toEqual({
        kind: 'refused',
        durability: 'none',
        convergence: 'none',
        detail: `capacity:arc5-migration:${variant}`,
        transaction: {
          kind: 'pre-draw-refused',
          reason: `capacity:arc5-migration:${variant}`,
        },
      });
      expect(Reflect.ownKeys(outcome).sort(), variant).toEqual([
        'convergence', 'detail', 'durability', 'kind', 'transaction',
      ]);
      expect(fixture.runtime.sessionRng, variant).toEqual(beforeRng);
      expect(fixture.runtime.sessionRng.ordinal, variant).toBe(beforeRng.ordinal);
      expect(fixture.runtime.sessionRng.draws, variant).toEqual(beforeRng.draws);
      expect(nextCaptureValues(fixture.runtime.sessionRng), variant).toEqual(beforeValues);
      expect(fixture.runtime.diagnostics(), variant).toMatchObject({
        sessionOrdinal: beforeDiagnostics.sessionOrdinal,
        sessionDraws: beforeDiagnostics.sessionDraws,
        commits: beforeDiagnostics.commits,
      });
      expect(fixture.runtime.revision, variant).toBe(beforeRevision);
      expect(fixture.runtime.extensions, variant).toEqual(beforeExtensions);
      expect(fixture.state, variant).toEqual(beforeState);
      expect(readArc4Ownership(
        fixture.runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ), variant).toEqual(beforeArc4);
      expect(readArc5OwnershipMigration(
        fixture.runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      ), variant).toEqual(beforeArc5);
      expect(fixture.receiptCas(), variant).toBe(0);
      expect(await fixture.repository.readReceipt(beforeRng.ordinal), variant).toBeUndefined();
      expect('evidence' in outcome, variant).toBe(false);
      expect('settlement' in outcome, variant).toBe(false);
      await fixture.runtime.release();
    }
  }, 20_000);

  it('refuses stale gear, ecology, and cycle presentation semantics before values or CAS', async () => {
    const context = captureContext();
    const noContactFixture = await runtimeFixture(HIT_SEED, baseState(), false, false);
    const noContactFence = presentationFence(context, noContactFixture.runtime.extensions);
    await noContactFixture.runtime.release();

    const nextRosterResult = canonicalWorldRoster(context.address, 1);
    if (!nextRosterResult.ok) throw new Error(`next-epoch roster was ${nextRosterResult.reason}`);
    const nextContext = Object.freeze({
      address: context.address,
      nav: context.nav,
      roster: nextRosterResult.roster,
    });

    const probes: readonly Readonly<{
      label: string;
      fence: (extensions: V5Extensions) => string;
    }>[] = [
      { label: 'gear', fence: () => noContactFence },
      {
        label: 'ecology',
        fence: (extensions) => presentationFence(nextContext, extensions),
      },
      {
        label: 'cycle',
        fence: (extensions) => presentationFence(
          context,
          extensions,
          ACTIVE_PLAY_CAPTURE_CYCLE_MS,
        ),
      },
    ];
    for (const probe of probes) {
      const fixture = await runtimeFixture(HIT_SEED);
      const beforeRng = fixture.runtime.sessionRng;
      const outcome = await commitArc4CaptureAttemptV1({
        runtime: fixture.runtime,
        ownershipV2: fixture.ownershipV2,
        state: fixture.state,
        ...context,
        presentationFence: probe.fence(fixture.runtime.extensions),
        verb: 'tame',
        codecNow: NOW,
      });
      expect(outcome, probe.label).toMatchObject({
        kind: 'refused', durability: 'none', convergence: 'none',
        detail: 'presentation:changed',
        transaction: { kind: 'pre-draw-refused', reason: 'presentation:changed' },
      });
      expect(fixture.runtime.sessionRng, probe.label).toEqual(beforeRng);
      expect(fixture.receiptCas(), probe.label).toBe(0);
      expect(await fixture.repository.readReceipt(0), probe.label).toBeUndefined();
      await fixture.runtime.release();
    }
  }, 20_000);

  it('does not expose or register evidence when storage fails after settlement', async () => {
    const context = captureContext();
    const fixture = await runtimeFixture(HIT_SEED, baseState(), true);
    const beforeArc5 = readArc5OwnershipMigration(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    const outcome = await commitArc4CaptureAttemptV1({
      runtime: fixture.runtime,
      ownershipV2: fixture.ownershipV2,
      state: fixture.state,
      ...context,
      presentationFence: presentationFence(context, fixture.runtime.extensions),
      verb: 'tame',
      codecNow: NOW,
    });
    expect(outcome).toMatchObject({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: 'forced post-settlement storage failure',
      transaction: { kind: 'storage-error' },
    });
    expect(Reflect.ownKeys(outcome).sort()).toEqual([
      'convergence', 'detail', 'durability', 'kind', 'transaction',
    ]);
    expect('evidence' in outcome).toBe(false);
    expect(fixture.receiptCas()).toBe(1);
    expect(await fixture.repository.readReceipt(0)).toBeUndefined();
    expect(readArc5OwnershipMigration(
      fixture.runtime.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    )).toEqual(beforeArc5);
    await fixture.runtime.release();
  });

  it('negative-controls prepared, runtime, domain, receipt, witness, and F4 invariants', async () => {
    const context = captureContext();
    const fixture = await runtimeFixture(HIT_SEED);
    const outcome = committed(await commitArc4CaptureAttemptV1({
      runtime: fixture.runtime,
      ownershipV2: fixture.ownershipV2,
      state: fixture.state,
      ...context,
      presentationFence: presentationFence(context, fixture.runtime.extensions),
      verb: 'tame',
      codecNow: NOW,
    }));
    const check = (candidate: typeof outcome, runtimeExtensions = fixture.runtime.extensions) => (
      verifyArc4CommittedCaptureV1({ runtimeExtensions, committed: candidate })
    );
    expect(check(outcome)).toMatchObject({
      kind: 'verified', durability: 'committed', convergence: 'none',
    });
    const withCommittedState = (
      mutate: (state: SaveStateV2) => void,
    ): typeof outcome => {
      const state = structuredClone(outcome.transaction.state);
      mutate(state);
      const prepared = { ...outcome.transaction.saved, canonicalState: state };
      return {
        ...outcome,
        transaction: { ...outcome.transaction, state, saved: prepared },
        settlement: {
          ...outcome.settlement,
          derivation: { ...outcome.settlement.derivation, state },
          prepared,
        },
      } as typeof outcome;
    };
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        plan: {
          ...outcome.transaction.plan,
          draws: [{ ...outcome.transaction.plan.draws[0]!, domain: 'wrong' }, outcome.transaction.plan.draws[1]!],
        },
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-domain-order-mismatch' });
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        plan: {
          ...outcome.transaction.plan,
          draws: [
            { ...outcome.transaction.plan.draws[0]!, value: -1 },
            outcome.transaction.plan.draws[1]!,
          ],
        },
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-draw-values-mismatch' });
    const changedCandidateDraw = outcome.settlement.plan.candidateDraw < 0.5
      ? outcome.settlement.plan.candidateDraw + 0.25
      : outcome.settlement.plan.candidateDraw - 0.25;
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        plan: {
          ...outcome.transaction.plan,
          draws: [
            { ...outcome.transaction.plan.draws[0]!, value: changedCandidateDraw },
            outcome.transaction.plan.draws[1]!,
          ],
        },
      },
      settlement: {
        ...outcome.settlement,
        plan: { ...outcome.settlement.plan, candidateDraw: changedCandidateDraw },
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-f4-plan-authority-mismatch' });
    const changedSuccessDraw = outcome.settlement.plan.hit
      ? outcome.settlement.plan.chance / 2
      : (1 + outcome.settlement.plan.chance) / 2;
    expect(changedSuccessDraw).not.toBe(outcome.settlement.plan.successDraw);
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        plan: {
          ...outcome.transaction.plan,
          draws: [
            outcome.transaction.plan.draws[0]!,
            { ...outcome.transaction.plan.draws[1]!, value: changedSuccessDraw },
          ],
        },
      },
      settlement: {
        ...outcome.settlement,
        plan: { ...outcome.settlement.plan, successDraw: changedSuccessDraw },
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-f4-plan-authority-mismatch' });
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, receipt: { ...outcome.transaction.receipt, ordinal: 9 } },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-receipt-ordinal-mismatch' });
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, receipt: { ...outcome.transaction.receipt, kind: 'wrong' } },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-receipt-kind-mismatch' });
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, receipt: { ...outcome.transaction.receipt, witness: 'wrong' } },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-receipt-witness-mismatch' });
    expect(check({
      ...outcome,
      settlement: {
        ...outcome.settlement,
        prepared: { ...outcome.settlement.prepared, legacyV4Raw: '{}' },
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-prepared-save-mismatch' });
    const changedOperationPrepared = {
      ...outcome.transaction.saved,
      operations: outcome.transaction.saved.operations.map((operation, index) => (
        index === 0 ? { ...operation, value: `${operation.value} ` } : operation
      )),
    };
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, saved: changedOperationPrepared },
      settlement: { ...outcome.settlement, prepared: changedOperationPrepared },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-prepared-save-mismatch' });
    const changedLegacyRaw = `${outcome.transaction.saved.legacyV4Raw} `;
    const changedLegacyPrepared = {
      ...outcome.transaction.saved,
      legacyV4Raw: changedLegacyRaw,
      operations: outcome.transaction.saved.operations.map((operation, index) => (
        index === 5 ? { ...operation, value: changedLegacyRaw } : operation
      )),
    };
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, saved: changedLegacyPrepared },
      settlement: { ...outcome.settlement, prepared: changedLegacyPrepared },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-prepared-save-mismatch' });
    const incompletePrepared = {
      ...outcome.transaction.saved,
      operations: outcome.transaction.saved.operations.slice(0, 5),
    };
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, saved: incompletePrepared },
      settlement: { ...outcome.settlement, prepared: incompletePrepared },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-complete-save-inventory-mismatch' });
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        state: { ...outcome.transaction.state, essence: outcome.transaction.state.essence + 1 },
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-committed-state-mismatch' });
    expect(check({
      ...outcome,
      settlement: {
        ...outcome.settlement,
        plan: { ...outcome.settlement.plan, snapshotFingerprint: 'wrong' },
      },
    } as typeof outcome)).toMatchObject({ detail: 'capture-plan-authority-mismatch' });
    expect(check({
      ...outcome,
      sourceDraft: { ...outcome.sourceDraft, EPOCH_BASE: outcome.sourceDraft.EPOCH_BASE + 1 },
    })).toMatchObject({ detail: 'ecology-epoch-mismatch' });
    expect(check(outcome, {})).toMatchObject({ detail: 'runtime-extensions-mismatch' });
    const emptyCarrierPrepared = { ...outcome.transaction.saved, extensions: {} };
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, saved: emptyCarrierPrepared },
      settlement: { ...outcome.settlement, prepared: emptyCarrierPrepared },
    } as typeof outcome, {})).toMatchObject({ detail: 'ownership-carrier-not-current' });
    for (const target of ARC5_OWNERSHIP_EXTENSION_TARGETS) {
      const missing = structuredClone(outcome.transaction.saved.extensions) as unknown as Record<
        string, Record<string, { version: number; json: string }>
      >;
      delete missing[target.segment]?.[target.namespace];
      const missingExtensions = missing as unknown as V5Extensions;
      const missingPrepared = {
        ...outcome.transaction.saved,
        extensions: missingExtensions,
      };
      expect(check({
        ...outcome,
        transaction: { ...outcome.transaction, saved: missingPrepared },
        settlement: { ...outcome.settlement, prepared: missingPrepared },
      } as typeof outcome, missingExtensions), `missing ${target.namespace}`).toMatchObject({
        detail: 'arc5-migration-not-current',
      });

      const corrupted = structuredClone(outcome.transaction.saved.extensions) as unknown as Record<
        string, Record<string, { version: number; json: string }>
      >;
      corrupted[target.segment]![target.namespace] = {
        version: ARC5_OWNERSHIP_MIGRATION_VERSION,
        json: '{}',
      };
      const corruptExtensions = corrupted as unknown as V5Extensions;
      const corruptPrepared = {
        ...outcome.transaction.saved,
        extensions: corruptExtensions,
      };
      expect(check({
        ...outcome,
        transaction: { ...outcome.transaction, saved: corruptPrepared },
        settlement: { ...outcome.settlement, prepared: corruptPrepared },
      } as typeof outcome, corruptExtensions), `corrupt ${target.namespace}`).toMatchObject({
        detail: 'arc5-migration-not-current',
      });
    }

    const currentArc5 = readArc5OwnershipMigration(
      outcome.transaction.saved.extensions,
      SCENE_OWNERSHIP_ADDRESS_RESOLVER,
    );
    if (currentArc5.kind !== 'loaded') throw new Error('committed Arc 5 fixture disappeared');
    const sourceV1 = ownershipSourceStateV1(currentArc5.state);
    const retainedLegacy = structuredClone(outcome.transaction.saved.extensions) as unknown as Record<
      string, Record<string, { version: number; json: string }>
    >;
    for (const target of ARC5_OWNERSHIP_EXTENSION_TARGETS) {
      delete retainedLegacy[target.segment]?.[target.namespace];
    }
    (retainedLegacy.player ??= {})[
      ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET.namespace
    ] = {
      version: 1,
      json: canonicalJson({
        schema: 'cf-v2-ownership-v1-to-v2/v1',
        version: 1,
        sourceSchema: sourceV1.schema,
        sourceVersion: sourceV1.version,
        sourceRevision: sourceV1.revision,
        sourceMode: sourceV1.mode,
        sourceDigest: ownershipStateDigestV1(sourceV1),
        targetSchema: currentArc5.state.schema,
        targetVersion: currentArc5.state.version,
        targetRevision: currentArc5.state.revision,
        targetMode: currentArc5.state.mode,
        targetDigest: ownershipStateDigestV2(currentArc5.state),
      }),
    };
    const retainedLegacyExtensions = retainedLegacy as unknown as V5Extensions;
    const retainedLegacyPrepared = {
      ...outcome.transaction.saved,
      extensions: retainedLegacyExtensions,
    };
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction, saved: retainedLegacyPrepared },
      settlement: { ...outcome.settlement, prepared: retainedLegacyPrepared },
    } as typeof outcome, retainedLegacyExtensions)).toMatchObject({
      detail: 'arc5-migration-not-current',
    });
    expect(check({
      ...outcome,
      settlement: {
        ...outcome.settlement,
        plan: { ...outcome.settlement.plan, successor: createEmptyOwnershipStateV1() },
      },
    } as typeof outcome)).toMatchObject({ detail: 'ownership-successor-mismatch' });
    expect(check(withCommittedState((state) => {
      state.codex = [];
      state.bioX = [];
    }))).toMatchObject({ detail: 'ownership-legacy-mirror-mismatch' });
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        authority: { ...outcome.transaction.authority, activePlayMs: MAX_ACTIVE_PLAY_MS + 1 },
      },
    } as typeof outcome)).toMatchObject({ detail: 'f4-authority-mismatch' });
    expect(check({
      ...outcome,
      settlement: {
        ...outcome.settlement,
        stardustReward: outcome.settlement.stardustReward + 1,
      },
    })).toMatchObject({ detail: 'stardust-reward-mismatch' });
    expect(check(withCommittedState((state) => {
      state.essence += 1;
    }))).toMatchObject({ detail: 'stardust-balance-mismatch' });
    expect(check(withCommittedState((state) => {
      state.stats.essenceEarned = (state.stats.essenceEarned ?? 0) + 1;
    }))).toMatchObject({ detail: 'stardust-earned-mismatch' });
    expect(check({
      ...outcome,
      transaction: { ...outcome.transaction },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-commit-authority-mismatch' });
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        revision: outcome.transaction.revision + 1,
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-commit-authority-mismatch' });
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        kind: 'rejected',
      } as unknown as typeof outcome.transaction,
    } as typeof outcome)).toMatchObject({ detail: 'transaction-commit-authority-mismatch' });
    expect(check({
      ...outcome,
      evidence: { ...outcome.evidence },
    } as typeof outcome)).toMatchObject({ detail: 'capture-evidence-unregistered' });
    expect(check({
      ...outcome,
      transaction: {
        ...outcome.transaction,
        plan: { ...outcome.transaction.plan },
      },
    } as typeof outcome)).toMatchObject({ detail: 'transaction-f4-plan-authority-mismatch' });
    expect(check({
      ...outcome,
      preflight: { ...outcome.preflight },
    } as typeof outcome)).toMatchObject({ detail: 'capture-plan-authority-mismatch' });
    expect(check({
      ...outcome,
      settlement: {
        ...outcome.settlement,
        plan: { ...outcome.settlement.plan },
      },
    } as typeof outcome)).toMatchObject({ detail: 'capture-plan-authority-mismatch' });
    expect(check({
      ...outcome,
      settlement: { ...outcome.settlement },
    } as typeof outcome)).toMatchObject({ detail: 'capture-settlement-authority-mismatch' });
    expect(check({
      ...outcome,
      sourceDraft: structuredClone(outcome.sourceDraft),
    } as typeof outcome)).toMatchObject({ detail: 'capture-settlement-authority-mismatch' });

    const otherFixture = await runtimeFixture(HIT_SEED);
    const otherOutcome = committed(await commitArc4CaptureAttemptV1({
      runtime: otherFixture.runtime,
      ownershipV2: otherFixture.ownershipV2,
      state: otherFixture.state,
      ...context,
      presentationFence: presentationFence(context, otherFixture.runtime.extensions),
      verb: 'tame',
      codecNow: NOW,
    }));
    expect(check({
      ...outcome,
      evidence: otherOutcome.evidence,
    })).toMatchObject({ detail: 'transaction-f4-plan-authority-mismatch' });
    await otherFixture.runtime.release();
  }, 20_000);
});

describe('Arc 4 bootstrap staging and targeted publication', () => {
  it('prepares an absent carrier, reaches the shared v4 fixed point, and preserves unrelated names', () => {
    const source = baseState();
    const before = structuredClone(source);
    const prepared = prepareArc4AppBootstrap({ extensions: {}, save: source });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    const staged = stageArc4BootstrapLegacyProjection({
      source,
      state: prepared.state,
      registry: REGISTRY,
      codecNow: NOW,
    });
    expect(staged.kind).toBe('staged');
    if (staged.kind !== 'staged') return;
    expect(source).toEqual(before);
    expect(staged.candidate.customNames).toContainEqual(['p133', 'Earth Prime']);
    expect(staged.candidate.customNames).toContainEqual(['c-orphan', 'Keep Me']);
    expect(arc4OwnershipLegacyMirrorMatches(prepared.state, staged.candidate)).toBe(true);

    const target = baseState();
    const outer = target;
    const atlas = target.logMap;
    publishArc4LegacyCompatibilityFields(target, staged.candidate);
    expect(target).toBe(outer);
    expect(target.logMap).toBe(atlas);
    expect(target.customNames).toContainEqual(['p133', 'Earth Prime']);
    expect(target.customNames).toContainEqual(['c-orphan', 'Keep Me']);
    publishArc4CaptureFields(target, { ...staged.candidate, essence: 7 });
    expect(target.essence).toBe(7);
  });

  it('keeps a legacy-protected carrier reward-free and byte-detached', () => {
    const source = baseState();
    const protectedState = createLegacyProtectedOwnershipStateV1({
      schema: 'cf-v1.8.9-ownership-source/v1',
      digest: '0'.repeat(64),
      jsonBytes: 2,
      codexRows: 0,
      uniqueSpecies: 0,
      bioXRows: 0,
      scoutCodexId: null,
    });
    const staged = stageArc4BootstrapLegacyProjection({
      source,
      state: protectedState,
      registry: REGISTRY,
      codecNow: NOW,
    });
    expect(staged).toMatchObject({ kind: 'staged', projection: null, changed: false });
    if (staged.kind !== 'staged') return;
    expect(staged.candidate).not.toBe(source);
    expect(staged.candidate).toEqual(source);
  });
});
