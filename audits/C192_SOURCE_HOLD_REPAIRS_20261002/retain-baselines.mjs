/** Read-only sibling intake: exact original failures and source bytes, never a sibling write. */
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';import {createHash}from'node:crypto';
const b='audits/C192_SOURCE_HOLD_REPAIRS_20261002',s=path.join(os.homedir(),'Projects/celestial-frontier-anthropic-mac'),sha=x=>createHash('sha256').update(x).digest('hex');
for(const [id,old]of [['wild-ass','g2c107-24-wild-ass'],['horse','g2c114-13-horse'],['serval','g2c233-16-serval']]){
 const src=`audits/ISLANDS_D28_20261002/${old}`,out=`${b}/baseline-${id}`;assert(!fs.existsSync(out));fs.mkdirSync(out,{recursive:true});
 fs.cpSync(path.join(s,src,'fit'),`${out}/fit`,{recursive:true,errorOnExist:true,force:false});
 for(const name of ['static.json','static.json.sources.json','receipt.json'])fs.copyFileSync(path.join(s,src,name),`${out}/${name}`,fs.constants.COPYFILE_EXCL);
 if(id==='wild-ass')for(const name of ['script.json','native/turn3-hit-idle-90.png','native/report.json']){fs.mkdirSync(path.dirname(`${out}/${name}`),{recursive:true});fs.copyFileSync(path.join(s,src,name),`${out}/${name}`,fs.constants.COPYFILE_EXCL);}
 const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else{const rel=path.relative(out,p);assert.equal(sha(fs.readFileSync(p)),sha(fs.readFileSync(path.join(s,src,rel))));files.push({path:rel,sha256:sha(fs.readFileSync(p)),bytes:fs.statSync(p).size});}}}walk(out);
 fs.writeFileSync(`${out}/retention.json`,JSON.stringify({schema:'cf.c192-exact-original-retention/v1',source:`~/Projects/celestial-frontier-anthropic-mac/${src}`,files,historicalLimitsPreserved:true,qualityAccepted:false},null,2)+'\n',{flag:'wx'});console.log(id);
}
