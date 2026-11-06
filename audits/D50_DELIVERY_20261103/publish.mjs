// D50 publisher: certified species -> game archetype rows. Run from the repo root:
//   node audits/D50_DELIVERY_20261103/publish.mjs --slice "Snowshoe Hare,Isopod"   |   --all
// For each species it takes the LATEST certified registry row (resolved.json, by the fit's own identity.earthName), re-verifies the
// exact record/binding bytes its certifying film bound, restores the authentic master byte-for-byte at the path the record names
// (from the tracked master with the same sha; the fit-side copy is an ignored regenerable), copies the film's contact-support
// setting, and writes port/v2/tools/morph/delivered-archetypes.json. It never edits a fit, record, binding or test.
// Ignored fit files the game build reads are listed in force-add.txt (git add -f) so a fresh clone can rebuild and test.
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto';
import { repoRelativeSource } from '../../port/v2/tools/creature-animation/record-source.mjs';
const sha = (f) => createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const need = (c, m) => { if (!c) throw Error('refuse: ' + m); };
const OUT = 'port/v2/tools/morph/delivered-archetypes.json', HERE = 'audits/D50_DELIVERY_20261103/';
const arg = process.argv.slice(2), all = arg.includes('--all'), slice = arg.includes('--slice') ? arg[arg.indexOf('--slice') + 1].split(',').map((s) => s.trim()) : null;
need(all !== !!slice, 'pass exactly one of --all / --slice');
// FINISH F3 (2026-11-04): every row carries its delivery batch; rows published before batches existed are D50 tier 2.
const batch = arg.includes('--batch') ? arg[arg.indexOf('--batch') + 1] : 'd50-tier2'; need(/^[a-z0-9-]+$/.test(batch), 'bad --batch');
const literal = fs.readFileSync('port/v2/tools/morph/build-card-masters.mjs', 'utf8');
const literalNames = new Set([...literal.matchAll(/earthName: '([^']+)', dir:/g)].map((m) => m[1])), literalKeys = new Set([...literal.matchAll(/key: '([^']+)'/g)].map((m) => m[1]));
const rows = JSON.parse(fs.readFileSync(HERE + 'resolved.json', 'utf8')).rows.filter((r) => r.status === 'RESOLVED');
const latest = new Map(); for (const r of rows) { const rec = JSON.parse(fs.readFileSync(r.fit + 'record.json', 'utf8')); latest.set(rec.identity.earthName, { ...r, earthName: rec.identity.earthName, rec }); }
const want = all ? [...latest.keys()].filter((n) => !literalNames.has(n)) : slice;
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).rows : [];
const byName = new Map(prev.map((p) => [p.earthName, p])), forceAdd = new Set();
const kebab = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const name of want) {
  const r = latest.get(name); need(r, 'no certified resolved fit for ' + name); need(!literalNames.has(name), name + ' is already a hand-listed archetype');
  need(sha(r.fit + 'record.json') === r.recordSha256 && sha(r.fit + 'binding.json') === r.bindingSha256, name + ': fit bytes differ from the certifying film');
  const binding = JSON.parse(fs.readFileSync(r.fit + 'binding.json', 'utf8')); need(binding.recordRecipeHash === r.rec.recipeHash, name + ': binding sealed for another record');
  const masterPath = repoRelativeSource(r.rec.source); need(masterPath.startsWith('audits/'), name + ': master outside audits');
  if (!fs.existsSync(masterPath)) { need(sha(r.master) === r.masterSha256, name + ': authentic master changed'); fs.mkdirSync(path.dirname(masterPath), { recursive: true }); fs.copyFileSync(r.master, masterPath); }
  need(sha(masterPath) === r.masterSha256, name + ': master at record.source is not the certified master');
  const man = JSON.parse(fs.readFileSync(r.fit + 'parts/manifest.json', 'utf8'));
  for (const f of ['record.json', 'binding.json', 'parts/keyed.png', 'parts/manifest.json', 'parts/atlas/' + man.creatureId + '.png', 'labels.png', 'declaration.json']) if (fs.existsSync(r.fit + f)) forceAdd.add(r.fit + f);
  forceAdd.add(masterPath);
  const script = JSON.parse(fs.readFileSync(r.nativeDir + '/report.json', 'utf8')).script ?? {};
  let key = kebab(name); need(!literalKeys.has(key), name + ': key collides with a hand-listed archetype');
  byName.set(name, { earthName: name, dir: r.fit, key, batch, ...(script.supports === 'observed' ? { contactSupports: 'observed' } : {}),
    certifiedBy: { nativeDir: r.nativeDir, family: r.family, recordSha256: r.recordSha256, bindingSha256: r.bindingSha256, masterSha256: r.masterSha256 } });
}
const keys = new Set(); for (const p of byName.values()) { need(!keys.has(p.key), 'duplicate key ' + p.key); keys.add(p.key); }
for (const p of byName.values()) if (!p.batch) p.batch = 'd50-tier2';
const out = [...byName.values()].sort((a, b) => (a.earthName < b.earthName ? -1 : 1));
fs.writeFileSync(OUT, JSON.stringify({ schema: 'cf.delivered-archetypes/v1', producer: HERE + 'publish.mjs', decision: 'D50 (Dakk 2026-11-03)', rows: out }, null, 1) + '\n');
fs.writeFileSync(HERE + 'force-add.txt', [...forceAdd].sort().join('\n') + '\n');
console.log(JSON.stringify({ delivered: out.length, added: want.length, forceAddFiles: forceAdd.size }));
