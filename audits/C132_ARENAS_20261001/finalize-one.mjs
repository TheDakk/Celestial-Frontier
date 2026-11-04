import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {validateArenaDelivery, ARENA_DELIVERY_CANVASES} from '../../port/v2/apps/game/src/battle2/arena-delivery.ts';

// Additive D29 candidate evidence. Never overwrites historical finalization, originals or acceptance.
const folder=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(folder,'../..');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(root,p));
const json=p=>JSON.parse(read(p));
const rel=p=>path.relative(root,p);
const roles=['far','mid','near'];
const reference='audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png';
const referenceSha='68f03f0233ec2ca89ddf39238cfaf1a30b83027a58beaea9fbb1735273720a38';
const require=createRequire(path.join(root,'port/v2/package.json'));
const sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const auditPath=p=>typeof p==='string'&&p.startsWith('audits/')&&!path.isAbsolute(p)&&!p.split('/').includes('..');
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});

export function assertReceipt(receipt,masterBytes,readFile=read){
 assert.equal(receipt.schema,'cf.c132-generation-original/v1');
 assert.equal(receipt.generator,'built-in image_gen');
 assert.equal(receipt.inputReference,reference);
 assert.equal(sha(readFile(reference)),referenceSha,'locked Living Worlds reference');
 assert.equal(receipt.qualityAccepted,false,'generation is not acceptance');
 assert.equal(receipt.originalPixelsModified,false,'unmodified source receipt');
 assert.equal(receipt.sourceSha256,receipt.retainedSha256,'exact tool-output copy');
 assert.equal(sha(masterBytes),receipt.sourceSha256,'selected master matches tool output');
 assert.equal(masterBytes.length,receipt.bytes,'original byte length');
 assert(auditPath(receipt.retainedMaster)&&auditPath(receipt.prompt?.path),'repo audit paths only');
 assert.equal(sha(readFile(receipt.retainedMaster)),receipt.retainedSha256,'retained original still exact');
 assert.equal(sha(readFile(receipt.prompt.path)),receipt.prompt.sha256,'exact generation prompt');
 assert(/^~\/\.codex\/generated_images\//.test(receipt.sourceToolOutput),'private tool path is home-relative');
}

export async function finalizeOne(id,notesPath){
 assert(/^[-a-z0-9]+$/.test(id),'single safe set id');
 assert(auditPath(notesPath),'notes must be a repo-relative audit path');
 const dir=path.join(folder,id),out=path.join(dir,'d29');
 assert(!fs.existsSync(out),'D29 outputs already exist; preserve the prior evidence');
 const prefix=rel(dir),intakePath=prefix+'/arena-manifest.json';
 assert(fs.existsSync(path.join(root,intakePath)),'Intake is incomplete: preserve its refusal; do not finalize as delivered');
 const bindings=new Map();
 const bind=p=>{assert(auditPath(p)||p.startsWith('port/v2/'),'bounded source');const v={path:p,sha256:sha(read(p))};bindings.set(p,v);return v;};
 const old=json(intakePath),notes=json(notesPath);
 assert.equal(old.schema,'cf.arena-intake/v1');
 assert.deepEqual(old.layers.map(l=>l.role),roles,'exact three-layer intake');
 assert.equal(notes.schema,'cf.c132-arena-visual-review/v1');
 assert.equal(notes.id,id);assert.equal(notes.qualityAccepted,false,'review cannot confer acceptance');
 assert(Array.isArray(notes.findings)&&notes.findings.length>0&&notes.findings.every(s=>typeof s==='string'&&s.trim()),'concrete observed findings required');
 assert(Array.isArray(notes.inspectedImages)&&notes.inspectedImages.includes(prefix+'/arena-composed-review.png'),'inspect the native-size composition');
 for(const p of notes.inspectedImages){assert(auditPath(p));bind(p);}
 bind(notesPath);bind(intakePath);
 assert.equal(sha(read(old.recipe.path)),old.recipe.sha256,'immutable intake recipe');bind(old.recipe.path);
 const recipe={...json(old.recipe.path),layers:{far:'opaque scene',mid:'magenta-keyed terrain',near:'magenta-keyed terrain'}};
 const masterPlates={},runtimePlates={},receipts=[];
 for(const [i,layer] of old.layers.entries()){
  assert.equal(recipe.plates[i].sha256,layer.source.sha256,'recipe master identity');
  const receiptPath=prefix+'/arena-'+layer.role+'.generation.json',receipt=json(receiptPath);
  assertReceipt(receipt,read(layer.source.path));receipts.push(bind(receiptPath));
  bind(receipt.prompt.path);bind(receipt.retainedMaster);bind(reference);
  for(const [record,dest] of [[layer.source,masterPlates],[layer.runtime,runtimePlates]]){
   assert(auditPath(record.path));assert.equal(sha(read(record.path)),record.sha256,'immutable master/runtime bytes');bind(record.path);
   const {data,info}=await sharp(read(record.path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   dest[layer.role]={width:info.width,height:info.height,rgba:data};
  }
 }
 const acceptance={schema:'cf.arena-template-acceptance/v1',qualityAccepted:false,acceptanceAuthority:'pending Dakk visual acceptance',groundLineNormalized:.78,
  plates:recipe.plates.map((p,i)=>({name:'arena-'+roles[i],masterSha256:p.sha256,qualityAccepted:false})),
  status:'PENDING. D29 admits native canvas dimensions; mechanical checks and visual review do not confer acceptance.'};
 const masterCandidate=validateArenaDelivery({recipe,plates:masterPlates});
 const runtimeCandidate=validateArenaDelivery({recipe,plates:runtimePlates});
 const registration=validateArenaDelivery({recipe,plates:masterPlates,acceptance});
 assert.equal(registration.ok,false);assert(registration.failures.some(s=>s.startsWith('acceptance.qualityAccepted:')),'false acceptance must refuse registration');
 const outPrefix=prefix+'/d29';
 const manifest={schema:'cf.arena-delivery/v1',id,biome:recipe.battleContext.biomeFamily,recipe:outPrefix+'/arena-delivery-recipe.json',acceptance:outPrefix+'/acceptance.pending.json',
  plates:Object.fromEntries(old.layers.map(l=>[l.role,{master:l.source.path,runtime:l.runtime.path,runtimeSha256:l.runtime.sha256}]))};
 bind('port/v2/apps/game/src/battle2/arena-delivery.ts');bind('port/v2/packages/domain/biome-profile/src/index.ts');bind(rel(fileURLToPath(import.meta.url)));
 for(const b of bindings.values())assert.equal(sha(read(b.path)),b.sha256,'source/input drift during finalization');
 const mechanicalPassed=masterCandidate.ok&&runtimeCandidate.ok;
 const report={schema:'cf.c132-arena-d29-review/v1',id,biome:manifest.biome,status:mechanicalPassed?'MECHANICAL_CANDIDATE_PASS_VISUAL_REVIEW_HELD':'MECHANICAL_AND_VISUAL_REVIEW_HELD',
  qualityAccepted:false,registered:false,nativeCanvas:recipe.canvasSize,admittedNativeCanvases:ARENA_DELIVERY_CANVASES,
  authority:'D29, DECIDED by Dakk 2026-10-02: native 1672×941 or native 2560×1440, no upscale. Signed anthropic/mac 02a94595c, merged into openai/mac.',
  historicalEvidence:'Prior finalization reports and requested kit dimensions remain unchanged. This additive report uses the merged D29 validator.',
  masterCandidate,runtimeCandidate,registration,originalMastersModified:false,upscaled:false,generationReceipts:receipts,sourceAndInputBindings:[...bindings.values()],
  review:{notes:notesPath,findings:notes.findings,scope:'Full-size image inspection only; no native film, player occlusion, acceptance or device qualification.'},
  remaining:['Resolve recorded visual holds and obtain independent full-size scoring','Dakk acceptance','Claude routing/wiring review and native battle proof']};
 fs.mkdirSync(out);
 write(path.join(out,'arena-delivery-recipe.json'),recipe);write(path.join(out,'acceptance.pending.json'),acceptance);write(path.join(out,'delivery.pending.json'),manifest);write(path.join(out,'delivery-review.json'),report);
 return {id,status:report.status,manifest:outPrefix+'/delivery.pending.json',masterCandidate,runtimeCandidate,registered:false,qualityAccepted:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [id,notes]=process.argv.slice(2);assert(id&&notes,'Usage: finalize-one.mjs ID audit-relative-review-notes.json');console.log(JSON.stringify(await finalizeOne(id,notes),null,2));
}
