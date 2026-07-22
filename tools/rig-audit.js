// CLASS -> RIG binding gate (v1.6). Promoted from the scratchpad audit to a
// permanent battery check per the roadmap (task C): the Earth-fauna classifier
// _earthArt() maps a species NAME to a silhouette rig; a keyword collision that
// routes a name to the wrong class (e.g. "Blue Tang" -> generic mammal, "Spider
// Monkey" -> arachnid, "Barnacle" -> crustacean) is a silent art bug. This gate
// FAILS the build on any wrong binding.
//
// Two assertions:
//   1. COMPLETENESS  — every fauna roster name classifies to a non-null result.
//   2. SENTINELS     — a curated class->expected-rig table (the known-hard
//      collisions + representatives of every class + the substring-guard cases)
//      must each resolve to the expected rig. 'legacy' = the intentional
//      plan-based path (elephant/giraffe/rhino/ceph/snail/worm/bat), rig===undefined.
//
// Usage: node tools/rig-audit.js
'use strict';
const fs = require('fs');
const path = require('path');
const t = (f) => path.join(__dirname, f);
const root = path.join(__dirname, '..');

// --- extract _earthArt from source (main.js is the source of truth; fall back
//     to the assembled html) and eval it standalone (it has no external deps) ---
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

// --- roster (bare object body: fauna:[...], flora:[...], ...) ---
function loadRoster() {
  const raw = fs.readFileSync(t('_earthnames.js'), 'utf8').trim().replace(/,\s*$/, '');
  return eval('({' + raw + '})');   // eslint-disable-line no-eval
}

const _earthArt = loadEarthArt();
const ROSTER = loadRoster();
const rigOf = (name) => { const o = _earthArt(name); return o ? (o.rig || 'legacy') : null; };

