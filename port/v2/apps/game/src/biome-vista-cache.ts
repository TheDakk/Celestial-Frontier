/* App-owned cache publication for the lazy biome vista. A canvas is reusable
   only after its Pixi mount succeeds; a failed cached mount is evicted so the
   same poisoned entry cannot fail every later visit. */

export type BiomeVistaCacheMountOutcomeV1 = 'miss' | 'mounted' | 'fault';

export interface BiomeVistaCacheOwnerV1<Canvas> {
  readonly cache: Map<string, Canvas>;
  readonly mount: (canvas: Canvas) => void;
  readonly dispose: (canvas: Canvas) => void;
}

export function mountCachedBiomeVistaV1<Canvas>(
  owner: BiomeVistaCacheOwnerV1<Canvas>,
  key: string,
): BiomeVistaCacheMountOutcomeV1 {
  const cached = owner.cache.get(key);
  if (cached === undefined) return 'miss';
  try {
    owner.mount(cached);
  } catch {
    owner.cache.delete(key);
    try { owner.dispose(cached); } catch { /* fail-soft disposal */ }
    return 'fault';
  }
  owner.cache.delete(key);
  owner.cache.set(key, cached);
  return 'mounted';
}

export function mountAndCommitBiomeVistaV1<Canvas>(
  owner: BiomeVistaCacheOwnerV1<Canvas>,
  key: string,
  canvas: Canvas,
): Exclude<BiomeVistaCacheMountOutcomeV1, 'miss'> {
  try {
    owner.mount(canvas);
  } catch {
    try { owner.dispose(canvas); } catch { /* fail-soft disposal */ }
    return 'fault';
  }
  for (const previous of owner.cache.values()) {
    try { owner.dispose(previous); } catch { /* fail-soft disposal */ }
  }
  owner.cache.clear();
  owner.cache.set(key, canvas);
  return 'mounted';
}
