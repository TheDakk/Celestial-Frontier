import fs from 'node:fs'; import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createArapScratch,solveArapSkin} from '../../port/v2/tools/creature-animation/arap-skin.mjs';
import {ARAP_SWEEP_BYTES as before} from '../../port/v2/tools/creature-animation/arap-sweep-bytes.mjs';
import {ARAP_SWEEP_BYTES as after} from './arap-sweep-bytes.mjs';
const native=globalThis.WebAssembly,bytes=x=>Buffer.from(x.buffer,x.byteOffset,x.byteLength),sha=x=>createHash('sha256').update(x).digest('hex');
function runtime(binary){function Module(b){return new native.Module(Buffer.from(b).equals(Buffer.from(before))?binary:b);}Module.imports=native.Module.imports;Module.exports=native.Module.exports;return {Module,Instance:native.Instance,Memory:native.Memory};}
function scratch(skin,w,h,binary){try{globalThis.WebAssembly=runtime(binary);return createArapScratch(skin.vertices,skin.triangles,w,h,skin.solver);}finally{globalThis.WebAssembly=native;}}
const rows=[],controls=[];let calls=0;
for(const [name,fit] of [['centipede','audits/ARCHETYPE_FINISH_20260923/12-myriapod/fit-11'],['cattle','audits/ART_BATTLE_FOCUS_20260925/quadruped-repair-04/cattle-fit-02']]){
 const binding=JSON.parse(fs.readFileSync(fit+'/binding.json')),skin=binding.paintSkin;
 const a=scratch(skin,1254,1254,before),b=scratch(skin,1254,1254,after);assert.equal(a.sweepBackend,'wasm');assert.equal(b.sweepBackend,'wasm');
 for(const Type of [Float32Array,Float64Array])for(const phase of [0,.05,-.2,.55,.05]){
  const target=Type.from(skin.vertices.flatMap((p,i)=>[(p.x+3*Math.sin(phase+i*.07))/1254,(p.y+4*Math.cos(phase-i*.13))/1254])),saved=target.slice(),pa=target.slice(),pb=target.slice();
  const ra=solveArapSkin(a,target,pa),rb=solveArapSkin(b,target,pb);assert.deepEqual(ra,rb);assert.ok(bytes(pa).equals(bytes(pb)),'position bytes');assert.ok(bytes(target).equals(bytes(saved)),'caller mutation');
  for(const k of ['position','rotation','rhs','target'])assert.ok(bytes(a[k]).equals(bytes(b[k])),k);
  calls++;rows.push({name,type:Type.name,phase,outputSha256:sha(bytes(pa)),normalPasses:b.normalPasses,robustFallbacks:b.robustFallbacks,memoryBefore:a.position.buffer.byteLength,memoryAfter:b.position.buffer.byteLength});
 }
}
const neg=new Float64Array([-0,1]),pos=neg.slice();pos[0]=0;assert.ok(!bytes(neg).equals(bytes(pos)));controls.push('signed-zero difference refused');
const bit=neg.slice();new Uint8Array(bit.buffer)[9]^=1;assert.ok(!bytes(neg).equals(bytes(bit)));controls.push('one-bit difference refused');
const report={schema:'cf.c132-arap-parity/v1',status:'PASS_EXACT',scope:'Actual Centipede/Cattle topology with deterministic target probes; not actual battle timing or 60fps evidence.',calls,controls,oldModuleSha256:sha(before),candidateModuleSha256:sha(after),rows};
fs.writeFileSync(new URL('./parity.json',import.meta.url),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,calls}));
