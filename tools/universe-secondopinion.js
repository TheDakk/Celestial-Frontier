// TypeSafe second opinion on the UNIVERSE descriptors: the star, planet and moon survey cards the game
// generates from seeds (tools/procedural-probe.js samples them through the game's own generators in
// the jsdom probe realm). Jev reads the card ROWS (label → value text) and the planet's generation
// parameters and answers, from the words alone:
//   rows_consistent — do the rows agree with each other? (airless but has weather; boiled-away water
//                     but oceans; a red dwarf hotter than a blue giant)
//   band            — which climate band the rows imply (hot / temperate / cold) — compared with the
//                     band the code computed for that orbit
//   params_match    — does the text agree with the parameters (type, rings, moon count)?
// Orbital mechanics, seeds and numbers stay code gates. Suspects for a human.
//
// Usage:
//   node tools/universe-secondopinion.js --dry-run
//   node tools/universe-secondopinion.js [--systems 12] [--min 0.7]
'use strict';
const { choice, noul } = require('@typesafe-ai/sdk');
const ts = require('./typesafe-client');
const { bootProbe } = require('./_probeboot.js');

const args = ts.parseArgs(process.argv.slice(2));
const BATCH = Number(args.batch || 10);
const MIN = Number(args.min || 0.7);
const N = Number(args.systems || 12);
const BAND = { hot: { what: 'Scorching or very hot surface: boiled-away water, lava, searing days', not_for: 'mild or frozen worlds' }, temperate: { what: 'Mild to warm surface where liquid water can persist', not_for: 'searing or frozen worlds' }, cold: { what: 'Frozen or frigid surface: ice, permafrost, frozen seas', not_for: 'mild or hot worlds' } };
const rowsOf = (d) => Object.fromEntries((d && d.rows || []).map((r) => [r[0], r[1]]));

