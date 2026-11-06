import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessD17,hash,planFromForecast,playCommand} from './s4-d17-contract.mjs';
import {POLICY} from './s20-balance-contract.mjs';
const candidate={threats:POLICY.threats.map(([id,ab],i)=>({id,ab,right:i===0?'press':'guard',wrong:i===0?'guard':'evade'}))};
const green=()=>({schema:'cf-s4-d17-evaluation/v1',count:512,candidateHash:hash(candidate),seedBase:70000000,hookSeedBase:80000000,forecastSeedBase:60000000,
 cohorts:['easy','normal','guardian','titan'].map(id=>({id,baselineWins:id==='easy'?500:200,plannedWins:id==='easy'?500:280,commandWins:id==='easy'?500:320,oracleWins:330,phaseNodes:10,withdrawnTerminals:10,swapEdges:10,solo:{v1Wins:200,phaseWins:190}})),
 threats:candidate.threats.map(t=>({id:t.id,wins:{balanced:100,press:100,guard:100,evade:100,[t.right]:150,[t.wrong]:50}})),
 replayCases:2048,parityCases:1024,replayMismatches:0,parityMismatches:0});
test('declared D17 outcomes admit a complete positive control',()=>assert.equal(assessD17(green(),candidate).status,'PASS'));
for(const [name,mutate] of Object.entries({
 'wrong version':r=>r.schema='cf-s20-balance/v1',
 'wrong count':r=>r.count=128,
 'candidate rebound':r=>r.candidateHash='0'.repeat(64),
 'training reused':r=>r.seedBase=50000000,
 'missing cohort':r=>r.cohorts.pop(),
 'duplicate cohort':r=>r.cohorts.push(r.cohorts[0]),
 'fractional wins':r=>r.cohorts[1].baselineWins=.5,
 'normal too small':r=>r.cohorts[1].plannedWins=201,
 'titan too large':r=>r.cohorts[3].plannedWins=400,
 'near-total defeats':r=>Object.assign(r.cohorts[2],{baselineWins:1,plannedWins:80,commandWins:120}),
 'oracle cannot stand for playable Command':r=>{r.cohorts[2].commandWins=280;r.cohorts[2].oracleWins=500;},
 'missing phase':r=>r.cohorts[2].phaseNodes=0,
 'missing withdrawal':r=>r.cohorts[2].withdrawnTerminals=0,
 'missing swap':r=>r.cohorts[2].swapEdges=0,
 'solo drifts':r=>r.cohorts[3].solo.phaseWins=100,
 'drop threat':r=>r.threats.pop(),
 'wrong stance beats right':r=>r.threats[0].wins.press=90,
 'right stance ties':r=>r.threats[0].wins.press=100,
 'parity mismatch':r=>r.parityMismatches=1,
 'empty replay':r=>r.replayCases=0,
}))test(name,()=>{const r=green();mutate(r);assert.equal(assessD17(r,candidate).status,'RED');});
test('changing actual fight seeds cannot change forecast policy when public stats are unchanged',()=>{
 const inputs=[];
 const api={battleStats:g=>({fer:g.fer,vit:100}),runEncounterV1:p=>{inputs.push(p);return{status:'finished',outcome:p.party[0].stance==='guard'?'party':'defender'};}};
 const plan={party:[{genome:{seed:70000000,fer:50}}],defender:{genome:{seed:70000071,fer:70}}};
 const a=planFromForecast(api,plan,2);plan.party[0].genome.seed=123;plan.defender.genome.seed=456;
 assert.deepEqual(planFromForecast(api,plan,2),a);assert.equal(a.stances[0],'guard');
 assert.ok(inputs.every(p=>p.party[0].genome.seed>=60000000&&p.party[0].genome.seed<60001000));
 assert.ok(inputs.every(p=>p.party[0].stats.fer===50&&p.defender.stats.fer===70));
});
test('Command policy reads the offered break and preserves its actual terminal outcome',()=>{
 const api={battleStats:()=>({fer:30}),runEncounterV1:(_p,ds=[])=>ds.length?{status:'finished',outcome:'defender'}:{status:'paused',pendingBreak:{kind:'phase',options:['hold','withdraw'],nextIndex:null}}};
 const p=playCommand(api,{party:[]},{lowRatio:1000,phaseHp:0,nextFerRatio:0});assert.deepEqual(p.decisions,['hold']);assert.equal(p.result.outcome,'defender');
});

test('a candidate cannot remove or redefine an inconvenient threat',()=>{for(const mutate of [c=>c.threats.pop(),c=>c.threats[0].ab={},c=>c.threats[0].right='balanced']){const c=structuredClone(candidate);mutate(c);const r=green();r.candidateHash=hash(c);r.threats=r.threats.filter(t=>c.threats.some(x=>x.id===t.id));assert.equal(assessD17(r,c).status,'RED');}});
