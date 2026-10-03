#!/usr/bin/env node
/** Browser-free §20 balance diagnostics on exact committed source. Never writes to the measured source. */
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {rolldown} from 'rolldown';
import {POLICY,STANCES,policies,applyPolicy,choosePolicy,commandEnvelope,win,assessMeasurements} from './s20-balance-contract.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const i=a.indexOf('=');if(!a.startsWith('--')||i<0)throw Error('use --source-root=... --out=...');return[a.slice(2,i),a.slice(i+1)];}));
if(Object.keys(args).some(x=>!['source-root','out'].includes(x))||!args.out)throw Error('required --out (new directory)');
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
const entry='\0s20-entry';
const exports=`export * from '${v2}/packages/domain/combatcore/src/encounter.ts';
export {battleStats,runDuel} from '${v2}/packages/domain/combatcore/src/combatcore.verbatim.js';
export {projectGuardianPrimeEncounterV1,PRIME_SIGNATURE_IDS_V1} from '${v2}/packages/domain/combatcore/src/guardian-prime.ts';
export {COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,COMBAT_DEFEAT_WOUND_STEP_V1} from '${v2}/packages/domain/combatcore/src/combat-settlement.ts';
export {makeGenome} from '${v2}/packages/domain/genome/src/index.ts';
export {resolveCF1WorldAddress} from '${v2}/packages/scene/src/index.ts';
export {installCaptureHooks} from '${v2}/packages/domain/descriptors/src/index.ts';`;
write('entry-source.txt',exports);write('policy.json',POLICY);
const b=await rolldown({input:entry,platform:'node',plugins:[{name:'read-only-source',resolveId(id){if(id===entry)return id;},load(id){if(id===entry)return exports;},transform(code,id){
  if(id.startsWith(root+'/port/v2/')&&!id.includes('/node_modules/'))sourceHashes[path.relative(root,id)]=hash(fs.readFileSync(id));
}}]});
await b.write({dir:out,entryFileNames:'engine.mjs',format:'esm',sourcemap:true});await b.close();
const api=await import(pathToFileURL(path.join(out,'engine.mjs')).href);
api.installCaptureHooks();
const raw=api.runEncounterV1;
// Mirror the domain settlement's explicit lone-Balanced-Auto legacy dispatch, including its no-phase rule.
const run=(plan,decisions=[])=>raw(plan.party.length===1&&plan.party[0].stance==='balanced'&&plan.mode==='auto'&&decisions.length===0
  ?{...plan,defender:{...plan.defender,phase:false}}:plan,decisions);
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
const heats={easy:[.7],normal:[.5],guardian:[.3,.45,.6],titan:[.65,.8,.95]};
const fixture=(kind,index,base)=>{
 const seed=base+index*101;
 return {mode:'auto',party:heats[kind].map((heat,j)=>({name:`slot${j}`,genome:api.makeGenome(seed+j*17,'fauna',heat),stance:'balanced'})),
 defender:kind==='easy'||kind==='normal'?{name:kind,genome:api.makeGenome(seed+71,'fauna',kind==='easy'?.1:.5)}:
 {name:defenders[kind].defender.name,genome:defenders[kind].defender.battleGenome,phase:true}};
};
const report={schema:'cf-s20-balance/v1',sourceHead:head,policyHash:hash(JSON.stringify(POLICY)),expectedPolicyHash:hash(JSON.stringify(POLICY)),
 trainSeedBase:POLICY.seedBases.train,evaluateSeedBase:POLICY.seedBases.evaluate,trainCount:POLICY.train,evaluateCount:POLICY.evaluate,
 cohorts:[],threats:[],replayCases:0,replayMismatches:0,parityCases:0,parityMismatches:0,
 recovery:{defeatActiveMs:api.COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1,defeatWoundStep:api.COMBAT_DEFEAT_WOUND_STEP_V1},
 scope:{guardianWorlds:1,titanWorlds:1,region:0,partySize:3,command:'exact clairvoyant tree for the training-selected plan; upper bound, not human win rate',
 planning:'exhaustive 4 stances for wild; 6 orders × 4^3 stances for the same full party; one fixed policy learned on training, never chosen per evaluation outcome',
 threat:'isolated magnitude-III hook hypotheses; no binding to a shipped dossier inventory',campaignCertificate:false}};
