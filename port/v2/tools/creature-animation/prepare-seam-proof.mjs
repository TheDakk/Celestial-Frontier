#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {pathToFileURL} from 'node:url';import {rolldown} from 'rolldown';
import {acquireWorkspaceLock} from '../workspacelock.mjs';import {buildBandAtlas} from './band-patches.mjs';import {buildSeamBinding} from './build-seam-bridges.mjs';import {hashBytes} from './quadruped-template.mjs';
const [destination,producer]=process.argv.slice(2);if(!destination||!producer)throw Error('Usage: NEW_OUTPUT PRODUCER_SRC');
const root=path.resolve(import.meta.dirname,'../../../..'),out=path.resolve(destination);if(fs.existsSync(out))throw Error('New output required');
const release=acquireWorkspaceLock('C2 seam strip preparation'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cf-seam-card-'));
try{
 const bundle=await rolldown({input:path.resolve(producer,'motion/body-card.ts'),platform:'node'});try{await bundle.write({file:path.join(tmp,'card.mjs'),format:'es'});}finally{await bundle.close();}
 const {compileBodyCard}=await import(pathToFileURL(path.join(tmp,'card.mjs')).href);
 const specs=[{id:'civet',base:'audits/C2_PARTS_ATLAS_20260913/civet-v2',record:'audits/CIVET_2D_PROOF_20260912/civet.landmarks.json'},
 {id:'fox',base:'audits/C2_BOUNDED_REPAIR_20260913/candidate-01/fox',record:'audits/C2_BOUNDED_REPAIR_20260913/candidate-01/fox.landmarks.json'},
 {id:'procedural',base:'audits/C2_PARTS_ATLAS_20260913/procedural',record:'audits/C2_PARTS_ATLAS_20260913/native-painter-parts-03/record.json'}];
 fs.mkdirSync(out,{recursive:true});const results=[];
 for(const s of specs){const bytes=fs.readFileSync(path.join(root,s.record)),record=JSON.parse(bytes),card=compileBodyCard(record);
  const cardFile=path.join(out,s.id+'.card.json');fs.writeFileSync(cardFile,JSON.stringify(card,null,2)+'\n');
  const originalBase=s.base,bandOut=path.join(out,s.id+'-ink');
  await buildBandAtlas({id:s.id,baseDirectory:path.join(root,originalBase),recordFile:path.join(root,s.record),cardFile,output:bandOut,remainderPart:'torso'});
  s.base=path.relative(root,bandOut);
  const built=await buildSeamBinding(bandOut,record,card,'torso');
  for(const [suffix,value]of [['binding',built.binding],['receipt',built.receipt],['card',card]])fs.writeFileSync(path.join(out,s.id+'.'+suffix+'.json'),JSON.stringify(value,null,2)+'\n');
  results.push({...s,recordSha256:await hashBytes(bytes),bindingHash:built.binding.bindingHash,...built.receipt});
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({schema:'cf.seam-proof-assets/v1',status:'PREPARED_NOT_NATIVE_ACCEPTED',results},null,2)+'\n');
 console.log(JSON.stringify(results.map(({id,edges,drawables,groups})=>({id,edges,drawables,groups})),null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true});release();}
