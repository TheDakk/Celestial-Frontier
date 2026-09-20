/** Five actual source-stage fits, one shared compiler. No guessed image masks. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {familyContractForRecord,familyContactChains} from '../creature-animation/family-contracts.mjs';
import {sealFamilyRecord} from '../creature-animation/family-record.mjs';
import {hashBytes,hashJSON} from '../creature-animation/quadruped-template.mjs';
import {buildAuthoredParts} from '../creature-animation/build-authored-parts.mjs';
import {buildPaintSkin} from '../creature-animation/build-paint-skin.mjs';
import {splitObservedSurfaces} from '../creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../quadruped-proof/source-join-continuity.mjs';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const [sourceArg,outArg,...flags]=process.argv.slice(2),source=path.resolve(sourceArg),output=path.resolve(outArg),report=JSON.parse(fs.readFileSync(path.join(source,'report.json')));
// R9: --finished=<dir> substitutes <dir>/<id>-finished.png as TEXTURE ONLY (same alpha, same labels, same record/declaration; parts and paint skin must come out byte-identical).
const finishedFlag=flags.find(f=>f.startsWith('--finished='));if(flags.some(f=>!f.startsWith('--finished=')))throw Error('Usage: prepare-observed-crabs.mjs SOURCE_DIR NEW_OUTPUT_DIR [--finished=DIR]');
const finishedDir=finishedFlag?path.resolve(finishedFlag.slice('--finished='.length)):null;
if(report.schema!=='cf.source-painter-parts/v1'||report.status!=='DIAGNOSTIC_PASS'||report.rows.length!==5||fs.existsSync(output))throw Error('New output and complete source mask capture required');
if(!Array.isArray(report.artifacts)||report.artifacts.length!==25)throw Error('Complete source artifact manifest required');
for(const artifact of report.artifacts){if(!/^[a-z-]+\.(png|json)$/.test(artifact.path)||await hashBytes(fs.readFileSync(path.join(source,artifact.path)))!==artifact.sha256)throw Error('Source artifact changed: '+artifact.path);}
fs.mkdirSync(output,{recursive:true});
for(const row of report.rows){
 const id=row.name.toLowerCase().replaceAll(' ','-'),out=path.join(output,id);fs.mkdirSync(out);
 const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n');
 const original=JSON.parse(fs.readFileSync(path.join(source,id+'-record.json'))),masterFile=path.join(source,id+'-master.png');
 const {recipeHash,...originalBody}=original;if(recipeHash!==row.recordRecipeHash||await hashJSON(originalBody)!==recipeHash)throw Error('Source recipe changed');
 const record=await sealFamilyRecord({...original,projection:'source-pincers',source:path.relative(process.cwd(),masterFile),coverage:{...original.coverage,scope:'Actual painter stage ownership and anatomy; animation/phone/visual qualification pending'}});write('record.json',record);
 const {declarationHash,...declaration}=JSON.parse(fs.readFileSync(path.join(source,id+'-declaration.json')));declaration.recordRecipeHash=record.recipeHash;write('declaration.json',{...declaration,declarationHash:await hashJSON(declaration)});
 fs.copyFileSync(path.join(source,id+'-labels.png'),path.join(out,'labels.png'));
 const textureFile=finishedDir?path.join(finishedDir,id+'-finished.png'):null;if(textureFile&&!fs.existsSync(textureFile))throw Error('Finished texture missing: '+textureFile);
 const intake=await buildAuthoredParts({id,recordFile:path.join(out,'record.json'),masterFile,declarationFile:path.join(out,'declaration.json'),output:path.join(out,'parts'),textureFile});
 const compiled=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:8,interiorStep:32,includeTopology:true});
 const{bindingHash,...body}=compiled.binding;body.sourceJoinTopology={remainderPartId:'carapace'};const binding={...body,bindingHash:await hashJSON(body)};
 const atlas=await sharp(fs.readFileSync(path.join(out,'parts/atlas/'+id+'.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
 const split=await splitObservedSurfaces(binding,record,probe,{fixedJoints:['root'],contactEndpoints:familyContactChains(familyContractForRecord(record)).map(c=>c.end),shapeJoints:declaration.parts.filter(p=>p.joint!=='root').map(p=>p.joint)});
 write('binding.json',split.binding);write('receipt.json',{intake,surfaces:split.receipt,textureSource:textureFile?path.relative(process.cwd(),textureFile):null,nativeAcceptance:false});console.log(JSON.stringify({id,intake,surfaces:split.receipt}));
}
