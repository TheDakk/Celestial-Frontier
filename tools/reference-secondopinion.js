// TypeSafe second opinion on the fauna anatomy reference table.
//
// port/v2/reference/fauna.json holds one row per Earth species (631):
//   { name, aspect, headFrac, eyes, posture, mustRead[], note }
// The judge packets tell the vision judge to "compare the PICTURE against the
// STATED ANATOMY", and conformance.mjs reads `eyes`/`posture` as ground truth.
// A wrong row therefore mis-grades every pass. The rows were written by hand.
//
// This tool asks Jev (text-only) two Choice questions per row from the name
// and the row's own mustRead/note text: what posture the reference SHOULD say,
// and how prominent the eyes SHOULD be. It prints every row where the model
// disagrees with the stored value. Aspect and headFrac are numbers, and Jev is
// documented as weak at numeric calibration, so they are not judged here.
//
// A disagreement is a SUSPECT for a human to confirm — never auto-applied.
//
// Usage:
//   node tools/reference-secondopinion.js --dry-run
//   node tools/reference-secondopinion.js [--limit N --offset N] [--names "Mamba,Gorilla"] [--min-confidence 0.8]
'use strict';
const path = require('path');
const { choice } = require('@typesafe-ai/sdk');
const ts = require('./typesafe-client');

const args = ts.parseArgs(process.argv.slice(2));
const BATCH = Number(args.batch || 20);
const MIN_CONF = Number(args['min-confidence'] || 0.8);
const REF = path.join(__dirname, '..', 'port', 'v2', 'reference', 'fauna.json');

// The vocabularies conformance.mjs and the packets use, described by what the
// table actually files under each label (sampled 2026-09-19).
const POSTURE = {
  quadruped: { what: 'Stands and moves on four legs: cats, deer, elephants, rodents, and knuckle-walking great apes (gorilla, chimpanzee, orangutan)', not_for: 'birds, lizards, insects, primates that sit or hang upright' },
  biped:     { what: 'A bird standing on two legs in its normal perched or walking pose: parrots, eagles, owls, crows, pheasants, waders', not_for: 'penguins and other stiffly vertical birds (upright), birds shown in flight (flying)' },
  flying:    { what: 'Normally depicted airborne with wings spread: bats, hummingbirds, swallows, terns, albatrosses, butterflies, bees, flies, dragonflies', not_for: 'perched birds, flightless birds' },
  upright:   { what: 'Stands tall on a vertical axis: penguins, meerkats sentinel-standing, gibbons, seahorses, mantises, cormorants and bitterns in their vertical pose', not_for: 'ordinary perched birds (biped), apes on all fours (quadruped)' },
  coiled:    { what: 'A snake shown coiled or looped on itself: pythons, boas, cobras, vipers, rattlesnakes, tree snakes', not_for: 'eels and lampreys (swimming), worms and slugs (crawling)' },
  sprawling: { what: 'Limbs splayed out to the sides, belly low: crocodilians, lizards, geckos, frogs, toads, salamanders, tarantulas', not_for: 'insects and crabs (crawling), snakes (coiled)' },
  crawling:  { what: 'Low many-legged or legless crawlers on the ground: ants, beetles, cicadas, grasshoppers, scorpions, ticks, snails, slugs, earthworms, leeches, crayfish on land', not_for: 'spiders and lizards (sprawling), snakes (coiled), swimming animals' },
  swimming:  { what: 'Lives in water and is depicted swimming: all fish, eels, lampreys, whales, dolphins, seals, squid, shrimp, jellyfish, sea turtles', not_for: 'animals fixed to the sea floor (sessile)' },
  sessile:   { what: 'Fixed in place or barely mobile on the sea floor: sea urchins, mussels, oysters, clams, barnacles, anemones, sponges, corals, tube worms, limpets', not_for: 'starfish and sea cucumbers if the table treats them as crawling; free swimmers' },
};
const EYES = {
  prominent: { what: 'Eyes are a leading feature of the face and large for the head: owls, eagles, tree frogs, tarsiers, squirrels, mantises, dragonflies, cicadas, kinkajous, tree snakes', not_for: 'ordinary-sized eyes' },
  normal:    { what: 'Eyes are clearly visible and in ordinary proportion to the head: big cats, monkeys, parrots, deer, dogs, most birds and fish', not_for: 'eyes that dominate the face, or tiny eyes' },
  small:     { what: 'Eyes are noticeably small for the head and easy to overlook: elephants, rhinos, tapirs, boars, gorillas, sloths, anteaters, pangolins, large constrictor snakes, tarantulas', not_for: 'animals with no visible eyes' },
  hidden:    { what: 'No visible eyes in the normal depiction: termites, moles, ticks, earthworms, leeches, jellyfish, starfish, urchins, sea cucumbers, blind cave animals, larvae, bivalves', not_for: 'small but visible eyes' },
};

