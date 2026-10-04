// TypeSafe second opinion on PROCEDURAL species: the seeded genome → descriptor text the game
// generates for every non-Earth organism. Samples N seeds through the game's own generators
// (tools/procedural-probe.js in the jsdom probe realm — same code the player sees, deterministic)
// and asks Jev, from the words alone:
//   consistent  — do body, locomotion, habitat, senses and metabolism fit one animal? (a "serpentine
//                 swimmer" living in "the deep forest canopy" does not)
//   medium      — which medium the description implies (land / water / air / underground / canopy)
//                 — reported beside the habitat text so mismatches stand out
//   sapient     — does the text read as an intelligent species? — compared with classifyRealm's label
//   grammar     — an article/agreement/wording defect ("A omnivore") in the generated sentence
// Determinism, rarity, stats and art are code gates and are not judged here. Suspects for a human.
//
// Usage:
//   node tools/procedural-secondopinion.js --dry-run
//   node tools/procedural-secondopinion.js [--species 120] [--seed 7331] [--min 0.7]
'use strict';
const { choice, noul } = require('@typesafe-ai/sdk');
const ts = require('./typesafe-client');
const { bootProbe } = require('./_probeboot.js');

const args = ts.parseArgs(process.argv.slice(2));
const BATCH = Number(args.batch || 15);
const MIN = Number(args.min || 0.7);
const N = Number(args.species || 120), SEED = Number(args.seed || 7331);

const MEDIUM = {
  land: { what: 'Lives and moves on solid ground: walks, runs, hops, slithers on land', not_for: 'swimmers, fliers, burrowers, tree-dwellers' },
  water: { what: 'Lives in water: swims, drifts, filters, clings under water', not_for: 'land animals that only drink or wade' },
  air: { what: 'Flies or glides through the air as its main way of moving', not_for: 'canopy climbers that do not fly' },
  underground: { what: 'Burrows and lives mainly under the ground', not_for: 'surface walkers' },
  canopy: { what: 'Lives in trees or a forest canopy by climbing, brachiating or perching (not flying)', not_for: 'fliers, ground animals' },
  none: { what: 'Not an animal that moves: a plant, fungus, microbe, or a sessile organism', not_for: 'moving animals' },
};

