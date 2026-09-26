#!/usr/bin/env node
/** One frozen D17 candidate on clean signed source, with held-out seeds. */
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import {rolldown} from 'rolldown';
import {createHash} from 'node:crypto';
import {STANCES,applyPolicy,win,commandEnvelope} from './s20-balance-contract.mjs';
import {planFromForecast,playCommand,assessD17} from './s4-d17-contract.mjs';
const hash=x=>createHash('sha256').update(Buffer.isBuffer(x)||typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(!a.startsWith('--')||i<0)throw Error('use --source-root=... --out=...');return[a.slice(2,i),a.slice(i+1)];}));
if(Object.keys(args).some(x=>!['source-root','out','candidate'].includes(x))||!args.out||!args.candidate)throw Error('required --out (new directory)');
const candidatePath=path.resolve(args.candidate);
const candidateBytes=fs.readFileSync(candidatePath);
const root=fs.realpathSync(path.resolve(args['source-root']??path.join(import.meta.dirname,'../../..')));
const out=path.resolve(args.out),v2=path.join(root,'port/v2');
if(out===root || out.startsWith(root+path.sep)&&root!==path.resolve(import.meta.dirname,'../../..'))throw Error('cannot write measured other lane');
if(fs.existsSync(out))throw Error('output exists; no unchanged retry');
const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
if(git('log','-1','--format=%G?')!=='G')throw Error('source HEAD must have a good signature');
if(git('status','--porcelain','--','port/v2'))throw Error('source port/v2 must be clean and committed');
fs.mkdirSync(out,{recursive:true});
const write=(f,x)=>fs.writeFileSync(path.join(out,f),typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');
const sourceHashes={};
const candidate=JSON.parse(candidateBytes);
if(!candidatePath.startsWith(root+path.sep)||git('status','--porcelain','--',candidatePath)||!git('ls-files','--',candidatePath))throw Error('candidate must be committed in measured source');
const entry='\0s4-d17-entry';
const exports=`export * from '${v2}/packages/domain/combatcore/src/encounter.ts';
export {battleStats,runDuel} from '${v2}/packages/domain/combatcore/src/combatcore.verbatim.js';
export {projectGuardianPrimeEncounterV1,PRIME_SIGNATURE_IDS_V1} from '${v2}/packages/domain/combatcore/src/guardian-prime.ts';
export {COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,COMBAT_DEFEAT_WOUND_STEP_V1} from '${v2}/packages/domain/combatcore/src/combat-settlement.ts';
export {guardianFor} from '${v2}/packages/domain/genome/src/genome.verbatim.js';
export {makeGenome} from '${v2}/packages/domain/genome/src/index.ts';
export {resolveCF1WorldAddress} from '${v2}/packages/scene/src/index.ts';
export {installCaptureHooks} from '${v2}/packages/domain/descriptors/src/index.ts';`;
write('entry-source.txt',exports);write('candidate.json',candidate);
const b=await rolldown({input:entry,platform:'node',plugins:[{name:'read-only-source',resolveId(id){if(id===entry)return id;},load(id){if(id===entry)return exports;},transform(code,id){
  if(id.startsWith(root+'/port/v2/')&&!id.includes('/node_modules/'))sourceHashes[path.relative(root,id)]=hash(fs.readFileSync(id));
}}]});
await b.write({dir:out,entryFileNames:'engine.mjs',format:'esm',sourcemap:true});await b.close();
const api=await import(pathToFileURL(path.join(out,'engine.mjs')).href);
api.installCaptureHooks();
const run=api.runEncounterV1;
if (JSON.stringify(api.ENCOUNTER_STANCE_TUNING_V1)!==JSON.stringify(candidate.tuning) || JSON.stringify(api.ENCOUNTER_GUARDIAN_PHASE_V1)!==JSON.stringify(candidate.phase)) throw Error('committed constants do not match frozen candidate');
const worlds={
 guardian:{galaxy:{seed:999,x:90,y:-60},star:{seed:3824583279,x:-820.9489546869881,y:-620.6852987115271},planet:{seed:2456455053}},
 titan:{galaxy:{seed:999,x:90,y:-60},star:{seed:1704147477,x:-816.5224888999946,y:-572.5457991384901},planet:{seed:3351403606}},
};
const defenders={};
for(const kind of ['guardian','titan']){
 const w=api.resolveCF1WorldAddress(worlds[kind]);if(!w.ok)throw Error('world fixture did not resolve');
 const e=api.projectGuardianPrimeEncounterV1({world:w.address,descriptor:{worldType:kind==='guardian'?'airless':'rocky'},regionIndex:0,faunaRoster:[{speciesId:'native',genome:api.makeGenome(1,'fauna',.5)}],claimedSignatureIds:[],conquered:false});
 if(e?.defender.kind!==kind)throw Error('fixture kind changed');
 defenders[kind]=e;
}
write('registered-encounters.json',defenders);
const config=candidate.heldOut;
if(config.seedBase!==70000000||config.count!==512||config.hookSeedBase!==80000000||config.forecastSeedBase!==60000000||config.forecastSeeds!==16)throw Error('fixed evaluation authority');
if(JSON.stringify(config.careFed)!=='[0,10,20,40,60]'||JSON.stringify(config.partyBands)!=='[[0.6,0.8],[0.7,0.9],[0.8,1]]'||JSON.stringify(config.soloBand)!=='[0.9,1.1]')throw Error('fixed readiness authority');
const pool=[];
for(let i=0;i<50000;i++){
 const seed=config.seedBase+i,feed=config.careFed[i%config.careFed.length];
 const g={...api.makeGenome(seed,'fauna',.5),fed:feed};pool.push({genome:g,power:api.battleStats(g).total});
 const a=api.guardianFor(seed);if(a){const genome={...a.genome,fed:feed};pool.push({genome,power:api.battleStats(genome).total});}
}
const eligible=new Map();
function choose(lo,hi,index,exclude=[]){
 const key=lo+':'+hi;if(!eligible.has(key))eligible.set(key,pool.filter(x=>x.power>=lo&&x.power<=hi));
 const rows=eligible.get(key).filter(x=>!exclude.includes(x.genome.seed));if(rows.length<3)throw Error('unpopulated band');return rows[index%rows.length].genome;
}
function fixture(kind,i,solo=false){
 const wild=kind==='easy'||kind==='normal';
 const enemy=wild?choose(...(kind==='easy'?[180,220]:[250,350]),i*13):defenders[kind].defender.battleGenome;
 const power=api.battleStats(enemy).total,used=[enemy.seed];
 const bands=solo?[config.soloBand]:wild?[kind==='easy'?[1.8,2.2]:[.9,1.1]]:config.partyBands;
 return{mode:'auto',defender:{name:kind,genome:enemy,phase:!wild},party:bands.map(([lo,hi],j)=>{const genome=choose(power*lo,power*hi,solo?i*17:i*7+j*127,used);used.push(genome.seed);return{name:'slot'+j,genome,stance:'balanced'};})};
}
const report={schema:'cf-s4-d17-evaluation/v1',sourceHead:head,candidateHash:hash(candidate),count:512,seedBase:70000000,hookSeedBase:80000000,forecastSeedBase:60000000,
 cohorts:[],threats:[],replayCases:0,replayMismatches:0,parityCases:0,parityMismatches:0,
 scope:{campaignCertificate:false,registeredGuardianWorlds:1,registeredTitanWorlds:1,region:0,partySizes:[1,3],planning:'independent 16-seed forecast with actual public stats; fixed tie rule',command:'fixed learned break policy; oracle upper bound separate',dispatch:'raw engine; production settlement/card admission is separately required'},
 recovery:{defeatActiveMs:api.COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,defeatWoundStep:api.COMBAT_DEFEAT_WOUND_STEP_V1}};
for(const kind of ['easy','normal','guardian','titan']){
 const rows=[],row={id:kind,baselineWins:0,plannedWins:0,commandWins:0,oracleWins:0,phaseNodes:0,withdrawnTerminals:0,swapEdges:0};
 for(let i=0;i<512;i++){
  const p=fixture(kind,i),choice=planFromForecast(api,p),q=applyPolicy(p,choice),baseline=run(p),planned=run(q);
  row.baselineWins+=win(baseline);row.plannedWins+=win(planned);
  report.replayCases++;if(JSON.stringify(planned)!==JSON.stringify(run(q)))report.replayMismatches++;
  let command=null,oracle=null;
  if(p.party.length>1){command=playCommand(api,q,candidate.commandPolicies[kind]);oracle=commandEnvelope(run,q);
   row.commandWins+=win(command.result);row.oracleWins+=oracle.best;row.phaseNodes+=oracle.phaseNodes;row.withdrawnTerminals+=oracle.withdrawn;row.swapEdges+=oracle.swapEdges;
  }else{row.commandWins+=win(planned);row.oracleWins+=win(planned);}
  rows.push({plan:p,choice,baseline:baseline.outcome,planned:planned.outcome,transcriptHash:hash(planned),
   ...(command?{command:{outcome:command.result.outcome,decisions:command.decisions,transcriptHash:hash(command.result)},oracle:{best:oracle.best,treeHash:hash(oracle.terminalDigestInput)}}:{})});
 }
 if(['guardian','titan'].includes(kind)){
  row.solo={v1Wins:0,phaseWins:0};const solos=[];
  for(let i=0;i<512;i++){const p=fixture(kind,i,true),v1=api.runDuel(p.party[0],p.defender),phased=run(p),off=run({...p,defender:{...p.defender,phase:false}});
   row.solo.v1Wins+=v1.winner==='A'?1:0;row.solo.phaseWins+=win(phased);report.parityCases++;
   const keys=['A','B','log','winner','hpA','hpB','maxA','maxB','turnA0'];if(JSON.stringify(Object.fromEntries(keys.map(k=>[k,off.legs[0][k]])))!==JSON.stringify(v1))report.parityMismatches++;
   solos.push({plan:p,v1:v1.winner,phased:phased.outcome,phaseOffHash:hash(off)});
  }write(kind+'-solo.json',solos);
 }
 row.planningGapPp=100*(row.plannedWins-row.baselineWins)/512;row.commandEdgePp=100*(row.commandWins-row.plannedWins)/512;
 report.cohorts.push(row);write(kind+'-evaluation.json',rows);console.log(JSON.stringify(row));write('report-partial.json',report);
}
for(const t of candidate.threats){
 const stats={...api.battleStats(api.makeGenome(1234,'fauna',.5)),vit:50,fer:30,res:20,agi:25,ins:25,ab:{}},wins=Object.fromEntries(STANCES.map(s=>[s,0]));
 for(let i=0;i<512;i++)for(const stance of STANCES)wins[stance]+=win(run({mode:'auto',party:[{name:'probe',genome:{seed:80000000+i*101},stats,stance}],defender:{name:t.id,genome:{seed:80000071+i*101},stats:{...stats,ab:t.ab}}}));
 report.threats.push({id:t.id,wins});
}
for(const [f,sha]of Object.entries(sourceHashes))if(hash(fs.readFileSync(path.join(root,f)))!==sha)throw Error('source changed '+f);
if(git('rev-parse','HEAD')!==head||git('status','--porcelain','--','port/v2'))throw Error('source moved');
if(!fs.readFileSync(candidatePath).equals(candidateBytes))throw Error('candidate moved');
report.measurement=assessD17(report,candidate);report.status=report.measurement.status==='PASS'?'SCOPED_PASS':'RED';
write('source-hashes.json',sourceHashes);write('report.json',report);write('instrument-hashes.json',Object.fromEntries(['s4-d17.mjs','s4-d17-contract.mjs','s20-balance-contract.mjs'].map(f=>[f,hash(fs.readFileSync(path.join(import.meta.dirname,f)))])));
console.log(JSON.stringify({status:report.status,findings:report.measurement.failures}));process.exitCode=report.measurement.status==='PASS'?0:2;
