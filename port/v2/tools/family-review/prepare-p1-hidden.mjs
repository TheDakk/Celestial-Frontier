/** One accepted painting, independently authored visible masks; explicit hidden record. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {familyContractForRecord,familyContactChains} from '../creature-animation/family-contracts.mjs';
import {inferHiddenLandmarks} from '../creature-animation/hidden-anatomy.mjs';
import {sealPortableFamilyRecord as sealFamilyRecord} from '../creature-animation/portable-record-writer.mjs';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';
import {intakeAuthoredPixels} from '../creature-animation/authored-intake.mjs';
import {cutPainterParts} from '../creature-animation/part-masks.mjs';
import {buildAuthoredParts} from '../creature-animation/build-authored-parts.mjs';
import {buildPaintSkin} from '../creature-animation/build-paint-skin.mjs';
import {splitObservedSurfaces} from '../creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../quadruped-proof/source-join-continuity.mjs';
const req=createRequire(import.meta.url),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const [specArg,outArg]=process.argv.slice(2),spec=JSON.parse(fs.readFileSync(specArg)),out=path.resolve(outArg),W=spec.size,H=W;
if(fs.existsSync(out))throw Error('New output required');fs.mkdirSync(out,{recursive:true});
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n');
const source=JSON.parse(fs.readFileSync('audits/ANATOMY_COMPLETION_20260917/crab-masks-05/coconut-crab-record.json')),master=fs.readFileSync(spec.master);
if(await hashBytes(master)!==spec.masterSha256)throw Error('Immutable accepted master changed');
const {data,info}=await sharp(master).ensureAlpha().raw().toBuffer({resolveWithObject:true});if(info.width!==W||info.height!==H)throw Error('Master size changed');
const intake=intakeAuthoredPixels(data,W,H);if(data.some((v,i)=>v!==intake.rgba[i]))throw Error('Delivered alpha changed');
const raw={kind:'brachyuran',family:'brachyuran',identity:{...source.identity,ownerId:'authored:P1-coconut-crab/generation-01'},template:{id:'brachyuran',version:1},projection:'source-pincers',anatomy:spec.anatomy,geometry:{cutoutAssetHash:spec.masterSha256,width:W,height:H,groundLineY:1068/H,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks:Object.fromEntries(Object.entries(spec.landmarksPx).map(([j,p])=>[j,p.map(v=>v/W)])),materials:source.materials,clipSetId:'brachyuran-v1',source:spec.master,genome:source.genome,masterIntakeAccepted:true,qualityAccepted:true,coverage:{scope:'Six visible legs, claws, eyes, body; fourth pair explicitly hidden',artAcceptance:spec.artAcceptance,hiddenInference:'Pair2 mirror across body axis at extrapolated root; template segment proportions preserved 1:1',nativeAcceptance:false},provenance:{observationSha256:await hashBytes(fs.readFileSync(specArg)),sourceLabelsReused:false,sourceLandmarksReused:false,rgbaChanges:0}};
raw.landmarks=inferHiddenLandmarks(familyContractForRecord(raw),raw.landmarks);const record=await sealFamilyRecord(raw);write('record.json',record);
// Independent polygons are rasterized once; only visible source alpha is assigned.
const inside=(x,y,p)=>{let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const near=(x,y,p,radius=spec.maskEdgeRadiusPx)=>{if(inside(x,y,p))return true;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));if(Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<=radius)return true;}return false;};
const parts=[{id:'body',joint:'root',layer:'near'}];for(const leg of spec.legs)for(const [suffix,joint]of[['upper','Knee'],['lower','Foot']])parts.push({id:leg.id.toLowerCase()+'-'+suffix,joint:leg.id+joint,layer:leg.layer});
for(const side of ['Far','Near'])for(const [suffix,joint]of[['arm','Elbow'],['palm','Palm'],['finger','DactylRoot']])parts.push({id:'claw-'+side.toLowerCase()+'-'+suffix,joint:'claw'+side+joint,layer:'near'});
for(const side of ['Far','Near'])parts.push({id:'eye-'+side.toLowerCase(),joint:'eye'+side+'Tip',layer:'near'});
const labels=new Uint8Array(W*H),counts=parts.map(()=>0);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!data[i*4+3])continue;let k=0;
 for(const [n,leg]of spec.legs.entries())if(near(x+.5,y+.5,leg.region)){const a=leg.root,b=leg.knee,dx=b[0]-a[0],dy=b[1]-a[1],lower=(x-b[0])*dx+(y-b[1])*dy>=0;k=1+2*n+Number(lower);}
 for(let n=0;n<2;n++)if(near(x+.5,y+.5,spec.claws[n].poly,spec.clawEdgeRadiusPx)){// Authored boundaries at the cuff and moving-finger seam.
  const arm=n===0?y<590:y<643;
  const finger=n===0?x>654+(y-770)*.31&&y>748:x<973-(y-824)*.10&&y>829;
  k=13+n*3+(arm?0:finger?2:1);
 }
 for(let n=0;n<2;n++)if(near(x+.5,y+.5,spec.eyes[n].poly,spec.eyeEdgeRadiusPx))k=19+n;
 labels[i]=k+1;counts[k]++;
}
const rgb=Buffer.alloc(W*H*4);for(let i=0;i<labels.length;i++)rgb.set([labels[i],labels[i],labels[i],255],i*4);await sharp(rgb,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(out,'labels.png'));
const body={schema:'cf.painter-part-intake/v1',recordRecipeHash:record.recipeHash,cutoutSha256:spec.masterSha256,labelsFile:'labels.png',labelsSha256:await hashBytes(fs.readFileSync(path.join(out,'labels.png'))),parts};
const declaration={...body,declarationHash:await hashJSON(body)};write('declaration.json',declaration);
// Same exact label intake schema; provenance explicitly says hand-authored NEW masks,
// not painter-emitted labels. No labels or ownership are copied from the canvas guide.
await cutPainterParts(record,master,data,labels,declaration);
const compiledParts=await buildAuthoredParts({id:'p1-coconut-crab',recordFile:path.join(out,'record.json'),masterFile:spec.master,declarationFile:path.join(out,'declaration.json'),output:path.join(out,'parts')});
write('mask-receipt.json',{sourceLabelsReused:false,owner:'independently authored polygons on generation 01',counts,hiddenParts:[],intake:intake.receipt,rgbaChangedChannels:0,parts:compiledParts});
const compiled=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:24,interiorStep:56,includeTopology:true});
const {bindingHash,...bindingBody}=compiled.binding;bindingBody.sourceJoinTopology={remainderPartId:'body'};const binding={...bindingBody,bindingHash:await hashJSON(bindingBody)};
const atlas=await sharp(fs.readFileSync(path.join(out,'parts/atlas/p1-coconut-crab.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
const split=await splitObservedSurfaces(binding,record,probe,{fixedJoints:['root'],contactEndpoints:familyContactChains(familyContractForRecord(record)).map(c=>c.end),shapeJoints:parts.filter(p=>p.joint!=='root').map(p=>p.joint)});
write('binding.json',split.binding);write('receipt.json',{parts:compiledParts,surfaces:split.receipt,masterIntakeAccepted:true,nativeAcceptance:false});console.log(JSON.stringify({parts:compiledParts,surfaces:split.receipt}));
