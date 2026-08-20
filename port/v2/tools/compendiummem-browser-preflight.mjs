/* Arc-local exact-Edge preflight for the Compendium resource gate.

   This caller replaces the generic launcher's cold live leg in the Edge-only
   workflow job. It deliberately leaves every Compendium measurement-authority
   input byte-identical: the shared launcher and candidate collector retain
   their sealed bounds and semantics.

   Usage:
     node tools/compendiummem-browser-preflight.mjs --selftest
     node tools/compendiummem-browser-preflight.mjs
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { findChromiumBrowser } from './browserpath.mjs';
import {
  CANDIDATE_TRANSPORT_TIMEOUT_MS,
  COMPENDIUM_BROWSER_AUTHORITY_SCHEMA,
  COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  compendiumBrowserAuthorityMatches,
  compendiumBudgetBrowserAuthority,
  compendiumCdpOptions,
  validCompendiumBrowserAuthority,
} from './compendiummem-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const budgetPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.json');
const PREFLIGHT_LABEL = 'Compendium Arc 1A Edge browser preflight';
const PREFLIGHT_PROFILE_PREFIX = 'cf-compendiummem-edge-preflight';
const PREFLIGHT_STARTUP_TIMEOUT_MS = 45_000;
const PREFLIGHT_SOCKET_TIMEOUT_MS = 15_000;
const PREFLIGHT_SHUTDOWN_TIMEOUT_MS = 2_000;
const PREFLIGHT_SENTINEL = 'cf-v2-compendium-edge-preflight/v1';
const PREFLIGHT_OPTION_KEYS = Object.freeze([
  'commandTimeoutMs', 'label', 'onEvent', 'shutdownTimeoutMs',
  'startupTimeoutMs', 'userDataPrefix', 'webSocketOpenTimeoutMs',
].sort());

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function portable(file) { return file.replaceAll('\\', '/'); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

function createDeadlineSignal(deadlineMs, { readNow, setTimer, clearTimer }) {
  assert(Number.isFinite(deadlineMs) && typeof readNow === 'function'
    && typeof setTimer === 'function' && typeof clearTimer === 'function',
  'Compendium browser preflight deadline dependencies are invalid');
  let active = true;
  let timer = null;
  let resolveSignal;
  const promise = new Promise((resolve) => { resolveSignal = resolve; });
  const observe = () => {
    if (!active) return;
    const observedAtMs = readNow();
    const remainingMs = deadlineMs - observedAtMs;
    if (remainingMs > 0) {
      timer = setTimer(observe, Math.max(1, Math.ceil(remainingMs)));
      return;
    }
    active = false;
    timer = null;
    resolveSignal(Object.freeze({ kind: 'deadline', receivedAtMs: observedAtMs }));
  };
  observe();
  return Object.freeze({
    promise,
    cancel() {
      if (!active) return;
      active = false;
      if (timer !== null) clearTimer(timer);
      timer = null;
    },
  });
}

function ownedProfiles(prefix) {
  const temporary = fs.realpathSync(os.tmpdir());
  const stem = `${prefix}-${process.pid}-`;
  return fs.readdirSync(temporary).filter((name) => name.startsWith(stem));
}

function assertNoOwnedProfiles(prefix, where) {
  const profiles = ownedProfiles(prefix);
  assert(profiles.length === 0,
    `${where}: browser profiles leaked (${profiles.join(', ')})`);
}

function preflightOptions({ profilePrefix, onEvent }) {
  assert(typeof profilePrefix === 'string' && profilePrefix.length > 0,
    'Compendium browser preflight profile prefix is invalid');
  assert(typeof onEvent === 'function',
    'Compendium browser preflight event owner is invalid');
  return compendiumCdpOptions('candidate', {
    label: PREFLIGHT_LABEL,
    userDataPrefix: profilePrefix,
    webSocketOpenTimeoutMs: PREFLIGHT_SOCKET_TIMEOUT_MS,
    startupTimeoutMs: PREFLIGHT_STARTUP_TIMEOUT_MS,
    shutdownTimeoutMs: PREFLIGHT_SHUTDOWN_TIMEOUT_MS,
    onEvent,
  });
}

export async function runCompendiumBrowserPreflight({
  openCdp = openChromiumCdp,
  selectedExecutable = findChromiumBrowser(),
  expectedAuthority,
  profilePrefix = PREFLIGHT_PROFILE_PREFIX,
  nonce = crypto.randomBytes(8).toString('hex'),
  now = () => performance.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  assert(typeof openCdp === 'function', 'Compendium browser preflight opener is invalid');
  assert(typeof selectedExecutable === 'string' && selectedExecutable.length > 0,
    'Compendium browser preflight selected executable is invalid');
  assert(validCompendiumBrowserAuthority(expectedAuthority),
    'Compendium browser preflight expected authority is invalid');
  assert(typeof nonce === 'string' && /^[a-z0-9-]+$/i.test(nonce),
    'Compendium browser preflight nonce is invalid');
  assert(typeof now === 'function' && typeof setTimer === 'function'
    && typeof clearTimer === 'function',
  'Compendium browser preflight phase clock is invalid');

  const marker = `cf-compendiummem-edge-preflight-${nonce}`;
  let lastNowMs = Number.NEGATIVE_INFINITY;
  const readNow = () => {
    const value = now();
    assert(Number.isFinite(value) && value >= lastNowMs,
      'Compendium browser preflight phase clock is not monotonic');
    lastNowMs = value;
    return value;
  };
  let activeEventPhase = null;
  const options = preflightOptions({
    profilePrefix,
    onEvent(event) {
      if (activeEventPhase === null
        || event?.method !== 'Runtime.consoleAPICalled'
        || event.sessionId !== activeEventPhase.sessionId
        || !Array.isArray(event.params?.args)
        || !event.params.args.some((argument) => argument?.value === marker)) return;
      const receivedAtMs = readNow();
      if (activeEventPhase.receipt !== null) return;
      activeEventPhase.receipt = Object.freeze({
        kind: 'event',
        receivedAtMs,
      });
      activeEventPhase.resolve(activeEventPhase.receipt);
    },
  });
  let connection = null;
  try {
    /* Exactly one opener call. A failure is terminal; there is no retry,
       relaunch, fallback, sleep-before-launch, or alternate browser. */
    connection = await openCdp(options);
    assert(connection && typeof connection.send === 'function'
      && typeof connection.close === 'function',
    'Compendium browser preflight opener returned an invalid connection');
    assert(connection.browser?.executable === portable(selectedExecutable),
      `Compendium browser preflight executable mismatch: expected ${portable(selectedExecutable)}, got ${String(connection.browser?.executable)}`);
    assert(compendiumBrowserAuthorityMatches(connection.browser, expectedAuthority),
      'Compendium browser preflight browser does not match the exact Arc 1A authority');

    const target = await connection.send('Target.createTarget', { url: 'about:blank' });
    assert(typeof target?.targetId === 'string' && target.targetId.length > 0,
      'Compendium browser preflight did not create a fresh target');
    const attached = await connection.send('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true,
    });
    assert(typeof attached?.sessionId === 'string' && attached.sessionId.length > 0,
      'Compendium browser preflight did not attach the fresh target');
    await connection.send('Runtime.enable', {}, attached.sessionId);
    await connection.send('Page.enable', {}, attached.sessionId);
    await connection.send('HeapProfiler.enable', {}, attached.sessionId);
    const phaseStartedAtMs = readNow();
    const phaseDeadlineMs = phaseStartedAtMs + CANDIDATE_TRANSPORT_TIMEOUT_MS;
    let resolveEvent;
    const eventPromise = new Promise((resolve) => { resolveEvent = resolve; });
    activeEventPhase = {
      sessionId: attached.sessionId,
      receipt: null,
      resolve: resolveEvent,
    };
    const evaluated = await connection.send('Runtime.evaluate', {
      expression: `(()=>{console.log(${JSON.stringify(marker)});return ${JSON.stringify(PREFLIGHT_SENTINEL)}})()`,
      returnByValue: true,
    }, attached.sessionId, { timeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS });
    const evaluateReceivedAtMs = readNow();
    assert(evaluateReceivedAtMs < phaseDeadlineMs,
      'Compendium browser preflight Runtime.evaluate receipt was not strictly before the phase deadline');
    assert(!evaluated?.exceptionDetails
      && evaluated?.result?.value === PREFLIGHT_SENTINEL,
    'Compendium browser preflight Runtime.evaluate sentinel was not returned');
    let eventReceipt = activeEventPhase.receipt;
    if (eventReceipt === null) {
      const deadlineSignal = createDeadlineSignal(phaseDeadlineMs, {
        readNow, setTimer, clearTimer,
      });
      try {
        const joined = await Promise.race([eventPromise, deadlineSignal.promise]);
        if (joined.kind === 'event') eventReceipt = joined;
      } finally {
        deadlineSignal.cancel();
      }
    }
    activeEventPhase = null;
    assert(eventReceipt !== null,
      'Compendium browser preflight Runtime event sentinel was not observed before the phase deadline');
    assert(eventReceipt.receivedAtMs >= phaseStartedAtMs
      && eventReceipt.receivedAtMs < phaseDeadlineMs,
    'Compendium browser preflight Runtime event receipt was not strictly before the phase deadline');
    const closedTarget = await connection.send('Target.closeTarget', {
      targetId: target.targetId,
    });
    assert(closedTarget?.success === true,
      'Compendium browser preflight fresh target did not close');
    return Object.freeze({
      browser: connection.browser,
      marker,
      commandTimeoutMs: options.commandTimeoutMs,
      phase: Object.freeze({
        startedAtMs: phaseStartedAtMs,
        deadlineMs: phaseDeadlineMs,
        evaluateReceivedAtMs,
        eventReceivedAtMs: eventReceipt.receivedAtMs,
      }),
    });
  } finally {
    activeEventPhase = null;
    try {
      if (connection !== null) await connection.close();
    } finally {
      assertNoOwnedProfiles(profilePrefix, 'Compendium browser preflight cleanup');
    }
  }
}

