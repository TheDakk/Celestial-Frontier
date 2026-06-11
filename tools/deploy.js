// Deploys the built game to the live site (TheDakk/thedakk.github.io).
// Copies celestial-frontier.html into the user-site repo as BOTH index.html
// (so https://thedakk.github.io/ plays directly) and celestial-frontier.html
// (stable deep link), then commits and pushes.
//
// Run AFTER tools/validate.js and tools/smoke.js pass.
//
// Usage: node tools/deploy.js [path-to-site-repo]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const site = process.argv[2] || path.join(root, '..', 'thedakk.github.io');

if (!fs.existsSync(path.join(site, '.git'))) {
  console.error('site repo not found at ' + site + ' — clone TheDakk/thedakk.github.io there first');
  process.exit(1);
}
const git = (...args) => execFileSync('git', args, { cwd: site, stdio: 'pipe' }).toString().trim();

git('pull', '--ff-only');
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
console.log('deployed v' + version + ' build ' + sha + ' -> https://thedakk.github.io/');
