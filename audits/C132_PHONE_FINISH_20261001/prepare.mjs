/** Pin the existing five C121 originals and ownership labels for the same conservation instrument. */
import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {createHash}from'node:crypto';import {createRequire}from'node:module';
import {rolldown}from'../../port/v2/node_modules/rolldown/dist/index.mjs';
import {cutAuthoredParts}from'../../port/v2/tools/creature-animation/part-masks.mjs';import {intakeAuthoredPixels}from'../../port/v2/tools/creature-animation/authored-intake.mjs';import {repoRelativeSource}from'../../port/v2/tools/creature-animation/record-source.mjs';
const dir=import.meta.dirname,root=path.resolve(dir,'../..'),output=path.join(dir,'prepared'),require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex'),refresh=process.argv[2]==='--refresh-derived';
if(process.argv.length>(refresh?3:2))throw Error('Usage: prepare.mjs [--refresh-derived]');
const subjects=[],sources=[];let prior;
if(refresh){
 prior=JSON.parse(await fs.readFile(path.join(dir,'prepared-manifest.json')));
 // Every old prepared byte must still match before replacing just the derived bundle/manifest.
 for(const p of prior.prepared)if(sha(await fs.readFile(path.join(dir,p.file)))!==p.sha256)throw Error('Prior prepared drift '+p.file);
 subjects.push(...JSON.parse(await fs.readFile(path.join(dir,'inputs/subjects.json'))).subjects);
 for(const s of subjects)for(const suffix of ['master','labels']){const file=path.relative(root,path.join(dir,'inputs',s.id+'-'+suffix+'.png'));sources.push({file,sha256:sha(await fs.readFile(path.join(root,file)))});}
}else{
await fs.mkdir(output);await fs.mkdir(path.join(dir,'inputs'));
for(const {id,fit}of JSON.parse(await fs.readFile(path.join(root,'audits/AI_FINISH_C121_20261001/subjects.json')))){
 let source=path.join(root,fit);try{await fs.access(path.join(source,'record.json'));}catch{source=path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac',fit);}
 const record=JSON.parse(await fs.readFile(path.join(source,'record.json'))),masterOrigin=repoRelativeSource(record.source);let actual=path.join(root,masterOrigin);try{await fs.access(actual);}catch{actual=path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac',masterOrigin);}
 const masterBytes=await fs.readFile(actual),masterPath=path.relative(root,path.join(dir,'inputs',id+'-master.png'));await fs.writeFile(path.join(root,masterPath),masterBytes,{flag:'wx'});
 if(sha(masterBytes)!==record.geometry.cutoutAssetHash)throw Error('Master identity '+id);
 const master=await sharp(masterBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});let labels;
 try{labels=await sharp(path.join(source,'labels.png')).ensureAlpha().raw().toBuffer();}catch(e){if(!String(e).includes('labels.png')&&e.code!=='ENOENT')throw e;
  const decl=JSON.parse(await fs.readFile(path.join(source,'declaration.json')));if(decl.schema!=='cf.authored-part-masks/v1')throw Error('Missing authored labels');const keyed=intakeAuthoredPixels(new Uint8ClampedArray(master.data),master.info.width,master.info.height),cut=await cutAuthoredParts(record,masterBytes,keyed.rgba,decl);labels=Buffer.alloc(cut.labels.length*4);for(let i=0;i<cut.labels.length;i++)labels.set([cut.labels[i],cut.labels[i],cut.labels[i],255],i*4);}
 await fs.writeFile(path.join(dir,'inputs',id+'-labels.png'),await sharp(labels,{raw:{width:master.info.width,height:master.info.height,channels:4}}).png().toBuffer(),{flag:'wx'});
 const refs={};for(const [kind,b]of[['master',master.data],['labels',labels]]){const file=id+'-'+kind+'.rgba';await fs.writeFile(path.join(output,file),b,{flag:'wx'});refs[kind]={url:'/inputs/'+file,sha256:sha(b),width:master.info.width,height:master.info.height};}
 subjects.push({id,fit,masterPath,masterOrigin,recordRecipeHash:record.recipeHash,cutoutAssetHash:record.geometry.cutoutAssetHash,seed:record.identity.seed,width:master.info.width,height:master.info.height,...refs});sources.push({file:masterPath,sha256:sha(masterBytes)});
}
}
for(const name of ['prepare.mjs','run.mjs','export-encoder.mjs','proof-contract.mjs','verify-pins.mjs','encoder-export.json','sdxs-source.json','taesd-source.json','sdxs-download.json','taesd-download.json','upstream-download.json','clip-tokenizer-source.json','inputs/subjects.json']){
 const file=path.relative(root,path.join(dir,name));if(name==='inputs/subjects.json'&&!refresh)continue;sources.push({file,sha256:sha(await fs.readFile(path.join(root,file)))});
}
const conservation='port/v2/tools/painted-creature/finish-conservation.mjs';sources.push({file:conservation,sha256:sha(await fs.readFile(path.join(root,conservation)))});
const built=await rolldown({input:path.join(dir,'client.ts'),platform:'browser',external:['/tokenizer.mjs'],plugins:[{name:'pin-sources',async transform(_,id){if(path.isAbsolute(id)&&!id.includes('/node_modules/'))sources.push({file:path.relative(root,id),sha256:sha(await fs.readFile(id))});}}]});try{await built.write({file:path.join(output,'client.mjs'),format:'es'});}finally{await built.close();}
if(!refresh){await fs.writeFile(path.join(output,'inputs.json'),JSON.stringify({mode:'mac',subjects},null,2)+'\n');await fs.writeFile(path.join(dir,'inputs/subjects.json'),JSON.stringify({mode:'mac',subjects},null,2)+'\n');}
const models=refresh?prior.models:[];if(!refresh)for(const [route,file]of[['text_encoder.onnx','sdxs/text_encoder.onnx'],['unet.onnx','sdxs/unet.onnx'],['vae_decoder.onnx','sdxs/vae_decoder.onnx'],['encoder.onnx','taesd/encoder.onnx']]){const b=await fs.readFile(path.join(dir,'model-cache',file));models.push({route,file,bytes:b.length,sha256:sha(b),phone:route!=='text_encoder.onnx'});}
const runtimeFiles=[];
const bindRuntime=async(route,file)=>{const b=await fs.readFile(file);runtimeFiles.push({route,file:path.relative(root,file),bytes:b.length,sha256:sha(b)});};
await bindRuntime('/tokenizer.mjs',path.join(root,'tools/local-image-generation/node_modules/@huggingface/tokenizers/dist/tokenizers.mjs'));
await bindRuntime('/tokenizer.json',path.join(dir,'model-cache/sdxs/tokenizer/tokenizer.json'));
await bindRuntime('/tokenizer-config.json',path.join(dir,'model-cache/upstream/tokenizer/tokenizer_config.json'));
const ortDist=path.join(root,'tools/local-image-generation/node_modules/onnxruntime-web/dist');
for(const name of (await fs.readdir(ortDist)).filter(name=>/\.(mjs|wasm)$/.test(name)).sort())await bindRuntime('/ort/'+name,path.join(ortDist,name));
const frozen=[];for(const name of await fs.readdir(output)){const b=await fs.readFile(path.join(output,name));frozen.push({file:'prepared/'+name,bytes:b.length,sha256:sha(b)});}
await fs.writeFile(path.join(dir,'prepared-manifest.json'),JSON.stringify({schema:'cf.c132-phone-finish-inputs/v1',mode:'mac',subjects:subjects.length,sources,models,runtimeFiles,prepared:frozen,priorSnapshot:refresh?'prior-preparation-01/snapshot.json':null,phoneModelBytes:models.filter(m=>m.phone).reduce((n,m)=>n+m.bytes,0),qualityAccepted:false},null,2)+'\n');console.log(JSON.stringify({subjects:subjects.length,models:models.length,runtimeFiles:runtimeFiles.length,refreshDerived:refresh}));
