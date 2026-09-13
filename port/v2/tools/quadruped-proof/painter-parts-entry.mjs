import {installSpeciesCanvasFactory} from '../../packages/art/src/speciescanvas.ts';
import {resolveProceduralCanvas} from '../../packages/art/src/speciesoverrides.ts';
import {speciesVisualKey} from '../../packages/art/src/speciesidentity.ts';
import {sealRecord,hashBytes,hashJSON,admitRecord} from '../creature-animation/quadruped-template.mjs';
window.cfPartsRest={status:'RUNNING'};
const requireValue=(v,m)=>{if(!v)throw Error(m);},png=async c=>new Uint8Array(await(await c.convertToBlob({type:'image/png'})).arrayBuffer());
const b64=b=>{let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s);};
try{
 installSpeciesCanvasFactory((w,h)=>new OffscreenCanvas(w,h));const genome=await fetch('genome.json').then(r=>r.json());let drawn,ink;
 const observed=resolveProceduralCanvas(genome,(g,c)=>{drawn=g;ink=c;},true),plain=resolveProceduralCanvas(genome);
 requireValue(drawn?.partMasks&&ink,'winning painter must emit actual part masks');
 const a=observed.getContext('2d').getImageData(0,0,440,440).data,b=plain.getContext('2d').getImageData(0,0,440,440).data;
 let changed=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])changed++;requireValue(changed===0,'observation changed normal painter pixels');
 const master=await png(ink),rgba=ink.getContext('2d').getImageData(0,0,ink.width,ink.height).data,alpha=Uint8Array.from({length:ink.width*ink.height},(_,i)=>rgba[i*4+3]);
 const landmarks=Object.fromEntries(Object.entries(drawn.landmarks).map(([n,p])=>[n,[(p[0]*drawn.width+drawn.width*.5)/ink.width,(p[1]*drawn.width+drawn.width*.5)/ink.height]]));
 const record=await sealRecord({kind:drawn.kind,identity:{speciesVisualKey:speciesVisualKey(genome),seed:genome.seed,ownerId:'resolveProceduralCanvas:quad/'+drawn.ownerId,earthName:null},template:{id:'quadruped',version:1},geometry:{cutoutAssetHash:await hashBytes(master),width:ink.width,height:ink.height,groundLineY:(drawn.groundLineY+.5)/2,depthLayers:[{id:'far',order:0},{id:'near',order:1}]},landmarks,materials:drawn.materials,clipSetId:'quadruped-land-v1'});
 await admitRecord(record,master,alpha);requireValue(record.materials.surface==='translucent','fixture must report actual translucent skin, never old fur default');
 const masks=drawn.partMasks;let owned=0;for(let i=0;i<alpha.length;i++){requireValue(!!alpha[i]===!!masks.labels[i],'visible alpha ownership');if(alpha[i])owned++;}
 const labels=new OffscreenCanvas(ink.width,ink.height),data=new Uint8ClampedArray(alpha.length*4);
 for(let i=0;i<alpha.length;i++)data.set([masks.labels[i],0,0,255],i*4);labels.getContext('2d').putImageData(new ImageData(data,ink.width,ink.height),0,0);
 const labelBytes=await png(labels),body={schema:'cf.painter-part-intake/v1',recordRecipeHash:record.recipeHash,cutoutSha256:record.geometry.cutoutAssetHash,labelsFile:'labels.png',labelsSha256:await hashBytes(labelBytes),parts:masks.parts};
 const view=document.createElement('canvas');view.width=ink.width;view.height=ink.height;view.getContext('2d').drawImage(ink,0,0);document.body.append(view);
 window.cfPartsArtifacts={'master.png':b64(master),'labels.png':b64(labelBytes),'record.json':record,'declaration.json':{...body,declarationHash:await hashJSON(body)}};
 window.cfPartsRest={status:'PASS',scope:'native painter mask emission and unchanged ordinary painter; no motion acceptance',normalPainterChangedChannels:changed,material:record.materials.surface,paintedPixels:owned,parts:masks.parts.length,joints:Object.keys(record.landmarks),recordRecipeHash:record.recipeHash};
}catch(e){window.cfPartsRest={status:'FAIL',error:String(e.stack??e)};}
