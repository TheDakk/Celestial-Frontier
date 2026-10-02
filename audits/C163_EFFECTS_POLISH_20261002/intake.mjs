import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {createRequire,registerHooks} from 'node:module';
import {keyAndDespill} from '../../tools/local-image-generation/kit-contact-math.mjs';import {despillUnresolvedEdges} from '../../tools/local-image-generation/edge-despill.mjs';import {resolve} from '../../port/v2/tools/effects-proof/resolve-ts-hook.mjs';
registerHooks({resolve});const {validateThemeDelivery}=await import('../../port/v2/apps/game/src/effects/theme-delivery.ts');
const root=process.cwd(),out='audits/C163_EFFECTS_POLISH_20261002',old='audits/C132_EFFECTS_20261001',require=createRequire(root+'/port/v2/package.json'),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp'),sha=b=>createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>fs.writeFileSync(p,typeof x==='string'||Buffer.isBuffer(x)?x:JSON.stringify(x,null,2)+'\n',{flag:'wx'});
const rows=[];
for(const theme of ['storm','void','stone','sand']){
 const phase=['storm','void'].includes(theme)?'launch':'travel',dir=out+'/'+theme,delivery=json(old+'/'+theme+'/delivery.json'),oldAnchorPath=old+'/'+delivery.anchors,oldAnchors=json(oldAnchorPath),anchorDir=path.dirname(oldAnchorPath),registration=json(old+'/'+theme+'/registration.json')[phase];
 const master=dir+'/'+phase+'-master.png',bytes=fs.readFileSync(master),raw=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(raw.info.width,raw.info.height);
 const keyed=keyAndDespill(new Uint8ClampedArray(raw.data),raw.info.width,raw.info.height),despilled=despillUnresolvedEdges(keyed.rgba,raw.info.width,raw.info.height,32);
 const png=await sharp(Buffer.from(despilled.rgba),{raw:{width:raw.info.width,height:raw.info.height,channels:4}}).png().toBuffer();fs.mkdirSync(dir+'/registered',{recursive:true});write(dir+'/'+phase+'-keyed.png',png);
 const scaled=Math.round(1024*registration.canvasScale),left=Math.round(1024*.2-scaled*registration.sourceAnchor[0]),top=Math.round(1024*.55-scaled*registration.sourceAnchor[1]);assert(left>=0&&top>=0&&left+scaled<=1024&&top+scaled<=1024);
 const small=await sharp(png).resize(scaled,scaled,{kernel:'lanczos3'}).png().toBuffer();const registered=await sharp({create:{width:1024,height:1024,channels:4,background:'#00000000'}}).composite([{input:small,left,top}]).png().toBuffer();
 const anchors=structuredClone(oldAnchors);anchors.sequenceId=theme+'-c163-polish-v43';anchors.qualityAccepted=false;const imageMap=new Map();const reused=[];
 for(const p of anchors.phases){
  const dest=dir+'/'+p.keyedImage;const image=p.phase===phase?registered:fs.readFileSync(anchorDir+'/'+p.keyedImage);write(dest,image);
  if(p.phase!==phase){assert.equal(sha(image),p.imageSha256);reused.push({phase:p.phase,source:anchorDir+'/'+p.keyedImage,sha256:sha(image)});}
  const dec=await sharp(image).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=1024,y0=1024,x1=-1,y1=-1,count=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x++)if(dec.data[(y*1024+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);count++;}
  assert(count);p.imageSha256=sha(image);p.alphaBoundsPixels={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1};imageMap.set(p.keyedImage,{width:1024,height:1024,rgba:dec.data,hasAlphaChannel:true,sha256:sha(image)});
 }
 assert.deepEqual(anchors.originAnchor,oldAnchors.originAnchor);assert.deepEqual(anchors.contactAnchor,oldAnchors.contactAnchor);assert.deepEqual(anchors.phaseOrder,oldAnchors.phaseOrder);assert.deepEqual(anchors.canvasSize,oldAnchors.canvasSize);
 const validation=validateThemeDelivery({theme,anchors,images:imageMap});write(dir+'/anchors.json',anchors);
 const report={schema:'cf.c163-effects-polish-intake/v1',theme,phase,qualityAccepted:false,nativeProof:false,status:validation.ok?'MECHANICAL_PASS_VISUAL_REVIEW_PENDING':'MECHANICAL_HOLD',master,masterSha256:sha(bytes),predecessor:{anchors:oldAnchorPath,sha256:sha(fs.readFileSync(oldAnchorPath))},registration:{...registration,scaled,left,top,sourceAndTargetAnchorsUnchanged:true,origin:[.2,.55],contact:[.8,.55]},keyer:keyed.receipt,despill:despilled.receipt,unchangedPhases:reused,validation};write(dir+'/intake.json',report);
 const panels=[];for(let n=0;n<3;n++)for(let col=0;col<2;col++){const background=['#464c46','#151820','#d6cebb'][n],image=col?registered:fs.readFileSync(anchorDir+'/'+oldAnchors.phases.find(p=>p.phase===phase).keyedImage);panels.push({input:await sharp(image).resize(384,384).flatten({background}).png().toBuffer(),left:col*384,top:n*384});}
 write(dir+'/comparison-static.png',await sharp({create:{width:768,height:1152,channels:4,background:'#222222'}}).composite(panels).png().toBuffer());
 rows.push({theme,phase,anchors:dir+'/anchors.json',anchorsSha256:sha(fs.readFileSync(dir+'/anchors.json')),ok:validation.ok,findings:validation.findings,phases:validation.phases});console.log(JSON.stringify({theme,ok:validation.ok,findings:validation.findings,selected:validation.phases[phase]}));
}
write(out+'/intake-summary.json',{schema:'cf.c163-effects-polish-summary/v1',qualityAccepted:false,nativeProof:false,timingChanged:false,originContactAnchorsChanged:false,rows});
