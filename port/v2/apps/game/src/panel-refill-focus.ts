/** Preserve only the focus owned immediately before a synchronous panel refill.
 * Call the returned closure in the same stack, after disabled states are applied.
 * This is not an async action's permission to reclaim focus from a later user move.
 */
export function capturePanelRefillFocus(
  root: HTMLElement,
  keys: readonly string[],
): () => void {
  const doc = root.ownerDocument;
  const active = doc.activeElement;
  if (active === null || active === root || !root.contains(active)) return () => {};
  const identity = ['id', 'data-pnx', ...keys]
    .filter((key) => active.hasAttribute(key))
    .map((key) => [key, active.getAttribute(key)] as const);
  let consumed = false;
  return () => {
    if (consumed) return;
    consumed = true;
    if (!root.isConnected || root.closest('[hidden],[inert],[aria-hidden="true"]')) return;
    // A surviving node or a different focused control owns its own continuation.
    if (active.isConnected || (doc.activeElement !== doc.body && doc.activeElement !== null)) return;
    const matches = identity.length === 0 ? []
      : [...root.querySelectorAll<HTMLElement>('button,input,select,textarea,a,[tabindex]')]
        .filter((candidate) => candidate.tagName === active.tagName
          && identity.every(([key, value]) => candidate.getAttribute(key) === value));
    const available = (candidate: HTMLElement | null): candidate is HTMLElement => candidate !== null
      && !candidate.matches(':disabled,[aria-disabled="true"]')
      && !candidate.closest('[hidden],[inert],[aria-hidden="true"]');
    const target = matches.length === 1 && available(matches[0]!) ? matches[0]!
      : root.querySelector<HTMLElement>('[data-pnx]');
    if (available(target)) target.focus({ preventScroll: true });
  };
}
