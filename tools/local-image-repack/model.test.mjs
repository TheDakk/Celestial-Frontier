import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {encodeField,parseFields,concatFields} from './protobuf.mjs';
import {inspectModel,makePlan,deriveGraph,validateDerivedGraph,expandFour,verifyParameterExpansion,sha256} from './model.mjs';
import {validateLocations,CACHE_ROOT,validateRanges,writeParameters,verifyParameters,assertHandleHash,createFreshOutput} from './repack.mjs';
const s=(n,v)=>encodeField(n,2,Buffer.from(v)),u=(n,v)=>encodeField(n,0,v),m=(n,v)=>encodeField(n,2,Buffer.concat(v));
const attribute=(name,value)=>m(5,[s(1,name),u(3,value),u(20,2),s(100,'keep-attribute')]);
function fixture({K=256,N=128,zero=true,dtype=10,offset=0,annotation=false,shared=false,duplicate=false,opset=18}={}){
 const C=K/128;
 const tensor=(name,ds,type,start,length)=>m(5,[...ds.map(x=>u(1,x)),u(2,type),s(8,name),
   ...Object.entries({location:'parent.data',offset:String(start),length:String(length)}).map(([k,v])=>m(13,[s(1,k),s(2,v),s(100,'keep-external')])),u(14,1),s(99,'unknown-tensor')]);
 const B=tensor('B',[N,C,128],2,offset,N*K),S=tensor('S',[N,C],dtype,N*K,2*N*C),Z=tensor('Z',[N,C],2,N*K+2*N*C,N*C);
 const node=m(1,[s(1,'X'),s(1,'B'),s(1,'S'),...(zero?[s(1,'Z')]:[]),s(2,'Y'),s(3,'node'),s(4,'MatMulNBits'),
   attribute('K',K),attribute('N',N),attribute('bits',8),attribute('block_size',128),...(duplicate?[attribute('block_size',128)]:[]),s(7,'com.microsoft'),s(101,'unknown-node')]);
 const scalar=m(5,[u(2,7),s(8,'scalar'),u(7,5)]); // untouched scalar initializer is valid
 return Buffer.concat([u(1,9),m(7,[node,...(shared?[m(1,[s(1,'S'),s(2,'other'),s(3,'reuse'),s(4,'Identity')])]:[]),B,S,...(zero?[Z]:[]),scalar,
   ...(annotation?[m(13,[s(1,'S'),s(100,'annotation')])]:[]),s(101,'unknown-graph')]),m(8,[s(1,''),u(2,opset)]),m(8,[s(1,'com.microsoft'),u(2,1)]),
   Buffer.from([0xa0,0x06,0x81,0x00])]); // unknown field100, noncanonical valid varint
}
const inspect=bytes=>inspectModel(bytes,{expectedSha256:sha256(bytes),nodeCount:1});
function mapField(bytes,n,fn){return concatFields(parseFields(bytes).map(f=>f.number===n?encodeField(n,f.wire,fn(f.payload)):f.raw));}

