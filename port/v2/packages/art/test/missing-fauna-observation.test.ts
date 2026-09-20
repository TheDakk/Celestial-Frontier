import {expect,it} from 'vitest';import {createHash} from 'node:crypto';
import {observePainterTopology,structuralBodyCount} from '../src/painter-topology.js';import type {ArtContext2D} from '../src/speciescanvas.js';
import {tardigrade} from '../src/fungioverrides2.js';import {isopodBody} from '../src/invertoverrides.js';
import {faunaFiddler} from '../src/faunaoverrides.js';
import {faunaPyrosome,faunaSalp} from '../src/faunaoverrides4.js';import {faunaHorseshoeCrab,faunaSeaSquirt} from '../src/faunaoverrides5.js';
const p={base:'#aa8877',cr:170,cg:136,cb:119,lit:'#ddbb99',dark:'#554433'};
function draw(paint:(c:ArtContext2D)=>void,observe=true){
 const hash=createHash('sha256'),fields:Record<PropertyKey,unknown>={globalAlpha:1},commands:unknown[]=[];
 const record=(v:unknown)=>{commands.push(v);hash.update(JSON.stringify(v)+'\n');};
 const c=new Proxy(fields,{get(t,k){if(Reflect.has(t,k))return Reflect.get(t,k);return(...args:unknown[])=>{record([k,...args]);if(k==='createLinearGradient'||k==='createRadialGradient')return{addColorStop:(...v:unknown[])=>record(v)};if(k==='getLineDash')return[];if(k==='getTransform')return{a:1,b:0,c:0,d:1,e:0,f:0};};},set(t,k,v){record([k,v]);return Reflect.set(t,k,v);}}) as unknown as ArtContext2D;
 const topology=observe?observePainterTopology(c,()=>paint(c)):(paint(c),null);return {topology,commands,digest:hash.digest('hex')};
}
it('source-owned tardigrade limbs remain eight while seeded surface fold counts vary',()=>{
 const folds=new Set<number>();for(let seed=0;seed<18;seed++){
  const paint=(c:ArtContext2D)=>tardigrade(c,{seed,legs:99,segments:50},p),a=draw(paint),t=a.topology!;
  expect(a.digest).toBe(draw(paint,false).digest);const legs=t.features.filter(f=>f.kind==='leg');expect(legs).toHaveLength(8);
  expect(t.features.filter(f=>f.id.includes('Claw'))).toHaveLength(24);folds.add(t.features.filter(f=>f.id.startsWith('fold')).length);
  for(const leg of legs){expect(a.commands).toContainEqual(['moveTo',...leg.points[0]!]);expect(a.commands).toContainEqual(['quadraticCurveTo',...leg.points[1]!,...leg.points[2]!]);}
  const bad=[...legs[0]!.points[2]!] as [number,number];bad[0]+=20;expect(a.commands).not.toContainEqual(['quadraticCurveTo',...legs[0]!.points[1]!,...bad]);
 }expect([...folds].sort()).toEqual([3,4,5]);
});
it.each(['Isopod','Giant Isopod'])('%s retains seven actual leg pairs and source-specific uropods',name=>{
 const paint=(c:ArtContext2D)=>isopodBody(c,{seed:78,legs:0},p,{giant:name==='Giant Isopod'},name),a=draw(paint),f=a.topology!.features;
 expect(a.digest).toBe(draw(paint,false).digest);expect(f.filter(v=>v.kind==='leg')).toHaveLength(14);expect(f.filter(v=>v.id.startsWith('tergite'))).toHaveLength(7);expect(f.filter(v=>v.kind==='antenna')).toHaveLength(2);expect(f.filter(v=>v.id.startsWith('uropod'))).toHaveLength(name==='Isopod'?2:0);
 for(const leg of f.filter(v=>v.kind==='leg'))expect(a.commands).toContainEqual(['quadraticCurveTo',...leg.points[1]!,...leg.points[2]!]);
 expect(f.filter(v=>v.kind==='leg').slice(0,10)).not.toHaveLength(14);
});
it('colonial and attached tunicates retain distinct source body counts without fabricated joints',()=>{
 const g={seed:16};for(const painter of [faunaPyrosome,faunaSalp,faunaSeaSquirt]){const paint=(c:ArtContext2D)=>painter(c,g,p);expect(draw(paint).digest).toBe(draw(paint,false).digest);}
 const pyro=draw(c=>faunaPyrosome(c,g,p)).topology!.features;expect(pyro.filter(f=>f.id.startsWith('zooid'))).toHaveLength(190);expect(pyro.filter(f=>f.kind==='mark')).toHaveLength(190);expect(structuralBodyCount(pyro)).toBe(1);expect(structuralBodyCount(pyro.map(f=>f.kind==='mark'?{...f,kind:'body'}:f))).not.toBe(1);expect(pyro.filter(f=>f.id==='aperture')).toHaveLength(1);expect(pyro.some(f=>f.id.startsWith('segment'))).toBe(false);
 const salp=draw(c=>faunaSalp(c,g,p)).topology!.features;expect(salp.filter(f=>/^barrel\d$/.test(f.id))).toHaveLength(4);expect(salp.filter(f=>f.id.includes('Aperture'))).toHaveLength(8);
 const squirt=draw(c=>faunaSeaSquirt(c,g,p)).topology!.features;expect(squirt.filter(f=>f.id.includes('Siphon'))).toHaveLength(4);expect(squirt.filter(f=>f.id.endsWith('Left'))).toHaveLength(2);expect(squirt.some(f=>f.id.includes('rock'))).toBe(false);
});
it('top-view Horseshoe Crab has rigid shell outlines and twelve spines, never invented visible walking legs',()=>{
 const paint=(c:ArtContext2D)=>faunaHorseshoeCrab(c,{seed:81,legs:20},p),a=draw(paint),f=a.topology!.features;
 expect(a.digest).toBe(draw(paint,false).digest);expect(f.filter(v=>v.kind==='leg')).toHaveLength(0);expect(f.filter(v=>v.id.startsWith('spine'))).toHaveLength(12);expect(f.find(v=>v.id==='telson')!.points).toHaveLength(4);
 for(const outline of f.filter(v=>v.id.startsWith('prosoma')))expect(a.commands).toContainEqual(['bezierCurveTo',...outline.points[1]!,...outline.points[2]!,...outline.points[3]!]);
});

it('Fiddler observes six actual curved legs and asymmetric source claws without fabricated elbows',()=>{const paint=(c:ArtContext2D)=>faunaFiddler(c,{seed:42},p),a=draw(paint),f=a.topology!.features;expect(a.digest).toBe(draw(paint,false).digest);const legs=f.filter(v=>v.kind==='leg');expect(legs).toHaveLength(6);expect(legs).not.toHaveLength(8);for(const leg of legs)expect(a.commands).toContainEqual(['quadraticCurveTo',...leg.points[1]!,...leg.points[2]!]);expect(f.some(v=>/elbow/i.test(v.id))).toBe(false);expect(f.find(v=>v.id==='palmFar')!.widths![0]).toBeGreaterThan(f.find(v=>v.id==='palmNear')!.widths![0]!);});
