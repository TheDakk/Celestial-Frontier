// Interaction smoke test: boots the game in jsdom and drives real UI flows —
// canvas taps, clicks, typing — asserting on the resulting DOM. Complements
// the determinism fingerprint (pure functions) by covering wiring, including
// the complete 18-step Field Training tutorial, the Guide, and tooltips.
//
// Runs against a probe build so it can locate canvas picks (window.__PROBE_HOOK__).
//
// Usage: node tools/smoke.js
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.join(__dirname, '..');

execFileSync(process.execPath, [path.join(__dirname, 'make-probe-build.js'),
  path.join(root, 'celestial-frontier.html'), path.join(__dirname, 'probe-build.html')], { stdio: 'pipe' });
const html = fs.readFileSync(path.join(__dirname, 'probe-build.html'), 'utf8');

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
const click = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));
const type = (el, text, win) => { win = win || w; el.value = text; el.dispatchEvent(new win.Event('input', { bubbles: true })); };
const visible = (el) => !!(el && el.style.display && el.style.display !== 'none');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (fn()) return true; } catch (_) {}
    await sleep(120);
  }
  console.log('TIMEOUT waiting: ' + label);
  return false;
}
const tutAt = (n) => { const t = doc.getElementById('tutbox'); return visible(t) && t.textContent.includes(n + ' / 18'); };
const tutAct = () => click(doc.getElementById('tut-act'));

