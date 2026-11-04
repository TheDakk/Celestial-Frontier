import {rolldown} from 'rolldown';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {acquireWorkspaceLock} from '../workspacelock.mjs';
if(process.argv.length!==3)throw Error('Usage: kit-client-export.mjs OUTPUT_FILE');
const release=acquireWorkspaceLock('isolated kit client authoring export');let bundle;
try{bundle=await rolldown({input:fileURLToPath(new URL('./kit-client-entry.ts',import.meta.url)),platform:'browser'});await bundle.write({file:path.resolve(process.argv[2]),format:'es'});}finally{await bundle?.close();release();}
