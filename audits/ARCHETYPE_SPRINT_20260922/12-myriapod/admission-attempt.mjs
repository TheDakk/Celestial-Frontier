import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';
import {familyContract} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
import {resolveAnatomyInventory} from '../../../port/v2/tools/creature-animation/anatomy-inventory.mjs';
const d=import.meta.dirname, start=performance.now(),startedAt=new Date().toISOString();
const minimumCapabilityRequest={schema:'cf.anatomy-presence/v2',absent:[],hidden:[],folded:[],appendages:{legPairs:5}};
// A capability request, NOT the painted full count or an admitted family record.
// Five separately observed near legs already exceed this template's four near slots.
fs.mkdirSync(d+'/fit-01',{recursive:false});
const input={scope:'minimum repeated-leg capacity request; full painted leg/pair count remains unknown',minimumCapabilityRequest,observations:'observed-inventory.json'};
fs.writeFileSync(d+'/capability-request.json',JSON.stringify(input,null,2)+'\n');
let error=null;try{resolveAnatomyInventory(familyContract('myriapod'),minimumCapabilityRequest);}catch(e){error=String(e.stack??e);}
if(!error)throw Error('Unexpected capability admission; do not infer a fit');
fs.writeFileSync(d+'/fit-01/refusal.json',JSON.stringify({stage:'family-contract-capability',error,scope:input.scope},null,2)+'\n');
const sources=['family-contracts.mjs','anatomy-inventory.mjs','repeated-anatomy.mjs'].map(n=>{const p=path.resolve(d,'../../../port/v2/tools/creature-animation',n),b=fs.readFileSync(p);return{path:p,sha256:crypto.createHash('sha256').update(b).digest('hex')};});
fs.writeFileSync(d+'/capability-receipt.json',JSON.stringify({status:'REFUSED',minimumObservedNearLegs:5,contractNearLegSlots:4,fullObservedLegCount:null,fullObservedPairCount:null,sourceFiles:sources,recordProduced:false,masksProduced:false,bindingProduced:false},null,2)+'\n');
fs.writeFileSync(d+'/execution.json',JSON.stringify({id:'archetype-sprint-12-myriapod-01',noRetry:true,stages:[{name:'family-contract-capability',startedAt,endedAt:new Date().toISOString(),durationMs:performance.now()-start,exitCode:1,error}]},null,2)+'\n');
console.error(error);process.exitCode=1;
