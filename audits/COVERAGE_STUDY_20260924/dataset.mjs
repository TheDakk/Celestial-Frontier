// Coverage study dataset (2026-09-24): every Earth fauna species (reference/fauna.json) with its presentation profile group,
// its body-plan template (the profile's first candidate) and the painted archetype that would STAND IN for it through the
// morph system, plus the species' mustRead features — the judgment rubric. Run from port/v2:
//   node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs ../../audits/COVERAGE_STUDY_20260924/dataset.mjs
import fs from 'node:fs'; import path from 'node:path';
const { EARTH_FAUNA_PROFILES, earthFaunaProfile } = await import('../../port/v2/apps/game/src/earth-fauna-profiles.ts');
const { CARD_ARCHETYPES } = await import('../../port/v2/apps/game/src/morph/card-archetypes.ts');
const R = path.resolve(import.meta.dirname, '../..'), fauna = JSON.parse(fs.readFileSync(path.join(R, 'port/v2/reference/fauna.json'), 'utf8'));
// the painted archetype per body plan (the sprint's exemplar; the Civet for quadrupeds, the plain Crab for brachyurans)
const STAND_IN = { brachyuran: 'Crab', quadruped: 'Civet', fish: 'Salmon', 'biped-bird': 'Eagle', insect: 'Beetle', serpent: 'Python', hopper: 'Tree Frog', primate: 'Chimpanzee', radial: 'Starfish', arachnid: 'Tarantula', cephalopod: 'Octopus', 'flyer-membrane': 'Fruit Bat', myriapod: 'Centipede' };
const painted = new Set(CARD_ARCHETYPES.map((a) => a.earthName));
const rows = fauna.map((f) => { const p = earthFaunaProfile(f.name), template = p?.candidateTemplates?.[0] ?? null;
  return { name: f.name, group: p?.id ?? null, template, candidateTemplates: p?.candidateTemplates ?? [], media: p?.media ?? [], standIn: template ? STAND_IN[template] ?? null : null, painted: painted.has(f.name), posture: f.posture ?? null, aspect: f.aspect ?? null, headFrac: f.headFrac ?? null, eyes: f.eyes ?? null, mustRead: f.mustRead ?? [], note: f.note ?? '' }; });
const byStandIn = {}; for (const r of rows) (byStandIn[r.standIn ?? '(none)'] ??= []).push(r.name);
const summary = { species: rows.length, painted: rows.filter((r) => r.painted).length, noProfile: rows.filter((r) => !r.group).map((r) => r.name), noStandIn: rows.filter((r) => !r.standIn).map((r) => `${r.name} (${r.template})`), perStandIn: Object.fromEntries(Object.entries(byStandIn).map(([k, v]) => [k, v.length]).sort((a, b) => b[1] - a[1])), profiles: EARTH_FAUNA_PROFILES.length };
fs.writeFileSync(path.join(import.meta.dirname, 'dataset.json'), JSON.stringify({ schema: 'cf.coverage-dataset/v1', standIn: STAND_IN, summary, rows }, null, 1) + '\n');
console.log(JSON.stringify(summary, null, 1).slice(0, 2500));
