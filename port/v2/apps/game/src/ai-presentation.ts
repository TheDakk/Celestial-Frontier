/** Coalesce progress redraws while preserving the exact AI control, including job identity. */
export function createAiPresentationRefresh(render: () => void): () => void {
  let queued = false;
  return () => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const active = document.activeElement as HTMLElement | null;
      const action = active?.dataset.aiAct, job = active?.dataset.aiJob;
      const panel = active?.closest('#survey, #notificationpanel');
      render();
      if (action !== undefined && panel) {
        const next = [...panel.querySelectorAll<HTMLElement>('[data-ai-act]')]
          .find(node => node.dataset.aiAct === action && node.dataset.aiJob === job && !node.hasAttribute('disabled'));
        next?.focus({ preventScroll: true });
      }
    });
  };
}
export function isAiActionTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-ai-act]') !== null;
}
