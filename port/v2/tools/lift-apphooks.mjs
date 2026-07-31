/* lift-apphooks.mjs — mechanical verbatim extraction of the APP-LAYER fragments
   the Descriptors domain module needs at runtime (same philosophy as lift.mjs:
   no hand transcription of anything parity depends on).

   WHY THESE EXIST HERE AT ALL: planetDescriptor & friends call five app hooks
   as free identifiers (_cardFactsSet, _earthNamePass/_EARTH_NAMES, GAL_KIND,
   and the *Thumb functions). The fixtures were captured with those present, so
   byte parity needs faithful stand-ins:
   - _cardFactsSet / CARD_FACTS  — side cache, output-neutral, carried VERBATIM
   - _EARTH_NAMES / _earthNamePass — Nick's cradle roster; MUTATES species
     (g._earthName lands in captured descriptor output) — carried VERBATIM
   - GAL_SPRITE_SEEDS / galSpriteKind / GAL_KIND — pure derivation, carried
     VERBATIM but SKIPPING the GAL_SPRITES canvas line (app art, not needed)
   The *Thumb stubs are NOT extracted — they are hand-written in apphooks.ts
   because the capture environment (jsdom) pinned them to a constant string.

   Usage: node tools/lift-apphooks.mjs   (regenerates apphooks.verbatim.js) */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const lines = fs.readFileSync(path.join(root, 'main.js'), 'utf8').split('\n');

/* fragments are located by ANCHOR STRINGS, not line numbers — main.js drifts */
function slice(startAnchor, endAnchor, opts = {}) {
  const i0 = lines.findIndex((l) => l.includes(startAnchor));
  if (i0 < 0) throw new Error('anchor not found: ' + startAnchor);
  const i1 = lines.findIndex((l, i) => i >= i0 && l.includes(endAnchor));
  if (i1 < 0) throw new Error('end anchor not found: ' + endAnchor);
  let out = lines.slice(i0, i1 + 1);
  if (opts.dropContaining) out = out.filter((l) => !opts.dropContaining.some((s) => l.includes(s)));
  return { text: out.join('\n'), from: i0 + 1, to: i1 + 1 };
}

const frags = [
  slice('const CARD_FACTS=new Map()', '}', {}),                       /* CARD_FACTS decl…_cardFactsSet close */
  slice('function _cardFactsSet', 'CARD_FACTS.set(seed, v);', {}),
  slice('/* v1.5.2c THE CRADLE ROSTER', 'g._earthName=pool[i];', {}),
  slice('const GAL_SPRITE_SEEDS=', 'const GAL_KIND=', { dropContaining: ['GAL_SPRITES'] }),
];
/* close _cardFactsSet and _earthNamePass: their closing braces come right after
   the end anchors — extend each fragment to its balanced end */
function balanced(fr) {
  let depth = 0, started = false;
  const body = [];
  let i = fr.from - 1;
  for (; i < lines.length; i++) {
    const l = lines[i];
    body.push(l);
    for (const ch of l) { if (ch === '{') { depth++; started = true; } else if (ch === '}') depth--; }
    if (started && depth <= 0 && i + 1 >= fr.to) break;
  }
  return { text: body.join('\n'), from: fr.from, to: i + 1 };
}
const f0 = balanced(frags[1]);                                        /* _cardFactsSet fn */
const f1 = balanced(frags[2]);                                        /* roster + _earthNamePass */
const galFrom = lines.findIndex((l) => l.includes('const GAL_SPRITE_SEEDS='));
const gal = [lines[galFrom], lines[galFrom + 2], lines[galFrom + 3]].join('\n'); /* seeds, kind fn, GAL_KIND (skip GAL_SPRITES canvas line) */
if (!gal.includes('galSpriteKind') || !gal.includes('const GAL_KIND=') || gal.includes('makeGalaxySprite')) {
  throw new Error('GAL fragment shape changed — re-anchor before regenerating');
}
const cardDecl = lines[frags[0].from - 1];                             /* the CARD_FACTS Map decl line */

const bodyOut = [cardDecl, f0.text, f1.text, gal].join('\n');
const sha = crypto.createHash('sha256').update(bodyOut).digest('hex').slice(0, 16);
const header = `/* AUTO-LIFTED VERBATIM app-layer fragments from main.js (v1.8.9)
   for the Descriptors domain module — see tools/lift-apphooks.mjs for why.
   Fragments: CARD_FACTS/_cardFactsSet (~line ${frags[0].from}) · cradle roster
   _EARTH_NAMES/_earthNamePass (~line ${f1.from}) · GAL_SPRITE_SEEDS/galSpriteKind/
   GAL_KIND (~line ${galFrom + 1}, GAL_SPRITES canvas line EXCLUDED).
   body sha256/16 ${sha}. ⚠ DO NOT EDIT. Regenerate: node tools/lift-apphooks.mjs */
import { mulberry32 } from '@cf/domain-rand';

`;
const out = header + bodyOut + '\nexport { _cardFactsSet, _EARTH_NAMES, _earthNamePass, GAL_SPRITE_SEEDS, galSpriteKind, GAL_KIND };\n';
const outFile = path.join(here, '..', 'packages', 'domain', 'descriptors', 'src', 'apphooks.verbatim.js');
fs.writeFileSync(outFile, out);
console.log('lifted app hooks -> ' + outFile + ' (sha ' + sha + ', ' + (bodyOut.length / 1024).toFixed(1) + ' KB)');
