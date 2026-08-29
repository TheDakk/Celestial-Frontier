export type PwaReloadStage = 'preflight' | 'claim' | 'active-persist' | 'checkpoint';

export type PwaReloadOutcome = Readonly<
  | { kind: 'scheduled' }
  | { kind: 'refused'; stage: PwaReloadStage; detail: string }
>;

export interface PwaReloadCoordinator<Claim> {
  /** Rechecked synchronously before any replacement ownership is acquired. */
  conflict(): string | null;
  claim(): Claim | null;
  /** Read only after claim, so the claim prevents a new persistence owner. */
  activePersist(): Promise<boolean> | null;
  checkpointRequired(claim: Claim): boolean;
  checkpoint(claim: Claim): Promise<boolean>;
  /** Main's release owner also rearms a canceled settings debounce. */
  release(claim: Claim): void;
  schedule(claim: Claim): void;
}

/**
 * Cross an installed-build reload only after the outgoing document's save
 * boundary is durable. The coordinator owns ordering; Main retains all app,
 * renderer, F4, and player-facing policy through injected exact owners.
 */
export async function coordinatePwaReload<Claim>(
  coordinator: PwaReloadCoordinator<Claim>,
): Promise<PwaReloadOutcome> {
  const conflict = coordinator.conflict();
  if (conflict !== null) {
    return Object.freeze({ kind: 'refused', stage: 'preflight', detail: conflict });
  }

  const claim = coordinator.claim();
  if (claim === null) {
    return Object.freeze({ kind: 'refused', stage: 'claim', detail: 'replacement-owned' });
  }

  const activePersist = coordinator.activePersist();
  if (activePersist !== null) {
    let durable = false;
    try { durable = await activePersist; }
    catch { durable = false; }
    if (!durable) {
      coordinator.release(claim);
      return Object.freeze({ kind: 'refused', stage: 'active-persist', detail: 'save-not-durable' });
    }
  }

  if (coordinator.checkpointRequired(claim)) {
    let durable = false;
    try { durable = await coordinator.checkpoint(claim); }
    catch { durable = false; }
    if (!durable) {
      coordinator.release(claim);
      return Object.freeze({ kind: 'refused', stage: 'checkpoint', detail: 'save-not-durable' });
    }
  }

  coordinator.schedule(claim);
  return Object.freeze({ kind: 'scheduled' });
}
