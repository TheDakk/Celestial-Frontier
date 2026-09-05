import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  createEmptyDescentWaveOffStateV1,
  decodeDescentWaveOffStateV1,
  descentWaveOffCountV1,
  encodeDescentWaveOffStateV1,
  stageDescentWaveOffOutcomeV1,
} from '@cf/domain-opportunity';
import {
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import {
  DESCENT_WAVE_OFF_NAMESPACE_V1,
  canonicalizeV5Extensions,
  loadDescentWaveOffAuthorityV1,
  prepareDescentWaveOffMutationV1,
  readDescentWaveOffCarrierV1,
  type V5ExtensionCarrier,
  type V5Extensions,
} from '@cf/persistence';

beforeAll(() => installCaptureHooks());

const COLLISION_SEED = 488_332_735;
const COLLIDING_CANDIDATES = Object.freeze([
  Object.freeze({
    galaxy: Object.freeze({ seed: 1_594_395_733, x: -5_501.81, y: -11_753.64 }),
    star: Object.freeze({ seed: 4_077_594_722, x: -271.54, y: -67.36 }),
    planet: Object.freeze({ seed: COLLISION_SEED }),
  }),
  Object.freeze({
    galaxy: Object.freeze({ seed: 1_336_287_406, x: -2_657.91, y: -11_817.01 }),
    star: Object.freeze({ seed: 1_391_422_746, x: -646.79, y: 119.97 }),
    planet: Object.freeze({ seed: COLLISION_SEED }),
  }),
] as const);

function world(index: 0 | 1): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(COLLIDING_CANDIDATES[index]);
  if (!result.ok) throw new Error(`descent collision fixture failed: ${result.reason}`);
  return result.address;
}

function carrier(extensions: V5Extensions): V5ExtensionCarrier {
  const value = extensions.catalog?.[DESCENT_WAVE_OFF_NAMESPACE_V1];
  if (!value) throw new Error('expected descent wave-off carrier');
  return value;
}

function withCarrier(value: V5ExtensionCarrier, segment: 'catalog' | 'player' = 'catalog') {
  return canonicalizeV5Extensions({ [segment]: { [DESCENT_WAVE_OFF_NAMESPACE_V1]: value } });
}

