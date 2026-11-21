/* Dependency-free canonical data and digest helpers for Arc 4 authority.

   Inputs are accepted only as bounded, own, plain data. Accessors, symbols,
   sparse/custom arrays, custom prototypes, cycles, and descriptor surprises
   are rejected before any property value is read. A transparent Proxy can
   emulate those reflection results in JavaScript; generic reflection cannot
   prove otherwise. Write authority therefore comes from the model module's
   private registration, never from this structural validator. */

export type CanonicalJson = null | boolean | number | string | CanonicalJsonArray | CanonicalJsonObject;
export interface CanonicalJsonArray extends ReadonlyArray<CanonicalJson> {}
export interface CanonicalJsonObject { readonly [key: string]: CanonicalJson }

export interface CanonicalDataBudget {
  readonly maxDepth: number;
  readonly maxNodes: number;
  readonly maxKeys: number;
  readonly maxArrayLength: number;
  readonly maxStringLength: number;
  readonly maxCharacters: number;
}

export const OWNERSHIP_DATA_BUDGET: CanonicalDataBudget = Object.freeze({
  maxDepth: 24,
  maxNodes: 250_000,
  maxKeys: 256,
  maxArrayLength: 20_000,
  maxStringLength: 16_384,
  maxCharacters: 4_000_000,
});

interface MutableBudget {
  nodes: number;
  characters: number;
  readonly active: WeakSet<object>;
}

function ownKeys(value: object): readonly PropertyKey[] {
  return Reflect.ownKeys(value);
}

function plainPrototype(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function ownDataDescriptor(value: object, key: PropertyKey): PropertyDescriptor {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !('value' in descriptor) || descriptor.get !== undefined || descriptor.set !== undefined) {
    throw new TypeError(`ownership data property ${String(key)} must be an own data property`);
  }
  return descriptor;
}

function canonicalNumber(value: number): number {
  if (!Number.isFinite(value)) throw new TypeError('ownership data numbers must be finite');
  return Object.is(value, -0) ? 0 : value;
}

function canonicalValue(
  value: unknown,
  budget: CanonicalDataBudget,
  mutable: MutableBudget,
  depth: number,
): CanonicalJson {
  mutable.nodes++;
  if (mutable.nodes > budget.maxNodes) throw new RangeError('ownership data node budget exceeded');
  if (depth > budget.maxDepth) throw new RangeError('ownership data depth exceeded');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return canonicalNumber(value);
  if (typeof value === 'string') {
    if (value.length > budget.maxStringLength) throw new RangeError('ownership data string is too long');
    mutable.characters += value.length;
    if (mutable.characters > budget.maxCharacters) throw new RangeError('ownership data character budget exceeded');
    return value;
  }
  if (typeof value !== 'object') throw new TypeError('ownership data must be JSON-compatible');
  if (mutable.active.has(value)) throw new TypeError('ownership data must be acyclic');
  mutable.active.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) {
        throw new TypeError('ownership arrays must use Array.prototype');
      }
      if (value.length > budget.maxArrayLength) throw new RangeError('ownership array is too long');
      const keys = ownKeys(value);
      if (keys.some((key) => typeof key === 'symbol')) throw new TypeError('ownership arrays cannot contain symbols');
      const expected = value.length + 1;
      if (keys.length !== expected || !keys.includes('length')) {
        throw new TypeError('ownership arrays must be dense and contain no extra properties');
      }
      const lengthDescriptor = ownDataDescriptor(value, 'length');
      if (lengthDescriptor.value !== value.length) throw new TypeError('ownership array length descriptor changed');
      const result: CanonicalJson[] = [];
      for (let index = 0; index < value.length; index++) {
        const descriptor = ownDataDescriptor(value, String(index));
        if (descriptor.enumerable !== true) throw new TypeError('ownership array elements must be enumerable');
        result.push(canonicalValue(descriptor.value, budget, mutable, depth + 1));
      }
      return Object.freeze(result);
    }
    if (!plainPrototype(value)) throw new TypeError('ownership objects must have a plain prototype');
    const keys = ownKeys(value);
    if (keys.some((key) => typeof key === 'symbol')) throw new TypeError('ownership objects cannot contain symbols');
    if (keys.length > budget.maxKeys) throw new RangeError('ownership object key count exceeded');
    const names = keys as string[];
    /* A normal object would route an own `__proto__` input through the legacy
       Object.prototype setter and silently change this clone's prototype
       instead of retaining one canonical data field. A null-prototype target
       makes every accepted JSON key ordinary data. */
    const result = Object.create(null) as Record<string, CanonicalJson>;
    for (const key of [...names].sort()) {
      if (key.length > 256) throw new RangeError('ownership object key is too long');
      mutable.characters += key.length;
      if (mutable.characters > budget.maxCharacters) throw new RangeError('ownership data character budget exceeded');
      const descriptor = ownDataDescriptor(value, key);
      if (descriptor.enumerable !== true) throw new TypeError('ownership object properties must be enumerable');
      result[key] = canonicalValue(descriptor.value, budget, mutable, depth + 1);
    }
    return Object.freeze(result);
  } finally {
    mutable.active.delete(value);
  }
}

