import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {rolldown} from '../../port/v2/node_modules/rolldown/dist/index.mjs';
const root='/Users/nick/Projects/celestial-frontier-anthropic-mac',out=import.meta.dirname;
const base=fs.readFileSync(out+'/measured-04/entry-source.txt','utf8');
const entry='\0forecast-review',sources={};
const bundle=await rolldown({input:entry,platform:'node',plugins:[{name:'actual-source',resolveId(id){if(id===entry)return id;},load(id){if(id===entry)return base+`\nexport {projectCombatPlanForecastV1} from '${root}/port/v2/apps/game/src/combat-card.ts';`;},transform(code,id){if(id.startsWith(root+'/port/v2/')&&!id.includes('/node_modules/'))sources[id.slice(root.length+1)]=createHash('sha256').update(fs.readFileSync(id)).digest('hex');}}]});
await bundle.write({file:out+'/forecast-engine.mjs',format:'esm'});await bundle.close();
const a=await import(pathToFileURL(out+'/forecast-engine.mjs').href);a.installCaptureHooks();
const world=a.resolveCF1WorldAddress({galaxy:{seed:999,x:90,y:-60},star:{seed:3824583279,x:-820.9489546869881,y:-620.6852987115271},planet:{seed:2456455053}}).address;
const encounter=regionIndex=>a.projectGuardianPrimeEncounterV1({world,descriptor:{worldType:'airless'},regionIndex,faunaRoster:[{speciesId:'native',genome:a.makeGenome(1,'fauna',.5)}],claimedSignatureIds:[],conquered:false});
const first=encounter(0),next=encounter(1);
const stats=a.battleStats(first.defender.battleGenome);
const members=[{champion:{kind:'player',explorerId:'review',name:'review',genomeSeed:1234,currentHp:stats.vit*3,stats},stance:'press'}];
const before=a.projectCombatPlanForecastV1(members,first),cachedNext=a.projectCombatPlanForecastV1(members,next);
const fresh=await import(pathToFileURL(out+'/forecast-engine.mjs').href+'?fresh');
const uncachedNext=fresh.projectCombatPlanForecastV1(members,next);
const result={sourceHead:'4093ebca66d80d4ef3bd73d19dbe82c330264d6b',defenderSeed:first.defender.battleGenome.seed,
 region0Power:stats.total,region1Power:a.battleStats(next.defender.battleGenome).total,before,cachedNext,uncachedNext,
 reproduced:JSON.stringify(cachedNext)!==JSON.stringify(uncachedNext)};
fs.writeFileSync(out+'/forecast-review.json',JSON.stringify(result,null,2)+'\n');fs.writeFileSync(out+'/forecast-source-hashes.json',JSON.stringify(sources,null,2)+'\n');
if(!result.reproduced)throw Error('no reproduction; do not claim a finding');
console.log(JSON.stringify(result));
