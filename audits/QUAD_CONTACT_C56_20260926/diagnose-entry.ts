import fs from 'node:fs';
import {measureLayeredStanceReach} from '../../port/v2/apps/game/src/creature-layered-stance-reach.ts';
import {compileBodyCard} from '../../port/v2/apps/game/src/motion/body-card.ts';
const record=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
try {console.log(JSON.stringify({status:'PASS',measurement:measureLayeredStanceReach(record,{},.5,compileBodyCard(record,record.genome))}));}
catch(e){console.log(JSON.stringify({status:'REFUSED',error:String(e)}));}
