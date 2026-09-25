import fs from 'node:fs';import path from 'node:path';
import {compileBodyCard,buildTimeline,sampleTimeline,actionsFor} from '../../../port/v2/apps/game/src/motion/index.ts';
import {buildActionTimeline} from '../../../port/v2/apps/game/src/motion/timeline.ts';
import {createFamilyContactSolver,observedContactSupports} from '../../../port/v2/apps/game/src/creature-rig-contact.ts';
import {familyContractForRecord,familyContactChains} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',out=process.argv[2];if(!out||fs.existsSync(out))throw Error('New output required');
const rows=[];
for(const fit of ['12-gull/fit-03','15-goose/fit-02','16-heron/fit-01','17-sparrow/fit-01']){const r=JSON.parse(fs.readFileSync(path.join(root,'audits/ART_BATTLE_FOCUS_20260925',fit,'record.json'),'utf8')),card=compileBodyCard(r,r.genome),action=actionsFor(card.template.id,card.anatomy).faint,original=buildActionTimeline(card,action,card.identity.seed),after=buildTimeline(card,'faint',card.identity.seed);rows.push({fit,unchanged:JSON.stringify(original)===JSON.stringify(after),notes:after.notes.filter(n=>n.startsWith('grounded-bird:'))});}
fs.writeFileSync(out,JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify(rows));
