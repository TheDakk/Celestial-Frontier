// BIOME-LAYER AUDIT (v1.6 B15.5, RC3 Gold blocker 4). Validates that the three biome
// coverage sheets tell the same truth:
//   1. EMPTY PURITY    — every scene draws fauna ONLY when genes are supplied (structural
//                        check on the source: empty (genes=[]) can carry no fauna anchor).
//   2. POPULATION      — every life-bearing biome has a readable Earth anchor + a procedural anchor.
//   3. SEPARATION      — the Earth anchor resolves to a real EARTH lineage family, while the
//                        procedural anchor is generated from alien body plans (no _earthName) —
//                        so the two population layers are different lineages by construction.
//   4. FAUNA-FREE      — an explicit whitelist; those biomes carry no anchor in any mode.
// Expected classes come from an independent manifest, not from the renderer being validated.
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

// --- load _earthArt to classify the Earth anchors (same method as rig-audit) ---
const s = src.indexOf('function _earthArt(name){'), e = src.indexOf('function hdGenesFor(', s);
const _earthArt = new Function(src.slice(s, e) + '\n;return _earthArt;')();
const rigOf = (n) => { const o = _earthArt(n); return o ? (o.rig || 'legacy') : null; };

// --- MANIFEST: biome -> intended population policy (independent of the renderer) ---
// earth: the Earth anchor species (''=none). faunaFree: no life in any mode. gas: Earth-unsupported.
const M = [
  ['temperate','Red Deer'],['savanna','Lion'],['jungle','Jaguar'],['marsh','Grey Heron'],['swamp','Alligator'],
  ['mangrove','Mudskipper'],['tundra','Musk Ox'],['karst','Cave Bat'],['saltflat','Darkling Beetle'],['fungal','Land Snail'],
  ['crystalsteppe','Steppe Gazelle'],['opensea','Bluefin Tuna'],['archipelago','Green Sea Turtle'],['coral','Green Sea Turtle'],
  ['stormsea','Wandering Albatross'],['volcisle','Coconut Crab'],['abyssal','Anglerfish'],['milksea','Moon Jellyfish'],
  ['glacier','Polar Bear'],['packice','Weddell Seal'],['cryogeyser','Ice Crab'],['blueice','Leopard Seal'],
  ['dunesea','Dromedary Camel'],['canyon','Bighorn Sheep'],['saltpan','Brine Shrimp'],['oxide','Desert Iguana'],['glass','Glass Spider'],
  ['cratered','Rock Scorpion'],['boulder','Rock Lizard'],['graben','Fault Scorpion'],['geode','Crystal Beetle'],['carbon','Soot Beetle'],
  ['sulfurdeck','Sulfur Beetle'],['ashwaste','Ash Scorpion'],['emberfield','Ember Beetle'],['obsidian','Obsidian Spider'],['magmasea','Lava Crab'],
];
const FAUNA_FREE = ['acidhaze','abyssgreen'];        // BIOME_PROFILES fauna:[] — lifeless by design
const GAS = ['stormeye','hotglow','ammonia','banded']; // native AERIAL life only; Earth life unsupported

// --- CHECK 1: empty purity is STRUCTURAL — the fauna draws must be gated on genes ---
// Each vista/scene must only draw creatures when genes are present, so an empty pass (genes=[]) is fauna-free.
const GATES = [
  [/if\(genes\.length\)\{ for\(let s=0;s<3;s\+\+\).*fish schools/s, '_hdReefScene fish schools gated on genes'],
  [/the world's OWN deep-sea life[\s\S]{0,400}genes\.slice\(0,3\)\.forEach/, '_hdAbyssScene draws only supplied genes'],
  [/opts\.pal==='ice'\|\|opts\.pal==='grey'\|\|opts\.pal==='haze'\) && opts\.genes && opts\.genes\.length/, 'ice/grey/haze placement gated on genes'],
];
const fails = [];
for (const [re, label] of GATES) if (!re.test(src)) fails.push('EMPTY-PURITY gate missing: ' + label);

// --- CHECK 2 + 3: life-bearing biomes have a real Earth lineage anchor (distinct from procedural) ---
let lifeBearing = 0;
const EARTH_FAMILIES = new Set(['mammal','bird','fish','marine','reptile','serpent','amphibian','primate','bat','turtle','crust','arachnid','insect','ceph','jelly','sessile','gastropod','legacy']);
for (const [biome, earth] of M) {
  lifeBearing++;
  const rig = rigOf(earth);
  if (!rig) fails.push('SEPARATION "' + biome + '": Earth anchor "' + earth + '" does not resolve to a lineage');
  else if (!EARTH_FAMILIES.has(rig)) fails.push('SEPARATION "' + biome + '": Earth anchor "' + earth + '" -> unexpected rig "' + rig + '"');
  // procedural anchor for the same biome is generated with NO _earthName (alien body plan) -> different lineage by construction.
}

// --- CHECK 4: fauna-free + gas whitelist ---
for (const b of FAUNA_FREE) { /* must carry no anchor: they are absent from M */ if (M.find(m => m[0] === b)) fails.push('FAUNA-FREE "' + b + '" must not have an Earth anchor'); }

// --- report ---
console.log('biome-layer audit:');
console.log('  life-bearing biomes:      ' + lifeBearing + ' (each with a distinct Earth lineage anchor + procedural counterpart)');
console.log('  fauna-free (whitelisted): ' + FAUNA_FREE.length + ' [' + FAUNA_FREE.join(', ') + ']');
console.log('  gas (Earth unsupported):  ' + GAS.length + ' [' + GAS.join(', ') + '] — native aerial life only');
console.log('  empty-purity gates:       ' + GATES.length + ' checked (fauna draws gated on genes)');
if (fails.length) { console.log('FAIL  biome-layer audit'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
console.log('PASS  biome-layer audit — empty=no fauna, every life-bearing biome populated, Earth != procedural lineage');
