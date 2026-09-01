/* browsercdp.mjs — owned raw-CDP launcher for evidence tools.

   Chromium writes DevToolsActivePort inside the unique user-data directory
   when started with port 0. Reading that browser-owned file avoids reserving
   and releasing a guessed loopback port, and therefore avoids attaching to an
   unrelated process that wins a port race.
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import WebSocket from 'ws';
import { fileURLToPath } from 'node:url';
import { assertBrowserLaunchAllowed, findChromiumBrowser } from './browserpath.mjs';

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
class ActiveEndpointContentError extends Error {
  constructor(message) { super(message); this.name = 'ActiveEndpointContentError'; }
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function errorMessage(error) { return error instanceof Error ? error.message : String(error); }
function withCleanupFailure(primary, cleanup) {
  const failure = new Error(`${errorMessage(primary)}; cleanup failed (${errorMessage(cleanup)})`, {
    cause: primary,
  });
  failure.name = primary instanceof Error ? primary.name : 'Error';
  Object.defineProperty(failure, 'cleanupCause', { value: cleanup, enumerable: false });
  return failure;
}
async function throwAfterCleanup(primary, cleanup) {
  try { await cleanup(); }
  catch (cleanupError) { throw withCleanupFailure(primary, cleanupError); }
  throw primary;
}
function remainingDeadlineDelayMs(deadlineMs, observedAtMs) {
  assert(Number.isFinite(deadlineMs) && Number.isFinite(observedAtMs),
    'absolute deadline observation is invalid');
  const remainingMs = deadlineMs - observedAtMs;
  return remainingMs <= 0 ? 0 : Math.max(1, Math.ceil(remainingMs));
}
function armAbsoluteDeadline(deadlineMs, onDeadline, {
  nowMs = () => performance.now(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  assert(Number.isFinite(deadlineMs), 'absolute deadline is invalid');
  assert(typeof onDeadline === 'function' && typeof nowMs === 'function'
    && typeof setTimer === 'function' && typeof clearTimer === 'function',
  'absolute deadline dependencies are invalid');
  let active = true;
  let timer = null;
  const observe = () => {
    if (!active) return;
    const delayMs = remainingDeadlineDelayMs(deadlineMs, nowMs());
    if (delayMs > 0) {
      timer = setTimer(observe, delayMs);
      return;
    }
    active = false;
    timer = null;
    onDeadline();
  };
  const initialDelayMs = remainingDeadlineDelayMs(deadlineMs, nowMs());
  if (initialDelayMs === 0) observe();
  else timer = setTimer(observe, initialDelayMs);
  return () => {
    if (!active) return;
    active = false;
    if (timer !== null) clearTimer(timer);
    timer = null;
  };
}
async function waitForResolution(promise, timeoutMs) {
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (resolvedInTime) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(resolvedInTime);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    promise.then(() => finish(true));
  });
}
function directChildProcessTree(child) {
  return Object.freeze({
    kind: 'direct-child',
    isAlive() {
      return Number.isInteger(child.pid) && child.pid > 0
        && child.exitCode === null && child.signalCode === null;
    },
    async signal(signal) {
      if (!this.isAlive()) return;
      child.kill(signal);
    },
  });
}
function posixProcessGroup(pid, detached, killProcess = process.kill) {
  assert(detached === true, 'refusing negative-PID browser shutdown without a detached process group');
  /* This owns only the detached group identified at launch. Permanently
     retaining ESRCH prevents later signalling after observed quiescence; it
     cannot eliminate the kernel's inherent PID/PGID-reuse window before that
     observation, and no ps-based inference is substituted for ownership. */
  let provenGone = false;
  const signal = (value) => {
    if (provenGone) return false;
    try { killProcess(-pid, value); return true; }
    catch (error) {
      if (error?.code === 'EPERM' && value === 0) return true;
      if (error?.code !== 'ESRCH') throw error;
      provenGone = true;
      return false;
    }
  };
  return Object.freeze({
    kind: 'posix-process-group',
    isAlive() { return signal(0); },
    async signal(value) { signal(value); },
  });
}
async function runWindowsTreeKill(pid, force, label, timeoutMs) {
  const args = ['/PID', String(pid), '/T', ...(force ? ['/F'] : [])];
  const killer = spawn('taskkill.exe', args, {
    stdio: ['ignore', 'ignore', 'ignore'], windowsHide: true,
  });
  let spawnError = null;
  const exited = new Promise((resolve) => {
    killer.once('error', (error) => { spawnError = error; resolve(null); });
    killer.once('exit', (code) => resolve(code));
  });
  const completed = await waitForResolution(exited, timeoutMs);
  if (!completed) {
    killer.kill('SIGKILL');
    throw new Error(`${label}: taskkill exceeded the bounded shutdown phase`);
  }
  if (spawnError) throw new Error(`${label}: taskkill failed (${spawnError.message})`);
  /* taskkill /T is the portable bounded Windows tree request available to this
     raw Node launcher. Unlike the POSIX session below, node:child_process does
     not expose Job-Object ownership, so this status must not be overclaimed as
     an independently observable tree-quiescence proof. */
  return await exited === 0;
}
function windowsProcessTree(child, pid, runTreeKill = runWindowsTreeKill) {
  let successfulTreeRequest = false;
  const rootAlive = () => child.exitCode === null && child.signalCode === null;
  return Object.freeze({
    kind: 'windows-taskkill-tree',
    isAlive() {
      /* taskkill /T is the bounded portable tree request, not Job-Object
         ownership. Until one request succeeds, cleanup remains unresolved
         even if the root exits because its descendants cannot be inferred. */
      return !successfulTreeRequest || rootAlive();
    },
    async signal(value, label, timeoutMs) {
      if (!rootAlive()) {
        if (successfulTreeRequest) return true;
        throw new Error(`${label}: browser root exited before a successful bounded taskkill /T request`);
      }
      const force = value === 'SIGKILL';
      const succeeded = await runTreeKill(pid, force, label, timeoutMs);
      if (!succeeded) {
        if (!force && rootAlive()) return false;
        throw new Error(`${label}: taskkill /PID ${pid} /T${force ? ' /F' : ''} returned nonzero`);
      }
      successfulTreeRequest = true;
      return true;
    },
  });
}
function gracefulBrowserCloseAllowed(processTree) {
  return processTree?.kind !== 'windows-taskkill-tree';
}
function ownedBrowserProcessTree(child, detached) {
  assert(Number.isInteger(child.pid) && child.pid > 0, 'browser process has no positive PID');
  return process.platform === 'win32'
    ? windowsProcessTree(child, child.pid)
    : posixProcessGroup(child.pid, detached);
}
async function waitForTreeQuiescenceUntil(processTree, child, childExited, deadline) {
  let exited = child.pid === undefined || child.exitCode !== null || child.signalCode !== null;
  childExited.then(() => { exited = true; });
  while (performance.now() < deadline) {
    if (exited && !processTree.isAlive()) return true;
    await sleep(Math.min(10, Math.max(1, deadline - performance.now())));
  }
  return exited && !processTree.isAlive();
}
async function waitForTreeQuiescence(processTree, child, childExited, timeoutMs) {
  return await waitForTreeQuiescenceUntil(
    processTree, child, childExited, performance.now() + timeoutMs,
  );
}
async function terminateChildProcess(child, childExited, childClosed, processTree, label, timeoutMs) {
  /* POSIX cleanup owns the launcher's detached process group; Windows makes
     one bounded taskkill /T request per attempted shutdown phase. Neither
     claim extends to processes that deliberately escaped that boundary. */
  const signalAndWait = async (signal) => {
    const deadline = performance.now() + timeoutMs;
    const signalAccepted = await processTree.signal(signal, label,
      Math.max(1, Math.ceil(deadline - performance.now())));
    if (signalAccepted === false) return false;
    return await waitForTreeQuiescenceUntil(processTree, child, childExited, deadline);
  };
  let quiescent = child.pid === undefined
    || ((child.exitCode !== null || child.signalCode !== null) && !processTree.isAlive());
  if (!quiescent) quiescent = await signalAndWait('SIGTERM');
  if (!quiescent) {
    quiescent = await signalAndWait('SIGKILL');
    assert(quiescent, `${label}: browser process ownership ignored bounded shutdown`);
  }
  child.stderr?.destroy?.();
  assert(await waitForResolution(childClosed, timeoutMs),
    `${label}: browser exited but its stdio did not close within the shutdown bound`);
}
function portable(value) { return value.split(path.sep).join('/'); }
function requiredString(value, where) {
  assert(typeof value === 'string' && value.trim(), `${where}: missing browser version field`);
  return value.trim();
}
function activeEndpoint(userData) {
  const file = path.join(userData, 'DevToolsActivePort');
  const stat = fs.lstatSync(file, { throwIfNoEntry: false });
  if (stat === undefined) return null;
  assert(stat.isFile() && !stat.isSymbolicLink(), 'DevToolsActivePort is not a real file');
  const snapshot = fs.readFileSync(file, 'utf8');
  const lines = snapshot.trim().split(/\r?\n/);
  if (!(lines.length >= 2 && /^[1-9]\d{0,4}$/.test(lines[0]))) {
    throw new ActiveEndpointContentError('DevToolsActivePort has an invalid port');
  }
  const port = Number(lines[0]);
  if (!(port <= 65535 && /^\/devtools\/browser\/[A-Za-z0-9._-]+$/.test(lines[1]))) {
    throw new ActiveEndpointContentError('DevToolsActivePort has an invalid browser endpoint');
  }
  return { endpoint: `ws://127.0.0.1:${port}${lines[1]}`, snapshot };
}
function removeOwnedUserData(userData, temporary, prefix) {
  if (!fs.existsSync(userData)) return;
  const resolved = path.resolve(userData);
  const stat = fs.lstatSync(resolved);
  assert(path.dirname(resolved) === temporary
    && path.basename(resolved).startsWith(`${prefix}-${process.pid}-`)
    && stat.isDirectory() && !stat.isSymbolicLink(),
  `refusing unsafe browser-profile cleanup: ${resolved}`);
  fs.rmSync(resolved, { recursive: true });
}
async function proveOwnedUserDataAbsent(userData, label, stabilityMs = 100) {
  const deadline = performance.now() + stabilityMs;
  do {
    assert(!fs.existsSync(userData), `${label}: browser profile reappeared after cleanup`);
    if (performance.now() >= deadline) break;
    await sleep(Math.min(5, Math.max(1, deadline - performance.now())));
  } while (true);
}

function launchChromiumProcess({ browserFile, chromiumArgs }) {
  const detached = true;
  const child = spawn(browserFile, chromiumArgs, {
    stdio: ['ignore', 'ignore', 'pipe'], detached, windowsHide: true,
  });
  const processTree = Number.isInteger(child.pid) && child.pid > 0
    ? ownedBrowserProcessTree(child, detached)
    : directChildProcessTree(child);
  return Object.freeze({ child, processTree });
}

/* Startup is one absolute spawn -> endpoint -> open-socket deadline. The
   socket also owns a phase cap, clipped to whatever startup time remains;
   commandTimeoutMs applies only after the connection opens. */
