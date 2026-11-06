import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {createRequire,registerHooks} from 'node:module';import {createHash} from 'node:crypto';
import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';
import {selectFringeTargets} from '../../tools/local-image-generation/fringe-targets.mjs';
import {despillUnresolvedEdges} from '../../tools/local-image-generation/edge-despill.mjs';
registerHooks({resolve});
const {isKeyTinted}=await import('../../port/v2/apps/game/src/effects/theme-delivery.ts');
const base=import.meta.dirname,root=path.resolve(base,'../..'),req=createRequire(path.join(root,'port/v2/package.json')),sharp=createRequire(req.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const repairs={storm:['impact'],stone:['travel'],void:['travel'],sand:['launch','travel','impact'],psionic:['launch']};
for(const [theme,phases] of Object.entries(repairs)){
 const inputDir=path.join(base,theme,theme==='psionic'?'neutral':theme==='sand'?'material':''),out=path.join(base,theme,'final');
 assert(!fs.existsSync(out),'One bounded pass only; output must be new');fs.mkdirSync(path.join(out,'registered'),{recursive:true});
 const anchors=JSON.parse(fs.readFileSync(path.join(inputDir,'anchors.json'))),receipts=[];
 for(const p of anchors.phases){
  const inputPath=path.join(inputDir,p.keyedImage),input=fs.readFileSync(inputPath),{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let output=input;
  if(phases.includes(p.phase)){
   const selected=selectFringeTargets(data,info.width,info.height,{rectangles:[{x0:0,y0:0,x1:info.width-1,y1:info.height-1}]}),alpha=(x,y)=>x<0||y<0||x>=info.width||y>=info.height?0:data[(y*info.width+x)*4+3];
   const targets=selected.targets.filter(i=>{const z=i*4,x=i%info.width,y=Math.floor(i/info.width);return isKeyTinted(data[z],data[z+1],data[z+2])&&(data[z+3]<255||!alpha(x-1,y)||!alpha(x+1,y)||!alpha(x,y-1)||!alpha(x,y+1));});
   const corrected=despillUnresolvedEdges(new Uint8ClampedArray(data),info.width,info.height,8,targets),allowed=new Set(targets);let changedRgb=0;
   for(let i=0;i<data.length/4;i++){assert.equal(data[i*4+3],corrected.rgba[i*4+3]);if([0,1,2].some(c=>data[i*4+c]!==corrected.rgba[i*4+c])){assert(allowed.has(i));changedRgb++;}}
   output=await sharp(Buffer.from(corrected.rgba),{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
   receipts.push({phase:p.phase,input:path.relative(base,inputPath),inputSha256:sha(input),output:'registered/'+p.phase+'.png',outputSha256:sha(output),alphaUnchanged:true,changesOutsideTargets:0,changedRgbPixels:changedRgb,selection:'Key-tinted pixels on the delivery-contract edge, intersected with the existing conservative fringe selector; pale and umber protections retained',pass:corrected.receipt});
  }else receipts.push({phase:p.phase,input:path.relative(base,inputPath),inputSha256:sha(input),output:'registered/'+p.phase+'.png',outputSha256:sha(input),unchanged:true});
  const image='registered/'+p.phase+'.png';fs.writeFileSync(path.join(out,image),output,{flag:'wx'});Object.assign(p,{image,keyedImage:image,imageSha256:sha(output)});
 }
 fs.writeFileSync(path.join(out,'anchors.json'),JSON.stringify(anchors,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(path.join(out,'despill-receipt.json'),JSON.stringify({schema:'cf.c132-targeted-despill/v1',passes:1,radius:8,alphaUnchanged:true,erosionPixels:0,qualityAccepted:false,rows:receipts},null,2)+'\n',{flag:'wx'});
 const panels=[];for(const [i,p]of anchors.phases.entries())panels.push({input:await sharp(path.join(out,p.keyedImage)).resize(512).flatten({background:'#24282b'}).png().toBuffer(),left:i*512,top:40});
 panels.push({input:Buffer.from('<svg width="1536" height="40"><rect width="1536" height="40" fill="#24282b"/>'+anchors.phases.map((p,i)=>`<text x="${i*512+20}" y="27" font-family="sans-serif" font-size="20" fill="white">${theme.toUpperCase()} ${p.phase.toUpperCase()}</text>`).join('')+'</svg>'),left:0,top:0});
 fs.writeFileSync(path.join(out,'review-sheet.png'),await sharp({create:{width:1536,height:552,channels:4,background:'#24282b'}}).composite(panels).png().toBuffer(),{flag:'wx'});
 console.log(JSON.stringify({theme,receipts:receipts.map(({pass,...r})=>({...r,targets:pass?.targets,corrected:pass?.corrected.length,unresolved:pass?.unresolved.length}))}));
}
