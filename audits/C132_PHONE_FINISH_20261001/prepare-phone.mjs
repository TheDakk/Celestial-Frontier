/** Build a separate phone route manifest from immutable Mac evidence; no inference. */
import fs from 'node:fs/promises';import path from 'node:path';import {createHash} from 'node:crypto';
import {hashFile} from './verify-pins.mjs';import {PHONE_BYTE_LIMIT,PHONE_MODEL_ROUTES,PHONE_ORT_ROUTES,validatePhoneManifest} from './phone-route-contract.mjs';
const dir=import.meta.dirname,root=path.resolve(dir,'../..'),out=path.join(dir,'phone-probe');
const pin=JSON.parse(await fs.readFile(path.join(dir,'prepared-manifest.json'))),native=JSON.parse(await fs.readFile(path.join(dir,'native-mac-01/result.json'))),inputs=JSON.parse(await fs.readFile(path.join(dir,'prepared/inputs.json')));
if(native.status!=='CONSERVATION_PASS'||native.pinSha256!==(await hashFile(path.join(dir,'prepared-manifest.json'))).sha256||native.startIntegrity!=='PASS'||native.endIntegrity!=='PASS'||native.textEncoderReleased!==true)throw Error('Mac evidence identity');
const embedding=await fs.readFile(path.join(dir,'native-mac-01/embedding.f32'));if(embedding.length!==77*768*4||createHash('sha256').update(embedding).digest('hex')!==native.embedding.sha256||native.embedding.promptSha256!==native.promptSha256)throw Error('Embedding identity');
await fs.mkdir(out);await fs.writeFile(path.join(out,'embedding.f32'),embedding,{flag:'wx'});
const phoneInputs={...inputs,mode:'phone',embedding:native.embedding};await fs.writeFile(path.join(out,'inputs.json'),JSON.stringify(phoneInputs,null,2)+'\n',{flag:'wx'});
const routes=[];async function route(url,file,expected){const h=await hashFile(path.join(root,file));if(expected&&(expected.sha256!==h.sha256||expected.bytes!==undefined&&expected.bytes!==h.bytes))throw Error('Route source drift '+url);routes.push({route:url,file,...h});}
const rel=name=>path.relative(root,path.join(dir,name));
await route('/',rel('phone-index.html'));await route('/probe.mjs',rel('phone-bootstrap.mjs'));
await route('/client.mjs',rel('prepared/client.mjs'),pin.prepared.find(p=>p.file==='prepared/client.mjs'));
await route('/inputs.json',rel('phone-probe/inputs.json'));await route('/embedding.f32',rel('phone-probe/embedding.f32'),native.embedding);
for(const url of PHONE_MODEL_ROUTES){const model=pin.models.find(m=>'/models/'+m.route===url&&m.phone===true);if(!model)throw Error('Image model pin');await route(url,rel('model-cache/'+model.file),model);}
for(const url of PHONE_ORT_ROUTES){const runtime=pin.runtimeFiles.find(p=>p.route===url);if(!runtime||!native.requests.some(r=>r.method==='GET'&&r.path===url))throw Error('Native ORT closure');await route(url,runtime.file,runtime);}
for(const input of inputs.subjects)for(const kind of ['master','labels'])await route(input[kind].url,rel('prepared/'+input.id+'-'+kind+'.rgba'),input[kind]);
routes.sort((a,b)=>a.route.localeCompare(b.route));
const sources=[];for(const name of ['prepare-phone.mjs','serve-phone.mjs','phone-route-contract.mjs','phone-bootstrap.mjs','phone-index.html','proof-contract.mjs','verify-pins.mjs','VISUAL_REVIEW.md']){const file=rel(name);sources.push({file,...await hashFile(path.join(root,file))});}
for(const file of ['port/v2/tools/painted-creature/finish-conservation.mjs','tools/local-image-generation/creature-finish-math.mjs'])sources.push({file,...await hashFile(path.join(root,file))});
const manifest={schema:'cf.c132-phone-probe/v1',mode:'phone',visualVerdict:'REJECTED',qualityAccepted:false,deviceQualified:false,productAdmission:false,subjectIds:inputs.subjects.map(s=>s.id),embedding:native.embedding,
 provenance:{macHead:native.head,result:{file:rel('native-mac-01/result.json'),...await hashFile(path.join(dir,'native-mac-01/result.json'))},preparedManifest:{file:rel('prepared-manifest.json'),...await hashFile(path.join(dir,'prepared-manifest.json'))}},sources,routes,
 budget:{limitBytes:PHONE_BYTE_LIMIT,servedBytes:routes.reduce((n,r)=>n+r.bytes,0),modelBytes:routes.filter(r=>PHONE_MODEL_ROUTES.includes(r.route)).reduce((n,r)=>n+r.bytes,0),embeddingBytes:embedding.length,deviceResidentBytes:null,devicePeakGpuBytes:null},
 refusal:'Text encoder and tokenizer have no GET routes; all unknown/encoded/query/range paths and unlisted writes are refused. This is a rejected-candidate experiment, not game delivery.'};
validatePhoneManifest(manifest);await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PREPARED_ONLY_VISUALLY_REJECTED',routes:routes.length,...manifest.budget}));
