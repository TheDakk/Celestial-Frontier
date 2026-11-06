/** Observational source readback; no keyer, matte, intake, ruler or source edit. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [recipeFile,baselineFile,derivativeDir,out] = process.argv.slice(2);
assert.equal(process.argv.length,6);assert.ok(!fs.existsSync(out));
const req=createRequire(path.join(process.cwd(),'port/v2/package.json'));
const sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const pin=p=>({path:p,sha256:sha(fs.readFileSync(p))});
const recipe=JSON.parse(fs.readFileSync(recipeFile));
for(const p of[recipe.original,recipe.canonical,...recipe.lineage??[]])assert.equal(pin(p.path).sha256,p.sha256);
const read=async p=>sharp(p).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const original=await read(recipe.original.path),baseline=await read(baselineFile),actual=await read(derivativeDir+'/master.png');
const {width:w,height:h}=original.info;assert.equal(actual.info.width,w);assert.equal(actual.info.height,h);
assert.equal(baseline.info.width,w);assert.equal(baseline.info.height,h);
const selected=new Set(recipe.despillPixels??[]),protectedSet=new Set(recipe.protectedPixels??[]);
let outsideChanged=0,opacityGrowth=0,positiveMaskChanged=0,protectedChanged=0,changedPixels=0;
for(let i=0;i<w*h;i++){
 const k=i*4,a=actual.data,b=baseline.data,changed=[0,1,2,3].some(c=>a[k+c]!==b[k+c]);
 if(changed){changedPixels++;if(!selected.has(i))outsideChanged++;if(protectedSet.has(i))protectedChanged++;}
 if(a[k+3]>b[k+3])opacityGrowth++;
 if(Boolean(a[k+3])!==Boolean(b[k+3]))positiveMaskChanged++;
}
assert.equal(outsideChanged,0);assert.equal(opacityGrowth,0);assert.equal(positiveMaskChanged,0);assert.equal(protectedChanged,0);
const receipt=JSON.parse(fs.readFileSync(derivativeDir+'/post-key-derivative.json'));
assert.equal(receipt.requestSha256,pin(recipeFile).sha256);
assert.equal(receipt.output.rgbaSha256,sha(actual.data));
const nested=receipt.derivative.reviewedDonorExclusions;
if(nested){
 assert.equal(nested.status,'RESOLVED');assert.equal(nested.targets.length,selected.size);
 for(const t of nested.targets){assert.ok(selected.has(t.index));assert.ok(!recipe.donorExclusionPixels.includes(t.donorIndex));assert.deepEqual(t.donorRgb,[...original.data.subarray(t.donorIndex*4,t.donorIndex*4+3)]);assert.deepEqual([...actual.data.subarray(t.index*4,t.index*4+3)],t.donorRgb);}
}
fs.mkdirSync(out,{recursive:true});
for(const [label,p]of[['baseline',baselineFile],['actual',derivativeDir+'/master.png']])for(const color of['gray','black'])await sharp(p).flatten({background:color==='gray'?'#808080':'#000000'}).png().toFile(out+'/'+label+'-'+color+'-full.png');
let minX=w,minY=h,maxX=-1,maxY=-1;
for(const i of selected){const x=i%w,y=Math.floor(i/w);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
if(selected.size){const left=Math.max(0,minX-16),top=Math.max(0,minY-16),width=Math.min(w-left,maxX-left+17),height=Math.min(h-top,maxY-top+17);for(const color of['gray','black'])await sharp(derivativeDir+'/master.png').flatten({background:color==='gray'?'#808080':'#000000'}).extract({left,top,width,height}).resize(width*4,height*4,{kernel:'nearest'}).png().toFile(out+'/actual-targets-'+color+'-4x.png');}
const result={status:'CONSERVATION_PASS_MATERIAL_REVIEW_PENDING',recipe:pin(recipeFile),baseline:pin(baselineFile),actual:pin(derivativeDir+'/master.png'),dimensions:[w,h],targets:selected.size,changedPixels,outsideChanged,opacityGrowth,positiveMaskChanged,protectedChanged,protectedPixels:protectedSet.size,reviewedDonors:nested?{status:nested.status,targets:nested.targets.length,allActualSourceRgb:true}:null,materialAcceptance:false,intakeAuthorized:false};
fs.writeFileSync(out+'/readback.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
