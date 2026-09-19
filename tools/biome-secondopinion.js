// TypeSafe second opinion on the biome atlas: which fauna and flora families each of the 43 live
// biomes admits (port/v2/packages/domain/biome-profile/src/index.ts, BIOME_PROFILE_AUTHORITY_V1).
//
// For every (biome, family) pair Jev answers one Noul: "would this family plausibly live here?".
// Two kinds of suspect come out: a LISTED family the model finds implausible, and an UNLISTED
// family the model finds plausible. Both are for a human — the atlas is a design document as much
// as an ecology, and a deliberate omission is not an error. The biome gloss below is the reviewer's
// reading of each key (2026-09-19), passed to the model as text; it is not game data.
//
// Usage:
//   node tools/biome-secondopinion.js --dry-run
//   node tools/biome-secondopinion.js [--biomes "temperate,abyssal"] [--min 0.8]
'use strict';
const fs = require('fs');
const path = require('path');
const { noul } = require('@typesafe-ai/sdk');
const ts = require('./typesafe-client');

const args = ts.parseArgs(process.argv.slice(2));
const BATCH = Number(args.batch || 6);
const MIN = Number(args.min || 0.8);
const SRC = path.join(__dirname, '..', 'port', 'v2', 'packages', 'domain', 'biome-profile', 'src', 'index.ts');

const FAUNA = {
  mammal: 'land mammals (cats, deer, rodents, bears, elephants)', primate: 'monkeys, apes, lemurs', bird: 'birds of any kind',
  reptile: 'lizards and crocodilians', amphibian: 'frogs, toads, salamanders', fish: 'fish', marine: 'marine mammals (whales, seals, dolphins)',
  insect: 'insects', arachnid: 'spiders, scorpions, mites', crust: 'crabs, shrimp, lobsters and other crustaceans',
  ceph: 'octopus, squid, cuttlefish', gastropod: 'snails and slugs', jelly: 'jellyfish and drifting medusae', sessile: 'anemones, corals, sponges, urchins, bivalves',
};
const FLORA = {
  tree: 'trees', shrub: 'shrubs', flower: 'flowering herbs', grass: 'grasses, reeds, sedges', fern: 'ferns', vine: 'vines and climbers',
  palm: 'palms', moss: 'mosses and moss-like carpets', herb: 'soft non-woody herbs', cactus: 'cacti and spined succulents', seaweed: 'seaweeds and marine algae',
};
// Reviewer gloss of each biome key (what the key means in this game's atlas).
const GLOSS = {
  temperate: 'temperate forest and meadow on an Earth-like world', savanna: 'grassland with scattered trees, dry season', jungle: 'tropical rainforest',
  marsh: 'freshwater marsh and reed beds', swamp: 'flooded forest swamp', mangrove: 'tidal mangrove forest at a tropical coast', tundra: 'cold treeless tundra',
  karst: 'limestone cave and sinkhole country', saltflat: 'dry salt flat', fungal: 'a forest floor dominated by giant fungi and spores', crystalsteppe: 'a steppe of crystal shards and grass on an alien world',
  opensea: 'open ocean surface waters', archipelago: 'tropical island chain with reefs and beaches', coral: 'coral reef shallows', stormsea: 'a storm-lashed sea',
  volcisle: 'a volcanic island with ashfall', abyssal: 'the lightless deep-sea floor under crushing pressure', milksea: 'a calm glowing bioluminescent sea',
  glacier: 'glacier and ice sheet with coast', packice: 'sea pack ice', cryogeyser: 'an icy surface with erupting cold geysers', blueice: 'ancient blue ice with crevasses',
  dunesea: 'sand dune desert', canyon: 'dry canyon country with flash floods', saltpan: 'a mirage-hot salt pan', oxide: 'a rust-red oxide desert with dust devils',
  glass: 'a plain of natural glass shards', cratered: 'an airless cratered surface', boulder: 'a dry boulder field', graben: 'a fault-rift valley floor', geode: 'a cavern of crystal geodes',
  carbon: 'a soot-black carbon world surface', sulfurdeck: 'a sulfurous acid-storm surface', acidhaze: 'an acid-haze atmosphere world', abyssgreen: 'a runaway greenhouse surface',
  ashwaste: 'an ash-covered wasteland', emberfield: 'a field of embers and ember wind', obsidian: 'a still hot obsidian plain', magmasea: 'a sea of magma',
  banded: 'the banded cloud decks of a gas giant', ammonia: 'cold ammonia clouds of an ice giant', stormeye: 'the eye of a gas-giant megastorm', hotglow: 'the glowing cloud deck of a hot gas giant',
};

