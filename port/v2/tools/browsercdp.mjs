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
import { fileURLToPath } from 'node:url';
import { findChromiumBrowser } from './browserpath.mjs';

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
    fail(`${label}: browser exited but its stdio did not close within the shutdown bound`);
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

export async function openChromiumCdp({
  label,
  userDataPrefix,
  commandTimeoutMs = 15000,
  startupTimeoutMs = 15000,
  shutdownTimeoutMs = 5000,
  WebSocketImpl = WebSocket,
  onEvent = () => {},
}) {
  assert(typeof label === 'string' && label.trim(), 'CDP label is required');
  assert(/^[a-z0-9][a-z0-9-]*$/.test(userDataPrefix), `${label}: unsafe user-data prefix`);
  assert(Number.isInteger(commandTimeoutMs) && commandTimeoutMs > 0,
    `${label}: command timeout must be a positive integer`);
  assert(Number.isInteger(startupTimeoutMs) && startupTimeoutMs > 0,
    `${label}: startup timeout must be a positive integer`);
  assert(Number.isInteger(shutdownTimeoutMs) && shutdownTimeoutMs > 0,
    `${label}: shutdown timeout must be a positive integer`);
  assert(typeof WebSocketImpl === 'function' && Number.isInteger(WebSocketImpl.OPEN),
    `${label}: WebSocket implementation is invalid`);
  assert(typeof onEvent === 'function', `${label}: CDP event handler is invalid`);
  const browserFile = findChromiumBrowser();
  const temporary = fs.realpathSync(os.tmpdir());
  const userData = path.join(temporary,
    `${userDataPrefix}-${process.pid}-${crypto.randomBytes(8).toString('hex')}`);
  const child = spawn(browserFile, [
    '--headless=new', '--no-sandbox', '--no-first-run', '--disable-background-networking',
    '--disable-component-update', '--disable-component-extensions-with-background-pages',
    '--remote-debugging-port=0', `--user-data-dir=${userData}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  let spawnError = null;
  let exitDescription = null;
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  child.on('error', (error) => { spawnError = error; });
  child.on('exit', (code, signal) => { exitDescription = `exit=${String(code)} signal=${String(signal)}`; });
  const childClosed = new Promise((resolve) => child.once('close', resolve));
  const terminateOwnedBrowser = async () => {
    await terminateChildProcess(child, childClosed, label, shutdownTimeoutMs);
    removeOwnedUserData(userData, temporary, userDataPrefix);
  };

  let endpoint = null;
  const startupDeadline = Date.now() + startupTimeoutMs;
  while (endpoint === null && Date.now() < startupDeadline) {
    if (spawnError || exitDescription) break;
    try { endpoint = activeEndpoint(userData); }
    catch (error) {
      if (fs.existsSync(path.join(userData, 'DevToolsActivePort'))) {
        await terminateOwnedBrowser();
        throw new Error(`${label}: ${error.message}`);
      }
    }
    if (endpoint === null) await sleep(Math.min(100, Math.max(1, startupDeadline - Date.now())));
  }
  if (endpoint === null) {
    const detail = spawnError?.message || exitDescription || stderr.trim().slice(-300);
    await terminateOwnedBrowser();
    fail(`${label}: browser CDP did not start at ${browserFile}${detail ? ` (${detail})` : ''}`);
  }

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
    ws = new WebSocketImpl(endpoint);
    await new Promise((resolve, reject) => {
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
      const timer = setTimeout(() => finish(terminalError('timed out opening the CDP WebSocket')), commandTimeoutMs);
      child.once('exit', onExit);
      ws.onopen = () => finish();
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

    const send = (method, params = {}, sessionId) => {
      if (eventHandlerError) return Promise.reject(eventHandlerError);
      if (closed || ws.readyState !== WebSocketImpl.OPEN) {
        return Promise.reject(terminalError(`cannot send ${method}; CDP is not open`));
      }
      return new Promise((resolve, reject) => {
        const id = ++messageId;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(terminalError(`timed out waiting for ${method}`));
        }, commandTimeoutMs);
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
    return { send, browser, close };
  } catch (error) {
    await close();
    fail(error.message.startsWith(`${label}:`) ? error.message : `${label}: CDP setup failed (${error.message})`);
  }
}

async function expectRejectedAsync(label, work, pattern) {
  let caught = null;
  try { await work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
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

    const childPrefix = `${base}-child`;
    process.env.CF_BROWSER = process.execPath;
    await expectRejectedAsync('browser child exit', () => openChromiumCdp({
      label: 'CDP selftest child exit', userDataPrefix: childPrefix,
      startupTimeoutMs: 1500, shutdownTimeoutMs: 500,
    }), /browser CDP did not start|browser exited/);
    assertNoOwnedProfiles(childPrefix, 'browser child exit cleanup');

    process.env.CF_BROWSER = actualBrowser;
    class NeverOpeningWebSocket {
      static OPEN = 1;
      constructor() { this.readyState = 0; }
      close() { this.readyState = 3; }
    }
    const openPrefix = `${base}-open`;
    await expectRejectedAsync('WebSocket open timeout', () => openChromiumCdp({
      label: 'CDP selftest WebSocket timeout', userDataPrefix: openPrefix,
      commandTimeoutMs: 200, startupTimeoutMs: 10000, shutdownTimeoutMs: 2000,
      WebSocketImpl: NeverOpeningWebSocket,
    }), /timed out opening the CDP WebSocket/);
    assertNoOwnedProfiles(openPrefix, 'WebSocket open-timeout cleanup');

    const livePrefix = `${base}-live`;
    const liveEvents = [];
    const connection = await openChromiumCdp({
      label: 'CDP selftest live browser', userDataPrefix: livePrefix,
      commandTimeoutMs: 1500, startupTimeoutMs: 10000, shutdownTimeoutMs: 2000,
      onEvent: (event) => liveEvents.push(event),
    });
    try {
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

      const pending = connection.send('Runtime.evaluate', {
        expression: 'new Promise(() => {})', awaitPromise: true, returnByValue: true,
      }, attached.sessionId);
      await sleep(50);
      const closing = connection.close();
      await expectRejectedAsync('pending rejection on close', () => pending,
        /CDP connection closed|CDP WebSocket closed|browser exited/);
      await closing;
    } finally {
      await connection.close();
    }
    assertNoOwnedProfiles(livePrefix, 'normal/command-timeout/pending cleanup');

    const eventFailurePrefix = `${base}-event-failure`;
    const eventFailure = await openChromiumCdp({
      label: 'CDP selftest event failure', userDataPrefix: eventFailurePrefix,
      commandTimeoutMs: 1500, startupTimeoutMs: 10000, shutdownTimeoutMs: 2000,
      onEvent(event) {
        if (event.method === 'Runtime.consoleAPICalled') throw new Error('injected event failure');
      },
    });
    try {
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
      await eventFailure.close();
    }
    assertNoOwnedProfiles(eventFailurePrefix, 'event-handler failure cleanup');
  } finally {
    if (priorExplicit === undefined) delete process.env.CF_BROWSER;
    else process.env.CF_BROWSER = priorExplicit;
    fs.rmSync(endpointFixture, { recursive: true, force: true });
  }
  console.log('BROWSER CDP SELFTEST PASS');
  console.log('  malformed DevToolsActivePort: rejected');
  console.log('  exit-without-close: rejected; owned pipe released');
  console.log('  SIGTERM-resistant child: escalated to bounded SIGKILL');
  console.log('  browser child exit and profile cleanup: PASS');
  console.log('  WebSocket open timeout and cleanup: PASS');
  console.log('  CDP command error and timeout: rejected');
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
