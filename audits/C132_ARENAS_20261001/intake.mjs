import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {keyAndDespill} from '../../tools/local-image-generation/kit-contact-math.mjs';
import {despillUnresolvedEdges} from '../../tools/local-image-generation/edge-despill.mjs';
import {inspectArenaSet} from '../../port/v2/tools/asset-intake/arena-set.mjs';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../..');
const require=createRequire(path.join(root,'port/v2/package.json'));const sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const sha=b=>createHash('sha256').update(b).digest('hex');
const [id]=process.argv.slice(2);if(!id||!/^[-a-z0-9]+$/.test(id))throw Error('Usage intake.mjs ID');
const folder=path.join(out,id),recipe=JSON.parse(fs.readFileSync(path.join(folder,'recipe.pending.json')));
if(fs.existsSync(path.join(folder,'intake.json')))throw Error('Completed intake is immutable; use a new versioned directory');
const bound=p=>({path:path.relative(root,p),sha256:sha(fs.readFileSync(p))});
fs.mkdirSync(path.join(folder,'keyed'),{recursive:true});
const facts=[],layers=[];let width=0,height=0;
for(const role of ['far','mid','near']){
 const source=path.join(folder,`arena-${role}.png`),bytes=fs.readFileSync(source),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(role==='far'){width=info.width;height=info.height;}else if(width!==info.width||height!==info.height)throw Error('Master dimensions differ');
 let runtime=source,rgba=new Uint8ClampedArray(data),keyReceipt=null,repairReceipt=null;
 if(role!=='far'){
  const keyed=keyAndDespill(rgba,width,height,{terrainLayer:true});rgba=keyed.rgba;keyReceipt=keyed.receipt;
  /* A single simultaneous RGB-only correction on a copy. Original pixels and
   * keyed alpha remain sealed; unresolved pixels remain reported, never hidden. */
  if(keyReceipt.unresolvedEdgePixels){const repaired=despillUnresolvedEdges(rgba,width,height,32);rgba=repaired.rgba;repairReceipt=repaired.receipt;}
  runtime=path.join(folder,'keyed',`arena-${role}.png`);
  fs.writeFileSync(runtime,await sharp(Buffer.from(rgba),{raw:{width,height,channels:4}}).png().toBuffer(),{flag:'wx'});
 }
 let transparent=0,visible=0,minY=height;
 for(let i=0;i<width*height;i++)if(rgba[i*4+3]){visible++;minY=Math.min(minY,Math.floor(i/width));}else transparent++;
 const standAlphas=[1/3,2/3].map(x=>rgba[(Math.round(.78*height)*width+Math.round(x*width))*4+3]);
 const runway=[];for(let x=.08;x<=.92;x+=.01)runway.push(rgba[(Math.round(.78*height)*width+Math.round(x*width))*4+3]);
 const row={role,width,height,keyReceipt,repairReceipt,transparentPixels:transparent,visiblePixels:visible,firstPaintedY:minY,firstPaintedYNormalized:minY/height,standAlphas,runwayMinimumAlpha:Math.min(...runway),runwayMaximumAlpha:Math.max(...runway)};
 if(role==='far'&&transparent)throw Error('FAR alpha found');
 if(role==='mid'&&row.runwayMinimumAlpha!==255)throw Error('MID runway is not continuous opaque terrain');
 if(role==='near'&&row.runwayMaximumAlpha!==0)throw Error('NEAR covers fighting path');
 facts.push(row);layers.push({role,source:bound(source),runtime:bound(runtime)});
}
recipe.canvasSize={width,height};recipe.plates=layers.map(l=>({image:path.basename(l.source.path),sha256:l.source.sha256,kind:l.role==='far'?'scene':'key-painted terrain',groundLineNormalized:.78}));
const recipePath=path.join(folder,'arena-recipe.json');fs.writeFileSync(recipePath,JSON.stringify(recipe,null,2)+'\n',{flag:'wx'});
const manifest={schema:'cf.arena-intake/v1',recipe:bound(recipePath),layers};
fs.writeFileSync(path.join(folder,'arena-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
const contract=inspectArenaSet(root,manifest);
const composite=await sharp(path.join(root,layers[0].runtime.path)).composite(layers.slice(1).map(l=>({input:path.join(root,l.runtime.path)}))).png().toBuffer();
fs.writeFileSync(path.join(folder,'arena-composed-review.png'),composite,{flag:'wx'});
const sheetWidth=836,sheetHeight=Math.round(height*sheetWidth/width),sheet=await sharp({create:{width:sheetWidth,height:sheetHeight*4,channels:4,background:'#233138'}}).composite(await Promise.all([...layers.map(l=>path.join(root,l.runtime.path)),composite].map(async(input,i)=>({input:await sharp(input).resize(sheetWidth,sheetHeight).png().toBuffer(),top:i*sheetHeight,left:0})))).png().toBuffer();
fs.writeFileSync(path.join(folder,'arena-plates-review.png'),sheet,{flag:'wx'});
const result={schema:'cf.c132-arena-intake/v1',id,qualityAccepted:false,status:'TECHNICAL_INTAKE_PASS_VISUAL_REVIEW_PENDING',requested:recipe.requestedCanvasSize,delivered:{width,height},resolutionDeviation:width!==2560||height!==1440?'Generator delivered its native size; no upscaling or false target-size claim':null,originalMastersModified:false,extractedMasks:false,despillPolicy:'existing keyer followed, where needed, by one simultaneous color-only nearest-opaque-neighbor pass radius32 on a copy; alpha unchanged by correction',layers:facts,contract,manifest:bound(path.join(folder,'arena-manifest.json')),pending:['full-size composition and style review','final Dakk visual pass','Claude runtime wiring and native motion/medium proof']};
fs.writeFileSync(path.join(folder,'intake.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id,status:result.status,delivered:result.delivered,layers:facts.map(r=>({role:r.role,standAlphas:r.standAlphas,unresolved:r.repairReceipt?.unresolved.length??r.keyReceipt?.unresolvedEdgePixels??0}))}));
