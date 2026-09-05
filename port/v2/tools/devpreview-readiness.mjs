/* Observe ordinary rendered product UI; a human preview must not need the
   diagnostic API that exists only in an explicitly selected evidence build.
   Keep this function self-contained: its source also runs in the browser. */
export function developmentPreviewReadiness(document, window) {
  const dev = window.__CF_DEV_PREVIEW__;
  const modes = [...document.querySelectorAll('meta[name="cf-build-mode"]')];
  const distributable = modes.length === 1 && modes[0].content === 'distributable';
  const harnessAbsent = !('__CF_SLICE__' in window);
  const visible = (element) => {
    // Training makes the rendered background inert; inert is not hidden.
    if (!element?.isConnected || element.closest('[hidden],[aria-hidden="true"]')) return false;
    let effectiveOpacity = 1;
    for (let current = element; current; current = current.parentElement) {
      const style = window.getComputedStyle(current);
      if (style.display === 'none' || style.visibility !== 'visible') return false;
      const opacity = Number(style.opacity || '1');
      if (!Number.isFinite(opacity)) return false;
      effectiveOpacity *= opacity;
      // Match the numeric/percentage computed-filter syntax used by Glass.
      const pattern = /opacity\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(%)?\s*\)/giu;
      for (const match of String(style.filter || 'none').matchAll(pattern)) {
        const amount = Number(match[1]) / (match[2] ? 100 : 1);
        if (!Number.isFinite(amount)) return false;
        effectiveOpacity *= Math.max(0, Math.min(1, amount));
      }
      if (!(effectiveOpacity > 0)) return false;
    }
    return element.getClientRects().length > 0;
  };
  const canvas = [...document.querySelectorAll('canvas')]
    .find((element) => element.width > 1 && element.height > 1 && visible(element));
  // These fields are empty in index.html and are populated by the real
  // post-load scene render. A static canvas or prewired Guide button alone
  // is not app readiness; the caller next exercises Guide's real outcome.
  const trail = document.getElementById('trail');
  const player = document.getElementById('playerchip');
  const rendered = visible(trail) && !!trail.textContent.trim()
    && visible(player) && !!player.textContent.trim();
  return {
    ready: !!dev && distributable && harnessAbsent && !!canvas && rendered,
    dev, distributable, harnessAbsent,
    canvasReady: !!canvas, renderedUi: rendered,
    training: document.body.classList.contains('training'),
    trail: trail?.textContent?.trim() ?? '',
    badge: !!document.getElementById('cf-dev-preview-banner'),
    legacyBadge: !!document.getElementById('cf-development-site-banner'),
    badgeStyle: !!document.querySelector('[data-cf-dev-banner-style]'),
    blocked: document.documentElement.dataset.cfPreviewBlocked || null,
  };
}