async function expectRejected(label, work, pattern) {
  let caught = null;
  try { await work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message),
    `SELFTEST ${label}: wrong rejection (${caught.message})`);
}

function selftestAuthority() {
  return Object.freeze({
    schema: COMPENDIUM_BROWSER_AUTHORITY_SCHEMA,
    scope: COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
    product: 'Edg/151.0.4129.86',
    revision: '@selftest-edge-revision',
    jsVersion: '15.1.selftest',
    protocolVersion: '1.3',
  });
}

function selftestBrowser(authority, executable, overrides = {}) {
  return Object.freeze({
    executable: portable(executable),
    product: authority.product,
    revision: authority.revision,
    user_agent: 'cf-compendiummem-edge-preflight-selftest',
    js_version: authority.jsVersion,
    protocol_version: authority.protocolVersion,
    ...overrides,
  });
}

function removeSelftestProfile(directory, profilePrefix) {
  const temporary = fs.realpathSync(os.tmpdir());
  const resolved = path.resolve(directory);
  const stat = fs.lstatSync(resolved);
  assert(path.dirname(resolved) === temporary
    && path.basename(resolved).startsWith(`${profilePrefix}-${process.pid}-`)
    && stat.isDirectory() && !stat.isSymbolicLink(),
  `SELFTEST refusing unsafe profile cleanup: ${resolved}`);
  fs.rmSync(resolved, { recursive: true });
}

