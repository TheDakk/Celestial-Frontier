// Behavioral-equivalence harness: boots the game HTML in jsdom (with a fake
// 2D canvas context) and computes a determinism fingerprint by probing pure
// functions from a second classic <script> in the same realm.
//
// Usage: node tools/harness.js <path-to-html> <out-fingerprint.json>
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const htmlPath = process.argv[2];
const outPath = process.argv[3];
if (!htmlPath || !outPath) { console.error('usage: node harness.js <html> <out.json>'); process.exit(2); }
const html = fs.readFileSync(htmlPath, 'utf8');

// ---- fake 2D context (shared: tools/fake2d.js) ---------------------------
const { makeFake2D } = require('./fake2d.js');

// ---- probe source (runs as a classic script inside the page realm) ------
const probeSource = fs.readFileSync(path.join(__dirname, 'probe.js'), 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e && e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));

const dom = new JSDOM(html, {
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
    window.addEventListener('error', (ev) => {
      errors.push('window.onerror: ' + (ev.message || String(ev.error)));
    });
  },
});

const { window } = dom;

// Let the page finish loading, run one frame, then inject the probe script.
setTimeout(() => {
  try {
    const doc = window.document;
    const s = doc.createElement('script');
    s.textContent = probeSource;
    doc.body.appendChild(s);
  } catch (e) {
    errors.push('probe-inject: ' + e.message);
  }
  setTimeout(() => {
    const fp = window.__FINGERPRINT__ || null;
    const result = {
      bootErrors: errors,
      probeCount: fp ? Object.keys(fp).length : 0,
      fingerprint: fp,
    };
    fs.writeFileSync(outPath, JSON.stringify(result, null, 1));
    const probeErrs = fp ? Object.keys(fp).filter((k) => String(fp[k]).startsWith('ERR:')) : [];
    console.log('boot errors:', errors.length);
    console.log('probe entries:', result.probeCount, ' probe ERRs:', probeErrs.length);
    if (errors.length) console.log(errors.slice(0, 10).join('\n'));
    if (probeErrs.length) console.log('ERR probes:', probeErrs.slice(0, 10).join(', '));
    window.close();
    process.exit(errors.length ? 1 : 0);
  }, 300);
}, 300);
