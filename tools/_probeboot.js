/* Shared probe-realm boot. Boots tools/probe-build.html in jsdom with the fake
   2D context, injects a probe script, and hands back a global the probe set.

   WHY THIS EXISTS: harness.js, goldenseeds.js and codefixtures.js all need the
   identical ~40 lines of jsdom setup. Three copies of one truth is the same
   hazard already logged for the browser resolver (ROADMAP 9h) — if one copy
   drifts, a fixture silently stops describing the same realm the others do.
   harness.js is deliberately NOT refactored onto this: it is the 50-probe
   fingerprint path, it works, and changing it during baseline capture would put
   the one gate everything else trusts at risk for a tidiness win.

   Usage:
     const { bootProbe } = require('./_probeboot.js');
     bootProbe({ probe: 'goldenseeds-probe.js', global: '__GOLDEN__',
                 pre: (w) => { w.__GOLDEN_CFG__ = cfg; } })
       .then(({ value, errors }) => { ... });  */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const { makeFake2D } = require('./fake2d.js');

const root = path.join(__dirname, '..');
const HTML = path.join(root, 'celestial-frontier.html');
const PROBE_BUILD = path.join(__dirname, 'probe-build.html');

/* probe-build.html is generated FROM the html; rebuild when missing or stale, or
   the fixture would describe a build that no longer exists. */
function ensureProbeBuild(quiet) {
  const stale = !fs.existsSync(PROBE_BUILD) ||
    fs.statSync(PROBE_BUILD).mtimeMs < fs.statSync(HTML).mtimeMs;
  if (stale) {
    if (!quiet) console.log('regenerating probe-build.html …');
    execFileSync(process.execPath, [path.join(__dirname, 'make-probe-build.js'), HTML, PROBE_BUILD],
      { stdio: quiet ? 'ignore' : 'inherit' });
  }
}

function bootProbe(opts) {
  const probeFile = opts.probe;
  const globalName = opts.global;
  const settleIn = opts.settleIn || 400;
  const settleOut = opts.settleOut || 400;
  ensureProbeBuild(opts.quiet);

  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e && e.message)));
  vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));

  const dom = new JSDOM(fs.readFileSync(PROBE_BUILD, 'utf8'), {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'file:///game/celestial-frontier.html',
    virtualConsole: vc,
    beforeParse(window) {
      const proto = window.HTMLCanvasElement.prototype;
      proto.getContext = function (kind) {
        if (kind !== '2d') return null;
        if (!this.__fake2d) this.__fake2d = makeFake2D(this);
        return this.__fake2d;
      };
      proto.toDataURL = function () { return 'data:image/png;base64,'; };
      window.addEventListener('error', (ev) => errors.push('window.onerror: ' + (ev.message || String(ev.error))));
    },
  });
  const { window } = dom;

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        if (opts.pre) opts.pre(window);
        const s = window.document.createElement('script');
        s.textContent = fs.readFileSync(path.join(__dirname, probeFile), 'utf8');
        window.document.body.appendChild(s);
      } catch (e) { errors.push('probe-inject: ' + e.message); }
      setTimeout(() => {
        const value = window[globalName] || null;
        resolve({ value, errors, window });
      }, settleOut);
    }, settleIn);
  });
}

module.exports = { bootProbe, root, HTML, PROBE_BUILD };
