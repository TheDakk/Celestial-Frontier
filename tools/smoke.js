// Interaction smoke test: boots the game in jsdom and drives real UI flows —
// clicks, typing — asserting on the resulting DOM. Complements the determinism
// fingerprint (which covers pure functions) by covering wiring.
//
// Usage: node tools/smoke.js
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'celestial-frontier.html'), 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e && e.message)));
vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));

function makeFake2D(canvas) {
  const gradient = { addColorStop() {} };
  const fake = {
    canvas,
    measureText: () => ({ width: 10 }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    createLinearGradient: () => gradient, createRadialGradient: () => gradient, createConicGradient: () => gradient,
    createPattern: () => null, getLineDash: () => [], isPointInPath: () => false, isPointInStroke: () => false,
  };
  return new Proxy(fake, {
    get(t, p) { if (p in t) return t[p]; return () => undefined; },
    set(t, p, v) { t[p] = v; return true; },
  });
}

const dom = new JSDOM(html, {
  runScripts: 'dangerously', pretendToBeVisual: true,
  url: 'file:///game/celestial-frontier.html', virtualConsole: vc,
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

const w = dom.window;
const doc = w.document;
let failed = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail && !ok ? '  — ' + detail : ''));
  if (!ok) failed++;
}
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
const type = (el, text) => { el.value = text; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const visible = (el) => el && el.style.display && el.style.display !== 'none';

setTimeout(() => {
  try {
    // ---- boot state ----
    check('boots with zero errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    check('intro name prompt shown for fresh expedition', visible(doc.getElementById('namebox')));

    // name the explorer
    const nameIn = doc.getElementById('namein');
    type(nameIn, 'SmokeTester');
    click(doc.getElementById('nameok'));
    check('name accepted, intro closed', !visible(doc.getElementById('namebox')));

    // ---- Guide to the Universe ----
    click(doc.getElementById('helpbtn'));
    const gbox = doc.getElementById('guidebox');
    check('guide opens from ? button', visible(gbox));
    check('guide title renamed', gbox.textContent.includes('Guide to the Universe'));
    const cats = doc.querySelectorAll('#guidebody .gcat');
    check('guide menu lists categories', cats.length >= 8, String(cats.length));

    // drill down: category -> topic -> back
    click(cats[0]);
    const items = doc.querySelectorAll('#guidebody .gitem');
    check('category drill-down lists topics', items.length >= 3, String(items.length));
    click(items[0]);
    check('topic view renders body', !!doc.querySelector('#guidebody .gtopic h4'));
    click(doc.querySelector('#guidebody .gback'));
    check('back returns to category', doc.querySelectorAll('#guidebody .gitem').length >= 3);

    // search
    type(doc.getElementById('guidesearch'), 'stardust');
    const hits = doc.querySelectorAll('#guidebody .gitem');
    check('search finds stardust topics', hits.length >= 2, String(hits.length));
    click(hits[0]);
    check('search hit opens topic', !!doc.querySelector('#guidebody .gtopic'));
    type(doc.getElementById('guidesearch'), 'zzzznothing');
    check('no-results message', !!doc.querySelector('#guidebody .gnores'));

    // cross-link inside a topic body
    type(doc.getElementById('guidesearch'), 'breeding');
    click(doc.querySelector('#guidebody .gitem'));
    const xlink = doc.querySelector('#guidebody .gtopic [data-gt]');
    if (xlink) { click(xlink); }
    check('topic cross-link navigates', !!doc.querySelector('#guidebody .gtopic h4'));

    // close via Continue
    click(doc.getElementById('guideok'));
    check('guide closes via Continue', !visible(gbox));

    check('no errors after interactions', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('smoke script crashed', false, e.stack && e.stack.split('\n')[0]);
  }
  w.close();
  process.exit(failed ? 1 : 0);
}, 700);
