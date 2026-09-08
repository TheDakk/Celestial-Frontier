/* Offline source-bound morphology bridge. Fixed repository sources only; no
 * canvas, browser, Blender, save writer, trait edits or replacement taxonomy. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'rolldown/utils';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ART = 'port/v2/packages/art/src/';
const DOMAIN = 'port/v2/packages/domain/';
const SCHEMA = 'cf.creature-blender-phenotype/v1';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
function exactSpan(text, start, end) {
  const a = text.indexOf(start), b = text.indexOf(end, a + start.length);
  if (a < 0 || b <= a || text.indexOf(start, a + 1) !== -1) throw new Error(`source boundary changed: ${start}`);
  return text.slice(a, b);
}
function fn(text, name) {
  const matches = [...text.matchAll(new RegExp(`^(?:export )?function ${name}\\b[\\s\\S]*?^}`, 'gm'))];
  if (matches.length !== 1) throw new Error(`source function changed: ${name}`);
  return matches[0][0].replace(/^export /, '');
}
function table(text, name) {
  const matches = [...text.matchAll(new RegExp(`^(?:export )?const ${name}\\b[\\s\\S]*?^};`, 'gm'))];
  if (matches.length !== 1) throw new Error(`source table changed: ${name}`);
  return matches[0][0].replace(/^export /, '');
}
function evaluate(text, environment, names) {
  const clean = text.replace(/^import[\s\S]*?from ['"][^'"]+['"];\s*/gm, '')
    .replace(/^export\s*\{[\s\S]*?\};\s*/gm, '').replace(/^export (?=(?:const|function)\b)/gm, '');
  const transformed = transformSync('creature-blender-source.ts', clean);
  // Rolldown preserves module identity after erasing exported types. Only its
  // empty marker is inert; runtime imports/exports still fail before execution.
  const code = transformed.code.replace(/^export \{\};[ \t]*$/gm, '');
  if (transformed.errors.length || /^(?:import|export)\s/m.test(code)) throw new Error('unsupported source module boundary');
  return new Function(...Object.keys(environment), `${code}\nreturn {${names.join(',')}};`)(...Object.values(environment));
}
function jsonGenome(value, ancestors = new Set(), location = 'genome') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Object.is(value, -0)) throw new TypeError(`${location}: non-lossless JSON number`);
    return;
  }
  if (!value || typeof value !== 'object' || ancestors.has(value)) throw new TypeError(`${location}: non-lossless JSON value`);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError(`${location}: plain data required`);
  ancestors.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === 'length') continue;
    if (typeof key !== 'string' || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new TypeError(`${location}: unsafe key`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) throw new TypeError(`${location}: accessor/non-enumerable data`);
    jsonGenome(descriptor.value, ancestors, `${location}.${key}`);
  }
  if (Array.isArray(value) && Object.keys(value).length !== value.length) throw new TypeError(`${location}: sparse/extended array`);
  ancestors.delete(value);
}

