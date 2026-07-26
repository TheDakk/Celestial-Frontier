// Deploys the built game to the live site
// (CelestialFrontier/celestialfrontier.github.io — the org user site).
// Copies celestial-frontier.html into the site repo as BOTH index.html
// (so https://celestialfrontier.github.io/ plays directly) and
// celestial-frontier.html (stable deep link), stamps BUILD_ID with the git
// sha, publishes version.json (update watch), then commits and pushes.
// Clones the site repo automatically if the local copy is missing.
//
// The full test battery (validate + smoke + uilayout) runs FIRST and a
// failure aborts the deploy — the gate is enforced, not a comment
// (CF-CR-014). --skip-gate additionally requires the CF_EMERGENCY_DEPLOY
// env acknowledgement so bypassing can never become casual (CF-RR review).
// The deploy REQUIRES an explicit --release X.Y.Z that must match BOTH
// GAME_VERSION and package.json — no more shipping under a stale version.
//
// Usage: node tools/deploy.js [path-to-site-repo] --release 1.7.0
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');

{ // release-target gate (CF-RR-003): deploying is an explicit, versioned act
  const ri = process.argv.indexOf('--release');
  const target = ri > 0 ? process.argv[ri + 1] : null;
  if (!target || !/^\d+\.\d+(\.\d+)?$/.test(target)) {
    console.error('DEPLOY ABORTED — pass an explicit release target: node tools/deploy.js [site] --release X.Y.Z');
    process.exit(1);
  }
  const html = fs.readFileSync(path.join(root, 'celestial-frontier.html'), 'utf8');
  const gv = (html.match(/const GAME_VERSION='([^']+)'/) || [])[1];
  const pv = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  if (gv !== target || pv !== target) {
    console.error('DEPLOY ABORTED — release target ' + target + ' does not match GAME_VERSION ' + gv + ' / package.json ' + pv + '.');
    process.exit(1);
  }
}

if (process.argv.includes('--skip-gate') && process.env.CF_EMERGENCY_DEPLOY !== 'I_ACCEPT_UNTESTED_RELEASE') {
  console.error('DEPLOY ABORTED — --skip-gate requires CF_EMERGENCY_DEPLOY=I_ACCEPT_UNTESTED_RELEASE in the environment.');
  process.exit(1);
}
if (!process.argv.includes('--skip-gate')) {
  for (const t of ['validate.js', 'smoke.js', 'uilayout.js']) {
    console.log('deploy gate — running tools/' + t + ' …');
    try {
      execFileSync(process.execPath, [path.join(__dirname, t)], { cwd: root, stdio: 'inherit', timeout: 600000 });
    } catch (e) {
      console.error('\nDEPLOY ABORTED — tools/' + t + ' failed. Fix it (or --skip-gate for a declared emergency).');
      process.exit(1);
    }
  }
  console.log('deploy gate — all suites passed.\n');
}
const SITE_REPO = 'https://github.com/CelestialFrontier/celestialfrontier.github.io.git';
const SITE_URL = 'https://celestialfrontier.github.io/';
/* the site path is the first NON-flag argument (release target and flags are consumed above) */
const _pos = process.argv.slice(2).filter((a, i, all) => a[0] !== '-' && all[i - 1] !== '--release');
const site = _pos[0] || path.join(root, '..', 'celestialfrontier.github.io');

if (!fs.existsSync(path.join(site, '.git'))) {
  console.log('site repo not found locally — cloning ' + SITE_REPO);
  execFileSync('git', ['clone', SITE_REPO, site], { stdio: 'inherit' });
}
const git = (...args) => execFileSync('git', args, { cwd: site, stdio: 'pipe' }).toString().trim();

try { git('pull', '--ff-only'); } catch (e) { /* fresh empty repo has no HEAD yet */ }
const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim();
let game = fs.readFileSync(path.join(root, 'celestial-frontier.html'), 'utf8');

// stamp the build so live sessions can detect the next deploy
const PLACEHOLDER = "const BUILD_ID='dev';";
const hits = game.split(PLACEHOLDER).length - 1;
if (hits !== 1) { console.error('BUILD_ID placeholder found ' + hits + 'x (expected 1) — aborting'); process.exit(1); }
game = game.replace(PLACEHOLDER, "const BUILD_ID='" + sha + "';");
const vm = game.match(/const GAME_VERSION='([^']+)'/);
const version = vm ? vm[1] : '0';

fs.writeFileSync(path.join(site, 'index.html'), game);
fs.writeFileSync(path.join(site, 'celestial-frontier.html'), game);
fs.writeFileSync(path.join(site, 'version.json'),
  JSON.stringify({ v: version, build: sha, t: new Date().toISOString() }) + '\n');

const dirty = git('status', '--porcelain');
if (!dirty) { console.log('site already up to date — nothing to deploy'); process.exit(0); }
git('add', 'index.html', 'celestial-frontier.html', 'version.json');
git('commit', '-m', 'Deploy Celestial Frontier v' + version + ' (' + sha + ')');
git('push', 'origin', 'HEAD');
console.log('deployed v' + version + ' build ' + sha + ' -> ' + SITE_URL);
