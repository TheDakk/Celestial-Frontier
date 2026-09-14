/** Alpha-adaptive, conforming shared tessellation. Every part samples its own atlas frame. */
import {createRequire} from 'node:module';import {verifyPartsDirectory} from './verify-parts.mjs';import {hashJSON,GRAPH} from './quadruped-template.mjs';import {validatePaintSkin} from './paint-skin.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
export async function buildPaintSkin(baseDirectory,seamBinding,record){
 const verified=await verifyPartsDirectory(baseDirectory),base=verified.binding,{width:w,height:h}=record.geometry,parts=base.parts.filter(p=>p.kind==='part'),owner=new Uint8Array(w*h),partIndex=new Map(parts.map((p,i)=>[p.id,i+1]));
 for(const [k,p]of parts.entries()){const png=PNG.sync.read(verified.sources.get(p.id));for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++)if(png.data[(y*png.width+x)*4+3]){const i=(y+p.cutout.y)*w+x+p.cutout.x;if(owner[i])throw Error('Overlapping base ink');owner[i]=k+1;}}
 const seams=seamBinding.seamBridges.groups.flatMap(g=>g.edges.map(e=>({...e,ai:partIndex.get(e.ancestorPart),di:partIndex.get(e.sourcePart)}))),seamPixels=new Uint8Array(w*h),incident=new Map(parts.map((p,i)=>[i+1,[]]));
 for(const e of seams){incident.get(e.ai).push(e);incident.get(e.di).push(e);for(const [x,y]of e.edge)if(x<w&&y<h)seamPixels[y*w+x]=1;}
 const integral=a=>{const out=new Uint32Array((w+1)*(h+1));for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){row+=!!a[y*w+x];out[(y+1)*(w+1)+x+1]=out[y*(w+1)+x+1]+row;}}return out;},inkSum=integral(owner),cutSum=integral(seamPixels);
 const sum=(a,x,y,ww,hh)=>a[(y+hh)*(w+1)+x+ww]-a[y*(w+1)+x+ww]-a[(y+hh)*(w+1)+x]+a[y*(w+1)+x];
 const leaves=[];function split(x,y,ww,hh){const n=sum(inkSum,x,y,ww,hh);if(!n)return;const limit=n<ww*hh||sum(cutSum,x,y,ww,hh)?8:32;
  if(ww>limit||hh>limit){const left=Math.floor(ww/2),top=Math.floor(hh/2);for(const [a,b,c,d]of [[x,y,left,top],[x+left,y,ww-left,top],[x,y+top,left,hh-top],[x+left,y+top,ww-left,hh-top]])if(c&&d)split(a,b,c,d);}
  else leaves.push({x,y,w:ww,h:hh});}split(0,0,w,h);
 const horizontal=new Map(),vertical=new Map(),add=(m,k,v)=>{if(!m.has(k))m.set(k,new Set());m.get(k).add(v);};
 for(const b of leaves)for(const [x,y]of [[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]]){add(horizontal,y,x);add(vertical,x,y);}
 for(const m of [horizontal,vertical])for(const[k,v]of m)m.set(k,[...v].sort((a,b)=>a-b));
 const vertices=[],lookup=new Map();
 const dist=(x,y,e)=>{const [[ax,ay],[bx,by]]=e.edge,dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,(x-ax)*dx+(y-ay)*dy));return Math.hypot(x-ax-dx*t,y-ay-dy*t);};
 const weights=(x,y)=>{let id=0,best=Infinity;for(let r=0;r<=32&&!id;r++)for(let yy=Math.max(0,Math.floor(y)-r-1);yy<=Math.min(h-1,Math.floor(y)+r);yy++)for(let xx=Math.max(0,Math.floor(x)-r-1);xx<=Math.min(w-1,Math.floor(x)+r);xx++){const k=owner[yy*w+xx],d=(xx+.5-x)**2+(yy+.5-y)**2;if(k&&(d<best||(d===best&&k<id))){id=k;best=d;}}if(!id)throw Error('Mesh vertex has no nearby ink');
  const close=new Map();for(const e of incident.get(id)){const other=e.ai===id?e.di:e.ai,d=dist(x,y,e),prior=close.get(other);if(!prior||d<prior.d)close.set(other,{d,depth:e.sourceDepthPx});}
  const scores=new Map([[parts[id-1].joint,1]]);for(const [other,{d,depth}]of close){const t=Math.max(0,1-d/depth),f=.5*t*t*(3-2*t);if(f>1e-5){const j=parts[other-1].joint;scores.set(j,(scores.get(j)??0)+f/(1-f));}}
  const total=[...scores.values()].reduce((a,b)=>a+b,0);return [...scores].map(([j,v])=>[j,v/total]);};
 const vertex=(x,y)=>{const k=x+','+y;if(lookup.has(k))return lookup.get(k);const id=vertices.length;vertices.push({x,y,weights:weights(x,y)});lookup.set(k,id);return id;};
 const vertexCaches=new Map(parts.map(p=>[p.id,new Map()]));
 const result=new Map(parts.map(p=>[p.id,{id:p.id,vertices:[],indices:[]} ]));let triangles=0;
 const clip=(poly,axis,bound,above)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ina=above?a[axis]>=bound:a[axis]<=bound,inb=above?b[axis]>=bound:b[axis]<=bound;if(ina)out.push(a);if(ina!==inb){const t=(bound-a[axis])/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return out;};
 for(const b of leaves){const edge=[...horizontal.get(b.y).filter(x=>x>=b.x&&x<b.x+b.w).map(x=>[x,b.y]),...vertical.get(b.x+b.w).filter(y=>y>=b.y&&y<b.y+b.h).map(y=>[b.x+b.w,y]),...horizontal.get(b.y+b.h).filter(x=>x>b.x&&x<=b.x+b.w).reverse().map(x=>[x,b.y+b.h]),...vertical.get(b.x).filter(y=>y>b.y&&y<=b.y+b.h).reverse().map(y=>[b.x,y])],center=vertex(b.x+b.w/2,b.y+b.h/2),ids=new Set();
  for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)if(owner[y*w+x])ids.add(owner[y*w+x]);
  for(let i=0;i<edge.length;i++){const tri=[center,vertex(...edge[i]),vertex(...edge[(i+1)%edge.length])],v=tri.map(i=>vertices[i]);triangles++;
   for(const id of ids){const p=parts[id-1],box=p.cutout,out=result.get(p.id);let poly=v.map(p=>[p.x,p.y]);for(const [axis,bound,above]of [[0,box.x,true],[0,box.x+box.width,false],[1,box.y,true],[1,box.y+box.height,false]])poly=clip(poly,axis,bound,above);if(poly.length<3)continue;
    const det=(v[1].y-v[2].y)*(v[0].x-v[2].x)+(v[2].x-v[1].x)*(v[0].y-v[2].y),local=[];
    for(const [x,y]of poly){const a=((v[1].y-v[2].y)*(x-v[2].x)+(v[2].x-v[1].x)*(y-v[2].y))/det,b=((v[2].y-v[0].y)*(x-v[2].x)+(v[0].x-v[2].x)*(y-v[2].y))/det;const sparse=tri.map((id,k)=>[id,[a,b,1-a-b][k]]).filter(([,v])=>Math.abs(v)>1e-10).sort((a,b)=>a[0]-b[0]),key=sparse.map(([id,v])=>id+':'+v.toFixed(10)).join('|'),cache=vertexCaches.get(p.id);
     if(!cache.has(key)){cache.set(key,out.vertices.length);out.vertices.push({triangle:tri,barycentric:[a,b,1-a-b]});}local.push(cache.get(key));}
    for(let k=1;k+1<poly.length;k++)out.indices.push(local[0],local[k],local[k+1]);
   }
  }
 }
 const skin={schema:'cf.paint-skin/v1',vertices,parts:[...result.values()]},stats=validatePaintSkin(skin,parts,w,h,['root',...GRAPH.map(([j])=>j)]),{bindingHash,...body}=base;body.parts=parts;body.paintSkin=skin;
 return {binding:{...body,bindingHash:await hashJSON(body)},receipt:{schema:'cf.paint-skin-intake/v1',sourceBindingHash:bindingHash,recordRecipeHash:record.recipeHash,packedPixels:verified.receipt,...stats,leaves:leaves.length,triangles,originalInkOnly:true,method:'alpha-adaptive conforming cells; shared vertex field; per-part clipped atlas UVs; no overlap patches',nativeAcceptance:false}};
}