async function openChromiumCdpWithLauncher({
  label,
  userDataPrefix,
  commandTimeoutMs = 15000,
  startupTimeoutMs = 15000,
  webSocketOpenTimeoutMs = startupTimeoutMs,
  shutdownTimeoutMs = 5000,
  WebSocketImpl = WebSocket,
  onEvent = () => {},
}, launchBrowser, nowMs = () => performance.now()) {
  assert(typeof label === 'string' && label.trim(), 'CDP label is required');
  assert(/^[a-z0-9][a-z0-9-]*$/.test(userDataPrefix), `${label}: unsafe user-data prefix`);
  assert(Number.isInteger(commandTimeoutMs) && commandTimeoutMs > 0,
    `${label}: command timeout must be a positive integer`);
  assert(Number.isInteger(webSocketOpenTimeoutMs) && webSocketOpenTimeoutMs > 0,
    `${label}: WebSocket open timeout must be a positive integer`);
  assert(Number.isInteger(startupTimeoutMs) && startupTimeoutMs > 0,
    `${label}: startup timeout must be a positive integer`);
  assert(Number.isInteger(shutdownTimeoutMs) && shutdownTimeoutMs > 0,
    `${label}: shutdown timeout must be a positive integer`);
  assert(typeof WebSocketImpl === 'function' && Number.isInteger(WebSocketImpl.OPEN),
    `${label}: WebSocket implementation is invalid`);
  assert(typeof onEvent === 'function', `${label}: CDP event handler is invalid`);
  assert(typeof launchBrowser === 'function', `${label}: browser launcher is invalid`);
  assert(typeof nowMs === 'function', `${label}: monotonic clock is invalid`);
  assertBrowserLaunchAllowed();
  const browserFile = findChromiumBrowser();
  const temporary = fs.realpathSync(os.tmpdir());
  const userData = path.join(temporary,
    `${userDataPrefix}-${process.pid}-${crypto.randomBytes(8).toString('hex')}`);
  const chromiumArgs = [
    '--headless=new', '--no-sandbox', '--no-first-run', '--disable-background-networking',
    '--disable-component-update', '--disable-component-extensions-with-background-pages',
    '--remote-debugging-port=0', `--user-data-dir=${userData}`, 'about:blank',
  ];
  const startupStartedAt = nowMs();
  const launched = launchBrowser({ browserFile, chromiumArgs, userData });
  const child = launched?.child ?? launched;
  const processTree = launched?.processTree ?? directChildProcessTree(child);
  assert(child && typeof child.on === 'function' && child.stderr,
    `${label}: browser launcher returned an invalid child`);
  assert(processTree && typeof processTree.isAlive === 'function'
    && typeof processTree.signal === 'function',
  `${label}: browser launcher returned an invalid process owner`);
  let stderrHead = '';
  let stderrTail = '';
  let stderrBytes = 0;
  let spawnError = null;
  let exitDescription = null;
  child.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderrBytes += Buffer.byteLength(text);
    if (stderrHead.length < 600) stderrHead = (stderrHead + text).slice(0, 600);
    stderrTail = (stderrTail + text).slice(-600);
  });
  child.on('error', (error) => { spawnError = error; });
  child.on('exit', (code, signal) => { exitDescription = `exit=${String(code)} signal=${String(signal)}`; });
  const childExited = new Promise((resolve) => child.once('exit', resolve));
  const childClosed = new Promise((resolve) => child.once('close', resolve));
  const terminateOwnedBrowser = async () => {
    await terminateChildProcess(
      child, childExited, childClosed, processTree, label, shutdownTimeoutMs,
    );
    removeOwnedUserData(userData, temporary, userDataPrefix);
    await proveOwnedUserDataAbsent(userData, label);
  };

  let endpoint = null;
  let endpointCandidate = null;
  let endpointContentError = null;
  let endpointContentErrorCount = 0;
  const startupDeadline = startupStartedAt + startupTimeoutMs;
  while (endpoint === null && nowMs() < startupDeadline) {
    if (spawnError || exitDescription) break;
    try {
      const observed = activeEndpoint(userData);
      if (observed === null) {
        endpointCandidate = null;
      } else if (endpointCandidate?.snapshot === observed.snapshot) {
        endpoint = observed.endpoint;
      } else {
        endpointCandidate = observed;
      }
    }
    catch (error) {
      endpointCandidate = null;
      if (error instanceof ActiveEndpointContentError) {
        endpointContentError = error;
        endpointContentErrorCount++;
      } else {
        await throwAfterCleanup(new Error(`${label}: ${error.message}`), terminateOwnedBrowser);
      }
    }
    if (endpoint === null) await sleep(Math.min(100, Math.max(1, startupDeadline - nowMs())));
  }
  if (endpoint === null) {
    const timedOut = !spawnError && !exitDescription;
    const stderr = stderrBytes
      ? stderrHead.trim() === stderrTail.trim()
        ? `stderr=${JSON.stringify(stderrHead.trim())}`
        : `stderr-head=${JSON.stringify(stderrHead.trim())}; stderr-tail=${JSON.stringify(stderrTail.trim())}`
      : '';
    const detail = [
      `pid=${String(child.pid ?? 'unknown')}`,
      spawnError ? `spawn=${spawnError.message}` : '',
      exitDescription || '',
      timedOut ? `startup-timeout=${startupTimeoutMs}ms` : '',
      endpointContentErrorCount ? `endpoint-invalid-observations=${endpointContentErrorCount}` : '',
      endpointContentError ? `endpoint-last-error=${JSON.stringify(endpointContentError.message)}` : '',
      endpointCandidate ? 'endpoint-valid-observations=1 (stability confirmation pending)' : '',
      stderr,
    ].filter(Boolean).join('; ');
    await throwAfterCleanup(new Error(
      `${label}: browser CDP did not start at ${browserFile} (${detail})`,
    ), terminateOwnedBrowser);
  }
  const endpointReadyMs = nowMs() - startupStartedAt;

  let ws = null;
  let closed = false;
  let closePromise = null;
  let eventHandlerError = null;
  let messageId = 0;
  let gracefulBrowserCloseEligible = false;
  const pending = new Map();
  const terminalError = (message) => new Error(`${label}: ${message}`);
  const rejectPending = (error) => {
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
  };
  const close = () => {
    if (closePromise) return closePromise;
    closePromise = (async () => {
      closed = true;
      rejectPending(terminalError('CDP connection closed'));
      let cleanupError = null;
      const retainCleanupError = (error) => {
        cleanupError = cleanupError === null ? error : withCleanupFailure(cleanupError, error);
      };
      let browserCloseRequested = false;
      let ownedProcessAlive = false;
      try { ownedProcessAlive = processTree.isAlive(); }
      catch (error) { retainCleanupError(error); }
      if (gracefulBrowserCloseEligible && gracefulBrowserCloseAllowed(processTree)
        && ownedProcessAlive
        && ws?.readyState === WebSocketImpl.OPEN) {
        try {
          ws.send(JSON.stringify({ id: ++messageId, method: 'Browser.close', params: {} }));
          browserCloseRequested = true;
        } catch (error) {
          retainCleanupError(terminalError(`Browser.close send failed (${errorMessage(error)})`));
        }
      }
      if (browserCloseRequested) {
        try {
          await waitForTreeQuiescence(
            processTree, child, childExited, Math.min(250, shutdownTimeoutMs),
          );
        } catch (error) { retainCleanupError(error); }
      }
      try { if (ws) ws.close(); }
      catch (error) { retainCleanupError(error); }
      try { await terminateOwnedBrowser(); }
      catch (browserCleanupError) {
        retainCleanupError(browserCleanupError);
      }
      if (cleanupError) throw cleanupError;
    })();
    return closePromise;
  };

  try {
    const socketStartedAt = nowMs();
    const remainingBeforeSocketMs = startupDeadline - socketStartedAt;
    if (remainingBeforeSocketMs <= 0) {
      throw terminalError(
        `startup deadline expired before CDP WebSocket construction `
        + `(endpoint-ready=${endpointReadyMs}ms; startup-timeout=${startupTimeoutMs}ms)`);
    }
    const effectiveOpenTimeoutMs = Math.min(webSocketOpenTimeoutMs, remainingBeforeSocketMs);
    const socketDeadline = socketStartedAt + effectiveOpenTimeoutMs;
    ws = new WebSocketImpl(endpoint);
    /* Closing a still-CONNECTING ws client emits an asynchronous error. Arm a
       provisional handler before any post-construction rejection can clean up. */
    ws.onerror = () => {};
    await new Promise((resolve, reject) => {
      const remainingOpenMs = socketDeadline - nowMs();
      if (remainingOpenMs <= 0) {
        reject(terminalError(
          `CDP WebSocket deadline expired during construction `
          + `(socket-timeout=${effectiveOpenTimeoutMs}ms; configured=${webSocketOpenTimeoutMs}ms; `
          + `endpoint-ready=${endpointReadyMs}ms; startup-timeout=${startupTimeoutMs}ms)`));
        return;
      }
      let settled = false;
      const finish = (error = null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.off('exit', onExit);
        if (error) reject(error); else resolve();
      };
      const onExit = (code, signal) => finish(terminalError(
        `browser exited before CDP opened (exit=${String(code)} signal=${String(signal)})`));
      const timer = setTimeout(() => finish(terminalError(
        `timed out opening the CDP WebSocket `
        + `(socket-timeout=${effectiveOpenTimeoutMs}ms; configured=${webSocketOpenTimeoutMs}ms; `
        + `endpoint-ready=${endpointReadyMs}ms; startup-timeout=${startupTimeoutMs}ms)`)),
      remainingOpenMs);
      child.once('exit', onExit);
      ws.onopen = () => {
        if (nowMs() >= socketDeadline) {
          finish(terminalError(
            `CDP WebSocket opened after its deadline `
            + `(socket-timeout=${effectiveOpenTimeoutMs}ms; configured=${webSocketOpenTimeoutMs}ms; `
            + `endpoint-ready=${endpointReadyMs}ms; startup-timeout=${startupTimeoutMs}ms)`));
          return;
        }
        finish();
      };
      ws.onerror = () => finish(terminalError('CDP WebSocket failed to open'));
      ws.onclose = () => finish(terminalError('CDP WebSocket closed before opening'));
    });

    ws.onmessage = (event) => {
      const receivedAtMs = nowMs();
      let message;
      try { message = JSON.parse(event.data); }
      catch { rejectPending(terminalError('CDP emitted invalid JSON')); return; }
      if (message.id && pending.has(message.id)) {
        const waiter = pending.get(message.id);
        pending.delete(message.id);
        message.error
          ? waiter.rejectReceipt(terminalError(message.error.message), receivedAtMs)
          : waiter.resolveReceipt(message.result, receivedAtMs);
      } else if (message.method) {
        try { onEvent(message); }
        catch (error) {
          eventHandlerError = terminalError(`CDP event handler failed (${error.message})`);
          rejectPending(eventHandlerError);
        }
      }
    };
    ws.onerror = () => rejectPending(terminalError('CDP WebSocket error'));
    ws.onclose = () => rejectPending(terminalError('CDP WebSocket closed'));
    child.on('exit', (code, signal) => rejectPending(terminalError(
      `browser exited (exit=${String(code)} signal=${String(signal)})`)));

    const send = (method, params = {}, sessionId, options = {}) => {
      if (eventHandlerError) return Promise.reject(eventHandlerError);
      if (closed || ws.readyState !== WebSocketImpl.OPEN) {
        return Promise.reject(terminalError(`cannot send ${method}; CDP is not open`));
      }
      const timeoutMs = options?.timeoutMs ?? commandTimeoutMs;
      if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > commandTimeoutMs) {
        return Promise.reject(terminalError(
          `${method} command timeout must be a positive integer no greater than ${commandTimeoutMs}`));
      }
      return new Promise((resolve, reject) => {
        const id = ++messageId;
        const commandDeadlineMs = nowMs() + timeoutMs;
        let cancelTimer = () => {};
        const settleReceipt = (receivedAtMs, finish) => {
          cancelTimer();
          if (!Number.isFinite(receivedAtMs) || receivedAtMs >= commandDeadlineMs) {
            reject(terminalError(`timed out waiting for ${method}`));
            return;
          }
          finish();
        };
        pending.set(id, {
          resolveReceipt(value, receivedAtMs) {
            settleReceipt(receivedAtMs, () => resolve(value));
          },
          rejectReceipt(error, receivedAtMs) {
            settleReceipt(receivedAtMs, () => reject(error));
          },
          reject(error) { cancelTimer(); reject(error); },
        });
        cancelTimer = armAbsoluteDeadline(commandDeadlineMs, () => {
          pending.delete(id);
          reject(terminalError(`timed out waiting for ${method}`));
        }, { nowMs });
        if (!pending.has(id)) return;
        try {
          ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
        } catch (error) {
          pending.delete(id); cancelTimer(); reject(terminalError(`${method} send failed (${error.message})`));
        }
      });
    };
    const version = await send('Browser.getVersion');
    const browser = Object.freeze({
      executable: portable(browserFile),
      product: requiredString(version.product, `${label} product`),
      revision: requiredString(version.revision, `${label} revision`),
      user_agent: requiredString(version.userAgent, `${label} user agent`),
      js_version: requiredString(version.jsVersion, `${label} JS version`),
      protocol_version: requiredString(version.protocolVersion, `${label} protocol version`),
    });
    gracefulBrowserCloseEligible = true;
    return { send, browser, pid: child.pid, close };
  } catch (error) {
    const primary = new Error(errorMessage(error).startsWith(`${label}:`)
      ? errorMessage(error)
      : `${label}: CDP setup failed (${errorMessage(error)})`);
    await throwAfterCleanup(primary, close);
  }
}

