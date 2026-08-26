import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Hex } from '@cf/domain-acquisition';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  F4_AUTHORITY_NAMESPACE,
  LEGACY_XP_FIRSTS_NAMESPACE,
  V4_PRIMARY_KEY,
  V5_MAX_EXTENSION_JSON_BYTES,
  V5_MAX_EXTENSION_TOTAL_BYTES,
  canonicalizeV5Extensions,
  classifyPortableV5Save,
  createActivePlayPersistenceOwner,
  createF4DeterministicProductTransactionOwner,
  createMemoryBackend,
  createRevisionedRepository,
  createTabLeaseClient,
  exportSaveV2,
  exportPortableV5Save,
  importSaveV2,
  migrateStoredV4ToV5,
  prepareLegacyXpFirstClaim,
  prepareV5Replacement,
  prepareV5SaveWrite,
  readLegacyXpFirstsAuthority,
  readSaveV5,
  type ContentRegistry,
  type LegacyXpFirstsBindingV1,
  type SaveStateV2,
  type StorageBackend,
  type V5ExtensionCarrier,
  type V5Extensions,
} from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', '..', '..', 'baseline-v1.8.9');
const fixtures = JSON.parse(fs.readFileSync(path.join(baseline, 'save-fixtures.json'), 'utf8')) as {
  inputs: Record<string, unknown>;
};
const REGISTRY = JSON.parse(fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8')) as ContentRegistry;
const NOW = 1_753_900_060_000;
const XP_SCHEMA = 'cf-v2-legacy-xp-firsts/v1';

const xpKey = (index: number): string => `s1|taste:${index}`;
const firstFourThousand = (): string[] => Array.from({ length: 4000 }, (_, index) => xpKey(index));

function rawWithXp(
  keys: readonly string[],
  binding?: unknown,
): string {
  return JSON.stringify({
    ...(fixtures.inputs.veteran_rich as Record<string, unknown>),
    xpf: keys,
    ...(binding === undefined ? {} : { xpa: binding }),
  });
}

function imported(keys = firstFourThousand()): SaveStateV2 {
  const result = importSaveV2(rawWithXp(keys), REGISTRY, NOW);
  if (!result.ok) throw new Error(`expected import, received ${result.reason}`);
  return result.state;
}

function preparedOverflow(
  state = imported(),
  extensions: V5Extensions = {},
  key = xpKey(4000),
) {
  const result = prepareLegacyXpFirstClaim({ state, extensions, key });
  if (result.kind !== 'prepared') throw new Error(`expected prepared overflow, received ${result.kind}`);
  return result;
}

function ownedCarrier(extensions: V5Extensions): V5ExtensionCarrier {
  const carrier = extensions.inventory?.[LEGACY_XP_FIRSTS_NAMESPACE];
  if (!carrier) throw new Error('expected legacy XP overflow carrier');
  return carrier;
}

function withCarrier(extensions: V5Extensions, carrier: V5ExtensionCarrier): V5Extensions {
  return canonicalizeV5Extensions({
    ...extensions,
    inventory: {
      ...(extensions.inventory ?? {}),
      [LEGACY_XP_FIRSTS_NAMESPACE]: carrier,
    },
  });
}

function bindingFor(carrier: V5ExtensionCarrier, totalCount: number): LegacyXpFirstsBindingV1 {
  return Object.freeze({ v: 1, totalCount, carrierDigest: sha256Hex(carrier.json) });
}

function carrierWith(
  archived: readonly string[],
  window: readonly string[],
  version = 1,
): V5ExtensionCarrier {
  return Object.freeze({
    version,
    json: JSON.stringify({
      schema: XP_SCHEMA,
      version: 1,
      archived,
      windowDigest: sha256Hex(JSON.stringify(window)),
      totalCount: archived.length + window.length,
    }),
  });
}

function exactSizeOwnedCarrier(window: readonly string[]): V5ExtensionCarrier {
  const archived = Array.from(
    { length: 4000 },
    (_, index) => `legacy-${index.toString(36).padStart(4, '0')}`,
  );
  let carrier = carrierWith(archived, window);
  let remaining = V5_MAX_EXTENSION_JSON_BYTES - utf8Length(carrier.json);
  if (remaining < 0) throw new Error('base exact-size carrier exceeded its target');
  for (let index = 0; index < archived.length && remaining > 0; index++) {
    const current = archived[index]!;
    const added = Math.min(64 - current.length, remaining);
    archived[index] = `${current}${'x'.repeat(added)}`;
    remaining -= added;
  }
  if (remaining !== 0) throw new Error('exact-size carrier could not consume its byte target');
  carrier = carrierWith(archived, window);
  if (utf8Length(carrier.json) !== V5_MAX_EXTENSION_JSON_BYTES) {
    throw new Error('exact-size carrier missed its byte target');
  }
  return carrier;
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function paddingExtensions(totalJsonBytes: number): V5Extensions {
  const carriers: Record<string, V5ExtensionCarrier> = {};
  let remaining = totalJsonBytes;
  let index = 0;
  while (remaining > 0) {
    const size = Math.min(V5_MAX_EXTENSION_JSON_BYTES, remaining);
    if (size < 8) throw new Error('padding remainder cannot form a JSON record');
    carriers[`xp-capacity-${index}`] = {
      version: 1,
      json: `{"p":"${'a'.repeat(size - 8)}"}`,
    };
    remaining -= size;
    index++;
  }
  return canonicalizeV5Extensions({ settings: carriers });
}

async function migratedBackend(keys = firstFourThousand()): Promise<StorageBackend> {
  const backend = createMemoryBackend();
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: rawWithXp(keys) }]);
  const migrated = await migrateStoredV4ToV5(backend, REGISTRY, NOW);
  if (migrated.kind !== 'migrated') throw new Error(`expected migration, received ${migrated.kind}`);
  return backend;
}

