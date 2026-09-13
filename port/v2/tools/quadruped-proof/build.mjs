import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';import {rolldown} from 'rolldown';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../../..'),out=path.resolve(process.argv[2]);
if(fs.existsSync(out))throw Error('Build must be new');fs.mkdirSync(out);const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),sources=new Map();
const record=p=>{const b=fs.readFileSync(p);return {path:path.relative(repo,p),bytes:b.length,sha256:sha(b)};};
const add=p=>sources.set(p,record(p));
for(const name of ['entry.mjs','index.html','build.mjs','runner.mjs'])add(path.join(here,name));
for(const name of ['port/v2/package-lock.json','port/v2/tools/browsercdp.mjs'])add(path.join(repo,name));
const bundle=await rolldown({input:path.join(here,'entry.mjs'),platform:'browser',plugins:[{name:'source-receipt',transform(_,id){if(path.isAbsolute(id)&&fs.existsSync(id)&&fs.statSync(id).isFile())add(id);}}]});
try{await bundle.write({dir:out,format:'es',entryFileNames:'bundle.js',chunkFileNames:'chunk-[hash].js'});}finally{await bundle.close();}
const assets={
 'index.html':'port/v2/tools/quadruped-proof/index.html',
 'civet.landmarks.json':'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json',
 'fox.landmarks.json':'audits/CIVET_2D_PROOF_20260912/fox.landmarks.json',
 'procedural-genome.json':'audits/CIVET_2D_PROOF_20260912/procedural-genome.json',
 'civet.png':'audits/ART_KIT_ENGINE_FIRST_20260912/masters/civet.png',
 'fox.png':'audits/ART_KIT_ENGINE_FIRST_20260912/masters/family-mammal-quadruped.png',
 'platypus.png':'audits/ART_KIT_ENGINE_FIRST_20260912/masters/platypus.png',
 'plate.png':'audits/ART_KIT_ENGINE_FIRST_20260912/masters/earth-temperate.png',
 'E.png':'audits/ART_KIT_WEATHER_LADDER_20260912/E.png'};
for(const[name,rel]of Object.entries(assets)){const p=path.join(repo,rel);add(p);fs.copyFileSync(p,path.join(out,name),fs.constants.COPYFILE_EXCL);}
for(const[p,row]of sources)if(JSON.stringify(record(p))!==JSON.stringify(row))throw Error('Source changed: '+p);
const files=fs.readdirSync(out).map(name=>{const b=fs.readFileSync(path.join(out,name));return {path:name,bytes:b.length,sha256:sha(b)};});
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({sources:[...sources.values()],files},null,2)+'\n');console.log(JSON.stringify({build:out,files:files.length,sources:sources.size}));
