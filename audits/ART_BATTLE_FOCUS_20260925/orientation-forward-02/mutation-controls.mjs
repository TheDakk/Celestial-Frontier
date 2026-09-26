import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {buildOrientationForward} from '../../../port/v2/tools/creature-animation/build-orientation-forward.mjs';
import {createWasmOrientationForward} from '../../../port/v2/tools/creature-animation/wasm-orientation-forward.mjs';
const p=import.meta.dirname,source=fs.readFileSync(path.join(p,'../../../port/v2/tools/creature-animation/orientation-forward.c'),'utf8'),native=WebAssembly,rows=[];
for(const [name,from,to] of [['missing-invalidation','dirty[incident[i]] = 1','dirty[incident[i]] = 0'],['missing-reset','for (unsigned t = 0; t < count; ++t) dirty[t] = 1;','/* mutated missing per-seek reset */']]){
 assert.equal(source.split(from).length,2);const dir=path.join(p,'mutant-'+name);fs.mkdirSync(dir);fs.writeFileSync(dir+'/orientation-forward.c',source.replace(from,to));const receipt=buildOrientationForward({directory:dir});const bytes=fs.readFileSync(dir+'/orientation-forward.wasm');
 function Module(){return new native.Module(bytes);}Module.imports=native.Module.imports;Module.exports=native.Module.exports;
 const c={position:Float64Array.from([0,0,2,0,0,2,-3,-3,3,1,-1,3]),triangleDofs:Uint32Array.from([0,2,4,0,4,6,0,6,8,0,8,10,0,10,2]),triangleSigns:Int8Array.from([1,-1,1,-1,1]),triangleFloors:Float64Array.from([.2,.3,.4,.5,.6]),triangleMovable:Uint8Array.from([7,6,5,3,7])};
 assert(createWasmOrientationForward(c),'good leaf must admit actual fixture');const saved=c.position.slice();assert.equal(createWasmOrientationForward(c,{Module,Memory:native.Memory,Instance:native.Instance}),null,name+' must refuse before caller mutation');assert.deepEqual(c.position,saved);rows.push({name,status:'REJECTED_BEFORE_CALLER_MUTATION',sourceSha256:receipt.sourceSha256,moduleSha256:receipt.moduleSha256});
}
fs.writeFileSync(p+'/mutation-controls.json',JSON.stringify({rows},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows));