function fakeOpener({
  authority,
  executable,
  browserOverrides = {},
  failMethod = null,
  sentinel = PREFLIGHT_SENTINEL,
  eventMarker = null,
  eventSessionId = 'selftest-session',
  phaseClock = null,
  eventAtMs = null,
  evaluateReceiptAtMs = null,
  profilePrefix,
  createProfile = false,
  retainProfile = false,
}) {
  const state = {
    calls: 0,
    closeCalls: 0,
    options: null,
    commands: [],
    profile: null,
    emitEvent: null,
  };
  const opener = async (options) => {
    state.calls += 1;
    state.options = options;
    assert(state.calls === 1, 'SELFTEST fake opener was retried');
    if (createProfile) {
      const temporary = fs.realpathSync(os.tmpdir());
      state.profile = path.join(temporary,
        `${profilePrefix}-${process.pid}-${crypto.randomBytes(5).toString('hex')}`);
      fs.mkdirSync(state.profile);
    }
    let closed = false;
    state.emitEvent = (marker, sessionId = eventSessionId) => options.onEvent({
      method: 'Runtime.consoleAPICalled',
      sessionId,
      params: { args: [{ value: marker }] },
    });
    return {
      browser: selftestBrowser(authority, executable, browserOverrides),
      async send(method, params = {}, sessionId, commandOptions = {}) {
        state.commands.push({ method, params, sessionId, commandOptions });
        if (method === failMethod) throw new Error(`injected ${method} failure`);
        if (method === 'Target.createTarget') return { targetId: 'selftest-target' };
        if (method === 'Target.attachToTarget') return { sessionId: 'selftest-session' };
        if (method === 'Runtime.evaluate') {
          if (phaseClock !== null && eventAtMs !== null) phaseClock.value = eventAtMs;
          if (eventMarker !== null) state.emitEvent(eventMarker);
          if (phaseClock !== null && evaluateReceiptAtMs !== null) {
            assert(evaluateReceiptAtMs >= phaseClock.value,
              'SELFTEST evaluate receipt moved the clock backwards');
            phaseClock.value = evaluateReceiptAtMs;
          }
          return { result: { value: sentinel } };
        }
        if (method === 'Target.closeTarget') return { success: true };
        return {};
      },
      async close() {
        assert(!closed, 'SELFTEST connection was closed more than once');
        closed = true;
        state.closeCalls += 1;
        if (state.profile !== null && !retainProfile) {
          removeSelftestProfile(state.profile, profilePrefix);
          state.profile = null;
        }
      },
    };
  };
  return { opener, state };
}

