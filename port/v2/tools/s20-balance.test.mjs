import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {POLICY,policies,choosePolicy,commandEnvelope,win,assessMeasurements} from './s20-balance-contract.mjs';
const good=()=>({schema:'cf-s20-balance/v1',policyHash:createHash('sha256').update(JSON.stringify(POLICY)).digest('hex'),
 trainSeedBase:100000,evaluateSeedBase:10000000,trainCount:128,evaluateCount:512,
 cohorts:['easy','normal','guardian','titan'].map(id=>({id,baselineWins:200,plannedWins:200+({easy:20,normal:77,guardian:150,titan:150}[id]),
  commandWins:200+({easy:20,normal:77,guardian:170,titan:170}[id]),phaseNodes:1,withdrawnTerminals:1,swapEdges:1})),
 threats:POLICY.threats.map(([id,,right,wrong])=>({id,wins:{balanced:256,press:240,guard:240,evade:240,[right]:300,[wrong]:200}})),
 replayCases:512,replayMismatches:0,parityCases:512,parityMismatches:0});
test('positive complete measured-count control is accepted',()=>assert.equal(assessMeasurements(good()).status,'PASS'));
for(const [name,mutate] of [
 ['missing cohort',r=>r.cohorts.pop()],['missing threat',r=>r.threats.pop()],
 ['nonfinite',r=>r.cohorts[0].plannedWins=NaN],['empty corpus',r=>r.evaluateCount=0],
 ['overlap seeds',r=>r.evaluateSeedBase=r.trainSeedBase],['forged policy',r=>r.policyHash='a'.repeat(64)],
 ['too large easy gap',r=>r.cohorts[0].plannedWins=226],['too small normal gap',r=>r.cohorts[1].plannedWins=200],
 ['too large Command edge',r=>r.cohorts[2].commandWins=400],['omitted phase',r=>r.cohorts[2].phaseNodes=0],
 ['omitted Withdraw',r=>r.cohorts[3].withdrawnTerminals=0],['no swap exercised',r=>r.cohorts[3].swapEdges=0],
 ['flat stances',r=>r.threats.forEach(t=>Object.keys(t.wins).forEach(s=>t.wins[s]=256))],
 ['globally best press',r=>r.threats.forEach(t=>t.wins.press=512)],
 ['broken replay',r=>r.replayMismatches=1],['broken parity',r=>r.parityMismatches=1],
])test(`negative control: ${name}`,()=>{const r=good();mutate(r);assert.equal(assessMeasurements(r).status,'RED');});
test('plan enumeration is exactly all 384 order/stance combinations with stable ties',()=>{
 const p=policies(3);assert.equal(p.length,384);assert.equal(new Set(p.map(x=>JSON.stringify(x))).size,384);
 const plan={party:[{},{},{}]};const selected=choosePolicy([plan],p,()=>({status:'finished',outcome:'party'}));assert.deepEqual(selected.selected,p[0]);
});
test('a wrong-stance resolver changes selected policy; no evaluation input enters selection',()=>{
 const selected=choosePolicy([{party:[{}]}],policies(1),p=>({status:'finished',outcome:p.party[0].stance==='guard'?'party':'defender'}));
 assert.deepEqual(selected.selected,{order:[0],stances:['guard']});assert.deepEqual(selected.scores,[0,0,1,0]);
});
test('Command visits phase, next-fighter and Withdraw, including branches after finding a win',()=>{
 const visited=[];
 const fake=(p,d=[])=>{visited.push(d.join(','));if(p.mode==='auto')return {status:'finished',outcome:'defender'};
  if(!d.length)return {status:'paused',decisionsUsed:0,pendingBreak:{kind:'phase',options:['swap','hold','withdraw']}};
  if(d[0]==='withdraw'||d.at(-1)==='withdraw')return {status:'finished',outcome:'withdrawn'};
  if(d[0]==='swap')return {status:'finished',outcome:'party'};
  if(d.length===1)return {status:'paused',decisionsUsed:1,pendingBreak:{kind:'next-fighter',options:['hold','withdraw']}};
  return {status:'finished',outcome:'defender'};
 };
 const r=commandEnvelope(fake,{party:[{},{},{}]});assert.equal(r.best,1);assert.equal(r.terminals,4);assert.equal(r.withdrawn,2);assert.equal(r.phaseNodes,1);assert.equal(r.swapEdges,1);
 assert.ok(visited.includes('hold,withdraw'));assert.equal(win({status:'finished',outcome:'withdrawn'}),0);
});
test('search refuses a truncated tree which excludes the Auto win',()=>{
 assert.throws(()=>commandEnvelope(p=>({status:'finished',outcome:p.mode==='auto'?'party':'defender'}),{party:[{},{}]}),/omitted Auto/);
});
test('unbounded or unknown Break is an instrument failure, never a green truncated search',()=>{
 assert.throws(()=>commandEnvelope((p,d)=>({status:'paused',decisionsUsed:d.length,pendingBreak:{kind:'low-hp',options:['hold']}}),{party:[{}]}),/bound/);
 assert.throws(()=>commandEnvelope(()=>({status:'paused',decisionsUsed:0,pendingBreak:{kind:'unknown',options:['hold']}}),{party:[{}]}),/unknown Break/);
});