export function canonicalizeData(
  value: unknown,
  budget: CanonicalDataBudget = OWNERSHIP_DATA_BUDGET,
): CanonicalJson {
  const mutable: MutableBudget = { nodes: 0, characters: 0, active: new WeakSet<object>() };
  return canonicalValue(value, budget, mutable, 0);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalizeData(value));
}

export function utf8Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index++) {
    let point = value.charCodeAt(index);
    if (point >= 0xD800 && point <= 0xDBFF) {
      const next = value.charCodeAt(index + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        point = 0x10000 + ((point - 0xD800) << 10) + (next - 0xDC00);
        index++;
      } else {
        point = 0xFFFD;
      }
    } else if (point >= 0xDC00 && point <= 0xDFFF) {
      point = 0xFFFD;
    }
    if (point <= 0x7F) bytes.push(point);
    else if (point <= 0x7FF) bytes.push(0xC0 | (point >>> 6), 0x80 | (point & 0x3F));
    else if (point <= 0xFFFF) {
      bytes.push(0xE0 | (point >>> 12), 0x80 | ((point >>> 6) & 0x3F), 0x80 | (point & 0x3F));
    } else {
      bytes.push(
        0xF0 | (point >>> 18),
        0x80 | ((point >>> 12) & 0x3F),
        0x80 | ((point >>> 6) & 0x3F),
        0x80 | (point & 0x3F),
      );
    }
  }
  return Uint8Array.from(bytes);
}

export function utf8ByteLength(value: string): number {
  return utf8Bytes(value).byteLength;
}

/* Small synchronous SHA-256. Ownership IDs and carrier digests must be
   deterministic in domain/browser/worker programs without importing Node or
   consulting ambient crypto state. */
const SHA256_K = Object.freeze([
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
]);

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256Hex(value: string): string {
  const source = utf8Bytes(value);
  const bitLength = source.length * 8;
  const paddedLength = Math.ceil((source.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(source);
  bytes[source.length] = 0x80;
  const high = Math.floor(bitLength / 0x1_0000_0000);
  const low = bitLength >>> 0;
  for (let index = 0; index < 4; index++) {
    bytes[paddedLength - 8 + index] = (high >>> (24 - index * 8)) & 0xFF;
    bytes[paddedLength - 4 + index] = (low >>> (24 - index * 8)) & 0xFF;
  }
  const h = new Uint32Array([
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
  ]);
  const words = new Uint32Array(64);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index++) {
      const at = offset + index * 4;
      words[index] = (
        (bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!
      ) >>> 0;
    }
    for (let index = 16; index < 64; index++) {
      const a = words[index - 15]!;
      const b = words[index - 2]!;
      const s0 = rotateRight(a, 7) ^ rotateRight(a, 18) ^ (a >>> 3);
      const s1 = rotateRight(b, 17) ^ rotateRight(b, 19) ^ (b >>> 10);
      words[index] = (words[index - 16]! + s0 + words[index - 7]! + s1) >>> 0;
    }
    let a = h[0]!, b = h[1]!, c = h[2]!, d = h[3]!;
    let e = h[4]!, f = h[5]!, g = h[6]!, hh = h[7]!;
    for (let index = 0; index < 64; index++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (hh + s1 + choice + SHA256_K[index]! + words[index]!) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;
      hh = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h[0] = (h[0]! + a) >>> 0; h[1] = (h[1]! + b) >>> 0;
    h[2] = (h[2]! + c) >>> 0; h[3] = (h[3]! + d) >>> 0;
    h[4] = (h[4]! + e) >>> 0; h[5] = (h[5]! + f) >>> 0;
    h[6] = (h[6]! + g) >>> 0; h[7] = (h[7]! + hh) >>> 0;
  }
  return Array.from(h, (word) => word.toString(16).padStart(8, '0')).join('');
}
