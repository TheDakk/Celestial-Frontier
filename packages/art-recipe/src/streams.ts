import { hashInt, mulberry32 } from '@cf/domain-rand';

function stableNode(value: unknown, ancestors: Set<object>): unknown {
  if (value === null) return ['null'];
  if (value === undefined) return ['undefined'];
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError('cyclic genome value');
    ancestors.add(value);
    const result = ['array', value.map((item) => stableNode(item, ancestors))];
    ancestors.delete(value);
    return result;
  }
  if (typeof value === 'object') {
    if (ancestors.has(value)) throw new TypeError('cyclic genome value');
    ancestors.add(value);
    const object = value as Record<string, unknown>;
    const result = ['object', Object.keys(object).sort().map((key) => [key, stableNode(object[key], ancestors)])];
    ancestors.delete(value);
    return result;
  }
  if (typeof value === 'number') {
    const exact = Number.isNaN(value) ? 'NaN'
      : value === Infinity ? 'Infinity'
        : value === -Infinity ? '-Infinity'
          : Object.is(value, -0) ? '-0' : String(value);
    return ['number', exact];
  }
  if (typeof value === 'string') return ['string', value];
  if (typeof value === 'boolean') return ['boolean', value];
  if (typeof value === 'bigint') return ['bigint', String(value)];
  throw new TypeError(`unsupported genome value: ${typeof value}`);
}

/**
 * The whole genome (sorted keys, type-tagged values, nothing excluded), '|', then the ordered lineage
 * as a JSON array. JSON keeps the lineage unambiguous ([] vs [''], ['a>b'] vs ['a','b']); permanent.
 */
export function identityKey(genome: Readonly<Record<string, unknown>>, lineage: readonly string[]): string {
  return JSON.stringify(stableNode(genome, new Set())) + '|' + JSON.stringify(lineage);
}

/*
 * Seed fold, fixed forever for renderer version 1: take the string
 * identity + '\u0000' + name + '\u0000' + rendererVersion, start h at 0, and for each
 * UTF-16 code unit at index i set h = hashInt(h, codeUnit, i). The final h
 * (an unsigned 32-bit integer) is the mulberry32 seed. Do not change it.
 */
function foldSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = hashInt(h, text.charCodeAt(i), i);
  return h;
}

/** A separate seeded stream per (identity, name, rendererVersion); each call returns the next value in [0, 1). */
export function artStream(identity: string, name: string, rendererVersion: number): () => number {
  return mulberry32(foldSeed(identity + '\u0000' + name + '\u0000' + rendererVersion));
}

/** An integer in 0..count-1. The one place a stream's fraction is turned into an integer. */
export function pick(stream: () => number, count: number): number {
  return Math.floor(stream() * count);
}
