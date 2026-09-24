/** Packet-local authored intake orchestration; never edits shared writers or accepted inputs.
 * Run from /Users/nick/Projects/celestial-frontier-openai-mac:
 *   node /private/tmp/cf-sprint-intake.mjs PACKET_DIR NEW_FIT_DIR
 * PACKET_DIR holds master.png, authoring.json, subject-source.json, presence.json.
 * authoring.json: {id,family,landmarksPx:{joint:[x,y]},groundLineY:0.9,
 *   materials:{surface:"scales"},remainderPart:"body",
 *   parts:[{id:"body",joint:"root",layer:"near",polygonPx:[[0,0],[1,0],[0,1]]}],
 *   coverage?:object,habitat?:{realm,source}}
 * Polygons are first-match priority in master pixel space. The explicit remainder
 * gets every otherwise unclaimed visible pixel. All coordinates are authored data.
 * subject-source.json: {name,genome,visualKey,ownerId?:string} (speciesVisualKey also accepted)
 * presence.json: explicit cf.anatomy-presence/v2 input, including absent/hidden/folded.
 * Output is always NEW; any writer refusal is retained as refusal.json. No retries.
 * Static: node port/v2/tools/animation-completion/skin-audit.mjs FIT_DIR NEW_STATIC_JSON
 * That static owner measures full-family painted geometry, not contact or pixel rest.
 * Native battle2 (Claude source read-only, all output Codex/temp):
 *   node /Users/nick/Projects/celestial-frontier-anthropic-mac/port/v2/tools/battle2-proof/native-runner.mjs ABS_FIT ABS_FIT ABS_NEW_NATIVE_DIR ABS_SCRIPT
 * battle2 cpuP95Ms is the entire two-rig stage; it is not per-creature p95.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {familyContract,familyContractForRecord,familyContactChains} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-contracts.mjs';
import {sealFamilyRecord} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/family-record.mjs';
import {hashJSON} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/quadruped-template.mjs';
import {buildAuthoredParts} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/build-authored-parts.mjs';
import {intakeAuthoredPixels} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/authored-intake.mjs';
import {buildPaintSkin} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/build-paint-skin.mjs';
import {splitObservedSurfaces} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/creature-animation/split-observed-surfaces.mjs';
import {createSourceJoinProbe} from '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/tools/quadruped-proof/source-join-continuity.mjs';

const ROOT='/Users/nick/Projects/celestial-frontier-openai-mac';
const require=createRequire(path.join(ROOT,'port/v2/package.json'));
const sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const need=(ok,message)=>{if(!ok)throw Error('Sprint authored intake: '+message);};
const [packetArg,outArg]=process.argv.slice(2);
need(packetArg&&outArg&&process.argv.length===4,'usage: PACKET_DIR NEW_FIT_DIR');
const packet=path.resolve(packetArg),out=path.resolve(outArg);
need(packet.startsWith(ROOT+'/audits/'),'packet must be in the Codex audits tree');
need(out.startsWith(ROOT+'/audits/'),'output must be in the Codex audits tree');
need(!fs.existsSync(out),'new output directory required; no unchanged retry');
const inputFiles=['master.png','authoring.json','subject-source.json','presence.json'];
const bytes=Object.fromEntries(inputFiles.map(name=>[name,fs.readFileSync(path.join(packet,name))]));
const inputs=inputFiles.map(name=>({path:path.join(packet,name),sha256:sha(bytes[name])}));
const author=JSON.parse(bytes['authoring.json']),subject=JSON.parse(bytes['subject-source.json']),presence=JSON.parse(bytes['presence.json']);
const {data,info}=await sharp(bytes['master.png']).ensureAlpha().raw().toBuffer({resolveWithObject:true});
need(info.width===1254&&info.height===1254,'master must be the delivered 1254-square image; no resize');
need(/^[a-z0-9][a-z0-9-]{0,79}$/.test(author.id??''),'valid explicit authoring id');
need(typeof author.family==='string','explicit family');
need(typeof subject.name==='string'&&subject.name.length>0,'exact species name');
need(subject.genome&&Number.isInteger(subject.genome.seed),'source genome and integer seed');
const visualKey=subject.visualKey??subject.speciesVisualKey;
need(typeof visualKey==='string'&&visualKey.length>5,'source visualKey');
need(presence?.schema==='cf.anatomy-presence/v2'&&['absent','hidden','folded'].every(k=>Array.isArray(presence[k])),'explicit v2 absent, hidden and folded lists');
need(author.landmarksPx&&typeof author.landmarksPx==='object'&&!Array.isArray(author.landmarksPx),'manual landmarksPx object');
need(author.materials&&typeof author.materials.surface==='string','source material');
need(Array.isArray(author.parts)&&author.parts.length>0,'manual priority polygon parts');
need(typeof author.remainderPart==='string'&&author.parts.some(p=>p.id===author.remainderPart),'explicit painted remainder part');
const normalized=point=>{
  need(Array.isArray(point)&&point.length===2&&point.every(Number.isFinite),'manual finite pixel coordinate');
  return [point[0]/info.width,point[1]/info.height];
};
const parts=author.parts.map(p=>{
  need(Object.keys(p).every(k=>['id','joint','layer','polygonPx'].includes(k)),'unknown authored part field');
  need(Array.isArray(p.polygonPx)&&p.polygonPx.length>=3,'manual polygonPx');
  return {id:p.id,joint:p.joint,layer:p.layer,polygon:p.polygonPx.map(normalized)};
});
const masterFile=path.join(packet,'master.png');
fs.mkdirSync(out,{recursive:true});
const write=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
let stage='family-record',failure=null;
const provenance={schema:'cf.sprint-authored-intake/v1',status:'RUNNING',sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),helperSha256:sha(fs.readFileSync(fileURLToPath(import.meta.url))),inputs,manualAuthoring:true,sourceLabelsReused:false,sourceLandmarksReused:false,hiddenInference:false,options:{boundaryStep:24,interiorStep:56,includeTopology:true,fixedJoints:['root']},nativeAcceptance:false};
try {
  const contract=familyContract(author.family);
  const record=await sealFamilyRecord({kind:author.family, // Template id is not the optional taxonomy-family field.
    identity:{speciesVisualKey:visualKey,seed:subject.genome.seed,ownerId:subject.ownerId??`authored:archetype-sprint/${author.id}`,earthName:subject.name},
    template:{id:author.family,version:contract.version},clipSetId:contract.clipSetId,
    anatomy:presence,genome:subject.genome,
    geometry:{cutoutAssetHash:sha(bytes['master.png']),width:info.width,height:info.height,groundLineY:author.groundLineY,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},
    landmarks:Object.fromEntries(Object.entries(author.landmarksPx).map(([joint,p])=>[joint,normalized(p)])),
    materials:author.materials,source:masterFile,
    ...(author.habitat?{habitat:author.habitat}:{}),
    coverage:{scope:'One manually observed sprint painting; no family-wide visual acceptance',...(author.coverage??{}),nativeAcceptance:false},
    provenance:{authoringSha256:sha(bytes['authoring.json']),subjectSourceSha256:sha(bytes['subject-source.json']),presenceSha256:sha(bytes['presence.json']),sourceLabelsReused:false,sourceLandmarksReused:false,hiddenInference:false}
  });
  write('record.json',record);
  // True-alpha masters use the current P1 label writer, preserving delivered RGBA.
  // Opaque magenta masters retain the established authored-mask keyer branch.
  const hasTransparent=data.some((value,index)=>index%4===3&&value===0);
  let declarationBody;
  if(hasTransparent){
    stage='authored-labels';
    const checked=intakeAuthoredPixels(new Uint8ClampedArray(data),info.width,info.height);
    need(data.every((value,index)=>value===checked.rgba[index]),'delivered RGBA must remain unchanged');
    const inside=(x,y,polygon)=>{let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
    }return yes;};
    const fallback=parts.findIndex(part=>part.id===author.remainderPart);
    const labels=Buffer.alloc(info.width*info.height*4),counts=parts.map(()=>0);
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      const i=y*info.width+x;let label=0;
      if(data[i*4+3]){let owner=parts.findIndex(part=>inside((x+.5)/info.width,(y+.5)/info.height,part.polygon));if(owner<0)owner=fallback;label=owner+1;counts[owner]++;}
      labels.set([label,label,label,255],i*4);
    }
    const labelsPng=await sharp(labels,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
    fs.writeFileSync(path.join(out,'labels.png'),labelsPng,{flag:'wx'});
    declarationBody={schema:'cf.painter-part-intake/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,labelsFile:'labels.png',labelsSha256:sha(labelsPng),parts:parts.map(({polygon,...part})=>part)};
    write('label-authoring-receipt.json',{schema:'cf.sprint-authored-labels/v1',owner:'explicit new-master priority polygons; not source painter labels',counts,sourceLabelsReused:false,sourceLandmarksReused:false,rgbaChangedChannels:0,intake:checked.receipt,remainderPart:author.remainderPart});
    provenance.maskMode='authored polygons rasterized onto unchanged delivered positive alpha; cf.painter-part-intake/v1';
  }else{
    declarationBody={schema:'cf.authored-part-masks/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,remainderPart:author.remainderPart,parts};
    provenance.maskMode='opaque source; established authored-mask key/despill';
  }
  write('declaration.json',{...declarationBody,declarationHash:await hashJSON(declarationBody)});
  stage='authored-parts';
  const intake=await buildAuthoredParts({id:author.id,recordFile:path.join(out,'record.json'),masterFile,declarationFile:path.join(out,'declaration.json'),output:path.join(out,'parts')});
  stage='paint-skin';
  const compiled=await buildPaintSkin(path.join(out,'parts'),{seamBridges:{groups:[]}},record,{boundaryStep:24,interiorStep:56,includeTopology:true});
  const {bindingHash:_prior,...bindingBody}=compiled.binding;
  bindingBody.sourceJoinTopology={remainderPartId:author.remainderPart};
  const binding={...bindingBody,bindingHash:await hashJSON(bindingBody)};
  write('pre-split-binding.json',binding);
  stage='source-join-probe';
  const atlas=await sharp(fs.readFileSync(path.join(out,'parts/atlas',author.id+'.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
  stage='observed-split';
  const contactEndpoints=familyContactChains(familyContractForRecord(record)).map(c=>c.end);
  const shapeJoints=['bell',...Array.from({length:5},(_,i)=>`arm${i}Seg2`)];
  const split=await splitObservedSurfaces(binding,record,probe,{fixedJoints:['root'],contactEndpoints,shapeJoints});
  write('binding.json',split.binding);
  write('receipt.json',{schema:'cf.sprint-fit/v1',intake,paintSkin:compiled.receipt,surfaces:split.receipt,recordRecipeHash:record.recipeHash,bindingHash:split.binding.bindingHash,masterSha256:record.geometry.cutoutAssetHash,manualAuthoring:true,nativeAcceptance:false});
  provenance.status='FIT_COMPILED';
  provenance.recordRecipeHash=record.recipeHash;
  provenance.bindingHash=split.binding.bindingHash;
  provenance.contactEndpoints=contactEndpoints;
  provenance.shapeJoints=shapeJoints;
  console.log(JSON.stringify({status:provenance.status,out,parts:intake.parts,recordRecipeHash:record.recipeHash,bindingHash:split.binding.bindingHash}));
} catch(error) {
  failure={stage,error:String(error.stack??error)};
  provenance.status='REFUSED';
  write('refusal.json',failure);
  console.error(JSON.stringify({status:'REFUSED',out,...failure}));
  process.exitCode=1;
} finally {
  provenance.unchangedInputs=inputs.map(input=>({...input,unchanged:sha(fs.readFileSync(input.path))===input.sha256}));
  if(provenance.unchangedInputs.some(input=>!input.unchanged)){
    provenance.status='INPUT_CHANGED';
    process.exitCode=1;
  }
  if(failure)provenance.refusal=failure;
  write('intake-provenance.json',provenance);
}
