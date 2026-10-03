import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(process.cwd()+'/port/v2/package.json');
const {rolldown}=await import(require.resolve('rolldown'));
const scratch=fs.mkdtempSync('/private/tmp/cf-c89-card-');
try {
 const bundle=await rolldown({input:new URL('probe-card.ts',import.meta.url).pathname,platform:'node'});
 try {await bundle.write({file:scratch+'/probe.mjs',format:'es'});} finally {await bundle.close();}
 await import(pathToFileURL(scratch+'/probe.mjs').href);
} finally {fs.rmSync(scratch,{recursive:true});}
