import {createHash} from 'node:crypto';import {it,expect} from 'vitest';
import {observePainterTopology,emitPainterTopology,isObservingPainterTopology} from '../src/painter-topology.js';
import {proceduralRadialFauna} from '../src/proceduralfamilies.js';import {myriapod} from '../src/invertoverrides.js';import {faunaCephalopod,faunaBird} from '../src/faunaoverrides.js';
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