describe('@cf/persistence — durable legacy xpFirsts overflow authority', () => {
  it('strictly imports and exports the optional map-shaped xpa binding', () => {
    const unbound = importSaveV2(rawWithXp([]), REGISTRY, NOW);
    expect(unbound.ok).toBe(true);
    if (!unbound.ok) return;
    expect(unbound.state.xpFirstsBinding).toBeNull();
    expect(JSON.parse(exportSaveV2(unbound.state, NOW))).not.toHaveProperty('xpa');

    const overflow = preparedOverflow();
    const exported = exportSaveV2(overflow.state, NOW);
    const envelope = JSON.parse(exported) as Record<string, unknown>;
    expect(envelope.xpf).toHaveLength(4000);
    expect(envelope.xpa).toEqual(overflow.state.xpFirstsBinding);
    const roundTrip = importSaveV2(exported, REGISTRY, NOW);
    expect(roundTrip.ok).toBe(true);
    if (roundTrip.ok) expect(roundTrip.state.xpFirstsBinding).toEqual(overflow.state.xpFirstsBinding);

    for (const binding of [
      [],
      { v: 1, totalCount: 4001, carrierDigest: '0'.repeat(64), extra: true },
      { v: 1, totalCount: 4000, carrierDigest: '0'.repeat(64) },
      { v: 1, totalCount: 4001, carrierDigest: 'NOT-A-DIGEST' },
    ]) expect(importSaveV2(rawWithXp(firstFourThousand(), binding), REGISTRY, NOW))
      .toEqual({ ok: false, reason: 'invalid' });
    expect(importSaveV2(rawWithXp(firstFourThousand(), {
      v: 2, totalCount: 4001, carrierDigest: '0'.repeat(64),
    }), REGISTRY, NOW)).toEqual({ ok: false, reason: 'future-version' });
    expect(importSaveV2(rawWithXp(firstFourThousand(), {
      v: 2, futureField: { mode: 'later' },
    }), REGISTRY, NOW)).toEqual({ ok: false, reason: 'future-version' });
    expect(importSaveV2(rawWithXp(firstFourThousand().slice(1), {
      v: 1, totalCount: 4001, carrierDigest: '0'.repeat(64),
    }), REGISTRY, NOW)).toEqual({ ok: false, reason: 'invalid' });
    const duplicates = firstFourThousand();
    duplicates[3999] = duplicates[0]!;
    expect(importSaveV2(rawWithXp(duplicates, {
      v: 1, totalCount: 4001, carrierDigest: '0'.repeat(64),
    }), REGISTRY, NOW)).toEqual({ ok: false, reason: 'invalid' });

    const short = importSaveV2(rawWithXp([]), REGISTRY, NOW);
    if (!short.ok) throw new Error('expected short legacy state');
    const append = prepareLegacyXpFirstClaim({
      state: short.state, extensions: {}, key: xpKey(0),
    });
    expect(append.kind).toBe('prepared');
    if (append.kind === 'prepared') {
      expect(Object.isFrozen(append.state.xpFirsts)).toBe(false);
      expect(() => append.state.xpFirsts.push(xpKey(1))).not.toThrow();
    }
  });

  it('archives the exact oldest key at 4,001, survives a split-row reload, and admits a genuine 4,002nd once', async () => {
    const keys = firstFourThousand();
    const backend = await migratedBackend(keys);
    const initial = await readSaveV5(backend, REGISTRY, NOW);
    expect(initial.kind).toBe('loaded');
    if (initial.kind !== 'loaded') return;
    const beforeState = JSON.stringify(initial.state);
    const beforeExtensions = JSON.stringify(initial.extensions);

    const first = prepareLegacyXpFirstClaim({
      state: initial.state, extensions: initial.extensions, key: xpKey(4000),
    });
    expect(first.kind).toBe('prepared');
    if (first.kind !== 'prepared') return;
    expect(JSON.stringify(initial.state)).toBe(beforeState);
    expect(JSON.stringify(initial.extensions)).toBe(beforeExtensions);
    expect(first.state.xpFirsts).toHaveLength(4000);
    expect(first.state.xpFirsts[0]).toBe(xpKey(1));
    expect(first.state.xpFirsts.at(-1)).toBe(xpKey(4000));
    expect(readLegacyXpFirstsAuthority(first.state, first.extensions)).toEqual({
      kind: 'loaded', mode: 'overflow', window: first.state.xpFirsts,
      archived: [xpKey(0)], totalCount: 4001,
    });

    const repository = createRevisionedRepository(backend);
    const saved = prepareV5SaveWrite({ state: first.state, extensions: first.extensions }, REGISTRY, NOW);
    expect(await repository.mutate({ expectedRevision: 0, writes: saved.operations }))
      .toMatchObject({ kind: 'committed', revision: 1 });
    const inventoryRow = JSON.parse((await backend.get('inventory', 'v5:inventory'))!) as {
      data: Record<string, unknown>; extensions: Record<string, unknown>;
    };
    expect(inventoryRow.data.xpa).toEqual(first.state.xpFirstsBinding);
    expect(inventoryRow.extensions).toHaveProperty(LEGACY_XP_FIRSTS_NAMESPACE);
    expect(JSON.parse((await backend.get('meta', V4_PRIMARY_KEY))!)).toHaveProperty(
      'xpa', first.state.xpFirstsBinding,
    );

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(reloaded.kind).toBe('loaded');
    if (reloaded.kind !== 'loaded') return;
    expect(prepareLegacyXpFirstClaim({
      state: reloaded.state, extensions: reloaded.extensions, key: xpKey(0),
    })).toEqual({ kind: 'duplicate', totalCount: 4001 });
    expect(await repository.revision()).toBe(1);

    const second = prepareLegacyXpFirstClaim({
      state: reloaded.state, extensions: reloaded.extensions, key: xpKey(4001),
    });
    expect(second.kind).toBe('prepared');
    if (second.kind !== 'prepared') return;
    expect(readLegacyXpFirstsAuthority(second.state, second.extensions)).toEqual({
      kind: 'loaded', mode: 'overflow', window: second.state.xpFirsts,
      archived: [xpKey(0), xpKey(1)], totalCount: 4002,
    });
    const secondSave = prepareV5SaveWrite({
      state: second.state, extensions: second.extensions,
    }, REGISTRY, NOW);
    expect(await repository.mutate({ expectedRevision: 1, writes: secondSave.operations }))
      .toMatchObject({ kind: 'committed', revision: 2 });
    const twiceReloaded = await readSaveV5(backend, REGISTRY, NOW);
    expect(twiceReloaded.kind).toBe('loaded');
    if (twiceReloaded.kind !== 'loaded') return;
    expect(prepareLegacyXpFirstClaim({
      state: twiceReloaded.state, extensions: twiceReloaded.extensions, key: xpKey(4001),
    })).toEqual({ kind: 'duplicate', totalCount: 4002 });
  });

  it('fails closed for missing, one-sided, malformed, future, duplicate, overlapping, and reordered authority', () => {
    const state = imported();
    expect(readLegacyXpFirstsAuthority(state, {})).toMatchObject({
      kind: 'loaded', mode: 'legacy-tail', totalCount: 4000,
    });
    expect(prepareLegacyXpFirstClaim({ state, extensions: {}, key: xpKey(4000) }).kind)
      .toBe('prepared');

    const overflow = preparedOverflow(state);
    const validCarrier = ownedCarrier(overflow.extensions);
    const protectedStateBefore = JSON.stringify(overflow.state);
    const protectedExtensionsBefore = JSON.stringify(overflow.extensions);
    expect(readLegacyXpFirstsAuthority(overflow.state, {})).toEqual({
      kind: 'protected', reason: 'binding-without-carrier',
    });
    expect(prepareLegacyXpFirstClaim({
      state: overflow.state, extensions: {}, key: xpKey(4001),
    })).toEqual({ kind: 'protected', reason: 'binding-without-carrier' });
    expect(readLegacyXpFirstsAuthority(
      { ...overflow.state, xpFirstsBinding: null }, overflow.extensions,
    )).toEqual({ kind: 'protected', reason: 'carrier-without-binding' });
    expect(JSON.stringify(overflow.state)).toBe(protectedStateBefore);
    expect(JSON.stringify(overflow.extensions)).toBe(protectedExtensionsBefore);

    const wrongSegment = canonicalizeV5Extensions({
      player: { [LEGACY_XP_FIRSTS_NAMESPACE]: validCarrier },
    });
    expect(readLegacyXpFirstsAuthority(
      { ...overflow.state, xpFirstsBinding: null }, wrongSegment,
    )).toEqual({ kind: 'protected', reason: 'carrier-wrong-segment' });
    expect(readLegacyXpFirstsAuthority(
      overflow.state, withCarrier(wrongSegment, validCarrier),
    )).toEqual({ kind: 'protected', reason: 'carrier-wrong-segment' });

    expect(readLegacyXpFirstsAuthority({
      ...overflow.state,
      xpFirstsBinding: { v: 2, futureField: true } as unknown as LegacyXpFirstsBindingV1,
    }, overflow.extensions)).toEqual({
      kind: 'protected', reason: 'binding-future', version: 2,
    });

    const malformed = Object.freeze({ version: 1, json: '{}' });
    expect(readLegacyXpFirstsAuthority({
      ...overflow.state, xpFirstsBinding: bindingFor(malformed, 4001),
    }, withCarrier(overflow.extensions, malformed))).toEqual({
      kind: 'protected', reason: 'carrier-corrupt',
    });

    const future = Object.freeze({ version: 2, json: validCarrier.json });
    expect(readLegacyXpFirstsAuthority({
      ...overflow.state, xpFirstsBinding: bindingFor(future, 4001),
    }, withCarrier(overflow.extensions, future))).toEqual({
      kind: 'protected', reason: 'carrier-future', version: 2,
    });

    const duplicateCarrier = carrierWith(
      [xpKey(0), xpKey(0)], overflow.state.xpFirsts,
    );
    expect(readLegacyXpFirstsAuthority({
      ...overflow.state, xpFirstsBinding: bindingFor(duplicateCarrier, 4002),
    }, withCarrier(overflow.extensions, duplicateCarrier))).toEqual({
      kind: 'protected', reason: 'carrier-corrupt',
    });

    const overlapCarrier = carrierWith(
      [overflow.state.xpFirsts[0]!], overflow.state.xpFirsts,
    );
    expect(readLegacyXpFirstsAuthority({
      ...overflow.state, xpFirstsBinding: bindingFor(overlapCarrier, 4001),
    }, withCarrier(overflow.extensions, overlapCarrier))).toEqual({
      kind: 'protected', reason: 'carrier-corrupt',
    });

    for (const hostileWindow of [
      (() => { const sparse = new Array<string>(2); sparse[1] = xpKey(2); return sparse; })(),
      [1] as unknown as string[],
      ['x'.repeat(65)],
    ]) expect(readLegacyXpFirstsAuthority(
      { ...state, xpFirsts: hostileWindow }, {},
    )).toEqual({ kind: 'protected', reason: 'state-corrupt' });

    for (const hostileArchive of [
      [1] as unknown as string[],
      ['x'.repeat(65)],
    ]) {
      const hostileCarrier = carrierWith(hostileArchive, overflow.state.xpFirsts);
      expect(readLegacyXpFirstsAuthority({
        ...overflow.state,
        xpFirstsBinding: bindingFor(hostileCarrier, 4001),
      }, withCarrier(overflow.extensions, hostileCarrier))).toEqual({
        kind: 'protected', reason: 'carrier-corrupt',
      });
    }

    const second = preparedOverflow(overflow.state, overflow.extensions, xpKey(4001));
    const ordered = JSON.parse(ownedCarrier(second.extensions).json) as {
      archived: string[]; windowDigest: string; totalCount: number;
    };
    expect(ordered.archived).toEqual([xpKey(0), xpKey(1)]);
    const reorderedCarrier = carrierWith(
      [xpKey(1), xpKey(0)], second.state.xpFirsts,
    );
    expect(readLegacyXpFirstsAuthority(
      second.state, withCarrier(second.extensions, reorderedCarrier),
    )).toEqual({ kind: 'protected', reason: 'binding-mismatch' });

    const unchangedState = JSON.stringify(overflow.state);
    const unchangedExtensions = JSON.stringify(overflow.extensions);
    for (const key of ['', 'x'.repeat(65)]) {
      expect(prepareLegacyXpFirstClaim({
        state: overflow.state, extensions: overflow.extensions, key,
      })).toEqual({ kind: 'protected', reason: 'invalid-key' });
    }
    expect(JSON.stringify(overflow.state)).toBe(unchangedState);
    expect(JSON.stringify(overflow.extensions)).toBe(unchangedExtensions);
  });

  it('accepts the exact aggregate extension fit and protects the next byte without mutation', () => {
    const state = imported();
    const sample = preparedOverflow(state);
    const claimBytes = utf8Length(ownedCarrier(sample.extensions).json);
    const exactBase = paddingExtensions(V5_MAX_EXTENSION_TOTAL_BYTES - claimBytes);
    const exact = prepareLegacyXpFirstClaim({
      state, extensions: exactBase, key: xpKey(4000),
    });
    expect(exact.kind).toBe('prepared');
    if (exact.kind === 'prepared') {
      const total = Object.values(exact.extensions).flatMap((segment) => (
        Object.values(segment ?? {}).map((carrier) => utf8Length(carrier.json))
      )).reduce((sum, bytes) => sum + bytes, 0);
      expect(total).toBe(V5_MAX_EXTENSION_TOTAL_BYTES);
    }

    const overBase = paddingExtensions(V5_MAX_EXTENSION_TOTAL_BYTES - claimBytes + 1);
    const stateBefore = JSON.stringify(state);
    const extensionsBefore = JSON.stringify(overBase);
    expect(prepareLegacyXpFirstClaim({
      state, extensions: overBase, key: xpKey(4000),
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
    expect(JSON.stringify(state)).toBe(stateBefore);
    expect(JSON.stringify(overBase)).toBe(extensionsBefore);
  });

  it('accepts an exact-size owned carrier and rejects its next byte and next claim without mutation', () => {
    const state = imported();
    const carrier = exactSizeOwnedCarrier(state.xpFirsts);
    expect(utf8Length(carrier.json)).toBe(V5_MAX_EXTENSION_JSON_BYTES);
    const extensions = withCarrier({}, carrier);
    const boundState: SaveStateV2 = {
      ...state,
      xpFirstsBinding: bindingFor(carrier, 8000),
    };
    const exactRead = readLegacyXpFirstsAuthority(boundState, extensions);
    expect(exactRead, JSON.stringify(exactRead)).toMatchObject({
      kind: 'loaded', mode: 'overflow', totalCount: 8000,
    });

    const stateBefore = JSON.stringify(boundState);
    const extensionsBefore = JSON.stringify(extensions);
    expect(prepareLegacyXpFirstClaim({
      state: boundState, extensions, key: xpKey(4000),
    })).toEqual({ kind: 'protected', reason: 'extension-bounds' });
    expect(JSON.stringify(boundState)).toBe(stateBefore);
    expect(JSON.stringify(extensions)).toBe(extensionsBefore);

    const tooLarge = {
      inventory: {
        [LEGACY_XP_FIRSTS_NAMESPACE]: { version: 1, json: `${carrier.json} ` },
      },
    } as V5Extensions;
    expect(readLegacyXpFirstsAuthority(boundState, tooLarge)).toEqual({
      kind: 'protected', reason: 'extensions-corrupt',
    });
  });

  it('retains the paired authority through portable fixed points and protects portable one-sided/wrong-segment states', () => {
    const overflow = preparedOverflow();
    const portable = exportPortableV5Save({
      state: overflow.state, extensions: overflow.extensions,
    }, REGISTRY, NOW);
    const classified = classifyPortableV5Save(portable, REGISTRY, NOW);
    expect(classified.kind).toBe('supported');
    if (classified.kind !== 'supported') return;
    expect(readLegacyXpFirstsAuthority(classified.state, classified.extensions)).toMatchObject({
      kind: 'loaded', mode: 'overflow', totalCount: 4001,
    });
    expect(exportPortableV5Save({
      state: classified.state, extensions: classified.extensions,
    }, REGISTRY, NOW)).toBe(portable);
    const replacement = prepareV5Replacement(portable, REGISTRY, NOW);
    expect(replacement.kind).toBe('prepared');
    if (replacement.kind === 'prepared') {
      expect(readLegacyXpFirstsAuthority(replacement.state, replacement.extensions)).toMatchObject({
        kind: 'loaded', mode: 'overflow', totalCount: 4001,
      });
    }

    const portableCarrierOnly = exportPortableV5Save({
      state: { ...overflow.state, xpFirstsBinding: null },
      extensions: overflow.extensions,
    }, REGISTRY, NOW);
    const carrierOnly = classifyPortableV5Save(portableCarrierOnly, REGISTRY, NOW);
    expect(carrierOnly.kind).toBe('supported');
    if (carrierOnly.kind === 'supported') {
      expect(readLegacyXpFirstsAuthority(carrierOnly.state, carrierOnly.extensions)).toEqual({
        kind: 'protected', reason: 'carrier-without-binding',
      });
    }

    const portableBindingOnly = exportPortableV5Save({
      state: overflow.state, extensions: {},
    }, REGISTRY, NOW);
    const bindingOnly = classifyPortableV5Save(portableBindingOnly, REGISTRY, NOW);
    expect(bindingOnly.kind).toBe('supported');
    if (bindingOnly.kind === 'supported') {
      expect(readLegacyXpFirstsAuthority(bindingOnly.state, bindingOnly.extensions)).toEqual({
        kind: 'protected', reason: 'binding-without-carrier',
      });
    }

    const wrongExtensions = canonicalizeV5Extensions({
      player: { [LEGACY_XP_FIRSTS_NAMESPACE]: ownedCarrier(overflow.extensions) },
    });
    const portableWrong = exportPortableV5Save({
      state: { ...overflow.state, xpFirstsBinding: null }, extensions: wrongExtensions,
    }, REGISTRY, NOW);
    const wrong = classifyPortableV5Save(portableWrong, REGISTRY, NOW);
    expect(wrong.kind).toBe('supported');
    if (wrong.kind === 'supported') {
      expect(readLegacyXpFirstsAuthority(wrong.state, wrong.extensions)).toEqual({
        kind: 'protected', reason: 'carrier-wrong-segment',
      });
      const wrongReplacement = prepareV5Replacement(portableWrong, REGISTRY, NOW);
      expect(wrongReplacement.kind).toBe('prepared');
      if (wrongReplacement.kind === 'prepared') {
        expect(readLegacyXpFirstsAuthority(
          wrongReplacement.state, wrongReplacement.extensions,
        )).toEqual({ kind: 'protected', reason: 'carrier-wrong-segment' });
      }
    }
  });

  it('commits one same-parent claim and leaves the stale distinct claim eligible without retry', async () => {
    const backend = await migratedBackend();
    const initial = await readSaveV5(backend, REGISTRY, NOW);
    if (initial.kind !== 'loaded') throw new Error(`expected loaded, received ${initial.kind}`);
    const lease = createTabLeaseClient(backend, {
      ownerId: 'xp-tab', token: 'xp-session', ttlMs: 10_000, now: () => 0,
    });
    const acquired = await lease.acquire();
    if (acquired.kind !== 'acquired') throw new Error(`expected lease, received ${acquired.kind}`);
    const repository = createRevisionedRepository(backend);
    const seeded = await createActivePlayPersistenceOwner(repository, REGISTRY).commit({
      expectedRevision: 0,
      grant: acquired.grant,
      writable: { state: initial.state, extensions: initial.extensions },
      snapshot: { activePlayMs: 100 },
      sessionRng: createSessionRNG(0x5850).state(),
      now: NOW,
    });
    expect(seeded.kind).toBe('committed');
    const parent = await readSaveV5(backend, REGISTRY, NOW);
    if (parent.kind !== 'loaded') throw new Error(`expected parent, received ${parent.kind}`);
    expect(parent.extensions.player?.[F4_AUTHORITY_NAMESPACE]).toBeDefined();
    const owner = createF4DeterministicProductTransactionOwner(repository, REGISTRY);
    const claim = (key: string) => owner.commit({
      expectedRevision: 1,
      grant: acquired.grant,
      writable: { state: parent.state, extensions: parent.extensions },
      snapshot: { activePlayMs: 100 },
      operation: `legacy-xp-first:${key}`,
      receiptKind: 'legacy-xp-first',
      now: NOW,
      derive: ({ draft, extensions }) => {
        const prepared = prepareLegacyXpFirstClaim({ state: draft, extensions, key });
        if (prepared.kind !== 'prepared') throw new Error(`claim was ${prepared.kind}`);
        return {
          state: prepared.state,
          extensionWrites: prepared.writes,
          witness: `${key}:${prepared.totalCount}`,
        };
      },
    });

    const winner = await claim(xpKey(4000));
    expect(winner).toMatchObject({ kind: 'committed', revision: 2 });
    const loser = await claim(xpKey(4001));
    expect(loser).toMatchObject({ kind: 'stale', expectedRevision: 1, actualRevision: 2 });
    expect(await repository.readReceipt(0)).toMatchObject({
      ordinal: 0, kind: 'legacy-xp-first', witness: `${xpKey(4000)}:4001`,
    });
    expect(await repository.readReceipt(1)).toBeUndefined();

    const reloaded = await readSaveV5(backend, REGISTRY, NOW);
    if (reloaded.kind !== 'loaded') throw new Error(`expected reload, received ${reloaded.kind}`);
    expect(prepareLegacyXpFirstClaim({
      state: reloaded.state, extensions: reloaded.extensions, key: xpKey(4000),
    })).toEqual({ kind: 'duplicate', totalCount: 4001 });
    expect(prepareLegacyXpFirstClaim({
      state: reloaded.state, extensions: reloaded.extensions, key: xpKey(4001),
    }).kind).toBe('prepared');
  });
});
