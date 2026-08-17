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
const mainSource = lines.join('\n');

function uniqueSlice(source, startMarker, endMarker, label) {
  const starts = source.split(startMarker).length - 1;
  const ends = source.split(endMarker).length - 1;
  if (starts !== 1 || ends !== 1) {
    throw new Error(`${label}: expected unique markers, found start=${starts} end=${ends}`);
  }
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`${label}: end marker precedes start marker`);
  return source.slice(start, end);
}

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

/* Worker-owned portrait slice. The first vista function is a fail-closed
   ownership boundary: everything before it is the shared portrait engine;
   everything at/after it remains browser-only dormant freight above. */
const vistaBoundary = '/* the volcano that rules an ember world\'s mid-ground — cone, crater glow,';
const vistaBoundaries = body.split(vistaBoundary).length - 1;
if (vistaBoundaries !== 1) {
  throw new Error(`portrait worker boundary: expected one marker, found ${vistaBoundaries}`);
}
const portraitBody = body.slice(0, body.indexOf(vistaBoundary));
const portraitSha = crypto.createHash('sha256').update(portraitBody).digest('hex').slice(0, 16);
/* `hdGenesFor` needs only battleStats' visual fields, and the flora painter
   needs only floraStat. Their public facades also export dormant app-owned
   functions, so lift the exact pure source owners instead of importing those
   broad modules into the dedicated producer. */
const combatArtSupport = uniqueSlice(
  mainSource,
  'const ABILITY_THEMES={',
  '/* ---- the explorer as a battler:',
  'portrait worker combat ability support',
);
const battleStatsSupport = uniqueSlice(
  mainSource,
  'function battleStats(g){',
  '\nfunction encodeCreature(entry, champ){',
  'portrait worker battleStats support',
);
const statKeysSource = "const STAT_KEYS=['vit','fer','res','agi','ins'];";
const floraStatSource = "function floraStat(g){ return STAT_KEYS[(g&&g.seed!=null)?(hashInt(g.seed,0xF0,7)%5):0]; }";
if (mainSource.split(statKeysSource).length - 1 !== 1
  || mainSource.split(floraStatSource).length - 1 !== 1) {
  throw new Error('portrait worker floraStat support changed in main.js');
}
const workerSupport = combatArtSupport + battleStatsSupport + '\n' + statKeysSource + '\n' + floraStatSource + '\n';
const workerSourceBody = workerSupport + portraitBody;
const workerSupportSha = crypto.createHash('sha256').update(workerSupport).digest('hex').slice(0, 16);
let workerBody = workerSourceBody;
for (const name of portraitNames) workerBody = liftCanvasPainter(workerBody, name);

const allocation = "document.createElement('canvas')";
const allocationCount = workerBody.split(allocation).length - 1;
if (allocationCount !== 14) {
  throw new Error(`portrait worker canvas transform: expected 14 allocations, found ${allocationCount}`);
}
workerBody = workerBody.split(allocation).join('createSpeciesCanvas(1, 1)');

const workerCodeOnly = workerSourceBody.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const workerDefined = new Set();
for (const m of workerCodeOnly.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) workerDefined.add(m[1]);
for (const m of workerCodeOnly.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) workerDefined.add(m[1]);
const workerImportLines = [`import { createSpeciesCanvas } from './speciescanvas.js';`];
for (const [pkg, names] of Object.entries(REGISTRY)) {
  const used = names.filter((n) => !workerDefined.has(n) && new RegExp('\\b' + n + '\\b').test(workerCodeOnly));
  if (used.length) workerImportLines.push(`import { ${used.join(', ')} } from '${pkg}';`);
}

const workerHeader = `/* AUTO-LIFTED portrait-only hdart slice from main.js (v1.8.9,
   lines ${a + 1}-${a + portraitBody.split('\n').length}. body sha256/16 ${portraitSha};
   pure support sha256/16 ${workerSupportSha}. ⚠ DO NOT EDIT.
   Regenerate: node tools/lift-hdart.mjs
   The four exports return painted portable canvases. Allocation is supplied
   by the importing realm; encoding and vista code are intentionally absent. */
`;
const workerExports = portraitNames.map((name) => `${name}Canvas`);
const workerOut = workerHeader + workerImportLines.join('\n') + '\n\n' + workerBody
  + '\nexport { ' + workerExports.join(', ') + ' };\n';

for (const forbidden of [
  ['document', /\bdocument\b/],
  ['window', /\bwindow\b/],
  ['Image', /\bImage\b/],
  ['toDataURL', /\.toDataURL\s*\(/],
  ['vista owner', /\b(?:_hdVolcano|vistaBox)\b/],
]) {
  if (forbidden[1].test(workerOut)) {
    throw new Error(`portrait worker output retained forbidden ${forbidden[0]}`);
  }
}
for (const name of portraitNames) {
  if (new RegExp(`\\bfunction\\s+${name}\\s*\\(`).test(workerOut)) {
    throw new Error(`${name}: URL wrapper leaked into portrait worker output`);
  }
  const canvasDefinitions = [...workerOut.matchAll(new RegExp(`\\bfunction\\s+${name}Canvas\\s*\\(`, 'g'))].length;
  if (canvasDefinitions !== 1) {
    throw new Error(`${name}Canvas: expected one worker definition, found ${canvasDefinitions}`);
  }
}
fs.writeFileSync(path.join(generatedDir, 'hdportrait.worker.verbatim.js'), workerOut);

const workerDeclarations = `/* AUTO-GENERATED by tools/lift-hdart.mjs. ⚠ DO NOT EDIT. */\n`
  + `import type { ArtCanvas } from './speciescanvas.js';\n`
  + workerExports.map((name) => `export function ${name}(g: Record<string, unknown>): ArtCanvas;`).join('\n') + '\n';
fs.writeFileSync(path.join(generatedDir, 'hdportrait.worker.verbatim.d.ts'), workerDeclarations);
console.log('lifted hdart: lines ' + (a + 1) + '-' + b + ' (' + (body.length / 1024).toFixed(0) + ' KB, sha ' + sha + '), imports: ' + (importLines.join(' | ') || 'none'));
console.log('lifted worker portraits: lines ' + (a + 1) + '-' + (a + portraitBody.split('\n').length)
  + ' (' + (portraitBody.length / 1024).toFixed(0) + ' KB, sha ' + portraitSha + '), allocations: ' + allocationCount);
