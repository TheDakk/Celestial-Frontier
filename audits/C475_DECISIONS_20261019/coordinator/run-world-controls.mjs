import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{pathToFileURL}from'node:url';import{rolldown}from'../../../port/v2/node_modules/rolldown/dist/index.mjs';
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'cf-c475-world-'));let b;
try{b=await rolldown({input:'audits/C475_DECISIONS_20261019/coordinator/check-native-worlds.mjs',platform:'node'});const out=scratch+'/run.mjs';await b.write({file:out,format:'es'});await import(pathToFileURL(out).href);}finally{await b?.close();fs.rmSync(scratch,{recursive:true});}
