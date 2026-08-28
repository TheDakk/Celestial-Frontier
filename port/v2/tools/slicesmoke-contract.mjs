/* Browser-free semantic decisions shared by the real slice smoke and its
   report selftest. The driver polls only while these functions say the owned
   image work can still settle; it never treats a fixed delay or a long src
   string alone as publication evidence. */

const safeInt = (value) => Number.isSafeInteger(value) && value >= 0;
const nonEmptyString = (value) => typeof value === 'string' && value.length > 0;
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

/* A scrollable Inventory row is reachable only after the harness performs
   the same reveal a player needs and then samples the real centre hit. A
   row's un-clipped DOMRect can be tall and well-formed while its centre is
   below the panel scrollport, so geometry without clip + hit ownership is
   not interaction evidence. */
export function assessInventoryRowReachability(observation, expectedInstanceId) {
  if (!nonEmptyString(expectedInstanceId)) {
    throw new TypeError('Inventory row reachability requires one exact instance id');
  }
  if (!observation || typeof observation !== 'object') {
    return { ok: false, reasons: ['reachability observation absent'] };
  }
  const reasons = [];
  if (observation.instanceId !== expectedInstanceId) reasons.push('exact row identity');
  if (observation.present !== true || observation.connected !== true) reasons.push('connected row');
  if (observation.tag !== 'BUTTON' || observation.disabled !== false
    || observation.ariaDisabled === 'true') reasons.push('actionable row');
  if (observation.panelId !== 'inventorypanel' || observation.panelOwnsRow !== true) {
    reasons.push('Inventory scroll owner');
  }
  if (observation.scrollRequested !== true) reasons.push('real row reveal request');
  const before = observation.before;
  const after = observation.after;
  const clip = observation.clip;
  const viewport = observation.viewport;
  if (!before || typeof before !== 'object' || typeof before.hitOwned !== 'boolean'
    || !Number.isFinite(before.scrollTop) || !Number.isFinite(before.x) || !Number.isFinite(before.y)) {
    reasons.push('pre-reveal observation');
  }
  if (!after || typeof after !== 'object'
    || !Number.isFinite(after.scrollTop) || !Number.isFinite(after.x) || !Number.isFinite(after.y)
    || !Number.isFinite(after.width) || !Number.isFinite(after.height)) {
    reasons.push('post-reveal observation');
  } else {
    if (after.width <= 0 || after.height < 44) reasons.push('44px row geometry');
    if (after.hitOwned !== true) reasons.push('centre hit ownership');
  }
  if (!clip || typeof clip !== 'object'
    || !Number.isFinite(clip.left) || !Number.isFinite(clip.top)
    || !Number.isFinite(clip.right) || !Number.isFinite(clip.bottom)
    || clip.right <= clip.left || clip.bottom <= clip.top
    || !viewport || typeof viewport !== 'object'
    || !Number.isFinite(viewport.width) || !Number.isFinite(viewport.height)
    || viewport.width <= 0 || viewport.height <= 0) {
    reasons.push('scrollport geometry');
  } else if (after && Number.isFinite(after.x) && Number.isFinite(after.y)) {
    const left = Math.max(0, clip.left);
    const top = Math.max(0, clip.top);
    const right = Math.min(viewport.width, clip.right);
    const bottom = Math.min(viewport.height, clip.bottom);
    if (right <= left || bottom <= top
      || after.x < left || after.x >= right || after.y < top || after.y >= bottom) {
      reasons.push('centre inside visible scrollport');
    }
  }
  if (before && after && before.hitOwned === false
    && Number.isFinite(before.scrollTop) && Number.isFinite(after.scrollTop)
    && Math.abs(after.scrollTop - before.scrollTop) < 0.5) {
    reasons.push('offscreen row reveal movement');
  }
  return { ok: reasons.length === 0, reasons };
}

const INVENTORY_STAGE_REQUIREMENTS = Object.freeze({
  surface: Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
  ]),
  action: Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
    ['surfaceGreen', 'surface outcome green'],
  ]),
  'action-controls': Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
    ['surfaceGreen', 'surface outcome green'],
    ['actionPointGreen', 'action target reachable'],
    ['actionSettled', 'action commit settled'],
    ['actionGreen', 'action outcome green'],
  ]),
  reload: Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
    ['surfaceGreen', 'surface outcome green'],
    ['actionPointGreen', 'action target reachable'],
    ['actionSettled', 'action commit settled'],
    ['actionGreen', 'action outcome green'],
    ['actionClosed', 'committed detail closed'],
  ]),
});

