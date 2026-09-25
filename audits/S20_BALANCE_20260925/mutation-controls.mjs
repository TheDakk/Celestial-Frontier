import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {POLICY,STANCES,commandEnvelope} from '../../port/v2/tools/s20-balance-contract.mjs';
const root=import.meta.dirname,source=fs.readFileSync(root+'/measured-04/engine.mjs','utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
const actual=await import(pathToFileURL(root+'/measured-04/engine.mjs').href);
const report=JSON.parse(fs.readFileSync(root+'/measured-04/report.json'));
const corpus=JSON.parse(fs.readFileSync(root+'/measured-04/guardian-corpus.json')).evaluate;
const policy=report.cohorts.find(r=>r.id==='guardian').selected;
const plan=p=>({...p,party:policy.order.map((j,i)=>({...p.party[j],stance:policy.stances[i]}))});
const results=[];
async function mutant(name,from,to,check){
 if(source.split(from).length!==2)throw Error('mutation match count: '+name);
 const mutated=source.replace(from,to),file=path.join(root,name+'.mjs');fs.writeFileSync(file,mutated);
 const api=await import(pathToFileURL(file).href);const result=check(api);
 results.push({name,original:hash(source),mutant:hash(mutated),...result});
 if(!result.killed)throw Error('surviving mutant '+name);
}
function stanceWitness(api){
 const s={...api.battleStats(api.makeGenome(1234,'fauna',.5)),vit:50,fer:30,res:20,agi:25,ins:25,ab:{}};
 let changed=0;
 for(let i=0;i<32;i++){
  const p={mode:'auto',party:[{name:'probe',genome:{seed:20000000+i*101},stats:s,stance:'balanced'}],defender:{name:'mend',genome:{seed:20000071+i*101},stats:{...s,ab:{regen:.048}}}};
  const baseline=JSON.stringify(api.runEncounterV1(p));
  for(const stance of STANCES.slice(1))if(JSON.stringify(api.runEncounterV1({...p,party:[{...p.party[0],stance}]}))!==baseline)changed++;
 }
 return changed;
}
const validChanged=stanceWitness(actual);if(!validChanged)throw Error('positive stance control vacuous');
await mutant('mutant-flat-stances','if (stance === "balanced") return stats;','if (true) return stats;',api=>({killed:stanceWitness(api)===0,validChanged,mutantChanged:stanceWitness(api)}));
let phaseFixture=null;
for(const p of corpus){const candidate=plan(p),r=commandEnvelope(actual.runEncounterV1,candidate);if(r.phaseNodes&&r.swapEdges){phaseFixture=candidate;break;}}
if(!phaseFixture)throw Error('positive phase control vacuous');
fs.writeFileSync(root+'/phase-control-fixture.json',JSON.stringify(phaseFixture,null,2)+'\n');
const positive=commandEnvelope(actual.runEncounterV1,phaseFixture);
await mutant('mutant-no-phase','const phaseEnabled = defender.phase === true;','const phaseEnabled = false;',api=>{
 const r=commandEnvelope(api.runEncounterV1,phaseFixture);return {killed:r.phaseNodes===0,validPhaseNodes:positive.phaseNodes,mutantPhaseNodes:r.phaseNodes};
});
const prefix=[];let offered=actual.runEncounterV1({...phaseFixture,mode:'command'},prefix);
if(offered.status!=='paused'||!offered.pendingBreak.options.includes('withdraw'))throw Error('withdraw control not offered');
const withdrawal=actual.runEncounterV1({...phaseFixture,mode:'command'},['withdraw']);
if(withdrawal.outcome!=='withdrawn')throw Error('positive withdrawal failed');
const badWin=r=>r.outcome==='party'||r.outcome==='withdrawn'?1:0;
results.push({name:'mutant-withdraw-scored-as-win',killed:badWin(withdrawal)!==0,actualOutcome:withdrawal.outcome,correctCredit:0,mutantCredit:badWin(withdrawal)});
fs.writeFileSync(root+'/mutation-results.json',JSON.stringify(results,null,2)+'\n');
