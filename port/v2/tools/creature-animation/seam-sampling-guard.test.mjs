import test from 'node:test';import assert from 'node:assert/strict';
import {createOpaqueSeamSamplingGuard,applyOpaqueSeamSamplingGuard} from './seam-sampling-guard.mjs';
function fixture(joints=['spine','hindNearKnee']){
 const width=joints.length*4,height=8,aw=joints.length*(width+4),ah=12,rgba=new Uint8Array(aw*ah*4),parts=[],skinParts=[],vertices=[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}];
 for(const[i,joint]of joints.entries()){
  const id='part'+i,frame={x:i*(width+4)+2,y:2,width,height},cutout={x:0,y:0,width,height};parts.push({id,joint,kind:'part',frame,cutout});
  skinParts.push({id,vertices:[0,1,2,3].map(index=>({triangle:[index,index,index],barycentric:[1,0,0]})),indices:[0,1,2,0,2,3]});
  for(let y=1;y<height-1;y++)for(let x=Math.max(1,i*4);x<Math.min(width-1,(i+1)*4);x++)rgba.set([80+x*3,100+y*4,180-i*40,255],((frame.y+y)*aw+frame.x+x)*4);
 }
 return {record:{recipeHash:'record',geometry:{width,height}},binding:{recordRecipeHash:'record',bindingHash:'binding',atlasSha256:'atlas',atlasSize:{width:aw,height:ah},parts,paintSkin:{vertices,parts:skinParts}},atlas:{rgba,width:aw,height:ah}};
}
const texel=(f,data,id,x,y)=>{const p=f.binding.parts[id],i=((p.frame.y+y)*f.atlas.width+p.frame.x+x)*4;return Array.from(data.subarray(i,i+4));};
const mix=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
const over=(a,b)=>a.map((v,i)=>i===3?v+b[i]*(1-v/255):v+b[i]*(1-a[3]/255));
const premultiply=p=>p.map((v,i)=>i===3?v:v*p[3]/255);
test('reconstructs full filtered opaque coverage and colour; old independent alpha-over is the failing control',()=>{
 const f=fixture(),before=f.atlas.rgba.slice(),plan=createOpaqueSeamSamplingGuard(f),after=applyOpaqueSeamSamplingGuard(before,f.atlas.width,f.atlas.height,plan);
 assert(plan.pixels.length>0);assert.deepEqual(f.atlas.rgba,before);
 const sample=data=>[0,1].map(id=>mix(premultiply(texel(f,data,id,3,3)),premultiply(texel(f,data,id,4,3)),.5));
 const [oldA,oldB]=sample(before),old=over(oldA,oldB);assert.equal(old[3],191.25);
 const [newA,newB]=sample(after),actual=over(newA,newB),expected=mix(texel(f,before,0,3,3),texel(f,before,1,4,3),.5);
 assert.deepEqual(actual,expected);assert.equal(actual[3],255);
 // Integer source centres retain their original composite, including guarded
 // duplicates (same opaque original colour); no original owned texel changes.
 for(let y=0;y<f.record.geometry.height;y++)for(let x=0;x<f.record.geometry.width;x++){
  const composite=data=>over(premultiply(texel(f,data,1,x,y)),premultiply(texel(f,data,0,x,y)));
  assert.deepEqual(composite(after),composite(before));
  for(let id=0;id<2;id++)if(texel(f,before,id,x,y)[3])assert.deepEqual(texel(f,after,id,x,y),texel(f,before,id,x,y));
 }
});
test('does not guard outer silhouettes, nonopaque paint, independent limbs or distal body overlaps',()=>{
 const f=fixture(['spine','hindNearKnee','foreNearKnee']),part=f.binding.parts[1],q=((part.frame.y+3)*f.atlas.width+part.frame.x+4)*4;f.atlas.rgba[q+3]=128;
 const before=f.atlas.rgba.slice(),plan=createOpaqueSeamSamplingGuard(f),after=applyOpaqueSeamSamplingGuard(before,f.atlas.width,f.atlas.height,plan);
 for(const p of plan.pixels){assert(p.source[0]>0&&p.source[0]<f.record.geometry.width-1&&p.source[1]>0&&p.source[1]<7);assert(p.source[0]<8);assert.notEqual(p.partId,'part2');assert.notDeepEqual(p.source,[4,3]);}
 assert.deepEqual(texel(f,after,1,4,3),texel(f,before,1,4,3));
 const distal=fixture(['spine','hindNearKnee','hindNearPaw','foreNearPaw']),d=createOpaqueSeamSamplingGuard(distal);assert(d.pixels.every(p=>p.partId!=='part3'));
});
test('refuses apparently aligned boundaries carried by different skin fields and foreign-frame padding',()=>{
 const f=fixture(),start=f.binding.paintSkin.vertices.length;f.binding.paintSkin.vertices.push(...f.binding.paintSkin.vertices.map(p=>({...p})));
 f.binding.paintSkin.parts[1].vertices.forEach(v=>v.triangle=v.triangle.map(i=>i+start));assert.throws(()=>createOpaqueSeamSamplingGuard(f),/unshared skin field/);
 const overlapping=fixture();overlapping.binding.parts[1].frame.x=overlapping.binding.parts[0].frame.x;assert.throws(()=>createOpaqueSeamSamplingGuard(overlapping),/overlapping base ink|overlapping atlas frames/);
});

test('fish decoder guard retains source pixels and refuses the old quadruped inventory',()=>{
 const f=fixture(['spine2','dorsal']);f.record.template={id:'fish',version:1};f.binding.sourceJoinTopology={remainderPartId:'part0'};
 const original=f.atlas.rgba.slice(),plan=createOpaqueSeamSamplingGuard(f);assert(plan.pixels.length>0);assert.deepEqual(f.atlas.rgba,original);
 assert(plan.pixels.every(p=>p.rgba[3]===255));const old=structuredClone(f);delete old.record.template;assert.throws(()=>createOpaqueSeamSamplingGuard(old),/unique known source owners/);
});