export function createCreatureBlenderBridge() {
  const sources = new Map();
  const read = relative => {
    const file = path.join(ROOT, relative);
    if (!file.startsWith(`${ROOT}${path.sep}`) || fs.realpathSync(file) !== file || !fs.lstatSync(file).isFile()) throw new Error('source must be a regular owned file');
    const bytes = fs.readFileSync(file); sources.set(relative, { path: relative, bytes: bytes.length, sha256: sha(bytes) });
    return bytes.toString('utf8');
  };
  const rand = evaluate(read(`${DOMAIN}rand/src/index.ts`), {}, ['mulberry32', 'hashInt', 'clamp', 'TAU']);
  const traits = evaluate(read(`${DOMAIN}speciestraits/src/speciestraits.verbatim.js`), rand,
    ['SP_COLOR','SP_HEX','FA_BODY','FA_LOCO','FA_TRAIT','FA_SIZE','FA_DIET','FA_HEAD','FA_LIMBS','FA_SKIN','FA_TAIL','FA_PATTERN','FA_EYES','FA_BEHAVIOR','FA_HABITAT','FLORA_DETAIL','FA_TEMPER','FA_SENSE','FA_REPRO','FA_LIFE','FA_METAB','speciesName','colorGrade','TIER_MAX','habOf','locoOf','floraFormOf']);
  const { makeGenome } = evaluate(read(`${DOMAIN}genome/src/genome.verbatim.js`), { ...rand, ...traits }, ['makeGenome']);
  const genetics = evaluate(read(`${DOMAIN}genetics/src/genetics.verbatim.js`), rand, ['crossGenome', 'evolveGenome']);
  const { crossGenome } = evaluate(read(`${DOMAIN}genetics/src/index.ts`), { crossGenomeVerbatim: genetics.crossGenome, evolveGenome: genetics.evolveGenome }, ['crossGenome']);
  const rawCatalogue = exactSpan(read(`${DOMAIN}descriptors/src/apphooks.verbatim.js`), 'const _EARTH_NAMES=', '\nfunction _earthNamePass(');
  const catalogue = read(`${DOMAIN}descriptors/src/apphooks.ts`);
  const { _EARTH_NAMES } = evaluate(`${rawCatalogue.replace('const _EARTH_NAMES', 'const _EARTH_NAMES_V1')}\n${exactSpan(catalogue, 'const _DEDUPE:', '/** the verbatim name pass')}`, {}, ['_EARTH_NAMES']);
  const identity = evaluate(read(`${ART}speciesidentity.ts`), {}, ['snapshotSpeciesGenome','speciesVisualKey']);
  const { planFor } = evaluate(read(`${ART}proceduraloverrides.ts`), {}, ['planFor']);
  const quad = read(`${ART}quadrupedoverrides.ts`), owner = read(`${ART}speciesoverrides.ts`);
  const { QUAD_SPEC } = evaluate(table(quad, 'QUAD_SPEC'), {}, ['QUAD_SPEC']);
  // A higher-priority exact Wolf owner would make the canid bridge obsolete.
  const priority = [['faunaoverrides.ts','FAUNA_NAME'],['faunaoverrides2.ts','FAUNA2_NAME'],['faunaoverrides3.ts','FAUNA3_NAME'],['birdoverrides.ts','BIRD_NAME'],['invertoverrides.ts','INVERT_NAME']];
  for (const [file, name] of priority) {
    if (/['"]Wolf['"]\s*:/.test(table(read(ART + file), name))) throw new Error('Wolf has a different higher-priority painter');
  }
  if (/['"]fauna\|Wolf['"]\s*:/.test(table(owner, 'CANON'))) throw new Error('Wolf has a canonical override before quadruped');
  if (QUAD_SPEC.Wolf?.mammalCPlan !== 'canid-c1' || QUAD_SPEC.Wolf.family !== 'canid'
    || ['mammalEPlan','mammalDPlan','mammalBPlan','pinnipedPose','gliderPlan'].some(key => QUAD_SPEC.Wolf[key])) throw new Error('Wolf whole-form owner changed');
  if (!quad.includes("case 'canid-c1': faunaResetCanidC(c, g, p0, spec, name); return;")) throw new Error('canid dispatch changed');
  const routeHelpers = exactSpan(owner, 'type EarthKingdom =', '/** Integrate bounded child traits');
  // Only the Wolf named route is admitted. All other names fail explicitly below.
  const empty = Object.freeze({});
  const routeEnv = { QUAD_SPEC, CANON: empty, FAUNA_NAME: empty, FAUNA2_NAME: empty, FAUNA3_NAME: empty, BIRD_NAME: empty, INVERT_NAME: empty, QUAD2_SPEC: empty, FLORA_ICONIC: empty, FLORA2_SPEC: empty, FLORA_DUPES: [], FUNGI_NAME: empty, MICROBE_NAME: empty };
  const routePrefix = exactSpan(owner, 'export function resolveOverrideCanvas(g: G): ArtCanvas | null {', '  const canon =');
  const route = evaluate(`${routeHelpers}\n${routePrefix}return {kingdom,name,reviewedFaunaBlend};}`, { ...routeEnv, resolveProceduralCanvas: () => null }, ['resolveOverrideCanvas','isReviewedFaunaLineage']);
  const palette = evaluate(`${fn(owner,'palette')}\n${fn(quad,'pal')}`, traits, ['palette','pal']);
  const canid = fn(quad, 'faunaResetCanidC');
  const head = exactSpan(canid, 'function faunaResetCanidC', '  mammalBGround(');
  const tail = exactSpan(canid, '    const tailLen =', '    tail.moveTo(left + bodyW * 0.15');
  const fields = ['groundY','bodyW','bodyH','legLen','left','right','bodyBottom','rumpTop','shoulderTop','headRx','headRy','hx','hy','muzzleLen','earH','legW','tailLen','tipX','tipY','tailW'];
  const proportions = evaluate(`${fn(quad,'nameSeedQ')}\n${head}let tipX,tipY,tailW;${tail}return {${fields.join(',')}};}`, { ...rand, ...palette, S: 1 }, ['faunaResetCanidC']).faunaResetCanidC;
  const genericPrefix = exactSpan(fn(quad, 'faunaQuadruped'), '  const r =', '  const humpAt =');
  const generic = evaluate(`${fn(quad,'nameSeedQ')}\n${fn(quad,'mixSaltQ')}\nfunction generic(g,spec,name=''){${genericPrefix}return {groundY,legLen,bodyH,bodyW,cx,cy,back};}`, { ...rand, ...palette, S: 1, p0: {} }, ['generic']).generic;
  const lineagePrefix = exactSpan(fn(owner,'applyReviewedFaunaLineageDrift'), '  const anchor =', '  const p =');
  const drift = evaluate(`function drift(g){${lineagePrefix}return {anchor,drift};}`, {}, ['drift']).drift;
  const lineagePaint = evaluate(fn(owner,'applyReviewedFaunaLineageDrift'), { ...rand, ...palette, isReviewedFaunaLineage: route.isReviewedFaunaLineage }, ['applyReviewedFaunaLineageDrift']).applyReviewedFaunaLineageDrift;
  const pilot = read('port/v2/apps/game/src/pilot-specimens.ts');
  const wolfRow = exactSpan(pilot, "  specimen('wolf',", "  specimen('kangaroo',");
  const specimenSource = evaluate(`const specimen=(...args)=>args; const earth=(name,catalogueIndex,seed)=>({kind:'earth-catalogue',kingdom:'fauna',name,catalogueIndex,seed,heat:1});const row=[${wolfRow}];`, {}, ['row']).row[0][4];
  const matrix = read('port/v2/apps/game/src/hybridmatrixaudit.ts');
  const list = [...matrix.matchAll(/^const L:[\s\S]*?^];/gm)];
  if (list.length !== 1) throw new Error('hybrid matrix lineage table changed');
  const matrixRows = evaluate(list[0][0], {}, ['L']).L;
  const wolfRowIndex = matrixRows.findIndex(row => row.id === 'wolf' && row.species === 'Wolf' && row.kingdom === 'fauna');
  if (wolfRowIndex < 0 || matrixRows.filter(row => row.id === 'wolf').length !== 1) throw new Error('hybrid matrix Wolf row changed');
  const { alienSeed } = evaluate(fn(matrix, 'alienSeed'), rand, ['alienSeed']);
  read('port/v2/packages/art/test/familyspread.test.ts');
  read('port/v2/tools/creature-blender-export.mjs');

  function lineage(g) {
    const paths = []; let current = []; const ctx = { globalAlpha: 1, lineWidth: 1, save(){}, restore(){}, beginPath(){current=[];}, closePath(){current.push(['close']);}, moveTo(...p){current.push(['move',...p.map(x=>x/440)]);}, lineTo(...p){current.push(['line',...p.map(x=>x/440)]);}, quadraticCurveTo(...p){current.push(['quadratic',...p.map(x=>x/440)]);}, stroke(){paths.push({kind:'stroke',points:current,alpha:this.globalAlpha,width:this.lineWidth/440,color:this.strokeStyle});}, fill(){paths.push({kind:'fill',points:current,alpha:this.globalAlpha,color:this.fillStyle});} };
    lineagePaint(ctx,g,'Wolf');
    return { ...drift(g), paths, geometryOwner:'applyReviewedFaunaLineageDrift:Wolf', recipeSupported:false };
  }
  function exportGenome(input, id='specimen') {
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) throw new TypeError('invalid specimen id');
    jsonGenome(input);
    if (!input || Array.isArray(input) || typeof input !== 'object' || typeof input.kingdom !== 'string' || !Number.isInteger(input.seed)) throw new TypeError('complete genome object required');
    const g = identity.snapshotSpeciesGenome(input), key = identity.speciesVisualKey(g);
    if (identity.speciesVisualKey(JSON.parse(JSON.stringify(g))) !== key) throw new TypeError('JSON would lose genome identity');
    for (const field of ['color','body','loco','size','head','tail','pattern','skin','gen','heat']) if (typeof g[field] !== 'number' || !Number.isFinite(g[field])) throw new TypeError(`missing genome field: ${field}`);
    const named = String(g._earthName || '').replace(/[’‘]/g,"'");
    const blend = String(g._earthBlend || '').replace(/[’‘]/g,"'");
    let finalRoute, morphology, reason;
    if ((named && named !== 'Wolf') || (!named && blend && blend !== 'Wolf')) {
      finalRoute={kind:'unsupported-owner',kingdom:g.kingdom,name:named||blend,painter:null}; morphology=null; reason='named/lineage owner outside this bounded bridge';
    } else if (named || blend) {
      const selected = route.resolveOverrideCanvas(g);
      if (!selected || selected.kingdom !== 'fauna' || selected.name !== 'Wolf') {
        finalRoute={kind:'compatibility-fallback',kingdom:g.kingdom,name:named||blend,painter:null}; morphology=null; reason='unreviewed/markerless or incompatible named owner';
      } else {
        finalRoute={kind:named?'named':'reviewed-lineage',kingdom:selected.kingdom,name:'Wolf',painter:'faunaQuadruped → faunaMammalC → faunaResetCanidC'};
        morphology={kind:'canid-c1',spec:identity.snapshotSpeciesGenome(QUAD_SPEC.Wolf),coordinates:{space:'painter-normalized',canvasSize:440,x:'right',y:'down',fittedRaster:false},proportions:proportions(null,g,{},QUAD_SPEC.Wolf,'Wolf'),palette:palette.pal(palette.palette(g),QUAD_SPEC.Wolf),lineage:route.isReviewedFaunaLineage(g,'fauna','Wolf')?lineage(g):null};
        reason=named&&!morphology.lineage?'bounded named Wolf candidate; artistic acceptance remains open':'reviewed Wolf lineage requires rooted ridge/coat recipe; static fallback retained';
      }
    } else if (g.kingdom !== 'fauna') {
      finalRoute={kind:'unsupported-owner',kingdom:g.kingdom,name:null,painter:null}; morphology=null; reason='non-fauna family routing is outside this bridge; preserve its current static painter';
    } else {
      const plan=planFor(g);
      finalRoute={kind:'procedural',kingdom:g.kingdom,name:null,painter:plan===null?'verbatim-specialized-fallback':`resolveProceduralCanvas:${plan.kind}`};
      morphology={kind:plan?.kind??'unsupported',plan,coordinates:{space:'painter-normalized',canvasSize:440,x:'right',y:'down',fittedRaster:false},proportions:plan?.kind==='quad'?generic(g,plan.spec):null};
      reason=plan===null?'existing specialized morphology has no compatible bridge':'actual procedural plan exported; Wolf recipe cannot substitute its anatomy';
    }
    const result={schema:SCHEMA,id,genome:g,speciesVisualKey:key,sources:[...sources.values()].sort((a,b)=>a.path.localeCompare(b.path)),route:finalRoute,morphology,admission:{status:finalRoute.kind==='named'&&morphology?.kind==='canid-c1'&&morphology.lineage===null?'supported':'static-fallback',reason},visualAcceptance:'UNREVIEWED',anatomicalAnimation:'incomplete'};
    jsonGenome(result); return freeze(result);
  }
  let fixtureCache = null;
  function specimens() {
    if (fixtureCache !== null) return fixtureCache;
    const src=specimenSource, names=_EARTH_NAMES[src.kingdom], index=names.indexOf(src.name);
    if (index!==src.catalogueIndex || rand.hashInt(0xEA47,index,Object.keys(_EARTH_NAMES).indexOf(src.kingdom))!==src.seed) throw new Error('pilot Wolf catalogue source drifted');
    const wolf={...makeGenome(src.seed,src.kingdom,src.heat),_earthName:src.name};
    // Existing matrix's zero-based Wolf row, slot 1, attempt 0. This retains
    // its seed formula, not the matrix's later contrast-search admission claim.
    const seed=alienSeed(wolfRowIndex,1,0), heat=(wolfRowIndex+1)%3;
    const alien=makeGenome(seed,'fauna',heat);
    const ab=crossGenome(wolf,alien), ba=crossGenome(alien,wolf);
    const fan=[];
    for(let heat=0;heat<=2;heat++)for(let s=0;s<20;s++){
      const seed=rand.hashInt(0xF00D,heat*25+s,7)>>>0, genome=makeGenome(seed,'fauna',heat);
      const plan=planFor(genome); fan.push({seed,heat,genome,plan});
    }
    const control=fan.find(row=>row.plan?.kind==='quad'&&row.plan.spec.alien?.legPairs===2);
    if(!control)throw new Error('fixed audit fan contains no four-limbed procedural control');
    fixtureCache = freeze([
      {...exportGenome(wolf,'wolf'),inputProvenance:src},
      {...exportGenome(ab,'wolf-lineage-ab'),inputProvenance:{kind:'crossGenome',order:['wolf','alien'],parents:[wolf,alien],seedRecipe:{row:wolfRowIndex,slot:1,attempt:0,seed,heat,contrastSearch:false}}},
      {...exportGenome(ba,'wolf-lineage-ba'),inputProvenance:{kind:'crossGenome',order:['alien','wolf'],parents:[alien,wolf],seedRecipe:{row:wolfRowIndex,slot:1,attempt:0,seed,heat,contrastSearch:false}}},
      {...exportGenome(control.genome,'procedural-quad-control'),inputProvenance:{kind:'existing-audit-fan',kingdomIndex:0,seed:control.seed,heat:control.heat,selection:'first actual quad with two leg pairs; unchanged ordered fan'}},
    ]);
    return fixtureCache;
  }
  function verify(record) {
    jsonGenome(record);
    const expected=exportGenome(record.genome,record.id);
    if (Object.hasOwn(record,'inputProvenance')) {
      const fixture=specimens().find(row=>row.id===record.id);
      if (!fixture || JSON.stringify(record.inputProvenance)!==JSON.stringify(fixture.inputProvenance)
        || record.speciesVisualKey!==fixture.speciesVisualKey) throw new Error('specimen derivation provenance mismatch');
    }
    if (Object.keys(record).some(key=>!Object.hasOwn(expected,key)&&key!=='inputProvenance')) throw new Error('unknown phenotype claim');
    for(const key of Object.keys(expected)) if(JSON.stringify(record[key])!==JSON.stringify(expected[key])) throw new Error(`phenotype mismatch: ${key}`);
    return true;
  }
  return Object.freeze({exportGenome,specimens,verify});
}

export function assertCreatureBlenderOutputDirectory(directory) {
  const out=path.resolve(directory), parent=path.dirname(out);
  if (out===ROOT || out.startsWith(`${ROOT}${path.sep}`) || out.split(path.sep).includes('.git')) throw new Error('output must remain outside source/Git directories');
  if(fs.realpathSync(parent)!==parent||!fs.lstatSync(parent).isDirectory()||fs.existsSync(out))throw new Error('output must be a new directory under a real existing parent');
  return out;
}
function main(args) {
  if(args.length!==2||args[0]!=='--out')throw new Error('usage: node port/v2/tools/creature-blender-export.mjs --out NEW_DIRECTORY');
  const out=assertCreatureBlenderOutputDirectory(args[1]);
  const bridge=createCreatureBlenderBridge(),records=bridge.specimens();
  fs.mkdirSync(out);
  for(const record of records)fs.writeFileSync(path.join(out,`${record.id}.json`),`${JSON.stringify(record,null,2)}\n`,{flag:'wx'});
  fs.writeFileSync(path.join(out,'manifest.json'),`${JSON.stringify({schema:'cf.creature-blender-export/v1',visualAcceptance:'UNREVIEWED',files:records.map(r=>{const name=`${r.id}.json`,bytes=fs.readFileSync(path.join(out,name));return {name,bytes:bytes.length,sha256:sha(bytes),admission:r.admission.status};})},null,2)}\n`,{flag:'wx'});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) { try{main(process.argv.slice(2));}catch(error){process.stderr.write(`${error.message}\n`);process.exitCode=1;} }
