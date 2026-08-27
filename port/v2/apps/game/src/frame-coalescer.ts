/**
 * One-owner animation-frame coalescer.
 *
 * Event bursts request work; the owner samples its inputs only when the
 * scheduled frame runs. Clearing the handle before `run` also permits work
 * performed by that frame to request one later frame without being dropped.
 */
export interface FrameCoalescer {
  readonly request: () => void;
  readonly cancel: () => void;
  readonly pending: () => boolean;
}

export function createFrameCoalescer(
  schedule: (callback: () => void) => number,
  cancelScheduled: (handle: number) => void,
  run: () => void,
): FrameCoalescer {
  let handle: number | null = null;

  const request = (): void => {
    if (handle !== null) return;
    handle = schedule(() => {
      handle = null;
      run();
    });
  };

  const cancel = (): void => {
    if (handle === null) return;
    cancelScheduled(handle);
    handle = null;
  };

  return Object.freeze({ request, cancel, pending: () => handle !== null });
}
