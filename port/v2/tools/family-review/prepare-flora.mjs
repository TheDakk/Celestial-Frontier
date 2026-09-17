/** Authored data changes by master; intake, skin, constraints and clips are shared. */
import fs from 'node:fs';import path from 'node:path';
import {sealFamilyRecord} from '../creature-animation/family-record.mjs';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';
import {buildAuthoredParts} from '../creature-animation/build-authored-parts.mjs';
import {buildPaintSkin} from '../creature-animation/build-paint-skin.mjs';
import {splitObservedSurfaces} from '../creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../quadruped-proof/source-join-continuity.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const [configFile,outArg]=process.argv.slice(2),config=JSON.parse(fs.readFileSync(configFile)),out=path.resolve(outArg);
if(fs.existsSync(out))throw Error('New output required');fs.mkdirSync(out,{recursive:true});
const masterFile=config.master,master=fs.readFileSync(masterFile);
if(await hashBytes(master)!==config.masterSha256)throw Error('Authored flora master changed');
const landmarks={root:config.root,trunk:config.trunk},materials={surface:'bark',paletteSource:'accepted authored master',joints:{}},parts=[];
for(const [i,branch]of config.branches.entries()){
 for(const [suffix,p]of[['Base',branch.base],['Tip',branch.tip]])landmarks['branch'+i+suffix]=p;
 landmarks['leaf'+i]=branch.leaf;materials.joints['leaf'+i]='foliage';
 for(const [suffix,joint,polygon]of[['foliage','leaf'+i,branch.foliage],['wood','branch'+i+'Base',branch.wood]])if(polygon)parts.push({id:'branch-'+i+'-'+suffix,joint,polygon,layer:branch.layer??'near'});
}
parts.push({id:'root',joint:'root',layer:'near',polygon:config.rootMask},{id:'trunk',joint:'trunk',layer:'near',polygon:[[0,0],[.001,0],[0,.001]]});
const record=await sealFamilyRecord({kind:'plant-woody',identity:{speciesVisualKey:config.speciesVisualKey,seed:config.seed,ownerId:'authored:flora/'+config.id,earthName:config.name},template:{id:'plant-woody',version:1},habitat:{realm:'land',source:'Authored terrestrial woody master; roots attached to substrate'},anatomy:{schema:'cf.anatomy-presence/v1',absent:[],growth:{branches:config.branches.length}},geometry:{cutoutAssetHash:config.masterSha256,width:1254,height:1254,groundLineY:config.groundLineY,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks,materials,clipSetId:'plant-woody-v1',source:masterFile,coverage:{scope:'Hash-bound visible woody branch groups; foliage clusters retain their painted leaves and fruit',unproven:['hidden/reverse surfaces','individual leaf and fruit articulation','harvest item detachment','Compendium grow scale reveal','native full action visual acceptance','physical phone budget']}});
const write=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');write('record.json',record);
const d={schema:'cf.authored-part-masks/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,remainderPart:'trunk',parts};write('declaration.json',{...d,declarationHash:await hashJSON(d)});
const intake=await buildAuthoredParts({id:config.id,recordFile:path.join(out,'record.json'),masterFile,declarationFile:path.join(out,'declaration.json'),output:path.join(out,'parts')});
const compiled=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:24,interiorStep:64,includeTopology:true});
const {bindingHash,...body}=compiled.binding;body.sourceJoinTopology={remainderPartId:'trunk'};
const binding={...body,bindingHash:await hashJSON(body)};
const atlas=await sharp(fs.readFileSync(path.join(out,'parts/atlas/'+config.id+'.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
const split=await splitObservedSurfaces(binding,record,probe,{fixedJoints:['root'],shapeJoints:Object.keys(materials.joints),preservePaintBoundaries:true});
write('binding.json',split.binding);write('receipt.json',{...compiled.receipt,intake,surfaces:split.receipt,authoredConfigSha256:await hashBytes(fs.readFileSync(configFile))});console.log(JSON.stringify({id:config.id,intake,surfaces:split.receipt}));
