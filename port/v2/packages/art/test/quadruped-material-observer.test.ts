import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {expect, it, vi} from 'vitest';
import {planFor} from '../src/proceduraloverrides.js';
import {faunaQuadruped, QUAD_SPEC, type Pal, type QuadSpec} from '../src/quadrupedoverrides.js';
import * as alien from '../src/alientraits.js';
import type {ArtContext2D} from '../src/speciescanvas.js';
import type {QuadrupedDrawnGeometry} from '../src/quadruped-anatomy.js';

const genome=JSON.parse(readFileSync(new URL('../../../../../audits/CIVET_2D_PROOF_20260912/procedural-genome.json',import.meta.url),'utf8')) as Record<string,unknown>;
const palette:Pal={base:'#aa8877',cr:170,cg:136,cb:119,lit:'#ddbb99',dark:'#554433'};
function draw(g:Record<string,unknown>,spec:QuadSpec,name:string,observe=true){
 const hash=createHash('sha256'),fields:Record<PropertyKey,unknown>={globalAlpha:1};
 const record=(value:unknown)=>hash.update(JSON.stringify(value)+'\n');
 const context=new Proxy(fields,{
  get(target,key){
   if(Reflect.has(target,key))return Reflect.get(target,key);
   return (...args:unknown[])=>{
    record([key,...args]);
    if(key==='createLinearGradient'||key==='createRadialGradient')return {addColorStop:(...stops:unknown[])=>record(stops)};
    if(key==='getLineDash')return [];
    if(key==='getTransform')return {a:1,b:0,c:0,d:1,e:0,f:0};
    return undefined;
   };
  },
  set(target,key,value){record([key,value]);return Reflect.set(target,key,value);},
 }) as unknown as ArtContext2D;
 let observed:QuadrupedDrawnGeometry|undefined;
 faunaQuadruped(context,g,palette,spec,name,observe?value=>{observed=value;}:undefined);
 return {observed,drawDigest:hash.digest('hex')};
}
it('emits the routed surface actually passed to the alien skin painter, without changing draw commands',()=>{
 const paint=vi.spyOn(alien,'alienSkin');
 try{
  for(const [skin,expected] of [[2,'chitinous'],[4,'plated'],[5,'warty'],[7,'translucent'],[8,'crystalline']] as const){
   const g={...genome,skin},plan=planFor(g);expect(plan?.kind).toBe('quad');
   if(plan?.kind!=='quad')throw Error('fixture did not route to quadruped');
   paint.mockClear();const result=draw(g,plan.spec,'proc:material-control');
   expect(paint.mock.calls.map(call=>call[1])).toContain(expected);
   expect(result.observed?.materials.surface).toBe(expected);
   // The original default-fur record must fail the same consumer expectation.
   expect(()=>expect({...result.observed?.materials,surface:'fur'}.surface).toBe(expected)).toThrow();
   expect(result.drawDigest).toBe(draw(g,plan.spec,'proc:material-control',false).drawDigest);
  }
 }finally{paint.mockRestore();}
});
it('retains the actual coat fallback and does not let a raw gene override named anatomy',()=>{
 const named=QUAD_SPEC.Deer!;
 const a=draw({...genome,skin:7},named,'Deer'),b=draw({...genome,skin:2},named,'Deer');
 expect(a.observed?.materials.surface).toBe('fur');
 expect(a.observed?.materials.paletteSource).toBe('named');
 expect(a.drawDigest).toBe(b.drawDigest);
 const g={...genome,skin:1},plan=planFor(g);if(plan?.kind!=='quad')throw Error('fixture route');
 expect(draw(g,plan.spec,'proc:fur-control').observed?.materials.surface).toBe('fur');
});
