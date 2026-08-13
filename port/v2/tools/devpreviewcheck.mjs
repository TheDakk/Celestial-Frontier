/* devpreviewcheck.mjs — boot the exact packaged development preview in a
   real browser over loopback and verify its guard/Guide-identity/app outcome.

   Usage:
     node tools/devpreviewcheck.mjs --root=<extracted-preview-root>
     node tools/devpreviewcheck.mjs --selftest */
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import { findChromiumBrowser } from './browserpath.mjs';
import { verifyPackage } from './devpreview.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DEV_PREVIEW_CDP_COMMAND_TIMEOUT_MS = 30_000;
const DEV_PREVIEW_CDP_STARTUP_TIMEOUT_MS = 30_000;
const DELAYED_CDP_EXPOSURE_MS = 16_000;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/* The development package is the one browser gate that may start only after
   the complete source/package evidence has run. Keep its extra start budget
   local: general evidence tools retain the launcher's 15-second default. */
function openDevelopmentPreviewCdp(onEvent = () => {}, openCdp = openChromiumCdp) {
  assert(typeof openCdp === 'function', 'development preview CDP opener is invalid');
  return openCdp({
    label: 'development preview browser check',
    userDataPrefix: 'cf-devpreview-check',
    commandTimeoutMs: DEV_PREVIEW_CDP_COMMAND_TIMEOUT_MS,
    startupTimeoutMs: DEV_PREVIEW_CDP_STARTUP_TIMEOUT_MS,
    onEvent,
  });
}

async function expectRejectedAsync(label, work, pattern) {
  let caught = null;
  try { await work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
}

function delayedEndpointChromeWrapperSource(browserFile) {
  return `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const browserFile = ${JSON.stringify(browserFile)};
const delayMs = ${DELAYED_CDP_EXPOSURE_MS};
const args = process.argv.slice(2);
const userDataArgs = args.filter((arg) => arg.startsWith('--user-data-dir='));
if (userDataArgs.length !== 1) {
  console.error('delayed endpoint wrapper requires one user-data directory');
  process.exit(2);
}
const outerUserData = userDataArgs[0].slice('--user-data-dir='.length);
if (!path.isAbsolute(outerUserData)) {
  console.error('delayed endpoint wrapper requires an absolute user-data directory');
  process.exit(2);
}
const innerUserData = path.join(outerUserData, 'browser');
fs.mkdirSync(innerUserData, { recursive: true });
const browserArgs = args.map((arg) => arg === userDataArgs[0]
  ? '--user-data-dir=' + innerUserData
  : arg);
let child = null;
let pollTimer = null;
let stopping = false;
let published = false;

function stop(signal) {
  if (stopping) return;
  stopping = true;
  if (pollTimer) clearTimeout(pollTimer);
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    process.exit(0);
    return;
  }
  const force = setTimeout(() => {
    if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }, 1_000);
  force.unref();
  child.once('close', () => process.exit(0));
  child.kill(signal);
}

process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGHUP', () => stop('SIGHUP'));

const startedAt = Date.now();
child = spawn(browserFile, browserArgs, { stdio: 'inherit' });
child.once('error', (error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
child.once('close', (code, signal) => {
  if (stopping) process.exit(0);
  process.exit(typeof code === 'number' ? code : signal ? 1 : 0);
});

function exposeEndpointWhenReady() {
  pollTimer = null;
  if (stopping || published) return;
  const source = path.join(innerUserData, 'DevToolsActivePort');
  if (Date.now() - startedAt >= delayMs && fs.existsSync(source)) {
    try {
      const stat = fs.lstatSync(source);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        throw new Error('delayed endpoint source is not a real file');
      }
      fs.copyFileSync(source, path.join(outerUserData, 'DevToolsActivePort'), fs.constants.COPYFILE_EXCL);
      published = true;
    } catch (error) {
      console.error(error.stack || error.message);
      stop('SIGTERM');
    }
    return;
  }
  pollTimer = setTimeout(exposeEndpointWhenReady, 25);
}
exposeEndpointWhenReady();
`;
}

function removeSelftestDirectory(directory) {
  const temporary = fs.realpathSync(os.tmpdir());
  const resolved = path.resolve(directory);
  const stat = fs.lstatSync(resolved);
  assert(path.dirname(resolved) === temporary
    && path.basename(resolved).startsWith(`cf-devpreview-check-selftest-${process.pid}-`)
    && stat.isDirectory() && !stat.isSymbolicLink(),
  `SELFTEST refusing unsafe delayed-browser cleanup: ${resolved}`);
  fs.rmSync(resolved, { recursive: true });
}

async function assertPreviewCallerAnswers() {
  const browser = await openDevelopmentPreviewCdp();
  try {
    const version = await browser.send('Browser.getVersion');
    assert(version.product === browser.browser.product,
      'SELFTEST preview caller did not complete Browser.getVersion through its owned connection');
  } finally {
    await browser.close();
  }
}

async function runSelftest() {
  const releaseWorkspaceLock = acquireWorkspaceLock('development preview browser-check selftest');
  try {
    assert(DEV_PREVIEW_CDP_COMMAND_TIMEOUT_MS === 30_000,
      'SELFTEST preview CDP command budget must remain exactly 30000ms');
    assert(DEV_PREVIEW_CDP_STARTUP_TIMEOUT_MS === 30_000,
      'SELFTEST preview CDP startup budget must remain exactly 30000ms');

    let capturedOptions = null;
    const capturedBrowser = Object.freeze({ kind: 'captured-development-preview-browser' });
    const captureOpener = async (options) => {
      capturedOptions = options;
      return capturedBrowser;
    };
    assert(await openDevelopmentPreviewCdp(() => {}, captureOpener) === capturedBrowser,
      'SELFTEST preview caller did not return its injected CDP outcome');
    assert(capturedOptions?.label === 'development preview browser check'
      && capturedOptions.userDataPrefix === 'cf-devpreview-check'
      && capturedOptions.commandTimeoutMs === DEV_PREVIEW_CDP_COMMAND_TIMEOUT_MS
      && capturedOptions.startupTimeoutMs === DEV_PREVIEW_CDP_STARTUP_TIMEOUT_MS
      && typeof capturedOptions.onEvent === 'function',
    'SELFTEST preview caller did not pass its exact bounded CDP options');

    if (process.platform === 'win32') {
      await assertPreviewCallerAnswers();
      console.log('DEV PREVIEW CHECK SELFTEST PASS');
      console.log('  captured caller options prove the exact 30000ms startup budget; Browser.getVersion also answers');
      console.log('  delayed-endpoint control is POSIX-only because Windows requires an MZ browser executable');
      return;
    }

    const selectedBrowser = findChromiumBrowser();
    const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),
      `cf-devpreview-check-selftest-${process.pid}-`));
    const priorBrowser = process.env.CF_BROWSER;
    try {
      const wrapper = path.join(temporary, 'delayed-endpoint-chrome.mjs');
      fs.writeFileSync(wrapper, delayedEndpointChromeWrapperSource(selectedBrowser), { mode: 0o700 });
      fs.chmodSync(wrapper, 0o700);
      process.env.CF_BROWSER = wrapper;
      await expectRejectedAsync('generic 15-second startup budget', () => openChromiumCdp({
        label: 'development preview startup negative control',
        userDataPrefix: 'cf-devpreview-startup-control',
        commandTimeoutMs: DEV_PREVIEW_CDP_COMMAND_TIMEOUT_MS,
      }), /startup-timeout=15000ms/);
      await assertPreviewCallerAnswers();
    } finally {
      if (priorBrowser === undefined) delete process.env.CF_BROWSER;
      else process.env.CF_BROWSER = priorBrowser;
      removeSelftestDirectory(temporary);
    }
    console.log('DEV PREVIEW CHECK SELFTEST PASS');
    console.log(`  Chrome starts immediately but its CDP endpoint is withheld for ${DELAYED_CDP_EXPOSURE_MS}ms`);
    console.log('  the generic 15000ms budget rejects; the exact preview caller answers Browser.getVersion within 30000ms');
  } finally {
    releaseWorkspaceLock();
  }
}

