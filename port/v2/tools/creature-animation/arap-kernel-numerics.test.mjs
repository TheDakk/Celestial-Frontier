import test from 'node:test';import assert from 'node:assert/strict';
import * as current from './arap-skin.mjs';
// Frozen pre-reciprocal/norm kernel is retained with the measured failed live
// capture's audit. The independent reference preserves the prior arithmetic.
import * as reference from '../../../../audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-03/arap-before.mjs';
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
const difference=(a,b,w)=>Math.max(...Array.from({length:a.length/2},(_,i)=>Math.hypot((a[i*2]-b[i*2])*w,(a[i*2+1]-b[i*2+1])*w)));
const check=(a,b,w)=>assert.ok(difference(a,b,w)<=.001,'arithmetic difference exceeds .001 native pixel');
test('compiled solve rows and guarded numerics retain machine-scale agreement across valences and pin partitions',()=>{
 for(const spokes of[3,4,8,11]){const vertices=[{x:80,y:80}],triangles=[];for(let i=0;i<spokes;i++){const a=i*2*Math.PI/spokes;vertices.push({x:80+60*Math.cos(a),y:80+60*Math.sin(a)});triangles.push(0,i+1,(i+1)%spokes+1);}
  for(const Type of[Float32Array,Float64Array])for(const pins of[[],[0,2],Array.from({length:spokes+1},(_,i)=>i)]){const options={pins},a=reference.createArapScratch(vertices,triangles,160,160,options),b=current.createArapScratch(vertices,triangles,160,160,options),old=new Type(vertices.length*2),now=old.slice();
   for(const phase of[.2,-.31,.77,.2]){const target=Type.from(vertices.flatMap((p,i)=>[(p.x+4*Math.sin(phase+i*.7))/160,(p.y+3*Math.cos(phase-i*.6))/160])),saved=target.slice(),sa=reference.solveArapSkin(a,target,old),sb=current.solveArapSkin(b,target,now);check(old,now,160);if(Type===Float32Array)assert.ok(bytes(old).equals(bytes(now)),'published Float32 synthetic geometry changed');assert.equal(sb.flippedTriangles,sa.flippedTriangles);assert.ok(Math.abs(sb.minimumAreaRatio-sa.minimumAreaRatio)<1e-10);for(const pin of pins){assert.equal(now[pin*2],target[pin*2]);assert.equal(now[pin*2+1],target[pin*2+1]);}assert.deepEqual(target,saved);}
   const altered=old.slice();new Uint8Array(altered.buffer)[0]^=1;assert.equal(bytes(old).equals(bytes(altered)),false,'one-bit pin mutation must fail exact comparison');altered.set(old);altered[0]+=.01/160;assert.throws(()=>check(old,altered,160));
  }
 }
});

test('norm scaling fallback retains finite large-scale and near-collapsed targets without changing refusal semantics',()=>{
 for(const scale of[1,1e60]){const vertices=[{x:0,y:0},{x:40*scale,y:0},{x:40*scale,y:40*scale},{x:0,y:40*scale}],triangles=[0,1,2,0,2,3],w=40*scale;
  for(const targetScale of[1,1e-120]){const target=Float64Array.from([.03,.01,1.03,.04,1,.94,-.01,1.02],v=>v*targetScale),a=reference.createArapScratch(vertices,triangles,w,w),b=current.createArapScratch(vertices,triangles,w,w),old=target.slice(),now=target.slice();const sa=reference.solveArapSkin(a,target,old),sb=current.solveArapSkin(b,target,now);assert.ok(now.every(Number.isFinite));assert.ok(difference(old,now,1)<1e-12);assert.equal(sb.flippedTriangles,sa.flippedTriangles);}
 }
});
