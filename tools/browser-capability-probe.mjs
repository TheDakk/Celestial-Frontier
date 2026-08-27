#!/usr/bin/env node
/* ROOT BROWSER CAPABILITY PROBE
   A point version is provenance, not authority. This probe launches the shared
   Chromium CDP owner, exercises the exact methods used by tools/uilayout.js and
   tools/bootperf.js, validates small response sentinels, and publishes the full
   browser tuple only after target and process cleanup succeed. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from '../port/v2/tools/browsercdp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEPENDENCIES = JSON.parse(fs.readFileSync(path.join(HERE, 'deps.pinned.json'), 'utf8'));
const CONTRACT = DEPENDENCIES.browser?.authority?.capabilityContract;

function requireValue(condition, message) {
  if (!condition) throw new Error(`root browser capability probe: ${message}`);
}

requireValue(CONTRACT?.schema === 'cf-root-browser-capabilities/v1',
  'capability contract schema is missing or unsupported');
requireValue(Array.isArray(CONTRACT.requiredMethods) && CONTRACT.requiredMethods.length > 0,
  'required CDP method inventory is empty');

async function collectCapabilityEvidence(openCdp = openChromiumCdp) {
  const connection = await openCdp({
    label: 'root browser capability probe',
    userDataPrefix: 'cf-root-browser-capability',
  });
  const exercised = new Set(['Browser.getVersion']);
  let targetId = null;
  let targetClosed = false;
  let result = null;
  let primaryError = null;

  async function exercise(method, params = {}, sessionId) {
    const response = await connection.send(method, params, sessionId);
    exercised.add(method);
    return response;
  }

  try {
    const target = await exercise('Target.createTarget', { url: 'about:blank' });
    requireValue(typeof target?.targetId === 'string' && target.targetId,
      'Target.createTarget returned no target id');
    targetId = target.targetId;

    const attached = await exercise('Target.attachToTarget', { targetId, flatten: true });
    requireValue(typeof attached?.sessionId === 'string' && attached.sessionId,
      'Target.attachToTarget returned no session id');
    const sessionId = attached.sessionId;

    await exercise('Runtime.enable', {}, sessionId);
    await exercise('Page.enable', {}, sessionId);
    await exercise('Emulation.setDeviceMetricsOverride', {
      width: 393, height: 852, deviceScaleFactor: 3, mobile: true,
    }, sessionId);
    await exercise('Emulation.setTouchEmulationEnabled', {
      enabled: true, maxTouchPoints: 5,
    }, sessionId);
    await exercise('Emulation.setCPUThrottlingRate', { rate: 1 }, sessionId);

    const evaluated = await exercise('Runtime.evaluate', {
      expression: '({ ready: document.readyState, sum: 1 + 1 })',
      returnByValue: true,
    }, sessionId);
    requireValue(typeof evaluated?.result?.value?.ready === 'string'
      && evaluated.result.value.sum === 2,
      'Runtime/Page response sentinel did not round-trip');

    await exercise('Profiler.enable', {}, sessionId);
    await exercise('Profiler.setSamplingInterval', { interval: 200 }, sessionId);
    await exercise('Profiler.start', {}, sessionId);
    await exercise('Runtime.evaluate', {
      expression: 'Array.from({length: 32}, (_, i) => i * i).reduce((a, b) => a + b, 0)',
      returnByValue: true,
    }, sessionId);
    const profile = await exercise('Profiler.stop', {}, sessionId);
    requireValue(Array.isArray(profile?.profile?.nodes) && profile.profile.nodes.length > 0,
      'Profiler.stop returned no profile nodes');

    const script = await exercise('Page.addScriptToEvaluateOnNewDocument', {
      source: 'globalThis.__cfRootBrowserCapability = 1;',
    }, sessionId);
    requireValue(typeof script?.identifier === 'string' && script.identifier,
      'Page.addScriptToEvaluateOnNewDocument returned no identifier');

    const screenshot = await exercise('Page.captureScreenshot', { format: 'png' }, sessionId);
    const screenshotBytes = typeof screenshot?.data === 'string'
      ? Buffer.from(screenshot.data, 'base64') : Buffer.alloc(0);
    requireValue(screenshotBytes.length >= 8
      && screenshotBytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a',
      'Page.captureScreenshot returned no valid PNG bytes');

    const navigation = await exercise('Page.navigate', {
      url: 'data:text/html,root-browser-capability',
    }, sessionId);
    requireValue(typeof navigation?.frameId === 'string' && navigation.frameId && !navigation.errorText,
      'Page.navigate returned no clean frame receipt');

    const closed = await exercise('Target.closeTarget', { targetId });
    requireValue(closed?.success === true, 'Target.closeTarget did not confirm closure');
    targetClosed = true;

    const required = [...CONTRACT.requiredMethods].sort();
    const actual = [...exercised].sort();
    requireValue(JSON.stringify(actual) === JSON.stringify(required),
      `exercised methods do not match the declared contract (required ${required.join(', ')}, got ${actual.join(', ')})`);
    result = {
      browser: connection.browser,
      capabilities: {
        schema: CONTRACT.schema,
        methods: actual,
      },
    };
  } catch (error) {
    primaryError = error;
  } finally {
    if (targetId && !targetClosed) {
      try { await connection.send('Target.closeTarget', { targetId }); }
      catch (error) {
        if (!primaryError) primaryError = new Error(`target cleanup failed (${error.message})`);
      }
    }
    try { await connection.close(); }
    catch (error) {
      if (!primaryError) primaryError = new Error(`browser cleanup failed (${error.message})`);
    }
  }

  if (primaryError) throw primaryError;
  requireValue(result, 'probe completed without evidence');
  return result;
}

function fakeOpener(fault = {}) {
  const state = { methods: [], closes: 0, targetCloses: 0 };
  const connection = {
    browser: {
      executable: '/synthetic/chromium',
      product: 'Edg/999.42.7.3',
      revision: '@synthetic',
      user_agent: 'synthetic user agent',
      js_version: '99.1.2',
      protocol_version: '1.3',
    },
    async send(method, params) {
      state.methods.push(method);
      if (fault.throwMethod === method) throw new Error(`injected ${method} failure`);
      if (method === 'Target.createTarget') return { targetId: 'target-1' };
      if (method === 'Target.attachToTarget') return { sessionId: 'session-1' };
      if (method === 'Page.addScriptToEvaluateOnNewDocument') return { identifier: 'script-1' };
      if (method === 'Page.navigate') return { frameId: 'frame-1' };
      if (method === 'Runtime.evaluate') {
        return params.expression.includes('document.readyState')
          ? { result: { value: { ready: 'complete', sum: 2 } } }
          : { result: { value: 10416 } };
      }
      if (method === 'Page.captureScreenshot') {
        return { data: fault.emptyScreenshot ? '' : 'iVBORw0KGgo=' };
      }
      if (method === 'Profiler.stop') {
        return { profile: { nodes: fault.emptyProfile ? [] : [{ id: 1 }] } };
      }
      if (method === 'Target.closeTarget') {
        state.targetCloses++;
        return { success: fault.closeTargetFalse ? false : true };
      }
      return {};
    },
    async close() {
      state.closes++;
      if (fault.closeFailure) throw new Error('injected browser cleanup failure');
    },
  };
  return { open: async () => connection, state };
}

async function expectRejected(label, fault, pattern) {
  const fake = fakeOpener(fault);
  let caught = null;
  try { await collectCapabilityEvidence(fake.open); } catch (error) { caught = error; }
  if (!caught || !pattern.test(caught.message)) {
    throw new Error(`root browser capability selftest ${label}: expected ${pattern}, got ${caught?.message || 'accept'}`);
  }
  requireValue(fake.state.closes === 1, `selftest ${label} did not close the browser exactly once`);
  requireValue(fake.state.targetCloses >= 1, `selftest ${label} did not attempt target cleanup`);
}

async function runSelftest() {
  const positive = fakeOpener();
  const evidence = await collectCapabilityEvidence(positive.open);
  requireValue(evidence.browser.product === 'Edg/999.42.7.3',
    'selftest compatible future product was not preserved');
  requireValue(JSON.stringify(evidence.capabilities.methods) ===
    JSON.stringify(CONTRACT.requiredMethods), 'selftest capability inventory changed');
  requireValue(positive.state.closes === 1 && positive.state.targetCloses === 1,
    'selftest positive lifecycle did not close exactly once');

  await expectRejected('command failure', { throwMethod: 'Page.enable' }, /injected Page\.enable failure/);
  await expectRejected('empty screenshot', { emptyScreenshot: true }, /no valid PNG bytes/);
  await expectRejected('empty profile', { emptyProfile: true }, /no profile nodes/);
  await expectRejected('target close sentinel', { closeTargetFalse: true }, /did not confirm closure/);
  await expectRejected('browser cleanup', { closeFailure: true }, /browser cleanup failed/);

  console.log('ROOT BROWSER CAPABILITY SELFTEST PASS');
  console.log('  exact method inventory and synthetic future Edge evidence published after cleanup');
  console.log('  command, response-sentinel, target-cleanup and browser-cleanup faults rejected');
}

const mode = process.argv.slice(2);
if (mode.length === 0) {
  const evidence = await collectCapabilityEvidence();
  process.stdout.write(`${JSON.stringify(evidence)}\n`);
} else if (mode.length === 1 && mode[0] === '--selftest') {
  await runSelftest();
} else {
  console.error('usage: node tools/browser-capability-probe.mjs [--selftest]');
  process.exitCode = 2;
}
