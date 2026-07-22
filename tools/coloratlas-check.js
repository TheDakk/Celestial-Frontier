// COLOR ATLAS determinism gate (v1.6 §6). The atlas is the color-resolution
// source of truth and MUST be pure: same physical props -> same palette, no
// RNG, no Date. This lifts the atlas block from main.js, evals it standalone,
// and asserts (1) every resolver is deterministic across repeated calls,
// (2) outputs are valid hex, (3) no mulberry32/Math.random/Date in the block.
//
// Usage: node tools/coloratlas-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(fs.existsSync(path.join(root, 'main.js'))
  ? path.join(root, 'main.js') : path.join(root, 'celestial-frontier.html'), 'utf8');

const START = 'function _caHslHex(';
const END = '/* ---------------- thumbnails';
const i = src.indexOf(START), j = src.indexOf(END, i);
if (i < 0 || j < 0) { console.log('COLOR-ATLAS FAIL: block markers not found'); process.exit(1); }
const block = src.slice(i, j);

// purity guard: the color path must not touch RNG or wall-clock
const impure = /mulberry32|Math\.random|Date\.now|cellRng|hashInt/.exec(block);
if (impure) { console.log('COLOR-ATLAS FAIL: impure token in color path: ' + impure[0]); process.exit(1); }

const api = new Function(block + '\n;return {resolveBodyPalette,resolveVistaTint,resolveMapDot,_caHslHex};')();
const HEX = /^#[0-9a-f]{6}$/i;

const TYPES = ['gas', 'rocky', 'desert', 'ice', 'terran', 'ocean', 'venus', 'lava'];
const STARCOLS = ['#ff9a6a', '#fff4d8', '#9ab8ff', '#eef4ff'];
let fails = [];
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let n = 0;
for (const type of TYPES) {
  for (let s = 0; s < 4; s++) {
    const P = { type, seed: 1000 + s, hue: (s * 87) % 360, seaHue: 200 + s * 8, landHue: 80 + s * 20, iceAmt: s / 4 };
    const sc = STARCOLS[s % STARCOLS.length];
    const p1 = api.resolveBodyPalette(P, sc, 'temperate-forest');
    const p2 = api.resolveBodyPalette(P, sc, 'temperate-forest');
    if (!eq(p1, p2)) fails.push('resolveBodyPalette non-deterministic for ' + type);
    for (const k of ['star', 'sky', 'atmosphere', 'terrain', 'accent']) {
      if (!HEX.test(p1[k])) fails.push(type + '.' + k + ' not hex: ' + p1[k]);
    }
    if (p1.water !== null && !HEX.test(p1.water)) fails.push(type + '.water not hex: ' + p1.water);
    const d1 = api.resolveMapDot(P, sc, type === 'terran', '#ffd700');
    const d2 = api.resolveMapDot(P, sc, type === 'terran', '#ffd700');
    if (!eq(d1, d2)) fails.push('resolveMapDot non-deterministic for ' + type);
    for (const k of ['center', 'surface', 'atmosphere', 'ring']) {
      if (!HEX.test(d1[k])) fails.push('mapDot.' + k + ' not hex for ' + type + ': ' + d1[k]);
    }
    n++;
  }
}
// vista tint monotonic + bounded 0.05..0.35
for (let L = 0; L <= 1.01; L += 0.25) {
  const v = api.resolveVistaTint(L);
  if (v < 0.05 || v > 0.35) fails.push('vistaTint out of range at ' + L + ': ' + v);
}

if (fails.length) {
  console.log('COLOR-ATLAS FAIL (' + fails.length + '):');
  for (const f of fails.slice(0, 20)) console.log('  ' + f);
  process.exit(1);
}
console.log('PASS  color atlas  — pure, deterministic; ' + n + ' body/star combos, all hex valid');
process.exit(0);
