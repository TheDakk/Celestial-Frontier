/* lift-strays.mjs — mechanical verbatim extraction of DOMAIN-PURE functions
   that live OUTSIDE the 14 @module [domain] blocks in main.js (app sections),
   but that fixtures pin or domain modules call. Same philosophy as lift.mjs.

   The roster so far (add anchors as the Gate B sweep ports them):
   - cleanName        (~13274, verify-pass sanitizer; code-fixtures pins it,
                       CombatCore's decodeCreature calls it)
   Queued for Gate B: biomeFor · encodeWhere/decodeWhere · winEstimate ·
   floraStat (+STAT_KEYS/STAT_META data) · hdGenesFor · _sanitizeSavedGenome.

   Usage: node tools/lift-strays.mjs   (regenerates strays.verbatim.js) */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const lines = fs.readFileSync(path.join(root, 'main.js'), 'utf8').split('\n');

/* each stray: [name, startAnchor, expectSingleLine?] — balanced-brace scan
   from the anchor line captures the whole function */
const STRAYS = [
  ['cleanName', 'function cleanName(s,n){'],
];

function extract(anchor) {
  const i0 = lines.findIndex((l) => l.includes(anchor));
  if (i0 < 0) throw new Error('anchor not found: ' + anchor);
  let depth = 0, started = false;
  const body = [];
  for (let i = i0; i < lines.length; i++) {
    body.push(lines[i]);
    for (const ch of lines[i]) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
    if (started && depth <= 0) return { text: body.join('\n'), from: i0 + 1, to: i + 1 };
  }
  throw new Error('unbalanced braces from anchor: ' + anchor);
}

const parts = STRAYS.map(([name, anchor]) => ({ name, ...extract(anchor) }));
const bodyOut = parts.map((p) => p.text).join('\n');
const sha = crypto.createHash('sha256').update(bodyOut).digest('hex').slice(0, 16);
const header = `/* AUTO-LIFTED VERBATIM domain-pure strays from main.js (v1.8.9) — functions
   living OUTSIDE the 14 [domain] modules that fixtures pin or domain code
   calls. ${parts.map((p) => p.name + ' (lines ' + p.from + '-' + p.to + ')').join(' · ')}.
   body sha256/16 ${sha}. ⚠ DO NOT EDIT. Regenerate: node tools/lift-strays.mjs */

`;
const out = header + bodyOut + '\nexport { ' + parts.map((p) => p.name).join(', ') + ' };\n';
const outFile = path.join(here, '..', 'packages', 'domain', 'strays', 'src', 'strays.verbatim.js');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log('lifted strays [' + parts.map((p) => p.name).join(', ') + '] -> ' + outFile + ' (sha ' + sha + ')');
