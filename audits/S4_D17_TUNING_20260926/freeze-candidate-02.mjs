import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {POLICY,STANCES} from '../../port/v2/tools/s20-balance-contract.mjs';
const dir=import.meta.dirname,api=await import(pathToFileURL(dir+'/population-engine.mjs').href);
const tuning={press:{dealt:1.7,taken:1.7},guard:{dealt:.65,taken:.6,openerBlunt:.25},evade:{dealt:.64,dodge:.32}},phase={atFraction:.5,dealt:1.02,taken:.98};globalThis.__s4=tuning;globalThis.__s4phase=phase;
const stats={...api.battleStats(api.makeGenome(1234,'fauna',.5)),vit:50,fer:30,res:20,agi:25,ins:25,ab:{}};
const threats=POLICY.threats.map(([id,ab])=>{const wins=Object.fromEntries(STANCES.map(s=>[s,0]));for(let i=0;i<512;i++)for(const stance of STANCES){const p={mode:'auto',party:[{name:'training',genome:{seed:30000000+i*101},stats,stance}],defender:{name:id,genome:{seed:30000071+i*101},stats:{...stats,ab}}};wins[stance]+=api.runEncounterV1(p).outcome==='party'?1:0;}const ranked=STANCES.slice(1).sort((a,b)=>wins[b]-wins[a]);return{id,ab,right:ranked[0],wrong:ranked.at(-1),wins,pass:wins[ranked[0]]>wins.balanced&&wins[ranked.at(-1)]<wins.balanced};});
const selected={schema:'cf-s4-d17-candidate/v1',tuning,phase,recoveryActiveMs:600000,recoveryRationale:'Keep existing10active minutes; equalfallen/swapped, no addedwound. Win-rate simulations supply no evidence to change the economy duration.',
 commandPolicies:{guardian:{lowRatio:1000,phaseHp:.5,nextFerRatio:1.2},titan:{lowRatio:1000,phaseHp:0,nextFerRatio:0}},threats,
 targets:{easyPlanning:[0,5],otherPlanning:[10,20],commandMinimum:5,soloV1AbsoluteDelta:5,partyAutoMinimumWinPercent:20},
 policyCorrection:'Nick specifies >=5pp Command edge; old <=5 and provisional <=10 maximum are not the new minimum-only contract. Originaltraining reports remain intact. No historical gate is rebound.',
 heldOut:{seedBase:70000000,count:512,hookSeedBase:80000000,forecastSeedBase:60000000,forecastSeeds:16,careFed:[0,10,20,40,60],partyBands:[[.6,.8],[.7,.9],[.8,1]],soloBand:[.9,1.1]},
 scope:'Fixed benchmark; held-out outcomes not yet read. Solo Titan baseline weakness must be reported separately. No campaign/dossier UI certification.'};
fs.writeFileSync(dir+'/candidate-02.json',JSON.stringify(selected,null,2)+'\n');console.log(threats.map(x=>({id:x.id,right:x.right,wrong:x.wrong,wins:x.wins,pass:x.pass})));if(threats.some(x=>!x.pass))process.exitCode=2;
