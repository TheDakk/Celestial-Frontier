/** Independent, non-destructive reconstruction from retained pre-split bytes. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {splitObservedSurfaces} from '../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {familyContactChains,familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
const root=process.cwd(),d=import.meta.dirname;
const req=createRequire(path.join(root,'port/v2/package.json'));
const sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const rows=[];
for(const id of ['07-perch','08-cod','09-carp']){
 const fit=path.join(d,'scratch',id,'fit'),read=name=>JSON.parse(fs.readFileSync(path.join(fit,name)));
 const record=read('record.json'),binding=read('pre-split-binding.json'),manifest=read('parts/manifest.json');
 const receipt=JSON.parse(fs.readFileSync(path.join(fit,'../selected-pairs.json')));
 const atlas=await sharp(path.join(fit,'parts/atlas',manifest.creatureId+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
 const options={fixedJoints:['root'],shapeJoints:[...new Set(binding.parts.filter(p=>p.joint!=='root').map(p=>p.joint))],contactEndpoints:familyContactChains(familyContractForRecord(record)).map(c=>c.end),paintBoundaryPairs:receipt.pairs};
 const split=await splitObservedSurfaces(binding,record,probe,options),bytes=Buffer.from(JSON.stringify(split.binding,null,2)+'\n'),retained=fs.readFileSync(path.join(fit,'binding.json'));
 assert.deepEqual(bytes,retained,id+' exact binding bytes');assert.deepEqual(split.receipt,receipt.receipt,id+' exact receipt');
 fs.writeFileSync(path.join(fit,'../reproduced-binding.json'),bytes,{flag:'wx'});
 rows.push({id,options,preSplitSha256:sha(fs.readFileSync(path.join(fit,'pre-split-binding.json'))),recordSha256:sha(fs.readFileSync(path.join(fit,'record.json'))),bindingFileSha256:sha(bytes),bindingHash:split.binding.bindingHash,byteExact:true,receiptExact:true});
 console.log(id+' byte-exact');
}
fs.writeFileSync(path.join(d,'reproduction.json'),JSON.stringify({schema:'cf.c49-reproduction/v1',rows},null,2)+'\n',{flag:'wx'});
