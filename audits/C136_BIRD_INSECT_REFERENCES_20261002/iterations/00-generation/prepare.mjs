import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base='audits/C136_BIRD_INSECT_REFERENCES_20261002',sha=b=>createHash('sha256').update(b).digest('hex');
const sources=[['02-egret','audits/G2_C121_20260927/02-egret'],['03-stork','audits/G2_C121_20260927/03-stork'],['18-wasp','audits/G2_C121_20260927/18-wasp'],['24-water-strider','audits/G2_C136_REPAIRS_20261002/24-water-strider']],rows=[],originals=[];
for(const [id,source] of sources){
 const packet=base+'/'+id,subject=JSON.parse(fs.readFileSync(source+'/subject-source.json'));
 fs.mkdirSync(packet,{recursive:true});
 for(const file of ['master.png','prompt.txt','subject-source.json','request.json','compiler-inputs.json','generation.json'])if(fs.existsSync(source+'/'+file))fs.copyFileSync(source+'/'+file,packet+'/'+file,fs.constants.COPYFILE_EXCL);
 const original={id,name:subject.name,family:subject.family,packet,master:packet+'/master.png',sourcePacket:source};originals.push(original);
 if(subject.family!=='biped-bird'){rows.push(original);continue;}
 const successor=packet+'/candidate-02';fs.mkdirSync(successor);
 for(const file of ['subject-source.json','compiler-inputs.json'])fs.copyFileSync(source+'/'+file,successor+'/'+file,fs.constants.COPYFILE_EXCL);
 const originalPrompt=fs.readFileSync(source+'/prompt.txt','utf8'),request=JSON.parse(fs.readFileSync(source+'/request.json'));
 const instruction='TARGETED ANATOMICAL REFERENCE EDIT: preserve this exact '+subject.name+' painting, its species identity, long neck, bill, feather colours, natural tail, both legs, toes and two grounded feet. Keep the near wing naturally folded against the body. Expose the bird\'s EXISTING far wing by lifting it slightly upward and back, enough that its continuous shoulder attachment, folded elbow and complete tip are visibly distinct above the near wing. Exactly TWO wings total, never an added third wing. No invented feathers, no flying pose and no raised foot. The far wing is physically present but concealed in the input; repaint only that natural pose adjustment. This controlled reference pose overrides the ordinary both-wings-folded request below. Keep generous magenta margins on every edge; no floor, scenery, labels, grid or cast shadow. Retain a fully connected crown, beak and nape without floating feather dabs. Preserve 1254 by 1254 output size.';
 const prompt=instruction+'\n\n'+originalPrompt+'\n\n'+instruction+'\n';
 fs.writeFileSync(successor+'/prompt.txt',prompt,{flag:'wx'});
 fs.writeFileSync(successor+'/request.json',JSON.stringify({...request,promptSha256:sha(prompt),basePromptSha256:request.promptSha256,editSource:packet+'/master.png',editSourceSha256:sha(fs.readFileSync(packet+'/master.png')),editInstruction:instruction,requestedVisibleWings:2,observedVisibleWings:null,purpose:'Manual standing/long-legged bird reference candidate, not coverage or a hidden-wing policy change.',editCompilerSha256:sha(fs.readFileSync(import.meta.filename))},null,2)+'\n',{flag:'wx'});
 rows.push({...original,packet:successor,master:successor+'/master.png',originalPacket:packet});
}
fs.writeFileSync(base+'/original-pilot.json',JSON.stringify(originals,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(base+'/pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
