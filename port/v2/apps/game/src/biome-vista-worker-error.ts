/* Fail-soft containment for a browser Worker error event. Preventing the
   default is what keeps an already-handled worker startup/import fault from
   surfacing again as an uncaught Window error; cleanup remains mandatory even
   if diagnostic bookkeeping fails. */

export interface BiomeVistaWorkerErrorOwnerV1 {
  readonly stale: () => boolean;
  readonly noteFault: () => void;
  readonly finish: () => void;
}

export function containBiomeVistaWorkerErrorV1(
  event: Pick<Event, 'preventDefault'>,
  owner: BiomeVistaWorkerErrorOwnerV1,
): void {
  try {
    event.preventDefault();
  } finally {
    try {
      if (!owner.stale()) owner.noteFault();
    } finally {
      owner.finish();
    }
  }
}
