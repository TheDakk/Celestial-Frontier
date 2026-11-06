import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base='audits/C136_SPRAWLER_REFERENCES_20261002',source='audits/G2_C132_QUADRUPEDS_20261001';
const selected=['05-monitor-lizard','15-iguana','24-newt'],sha=b=>createHash('sha256').update(b).digest('hex');
const originals=JSON.parse(fs.readFileSync(source+'/pilot.json')),rows=[];
for(const id of selected){
 const original=originals.find(r=>r.id===id),packet=base+'/'+id;
 fs.mkdirSync(packet,{recursive:true});
 for(const file of ['master.png','prompt.txt','subject-source.json','request.json','compiler-inputs.json','generation.json','visual-review.json'])fs.copyFileSync(original.packet+'/'+file,packet+'/'+file,fs.constants.COPYFILE_EXCL);
 const masterSha256=sha(fs.readFileSync(packet+'/master.png'));
 if(masterSha256!==JSON.parse(fs.readFileSync(original.packet+'/generation.json')).masterSha256)throw Error('Original mismatch');
 rows.push({...original,packet,master:packet+'/master.png',sourcePacket:original.packet,masterSha256,origin:'Byte-identical existing generated original; new independent manual observations only. No new species or generation.'});
}
fs.writeFileSync(base+'/pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
