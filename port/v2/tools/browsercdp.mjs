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
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
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
async function terminateChildProcess(child, childClosed, label, timeoutMs) {
  if (child.exitCode === null && child.signalCode === null && child.pid !== undefined) {
    if (!child.killed) child.kill();
    if (!await waitForResolution(childClosed, timeoutMs)) {
      child.kill('SIGKILL');
      assert(await waitForResolution(childClosed, timeoutMs), `${label}: browser ignored bounded shutdown`);
    }
    return;
  }
  if (!await waitForResolution(childClosed, timeoutMs)) {
    child.stderr?.destroy?.();
    assert(await waitForResolution(childClosed, timeoutMs),
      `${label}: browser exited but its stdio did not close within the shutdown bound`);
  }
}
function portable(value) { return value.split(path.sep).join('/'); }
function requiredString(value, where) {
  assert(typeof value === 'string' && value.trim(), `${where}: missing browser version field`);
  return value.trim();
}
function activeEndpoint(userData) {
  const file = path.join(userData, 'DevToolsActivePort');
  if (!fs.existsSync(file)) return null;
  const stat = fs.lstatSync(file);
  assert(stat.isFile() && !stat.isSymbolicLink(), 'DevToolsActivePort is not a real file');
  const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  assert(lines.length >= 2 && /^[1-9]\d{0,4}$/.test(lines[0]), 'DevToolsActivePort has an invalid port');
  const port = Number(lines[0]);
  assert(port <= 65535 && /^\/devtools\/browser\/[A-Za-z0-9._-]+$/.test(lines[1]),
    'DevToolsActivePort has an invalid browser endpoint');
  return `ws://127.0.0.1:${port}${lines[1]}`;
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

function launchChromiumProcess({ browserFile, chromiumArgs }) {
  return spawn(browserFile, chromiumArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
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
  const child = launchBrowser({ browserFile, chromiumArgs, userData });
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
  const childClosed = new Promise((resolve) => child.once('close', resolve));
  const terminateOwnedBrowser = async () => {
    try { await terminateChildProcess(child, childClosed, label, shutdownTimeoutMs); }
    finally { removeOwnedUserData(userData, temporary, userDataPrefix); }
  };

  let endpoint = null;
  const startupDeadline = startupStartedAt + startupTimeoutMs;
  while (endpoint === null && nowMs() < startupDeadline) {
    if (spawnError || exitDescription) break;
    try { endpoint = activeEndpoint(userData); }
    catch (error) {
      if (fs.existsSync(path.join(userData, 'DevToolsActivePort'))) {
        await terminateOwnedBrowser();
        throw new Error(`${label}: ${error.message}`);
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
      stderr,
    ].filter(Boolean).join('; ');
    await terminateOwnedBrowser();
    fail(`${label}: browser CDP did not start at ${browserFile} (${detail})`);
  }
  const endpointReadyMs = nowMs() - startupStartedAt;

  let ws = null;
  let closed = false;
  let closePromise = null;
  let eventHandlerError = null;
  let messageId = 0;
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
      if (ws) ws.close();
      await terminateOwnedBrowser();
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
      let message;
      try { message = JSON.parse(event.data); }
      catch { rejectPending(terminalError('CDP emitted invalid JSON')); return; }
      if (message.id && pending.has(message.id)) {
        const waiter = pending.get(message.id);
        pending.delete(message.id);
        message.error ? waiter.reject(terminalError(message.error.message)) : waiter.resolve(message.result);
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
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(terminalError(`timed out waiting for ${method}`));
        }, timeoutMs);
        pending.set(id, {
          resolve(value) { clearTimeout(timer); resolve(value); },
          reject(error) { clearTimeout(timer); reject(error); },
        });
        try {
          ws.send(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
        } catch (error) {
          pending.delete(id); clearTimeout(timer); reject(terminalError(`${method} send failed (${error.message})`));
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
    return { send, browser, pid: child.pid, close };
  } catch (error) {
    await close();
    fail(error.message.startsWith(`${label}:`) ? error.message : `${label}: CDP setup failed (${error.message})`);
  }
}

export async function openChromiumCdp(options) {
  return await openChromiumCdpWithLauncher(options, launchChromiumProcess);
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
    fs.writeFileSync(path.join(endpointFixture, 'DevToolsActivePort'),
      'not-a-port\n/devtools/browser/selftest\n');
    await expectRejectedAsync('malformed DevToolsActivePort', async () => activeEndpoint(endpointFixture),
      /invalid port/);

    let exitPipeDestroyed = false;
    const exitWithoutClose = {
      exitCode: 1, signalCode: null, pid: 1, killed: false,
      stderr: { destroy() { exitPipeDestroyed = true; } },
    };
    await expectRejectedAsync('exit without stdio close', () => terminateChildProcess(
      exitWithoutClose, new Promise(() => {}), 'CDP selftest exit-without-close', 20,
    ), /stdio did not close within the shutdown bound/);
    assert(exitPipeDestroyed, 'SELFTEST exit-without-close did not release its owned stderr pipe');

    let resistantClosed;
    const resistantClose = new Promise((resolve) => { resistantClosed = resolve; });
    const resistantSignals = [];
    const resistantChild = {
      exitCode: null, signalCode: null, pid: 2, killed: false,
      kill(signal = 'SIGTERM') {
        resistantSignals.push(signal);
        this.killed = true;
        if (signal === 'SIGKILL') { this.signalCode = signal; resistantClosed(); }
        return true;
      },
    };
    await terminateChildProcess(resistantChild, resistantClose, 'CDP selftest resistant child', 20);
    assert(JSON.stringify(resistantSignals) === JSON.stringify(['SIGTERM', 'SIGKILL']),
      `SELFTEST resistant child: expected TERM/KILL escalation, got ${resistantSignals.join(', ')}`);

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
    const expiredDeadlineClock = () => {
      deadlineClockReads++;
      if (deadlineClockReads === 1) return 0;
      if (deadlineClockReads === 2) return 1;
      if (deadlineClockReads === 3) return 2;
      return 100;
    };
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

    const livePrefix = `${base}-live`;
    const liveEvents = [];
    let connection = null;
    try {
      connection = await openChromiumCdp({
        label: 'CDP selftest live browser', userDataPrefix: livePrefix,
        commandTimeoutMs: 1500, webSocketOpenTimeoutMs: 15000,
        startupTimeoutMs: 30000, shutdownTimeoutMs: 2000,
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
  console.log('  malformed DevToolsActivePort: rejected');
  console.log('  exit-without-close: rejected; owned pipe released');
  console.log('  SIGTERM-resistant child: escalated to bounded SIGKILL');
  console.log(`  macOS Codex Seatbelt pre-spawn refusal: ${process.platform === 'darwin' ? 'PASS; executable untouched' : 'covered by portable resolver selftest'}`);
  console.log('  browser child exit and profile cleanup: PASS');
  console.log(`  early-exit code + bounded stderr diagnostics: ${process.platform === 'win32' ? 'covered by child-exit control' : 'PASS'}`);
  console.log('  WebSocket open timeout via one portable endpoint fixture and cleanup: PASS');
  console.log('  configured socket cap and absolute remaining-startup clamp: PASS');
  console.log('  just-late WebSocket event: rejected before an overdue timer could pass it');
  console.log('  exhausted startup rejects before WebSocket construction: PASS');
  console.log('  WebSocket constructor consuming its phase deadline: rejected and cleaned up');
  console.log('  default delayed WebSocket open is independent from the command ceiling: PASS');
  console.log('  invalid integer and fractional WebSocket open timeouts: rejected before launch');
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
