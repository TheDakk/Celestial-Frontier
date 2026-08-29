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
const workerPrimitiveExports = [
  'hdBeastBare', '_hdPlantBare', 'hdFloraBare', '_hdCamo', '_hdStampPlant',
  '_hdPlaceBeast', '_hdHash', '_hdFbm', '_hdSm', 'HD_PALS',
];
const workerExports = [...portraitNames.map((name) => `${name}Canvas`), ...workerPrimitiveExports];
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
  + portraitNames.map((name) => `export function ${name}Canvas(g: Record<string, unknown>): ArtCanvas;`).join('\n') + '\n'
  + `export function hdBeastBare(g: Record<string, unknown>, seed?: number): ArtCanvas;\n`
  + `export function _hdPlantBare(seed: number, species: Record<string, unknown>): ArtCanvas;\n`
  + `export function hdFloraBare(g: Record<string, unknown>, seed?: number): ArtCanvas;\n`
  + `export function _hdCamo(canvas: ArtCanvas, color: string, alpha: number): ArtCanvas;\n`
  + `export function _hdStampPlant(...args: unknown[]): void;\nexport function _hdPlaceBeast(...args: unknown[]): void;\n`
  + `export function _hdHash(x: number, y: number, seed: number): number;\n`
  + `export function _hdFbm(x: number, y: number, seed: number, octaves: number): number;\n`
  + `export function _hdSm(value: number): number;\n`
  + `export const HD_PALS: Readonly<Record<string, Record<string, unknown>>>;\n`;
fs.writeFileSync(path.join(generatedDir, 'hdportrait.worker.verbatim.d.ts'), workerDeclarations);

/* The preserved biome ecology overlay is a much narrower seam than hdVista:
   it owns only weather/hazard atmosphere marks. Lift that exact function body
   with its two former free identifiers supplied explicitly. This does not
   claim ownership of the full vista compositor. */
const ecologySignature = 'function _hdVistaEco(g, W, H, hz, opts, seed){';
const ecologyBoundary = '\nfunction hdVista(opts){';
const ecologySource = uniqueSlice(body, ecologySignature, ecologyBoundary, 'biome vista ecology');
const ecologySha = crypto.createHash('sha256').update(ecologySource).digest('hex');
const ecologyExportSignature = 'function applyPreservedBiomeVistaEcologyV1(g, W, H, hz, opts, seed, BIOME_PROFILES, mulberry32){';
const ecologyBody = ecologySource.replace(ecologySignature, ecologyExportSignature);
if (ecologyBody === ecologySource || ecologyBody.split(ecologyExportSignature).length - 1 !== 1) {
  throw new Error('biome vista ecology: signature injection failed');
}
const ecologyHeader = `/* AUTO-LIFTED _hdVistaEco atmosphere overlay from main.js (v1.8.9).
   exact source sha256 ${ecologySha}. ⚠ DO NOT EDIT.
   Regenerate: node tools/lift-hdart.mjs
   BIOME_PROFILES and mulberry32 are explicit injected inputs. This is not the
   full hdVista compositor and owns no allocation, lifecycle, effects policy,
   camera motion, geometry placement, fauna, flora, or civilization pass. */\n`;
const ecologyOut = ecologyHeader + ecologyBody
  + `\nconst PRESERVED_BIOME_VISTA_ECOLOGY_SOURCE_SHA256 = '${ecologySha}';\n`
  + 'export { applyPreservedBiomeVistaEcologyV1, PRESERVED_BIOME_VISTA_ECOLOGY_SOURCE_SHA256 };\n';
