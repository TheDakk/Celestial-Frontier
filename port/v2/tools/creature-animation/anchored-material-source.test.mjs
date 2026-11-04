/** Hash-bound anchored source controls. These landmark/declaration controls DO NOT
 * clear the separately documented literal fixed branch/calyx captures in Deep Coral. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import sharp from 'sharp';
import {validateAnchoredMaterialSource} from './anchored-material-source.mjs';
import {appendageCounts} from './repeated-anatomy.mjs';
const root=new URL('../../../../',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
const base='audits/C475_DECISIONS_20261019/w1-keyer/radial-materials-r01/packets/';
const cases=[
 {id:'sea-anemone-r04',joint:'crownFar',png:'723e7cef2e69b97b1708798289d6eff15f09d9461c1d1713be1e6d0e042c54d5',author:'aece7a0872a4cde069f53cb9bb8ceba8d5e1ccba023644b919711a534b830896',presence:'87470cdb432e53322bf6b85c040101fa8a47703ecd9baccd8e69e1604e54d0aa'},
 {id:'deep-water-coral-r02',joint:'polyp0Tip',png:'8ca7eb16ae872a80818245abb8034a79cc85966f979bae94e5a1e5fd8d3a8216',author:'fc7f8950d657297040c1eccaea1767baeb6a214e7461625a861073fdc6038a70',presence:'cdd5ad25a4e7b7901a1979a91a4337f8fbe55b4c8e593520cf13d3cb85b01fe3'},
];
for(const row of cases){
 const read=(file,hash)=>{const b=fs.readFileSync(new URL(base+row.id+'/'+file,root));assert.equal(sha(b),hash,'frozen '+row.id+'/'+file);return b;};
 const author=JSON.parse(read('authoring.json',row.author)),presence=JSON.parse(read('presence.json',row.presence));
 const {data:raw,info}=await sharp(read('master.png',row.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const validate=(a=author,b=raw,p=presence)=>validateAnchoredMaterialSource(a,b,info.width,info.height,p);
 test(row.id+' exact frozen source/declared owners pass narrow support guard',()=>{
  assert.equal(validate().status,'PASS');assert.equal(validate().nativeAcceptance,false);
 });
 test(row.id+' erased observed crown refuses even with honestly updated RGBA seal',()=>{
  const a=structuredClone(author),b=Buffer.from(raw),[x,y]=a.landmarksPx[row.joint];
  b[(Math.floor(y)*info.width+Math.floor(x))*4+3]=0;a.sourceMaterial.rgbaSha256=sha(b);
  assert.throws(()=>validate(a,b),/positive actual source paint/);
  assert.equal(validate().status,'PASS','opposite unchanged painted source remains supported');
 });
 test(row.id+' stolen material owner and mismatched source declaration refuse',()=>{
  const a=structuredClone(author);a.parts.find(p=>p.joint===row.joint).joint=a.family==='anchored-soft-polyp'?'column':'skeleton';
  assert.throws(()=>validate(a),/observed material owner/);
  assert.throws(()=>validate({...author,sourceMaterial:{...author.sourceMaterial,rgbaSha256:'0'.repeat(64)}}),/exact source/);
  assert.equal(validate().status,'PASS');
 });
 test(row.id+' missing actual control refuses instead of silently supplying a joint',()=>{
  const a=structuredClone(author);delete a.landmarksPx[row.joint];
  assert.throws(()=>validate(a),/exact source control inventory/);
  assert.equal(validate().status,'PASS');
 });
}
test('mixed source count remains explicit, observed and inside unchanged64-joint limit',()=>{
 const anatomy=n=>({schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{polypFields:n}});
 assert.deepEqual(appendageCounts('anchored-skeleton-soft-polyps',anatomy(20)),{polypFields:20});
 assert.deepEqual(appendageCounts('anchored-skeleton-soft-polyps',anatomy(31)),{polypFields:31});
 for(const count of[0,-1,1.5,32])assert.throws(()=>appendageCounts('anchored-skeleton-soft-polyps',anatomy(count)),/polyp field count|64-joint budget/);
 for(const appendages of[undefined,{}, {polypFields:20,arms:6}])assert.throws(()=>appendageCounts('anchored-skeleton-soft-polyps',{...anatomy(20),appendages}),/explicit observed polyp field count/);
 const mixed=cases[1],author=JSON.parse(fs.readFileSync(new URL(base+mixed.id+'/authoring.json',root),'utf8'));
 assert.equal(Object.keys(author.landmarksPx).length,42,'the frozen20 fields require42 actual controls');
 assert.equal(author.parts.length,21,'one skeleton plus20 actual crown fields');
});
