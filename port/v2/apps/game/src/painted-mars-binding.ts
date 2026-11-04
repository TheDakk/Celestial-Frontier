import {
  BIOME_VISTA_WORKER_REQUEST_SCHEMA,
  validBiomeVistaWorkerRenderMessageV1,
  type BiomeVistaRenderRequestV1,
} from './biome-vista-protocol.js';

export const PAINTED_MARS_VISTA_ID = 'painted-mars-dunesea-v1' as const;

/** Exact source-proven request from canonical-mars.json in the 2026-09-08
 * painted-Mars audit. This asset covers this complete scene only, including
 * its barren roster, light, weather and clock; it is not a desert classifier.
 * Preserve the canonical builder's insertion order as part of this binding. */
export const PAINTED_MARS_VISTA_BINDING_V1 = "{\"worldKey\":\"CF1|g:999@90,-60|s:424242@560,170|p:134#3\",\"environmentFingerprint\":\"cwe1:145:0d97c0f8\",\"profileSchema\":\"cf.domain.biome-profile.v1\",\"profileDigest\":\"bpd1-6fce883d4d70e3b6bde0fb184b416e8e\",\"biomeKey\":\"dunesea\",\"scene\":\"generic\",\"options\":{\"seed\":134,\"era\":\"none\",\"pal\":\"sand\",\"biome\":\"land\",\"wx\":null,\"moons\":2,\"aurora\":false,\"nightize\":false,\"duskize\":false,\"flora\":false,\"water\":\"none\",\"genes\":null,\"floraGenes\":[],\"ring\":false,\"stc\":\"#fff4d8\",\"herd\":0,\"aqua\":0,\"air\":0,\"wb\":\"dunesea\",\"evt\":null,\"titan\":false,\"salt\":0}}";

interface SnapshotBudget { remaining: number; }

/** Read descriptors before values: the shared worker validator is a protocol
 * guard, but some of its checks read option values before their descriptors.
 * A detached snapshot also prevents serialization hooks on caller objects.
 * Bounds are intentionally small for this fixed, shallow, empty-roster scene. */
function plainSnapshot(value: unknown, budget: SnapshotBudget, depth = 0): unknown {
  if (--budget.remaining < 0 || depth > 8) throw new TypeError('painted vista data budget');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0)) return value;
  if (typeof value !== 'object' || value === null) throw new TypeError('painted vista plain data');
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('painted vista plain prototype');
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length > 64 || keys.some(key => typeof key !== 'string')) {
    throw new TypeError('painted vista data keys');
  }
  const snapshot: Record<string, unknown> | unknown[] = array ? [] : Object.create(null);
  let length = 0;
  if (array) {
    const descriptor = Object.getOwnPropertyDescriptor(value, 'length');
    if (!descriptor || !Object.hasOwn(descriptor, 'value')
      || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0 || descriptor.value > 63
      || keys.length !== descriptor.value + 1) throw new TypeError('painted vista dense array');
    length = descriptor.value as number;
  }
  for (const key of keys as string[]) {
    if (array && key === 'length') continue;
    if (array && (!/^(?:0|[1-9]\d*)$/u.test(key) || Number(key) >= length)) {
      throw new TypeError('painted vista array key');
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || descriptor.enumerable !== true) {
      throw new TypeError('painted vista data descriptor');
    }
    Object.defineProperty(snapshot, key, {
      value: plainSnapshot(descriptor.value, budget, depth + 1),
      enumerable: true, configurable: true, writable: true,
    });
  }
  return snapshot;
}

export function isPaintedMarsVistaV1(request: BiomeVistaRenderRequestV1): boolean {
  try {
    const snapshot = plainSnapshot(request, { remaining: 128 });
    const envelope = {
      schema: BIOME_VISTA_WORKER_REQUEST_SCHEMA,
      type: 'render', documentToken: PAINTED_MARS_VISTA_ID, generation: 1,
      request: snapshot,
    };
    return validBiomeVistaWorkerRenderMessageV1(envelope)
      && JSON.stringify(snapshot) === PAINTED_MARS_VISTA_BINDING_V1;
  } catch {
    return false;
  }
}
