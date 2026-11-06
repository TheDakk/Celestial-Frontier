import test from 'node:test';import assert from 'node:assert/strict';
// Preserve the exact historical claim independently of the later guarded
// arithmetic change: these are the two committed audit kernels at that step.
import * as rowCompiled from '../../../../audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-03/arap-before.mjs';
import * as reference from '../../../../audits/C2_CONTINUOUS_SKIN_20260916/cpu-kernel-02/arap-before.mjs';
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength);
test('historical compiled solve rows retain exact arithmetic for short, four, eight and wide neighbor rows',()=>{
 for(const spokes of[3,4,8,11]){const vertices=[{x:80,y:80}],triangles=[];for(let i=0;i<spokes;i++){const a=i*2*Math.PI/spokes;vertices.push({x:80+60*Math.cos(a),y:80+60*Math.sin(a)});triangles.push(0,i+1,(i+1)%spokes+1);}
  for(const Type of[Float32Array,Float64Array])for(const pins of[[],[0,2],Array.from({length:spokes+1},(_,i)=>i)]){const options={pins},a=reference.createArapScratch(vertices,triangles,160,160,options),b=rowCompiled.createArapScratch(vertices,triangles,160,160,options),old=new Type(vertices.length*2),now=old.slice();
   for(const phase of[.2,-.31,.77,.2]){const target=Type.from(vertices.flatMap((p,i)=>[(p.x+4*Math.sin(phase+i*.7))/160,(p.y+3*Math.cos(phase-i*.6))/160])),saved=target.slice(),sa=reference.solveArapSkin(a,target,old),sb=rowCompiled.solveArapSkin(b,target,now);assert.ok(bytes(old).equals(bytes(now)),`spokes=${spokes} ${Type.name} pins=${pins.length}`);assert.deepEqual(sb,sa);assert.deepEqual(target,saved);}
   const altered=old.slice();new Uint8Array(altered.buffer)[0]^=1;assert.equal(bytes(old).equals(bytes(altered)),false,'one-bit output mutation must fail parity');
  }
 }
});
