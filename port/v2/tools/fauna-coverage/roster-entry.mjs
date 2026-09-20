/** Exhaust the named intake roster without manufacturing missing source anatomy. */
import inventory from './roster-inventory.json';
import {_EARTH_NAMES} from '../../packages/domain/descriptors/src/index.ts';
import {makeGenome} from '../../packages/domain/genome/src/index.ts';
import {hashInt} from '../../packages/domain/rand/src/index.ts';
import {installSpeciesCanvasFactory} from '../../packages/art/src/speciescanvas.ts';
import {resolveOverrideCanvas} from '../../packages/art/src/speciesoverrides.ts';
import {speciesVisualKey} from '../../packages/art/src/speciesidentity.ts';
import {compileCrabObservationRecord} from '../creature-animation/crab-observation-record.mjs';
import {admitFamilyRecord} from '../creature-animation/family-record.mjs';
import {comparePixels,inspectInk} from './census-contract.mjs';
const retained=new Set(['Crab','Coconut Crab','Freshwater Crab','Mud Crab','Vent Crab']);
const state={status:'RUNNING',completed:0,total:58};window.cfFaunaCensus={state};
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
try{
 if(inventory.rows.length!==58||new Set(inventory.rows.map(r=>r.name)).size!==58)throw Error('Roster missing or duplicated identities');
 installSpeciesCanvasFactory((w,h)=>new OffscreenCanvas(w,h));const rows=[],artifacts={},ki=Object.keys(_EARTH_NAMES).indexOf('fauna');
 for(const item of inventory.rows){
  const id=item.name.toLowerCase().replaceAll(' ','-'),row={...item,id,visualAcceptance:null,groupingAuthority:'Requested source-routing profile; actual observed owner/family reported separately'};rows.push(row);
  if(retained.has(item.name)){Object.assign(row,{status:'REUSE_COMPLETED',fit:'RETAINED',bind:'RETAINED',capture:'RETAINED',binding:'audits/ANATOMY_SINGLE_RUN_20260919/R9/rebound-01/'+id,film:'audits/ANATOMY_SINGLE_RUN_20260919/R9/native-'+id+'/family-full-rows.webm',reason:'Same five source inputs already fitted, bound and natively captured; no unchanged repeat'});state.completed++;continue;}
  try{
   const i=_EARTH_NAMES.fauna.indexOf(item.name);if(i<0)throw Error('Named source absent');const genome={...makeGenome(hashInt(0xEA47,i,ki)>>>0,'fauna',1),_earthName:item.name};let observation,ink,calls=0;
   const painted=resolveOverrideCanvas(genome,(o,c)=>{observation=o;ink=c;calls++;});if(!painted||!ink||calls!==1)throw Error('Source painter unavailable');
   const ordinary=resolveOverrideCanvas(genome);row.changedChannels=comparePixels(painted.getContext('2d').getImageData(0,0,painted.width,painted.height).data,ordinary.getContext('2d').getImageData(0,0,ordinary.width,ordinary.height).data);if(row.changedChannels)throw Error('Observer changes source pixels');
   const rgba=ink.getContext('2d').getImageData(0,0,ink.width,ink.height).data,png=new Uint8Array(await(await ink.convertToBlob({type:'image/png'})).arrayBuffer());row.ink=inspectInk(rgba,ink.width,ink.height);row.sourceSha256=await sha(png);row.sourceMaster=id+'.png';row.observedFamily=observation?.family??null;row.observedOwner=observation?.ownerId??null;row.unresolved=observation?.unresolved??['Winning painter emits no anatomy observation'];
   artifacts[id+'.png']=base64(png);artifacts[id+'-source.json']=base64(new TextEncoder().encode(JSON.stringify({genome,observation:observation??null},null,2)+'\n'));
   try{
    if(!observation)throw Error('No source-bound observation, landmark graph or ownership masks; complete fit cannot be admitted');
    if(observation.family!=='brachyuran')throw Error('No complete source-bound record compiler for observed '+observation.family+'; partial features are not fitted joint/part ownership');
    const record=await compileCrabObservationRecord(observation,{identity:{speciesVisualKey:speciesVisualKey(genome),seed:genome.seed,ownerId:observation.ownerId,earthName:item.name},cutoutAssetHash:row.sourceSha256,width:ink.width,height:ink.height});
    await admitFamilyRecord(record,png,Uint8Array.from({length:ink.width*ink.height},(_,j)=>rgba[j*4+3]));
    row.fit='PASS';row.status='BINDING_REQUIRED';row.reason='New complete fit requires an actual mask/binding producer';artifacts[id+'-record.json']=base64(new TextEncoder().encode(JSON.stringify(record,null,2)+'\n'));
   }catch(e){row.fit='REFUSED';row.status='REFUSED';row.reason=String(e);}
   row.bind='SKIPPED_FIT_REFUSAL';row.capture='STATIC_SOURCE_ONLY';
  }catch(e){row.status='SOURCE_RED';row.fit='REFUSED';row.bind='SKIPPED';row.capture='UNAVAILABLE';row.reason=String(e.stack??e);}
  state.completed++;await new Promise(r=>setTimeout(r,0));
 }
 const families=inventory.familyOrder.map(profile=>{const r=rows.filter(x=>x.profile===profile);return {profile,total:r.length,retained:r.filter(x=>x.status==='REUSE_COMPLETED').length,refused:r.filter(x=>x.status==='REFUSED').length,sourceReds:r.filter(x=>x.status==='SOURCE_RED').length};});
 window.cfFaunaCensus.report={schema:'cf.exhausted-roster-intake/v1',status:rows.some(r=>['SOURCE_RED','BINDING_REQUIRED'].includes(r.status))?'LEAF_RED':'DIAGNOSTIC_PASS',scope:'Every historical58 identity attempted in source-family order. Refused fits are skipped; static source sheets are not animated captures or visual acceptance.',counts:{total:rows.length,retained:rows.filter(r=>r.status==='REUSE_COMPLETED').length,refused:rows.filter(r=>r.status==='REFUSED').length},families,rows};window.cfFaunaCensus.artifacts=artifacts;state.status='DONE';
}catch(e){state.status='FAIL';state.error=String(e.stack??e);}