(async () => {
  const { value, errors } = await bootProbe({ probe: 'procedural-probe.js', global: '__PROC__', quiet: true, pre: (w) => { w.__PROC_CFG__ = { species: 0, systems: N, seed: 1 }; } });
  if (!value || value.error) throw new Error('probe failed: ' + (value && value.error) + ' ' + errors.join('; '));
  if (value.errors.length) console.log('probe errors: ' + value.errors.join(' | '));
  const items = [];
  for (const sys of value.systems) {
    items.push({ id: 'star:' + sys.seed, kind: 'star', title: sys.star.descriptor.title, sub: sys.star.descriptor.sub, rows: rowsOf(sys.star.descriptor), params: { starKind: sys.star.descriptor.starKind, binary: sys.star.descriptor.binary } });
    for (const p of sys.planets) {
      items.push({ id: 'planet:' + sys.seed + ':' + p.params.seed, kind: 'planet', title: p.descriptor.title, sub: p.descriptor.sub, rows: rowsOf(p.descriptor), params: { type: p.params.type, sizeMul: p.params.sizeMul, ring: p.params.ring, moons: p.params.moons, orbit: p.orb }, climateBand: p.climateBand });
      for (const [k, m] of (p.moons || []).entries()) items.push({ id: 'moon:' + sys.seed + ':' + p.params.seed + ':' + k, kind: 'moon', title: m.title, sub: m.sub, rows: rowsOf(m), params: {} });
    }
  }
  const build = (batch) => {
    const state = { bodies: {} }; const questions = {}, keys = {};
    batch.forEach((b, i) => {
      const id = 'b' + i;
      state.bodies[id] = { kind: b.kind, title: b.title, subtitle: b.sub, rows: b.rows, parameters: b.params };
      questions[id + '_rows'] = noul({ question: 'Do the survey rows of the body at `bodies.' + id + '` agree with each other and with its subtitle?', focus: 'Yes if the rows describe one physically coherent world or star. No for a flat conflict: weather or seasons on an airless world, oceans where water has boiled away, life where the surface is molten, a temperature or fate that does not fit the stated class.' });
      keys[id + '_rows'] = 'rows|' + b.id;
      questions[id + '_params'] = noul({ question: 'Do the survey rows and subtitle of `bodies.' + id + '` agree with its `parameters` (type, rings, number of moons, star class)?', focus: 'Parameters are the generator\'s facts; yes if the words fit them, no if the text names a different kind of body, ring state, or count.' });
      keys[id + '_params'] = 'params|' + b.id;
      if (b.kind === 'planet') { questions[id + '_band'] = choice({ question: 'Which climate band do the rows of `bodies.' + id + '` describe?', focus: 'Use the Climate, Water, Atmosphere and Weather rows.' }, BAND); keys[id + '_band'] = 'band|' + b.id; }
    });
    return { state, questions, keys };
  };
  const { answers, usage, dry } = await ts.runBatches({ name: 'universe-secondopinion', items, batchSize: BATCH, build, args });
  if (dry) { process.exit(0); }
  const rows = items.map((b) => { const r = answers['rows|' + b.id], p = answers['params|' + b.id], band = answers['band|' + b.id]; return { id: b.id, kind: b.kind, title: b.title, sub: b.sub, p_rows_consistent: r ? +Number(r.noul).toFixed(3) : null, p_params_match: p ? +Number(p.noul).toFixed(3) : null, bandModel: band ? band.choice : null, bandConf: band ? +band.confidence.toFixed(3) : null, bandCode: b.climateBand || null, params: b.params }; });
  const rowsBad = rows.filter((r) => r.p_rows_consistent !== null && r.p_rows_consistent <= 1 - MIN).sort((a, b) => a.p_rows_consistent - b.p_rows_consistent);
  const paramsBad = rows.filter((r) => r.p_params_match !== null && r.p_params_match <= 1 - MIN).sort((a, b) => a.p_params_match - b.p_params_match);
  const bandBad = rows.filter((r) => r.bandModel && r.bandCode && r.bandModel !== r.bandCode && (r.bandConf || 0) >= MIN);
  const f = ts.saveReport('universe-secondopinion', { generated: new Date().toISOString(), systems: N, min: MIN, usage, rows, rowsBad, paramsBad, bandBad });
  console.log('UNIVERSE SECOND OPINION  ' + rows.length + ' bodies (' + rows.filter((r) => r.kind === 'star').length + ' stars, ' + rows.filter((r) => r.kind === 'planet').length + ' planets, ' + rows.filter((r) => r.kind === 'moon').length + ' moons); ' + rowsBad.length + ' row-conflict, ' + paramsBad.length + ' text-vs-parameter, ' + bandBad.length + ' climate-band suspects at P >= ' + MIN);
  console.log('  ' + ts.usageLine(usage));
  const show = (label, list, fmt) => { console.log('  ' + label + ':'); for (const r of list.slice(0, 30)) console.log('    ' + fmt(r)); };
  show('rows that conflict with each other', rowsBad, (r) => String(r.p_rows_consistent).padEnd(6) + r.kind.padEnd(7) + String(r.title).padEnd(22) + ' ' + String(r.sub).slice(0, 40));
  show('text vs parameters', paramsBad, (r) => String(r.p_params_match).padEnd(6) + r.kind.padEnd(7) + String(r.title).padEnd(22) + ' ' + JSON.stringify(r.params).slice(0, 70));
  show('climate band: text vs code', bandBad, (r) => (r.bandModel + ' vs ' + r.bandCode).padEnd(22) + String(r.title).padEnd(22) + ' ' + String(r.sub).slice(0, 40));
  console.log('  Each line is a SUSPECT for the descriptor owner; orbits, seeds and numbers are not judged here.');
  console.log('  report: ' + f);
})().then(() => process.exit(0)).catch((e) => { console.error('universe-secondopinion failed: ' + (e && e.message || e)); process.exit(3); });
