// Functional systems check: boots the probe build and exercises the core
// game systems end-to-end — classes/levels, breeding inheritance, import
// hardening, guardians, duels. Complements smoke.js (UI flows) and
// balance-sim.js (combat fairness).
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, 'probe-build.html'), 'utf8');
const { installFakeCanvas } = require('./fake2d.js');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w){ installFakeCanvas(w); }});
setTimeout(() => {
  const H = dom.window.__PROBE_HOOK__;
  if (!H) { console.error('no hook'); process.exit(1); }
  const { makeGenome, crossGenome, normGenome, battleStats, runDuel, abilityOf, speciesGrade, guardianFor } = H;
  let pass = 0, fail = 0;
  const ok = (name, cond, detail) => { if (cond) { pass++; console.log('PASS  ' + name); } else { fail++; console.log('FAIL  ' + name + (detail ? '  -- ' + detail : '')); } };

  // classes & levels
  const g = makeGenome(777001, 'fauna', 1);
  const S0 = battleStats(g);
  ok('fauna gets a class at level 0', !!S0.cls && S0.lvl === 0, JSON.stringify({cls:S0.cls, lvl:S0.lvl}));
  // v1.5 balance: thresholds are 6*l^2 (L3=54, L6=216) — tuned by the
  // 240-run leveling sim (12*l^2 left the class system unreachable)
  const g3 = Object.assign({}, g, { xp: 60 });    // sqrt(60/6)=3.16 -> lvl 3
  const g6 = Object.assign({}, g, { xp: 225 });   // sqrt(37.5)=6.1  -> lvl 6
  ok('xp 60 -> level 3 (6*l^2 thresholds)', battleStats(g3).lvl === 3, 'got ' + battleStats(g3).lvl);
  ok('xp 225 -> level 6', battleStats(g6).lvl === 6, 'got ' + battleStats(g6).lvl);
  ok('levels never change raw stats', ['vit','fer','res','agi','ins'].every(k => battleStats(g3)[k] === S0[k]),
     'stat drift detected');
  ok('flora gets no class', !battleStats(makeGenome(777002, 'flora', 1)).cls);

  // breeding: child fresh, lineage flags stripped, generations advance
  const p1 = makeGenome(801, 'fauna', 1), p2 = makeGenome(802, 'fauna', 1);
  p1.xp = 400; p1.hurt = 0.4;
  const child = crossGenome(p1, p2);
  ok('child inherits no xp/hurt/apex', child.xp === undefined && child.hurt === undefined && child.apex === undefined);
  ok('child generation = max(parents)+1', child.gen === 1, 'gen ' + child.gen);
  ok('child class is deterministic', battleStats(child).cls === battleStats(crossGenome(p1, p2)).cls);

  // import hardening
  const dirty = normGenome(Object.assign({}, p1, { xp: 9999, hurt: 0.8, _mult: 3, _wf: 'lava', apex: 13, par: 99, brood: 9999 }));
  ok('normGenome strips xp/hurt/_mult/_wf', dirty.xp === undefined && dirty.hurt === undefined && dirty._mult === undefined && dirty._wf === undefined);
  ok('normGenome keeps valid apex, drops bogus par', dirty.apex === 13 && dirty.par === undefined);
  ok('normGenome caps brood at 200', dirty.brood === 200, 'brood ' + dirty.brood);

  // guardians
  let gd = null; for (let s = 1; s < 600 && !gd; s++) gd = guardianFor(s);
  ok('a guardian exists in the first 600 seeds', !!gd);
  if (gd) {
    const GS = battleStats(gd.genome);
    ok('guardian grade is summit (12-14)', speciesGrade(gd.genome).tier >= 12 && speciesGrade(gd.genome).tier <= 14);
    ok('guardian fights with Sovereign arts', /^Sovereign /.test(GS.ab.n), GS.ab.n);
    ok('guardian power is a wall (>=520)', GS.total >= 520, 'total ' + GS.total);
  }

  // duels: chronicle fields + determinism
  const A = { name: 'A', genome: p1 }, B = { name: 'B', genome: p2 };
  const r1 = runDuel(A, B), r2 = runDuel(A, B);
  ok('duels are deterministic', JSON.stringify(r1.log) === JSON.stringify(r2.log));
  ok('duel resolves a winner or draw', r1.winner === 'A' || r1.winner === 'B' || r1.winner === null);
  ok('chronicle entries carry sides', r1.log.some(L => L.side === 'A' || L.side === 'B'));
  ok('strike entries carry crit/fs/ex fields', r1.log.filter(L => !L.tick && !L.dodge && !L.stun).every(L => 'crit' in L && 'fs' in L && 'ex' in L));

  console.log(pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}, 1500);
