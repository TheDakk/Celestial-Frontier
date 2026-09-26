// Training-only forward model. Choice sees immutable combat stats, never the actual fight seeds.
import fs from 'node:fs';import {pathToFileURL} from 'node:url';
import {policies,applyPolicy,win,commandEnvelope} from '../../port/v2/tools/s20-balance-contract.mjs';
const dir=import.meta.dirname,api=await import(pathToFileURL(dir+'/population-engine.mjs').href);api.installCaptureHooks();
const config={epoch:'training-08-expanded',source:'same exact encounter source as integrated 2fae1e73',count:512,seedBase:50000000,poolSize:50000,careFed:[0,10,20,40,60],
 partyBands:[[.60,.80],[.70,.90],[.80,1]],soloBand:[.9,1.1],forecastSeeds:16,
 planning:'best expected outcome on fixed independent forecast seeds with frozen actual stats; never sees the actual genome RNG seeds',
 command:'oracle upper bound retained separately; not a learned human-play minimum',
 candidates:[.64].flatMap(dealt=>[.6].map(taken=>({press:{dealt:1.4,taken:1.7},guard:{dealt:.65,taken,openerBlunt:.25},evade:{dealt,dodge:.32}}))),phase:{atFraction:.5,dealt:1.02,taken:.98}};
fs.writeFileSync(dir+'/expanded-training-policy.json',JSON.stringify(config,null,2)+'\n');
const pool=[];for(let i=0;i<config.poolSize;i++){const seed=config.seedBase+i,feed=config.careFed[i%config.careFed.length],g={...api.makeGenome(seed,'fauna',.5),fed:feed};pool.push({genome:g,power:api.battleStats(g).total});const a=api.guardianFor(seed);if(a){const genome={...a.genome,fed:feed};pool.push({genome,power:api.battleStats(genome).total});}}
const choose=(lo,hi,index,exclude=[])=>{const rows=pool.filter(x=>x.power>=lo&&x.power<=hi&&!exclude.includes(x.genome.seed));if(rows.length<3)throw Error('unpopulated readiness band');return rows[index%rows.length].genome;};
const encounters=JSON.parse(fs.readFileSync(dir+'/../S20_BALANCE_20260925/measured-04/registered-encounters.json'));
const corpora={};for(const kind of ['easy','normal','guardian','titan'])corpora[kind]=Array.from({length:config.count},(_,i)=>{
 const wild=kind==='easy'||kind==='normal',enemy=wild?choose(...(kind==='easy'?[180,220]:[250,350]),i*13):encounters[kind].defender.battleGenome,power=api.battleStats(enemy).total,used=[enemy.seed];
 const bands=wild?[kind==='easy'?[1.8,2.2]:[.9,1.1]]:config.partyBands;
 return {mode:'auto',defender:{name:kind,genome:enemy,phase:!wild},party:bands.map(([lo,hi],j)=>{const genome=choose(power*lo,power*hi,i*7+j*127,used);used.push(genome.seed);return {name:'slot'+j,genome,stance:'balanced'};})};
});
const solos={};for(const kind of ['guardian','titan']){const enemy=encounters[kind].defender.battleGenome,power=api.battleStats(enemy).total;solos[kind]=Array.from({length:config.count},(_,i)=>({mode:'auto',defender:{name:kind,genome:enemy,phase:true},party:[{name:'solo',genome:choose(power*.9,power*1.1,i*17,[enemy.seed]),stance:'balanced'}]}));}
fs.writeFileSync(dir+'/expanded-training-corpora.json',JSON.stringify({corpora,solos},null,2)+'\n');
const freezeStats=p=>({...p,defender:{...p.defender,stats:api.battleStats(p.defender.genome)},party:p.party.map(f=>({...f,stats:api.battleStats(f.genome)}))});
const forecast=p=>{
 let best=-1,choice=null;
 const frozen=freezeStats(p);
 for(const candidate of policies(p.party.length)){
  const planned=applyPolicy(frozen,candidate);let wins=0;
  for(let sample=0;sample<config.forecastSeeds;sample++){
   const seed=60000000+sample*101;
   wins+=win(api.runEncounterV1({...planned,defender:{...planned.defender,genome:{seed:seed+71}},party:planned.party.map((f,i)=>({...f,genome:{seed:seed+candidate.order[i]*17}}))}));
  }
  if(wins>best){best=wins;choice=candidate;}
 }
 return choice;
};
const results=[];globalThis.__s4phase=config.phase;
for(let index=0;index<config.candidates.length;index++){
 globalThis.__s4=config.candidates[index];const rows=[];
 for(const [kind,plans] of Object.entries(corpora)){
  let baseline=0,planned=0,command=0,phaseNodes=0;const choices=[];
  for(const p of plans){const choice=forecast(p),q=applyPolicy(p,choice);choices.push(choice);baseline+=win(api.runEncounterV1(p));planned+=win(api.runEncounterV1(q));
   if(p.party.length>1){const e=commandEnvelope(api.runEncounterV1,q);command+=e.best;phaseNodes+=e.phaseNodes;}else command+=win(api.runEncounterV1(q));}
  const r={kind,baseline,planned,command,gap:100*(planned-baseline)/config.count,oracleEdge:100*(command-planned)/config.count,phaseNodes};
  if(solos[kind]){let before=0,after=0;for(const p of solos[kind]){before+=api.runDuel(p.party[0],p.defender).winner==='A'?1:0;after+=win(api.runEncounterV1(p));}r.solo={before,after,delta:100*(after-before)/config.count};}
  rows.push(r);console.log(index,JSON.stringify(r));fs.writeFileSync(dir+`/expanded-training-${index}-${kind}-choices.json`,JSON.stringify(choices,null,2)+'\n');
 }
 results.push({index,tuning:globalThis.__s4,phase:globalThis.__s4phase,rows});fs.writeFileSync(dir+'/expanded-training-results.json',JSON.stringify(results,null,2)+'\n');
}
