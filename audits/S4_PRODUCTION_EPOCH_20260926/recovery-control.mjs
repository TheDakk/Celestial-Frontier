import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {recoveryReceipt,hash} from '../../port/v2/tools/s4-production-contract.mjs';
const dir=import.meta.dirname, original=dir+'/train13-01/engine.mjs', source=fs.readFileSync(original,'utf8');
const fixtures=JSON.parse(fs.readFileSync(dir+'/train13-01/guardian-evaluation.json'));
async function measure(file){
 const api=await import(pathToFileURL(file).href);api.installCaptureHooks();
 const world=api.resolveCF1WorldAddress({galaxy:{seed:999,x:90,y:-60},star:{seed:3824583279,x:-820.9489546869881,y:-620.6852987115271},planet:{seed:2456455053}});assert(world.ok);
 const encounter=api.projectGuardianPrimeEncounterV1({world:world.address,descriptor:{worldType:'airless'},regionIndex:0,faunaRoster:[{speciesId:'native',genome:api.makeGenome(1,'fauna',.5)}],claimedSignatureIds:[],conquered:false});
 const total={cases:0,mismatches:0,fallen:0,swapped:0};
 for(const row of fixtures){
  const p=row.plan, expected=api.runEncounterV1(p);
  const result=api.planCombatPartySettlementV1({battleId:'recovery-control-'+total.cases,receiptOrdinal:21,encounter,worldTier:4,mode:p.mode,
   party:p.party.map(f=>({stance:f.stance,champion:{kind:'owned-fauna',creatureId:'s4-'+f.genome.seed,name:f.name,genome:f.genome,legacyBredLineage:true}})),
   authority:{worldConquered:false,claimedPrimeSignatureIds:[],lossXp:{kind:'known-target',awardedTarget:0},activePlayMs:5000}});
  assert.equal(result.status,'planned');
  const receipt=recoveryReceipt(result,expected,p,5000);for(const k of Object.keys(total))total[k]+=receipt[k];
 }
 return total;
}
const positive=await measure(original);assert.equal(positive.mismatches,0);assert(positive.fallen>0&&positive.swapped>0);
const mutants=[];
for(const [name,needle,replacement] of [
 ['duration','const COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 = 6e5;','const COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 = 600001;'],
 ['wound','hurtAfter: Math.min(.85, Math.max(before, before + 0))','hurtAfter: Math.min(.85, Math.max(before, before + .01))']
]){
 assert.equal(source.split(needle).length,2,name+' exact owner');
 const mutant=source.replace(needle,replacement), file=dir+'/recovery-'+name+'-mutant.mjs';
 fs.writeFileSync(file,mutant,{flag:'wx'});const result=await measure(file);assert(result.mismatches>0);mutants.push({name,sourceHash:hash(mutant),...result});
}
const restored=await measure(original);assert.equal(restored.mismatches,0);
const report={status:'PASS',scope:'retained candidate13 training fixtures only; no evaluation seeds read',sourceHash:hash(source),positive,mutants,restored};
fs.writeFileSync(dir+'/recovery-control.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
