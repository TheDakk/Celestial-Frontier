/** Native-pixel review artifacts and measured placement. Never changes source PNGs. */
import fs from 'node:fs/promises';import path from 'node:path';
import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {registerOrganism,admitsBoxOverlap} from './kit-contact-review.mjs';
import {erodeAlpha,pinkExcess} from './kit-contact-math.mjs';
if(process.argv.length!==4)throw Error('Usage: review-kit-contact.mjs NATIVE_RESULT NEW_REVIEW_DIRECTORY');
const run=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
await fs.mkdir(out);
const r=JSON.parse(await fs.readFile(path.join(run,'result.json'),'utf8'));
if(r.status!=='PASS'||r.details.organismPasses!==0)throw Error('No completed contact experiment');
const W=r.details.width,H=r.details.height;
const raw=file=>new Uint8ClampedArray(execFileSync('magick',[file,'-depth','8','rgba:-'],{maxBuffer:16*1024*1024}));
const painting=raw(path.join(run,'painting.png')),composite=raw(path.join(run,'composite-before-finisher.png'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const prepared=path.join(path.dirname(run),'prepared');
const preview=JSON.parse(await fs.readFile(path.join(prepared,'compositor-preview.json'),'utf8'));
if(sha(composite)!==preview.pixelSha256)throw Error('Native/static compositor pixel mismatch');
const names=['civet','persimmon','platypus','frog','devils-club','cranberry'],rows=[];
const font='/System/Library/Fonts/Supplemental/Arial.ttf';
const annotations=[path.join(run,'painting.png'),'-font',font,'-pointsize','14'];
for(const [i,box]of r.details.boxes.entries()){
  const pixels=raw(path.join(run,`organism-${String(i+1).padStart(2,'0')}-mask.png`));
  const alpha=Uint8Array.from({length:W*H},(_,j)=>pixels[j*4]);let observation;
  try{observation=registerOrganism(composite,painting,alpha,W,H,box);}catch(error){observation={error:String(error),speciesAccepted:false};}
  const inner=erodeAlpha(alpha,W,H,1);let pinkCandidates=0;
  for(let j=0;j<alpha.length;j++)if(alpha[j]>16&&inner[j]<16){const p=j*4;if(painting[p]>64&&painting[p+2]>64&&pinkExcess(...painting.subarray(p,p+3))>12)pinkCandidates++;}
  const admitted=admitsBoxOverlap(observation);
  rows.push({name:box.name,compositeBox:{x:box.x,y:box.y,width:box.width,height:box.height},...observation,boxCriterion:admitted,pinkEdgeCandidates:pinkCandidates,fringeVisualReview:'pending',speciesVisualReview:'pending'});
  const x=Math.max(0,Math.floor(box.x)-8),y=Math.max(0,Math.floor(box.y)-8),w=Math.min(W-x,Math.ceil(box.width)+16),h=Math.min(H-y,Math.ceil(box.height)+16);
  execFileSync('magick',[path.join(run,'painting.png'),'-crop',`${w}x${h}+${x}+${y}`,'+repage','-filter','point','-resize','200%',path.join(out,names[i]+'-200pct.png')]);
  for(const [b,colour]of [[box,'#ffe45c'],[observation.postBox,'#58f0ce']])if(b)annotations.push('-stroke',colour,'-strokewidth','1','-fill','none','-draw',`rectangle ${b.x},${b.y} ${b.x+b.width},${b.y+b.height}`);
  annotations.push('-stroke','none','-fill','#111916dd','-draw',`rectangle ${box.x},${box.y-20} ${box.x+125},${box.y}`,'-fill','#ffffff','-draw',`text ${box.x+3},${box.y-5} "${i+1} ${box.name}"`);
}
annotations.push(path.join(out,'registered-boxes.png'));execFileSync('magick',annotations);
function column(file,label,width,output){execFileSync('magick',['-size',`${width}x40`,'xc:#111916','-font',font,'-fill','#eef1ec','-pointsize','18','-gravity','West','-annotate','+12+0',label,file,'-append',output]);}
const before=path.join(root,'audits/ART_KIT_ENGINE_PROOF_20260912/native-01/painting.png'),triptych=path.join(root,'audits/MIDGAME_ART_DIRECTION_20260908/02-inhabited-worlds.png');
column(path.join(run,'painting.png'),`Contact revision — native ${W}x${H}, ${(r.details.elapsedMs/1000).toFixed(2)}s warm`,W,path.join(out,'contact-column.png'));
column(before,'First painting — native 1024x576, 425.71s',1024,path.join(out,'first-column.png'));
column(triptych,'Approved Living Worlds — native 1881x836',1881,path.join(out,'triptych-column.png'));
execFileSync('magick',[path.join(out,'first-column.png'),path.join(out,'contact-column.png'),'-background','#111916','-gravity','North','+append',path.join(out,'beside-first-painting.png')]);
execFileSync('magick',[path.join(out,'contact-column.png'),path.join(out,'triptych-column.png'),'-background','#111916','-gravity','North','+append',path.join(out,'beside-triptych.png')]);
const civet=rows.find(x=>x.name==='Civet'),metrics={schema:'cf.kit-contact-review.v1',nativeHead:r.head,paintingSha256:sha(await fs.readFile(path.join(run,'painting.png'))),nativeCompositeMatchesStatic:true,
  warmEngineMs:r.details.elapsedMs,sessionPreparationMs:r.details.coldPreparationMs,totalEngineMs:r.details.totalMs,warmUnder240s:r.details.elapsedMs<240000,
  sessionCreates:r.details.sessionCreates,organismInferencePasses:r.details.organismPasses,measurements:r.details.measurements,
  civetRegisteredHeightFraction:civet.postBox?civet.postBox.height/H:null,civetHeightAtLeast28Percent:!!civet.postBox&&civet.postBox.height/H>=.28,
  allRegisteredBoxIoUAtLeast90Percent:rows.every(x=>x.boxCriterion),organisms:rows,
  limits:'Post boxes are masked texture registration estimates, not segmentation. Species, shadows and pink-fringe decisions require visual review. Pink candidate counts are not a semantic fringe verdict.',qualityAccepted:false};
await fs.writeFile(path.join(out,'review.json'),JSON.stringify(metrics,null,2)+'\n');
console.log(JSON.stringify({warmSeconds:metrics.warmEngineMs/1000,totalSeconds:metrics.totalEngineMs/1000,allBoxes:metrics.allRegisteredBoxIoUAtLeast90Percent,civetHeight:metrics.civetRegisteredHeightFraction,rows:rows.map(({name,score,iou,pinkEdgeCandidates,error})=>({name,score,iou,pinkEdgeCandidates,error}))},null,2));
