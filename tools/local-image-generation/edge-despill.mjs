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