test('Pinned-parent admission refuses a changed graph before accepting its metadata',()=>{
 const source=fixture();assert.throws(()=>inspectModel(source),/SHA/);
 assert.throws(()=>inspectModel(source,{expectedSha256:sha256(source),nodeCount:103}),/count/);
 const modified=Buffer.from(source);modified[modified.length-1]^=1;
 assert.throws(()=>inspectModel(modified,{expectedSha256:sha256(source),nodeCount:1}),/SHA/);
});
test('Exact rewrite retains B ranges and unknown bytes while changing block/dims/scale/zero ranges',()=>{
 const source=fixture(),parent=inspect(source),plan=makePlan(parent),derived=deriveGraph(parent,plan);
 const result=validateDerivedGraph(parent,derived,plan);
 assert.equal(result.targets[0].B.external.offset,'0');assert.deepEqual(result.targets[0].B.dims,[128,8,32]);
 assert.deepEqual(result.targets[0].S.dims,[128,8]);assert.deepEqual(result.targets[0].Z.dims,[128,8]);
 assert.equal(plan.totalBytes,3072);assert.equal(plan.tensors.length,2);
 for(const marker of ['keep-attribute','keep-external','unknown-tensor','unknown-node','unknown-graph'])assert.ok(derived.includes(Buffer.from(marker)));
 assert.ok(derived.subarray(-4).equals(Buffer.from([0xa0,0x06,0x81,0x00])));
 const mutation=Buffer.from(derived);mutation[mutation.indexOf('unknown-node')]='X'.charCodeAt(0);
 assert.throws(()=>validateDerivedGraph(parent,mutation,plan),/preserved-field/);
});
test('Absence of explicit zero, dtype changes, shared params, annotations and duplicate attrs are refused',()=>{
 for(const opts of [{zero:false},{dtype:1},{annotation:true},{shared:true},{duplicate:true},{opset:19}])assert.throws(()=>inspect(fixture(opts)));
 // Keep tensor dimensions valid while changing K to a non-divisible value.
 const source=fixture(),bad=mapField(source,7,g=>mapField(g,1,node=>mapField(node,5,a=>{
   const fields=parseFields(a);const name=fields.find(f=>f.number===1).payload.toString();
   return name==='K'?concatFields(fields.map(f=>f.number===3?u(3,255):f.raw)):a;
 })));
 assert.throws(()=>inspect(bad),/geometry/);
});
test('Offset and tensor shape mutations fail the same serialized-result validator',()=>{
 const source=fixture(),parent=inspect(source),plan=makePlan(parent),derived=deriveGraph(parent,plan);
 for(const mode of ['offset','shape']){
  const bad=mapField(derived,7,g=>mapField(g,5,t=>{
   const name=parseFields(t).find(f=>f.number===8).payload.toString();if(name!=='S')return t;
   if(mode==='shape'){let first=true;return concatFields(parseFields(t).map(f=>f.number===1&&first?(first=false,u(1,127)):f.raw));}
   return mapField(t,13,e=>{const k=parseFields(e).find(f=>f.number===1).payload.toString();return k==='offset'?concatFields(parseFields(e).map(f=>f.number===2?s(2,'2'):f.raw)):e;});
  }));
  assert.throws(()=>validateDerivedGraph(parent,bad,plan),/range|dtype\/shape/);
 }
 assert.throws(()=>validateRanges(parent,[{path:'parent.data',bytes:100}]),/outside/);
 const wrongPlan=structuredClone(plan);wrongPlan.tensors[0].source.offset++;
 assert.throws(()=>validateDerivedGraph(parent,derived,wrongPlan),/plan source\/range/);
});
test('Quarter mapping preserves represented weights for all256 Q8 values with asymmetric zeros and changing scales',()=>{
 // Independent hand-written binary16 scalars: 1, -0.5, 2 and0.25. Not a
 // reconstruction of expandFour; expected numerical values are independent.
 const scale=Buffer.from('003c00b800400034','hex'),zero=Buffer.from([0,255,37,149]);
 const ns=expandFour(scale,2),nz=expandFour(zero,1),values=[1,-0.5,2,0.25];
 const half=bits=>{const sign=bits&0x8000?-1:1,e=(bits>>10)&31,f=bits&1023;return sign*(e?1+f/1024:f/1024)*2**(e?e-15:-14);};
 for(let block=0;block<4;block++)for(let quarter=0;quarter<4;quarter++)for(let q=0;q<256;q++){
   const representedOld=(q-zero[block])*values[block];const j=block*4+quarter;
   assert.equal((q-nz[j])*half(ns.readUInt16LE(j*2)),representedOld);
 }
 assert.equal(verifyParameterExpansion(scale,ns,2),32);assert.equal(verifyParameterExpansion(zero,nz,1),16);
 // Wrong repetition order or one changed zero destroys actual dequantized values.
 const tile=Buffer.concat([zero,zero,zero,zero]);assert.throws(()=>verifyParameterExpansion(zero,tile,1),/mismatch/);
 const bad=Buffer.from(nz);bad[9]++;assert.notEqual((130-bad[9])*half(ns.readUInt16LE(18)),(130-zero[2])*values[2]);
 assert.throws(()=>verifyParameterExpansion(zero,bad,1),/mismatch/);
});
test('Streaming writer/independent disk validator cover the middle, and reject corrupted source/data or wrong offsets',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cf-repack-test-'));let source,out;
 try{
   const bytes=Buffer.alloc(131104);for(let i=0;i<bytes.length;i++)bytes[i]=(i*17+Math.floor(i/256))&255;
   const src=path.join(dir,'source');await fs.writeFile(src,bytes);source=await fs.open(src,'r');
   out=await fs.open(path.join(dir,'out'),'wx+');
   const plan={totalBytes:bytes.length*4,tensors:[{name:'zero',role:'Z',width:1,source:{location:'source',offset:0,length:bytes.length},output:{location:'data',offset:0,length:bytes.length*4}}]};
   const handles=new Map([['source',source]]);await writeParameters(plan,handles,out);
   assert.equal((await verifyParameters(plan,handles,out)).verifiedBytes,bytes.length*4);
   await assertHandleHash(source,{path:'source',bytes:bytes.length,sha256:sha256(bytes)});
   const at=263177,b=Buffer.alloc(1);await out.read(b,0,1,at);b[0]^=1;await out.write(b,0,1,at);
   await assert.rejects(()=>verifyParameters(plan,handles,out),/mismatch/);
   b[0]^=1;await out.write(b,0,1,at);
   const wrong=structuredClone(plan);wrong.tensors[0].source.offset=1;
   await assert.rejects(()=>verifyParameters(wrong,handles,out),/mismatch|Truncated/);
   await assert.rejects(()=>assertHandleHash(source,{path:'source',bytes:bytes.length,sha256:'0'.repeat(64)}),/SHA/);
 }finally{await source?.close();await out?.close();await fs.rm(dir,{recursive:true,force:true});}
});
test('Output ownership rejects partial reuse without touching its existing evidence',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'cf-repack-owner-')),out=path.join(dir,'out');
 try{await createFreshOutput(out);await fs.writeFile(path.join(out,'partial'),'preserve');
   await assert.rejects(()=>createFreshOutput(out),{code:'EEXIST'});
   assert.equal(await fs.readFile(path.join(out,'partial'),'utf8'),'preserve');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
 for(const pair of [['/tmp/a','/tmp/b'],[path.join(CACHE_ROOT,'a'),path.join(CACHE_ROOT,'a')],
   [path.join(CACHE_ROOT,'a'),path.join(CACHE_ROOT,'a','child')]])assert.throws(()=>validateLocations(...pair),/Unsafe/);
 assert.equal(validateLocations(path.join(CACHE_ROOT,'parent'),path.join(CACHE_ROOT,'derivatives','new')).output,path.join(CACHE_ROOT,'derivatives','new'));
});
