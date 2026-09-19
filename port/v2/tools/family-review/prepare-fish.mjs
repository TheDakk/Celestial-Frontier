/** Source-bound fish trial. All masks are declared against the accepted master. */
import fs from 'node:fs';import path from 'node:path';
import {sealFamilyRecord} from '../creature-animation/family-record.mjs';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';
import {buildAuthoredParts} from '../creature-animation/build-authored-parts.mjs';
import {buildPaintSkin} from '../creature-animation/build-paint-skin.mjs';
import {smoothSkinWeights} from '../creature-animation/smooth-skin-weights.mjs';
const out=path.resolve(process.argv[2]);if(fs.existsSync(out))throw Error('New directory required');fs.mkdirSync(out,{recursive:true});
const masterFile='audits/ART_KIT_ENGINE_FIRST_20260912/masters/family-fish.png',master=fs.readFileSync(masterFile);
const landmarks={root:[.695,.55],head:[.83,.48],jaw:[.92,.545],spine0:[.72,.48],spine1:[.61,.46],spine2:[.51,.46],spine3:[.41,.46],spine4:[.31,.46],spine5:[.21,.46],caudal:[.065,.46],dorsal:[.50,.245],pectoralNear:[.555,.62],pectoralFar:[.80,.68]};
const record=await sealFamilyRecord({kind:'fish',identity:{speciesVisualKey:'authored:accepted-fish-family-master',seed:424242,ownerId:'authored:fish-family/accepted-master',earthName:null},template:{id:'fish',version:1},geometry:{cutoutAssetHash:await hashBytes(master),width:1254,height:1254,groundLineY:.80,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks,materials:{surface:'scales',sheenTier:'painted',paletteSource:'accepted authored master'},clipSetId:'fish-aquatic-v1',source:masterFile,coverage:{scope:'painted fish family reference, not a named Earth species',retainedBodyAttached:['pelvic fins','anal fin','adipose fin'],unproven:['independent accessory fin articulation','out-of-plane swimming','battle staging']}});
const write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n');write('record.json',record);
const parts=[],part=(id,joint,polygon,layer='near')=>parts.push({id,joint,polygon,layer});
part('pectoral-near','pectoralNear',[[.49,.58],[.55,.535],[.685,.532],[.705,.56],[.69,.65],[.53,.705],[.49,.70]]);
part('pectoral-far','pectoralFar',[[.74,.61],[.79,.585],[.87,.65],[.89,.80],[.72,.79]],'far');
part('dorsal','dorsal',[[.385,.35],[.39,.18],[.56,.17],[.62,.306],[.56,.321]],'far');
part('jaw','jaw',[[.80,.546],[.96,.498],[1,.501],[1,.64],[.80,.638]]);
part('head','head',[[.734,.363],[1,.36],[1,.65],[.70,.65],[.676,.526],[.697,.428]]);
part('caudal','caudal',[[0,.22],[.208,.22],[.208,.70],[0,.70]],'far');
for(const [id,joint,x0,x1]of [['tail-peduncle','spine5',.20,.29],['body-rear','spine4',.29,.39],['body-mid-rear','spine3',.39,.49],['body-front','spine1',.59,.72],['shoulder','spine0',.72,.79]])part(id,joint,[[x0,.32],[x1,.32],[x1,.78],[x0,.78]]);
part('body','spine2',[[0,0],[.001,0],[0,.001]]);
const body={schema:'cf.authored-part-masks/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,remainderPart:'body',parts};write('declaration.json',{...body,declarationHash:await hashJSON(body)});
const intake=await buildAuthoredParts({id:'fish',recordFile:path.join(out,'record.json'),masterFile,declarationFile:path.join(out,'declaration.json'),output:path.join(out,'parts')});
const compiled=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:24,interiorStep:64,includeTopology:true});
const {bindingHash,...binding}=compiled.binding;binding.sourceJoinTopology={remainderPartId:'body'};
// The shared shape-preserving profile used by the accepted quadruped trials.
// No family-specific thresholds or pose attenuation.
binding.paintSkin=smoothSkinWeights(binding.paintSkin);
binding.paintSkin.solver={iterations:4,globalIterations:4,targetWeight:.35,pins:[]};
write('binding.json',{...binding,bindingHash:await hashJSON(binding)});write('receipt.json',{...compiled.receipt,intake});console.log(JSON.stringify({intake,vertices:binding.paintSkin.vertices.length}));
