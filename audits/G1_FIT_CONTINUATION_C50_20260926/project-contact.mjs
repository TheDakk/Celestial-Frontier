/** Candidate authoring operation: only mismatched contract endpoints move, to observed positive-alpha paint of their declared owner. */
export function projectContactEndpoints(author,observations){
 const out=structuredClone(author),moves=[];
 for(const p of observations){if(p.role!=='end'||(p.actualPart===p.expectedPart&&p.alphaAtPoint>0))continue;
  if(!Object.hasOwn(out.landmarksPx,p.joint)||JSON.stringify(out.landmarksPx[p.joint])!==JSON.stringify(p.point))throw Error('stale endpoint observation');
  if(!Array.isArray(p.nearestOwnedPixel)||p.nearestOwnedPixel.length!==2||p.nearestOwnedPixel.some(x=>!Number.isFinite(x))||!(p.ownedPixels>0))throw Error('declared contact owner has no observed paint');
  out.landmarksPx[p.joint]=p.nearestOwnedPixel.slice();moves.push({joint:p.joint,from:p.point,to:p.nearestOwnedPixel,fromOwner:p.actualPart,toOwner:p.expectedPart,distancePx:p.nearestOwnedDistancePx});
 }
 return {authoring:out,moves};
}
