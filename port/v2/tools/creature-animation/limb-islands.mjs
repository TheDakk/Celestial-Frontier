/** Detached painted islands can pass exact rest and continuous-join tests, yet
 * fly away with the wrong limb. This is an authored-limb diagnostic, not a
 * universal rule for leaves, fur wisps, translucent organisms or hidden views. */
export function inspectLimbIslands(rgba,width,height,{alphaThreshold=128,smallIslandPixels=16}={}){
 if(rgba.length!==width*height*4)throw Error('Limb island dimensions');
 const seen=new Uint8Array(width*height),sizes=[];
 for(let i=0;i<seen.length;i++){
  if(seen[i]||rgba[i*4+3]<alphaThreshold)continue;
  const queue=[i];seen[i]=1;
  for(let k=0;k<queue.length;k++){
   const j=queue[k],x=j%width,y=Math.floor(j/width);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const X=x+dx,Y=y+dy,n=Y*width+X;
    if(X<0||Y<0||X>=width||Y>=height||seen[n]||rgba[n*4+3]<alphaThreshold)continue;
    seen[n]=1;queue.push(n);
   }
  }
  sizes.push(queue.length);
 }
 sizes.sort((a,b)=>b-a);const detached=sizes.slice(1).filter(n=>n>smallIslandPixels);
 return {status:sizes.length&&!detached.length?'PASS':'FAIL',opaqueComponentSizes:sizes,detachedPixels:detached.reduce((a,b)=>a+b,0),alphaThreshold,smallIslandPixels};
}
