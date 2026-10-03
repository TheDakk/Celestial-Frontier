// TypeSafe second opinion on the flora, fungi and microbe reference rows.
//
// port/v2/reference/flora.json (334 rows: name, form, aspect, leaf, leafColour, harvest, mustRead, note)
// and port/v2/reference/other.json (49 rows: fungi + microbe: name, kingdom, family, aspect, colour,
// mustRead, note, scale for microbes). The judge packets grade art against these rows, so a wrong `form`
// or `family` mis-grades every pass of that organism. This asks Jev (text-only) which vocabulary value
// the row SHOULD carry, from the name and the row's own descriptive text, and prints disagreements.
// Numbers (aspect) are not judged. A disagreement is a SUSPECT for a human — never auto-applied.
//
// Usage:
//   node tools/reference2-secondopinion.js --dry-run
//   node tools/reference2-secondopinion.js [--only flora|fungi|microbe] [--limit N --offset N] [--names "Banana,Amoeba"] [--min-confidence 0.8]
'use strict';
const path = require('path');
const { choice } = require('@typesafe-ai/sdk');
const ts = require('./typesafe-client');

const args = ts.parseArgs(process.argv.slice(2));
const BATCH = Number(args.batch || 20);
const MIN_CONF = Number(args['min-confidence'] || 0.8);
const REF = path.join(__dirname, '..', 'port', 'v2', 'reference');

