/* goldcompare.mjs — THE RE-MEASURE REPORT.

   Joins the new gold pass against the old one ON SPECIES, which is the whole
   point: the code pass's verification never ran because its hunt→verdict join
   keyed on a free-text `claim` the verifier rephrased, and every finding in
   `codepass-findings.json` is hunt-stage only as a result. An identifier joins;
   model-authored prose does not.

   Prints: band totals then vs now, per-set and per-painter-class movement, the
   theme buckets over `verifyWhy`, and the species that crossed a band — which
   is the only list that says what the last ten waves actually did.

   Usage: node tools/goldcompare.mjs [--new=reference/goldpass2-results.json]
                                     [--old=reference/goldpass-results.json]
                                     [--md=reference/GOLD_PASS_2.md]
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classOf, classMap } from './artclass.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const arg = (k, d) => { const a = process.argv.find((s) => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };

const NEW = path.join(root, arg('new', 'reference/goldpass2-results.json'));
const OLD = path.join(root, arg('old', 'reference/goldpass-results.json'));
const MD = arg('md', null);

const now = JSON.parse(fs.readFileSync(NEW, 'utf8'));
const old = JSON.parse(fs.readFileSync(OLD, 'utf8'));
const nowRows = now.rows || now;
const oldRows = old.rows || old;

/* ★ THE JOIN. species is an identifier the judge copied verbatim from its
   packet heading; it is never rephrased, unlike every `defect`/`claim` line. */
const oldBy = new Map(oldRows.map((r) => [r.species, r]));
const BANDS = ['FAIL', 'POLISH', 'PASS'];
const tally = (rows, pick = () => true) => {
  const t = { FAIL: 0, POLISH: 0, PASS: 0 };
  for (const r of rows) if (pick(r)) t[r.band] = (t[r.band] || 0) + 1;
  return t;
};
const line = (label, t, width = 22) => `${label.padEnd(width)} ${String(t.FAIL).padStart(5)} ${String(t.POLISH).padStart(7)} ${String(t.PASS).padStart(6)}`;

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };

const tNow = tally(nowRows), tOld = tally(oldRows);
say('THE RE-MEASURE — ' + nowRows.length + ' assets judged (old pass: ' + oldRows.length + ')');
say('');
say('                        FAIL  POLISH   PASS');
say(line('  stale baseline', tOld));
say(line('  now', tNow));
say(line('  delta', { FAIL: tNow.FAIL - tOld.FAIL, POLISH: tNow.POLISH - tOld.POLISH, PASS: tNow.PASS - tOld.PASS }));
say('');

say('BY SET');
say('                        FAIL  POLISH   PASS   (was FAIL)');
for (const set of [...new Set(nowRows.map((r) => r.set))].sort()) {
  const t = tally(nowRows, (r) => r.set === set);
  const o = tally(oldRows, (r) => r.set === set);
  say(line('  ' + set, t) + '   ' + String(o.FAIL).padStart(6));
}
say('');

/* painter class predicts cost — it is who has to be edited */
let CLS = null;
try { CLS = classMap(); } catch { /* artclass may not export it; skip */ }
if (CLS) {
  say('BY PAINTER CLASS  (who has to be edited)');
  say('                        FAIL  POLISH   PASS');
  const clsOf = (r) => { try { return classOf(CLS, r.set + '|' + r.species) || '(unclassed)'; } catch { return '(unclassed)'; } };
  const classes = [...new Set(nowRows.map(clsOf))].sort();
  for (const c of classes) say(line('  ' + c, tally(nowRows, (r) => clsOf(r) === c)));
  say('');
}

/* theme buckets over verifyWhy — the field fixes are made against, never
   `defect`: 31% of stated causes were wrong while the verdict stood */
const THEMES = [
  ['missing feature', /\b(missing|absent|no |none|lacks?|without|never (drawn|painted)|not (drawn|painted|present|visible))\b/i],
  ['shape / silhouette', /\b(shape|silhouette|outline|profile|contour|form|proportioned)\b/i],
  ['flat / no material', /\b(flat|featureless|untextured|no texture|smooth|plain|material)\b/i],
  ['duplication / look-alike', /\b(identical|duplicate|same as|indistinguishable|look-?alike|recolou?red)\b/i],
  ['colour / palette', /\b(colou?r|hue|palette|tone|pale|dark|wrong shade)\b/i],
  ['occlusion / z-order', /\b(occlud|behind|in front|overlap|hidden by|covered by|z-?order|drawn over)\b/i],
  ['proportion / scale', /\b(proportion|too (long|short|big|small|wide|narrow|large)|aspect|scale)\b/i],
  ['pose / stance', /\b(pose|posture|stance|upright|standing|hangs?|clings?|rear)\b/i],
];
const fails = nowRows.filter((r) => r.band === 'FAIL');
say('FAIL THEMES  (keyword buckets over verifyWhy — rows can carry several)');
for (const [name, re] of THEMES) {
  const n = fails.filter((r) => re.test(r.verifyWhy || r.defect || '')).length;
  say('  ' + String(n).padStart(4) + '  ' + name);
}
const unthemed = fails.filter((r) => !THEMES.some(([, re]) => re.test(r.verifyWhy || r.defect || ''))).length;
say('  ' + String(unthemed).padStart(4) + '  (unthemed)');
say('');

/* what actually moved — the only list that says what the waves did */
const moved = { fixed: [], regressed: [], newlyJudged: [] };
for (const r of nowRows) {
  const o = oldBy.get(r.species);
  if (!o) { moved.newlyJudged.push(r.species); continue; }
  const bi = (b) => BANDS.indexOf(b);
  if (bi(r.band) > bi(o.band)) moved.fixed.push(`${r.species}: ${o.band} → ${r.band}`);
  else if (bi(r.band) < bi(o.band)) moved.regressed.push(`${r.species}: ${o.band} → ${r.band}`);
}
say('BAND CROSSINGS');
say('  improved:  ' + moved.fixed.length);
say('  regressed: ' + moved.regressed.length);
if (moved.newlyJudged.length) say('  unjoined:  ' + moved.newlyJudged.length + ' (species in the new pass with no old row)');
say('');
say('  ★ FAIL → not-FAIL (' + moved.fixed.filter((s) => s.includes('FAIL →')).length + '):');
for (const s of moved.fixed.filter((x) => x.includes('FAIL →')).sort().slice(0, 60)) say('      ' + s);
say('');
say('  ⚠ not-FAIL → FAIL (' + moved.regressed.filter((s) => s.endsWith('→ FAIL')).length + '):');
for (const s of moved.regressed.filter((x) => x.endsWith('→ FAIL')).sort()) say('      ' + s);

if (MD) {
  fs.writeFileSync(path.join(root, MD), '# ' + out[0] + '\n\n```\n' + out.slice(1).join('\n') + '\n```\n');
  console.log('\nwrote ' + MD);
}
