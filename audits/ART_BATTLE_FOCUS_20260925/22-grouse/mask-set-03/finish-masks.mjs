/** Format/conservation only. Paint comes exclusively from retained imagegen outputs. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(base,'../../../..');
const req=createRequire(path.join(root,'port/v2/package.json')),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const fit=path.resolve(base,'../fit-03'),sourcePrompt=path.resolve(base,'../prompt.txt');
const read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex'),rel=p=>path.relative(base,p).split(path.sep).join('/');
const patterns=['striped','spotted','banded','mottled','marbled','eye-spotted'],font='/System/Library/Fonts/Supplemental/Arial.ttf';
const recordFile=path.join(fit,'record.json'),bindingFile=path.join(fit,'binding.json');
const record=JSON.parse(read(recordFile)),binding=JSON.parse(read(bindingFile));
const source=path.isAbsolute(record.source)?record.source:path.resolve(root,record.source);
const keyedFile=path.join(fit,'parts/keyed.png'),atlasFile=path.join(fit,'parts/atlas/grouse.png');
const keyed=PNG.sync.read(read(keyedFile)),compiled=read(sourcePrompt),count=1254*1254;
assert.equal(keyed.width,1254);assert.equal(keyed.height,1254);assert.equal(sha(read(atlasFile)),binding.atlasSha256);
assert.equal(sha(read(source)),record.geometry.cutoutAssetHash);assert.equal(process.argv.length,2,'No partial runs or retry flags');
const outputFiles=[...patterns.flatMap(p=>['markings/'+p+'.png','composites/'+p+'.png']),'markings.json','conservation.json','six-mask-sheet.png'];
for(const p of outputFiles)assert(!fs.existsSync(path.join(base,p)),'Output already exists; no retry: '+p);
for(const d of ['markings','composites'])assert(!fs.existsSync(path.join(base,d)),'Output directory already exists: '+d);
const inputFiles=[source,recordFile,bindingFile,keyedFile,atlasFile,path.join(fit,'parts/manifest.json'),sourcePrompt];
const prepared=patterns.map(pattern=>{
  const rawFile=path.join(base,'raw',pattern+'.png'),promptFile=path.join(base,'prompts',pattern+'.txt');
  const rawBytes=read(rawFile),prompt=read(promptFile),raw=PNG.sync.read(rawBytes);
  assert.equal(raw.width,1254,pattern+' width');assert.equal(raw.height,1254,pattern+' height');
  assert(prompt.length>0 && prompt.toString('utf8').includes('1254 x 1254'), pattern+' exact standalone mask prompt retained; compiled master prompt is bound separately');
  inputFiles.push(rawFile,promptFile);return {pattern,rawFile,promptFile,rawBytes,prompt,raw};
});
const sourceHashes=Object.fromEntries(inputFiles.map(p=>[rel(p),sha(read(p))]));
function assess(mask){
  let outsideAlphaPixels=0,alphaExceedsKeyedPixels=0,nonWhiteRgbPixels=0,nonzeroAlphaPixels=0;
  assert.equal(mask.width,1254);assert.equal(mask.height,1254);
  for(let k=0;k<count;k++){const i=k*4,a=mask.data[i+3],limit=keyed.data[i+3];
    outsideAlphaPixels+=a>0&&limit===0;alphaExceedsKeyedPixels+=a>limit;nonzeroAlphaPixels+=a>0;
    nonWhiteRgbPixels+=mask.data[i]!==255||mask.data[i+1]!==255||mask.data[i+2]!==255;
  }
  return {outsideAlphaPixels,alphaExceedsKeyedPixels,nonWhiteRgbPixels,nonzeroAlphaPixels};
}
function requireConserved(mask){const result=assess(mask);assert.equal(result.outsideAlphaPixels,0);assert.equal(result.alphaExceedsKeyedPixels,0);assert.equal(result.nonWhiteRgbPixels,0);assert(result.nonzeroAlphaPixels>0);return result;}
const report={schema:'cf.marking-conservation/v1',status:'RUNNING',createdAt:new Date().toISOString(),sourceHashes,helperSha256:sha(read(fileURLToPath(import.meta.url))),exclusion:{method:'none; every keyed-alpha pixel is eligible',excludedParts:[]},rows:[],controls:{},node:process.version};
const manifest={schema:'cf.marking-masks/v1',space:'master',width:1254,height:1254,source:rel(source),sourceSha256:sha(read(source)),keyedAlphaFile:rel(keyedFile),keyedSha256:sha(read(keyedFile)),recordRecipeHash:record.recipeHash,compiledPrompt:{file:rel(sourcePrompt),sha256:sha(compiled),bytesBase64:compiled.toString('base64')},plain:null,iridescent:{mode:'emissive',mask:null},patterns:{}};
try{
  report.imageMagick=execFileSync('magick',['-version'],{encoding:'utf8'}).split('\n')[0];
  fs.mkdirSync(path.join(base,'markings'));fs.mkdirSync(path.join(base,'composites'));
  for(const {pattern,rawFile,promptFile,rawBytes,prompt,raw} of prepared){
    const mask=new PNG({width:1254,height:1254});let rawOutsideAlphaPixels=0,sum=0;
    for(let k=0;k<count;k++){const i=k*4,a=raw.data[i+3],limit=keyed.data[i+3],out=Math.round(a*limit/255);
      rawOutsideAlphaPixels+=a>0&&limit===0;mask.data.set([255,255,255,out],i);sum+=out;
    }
    const assessment=requireConserved(mask),file=path.join(base,'markings',pattern+'.png');
    fs.writeFileSync(file,PNG.sync.write(mask),{flag:'wx'});assert.deepEqual(requireConserved(PNG.sync.read(read(file))),assessment);
    if(pattern==='striped'){
      const control=PNG.sync.read(read(file));requireConserved(control);
      const outside=Array.from({length:count},(_,k)=>k).find(k=>keyed.data[k*4+3]===0);assert(outside!==undefined,'Outside-alpha control pixel required');
      control.data[outside*4+3]=255;const mutant=assess(control);assert.equal(mutant.outsideAlphaPixels,1);assert.throws(()=>requireConserved(control));
      report.controls={validAccepted:true,outsidePixelMutantRefused:true,outsidePixel:[outside%1254,Math.floor(outside/1254)],mutantAssessment:mutant};
    }
    manifest.patterns[pattern]={file:rel(file),sha256:sha(read(file)),promptFile:rel(promptFile),promptSha256:sha(prompt),prompt:prompt.toString('utf8'),promptBytesBase64:prompt.toString('base64'),tool:'image_gen.imagegen',seed:null,rawFile:rel(rawFile),rawSha256:sha(rawBytes),transform:{resize:null,translationPx:[0,0],registration:null,rgb:[255,255,255],alpha:'generated alpha × keyed alpha / 255, rounded; no anatomical exclusions'}};
    const composite=path.join(base,'composites',pattern+'.png');execFileSync('magick',[keyedFile,file,'-compose','over','-composite',composite]);
    report.rows.push({pattern,width:1254,height:1254,...assessment,opaqueEquivalentPixels:sum/255,rawOutsideAlphaPixels,sha256:sha(read(file)),compositeFile:rel(composite),compositeSha256:sha(read(composite))});
  }
  execFileSync('magick',['montage','-font',font,'-pointsize','23','-fill','white','-background','#162029',...patterns.flatMap(p=>['-label',p,path.join(base,'composites',p+'.png')]),'-tile','3x2','-geometry','627x627+8+8',path.join(base,'six-mask-sheet.png')]);
  for(const [p,h]of Object.entries(sourceHashes))assert.equal(sha(read(path.resolve(base,p))),h,'Unchanged input: '+p);
  report.status='PASS';report.sheetFile='six-mask-sheet.png';report.sheetSha256=sha(read(path.join(base,report.sheetFile)));
  report.previewOnly='Sheet cells are thumbnails; masks and composites remain unchanged 1254-square master coordinates.';
  fs.writeFileSync(path.join(base,'markings.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  fs.writeFileSync(path.join(base,'conservation.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:report.status,rows:report.rows,controls:report.controls}));
}catch(error){report.status='FAIL';report.error=String(error.stack??error);if(!fs.existsSync(path.join(base,'conservation.json')))fs.writeFileSync(path.join(base,'conservation.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});throw error;}
