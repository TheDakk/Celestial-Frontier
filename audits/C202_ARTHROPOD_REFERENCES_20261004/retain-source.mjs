import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import{createHash}from'node:crypto';
const[id,source]=process.argv.slice(2),base=path.relative(process.cwd(),import.meta.dirname),packet=base+'/'+id,q=JSON.parse(fs.readFileSync(packet+'/request.json')),sha=b=>createHash('sha256').update(b).digest('hex'),bytes=fs.readFileSync(source),actual=path.resolve(source);
if(!/^[0-9a-z-]+$/.test(id)||sha(fs.readFileSync(packet+'/prompt.txt'))!==q.promptSha256)throw Error('Exact queued prompt required');
fs.writeFileSync(packet+'/master.png',bytes,{flag:'wx'});
fs.writeFileSync(packet+'/generation.json',JSON.stringify({id,name:q.name,tool:'image_gen.imagegen',sourcePath:actual.startsWith(os.homedir()+'/')?'~/'+actual.slice(os.homedir().length+1):path.relative(process.cwd(),actual),masterSha256:sha(bytes),bytes:bytes.length,promptSha256:q.promptSha256,actualImageInputs:q.actualImageInputs??[{role:'style reference',path:q.reference,sha256:q.referenceSha256}],outputModified:false,sourceOriginalRetained:true,transparentBackground:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id,sha256:sha(bytes),bytes:bytes.length}));

