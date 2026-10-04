import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
const base=path.relative(process.cwd(),import.meta.dirname),sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const [mode,id,generatedPath]=process.argv.slice(2);
const rows=read(base+'/pilot.json'),observations=read(base+'/observations.json');
if(mode==='prepare'){
 const successors=[];
 for(const row of rows){
  const observed=observations.find(o=>o.id===row.id);if(observed.framing.status!=='REFUSE')continue;
  const old=row.packet,packet=old+'-framing02',sid=row.id+'-framing02';fs.mkdirSync(packet);
  const q=read(old+'/request.json'),oldPrompt=fs.readFileSync(old+'/prompt.txt','utf8');
  const correction=`FRAMING SUCCESSOR ONLY — ${row.name}. The first attached image is the exact prior original, retained as a failed-margin control. Paint one new farther-out version at native 1254 x 1254 pixels. The ENTIRE animal INCLUDING every tail, bill, barbel and fin tip must fit comfortably inside the CENTRAL 60% of the canvas width and height, from pixel 251 through 1002. Leave broad empty pure magenta (#FF00FF) on all four sides. Make the subject clearly smaller in the frame; do not shorten, amputate or crop any appendage to achieve clearance. Preserve the same identity, pose, visible anatomy and natural painted treatment, with the second attached Discovery Atlas as the frozen style reference. No new scene, ground, shadow, text, border or extra anatomy. This is a new generator-painted composition successor, never a local rescale or crop. Existing anatomical/style concerns in the first original remain unaccepted; the requested change is framing only.`;
  const prompt=correction+'\n\n'+oldPrompt+'\n\n'+correction+'\n';
  for(const name of ['subject-source.json','prompt.canonical.txt'])fs.copyFileSync(old+'/'+name,packet+'/'+name,fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(packet+'/prompt.txt',prompt,{flag:'wx'});
  const request={...q,promptSha256:sha(prompt),framingSuccessor:{originalId:row.id,originalMaster:row.master,originalMasterSha256:sha(fs.readFileSync(row.master)),originalPrompt:old+'/prompt.txt',originalPromptSha256:sha(oldPrompt),originalRequest:old+'/request.json',originalRequestSha256:sha(fs.readFileSync(old+'/request.json')),originalFraming:observed.framing,correction,preparerSha256:sha(fs.readFileSync(import.meta.filename)),references:[{path:row.master,sha256:sha(fs.readFileSync(row.master))},{path:q.reference,sha256:q.referenceSha256}],attempt:1,localRescale:false}};
  fs.writeFileSync(packet+'/request.json',JSON.stringify(request,null,2)+'\n',{flag:'wx'});
  successors.push({...row,id:sid,packet,master:packet+'/master.png',supersedes:row.id,selectedFor:'framing-only successor pending unchanged check'});
 }
 fs.writeFileSync(base+'/pilot-framing-successors.json',JSON.stringify(successors,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({prepared:successors.length}));
}else if(mode==='retain'){
 const row=read(base+'/pilot-framing-successors.json').find(r=>r.id===id);if(!row)throw Error('Unknown successor');
 const q=read(row.packet+'/request.json'),bytes=fs.readFileSync(generatedPath),actual=path.resolve(generatedPath),home=os.homedir();
 if(sha(fs.readFileSync(row.packet+'/prompt.txt'))!==q.promptSha256)throw Error('Stale prompt');
 fs.writeFileSync(row.master,bytes,{flag:'wx'});
 const generation={id:row.id,name:row.name,sourcePath:actual.startsWith(home+'/')?'~/'+actual.slice(home.length+1):path.relative(process.cwd(),actual),tool:'image_gen.imagegen',transparentBackground:false,masterSha256:sha(bytes),bytes:bytes.length,promptSha256:q.promptSha256,styleReferenceSha256:q.referenceSha256,referencedImages:q.framingSuccessor.references,outputModified:false,sourceOriginalRetained:true,handAuthoring:false,editSuccessor:true,localRescale:false};
 fs.writeFileSync(row.packet+'/generation.json',JSON.stringify(generation,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({id,sha256:generation.masterSha256,bytes:bytes.length}));
}else throw Error('prepare or retain required');
