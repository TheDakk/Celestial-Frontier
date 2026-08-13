/* browserpath.mjs — one fail-closed Chromium-family executable resolver for
   review tools that drive raw CDP. An explicit CF_BROWSER is authoritative;
   when it is set, a typo must fail instead of silently selecting another
   browser and changing evidence provenance.

   Usage:
     node tools/browserpath.mjs --print
     node tools/browserpath.mjs --selftest
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CANDIDATES = Object.freeze([
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/microsoft-edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
]);

function assert(condition, message) {
  if (!condition) throw new Error(`browser path: ${message}`);
}

/* Chromium cannot complete macOS LaunchServices registration inside the
   Codex Seatbelt profile. Spawning it there produces a SIGABRT crash report
   before CDP. Approved/out-of-sandbox commands do not carry this marker. */
export function assertBrowserLaunchAllowed(
  platform = process.platform,
  codexSandbox = process.env.CODEX_SANDBOX,
) {
  if (platform === 'darwin' && codexSandbox === 'seatbelt') {
    throw new Error('browser launch: refusing macOS Chromium inside the Codex Seatbelt sandbox; rerun this browser command with approved elevated execution');
  }
}

function canonicalExecutable(file) {
  try {
    const canonical = fs.realpathSync(file);
    const stat = fs.lstatSync(canonical);
    if (!stat.isFile() || stat.isSymbolicLink()) return null;
    fs.accessSync(canonical, fs.constants.X_OK);
    if (process.platform === 'win32') {
      const handle = fs.openSync(canonical, 'r');
      try {
        const signature = Buffer.alloc(2);
        if (fs.readSync(handle, signature, 0, 2, 0) !== 2 || signature.toString('ascii') !== 'MZ') return null;
      } finally { fs.closeSync(handle); }
    }
    return canonical;
  } catch {
    return null;
  }
}

export function browserCandidates(explicit = process.env.CF_BROWSER) {
  if (explicit !== undefined) {
    assert(typeof explicit === 'string' && explicit.trim() === explicit,
      'CF_BROWSER must be one exact nonblank path');
    assert(explicit.length > 0, 'CF_BROWSER must be one exact nonblank path');
    assert(path.isAbsolute(explicit), 'CF_BROWSER must be an absolute path');
    return [explicit];
  }
  assert(process.env.GITHUB_ACTIONS !== 'true',
    'GitHub Actions requires an explicit CF_BROWSER path');
  return [...DEFAULT_CANDIDATES];
}

export function findChromiumBrowser(candidates = browserCandidates()) {
  assert(Array.isArray(candidates) && candidates.length > 0,
    'candidate list must contain at least one path');
  for (const candidate of candidates) {
    assert(typeof candidate === 'string' && candidate.trim() === candidate && candidate.length > 0,
      'candidate paths must be exact nonblank strings');
    const resolved = path.resolve(candidate);
    const canonical = canonicalExecutable(resolved);
    if (canonical) return canonical;
  }
  const explicit = process.env.CF_BROWSER ? ' from CF_BROWSER' : '';
  throw new Error(`browser path: no Chromium-family browser found${explicit}; run the repository preflight or set CF_BROWSER`);
}

function expectRejected(label, work, pattern) {
  let caught = null;
  try { work(); } catch (error) { caught = error; }
  assert(caught, `SELFTEST ${label}: injected failure was accepted`);
  assert(pattern.test(caught.message), `SELFTEST ${label}: wrong rejection (${caught.message})`);
}

function runSelftest() {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'cf-browserpath-selftest-'));
  try {
    const fixture = path.join(temporary, process.platform === 'win32' ? 'browser-fixture.exe' : 'browser-fixture');
    fs.writeFileSync(fixture, process.platform === 'win32' ? Buffer.from('MZfixture') : '#!/bin/sh\nexit 0\n');
    fs.chmodSync(fixture, 0o755);
    const explicitSelected = findChromiumBrowser(browserCandidates(fixture));
    assert(explicitSelected === fs.realpathSync(fixture),
      'SELFTEST explicit browser did not resolve to its exact real path');
    const selected = findChromiumBrowser([path.join(temporary, 'missing'), fixture]);
    assert(selected === path.resolve(fixture), 'SELFTEST did not select the first real file');
    expectRejected('missing browser', () => findChromiumBrowser([path.join(temporary, 'missing')]),
      /no Chromium-family browser found/);
    const link = path.join(temporary, 'browser-link');
    try {
      fs.symlinkSync(fixture, link);
      assert(findChromiumBrowser([link]) === fs.realpathSync(fixture),
        'SELFTEST did not canonicalize an executable symlink');
    } catch (error) {
      if (fs.existsSync(link)) throw error;
      /* Windows may forbid symlink creation without Developer Mode. The real
         path and invalid-path controls still run there. */
    }
    const nonExecutable = path.join(temporary, 'not-executable');
    fs.writeFileSync(nonExecutable, 'plain text');
    fs.chmodSync(nonExecutable, 0o644);
    expectRejected('non-executable browser', () => findChromiumBrowser([nonExecutable]),
      /no Chromium-family browser found/);
    expectRejected('macOS Codex Seatbelt launch',
      () => assertBrowserLaunchAllowed('darwin', 'seatbelt'),
      /refusing macOS Chromium inside the Codex Seatbelt sandbox/);
    assertBrowserLaunchAllowed('darwin', null);
    assertBrowserLaunchAllowed('linux', 'seatbelt');
    const priorExplicit = process.env.CF_BROWSER;
    const priorGithubActions = process.env.GITHUB_ACTIONS;
    try {
      delete process.env.CF_BROWSER;
      process.env.GITHUB_ACTIONS = 'true';
      expectRejected('CI missing explicit browser', () => browserCandidates(),
        /GitHub Actions requires an explicit CF_BROWSER path/);
      process.env.CF_BROWSER = path.join(temporary, 'explicit-missing');
      expectRejected('invalid explicit browser', () => findChromiumBrowser(), /from CF_BROWSER/);
    } finally {
      if (priorExplicit === undefined) delete process.env.CF_BROWSER;
      else process.env.CF_BROWSER = priorExplicit;
      if (priorGithubActions === undefined) delete process.env.GITHUB_ACTIONS;
      else process.env.GITHUB_ACTIONS = priorGithubActions;
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  console.log('BROWSER PATH SELFTEST PASS');
  console.log('  explicit browser exact real path: PASS');
  console.log('  GitHub Actions without explicit CF_BROWSER: rejected');
  console.log('  first real executable candidate: PASS');
  console.log('  explicit invalid CF_BROWSER fallback: rejected');
  console.log('  executable symlink: canonicalized to its real target');
  console.log('  missing and non-executable candidates: rejected');
  console.log('  macOS Codex Seatbelt browser launch: rejected before spawn');
}

const IS_MAIN = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (IS_MAIN) {
  if (process.argv.includes('--selftest')) runSelftest();
  else if (process.argv.includes('--print')) {
    assertBrowserLaunchAllowed();
    console.log(findChromiumBrowser());
  }
  else {
    console.error('usage: node tools/browserpath.mjs --print | --selftest');
    process.exitCode = 2;
  }
}
