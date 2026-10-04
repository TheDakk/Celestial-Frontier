#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {inspectVoiceSet,inspectMaster,readBoundFile} from './contracts.mjs';
import {inspectSoundSet} from './sound-set.mjs';
const [mode,file]=process.argv.slice(2);
if(!['voice','masters','sound-set'].includes(mode)||!file||process.argv.length!==4)throw Error('Usage: node inspect.mjs voice|masters|sound-set manifest.json');
const manifest=JSON.parse(fs.readFileSync(file)),root=path.dirname(path.resolve(file));
let report;
if(mode==='voice')report=inspectVoiceSet(root,manifest);
else if(mode==='sound-set')report=inspectSoundSet(root,manifest);
else{
 if(manifest.schema!=='cf.master-intake/v1'||!Array.isArray(manifest.masters)||!manifest.masters.length)throw Error('Master manifest required');
 const paths=new Set();report=manifest.masters.map(row=>{if(paths.has(row.path))throw Error('Duplicate master');paths.add(row.path);return {path:row.path,kind:row.kind,...inspectMaster(readBoundFile(root,row),row.kind)};});
}
console.log(JSON.stringify(report,null,2));