const args = process.argv.slice(2);
const selftest = args.length === 1 && args[0] === '--selftest';
if (!selftest && (args.length !== 1 || !args[0].startsWith('--root='))) {
  console.error('usage: node tools/devpreviewcheck.mjs --root=<extracted-preview-root>');
  process.exit(2);
}

if (selftest) {
  try { await runSelftest(); }
  catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
} else {

const requested = args[0].slice('--root='.length);
let root;
let manifest;
let releaseWorkspaceLock = null;
try {
  releaseWorkspaceLock = acquireWorkspaceLock('development preview browser check');
  root = fs.realpathSync(requested);
  manifest = verifyPackage(root);
} catch (error) {
  if (releaseWorkspaceLock) releaseWorkspaceLock();
  console.error(`DEV PREVIEW BROWSER CHECK: FAIL — ${error.message}`);
  process.exit(1);
}

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method || '')) {
      response.writeHead(405, { allow: 'GET, HEAD' }); response.end(); return;
    }
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://preview.invalid').pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('invalid path');
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const absolute = path.resolve(root, relative);
    if (!(absolute === root || absolute.startsWith(`${root}${path.sep}`))) throw new Error('path escaped root');
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not a real file');
    const body = fs.readFileSync(absolute);
    response.writeHead(200, {
      'content-type': MIME[path.extname(absolute).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    if (request.method === 'GET') response.end(body); else response.end();
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end('not found');
  }
});

