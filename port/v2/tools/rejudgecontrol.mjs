/* rejudgecontrol.mjs — THE CONTROL GROUP FOR A DRIFT-SCOPED RE-CHECK.

   D-ART-150 has fired twice on this project: two audit passes were compared,
   the number moved, and the movement was the RULER, not the art. It was caught
   both times by looking at a slice nobody had edited.

   The cheap re-check (D-ART-157) is scoped to drift on purpose — that is what
   makes it ~30x cheaper — but the scoping DELETES that safety check. Every
   asset it judges is one we edited, so "the edits made it worse" and "this
   judge grades harder than the last one" produce the identical number and
   nothing inside the run can separate them.

   This builds the missing control: a family-matched sample of assets whose
   pixels did NOT change since the baseline. Same families as the drift set, so
   family difficulty and strip composition cannot explain a difference; same
   packet, same strip, same prompt. If the control's bands move too, the ruler
   moved, and the drift delta must be reported net of it.

   Selection is DETERMINISTIC (evenly-spaced over a sorted list, no rng) so the
   control can be re-rendered or re-argued later against the same sample.

   Usage: node tools/rejudgecontrol.mjs [--frac=0.5] [--max=80]
   Reads : reference/drift-since-baseline.json · reference/goldpass3-prechassis.json
   Writes: reference/control-sample.json   (same {set,name} shape as the drift file)
   Then  : node tools/rejudgecards.mjs --control
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? Number(a.slice(k.length + 3)) : d; };
const FRAC = arg('frac', 0.5);   /* control size as a fraction of the drift set */
const MAX = arg('max', 80);

const base = JSON.parse(fs.readFileSync(path.join(root, 'reference/goldpass3-prechassis.json'), 'utf8'));
const rows = base.rows || base;
const drift = JSON.parse(fs.readFileSync(path.join(root, 'reference/drift-since-baseline.json'), 'utf8'));
const drifted = new Set(drift.map((d) => d.name));

/* how many drifted assets each family contributed — the shape we are matching */
const driftPerFamily = new Map();
for (const r of rows) if (drifted.has(r.species)) driftPerFamily.set(r.family, (driftPerFamily.get(r.family) || 0) + 1);

/* the pool: same families, pixels unchanged */
const poolPerFamily = new Map();
for (const r of rows) {
  if (drifted.has(r.species)) continue;
  if (!driftPerFamily.has(r.family)) continue;
  if (!poolPerFamily.has(r.family)) poolPerFamily.set(r.family, []);
  poolPerFamily.get(r.family).push(r);
}

const sample = [];
for (const [family, n] of [...driftPerFamily].sort((a, b) => b[1] - a[1])) {
  const pool = (poolPerFamily.get(family) || []).sort((a, b) => a.species.localeCompare(b.species));
  if (!pool.length) continue;
  const want = Math.min(pool.length, Math.max(1, Math.round(n * FRAC)));
  /* evenly spaced over the sorted pool: deterministic, and it does not favour
     the alphabetical head of a family the way slice(0, want) would */
  for (let i = 0; i < want; i++) sample.push(pool[Math.floor((i + 0.5) * pool.length / want)]);
}

sample.sort((a, b) => a.species.localeCompare(b.species));
const capped = sample.length > MAX
  ? sample.filter((_, i) => i % Math.ceil(sample.length / MAX) === 0)
  : sample;

fs.writeFileSync(path.join(root, 'reference/control-sample.json'),
  JSON.stringify(capped.map((r) => ({ set: r.set, name: r.species })), null, 1));

const tally = (rs) => { const t = { FAIL: 0, POLISH: 0, PASS: 0 }; for (const r of rs) t[r.band]++; return t; };
const td = tally(rows.filter((r) => drifted.has(r.species)));
const tc = tally(capped);
const line = (l, t, n) => l.padEnd(10) + String(n).padStart(4) + ' assets · FAIL ' + String(t.FAIL).padStart(3)
  + ' · POLISH ' + String(t.POLISH).padStart(3) + ' · PASS ' + String(t.PASS).padStart(3)
  + '   (FAIL ' + (100 * t.FAIL / n).toFixed(1) + '%)';

console.log('CONTROL SAMPLE — unchanged assets, family-matched to the drift set\n');
console.log('  families matched: ' + new Set(capped.map((r) => r.family)).size + ' of ' + driftPerFamily.size
  + ' (the rest had no unchanged member left)');
console.log('  ' + line('drift', td, drift.length));
console.log('  ' + line('control', tc, capped.length));
console.log('\n  baseline FAIL%% differ by ' + ((100 * tc.FAIL / capped.length) - (100 * td.FAIL / drift.length)).toFixed(1)
  + ' points — compare the SHIFT in each, not the levels.');
console.log('\nwrote reference/control-sample.json — now: node tools/rejudgecards.mjs --control');
