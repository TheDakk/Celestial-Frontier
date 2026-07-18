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

const { makeFake2D } = require('./fake2d.js');

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
      visible(relFresh) && relFresh.textContent.includes('The HD Frontier') && relFresh.textContent.includes('v1.3'), 4000, 'fresh bulletin'));
    // v1.3 opens a fresh minor line — the bulletin shows it alone, and
    // no other line (1.2.x, 1.1.x, 1.0) may leak in
    check('bulletin shows the v1.3 line alone (no 1.2.x leak)',
      !relFresh.textContent.includes('Ink & Ember') && !relFresh.textContent.includes('First Contact')
      && !relFresh.textContent.includes('The Hunt Board') && !relFresh.textContent.includes('The Discovery Arc'));
    check('bulletin hides other-line entries (no 1.1.x, no 1.0 debut)',
      !relFresh.textContent.includes('Clear Signals') && !relFresh.textContent.includes('Signal & Polish')
      && !relFresh.textContent.includes('The Frontier Opens'));
    check('bulletin carries a real ship date (nothing In development)',
      !relFresh.textContent.includes('In development'));
    check('training has not started yet', !visible(doc.getElementById('tutbox')));
    click(doc.getElementById('relok'));
    check('bulletin closes into training (step 1)', await until(() => tutAt(1), 4000, 'step1'));
    check('Earth NOT pre-charted during training', doc.getElementById('logcount').textContent === '0');

    // focus lockdown: off-lesson surfaces are inert during training
    click(doc.getElementById('codexbtn'));
    check('lockdown: Compendium blocked during welcome', !visible(doc.getElementById('codex')));
    click(doc.getElementById('helpbtn'));
    check('lockdown: ? popover shows version during welcome', visible(doc.getElementById('helppop'))
      && doc.getElementById('helppop').textContent.includes('v'));
    click(doc.getElementById('hp-guide'));
    check('lockdown: Guide blocked during welcome', !visible(doc.getElementById('guidebox')));
    check('lockdown: locked Guide still answers with a pop-up (the one training exception)',
      [...doc.querySelectorAll('#toast .tst')].some((t) => t.textContent.includes('Guide unlocks')));
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
    // condensed card (1.1.2): actions ride at the top, environment + civ census fold
    const panelBody = doc.querySelector('#panel .body');
    check('card actions render at the TOP of the body (atlas row first)',
      !!panelBody && !!panelBody.firstElementChild && panelBody.firstElementChild.classList.contains('atlasrow'));
    check('spectral class row stays outside the folds',
      !![...doc.querySelectorAll('#panel .row.grade')].find(r => !r.closest('.gbody')));
    const envGrp = doc.querySelector('#panel [data-gtoggle="1"]');
    check('environment group header present on a planet card', !!envGrp);
    check('environment group is collapsed by default', !!envGrp && !envGrp.closest('.grp').classList.contains('open'));
    check('collapsed header carries a digest', !!envGrp && envGrp.querySelector('.gdig').textContent.length > 0);
    check('atmosphere row lives inside the environment fold',
      !![...doc.querySelectorAll('#panel .gbody .row .k')].find(k => k.textContent === 'Atmosphere'));
    const civGrp = doc.querySelector('#panel [data-gtoggle="2"]');
    check('civilization census folds behind its headline (Earth has one)', !!civGrp
      && !![...civGrp.closest('.grp').querySelectorAll('.gbody .row .k')].find(k => k.textContent === 'Population'));
    click(envGrp);
    check('tapping the chevron unfolds the environment', envGrp.closest('.grp').classList.contains('open'));
    click(envGrp);
    check('tapping again folds it back', !envGrp.closest('.grp').classList.contains('open'));
    check('fold toggling never advances training', tutAt(4));
    check('Earth (a living world) never offers mining',
      !doc.querySelector('#panel [data-act="mine"]'));
    check('every world is tap-to-landable (Earth carries a plain Land button)',
      !!doc.querySelector('#panel [data-act="landcta"]'));
    click(doc.querySelector('#panel [data-act="add"]'));
    check('adding Earth to Atlas completes step 4', await until(() => tutAt(5), 3000, 'step5'));
    check('Atlas count is 1 (Earth)', doc.getElementById('logcount').textContent === '1');
    click(doc.getElementById('logbtn'));
    check('opening Atlas completes step 5', await until(() => tutAt(6), 3000, 'step6'));
    check('training cache granted (6 specimens)', doc.getElementById('codexcount').textContent === '6');
    // training is toast-quiet: cache + rank-up land in the tray, never as pop-ups
    const tutToasts = [...doc.querySelectorAll('#toast .tst')].map((t) => t.textContent).join('|');
    check('training quiet: no Training Cache pop-up (tray-only)', !tutToasts.includes('Training Cache'), tutToasts);
    check('training quiet: no Rank Up fanfare mid-training', !tutToasts.includes('Rank Up'), tutToasts);
    check('training quiet: the bell tray still counts the story', visible(doc.getElementById('bellct'))
      && doc.getElementById('bellct').textContent !== '0');
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
    // field scout (v1.2): every owned fauna card offers the toggle; it round-trips
    const scoutBtn = doc.getElementById('rev-scout');
    check('scout: fauna card offers the Field Scout toggle', !!scoutBtn && scoutBtn.textContent.includes('Scout'));
    click(scoutBtn);
    check('scout: toggling names the scout (state + button)',
      H.scoutId === fauna[0].id && doc.getElementById('rev-scout').textContent.includes('Scouting'));
    click(doc.getElementById('rev-scout'));
    check('scout: toggling again stands it down', H.scoutId === null);
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
    check('? popover shows version + guide link', visible(doc.getElementById('helppop')));
    click(doc.getElementById('hp-guide'));
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
    // keyboard operability: panel items carry role+tabindex and the Enter/Space shim drives them
    const kbItem = doc.querySelector('#guidebody .gitem');
    check('guide items are keyboard-operable (role="button" + tabindex)',
      kbItem.getAttribute('role') === 'button' && kbItem.getAttribute('tabindex') === '0');
    kbItem.focus();                                          // a real keyboard user tabbed here
    kbItem.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    check('Enter opens a guide topic (keyboard shim)', !!doc.querySelector('#guidebody .gtopic h4'));
    check('focus survives the re-render (lands on Back, not <body>)',
      doc.activeElement && doc.activeElement.classList && doc.activeElement.classList.contains('gback'));
    click(doc.querySelector('#guidebody .gback'));
    type(doc.getElementById('guidesearch'), 'stardust');
    check('search finds stardust topics', doc.querySelectorAll('#guidebody .gitem').length >= 2);
    click(doc.querySelector('#guidebody .gitem'));
    check('search hit opens topic', !!doc.querySelector('#guidebody .gtopic'));
    type(doc.getElementById('guidesearch'), 'zzzznothing');
    check('no-results message', !!doc.querySelector('#guidebody .gnores'));

    // release notes: the version line in the footer opens the full history
    const gc = doc.getElementById('gcredit');
    check('guide footer shows version + build', gc && gc.textContent.includes('v1.3') && gc.textContent.includes('dev') && gc.classList.contains('gcredit-link'));
    click(gc);
    const relbox = doc.getElementById('relbox');
    check('footer opens cumulative release notes (all versions)', visible(relbox)
      && relbox.textContent.includes('The Frontier Opens')
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

    // ============ MOTION TRI-STATE + VOLUME SLIDER (Tier 2) ============
    const mopts = doc.querySelectorAll('#setpanel .fsopt[data-motion]');
    check('settings shows Motion Auto/Full/Reduced (Auto on)',
      mopts.length === 3 && mopts[0].classList.contains('on') && !doc.body.classList.contains('rmotion'));
    click(mopts[2]);                                        // Reduced
    check('Motion → Reduced stamps body.rmotion',
      H.motionMode === 1 && doc.body.classList.contains('rmotion') && mopts[2].classList.contains('on'));
    click(mopts[1]);                                        // Full
    check('Motion → Full lifts the class', H.motionMode === 0 && !doc.body.classList.contains('rmotion'));
    click(mopts[0]);                                        // Auto again (jsdom has no OS preference → full motion)
    // v1.3 ship decision: HD is the game — no Landing view setting exists,
    // and the flag is permanently on
    check('HD is always on, with no Landing view row in Settings',
      H.hdOn===true && !doc.querySelector('#setpanel .fsopt[data-hd]'));
    check('Motion → Auto follows the OS preference', H.motionMode === -1 && !doc.body.classList.contains('rmotion'));
    const vs = doc.getElementById('volslider');
    check('settings shows Volume slider at full', !!vs && vs.value === '100');
    vs.value = '40';
    vs.dispatchEvent(new w.Event('input', { bubbles: true }));
    check('volume slider drives the SFX level live (sfxVol 0.4)', Math.abs(H.sfxVol - 0.4) < 1e-9, String(H.sfxVol));
    vs.dispatchEvent(new w.Event('change', { bubbles: true }));
    // (persistence of vol/rm is asserted on the pre-seeded boots below — this
    //  window is file:// / opaque-origin, so its localStorage is off limits)

    // ============ PLAYER RENAME (Settings → Display, cancellable) ============
    click(doc.getElementById('renameopt'));               // settings panel is still open from the tooltip checks
    const nbox = doc.getElementById('namebox');
    check('settings rename opens the naming dialog', visible(nbox)
      && nbox.textContent.includes('Change your explorer name'));
    check('rename dialog offers Cancel (initial naming never does)', visible(doc.getElementById('namecancel')));
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('Escape cancels the rename', !visible(nbox));
    check('cancel kept the old name', doc.getElementById('rank').textContent.includes('SmokeTester'));
    click(doc.getElementById('setbtn'));
    click(doc.getElementById('renameopt'));
    type(doc.getElementById('namein'), 'RenamedTester');
    click(doc.getElementById('nameok'));
    check('rename commits and the nameplate follows', !visible(nbox)
      && doc.getElementById('rank').textContent.includes('RenamedTester'));

    check('no errors after all interactions', errors.length === 0, errors.slice(0, 3).join(' | '));
    w.close();

    // ============ BOOT 2: veteran save (no `tut` field) never sees training ============
    const vet = boot((win) => {
      win.localStorage.setItem('cfcc_save_v1', JSON.stringify({ v: 4, me: 'Veteran', guide: 1, rn: '1.0',
        log: [{ id: 'p555', title: 'Old Haunt', sub: 'World', t: 1 }],
        conq: [[777, { t: 1, tier: 1 }]] }));
    });
    await sleep(1600);
    check('veteran: no name prompt', !visible(vet.doc.getElementById('namebox')));
    check('veteran: tutorial never starts', !visible(vet.doc.getElementById('tutbox')));
    const vrel = vet.doc.getElementById('relbox');
    check('veteran: update bulletin pops once', visible(vrel)
      && vrel.textContent.includes('The HD Frontier')
      && vet.doc.getElementById('relok').textContent === 'Continue');
    click2(vet.doc.getElementById('relok'), vet.w);
    check('veteran: bulletin closes via Continue', !visible(vrel));
    check('veteran: absent vol/rm default to full volume + Auto motion',
      vet.doc.getElementById('volslider').value === '100' && !vet.doc.body.classList.contains('rmotion')
      && vet.w.__PROBE_HOOK__.motionMode === -1);
    // discovery arc (v1.2): a pre-1.2 save has no `land` field — every world
    // the veteran charted or settled must count as ground-surveyed already
    check('veteran: pre-1.2 save grandfathers charted + settled worlds as ground-surveyed',
      vet.w.__PROBE_HOOK__.landed.has(555) && vet.w.__PROBE_HOOK__.landed.has(777));
    // charters: proven trades complete quietly; unproven ones stay open
    check('veteran: starter charters auto-complete only for proven trades',
      vet.w.__PROBE_HOOK__.chDone.has('st-land') && vet.w.__PROBE_HOOK__.chDone.has('st-conq')
      && !vet.w.__PROBE_HOOK__.chDone.has('st-scan') && !vet.w.__PROBE_HOOK__.chDone.has('st-mine'));
    // first contact (v1.2.2): a pre-contact save keeps every census it held
    check('veteran: contacted grandfathered from landed + conquered',
      vet.w.__PROBE_HOOK__.contacted.has(555) && vet.w.__PROBE_HOOK__.contacted.has(777));
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
    click2(sk.doc.getElementById('hp-guide'), sk.w);
    check('skip: everything unlocked (Guide opens)', visible(sk.doc.getElementById('guidebox')));

    // ============ v1.2 DISCOVERY ARC: glance → orbital survey → ground survey ============
    sk.doc.dispatchEvent(new sk.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); // close the guide
    const skH = sk.w.__PROBE_HOOK__;
    check('discovery: a fresh expedition has stood on no worlds', skH.landed.size === 0);
    // charters: the hunt board opens after training with the starter list
    click2(sk.doc.getElementById('chbtn'), sk.w);
    const chp = sk.doc.getElementById('chpanel');
    check('charters: the board opens with the starter charters', chp.style.display === 'block'
      && chp.textContent.includes('Starter charters') && chp.textContent.includes('Make planetfall')
      && chp.textContent.includes('Conquer a world'));
    check('charters: nothing is complete on a fresh expedition', skH.chDone.size === 0
      && !chp.textContent.includes('✓'));
    // Sol is deterministic: find a lifeless (venus-type) planet pick, hover it
    const okDead = await until(() => skH.st.mode === 'system'
      && skH.picks.some((p) => p.data && p.data.P && p.data.P.type === 'venus'), 6000, 'venus pick');
    check('discovery: system view exposes a lifeless world as a pick', okDead);
    const dp = skH.picks.find((q) => q.data && q.data.P && q.data.P.type === 'venus');
    const cv3 = sk.doc.getElementById('cosmos');
    const dOpts = { bubbles: true, cancelable: true, view: sk.w, clientX: dp.sx, clientY: dp.sy, button: 0 };
    cv3.dispatchEvent(new sk.w.MouseEvent('pointermove', dOpts));
    const pan3 = sk.doc.getElementById('panel');
    const sawGlance = await until(() => pan3.style.display === 'block' && pan3.textContent.includes('Long-range glance'), 4000, 'glance card');
    check('discovery: hover shows the LONG-RANGE GLANCE, not the survey', sawGlance);
    check('discovery: the glance offers no buttons and no environment rows',
      !pan3.querySelector('.atlasrow') && !pan3.querySelector('[data-gtoggle]'));
    check('discovery: the glance keeps the color language (spectral row)', !!pan3.querySelector('.row.grade'));
    // tap = orbital survey
    cv3.dispatchEvent(new sk.w.MouseEvent('pointerdown', dOpts));
    cv3.dispatchEvent(new sk.w.MouseEvent('pointerup', dOpts));
    cv3.dispatchEvent(new sk.w.MouseEvent('click', dOpts));
    const sawOrbital = await until(() => pan3.querySelector('.atlasrow') && pan3.textContent.includes('Procedural survey'), 4000, 'orbital card');
    check('discovery: tapping locks the ORBITAL SURVEY (buttons + environment fold)', sawOrbital
      && !!pan3.querySelector('[data-gtoggle="1"]'));
    check('discovery: an unlanded dead world offers Land, never Mine',
      !!pan3.querySelector('[data-act="landcta"]') && !pan3.querySelector('[data-act="mine"]'));
    // v1.3 card UX: the locked card wears a close X and drags by its head
    check('card UX: a locked card wears the close X', !!pan3.querySelector('.pxc'));
    {
      const head = pan3.querySelector('.head');
      const x0 = parseFloat(pan3.style.left) || 0, y0 = parseFloat(pan3.style.top) || 0;
      const pOpts = (x, y) => ({ bubbles: true, cancelable: true, clientX: x, clientY: y, view: sk.w });
      head.dispatchEvent(new sk.w.MouseEvent('pointerdown', pOpts(x0 + 40, y0 + 12)));
      head.dispatchEvent(new sk.w.MouseEvent('pointermove', pOpts(x0 + 140, y0 + 92)));
      head.dispatchEvent(new sk.w.MouseEvent('pointerup', pOpts(x0 + 140, y0 + 92)));
      const moved = await until(() => Math.abs((parseFloat(pan3.style.left) || 0) - x0) > 50
        && pan3.style.display !== 'none', 4000, 'panel drag');
      check('card UX: dragging the head moves the card and keeps it open', moved);
      click2(pan3.querySelector('.pxc'), sk.w);
      // the cursor may still hover the world (desktop), so the panel can
      // legitimately reopen as a GLANCE preview — the X's job is releasing
      // the LOCK (and with it the buttons and the X itself)
      check('card UX: the X releases the lock', await until(() =>
        !pan3.classList.contains('locked'), 4000, 'lock release'));
      // re-lock the same world so the Land-button flow below continues unchanged
      cv3.dispatchEvent(new sk.w.MouseEvent('pointerdown', dOpts));
      cv3.dispatchEvent(new sk.w.MouseEvent('pointerup', dOpts));
      cv3.dispatchEvent(new sk.w.MouseEvent('click', dOpts));
      check('card UX: tapping the world again re-locks the survey', await until(() =>
        pan3.style.display !== 'none' && !!pan3.querySelector('[data-act="landcta"]'), 4000, 're-lock'));
    }
    check('discovery: the glance never misreads a dead world (no biosignatures on venus-type)',
      !pan3.textContent.includes('biosignatures'));
    // enable the HD landing view so planetfall opens the vista (v1.3)
    check('HD landing view armed for the flight down (always on)', skH.hdOn===true);
    // press the LAND button — it must fly down and perform real planetfall
    click2(pan3.querySelector('[data-act="landcta"]'), sk.w);
    check('discovery: the Land button performs planetfall', await until(() =>
      skH.st.mode === 'surface' && skH.landed.has(dp.data.P.seed), 5000, 'planetfall'));
    check('HD vista: planetfall opens the landing panorama', await until(() =>
      sk.doc.getElementById('vistabox').style.display === 'flex', 5000, 'vista overlay'));
    click2(sk.doc.getElementById('vistabox'), sk.w);
    check('HD vista: tap dismisses the panorama (fade-out)', await until(() =>
      sk.doc.getElementById('vistabox').style.display === 'none', 4000, 'vista fade-out'));
    // B1: the art is no longer see-once — the surface card reopens it
    check('HD vista: the surface card offers a re-view', await until(() =>
      !!pan3.querySelector('[data-act="vista"]'), 4000, 'vista button'));
    click2(pan3.querySelector('[data-act="vista"]'), sk.w);
    check('HD vista: re-view reopens the panorama', await until(() =>
      sk.doc.getElementById('vistabox').style.display === 'flex', 4000, 'vista reopen'));
    check('HD vista: the postcard button rides the panorama', !!sk.doc.querySelector('#vistabox .vpc'));
    click2(sk.doc.getElementById('vistabox'), sk.w);
    await until(() => sk.doc.getElementById('vistabox').style.display === 'none', 4000, 'vista re-dismiss');
    // v1.3 iteration 2 — every new scene must render a full-size canvas without throwing
    for (const [nm, o] of [
      ['ember volcano + ashfall', { seed: 9001, era: 'none', pal: 'ember', wx: 'ash', moons: 1 }],
      ['island day (spacefaring harbor)', { seed: 9002, era: 'space', pal: 'day', biome: 'island', moons: 2 }],
      ['island night rain + aurora', { seed: 9003, era: 'iron', pal: 'night', biome: 'island', wx: 'rain', moons: 3, aurora: true }],
      ['terran snowfall', { seed: 9004, era: 'iron', pal: 'snow', wx: 'snow', moons: 0 }],
      ['terran twilight', { seed: 9005, era: 'none', pal: 'twilight', moons: 1 }],
      ['aurora night over land', { seed: 9006, era: 'space', pal: 'night', moons: 2, aurora: true }],
      ['rocky world by starlight (nightize)', { seed: 9007, era: 'none', pal: 'grey', nightize: true, moons: 2 }],
      ['lifeless ocean — bare beach, no moon glitter', { seed: 9008, era: 'none', pal: 'night', biome: 'island', flora: false, moons: 0 }],
      ['desert with hardy vegetation (V3)', { seed: 9009, era: 'none', pal: 'sand', flora: true }],
      ['industrial-era town, river kept (V6+V7)', { seed: 9010, era: 'town', pal: 'day', moons: 1 }],
      ['the works: beasts + herd + fliers + swimmers + rings + star tint', { seed: 9011, era: 'none', pal: 'day',
        genes: [{ bulk: 1.1, neck: 0.5, horn: 0.6, tail: 0.5, leg: 0.5, stripes: 0.5, mottle: 0.7, base: [150, 110, 80], dark: [60, 45, 32], rim: 'rgba(255,220,170,1)', eye: '#7fd6ff', plan: 4, len: 1.1, tier: 5 }],
        herd: 4, air: 2, aqua: 1, ring: true, stc: '#ff9a6a', moons: 1 }],
      ['dry world — no river at all (water none)', { seed: 9012, era: 'none', pal: 'day', water: 'none', flora: false }],
      ['duskized ice world (low sun)', { seed: 9013, era: 'none', pal: 'ice', duskize: true, wx: 'snow' }],
    ]) {
      let cvS = null, err = null;
      try { cvS = skH.hdVista(o); } catch (e) { err = e; }
      check('HD vista scene renders: ' + nm, !err && !!cvS && cvS.width === 960 && cvS.height === 430, err && String(err));
    }
    check('discovery: standing on it, mining is open on the spot', await until(() =>
      !!pan3.querySelector('[data-act="mine"]') && pan3.textContent.includes('You are here'), 4000, 'surface mine'));
    check('discovery: ground survey reveals the mineral veins without Deep Scanners',
      pan3.textContent.includes('Mineral veins'));
    // the landing completed starter charter 1; the open board re-rendered live
    check('charters: Make planetfall completes on landing (paid + ticked)', skH.chDone.has('st-land')
      && chp.textContent.includes('✓ Make planetfall'));
    const chToasts1 = [...sk.doc.querySelectorAll('#toast .tst')].map((t) => t.textContent).join('|');
    check('charters: completion announces itself with the next charter', chToasts1.includes('Charter Complete')
      && chToasts1.includes('Prospect a dead world'), chToasts1);
    check('MUD events: the charter toast wears the milestone gold tint', !!sk.doc.querySelector('#toast .tst.tk-gold'));
    // mine right here — starter charter 2
    click2(pan3.querySelector('[data-act="mine"]'), sk.w);
    check('charters: Prospect a dead world completes on the first mine', await until(() =>
      skH.chDone.has('st-mine') && chp.textContent.includes('✓ Prospect a dead world'), 4000, 'charter 2'));
    // cargo (v1.2.2): the hold is a real inventory — icon tiles + a bench tab
    click2(sk.doc.getElementById('cargobtn'), sk.w);
    const cgEl = sk.doc.getElementById('cargo');
    check('cargo: the Inventory tab shows item tiles with element icons',
      cgEl.style.display === 'block' && cgEl.querySelectorAll('.slot img').length > 0
      // procedural data-URI icons — SVG in Classic, canvas PNG in HD (jsdom stubs the latter as 'data:,')
      && cgEl.querySelector('.slot img').src.startsWith('data:'));
    check('cargo: tiles carry quantities', !!cgEl.querySelector('.slot .qty'));
    click2(cgEl.querySelector('[data-ct="bench"]'), sk.w);
    check('cargo: the Research Bench lives on its own tab', cgEl.textContent.includes('Deep Scanners')
      && !!cgEl.querySelector('.ctab.on[data-ct="bench"]'));
    // landing pays (v1.2): first footfall grants field samples + stardust
    const groundToasts = [...sk.doc.querySelectorAll('#toast .tst')].map((t) => t.textContent).join('|');
    check('discovery: first landing grants field samples (toast + stardust)',
      groundToasts.includes('Ground survey') && groundToasts.includes('Stardust'), groundToasts);
    check('MUD events: the samples toast wears the gain tint', !!sk.doc.querySelector('#toast .tst.tk-gain'));
    check('discovery: samples reach the Cargo hold (button appears)',
      sk.doc.getElementById('cargobtn').style.display === 'flex');
    // zoom back out — the ground survey is remembered from orbit
    skH.st.pcam.z = 0.4;
    check('discovery: zooming out returns to the system', await until(() => skH.st.mode === 'system', 4000, 'back to system'));
    const okBack = await until(() => skH.picks.some((p) => p.data && p.data.P && p.data.P.seed === dp.data.P.seed), 5000, 'repick');
    check('discovery: the landed world is still pickable', okBack);
    const dp2 = skH.picks.find((q) => q.data && q.data.P && q.data.P.seed === dp.data.P.seed);
    const dOpts2 = { bubbles: true, cancelable: true, view: sk.w, clientX: dp2.sx, clientY: dp2.sy, button: 0 };
    cv3.dispatchEvent(new sk.w.MouseEvent('pointerdown', dOpts2));
    cv3.dispatchEvent(new sk.w.MouseEvent('pointerup', dOpts2));
    cv3.dispatchEvent(new sk.w.MouseEvent('click', dOpts2));
    check('discovery: from orbit the card stays GROUND-SURVEYED with mining open', await until(() =>
      pan3.textContent.includes('Ground-surveyed') && !!pan3.querySelector('[data-act="mine"]'), 5000, 'ground card from orbit'));
    check('discovery: a grounded world still offers plain Land (revisits + sightseeing)',
      !!pan3.querySelector('[data-act="landcta"]'));
    check('skip: boots clean', sk.errors.length === 0, sk.errors.slice(0, 2).join(' | '));
    sk.w.close();

    // ============ BOOT 4: half-finished training saved in deep space resumes AT SOL ============
    const ds = boot((win) => {
      win.localStorage.setItem('cfcc_save_v1', JSON.stringify({
        v: 4, me: 'Wanderer', guide: 1, tut: 0, rn: '1.1.1', vol: 40, rm: 1,
        view: { type: 'galaxy', gal: { x: -3000, y: 2400, size: 60, sp: 3, tilt: 0.4, rot: 1.2, seed: 777777 } },
      }));
    });
    await sleep(1800);
    const dsH = ds.w.__PROBE_HOOK__;
    check('deep-space resume: training restarts', visible(ds.doc.getElementById('tutbox')));
    check('deep-space resume: camera snapped home to Sol system', dsH && dsH.st.mode === 'system' && dsH.st.star && dsH.st.star.seed === 424242,
      dsH ? (dsH.st.mode + '/' + (dsH.st.star && dsH.st.star.seed)) : 'no hook');
    check('saved vol/rm load and apply (slider 40, explicit Reduced)',
      ds.doc.getElementById('volslider').value === '40' && ds.doc.body.classList.contains('rmotion')
      && dsH.motionMode === 1 && Math.abs(dsH.sfxVol - 0.4) < 1e-9);
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
