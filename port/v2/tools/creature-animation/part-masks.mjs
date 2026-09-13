import {GRAPH,admitRecord,hashJSON} from './quadruped-template.mjs';
const requireValue=(ok,message)=>{if(!ok)throw Error('Part masks: '+message);};
const names=new Set(['root',...GRAPH.map(([joint])=>joint)]);
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
 const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;
}return yes;}
/** Authored geometry is hash-bound data, never per-creature animation curves.
 * Priority polygons classify visible pixels once; the explicitly named remainder
 * owns the torso. There is no guessed nearest-bone segmentation here. */
export async function cutAuthoredParts(record,masterBytes,rgba,declaration){
 const {width:w,height:h}=record.geometry;
 requireValue(rgba.length===w*h*4,'RGBA dimensions');
 const alpha=Uint8Array.from({length:w*h},(_,i)=>rgba[i*4+3]);await admitRecord(record,masterBytes,alpha);
 const {declarationHash,...body}=declaration;
 requireValue(declaration.schema==='cf.authored-part-masks/v1','schema');
 requireValue(await hashJSON(body)===declarationHash,'corrupted declaration');
 requireValue(declaration.recordRecipeHash===record.recipeHash,'record binding');
 requireValue(declaration.cutoutSha256===record.geometry.cutoutAssetHash,'master binding');
 requireValue(declaration.parts.length>0&&declaration.parts.length<=32,'part budget');
 const seen=new Set();
 for(const part of declaration.parts){
  requireValue(/^[a-z0-9-]+$/.test(part.id)&&!seen.has(part.id),'duplicate/invalid id');seen.add(part.id);
  requireValue(names.has(part.joint),'unknown joint');requireValue(['far','near'].includes(part.layer),'depth layer');
  requireValue(Array.isArray(part.polygon)&&part.polygon.length>=3&&part.polygon.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=1)),'polygon');
 }
 requireValue(seen.has(declaration.remainderPart),'explicit remainder part');
 const fallback=declaration.parts.findIndex(p=>p.id===declaration.remainderPart);
 const labels=new Uint8Array(w*h),boxes=declaration.parts.map(()=>({x:w,y:h,x1:-1,y1:-1,pixels:0}));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(!alpha[i])continue;let k=declaration.parts.findIndex(p=>inside((x+.5)/w,(y+.5)/h,p.polygon));if(k<0)k=fallback;
  labels[i]=k+1;const box=boxes[k];box.x=Math.min(box.x,x);box.y=Math.min(box.y,y);box.x1=Math.max(box.x1,x);box.y1=Math.max(box.y1,y);box.pixels++;
 }
 const parts=declaration.parts.map((p,k)=>{
  const b=boxes[k];requireValue(b.pixels>0,'empty authored part: '+p.id);
  const box={x:b.x,y:b.y,width:b.x1-b.x+1,height:b.y1-b.y+1},pixels=new Uint8ClampedArray(box.width*box.height*4);
  for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
   const i=(y+box.y)*w+x+box.x;if(labels[i]===k+1)pixels.set(rgba.subarray(i*4,i*4+4),(y*box.width+x)*4);
  }
  return {id:p.id,joint:p.joint,layer:p.layer,kind:'part',box,rgba:pixels,pixels:b.pixels};
 });
 assertRestCoverage(rgba,w,h,parts);
 return {parts,labels,receipt:{schema:'cf.part-mask-intake/v1',recordRecipeHash:record.recipeHash,declarationHash,paintedPixels:boxes.reduce((s,b)=>s+b.pixels,0),parts:parts.map(({rgba,...p})=>p),restDifferentChannels:0}};
}
/** Compare visible RGBA against an independent reconstruction and refuse both
 * missing pixels and duplicate coverage. Invisible RGB is intentionally ignored. */
export function assertRestCoverage(source,w,h,parts){
 const actual=new Uint8ClampedArray(source.length),coverage=new Uint8Array(w*h);
 for(const part of parts){const b=part.box;requireValue(b.x>=0&&b.y>=0&&b.x+b.width<=w&&b.y+b.height<=h&&part.rgba.length===b.width*b.height*4,'part rectangle');
  for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){
   const q=(y*b.width+x)*4;if(!part.rgba[q+3])continue;const i=(y+b.y)*w+x+b.x;requireValue(++coverage[i]===1,'overlapping visible parts');actual.set(part.rgba.subarray(q,q+4),i*4);
  }
 }
 for(let i=0;i<w*h;i++){
  requireValue(actual[i*4+3]===source[i*4+3],'missing/extra painted pixel');
  if(source[i*4+3])for(let c=0;c<3;c++)requireValue(actual[i*4+c]===source[i*4+c],'changed master colour');
 }
 return true;
}
