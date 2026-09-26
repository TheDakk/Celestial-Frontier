#!/usr/bin/env node
/** One frozen D17 candidate on clean signed source, with held-out seeds. */
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {execFileSync} from 'node:child_process';import {rolldown} from 'rolldown';
import {createHash} from 'node:crypto';
import {STANCES,applyPolicy,win,commandEnvelope} from './s20-balance-contract.mjs';
import {planFromForecast,playCommand,assessProduction} from './s4-production-contract.mjs';
const hash=x=>createHash('sha256').update(Buffer.isBuffer(x)||typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(!a.startsWith('--')||i<0)throw Error('use --source-root=... --out=...');return[a.slice(2,i),a.slice(i+1)];}));
if(Object.keys(args).some(x=>!['source-root','out','candidate','purpose'].includes(x))||!args.out||!args.candidate)throw Error('required --out (new directory)');
const purpose=args.purpose??'evaluation';if(!['training','evaluation'].includes(purpose))throw Error('purpose');
const candidatePath=path.resolve(args.candidate);
const epoch=JSON.parse(fs.readFileSync(new URL('../../../audits/S4_PRODUCTION_EPOCH_20260926/epoch.json',import.meta.url)));
const config={...(purpose==='training'?epoch.training:epoch.evaluation),...epoch,forecastSeedBase:epoch.forecast.seedBase,forecastSeeds:epoch.forecast.count};
const candidateBytes=fs.readFileSync(candidatePath);
const root=fs.realpathSync(path.resolve(args['source-root']??path.join(import.meta.dirname,'../../..')));
const out=path.resolve(args.out),v2=path.join(root,'port/v2');
if(out===root || out.startsWith(root+path.sep)&&root!==path.resolve(import.meta.dirname,'../../..'))throw Error('cannot write measured other lane');
if(fs.existsSync(out))throw Error('output exists; no unchanged retry');
const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD');
if(git('log','-1','--format=%G?')!=='G')throw Error('source HEAD must have a good signature');
if(purpose==='evaluation'&&git('status','--porcelain','--','port/v2'))throw Error('source port/v2 must be clean and committed');
fs.mkdirSync(out,{recursive:true});
const write=(f,x)=>fs.writeFileSync(path.join(out,f),typeof x==='string'?x:JSON.stringify(x,null,2)+'\n');
const sourceHashes={};
const candidate=JSON.parse(candidateBytes);
if(purpose==='evaluation'&&(!candidatePath.startsWith(root+path.sep)||git('status','--porcelain','--',candidatePath)||!git('ls-files','--',candidatePath)))throw Error('candidate must be committed in measured source');
const entry='\0s4-d17-entry';
const exports=`export * from '${v2}/packages/domain/combatcore/src/encounter.ts';
export {battleStats,runDuel} from '${v2}/packages/domain/combatcore/src/combatcore.verbatim.js';
export {projectGuardianPrimeEncounterV1,PRIME_SIGNATURE_IDS_V1} from '${v2}/packages/domain/combatcore/src/guardian-prime.ts';
export {planCombatPartySettlementV1,COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,COMBAT_DEFEAT_WOUND_STEP_V1} from '${v2}/packages/domain/combatcore/src/combat-settlement.ts';
export {guardianFor} from '${v2}/packages/domain/genome/src/genome.verbatim.js';
export {makeGenome} from '${v2}/packages/domain/genome/src/index.ts';
export {resolveCF1WorldAddress} from '${v2}/packages/scene/src/index.ts';
export {installCaptureHooks} from '${v2}/packages/domain/descriptors/src/index.ts';`;
write('entry-source.txt',exports);write('candidate.json',candidate);
const b=await rolldown({input:entry,platform:'node',plugins:[{name:'read-only-source',resolveId(id){if(id===entry)return id;},load(id){if(id===entry)return exports;},transform(code,id){
  if(id.startsWith(root+'/port/v2/')&&!id.includes('/node_modules/'))sourceHashes[path.relative(root,id)]=hash(fs.readFileSync(id));
  if(purpose==='training'&&id.endsWith('/combatcore/src/encounter.ts')){
    const a=/export const ENCOUNTER_STANCE_TUNING_V1 = Object.freeze\(\{[\s\S]*?\n\}\);/g;
    const b=/export const ENCOUNTER_GUARDIAN_PHASE_V1 = Object.freeze\(\{[^\n]+\}\);/g;
    if([...code.matchAll(a)].length!==1||[...code.matchAll(b)].length!==1)throw Error('training constant substitution owner');
    return {code:code.replace(a,'export const ENCOUNTER_STANCE_TUNING_V1 = Object.freeze('+JSON.stringify(candidate.tuning)+');').replace(b,'export const ENCOUNTER_GUARDIAN_PHASE_V1 = Object.freeze('+JSON.stringify(candidate.phase)+');'),map:null};
  }
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
if(config.seedBase!==(purpose==='training'?110000000:90000000)||config.count!==(purpose==='training'?256:1024))throw Error('epoch authority');
if(JSON.stringify(config.careFed)!=='[0,10,20,40,60]'||JSON.stringify(config.partyBands)!=='[[0.6,0.8],[0.7,0.9],[0.8,1]]'||JSON.stringify(config.soloBand)!=='[0.9,1.1]')throw Error('fixed readiness authority');
const pool=[];
for(let i=0;i<config.poolSize;i++){
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
 let encounter=defenders[kind];
 if(wild){const world=api.resolveCF1WorldAddress({galaxy:{seed:1594395733,x:-5501.81,y:-11753.64},star:{seed:4077594722,x:-271.54,y:-67.36},planet:{seed:488332735}});if(!world.ok)throw Error('wild world');encounter=api.projectGuardianPrimeEncounterV1({world:world.address,descriptor:{worldType:'rocky'},regionIndex:0,faunaRoster:[{speciesId:'native',genome:enemy}],claimedSignatureIds:[],conquered:false});if(encounter?.defender.kind!=='fauna')throw Error('wild route');}
 return{encounter,mode:'auto',defender:{name:encounter.defender.name,genome:encounter.defender.battleGenome,phase:!wild},party:bands.map(([lo,hi],j)=>{const genome=choose(power*lo,power*hi,solo?i*17:i*7+j*127,used);used.push(genome.seed);return{name:'slot'+j,genome,stance:'balanced'};})};
}
const report={schema:'cf-s4-production-evaluation/v1',purpose,epochHash:hash(epoch),sourceHead:head,candidateHash:hash(candidate),count:config.count,seedBase:config.seedBase,hookSeedBase:config.hookSeedBase,forecastSeedBase:config.forecastSeedBase,productionCases:0,productionMismatches:0,phaseDispatchCases:0,
 cohorts:[],threats:[],replayCases:0,replayMismatches:0,parityCases:0,parityMismatches:0,
 scope:{campaignCertificate:false,registeredGuardianWorlds:1,registeredTitanWorlds:1,region:0,partySizes:[1,3],planning:'independent 16-seed forecast with actual public stats; fixed tie rule',command:'fixed learned break policy; oracle upper bound separate',dispatch:'production settlement planner'},
 recovery:{defeatActiveMs:api.COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,defeatWoundStep:api.COMBAT_DEFEAT_WOUND_STEP_V1}};
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
function production(p,expected,decisions=[]){
 const result=api.planCombatPartySettlementV1({battleId:'s4-'+report.productionCases,receiptOrdinal:21,encounter:p.encounter,worldTier:4,mode:p.mode,decisions,
 party:p.party.map(f=>({stance:f.stance,champion:{kind:'owned-fauna',creatureId:'s4-'+f.genome.seed,name:f.name,genome:f.genome,legacyBredLineage:true}})),
 authority:{worldConquered:false,claimedPrimeSignatureIds:[],lossXp:{kind:'known-target',awardedTarget:0},activePlayMs:5000}});
 report.productionCases++;
 if(result.status!=='planned')throw Error('production refusal '+JSON.stringify(result));
 const leg=expected.legs.at(-1), keys=['A','B','log','winner','hpA','hpB','maxA','maxB','turnA0'];
 const same=hash(canonical(result.transcript))===hash(canonical(Object.fromEntries(keys.map(k=>[k,leg[k]]))));
 const expectedOutcome=expected.outcome==='party'?'champion-win':expected.outcome==='draw'?'draw':'defender-win';
 if(!same||result.outcome!==expectedOutcome)report.productionMismatches++;
 if(p.defender.phase&&result.party)report.phaseDispatchCases++;
 return {won:result.outcome==='champion-win'?1:0,transcriptHash:hash(result.transcript),outcome:result.outcome};
}
for(const kind of ['easy','normal','guardian','titan']){
 const rows=[],row={id:kind,baselineWins:0,plannedWins:0,commandWins:0,oracleWins:0,phaseNodes:0,withdrawnTerminals:0,swapEdges:0};
 for(let i=0;i<config.count;i++){
  const p=fixture(kind,i),choice=planFromForecast(api,p,config.forecastSeeds,config.forecastSeedBase),q=applyPolicy(p,choice),baseline=run(p),planned=run(q);
  const productionBaseline=production(p,baseline),productionPlanned=production(q,planned);
  row.baselineWins+=productionBaseline.won;row.plannedWins+=productionPlanned.won;
  report.replayCases++;if(JSON.stringify(planned)!==JSON.stringify(run(q)))report.replayMismatches++;
  let command=null,oracle=null;
  if(p.party.length>1){command=playCommand(api,q,candidate.commandPolicies[kind]);oracle=commandEnvelope(run,q);
   command.production=production({...q,mode:'command'},command.result,command.decisions);row.commandWins+=command.production.won;row.oracleWins+=oracle.best;row.phaseNodes+=oracle.phaseNodes;row.withdrawnTerminals+=oracle.withdrawn;row.swapEdges+=oracle.swapEdges;
  }else{row.commandWins+=win(planned);row.oracleWins+=win(planned);}
  rows.push({plan:p,choice,baseline:baseline.outcome,planned:planned.outcome,productionBaseline,productionPlanned,transcriptHash:hash(planned),
   ...(command?{command:{outcome:command.result.outcome,production:command.production,decisions:command.decisions,transcriptHash:hash(command.result)},oracle:{best:oracle.best,treeHash:hash(oracle.terminalDigestInput)}}:{})});
 }
 if(['guardian','titan'].includes(kind)){
  row.solo={v1Wins:0,phaseWins:0};const solos=[];
  for(let i=0;i<config.count;i++){const p=fixture(kind,i,true),v1=api.runDuel(p.party[0],p.defender),phased=run(p),off=run({...p,defender:{...p.defender,phase:false}});
   row.solo.v1Wins+=v1.winner==='A'?1:0;row.solo.phaseWins+=production(p,phased).won;report.parityCases++;
   const keys=['A','B','log','winner','hpA','hpB','maxA','maxB','turnA0'];if(JSON.stringify(Object.fromEntries(keys.map(k=>[k,off.legs[0][k]])))!==JSON.stringify(v1))report.parityMismatches++;
   solos.push({plan:p,v1:v1.winner,phased:phased.outcome,phaseOffHash:hash(off)});
  }write(kind+'-solo.json',solos);
 }
 row.planningGapPp=100*(row.plannedWins-row.baselineWins)/config.count;row.commandEdgePp=100*(row.commandWins-row.plannedWins)/config.count;
 report.cohorts.push(row);write(kind+'-evaluation.json',rows);console.log(JSON.stringify(row));write('report-partial.json',report);
}
for(const t of candidate.threats){
 const stats={...api.battleStats(api.makeGenome(1234,'fauna',.5)),vit:50,fer:30,res:20,agi:25,ins:25,ab:{}},wins=Object.fromEntries(STANCES.map(s=>[s,0]));
 for(let i=0;i<config.count;i++)for(const stance of STANCES)wins[stance]+=win(run({mode:'auto',party:[{name:'probe',genome:{seed:config.hookSeedBase+i*101},stats,stance}],defender:{name:t.id,genome:{seed:config.hookSeedBase+71+i*101},stats:{...stats,ab:t.ab}}}));
 report.threats.push({id:t.id,wins});
}
for(const [f,sha]of Object.entries(sourceHashes))if(hash(fs.readFileSync(path.join(root,f)))!==sha)throw Error('source changed '+f);
if(git('rev-parse','HEAD')!==head||(purpose==='evaluation'&&git('status','--porcelain','--','port/v2')))throw Error('source moved');
if(!fs.readFileSync(candidatePath).equals(candidateBytes))throw Error('candidate moved');
report.measurement=assessProduction(report,candidate,epoch);report.status=report.measurement.status==='PASS'?'SCOPED_PASS':'RED';
write('source-hashes.json',sourceHashes);write('report.json',report);write('instrument-hashes.json',Object.fromEntries(['s4-production.mjs','s4-production-contract.mjs','s20-balance-contract.mjs'].map(f=>[f,hash(fs.readFileSync(path.join(import.meta.dirname,f)))])));
console.log(JSON.stringify({status:report.status,findings:report.measurement.failures}));process.exitCode=report.measurement.status==='PASS'?0:2;
