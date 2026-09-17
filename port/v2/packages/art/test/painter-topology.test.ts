import {compileBodyCard,type ResolvedAnatomyRecord} from '../../../apps/game/src/motion/body-card.js';
import {buildTimeline,sampleTimeline} from '../../../apps/game/src/motion/timeline.js';
import {actionsFor} from '../../../apps/game/src/motion/family-actions.js';
import {compileCrabObservationRecord} from '../../../tools/creature-animation/crab-observation-record.mjs';
import {createHash} from 'node:crypto';import {it,expect} from 'vitest';
import {observePainterTopology,emitPainterTopology,isObservingPainterTopology} from '../src/painter-topology.js';
import {proceduralRadialFauna} from '../src/proceduralfamilies.js';import {myriapod,crabBody} from '../src/invertoverrides.js';import {faunaCephalopod,faunaBird} from '../src/faunaoverrides.js';
import type {ArtContext2D} from '../src/speciescanvas.js';
const g={seed:1597751321,kingdom:'fauna',skin:7},pal={base:'#aa8877',cr:170,cg:136,cb:119,lit:'#ddbb99',dark:'#554433'};
function draw(paint:(c:ArtContext2D)=>void,observe:boolean){
 const hash=createHash('sha256'),fields:Record<PropertyKey,unknown>={globalAlpha:1};const commands:unknown[]=[];const record=(v:unknown)=>{commands.push(v);hash.update(JSON.stringify(v)+'\n');};
 const context=new Proxy(fields,{get(target,key){if(Reflect.has(target,key))return Reflect.get(target,key);return (...args:unknown[])=>{record([key,...args]);if(key==='createLinearGradient'||key==='createRadialGradient')return {addColorStop:(...args:unknown[])=>record(args)};if(key==='getLineDash')return [];if(key==='getTransform')return {a:1,b:0,c:0,d:1,e:0,f:0};};},set(target,key,value){record([key,value]);return Reflect.set(target,key,value);}}) as unknown as ArtContext2D;
 const result=observe?observePainterTopology(context,()=>paint(context)):(paint(context),null);
 return {result,digest:hash.digest('hex'),context,commands};
}
it('observes ten real radial arms without changing paint or substituting the six-arm motion fixture',()=>{
 const paint=(c:ArtContext2D)=>proceduralRadialFauna(c,g,pal),a=draw(paint,true);
 expect(a.digest).toBe(draw(paint,false).digest);expect(a.result?.features.filter(f=>f.kind==='arm')).toHaveLength(10);
 expect(a.result?.features.filter(f=>f.kind==='arm').slice(0,6)).not.toHaveLength(10);
 expect(a.result?.materials.surface).toBe('smooth skin');
 expect(a.result?.anatomy).toEqual({schema:'cf.anatomy-presence/v2',absent:[],appendages:{arms:10}});
 expect(draw(paint,true).result).toEqual(a.result);expect(a.result?.unresolved.length).toBeGreaterThan(0);
});
it('preserves actual myriapod segments and all paired legs instead of compressing to eight chains',()=>{
 for(const flat of [false,true]){
  const paint=(c:ArtContext2D)=>myriapod(c,g,pal,{flat},'proc:myriapod'),a=draw(paint,true),f=a.result!.features;
  expect(a.digest).toBe(draw(paint,false).digest);const segments=f.filter(f=>f.kind==='body').length,legs=f.filter(f=>f.kind==='leg');
  expect(segments).toBeGreaterThan(8);expect(legs).toHaveLength(segments*2);expect(new Set(legs.map(f=>f.id)).size).toBe(legs.length);
  expect(legs.slice(0,8)).not.toHaveLength(segments*2);expect(a.result?.materials.surface).toBe('chitinous');
  for(const leg of legs){expect(a.commands).toContainEqual(['moveTo',...leg.points[0]!]);expect(a.commands).toContainEqual(['quadraticCurveTo',...leg.points[1]!,...leg.points[2]!]);}
  const bad={...legs[0]!,points:legs[0]!.points.map(p=>[...p])};bad.points[2]![0]!+=10;expect(a.commands).not.toContainEqual(['quadraticCurveTo',...bad.points[1]!,...bad.points[2]!]);
 }
});
it('records eight actual curled arms and the squids two additional feeding tentacles, with exact paint parity',()=>{
 for(const squid of [false,true]){const paint=(c:ArtContext2D)=>faunaCephalopod(c,g,pal,{squid}),a=draw(paint,true);
  expect(a.digest).toBe(draw(paint,false).digest);expect(a.result!.features.filter(f=>f.kind==='arm')).toHaveLength(8);
  expect(a.result!.materials.surface).toBe('smooth skin');
  expect(a.result!.anatomy).toEqual({schema:'cf.anatomy-presence/v2',absent:[],appendages:{arms:8,feedingTentacles:squid?2:0}});
  expect(a.result!.features.filter(f=>f.kind==='tentacle')).toHaveLength(squid?2:0);for(const arm of a.result!.features.filter(f=>f.kind==='arm')){expect(arm.points).toHaveLength(17);for(const point of arm.points.slice(1))expect(a.commands).toContainEqual(['lineTo',...point]);}
  for(const tentacle of a.result!.features.filter(f=>f.kind==='tentacle'))expect(a.commands).toContainEqual(['bezierCurveTo',...tentacle.points[1]!,...tentacle.points[2]!,...tentacle.points[3]!]);
 }
});
it('observes actual bird visibility: perched, hovering, soaring, swimming and clinging; absent limbs stay absent',()=>{
 for(const opts of [{},{hover:true},{wings:'soaring' as const},{swim:true},{cling:true}]){
  const paint=(c:ArtContext2D)=>faunaBird(c,g,pal,{legs:.12,bill:'short',...opts},'observer-bird'),a=draw(paint,true),features=a.result!.features;
  expect(a.digest).toBe(draw(paint,false).digest);expect(features.filter(f=>f.kind==='leg')).toHaveLength('hover' in opts||'swim' in opts||'wings' in opts?0:2);
  expect(features.filter(f=>f.kind==='wing')).toHaveLength('hover' in opts||'wings' in opts?2:1);expect(a.result!.materials.surface).toBe('feather');
 }
});
it('a counted publisher cannot drop an observed arm or tentacle and still claim compatibility',()=>{
 const a=draw(c=>faunaCephalopod(c,g,pal,{squid:true}),true),value=a.result!;
 for(const kind of ['arm','tentacle']){
  const broken=structuredClone(value),index=broken.features.findIndex(f=>f.kind===kind);
  const features=broken.features.filter((_,i)=>i!==index);
  expect(()=>observePainterTopology(a.context,()=>emitPainterTopology(a.context,{...broken,features}))).toThrow('count/feature');
 }
 expect(()=>observePainterTopology(a.context,()=>emitPainterTopology(a.context,value))).not.toThrow();
});
it('unsupported or failed owners cannot leak a previous observation; nested owners refuse',()=>{
 const c=draw(()=>{},false).context;
 expect(observePainterTopology(c,()=>{})).toBeNull();expect(()=>observePainterTopology(c,()=>{throw Error('paint failed');})).toThrow('paint failed');expect(isObservingPainterTopology(c)).toBe(false);
 expect(()=>observePainterTopology(c,()=>observePainterTopology(c,()=>{}))).toThrow('nested');expect(isObservingPainterTopology(c)).toBe(false);
 const value={schema:'cf.painter-topology/v1' as const,ownerId:'control',family:'test',coordinateSize:440,materials:{surface:'test',paletteSource:'test'},features:[],unresolved:[]};
 expect(()=>observePainterTopology(c,()=>{emitPainterTopology(c,value);emitPainterTopology(c,value);})).toThrow('more than one winning owner');
 expect(observePainterTopology(c,()=>{})).toBeNull();
});

