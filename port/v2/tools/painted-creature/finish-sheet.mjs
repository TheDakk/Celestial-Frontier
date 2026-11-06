/** R9 review sheet: for every finished creature in a finish-master output,
 * one row of painter master | finished | raw finisher output | protection
 * mask, each labelled, plus the gate summary; and one arena-scale panel of the
 * first crab (its on-stage size on a 1280×720 plate) so the finish is judged at
 * the size the player sees. Pure pixels; nothing is judged automatically.
 *   node port/v2/tools/painted-creature/finish-sheet.mjs FINISH_OUTPUT_DIR NEW_SHEET.png
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const [dirArg,outArg]=process.argv.slice(2);if(!dirArg||!outArg)throw Error('Usage: finish-sheet.mjs FINISH_OUTPUT_DIR NEW_SHEET.png');
const dir=path.resolve(dirArg),out=path.resolve(outArg);if(fs.existsSync(out))throw Error('New sheet path required');
const result=JSON.parse(fs.readFileSync(path.join(dir,'result.json'),'utf8'));
const CELL=440,GAP=16,LABEL=28,rows=result.subjects.filter(s=>fs.existsSync(path.join(dir,s.id+'-finished.png')));
if(!rows.length)throw Error('No finished subjects in '+dir);
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const text=(t,w,h=LABEL,size=15,fill='#eef1ec')=>Buffer.from(`<svg width="${w}" height="${h}"><text x="6" y="${Math.round(h*.7)}" font-family="Helvetica,Arial" font-size="${size}" fill="${fill}">${esc(t)}</text></svg>`);
const checker=async(w,h)=>{const tile=8,data=Buffer.alloc(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=((x/tile|0)+(y/tile|0))%2?96:72;data.set([v,v,v,255],(y*w+x)*4);}return sharp(data,{raw:{width:w,height:h,channels:4}}).png().toBuffer();};
const composites=[];let y=GAP;const W=GAP+4*(CELL+GAP);
composites.push({input:text('R9 finished textures — '+path.basename(dir)+' — head '+result.head.slice(0,10)+(result.dirtyDiagnostic?' (dirty diagnostic)':'')+' — masked finisher 0.35 × 1 step, interior editable, silhouette and key restored byte-for-byte',W,LABEL,16),left:0,top:y});y+=LABEL+GAP;
const bg=await checker(CELL,CELL);
for(const s of rows){
  const cells=[['painter master',path.join(process.cwd(),s.master)],['finished (gated)',path.join(dir,s.id+'-finished.png')],['raw finisher output',path.join(dir,s.id+'-finished-raw.png')],['protection (white = editable interior)',path.join(dir,s.id+'-protection.png')]];
  composites.push({input:text(`${s.id}  —  ${s.status}  alpha ${s.gates?.alpha}  gradient ${s.gates?.gradient} (ratio ${s.gates?.gradientRatio?.toFixed(3)})  ssim ${s.ssim?.toFixed(3)}  seed ${s.seed}  ${Math.round((s.elapsedMs??0)/100)/10}s`,W,LABEL,15,'#ffd479'),left:0,top:y});y+=LABEL;
  for(const [i,[label,file]] of cells.entries()){
    const x=GAP+i*(CELL+GAP);if(!fs.existsSync(file))continue;
    const img=await sharp(file).resize(CELL,CELL,{fit:'inside',kernel:'lanczos3'}).png().toBuffer(),meta=await sharp(img).metadata();
    const cell=await sharp(bg).composite([{input:img,left:Math.floor((CELL-meta.width)/2),top:Math.floor((CELL-meta.height)/2)}]).png().toBuffer();
    composites.push({input:cell,left:x,top:y},{input:text(label,CELL,LABEL,13,'#9fb3a8'),left:x,top:y+CELL});
  }
  y+=CELL+LABEL+GAP;
}
// Arena-scale panel: the first crab at its stage size on a 1280×720 plate (creature ≈ 22 % of plate height, the battle stage's small-combatant scale).
const first=rows[0],arenaH=720,arenaW=1280,scaleH=Math.round(arenaH*.22);
const plate=await sharp({create:{width:arenaW,height:arenaH,channels:4,background:{r:58,g:72,b:60,alpha:1}}}).png().toBuffer();
// Crop each image to its alpha bounding box first: the painter frame is mostly empty and the creature, not the frame, is what has a stage size.
const bbox=async file=>{const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let l=info.width,t=info.height,r=0,b=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {left:l,top:t,width:r-l+1,height:b-t+1};};
const small=async file=>{const box=await bbox(file);return sharp(file).extract(box).resize({height:scaleH,kernel:'lanczos3'}).png().toBuffer();};
const a=await small(path.join(process.cwd(),first.master)),b=await small(path.join(dir,first.id+'-finished.png')),am=await sharp(a).metadata();
const arena=await sharp(plate).composite([{input:a,left:Math.round(arenaW*.3-am.width/2),top:Math.round(arenaH*.62-scaleH)},{input:b,left:Math.round(arenaW*.7-am.width/2),top:Math.round(arenaH*.62-scaleH)},
  {input:text('painter',200,LABEL,14),left:Math.round(arenaW*.3-am.width/2),top:Math.round(arenaH*.62)+4},{input:text('finished',200,LABEL,14),left:Math.round(arenaW*.7-am.width/2),top:Math.round(arenaH*.62)+4}]).png().toBuffer();
composites.push({input:text(`judging scale — ${first.id} cropped to its silhouette and shown ${scaleH} px tall on a 1280×720 plate (painter left, finished right); not the stage's own size`,W,LABEL,15,'#ffd479'),left:0,top:y});y+=LABEL;
const arenaScaled=await sharp(arena).resize(W-2*GAP).png().toBuffer(),ah=(await sharp(arenaScaled).metadata()).height;composites.push({input:arenaScaled,left:GAP,top:y});y+=ah+GAP;
const sheet=await sharp({create:{width:W,height:y,channels:4,background:{r:18,g:25,b:24,alpha:1}}}).composite(composites).png().toBuffer();
fs.writeFileSync(out,sheet,{flag:'wx'});console.log(JSON.stringify({sheet:out,width:W,height:y,rows:rows.length}));
