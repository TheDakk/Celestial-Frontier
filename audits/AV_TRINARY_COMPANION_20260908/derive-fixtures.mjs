import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {galaxyProfile,starsInCell,systemFor} from '../../port/v2/packages/domain/worldgen/src/index.ts';
const dir='audits/AV_TRINARY_COMPANION_20260908',galaxy={seed:999,x:90,y:-60},profile=galaxyProfile(999),selected={};let visited=0;
outer:for(let cx=-5;cx<=5;cx++)for(let cy=-5;cy<=5;cy++)for(const star of starsInCell(999,profile,cx,cy).stars){
 visited++;const sys=systemFor(star.seed);if(!sys.binary||sys.planets.length===0)continue;const kind=sys.trinary?'trinary':'binary';if(selected[kind])continue;
 selected[kind]={galaxy,star:{seed:star.seed,x:star.x,y:star.y},cell:{x:cx,y:cy},system:{kind:sys.kind,starR:sys.starR,starCol:sys.starCol,binary:sys.binary,trinary:sys.trinary??null,planets:sys.planets.length}};if(selected.trinary&&selected.binary)break outer;
}
assert(selected.trinary&&selected.binary,'No bounded canonical companion fixtures found');
selected.sol={galaxy,star:{seed:424242,x:560,y:170},system:{binary:null,trinary:null}};
const sources={};for(const file of ['port/v2/packages/domain/worldgen/src/worldgen.verbatim.js','port/v2/packages/domain/starcatalog/src/index.ts','port/v2/packages/domain/rand/src/index.ts'])sources[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={schema:'cf-trinary-fixtures/v1',visited,cellRange:[-5,5],sources,fixtures:selected};fs.writeFileSync(dir+'/fixtures.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
