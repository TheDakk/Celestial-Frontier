// TypeSafe second opinion on the Earth-fauna name -> rig classifier.
//
// `_earthArt(name)` routes a species NAME to a silhouette rig through ~40 chained
// keyword regexes. rig-audit.js guards it with a hand-curated sentinel table, so
// it can only catch collisions someone already thought of ("Spider Monkey",
// "Hawk Moth"). This tool asks Jev — a text-only System One model that returns a
// typed Choice with probabilities — what class each roster name REALLY is, and
// prints every name where the regex and the model disagree.
//
// A disagreement is a SUSPECT, not a verdict: the reviewer decides which side is
// wrong and, if it is the regex, adds the name to rig-audit's SENTINELS so it can
// never regress. If it is the model, nothing changes. Advisory by default;
// --assert exits 1 on any disagreement at or above --min-confidence.
//
// Usage:
//   node tools/rig-secondopinion.js --dry-run              # print the first request, send nothing
//   node tools/rig-secondopinion.js                        # full roster (631 names, ~22 requests)
//   node tools/rig-secondopinion.js --names "Jerboa,Blue Tang"
//   node tools/rig-secondopinion.js --limit 40 --offset 200
//   node tools/rig-secondopinion.js --assert --min-confidence 0.9
'use strict';
const { choice } = require('@typesafe-ai/sdk');
const { loadEarthArt, loadRoster } = require('./_earthart-load');
const ts = require('./typesafe-client');

const args = ts.parseArgs(process.argv.slice(2));
const BATCH = Number(args.batch || 30);
const MIN_CONF = Number(args['min-confidence'] || 0.9);

// The rig vocabulary the painter actually branches on (grep "rig:'" main.js), each
// described as the biological class it stands for so the model judges the ANIMAL,
// not the letters of its name. `worm` and `other` are not painter rigs: worms,
// centipedes and millipedes take the plan-based path (rig undefined => 'legacy').
const RIG_OPTIONS = {
  mammal:    { what: 'Land mammal drawn on four legs or hopping: cats, dogs, bears, deer, rodents, kangaroos, elephants, giraffes, rhinos, hippos, weasels, hedgehogs, platypus', not_for: 'primates, bats, whales, seals' },
  primate:   { what: 'Monkeys, apes, lemurs, baboons, tarsiers', not_for: 'other mammals' },
  bat:       { what: 'Bats and flying foxes (winged mammals)', not_for: 'birds, insects, flying squirrels (which glide and are mammals)' },
  bird:      { what: 'Any bird: songbirds, raptors, owls, waterfowl, waders, penguins, ostriches, hummingbirds', not_for: 'bats, butterflies, flying fish' },
  fish:      { what: 'Bony and cartilaginous fish: sharks, rays, tuna, seahorses, coelacanth, pufferfish, and any "-fish" that really is a fish (butterflyfish, lionfish, catfish, flying fish)', not_for: 'whales, dolphins, jellyfish, starfish, cuttlefish, crayfish, silverfish, eels' },
  marine:    { what: 'Marine MAMMALS: whales, dolphins, orcas, porpoises, narwhals, manatees, dugongs, seals, sea lions, walruses', not_for: 'fish, sharks, turtles, sea snakes' },
  serpent:   { what: 'Snakes and eel-shaped animals: cobras, pythons, vipers, boas, asps, moray eels, electric eels, lampreys, caecilians', not_for: 'lizards, worms, legless lizards named as lizards' },
  reptile:   { what: 'Lizards and crocodilians: geckos, iguanas, monitors, chameleons, komodo dragons, gila monsters, crocodiles, alligators, caimans', not_for: 'snakes, turtles, amphibians' },
  turtle:    { what: 'Turtles, tortoises, terrapins', not_for: 'other reptiles' },
  amphibian: { what: 'Frogs, toads, salamanders, newts, axolotls, hellbenders', not_for: 'caecilians (serpent), lizards' },
  insect:    { what: 'Six-legged insects: beetles, ants, bees, wasps, flies, butterflies, moths (hawk moth, tiger moth, owl butterfly are ALL insects), dragonflies, mantises, grasshoppers, cicadas, water striders, silverfish', not_for: 'spiders, scorpions, mites, centipedes, crustaceans' },
  arachnid:  { what: 'Spiders, scorpions, harvestmen, mites, ticks, pseudoscorpions, sea spiders, whip scorpions, plus tardigrades (water bears)', not_for: 'insects, crustaceans' },
  crust:     { what: 'Crustaceans: crabs, lobsters, crayfish, shrimp, prawns, krill, isopods, amphipods, copepods, water fleas, barnacles', not_for: 'insects, arachnids, horseshoe crabs are also fine here' },
  ceph:      { what: 'Cephalopods: octopus, squid, cuttlefish, nautilus, vampire squid', not_for: 'snails, slugs, jellyfish' },
  gastropod: { what: 'Snails, slugs, whelks, conchs, limpets, abalone, cowries, periwinkles, nudibranchs', not_for: 'bivalves (clams, oysters), chitons, cephalopods' },
  jelly:     { what: 'Jellyfish, comb jellies, siphonophores, man-of-war, salps, medusae', not_for: 'anemones, corals (sessile)' },
  sessile:   { what: 'Fixed or slow bottom-dwelling invertebrates: starfish, brittle stars, sea urchins, sand dollars, sea cucumbers, corals, anemones, sponges, sea squirts, crinoids, bivalves (clams, oysters, mussels, scallops), chitons', not_for: 'jellyfish, snails, crabs' },
  worm:      { what: 'Worms, leeches, centipedes, millipedes, velvet worms, and other elongate many-segmented crawlers with no shell', not_for: 'snakes, eels, caecilians' },
  other:     { what: 'A real animal that fits none of the classes above, or a name that is not an animal', not_for: 'anything that fits a listed class' },
};

