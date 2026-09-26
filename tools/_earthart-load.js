// Shared loaders for the Earth-fauna classifier and roster.
//
// `_earthArt(name)` lives in main.js (source of truth; falls back to the
// assembled html) and has no external deps, so it can be extracted by exact
// string markers and evaluated standalone. Used by rig-audit.js (the build gate)
// and rig-secondopinion.js (the TypeSafe second-opinion pass) so both judge the
// SAME function the painter runs.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const t = (f) => path.join(__dirname, f);

function loadEarthArt() {
  const srcFile = fs.existsSync(path.join(root, 'main.js'))
    ? path.join(root, 'main.js') : path.join(root, 'celestial-frontier.html');
  const src = fs.readFileSync(srcFile, 'utf8');
  const start = src.indexOf('function _earthArt(name){');
  if (start < 0) throw new Error('_earthArt not found in ' + srcFile);
  const end = src.indexOf('function hdGenesFor(', start);
  if (end < 0) throw new Error('hdGenesFor (end marker) not found');
  const body = src.slice(start, end);
  return new Function(body + '\n;return _earthArt;')();
}

// roster (bare object body: fauna:[...], flora:[...], ...)
function loadRoster() {
  const raw = fs.readFileSync(t('_earthnames.js'), 'utf8').trim().replace(/,\s*$/, '');
  return eval('({' + raw + '})');   // eslint-disable-line no-eval
}

module.exports = { loadEarthArt, loadRoster, root };
