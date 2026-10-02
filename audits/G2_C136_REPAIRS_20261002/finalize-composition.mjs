import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base=import.meta.dirname,sha=b=>createHash('sha256').update(b).digest('hex'),rows=JSON.parse(fs.readFileSync(base+'/pilot.json'));
const note='ZOOMED-OUT COMPOSITION FIRST: a TINY complete specimen in a large mostly empty pure magenta square. The WHOLE animal including all appendages occupies only HALF the canvas width and no more than HALF the height. The entire silhouette must fit inside x=314 through x=940 and y=314 through y=940 on the 1254-square canvas. Keep at least 250 pixels of empty background on every side. Do not shorten any appendage; make the whole specimen smaller. Do not paint any placement guide, border or grid.';
for(const row of rows.slice(1)){
 const p=row.packet+'/prompt.txt',old=fs.readFileSync(p,'utf8'),r=JSON.parse(fs.readFileSync(row.packet+'/request.json'));
 if(fs.existsSync(row.master)||sha(old)!==r.promptSha256||r.prependCompositionCheck)throw Error('Fresh ungenerated request required');
 const prompt=note+'\n\n'+old;
 fs.writeFileSync(p+'.tmp',prompt,{flag:'wx'});fs.renameSync(p+'.tmp',p);
 fs.writeFileSync(row.packet+'/request.json.tmp',JSON.stringify({...r,preCompositionPromptSha256:r.promptSha256,promptSha256:sha(prompt),prependCompositionCheck:note,compositionCompilerSha256:sha(fs.readFileSync(import.meta.filename))},null,2)+'\n',{flag:'wx'});fs.renameSync(row.packet+'/request.json.tmp',row.packet+'/request.json');
}
