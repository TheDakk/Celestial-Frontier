import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {policies,applyPolicy,choosePolicy,commandEnvelope,win} from '../../port/v2/tools/s20-balance-contract.mjs';
const dir=import.meta.dirname;let source=fs.readFileSync(dir+'/training-engine.mjs','utf8');
for(const key of ['atFraction','dealt','taken']){const a='ENCOUNTER_GUARDIAN_PHASE_V1.'+key;if(!source.includes(a))throw Error('phase parameter absent');source=source.replaceAll(a,'globalThis.__s4phase.'+key);}
source+='\nexport {guardianFor};\n';fs.writeFileSync(dir+'/population-engine.mjs',source);
const api=await import(pathToFileURL(dir+'/population-engine.mjs').href);api.installCaptureHooks();
const policy={schema:'cf-s4-d17-training/v1',trainingSeed:40000000,poolSize:50000,count:128,
 guardianSlots:[[.6,.8],[.7,.9],[.8,1]],wildPower:{easy:[180,220],normal:[250,350]},wildRatio:{easy:[1.8,2.2],normal:[.9,1.1]},soloRatio:[.9,1.1],
 phases:[{atFraction:.5,dealt:1.02,taken:.98},{atFraction:.5,dealt:1.05,taken:.98},{atFraction:.5,dealt:1.08,taken:.96}],
 targets:{planning:[10,20],command:[5,10],soloV1Delta:[-5,5],readiness:[20,80]},
 scope:'Training only; captured Guardians are natural guardianFor genomes, no forged stats or outcome-selected corpus. Raw resolver phase always enabled for bosses.'};
fs.writeFileSync(dir+'/population-policy.json',JSON.stringify(policy,null,2)+'\n');
const pool=[];for(let i=0;i<policy.poolSize;i++){const seed=policy.trainingSeed+i,g=api.makeGenome(seed,'fauna',.5);pool.push({genome:g,power:api.battleStats(g).total,kind:'fauna'});const a=api.guardianFor(seed);if(a)pool.push({genome:a.genome,power:api.battleStats(a.genome).total,kind:'captured-guardian'});}
const encounters=JSON.parse(fs.readFileSync(dir+'/../S20_BALANCE_20260925/measured-04/registered-encounters.json'));
const choose=(min,max,index,banned=[])=>{const eligible=pool.filter(p=>p.power>=min&&p.power<=max&&!banned.includes(p.genome.seed));if(eligible.length<3)throw Error('empty readiness band');return eligible[index%eligible.length];};
const corpora={};
for(const kind of ['easy','normal','guardian','titan'])corpora[kind]=Array.from({length:policy.count},(_,i)=>{
 const wild=kind==='easy'||kind==='normal';const enemy=wild?choose(...policy.wildPower[kind],i*13).genome:encounters[kind].defender.battleGenome;
 const power=api.battleStats(enemy).total,used=[enemy.seed],bands=wild?[policy.wildRatio[kind]]:policy.guardianSlots;
 return {mode:'auto',defender:{name:kind,genome:enemy,phase:!wild},party:bands.map(([lo,hi],j)=>{const x=choose(power*lo,power*hi,i*7+j*127,used);used.push(x.genome.seed);return {name:'slot'+j,genome:x.genome,stance:'balanced'};})};
});
const solos={};for(const kind of ['guardian','titan']){const enemy=encounters[kind].defender.battleGenome,power=api.battleStats(enemy).total;solos[kind]=Array.from({length:policy.count},(_,i)=>({mode:'auto',defender:{name:kind,genome:enemy,phase:true},party:[{name:'solo',genome:choose(power*.9,power*1.1,i*17,[enemy.seed]).genome,stance:'balanced'}]}));}
fs.writeFileSync(dir+'/training-corpora.json',JSON.stringify({corpora,solos},null,2)+'\n');
const candidates=JSON.parse(fs.readFileSync(dir+'/shortlist-02.json')).candidates,results=[];
for(let index=0;index<candidates.length;index++)for(const phase of policy.phases){
 const c=candidates[index];globalThis.__s4={press:c.p,guard:c.g,evade:c.e};globalThis.__s4phase=phase;
 const rows=[];
 for(const kind of Object.keys(corpora)){
  const plans=corpora[kind],selected=choosePolicy(plans,policies(plans[0].party.length),api.runEncounterV1);
  const baseline=plans.reduce((n,p)=>n+win(api.runEncounterV1(p)),0);let command=selected.trainWins,phaseNodes=0;
  if(plans[0].party.length>1){command=0;for(const p of plans){const e=commandEnvelope(api.runEncounterV1,applyPolicy(p,selected.selected));command+=e.best;phaseNodes+=e.phaseNodes;}}
  const r={kind,baseline,planned:selected.trainWins,command,selected:selected.selected,gap:100*(selected.trainWins-baseline)/policy.count,edge:100*(command-selected.trainWins)/policy.count,phaseNodes};
  if(solos[kind]){let before=0,after=0;for(const p of solos[kind]){before+=api.runDuel(p.party[0],p.defender).winner==='A'?1:0;after+=win(api.runEncounterV1(p));}r.solo={before,after,delta:100*(after-before)/policy.count};}
  rows.push(r);
 }
 const failures=[];for(const r of rows){if(r.kind==='easy'){if(r.gap<0||r.gap>=5||r.baseline<.9*policy.count)failures.push('easy');continue;}
  if(r.gap<10||r.gap>20)failures.push(r.kind+':gap');if(r.baseline<.2*policy.count||r.baseline>.8*policy.count||r.planned<.2*policy.count||r.planned>.8*policy.count)failures.push(r.kind+':readiness');
  if(r.solo){if(r.edge<5||r.edge>10)failures.push(r.kind+':command');if(Math.abs(r.solo.delta)>5)failures.push(r.kind+':solo');}}
 const result={index,tuning:globalThis.__s4,phase,rows,failures};results.push(result);console.log(JSON.stringify(result));fs.writeFileSync(dir+'/population-training-results.json',JSON.stringify(results,null,2)+'\n');
}
