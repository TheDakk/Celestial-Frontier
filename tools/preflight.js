/* PREFLIGHT — can this machine actually run the battery?
   Port Phase 0 / Gate A deliverable #2: "reproduce all executable dependencies in a
   clean CI environment."

   WHY (ROADMAP 9h): package.json declares acorn + jsdom + ws, but uilayout.js and
   bootperf.js spawn a REAL system browser over CDP. There is no npm browser driver
   anywhere in tools/. `npm install` on a clean clone therefore leaves TWO of the nine
   suites silently unrunnable — and nothing said so until 2026-07-31.

   EXIT CODES
     0  everything required is present and the browser satisfies the compatible
        Chromium-family / CDP / capability / provenance authority
     1  a required dependency or browser authority condition is missing

   USAGE
     node tools/preflight.js                # check + report (same fail-closed CI policy)
     node tools/preflight.js --json         # machine-readable

   Point version is complete per-run provenance, never the verdict identity. Root
   uilayout seals viewport/surface/outcome keys, not browser-specific numeric samples;
   an update alone therefore never triggers a rebaseline. Family, CDP 1.3, every CDP
   method the root gates use, response sentinels, and complete provenance fail closed. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const PIN = JSON.parse(fs.readFileSync(path.join(__dirname, 'deps.pinned.json'), 'utf8'));
const JSON_OUT = process.argv.includes('--json');
const AUTHORITY = PIN.browser.authority;

const out = [];
let fail = 0, warn = 0;
const ok   = (m, d) => { out.push({ level: 'PASS', msg: m, detail: d || '' }); };
const bad  = (m, d) => { out.push({ level: 'FAIL', msg: m, detail: d || '' }); fail++; };

const nodeIsSupported = (version) => {
  const parts = String(version).replace(/^v/, '').split('.');
  if (parts.length < 2 || parts.some((part) => !/^\d+$/.test(part))) return false;
  const [major, minor] = parts.map(Number);
  return (major === 20 && minor >= 19) || (major === 22 && minor >= 13) || major >= 24;
};

const sortedUnique = (values) => [...new Set(values)].sort();

const rootGateMethodInventory = () => {
  const methods = ['Browser.getVersion'];
  const pattern = /\bsend\(\s*(['"`])([A-Za-z]+\.[A-Za-z]+)\1/g;
  for (const relative of PIN.browser.usedBy) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const match of source.matchAll(pattern)) methods.push(match[2]);
  }
  return sortedUnique(methods);
};

const authorityConfigurationErrors = (authority, gateMethods = rootGateMethodInventory()) => {
  const errors = [];
  if (!authority || authority.schema !== 'cf-root-browser-authority/v1') {
    errors.push('authority schema must be cf-root-browser-authority/v1');
    return errors;
  }
  if (authority.family !== 'Chromium-family') errors.push('browser family must be Chromium-family');
  const accepted = authority.acceptedProducts;
  const expectedProducts = ['Chrome', 'Chromium', 'Edg', 'HeadlessChrome'];
  if (!Array.isArray(accepted) || accepted.length === 0
    || accepted.some((value) => typeof value !== 'string' || !value)
    || JSON.stringify(sortedUnique(accepted)) !== JSON.stringify(expectedProducts)) {
    errors.push('accepted product-family inventory is incomplete, unsupported or duplicated');
  }
  if (authority.cdpProtocolVersion !== '1.3') errors.push('root CDP protocol authority must be 1.3');

  const requiredProvenance = [
    'executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version',
  ];
  if (!Array.isArray(authority.requiredProvenance)
    || JSON.stringify(sortedUnique(authority.requiredProvenance))
      !== JSON.stringify(sortedUnique(requiredProvenance))) {
    errors.push('required browser provenance inventory is incomplete or changed');
  }

  const capability = authority.capabilityContract;
  if (!capability || capability.schema !== 'cf-root-browser-capabilities/v1') {
    errors.push('capability contract schema must be cf-root-browser-capabilities/v1');
  } else {
    if (capability.probe !== 'tools/browser-capability-probe.mjs') {
      errors.push('capability probe owner is missing or changed');
    }
    if (!Array.isArray(capability.requiredMethods)
      || JSON.stringify(sortedUnique(capability.requiredMethods))
        !== JSON.stringify(capability.requiredMethods)) {
      errors.push('required CDP methods must be a sorted, unique inventory');
    } else if (JSON.stringify(capability.requiredMethods) !== JSON.stringify(gateMethods)) {
      errors.push('required CDP methods do not match tools/uilayout.js + tools/bootperf.js');
    }
  }
  return errors;
};

const browserAuthorityErrors = (evidence, authority = AUTHORITY) => {
  const errors = [];
  const browser = evidence?.browser;
  const capabilities = evidence?.capabilities;
  if (!browser || typeof browser !== 'object') return ['browser provenance is missing'];

  for (const field of authority.requiredProvenance || []) {
    if (typeof browser[field] !== 'string' || !browser[field].trim()) {
      errors.push(`browser provenance ${field} is missing`);
    }
  }

  const product = typeof browser.product === 'string' ? browser.product : '';
  const match = product.match(/^([A-Za-z]+)\/(\d+\.\d+\.\d+\.\d+)$/);
  if (!match || !authority.acceptedProducts.includes(match[1])) {
    errors.push(`unsupported Chromium-family product ${product || '(missing)'}`);
  }
  if (browser.protocol_version !== authority.cdpProtocolVersion) {
    errors.push(`CDP protocol ${browser.protocol_version || '(missing)'} does not match ${authority.cdpProtocolVersion}`);
  }

  const capability = authority.capabilityContract;
  if (!capabilities || capabilities.schema !== capability.schema) {
    errors.push('browser capability evidence schema is missing or changed');
  } else if (!Array.isArray(capabilities.methods)
    || JSON.stringify(capabilities.methods) !== JSON.stringify(capability.requiredMethods)) {
    errors.push('browser capability evidence is incomplete or changed');
  }
  return errors;
};

const assertAuthorityRejected = (label, evidence, pattern) => {
  const errors = browserAuthorityErrors(evidence);
  if (!errors.some((error) => pattern.test(error))) {
    throw new Error(`PREFLIGHT SELFTEST ${label}: expected ${pattern}, got ${errors.join(' · ') || 'accept'}`);
  }
};

if (process.argv.includes('--selftest')) {
  const cases = [
    ['20.18.9', false], ['20.19.0', true], ['21.7.0', false],
    ['22.12.0', false], ['22.13.0', true], ['23.9.0', false], ['24.0.0', true],
  ];
  for (const [version, expected] of cases) {
    if (nodeIsSupported(version) !== expected) {
      throw new Error(`PREFLIGHT SELFTEST Node ${version}: expected ${expected}`);
    }
  }

  const gateMethods = rootGateMethodInventory();
  const configErrors = authorityConfigurationErrors(AUTHORITY, gateMethods);
  if (configErrors.length) {
    throw new Error(`PREFLIGHT SELFTEST live authority configuration: ${configErrors.join(' · ')}`);
  }
  const capabilities = {
    schema: AUTHORITY.capabilityContract.schema,
    methods: [...AUTHORITY.capabilityContract.requiredMethods],
  };
  const baseBrowser = {
    executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    product: 'Edg/100.1.2.3',
    revision: '@synthetic-revision',
    user_agent: 'synthetic user agent',
    js_version: '15.0.0',
    protocol_version: '1.3',
  };
  const acceptedProducts = [
    'Edg/100.1.2.3',
    'Edg/151.0.4129.107',
    'Edg/999.42.7.3',
    'Chrome/152.0.4200.1',
    'Chromium/152.0.4200.1',
    'HeadlessChrome/152.0.4200.1',
  ];
  for (const product of acceptedProducts) {
    const errors = browserAuthorityErrors({
      browser: { ...baseBrowser, product }, capabilities,
    });
    if (errors.length) {
      throw new Error(`PREFLIGHT SELFTEST compatible ${product}: ${errors.join(' · ')}`);
    }
  }
  assertAuthorityRejected('non-Chromium product', {
    browser: { ...baseBrowser, product: 'Firefox/152.0.0.1' }, capabilities,
  }, /unsupported Chromium-family product/);
  assertAuthorityRejected('malformed point version', {
    browser: { ...baseBrowser, product: 'Edg/152.0.1' }, capabilities,
  }, /unsupported Chromium-family product/);
  assertAuthorityRejected('wrong CDP protocol', {
    browser: { ...baseBrowser, protocol_version: '1.2' }, capabilities,
  }, /CDP protocol/);
  assertAuthorityRejected('missing provenance', {
    browser: { ...baseBrowser, revision: '' }, capabilities,
  }, /provenance revision/);
  assertAuthorityRejected('missing required capability', {
    browser: baseBrowser,
    capabilities: { ...capabilities, methods: capabilities.methods.slice(1) },
  }, /capability evidence/);
  assertAuthorityRejected('wrong capability contract', {
    browser: baseBrowser,
    capabilities: { ...capabilities, schema: 'cf-root-browser-capabilities/v0' },
  }, /capability evidence schema/);

  const weakenedAuthority = JSON.parse(JSON.stringify(AUTHORITY));
  weakenedAuthority.capabilityContract.requiredMethods =
    weakenedAuthority.capabilityContract.requiredMethods.slice(1);
  if (!authorityConfigurationErrors(weakenedAuthority, gateMethods)
    .some((error) => /required CDP methods/.test(error))) {
    throw new Error('PREFLIGHT SELFTEST weakened declared capability inventory was accepted');
  }

  const capabilitySelftest = path.join(root, AUTHORITY.capabilityContract.probe);
  const capabilitySelftestOutput = execFileSync(process.execPath, [capabilitySelftest, '--selftest'], {
    cwd: root, env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 6000,
  });
  if (!/ROOT BROWSER CAPABILITY SELFTEST PASS/.test(capabilitySelftestOutput)) {
    throw new Error('PREFLIGHT SELFTEST root browser capability probe selftest did not pass');
  }

  let nonBrowserRejected = null;
  const nonBrowserEnvironment = { ...process.env, CF_BROWSER: process.execPath };
  /* This control deliberately launches Node as a fake browser. Remove only the
     advisory Codex launch marker so the new macOS browser guard cannot satisfy
     the test before the fake executable is actually touched. The child remains
     inside the same OS sandbox; Node itself is permitted there. */
  delete nonBrowserEnvironment.CODEX_SANDBOX;
  try {
    execFileSync(process.execPath, [__filename, '--json'], {
      cwd: root, env: nonBrowserEnvironment,
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 6000,
    });
  } catch (error) { nonBrowserRejected = error; }
  if (!nonBrowserRejected || nonBrowserRejected.status !== 1
    || !/NO COMPATIBLE BROWSER FOUND/.test(String(nonBrowserRejected.stdout || ''))) {
    throw new Error('PREFLIGHT SELFTEST executable non-browser was accepted or misdiagnosed');
  }
  console.log('PREFLIGHT SELFTEST PASS');
  console.log('  supported and excluded Node lines discriminated');
  console.log('  older, current and synthetic future Edge plus Chrome/Chromium family accepted');
  console.log('  family, canonical product, CDP, provenance and capability failures rejected');
  console.log('  declared CDP inventory bound to both root browser-gate sources');
  console.log('  capability command, response-sentinel and cleanup faults rejected');
  console.log('  executable non-browser rejected by the real CDP probe');
  process.exit(0);
}

