/** Candidate only: follow existing narrow alpha to a clean original donor.
 * No alpha change, no crossing background, no traversal through coloured interior. */
export function findConnectedFringeDonor(rgba,alpha,interior,w,h,x,y,radius=32,keyColor='magenta'){
 if(!['magenta','green'].includes(keyColor))throw Error('Unsupported key color');
 const first=y*w+x;if(!alpha[first]||interior[first])return null;
 const seen=new Set([first]),queue=[first];
 for(let at=0;at<queue.length;at++){
  const i=queue[at],xx=i%w,yy=Math.floor(i/w);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if(!dx&&!dy)continue;const X=xx+dx,Y=yy+dy,j=Y*w+X;
   if(X<0||Y<0||X>=w||Y>=h||(X-x)**2+(Y-y)**2>radius**2||seen.has(j)||!alpha[j])continue;
   seen.add(j);const p=j*4,excess=keyColor==='magenta'?Math.max(0,Math.min(rgba[p],rgba[p+2])-rgba[p+1]):Math.max(0,rgba[p+1]-Math.max(rgba[p],rgba[p+2]));
   if(excess<=8)return p;
   if(!interior[j])queue.push(j);
  }
 }
 return null;
}
