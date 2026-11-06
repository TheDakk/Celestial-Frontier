// TypeSafe second opinion on the player-facing text: the Guide topics and the release notes in main.js.
//
// Each passage (one Guide topic body, one release-note bullet) gets two Nouls: does it contradict
// itself or state something impossible, and could a player reasonably misread the rule it states.
// Jev reads only the words; it knows nothing of the code, so a "contradiction" is a suspect for a
// human who does. Nothing is written back.
//
// Usage:
//   node tools/text-secondopinion.js --dry-run
//   node tools/text-secondopinion.js [--only guide|releases] [--limit N] [--min 0.7]
'use strict';
const fs = require('fs');
const path = require('path');
const { noul } = require('@typesafe-ai/sdk');
const ts = require('./typesafe-client');
const { root } = require('./_earthart-load');

const args = ts.parseArgs(process.argv.slice(2));
const BATCH = Number(args.batch || 12);
const MIN = Number(args.min || 0.7);

const srcFile = fs.existsSync(path.join(root, 'main.js')) ? path.join(root, 'main.js') : path.join(root, 'celestial-frontier.html');
const src = fs.readFileSync(srcFile, 'utf8');
// Take `const NAME=[ ... ];` by matching brackets while skipping string literals (the bodies hold `]` and quotes).
const slice = (startMarker) => {
  const a = src.indexOf(startMarker); if (a < 0) throw new Error(startMarker + ' not found');
  let i = a + startMarker.length - 1, depth = 0, quote = null;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (quote) { if (ch === '\\') { i++; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth++; else if (ch === ']') { depth--; if (depth === 0) break; }
  }
  return src.slice(a, i + 1) + ';';
};
const strip = (html) => String(html).replace(/<[^>]+>/g, ' ').replace(/&#8217;|&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
// The two tables are plain array literals with no external references; evaluate them in isolation.
const GUIDE = new Function(slice('const GUIDE=[') + '\n;return GUIDE;')();
const RELEASES = new Function(slice('const RELEASES=[') + '\n;return RELEASES;')();

let passages = [];
if (!args.only || args.only === 'guide') for (const cat of GUIDE) for (const t of cat.topics || []) passages.push({ id: 'guide:' + t.id, kind: 'guide', title: cat.cat + ' › ' + t.t, text: strip(t.body) });
if (!args.only || args.only === 'releases') for (const rel of RELEASES) for (const [section, bullets] of rel.sections || []) for (const [i, b] of (bullets || []).entries()) passages.push({ id: 'rel:' + rel.v + ':' + section + ':' + i, kind: 'release', title: 'v' + rel.v + ' ' + strip(section), text: strip(b) });
passages = passages.filter((p) => p.text.length > 20);
if (args.limit) passages = passages.slice(0, Number(args.limit));

function build(batch) {
  const state = { passages: {} };
  const questions = {}, keys = {};
  batch.forEach((p, i) => {
    const id = 'p' + i;
    state.passages[id] = { where: p.title, text: p.text };
    questions[id + '_contra'] = noul({ question: 'Does the passage at `passages.' + id + '` contradict itself, or state something logically impossible as written?', focus: 'Read only the text. Yes only for a genuine internal contradiction or an impossible claim; ordinary game-fiction, whimsy and emoji are not contradictions.' });
    keys[id + '_contra'] = 'contra|' + p.id;
    questions[id + '_misread'] = noul({ question: 'Could a player reasonably misread the rule or mechanic described at `passages.' + id + '` and expect the game to behave differently from what the text intends?', focus: 'Yes if a key term is undefined, a condition is ambiguous, or two readings of the sentence give different rules. No if the passage is clear or is not describing a rule.' });
    keys[id + '_misread'] = 'misread|' + p.id;
  });
  return { state, questions, keys };
}

(async () => {
  const { answers, usage, dry } = await ts.runBatches({ name: 'text-secondopinion', items: passages, batchSize: BATCH, build, args });
  if (dry) return;
  const rows = passages.map((p) => { const c = answers['contra|' + p.id], m = answers['misread|' + p.id]; return { ...p, p_contradiction: c ? +Number(c.noul).toFixed(3) : null, p_misread: m ? +Number(m.noul).toFixed(3) : null }; });
  const contra = rows.filter((r) => r.p_contradiction !== null && r.p_contradiction >= MIN).sort((a, b) => b.p_contradiction - a.p_contradiction);
  const misread = rows.filter((r) => r.p_misread !== null && r.p_misread >= MIN).sort((a, b) => b.p_misread - a.p_misread);
  const f = ts.saveReport('text-secondopinion', { generated: new Date().toISOString(), min: MIN, usage, rows, contra, misread });
  console.log('TEXT SECOND OPINION  ' + passages.length + ' passages (' + rows.filter((r) => r.kind === 'guide').length + ' guide topics, ' + rows.filter((r) => r.kind === 'release').length + ' release bullets); ' + contra.length + ' contradiction suspects, ' + misread.length + ' misread suspects at P >= ' + MIN);
  console.log('  ' + ts.usageLine(usage));
  const show = (label, list, key) => { console.log('  ' + label + ':'); for (const r of list.slice(0, 40)) console.log('    ' + String(r[key]).padEnd(6) + r.title.padEnd(36).slice(0, 36) + ' ' + r.text.slice(0, 110).replace(/\s+/g, ' ')); };
  show('contradiction / impossible-claim suspects', contra, 'p_contradiction');
  show('misread suspects', misread, 'p_misread');
  console.log('  Each line is a SUSPECT for a human who knows the code; Jev read only the words.');
  console.log('  report: ' + f);
})().catch((e) => { console.error('text-secondopinion failed: ' + (e && e.message || e)); process.exit(3); });
