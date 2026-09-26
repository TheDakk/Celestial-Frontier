import {createHash,webcrypto} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import {hashLandfallBufferV1,hashLandfallBlobV1,LANDFALL_HASH_MAX_BYTES_V1} from '../apps/game/src/landfall-content-hash.js';
import {LocalModelSha256V1} from '../apps/game/src/local-model-sha256.js';
const fixture = (n: number) => Uint8Array.from({length:n},(_,i)=>(i*31+(i>>>8))&255);
const independent = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
describe('landfall content hashing',()=>{
 it('native path matches SHA-256 and never invokes the pure-JS PNG loop',async()=>{
  const bytes=fixture(1024*1024+7),expected=independent(bytes);
  const old=vi.spyOn(LocalModelSha256V1.prototype,'update').mockImplementation(()=>{throw Error('synchronous PNG hashing used');});
  try{expect(await hashLandfallBufferV1(bytes.buffer)).toBe(expected);expect(old).not.toHaveBeenCalled();}
  finally{old.mockRestore();}
  const changed=bytes.slice();changed[6000]=changed[6000]!^1;expect(await hashLandfallBufferV1(changed.buffer)).not.toBe(expected);
 });
 it('compatibility path yields between chunks and snapshots before yielding',async()=>{
  const bytes=fixture(131079),expected=independent(bytes),yieldTask=vi.fn(async()=>{bytes.fill(0);});
  expect(await hashLandfallBufferV1(bytes.buffer,{subtle:null,yieldTask})).toBe(expected);expect(yieldTask).toHaveBeenCalledTimes(2);
 });
 it('native hashing snapshots before caller mutation and propagates native rejection',async()=>{
  const bytes=fixture(20000),expected=independent(bytes),pending=hashLandfallBufferV1(bytes.buffer,{subtle:webcrypto.subtle as SubtleCrypto});bytes.fill(0);
  expect(await pending).toBe(expected);
  const yieldTask=vi.fn(async()=>{}),subtle={digest:vi.fn(async()=>{throw Error('native refusal');})};
  await expect(hashLandfallBufferV1(bytes.buffer,{subtle,yieldTask})).rejects.toThrow('native refusal');expect(yieldTask).not.toHaveBeenCalled();
 });
 it('refuses oversized/empty inputs before hashing and retains exact intrinsic Blob bytes',async()=>{
  const subtle={digest:vi.fn(async()=>new ArrayBuffer(32))};
  await expect(hashLandfallBufferV1(new ArrayBuffer(0),{subtle})).rejects.toThrow('Invalid');
  await expect(hashLandfallBufferV1(new ArrayBuffer(LANDFALL_HASH_MAX_BYTES_V1+1),{subtle})).rejects.toThrow('oversized');expect(subtle.digest).not.toHaveBeenCalled();
  const bytes=fixture(500),blob=new Blob([bytes]);expect(await hashLandfallBlobV1(blob)).toBe(independent(bytes));
  class LyingBlob extends Blob { override get size(){return 1;} }
  await expect(hashLandfallBlobV1(new LyingBlob([bytes]))).rejects.toThrow('Invalid');
 });
});
