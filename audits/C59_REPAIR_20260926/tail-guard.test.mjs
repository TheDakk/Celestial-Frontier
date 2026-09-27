import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {assertTailPair} from '../TAIL_LABELS_CHECK_20260926/tail-identity.mjs';
const req=createRequire(new URL('../../port/v2/package.json',import.meta.url)),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
for(const [id,tail,stalk,wrong] of [['08-cod','caudal','body-5','dorsal'],['07-perch','caudal','body-5','dorsal'],['09-carp','caudal','body-5','dorsal'],['03-arctic-fox','tail3','tail2','head']]){
 test(id+' admits rig identity and rejects wrong tail before placement',async()=>{
  const base=`audits/TAIL_LABELS_C56_20260926/${id}/fit`,d=JSON.parse(fs.readFileSync(base+'/declaration.json'));
  const raw=await sharp(base+'/labels.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});const labels=Uint8Array.from({length:raw.info.width*raw.info.height},(_,i)=>raw.data[i*4]);
  const pair=assertTailPair(d.parts,labels,raw.info.width,tail,stalk);assert.equal(pair.tail,tail);
  assert.throws(()=>assertTailPair(d.parts,labels,raw.info.width,wrong,stalk),/Tail identity: requested/);
 });
}
test('actual compiler rejects wrong Cod tail without creating a candidate',()=>{
 const id='c59-wrong-dorsal-control',out='audits/TAIL_LABELS_C56_20260926/'+id;assert(!fs.existsSync(out));
 const r=spawnSync(process.execPath,['audits/TAIL_LABELS_C56_20260926/compile.mjs',id,'audits/TAIL_LABELS_C56_20260926/08-cod/fit','dorsal','body-5','body'],{encoding:'utf8'});
 assert.notEqual(r.status,0);assert.match(r.stderr,/Tail identity: requested dorsal\/body-5, rig says caudal\/body-5/);assert(!fs.existsSync(out));
});
