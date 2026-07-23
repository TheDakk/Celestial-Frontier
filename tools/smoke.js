// Interaction smoke test: boots the game in jsdom and drives real UI flows —
// canvas taps, clicks, typing — asserting on the resulting DOM. Complements
// the determinism fingerprint (pure functions) by covering wiring, including
// the complete 20-step Field Training tutorial, the Guide, and tooltips.
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
const tutAt = (n) => { const t = doc.getElementById('tutbox'); return visible(t) && t.textContent.includes(n + ' / 20'); };
const tutAct = () => click(doc.getElementById('tut-act'));

(async () => {
  try {
    await sleep(700);
    const H = w.__PROBE_HOOK__;
    check('boots with zero errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    check('probe hook present', !!H);

    // ============ v1.7 PHASE A — universal rarity vocabulary ============
    if (H && H.RARITY_V17 && H.displayRarity && H.GRADE_TIERS) {
      const RV = H.RARITY_V17, dR = H.displayRarity, GT = H.GRADE_TIERS;
      check('rarity: RARITY_V17 is the 10-tier ladder', RV.length === 10 &&
        RV[0].name === 'Common' && RV[9].name === 'Transcendent');
      check('rarity: displayRarity collapses score 6 -> Mythic, 7 -> Celestial', dR(6).name === 'Mythic' && dR(7).name === 'Celestial');
      check('rarity: displayRarity clamps raw 10+ to Transcendent', dR(12).name === 'Transcendent' && dR(14).name === 'Transcendent');
      const starGlyph = /[★✦✧❖]/;   // ★ ✦ ✧ ❖
      check('rarity: no ★/✦/✧/❖ glyphs on any GRADE_TIER star field', GT.every((t) => !starGlyph.test(t.star || '')));
      check('rarity: no old tier names survive (Anomalous/Unique/Empyrean/Eternal/Omnipotent)',
        !GT.some((t) => /Anomalous|Unique|Empyrean|Eternal|Omnipotent/.test(t.name)));
      check('rarity: no ALL-CAPS rarity names', RV.every((t) => t.name !== t.name.toUpperCase()));
      // a real fauna grade renders with a clean word and no glyph
      const sg = H.speciesGrade(H.makeGenome(4242, 'fauna', 1));
      check('rarity: a rolled fauna grade has a clean name and no star glyph',
        typeof sg.name === 'string' && sg.name.length > 0 && !starGlyph.test(sg.star || '') && !starGlyph.test(sg.name));
    } else {
      check('rarity: Phase A hooks present (RARITY_V17/displayRarity/GRADE_TIERS)', false);
    }

    // ======= v1.7 PHASE B (step 5a) — the 47-material data model =======
    // fp-SAFE foundation: MATERIALS is metadata only, NOT wired into veins yet.
    if (H && H.MATERIALS && H.MAT_FAMILY && H.matName && H.matBaseTier) {
      const M = H.MATERIALS, keys = Object.keys(M);
      check('materials: the roster is the full 47', keys.length === 47);
      const fams = { base: 15, volatile: 13, precious: 10, exotic: 2, cosmic: 7 };
      check('materials: family counts are 15/13/10/2/7',
        Object.keys(fams).every((f) => keys.filter((k) => M[k].fam === f).length === fams[f]));
      check('materials: every family is a known MAT_FAMILY',
        keys.every((k) => !!H.MAT_FAMILY[M[k].fam]));
      check('materials: every base tier is in 0..9',
        keys.every((k) => Number.isInteger(M[k].tier) && M[k].tier >= 0 && M[k].tier <= 9));
      check('materials: every material carries a job and a class',
        keys.every((k) => M[k].job && M[k].cls && ['raw', 'energy', 'catalyst', 'component'].includes(M[k].cls)));
      // the 40 legacy materials are exactly the non-cosmic set, and each keeps
      // its ELEM_NAME (single-sourced — no duplicated names)
      const legacy = keys.filter((k) => M[k].fam !== 'cosmic');
      check('materials: 40 legacy materials all resolve their ELEM_NAME',
        legacy.length === 40 && legacy.every((k) => H.ELEM_NAME[k] && H.matName(k) === H.ELEM_NAME[k]));
      // the 7 cosmics are DEFINED but NOT yet mineable (fp-safe): none appear in
      // any DEPOSIT_PROFILE or RARE_VEIN, so no world can generate them yet
      const cosmic = keys.filter((k) => M[k].fam === 'cosmic');
      check('materials: 7 cosmics defined, tier >= 7, with their own name+color',
        cosmic.length === 7 && cosmic.every((k) => M[k].tier >= 7 && M[k].name && M[k].col && H.matName(k) === M[k].name));
      const inProfiles = new Set([].concat(...Object.values(H.DEPOSIT_PROFILES || {}), H.RARE_VEIN || []));
      check('materials: cosmics are NOT vein-placed yet (no generation, fp-safe)',
        cosmic.every((k) => !inProfiles.has(k)));
      // the cosmic symbols never collide with a legacy symbol
      check('materials: cosmic symbols are all distinct from the legacy 40',
        cosmic.every((k) => !H.ELEM_NAME[k]));
      // the material detail card reads family + role from the registry (fp-safe
      // UI surfacing; rarity is deliberately NOT shown yet). Renders even at 0 held.
      if (H.openItemCard && H.closeItemCard) {
        H.openItemCard({ mat: 'Fe' });
        const mc = doc.getElementById('itemcard');
        check('materials: the detail card surfaces family + role (Iron)',
          visible(mc) && /Base & structural/.test(mc.textContent) && /Role/.test(mc.textContent) && /structural spine/.test(mc.textContent));
        check('materials: the card shows the substance base grade (Iron = Common, tier 0)',
          /Base grade/.test(mc.textContent) && new RegExp(H.displayRarity(H.matBaseTier('Fe')).name).test(mc.textContent));
        H.closeItemCard();
        // a precious material reads a higher base grade than a base one
        H.openItemCard({ mat: 'Au' });
        check('materials: Gold (tier 2) reads a higher base grade than Iron',
          new RegExp(H.displayRarity(H.matBaseTier('Au')).name).test(doc.getElementById('itemcard').textContent) && H.matBaseTier('Au') > H.matBaseTier('Fe'));
        H.closeItemCard();
        check('materials: closing the material card leaves it hidden', !visible(mc));
      }
      // ===== v1.7 Phase B (5c) — world-cosmic veins (tier-gated, fp-safe) =====
      if (H.cosmicVeinFor && H.depositsFor) {
        const seeds = [];
        for (let s = 1; s <= 500; s++) seeds.push(s * 1013 + 7);
        // below Primordial (tier < 8): never a cosmic vein — this is what keeps
        // every existing world byte-identical (depositsFor untouched, no extra roll)
        check('cosmics 5c: no world below tier 8 yields a cosmic vein',
          seeds.every((s) => [0, 1, 2, 3, 4, 5, 6, 7].every((t) => H.cosmicVeinFor(s, t) === null)));
        const t8 = seeds.map((s) => H.cosmicVeinFor(s, 8)).filter(Boolean);
        const t9 = seeds.map((s) => H.cosmicVeinFor(s, 9)).filter(Boolean);
        check('cosmics 5c: tier-8 (Primordial) worlds carry foundational cosmics only (Pro/Pri)',
          t8.length > 0 && t8.every((k) => k === 'Pro' || k === 'Pri'));
        check('cosmics 5c: tier-9 (Transcendent) worlds unlock reality-breaking cosmics (Voe/Chr/Dkm)',
          t9.some((k) => k === 'Voe' || k === 'Chr' || k === 'Dkm'));
        check('cosmics 5c: every cosmic-vein symbol is a cosmic-family material',
          t8.concat(t9).every((k) => H.MATERIALS[k] && H.MATERIALS[k].fam === 'cosmic'));
        check('cosmics 5c: cosmicVeinFor is deterministic (same seed+tier → same result)',
          seeds.slice(0, 80).every((s) => H.cosmicVeinFor(s, 9) === H.cosmicVeinFor(s, 9)));
        // the cosmic never enters depositsFor's uniform pool (that is why the
        // fingerprint holds and mining stays balanced — it's a separate rare vein)
        check('cosmics 5c: depositsFor never contains a cosmic (fp-safe separate vein)',
          seeds.slice(0, 120).every((s) => H.depositsFor(s, 'rocky', 12).every((k) => !H.MATERIALS[k] || H.MATERIALS[k].fam !== 'cosmic')));
        // the cargo load filter now accepts every material (so mined cosmics
        // persist) without dropping any key it used to accept
        check('cosmics 5c: every legacy ELEM_NAME key is still a valid MATERIALS key (load filter safe)',
          Object.keys(H.ELEM_NAME).every((k) => !!H.MATERIALS[k]));
      }
    } else {
      check('materials: Phase B 5a hooks present (MATERIALS/MAT_FAMILY/matName/matBaseTier)', false);
    }
    check('intro name prompt shown for fresh expedition', visible(doc.getElementById('namebox')));

    // ============ FIELD TRAINING — full 20-step drive ============
    type(doc.getElementById('namein'), 'SmokeTester');
    click(doc.getElementById('nameok'));
    check('name accepted, intro closed', !visible(doc.getElementById('namebox')));

    // fresh expedition: latest bulletin FIRST, then training
    const relFresh = doc.getElementById('relbox');
    check('fresh expedition: latest bulletin shows before training', await until(() =>
      visible(relFresh) && relFresh.textContent.includes('The Living Frontier')
      && relFresh.textContent.includes('v1.6'), 4000, 'fresh bulletin'));
    // v1.6 opens a fresh minor line — the bulletin shows it alone, and
    // no other line (1.5.x, 1.4.x, 1.3.x, 1.2.x, 1.1.x, 1.0) may leak in
    check('bulletin shows the v1.6 line alone (no 1.5/1.4/1.3.x leak)',
      !relFresh.textContent.includes('The Titan Hunt') && !relFresh.textContent.includes('The Mirror Polish')
      && !relFresh.textContent.includes('Fresh Start')
      && !relFresh.textContent.includes('The Ascent') && !relFresh.textContent.includes('The HD Frontier')
      && !relFresh.textContent.includes('Kingdom Shelves')
      && !relFresh.textContent.includes('Ink & Ember') && !relFresh.textContent.includes('First Contact')
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
    // v1.3.9: during find-earth, tapping any OTHER world must do nothing
    {
      const wrong = H.picks.find((q) => q.data && q.data.P && q.data.P.seed !== 133);
      if (wrong) {
        const cvW = doc.getElementById('cosmos');
        const oW = { bubbles: true, cancelable: true, view: w, clientX: wrong.sx, clientY: wrong.sy, button: 0 };
        cvW.dispatchEvent(new w.MouseEvent('pointerdown', oW));
        cvW.dispatchEvent(new w.MouseEvent('pointerup', oW));
        cvW.dispatchEvent(new w.MouseEvent('click', oW));
        await sleep(250);
        check('training: tapping a non-lesson world locks nothing (still step 2)', tutAt(2));
      }
    }
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
    // v1.3.6: Earth keeps its true card — no biome re-label, no Biome row
    {
      const sub = doc.querySelector('#panel .sub');
      check('Earth is Earth — home never re-labels as a biome', !!sub
        && !/savanna|swamp|marsh|jungle|tundra|karst|salt|fungal|crystal/i.test(sub.textContent)
        && ![...doc.querySelectorAll('#panel .row .k')].some((k) => k.textContent === 'Biome'),
        sub && sub.textContent);
    }
    check('every world is tap-to-landable (Earth carries a plain Land button)',
      !!doc.querySelector('#panel [data-act="landcta"]'));
    // v1.3.7: the card answers only the lesson — Land must be inert here
    click(doc.querySelector('#panel [data-act="landcta"]'));
    await sleep(250);
    check('training: off-lesson card buttons are inert (Land does nothing at step 4)',
      H.st.mode !== 'surface' && tutAt(4));
    click(doc.querySelector('#panel [data-act="add"]'));
    check('adding Earth to Atlas completes step 4', await until(() => tutAt(5), 3000, 'step5'));
    check('Atlas count is 1 (Earth)', doc.getElementById('logcount').textContent === '1');
    // REGRESSION (v1.6.4): a returning player already has Earth in `landed`
    // (samples long since read). noteLanding(133) early-returns on a repeat
    // land, so the landfall event the land step waits on never fires — the
    // ring lights but Land "does nothing". Seed it BEFORE entering the land
    // step so the step's enter() (which un-lands home for the drill) is what
    // rescues it. A fresh boot never has 133 landed, which is why this was
    // invisible until a veteran hit it on device.
    H.landed.add(133);
    click(doc.getElementById('logbtn'));
    check('opening Atlas completes step 5', await until(() => tutAt(6), 3000, 'step6'));
    // v1.5.2c THE LANDING LESSON: press Land on Earth's card — home never
    // waves off, and Planetside (the vista) IS the lesson's payoff. It HOLDS
    // until you tap "to continue" (no auto-close timer — Nick: "the vista
    // still closes during training"), matching live play; #vistabox is in
    // TUT_ALWAYS so the tap lands mid-training.
    click(doc.querySelector('#panel [data-act="landcta"]'));
    check('landing on Earth completes the landing lesson', await until(() => tutAt(7), 3000, 'step7'));
    check('landing lesson: Planetside opened for the landing', visible(doc.getElementById('vistabox')));
    // the payoff holds — it does NOT auto-close on a timer (past the ghost-arm)
    await sleep(700);
    check('landing lesson: the vista holds until dismissed (no auto-close)', visible(doc.getElementById('vistabox')));
    // an armed tap dismisses it and yields the stage to the Compendium lesson
    click(doc.getElementById('vistabox'));
    check('landing lesson: tapping the vista dismisses it', await until(() =>
      !visible(doc.getElementById('vistabox')), 4000, 'vista dismiss'));
    check('training cache granted (6 specimens)', doc.getElementById('codexcount').textContent === '6');
    // training is toast-quiet: cache + rank-up land in the tray, never as pop-ups
    const tutToasts = [...doc.querySelectorAll('#toast .tst')].map((t) => t.textContent).join('|');
    check('training quiet: no Training Cache pop-up (tray-only)', !tutToasts.includes('Training Cache'), tutToasts);
    check('training quiet: no Rank Up fanfare mid-training', !tutToasts.includes('Rank Up'), tutToasts);
    check('training quiet: the bell tray still counts the story', visible(doc.getElementById('bellct'))
      && doc.getElementById('bellct').textContent !== '0');
    click(doc.getElementById('codexbtn'));
    check('opening Compendium completes step 6', await until(() => tutAt(8), 3000, 'step7'));
    check('kingdoms: filter chips stay hidden during training (one voice)',
      !doc.querySelector('#codex [data-ck]'));
    // v1.7 OPPOSITE-HALF DODGE (Nick): the Compendium lesson spotlights the
    // whole panel, so the guidance card must dock at the BOTTOM — clearing the
    // ✕/close toggle + list header up top that the top-pinned card used to block.
    check('training dodge: the Compendium lesson card docks at the bottom (clears the close)',
      await until(() => doc.getElementById('tutbox').classList.contains('dodge'), 1500, 'dodge'));

    // open a FAUNA specimen card (open its shelf first — v1.3.11 folds
    // realms onto themed display shelves, so find the card by opening
    // shelves rather than assuming the shelf name equals the realm)
    const fauna = [...H.codex.values()].filter((e) => e.kind === 'Fauna');
    check('cache holds 3 fauna + 3 flora', fauna.length === 3 && H.codex.size === 6);
    const openCard = (id) => {
      // each shelf toggle re-renders the codex, so re-query fresh nodes
      // every pass instead of iterating a stale list
      let guard = 0;
      while (!doc.querySelector('[data-pick="' + id + '"]') && guard++ < 20) {
        const grp = [...doc.querySelectorAll('#codex .cgrp')].find((g) => !g.classList.contains('open'));
        if (!grp) break;
        click(grp.querySelector('.cgh'));
      }
      click(doc.querySelector('[data-pick="' + id + '"]'));
    };
    openCard(fauna[0].id);
    check('opening a specimen completes step 7', await until(() => tutAt(9), 3000, 'step8'));
    // v1.5 specimen condense: field notes fold like the world card's groups
    const revFold = doc.getElementById('rev-fold');
    check('specimen condense: the field notes ship folded with a digest',
      !!revFold && !revFold.classList.contains('open')
      && (doc.getElementById('rev-fold-dig').textContent || '').length > 0);
    check('specimen condense: stats render ABOVE the fold',
      !!doc.getElementById('rev-stats').innerHTML
      && doc.getElementById('rev-stats').compareDocumentPosition(revFold) & 4);
    click(doc.getElementById('rev-fold-head'));
    check('specimen condense: the header unfolds the notes (card stays open)',
      revFold.classList.contains('open') && visible(doc.getElementById('reveal')));
    click(doc.getElementById('rev-info'));
    check('specimen condense: reading inside the fold never dismisses the card',
      visible(doc.getElementById('reveal')));
    click(doc.getElementById('rev-fold-head'));
    check('specimen condense: the toggle folds it back (remembered as cx bit 4)',
      !revFold.classList.contains('open') && (H.cardExpand & 4) === 0);
    // field scout (v1.2): every owned fauna card offers the toggle; it round-trips
    const scoutBtn = doc.getElementById('rev-scout');
    check('scout: fauna card offers the Field Scout toggle', !!scoutBtn && scoutBtn.textContent.includes('Scout'));
    click(scoutBtn);
    check('scout: toggling names the scout (state + button)',
      H.scoutId === fauna[0].id && doc.getElementById('rev-scout').textContent.includes('Scouting'));
    click(doc.getElementById('rev-scout'));
    check('scout: toggling again stands it down', H.scoutId === null);
    tutAct();                                                       // card tour -> feed
    check('step 9: feed', tutAt(10));

    click(doc.getElementById('rev-feed'));
    check('feed picker lists flora', await until(() => visible(doc.getElementById('pickbox')) && doc.querySelector('#pick-list [data-pk]'), 3000, 'feed picker'));
    click(doc.querySelector('#pick-list [data-pk]'));
    check('feeding completes step 9', await until(() => tutAt(11), 3000, 'step10'));
    click(doc.getElementById('pickclose'));

    // breed: same fauna card is still the open reveal
    click(doc.getElementById('rev-breed'));
    check('breed picker lists mates', await until(() => doc.querySelector('#pick-list [data-pk]'), 3000, 'breed picker'));
    click(doc.querySelector('#pick-list [data-pk]'));
    check('breeding completes step 10', await until(() => tutAt(12), 3000, 'step11'));
    check('rigged training breed succeeded', doc.getElementById('pick-result').textContent.includes('born'));
    click(doc.getElementById('pickclose'));

    tutAct();                                                       // begin training duel
    // v1.3.11: the chronicle can be skipped — the button appears while the
    // fight plays, and one tap prints the rest instantly (auto-play stays
    // the default; this also keeps the suite quick)
    check('v1.3.11: the duel offers a skip-to-outcome button', await until(() =>
      visible(doc.getElementById('duelbox')) && !!doc.getElementById('duelskip')
      && doc.getElementById('duelskip').style.display !== 'none', 8000, 'duel skip button'));
    click(doc.getElementById('duelskip'));
    check('training duel resolves and completes step 11', await until(() => tutAt(13), 25000, 'duel done'));
    // the duel RESULT modal is dismissed as the hazard lesson enters, so it no
    // longer lingers over the HP bar the step points at (Nick's screenshot)
    check('hazard step dismisses the lingering duel result', !visible(doc.getElementById('duelbox')));
    check('hazard nip lands (HP 85/100)', await until(() => doc.getElementById('hptext').textContent === '85/100 HP', 3000, 'hp 85'));
    tutAct();                                                       // hazard -> heal
    check('step 13: heal', tutAt(14));

    click(doc.getElementById('hpheart'));
    check('heal picker lists flora', await until(() => doc.querySelector('#pick-list [data-pk]'), 3000, 'heal picker'));
    click(doc.querySelector('#pick-list [data-pk]'));
    check('healing completes step 13', await until(() => tutAt(15), 3000, 'step14'));
    click(doc.getElementById('pickclose'));

    click(doc.getElementById('bell'));
    check('opening tray completes step 14', await until(() => tutAt(16), 3000, 'step15'));
    // v1.5 (Nick's live pass + review catch): the tray the lesson opened
    // gets a grace beat on screen — the recruit must SEE what they opened —
    // then yields before the search lesson needs the box beneath it
    check('tray gets its grace beat on screen (lesson not robbed of frames)',
      visible(doc.getElementById('tray')));
    // v1.5.2c (Nick): no timer closes it — it holds until the player acts.
    // Reaching for the search box IS the dismiss ('click through', not a clock).
    check('tray holds with no countdown while the recruit reads',
      visible(doc.getElementById('tray')));
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'e', bubbles: true }));
    check('tray yields on the next interaction, freeing the search box', await until(() =>
      !visible(doc.getElementById('tray')), 3000, 'tray click-through close'));
    type(doc.getElementById('searchin'), 'earth');
    check('searching earth completes step 15', await until(() => tutAt(17), 3000, 'step16'));
    // v1.7: the sheet step is now "look at this, then Got It" (like the survey/
    // specimen tours) — tapping the nameplate OPENS the sheet and leaves it open
    // so the recruit can explore it; a Got It tap advances. (It used to auto-
    // advance on open, which raced the forge step's closeSheet in one tap.)
    click(doc.getElementById('rank'));
    check('character sheet opens on the nameplate tap and stays open',
      visible(doc.getElementById('sheet')));
    tutAct();                                                       // Got It -> forge
    check('character sheet lesson completes step 16', await until(() => tutAt(18), 3000, 'step17'));
    // v1.5.1 THE FORGE LESSON: loaned ore appears, the recruit crafts an
    // Iron Plate through the real Fabricator. The forge step CLOSES the
    // character sheet on enter (it lingered over the Shipyard rail button the
    // step points at — Nick's forge-step lockup); the rail is now reachable.
    check('forge: the loaned ore opens the hold (cargo button + iron)',
      doc.getElementById('cargobtn').style.display === 'flex' && (H.cargo.get('Fe') || 0) >= 4);
    // the forge step closes the character sheet on enter so the Shipyard rail
    // button it points at is no longer buried under the sheet (Nick's lockup)
    check('forge: the character sheet is closed so the rail is reachable',
      !visible(doc.getElementById('sheet')));
    // v1.5.2b: the rail button IS the Shipyard
    click(doc.getElementById('cargobtn'));
    check('forge: the 🛠 Shipyard button opens the yard', await until(() =>
      doc.getElementById('yard').style.display === 'flex', 2000, 'yard opens'));
    await until(() => !!doc.querySelector('#yardbench [data-craft="plate"]'), 2000, 'fab group');
    click(doc.querySelector('#yardbench [data-craft="plate"]'));
    check('forge: crafting the plate completes step 17', await until(() => tutAt(19), 3000, 'step18'));
    check('forge: training craft credits NO charter and NO Ascent goal',
      !H.chDone.has('st-mine') && (H.ascProg['c1-part'] || 0) === 0);
    tutAct();                                                       // horizon -> finale (cleanup)
    check('finale reached', await until(() => tutAt(20), 3000, 'step19'));
    check('cleanup: Compendium empty', doc.getElementById('codexcount').textContent === '0');
    check('cleanup: HP fully restored', doc.getElementById('hptext').textContent === '100/100 HP');
    check('cleanup: the loaned ore + practice plate went back to the order',
      H.cargo.size === 0 && H.itemCount('plate') === 0);
    // v1.5.2c (Nick): the Shipyard rail button is ALWAYS present now (was
    // hidden until first cargo — it flickered off between lessons)
    check('the Shipyard button stands on the rail even with an empty hold',
      doc.getElementById('cargobtn').style.display === 'flex');
    check('cleanup: Atlas keeps only Earth', doc.getElementById('logcount').textContent === '1' && H.logMap.has('p133'));
    tutAct();                                                       // begin the expedition
    check('tutorial closes', await until(() => !visible(doc.getElementById('tutbox')), 2000, 'tut close'));
    // v1.5 quest notifications: the heartbeat knows the next goal the
    // moment training ends — chapter 1 of the Ascent, never twice per goal
    const nsg = H.nextStepGoal && H.nextStepGoal();
    check('quest nudge: next-step goal names the Ascent chapter-1 goal',
      !!nsg && /asc:c1-/.test(nsg.key) && /Next Step/.test(nsg.tt) && nsg.ms.length > 10, nsg && nsg.key);
    const cdxWasOpen = visible(doc.getElementById('codex'));
    click(doc.getElementById('codexbtn'));
    check('lockdown lifted after training', visible(doc.getElementById('codex')) !== cdxWasOpen);
    if (visible(doc.getElementById('codex'))) click(doc.getElementById('codexbtn'));

    // ============ PANEL MANAGER: one panel at a time (v1.3.5) ============
    const tapOutside = () => doc.body.dispatchEvent(new w.Event('pointerdown', { bubbles: true }));
    click(doc.getElementById('codexbtn'));
    check('panelman: Compendium opens', visible(doc.getElementById('codex')));
    click(doc.getElementById('logbtn'));
    check('panelman: opening Atlas closes Compendium', visible(doc.getElementById('log'))
      && !visible(doc.getElementById('codex')));
    check('panelman: Atlas wears a corner ✕', await until(() =>
      !!doc.querySelector('#log [data-pnx="log"]'), 1000, 'atlas x'));   // ✕ seats a microtask after render
    click(doc.querySelector('#log [data-pnx="log"]'));
    check('panelman: ✕ closes the Atlas', !visible(doc.getElementById('log')));
    click(doc.getElementById('chbtn'));
    click(doc.getElementById('codexbtn'));
    check('panelman: Compendium closes Charters (a pair that used to stack)',
      visible(doc.getElementById('codex')) && !visible(doc.getElementById('chpanel')));
    tapOutside();
    check('panelman: tapping empty space closes the open panel', !visible(doc.getElementById('codex')));
    // v1.5: Cosmic Events + Traveler's Beacon are hidden for rework — the
    // buttons are display:none and their engines refuse even synthetic taps
    click(doc.getElementById('eventsbtn'));
    click(doc.getElementById('dailybtn'));
    check('dormant systems: events + beacon refuse to open (hidden for rework)',
      !visible(doc.getElementById('events'))
      && doc.getElementById('eventsbtn').style.display !== 'block');
    click(doc.getElementById('setbtn'));
    check('panelman: settings panel opens with its ✕', visible(doc.getElementById('setpanel'))
      && !!doc.querySelector('#setpanel [data-pnx="set"]'));
    click(doc.querySelector('#setpanel [data-pnx="set"]'));
    check('panelman: settings ✕ closes settings', !visible(doc.getElementById('setpanel')));
    await sleep(600);   // a pointerdown suppresses focus-tooltips for 500ms (by design) — let it lapse

    // ============ v1.3.6: STAR CHARTS + EARTH'S TRUE CARD ============
    click(doc.getElementById('setbtn'));
    const chOpt = doc.getElementById('chartopt');
    check('star charts: setting exists and ships OFF', !!chOpt && chOpt.textContent === 'Off'
      && !chOpt.classList.contains('on'));
    click(chOpt);
    check('star charts: toggles On', chOpt.textContent === 'On' && chOpt.classList.contains('on'));
    click(chOpt);
    check('star charts: toggles back Off', chOpt.textContent === 'Off');
    click(doc.getElementById('setbtn'));

    // ============ GUIDE TO THE UNIVERSE ============
    click(doc.getElementById('helpbtn'));
    check('? popover shows version + guide link', visible(doc.getElementById('helppop')));
    // v1.3.11: a tap on empty space closes the ? popover (it lives outside
    // the panel manager, so it needs — and now has — its own closer)
    doc.getElementById('cosmos').dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, cancelable: true, view: w }));
    check('v1.3.11: outside tap closes the ? popover', await until(() =>
      !visible(doc.getElementById('helppop')), 3000, 'helppop outside close'));
    click(doc.getElementById('helpbtn'));
    check('? popover reopens after the outside-tap close', visible(doc.getElementById('helppop')));
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
    check('guide footer shows version + build', gc && gc.textContent.includes('v1.6') && gc.textContent.includes('dev') && gc.classList.contains('gcredit-link'));
    click(gc);
    const relbox = doc.getElementById('relbox');
    check('footer opens cumulative release notes (all versions)', visible(relbox)
      && relbox.textContent.includes('The Frontier Opens')
      && doc.getElementById('relok').textContent === 'Close');
    click(doc.getElementById('relok'));
    check('release notes close', !visible(relbox));

    click(doc.getElementById('guideok'));
    check('guide closes via Continue', !visible(gbox));

    // ====== BINDER (CF16-P2-001: renderBinder read ABILITY_THEMES from outer scope -> ReferenceError crash) ======
    click(doc.getElementById('codexbtn'));
    check('Compendium opens (post-training)', visible(doc.getElementById('codex')));
    const binderTab = doc.querySelector('#codex [data-cvw="binder"]');
    if (binderTab) click(binderTab);
    check('Binder view renders without throwing (ABILITY_THEMES now exported)',
      !!doc.querySelector('#codex .bgrid, #codex .bind-head'), errors.slice(0, 2).join(' | '));
    click(doc.getElementById('codexbtn'));
    check('Compendium closes after Binder', !visible(doc.getElementById('codex')));

    // ============ TOOLTIPS ============
    await sleep(600);   // the outside-tap pointerdown above suppresses focus-tooltips for 500ms (by design) — let it lapse
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
    // v1.7 PANEL-TINT (glass) slider — Settings → Graphics. Drives the --glass-a
    // CSS alpha every glass panel reads; clamped to a readable floor.
    const gsl = doc.getElementById('glassslider');
    const glassA = () => parseFloat(doc.documentElement.style.getPropertyValue('--glass-a')) || 0.72;
    check('settings: Panel-tint glass slider present at default 72', !!gsl && gsl.value === '72');
    gsl.value = '90'; gsl.dispatchEvent(new w.Event('input', { bubbles: true }));
    check('panel-tint slider drives --glass-a live (0.90)', Math.abs(glassA() - 0.90) < 1e-9, String(glassA()));
    gsl.value = '10'; gsl.dispatchEvent(new w.Event('input', { bubbles: true }));   // below floor
    check('panel-tint slider clamps to the readable floor (0.40)', Math.abs(glassA() - 0.40) < 1e-9, String(glassA()));
    gsl.value = '72'; gsl.dispatchEvent(new w.Event('input', { bubbles: true }));
    // v1.7 Forge: the new Gameplay tab + "Confirm before salvaging" toggle
    const gpTab = [...doc.querySelectorAll('#setpanel .stab')].find((t) => t.dataset.stab === 'p');
    check('settings: Gameplay tab present', !!gpTab);
    click(gpTab);
    const svOpt = doc.getElementById('salvageopt');
    check('gameplay: "Confirm before salvaging" toggle shows in the Gameplay group (default On)',
      !!svOpt && svOpt.textContent === 'On' && doc.querySelector('#setpanel .sgrp[data-sg="p"]').classList.contains('on'));
    click(svOpt);
    check('gameplay: the salvage-confirm toggle flips to Off', svOpt.textContent === 'Off' && !svOpt.classList.contains('on'));
    click(svOpt);   // back to On (the guarded default)
    // (persistence of vol/rm is asserted on the pre-seeded boots below — this
    //  window is file:// / opaque-origin, so its localStorage is off limits)

    // ============ NAMEPLATE MENU (Settings → Nameplate: name + plate colour) ============
    // v1.5.2c: the nameplate editor (name + colour) lives in Settings now,
    // moved off the character sheet (settings panel is open from the checks above)
    click(doc.getElementById('nameplateopt'));            // open the Nameplate menu
    const pbox = doc.getElementById('platebox');
    check('Nameplate menu opens from Settings', visible(pbox));
    check('Nameplate menu carries the plate colour swatches', pbox.querySelectorAll('#np-plates .plate').length >= 2);
    check('Nameplate menu shows a live preview pill', !!pbox.querySelector('#np-preview'));
    // picking an unlocked colour applies it and marks the swatch selected
    // (the menu re-renders on pick, so re-query the fresh node)
    click(pbox.querySelector('#np-plates .plate[data-plate="0"]'));
    check('picking a plate colour selects it', (() => {
      const s0 = pbox.querySelector('#np-plates .plate[data-plate="0"]');
      const auto = pbox.querySelector('#np-plates .plate[data-plate="-1"]');
      return !!s0 && s0.classList.contains('sel') && auto && !auto.classList.contains('sel');
    })());
    click(doc.getElementById('np-rename'));               // open the rename dialog
    const nbox = doc.getElementById('namebox');
    check('Nameplate menu opens the naming dialog', visible(nbox)
      && nbox.textContent.includes('Change your explorer name'));
    check('rename dialog offers Cancel (initial naming never does)', visible(doc.getElementById('namecancel')));
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('Escape cancels the rename', !visible(nbox));
    check('cancel kept the old name', doc.getElementById('rank').textContent.includes('SmokeTester'));
    click(doc.getElementById('np-rename'));
    type(doc.getElementById('namein'), 'RenamedTester');
    click(doc.getElementById('nameok'));
    check('rename commits and the nameplate follows', !visible(nbox)
      && doc.getElementById('rank').textContent.includes('RenamedTester'));
    // the corner ✕ closes the menu too
    click(doc.getElementById('np-x'));
    check('the Nameplate menu ✕ closes it', !visible(pbox));
    // reopen and confirm Escape also closes it
    click(doc.getElementById('setbtn'));
    click(doc.getElementById('nameplateopt'));
    check('Nameplate menu reopens', visible(pbox));
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check('Escape closes the Nameplate menu', !visible(pbox));

    check('no errors after all interactions', errors.length === 0, errors.slice(0, 3).join(' | '));
    w.close();

    // ============ BOOT 2: v1.5 FRESH START — a legacy v1 save gets the farewell card, then begins anew ============
    const vet = boot((win) => {
      win.localStorage.setItem('cfcc_save_v1', JSON.stringify({ v: 4, me: 'Veteran', guide: 1, rn: '1.0',
        log: [{ id: 'p555', title: 'Old Haunt', sub: 'World', t: 1 }],
        conq: [[777, { t: 1, tier: 1 }]] }));
    });
    await sleep(1600);
    const vetH = vet.w.__PROBE_HOOK__;
    check('fresh start: the legacy v1 key is consumed at boot',
      vet.w.localStorage.getItem('cfcc_save_v1') === null);
    const fwb = vet.doc.getElementById('farewellbox');
    check('fresh start: the farewell card shows, addressed to the old explorer',
      !!fwb && fwb.textContent.includes('Farewell, Veteran')
      && fwb.textContent.includes('begins anew'));
    click2(fwb && fwb.querySelector('#farewellok'), vet.w);
    check('fresh start: the farewell dismisses', !vet.doc.getElementById('farewellbox'));
    check('fresh start: a NEW expedition waits beneath (name prompt, nothing skipped)',
      visible(vet.doc.getElementById('namebox')));
    check('fresh start: nothing carries over — no old worlds, no old flags, no old charters',
      !vetH.landed.has(555) && !vetH.conquered.has(777)
      && !vetH.contacted.has(555) && vetH.chDone.size === 0);
    check('fresh start: the Ascent is the canon opening (stage 0, chapter 1)',
      vetH.ascStage() === 0);
    check('fresh start: boots clean', vet.errors.length === 0, vet.errors.slice(0, 2).join(' | '));
    vet.w.close();

    // ============ BOOT 3: skip path still charts Earth ============
    const sk = boot();
    // pin the app-layer dice (descent + first contact) to success so the
    // flow below is deterministic; the wave-off path gets its own checks
    sk.w.Math.random = () => 0;
    await sleep(700);
    type(sk.doc.getElementById('namein'), 'Skipper', sk.w);
    click2(sk.doc.getElementById('nameok'), sk.w);
    await until(() => visible(sk.doc.getElementById('relbox')), 4000, 'skip: bulletin');
    click2(sk.doc.getElementById('relok'), sk.w);
    await until(() => visible(sk.doc.getElementById('tutbox')), 4000, 'skip: tutbox');
    click2(sk.doc.getElementById('tut-skip'), sk.w);
    check('skip shows confirm', sk.doc.getElementById('tutbox').textContent.includes('Skip training?'));
    click2(sk.doc.getElementById('tut-skip-no'), sk.w);
    check('Keep Training returns to step', sk.doc.getElementById('tutbox').textContent.includes('1 / 20'));
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
    // v1.5.2 PROGRESSIVE CHAINS: the board shows only the first link of
    // each chain — the trades spine (auto-accepted at training end) and
    // the Sol tour (awaiting its Accept). Later links stay hidden.
    check('charters: the board opens progressively — first links only', chp.style.display === 'block'
      && chp.textContent.includes('Accepted — in the field') && chp.textContent.includes('Make planetfall')
      && chp.textContent.includes('First footfall: Mercury') && !chp.textContent.includes('Conquer a world')
      && !chp.textContent.includes('The red neighbor'));
    check('charters: nothing is complete on a fresh expedition', skH.chDone.size === 0
      && skH.chacc.has('st-land') && !!chp.querySelector('[data-chacc="st-mercury"]'));
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
    // v1.7 DISCOVERY GATING: a world hides its grade until you LAND — from
    // orbit the Spectral row is only a teaser ("land to reveal"), never the
    // real rarity name/color (Nick: don't spoil whether a world is special).
    check('v1.7 gating: an unlanded world HIDES its grade from orbit (teaser only)',
      !!pan3.querySelector('.row.grade') && /land to reveal/i.test(pan3.textContent));
    // tap = orbital survey
    cv3.dispatchEvent(new sk.w.MouseEvent('pointerdown', dOpts));
    cv3.dispatchEvent(new sk.w.MouseEvent('pointerup', dOpts));
    cv3.dispatchEvent(new sk.w.MouseEvent('click', dOpts));
    const sawOrbital = await until(() => pan3.querySelector('.atlasrow') && pan3.textContent.includes('Procedural survey'), 4000, 'orbital card');
    // v1.5.2c THE BLOSSOM: orbit shows the environment SUMMARY LINE only —
    // the expandable fold belongs to the ground (asserted after landing)
    check('discovery: tapping locks the ORBITAL SURVEY (buttons + summary rows)', sawOrbital
      && !pan3.querySelector('[data-gtoggle="1"]')
      && pan3.textContent.includes('land for the full survey'));
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
      skH.st.mode === 'system' && skH.landed.has(dp.data.P.seed), 5000, 'planetfall'));
    check('v1.3.8: the view holds — landing never leaves the system view', skH.st.mode === 'system');
    check('HD vista: planetfall opens the landing panorama', await until(() =>
      sk.doc.getElementById('vistabox').style.display === 'flex', 5000, 'vista overlay'));
    // the dismiss ARMS 420ms after the show (ghost-click guard: the landing
    // tap's synthesized click must never dismiss the payoff it opened)
    click2(sk.doc.getElementById('vistabox'), sk.w);
    check('HD vista: the birth-tap does NOT dismiss (ghost-click guard)',
      sk.doc.getElementById('vistabox').style.display === 'flex');
    await new Promise((r) => setTimeout(r, 480));
    click2(sk.doc.getElementById('vistabox'), sk.w);
    check('HD vista: an armed tap dismisses the panorama (fade-out)', await until(() =>
      sk.doc.getElementById('vistabox').style.display === 'none', 4000, 'vista fade-out'));
    // B1: the art is no longer see-once — the surface card reopens it
    check('HD vista: the surface card offers a re-view', await until(() =>
      !!pan3.querySelector('[data-act="vista"]'), 4000, 'vista button'));
    // v1.7 DISCOVERY GATING (the reveal): now that we've landed, the same card
    // reveals the world's real grade — the teaser is gone and the Spectral row
    // carries the true rarity name/color.
    check('v1.7 gating: landing REVEALS the world grade (teaser gone)',
      !!pan3.querySelector('.row.grade') && !/land to reveal/i.test(pan3.textContent));
    click2(pan3.querySelector('[data-act="vista"]'), sk.w);
    check('HD vista: re-view reopens the panorama', await until(() =>
      sk.doc.getElementById('vistabox').style.display === 'flex', 4000, 'vista reopen'));
    check('HD vista: the postcard button rides the panorama', !!sk.doc.querySelector('#vistabox .vpc'));
    // v1.3.11: the vista is a windowed pop-up card — header, canvas, caption
    // and the corner X all live INSIDE the .vcard frame
    check('v1.3.11 vista window: the pop-up card frame wraps the art',
      !!sk.doc.querySelector('#vistabox .vcard canvas') && !!sk.doc.querySelector('#vistabox .vcard .vh'));
    check('v1.3.11 vista window: the X sits on the card, not the screen',
      !!sk.doc.querySelector('#vistabox .vcard .vxc'));
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
    // v1.3.5 Batch 3: the CLOUD DECK — gas giants stop being the one type
    // with no vista. Scene renders for every dressing the card can supply.
    for (const [nm, o] of [
      ['gas deck, amber day + ring + spot', { seed: 9101, hue: 30, spot: true, spotHue: 55, ring: true, moons: 3, tod: 'day', aurora: true, air: 0 }],
      ['gas deck, cyan night + drifters', { seed: 9102, hue: 200, spot: false, ring: false, moons: 6, tod: 'night', aurora: true, air: 2 }],
      ['gas deck, violet twilight', { seed: 9103, hue: 310, spot: true, spotHue: 285, ring: false, moons: 1, tod: 'twilight', aurora: false, air: 0 }],
    ]) {
      let cvS = null, err = null;
      try { cvS = skH._hdDeckScene(o); } catch (e) { err = e; }
      check('cloud deck renders: ' + nm, !err && !!cvS && cvS.width === 960 && cvS.height === 430, err && String(err));
    }
    // the wiring: showVistaBox must OPEN for a gas world now (was: early return)
    {
      const gasP = { type: 'gas', seed: 777001, hue: 210, spot: true, spotHue: 180, ring: true, moons: 5 };
      skH.showVistaBox(gasP, 'day', null, 'none', null, true, false, false, 'none', { air: 1 });
      const vb = sk.doc.getElementById('vistabox');
      check('gas giant planetfall opens the Cloud deck vista', vb.style.display === 'flex'
        && vb.textContent.includes('Cloud deck'), vb.textContent.slice(0, 60));
      await new Promise((r) => setTimeout(r, 480));   // outlive the ghost-click arming window
      click2(vb, sk.w);
      await until(() => vb.style.display === 'none', 4000, 'deck dismiss');
      check('cloud deck dismisses like every vista', vb.style.display === 'none');
    }
    // ============ v1.3.5 Batch 4: THE DESCENT ============
    {
      check('descent: confirm dialog exists in the DOM', !!sk.doc.getElementById('descbox'));
      const hpNum = () => parseInt(sk.doc.getElementById('hptext').textContent, 10);
      const fakePl = { P: { seed: 555001, type: 'lava', sizeMul: 1 }, orb: 140, name: 'Cinder' };
      const d0 = skH.descentFor(fakePl);
      check('descent: a lava world sits low on the ladder (5-35%, by biome)', d0.pct >= 5 && d0.pct <= 35,
        'pct=' + d0.pct + ' biome=' + (d0.biome && d0.biome.k));
      check('descent: grounded worlds are forever safe', skH.descentSafe(dp.data.P.seed) === true);
      // wave-off: force the dice cold
      sk.w.Math.random = () => 0.999;
      const hp0 = hpNum();
      const r1 = skH._descRoll(fakePl);
      check('descent: a cold roll waves off', r1 === false);
      check('descent: the wave-off scrapes the explorer (never lethal)', hpNum() < hp0 && hpNum() >= 1,
        hp0 + '->' + hpNum());
      check('descent: the pity ramp remembers the attempt', skH._waveOffs.get(555001) === 1);
      const d1 = skH.descentFor(fakePl);
      check('descent: +20% after a wave-off', d1.pct >= d0.pct + 20 - 5 && d1.pct <= d0.pct + 20,
        d0.pct + '->' + d1.pct);
      // climb the whole ramp — at 100% even the coldest dice land
      // (an active ash storm holds −5, so the top can take one extra rung)
      let landedAt = 0;
      for (let dive = 2; dive <= 7 && !landedAt; dive++) if (skH._descRoll(fakePl)) landedAt = dive;
      check('descent: the ramp tops out — cold dice land by the sixth dive', landedAt > 0 && landedAt <= 6,
        'landed at dive ' + landedAt);
      check('descent: success clears the ramp', !skH._waveOffs.get(555001));
      check('descent: a cleared world reads safe (the dive is spent on landing)', skH.descentSafe(555001) === true);
      sk.w.Math.random = () => 0;   // back to warm dice for the flows below
    }
    // ============ v1.3.10: COMPENDIUM KINGDOM SHELVES ============
    {
      // seed one flora + one fauna from a real roster, then drive the filter
      const ros = skH.planetSpecies({ type: 'terran', seed: 777444 }, null, 'temperate', 'complex');
      const fl = ros.find((g) => g.kingdom === 'flora'), fa = ros.find((g) => g.kingdom === 'fauna');
      skH._storeSpecies(fl, 'Smoke Meadow', null);
      skH._storeSpecies(fa, 'Smoke Meadow', null);
      click2(sk.doc.getElementById('codexbtn'), sk.w);
      const cx = sk.doc.getElementById('codex');
      check('kingdoms: the filter chips render for a stocked Compendium',
        !!cx.querySelector('[data-ck="Flora"]') && !!cx.querySelector('[data-ck="Fauna"]'));
      check('kingdoms: shelf headers wear their kingdom tint',
        !!cx.querySelector('.cgh.kg-flora') && !!cx.querySelector('.cgh.kg-fauna'));
      click2(cx.querySelector('[data-ck="Flora"]'), sk.w);
      check('kingdoms: the Flora chip hides every animal shelf and lays plants open',
        !cx.querySelector('.cgh.kg-fauna') && !!cx.querySelector('.cgrp.open .cgh.kg-flora'),
        cx.textContent.slice(0, 80));
      check('kingdoms: the count line reads the filtered truth', /flora shown/.test(cx.textContent));
      click2(cx.querySelector('[data-ck="all"]'), sk.w);
      check('kingdoms: All restores the full shelves', !!cx.querySelector('.cgh.kg-fauna'));
      click2(sk.doc.getElementById('codexbtn'), sk.w);
    }
    // ============ v1.3.5 Batch 5a: BIOMES + EXTREMOPHILES ============
    {
      // deterministic: the same seed always wears the same biome
      const P1 = { type: 'terran', seed: 424001 };
      const b1 = skH.biomeFor(P1, 'temperate'), b2 = skH.biomeFor(P1, 'temperate');
      check('biomes: deterministic per seed', b1 && b2 && b1.k === b2.k, b1 && b1.k);
      // card-conditioned: a hot terran can never roll a wet biome
      let wetOnHot = 0;
      for (let s = 1; s < 400; s++) {
        const b = skH.biomeFor({ type: 'terran', seed: s * 7919 }, 'hot');
        if (b && (b.k === 'marsh' || b.k === 'swamp' || b.k === 'mangrove' || b.k === 'jungle' || b.k === 'temperate')) wetOnHot++;
      }
      check('biomes: "mostly evaporated" terrans never roll wet biomes', wetOnHot === 0, String(wetOnHot));
      // every type resolves to a biome for every band
      let holes = 0;
      for (const ty of ['terran', 'ocean', 'ice', 'desert', 'rocky', 'venus', 'lava', 'gas'])
        for (const bd of ['temperate', 'cold', 'hot', 'frozen'])
          for (let s = 1; s <= 40; s++) if (!skH.biomeFor({ type: ty, seed: s * 104729 }, bd)) holes++;
      check('biomes: 8 types × every band × 40 seeds — no holes', holes === 0, String(holes));
      // the extremophile slice: injected dice prove each hostile type can carry fauna
      const lvl = (ty, v, band2) => skH.biosphere({ type: ty, seed: 999999 }, null, band2 || 'hot', () => v).level;
      check('extremophiles: a magma world can carry fauna (1-in-10,000 slice)',
        /^Extremophile/.test(lvl('lava', 0.0003)));
      check('extremophiles: the slice is thin — 0.001 rolls plain microbes on lava',
        /^Microbial/.test(lvl('lava', 0.001)));
      check('extremophiles: ice, venus, gas, rocky, desert + hot oceans all have a slice',
        /^Extremophile/.test(lvl('ice', 0.005)) && /^Extremophile/.test(lvl('venus', 0.0005))
        && /^Extremophile/.test(lvl('gas', 0.002)) && /^Extremophile/.test(lvl('rocky', 0.002))
        && /^Extremophile/.test(lvl('desert', 0.61, 'temperate')) && /^Extremophile/.test(lvl('ocean', 0.005)));
      check('extremophiles: outside the slices nothing moved (lava 0.05 = microbial, ice 0.6+0.8 = none)',
        /^Microbial/.test(lvl('lava', 0.05)) && /^Airborne/.test(lvl('venus', 0.05)));
      // an xfauna world generates a real roster with at least one creature
      const roster = skH.planetSpecies({ type: 'lava', seed: 424242 }, null, 'hot', 'xfauna');
      check('extremophiles: an xfauna world raises at least one creature + its mats',
        roster.length >= 2 && roster.some((g) => g.kingdom === 'fauna'), 'roster=' + roster.length);
      // cross-pool breeding stays index-safe (G2): two extremophiles breed
      // true; a mixed pair falls back to the standard pools
      {
        const xa = { seed: 111, kingdom: 'fauna', color: 1, accent: 2, form: 1, body: 1, loco: 1, trait: 1, size: 2, habitat: 1, heat: 1, gen: 0, x: 1 };
        const xb = { seed: 222, kingdom: 'fauna', color: 3, accent: 4, form: 2, body: 2, loco: 2, trait: 2, size: 3, habitat: 2, heat: 1, gen: 0, x: 1 };
        const plain = { seed: 333, kingdom: 'fauna', color: 5, accent: 6, form: 3, body: 3, loco: 3, trait: 3, size: 1, habitat: 3, heat: 1, gen: 0 };
        const pure = skH.crossGenome(xa, xb), mixed = skH.crossGenome(xa, plain);
        check('breeding: two extremophiles breed a true extremophile', pure.x === 1);
        check('breeding: a mixed pair breeds back to the standard pools', !mixed.x);
        check('breeding: the child reads a valid habitat either way',
          typeof skH.habOf(pure) === 'string' && skH.habOf(pure).length > 0
          && typeof skH.habOf(mixed) === 'string' && skH.habOf(mixed).length > 0);
      }
      // the card wears the biome: the grounded world's sub-label + Biome row
      check('biomes: the survey card sub-label wears the biome', /world|giant/i.test(
        (pan3.querySelector('.sub') || {}).textContent || ''), (pan3.querySelector('.sub') || {}).textContent);
      check('biomes: the card speaks a Biome row', pan3.textContent.includes('Biome'));
    }
    // ============ v1.3.5 Batch 5b-i: BIOME SCENE SWEEP ============
    // every biome key must dress a scene without throwing, across pals
    {
      let bad = [];
      const allKeys = [];
      for (const ty in skH.BIOME_SETS) for (const b of skH.BIOME_SETS[ty]) allKeys.push([ty, b.k]);
      let sweepSeed = 7001;
      for (const [ty, k] of allKeys) {
        if (ty === 'gas') {
          for (const tod of ['day', 'night']) {
            try { const c2 = skH._hdDeckScene({ seed: sweepSeed++, hue: 120, spot: true, spotHue: 90, ring: true, moons: 2, tod, aurora: true, air: 1, wb: k }); if (!c2 || c2.width !== 960) bad.push(k + '/' + tod); }
            catch (e) { bad.push(k + '/' + tod + ':' + e.message); }
          }
        } else {
          for (const pal of ['day', 'night', 'snow']) {
            try { const c2 = skH.hdVista({ seed: sweepSeed++, era: 'none', pal, wb: k, moons: 1, flora: true }); if (!c2 || c2.width !== 960) bad.push(k + '/' + pal); }
            catch (e) { bad.push(k + '/' + pal + ':' + e.message); }
          }
        }
      }
      check('biome scenes: full key × pal sweep renders clean (' + allKeys.length + ' biomes)',
        bad.length === 0, bad.slice(0, 4).join(' | '));
    }
    // ============ v1.3.5 Batch 5b-ii: WEATHER EVENTS + WANDERERS + THE DEEP ============
    {
      const badE = [];
      for (const evt of ['tornado', 'hurricane', 'haboob', 'icestorm', 'cryoeruption', 'virga', 'volclightning', 'firewhirl', 'ironrain']) {
        try { const c3 = skH.hdVista({ seed: 6600 + badE.length, era: 'none', pal: 'day', wb: 'temperate', evt, flora: true, moons: 1 }); if (!c3) badE.push(evt); }
        catch (e) { badE.push(evt + ':' + e.message); }
      }
      check('weather events: all 9 showpieces render clean', badE.length === 0, badE.join('|'));
      check('weather events: the roll is honest — airless rocky worlds never get one',
        skH.wxEventFor({ type: 'rocky', seed: 42 }, 'cratered', null) === null);
      let cT = null, err2 = null;
      try { cT = skH.hdVista({ seed: 6700, era: 'none', pal: 'day', wb: 'savanna', titan: true, flora: true, herd: 2 }); } catch (e) { err2 = e; }
      check('colossal wanderer: a titan breaks the horizon without breaking the scene', !err2 && !!cT, err2 && String(err2));
      let cA = null, err3 = null;
      try { cA = skH._hdAbyssScene({ seed: 6800, aqua: 2 }); } catch (e) { err3 = e; }
      check('the deep: the abyssal vantage renders beneath the waves', !err3 && !!cA && cA.width === 960, err3 && String(err3));
    }
    check('discovery: standing on it, mining is open on the spot', await until(() =>
      !!pan3.querySelector('[data-act="mine"]') && pan3.textContent.includes('Ground-surveyed'), 4000, 'orbit mine'));
    check('discovery: the card BLOSSOMS on the ground (environment fold opens)',
      !!pan3.querySelector('[data-gtoggle="1"]'));
    check('discovery: ground survey reveals the mineral veins without Deep Scanners',
      pan3.textContent.includes('Mineral veins'));
    // the landing completed starter charter 1. The board CLOSED on the way
    // (v1.3.5 panel manager: canvas taps close panels — Nick's stacking fix),
    // so reopen it to read the ticks.
    if (!visible(chp)) click2(sk.doc.getElementById('chbtn'), sk.w);
    check('charters: Make planetfall completes on landing (auto-accepted at training end)', skH.chDone.has('st-land')
      && chp.textContent.includes('1 charter honored'));
    const chToasts1 = [...sk.doc.querySelectorAll('#toast .tst')].map((t) => t.textContent).join('|');
    check('charters: completion reveals the next link for its ACCEPT', chToasts1.includes('Charter Complete')
      && chToasts1.includes('Prospect a dead world'), chToasts1);
    check('MUD events: the charter toast wears the milestone gold tint', !!sk.doc.querySelector('#toast .tst.tk-gold'));
    // v1.5.2 ACCEPT-TO-ACTIVATE: the revealed link must be accepted before
    // it tracks — mine first WITHOUT accepting, prove no silent credit,
    // then accept (already-proven completes on the spot: S1's banked-state law)
    check('charters: the revealed link waits for its ACCEPT (no silent tracking)',
      !!chp.querySelector('[data-chacc="st-mine"]') && !skH.chDone.has('st-mine'));
    click2(pan3.querySelector('[data-act="mine"]'), sk.w);
    await until(() => (skH.stats && skH.stats.mines > 0) || true, 1500, 'first pull');
    check('charters: an unaccepted charter earns nothing from the deed', !skH.chDone.has('st-mine'));
    click2(chp.querySelector('[data-chacc="st-mine"]'), sk.w);
    check('charters: accept honors banked state — already-proven completes on the spot', await until(() =>
      skH.chDone.has('st-mine'), 4000, 'charter 2'));
    // cargo (v1.5.2b): the hold lives on the CHARACTER SHEET (rank opens it)
    click2(sk.doc.getElementById('rank'), sk.w);
    const cgEl = sk.doc.getElementById('cargo');
    check('cargo: the hold shows item tiles with element icons',
      cgEl.style.display === 'block' && cgEl.querySelectorAll('.slot img').length > 0
      // procedural data-URI icons — SVG in Classic, canvas PNG in HD (jsdom stubs the latter as 'data:,')
      && cgEl.querySelector('.slot img').src.startsWith('data:'));
    check('cargo: tiles carry quantities', !!cgEl.querySelector('.slot .qty'));
    // v1.5.2b: the hold is bags-only on the SHEET; the rail button is the Shipyard
    check('cargo: the hold shows Diablo bag slots (empty boxes included)',
      cgEl.querySelectorAll('.slot').length >= 24 && !!cgEl.querySelector('.slot.empty2'));
    click2(sk.doc.getElementById('cargobtn'), sk.w);
    check('shipyard: the 🛠 rail button opens the yard (sheet yields — one panel)',
      await until(() => sk.doc.getElementById('yard').style.display === 'flex', 2000, 'yard')
      && !visible(sk.doc.getElementById('sheet')));
    click2(sk.doc.querySelector('#yardbench [data-yt="bench"]'), sk.w);
    check('shipyard: the Research Bench lives on its own tab', await until(() =>
      sk.doc.getElementById('yardbench').textContent.includes('Deep Scanners'), 2000, 'bench tab'));
    click2(sk.doc.getElementById('rank'), sk.w);   // sheet replaces yard for the checks below
    // landing pays (v1.2): first footfall grants field samples + stardust
    const groundToasts = [...sk.doc.querySelectorAll('#toast .tst')].map((t) => t.textContent).join('|');
    check('discovery: first landing grants field samples (toast + stardust)',
      groundToasts.includes('Ground survey') && groundToasts.includes('Stardust'), groundToasts);
    check('MUD events: the samples toast wears the gain tint', !!sk.doc.querySelector('#toast .tst.tk-gain'));
    check('discovery: samples reach the Cargo hold (button appears)',
      sk.doc.getElementById('cargobtn').style.display === 'flex');
    // v1.3.8: we never left the system — the ground survey is read from orbit
    check('discovery: still in the system view after landing (the view holds)', skH.st.mode === 'system');
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

    // ============ v1.5.2b MINING: one press runs the drills ============
    skH.mineStop();   // the charter check above may have left a run alive — clean slate
    await sleep(120);
    const mines0 = skH.stats.mines;
    click2(pan3.querySelector('[data-act="mine"]'), sk.w);
    check('mining: the first press pulls immediately', await until(() =>
      skH.stats.mines >= mines0 + 1 && skH._mineRun && skH._mineRun.seed === dp.data.P.seed, 4000, 'first pull'),
      'mines=' + skH.stats.mines + ' vs0=' + mines0 + ' run=' + JSON.stringify(skH._mineRun && skH._mineRun.seed));
    check('mining: the drills keep pulling on their own (auto-run)', await until(() =>
      skH.stats.mines >= mines0 + 2, 4000, 'auto pull'));
    click2(pan3.querySelector('[data-act="mine"]'), sk.w);   // second press STOPS the run
    await until(() => !skH._mineRun, 2000, 'run stops');
    const minesStop = skH.stats.mines;
    await sleep(2000);
    check('mining: a second press stops the drills', !skH._mineRun && skH.stats.mines === minesStop);
    check('v1.4 mining: the card counts the pulls left in the veins', await until(() =>
      /pulls left/.test(pan3.textContent), 4000, 'pulls-left readout'));
    check('v1.4 mining: reserves are finite and deterministic',
      skH.reserveFor(dp.data.P.seed, 0) === skH.reserveFor(dp.data.P.seed, 0) && skH.reserveFor(dp.data.P.seed, 0) > 100);
    // the Sol lock: a fresh expedition reads stage 0 — Sol travels, nothing else does
    check('v1.4 Sol lock: a fresh expedition stands on ring 0', skH.ascStage() === 0);
    check('v1.4 Sol lock: Sol itself is always allowed',
      skH.ascAllows({ gal: { seed: 999 }, star: { x: 560, y: 170, seed: 424242 }, type: 'star' }));
    check('v1.4 Sol lock: another star in the home galaxy is gated',
      !skH.ascAllows({ gal: { seed: 999 }, star: { x: 900, y: -400, seed: 555 }, type: 'star' }));
    check('v1.4 Sol lock: foreign STARS are gated, galaxy sightseeing is not (curiosity stays free)',
      !skH.ascAllows({ gal: { seed: 777 }, star: { x: 1, y: 2, seed: 9 }, type: 'star' })
      && skH.ascAllows({ gal: { seed: 777 }, type: 'galaxy' }));
    // the chapter rides pinned atop the charter board
    if (!visible(chp)) click2(sk.doc.getElementById('chbtn'), sk.w);
    check('v1.4 Ascent: Chapter 1 pinned atop the charter board', chp.textContent.includes('Off the Rock')
      && !!chp.querySelector('.ascbox'));
    // the Fabricator: grant ore through the hook, craft a T1 part for real
    skH.cargo.set('Fe', 20); skH.cargo.set('Al', 12); skH.cargo.set('Si', 12);
    skH.craftItem('plate');
    check('v1.4 Fabricator: crafting consumes elements and yields the part',
      skH.itemCount('plate') === 1 && skH.cargo.get('Fe') === 16);
    check('v1.4 Ascent: crafting advances the chapter goal', (skH.ascProg['c1-part'] || 0) >= 1);
    if (sk.doc.getElementById('yard').style.display !== 'flex') click2(sk.doc.getElementById('cargobtn'), sk.w);
    await until(() => sk.doc.getElementById('yard').style.display === 'flex', 2000, 'yard for fab');
    click2(sk.doc.querySelector('#yardbench [data-yt="fab"]'), sk.w);   // the tab is remembered — pick fab explicitly
    const yb4 = sk.doc.getElementById('yardbench');
    check('v1.5.2 Fabricator: category folds list recipes with craft buttons (T1 open by default)',
      yb4.textContent.includes('Basic Parts') && yb4.textContent.includes('Ship Systems')
      && !!yb4.querySelector('.fabgrp.open [data-craft]'));
    // fold discipline: T2 ships closed, opens on its header
    click2(yb4.querySelector('.fabgrp[data-fg="comp"] .fghead'), sk.w);
    check('v1.5.2 Fabricator: a closed category opens on its header',
      !!sk.doc.querySelector('#yardbench .fabgrp[data-fg="comp"].open'));
    click2(sk.doc.getElementById('rank'), sk.w);   // sheet back (yard yields) for the paperdoll block
    // gear: craft the Mining Rig chain's first tool and see it socket + boost
    skH.cargo.set('H', 12); skH.cargo.set('O', 12); skH.cargo.set('Cr', 6);
    skH.craftItem('cell'); skH.craftItem('wire'); skH.craftItem('plate');
    skH.craftItem('servo');
    skH.craftItem('rig1');
    check('v1.4 gear: the Mining Rig crafts and self-equips into the empty Tool socket',
      skH.itemCount('rig1') === 1 && skH.equip.tool === 'rig1');
    check('v1.4 gear: the equipped rig multiplies mining yield', skH._equipBonus('yield') === 0.5);
    // v1.5 THE PATHFINDERS' TRAIL: relic blueprints gate on claimed Signatures
    check('trail: nine relics exist, one per socket, each tied to a Signature',
      skH.ITEMS.filter((it) => it.cat === 'relic').length === 9
      && new Set(skH.ITEMS.filter((it) => it.cat === 'relic').map((it) => it.slot)).size === 9);
    skH.cargo.set('Au', 8); skH.cargo.set('Pt', 4); skH.items.set('lens', 1);
    skH.craftItem('rl-star');
    check('trail: a relic refuses to forge before its Signature is claimed',
      skH.itemCount('rl-star') === 0 && !skH._canCraft(skH.ITEM_BY.get('rl-star')));
    skH.claimSignature('star', { title: 'Test Remnant', sub: 'star', tier: 6, hex: '#ffd96a', where: null }, true);
    skH.craftItem('rl-star');
    check('trail: the claimed Signature IS the blueprint (relic forges + self-equips)',
      skH.itemCount('rl-star') === 1 && skH.equip.helmet === 'rl-star');
    // v1.7 5d: the world-cosmics earn their job — each anchors one endgame piece
    check('cosmics 5d: five cosmic gear recipes exist, each defined by a world-cosmic',
      ['cg-proto', 'cg-genesis', 'cg-void', 'cg-chron', 'cg-dark'].every((id) => {
        const it = skH.ITEM_BY.get(id);
        return it && it.cat === 'gear' && Object.keys(it.cost).some((k) => skH.MATERIALS[k] && skH.MATERIALS[k].fam === 'cosmic');
      }));
    skH.cargo.set('Pro', 1); skH.cargo.set('Ti', 8); skH.cargo.set('W', 6); skH.items.set('hullseg', 2);
    skH.craftItem('cg-proto');
    check('cosmics 5d: a foundational cosmic forges its gear and consumes the cosmic',
      skH.itemCount('cg-proto') === 1 && (skH.cargo.get('Pro') || 0) === 0);
    check('cosmics 5d: the cosmic anchors the gear rarity (Protomatter → Primordial/8)',
      skH._itemRarity(skH.ITEM_BY.get('cg-proto')) === 8 && skH.displayRarity(8).name === 'Primordial');
    skH.cargo.set('Dkm', 1); skH.cargo.set('W', 8); skH.cargo.set('Ir', 4); skH.items.set('servo', 2);
    skH.craftItem('cg-dark');
    check('cosmics 5d: a reality-breaking cosmic anchors Transcendent gear (Dark Matter → 9)',
      skH.itemCount('cg-dark') === 1 && skH._itemRarity(skH.ITEM_BY.get('cg-dark')) === 9 && skH.displayRarity(9).name === 'Transcendent');
    check('cosmics 5d: the cosmic material knows what it crafts (§17 — every material has a job)',
      skH._matUses('Pro').uses.includes('Protomatter Carapace') && skH._matUses('Dkm').uses.includes('Dark Matter Bore'));
    // v1.5.2c THE ELEMENTAL TITANS: signatures are won by felling a named
    // titan, region-gated (basics near, Void/Prism far), seeded/shared
    skH.st.gal = { seed: 999, x: 90, y: -60, size: 78 };   // home galaxy (region 0)
    let fireWorld = null;
    for (let s = 1; s < 500 && !fireWorld; s++) { if (skH.titanFor({ planetSeed: s, ptype: 'lava' })) fireWorld = s; }
    check('titans: a Fire titan is seeded onto a molten world near home', fireWorld != null);
    check('titans: Void is region-gated far out — silent near home',
      skH.titanFor({ planetSeed: 7, ptype: 'rocky' }) === null && !skH.primeFill.void);
    if (fireWorld != null) {
      const nat = skH.apexNative({ planetSeed: fireWorld, ptype: 'lava', species: [] });
      check('titans: the titan is the world’s boss (apexNative, no native fauna needed)',
        !!nat && nat.titan === 'flame' && nat.guardian === true);
      // rebalanced (stage 3): a titan outguns even a summit champion
      // (~751 ceiling) but stays winnable for a bred team — not the old
      // unbeatable 1000+. A hard boss: above the ceiling, below runaway.
      const _tp = skH.battleStats(nat.genome).total;
      check('titans: a titan is a hard boss — above a summit champion, not unwinnable',
        _tp > 800 && _tp < 1000, 'titan power ' + _tp);
      // fell it → the element is claimed, and its titans stand down everywhere
      skH.claimSignature('flame', { title: 'Fire — test', sub: 'titan felled', tier: 14, hex: '#ffd96a', where: null }, true);
      check('titans: felling the titan claims its element',
        !!skH.primeFill.flame);
      check('titans: a claimed element’s titan stands down',
        skH.titanFor({ planetSeed: fireWorld, ptype: 'lava' }) === null);
    }
    // v1.5.2 THE RECORDS BOARD: trophies out of the mirror
    click2(sk.doc.getElementById('recbtn'), sk.w);
    const recEl = sk.doc.getElementById('records');
    check('records: 🏆 opens the board with the rarity ladder + achievement shelves',
      visible(recEl) && recEl.querySelectorAll('.tier').length === 10 && recEl.querySelectorAll('.agrp').length >= 5);   // v1.7: the ladder is the 10-tier universal rarity
    check('records: the character sheet no longer carries the trophies',
      !sk.doc.getElementById('stats').textContent.includes('Rarity ladder'));
    click2(sk.doc.getElementById('recbtn'), sk.w);
    check('records: the button toggles it closed', !visible(recEl));
    // v1.5 THE PAPERDOLL: one centered character screen — sockets ON the body
    if (visible(sk.doc.getElementById('sheet'))) click2(sk.doc.getElementById('rank'), sk.w);
    check('v1.5.2b sheet: the nameplate toggles the screen closed',
      !visible(sk.doc.getElementById('sheet')));
    click2(sk.doc.getElementById('rank'), sk.w);
    const shEl = sk.doc.getElementById('sheet');
    const dollEl4 = sk.doc.getElementById('doll');
    check('v1.5 sheet: the character screen opens centered with all three regions',
      visible(shEl) && sk.doc.getElementById('stats').style.display === 'block'
      && sk.doc.getElementById('cargo').style.display === 'block');
    check('v1.5 paperdoll: all nine sockets pin to the figure', await until(() =>
      dollEl4.querySelectorAll('[data-eqslot]').length === 9, 4000, 'eq sockets'));
    check('v1.5 paperdoll: the full-body painterly explorer fronts the screen',
      !!dollEl4.querySelector('.dollimg') && dollEl4.querySelector('.dollimg').src.startsWith('data:'));
    check('v1.5 paperdoll: sockets carry body anchors (inline positions)',
      /left:.*top:/.test(dollEl4.querySelector('[data-eqslot]').getAttribute('style') || ''));
    check('v1.5.2b: the ship is OFF the doll (it lives at the Shipyard) and the pack socket is worn',
      !dollEl4.querySelector('.dship') && !!dollEl4.querySelector('[data-eqslot="module"]'));
    check('v1.4 equipment: the effect readout speaks the boost', /mining yield/.test(dollEl4.textContent));
    // socket picker: tap the Tool socket, the candidates list opens on the doll
    click2(dollEl4.querySelector('[data-eqslot="tool"]'), sk.w);
    check('v1.5 paperdoll: tapping a socket opens its picker', await until(() =>
      !!dollEl4.querySelector('.eqpick [data-eqpick]'), 3000, 'eq picker'));
    click2(dollEl4.querySelector('[data-eqslot="tool"]'), sk.w);   // close the picker again
    // v1.6 THE ITEM CARD: tapping a crafted item in the hold opens its stat
    // card (effects + Equip button that slots it into its body socket)
    skH.items.set('visor', 1);
    click2(sk.doc.getElementById('rank'), sk.w);   // close sheet
    click2(sk.doc.getElementById('rank'), sk.w);   // reopen -> re-render the hold with the new item
    // v1.7 Forge: the hold is 3 tabs (Materials/Craftables/Gear) — the visor is gear
    const gearTab = [...sk.doc.querySelectorAll('#cargo [data-ivt]')].find((t) => t.dataset.ivt === 'gear');
    check('v1.7 inventory: the hold splits into Materials / Craftables / Gear tabs',
      sk.doc.querySelectorAll('#cargo [data-ivt]').length === 3 && !!gearTab);
    click2(gearTab, sk.w);
    const vtile = sk.doc.querySelector('#cargo [data-item="visor"]');
    check('v1.6 item card: crafted items are tappable tiles in the hold', !!vtile);
    click2(vtile, sk.w);
    const icard = sk.doc.getElementById('itemcard');
    check('v1.6 item card: tapping an item opens its stat card', icard.style.display !== 'none' && /Scout Visor/.test(icard.textContent));
    check('v1.6 item card: the card surfaces the item effect', /bioscan wounds/.test(icard.textContent));
    // v1.7 Forge: ARPG anatomy — rarity-frame header band + the Affixes fold
    check('v1.7 item window: rarity-frame header band + item level', !!icard.querySelector('.ic-band .ic-bname')
      && !!icard.querySelector('.card.framed') && /Item Lv/.test(icard.textContent));
    check('v1.7 gear-on-ladder: the item wears a true 10-tier rarity chip',
      !!icard.querySelector('.ic-chip.rar') && /Common|Uncommon|Notable|Rare|Exotic|Legendary|Mythic|Celestial|Primordial|Transcendent/.test(icard.querySelector('.ic-chip.rar').textContent));
    const afHead = icard.querySelector('[data-icfold]');
    check('v1.7 item window: the Affixes group uses the expand/close fold, open by default',
      !!afHead && /Affixes/.test(afHead.textContent) && !icard.querySelector('.ic-grp').classList.contains('folded'));
    click2(afHead, sk.w);
    check('v1.7 item window: tapping the fold collapses it (remembered via the shared cardExpand)',
      icard.querySelector('.ic-grp').classList.contains('folded'));
    click2(icard.querySelector('[data-icfold]'), sk.w);   // re-open so the salvage checks below see a stable card
    const eqbtn = icard.querySelector('[data-equipbtn="visor"]');
    check('v1.6 item card: wearables carry an Equip button', !!eqbtn);
    click2(eqbtn, sk.w);
    check('v1.6 item card: Equip slots the item into its socket', skH.equip.helmet === 'visor');
    // v1.7 Forge: the Salvage button + confirm guard + material return + card close
    const svbtn = icard.querySelector('[data-salvbtn="visor"]');
    check('v1.7 salvage: wearables carry a Salvage button beside Equip', !!svbtn);
    click2(svbtn, sk.w);
    check('v1.7 salvage: with the guard On, Salvage asks first (confirm prompt with a Salvage button)',
      !!icard.querySelector('[data-salvgo="visor"]') && /Salvage Scout Visor/i.test(icard.textContent));
    click2(icard.querySelector('[data-salvgo="visor"]'), sk.w);
    check('v1.7 salvage: confirming removes the item, unequips it, and closes the card',
      (skH.items.get('visor') || 0) === 0 && skH.equip.helmet !== 'visor' && icard.style.display === 'none');
    // v1.7 §21: the Materials tab groups the roster by family (base → volatile →
    // precious → exotic → cosmic). Seed three families and check their headers.
    skH.cargo.set('Fe', 9); skH.cargo.set('H2O', 4); skH.cargo.set('Au', 2);
    click2(sk.doc.getElementById('rank'), sk.w);   // close
    click2(sk.doc.getElementById('rank'), sk.w);   // reopen -> re-render the hold
    const matTab = [...sk.doc.querySelectorAll('#cargo [data-ivt]')].find((t) => t.dataset.ivt === 'mat');
    if (matTab) click2(matTab, sk.w);
    const matHeads = [...sk.doc.querySelectorAll('#cargo .chead')].map((h) => h.textContent);
    check('v1.7 §21: the Materials tab groups by family (base/volatile/precious headers)',
      matHeads.some((t) => /Base & structural/.test(t)) && matHeads.some((t) => /Volatiles & gases/.test(t)) && matHeads.some((t) => /Precious & tech/.test(t)));
    check('v1.7 §21: grouped material tiles still carry data-mat (tap-to-card intact)',
      !!sk.doc.querySelector('#cargo [data-mat="Fe"]') && !!sk.doc.querySelector('#cargo [data-mat="Au"]'));
    // v1.7 §21: the Craftables tab likewise groups by KIND (Basic Parts / Components)
    skH.items.set('plate', 2); skH.items.set('servo', 1);
    click2(sk.doc.getElementById('rank'), sk.w); click2(sk.doc.getElementById('rank'), sk.w);   // re-render the hold
    const craftTab = [...sk.doc.querySelectorAll('#cargo [data-ivt]')].find((t) => t.dataset.ivt === 'craft');
    if (craftTab) click2(craftTab, sk.w);
    const craftHeads = [...sk.doc.querySelectorAll('#cargo .chead')].map((h) => h.textContent);
    check('v1.7 §21: the Craftables tab groups by kind (Basic Parts + Components headers)',
      craftHeads.some((t) => /Basic Part/.test(t)) && craftHeads.some((t) => /Component/.test(t)));
    check('v1.7 §21: grouped craftable tiles still carry data-item (tap-to-card intact)',
      !!sk.doc.querySelector('#cargo [data-item="plate"]') && !!sk.doc.querySelector('#cargo [data-item="servo"]'));
    // ship systems ARE the ring keys: hand over the drives, watch the rings open
    skH.items.set('jumpdrive', 1);
    check('v1.4 rings: the Jump Drive opens the Neighborhood', skH.ascStage() === 1
      && skH.ascAllows({ gal: { seed: 999 }, star: { x: 620, y: 220, seed: 555 }, type: 'star' })
      && !skH.ascAllows({ gal: { seed: 999 }, star: { x: -900, y: 900, seed: 556 }, type: 'star' }));
    skH.items.set('array', 1);
    check('v1.4 rings: the Long-Range Array opens the whole galaxy', skH.ascStage() === 2
      && skH.ascAllows({ gal: { seed: 999 }, star: { x: -900, y: 900, seed: 556 }, type: 'star' })
      && !skH.ascAllows({ gal: { seed: 777 }, star: { x: 1, y: 2, seed: 9 }, type: 'star' }));
    skH.items.set('igdrive', 1);
    check('v1.4 rings: the Intergalactic Drive opens the dark between', skH.ascStage() === 3
      && skH.ascAllows({ gal: { seed: 777 }, star: { x: 1, y: 2, seed: 9 }, type: 'star' }));
    // v1.4.1 THE RING SPECTRUM: catalogued rarity is capped by where the
    // find lives — Legendary in the Neighborhood, Mythic in the home
    // galaxy, the summit only past the Near Field; unplaced (bred/import)
    // creatures are never capped
    check('ring spectrum: the Neighborhood caps at Legendary (5)',
      skH.gradeCapAt({ gal: { seed: 999 }, star: { x: 560, y: 170, seed: 424242 } }) === 5);
    check('ring spectrum: the home galaxy caps at Mythic (8)',
      skH.gradeCapAt({ gal: { seed: 999 }, star: { x: -900, y: 900, seed: 556 } }) === 8);
    check('ring spectrum: regions ladder to the summit (far = uncapped)',
      skH.gradeCapAt({ gal: { seed: 777, x: 92, y: -58 } }) === 9
      && skH.gradeCapAt({ gal: { seed: 777, x: 4000, y: 4000 } }) >= 12);
    check('ring spectrum: bred/imported creatures are never capped',
      skH.gradeCapAt(null) >= 12);
    // v1.4.1 regression lock: awardXP must reach levelOf (it lived un-exported
    // inside CombatCore — every victorious duel/conquest with a creature
    // champion threw and lost the win's spoils; 501/700 deep sims hit it)
    {
      const gX = skH.makeGenome(24681357, 'fauna', 0.4);
      const eX = skH._storeSpecies(gX, 'XP test', null);
      let xpOk = true;
      try { skH.awardXP(eX.id, 8); } catch (e) { xpOk = false; }
      check('victory XP: awardXP runs clean (levelOf exported)', xpOk && (eX.genome.xp || 0) >= 8);
      check('victory XP: levelOf math holds (6*l^2 — the v1.5 rebalance)',
      skH.levelOf({ xp: 54 }) === 3 && skH.levelOf({ xp: 216 }) === 6 && skH.levelOf({ xp: 0 }) === 0);
    }
    // worlds obey the ladder only for post-law expeditions (this sk boot is
    // a fresh one → on), and a high-tier designation clamps to the ring
    check('ring spectrum: every expedition ringlaws its worlds (no flag since the fresh start)',
      typeof skH._ringWorlds === 'undefined');
    {
      // a real ocean-ladder deep-spectrum designation ("Radiant Blue" = tier
      // 9 on SPECTRA.ocean) clamps to the ring in ITS OWN spectral language
      // ("Blue-Gold"), and the baked Spectral-class row rewrites with it
      const fakeD = { designation: { tier: 9, name: 'Celestial', hex: '#a8c8ff', label: 'Radiant Blue' },
        rows: [['Spectral class', 'Radiant Blue — Celestial', 'grade']],
        where: { gal: { seed: 999 }, star: { x: 560, y: 170, seed: 424242 } }, planetSeed: 555 };
      skH.ringDesignation(fakeD);
      check('ring spectrum: a deep-spectrum WORLD near home clamps in its own spectral language',
        fakeD.designation.tier === 5 && fakeD.designation.label === 'Blue-Gold');
      check('ring spectrum: the Spectral-class card row speaks the clamped designation',
        fakeD.rows[0][1] === 'Blue-Gold — Legendary');
    }
    {
      // a forced high-tier genome catalogued in the Neighborhood clamps to 5;
      // guardians (apex) sail past the law
      const gG = skH.makeGenome(987654, 'fauna', 0.5);
      const near = { gal: { seed: 999 }, star: { x: 560, y: 170, seed: 424242 } };
      const fake = { tier: 9, name: 'Celestial', hex: '#a8c8ff' };
      const clamped = skH.ringGrade(gG, fake, near);
      check('ring spectrum: a deep-spectrum roll near home wears Legendary', clamped && clamped.tier === 5);
      gG.apex = 12;
      const kept = skH.ringGrade(gG, fake, near);
      check('ring spectrum: an Apex Guardian keeps its summit crown', kept && kept.tier === 9);
    }
    check('skip: boots clean', sk.errors.length === 0, sk.errors.slice(0, 2).join(' | '));
    sk.w.close();

    // ============ BOOT 4: half-finished training saved in deep space resumes AT SOL ============
    const ds = boot((win) => {
      win.localStorage.setItem('cfcc_save_v2', JSON.stringify({
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
