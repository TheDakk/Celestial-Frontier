/* A reload into another build of the app is a reload the player asked for, and it still waits for the save:
   the page that leaves must have stored what it holds. This owns the order only; the page gives it the save. */

export type ReloadOutcome =
  | { kind: 'scheduled' }
  | { kind: 'refused'; stage: 'preflight' | 'claim' | 'save'; detail: string };

export interface ReloadCoordinator {
  /** Why the page may not change builds now, or null. Asked before anything is touched. */
  conflict(): 'replacement' | 'save-authority' | null;
  /** Resolves true when the page's state is stored. */
  store(): Promise<boolean>;
  /** Gives up the save and reloads. */
  schedule(): void;
}

/** One reload at most: a second request while the first is storing is refused, and a refusal reloads nothing. */
export function createReloadCoordinator(coordinator: ReloadCoordinator): () => Promise<ReloadOutcome> {
  let claimed = false;
  return async () => {
    const conflict = coordinator.conflict();
    if (conflict !== null) return { kind: 'refused', stage: 'preflight', detail: conflict };
    if (claimed) return { kind: 'refused', stage: 'claim', detail: 'reload-owned' };
    claimed = true;
    let stored = false;
    try { stored = await coordinator.store(); } catch { stored = false; }
    if (!stored) {
      claimed = false;
      return { kind: 'refused', stage: 'save', detail: 'save-not-durable' };
    }
    coordinator.schedule();
    return { kind: 'scheduled' };
  };
}

/** What the player is told when a reload is refused. */
export function reloadRefusalWords(outcome: Extract<ReloadOutcome, { kind: 'refused' }>): { title: string; text: string; force: boolean } {
  if (outcome.stage === 'preflight') {
    return {
      title: 'Reload held safely',
      text: outcome.detail === 'replacement'
        ? 'Finish bringing the expedition before changing builds.'
        : 'The current save authority is already converging or protected. Let its reload finish before changing builds.',
      force: false,
    };
  }
  if (outcome.stage === 'claim') return { title: 'Reload already underway', text: 'Finish the current expedition replacement before changing builds.', force: false };
  return { title: 'Save not yet durable', text: 'The build was not changed. Try Reload when ready again after storage settles.', force: true };
}
