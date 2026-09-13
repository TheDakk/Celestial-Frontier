/** Authored/painter ownership-cut bands. Sources stay immutable; no rig/curve edits. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {GRAPH,hashJSON,hashBytes} from './quadruped-template.mjs';import {packRigAtlas} from './rig-atlas.mjs';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('free-tex-packer-core'))('sharp');
const parent=new Map(GRAPH);
export function cutChain(ancestor,descendant){const chain=[];for(let j=descendant;j&&j!==ancestor;j=parent.get(j)){chain.push(j);if(parent.get(j)===ancestor)return chain;}return null;}
export function bandDepth(width,distance,chain,limits){let degrees=0;for(const j of chain){const l=limits[j];if(!l)throw Error('Missing joint limit: '+j);degrees+=Math.max(Math.abs(l.min),Math.abs(l.max));}return Math.min(width/8,Math.max(width*.02,distance*Math.sin(Math.min(Math.PI/2,degrees*Math.PI/180))*1.1));}
/** Exact Euclidean discs at every ancestor-owned boundary pixel, as authorized.
 * Aggregate by ancestor joint and descendant layer, preserving per-cut receipts. */
export function buildBandPixels({width:w,height:h,owner,rgba,parts,record,limits}){
 const cuts=new Map(),groups=new Map(),other=new Set();
 const seenEdge=new Set();
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,a=owner[i]-1;if(a<0)continue;
  for(const q of [x+1<w?i+1:-1,x>0?i-1:-1,y+1<h?i+w:-1,y>0?i-w:-1]){
   if(q<0)continue;const d=owner[q]-1;if(d<0||d===a)continue;
   const chain=cutChain(parts[a].joint,parts[d].joint);if(!chain){if(!cutChain(parts[d].joint,parts[a].joint))other.add([parts[a].id,parts[d].id].sort().join('|'));continue;}
   const key=a+':'+d,edge=key+':'+i;if(seenEdge.has(edge))continue;seenEdge.add(edge);
   let cut=cuts.get(key);if(!cut){cut={ancestor:parts[a].id,ancestorJoint:parts[a].joint,descendant:parts[d].id,descendantJoint:parts[d].joint,layer:parts[d].layer,chain,pivot:record.landmarks[parent.get(parts[d].joint)],seeds:0,minDepthPx:Infinity,maxDepthPx:0,pixels:new Set()};cuts.set(key,cut);}
   const pv=cut.pivot,depth=bandDepth(w,Math.hypot(x+.5-pv[0]*w,y+.5-pv[1]*h),chain,limits);cut.seeds++;cut.minDepthPx=Math.min(cut.minDepthPx,depth);cut.maxDepthPx=Math.max(cut.maxDepthPx,depth);
   const R=Math.ceil(depth),r2=depth*depth;
   for(let dy=-R;dy<=R;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;const dxMax=Math.floor(Math.sqrt(Math.max(0,r2-dy*dy)));if(dy*dy>r2)continue;
    for(let xx=Math.max(0,x-dxMax);xx<=Math.min(w-1,x+dxMax);xx++){const k=yy*w+xx;if(owner[k]===d+1&&rgba[k*4+3]===255)cut.pixels.add(k);}
   }
  }
 }
 for(const cut of cuts.values()){
  const key=cut.ancestorJoint+':'+cut.layer;let group=groups.get(key);if(!group){group={id:'band-'+cut.ancestorJoint.toLowerCase()+'-'+cut.layer,joint:cut.ancestorJoint,layer:cut.layer,kind:'joint-patch',pixels:new Set()};groups.set(key,group);}for(const i of cut.pixels)group.pixels.add(i);
 }
 const bands=[...groups.values()].map(g=>{const ids=[...g.pixels];if(!ids.length)throw Error('Empty band: '+g.id);let x0=w,y0=h,x1=-1,y1=-1;for(const i of ids){x0=Math.min(x0,i%w);x1=Math.max(x1,i%w);y0=Math.min(y0,Math.floor(i/w));y1=Math.max(y1,Math.floor(i/w));}const cutout={x:x0,y:y0,width:x1-x0+1,height:y1-y0+1},data=new Uint8Array(cutout.width*cutout.height*4);for(const i of ids)data.set(rgba.subarray(i*4,i*4+4),((Math.floor(i/w)-y0)*cutout.width+i%w-x0)*4);const{pixels,...info}=g;return {...info,cutout,rgba:data,pixelCount:ids.length};});
 return {bands,cuts:[...cuts.values()].map(({pixels,...c})=>({...c,pixels:pixels.size})),nonAncestorAdjacencies:[...other].sort()};
}
export async function buildBandAtlas({id,baseDirectory,recordFile,cardFile,output}){
 if(fs.existsSync(output))throw Error('New band output required');const record=JSON.parse(fs.readFileSync(recordFile)),card=JSON.parse(fs.readFileSync(cardFile)),base=JSON.parse(fs.readFileSync(path.join(baseDirectory,'binding.json')));
 if(card.recipeHash!==record.recipeHash||base.recordRecipeHash!==record.recipeHash)throw Error('Band record/card binding mismatch');
 const {width:w,height:h}=record.geometry,rgba=new Uint8Array(w*h*4),owner=new Uint8Array(w*h),baseParts=base.parts.filter(p=>p.kind==='part'),sources=new Map();
 for(let k=0;k<baseParts.length;k++){const p=baseParts[k],bytes=fs.readFileSync(path.join(baseDirectory,'parts',p.id+'.png'));sources.set(p.id,bytes);const data=await sharp(bytes).ensureAlpha().raw().toBuffer(),b=p.cutout;
  for(let y=0;y<b.height;y++)for(let x=0;x<b.width;x++){const q=(y*b.width+x)*4;if(!data[q+3])continue;const i=(y+b.y)*w+x+b.x;if(owner[i])throw Error('Overlapping base ownership');owner[i]=k+1;rgba.set(data.subarray(q,q+4),i*4);}
 }
 const built=buildBandPixels({width:w,height:h,owner,rgba,parts:baseParts,record,limits:card.bounds.limitsDeg});
 fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'declaration.json'),JSON.stringify({kind:'band',recordRecipeHash:record.recipeHash,cardHash:await hashJSON(card),floorFraction:.02,capFraction:.125,margin:1.1,cumulativeAngleCapDegrees:90,ink:'opaque descendant pixels only',cuts:built.cuts,nonAncestorAdjacencies:built.nonAncestorAdjacencies},null,2)+'\n');
 if(baseParts.length+built.bands.length>40)throw Error('Band part budget exceeded: '+(baseParts.length+built.bands.length));
 fs.mkdirSync(path.join(output,'parts'));const manifest=[];
 for(const p of baseParts){const b=sources.get(p.id);fs.writeFileSync(path.join(output,'parts',p.id+'.png'),b);manifest.push({name:p.id+'.png',path:'parts/'+p.id+'.png',sha256:await hashBytes(b)});}
 for(const p of built.bands){const b=await sharp(Buffer.from(p.rgba),{raw:{width:p.cutout.width,height:p.cutout.height,channels:4}}).png().toBuffer();fs.writeFileSync(path.join(output,'parts',p.id+'.png'),b);manifest.push({name:p.id+'.png',path:'parts/'+p.id+'.png',sha256:await hashBytes(b)});}
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({creatureId:id,parts:manifest},null,2)+'\n');packRigAtlas(path.join(output,'manifest.json'),path.join(output,'atlas'));
 const atlas=JSON.parse(fs.readFileSync(path.join(output,'atlas',id+'.json'))),atlasBytes=fs.readFileSync(path.join(output,'atlas',id+'.png'));
 const binding={schema:'cf.creature-parts/v1',recordRecipeHash:record.recipeHash,atlasSha256:await hashBytes(atlasBytes),atlasSize:{width:atlas.meta.size.w,height:atlas.meta.size.h},parts:[...built.bands,...baseParts].map(p=>{const f=atlas.frames[p.id+'.png'].frame;return {id:p.id,joint:p.joint,layer:p.layer,kind:p.kind,cutout:p.cutout,frame:{x:f.x,y:f.y,width:f.w,height:f.h}};})};
 fs.writeFileSync(path.join(output,'binding.json'),JSON.stringify({...binding,bindingHash:await hashJSON(binding)},null,2)+'\n');
 const receipt={kind:'band',parts:binding.parts.length,bands:built.bands.length,cuts:built.cuts.length,duplicatedPixels:built.bands.reduce((n,p)=>n+p.pixelCount,0),atlasSize:binding.atlasSize,discPolicy:'disc-only original retained as control; bands replace discs in this candidate',nativeRestGate:'pending'};fs.writeFileSync(path.join(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
}
