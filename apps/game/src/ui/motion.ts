/** Whether motion is reduced: the stored mode is -1 (follow the device), 0 (full) or 1 (reduced). */
export function motionReduced(motionMode: number, devicePrefersReduced: boolean): boolean {
  return motionMode === -1 ? devicePrefersReduced : motionMode !== 0;
}

/** Sets data-motion on the root to `reduced` or `full`. */
export function applyMotion(root: HTMLElement, reduced: boolean): void {
  root.dataset.motion = reduced ? 'reduced' : 'full';
}