describe('@cf/persistence — canonical descent wave-off authority', () => {
  it('retains legacy seed evidence, claims it once, and keeps colliding worlds independent', () => {
    const first = world(0);
    const second = world(1);
    expect(first.planet.seed).toBe(COLLISION_SEED);
    expect(second.planet.seed).toBe(COLLISION_SEED);
    expect(first.key).not.toBe(second.key);

    const projected = loadDescentWaveOffAuthorityV1({
      extensions: {}, legacyWaveOffs: [[COLLISION_SEED, 2]],
    });
    expect(projected.kind).toBe('loaded');
    if (projected.kind !== 'loaded') return;
    expect(projected.source).toBe('legacy-bootstrap');
    expect(projected.state.records).toEqual([]);
    expect(projected.state.unresolved).toEqual([{ seed: COLLISION_SEED, count: 2 }]);
    expect(descentWaveOffCountV1(projected.state, first)).toBe(2);
    expect(descentWaveOffCountV1(projected.state, second)).toBe(2);

    const claimed = prepareDescentWaveOffMutationV1({
      extensions: {}, legacyWaveOffs: [[COLLISION_SEED, 2]],
      address: first, outcome: 'failure',
    });
    expect(claimed.kind).toBe('prepared');
    if (claimed.kind !== 'prepared') return;
    expect(claimed).toMatchObject({
      source: 'legacy-bootstrap', outcome: 'failure', countBefore: 2, countAfter: 3,
      legacyWaveOffs: [[COLLISION_SEED, 3]],
    });
    expect(claimed.state.unresolved).toEqual([]);
    expect(descentWaveOffCountV1(claimed.state, first)).toBe(3);
    expect(descentWaveOffCountV1(claimed.state, second)).toBe(0);

    const secondFailure = prepareDescentWaveOffMutationV1({
      extensions: claimed.extensions, legacyWaveOffs: claimed.legacyWaveOffs,
      address: second, outcome: 'failure',
    });
    expect(secondFailure.kind).toBe('prepared');
    if (secondFailure.kind !== 'prepared') return;
    expect(secondFailure.source).toBe('current');
    expect(secondFailure.state.records).toHaveLength(2);
    expect(descentWaveOffCountV1(secondFailure.state, first)).toBe(3);
    expect(descentWaveOffCountV1(secondFailure.state, second)).toBe(1);
    /* The v4 mirror is necessarily lossy; current extension authority is not. */
    expect(secondFailure.legacyWaveOffs).toEqual([[COLLISION_SEED, 3]]);

    const firstSuccess = prepareDescentWaveOffMutationV1({
      extensions: secondFailure.extensions, legacyWaveOffs: secondFailure.legacyWaveOffs,
      address: first, outcome: 'success',
    });
    expect(firstSuccess.kind).toBe('prepared');
    if (firstSuccess.kind !== 'prepared') return;
    expect(firstSuccess).toMatchObject({ countBefore: 3, countAfter: 0 });
    expect(descentWaveOffCountV1(firstSuccess.state, first)).toBe(0);
    expect(descentWaveOffCountV1(firstSuccess.state, second)).toBe(1);
    expect(firstSuccess.legacyWaveOffs).toEqual([[COLLISION_SEED, 1]]);
  });

  it('round-trips canonical source-reproved bytes and never mutates an input state', () => {
    const first = world(0);
    const empty = createEmptyDescentWaveOffStateV1();
    const before = encodeDescentWaveOffStateV1(empty);
    const failed = stageDescentWaveOffOutcomeV1(empty, first, 'failure');
    expect(encodeDescentWaveOffStateV1(empty)).toBe(before);
    expect(descentWaveOffCountV1(empty, first)).toBe(0);
    expect(descentWaveOffCountV1(failed, first)).toBe(1);
    const encoded = encodeDescentWaveOffStateV1(failed);
    const reloaded = decodeDescentWaveOffStateV1(encoded);
    expect(encodeDescentWaveOffStateV1(reloaded)).toBe(encoded);
    expect(reloaded.records[0]?.address).not.toBe(first);
    expect(reloaded.records[0]?.address.key).toBe(first.key);
    expect(() => encodeDescentWaveOffStateV1({ ...reloaded } as never))
      .toThrow(/registered by this package/);
    expect(() => decodeDescentWaveOffStateV1(` ${encoded}`)).toThrow(/not canonical/);
  });

  it('retains every finite seed already accepted by the legacy v4 importer', () => {
    const loaded = loadDescentWaveOffAuthorityV1({
      extensions: {}, legacyWaveOffs: [[-7.5, 1], [4_294_967_296, 2], [-0, 3]],
    });
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.state.unresolved).toEqual([
      { seed: -7.5, count: 1 },
      { seed: 0, count: 3 },
      { seed: 4_294_967_296, count: 2 },
    ]);
    const roundTrip = decodeDescentWaveOffStateV1(encodeDescentWaveOffStateV1(loaded.state));
    expect(roundTrip.unresolved).toEqual(loaded.state.unresolved);
  });

  it('preserves unrelated extension siblings and returns one composable replacement', () => {
    const address = world(0);
    const extensions = canonicalizeV5Extensions({
      settings: { sibling: { version: 1, json: '{"kept":true}' } },
    });
    const prepared = prepareDescentWaveOffMutationV1({
      extensions, legacyWaveOffs: [], address, outcome: 'failure',
    });
    expect(prepared.kind).toBe('prepared');
    if (prepared.kind !== 'prepared') return;
    expect(prepared.writes).toHaveLength(1);
    expect(prepared.write).toEqual(prepared.writes[0]);
    expect(prepared.write).toMatchObject({
      segment: 'catalog', namespace: DESCENT_WAVE_OFF_NAMESPACE_V1,
      carrier: { version: 1 },
    });
    expect(prepared.extensions.settings?.sibling).toEqual({ version: 1, json: '{"kept":true}' });
    const read = readDescentWaveOffCarrierV1(prepared.extensions);
    expect(read.kind).toBe('loaded');
    if (read.kind === 'loaded') expect(descentWaveOffCountV1(read.state, address)).toBe(1);
  });

  it('refuses malformed, misplaced, future, forged and impossible authority without a write', () => {
    const address = world(0);
    expect(readDescentWaveOffCarrierV1({ unknown: {} })).toEqual({
      kind: 'protected', reason: 'extensions-corrupt',
    });
    expect(readDescentWaveOffCarrierV1(withCarrier({ version: 1, json: '{}' }, 'player')))
      .toEqual({ kind: 'protected', reason: 'wrong-segment' });
    expect(readDescentWaveOffCarrierV1(withCarrier({ version: 2, json: '{}' })))
      .toEqual({ kind: 'protected', reason: 'future-version', version: 2 });
    expect(readDescentWaveOffCarrierV1(withCarrier({ version: 1, json: '{}' })))
      .toEqual({ kind: 'protected', reason: 'carrier-corrupt' });
    expect(loadDescentWaveOffAuthorityV1({ extensions: {}, legacyWaveOffs: [['bad', 1]] }))
      .toEqual({ kind: 'protected', reason: 'legacy-corrupt' });
    expect(prepareDescentWaveOffMutationV1({
      extensions: {}, legacyWaveOffs: [], address: { ...address } as never, outcome: 'failure',
    })).toEqual({ kind: 'protected', reason: 'address-invalid' });
    expect(prepareDescentWaveOffMutationV1({
      extensions: {}, legacyWaveOffs: [[COLLISION_SEED, 5]], address, outcome: 'failure',
    })).toEqual({ kind: 'protected', reason: 'outcome-impossible' });
    expect(prepareDescentWaveOffMutationV1({
      extensions: {}, legacyWaveOffs: [], address, outcome: 'later' as never,
    })).toEqual({ kind: 'protected', reason: 'outcome-impossible' });
  });

  it('rejects forged keys, duplicate order and resolved/unresolved overlap on decode', () => {
    const address = world(0);
    const prepared = prepareDescentWaveOffMutationV1({
      extensions: {}, legacyWaveOffs: [], address, outcome: 'failure',
    });
    if (prepared.kind !== 'prepared') throw new Error('fixture preparation failed');
    const encoded = carrier(prepared.extensions).json;
    const mutate = (change: (value: Record<string, unknown>) => void): string => {
      const value = JSON.parse(encoded) as Record<string, unknown>;
      change(value);
      return JSON.stringify(value);
    };
    expect(() => decodeDescentWaveOffStateV1(mutate((value) => {
      const records = value.records as Array<[string, number]>;
      records[0]![0] = `${records[0]![0]}-forged`;
    }))).toThrow(/source-reproved/);
    expect(() => decodeDescentWaveOffStateV1(mutate((value) => {
      const records = value.records as Array<[string, number]>;
      records.push([...records[0]!] as [string, number]);
    }))).toThrow(/unique ascending/);
    expect(() => decodeDescentWaveOffStateV1(mutate((value) => {
      value.unresolved = [[COLLISION_SEED, 1]];
    }))).toThrow(/cannot overlap/);
  });
});
