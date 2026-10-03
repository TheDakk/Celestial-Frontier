/** §20 instrument policy. This is a diagnostic contract, not permission to retune a failing game. */
import {createHash} from 'node:crypto';
export const STANCES = Object.freeze(['balanced', 'press', 'guard', 'evade']);
export const POLICY = Object.freeze({schema:'cf-s20-balance-policy/v1', train:128, evaluate:512,
  seedBases:{train:100000, evaluate:10000000}, poolSize:50000, commandMarginPp:5,
  wildDefenderPower:{easy:[180,220],normal:[250,350]},
  powerRatios:{easy:[1.8,2.2],normal:[.9,1.1],partySlots:[[.45,.60],[.50,.65],[.55,.70]]},
  gaps:{easy:[0,5], normal:[10,20], guardian:[25,40], titan:[25,40]},
  // Magnitude III values from the verbatim archetype matrix (m=3). Authored hypotheses, not fitted answers.
  threats:[
    ['smite',{dmg:1.255},'guard','press'], ['aegis',{taken:.842},'press','guard'],
    ['dot',{burn:.037},'press','evade'], ['fury',{ramp:.0506},'press','guard'],
    ['ambush',{first:2.05},'guard','press'], ['eye',{critB:.304},'guard','press'],
    ['veil',{dodge:.166},'press','guard'], ['mend',{regen:.048},'press','guard'],
    ['echo',{dbl:.188},'evade','press'], ['thirst',{drink:true,critB:.124},'press','guard'],
    ['thorns',{thorns:.155},'guard','press'], ['rend',{shred:.102},'press','guard'],
    ['reck',{execB:.55},'guard','press'], ['bulwark',{cap:.235},'evade','press'],
    ['shock',{stun:.167},'evade','press'], ['roulette',{gambit:.55},'evade','press'],
    ['enrage',{enrage:.31},'press','guard'],
  ],
});

export function policies(size) {
  if(size!==1 && size!==3) throw Error('unsupported fixture party size');
  const orders=size===1?[[0]]:[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  return orders.flatMap(order=>Array.from({length:4**size},(_,code)=>({order,
    stances:order.map((_,slot)=>STANCES[Math.floor(code/(4**slot))%4])})));
}
export function applyPolicy(plan,policy,mode='auto') {
  return {...plan,mode,party:policy.order.map((index,i)=>({...plan.party[index],stance:policy.stances[i]}))};
}
export function win(result) {
  if(result.status!=='finished' || !['party','defender','draw','withdrawn'].includes(result.outcome)) throw Error('invalid terminal result');
  return result.outcome==='party'?1:0;
}
/** Exhaust the actual offered tree; no early winning exit, so phase/Withdraw branches remain measured. */
export function commandEnvelope(run,plan) {
  let nodes=0,terminals=0,withdrawn=0,phaseNodes=0,swapEdges=0,autoWins=0;
  let best=0,bestDecisions=[],terminalDigestInput=[];
  const walk=decisions=>{
    if(++nodes>20000 || decisions.length>16) throw Error('Command tree exhausted instrument bound');
    const r=run({...plan,mode:'command'},decisions);
    if(r.status==='finished') {
      terminals++;const w=win(r);if(r.outcome==='withdrawn')withdrawn++;
      terminalDigestInput.push([decisions,r.outcome]);
      if(w>best){best=w;bestDecisions=decisions;}
      return;
    }
    if(r.status!=='paused' || r.decisionsUsed!==decisions.length)throw Error('invalid decision prefix');
    const b=r.pendingBreak;
    if(!['low-hp','phase','next-fighter'].includes(b.kind) || !Array.isArray(b.options)
      || b.options.length===0 || new Set(b.options).size!==b.options.length
      || b.options.some(x=>!['hold','swap','withdraw'].includes(x)))throw Error('unknown Break');
    if(b.kind==='phase')phaseNodes++;
    for(const choice of b.options){if(choice==='swap')swapEdges++;walk([...decisions,choice]);}
  };
  walk([]);
  autoWins=win(run({...plan,mode:'auto'}));
  // With a party of three, Auto's sequence MUST be inside Command's tree.
  if(plan.party.length>1 && best<autoWins)throw Error('Command search omitted Auto path');
  return {best,bestDecisions,nodes,terminals,withdrawn,phaseNodes,swapEdges,autoWins,terminalDigestInput};
}
export function choosePolicy(trainPlans,candidates,run) {
  if(!trainPlans.length || !candidates.length)throw Error('empty training corpus');
  let best=-1,selected=null;
  const scores=candidates.map(policy=>{
    const wins=trainPlans.reduce((n,p)=>n+win(run(applyPolicy(p,policy))),0);
    if(wins>best){best=wins;selected=policy;} // fixed first tie; never inspect evaluation here
    return wins;
  });
  return {selected,trainWins:best,scores};
}
export function assessMeasurements(report) {
  const failures=[];
  const fail=x=>failures.push(x);
  const count=(x,n)=>Number.isSafeInteger(x)&&x>=0&&x<=n;
  if(report.schema!=='cf-s20-balance/v1')fail('schema');
  if(report.policyHash!==createHash('sha256').update(JSON.stringify(POLICY)).digest('hex'))fail('policy authority');
  if(report.trainSeedBase!==POLICY.seedBases.train || report.evaluateSeedBase!==POLICY.seedBases.evaluate)fail('disjoint seed authority');
  if(report.trainCount!==POLICY.train || report.evaluateCount!==POLICY.evaluate)fail('corpus counts');
  const cohorts=report.cohorts??[];
  if(cohorts.map(x=>x.id).sort().join(',')!=='easy,guardian,normal,titan')fail('cohort inventory');
  for(const r of cohorts){
    const n=report.evaluateCount;
    if(![r.baselineWins,r.plannedWins,r.commandWins].every(x=>count(x,n))){fail(`${r.id}: invalid counts`);continue;}
    const gap=100*(r.plannedWins-r.baselineWins)/n, target=POLICY.gaps[r.id];
    if(!target || gap<target[0] || (r.id==='easy'?gap>=target[1]:gap>target[1]))fail(`${r.id}: planning gap ${gap} pp`);
    if(r.id==='guardian'||r.id==='titan'){
      const edge=100*(r.commandWins-r.plannedWins)/n;
      if(edge<0 || edge>POLICY.commandMarginPp)fail(`${r.id}: Command edge ${edge} pp`);
      if(!(r.phaseNodes>0&&r.withdrawnTerminals>0&&r.swapEdges>0))fail(`${r.id}: phase/Withdraw/swap coverage`);
    }
  }
  const threats=report.threats??[];
  if(threats.map(x=>x.id).sort().join(',')!==POLICY.threats.map(x=>x[0]).sort().join(','))fail('threat inventory');
  for(const [id,,right,wrong] of POLICY.threats){
    const r=threats.find(x=>x.id===id);
    if(!r || !STANCES.every(s=>count(r.wins?.[s],report.evaluateCount))){fail(`${id}: invalid stance counts`);continue;}
    if(!(r.wins[right]>r.wins.balanced && r.wins[wrong]<r.wins.balanced))fail(`${id}: right/wrong trade-off`);
  }
  for(const stance of STANCES.slice(1)){
    if(threats.length && threats.every(r=>STANCES.every(s=>r.wins?.[stance]>=r.wins?.[s])))fail(`${stance}: globally best`);
  }
  if(report.replayMismatches!==0 || report.parityMismatches!==0 || !(report.replayCases>0&&report.parityCases>0))fail('replay/parity');
  return {status:failures.length?'RED':'PASS',failures};
}