for(const kind of Object.keys(heats)){
 const train=Array.from({length:POLICY.train},(_,i)=>fixture(kind,i,POLICY.seedBases.train));
 const evals=Array.from({length:POLICY.evaluate},(_,i)=>fixture(kind,i,POLICY.seedBases.evaluate));
 const candidates=policies(heats[kind].length),selected=choosePolicy(train,candidates,run);
 write(kind+'-training.json',{candidates,scores:selected.scores,selected:selected.selected,trainCorpusHash:hash(JSON.stringify(train)),evaluateCorpusHash:hash(JSON.stringify(evals))});
 const row={id:kind,selected:selected.selected,policies:candidates.length,trainWins:selected.trainWins,baselineWins:0,plannedWins:0,commandWins:0,phaseNodes:0,withdrawnTerminals:0,swapEdges:0,commandNodes:0,draws:0};
 const evidence=[];
 for(let i=0;i<evals.length;i++){
  const p=evals[i],plan=applyPolicy(p,selected.selected),baseline=run(p),r=run(plan);
  row.baselineWins+=win(baseline);row.plannedWins+=win(r);if(r.outcome==='draw')row.draws++;
  report.replayCases++;if(JSON.stringify(r)!==JSON.stringify(run(plan)))report.replayMismatches++;
  let command=null;
  if(p.party.length>1){command=commandEnvelope(run,plan);row.commandWins+=command.best;row.phaseNodes+=command.phaseNodes;row.withdrawnTerminals+=command.withdrawn;row.swapEdges+=command.swapEdges;row.commandNodes+=command.nodes;}
  else{row.commandWins+=win(r);const v1=api.runDuel(p.party[0],p.defender),leg=baseline.legs[0];report.parityCases++;
   const keys=['A','B','log','winner','hpA','hpB','maxA','maxB','turnA0'];if(JSON.stringify(Object.fromEntries(keys.map(k=>[k,leg[k]])))!==JSON.stringify(v1))report.parityMismatches++;}
  evidence.push({index:i,baseline:baseline.outcome,planned:r.outcome,transcriptHash:hash(JSON.stringify(r)),
   ...(command?{command:{...command,terminalDigestInput:undefined,terminalTreeHash:hash(JSON.stringify(command.terminalDigestInput))}}:{})});
 }
 row.planningGapPp=100*(row.plannedWins-row.baselineWins)/POLICY.evaluate;row.commandEdgePp=100*(row.commandWins-row.plannedWins)/POLICY.evaluate;
 report.cohorts.push(row);write(kind+'-evaluation.json',evidence);console.log(JSON.stringify(row));
}
// Isolate hook responses at declared fixed stats; these are mechanism probes, not generated population win rates.
for(const [id,ab,right,wrong] of POLICY.threats){
 const wins=Object.fromEntries(STANCES.map(s=>[s,0]));
 const baseStats={...api.battleStats(api.makeGenome(1234,'fauna',.5)),vit:50,fer:30,res:20,agi:25,ins:25,ab:{}};
 for(let i=0;i<POLICY.evaluate;i++)for(const stance of STANCES){
  const p={mode:'auto',party:[{name:'probe',genome:{seed:20000000+i*101},stats:baseStats,stance}],
   defender:{name:id,genome:{seed:20000071+i*101},stats:{...baseStats,ab}}};wins[stance]+=win(run(p));
 }
 report.threats.push({id,right,wrong,wins});
}
for(const [file,sha] of Object.entries(sourceHashes))if(hash(fs.readFileSync(path.join(root,file)))!==sha)throw Error('source changed: '+file);
if(git('rev-parse','HEAD')!==head||git('status','--porcelain','--','port/v2'))throw Error('source moved');
report.measurement=assessMeasurements(report);
// Dossier coverage is deliberately fail-closed: the production card has no registered threat→stance inventory yet.
report.status=report.measurement.status==='RED'?'RED':'INCOMPLETE';
report.openCoverage=['Bind all shipped dossier threats to fixed response cohorts before certification.','Broaden registered worlds/regions, ownership/equipment and partial parties before campaign-level claims.','Command bound currently covers each cohort training-selected plan, not every possible plan.'];
write('source-hashes.json',sourceHashes);write('report.json',report);
write('instrument-hashes.json',Object.fromEntries(['s20-balance.mjs','s20-balance-contract.mjs'].map(f=>[f,hash(fs.readFileSync(path.join(import.meta.dirname,f)))])));
console.log(JSON.stringify({status:report.status,findings:report.measurement.failures}));
process.exitCode=report.status==='PASS'?0:2;
