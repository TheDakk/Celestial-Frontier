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
const moduleExports = [...new Set([...exportsList, ...adapterExports])];

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

const out = header + importLines.join('\n') + (importLines.length ? '\n\n' : '') + body + '\nexport { ' + moduleExports.join(', ') + ' };\n';
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, name.toLowerCase() + '.verbatim.js');
fs.writeFileSync(outFile, out);
console.log('lifted ' + name + ': lines ' + lineOf(i0) + '-' + lineOf(iRet) + ', ' + (body.length / 1024).toFixed(0) + ' KB, exports [' + moduleExports.join(', ') + '], imports from ' + (importLines.length || 'nothing'));
console.log('  -> ' + outFile);
