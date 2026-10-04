import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {validateArenaDelivery} from '../../port/v2/apps/game/src/battle2/arena-delivery.ts';
import {BIOME_PROFILE_KEYS_V1} from '../../port/v2/packages/domain/biome-profile/src/index.ts';

// Add delivery diagnostics without rewriting any original, old intake or generation receipt.
const folder=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(folder,'../..');
const rel=p=>path.relative(root,p),read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const bound=p=>({path:p,sha256:sha(read(p))});
const require=createRequire(path.join(root,'port/v2/package.json'));
const sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const write=(p,value)=>fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const inventory=JSON.parse(fs.readFileSync(path.join(folder,'inventory.json')));
const selected=['freshwater-lake-v2','coral','dunesea','tundra','jungle-v2','savanna-v2','marsh','karst-cave'];
const notes={
 'freshwater-lake-v2':['Replacement NEAR removes the former straight silhouette, but a bottom texture/color transition remains visible.','Small high-chroma edge pixels remain; zero unresolved-edge metric does not prove a clean composition.'],
 coral:['Distinct underwater reef depth; no visible background fish in the selected FAR.','Some pink/mauve edge content and doubled terrain contours remain in the full composition.'],
 dunesea:['Selected FAR replaces the rejected sky with invented moons.','Layered terrain contours and mauve boundary bands remain conspicuous; shared light/ground needs visual refinement.'],
 tundra:['Replacement MID removes the rejected ultra-wide canvas and pseudo-text marks.','Composition is coherent at the two fighting stands; snow/terrain transition still needs independent full-size scoring.'],
 'jungle-v2':['Replacement MID removes the visibly chopped left trunk in the first version.','Bright magenta/green edge remnants remain around side foliage; the deep background may compete with combatants.'],
 'savanna-v2':['Replacement MID removes the baked mauve distant mountains and chopped canopy from the first version.','NEAR still creates a strong horizontal foreground texture boundary; magenta fringe is visible around small side details.'],
 marsh:['Clear silt runway and wetland identity.','The middle reed/water edge forms a conspicuous duplicated gray shelf across the background; magenta remnants remain on reeds.'],
 'karst-cave':['Replacement NEAR corrects the rejected ultra-wide source.','Cave framing is coherent and runway clear; scattered magenta edge remnants and differing layer detail still require visual repair.'],
};
const amendments=[];
function frozenParts(s){
 const a='\n\nSUBJECT\n',i=s.indexOf(a);assert(i>0&&s.lastIndexOf(a)===i,'unique SUBJECT');
 const candidates=['\n\nACCURACY\n','\n\nLAYOUT\n'].map(m=>s.indexOf(m,i+a.length)).filter(n=>n>=0);
 const end=Math.min(...candidates);assert(end>i,'subject terminator');return[s.slice(0,i),s.slice(end)];
}
const current=structuredClone(inventory);
assert.deepEqual(current.templates.filter(t=>t.habitatVariant===null).map(t=>t.profileKey).sort(),[...BIOME_PROFILE_KEYS_V1].sort());
for(const t of current.templates){
 for(const p of t.prompts){
  const actual=sha(read(p.path));
  if(actual!==p.sha256){
   const role=/arena-(far|mid|near)\.prompt\.txt$/.exec(p.path)[1];
   const original=path.posix.join(path.posix.dirname(p.path),`original-${role}.prompt.txt`);
   assert.equal(sha(read(original)),p.sha256,'preserved compiler prompt hash');
   assert.deepEqual(frozenParts(read(original).toString()),frozenParts(read(p.path).toString()),'only SUBJECT amended');
   amendments.push({original:bound(original),current:bound(p.path),scope:'SUBJECT only; frozen reference, style, accuracy, layout, technical and negative blocks unchanged'});
  }
  p.sha256=actual;
 }
}
// Repair prompts likewise retain everything outside their SUBJECT. Their filenames are not compiler outputs.
for(const t of inventory.templates){
 const dir=path.join(folder,t.id);
 for(const name of fs.readdirSync(dir).filter(n=>/^arena-(far|mid|near)-repair\.prompt\.txt$/.test(n))){
  const role=/arena-(far|mid|near)-repair/.exec(name)[1],base=path.join(dir,`arena-${role}.prompt.txt`),repair=path.join(dir,name);
  assert.deepEqual(frozenParts(fs.readFileSync(base,'utf8')),frozenParts(fs.readFileSync(repair,'utf8')),'repair changes SUBJECT only');
  amendments.push({original:bound(rel(base)),current:bound(rel(repair)),scope:'repair SUBJECT only; frozen blocks unchanged'});
 }
}
const deliveries=[];
for(const id of selected){
 const dir=path.join(folder,id),prefix=rel(dir),old=JSON.parse(fs.readFileSync(path.join(dir,'arena-manifest.json')));
 const recipe={...JSON.parse(fs.readFileSync(path.join(dir,'arena-recipe.json'))),layers:{far:'opaque scene',mid:'magenta-keyed terrain',near:'magenta-keyed terrain'}};
 const recipePath=prefix+'/arena-delivery-recipe.json';write(path.join(root,recipePath),recipe);
 const acceptance={schema:'cf.arena-template-acceptance/v1',qualityAccepted:false,acceptanceAuthority:'pending Dakk visual acceptance',groundLineNormalized:.78,
  plates:recipe.plates.map((p,i)=>({name:'arena-'+['far','mid','near'][i],masterSha256:p.sha256,qualityAccepted:false})),
  status:'PENDING; resolution and visual holds remain. This record is not acceptance.'};
 const acceptancePath=prefix+'/acceptance.pending.json';write(path.join(root,acceptancePath),acceptance);
 const manifest={schema:'cf.arena-delivery/v1',id,biome:recipe.battleContext.biomeFamily,recipe:recipePath,acceptance:acceptancePath,
  plates:Object.fromEntries(old.layers.map(l=>[l.role,{master:l.source.path,runtime:l.runtime.path,runtimeSha256:l.runtime.sha256}]))};
 const manifestPath=prefix+'/delivery.pending.json';write(path.join(root,manifestPath),manifest);
 const plates={},runtimePlates={};
 for(const layer of old.layers){
  for(const [record,dest] of [[layer.source,plates],[layer.runtime,runtimePlates]]){
   assert.equal(sha(read(record.path)),record.sha256,'immutable master/runtime hash');
   const {data,info}=await sharp(read(record.path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   dest[layer.role]={width:info.width,height:info.height,rgba:data};
  }
 }
 const masterCandidate=validateArenaDelivery({recipe,plates}),runtimeCandidate=validateArenaDelivery({recipe,plates:runtimePlates});
 const registration=validateArenaDelivery({recipe,plates,acceptance});
 assert.equal(masterCandidate.ok,false);assert(masterCandidate.failures.some(f=>f.startsWith('canvas:')));
 assert.equal(registration.ok,false);assert(registration.failures.some(f=>f.startsWith('acceptance.qualityAccepted:')));
 const row={id,biome:manifest.biome,status:'HELD_NATIVE_RESOLUTION_AND_VISUAL_REVIEW',qualityAccepted:false,manifest:bound(manifestPath),
  nativeCanvas:recipe.canvasSize,requiredCanvas:{width:2560,height:1440},
  masterCandidate,runtimeCandidate,registration,originalMastersModified:false,upscaled:false,
  review:{method:'Full composition inspected at original pixel dimensions; not a film or player-occlusion proof',image:bound(prefix+'/arena-composed-review.png'),findings:notes[id]},
  remaining:['Native 2560×1440 separately generated masters','Visual repair and independent full-size scoring','Dakk acceptance','Claude route/wiring review and native battle proof']};
 write(path.join(dir,'delivery-review.json'),row);deliveries.push(row);
}
const generationReceipts=[];
for(const entry of fs.readdirSync(folder,{withFileTypes:true}).filter(e=>e.isDirectory())){
 for(const name of fs.readdirSync(path.join(folder,entry.name)).filter(n=>n.endsWith('.generation.json'))){
  const p=path.join(folder,entry.name,name),r=JSON.parse(fs.readFileSync(p));
  assert.equal(r.sourceSha256,r.retainedSha256,'byte-copy receipt');
  assert.equal(sha(read(r.retainedMaster)),r.retainedSha256,'retained original');
  assert.equal(sha(read(r.prompt.path)),r.prompt.sha256,'exact generation prompt');
  generationReceipts.push(bound(rel(p)));
 }
}
current.baseInventory=bound(rel(path.join(folder,'inventory.json')));current.sourceSnapshot='Original compiler inputs retained in inventory.json; current prompt hashes include SUBJECT-only refinements.';
current.templates.forEach(t=>{const finalId=selected.find(id=>id===t.id||id===t.id+'-v2');if(finalId){t.status='CANDIDATE_HELD_NATIVE_RESOLUTION';t.candidate=finalId;}});
write(path.join(folder,'inventory-current.json'),current);
write(path.join(folder,'prompt-amendments.json'),{schema:'cf.c132-arena-prompt-amendments/v1',frozenBlocksVerified:true,amendments});
const result={schema:'cf.c132-arena-delivery-review/v1',canonicalFamilies:43,habitatVariants:2,preparedPrompts:135,candidateTriplets:8,
 acceptedTriplets:0,registeredTriplets:0,actualNativeCanvas:{width:1672,height:941},requiredNativeCanvas:{width:2560,height:1440},
 validator:bound('port/v2/apps/game/src/battle2/arena-delivery.ts'),validatorScope:'Exact shipped pure validator, decoded original masters and keyed runtime copies; no browser or native epoch',
 noCertificateRebinding:true,generationReceipts,deliveries,
 nextCanonicalPriority:['archipelago','mangrove','packice','canyon','boulder'],
 nextGeneration:'Held: builtin generation returned non-admissible dimensions despite exact technical prompt. Preserve all 43-family prompts; do not mass-generate more non-admissible sources.'};
write(path.join(folder,'delivery-summary.json'),result);
console.log(JSON.stringify({candidates:8,accepted:0,registered:0,canonicalPrompts:43,habitatVariants:2,amendments:amendments.length,generationReceipts:generationReceipts.length,failures:deliveries.map(d=>({id:d.id,master:d.masterCandidate.failures,runtime:d.runtimeCandidate.failures}))},null,2));
