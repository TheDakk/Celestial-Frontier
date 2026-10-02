import fs from 'node:fs';
import os from 'node:os';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,rows=JSON.parse(fs.readFileSync(base+'/pilot.json')),sha=b=>createHash('sha256').update(b).digest('hex'),verified=[];
for(const row of rows){
 const master=fs.readFileSync(row.master),g=JSON.parse(fs.readFileSync(row.packet+'/generation.json')),r=JSON.parse(fs.readFileSync(row.packet+'/request.json')),prompt=fs.readFileSync(row.packet+'/prompt.txt'),source=g.sourcePath.startsWith('~/')?os.homedir()+'/'+g.sourcePath.slice(2):g.sourcePath;
 if(sha(master)!==g.masterSha256||!master.equals(fs.readFileSync(source))||sha(prompt)!==r.promptSha256||g.promptSha256!==r.promptSha256)throw Error('Exact retained original mismatch');
 verified.push({id:row.id,masterSha256:sha(master),promptSha256:r.promptSha256,bytes:master.length,byteIdenticalToGenerator:true});
}
fs.writeFileSync(base+'/originals-verified.json',JSON.stringify({masters:verified.length,totalBytes:verified.reduce((n,r)=>n+r.bytes,0),outputModified:false,scope:'Original byte and prompt retention only; no anatomy or native admission.',verified},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({masters:verified.length,totalBytes:verified.reduce((n,r)=>n+r.bytes,0)}));
