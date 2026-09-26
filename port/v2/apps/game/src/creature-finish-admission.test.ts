import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import {getBattle2MasterPin} from './battle2-master-pins.generated.js';
import {creatureFinishLabelsPinV1} from './creature-finish-source-pins.generated.js';
import {admitCreatureFinishedAtlasV1,creatureFinishedAtlasPixelsV1,createCreatureFinishDeliveryV1} from './creature-finish-admission.js';
import {finishSourceV1} from './creature-finish-route.js';
import {createCreatureFinishEngineV1,creatureFinishIdentityV1} from './creature-finish-engine.js';
import {creatureOriginalKey,type AiCreatureOriginalV1} from './creature-originals.js';
import {LocalModelSha256V1} from './local-model-sha256.js';
import {decodePng} from './morph/png-decode.js';
import {loadPinnedCreatureRigV1} from './creature-rig.js';
import {resetArtLibraryForTestsV1} from './art-library.js';
const bundled=vi.hoisted(()=>({pin:{path:'library/art-library.json',sha256:'',bytes:0}}));
vi.mock('./art-library.generated.js',()=>({ART_LIBRARY_MANIFEST_PIN:bundled.pin}));
const root=new URL('../../../../../',import.meta.url),pin=getBattle2MasterPin('crab')!;
const read=(p:string)=>new Uint8Array(readFileSync(new URL(p,root))),sha=(b:Uint8Array)=>new LocalModelSha256V1().update(b).digestHex();
const labelsPng=()=>read(creatureFinishLabelsPinV1(pin).labelsPath);
const input=()=>({pin,creatureId:pin.creatureId,record:JSON.parse(new TextDecoder().decode(read(pin.recordPath))),alphaPath:pin.alphaPath,alpha:read('port/v2/apps/game/public/battle2/'+pin.alphaPath),bindingBytes:read(pin.recordPath.replace('record.json','binding.json')),atlasPath:pin.atlasPath,atlas:read(pin.atlasPath)});
async function fixture(){const i=input(),source=await finishSourceV1({fit:{record:i.record,masterPng:read(pin.masterPath),labelsPng:labelsPng(),binding:i.bindingBytes},visualKey:'test-compendium-individual',identitySeed:7,modelHash:'a'.repeat(64)});
 let row:AiCreatureOriginalV1|null=null;const find=async()=>row;
 const engine=createCreatureFinishEngineV1({tier:'desktop',store:{find,read:find,close(){},async retain(identity,blob,receipt){row={key:creatureOriginalKey(identity),sha256:sha(new Uint8Array(await blob.arrayBuffer())),blob,receipt};return row;}},createInfer:async()=>async s=>({rgba:s.rgba.slice(),labels:s.labels.slice(),binding:s.binding.slice()})});
 const result=await engine.request(source);engine.close();if(result.status!=='original')throw Error(result.reason);return {i,source,original:result.original};}
