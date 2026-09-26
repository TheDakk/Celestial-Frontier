import fs from 'node:fs';import path from 'node:path';
import {measureLayeredStanceReach as before} from './baseline-layered-reach.js';
import {measureLayeredStanceReach as after} from './candidate-layered-reach.js';
import {observedContactSupports} from '../../port/v2/apps/game/src/creature-rig-contact.js';
const root=process.cwd(),old=JSON.parse(fs.readFileSync('audits/ART_BATTLE_FOCUS_20260925/approach-envelope-01/library-inventory.json','utf8')).archetypes;
const rows=[];
const extra=[['Impala','interior-root-repair-05/impala-fit-02'],['Cougar','cougar-repair-03/fit-03'],['Rat','29-rat/fit-03'],['Heron','16-heron/fit-01'],['Honeybee','28-honeybee/fit-02']].map(([earthName,dir])=>({earthName,dir:'audits/ART_BATTLE_FOCUS_20260925/'+dir,observed:true}));
for(const a of [...old,...extra]){
 const record=JSON.parse(fs.readFileSync(path.join(root,a.dir,'record.json'),'utf8')),binding=JSON.parse(fs.readFileSync(path.join(root,a.dir,'binding.json'),'utf8')),supports=record.geometry.contactPads||a.observed?observedContactSupports(record,binding):{};
 const row:any={name:a.earthName,fit:a.dir,supports:record.geometry.contactPads||a.observed?'observed':'rest'};
 for(const [key,fn] of [['before',before],['after',after]] as const){const start=performance.now();try{row[key]={status:'PASS',value:fn(record,supports,.5),ms:performance.now()-start};}catch(e){row[key]={status:'REFUSED',error:String(e),ms:performance.now()-start};}}
 row.equalAdmission=row.before.value?.admitted===row.after.value?.admitted;rows.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync('audits/C22_LAYERED_REACH_20260925/comparison-01.json',JSON.stringify({scope:'One host diagnostic per implementation/fit; same record/support and source dependencies. Not native phone timing.',rows},null,2)+'\n',{flag:'wx'});
