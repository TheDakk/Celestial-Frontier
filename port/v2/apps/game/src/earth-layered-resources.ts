export type EarthLayerResourceV1 = {
  canvas: { width: number; height: number };
  lease: { released: boolean; release(): boolean } | null;
};

/** A live display lease may still read its canvas. Release that lease before
 * shrinking the backing store, and keep failed entries reachable for retry.
 * Each entry retires independently so one failure cannot strand its siblings. */
export function retireEarthLayerResourcesV1<T extends EarthLayerResourceV1>(
  entries: readonly T[],
): { retained: T[]; errors: unknown[] } {
  const retained: T[] = [], errors: unknown[] = [];
  for (const entry of entries) {
    try {
      if (entry.lease && !entry.lease.released) entry.lease.release();
      if (entry.lease && !entry.lease.released) {
        throw new Error('Earth layer lease remains active after release');
      }
      entry.canvas.width = 1;
      entry.canvas.height = 1;
    } catch (error) {
      retained.push(entry);
      errors.push(error);
    }
  }
  return { retained, errors };
}
