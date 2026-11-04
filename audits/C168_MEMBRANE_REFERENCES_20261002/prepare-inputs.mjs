import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='audits/C168_MEMBRANE_REFERENCES_20261002',source='audits/G2_C163_FAMILY_ORIGINALS_20261002';
const sha=b=>createHash('sha256').update(b).digest('hex');
const prior=source+'/24-vampire-bat/prompt.txt';
let prompt=fs.readFileSync(prior,'utf8');
const pattern=/A shallow side view in calm flight,[\s\S]*?every species\./g;
assert.equal([...prompt.matchAll(pattern)].length,2);
const pose='A natural grounded four-point stance with folded wings, shallow side view, head facing RIGHT. This is a Vampire Bat walking anatomy reference: two hind feet and the two real long thumb/wrist contact structures are visibly separate and rest on the same invisible horizontal support line. The wing IS the forelimb: two folded membranous wings total and two hind legs total, never extra arms or hands. Keep both folded wing roots, elbows, wrists, thumb claws and overlapping folded membrane edges traceable with plausible connected anatomy. Offset the far limbs horizontally just enough to separate them without changing the level support plane. The lower edge of each folded membrane stays above its own support thumb. Show the real small tail-free rear body; do not add an invented long tail. Both actual ears are separately visible. The flat pig-like nose pad has NO upright leaf, the short muzzle has no protruding fantasy fangs. No flight pose, no standing human torso, no scenery, no ground paint or cast shadow. Required anatomy is a request, not proof of visible paint.';
prompt=prompt.replace(pattern,pose);
prompt='POSE PRIORITY: one Vampire Bat in a low natural standing pose with FOLDED wings, two visible hind feet and two visible thumb/wrist support structures on the same invisible level. Head RIGHT. No spread flight pose.\n\n'+prompt;
for(const [id,original,copyMaster]of[['standing-vampire','24-vampire-bat',false],['spread-bat','22-bat',true]]){
 const dest=base+'/'+id;assert(!fs.existsSync(dest));fs.mkdirSync(dest,{recursive:true});
 for(const f of ['subject-source.json',...(copyMaster?['master.png','prompt.txt']:[])])fs.copyFileSync(source+'/'+original+'/'+f,dest+'/'+f,fs.constants.COPYFILE_EXCL);
 if(!copyMaster)fs.writeFileSync(dest+'/prompt.txt',prompt,{flag:'wx'});
 fs.writeFileSync(dest+'/source-provenance.json',JSON.stringify({schema:'cf.c168-membrane-source/v1',sourcePacket:source+'/'+original,mode:copyMaster?'immutable independent C163 original':'new built-in imagegen original pending; same canonical species card',copied:copyMaster?['master.png','prompt.txt','subject-source.json'].map(f=>({file:f,sha256:sha(fs.readFileSync(dest+'/'+f))})):['subject-source.json'].map(f=>({file:f,sha256:sha(fs.readFileSync(dest+'/'+f))})),promptSha256:sha(fs.readFileSync(dest+'/prompt.txt')),priorPromptSha256:sha(fs.readFileSync(source+'/'+original+'/prompt.txt')),styleReference:'audits/MIDGAME_ART_DIRECTION_20260908/01-discovery-atlas.png',styleReferenceSha256:'c53add2993caba39b6dc12dc75d5d767be86896a7c41cfaa6c94f356e8d92a62',qualityAccepted:false,nativeAcceptance:false},null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify({prepared:2,newGenerationRequests:1,originalBytesChanged:false}));