// The vocabularies referencecheck.mjs admits, described by what the table files under each label.
const FORM = {
  tree:        { what: 'A woody plant with one clear trunk lifting a crown: oaks, pines, baobabs, eucalyptus, willows', not_for: 'palms, tree ferns, multi-stemmed shrubs' },
  shrub:       { what: 'A woody bush with many stems from the base and no single trunk: blueberry, heather, sagebrush, rhododendron, gorse', not_for: 'trees, herbs' },
  herb:        { what: 'A soft non-woody plant with leaves and stems (including tall herbs like banana and ginger): nettle, mint, sunflower, rhubarb', not_for: 'grasses, bulbs, rosettes, vines' },
  grass:       { what: 'Grasses, sedges, reeds, bamboo, cereals: narrow blades from the base, jointed stems, plumed or spiked heads', not_for: 'broad-leaved herbs' },
  vine:        { what: 'A woody or soft climber that needs support and trails or twines: grape, wisteria, ivy, hops, morning glory', not_for: 'clinging climbers filed as climber, epiphytes' },
  climber:     { what: 'A plant that climbs by tendrils, hooks or roots but is treated as its own form here: passionflower, clematis, rattan', not_for: 'twining vines (vine)' },
  succulent:   { what: 'Fleshy water-storing leaves or stems without spines: aloe, agave, jade plant, sedum, ice plant', not_for: 'cacti (spined, leafless)' },
  cactus:      { what: 'Spined, leafless, ribbed or padded stems: saguaro, prickly pear, barrel cactus, cholla', not_for: 'succulents with leaves' },
  palm:        { what: 'Palms and palm-like trees: one unbranched trunk crowned by fronds; coconut, date, cycads', not_for: 'tree ferns (fern), banana (herb)' },
  fern:        { what: 'Ferns and tree ferns: fronds unrolling from fiddleheads, no flowers', not_for: 'palms, mosses' },
  moss:        { what: 'Mosses, liverworts and moss-like carpets: low cushions or mats with no true stem', not_for: 'lichens (fungi), grasses' },
  seaweed:     { what: 'Marine algae: kelp, wrack, sea lettuce, nori — fronds and holdfasts under water', not_for: 'freshwater or floating plants (aquatic)' },
  aquatic:     { what: 'Freshwater or floating plants: water lily, lotus, duckweed, cattail, eelgrass, pondweed', not_for: 'marine algae (seaweed)' },
  epiphyte:    { what: 'Grows on other plants without soil: orchids, bromeliads, staghorn fern, Spanish moss', not_for: 'parasites that feed on the host' },
  bulb:        { what: 'Grows from an underground bulb or corm with leaves and a flower stalk: tulip, onion, lily, crocus, daffodil', not_for: 'tubers (potato), rosettes' },
  rosette:     { what: 'Leaves in a flat ground rosette with a central stalk: dandelion, plantain, agave-like ground rosettes, lettuce', not_for: 'bulbs, succulents' },
  tuber:       { what: 'Grown for or defined by an underground tuber or rhizome with leafy top: potato, yam, taro, ginger, cassava', not_for: 'bulbs' },
  parasite:    { what: 'Draws food from a host plant: mistletoe, dodder, rafflesia, broomrape', not_for: 'epiphytes that only perch' },
  carnivorous: { what: 'Traps and digests animals: Venus flytrap, pitcher plant, sundew, bladderwort', not_for: 'ordinary herbs' },
};
const FUNGI_FAM = {
  'cap-and-stem': { what: 'A classic mushroom: cap on a stem, gills or pores or ridges beneath', not_for: 'shelf fungi, puffballs' },
  shelf: { what: 'Bracket/shelf fungi jutting from wood with no stem: turkey tail, artist conk, chicken of the woods', not_for: 'capped mushrooms' },
  coral: { what: 'Branching upright coral-like fruiting bodies', not_for: 'club fungi (single unbranched club)' },
  puffball: { what: 'Round sac that puffs spores: puffballs, giant puffball', not_for: 'earthstars (split rays)' },
  earthstar: { what: 'A puffball whose outer wall splits into star rays', not_for: 'plain puffballs' },
  tooth: { what: 'Spines or teeth beneath: hedgehog fungus, lion\'s mane', not_for: 'gilled caps' },
  jelly: { what: 'Gelatinous rubbery lobes: wood ear, witch\'s butter', not_for: 'firm caps' },
  truffle: { what: 'Underground lumpy fruiting body', not_for: 'above-ground caps' },
  mold: { what: 'Fuzzy or powdery surface growth: bread mold, penicillium', not_for: 'yeasts (microbe), lichens' },
  lichen: { what: 'Fungus-alga crust, leaf or shrub on rock or bark', not_for: 'mosses (flora)' },
  'parasitic-club': { what: 'Club fungi sprouting from an insect or other host: cordyceps', not_for: 'free-living clubs' },
  cup: { what: 'Cup or disc fruiting bodies: scarlet elf cup, orange peel fungus', not_for: 'caps' },
  club: { what: 'Single unbranched club or finger: dead man\'s fingers, fairy club', not_for: 'branching coral' },
  stinkhorn: { what: 'Phallic or lattice stalk from an egg with slimy spore mass', not_for: 'morels' },
  morel: { what: 'Honeycomb-pitted conical cap on a stem: morel', not_for: 'stinkhorns' },
  'birds-nest': { what: 'Tiny cups holding egg-like spore capsules', not_for: 'plain cups' },
};
const MICROBE_FAM = {
  coccus: { what: 'Spherical bacteria, singly or in clusters/chains', not_for: 'rods' },
  rod: { what: 'Rod-shaped bacteria (bacilli)', not_for: 'spirals, filaments' },
  spiral: { what: 'Spiral or corkscrew bacteria: spirochetes, spirilla', not_for: 'rods' },
  filament: { what: 'Long unbranched filaments of cells: cyanobacteria strands, actinomycete threads', not_for: 'chains of distinct cells (chain)' },
  chain: { what: 'Beaded chains of distinct cells: streptococcus, some diatom chains', not_for: 'continuous filaments' },
  shelled: { what: 'Single cells with a hard shell or test: diatoms, foraminifera, radiolaria', not_for: 'naked cells' },
  flagellate: { what: 'Cells driven by one or a few whip flagella: euglena, trypanosome, dinoflagellate', not_for: 'ciliates' },
  ciliate: { what: 'Cells covered in beating cilia: paramecium, stentor, vorticella', not_for: 'flagellates' },
  amoeboid: { what: 'Shapeless cells moving by pseudopods: amoeba, slime mold plasmodium', not_for: 'shelled cells' },
  plated: { what: 'Cells armoured in plates or scales: armoured dinoflagellates, coccolithophores', not_for: 'diatoms (shelled)' },
  mat: { what: 'A sheet or biofilm of many cells: microbial mat, stromatolite surface, biofilm', not_for: 'single cells' },
  'micro-animal': { what: 'Multicellular microscopic animals: rotifer, tardigrade, nematode, water bear', not_for: 'single-celled protists' },
  'algal-cell': { what: 'Single-celled or colonial green algae: chlorella, volvox, spirogyra cells', not_for: 'cyanobacteria (filament/mat), diatoms (shelled)' },
  virus: { what: 'Virus particles: icosahedral capsids, phages with tails, helical rods', not_for: 'bacteria' },
};
const SCALE = {
  'single cell': { what: 'Depicted as one cell', not_for: 'colonies' },
  'small colony': { what: 'Depicted as a handful of cells together: a cluster, chain, or small colony', not_for: 'one cell, a whole field' },
  'field of many': { what: 'Depicted as a mass, mat, bloom or field of very many cells', not_for: 'a single cell or a small cluster' },
};

