/* PREFLIGHT — can this machine actually run the battery?
   Port Phase 0 / Gate A deliverable #2: "reproduce all executable dependencies in a
   clean CI environment."

   WHY (ROADMAP 9h): package.json declares only acorn + jsdom, but uilayout.js and
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

/* ---------- node ---------- */
{
  const cur = process.version;
  const num = (v) => String(v).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const [a, b, c] = num(cur), [x, y, z] = num(PIN.node.min);
  const gte = a > x || (a === x && (b > y || (b === y && c >= z)));
  if (gte) ok('node ' + cur, 'min ' + PIN.node.min + ' · Gate A evidence produced on ' + PIN.node.verifiedWith);
  else bad('node ' + cur + ' is below the declared minimum ' + PIN.node.min, 'upgrade node');
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
const resolveBrowser = () => {
  /* ⚠ CF_BROWSER MUST STILL EXIST ON DISK. The first version of this file trusted the
     env var without checking, so `CF_BROWSER=/nope` reported PASS + exit 0 while
     uilayout.js would hard-exit(2) with "Edge not found" — a green-but-wrong state
     inside the very check written to prevent that. Caught by negative-controlling this
     file in both directions (CLAUDE.md rule 7) before it ever shipped. uilayout.js:83
     does the same existence check; match it or this stops describing what the gates do. */
  if (process.env.CF_BROWSER) {
    const p = process.env.CF_BROWSER;
    let here = false;
    try { here = fs.existsSync(p); } catch (_) { here = false; }
    return here ? { path: p, via: '$CF_BROWSER' } : { path: p, via: '$CF_BROWSER', missing: true };
  }
  /* ⚠ this list is duplicated from uilayout.js (~24) and bootperf.js (~56). If they
     diverge, this check silently stops describing what the gates actually run. */
  const candidates = PIN.browser.resolutionOrder.filter((p) => !p.startsWith('$'));
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return { path: p, via: 'auto-detected' }; } catch (_) { /* keep looking */ }
  }
  return null;
};

const browserVersion = (bin) => {
  /* Windows: the binary does not print --version usefully, so read the file's product
     version. POSIX: ask the binary. */
  if (/\.exe$/i.test(bin)) {
    try {
      const ps = 'powershell.exe';
      const cmd = "(Get-Item '" + bin.replace(/\//g, '\\') + "').VersionInfo.ProductVersion";
      return execFileSync(ps, ['-NoProfile', '-Command', cmd],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch (_) { return ''; }
  }
  try {
    return execFileSync(bin, ['--version'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) { return ''; }
};

{
  const found = resolveBrowser();
  if (!found) {
    bad('NO BROWSER FOUND — uilayout and bootperf CANNOT RUN',
        'set CF_BROWSER=/path/to/chrome-or-edge, or install one of: ' +
        PIN.browser.resolutionOrder.filter((p) => !p.startsWith('$')).join(' · '));
  } else if (found.missing) {
    bad('CF_BROWSER points at a path that DOES NOT EXIST — uilayout and bootperf CANNOT RUN',
        found.path + ' — uilayout.js exits(2) on this. Fix the env var or unset it to fall back to auto-detection.');
  } else {
    const ver = browserVersion(found.path);
    const pinned = PIN.browser.pinned.version;
    if (!ver) {
      soft('browser found but version unreadable', found.path + ' (' + found.via + ') · pinned ' + pinned);
    } else if (ver === pinned) {
      ok('browser ' + ver + ' — matches pin', found.path + ' (' + found.via + ')');
    } else {
      const m = 'BROWSER REVISION DRIFT: found ' + ver + ', pinned ' + pinned;
      const d = found.path + ' (' + found.via + ') — layout thresholds were set on the pinned ' +
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
