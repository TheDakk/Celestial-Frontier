import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {splitObservedSurfaces} from '../../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {familyContactChains,familyContractForRecord} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
const d=import.meta.dirname,root=path.resolve(d,'../../..'),old=path.join(d,'fit-01'),out=path.join(d,'fit-02'),req=createRequire(root+'/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
if(fs.existsSync(out))throw Error('New output required');
const read=n=>JSON.parse(fs.readFileSync(path.join(old,n))),record=read('record.json'),binding=read('pre-split-binding.json'),atlasFile=path.join(old,'parts/atlas/grouse.png'),atlas=await sharp(atlasFile).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}}),options={fixedJoints:['root'],shapeJoints:[...new Set(binding.parts.filter(p=>p.joint!=='root').map(p=>p.joint))],contactEndpoints:familyContactChains(familyContractForRecord(record)).map(c=>c.end),paintBoundaryPairs:[['root-patch','torso'],['torso','far-wing-shoulder'],['torso','near-wing-shoulder']]};
const split=await splitObservedSurfaces(binding,record,probe,options);
fs.cpSync(old,out,{recursive:true});fs.writeFileSync(path.join(out,'binding.json'),JSON.stringify(split.binding,null,2)+'\n');
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
fs.writeFileSync(path.join(out,'flat-master-weld-receipt.json'),JSON.stringify({schema:'cf.flat-master-weld/v1',sourceFit:'fit-01',sourceRecordSha256:sha(old+'/record.json'),sourceBindingSha256:sha(old+'/pre-split-binding.json'),sourceAtlasSha256:sha(atlasFile),helperSha256:sha(import.meta.filename),options,receipt:split.receipt,bindingHash:split.binding.bindingHash,scope:'Only this new unadmitted Grouse candidate: tiny root/torso interior and both proximal wing/torso feather junctions. Independent wings/legs remain separate. No source paint, solver, contract or limits change. Prior intake receipts describe inherited fit-01 inputs; this receipt owns the new split.'},null,2)+'\n');
console.log(JSON.stringify({fit:'fit-02',bindingHash:split.binding.bindingHash,...split.receipt}));

fs.writeFileSync(path.join(out,'paint-boundary-continuity.json'),JSON.stringify({schema:'cf.authored-paint-boundary-continuity/v1',recordRecipeHash:record.recipeHash,bindingHash:split.binding.bindingHash,pairs:options.paintBoundaryPairs},null,2)+'\n',{flag:'wx'});
