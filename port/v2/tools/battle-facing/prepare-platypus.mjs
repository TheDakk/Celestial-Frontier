/** Authored geometry over the accepted Platypus. No genes or clip overrides. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';
import {sealPortableQuadrupedRecord as sealRecord} from '../creature-animation/portable-record-writer.mjs';
import {buildAuthoredParts} from '../creature-animation/build-authored-parts.mjs';
import {buildPaintSkin} from '../creature-animation/build-paint-skin.mjs';
import {splitSkinBranches} from '../creature-animation/split-skin-branches.mjs';
import {verifyPartsDirectory} from '../creature-animation/verify-parts.mjs';
import {lowerPawContour} from '../creature-animation/paw-contact-pins.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const out=path.resolve(process.argv[2]);if(fs.existsSync(out))throw Error('New directory required');fs.mkdirSync(out,{recursive:true});
const masterFile='audits/ART_KIT_ENGINE_FIRST_20260912/masters/platypus.png',master=fs.readFileSync(masterFile),snapshot=JSON.parse(fs.readFileSync('audits/ART_KIT_ENGINE_FIRST_20260912/canonical-snapshot.json'));
const genome=snapshot.roster.view.all.find(g=>g._earthName==='Platypus');if(!genome)throw Error('Actual Earth identity required');
const j={root:[.53,.48],pelvis:[.41,.43],spine:[.53,.45],chest:[.68,.48],neck:[.71,.40],head:[.80,.405],jaw:[.90,.49],
 tail0:[.34,.43],tail1:[.24,.45],tail2:[.14,.46],tail3:[.055,.47],
 earFarRoot:[.73,.37],earFarTip:[.732,.363],earNearRoot:[.76,.38],earNearTip:[.762,.373],
 hindFarRoot:[.42,.42],hindFarKnee:[.50,.47],hindFarAnkle:[.44,.53],hindFarPaw:[.43,.57],
 hindNearRoot:[.39,.49],hindNearKnee:[.30,.535],hindNearAnkle:[.28,.60],hindNearPaw:[.31,.642],
 foreFarRoot:[.72,.52],foreFarKnee:[.82,.565],foreFarAnkle:[.80,.655],foreFarPaw:[.842,.69],
 foreNearRoot:[.54,.57],foreNearKnee:[.50,.675],foreNearAnkle:[.57,.732],foreNearPaw:[.595,.77]};
const record=await sealRecord({kind:'quadruped',identity:{speciesVisualKey:JSON.stringify(genome),seed:genome.seed,ownerId:'authored:Platypus/accepted-master',earthName:'Platypus'},template:{id:'quadruped',version:1},geometry:{cutoutAssetHash:await hashBytes(master),width:1254,height:1254,groundLineY:.80,depthLayers:[{id:'far',order:0},{id:'near',order:1}],contactPolicy:'preserve painted perspective; hidden hindFar has no painted part'},landmarks:j,materials:{surface:'fur',sheenTier:'painted',paletteSource:'authored named master'},clipSetId:'quadruped-land-v1',source:masterFile,visibility:{hindFar:'occluded; no invented pixels',ears:'internal apertures; no external ear parts'}});
const write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n');write('record.json',record);
const parts=[],part=(id,joint,polygon,layer='near')=>parts.push({id,joint,polygon,layer});
part('hind-near-paw','hindNearPaw',[[.16,.596],[.37,.604],[.40,.683],[.16,.70]]);
part('fore-far-paw','foreFarPaw',[[.73,.647],[.88,.64],[.94,.75],[.73,.76]],'far');
part('fore-near-paw','foreNearPaw',[[.44,.718],[.66,.714],[.73,.84],[.44,.86]]);
part('bill','jaw',[[.78,.37],[1,.40],[1,.58],[.84,.568],[.76,.486]]);
part('head','head',[[.58,.27],[.84,.26],[.85,.43],[.76,.53],[.62,.51],[.54,.40]]);
part('tail-tip','tail3',[[0,.36],[.17,.36],[.18,.58],[0,.60]],'far');
part('tail-middle','tail2',[[.16,.36],[.28,.35],[.29,.55],[.16,.57]],'far');
part('tail-root','tail1',[[.26,.36],[.40,.36],[.41,.53],[.27,.55]],'far');
part('hind-near-lower','hindNearAnkle',[[.19,.555],[.38,.56],[.38,.634],[.17,.637]]);
part('hind-near-upper','hindNearKnee',[[.25,.48],[.43,.48],[.41,.584],[.23,.596]]);
part('fore-far-lower','foreFarAnkle',[[.74,.599],[.86,.59],[.89,.667],[.744,.679]],'far');
part('fore-far-upper','foreFarKnee',[[.70,.48],[.84,.48],[.86,.62],[.73,.632]],'far');
part('fore-near-lower','foreNearAnkle',[[.44,.664],[.61,.66],[.65,.752],[.43,.751]]);
part('fore-near-upper','foreNearKnee',[[.45,.55],[.63,.54],[.66,.685],[.42,.689]]);
part('neck','neck',[[.54,.365],[.79,.365],[.80,.55],[.64,.578],[.51,.50]]);
part('chest','chest',[[.5,.435],[.79,.43],[.78,.67],[.51,.685]]);
part('torso','spine',[[0,0],[.001,0],[0,.001]]);
const body={schema:'cf.authored-part-masks/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,remainderPart:'torso',parts};write('declaration.json',{...body,declarationHash:await hashJSON(body)});
await buildAuthoredParts({id:'platypus',recordFile:path.join(out,'record.json'),masterFile,declarationFile:path.join(out,'declaration.json'),output:path.join(out,'parts')});
const verified=await verifyPartsDirectory(path.join(out,'parts'));
// The continuous surface can start from exact ownership edges without legacy underlap bands.
const coarse=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:24,interiorStep:64,includeTopology:true}),contacts=[];
for(const p of coarse.binding.parts.filter(p=>p.joint.endsWith('Paw'))){const bytes=verified.sources.get(p.id),png=PNG.sync.read(bytes);contacts.push(lowerPawContour(p,png.data,png.width,png.height,await hashBytes(bytes)));}
const skin=await splitSkinBranches(coarse.binding,record,{diffusionIterations:32,contactContours:contacts,attachmentEdges:coarse.ownershipEdges});write('binding.json',skin.binding);write('skin-receipt.json',skin.receipt);
console.log(JSON.stringify({record:record.recipeHash,parts:parts.length,atlas:skin.binding.atlasSize,paintedPaws:contacts.map(p=>p.joint),hiddenParts:['hindFar','external ears'],nativeAcceptance:false},null,2));