const src = fs.readFileSync(SRC, 'utf8');
const RE = /\['([a-z]+)', \{ sig: '#[0-9a-f]+', fauna: \[([^\]]*)\], flora: \[([^\]]*)\], hazard: ([^,]+), weather: '([^']+)' \}\]/g;
let biomes = []; let m;
while ((m = RE.exec(src))) biomes.push({ key: m[1], fauna: m[2].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean), flora: m[3].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean), hazard: m[4].replace(/'/g, '').trim(), weather: m[5] });
if (!biomes.length) throw new Error('no biome profiles parsed from ' + SRC);
for (const b of biomes) if (!GLOSS[b.key]) throw new Error('no gloss for biome ' + b.key + ' — add one before judging');
if (args.biomes) { const want = new Set(String(args.biomes).split(',').map((s) => s.trim())); biomes = biomes.filter((b) => want.has(b.key)); }

function build(batch) {
  const state = { biomes: {} };
  const questions = {}, keys = {};
  batch.forEach((b, i) => {
    const id = 'b' + i;
    state.biomes[id] = { key: b.key, description: GLOSS[b.key], hazard: b.hazard === 'null' ? null : b.hazard, weather: b.weather };
    for (const [fam, gloss] of Object.entries(FAUNA)) {
      const qid = id + '_fauna_' + fam;
      questions[qid] = noul({ question: 'Could ' + gloss + ' plausibly live in the biome described at `biomes.' + id + '`?', focus: 'Judge ecological plausibility for a game world: the biome description, hazard and weather. Yes if such animals would credibly be found there; no if the environment rules them out.' });
      keys[qid] = 'biome|' + b.key + '|fauna|' + fam;
    }
    for (const [fam, gloss] of Object.entries(FLORA)) {
      const qid = id + '_flora_' + fam;
      questions[qid] = noul({ question: 'Could ' + gloss + ' plausibly grow in the biome described at `biomes.' + id + '`?', focus: 'Judge ecological plausibility for a game world: the biome description, hazard and weather. Yes if such plants would credibly grow there; no if the environment rules them out.' });
      keys[qid] = 'biome|' + b.key + '|flora|' + fam;
    }
  });
  return { state, questions, keys };
}

(async () => {
  const { answers, usage, dry } = await ts.runBatches({ name: 'biome-secondopinion', items: biomes, batchSize: BATCH, build, args });
  if (dry) return;
  const rows = [];
  for (const b of biomes) {
    for (const [kind, fams] of [['fauna', FAUNA], ['flora', FLORA]]) {
      for (const fam of Object.keys(fams)) {
        const a = answers['biome|' + b.key + '|' + kind + '|' + fam]; if (!a) continue;
        const p = typeof a.noul === 'number' ? a.noul : 0, listed = b[kind].includes(fam);
        rows.push({ biome: b.key, kind, family: fam, listed, p_plausible: +p.toFixed(3), suspect: listed ? (p <= 1 - MIN ? 'listed-but-implausible' : null) : (p >= MIN ? 'unlisted-but-plausible' : null) });
      }
    }
  }
  const suspects = rows.filter((r) => r.suspect).sort((x, y) => (x.suspect === 'listed-but-implausible' ? -1 : 1) - (y.suspect === 'listed-but-implausible' ? -1 : 1) || Math.abs(y.p_plausible - 0.5) - Math.abs(x.p_plausible - 0.5));
  const f = ts.saveReport('biome-secondopinion', { generated: new Date().toISOString(), min: MIN, usage, gloss: GLOSS, rows, suspects });
  console.log('BIOME SECOND OPINION  ' + biomes.length + ' biomes, ' + rows.length + ' (biome, family) pairs judged, ' + suspects.length + ' suspects at |P| >= ' + MIN);
  console.log('  ' + ts.usageLine(usage));
  console.log('  listed-but-implausible (P(plausible) <= ' + (1 - MIN).toFixed(2) + '):');
  for (const r of suspects.filter((s) => s.suspect === 'listed-but-implausible')) console.log('    ' + r.biome.padEnd(14) + r.kind.padEnd(6) + r.family.padEnd(10) + ' P=' + r.p_plausible.toFixed(2));
  console.log('  unlisted-but-plausible (P(plausible) >= ' + MIN.toFixed(2) + '):');
  for (const r of suspects.filter((s) => s.suspect === 'unlisted-but-plausible')) console.log('    ' + r.biome.padEnd(14) + r.kind.padEnd(6) + r.family.padEnd(10) + ' P=' + r.p_plausible.toFixed(2));
  console.log('  Each line is a SUSPECT for the atlas owner; a deliberate omission is not an error.');
  console.log('  report: ' + f);
})().catch((e) => { console.error('biome-secondopinion failed: ' + (e && e.message || e)); process.exit(3); });
