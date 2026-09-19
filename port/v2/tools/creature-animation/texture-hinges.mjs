/** Textured swept joints: source ink only, no exposed rigid duplicate silhouette. */
import {createRequire}from'node:module';import {verifyPartsDirectory}from'./verify-parts.mjs';import {hashJSON,GRAPH}from'./quadruped-template.mjs';import {validateSeamBridges}from'./seam-bridge.mjs';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('free-tex-packer-core'))('pngjs');
export function ownedInteriorPixel(edge,part,png){
 const [x,y]=edge.sourcePixel,[[ax,ay],[bx,by]]=edge.edge,nx=ax===bx?(x>=ax?1:-1):0,ny=ay===by?(y>=ay?1:-1):0,b=part.cutout;
 const alpha=(x,y)=>x>=b.x&&y>=b.y&&x<b.x+b.width&&y<b.y+b.height?png.data[((y-b.y)*png.width+x-b.x)*4+3]:0;
 if(alpha(x,y)<=8)throw Error('Hinge source edge has no owned ink');
 let last=[x,y];for(let d=1;d<=Math.floor(edge.sourceDepthPx);d++){const q=[x+nx*d,y+ny*d];if(alpha(...q)<=8)break;last=q;}return last;
}
export async function textureHingeBinding(directory,source,record){
 const verified=await verifyPartsDirectory(directory),binding=structuredClone(source),parts=new Map(binding.parts.map(p=>[p.id,p])),decoded=new Map();let textured=0,flat=0;
 if(binding.atlasSha256!==verified.binding.atlasSha256||binding.recordRecipeHash!==record.recipeHash)throw Error('Hinge source binding mismatch');
 for(const g of binding.seamBridges.groups){g.rigidUnderlap=false;for(const e of g.edges){if(!decoded.has(e.sourcePart))decoded.set(e.sourcePart,PNG.sync.read(verified.sources.get(e.sourcePart)));e.interiorPixel=ownedInteriorPixel(e,parts.get(e.sourcePart),decoded.get(e.sourcePart));if(e.interiorPixel[0]===e.sourcePixel[0]&&e.interiorPixel[1]===e.sourcePixel[1])flat++;else textured++;}}
 const {width:w,height:h}=record.geometry;validateSeamBridges(binding.seamBridges.groups,binding.parts,w,h,binding.atlasSize,['root',...GRAPH.map(([j])=>j)]);
 const {bindingHash,...body}=binding;return{binding:{...body,bindingHash:await hashJSON(body)},receipt:{schema:'cf.textured-hinges/v1',sourceBindingHash:bindingHash,atlasSha256:binding.atlasSha256,texturedEdges:textured,singlePixelEdges:flat,rigidUnderlaps:false,packedPixels:verified.receipt,nativeAccepted:false}};
}
