/** Hash-bound authored observations of three review paintings. Shared curves, no overrides. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';
import {sealPortableQuadrupedRecord as sealRecord} from '../creature-animation/portable-record-writer.mjs';
import {buildAuthoredParts} from '../creature-animation/build-authored-parts.mjs';
import {buildPaintSkin} from '../creature-animation/build-paint-skin.mjs';
import {splitSkinBranches} from '../creature-animation/split-skin-branches.mjs';
import {inspectLimbIslands} from '../creature-animation/limb-islands.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
const [specFile,outArg]=process.argv.slice(2),spec=JSON.parse(fs.readFileSync(specFile)),out=path.resolve(outArg);
if(fs.existsSync(out))throw Error('New directory required');fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync(spec.sourceRecord)),master=fs.readFileSync(spec.master),png=PNG.sync.read(master),genome=JSON.parse(fs.readFileSync(path.join(path.dirname(spec.sourceRecord),'genome.json')));
const record=await sealRecord({kind:'quadruped',identity:{...source.identity,ownerId:'authored:painted-procedural/'+spec.id},template:{id:'quadruped',version:1},geometry:{cutoutAssetHash:await hashBytes(master),width:png.width,height:png.height,groundLineY:spec.groundLineY,depthLayers:[{id:'far',order:0},{id:'near',order:1}],contactPolicy:'painted perspective; motion diagnostic, not planted contact acceptance'},landmarks:spec.landmarks,materials:source.materials,clipSetId:'quadruped-land-v1',source:spec.master,genome,provenance:{sourceRecord:spec.sourceRecord,sourceRecipeHash:source.recipeHash,observationSha256:await hashBytes(fs.readFileSync(specFile)),kitAccepted:false,perCreatureClipEdits:0}});
const write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n');write('record.json',record);
const body={schema:'cf.authored-part-masks/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,remainderPart:'torso',parts:spec.parts};write('declaration.json',{...body,declarationHash:await hashJSON(body)});
const result=await buildAuthoredParts({id:spec.id,recordFile:path.join(out,'record.json'),masterFile:spec.master,declarationFile:path.join(out,'declaration.json'),output:path.join(out,'parts')});
const limbRows=fs.readdirSync(path.join(out,'parts/parts')).filter(n=>/-(upper|lower|paw)\.png$/.test(n)).map(file=>{const p=PNG.sync.read(fs.readFileSync(path.join(out,'parts/parts',file)));return {file,...inspectLimbIslands(p.data,p.width,p.height)};});write('limb-islands.json',limbRows);if(limbRows.some(r=>r.status!=='PASS'))throw Error('Detached limb paint; correct authored ownership before animation');
const coarse=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:24,interiorStep:56,includeTopology:true});
const skin=await splitSkinBranches(coarse.binding,record,{diffusionIterations:32,attachmentEdges:coarse.ownershipEdges});write('binding.json',skin.binding);write('skin-receipt.json',skin.receipt);write('intake-result.json',result);console.log(JSON.stringify(result));