function selftestClock(initialValue = 0) {
  const clock = { value: initialValue };
  return Object.freeze({
    clock,
    now: () => clock.value,
  });
}

function selftestDeadlineTimers({
  clock,
  openerState,
  eventAtMs = null,
  eventMarker = null,
}) {
  const state = { setCalls: 0, clearCalls: 0 };
  return Object.freeze({
    state,
    setTimer(callback, delayMs) {
      state.setCalls += 1;
      assert(Number.isInteger(delayMs) && delayMs > 0,
        'SELFTEST deadline timer received an invalid delay');
      const scheduledAtMs = clock.value + delayMs;
      if (eventAtMs !== null) {
        assert(eventAtMs >= clock.value,
          'SELFTEST event receipt moved the clock backwards');
        clock.value = eventAtMs;
        openerState.emitEvent(eventMarker);
      }
      if (clock.value < scheduledAtMs) clock.value = scheduledAtMs;
      callback();
      return state.setCalls;
    },
    clearTimer() { state.clearCalls += 1; },
  });
}

async function runSelftest() {
  const authority = selftestAuthority();
  const executable = portable(path.join(fs.realpathSync(os.tmpdir()), 'selftest-edge'));
  const nonce = 'selftest-success';
  const marker = `cf-compendiummem-edge-preflight-${nonce}`;
  const successClock = selftestClock();
  const successPrefix = 'cf-compendiummem-edge-preflight-selftest-success';
  const success = fakeOpener({
    authority, executable, profilePrefix: successPrefix,
    createProfile: true, eventMarker: marker,
    phaseClock: successClock.clock, eventAtMs: 100, evaluateReceiptAtMs: 100,
  });
  const result = await runCompendiumBrowserPreflight({
    openCdp: success.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: successPrefix,
    nonce,
    now: successClock.now,
  });
  assert(result.commandTimeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS,
    'SELFTEST preflight did not retain the sealed candidate transport ceiling');
  assert(result.phase.startedAtMs === 0
    && result.phase.deadlineMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && result.phase.evaluateReceivedAtMs === 100
    && result.phase.eventReceivedAtMs === 100,
  `SELFTEST successful phase authority drifted (${JSON.stringify(result.phase)})`);
  assert(success.state.calls === 1 && success.state.closeCalls === 1,
    'SELFTEST successful preflight did not open and close exactly once');
  const captured = success.state.options;
  assert(JSON.stringify(Object.keys(captured).sort()) === JSON.stringify(PREFLIGHT_OPTION_KEYS),
    `SELFTEST preflight option keys drifted (${JSON.stringify(Object.keys(captured).sort())})`);
  assert(captured.label === PREFLIGHT_LABEL
    && captured.userDataPrefix === successPrefix
    && captured.startupTimeoutMs === PREFLIGHT_STARTUP_TIMEOUT_MS
    && captured.webSocketOpenTimeoutMs === PREFLIGHT_SOCKET_TIMEOUT_MS
    && captured.commandTimeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && captured.shutdownTimeoutMs === PREFLIGHT_SHUTDOWN_TIMEOUT_MS
    && typeof captured.onEvent === 'function',
  `SELFTEST preflight options drifted (${JSON.stringify(captured)})`);
  assert(JSON.stringify(success.state.commands.map((command) => command.method))
    === JSON.stringify([
      'Target.createTarget', 'Target.attachToTarget', 'Runtime.enable',
      'Page.enable', 'HeapProfiler.enable', 'Runtime.evaluate', 'Target.closeTarget',
    ]),
  `SELFTEST preflight command order drifted (${JSON.stringify(success.state.commands)})`);
  assert(JSON.stringify(success.state.commands[0]?.params) === JSON.stringify({ url: 'about:blank' })
    && JSON.stringify(success.state.commands[1]?.params)
      === JSON.stringify({ targetId: 'selftest-target', flatten: true })
    && success.state.commands[5]?.params?.returnByValue === true
    && success.state.commands[5]?.params?.expression?.includes(marker)
    && JSON.stringify(success.state.commands[5]?.commandOptions)
      === JSON.stringify({ timeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS })
    && JSON.stringify(success.state.commands[6]?.params)
      === JSON.stringify({ targetId: 'selftest-target' }),
  'SELFTEST fresh-target, evaluate, or close parameters drifted');
  assert(success.state.commands.slice(2, 6).every((command) =>
    command.sessionId === 'selftest-session'),
  'SELFTEST target-domain commands escaped the fresh attached session');
  assertNoOwnedProfiles(successPrefix, 'SELFTEST successful cleanup');

  const evaluateBoundaryScenarios = [
    { key: 'just-before', evaluateAtMs: 4_999, accepted: true },
    { key: 'exact', evaluateAtMs: 5_000, accepted: false },
    { key: 'just-late', evaluateAtMs: 5_001, accepted: false },
  ];
  for (const scenario of evaluateBoundaryScenarios) {
    const boundaryClock = selftestClock();
    const profilePrefix = `cf-compendiummem-edge-preflight-selftest-evaluate-${scenario.key}`;
    const boundaryNonce = `evaluate-${scenario.key}`;
    const boundaryMarker = `cf-compendiummem-edge-preflight-${boundaryNonce}`;
    const boundary = fakeOpener({
      authority, executable, profilePrefix, eventMarker: boundaryMarker,
      phaseClock: boundaryClock.clock, eventAtMs: 100,
      evaluateReceiptAtMs: scenario.evaluateAtMs,
    });
    const work = () => runCompendiumBrowserPreflight({
      openCdp: boundary.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix,
      nonce: boundaryNonce,
      now: boundaryClock.now,
    });
    if (scenario.accepted) {
      const boundaryResult = await work();
      assert(boundaryResult.phase.evaluateReceivedAtMs === scenario.evaluateAtMs
        && boundaryResult.phase.eventReceivedAtMs === 100,
      `SELFTEST ${scenario.key} evaluate receipts drifted (${JSON.stringify(boundaryResult.phase)})`);
    } else {
      await expectRejected(`${scenario.key} evaluate receipt`, work,
        /Runtime\.evaluate receipt was not strictly before the phase deadline/);
    }
    assert(boundary.state.calls === 1 && boundary.state.closeCalls === 1,
      `SELFTEST ${scenario.key} evaluate boundary retried or failed to close`);
  }

  const authorityMismatchCases = [
    ['product', { product: 'Edg/151.0.4129.87' }],
    ['revision', { revision: '@wrong-revision' }],
    ['jsVersion', { js_version: 'wrong-js' }],
    ['protocolVersion', { protocol_version: '9.9' }],
  ];
  for (const [field, browserOverrides] of authorityMismatchCases) {
    const profilePrefix = `cf-compendiummem-edge-preflight-selftest-${field.toLowerCase()}`;
    const mismatch = fakeOpener({
      authority, executable, browserOverrides, profilePrefix,
      eventMarker: `cf-compendiummem-edge-preflight-${field}`,
    });
    await expectRejected(`${field} authority mismatch`, () =>
      runCompendiumBrowserPreflight({
        openCdp: mismatch.opener,
        selectedExecutable: executable,
        expectedAuthority: authority,
        profilePrefix,
        nonce: field,
      }), /does not match the exact Arc 1A authority/);
    assert(mismatch.state.calls === 1 && mismatch.state.closeCalls === 1,
      `SELFTEST ${field} mismatch retried or failed to close`);
  }

  const executableMismatchPrefix = 'cf-compendiummem-edge-preflight-selftest-executable';
  const executableMismatch = fakeOpener({
    authority, executable, profilePrefix: executableMismatchPrefix,
    browserOverrides: { executable: '/wrong/edge' },
    eventMarker: 'cf-compendiummem-edge-preflight-executable',
  });
  await expectRejected('executable mismatch', () => runCompendiumBrowserPreflight({
    openCdp: executableMismatch.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: executableMismatchPrefix,
    nonce: 'executable',
  }), /executable mismatch/);
  assert(executableMismatch.state.calls === 1 && executableMismatch.state.closeCalls === 1,
    'SELFTEST executable mismatch retried or failed to close');

  const setupFailurePrefix = 'cf-compendiummem-edge-preflight-selftest-setup-failure';
  const setupFailure = fakeOpener({
    authority, executable, profilePrefix: setupFailurePrefix,
    failMethod: 'Runtime.enable',
    eventMarker: 'cf-compendiummem-edge-preflight-setup-failure',
  });
  await expectRejected('setup failure', () => runCompendiumBrowserPreflight({
    openCdp: setupFailure.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: setupFailurePrefix,
    nonce: 'setup-failure',
  }), /injected Runtime\.enable failure/);
  assert(setupFailure.state.calls === 1 && setupFailure.state.closeCalls === 1,
    'SELFTEST setup failure retried or failed to close exactly once');

  const sentinelFailurePrefix = 'cf-compendiummem-edge-preflight-selftest-sentinel';
  const sentinelFailure = fakeOpener({
    authority, executable, profilePrefix: sentinelFailurePrefix,
    sentinel: 'wrong-sentinel',
    eventMarker: 'cf-compendiummem-edge-preflight-sentinel-failure',
  });
  await expectRejected('evaluate sentinel failure', () => runCompendiumBrowserPreflight({
    openCdp: sentinelFailure.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: sentinelFailurePrefix,
    nonce: 'sentinel-failure',
  }), /Runtime\.evaluate sentinel was not returned/);
  assert(sentinelFailure.state.calls === 1 && sentinelFailure.state.closeCalls === 1,
    'SELFTEST evaluate sentinel failure retried or failed to close');

  const eventFailureClock = selftestClock();
  const eventFailurePrefix = 'cf-compendiummem-edge-preflight-selftest-event';
  const eventFailure = fakeOpener({
    authority, executable, profilePrefix: eventFailurePrefix,
    eventMarker: 'wrong-event-marker', phaseClock: eventFailureClock.clock,
    eventAtMs: 100, evaluateReceiptAtMs: 100,
  });
  const eventFailureTimers = selftestDeadlineTimers({
    clock: eventFailureClock.clock,
    openerState: eventFailure.state,
  });
  await expectRejected('wrong event sentinel', () => runCompendiumBrowserPreflight({
    openCdp: eventFailure.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: eventFailurePrefix,
    nonce: 'event-failure',
    now: eventFailureClock.now,
    setTimer: eventFailureTimers.setTimer,
    clearTimer: eventFailureTimers.clearTimer,
  }), /Runtime event sentinel was not observed before the phase deadline/);
  assert(eventFailure.state.calls === 1 && eventFailure.state.closeCalls === 1
    && eventFailureTimers.state.setCalls === 1,
  'SELFTEST wrong-event failure retried, slept, or failed to close');

  const wrongSessionClock = selftestClock();
  const wrongSessionPrefix = 'cf-compendiummem-edge-preflight-selftest-wrong-session';
  const wrongSessionMarker = 'cf-compendiummem-edge-preflight-wrong-session';
  const wrongSession = fakeOpener({
    authority, executable, profilePrefix: wrongSessionPrefix,
    eventMarker: wrongSessionMarker, eventSessionId: 'wrong-selftest-session',
    phaseClock: wrongSessionClock.clock, eventAtMs: 100,
    evaluateReceiptAtMs: 100,
  });
  const wrongSessionTimers = selftestDeadlineTimers({
    clock: wrongSessionClock.clock,
    openerState: wrongSession.state,
  });
  await expectRejected('same marker on wrong session', () =>
    runCompendiumBrowserPreflight({
      openCdp: wrongSession.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix: wrongSessionPrefix,
      nonce: 'wrong-session',
      now: wrongSessionClock.now,
      setTimer: wrongSessionTimers.setTimer,
      clearTimer: wrongSessionTimers.clearTimer,
    }), /Runtime event sentinel was not observed before the phase deadline/);
  assert(wrongSession.state.calls === 1 && wrongSession.state.closeCalls === 1
    && wrongSessionTimers.state.setCalls === 1,
  'SELFTEST wrong-session failure retried, slept, or failed to close');

  const missingEventClock = selftestClock();
  const missingEventPrefix = 'cf-compendiummem-edge-preflight-selftest-missing-event';
  const missingEvent = fakeOpener({
    authority, executable, profilePrefix: missingEventPrefix,
    phaseClock: missingEventClock.clock, evaluateReceiptAtMs: 100,
  });
  const missingEventTimers = selftestDeadlineTimers({
    clock: missingEventClock.clock,
    openerState: missingEvent.state,
  });
  await expectRejected('missing event sentinel', () => runCompendiumBrowserPreflight({
    openCdp: missingEvent.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: missingEventPrefix,
    nonce: 'missing-event',
    now: missingEventClock.now,
    setTimer: missingEventTimers.setTimer,
    clearTimer: missingEventTimers.clearTimer,
  }), /Runtime event sentinel was not observed before the phase deadline/);
  assert(missingEvent.state.calls === 1 && missingEvent.state.closeCalls === 1
    && missingEventTimers.state.setCalls === 1,
  'SELFTEST missing-event failure retried, slept, or failed to close');

  const backwardClockPrefix = 'cf-compendiummem-edge-preflight-selftest-backward-clock';
  const backwardClock = fakeOpener({
    authority, executable, profilePrefix: backwardClockPrefix,
  });
  const backwardReads = [0, 100, 99];
  await expectRejected('backward phase clock', () => runCompendiumBrowserPreflight({
    openCdp: backwardClock.opener,
    selectedExecutable: executable,
    expectedAuthority: authority,
    profilePrefix: backwardClockPrefix,
    nonce: 'backward-clock',
    now: () => backwardReads.shift(),
    setTimer: () => { throw new Error('SELFTEST backward clock reached a timer'); },
    clearTimer: () => {},
  }), /phase clock is not monotonic/);
  assert(backwardClock.state.calls === 1 && backwardClock.state.closeCalls === 1,
    'SELFTEST backward-clock failure retried or failed to close');

  const eventBoundaryScenarios = [
    { key: 'just-before', eventAtMs: 4_999, accepted: true },
    { key: 'exact', eventAtMs: 5_000, accepted: false },
    { key: 'just-late', eventAtMs: 5_001, accepted: false },
  ];
  for (const scenario of eventBoundaryScenarios) {
    const boundaryClock = selftestClock();
    const profilePrefix = `cf-compendiummem-edge-preflight-selftest-${scenario.key}`;
    const boundaryNonce = `event-${scenario.key}`;
    const boundaryMarker = `cf-compendiummem-edge-preflight-${boundaryNonce}`;
    const boundary = fakeOpener({
      authority, executable, profilePrefix,
      phaseClock: boundaryClock.clock, evaluateReceiptAtMs: 100,
    });
    const boundaryTimers = selftestDeadlineTimers({
      clock: boundaryClock.clock,
      openerState: boundary.state,
      eventAtMs: scenario.eventAtMs,
      eventMarker: boundaryMarker,
    });
    const work = () => runCompendiumBrowserPreflight({
      openCdp: boundary.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix,
      nonce: boundaryNonce,
      now: boundaryClock.now,
      setTimer: boundaryTimers.setTimer,
      clearTimer: boundaryTimers.clearTimer,
    });
    if (scenario.accepted) {
      const boundaryResult = await work();
      assert(boundaryResult.phase.evaluateReceivedAtMs === 100
        && boundaryResult.phase.eventReceivedAtMs === scenario.eventAtMs,
      `SELFTEST ${scenario.key} event receipts drifted (${JSON.stringify(boundaryResult.phase)})`);
    } else {
      await expectRejected(`${scenario.key} event receipt`, work,
        /Runtime event receipt was not strictly before the phase deadline/);
    }
    assert(boundary.state.calls === 1 && boundary.state.closeCalls === 1
      && boundaryTimers.state.setCalls === 1,
    `SELFTEST ${scenario.key} event boundary retried, slept, or failed to close`);
  }

  const leakPrefix = 'cf-compendiummem-edge-preflight-selftest-leak';
  const leak = fakeOpener({
    authority, executable, profilePrefix: leakPrefix,
    createProfile: true, retainProfile: true,
    eventMarker: 'cf-compendiummem-edge-preflight-leak',
  });
  try {
    await expectRejected('profile leak', () => runCompendiumBrowserPreflight({
      openCdp: leak.opener,
      selectedExecutable: executable,
      expectedAuthority: authority,
      profilePrefix: leakPrefix,
      nonce: 'leak',
    }), /browser profiles leaked/);
  } finally {
    if (leak.state.profile !== null) {
      removeSelftestProfile(leak.state.profile, leakPrefix);
      leak.state.profile = null;
    }
  }
  assert(leak.state.calls === 1 && leak.state.closeCalls === 1,
    'SELFTEST profile-leak control retried or failed to close');
  assertNoOwnedProfiles(leakPrefix, 'SELFTEST leak-control cleanup');

  console.log('COMPENDIUM BROWSER PREFLIGHT SELFTEST PASS');
  console.log('  exact options 45s startup / 15s socket / 5s command / 2s shutdown: PASS');
  console.log('  one opener call, fresh target/domain order, evaluate result and event: PASS');
  console.log('  product/revision/JS/protocol and executable mismatches: rejected');
  console.log('  one immutable 5s evaluate+event phase; just-before/exact/late receipts: PASS/rejected/rejected');
  console.log('  setup/sentinel/missing-event/wrong-marker/wrong-session/backward-clock failures: terminal, one close, no retry');
  console.log('  owned profile cleanup and deliberate leak control: PASS');
}

