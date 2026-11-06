import {describe,it,expect} from 'vitest';
import {deliverCreaturePngV1} from '../apps/game/src/creature-delivery.js';
import {creatureOriginalKey} from '../apps/game/src/creature-originals.js';
import {hashLandfallBlobV1} from '../apps/game/src/landfall-content-hash.js';
describe('D1 read-only delivery',()=>{
 it('retains exact bytes; missing, rejected, wrong identity and corrupt records fall back',async()=>{
  const identity={recordRecipeHash:'a'.repeat(64),cutoutAssetHash:'b'.repeat(64),settingsHash:'c'.repeat(64),modelHash:'d'.repeat(64)},painter=new Blob(['painter'],{type:'image/png'}),blob=new Blob(['finished'],{type:'image/png'}),sha256=await hashLandfallBlobV1(blob),painterSha256=await hashLandfallBlobV1(painter),original={key:creatureOriginalKey(identity),blob,sha256,receipt:'test'};
  const run=(find:any,retainedAllowed=true)=>deliverCreaturePngV1({identity,painter,painterSha256,retainedSha256:sha256,retainedAllowed,store:{find}});
  expect((await run(async()=>original)).blob).toBe(blob);
  for(const find of [async()=>null,async()=>({...original,key:'wrong'}),async()=>({...original,blob:painter}),async()=>{throw Error('corrupt');}])expect((await run(find)).blob).toBe(painter);
  let reads=0;expect((await run(async()=>{reads++;return original;},false)).source).toBe('painter');expect(reads).toBe(0);
  await expect(deliverCreaturePngV1({identity,painter,painterSha256:sha256,retainedSha256:sha256,retainedAllowed:false,store:{find:async()=>null}})).rejects.toThrow('painter delivery hash');
 });
});