(async () => {
  const { value, errors } = await bootProbe({ probe: 'procedural-probe.js', global: '__PROC__', quiet: true, pre: (w) => { w.__PROC_CFG__ = { species: N, systems: 0, seed: SEED }; } });
  if (!value || value.error) throw new Error('probe failed: ' + (value && value.error) + ' ' + errors.join('; '));
  if (value.errors.length) console.log('probe errors: ' + value.errors.join(' | '));
  const items = value.species.map((r) => ({ ...r, id: r.kingdom + ':' + r.seed }));
  const build = (batch) => {
    const state = { species: {} }; const questions = {}, keys = {};
    batch.forEach((r, i) => {
      const id = 's' + i, d = r.description || {};
      state.species[id] = { kingdom: r.kingdom, name: d.name, summary: d.desc, anatomy: d.anatomy || null, habitat: d.habitat || r.realmBiome, behavior: d.behavior || null, senses: d.sense || null, metabolism: d.metab || null, reproduction: d.repro || null, lifespan: d.life || null, diet: d.diet || null, card_text: d.detail };
      questions[id + '_consistent'] = noul({ question: 'Do the fields of the organism at `species.' + id + '` describe ONE coherent organism — body, way of moving, habitat, senses, metabolism and diet all compatible with each other?', focus: 'Alien biology is allowed; judge internal consistency only. No if the way of moving contradicts the habitat (a swimmer in a treetop canopy, a burrower in open sea), or two fields flatly conflict.' });
      keys[id + '_consistent'] = 'consistent|' + r.id;
      questions[id + '_grammar'] = noul({ question: 'Does `species.' + id + '.card_text` contain a grammatical error, wrong article ("a" before a vowel sound, "an" before a consonant), broken agreement, or an obviously malformed sentence?', focus: 'Judge the English only; invented names and alien biology are fine.' });
      keys[id + '_grammar'] = 'grammar|' + r.id;
      if (r.kingdom === 'fauna') {
        questions[id + '_medium'] = choice({ question: 'From `species.' + id + '.summary` and `.anatomy`, which medium does this animal live and move in?', focus: 'Read the body and way of moving in the words themselves (swimmers, fliers, climbers, burrowers, walkers), not the habitat field.' }, MEDIUM);
        keys[id + '_medium'] = 'medium|' + r.id;
        questions[id + '_sapient'] = noul({ question: 'Does the text at `species.' + id + '` read as an intelligent, sapient species (tool use, language, culture, deliberate communication beyond animal signalling)?', focus: 'Yes only if intelligence is stated or clearly implied by the words; senses and calls alone are not sapience.' });
        keys[id + '_sapient'] = 'sapient|' + r.id;
      }
    });
    return { state, questions, keys };
  };
  const { answers, usage, dry } = await ts.runBatches({ name: 'procedural-secondopinion', items, batchSize: BATCH, build, args });
  if (dry) { process.exit(0); }
  const rows = items.map((r) => {
    const g = (k) => answers[k + '|' + r.id];
    const c = g('consistent'), gr = g('grammar'), m = g('medium'), s = g('sapient');
    const habitatWater = /sea|ocean|reef|water|lake|river|tide|abyss|lagoon|swamp|marsh|kelp|coral|shallows|vent/i.test(String(r.description && r.description.habitat || ''));
    const habitatCanopy = /canopy|tree|forest|branch|grove/i.test(String(r.description && r.description.habitat || ''));
    return { id: r.id, kingdom: r.kingdom, name: r.description && r.description.name, summary: r.description && r.description.desc, habitat: r.description && r.description.habitat, classifyRealm: r.classifyRealm, ecologyRole: r.ecologyRole,
      p_consistent: c ? +Number(c.noul).toFixed(3) : null, p_grammar_error: gr ? +Number(gr.noul).toFixed(3) : null,
      medium: m ? m.choice : null, medium_conf: m ? +m.confidence.toFixed(3) : null, p_sapient: s ? +Number(s.noul).toFixed(3) : null,
      classifiedIntelligent: /intelligent|sapient|civil/i.test(String(r.classifyRealm || '')),
      mediumSuspect: m && ((m.choice === 'water' && !habitatWater && r.description && !/water|sea|ocean|lake|river/i.test(String(r.description.habitat))) || (m.choice === 'canopy' && habitatWater) || (m.choice === 'land' && habitatWater && !/shore|coast|beach|tide/i.test(String(r.description.habitat)))) ? true : false,
      card_text: r.description && r.description.detail };
  });
  const inconsistent = rows.filter((r) => r.p_consistent !== null && r.p_consistent <= 1 - MIN).sort((a, b) => a.p_consistent - b.p_consistent);
  const grammar = rows.filter((r) => r.p_grammar_error !== null && r.p_grammar_error >= MIN).sort((a, b) => b.p_grammar_error - a.p_grammar_error);
  const medium = rows.filter((r) => r.mediumSuspect && (r.medium_conf || 0) >= MIN);
  const sapience = rows.filter((r) => r.p_sapient !== null && ((r.p_sapient >= MIN) !== r.classifiedIntelligent));
  const f = ts.saveReport('procedural-secondopinion', { generated: new Date().toISOString(), seed: SEED, species: N, min: MIN, usage, rows, inconsistent, grammar, medium, sapience });
  console.log('PROCEDURAL SECOND OPINION  ' + rows.length + ' generated species (seed ' + SEED + '); ' + inconsistent.length + ' inconsistent, ' + grammar.length + ' grammar, ' + medium.length + ' medium-vs-habitat, ' + sapience.length + ' sapience-label suspects at P >= ' + MIN);
  console.log('  ' + ts.usageLine(usage));
  const show = (label, list, fmt) => { console.log('  ' + label + ':'); for (const r of list.slice(0, 30)) console.log('    ' + fmt(r)); };
  show('inconsistent organisms (P(consistent) <= ' + (1 - MIN).toFixed(2) + ')', inconsistent, (r) => String(r.p_consistent).padEnd(6) + r.kingdom.padEnd(8) + String(r.name).padEnd(14) + ' ' + String(r.summary).slice(0, 60) + ' · in ' + String(r.habitat).slice(0, 30));
  show('grammar suspects', grammar, (r) => String(r.p_grammar_error).padEnd(6) + String(r.name).padEnd(14) + ' ' + String(r.card_text).slice(0, 110));
  show('medium vs habitat', medium, (r) => r.medium.padEnd(8) + String(r.name).padEnd(14) + ' ' + String(r.summary).slice(0, 60) + ' · in ' + String(r.habitat).slice(0, 30));
  show('sapience label vs text', sapience, (r) => ('P=' + r.p_sapient).padEnd(8) + String(r.classifyRealm).padEnd(26) + String(r.name).padEnd(14) + ' ' + String(r.summary).slice(0, 60));
  console.log('  Each line is a SUSPECT for the descriptor owner; determinism, rarity and stats are not judged here.');
  console.log('  report: ' + f);
})().then(() => process.exit(0)).catch((e) => { console.error('procedural-secondopinion failed: ' + (e && e.message || e)); process.exit(3); });