async function runLive() {
  const budget = readJson(budgetPath);
  assert(budget.status === 'active',
    'Compendium browser preflight requires the active numeric budget');
  const authority = compendiumBudgetBrowserAuthority(budget);
  assert(validCompendiumBrowserAuthority(authority),
    'Compendium browser preflight budget has no exact Arc 1A Edge authority');
  const result = await runCompendiumBrowserPreflight({ expectedAuthority: authority });
  console.log('COMPENDIUM BROWSER PREFLIGHT PASS');
  console.log(JSON.stringify({
    browser: result.browser,
    authority,
    policy: {
      attemptCount: 1,
      automaticRetries: 0,
      startupTimeoutMs: PREFLIGHT_STARTUP_TIMEOUT_MS,
      webSocketOpenTimeoutMs: PREFLIGHT_SOCKET_TIMEOUT_MS,
      commandTimeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS,
      shutdownTimeoutMs: PREFLIGHT_SHUTDOWN_TIMEOUT_MS,
    },
  }));
}

const IS_MAIN = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (IS_MAIN) {
  const arguments_ = process.argv.slice(2);
  const action = arguments_.length === 0
    ? runLive
    : arguments_.length === 1 && arguments_[0] === '--selftest'
      ? runSelftest
      : null;
  if (action === null) {
    console.error('usage: node tools/compendiummem-browser-preflight.mjs [--selftest]');
    process.exitCode = 2;
  } else {
    action().catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
  }
}
