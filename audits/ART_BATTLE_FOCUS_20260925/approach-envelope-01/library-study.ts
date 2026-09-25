import fs from 'node:fs';import path from 'node:path';
import {CARD_ARCHETYPES} from '../../../port/v2/tools/morph/build-card-masters.mjs';
import {measureLayeredStanceReach} from '../../../port/v2/apps/game/src/creature-layered-stance-reach.js';
import {observedContactSupports} from '../../../port/v2/apps/game/src/creature-rig-contact.js';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',rows=[];
for(const a of CARD_ARCHETYPES){const record=JSON.parse(fs.readFileSync(path.join(root,a.dir,'record.json'),'utf8')),binding=JSON.parse(fs.readFileSync(path.join(root,a.dir,'binding.json'),'utf8')),supports=record.geometry.contactPads?observedContactSupports(record,binding):{};const start=performance.now();try{const m=measureLayeredStanceReach(record,supports,.5);rows.push({name:a.earthName,fit:a.dir,status:'PASS',measurement:m,loadMs:performance.now()-start});}catch(e){rows.push({name:a.earthName,fit:a.dir,status:'REFUSED',error:String(e),loadMs:performance.now()-start});}console.log(JSON.stringify(rows.at(-1)));}
fs.writeFileSync(process.argv[2],JSON.stringify({schema:'cf.layered-reach-library/v1',scope:'Contact-only admission survey, not a native skin or timing certificate',rows},null,2)+'\n',{flag:'wx'});
