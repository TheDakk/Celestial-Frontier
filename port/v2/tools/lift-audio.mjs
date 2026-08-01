/* lift-audio.mjs — verbatim extraction of the game's SHIPPED navigation/
   survey stings from the @section audio [app] block (main.js ~13509).

   SCOPE DISCIPLINE: only the UI stings the game already ships (whoosh on
   travel/planetfall, sonar ping on survey lock, the rarity sting) plus the
   one shared-gain bus they exit through. The §15 audio plan (creature
   voices, ambience, the mixer) stays GATED behind Nick's human listening
   test — nothing here expands that scope.

   The bodies read three app globals verbatim: `ac` (the gesture-safe
   AudioContext factory), `sndOn`, `sfxVol` — @cf/audio's index.ts owns the
   typed seam that installs them (the D-ST pattern, documented there).

   Usage: node tools/lift-audio.mjs */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const lines = fs.readFileSync(path.join(root, 'main.js'), 'utf8').split('\n');

const PIECES = [
  ['_sfxBus', 'let _sfxBus=null;'],
  ['sfxOut', 'function sfxOut(a){'],
  ['applySfxGain', 'function applySfxGain(){'],
  ['playRaritySting', 'function playRaritySting(tier){'],
  ['playSurveyPing', 'function playSurveyPing(){'],
  ['playWhoosh', 'function playWhoosh(){'],
];
function extract(anchor) {
  const i0 = lines.findIndex((l) => l.includes(anchor));
  if (i0 < 0) throw new Error('anchor not found: ' + anchor);
  if (!lines[i0].includes('{') || /^\s*(const|let)\s+\w+=(new WeakMap\(\);|null;)/.test(lines[i0])) return { text: lines[i0], from: i0 + 1, to: i0 + 1 };
  let depth = 0, started = false;
  const body = [];
  for (let i = i0; i < lines.length; i++) {
    body.push(lines[i]);
    for (const ch of lines[i]) { if (ch === '{' || ch === '[') { depth++; started = true; } else if (ch === '}' || ch === ']') depth--; }
    if (started && depth <= 0) return { text: body.join('\n'), from: i0 + 1, to: i + 1 };
  }
  throw new Error('unbalanced from: ' + anchor);
}
const parts = PIECES.map(([name, a]) => ({ name, ...extract(a) }));
const bodyOut = parts.map((p) => p.text).join('\n');
const sha = crypto.createHash('sha256').update(bodyOut).digest('hex').slice(0, 16);
const header = `/* AUTO-LIFTED VERBATIM audio stings from main.js @section audio [app] (v1.8.9):
   ${parts.map((p) => p.name + ' (' + p.from + '-' + p.to + ')').join(' · ')}.
   body sha256/16 ${sha}. ⚠ DO NOT EDIT. Regenerate: node tools/lift-audio.mjs
   Browser-only (Web Audio). Free identifiers ac/sndOn/sfxVol are the app
   seam — installed by index.ts initAudio(). */
`;
const out = header + bodyOut + '\nexport { sfxOut, applySfxGain, playRaritySting, playSurveyPing, playWhoosh };\n';
const dir = path.join(here, '..', 'packages', 'audio', 'src');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'stings.verbatim.js'), out);
console.log('lifted audio stings (sha ' + sha + ')');