let rows = require(REF);
if (args.names) { const want = new Set(String(args.names).split(',').map((s) => s.trim())); rows = rows.filter((r) => want.has(r.name)); }
const offset = Number(args.offset || 0), limit = Number(args.limit || 0);
rows = rows.slice(offset, limit ? offset + limit : undefined);

function build(batch) {
  const state = { animals: {} };
  const questions = {}, keys = {};
  batch.forEach((r, i) => {
    const id = 'a' + i;
    state.animals[id] = { name: r.name, must_read: r.mustRead, note: r.note || null };
    questions['posture_' + id] = choice({
      question: 'For the real Earth animal `animals.' + id + '.name`, which posture should its anatomy reference row record as the animal\'s normal depicted pose?',
      focus: 'Use `must_read` and `note` as the description of how this species is meant to be drawn; judge the real animal, not the letters of its name.',
    }, POSTURE);
    keys['posture_' + id] = 'posture|' + r.name;
    questions['eyes_' + id] = choice({
      question: 'For the real Earth animal `animals.' + id + '.name`, how prominent are its eyes relative to its head in a normal side-on depiction?',
      focus: 'Judge the real animal. `must_read` may mention the eyes; if it does, weigh that description.',
    }, EYES);
    keys['eyes_' + id] = 'eyes|' + r.name;
  });
  return { state, questions, keys };
}

(async () => {
  const { answers, usage, dry } = await ts.runBatches({ name: 'reference-secondopinion', items: rows, batchSize: BATCH, build, args });
  if (dry) return;
  const out = [];
  for (const r of rows) {
    for (const field of ['posture', 'eyes']) {
      const a = answers[field + '|' + r.name];
      if (!a) continue;
      const stored = r[field];
      out.push({ name: r.name, field, stored, model: a.choice, confidence: +a.confidence.toFixed(3),
        p_model: +(a.probabilities[a.choice] || 0).toFixed(3), p_stored: +(a.probabilities[stored] || 0).toFixed(3), agree: a.choice === stored });
    }
  }
  const disagree = out.filter((x) => !x.agree).sort((a, b) => b.confidence - a.confidence);
  const strong = disagree.filter((x) => x.confidence >= MIN_CONF);
  const f = ts.saveReport('reference-secondopinion', { generated: new Date().toISOString(), minConfidence: MIN_CONF, usage, rows: out, disagree });
  console.log('REFERENCE SECOND OPINION  ' + rows.length + ' rows, ' + out.length + ' fields judged, ' + disagree.length
    + ' disagreements (' + strong.length + ' at confidence >= ' + MIN_CONF + ')');
  console.log('  ' + ts.usageLine(usage));
  if (disagree.length) {
    console.log('  name                        field    stored      model       conf   P(model) P(stored)');
    for (const x of disagree) {
      console.log('  ' + x.name.padEnd(27) + ' ' + x.field.padEnd(8) + ' ' + String(x.stored).padEnd(11) + ' ' + x.model.padEnd(11) + ' '
        + x.confidence.toFixed(2).padEnd(6) + ' ' + x.p_model.toFixed(2).padEnd(8) + ' ' + x.p_stored.toFixed(2) + (x.confidence >= MIN_CONF ? '   <-- STRONG' : ''));
    }
    console.log('  Each line is a SUSPECT. A human confirms before port/v2/reference/fauna.json changes.');
  }
  console.log('  report: ' + f);
  if (args.assert && strong.length) process.exit(1);
})().catch((e) => { console.error('reference-secondopinion failed: ' + (e && e.message || e)); process.exit(3); });
