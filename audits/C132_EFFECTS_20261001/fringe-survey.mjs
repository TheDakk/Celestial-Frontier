import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const dir=import.meta.dirname,req=createRequire(path.resolve(dir,'../../port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp'),requests=JSON.parse(fs.readFileSync(path.join(dir,'requests.json')));
const rows=[];for(const row of requests.rows){const {data,info}=await sharp(path.join(dir,row.theme,'keyed',row.phase+'.png')).raw().toBuffer({resolveWithObject:true});let count=0;for(let i=0;i<data.length;i+=4){const[r,g,b,a]=data.subarray(i,i+4);if(a&&r>140&&b>140&&g<110&&r>=b*.85&&b>=r*.85&&Math.min(r,b)-g>40)count++;}rows.push({theme:row.theme,phase:row.phase,highChromaMagentaCandidates:count});}
console.log(JSON.stringify(rows));