export async function openChromiumCdp(options) {
  return await openChromiumCdpWithLauncher(options, launchChromiumProcess);
}

const SELFTEST_COLD_COMMAND_TIMEOUT_MS = 1_500;
const SELFTEST_COLD_SOCKET_TIMEOUT_MS = 15_000;
const SELFTEST_COLD_STARTUP_TIMEOUT_MS = 45_000;
const SELFTEST_COLD_SHUTDOWN_TIMEOUT_MS = 2_000;

/* Keep the cold live-provenance allowance caller-owned. The injected opener
   lets the portable selftest bind these exact options without launching a
   second real browser or weakening the shared launcher's defaults. */
function openColdSelftestCdp({ label, userDataPrefix, onEvent = () => {} },
  openCdp = openChromiumCdp) {
  assert(typeof openCdp === 'function', 'cold selftest CDP opener is invalid');
  return openCdp({
    label,
    userDataPrefix,
    commandTimeoutMs: SELFTEST_COLD_COMMAND_TIMEOUT_MS,
    webSocketOpenTimeoutMs: SELFTEST_COLD_SOCKET_TIMEOUT_MS,
    startupTimeoutMs: SELFTEST_COLD_STARTUP_TIMEOUT_MS,
    shutdownTimeoutMs: SELFTEST_COLD_SHUTDOWN_TIMEOUT_MS,
    onEvent,
  });
}

