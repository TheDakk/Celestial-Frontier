/* PREFLIGHT — can this machine actually run the battery?
   Port Phase 0 / Gate A deliverable #2: "reproduce all executable dependencies in a
   clean CI environment."

   WHY (ROADMAP 9h): package.json declares acorn + jsdom + ws, but uilayout.js and
   bootperf.js spawn a REAL system browser over CDP. There is no npm browser driver
   anywhere in tools/. `npm install` on a clean clone therefore leaves TWO of the nine
   suites silently unrunnable — and nothing said so until 2026-07-31.

   EXIT CODES
     0  everything required is present (browser version drift only WARNS)
     1  a required dependency is missing, or --assert-pin was passed and the browser
        revision differs from tools/deps.pinned.json

   USAGE
     node tools/preflight.js                # check + report; drift is a warning
     node tools/preflight.js --assert-pin   # drift is a FAILURE (use in CI)
     node tools/preflight.js --json         # machine-readable

   ⚠ ON DRIFT: Addendum D warns that a layout gate whose thresholds were set on one
   browser revision drifts on the next. uilayout compares against STORED numbers, so a
   version bump is an explicit RE-BASELINE DECISION, not a regression. That is why the
   default is a warning — failing by default would train people to ignore it. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const PIN = JSON.parse(fs.readFileSync(path.join(__dirname, 'deps.pinned.json'), 'utf8'));
const ASSERT = process.argv.includes('--assert-pin');
const JSON_OUT = process.argv.includes('--json');

const out = [];
let fail = 0, warn = 0;
const ok   = (m, d) => { out.push({ level: 'PASS', msg: m, detail: d || '' }); };
const bad  = (m, d) => { out.push({ level: 'FAIL', msg: m, detail: d || '' }); fail++; };
const soft = (m, d) => { out.push({ level: 'WARN', msg: m, detail: d || '' }); warn++; };

const nodeIsSupported = (version) => {
  const parts = String(version).replace(/^v/, '').split('.');
  if (parts.length < 2 || parts.some((part) => !/^\d+$/.test(part))) return false;
  const [major, minor] = parts.map(Number);
  return (major === 20 && minor >= 19) || (major === 22 && minor >= 13) || major >= 24;
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
    || !/NO LAUNCHABLE BROWSER FOUND/.test(String(nonBrowserRejected.stdout || ''))) {
    throw new Error('PREFLIGHT SELFTEST executable non-browser was accepted or misdiagnosed');
  }
  console.log('PREFLIGHT SELFTEST PASS');
  console.log('  supported and excluded Node lines discriminated');
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
  /* One resolver and launch path must own provenance for preflight and uilayout. The
     first preflight accepted any existing executable (even /bin/true), while the gate
     could not open CDP. Run the shared owned launcher and require Browser.getVersion. */
  const probe = path.join(root, 'port', 'v2', 'tools', 'browsercdp.mjs');
  try {
    const stdout = execFileSync(process.execPath, [probe, '--print-json'], {
      cwd: root, env: process.env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    const browser = JSON.parse(stdout);
    if (!browser || typeof browser.executable !== 'string' || !browser.executable
      || typeof browser.product !== 'string' || !browser.product
      || typeof browser.revision !== 'string' || !browser.revision) {
      throw new Error('shared browser probe returned incomplete provenance');
    }
    const match = browser.product.match(/^(?:Edg|Chrome|Chromium|HeadlessChrome)\/(\d+\.\d+\.\d+\.\d+)$/);
    if (!match) throw new Error(`shared browser probe returned an unsupported product: ${browser.product}`);
    return { browser, version: match[1], via: process.env.CF_BROWSER ? '$CF_BROWSER' : 'shared browserpath resolver' };
  } catch (error) {
    const stderr = String(error.stderr || '').trim();
    return { error: stderr || error.message || 'shared browser launch probe failed' };
  }
};

{
  const found = probeBrowser();
  if (found.error) {
    bad('NO LAUNCHABLE BROWSER FOUND — uilayout and bootperf CANNOT RUN',
        found.error + ' · set CF_BROWSER=/absolute/path/to/chrome-or-edge or install one of: ' +
        PIN.browser.resolutionOrder.filter((p) => !p.startsWith('$')).join(' · '));
  } else {
    const ver = found.version;
    const pinned = PIN.browser.pinned.version;
    if (ver === pinned) {
      ok('browser ' + found.browser.product + ' — launches over CDP and matches pin',
        found.browser.executable + ' (' + found.via + ')');
    } else {
      const m = 'BROWSER REVISION DRIFT: found ' + found.browser.product + ', pinned ' + pinned;
      const d = found.browser.executable + ' (' + found.via + ') — CDP launch succeeded; layout thresholds were set on the pinned ' +
                'revision (Addendum D). Treat as a RE-BASELINE DECISION, not a regression: re-run ' +
                'uilayout, and if the numbers move, record the new revision in tools/deps.pinned.json.';
      if (ASSERT) bad(m, d); else soft(m, d);
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
  else console.log('PREFLIGHT: PASS — environment matches the pin exactly.');
}
process.exit(fail ? 1 : 0);
