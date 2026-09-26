import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DERIVED_LABEL_IDS,reviewDerivedOwnershipV1,buildCreatureFinishSourcePinsV1} from './creature-finish-source-pins.mjs';
import {getBattle2MasterPin} from '../../apps/game/src/battle2-master-pins.generated.ts';
const root=path.resolve(import.meta.dirname,'../../../..'),read=p=>new Uint8Array(fs.readFileSync(path.join(root,p))),sha=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const json=b=>JSON.parse(new TextDecoder().decode(b)),encoded=o=>new TextEncoder().encode(JSON.stringify(o));
test('all four derived maps independently reproduce exact PNG/pixels, ownership and unchanged source pins; generated module is current',async()=>{
 const alphaMismatch={civet:1055758,eel:1502563,rat:1420733,salamander:1432379};
 for(const id of DERIVED_LABEL_IDS){const r=await reviewDerivedOwnershipV1(id);assert.equal(r.unowned,0);assert.equal(r.outside,0);assert.equal(r.identityConservation,'PASS');assert.ok(r.labels>0);assert.equal(r.masterAlphaMismatchPixels,alphaMismatch[id]);}
 const built=await buildCreatureFinishSourcePinsV1();assert.equal(built.rows.length,38);assert.equal(built.rows.filter(r=>r.source==='reviewed-derived-ownership').length,4);assert.equal(built.source,fs.readFileSync(path.join(root,'port/v2/apps/game/src/creature-finish-source-pins.generated.ts'),'utf8'));
});
test('changed original atlas, binding geometry, receipt dimensions and generator provenance refuse before supplementary admission',async()=>{
 const id='eel',p=getBattle2MasterPin(id),rp=`audits/G5_DERIVED_LABELS_20260926/${id}/receipt.json`,receipt=json(read(rp)),bindingPath=p.recordPath.replace('record.json','binding.json');
 const badAtlas=read(p.atlasPath).slice();badAtlas[20]^=1;
 const badBinding=json(read(bindingPath));badBinding.parts[0].cutout.x++;
 const variants=[{file:p.atlasPath,bytes:badAtlas,reason:/atlas pin/},{file:bindingPath,bytes:encoded(badBinding),reason:/binding pin/},{file:rp,bytes:encoded({...receipt,dimensions:{...receipt.dimensions,width:receipt.dimensions.width+1}}),reason:/receipt dimensions/},{file:rp,bytes:encoded({...receipt,generatorSha256:'f'.repeat(64)}),reason:/generator provenance/}];
 for(const c of variants)await assert.rejects(reviewDerivedOwnershipV1(id,{read:f=>f===c.file?c.bytes:read(f)}),c.reason);
 assert.equal((await reviewDerivedOwnershipV1(id)).unowned,0);
});
test('forged label pixels with a matching forged receipt cannot replace original pinned ownership',async()=>{
 const id='rat',r=await reviewDerivedOwnershipV1(id),rp=`audits/G5_DERIVED_LABELS_20260926/${id}/receipt.json`,receipt=json(read(rp));
 const changed=r.pixels.slice(),at=changed.findIndex((v,i)=>i%4===0&&v>0);assert.ok(at>=0);changed[at]=changed[at]===1?2:1;
 const png=new Uint8Array(await sharp(Buffer.from(changed),{raw:{width:r.width,height:r.height,channels:4}}).png({compressionLevel:9}).toBuffer());
 receipt.labels.pngSha256=sha(png);receipt.labels.rgbaSha256=sha(changed);
 await assert.rejects(reviewDerivedOwnershipV1(id,{read:f=>f===r.labelsPath?png:f===rp?encoded(receipt):read(f)}),/full-resolution ownership mismatch/);
 assert.equal((await reviewDerivedOwnershipV1(id)).labelsPngSha256,r.labelsPngSha256);
});
