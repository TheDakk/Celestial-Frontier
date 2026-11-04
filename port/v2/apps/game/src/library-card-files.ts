/** FINISH F4 (2026-11-04): the LIBRARY card files table (`CARD_LIBRARY_FILES`), held compactly. A library archetype's card files follow
 * one rule — the shipped files (+ its markings, when it has them) served at `<served>cards/<key>/<file>` — so the generated module
 * (painted-cards.assets.ts, from tools/morph/build-card-masters.mjs) lists only the keys and the few markings, and this read-only map
 * derives each archetype's record when asked. At 382 delivered archetypes a literal table held ~150 KB of eager strings on the phone
 * Compendium path; this holds the key list. The map's observable contents are exactly what the literal table had. */
export function libraryCardFilesV1(
  root: string, served: string, keys: readonly string[], shipped: readonly string[], markings: Readonly<Record<string, readonly string[]>>,
): ReadonlyMap<string, Readonly<Record<string, string>>> {
  const set = new Set(keys);
  if (set.size !== keys.length) throw new Error('library card files: duplicate key');
  const keyOf = (dir: string): string | null => {
    if (!dir.startsWith(root) || !dir.endsWith('/')) return null;
    const key = dir.slice(root.length, -1); return set.has(key) ? key : null;
  };
  const record = (key: string): Readonly<Record<string, string>> =>
    Object.freeze(Object.fromEntries([...shipped, ...(markings[key] ?? [])].map((f) => [f, `${served}cards/${key}/${f}`])));
  type Files = Readonly<Record<string, string>>;
  /* a read-only Map look-alike: generators stand in for MapIterator (its toStringTag is irrelevant here) */
  const map = {
    get size() { return set.size; },
    has: (dir: string) => keyOf(dir) !== null,
    get: (dir: string) => { const k = keyOf(dir); return k === null ? undefined : record(k); },
    *keys() { for (const k of keys) yield root + k + '/'; },
    *values() { for (const k of keys) yield record(k); },
    *entries() { for (const k of keys) yield [root + k + '/', record(k)] as [string, Files]; },
    forEach(cb: (value: Files, key: string, m: ReadonlyMap<string, Files>) => void, thisArg?: unknown) { for (const k of keys) cb.call(thisArg, record(k), root + k + '/', map as unknown as ReadonlyMap<string, Files>); },
    [Symbol.iterator]() { return map.entries(); },
  };
  return Object.freeze(map) as unknown as ReadonlyMap<string, Files>;
}