/* Later Inventory outcomes are meaningful only when their complete causal
   prefix is green. This keeps one missed row from masquerading as modal,
   action, persistence and Atlas regressions, and keeps mutation controls off
   a red base where every mutant would pass vacuously. */
export function assessInventoryStagePrefix(stage, evidence) {
  const requirements = INVENTORY_STAGE_REQUIREMENTS[stage];
  if (!requirements) throw new TypeError(`Unknown Inventory stage ${JSON.stringify(stage)}`);
  const reasons = [];
  for (const [key, diagnosis] of requirements) {
    if (evidence?.[key] !== true) reasons.push(diagnosis);
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessInventoryActionActivation(observation, expectedInstanceId) {
  if (!nonEmptyString(expectedInstanceId)) {
    throw new TypeError('Inventory action activation requires one exact instance id');
  }
  const reasons = [];
  const point = observation?.point;
  const interaction = observation?.interaction;
  if (!point || point.ok !== true || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || !Number.isFinite(point.height) || point.height < 44) reasons.push('action target point');
  if (!interaction || interaction.pressCount !== 1 || interaction.operation !== 'equip'
    || interaction.instanceId !== expectedInstanceId || interaction.tag !== 'BUTTON'
    || interaction.trusted !== true || interaction.pointerType !== 'mouse'
    || !Number.isFinite(interaction.x) || !Number.isFinite(interaction.y)) {
    reasons.push('trusted action pointer');
  } else if (point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (Math.abs(interaction.x - point.x) > 0.75 || Math.abs(interaction.y - point.y) > 0.75)) {
    reasons.push('action point/receipt binding');
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessInventoryRowActivation(observation, expectedInstanceId) {
  if (!nonEmptyString(expectedInstanceId)) {
    throw new TypeError('Inventory row activation requires one exact instance id');
  }
  const reasons = [];
  const point = observation?.point;
  const pointer = observation?.pointer;
  if (!point || point.hitOwned !== true || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    reasons.push('row target point');
  }
  if (!pointer || pointer.instanceId !== expectedInstanceId || pointer.tag !== 'BUTTON'
    || pointer.trusted !== true || pointer.pointerType !== 'mouse'
    || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) {
    reasons.push('trusted row pointer');
  } else if (point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (Math.abs(pointer.x - point.x) > 0.75 || Math.abs(pointer.y - point.y) > 0.75)) {
    reasons.push('row point/receipt binding');
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessInventoryDetailClose(observation, expectedInstanceId) {
  if (!nonEmptyString(expectedInstanceId)) {
    throw new TypeError('Inventory detail Close requires one exact focus-return instance id');
  }
  const reasons = [];
  const point = observation?.point;
  const pointer = observation?.pointer;
  if (!point || point.ok !== true || point.tag !== 'BUTTON' || point.owner !== 'inventory-sheet'
    || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || !Number.isFinite(point.width) || point.width < 44
    || !Number.isFinite(point.height) || point.height < 44) reasons.push('Close target point');
  if (!pointer || pointer.tag !== 'BUTTON' || pointer.closeOwner !== 'inventory-sheet'
    || pointer.trusted !== true || pointer.pointerType !== 'mouse'
    || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) reasons.push('trusted Close pointer');
  else if (point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (Math.abs(pointer.x - point.x) > 0.75 || Math.abs(pointer.y - point.y) > 0.75)) {
    reasons.push('Close point/receipt binding');
  }
  const closed = observation?.closed;
  if (!closed || closed.sheetPresent !== true || closed.open !== false
    || closed.hidden !== true || closed.ariaHidden !== 'true' || closed.bodyChildren !== 0
    || closed.focusInstanceId !== expectedInstanceId || closed.panelPresent !== true
    || closed.panelDisplay !== 'block' || closed.panelAriaHidden !== 'false'
    || closed.panelOpen !== 'inventory' || closed.openerPresent !== true
    || closed.inventoryExpanded !== 'true' || closed.panelInert !== false
    || closed.diagnostics?.activeCount !== 0 || closed.diagnostics?.retainedCount !== 0
    || closed.diagnostics?.pendingWork !== 0 || closed.diagnostics?.selectedInstanceId !== null) {
    reasons.push('closed focus/zero ownership');
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessInventoryPanelClose(observation) {
  const reasons = [];
  const point = observation?.point;
  const pointer = observation?.pointer;
  if (!point || point.ok !== true || point.owner !== 'inventory' || point.tag !== 'BUTTON'
    || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || !Number.isFinite(point.width) || point.width < 44
    || !Number.isFinite(point.height) || point.height < 44) reasons.push('panel Close target point');
  if (!pointer || pointer.tag !== 'BUTTON' || pointer.panelCloseOwner !== 'inventory'
    || pointer.trusted !== true || pointer.pointerType !== 'mouse'
    || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) {
    reasons.push('trusted panel Close pointer');
  } else if (point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (Math.abs(pointer.x - point.x) > 0.75 || Math.abs(pointer.y - point.y) > 0.75)) {
    reasons.push('panel Close point/receipt binding');
  }
  const settled = observation?.settled;
  if (!settled || settled.panelPresent !== true || settled.display !== 'none'
    || settled.ariaHidden !== 'true' || settled.openerPresent !== true
    || settled.panelOpen !== null || settled.inventoryExpanded !== 'false'
    || settled.focusId !== 'railinventory' || settled.diagnostics?.activeCount !== 0
    || settled.diagnostics?.retainedCount !== 0 || settled.diagnostics?.pendingWork !== 0
    || settled.diagnostics?.selectedInstanceId !== null) {
    reasons.push('closed panel/focus/zero ownership');
  }
  return { ok: reasons.length === 0, reasons };
}

/* A carrier surviving reload does not prove that the transaction receipt or
   its F4 authority survived. Compare the full receipt store at three distinct
   levels (keys, exact raw bytes, parsed semantics), then bind the exact Equip
   receipt to the pre-commit ordinal. Only SessionRNG is stable across the
   document boundary: activePlayMs, revisions, commits, lease state and tokens
   may advance through legitimate receipt-free checkpoints. */
export function assessInventoryReloadDurability(observation, expectedInstanceId, expectedInventoryRevision) {
  if (!nonEmptyString(expectedInstanceId) || !safeInt(expectedInventoryRevision)) {
    throw new TypeError('Inventory reload durability requires one exact instance id and inventory revision');
  }
  const committed = observation?.committed;
  const reloaded = observation?.reloaded;
  const committedRuntime = observation?.committedRuntime;
  const reloadedRuntime = observation?.reloadedRuntime;
  const committedKeys = Array.isArray(committed?.receiptKeys) ? committed.receiptKeys : [];
  const reloadedKeys = Array.isArray(reloaded?.receiptKeys) ? reloaded.receiptKeys : [];
  const coherentReceiptRows = (evidence, keys) => keys.every((key, index) => {
    const raw = evidence?.receiptRawRows?.[index];
    const row = evidence?.receiptRows?.[index];
    if (!nonEmptyString(key) || typeof raw !== 'string' || !row || typeof row !== 'object'
      || Array.isArray(row) || !safeInt(row.ordinal) || key !== `receipt:${row.ordinal}`) return false;
    try { return canonicalJson(JSON.parse(raw)) === canonicalJson(row); }
    catch { return false; }
  });
  const receiptEvidenceComplete = committedKeys.length >= 2 && reloadedKeys.length >= 2
    && committedKeys.length === committed?.receiptRawRows?.length
    && committedKeys.length === committed?.receiptRows?.length
    && reloadedKeys.length === reloaded?.receiptRawRows?.length
    && reloadedKeys.length === reloaded?.receiptRows?.length
    && new Set(committedKeys).size === committedKeys.length
    && new Set(reloadedKeys).size === reloadedKeys.length
    && coherentReceiptRows(committed, committedKeys)
    && coherentReceiptRows(reloaded, reloadedKeys);
  const committedRng = committed?.authority?.sessionRng;
  const reloadedRng = reloaded?.authority?.sessionRng;
  const rngProjection = (rng) => canonicalJson({
    seed: rng?.seed,
    ordinal: rng?.ordinal,
    draws: rng?.draws,
  });
  const runtimeProjection = (runtime) => canonicalJson({
    seed: runtime?.sessionSeed,
    ordinal: runtime?.sessionOrdinal,
    draws: runtime?.sessionDraws,
  });
  const expectedReceiptOrdinal = safeInt(committedRng?.ordinal) && committedRng.ordinal > 0
    ? committedRng.ordinal - 1 : null;
  const expectedReceiptKey = expectedReceiptOrdinal === null ? null : `receipt:${expectedReceiptOrdinal}`;
  const committedReceiptIndex = expectedReceiptKey === null ? -1 : committedKeys.indexOf(expectedReceiptKey);
  const reloadedReceiptIndex = expectedReceiptKey === null ? -1 : reloadedKeys.indexOf(expectedReceiptKey);
  const committedReceipt = committedReceiptIndex >= 0 ? committed?.receiptRows?.[committedReceiptIndex] : null;
  const reloadedReceipt = reloadedReceiptIndex >= 0 ? reloaded?.receiptRows?.[reloadedReceiptIndex] : null;
  const expectedWitness = expectedReceiptOrdinal === null ? null
    : `arc2:equip:${expectedReceiptOrdinal}:${expectedInstanceId}:${expectedInventoryRevision}`;
  const drawsAreObjects = !!(committedRng?.draws && typeof committedRng.draws === 'object'
    && !Array.isArray(committedRng.draws) && reloadedRng?.draws && typeof reloadedRng.draws === 'object'
    && !Array.isArray(reloadedRng.draws) && committedRuntime?.sessionDraws
    && typeof committedRuntime.sessionDraws === 'object' && !Array.isArray(committedRuntime.sessionDraws)
    && reloadedRuntime?.sessionDraws && typeof reloadedRuntime.sessionDraws === 'object'
    && !Array.isArray(reloadedRuntime.sessionDraws));
  const seedIsUint32 = safeInt(committedRng?.seed) && committedRng.seed <= 0xFFFF_FFFF;
  const ok = receiptEvidenceComplete
    && canonicalJson(reloadedKeys) === canonicalJson(committedKeys)
    && canonicalJson(reloaded?.receiptRawRows) === canonicalJson(committed?.receiptRawRows)
    && canonicalJson(reloaded?.receiptRows) === canonicalJson(committed?.receiptRows)
    && committed?.authorityVersion === 1 && reloaded?.authorityVersion === 1
    && committed?.authorityJson === JSON.stringify(committed?.authority)
    && reloaded?.authorityJson === JSON.stringify(reloaded?.authority)
    && seedIsUint32 && safeInt(committedRng?.ordinal) && drawsAreObjects
    && rngProjection(reloadedRng) === rngProjection(committedRng)
    && runtimeProjection(committedRuntime) === rngProjection(committedRng)
    && runtimeProjection(reloadedRuntime) === rngProjection(reloadedRng)
    && committedReceiptIndex >= 0 && reloadedReceiptIndex === committedReceiptIndex
    && committedReceipt?.ordinal === expectedReceiptOrdinal
    && reloadedReceipt?.ordinal === expectedReceiptOrdinal
    && committedReceipt?.kind === 'arc2-equip' && reloadedReceipt?.kind === 'arc2-equip'
    && committedReceipt?.witness === expectedWitness && reloadedReceipt?.witness === expectedWitness
    && committed?.receiptRawRows?.[committedReceiptIndex] === JSON.stringify(committedReceipt)
    && reloaded?.receiptRawRows?.[reloadedReceiptIndex] === JSON.stringify(reloadedReceipt);
  return { ok, reasons: ok ? [] : ['durable receipt/F4 authority reload'] };
}

/* A D-TRAIN transaction can only judge the product's busy-refusal branch
   after the harness proves that its exact fixture owns the current document
   and that the real Training action is runnable. Optional-chaining a missing
   button turns setup drift into a false product verdict. */
export function assessTrainingBusyRefusalPrecondition(observation, expected) {
  if (!expected || typeof expected !== 'object'
    || !nonEmptyString(expected.documentToken)
    || !nonEmptyString(expected.primaryRaw)) {
    throw new TypeError('Training busy-refusal precondition requires exact document and primary bytes');
  }
  if (!observation || typeof observation !== 'object') {
    return { ok: false, reasons: ['precondition observation absent'] };
  }
  const reasons = [];
  if (observation.documentToken !== expected.documentToken) reasons.push('document identity');
  if (observation.primaryRaw !== expected.primaryRaw) reasons.push('primary bytes');
  const state = observation.state;
  if (!state || typeof state !== 'object') reasons.push('Training state absent');
  else {
    if (state.tutActive !== true || state.tutDone !== false || state.tutStep !== 'welcome') {
      reasons.push('Training is not runnable at welcome');
    }
    if (state.trainingCheckpointKind !== 'legacy-v1'
      || state.trainingCheckpointWriteHeld !== true
      || !state.tutSnapshotPending || typeof state.tutSnapshotPending !== 'object'
      || Array.isArray(state.tutSnapshotPending)) {
      reasons.push('legacy checkpoint ownership');
    }
    if (state.mode !== 'system' || state.gal !== 999 || state.star !== 424242 || state.planet !== null
      || !nonEmptyString(state.navGalaxyKey) || !nonEmptyString(state.navStarKey)
      || state.navWorldKey !== null) {
      reasons.push('Training route');
    }
    const rendered = state.renderedScene;
    if (!rendered || typeof rendered !== 'object' || rendered.mode !== 'system'
      || !safeInt(rendered.serial) || rendered.serial < 1
      || rendered.galaxyKey !== state.navGalaxyKey || rendered.starKey !== state.navStarKey
      || rendered.worldKey !== null) {
      reasons.push('rendered Training route');
    }
  }
  if (observation.card !== true || observation.trainingBody !== true) reasons.push('Training card');
  const button = observation.button;
  if (!button || typeof button !== 'object' || button.present !== true
    || button.connected !== true || button.disabled !== false || button.visible !== true
    || observation.buttonOwnedByCard !== true) {
    reasons.push('runnable Skip action');
  }
  const status = observation.status;
  if (!status || typeof status !== 'object' || status.present !== true || status.hidden !== true
    || observation.statusOwnedByCard !== true) {
    reasons.push('idle Training status');
  }
  if (observation.tickerStarted !== true) reasons.push('outgoing ticker');
  return { ok: reasons.length === 0, reasons };
}

export function trainingBindingReceiptBeforeDeadline(
  entries, expectedCount, deadlineMs, receivedAtMs,
) {
  if (!Array.isArray(entries) || !Number.isInteger(expectedCount) || expectedCount <= 0
    || !Number.isFinite(deadlineMs) || !Number.isFinite(receivedAtMs)) {
    throw new TypeError('Training binding receipt requires entries, positive count, and finite monotonic times');
  }
  return entries.length >= expectedCount && receivedAtMs < deadlineMs;
}

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

/* Compendium detail is an explicitly asynchronous 440px owner. A connected
   placeholder is expected while the worker crosses its serviced turn, but a
   stale owner, producer error or contradictory ready state is terminal. */
export function classifyCompendiumDetailSettlement(observation, expected) {
  if (!expected || typeof expected !== 'object'
    || !nonEmptyString(expected.documentToken)
    || !safeInt(expected.preEnterGeneration)
    || expected.preEnterGeneration >= Number.MAX_SAFE_INTEGER
    || !nonEmptyString(expected.logicalId)) {
    throw new TypeError('Compendium detail settlement requires exact document, generation and logical owner');
  }
  if (!observation || typeof observation !== 'object') {
    return { status: 'pending', reasons: ['observation absent'] };
  }
  const terminal = [];
  const pending = [];
  if (observation.panelMode !== 'detail' || observation.detailPresent !== true) {
    terminal.push(`detail surface ${JSON.stringify(observation.panelMode)}/${JSON.stringify(observation.detailPresent)}`);
  }
  if (observation.documentToken !== expected.documentToken) {
    terminal.push(`document identity ${JSON.stringify(observation.documentToken)}`);
  }
  if (observation.generation !== expected.preEnterGeneration + 1) {
    terminal.push(`Compendium generation ${JSON.stringify(observation.generation)}`);
  }
  if (observation.logicalId !== expected.logicalId) {
    terminal.push(`logical owner ${JSON.stringify(observation.logicalId)}`);
  }
  const image = observation.image;
  if (!image || typeof image !== 'object' || image.present !== true) {
    terminal.push('detail image absent');
  } else {
    if (image.connected !== true) terminal.push('detail image disconnected');
    if (image.state === 'error') terminal.push('detail portrait producer error');
    else if (image.state === 'placeholder') pending.push('detail portrait placeholder');
    else if (image.state !== 'ready') terminal.push(`detail portrait state ${JSON.stringify(image.state)}`);
    if (image.state === 'ready') {
      if (image.hasSrc !== true) terminal.push('detail portrait ready without src');
      else if (!safeInt(image.srcLength) || image.srcLength <= 5000) {
        terminal.push(`detail portrait src length ${JSON.stringify(image.srcLength)}`);
      }
      if (image.complete !== true) pending.push('detail portrait decode pending');
      if (image.complete === true && (image.naturalWidth !== 440 || image.naturalHeight !== 440)) {
        terminal.push(`detail portrait dimensions ${image.naturalWidth}x${image.naturalHeight}`);
      }
    }
  }
  if (terminal.length) return { status: 'error', reasons: [...pending, ...terminal] };
  if (pending.length) return { status: 'pending', reasons: pending };
  return { status: 'ready', reasons: [] };
}

export function classifyCompendiumDetailReceipt(
  observation, expected, deadlineMs, receivedAtMs,
) {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(receivedAtMs)) {
    throw new TypeError('Compendium detail receipt requires finite monotonic times');
  }
  const decision = classifyCompendiumDetailSettlement(observation, expected);
  if (receivedAtMs < deadlineMs) return decision;
  return {
    status: 'error',
    reasons: [
      `detail observation received at/after deadline (${receivedAtMs} >= ${deadlineMs})`,
      ...decision.reasons,
    ],
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
