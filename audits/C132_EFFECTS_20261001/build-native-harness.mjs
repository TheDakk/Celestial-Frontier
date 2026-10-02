import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const dir=import.meta.dirname,root=path.resolve(dir,'../..'),sourcePath='port/v2/tools/battle2-proof/native-runner.mjs';let s=fs.readFileSync(path.join(root,sourcePath),'utf8');const originalSha256=createHash('sha256').update(s).digest('hex'),changes=[];
function one(a,b){assert.equal(s.split(a).length-1,1,'Exact unique source match: '+a.slice(0,80));s=s.replace(a,b);changes.push({before:a,after:b});}
one("import { rolldown } from 'rolldown';","import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';\nconst requireAtV2=createRequire(new URL('../../port/v2/package.json',import.meta.url));const {rolldown}=await import(pathToFileURL(requireAtV2.resolve('rolldown')).href);");
for(const tail of ['creature-animation/record-source.mjs','morph/build-card-masters.mjs','browsercdp.mjs','workspacelock.mjs'])one("from '../"+tail+"'","from '../../port/v2/tools/"+tail+"'");
for(const tail of ['capture-timeline.mjs','cpu-profile.mjs'])one("from './"+tail+"'","from '../../port/v2/tools/battle2-proof/"+tail+"'");
one("path.resolve(import.meta.dirname, '../../../..')","path.resolve(import.meta.dirname, '../..')");
one("const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\\n');","const safe=v=>typeof v==='string'?v.replaceAll(os.homedir(),'~'):v;const save = () => fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report,(_k,v)=>safe(v),2)+'\\n');");
one("let release, server, browser;",`const assetPath=p=>path.isAbsolute(p)?p:path.resolve(repo,p.replace(/^~\\//,os.homedir()+'/'));
const arenaManifest=process.env.CF_ARENA_MANIFEST?JSON.parse(fs.readFileSync(assetPath(process.env.CF_ARENA_MANIFEST),'utf8')):null;
const arenaAssets=arenaManifest?Object.fromEntries(['recipe','far','mid','near'].map(k=>{if(typeof arenaManifest[k]!=='string')throw Error('arena manifest requires '+k);return[k,assetPath(arenaManifest[k])];})):null;
const effectPath=process.env.CF_EFFECT_ANCHORS?assetPath(process.env.CF_EFFECT_ANCHORS):path.join(arena,'wild-anchors.json'),effectRoot=path.dirname(effectPath);
const overrides=process.env.CF_PROOF_SOURCE_OVERRIDES?JSON.parse(fs.readFileSync(assetPath(process.env.CF_PROOF_SOURCE_OVERRIDES),'utf8')):{};
const proofDir=path.join(repo,'port/v2/tools/battle2-proof');
report.exactAssetInputs={effectAnchors:path.relative(repo,effectPath),arenaManifest:process.env.CF_ARENA_MANIFEST??null,sourceOverrides:Object.keys(overrides)};
let release, server, browser;`);
one("path.join(import.meta.dirname, 'native-entry.mjs')","path.join(proofDir, 'native-entry.mjs')");
one("resolveId(id) { if (id.startsWith('cf-proof/')) return path.resolve(producer, id.slice(9)); }","resolveId(id,importer) { const normal=id.startsWith('cf-proof/')?path.resolve(producer,id.slice(9)):id.startsWith('.')&&importer?path.resolve(path.dirname(importer),id):null;const relative=normal?path.relative(repo,normal):id;const swap=overrides[id]??overrides[relative];if(swap)return assetPath(swap);if(id.startsWith('cf-proof/'))return normal; }");
one("const anchors = JSON.parse(fs.readFileSync(path.join(arena, 'wild-anchors.json')));","const anchors = JSON.parse(fs.readFileSync(effectPath));remember(effectPath);if(process.env.CF_ARENA_MANIFEST)remember(assetPath(process.env.CF_ARENA_MANIFEST));if(process.env.CF_PROOF_SOURCE_OVERRIDES)remember(assetPath(process.env.CF_PROOF_SOURCE_OVERRIDES));");
one("'arena-recipe.json': path.join(arena, 'arena-recipe.json'), 'wild-anchors.json': path.join(arena, 'wild-anchors.json'), 'arena-far.png': path.join(arena, 'arena-far.png'), 'arena-mid.png': path.join(arena, 'keyed/arena-mid.png'), 'arena-near.png': path.join(arena, 'keyed/arena-near.png')","'arena-recipe.json': arenaAssets?.recipe??path.join(arena,'arena-recipe.json'), 'wild-anchors.json': effectPath, 'arena-far.png': arenaAssets?.far??path.join(arena,'arena-far.png'), 'arena-mid.png': arenaAssets?.mid??path.join(arena,'keyed/arena-mid.png'), 'arena-near.png': arenaAssets?.near??path.join(arena,'keyed/arena-near.png')");
one("assets[path.basename(p.keyedImage)] = path.join(arena, p.keyedImage)","assets[path.basename(p.keyedImage)] = path.resolve(effectRoot,p.keyedImage)");
for(const tail of ['capture-timeline.mjs'])one("path.join(import.meta.dirname,'"+tail+"')","path.join(proofDir,'"+tail+"')");
// cpu-profile has a space in the existing source.
one("path.join(import.meta.dirname, 'cpu-profile.mjs')","path.join(proofDir, 'cpu-profile.mjs')");
for(const tail of ['animation-completion/review-schedule.mjs','quadruped-proof/motion-proof-contract.mjs'])one("path.resolve(import.meta.dirname,'../"+tail+"')","path.join(repo,'port/v2/tools/"+tail+"')");
one("await import('source-map-js')","requireAtV2('source-map-js')");
one("report.sources = [...sources.values()]; for (const r of report.sources)","report.sources = [...sources.values()].map(r=>({...r,path:path.relative(repo,r.path)})); for (const r of sources.values())");
fs.writeFileSync(path.join(dir,'native-runner.mjs'),s,{flag:'wx'});fs.writeFileSync(path.join(dir,'native-harness-transform.json'),JSON.stringify({schema:'cf.c132-exact-asset-harness/v1',sourcePath,originalSha256,changes,generatedSha256:createHash('sha256').update(s).digest('hex'),nativeRun:false},null,2)+'\n',{flag:'wx'});