it('crab observation preserves eight drawn walking legs, separate chela fingers and terrestrial proportions with exact paint parity',()=>{
 for(const opts of [{wide:true},{wide:true,big:true,terrestrial:true,crusher:true}]){
  const paint=(c:ArtContext2D)=>crabBody(c,g,pal,opts,'crab-observer-control'),a=draw(paint,true),f=a.result!.features;
  expect(a.digest).toBe(draw(paint,false).digest);expect(draw(paint,true).result).toEqual(a.result);
  expect(f.filter(v=>v.kind==='leg')).toHaveLength(8);expect(f.filter(v=>v.id.startsWith('chela'))).toHaveLength(2);expect(f.filter(v=>v.id.startsWith('fixedFinger'))).toHaveLength(2);expect(f.filter(v=>v.id.startsWith('dactyl'))).toHaveLength(2);
  for(const leg of f.filter(v=>v.kind==='leg')){expect(a.commands).toContainEqual(['moveTo',...leg.points[0]!]);expect(a.commands).toContainEqual(['lineTo',...leg.points[1]!]);expect(a.commands).toContainEqual(['lineTo',...leg.points[2]!]);expect(leg.curve).toBe('polyline');}
  const control=f.filter(v=>v.kind==='leg').slice(0,6);expect(control).not.toHaveLength(8);
  expect(f.some(v=>/abdomen|tailFan|antenna/.test(v.id))).toBe(false);expect(a.result!.unresolved).not.toHaveLength(0);expect(a.result!.materials.surface).toBe('chitinous');
 }
});

