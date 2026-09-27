import fs from 'node:fs';import{createHash}from'node:crypto';import{compileLibraryMaster}from'../../port/v2/tools/painted-creature/compile-library-master.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),base='audits/G2_C76_20260927';
const names=JSON.parse(fs.readFileSync(base+'/queued-names.json')).names,rows=[];
const clarification='COMPOSITION SCALE: the complete creature, including tail, bill, antennae, horns and every toe, fits inside the central rectangle from pixel 200 to pixel 1054 on both axes of the 1254 square. Leave at least 200 pixels of plain magenta on all four sides. Make the animal smaller to leave this generous empty margin; never crop anatomy, shorten a tail, or zoom to fill the square. No border or drawn rectangle. This framing instruction changes only subject placement and scale, never species anatomy or the approved paint style.';
for(const [i,name]of names.entries()){
 const id=String(i+1).padStart(2,'0')+'-'+name.toLowerCase().replaceAll(' ','-'),packet=base+'/'+id,r=await compileLibraryMaster(name,packet),file=packet+'/prompt.txt',old=fs.readFileSync(file,'utf8'),request=JSON.parse(fs.readFileSync(packet+'/request.json'));
 if(sha(old)!==request.promptSha256||old.split('LAYOUT\n').length!==2)throw Error('Exact base prompt/layout required');
 const prompt=old.replace('LAYOUT\n','LAYOUT\n'+clarification+'\n');fs.writeFileSync(file+'.tmp',prompt,{flag:'wx'});fs.renameSync(file+'.tmp',file);
 fs.writeFileSync(packet+'/request.json.tmp',JSON.stringify({...request,basePromptSha256:request.promptSha256,promptSha256:sha(prompt),layoutCompilerSha256:sha(fs.readFileSync(import.meta.filename)),layoutClarification:clarification},null,2)+'\n',{flag:'wx'});fs.renameSync(packet+'/request.json.tmp',packet+'/request.json');
 rows.push({id,name,family:r.family,packet,master:packet+'/master.png'});console.log(id,r.family);
}
fs.writeFileSync(base+'/pilot.json',JSON.stringify(rows,null,2)+'\n',{flag:'wx'});
