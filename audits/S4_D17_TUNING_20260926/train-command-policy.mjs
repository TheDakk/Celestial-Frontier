import fs from 'node:fs';import {pathToFileURL} from 'node:url';
import {applyPolicy,win} from '../../port/v2/tools/s20-balance-contract.mjs';
const dir=import.meta.dirname,api=await import(pathToFileURL(dir+'/population-engine.mjs').href);
const corpus=JSON.parse(fs.readFileSync(dir+'/fine-training-corpora.json')).corpora;
const configs=JSON.parse(fs.readFileSync(dir+'/fine-training-policy.json'));
const all=[];
function play(plan,policy){const decisions=[];let r=api.runEncounterV1({...plan,mode:'command'});
 while(r.status==='paused'){
  const b=r.pendingBreak;let choice='hold';
  if(b.options.includes('swap')&&b.nextIndex!==null){
   const next=api.battleStats(plan.party[b.nextIndex].genome),current=api.battleStats(plan.party[b.fighterIndex].genome);
   if(b.kind==='low-hp'&&b.defenderHp/b.defenderMax >= (b.fighterHp/b.fighterMax)*policy.lowRatio)choice='swap';
   if(b.kind==='phase'&&b.fighterHp/b.fighterMax<=policy.phaseHp&&next.fer/current.fer>=policy.nextFerRatio)choice='swap';
  }
  decisions.push(choice);if(decisions.length>16)throw Error('policy bounds');r=api.runEncounterV1({...plan,mode:'command'},decisions);
 }
 return win(r);
}
for(let index=0;index<configs.candidates.length;index++){
 globalThis.__s4=configs.candidates[index];globalThis.__s4phase=configs.phase;
 for(const kind of ['guardian','titan']){
  const choices=JSON.parse(fs.readFileSync(dir+`/fine-training-${index}-${kind}-choices.json`));
  const plans=corpus[kind].map((p,i)=>applyPolicy(p,choices[i]));
  const baseline=plans.reduce((n,p)=>n+win(api.runEncounterV1(p)),0),scores=[];
  for(const lowRatio of [.25,.5,1,1.5,2,3,4,8,1000])for(const phaseHp of [0,.2,.35,.5,.65,.8,1])for(const nextFerRatio of [0,.8,1.2,1.5]){
   const policy={lowRatio,phaseHp,nextFerRatio},wins=plans.reduce((n,p)=>n+play(p,policy),0);scores.push({policy,wins});
  }
  scores.sort((a,b)=>b.wins-a.wins);const row={index,kind,baseline,best:scores[0],edge:100*(scores[0].wins-baseline)/plans.length,scores};all.push(row);
  console.log(JSON.stringify({...row,scores:undefined}));fs.writeFileSync(dir+'/command-policy-training.json',JSON.stringify(all,null,2)+'\n');
 }
}
