import test from 'node:test';
import assert from 'node:assert/strict';
import {createSingleRigidSourceSurface,assessSingleRigidSourceSurface} from './rigid-source-surface.mjs';
function fixture(){
 const parts=[{id:'test',joint:'centre'}],family={id:'echinoderm-test',graph:[['centre','root'],['rim','centre']],anchored:true,rigid:['centre','rim'],limitsDeg:{centre:{min:0,max:0},rim:{min:0,max:0}}};
 const source=[10,10,70,10,70,80,10,80],binding={paintSkin:{vertices:source.filter((_,i)=>i%2===0).map(()=>({weights:[['centre',1]]}))}},record={materials:{surface:'plated'}},meshes=new Map([['test',{positions:source}]]);
 return{family,record,binding,parts,remainder:'test',meshes};
}
const epsilon=8*Math.pow(2,-23)*100;
function projected(proof,fn=(x,y)=>[x,y]){const out=new Float32Array(proof.source.length);for(let i=0;i<out.length;i+=2){const p=fn(proof.source[i]/100,proof.source[i+1]/100,i/2);out[i]=p[0];out[i+1]=p[1];}return out;}
function assess(proof,positions){return assessSingleRigidSourceSurface(proof,positions,epsilon,100,100);}
test('a one-owner test measures every published point through rigid rotation and translation',()=>{
 const proof=createSingleRigidSourceSurface(fixture()),c=Math.cos(.11),s=Math.sin(.11),p=projected(proof,(x,y)=>[c*x-s*y+.03,s*x+c*y-.02]),r=assess(proof,p);
 assert.equal(r.status,'PASS');assert.equal(r.samples,4);assert(r.maxDeviationPx<epsilon);
});
for(const[name,fn]of[
 ['scale',(x,y)=>[x*1.01,y*1.01]],['shear',(x,y)=>[x+.03*y,y]],['reflection',(x,y)=>[1-x,y]],['local deformation',(x,y,i)=>[x+(i===2?.02:0),y]],
])test(name+' fails the same unchanged rigid-surface epsilon',()=>{
 const proof=createSingleRigidSourceSurface(fixture()),r=assess(proof,projected(proof,fn));assert.equal(r.status,'FAIL');assert(r.violations>0);assert(r.maxDeviationPx>epsilon);
});
test('cannot claim the rigid one-owner path for a soft or multi-owner source',()=>{
 for(const mutate of[
  f=>f.record.materials.surface='slick',f=>f.family.id='radial',f=>f.parts.push({id:'arm',joint:'rim'}),f=>f.parts[0].joint='rim',f=>f.binding.paintSkin.vertices[0].weights=[['centre',.5],['rim',.5]],f=>f.family.limitsDeg.centre.max=1,
 ]){const f=fixture();mutate(f);assert.throws(()=>createSingleRigidSourceSurface(f));}
});
test('missing, shortened, collapsed or nonfinite published surfaces refuse',()=>{
 const proof=createSingleRigidSourceSurface(fixture());assert.throws(()=>assess(proof,undefined));assert.throws(()=>assess(proof,new Float32Array(6)));assert.throws(()=>assess(proof,new Float32Array(8)));const p=projected(proof);p[4]=NaN;assert.throws(()=>assess(proof,p));
});

test('an empty, truncated, nonfinite or misindexed authored reference cannot pass vacuously',()=>{
 for(const mutate of[p=>p.source=[],p=>p.source.pop(),p=>p.source[3]=NaN,p=>p.axis=p.vertexCount,p=>p.vertexCount=0]){const proof=createSingleRigidSourceSurface(fixture()),positions=projected(proof);mutate(proof);assert.throws(()=>assess(proof,positions),/complete authored rigid reference/);}
});
