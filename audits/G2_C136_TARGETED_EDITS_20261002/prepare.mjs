import fs from 'node:fs';
import os from 'node:os';
import {createHash} from 'node:crypto';
const base='audits/G2_C136_TARGETED_EDITS_20261002',sha=b=>createHash('sha256').update(b).digest('hex');
const planned=[
  {
    "id": "01-giant-salamander",
    "name": "Giant Salamander",
    "sourcePacket": "audits/G2_C136_REPAIRS_20261002/01-giant-salamander",
    "prompt": "Edit the attached exact Giant Salamander painting. Zoom the WHOLE animal out to 60 percent of its current linear size and centre it on the same pure magenta 1254-square canvas, leaving wide empty background on all four sides. Preserve its complete natural silhouette, four limbs, tail, head, skin folds, pigments and brushwork. Do not crop or shorten anatomy. Do not add any marks, scenery, floor, shadow, border, labels or transparency. This is only a framing repair; retain the subject design and painted hand.\n\n  Rich natural-history fantasy painting, one hand across every subject,\n  tactile directional brushwork, believable connected anatomy, weathered rock,\n  individual but grouped foliage, deep atmospheric layers, readable silhouettes,\n  selective high detail, soft natural light shared by every subject, honest\n  ground and water contact, subtle foreground occlusion, premium painted\n  science-fiction with discovery and character; Earth species keep real\n  anatomy, fur, feather and botany; alien life keeps its data-driven form and\n  palette in the same hand; not plastic CGI, not photography, not cartoon,\n  not oversharpened, no glowing outlines.",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-2211384f-28bc-4064-acee-4ccbaa632083.png",
    "reason": "Giant Salamander original fails unchanged 8% framing."
  },
  {
    "id": "06-giraffe",
    "name": "Giraffe",
    "sourcePacket": "audits/G2_C136_REPAIRS_20261002/06-giraffe",
    "prompt": "Edit only the ear visibility in this exact Giraffe painting. The near leaf-shaped ear on the LEFT of the crown is visible, but the real FAR ear is hidden. Gently turn the far ear outward so its leaf-shaped tip appears on the RIGHT of the head beside the ossicone, clearly attached at its natural base and distinct from both small ossicones. There must be exactly TWO ears and exactly TWO ossicones. Do not make a new horn or a third ear. Preserve the existing right-facing giraffe, head, muzzle, neck length, patches, body, four legs, feet, tail, size and pose. Same 1254-square pure magenta background, no floor, scenery, shadow, label or border. Preserve the painting hand and all anatomy except the minimal natural ear orientation.\n\n  Rich natural-history fantasy painting, one hand across every subject,\n  tactile directional brushwork, believable connected anatomy, weathered rock,\n  individual but grouped foliage, deep atmospheric layers, readable silhouettes,\n  selective high detail, soft natural light shared by every subject, honest\n  ground and water contact, subtle foreground occlusion, premium painted\n  science-fiction with discovery and character; Earth species keep real\n  anatomy, fur, feather and botany; alien life keeps its data-driven form and\n  palette in the same hand; not plastic CGI, not photography, not cartoon,\n  not oversharpened, no glowing outlines.",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-f7956ddd-e6e5-4829-be90-71e6699130b1.png",
    "reason": "Giraffe original far ear hidden behind crown."
  },
  {
    "id": "07-buffalo",
    "name": "Buffalo",
    "sourcePacket": "audits/G2_C136_REPAIRS_20261002/07-buffalo",
    "prompt": "Edit this exact Cape buffalo painting with one anatomically specific correction: the far external ear is hidden behind the crown. Turn the far existing ear outward enough that its complete leaf-shaped pinna is independently visible just below the far horn, separated from the near ear by the head. There are exactly TWO ears, not three. Preserve the muzzle, both horns and boss, four legs, pose, ground height, identity, colors, opaque flat magenta background and wide margins. Do not add any other appendage or change the original animal's scale.\n\n  Rich natural-history fantasy painting, one hand across every subject,\n  tactile directional brushwork, believable connected anatomy, weathered rock,\n  individual but grouped foliage, deep atmospheric layers, readable silhouettes,\n  selective high detail, soft natural light shared by every subject, honest\n  ground and water contact, subtle foreground occlusion, premium painted\n  science-fiction with discovery and character; Earth species keep real\n  anatomy, fur, feather and botany; alien life keeps its data-driven form and\n  palette in the same hand; not plastic CGI, not photography, not cartoon,\n  not oversharpened, no glowing outlines.\n\nFull-body right-facing Cape buffalo, complete silhouette. No text, labels, marks, panels or border.",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-d79d54f7-1a98-4d11-ad5d-bca0e4376e6b.png",
    "reason": "C136 original still hides the far external ear beneath the horn/crown; attempt to expose the existing pinna without inventing an extra ear."
  },
  {
    "id": "21-bee",
    "name": "Bee",
    "sourcePacket": "audits/G2_C136_REPAIRS_20261002/21-bee",
    "prompt": "Edit this exact bee painting to repair its insufficient visible legs. Preserve its body, two antennae, wings, striped furry abdomen, eyes, head, scale and margins. Anatomically the bee has exactly SIX legs in three thoracic pairs. Paint all six connected legs, three near legs and three far legs, each separately traceable from a different thoracic attachment through its bent leg to a distinct dark tarsal tip. Fan the legs naturally so their six terminal feet do not overlap. Do not count antennae as legs. Do not add legs to the abdomen or erase valid legs. All six feet on a common level ground plane. Keep the same right-facing side view, opaque solid magenta background, premium natural-history painting.\n\n  Rich natural-history fantasy painting, one hand across every subject,\n  tactile directional brushwork, believable connected anatomy, weathered rock,\n  individual but grouped foliage, deep atmospheric layers, readable silhouettes,\n  selective high detail, soft natural light shared by every subject, honest\n  ground and water contact, subtle foreground occlusion, premium painted\n  science-fiction with discovery and character; Earth species keep real\n  anatomy, fur, feather and botany; alien life keeps its data-driven form and\n  palette in the same hand; not plastic CGI, not photography, not cartoon,\n  not oversharpened, no glowing outlines.\n\nNo diagrams, labels, text, symbols, floating pieces, ruler, border or inset.",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-b8a74a90-3d91-4fc5-aec8-520512a92adc.png",
    "reason": "C136 original has only four clear leg endpoints. Expose all three true thoracic pairs independently; no accepted or held-gallery master is replaced."
  }
];
const style="  Rich natural-history fantasy painting, one hand across every subject,\n  tactile directional brushwork, believable connected anatomy, weathered rock,\n  individual but grouped foliage, deep atmospheric layers, readable silhouettes,\n  selective high detail, soft natural light shared by every subject, honest\n  ground and water contact, subtle foreground occlusion, premium painted\n  science-fiction with discovery and character; Earth species keep real\n  anatomy, fur, feather and botany; alien life keeps its data-driven form and\n  palette in the same hand; not plastic CGI, not photography, not cartoon,\n  not oversharpened, no glowing outlines.";
const pilot=[];
for(const row of planned){
 const packet=base+'/'+row.id,source=row.sourcePacket,request=JSON.parse(fs.readFileSync(source+'/request.json')),subject=JSON.parse(fs.readFileSync(source+'/subject-source.json'));
 fs.mkdirSync(packet,{recursive:true});
 for(const name of ['subject-source.json','compiler-inputs.json'])fs.copyFileSync(source+'/'+name,packet+'/'+name,fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(source+'/prompt.txt',packet+'/base-prompt.txt',fs.constants.COPYFILE_EXCL);
 fs.copyFileSync(source+'/request.json',packet+'/base-request.json',fs.constants.COPYFILE_EXCL);
 if(!row.prompt.includes(style))throw Error('Locked style paragraph changed');
 fs.writeFileSync(packet+'/prompt.txt',row.prompt,{flag:'wx'});
 const editRequest={schema:'cf.g2-master-request/v1',name:subject.name,family:subject.family,tool:'image_gen.imagegen',promptSha256:sha(row.prompt),basePromptSha256:sha(fs.readFileSync(source+'/prompt.txt')),baseRequestSha256:sha(fs.readFileSync(source+'/request.json')),baseCanonicalCompilerSha256:request.compilerSha256,editCompilerSha256:sha(fs.readFileSync(import.meta.filename)),styleSha256:sha(style),kitSha256:request.kitSha256,reference:request.reference,referenceSha256:request.referenceSha256,profileId:request.profileId,editSource:source+'/master.png',editSourceSha256:sha(fs.readFileSync(source+'/master.png')),purpose:'Targeted painting-repair successor; no silent original replacement or admission.',repairReason:row.reason,requestedSize:[1254,1254],requestedVisibleLegs:request.requestedVisibleLegs,observedVisibleLegs:null,authoringCreated:false};
 fs.writeFileSync(packet+'/request.json',JSON.stringify(editRequest,null,2)+'\n',{flag:'wx'});
 pilot.push({id:row.id,name:row.name,family:subject.family,packet,master:packet+'/master.png',sourcePacket:source,purpose:'TARGETED_EDIT',repairReason:row.reason});
}
fs.writeFileSync(base+'/pilot.json',JSON.stringify(pilot,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({successorCandidates:pilot.length,sourceOriginalsRetained:true}));

