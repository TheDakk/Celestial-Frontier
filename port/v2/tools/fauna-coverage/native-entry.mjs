/** Raster/observer census of the real owners; not animation or visual approval. */
import {_EARTH_NAMES} from '../../packages/domain/descriptors/src/index.ts';
import {makeGenome} from '../../packages/domain/genome/src/index.ts';
import {hashInt} from '../../packages/domain/rand/src/index.ts';
import {installSpeciesCanvasFactory} from '../../packages/art/src/speciescanvas.ts';
import {resolveOverrideCanvas} from '../../packages/art/src/speciesoverrides.ts';
import {planFor} from '../../packages/art/src/proceduraloverrides.ts';
import {speciesVisualKey} from '../../packages/art/src/speciesidentity.ts';
import {inspectInk,comparePixels,summarizeCensus} from './census-contract.mjs';
import {compileCrabObservationRecord} from '../creature-animation/crab-observation-record.mjs';
import {admitFamilyRecord} from '../creature-animation/family-record.mjs';
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
const state={status:'RUNNING',completed:0,total:0};window.cfFaunaCensus={state};
try{
 installSpeciesCanvasFactory((w,h)=>new OffscreenCanvas(w,h));
 const cases=[],kingdoms=Object.keys(_EARTH_NAMES);
 for(const [ki,kingdom]of kingdoms.entries()){
  _EARTH_NAMES[kingdom].forEach((name,i)=>cases.push({id:kingdom+':'+name,kind:'earth',genome:{...makeGenome(hashInt(0xEA47,i,ki)>>>0,kingdom,1),_earthName:name}}));
  for(let heat=0;heat<=2;heat++)for(let sample=0;sample<20;sample++)cases.push({id:kingdom+':heat'+heat+':'+sample,kind:'procedural',genome:makeGenome(hashInt(0xF00D,ki*100+heat*25+sample,7)>>>0,kingdom,heat)});
 }
 state.total=cases.length;const rows=[],artifacts={};
 for(const item of cases){
  const row={id:item.id,kind:item.kind,kingdom:item.genome.kingdom,seed:item.genome.seed,visualQualification:'NOT_EVALUATED',animationQualification:'NOT_EVALUATED'};rows.push(row);
  try{
   let observation,ink,called=0;
   const painted=resolveOverrideCanvas(item.genome,(value,canvas)=>{called++;observation=value;ink=canvas;});
   if(!painted){row.status='LEGACY_FALLTHROUGH';row.topology='NOT_OBSERVED';}
   else{
    if(called!==1||!ink)throw Error('Winning painter did not expose one ink canvas');
    const data=ink.getContext('2d').getImageData(0,0,ink.width,ink.height).data;
    row.ink=inspectInk(data,ink.width,ink.height);row.ink.sha256=await sha(data);
    const ordinary=resolveOverrideCanvas(item.genome);
    if(!ordinary||ordinary.width!==painted.width||ordinary.height!==painted.height)throw Error('Observation changed output dimensions');
    row.changedChannels=comparePixels(painted.getContext('2d').getImageData(0,0,painted.width,painted.height).data,ordinary.getContext('2d').getImageData(0,0,ordinary.width,ordinary.height).data);
    if(row.changedChannels)throw Error('Observation changed ordinary painting');
    if(observation){
     const pngBytes=new Uint8Array(await(await ink.convertToBlob({type:'image/png'})).arrayBuffer()),stem=item.id.toLowerCase().replace(/[^a-z0-9]+/g,'-');let binary='';for(let i=0;i<pngBytes.length;i+=8192)binary+=String.fromCharCode(...pngBytes.subarray(i,i+8192));artifacts[stem+'.png']=btoa(binary);const provenance=new TextEncoder().encode(JSON.stringify({genome:item.genome,observation},null,2)+'\n');binary='';for(let i=0;i<provenance.length;i+=8192)binary+=String.fromCharCode(...provenance.subarray(i,i+8192));artifacts[stem+'.json']=btoa(binary);row.sourceMaster=stem+'.png';row.sourceObservation=stem+'.json';
     row.geometryAdmission={status:'UNSUPPORTED_FAMILY',reason:'No complete source-observation compiler for '+observation.family};
    }
    if(observation?.family==='brachyuran'){try{
     const png=new Uint8Array(await(await ink.convertToBlob({type:'image/png'})).arrayBuffer());
     const input={identity:{speciesVisualKey:speciesVisualKey(item.genome),seed:item.genome.seed,ownerId:observation.ownerId,earthName:item.genome._earthName??null},cutoutAssetHash:await sha(png),width:ink.width,height:ink.height};
     const record=await compileCrabObservationRecord(observation,input),alpha=Uint8Array.from({length:ink.width*ink.height},(_,i)=>data[i*4+3]);
     await admitFamilyRecord(record,png,alpha);
     const {rasterFrame:removed,...oldSpace}=observation;let oldSpaceRefused=false;
     try{await compileCrabObservationRecord(oldSpace,input);}catch(error){oldSpaceRefused=String(error).includes('raster frame');}
     if(!removed||!oldSpaceRefused)throw Error('Missing raster frame negative control');
     const file=item.genome._earthName.toLowerCase().replaceAll(' ','-')+'.png';let binary='';for(let i=0;i<png.length;i+=8192)binary+=String.fromCharCode(...png.subarray(i,i+8192));artifacts[file]=btoa(binary);
     row.geometryAdmission={master:file,status:'PASS',joints:Object.keys(record.landmarks).length,recipeHash:record.recipeHash,actualAlphaChecked:true,missingFrameRefused:oldSpaceRefused,record};
    }catch(e){row.geometryAdmission={status:'INCOMPLETE_OBSERVATION',reason:String(e)};}}
    row.status='RASTER_PASS';row.topology=observation?'GEOMETRY_EMITTED':'NO_TOPOLOGY_EMISSION';
    if(observation)row.observation={owner:observation.ownerId,family:observation.family,materials:observation.materials,features:observation.features.map(f=>({id:f.id,kind:f.kind,pointCount:f.points.length})),unresolved:observation.unresolved,sha256:await sha(new TextEncoder().encode(JSON.stringify(observation)))};
   }
   if(item.kind==='procedural')row.plan=planFor(item.genome)?.kind??'separate-kingdom-or-legacy-owner';
  }catch(error){row.status='FAIL';row.error=String(error.stack??error);}
  state.completed++;if(state.completed%5===0)await new Promise(r=>setTimeout(r,0));
 }
 const counts=summarizeCensus(rows,cases.map(c=>c.id));
 window.cfFaunaCensus.report={schema:'cf.native-painter-census/v1',status:counts.failures?'FAIL':'DIAGNOSTIC_PASS',scope:'All current Earth names plus the established 240 procedural samples. Nonblank ink and exact observer/ordinary raster parity only. Geometry emissions are not part masks, fitted art or animation qualification. Quadruped anatomy also has a separate observer not exercised by this topology census; legacy fallthrough is explicitly untested.',counts,rows};
 window.cfFaunaCensus.artifacts=artifacts;
 state.status='DONE';
}catch(error){state.status='FAIL';state.error=String(error.stack??error);}
