import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {setup,json,PNG} from '../C169_NAPE_RECUT_20261002/publication.mjs';
import {traceSourcePixels} from '../C169_NAPE_RECUT_20261002/source-trace.mjs';
import {rasterPaint} from '../C132_FAINT_GROUND_20261002/render-mesh.mjs';
import {createOpaqueSeamSamplingGuard,applyOpaqueSeamSamplingGuard} from '../../port/v2/tools/creature-animation/seam-sampling-guard.mjs';
const {loadCreatureRigV1}=await import('../../port/v2/apps/game/src/creature-rig.ts');
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{BufferImageSource,Texture}=require('pixi.js');
const base='audits/C173_EQUID_REAUTHOR_20261002',read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
const pins=new Map(),pin=p=>pins.set(p,sha(read(p))),rows=[];
const context=json('audits/C169_NAPE_RECUT_20261002/inputs.json').rows.find(r=>r.id==='wild-pony').native;
function scan(dir,pattern){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())scan(p,pattern);else if(pattern.test(p))pin(p);}}
scan('port/v2/apps/game/src/motion',/\.ts$/);scan('port/v2/tools/creature-animation',/\.(mjs|ts|wasm)$/);
for(const p of ['port/v2/apps/game/src/battle2/choreography.ts','port/v2/apps/game/src/creature-rig.ts','port/v2/apps/game/src/creature-rig-contact.ts',base+'/compare.mjs',base+'/inputs.json','audits/C169_NAPE_RECUT_20261002/publication.mjs','audits/C169_NAPE_RECUT_20261002/source-trace.mjs','audits/C169_NAPE_RECUT_20261002/inputs.json','audits/C132_FAINT_GROUND_20261002/paint-publication.mjs','audits/C132_FAINT_GROUND_20261002/render-mesh.mjs'])pin(p);
for(const input of json(base+'/inputs.json').rows){
 for(const source of input.inputs){assert.equal(sha(read(source.path)),source.sha256);pin(source.path);}
 for(const name of ['record.json','binding.json'])pin(input.fit+'/'+name);
 const variants=[];
 for(const mode of ['original','candidate']){
  const fit=mode==='original'?input.originalFit:input.fit,packet=mode==='original'?input.originalPacket:input.packet,s=setup({...input,fit,native:context},fit);
  const atlasPath=fit+'/parts/atlas/'+fs.readdirSync(fit+'/parts/atlas').find(p=>p.endsWith('.png')),atlasBytes=read(atlasPath),keyed=PNG.sync.read(read(fit+'/parts/keyed.png'));
  pin(atlasPath);pin(fit+'/parts/keyed.png');pin(packet+'/master.png');pin(packet+'/authoring.json');
  const alpha=Uint8Array.from({length:keyed.width*keyed.height},(_,i)=>keyed.data[i*4+3]),texture=new Texture({source:new BufferImageSource({resource:new Uint8Array(s.atlas.data),width:s.atlas.width,height:s.atlas.height})});
  const rig=await loadCreatureRigV1(s.record,s.binding,read(packet+'/master.png'),alpha,atlasBytes,async()=>texture);
  const facings=[],heldMs=s.timeline.durationMs+1000;
  const atlasHash=sha(s.atlas.data),guard=createOpaqueSeamSamplingGuard({record:s.record,binding:s.binding,atlas:{width:s.atlas.width,height:s.atlas.height,rgba:s.atlas.data}}),guarded={...s.atlas,data:applyOpaqueSeamSamplingGuard(Uint8Array.from(s.atlas.data),s.atlas.width,s.atlas.height,guard)};
  assert.equal(sha(s.atlas.data),atlasHash,'diagnostic guard must not change the source atlas');
  try{for(const side of ['left','right']){
   const result={side,samples:0,refusal:null,maximumPublishedContactDriftPx:0,actualRuntimeParity:[],sourceAttributedPonyPixels:[]};
   for(const elapsedMs of [...Array.from({length:121},(_,i)=>s.timeline.durationMs*i/120),s.timeline.durationMs-.001,s.timeline.durationMs+.001,heldMs]){
    try{const frame=s.publish(side,elapsedMs);result.maximumPublishedContactDriftPx=Math.max(result.maximumPublishedContactDriftPx,...frame.publishedContacts.map(c=>c.driftPx));result.samples++;}
    catch(error){result.refusal={elapsedMs,message:String(error.stack??error).replaceAll(/\/Users\/[^/\s"\\]+/g,'~')};break;}
   }
   for(const elapsedMs of [0,s.timeline.durationMs/2,heldMs]){
    try{const frame=s.publish(side,elapsedMs);rig.applyPose(frame.resolved);let coordinates=0;
     for(const part of rig.parts){const actual=part.display.children[0].geometry.getBuffer('aPosition').data,expected=frame.positions[part.id];assert.equal(actual.length,expected.length);assert(Buffer.from(actual.buffer,actual.byteOffset,actual.byteLength).equals(Buffer.from(expected.buffer,expected.byteOffset,expected.byteLength)),'actual CreatureRig publication differs '+part.id);coordinates+=actual.length;}
     result.actualRuntimeParity.push({elapsedMs,coordinates,byteParity:true});
     if(elapsedMs===heldMs||elapsedMs===0&&side==='right'){
      const pose=elapsedMs===heldMs?'held-faint':'initial-idle';const png=PNG.sync.write(rasterPaint(s.record,s.binding,guarded,frame.positions,side==='left'?1:-1));
      fs.writeFileSync(base+'/'+input.id+'/'+mode+'-'+pose+'-'+side+'.png',png,{flag:'wx'});
      if(input.id==='wild-pony'&&elapsedMs===heldMs){const points=traceSourcePixels(s.record,s.binding,s.atlas,frame.positions);for(const source of [[871,353],[882,341]]){const found=points.filter(p=>p.source[0]===source[0]&&p.source[1]===source[1]);assert.equal(found.length,1,'attributed paint conserved exactly once');result.sourceAttributedPonyPixels.push(found[0]);}}
     }
    }catch(error){result.publicationReviewRefusal={elapsedMs,message:String(error.stack??error).replaceAll(/\/Users\/[^/\s"\\]+/g,'~')};break;}
   }
   facings.push(result);
  }}finally{rig.dispose();}
  variants.push({mode,fit,durationMs:s.timeline.durationMs,facings,qualityAccepted:false});
 }
 const row={id:input.id,variants,sourceCoordinateUnit:'posed coordinates normalized by original 1254-square painting; multiply by 1254 for source-coordinate pixels, not native film pixels',nativeRun:false,qualityAccepted:false};rows.push(row);
 fs.writeFileSync(base+'/'+input.id+'/comparison.json',JSON.stringify(row,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({id:input.id,variants:variants.map(v=>({mode:v.mode,facings:v.facings.map(f=>({side:f.side,samples:f.samples,refusal:f.refusal,reviewRefusal:f.publicationReviewRefusal??null}))}))}));
}
for(const[p,h]of pins)assert.equal(sha(read(p)),h,'source drift '+p);
fs.writeFileSync(base+'/comparison.json',JSON.stringify({schema:'cf.c173-equid-publication/v1',rows,sourcePins:[...pins].map(([path,sha256])=>({path,sha256})),sourceUnchanged:true,
 scope:'Runtime-equivalent contact/compiled skin/ARAP/rigid-parent publication, checked against loaded CreatureRigV1 with decoded CPU textures. Source-coordinate software raster only. The same recorded stage geometry and turn timings are reused for deterministic comparisons; this does not reproduce or certify a new native capture.',nativeRun:false,qualityAccepted:false},null,2)+'\n',{flag:'wx'});
