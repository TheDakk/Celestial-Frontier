import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {POLICY,STANCES} from '../../port/v2/tools/s20-balance-contract.mjs';
const dir=import.meta.dirname,api=await import(pathToFileURL(dir+'/population-engine.mjs').href);
for(const dealt of [.62,.64,.66,.68,.7]) { const tuning={press:{dealt:1.4,taken:1.7},guard:{dealt:.65,taken:.585,openerBlunt:.25},evade:{dealt,dodge:.32}},phase={atFraction:.5,dealt:1.02,taken:.98};globalThis.__s4=tuning;globalThis.__s4phase=phase;
const stats={...api.battleStats(api.makeGenome(1234,'fauna',.5)),vit:50,fer:30,res:20,agi:25,ins:25,ab:{}};
const threats=POLICY.threats.map(([id,ab])=>{const wins=Object.fromEntries(STANCES.map(s=>[s,0]));for(let i=0;i<512;i++)for(const stance of STANCES){const p={mode:'auto',party:[{name:'training',genome:{seed:30000000+i*101},stats,stance}],defender:{name:id,genome:{seed:30000071+i*101},stats:{...stats,ab}}};wins[stance]+=api.runEncounterV1(p).outcome==='party'?1:0;}const ranked=STANCES.slice(1).sort((a,b)=>wins[b]-wins[a]);return{id,ab,right:ranked[0],wrong:ranked.at(-1),wins,pass:wins[ranked[0]]>wins.balanced&&wins[ranked.at(-1)]<wins.balanced};});
console.log(JSON.stringify({tuning, threats})); }
