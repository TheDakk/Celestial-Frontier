#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {exportVoiceSet,exportSoundSet} from './audio-export.mjs';
import {acquireWorkspaceLock} from '../workspacelock.mjs';
const [file,output]=process.argv.slice(2);if(!file||!output||process.argv.length!==4)throw Error('Usage: node export-audio.mjs manifest.json NEW_OUTPUT_DIRECTORY');
const release=acquireWorkspaceLock('C3 offline audio export');
try{const schema=JSON.parse(fs.readFileSync(file,'utf8')).schema;const run=schema==='cf.sound-source-intake/v1'?exportSoundSet:exportVoiceSet;const report=run(path.resolve(file),path.resolve(output));console.log(JSON.stringify({status:report.status,files:report.outputs.length,qualityAccepted:false}));}finally{release();}
