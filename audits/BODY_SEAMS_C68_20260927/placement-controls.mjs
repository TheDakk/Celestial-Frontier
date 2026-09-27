import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createRequire}from'node:module';import{createHash}from'node:crypto';
const req=createRequire(new URL('../../port/v2/package.json',import.meta.url)),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const cases=[['trout-axial-01',base+'/06-trout/source-fit','root'],['herring-axial-01',base+'/10-herring/source-fit','root'],['cod-axial-01',path.resolve('audits/C59_REPAIR_20260926/cod-gill/fit'),'root'],['arctic-nape-01',path.resolve('audits/C59_REPAIR_20260926/arctic-islands/fit'),'chest']];
const decode=async p=>{const d=await sharp(p).ensureAlpha().raw().toBuffer();return Uint8Array.from({length:d.length/4},(_,i)=>d[i*4]);};
function verify(before,after,eligible,rgba,nextRgba,expected){assert.deepEqual(rgba,nextRgba,'Original RGBA');assert.equal(before.length,after.length);let moved=0;for(let i=0;i<before.length;i++)if(before[i]!==after[i]){assert.equal(before[i],eligible,'Protected owner changed');assert(rgba[i*4+3]>0,'Transparent source changed');moved++;}assert.equal(moved,expected);assert(moved>0);return moved;}
const rows=[];
for(const[id,source,joint]of cases){
 const fit=base+'/'+id+'/fit',record=JSON.parse(fs.readFileSync(fit+'/record.json')),receipt=JSON.parse(fs.readFileSync(base+'/'+id+'/receipt.json')),parts=JSON.parse(fs.readFileSync(source+'/declaration.json')).parts,eligible=parts.findIndex(p=>p.joint===joint)+1;
 assert(eligible>0);assert.deepEqual(fs.readFileSync(source+'/record.json'),fs.readFileSync(fit+'/record.json'));
 const master=fs.readFileSync(record.source);assert.equal(sha(master),record.geometry.cutoutAssetHash);
 const rgba=await sharp(master).ensureAlpha().raw().toBuffer(),before=await decode(source+'/labels.png'),after=await decode(fit+'/labels.png'),expected=receipt.gap.moved??receipt.gap.changedPixels;
 verify(before,after,eligible,rgba,rgba,expected);
 const protectedIndex=before.findIndex(x=>x>0&&x!==eligible),bad=Uint8Array.from(after);bad[protectedIndex]=eligible;assert.throws(()=>verify(before,bad,eligible,rgba,rgba,expected),/Protected owner changed/);
 const changedRgba=Uint8Array.from(rgba);changedRgba[3]^=1;assert.throws(()=>verify(before,after,eligible,rgba,changedRgba,expected),/Original RGBA/);
 assert.throws(()=>verify(before,before,eligible,rgba,rgba,expected));
 rows.push({id,changedPixels:expected,recordByteIdentical:true,masterSha256:sha(master),protectedOwnersUnchanged:true,negativeControls:['foreign-owner edit refused','alpha edit refused','unchanged labels do not masquerade as repair']});
}
fs.writeFileSync(base+'/placement-controls.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(rows));
