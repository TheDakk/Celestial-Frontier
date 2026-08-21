/* Species portrait identity — environment-neutral and safe in Window, Worker,
   Node, and Vitest. A seed is not a complete bred-genome identity: reversed
   parents and lineage metadata can retain different visible traits. */

declare const speciesVisualKeyBrand: unique symbol;
export type SpeciesVisualKey = string & { readonly [speciesVisualKeyBrand]: true };

function stableGenomeNode(value: unknown, ancestors: Set<object>): unknown {
  if (value === null) return ['null'];
  if (value === undefined) return ['undefined'];
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError('cyclic genome cache value');
    ancestors.add(value);
    const result = ['array', value.map((item) => stableGenomeNode(item, ancestors))];
    ancestors.delete(value);
    return result;
  }
  if (typeof value === 'object') {
    if (ancestors.has(value)) throw new TypeError('cyclic genome cache value');
    ancestors.add(value);
    const object = value as Record<string, unknown>;
    const result = ['object', Object.keys(object).sort()
      .map((key) => [key, stableGenomeNode(object[key], ancestors)])];
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
  throw new TypeError(`unsupported genome cache value: ${typeof value}`);
}

export function speciesVisualKey(genome: Record<string, unknown>): SpeciesVisualKey {
  return JSON.stringify(stableGenomeNode(genome, new Set())) as SpeciesVisualKey;
}

function snapshotGenomeNode(value: unknown, ancestors: Set<object>): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError('cyclic genome cache value');
    ancestors.add(value);
    const result = value.map((item) => snapshotGenomeNode(item, ancestors));
    ancestors.delete(value);
    return result;
  }
  if (typeof value === 'object') {
    if (ancestors.has(value)) throw new TypeError('cyclic genome cache value');
    ancestors.add(value);
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      result[key] = snapshotGenomeNode(source[key], ancestors);
    }
    ancestors.delete(value);
    return result;
  }
  if (typeof value === 'function' || typeof value === 'symbol') {
    throw new TypeError(`unsupported genome cache value: ${typeof value}`);
  }
  return value;
}

/** Detach queued work from subsequent app mutations while preserving the
 * canonical fields and primitive values consumed by the production painter. */
export function snapshotSpeciesGenome(
  genome: Record<string, unknown>,
): Record<string, unknown> {
  return snapshotGenomeNode(genome, new Set()) as Record<string, unknown>;
}
