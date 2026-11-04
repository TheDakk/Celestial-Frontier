import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';
import {setup,json,PNG} from '../C169_NAPE_RECUT_20261002/publication.mjs';
import {rasterPaint} from '../C132_FAINT_GROUND_20261002/render-mesh.mjs';
import {createOpaqueSeamSamplingGuard,applyOpaqueSeamSamplingGuard} from '../../port/v2/tools/creature-animation/seam-sampling-guard.mjs';
const {loadCreatureRigV1}=await import('../../port/v2/apps/game/src/creature-rig.ts');
const req=createRequire(new URL('../../port/v2/package.json',import.meta.url)),{BufferImageSource,Texture}=req('pixi.js'),base='audits/C183_ISLAND_AUTHORING_20261002',id=process.argv[2],dir=base+'/'+id,read=p=>fs.readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex'),pins=new Map(),pin=p=>pins.set(p,sha(read(p)));
assert(/^(10-grouse|20-hornbill|21-parrot|24-weaverbird)$/.test(id));assert(!fs.existsSync(dir+'/comparison.json'));
const input=json(base+'/bird-inputs.json').rows.find(r=>r.id===id),report=json(dir+'/original-native.json'),native={frame:report.gates.frame,stands:report.gates.stands,restFill:report.gates.restFill,turn:report.gates.turns.find(t=>t.turn===3)};assert(native.turn);
for(const source of input.inputs){assert.equal(sha(read(source.snapshot)),source.sha256);pin(source.snapshot);}
function scan(dir,pattern){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())scan(p,pattern);else if(pattern.test(p))pin(p);}}
scan('port/v2/apps/game/src/motion',/\.ts$/);scan('port/v2/tools/creature-animation',/\.(mjs|ts|wasm)$/);
for(const p of ['port/v2/apps/game/src/battle2/choreography.ts','port/v2/apps/game/src/creature-rig.ts','port/v2/apps/game/src/creature-rig-contact.ts',base+'/compare-bird.mjs',base+'/bird-inputs.json','audits/C169_NAPE_RECUT_20261002/publication.mjs','audits/C132_FAINT_GROUND_20261002/paint-publication.mjs','audits/C132_FAINT_GROUND_20261002/render-mesh.mjs'])pin(p);
const variants=[];
for(const mode of ['original','candidate']){
 const fit=mode==='original'?input.fit:dir+'/fit01',packet=mode==='original'?input.packet:dir+'/candidate',s=setup({...input,native},fit),atlasPath=fit+'/parts/atlas/'+fs.readdirSync(fit+'/parts/atlas').find(p=>p.endsWith('.png')),atlasBytes=read(atlasPath),keyed=PNG.sync.read(read(fit+'/parts/keyed.png'));
 for(const p of [atlasPath,fit+'/parts/keyed.png',fit+'/record.json',fit+'/binding.json',packet+'/master.png',packet+'/authoring.json'])pin(p);
 const alpha=Uint8Array.from({length:keyed.width*keyed.height},(_,i)=>keyed.data[i*4+3]),texture=new Texture({source:new BufferImageSource({resource:new Uint8Array(s.atlas.data),width:s.atlas.width,height:s.atlas.height})}),rig=await loadCreatureRigV1(s.record,s.binding,read(packet+'/master.png'),alpha,atlasBytes,async()=>texture),heldMs=s.timeline.durationMs+1000,atlasHash=sha(s.atlas.data),guard=createOpaqueSeamSamplingGuard({record:s.record,binding:s.binding,atlas:{width:s.atlas.width,height:s.atlas.height,rgba:s.atlas.data}}),guarded={...s.atlas,data:applyOpaqueSeamSamplingGuard(Uint8Array.from(s.atlas.data),s.atlas.width,s.atlas.height,guard)};assert.equal(sha(s.atlas.data),atlasHash);
 const facings=[];
 try{for(const side of ['left','right']){
  const result={side,samples:0,refusal:null,maximumPublishedContactDriftPx:0,actualRuntimeParity:[]};
  for(const elapsedMs of [...Array.from({length:61},(_,i)=>s.timeline.durationMs*i/60),s.timeline.durationMs-.001,s.timeline.durationMs+.001,heldMs]){
   try{const frame=s.publish(side,elapsedMs);result.maximumPublishedContactDriftPx=Math.max(result.maximumPublishedContactDriftPx,...frame.publishedContacts.map(c=>c.driftPx));result.samples++;}catch(error){result.refusal={elapsedMs,message:String(error.stack??error).replaceAll(/\/Users\/[^/\s"\\]+/g,'~')};break;}
  }
  for(const elapsedMs of [0,s.timeline.durationMs/2,heldMs]){
   try{const frame=s.publish(side,elapsedMs);rig.applyPose(frame.resolved);let coordinates=0;for(const part of rig.parts){const actual=part.display.children[0].geometry.getBuffer('aPosition').data,expected=frame.positions[part.id];assert.equal(actual.length,expected.length);assert(Buffer.from(actual.buffer,actual.byteOffset,actual.byteLength).equals(Buffer.from(expected.buffer,expected.byteOffset,expected.byteLength)),'actual publication differs '+part.id);coordinates+=actual.length;}result.actualRuntimeParity.push({elapsedMs,coordinates,byteParity:true});
    const pose=elapsedMs===0?'initial-idle':elapsedMs===heldMs?'held-faint':'mid-faint';fs.writeFileSync(dir+'/'+mode+'-'+pose+'-'+side+'.png',PNG.sync.write(rasterPaint(s.record,s.binding,guarded,frame.positions,side==='left'?1:-1)),{flag:'wx'});
   }catch(error){result.reviewRefusal={elapsedMs,message:String(error.stack??error).replaceAll(/\/Users\/[^/\s"\\]+/g,'~')};break;}
  }facings.push(result);
 }}finally{rig.dispose();}
 variants.push({mode,fit,durationMs:s.timeline.durationMs,facings,qualityAccepted:false});
}
for(const [p,h]of pins)assert.equal(sha(read(p)),h,'source drift '+p);
const output={schema:'cf.c183-bird-publication/v1',id,variants,sourcePins:[...pins].map(([path,sha256])=>({path,sha256})),sourceUnchanged:true,scope:'Current runtime-equivalent contact/skin/ARAP/rigid-parent publication checked against loaded CreatureRigV1; exact C211 native stage/timing context reused. This is a software diagnostic, not a new native film.',coordinates:'Source-coordinate software raster at1254square; not native screen pixels.',nativeRuns:0,qualityAccepted:false};fs.writeFileSync(dir+'/comparison.json',JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({id,variants:variants.map(v=>({mode:v.mode,facings:v.facings.map(f=>({side:f.side,samples:f.samples,refusal:f.refusal,reviewRefusal:f.reviewRefusal??null}))}))}));