// --- SENTINELS: name -> expected rig. Ordering-independent; each must hold. ---
const SENTINELS = [
  // the 10 fixed P0 collisions (task B)
  ['Spider Monkey', 'primate'], ['Tang', 'fish'], ['Barnacle', 'sessile'],
  ['Elk', 'mammal'], ['Crow', 'bird'], ['Blue Tang', 'fish'],
  ['Black Widow', 'arachnid'], ['Rhino Beetle', 'insect'], ['Vervet', 'primate'],
  ['Periwinkle', 'gastropod'], ['Whelk', 'gastropod'], ['Swallowtail', 'insect'],
  ['Crown-of-Thorns', 'sessile'],
  // substring-guard cases (the real regression risks)
  ['Butterflyfish', 'fish'], ['Parrotfish', 'fish'], ['Lionfish', 'fish'],
  ['Catfish', 'fish'], ['Rabbitfish', 'fish'], ['Angelfish', 'fish'],
  ['Flying Fish', 'fish'], ['Silverfish', 'insect'], ['Crayfish', 'crust'],
  ['Cuttlefish', 'ceph'], ['Starfish', 'sessile'], ['Jellyfish', 'jelly'],
  ['Sea Lion', 'marine'], ['Mountain Lion', 'mammal'], ['Sea Spider', 'arachnid'],
  ['Dragonfish', 'fish'],
  // birds
  ['Eagle', 'bird'], ['Owl', 'bird'], ['Penguin', 'bird'], ['Ostrich', 'bird'],
  ['Emu', 'bird'], ['Kiwi', 'bird'], ['Flamingo', 'bird'], ['Duck', 'bird'],
  ['Hummingbird', 'bird'], ['Woodpecker', 'bird'], ['Cardinal', 'bird'],
  // fish
  ['Great White Shark', 'fish'], ['Manta Ray', 'fish'], ['Seahorse', 'fish'],
  ['Pufferfish', 'fish'], ['Coelacanth', 'fish'], ['Tuna', 'fish'],
  // marine mammals
  ['Blue Whale', 'marine'], ['Orca', 'marine'], ['Dolphin', 'marine'],
  ['Walrus', 'marine'], ['Seal', 'marine'], ['Dugong', 'marine'],
  // serpents / eels
  ['Cobra', 'serpent'], ['Anaconda', 'serpent'], ['Electric Eel', 'serpent'],
  ['Moray Eel', 'serpent'], ['Rattlesnake', 'serpent'],
  // amphibians
  ['Axolotl', 'amphibian'], ['Salamander', 'amphibian'], ['Tree Frog', 'amphibian'],
  ['Bullfrog', 'amphibian'], ['Newt', 'amphibian'],
  // reptiles
  ['Crocodile', 'reptile'], ['Alligator', 'reptile'], ['Komodo Dragon', 'reptile'],
  ['Chameleon', 'reptile'], ['Gecko', 'reptile'], ['Monitor Lizard', 'reptile'],
  ['Marine Iguana', 'reptile'], ['Gila Monster', 'reptile'],
  // turtles
  ['Sea Turtle', 'turtle'], ['Tortoise', 'turtle'], ['Box Turtle', 'turtle'],
  // crustaceans
  ['Crab', 'crust'], ['Lobster', 'crust'], ['Shrimp', 'crust'],
  ['Krill', 'crust'], ['Hermit Crab', 'crust'],
  // arachnids
  ['Tarantula', 'arachnid'], ['Scorpion', 'arachnid'], ['Harvestman', 'arachnid'],
  ['Pseudoscorpion', 'arachnid'],
  // insects
  ['Butterfly', 'insect'], ['Moth', 'insect'], ['Dragonfly', 'insect'],
  ['Dung Beetle', 'insect'], ['Honeybee', 'insect'], ['Mantis', 'insect'],
  ['Firefly', 'insect'], ['Stick Insect', 'insect'],
  // LEPIDOPTERA regression (review 15.2): common-name butterflies/moths + name COLLISIONS with
  // birds/mammals. Expected class is the biological truth (a manifest), independent of the classifier.
  ['Painted Lady', 'insect'], ['Cabbage White', 'insect'], ['Red Admiral', 'insect'],
  ['Monarch Butterfly', 'insect'], ['Swallowtail', 'insect'], ['Morpho Butterfly', 'insect'],
  ['Luna Moth', 'insect'], ['Atlas Moth', 'insect'], ['Emperor Moth', 'insect'], ['Gypsy Moth', 'insect'],
  ['Hawk Moth', 'insect'], ['Elephant Hawk Moth', 'insect'], ['Tiger Moth', 'insect'], ['Leopard Moth', 'insect'],
  ['Peacock Butterfly', 'insect'], ['Owl Butterfly', 'insect'], ['Birdwing Butterfly', 'insect'], ['Dogface Butterfly', 'insect'],
  // …and the bare collision words must STILL resolve to their real class (guards the fix both ways)
  ['Peacock', 'bird'], ['Hawk', 'bird'], ['Tiger', 'mammal'], ['Leopard', 'mammal'], ['Butterflyfish', 'fish'],
  // jelly
  ['Comb Jelly', 'jelly'], ['Portuguese Man-of-War', 'jelly'],
  // sessile
  ['Sea Urchin', 'sessile'], ['Sea Cucumber', 'sessile'], ['Coral', 'sessile'],
  ['Sponge', 'sessile'], ['Sea Anemone', 'sessile'], ['Sand Dollar', 'sessile'],
  ['Scallop', 'sessile'], ['Clam', 'sessile'], ['Oyster', 'sessile'],
  ['Giant Clam', 'sessile'],
  // primates
  ['Gorilla', 'primate'], ['Chimpanzee', 'primate'], ['Lemur', 'primate'],
  ['Baboon', 'primate'], ['Mandrill', 'primate'], ['Proboscis Monkey', 'primate'],
  ['Gibbon', 'primate'],
  // mammals (rigged)
  ['Kangaroo', 'mammal'], ['Wallaby', 'mammal'], ['Lion', 'mammal'],
  ['Wolf', 'mammal'], ['Bison', 'mammal'], ['Deer', 'mammal'],
  ['Zebra', 'mammal'], ['Rabbit', 'mammal'], ['Squirrel', 'mammal'],
  ['Polar Bear', 'mammal'], ['Meerkat', 'mammal'],
  // legacy plan-based path (intentional; rig undefined)
  ['Elephant', 'legacy'], ['Giraffe', 'legacy'], ['Rhinoceros', 'legacy'],
  ['Earthworm', 'legacy'],
  // dedicated bat rig (Pass 4 P0: were legacy winged/insect-like)
  ['Bat', 'bat'], ['Vampire Bat', 'bat'], ['Fruit Bat', 'bat'], ['Insect-Eating Bat', 'bat'],
  ['Flying Fox', 'bat'], ['Horseshoe Bat', 'bat'],
  // Pass 4 P0 catalog-integrity: wrong-class routing bugs that must never regress
  ['Wild Boar', 'mammal'], ['Jerboa', 'mammal'], ['Flying Squirrel', 'mammal'],   // \bboa\b / \bfly\b
  ['Hedgehog', 'mammal'], ['Warthog', 'mammal'],                                  // \bhog\b
  ['Wasp', 'insect'], ['Water Strider', 'insect'], ['Giant Water Bug', 'insect'], // \basp\b / generic+aquatic insect
  ['Cold-Adapted Insect', 'insect'], ['Damselfly', 'insect'],
  ['Gar', 'fish'], ['Bowfin', 'fish'], ['Sculpin', 'fish'], ['Mullet', 'fish'],   // missing fish names
  ['Tarpon', 'fish'], ['Wrasse', 'fish'], ['Haddock', 'fish'], ['Pollock', 'fish'],
  ['Barreleye', 'fish'], ['Mudskipper', 'fish'], ['Fangtooth', 'fish'], ['Pacu', 'fish'],
  ['Platypus', 'mammal'],                                                         // \bplaty\b guard (fish 'platy')
  ['Water Flea', 'crust'],                                                        // crustacean, not mammal
  ['Chiton', 'sessile'], ['Tardigrade', 'arachnid'],                             // dedicated mollusk / micro handling
  ['Boa Constrictor', 'serpent'], ['Asp', 'serpent'],                            // true serpents still route right
  // cephalopod split (task D): octopus / squid / cuttlefish / nautilus-shell
  ['Octopus', 'ceph'], ['Giant Octopus', 'ceph'], ['Nautilus', 'ceph'],
  ['Squid', 'ceph'], ['Giant Squid', 'ceph'], ['Vampire Squid', 'ceph'],
  // gastropod rig (task D): coiled / conch / limpet / slug
  ['Sea Snail', 'gastropod'], ['Land Snail', 'gastropod'], ['Banana Slug', 'gastropod'],
  ['Conch', 'gastropod'], ['Limpet', 'gastropod'], ['Abalone', 'gastropod'],
];

let fails = [];

// 1. completeness — every fauna name classifies
const unclassified = (ROSTER.fauna || []).filter((nm) => rigOf(nm) === null);
if (unclassified.length) fails.push('UNCLASSIFIED (' + unclassified.length + '): ' + unclassified.join(', '));

// 2. sentinels
for (const [nm, exp] of SENTINELS) {
  const got = rigOf(nm);
  if (got !== exp) fails.push('SENTINEL "' + nm + '": expected ' + exp + ', got ' + got);
}

// distribution report (informational)
const dist = {};
for (const nm of (ROSTER.fauna || [])) { const r = rigOf(nm) || 'null'; dist[r] = (dist[r] || 0) + 1; }
const distStr = Object.keys(dist).sort().map((k) => k + ':' + dist[k]).join(' ');

if (fails.length) {
  console.log('RIG-AUDIT FAIL (' + fails.length + '):');
  for (const f of fails) console.log('  ' + f);
  console.log('  fauna rig distribution: ' + distStr);
  process.exit(1);
}
console.log('PASS  class->rig binding  — ' + (ROSTER.fauna || []).length + ' fauna classified, '
  + SENTINELS.length + ' sentinels OK');
console.log('  fauna rig distribution: ' + distStr);
process.exit(0);
