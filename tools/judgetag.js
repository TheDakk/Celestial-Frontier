// Tag art-judge verdict prose with the audit's defect columns, via TypeSafe.
//
// The GOLD-pass judge (a vision agent reading strip PNGs) writes one JSON per
// batch under <smoke>/<run>/judge/*.json with rows { species, set, band,
// readsAs, defect, fix }. The `defect` and `fix` fields are free prose. Nick's
// own audit engine grades the same assets with PASS/FAIL columns per body part
// (body_plan, torso, head, eyes, legs_wings_appendages, rear_tail_flukes,
// signature_traits for fauna; growth-form columns for flora; cap/stem columns
// for fungi). This tool asks Jev one Noul ("does the verdict fault this part?")
// per column over each POLISH/FAIL row, so the two audits can be joined on the
// same columns and the fix queue grouped by what is actually wrong.
//
// Jev is text-only: it reads the judge's WORDS, it never sees the PNG. A tag is
// "the judge said the head is wrong", not "the head is wrong".
//
// Usage:
//   node tools/judgetag.js --dir C:/Projects/Celestial-Frontier/port/v2/apps/game/smoke/goldpass3-prechassis --dry-run
//   node tools/judgetag.js --dir <run dir or smoke root> [--bands FAIL,POLISH] [--limit 50] [--min 0.5]
'use strict';
const fs = require('fs');
const path = require('path');
const { noul } = require('@typesafe-ai/sdk');
const ts = require('./typesafe-client');

const args = ts.parseArgs(process.argv.slice(2));
if (!args.dir) { console.log('usage: node tools/judgetag.js --dir <smoke run dir> [--dry-run]'); process.exit(2); }
const BANDS = new Set(String(args.bands || 'FAIL,POLISH').split(',').map((s) => s.trim().toUpperCase()));
const MIN = Number(args.min || 0.5);
const BATCH = Number(args.batch || 8);

// Column vocabularies — the same names as Nick's one-by-one audit CSV
// (port/v2/reference/nick-onebyone/engine_data/*.csv) so the tag table joins to it.
const COLUMNS = {
  fauna: {
    body_plan:             'the overall body plan or silhouette class is wrong (reads as a different kind of animal, wrong number of limbs, wrong basic shape)',
    torso:                 'the torso, body mass, back line, or bulk is wrong',
    head:                  'the head, skull, snout, muzzle, beak, jaw, ears, horns, antlers or crest is wrong or missing',
    eyes:                  'the eyes are wrong: missing, wrong size, wrong placement, wrong pupil, wrong prominence',
    legs_wings_appendages: 'legs, wings, fins, flippers, arms, claws, tentacles or other limbs are wrong or missing',
    rear_tail_flukes:      'the tail, flukes, rear or hindquarters are wrong or missing',
    signature_traits:      'a diagnostic identity feature of this species (pattern, markings, trunk, tusks, mane, shell, frill, spots, stripes, colour) is missing or wrong',
  },
  flora: {
    overall_growth_form:        'the overall growth form or plant architecture is wrong (tree vs shrub vs herb vs vine vs rosette, branching, habit)',
    roots_or_attachment:        'roots, base, tuft, bulb or attachment to the ground are wrong or missing',
    stem_trunk:                 'the stem, stalk, trunk or scape is wrong (thickness, straightness, bare vs leafy, branching)',
    leaves_fronds:              'leaves, fronds, needles or blades are wrong (shape, margin, arrangement, size, count, position)',
    flower_fruit_spore_harvest: 'the flower, inflorescence, fruit, cone, seed head or harvest part is wrong, too small, or missing',
    scale_and_silhouette:       'proportions, scale between parts, or the overall silhouette are wrong',
  },
  fungi: {
    fruiting_body_family:     'the fruiting body reads as the wrong kind of fungus (cap-and-stem vs bracket vs puffball vs cup vs coral)',
    cap_body:                 'the cap or main body shape, margin, gills or pores are wrong',
    stem_attachment_substrate: 'the stem, ring, volva, or attachment to the substrate is wrong',
    surface_spores_texture:   'the surface texture, scales, slime, spores or colour are wrong',
  },
  microbe: {
    cell_or_body_morph: 'the cell or body morphology is wrong (shape, flagella, cilia, colony form, symmetry)',
  },
};
// shared across all sets
const SHARED = {
  shared_chassis: 'the verdict says the asset shares a generic family chassis or template with sibling species instead of having its own identity',
  scale_error:    'the verdict faults size or proportion of a part relative to the whole (too small, too large, inverted proportions)',
};

