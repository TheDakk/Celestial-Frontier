import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),p=import.meta.dirname,base=path.resolve(p,'..'),req=createRequire(root+'/port/v2/package.json'),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs'),sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex'),rows=[];
for(const [name,oldFit,newFit] of [['sparrow','17-sparrow/fit-01','fit-02']]){
 const old=path.join(base,oldFit),dir=path.join(p,newFit),record=JSON.parse(fs.readFileSync(dir+'/record.json','utf8')),oldPacket=path.dirname(old),oldManifest=fs.existsSync(old+'/markings.json')?old+'/markings.json':oldPacket+'/markings.json',mdir=path.dirname(oldManifest),m=JSON.parse(fs.readFileSync(oldManifest,'utf8')),priorRecipe=m.recordRecipeHash;
 assert.equal(sha(path.resolve(mdir,m.keyedAlphaFile)),sha(dir+'/parts/keyed.png'),'identical keyed pixels');assert.equal(m.sourceSha256,record.geometry.cutoutAssetHash);
 const relocate=file=>path.relative(dir,path.resolve(mdir,file));m.source=relocate(m.source);m.keyedAlphaFile='parts/keyed.png';m.compiledPrompt.file=relocate(m.compiledPrompt.file);m.recordRecipeHash=record.recipeHash;
 const key=PNG.sync.read(fs.readFileSync(dir+'/parts/keyed.png')),patterns=[];
 for(const [kind,v]of Object.entries(m.patterns))if(v?.file){
  const file=path.resolve(mdir,v.file);assert.equal(sha(file),v.sha256);const im=PNG.sync.read(fs.readFileSync(file));assert.equal(im.width,key.width);assert.equal(im.height,key.height);let nonzero=0,outside=0,over=0;for(let i=3;i<im.data.length;i+=4){const a=im.data[i];if(a)nonzero++;if(a&&!key.data[i])outside++;if(a>key.data[i])over++;}assert(nonzero>0);assert.equal(outside,0);assert.equal(over,0);patterns.push({kind,sha256:v.sha256,nonzero,outside,over});
  v.file=relocate(v.file);if(v.rawFile)v.rawFile=relocate(v.rawFile);if(v.promptFile)v.promptFile=relocate(v.promptFile);
 }
 const file=dir+'/markings.json';if(fs.existsSync(file))fs.renameSync(file,dir+'/markings-before-path-correction.json');fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n',{flag:'wx'});
 rows.push({name,oldManifest,oldManifestSha256:sha(oldManifest),oldRecordRecipeHash:priorRecipe,newRecordRecipeHash:record.recipeHash,newManifestSha256:sha(file),keyedSha256:sha(dir+'/parts/keyed.png'),patterns,scope:'Same own painting and six mask bytes; fresh conservation check against this fit. Historical generation prompts and old measurements unchanged. Manifest paths relocated and each new recipe explicitly recorded, not claimed as an old certificate.'});
}
fs.writeFileSync(p+'/mask-compatibility.json',JSON.stringify({schema:'cf.own-mask-compatibility/v1',rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows.map(r=>({name:r.name,masks:r.patterns.length,outside:r.patterns.reduce((s,x)=>s+x.outside,0)}))));
