/** Observe exact output. A human-readable, source-bound visual note is required. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from '../../../port/v2/node_modules/sharp/dist/index.cjs';
import {paintMask} from '../../../port/v2/tools/anatomy-verify/auto-author.mjs';
import {countVisibleAnatomy} from '../../../port/v2/tools/anatomy-verify/limb-counter.mjs';
import {assessPatternObservation,patternRequirements} from '../../../port/v2/tools/painted-creature/pattern-observation.mjs';
import {observeFraming} from '../../C203_CREATURE_SUPPLY_B_20261004/framing.mjs';

const [packet,noteFile]=process.argv.slice(2);
if (!packet?.startsWith('audits/C243_ALLOUT_20261011/execution/batch')||!noteFile) throw Error('usage: observe-candidate.mjs packet source-bound-visual-note.json');
const read=p=>JSON.parse(fs.readFileSync(p));
const row=read(packet+'/pilot.json')[0],q=read(packet+'/request.json'),g=read(packet+'/generation.json');
const bytes=fs.readFileSync(packet+'/master.png'),sha=b=>createHash('sha256').update(b).digest('hex');
const masterSha256=sha(bytes),note=read(noteFile),source=read(packet+'/subject-source.json');
if (masterSha256!==g.masterSha256||sha(fs.readFileSync(packet+'/prompt.txt'))!==q.promptSha256||g.promptSha256!==q.promptSha256||g.outputModified!==false) throw Error('Exact generator provenance mismatch');
if (note.masterSha256!==masterSha256||note.name!==row.name||!note.observation?.trim()) throw Error('Missing or stale visual inspection');
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {mask,keyed}=paintMask(data,info.width,info.height),{label,bodyMask,...observed}=countVisibleAnatomy(mask,info.width,info.height);
const framing=observeFraming(mask,info.width,info.height);
const pattern=assessPatternObservation(source.species,bytes,note.pattern);
const dimensionsMatch=info.width===1254&&info.height===1254;
const evidence={id:row.id,name:row.name,masterSha256,width:info.width,height:info.height,dimensionsMatch,keyed,framing,observed,pattern:pattern.status,
  status:dimensionsMatch&&framing.status==='PASS_FRAMING_ONLY'&&['PASS','NOT_REQUIRED'].includes(pattern.status)?'ELIGIBLE_FOR_INTAKE':'REFUSE',
  scope:'Source observations only; no expected-count substitution, G1 admission, native result or visual acceptance'};
for (const [name,value] of [['visible-anatomy',evidence],['pattern-check',pattern],['visual-review',{...note,status:'DIAGNOSTIC_NOT_ADMITTED',requiredPatterns:patternRequirements(source.species)}]])
  fs.writeFileSync(packet+'/'+name+'.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id:row.id,status:evidence.status,width:info.width,height:info.height,framing,pattern:pattern.status,byClass:observed.byClass,groundContacts:observed.ground.length}));
