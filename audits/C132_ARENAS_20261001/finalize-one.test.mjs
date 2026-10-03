import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {assertReceipt} from './finalize-one.mjs';
import {validateArenaDelivery} from '../../port/v2/apps/game/src/battle2/arena-delivery.ts';
const root=new URL('../../',import.meta.url),p='audits/C132_ARENAS_20261001/coral/';
const read=s=>fs.readFileSync(new URL(s,root));
const json=s=>JSON.parse(read(s));
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url));
const sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const recipe=json(p+'arena-delivery-recipe.json'),plates={};
for(const role of ['far','mid','near']){
 const {data,info}=await sharp(read(p+'arena-'+role+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 plates[role]={width:info.width,height:info.height,rgba:data};
}
test('D29 admits the actual unscaled 1672×941 originals but refuses an undeclared canvas',()=>{
 assert.equal(validateArenaDelivery({recipe,plates}).ok,true);
 const wrong=structuredClone(recipe);wrong.canvasSize.width=1671;
 assert(validateArenaDelivery({recipe:wrong,plates}).failures.some(s=>s.startsWith('canvas:')));
});
test('a candidate pass never registers false acceptance',()=>{
 const result=validateArenaDelivery({recipe,plates,acceptance:json(p+'acceptance.pending.json')});
 assert.equal(result.ok,false);assert(result.failures.some(s=>s.startsWith('acceptance.qualityAccepted:')));
});
test('paint failures remain failures at an admitted canvas',()=>{
 const far={...plates.far,rgba:Buffer.from(plates.far.rgba)};far.rgba[3]=0;
 assert(validateArenaDelivery({recipe,plates:{...plates,far}}).failures.some(s=>s.startsWith('plate far:')));
 const mid={...plates.mid,rgba:Buffer.from(plates.mid.rgba)};
 const y=Math.round(.78*(mid.height-1));
 for(let x=0;x<mid.width;x++)mid.rgba.set([255,0,255,255],(y*mid.width+x)*4);
 assert(validateArenaDelivery({recipe,plates:{...plates,mid}}).failures.some(s=>s.includes('fighting ground is not registered')));
 const near={...plates.near,rgba:Buffer.from(plates.near.rgba)};near.rgba.set([30,40,30,255],(Math.round(.5*near.height)*near.width+Math.round(near.width/3))*4);
 assert(validateArenaDelivery({recipe,plates:{...plates,near}}).failures.some(s=>s.includes('NEAR covers the stand/paws')));
});
test('source/prompt/receipt mutations refuse provenance while the original passes',()=>{
 const r=json(p+'arena-far.generation.json'),bytes=read(p+'arena-far.png');assertReceipt(r,bytes,read);
 const changed=Buffer.from(bytes);changed[100]^=1;assert.throws(()=>assertReceipt(r,changed,read),/selected master/);
 assert.throws(()=>assertReceipt({...r,bytes:r.bytes+1},bytes,read),/byte length/);
 assert.throws(()=>assertReceipt({...r,prompt:{...r.prompt,sha256:'0'.repeat(64)}},bytes,read),/generation prompt/);
 assert.throws(()=>assertReceipt({...r,qualityAccepted:true},bytes,read),/not acceptance/);
 assert.throws(()=>assertReceipt({...r,sourceToolOutput:'/private/hidden.png'},bytes,read),/home-relative/);
});