let prepared:ReturnType<typeof fixture>|undefined;const ready=()=>prepared??=fixture();
it('real pinned Crab: verified original projects exactly to its original atlas and loads through the unchanged rig tail',async()=>{
 const {i,source,original}=await ready(),token=await admitCreatureFinishedAtlasV1(i,source,original,labelsPng()),identity=creatureFinishIdentityV1(source),atlas=await decodePng(i.atlas);
 const project=creatureFinishedAtlasPixelsV1(token,pin,identity);expect(project(atlas.rgba,atlas.width,atlas.height)).toEqual(atlas.rgba);
 const rig=await loadPinnedCreatureRigV1(i,undefined,{finishedAtlas:{token,identity}});expect(rig.recipeHash).toBe(pin.recipeHash);rig.applyPose({});rig.dispose();
 // Exposed pixels and structured copies cannot mint or mutate authority.
 const px=project(atlas.rgba,atlas.width,atlas.height);px.fill(0);expect(project(atlas.rgba,atlas.width,atlas.height)).toEqual(atlas.rgba);
 expect(()=>creatureFinishedAtlasPixelsV1({...token},pin,identity)).toThrow('untrusted');
 expect(()=>creatureFinishedAtlasPixelsV1(token,{...pin},identity)).toThrow('untrusted');
 expect(()=>creatureFinishedAtlasPixelsV1(token,pin,{...identity,modelHash:'b'.repeat(64)})).toThrow('mismatched');
},60000);
it('source master, binding, labels and original bytes/identity all refuse; arbitrary receipts cannot authorize ownership',async()=>{
 const {i,source,original}=await ready(),flip=(b:Uint8Array)=>{const c=b.slice();c[0]!^=1;return c;};
 for(const s of[{...source,masterPng:flip(source.masterPng)},{...source,binding:flip(source.binding)},{...source,labels:flip(source.labels),labelsHash:sha(flip(source.labels))}])
  await expect(admitCreatureFinishedAtlasV1(i,s,original,labelsPng())).rejects.toThrow('finish admission');
 await expect(admitCreatureFinishedAtlasV1(i,source,original,flip(labelsPng()))).rejects.toThrow('labels pin');
 await expect(admitCreatureFinishedAtlasV1({...i,atlas:flip(i.atlas)},source,original,labelsPng())).rejects.toThrow('atlas-mismatch');
 await expect(admitCreatureFinishedAtlasV1(i,source,{...original,key:'b'.repeat(64)},labelsPng())).rejects.toThrow('identity');
 await expect(admitCreatureFinishedAtlasV1(i,source,{...original,receipt:'{}'},labelsPng())).rejects.toThrow('receipt');
 const token=await admitCreatureFinishedAtlasV1(i,source,original,labelsPng());expect(token.key).toBe(original.key);
},60000);
it('loader rejects forged finish before atlas/Pixi allocation, and cannot accept unchecked remap composition',async()=>{
 const {i,source}=await ready(),decode=vi.fn(async()=>{throw Error('decoder reached');}),identity=creatureFinishIdentityV1(source);
 await expect(loadPinnedCreatureRigV1(i,decode,{finishedAtlas:{token:{},identity}})).rejects.toThrow('untrusted');
 await expect(loadPinnedCreatureRigV1(i,decode,{finishedAtlas:{token:{},identity},atlasPixels:a=>a})).rejects.toThrow('unchecked remap');expect(decode).not.toHaveBeenCalled();
});
it('missing ownership label evidence fails closed for the four unsupported fits',()=>{
 for(const id of['civet','eel','rat','salamander'])expect(()=>creatureFinishLabelsPinV1(getBattle2MasterPin(id)!)).toThrow('missing source pin');
 expect(()=>creatureFinishLabelsPinV1({...pin})).toThrow('untrusted rig pin');expect(sha(labelsPng())).toBe(creatureFinishLabelsPinV1(pin).labelsPngSha256);
});
it('phone delivery requires both pinned files, exact identity, and unchanged bytes before returning an original',async()=>{
 const {source,original}=await ready(),identity=creatureFinishIdentityV1(source),key=creatureOriginalKey(identity),dir=`library/creature-finish/${key}/`;
 const png=new Uint8Array(await original.blob.arrayBuffer()),receipt=new TextEncoder().encode(original.receipt);
 let paths:string[]=[];const files=new Map<string,Uint8Array>();
 const publishFixture=(receiptBytes:Uint8Array,includeReceipt=true)=>{
  files.clear();files.set(dir+'original.png',png);if(includeReceipt)files.set(dir+'receipt.json',receiptBytes);
  const manifest=new TextEncoder().encode(JSON.stringify({schema:'cf-art-library/v1',files:[...files].map(([path,bytes])=>({path,bytes:bytes.length,sha256:sha(bytes)}))}));
  files.set(bundled.pin.path,manifest);bundled.pin.sha256=sha(manifest);bundled.pin.bytes=manifest.length;resetArtLibraryForTestsV1();paths=[];
 };
 let corrupt:string|null=null;const fetchImpl=(async(input:RequestInfo|URL)=>{const path=new URL(String(input)).pathname.slice(1);paths.push(path);let bytes=files.get(path);
  if(!bytes)return new Response('missing',{status:404});if(path===corrupt){bytes=bytes.slice();bytes[0]!^=1;}return new Response(new Uint8Array(bytes));}) as typeof fetch;
 const delivered=createCreatureFinishDeliveryV1({base:'http://fixture/',fetchImpl});publishFixture(receipt);
 expect((await delivered(identity))?.sha256).toBe(original.sha256);expect(paths).toContain(dir+'receipt.json');expect(paths).toContain(dir+'original.png');
 corrupt=dir+'original.png';await expect(delivered(identity)).rejects.toThrow('digest-mismatch');corrupt=dir+'receipt.json';await expect(delivered(identity)).rejects.toThrow('digest-mismatch');corrupt=null;
 const wrong=JSON.parse(original.receipt);wrong.identity.modelHash='b'.repeat(64);publishFixture(new TextEncoder().encode(JSON.stringify(wrong)));await expect(delivered(identity)).rejects.toThrow('receipt identity');
 publishFixture(receipt,false);expect(await delivered(identity)).toBeNull();expect(paths).toEqual([bundled.pin.path]);
 publishFixture(receipt);expect((await delivered(identity))?.key).toBe(original.key);
 resetArtLibraryForTestsV1();const forged={base:'http://offline/',fetchImpl:(async()=>new Response('offline',{status:503})) as typeof fetch,pin:{path:'fake',sha256:'a'.repeat(64),bytes:1}};
 expect(await createCreatureFinishDeliveryV1(forged)(identity)).toBeNull();
});
