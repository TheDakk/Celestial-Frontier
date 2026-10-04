import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex');
const rows=JSON.parse(fs.readFileSync(base+'/pilot.json'));
const note='FINAL COMPOSITION CHECK: the 1254 by 1254 square is mostly empty magenta. Zoom the creature OUT, making it TINY within the image. The COMPLETE silhouette, including both the long tail tip and snout, must lie within the central rectangle x=314 through x=940, y=314 through y=940. Do not let any toe, tail or nose approach the outer half of the canvas. The bounding rectangle is a placement instruction only: DO NOT PAINT A RECTANGLE, RULER, GRID OR LABEL. Preserve natural body proportions; make the entire animal smaller, not its tail shorter.';
for(const row of rows){
 if(fs.existsSync(row.master))continue;
 const file=row.packet+'/prompt.txt',old=fs.readFileSync(file,'utf8'),request=JSON.parse(fs.readFileSync(row.packet+'/request.json'));
 if(sha(old)!==request.promptSha256||request.compositionCheck)throw Error('Fresh exact pre-generation prompt required');
 const prompt=old+'\n\n'+note+'\n';
 fs.writeFileSync(file+'.tmp',prompt,{flag:'wx'});fs.renameSync(file+'.tmp',file);
 fs.writeFileSync(row.packet+'/request.json.tmp',JSON.stringify({...request,preCompositionPromptSha256:request.promptSha256,promptSha256:sha(prompt),compositionCheck:note,compositionCompilerSha256:sha(fs.readFileSync(import.meta.filename))},null,2)+'\n',{flag:'wx'});
 fs.renameSync(row.packet+'/request.json.tmp',row.packet+'/request.json');
}
