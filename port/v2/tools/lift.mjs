/* lift.mjs — mechanical verbatim extraction of a SOLID module from main.js
   into an ESM .verbatim.js file.

   WHY THIS EXISTS: hand-transcribing a 900–2,800-line module invites exactly the
   transcription errors parity sampling may not catch. The lifter guarantees the
   body is byte-identical to v1.8.9; the hand-written part is only the typed
   facade (index.ts + .d.ts). Same philosophy as tools/proofsheet.js, which the
   art reviews already trust.

   Usage: node tools/lift.mjs <ModuleName> <outDir> [--source <path>]
   e.g.:  node tools/lift.mjs PlanetGen packages/domain/planetgen/src

   Transform, and ONLY this transform:
     1. locate `const <Name>=(()=>{` … its `return Object.freeze({A,B,…});`
     2. body between them, VERBATIM
     3. exports = the freeze list, plus any narrowly declared owned-adapter
        helpers whose existing bodies must be reused without duplication
     4. imports auto-detected against the registry of already-ported packages
   The result is committed, not gitignored — the port's source of record. A
   header records the exact main.js line range and a sha256 of the lifted body
   so drift from v1.8.9 is detectable. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { REGISTRY } from './registry.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..', '..');

/* REGISTRY moved to tools/registry.mjs (shared with lift-strays.mjs) */
const [, , name, outDir, ...options] = process.argv;
if (!name || !outDir || (options.length !== 0
    && (options.length !== 2 || options[0] !== '--source' || !options[1]))) {
  console.error('usage: node tools/lift.mjs <ModuleName> <outDir> [--source <path>]');
  process.exit(2);
}
/* Explicit source injection exists only so the real generator can be
   negative-controlled with isolated fixtures; ordinary lifts remain pinned
   to the ignored root main.js authority. */
const sourcePath = options.length ? path.resolve(options[1]) : path.join(root, 'main.js');
const main = fs.readFileSync(sourcePath, 'utf8');

const open = 'const ' + name + '=(()=>{';
const i0 = main.indexOf(open);
if (i0 < 0) { console.error('module wrapper not found: ' + open); process.exit(1); }
const bannerOpen = main.lastIndexOf('/*', i0);
const bannerClose = bannerOpen < 0 ? -1 : main.indexOf('*/', bannerOpen);
const banner = bannerOpen < 0 || bannerClose < 0 || bannerClose > i0
  ? '' : main.slice(bannerOpen, bannerClose + 2);
const moduleTags = [...banner.matchAll(/@module\s+([A-Za-z_$][\w$]*)\s+\[(domain|app)\]/g)];
if (moduleTags.length !== 1 || moduleTags[0][1] !== name) {
  console.error('exact module ownership banner not found for: ' + name);
  process.exit(1);
}
const moduleKind = moduleTags[0][2];
/* find the module's OWN freeze-return: the last one before the wrapper closes */
const closeMark = '})();\nconst {';
const iClose = main.indexOf(closeMark, i0);
if (iClose < 0) { console.error('module close not found'); process.exit(1); }
const iRet = main.lastIndexOf('return Object.freeze({', iClose);
if (iRet < 0 || iRet < i0) { console.error('freeze return not found'); process.exit(1); }

const body = main.slice(i0 + open.length, iRet);
const retLine = main.slice(iRet, main.indexOf('});', iRet));   /* '});' — a bare ');' matches one char early and leaks a '}' into the last export name */
const exportsList = retLine.replace('return Object.freeze({', '').split(',').map((s) => s.trim()).filter(Boolean);
/* D-ST: the owned pure card router needs the existing private composers. Keep
   their bodies verbatim and expose only their names from generated output;
   descriptors.verbatim.js remains generated rather than hand-edited. */
const adapterExports = name === 'Descriptors'
  ? ['quasarDescriptor', 'cometDescriptor', 'decoDescriptor', 'dwarfDescriptor',
    'radioDescriptor', 'supernovaDescriptor', 'protostarDescriptor']
  : [];
