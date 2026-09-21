/** Registration/format conversion only; all marking strokes originate in retained imagegen outputs. */
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import os from 'node:os';import path from 'node:path';
const req=createRequire(process.cwd()+'/port/v2/package.json'),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const base='audits/MORPH_CRAB_MARKINGS_20260922',fit='audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab',font='/System/Library/Fonts/Supplemental/Arial.ttf';
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex'),record=JSON.parse(read(fit+'/record.json')),master=PNG.sync.read(read(fit+'/parts/keyed.png')),labels=PNG.sync.read(read(fit+'/labels.png')),declaration=JSON.parse(read(fit+'/declaration.json'));
const sourcePrompt='audits/VISION_P1_FOUR_CRABS_20260920/crab/generation-01/sent-prompt.txt',compiledPrompt=read(sourcePrompt),sourceHashes=Object.fromEntries([record.source,fit+'/record.json',fit+'/binding.json',fit+'/labels.png',fit+'/parts/keyed.png',fit+'/parts/atlas/crab.png',sourcePrompt].map(p=>[p,sha(read(p))]));
const patterns=['striped','spotted','banded','mottled','marbled','eye-spotted'],dy={striped:0,spotted:0,banded:-32,mottled:-10,marbled:-15,'eye-spotted':0};
const excluded=new Set(declaration.parts.flatMap((p,i)=>p.id==='shadow'||p.id.startsWith('eye-')?[i+1]:[]));
const receipts=JSON.parse(read(base+'/generation-receipts.json')),report={schema:'cf.marking-conservation/v1',status:'RUNNING',createdAt:new Date().toISOString(),sourceHashes,rows:[],controls:{},node:process.version,imageMagick:execFileSync('magick',['-version'],{encoding:'utf8'}).split('\n')[0]};
const manifest={schema:'cf.marking-masks/v1',space:'master',width:880,height:880,source:record.source,sourceSha256:sourceHashes[record.source],keyedAlphaFile:'parts/keyed.png',keyedSha256:sourceHashes[fit+'/parts/keyed.png'],recordRecipeHash:record.recipeHash,compiledPrompt:{file:sourcePrompt,sha256:sha(compiledPrompt),provenance:'Retained P1 compiled prompt for this archetype; the original 880-square master itself was drawn by the source painter, not imagegen.'},plain:null,iridescent:{mode:'emissive',mask:null},patterns:{}};
assert.equal(master.width,880);assert.equal(master.height,880);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-markings-'));
function outside(mask){let n=0;for(let i=3;i<mask.data.length;i+=4)if(mask.data[i]>0&&master.data[i]===0)n++;return n;}
try{
 for(const p of patterns){
  const rawPath=base+'/raw/'+p+'.png',raw=PNG.sync.read(read(rawPath)),resized=path.join(temp,p+'.png');
  execFileSync('magick',[rawPath,'-filter','Lanczos','-resize','880x880!',resized]);
  const layer=PNG.sync.read(read(resized)),mask=new PNG({width:880,height:880});let preClipOutside=0,excludedPixels=0;
  for(let y=0;y<880;y++)for(let x=0;x<880;x++){
   const i=(y*880+x)*4,sy=y-dy[p],a=sy<0||sy>=880?0:layer.data[(sy*880+x)*4+3];
   if(a&&master.data[i+3]===0)preClipOutside++;
   const omit=excluded.has(labels.data[i]);if(omit&&a)excludedPixels++;
   mask.data.set([255,255,255,omit?0:Math.round(a*master.data[i+3]/255)],i);
  }
  const output=fit+'/markings/'+p+'.png';fs.writeFileSync(output,PNG.sync.write(mask),{flag:'wx'});
  const decoded=PNG.sync.read(read(output));assert.equal(outside(decoded),0);
  let nonzero=0,alphaSum=0;for(let i=0;i<decoded.data.length;i+=4){assert.equal(decoded.data[i],255);assert.equal(decoded.data[i+1],255);assert.equal(decoded.data[i+2],255);assert(decoded.data[i+3]<=master.data[i+3]);nonzero+=decoded.data[i+3]>0;alphaSum+=decoded.data[i+3];}assert(nonzero>0);
  const promptFile=base+'/prompts/'+p+'.txt',promptBytes=read(promptFile);assert(promptBytes.subarray(0,compiledPrompt.length).equals(compiledPrompt));
  const transform={resize:{from:[raw.width,raw.height],to:[880,880],filter:'Lanczos'},translationPx:[0,dy[p]],alpha:'generated alpha × keyed master alpha / 255, rounded; exclude existing shadow and eye owners',rgb:[255,255,255]};
  manifest.patterns[p]={file:'markings/'+p+'.png',sha256:sha(read(output)),promptFile,promptSha256:sha(promptBytes),prompt:promptBytes.toString('utf8'),tool:receipts[p].tool,seed:null,rawFile:rawPath,rawSha256:sha(read(rawPath)),transform};
  report.rows.push({pattern:p,width:decoded.width,height:decoded.height,nonzeroAlphaPixels:nonzero,opaqueEquivalentPixels:alphaSum/255,preClipOutsidePixels:preClipOutside,excludedEyeShadowPixels:excludedPixels,outsideAlphaPixels:0,sha256:sha(read(output))});
  execFileSync('magick',[fit+'/parts/keyed.png',output,'-compose','over','-composite',base+'/'+p+'-composite.png']);
  execFileSync('magick',[base+'/'+p+'-composite.png','-crop','310x210+285+340','+repage','-resize','620x420','-background','#263238','-alpha','remove','-gravity','north','-background','#263238','-splice','0x40','-fill','white','-font',font,'-pointsize','22','-annotate','+0+8',p,path.join(temp,p+'-preview.png')]);
 }
 const good=PNG.sync.read(read(fit+'/markings/striped.png'));assert.equal(outside(good),0);good.data[3]=255;assert.equal(outside(good),1);report.controls={validAccepted:true,onePixelOutsideMutantRefused:true};
 execFileSync('magick',['montage','-font',font,...patterns.map(p=>path.join(temp,p+'-preview.png')),'-tile','3x2','-geometry','+8+8','-background','#162029',base+'/six-mask-sheet.png']);
 for(const [p,h]of Object.entries(sourceHashes))assert.equal(sha(read(p)),h,'source unchanged: '+p);
 report.status='PASS';report.sheetSha256=sha(read(base+'/six-mask-sheet.png'));
 fs.writeFileSync(fit+'/markings.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(base+'/conservation.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(report,null,2));
}finally{fs.rmSync(temp,{recursive:true});}
