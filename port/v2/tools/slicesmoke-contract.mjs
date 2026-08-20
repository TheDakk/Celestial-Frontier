/* Browser-free semantic decisions shared by the real slice smoke and its
   report selftest. The driver polls only while this function says the owned
   Planetside work can still settle; it never treats a fixed delay or a long
   src string as publication evidence. */

const safeInt = (value) => Number.isSafeInteger(value) && value >= 0;
const nonEmptyString = (value) => typeof value === 'string' && value.length > 0;

/* A rendering-opportunity-owned outcome is evidence only while the exact page
   target and document are foregrounded and have crossed both halves of the
   production scheduler (rAF, then a later task). Runtime.evaluate can still
   answer for a background page whose rAF queue is intentionally paused, so
   target command success alone is not foreground authority. */
export function classifyForegroundServiceTurn(observation, expected) {
  if (!expected || typeof expected !== 'object'
    || !nonEmptyString(expected.targetId)
    || !nonEmptyString(expected.documentToken)
    || !nonEmptyString(expected.serviceToken)) {
    throw new TypeError('foreground service authority requires exact target, document, and service tokens');
  }
  if (!observation || typeof observation !== 'object') {
    return { status: 'error', reasons: ['foreground observation absent'] };
  }
  const errors = [];
  const pending = [];
  if (observation.targetId !== expected.targetId) {
    errors.push(`target identity ${JSON.stringify(observation.targetId)}`);
  }
  if (observation.documentToken !== expected.documentToken) {
    errors.push(`document identity ${JSON.stringify(observation.documentToken)}`);
  }
  if (observation.visibilityState !== 'visible' || observation.hidden !== false) {
    errors.push(`page visibility ${JSON.stringify(observation.visibilityState)}/${JSON.stringify(observation.hidden)}`);
  }
  if (observation.focused !== true) errors.push('page unfocused');
  const service = observation.service;
  if (!service || typeof service !== 'object') errors.push('service witness absent');
  else {
    if (service.token !== expected.serviceToken) {
      errors.push(`service identity ${JSON.stringify(service.token)}`);
    }
    if (!safeInt(service.visibilityChanges)) errors.push('visibility change count invalid');
    else if (service.visibilityChanges !== 0) {
      errors.push(`visibility changed ${service.visibilityChanges} time(s)`);
    }
    if (!safeInt(service.focusLosses)) errors.push('focus loss count invalid');
    else if (service.focusLosses !== 0) errors.push(`focus lost ${service.focusLosses} time(s)`);
    if (service.laterTask === true && service.raf !== true) errors.push('service phase order');
    for (const [phase, serviced, visibilityState, hidden, focused] of [
      ['arm', true, service.armVisibilityState, service.armHidden, service.armFocused],
      ['rendering opportunity', service.raf, service.rafVisibilityState, service.rafHidden, service.rafFocused],
      ['later task', service.laterTask, service.laterVisibilityState, service.laterHidden, service.laterFocused],
    ]) {
      if (serviced !== true) {
        pending.push(`${phase} pending`);
        continue;
      }
      if (visibilityState !== 'visible' || hidden !== false) {
        errors.push(`${phase} visibility ${JSON.stringify(visibilityState)}/${JSON.stringify(hidden)}`);
      }
      if (focused !== true) errors.push(`${phase} unfocused`);
    }
  }
  if (errors.length) return { status: 'error', reasons: [...errors, ...pending] };
  if (pending.length) return { status: 'pending', reasons: pending };
  return { status: 'ready', reasons: [] };
}

export function classifyForegroundServiceTurnReceipt(
  observation, expected, deadlineMs, receivedAtMs,
) {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(receivedAtMs)) {
    throw new TypeError('foreground service receipt requires finite monotonic times');
  }
  const decision = classifyForegroundServiceTurn(observation, expected);
  if (receivedAtMs < deadlineMs) return decision;
  return {
    status: 'error',
    reasons: [
      `foreground observation received at/after deadline (${receivedAtMs} >= ${deadlineMs})`,
      ...decision.reasons,
    ],
  };
}

export function planetsidePhaseRemainingMs(deadlineMs, nowMs) {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(nowMs)) {
    throw new TypeError('Planetside phase deadline and monotonic observation must be finite');
  }
  return Math.max(0, Math.floor(deadlineMs - nowMs));
}

export function planetsideRuntimeTimeoutDecision(error, phaseTimeoutMs) {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (!/(?:^|: )timed out waiting for Runtime\.evaluate$/.test(message)) return null;
  if (!Number.isInteger(phaseTimeoutMs) || phaseTimeoutMs <= 0) {
    throw new TypeError('Planetside phase timeout must be a positive integer');
  }
  return {
    status: 'pending',
    reasons: [`phase deadline expired during target observation (${phaseTimeoutMs}ms)`],
  };
}

export function classifyPlanetsideSettlement(observation) {
  const reasons = [];
  if (!observation || typeof observation !== 'object') {
    return { status: 'pending', reasons: ['observation absent'] };
  }
  if (observation.on !== true) reasons.push('surface hidden');
  if (!safeInt(observation.n) || observation.n < 3 || observation.n > 8) {
    reasons.push(`roster count ${JSON.stringify(observation.n)}`);
  }
  if (!Array.isArray(observation.images) || observation.images.length !== observation.n) {
    reasons.push(`image count ${JSON.stringify(observation.images?.length)}`);
  }
  const images = Array.isArray(observation.images) ? observation.images : [];
  const terminal = [];
  images.forEach((image, index) => {
    if (!image || typeof image !== 'object') {
      terminal.push(`image ${index} shape`);
      return;
    }
    if (image.state === 'error') terminal.push(`image ${index} producer error`);
    else if (image.state === 'placeholder') reasons.push(`image ${index} placeholder`);
    else if (image.state !== 'ready') terminal.push(`image ${index} state ${JSON.stringify(image.state)}`);
    if (image.state === 'ready') {
      if (image.hasSrc !== true) terminal.push(`image ${index} ready without src`);
      if (image.complete !== true) reasons.push(`image ${index} decode pending`);
      if (image.complete === true && (image.naturalWidth !== 132 || image.naturalHeight !== 132)) {
        terminal.push(`image ${index} dimensions ${image.naturalWidth}x${image.naturalHeight}`);
      }
    }
  });
  if (terminal.length) return { status: 'error', reasons: [...reasons, ...terminal] };

  const art = observation.art;
  if (!art || typeof art !== 'object' || !art.live || typeof art.live !== 'object') {
    reasons.push('art diagnostics absent');
  } else {
    if (!safeInt(art.live.queuedJobs)) reasons.push('queuedJobs invalid');
    else if (art.live.queuedJobs !== 0) reasons.push(`queuedJobs ${art.live.queuedJobs}`);
    if (!safeInt(art.live.activeJobs)) reasons.push('activeJobs invalid');
    else if (art.live.activeJobs !== 0) reasons.push(`activeJobs ${art.live.activeJobs}`);
  }
  const allReady = images.length === observation.n && images.length >= 3
    && images.every((image) => image?.state === 'ready' && image.hasSrc === true
      && image.complete === true && image.naturalWidth === 132 && image.naturalHeight === 132);
  return {
    status: reasons.length === 0 && allReady ? 'ready' : 'pending',
    reasons,
  };
}