it('the compact crab record uses every observed joint and refuses lobster, missing leg, extra feature and wrong owner controls',async()=>{
 const input={identity:{speciesVisualKey:'observed-crab-control',seed:51,ownerId:'crabBody',earthName:'Crab'},cutoutAssetHash:'a'.repeat(64),width:440,height:440};
 const topology=draw(c=>crabBody(c,g,pal,{wide:true},'Crab'),true).result!;
 const record=await compileCrabObservationRecord(topology,input);expect(record.template.id).toBe('brachyuran');expect(Object.keys(record.landmarks)).toHaveLength(44);
 expect(Object.keys(record.landmarks).some(j=>/abdomen|tailFan|antenna/.test(j))).toBe(false);expect(record.materials.surface).toBe('chitinous');expect(record.coverage.unproven.length).toBeGreaterThan(0);
 expect(await compileCrabObservationRecord(topology,input)).toEqual(record);
 const card=compileBodyCard(record as unknown as ResolvedAnatomyRecord);
 expect(card.parts).toHaveLength(43);expect(card.realm).toBe('amphibious');expect(Object.keys(card.bounds.legSlack)).toHaveLength(8);
 for(const id of Object.keys(actionsFor('brachyuran')!)){const tl=buildTimeline(card,id,51);for(let i=0;i<=120;i++){const pose=sampleTimeline(tl,tl.durationMs*i/120);expect(Object.keys(pose.joints)).toHaveLength(44);expect(Object.values(pose.joints).every(Number.isFinite)).toBe(true);expect(pose.joints.carapace).toBe(0);}}
 const pinch=buildTimeline(card,'melee:pinch',51);expect(pinch.tracks.clawNearDactylRoot!.some(k=>k.value!==0)).toBe(true);expect(pinch.tracks.clawNearFixedRoot!.every(k=>k.value===0)).toBe(true);
 const leg=topology.features.find(f=>f.id==='leg0Near')!;expect(record.landmarks.leg0NearFoot).toEqual(leg.points[2]!.map(v=>v/topology.coordinateSize));
 await expect(compileCrabObservationRecord({...topology,family:'crustacean-clawed'},input)).rejects.toThrow('unsupported source');
 await expect(compileCrabObservationRecord({...topology,features:topology.features.filter(f=>f.id!=='leg0Near')},input)).rejects.toThrow('geometry');
 await expect(compileCrabObservationRecord({...topology,features:[...topology.features,{...leg,id:'leg4Near'}]},input)).rejects.toThrow('unrepresented');
 await expect(compileCrabObservationRecord(topology,{...input,identity:{...input.identity,ownerId:'other'}})).rejects.toThrow('owner mismatch');
});
