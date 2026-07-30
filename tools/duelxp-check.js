// ROUND 8 CF1805-02 — an OUTCOME test for the duel rewards.
//
// The external round's standing recommendation, made five times: "every reward
// the Guide advertises deserves a test that asserts the XP ARRIVED, not that the
// code path ran." smoke.js had a duel-XP check, and it called awardXP() directly
// — so it stayed green through every build in which the friendly duel paid
// nothing at all. This drives the real flow and reads the ledger afterwards.
//
// Usage: node tools/duelxp-check.js [--src=<html>]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');
const { makeFake2D } = require('./fake2d.js');

const root = path.join(__dirname, '..');
const srcArg = process.argv.find((a) => a.startsWith('--src='));
const src = srcArg ? srcArg.slice(6) : path.join(root, 'celestial-frontier.html');
const probe = path.join(__dirname, 'probe-duelxp.html');
execFileSync(process.execPath, [path.join(__dirname, 'make-probe-build.js'), src, probe], { stdio: 'pipe' });
const html = fs.readFileSync(probe, 'utf8');

let pass = 0; const fails = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fails.push(name); console.log('FAIL  ' + name + (detail ? '  (' + detail + ')' : '')); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { if (fn()) return true; } catch (_) { } await sleep(25); }
  console.log('       timeout waiting for ' + what);
  return false;
}

(async () => {
  const errs = [];
  const vcon = new VirtualConsole();
  vcon.on('jsdomError', (e) => errs.push('jsdomError: ' + (e && e.message)));
  vcon.on('error', (...a) => errs.push('console.error: ' + a.map(String).join(' ')));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://game.local/celestial-frontier.html', virtualConsole: vcon,
    beforeParse(window) {
      const proto = window.HTMLCanvasElement.prototype;
      proto.getContext = function (k) {
        if (k !== '2d') return null;
        if (!this.__fake2d) this.__fake2d = makeFake2D(this);
        return this.__fake2d;
      };
      proto.toDataURL = () => 'data:image/png;base64,';
      window.localStorage.setItem('cfcc_save_v2', JSON.stringify({ tut: 'done', name: 'Probe' }));
      window.addEventListener('error', (ev) => errs.push('window.onerror: ' + (ev.message || String(ev.error))));
    },
  });
  const w = dom.window, doc = w.document;
  const click = (el) => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, view: w }));

  if (!await until(() => w.__PROBE_HOOK__ && w.__PROBE_HOOK__.tutDone === true, 15000, 'boot')) {
    console.log('BOOT FAILED — ' + errs.slice(0, 3).join(' | ')); process.exit(2);
  }
  const H = w.__PROBE_HOOK__;

  // A catalogued champion, and a challenger that is guaranteed to LOSE, so the
  // +8 "a duel won" is the award under test. Power is stacked hard enough that
  // the deterministic sim cannot go the other way.
  const mineG = H.makeGenome(4242, 'fauna', 1);
  mineG.brood = 200; mineG.fed = 200;
  const theirsG = H.makeGenome(99, 'fauna', 0);
  theirsG.size = 0;
  const entry = H._storeSpecies(mineG, 'Champion', null);
  check('probe: the champion is catalogued', !!entry && H.codex.has(entry.id));
  const before = (H.codex.get(entry.id).genome.xp) || 0;

  // Drive the REAL friendly-duel flow: the arena's own load + fight buttons.
  H.startDuelWithCode({ name: 'Champion', genome: mineG });
  const codeEl = doc.getElementById('duelcode');
  codeEl.value = H.encodeCreature({ name: 'Challenger', genome: theirsG });
  click(doc.getElementById('duelload'));
  check('the challenger code loads into the arena',
    doc.getElementById('duelfight').style.display !== 'none');
  click(doc.getElementById('duelfight'));
  const skip = doc.getElementById('duelskip');
  await until(() => skip && skip.style.display !== 'none', 8000, 'skip button');
  click(skip);
  await until(() => (H.stats.duels || 0) > 0, 15000, 'duel resolves');

  const after = (H.codex.get(entry.id).genome.xp) || 0;
  check('CF1805-02: the duel actually resolved', (H.stats.duels || 0) > 0,
    'duels=' + H.stats.duels);
  check('CF1805-02: a duel WIN was credited to the ledger', (H.stats.duelwins || 0) > 0,
    'duelwins=' + H.stats.duelwins);
  // The assertion five rounds of testing never made.
  check('CF1805-02: the +8 duel win PAID XP to the champion', after >= before + 8,
    'xp ' + before + ' -> ' + after);
  check('boot stayed clean', errs.length === 0, errs.slice(0, 2).join(' | '));

  try { fs.unlinkSync(probe); } catch (_) { }
  console.log('\n' + pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
})();