async function expectRejectedAsync(label, work, pattern) {
  let caught = null;
  try { await work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
  return caught;
}

function ownedProfiles(prefix) {
  const temporary = fs.realpathSync(os.tmpdir());
  if (!fs.existsSync(temporary)) return [];
  const stem = `${prefix}-${process.pid}-`;
  return fs.readdirSync(temporary).filter((name) => name.startsWith(stem));
}

function assertNoOwnedProfiles(prefix, where) {
  const profiles = ownedProfiles(prefix);
  assert(profiles.length === 0,
    `SELFTEST ${where}: browser profiles leaked (${profiles.join(', ')})`);
}

async function runSelftest() {
  const actualBrowser = findChromiumBrowser();
  const priorExplicit = process.env.CF_BROWSER;
  const priorCodexSandbox = process.env.CODEX_SANDBOX;
  const nonce = crypto.randomBytes(5).toString('hex');
  const base = `cf-browsercdp-selftest-${nonce}`;
  const endpointFixture = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), `${base}-endpoint-`));
  try {
    const fakeDeadlineTimer = () => {
      let observedAtMs = 0;
      const timers = [];
      const deadlineHits = [];
      const setTimer = (callback, delayMs) => {
        const timer = { callback, delayMs, cleared: false };
        timers.push(timer);
        return timer;
      };
      const clearTimer = (timer) => { timer.cleared = true; };
      const arm = (onDeadline) => armAbsoluteDeadline(2000, onDeadline, {
        nowMs: () => observedAtMs, setTimer, clearTimer,
      });

      const cancel = arm(() => deadlineHits.push(observedAtMs));
      assert(timers.length === 1 && timers[0].delayMs === 2000,
        'SELFTEST absolute deadline did not arm the original command bound');
      observedAtMs = 1999.758726;
      timers[0].callback();
      assert(deadlineHits.length === 0,
        'SELFTEST just-early command timeout was accepted');
      assert(timers.length === 2 && timers[1].delayMs === 1,
        'SELFTEST just-early command timeout did not re-arm for the remaining deadline');
      cancel();
      assert(timers[1].cleared,
        'SELFTEST cancellation did not clear the re-armed command timeout');
      observedAtMs = 2000;
      timers[1].callback();
      assert(deadlineHits.length === 0,
        'SELFTEST cancelled command timeout fired at the exact deadline');

      observedAtMs = 0;
      const exactTimersBefore = timers.length;
      arm(() => deadlineHits.push(observedAtMs));
      observedAtMs = 2000;
      timers[exactTimersBefore].callback();
      assert(JSON.stringify(deadlineHits) === JSON.stringify([2000]),
        `SELFTEST exact command deadline did not fire once (${deadlineHits.join(', ')})`);

      observedAtMs = 0;
      const lateTimersBefore = timers.length;
      arm(() => deadlineHits.push(observedAtMs));
      observedAtMs = 2000.241274;
      timers[lateTimersBefore].callback();
      assert(JSON.stringify(deadlineHits) === JSON.stringify([2000, 2000.241274]),
        `SELFTEST late command deadline did not fire once (${deadlineHits.join(', ')})`);
    };
    fakeDeadlineTimer();

    fs.writeFileSync(path.join(endpointFixture, 'DevToolsActivePort'),
      'not-a-port\n/devtools/browser/selftest\n');
    await expectRejectedAsync('malformed DevToolsActivePort', async () => activeEndpoint(endpointFixture),
      /invalid port/);
    const directoryEndpointFixture = path.join(endpointFixture, 'directory-endpoint');
    fs.mkdirSync(path.join(directoryEndpointFixture, 'DevToolsActivePort'), { recursive: true });
    await expectRejectedAsync('directory DevToolsActivePort', async () => activeEndpoint(directoryEndpointFixture),
      /not a real file/);
    if (process.platform !== 'win32') {
      const symlinkEndpointFixture = path.join(endpointFixture, 'symlink-endpoint');
      fs.mkdirSync(symlinkEndpointFixture);
      fs.symlinkSync(path.join(endpointFixture, 'missing-endpoint-target'),
        path.join(symlinkEndpointFixture, 'DevToolsActivePort'));
      await expectRejectedAsync('dangling symlink DevToolsActivePort',
        async () => activeEndpoint(symlinkEndpointFixture),
        /not a real file/);
    }

    let inheritedStderrClosed;
    const inheritedStderrClose = new Promise((resolve) => { inheritedStderrClosed = resolve; });
    const inheritedStderrSignals = [];
    let inheritedStderrDestroyed = false;
    const exitedWithInheritedStderr = {
      exitCode: 0, signalCode: null, pid: 1, killed: false,
      kill(signal = 'SIGTERM') { inheritedStderrSignals.push(signal); return true; },
      stderr: { destroy() { inheritedStderrDestroyed = true; inheritedStderrClosed(); } },
    };
    await terminateChildProcess(
      exitedWithInheritedStderr, Promise.resolve(), inheritedStderrClose,
      directChildProcessTree(exitedWithInheritedStderr),
      'CDP selftest exited-with-inherited-stderr', 20,
    );
    assert(inheritedStderrDestroyed,
      'SELFTEST exited-with-inherited-stderr did not release its owned stderr pipe');
    assert(inheritedStderrSignals.length === 0,
      `SELFTEST exited-with-inherited-stderr sent a signal (${inheritedStderrSignals.join(', ')})`);
    let terminalWindowsKillCalls = 0;
    const terminalWindowsTree = windowsProcessTree(
      exitedWithInheritedStderr, exitedWithInheritedStderr.pid,
      async () => { terminalWindowsKillCalls++; return true; },
    );
    assert(terminalWindowsTree.isAlive(),
      'SELFTEST Windows tree inferred quiescence from an already-terminal root');
    await expectRejectedAsync('terminal Windows root without tree request',
      () => terminalWindowsTree.signal(
        'SIGTERM', 'CDP selftest terminal Windows root', 20,
      ), /^CDP selftest terminal Windows root: browser root exited before a successful bounded taskkill \/T request$/);
    assert(terminalWindowsKillCalls === 0,
      'SELFTEST Windows tree invoked taskkill for an already-terminal root');
    assert(!gracefulBrowserCloseAllowed(terminalWindowsTree),
      'SELFTEST Windows process owner allowed graceful Browser.close');
    const successfulWindowsChild = { exitCode: null, signalCode: null };
    const successfulWindowsCalls = [];
    const successfulWindowsTree = windowsProcessTree(
      successfulWindowsChild, 21,
      async (...args) => { successfulWindowsCalls.push(args); return true; },
    );
    await successfulWindowsTree.signal('SIGTERM', 'CDP selftest successful Windows tree', 20);
    assert(JSON.stringify(successfulWindowsCalls) === JSON.stringify([
      [21, false, 'CDP selftest successful Windows tree', 20],
    ]), 'SELFTEST Windows tree did not retain one successful bounded /T request');
    assert(successfulWindowsTree.isAlive(),
      'SELFTEST Windows tree accepted taskkill success before root exit');
    successfulWindowsChild.exitCode = 0;
    assert(!successfulWindowsTree.isAlive(),
      'SELFTEST Windows tree rejected taskkill success plus root exit');
    let escalatingWindowsExited;
    const escalatingWindowsExit = new Promise((resolve) => { escalatingWindowsExited = resolve; });
    let escalatingWindowsClosed;
    const escalatingWindowsClose = new Promise((resolve) => { escalatingWindowsClosed = resolve; });
    const escalatingWindowsCalls = [];
    const escalatingWindowsChild = {
      exitCode: null, signalCode: null, pid: 22,
      stderr: { destroy() { escalatingWindowsClosed(); } },
    };
    const escalatingWindowsTree = windowsProcessTree(
      escalatingWindowsChild, 22,
      async (...args) => {
        escalatingWindowsCalls.push(args);
        if (args[1] !== true) return false;
        escalatingWindowsChild.signalCode = 'SIGKILL';
        escalatingWindowsExited();
        return true;
      },
    );
    await terminateChildProcess(
      escalatingWindowsChild, escalatingWindowsExit, escalatingWindowsClose,
      escalatingWindowsTree, 'CDP selftest escalating Windows tree', 20,
    );
    assert(!escalatingWindowsTree.isAlive()
      && JSON.stringify(escalatingWindowsCalls.map((args) => args[1])) === JSON.stringify([false, true]),
    'SELFTEST Windows tree did not require /T then forced /T /F before completion');
    const failedWindowsChild = { exitCode: null, signalCode: null };
    const failedWindowsTree = windowsProcessTree(
      failedWindowsChild, 23, async () => false,
    );
    await expectRejectedAsync('nonzero Windows taskkill', () => failedWindowsTree.signal(
      'SIGKILL', 'CDP selftest failed Windows tree', 20,
    ), /^CDP selftest failed Windows tree: taskkill \/PID 23 \/T \/F returned nonzero$/);
    assert(failedWindowsTree.isAlive(),
      'SELFTEST Windows tree accepted a nonzero forced taskkill result');

    const posixGoneCalls = [];
    const posixGone = posixProcessGroup(31, true, (target, signal) => {
      posixGoneCalls.push([target, signal]);
      throw Object.assign(new Error('gone'), { code: 'ESRCH' });
    });
    assert(!posixGone.isAlive(), 'SELFTEST POSIX group did not retain ESRCH absence');
    await posixGone.signal('SIGTERM');
    assert(JSON.stringify(posixGoneCalls) === JSON.stringify([[-31, 0]]),
      'SELFTEST POSIX group signalled again after proving ESRCH');
    const posixAddressCalls = [];
    const posixAddress = posixProcessGroup(32, true, (target, signal) => {
      posixAddressCalls.push([target, signal]);
    });
    assert(posixAddress.isAlive(), 'SELFTEST POSIX owned group positive control was not alive');
    await posixAddress.signal('SIGTERM');
    assert(posixAddressCalls.every(([target]) => target === -32),
      'SELFTEST POSIX group addressed a process outside its owned negative group ID');

    let resistantExited;
    const resistantExit = new Promise((resolve) => { resistantExited = resolve; });
    let resistantClosed;
    const resistantClose = new Promise((resolve) => { resistantClosed = resolve; });
    const resistantSignals = [];
    let resistantPipeDestroyed = false;
    const resistantChild = {
      exitCode: null, signalCode: null, pid: 2, killed: false,
      kill(signal = 'SIGTERM') {
        resistantSignals.push(signal);
        this.killed = true;
        if (signal === 'SIGKILL') { this.signalCode = signal; resistantExited(); }
        return true;
      },
      stderr: { destroy() { resistantPipeDestroyed = true; resistantClosed(); } },
    };
    await terminateChildProcess(
      resistantChild, resistantExit, resistantClose, directChildProcessTree(resistantChild),
      'CDP selftest resistant child', 20,
    );
    assert(JSON.stringify(resistantSignals) === JSON.stringify(['SIGTERM', 'SIGKILL']),
      `SELFTEST resistant child: expected TERM/KILL escalation, got ${resistantSignals.join(', ')}`);
    assert(resistantPipeDestroyed,
      'SELFTEST resistant child did not release its owned stderr pipe after exit');

    const noExitSignals = [];
    let noExitPipeDestroyed = false;
    const noExitChild = {
      exitCode: null, signalCode: null, pid: 3, killed: false,
      kill(signal = 'SIGTERM') {
        noExitSignals.push(signal);
        this.killed = true;
        return true;
      },
      stderr: { destroy() { noExitPipeDestroyed = true; } },
    };
    await expectRejectedAsync('no exit after SIGKILL', () => terminateChildProcess(
      noExitChild, new Promise(() => {}), new Promise(() => {}),
      directChildProcessTree(noExitChild),
      'CDP selftest no-exit child', 20,
    ), /^CDP selftest no-exit child: browser process ownership ignored bounded shutdown$/);
    assert(JSON.stringify(noExitSignals) === JSON.stringify(['SIGTERM', 'SIGKILL']),
      `SELFTEST no-exit child: expected TERM/KILL escalation, got ${noExitSignals.join(', ')}`);
    assert(!noExitPipeDestroyed,
      'SELFTEST no-exit child released stderr before proving process exit');

    let nonclosingPipeDestroyed = false;
    const exitedWithNonclosingPipe = {
      exitCode: 1, signalCode: null, pid: 4, killed: false,
      stderr: { destroy() { nonclosingPipeDestroyed = true; } },
    };
    await expectRejectedAsync('exit with nonclosing stdio', () => terminateChildProcess(
      exitedWithNonclosingPipe, Promise.resolve(), new Promise(() => {}),
      directChildProcessTree(exitedWithNonclosingPipe),
      'CDP selftest nonclosing-stdio child', 20,
    ), /^CDP selftest nonclosing-stdio child: browser exited but its stdio did not close within the shutdown bound$/);
    assert(nonclosingPipeDestroyed,
      'SELFTEST nonclosing-stdio child did not release its owned stderr pipe');

    if (process.platform !== 'win32') {
      const descendantSource = `
        const fs = require('node:fs');
        const path = require('node:path');
        const profile = process.argv[1];
        const ready = path.join(profile, 'descendant-ready');
        fs.writeFileSync(ready, 'ready');
        setInterval(() => {
          if (fs.existsSync(profile)) return;
          fs.mkdirSync(profile, { recursive: true });
          fs.writeFileSync(path.join(profile, 'descendant-recreated-profile'), 'recreated');
        }, 1);
      `;
      const rootSource = `
        const { spawn } = require('node:child_process');
        const profile = process.argv[1];
        const descendantSource = ${JSON.stringify(descendantSource)};
        spawn(process.execPath, ['--input-type=commonjs', '-e', descendantSource, profile], {
          stdio: ['ignore', 'ignore', 'ignore'],
        });
        setInterval(() => {}, 1000);
      `;
      const processTreeFixture = ({ prefix, endpoint = 'valid', directOnly = false,
        validVersion = true, throwOnSocketClose = false,
        exitGroupOnBrowserClose = false }) => {
        const state = {
          child: null, childExited: null, childClosed: null,
          processTree: null, userData: null, gracefulCloseRequests: 0,
          cleanupSignals: [],
        };
        const launchFixture = ({ userData }) => {
          state.userData = userData;
          fs.mkdirSync(userData, { recursive: true });
          const activePort = path.join(userData, 'DevToolsActivePort');
          if (endpoint === 'valid') {
            fs.writeFileSync(activePort, '9\n/devtools/browser/selftest-process-tree\n');
          } else {
            fs.mkdirSync(activePort);
          }
          const child = spawn(process.execPath, [
            '--input-type=commonjs', '-e', rootSource, userData,
          ], {
            stdio: ['ignore', 'ignore', 'pipe'], detached: true,
          });
          state.child = child;
          state.childExited = new Promise((resolve) => child.once('exit', resolve));
          state.childClosed = new Promise((resolve) => child.once('close', resolve));
          state.processTree = ownedBrowserProcessTree(child, true);
          const readyFile = path.join(userData, 'descendant-ready');
          const readyDeadline = Date.now() + 500;
          const waitCell = new Int32Array(new SharedArrayBuffer(4));
          while (!fs.existsSync(readyFile) && Date.now() < readyDeadline) {
            Atomics.wait(waitCell, 0, 0, 5);
          }
          assert(fs.existsSync(readyFile),
            `SELFTEST process-group fixture ${prefix} did not start its descendant`);
          const selectedProcessTree = directOnly
            ? directChildProcessTree(child) : state.processTree;
          return Object.freeze({
            child,
            processTree: Object.freeze({
              kind: selectedProcessTree.kind,
              isAlive: () => selectedProcessTree.isAlive(),
              async signal(...args) {
                state.cleanupSignals.push(args[0]);
                return await selectedProcessTree.signal(...args);
              },
            }),
          });
        };
        class ProcessTreeWebSocket {
          static OPEN = 1;
          constructor() {
            this.readyState = 0;
            this.openTimer = setTimeout(() => {
              this.readyState = ProcessTreeWebSocket.OPEN;
              this.onopen?.();
            }, 0);
          }
          send(payload) {
            const message = JSON.parse(payload);
            if (message.method === 'Browser.close') {
              state.gracefulCloseRequests++;
              if (exitGroupOnBrowserClose) process.kill(-state.child.pid, 'SIGTERM');
              return;
            }
            assert(message.method === 'Browser.getVersion',
              `SELFTEST process-group fixture received unexpected ${message.method}`);
            const readyFile = path.join(state.userData, 'descendant-ready');
            const respond = () => {
              if (!fs.existsSync(readyFile)) { setTimeout(respond, 1); return; }
              this.onmessage?.({ data: JSON.stringify({
                id: message.id,
                result: {
                  product: validVersion ? 'Chrome/CDP-process-tree-selftest' : '',
                  revision: 'process-tree-revision',
                  userAgent: 'cf-browsercdp-process-tree-selftest',
                  jsVersion: 'process-tree-js', protocolVersion: '1.3',
                },
              }) });
            };
            respond();
          }
          close() {
            clearTimeout(this.openTimer);
            this.readyState = 3;
            if (throwOnSocketClose) throw new Error('injected WebSocket close failure');
          }
        }
        const open = () => openChromiumCdpWithLauncher({
          label: `CDP selftest process group ${prefix}`,
          userDataPrefix: prefix,
          commandTimeoutMs: 500,
          startupTimeoutMs: 1000,
          shutdownTimeoutMs: 1000,
          WebSocketImpl: ProcessTreeWebSocket,
        }, launchFixture);
        const cleanup = async () => {
          if (state.child !== null) {
            try {
              await terminateChildProcess(
                state.child, state.childExited, state.childClosed, state.processTree,
                `CDP selftest process group ${prefix} fallback cleanup`, 1000,
              );
            } catch { /* preserve the scenario's assertion; bounded fallback below */ }
          }
          if (state.processTree?.isAlive()) {
            await state.processTree.signal(
              'SIGKILL', `CDP selftest process group ${prefix} final cleanup`, 1000,
            );
            const fallbackQuiescent = await waitForTreeQuiescence(
              state.processTree, state.child, state.childExited, 1000,
            );
            assert(fallbackQuiescent,
              `SELFTEST process-group fixture ${prefix} survived fallback cleanup`);
          }
          if (state.userData !== null && fs.existsSync(state.userData)) {
            removeOwnedUserData(state.userData, fs.realpathSync(os.tmpdir()), prefix);
          }
          assertNoOwnedProfiles(prefix, `process-group ${prefix} fallback cleanup`);
        };
        return {
          open, cleanup,
          gracefulCloseRequests: () => state.gracefulCloseRequests,
          cleanupSignals: () => [...state.cleanupSignals],
        };
      };

      const gracefulTreePrefix = `${base}-tree-graceful`;
      const gracefulTree = processTreeFixture({
        prefix: gracefulTreePrefix, exitGroupOnBrowserClose: true,
      });
      try {
        const gracefulConnection = await gracefulTree.open();
        await gracefulConnection.close();
        assert(gracefulTree.gracefulCloseRequests() === 1,
          'SELFTEST graceful process group did not receive exactly one CDP Browser.close');
        assert(JSON.stringify(gracefulTree.cleanupSignals()) === JSON.stringify([]),
          `SELFTEST graceful process group required TERM/KILL escalation (${gracefulTree.cleanupSignals().join(', ')})`);
        assertNoOwnedProfiles(gracefulTreePrefix, 'graceful process-group cleanup');
      } finally { await gracefulTree.cleanup(); }

      const siblingChild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'], detached: true,
      });
      const siblingExited = new Promise((resolve) => siblingChild.once('exit', resolve));
      const siblingClosed = new Promise((resolve) => siblingChild.once('close', resolve));
      const siblingGroup = ownedBrowserProcessTree(siblingChild, true);
      try {
        const normalTreePrefix = `${base}-tree-normal`;
        const normalTree = processTreeFixture({ prefix: normalTreePrefix });
        try {
          const treeConnection = await normalTree.open();
          await treeConnection.close();
          assert(normalTree.gracefulCloseRequests() === 1,
            'SELFTEST normal connection did not request exactly one CDP Browser.close');
          assert(JSON.stringify(normalTree.cleanupSignals()) === JSON.stringify(['SIGTERM']),
            `SELFTEST live process group did not retain TERM escalation (${normalTree.cleanupSignals().join(', ')})`);
          assertNoOwnedProfiles(normalTreePrefix, 'owned process-group normal cleanup');
        } finally { await normalTree.cleanup(); }
        assert(siblingGroup.isAlive(),
          'SELFTEST owned POSIX process-group cleanup terminated a detached sibling group');
      } finally {
        await terminateChildProcess(
          siblingChild, siblingExited, siblingClosed, siblingGroup,
          'CDP selftest detached sibling group cleanup', 1000,
        );
      }

      const directNormalPrefix = `${base}-tree-direct-normal`;
      const directNormal = processTreeFixture({ prefix: directNormalPrefix, directOnly: true });
      try {
        const directConnection = await directNormal.open();
        await expectRejectedAsync('direct-PID normal cleanup profile recreation',
          () => directConnection.close(), /browser profile reappeared after cleanup/);
      } finally { await directNormal.cleanup(); }

      const throwingSocketPrefix = `${base}-tree-throwing-socket`;
      const throwingSocket = processTreeFixture({
        prefix: throwingSocketPrefix, throwOnSocketClose: true,
      });
      try {
        const throwingSocketConnection = await throwingSocket.open();
        await expectRejectedAsync('throwing WebSocket close still cleans process ownership',
          () => throwingSocketConnection.close(), /^injected WebSocket close failure$/);
        assertNoOwnedProfiles(throwingSocketPrefix,
          'throwing WebSocket close process-group cleanup');
      } finally { await throwingSocket.cleanup(); }

      const setupTreePrefix = `${base}-tree-setup-error`;
      const setupTree = processTreeFixture({ prefix: setupTreePrefix, validVersion: false });
      try {
        await expectRejectedAsync('owned process-group setup-error cleanup', setupTree.open,
          /CDP setup failed \(.* product: missing browser version field\)$/);
        assert(setupTree.gracefulCloseRequests() === 0,
          'SELFTEST incomplete CDP setup requested graceful Browser.close');
        assertNoOwnedProfiles(setupTreePrefix, 'owned process-group setup-error cleanup');
      } finally { await setupTree.cleanup(); }

      const directSetupPrefix = `${base}-tree-direct-setup-error`;
      const directSetup = processTreeFixture({
        prefix: directSetupPrefix, directOnly: true, validVersion: false,
      });
      try {
        const directSetupFailure = await expectRejectedAsync(
          'direct-PID setup-error cleanup causality', directSetup.open,
          /CDP setup failed \(.* product: missing browser version field\); cleanup failed \(.*browser profile reappeared after cleanup\)$/);
        assert(errorMessage(directSetupFailure.cause).includes('missing browser version field')
          && errorMessage(directSetupFailure.cleanupCause).includes('browser profile reappeared'),
        'SELFTEST setup-error cleanup did not retain distinct primary and cleanup causes');
      } finally { await directSetup.cleanup(); }

      const startupTreePrefix = `${base}-tree-startup-error`;
      const startupTree = processTreeFixture({ prefix: startupTreePrefix, endpoint: 'unsafe' });
      try {
        await expectRejectedAsync('owned process-group startup-error cleanup', startupTree.open,
          /DevToolsActivePort is not a real file$/);
        assert(startupTree.gracefulCloseRequests() === 0,
          'SELFTEST pre-socket startup failure requested graceful Browser.close');
        assertNoOwnedProfiles(startupTreePrefix, 'owned process-group startup-error cleanup');
      } finally { await startupTree.cleanup(); }

      const directStartupPrefix = `${base}-tree-direct-startup-error`;
      const directStartup = processTreeFixture({
        prefix: directStartupPrefix, endpoint: 'unsafe', directOnly: true,
      });
      try {
        await expectRejectedAsync('direct-PID startup-error cleanup causality', directStartup.open,
          /DevToolsActivePort is not a real file; cleanup failed \(.*browser profile reappeared after cleanup\)$/);
      } finally { await directStartup.cleanup(); }
    }

    if (process.platform === 'darwin') {
      const seatbeltBrowser = path.join(endpointFixture, 'seatbelt-marker-browser.mjs');
      const seatbeltTouched = path.join(endpointFixture, 'seatbelt-browser-was-spawned');
      const seatbeltPrefix = `${base}-seatbelt`;
      fs.writeFileSync(seatbeltBrowser,
        `#!/usr/bin/env node\nimport fs from 'node:fs';\nfs.writeFileSync(${JSON.stringify(seatbeltTouched)}, 'spawned');\n`);
      fs.chmodSync(seatbeltBrowser, 0o755);
      try {
        process.env.CF_BROWSER = seatbeltBrowser;
        process.env.CODEX_SANDBOX = 'seatbelt';
        await expectRejectedAsync('macOS Codex Seatbelt pre-spawn refusal', () => openChromiumCdp({
          label: 'CDP selftest macOS Seatbelt', userDataPrefix: seatbeltPrefix,
        }), /refusing macOS Chromium inside the Codex Seatbelt sandbox/);
        assert(!fs.existsSync(seatbeltTouched),
          'SELFTEST macOS Seatbelt guard touched the browser executable');
        assertNoOwnedProfiles(seatbeltPrefix, 'macOS Seatbelt pre-spawn refusal');
      } finally {
        if (priorCodexSandbox === undefined) delete process.env.CODEX_SANDBOX;
        else process.env.CODEX_SANDBOX = priorCodexSandbox;
      }
    }

    const childPrefix = `${base}-child`;
    process.env.CF_BROWSER = process.execPath;
    await expectRejectedAsync('browser child exit', () => openChromiumCdp({
      label: 'CDP selftest child exit', userDataPrefix: childPrefix,
      startupTimeoutMs: 1500, shutdownTimeoutMs: 500,
    }), /browser CDP did not start|browser exited/);
    assertNoOwnedProfiles(childPrefix, 'browser child exit cleanup');

    if (process.platform !== 'win32') {
      const markerBrowser = path.join(endpointFixture, 'marker-browser');
      fs.writeFileSync(markerBrowser,
        '#!/bin/sh\nprintf "CF_BROWSER_SELFTEST_EARLY_EXIT\\n" >&2\nexit 73\n');
      fs.chmodSync(markerBrowser, 0o755);
      const markerPrefix = `${base}-marker`;
      process.env.CF_BROWSER = markerBrowser;
      await expectRejectedAsync('browser exit diagnostics', () => openChromiumCdp({
        label: 'CDP selftest exit diagnostics', userDataPrefix: markerPrefix,
        startupTimeoutMs: 1500, shutdownTimeoutMs: 500,
      }), /exit=73[\s\S]*CF_BROWSER_SELFTEST_EARLY_EXIT/);
      assertNoOwnedProfiles(markerPrefix, 'browser exit diagnostics cleanup');
    }

    process.env.CF_BROWSER = actualBrowser;
    const unsafeEndpointCases = [
      {
        key: 'directory', create(activePortFile) {
          fs.mkdirSync(activePortFile);
        },
      },
      ...(process.platform === 'win32' ? [] : [{
        key: 'dangling-symlink', create(activePortFile) {
          fs.symlinkSync(`${activePortFile}-missing-target`, activePortFile);
        },
      }]),
    ];
    for (const scenario of unsafeEndpointCases) {
      let launches = 0;
      let childClosed = false;
      let socketConstructions = 0;
      const launchUnsafeEndpointFixture = ({ userData }) => {
        launches++;
        assert(launches === 1,
          `SELFTEST unsafe ${scenario.key} endpoint launched more than once`);
        fs.mkdirSync(userData, { recursive: true });
        scenario.create(path.join(userData, 'DevToolsActivePort'));
        const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
          stdio: ['ignore', 'ignore', 'pipe'],
        });
        child.once('close', () => { childClosed = true; });
        return child;
      };
      class UnsafeEndpointWebSocket {
        static OPEN = 1;
        constructor() { socketConstructions++; this.readyState = 0; }
        close() { this.readyState = 3; }
      }
      const prefix = `${base}-unsafe-${scenario.key}`;
      const label = `CDP selftest unsafe ${scenario.key} endpoint`;
      const rejection = await expectRejectedAsync(`unsafe ${scenario.key} endpoint`,
        () => openChromiumCdpWithLauncher({
          label, userDataPrefix: prefix, commandTimeoutMs: 100,
          startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
          WebSocketImpl: UnsafeEndpointWebSocket,
        }, launchUnsafeEndpointFixture),
        /DevToolsActivePort is not a real file/);
      assert(rejection.message === `${label}: DevToolsActivePort is not a real file`,
        `SELFTEST unsafe ${scenario.key} endpoint was not rejected immediately (${rejection.message})`);
      assert(launches === 1,
        `SELFTEST unsafe ${scenario.key} endpoint: expected one launch, got ${launches}`);
      assert(socketConstructions === 0,
        `SELFTEST unsafe ${scenario.key} endpoint constructed a WebSocket`);
      assert(childClosed,
        `SELFTEST unsafe ${scenario.key} endpoint did not close its child`);
      assertNoOwnedProfiles(prefix, `unsafe ${scenario.key} endpoint cleanup`);
    }

    const endpointPublicationCases = [
      {
        key: 'valid-prefix', initial: '9\n/devtools/browser/selftest-staged',
        finalPath: '/devtools/browser/selftest-staged-complete',
      },
      {
        key: 'missing-endpoint', initial: '9\n',
        finalPath: '/devtools/browser/selftest-missing-endpoint-complete',
      },
      {
        key: 'invalid-endpoint', initial: '9\n/devtools/browser/\n',
        finalPath: '/devtools/browser/selftest-invalid-endpoint-complete',
      },
    ];
    for (const scenario of endpointPublicationCases) {
      let launches = 0;
      let socketClosed = false;
      let constructedUrl = null;
      const expectedUrl = `ws://127.0.0.1:9${scenario.finalPath}`;
      const launchEndpointPublicationFixture = ({ userData }) => {
        launches++;
        assert(launches === 1,
          `SELFTEST ${scenario.key} endpoint fixture launched more than once`);
        fs.mkdirSync(userData, { recursive: true });
        const activePortFile = path.join(userData, 'DevToolsActivePort');
        fs.writeFileSync(activePortFile, scenario.initial);
        const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
          stdio: ['ignore', 'ignore', 'pipe'],
        });
        const completeTimer = setTimeout(() => {
          if (fs.existsSync(userData)) {
            fs.writeFileSync(activePortFile, `9\n${scenario.finalPath}\n`);
          }
        }, 50);
        child.once('close', () => clearTimeout(completeTimer));
        return child;
      };
      class EndpointPublicationWebSocket {
        static OPEN = 1;
        constructor(url) {
          constructedUrl = url;
          assert(url === expectedUrl,
            `SELFTEST ${scenario.key} endpoint constructed the wrong socket (${url})`);
          this.readyState = 0;
          this.openTimer = setTimeout(() => {
            this.readyState = EndpointPublicationWebSocket.OPEN;
            this.onopen?.();
          }, 0);
        }
        send(payload) {
          const message = JSON.parse(payload);
          queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({
            id: message.id,
            result: {
              product: `Chrome/CDP-${scenario.key}`, revision: `${scenario.key}-revision`,
              userAgent: `cf-browsercdp-${scenario.key}`, jsVersion: `${scenario.key}-js`,
              protocolVersion: '1.3',
            },
          }) }));
        }
        close() {
          clearTimeout(this.openTimer);
          socketClosed = true;
          this.readyState = 3;
        }
      }
      const prefix = `${base}-${scenario.key}-endpoint`;
      const connection = await openChromiumCdpWithLauncher({
        label: `CDP selftest ${scenario.key} endpoint publication`, userDataPrefix: prefix,
        commandTimeoutMs: 100, startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
        WebSocketImpl: EndpointPublicationWebSocket,
      }, launchEndpointPublicationFixture);
      try {
        assert(connection.browser.product === `Chrome/CDP-${scenario.key}`,
          `SELFTEST ${scenario.key} endpoint did not reach Browser.getVersion`);
      } finally {
        await connection.close();
      }
      assert(launches === 1,
        `SELFTEST ${scenario.key} endpoint: expected one launch, got ${launches}`);
      assert(constructedUrl === expectedUrl,
        `SELFTEST ${scenario.key} endpoint did not use the final complete endpoint`);
      assert(socketClosed,
        `SELFTEST ${scenario.key} endpoint did not close its injected socket`);
      assertNoOwnedProfiles(prefix, `${scenario.key} endpoint publication cleanup`);
    }

    let receiptDeadlineLaunches = 0;
    let receiptDeadlineSocketClosed = false;
    let receiptClock = 0;
    let expireDuringInitialArm = false;
    let initialArmClockReads = 0;
    let expiredInitialArmSendObserved = false;
    const receiptScenarios = new Map([
      ['Browser.CfBeforeDeadline', { offsetMs: 99.999, result: { timely: true } }],
      ['Browser.CfExactDeadline', { offsetMs: 100, result: { exact: true } }],
      ['Browser.CfJustLate', { offsetMs: 100.241274, result: { late: true } }],
      ['Browser.CfEarlyProtocolError', {
        offsetMs: 99, error: { message: 'injected early protocol error' },
      }],
      ['Browser.CfExactProtocolError', {
        offsetMs: 100, error: { message: 'injected exact protocol error' },
      }],
      ['Browser.CfLateProtocolError', {
        offsetMs: 100.241274, error: { message: 'injected late protocol error' },
      }],
    ]);
    const observedReceiptMethods = [];
    const launchReceiptDeadlineFixture = ({ userData }) => {
      receiptDeadlineLaunches++;
      assert(receiptDeadlineLaunches === 1,
        'SELFTEST command-receipt deadline fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest-command-receipt\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class ReceiptDeadlineWebSocket {
      static OPEN = 1;
      constructor() {
        this.readyState = 0;
        this.openTimer = setTimeout(() => {
          this.readyState = ReceiptDeadlineWebSocket.OPEN;
          this.onopen?.();
        }, 0);
      }
      send(payload) {
        const message = JSON.parse(payload);
        if (message.method === 'Browser.getVersion') {
          receiptClock += 1;
          this.onmessage?.({ data: JSON.stringify({
            id: message.id,
            result: {
              product: 'Chrome/CDP-receipt-selftest', revision: 'receipt-revision',
              userAgent: 'cf-browsercdp-receipt-selftest', jsVersion: 'receipt-js',
              protocolVersion: '1.3',
            },
          }) });
          return;
        }
        if (message.method === 'Browser.CfExpiredDuringInitialArm') {
          expiredInitialArmSendObserved = true;
          return;
        }
        if (message.method === 'Browser.close') return;
        const scenario = receiptScenarios.get(message.method);
        assert(scenario, `SELFTEST unexpected command-receipt method ${message.method}`);
        observedReceiptMethods.push(message.method);
        receiptClock += scenario.offsetMs;
        this.onmessage?.({ data: JSON.stringify({
          id: message.id, ...(scenario.error ? { error: scenario.error } : { result: scenario.result }),
        }) });
      }
      close() {
        clearTimeout(this.openTimer);
        receiptDeadlineSocketClosed = true;
        this.readyState = 3;
      }
    }
    const receiptDeadlinePrefix = `${base}-command-receipt-deadline`;
    const receiptNowMs = () => {
      if (expireDuringInitialArm) {
        initialArmClockReads++;
        if (initialArmClockReads === 2) {
          receiptClock += 100;
          expireDuringInitialArm = false;
        }
      }
      return receiptClock;
    };
    const receiptConnection = await openChromiumCdpWithLauncher({
      label: 'CDP selftest command receipt deadline', userDataPrefix: receiptDeadlinePrefix,
      commandTimeoutMs: 100, startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
      WebSocketImpl: ReceiptDeadlineWebSocket,
    }, launchReceiptDeadlineFixture, receiptNowMs);
    try {
      expireDuringInitialArm = true;
      initialArmClockReads = 0;
      await expectRejectedAsync('command expired during initial deadline arm',
        () => receiptConnection.send('Browser.CfExpiredDuringInitialArm'),
        /timed out waiting for Browser\.CfExpiredDuringInitialArm/);
      assert(initialArmClockReads === 2 && !expiredInitialArmSendObserved,
        'SELFTEST command expired during initial arm was transmitted after its timeout');
      const beforeDeadline = await receiptConnection.send('Browser.CfBeforeDeadline');
      assert(beforeDeadline.timely === true,
        'SELFTEST just-before command response was rejected');
      await expectRejectedAsync('exact command response receipt',
        () => receiptConnection.send('Browser.CfExactDeadline'),
        /timed out waiting for Browser\.CfExactDeadline/);
      await expectRejectedAsync('just-late command response receipt',
        () => receiptConnection.send('Browser.CfJustLate'),
        /timed out waiting for Browser\.CfJustLate/);
      await expectRejectedAsync('early command protocol error receipt',
        () => receiptConnection.send('Browser.CfEarlyProtocolError'),
        /injected early protocol error/);
      await expectRejectedAsync('exact command protocol-error receipt',
        () => receiptConnection.send('Browser.CfExactProtocolError'),
        /timed out waiting for Browser\.CfExactProtocolError/);
      await expectRejectedAsync('late command protocol-error receipt',
        () => receiptConnection.send('Browser.CfLateProtocolError'),
        /timed out waiting for Browser\.CfLateProtocolError/);
    } finally {
      await receiptConnection.close();
    }
    assert(JSON.stringify(observedReceiptMethods) === JSON.stringify([...receiptScenarios.keys()]),
      `SELFTEST command-receipt controls were incomplete (${observedReceiptMethods.join(', ')})`);
    assert(receiptDeadlineLaunches === 1 && receiptDeadlineSocketClosed,
      'SELFTEST command-receipt deadline did not close its one injected socket');
    assertNoOwnedProfiles(receiptDeadlinePrefix, 'command-receipt deadline cleanup');

    let malformedEndpointLaunches = 0;
    let malformedEndpointChildClosed = false;
    let malformedEndpointSocketConstructions = 0;
    const launchMalformedEndpointFixture = ({ userData }) => {
      malformedEndpointLaunches++;
      assert(malformedEndpointLaunches === 1,
        'SELFTEST persistent-malformed endpoint fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        'not-a-port\n/devtools/browser/selftest-persistent-malformed\n');
      const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      child.once('close', () => { malformedEndpointChildClosed = true; });
      return child;
    };
    class MalformedEndpointWebSocket {
      static OPEN = 1;
      constructor() { malformedEndpointSocketConstructions++; this.readyState = 0; }
      close() { this.readyState = 3; }
    }
    const malformedEndpointPrefix = `${base}-persistent-malformed-endpoint`;
    let malformedEndpointClockReads = 0;
    const malformedEndpointClockValues = [0, 0, 0, 1, 1, 2, 2, 3];
    const malformedEndpointClock = () =>
      malformedEndpointClockValues[malformedEndpointClockReads++] ?? 3;
    await expectRejectedAsync('persistent malformed endpoint publication',
      () => openChromiumCdpWithLauncher({
        label: 'CDP selftest persistent malformed endpoint',
        userDataPrefix: malformedEndpointPrefix,
        commandTimeoutMs: 100, startupTimeoutMs: 3, shutdownTimeoutMs: 2000,
        WebSocketImpl: MalformedEndpointWebSocket,
      }, launchMalformedEndpointFixture, malformedEndpointClock),
      /browser CDP did not start .*startup-timeout=3ms; endpoint-invalid-observations=3; endpoint-last-error="DevToolsActivePort has an invalid port"/);
    assert(malformedEndpointLaunches === 1,
      `SELFTEST persistent malformed endpoint: expected one launch, got ${malformedEndpointLaunches}`);
    assert(malformedEndpointClockReads === malformedEndpointClockValues.length,
      `SELFTEST persistent malformed endpoint did not consume its exact deadline observations (${malformedEndpointClockReads})`);
    assert(malformedEndpointSocketConstructions === 0,
      'SELFTEST persistent malformed endpoint constructed a WebSocket');
    assert(malformedEndpointChildClosed,
      'SELFTEST persistent malformed endpoint did not close its child');
    assertNoOwnedProfiles(malformedEndpointPrefix, 'persistent malformed endpoint cleanup');

    let endpointFixtureLaunches = 0;
    let endpointFixtureSocketClosed = false;
    const launchEndpointFixture = ({ userData }) => {
      endpointFixtureLaunches++;
      assert(endpointFixtureLaunches === 1,
        'SELFTEST WebSocket open timeout launched its endpoint fixture more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class NeverOpeningWebSocket {
      static OPEN = 1;
      constructor() { this.readyState = 0; }
      close() { endpointFixtureSocketClosed = true; this.readyState = 3; }
    }
    const openPrefix = `${base}-open`;
    await expectRejectedAsync('WebSocket open timeout', () => openChromiumCdpWithLauncher({
      label: 'CDP selftest WebSocket timeout', userDataPrefix: openPrefix,
      commandTimeoutMs: 1500, webSocketOpenTimeoutMs: 200,
      startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
      WebSocketImpl: NeverOpeningWebSocket,
    }, launchEndpointFixture),
    /timed out opening the CDP WebSocket .*socket-timeout=200ms; configured=200ms; .*startup-timeout=1000ms/);
    assert(endpointFixtureLaunches === 1,
      `SELFTEST WebSocket open timeout: expected one endpoint fixture launch, got ${endpointFixtureLaunches}`);
    assert(endpointFixtureSocketClosed,
      'SELFTEST WebSocket open timeout did not close its injected socket');
    assertNoOwnedProfiles(openPrefix, 'WebSocket open-timeout cleanup');

    let clippedEndpointLaunches = 0;
    let clippedEndpointSocketClosed = false;
    const launchClippedEndpointFixture = ({ userData }) => {
      clippedEndpointLaunches++;
      assert(clippedEndpointLaunches === 1,
        'SELFTEST startup-clipped WebSocket fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest-startup-clipped\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class StartupClippedWebSocket {
      static OPEN = 1;
      constructor() {
        this.readyState = 0;
        this.openTimer = setTimeout(() => {
          this.readyState = StartupClippedWebSocket.OPEN;
          this.onopen?.();
        }, 300);
      }
      close() {
        clearTimeout(this.openTimer);
        clippedEndpointSocketClosed = true;
        this.readyState = 3;
      }
    }
    const clippedPrefix = `${base}-startup-clipped`;
    let clippedClockReads = 0;
    const clippedClock = () => (++clippedClockReads === 1 ? 0 : 50);
    await expectRejectedAsync('startup-clipped WebSocket timeout',
      () => openChromiumCdpWithLauncher({
        label: 'CDP selftest startup-clipped WebSocket', userDataPrefix: clippedPrefix,
        commandTimeoutMs: 100, webSocketOpenTimeoutMs: 1000,
        startupTimeoutMs: 200, shutdownTimeoutMs: 2000,
        WebSocketImpl: StartupClippedWebSocket,
      }, launchClippedEndpointFixture, clippedClock),
      /timed out opening the CDP WebSocket .*socket-timeout=150ms; configured=1000ms; endpoint-ready=50ms; startup-timeout=200ms/);
    assert(clippedEndpointLaunches === 1,
      `SELFTEST startup-clipped WebSocket: expected one fixture launch, got ${clippedEndpointLaunches}`);
    assert(clippedEndpointSocketClosed,
      'SELFTEST startup-clipped WebSocket did not close its injected socket');
    assertNoOwnedProfiles(clippedPrefix, 'startup-clipped WebSocket cleanup');

    let expiredDeadlineLaunches = 0;
    let expiredDeadlineSocketConstructions = 0;
    const launchExpiredDeadlineFixture = ({ userData }) => {
      expiredDeadlineLaunches++;
      assert(expiredDeadlineLaunches === 1,
        'SELFTEST expired-startup fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest-expired-startup\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class ExpiredDeadlineWebSocket {
      static OPEN = 1;
      constructor() { expiredDeadlineSocketConstructions++; this.readyState = 0; }
      close() { this.readyState = 3; }
    }
    let deadlineClockReads = 0;
    const expiredDeadlineClockValues = [0, 1, 2, 2, 2, 100];
    const expiredDeadlineClock = () =>
      expiredDeadlineClockValues[deadlineClockReads++] ?? 100;
    const expiredDeadlinePrefix = `${base}-expired-startup`;
    await expectRejectedAsync('expired startup before WebSocket construction',
      () => openChromiumCdpWithLauncher({
        label: 'CDP selftest expired startup', userDataPrefix: expiredDeadlinePrefix,
        commandTimeoutMs: 100, startupTimeoutMs: 100, shutdownTimeoutMs: 2000,
        WebSocketImpl: ExpiredDeadlineWebSocket,
      }, launchExpiredDeadlineFixture, expiredDeadlineClock),
      /startup deadline expired before CDP WebSocket construction .*endpoint-ready=2ms; startup-timeout=100ms/);
    assert(expiredDeadlineLaunches === 1,
      `SELFTEST expired startup: expected one fixture launch, got ${expiredDeadlineLaunches}`);
    assert(expiredDeadlineSocketConstructions === 0,
      'SELFTEST expired startup constructed a WebSocket after its absolute deadline');
    assertNoOwnedProfiles(expiredDeadlinePrefix, 'expired-startup cleanup');

    let constructorOverrunLaunches = 0;
    let constructorOverrunSocketClosed = false;
    let constructorOverrunErrorGuarded = false;
    let constructorOverrunClock = 0;
    const launchConstructorOverrunFixture = ({ userData }) => {
      constructorOverrunLaunches++;
      assert(constructorOverrunLaunches === 1,
        'SELFTEST constructor-overrun fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest-constructor-overrun\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class ConstructorOverrunWebSocket {
      static OPEN = 1;
      constructor() { this.readyState = 0; constructorOverrunClock = 100; }
      close() {
        constructorOverrunErrorGuarded = typeof this.onerror === 'function';
        constructorOverrunSocketClosed = true;
        this.readyState = 3;
      }
    }
    const constructorOverrunPrefix = `${base}-constructor-overrun`;
    await expectRejectedAsync('WebSocket constructor deadline overrun',
      () => openChromiumCdpWithLauncher({
        label: 'CDP selftest constructor overrun', userDataPrefix: constructorOverrunPrefix,
        commandTimeoutMs: 1000, webSocketOpenTimeoutMs: 100,
        startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
        WebSocketImpl: ConstructorOverrunWebSocket,
      }, launchConstructorOverrunFixture, () => constructorOverrunClock),
      /CDP WebSocket deadline expired during construction .*socket-timeout=100ms; configured=100ms; endpoint-ready=0ms; startup-timeout=1000ms/);
    assert(constructorOverrunLaunches === 1,
      `SELFTEST constructor overrun: expected one fixture launch, got ${constructorOverrunLaunches}`);
    assert(constructorOverrunSocketClosed,
      'SELFTEST constructor overrun did not close its injected socket');
    assert(constructorOverrunErrorGuarded,
      'SELFTEST constructor overrun closed a CONNECTING socket without an error handler');
    assertNoOwnedProfiles(constructorOverrunPrefix, 'constructor-overrun cleanup');

    let delayedEndpointLaunches = 0;
    let delayedEndpointSocketClosed = false;
    const launchDelayedEndpointFixture = ({ userData }) => {
      delayedEndpointLaunches++;
      assert(delayedEndpointLaunches === 1,
        'SELFTEST delayed WebSocket fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest-delayed\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class DelayedOpeningWebSocket {
      static OPEN = 1;
      constructor() {
        this.readyState = 0;
        this.openTimer = setTimeout(() => {
          this.readyState = DelayedOpeningWebSocket.OPEN;
          this.onopen?.();
        }, 300);
      }
      send(payload) {
        const message = JSON.parse(payload);
        queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({
          id: message.id,
          result: {
            product: 'Chrome/CDP-selftest', revision: 'selftest-revision',
            userAgent: 'cf-browsercdp-selftest', jsVersion: 'selftest-js', protocolVersion: '1.3',
          },
        }) }));
      }
      close() {
        clearTimeout(this.openTimer);
        delayedEndpointSocketClosed = true;
        this.readyState = 3;
      }
    }

    let socketCapLaunches = 0;
    let socketCapClosed = false;
    const launchSocketCapFixture = ({ userData }) => {
      socketCapLaunches++;
      assert(socketCapLaunches === 1,
        'SELFTEST configured socket-cap fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest-socket-cap\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class SocketCapOpeningWebSocket extends DelayedOpeningWebSocket {
      close() {
        clearTimeout(this.openTimer);
        socketCapClosed = true;
        this.readyState = 3;
      }
    }
    const socketCapPrefix = `${base}-socket-cap`;
    await expectRejectedAsync('configured WebSocket open cap',
      () => openChromiumCdpWithLauncher({
        label: 'CDP selftest configured socket cap', userDataPrefix: socketCapPrefix,
        commandTimeoutMs: 1000, webSocketOpenTimeoutMs: 200,
        startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
        WebSocketImpl: SocketCapOpeningWebSocket,
      }, launchSocketCapFixture),
      /timed out opening the CDP WebSocket .*socket-timeout=200ms; configured=200ms; .*startup-timeout=1000ms/);
    assert(socketCapLaunches === 1,
      `SELFTEST configured socket cap: expected one fixture launch, got ${socketCapLaunches}`);
    assert(socketCapClosed,
      'SELFTEST configured socket cap did not close its injected socket');
    assertNoOwnedProfiles(socketCapPrefix, 'configured socket-cap cleanup');

    let lateOpenLaunches = 0;
    let lateOpenSocketClosed = false;
    let lateOpenClock = 0;
    const launchLateOpenFixture = ({ userData }) => {
      lateOpenLaunches++;
      assert(lateOpenLaunches === 1,
        'SELFTEST just-late WebSocket fixture launched more than once');
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
        '9\n/devtools/browser/selftest-just-late\n');
      return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
    };
    class JustLateOpeningWebSocket {
      static OPEN = 1;
      constructor() { this.readyState = 0; this.openHandler = null; }
      set onopen(handler) {
        this.openHandler = handler;
        lateOpenClock = 100;
        this.readyState = JustLateOpeningWebSocket.OPEN;
        handler();
      }
      get onopen() { return this.openHandler; }
      close() { lateOpenSocketClosed = true; this.readyState = 3; }
    }
    const lateOpenPrefix = `${base}-just-late`;
    await expectRejectedAsync('just-late WebSocket event',
      () => openChromiumCdpWithLauncher({
        label: 'CDP selftest just-late WebSocket', userDataPrefix: lateOpenPrefix,
        commandTimeoutMs: 1000, webSocketOpenTimeoutMs: 100,
        startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
        WebSocketImpl: JustLateOpeningWebSocket,
      }, launchLateOpenFixture, () => lateOpenClock),
      /CDP WebSocket opened after its deadline .*socket-timeout=100ms; configured=100ms; endpoint-ready=0ms; startup-timeout=1000ms/);
    assert(lateOpenLaunches === 1,
      `SELFTEST just-late WebSocket: expected one fixture launch, got ${lateOpenLaunches}`);
    assert(lateOpenSocketClosed,
      'SELFTEST just-late WebSocket did not close its injected socket');
    assertNoOwnedProfiles(lateOpenPrefix, 'just-late WebSocket cleanup');

    const delayedPrefix = `${base}-delayed-open`;
    const delayedConnection = await openChromiumCdpWithLauncher({
      label: 'CDP selftest delayed WebSocket', userDataPrefix: delayedPrefix,
      commandTimeoutMs: 100,
      startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
      WebSocketImpl: DelayedOpeningWebSocket,
    }, launchDelayedEndpointFixture);
    try {
      assert(delayedConnection.browser.product === 'Chrome/CDP-selftest',
        'SELFTEST delayed WebSocket did not reach Browser.getVersion');
    } finally {
      await delayedConnection.close();
    }
    assert(delayedEndpointLaunches === 1,
      `SELFTEST delayed WebSocket: expected one fixture launch, got ${delayedEndpointLaunches}`);
    assert(delayedEndpointSocketClosed,
      'SELFTEST delayed WebSocket did not close its injected socket');
    assertNoOwnedProfiles(delayedPrefix, 'delayed WebSocket cleanup');

    let invalidOpenTimeoutLaunches = 0;
    const invalidOpenTimeoutPrefix = `${base}-invalid-open-timeout`;
    await expectRejectedAsync('invalid WebSocket open timeout', () => openChromiumCdpWithLauncher({
      label: 'CDP selftest invalid WebSocket timeout', userDataPrefix: invalidOpenTimeoutPrefix,
      commandTimeoutMs: 100, webSocketOpenTimeoutMs: 0,
      startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
      WebSocketImpl: DelayedOpeningWebSocket,
    }, () => { invalidOpenTimeoutLaunches++; return null; }), /WebSocket open timeout must be a positive integer/);
    assert(invalidOpenTimeoutLaunches === 0,
      'SELFTEST invalid WebSocket timeout reached the launcher');
    assertNoOwnedProfiles(invalidOpenTimeoutPrefix, 'invalid WebSocket timeout pre-launch rejection');

    let fractionalOpenTimeoutLaunches = 0;
    const fractionalOpenTimeoutPrefix = `${base}-fractional-open-timeout`;
    await expectRejectedAsync('fractional WebSocket open timeout', () => openChromiumCdpWithLauncher({
      label: 'CDP selftest fractional WebSocket timeout', userDataPrefix: fractionalOpenTimeoutPrefix,
      commandTimeoutMs: 100, webSocketOpenTimeoutMs: 0.5,
      startupTimeoutMs: 1000, shutdownTimeoutMs: 2000,
      WebSocketImpl: DelayedOpeningWebSocket,
    }, () => { fractionalOpenTimeoutLaunches++; return null; }),
    /WebSocket open timeout must be a positive integer/);
    assert(fractionalOpenTimeoutLaunches === 0,
      'SELFTEST fractional WebSocket timeout reached the launcher');
    assertNoOwnedProfiles(fractionalOpenTimeoutPrefix,
      'fractional WebSocket timeout pre-launch rejection');

    const capturedColdEvent = () => {};
    const capturedColdResult = Object.freeze({ kind: 'captured-cold-selftest-opener' });
    let capturedColdOptions = null;
    const returnedColdResult = await openColdSelftestCdp({
      label: 'CDP selftest captured cold caller',
      userDataPrefix: `${base}-cold-caller-capture`,
      onEvent: capturedColdEvent,
    }, (options) => {
      capturedColdOptions = options;
      return capturedColdResult;
    });
    assert(returnedColdResult === capturedColdResult,
      'SELFTEST cold caller did not return its injected opener result');
    assert(capturedColdOptions?.label === 'CDP selftest captured cold caller'
      && capturedColdOptions.userDataPrefix === `${base}-cold-caller-capture`
      && capturedColdOptions.commandTimeoutMs === 1_500
      && capturedColdOptions.webSocketOpenTimeoutMs === 15_000
      && capturedColdOptions.startupTimeoutMs === 45_000
      && capturedColdOptions.shutdownTimeoutMs === 2_000
      && capturedColdOptions.onEvent === capturedColdEvent,
    `SELFTEST cold caller options drifted (${JSON.stringify(capturedColdOptions)})`);
    assert(JSON.stringify(Object.keys(capturedColdOptions).sort()) === JSON.stringify([
      'commandTimeoutMs', 'label', 'onEvent', 'shutdownTimeoutMs',
      'startupTimeoutMs', 'userDataPrefix', 'webSocketOpenTimeoutMs',
    ]), 'SELFTEST cold caller exposed unowned options');

    /* CI observed a stable Edge endpoint at 23,658ms. Exercise that exact
       late-publication shape without a real browser or wall-clock wait: the
       45-second caller envelope must retain the full 15-second socket cap,
       admit 38,657ms, and reject the exact/just-late 38,658/38,659ms edges. */
    const coldEnvelopeScenarios = [
      { key: 'just-before', openAtMs: 38_657, accepted: true },
      { key: 'exact', openAtMs: 38_658, accepted: false },
      { key: 'just-late', openAtMs: 38_659, accepted: false },
    ];
    for (const scenario of coldEnvelopeScenarios) {
      let launches = 0;
      let childClosed = false;
      let socketClosed = false;
      let clockReads = 0;
      let clock = 0;
      const prefix = `${base}-cold-envelope-${scenario.key}`;
      const launchColdEnvelopeFixture = ({ userData }) => {
        launches++;
        assert(launches === 1,
          `SELFTEST cold envelope ${scenario.key} fixture launched more than once`);
        fs.mkdirSync(userData, { recursive: true });
        fs.writeFileSync(path.join(userData, 'DevToolsActivePort'),
          `9\n/devtools/browser/selftest-cold-envelope-${scenario.key}\n`);
        const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
          stdio: ['ignore', 'ignore', 'pipe'],
        });
        child.once('close', () => { childClosed = true; });
        return child;
      };
      const coldEnvelopeClock = () => {
        clockReads++;
        if (clockReads === 1) return 0;
        if (clock < 23_658) clock = 23_658;
        return clock;
      };
      class ColdEnvelopeWebSocket {
        static OPEN = 1;
        constructor() { this.readyState = 0; this.openHandler = null; }
        set onopen(handler) {
          this.openHandler = handler;
          clock = scenario.openAtMs;
          this.readyState = ColdEnvelopeWebSocket.OPEN;
          handler();
        }
        get onopen() { return this.openHandler; }
        send(payload) {
          const message = JSON.parse(payload);
          queueMicrotask(() => this.onmessage?.({ data: JSON.stringify({
            id: message.id,
            result: {
              product: 'Chrome/CDP-cold-envelope-selftest',
              revision: 'cold-envelope-revision',
              userAgent: 'cf-browsercdp-cold-envelope-selftest',
              jsVersion: 'cold-envelope-js', protocolVersion: '1.3',
            },
          }) }));
        }
        close() { socketClosed = true; this.readyState = 3; }
      }
      const openColdEnvelope = () => openColdSelftestCdp({
        label: `CDP selftest cold envelope ${scenario.key}`,
        userDataPrefix: prefix,
      }, (options) => openChromiumCdpWithLauncher({
        ...options,
        WebSocketImpl: ColdEnvelopeWebSocket,
      }, launchColdEnvelopeFixture, coldEnvelopeClock));
      if (scenario.accepted) {
        let coldEnvelopeConnection = null;
        try {
          coldEnvelopeConnection = await openColdEnvelope();
          assert(coldEnvelopeConnection.browser.product === 'Chrome/CDP-cold-envelope-selftest',
            'SELFTEST cold envelope just-before control did not reach Browser.getVersion');
        } finally {
          await coldEnvelopeConnection?.close();
        }
      } else {
        await expectRejectedAsync(`cold envelope ${scenario.key} socket boundary`,
          openColdEnvelope,
          /CDP WebSocket opened after its deadline .*socket-timeout=15000ms; configured=15000ms; endpoint-ready=23658ms; startup-timeout=45000ms/);
      }
      assert(launches === 1,
        `SELFTEST cold envelope ${scenario.key}: expected one fixture launch, got ${launches}`);
      assert(socketClosed,
        `SELFTEST cold envelope ${scenario.key} did not close its injected socket`);
      assert(childClosed,
        `SELFTEST cold envelope ${scenario.key} did not close its fixture child`);
      assertNoOwnedProfiles(prefix, `cold envelope ${scenario.key} cleanup`);
    }

    const livePrefix = `${base}-live`;
    const liveEvents = [];
    let connection = null;
    try {
      connection = await openColdSelftestCdp({
        label: 'CDP selftest live browser', userDataPrefix: livePrefix,
        onEvent: (event) => liveEvents.push(event),
      });
      assert(connection.browser.executable === portable(actualBrowser),
        'SELFTEST live browser provenance did not preserve the selected executable');
      await expectRejectedAsync('CDP command error',
        () => connection.send('Browser.CfSelftestMissingMethod'), /wasn't found|not found|unknown/i);
      const target = await connection.send('Target.createTarget', { url: 'about:blank' });
      const attached = await connection.send('Target.attachToTarget', {
        targetId: target.targetId, flatten: true,
      });
      await connection.send('Runtime.enable', {}, attached.sessionId);
      await connection.send('Runtime.evaluate', {
        expression: `console.log('cf-browsercdp-event-${nonce}')`, returnByValue: true,
      }, attached.sessionId);
      for (let i = 0; i < 20 && !liveEvents.some((event) =>
        event.method === 'Runtime.consoleAPICalled'
        && JSON.stringify(event.params).includes(`cf-browsercdp-event-${nonce}`)); i++) await sleep(10);
      assert(liveEvents.some((event) => event.method === 'Runtime.consoleAPICalled'
        && JSON.stringify(event.params).includes(`cf-browsercdp-event-${nonce}`)),
      'SELFTEST CDP events were not forwarded to the owned handler');
      await expectRejectedAsync('CDP command timeout', () => connection.send('Runtime.evaluate', {
        expression: 'new Promise(() => {})', awaitPromise: true, returnByValue: true,
      }, attached.sessionId), /timed out waiting for Runtime\.evaluate/);

      const boundedStartedAt = Date.now();
      await expectRejectedAsync('CDP per-command timeout', () => connection.send('Runtime.evaluate', {
        expression: 'new Promise(() => {})', awaitPromise: true, returnByValue: true,
      }, attached.sessionId, { timeoutMs: 75 }), /timed out waiting for Runtime\.evaluate/);
      assert(Date.now() - boundedStartedAt < 750,
        'SELFTEST per-command timeout did not honor its shorter phase-owned bound');
      await expectRejectedAsync('CDP per-command timeout expansion', () => connection.send(
        'Browser.getVersion', {}, undefined, { timeoutMs: 1501 },
      ), /no greater than 1500/);

      const pending = connection.send('Runtime.evaluate', {
        expression: 'new Promise(() => {})', awaitPromise: true, returnByValue: true,
      }, attached.sessionId);
      await sleep(50);
      const closing = connection.close();
      await expectRejectedAsync('pending rejection on close', () => pending,
        /CDP connection closed|CDP WebSocket closed|browser exited/);
      await closing;
    } finally {
      await connection?.close();
      assertNoOwnedProfiles(livePrefix, 'live-browser rejection/normal cleanup');
    }

    const eventFailurePrefix = `${base}-event-failure`;
    let eventFailure = null;
    try {
      eventFailure = await openChromiumCdp({
        label: 'CDP selftest event failure', userDataPrefix: eventFailurePrefix,
        commandTimeoutMs: 1500, webSocketOpenTimeoutMs: 10000,
        startupTimeoutMs: 10000, shutdownTimeoutMs: 2000,
        onEvent(event) {
          if (event.method === 'Runtime.consoleAPICalled') throw new Error('injected event failure');
        },
      });
      const target = await eventFailure.send('Target.createTarget', { url: 'about:blank' });
      const attached = await eventFailure.send('Target.attachToTarget', {
        targetId: target.targetId, flatten: true,
      });
      await eventFailure.send('Runtime.enable', {}, attached.sessionId);
      await eventFailure.send('Runtime.evaluate', {
        expression: `console.log('cf-browsercdp-event-failure-${nonce}')`, returnByValue: true,
      }, attached.sessionId).catch(() => { /* event may beat the response */ });
      await sleep(20);
      await expectRejectedAsync('CDP event-handler failure',
        () => eventFailure.send('Browser.getVersion'), /event handler failed.*injected event failure/);
    } finally {
      await eventFailure?.close();
      assertNoOwnedProfiles(eventFailurePrefix, 'event-handler rejection/normal cleanup');
    }
  } finally {
    if (priorExplicit === undefined) delete process.env.CF_BROWSER;
    else process.env.CF_BROWSER = priorExplicit;
    if (priorCodexSandbox === undefined) delete process.env.CODEX_SANDBOX;
    else process.env.CODEX_SANDBOX = priorCodexSandbox;
    fs.rmSync(endpointFixture, { recursive: true, force: true });
  }
  console.log('BROWSER CDP SELFTEST PASS');
  console.log(`  malformed/directory${process.platform === 'win32' ? '' : '/dangling-symlink'} DevToolsActivePort: rejected`);
  console.log('  exited child + inherited stderr: owned pipe released; close observed without SIGKILL');
  console.log('  SIGTERM-resistant child: exited after bounded SIGKILL; owned pipe released');
  console.log('  no exit after SIGKILL: exact bounded-shutdown rejection');
  console.log('  exit + nonclosing stdio after pipe release: exact stdio-close rejection');
  console.log(`  owned process-boundary normal/setup/startup/socket-close cleanup: ${process.platform === 'win32' ? 'bounded taskkill /T contract; POSIX process-group fixture skipped' : 'detached POSIX process-group PASS'}`);
  console.log(`  direct-PID profile-recreation + primary-causality mutants: ${process.platform === 'win32' ? 'POSIX-only fixture skipped' : 'rejected'}`);
  console.log(`  macOS Codex Seatbelt pre-spawn refusal: ${process.platform === 'darwin' ? 'PASS; executable untouched' : 'covered by portable resolver selftest'}`);
  console.log('  browser child exit and profile cleanup: PASS');
  console.log(`  early-exit code + bounded stderr diagnostics: ${process.platform === 'win32' ? 'covered by child-exit control' : 'PASS'}`);
  console.log('  unsafe endpoint file type: immediate launcher rejection, child shutdown, profile cleanup');
  console.log('  port-only, invalid-endpoint, and valid-looking-prefix publication: final stable endpoint only');
  console.log('  persistent malformed endpoint: exact deadline re-observation before socket construction');
  console.log('  WebSocket open timeout via one portable endpoint fixture and cleanup: PASS');
  console.log('  configured socket cap and absolute remaining-startup clamp: PASS');
  console.log('  just-late WebSocket event: rejected before an overdue timer could pass it');
  console.log('  exhausted startup rejects before WebSocket construction: PASS');
  console.log('  WebSocket constructor consuming its phase deadline: rejected and cleaned up');
  console.log('  default delayed WebSocket open is independent from the command ceiling: PASS');
  console.log('  invalid integer and fractional WebSocket open timeouts: rejected before launch');
  console.log('  cold live caller: exact 45-second startup / 15-second socket envelope; 23,658ms endpoint just-before/exact/late controls PASS');
  console.log('  just-early command timeout re-arms; cancellation and exact/late deadlines fail closed');
  console.log('  just-before command receipt passes; exact/late result and protocol-error receipts reject');
  console.log('  CDP command error, global timeout, and shorter phase-owned timeout: rejected');
  console.log('  CDP events forwarded; event-handler failure rejected and cleaned up');
  console.log('  pending command rejected during bounded close: PASS');
  console.log('  exact browser provenance and no owned profile leakage: PASS');
}

async function printBrowserProvenance() {
  const connection = await openChromiumCdp({
    label: 'browser provenance probe',
    userDataPrefix: 'cf-browser-provenance',
  });
  try { console.log(JSON.stringify(connection.browser)); }
  finally { await connection.close(); }
}

const IS_MAIN = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (IS_MAIN) {
  const mode = process.argv.slice(2);
  if (mode.length === 1 && (mode[0] === '--selftest' || mode[0] === '--print-json')) {
    const action = mode[0] === '--selftest' ? runSelftest : printBrowserProvenance;
    action().catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
  } else {
    console.error('usage: node tools/browsercdp.mjs --selftest | --print-json');
    process.exitCode = 2;
  }
}
