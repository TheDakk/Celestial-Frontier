/**
 * One owner of a scheduled frame. A burst of requests asks for one frame; the owner reads its inputs only when
 * that frame runs. The handle is cleared before `run`, so work done in the frame can ask for one more.
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
