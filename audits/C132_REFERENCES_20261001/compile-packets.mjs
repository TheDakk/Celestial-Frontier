import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compileLibraryMaster} from './compile-controlled-master.mjs';
const base='audits/C132_REFERENCES_20261001',sha=b=>createHash('sha256').update(b).digest('hex');
const names=['Gazelle','Gaur','Dog','Cat'];
const instructions={
 Gazelle:'REFERENCE PAINTING: graceful side-on natural gazelle, fine delicate legs and real small hooves. Quiet walking stride with all FOUR legs visibly separated from their distinct body roots through ankles to hooves. Place the far foreleg slightly forward and far hindleg slightly forward of the near limbs with clear magenta gaps along their whole shafts. Two natural ears are both separately readable, with distinct tips. Preserve two natural slender lyre-shaped ringed horns, dark flank stripe and naturally short tail; do not lengthen the tail. The short tail hangs clear behind the haunch without touching either leg. All four hooves meet one horizontal level.',
 Gaur:'REFERENCE PAINTING: a true adult gaur in side profile, with natural high shoulder ridge, muscular neck, pale forehead, upcurved horns, white stockings on ALL FOUR legs and small cloven hooves. FOUR legs separated from their body roots through knees, hocks, ankles and hooves, all feet level. Natural stride offsets far legs horizontally with clear magenta shaft gaps. Both ears and their tips distinct outside the horns. Natural tail trails clear of the body and legs with its attached tuft visible; no exaggerated hump, mammoth legs or invented bull anatomy.',
 Dog:'REFERENCE PAINTING: one medium-sized domestic dog of no particular breed, strict side profile with a black nose and two separately visible natural ears. Use erect ears so BOTH tips are observable. A calm planted walking stride exposes FOUR separate limb shafts from natural attachment to paws, not merely four offset toes. The far foreleg is ahead of the near foreleg and the far hindleg ahead of the near hindleg; clear background gaps, no limb crossings. The long plumed tail is naturally carried above the back but visibly separated from the body contour, continuously attached, complete tip inside frame. Every paw on the same horizontal level.',
 Cat:'REFERENCE PAINTING: one natural domestic cat in strict side profile, two upright triangular ears with BOTH complete tips independently readable, short muzzle, slit pupil and whiskers. The cat walks in a quiet planted stride: FOUR separate legs, two fore and two hind, each readable continuously from the body to its paw, with visible magenta gaps along the shafts. Naturally offset near/far legs front-to-back, no crossing or merged upper limbs. Long natural tail extends behind the haunch horizontally with a gentle low curve, completely separated from feet and belly. Keep all paws on one horizontal level and all anatomy connected.',
};
const rows=[];
for(const[i,name]of names.entries()){
 const id=String(i+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet=base+'/'+id;
 const result=await compileLibraryMaster(name,packet),file=packet+'/prompt.txt',prompt=fs.readFileSync(file,'utf8'),request=JSON.parse(fs.readFileSync(packet+'/request.json'));
 if(sha(prompt)!==request.promptSha256)throw Error('Exact compiler prompt required');
 const extra='\n\n'+instructions[name]+'\nCOMPOSITION: zoom out. Every tail tip, toe, horn and ear fits inside x=180..1074 and y=180..1074 on the 1254-square canvas, with generous unpainted magenta outside. This rectangle is only a placement instruction; do not paint its border. Natural proportions and four readable limbs take precedence over making the animal large.\n';
 fs.writeFileSync(file+'.tmp',prompt+extra,{flag:'wx'});fs.renameSync(file+'.tmp',file);
 fs.writeFileSync(packet+'/request.json.tmp',JSON.stringify({...request,basePromptSha256:request.promptSha256,promptSha256:sha(prompt+extra),referenceLayout:instructions[name],referenceCompilerSha256:sha(fs.readFileSync(import.meta.filename)),purpose:'New manually observed reference candidate; not novel species coverage; existing originals retained.'},null,2)+'\n',{flag:'wx'});fs.renameSync(packet+'/request.json.tmp',packet+'/request.json');
 rows.push({id,name,family:result.family,packet,master:packet+'/master.png'});
}
fs.writeFileSync(base+'/pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
const extended=['Chimpanzee','Centipede','Octopus','Fruit Bat'];
const templates=[];
for(const [i,name]of extended.entries()){
 const id=String(i+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet=base+'/template-prompts/'+id;
 const r=await compileLibraryMaster(name,packet);templates.push({name,family:r.family,packet,status:'PROMPT_ONLY_NOT_GENERATED'});
}
fs.writeFileSync(base+'/template-prompts.json',JSON.stringify(templates,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({referenceCandidates:rows.length,extendedTemplates:templates}));
