import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {Tokenizer} from '@huggingface/tokenizers';
import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {admitKitEngineJob,prepareKitTextTokens,placementBox} from './kit-engine-math.mjs';
import {keyAndDespill,compositeLayer,compositeOrganism,subtractOcclusion,alphaBounds} from './kit-contact-math.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
if(![3,4].includes(process.argv.length)||!process.argv[2].startsWith('--output=')||(process.argv.length===4&&process.argv[3]!=='--edge-runners'))throw Error('--output=NEW_DIRECTORY [--edge-runners] required');
const output=path.resolve(process.argv[2].slice(9));await fs.mkdir(output);await fs.mkdir(path.join(output,'inputs'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const baseline=path.join(root,'audits/ART_KIT_ENGINE_PROOF_20260912'),first=path.join(root,'audits/ART_KIT_ENGINE_FIRST_20260912');
const prior=JSON.parse(await fs.readFile(path.join(baseline,'prepared-manifest.json'),'utf8'));
const previousRecipe=JSON.parse(await fs.readFile(path.join(baseline,'recipe.json'),'utf8'));
const settings={...prior.settings,finisherStrength:.35,...(process.argv[3]==='--edge-runners'?{compositionProfile:'edge-runners-v1'}:{})};
if(settings.seed!==133||settings.width!==1024||settings.height!==576||settings.passSize!==384)throw Error('Exact prior experiment geometry required');
const compilerDir=path.join(output,'compiler');
execFileSync(process.execPath,[path.join(root,'port/v2/tools/landfall-snapshot/kit-export.mjs'),compilerDir],{cwd:root,stdio:'pipe'});
const release=acquireWorkspaceLock('prepare one contact revision with unchanged accepted inputs');
try{
  const intake=JSON.parse(await fs.readFile(path.join(first,'capture-intake.json'),'utf8'));
  for(const row of intake.images){const b=await fs.readFile(path.join(first,'masters',row.key+'.png'));if(sha(b)!==row.masterSha256)throw Error('Accepted master changed: '+row.key);}
  const files=[];for(const row of prior.files){
    for(const [file,hash]of [[path.basename(row.url),row.sha256],[row.key+'.png',row.pngSha256]]){
      const bytes=await fs.readFile(path.join(baseline,'inputs',file));if(sha(bytes)!==hash)throw Error('Prior input changed');await fs.writeFile(path.join(output,'inputs',file),bytes,{flag:'wx'});
    }
    files.push({...row,operation:'byte-identical copy of first experiment fitted input'});
  }
  const compiler=await import(pathToFileURL(path.join(compilerDir,'kit-compiler.mjs')).href);
  const kit=await fs.readFile(path.join(root,'ART_KIT.md'),'utf8');
  const plateRow=files.find(r=>r.key==='earth-temperate'),plate=new Uint8ClampedArray(await fs.readFile(path.join(output,'inputs','earth-temperate.rgba')));
  const crop={x:435,y:400,width:64,height:64},foreground=new Uint8ClampedArray(64*64*4);let retained=0;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const p=(y*64+x)*4,q=((crop.y+y)*1024+crop.x+x)*4;foreground.set(plate.subarray(q,q+4),p);
    const [r,g,b]=foreground.subarray(p,p+3);const grass=g>=r*.82&&g>b*1.22&&g>32;
    foreground[p+3]=grass?255:0;retained+=grass;
  }
  if(retained<100||retained>3500)throw Error('Grass extraction empty or full');
  const fgRow={key:'foreground-grass',url:'/inputs/foreground-grass.rgba',sha256:sha(foreground),width:64,height:64,bytes:foreground.length,source:plateRow.source,sourceSha256:plateRow.sourceSha256,crop,plateRgbaSha256:plateRow.sha256,retainedPixels:retained,operation:'crop accepted plate lower band; keep olive/green blade pixels; source RGB unchanged',png:'inputs/foreground-grass.png'};
  await fs.writeFile(path.join(output,'inputs','foreground-grass.rgba'),foreground,{flag:'wx'});
  execFileSync('magick',['-size','64x64','-depth','8','rgba:'+path.join(output,'inputs','foreground-grass.rgba'),path.join(output,fgRow.png)]);
  fgRow.pngSha256=sha(await fs.readFile(path.join(output,fgRow.png)));files.push(fgRow);
  const ref=key=>{const {url,sha256,width,height}=files.find(r=>r.key===key);return {url,sha256,width,height};};
  const recipe=compiler.compileCanonicalEarthKitEngine(kit,{plate:ref('earth-temperate'),atlas:ref('atlas'),triptych:ref('triptych'),foreground:ref('foreground-grass'),residents:Object.fromEntries(['civet','persimmon','platypus','frog','devils-club','cranberry'].map(k=>[k,ref(k)]))},settings);
  admitKitEngineJob(recipe);
  // Exact same semantic source and same prepared resident/plate/ref bytes.
  if(JSON.stringify(recipe.sourceSnapshot)!==JSON.stringify(previousRecipe.sourceSnapshot))throw Error('Canonical game source changed');
  const pin=JSON.parse(await fs.readFile(path.join(root,'tools/local-image-generation/model-manifest.json'),'utf8'));
  const cache=path.join(root,'port/v2/apps/game/smoke/local-image-generation',pin.modelId.replace('/','--'),pin.revision,'tokenizer');
  const tokenizer=new Tokenizer(JSON.parse(await fs.readFile(path.join(cache,'tokenizer.json'),'utf8')),JSON.parse(await fs.readFile(path.join(cache,'tokenizer_config.json'),'utf8')));
  const tokens=prepareKitTextTokens(tokenizer,recipe.finisherPrompt);
  const tokenReceipt={ceiling:512,tokens:tokens.tokenCount,positions:tokens.sequence,promptSha256:sha(recipe.finisherPrompt),chatPromptSha256:sha(tokens.wrapped)};
  await fs.writeFile(path.join(output,'runtime-prompt.txt'),recipe.finisherPrompt,{flag:'wx'});
  await fs.writeFile(path.join(output,'runtime-prompt-chat-wrapped.txt'),tokens.wrapped,{flag:'wx'});
  const bytes=JSON.stringify(recipe,null,2)+'\n';await fs.writeFile(path.join(output,'recipe.json'),bytes,{flag:'wx'});
  await fs.writeFile(path.join(output,'prepared-manifest.json'),JSON.stringify({schema:'cf.kit-engine-prepared.v4',experiment:recipe.experiment,recipeSha256:sha(bytes),settings,files,tokenReceipt,acceptedMastersVerified:intake.images.length,sameSourceSnapshot:true,qualityAccepted:false},null,2)+'\n',{flag:'wx'});
  // Static compositor inspection before the single native inference run.
  const preview=plate.slice(),masks=[],boxes=[];
  for(const p of recipe.passes){const raw=new Uint8ClampedArray(await fs.readFile(path.join(output,'inputs',path.basename(p.reference.url))));const keyed=keyAndDespill(raw,p.reference.width,p.reference.height);const {box,alpha,instances}=compositeOrganism(preview,1024,576,keyed,p.reference.width,p.reference.height,p.placement,placementBox);subtractOcclusion(masks,alpha);masks.push(alpha);boxes.push({name:p.name,...box,instances,keying:keyed.receipt});}
  const fb=alphaBounds(Uint8Array.from({length:4096},(_,i)=>foreground[i*4+3]),64,64);
  for(const target of recipe.composition.foreground.placements){const b=boxes.find(b=>b.name===target.name),fg=recipe.composition.foreground,w=fg.width*1024,h=fg.height*576;compositeLayer(preview,1024,576,foreground,64,64,fb,{x:b.x+b.width*target.centreAcrossBody-w/2,y:b.y+b.height+fg.groundOffset-h,width:w,height:h});}
  await fs.writeFile(path.join(output,'compositor-preview.rgba'),preview,{flag:'wx'});
  execFileSync('magick',['-size','1024x576','-depth','8','rgba:'+path.join(output,'compositor-preview.rgba'),path.join(output,'compositor-preview.png')]);
  await fs.writeFile(path.join(output,'compositor-preview.json'),JSON.stringify({boxes,pixelSha256:sha(preview),note:'Static compositor only; no inference. Native composite must match pixels.'},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:'PASS',output,tokenReceipt,acceptedMasters:intake.images.length,foregroundPixels:retained,boxes},null,2));
}finally{release();}