function setKind(set) {
  const s = String(set || '').toLowerCase();
  if (s.includes('flora') || s.includes('plant')) return 'flora';
  if (s.includes('fung')) return 'fungi';
  if (s.includes('microbe') || s.includes('micro')) return 'microbe';
  return 'fauna';
}

function collectRows(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name === 'judge' || d.endsWith('judge') || !/judge/.test(d)) walk(p); continue; }
      if (!/judge[\\/][^\\/]+\.json$/.test(p)) continue;
      let j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e2) { continue; }
      for (const r of j.rows || []) {
        if (!BANDS.has(String(r.band || '').toUpperCase())) continue;
        out.push({ file: path.relative(dir, p), family: j.family, species: r.species, set: r.set, band: r.band,
          readsAs: r.readsAs || '', defect: r.defect || '', fix: r.fix || '' });
      }
    }
  };
  walk(dir);
  return out;
}

let rows = collectRows(args.dir);
if (args.limit) rows = rows.slice(0, Number(args.limit));
if (!rows.length) { console.log('no judge rows found under ' + args.dir + ' for bands ' + [...BANDS].join(',')); process.exit(0); }

function build(batch) {
  const state = { verdicts: {} };
  const questions = {}, keys = {};
  batch.forEach((r, i) => {
    const id = 'v' + i;
    state.verdicts[id] = { species: r.species, kind: setKind(r.set), reads_as: r.readsAs, defect: r.defect, required_fix: r.fix };
    const cols = Object.assign({}, COLUMNS[setKind(r.set)], SHARED);
    for (const [col, meaning] of Object.entries(cols)) {
      const qid = id + '_' + col;
      questions[qid] = noul({
        question: 'In the art-judge verdict at `verdicts.' + id + '`, does the judge say that ' + meaning + '?',
        focus: 'Answer from the `defect` and `required_fix` text only. Yes only if that part is explicitly faulted or its rebuild is explicitly required; a part described as correct or not mentioned is no.',
      });
      keys[qid] = 'tag|' + r.file + '|' + r.species + '|' + col;
    }
  });
  return { state, questions, keys };
}

(async () => {
  const { answers, usage, dry } = await ts.runBatches({ name: 'judgetag', items: rows, batchSize: BATCH, build, args });
  if (dry) return;
  const tagged = [];
  const counts = {};
  for (const r of rows) {
    const kind = setKind(r.set);
    const cols = Object.assign({}, COLUMNS[kind], SHARED);
    const tags = {};
    for (const col of Object.keys(cols)) {
      const a = answers['tag|' + r.file + '|' + r.species + '|' + col];
      if (!a) continue;
      const p = typeof a.noul === 'number' ? a.noul : 0;   // NoulResponse.noul = P(yes)
      tags[col] = +p.toFixed(3);
      if (p >= MIN) { const k = kind + '.' + col; counts[k] = (counts[k] || 0) + 1; }
    }
    tagged.push(Object.assign({}, r, { kind, tags }));
  }
  const f = ts.saveReport('judgetag', { generated: new Date().toISOString(), dir: args.dir, bands: [...BANDS], min: MIN, usage, counts, rows: tagged });
  console.log('JUDGE TAGS  ' + tagged.length + ' rows tagged from ' + args.dir);
  console.log('  ' + ts.usageLine(usage));
  console.log('  faulted-part counts (P >= ' + MIN + '):');
  for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log('    ' + k.padEnd(36) + n);
  console.log('  per row (parts at P >= ' + MIN + '):');
  for (const t of tagged) {
    const on = Object.entries(t.tags).filter(([, p]) => p >= MIN).map(([c, p]) => c + ':' + p.toFixed(2)).join(' ');
    console.log('    ' + String(t.band).padEnd(7) + t.species.padEnd(24) + on);
  }
  console.log('  report: ' + f);
})().catch((e) => { console.error('judgetag failed: ' + (e && e.message || e)); process.exit(3); });
