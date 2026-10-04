import { erodeAlpha, pinkExcess } from './kit-contact-math.mjs';

/** One simultaneous colour-only pass on an already keyed copy. Never changes alpha. */
export function despillUnresolvedEdges(rgba, width, height, radius = 32, targetIndices = null) {
  if(rgba.length!==width*height*4 || !Number.isInteger(radius) || radius<1 || radius>64)throw Error('Invalid despill input');
  const alpha=new Uint8Array(width*height);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];
  const interior=erodeAlpha(alpha,width,height,3), out=new Uint8ClampedArray(rgba);
  const targets=[];
  for(let i=0;i<alpha.length;i++)if(alpha[i]>0&&!interior[i]&&pinkExcess(rgba[i*4],rgba[i*4+1],rgba[i*4+2])>8)targets.push(i);
  if(targetIndices!==null){
    const requested=new Set(targetIndices);if(requested.size!==targetIndices.length||targetIndices.some(i=>!targets.includes(i)))throw Error('Invalid targeted edge set');
    for(let i=targets.length-1;i>=0;i--)if(!requested.has(targets[i]))targets.splice(i,1);
  }
  const offsets=[];for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++)if(x||y)offsets.push({x,y,d:x*x+y*y});
  offsets.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);
  const corrected=[],unresolved=[];
  for(const i of targets){
    const x=i%width,y=Math.floor(i/width),p=i*4;
    const neighbour=offsets.find(d=>{const xx=x+d.x,yy=y+d.y;if(xx<0||xx>=width||yy<0||yy>=height)return false;
      const q=(yy*width+xx)*4;return rgba[q+3]===255&&pinkExcess(rgba[q],rgba[q+1],rgba[q+2])<=8;});
    if(!neighbour){unresolved.push(i);continue;}
    const q=((y+neighbour.y)*width+x+neighbour.x)*4;
    for(let c=0;c<3;c++)out[p+c]=rgba[q+c];
    corrected.push({index:i,sourceIndex:q/4});
  }
  return {rgba:out,receipt:{passes:1,radius,targets:targets.length,corrected,unresolved,alphaUnchanged:true}};
}

/** Bounded second intake pass: read neighbours from the input, suppress only
 * magenta-contaminated edge RGB, then erode alpha once. Never cascades samples. */
export function despillThenErode(rgba, width, height, radius = 8) {
  if(rgba.length!==width*height*4 || ![6,7,8].includes(radius))throw Error('Invalid second despill input');
  const alpha=Uint8Array.from({length:width*height},(_,i)=>rgba[i*4+3]);
  const inner=erodeAlpha(alpha,width,height,1), edgeInterior=erodeAlpha(alpha,width,height,3);
  const out=new Uint8ClampedArray(rgba), offsets=[];
  for(let y=-radius;y<=radius;y++)for(let x=-radius;x<=radius;x++)if((x||y)&&x*x+y*y<=radius*radius)offsets.push({x,y,d:x*x+y*y});
  offsets.sort((a,b)=>a.d-b.d||a.y-b.y||a.x-b.x);
  const corrected=[],unresolvedBeforeErode=[];let targets=0;
  for(let i=0;i<alpha.length;i++){
    const p=i*4;
    if(!alpha[i]||edgeInterior[i]===255||pinkExcess(rgba[p],rgba[p+1],rgba[p+2])<=8)continue;
    targets++;const x=i%width,y=Math.floor(i/width);
    const neighbour=offsets.find(d=>{
      const xx=x+d.x,yy=y+d.y;if(xx<0||xx>=width||yy<0||yy>=height)return false;
      const j=yy*width+xx,q=j*4;
      return inner[j]===255&&pinkExcess(rgba[q],rgba[q+1],rgba[q+2])<=8;
    });
    if(!neighbour){unresolvedBeforeErode.push(i);continue;}
    const j=(y+neighbour.y)*width+x+neighbour.x;
    for(let c=0;c<3;c++)out[p+c]=rgba[j*4+c];
    corrected.push({index:i,sourceIndex:j});
  }
  // Applied after colour sampling, including for thin strands without a safe neighbour.
  let erodedPixels=0;for(let i=0;i<alpha.length;i++){out[i*4+3]=inner[i];if(alpha[i]>inner[i])erodedPixels++;}
  const finalInterior=erodeAlpha(inner,width,height,3), unresolved=[];
  for(let i=0;i<alpha.length;i++)if(inner[i]>0&&finalInterior[i]!==255&&pinkExcess(out[i*4],out[i*4+1],out[i*4+2])>8)unresolved.push(i);
  return {rgba:out,receipt:{passes:1,radius,erosionPixels:1,targets,corrected,unresolvedBeforeErode,erodedPixels,unresolved,unresolvedEdgePixels:unresolved.length,order:'simultaneous neighbour RGB suppression, then one-pixel alpha erosion'}};
}