const thumbAdapterExports = name === 'ThumbArt'
  ? ['installPlanetSpriteFinisher', 'installThumbSurfaceFinisher'] : [];
/* CombatCore keeps the class/archetype tables private in the sealed legacy
   body. Export one bounded, deeply-frozen read adapter instead of either
   copying those tables into v2 or exposing their mutable arrays directly. */
const combatCoreAdapterExports = name === 'CombatCore'
  ? ['projectCreatureInnateArts'] : [];
const moduleExports = [...new Set([
  ...exportsList,
  ...adapterExports,
  ...thumbAdapterExports,
  ...combatCoreAdapterExports,
])];

/* ThumbArt's public getPlanetSprite and its lexical planetThumb consumer must
   pass through one finishing owner. Keeping that hook inside the generated
   lexical scope prevents call order from deciding whether a cached thumbnail
   sees raw or finished pixels. The three replacements are exact and fail
   closed; the sealed source body hash above remains the pre-adapter authority. */
let emittedBody = body;
let adapterPrelude = '';
if (name === 'ThumbArt') {
  const replacements = [
    ['  if(hit) return hit;', '  if(hit) return _cfFinishPlanetSprite(hit);'],
    ['    if(spriteCache.get(key)===lo) spriteCache.set(key, renderPlanetSprite(P, hdPx||P_PX));',
      '    if(spriteCache.get(key)===lo) spriteCache.set(key, _cfFinishPlanetSprite(renderPlanetSprite(P, hdPx||P_PX)));'],
    ['  return lo;', '  return _cfFinishPlanetSprite(lo);'],
  ];
  for (const [target, replacement] of replacements) {
    const count = emittedBody.split(target).length - 1;
    if (count !== 1) {
      console.error(`ThumbArt finisher target count ${count}: ${target}`);
      process.exit(1);
    }
    emittedBody = emittedBody.replace(target, replacement);
  }
  const thumbnailFinishers = [
    ['function planetThumb(P){', '\nfunction starThumb(',
      'const url=c.toDataURL();', "const url=_cfFinishThumbSurface(c,'planet',String(P.type||'')).toDataURL();"],
    ['function starThumb(kind,col,binCol){', '\nfunction galaxyThumb(',
      'const url=c.toDataURL();', "const url=_cfFinishThumbSurface(c,'star',kind).toDataURL();"],
    ['function galaxyThumb(g){', '\nfunction moonThumb(',
      'const url=c.toDataURL();', "const url=_cfFinishThumbSurface(c,'galaxy',g.quasar?'quasar':'galaxy').toDataURL();"],
    ['function moonThumb(ti,mseed){', '\nfunction cometThumb(',
      'const url=c.toDataURL();', "const url=_cfFinishThumbSurface(c,'moon',String(ti)).toDataURL();"],
    ['function cometThumb(){', '\nfunction beltThumb(',
      'const url=c.toDataURL();', "const url=_cfFinishThumbSurface(c,'comet','comet').toDataURL();"],
    ['function beltThumb(){', null,
      'const url=c.toDataURL();', "const url=_cfFinishThumbSurface(c,'belt','belt').toDataURL();"],
  ];
  for (const [startMarker, endMarker, target, replacement] of thumbnailFinishers) {
    const start = emittedBody.indexOf(startMarker);
    const end = endMarker === null ? emittedBody.length : emittedBody.indexOf(endMarker, start);
    if (start < 0 || end < 0) {
      console.error(`ThumbArt thumbnail finisher slice missing: ${startMarker}`);
      process.exit(1);
    }
    const slice = emittedBody.slice(start, end);
    const count = slice.split(target).length - 1;
    if (count !== 1) {
      console.error(`ThumbArt thumbnail finisher target count ${count} in ${startMarker}`);
      process.exit(1);
    }
    emittedBody = emittedBody.slice(0, start) + slice.replace(target, replacement) + emittedBody.slice(end);
  }
  adapterPrelude = `let _cfFinishPlanetSprite=(surface)=>surface;
let _cfPlanetSpriteFinisherInstalled=false;
function installPlanetSpriteFinisher(finisher){
  if(typeof finisher!=='function') throw new TypeError('planet sprite finisher must be callable');
  if(_cfPlanetSpriteFinisherInstalled) throw new Error('planet sprite finisher is already installed');
  _cfFinishPlanetSprite=finisher;
  _cfPlanetSpriteFinisherInstalled=true;
}
let _cfFinishThumbSurface=(surface)=>surface;
let _cfThumbSurfaceFinisherInstalled=false;
function installThumbSurfaceFinisher(finisher){
  if(typeof finisher!=='function') throw new TypeError('thumbnail surface finisher must be callable');
  if(_cfThumbSurfaceFinisherInstalled) throw new Error('thumbnail surface finisher is already installed');
  _cfFinishThumbSurface=finisher;
  _cfThumbSurfaceFinisherInstalled=true;
}
`;
}
if (name === 'CombatCore') {
  adapterPrelude = `function projectCreatureInnateArts(g){
  const K=classKit(g), arts=[];
  for(let i=0;i<K.slots;i++){
    const id=K.cls.verbs[i], ar=ARCHETYPES.find(a=>a.id===id);
    if(!ar) throw new Error('CombatCore innate art is unavailable: '+String(id));
    arts.push(Object.freeze({
      id:ar.id, label:ar.n, description:ar.d, slot:i+1,
      effects:Object.freeze({...ar.mk(i)})
    }));
  }
  return Object.freeze({
    className:K.cls.name,
    classGroup:K.cls.group,
    level:K.lvl,
    awakenedInnateSlots:K.slots,
    arts:Object.freeze(arts)
  });
}
`;
}

