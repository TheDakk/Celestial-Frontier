/** Observe every currently compiled crab owner through the ordinary dispatcher. */
import {installSpeciesCanvasFactory} from '../../packages/art/src/speciescanvas.ts';
import {resolveOverrideCanvas} from '../../packages/art/src/speciesoverrides.ts';
import {speciesVisualKey} from '../../packages/art/src/speciesidentity.ts';
import {makeGenome} from '../../packages/domain/genome/src/index.ts';
import {hashInt} from '../../packages/domain/rand/src/index.ts';
import {compileCrabObservationRecord} from '../creature-animation/crab-observation-record.mjs';
import {admitFamilyRecord} from '../creature-animation/family-record.mjs';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';
const names=['Crab','Coconut Crab','Freshwater Crab','Mud Crab','Vent Crab'];
const state={status:'RUNNING',completed:0,total:names.length};window.cfFaunaCensus={state};
const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);},png=async c=>new Uint8Array(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());
const need=(ok,m)=>{if(!ok)throw Error(m);};
try{
 installSpeciesCanvasFactory((w,h)=>new OffscreenCanvas(w,h));const rows=[],artifacts={};
 for(const [i,name]of names.entries()){
  const genome={...makeGenome(hashInt(0xEA47,i,0)>>>0,'fauna',1),_earthName:name},id=name.toLowerCase().replaceAll(' ','-');let topology,ink;
  const callback=(value,canvas)=>{topology=value;ink=canvas;};callback.captureParts=true;
  const rendered=resolveOverrideCanvas(genome,callback),plain=resolveOverrideCanvas(genome);
  need(rendered&&plain&&ink&&topology?.partMasks,'Actual source masks missing: '+name);
  const a=rendered.getContext('2d').getImageData(0,0,rendered.width,rendered.height).data,b=plain.getContext('2d').getImageData(0,0,plain.width,plain.height).data;
  need(a.length===b.length,'parity dimensions');let changed=0;for(let k=0;k<a.length;k++)if(a[k]!==b[k])changed++;need(changed===0,'Readback altered ordinary painting: '+name+' '+changed);
  const master=await png(ink),rgba=ink.getContext('2d').getImageData(0,0,ink.width,ink.height).data,alpha=Uint8Array.from({length:ink.width*ink.height},(_,k)=>rgba[k*4+3]);
  const{partMasks,...geometry}=topology;need(partMasks.replay?.differentChannels===0&&partMasks.replay?.prefixReads>1,'Exact prefix replay proof missing');const record=await compileCrabObservationRecord(geometry,{identity:{speciesVisualKey:speciesVisualKey(genome),seed:genome.seed,ownerId:topology.ownerId,earthName:name},cutoutAssetHash:await hashBytes(master),width:ink.width,height:ink.height});
  await admitFamilyRecord(record,master,alpha);need(partMasks.parts.length<=40&&partMasks.width===ink.width&&partMasks.height===ink.height,'mask limits');
  const joints=new Set(Object.keys(record.landmarks));need(partMasks.parts.every(p=>joints.has(p.joint)),'mask joint absent');
  let owned=0;for(let k=0;k<alpha.length;k++){need(!!alpha[k]===!!partMasks.labels[k],'paint ownership');if(alpha[k])owned++;}
  const labelCanvas=new OffscreenCanvas(ink.width,ink.height),labelData=new Uint8ClampedArray(alpha.length*4);for(let k=0;k<alpha.length;k++)labelData.set([partMasks.labels[k],0,0,255],k*4);labelCanvas.getContext('2d').putImageData(new ImageData(labelData,ink.width,ink.height),0,0);
  const labels=await png(labelCanvas),body={schema:'cf.painter-part-intake/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,labelsFile:'labels.png',labelsSha256:await hashBytes(labels),parts:partMasks.parts};
  artifacts[id+'-master.png']=b64(master);artifacts[id+'-labels.png']=b64(labels);
  for(const[n,v]of Object.entries({'record.json':record,'declaration.json':{...body,declarationHash:await hashJSON(body)},'topology.json':geometry}))artifacts[id+'-'+n]=b64(new TextEncoder().encode(JSON.stringify(v,null,2)+'\n'));
  rows.push({name,owner:topology.ownerId,changedChannels:changed,ownedPixels:owned,parts:partMasks.parts.length,replay:partMasks.replay,recordRecipeHash:record.recipeHash,qualification:'SOURCE_MASKS_ONLY'});state.completed++;
 }
 window.cfFaunaCensus.report={schema:'cf.source-painter-parts/v1',status:'DIAGNOSTIC_PASS',scope:'Actual source-stage ownership, hash/alpha admission and ordinary painter parity. No motion/visual/phone qualification.',rows};window.cfFaunaCensus.artifacts=artifacts;state.status='DONE';
}catch(error){state.status='FAIL';state.error=String(error.stack??error);}
