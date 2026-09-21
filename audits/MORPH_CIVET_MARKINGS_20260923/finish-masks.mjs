/** Format/conservation only: every mark comes from its retained imagegen output. */
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import os from 'node:os';import path from 'node:path';
const req=createRequire(process.cwd()+'/port/v2/package.json'),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const base='audits/MORPH_CIVET_MARKINGS_20260923',fit='audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01',font='/System/Library/Fonts/Supplemental/Arial.ttf';
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex'),record=JSON.parse(read(fit+'/record.json')),binding=JSON.parse(read(fit+'/binding.json')),keyed=PNG.sync.read(read(fit+'/parts/keyed.png')),atlas=PNG.sync.read(read(fit+'/parts/atlas/civet.png'));
const sourcePrompt='audits/ART_KIT_ENGINE_FIRST_20260912/prompts/civet-prompt.txt',compiled=read(sourcePrompt),patterns=['striped','spotted','banded','mottled','marbled','eye-spotted'];
const sourceHashes=Object.fromEntries([record.source,fit+'/record.json',fit+'/binding.json',fit+'/parts/keyed.png',fit+'/parts/atlas/civet.png',fit+'/parts/manifest.json',sourcePrompt].map(p=>[p,sha(read(p))]));
assert.equal(keyed.width,1254);assert.equal(keyed.height,1254);assert.equal(sha(read(fit+'/parts/atlas/civet.png')),binding.atlasSha256);assert(!fs.existsSync(fit+'/labels.png'));
const allowed=new Uint8Array(1254*1254),protectedInk=new Uint8Array(1254*1254),excludedParts=[],partFrames=[];
// Map the existing atlas pixels back to their source cutouts; never make new anatomical labels.
for(const part of binding.parts){
 const f=part.frame,c=part.cutout;assert.equal(f.width,c.width);assert.equal(f.height,c.height);
 const excluded=part.id==='head'||part.id==='jaw'||/^(eye|ear|tail)(-|$)/.test(part.id)||/shadow|paw/.test(part.id);
 if(excluded)excludedParts.push(part.id);partFrames.push({id:part.id,frame:f,cutout:c,excluded});
 for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++){
  const alpha=atlas.data[((f.y+y)*atlas.width+f.x+x)*4+3];if(!alpha)continue;
  const at=(c.y+y)*1254+c.x+x;(excluded?protectedInk:allowed)[at]=1;
 }
}
let report={schema:'cf.marking-conservation/v1',status:'RUNNING',createdAt:new Date().toISOString(),sourceHashes,exclusion:{method:'binding atlas frame alpha mapped to source cutout; protected ink overrides allowed ink',headProtectsIntegratedEyes:true,separateEyeParts:binding.parts.filter(p=>/^eye/.test(p.id)).length,separateShadowParts:binding.parts.filter(p=>/shadow/.test(p.id)).length,excludedParts,partFrames},rows:[],controls:{},node:process.version,imageMagick:execFileSync('magick',['-version'],{encoding:'utf8'}).split('\n')[0]};
let manifest={schema:'cf.marking-masks/v1',space:'master',width:1254,height:1254,source:record.source,sourceSha256:sourceHashes[record.source],keyedAlphaFile:'parts/keyed.png',keyedSha256:sourceHashes[fit+'/parts/keyed.png'],recordRecipeHash:record.recipeHash,compiledPrompt:{file:sourcePrompt,sha256:sha(compiled)},plain:null,iridescent:{mode:'emissive',mask:null},patterns:{}};
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7);if(only){assert(patterns.includes(only));report=JSON.parse(read(base+'/conservation.json'));manifest=JSON.parse(read(fit+'/markings.json'));report.rows=report.rows.filter(r=>r.pattern!==only);report.revisedAt=new Date().toISOString();}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-civet-markings-'));
function assess(mask){let outside=0,protectedPixels=0;for(let k=0;k<1254*1254;k++){if(mask.data[k*4+3]&&!keyed.data[k*4+3])outside++;if(mask.data[k*4+3]&&protectedInk[k])protectedPixels++;}return {outsideAlphaPixels:outside,protectedPixels};}
try{
 for(const p of only?[only]:patterns){
  const rawFile=base+'/raw/'+p+'.png',raw=PNG.sync.read(read(rawFile));assert.equal(raw.width,1254);assert.equal(raw.height,1254);
  const mask=new PNG({width:1254,height:1254});let rawOutside=0,excludedPixelCount=0,nonzero=0,sum=0;
  for(let k=0;k<1254*1254;k++){const i=k*4,a=raw.data[i+3];if(a&&!keyed.data[i+3])rawOutside++;const omit=!allowed[k]||!!protectedInk[k];if(a&&omit)excludedPixelCount++;const out=omit?0:Math.round(a*keyed.data[i+3]/255);mask.data.set([255,255,255,out],i);nonzero+=out>0;sum+=out;}
  const output=fit+'/markings/'+p+'.png';fs.writeFileSync(output,PNG.sync.write(mask),{flag:only?'w':'wx'});
  const delivered=PNG.sync.read(read(output)),assessment=assess(delivered);assert.deepEqual(assessment,{outsideAlphaPixels:0,protectedPixels:0});assert(nonzero>0);
  for(let i=0;i<delivered.data.length;i+=4){assert.equal(delivered.data[i],255);assert.equal(delivered.data[i+1],255);assert.equal(delivered.data[i+2],255);assert(delivered.data[i+3]<=keyed.data[i+3]);}
  const promptFile=base+'/prompts/'+p+'.txt',prompt=read(promptFile);assert(prompt.subarray(0,compiled.length).equals(compiled));
  manifest.patterns[p]={file:'markings/'+p+'.png',sha256:sha(read(output)),promptFile,promptSha256:sha(prompt),prompt:prompt.toString('utf8'),tool:'image_gen.imagegen',seed:null,rawFile,rawSha256:sha(read(rawFile)),transform:{resize:null,translationPx:[0,0],rgb:[255,255,255],alpha:'generated alpha × keyed alpha / 255, rounded; only allowed binding-part ink, excluded ink overrides'}};
  report.rows.push({pattern:p,width:1254,height:1254,nonzeroAlphaPixels:nonzero,opaqueEquivalentPixels:sum/255,rawOutsideAlphaPixels:rawOutside,excludedPixelCount,...assessment,sha256:sha(read(output))});
  // White masks shown as delivered, over the keyed master; no colour or opacity edits to the master.
  execFileSync('magick',[fit+'/parts/keyed.png',output,'-compose','over','-composite',base+'/'+p+'-composite.png']);
 }
 for(const p of patterns){
  execFileSync('magick',[base+'/'+p+'-composite.png','-resize','627x627','-background','#263238','-alpha','remove','-gravity','north','-background','#263238','-splice','0x40','-fill','white','-font',font,'-pointsize','23','-annotate','+0+8',p,path.join(temp,p+'-preview.png')]);
 }
 if(!only){const positive=PNG.sync.read(read(fit+'/markings/striped.png'));assert.deepEqual(assess(positive),{outsideAlphaPixels:0,protectedPixels:0});positive.data[3]=255;assert.equal(assess(positive).outsideAlphaPixels,1);positive.data[3]=0;
 const protectedIndex=protectedInk.findIndex(x=>x>0);assert(protectedIndex>=0);positive.data[protectedIndex*4+3]=255;assert.equal(assess(positive).protectedPixels,1);report.controls={validAccepted:true,outsidePixelMutantRefused:true,protectedPartPixelMutantRefused:true};}
 execFileSync('magick',['montage','-font',font,...patterns.map(p=>path.join(temp,p+'-preview.png')),'-tile','3x2','-geometry','+8+8','-background','#162029',base+'/six-mask-sheet.png']);
 for(const [p,h]of Object.entries(sourceHashes))assert.equal(sha(read(p)),h,'unchanged '+p);
 report.status='PASS';report.sheetSha256=sha(read(base+'/six-mask-sheet.png'));report.rows.sort((a,b)=>patterns.indexOf(a.pattern)-patterns.indexOf(b.pattern));fs.writeFileSync(fit+'/markings.json',JSON.stringify(manifest,null,2)+'\n',{flag:only?'w':'wx'});fs.writeFileSync(base+'/conservation.json',JSON.stringify(report,null,2)+'\n',{flag:only?'w':'wx'});console.log(JSON.stringify(report.rows,null,2));
}finally{fs.rmSync(temp,{recursive:true});}