(async () => {
  try {
    await sleep(700);
    const H = w.__PROBE_HOOK__;
    check('boots with zero errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    check('probe hook present', !!H);
    check('intro name prompt shown for fresh expedition', visible(doc.getElementById('namebox')));

    // ============ FIELD TRAINING — full 18-step drive ============
    type(doc.getElementById('namein'), 'SmokeTester');
    click(doc.getElementById('nameok'));
    check('name accepted, intro closed', !visible(doc.getElementById('namebox')));

    // fresh expedition: latest bulletin FIRST, then training
    const relFresh = doc.getElementById('relbox');
    check('fresh expedition: latest bulletin shows before training', await until(() =>
      visible(relFresh) && relFresh.textContent.includes('The Deep Spectrum') && !relFresh.textContent.includes('The Living Frontier'), 4000, 'fresh bulletin'));
    check('training has not started yet', !visible(doc.getElementById('tutbox')));
    click(doc.getElementById('relok'));
    check('bulletin closes into training (step 1)', await until(() => tutAt(1), 4000, 'step1'));
    check('Earth NOT pre-charted during training', doc.getElementById('logcount').textContent === '0');

    // focus lockdown: off-lesson surfaces are inert during training
    click(doc.getElementById('codexbtn'));
    check('lockdown: Compendium blocked during welcome', !visible(doc.getElementById('codex')));
    click(doc.getElementById('helpbtn'));
    check('lockdown: Guide blocked during welcome', !visible(doc.getElementById('guidebox')));
    click(doc.getElementById('logbtn'));
    check('lockdown: Atlas blocked during welcome', !visible(doc.getElementById('log')));
    click(doc.getElementById('setbtn'));
    check('lockdown: Settings STAYS available during training', doc.getElementById('setpanel').style.display === 'block');
    click(doc.getElementById('setbtn'));

    tutAct();                                                       // welcome -> find-earth
    check('step 2: find Earth', tutAt(2));

    // locate Earth among live canvas picks, then tap it for real
    const okPick = await until(() => H.st.mode === 'system' && H.picks.some((p) => p.data && p.data.P && p.data.P.seed === 133), 6000, 'earth pick');
    check('system view exposes Earth as a pick', okPick);
    if (okPick) {
      const p = H.picks.find((q) => q.data && q.data.P && q.data.P.seed === 133);
      const cv = doc.getElementById('cosmos');
      const opts = { bubbles: true, cancelable: true, view: w, clientX: p.sx, clientY: p.sy, button: 0 };
      cv.dispatchEvent(new w.MouseEvent('pointerdown', opts));
      cv.dispatchEvent(new w.MouseEvent('pointerup', opts));
      cv.dispatchEvent(new w.MouseEvent('click', opts));
    }
    check('tapping Earth completes step 2', await until(() => tutAt(3), 5000, 'step3'));
    tutAct();                                                       // survey tour -> atlas-add
    check('step 4: add to Atlas', tutAt(4));
    click(doc.querySelector('#panel [data-act="add"]'));
    check('adding Earth to Atlas completes step 4', await until(() => tutAt(5), 3000, 'step5'));
    check('Atlas count is 1 (Earth)', doc.getElementById('logcount').textContent === '1');
    click(doc.getElementById('logbtn'));
    check('opening Atlas completes step 5', await until(() => tutAt(6), 3000, 'step6'));
    check('training cache granted (6 specimens)', doc.getElementById('codexcount').textContent === '6');
    click(doc.getElementById('codexbtn'));
    check('opening Compendium completes step 6', await until(() => tutAt(7), 3000, 'step7'));

    // open a FAUNA specimen card (open its realm group first)
    const fauna = [...H.codex.values()].filter((e) => e.kind === 'Fauna');
    check('cache holds 3 fauna + 3 flora', fauna.length === 3 && H.codex.size === 6);
    const openCard = (id) => {
      const entry = H.codex.get(id);
      const grp = doc.querySelector('.cgrp[data-cg="' + (entry.realm || entry.kind) + '"]');
      if (grp && !grp.classList.contains('open')) click(grp.querySelector('.cgh'));
      click(doc.querySelector('[data-pick="' + id + '"]'));
    };
    openCard(fauna[0].id);
    check('opening a specimen completes step 7', await until(() => tutAt(8), 3000, 'step8'));
    tutAct();                                                       // card tour -> feed
    check('step 9: feed', tutAt(9));

    click(doc.getElementById('rev-feed'));
    check('feed picker lists flora', await until(() => visible(doc.getElementById('pickbox')) && doc.querySelector('#pick-list [data-pk]'), 3000, 'feed picker'));
    click(doc.querySelector('#pick-list [data-pk]'));
    check('feeding completes step 9', await until(() => tutAt(10), 3000, 'step10'));
    click(doc.getElementById('pickclose'));

    // breed: same fauna card is still the open reveal
    click(doc.getElementById('rev-breed'));
    check('breed picker lists mates', await until(() => doc.querySelector('#pick-list [data-pk]'), 3000, 'breed picker'));
    click(doc.querySelector('#pick-list [data-pk]'));
    check('breeding completes step 10', await until(() => tutAt(11), 3000, 'step11'));
    check('rigged training breed succeeded', doc.getElementById('pick-result').textContent.includes('born'));
    click(doc.getElementById('pickclose'));

    tutAct();                                                       // begin training duel
    check('training duel resolves and completes step 11', await until(() => tutAt(12), 25000, 'duel done'));
    check('hazard nip lands (HP 85/100)', await until(() => doc.getElementById('hptext').textContent === '85/100 HP', 3000, 'hp 85'));
    tutAct();                                                       // hazard -> heal
    check('step 13: heal', tutAt(13));

    click(doc.getElementById('hpheart'));
    check('heal picker lists flora', await until(() => doc.querySelector('#pick-list [data-pk]'), 3000, 'heal picker'));
    click(doc.querySelector('#pick-list [data-pk]'));
    check('healing completes step 13', await until(() => tutAt(14), 3000, 'step14'));
    click(doc.getElementById('pickclose'));

    click(doc.getElementById('bell'));
    check('opening tray completes step 14', await until(() => tutAt(15), 3000, 'step15'));
    type(doc.getElementById('searchin'), 'earth');
    check('searching earth completes step 15', await until(() => tutAt(16), 3000, 'step16'));
    click(doc.getElementById('rank'));
    check('character sheet completes step 16', await until(() => tutAt(17), 3000, 'step17'));
    tutAct();                                                       // horizon -> finale (cleanup)
    check('finale reached', await until(() => tutAt(18), 3000, 'step18'));
    check('cleanup: Compendium empty', doc.getElementById('codexcount').textContent === '0');
    check('cleanup: HP fully restored', doc.getElementById('hptext').textContent === '100/100 HP');
    check('cleanup: Atlas keeps only Earth', doc.getElementById('logcount').textContent === '1' && H.logMap.has('p133'));
    tutAct();                                                       // begin the expedition
    check('tutorial closes', await until(() => !visible(doc.getElementById('tutbox')), 2000, 'tut close'));
    const cdxWasOpen = visible(doc.getElementById('codex'));
    click(doc.getElementById('codexbtn'));
    check('lockdown lifted after training', visible(doc.getElementById('codex')) !== cdxWasOpen);
    if (visible(doc.getElementById('codex'))) click(doc.getElementById('codexbtn'));

    // ============ GUIDE TO THE UNIVERSE ============
    click(doc.getElementById('helpbtn'));
    const gbox = doc.getElementById('guidebox');
    check('guide opens from ? button', visible(gbox));
    check('guide title renamed', gbox.textContent.includes('Guide to the Universe'));
    const cats = doc.querySelectorAll('#guidebody .gcat');
    check('guide menu lists categories', cats.length >= 8, String(cats.length));
    click(cats[0]);
    const items = doc.querySelectorAll('#guidebody .gitem');
    check('category drill-down lists topics', items.length >= 3, String(items.length));
    click(items[0]);
    check('topic view renders body', !!doc.querySelector('#guidebody .gtopic h4'));
    click(doc.querySelector('#guidebody .gback'));
    check('back returns to category', doc.querySelectorAll('#guidebody .gitem').length >= 3);
    type(doc.getElementById('guidesearch'), 'stardust');
    check('search finds stardust topics', doc.querySelectorAll('#guidebody .gitem').length >= 2);
    click(doc.querySelector('#guidebody .gitem'));
    check('search hit opens topic', !!doc.querySelector('#guidebody .gtopic'));
    type(doc.getElementById('guidesearch'), 'zzzznothing');
    check('no-results message', !!doc.querySelector('#guidebody .gnores'));

    // release notes: the version line in the footer opens the full history
    const gc = doc.getElementById('gcredit');
    check('guide footer shows version + build', gc && gc.textContent.includes('v1.2') && gc.textContent.includes('dev') && gc.classList.contains('gcredit-link'));
    click(gc);
    const relbox = doc.getElementById('relbox');
    check('footer opens cumulative release notes (all versions)', visible(relbox)
      && relbox.textContent.includes('The Deep Spectrum')
      && relbox.textContent.includes('The Living Frontier')
      && relbox.textContent.includes('The Pathfinder Update')
      && relbox.textContent.includes('The Master Survey')
      && doc.getElementById('relok').textContent === 'Close');
    click(doc.getElementById('relok'));
    check('release notes close', !visible(relbox));

    click(doc.getElementById('guideok'));
    check('guide closes via Continue', !visible(gbox));

    // ============ TOOLTIPS ============
    const tipTarget = doc.getElementById('rank');
    tipTarget.dispatchEvent(new w.FocusEvent('focusin', { bubbles: true }));
    await sleep(420);
    const bubble = doc.getElementById('tipbubble');
    check('tooltip shows on focus', visible(bubble) && bubble.textContent.includes('rank'));
    check('tooltip is pure text (no link)', !bubble.querySelector('span,button,a'));
    doc.getElementById('searchin').dispatchEvent(new w.FocusEvent('focusout', { bubbles: true }));
    click(doc.getElementById('setbtn'));
    const tp = doc.getElementById('tipsopt');
    check('settings shows Tooltips toggle (On)', tp && tp.textContent === 'On');
    click(tp);
    check('tooltips toggle to Off', tp.textContent === 'Off');
    tipTarget.dispatchEvent(new w.FocusEvent('focusin', { bubbles: true }));
    await sleep(420);
    check('no tooltip while disabled', !visible(doc.getElementById('tipbubble')));
    click(tp);
    check('tooltips back On', tp.textContent === 'On');

    check('no errors after all interactions', errors.length === 0, errors.slice(0, 3).join(' | '));
    w.close();

    // ============ BOOT 2: veteran save (no `tut` field) never sees training ============
    const vet = boot((win) => {
      win.localStorage.setItem('cfcc_save_v1', JSON.stringify({ v: 4, me: 'Veteran', guide: 1 }));
    });
    await sleep(1600);
    check('veteran: no name prompt', !visible(vet.doc.getElementById('namebox')));
    check('veteran: tutorial never starts', !visible(vet.doc.getElementById('tutbox')));
    const vrel = vet.doc.getElementById('relbox');
    check('veteran: update bulletin pops once', visible(vrel)
      && vrel.textContent.includes('The Deep Spectrum')
      && !vrel.textContent.includes('The Living Frontier')
      && !vrel.textContent.includes('The Master Survey')
      && vet.doc.getElementById('relok').textContent === 'Continue');
    click2(vet.doc.getElementById('relok'), vet.w);
    check('veteran: bulletin closes via Continue', !visible(vrel));
    check('veteran: boots clean', vet.errors.length === 0, vet.errors.slice(0, 2).join(' | '));
    vet.w.close();

    // ============ BOOT 3: skip path still charts Earth ============
    const sk = boot();
    await sleep(700);
    type(sk.doc.getElementById('namein'), 'Skipper', sk.w);
    click2(sk.doc.getElementById('nameok'), sk.w);
    await until(() => visible(sk.doc.getElementById('relbox')), 4000, 'skip: bulletin');
    click2(sk.doc.getElementById('relok'), sk.w);
    await until(() => visible(sk.doc.getElementById('tutbox')), 4000, 'skip: tutbox');
    click2(sk.doc.getElementById('tut-skip'), sk.w);
    check('skip shows confirm', sk.doc.getElementById('tutbox').textContent.includes('Skip training?'));
    click2(sk.doc.getElementById('tut-skip-no'), sk.w);
    check('Keep Training returns to step', sk.doc.getElementById('tutbox').textContent.includes('1 / 18'));
    click2(sk.doc.getElementById('tut-skip'), sk.w);
    click2(sk.doc.getElementById('tut-skip-yes'), sk.w);
    check('skip closes tutorial', !visible(sk.doc.getElementById('tutbox')));
    check('skip: Earth charted in Atlas', sk.doc.getElementById('logcount').textContent === '1');
    check('skip: Compendium empty', sk.doc.getElementById('codexcount').textContent === '0');
    click2(sk.doc.getElementById('codexbtn'), sk.w);
    check('skip: everything unlocked (Compendium opens)', visible(sk.doc.getElementById('codex')));
    click2(sk.doc.getElementById('helpbtn'), sk.w);
    check('skip: everything unlocked (Guide opens)', visible(sk.doc.getElementById('guidebox')));
    check('skip: boots clean', sk.errors.length === 0, sk.errors.slice(0, 2).join(' | '));
    sk.w.close();

    // ============ BOOT 4: half-finished training saved in deep space resumes AT SOL ============
    const ds = boot((win) => {
      win.localStorage.setItem('cfcc_save_v1', JSON.stringify({
        v: 4, me: 'Wanderer', guide: 1, tut: 0, rn: '1.1',
        view: { type: 'galaxy', gal: { x: -3000, y: 2400, size: 60, sp: 3, tilt: 0.4, rot: 1.2, seed: 777777 } },
      }));
    });
    await sleep(1800);
    const dsH = ds.w.__PROBE_HOOK__;
    check('deep-space resume: training restarts', visible(ds.doc.getElementById('tutbox')));
    check('deep-space resume: camera snapped home to Sol system', dsH && dsH.st.mode === 'system' && dsH.st.star && dsH.st.star.seed === 424242,
      dsH ? (dsH.st.mode + '/' + (dsH.st.star && dsH.st.star.seed)) : 'no hook');
    check('deep-space resume: boots clean', ds.errors.length === 0, ds.errors.slice(0, 2).join(' | '));
    ds.w.close();
  } catch (e) {
    check('smoke script crashed', false, e.stack && e.stack.split('\n').slice(0, 2).join(' '));
  }
  process.exit(failed ? 1 : 0);
})();

function boot(preSeed) {
  const errs = [];
  const vcon = new VirtualConsole();
  vcon.on('jsdomError', (e) => errs.push('jsdomError: ' + (e && e.message)));
  vcon.on('error', (...a) => errs.push('console.error: ' + a.map(String).join(' ')));
  const d = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://game.local/celestial-frontier.html', virtualConsole: vcon,
    beforeParse(window) {
      const proto = window.HTMLCanvasElement.prototype;
      proto.getContext = function (kind) {
        if (kind !== '2d') return null;
        if (!this.__fake2d) this.__fake2d = makeFake2D(this);
        return this.__fake2d;
      };
      proto.toDataURL = function () { return 'data:image/png;base64,'; };
      window.addEventListener('error', (ev) => errs.push('window.onerror: ' + (ev.message || String(ev.error))));
      if (preSeed) preSeed(window);
    },
  });
  return { dom: d, w: d.window, doc: d.window.document, errors: errs };
}
function click2(el, win) { return el && el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true, view: win })); }