/* ---------- node ---------- */
{
  const cur = process.version;
  const supported = nodeIsSupported(cur);
  if (supported) ok('node ' + cur, 'supported ' + PIN.node.supported + ' · Gate A evidence produced on ' + PIN.node.verifiedWith);
  else bad('node ' + cur + ' is outside the declared range ' + PIN.node.supported, 'use a supported even-numbered Node release');
}

/* ---------- npm packages ---------- */
for (const name of Object.keys(PIN.packages)) {
  if (name.startsWith('_')) continue;
  try {
    const p = require.resolve(name, { paths: [root] });
    let v = '';
    try {
      const pj = path.join(p.slice(0, p.lastIndexOf('node_modules') + 12), name, 'package.json');
      v = JSON.parse(fs.readFileSync(pj, 'utf8')).version;
    } catch (_) { /* version is a nicety, resolution is the check */ }
    ok('package ' + name + (v ? ' ' + v : ''), 'declared ' + PIN.packages[name]);
  } catch (_) {
    bad('package ' + name + ' NOT INSTALLED', 'run: npm install');
  }
}

/* ---------- the browser — the whole reason this file exists ---------- */
const probeBrowser = () => {
  /* One resolver/launcher still owns the process. This root-owned wrapper then proves
     every CDP method found in uilayout + bootperf before publishing provenance. */
  const probe = path.join(root, AUTHORITY.capabilityContract.probe);
  try {
    const stdout = execFileSync(process.execPath, [probe], {
      cwd: root, env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return {
      evidence: JSON.parse(stdout),
      via: process.env.CF_BROWSER ? '$CF_BROWSER' : 'shared browserpath resolver',
    };
  } catch (error) {
    const stderr = String(error.stderr || '').trim();
    return { error: stderr || error.message || 'shared browser launch probe failed' };
  }
};

{
  const configurationErrors = authorityConfigurationErrors(AUTHORITY);
  if (configurationErrors.length) {
    bad('ROOT BROWSER AUTHORITY CONFIGURATION IS INVALID', configurationErrors.join(' · '));
  } else {
    const found = probeBrowser();
    if (found.error) {
      bad('NO COMPATIBLE BROWSER FOUND — uilayout and bootperf CANNOT RUN',
          found.error + ' · set CF_BROWSER=/absolute/path/to/chrome-or-edge or install one of: ' +
          PIN.browser.resolutionOrder.filter((p) => !p.startsWith('$')).join(' · '));
    } else {
      const errors = browserAuthorityErrors(found.evidence);
      const browser = found.evidence?.browser || {};
      if (errors.length) {
        bad('BROWSER DOES NOT SATISFY ROOT AUTHORITY', errors.join(' · '));
      } else {
        ok('browser ' + browser.product + ' — compatible family, CDP and capabilities',
          browser.executable + ' (' + found.via + ') · revision ' + browser.revision +
          ' · JavaScript ' + browser.js_version + ' · CDP ' + browser.protocol_version +
          ' · ' + found.evidence.capabilities.methods.length + ' required methods');
      }
    }
  }
}

/* ---------- report ---------- */
if (JSON_OUT) {
  console.log(JSON.stringify({ pass: fail === 0, fail, warn, checks: out }, null, 2));
} else {
  console.log('=== PREFLIGHT — executable dependencies (Gate A #2) ===');
  for (const r of out) console.log('  ' + r.level.padEnd(4) + ' ' + r.msg + (r.detail ? '\n         ' + r.detail : ''));
  console.log('');
  if (fail) console.log('PREFLIGHT: FAIL — ' + fail + ' blocking, ' + warn + ' warning(s). The battery cannot be trusted on this machine.');
  else if (warn) console.log('PREFLIGHT: PASS with ' + warn + ' warning(s). Everything required is present.');
  else console.log('PREFLIGHT: PASS — environment satisfies the declared compatibility authority.');
}
process.exit(fail ? 1 : 0);
