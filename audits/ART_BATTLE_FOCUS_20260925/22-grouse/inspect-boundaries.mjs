import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import {splitObservedSurfaces} from '../../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {familyContactChains,familyContractForRecord} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
const d=import.meta.dirname,root=path.resolve(d,'../../..'),old=path.join(d,'fit-01'),out=path.join(d,'probe-only-unused'),req=createRequire(root+'/port/v2/package.json'),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
if(fs.existsSync(out))throw Error('New output required');
const read=n=>JSON.parse(fs.readFileSync(path.join(old,n))),record=read('record.json'),binding=read('pre-split-binding.json'),atlasFile=path.join(old,'parts/atlas/grouse.png'),atlas=await sharp(atlasFile).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}}),options={fixedJoints:['root'],shapeJoints:[...new Set(binding.parts.filter(p=>p.joint!=='root').map(p=>p.joint))],contactEndpoints:familyContactChains(familyContractForRecord(record)).map(c=>c.end),preservePaintBoundaries:true};
console.log(JSON.stringify({joins:probe.joins.map(j=>({a:j.ancestorPart,b:j.descendantPart,n:j.samples.length})),excluded:probe.excluded.map(j=>({a:j.ancestorPart,b:j.descendantPart,n:j.samples.length,reason:j.reason}))}));
