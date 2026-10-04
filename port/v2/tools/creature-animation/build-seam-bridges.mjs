/** Compile joint strips from actual shared ownership, reusing the exact parts atlas. */
import {createRequire} from 'node:module';
import {verifyPartsDirectory} from './verify-parts.mjs';import {partAncestry,bandDepth} from './band-patches.mjs';
import {ownershipJunctions} from './ownership-junctions.mjs';
import {GRAPH,hashJSON} from './quadruped-template.mjs';import {validateSeamBridges} from './seam-bridge.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs'),parent=new Map(GRAPH);
export async function buildSeamBinding(baseDirectory,record,card,remainderPart,{includeAncestorOverlaps=false,includeJunctions=false}={}){
 const verified=await verifyPartsDirectory(baseDirectory),base=verified.binding,parts=base.parts.filter(p=>p.kind==='part');
 if(!base.parts.some(p=>p.kind==='joint-patch')||base.recordRecipeHash!==record.recipeHash||card.recipeHash!==record.recipeHash)throw Error('Bridge base/card/record mismatch');
 const {width:w,height:h}=record.geometry,owner=new Uint8Array(w*h),alpha=new Uint8Array(w*h);
 parts.forEach((p,k)=>{const png=PNG.sync.read(verified.sources.get(p.id));for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){
  const a=png.data[(y*png.width+x)*4+3];if(a<=8)continue;const i=(y+p.cutout.y)*w+x+p.cutout.x;if(owner[i])throw Error('Overlapping bridge ownership');owner[i]=k+1;alpha[i]=a;
 }});
 const ancestry=partAncestry(parts,remainderPart),groups=new Map(),siblings=new Set(),cuts=new Map(),overlaps=new Set();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;if(!owner[i])continue;
  for(const q of [x+1<w?i+1:-1,y+1<h?i+w:-1]){
   if(q<0||!owner[q]||owner[i]===owner[q])continue;
   let ai=i,di=q,ap=parts[owner[i]-1],dp=parts[owner[q]-1],chain=ancestry.chain(ap,dp);
   if(!chain){[ai,di,ap,dp]=[q,i,dp,ap];chain=ancestry.chain(ap,dp);}
   if(!chain){siblings.add([ap.id,dp.id].sort().join('|'));continue;}
   const ancestorOverlap=ancestry.owners[parent.get(dp.joint)]!==ap.id;
   if(ancestorOverlap){overlaps.add(ap.id+'--'+dp.id);if(!includeAncestorOverlaps)continue;}
   const key=ap.joint+':'+dp.layer;let g=groups.get(key);
   if(!g){g={id:'band-'+ap.joint.toLowerCase()+'-'+dp.layer,ancestorJoint:ap.joint,layer:dp.layer,edges:[]};groups.set(key,g);}
   const px=record.landmarks[parent.get(dp.joint)],distance=Math.hypot(ai%w+.5-px[0]*w,Math.floor(ai/w)+.5-px[1]*h);
   const depth=bandDepth(w,distance,chain,card.bounds.limitsDeg,Math.min(dp.cutout.width,dp.cutout.height));
   const edge=q===i+1?[[x+1,y],[x+1,y+1]]:[[x,y+1],[x+1,y+1]];
   g.edges.push({ancestorPart:ap.id,sourcePart:dp.id,descendantJoint:dp.joint,edge,sourcePixel:[di%w,Math.floor(di/w)],sourceDepthPx:depth,...(ancestorOverlap?{ancestorOverlap:true}:{})});
   const ck=ap.id+'--'+dp.id;cuts.set(ck,(cuts.get(ck)??0)+1);
  }
 }
 const junctions=includeJunctions?ownershipJunctions(owner,parts,w,h,alpha):[];
 for(const j of junctions){const a=parts.find(p=>p.id===j.ancestorPart),source=parts.find(p=>p.id===j.sourcePart),g=groups.get(a.joint+':'+source.layer);
  if(!g)throw Error('No existing ancestor drawable for junction');(g.junctions??=[]).push(j);
 }
 const {bindingHash,...body}=base;body.seamBridges={schema:'cf.seam-bridges/v1',groups:[...groups.values()]};
 const edges=validateSeamBridges(body.seamBridges.groups,base.parts,w,h,body.atlasSize,['root',...GRAPH.map(([j])=>j)]);
 const binding={...body,bindingHash:await hashJSON(body)};
 return {binding,receipt:{schema:'cf.seam-bridge-intake/v1',sourceBindingHash:bindingHash,packedPixels:verified.receipt,recordRecipeHash:record.recipeHash,cardHash:await hashJSON(card),
  edges,junctions:junctions.length,groups:groups.size,baseParts:parts.length,drawables:base.parts.length,cuts:Object.fromEntries(cuts),siblings:[...siblings].sort(),overlapsKeptRigid:includeAncestorOverlaps?[]:[...overlaps].sort(),overlapsSwept:includeAncestorOverlaps?[...overlaps].sort():[],
  restPolicy:'existing opaque underlap plus zero-area coincident edge pairs; native RGBA equality pending',ink:'same descendant edge pixel centre in unchanged atlas',alphaOwnershipThreshold:8,
  depthPolicy:'same rest-source depth and caps; strip follows the unchanged joint motion, not a new displacement clamp',nativeAcceptance:false}};
}