const only = args.only ? String(args.only) : null;
const flora = only && only !== 'flora' ? [] : require(path.join(REF, 'flora.json')).map((r) => ({ ...r, kingdom: 'flora' }));
const other = require(path.join(REF, 'other.json')).filter((r) => !only || r.kingdom === only);
let rows = [...flora, ...other];
if (args.names) { const want = new Set(String(args.names).split(',').map((s) => s.trim())); rows = rows.filter((r) => want.has(r.name)); }
const offset = Number(args.offset || 0), limit = Number(args.limit || 0);
rows = rows.slice(offset, limit ? offset + limit : undefined);

function build(batch) {
  const state = { organisms: {} };
  const questions = {}, keys = {};
  batch.forEach((r, i) => {
    const id = 'o' + i;
    const item = { name: r.name, kingdom: r.kingdom, must_read: r.mustRead, note: r.note || null };
    if (r.kingdom === 'flora') { item.leaf = r.leaf; item.harvest = r.harvest; }
    else item.colour = r.colour;
    state.organisms[id] = item;
    if (r.kingdom === 'flora') {
      questions['form_' + id] = choice({ question: 'Which growth form should the reference row for the real Earth plant `organisms.' + id + '.name` record?', focus: 'Judge the real plant; `leaf`, `harvest` and `must_read` describe how it is drawn. Pick the single best-fitting form.' }, FORM);
      keys['form_' + id] = 'form|' + r.name;
    } else if (r.kingdom === 'fungi') {
      questions['family_' + id] = choice({ question: 'Which fruiting-body family does the real fungus `organisms.' + id + '.name` belong to?', focus: 'Judge the real fungus; `must_read` describes how it is drawn.' }, FUNGI_FAM);
      keys['family_' + id] = 'family|' + r.name;
    } else {
      questions['family_' + id] = choice({ question: 'Which morphology family does the real microbe `organisms.' + id + '.name` belong to?', focus: 'Judge the real organism; `must_read` describes how it is drawn.' }, MICROBE_FAM);
      keys['family_' + id] = 'family|' + r.name;
      questions['scale_' + id] = choice({ question: 'At what scale is the microbe `organisms.' + id + '.name` normally depicted?', focus: 'Use `must_read`: one cell, a small cluster or chain, or a whole mat/bloom/field.' }, SCALE);
      keys['scale_' + id] = 'scale|' + r.name;
    }
  });
  return { state, questions, keys };
}

(async () => {
  const { answers, usage, dry } = await ts.runBatches({ name: 'reference2-secondopinion', items: rows, batchSize: BATCH, build, args });
  if (dry) return;
  const out = [];
  for (const r of rows) {
    const fields = r.kingdom === 'flora' ? ['form'] : r.kingdom === 'fungi' ? ['family'] : ['family', 'scale'];
    for (const field of fields) {
      const a = answers[field + '|' + r.name]; if (!a) continue;
      const stored = r[field];
      out.push({ name: r.name, kingdom: r.kingdom, field, stored, model: a.choice, confidence: +a.confidence.toFixed(3),
        p_model: +(a.probabilities[a.choice] || 0).toFixed(3), p_stored: +(a.probabilities[stored] || 0).toFixed(3), agree: a.choice === stored });
    }
  }
  const disagree = out.filter((x) => !x.agree).sort((a, b) => b.confidence - a.confidence);
  const strong = disagree.filter((x) => x.confidence >= MIN_CONF);
  const f = ts.saveReport('reference2-secondopinion', { generated: new Date().toISOString(), minConfidence: MIN_CONF, usage, rows: out, disagree });
  console.log('REFERENCE2 SECOND OPINION (flora/fungi/microbe)  ' + rows.length + ' rows, ' + out.length + ' fields judged, ' + disagree.length + ' disagreements (' + strong.length + ' at confidence >= ' + MIN_CONF + ')');
  console.log('  ' + ts.usageLine(usage));
  if (disagree.length) {
    console.log('  name                        kingdom  field    stored          model           conf   P(model) P(stored)');
    for (const x of disagree) console.log('  ' + x.name.padEnd(27) + ' ' + x.kingdom.padEnd(8) + ' ' + x.field.padEnd(8) + ' ' + String(x.stored).padEnd(15) + ' ' + x.model.padEnd(15) + ' ' + x.confidence.toFixed(2).padEnd(6) + ' ' + x.p_model.toFixed(2).padEnd(8) + ' ' + x.p_stored.toFixed(2) + (x.confidence >= MIN_CONF ? '   <-- STRONG' : ''));
    console.log('  Each line is a SUSPECT. A human confirms before flora.json / other.json change.');
  }
  console.log('  report: ' + f);
  if (args.assert && strong.length) process.exit(1);
})().catch((e) => { console.error('reference2-secondopinion failed: ' + (e && e.message || e)); process.exit(3); });
