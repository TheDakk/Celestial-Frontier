import fs from 'node:fs';
import {compileBodyCard} from '../../port/v2/apps/game/src/motion/body-card.ts';
import {withPaintedContactSupports} from '../../port/v2/apps/game/src/motion/painted-supports.ts';
import {buildTimeline} from '../../port/v2/apps/game/src/motion/timeline.ts';
const b='audits/C203_NATIVE_HOLDS_20261004',fit=b+'/fox-islands-02/fit',r=JSON.parse(fs.readFileSync(fit+'/record.json','utf8')),binding=JSON.parse(fs.readFileSync(fit+'/binding.json','utf8')),card=withPaintedContactSupports(compileBodyCard(r,r.genome),r,binding),rows=[];
for(const seed of [5,5,6,6]){const start=performance.now(),timeline=buildTimeline(card,'approach',seed);rows.push({seed,ms:performance.now()-start,hash:timeline.hash,notes:timeline.notes});}
fs.writeFileSync(b+'/fast-profile-timing.json',JSON.stringify({scope:'Unthrottled Node diagnostic only; not native/performance qualification',rows},null,2)+'\n',{flag:'wx'});
