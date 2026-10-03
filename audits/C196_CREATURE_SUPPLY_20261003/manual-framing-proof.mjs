import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import sharp from '../../port/v2/node_modules/sharp/dist/index.cjs';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const manual=JSON.parse(fs.readFileSync(base+'/manual-framing.json')),auto=JSON.parse(fs.readFileSync(base+'/observations.json'));
assert.deepEqual(manual.rows.map(r=>r.name),['Marsh Rodent','Stick Insect']);
const results=[];
for(const row of manual.rows){
 const bytes=fs.readFileSync(row.master),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const verify=(r,b)=>{assert.equal(r.masterSha256,sha(b));assert.equal(r.status,'REFUSE');assert.equal(info.width,1254);assert.equal(info.height,1254);assert.equal(r.requiredMargin,101);for(const p of r.nativePixelSamples){assert(p.x>info.width-1-r.requiredMargin);assert.deepEqual([...data.subarray((p.y*info.width+p.x)*4,(p.y*info.width+p.x)*4+4)],p.rgba);}};
 verify(row,bytes);assert.equal(auto.find(r=>r.name===row.name).framing.status,'PASS_FRAMING_ONLY');
 assert.throws(()=>verify({...row,masterSha256:'0'.repeat(64)},bytes));assert.throws(()=>verify({...row,nativePixelSamples:row.nativePixelSamples.map(p=>({...p,x:0}))},bytes));assert.throws(()=>verify({...row,status:'PASS'},bytes));
 results.push({name:row.name,status:'PASS',sourceBound:true,outsideUnchangedMargin:true,staleMasterRefused:true,interiorPixelRefused:true,falsePassRefused:true});
}
fs.writeFileSync(base+'/manual-framing-controls.json',JSON.stringify({scope:'Source-pixel evidence controls only; unchanged automated result preserved',manualSha256:sha(fs.readFileSync(base+'/manual-framing.json')),results},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({manualRefusals:results.length,controls:'PASS'}));
