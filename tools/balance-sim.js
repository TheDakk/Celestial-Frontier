// Empirical archetype balance for the 1.0 ability matrix.
// Boots the probe build (real runDuel, real rng) and pits equal-stat
// combatants carrying each archetype's hook set against every other,
// across many duel seeds. PASS = every archetype's OVERALL win rate vs
// the field sits in the 42–58% band (head-to-head counters are allowed —
// rock/paper is healthy; a globally dominant verb is not).
//
// NOTE: the magnitude tables mirror ARCHETYPES in main.js (mk functions).
// If you tune one, tune both — this file is the measuring stick.
//
// Usage: node tools/make-probe-build.js celestial-frontier.html tools/probe-build.html
//        node tools/balance-sim.js [magnitude 0-4]   (default 2)
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const MAG = Math.max(0, Math.min(4, parseInt(process.argv[2] || '2', 10)));
const ARCH = {
  smite:   m => ({dmg:1.14+m*0.050}),
  aegis:   m => ({taken:0.90-m*0.030}),
  dot:     m => ({burn:0.015+m*0.0035}),
  fury:    m => ({ramp:0.024+m*0.006}),
  ambush:  m => ({first:1.60+m*0.15}),
  eye:     m => ({critB:0.190+m*0.038}),
  veil:    m => ({dodge:0.100+m*0.022}),
  mend:    m => ({regen:0.030+m*0.006}),
  echo:    m => ({dbl:0.110+m*0.026}),
  thirst:  m => ({drink:true, critB:0.070+m*0.018}),
  thorns:  m => ({thorns:0.08+m*0.025}),
  rend:    m => ({shred:0.060+m*0.014}),
  reck:    m => ({execB:0.28+m*0.09}),
  bulwark: m => ({cap:0.28-m*0.015}),
  shock:   m => ({stun:0.095+m*0.024}),
  roulette:m => ({gambit:0.45+m*0.10}),
  enrage:  m => ({enrage:0.16+m*0.05}),
};

const html = fs.readFileSync(path.join(__dirname, 'probe-build.html'), 'utf8');
const errs = [];
const { installFakeCanvas } = require('./fake2d.js');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w){
    installFakeCanvas(w);
    w.addEventListener('error', e => errs.push(String(e.message)));
  }});
setTimeout(() => {
  const H = dom.window.__PROBE_HOOK__;
  if (!H) { console.error('no probe hook', errs.slice(0,3)); process.exit(1); }
  const { runDuel } = H;
  const keys = Object.keys(ARCH);
  const TRIALS = 240;
  const mk = (ab, seed) => ({ name:'x', genome:{seed},
    stats:{ vit:80, fer:80, res:80, agi:80, ins:80, total:400, hex:'#fff', name:'x', ab:Object.assign({n:'t',d:'t'}, ab) } });
  const wins = {}; keys.forEach(k => wins[k] = 0);
  const games = {}; keys.forEach(k => games[k] = 0);
  const grid = {};
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const a = ARCH[keys[i]](MAG), b = ARCH[keys[j]](MAG);
    let wa = 0, n = 0;
    for (let t = 0; t < TRIALS; t++) {
      // alternate sides to wash out the agi-tie first-mover edge
      const flip = t % 2 === 1;
      const res = flip ? runDuel(mk(b, 9000+t), mk(a, 17+t)) : runDuel(mk(a, 9000+t), mk(b, 17+t));
      if (!res.winner) continue;
      const aWon = flip ? res.winner === 'B' : res.winner === 'A';
      if (aWon) wa++; n++;
    }
    grid[keys[i]+'|'+keys[j]] = (wa / Math.max(1,n) * 100);
    wins[keys[i]] += wa; games[keys[i]] += n;
    wins[keys[j]] += n - wa; games[keys[j]] += n;
  }
  console.log('archetype overall win rate vs the field (magnitude ' + 'I II III IV V'.split(' ')[MAG] + '):');
  let pass = true;
  const rows = keys.map(k => [k, wins[k] / Math.max(1, games[k]) * 100]).sort((a,b)=>b[1]-a[1]);
  for (const [k, w] of rows) {
    const flag = (w < 42 || w > 58) ? '  <-- OUT OF BAND' : '';
    if (flag) pass = false;
    console.log('  ' + k.padEnd(9) + w.toFixed(1) + '%' + flag);
  }
  // worst head-to-heads (informational — counters are allowed)
  const hh = Object.entries(grid).map(([k,v]) => [k, Math.abs(v-50)]).sort((a,b)=>b[1]-a[1]).slice(0,5);
  console.log('sharpest counters (allowed, for the record):');
  for (const [k, d] of hh) console.log('  ' + k + '  ±' + d.toFixed(1));
  console.log(pass ? 'BALANCE PASS' : 'BALANCE FAIL');
  process.exit(pass ? 0 : 1);
}, 1500);
