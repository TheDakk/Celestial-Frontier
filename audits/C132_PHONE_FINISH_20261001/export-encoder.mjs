/** Audit-only TAESD encoder graph: pinned safetensors, no pickle/Python/code download. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash}from'node:crypto';
import {encodeField as f,concatFields as cat,parseFields}from'../../tools/local-image-repack/protobuf.mjs';
const dir=import.meta.dirname,b=fs.readFileSync(dir+'/model-cache/taesd/taesd_encoder.safetensors'),length=Number(b.readBigUInt64LE(0));assert(length>0&&length<1e6);const h=JSON.parse(b.subarray(8,8+length)),offset=8+length,used=new Set();
const str=(n,s)=>f(n,2,Buffer.from(s)),num=(n,v)=>f(n,0,v),msg=(n,a)=>f(n,2,cat(a)),initial=[];
for(const[k,v]of Object.entries(h)){if(k==='__metadata__')continue;assert.equal(v.dtype,'F32');assert.equal(v.shape.reduce((a,b)=>a*b,4),v.data_offsets[1]-v.data_offsets[0]);const raw=b.subarray(offset+v.data_offsets[0],offset+v.data_offsets[1]);initial.push(msg(5,[...v.shape.map(d=>num(1,d)),num(2,1),str(8,k),f(9,2,raw)]));}
const nodes=[];let serial=0;
function node(op,inputs,attrs=[],name){const out=name??'v'+serial++;nodes.push(msg(1,[...inputs.map(v=>str(1,v)),str(2,out),str(4,op),...attrs]));return out;}
const ints=(key,x)=>msg(5,[str(1,key),...x.map(v=>num(8,v)),num(20,7)]);
function conv(x,key,stride=1){const ins=[x,key+'.weight'];assert(h[key+'.weight']);used.add(key+'.weight');if(h[key+'.bias']){ins.push(key+'.bias');used.add(key+'.bias');}return node('Conv',ins,[ints('pads',[1,1,1,1]),ints('strides',[stride,stride])]);}
function block(x,i){let y=conv(x,i+'.conv.0');y=node('Relu',[y]);y=conv(y,i+'.conv.2');y=node('Relu',[y]);y=conv(y,i+'.conv.4');return node('Relu',[node('Add',[y,x])]);}
let x=conv('image','0');x=block(x,'1');for(const start of[2,6,10]){x=conv(x,''+start,2);for(let i=start+1;i<=start+3;i++)x=block(x,''+i);}x=conv(x,'14');node('Identity',[x],[],'latent');
assert.equal(used.size,Object.keys(h).filter(k=>k!=='__metadata__').length,'every tensor must be consumed');
const info=(name,shape)=>[str(1,name),msg(2,[msg(1,[num(1,1),msg(2,shape.map(n=>msg(1,[num(1,n)])))])])];
const graph=msg(7,[...nodes,str(2,'TAESD pinned encoder'),...initial,msg(11,info('image',[1,3,512,512])),msg(12,info('latent',[1,4,64,64]))]);
const model=cat([num(1,8),str(2,'Celestial Frontier audit encoder exporter'),graph,msg(8,[str(1,''),num(2,17)])]);assert.equal(parseFields(model).filter(v=>v.number===7).length,1);
fs.writeFileSync(dir+'/model-cache/taesd/encoder.onnx',model,{flag:'wx'});
fs.writeFileSync(dir+'/encoder-export.json',JSON.stringify({schema:'cf.taesd-audit-export/v1',sourceSha256:createHash('sha256').update(b).digest('hex'),modelSha256:createHash('sha256').update(model).digest('hex'),bytes:model.length,nodes:nodes.length,tensors:used.size,architectureSource:'https://github.com/madebyollin/taesd/blob/main/taesd.py',license:'MIT',scope:'Explicit Conv/Relu/Add encoder export; architecture review complete, runtime/reconstruction checks pending.'},null,2)+'\n');console.log(model.length,'bytes,',nodes.length,'nodes');
