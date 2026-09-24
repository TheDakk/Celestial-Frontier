/** One source-preserving candidate using the existing observed-boundary option. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {splitObservedSurfaces} from '../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
const root=process.cwd(),original=path.join(root,'audits/ARCHETYPE_SPRINT_20260922/05-serpent/fit-01'),out=path.join(import.meta.dirname,'candidate-01');
if(fs.existsSync(out))throw Error('Fresh candidate required');
const req=createRequire(path.join(root,'port/v2/package.json')),{PNG}=createRequire(req.resolve('free-tex-packer-core'))('pngjs');
const record=JSON.parse(fs.readFileSync(path.join(original,'record.json'))),input=JSON.parse(fs.readFileSync(path.join(original,'pre-split-binding.json'))),atlas=PNG.sync.read(fs.readFileSync(path.join(original,'parts/atlas/python.png')));
const probe=createSourceJoinProbe({record,binding:input,atlas:{width:atlas.width,height:atlas.height,rgba:atlas.data}}),options={fixedJoints:['root'],shapeJoints:input.parts.filter(p=>p.joint!=='root').map(p=>p.joint),contactEndpoints:[],preservePaintBoundaries:true};
const result=await splitObservedSurfaces(input,record,probe,options);
fs.mkdirSync(out);fs.cpSync(path.join(original,'parts'),path.join(out,'parts'),{recursive:true,errorOnExist:true,force:false});fs.copyFileSync(path.join(original,'record.json'),path.join(out,'record.json'));fs.writeFileSync(path.join(out,'binding.json'),JSON.stringify(result.binding,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({scope:'Candidate only, not accepted. Preserve all observed paint cuts in flattened coiled master; no hidden paint invented.',source:original,options,receipt:result.receipt,bindingHash:result.binding.bindingHash,sourceCoordinateChanges:result.receipt.sourceCoordinateChanges},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result.receipt));