// How the code's answer is read against the model's: 'legacy' (rig undefined,
// the plan-based path) is what worms/centipedes AND a few bespoke mammals
// (giraffe, rhino, hippo) get, so it agrees with either.
const CODE_ACCEPTS = { legacy: new Set(['worm', 'mammal']) };
function agrees(codeRig, modelRig) {
  if (codeRig === modelRig) return true;
  const alt = CODE_ACCEPTS[codeRig];
  return !!(alt && alt.has(modelRig));
}

const _earthArt = loadEarthArt();
const rigOf = (name) => { const o = _earthArt(name); return o ? (o.rig || 'legacy') : null; };

let names = (loadRoster().fauna || []).slice();
if (args.names) names = String(args.names).split(',').map((s) => s.trim()).filter(Boolean);
const offset = Number(args.offset || 0), limit = Number(args.limit || 0);
names = names.slice(offset, limit ? offset + limit : undefined);

function build(batch) {
  const state = { animals: {} };
  const questions = {}, keys = {};
  batch.forEach((nm, i) => {
    const id = 'a' + i;
    state.animals[id] = nm;
    questions['rig_' + id] = choice({
      question: 'Which body-plan class does the real Earth animal named in `animals.' + id + '` belong to?',
      focus: 'Judge the actual animal, not the words in its name. A "Spider Monkey" is a primate, a "Butterflyfish" is a fish, a "Hawk Moth" is an insect, a "Sea Lion" is a marine mammal, a "Mountain Lion" is a land mammal.',
    }, RIG_OPTIONS);
    keys['rig_' + id] = 'rig|' + nm;
  });
  return { state, questions, keys };
}

(async () => {
  const { answers, usage, dry } = await ts.runBatches({ name: 'rig-secondopinion', items: names, batchSize: BATCH, build, args });
  if (dry) return;
  const rows = [];
  for (const nm of names) {
    const a = answers['rig|' + nm];
    if (!a) continue;
    const code = rigOf(nm);
    const model = a.choice;
    const runnerUp = Object.entries(a.probabilities).sort((x, y) => y[1] - x[1])[1];
    rows.push({ name: nm, code, model, confidence: +a.confidence.toFixed(3), p_model: +(a.probabilities[model] || 0).toFixed(3),
      p_code: +(a.probabilities[code] || 0).toFixed(3), runnerUp: runnerUp ? runnerUp[0] + ' ' + runnerUp[1].toFixed(2) : '', agree: agrees(code, model) });
  }
  const disagree = rows.filter((r) => !r.agree).sort((a, b) => b.confidence - a.confidence);
  const strong = disagree.filter((r) => r.confidence >= MIN_CONF);
  const f = ts.saveReport('rig-secondopinion', { generated: new Date().toISOString(), minConfidence: MIN_CONF, usage, rows, disagree });

  console.log('RIG SECOND OPINION  ' + rows.length + ' names judged, ' + disagree.length + ' disagreements ('
    + strong.length + ' at confidence >= ' + MIN_CONF + ')');
  console.log('  ' + ts.usageLine(usage));
  if (disagree.length) {
    console.log('  name                        code        model       conf   P(model) P(code)  runner-up');
    for (const r of disagree) {
      console.log('  ' + r.name.padEnd(27) + ' ' + String(r.code).padEnd(11) + ' ' + r.model.padEnd(11) + ' '
        + r.confidence.toFixed(2).padEnd(6) + ' ' + r.p_model.toFixed(2).padEnd(8) + ' ' + r.p_code.toFixed(2).padEnd(8) + ' ' + r.runnerUp
        + (r.confidence >= MIN_CONF ? '   <-- STRONG' : ''));
    }
    console.log('  Each line is a SUSPECT. Confirm by eye; if the regex is wrong, add [name, rig] to SENTINELS in tools/rig-audit.js.');
  }
  console.log('  report: ' + f);
  if (args.assert && strong.length) process.exit(1);
})().catch((e) => { console.error('rig-secondopinion failed: ' + (e && e.message || e)); process.exit(3); });
