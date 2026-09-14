#!/usr/bin/env node
import path from 'node:path';import {exportVoiceSet} from './audio-export.mjs';
import {acquireWorkspaceLock} from '../workspacelock.mjs';
const [file,output]=process.argv.slice(2);if(!file||!output||process.argv.length!==4)throw Error('Usage: node export-audio.mjs voice-manifest.json NEW_OUTPUT_DIRECTORY');
const release=acquireWorkspaceLock('C3 offline audio export');
try{const report=exportVoiceSet(path.resolve(file),path.resolve(output));console.log(JSON.stringify({status:report.status,files:report.outputs.length,qualityAccepted:false}));}finally{release();}
