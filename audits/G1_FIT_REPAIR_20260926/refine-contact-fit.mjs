/** Diagnostic automatic tessellation refinement. No authoring, pixels, admission or motion edits. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {buildPaintSkin} from '../../port/v2/tools/creature-animation/build-paint-skin.mjs';
import {hashJSON} from '../../port/v2/tools/creature-animation/quadruped-template.mjs';
import {splitObservedSurfaces} from '../../port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {familyContactChains,familyContractForRecord} from '../../port/v2/tools/creature-animation/family-contracts.mjs';
const require=createRequire(new URL('../../port/v2/package.json',import.meta.url));const sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const [source,out]=process.argv.slice(2);if(!source||!out||fs.existsSync(out))throw Error('Usage: SOURCE_FIT NEW_OUTPUT');
fs.mkdirSync(out,{recursive:true});fs.copyFileSync(path.join(source,'record.json'),path.join(out,'record.json'));fs.cpSync(path.join(source,'parts'),path.join(out,'parts'),{recursive:true});
const read=n=>JSON.parse(fs.readFileSync(path.join(source,n)));const record=read('record.json'),old=read('pre-split-binding.json');
const {width,height}=record.geometry,chains=familyContactChains(familyContractForRecord(record));
const refinements=chains.map(c=>{const p=record.landmarks[c.end],x=Math.max(0,Math.floor(p[0]*width-56)),y=Math.max(0,Math.floor(p[1]*height-56));return{x,y,width:Math.min(width-x,112),height:Math.min(height-y,112),boundaryStep:4,interiorStep:8};});
let result;try{
const compiled=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:24,interiorStep:56,includeTopology:true,refinements});
const {bindingHash,...body}=compiled.binding;body.sourceJoinTopology=old.sourceJoinTopology;const binding={...body,bindingHash:await hashJSON(body)};
const atlas=await sharp(path.join(out,'parts/atlas',read('parts/manifest.json').creatureId+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
const split=await splitObservedSurfaces(binding,record,probe,{fixedJoints:['root'],shapeJoints:[...new Set(binding.parts.filter(p=>p.joint!=='root').map(p=>p.joint))],contactEndpoints:chains.map(c=>c.end)});
fs.writeFileSync(path.join(out,'binding.json'),JSON.stringify(split.binding,null,2)+'\n');result={status:'FIT_COMPILED',refinements,compiler:compiled.receipt,surfaces:split.receipt};
}catch(e){result={status:'REFUSED',error:String(e.stack??e),refinements};process.exitCode=1;}
fs.writeFileSync(path.join(out,'refinement-receipt.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,error:result.error?.split('\n')[0]}));
