import fs from 'node:fs';import {createHash} from 'node:crypto';
const base='audits/C132_ARENAS_20261001',sha=b=>createHash('sha256').update(b).digest('hex');
const plans=[
  {
    "id": "glass-v2",
    "sourceId": "glass",
    "role": "far",
    "mode": "targeted-edit",
    "reason": "Remove the unbound planet and moon visible in the original FAR.",
    "subject": "TARGETED EDIT of the supplied Glass desert FAR painting. Remove EVERY visible planet, moon, sun disk and celestial body, including the large pale planet and the smaller body at upper right. Replace them with continuous empty pale blue-gray sky and matching cloud wisps. Preserve all the amber-gray glass desert, distant glass spires, broad empty flat fighting floor, brushwork, perspective, light and native 1672 by 941 pixel canvas. No added objects, creatures or text. This reusable template has no bound world or star, so only clouds belong in its sky.",
    "basePrompt": "audits/C132_ARENAS_20261001/glass/arena-far.prompt.txt",
    "actualImageInput": "audits/C132_ARENAS_20261001/glass/arena-far.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-d2f7df9b-492b-4164-8bef-2d7b2391699d.png"
  },
  {
    "id": "glass-v2",
    "sourceId": "glass",
    "role": "near",
    "mode": "fresh-generation-from-locked-style",
    "reason": "Original NEAR is native 1983×793 instead of 1672×941.",
    "subject": "Paint ONE Glass desert NEAR layer on an exact native 1672 pixels wide by 941 pixels high PNG canvas, not 1983 by 793 and not 1672 by 940. Flat uniform pure #FF00FF fills the whole canvas from the top through y=0.92. In only the bottom eight percent, y=0.92 through1.00, paint a thin continuous low amber-gray mineral-sand ground lip with tiny weathered glass chips. No tall shards, rocks, side hills or spikes. Keep all terrain below y=0.92 even at the corners, so y=0.78 across the whole width is pure magenta. Crisp opaque paint edge, no haze or semi-transparent pixels. No planets, clouds, animals, text or frames. The layer supports subtle parallax and never competes with a fighter.",
    "basePrompt": "audits/C132_ARENAS_20261001/glass/arena-near.prompt.txt",
    "actualImageInput": "audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-87964c75-e215-4316-b471-437eb3940de2.png"
  },
  {
    "id": "banded-v2",
    "sourceId": "banded",
    "role": "far",
    "mode": "targeted-edit",
    "reason": "Remove unbound giant planet and two moons from the FAR cloud-only medium.",
    "subject": "TARGETED EDIT of the supplied Banded cloud FAR painting. Remove the enormous striped planet across the upper right and EVERY small moon or celestial disk, including the two left-side moons. Repaint every former body as open blue-gray atmosphere and distant diffuse cream-tan horizontal cloud bands. Preserve the warm cream cloud fields, airy perspective, left light, lower cloud registration plane and native 1672 by 941 canvas. This arena is inside an unbound cloud atmosphere, not a view of a planet. No solid terrain, buildings, creatures, moons, planets, sun disk, stars or text. Keep a broad open composition for two large opposing airborne creatures.",
    "basePrompt": "audits/C132_ARENAS_20261001/banded/arena-far.prompt.txt",
    "actualImageInput": "audits/C132_ARENAS_20261001/banded/arena-far.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-25d538c6-054e-43a5-ad2d-82250954fa7b.png"
  },
  {
    "id": "banded-v2",
    "sourceId": "banded",
    "role": "near",
    "mode": "fresh-generation-from-locked-style",
    "reason": "Original NEAR is native 1983×793 instead of 1672×941.",
    "subject": "Paint ONE Banded cloud NEAR layer on an exact native 1672 pixels wide by 941 pixels high PNG, not 1983 by 793 and not 1672 by 940. Top ninety-two percent of the canvas is perfectly flat pure #FF00FF. ONLY inside y=0.92 through1.00 at the bottom paint a quiet continuous thin cream-tan cloud-band lip, with soft painted internal cloud billows but a crisp opaque silhouette against the magenta. This is cloud AIR only, not solid land, stone, snow, water, ice, foliage or a platform. Keep all cloud content below y=0.92 including both sides; no tall corner clouds or detached wisps above the bottom lip. No transparency, gradients or haze in the magenta, no moons, planets, sun disk, creatures or text. Preserve the diffuse upper-left neutral light.",
    "basePrompt": "audits/C132_ARENAS_20261001/banded/arena-near.prompt.txt",
    "actualImageInput": "audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-005e8c97-215b-4959-896e-7003c7d7db17.png"
  },
  {
    "id": "ammonia-v2",
    "sourceId": "ammonia",
    "role": "far",
    "mode": "targeted-edit",
    "reason": "Original FAR invents celestial bodies and solid icy spires although the source medium is air.",
    "subject": "TARGETED EDIT of this Ammonia cloud FAR painting. Remove EVERY planet, moon, celestial disk and hard-edged icy or rocky spire. Repaint the giant upper planet and smaller moons as continuous open lavender-blue sky with only wispy clouds. Replace all apparent icy towers and cliffs on the left, right and distant center with rounded voluminous soft lavender-gray and pale-cyan CLOUD BANKS, clearly atmospheric vapor with no stone, ice, snow cliffs or solid terrain. Preserve the broad low cloud sea, pastel mineral palette, deep atmospheric layers and shared upper-left light. Native full-bleed 1672 by 941 canvas, opaque all through. AIR biome only; no water, land, surfaces to stand on, creatures, buildings, text or celestial bodies.",
    "basePrompt": "audits/C132_ARENAS_20261001/ammonia/arena-far.prompt.txt",
    "actualImageInput": "audits/C132_ARENAS_20261001/ammonia/arena-far.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-2b7fb75d-e5e2-4c77-92b2-931f72ca2b48.png"
  },
  {
    "id": "ammonia-v2",
    "sourceId": "ammonia",
    "role": "mid",
    "mode": "targeted-edit",
    "reason": "Original MID side formations read as solid ice spires instead of cloud air.",
    "subject": "TARGETED EDIT of this supplied Ammonia cloud MID plate. Replace EVERY hard pointed icy or rocky spire and ring-like feature on both side edges with low rounded soft CLOUD BANKS of pale lavender-gray and pale cyan. Keep the broad continuous cloud-band visual registration plane intact through y=0.78, fully opaque below the silhouette. This is an AIR plane, not ice, snow, stone, land or a solid platform. Keep all the existing outside space completely uniform pure #FF00FF and make the outline crisp and opaque: no detached vapor, haze, wisps or semi-transparent fringe against the key. Preserve the native 1672 by 941 canvas, diffuse upper-left light and low open middle. No clouds floating separately in the key, no planets, moons, creatures or text.",
    "basePrompt": "audits/C132_ARENAS_20261001/ammonia/arena-mid.prompt.txt",
    "actualImageInput": "audits/C132_ARENAS_20261001/ammonia/arena-mid.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-66e808ae-771b-4ce6-8707-16519f308b72.png"
  },
  {
    "id": "magmasea-v2",
    "sourceId": "magmasea",
    "role": "far",
    "mode": "targeted-edit",
    "reason": "Original FAR paints an unbound visible sun disk.",
    "subject": "TARGETED EDIT of the supplied Magma sea FAR painting. Remove the small bright SUN DISK in the upper-left sky and replace it with continuous soft warm cloud paint at the same diffuse brightness as the nearby clouds, without any distinct circular emitter. Preserve the distant orange molten sea, black volcanic formations, cooled dark continuous fighting shelf, atmospheric haze and all existing stage structure. No moons, planets, stars, sun disks, creatures or text. Keep the same native 1672 by 941 opaque full-bleed canvas and the same diffuse upper-left shared-light direction. No new lava across the fighting floor.",
    "basePrompt": "audits/C132_ARENAS_20261001/magmasea/arena-far.prompt.txt",
    "actualImageInput": "audits/C132_ARENAS_20261001/magmasea/arena-far.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-b1a5c243-7b00-42b8-8e0d-1ea830d44a55.png"
  },
  {
    "id": "magmasea-v2",
    "sourceId": "magmasea",
    "role": "near",
    "mode": "targeted-edit",
    "reason": "Existing intake refuses NEAR covers fighting path at raised side bank.",
    "subject": "TARGETED EDIT of the supplied Magma sea NEAR terrain layer. Remove ALL high side rocks and banks. Repaint the whole layer as a quiet thin low dark COOLED volcanic ground lip contained ONLY within the bottom eight percent, y=0.92 through1.00, across this native 1672 by 941 canvas. Every pixel above y=0.92, including both corners, must be perfectly flat uniform pure #FF00FF. No large rocks, hills, spikes, lava, flames, mist, light beams or detached content above that bottom lip. A few tiny black weathered pebbles may stay within the bottom lip. Keep crisp opaque outline and diffuse upper-left light, no soft fringe into the magenta. The whole y=0.78 fighting path must remain pure magenta. No text, marks, creatures or celestial objects.",
    "basePrompt": "audits/C132_ARENAS_20261001/magmasea/arena-near.prompt.txt",
    "actualImageInput": "audits/C132_ARENAS_20261001/magmasea/arena-near.png",
    "file": "~/.codex/generated_images/01a0faa5-b11e-7420-814b-6221599d2296/exec-2b7770f7-f5dd-454f-b204-7fd0076df180.png"
  }
];
for(const sourceId of [...new Set(plans.map(p=>p.sourceId))]){
 const repairs=plans.filter(p=>p.sourceId===sourceId),id=repairs[0].id,dir=base+'/'+id,prior=base+'/'+sourceId;fs.mkdirSync(dir);fs.copyFileSync(prior+'/recipe.pending.json',dir+'/recipe.pending.json',fs.constants.COPYFILE_EXCL);
 for(const role of ['far','mid','near']){
  const p=repairs.find(p=>p.role===role),stem='/arena-'+role;if(!p){for(const ext of ['.png','.generation.json'])fs.copyFileSync(prior+stem+ext,dir+stem+ext,fs.constants.COPYFILE_EXCL);continue;}
  const old=fs.readFileSync(p.basePrompt,'utf8'),a=old.indexOf('\nSUBJECT\n')+9,b=old.indexOf(role==='far'?'\n\nLAYOUT':'\n\nACCURACY',a);if(a<9||b<a)throw Error('Subject boundaries invalid');
  const prompt=old.slice(0,a)+p.subject+old.slice(b);fs.writeFileSync(dir+stem+'.prompt.txt',prompt,{flag:'wx'});
  fs.writeFileSync(dir+stem+'.successor-provenance.json',JSON.stringify({schema:'cf.c132-arena-painting-successor/v1',reason:p.reason,mode:p.mode,basePrompt:{path:p.basePrompt,sha256:sha(old)},successorPrompt:{path:dir+stem+'.prompt.txt',sha256:sha(prompt)},lockedNonSubjectSectionsUnchanged:true,actualToolImageInputs:[{path:p.actualImageInput,sha256:sha(fs.readFileSync(p.actualImageInput))}],styleAuthority:{path:'audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png',mode:p.mode==='targeted-edit'?'Inherited locked style through the unchanged predecessor; actual sole image input is the predecessor named above.':'Actual sole image input is the locked Living Worlds reference.'},predecessor:{path:prior+stem+'.png',sha256:sha(fs.readFileSync(prior+stem+'.png'))},sourceOutput:p.file,sourceOriginalRetained:true,originalPixelsModified:false,meaningOfUnmodified:'Generated successor bytes are retained exactly. The predecessor is unchanged. No post-generation resizing, padding, cropping or upscaling.',qualityAccepted:false},null,2)+'\n',{flag:'wx'});
 }
 fs.writeFileSync(dir+'/successor-plan.json',JSON.stringify({schema:'cf.c132-arena-successor/v1',id,sourceId,sourceOriginalsRetained:true,roles:repairs.map(p=>({role:p.role,reason:p.reason,mode:p.mode})),qualityAccepted:false},null,2)+'\n',{flag:'wx'});
}
for(const id of ['glass','banded','magmasea']){const dir=base+'/'+id,masters=['far','mid','near'].map(role=>{const name=dir+'/arena-'+role+'.png',b=fs.readFileSync(name);return {role,path:name,sha256:sha(b),width:b.readUInt32BE(16),height:b.readUInt32BE(20)}});fs.writeFileSync(dir+'/intake-held.json',JSON.stringify({schema:'cf.c132-arena-intake-held/v1',id,status:'REFUSED',stage:'existing intake.mjs',reason:id==='magmasea'?'NEAR covers fighting path':'Master dimensions differ',exitCode:1,masters,partialKeyedCopiesRetained:true,finalizationRun:false,qualityAccepted:false,successor:id+'-v2'},null,2)+'\n',{flag:'wx'});}
fs.writeFileSync(base+'/ammonia/visual-held.json',JSON.stringify({schema:'cf.c132-arena-visual-hold/v1',id:'ammonia',technicalIntake:'PASS',qualityAccepted:false,reason:'Original FAR paints unbound planets/moons and hard icy spires; MID repeats apparent solid ice towers. Source medium is air. Successor replaces the bodies and spires at painting side.',successor:'ammonia-v2',sourceOriginalsRetained:true},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({successorSets:4,successorPlates:plans.length,originalRefusals:3,originalVisualHolds:1}));

