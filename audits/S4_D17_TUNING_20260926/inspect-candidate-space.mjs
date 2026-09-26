// Bounded training-only feasibility study. Product source is read, never edited.
import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {POLICY} from '../../port/v2/tools/s20-balance-contract.mjs';
const out=import.meta.dirname,src=fs.readFileSync(out+'/../S20_BALANCE_20260925/measured-04/engine.mjs','utf8');
const replacements=[['ENCOUNTER_STANCE_TUNING_V1.press.', 'globalThis.__s4.press.'],['ENCOUNTER_STANCE_TUNING_V1.guard.','globalThis.__s4.guard.'],['ENCOUNTER_STANCE_TUNING_V1.evade.','globalThis.__s4.evade.']];
let copy=src;for(const [a,b]of replacements){if(!copy.includes(a))throw Error('missing declared parameter');copy=copy.replaceAll(a,b);}
fs.writeFileSync(out+'/training-engine.mjs',copy);const api=await import(pathToFileURL(out+'/training-engine.mjs').href);
const samples=128,seedBase=30000000;
const stats={...api.battleStats(api.makeGenome(1234,'fauna',.5)),vit:50,fer:30,res:20,agi:25,ins:25,ab:{}};
const plans=POLICY.threats.map(([id,ab,right,wrong])=>({id,right,wrong,rows:Array.from({length:samples},(_,i)=>({mode:'auto',party:[{name:'training',genome:{seed:seedBase+i*101},stats,stance:'balanced'}],defender:{name:id,genome:{seed:seedBase+71+i*101},stats:{...stats,ab}}}))}));
const counts=(stance)=>plans.map(t=>t.rows.reduce((n,p)=>n+(api.runEncounterV1({...p,party:[{...p.party[0],stance}]}).outcome==='party'?1:0),0));
const baseline=counts('balanced');
const defaultTuning={press:{dealt:1.15,taken:1.10},guard:{dealt:.90,taken:.85,openerBlunt:.5},evade:{dealt:.90,dodge:.08}};
const ranges={press:{dealt:[1.1,1.2,1.3,1.4,1.5,1.6],taken:[1.1,1.25,1.4,1.55,1.7,1.85]},guard:{dealt:[.5,.6,.7,.8,.9],taken:[.5,.6,.7,.8,.9],openerBlunt:[0,.25,.5,.75]},evade:{dealt:[.6,.7,.8,.9,1],dodge:[.08,.16,.24,.32,.4]}};
const results=[];
for(const [stance,range] of Object.entries(ranges)){
 const keys=Object.keys(range);const configs=[];const enumerate=(i,c)=>{if(i===keys.length){configs.push(c);return;}for(const v of range[keys[i]])enumerate(i+1,{...c,[keys[i]]:v});};enumerate(0,{});
 for(const config of configs){globalThis.__s4={...defaultTuning,[stance]:config};const wins=counts(stance),failed=[];let relevant=0;
  plans.forEach((t,i)=>{if(t.right===stance){relevant++;if(wins[i]<=baseline[i])failed.push(t.id+':right');}if(t.wrong===stance){relevant++;if(wins[i]>=baseline[i])failed.push(t.id+':wrong');}});
  results.push({stance,config,wins,relevant,failed});
 }
 console.log(stance,JSON.stringify(results.filter(x=>x.stance===stance).sort((a,b)=>a.failed.length-b.failed.length)[0]));
 fs.writeFileSync(out+'/training-feasibility.json',JSON.stringify({scope:'training-only, isolated hooks; not a game certificate',samples,seedBase,engineSha256:createHash('sha256').update(src).digest('hex'),baseline,threats:plans.map(x=>x.id),ranges,results},null,2)+'\n');
}
