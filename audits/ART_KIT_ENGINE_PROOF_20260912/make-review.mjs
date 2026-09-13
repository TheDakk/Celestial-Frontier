/** Non-generative review annotations. Originals and native pixel sizes unchanged. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(dir,'../..');
const run=path.join(dir,'native-01'),report=JSON.parse(await fs.readFile(path.join(run,'result.json'),'utf8'));
if(report.status!=='PASS')throw Error('No complete painting');
const font='/System/Library/Fonts/Supplemental/Arial.ttf';
const colors=['#ffe570','#ffa05f','#68def4','#ecff9c','#c6a2ff','#ff9ddb'];
const args=[path.join(run,'painting.png'),'-font',font,'-pointsize','15'];
for(const [i,b]of report.details.boxes.entries()){
 const {x,y,width:w,height:h}=b;
 args.push('-fill','none','-stroke',colors[i],'-strokewidth','2','-draw',`rectangle ${x},${y} ${x+w},${y+h}`,
 '-fill','#10201be6','-stroke','none','-draw',`rectangle ${x},${y-21} ${x+Math.min(w,120)},${y}`,
 '-fill',colors[i],'-draw',`text ${x+3},${y-5} "${i+1} ${b.name}"`);
}
args.push(path.join(dir,'painting-boxes.png'));execFileSync('magick',args);
execFileSync('magick',['-size','1024x48','xc:#111916','-font',font,'-fill','#eef1ec','-pointsize','21','-gravity','West','-annotate','+12+0','Local engine — 1024×576 native pixels',path.join(run,'painting.png'),'-append',
 '(', '-size','1024x48','xc:#111916','-font',font,'-fill','#eef1ec','-pointsize','18','-gravity','West','-annotate','+12+0','Placement boxes before finisher, over final painting; identity unaccepted',')', '-append',path.join(dir,'painting-boxes.png'),'-append',path.join(dir,'native-review-column.png')]);
execFileSync('magick',['-size','1881x48','xc:#111916','-font',font,'-fill','#eef1ec','-pointsize','21','-gravity','West','-annotate','+12+0','Approved Living Worlds triptych — 1881×836 native pixels',path.join(repo,'audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png'),'-append',path.join(dir,'triptych-review-column.png')]);
execFileSync('magick',[path.join(dir,'native-review-column.png'),path.join(dir,'triptych-review-column.png'),'-background','#111916','-gravity','North','+append',path.join(dir,'painting-beside-living-worlds.png')]);
const facts={schema:'cf.kit-engine-review.v4',qualityAccepted:false,dimensions:{width:1024,height:576},elapsedMs:report.details.elapsedMs,
 sessions:report.details.sessionCreates,measurements:report.details.measurements.map(({name,elapsedMs,tokenCount,sequence})=>({name,elapsedMs,tokenCount,sequence})),
 boxes:report.details.boxes.map(({identityKey,...b})=>b),note:'Boxes reflect placement before the finisher, not segmentation after it. All comparison pixels are native-size; originals are untouched.',artifacts:[]};
for(const name of ['painting-boxes.png','painting-beside-living-worlds.png']){const b=await fs.readFile(path.join(dir,name));facts.artifacts.push({name,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await fs.writeFile(path.join(dir,'review.json'),JSON.stringify(facts,null,2)+'\n');
console.log(JSON.stringify({painting:report.artifacts.find(a=>a.file==='painting.png'),reviewArtifacts:facts.artifacts},null,2));
