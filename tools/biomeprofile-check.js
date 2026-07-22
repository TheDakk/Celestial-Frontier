// BIOME PROFILE coverage gate (v1.6 §F). Every LIVE biome (a BIOME_SETS key)
// must have a BIOME_PROFILES entry; every signature must be valid hex; every
// named fauna/flora family must reference a real rig/form key (a typo here
// would silently give a biome no creatures/plants in the vista + procedural).
//
// Usage: node tools/biomeprofile-check.js
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(fs.existsSync(path.join(root, 'main.js'))
  ? path.join(root, 'main.js') : path.join(root, 'celestial-frontier.html'), 'utf8');

// --- BIOME_SETS keys (every k:'...' inside the const BIOME_SETS={...} block) ---
const sStart = src.indexOf('const BIOME_SETS=');
if (sStart < 0) { console.log('BIOME-PROFILE FAIL: BIOME_SETS not found'); process.exit(1); }
// the block ends at the first "\n};" after the start
const sEnd = src.indexOf('\n};', sStart);
const setsBlock = src.slice(sStart, sEnd);
const setKeys = [...setsBlock.matchAll(/k:'([a-z]+)'/g)].map(m => m[1]);

// --- BIOME_PROFILES object (eval the literal) ---
const pStart = src.indexOf('const BIOME_PROFILES=');
if (pStart < 0) { console.log('BIOME-PROFILE FAIL: BIOME_PROFILES not found'); process.exit(1); }
const pEnd = src.indexOf('\n};', pStart);
const profLiteral = src.slice(src.indexOf('{', pStart), pEnd + 2);
const PROFILES = eval('(' + profLiteral + ')');   // eslint-disable-line no-eval

const RIGS = new Set(['mammal', 'bird', 'reptile', 'amphibian', 'fish', 'marine', 'insect',
  'arachnid', 'crust', 'sessile', 'gastropod', 'ceph', 'serpent', 'primate', 'jelly', 'turtle']);
const FORMS = new Set(['tree', 'conifer', 'palm', 'shrub', 'herb', 'flower', 'grass', 'cactus',
  'fern', 'vine', 'seaweed', 'crop', 'root', 'moss', 'trap']);
const HEX = /^#[0-9a-f]{6}$/i;

let fails = [];
// 1. coverage — every biome has a profile
for (const k of setKeys) if (!PROFILES[k]) fails.push('biome "' + k + '" has NO profile');
// 2. no orphan profiles (a profile for a biome that no longer exists)
for (const k of Object.keys(PROFILES)) if (!setKeys.includes(k)) fails.push('orphan profile "' + k + '" (not in BIOME_SETS)');
// 3. valid sig + known families
for (const [k, p] of Object.entries(PROFILES)) {
  if (!HEX.test(p.sig || '')) fails.push(k + '.sig not hex: ' + p.sig);
  for (const f of (p.fauna || [])) if (!RIGS.has(f)) fails.push(k + '.fauna has unknown family: ' + f);
  for (const f of (p.flora || [])) if (!FORMS.has(f)) fails.push(k + '.flora has unknown form: ' + f);
}

if (fails.length) {
  console.log('BIOME-PROFILE FAIL (' + fails.length + '):');
  for (const f of fails.slice(0, 25)) console.log('  ' + f);
  process.exit(1);
}
console.log('PASS  biome profiles  — ' + setKeys.length + ' live biomes, all covered; sigs + families valid');
process.exit(0);
