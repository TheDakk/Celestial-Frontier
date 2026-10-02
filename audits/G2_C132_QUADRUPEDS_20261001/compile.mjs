import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {compileLibraryMaster, controlledLibraryLayout} from '../../port/v2/tools/painted-creature/compile-library-master.mjs';

const base = 'audits/G2_C132_QUADRUPEDS_20261001';
const names = ['Caiman','Crocodile','Alligator','Gharial','Monitor Lizard','Anole','Gecko','Skink','Alligator Lizard','Mountain Lizard','Tegu','Lizard','Whiptail','Agama','Iguana','Land Iguana','Coastal Lizard','Komodo Dragon','Gila Monster','Frilled Lizard','Chameleon','Horned Lizard','Marine Iguana','Newt'];
const sha = b => createHash('sha256').update(b).digest('hex');
const write = (file, value) => {fs.writeFileSync(file + '.tmp', value, {flag:'wx'}); fs.renameSync(file + '.tmp',file);};
const once = (source, from, to) => {if (source.split(from).length !== 2) throw Error('Exact unique edit required'); return source.replace(from,to);};
const framing = 'ZOOMED-OUT COMPOSITION: one small complete specimen centred in a large empty pure magenta square. The entire creature including its natural tail and all toes spans only HALF the canvas width and no more than HALF its height. Keep at least 200 pixels of empty magenta on every side of the 1254-square canvas. Do not shorten or crop the tail to make the body larger. Empty margin is intentional.';
const common = 'Strict side profile facing RIGHT, head right and tail left. Exactly one anatomically accurate adult with FOUR natural legs, two forelegs and two hindlegs, each visibly attached to the correct body region. Offset the near and far legs in a quiet natural planted walking stride so their shafts and every foot are separately readable against the background; do not invent, elongate, cross or detach a limb to expose it. Preserve the real species posture, natural bend of elbows and knees, exact toes and natural tail shape. The true tail is continuous from its body attachment through its full natural tip, visually clear of feet; do not lengthen a short tail. Preserve all canonical identity features and natural pigment patterns. No mammalian external ears, fur, hooves or invented horns. No scenery, floor, cast shadow, labels or props. Every natural structure must remain inside the frame with at least 8 percent clear margin.';
const extras = {
  Chameleon: 'Keep natural zygodactyl grasping feet without a branch or support prop, independent eye turrets and helmet casque. The real tail retains its characteristic single compact spiral visibly attached to the body; do not replace it with a straight lizard tail. Preserve natural chameleon limb stance rather than mammalian feet.',
  'Horned Lizard': 'Preserve the broad flattened pancake body, backward-pointing crown horns, spiky flank fringe and NATURALLY SHORT tail. Do not turn it into a long-necked or long-tailed monitor.',
  'Frilled Lizard': 'Preserve one anatomically attached frill rooted continuously around the neck, with its natural folds and visible connection. Show its required open frill and pink mouth without inventing a separate floating collar. Keep all four feet planted; no bipedal running stance.',
  Newt: 'A natural adult newt with smooth amphibian skin, slender trunk, a long laterally flattened swimming tail and four small sprawled limbs. Do not add reptile scales, claws, external ears or larval external gills. Preserve species-correct toe counts and the canonical belly colouring; the dark dorsal and brighter ventral regions meet naturally.',
};
const rows = [];
for (const [i,name] of names.entries()) {
  const id = String(i+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-');
  const packet = base+'/'+id;
  const compiled = await compileLibraryMaster(name,packet);
  if (compiled.family !== 'quadruped') throw Error('Expected canonical quadruped route');
  const request = JSON.parse(fs.readFileSync(packet+'/request.json'));
  const original = fs.readFileSync(packet+'/prompt.txt','utf8');
  if (sha(original) !== request.promptSha256) throw Error('Compiler prompt mismatch');
  const subject = JSON.parse(fs.readFileSync(packet+'/subject-source.json'));
  const anatomy = extras[name] ?? (subject.profile.id === 'crocodilian'
    ? 'Preserve the long low armoured body, species-correct snout and laterally flattened swimming tail. Four short naturally sprawled legs have bent elbows and knees; toes remain separately readable without lifting the belly into a mammalian stance.'
    : 'Preserve the natural lizard sprawl, bent elbows and knees, species-correct scales, head and complete tail length. Retain natural toe pads, claws, dewlaps, crests and colour bands only where this species has them. Do not turn the legs into straight mammalian pillars.');
  const layout = common+' '+anatomy;
  const oldLayout = controlledLibraryLayout('quadruped').layout;
  const subjStart = original.indexOf('\nSUBJECT\n');
  const subjEnd = original.indexOf('\n\nACCURACY\n');
  if (subjStart < 0 || subjEnd <= subjStart) throw Error('Subject boundary');
  const oldSubject = original.slice(subjStart,subjEnd);
  const newSubject = once(oldSubject,oldLayout,layout);
  let prompt = once(original,oldSubject,newSubject);
  prompt = once(prompt,'\n\nLAYOUT\n'+oldLayout+'\n\nTECHNICAL OUTPUT\n','\n\nLAYOUT\n'+layout+'\n\nTECHNICAL OUTPUT\n');
  const prefix = 'Species identity FIRST: '+subject.species.mustRead.join('; ')+'. One Earth '+name+'. Natural named anatomy and pigments take priority over raw procedural-genome suggestions.\n'+framing+'\n'+anatomy+'\n\n';
  prompt = prefix+prompt;
  write(packet+'/prompt.txt',prompt);
  write(packet+'/request.json',JSON.stringify({...request,basePromptSha256:request.promptSha256,promptSha256:sha(prompt),layoutCompilerSha256:sha(fs.readFileSync(import.meta.filename)),layoutClarification:{framing,layout,prefix},sourceSelection:'Novel G2 subject absent from accepted and held gallery rows, all prior G2 pilots and the manual corpus; checked before generation.',authoringCreated:false},null,2)+'\n');
  rows.push({id,name,family:compiled.family,packet,master:packet+'/master.png'});
  console.log(id,compiled.family,subject.profile.id);
}
fs.writeFileSync(base+'/pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/queued-names.json',JSON.stringify({names,intent:'C132 fresh quadruped originals: scaled reptiles plus one adult newt; no accepted/held or previously generated subject duplicated. Generated candidates only.'},null,2)+'\n',{flag:'wx'});
