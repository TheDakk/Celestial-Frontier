/** Read-only reconstruction of the failed split up to contact-lock admission.
 * The instrumented copy returns metadata before diffusion/output. No fit writer,
 * binding admission, source edit, gate change, or automatic retry is performed. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {fileURLToPath,pathToFileURL} from 'node:url';
import {createSourceJoinProbe} from '../../../port/v2/tools/quadruped-proof/source-join-continuity.mjs';
import {familyContractForRecord,familyContactChains} from '../../../port/v2/tools/creature-animation/family-contracts.mjs';
const root='/Users/nick/Projects/celestial-frontier-openai-mac',packet=path.dirname(fileURLToPath(import.meta.url)),out=path.join(packet,'contact-pin-diagnosis-01');
assert(!fs.existsSync(out),'Fresh diagnosis output required');fs.mkdirSync(out);
const sha=b=>createHash('sha256').update(b).digest('hex'),inputs=[],read=p=>{const bytes=fs.readFileSync(p);inputs.push({path:p,sha256:sha(bytes)});return bytes;},json=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const req=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const writer=path.join(root,'port/v2/tools/creature-animation/split-observed-surfaces.mjs'),source=read(writer).toString();
const anchor=" for(const {joint,supports}of contactPins)for(const i of supports){need(!locked.has(i)||locked.get(i)===joint,'contact conflicts with fixed owner');locked.set(i,joint);}";
assert.equal(source.split(anchor).length,2,'Exact diagnostic span');
const replacement=` const metadata=Array(vertices.length);
 for(const [,members]of groups){const i=remap.get(members[0]);metadata[i]={splitVertex:i,originalVertex:keys[members[0]].old,source:[vertices[i].x,vertices[i].y],parts:[...new Set(members.map(m=>keys[m].part))],ownerJoints:[...new Set(members.map(m=>rawOwners[m]))]};}
 const contacts=contactPins.map(pin=>{const p=parts.find(p=>p.id===pin.part),v=p.vertices[pin.vertex],xy=[0,0];for(let k=0;k<3;k++){xy[0]+=vertices[v.triangle[k]].x*v.barycentric[k];xy[1]+=vertices[v.triangle[k]].y*v.barycentric[k];}return{...pin,landmark:record.landmarks[pin.joint].map((v,i)=>v*(i?record.geometry.height:record.geometry.width)),selectedSource:xy,interpolation:v,supportDetails:pin.supports.map(i=>({...metadata[i],initialLock:locked.get(i)??null}))};});
 const conflicts=[];
 for(const pin of contacts)for(const i of pin.supports){const owner=locked.get(i);if(owner!==undefined&&owner!==pin.joint)conflicts.push({joint:pin.joint,part:pin.part,lockedOwner:owner,support:metadata[i]});else locked.set(i,pin.joint);}
 return {diagnosticOnly:true,contacts,conflicts,firstRefusal:conflicts[0]??null,sourceVertices:source.length,splitVertices:vertices.length,observedJoinCount:probe.joins.length};`;
let instrumented=source.replace(anchor,replacement);
for(const name of ['quadruped-template.mjs','smooth-skin-weights.mjs']){const from="'./"+name+"'",to=JSON.stringify(pathToFileURL(path.join(path.dirname(writer),name)).href);assert.equal(instrumented.split(from).length,2);instrumented=instrumented.replace(from,to);}
fs.writeFileSync(path.join(out,'split-observed-surfaces.before.mjs'),source,{flag:'wx'});fs.writeFileSync(path.join(out,'split-observed-surfaces.diagnostic.mjs'),instrumented,{flag:'wx'});
let report={schema:'cf.contact-pin-refusal-diagnosis/v1',status:'RUNNING',sourceWriterSha256:sha(source),instrumentedSha256:sha(instrumented),transformation:{anchor,replacement,relativeImports:'two imports made absolute without semantic change'},scope:'Existing pre-split binding only. Return observations before the exact failed contact-lock gate; no diffusion, final binding, real intake, static test or native film.'};
try{
  const binding=JSON.parse(read(path.join(packet,'fit-01/pre-split-binding.json'))),record=JSON.parse(read(path.join(packet,'fit-01/record.json'))),author=JSON.parse(read(path.join(packet,'candidate-03/authoring.json')));
  const atlasBytes=read(path.join(packet,'fit-01/parts/atlas',author.id+'.png')),atlas=await sharp(atlasBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const labels=await sharp(read(path.join(packet,'fit-01/labels.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const master=await sharp(read(path.join(packet,'candidate-03/master.png'))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const probe=createSourceJoinProbe({record,binding,atlas:{rgba:atlas.data,width:atlas.info.width,height:atlas.info.height}});
  const mod=await import(pathToFileURL(path.join(out,'split-observed-surfaces.diagnostic.mjs')).href),endpoints=familyContactChains(familyContractForRecord(record)).map(c=>c.end);
  const result=await mod.splitObservedSurfaces(binding,record,probe,{fixedJoints:['root'],shapeJoints:[],contactEndpoints:endpoints});assert(result.firstRefusal,'Expected retained contact conflict must reproduce');
  const fields=new Map(binding.paintSkin.parts.map(p=>[p.id,p])),partLabel=new Map(author.parts.map((p,i)=>[p.id,i+1])),rootLabel=partLabel.get(author.remainderPart);
  const supports=(part,sample)=>new Set(sample.triangle.flatMap(i=>fields.get(part).vertices[i].triangle));
  for(const conflict of result.conflicts){
    const relevant=probe.joins.filter(j=>[j.ancestorPart,j.descendantPart].includes(conflict.part)&&[j.ancestorPart,j.descendantPart].includes(author.remainderPart));
    conflict.welds=relevant.map(j=>{const samples=j.samples.filter(s=>supports(j.ancestorPart,s.ancestor).has(conflict.support.originalVertex)&&supports(j.descendantPart,s.descendant).has(conflict.support.originalVertex));return{name:j.name,sourceEdges:j.sourceEdges.filter(edge=>samples.some(s=>s.source[0]>=Math.min(edge[0][0],edge[1][0])&&s.source[0]<=Math.max(edge[0][0],edge[1][0])&&s.source[1]>=Math.min(edge[0][1],edge[1][1])&&s.source[1]<=Math.max(edge[0][1],edge[1][1]))),samples:samples.map(s=>s.source)};}).filter(j=>j.samples.length);
    const contact=result.contacts.find(c=>c.joint===conflict.joint),box=binding.parts.find(p=>p.id===conflict.part).cutout,rootPixels=[];
    for(let y=box.y;y<box.y+box.height;y++)for(let x=box.x;x<box.x+box.width;x++){const i=y*master.info.width+x,alpha=master.data[i*4+3];if(alpha>0&&labels.data[i*4]===rootLabel)rootPixels.push({x,y,alpha,distanceToEndpoint:Math.hypot(x+.5-contact.landmark[0],y+.5-contact.landmark[1])});}
    rootPixels.sort((a,b)=>a.distanceToEndpoint-b.distanceToEndpoint||a.y-b.y||a.x-b.x);conflict.rootPixelsInLimbFrame={count:rootPixels.length,nearestToEndpoint:rootPixels.slice(0,24)};
    conflict.authoredPolygon=author.parts.find(p=>p.id===conflict.part).polygonPx;
  }
  report={...report,status:'DIAGNOSED',recordRecipeHash:record.recipeHash,bindingHash:binding.bindingHash,contactCount:endpoints.length,...result};
  json('source-join-probe.json',probe);
}catch(error){report.status='REFUSED';report.error=String(error.stack??error);process.exitCode=1;console.error(report.error);}
finally{report.inputs=inputs.map(input=>({...input,afterSha256:sha(fs.readFileSync(input.path))}));if(report.inputs.some(i=>i.sha256!==i.afterSha256)){report.status='SOURCE_CHANGED';process.exitCode=1;}json('report.json',report);console.log(JSON.stringify({status:report.status,contacts:report.contacts?.length,conflicts:report.conflicts?.length,firstRefusal:report.firstRefusal,out}));}
