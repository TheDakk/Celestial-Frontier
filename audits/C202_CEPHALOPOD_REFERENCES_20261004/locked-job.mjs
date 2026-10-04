import {acquireWorkspaceLock} from '../../port/v2/tools/workspacelock.mjs';
import {spawnSync} from 'node:child_process';
const args=process.argv.slice(2);if(!args.length||!args[0].startsWith('audits/'))throw Error('audit job required');
let release;try{release=acquireWorkspaceLock('C202 cephalopod '+args[0]);}catch(error){console.error(String(error.message).replaceAll(/\/Users\/[^/\s]+/g,'~'));process.exit(75);}
try{const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:32<<20,timeout:900000});process.stdout.write(((r.stdout??'')+(r.stderr??'')).replaceAll(/\/Users\/[^/\s]+/g,'~'));process.exitCode=r.status??1;}finally{release();}