/* auto-detect imports: registry identifiers used in the body but not defined in it.
   ⚠ Detection scans a COMMENT-STRIPPED copy — a prose mention like "inherits a
   mix" or "the makeGenome parents" must not fabricate an import (it did, on
   Genetics, before this strip). The EMITTED body stays verbatim, comments and all. */
const codeOnly = body.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const defined = new Set(exportsList);
for (const m of codeOnly.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
for (const m of codeOnly.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
const importLines = [];
for (const [pkg, names] of Object.entries(REGISTRY)) {
  if (pkg.endsWith('-' + name.toLowerCase())) continue;   /* not from ourselves */
  const used = names.filter((n) => !defined.has(n) && new RegExp('\\b' + n + '\\b').test(codeOnly));
  if (used.length) importLines.push(`import { ${used.join(', ')} } from '${pkg}';`);
}

const lineOf = (idx) => main.slice(0, idx).split('\n').length;
const sha = crypto.createHash('sha256').update(body).digest('hex').slice(0, 16);
const header = `/* AUTO-LIFTED VERBATIM from main.js @module ${name} [${moduleKind}]
   (v1.8.9, tag v1.8.9 — lines ${lineOf(i0)}–${lineOf(iRet)}; body sha256/16 ${sha}).
   ⚠ DO NOT EDIT THIS FILE. Regenerate: node tools/lift.mjs ${name} <outDir>
   The typed surface lives in index.ts / the sibling .d.ts. Bodies here are the
   determinism contract — parity fixtures depend on them byte-for-byte. */
`;

const out = header + importLines.join('\n') + (importLines.length ? '\n\n' : '')
  + adapterPrelude + emittedBody + '\nexport { ' + moduleExports.join(', ') + ' };\n';
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, name.toLowerCase() + '.verbatim.js');
fs.writeFileSync(outFile, out);
console.log('lifted ' + name + ': lines ' + lineOf(i0) + '-' + lineOf(iRet) + ', ' + (body.length / 1024).toFixed(0) + ' KB, exports [' + moduleExports.join(', ') + '], imports from ' + (importLines.length || 'nothing'));
console.log('  -> ' + outFile);