for (const [label, pattern] of [
  ['DOM', /\b(?:document|window|globalThis|HTMLElement|OffscreenCanvas)\b/],
  ['audio', /\b(?:Audio|AudioContext|webkitAudioContext)\b/],
  ['clock/random global', /\b(?:Date|performance)\b|Math\.random\s*\(/],
  ['app state', /\b(?:st|vistaBox|localStorage)\b/],
  ['allocation', /createElement\s*\(|getContext\s*\(/],
]) {
  if (pattern.test(ecologyBody)) throw new Error(`biome vista ecology retained forbidden ${label}`);
}
fs.writeFileSync(path.join(generatedDir, 'biomevista.worker.verbatim.js'), ecologyOut);

const ecologyDeclarations = `/* AUTO-GENERATED by tools/lift-hdart.mjs. ⚠ DO NOT EDIT. */\n`
  + `export const PRESERVED_BIOME_VISTA_ECOLOGY_SOURCE_SHA256: string;\n`
  + `export type PreservedBiomeVistaRandomFactoryV1 = (seed: number) => () => number;\n`
  + `export function applyPreservedBiomeVistaEcologyV1(\n`
  + `  context: Record<string, unknown>, width: number, height: number, horizon: number,\n`
  + `  options: Readonly<{ wb: string; pal: string; nightize: boolean }>, seed: number,\n`
  + `  profiles: Readonly<Record<string, Readonly<{ weather: string; hazard: string | null }>>>,\n`
  + `  randomFactory: PreservedBiomeVistaRandomFactoryV1,\n): void;\n`;
fs.writeFileSync(path.join(generatedDir, 'biomevista.worker.verbatim.d.ts'), ecologyDeclarations);

/* Portable full compositor: exact vista painter slices only. UI lifecycle,
   presentation copy, wx clock selection and descent state are excluded. The
   already-lifted portable portrait module owns shared painter primitives. */
const genericVistaSource = uniqueSlice(
  body, 'function _hdVolcano(g,W,hz,seed,r,vx0){', '\n/* the planetfall overlay', 'portable generic vista',
);
const deckVistaSource = uniqueSlice(
  body, 'function _hdDeckScene(o){', '\n/* sea-region biome keys', 'portable gas deck vista',
);
const wxSelector = uniqueSlice(genericVistaSource, 'function wxEventFor(P, wb, wxTok){', '\nconst WX_EVENT_WORD=', 'vista weather selector');
let vistaSource = genericVistaSource.replace(wxSelector, '') + '\n' + deckVistaSource;
const vistaSourceSha = crypto.createHash('sha256').update(vistaSource).digest('hex');
const vistaAllocation = "document.createElement('canvas')";
const vistaAllocationCount = vistaSource.split(vistaAllocation).length - 1;
if (vistaAllocationCount !== 8) throw new Error(`portable vista: expected 8 allocations, found ${vistaAllocationCount}`);
vistaSource = vistaSource.split(vistaAllocation).join('createSpeciesCanvas(1, 1)');
vistaSource = vistaSource
  .replace('function _hdBiomeDress(g, o, seed, hz, W, H){', 'function _hdBiomeDress(g, o, seed, hz, W, H, BIOME_PROFILES){')
  .replace('function _hdVistaEco(g, W, H, hz, opts, seed){', 'function _hdVistaEco(g, W, H, hz, opts, seed, BIOME_PROFILES){')
  .replace('function hdVista(opts){', 'function renderPreservedGenericVistaV1(opts, BIOME_PROFILES){')
  .replace('_hdBiomeDress(g, opts, seed, hz, W, H);', '_hdBiomeDress(g, opts, seed, hz, W, H, BIOME_PROFILES);')
  .replace('_hdVistaEco(g, W, H, hz, opts, seed);', '_hdVistaEco(g, W, H, hz, opts, seed, BIOME_PROFILES);')
  .replace('function _hdAbyssScene(o){', 'function renderPreservedAbyssVistaV1(o){')
  .replace('function _hdReefScene(o){', 'function renderPreservedReefVistaV1(o){')
  .replace('function _hdDeckScene(o){', 'function renderPreservedGasDeckVistaV1(o){');
const vistaImports = `import { createSpeciesCanvas } from './speciescanvas.js';\n`
  + `import { mulberry32, clamp, TAU } from '@cf/domain-rand';\n`
  + `import { FA_SIZE_M } from '@cf/domain-speciestraits';\n`
  + `import { hdBeastBare, _hdPlantBare, hdFloraBare, _hdCamo, _hdStampPlant, _hdPlaceBeast, _hdHash, _hdFbm, _hdSm, HD_PALS } from './hdportrait.worker.verbatim.js';\n`;
const vistaExportNames = ['renderPreservedGenericVistaV1', 'renderPreservedGasDeckVistaV1', 'renderPreservedAbyssVistaV1', 'renderPreservedReefVistaV1'];
const vistaOut = `/* AUTO-LIFTED portable vista compositor. exact selected-source sha256 ${vistaSourceSha}. ⚠ DO NOT EDIT.\n   Regenerate: node tools/lift-hdart.mjs. UI lifecycle, app state and presentation copy excluded. */\n`
  + vistaImports + '\n' + vistaSource
  + `\nconst PRESERVED_FULL_VISTA_SOURCE_SHA256 = '${vistaSourceSha}';\n`
  + `export { ${vistaExportNames.join(', ')}, PRESERVED_FULL_VISTA_SOURCE_SHA256 };\n`;
for (const [label, pattern] of [
  ['DOM/global', /\b(?:document|window|globalThis|localStorage|performance|Date)\b|Math\.random\s*\(/],
  ['app state', /\b(?:vistaBox|showVistaBox|_descSeq|stats|st)\b/],
  ['audio/effects', /\b(?:AudioContext|webkitAudioContext|VisualEffectPolicyV1|CameraShakePolicyV1)\b/],
]) if (pattern.test(vistaOut)) throw new Error(`portable vista retained forbidden ${label}`);
fs.writeFileSync(path.join(generatedDir, 'biomevista-full.worker.verbatim.js'), vistaOut);
const vistaDeclarations = `/* AUTO-GENERATED by tools/lift-hdart.mjs. ⚠ DO NOT EDIT. */\n`
  + `import type { ArtCanvas } from './speciescanvas.js';\n`
  + `export const PRESERVED_FULL_VISTA_SOURCE_SHA256: string;\n`
  + `export function renderPreservedGenericVistaV1(options: Record<string, unknown>, profiles: Readonly<Record<string, unknown>>): ArtCanvas;\n`
  + `export function renderPreservedGasDeckVistaV1(options: Record<string, unknown>): ArtCanvas;\n`
  + `export function renderPreservedAbyssVistaV1(options: Record<string, unknown>): ArtCanvas;\n`
  + `export function renderPreservedReefVistaV1(options: Record<string, unknown>): ArtCanvas;\n`;
fs.writeFileSync(path.join(generatedDir, 'biomevista-full.worker.verbatim.d.ts'), vistaDeclarations);
console.log('lifted hdart: lines ' + (a + 1) + '-' + b + ' (' + (body.length / 1024).toFixed(0) + ' KB, sha ' + sha + '), imports: ' + (importLines.join(' | ') || 'none'));
console.log('lifted worker portraits: lines ' + (a + 1) + '-' + (a + portraitBody.split('\n').length)
  + ' (' + (portraitBody.length / 1024).toFixed(0) + ' KB, sha ' + portraitSha + '), allocations: ' + allocationCount);
console.log('lifted biome vista ecology: sha ' + ecologySha.slice(0, 16));
console.log('lifted portable full vista: sha ' + vistaSourceSha.slice(0, 16) + ', allocations: ' + vistaAllocationCount);