let browser = null;
const events = [];
let exitCode = 0;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('preview server did not expose a TCP port');
  const url = `http://127.0.0.1:${address.port}/`;
  browser = await openDevelopmentPreviewCdp((event) => events.push(event));
  const target = await browser.send('Target.createTarget', { url: 'about:blank' });
  const attached = await browser.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
  const session = attached.sessionId;
  await browser.send('Runtime.enable', {}, session);
  await browser.send('Page.enable', {}, session);
  await browser.send('Emulation.setDeviceMetricsOverride', {
    width: 320, height: 568, deviceScaleFactor: 2, mobile: true,
  }, session);
  await browser.send('Page.navigate', { url }, session);

  const deadline = Date.now() + 20000;
  let outcome = null;
  let last = 'page did not evaluate';
  while (Date.now() < deadline) {
    try {
      const result = await browser.send('Runtime.evaluate', {
        expression: `(()=>{ try {
          const dev=window.__CF_DEV_PREVIEW__, slice=window.__CF_SLICE__;
          const state=slice?.api?.state?.();
          return {ready:!!dev&&!!state&&!!document.querySelector('canvas'),dev,state:state?{mode:state.mode}:null,
            badge:!!document.getElementById('cf-dev-preview-banner'),
            legacyBadge:!!document.getElementById('cf-development-site-banner'),
            badgeStyle:!!document.querySelector('[data-cf-dev-banner-style]'),
            blocked:document.documentElement.dataset.cfPreviewBlocked||null};
        } catch(error){ return {ready:false,why:String(error&&error.message||error)}; } })()`,
        returnByValue: true,
      }, session);
      if (!result.exceptionDetails) {
        outcome = result.result.value;
        last = outcome?.why || JSON.stringify(outcome);
        if (outcome?.ready) break;
      } else last = result.exceptionDetails.text || 'runtime exception';
    } catch (error) { last = error.message; }
    await sleep(50);
  }
  if (!outcome?.ready) throw new Error(`packaged app did not become ready (${last})`);
  if (outcome.blocked) throw new Error(`loopback package was blocked (${outcome.blocked})`);
  if (outcome.dev.sourceCommit !== manifest.source.commit
    || outcome.dev.expectedOrigin !== manifest.expectedOrigin
    || outcome.dev.publishable !== manifest.publishable
    || outcome.dev.developmentVersion !== manifest.development.version
    || outcome.dev.buildId !== manifest.development.build
    || outcome.dev.channel !== manifest.development.channel) {
    throw new Error(`runtime/manifest binding drifted (${JSON.stringify(outcome.dev)})`);
  }
  if (outcome.badge || outcome.legacyBadge || outcome.badgeStyle) {
    throw new Error(`development identity escaped the Guide into a corner badge (${JSON.stringify({ badge: outcome.badge, legacyBadge: outcome.legacyBadge, badgeStyle: outcome.badgeStyle })})`);
  }
  const opened = await browser.send('Runtime.evaluate', {
    expression: `(()=>{ const button=document.getElementById('dockguide'); if(!button) return false; button.click(); return true; })()`,
    returnByValue: true,
  }, session);
  if (opened.exceptionDetails || opened.result.value !== true) {
    throw new Error('packaged app did not expose the Guide control');
  }
  const guideDeadline = Date.now() + 10000;
  let guideIdentity = null;
  while (Date.now() < guideDeadline) {
    const result = await browser.send('Runtime.evaluate', {
      expression: `(()=>{ const el=document.querySelector('[data-sel="guide-build"]'); return el?{text:el.textContent||'',visible:!!(el.getClientRects().length)}:null; })()`,
      returnByValue: true,
    }, session);
    if (!result.exceptionDetails && result.result.value?.visible) {
      guideIdentity = result.result.value;
      break;
    }
    await sleep(50);
  }
  if (!guideIdentity
    || !guideIdentity.text.includes(`v${manifest.development.version}`)
    || !guideIdentity.text.includes(manifest.source.commit)) {
    throw new Error(`Guide build identity lacks v${manifest.development.version} and the full source commit (${JSON.stringify(guideIdentity)})`);
  }
  const errors = events.filter((event) => event.method === 'Runtime.exceptionThrown'
    || (event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error'));
  if (errors.length) throw new Error(`packaged app emitted ${errors.length} console error(s): ${JSON.stringify(errors[0].params).slice(0, 400)}`);
  console.log(`DEV PREVIEW BROWSER CHECK: PASS — ${manifest.source.commit}`);
  console.log(`  browser ${browser.browser.product}; executable ${browser.browser.executable}`);
  console.log(`  loopback boot mode ${outcome.state.mode}; no corner badge; Guide identity ${guideIdentity.text.trim()}`);
  console.log(`  expected remote origin ${manifest.expectedOrigin}; publishable ${String(manifest.publishable)}`);
} catch (error) {
  exitCode = 1;
  console.error(`DEV PREVIEW BROWSER CHECK: FAIL — ${error.message}`);
} finally {
  if (browser) {
    try { await browser.close(); }
    catch (error) { exitCode = 1; console.error(`DEV PREVIEW BROWSER CHECK: FAIL — browser cleanup (${error.message})`); }
  }
  await new Promise((resolve) => server.close(resolve));
  if (releaseWorkspaceLock) releaseWorkspaceLock();
}
process.exit(exitCode);
}
