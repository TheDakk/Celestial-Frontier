// One-shot validation pipeline, run after every batch of edits:
//   [if main.js exists] assemble html from main.js -> invariant checks ->
//   probe build -> jsdom boot -> fingerprint must equal the v1.0 baseline,
//   key by key.
//
// Usage: node tools/validate.js
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const t = (f) => path.join(__dirname, f);
function run(args) {
  execFileSync(process.execPath, args, { stdio: 'inherit', cwd: root });
}
if (fs.existsSync(path.join(root, 'main.js')))
  run([t('build.js'), '--template', path.join(root, 'celestial-frontier.html'),
    '--js', path.join(root, 'main.js'), '--out', path.join(root, 'celestial-frontier.html')]);
run([t('checks.js'), path.join(root, 'celestial-frontier.html')]);
run([t('rig-audit.js')]);   // class->rig binding gate (v1.6): FAIL on wrong-class collisions
run([t('coloratlas-check.js')]);   // color atlas (v1.6 §6): pure + deterministic color path
run([t('biomeprofile-check.js')]);   // biome profiles (v1.6 §F): every live biome covered
run([t('make-probe-build.js'), path.join(root, 'celestial-frontier.html'), t('probe-build.html')]);
run([t('render-audit.js')]);   // v1.6: every Earth species renders without throwing (fingerprint only covers procedural)
run([t('harness.js'), t('probe-build.html'), t('current.json')]);

const base = JSON.parse(fs.readFileSync(t('baseline.json'), 'utf8')).fingerprint;
const cur = JSON.parse(fs.readFileSync(t('current.json'), 'utf8')).fingerprint || {};
let bad = 0;
for (const k of Object.keys(base)) {
  if (cur[k] !== base[k]) {
    bad++;
    console.log('FINGERPRINT MISMATCH:', k);
    const a = String(base[k]), b = String(cur[k]);
    let i = 0; while (i < a.length && a[i] === b[i]) i++;
    console.log('  baseline …' + a.slice(Math.max(0, i - 60), i + 80));
    console.log('  current  …' + b.slice(Math.max(0, i - 60), i + 80));
  }
}
if (!bad) console.log('FINGERPRINT MATCH (' + Object.keys(base).length + ' probes identical to v1.0 baseline)');
process.exit(bad ? 1 : 0);
