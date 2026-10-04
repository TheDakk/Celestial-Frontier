import fs from 'node:fs';import path from 'node:path';
import {measureLayeredStanceReach as after} from './candidate-02-layered-reach.js';
import {observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.js';
const root=process.cwd(),old=JSON.parse(fs.readFileSync('audits/ART_BATTLE_FOCUS_20260925/approach-envelope-01/library-inventory.json','utf8')).archetypes;
const rows=[];
const extra=[['Impala','interior-root-repair-05/impala-fit-02'],['Cougar','cougar-repair-03/fit-03'],['Rat','29-rat/fit-03'],['Heron','16-heron/fit-01'],['Honeybee','28-honeybee/fit-02']].map(([earthName,dir])=>({earthName,dir:'audits/ART_BATTLE_FOCUS_20260925/'+dir,observed:true}));
for(const a of [...old,...extra]){
 const record=JSON.parse(fs.readFileSync(path.join(root,a.dir,'record.json'),'utf8')),binding=JSON.parse(fs.readFileSync(path.join(root,a.dir,'binding.json'),'utf8')),supports=record.geometry.contactPads||a.observed?observedContactSupports(record,binding):{};
 const row:any={name:a.earthName,fit:a.dir,supports:record.geometry.contactPads||a.observed?'observed':'rest'};
 for(const [key,fn] of [['after',after]] as const){const start=performance.now();try{row[key]={status:'PASS',value:fn(record,supports,.5),ms:performance.now()-start};}catch(e){row[key]={status:'REFUSED',error:String(e),ms:performance.now()-start};}}
 const prior=JSON.parse(fs.readFileSync('audits/C22_LAYERED_REACH_20260925/comparison-01.json','utf8')).rows.find((r:any)=>r.fit===a.dir);row.before=prior.before;row.equalAdmission=row.before.value?.admitted===row.after.value?.admitted;rows.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync('audits/C22_LAYERED_REACH_20260925/comparison-02.json',JSON.stringify({scope:'Changed prefix-only verification candidate; original baseline timings reused from comparison01. One diagnostic run, not native phone timing.',rows},null,2)+'\n',{flag:'wx'});
