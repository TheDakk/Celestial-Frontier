/* lift-hdart.mjs — verbatim extraction of the ENTIRE @section hdart [app]
   block (the HD painterly creature/vista engine) for Phase 5's opening:
   the four species PORTRAIT painters the Compendium's living cards need.

   ⚠ SCOPE HONESTY (the GAL_SPRITES lesson, applied up front): only
   hdPortraitFauna/Flora/Fungi/Microbe are EXPORTED and only they are
   proven by the smoke's real-render check. The vista half of the section
   rides along verbatim but is DORMANT — its app-state free identifiers
   (st, planet context, viewport) are unresolved until Phase 6 wires them;
   nothing calls those paths today. hdGenesFor is deliberately duplicated
   here (strays carries the fixture-pinned copy; both are the same bytes).

   Usage: node tools/lift-hdart.mjs */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from './registry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');
const lines = fs.readFileSync(path.join(root, 'main.js'), 'utf8').split('\n');

const startIdx = lines.findIndex((l) => l.includes('@section hdart [app]'));
const endIdx = lines.findIndex((l) => l.includes('@section ui-panel [app]'));
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) throw new Error('hdart bounds not found');
/* back up from the section banners to their comment openers */
let a = startIdx; while (a > 0 && !lines[a].includes('/*')) a--;
let b = endIdx; while (b > startIdx && !lines[b].includes('/*')) b--;
const body = lines.slice(a, b).join('\n');
const sha = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);

/* The v1 API encodes immediately. Arc 1A also needs the very same painted
   canvas before encoding so a 132px derivative does not decode a 440px data
   URL first. Keep this a fail-closed GENERATED transform: the four painter
   bodies remain source-derived, only their names and final return values
   change, and compatibility wrappers retain the original URL API. */
const portraitNames = ['hdPortraitFauna', 'hdPortraitFlora', 'hdPortraitFungi', 'hdPortraitMicrobe'];
function liftCanvasPainter(source, name) {
  const signature = `function ${name}(g){`;
  const canvasSignature = `function ${name}Canvas(g){`;
  const starts = source.split(signature).length - 1;
  if (starts !== 1) throw new Error(`${name}: expected one painter signature, found ${starts}`);
  const start = source.indexOf(signature);
  const nextFunction = source.indexOf('\nfunction ', start + signature.length);
  const terminal = 'return cv.toDataURL();';
  const terminalAt = source.indexOf(terminal, start + signature.length);
  if (terminalAt < 0 || (nextFunction >= 0 && terminalAt > nextFunction)) {
    throw new Error(`${name}: terminal canvas encoding was not inside the painter`);
  }
  const secondTerminal = source.indexOf(terminal, terminalAt + terminal.length);
  if (secondTerminal >= 0 && (nextFunction < 0 || secondTerminal < nextFunction)) {
    throw new Error(`${name}: painter contains more than one terminal canvas encoding`);
  }
  return source.slice(0, start) + canvasSignature
    + source.slice(start + signature.length, terminalAt) + 'return cv;'
    + source.slice(terminalAt + terminal.length);
}
let liftedBody = body;
for (const name of portraitNames) liftedBody = liftCanvasPainter(liftedBody, name);

const codeOnly = body.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const defined = new Set();
for (const m of codeOnly.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
for (const m of codeOnly.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
const importLines = [];
for (const [pkg, names] of Object.entries(REGISTRY)) {
  const used = names.filter((n) => !defined.has(n) && new RegExp('\\b' + n + '\\b').test(codeOnly));
  if (used.length) importLines.push(`import { ${used.join(', ')} } from '${pkg}';`);
}
const header = `/* AUTO-LIFTED @section hdart [app] from main.js (v1.8.9,
   lines ${a + 1}-${b}). body sha256/16 ${sha}. ⚠ DO NOT EDIT.
   Regenerate: node tools/lift-hdart.mjs
   GENERATED SEAM: the four portrait bodies return their painted canvas;
   same-name URL wrappers call toDataURL(), preserving the v1 API. No painter
   logic is hand-maintained here. The vista half is
   DORMANT verbatim freight until Phase 6 (unresolved app free identifiers
   inside never-called paths — recorded, the GAL_SPRITES rule). hdGenesFor
   is a deliberate duplicate of strays' fixture-pinned copy (same bytes).
   Browser-only (canvas). */
`;
const wrappers = portraitNames.map((name) =>
  `function ${name}(g){ return ${name}Canvas(g).toDataURL(); }`).join('\n');
const exports = portraitNames.flatMap((name) => [name, `${name}Canvas`]);
const out = header + importLines.join('\n') + (importLines.length ? '\n\n' : '') + liftedBody
  + '\n' + wrappers + '\nexport { ' + exports.join(', ') + ' };\n';
const generatedDir = path.join(here, '..', 'packages', 'art', 'src');
fs.writeFileSync(path.join(generatedDir, 'hdart.verbatim.js'), out);

const declarations = `/* AUTO-GENERATED by tools/lift-hdart.mjs. ⚠ DO NOT EDIT. */\n`
  + portraitNames.map((name) => `export function ${name}(g: Record<string, unknown>): string;`).join('\n') + '\n'
  + portraitNames.map((name) => `export function ${name}Canvas(g: Record<string, unknown>): HTMLCanvasElement;`).join('\n') + '\n';
fs.writeFileSync(path.join(generatedDir, 'hdart.verbatim.d.ts'), declarations);
console.log('lifted hdart: lines ' + (a + 1) + '-' + b + ' (' + (body.length / 1024).toFixed(0) + ' KB, sha ' + sha + '), imports: ' + (importLines.join(' | ') || 'none'));
