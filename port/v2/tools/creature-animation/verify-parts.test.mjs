import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
import {verifyPartsDirectory} from './verify-parts.mjs';import {hashJSON,hashBytes} from './quadruped-template.mjs';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
test('verifies the hidden band against packed bytes and refuses a resealed pixel or dimension mismatch',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cf-parts-test-'));try{
  fs.mkdirSync(path.join(root,'parts'));fs.mkdirSync(path.join(root,'atlas'));
  const raw=Buffer.from([31,52,78,255,4,7,12,255]),png=await sharp(raw,{raw:{width:2,height:1,channels:4}}).png().toBuffer();
  fs.writeFileSync(path.join(root,'parts/band.png'),png);fs.writeFileSync(path.join(root,'atlas/test.png'),png);
  const body={schema:'cf.creature-parts/v1',atlasSha256:await hashBytes(png),atlasSize:{width:2,height:1},parts:[{id:'band',kind:'joint-patch',frame:{x:0,y:0,width:2,height:1},cutout:{x:9,y:8,width:2,height:1}}]};
  const seal=async()=>fs.writeFileSync(path.join(root,'binding.json'),JSON.stringify({...body,bindingHash:await hashJSON(body)}));await seal();
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify({creatureId:'test',parts:[{name:'band.png',path:'parts/band.png',sha256:await hashBytes(png)}]}));
  assert.equal((await verifyPartsDirectory(root)).receipt.comparedChannels,8);
  raw[0]++;const corrupt=await sharp(raw,{raw:{width:2,height:1,channels:4}}).png().toBuffer();fs.writeFileSync(path.join(root,'atlas/test.png'),corrupt);
  await assert.rejects(verifyPartsDirectory(root),/atlas hash/);
  body.atlasSha256=await hashBytes(corrupt);await seal();await assert.rejects(verifyPartsDirectory(root),/packed pixels differ: band/);
  fs.writeFileSync(path.join(root,'atlas/test.png'),png);body.atlasSha256=await hashBytes(png);body.parts[0].cutout.width=1;await seal();await assert.rejects(verifyPartsDirectory(root),/part dimensions/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
